import React from 'react';

import { cn } from '../../lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export function PasswordStrengthIndicator({
  password,
  className,
}: PasswordStrengthIndicatorProps): React.JSX.Element {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^\dA-Za-z]/.test(password),
  ];

  const metCount = checks.filter(Boolean).length;
  const strength = (metCount / checks.length) * 100;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex-1">
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all duration-300 rounded-full', {
              'bg-red-500': strength > 0 && strength < 40,
              'bg-yellow-500': strength >= 40 && strength < 80,
              'bg-green-500': strength >= 80,
            })}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>
      <span
        className={cn('text-xs font-medium', {
          'text-red-600': strength < 40,
          'text-yellow-600': strength >= 40 && strength < 80,
          'text-green-600': strength >= 80,
        })}
      >
        {strength === 0
          ? ''
          : strength < 40
            ? 'Débil'
            : strength < 80
              ? 'Media'
              : strength < 100
                ? 'Fuerte'
                : 'Excelente'}
      </span>
    </div>
  );
}
