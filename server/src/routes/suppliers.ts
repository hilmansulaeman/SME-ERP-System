import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

const router = Router();

const supplierSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('').transform(() => undefined)),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  gstNumber: z.string().optional(),
  isActive: z.boolean().optional()
});

// List suppliers with optional search and pagination
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const { q, skip = '0', take = '20' } = req.query as Record<string, string>;

    const where = {
      companyId,
      isActive: true,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' as const } },
              { email: { contains: q, mode: 'insensitive' as const } },
              { phone: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: Number(skip),
        take: Number(take),
      }),
      prisma.supplier.count({ where }),
    ]);

    return res.json({ items, total });
  } catch (error) {
    return next(error);
  }
});

// Get by id
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const { id } = req.params;

    const supplier = await prisma.supplier.findFirst({ where: { id, companyId } });
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    return res.json(supplier);
  } catch (error) {
    return next(error);
  }
});

// Create
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const data = supplierSchema.parse(req.body);

    const supplier = await prisma.supplier.create({
      data: { ...data, companyId },
    });

    return res.status(201).json(supplier);
  } catch (error) {
    return next(error);
  }
});

// Update
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const { id } = req.params;
    const data = supplierSchema.partial().parse(req.body);

    const existing = await prisma.supplier.findFirst({ where: { id, companyId } });
    if (!existing) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const updated = await prisma.supplier.update({ where: { id }, data });
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

// Delete (soft)
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const { id } = req.params;

    const existing = await prisma.supplier.findFirst({ where: { id, companyId } });
    if (!existing) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    await prisma.supplier.update({ where: { id }, data: { isActive: false } });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
