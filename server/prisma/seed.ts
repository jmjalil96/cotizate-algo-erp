import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Password hashing function - kept for future use when seeding users
// async function hashPassword(password: string): Promise<string> {
//   return bcrypt.hash(password, 12);
// }

async function cleanDatabase(): Promise<void> {
  console.info('🧹 Cleaning database...');
  
  // Delete in reverse order of dependencies
  await prisma.auditLog.deleteMany();
  await prisma.otpAttempt.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  
  console.info('✅ Database cleaned');
}

async function seedSystemRoleAndPermissions(): Promise<void> {
  console.info('🌱 Seeding system role and permissions...');
  
  // Create the system owner permission (*:* - all resources, all actions)
  const ownerPermission = await prisma.permission.create({
    data: {
      resource: '*',
      action: '*',
      scope: 'all',
    },
  });
  
  console.info('✅ Created owner permission (*:*)');
  
  // Create the system owner role
  await prisma.role.create({
    data: {
      name: 'owner',
      description: 'System owner with full access to all resources',
      isSystem: true,
      rolePermissions: {
        create: {
          permissionId: ownerPermission.id,
        },
      },
    },
  });
  
  console.info('✅ Created system owner role');
}

async function main(): Promise<void> {
  try {
    console.info('🚀 Starting seed process...');
    console.info(`📍 Environment: ${process.env['NODE_ENV'] ?? 'development'}`);
    
    // Clean database first
    await cleanDatabase();
    
    // Seed system role and permissions
    await seedSystemRoleAndPermissions();
    
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