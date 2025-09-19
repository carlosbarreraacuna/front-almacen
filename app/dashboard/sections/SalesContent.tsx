'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Plus, Search, Scan, User, CreditCard, 
  Trash2, Edit, Check, X, Calculator, Receipt, 
  Package, Users, TrendingUp, Clock, Star, Gift, Zap, QrCode, Keyboard
} from 'lucide-react';
import SmartAutocomplete from '../../components/SmartAutocomplete';
import { useSmartAutocomplete } from '../../hooks/useSmartAutocomplete';
import SalesTemplates from '../../components/SalesTemplates';
import FinancialCalculator from '../../components/FinancialCalculator';
import ElectronicInvoicing from '../../components/ElectronicInvoicing';
import QRScanner from '../../components/QRScanner';
import PhysicalBarcodeReader from '../../components/PhysicalBarcodeReader';
import SimpleBarcodeReader from '../../components/SimpleBarcodeReader';
import CouponSystem from '../../components/CouponSystem';
import BarcodeGenerator from '../../components/BarcodeGenerator';
import { useQRScanner } from '../../hooks/useQRScanner';
import { usePhysicalBarcodeReader } from '../../hooks/usePhysicalBarcodeReader';
import { productApi } from '../../services/api';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  code: string;
  category: string;
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

interface SaleTemplate {
  id: number;
  name: string;
  items: CartItem[];
  customer?: Customer;
  usageCount: number;
}

