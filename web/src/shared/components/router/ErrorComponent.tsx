import React from 'react';

import { useNavigate } from '@tanstack/react-router';

import { Button } from '../ui';

interface ErrorComponentProps {
  error: Error;
}

export function ErrorComponent({ error }: ErrorComponentProps): React.JSX.Element {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-600 mb-6">{error.message}</p>
        <Button onClick={() => navigate({ to: '/' })}>Go Home</Button>
      </div>
    </div>
  );
}
