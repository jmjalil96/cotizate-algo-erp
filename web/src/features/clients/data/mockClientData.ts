// Comprehensive mock data for client detail view
// All data in one file for easy tracking

import { type TimelineEvent } from '../../../shared/components/ui';

export interface ClientDetail {
  id: string;
  // Company Information
  name: string;
  commercialName: string;
  rfc: string;
  taxRegime: string;
  industry: string;
  employeeCount: number;
  annualRevenue: number;
  website: string;
  status: 'active' | 'inactive' | 'pending';

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

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastActivity: Date;

  // Statistics
  totalPolicies: number;
  activePolicies: number;
  totalClaims: number;
  totalPremium: number;

  // Notes
  internalNotes: string;
}

export interface Contact {
  id: string;
  clientId: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  mobile: string;
  isPrimary: boolean;
  department: string;
  birthDate: Date | null;
  createdAt: Date;
}

export interface Policy {
  id: string;
  clientId: string;
  policyNumber: string;
  type: string;
  insurer: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  startDate: Date;
  endDate: Date;
  premium: number;
  deductible: number;
  coverage: string;
  createdAt: Date;
}

export interface Claim {
  id: string;
  clientId: string;
  claimNumber: string;
  policyId: string;
  policyNumber: string;
  type: string;
  status: 'open' | 'in_review' | 'approved' | 'rejected' | 'paid';
  amount: number;
  deductible: number;
  dateOfLoss: Date;
  reportedDate: Date;
  description: string;
  createdAt: Date;
}

export interface Document {
  id: string;
  clientId: string;
  name: string;
  type: string;
  category: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
  lastModified: Date;
  url: string;
}

// Mock client with ID "1" - Full details
export const mockClientDetail: ClientDetail = {
  id: '1',
  // Company Information
  name: 'Empresa Ejemplo S.A. de C.V.',
  commercialName: 'Grupo Ejemplo',
  rfc: 'EEJ123456789',
  taxRegime: '601 - General de Ley Personas Morales',
  industry: 'Tecnología y Software',
  employeeCount: 250,
  annualRevenue: 45000000,
  website: 'https://www.ejemplo.com.mx',
  status: 'active',

  // Contact Information
  email: 'contacto@ejemplo.com',
  phone: '555-123-4567',
  alternatePhone: '555-123-4568',
  fax: '555-123-4569',

  // Address
  street: 'Av. Reforma',
  exteriorNumber: '123',
  interiorNumber: 'Piso 10',
  colony: 'Polanco',
  city: 'Ciudad de México',
  state: 'CDMX',
  postalCode: '11560',
  country: 'México',

  // Banking Information
  bankName: 'BBVA México',
  accountNumber: '0123456789',
  clabe: '012180001234567890',

  // Internal Information
  accountExecutive: 'María González',
  segment: 'Corporativo',
  paymentTerms: '30 días',
  creditLimit: 500000,
  discount: 10,

  // Timestamps
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-03-20'),
  lastActivity: new Date('2024-03-25'),

  // Statistics
  totalPolicies: 8,
  activePolicies: 3,
  totalClaims: 5,
  totalPremium: 850000,

  // Notes
  internalNotes:
    'Cliente preferencial. Renovación automática de pólizas. Requiere atención personalizada en claims.',
};

// Mock contacts
export const mockContacts: Contact[] = [
  {
    id: 'c1',
    clientId: '1',
    name: 'Juan Carlos Pérez',
    position: 'Director General',
    email: 'jperez@ejemplo.com',
    phone: '555-123-4567 ext. 101',
    mobile: '555-987-6543',
    isPrimary: true,
    department: 'Dirección',
    birthDate: new Date('1975-05-15'),
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'c2',
    clientId: '1',
    name: 'Ana María López',
    position: 'Gerente de Finanzas',
    email: 'alopez@ejemplo.com',
    phone: '555-123-4567 ext. 102',
    mobile: '555-876-5432',
    isPrimary: false,
    department: 'Finanzas',
    birthDate: new Date('1982-09-22'),
    createdAt: new Date('2024-01-16'),
  },
  {
    id: 'c3',
    clientId: '1',
    name: 'Roberto Martínez',
    position: 'Coordinador de Seguros',
    email: 'rmartinez@ejemplo.com',
    phone: '555-123-4567 ext. 103',
    mobile: '555-765-4321',
    isPrimary: false,
    department: 'Administración',
    birthDate: null,
    createdAt: new Date('2024-02-01'),
  },
];

