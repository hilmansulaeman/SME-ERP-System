import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../services/api';
import {
  UsersIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ShoppingCartIcon,
  // CurrencyDollarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency } from '../utils/formatters';

const Dashboard: React.FC = () => {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: dashboardAPI.getOverview,
    select: (response) => response.data,
  });

  const { data: salesData } = useQuery({
    queryKey: ['dashboard-sales'],
    queryFn: () => dashboardAPI.getSales('month'),
    select: (response) => response.data,
  });

  const { data: inventoryData } = useQuery({
    queryKey: ['dashboard-inventory'],
    queryFn: dashboardAPI.getInventory,
    select: (response) => response.data,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Customers',
      value: overview?.overview?.totalCustomers || 0,
      icon: UsersIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Suppliers',
      value: overview?.overview?.totalSuppliers || 0,
      icon: BuildingStorefrontIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Total Products',
      value: overview?.overview?.totalProducts || 0,
      icon: CubeIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Total Employees',
      value: overview?.overview?.totalEmployees || 0,
      icon: UserGroupIcon,
      color: 'bg-orange-500',
    },
    {
      name: 'Total Invoices',
      value: overview?.overview?.totalInvoices || 0,
      icon: DocumentTextIcon,
      color: 'bg-indigo-500',
    },
    {
      name: 'Purchase Orders',
      value: overview?.overview?.totalPurchaseOrders || 0,
      icon: ShoppingCartIcon,
      color: 'bg-pink-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your business.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.name} className="card p-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${stat.color} rounded-lg p-3`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Monthly Revenue</span>
              <span className="text-lg font-semibold text-success-600">
                {formatCurrency(overview?.overview?.monthlyRevenue || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Monthly Expenses</span>
              <span className="text-lg font-semibold text-error-600">
                {formatCurrency(overview?.overview?.monthlyExpenses || 0)}
              </span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-medium">Net Profit</span>
                <span className={`text-lg font-semibold ${
                  (overview?.overview?.monthlyRevenue || 0) - (overview?.overview?.monthlyExpenses || 0) >= 0
                    ? 'text-success-600'
                    : 'text-error-600'
                }`}>
                  {formatCurrency(
                    (overview?.overview?.monthlyRevenue || 0) - (overview?.overview?.monthlyExpenses || 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Customers</h3>
          <div className="space-y-3">
            {salesData?.topCustomers?.slice(0, 5).map((customer: any, index: number) => (
              <div key={customer.customerId} className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                  <span className="text-sm text-gray-900">{customer.customerName}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(customer.totalSales)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {overview?.recentTransactions?.slice(0, 5).map((transaction: any) => (
              <div key={transaction.id} className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                  <p className="text-xs text-gray-500">{transaction.account?.name}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    transaction.type === 'DEBIT' ? 'text-success-600' : 'text-error-600'
                  }`}>
                    {transaction.type === 'DEBIT' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Invoices</h3>
          <div className="space-y-3">
            {overview?.pendingInvoices?.slice(0, 5).map((invoice: any) => (
              <div key={invoice.id} className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</p>
                  <p className="text-xs text-gray-500">{invoice.customer?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(invoice.total)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {inventoryData?.lowStockAlerts && inventoryData.lowStockAlerts.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="h-5 w-5 text-warning-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Low Stock Alerts</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inventoryData.lowStockAlerts.slice(0, 6).map((product: any) => (
              <div key={product.id} className="border border-warning-200 rounded-lg p-4 bg-warning-50">
                <p className="text-sm font-medium text-gray-900">{product.name}</p>
                <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                <div className="mt-2 space-y-1">
                  {product.stocks.map((stock: any) => (
                    <div key={stock.id} className="flex justify-between text-xs">
                      <span className="text-gray-600">{stock.warehouse.name}</span>
                      <span className="font-medium text-warning-600">
                        {stock.available} available
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Selling Products */}
      {inventoryData?.topSellingProducts && inventoryData.topSellingProducts.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Selling Products</h3>
          <div className="space-y-3">
            {inventoryData.topSellingProducts.slice(0, 5).map((product: any, index: number) => (
              <div key={product.productId} className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.productName}</p>
                    <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {product.totalQuantity} units
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(product.totalRevenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
