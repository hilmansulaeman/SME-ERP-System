import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

const router = Router();

const customerSchema = z.object({
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

// List customers with optional search and pagination
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
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: Number(skip),
        take: Number(take),
      }),
      prisma.customer.count({ where }),
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

    const customer = await prisma.customer.findFirst({ where: { id, companyId } });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    return res.json(customer);
  } catch (error) {
    return next(error);
  }
});

// Create
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const data = customerSchema.parse(req.body);

    const customer = await prisma.customer.create({
      data: { ...data, companyId },
    });

    return res.status(201).json(customer);
  } catch (error) {
    return next(error);
  }
});

// Update
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const { id } = req.params;
    const data = customerSchema.partial().parse(req.body);

    // Ensure ownership
    const existing = await prisma.customer.findFirst({ where: { id, companyId } });
    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const updated = await prisma.customer.update({ where: { id }, data });
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

// Delete (soft delete by setting isActive=false)
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const { id } = req.params;

    const existing = await prisma.customer.findFirst({ where: { id, companyId } });
    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await prisma.customer.update({ where: { id }, data: { isActive: false } });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
