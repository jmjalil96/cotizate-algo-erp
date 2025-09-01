import { useState, useCallback } from 'react';

import { getErrorMessage, getErrorCode } from '../../../../infrastructure/api/api.config';

import registrationService, {
  type ResendVerificationResponse,
  type ResendVerificationData,
} from './registration.service';

import type { ResendVerificationInput } from './verify-email.schema';

/**
 * Resend verification hook return type
 */
interface UseResendVerificationReturn {
  resendVerification: (email: string) => Promise<ResendVerificationResponse>;
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
  cooldownSeconds: number | undefined;
  verificationData: ResendVerificationData | null;
  clearError: () => void;
  reset: () => void;
}

/**
 * Custom hook for handling resend verification functionality
 */
export function useResendVerification(): UseResendVerificationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number | undefined>(undefined);
  const [verificationData, setVerificationData] = useState<ResendVerificationData | null>(null);

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
    setVerificationData(null);
    setIsLoading(false);
  }, []);

  /**
   * Resend verification function
   */
  const resendVerification = useCallback(
    async (email: string): Promise<ResendVerificationResponse> => {
      setIsLoading(true);
      setError(null);
      setIsSuccess(false);

      try {
        const data: ResendVerificationInput = { email };
        const response = await registrationService.resendVerification(data);

        // Always show success (anti-enumeration feature)
        // Even if email doesn't exist or already verified
        setIsSuccess(true);

        // Extract cooldown from response data if present
        if (response.data?.cooldownSeconds) {
          setCooldownSeconds(response.data.cooldownSeconds);
        }

        // Store the verification data
        setVerificationData(response.data ?? null);

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
        setVerificationData(null);

        // Re-throw to allow component to handle if needed
        throw error_;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    resendVerification,
    isLoading,
    error,
    isSuccess,
    cooldownSeconds,
    verificationData,
    clearError,
    reset,
  };
}
