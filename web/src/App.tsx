import { useState } from 'react';

import { ClientDetailPage } from './features/clients/pages/ClientDetailPage';
import { ClientEditPage } from './features/clients/pages/ClientEditPage';
import { ClientsPage } from './features/clients/pages/ClientsPage';
import { AppShell } from './shared/components/layouts';

type View = 'list' | 'detail' | 'edit';

function App(): React.JSX.Element {
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [currentModule, setCurrentModule] = useState<string>('clients');

  const handleClientSelect = (clientId: string): void => {
    setSelectedClientId(clientId);
    setCurrentView('detail');
  };

  const handleEdit = (): void => {
    setCurrentView('edit');
  };

  const handleBack = (): void => {
    setCurrentView('list');
  };

  const handleSave = (): void => {
    // Simulate save and go back to detail view
    console.info('Client saved');
    setCurrentView('detail');
  };

  const handleCancel = (): void => {
    setCurrentView('detail');
  };

  const handleModuleNavigate = (module: string): void => {
    setCurrentModule(module);
    // Reset to list view when changing modules
    setCurrentView('list');
  };

  // Render content based on current view
  const renderContent = (): React.JSX.Element => {
    switch (currentView) {
      case 'detail':
        return (
          <ClientDetailPage clientId={selectedClientId} onBack={handleBack} onEdit={handleEdit} />
        );

      case 'edit':
        return (
          <ClientEditPage clientId={selectedClientId} onCancel={handleCancel} onSave={handleSave} />
        );

      case 'list':
      default:
        return <ClientsPage onClientSelect={handleClientSelect} />;
    }
  };

  return (
    <AppShell
      currentModule={currentModule}
      currentPage="clients"
      userName="Usuario Demo"
      onModuleNavigate={handleModuleNavigate}
      onPageNavigate={(page: string) => {
        console.info('Navigate to page:', page);
        // Handle sub-page navigation within a module
      }}
      onSettingsClick={() => {
        console.info('Settings clicked');
      }}
      onSignOut={() => {
        console.info('Sign out clicked');
      }}
    >
      {renderContent()}
    </AppShell>
  );
}

export default App;
