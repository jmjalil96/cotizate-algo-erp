import { PrismaClient, User, Prisma } from '@prisma/client';

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async create(
    data: {
      email: string;
      passwordHash: string;
      organizationId: string;
    },
    tx?: Prisma.TransactionClient
  ): Promise<User> {
    const client = tx ?? this.prisma;
    
    return client.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        organizationId: data.organizationId,
      },
    });
  }

  async markEmailVerified(
    userId: string,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    const client = tx ?? this.prisma;
    
    await client.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
  }
}