import { PrismaClient, AuditLog, Prisma } from '@prisma/client';

export class AuditLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async logRegistration(
    data: {
      userId: string;
      organizationId: string;
      email: string;
      ipAddress?: string;
      userAgent?: string;
    },
    tx?: Prisma.TransactionClient
  ): Promise<AuditLog> {
    const client = tx ?? this.prisma;

    return client.auditLog.create({
      data: {
        userId: data.userId,
        action: 'USER_REGISTERED',
        resourceType: 'user',
        resourceId: data.userId,
        afterData: {
          userId: data.userId,
          organizationId: data.organizationId,
          email: data.email,
        },
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      },
    });
  }

  async logEmailVerification(
    data: {
      userId: string;
      email: string;
      ipAddress?: string;
      userAgent?: string;
    },
    tx?: Prisma.TransactionClient
  ): Promise<AuditLog> {
    const client = tx ?? this.prisma;

    return client.auditLog.create({
      data: {
        userId: data.userId,
        action: 'EMAIL_VERIFIED',
        resourceType: 'user',
        resourceId: data.userId,
        afterData: {
          email: data.email,
          emailVerified: true,
        },
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      },
    });
  }

  async logLogin(
    data: {
      userId: string;
      email: string;
      ipAddress?: string;
      userAgent?: string;
      deviceName?: string;
    },
    tx?: Prisma.TransactionClient
  ): Promise<AuditLog> {
    const client = tx ?? this.prisma;

    return client.auditLog.create({
      data: {
        userId: data.userId,
        action: 'USER_LOGIN',
        resourceType: 'session',
        resourceId: data.userId,
        afterData: {
          email: data.email,
          deviceName: data.deviceName,
          loginTime: new Date().toISOString(),
        },
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      },
    });
  }

  async logRefresh(
    data: {
      userId: string;
      tokenId: string;
      familyId: string;
      generation: number;
      newFamilyCreated?: boolean;
      ipAddress?: string;
      userAgent?: string;
    },
    tx?: Prisma.TransactionClient
  ): Promise<AuditLog> {
    const client = tx ?? this.prisma;

    return client.auditLog.create({
      data: {
        userId: data.userId,
        action: 'TOKEN_REFRESH',
        resourceType: 'refresh_token',
        resourceId: data.tokenId,
        afterData: {
          familyId: data.familyId,
          generation: data.generation,
          newFamilyCreated: data.newFamilyCreated,
          refreshTime: new Date().toISOString(),
        },
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      },
    });
  }

  async logPasswordResetRequest(
    data: {
      userId: string | null; // null if user not found
      email: string;
      wasLocked?: boolean;
      attemptCountReset?: boolean;
      ipAddress?: string;
      userAgent?: string;
    },
    tx?: Prisma.TransactionClient
  ): Promise<AuditLog> {
    const client = tx ?? this.prisma;

    return client.auditLog.create({
      data: {
        userId: data.userId,
        action: 'PASSWORD_RESET_REQUESTED',
        resourceType: 'password_reset',
        resourceId: data.userId ?? 'unknown',
        afterData: {
          email: data.email,
          wasLocked: data.wasLocked ?? false,
          attemptCountReset: data.attemptCountReset ?? false,
          requestTime: new Date().toISOString(),
        },
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      },
    });
  }

  async logPasswordResetSuccess(
    data: {
      userId: string;
      email: string;
      emailAutoVerified: boolean;
      ipAddress?: string;
      userAgent?: string;
    },
    tx?: Prisma.TransactionClient
  ): Promise<AuditLog> {
    const client = tx ?? this.prisma;

    return client.auditLog.create({
      data: {
        userId: data.userId,
        action: 'PASSWORD_RESET_SUCCESS',
        resourceType: 'password_reset',
        resourceId: data.userId,
        afterData: {
          email: data.email,
          emailAutoVerified: data.emailAutoVerified,
          resetTime: new Date().toISOString(),
        },
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      },
    });
  }

  async logPasswordResetFailed(
    data: {
      userId: string | null;
      email: string;
      reason: 'invalid_code' | 'expired_code' | 'locked';
      attemptCount: number;
      locked: boolean;
      ipAddress?: string;
      userAgent?: string;
    },
    tx?: Prisma.TransactionClient
  ): Promise<AuditLog> {
    const client = tx ?? this.prisma;

    return client.auditLog.create({
      data: {
        userId: data.userId,
        action: 'PASSWORD_RESET_FAILED',
        resourceType: 'password_reset',
        resourceId: data.userId ?? 'unknown',
        afterData: {
          email: data.email,
          reason: data.reason,
          attemptCount: data.attemptCount,
          locked: data.locked,
          failTime: new Date().toISOString(),
        },
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      },
    });
  }

  async create(
    data: {
      userId?: string | null;
      action: string;
      resourceType?: string;
      resourceId?: string;
      beforeData?: Prisma.InputJsonValue;
      afterData?: Prisma.InputJsonValue;
      ipAddress?: string | null;
      userAgent?: string | null;
    },
    tx?: Prisma.TransactionClient
  ): Promise<AuditLog> {
    const client = tx ?? this.prisma;

    return client.auditLog.create({
      data: {
        userId: data.userId ?? null,
        action: data.action,
        ...(data.resourceType && { resourceType: data.resourceType }),
        ...(data.resourceId && { resourceId: data.resourceId }),
        ...(data.beforeData && { beforeData: data.beforeData }),
        ...(data.afterData && { afterData: data.afterData }),
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      },
    });
  }

  async logLogout(
    data: {
      userId: string | null; // null if no token
      action: 'USER_LOGOUT' | 'USER_LOGOUT_EVERYWHERE';
      familyId?: string;
      tokensRevoked: number;
      tokenMissing?: boolean;
      ipAddress?: string;
      userAgent?: string;
    },
    tx?: Prisma.TransactionClient
  ): Promise<AuditLog> {
    const client = tx ?? this.prisma;

    return client.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resourceType: 'session',
        resourceId: data.familyId ?? 'unknown',
        afterData: {
          tokensRevoked: data.tokensRevoked,
          tokenMissing: data.tokenMissing,
          logoutType: data.action === 'USER_LOGOUT_EVERYWHERE' ? 'everywhere' : 'single',
          logoutTime: new Date().toISOString(),
        },
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      },
    });
  }

  async logTokenReuse(
    data: {
      userId: string;
      tokenId: string;
      familyId: string;
      generation: number;
      attackerIP: string;
      originalIP: string;
      deviceFingerprint: string;
    },
    tx?: Prisma.TransactionClient
  ): Promise<AuditLog> {
    const client = tx ?? this.prisma;

    return client.auditLog.create({
      data: {
        userId: data.userId,
        action: 'SECURITY_TOKEN_REUSE_DETECTED',
        resourceType: 'refresh_token',
        resourceId: data.tokenId,
        afterData: {
          familyId: data.familyId,
          generation: data.generation,
          attackerIP: data.attackerIP,
          originalIP: data.originalIP,
          deviceFingerprint: data.deviceFingerprint,
          detectedAt: new Date().toISOString(),
          familyRevoked: true,
        },
        ipAddress: data.attackerIP,
        userAgent: null,
      },
    });
  }
}
