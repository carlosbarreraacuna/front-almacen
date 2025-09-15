'use client';

import React, { useState } from 'react';
import { Truck, Search, Plus, Edit, Trash2, Eye, Calendar, DollarSign, Package, CheckCircle, Clock, XCircle, X, Save } from 'lucide-react';

interface PurchaseOrderItem {
  id: number;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  receivedQuantity: number;
  pendingQuantity: number;
}

interface PurchaseOrder {
  id: number;
  orderNumber: string;
  supplierName: string;
  supplierCode: string;
  status: 'draft' | 'pending' | 'approved' | 'partially_received' | 'received' | 'cancelled';
  orderDate: string;
  expectedDate: string;
  receivedDate?: string;
  totalAmount: number;
  currency: string;
  items: PurchaseOrderItem[];
  notes?: string;
  createdBy: string;
  approvedBy?: string;
}

export default function PurchaseOrdersContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'pending' | 'approved' | 'partially_received' | 'received' | 'cancelled'>('all');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [orderForm, setOrderForm] = useState({
    supplier: '',
    expected_date: '',
    notes: '',
    items: [{ product: '', quantity: '', unit_price: '' }]
  });

  // Mock data
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([
    {
      id: 1,
      orderNumber: 'PO-2024-001',
      supplierName: 'TechnoSupply Corp',
      supplierCode: 'SUP001',
      status: 'approved',
      orderDate: '2024-01-10',
      expectedDate: '2024-01-20',
      totalAmount: 15750.00,
      currency: 'USD',
      createdBy: 'Juan Pérez',
      approvedBy: 'María García',
      items: [
        { id: 1, productName: 'Laptop Dell XPS 13', sku: 'LAP-001', quantity: 10, unitPrice: 1200.00, receivedQuantity: 10, pendingQuantity: 0 },
        { id: 2, productName: 'Mouse Logitech MX', sku: 'MOU-001', quantity: 25, unitPrice: 75.00, receivedQuantity: 25, pendingQuantity: 0 },
        { id: 3, productName: 'Teclado Mecánico', sku: 'KEY-001', quantity: 20, unitPrice: 150.00, receivedQuantity: 15, pendingQuantity: 5 }
      ]
    },
    {
      id: 2,
      orderNumber: 'PO-2024-002',
      supplierName: 'Global Electronics',
      supplierCode: 'SUP002',
      status: 'pending',
      orderDate: '2024-01-12',
      expectedDate: '2024-01-25',
      totalAmount: 8500.00,
      currency: 'USD',
      createdBy: 'Carlos López',
      items: [
        { id: 4, productName: 'Monitor 24" 4K', sku: 'MON-001', quantity: 15, unitPrice: 450.00, receivedQuantity: 0, pendingQuantity: 15 },
        { id: 5, productName: 'Webcam HD', sku: 'CAM-001', quantity: 30, unitPrice: 85.00, receivedQuantity: 0, pendingQuantity: 30 }
      ]
    },
    {
      id: 3,
      orderNumber: 'PO-2024-003',
      supplierName: 'Office Solutions Inc',
      supplierCode: 'SUP003',
      status: 'draft',
      orderDate: '2024-01-15',
      expectedDate: '2024-01-30',
      totalAmount: 3200.00,
      currency: 'USD',
      createdBy: 'Ana Rodríguez',
      items: [
        { id: 6, productName: 'Silla Ergonómica', sku: 'CHA-001', quantity: 8, unitPrice: 400.00, receivedQuantity: 0, pendingQuantity: 8 }
      ]
    },
    {
      id: 4,
      orderNumber: 'PO-2024-004',
      supplierName: 'Hardware Plus',
      supplierCode: 'SUP004',
      status: 'received',
      orderDate: '2024-01-05',
      expectedDate: '2024-01-15',
      receivedDate: '2024-01-14',
      totalAmount: 12000.00,
      currency: 'USD',
      createdBy: 'Luis Martínez',
      approvedBy: 'María García',
      items: [
        { id: 7, productName: 'Servidor Dell PowerEdge', sku: 'SRV-001', quantity: 2, unitPrice: 6000.00, receivedQuantity: 2, pendingQuantity: 0 }
      ]
    }
  ]);

  // Lista de proveedores disponibles
  const suppliers = ['TechnoSupply Corp', 'Global Electronics', 'Office Solutions Inc', 'Hardware Plus'];

  // Funciones CRUD para órdenes de compra
  const handleCreateOrder = () => {
    setEditingOrder(null);
    setOrderForm({
      supplier: '',
      expected_date: '',
      notes: '',
      items: [{ product: '', quantity: '', unit_price: '' }]
    });
    setShowOrderModal(true);
  };

  const handleEditOrder = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setOrderForm({
      supplier: order.supplierName,
      expected_date: order.expectedDate,
      notes: order.notes || '',
      items: order.items.map(item => ({
        product: item.productName,
        quantity: item.quantity.toString(),
        unit_price: item.unitPrice.toString()
      }))
    });
    setShowOrderModal(true);
  };

  const handleDeleteOrder = (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta orden de compra?')) {
      setPurchaseOrders(purchaseOrders.filter(order => order.id !== id));
    }
  };

  const handleSaveOrder = () => {
    const total = orderForm.items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) * parseFloat(item.unit_price) || 0);
    }, 0);

    if (editingOrder) {
      setPurchaseOrders(purchaseOrders.map(order => 
        order.id === editingOrder.id 
          ? { 
              ...order, 
              supplierName: orderForm.supplier,
              expectedDate: orderForm.expected_date,
              notes: orderForm.notes,
              totalAmount: total,
              items: orderForm.items.map((item, index) => ({
                id: order.items[index]?.id || Date.now() + index,
                productName: item.product,
                sku: order.items[index]?.sku || `SKU-${Date.now()}-${index}`,
                quantity: parseInt(item.quantity),
                unitPrice: parseFloat(item.unit_price),
                receivedQuantity: order.items[index]?.receivedQuantity || 0,
                pendingQuantity: parseInt(item.quantity) - (order.items[index]?.receivedQuantity || 0)
              }))
            }
          : order
      ));
    } else {
      const newOrder: PurchaseOrder = {
        id: Math.max(...purchaseOrders.map(o => o.id)) + 1,
        orderNumber: `PO-2024-${String(Math.max(...purchaseOrders.map(o => parseInt(o.orderNumber.split('-')[2]))) + 1).padStart(3, '0')}`,
        supplierName: orderForm.supplier,
        supplierCode: `SUP${String(Math.max(...purchaseOrders.map(o => parseInt(o.supplierCode.replace('SUP', '')))) + 1).padStart(3, '0')}`,
        status: 'draft',
        orderDate: new Date().toISOString().split('T')[0],
        expectedDate: orderForm.expected_date,
        totalAmount: total,
        currency: 'USD',
        notes: orderForm.notes,
        createdBy: 'Usuario Actual',
        items: orderForm.items.map((item, index) => ({
          id: Date.now() + index,
          productName: item.product,
          sku: `SKU-${Date.now()}-${index}`,
          quantity: parseInt(item.quantity),
          unitPrice: parseFloat(item.unit_price),
          receivedQuantity: 0,
          pendingQuantity: parseInt(item.quantity)
        }))
      };
      setPurchaseOrders([...purchaseOrders, newOrder]);
    }
    setShowOrderModal(false);
  };

  const addItem = () => {
    setOrderForm({
      ...orderForm,
      items: [...orderForm.items, { product: '', quantity: '', unit_price: '' }]
    });
  };

  const removeItem = (index: number) => {
    setOrderForm({
      ...orderForm,
      items: orderForm.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index: number, field: string, value: string) => {
    const updatedItems = orderForm.items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setOrderForm({ ...orderForm, items: updatedItems });
  };

  const filteredOrders = purchaseOrders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplierCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'partially_received': return 'bg-orange-100 text-orange-800';
      case 'received': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Borrador';
      case 'pending': return 'Pendiente';
      case 'approved': return 'Aprobada';
      case 'partially_received': return 'Parcialmente Recibida';
      case 'received': return 'Recibida';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'partially_received': return <Package className="w-4 h-4" />;
      case 'received': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const calculateOrderProgress = (order: PurchaseOrder) => {
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const receivedItems = order.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
    return totalItems > 0 ? (receivedItems / totalItems) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Órdenes de Compra</h1>
          <p className="text-gray-600">Gestiona las órdenes de compra y su seguimiento</p>
        </div>
        <button
          onClick={handleCreateOrder}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Orden</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Órdenes</p>
              <p className="text-2xl font-bold text-gray-900">{purchaseOrders.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">
                {purchaseOrders.filter(o => o.status === 'pending' || o.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {purchaseOrders.filter(o => o.status === 'received').length}
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
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900">
                ${purchaseOrders.reduce((acc, o) => acc + o.totalAmount, 0).toLocaleString()}
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
            placeholder="Buscar órdenes de compra..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="pending">Pendiente</option>
          <option value="approved">Aprobada</option>
          <option value="partially_received">Parcialmente Recibida</option>
          <option value="received">Recibida</option>
          <option value="cancelled">Cancelada</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orden</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fechas</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progreso</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map((order) => {
              const progress = calculateOrderProgress(order);
              return (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Truck className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                        <div className="text-sm text-gray-500">por {order.createdBy}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.supplierName}</div>
                    <div className="text-sm text-gray-500">{order.supplierCode}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1">{getStatusLabel(order.status)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 text-gray-400 mr-1" />
                        <span className="text-xs">Pedido: {order.orderDate}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 text-gray-400 mr-1" />
                        <span className="text-xs">Esperado: {order.expectedDate}</span>
                      </div>
                      {order.receivedDate && (
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 text-green-400 mr-1" />
                          <span className="text-xs text-green-600">Recibido: {order.receivedDate}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>{progress.toFixed(0)}%</span>
                          <span>{order.items.reduce((sum, item) => sum + item.receivedQuantity, 0)}/{order.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.currency} {order.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditOrder(order)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteOrder(order.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Detalle de Orden - {selectedOrder.orderNumber}</h2>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Información General</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Proveedor:</span> {selectedOrder.supplierName}</p>
                  <p><span className="font-medium">Estado:</span> 
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusLabel(selectedOrder.status)}
                    </span>
                  </p>
                  <p><span className="font-medium">Fecha de Orden:</span> {selectedOrder.orderDate}</p>
                  <p><span className="font-medium">Fecha Esperada:</span> {selectedOrder.expectedDate}</p>
                  {selectedOrder.receivedDate && (
                    <p><span className="font-medium">Fecha Recibida:</span> {selectedOrder.receivedDate}</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Detalles Comerciales</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Total:</span> {selectedOrder.currency} {selectedOrder.totalAmount.toLocaleString()}</p>
                  <p><span className="font-medium">Creado por:</span> {selectedOrder.createdBy}</p>
                  {selectedOrder.approvedBy && (
                    <p><span className="font-medium">Aprobado por:</span> {selectedOrder.approvedBy}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Items de la Orden</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Recibido</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pendiente</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{item.productName}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{item.sku}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">${item.unitPrice.toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm text-green-600">{item.receivedQuantity}</td>
                        <td className="px-4 py-2 text-sm text-orange-600">{item.pendingQuantity}</td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Crear/Editar Orden */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingOrder ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}
              </h3>
              <button 
                onClick={() => setShowOrderModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                <select
                  value={orderForm.supplier}
                  onChange={(e) => setOrderForm({...orderForm, supplier: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar proveedor</option>
                  {suppliers.map(supplier => (
                    <option key={supplier} value={supplier}>{supplier}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Esperada</label>
                <input
                  type="date"
                  value={orderForm.expected_date}
                  onChange={(e) => setOrderForm({...orderForm, expected_date: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-semibold">Items de la Orden</h4>
                <button
                  onClick={addItem}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Item
                </button>
              </div>
              
              <div className="space-y-3">
                {orderForm.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border border-gray-200 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                      <input
                        type="text"
                        value={item.product}
                        onChange={(e) => updateItem(index, 'product', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Nombre del producto"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Precio Unitario</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <button
                        onClick={() => removeItem(index)}
                        className="w-full bg-red-600 text-white px-2 py-1 rounded text-sm hover:bg-red-700"
                        disabled={orderForm.items.length === 1}
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-right">
                <span className="text-lg font-semibold">
                  Total: ${orderForm.items.reduce((sum, item) => {
                    return sum + (parseFloat(item.quantity) * parseFloat(item.unit_price) || 0);
                  }, 0).toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowOrderModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveOrder}
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