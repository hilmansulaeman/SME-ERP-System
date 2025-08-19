import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

const router = Router();

const accountSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE']),
  parentId: z.string().optional(),
  isActive: z.boolean().optional(),
});

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const items = await prisma.account.findMany({
      where: { companyId, isActive: true },
      orderBy: [{ type: 'asc' }, { code: 'asc' }],
      take: 500,
    });
    return res.json(items);
  } catch (error) { return next(error); }
});

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const { id } = req.params;
    const item = await prisma.account.findFirst({ where: { id, companyId } });
    if (!item) return res.status(404).json({ error: 'Account not found' });
    return res.json(item);
  } catch (error) { return next(error); }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const data = accountSchema.parse(req.body);
    const created = await prisma.account.create({ data: { ...data, companyId } });
    return res.status(201).json(created);
  } catch (error) { return next(error); }
});

router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string; const { id } = req.params;
    const data = accountSchema.partial().parse(req.body);
    const exists = await prisma.account.findFirst({ where: { id, companyId } });
    if (!exists) return res.status(404).json({ error: 'Account not found' });
    const updated = await prisma.account.update({ where: { id }, data });
    return res.json(updated);
  } catch (error) { return next(error); }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string; const { id } = req.params;
    const exists = await prisma.account.findFirst({ where: { id, companyId } });
    if (!exists) return res.status(404).json({ error: 'Account not found' });
    await prisma.account.update({ where: { id }, data: { isActive: false } });
    return res.json({ success: true });
  } catch (error) { return next(error); }
});

export default router;
