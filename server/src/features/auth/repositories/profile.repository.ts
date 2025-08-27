import { PrismaClient, Profile, Prisma } from '@prisma/client';

import { AUTH } from '../shared/auth.constants.js';

export class ProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    data: {
      userId: string;
      firstName: string;
      lastName: string;
      timezone?: string;
    },
    tx?: Prisma.TransactionClient
  ): Promise<Profile> {
    const client = tx ?? this.prisma;

    return client.profile.create({
      data: {
        userId: data.userId,
        firstName: data.firstName,
        lastName: data.lastName,
        timezone: data.timezone ?? AUTH.DEFAULTS.TIMEZONE,
      },
    });
  }
}
