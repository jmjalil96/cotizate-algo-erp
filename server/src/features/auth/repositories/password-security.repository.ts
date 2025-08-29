import { PrismaClient, PasswordSecurity, Prisma } from '@prisma/client';

export class PasswordSecurityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    data: {
      userId: string;
    },
    tx?: Prisma.TransactionClient
  ): Promise<PasswordSecurity> {
    const client = tx ?? this.prisma;

    return client.passwordSecurity.create({
      data: {
        userId: data.userId,
      },
    });
  }

  async findByUserId(userId: string): Promise<PasswordSecurity | null> {
    return this.prisma.passwordSecurity.findUnique({
      where: { userId },
    });
  }

  async setResetOtp(
    userId: string,
    otpHash: string,
    expiresAt: Date,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    const client = tx ?? this.prisma;

    await client.passwordSecurity.update({
      where: { userId },
      data: {
        resetOtpHash: otpHash,
        resetOtpExpiresAt: expiresAt,
        resetOtpSentAt: new Date(),
        resetAttemptCount: 0, // Reset attempts for new token
      },
    });
  }

  async incrementResetAttempts(
    userId: string,
    tx?: Prisma.TransactionClient
  ): Promise<PasswordSecurity> {
    const client = tx ?? this.prisma;

    return client.passwordSecurity.update({
      where: { userId },
      data: {
        resetAttemptCount: {
          increment: 1,
        },
      },
    });
  }

  async clearResetOtp(userId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;

    await client.passwordSecurity.update({
      where: { userId },
      data: {
        resetOtpHash: null,
        resetOtpExpiresAt: null,
        resetOtpSentAt: null,
        // Keep resetAttemptCount for history
      },
    });
  }

  async completePasswordReset(userId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;

    await client.passwordSecurity.update({
      where: { userId },
      data: {
        resetOtpHash: null,
        resetOtpExpiresAt: null,
        resetOtpSentAt: null,
        resetAttemptCount: 0,
        passwordChangedAt: new Date(),
      },
    });
  }
}
