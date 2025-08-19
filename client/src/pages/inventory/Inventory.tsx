import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryAPI } from '../../services/api';
import { useForm } from 'react-hook-form';

interface WarehouseForm {
  id?: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface StockItem {
  id: string;
  quantity: number;
  reserved: number;
  available: number;
  product: { id: string; name: string; sku: string };
  warehouse: { id: string; name: string };
}

const Inventory: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'stock' | 'warehouses'>('stock');
  const [openEditStock, setOpenEditStock] = useState<StockItem | null>(null);

  // Warehouses
  const whQuery = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryAPI.getWarehouses(),
    select: (res) => res.data as WarehouseForm[],
  });

  const { register: registerWh, handleSubmit: handleSubmitWh, reset: resetWh } = useForm<WarehouseForm>();

  const createWarehouseMutation = useMutation({
    mutationFn: (payload: WarehouseForm) => inventoryAPI.createWarehouse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      resetWh({} as any);
    },
  });

  const onCreateWarehouse = (form: WarehouseForm) => {
    createWarehouseMutation.mutate(form);
  };

  // Stock
  const stockQuery = useQuery({
    queryKey: ['stock'],
    queryFn: () => inventoryAPI.getStock(),
    select: (res) => res.data as StockItem[],
  });

  const { register: registerStock, handleSubmit: handleSubmitStock, reset: resetStock } = useForm<Partial<StockItem>>();

  const updateStockMutation = useMutation({
    mutationFn: (payload: { id: string; data: Partial<StockItem> }) => inventoryAPI.updateStock(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      setOpenEditStock(null);
      resetStock({});
    },
  });

  const startEditStock = (row: StockItem) => {
    setOpenEditStock(row);
    resetStock({ quantity: row.quantity, reserved: row.reserved, available: row.available });
  };

  const onUpdateStock = (form: Partial<StockItem>) => {
    if (!openEditStock) return;
    const data: Partial<StockItem> = {
      quantity: form.quantity !== undefined ? Number(form.quantity) : undefined,
      reserved: form.reserved !== undefined ? Number(form.reserved) : undefined,
      available: form.available !== undefined ? Number(form.available) : undefined,
    };
    updateStockMutation.mutate({ id: openEditStock.id, data });
  };

  const warehouses = useMemo(() => whQuery.data ?? [], [whQuery.data]);
  const stock = useMemo(() => stockQuery.data ?? [], [stockQuery.data]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600">Track stock levels and manage warehouses.</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex gap-2 mb-4">
          <button
            className={`px-4 py-2 rounded-lg ${activeTab === 'stock' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-900'}`}
            onClick={() => setActiveTab('stock')}
          >Stock</button>
          <button
            className={`px-4 py-2 rounded-lg ${activeTab === 'warehouses' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-900'}`}
            onClick={() => setActiveTab('warehouses')}
          >Warehouses</button>
        </div>

        {activeTab === 'warehouses' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Existing Warehouses</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="table-header">Name</th>
                      <th className="table-header">City</th>
                      <th className="table-header">State</th>
                      <th className="table-header">Country</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {whQuery.isLoading && (<tr><td className="table-cell" colSpan={4}>Loading...</td></tr>)}
                    {!whQuery.isLoading && warehouses.length === 0 && (<tr><td className="table-cell" colSpan={4}>No warehouses found</td></tr>)}
                    {warehouses.map((w) => (
                      <tr key={w.id}>
                        <td className="table-cell">{w.name}</td>
                        <td className="table-cell">{w.city || '-'}</td>
                        <td className="table-cell">{w.state || '-'}</td>
                        <td className="table-cell">{w.country || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Add Warehouse</h3>
              <form onSubmit={handleSubmitWh(onCreateWarehouse)} className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-gray-700">Name</label>
                  <input className="input-field mt-1" {...registerWh('name', { required: true })} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-700">Address</label>
                  <input className="input-field mt-1" {...registerWh('address')} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">City</label>
                  <input className="input-field mt-1" {...registerWh('city')} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">State</label>
                  <input className="input-field mt-1" {...registerWh('state')} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Country</label>
                  <input className="input-field mt-1" {...registerWh('country')} />
                </div>
                <div className="col-span-2 flex justify-end gap-2 mt-2">
                  <button type="submit" className="btn-primary">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'stock' && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Stock Levels</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header">Product</th>
                    <th className="table-header">SKU</th>
                    <th className="table-header">Warehouse</th>
                    <th className="table-header">Quantity</th>
                    <th className="table-header">Reserved</th>
                    <th className="table-header">Available</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stockQuery.isLoading && (<tr><td className="table-cell" colSpan={7}>Loading...</td></tr>)}
                  {!stockQuery.isLoading && stock.length === 0 && (<tr><td className="table-cell" colSpan={7}>No stock records found</td></tr>)}
                  {stock.map((s) => (
                    <tr key={s.id}>
                      <td className="table-cell">{s.product?.name}</td>
                      <td className="table-cell">{s.product?.sku}</td>
                      <td className="table-cell">{s.warehouse?.name}</td>
                      <td className="table-cell">{s.quantity}</td>
                      <td className="table-cell">{s.reserved}</td>
                      <td className="table-cell">{s.available}</td>
                      <td className="table-cell">
                        <button className="btn-secondary" onClick={() => startEditStock(s)}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {openEditStock && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="card w-full max-w-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Stock - {openEditStock.product.name} ({openEditStock.warehouse.name})</h3>
              <button className="btn-secondary" onClick={() => setOpenEditStock(null)}>Close</button>
            </div>
            <form onSubmit={handleSubmitStock(onUpdateStock)} className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700">Quantity</label>
                <input className="input-field mt-1" type="number" {...registerStock('quantity', { valueAsNumber: true })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Reserved</label>
                <input className="input-field mt-1" type="number" {...registerStock('reserved', { valueAsNumber: true })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Available</label>
                <input className="input-field mt-1" type="number" {...registerStock('available', { valueAsNumber: true })} />
              </div>
              <div className="col-span-3 flex justify-end gap-2 mt-2">
                <button type="button" className="btn-secondary" onClick={() => setOpenEditStock(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
