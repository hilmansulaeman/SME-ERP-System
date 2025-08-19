import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

const router = Router();

const payrollSchema = z.object({
  employeeId: z.string(),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000),
  basicSalary: z.coerce.number().nonnegative(),
  allowances: z.coerce.number().nonnegative().optional().default(0),
  deductions: z.coerce.number().nonnegative().optional().default(0),
});

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const items = await prisma.payroll.findMany({ where: { companyId }, include: { employee: true }, orderBy: { createdAt: 'desc' }, take: 100 });
    return res.json(items);
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const { id } = req.params;
    const item = await prisma.payroll.findFirst({ where: { id, companyId }, include: { employee: true } });
    if (!item) return res.status(404).json({ error: 'Payroll not found' });
    return res.json(item);
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const data = payrollSchema.parse(req.body);
    const netSalary = (data.basicSalary + (data.allowances || 0)) - (data.deductions || 0);
    const created = await prisma.payroll.create({ data: { ...data, netSalary, status: 'PENDING', companyId } });
    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/process', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const updated = await prisma.payroll.update({ where: { id }, data: { status: 'PROCESSED' } });
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/pay', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const updated = await prisma.payroll.update({ where: { id }, data: { status: 'PAID', paidDate: new Date() } });
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    await prisma.payroll.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
