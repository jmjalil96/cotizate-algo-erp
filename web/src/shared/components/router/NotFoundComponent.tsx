import React from 'react';

import { Link } from '@tanstack/react-router';

export function NotFoundComponent(): React.JSX.Element {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-gray-600 mb-6">Page not found</p>
        <Link className="text-blue-600 hover:underline" to="/">
          Go Home
        </Link>
      </div>
    </div>
  );
}
