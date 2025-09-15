'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, ShoppingCart, Package, AlertCircle, CheckCircle, 
  Settings, Scan, Plus, Minus, X, Clock, Barcode,
  TrendingUp, Package2, DollarSign
} from 'lucide-react';
import useDigitalPosScanner, { ScannedProduct, ScanResult } from '../hooks/useDigitalPosScanner';
import DigitalPosScannerConfig from './DigitalPosScannerConfig';

interface QuickScanComponentProps {
  onProductAdded?: (product: ScannedProduct, quantity: number) => void;
  onCartUpdate?: (cartItems: any[]) => void;
  className?: string;
}

const QuickScanComponent: React.FC<QuickScanComponentProps> = ({
  onProductAdded,
  onCartUpdate,
  className = ''
}) => {
  const {
    isConnected,
    isScanning,
    lastScanResult,
    scanHistory,
    config,
    setConfig,
    connect,
    disconnect,
    startScanning,
    stopScanning,
    scanSingle,
    addToCart,
    error,
    clearError
  } = useDigitalPosScanner();

  const [showConfig, setShowConfig] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<ScannedProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [autoAddMode, setAutoAddMode] = useState(true);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalScanned: 0,
    successfulScans: 0,
    totalValue: 0
  });

  // Cargar carrito desde localStorage
  useEffect(() => {
    const loadCart = () => {
      const savedCart = JSON.parse(localStorage.getItem('shopping-cart') || '[]');
      setCartItems(savedCart);
      onCartUpdate?.(savedCart);
    };

    loadCart();
    
    // Escuchar cambios en el carrito
    const handleCartUpdate = (event: CustomEvent) => {
      setCartItems(event.detail);
      onCartUpdate?.(event.detail);
    };

    window.addEventListener('cart-updated', handleCartUpdate as EventListener);
    return () => window.removeEventListener('cart-updated', handleCartUpdate as EventListener);
  }, [onCartUpdate]);

  // Actualizar estadísticas
  useEffect(() => {
    const successful = scanHistory.filter(scan => scan.success).length;
    const totalValue = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    setStats({
      totalScanned: scanHistory.length,
      successfulScans: successful,
      totalValue
    });
  }, [scanHistory, cartItems]);

  // Manejar resultado de escaneo
  useEffect(() => {
    if (lastScanResult?.success && lastScanResult.product) {
      if (autoAddMode) {
        handleAddToCart(lastScanResult.product, quantity);
      } else {
        setPendingProduct(lastScanResult.product);
      }
    }
  }, [lastScanResult, autoAddMode, quantity]);

  const handleConnect = async () => {
    if (!config) {
      setShowConfig(true);
      return;
    }
    
    const success = await connect();
    if (!success && !config) {
      setShowConfig(true);
    }
  };

  const handleAddToCart = (product: ScannedProduct, qty: number = 1) => {
    addToCart(product, qty);
    onProductAdded?.(product, qty);
    setPendingProduct(null);
    setQuantity(1);
  };

  const handleRemoveFromCart = (barcode: string) => {
    const updatedCart = cartItems.filter(item => item.barcode !== barcode);
    localStorage.setItem('shopping-cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: updatedCart }));
  };

  const handleUpdateQuantity = (barcode: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(barcode);
      return;
    }
    
    const updatedCart = cartItems.map(item => 
      item.barcode === barcode ? { ...item, quantity: newQuantity } : item
    );
    localStorage.setItem('shopping-cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: updatedCart }));
  };

  const clearCart = () => {
    localStorage.setItem('shopping-cart', JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: [] }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const getConnectionStatusColor = () => {
    if (!config) return 'bg-gray-500';
    if (isConnected) return 'bg-green-500';
    return 'bg-red-500';
  };

  const getScanResultIcon = (result: ScanResult) => {
    if (result.success) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    return <AlertCircle className="w-4 h-4 text-red-600" />;
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Zap className="w-6 h-6" />
            <div>
              <h3 className="text-lg font-semibold">Escaneo Rápido DigitalPos</h3>
              <div className="flex items-center space-x-2 text-sm text-blue-100">
                <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`}></div>
                <span>
                  {!config ? 'Sin configurar' : isConnected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowConfig(true)}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Configuración"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4 rounded">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Connection Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {!isConnected ? (
              <button
                onClick={handleConnect}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Zap className="w-4 h-4" />
                <span>Conectar</span>
              </button>
            ) : (
              <button
                onClick={disconnect}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Desconectar</span>
              </button>
            )}
            
            {isConnected && (
              <div className="flex items-center space-x-2">
                {!isScanning ? (
                  <button
                    onClick={startScanning}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Scan className="w-4 h-4" />
                    <span>Iniciar Escaneo</span>
                  </button>
                ) : (
                  <button
                    onClick={stopScanning}
                    className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Detener</span>
                  </button>
                )}
                
                <button
                  onClick={scanSingle}
                  className="flex items-center space-x-2 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  title="Escaneo individual"
                >
                  <Barcode className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={autoAddMode}
                onChange={(e) => setAutoAddMode(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Auto-agregar</span>
            </label>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Cantidad:</label>
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1 hover:bg-gray-100"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center border-0 focus:ring-0"
                  min="1"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1 hover:bg-gray-100"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-sm text-gray-600">Escaneados</div>
                <div className="text-lg font-semibold text-blue-600">{stats.totalScanned}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <Package2 className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-sm text-gray-600">Exitosos</div>
                <div className="text-lg font-semibold text-green-600">{stats.successfulScans}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-sm text-gray-600">Total</div>
                <div className="text-lg font-semibold text-purple-600">{formatPrice(stats.totalValue)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Product */}
        {pendingProduct && !autoAddMode && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Package className="w-8 h-8 text-yellow-600" />
                <div>
                  <h4 className="font-semibold text-gray-800">{pendingProduct.name}</h4>
                  <p className="text-sm text-gray-600">
                    {formatPrice(pendingProduct.price)} • Stock: {pendingProduct.stock}
                  </p>
                  {pendingProduct.batch && (
                    <p className="text-xs text-gray-500">Lote: {pendingProduct.batch}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPendingProduct(null)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleAddToCart(pendingProduct, quantity)}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar ({quantity})</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cart Items */}
        {cartItems.length > 0 && (
          <div className="border rounded-lg">
            <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                <span className="font-medium">Carrito ({cartItems.length} productos)</span>
              </div>
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Limpiar
              </button>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {cartItems.map((item, index) => (
                <div key={`${item.barcode}-${index}`} className="p-3 border-b last:border-b-0 flex items-center justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-800">{item.name}</h5>
                    <p className="text-sm text-gray-600">
                      {formatPrice(item.price)} × {item.quantity} = {formatPrice(item.price * item.quantity)}
                    </p>
                    {item.batch && (
                      <p className="text-xs text-gray-500">Lote: {item.batch}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center border rounded">
                      <button
                        onClick={() => handleUpdateQuantity(item.barcode, item.quantity - 1)}
                        className="p-1 hover:bg-gray-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-sm">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.barcode, item.quantity + 1)}
                        className="p-1 hover:bg-gray-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <button
                      onClick={() => handleRemoveFromCart(item.barcode)}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Scans */}
        {scanHistory.length > 0 && (
          <div className="border rounded-lg">
            <div className="bg-gray-50 px-4 py-3 border-b flex items-center space-x-2">
              <Clock className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Escaneos Recientes</span>
            </div>
            
            <div className="max-h-32 overflow-y-auto">
              {scanHistory.slice(0, 5).map((scan, index) => (
                <div key={index} className="p-2 border-b last:border-b-0 flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    {getScanResultIcon(scan)}
                    <span className="font-mono text-xs">{scan.rawData.substring(0, 20)}...</span>
                    <span className="text-gray-500">{scan.scanType.toUpperCase()}</span>
                  </div>
                  <span className="text-gray-500">
                    {scan.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Configuration Modal */}
      {showConfig && (
        <DigitalPosScannerConfig
          isOpen={showConfig}
          onClose={() => setShowConfig(false)}
          onSave={setConfig}
          currentConfig={config || undefined}
        />
      )}
    </div>
  );
};

export default QuickScanComponent;