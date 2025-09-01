/**
 * Auth Interceptor - Handles 401 responses and token refresh
 */

/* eslint-disable unicorn/no-useless-promise-resolve-reject */
// Axios interceptors require explicit Promise.reject for proper error propagation

import { isAuthEndpoint, isSafeMethod } from '../../../shared/store/auth/auth.service';
import { useAuthStore } from '../../../shared/store/auth/auth.store';

import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Queue for failed requests during refresh
interface FailedRequest {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}

// Refresh state
let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

/**
 * Process the queue of failed requests
 */
const processQueue = (error: unknown = null): void => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });

  failedQueue = [];
};

/**
 * Add retry flag to request config
 */
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/**
 * Setup auth interceptor on axios instance
 */
export function setupAuthInterceptor(apiClient: AxiosInstance): void {
  // Response interceptor for handling 401s
  apiClient.interceptors.response.use(
    // Success - pass through
    (response) => response,

    // Error - handle 401s
    async (error: AxiosError) => {
      const originalRequest = error.config as RetryableRequestConfig;

      // If no config, can't retry
      if (!originalRequest) {
        throw error;
      }

      // Check if this is a 401 Unauthorized
      if (error.response?.status !== 401) {
        throw error;
      }

      // Skip refresh for auth endpoints to avoid loops
      if (isAuthEndpoint(originalRequest.url)) {
        // Clear auth state on 401 from auth endpoints
        if (originalRequest.url?.includes('/auth/refresh')) {
          useAuthStore.getState().clearAuth();
        }
        throw error;
      }

      // Check if already retried
      if (originalRequest._retry) {
        // Already retried, don't retry again
        throw error;
      }

      // Check if method is safe to retry
      if (!isSafeMethod(originalRequest.method)) {
        // Unsafe method, don't auto-retry
        console.warn(`Skipping auto-retry for unsafe method: ${originalRequest.method}`);
        throw error;
      }

      // Mark as retry attempt
      originalRequest._retry = true;

      // If already refreshing, queue this request
      if (isRefreshing) {
        // This is necessary for axios interceptor queue management
        // eslint-disable-next-line promise/no-promise-in-callback
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            // Retry the original request after refresh
            return apiClient(originalRequest);
          })
          .catch((error_) => {
            // Refresh failed, reject with original error
            throw error_;
          });
      }

      // Start refreshing
      isRefreshing = true;

      try {
        // Attempt to refresh the session
        await useAuthStore.getState().refreshSession();

        // Refresh succeeded, process queue
        processQueue();

        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, process queue with error
        processQueue(refreshError);

        // Clear auth state
        useAuthStore.getState().clearAuth();

        // Reject with the refresh error
        return Promise.reject(refreshError);
      } finally {
        // Reset refreshing state
        isRefreshing = false;
      }
    }
  );
}

/**
 * Check if currently refreshing (for debugging)
 */
export function isCurrentlyRefreshing(): boolean {
  return isRefreshing;
}

/**
 * Get queue size (for debugging)
 */
export function getQueueSize(): number {
  return failedQueue.length;
}
