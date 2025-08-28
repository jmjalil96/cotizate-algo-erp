import { PrismaClient } from '@prisma/client';

import { logger } from '../../../../config/logger.js';
import { AuditLogRepository } from '../../repositories/audit-log.repository.js';
import { RefreshTokenRepository } from '../../repositories/refresh-token.repository.js';
import { AUTH } from '../../shared/auth.constants.js';
import { generateFamilyId } from '../../shared/utils/device.util.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry,
  generateJti,
  parseExpiryToSeconds,
} from '../../shared/utils/jwt.util.js';

import {
  InvalidRefreshTokenError,
  RefreshFailedError,
  AccountInactiveError,
  EmailNotVerifiedError,
} from './session.errors.js';

import type { RefreshContext, RefreshResponseDto, TokenPair, JwtPayload } from './session.dto.js';

export class RefreshService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly auditRepo: AuditLogRepository
  ) {}

  async refresh(
    refreshTokenStr: string | undefined,
    context: RefreshContext
  ): Promise<{ response: RefreshResponseDto; tokens?: TokenPair }> {
    const log = context.logger ?? logger;

    log.debug({ hasToken: !!refreshTokenStr }, 'Refresh attempt started');

    // Step 1: Validate token exists
    if (!refreshTokenStr) {
      log.warn({ ipAddress: context.ipAddress }, 'Refresh attempted without token');
      throw new InvalidRefreshTokenError();
    }

    // Step 2: Hash token for lookup
    const tokenHash = hashRefreshToken(refreshTokenStr);

    // Step 3: Check for token reuse FIRST (SECURITY CRITICAL)
    log.debug('Checking for token reuse');
    const tokenForSecurity = await this.refreshTokenRepo.findByTokenHashForSecurity(tokenHash);

    if (tokenForSecurity?.usedAt) {
      const timeSinceUsed = tokenForSecurity.usedAt
        ? Date.now() - tokenForSecurity.usedAt.getTime()
        : Infinity;

      if (timeSinceUsed <= AUTH.REFRESH_TOKEN.ROTATION_REUSE_WINDOW) {
        // Within grace period - likely a race condition
        log.info(
          {
            tokenId: tokenForSecurity.id,
            familyId: tokenForSecurity.familyId,
            timeSinceUsed,
            ipAddress: context.ipAddress,
          },
          'Token reuse within grace period - likely race condition'
        );
        // Continue with refresh (could return cached response if implemented)
      } else {
        // SECURITY BREACH - Token reuse detected outside grace period
        log.error(
          {
            tokenId: tokenForSecurity.id,
            familyId: tokenForSecurity.familyId,
            generation: tokenForSecurity.generation,
            originalIP: tokenForSecurity.ipAddress,
            attackerIP: context.ipAddress,
            timeSinceUsed,
          },
          'SECURITY: Token reuse detected - revoking family'
        );

        // Revoke entire token family
        await this.refreshTokenRepo.revokeTokenFamily(
          tokenForSecurity.familyId,
          AUTH.REVOCATION_REASONS.REUSE_DETECTED
        );

        // Log security event
        await this.auditRepo.logTokenReuse({
          userId: tokenForSecurity.userId,
          tokenId: tokenForSecurity.id,
          familyId: tokenForSecurity.familyId,
          generation: tokenForSecurity.generation,
          attackerIP: context.ipAddress,
          originalIP: tokenForSecurity.ipAddress,
          deviceFingerprint: context.deviceFingerprint,
        });

        // Throw generic error (don't reveal security breach to attacker)
        throw new InvalidRefreshTokenError();
      }
    }

    // Step 4: Get valid token for normal flow
    log.debug('Fetching valid refresh token from database');
    const token = await this.refreshTokenRepo.findValidTokenByHash(tokenHash);

    if (!token) {
      log.warn(
        { tokenHash: tokenHash.slice(0, 10), ipAddress: context.ipAddress },
        'Refresh token not found or invalid'
      );
      throw new InvalidRefreshTokenError();
    }

    // Step 5: Check user and organization status
    const user = token.user;

    if (!user.isActive) {
      log.warn({ userId: user.id, email: user.email }, 'Refresh attempt for inactive user');
      throw new AccountInactiveError();
    }

    if (!user.organization.isActive) {
      log.warn(
        { userId: user.id, organizationId: user.organizationId },
        'Refresh attempt for user in inactive organization'
      );
      throw new AccountInactiveError();
    }

    if (!user.emailVerified) {
      log.warn({ userId: user.id, email: user.email }, 'Refresh attempt with unverified email');
      throw new EmailNotVerifiedError();
    }

    // Step 6: Check device fingerprint (log but don't block)
    if (token.deviceFingerprint !== context.deviceFingerprint) {
      log.warn(
        {
          userId: user.id,
          originalFingerprint: token.deviceFingerprint,
          currentFingerprint: context.deviceFingerprint,
          ipAddress: context.ipAddress,
        },
        'Device fingerprint mismatch during refresh - possible device change'
      );
      // Continue - user may have switched browsers
    }

    // Step 7: Handle generation limit - create new family if needed
    let familyId = token.familyId;
    let generation = token.generation + 1;
    let newFamilyCreated = false;

    if (token.generation >= AUTH.REFRESH_TOKEN.MAX_FAMILY_SIZE) {
      // Create new family instead of forcing re-login
      log.info(
        {
          userId: user.id,
          oldFamilyId: token.familyId,
          generation: token.generation,
        },
        'Token generation limit reached - creating new family'
      );

      familyId = generateFamilyId();
      generation = 1;
      newFamilyCreated = true;
    }

    // Step 8: Token rotation in transaction
    log.info({ userId: user.id, familyId, generation }, 'Rotating refresh token');

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Mark old token as used
        await this.refreshTokenRepo.markAsUsed(token.id, tx);

        // Format permissions for JWT
        const permissions = user.userRole.role.rolePermissions.map(
          (rp) => `${rp.permission.resource}:${rp.permission.action}:${rp.permission.scope}`
        );

        // Generate new access token
        const jwtPayload: JwtPayload = {
          sub: user.id,
          email: user.email,
          org: user.organizationId,
          role: user.userRole.role.id,
          permissions,
          jti: generateJti(),
        };
        const accessToken = generateAccessToken(jwtPayload);

        // Generate new refresh token
        const newRefreshToken = generateRefreshToken();
        const newRefreshTokenHash = hashRefreshToken(newRefreshToken);
        const refreshExpiresAt = getRefreshTokenExpiry();

        // Create rotated refresh token
        const rotatedToken = await this.refreshTokenRepo.createRotatedToken(
          {
            userId: user.id,
            tokenHash: newRefreshTokenHash,
            familyId,
            generation,
            parentTokenId: token.id,
            deviceName: token.deviceName, // Keep original device name
            deviceFingerprint: context.deviceFingerprint, // Update fingerprint
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            expiresAt: refreshExpiresAt,
          },
          tx
        );

        // Audit log
        await this.auditRepo.logRefresh(
          {
            userId: user.id,
            tokenId: rotatedToken.id,
            familyId,
            generation,
            newFamilyCreated,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
          },
          tx
        );

        return {
          accessToken,
          refreshToken: newRefreshToken,
          accessExpiresIn: parseExpiryToSeconds(AUTH.ACCESS_TOKEN.EXPIRES),
          refreshExpiresIn: parseExpiryToSeconds(AUTH.REFRESH_TOKEN.EXPIRES),
        };
      });

      log.info(
        {
          userId: user.id,
          familyId,
          generation,
          newFamilyCreated,
        },
        'Token refresh successful'
      );

      // Build response (same structure as login)
      const response: RefreshResponseDto = {
        success: true,
        message: 'Session refreshed successfully',
        data: {
          userId: user.id,
          email: user.email,
          organizationId: user.organizationId,
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          role: {
            id: user.userRole.role.id,
            name: user.userRole.role.name,
            description: user.userRole.role.description,
          },
          permissions: user.userRole.role.rolePermissions.map((rp) => ({
            resource: rp.permission.resource,
            action: rp.permission.action,
            scope: rp.permission.scope,
          })),
        },
      };

      return { response, tokens: result };
    } catch (error) {
      log.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: user.id,
          tokenId: token.id,
        },
        'Failed to rotate refresh token'
      );

      throw new RefreshFailedError('Unable to refresh session');
    }
  }
}
