import { PrismaClient, Role } from '@prisma/client';

import { SystemRoleNotFoundError } from '../domain/registration/registration.errors.js';

export class RoleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findOwnerRole(): Promise<Role> {
    const role = await this.prisma.role.findFirst({
      where: {
        name: 'owner',
        isSystem: true,
      },
    });

    if (!role) {
      throw new SystemRoleNotFoundError('owner');
    }

    return role;
  }
}