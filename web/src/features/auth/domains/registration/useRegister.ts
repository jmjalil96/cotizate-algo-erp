import { useState, useCallback } from 'react';

import { getErrorMessage, getErrorCode } from '../../../../infrastructure/api/api.config';

import registrationService, {
  type RegisterResponse,
  type RegisterData,
} from './registration.service';

import type { RegisterInput } from './registration.schema';

/**
 * Register hook return type
 */
interface UseRegisterReturn {
  register: (data: RegisterInput) => Promise<RegisterResponse>;
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
  registrationData: RegisterData | null;
  clearError: () => void;
  reset: () => void;
}

/**
 * Custom hook for handling registration functionality
 */
export function useRegister(): UseRegisterReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [registrationData, setRegistrationData] = useState<RegisterData | null>(null);

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
    setRegistrationData(null);
    setIsLoading(false);
  }, []);

  /**
   * Register function
   */
  const register = useCallback(async (data: RegisterInput): Promise<RegisterResponse> => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      const response = await registrationService.register(data);

      // Registration always returns success (anti-enumeration feature)
      // Store the data and set success state
      setRegistrationData(response.data);
      setIsSuccess(true);

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
      } else if (errorCode === 'ORG_SLUG_EXISTS') {
        displayMessage = 'Unable to create organization. Please try a different name.';
      } else if (errorCode === 'RESERVED_SLUG') {
        displayMessage = 'This organization name is reserved. Please choose another.';
      } else if (errorCode === 'REGISTRATION_FAILED') {
        displayMessage = 'Registration failed. Please try again.';
      }

      setError(displayMessage);
      setIsSuccess(false);
      setRegistrationData(null);

      // Re-throw to allow component to handle if needed
      throw error_;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    register,
    isLoading,
    error,
    isSuccess,
    registrationData,
    clearError,
    reset,
  };
}
