import React from 'react';

import { Plus, ArrowRight, type LucideIcon } from 'lucide-react';

import { DataTable, type DataTableColumn, type DataTableAction } from './DataTable';

interface RelatedRecordsTableProps<T> {
  title: string;
  description?: string;
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  actions?: DataTableAction<T>[];
  onAdd?: () => void;
  addLabel?: string;
  onViewAll?: () => void;
  viewAllLabel?: string;
  maxRows?: number;
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  icon?: LucideIcon;
}

export function RelatedRecordsTable<T>({
  title,
  description,
  data,
  columns,
  loading = false,
  emptyMessage = 'No hay registros relacionados',
  actions,
  onAdd,
  addLabel = 'Agregar',
  onViewAll,
  viewAllLabel = 'Ver todos',
  maxRows = 5,
  getRowId,
  onRowClick,
  icon: Icon,
}: RelatedRecordsTableProps<T>): React.JSX.Element {
  // Limit data to maxRows for display
  const displayData = data.slice(0, maxRows);
  const hasMore = data.length > maxRows;

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {Icon && (
              <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg shadow-sm">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {title}
                {data.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-sm font-normal text-blue-600 bg-blue-100 rounded-full">
                    {data.length}
                  </span>
                )}
              </h3>
              {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {onViewAll && data.length > 0 && (
              <button
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                onClick={onViewAll}
              >
                {viewAllLabel}
                <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            )}
            {onAdd && (
              <button
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                onClick={onAdd}
              >
                <Plus className="h-4 w-4 mr-1" />
                {addLabel}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-hidden">
        {data.length === 0 && !loading ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">{emptyMessage}</p>
            {onAdd && (
              <button
                className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                onClick={onAdd}
              >
                <Plus className="h-4 w-4 mr-2" />
                {addLabel}
              </button>
            )}
          </div>
        ) : (
          <>
            <DataTable
              actions={actions}
              columns={columns}
              data={displayData}
              emptyMessage={emptyMessage}
              getRowId={getRowId}
              loading={loading}
              loadingRows={3}
              onRowClick={onRowClick}
            />
            {hasMore && !loading && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <button
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  style={{ color: '#093FB4' }}
                  onClick={onViewAll}
                >
                  Ver {data.length - maxRows} más {title.toLowerCase()}...
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
