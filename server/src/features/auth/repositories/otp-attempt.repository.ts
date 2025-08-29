import { OtpAttempt, PrismaClient, Prisma } from '@prisma/client';

export class OtpAttemptRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create new OTP attempt record for user
   */
  async create(userId: string, tx?: Prisma.TransactionClient): Promise<OtpAttempt> {
    const client = tx ?? this.prisma;

    return client.otpAttempt.create({
      data: {
        userId,
        attemptCount: 0,
      },
    });
  }

  /**
   * Find OTP attempt record by user ID
   */
  async findByUserId(userId: string): Promise<OtpAttempt | null> {
    return this.prisma.otpAttempt.findUnique({
      where: { userId },
    });
  }

  /**
   * Increment attempt count and return new count (creates record if missing)
   */
  async increment(userId: string): Promise<number> {
    const result = await this.prisma.otpAttempt.upsert({
      where: { userId },
      update: {
        attemptCount: {
          increment: 1,
        },
      },
      create: {
        userId,
        attemptCount: 1,
      },
    });

    return result.attemptCount;
  }

  /**
   * Reset attempt count to 0 (creates record if missing)
   */
  async reset(userId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;

    await client.otpAttempt.upsert({
      where: { userId },
      update: {
        attemptCount: 0,
      },
      create: {
        userId,
        attemptCount: 0,
      },
    });
  }

  /**
   * Check if user is locked out (5+ attempts)
   */
  async isLocked(userId: string): Promise<boolean> {
    const attempt = await this.findByUserId(userId);

    if (!attempt) {
      return false;
    }

    return attempt.attemptCount >= 5;
  }
}
