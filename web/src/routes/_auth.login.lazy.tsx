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
  const { login } = useAuthStore();

  const handleLogin = async (data: LoginInput): Promise<void> => {
    try {
      // CRITICAL: Update the auth store with login
      await login({
        email: data.email,
        password: data.password,
        otp: data.otp,
      });

      // After successful login (store will be updated)
      await navigate({ to: searchParams?.redirect ?? '/dashboard' });
    } catch (error) {
      // Error is handled by the store and LoginPage component
      console.error('Login failed:', error);
    }
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
      onLogin={handleLogin}
      onNavigateToForgotPassword={handleNavigateToForgotPassword}
      onNavigateToSignup={handleNavigateToSignup}
    />
  );
}
