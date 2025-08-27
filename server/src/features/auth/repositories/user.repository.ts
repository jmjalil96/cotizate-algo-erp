import { PrismaClient, User, Prisma } from '@prisma/client';

import type { UserWithDetails } from '../domain/session/session.dto.js';

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findWithDetails(email: string): Promise<UserWithDetails | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        profile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        userRole: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
                rolePermissions: {
                  select: {
                    permission: {
                      select: {
                        resource: true,
                        action: true,
                        scope: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.profile || !user.userRole) {
      return null;
    }

    return user as unknown as UserWithDetails;
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

  async markEmailVerified(userId: string, tx?: Prisma.TransactionClient): Promise<void> {
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
