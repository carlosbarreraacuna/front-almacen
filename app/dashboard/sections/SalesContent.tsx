'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShoppingCart, Plus, Search, User, CreditCard,
  Trash2, Edit, Check, X, Calculator, Receipt,
  Package, Users, TrendingUp, Clock, QrCode, Printer, AlertCircle
} from 'lucide-react';
import SmartAutocomplete from '../../components/SmartAutocomplete';
import { useSmartAutocomplete } from '../../hooks/useSmartAutocomplete';
import FinancialCalculator from '../../components/FinancialCalculator';
import BarcodeGenerator from '../../components/BarcodeGenerator';
import CouponSystem from '../../components/CouponSystem';

import { productApi, saleApi, customerApi, couponApi, ApiCustomer } from '../../services/api';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  code: string;
  category: string;
  compatible_models?: string;
  image_url?: string;
  sellByWeight?: boolean;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  document: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  specialPrice?: number | null;
  gs1Info?: {
    batch?: string;
    expiryDate?: string;
    serialNumber?: string;
    weight?: string;
    packagingDate?: string;
    productionDate?: string;
  } | null;
}


export default function SalesContent() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', document: '' });

  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorInitialAmount, setCalculatorInitialAmount] = useState(0);

  // Estados para sistema de cupones
  const [showCoupons, setShowCoupons] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Estado para generador de códigos de barras
  const [showBarcodeGenerator, setShowBarcodeGenerator] = useState(false);
  const [saleSubmitting, setSaleSubmitting] = useState(false);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [saleSuccess, setSaleSuccess] = useState<{ saleNumber: string; total: number } | null>(null);
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Stats del día — se cargan solo al montar y tras cada venta exitosa
  const [dailyStats, setDailyStats] = useState<{ total_sales: number; total_revenue: number } | null>(null);
  const statsLoadedRef = useRef(false);

  const loadDailyStats = useCallback(() => {
    saleApi.getStats().then((res) => {
      if (res?.success) setDailyStats(res.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!statsLoadedRef.current) {
      statsLoadedRef.current = true;
      loadDailyStats();
    }
  }, [loadDailyStats]);

  // Estados para código promocional inline
  const [promoCode, setPromoCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');


  // Estado para productos reales de la base de datos
  const [products, setProducts] = useState<Product[]>([]);

  // Cargar productos desde la API al montar el componente
  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await productApi.getProducts({ per_page: 1000 });
        if (response?.success) {
          const productsArray = Array.isArray(response.data?.data)
            ? response.data.data
            : Array.isArray(response.data)
            ? response.data
            : [];
          const mapped: Product[] = productsArray.map((apiProduct: any) => ({
            id: apiProduct.id,
            name: apiProduct.name,
            price: parseFloat(apiProduct.unit_price),
            stock: parseFloat(apiProduct.stock_quantity),
            code: apiProduct.sku,
            category: apiProduct.category?.name || '',
            compatible_models: apiProduct.compatible_models || '',
            image_url: apiProduct.image_url || '',
            sellByWeight: apiProduct.sell_by_weight || false,
          }));
          setProducts(mapped);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    }
    fetchProducts();
  }, []);

  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    customerApi.getCustomers().then((res) => {
      const items = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setCustomers(
        items.map((c: ApiCustomer) => ({
          id: c.id,
          name: c.name,
          email: c.email || '',
          phone: c.phone || '',
          document: c.document_number || '',
        }))
      );
    }).catch(() => setCustomers([]));
  }, []);

  // Mock sales history data
  const [salesHistory] = useState([
    {
      id: 1,
      customerId: 1,
      products: [{ productId: 1, quantity: 2, price: 2500000 }],
      total: 5000000,
      date: '2024-01-15',
      paymentMethod: 'cash'
    },
    {
      id: 2,
      customerId: 2,
      products: [{ productId: 2, quantity: 1, price: 150000 }],
      total: 150000,
      date: '2024-01-14',
      paymentMethod: 'card'
    }
  ]);

  // Búsqueda de productos (filtrado client-side, sin dropdown)
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // Modo escaneo con lector de códigos
  const [scanMode, setScanMode] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showScanFeedback = (message: string, type: 'success' | 'error') => {
    setScanFeedback({ message, type });
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setScanFeedback(null), 2500);
  };

  const handleScanEnter = (value: string) => {
    const code = value.trim().replace(/'/g, '-');
    if (!code) return;
    const product = products.find(p => p.code.toLowerCase() === code.toLowerCase());
    if (product) {
      if (product.stock === 0) {
        showScanFeedback(`${product.name} — Sin stock`, 'error');
      } else {
        addToCart(product);
        showScanFeedback(`✓ ${product.name} agregado`, 'success');
      }
    } else {
      showScanFeedback(`Código no encontrado: ${code}`, 'error');
    }
    setProductSearchQuery('');
  };

  // Enfocar input de escaneo al activar el modo
  useEffect(() => {
    if (scanMode && scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [scanMode]);

  // Autocompletado solo para clientes
  const {
    customerQuery: customerSearchQuery,
    setCustomerQuery: setCustomerSearchQuery,
    customerResults,
    isCustomerLoading: isLoadingCustomers
  } = useSmartAutocomplete({
    products,
    customers,
    salesHistory,
    currentCustomer: selectedCustomer
  });

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1, discount: 0 }]);
    }
  };

  const clearCustomerSearch = () => {
    setCustomerSearchQuery('');
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    clearCustomerSearch();
  };

  // QR Scanner handlers con soporte GS1-AI
  const handleProductScan = (productCode: string, quantity: number = 1, gs1Data?: any) => {
    console.log('🛒 SalesContent - handleProductScan called with:', { productCode, quantity, gs1Data });

    // Buscar producto por código principal o GTIN
    console.log('🔍 SalesContent - Searching for product with code:', productCode);
    console.log('🔍 SalesContent - Available products:', products.map(p => ({ id: p.id, name: p.name, code: p.code })));
    
    let product = products.find(p => p.code === productCode);
    console.log('🔍 SalesContent - Product found by code:', product);
    
    // Si no se encuentra y hay datos GS1, buscar por GTIN
    if (!product && gs1Data?.gtin) {
      console.log('🔍 SalesContent - Searching by GTIN:', gs1Data.gtin);
      product = products.find(p => p.code === gs1Data.gtin);
      console.log('🔍 SalesContent - Product found by GTIN:', product);
    }
    
    if (product) {
      console.log('✅ SalesContent - Product found, proceeding to add to cart:', product);
      // Determinar cantidad final considerando datos GS1
      let finalQuantity = quantity;
      
      // Si hay datos de cantidad en GS1, usarlos
      if (gs1Data?.quantity) {
        finalQuantity = parseInt(gs1Data.quantity);
      }

      // Si hay datos de peso/medida variable, calcular cantidad basada en peso
      if (gs1Data?.weight && product.sellByWeight) {
        finalQuantity = parseFloat(gs1Data.weight);
      }

      // Determinar precio especial si viene en el código GS1
      let specialPrice = null;
      if (gs1Data?.price) {
        specialPrice = parseFloat(gs1Data.price.toString().replace(/[^0-9.]/g, ''));
      } else if (gs1Data?.amount) {
        specialPrice = parseFloat(gs1Data.amount);
      } else if (gs1Data?.pricePerUnit) {
        specialPrice = parseFloat(gs1Data.pricePerUnit) * finalQuantity;
      }
      
      const existingItem = cart.find(item => item.product.id === product.id);
      
      // Crear item del carrito con información adicional de GS1
      const cartItem = {
        product,
        quantity: finalQuantity,
        discount: 0,
        specialPrice,
        gs1Info: gs1Data ? {
          batch: gs1Data.batch,
          expiryDate: gs1Data.expiryDate,
          serialNumber: gs1Data.serialNumber,
          weight: gs1Data.weight,
          packagingDate: gs1Data.packagingDate,
          productionDate: gs1Data.productionDate
        } : null
      };
      
      if (existingItem) {
        console.log('🔄 SalesContent - Updating existing item in cart');
        setCart(cart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + finalQuantity, specialPrice, gs1Info: cartItem.gs1Info }
            : item
        ));
      } else {
        console.log('➕ SalesContent - Adding new item to cart');
        setCart([...cart, cartItem]);
      }
      
      console.log('🛒 SalesContent - Cart updated successfully');
      
      // Mostrar feedback visual con información adicional
      let feedbackMessage = `Agregado: ${product.name}`;
      if (finalQuantity !== 1) {
        feedbackMessage += ` x${finalQuantity}`;
      }
      if (gs1Data?.weight) {
        feedbackMessage += ` (${gs1Data.weight}kg)`;
      }
      if (specialPrice) {
        feedbackMessage += ` - Precio especial: $${specialPrice.toFixed(2)}`;
      }
      if (gs1Data?.batch) {
        feedbackMessage += ` - Lote: ${gs1Data.batch}`;
      }
      if (gs1Data?.expiryDate) {
        feedbackMessage += ` - Vence: ${gs1Data.expiryDate}`;
      }
      
      console.log(feedbackMessage);
      
      // TODO: Mostrar notificación visual al usuario con esta información
      
    } else {
      // Mostrar mensaje de producto no encontrado
      let errorMessage = `❌ SalesContent - Producto no encontrado`;
      if (gs1Data?.gtin) {
        errorMessage += ` (GTIN: ${gs1Data.gtin})`;
      } else {
        errorMessage += ` (Código: ${productCode})`;
      }
      console.error(errorMessage);
      console.log('🔍 SalesContent - Available product codes:', products.map(p => p.code));
      
      // TODO: Mostrar notificación de error al usuario
    }
  };

  const handleCustomerScan = (customerId: string) => {
    const customer = customers.find(c => c.id.toString() === customerId || c.document === customerId);
    if (customer) {
      setSelectedCustomer(customer);
    } else {
      console.warn(`Cliente con ID ${customerId} no encontrado`);
    }
  };

  // Funciones para calculadora
  const openCalculatorWithAmount = (amount: number = 0) => {
    setCalculatorInitialAmount(amount);
    setShowCalculator(true);
  };

  const openCalculatorFromTotal = () => {
    openCalculatorWithAmount(total);
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item => 
      item.product.id === productId 
        ? { ...item, quantity }
        : item
    ));
  };

  const updateDiscount = (productId: number, discount: number) => {
    setCart(cart.map(item => 
      item.product.id === productId 
        ? { ...item, discount: Math.max(0, Math.min(100, discount)) }
        : item
    ));
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => {
      // Usar precio especial si está disponible, sino usar precio del producto
      const unitPrice = item.specialPrice || item.product.price;
      const itemTotal = unitPrice * item.quantity;
      const discountAmount = (itemTotal * item.discount) / 100;
      return total + (itemTotal - discountAmount);
    }, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.19; // IVA 19%
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const total = subtotal + tax;
    return Math.max(0, total - couponDiscount); // Aplicar descuento de cupón
  };

  // Función para manejar aplicación de cupones (modal CouponSystem)
  const handleApplyCoupon = (coupon: any, discountAmount: number) => {
    setAppliedCoupon(coupon);
    setCouponDiscount(discountAmount);
    setShowCoupons(false);
  };

  // Función para remover cupón aplicado
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setPromoCode('');
    setCouponError('');
  };

  // Validación inline de código promocional
  const handleApplyCouponInline = async () => {
    if (!promoCode.trim()) {
      setCouponError('Ingresa un código promocional');
      return;
    }
    setCouponLoading(true);
    setCouponError('');
    try {
      const productIds = cart.map(item => item.product.id);
      const response = await couponApi.validate(promoCode.trim(), calculateSubtotal(), productIds);
      if (response?.success && response?.data) {
        setAppliedCoupon(response.data.coupon);
        setCouponDiscount(response.data.discount);
        setCouponError('');
      } else {
        const msg = response?.errors?.[0] || response?.message || 'Cupón inválido o expirado';
        setCouponError(msg);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.errors?.[0] || err?.message || 'Cupón inválido o expirado';
      setCouponError(msg);
    } finally {
      setCouponLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const completeSale = async () => {
    if (cart.length === 0) return;

    setSaleSubmitting(true);
    setSaleError(null);

    try {
      const subtotal = calculateSubtotal();
      const taxAmount = calculateTax();
      const total = calculateTotal();

      const items = cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.specialPrice ?? item.product.price,
        discount_amount: ((item.specialPrice ?? item.product.price) * item.quantity * item.discount) / 100,
      }));

      const response = await saleApi.createSale({
        customer_id: selectedCustomer?.id,
        items,
        payment_method: paymentMethod as 'cash' | 'card' | 'transfer' | 'check' | 'credit',
        subtotal,
        tax_amount: taxAmount,
        discount_amount: couponDiscount,
        total_amount: total,
        notes: appliedCoupon ? `Cupón: ${appliedCoupon.code}` : undefined,
      });

      if (response?.success) {
        const saleNumber = response.data?.sale_number || response.data?.invoice_number || '—';
        setSaleSuccess({ saleNumber, total });
        // Guardar datos para recibo
        setReceiptData({
          saleNumber,
          date: new Date().toLocaleString('es-CO'),
          customer: selectedCustomer,
          items: cart.map(item => ({
            name: item.product.name,
            code: item.product.code,
            quantity: item.quantity,
            unitPrice: item.specialPrice ?? item.product.price,
            discount: item.discount,
          })),
          subtotal,
          taxAmount,
          couponDiscount,
          total,
          paymentMethod,
        });
        // Actualizar stock en tiempo real
        setProducts(prev => prev.map(p => {
          const soldItem = cart.find(item => item.product.id === p.id);
          if (soldItem) {
            return { ...p, stock: Math.max(0, p.stock - soldItem.quantity) };
          }
          return p;
        }));
        setCart([]);
        setSelectedCustomer(null);
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setPromoCode('');
        setCouponError('');
        // Refrescar stats del día solo una vez
        loadDailyStats();
      } else {
        setSaleError(response?.message || 'Error al registrar la venta');
      }
    } catch (err) {
      setSaleError(err instanceof Error ? err.message : 'Error al registrar la venta');
    } finally {
      setSaleSubmitting(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.document) return;
    try {
      const response = await customerApi.createCustomer({
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        document_number: newCustomer.document,
      });
      const created = response?.data ?? response;
      const customer: Customer = {
        id: created.id,
        name: created.name,
        email: created.email || '',
        phone: created.phone || '',
        document: created.document_number || newCustomer.document,
      };
      setCustomers((prev) => [...prev, customer]);
      setSelectedCustomer(customer);
      setNewCustomer({ name: '', email: '', phone: '', document: '' });
      setShowNewCustomerModal(false);
    } catch {
      // Si falla, crear localmente con ID temporal
      const customer: Customer = { id: Date.now(), ...newCustomer };
      setSelectedCustomer(customer);
      setNewCustomer({ name: '', email: '', phone: '', document: '' });
      setShowNewCustomerModal(false);
    }
  };


  return (
    <div className="space-y-4 sm:space-y-6">
      




      {/* Main Content - Nueva estructura de dos columnas responsive */}
      <div className="flex flex-col xl:flex-row gap-4 lg:gap-6">
        {/* Lado Izquierdo - Lista de Productos */}
        <div className="bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] xl:w-[70%] flex flex-col min-h-0">
          <div className="px-3 sm:px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-2">
            <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2 mr-2">
              <Package className="w-4 h-4" />
              <span>Productos Disponibles</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setShowCalculator(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium transition-all">
                <Calculator className="w-3.5 h-3.5" /><span>Calculadora</span>
              </button>
              <button onClick={() => setShowBarcodeGenerator(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-medium transition-all">
                <QrCode className="w-3.5 h-3.5" /><span>Códigos</span>
              </button>
              
            </div>
            {/* Cliente inline */}
            <div className="flex items-center gap-2 ml-auto">
              <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              {selectedCustomer ? (
                <div className="flex items-center gap-1.5 bg-blue-50/80 rounded-lg px-2 py-1 shadow-[0_1px_4px_rgba(59,130,246,0.12)]">
                  <span className="text-xs font-medium text-blue-800 max-w-[140px] truncate">{selectedCustomer.name}</span>
                  <button onClick={() => setSelectedCustomer(null)} className="text-blue-400 hover:text-blue-700 flex-shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-56">
                  <SmartAutocomplete<Customer>
                    type="customer"
                    placeholder="Buscar cliente..."
                    value={customerSearchQuery}
                    onChange={setCustomerSearchQuery}
                    results={customerResults}
                    isLoading={isLoadingCustomers}
                    onSelect={handleCustomerSelect}
                    suggestions={[]}
                    inputClassName="!py-1 text-xs"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="p-3 sm:p-4 flex flex-col flex-1 min-h-0 max-h-[550px]">
            <div className="flex flex-col flex-1 min-h-0">
            <div className="mb-4 space-y-1.5">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  {scanMode
                    ? <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500 pointer-events-none" />
                    : <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  }
                  <input
                    ref={scanInputRef}
                    type="text"
                    placeholder={scanMode ? 'Escanea o escribe el código y presiona Enter...' : 'Buscar por nombre, código, categoría, modelos...'}
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value.replace(/'/g, '-'))}
                    onKeyDown={(e) => {
                      if (scanMode && e.key === 'Enter') {
                        e.preventDefault();
                        handleScanEnter(productSearchQuery);
                      }
                    }}
                    className={`w-full pl-9 pr-4 py-2 text-sm rounded-lg focus:outline-none transition-all ${
                      scanMode
                        ? 'border-2 border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 bg-green-50/30 font-mono'
                        : 'border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 bg-white'
                    }`}
                  />
                </div>
                <button
                  onClick={() => setScanMode(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    scanMode
                      ? 'bg-green-600 text-white shadow-[0_2px_8px_rgba(22,163,74,0.35)]'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  {scanMode ? 'Escaneo activo' : 'Modo escaneo'}
                </button>
              </div>
              {scanFeedback && (
                <div className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                  scanFeedback.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {scanFeedback.message}
                </div>
              )}
            </div>

            {/* Tabla de productos */}
            <div className="flex-1 min-h-0 overflow-y-auto rounded-xl bg-gray-50/40">

              {(() => {
                const q = productSearchQuery.trim().toLowerCase();
                const displayList: Product[] = q
                  ? products.filter(p =>
                      p.name.toLowerCase().includes(q) ||
                      p.code.toLowerCase().includes(q) ||
                      p.category.toLowerCase().includes(q) ||
                      (p.compatible_models || '').toLowerCase().includes(q) ||
                      String(p.price).includes(q) ||
                      String(p.stock).includes(q)
                    )
                  : products;

                if (displayList.length === 0) {
                  return (
                    <div className="text-center py-12 text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">{productSearchQuery.trim() ? 'No se encontraron productos' : 'Sin productos cargados'}</p>
                    </div>
                  );
                }

                return (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50/80 sticky top-0 z-10">
                      <tr className="border-b border-gray-100">
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase w-28">SKU</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Producto</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase w-32">Categoría</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase w-28">Precio</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase w-20">Stock</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase w-96">Modelos Compatibles</th>
                        <th className="px-3 py-2.5 w-24"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {displayList.map((product) => (
                        <tr key={product.id} className={`hover:bg-blue-50 transition-colors ${product.stock === 0 ? 'opacity-50' : ''}`}>
                          {/* SKU */}
                          <td className="px-3 py-2.5">
                            <span className="font-mono text-xs text-gray-600 font-medium">{product.code}</span>
                          </td>
                          {/* Nombre */}
                          <td className="px-3 py-2.5">
                            <span className="font-semibold text-gray-900 text-xs">{product.name}</span>
                          </td>
                          {/* Categoría */}
                          <td className="px-3 py-2.5">
                            <span className="text-xs text-gray-500 uppercase leading-tight">{product.category}</span>
                          </td>
                          {/* Precio */}
                          <td className="px-3 py-2.5">
                            <span className="font-bold text-blue-600 text-sm">{formatCurrency(product.price)}</span>
                          </td>
                          {/* Stock */}
                          <td className="px-3 py-2.5">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                              product.stock > 10 ? 'bg-green-100 text-green-700' :
                              product.stock > 0  ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {product.stock > 0 ? product.stock : 'Agotado'}
                            </span>
                          </td>
                          {/* Modelos compatibles */}
                          <td className="px-3 py-2.5 w-96">
                            {product.compatible_models ? (
                              <div className="relative group">
                                <span className="text-xs text-gray-500 leading-snug cursor-pointer underline decoration-dotted decoration-gray-400 hover:text-blue-600 hover:decoration-blue-400">
                                  {product.compatible_models}
                                </span>
                                {/* Tooltip */}
                                <div className="absolute z-50 hidden group-hover:block bottom-full left-0 mb-2 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl pointer-events-none">
                                  <p className="font-semibold text-gray-300 mb-1 uppercase tracking-wide text-[10px]">Modelos Compatibles</p>
                                  <p className="leading-relaxed whitespace-pre-wrap">{product.compatible_models}</p>
                                  {/* Flecha */}
                                  <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                          {/* Botón */}
                          <td className="px-3 py-2.5 text-right">
                            <button
                              onClick={() => addToCart(product)}
                              disabled={product.stock === 0}
                              className="flex items-center justify-center bg-blue-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
            </div>
          </div>
        </div>

        {/* Lado Derecho - Cliente, Carrito y Pago */}
        <div className="space-y-4 xl:w-[30%]">

         

          {/* Cart */}
          <div className="bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            <div className="p-3 border-b border-gray-100 border-gray-100 bg-gray-50/60">
              <h3 className="font-semibold flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="w-4 h-4" />
                  <span>Carrito</span>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {cart.length} {cart.length === 1 ? 'item' : 'items'}
                </span>
              </h3>
            </div>
            
            <div className="p-3">
              {cart.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs">Carrito vacío</p>
                  <p className="text-xs text-gray-400">Agrega productos</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 sm:max-h-56 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.product.id} className="rounded-xl p-2 bg-gray-50/70 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-xs truncate">{item.product.name}</h4>
                          <p className="text-xs text-gray-500">{item.product.code}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-500 hover:text-red-700 ml-1 p-1 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 rounded border bg-white flex items-center justify-center hover:bg-gray-100 text-xs font-medium"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-semibold bg-white border rounded px-1 py-1">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 rounded border bg-white flex items-center justify-center hover:bg-gray-100 text-xs font-medium"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-green-600">
                            {formatCurrency((item.specialPrice || item.product.price) * item.quantity * (1 - item.discount / 100))}
                          </span>
                          {item.specialPrice && (
                            <div className="text-xs text-blue-600">
                              Precio especial
                            </div>
                          )}
                          {item.discount > 0 && (
                            <div className="text-xs text-green-600">
                              -{item.discount}%
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Información GS1 adicional */}
                      {item.gs1Info && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                            {item.gs1Info.weight && (
                              <div className="flex items-center space-x-1">
                                <span className="font-medium">Peso:</span>
                                <span>{item.gs1Info.weight}kg</span>
                              </div>
                            )}
                            {item.gs1Info.batch && (
                              <div className="flex items-center space-x-1">
                                <span className="font-medium">Lote:</span>
                                <span>{item.gs1Info.batch}</span>
                              </div>
                            )}
                            {item.gs1Info.expiryDate && (
                              <div className="flex items-center space-x-1">
                                <span className="font-medium">Vence:</span>
                                <span>{item.gs1Info.expiryDate}</span>
                              </div>
                            )}
                            {item.gs1Info.serialNumber && (
                              <div className="flex items-center space-x-1">
                                <span className="font-medium">Serie:</span>
                                <span>{item.gs1Info.serialNumber}</span>
                              </div>
                            )}
                            {item.gs1Info.packagingDate && (
                              <div className="flex items-center space-x-1">
                                <span className="font-medium">Empaque:</span>
                                <span>{item.gs1Info.packagingDate}</span>
                              </div>
                            )}
                            {item.gs1Info.productionDate && (
                              <div className="flex items-center space-x-1">
                                <span className="font-medium">Producción:</span>
                                <span>{item.gs1Info.productionDate}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>



          {/* Método de Pago */}
          <div className="bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            <div className="p-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold flex items-center space-x-2">
                <CreditCard className="w-4 h-4" />
                <span>Método de Pago</span>
              </h3>
            </div>
            
            <div className="p-3">
              <div className="flex gap-2">
                {[
                  { id: 'cash',     name: 'Efectivo',       icon: '💵', active: 'bg-emerald-600 text-white shadow-[0_2px_8px_rgba(5,150,105,0.35)]' },
                  { id: 'card',     name: 'Tarjeta',        icon: '💳', active: 'bg-blue-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.35)]' },
                  { id: 'transfer', name: 'Transferencia',  icon: '🏦', active: 'bg-violet-600 text-white shadow-[0_2px_8px_rgba(124,58,237,0.35)]' },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                      paymentMethod === method.id
                        ? method.active
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-sm">{method.icon}</span>
                    <span>{method.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Resumen y Total */}
          <div className="bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-green-50">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Resumen de Compra</span>
              </h3>
            </div>
            
            <div className="p-3 space-y-3">
              {/* Código Promocional inline */}
              <div className="rounded-xl p-3 bg-gray-50/70 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <p className="text-xs font-semibold text-gray-700 mb-2">Código Promocional</p>
                {!appliedCoupon ? (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCouponInline()}
                        placeholder="Ingresa el código"
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={couponLoading}
                      />
                      <button
                        onClick={handleApplyCouponInline}
                        disabled={couponLoading || !promoCode.trim()}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {couponLoading ? '...' : 'Aplicar'}
                      </button>
                    </div>
                    {couponError && (
                      <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700 font-medium leading-snug">{couponError}</p>
                        <button onClick={() => setCouponError('')} className="ml-auto text-red-400 hover:text-red-600 flex-shrink-0">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-green-50/80 rounded-xl p-2 shadow-[0_1px_4px_rgba(16,185,129,0.12)]">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-semibold text-green-800">{appliedCoupon.name || appliedCoupon.code}</p>
                        <p className="text-xs text-green-600">Descuento: -{formatCurrency(couponDiscount)}</p>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-green-600 hover:text-red-600 ml-2"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">IVA (19%):</span>
                  <span className="font-medium">{formatCurrency(calculateTax())}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">Cupón ({appliedCoupon.code}):</span>
                    <span className="font-medium text-green-600">-{formatCurrency(couponDiscount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-1.5 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">Total:</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-lg font-bold text-green-600">{formatCurrency(calculateTotal())}</span>
                      <button
                        onClick={() => openCalculatorWithAmount(calculateTotal())}
                        className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Abrir calculadora con total"
                      >
                        <Calculator className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Error de venta */}
              {saleError && (
                <div className="flex items-start space-x-2 p-2.5 bg-red-50/80 rounded-xl shadow-[0_1px_4px_rgba(239,68,68,0.12)] text-xs text-red-700">
                  <span className="font-medium">{saleError}</span>
                  <button onClick={() => setSaleError(null)} className="ml-auto text-red-400 hover:text-red-600 flex-shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Éxito de venta */}
              {saleSuccess && (
                <div className="p-3 bg-green-50/80 rounded-xl shadow-[0_1px_6px_rgba(16,185,129,0.15)] text-center space-y-2">
                  <p className="text-green-700 font-semibold text-sm">¡Venta registrada!</p>
                  <p className="text-green-600 text-xs">N° {saleSuccess.saleNumber}</p>
                  <p className="text-green-800 font-bold text-base">{formatCurrency(saleSuccess.total)}</p>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { setShowReceipt(true); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Imprimir
                    </button>
                    <button
                      onClick={() => setSaleSuccess(null)}
                      className="flex-1 py-1.5 bg-white text-green-700 rounded-lg text-xs font-medium hover:bg-green-50 shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                    >
                      Nueva venta
                    </button>
                  </div>
                </div>
              )}

              {/* Botón Cobrar */}
              {!saleSuccess && (
                <button
                  onClick={completeSale}
                  disabled={cart.length === 0 || saleSubmitting}
                  className={`w-full py-3 px-3 rounded-lg font-bold transition-all flex items-center justify-center space-x-2 text-sm ${
                    cart.length > 0 && !saleSubmitting
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {saleSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <ShoppingCart className="w-4 h-4" />
                  )}
                  <span>{saleSubmitting ? 'Procesando...' : `Cobrar ${formatCurrency(calculateTotal())}`}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Calculadora Financiera */}
       <FinancialCalculator
         isOpen={showCalculator}
         onClose={() => setShowCalculator(false)}
         initialAmount={calculatorInitialAmount}
       />
       
       
       {/* Modal para crear nuevo cliente */}
       {showNewCustomerModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-semibold">Crear Nuevo Cliente</h3>
               <button
                 onClick={() => setShowNewCustomerModal(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <X className="w-5 h-5" />
               </button>
             </div>
             
             <form onSubmit={handleCreateCustomer} className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Nombre completo *
                 </label>
                 <input
                   type="text"
                   value={newCustomer.name}
                   onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                   className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                   required
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Documento *
                 </label>
                 <input
                   type="text"
                   value={newCustomer.document}
                   onChange={(e) => setNewCustomer({...newCustomer, document: e.target.value})}
                   className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                   required
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Email
                 </label>
                 <input
                   type="email"
                   value={newCustomer.email}
                   onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                   className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Teléfono
                 </label>
                 <input
                   type="tel"
                   value={newCustomer.phone}
                   onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                   className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                 />
               </div>
               
               <div className="flex space-x-3 pt-4">
                 <button
                   type="button"
                   onClick={() => setShowNewCustomerModal(false)}
                   className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                 >
                   Cancelar
                 </button>
                 <button
                   type="submit"
                   className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                 >
                   Crear Cliente
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}



      {/* Sistema de Cupones */}
      <CouponSystem
        isOpen={showCoupons}
        onClose={() => setShowCoupons(false)}
        onApplyCoupon={handleApplyCoupon}
        appliedCoupon={appliedCoupon}
        onRemoveCoupon={removeCoupon}
        cartTotal={calculateSubtotal()}
      />

      {/* Generador de Códigos de Barras */}
      <BarcodeGenerator
        isOpen={showBarcodeGenerator}
        onClose={() => setShowBarcodeGenerator(false)}
        products={products}
      />

      {/* ── Modal Recibo / Factura ─────────────────────── */}
      {showReceipt && receiptData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            {/* Toolbar (no imprime) */}
            <div className="flex items-center justify-between px-4 py-3 border-b print:hidden">
              <h3 className="font-bold text-gray-800 text-sm">Recibo de Venta</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir
                </button>
                <button
                  onClick={() => setShowReceipt(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Contenido del recibo */}
            <div id="receipt-content" className="p-5 font-mono text-xs space-y-3">
              {/* Encabezado */}
              <div className="text-center space-y-1">
                <div className="flex justify-center mb-1">
                  <img src="/logoalmacen.jpeg" alt="Moto Spa" className="w-16 h-16 rounded-full object-cover" />
                </div>
                <p className="text-base font-bold uppercase tracking-wide">Almacén y Taller Moto Spa</p>
                <div className="border-t border-dashed border-gray-400 my-2" />
                <p className="font-bold text-sm">N° {receiptData.saleNumber}</p>
                <p className="text-gray-500">{receiptData.date}</p>
              </div>

              {/* Cliente */}
              {receiptData.customer && (
                <div className="border-t border-dashed border-gray-300 pt-2">
                  <p className="font-bold">Cliente:</p>
                  <p>{receiptData.customer.name}</p>
                  {receiptData.customer.phone && <p>{receiptData.customer.phone}</p>}
                </div>
              )}

              {/* Items */}
              <div className="border-t border-dashed border-gray-300 pt-2 space-y-1.5">
                <div className="flex justify-between font-bold border-b border-gray-200 pb-1">
                  <span className="flex-1">Producto</span>
                  <span>Total</span>
                </div>
                {receiptData.items.map((item: any, i: number) => {
                  const lineTotal = (item.unitPrice * item.quantity) * (1 - item.discount / 100);
                  return (
                    <div key={i}>
                      <p className="truncate font-medium">{item.name}</p>
                      <div className="flex justify-between text-gray-600">
                        <span>{formatCurrency(item.unitPrice)} x {item.quantity}{item.discount > 0 ? ` (-${item.discount}%)` : ''}</span>
                        <span className="font-medium text-gray-900">{formatCurrency(lineTotal)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totales */}
              <div className="border-t border-dashed border-gray-300 pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(receiptData.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA (19%):</span>
                  <span>{formatCurrency(receiptData.taxAmount)}</span>
                </div>
                {receiptData.couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento:</span>
                    <span>-{formatCurrency(receiptData.couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base border-t border-gray-400 pt-1.5 mt-1">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(receiptData.total)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Pago:</span>
                  <span>{{cash:'Efectivo',card:'Tarjeta',transfer:'Transferencia',check:'Cheque',credit:'Crédito'}[receiptData.paymentMethod as string] ?? receiptData.paymentMethod}</span>
                </div>
              </div>

              {/* Pie */}
              <div className="border-t border-dashed border-gray-400 pt-3 text-center text-gray-500 space-y-0.5">
                <p>¡Gracias por su compra!</p>
                <p className="text-xs">Conserve este recibo</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estilos de impresión */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #receipt-content { display: block !important; position: fixed; top: 0; left: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}