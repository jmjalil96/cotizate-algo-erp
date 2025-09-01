import { useState, useCallback } from 'react';

import { getErrorMessage, getErrorCode } from '../../../../infrastructure/api/api.config';

import registrationService, { type VerifyEmailResponse } from './registration.service';

import type { VerifyEmailInput } from './verify-email.schema';

/**
 * Verify email hook return type
 */
interface UseVerifyEmailReturn {
  verifyEmail: (data: VerifyEmailInput) => Promise<VerifyEmailResponse>;
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
  clearError: () => void;
}

/**
 * Custom hook for handling email verification functionality
 */
export function useVerifyEmail(): UseVerifyEmailReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Verify email function
   */
  const verifyEmail = useCallback(async (data: VerifyEmailInput): Promise<VerifyEmailResponse> => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      const response = await registrationService.verifyEmail(data);

      // Check response.success field (not HTTP status)
      if (response.success) {
        setIsSuccess(true);
        setError(null);
      } else {
        // Verification failed - always show generic message
        setIsSuccess(false);
        setError('Invalid or expired verification code');
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
      } else if (errorCode === 'VALIDATION_ERROR') {
        displayMessage = 'Please check the form fields and try again.';
      } else {
        // For any other error, always show generic message for security
        displayMessage = 'Invalid or expired verification code';
      }

      setError(displayMessage);
      setIsSuccess(false);

      // Re-throw to allow component to handle if needed
      throw error_;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    verifyEmail,
    isLoading,
    error,
    isSuccess,
    clearError,
  };
}
