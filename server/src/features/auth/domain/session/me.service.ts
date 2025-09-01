import { logger } from '../../../../config/logger.js';
import { UserRepository } from '../../repositories/user.repository.js';

import {
  AccountInactiveError,
  EmailNotVerifiedError,
  UserNotFoundError,
  MeFailedError,
} from './session.errors.js';

import type { MeContext, MeResponseDto } from './session.dto.js';

export class MeService {
  constructor(private readonly userRepo: UserRepository) {}

  async me(context: MeContext): Promise<MeResponseDto> {
    const log = context.logger ?? logger;
    const { userId, jwtPayload, ipAddress, deviceFingerprint } = context;
    const { email: jwtEmail, jti, org, permissions: jwtPermissions } = jwtPayload;

    log.debug(
      {
        userId,
        jti,
        email: jwtEmail,
        org,
      },
      'Fetching user details for /me endpoint'
    );

    try {
      // Step 1: Fetch fresh user data with all relations
      const user = await this.userRepo.findWithDetailsById(userId);

      // Step 2: Check if user exists (JWT valid but user deleted)
      if (!user) {
        log.error(
          {
            userId,
            jwtEmail,
            ipAddress,
          },
          'JWT valid but user not found - likely deleted user'
        );
        throw new UserNotFoundError(userId);
      }

      const {
        email: userEmail,
        organizationId,
        isActive,
        emailVerified,
        profile,
        userRole,
        organization,
      } = user;

      log.debug(
        {
          userId,
          email: userEmail,
          organizationId,
        },
        'User found, checking account status'
      );

      // Step 3: Check if user is active
      if (!isActive) {
        log.warn(
          {
            userId,
            email: userEmail,
          },
          '/me request for inactive user'
        );
        throw new AccountInactiveError();
      }

      // Step 4: Check if organization is active
      if (!organization.isActive) {
        log.warn(
          {
            userId,
            organizationId,
            email: userEmail,
          },
          '/me request for user in inactive organization'
        );
        throw new AccountInactiveError();
      }

      // Step 5: Check if email is verified
      if (!emailVerified) {
        log.warn(
          {
            userId,
            email: userEmail,
          },
          '/me request with unverified email'
        );
        throw new EmailNotVerifiedError();
      }

      // Step 6: Compare JWT permissions with fresh permissions (optional logging)
      const { role } = userRole;
      const { rolePermissions, id: roleId, name: roleName, description: roleDescription } = role;
      const freshPermissions = rolePermissions.map(
        (rp) => `${rp.permission.resource}:${rp.permission.action}:${rp.permission.scope}`
      );

      const permissionsMatch =
        jwtPermissions.length === freshPermissions.length &&
        jwtPermissions.every((p) => freshPermissions.includes(p));

      if (!permissionsMatch) {
        log.info(
          {
            userId,
            jwtPermissions: jwtPermissions.length,
            freshPermissions: freshPermissions.length,
            jti,
          },
          'JWT permissions differ from database - JWT may be stale'
        );
      }

      // Step 7: Build response - EXACT same structure as login/refresh
      const response: MeResponseDto = {
        success: true,
        message: 'User details retrieved successfully',
        data: {
          userId,
          email: userEmail,
          organizationId,
          firstName: profile.firstName,
          lastName: profile.lastName,
          role: {
            id: roleId,
            name: roleName,
            description: roleDescription,
          },
          permissions: rolePermissions.map((rp) => ({
            resource: rp.permission.resource,
            action: rp.permission.action,
            scope: rp.permission.scope,
          })),
        },
      };

      log.info(
        {
          userId,
          email: userEmail,
          organizationId,
          ipAddress,
          deviceFingerprint,
        },
        '/me endpoint successful'
      );

      return response;
    } catch (error) {
      // Re-throw known errors
      if (
        error instanceof UserNotFoundError ||
        error instanceof AccountInactiveError ||
        error instanceof EmailNotVerifiedError
      ) {
        throw error;
      }

      // Log unexpected errors
      log.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId,
          ipAddress,
        },
        'Unexpected error in /me endpoint'
      );

      throw new MeFailedError('Unable to retrieve user details');
    }
  }
}
