import React from 'react';

type AccentColor = 'blue' | 'green' | 'amber' | 'purple' | 'red' | 'gray';

interface DetailSectionProps {
  title: string;
  description?: string;
  columns?: 1 | 2 | 3 | 4;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  accentColor?: AccentColor;
}

export function DetailSection({
  title,
  description,
  columns = 2,
  actions,
  children,
  className = '',
  accentColor = 'blue',
}: DetailSectionProps): React.JSX.Element {
  const getGridClass = (): string => {
    switch (columns) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 3:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
      default:
        return 'grid-cols-1 sm:grid-cols-2';
    }
  };

  const getAccentStyles = (): { border: string; bg: string } => {
    switch (accentColor) {
      case 'blue':
        return {
          border: 'border-l-4 border-l-blue-500',
          bg: 'bg-gradient-to-r from-blue-50 to-white',
        };
      case 'green':
        return {
          border: 'border-l-4 border-l-blue-400',
          bg: 'bg-gradient-to-r from-slate-50 to-white',
        };
      case 'amber':
        return {
          border: 'border-l-4 border-l-blue-300',
          bg: 'bg-gradient-to-r from-gray-50 to-white',
        };
      case 'purple':
        return {
          border: 'border-l-4 border-l-indigo-400',
          bg: 'bg-gradient-to-r from-indigo-50 to-white',
        };
      case 'red':
        return {
          border: 'border-l-4 border-l-red-400',
          bg: 'bg-gradient-to-r from-red-50 to-white',
        };
      case 'gray':
      default:
        return {
          border: 'border-l-4 border-l-gray-300',
          bg: 'bg-gradient-to-r from-gray-50 to-white',
        };
    }
  };

  const styles = getAccentStyles();

  return (
    <div className={`bg-white shadow-md rounded-lg overflow-hidden ${styles.border} ${className}`}>
      {/* Section Header */}
      <div className={`px-6 py-4 border-b border-gray-200 ${styles.bg}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      </div>

      {/* Section Content */}
      <div className="px-6 py-4">
        <dl className={`grid ${getGridClass()} gap-x-6 gap-y-4`}>{children}</dl>
      </div>
    </div>
  );
}
