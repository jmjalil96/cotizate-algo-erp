/**
 * useAuthInit Hook - Initialize auth on app startup
 */

import { useEffect } from 'react';

import { useAuthStore } from '../store/auth/auth.store';

import type { AuthStore, LoginCredentials } from '../store/auth/auth.types';

/**
 * Hook to initialize authentication on app mount
 *
 * @returns {object} Auth initialization state
 * @returns {boolean} isInitialized - Whether auth has been initialized
 * @returns {boolean} isLoading - Whether auth is currently loading
 * @returns {boolean} isAuthenticated - Whether user is authenticated
 *
 * @example
 * function App() {
 *   const { isInitialized, isLoading } = useAuthInit();
 *
 *   if (!isInitialized || isLoading) {
 *     return <LoadingScreen />;
 *   }
 *
 *   return <Routes />;
 * }
 */
export function useAuthInit(): {
  isInitialized: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
} {
  const { isInitialized, isLoading, isAuthenticated, initializeAuth } = useAuthStore();

  useEffect(() => {
    // Initialize auth on mount
    initializeAuth().catch((error) => {
      // Log initialization errors but don't throw
      // The app should still be usable even if refresh fails
      console.error('Auth initialization error:', error);
    });
  }, [initializeAuth]); // Zustand ensures stable function reference

  return {
    isInitialized,
    isLoading,
    isAuthenticated,
  };
}

/**
 * Hook to get auth state and actions
 * This is a convenience wrapper around useAuthStore
 *
 * @example
 * function LoginForm() {
 *   const { login, isLoading, error } = useAuth();
 *
 *   const handleSubmit = async (data) => {
 *     await login(data);
 *   };
 * }
 */
export function useAuth(): {
  user: AuthStore['user'];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  hasPermission: (resource: string, action: string, scope?: string) => boolean;
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
} {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearError,
    hasPermission,
    hasRole,
    hasAnyRole,
  } = useAuthStore();

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,

    // Actions
    login,
    logout,
    clearError,

    // Helpers
    hasPermission,
    hasRole,
    hasAnyRole,
  };
}

/**
 * Hook to check if user has a specific permission
 *
 * @param resource - Resource name
 * @param action - Action name
 * @param scope - Optional scope (defaults to '*')
 *
 * @example
 * function AdminPanel() {
 *   const canViewUsers = usePermission('users', 'read');
 *
 *   if (!canViewUsers) {
 *     return <AccessDenied />;
 *   }
 * }
 */
export function usePermission(resource: string, action: string, scope?: string): boolean {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  return hasPermission(resource, action, scope);
}

/**
 * Hook to check if user has a specific role
 *
 * @param roleName - Role name to check
 *
 * @example
 * function AdminRoute() {
 *   const isAdmin = useRole('admin');
 *
 *   if (!isAdmin) {
 *     return <Navigate to="/" />;
 *   }
 * }
 */
export function useRole(roleName: string): boolean {
  const hasRole = useAuthStore((state) => state.hasRole);
  return hasRole(roleName);
}
