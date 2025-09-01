import React, { useState } from 'react';

import { Plus, Eye, Edit, Archive } from 'lucide-react';

import { ListViewLayout } from '../../../shared/components/layouts';
import { type DataTableColumn, type DataTableAction } from '../../../shared/components/ui';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  rfc: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  totalPolicies: number;
}

// Mock data for demonstration
const mockClients: Client[] = [
  {
    id: '1',
    name: 'Empresa Ejemplo S.A. de C.V.',
    email: 'contacto@ejemplo.com',
    phone: '555-123-4567',
    rfc: 'EEJ123456789',
    status: 'active',
    createdAt: new Date('2024-01-15'),
    totalPolicies: 3,
  },
  {
    id: '2',
    name: 'Constructora ABC',
    email: 'info@constructoraabc.mx',
    phone: '555-987-6543',
    rfc: 'CAB987654321',
    status: 'active',
    createdAt: new Date('2024-02-20'),
    totalPolicies: 5,
  },
  {
    id: '3',
    name: 'Servicios Industriales del Norte',
    email: 'admin@sinnorte.com',
    phone: '555-456-7890',
    rfc: 'SIN456789012',
    status: 'pending',
    createdAt: new Date('2024-03-10'),
    totalPolicies: 0,
  },
  {
    id: '4',
    name: 'Grupo Médico Salud Total',
    email: 'direccion@saludtotal.mx',
    phone: '555-321-9876',
    rfc: 'GMS321654987',
    status: 'inactive',
    createdAt: new Date('2023-12-05'),
    totalPolicies: 2,
  },
  {
    id: '5',
    name: 'Transportes Rápidos del Pacífico',
    email: 'logistica@trpacifico.com',
    phone: '555-654-3210',
    rfc: 'TRP789012345',
    status: 'active',
    createdAt: new Date('2024-01-28'),
    totalPolicies: 8,
  },
];

interface ClientsPageProps {
  onClientSelect?: (clientId: string) => void;
}

export function ClientsPage({ onClientSelect }: ClientsPageProps = {}): React.JSX.Element {
  const [searchValue, setSearchValue] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [loading] = useState(false);

  const handleSelectRow = (id: string): void => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (): void => {
    setSelectedRows(selectedRows.length === mockClients.length ? [] : mockClients.map((c) => c.id));
  };

  const handleSort = (key: string): void => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleView = (client: Client): void => {
    if (onClientSelect) {
      onClientSelect(client.id);
    } else {
      console.info('View client:', client);
    }
  };

  const handleEdit = (client: Client): void => {
    console.info('Edit client:', client);
  };

  const handleArchive = (client: Client): void => {
    console.info('Archive client:', client);
  };

  const columns: DataTableColumn<Client>[] = [
    {
      key: 'name',
      label: 'Nombre',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gray-900">{value as React.ReactNode}</span>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value) => (
        <a className="text-blue-600 hover:underline" href={`mailto:${value}`}>
          {value as React.ReactNode}
        </a>
      ),
    },
    {
      key: 'phone',
      label: 'Teléfono',
      sortable: true,
    },
    {
      key: 'rfc',
      label: 'RFC',
      sortable: true,
      className: 'font-mono text-sm',
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      render: (value) => {
        const statusConfig = {
          active: { label: 'Activo', className: 'bg-green-100 text-green-800 border-green-200' },
          inactive: { label: 'Inactivo', className: 'bg-gray-100 text-gray-800 border-gray-200' },
          pending: {
            label: 'Pendiente',
            className: 'bg-amber-100 text-amber-800 border-amber-200',
          },
        };
        const config = statusConfig[value as keyof typeof statusConfig];
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
          >
            {config.label}
          </span>
        );
      },
    },
    {
      key: 'totalPolicies',
      label: 'Pólizas',
      sortable: true,
      align: 'center',
      render: (value) => (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-medium text-sm">
          {value as React.ReactNode}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Fecha Registro',
      sortable: true,
      render: (value) => (value as Date).toLocaleDateString('es-MX'),
    },
    {
      key: 'actions',
      label: 'Acciones',
      align: 'center',
    },
  ];

  const actions: DataTableAction<Client>[] = [
    {
      icon: Eye,
      label: 'Ver',
      onClick: handleView,
      hoverColor: '#093FB4',
    },
    {
      icon: Edit,
      label: 'Editar',
      onClick: handleEdit,
      hoverColor: '#ED3500',
    },
    {
      icon: Archive,
      label: 'Archivar',
      onClick: handleArchive,
      hoverColor: '#999999',
      show: (client) => client.status !== 'inactive',
    },
  ];

  return (
    <ListViewLayout<Client>
      currentPage={currentPage}
      data={mockClients}
      itemsPerPage={itemsPerPage}
      loading={loading}
      primaryAction={{
        label: 'Nuevo Cliente',
        shortLabel: 'Nuevo',
        icon: Plus,
        onClick: () => console.info('Add new client'),
      }}
      searchValue={searchValue}
      tableConfig={{
        columns,
        actions,
        selectable: true,
        selectedRows,
        onSelectRow: handleSelectRow,
        onSelectAll: handleSelectAll,
        onSort: handleSort,
        sortKey,
        sortDirection,
        getRowId: (client) => client.id,
        emptyMessage: 'No hay clientes registrados',
      }}
      totalItems={mockClients.length}
      totalPages={Math.ceil(mockClients.length / itemsPerPage)}
      viewMode={viewMode}
      onApplyFilters={() => console.info('Apply filters')}
      onClearFilters={() => setSearchValue('')}
      onItemsPerPageChange={setItemsPerPage}
      onPageChange={setCurrentPage}
      onSearchChange={setSearchValue}
      onViewModeChange={setViewMode}
    />
  );
}