// Mock policies
export const mockPolicies: Policy[] = [
  {
    id: 'p1',
    clientId: '1',
    policyNumber: 'GMM-2024-001',
    type: 'Gastos Médicos Mayores',
    insurer: 'AXA Seguros',
    status: 'active',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    premium: 350000,
    deductible: 10000,
    coverage: 'Plan Ejecutivo - Suma asegurada $20,000,000',
    createdAt: new Date('2023-12-15'),
  },
  {
    id: 'p2',
    clientId: '1',
    policyNumber: 'AUTO-2024-002',
    type: 'Flotilla Autos',
    insurer: 'Qualitas',
    status: 'active',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2025-01-31'),
    premium: 180000,
    deductible: 5000,
    coverage: 'Cobertura Amplia - 25 unidades',
    createdAt: new Date('2024-01-20'),
  },
  {
    id: 'p3',
    clientId: '1',
    policyNumber: 'RESP-2024-003',
    type: 'Responsabilidad Civil',
    insurer: 'Chubb Seguros',
    status: 'active',
    startDate: new Date('2024-03-01'),
    endDate: new Date('2025-02-28'),
    premium: 120000,
    deductible: 25000,
    coverage: 'RC General hasta $50,000,000',
    createdAt: new Date('2024-02-15'),
  },
  {
    id: 'p4',
    clientId: '1',
    policyNumber: 'GMM-2023-001',
    type: 'Gastos Médicos Mayores',
    insurer: 'AXA Seguros',
    status: 'expired',
    startDate: new Date('2023-01-01'),
    endDate: new Date('2023-12-31'),
    premium: 320000,
    deductible: 10000,
    coverage: 'Plan Ejecutivo - Suma asegurada $15,000,000',
    createdAt: new Date('2022-12-10'),
  },
  {
    id: 'p5',
    clientId: '1',
    policyNumber: 'VIDA-2024-004',
    type: 'Vida Grupo',
    insurer: 'MetLife',
    status: 'pending',
    startDate: new Date('2024-04-01'),
    endDate: new Date('2025-03-31'),
    premium: 200000,
    deductible: 0,
    coverage: 'Vida Grupo 24 meses de sueldo',
    createdAt: new Date('2024-03-15'),
  },
];

// Mock claims
export const mockClaims: Claim[] = [
  {
    id: 'cl1',
    clientId: '1',
    claimNumber: 'CLM-2024-0145',
    policyId: 'p1',
    policyNumber: 'GMM-2024-001',
    type: 'Gastos Médicos',
    status: 'paid',
    amount: 45000,
    deductible: 10000,
    dateOfLoss: new Date('2024-02-10'),
    reportedDate: new Date('2024-02-11'),
    description: 'Cirugía de rodilla - empleado Juan Hernández',
    createdAt: new Date('2024-02-11'),
  },
  {
    id: 'cl2',
    clientId: '1',
    claimNumber: 'CLM-2024-0234',
    policyId: 'p2',
    policyNumber: 'AUTO-2024-002',
    type: 'Colisión Vehicular',
    status: 'in_review',
    amount: 35000,
    deductible: 5000,
    dateOfLoss: new Date('2024-03-05'),
    reportedDate: new Date('2024-03-05'),
    description: 'Colisión en estacionamiento - Unidad 15',
    createdAt: new Date('2024-03-05'),
  },
  {
    id: 'cl3',
    clientId: '1',
    claimNumber: 'CLM-2024-0089',
    policyId: 'p1',
    policyNumber: 'GMM-2024-001',
    type: 'Gastos Médicos',
    status: 'approved',
    amount: 12000,
    deductible: 10000,
    dateOfLoss: new Date('2024-01-20'),
    reportedDate: new Date('2024-01-21'),
    description: 'Consultas y estudios - empleada María Sánchez',
    createdAt: new Date('2024-01-21'),
  },
  {
    id: 'cl4',
    clientId: '1',
    claimNumber: 'CLM-2023-0567',
    policyId: 'p4',
    policyNumber: 'GMM-2023-001',
    type: 'Gastos Médicos',
    status: 'paid',
    amount: 150000,
    deductible: 10000,
    dateOfLoss: new Date('2023-11-15'),
    reportedDate: new Date('2023-11-16'),
    description: 'Hospitalización por COVID - empleado Roberto García',
    createdAt: new Date('2023-11-16'),
  },
  {
    id: 'cl5',
    clientId: '1',
    claimNumber: 'CLM-2024-0301',
    policyId: 'p3',
    policyNumber: 'RESP-2024-003',
    type: 'Responsabilidad Civil',
    status: 'open',
    amount: 75000,
    deductible: 25000,
    dateOfLoss: new Date('2024-03-20'),
    reportedDate: new Date('2024-03-21'),
    description: 'Daños a terceros en instalaciones',
    createdAt: new Date('2024-03-21'),
  },
];

