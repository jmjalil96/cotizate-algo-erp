/**
 * Auth Service - API calls for authentication
 */

import apiClient from '../../../infrastructure/api/api.config';

import type {
  LoginCredentials,
  LoginResponse,
  RefreshResponse,
  LogoutResponse,
} from './auth.types';

// Auth endpoints configuration
const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
} as const;

// Timeout for auth endpoints (15 seconds)
const AUTH_TIMEOUT = 15000;

/**
 * Login API call
 */
export async function loginApi(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(
    AUTH_ENDPOINTS.LOGIN,
    {
      email: credentials.email.toLowerCase(),
      password: credentials.password,
      otp: credentials.otp,
      deviceName: credentials.deviceName,
    },
    {
      timeout: AUTH_TIMEOUT,
    }
  );

  return response.data;
}

/**
 * Logout API call
 */
export async function logoutApi(): Promise<LogoutResponse> {
  const response = await apiClient.post<LogoutResponse>(
    AUTH_ENDPOINTS.LOGOUT,
    {},
    {
      timeout: AUTH_TIMEOUT,
    }
  );

  return response.data;
}

/**
 * Refresh session API call
 * Note: Refresh token is sent automatically via httpOnly cookie
 */
export async function refreshApi(): Promise<RefreshResponse> {
  const response = await apiClient.post<RefreshResponse>(
    AUTH_ENDPOINTS.REFRESH,
    {}, // Empty body - refresh token comes from cookie
    {
      timeout: AUTH_TIMEOUT,
      // withCredentials is already true in api.config
    }
  );

  return response.data;
}

/**
 * Check if a path is an auth endpoint (to skip refresh attempts)
 */
export function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;

  return Object.values(AUTH_ENDPOINTS).some((endpoint) => url.includes(endpoint));
}

/**
 * Check if a method is safe to retry after refresh
 */
export function isSafeMethod(method?: string): boolean {
  const SAFE_METHODS = ['get', 'head', 'options'];
  return SAFE_METHODS.includes(method?.toLowerCase() ?? '');
}

/**
 * Transform API user data to store user format
 */
export function transformUserData(data: LoginResponse['data'] | RefreshResponse['data']): {
  id: string;
  email: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  role: {
    id: string;
    name: string;
    description: string;
  };
  permissions: {
    resource: string;
    action: string;
    scope: string;
  }[];
} | null {
  if (!data) return null;

  return {
    id: data.userId,
    email: data.email,
    organizationId: data.organizationId,
    firstName: data.firstName,
    lastName: data.lastName,
    role: data.role,
    permissions: data.permissions,
  };
}
