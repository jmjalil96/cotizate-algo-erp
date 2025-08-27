import { PrismaClient, UserRole, Prisma } from '@prisma/client';

export class UserRoleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async assignRole(
    data: {
      userId: string;
      roleId: string;
    },
    tx?: Prisma.TransactionClient
  ): Promise<UserRole> {
    const client = tx ?? this.prisma;

    return client.userRole.create({
      data: {
        userId: data.userId,
        roleId: data.roleId,
      },
    });
  }
}
