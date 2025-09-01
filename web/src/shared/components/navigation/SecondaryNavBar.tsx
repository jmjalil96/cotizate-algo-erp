import React from 'react';

interface NavPage {
  id: string;
  label: string;
}

interface ModuleConfig {
  label: string;
  pages: NavPage[];
}

interface SecondaryNavBarProps {
  currentModule?: string;
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

const moduleConfig: Record<string, ModuleConfig> = {
  core: {
    label: 'Core',
    pages: [
      { id: 'clients', label: 'Clientes' },
      { id: 'accounts', label: 'Cuentas' },
      { id: 'policies', label: 'Pólizas' },
    ],
  },
  sac: {
    label: 'SAC',
    pages: [
      { id: 'reimbursements', label: 'Reembolsos' },
      { id: 'medical-care', label: 'Atenciones Médicas' },
      { id: 'claims', label: 'Siniestros' },
    ],
  },
  billing: {
    label: 'Facturación',
    pages: [{ id: 'pre-settlements', label: 'Preliquidaciones' }],
  },
  commissions: {
    label: 'Comisiones',
    pages: [
      { id: 'settlements', label: 'Liquidaciones' },
      { id: 'cuts', label: 'Cortes' },
      { id: 'invoices', label: 'Facturas' },
    ],
  },
};

export function SecondaryNavBar({
  currentModule,
  currentPage,
  onNavigate,
}: SecondaryNavBarProps): React.JSX.Element | null {
  // Don't show secondary nav for dashboard or if no module is selected
  if (!currentModule || currentModule === 'dashboard' || !moduleConfig[currentModule]) {
    return null;
  }

  const module = moduleConfig[currentModule];

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm sticky top-14 z-40">
      <div className="px-4 sm:px-6">
        <div className="flex items-center h-12">
          {/* Module Label - Mobile Only */}
          <span className="lg:hidden text-sm font-medium text-gray-500 mr-4">{module.label}:</span>

          {/* Navigation Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto">
            {module.pages.map((page) => (
              <button
                key={page.id}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  currentPage === page.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                style={currentPage === page.id ? { backgroundColor: '#093FB4' } : {}}
                onClick={() => onNavigate?.(page.id)}
              >
                {page.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
