import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollAPI, employeesAPI } from '../../services/api';
import { useForm } from 'react-hook-form';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface PayrollForm {
  id?: string;
  employeeId: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances?: number;
  deductions?: number;
}

const Payroll: React.FC = () => {
  const queryClient = useQueryClient();
  const [openCreate, setOpenCreate] = useState(false);

  const { data: payrolls, isLoading } = useQuery({
    queryKey: ['payrolls'],
    queryFn: () => payrollAPI.getAll(),
    select: (res) => res.data as any[],
  });

  const { data: employees } = useQuery({
    queryKey: ['employees-select'],
    queryFn: () => employeesAPI.getAll({ take: 200 }),
    select: (res) => res.data as any[],
  });

  const { register, handleSubmit, reset } = useForm<PayrollForm>({
    defaultValues: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      allowances: 0,
      deductions: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: PayrollForm) => payrollAPI.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
      setOpenCreate(false);
      reset({} as any);
    },
  });

  const processMutation = useMutation({
    mutationFn: (id: string) => payrollAPI.process(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payrolls'] }),
  });

  const payMutation = useMutation({
    mutationFn: (id: string) => payrollAPI.pay(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payrolls'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => payrollAPI.update(id, { status: 'CANCELLED' } as any),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payrolls'] }),
  });

  const onSubmit = (form: PayrollForm) => {
    const payload: PayrollForm = {
      ...form,
      month: Number(form.month),
      year: Number(form.year),
      basicSalary: Number(form.basicSalary),
      allowances: form.allowances !== undefined ? Number(form.allowances) : 0,
      deductions: form.deductions !== undefined ? Number(form.deductions) : 0,
    };
    createMutation.mutate(payload);
  };

  const rows = useMemo(() => payrolls ?? [], [payrolls]);

  const monthName = (m: number) => new Date(2000, m - 1, 1).toLocaleString('en', { month: 'short' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
          <p className="text-gray-600">Process salaries and manage statutory compliance.</p>
        </div>
        <button className="btn-primary" onClick={() => { reset({} as any); setOpenCreate(true); }}>New Payroll</button>
      </div>

      <div className="card p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Employee</th>
                <th className="table-header">Period</th>
                <th className="table-header">Basic</th>
                <th className="table-header">Allowances</th>
                <th className="table-header">Deductions</th>
                <th className="table-header">Net</th>
                <th className="table-header">Status</th>
                <th className="table-header">Paid Date</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && (<tr><td className="table-cell" colSpan={9}>Loading...</td></tr>)}
              {!isLoading && rows.length === 0 && (<tr><td className="table-cell" colSpan={9}>No payrolls found</td></tr>)}
              {rows.map((p: any) => (
                <tr key={p.id}>
                  <td className="table-cell">{p.employee?.firstName} {p.employee?.lastName}</td>
                  <td className="table-cell">{monthName(p.month)} {p.year}</td>
                  <td className="table-cell">{formatCurrency(Number(p.basicSalary) || 0)}</td>
                  <td className="table-cell">{formatCurrency(Number(p.allowances) || 0)}</td>
                  <td className="table-cell">{formatCurrency(Number(p.deductions) || 0)}</td>
                  <td className="table-cell">{formatCurrency(Number(p.netSalary) || 0)}</td>
                  <td className="table-cell">
                    <span className={`badge ${p.status === 'PAID' ? 'badge-success' : p.status === 'PROCESSED' ? 'badge-info' : p.status === 'PENDING' ? 'badge-warning' : 'badge-error'}`}>{p.status}</span>
                  </td>
                  <td className="table-cell">{p.paidDate ? formatDate(p.paidDate) : '-'}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      {p.status === 'PENDING' && (
                        <button className="btn-secondary" onClick={() => processMutation.mutate(p.id)}>Process</button>
                      )}
                      {p.status === 'PROCESSED' && (
                        <button className="btn-primary" onClick={() => payMutation.mutate(p.id)}>Pay</button>
                      )}
                      {p.status !== 'PAID' && (
                        <button className="btn-danger" onClick={() => deleteMutation.mutate(p.id)}>Cancel</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {openCreate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="card w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">New Payroll</h3>
              <button className="btn-secondary" onClick={() => setOpenCreate(false)}>Close</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm text-gray-700">Employee</label>
                <select className="input-field mt-1" {...register('employeeId', { required: true })}>
                  <option value="">Select employee</option>
                  {employees?.map((e: any) => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700">Month</label>
                <input className="input-field mt-1" type="number" min={1} max={12} {...register('month', { valueAsNumber: true, required: true })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Year</label>
                <input className="input-field mt-1" type="number" min={2000} max={3000} {...register('year', { valueAsNumber: true, required: true })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Basic Salary</label>
                <input className="input-field mt-1" type="number" step="0.01" {...register('basicSalary', { valueAsNumber: true, required: true })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Allowances</label>
                <input className="input-field mt-1" type="number" step="0.01" {...register('allowances', { valueAsNumber: true })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Deductions</label>
                <input className="input-field mt-1" type="number" step="0.01" {...register('deductions', { valueAsNumber: true })} />
              </div>
              <div className="col-span-2 flex justify-end gap-2 mt-2">
                <button type="button" className="btn-secondary" onClick={() => setOpenCreate(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Payroll</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
