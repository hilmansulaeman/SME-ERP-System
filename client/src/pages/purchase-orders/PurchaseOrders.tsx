import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseOrdersAPI, suppliersAPI, productsAPI } from '../../services/api';
import { useForm, useFieldArray } from 'react-hook-form';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface POItemForm {
  productId: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

interface POForm {
  poNumber: string;
  date: string;
  expectedDate?: string;
  supplierId: string;
  notes?: string;
  items: POItemForm[];
}

const PurchaseOrders: React.FC = () => {
  const queryClient = useQueryClient();
  const [openCreate, setOpenCreate] = useState(false);

  const { data: pos, isLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => purchaseOrdersAPI.getAll(),
    select: (res) => res.data as any[],
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-select'],
    queryFn: () => suppliersAPI.getAll({ take: 100 }),
    select: (res) => (res.data.items || []) as any[],
  });

  const { data: products } = useQuery({
    queryKey: ['products-select'],
    queryFn: () => productsAPI.getAll({ take: 100 }),
    select: (res) => (res.data.items || []) as any[],
  });

  const { control, register, handleSubmit, reset } = useForm<POForm>({
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      items: [
        { productId: '', quantity: 1, unitPrice: 0, taxRate: 18 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const createMutation = useMutation({
    mutationFn: (payload: POForm) => purchaseOrdersAPI.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      setOpenCreate(false);
      reset({} as any);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => purchaseOrdersAPI.confirm(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase-orders'] }),
  });

  const receiveMutation = useMutation({
    mutationFn: (id: string) => purchaseOrdersAPI.receive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase-orders'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => purchaseOrdersAPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase-orders'] }),
  });

  const onSubmit = (form: POForm) => {
    const payload: POForm = {
      ...form,
      items: form.items.map((it) => ({
        ...it,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
        taxRate: Number(it.taxRate),
      })),
    };
    createMutation.mutate(payload);
  };

  const rows = useMemo(() => pos ?? [], [pos]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-600">Manage purchase orders and supplier relationships.</p>
        </div>
        <button className="btn-primary" onClick={() => { reset({} as any); setOpenCreate(true); }}>New PO</button>
      </div>

      <div className="card p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">PO Number</th>
                <th className="table-header">Date</th>
                <th className="table-header">Supplier</th>
                <th className="table-header">Subtotal</th>
                <th className="table-header">Tax</th>
                <th className="table-header">Total</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && (<tr><td className="table-cell" colSpan={8}>Loading...</td></tr>)}
              {!isLoading && rows.length === 0 && (<tr><td className="table-cell" colSpan={8}>No purchase orders found</td></tr>)}
              {rows.map((po: any) => (
                <tr key={po.id}>
                  <td className="table-cell">{po.poNumber}</td>
                  <td className="table-cell">{formatDate(po.date)}</td>
                  <td className="table-cell">{po.supplier?.name}</td>
                  <td className="table-cell">{formatCurrency(Number(po.subtotal) || 0)}</td>
                  <td className="table-cell">{formatCurrency(Number(po.taxAmount) || 0)}</td>
                  <td className="table-cell">{formatCurrency(Number(po.total) || 0)}</td>
                  <td className="table-cell">
                    <span className={`badge ${po.status === 'RECEIVED' ? 'badge-success' : po.status === 'CONFIRMED' ? 'badge-info' : 'badge-warning'}`}>{po.status}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      {po.status === 'SENT' && (
                        <button className="btn-secondary" onClick={() => confirmMutation.mutate(po.id)}>Confirm</button>
                      )}
                      {po.status === 'CONFIRMED' && (
                        <button className="btn-primary" onClick={() => receiveMutation.mutate(po.id)}>Receive</button>
                      )}
                      <button className="btn-danger" onClick={() => deleteMutation.mutate(po.id)}>Delete</button>
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
              <h3 className="text-lg font-semibold">New Purchase Order</h3>
              <button className="btn-secondary" onClick={() => setOpenCreate(false)}>Close</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700">PO Number</label>
                  <input className="input-field mt-1" {...register('poNumber', { required: true })} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Date</label>
                  <input className="input-field mt-1" type="date" {...register('date', { required: true })} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Expected Date</label>
                  <input className="input-field mt-1" type="date" {...register('expectedDate')} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Supplier</label>
                  <select className="input-field mt-1" {...register('supplierId', { required: true })}>
                    <option value="">Select supplier</option>
                    {suppliers?.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
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
                  <button type="button" className="btn-secondary" onClick={() => append({ productId: '', quantity: 1, unitPrice: 0, taxRate: 18 })}>Add Item</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="table-header">Product</th>
                        <th className="table-header">Qty</th>
                        <th className="table-header">Unit Price</th>
                        <th className="table-header">Tax %</th>
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
                <button type="submit" className="btn-primary">Create PO</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
