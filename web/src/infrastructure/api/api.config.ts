import axios, { AxiosError } from 'axios';

import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

/**
 * API Error type matching server error format
 */
export interface ApiError {
  error: string;
  message: string;
  requestId?: string;
  details?: {
    path: string;
    message: string;
  }[];
  stack?: string;
}

/**
 * Generic API Response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * API Configuration
 */
const API_CONFIG = {
  baseURL: '/api/v1',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true, // Include cookies for auth
};

/**
 * Create and configure axios instance
 */
const apiClient: AxiosInstance = axios.create(API_CONFIG);

/**
 * Request interceptor
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add request ID for tracking
    const requestId = generateRequestId();
    config.headers['X-Request-Id'] = requestId;

    // Log in development
    if (import.meta.env.DEV) {
      console.info(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        requestId,
        data: config.data,
        params: config.params,
      });
    }

    // Placeholder for future auth token handling
    // const token = getAuthToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }

    return config;
  },
  (error: AxiosError) => {
    if (import.meta.env.DEV) {
      console.error('[API Request Error]', error);
    }
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 */
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.info(
        `[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`,
        {
          status: response.status,
          data: response.data,
          requestId: response.headers['x-request-id'],
        }
      );
    }

    return response;
  },
  (error: AxiosError<ApiError>) => {
    // Extract error details from server response
    let errorMessage = 'An unexpected error occurred';
    let errorCode = 'UNKNOWN_ERROR';
    let errorDetails: ApiError['details'];

    if (error.response) {
      // Server responded with error
      const { data, status, headers } = error.response;

      if (data && typeof data === 'object') {
        errorMessage = data.message ?? errorMessage;
        errorCode = data.error ?? errorCode;
        errorDetails = data.details;
      }

      // Log error in development
      if (import.meta.env.DEV) {
        console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
          status,
          error: errorCode,
          message: errorMessage,
          details: errorDetails,
          requestId: headers['x-request-id'],
        });
      }

      // Create enhanced error object
      const enhancedError: AxiosError<ApiError> = error;
      enhancedError.message = errorMessage;
      enhancedError.code = errorCode;

      return Promise.reject(enhancedError);
    }

    if (error.request) {
      // Request was made but no response received
      errorMessage = 'No response from server';
      errorCode = 'NETWORK_ERROR';

      if (import.meta.env.DEV) {
        console.error('[API Network Error]', {
          url: error.config?.url,
          method: error.config?.method,
          message: errorMessage,
        });
      }
    }

    // Something else happened
    error.message = errorMessage;
    error.code = errorCode;

    return Promise.reject(error);
  }
);

/**
 * Export configured axios instance
 */
export default apiClient;

/**
 * Helper function to check if error is an API error
 */
export function isApiError(error: unknown): error is AxiosError<ApiError> {
  return axios.isAxiosError(error);
}

/**
 * Helper function to extract error message
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.response?.data?.message ?? error.message ?? 'An unexpected error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

/**
 * Helper function to extract error code
 */
export function getErrorCode(error: unknown): string {
  if (isApiError(error)) {
    return error.response?.data?.error ?? error.code ?? 'UNKNOWN_ERROR';
  }
  return 'UNKNOWN_ERROR';
}

/**
 * Helper function to extract validation errors
 */
export function getValidationErrors(error: unknown): ApiError['details'] | undefined {
  if (isApiError(error)) {
    return error.response?.data?.details;
  }
  return undefined;
}
