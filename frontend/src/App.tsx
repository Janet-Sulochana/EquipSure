import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import NotificationDrawer from './components/NotificationDrawer';
import DashboardPage from './pages/DashboardPage';
import EquipmentPage from './pages/EquipmentPage';
import MaintenancePage from './pages/MaintenancePage';
import CalibrationsPage from './pages/CalibrationsPage';
import WarrantiesPage from './pages/WarrantiesPage';
import ServiceRequestsPage from './pages/ServiceRequestsPage';
import UtilizationPage from './pages/UtilizationPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import LoginPage from './pages/LoginPage';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-400">Initializing EquipSure Biomedical Core...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={setActiveTab} />;
      case 'equipment':
        return <EquipmentPage />;
      case 'maintenance':
        return <MaintenancePage />;
      case 'calibrations':
        return <CalibrationsPage />;
      case 'warranties':
        return <WarrantiesPage />;
      case 'service-requests':
        return <ServiceRequestsPage />;
      case 'utilization':
        return <UtilizationPage />;
      case 'reports':
        return <ReportsPage />;
      case 'users':
        return <UsersPage />;
      default:
        return <DashboardPage onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header activeTab={activeTab} />
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {renderActivePage()}
        </main>
      </div>
      <NotificationDrawer onNavigate={setActiveTab} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ToastProvider>
          <MainLayout />
        </ToastProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
