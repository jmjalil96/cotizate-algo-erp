import { OtpAttempt, PrismaClient, Prisma } from '@prisma/client';

export class OtpAttemptRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create new OTP attempt record for user
   */
  async create(
    userId: string,
    tx?: Prisma.TransactionClient
  ): Promise<OtpAttempt> {
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
   * Increment attempt count and return new count
   */
  async increment(userId: string): Promise<number> {
    const result = await this.prisma.otpAttempt.update({
      where: { userId },
      data: {
        attemptCount: {
          increment: 1,
        },
      },
    });
    
    return result.attemptCount;
  }

  /**
   * Reset attempt count to 0
   */
  async reset(
    userId: string,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    const client = tx ?? this.prisma;
    
    await client.otpAttempt.update({
      where: { userId },
      data: {
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