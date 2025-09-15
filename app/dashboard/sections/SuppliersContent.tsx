'use client';

import React, { useState } from 'react';
import { Building2, Search, Plus, Edit, Trash2, Eye, Phone, Mail, MapPin, Star, X, Save } from 'lucide-react';

interface Supplier {
  id: number;
  code: string;
  name: string;
  businessName: string;
  taxId: string;
  type: 'manufacturer' | 'distributor' | 'service';
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  paymentTermsDays: number;
  creditLimit: number;
  currency: string;
  rating: number;
  status: 'active' | 'inactive';
  totalPurchases: number;
  lastPurchase: string;
}

export default function SuppliersContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'manufacturer' | 'distributor' | 'service'>('all');
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState({
    code: '',
    name: '',
    businessName: '',
    taxId: '',
    type: 'manufacturer' as 'manufacturer' | 'distributor' | 'service',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    paymentTermsDays: '',
    creditLimit: '',
    currency: 'USD',
    status: 'active' as 'active' | 'inactive'
  });

  // Mock data
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    {
      id: 1,
      code: 'SUP001',
      name: 'TechnoSupply Corp',
      businessName: 'TechnoSupply Corporation S.A.',
      taxId: '20123456789',
      type: 'manufacturer',
      email: 'ventas@technosupply.com',
      phone: '+1-555-0123',
      address: '123 Tech Street',
      city: 'Miami',
      country: 'USA',
      paymentTermsDays: 30,
      creditLimit: 50000,
      currency: 'USD',
      rating: 5,
      status: 'active',
      totalPurchases: 125000,
      lastPurchase: '2024-01-10'
    },
    {
      id: 2,
      code: 'SUP002',
      name: 'Global Electronics',
      businessName: 'Global Electronics Distribution Ltd.',
      taxId: '30987654321',
      type: 'distributor',
      email: 'orders@globalelectronics.com',
      phone: '+1-555-0456',
      address: '456 Commerce Ave',
      city: 'New York',
      country: 'USA',
      paymentTermsDays: 45,
      creditLimit: 75000,
      currency: 'USD',
      rating: 4,
      status: 'active',
      totalPurchases: 89000,
      lastPurchase: '2024-01-08'
    },
    {
      id: 3,
      code: 'SUP003',
      name: 'Office Solutions Inc',
      businessName: 'Office Solutions Incorporated',
      taxId: '40555666777',
      type: 'service',
      email: 'info@officesolutions.com',
      phone: '+1-555-0789',
      address: '789 Business Blvd',
      city: 'Chicago',
      country: 'USA',
      paymentTermsDays: 15,
      creditLimit: 25000,
      currency: 'USD',
      rating: 3,
      status: 'active',
      totalPurchases: 45000,
      lastPurchase: '2024-01-05'
    },
    {
      id: 4,
      code: 'SUP004',
      name: 'Hardware Plus',
      businessName: 'Hardware Plus Distribution S.A.',
      taxId: '50111222333',
      type: 'distributor',
      email: 'sales@hardwareplus.com',
      phone: '+1-555-0321',
      address: '321 Industrial Park',
      city: 'Los Angeles',
      country: 'USA',
      paymentTermsDays: 60,
      creditLimit: 100000,
      currency: 'USD',
      rating: 4,
      status: 'inactive',
      totalPurchases: 200000,
      lastPurchase: '2023-12-15'
    }
  ]);

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.businessName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || supplier.type === filterType;
    
    return matchesSearch && matchesType;
  });

  // Funciones CRUD para proveedores
  const handleCreateSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm({
      code: '',
      name: '',
      businessName: '',
      taxId: '',
      type: 'manufacturer',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      paymentTermsDays: '',
      creditLimit: '',
      currency: 'USD',
      status: 'active'
    });
    setShowSupplierModal(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      code: supplier.code,
      name: supplier.name,
      businessName: supplier.businessName,
      taxId: supplier.taxId,
      type: supplier.type,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      country: supplier.country,
      paymentTermsDays: supplier.paymentTermsDays.toString(),
      creditLimit: supplier.creditLimit.toString(),
      currency: supplier.currency,
      status: supplier.status
    });
    setShowSupplierModal(true);
  };

  const handleDeleteSupplier = (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este proveedor?')) {
      setSuppliers(suppliers.filter(supplier => supplier.id !== id));
    }
  };

  const handleSaveSupplier = () => {
    if (editingSupplier) {
      setSuppliers(suppliers.map(supplier => 
        supplier.id === editingSupplier.id 
          ? { 
              ...supplier, 
              ...supplierForm, 
              paymentTermsDays: parseInt(supplierForm.paymentTermsDays),
              creditLimit: parseInt(supplierForm.creditLimit),
              rating: supplier.rating,
              totalPurchases: supplier.totalPurchases,
              lastPurchase: supplier.lastPurchase
            }
          : supplier
      ));
    } else {
      const newSupplier: Supplier = {
        id: Math.max(...suppliers.map(s => s.id)) + 1,
        ...supplierForm,
        paymentTermsDays: parseInt(supplierForm.paymentTermsDays),
        creditLimit: parseInt(supplierForm.creditLimit),
        rating: 0,
        totalPurchases: 0,
        lastPurchase: new Date().toISOString().split('T')[0]
      };
      setSuppliers([...suppliers, newSupplier]);
    }
    setShowSupplierModal(false);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'manufacturer': return 'bg-blue-100 text-blue-800';
      case 'distributor': return 'bg-green-100 text-green-800';
      case 'service': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'manufacturer': return 'Fabricante';
      case 'distributor': return 'Distribuidor';
      case 'service': return 'Servicio';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-gray-600">Gestiona tu red de proveedores y sus datos comerciales</p>
        </div>
        <button
          onClick={handleCreateSupplier}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Proveedor</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Proveedores</p>
              <p className="text-2xl font-bold text-gray-900">{suppliers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-gray-900">{suppliers.filter(s => s.status === 'active').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rating Promedio</p>
              <p className="text-2xl font-bold text-gray-900">
                {(suppliers.reduce((acc, s) => acc + s.rating, 0) / suppliers.length).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Compras Totales</p>
              <p className="text-2xl font-bold text-gray-900">
                ${suppliers.reduce((acc, s) => acc + s.totalPurchases, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar proveedores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Todos los tipos</option>
          <option value="manufacturer">Fabricantes</option>
          <option value="distributor">Distribuidores</option>
          <option value="service">Servicios</option>
        </select>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Términos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSuppliers.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                      <div className="text-sm text-gray-500">{supplier.code}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(supplier.type)}`}>
                    {getTypeLabel(supplier.type)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <Mail className="w-3 h-3 text-gray-400 mr-1" />
                      <span className="text-xs">{supplier.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-3 h-3 text-gray-400 mr-1" />
                      <span className="text-xs">{supplier.phone}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="space-y-1">
                    <div>{supplier.paymentTermsDays} días</div>
                    <div className="text-xs text-gray-500">
                      Límite: {supplier.currency} {supplier.creditLimit.toLocaleString()}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-1">
                    {renderStars(supplier.rating)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(supplier.status)}`}>
                    {supplier.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleEditSupplier(supplier)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteSupplier(supplier.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para Proveedores */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h3>
              <button 
                onClick={() => setShowSupplierModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                <input
                  type="text"
                  value={supplierForm.code}
                  onChange={(e) => setSupplierForm({...supplierForm, code: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="SUP001"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre del proveedor"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social</label>
                <input
                  type="text"
                  value={supplierForm.businessName}
                  onChange={(e) => setSupplierForm({...supplierForm, businessName: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Razón social completa"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIT/Tax ID</label>
                <input
                  type="text"
                  value={supplierForm.taxId}
                  onChange={(e) => setSupplierForm({...supplierForm, taxId: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="20123456789"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={supplierForm.type}
                  onChange={(e) => setSupplierForm({...supplierForm, type: e.target.value as any})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="manufacturer">Fabricante</option>
                  <option value="distributor">Distribuidor</option>
                  <option value="service">Servicio</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@proveedor.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1-555-0123"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  type="text"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({...supplierForm, address: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Dirección completa"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                <input
                  type="text"
                  value={supplierForm.city}
                  onChange={(e) => setSupplierForm({...supplierForm, city: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ciudad"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                <input
                  type="text"
                  value={supplierForm.country}
                  onChange={(e) => setSupplierForm({...supplierForm, country: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="País"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Términos de Pago (días)</label>
                <input
                  type="number"
                  value={supplierForm.paymentTermsDays}
                  onChange={(e) => setSupplierForm({...supplierForm, paymentTermsDays: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="30"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Límite de Crédito</label>
                <input
                  type="number"
                  value={supplierForm.creditLimit}
                  onChange={(e) => setSupplierForm({...supplierForm, creditLimit: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="50000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
                <select
                  value={supplierForm.currency}
                  onChange={(e) => setSupplierForm({...supplierForm, currency: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD - Dólar Americano</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="COP">COP - Peso Colombiano</option>
                  <option value="MXN">MXN - Peso Mexicano</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={supplierForm.status}
                  onChange={(e) => setSupplierForm({...supplierForm, status: e.target.value as any})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSupplierModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSupplier}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}