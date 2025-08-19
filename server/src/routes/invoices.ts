import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

const router = Router();

const invoiceItemSchema = z.object({
  productId: z.string(),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  taxRate: z.coerce.number().min(0).max(100),
  discount: z.coerce.number().min(0).optional().default(0),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
  date: z.coerce.date(),
  dueDate: z.coerce.date().optional(),
  customerId: z.string(),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1),
});

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const items = await prisma.invoice.findMany({
      where: { companyId },
      include: { customer: true, items: true },
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
    const inv = await prisma.invoice.findFirst({ where: { id, companyId }, include: { customer: true, items: true } });
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    return res.json(inv);
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const data = invoiceSchema.parse(req.body);

    // compute totals
    const computed = data.items.map((it) => {
      const taxAmount = (it.unitPrice * it.quantity - (it.discount || 0)) * (it.taxRate / 100);
      const total = it.unitPrice * it.quantity - (it.discount || 0) + taxAmount;
      return { ...it, taxAmount, total };
    });

    const subtotal = computed.reduce((s, it) => s + it.unitPrice * it.quantity - (it.discount || 0), 0);
    const taxAmount = computed.reduce((s, it) => s + it.taxAmount, 0);
    const total = computed.reduce((s, it) => s + it.total, 0);

    const created = await prisma.invoice.create({
      data: {
        invoiceNumber: data.invoiceNumber,
        date: data.date,
        dueDate: data.dueDate,
        customerId: data.customerId,
        subtotal,
        taxAmount,
        total,
        companyId,
        status: 'SENT',
        items: {
          create: computed.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            taxRate: it.taxRate,
            taxAmount: it.taxAmount,
            discount: it.discount || 0,
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

router.post('/:id/mark-paid', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const { id } = req.params;
    const inv = await prisma.invoice.findFirst({ where: { id, companyId } });
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    const updated = await prisma.invoice.update({ where: { id }, data: { status: 'PAID' } });
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const { id } = req.params;
    const inv = await prisma.invoice.findFirst({ where: { id, companyId } });
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    await prisma.invoice.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
