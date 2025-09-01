import React from 'react';

import { ArrowLeft, type LucideIcon } from 'lucide-react';

interface Breadcrumb {
  label: string;
  onClick?: () => void;
}

interface HeaderAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface DetailViewLayoutProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  breadcrumbs?: Breadcrumb[];
  headerActions?: HeaderAction[];
  children: React.ReactNode;
  onBack?: () => void;
}

const getActionStyles = (variant: HeaderAction['variant'] = 'secondary'): string => {
  switch (variant) {
    case 'primary':
      return 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all';
    case 'danger':
      return 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all';
    case 'secondary':
    default:
      return 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all';
  }
};

export function DetailViewLayout({
  title,
  subtitle,
  icon: Icon,
  breadcrumbs = [],
  headerActions = [],
  children,
  onBack,
}: DetailViewLayoutProps): React.JSX.Element {
  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          {/* Breadcrumbs */}
          {(breadcrumbs.length > 0 || onBack) && (
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
              {onBack && (
                <>
                  <button
                    className="flex items-center hover:text-gray-700 transition-colors"
                    onClick={onBack}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Regresar
                  </button>
                  {breadcrumbs.length > 0 && <span>·</span>}
                </>
              )}
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span className="text-gray-400">/</span>}
                  {crumb.onClick ? (
                    <button
                      className="hover:text-gray-700 transition-colors"
                      onClick={crumb.onClick}
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="text-gray-900 font-medium">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Title Section */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {Icon && (
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
              </div>
            </div>

            {/* Header Actions */}
            {headerActions.length > 0 && (
              <div className="flex items-center space-x-3">
                {headerActions.map((action, index) => {
                  const ActionIcon = action.icon;
                  return (
                    <button
                      key={index}
                      className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${getActionStyles(
                        action.variant
                      )}`}
                      onClick={action.onClick}
                    >
                      {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                      {action.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">{children}</div>
    </div>
  );
}
