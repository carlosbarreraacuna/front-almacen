'use client';

import React from 'react';
import { BarChart3, TrendingUp, PieChart, Activity } from 'lucide-react';

export default function AnalyticsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <span>Análisis y Métricas</span>
        </h1>
        <p className="text-gray-600 mt-1">Visualiza el rendimiento del negocio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: 'Ingresos Totales', value: '$45,678', change: '+12%', icon: TrendingUp, color: 'green' },
          { title: 'Ventas del Mes', value: '234', change: '+8%', icon: Activity, color: 'blue' },
          { title: 'Productos Vendidos', value: '1,456', change: '+15%', icon: PieChart, color: 'purple' },
          { title: 'Clientes Activos', value: '89', change: '+5%', icon: BarChart3, color: 'orange' }
        ].map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  <p className={`text-sm text-${metric.color}-600`}>{metric.change}</p>
                </div>
                <div className={`p-3 bg-${metric.color}-100 rounded-lg`}>
                  <Icon className={`w-6 h-6 text-${metric.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Ventas por Mes</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-2" />
              <p>Gráfico de ventas mensuales</p>
              <p className="text-sm">Datos de los últimos 12 meses</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Productos Más Vendidos</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <PieChart className="w-12 h-12 mx-auto mb-2" />
              <p>Distribución por categorías</p>
              <p className="text-sm">Top 10 productos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Tendencias de Ventas</h3>
        <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center text-gray-500">
            <TrendingUp className="w-16 h-16 mx-auto mb-4" />
            <p className="text-lg font-medium">Gráfico de Tendencias</p>
            <p>Análisis de ventas en tiempo real</p>
          </div>
        </div>
      </div>
    </div>
  );
}