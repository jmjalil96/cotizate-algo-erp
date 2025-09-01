import React from 'react';

import { cn } from '../../lib/utils';

interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
  rightPanelContent?: {
    title: string;
    subtitle?: string;
    description: string;
    stats?: {
      value: string;
      label: string;
    }[];
  };
}

export function AuthLayout({
  children,
  className,
  rightPanelContent,
}: AuthLayoutProps): React.JSX.Element {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form Area */}
      <div className="flex-1 flex items-center justify-center px-8 sm:px-12 lg:px-16 xl:px-24 bg-white">
        <div className={cn('w-full max-w-md', className)}>{children}</div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        {/* Background Gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #093FB4 0%, #1155DA 100%)',
          }}
        />

        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px)`,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="max-w-lg">
            <h1 className="text-5xl font-bold leading-tight mb-6">
              {rightPanelContent?.title ?? 'Administra Seguros'}
              <br />
              <span className="text-blue-200">{rightPanelContent?.subtitle ?? 'Como Nunca'}</span>
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-12">
              {rightPanelContent?.description ??
                'Optimiza tus operaciones de seguros con nuestra plataforma integral de gestión.'}
            </p>

            {/* Simple Stats */}
            <div className="grid grid-cols-3 gap-8">
              {rightPanelContent?.stats
                ? rightPanelContent.stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-3xl font-bold mb-2">{stat.value}</div>
                      <div className="text-blue-200 text-sm">{stat.label}</div>
                    </div>
                  ))
                : [
                    { value: '99.9%', label: 'Disponibilidad' },
                    { value: '50K+', label: 'Pólizas' },
                    { value: '24/7', label: 'Soporte' },
                  ].map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-3xl font-bold mb-2">{stat.value}</div>
                      <div className="text-blue-200 text-sm">{stat.label}</div>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
