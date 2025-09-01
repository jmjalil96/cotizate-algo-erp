import React, { forwardRef, useState } from 'react';

import { Eye, EyeOff, type LucideIcon } from 'lucide-react';

import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  onIconClick?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon: Icon, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    const handleTogglePassword = (): void => {
      setShowPassword(!showPassword);
    };

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700" htmlFor={id}>
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Icon
                className={cn(
                  'h-5 w-5 transition-colors duration-200',
                  isFocused ? 'text-blue-600' : 'text-gray-400'
                )}
                style={isFocused ? { color: '#093FB4' } : {}}
              />
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'block w-full py-4 border-2 border-gray-200 rounded-xl text-gray-900',
              'placeholder-gray-400 focus:outline-none focus:border-blue-600',
              'focus:ring-4 focus:ring-blue-100 transition-all duration-200',
              Icon ? 'pl-12 pr-4' : 'px-4',
              isPassword ? 'pr-12' : '',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-100',
              className
            )}
            id={id}
            style={
              {
                '--tw-ring-color': error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(9, 63, 180, 0.1)',
                borderColor: isFocused && !error ? '#093FB4' : '',
              } as React.CSSProperties
            }
            type={inputType}
            onBlur={() => setIsFocused(false)}
            onFocus={() => setIsFocused(true)}
            {...props}
          />
          {isPassword && (
            <button
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
              tabIndex={-1}
              type="button"
              onClick={handleTogglePassword}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
              )}
            </button>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
