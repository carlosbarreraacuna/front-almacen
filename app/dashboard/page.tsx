'use client';

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  change?: string;
  changeType?: 'positive' | 'negative';
}

function StatCard({ title, value, icon: Icon, color, change, changeType }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${
              changeType === 'positive' ? 'text-green-600' : 'text-red-600'
            }`}>
              {changeType === 'positive' ? '+' : ''}{change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();

  const stats = [
    {
      title: 'Total Usuarios',
      value: '24',
      icon: Users,
      color: 'bg-blue-500',
      change: '+2 este mes',
      changeType: 'positive' as const,
      permission: 'users.view'
    },
    {
      title: 'Productos',
      value: '156',
      icon: Package,
      color: 'bg-green-500',
      change: '+12 nuevos',
      changeType: 'positive' as const,
      permission: 'products.view'
    },
    {
      title: 'Ventas Hoy',
      value: '$2,450',
      icon: DollarSign,
      color: 'bg-yellow-500',
      change: '+15%',
      changeType: 'positive' as const,
      permission: 'sales.view'
    },
    {
      title: 'Stock Bajo',
      value: '8',
      icon: AlertTriangle,
      color: 'bg-red-500',
      change: '3 críticos',
      changeType: 'negative' as const,
      permission: 'inventory.view'
    }
  ];

  const filteredStats = stats.filter(stat => 
    !stat.permission || hasPermission(stat.permission)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, {user?.name}
        </h1>
        <p className="text-gray-600 mt-1">
          Aquí tienes un resumen de tu sistema de almacén
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredStats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users size={16} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Nuevo usuario registrado</p>
                  <p className="text-xs text-gray-500">Hace 2 horas</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Package size={16} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Producto agregado al inventario</p>
                  <p className="text-xs text-gray-500">Hace 4 horas</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <ShoppingCart size={16} className="text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Venta procesada</p>
                  <p className="text-xs text-gray-500">Hace 6 horas</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              {hasPermission('users.create') && (
                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <Users size={24} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">Agregar Usuario</p>
                </button>
              )}
              
              {hasPermission('products.create') && (
                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
                  <Package size={24} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">Nuevo Producto</p>
                </button>
              )}
              
              {hasPermission('inventory.manage') && (
                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors">
                  <ShoppingCart size={24} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">Registrar Venta</p>
                </button>
              )}
              
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
                <TrendingUp size={24} className="text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">Ver Reportes</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}