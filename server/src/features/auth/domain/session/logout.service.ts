import { logger } from '../../../../config/logger.js';
import { AuditLogRepository } from '../../repositories/audit-log.repository.js';
import { RefreshTokenRepository } from '../../repositories/refresh-token.repository.js';
import { AUTH } from '../../shared/auth.constants.js';
import { hashRefreshToken } from '../../shared/utils/jwt.util.js';

import type { LogoutRequestDto, LogoutResponseDto, LogoutContext } from './session.dto.js';

export class LogoutService {
  constructor(
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly auditRepo: AuditLogRepository
  ) {}

  async logout(
    refreshTokenStr: string | undefined,
    dto: LogoutRequestDto,
    context: LogoutContext
  ): Promise<LogoutResponseDto> {
    const log = context.logger ?? logger;
    const { everywhere = false } = dto;

    let userId: string | null = null;
    let familyId: string | undefined;
    let tokensRevoked = 0;
    const tokenMissing = !refreshTokenStr;

    // Step 1: Process token if provided
    if (refreshTokenStr) {
      log.debug('Processing refresh token for logout');

      try {
        // Hash token for lookup
        const tokenHash = hashRefreshToken(refreshTokenStr);

        // Lightweight lookup
        const token = await this.refreshTokenRepo.findTokenByHashForLogout(tokenHash);

        if (!token) {
          log.warn(
            {
              ipAddress: context.ipAddress,
            },
            'Logout attempted with unknown token'
          );
          // Continue with logout anyway
        } else {
          userId = token.userId;
          familyId = token.familyId;

          log.debug(
            {
              userId,
              familyId,
              tokenExpired: token.expiresAt < new Date(),
              tokenRevoked: !!token.revokedAt,
              tokenUsed: !!token.usedAt,
            },
            'Token found for logout'
          );

          // Step 2: Revoke tokens based on scope
          if (everywhere) {
            log.info({ userId }, 'Revoking all user tokens (logout everywhere)');

            try {
              tokensRevoked = await this.refreshTokenRepo.revokeAllUserTokens(
                userId,
                AUTH.REVOCATION_REASONS.LOGOUT_EVERYWHERE
              );
              log.info({ userId, tokensRevoked }, 'All user tokens revoked successfully');
            } catch (error) {
              log.error(
                {
                  error: error instanceof Error ? error.message : 'Unknown error',
                  userId,
                },
                'Failed to revoke all user tokens'
              );
              // Continue anyway - best effort
            }
          } else {
            log.info({ userId, familyId }, 'Revoking token family');

            try {
              // Revoke family and get count
              tokensRevoked = await this.refreshTokenRepo.revokeTokenFamily(
                familyId,
                AUTH.REVOCATION_REASONS.LOGOUT
              );

              log.info({ userId, familyId, tokensRevoked }, 'Token family revoked successfully');
            } catch (error) {
              log.error(
                {
                  error: error instanceof Error ? error.message : 'Unknown error',
                  userId,
                  familyId,
                },
                'Failed to revoke token family'
              );
              // Continue anyway - best effort
            }
          }
        }
      } catch (error) {
        log.error(
          {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          'Unexpected error processing token for logout'
        );
        // Continue with logout anyway
      }
    } else {
      log.debug('No refresh token provided for logout');
    }

    // Step 3: Audit log (best effort)
    try {
      await this.auditRepo.logLogout({
        userId,
        action: everywhere ? 'USER_LOGOUT_EVERYWHERE' : 'USER_LOGOUT',
        ...(familyId && { familyId }),
        tokensRevoked,
        ...(tokenMissing && { tokenMissing }),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      log.debug('Logout audit log created');
    } catch (error) {
      log.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId,
        },
        'Failed to create logout audit log'
      );
      // Continue anyway - audit failure shouldn't block logout
    }

    // Step 4: Build response - ALWAYS SUCCESS
    const message = everywhere
      ? 'Logged out from all devices successfully'
      : 'Logged out successfully';

    log.info(
      {
        userId,
        familyId,
        tokensRevoked,
        everywhere,
        tokenMissing,
      },
      'Logout completed successfully'
    );

    return {
      success: true,
      message,
      data: {
        sessionsRevoked: tokensRevoked,
      },
    };
  }
}
