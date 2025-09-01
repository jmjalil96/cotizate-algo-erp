import React, { useState, useEffect } from 'react';

import { Building2 } from 'lucide-react';

import { EditViewLayout } from '../../../shared/components/layouts';
import { EditSection, EditField, ContextPanel, FieldHelp } from '../../../shared/components/ui';
import { getClientData } from '../data/mockClientData';

interface ClientEditPageProps {
  clientId: string;
  onSave: () => void;
  onCancel: () => void;
}

interface FormData {
  // Company Information
  name: string;
  commercialName: string;
  rfc: string;
  taxRegime: string;
  industry: string;
  employeeCount: number;
  annualRevenue: number;
  website: string;
  status: string;

  // Contact Information
  email: string;
  phone: string;
  alternatePhone: string;
  fax: string;

  // Address
  street: string;
  exteriorNumber: string;
  interiorNumber: string;
  colony: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;

  // Banking Information
  bankName: string;
  accountNumber: string;
  clabe: string;

  // Internal Information
  accountExecutive: string;
  segment: string;
  paymentTerms: string;
  creditLimit: number;
  discount: number;
  internalNotes: string;
}

export function ClientEditPage({
  clientId,
  onSave: onSaveCallback,
  onCancel,
}: ClientEditPageProps): React.JSX.Element {
  const { client } = getClientData(clientId);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    commercialName: '',
    rfc: '',
    taxRegime: '',
    industry: '',
    employeeCount: 0,
    annualRevenue: 0,
    website: '',
    status: '',
    email: '',
    phone: '',
    alternatePhone: '',
    fax: '',
    street: '',
    exteriorNumber: '',
    interiorNumber: '',
    colony: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    bankName: '',
    accountNumber: '',
    clabe: '',
    accountExecutive: '',
    segment: '',
    paymentTerms: '',
    creditLimit: 0,
    discount: 0,
    internalNotes: '',
  });

  const [originalData, setOriginalData] = useState<FormData>(formData);
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentField, setCurrentField] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Load client data
  useEffect(() => {
    if (client) {
      const data: FormData = {
        name: client.name,
        commercialName: client.commercialName,
        rfc: client.rfc,
        taxRegime: client.taxRegime,
        industry: client.industry,
        employeeCount: client.employeeCount,
        annualRevenue: client.annualRevenue,
        website: client.website,
        status: client.status,
        email: client.email,
        phone: client.phone,
        alternatePhone: client.alternatePhone,
        fax: client.fax,
        street: client.street,
        exteriorNumber: client.exteriorNumber,
        interiorNumber: client.interiorNumber,
        colony: client.colony,
        city: client.city,
        state: client.state,
        postalCode: client.postalCode,
        country: client.country,
        bankName: client.bankName,
        accountNumber: client.accountNumber,
        clabe: client.clabe,
        accountExecutive: client.accountExecutive,
        segment: client.segment,
        paymentTerms: client.paymentTerms,
        creditLimit: client.creditLimit,
        discount: client.discount,
        internalNotes: client.internalNotes,
      };
      setFormData(data);
      setOriginalData(data);
    }
  }, [client]);

  // Handle field change
  const handleFieldChange = (name: string, value: unknown): void => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Track dirty fields
    if (originalData[name as keyof FormData] !== value) {
      setDirtyFields((prev) => new Set(prev).add(name));
    } else {
      setDirtyFields((prev) => {
        const newSet = new Set(prev);
        newSet.delete(name);
        return newSet;
      });
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        // Remove error for this field
        const updatedErrors = { ...newErrors };
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete updatedErrors[name];
        return updatedErrors;
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) newErrors.name = 'Razón social es requerida';
    if (!formData.rfc) newErrors.rfc = 'RFC es requerido';
    if (!formData.email) newErrors.email = 'Email es requerido';
    if (!formData.phone) newErrors.phone = 'Teléfono es requerido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async (): Promise<void> => {
    if (!validateForm()) return;

    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
    onSaveCallback();
  };

  // Handle reset
  const handleReset = (): void => {
    setFormData(originalData);
    setDirtyFields(new Set());
    setErrors({});
  };

  // Context panel sections
  const contextSections = [
    {
      title: 'Ayuda del Campo',
      type: 'help' as const,
      content: currentField ? (
        <FieldHelp title={currentField}>{getFieldHelp(currentField)}</FieldHelp>
      ) : (
        <p className="text-sm">Selecciona un campo para ver ayuda específica.</p>
      ),
    },
    {
      title: 'Reglas de Validación',
      type: 'info' as const,
      content: (
        <ul className="space-y-1 text-sm">
          <li>• RFC debe tener formato válido</li>
          <li>• Email debe ser único</li>
          <li>• Teléfono en formato (555) 123-4567</li>
          <li>• Límite de crédito máximo: $10,000,000</li>
        </ul>
      ),
    },
  ];

  if (!client) {
    return <div>Cliente no encontrado</div>;
  }

  return (
    <EditViewLayout
      breadcrumbs={[
        { label: 'Clientes', onClick: onCancel },
        { label: client.name, onClick: onCancel },
        { label: 'Editar' },
      ]}
      contextPanel={<ContextPanel currentField={currentField} sections={contextSections} />}
      icon={Building2}
      isDirty={dirtyFields.size > 0}
      isSaving={isSaving}
      modifiedCount={dirtyFields.size}
      subtitle="Modifica la información del cliente"
      title={`Editar: ${client.name}`}
      onBack={onCancel}
      onCancel={onCancel}
      onReset={handleReset}
      onSave={handleSave}
    >
      <div className="space-y-6">
        {/* Company Information */}
        <EditSection
          columns={2}
          description="Datos generales y fiscales del cliente"
          hasErrors={!!(errors.name ?? errors.rfc)}
          modifiedCount={
            [
              'name',
              'commercialName',
              'rfc',
              'taxRegime',
              'industry',
              'employeeCount',
              'annualRevenue',
              'website',
              'status',
            ].filter((field) => dirtyFields.has(field)).length
          }
          title="Información de la Empresa"
        >
          <EditField
            required
            error={errors.name}
            isDirty={dirtyFields.has('name')}
            label="Razón Social"
            name="name"
            value={formData.name}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
          <EditField
            isDirty={dirtyFields.has('commercialName')}
            label="Nombre Comercial"
            name="commercialName"
            value={formData.commercialName}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
          <EditField
            required
            error={errors.rfc}
            isDirty={dirtyFields.has('rfc')}
            label="RFC"
            name="rfc"
            placeholder="ABC123456789"
            value={formData.rfc}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
          <EditField
            isDirty={dirtyFields.has('taxRegime')}
            label="Régimen Fiscal"
            name="taxRegime"
            options={[
              { value: '601', label: '601 - General de Ley Personas Morales' },
              { value: '603', label: '603 - Personas Morales con Fines no Lucrativos' },
              { value: '605', label: '605 - Sueldos y Salarios' },
              { value: '606', label: '606 - Arrendamiento' },
            ]}
            type="select"
            value={formData.taxRegime}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
          <EditField
            isDirty={dirtyFields.has('industry')}
            label="Industria"
            name="industry"
            value={formData.industry}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
          <EditField
            isDirty={dirtyFields.has('employeeCount')}
            label="Número de Empleados"
            min={0}
            name="employeeCount"
            type="number"
            value={formData.employeeCount}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
          <EditField
            isDirty={dirtyFields.has('annualRevenue')}
            label="Ingresos Anuales"
            name="annualRevenue"
            type="currency"
            value={formData.annualRevenue}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
          <EditField
            isDirty={dirtyFields.has('website')}
            label="Sitio Web"
            name="website"
            type="url"
            value={formData.website}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
          <EditField
            isDirty={dirtyFields.has('status')}
            label="Estado"
            name="status"
            options={[
              { value: 'active', label: 'Activo' },
              { value: 'inactive', label: 'Inactivo' },
              { value: 'pending', label: 'Pendiente' },
            ]}
            type="select"
            value={formData.status}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
        </EditSection>

        {/* Contact Information */}
        <EditSection
          columns={2}
          hasErrors={!!(errors.email ?? errors.phone)}
          modifiedCount={
            ['email', 'phone', 'alternatePhone', 'fax'].filter((field) => dirtyFields.has(field))
              .length
          }
          title="Información de Contacto"
        >
          <EditField
            required
            error={errors.email}
            isDirty={dirtyFields.has('email')}
            label="Email Principal"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
          <EditField
            required
            error={errors.phone}
            isDirty={dirtyFields.has('phone')}
            label="Teléfono"
            name="phone"
            type="phone"
            value={formData.phone}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
          <EditField
            isDirty={dirtyFields.has('alternatePhone')}
            label="Teléfono Alternativo"
            name="alternatePhone"
            type="phone"
            value={formData.alternatePhone}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
          <EditField
            isDirty={dirtyFields.has('fax')}
            label="Fax"
            name="fax"
            value={formData.fax}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
        </EditSection>

        {/* Address */}
        <EditSection
          columns={3}
          modifiedCount={
            [
              'street',
              'exteriorNumber',
              'interiorNumber',
              'colony',
              'city',
              'state',
              'postalCode',
              'country',
            ].filter((field) => dirtyFields.has(field)).length
          }
          title="Dirección"
        >
          <EditField
            isDirty={dirtyFields.has('street')}
            label="Calle"
            name="street"
            value={formData.street}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
          <EditField
            isDirty={dirtyFields.has('exteriorNumber')}
            label="Número Exterior"
            name="exteriorNumber"
            value={formData.exteriorNumber}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
          <EditField
            isDirty={dirtyFields.has('interiorNumber')}
            label="Número Interior"
            name="interiorNumber"
            value={formData.interiorNumber}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
          <EditField
            isDirty={dirtyFields.has('colony')}
            label="Colonia"
            name="colony"
            value={formData.colony}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
          <EditField
            isDirty={dirtyFields.has('city')}
            label="Ciudad"
            name="city"
            value={formData.city}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
          <EditField
            isDirty={dirtyFields.has('state')}
            label="Estado"
            name="state"
            value={formData.state}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
          <EditField
            isDirty={dirtyFields.has('postalCode')}
            label="Código Postal"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
          <EditField
            isDirty={dirtyFields.has('country')}
            label="País"
            name="country"
            value={formData.country}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
        </EditSection>

        {/* Banking Information */}
        <EditSection
          columns={3}
          modifiedCount={
            ['bankName', 'accountNumber', 'clabe'].filter((field) => dirtyFields.has(field)).length
          }
          title="Información Bancaria"
        >
          <EditField
            isDirty={dirtyFields.has('bankName')}
            label="Banco"
            name="bankName"
            value={formData.bankName}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
          <EditField
            isDirty={dirtyFields.has('accountNumber')}
            label="Número de Cuenta"
            name="accountNumber"
            value={formData.accountNumber}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
          <EditField
            isDirty={dirtyFields.has('clabe')}
            label="CLABE"
            name="clabe"
            placeholder="012180001234567890"
            value={formData.clabe}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
        </EditSection>

        {/* Internal Information */}
        <EditSection
          columns={2}
          modifiedCount={
            [
              'accountExecutive',
              'segment',
              'paymentTerms',
              'creditLimit',
              'discount',
              'internalNotes',
            ].filter((field) => dirtyFields.has(field)).length
          }
          title="Información Interna"
        >
          <EditField
            isDirty={dirtyFields.has('accountExecutive')}
            label="Ejecutivo de Cuenta"
            name="accountExecutive"
            value={formData.accountExecutive}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
          <EditField
            isDirty={dirtyFields.has('segment')}
            label="Segmento"
            name="segment"
            options={[
              { value: 'Corporativo', label: 'Corporativo' },
              { value: 'Empresarial', label: 'Empresarial' },
              { value: 'PYME', label: 'PYME' },
              { value: 'Emprendedor', label: 'Emprendedor' },
            ]}
            type="select"
            value={formData.segment}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
          <EditField
            isDirty={dirtyFields.has('paymentTerms')}
            label="Términos de Pago"
            name="paymentTerms"
            value={formData.paymentTerms}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
          <EditField
            isDirty={dirtyFields.has('creditLimit')}
            label="Límite de Crédito"
            max={10000000}
            name="creditLimit"
            type="currency"
            value={formData.creditLimit}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
          <EditField
            isDirty={dirtyFields.has('discount')}
            label="Descuento (%)"
            max={100}
            min={0}
            name="discount"
            type="number"
            value={formData.discount}
            onChange={handleFieldChange}
            onFocus={setCurrentField}
          />
          <div className="col-span-2">
            <EditField
              isDirty={dirtyFields.has('internalNotes')}
              label="Notas Internas"
              name="internalNotes"
              rows={4}
              type="textarea"
              value={formData.internalNotes}
              onChange={handleFieldChange}
              onFocus={setCurrentField}
            />
          </div>
        </EditSection>
      </div>
    </EditViewLayout>
  );
}

