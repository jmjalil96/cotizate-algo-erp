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
}