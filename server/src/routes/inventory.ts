import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

const router = Router();

const warehouseSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
});

// Warehouses
router.get('/warehouses', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const items = await prisma.warehouse.findMany({ where: { companyId, isActive: true }, orderBy: { createdAt: 'desc' } });
    return res.json(items);
  } catch (error) {
    return next(error);
  }
});

router.post('/warehouses', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const data = warehouseSchema.parse(req.body);
    const wh = await prisma.warehouse.create({ data: { ...data, companyId } });
    return res.status(201).json(wh);
  } catch (error) {
    return next(error);
  }
});

// Stock endpoints
router.get('/stock', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const items = await prisma.stock.findMany({
      where: { product: { companyId } },
      include: { product: true, warehouse: true },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    return res.json(items);
  } catch (error) {
    return next(error);
  }
});

const stockUpdateSchema = z.object({
  quantity: z.coerce.number().int().min(0).optional(),
  reserved: z.coerce.number().int().min(0).optional(),
  available: z.coerce.number().int().min(0).optional(),
});

router.put('/stock/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = stockUpdateSchema.parse(req.body);

    const updated = await prisma.stock.update({ where: { id }, data });
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

export default router;
