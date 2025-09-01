import { useState, useCallback } from 'react';

import { getErrorMessage, getErrorCode } from '../../../../infrastructure/api/api.config';

import sessionService, { type LoginResponse, type UserData } from './session.service';

import type { LoginInput } from './session.schema';

/**
 * Login hook return type
 */
interface UseLoginReturn {
  login: (data: LoginInput) => Promise<LoginResponse>;
  isLoading: boolean;
  error: string | null;
  requiresOtp: boolean;
  userData: UserData | null;
  clearError: () => void;
}

/**
 * Custom hook for handling login functionality
 */
export function useLogin(): UseLoginReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Login function
   */
  const login = useCallback(async (data: LoginInput): Promise<LoginResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await sessionService.login(data);

      // Handle response based on type
      if (response.success) {
        // Successful login
        setUserData(response.data);
        setRequiresOtp(false);
      } else if (response.requiresOtp) {
        // OTP required
        setRequiresOtp(true);
        setUserData(null);
      }

      return response;
    } catch (error_) {
      // Extract error message
      const errorMessage = getErrorMessage(error_);
      const errorCode = getErrorCode(error_);

      // Set user-friendly error message based on error code
      let displayMessage = errorMessage;

      if (errorCode === 'NETWORK_ERROR') {
        displayMessage = 'Unable to connect to server. Please check your connection.';
      } else if (errorCode === 'INVALID_CREDENTIALS') {
        displayMessage = 'Invalid email or password';
      } else if (errorCode === 'EMAIL_NOT_VERIFIED') {
        displayMessage = 'Please verify your email to continue';
      } else if (errorCode === 'ACCOUNT_INACTIVE') {
        displayMessage = 'Your account has been restricted. Please contact support.';
      } else if (errorCode === 'INVALID_OTP') {
        displayMessage = 'Invalid or expired verification code';
      }

      setError(displayMessage);
      setRequiresOtp(false);
      setUserData(null);

      // Re-throw to allow component to handle if needed
      throw error_;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    login,
    isLoading,
    error,
    requiresOtp,
    userData,
    clearError,
  };
}
