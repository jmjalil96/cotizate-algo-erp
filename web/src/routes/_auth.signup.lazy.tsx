import React from 'react';

import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';

import type { RegisterInput } from '@/features/auth/domains/registration/registration.schema';
import { SignupPage } from '@/features/auth/domains/registration/SignupPage';

export const Route = createLazyFileRoute('/_auth/signup')({
  component: SignupPageWrapper,
});

function SignupPageWrapper(): React.JSX.Element {
  const navigate = useNavigate();

  const handleSignup = async (data: RegisterInput): Promise<void> => {
    // After successful signup, navigate to email verification
    await navigate({
      to: '/verify-email',
      search: { email: data.email },
    });
  };

  const handleNavigateToLogin = (): void => {
    navigate({ to: '/login' });
  };

  // SignupPage already includes AuthLayout internally
  return <SignupPage onNavigateToLogin={handleNavigateToLogin} onSignup={handleSignup} />;
}
