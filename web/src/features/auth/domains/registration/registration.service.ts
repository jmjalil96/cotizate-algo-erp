import apiService from '../../../../infrastructure/api/api.service';

import type { RegisterInput } from './registration.schema';
import type { VerifyEmailInput, ResendVerificationInput } from './verify-email.schema';

/**
 * Registration response data
 */
export interface RegisterData {
  userId: string;
  organizationId: string;
  email: string;
}

/**
 * Registration response
 */
export interface RegisterResponse {
  success: boolean;
  message: string;
  data: RegisterData;
}

/**
 * Verify email response
 */
export interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

/**
 * Resend verification response data
 */
export interface ResendVerificationData {
  email: string;
  cooldownSeconds?: number;
}

/**
 * Resend verification response
 */
export interface ResendVerificationResponse {
  success: boolean;
  message: string;
  data?: ResendVerificationData;
}

/**
 * Registration Service
 */
class RegistrationService {
  /**
   * Register new user and organization
   */
  async register(data: RegisterInput): Promise<RegisterResponse> {
    const response = await apiService.post<RegisterResponse>('/auth/register', data);
    return response.data;
  }

  /**
   * Verify email with OTP code
   */
  async verifyEmail(data: VerifyEmailInput): Promise<VerifyEmailResponse> {
    const response = await apiService.post<VerifyEmailResponse>('/auth/verify-email', data);
    return response.data;
  }

  /**
   * Resend verification code
   */
  async resendVerification(data: ResendVerificationInput): Promise<ResendVerificationResponse> {
    const response = await apiService.post<ResendVerificationResponse>(
      '/auth/resend-verification',
      data
    );
    return response.data;
  }
}

export default new RegistrationService();
