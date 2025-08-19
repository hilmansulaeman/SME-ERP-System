import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsAPI } from '../../services/api';
import { useForm } from 'react-hook-form';

interface ProductForm {
  id?: string;
  name: string;
  sku: string;
  description?: string;
  categoryId?: string;
  unit?: string;
  price: number;
  costPrice: number;
  gstRate?: number;
  minStock?: number;
  maxStock?: number;
}

const Products: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<ProductForm | null>(null);
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => productsAPI.getAll({ q: search, take: 50 }),
    select: (res) => res.data as { items: ProductForm[]; total: number },
  });

  const { register, handleSubmit, reset } = useForm<ProductForm>();

  const createMutation = useMutation({
    mutationFn: (payload: ProductForm) => productsAPI.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setOpen(false);
      reset({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: ProductForm) => productsAPI.update(payload.id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setOpen(false);
      setEditing(null);
      reset({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const startCreate = () => { setEditing(null); reset({}); setOpen(true); };
  const startEdit = (row: ProductForm) => { setEditing(row); reset(row); setOpen(true); };

  const onSubmit = (form: ProductForm) => {
    const payload: ProductForm = {
      ...form,
      price: Number(form.price),
      costPrice: Number(form.costPrice),
      gstRate: form.gstRate !== undefined ? Number(form.gstRate) : undefined,
      minStock: form.minStock !== undefined ? Number(form.minStock) : undefined,
      maxStock: form.maxStock !== undefined ? Number(form.maxStock) : undefined,
    };
    if (editing?.id) updateMutation.mutate({ ...payload, id: editing.id });
    else createMutation.mutate(payload);
  };

  const rows = useMemo(() => data?.items ?? [], [data]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product catalog and pricing.</p>
        </div>
        <button onClick={startCreate} className="btn-primary">Add Product</button>
      </div>

      <div className="card p-4">
        <div className="flex gap-3 items-center mb-4">
          <input
            className="input-field max-w-sm"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">SKU</th>
                <th className="table-header">Price</th>
                <th className="table-header">Cost</th>
                <th className="table-header">GST %</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && (<tr><td className="table-cell" colSpan={6}>Loading...</td></tr>)}
              {!isLoading && rows.length === 0 && (<tr><td className="table-cell" colSpan={6}>No products found</td></tr>)}
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="table-cell">{p.name}</td>
                  <td className="table-cell">{p.sku}</td>
                  <td className="table-cell">{Number(p.price).toFixed(2)}</td>
                  <td className="table-cell">{Number(p.costPrice).toFixed(2)}</td>
                  <td className="table-cell">{p.gstRate ?? 0}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button className="btn-secondary" onClick={() => startEdit(p)}>Edit</button>
                      <button className="btn-danger" onClick={() => p.id && deleteMutation.mutate(p.id)}>Delete</button>
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
              <h3 className="text-lg font-semibold">{editing ? 'Edit Product' : 'Add Product'}</h3>
              <button className="btn-secondary" onClick={() => { setOpen(false); setEditing(null); }}>Close</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700">Name</label>
                <input className="input-field mt-1" {...register('name', { required: true })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">SKU</label>
                <input className="input-field mt-1" {...register('sku', { required: true })} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-700">Description</label>
                <input className="input-field mt-1" {...register('description')} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Unit</label>
                <input className="input-field mt-1" placeholder="PCS" {...register('unit')} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Price</label>
                <input className="input-field mt-1" type="number" step="0.01" {...register('price', { valueAsNumber: true, required: true })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Cost</label>
                <input className="input-field mt-1" type="number" step="0.01" {...register('costPrice', { valueAsNumber: true, required: true })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">GST %</label>
                <input className="input-field mt-1" type="number" step="0.01" {...register('gstRate', { valueAsNumber: true })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Min Stock</label>
                <input className="input-field mt-1" type="number" {...register('minStock', { valueAsNumber: true })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Max Stock</label>
                <input className="input-field mt-1" type="number" {...register('maxStock', { valueAsNumber: true })} />
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

export default Products;
