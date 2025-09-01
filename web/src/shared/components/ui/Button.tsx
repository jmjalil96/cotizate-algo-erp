import React, { forwardRef } from 'react';

import { type LucideIcon } from 'lucide-react';

import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const variantClasses = {
  primary: 'bg-[#093FB4] text-white hover:bg-[#07358f] focus:ring-[#093FB4]/30',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400/30',
  ghost: 'bg-transparent text-[#093FB4] hover:bg-[#093FB4]/10 focus:ring-[#093FB4]/30',
};

const sizeClasses = {
  sm: 'py-2 px-4 text-sm',
  md: 'py-3 px-5 text-base',
  lg: 'py-4 px-6 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText = 'Cargando...',
      icon: Icon,
      iconPosition = 'right',
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          'flex items-center justify-center font-medium rounded-xl',
          'border border-transparent transition-all duration-200',
          'focus:outline-none focus:ring-4 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled ?? isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-3" />
            {loadingText ?? 'Cargando...'}
          </>
        ) : (
          <>
            {Icon && iconPosition === 'left' && <Icon className="h-5 w-5 mr-2" />}
            {children}
            {Icon && iconPosition === 'right' && <Icon className="h-5 w-5 ml-2" />}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
