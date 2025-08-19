import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

const router = Router();

const txnSchema = z.object({
  date: z.coerce.date(),
  reference: z.string().optional(),
  description: z.string().min(1),
  amount: z.coerce.number().positive(),
  type: z.enum(['DEBIT','CREDIT']),
  accountId: z.string(),
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
});

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const items = await prisma.transaction.findMany({
      where: { companyId },
      include: { account: true, customer: true, supplier: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return res.json(items);
  } catch (error) { return next(error); }
});

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string; const { id } = req.params;
    const item = await prisma.transaction.findFirst({ where: { id, companyId }, include: { account: true, customer: true, supplier: true } });
    if (!item) return res.status(404).json({ error: 'Transaction not found' });
    return res.json(item);
  } catch (error) { return next(error); }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string; const data = txnSchema.parse(req.body);
    const created = await prisma.transaction.create({ data: { ...data, companyId, status: 'PENDING' } });
    return res.status(201).json(created);
  } catch (error) { return next(error); }
});

router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string; const { id } = req.params;
    const data = txnSchema.partial().parse(req.body);
    const exists = await prisma.transaction.findFirst({ where: { id, companyId } });
    if (!exists) return res.status(404).json({ error: 'Transaction not found' });
    const updated = await prisma.transaction.update({ where: { id }, data });
    return res.json(updated);
  } catch (error) { return next(error); }
});

router.post('/:id/approve', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string; const { id } = req.params;
    const exists = await prisma.transaction.findFirst({ where: { id, companyId } });
    if (!exists) return res.status(404).json({ error: 'Transaction not found' });
    const updated = await prisma.transaction.update({ where: { id }, data: { status: 'APPROVED' } });
    return res.json(updated);
  } catch (error) { return next(error); }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string; const { id } = req.params;
    const exists = await prisma.transaction.findFirst({ where: { id, companyId } });
    if (!exists) return res.status(404).json({ error: 'Transaction not found' });
    await prisma.transaction.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error) { return next(error); }
});

export default router;
