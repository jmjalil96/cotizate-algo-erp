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
