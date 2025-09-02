import apiClient from '../../../../infrastructure/api/api.config';

import type { ForgotPasswordInput, ResetPasswordInput } from './password-recovery.schema';

/**
 * Forgot password response data
 */
export interface ForgotPasswordData {
  email: string;
  cooldownSeconds?: number;
}

/**
 * Forgot password response
 */
export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  data?: ForgotPasswordData;
}

/**
 * Reset password response
 */
export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

/**
 * Password Recovery Service
 */
class PasswordRecoveryService {
  /**
   * Request password reset code
   */
  async forgotPassword(data: ForgotPasswordInput): Promise<ForgotPasswordResponse> {
    const response = await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', data);
    return response.data;
  }

  /**
   * Reset password with OTP code
   */
  async resetPassword(data: ResetPasswordInput): Promise<ResetPasswordResponse> {
    const response = await apiClient.post<ResetPasswordResponse>('/auth/reset-password', data);
    return response.data;
  }
}

export default new PasswordRecoveryService();
