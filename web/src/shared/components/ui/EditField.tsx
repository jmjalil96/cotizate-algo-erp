import React, { useState } from 'react';

import { AlertCircle, Check } from 'lucide-react';

import { cn } from '../../lib/utils';

export type EditFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'currency'
  | 'select'
  | 'textarea'
  | 'date'
  | 'url';

interface SelectOption {
  value: string;
  label: string;
}

interface EditFieldProps {
  label: string;
  name: string;
  type?: EditFieldType;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  onBlur?: (name: string) => void;
  onFocus?: (name: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: SelectOption[]; // For select type
  rows?: number; // For textarea
  min?: number; // For number types
  max?: number; // For number types
  isDirty?: boolean;
  className?: string;
}

export function EditField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  required = false,
  disabled = false,
  placeholder,
  helpText,
  options = [],
  rows = 3,
  min,
  max,
  isDirty = false,
  className = '',
}: EditFieldProps): React.JSX.Element {
  const [isFocused, setIsFocused] = useState(false);
  const [hasBeenTouched, setHasBeenTouched] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const newValue =
      type === 'number' || type === 'currency'
        ? e.target.value
          ? Number(e.target.value)
          : ''
        : e.target.value;
    onChange(name, newValue);
    setHasBeenTouched(true);
  };

  const handleFocus = (): void => {
    setIsFocused(true);
    onFocus?.(name);
  };

  const handleBlur = (): void => {
    setIsFocused(false);
    setHasBeenTouched(true);
    onBlur?.(name);
  };

  // Format display value for currency
  const formatValue = (): string => {
    if (type === 'currency' && value !== null && value !== undefined && !isFocused) {
      const numValue = typeof value === 'number' ? value : Number(value);
      if (!Number.isNaN(numValue)) {
        return new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: 'MXN',
        }).format(numValue);
      }
    }
    return value !== null && value !== undefined ? String(value) : '';
  };

  const fieldClasses = cn(
    'block w-full px-3 py-2 border rounded-md text-gray-900',
    'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    'transition-all duration-200',
    {
      'border-gray-300': !error && !isDirty,
      'border-red-500 focus:ring-red-500': error,
      'border-l-4 border-l-blue-500': isDirty && !error,
      'bg-gray-50 cursor-not-allowed': disabled,
    },
    className
  );

  const renderField = (): React.ReactNode => {
    switch (type) {
      case 'text':
      case 'textarea':
        return (
          <textarea
            className={fieldClasses}
            disabled={disabled}
            name={name}
            placeholder={placeholder}
            rows={rows}
            value={value !== null && value !== undefined ? String(value) : ''}
            onBlur={handleBlur}
            onChange={handleChange}
            onFocus={handleFocus}
          />
        );

      case 'select':
        return (
          <select
            className={fieldClasses}
            disabled={disabled}
            name={name}
            value={value !== null && value !== undefined ? String(value) : ''}
            onBlur={handleBlur}
            onChange={handleChange}
            onFocus={handleFocus}
          >
            <option value="">Seleccionar...</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            className={fieldClasses}
            disabled={disabled}
            name={name}
            type="date"
            value={value !== null && value !== undefined ? String(value) : ''}
            onBlur={handleBlur}
            onChange={handleChange}
            onFocus={handleFocus}
          />
        );

      case 'number':
      case 'currency':
        return (
          <input
            className={fieldClasses}
            disabled={disabled}
            max={max}
            min={min}
            name={name}
            placeholder={placeholder}
            step={type === 'currency' ? '0.01' : '1'}
            type="number"
            value={
              isFocused
                ? value !== null && value !== undefined
                  ? String(value)
                  : ''
                : formatValue()
            }
            onBlur={handleBlur}
            onChange={handleChange}
            onFocus={handleFocus}
          />
        );

      case 'email':
        return (
          <input
            className={fieldClasses}
            disabled={disabled}
            name={name}
            placeholder={placeholder}
            type="email"
            value={value !== null && value !== undefined ? String(value) : ''}
            onBlur={handleBlur}
            onChange={handleChange}
            onFocus={handleFocus}
          />
        );

      case 'phone':
        return (
          <input
            className={fieldClasses}
            disabled={disabled}
            name={name}
            placeholder={placeholder ?? '(555) 123-4567'}
            type="tel"
            value={value !== null && value !== undefined ? String(value) : ''}
            onBlur={handleBlur}
            onChange={handleChange}
            onFocus={handleFocus}
          />
        );

      case 'url':
        return (
          <input
            className={fieldClasses}
            disabled={disabled}
            name={name}
            placeholder={placeholder ?? 'https://'}
            type="url"
            value={value !== null && value !== undefined ? String(value) : ''}
            onBlur={handleBlur}
            onChange={handleChange}
            onFocus={handleFocus}
          />
        );

      default:
        return (
          <input
            className={fieldClasses}
            disabled={disabled}
            name={name}
            placeholder={placeholder}
            type="text"
            value={value !== null && value !== undefined ? String(value) : ''}
            onBlur={handleBlur}
            onChange={handleChange}
            onFocus={handleFocus}
          />
        );
    }
  };

  return (
    <div className="space-y-1">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {isDirty && !error && <span className="ml-2 text-xs text-blue-600">(modificado)</span>}
      </label>

      {/* Field */}
      <div className="relative">
        {renderField()}

        {/* Status Icons */}
        {error && hasBeenTouched && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
        {!error && isDirty && hasBeenTouched && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Check className="h-5 w-5 text-green-500" />
          </div>
        )}
      </div>

      {/* Help Text or Error */}
      {error && hasBeenTouched ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : helpText ? (
        <p className="text-xs text-gray-500">{helpText}</p>
      ) : null}
    </div>
  );
}
