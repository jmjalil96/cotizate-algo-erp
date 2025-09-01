/**
 * Auth Store - Zustand store for authentication state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { getErrorMessage, getErrorCode } from '../../../infrastructure/api/api.config';

import { loginApi, logoutApi, refreshApi, transformUserData } from './auth.service';

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

      // Login action
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });

        try {
          const response = await loginApi(credentials);

          if (response.requiresOtp) {
            set({ isLoading: false });
            throw new Error('OTP_REQUIRED');
          }

          if (response.success && response.data) {
            const user = transformUserData(response.data);
            if (user) {
              set({
                user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
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
          if (errorCode === 'OTP_REQUIRED') {
            userMessage = 'Please enter the OTP sent to your email';
          } else if (errorCode === 'INVALID_CREDENTIALS') {
            userMessage = 'Invalid email or password';
          } else if (errorCode === 'ACCOUNT_INACTIVE') {
            userMessage = 'Your account is inactive. Please contact support.';
          } else if (errorCode === 'EMAIL_NOT_VERIFIED') {
            userMessage = 'Please verify your email before logging in';
          }

          set({
            isLoading: false,
            error: userMessage,
            isAuthenticated: false,
            user: null,
          });

          throw error;
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

        // If we have a stored user, validate the session
        if (state.user) {
          try {
            await get().refreshSession();
          } catch {
            // Session invalid, clear storage
            console.info('Session validation failed, clearing auth');
            get().clearAuth();
          }
        }

        // Mark as initialized
        set({ isInitialized: true });
      },

      // Clear auth state
      clearAuth: () => {
        set({
          user: null,
          isAuthenticated: false,
          error: null,
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
