import { PrismaClient, Organization, Prisma } from '@prisma/client';

export class OrganizationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async existsBySlug(slug: string): Promise<boolean> {
    const count = await this.prisma.organization.count({
      where: { slug },
    });
    return count > 0;
  }

  async create(
    data: {
      name: string;
      slug: string;
    },
    tx?: Prisma.TransactionClient
  ): Promise<Organization> {
    const client = tx ?? this.prisma;

    return client.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
      },
    });
  }
}
