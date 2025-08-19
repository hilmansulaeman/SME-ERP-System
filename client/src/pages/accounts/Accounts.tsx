import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsAPI } from '../../services/api';
import { useForm } from 'react-hook-form';

type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

interface AccountForm {
  id?: string;
  code: string;
  name: string;
  type: AccountType;
  parentId?: string;
}

const Accounts: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<AccountForm | null>(null);
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsAPI.getAll(),
    select: (res) => res.data as any[],
  });

  const { register, handleSubmit, reset } = useForm<AccountForm>({
    defaultValues: { type: 'ASSET' },
  });

  const createMutation = useMutation({
    mutationFn: (payload: AccountForm) => accountsAPI.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setOpen(false);
      reset({} as any);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: AccountForm) => accountsAPI.update(payload.id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setOpen(false);
      setEditing(null);
      reset({} as any);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => accountsAPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  });

  const startCreate = () => { setEditing(null); reset({ type: 'ASSET' } as any); setOpen(true); };
  const startEdit = (row: AccountForm) => { setEditing(row); reset(row); setOpen(true); };

  const onSubmit = (form: AccountForm) => {
    if (editing?.id) updateMutation.mutate({ ...form, id: editing.id });
    else createMutation.mutate(form);
  };

  const rows = useMemo(() => {
    const items = data ?? [];
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((a: any) => a.code?.toLowerCase().includes(q) || a.name?.toLowerCase().includes(q));
  }, [data, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
          <p className="text-gray-600">Manage your accounts structure for financial reporting.</p>
        </div>
        <button onClick={startCreate} className="btn-primary">Add Account</button>
      </div>

      <div className="card p-4">
        <div className="flex gap-3 items-center mb-4">
          <input
            className="input-field max-w-sm"
            placeholder="Search by code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Code</th>
                <th className="table-header">Name</th>
                <th className="table-header">Type</th>
                <th className="table-header">Parent</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && (<tr><td className="table-cell" colSpan={5}>Loading...</td></tr>)}
              {!isLoading && rows.length === 0 && (<tr><td className="table-cell" colSpan={5}>No accounts found</td></tr>)}
              {rows.map((a: any) => (
                <tr key={a.id}>
                  <td className="table-cell">{a.code}</td>
                  <td className="table-cell">{a.name}</td>
                  <td className="table-cell">{a.type}</td>
                  <td className="table-cell">{(data || []).find((x: any) => x.id === a.parentId)?.name || '-'}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button className="btn-secondary" onClick={() => startEdit(a)}>Edit</button>
                      <button className="btn-danger" onClick={() => a.id && deleteMutation.mutate(a.id)}>Delete</button>
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
              <h3 className="text-lg font-semibold">{editing ? 'Edit Account' : 'Add Account'}</h3>
              <button className="btn-secondary" onClick={() => { setOpen(false); setEditing(null); }}>Close</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700">Code</label>
                <input className="input-field mt-1" {...register('code', { required: true })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Name</label>
                <input className="input-field mt-1" {...register('name', { required: true })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Type</label>
                <select className="input-field mt-1" {...register('type', { required: true })}>
                  <option value="ASSET">ASSET</option>
                  <option value="LIABILITY">LIABILITY</option>
                  <option value="EQUITY">EQUITY</option>
                  <option value="REVENUE">REVENUE</option>
                  <option value="EXPENSE">EXPENSE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700">Parent Account</label>
                <select className="input-field mt-1" {...register('parentId')}>
                  <option value="">None</option>
                  {(data || []).map((p: any) => (
                    <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                  ))}
                </select>
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

export default Accounts;
