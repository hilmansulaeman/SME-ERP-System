import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import companyRoutes from './routes/companies';
import customerRoutes from './routes/customers';
import supplierRoutes from './routes/suppliers';
import productRoutes from './routes/products';
import inventoryRoutes from './routes/inventory';
import accountRoutes from './routes/accounts';
import transactionRoutes from './routes/transactions';
import invoiceRoutes from './routes/invoices';
import purchaseOrderRoutes from './routes/purchaseOrders';
import employeeRoutes from './routes/employees';
import payrollRoutes from './routes/payrolls';
import dashboardRoutes from './routes/dashboard';

// Import middleware
import { authenticateToken } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app = express();

// Initialize Prisma
export const prisma = new PrismaClient();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/companies', authenticateToken, companyRoutes);
app.use('/api/customers', authenticateToken, customerRoutes);
app.use('/api/suppliers', authenticateToken, supplierRoutes);
app.use('/api/products', authenticateToken, productRoutes);
app.use('/api/inventory', authenticateToken, inventoryRoutes);
app.use('/api/accounts', authenticateToken, accountRoutes);
app.use('/api/transactions', authenticateToken, transactionRoutes);
app.use('/api/invoices', authenticateToken, invoiceRoutes);
app.use('/api/purchase-orders', authenticateToken, purchaseOrderRoutes);
app.use('/api/employees', authenticateToken, employeeRoutes);
app.use('/api/payrolls', authenticateToken, payrollRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Graceful shutdown (not strictly necessary for serverless, but good practice)
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server only if not in a serverless environment (e.g., Vercel)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
