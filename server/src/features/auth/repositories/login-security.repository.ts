import { PrismaClient, LoginSecurity, Prisma } from '@prisma/client';

import { AUTH } from '../shared/auth.constants.js';

export class LoginSecurityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    data: {
      userId: string;
    },
    tx?: Prisma.TransactionClient
  ): Promise<LoginSecurity> {
    const client = tx ?? this.prisma;

    return client.loginSecurity.create({
      data: {
        userId: data.userId,
      },
    });
  }

  async findByUserId(userId: string): Promise<LoginSecurity | null> {
    return this.prisma.loginSecurity.findUnique({
      where: { userId },
    });
  }

  async incrementFailedLogin(userId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;

    const loginSecurity = await client.loginSecurity.update({
      where: { userId },
      data: {
        failedLoginCount: {
          increment: 1,
        },
      },
      select: {
        failedLoginCount: true,
      },
    });

    // Set requiresOtp if failed attempts reach threshold
    if (loginSecurity.failedLoginCount >= AUTH.LOGIN.MAX_ATTEMPTS) {
      await client.loginSecurity.update({
        where: { userId },
        data: {
          requiresOtp: true,
        },
      });
    }
  }

  async setLoginOtp(
    userId: string,
    otpHash: string,
    expiresAt: Date,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    const client = tx ?? this.prisma;

    await client.loginSecurity.update({
      where: { userId },
      data: {
        loginOtpHash: otpHash,
        loginOtpExpiresAt: expiresAt,
        loginOtpSentAt: new Date(),
      },
    });
  }

  async handleSuccessfulLogin(
    userId: string,
    ipAddress: string,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    const client = tx ?? this.prisma;

    await client.loginSecurity.update({
      where: { userId },
      data: {
        failedLoginCount: 0,
        requiresOtp: false,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        // Clear OTP fields on successful login
        loginOtpHash: null,
        loginOtpExpiresAt: null,
        loginOtpSentAt: null,
      },
    });
  }
}
