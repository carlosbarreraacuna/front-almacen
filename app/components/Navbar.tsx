'use client';

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Bell, User, Settings, LogOut, Menu } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  activeSection?: string;
}

interface BreadcrumbConfig {
  title: string;
  subtitle: string;
}

const breadcrumbConfig: Record<string, BreadcrumbConfig> = {
  'dashboard': {
    title: 'Bienvenido, Administrador',
    subtitle: 'Aquí tienes un resumen de tu sistema de almacén'
  },
  'users': {
    title: 'Gestión de Usuarios',
    subtitle: 'Administra los usuarios del sistema y sus permisos'
  },
  'products': {
    title: 'Gestión de Productos',
    subtitle: 'Administra el catálogo de productos'
  },
  'inventory': {
    title: 'Control de Inventario',
    subtitle: 'Monitorea y gestiona el inventario'
  },
  'warehouse': {
    title: 'Gestión de Almacén',
    subtitle: 'Administra ubicaciones y movimientos de inventario'
  },
  'sales': {
    title: 'Gestión de Ventas',
    subtitle: 'Administra las ventas y transacciones'
  },
'sales-history': {
    title: 'Historial de Ventas',
    subtitle: 'Consulta el historial completo de ventas'
  },
  'customers': {
    title: 'Gestión de Clientes',
    subtitle: 'Administra la información de tus clientes'
  },
  'suppliers': {
    title: 'Gestión de Proveedores',
    subtitle: 'Administra tus proveedores y contactos'
  },
  'purchase-orders': {
    title: 'Órdenes de Compra',
    subtitle: 'Gestiona las órdenes de compra a proveedores'
  },
  'reports': {
    title: 'Reportes y Análisis',
    subtitle: 'Visualiza estadísticas y genera reportes'
  },
  'settings': {
    title: 'Configuración',
    subtitle: 'Configura los parámetros del sistema'
  },
  'categories': {
    title: 'Gestión de Categorías',
    subtitle: 'Organiza tus productos por categorías'
  },
  'brands': {
    title: 'Gestión de Marcas',
    subtitle: 'Administra las marcas de productos'
  },
  'coupons': {
    title: 'Cupones Promocionales',
    subtitle: 'Crea y administra cupones de descuento'
  },
  'roles': {
    title: 'Gestión de Roles',
    subtitle: 'Administra roles y permisos del sistema'
  }
};

export default function Navbar({ onToggleSidebar, activeSection = 'dashboard' }: NavbarProps) {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const currentBreadcrumb = breadcrumbConfig[activeSection] || {
    title: 'Dashboard',
    subtitle: 'Sistema de Gestión de Almacén'
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      {/* Left side - Hamburger + Breadcrumb */}
      <div className="flex items-center flex-1 space-x-4">
        {/* Hamburger Menu Button - Visible on mobile */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {currentBreadcrumb.title}
          </h1>
          <p className="text-sm text-gray-500 hidden sm:block">
            {currentBreadcrumb.subtitle}
          </p>
        </div>
      </div>

      {/* Right side - Notifications and User Menu */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg">
          <Bell className="h-6 w-6" />
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-medium">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role?.name}</p>
            </div>
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              <div className="py-1">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                
                <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <User className="h-4 w-4 mr-3" />
                  Mi Perfil
                </button>
                
                <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Settings className="h-4 w-4 mr-3" />
                  Configuración
                </button>
                
                <div className="border-t border-gray-100">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        ></div>
      )}
    </nav>
  );
}