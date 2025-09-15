'use client';

import React from 'react';
import { Warehouse, AlertTriangle, TrendingUp, Package } from 'lucide-react';

export default function InventoryContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <Warehouse className="w-8 h-8 text-blue-600" />
          <span>Control de Inventario</span>
        </h1>
        <p className="text-gray-600 mt-1">Monitorea y gestiona el inventario</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Productos</p>
              <p className="text-2xl font-bold">1,234</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stock Bajo</p>
              <p className="text-2xl font-bold text-red-600">23</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-green-600">$45,678</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Productos con Stock Bajo</h3>
        <div className="space-y-3">
          {['Mouse Logitech MX', 'Teclado Mecánico', 'Monitor 24"'].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="font-medium">{item}</span>
              <span className="text-red-600 font-semibold">Stock: {3 - index}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}