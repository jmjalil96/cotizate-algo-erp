import React from 'react';

import { createLazyFileRoute, useNavigate, useSearch } from '@tanstack/react-router';

import { LoginPage } from '@/features/auth/domains/session/LoginPage';
import type { LoginInput } from '@/features/auth/domains/session/session.schema';
import { useAuthStore } from '@/shared/store/auth';

export const Route = createLazyFileRoute('/_auth/login')({
  component: LoginPageWrapper,
});

// Type-safe search params
interface LoginSearch {
  redirect?: string;
}

function LoginPageWrapper(): React.JSX.Element {
  const navigate = useNavigate();
  const searchParams = useSearch({ from: '/_auth/login' }) as LoginSearch;
  const { login, isLoading, error, requiresOtp, clearError, isAuthenticated } = useAuthStore();

  // Navigate after successful login
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: searchParams?.redirect ?? '/dashboard' });
    }
  }, [isAuthenticated, navigate, searchParams?.redirect]);

  const handleLogin = async (data: LoginInput): Promise<void> => {
    // Just call the store's login - it handles everything
    await login({
      email: data.email,
      password: data.password,
      otp: data.otp,
    });
  };

  const handleNavigateToSignup = (): void => {
    navigate({ to: '/signup' });
  };

  const handleNavigateToForgotPassword = (): void => {
    navigate({ to: '/forgot-password' });
  };

  // LoginPage already includes AuthLayout internally
  return (
    <LoginPage
      clearError={clearError}
      error={error}
      isLoading={isLoading}
      requiresOtp={requiresOtp}
      onLogin={handleLogin}
      onNavigateToForgotPassword={handleNavigateToForgotPassword}
      onNavigateToSignup={handleNavigateToSignup}
    />
  );
}
