import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesAPI, customersAPI, productsAPI } from '../../services/api';
import { useForm, useFieldArray } from 'react-hook-form';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface InvoiceItemForm {
  productId: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount?: number;
}

interface InvoiceForm {
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  customerId: string;
  notes?: string;
  items: InvoiceItemForm[];
}

const Invoices: React.FC = () => {
  const queryClient = useQueryClient();
  const [openCreate, setOpenCreate] = useState(false);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => invoicesAPI.getAll(),
    select: (res) => res.data as any[],
  });

  const { data: customers } = useQuery({
    queryKey: ['customers-select'],
    queryFn: () => customersAPI.getAll({ take: 100 }),
    select: (res) => (res.data.items || []) as any[],
  });

  const { data: products } = useQuery({
    queryKey: ['products-select'],
    queryFn: () => productsAPI.getAll({ take: 100 }),
    select: (res) => (res.data.items || []) as any[],
  });

  const { control, register, handleSubmit, reset, /* watch */ } = useForm<InvoiceForm>({
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      items: [
        { productId: '', quantity: 1, unitPrice: 0, taxRate: 18, discount: 0 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const createMutation = useMutation({
    mutationFn: (payload: InvoiceForm) => invoicesAPI.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setOpenCreate(false);
      reset({} as any);
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => invoicesAPI.markAsPaid(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => invoicesAPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });

  const onSubmit = (form: InvoiceForm) => {
    const payload: InvoiceForm = {
      ...form,
      items: form.items.map((it) => ({
        ...it,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
        taxRate: Number(it.taxRate),
        discount: it.discount !== undefined ? Number(it.discount) : 0,
      })),
    };
    createMutation.mutate(payload);
  };

  const rows = useMemo(() => invoices ?? [], [invoices]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600">Create and manage customer invoices with GST compliance.</p>
        </div>
        <button className="btn-primary" onClick={() => { reset({} as any); setOpenCreate(true); }}>New Invoice</button>
      </div>

      <div className="card p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Number</th>
                <th className="table-header">Date</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Subtotal</th>
                <th className="table-header">Tax</th>
                <th className="table-header">Total</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && (<tr><td className="table-cell" colSpan={8}>Loading...</td></tr>)}
              {!isLoading && rows.length === 0 && (<tr><td className="table-cell" colSpan={8}>No invoices found</td></tr>)}
              {rows.map((inv: any) => (
                <tr key={inv.id}>
                  <td className="table-cell">{inv.invoiceNumber}</td>
                  <td className="table-cell">{formatDate(inv.date)}</td>
                  <td className="table-cell">{inv.customer?.name}</td>
                  <td className="table-cell">{formatCurrency(Number(inv.subtotal) || 0)}</td>
                  <td className="table-cell">{formatCurrency(Number(inv.taxAmount) || 0)}</td>
                  <td className="table-cell">{formatCurrency(Number(inv.total) || 0)}</td>
                  <td className="table-cell">
                    <span className={`badge ${inv.status === 'PAID' ? 'badge-success' : inv.status === 'SENT' ? 'badge-info' : 'badge-warning'}`}>{inv.status}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      {inv.status !== 'PAID' && (
                        <button className="btn-primary" onClick={() => markPaidMutation.mutate(inv.id)}>Mark Paid</button>
                      )}
                      <button className="btn-danger" onClick={() => deleteMutation.mutate(inv.id)}>Delete</button>
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
          <div className="card w-full max-w-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">New Invoice</h3>
              <button className="btn-secondary" onClick={() => setOpenCreate(false)}>Close</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700">Invoice Number</label>
                  <input className="input-field mt-1" {...register('invoiceNumber', { required: true })} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Date</label>
                  <input className="input-field mt-1" type="date" {...register('date', { required: true })} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Due Date</label>
                  <input className="input-field mt-1" type="date" {...register('dueDate')} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Customer</label>
                  <select className="input-field mt-1" {...register('customerId', { required: true })}>
                    <option value="">Select customer</option>
                    {customers?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-700">Notes</label>
                  <input className="input-field mt-1" {...register('notes')} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Items</h4>
                  <button type="button" className="btn-secondary" onClick={() => append({ productId: '', quantity: 1, unitPrice: 0, taxRate: 18, discount: 0 })}>Add Item</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="table-header">Product</th>
                        <th className="table-header">Qty</th>
                        <th className="table-header">Unit Price</th>
                        <th className="table-header">Tax %</th>
                        <th className="table-header">Discount</th>
                        <th className="table-header"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fields.map((field, idx) => (
                        <tr key={field.id}>
                          <td className="table-cell">
                            <select className="input-field" {...register(`items.${idx}.productId` as const, { required: true })}>
                              <option value="">Select product</option>
                              {products?.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                              ))}
                            </select>
                          </td>
                          <td className="table-cell">
                            <input className="input-field" type="number" step="1" {...register(`items.${idx}.quantity` as const, { valueAsNumber: true, required: true })} />
                          </td>
                          <td className="table-cell">
                            <input className="input-field" type="number" step="0.01" {...register(`items.${idx}.unitPrice` as const, { valueAsNumber: true, required: true })} />
                          </td>
                          <td className="table-cell">
                            <input className="input-field" type="number" step="0.01" {...register(`items.${idx}.taxRate` as const, { valueAsNumber: true, required: true })} />
                          </td>
                          <td className="table-cell">
                            <input className="input-field" type="number" step="0.01" {...register(`items.${idx}.discount` as const, { valueAsNumber: true })} />
                          </td>
                          <td className="table-cell">
                            <button type="button" className="btn-danger" onClick={() => remove(idx)}>Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setOpenCreate(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
