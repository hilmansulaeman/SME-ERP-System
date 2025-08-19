import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

const router = Router();

const employeeSchema = z.object({
  employeeId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  dateOfBirth: z.coerce.date().optional(),
  dateOfJoining: z.coerce.date(),
  department: z.string().optional(),
  designation: z.string().optional(),
  salary: z.coerce.number().nonnegative(),
  isActive: z.boolean().optional(),
});

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const items = await prisma.employee.findMany({ where: { companyId, isActive: true }, orderBy: { createdAt: 'desc' }, take: 100 });
    return res.json(items);
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const { id } = req.params;
    const emp = await prisma.employee.findFirst({ where: { id, companyId } });
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    return res.json(emp);
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const data = employeeSchema.parse(req.body);
    const created = await prisma.employee.create({ data: { ...data, companyId } });
    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const { id } = req.params;
    const data = employeeSchema.partial().parse(req.body);
    const exists = await prisma.employee.findFirst({ where: { id, companyId } });
    if (!exists) return res.status(404).json({ error: 'Employee not found' });
    const updated = await prisma.employee.update({ where: { id }, data });
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.companyId as string;
    const { id } = req.params;
    const exists = await prisma.employee.findFirst({ where: { id, companyId } });
    if (!exists) return res.status(404).json({ error: 'Employee not found' });
    await prisma.employee.update({ where: { id }, data: { isActive: false } });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
