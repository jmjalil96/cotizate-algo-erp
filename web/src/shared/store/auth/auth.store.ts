/**
 * Auth Store - Zustand store for authentication state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { getErrorMessage, getErrorCode } from '../../../infrastructure/api/api.config';

import { loginApi, logoutApi, refreshApi, meApi, transformUserData } from './auth.service';

import type { AuthStore, LoginCredentials } from './auth.types';

/**
 * Create the auth store with Zustand
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,
      requiresOtp: false,

      // Login action
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null, requiresOtp: false });

        try {
          const response = await loginApi(credentials);

          if (response.requiresOtp) {
            // OTP required - don't throw, just update state
            set({
              isLoading: false,
              requiresOtp: true,
              error: null,
            });
            return; // Return early, waiting for OTP
          }

          if (response.success && response.data) {
            const user = transformUserData(response.data);
            if (user) {
              set({
                user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
                requiresOtp: false,
              });
            } else {
              throw new Error('Invalid user data received');
            }
          } else {
            throw new Error(response.message || 'Login failed');
          }
        } catch (error) {
          const errorCode = getErrorCode(error);
          const errorMessage = getErrorMessage(error);

          // Handle specific error codes
          let userMessage = errorMessage;
          if (errorCode === 'INVALID_CREDENTIALS') {
            userMessage = 'Invalid email or password';
          } else if (errorCode === 'INVALID_OTP') {
            userMessage = 'Invalid or expired verification code';
          } else if (errorCode === 'ACCOUNT_INACTIVE') {
            userMessage = 'Your account is inactive. Please contact support.';
          } else if (errorCode === 'EMAIL_NOT_VERIFIED') {
            userMessage = 'Please verify your email before logging in';
          } else if (errorCode === 'NETWORK_ERROR') {
            userMessage = 'Unable to connect to server. Please check your connection.';
          }

          set({
            isLoading: false,
            error: userMessage,
            isAuthenticated: false,
            user: null,
            requiresOtp: false,
          });

          // Don't re-throw - let the component handle via error state
        }
      },

      // Logout action
      logout: async () => {
        set({ isLoading: true, error: null });

        try {
          await logoutApi();
        } catch (error) {
          // Log error but continue with local logout
          console.error('Logout API error:', getErrorMessage(error));
        } finally {
          // Always clear local state
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            requiresOtp: false,
          });
        }
      },

      // Refresh session action
      refreshSession: async () => {
        try {
          const response = await refreshApi();

          if (response.success && response.data) {
            const user = transformUserData(response.data);
            if (user) {
              set({
                user,
                isAuthenticated: true,
                error: null,
              });
            } else {
              throw new Error('Invalid user data received');
            }
          } else {
            throw new Error(response.message || 'Session refresh failed');
          }
        } catch (error) {
          const errorCode = getErrorCode(error);

          // Handle specific refresh errors
          if (
            errorCode === 'INVALID_REFRESH_TOKEN' ||
            errorCode === 'TOKEN_EXPIRED' ||
            errorCode === 'SESSION_EXPIRED'
          ) {
            // Clear auth state on invalid refresh
            get().clearAuth();
          }

          throw error;
        }
      },

      // Initialize auth (called on app startup)
      initializeAuth: async () => {
        const state = get();

        // If already initialized, skip
        if (state.isInitialized) return;

        // Always validate session on boot using /auth/me
        try {
          const response = await meApi();

          if (response.success && response.data) {
            const user = transformUserData(response.data);
            if (user) {
              set({
                user,
                isAuthenticated: true,
                error: null,
              });
            } else {
              throw new Error('Invalid user data received from /me');
            }
          } else {
            throw new Error(response.message || 'Failed to fetch user details');
          }
        } catch (error) {
          const errorCode = getErrorCode(error);
          const errorMessage = getErrorMessage(error);

          // Handle specific error codes
          if (errorCode === 'INVALID_ACCESS_TOKEN' || errorCode === 'TOKEN_EXPIRED') {
            // Access token invalid/expired, will be handled by interceptor
            // which will attempt refresh and retry /me
            console.info('Access token invalid/expired on boot, interceptor will handle refresh');
          } else if (errorCode === 'ACCOUNT_INACTIVE' || errorCode === 'EMAIL_NOT_VERIFIED') {
            // Account issues - clear auth completely
            console.warn(`Account issue on boot: ${errorCode}`);
            get().clearAuth();
          } else if (errorCode === 'INVALID_REFRESH_TOKEN' || errorCode === 'SESSION_EXPIRED') {
            // Refresh also failed - clear auth
            console.info('Session expired, clearing auth');
            get().clearAuth();
          } else {
            // Other errors (network, etc.) - clear auth to be safe
            console.error('Auth initialization error:', errorMessage);
            get().clearAuth();
          }
        } finally {
          // Always mark as initialized, regardless of outcome
          set({ isInitialized: true });
        }
      },

      // Clear auth state
      clearAuth: () => {
        set({
          user: null,
          isAuthenticated: false,
          error: null,
          requiresOtp: false,
        });
      },

      // Set error
      setError: (error: string | null) => {
        set({ error });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Permission check
      hasPermission: (resource: string, action: string, scope = '*') => {
        const { user } = get();
        if (!user) return false;

        return user.permissions.some(
          (perm) =>
            perm.resource === resource &&
            perm.action === action &&
            (perm.scope === '*' || perm.scope === scope)
        );
      },

      // Role check
      hasRole: (roleName: string) => {
        const { user } = get();
        if (!user) return false;

        return user.role.name === roleName;
      },

      // Check for any of the roles
      hasAnyRole: (roleNames: string[]) => {
        const { user } = get();
        if (!user) return false;

        return roleNames.includes(user.role.name);
      },
    }),
    {
      name: 'auth-storage', // Storage key
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage
      partialize: (state) => ({
        // Only persist these fields
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Export helper selectors
export const selectUser = (state: AuthStore): AuthStore['user'] => state.user;
export const selectIsAuthenticated = (state: AuthStore): boolean => state.isAuthenticated;
export const selectIsInitialized = (state: AuthStore): boolean => state.isInitialized;
export const selectIsLoading = (state: AuthStore): boolean => state.isLoading;
export const selectError = (state: AuthStore): string | null => state.error;
