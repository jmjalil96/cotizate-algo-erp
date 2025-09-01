import React from 'react';

import { ArrowUpDown, ArrowUp, ArrowDown, type LucideIcon } from 'lucide-react';

export interface DataTableColumn<T> {
  key: keyof T | 'actions';
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableAction<T> {
  icon: LucideIcon;
  label: string;
  onClick: (row: T) => void;
  color?: string;
  hoverColor?: string;
  show?: (row: T) => boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  actions?: DataTableAction<T>[];
  selectable?: boolean;
  selectedRows?: string[];
  onSelectRow?: (id: string) => void;
  onSelectAll?: () => void;
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  loading?: boolean;
  loadingRows?: number;
  emptyMessage?: string;
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
}

// Action color definitions (reserved for future use)
// const actionColors: Partial<Record<string, { color: string; hoverColor: string }>> = {
//   view: { color: 'text-gray-400', hoverColor: '#093FB4' },
//   edit: { color: 'text-gray-400', hoverColor: '#ED3500' },
//   copy: { color: 'text-gray-400', hoverColor: '#666666' },
//   archive: { color: 'text-gray-400', hoverColor: '#999999' },
// };

export function DataTable<T>({
  data,
  columns,
  actions,
  selectable = false,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  onSort,
  sortKey,
  sortDirection,
  loading = false,
  loadingRows = 5,
  emptyMessage = 'No hay datos disponibles',
  getRowId,
  onRowClick,
  rowClassName,
}: DataTableProps<T>): React.JSX.Element {
  const handleSort = (key: string): void => {
    if (onSort) {
      onSort(key);
    }
  };

  const renderSortIcon = (columnKey: string): React.JSX.Element => {
    if (sortKey === columnKey) {
      return sortDirection === 'asc' ? (
        <ArrowUp className="h-3 w-3 text-gray-600" />
      ) : (
        <ArrowDown className="h-3 w-3 text-gray-600" />
      );
    }
    return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
  };

  const renderCellValue = (column: DataTableColumn<T>, row: T): React.ReactNode => {
    if (column.key === 'actions') {
      return null; // Actions are rendered separately
    }

    const value = row[column.key as keyof T];

    if (column.render) {
      return column.render(value, row);
    }

    // Default rendering for common types
    if (value === null || value === undefined) {
      return '-';
    }

    if (value instanceof Date) {
      return value.toLocaleDateString();
    }

    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No';
    }

    return String(value);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="overflow-x-auto bg-white">
        <div className="min-w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {selectable && (
                  <th className="px-4 py-3 text-left">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  >
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.from({ length: loadingRows }).map((_, index) => (
                <tr key={index}>
                  {selectable && (
                    <td className="px-4 py-3">
                      <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={String(column.key)} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8">
        <div className="text-center">
          <p className="text-gray-500 text-lg">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white">
      <div className="min-w-full">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {/* Selection column */}
              {selectable && (
                <th className="px-4 py-3 text-left">
                  <input
                    checked={selectedRows.length === data.length && data.length > 0}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    type="checkbox"
                    onChange={() => onSelectAll?.()}
                  />
                </th>
              )}

              {/* Data columns */}
              {columns.map((column) => {
                const isActionColumn = column.key === 'actions';
                const isSortable = column.sortable && !isActionColumn;

                return (
                  <th
                    key={String(column.key)}
                    className={`px-4 py-3 text-${column.align ?? 'left'} text-xs font-semibold text-gray-700 uppercase tracking-wider ${
                      isSortable ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''
                    } ${column.className ?? ''}`}
                    style={{ width: column.width }}
                    onClick={isSortable ? () => handleSort(String(column.key)) : undefined}
                  >
                    {isActionColumn ? (
                      column.label
                    ) : (
                      <div className="flex items-center space-x-1">
                        <span>{column.label}</span>
                        {isSortable && renderSortIcon(String(column.key))}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row) => {
              const rowId = getRowId(row);
              const isSelected = selectedRows.includes(rowId);
              const hasClickHandler = Boolean(onRowClick);
              const customClassName = rowClassName?.(row) ?? '';

              return (
                <tr
                  key={rowId}
                  className={`hover:bg-gray-50 transition-colors ${
                    hasClickHandler ? 'cursor-pointer' : ''
                  } ${customClassName}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {/* Selection cell */}
                  {selectable && (
                    <td className="px-4 py-3">
                      <input
                        checked={isSelected}
                        className="rounded border-gray-300 focus:ring-2"
                        style={{ accentColor: '#093FB4' }}
                        type="checkbox"
                        onChange={() => onSelectRow?.(rowId)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}

                  {/* Data cells */}
                  {columns.map((column) => {
                    if (column.key === 'actions' && actions) {
                      return (
                        <td key={String(column.key)} className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            {actions.map((action, actionIndex) => {
                              const ActionIcon = action.icon;
                              const shouldShow = action.show ? action.show(row) : true;

                              if (!shouldShow) return null;

                              return (
                                <button
                                  key={actionIndex}
                                  className="p-1 text-gray-400 transition-colors"
                                  title={action.label}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    action.onClick(row);
                                  }}
                                  onMouseEnter={(e) => {
                                    if (action.hoverColor) {
                                      e.currentTarget.style.color = action.hoverColor;
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = '';
                                  }}
                                >
                                  <ActionIcon className="h-4 w-4" />
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={String(column.key)}
                        className={`px-4 py-3 text-sm ${
                          column.align === 'center'
                            ? 'text-center'
                            : column.align === 'right'
                              ? 'text-right'
                              : ''
                        } ${column.className ?? ''}`}
                      >
                        {renderCellValue(column, row)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
