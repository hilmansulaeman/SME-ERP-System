import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersAPI } from '../../services/api';
import { useForm } from 'react-hook-form';

interface SupplierForm {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  gstNumber?: string;
}

const Suppliers: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<SupplierForm | null>(null);
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', search],
    queryFn: () => suppliersAPI.getAll({ q: search, take: 50 }),
    select: (res) => res.data as { items: SupplierForm[]; total: number },
  });

  const { register, handleSubmit, reset } = useForm<SupplierForm>();

  const createMutation = useMutation({
    mutationFn: (payload: SupplierForm) => suppliersAPI.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setOpen(false);
      reset({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: SupplierForm) => suppliersAPI.update(payload.id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setOpen(false);
      setEditing(null);
      reset({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => suppliersAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });

  const startCreate = () => { setEditing(null); reset({}); setOpen(true); };
  const startEdit = (row: SupplierForm) => { setEditing(row); reset(row); setOpen(true); };

  const onSubmit = (form: SupplierForm) => {
    if (editing?.id) updateMutation.mutate({ ...form, id: editing.id });
    else createMutation.mutate(form);
  };

  const rows = useMemo(() => data?.items ?? [], [data]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600">Manage your supplier relationships and procurement.</p>
        </div>
        <button onClick={startCreate} className="btn-primary">Add Supplier</button>
      </div>

      <div className="card p-4">
        <div className="flex gap-3 items-center mb-4">
          <input
            className="input-field max-w-sm"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Phone</th>
                <th className="table-header">GST</th>
                <th className="table-header">City</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && (<tr><td className="table-cell" colSpan={6}>Loading...</td></tr>)}
              {!isLoading && rows.length === 0 && (<tr><td className="table-cell" colSpan={6}>No suppliers found</td></tr>)}
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="table-cell">{c.name}</td>
                  <td className="table-cell">{c.email || '-'}</td>
                  <td className="table-cell">{c.phone || '-'}</td>
                  <td className="table-cell">{c.gstNumber || '-'}</td>
                  <td className="table-cell">{c.city || '-'}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button className="btn-secondary" onClick={() => startEdit(c)}>Edit</button>
                      <button className="btn-danger" onClick={() => c.id && deleteMutation.mutate(c.id)}>Delete</button>
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
          <div className="card w-full max-w-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editing ? 'Edit Supplier' : 'Add Supplier'}</h3>
              <button className="btn-secondary" onClick={() => { setOpen(false); setEditing(null); }}>Close</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm text-gray-700">Name</label>
                <input className="input-field mt-1" {...register('name', { required: true })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Email</label>
                <input className="input-field mt-1" type="email" {...register('email')} />
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
                <label className="block text-sm text-gray-700">GST Number</label>
                <input className="input-field mt-1" {...register('gstNumber')} />
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

export default Suppliers;
