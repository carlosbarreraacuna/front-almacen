'use client';

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Activity,
  Calendar
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, change, changeType }) => {
  const changeColor = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  }[changeType];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className={`text-sm ${changeColor}`}>{change}</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  );
};

interface ActivityItemProps {
  action: string;
  user: string;
  time: string;
  type: 'sale' | 'inventory' | 'user' | 'system';
}

const ActivityItem: React.FC<ActivityItemProps> = ({ action, user, time, type }) => {
  const typeColors = {
    sale: 'bg-green-100 text-green-800',
    inventory: 'bg-blue-100 text-blue-800',
    user: 'bg-purple-100 text-purple-800',
    system: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="flex items-center space-x-3 py-3">
      <div className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[type]}`}>
        {type.toUpperCase()}
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-900">{action}</p>
        <p className="text-xs text-gray-500">por {user} • {time}</p>
      </div>
    </div>
  );
};

export default function DashboardContent() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Ventas Hoy',
      value: '$12,450',
      icon: <DollarSign className="w-6 h-6 text-blue-600" />,
      change: '+12% vs ayer',
      changeType: 'positive' as const
    },
    {
      title: 'Productos',
      value: '1,234',
      icon: <Package className="w-6 h-6 text-blue-600" />,
      change: '+5 nuevos',
      changeType: 'positive' as const
    },
    {
      title: 'Usuarios Activos',
      value: '89',
      icon: <Users className="w-6 h-6 text-blue-600" />,
      change: '+3 esta semana',
      changeType: 'positive' as const
    },
    {
      title: 'Stock Bajo',
      value: '23',
      icon: <AlertTriangle className="w-6 h-6 text-blue-600" />,
      change: 'Requiere atención',
      changeType: 'negative' as const
    }
  ];

  const recentActivity = [
    {
      action: 'Nueva venta registrada #VT-001234',
      user: 'María González',
      time: 'hace 5 min',
      type: 'sale' as const
    },
    {
      action: 'Producto "Laptop HP" actualizado',
      user: 'Carlos Ruiz',
      time: 'hace 15 min',
      type: 'inventory' as const
    },
    {
      action: 'Nuevo usuario registrado',
      user: 'Sistema',
      time: 'hace 30 min',
      type: 'user' as const
    },
    {
      action: 'Backup automático completado',
      user: 'Sistema',
      time: 'hace 1 hora',
      type: 'system' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bienvenido, {user?.name}
          </h1>
          <p className="text-gray-600">
            Aquí tienes un resumen de tu sistema de almacén
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>{new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Actividad Reciente
                </h3>
                <Activity className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-1">
                {recentActivity.map((activity, index) => (
                  <ActivityItem key={index} {...activity} />
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Ver toda la actividad →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Acciones Rápidas
            </h3>
            <div className="space-y-3">
              <button className="w-full flex items-center space-x-3 p-3 text-left rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">Nueva Venta</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 text-left rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <Package className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">Agregar Producto</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 text-left rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <Users className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium">Nuevo Usuario</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 text-left rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium">Ver Reportes</span>
              </button>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Estado del Sistema
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Base de Datos</span>
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Activa</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API</span>
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Operativa</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Último Backup</span>
                <span className="text-sm text-gray-600">hace 2 horas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}