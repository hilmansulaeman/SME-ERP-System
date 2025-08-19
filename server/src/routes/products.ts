import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

const router = Router();

const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  unit: z.string().optional(),
  price: z.coerce.number().nonnegative(),
  costPrice: z.coerce.number().nonnegative(),
  gstRate: z.coerce.number().min(0).max(100).optional(),
  minStock: z.coerce.number().int().min(0).optional(),
  maxStock: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// List products with search & pagination
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const { q, skip = '0', take = '20' } = req.query as Record<string, string>;

    const where = {
      companyId,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' as const } },
              { sku: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: Number(skip),
        take: Number(take),
      }),
      prisma.product.count({ where }),
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

    const product = await prisma.product.findFirst({ where: { id, companyId } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json(product);
  } catch (error) {
    return next(error);
  }
});

// Create
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const data = productSchema.parse(req.body);

    const created = await prisma.product.create({
      data: {
        ...data,
        companyId,
      },
    });

    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
});

// Update
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const { id } = req.params;
    const data = productSchema.partial().parse(req.body);

    const exists = await prisma.product.findFirst({ where: { id, companyId } });
    if (!exists) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updated = await prisma.product.update({ where: { id }, data });
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

// Delete (soft via isActive=false)
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const { id } = req.params;

    const exists = await prisma.product.findFirst({ where: { id, companyId } });
    if (!exists) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await prisma.product.update({ where: { id }, data: { isActive: false } });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
