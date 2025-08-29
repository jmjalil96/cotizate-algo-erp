import { PrismaClient, EmailVerificationToken, Prisma } from '@prisma/client';

export class EmailVerificationTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async invalidateAllForUser(userId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;

    await client.emailVerificationToken.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });
  }

  async create(
    data: {
      userId: string;
      tokenHash: string;
      expiresAt: Date;
    },
    tx?: Prisma.TransactionClient
  ): Promise<EmailVerificationToken> {
    const client = tx ?? this.prisma;

    return client.emailVerificationToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findActiveByUserId(userId: string): Promise<EmailVerificationToken | null> {
    return this.prisma.emailVerificationToken.findFirst({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsUsed(tokenId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;

    await client.emailVerificationToken.update({
      where: { id: tokenId },
      data: {
        usedAt: new Date(),
        isActive: false,
      },
    });
  }

  async findMostRecentByUserId(userId: string): Promise<EmailVerificationToken | null> {
    return this.prisma.emailVerificationToken.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMostRecentActiveByUserId(userId: string): Promise<EmailVerificationToken | null> {
    return this.prisma.emailVerificationToken.findFirst({
      where: {
        userId,
        isActive: true,
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
