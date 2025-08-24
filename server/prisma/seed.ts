import { PrismaClient, UserRole, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Simple password hashing for development - use bcrypt or argon2 in production
async function hashPassword(password: string): Promise<string> {
  // This is a placeholder - in production use bcrypt or argon2
  return Buffer.from(password).toString('base64');
}

async function cleanDatabase(): Promise<void> {
  console.info('🧹 Cleaning database...');
  
  // Delete in reverse order of dependencies
  await prisma.user.deleteMany();
  
  console.info('✅ Database cleaned');
}

async function seedUsers(): Promise<void> {
  console.info('🌱 Seeding users...');
  
  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@cotizate.com',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      password: await hashPassword('admin123456'),
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  
  console.info(`✅ Created admin user: ${adminUser.email}`);
  
  // Create test user
  const testUser = await prisma.user.create({
    data: {
      email: 'user@cotizate.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      password: await hashPassword('user123456'),
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  
  console.info(`✅ Created test user: ${testUser.email}`);
  
  // Create pending user
  const pendingUser = await prisma.user.create({
    data: {
      email: 'pending@cotizate.com',
      username: 'pendinguser',
      firstName: 'Pending',
      lastName: 'User',
      password: await hashPassword('pending123456'),
      role: UserRole.USER,
      status: UserStatus.PENDING,
      isEmailVerified: false,
    },
  });
  
  console.info(`✅ Created pending user: ${pendingUser.email}`);
  
  console.info('✅ Users seeded successfully');
}

async function main(): Promise<void> {
  try {
    console.info('🚀 Starting seed process...');
    console.info(`📍 Environment: ${process.env['NODE_ENV'] ?? 'development'}`);
    
    // Clean database first
    await cleanDatabase();
    
    // Seed data
    await seedUsers();
    
    console.info('🎉 Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error) => {
  console.error('Fatal error during seed:', error);
  throw error;
});