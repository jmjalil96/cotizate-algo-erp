import React, { useState } from 'react';

import {
  Building2,
  Users,
  FileText,
  AlertCircle,
  FolderOpen,
  Edit,
  Archive,
  Download,
  Eye,
} from 'lucide-react';

import { DetailViewLayout } from '../../../shared/components/layouts';
import {
  DetailTabs,
  DetailSection,
  DetailField,
  RelatedRecordsTable,
  Timeline,
  type Tab,
  type DataTableColumn,
  type DataTableAction,
} from '../../../shared/components/ui';
import {
  getClientData,
  formatFileSize,
  type Contact,
  type Policy,
  type Claim,
  type Document,
} from '../data/mockClientData';

interface ClientDetailPageProps {
  clientId: string;
  onBack: () => void;
  onEdit?: () => void;
}

export function ClientDetailPage({
  clientId,
  onBack,
  onEdit,
}: ClientDetailPageProps): React.JSX.Element {
  const { client, contacts, policies, claims, documents, timeline } = getClientData(clientId);
  const [_activeTab, setActiveTab] = useState('general');

  // Handle inline edit save (needs to be inside component for client context)
  // eslint-disable-next-line unicorn/consistent-function-scoping
  const handleFieldSave = async (field: string, value: unknown): Promise<void> => {
    console.info(`Saving ${field}:`, value);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  if (!client) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-700">Cliente no encontrado</p>
        </div>
      </div>
    );
  }

  // Contact table columns
  const contactColumns: DataTableColumn<Contact>[] = [
    {
      key: 'name',
      label: 'Nombre',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value as React.ReactNode}</div>
          <div className="text-sm text-gray-500">{row.position}</div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (value) => (
        <a className="text-blue-600 hover:underline" href={`mailto:${value}`}>
          {value as React.ReactNode}
        </a>
      ),
    },
    {
      key: 'phone',
      label: 'Teléfono',
    },
    {
      key: 'department',
      label: 'Departamento',
    },
    {
      key: 'isPrimary',
      label: 'Principal',
      render: (value) =>
        value ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Principal
          </span>
        ) : null,
    },
  ];

  // Policy table columns
  const policyColumns: DataTableColumn<Policy>[] = [
    {
      key: 'policyNumber',
      label: 'Número de Póliza',
      render: (value) => (
        <span className="font-medium text-gray-900">{value as React.ReactNode}</span>
      ),
    },
    {
      key: 'type',
      label: 'Tipo',
    },
    {
      key: 'insurer',
      label: 'Aseguradora',
    },
    {
      key: 'status',
      label: 'Estado',
      render: (value) => {
        const statusConfig = {
          active: {
            label: 'Vigente',
            className:
              'bg-gradient-to-r from-green-50 to-green-100 text-green-800 border border-green-200',
          },
          expired: {
            label: 'Vencida',
            className: 'bg-gradient-to-r from-red-50 to-red-100 text-red-800 border border-red-200',
          },
          cancelled: {
            label: 'Cancelada',
            className:
              'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border border-gray-200',
          },
          pending: {
            label: 'Pendiente',
            className:
              'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 border border-amber-200',
          },
        };
        const config = statusConfig[value as keyof typeof statusConfig];
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm ${config.className}`}
          >
            <span className="w-1.5 h-1.5 rounded-full mr-1.5 ${value === 'active' ? 'bg-green-500' : value === 'expired' ? 'bg-red-500' : value === 'pending' ? 'bg-amber-500' : 'bg-gray-500'}" />
            {config.label}
          </span>
        );
      },
    },
    {
      key: 'premium',
      label: 'Prima',
      render: (value) => `$${(value as number).toLocaleString('es-MX')}`,
    },
    {
      key: 'endDate',
      label: 'Vigencia',
      render: (value) => (value as Date).toLocaleDateString('es-MX'),
    },
  ];

  // Claim table columns
  const claimColumns: DataTableColumn<Claim>[] = [
    {
      key: 'claimNumber',
      label: 'Número',
      render: (value) => (
        <span className="font-medium text-gray-900">{value as React.ReactNode}</span>
      ),
    },
    {
      key: 'policyNumber',
      label: 'Póliza',
    },
    {
      key: 'type',
      label: 'Tipo',
    },
    {
      key: 'status',
      label: 'Estado',
      render: (value) => {
        const statusConfig = {
          open: {
            label: 'Abierto',
            className:
              'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border border-blue-200',
          },
          in_review: {
            label: 'En Revisión',
            className:
              'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 border border-yellow-200',
          },
          approved: {
            label: 'Aprobado',
            className:
              'bg-gradient-to-r from-green-50 to-green-100 text-green-800 border border-green-200',
          },
          rejected: {
            label: 'Rechazado',
            className: 'bg-gradient-to-r from-red-50 to-red-100 text-red-800 border border-red-200',
          },
          paid: {
            label: 'Pagado',
            className:
              'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border border-gray-200',
          },
        };
        const config = statusConfig[value as keyof typeof statusConfig];
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm ${config.className}`}
          >
            {config.label}
          </span>
        );
      },
    },
    {
      key: 'amount',
      label: 'Monto',
      render: (value) => `$${(value as number).toLocaleString('es-MX')}`,
    },
    {
      key: 'reportedDate',
      label: 'Fecha Reporte',
      render: (value) => (value as Date).toLocaleDateString('es-MX'),
    },
  ];

  // Document table columns
  const documentColumns: DataTableColumn<Document>[] = [
    {
      key: 'name',
      label: 'Nombre',
      render: (value, row) => (
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-gray-400 mr-2" />
          <div>
            <div className="font-medium text-gray-900">{value as React.ReactNode}</div>
            <div className="text-sm text-gray-500">{row.category}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'size',
      label: 'Tamaño',
      render: (value) => formatFileSize(value as number),
    },
    {
      key: 'uploadedBy',
      label: 'Subido por',
    },
    {
      key: 'uploadedAt',
      label: 'Fecha',
      render: (value) => (value as Date).toLocaleDateString('es-MX'),
    },
  ];

  // Document actions
  const documentActions: DataTableAction<Document>[] = [
    {
      icon: Eye,
      label: 'Ver',
      onClick: (doc) => console.info('View document:', doc),
    },
    {
      icon: Download,
      label: 'Descargar',
      onClick: (doc) => console.info('Download document:', doc),
    },
  ];

  // Define tabs
  const tabs: Tab[] = [
    {
      id: 'general',
      label: 'Información General',
      icon: Building2,
      content: (
        <div className="space-y-6">
          {/* Company Information */}
          <DetailSection
            accentColor="blue"
            columns={3}
            description="Datos generales y fiscales del cliente"
            title="Información de la Empresa"
          >
            <DetailField label="Razón Social" span={2} value={client.name} />
            <DetailField copyable label="RFC" value={client.rfc} />
            <DetailField
              editable
              label="Nombre Comercial"
              value={client.commercialName}
              onSave={(value) => handleFieldSave('commercialName', value)}
            />
            <DetailField label="Régimen Fiscal" span={2} value={client.taxRegime} />
            <DetailField
              editable
              label="Industria"
              value={client.industry}
              onSave={(value) => handleFieldSave('industry', value)}
            />
            <DetailField label="Número de Empleados" type="number" value={client.employeeCount} />
            <DetailField label="Ingresos Anuales" type="currency" value={client.annualRevenue} />
            <DetailField label="Sitio Web" type="url" value={client.website} />
            <DetailField label="Estado" type="badge" value={client.status} />
          </DetailSection>

          {/* Contact Information */}
          <DetailSection accentColor="blue" columns={2} title="Información de Contacto">
            <DetailField
              editable
              label="Email Principal"
              type="email"
              value={client.email}
              onSave={(value) => handleFieldSave('email', value)}
            />
            <DetailField
              editable
              label="Teléfono"
              type="phone"
              value={client.phone}
              onSave={(value) => handleFieldSave('phone', value)}
            />
            <DetailField label="Teléfono Alternativo" type="phone" value={client.alternatePhone} />
            <DetailField label="Fax" value={client.fax} />
          </DetailSection>

          {/* Address */}
          <DetailSection accentColor="blue" columns={3} title="Dirección">
            <DetailField label="Calle" span={2} value={client.street} />
            <DetailField label="Número Exterior" value={client.exteriorNumber} />
            <DetailField label="Número Interior" value={client.interiorNumber} />
            <DetailField label="Colonia" value={client.colony} />
            <DetailField label="Ciudad" value={client.city} />
            <DetailField label="Estado" value={client.state} />
            <DetailField label="Código Postal" value={client.postalCode} />
            <DetailField label="País" value={client.country} />
          </DetailSection>

          {/* Banking Information */}
          <DetailSection accentColor="blue" columns={3} title="Información Bancaria">
            <DetailField label="Banco" value={client.bankName} />
            <DetailField copyable label="Número de Cuenta" value={client.accountNumber} />
            <DetailField copyable label="CLABE" value={client.clabe} />
          </DetailSection>

          {/* Internal Information */}
          <DetailSection accentColor="blue" columns={3} title="Información Interna">
            <DetailField label="Ejecutivo de Cuenta" value={client.accountExecutive} />
            <DetailField label="Segmento" type="badge" value={client.segment} />
            <DetailField label="Términos de Pago" value={client.paymentTerms} />
            <DetailField
              editable
              label="Límite de Crédito"
              type="currency"
              value={client.creditLimit}
              onSave={(value) => handleFieldSave('creditLimit', value)}
            />
            <DetailField
              editable
              label="Descuento"
              type="percent"
              value={client.discount}
              onSave={(value) => handleFieldSave('discount', value)}
            />
            <DetailField label="Última Actividad" type="date" value={client.lastActivity} />
            <DetailField
              editable
              label="Notas Internas"
              span={3}
              type="multiline"
              value={client.internalNotes}
              onSave={(value) => handleFieldSave('internalNotes', value)}
            />
          </DetailSection>
        </div>
      ),
    },
    {
      id: 'contacts',
      label: 'Contactos',
      icon: Users,
      count: contacts.length,
      content: (
        <RelatedRecordsTable
          addLabel="Agregar Contacto"
          columns={contactColumns}
          data={contacts}
          description="Personas de contacto autorizadas"
          getRowId={(contact) => contact.id}
          icon={Users}
          title="Contactos del Cliente"
          onAdd={() => console.info('Add new contact')}
        />
      ),
    },
    {
      id: 'policies',
      label: 'Pólizas',
      icon: FileText,
      count: policies.length,
      content: (
        <RelatedRecordsTable
          addLabel="Nueva Póliza"
          columns={policyColumns}
          data={policies}
          description="Historial de pólizas del cliente"
          getRowId={(policy) => policy.id}
          icon={FileText}
          title="Pólizas Contratadas"
          onAdd={() => console.info('Add new policy')}
          onViewAll={() => console.info('View all policies')}
        />
      ),
    },
    {
      id: 'claims',
      label: 'Siniestros',
      icon: AlertCircle,
      count: claims.length,
      content: (
        <RelatedRecordsTable
          addLabel="Reportar Siniestro"
          columns={claimColumns}
          data={claims}
          description="Reclamaciones y siniestros reportados"
          getRowId={(claim) => claim.id}
          icon={AlertCircle}
          title="Historial de Siniestros"
          onAdd={() => console.info('Report new claim')}
          onViewAll={() => console.info('View all claims')}
        />
      ),
    },
    {
      id: 'documents',
      label: 'Documentos',
      icon: FolderOpen,
      count: documents.length,
      content: (
        <RelatedRecordsTable
          actions={documentActions}
          addLabel="Subir Documento"
          columns={documentColumns}
          data={documents}
          description="Archivos y documentación relacionada"
          getRowId={(doc) => doc.id}
          icon={FolderOpen}
          maxRows={10}
          title="Documentos del Cliente"
          onAdd={() => console.info('Upload document')}
        />
      ),
    },
  ];

  return (
    <DetailViewLayout
      breadcrumbs={[
        { label: 'Core' },
        { label: 'Clientes', onClick: onBack },
        { label: client.name },
      ]}
      headerActions={[
        {
          label: 'Editar',
          icon: Edit,
          onClick: onEdit ?? (() => console.info('Edit client')),
          variant: 'secondary',
        },
        {
          label: 'Archivar',
          icon: Archive,
          onClick: () => console.info('Archive client'),
          variant: 'danger',
        },
      ]}
      icon={Building2}
      subtitle={`RFC: ${client.rfc} • ${client.segment}`}
      title={client.name}
      onBack={onBack}
    >
      {/* Client Onboarding Timeline */}
      {timeline && timeline.length > 0 && (
        <Timeline
          className="mb-6"
          events={timeline}
          title="Proceso de Onboarding"
          onContinue={(eventId: string) => console.info(`Continue from step: ${eventId}`)}
          onGoBack={(eventId: string) => console.info(`Go back from step: ${eventId}`)}
        />
      )}

      {/* Detail Tabs */}
      <DetailTabs defaultTab="general" tabs={tabs} onChange={setActiveTab} />
    </DetailViewLayout>
  );
}