// Mock documents
export const mockDocuments: Document[] = [
  {
    id: 'd1',
    clientId: '1',
    name: 'Acta Constitutiva.pdf',
    type: 'PDF',
    category: 'Legal',
    size: 2456789,
    uploadedBy: 'María González',
    uploadedAt: new Date('2024-01-15'),
    lastModified: new Date('2024-01-15'),
    url: '/documents/acta-constitutiva.pdf',
  },
  {
    id: 'd2',
    clientId: '1',
    name: 'Constancia Situación Fiscal.pdf',
    type: 'PDF',
    category: 'Fiscal',
    size: 345678,
    uploadedBy: 'María González',
    uploadedAt: new Date('2024-01-15'),
    lastModified: new Date('2024-03-01'),
    url: '/documents/constancia-fiscal.pdf',
  },
  {
    id: 'd3',
    clientId: '1',
    name: 'Poder Notarial Representante.pdf',
    type: 'PDF',
    category: 'Legal',
    size: 1234567,
    uploadedBy: 'Roberto Martínez',
    uploadedAt: new Date('2024-01-20'),
    lastModified: new Date('2024-01-20'),
    url: '/documents/poder-notarial.pdf',
  },
  {
    id: 'd4',
    clientId: '1',
    name: 'Estado de Cuenta Bancario.pdf',
    type: 'PDF',
    category: 'Financiero',
    size: 567890,
    uploadedBy: 'Ana López',
    uploadedAt: new Date('2024-02-15'),
    lastModified: new Date('2024-02-15'),
    url: '/documents/estado-cuenta.pdf',
  },
  {
    id: 'd5',
    clientId: '1',
    name: 'Censo Empleados 2024.xlsx',
    type: 'Excel',
    category: 'Operativo',
    size: 892345,
    uploadedBy: 'Juan Pérez',
    uploadedAt: new Date('2024-03-10'),
    lastModified: new Date('2024-03-15'),
    url: '/documents/censo-empleados.xlsx',
  },
  {
    id: 'd6',
    clientId: '1',
    name: 'Comprobante Domicilio.pdf',
    type: 'PDF',
    category: 'Legal',
    size: 234567,
    uploadedBy: 'María González',
    uploadedAt: new Date('2024-01-16'),
    lastModified: new Date('2024-01-16'),
    url: '/documents/comprobante-domicilio.pdf',
  },
];

// Mock timeline events for client onboarding
export const mockTimelineEvents: TimelineEvent[] = [
  {
    id: 'contact',
    title: 'Contacto Inicial',
    description: 'Primer contacto y solicitud',
    status: 'completed',
  },
  {
    id: 'documentation',
    title: 'Documentación',
    description: 'Recopilación de documentos',
    status: 'completed',
  },
  {
    id: 'review',
    title: 'Revisión',
    description: 'Análisis de riesgos',
    status: 'active',
    canGoBack: true,
    canContinue: true,
  },
  {
    id: 'approval',
    title: 'Aprobación',
    description: 'Autorización final',
    status: 'pending',
  },
  {
    id: 'activation',
    title: 'Activación',
    description: 'Cliente activo',
    status: 'pending',
  },
];

// Helper function to get all data for a client
export function getClientData(clientId: string): {
  client: ClientDetail | null;
  contacts: Contact[];
  policies: Policy[];
  claims: Claim[];
  documents: Document[];
  timeline: TimelineEvent[];
} {
  if (clientId !== '1') {
    // Return empty data for non-existent clients
    return {
      client: null,
      contacts: [],
      policies: [],
      claims: [],
      documents: [],
      timeline: [],
    };
  }

  return {
    client: mockClientDetail,
    contacts: mockContacts,
    policies: mockPolicies,
    claims: mockClaims,
    documents: mockDocuments,
    timeline: mockTimelineEvents,
  };
}

// Helper to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}
