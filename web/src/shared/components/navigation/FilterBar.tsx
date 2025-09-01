import React from 'react';

import { Search, X } from 'lucide-react';

interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onApply?: () => void;
  onClear?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function FilterBar({
  searchValue = '',
  onSearchChange,
  onApply,
  onClear,
  isOpen = true,
  onClose,
}: FilterBarProps): React.JSX.Element | null {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Filter Panel - Full screen on mobile, sidebar on desktop */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-full sm:w-80 bg-white shadow-xl
          lg:relative lg:inset-auto lg:z-auto lg:shadow-none lg:border-r lg:border-gray-200
          flex flex-col transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
          <button className="p-2 hover:bg-gray-100 rounded-md transition-colors" onClick={onClose}>
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Filter Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:border-blue-500 focus:outline-none"
                placeholder="Buscar..."
                style={{ '--tw-ring-color': '#093FB4' } as React.CSSProperties}
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Placeholder Section */}
          <div className="space-y-6">
            <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-center text-gray-500 text-sm">Los filtros aparecerán aquí</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-0 border-t border-gray-200 lg:border-t-0">
          <div className="flex space-x-3">
            <button
              className="flex-1 px-4 py-2 text-white rounded-md text-sm font-medium transition-colors hover:opacity-90"
              style={{ backgroundColor: '#093FB4' }}
              onClick={() => {
                onApply?.();
                onClose?.(); // Close on mobile after applying
              }}
            >
              Aplicar Filtros
            </button>
            <button
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-md text-sm font-medium transition-colors"
              onClick={onClear}
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onClose} />
      )}
    </>
  );
}
