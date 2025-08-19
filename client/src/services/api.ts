import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

// Use explicit URL if provided, otherwise rely on CRA proxy with relative "/api"
const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://sme-erp.vercel.app/api' : '/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateCompanyProfileRequest {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName: string;
    role?: string;
  }) => api.post('/auth/register', userData),
  
  getCurrentUser: () => api.get('/auth/me'),
  
  changePassword: (passwords: ChangePasswordRequest) =>
    api.post('/auth/change-password', passwords),
};

// Companies API
export const companiesAPI = {
  getCompanyProfile: () => api.get('/companies/profile'),
  updateCompanyProfile: (data: UpdateCompanyProfileRequest) =>
    api.put('/companies/profile', data),
};

// Dashboard API
export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview'),
  getSales: (period?: string) => api.get(`/dashboard/sales?period=${period || 'month'}`),
  getInventory: () => api.get('/dashboard/inventory'),
  getFinancial: () => api.get('/dashboard/financial'),
};

// Customers API
export const customersAPI = {
  getAll: (params?: any) => api.get('/customers', { params }),
  getById: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
};

// Suppliers API
export const suppliersAPI = {
  getAll: (params?: any) => api.get('/suppliers', { params }),
  getById: (id: string) => api.get(`/suppliers/${id}`),
  create: (data: any) => api.post('/suppliers', data),
  update: (id: string, data: any) => api.put(`/suppliers/${id}`, data),
  delete: (id: string) => api.delete(`/suppliers/${id}`),
};

// Products API
export const productsAPI = {
  getAll: (params?: any) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// Inventory API
export const inventoryAPI = {
  getStock: (params?: any) => api.get('/inventory/stock', { params }),
  updateStock: (id: string, data: any) => api.put(`/inventory/stock/${id}`, data),
  getWarehouses: () => api.get('/inventory/warehouses'),
  createWarehouse: (data: any) => api.post('/inventory/warehouses', data),
};

// Invoices API
export const invoicesAPI = {
  getAll: (params?: any) => api.get('/invoices', { params }),
  getById: (id: string) => api.get(`/invoices/${id}`),
  create: (data: any) => api.post('/invoices', data),
  update: (id: string, data: any) => api.put(`/invoices/${id}`, data),
  delete: (id: string) => api.delete(`/invoices/${id}`),
  send: (id: string) => api.post(`/invoices/${id}/send`),
  markAsPaid: (id: string) => api.post(`/invoices/${id}/mark-paid`),
};

// Purchase Orders API
export const purchaseOrdersAPI = {
  getAll: (params?: any) => api.get('/purchase-orders', { params }),
  getById: (id: string) => api.get(`/purchase-orders/${id}`),
  create: (data: any) => api.post('/purchase-orders', data),
  update: (id: string, data: any) => api.put(`/purchase-orders/${id}`, data),
  delete: (id: string) => api.delete(`/purchase-orders/${id}`),
  confirm: (id: string) => api.post(`/purchase-orders/${id}/confirm`),
  receive: (id: string) => api.post(`/purchase-orders/${id}/receive`),
};

// Employees API
export const employeesAPI = {
  getAll: (params?: any) => api.get('/employees', { params }),
  getById: (id: string) => api.get(`/employees/${id}`),
  create: (data: any) => api.post('/employees', data),
  update: (id: string, data: any) => api.put(`/employees/${id}`, data),
  delete: (id: string) => api.delete(`/employees/${id}`),
};

// Payroll API
export const payrollAPI = {
  getAll: (params?: any) => api.get('/payrolls', { params }),
  getById: (id: string) => api.get(`/payrolls/${id}`),
  create: (data: any) => api.post('/payrolls', data),
  update: (id: string, data: any) => api.put(`/payrolls/${id}`, data),
  process: (id: string) => api.post(`/payrolls/${id}/process`),
  pay: (id: string) => api.post(`/payrolls/${id}/pay`),
};

// Accounts API
export const accountsAPI = {
  getAll: (params?: any) => api.get('/accounts', { params }),
  getById: (id: string) => api.get(`/accounts/${id}`),
  create: (data: any) => api.post('/accounts', data),
  update: (id: string, data: any) => api.put(`/accounts/${id}`, data),
  delete: (id: string) => api.delete(`/accounts/${id}`),
};

// Transactions API
export const transactionsAPI = {
  getAll: (params?: any) => api.get('/transactions', { params }),
  getById: (id: string) => api.get(`/transactions/${id}`),
  create: (data: any) => api.post('/transactions', data),
  update: (id: string, data: any) => api.put(`/transactions/${id}`, data),
  delete: (id: string) => api.delete(`/transactions/${id}`),
  approve: (id: string) => api.post(`/transactions/${id}/approve`),
};

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string; // Assuming UserRole enum from backend
  isActive: boolean;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
}

export interface UserCreateRequest {
  firstName: string;
  lastName: string;
  email: string;
  password?: string; // Password should be optional for creation if it's auto-generated or set later
  role: string;
  isActive?: boolean;
}

export const usersAPI = {
  getAll: (params?: { q?: string; take?: number; skip?: number }) =>
    api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: UserCreateRequest) => api.post('/users', data),
  update: (id: string, data: UserUpdateRequest) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};


export default api;
