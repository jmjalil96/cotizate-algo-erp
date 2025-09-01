import apiService from '../../../../infrastructure/api/api.service';

import type { LoginInput } from './session.schema';

/**
 * Permission type
 */
interface Permission {
  resource: string;
  action: string;
  scope: string;
}

/**
 * Role information
 */
interface Role {
  id: string;
  name: string;
  description: string;
}

/**
 * User data returned on successful login
 */
export interface UserData {
  userId: string;
  email: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  role: Role;
  permissions: Permission[];
}

/**
 * Successful login response
 */
export interface LoginSuccessResponse {
  success: true;
  message: string;
  data: UserData;
}

/**
 * OTP required response
 */
export interface OtpRequiredResponse {
  success: false;
  message: string;
  requiresOtp: true;
}

/**
 * Login response type (union of success and OTP required)
 */
export type LoginResponse = LoginSuccessResponse | OtpRequiredResponse;

/**
 * Session Service
 */
class SessionService {
  /**
   * Login user with email and password (and optional OTP)
   */
  async login(data: LoginInput): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>('/auth/login', data);
    return response.data;
  }
}

export default new SessionService();
