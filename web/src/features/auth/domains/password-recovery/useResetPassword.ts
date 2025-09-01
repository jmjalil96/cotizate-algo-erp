import { useState, useCallback } from 'react';

import { getErrorMessage, getErrorCode } from '../../../../infrastructure/api/api.config';

import passwordRecoveryService, { type ResetPasswordResponse } from './password-recovery.service';

import type { ResetPasswordInput } from './password-recovery.schema';

/**
 * Reset password hook return type
 */
interface UseResetPasswordReturn {
  resetPassword: (data: ResetPasswordInput) => Promise<ResetPasswordResponse>;
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
  attemptCount: number;
  clearError: () => void;
}

/**
 * Custom hook for handling reset password functionality
 */
export function useResetPassword(): UseResetPasswordReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset password function
   */
  const resetPassword = useCallback(
    async (data: ResetPasswordInput): Promise<ResetPasswordResponse> => {
      setIsLoading(true);
      setError(null);
      setIsSuccess(false);

      try {
        const response = await passwordRecoveryService.resetPassword(data);

        // Check response.success field (not HTTP status)
        if (response.success) {
          setIsSuccess(true);
          setError(null);
          setAttemptCount(0); // Reset on success
        } else {
          // Reset failed - always show generic message
          setIsSuccess(false);
          setError('Invalid or expired reset code');
          setAttemptCount((prev) => prev + 1); // Track attempts client-side
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
          displayMessage = 'Invalid or expired reset code';
        }

        setError(displayMessage);
        setIsSuccess(false);

        // Re-throw to allow component to handle if needed
        throw error_;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    resetPassword,
    isLoading,
    error,
    isSuccess,
    attemptCount,
    clearError,
  };
}
