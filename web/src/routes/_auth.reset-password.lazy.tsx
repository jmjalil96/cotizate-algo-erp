import React from 'react';

import { createLazyFileRoute, useNavigate, useSearch } from '@tanstack/react-router';

import { ResetPasswordPage } from '@/features/auth/domains/password-recovery/ResetPasswordPage';

export const Route = createLazyFileRoute('/_auth/reset-password')({
  component: ResetPasswordPageWrapper,
});

interface ResetPasswordSearch {
  token?: string;
  email?: string;
}

function ResetPasswordPageWrapper(): React.JSX.Element {
  const searchParams = useSearch({ from: '/_auth/reset-password' }) as ResetPasswordSearch;
  const navigate = useNavigate();

  const handleBackToLogin = (): void => {
    navigate({ to: '/login' });
  };

  const handleRequestNewCode = (): void => {
    navigate({ to: '/forgot-password' });
  };

  // ResetPasswordPage already includes AuthLayout internally
  return (
    <ResetPasswordPage
      defaultEmail={searchParams.email}
      onBackToLogin={handleBackToLogin}
      onRequestNewCode={handleRequestNewCode}
    />
  );
}
