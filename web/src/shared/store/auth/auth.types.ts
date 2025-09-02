/**
 * Auth Types and Interfaces
 * Matching backend DTOs for consistency
 */

/**
 * User Role
 */
export interface UserRole {
  id: string;
  name: string;
  description: string;
}

/**
 * User Permission
 */
export interface Permission {
  resource: string;
  action: string;
  scope: string;
}

/**
 * User data stored in the auth store
 */
export interface User {
  id: string;
  email: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
  otp?: string;
  deviceName?: string;
}

/**
 * Login API response - matches backend LoginResponseDto
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    email: string;
    organizationId: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    permissions: Permission[];
  };
  requiresOtp?: boolean;
}

/**
 * Refresh API response - matches backend RefreshResponseDto
 */
export interface RefreshResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    email: string;
    organizationId: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    permissions: Permission[];
  };
}

/**
 * Me API response - matches backend MeResponseDto
 */
export interface MeResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    email: string;
    organizationId: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    permissions: Permission[];
  };
}

/**
 * Logout API response
 */
export interface LogoutResponse {
  success: boolean;
  message: string;
}

/**
 * Auth store state
 */
export interface AuthState {
  // Persistent state (saved to sessionStorage)
  user: User | null;
  isAuthenticated: boolean;

  // Transient state (not persisted)
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  requiresOtp: boolean;
}

/**
 * Auth store actions
 */
export interface AuthActions {
  // Auth operations
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  initializeAuth: () => Promise<void>;

  // State management
  clearAuth: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Permission helpers
  hasPermission: (resource: string, action: string, scope?: string) => boolean;
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
}

/**
 * Complete auth store type
 */
export type AuthStore = AuthState & AuthActions;

/**
 * Helper type for permission string format
 */
export type PermissionString = `${string}:${string}:${string}`;
