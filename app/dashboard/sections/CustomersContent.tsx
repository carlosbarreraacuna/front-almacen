'use client';

import React, { useState } from 'react';
import { UserPlus, Search, Plus, Edit, Trash2, Eye, Phone, Mail, MapPin, Calendar, DollarSign, ShoppingBag, X, Save } from 'lucide-react';

interface Customer {
  id: number;
  code: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxId?: string;
  customerType: 'individual' | 'business';
  status: 'active' | 'inactive';
  creditLimit: number;
  currentBalance: number;
  totalPurchases: number;
  lastPurchase?: string;
  registrationDate: string;
  notes?: string;
}

interface Sale {
  id: number;
  saleNumber: string;
  date: string;
  total: number;
  status: 'completed' | 'pending' | 'cancelled';
}

export default function CustomersContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'individual' | 'business'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'sales'>('info');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerForm, setCustomerForm] = useState({
    code: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    taxId: '',
    customerType: 'individual' as 'individual' | 'business',
    creditLimit: 0,
    notes: ''
  });

  // Mock data
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: 1,
      code: 'CUS001',
      name: 'Juan Pérez',
      email: 'juan.perez@email.com',
      phone: '+1-555-0123',
      address: '123 Main Street',
      city: 'Miami',
      country: 'USA',
      taxId: '12345678901',
      customerType: 'individual',
      status: 'active',
      creditLimit: 5000,
      currentBalance: 1250,
      totalPurchases: 15750,
      lastPurchase: '2024-01-10',
      registrationDate: '2023-06-15',
      notes: 'Cliente frecuente, excelente historial de pagos'
    },
    {
      id: 2,
      code: 'CUS002',
      name: 'TechCorp Solutions',
      email: 'compras@techcorp.com',
      phone: '+1-555-0456',
      address: '456 Business Ave',
      city: 'New York',
      country: 'USA',
      taxId: '98765432109',
      customerType: 'business',
      status: 'active',
      creditLimit: 25000,
      currentBalance: 8500,
      totalPurchases: 89000,
      lastPurchase: '2024-01-08',
      registrationDate: '2023-03-20',
      notes: 'Cliente corporativo, compras mensuales regulares'
    },
    {
      id: 3,
      code: 'CUS003',
      name: 'María García',
      email: 'maria.garcia@email.com',
      phone: '+1-555-0789',
      address: '789 Oak Street',
      city: 'Chicago',
      country: 'USA',
      customerType: 'individual',
      status: 'active',
      creditLimit: 3000,
      currentBalance: 0,
      totalPurchases: 4500,
      lastPurchase: '2024-01-05',
      registrationDate: '2023-09-10'
    },
    {
      id: 4,
      code: 'CUS004',
      name: 'StartUp Inc',
      email: 'admin@startup.com',
      phone: '+1-555-0321',
      address: '321 Innovation Blvd',
      city: 'San Francisco',
      country: 'USA',
      taxId: '55566677788',
      customerType: 'business',
      status: 'inactive',
      creditLimit: 10000,
      currentBalance: 2500,
      totalPurchases: 12000,
      lastPurchase: '2023-11-15',
      registrationDate: '2023-01-05',
      notes: 'Cliente inactivo desde noviembre 2023'
    }
  ]);

  // Mock sales data for selected customer
  const customerSales: Sale[] = [
    { id: 1, saleNumber: 'VEN-2024-001', date: '2024-01-10', total: 1250, status: 'completed' },
    { id: 2, saleNumber: 'VEN-2024-002', date: '2024-01-08', total: 850, status: 'completed' },
    { id: 3, saleNumber: 'VEN-2024-003', date: '2024-01-05', total: 450, status: 'pending' }
  ];

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || customer.customerType === filterType;
    const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // CRUD functions
  const handleCreateCustomer = () => {
    setEditingCustomer(null);
    setCustomerForm({
      code: '',
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      taxId: '',
      customerType: 'individual',
      creditLimit: 0,
      notes: ''
    });
    setShowCustomerModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      code: customer.code,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      country: customer.country,
      taxId: customer.taxId || '',
      customerType: customer.customerType,
      creditLimit: customer.creditLimit,
      notes: customer.notes || ''
    });
    setShowCustomerModal(true);
  };

  const handleDeleteCustomer = (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      setCustomers(customers.filter(customer => customer.id !== id));
    }
  };

  const handleSaveCustomer = () => {
    if (editingCustomer) {
      setCustomers(customers.map(customer => 
        customer.id === editingCustomer.id 
          ? { 
              ...customer, 
              ...customerForm,
              taxId: customerForm.taxId || undefined,
              notes: customerForm.notes || undefined
            }
          : customer
      ));
    } else {
      const newCustomer: Customer = {
        id: Math.max(...customers.map(c => c.id)) + 1,
        ...customerForm,
        status: 'active',
        currentBalance: 0,
        totalPurchases: 0,
        registrationDate: new Date().toISOString().split('T')[0],
        taxId: customerForm.taxId || undefined,
        notes: customerForm.notes || undefined
      };
      setCustomers([...customers, newCustomer]);
    }
    setShowCustomerModal(false);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'individual': return 'bg-blue-100 text-blue-800';
      case 'business': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'individual': return 'Individual';
      case 'business': return 'Empresa';
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

  const getSaleStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSaleStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">Gestiona tu base de clientes y su historial de compras</p>
        </div>
        <button
          onClick={handleCreateCustomer}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserPlus className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Clientes</p>
              <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserPlus className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-gray-900">{customers.filter(c => c.status === 'active').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ventas Totales</p>
              <p className="text-2xl font-bold text-gray-900">
                ${customers.reduce((acc, c) => acc + c.totalPurchases, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Saldo Pendiente</p>
              <p className="text-2xl font-bold text-gray-900">
                ${customers.reduce((acc, c) => acc + c.currentBalance, 0).toLocaleString()}
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
            placeholder="Buscar clientes..."
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
          <option value="individual">Individual</option>
          <option value="business">Empresa</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Financiero</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Compra</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserPlus className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.code}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(customer.customerType)}`}>
                    {getTypeLabel(customer.customerType)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <Mail className="w-3 h-3 text-gray-400 mr-1" />
                      <span className="text-xs">{customer.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-3 h-3 text-gray-400 mr-1" />
                      <span className="text-xs">{customer.phone}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="space-y-1">
                    <div>Total: ${customer.totalPurchases.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">
                      Saldo: ${customer.currentBalance.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      Límite: ${customer.creditLimit.toLocaleString()}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {customer.lastPurchase ? (
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 text-gray-400 mr-1" />
                      <span className="text-xs">{customer.lastPurchase}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Sin compras</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(customer.status)}`}>
                    {customer.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setSelectedCustomer(customer)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleEditCustomer(customer)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteCustomer(customer.id)}
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

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Detalle de Cliente - {selectedCustomer.name}</h2>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'info'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Información
                </button>
                <button
                  onClick={() => setActiveTab('sales')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'sales'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Historial de Ventas
                </button>
              </nav>
            </div>

            {activeTab === 'info' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Información Personal</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Código:</span> {selectedCustomer.code}</p>
                    <p><span className="font-medium">Nombre:</span> {selectedCustomer.name}</p>
                    <p><span className="font-medium">Email:</span> {selectedCustomer.email}</p>
                    <p><span className="font-medium">Teléfono:</span> {selectedCustomer.phone}</p>
                    <p><span className="font-medium">Dirección:</span> {selectedCustomer.address}</p>
                    <p><span className="font-medium">Ciudad:</span> {selectedCustomer.city}</p>
                    <p><span className="font-medium">País:</span> {selectedCustomer.country}</p>
                    {selectedCustomer.taxId && (
                      <p><span className="font-medium">ID Fiscal:</span> {selectedCustomer.taxId}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Información Comercial</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Tipo:</span> 
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(selectedCustomer.customerType)}`}>
                        {getTypeLabel(selectedCustomer.customerType)}
                      </span>
                    </p>
                    <p><span className="font-medium">Estado:</span> 
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedCustomer.status)}`}>
                        {selectedCustomer.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </p>
                    <p><span className="font-medium">Límite de Crédito:</span> ${selectedCustomer.creditLimit.toLocaleString()}</p>
                    <p><span className="font-medium">Saldo Actual:</span> ${selectedCustomer.currentBalance.toLocaleString()}</p>
                    <p><span className="font-medium">Total Compras:</span> ${selectedCustomer.totalPurchases.toLocaleString()}</p>
                    <p><span className="font-medium">Fecha de Registro:</span> {selectedCustomer.registrationDate}</p>
                    {selectedCustomer.lastPurchase && (
                      <p><span className="font-medium">Última Compra:</span> {selectedCustomer.lastPurchase}</p>
                    )}
                  </div>
                  {selectedCustomer.notes && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Notas:</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedCustomer.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold mb-3">Historial de Ventas</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {customerSales.map((sale) => (
                        <tr key={sale.id}>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{sale.saleNumber}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">{sale.date}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">${sale.total.toFixed(2)}</td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSaleStatusColor(sale.status)}`}>
                              {getSaleStatusLabel(sale.status)}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer Form Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <button 
                onClick={() => setShowCustomerModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                <input
                  type="text"
                  value={customerForm.code}
                  onChange={(e) => setCustomerForm({...customerForm, code: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="CUS001"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre completo"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1-555-0123"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  type="text"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({...customerForm, address: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123 Main Street"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                <input
                  type="text"
                  value={customerForm.city}
                  onChange={(e) => setCustomerForm({...customerForm, city: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Miami"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                <input
                  type="text"
                  value={customerForm.country}
                  onChange={(e) => setCustomerForm({...customerForm, country: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="USA"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Fiscal</label>
                <input
                  type="text"
                  value={customerForm.taxId}
                  onChange={(e) => setCustomerForm({...customerForm, taxId: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="12345678901"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cliente</label>
                <select
                  value={customerForm.customerType}
                  onChange={(e) => setCustomerForm({...customerForm, customerType: e.target.value as 'individual' | 'business'})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="individual">Individual</option>
                  <option value="business">Empresa</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Límite de Crédito</label>
                <input
                  type="number"
                  value={customerForm.creditLimit}
                  onChange={(e) => setCustomerForm({...customerForm, creditLimit: Number(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="5000"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={customerForm.notes}
                  onChange={(e) => setCustomerForm({...customerForm, notes: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Notas adicionales sobre el cliente..."
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowCustomerModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCustomer}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                disabled={!customerForm.name || !customerForm.email}
              >
                <Save className="w-4 h-4" />
                {editingCustomer ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}