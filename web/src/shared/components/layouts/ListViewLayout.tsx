import React, { useState } from 'react';

import { type LucideIcon } from 'lucide-react';

import { ActionBar, FilterBar, FooterBar } from '../navigation';
import { DataTable, type DataTableColumn, type DataTableAction } from '../ui';

interface TableConfig<T> {
  columns: DataTableColumn<T>[];
  actions?: DataTableAction<T>[];
  selectable?: boolean;
  selectedRows?: string[];
  onSelectRow?: (id: string) => void;
  onSelectAll?: () => void;
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

interface ListViewLayoutProps<T = unknown> {
  children?: React.ReactNode;
  // Data props
  data?: T[];
  loading?: boolean;
  tableConfig?: TableConfig<T>;
  // Filter props
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onApplyFilters?: () => void;
  onClearFilters?: () => void;
  // View mode props
  viewMode?: 'table' | 'kanban';
  onViewModeChange?: (mode: 'table' | 'kanban') => void;
  showViewSwitcher?: boolean;
  // Primary action props
  primaryAction?: {
    label: string;
    shortLabel?: string;
    icon?: LucideIcon;
    onClick: () => void;
  };
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  itemsPerPage?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  showPagination?: boolean;
}

export function ListViewLayout<T = unknown>({
  children,
  data,
  loading = false,
  tableConfig,
  searchValue,
  onSearchChange,
  onApplyFilters,
  onClearFilters,
  viewMode = 'table',
  onViewModeChange,
  showViewSwitcher = true,
  primaryAction,
  currentPage = 1,
  totalPages = 1,
  itemsPerPage = 10,
  totalItems = 0,
  onPageChange,
  onItemsPerPageChange,
  showPagination = true,
}: ListViewLayoutProps<T>): React.JSX.Element {
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  const renderContent = (): React.ReactNode => {
    // If data and tableConfig are provided, use DataTable
    if (data && tableConfig && viewMode === 'table') {
      return (
        <DataTable
          actions={tableConfig.actions}
          columns={tableConfig.columns}
          data={data}
          emptyMessage={tableConfig.emptyMessage}
          getRowId={tableConfig.getRowId}
          loading={loading}
          selectable={tableConfig.selectable}
          selectedRows={tableConfig.selectedRows}
          sortDirection={tableConfig.sortDirection}
          sortKey={tableConfig.sortKey}
          onRowClick={tableConfig.onRowClick}
          onSelectAll={tableConfig.onSelectAll}
          onSelectRow={tableConfig.onSelectRow}
          onSort={tableConfig.onSort}
        />
      );
    }

    // Kanban view placeholder
    if (viewMode === 'kanban') {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center">
            <p className="text-gray-500 text-lg">Vista Kanban próximamente...</p>
            <p className="text-gray-400 text-sm mt-2">Cambia a vista de tabla para ver los datos</p>
          </div>
        </div>
      );
    }

    // Fallback to children if no data/config provided
    return children;
  };

  return (
    <div className="flex flex-col flex-1">
      {/* Action Bar */}
      <ActionBar
        isFilterOpen={isFilterOpen}
        primaryAction={primaryAction}
        showViewSwitcher={showViewSwitcher}
        viewMode={viewMode}
        onFilterToggle={() => setIsFilterOpen(!isFilterOpen)}
        onViewModeChange={onViewModeChange}
      />

      {/* Main Content Area with Filter Sidebar */}
      <div className="flex flex-1 min-h-0">
        {/* Filter Sidebar */}
        <FilterBar
          isOpen={isFilterOpen}
          searchValue={searchValue}
          onApply={onApplyFilters}
          onClear={onClearFilters}
          onClose={() => setIsFilterOpen(false)}
          onSearchChange={onSearchChange}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-white">{renderContent()}</div>
      </div>

      {/* Pagination Footer - naturally stays at bottom */}
      {showPagination && (
        <FooterBar
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          totalPages={totalPages}
          onItemsPerPageChange={onItemsPerPageChange}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
