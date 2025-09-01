import { useState, useCallback } from 'react';

import { getErrorMessage, getErrorCode } from '../../../../infrastructure/api/api.config';

import passwordRecoveryService, {
  type ForgotPasswordResponse,
  type ForgotPasswordData,
} from './password-recovery.service';

import type { ForgotPasswordInput } from './password-recovery.schema';

/**
 * Forgot password hook return type
 */
interface UseForgotPasswordReturn {
  forgotPassword: (email: string) => Promise<ForgotPasswordResponse>;
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
  cooldownSeconds: number | undefined;
  forgotPasswordData: ForgotPasswordData | null;
  clearError: () => void;
  reset: () => void;
}

/**
 * Custom hook for handling forgot password functionality
 */
export function useForgotPassword(): UseForgotPasswordReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number | undefined>(undefined);
  const [forgotPasswordData, setForgotPasswordData] = useState<ForgotPasswordData | null>(null);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset all states
   */
  const reset = useCallback(() => {
    setError(null);
    setIsSuccess(false);
    setCooldownSeconds(undefined);
    setForgotPasswordData(null);
    setIsLoading(false);
  }, []);

  /**
   * Forgot password function
   */
  const forgotPassword = useCallback(async (email: string): Promise<ForgotPasswordResponse> => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      const data: ForgotPasswordInput = { email };
      const response = await passwordRecoveryService.forgotPassword(data);

      // Always show success (anti-enumeration feature)
      // Even if email doesn't exist
      setIsSuccess(true);

      // Extract cooldown from response data if present
      if (response.data?.cooldownSeconds) {
        setCooldownSeconds(response.data.cooldownSeconds);
      }

      // Store the response data
      setForgotPasswordData(response.data ?? null);

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
        displayMessage = 'Please enter a valid email address.';
      } else if (errorCode === 'RATE_LIMIT') {
        displayMessage = 'Too many requests. Please wait before trying again.';
      }

      setError(displayMessage);
      setIsSuccess(false);
      setCooldownSeconds(undefined);
      setForgotPasswordData(null);

      // Re-throw to allow component to handle if needed
      throw error_;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    forgotPassword,
    isLoading,
    error,
    isSuccess,
    cooldownSeconds,
    forgotPasswordData,
    clearError,
    reset,
  };
}
