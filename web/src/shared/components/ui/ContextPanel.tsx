import React from 'react';

import { HelpCircle, Info, AlertTriangle, CheckCircle, type LucideIcon } from 'lucide-react';

interface ContextSection {
  title: string;
  icon?: LucideIcon;
  content: React.ReactNode;
  type?: 'info' | 'warning' | 'success' | 'help';
}

interface ContextPanelProps {
  sections: ContextSection[];
  currentField?: string;
  className?: string;
}

const getIconColor = (type?: string): string => {
  switch (type) {
    case 'warning':
      return 'text-amber-600 bg-amber-50';
    case 'success':
      return 'text-green-600 bg-green-50';
    case 'help':
      return 'text-blue-600 bg-blue-50';
    case 'info':
      return 'text-gray-600 bg-gray-50';
    case undefined:
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export function ContextPanel({
  sections,
  currentField,
  className = '',
}: ContextPanelProps): React.JSX.Element {
  const getIcon = (section: ContextSection): LucideIcon => {
    if (section.icon) return section.icon;

    switch (section.type) {
      case 'warning':
        return AlertTriangle;
      case 'success':
        return CheckCircle;
      case 'help':
        return HelpCircle;
      case 'info':
        return Info;
      case undefined:
      default:
        return Info;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Field Help */}
      {currentField && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-900">Campo actual: {currentField}</h4>
              <p className="mt-1 text-sm text-blue-700">
                Completa este campo con información precisa y actualizada.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Context Sections */}
      {sections.map((section, index) => {
        const Icon = getIcon(section);
        const iconColor = getIconColor(section.type);

        return (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center">
                <div className={`p-1.5 rounded-lg ${iconColor}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="ml-2 text-sm font-medium text-gray-900">{section.title}</h3>
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="text-sm text-gray-600">{section.content}</div>
            </div>
          </div>
        );
      })}

      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="text-sm font-medium text-gray-900">Resumen de Cambios</h3>
        </div>
        <div className="px-4 py-3">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-gray-600">Campos modificados:</span>
              <span className="font-medium text-gray-900">0</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-gray-600">Errores:</span>
              <span className="font-medium text-red-600">0</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-gray-600">Estado:</span>
              <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                Sin cambios
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Export helper component for field-specific help
export function FieldHelp({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{title}</h4>
      <div className="text-sm text-gray-600">{children}</div>
    </div>
  );
}
