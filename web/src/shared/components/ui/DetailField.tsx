import React, { useState } from 'react';

import { Edit2, Check, X, Copy, Loader2 } from 'lucide-react';
import { type ZodSchema } from 'zod';

export type FieldType =
  | 'text'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'email'
  | 'phone'
  | 'url'
  | 'badge'
  | 'multiline'
  | 'boolean'
  | 'percent'
  | 'number';

interface DetailFieldProps {
  label: string;
  value: unknown;
  type?: FieldType;
  span?: 1 | 2 | 3 | 4;
  editable?: boolean;
  onSave?: (value: unknown) => Promise<void>;
  validation?: ZodSchema;
  copyable?: boolean;
  className?: string;
  emptyText?: string;
}

export function DetailField({
  label,
  value,
  type = 'text',
  span = 1,
  editable = false,
  onSave,
  validation,
  copyable = false,
  className = '',
  emptyText = '-',
}: DetailFieldProps): React.JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSave = async (): Promise<void> => {
    setError('');

    // Validate if schema provided
    if (validation) {
      const result = validation.safeParse(editValue);
      if (!result.success) {
        setError(result.error.issues[0].message);
        return;
      }
    }

    setIsSaving(true);
    try {
      await onSave?.(editValue);
      setIsEditing(false);
    } catch {
      setError('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = (): void => {
    setEditValue(value);
    setIsEditing(false);
    setError('');
  };

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error_) {
      console.error('Failed to copy:', error_);
    }
  };

  const formatValue = (): React.ReactNode => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400">{emptyText}</span>;
    }

    // Type assertion for formatting - value could be any valid type
    const val = value as string | number | Date | boolean;

    switch (type) {
      case 'currency':
        return `$${Number(val).toLocaleString('es-MX', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

      case 'date':
        return new Date(val as string | number | Date).toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

      case 'datetime':
        return new Date(val as string | number | Date).toLocaleString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

      case 'phone':
        return (
          <a
            className="text-blue-600 hover:underline"
            href={`tel:${val}`}
            style={{ color: '#093FB4' }}
          >
            {formatPhone(String(val))}
          </a>
        );

      case 'email':
        return (
          <a
            className="text-blue-600 hover:underline"
            href={`mailto:${val}`}
            style={{ color: '#093FB4' }}
          >
            {String(val)}
          </a>
        );

      case 'url':
        return (
          <a
            className="text-blue-600 hover:underline"
            href={String(val)}
            rel="noopener noreferrer"
            style={{ color: '#093FB4' }}
            target="_blank"
          >
            {String(val)}
          </a>
        );

      case 'badge':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border border-blue-200 shadow-sm">
            {String(val)}
          </span>
        );

      case 'boolean':
        return value ? (
          <span className="text-green-600">✓ Sí</span>
        ) : (
          <span className="text-gray-400">✗ No</span>
        );

      case 'percent':
        return `${String(val)}%`;

      case 'number':
        return Number(val).toLocaleString('es-MX');

      case 'multiline':
        return <div className="whitespace-pre-wrap">{String(val)}</div>;

      case 'text':
      default:
        return String(value);
    }
  };

  const renderEditInput = (): React.ReactNode => {
    switch (type) {
      case 'multiline':
        return (
          <textarea
            autoFocus
            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none outline-none"
            rows={3}
            style={{ boxShadow: '0 0 0 3px rgba(9, 63, 180, 0.1)' }}
            value={String(editValue ?? '')}
            onChange={(e) => setEditValue(e.target.value)}
          />
        );

      case 'boolean':
        return (
          <select
            autoFocus
            className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            style={{ boxShadow: '0 0 0 3px rgba(9, 63, 180, 0.1)' }}
            value={String(editValue) === 'true' ? 'true' : 'false'}
            onChange={(e) => setEditValue(e.target.value === 'true')}
          >
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        );

      case 'date':
        return (
          <input
            autoFocus
            className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            style={{ boxShadow: '0 0 0 3px rgba(9, 63, 180, 0.1)' }}
            type="date"
            value={String(editValue ?? '')}
            onChange={(e) => setEditValue(e.target.value)}
          />
        );

      case 'number':
      case 'currency':
      case 'percent':
        return (
          <input
            autoFocus
            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            style={{ boxShadow: '0 0 0 3px rgba(9, 63, 180, 0.1)' }}
            type="number"
            value={String(editValue ?? '')}
            onChange={(e) => setEditValue(e.target.valueAsNumber)}
          />
        );

      case 'email':
        return (
          <input
            autoFocus
            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            style={{ boxShadow: '0 0 0 3px rgba(9, 63, 180, 0.1)' }}
            type="email"
            value={String(editValue ?? '')}
            onChange={(e) => setEditValue(e.target.value)}
          />
        );

      case 'url':
      case 'text':
      case 'datetime':
      case 'phone':
      case 'badge':
      default:
        return (
          <input
            autoFocus
            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            style={{ boxShadow: '0 0 0 3px rgba(9, 63, 180, 0.1)' }}
            type="text"
            value={String(editValue ?? '')}
            onChange={(e) => setEditValue(e.target.value)}
          />
        );
    }
  };

  const getSpanClass = (): string => {
    switch (span) {
      case 1:
        return 'col-span-1';
      case 2:
        return 'col-span-1 sm:col-span-2';
      case 3:
        return 'col-span-1 sm:col-span-2 lg:col-span-3';
      case 4:
        return 'col-span-1 sm:col-span-2 lg:col-span-4';
      default:
        return 'col-span-1';
    }
  };

  if (isEditing) {
    return (
      <div className={`${getSpanClass()} ${className}`}>
        <dt className="text-sm font-medium text-gray-500 mb-1">{label}</dt>
        <dd>
          <div className="flex items-start gap-2">
            <div className="flex-1">
              {renderEditInput()}
              {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            </div>
            <div className="flex items-center gap-1">
              <button
                className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                disabled={isSaving}
                onClick={handleSave}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </button>
              <button className="p-1 text-red-600 hover:text-red-700" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </dd>
      </div>
    );
  }

  return (
    <div className={`${getSpanClass()} ${className}`}>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd
        className={`mt-1 text-sm text-gray-900 flex items-center gap-2 ${
          editable
            ? 'group cursor-pointer hover:bg-blue-50 rounded px-2 py-1 -mx-2 -my-1 transition-colors'
            : ''
        }`}
        onClick={editable ? () => setIsEditing(true) : undefined}
      >
        <div className="flex-1">{formatValue()}</div>
        {editable && (
          <Edit2 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:text-blue-600 transition-all" />
        )}
        {copyable && !editable && (
          <button
            className="p-1 text-gray-400 hover:text-gray-600"
            title={copied ? 'Copiado!' : 'Copiar'}
            onClick={handleCopy}
          >
            {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
          </button>
        )}
      </dd>
    </div>
  );
}

// Helper function to format phone numbers
function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}
