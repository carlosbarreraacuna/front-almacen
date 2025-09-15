'use client';

import React, { useState, useEffect } from 'react';
import {
  Gift,
  Plus,
  Search,
  Scan,
  Calendar,
  Users,
  Percent,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  X,
  QrCode
} from 'lucide-react';
import QRScanner from './QRScanner';
import { useQRScanner } from '../hooks/useQRScanner';

interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed' | 'freeProduct';
  value: number; // Porcentaje o valor fijo
  freeProductId?: number;
  minPurchase: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  applicableProducts?: number[]; // IDs de productos aplicables
  applicableCategories?: string[];
  customerRestrictions?: {
    vipOnly?: boolean;
    newCustomersOnly?: boolean;
    specificCustomers?: number[];
  };
  createdAt: string;
  createdBy: string;
}

interface CouponUsage {
  id: string;
  couponId: string;
  customerId?: number;
  customerName?: string;
  saleId: string;
  discountAmount: number;
  usedAt: string;
  ipAddress?: string;
}

interface CouponSystemProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCoupon?: (coupon: Coupon, discountAmount: number) => void;
  currentCart?: any[];
  currentCustomer?: any;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function CouponSystem({
  isOpen,
  onClose,
  onApplyCoupon,
  currentCart = [],
  currentCustomer
}: CouponSystemProps) {
  const [activeTab, setActiveTab] = useState<'scan' | 'browse' | 'create' | 'history'>('scan');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponUsages, setCouponUsages] = useState<CouponUsage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [showCouponDetails, setShowCouponDetails] = useState(false);
  const [validationMessage, setValidationMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  // Estados para crear cupón
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
    name: '',
    description: '',
    type: 'percentage',
    value: 0,
    minPurchase: 0,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimit: 1,
    isActive: true
  });

  // QR Scanner configuration
  const qrScanner = useQRScanner({
    onCouponScan: (couponData: string) => {
      handleCouponScan(couponData);
    }
  });

  // Mock data - En producción vendría de la API
  useEffect(() => {
    const mockCoupons: Coupon[] = [
      {
        id: 'CPN001',
        code: 'DESCUENTO20',
        name: 'Descuento 20%',
        description: 'Descuento del 20% en toda la compra',
        type: 'percentage',
        value: 20,
        minPurchase: 50000,
        maxDiscount: 100000,
        validFrom: '2024-01-01T00:00:00Z',
        validUntil: '2024-12-31T23:59:59Z',
        usageLimit: 100,
        usedCount: 25,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: 'admin'
      },
      {
        id: 'CPN002',
        code: 'NUEVOCLIENTE',
        name: 'Bienvenida Nuevo Cliente',
        description: 'Descuento especial para nuevos clientes',
        type: 'fixed',
        value: 15000,
        minPurchase: 30000,
        validFrom: '2024-01-01T00:00:00Z',
        validUntil: '2024-06-30T23:59:59Z',
        usageLimit: 1,
        usedCount: 0,
        isActive: true,
        customerRestrictions: {
          newCustomersOnly: true
        },
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: 'admin'
      },
      {
        id: 'CPN003',
        code: 'VENCIDO2023',
        name: 'Cupón Vencido',
        description: 'Este cupón ya venció',
        type: 'percentage',
        value: 15,
        minPurchase: 20000,
        validFrom: '2023-01-01T00:00:00Z',
        validUntil: '2023-12-31T23:59:59Z',
        usageLimit: 50,
        usedCount: 50,
        isActive: false,
        createdAt: '2023-01-01T00:00:00Z',
        createdBy: 'admin'
      }
    ];

    const mockUsages: CouponUsage[] = [
      {
        id: 'USG001',
        couponId: 'CPN001',
        customerId: 1,
        customerName: 'Juan Pérez',
        saleId: 'SALE001',
        discountAmount: 25000,
        usedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: 'USG002',
        couponId: 'CPN001',
        customerId: 2,
        customerName: 'María García',
        saleId: 'SALE002',
        discountAmount: 18000,
        usedAt: '2024-01-14T15:45:00Z'
      }
    ];

    setCoupons(mockCoupons);
    setCouponUsages(mockUsages);
  }, []);

  const handleCouponScan = (couponData: string) => {
    try {
      // Intentar parsear como JSON
      let couponInfo;
      try {
        couponInfo = JSON.parse(couponData);
      } catch {
        // Si no es JSON, asumir que es un código simple
        couponInfo = { code: couponData };
      }

      const coupon = coupons.find(c => 
        c.code === couponInfo.code || 
        c.id === couponInfo.id ||
        c.code === couponData
      );

      if (!coupon) {
        setValidationMessage({
          type: 'error',
          message: 'Cupón no encontrado o código inválido'
        });
        return;
      }

      validateAndApplyCoupon(coupon);
    } catch (error) {
      setValidationMessage({
        type: 'error',
        message: 'Error al procesar el código QR del cupón'
      });
    }
  };

  const validateAndApplyCoupon = (coupon: Coupon) => {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);
    const cartTotal = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Validar si está activo
    if (!coupon.isActive) {
      setValidationMessage({
        type: 'error',
        message: 'Este cupón está desactivado'
      });
      return;
    }

    // Validar fechas
    if (now < validFrom) {
      setValidationMessage({
        type: 'error',
        message: `Este cupón será válido desde ${formatDate(coupon.validFrom)}`
      });
      return;
    }

    if (now > validUntil) {
      setValidationMessage({
        type: 'error',
        message: `Este cupón venció el ${formatDate(coupon.validUntil)}`
      });
      return;
    }

    // Validar límite de uso
    if (coupon.usedCount >= coupon.usageLimit) {
      setValidationMessage({
        type: 'error',
        message: 'Este cupón ha alcanzado su límite de uso'
      });
      return;
    }

    // Validar compra mínima
    if (cartTotal < coupon.minPurchase) {
      setValidationMessage({
        type: 'error',
        message: `Compra mínima requerida: ${formatCurrency(coupon.minPurchase)}`
      });
      return;
    }

    // Validar restricciones de cliente
    if (coupon.customerRestrictions?.newCustomersOnly && currentCustomer?.isExisting) {
      setValidationMessage({
        type: 'error',
        message: 'Este cupón es solo para nuevos clientes'
      });
      return;
    }

    if (coupon.customerRestrictions?.vipOnly && !currentCustomer?.isVIP) {
      setValidationMessage({
        type: 'error',
        message: 'Este cupón es solo para clientes VIP'
      });
      return;
    }

    // Calcular descuento
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = cartTotal * (coupon.value / 100);
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else if (coupon.type === 'fixed') {
      discountAmount = Math.min(coupon.value, cartTotal);
    }

    // Aplicar cupón
    if (onApplyCoupon) {
      onApplyCoupon(coupon, discountAmount);
    }

    // Registrar uso (en producción se haría en el backend)
    const newUsage: CouponUsage = {
      id: `USG${Date.now()}`,
      couponId: coupon.id,
      customerId: currentCustomer?.id,
      customerName: currentCustomer?.name,
      saleId: `SALE${Date.now()}`,
      discountAmount,
      usedAt: new Date().toISOString()
    };

    setCouponUsages(prev => [newUsage, ...prev]);
    setCoupons(prev => prev.map(c => 
      c.id === coupon.id 
        ? { ...c, usedCount: c.usedCount + 1 }
        : c
    ));

    setValidationMessage({
      type: 'success',
      message: `Cupón aplicado: ${formatCurrency(discountAmount)} de descuento`
    });

    qrScanner.closeScanner();
  };

  const createCoupon = () => {
    if (!newCoupon.name || !newCoupon.description || !newCoupon.value) {
      setValidationMessage({
        type: 'error',
        message: 'Por favor complete todos los campos requeridos'
      });
      return;
    }

    const coupon: Coupon = {
      id: `CPN${Date.now()}`,
      code: `CUPON${Date.now()}`,
      name: newCoupon.name!,
      description: newCoupon.description!,
      type: newCoupon.type!,
      value: newCoupon.value!,
      minPurchase: newCoupon.minPurchase || 0,
      maxDiscount: newCoupon.maxDiscount,
      validFrom: newCoupon.validFrom!,
      validUntil: newCoupon.validUntil!,
      usageLimit: newCoupon.usageLimit || 1,
      usedCount: 0,
      isActive: newCoupon.isActive || true,
      createdAt: new Date().toISOString(),
      createdBy: 'current_user'
    };

    setCoupons(prev => [coupon, ...prev]);
    setValidationMessage({
      type: 'success',
      message: 'Cupón creado exitosamente'
    });

    // Resetear formulario
    setNewCoupon({
      name: '',
      description: '',
      type: 'percentage',
      value: 0,
      minPurchase: 0,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      usageLimit: 1,
      isActive: true
    });
  };

  const filteredCoupons = coupons.filter(coupon =>
    coupon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coupon.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generateQRCode = (coupon: Coupon) => {
    const qrData = {
      type: 'coupon',
      id: coupon.id,
      code: coupon.code,
      name: coupon.name,
      validUntil: coupon.validUntil
    };
    return JSON.stringify(qrData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <Gift className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold">Sistema de Cupones</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { id: 'scan', label: 'Escanear', icon: Scan },
            { id: 'browse', label: 'Explorar', icon: Search },
            { id: 'create', label: 'Crear', icon: Plus },
            { id: 'history', label: 'Historial', icon: Clock }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Validation Message */}
          {validationMessage && (
            <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
              validationMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
              validationMessage.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
              'bg-yellow-50 text-yellow-800 border border-yellow-200'
            }`}>
              {validationMessage.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {validationMessage.type === 'error' && <XCircle className="w-5 h-5" />}
              {validationMessage.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
              <span>{validationMessage.message}</span>
              <button
                onClick={() => setValidationMessage(null)}
                className="ml-auto text-current hover:opacity-70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Scan Tab */}
          {activeTab === 'scan' && (
            <div className="space-y-6">
              <div className="text-center">
                <QrCode className="w-16 h-16 mx-auto mb-4 text-purple-600" />
                <h3 className="text-lg font-semibold mb-2">Escanear Cupón QR</h3>
                <p className="text-gray-600 mb-6">
                  Escanea el código QR del cupón para aplicar el descuento automáticamente
                </p>
                <button
                  onClick={() => qrScanner.openScanner('coupon')}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Scan className="w-5 h-5" />
                  <span>Abrir Escáner</span>
                </button>
              </div>

              {/* Current Cart Summary */}
              {currentCart.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Carrito Actual</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Items: {currentCart.length}</span>
                      <span>Total: {formatCurrency(currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0))}</span>
                    </div>
                    {currentCustomer && (
                      <div>Cliente: {currentCustomer.name}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Browse Tab */}
          {activeTab === 'browse' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar cupones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Coupons Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCoupons.map(coupon => {
                  const isExpired = new Date() > new Date(coupon.validUntil);
                  const isUsedUp = coupon.usedCount >= coupon.usageLimit;
                  const isInactive = !coupon.isActive;
                  
                  return (
                    <div
                      key={coupon.id}
                      className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                        isExpired || isUsedUp || isInactive
                          ? 'bg-gray-50 border-gray-200 opacity-60'
                          : 'bg-white border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          {coupon.type === 'percentage' && <Percent className="w-4 h-4 text-purple-600" />}
                          {coupon.type === 'fixed' && <DollarSign className="w-4 h-4 text-green-600" />}
                          {coupon.type === 'freeProduct' && <Gift className="w-4 h-4 text-blue-600" />}
                          <h4 className="font-medium text-sm">{coupon.name}</h4>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => {
                              setSelectedCoupon(coupon);
                              setShowCouponDetails(true);
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-3">{coupon.description}</p>
                      
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span>Código:</span>
                          <span className="font-mono bg-gray-100 px-1 rounded">{coupon.code}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Descuento:</span>
                          <span className="font-medium">
                            {coupon.type === 'percentage' ? `${coupon.value}%` : formatCurrency(coupon.value)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Válido hasta:</span>
                          <span className={isExpired ? 'text-red-600' : 'text-gray-600'}>
                            {formatDate(coupon.validUntil)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Usos:</span>
                          <span className={isUsedUp ? 'text-red-600' : 'text-gray-600'}>
                            {coupon.usedCount}/{coupon.usageLimit}
                          </span>
                        </div>
                      </div>
                      
                      {!isExpired && !isUsedUp && coupon.isActive && (
                        <button
                          onClick={() => validateAndApplyCoupon(coupon)}
                          className="w-full mt-3 bg-purple-600 text-white py-2 rounded text-sm hover:bg-purple-700 transition-colors"
                        >
                          Aplicar Cupón
                        </button>
                      )}
                      
                      {(isExpired || isUsedUp || isInactive) && (
                        <div className="mt-3 text-center">
                          <span className="text-xs text-red-600">
                            {isExpired && 'Vencido'}
                            {isUsedUp && 'Agotado'}
                            {isInactive && 'Inactivo'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Create Tab */}
          {activeTab === 'create' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <h3 className="text-lg font-semibold">Crear Nuevo Cupón</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Cupón *
                  </label>
                  <input
                    type="text"
                    value={newCoupon.name || ''}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ej: Descuento Navideño"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Descuento *
                  </label>
                  <select
                    value={newCoupon.type}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="percentage">Porcentaje</option>
                    <option value="fixed">Valor Fijo</option>
                    <option value="freeProduct">Producto Gratis</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {newCoupon.type === 'percentage' ? 'Porcentaje (%)' : 'Valor'} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={newCoupon.type === 'percentage' ? "100" : undefined}
                    value={newCoupon.value || ''}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, value: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compra Mínima
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newCoupon.minPurchase || ''}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, minPurchase: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                {newCoupon.type === 'percentage' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descuento Máximo
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newCoupon.maxDiscount || ''}
                      onChange={(e) => setNewCoupon(prev => ({ ...prev, maxDiscount: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Límite de Uso
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newCoupon.usageLimit || ''}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, usageLimit: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Válido Desde
                  </label>
                  <input
                    type="date"
                    value={newCoupon.validFrom}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, validFrom: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Válido Hasta
                  </label>
                  <input
                    type="date"
                    value={newCoupon.validUntil}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, validUntil: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción *
                </label>
                <textarea
                  value={newCoupon.description || ''}
                  onChange={(e) => setNewCoupon(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Describe las condiciones y beneficios del cupón"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={newCoupon.isActive}
                  onChange={(e) => setNewCoupon(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Cupón activo
                </label>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setNewCoupon({
                    name: '',
                    description: '',
                    type: 'percentage',
                    value: 0,
                    minPurchase: 0,
                    validFrom: new Date().toISOString().split('T')[0],
                    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    usageLimit: 1,
                    isActive: true
                  })}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Limpiar
                </button>
                <button
                  onClick={createCoupon}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Crear Cupón
                </button>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Historial de Uso de Cupones</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Fecha
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Cupón
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Cliente
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Descuento
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Venta
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {couponUsages.map(usage => {
                      const coupon = coupons.find(c => c.id === usage.couponId);
                      return (
                        <tr key={usage.id} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-2 text-sm">
                            {formatDate(usage.usedAt)}
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-sm">
                            <div>
                              <div className="font-medium">{coupon?.name}</div>
                              <div className="text-gray-500 font-mono text-xs">{coupon?.code}</div>
                            </div>
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-sm">
                            {usage.customerName || 'Cliente Anónimo'}
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-sm font-medium text-green-600">
                            {formatCurrency(usage.discountAmount)}
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-sm font-mono">
                            {usage.saleId}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {couponUsages.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay registros de uso de cupones
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner */}
      <QRScanner
        isOpen={qrScanner.isOpen}
        onClose={qrScanner.closeScanner}
        onScan={qrScanner.handleScan}
        mode={qrScanner.mode}
        title={qrScanner.title}
      />

      {/* Coupon Details Modal */}
      {showCouponDetails && selectedCoupon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Detalles del Cupón</h3>
              <button
                onClick={() => setShowCouponDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Nombre:</span>
                <span className="ml-2">{selectedCoupon.name}</span>
              </div>
              <div>
                <span className="font-medium">Código:</span>
                <span className="ml-2 font-mono bg-gray-100 px-1 rounded">{selectedCoupon.code}</span>
              </div>
              <div>
                <span className="font-medium">Descripción:</span>
                <span className="ml-2">{selectedCoupon.description}</span>
              </div>
              <div>
                <span className="font-medium">Tipo:</span>
                <span className="ml-2">
                  {selectedCoupon.type === 'percentage' ? 'Porcentaje' :
                   selectedCoupon.type === 'fixed' ? 'Valor Fijo' : 'Producto Gratis'}
                </span>
              </div>
              <div>
                <span className="font-medium">Valor:</span>
                <span className="ml-2">
                  {selectedCoupon.type === 'percentage' ? `${selectedCoupon.value}%` : formatCurrency(selectedCoupon.value)}
                </span>
              </div>
              {selectedCoupon.minPurchase > 0 && (
                <div>
                  <span className="font-medium">Compra mínima:</span>
                  <span className="ml-2">{formatCurrency(selectedCoupon.minPurchase)}</span>
                </div>
              )}
              {selectedCoupon.maxDiscount && (
                <div>
                  <span className="font-medium">Descuento máximo:</span>
                  <span className="ml-2">{formatCurrency(selectedCoupon.maxDiscount)}</span>
                </div>
              )}
              <div>
                <span className="font-medium">Válido desde:</span>
                <span className="ml-2">{formatDate(selectedCoupon.validFrom)}</span>
              </div>
              <div>
                <span className="font-medium">Válido hasta:</span>
                <span className="ml-2">{formatDate(selectedCoupon.validUntil)}</span>
              </div>
              <div>
                <span className="font-medium">Usos:</span>
                <span className="ml-2">{selectedCoupon.usedCount}/{selectedCoupon.usageLimit}</span>
              </div>
              <div>
                <span className="font-medium">Estado:</span>
                <span className={`ml-2 ${selectedCoupon.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedCoupon.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <div className="bg-gray-100 p-4 rounded-lg">
                <QrCode className="w-16 h-16 mx-auto mb-2 text-gray-600" />
                <p className="text-xs text-gray-600">Código QR del cupón</p>
                <p className="text-xs text-gray-500 mt-1 font-mono break-all">
                  {generateQRCode(selectedCoupon)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}