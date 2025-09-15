'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Menu } from 'lucide-react';

// Import section components
import DashboardContent from './sections/DashboardContent';
import UsersContent from './sections/UsersContent';
import ProductsContent from './sections/ProductsContent';
import InventoryContent from './sections/InventoryContent';
import WarehouseContent from './sections/WarehouseContent';
import SalesContent from './sections/SalesContent';
import DirectSalesContent from './sections/DirectSalesContent';
import SalesHistoryContent from './sections/SalesHistoryContent';
import SuppliersContent from './sections/SuppliersContent';
import PurchaseOrdersContent from './sections/PurchaseOrdersContent';
import CustomersContent from './sections/CustomersContent';
import ReportsContent from './sections/ReportsContent';
import AnalyticsContent from './sections/AnalyticsContent';
import RolesContent from './sections/RolesContent';
import SettingsContent from './sections/SettingsContent';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardContent />;
      case 'users':
        return <UsersContent />;
      case 'products':
        return <ProductsContent />;
      case 'inventory':
        return <InventoryContent />;
      case 'warehouse':
        return <WarehouseContent />;
      case 'sales':
        return <SalesContent />;
      case 'direct-sales':
        return <DirectSalesContent />;
      case 'sales-history':
        return <SalesHistoryContent />;
      case 'suppliers':
        return <SuppliersContent />;
      case 'purchase-orders':
        return <PurchaseOrdersContent />;
      case 'customers':
        return <CustomersContent />;
      case 'reports':
        return <ReportsContent />;
      case 'analytics':
        return <AnalyticsContent />;
      case 'roles':
        return <RolesContent />;
      case 'settings':
        return <SettingsContent />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        
        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          {/* Top Navigation */}
          <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          
          {/* Page Content */}
          <main className="p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}