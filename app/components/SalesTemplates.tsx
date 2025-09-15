'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  Clock, 
  Package, 
  Users, 
  TrendingUp,
  X,
  Save,
  Copy
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  code: string;
  category: string;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  document: string;
}

interface TemplateItem {
  productId: number;
  quantity: number;
  discount?: number;
}

interface SalesTemplate {
  id: number;
  name: string;
  description: string;
  items: TemplateItem[];
  customerId?: number;
  totalAmount: number;
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
  category: 'frequent' | 'seasonal' | 'custom' | 'combo';
  isActive: boolean;
}

interface SalesTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (template: SalesTemplate) => void;
  products: Product[];
  customers: Customer[];
  currentCart?: any[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'frequent': return <TrendingUp className="w-4 h-4" />;
    case 'seasonal': return <Clock className="w-4 h-4" />;
    case 'combo': return <Package className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case 'frequent': return 'bg-blue-100 text-blue-800';
    case 'seasonal': return 'bg-green-100 text-green-800';
    case 'combo': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function TemplateCard({ 
  template, 
  products, 
  customers, 
  onApply, 
  onEdit, 
  onDelete 
}: {
  template: SalesTemplate;
  products: Product[];
  customers: Customer[];
  onApply: (template: SalesTemplate) => void;
  onEdit: (template: SalesTemplate) => void;
  onDelete: (templateId: number) => void;
}) {
  const customer = template.customerId ? customers.find(c => c.id === template.customerId) : null;
  const templateProducts = template.items.map(item => {
    const product = products.find(p => p.id === item.productId);
    return { ...item, product };
  }).filter(item => item.product);

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-gray-900">{template.name}</h3>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              getCategoryColor(template.category)
            }`}>
              {getCategoryIcon(template.category)}
              <span className="ml-1 capitalize">{template.category}</span>
            </span>
            {template.usageCount > 10 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                <Star className="w-3 h-3 mr-1" />
                Popular
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">{template.description}</p>
          {customer && (
            <p className="text-xs text-blue-600 mb-2">
              <Users className="w-3 h-3 inline mr-1" />
              Cliente: {customer.name}
            </p>
          )}
        </div>
        <div className="flex space-x-1">
          <button
            onClick={() => onEdit(template)}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Editar plantilla"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(template.id)}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Eliminar plantilla"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Productos en la plantilla */}
      <div className="space-y-2 mb-4">
        {templateProducts.slice(0, 3).map((item, index) => (
          <div key={index} className="flex justify-between items-center text-sm">
            <div className="flex-1">
              <span className="font-medium">{item.product?.name}</span>
              <span className="text-gray-500 ml-2">x{item.quantity}</span>
              {item.discount && item.discount > 0 && (
                <span className="text-green-600 ml-2">(-{item.discount}%)</span>
              )}
            </div>
            <span className="text-gray-600">
              {formatCurrency((item.product?.price || 0) * item.quantity * (1 - (item.discount || 0) / 100))}
            </span>
          </div>
        ))}
        {templateProducts.length > 3 && (
          <p className="text-xs text-gray-500">+{templateProducts.length - 3} productos más</p>
        )}
      </div>

      {/* Información adicional */}
      <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
        <div className="flex space-x-4">
          <span>Usado {template.usageCount} veces</span>
          {template.lastUsed && (
            <span>Último uso: {formatDate(template.lastUsed)}</span>
          )}
        </div>
      </div>

      {/* Total y botón de aplicar */}
      <div className="flex justify-between items-center pt-3 border-t">
        <div className="text-lg font-semibold text-blue-600">
          Total: {formatCurrency(template.totalAmount)}
        </div>
        <button
          onClick={() => onApply(template)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Copy className="w-4 h-4" />
          <span>Aplicar</span>
        </button>
      </div>
    </div>
  );
}

function CreateTemplateModal({ 
  isOpen, 
  onClose, 
  onSave, 
  products, 
  customers, 
  currentCart 
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Omit<SalesTemplate, 'id' | 'usageCount' | 'lastUsed' | 'createdAt'>) => void;
  products: Product[];
  customers: Customer[];
  currentCart?: any[];
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<SalesTemplate['category']>('custom');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>();
  const [selectedItems, setSelectedItems] = useState<TemplateItem[]>(
    currentCart?.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      discount: 0
    })) || []
  );

  const handleSave = () => {
    if (!name.trim() || selectedItems.length === 0) return;

    const totalAmount = selectedItems.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return sum;
      return sum + (product.price * item.quantity * (1 - (item.discount || 0) / 100));
    }, 0);

    onSave({
      name: name.trim(),
      description: description.trim(),
      items: selectedItems,
      customerId: selectedCustomerId,
      totalAmount,
      category,
      isActive: true
    });

    // Reset form
    setName('');
    setDescription('');
    setCategory('custom');
    setSelectedCustomerId(undefined);
    setSelectedItems([]);
    onClose();
  };

  const addProduct = (productId: number) => {
    const existingItem = selectedItems.find(item => item.productId === productId);
    if (existingItem) {
      setSelectedItems(selectedItems.map(item => 
        item.productId === productId 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setSelectedItems([...selectedItems, { productId, quantity: 1, discount: 0 }]);
    }
  };

  const removeProduct = (productId: number) => {
    setSelectedItems(selectedItems.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeProduct(productId);
      return;
    }
    setSelectedItems(selectedItems.map(item => 
      item.productId === productId 
        ? { ...item, quantity }
        : item
    ));
  };

  const updateDiscount = (productId: number, discount: number) => {
    setSelectedItems(selectedItems.map(item => 
      item.productId === productId 
        ? { ...item, discount: Math.max(0, Math.min(100, discount)) }
        : item
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Crear Nueva Plantilla</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información de la plantilla */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la plantilla *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Combo Desayuno, Pedido Semanal..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Descripción opcional de la plantilla..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SalesTemplate['category'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="custom">Personalizada</option>
                <option value="frequent">Frecuente</option>
                <option value="seasonal">Estacional</option>
                <option value="combo">Combo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente específico (opcional)
              </label>
              <select
                value={selectedCustomerId || ''}
                onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Cualquier cliente</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.document}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Productos seleccionados */}
          <div>
            <h3 className="text-lg font-medium mb-4">Productos en la plantilla</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {selectedItems.map((item) => {
                const product = products.find(p => p.id === item.productId);
                if (!product) return null;
                
                return (
                  <div key={item.productId} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-gray-500">{product.code}</p>
                      </div>
                      <button
                        onClick={() => removeProduct(item.productId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Cantidad</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Descuento (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount || 0}
                          onChange={(e) => updateDiscount(item.productId, Number(e.target.value))}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Agregar productos */}
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Agregar productos</h4>
              <div className="max-h-32 overflow-y-auto border rounded-lg">
                {products.filter(p => !selectedItems.some(item => item.productId === p.id)).map(product => (
                  <div 
                    key={product.id} 
                    className="flex justify-between items-center p-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => addProduct(product.id)}
                  >
                    <div>
                      <span className="text-sm font-medium">{product.name}</span>
                      <span className="text-xs text-gray-500 ml-2">{formatCurrency(product.price)}</span>
                    </div>
                    <Plus className="w-4 h-4 text-blue-600" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || selectedItems.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Plantilla</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SalesTemplates({
  isOpen,
  onClose,
  onApplyTemplate,
  products,
  customers,
  currentCart
}: SalesTemplatesProps) {
  const [templates, setTemplates] = useState<SalesTemplate[]>([
    {
      id: 1,
      name: "Combo Desayuno",
      description: "Desayuno completo para oficina",
      items: [
        { productId: 1, quantity: 10, discount: 5 },
        { productId: 2, quantity: 5, discount: 0 },
        { productId: 3, quantity: 15, discount: 10 }
      ],
      totalAmount: 125000,
      usageCount: 25,
      lastUsed: "2024-01-15",
      createdAt: "2024-01-01",
      category: "frequent",
      isActive: true
    },
    {
      id: 2,
      name: "Pedido Semanal Restaurante",
      description: "Pedido habitual del Restaurante El Buen Sabor",
      items: [
        { productId: 1, quantity: 50, discount: 15 },
        { productId: 4, quantity: 30, discount: 10 },
        { productId: 5, quantity: 20, discount: 5 }
      ],
      customerId: 1,
      totalAmount: 850000,
      usageCount: 12,
      lastUsed: "2024-01-10",
      createdAt: "2023-12-15",
      category: "frequent",
      isActive: true
    },
    {
      id: 3,
      name: "Kit Navideño",
      description: "Productos especiales para temporada navideña",
      items: [
        { productId: 6, quantity: 25, discount: 20 },
        { productId: 7, quantity: 15, discount: 15 }
      ],
      totalAmount: 450000,
      usageCount: 8,
      lastUsed: "2023-12-20",
      createdAt: "2023-11-01",
      category: "seasonal",
      isActive: false
    }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory && template.isActive;
  });

  const handleApplyTemplate = (template: SalesTemplate) => {
    // Incrementar contador de uso
    setTemplates(templates.map(t => 
      t.id === template.id 
        ? { ...t, usageCount: t.usageCount + 1, lastUsed: new Date().toISOString().split('T')[0] }
        : t
    ));
    
    onApplyTemplate(template);
    onClose();
  };

  const handleCreateTemplate = (templateData: Omit<SalesTemplate, 'id' | 'usageCount' | 'lastUsed' | 'createdAt'>) => {
    const newTemplate: SalesTemplate = {
      ...templateData,
      id: Math.max(...templates.map(t => t.id)) + 1,
      usageCount: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setTemplates([...templates, newTemplate]);
  };

  const handleEditTemplate = (template: SalesTemplate) => {
    // TODO: Implementar edición de plantillas
    console.log('Editar plantilla:', template);
  };

  const handleDeleteTemplate = (templateId: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) {
      setTemplates(templates.filter(t => t.id !== templateId));
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
        <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold flex items-center">
              <FileText className="w-6 h-6 mr-2" />
              Plantillas de Venta
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Controles */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <input
                type="text"
                placeholder="Buscar plantillas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas las categorías</option>
                <option value="frequent">Frecuentes</option>
                <option value="seasonal">Estacionales</option>
                <option value="combo">Combos</option>
                <option value="custom">Personalizadas</option>
              </select>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Plantilla</span>
            </button>
          </div>

          {/* Lista de plantillas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  products={products}
                  customers={customers}
                  onApply={handleApplyTemplate}
                  onEdit={handleEditTemplate}
                  onDelete={handleDeleteTemplate}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No se encontraron plantillas</h3>
                <p className="mb-4">Crea tu primera plantilla para agilizar las ventas recurrentes</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crear Plantilla
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de crear plantilla */}
      <CreateTemplateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateTemplate}
        products={products}
        customers={customers}
        currentCart={currentCart}
      />
    </>
  );
}