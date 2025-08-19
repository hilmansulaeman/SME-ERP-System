import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });

    if (existingUser) {
      console.log('Admin user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Create company
    const company = await prisma.company.create({
      data: {
        name: 'Demo Company',
        legalName: 'Demo Company Ltd.',
        currency: 'INR',
        timezone: 'Asia/Kolkata'
      }
    });

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        companyId: company.id
      }
    });

    console.log('Admin user created successfully:');
    console.log('Email: admin@example.com');
    console.log('Password: password123');
    console.log('Company: Demo Company');
    console.log('User ID:', adminUser.id);
    console.log('Company ID:', company.id);

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
