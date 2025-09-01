import React, { useState, useEffect } from 'react';

import { ArrowLeft, Save, X, RotateCcw, AlertCircle, type LucideIcon } from 'lucide-react';

interface Breadcrumb {
  label: string;
  onClick?: () => void;
}

interface EditViewLayoutProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  breadcrumbs?: Breadcrumb[];
  children: React.ReactNode;
  contextPanel?: React.ReactNode;
  onSave: () => void;
  onCancel: () => void;
  onReset?: () => void;
  onBack?: () => void;
  isDirty?: boolean;
  isSaving?: boolean;
  modifiedCount?: number;
}

export function EditViewLayout({
  title,
  subtitle,
  icon: Icon,
  breadcrumbs = [],
  children,
  contextPanel,
  onSave,
  onCancel,
  onReset,
  onBack,
  isDirty = false,
  isSaving = false,
  modifiedCount = 0,
}: EditViewLayoutProps): React.JSX.Element {
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Warn when navigating away with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent): void => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleCancel = (): void => {
    if (isDirty) {
      setShowUnsavedWarning(true);
    } else {
      onCancel();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
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
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-3">
              {Icon && (
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                  {isDirty && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                      {modifiedCount} cambios sin guardar
                    </span>
                  )}
                </div>
                {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-3">
              <button
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                onClick={handleCancel}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </button>
              <button
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-md hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isDirty || isSaving}
                onClick={onSave}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Form Content */}
            <div className="lg:col-span-3">{children}</div>

            {/* Context Panel */}
            {contextPanel && (
              <div className="lg:col-span-1">
                <div className="sticky top-28">{contextPanel}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {onReset && (
                <button
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  onClick={onReset}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Restablecer
                </button>
              )}
              {isDirty && (
                <span className="text-sm text-gray-500">
                  {modifiedCount} campo{modifiedCount !== 1 ? 's' : ''} modificado
                  {modifiedCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                onClick={handleCancel}
              >
                Cancelar
              </button>
              <button
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-md hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isDirty || isSaving}
                onClick={onSave}
              >
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Warning Modal */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" />
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                      Cambios sin guardar
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Tienes {modifiedCount} cambios sin guardar. ¿Estás seguro de que quieres
                        salir sin guardar?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                  onClick={() => {
                    setShowUnsavedWarning(false);
                    onCancel();
                  }}
                >
                  Salir sin guardar
                </button>
                <button
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  onClick={() => setShowUnsavedWarning(false)}
                >
                  Continuar editando
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
