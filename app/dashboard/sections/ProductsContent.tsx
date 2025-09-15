'use client';

import React, { useState } from 'react';
import { Package, Plus, Search, Filter, Edit, Trash2, Eye, Tag, DollarSign } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  min_stock: number;
  status: 'active' | 'inactive';
  image?: string;
}

export default function ProductsContent() {
  const [products] = useState<Product[]>([
    {
      id: 1,
      name: 'Laptop HP Pavilion',
      sku: 'HP-PAV-001',
      category: 'Electrónicos',
      price: 899.99,
      stock: 15,
      min_stock: 5,
      status: 'active'
    },
    {
      id: 2,
      name: 'Mouse Logitech MX',
      sku: 'LOG-MX-002',
      category: 'Accesorios',
      price: 79.99,
      stock: 3,
      min_stock: 10,
      status: 'active'
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Package className="w-8 h-8 text-blue-600" />
            <span>Gestión de Productos</span>
          </h1>
          <p className="text-gray-600 mt-1">Administra el catálogo de productos</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar productos..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option>Todas las categorías</option>
            <option>Electrónicos</option>
            <option>Accesorios</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option>Todos los estados</option>
            <option>Activos</option>
            <option>Inactivos</option>
            <option>Stock bajo</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.sku}</p>
                </div>
                <div className="flex space-x-1">
                  <button className="p-1 text-gray-400 hover:text-blue-600">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-green-600">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1 text-sm text-gray-600">
                    <Tag className="w-4 h-4" />
                    <span>{product.category}</span>
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    product.stock <= product.min_stock 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    Stock: {product.stock}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1 text-lg font-bold text-gray-900">
                    <DollarSign className="w-4 h-4" />
                    <span>{product.price}</span>
                  </span>
                  {product.stock <= product.min_stock && (
                    <span className="text-xs text-red-600 font-medium">Stock Bajo</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}