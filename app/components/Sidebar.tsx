'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Warehouse,
  TrendingUp,
  FileText,
  UserCheck,
  Truck,
  Building2,
  MapPin,
  UserPlus,
  ChevronDown,
  ChevronRight,
  Home,
  Briefcase,
  CreditCard,
  Users2,
  PieChart,
  Cog
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function Sidebar({ isOpen, onToggle, activeSection, onSectionChange }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, hasPermission } = useAuth();
  const [expandedSections, setExpandedSections] = useState<string[]>(['Principal']);

  const menuSections = [
    {
      title: 'Principal',
      icon: Home,
      color: 'blue',
      items: [
        {
          id: 'dashboard',
          name: 'Dashboard',
          icon: LayoutDashboard,
          permission: null,
          description: 'Vista general del sistema'
        }
      ]
    },
    {
      title: 'Gestión',
      icon: Briefcase,
      color: 'green',
      items: [
        {
          id: 'users',
          name: 'Usuarios',
          icon: Users,
          permission: 'users.view',
          description: 'Administrar usuarios del sistema'
        },
        {
          id: 'products',
          name: 'Productos',
          icon: Package,
          permission: 'products.view',
          description: 'Catálogo de productos'
        },
        {
          id: 'inventory',
          name: 'Inventario',
          icon: Warehouse,
          permission: 'inventory.view',
          description: 'Control de stock'
        },
        {
          id: 'warehouse',
          name: 'Gestión de Almacén',
          icon: MapPin,
          permission: 'warehouse.view',
          description: 'Ubicaciones y almacenes'
        }
      ]
    },
    {
      title: 'Ventas',
      icon: CreditCard,
      color: 'purple',
      items: [
        {
          id: 'sales',
          name: 'Punto de Venta',
          icon: ShoppingCart,
          permission: 'sales.create',
          description: 'Realizar ventas'
        },
        {
          id: 'direct-sales',
          name: 'Venta Directa',
          icon: CreditCard,
          permission: 'sales.create',
          description: 'Venta directa simplificada'
        },
        {
          id: 'sales-history',
          name: 'Historial de Ventas',
          icon: FileText,
          permission: 'sales.view',
          description: 'Registro de transacciones'
        }
      ]
    },
    {
      title: 'Compras',
      icon: Truck,
      color: 'orange',
      items: [
        {
          id: 'suppliers',
          name: 'Proveedores',
          icon: Building2,
          permission: 'suppliers.view',
          description: 'Gestión de proveedores'
        },
        {
          id: 'purchase-orders',
          name: 'Órdenes de Compra',
          icon: Truck,
          permission: 'purchases.view',
          description: 'Pedidos a proveedores'
        }
      ]
    },
    {
      title: 'CRM',
      icon: Users2,
      color: 'pink',
      items: [
        {
          id: 'customers',
          name: 'Clientes',
          icon: UserPlus,
          permission: 'customers.view',
          description: 'Base de datos de clientes'
        }
      ]
    },
    {
      title: 'Análisis',
      icon: PieChart,
      color: 'indigo',
      items: [
        {
          id: 'reports',
          name: 'Reportes',
          icon: BarChart3,
          permission: 'reports.view',
          description: 'Informes y estadísticas'
        },
        {
          id: 'analytics',
          name: 'Análisis',
          icon: TrendingUp,
          permission: 'analytics.view',
          description: 'Análisis avanzado'
        }
      ]
    },
    {
      title: 'Sistema',
      icon: Cog,
      color: 'gray',
      items: [
        {
          id: 'roles',
          name: 'Roles y Permisos',
          icon: UserCheck,
          permission: 'roles.view',
          description: 'Control de acceso'
        },
        {
          id: 'settings',
          name: 'Configuración',
          icon: Settings,
          permission: 'settings.view',
          description: 'Configuración del sistema'
        }
      ]
    }
  ];

  const handleSectionClick = (sectionId: string) => {
    onSectionChange(sectionId);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      onToggle();
    }
  };

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionTitle)
        ? prev.filter(s => s !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  const getColorClasses = (color: string, isActive: boolean = false) => {
    const colors = {
      blue: {
        header: isActive ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700',
        headerIcon: isActive ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-500',
        item: isActive ? 'bg-blue-50 text-blue-700 border-l-blue-500' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700',
        itemIcon: isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500',
        dot: 'bg-blue-500'
      },
      green: {
        header: isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 hover:bg-green-50 text-gray-700 hover:text-green-700',
        headerIcon: isActive ? 'bg-green-100 text-green-600' : 'bg-white text-gray-500',
        item: isActive ? 'bg-green-50 text-green-700 border-l-green-500' : 'text-gray-600 hover:bg-green-50 hover:text-green-700',
        itemIcon: isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500',
        dot: 'bg-green-500'
      },
      purple: {
        header: isActive ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-700',
        headerIcon: isActive ? 'bg-purple-100 text-purple-600' : 'bg-white text-gray-500',
        item: isActive ? 'bg-purple-50 text-purple-700 border-l-purple-500' : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700',
        itemIcon: isActive ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500',
        dot: 'bg-purple-500'
      },
      orange: {
        header: isActive ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-orange-700',
        headerIcon: isActive ? 'bg-orange-100 text-orange-600' : 'bg-white text-gray-500',
        item: isActive ? 'bg-orange-50 text-orange-700 border-l-orange-500' : 'text-gray-600 hover:bg-orange-50 hover:text-orange-700',
        itemIcon: isActive ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500',
        dot: 'bg-orange-500'
      },
      pink: {
        header: isActive ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-gray-50 hover:bg-pink-50 text-gray-700 hover:text-pink-700',
        headerIcon: isActive ? 'bg-pink-100 text-pink-600' : 'bg-white text-gray-500',
        item: isActive ? 'bg-pink-50 text-pink-700 border-l-pink-500' : 'text-gray-600 hover:bg-pink-50 hover:text-pink-700',
        itemIcon: isActive ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-500',
        dot: 'bg-pink-500'
      },
      indigo: {
        header: isActive ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700',
        headerIcon: isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-gray-500',
        item: isActive ? 'bg-indigo-50 text-indigo-700 border-l-indigo-500' : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700',
        itemIcon: isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500',
        dot: 'bg-indigo-500'
      },
      gray: {
        header: isActive ? 'bg-gray-50 text-gray-700 border-gray-200' : 'bg-gray-50 hover:bg-gray-100 text-gray-700',
        headerIcon: isActive ? 'bg-gray-100 text-gray-600' : 'bg-white text-gray-500',
        item: isActive ? 'bg-gray-50 text-gray-700 border-l-gray-500' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-700',
        itemIcon: isActive ? 'bg-gray-100 text-gray-600' : 'bg-gray-100 text-gray-500',
        dot: 'bg-gray-500'
      }
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        ></div>
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 h-full w-64 sm:w-72 lg:w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        shadow-lg lg:shadow-none
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900 truncate">POS Almacén</span>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Cerrar sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-3 sm:p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 text-white rounded-full text-sm sm:text-base font-medium flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs sm:text-sm text-gray-500 capitalize truncate">{user?.role?.name}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {menuSections.map((section) => {
            const filteredItems = section.items.filter(item => 
              !item.permission || hasPermission(item.permission)
            );

            if (filteredItems.length === 0) return null;

            const SectionIcon = section.icon;
            const isExpanded = expandedSections.includes(section.title);
            const hasActiveItem = filteredItems.some(item => activeSection === item.id);

            return (
              <div key={section.title} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.title)}
                  className={`
                    w-full flex items-center justify-between p-2 sm:p-3 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
                    ${getColorClasses(section.color, hasActiveItem).header}
                  `}
                  aria-expanded={isExpanded}
                  aria-controls={`section-${section.title}`}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <div className={`
                      p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0
                      ${getColorClasses(section.color, hasActiveItem).headerIcon}
                    `}>
                      <SectionIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs sm:text-sm font-semibold truncate">{section.title}</h3>
                      <p className="text-xs opacity-75 truncate">{filteredItems.length} elemento{filteredItems.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="transition-transform duration-200 flex-shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                    ) : (
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                  </div>
                </button>

                {/* Section Items */}
                <div 
                   className={`
                     transition-all duration-300 ease-in-out overflow-hidden
                     ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                   `}
                   id={`section-${section.title}`}
                   role="region"
                   aria-labelledby={`header-${section.title}`}
                 >
                   <div className="bg-white border-t border-gray-100">
                    {filteredItems.map((item, index) => {
                      const Icon = item.icon;
                      const isActive = activeSection === item.id;
                      
                      return (
                        <button
                            key={item.id}
                            onClick={() => handleSectionClick(item.id)}
                            className={`
                              w-full flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
                              ${index !== filteredItems.length - 1 ? 'border-b border-gray-50' : ''}
                              ${isActive ? 'border-l-4 ' + getColorClasses(section.color, true).item : getColorClasses(section.color, false).item}
                            `}
                            aria-current={isActive ? 'page' : undefined}
                          >
                            <div className={`
                              p-1 sm:p-1.5 rounded-md transition-colors flex-shrink-0
                              ${getColorClasses(section.color, isActive).itemIcon}
                            `}>
                              <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium truncate">{item.name}</p>
                              <p className="text-xs opacity-75 truncate hidden sm:block">{item.description}</p>
                            </div>
                            {isActive && (
                              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 ${getColorClasses(section.color, true).dot}`}></div>
                            )}
                          </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-3 sm:p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="flex items-center space-x-2 sm:space-x-3 w-full px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-inset"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="truncate">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
}