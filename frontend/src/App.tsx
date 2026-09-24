import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { FilterProvider, useFilters } from './context/FilterContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { GlobalFilterBar } from './components/layout/GlobalFilterBar';
import { RecordDrawer } from './components/common/RecordDrawer';
import { ExecutiveOverview } from './components/views/ExecutiveOverview';
import { AdvancedSearch } from './components/views/AdvancedSearch';
import { DataExplorer } from './components/views/DataExplorer';
import { GeographicAnalytics } from './components/views/GeographicAnalytics';
import { BookPageExplorer } from './components/views/BookPageExplorer';
import { RelationshipLab } from './components/views/RelationshipLab';
import { RecordItem } from './types';
import { ExportModal } from './components/common/ExportModal';
import { api } from './services/api';

const MainDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<string>('overview');
  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(null);
  const [familyRecordId, setFamilyRecordId] = useState<number | null>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const { clearFilters } = useFilters();

  const handleNavigate = (newView: string, preserveFilters: boolean = false) => {
    if (newView !== activeView) {
      // Automatically reset active filters when navigating to another view/page
      if (!preserveFilters) {
        clearFilters();
      }
      setActiveView(newView);
    }
  };

  const handleViewFamilyTree = (recordId: number) => {
    setFamilyRecordId(recordId);
    setSelectedRecord(null);
    handleNavigate('relationships');
  };

  const handleHeaderSearch = (_query: string) => {
    // When executing a search across all records from the header,
    // navigate to Civil Data Explorer preserving the query that header just set
    if (activeView !== 'explorer' && activeView !== 'search') {
      handleNavigate('explorer', true);
    }
  };

  const handleSelectRecordById = async (recordId: number) => {
    try {
      const rec = await api.getRecordById(recordId);
      setSelectedRecord(rec);
    } catch (err) {
      console.error('Failed to fetch citizen record', err);
    }
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'overview':
        return <ExecutiveOverview onNavigate={(view) => handleNavigate(view)} />;
      case 'geographic':
        return <GeographicAnalytics />;
      case 'search':
        return <AdvancedSearch onSelectRecord={(r) => setSelectedRecord(r)} />;
      case 'explorer':
        return <DataExplorer onSelectRecord={(r) => setSelectedRecord(r)} />;
      case 'books':
        return (
          <BookPageExplorer
            onSelectRecord={(r) => setSelectedRecord(r)}
            onViewFamilyTree={handleViewFamilyTree}
          />
        );
      case 'relationships':
        return <RelationshipLab initialRecordId={familyRecordId} />;
      default:
        return <ExecutiveOverview onNavigate={(view) => handleNavigate(view)} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#05070d] text-slate-900 dark:text-slate-100 antialiased font-sans transition-colors duration-150">
      {/* Persistent / Responsive Cyber-HUD Sidebar */}
      <Sidebar
        activeView={activeView}
        setActiveView={handleNavigate}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeView={activeView}
          onExportClick={() => setShowExportModal(true)}
          onSearchSubmit={handleHeaderSearch}
          onSelectRecordId={handleSelectRecordById}
          onToggleMobileSidebar={() => setMobileSidebarOpen(prev => !prev)}
          onNavigateHome={() => handleNavigate('overview')}
        />
        <GlobalFilterBar onExportClick={() => setShowExportModal(true)} />

        <main className="flex-1 overflow-y-auto bg-ambient-grid">
          {renderActiveView()}
        </main>
      </div>

      {/* Record Intelligence Detail Drawer */}
      <RecordDrawer
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onViewFamilyTree={handleViewFamilyTree}
      />

      {/* Universal Enterprise Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <FilterProvider>
        <MainDashboard />
      </FilterProvider>
    </ThemeProvider>
  );
};
