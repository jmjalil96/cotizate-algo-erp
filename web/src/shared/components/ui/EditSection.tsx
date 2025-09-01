import React, { useState } from 'react';

import { ChevronDown, ChevronUp, Check, AlertCircle } from 'lucide-react';

interface EditSectionProps {
  title: string;
  description?: string;
  columns?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  hasErrors?: boolean;
  isValid?: boolean;
  modifiedCount?: number;
  className?: string;
}

export function EditSection({
  title,
  description,
  columns = 2,
  children,
  collapsible = false,
  defaultExpanded = true,
  hasErrors = false,
  isValid = false,
  modifiedCount = 0,
  className = '',
}: EditSectionProps): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const getGridClass = (): string => {
    switch (columns) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 md:grid-cols-2';
      case 3:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
      default:
        return 'grid-cols-1 md:grid-cols-2';
    }
  };

  const toggleExpanded = (): void => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div
      className={`bg-white shadow-sm rounded-lg overflow-hidden border-l-4 ${
        hasErrors ? 'border-l-red-500' : isValid ? 'border-l-green-500' : 'border-l-blue-500'
      } ${className}`}
    >
      {/* Section Header */}
      <div
        className={`px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white ${
          collapsible ? 'cursor-pointer hover:bg-blue-50' : ''
        }`}
        onClick={toggleExpanded}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {title}
                {modifiedCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {modifiedCount} modificado{modifiedCount !== 1 ? 's' : ''}
                  </span>
                )}
              </h3>
              {description && !isExpanded && (
                <p className="mt-1 text-sm text-gray-500">{description}</p>
              )}
            </div>
            {/* Status Indicator */}
            <div className="flex items-center">
              {hasErrors && <AlertCircle className="h-5 w-5 text-red-500" />}
              {!hasErrors && isValid && <Check className="h-5 w-5 text-green-500" />}
            </div>
          </div>
          {collapsible && (
            <button
              className="text-gray-400 hover:text-gray-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded();
              }}
            >
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          )}
        </div>
        {description && isExpanded && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>

      {/* Section Content */}
      {isExpanded && (
        <div className="px-6 py-4">
          <div className={`grid ${getGridClass()} gap-x-6 gap-y-4`}>{children}</div>
        </div>
      )}
    </div>
  );
}
