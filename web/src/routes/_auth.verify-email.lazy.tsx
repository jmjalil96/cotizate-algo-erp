import React from 'react';

import { createLazyFileRoute, useNavigate, useSearch } from '@tanstack/react-router';

import { VerifyEmailPage } from '@/features/auth/domains/registration/VerifyEmailPage';

export const Route = createLazyFileRoute('/_auth/verify-email')({
  component: VerifyEmailPageWrapper,
});

interface VerifyEmailSearch {
  email?: string;
  token?: string;
}

// Resend handler moved to outer scope as it doesn't depend on component state
const handleResend = async (): Promise<void> => {
  // Handle resend if needed
  console.info('Resend verification email');
};

function VerifyEmailPageWrapper(): React.JSX.Element {
  const searchParams = useSearch({ from: '/_auth/verify-email' }) as VerifyEmailSearch;
  const navigate = useNavigate();

  const handleVerify = async (): Promise<void> => {
    // After successful verification, go to login
    await navigate({ to: '/login' });
  };

  // VerifyEmailPage already includes AuthLayout internally
  return (
    <VerifyEmailPage
      defaultEmail={searchParams.email}
      onResend={handleResend}
      onVerify={handleVerify}
    />
  );
}
