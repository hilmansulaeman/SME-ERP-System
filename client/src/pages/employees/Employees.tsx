import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesAPI } from '../../services/api';
import { useForm } from 'react-hook-form';

interface EmployeeForm {
  id?: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  dateOfBirth?: string;
  dateOfJoining: string;
  department?: string;
  designation?: string;
  salary: number;
}

const Employees: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<EmployeeForm | null>(null);
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['employees', search],
    queryFn: () => employeesAPI.getAll({ q: search, take: 50 }),
    select: (res) => res.data as EmployeeForm[],
  });

  const { register, handleSubmit, reset } = useForm<EmployeeForm>();

  const createMutation = useMutation({
    mutationFn: (payload: EmployeeForm) => employeesAPI.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setOpen(false);
      reset({} as any);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: EmployeeForm) => employeesAPI.update(payload.id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setOpen(false);
      setEditing(null);
      reset({} as any);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const startCreate = () => { setEditing(null); reset({} as any); setOpen(true); };
  const startEdit = (row: EmployeeForm) => { setEditing(row); reset(row); setOpen(true); };

  const onSubmit = (form: EmployeeForm) => {
    const payload = {
      ...form,
      salary: Number(form.salary),
    };
    if (editing?.id) updateMutation.mutate({ ...payload, id: editing.id });
    else createMutation.mutate(payload as any);
  };

  const rows = useMemo(() => data ?? [], [data]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600">Manage employee information and HR records.</p>
        </div>
        <button onClick={startCreate} className="btn-primary">Add Employee</button>
      </div>

      <div className="card p-4">
        <div className="flex gap-3 items-center mb-4">
          <input
            className="input-field max-w-sm"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Employee ID</th>
                <th className="table-header">Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Department</th>
                <th className="table-header">Salary</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && (<tr><td className="table-cell" colSpan={6}>Loading...</td></tr>)}
              {!isLoading && rows.length === 0 && (<tr><td className="table-cell" colSpan={6}>No employees found</td></tr>)}
              {rows.map((e) => (
                <tr key={e.id}>
                  <td className="table-cell">{e.employeeId}</td>
                  <td className="table-cell">{e.firstName} {e.lastName}</td>
                  <td className="table-cell">{e.email}</td>
                  <td className="table-cell">{e.department || '-'}</td>
                  <td className="table-cell">{Number(e.salary).toFixed(2)}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button className="btn-secondary" onClick={() => startEdit(e)}>Edit</button>
                      <button className="btn-danger" onClick={() => e.id && deleteMutation.mutate(e.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="card w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editing ? 'Edit Employee' : 'Add Employee'}</h3>
              <button className="btn-secondary" onClick={() => { setOpen(false); setEditing(null); }}>Close</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700">Employee ID</label>
                <input className="input-field mt-1" {...register('employeeId', { required: true })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">First Name</label>
                <input className="input-field mt-1" {...register('firstName', { required: true })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Last Name</label>
                <input className="input-field mt-1" {...register('lastName', { required: true })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Email</label>
                <input className="input-field mt-1" type="email" {...register('email', { required: true })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Phone</label>
                <input className="input-field mt-1" {...register('phone')} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-700">Address</label>
                <input className="input-field mt-1" {...register('address')} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">City</label>
                <input className="input-field mt-1" {...register('city')} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">State</label>
                <input className="input-field mt-1" {...register('state')} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Country</label>
                <input className="input-field mt-1" {...register('country')} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Postal Code</label>
                <input className="input-field mt-1" {...register('postalCode')} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Date of Birth</label>
                <input className="input-field mt-1" type="date" {...register('dateOfBirth')} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Date of Joining</label>
                <input className="input-field mt-1" type="date" {...register('dateOfJoining', { required: true })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Department</label>
                <input className="input-field mt-1" {...register('department')} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Designation</label>
                <input className="input-field mt-1" {...register('designation')} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Salary</label>
                <input className="input-field mt-1" type="number" step="0.01" {...register('salary', { valueAsNumber: true, required: true })} />
              </div>
              <div className="col-span-2 flex justify-end gap-2 mt-2">
                <button type="button" className="btn-secondary" onClick={() => { setOpen(false); setEditing(null); }}>Cancel</button>
                <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
