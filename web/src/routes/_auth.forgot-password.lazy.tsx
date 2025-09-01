import React from 'react';

import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';

import { ForgotPasswordPage } from '@/features/auth/domains/password-recovery/ForgotPasswordPage';

export const Route = createLazyFileRoute('/_auth/forgot-password')({
  component: ForgotPasswordPageWrapper,
});

function ForgotPasswordPageWrapper(): React.JSX.Element {
  const navigate = useNavigate();

  const handleBackToLogin = (): void => {
    navigate({ to: '/login' });
  };

  const handleContinueToReset = (): void => {
    navigate({ to: '/reset-password' });
  };

  // ForgotPasswordPage already includes AuthLayout internally
  return (
    <ForgotPasswordPage
      onBackToLogin={handleBackToLogin}
      onContinueToReset={handleContinueToReset}
    />
  );
}