export default function SalesContent() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', document: '' });

  const [showTemplates, setShowTemplates] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorInitialAmount, setCalculatorInitialAmount] = useState(0);
  const [showInvoicing, setShowInvoicing] = useState(false);

  // Estados para sistema de cupones
  const [showCoupons, setShowCoupons] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Estado para generador de códigos de barras
  const [showBarcodeGenerator, setShowBarcodeGenerator] = useState(false);

  // Estados para cantidades rápidas
  const [lastScannedProduct, setLastScannedProduct] = useState<string | null>(null);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const [quickQuantityMode, setQuickQuantityMode] = useState(false);
  const [quantityMultiplier, setQuantityMultiplier] = useState(1);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [pendingProductCode, setPendingProductCode] = useState<string | null>(null);

  // Estado para modo de escaneo físico activo
  const [physicalScannerActive, setPhysicalScannerActive] = useState(false);

  // QR Scanner configuration
  const qrScanner = useQRScanner({
    onProductScan: (productCode: string, quantity: number = 1, gs1Data?: any) => {
      handleProductScan(productCode, quantity, gs1Data);
    },
    onCustomerScan: (customerId: string) => {
      handleCustomerScan(customerId);
    },
    onCouponScan: (couponId: string) => {
      // Buscar cupón por ID y aplicarlo automáticamente
      console.log('Cupón escaneado:', couponId);
      // Aquí se podría implementar la lógica para aplicar el cupón automáticamente
    }
  });

  // Physical Barcode Reader configuration
  const physicalReader = usePhysicalBarcodeReader({
    onProductScan: (result) => {
      if (physicalScannerActive) {
        const productCode = result.parsedData?.productCode || result.data;
        handleProductScan(productCode, quantityMultiplier, result.parsedData);
      }
    },
    onCustomerScan: (result) => {
      const customerId = result.parsedData?.customerId || result.data;
      handleCustomerScan(customerId);
    },
    onCouponScan: (result) => {
      const couponId = result.parsedData?.couponId || result.data;
      console.log('Cupón escaneado con lector físico:', couponId);
    },
    continuous: physicalScannerActive,
    autoClose: !physicalScannerActive
  });

  // Simple Barcode Reader state
  const [showSimpleBarcodeReader, setShowSimpleBarcodeReader] = useState(false);
  
  const handleSimpleBarcodeScan = (data: string) => {
    console.log('Código escaneado con SimpleBarcodeReader:', data);
    handleProductScan(data, quantityMultiplier);
  };

  // Función para toggle del escáner físico
  const togglePhysicalScanner = () => {
    if (physicalScannerActive) {
      // Desactivar escáner
      setPhysicalScannerActive(false);
      physicalReader.closeReader();
    } else {
      // Activar escáner
      setPhysicalScannerActive(true);
      physicalReader.openProductReader('Escaneo Continuo de Productos');
    }
  };

  // Estado para productos reales de la base de datos
  const [products, setProducts] = useState<Product[]>([]);

  // Cargar productos desde la API al montar el componente
  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await productApi.getProducts();
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

  const [customers] = useState<Customer[]>([
    { id: 1, name: 'Juan Pérez', email: 'juan@email.com', phone: '3001234567', document: '12345678' },
    { id: 2, name: 'María García', email: 'maria@email.com', phone: '3009876543', document: '87654321' },
    { id: 3, name: 'Carlos López', email: 'carlos@email.com', phone: '3005555555', document: '11111111' }
  ]);

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

  // Autocompletado inteligente
  const {
    productQuery: productSearchQuery,
    setProductQuery: setProductSearchQuery,
    productResults,
    isProductLoading: isLoadingProducts,
    customerProductSuggestions: productSuggestions,
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

  const [templates] = useState<SaleTemplate[]>([
    {
      id: 1,
      name: 'Combo Oficina Básico',
      usageCount: 25,
      items: [
        { product: products[1], quantity: 1, discount: 0 },
        { product: products[2], quantity: 1, discount: 5 }
      ]
    },
    {
      id: 2,
      name: 'Setup Gamer',
      usageCount: 18,
      items: [
        { product: products[0], quantity: 1, discount: 0 },
        { product: products[3], quantity: 1, discount: 0 }
      ]
    }
  ]);



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
    // Limpiar búsqueda después de agregar
    setProductSearchQuery('');
  };

  const handleProductSelect = (product: Product) => {
    addToCart(product);
  };

  // Función para manejar búsqueda directa con Enter (igual que botón Agregar)
  const handleEnterSearch = (searchTerm: string) => {
    console.log('🔍 SalesContent - handleEnterSearch called with:', searchTerm);
    
    // Si hay resultados de búsqueda disponibles, agregar el primero
    if (productResults.length > 0) {
      const firstResult = productResults[0];
      console.log('✅ SalesContent - Adding first search result to cart:', firstResult.item);
      addToCart(firstResult.item);
      // Limpiar búsqueda después de agregar
      setProductSearchQuery('');
      return;
    }
    
    // Si no hay resultados, buscar por código exacto como fallback
    const product = products.find(p => 
      p.code.toLowerCase() === searchTerm.toLowerCase() ||
      p.code === searchTerm
    );
    
    if (product) {
      console.log('✅ SalesContent - Product found by exact code, adding to cart:', product);
      addToCart(product);
      // Limpiar búsqueda después de agregar
      setProductSearchQuery('');
    } else {
      console.log('❌ SalesContent - Product not found:', searchTerm);
      // TODO: Mostrar notificación de producto no encontrado
    }
  };

  const clearCustomerSearch = () => {
    setCustomerSearchQuery('');
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    clearCustomerSearch();
  };

  // QR Scanner handlers con lógica de cantidades rápidas y soporte GS1-AI
  const handleProductScan = (productCode: string, quantity: number = 1, gs1Data?: any) => {
    console.log('🛒 SalesContent - handleProductScan called with:', { productCode, quantity, gs1Data });
    
    const currentTime = Date.now();
    const timeDifference = currentTime - lastScanTime;
    
    // Detectar doble escaneo (menos de 2 segundos)
    if (lastScannedProduct === productCode && timeDifference < 2000) {
      // Doble escaneo detectado - abrir modal de cantidad
      setPendingProductCode(productCode);
      setShowQuantityModal(true);
      return;
    }
    
    // Actualizar último escaneo
    setLastScannedProduct(productCode);
    setLastScanTime(currentTime);
    
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
      
      // Aplicar multiplicador si está activo el modo cantidad rápida
      if (quickQuantityMode) {
        finalQuantity = finalQuantity * quantityMultiplier;
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

  // Funciones para cantidades rápidas
  const handleQuantityConfirm = (quantity: number) => {
    if (pendingProductCode) {
      const product = products.find(p => p.code === pendingProductCode);
      if (product) {
        const existingItem = cart.find(item => item.product.id === product.id);
        if (existingItem) {
          setCart(cart.map(item => 
            item.product.id === product.id 
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ));
        } else {
          setCart([...cart, { product, quantity, discount: 0 }]);
        }
      }
    }
    setShowQuantityModal(false);
    setPendingProductCode(null);
  };

  const toggleQuickQuantityMode = () => {
    setQuickQuantityMode(!quickQuantityMode);
    if (!quickQuantityMode) {
      setQuantityMultiplier(2); // Valor por defecto
    }
  };

  const updateQuantityMultiplier = (multiplier: number) => {
    setQuantityMultiplier(multiplier);
    if (multiplier === 1) {
      setQuickQuantityMode(false);
    } else {
      setQuickQuantityMode(true);
    }
  };

  // Funciones para plantillas
  const handleApplyTemplate = (templateProducts: any[]) => {
    // Limpiar carrito actual
    setCart([]);
    
    // Agregar productos de la plantilla al carrito
    templateProducts.forEach(templateProduct => {
      const product = products.find(p => p.id === templateProduct.productId);
      if (product) {
        const cartItem = {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: templateProduct.quantity,
          total: product.price * templateProduct.quantity
        };
        setCart(prev => [...prev, cartItem]);
      }
    });
    
    setShowTemplates(false);
  };

  // Funciones para calculadora
  const openCalculatorWithAmount = (amount: number = 0) => {
    setCalculatorInitialAmount(amount);
    setShowCalculator(true);
  };

  const openCalculatorFromTotal = () => {
    openCalculatorWithAmount(total);
  };

  // Función para facturación electrónica
  const handleInvoiceGenerated = (invoice: any) => {
    console.log('Factura generada:', invoice);
    // Aquí se podría guardar la factura en la base de datos
    // y limpiar el carrito después de una venta exitosa
    setCart([]);
    setSelectedCustomer(null);
  };

  const canGenerateInvoice = () => {
    return cart.length > 0 && selectedCustomer;
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

  const loadTemplate = (template: SaleTemplate) => {
    setCart(template.items);
    if (template.customer) {
      setSelectedCustomer(template.customer);
    }
    setShowTemplates(false);
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

  // Función para manejar aplicación de cupones
  const handleApplyCoupon = (coupon: any, discountAmount: number) => {
    setAppliedCoupon(coupon);
    setCouponDiscount(discountAmount);
    setShowCoupons(false);
  };

  // Función para remover cupón aplicado
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const completeSale = () => {
    // Aquí se enviaría la venta al backend
    alert('Venta completada exitosamente!');
    setCart([]);
    setSelectedCustomer(null);
  };

  const handleCreateCustomer = () => {
    if (newCustomer.name && newCustomer.document) {
      const customer: Customer = {
        id: customers.length + 1,
        ...newCustomer
      };
      setSelectedCustomer(customer);
      setNewCustomer({ name: '', email: '', phone: '', document: '' });
      setShowNewCustomerModal(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <ShoppingCart className="w-8 h-8 text-blue-600" />
            <span>Punto de Venta</span>
          </h1>
          <p className="text-gray-600 mt-1">Sistema de ventas rápido y eficiente</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:space-x-3 sm:gap-0 w-full sm:w-auto">
          <button 
            onClick={() => setShowTemplates(true)}
            className="flex items-center space-x-1 sm:space-x-2 bg-purple-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base flex-1 sm:flex-none justify-center"
          >
            <Star className="w-4 h-4" />
            <span className="hidden sm:inline">Plantillas</span>
            <span className="sm:hidden">Templates</span>
          </button>
          <button 
            onClick={() => setShowCalculator(true)}
            className="flex items-center space-x-1 sm:space-x-2 bg-orange-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-orange-700 transition-colors text-sm sm:text-base flex-1 sm:flex-none justify-center"
          >
            <Calculator className="w-4 h-4" />
            <span className="hidden sm:inline">Calculadora</span>
            <span className="sm:hidden">Calc</span>
          </button>
          <button 
            onClick={() => setShowCoupons(true)}
            className="flex items-center space-x-1 sm:space-x-2 bg-purple-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base flex-1 sm:flex-none justify-center"
          >
            <Gift className="w-4 h-4" />
            <span className="hidden sm:inline">Cupones</span>
            <span className="sm:hidden">Cup</span>
          </button>
          <button 
            onClick={() => setShowBarcodeGenerator(true)}
            className="flex items-center space-x-1 sm:space-x-2 bg-teal-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-teal-700 transition-colors text-sm sm:text-base flex-1 sm:flex-none justify-center"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">Códigos</span>
            <span className="sm:hidden">Codes</span>
          </button>
          <button 
            onClick={() => qrScanner.openScanner('product')}
            className="flex items-center space-x-1 sm:space-x-2 bg-indigo-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base flex-1 sm:flex-none justify-center"
          >
            <Scan className="w-4 h-4" />
            <span className="hidden sm:inline">Escanear QR</span>
            <span className="sm:hidden">QR</span>
          </button>
          <button 
            onClick={() => physicalReader.openProductReader()}
            className="flex items-center space-x-1 sm:space-x-2 bg-purple-700 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-purple-800 transition-colors text-sm sm:text-base flex-1 sm:flex-none justify-center"
          >
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Lector Físico</span>
            <span className="sm:hidden">Físico</span>
          </button>
          <button 
            onClick={() => setShowSimpleBarcodeReader(true)}
            className="flex items-center space-x-1 sm:space-x-2 bg-orange-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-orange-700 transition-colors text-sm sm:text-base flex-1 sm:flex-none justify-center"
          >
            <Keyboard className="w-4 h-4" />
            <span className="hidden sm:inline">Lector Teclado</span>
            <span className="sm:hidden">Teclado</span>
          </button>
          <button className="bg-blue-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base flex-1 sm:flex-none justify-center">
            <span className="hidden sm:inline">Nueva Venta</span>
            <span className="sm:hidden">Nueva</span>
          </button>
          <button className="bg-green-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base flex-1 sm:flex-none justify-center">
            Historial
          </button>
        </div>
      </div>

      {/* Controles de Cantidades Rápidas */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="quickQuantityMode"
                checked={quickQuantityMode}
                onChange={toggleQuickQuantityMode}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="quickQuantityMode" className="text-sm font-medium text-gray-700">
                Modo Cantidad Rápida
              </label>
            </div>
            
            {quickQuantityMode && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Multiplicador:</span>
                <div className="flex space-x-1">
                  {[2, 3, 5, 10].map((multiplier) => (
                    <button
                      key={multiplier}
                      onClick={() => updateQuantityMultiplier(multiplier)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        quantityMultiplier === multiplier
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      ×{multiplier}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                💡 Tip: Escanea dos veces el mismo producto para cantidad personalizada
              </span>
            </div>
          </div>
        </div>
      </div>

      

      {/* Main Content - Nueva estructura de dos columnas responsive */}
      <div className="flex flex-col xl:flex-row gap-4 lg:gap-6">
        {/* Lado Izquierdo - Lista de Productos */}
        <div className="bg-white rounded-lg shadow-sm border xl:w-[70%]">
          <div className="p-3 sm:p-4 border-b">
            <h3 className="text-sm sm:text-base font-semibold flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>Productos Disponibles</span>
            </h3>
          </div>
          
          <div className="p-3 sm:p-4">
            <div className="mb-4">
              <SmartAutocomplete<Product>
                type="product"
                placeholder="Escribe código y presiona Enter para agregar al carrito..."
                value={productSearchQuery}
                onChange={setProductSearchQuery}
                results={productResults}
                isLoading={isLoadingProducts}
                onSelect={handleProductSelect}
                suggestions={productSuggestions}
                onEnterSearch={handleEnterSearch}
              />
            </div>
              
            {/* Products Grid con scroll independiente */}
            <div className="max-h-80 sm:max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
                  {/* Mostrar resultados de búsqueda si hay query activo */}
                  {productSearchQuery.trim() ? (
                    productResults.length > 0 ? (
                      productResults.map((result, index) => (
                        <div key={`search-${index}`} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900">{result.item.name}</h4>
                              <p className="text-sm text-gray-500">{result.item.code} • {result.item.category}</p>
                              <p className="text-xs text-blue-600 mt-1">{result.reason}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs ${
                              result.item.stock > 10 ? 'bg-green-100 text-green-800' :
                              result.item.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              Stock: {result.item.stock}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-blue-600">
                              {formatCurrency(result.item.price)}
                            </span>
                            <button
                              onClick={() => addToCart(result.item)}
                              disabled={result.item.stock === 0}
                              className="flex items-center space-x-1 bg-blue-600 text-white px-2 sm:px-3 py-1 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                            >
                              <Plus className="w-4 h-4" />
                              <span className="hidden sm:inline">Agregar</span>
                              <span className="sm:hidden">+</span>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No se encontraron productos</p>
                      </div>
                    )
                  ) : (
                    /* Mostrar todos los productos cuando no hay búsqueda */
                    products.map(product => (
                      <div key={product.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{product.name}</h4>
                            <p className="text-sm text-gray-500">{product.code} • {product.category}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            product.stock > 10 ? 'bg-green-100 text-green-800' :
                            product.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            Stock: {product.stock}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-blue-600">
                            {formatCurrency(product.price)}
                          </span>
                          <button
                            onClick={() => addToCart(product)}
                            disabled={product.stock === 0}
                            className="flex items-center space-x-1 bg-blue-600 text-white px-2 sm:px-3 py-1 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                          >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Agregar</span>
                            <span className="sm:hidden">+</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Lado Derecho - Cliente, Carrito y Pago */}
        <div className="space-y-4 xl:w-[30%]">
          {/* Cliente */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-3 border-b">
              <h3 className="text-sm font-semibold flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Cliente</span>
              </h3>
            </div>
            
            <div className="p-3">
              <div className="flex space-x-2">
                <div className="flex-1">
                  <SmartAutocomplete<Customer>
                    type="customer"
                    placeholder="Buscar cliente..."
                    value={customerSearchQuery}
                    onChange={setCustomerSearchQuery}
                    results={customerResults}
                    isLoading={isLoadingCustomers}
                    onSelect={handleCustomerSelect}
                    suggestions={[]}
                  />
                </div>
                <button
                  onClick={() => qrScanner.openScanner('customer')}
                  className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 text-sm"
                  title="Escanear QR de cliente"
                >
                  <Scan className="w-4 h-4" />
                </button>
                <button
                  onClick={togglePhysicalScanner}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    physicalScannerActive 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                  title={physicalScannerActive ? 'Desactivar escáner físico' : 'Activar escáner físico'}
                >
                  <Zap className={`w-4 h-4 ${physicalScannerActive ? 'animate-pulse' : ''}`} />
                </button>
                <button
                  onClick={() => physicalReader.openCustomerReader()}
                  className="bg-purple-700 text-white px-3 py-2 rounded-lg hover:bg-purple-800 text-sm"
                  title="Lector físico de cliente"
                >
                  <Zap className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowNewCustomerModal(true)}
                  className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {selectedCustomer && (
                <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900 text-sm">{selectedCustomer.name}</h4>
                      <p className="text-xs text-blue-700">{selectedCustomer.document}</p>
                    </div>
                    <button
                      onClick={() => setSelectedCustomer(null)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cart */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-3 border-b bg-gray-50">
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
                    <div key={item.product.id} className="border rounded-lg p-2 bg-gray-50">
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
                        <div className="mt-2 pt-2 border-t border-gray-200">
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
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-3 border-b">
              <h3 className="text-sm font-semibold flex items-center space-x-2">
                <CreditCard className="w-4 h-4" />
                <span>Método de Pago</span>
              </h3>
            </div>
            
            <div className="p-3">
              <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-3">
                {[
                  { id: 'cash', name: 'Efectivo', icon: '💵' },
                  { id: 'card', name: 'Tarjeta', icon: '💳' },
                  { id: 'transfer', name: 'Transferencia', icon: '🏦' }
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`border rounded-lg p-1 sm:p-2 text-center transition-all text-xs ${
                      paymentMethod === method.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-lg mb-1">{method.icon}</div>
                    <p className="font-medium">{method.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Resumen y Total */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-3 border-b bg-gradient-to-r from-blue-50 to-green-50">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Resumen de Compra</span>
              </h3>
            </div>
            
            <div className="p-3 space-y-3">
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
                <div className="border-t pt-1.5 mt-2">
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
              
              <button
                onClick={() => {
                  if (canGenerateInvoice()) {
                    setShowInvoicing(true);
                  }
                }}
                disabled={!canGenerateInvoice()}
                className={`w-full py-2.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 text-sm ${
                  canGenerateInvoice()
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Receipt className="w-4 h-4" />
                 <span>
                   {canGenerateInvoice() ? 'Generar Factura DIAN' : 'Complete datos'}
                 </span>
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
            <h3 className="font-semibold mb-3 text-sm sm:text-base">Resumen del Día</h3>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Ventas:</span>
                <span className="font-medium">15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium text-green-600">$2,450,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Promedio:</span>
                <span className="font-medium">$163,333</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Plantillas de Venta</h3>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => loadTemplate(template)}
                  className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{template.name}</h4>
                    <span className="text-sm text-gray-500">
                      Usado {template.usageCount} veces
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {template.items.length} productos • Total: {formatCurrency(
                      template.items.reduce((total, item) => 
                        total + (item.product.price * item.quantity * (1 - item.discount / 100)), 0
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Plantillas de Venta */}
      <SalesTemplates
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onApplyTemplate={handleApplyTemplate}
        currentCart={cart}
        products={products}
        customers={customers}
      />
      
      {/* Calculadora Financiera */}
       <FinancialCalculator
         isOpen={showCalculator}
         onClose={() => setShowCalculator(false)}
         initialAmount={calculatorInitialAmount}
       />
       
       {/* Facturación Electrónica DIAN */}
       <ElectronicInvoicing
         isOpen={showInvoicing}
         onClose={() => setShowInvoicing(false)}
         customer={selectedCustomer}
         cart={cart.map(item => {
           // Usar precio especial si está disponible, sino usar precio del producto
           const unitPrice = item.specialPrice || item.product.price;
           const itemTotal = unitPrice * item.quantity;
           const discountAmount = (itemTotal * item.discount) / 100;
           const finalTotal = itemTotal - discountAmount;
           
           return {
             id: item.product.id.toString(),
             name: item.product.name,
             price: unitPrice,
             quantity: item.quantity,
             total: finalTotal,
             discount: item.discount
           };
         })}
         onInvoiceGenerated={handleInvoiceGenerated}
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

      {/* Modal de Cantidad Personalizada */}
      {showQuantityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Cantidad Personalizada</h3>
              <button
                onClick={() => setShowQuantityModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Doble escaneo detectado. ¿Cuántas unidades deseas agregar?
              </p>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[1, 2, 3, 5, 10, 12, 24, 50, 100].map((qty) => (
                  <button
                    key={qty}
                    onClick={() => handleQuantityConfirm(qty)}
                    className="p-3 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 text-center font-medium transition-colors"
                  >
                    {qty}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  placeholder="Cantidad personalizada"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const value = parseInt((e.target as HTMLInputElement).value);
                      if (value > 0) {
                        handleQuantityConfirm(value);
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input[type="number"]') as HTMLInputElement;
                    const value = parseInt(input.value);
                    if (value > 0) {
                      handleQuantityConfirm(value);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  OK
                </button>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowQuantityModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner */}
      <QRScanner
        isOpen={qrScanner.isOpen}
        onClose={qrScanner.closeScanner}
        onScan={qrScanner.handleScan}
        mode={qrScanner.mode}
        multiplier={qrScanner.multiplier}
        onMultiplierChange={qrScanner.setMultiplier}
      />

      {/* Physical Barcode Reader */}
      <PhysicalBarcodeReader
        isOpen={physicalReader.isOpen}
        onClose={physicalReader.closeReader}
        onScan={physicalReader.handleScan}
        mode={physicalReader.mode}
        title={physicalReader.title}
        continuous={physicalReader.continuous}
      />

      {/* Simple Barcode Reader */}
      <SimpleBarcodeReader
        isOpen={showSimpleBarcodeReader}
        onClose={() => setShowSimpleBarcodeReader(false)}
        onScan={handleSimpleBarcodeScan}
      />

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
    </div>
  );
}