import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

const router = Router();

const poItemSchema = z.object({
  productId: z.string(),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  taxRate: z.coerce.number().min(0).max(100),
});

const poSchema = z.object({
  poNumber: z.string().min(1),
  date: z.coerce.date(),
  expectedDate: z.coerce.date().optional(),
  supplierId: z.string(),
  notes: z.string().optional(),
  items: z.array(poItemSchema).min(1),
});

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const items = await prisma.purchaseOrder.findMany({
      where: { companyId },
      include: { supplier: true, items: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return res.json(items);
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const { id } = req.params;
    const po = await prisma.purchaseOrder.findFirst({ where: { id, companyId }, include: { supplier: true, items: true } });
    if (!po) return res.status(404).json({ error: 'Purchase order not found' });
    return res.json(po);
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const data = poSchema.parse(req.body);

    const computed = data.items.map((it) => {
      const taxAmount = (it.unitPrice * it.quantity) * (it.taxRate / 100);
      const total = it.unitPrice * it.quantity + taxAmount;
      return { ...it, taxAmount, total };
    });

    const subtotal = computed.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
    const taxAmount = computed.reduce((s, it) => s + it.taxAmount, 0);
    const total = computed.reduce((s, it) => s + it.total, 0);

    const created = await prisma.purchaseOrder.create({
      data: {
        poNumber: data.poNumber,
        date: data.date,
        expectedDate: data.expectedDate,
        supplierId: data.supplierId,
        subtotal,
        taxAmount,
        total,
        status: 'SENT',
        companyId,
        items: {
          create: computed.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            taxRate: it.taxRate,
            taxAmount: it.taxAmount,
            total: it.total,
          })),
        },
      },
      include: { items: true },
    });

    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/confirm', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const updated = await prisma.purchaseOrder.update({ where: { id }, data: { status: 'CONFIRMED' } });
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/receive', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const updated = await prisma.purchaseOrder.update({ where: { id }, data: { status: 'RECEIVED' } });
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    await prisma.purchaseOrder.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
