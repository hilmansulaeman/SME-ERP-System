import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticateToken, requireRole } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// Get all users
router.get('/', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res, next) => {
  try {
    const { q, take, skip } = req.query;
    const companyId = (req as any).user.companyId;

    const users = await prisma.user.findMany({
      where: {
        companyId: companyId,
        OR: q ? [
          { firstName: { contains: q as string, mode: 'insensitive' } },
          { lastName: { contains: q as string, mode: 'insensitive' } },
          { email: { contains: q as string, mode: 'insensitive' } },
        ] : undefined,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      take: take ? parseInt(take as string) : undefined,
      skip: skip ? parseInt(skip as string) : undefined,
    });
    res.json(users);
  } catch (error) {
    return next(error);
  }
});

// Create a new user
router.post('/', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role, isActive } = req.body;
    const companyId = (req as any).user.companyId;

    if (!password) {
      return res.status(400).json({ message: 'Password is required for new user creation.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
        isActive: isActive ?? true,
        company: companyId ? { connect: { id: companyId } } : undefined,
        createdBy: (req as any).user.id,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return res.status(201).json(newUser);
  } catch (error) {
    return next(error);
  }
});

// Update a user
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, role, isActive } = req.body;
    const companyId = (req as any).user.companyId;

    const updatedUser = await prisma.user.update({
      where: { id, companyId },
      data: {
        firstName,
        lastName,
        email,
        role,
        isActive,
        updatedBy: (req as any).user.id,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return res.json(updatedUser);
  } catch (error) {
    return next(error);
  }
});

// Delete a user
router.delete('/:id', authenticateToken, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = (req as any).user.companyId;

    await prisma.user.delete({
      where: { id, companyId },
    });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;
