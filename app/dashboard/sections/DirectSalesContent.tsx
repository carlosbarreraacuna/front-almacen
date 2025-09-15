'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, Plus, Search, Scan, CreditCard, 
  Trash2, Calculator, Receipt, 
  Package, Clock, DollarSign, CheckCircle
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  code: string;
  category: string;
}

interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  price: number;
}

export default function DirectSalesContent() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [saleCompleted, setSaleCompleted] = useState(false);

  // Mock products data
  const [products] = useState<Product[]>([
    { id: 1, name: 'Laptop HP Pavilion', price: 2500000, stock: 5, code: 'LP001', category: 'Computadores' },
    { id: 2, name: 'Mouse Logitech MX', price: 150000, stock: 20, code: 'MS001', category: 'Accesorios' },
    { id: 3, name: 'Teclado Mecánico', price: 300000, stock: 15, code: 'KB001', category: 'Accesorios' },
    { id: 4, name: 'Monitor Samsung 24"', price: 800000, stock: 8, code: 'MN001', category: 'Monitores' },
    { id: 5, name: 'Impresora Canon', price: 450000, stock: 12, code: 'PR001', category: 'Impresoras' },
    { id: 6, name: 'Disco SSD 500GB', price: 200000, stock: 25, code: 'HD001', category: 'Almacenamiento' },
    { id: 7, name: 'Memoria RAM 8GB', price: 180000, stock: 30, code: 'RM001', category: 'Componentes' },
    { id: 8, name: 'Webcam Logitech', price: 120000, stock: 18, code: 'WC001', category: 'Accesorios' }
  ]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(cart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }
    } else {
      const newItem: CartItem = {
        id: Date.now(),
        product,
        quantity: 1,
        price: product.price
      };
      setCart([...cart, newItem]);
    }
  };

  const removeFromCart = (itemId: number) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const maxQuantity = item.product.stock;
        const quantity = Math.min(newQuantity, maxQuantity);
        return { ...item, quantity };
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateChange = () => {
    const total = calculateTotal();
    const received = parseFloat(amountReceived) || 0;
    return received - total;
  };

  const processSale = () => {
    if (cart.length === 0) return;
    
    // Simular procesamiento de venta
    setSaleCompleted(true);
    
    // Reset después de 3 segundos
    setTimeout(() => {
      setCart([]);
      setAmountReceived('');
      setShowPayment(false);
      setSaleCompleted(false);
      setSearchQuery('');
    }, 3000);
  };

  const total = calculateTotal();
  const change = calculateChange();

  if (saleCompleted) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Venta Completada!</h2>
          <p className="text-gray-600">Total: ${total.toLocaleString()}</p>
          {paymentMethod === 'cash' && change > 0 && (
            <p className="text-gray-600">Cambio: ${change.toLocaleString()}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Zap className="w-8 h-8 text-yellow-600" />
            <span>Venta Directa</span>
          </h1>
          <p className="text-gray-600 mt-1">Ventas rápidas y eficientes</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar productos por nombre, código o categoría..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <button className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                <Scan className="w-4 h-4" />
                <span>Escanear</span>
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Productos Disponibles</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                        <p className="text-sm text-gray-500">{product.code} • {product.category}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-lg font-bold text-gray-900">${product.price.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0}
                        className="flex items-center space-x-1 bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Agregar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Cart Panel */}
        <div className="space-y-4">
          {/* Cart */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Carrito de Compras</h3>
            </div>
            <div className="p-4">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Carrito vacío</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 p-2 border rounded">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-500">${item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Total */}
          {cart.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span>${total.toLocaleString()}</span>
                </div>
                
                {!showPayment ? (
                  <button
                    onClick={() => setShowPayment(true)}
                    className="w-full bg-yellow-600 text-white py-3 rounded-lg hover:bg-yellow-700 font-medium"
                  >
                    Procesar Venta
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Método de Pago
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500"
                      >
                        <option value="cash">Efectivo</option>
                        <option value="card">Tarjeta</option>
                        <option value="transfer">Transferencia</option>
                      </select>
                    </div>
                    
                    {paymentMethod === 'cash' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Monto Recibido
                        </label>
                        <input
                          type="number"
                          value={amountReceived}
                          onChange={(e) => setAmountReceived(e.target.value)}
                          placeholder="0"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500"
                        />
                        {change > 0 && (
                          <p className="text-sm text-green-600 mt-1">
                            Cambio: ${change.toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowPayment(false)}
                        className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={processSale}
                        disabled={paymentMethod === 'cash' && (parseFloat(amountReceived) || 0) < total}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}