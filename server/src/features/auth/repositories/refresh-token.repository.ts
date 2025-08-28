import { PrismaClient, RefreshToken, Prisma } from '@prisma/client';

import { AUTH } from '../shared/auth.constants.js';

import type { RefreshTokenDetails } from '../domain/session/session.dto.js';

export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    data: {
      userId: string;
      tokenHash: string;
      familyId: string;
      deviceName: string;
      deviceFingerprint: string;
      ipAddress: string;
      userAgent: string;
      expiresAt: Date;
    },
    tx?: Prisma.TransactionClient
  ): Promise<RefreshToken> {
    const client = tx ?? this.prisma;

    return client.refreshToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        familyId: data.familyId,
        deviceName: data.deviceName,
        deviceFingerprint: data.deviceFingerprint,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        expiresAt: data.expiresAt,
      },
    });
  }

  /**
   * Find refresh token by hash for security checks (returns even if used/expired)
   * Used to detect token reuse attacks
   */
  async findByTokenHashForSecurity(tokenHash: string): Promise<RefreshTokenDetails | null> {
    const token = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
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
        },
      },
    });

    if (!token) {
      return null;
    }

    // Only check that user has required fields (no validity checks)
    if (!token.user.profile || !token.user.userRole) {
      return null;
    }

    return token as unknown as RefreshTokenDetails;
  }

  /**
   * Find valid refresh token by hash with full user details
   * Returns null if token is expired, revoked, or already used
   */
  async findValidTokenByHash(tokenHash: string): Promise<RefreshTokenDetails | null> {
    const token = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
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
        },
      },
    });

    if (!token) {
      return null;
    }

    // Check if token is valid (not expired, not revoked, not used)
    const now = new Date();
    if (token.expiresAt < now || token.revokedAt || token.usedAt) {
      return null;
    }

    // Ensure user has required fields
    if (!token.user.profile || !token.user.userRole) {
      return null;
    }

    return token as unknown as RefreshTokenDetails;
  }

  /**
   * Mark token as used (part of rotation)
   */
  async markAsUsed(tokenId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;

    await client.refreshToken.update({
      where: { id: tokenId },
      data: {
        usedAt: new Date(),
      },
    });
  }

  /**
   * Create rotated token (child of parent)
   */
  async createRotatedToken(
    data: {
      userId: string;
      tokenHash: string;
      familyId: string;
      deviceName: string;
      deviceFingerprint: string;
      ipAddress: string;
      userAgent: string;
      expiresAt: Date;
      parentTokenId: string;
      generation: number;
    },
    tx?: Prisma.TransactionClient
  ): Promise<RefreshToken> {
    const client = tx ?? this.prisma;

    return client.refreshToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        familyId: data.familyId,
        generation: data.generation,
        parentTokenId: data.parentTokenId,
        deviceName: data.deviceName,
        deviceFingerprint: data.deviceFingerprint,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        expiresAt: data.expiresAt,
      },
    });
  }

  /**
   * Revoke single token
   */
  async revokeToken(tokenId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;

    await client.refreshToken.update({
      where: { id: tokenId },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Revoke entire token family (security breach)
   */
  async revokeTokenFamily(
    familyId: string,
    reason: (typeof AUTH.REVOCATION_REASONS)[keyof typeof AUTH.REVOCATION_REASONS],
    tx?: Prisma.TransactionClient
  ): Promise<number> {
    const client = tx ?? this.prisma;
    const now = new Date();

    const result = await client.refreshToken.updateMany({
      where: {
        familyId,
        revokedAt: null, // Only revoke active tokens
      },
      data: {
        revokedAt: now,
        revokedReason: reason,
      },
    });

    return result.count;
  }

  /**
   * Revoke all tokens for a user (logout everywhere)
   */
  async revokeAllUserTokens(
    userId: string,
    reason: string = AUTH.REVOCATION_REASONS.LOGOUT_EVERYWHERE,
    tx?: Prisma.TransactionClient
  ): Promise<number> {
    const client = tx ?? this.prisma;
    const now = new Date();

    const result = await client.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null, // Only revoke active tokens
      },
      data: {
        revokedAt: now,
        revokedReason: reason,
      },
    });

    return result.count;
  }

  /**
   * Find token for logout (lighter query without full user details)
   */
  async findTokenByHashForLogout(tokenHash: string): Promise<{
    id: string;
    userId: string;
    familyId: string;
    usedAt: Date | null;
    expiresAt: Date;
    revokedAt: Date | null;
  } | null> {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        familyId: true,
        usedAt: true,
        expiresAt: true,
        revokedAt: true,
      },
    });
  }

  /**
   * Detect token reuse (security check)
   */
  async detectReuse(tokenHash: string): Promise<RefreshToken | null> {
    const token = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        parentToken: true,
        childTokens: true,
      },
    });

    if (!token) {
      return null;
    }

    // Token is considered reused if it's already marked as used
    return token.usedAt ? token : null;
  }

  /**
   * Get all tokens in a family (for audit/investigation)
   */
  async getTokenFamily(familyId: string): Promise<RefreshToken[]> {
    return this.prisma.refreshToken.findMany({
      where: { familyId },
      orderBy: { generation: 'asc' },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });
  }
}