// Helper function to get field-specific help
function getFieldHelp(fieldName: string): string {
  const helpTexts: Record<string, string> = {
    name: 'Nombre legal completo de la empresa tal como aparece en el acta constitutiva.',
    commercialName: 'Nombre comercial o marca bajo la cual opera la empresa.',
    rfc: 'Registro Federal de Contribuyentes. Debe tener 12 o 13 caracteres.',
    taxRegime: 'Régimen fiscal bajo el cual tributa la empresa ante el SAT.',
    industry: 'Sector o industria principal en la que opera la empresa.',
    employeeCount: 'Número total de empleados activos en la empresa.',
    annualRevenue: 'Ingresos totales anuales en pesos mexicanos.',
    website: 'URL completa del sitio web corporativo, incluyendo https://',
    status: 'Estado actual del cliente en el sistema.',
    email: 'Correo electrónico principal para comunicaciones oficiales.',
    phone: 'Número telefónico principal con formato (555) 123-4567.',
    alternatePhone: 'Número telefónico secundario para contacto.',
    fax: 'Número de fax si está disponible.',
    street: 'Nombre de la calle donde se ubica la empresa.',
    exteriorNumber: 'Número exterior del domicilio.',
    interiorNumber: 'Número interior, piso o departamento si aplica.',
    colony: 'Colonia o fraccionamiento.',
    city: 'Ciudad o municipio.',
    state: 'Estado o entidad federativa.',
    postalCode: 'Código postal de 5 dígitos.',
    country: 'País donde se encuentra la empresa.',
    bankName: 'Institución bancaria donde tiene cuenta la empresa.',
    accountNumber: 'Número de cuenta bancaria para transacciones.',
    clabe: 'CLABE interbancaria de 18 dígitos.',
    accountExecutive: 'Nombre del ejecutivo asignado a esta cuenta.',
    segment: 'Clasificación del cliente por tamaño o importancia.',
    paymentTerms: 'Condiciones de pago acordadas (ej: 30 días).',
    creditLimit: 'Monto máximo de crédito autorizado.',
    discount: 'Porcentaje de descuento aplicable.',
    internalNotes: 'Notas y observaciones internas sobre el cliente.',
  };

  return helpTexts[fieldName] ?? 'Ingresa la información solicitada.';
}
