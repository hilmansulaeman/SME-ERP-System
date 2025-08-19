import { Router } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = Router();

// Get dashboard overview
router.get('/overview', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw createError('Company access required', 403);
    }

    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Get counts
    const [
      totalCustomers,
      totalSuppliers,
      totalProducts,
      totalEmployees,
      totalInvoices,
      totalPurchaseOrders
    ] = await Promise.all([
      prisma.customer.count({ where: { companyId, isActive: true } }),
      prisma.supplier.count({ where: { companyId, isActive: true } }),
      prisma.product.count({ where: { companyId, isActive: true } }),
      prisma.employee.count({ where: { companyId, isActive: true } }),
      prisma.invoice.count({ where: { companyId } }),
      prisma.purchaseOrder.count({ where: { companyId } })
    ]);

    // Get monthly revenue
    const monthlyRevenue = await prisma.invoice.aggregate({
      where: {
        companyId,
        status: 'PAID',
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: {
        total: true
      }
    });

    // Get monthly expenses
    const monthlyExpenses = await prisma.purchaseOrder.aggregate({
      where: {
        companyId,
        status: 'RECEIVED',
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: {
        total: true
      }
    });

    // Get low stock products
    const lowStockProducts = await prisma.product.findMany({
      where: {
        companyId,
        isActive: true,
        stocks: {
          some: {
            available: {
              lte: 10
            }
          }
        }
      },
      include: {
        stocks: {
          include: {
            warehouse: true
          }
        }
      },
      take: 5
    });

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        companyId
      },
      include: {
        account: true,
        customer: true,
        supplier: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Get pending invoices
    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        companyId,
        status: {
          in: ['SENT', 'OVERDUE']
        }
      },
      include: {
        customer: true
      },
      orderBy: {
        dueDate: 'asc'
      },
      take: 5
    });

    res.json({
      overview: {
        totalCustomers,
        totalSuppliers,
        totalProducts,
        totalEmployees,
        totalInvoices,
        totalPurchaseOrders,
        monthlyRevenue: monthlyRevenue._sum.total || 0,
        monthlyExpenses: monthlyExpenses._sum.total || 0
      },
      lowStockProducts,
      recentTransactions,
      pendingInvoices
    });
  } catch (error) {
    next(error);
  }
});

// Get sales analytics
router.get('/sales', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw createError('Company access required', 403);
    }

    const { period = 'month' } = req.query;
    const currentDate = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(currentDate.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    }

    // Get sales data
    const sales = await prisma.invoice.findMany({
      where: {
        companyId,
        status: 'PAID',
        date: {
          gte: startDate,
          lte: currentDate
        }
      },
      select: {
        date: true,
        total: true,
        customer: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Get top customers
    const topCustomers = await prisma.invoice.groupBy({
      by: ['customerId'],
      where: {
        companyId,
        status: 'PAID',
        date: {
          gte: startDate,
          lte: currentDate
        }
      },
      _sum: {
        total: true
      },
      orderBy: {
        _sum: {
          total: 'desc'
        }
      },
      take: 5
    });

    const topCustomersWithDetails = await Promise.all(
      topCustomers.map(async (customer) => {
        const customerDetails = await prisma.customer.findUnique({
          where: { id: customer.customerId },
          select: { name: true }
        });
        return {
          customerId: customer.customerId,
          customerName: customerDetails?.name,
          totalSales: customer._sum.total
        };
      })
    );

    res.json({
      sales,
      topCustomers: topCustomersWithDetails
    });
  } catch (error) {
    next(error);
  }
});

// Get inventory analytics
router.get('/inventory', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw createError('Company access required', 403);
    }

    // Get inventory summary
    const inventorySummary = await prisma.stock.groupBy({
      by: ['warehouseId'],
      where: {
        product: {
          companyId,
          isActive: true
        }
      },
      _sum: {
        quantity: true,
        available: true,
        reserved: true
      }
    });

    const inventorySummaryWithWarehouse = await Promise.all(
      inventorySummary.map(async (summary) => {
        const warehouse = await prisma.warehouse.findUnique({
          where: { id: summary.warehouseId },
          select: { name: true }
        });
        return {
          warehouseId: summary.warehouseId,
          warehouseName: warehouse?.name,
          totalQuantity: summary._sum.quantity,
          totalAvailable: summary._sum.available,
          totalReserved: summary._sum.reserved
        };
      })
    );

    // Get low stock alerts
    const lowStockAlerts = await prisma.product.findMany({
      where: {
        companyId,
        isActive: true,
        stocks: {
          some: {
            available: {
              lte: 10
            }
          }
        }
      },
      include: {
        stocks: {
          include: {
            warehouse: true
          }
        }
      }
    });

    // Get top selling products
    const topSellingProducts = await prisma.invoiceItem.groupBy({
      by: ['productId'],
      where: {
        invoice: {
          companyId,
          status: 'PAID'
        }
      },
      _sum: {
        quantity: true,
        total: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 10
    });

    const topSellingProductsWithDetails = await Promise.all(
      topSellingProducts.map(async (product) => {
        const productDetails = await prisma.product.findUnique({
          where: { id: product.productId },
          select: { name: true, sku: true }
        });
        return {
          productId: product.productId,
          productName: productDetails?.name,
          sku: productDetails?.sku,
          totalQuantity: product._sum.quantity,
          totalRevenue: product._sum.total
        };
      })
    );

    res.json({
      inventorySummary: inventorySummaryWithWarehouse,
      lowStockAlerts,
      topSellingProducts: topSellingProductsWithDetails
    });
  } catch (error) {
    next(error);
  }
});

// Get financial analytics
router.get('/financial', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw createError('Company access required', 403);
    }

    const currentDate = new Date();
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);

    // Get monthly revenue for the year
    const monthlyRevenue = await prisma.invoice.groupBy({
      by: ['date'],
      where: {
        companyId,
        status: 'PAID',
        date: {
          gte: startOfYear,
          lte: currentDate
        }
      },
      _sum: {
        total: true
      }
    });

    // Get monthly expenses for the year
    const monthlyExpenses = await prisma.purchaseOrder.groupBy({
      by: ['date'],
      where: {
        companyId,
        status: 'RECEIVED',
        date: {
          gte: startOfYear,
          lte: currentDate
        }
      },
      _sum: {
        total: true
      }
    });

    // Get account balances
    const accountBalances = await prisma.account.findMany({
      where: {
        companyId,
        isActive: true
      },
      include: {
        transactions: {
          select: {
            amount: true,
            type: true
          }
        }
      }
    });

    const accountBalancesWithCalculated = accountBalances.map(account => {
      const balance = account.transactions.reduce((acc, transaction) => {
        if (transaction.type === 'DEBIT') {
          return acc + Number(transaction.amount);
        } else {
          return acc - Number(transaction.amount);
        }
      }, 0);

      return {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        balance
      };
    });

    res.json({
      monthlyRevenue,
      monthlyExpenses,
      accountBalances: accountBalancesWithCalculated
    });
  } catch (error) {
    next(error);
  }
});

export default router;
