'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { debounce } from 'lodash';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  code: string;
  category: string;
  salesCount?: number;
  lastSold?: string;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  document: string;
  lastPurchase?: string;
  totalPurchases?: number;
  favoriteProducts?: number[];
}

interface SaleHistory {
  id: number;
  customerId?: number;
  products: { productId: number; quantity: number; price: number }[];
  total: number;
  date: string;
  paymentMethod: string;
}

interface AutocompleteResult<T> {
  item: T;
  score: number;
  reason: string;
  isRecent?: boolean;
  isFrequent?: boolean;
}

interface UseSmartAutocompleteProps {
  products: Product[];
  customers: Customer[];
  salesHistory: SaleHistory[];
  currentCustomer?: Customer | null;
}

export function useSmartAutocomplete({
  products,
  customers,
  salesHistory,
  currentCustomer
}: UseSmartAutocompleteProps) {
  const [productQuery, setProductQuery] = useState('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [isProductLoading, setIsProductLoading] = useState(false);
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);

  // Calcular estadísticas de productos
  const productStats = useMemo(() => {
    const stats = new Map<number, { salesCount: number; lastSold: string; revenue: number }>();
    
    if (!salesHistory || !Array.isArray(salesHistory)) {
      return stats;
    }
    
    salesHistory.forEach(sale => {
      sale.products.forEach(item => {
        const current = stats.get(item.productId) || { salesCount: 0, lastSold: '', revenue: 0 };
        stats.set(item.productId, {
          salesCount: current.salesCount + item.quantity,
          lastSold: sale.date > current.lastSold ? sale.date : current.lastSold,
          revenue: current.revenue + (item.price * item.quantity)
        });
      });
    });
    
    return stats;
  }, [salesHistory]);

  // Calcular estadísticas de clientes
  const customerStats = useMemo(() => {
    const stats = new Map<number, { 
      totalPurchases: number; 
      lastPurchase: string; 
      favoriteProducts: number[];
      totalSpent: number;
    }>();
    
    salesHistory.forEach(sale => {
      if (sale.customerId) {
        const current = stats.get(sale.customerId) || { 
          totalPurchases: 0, 
          lastPurchase: '', 
          favoriteProducts: [],
          totalSpent: 0
        };
        
        const productIds = sale.products.map(p => p.productId);
        const updatedFavorites = [...current.favoriteProducts, ...productIds];
        
        stats.set(sale.customerId, {
          totalPurchases: current.totalPurchases + 1,
          lastPurchase: sale.date > current.lastPurchase ? sale.date : current.lastPurchase,
          favoriteProducts: updatedFavorites,
          totalSpent: current.totalSpent + sale.total
        });
      }
    });
    
    return stats;
  }, [salesHistory]);

  // Función de scoring para productos
  const scoreProduct = useCallback((product: Product, query: string): AutocompleteResult<Product> => {
    const stats = productStats.get(product.id);
    let score = 0;
    let reason = '';
    let isRecent = false;
    let isFrequent = false;

    // Puntuación por coincidencia de texto
    const nameMatch = product.name.toLowerCase().includes(query.toLowerCase());
    const codeMatch = product.code.toLowerCase().includes(query.toLowerCase());
    const categoryMatch = product.category.toLowerCase().includes(query.toLowerCase());
    
    if (nameMatch) score += 100;
    if (codeMatch) score += 80;
    if (categoryMatch) score += 20;

    // Puntuación por popularidad
    if (stats) {
      const salesCount = stats.salesCount || 0;
      score += Math.min(salesCount * 2, 50); // Máximo 50 puntos por ventas
      
      // Verificar si es frecuente (más de 10 ventas)
      if (salesCount > 10) {
        isFrequent = true;
        score += 20;
      }
      
      // Verificar si es reciente (vendido en los últimos 7 días)
      if (stats.lastSold) {
        const daysSinceLastSale = Math.floor(
          (Date.now() - new Date(stats.lastSold).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceLastSale <= 7) {
          isRecent = true;
          score += 30;
        }
      }
    }

    // Puntuación por stock disponible
    if (product.stock > 0) {
      score += 10;
    } else {
      score -= 50; // Penalizar productos sin stock
    }

    // Puntuación por historial del cliente actual
    if (currentCustomer) {
      const customerStat = customerStats.get(currentCustomer.id);
      if (customerStat?.favoriteProducts.includes(product.id)) {
        score += 40;
        reason = 'Producto favorito del cliente';
      }
    }

    // Determinar razón principal
    if (!reason) {
      if (isFrequent && isRecent) {
        reason = 'Popular y vendido recientemente';
      } else if (isFrequent) {
        reason = 'Producto más vendido';
      } else if (isRecent) {
        reason = 'Vendido recientemente';
      } else if (nameMatch) {
        reason = 'Coincidencia en nombre';
      } else if (codeMatch) {
        reason = 'Coincidencia en código';
      } else {
        reason = 'Disponible en inventario';
      }
    }

    return {
      item: {
        ...product,
        salesCount: stats?.salesCount || 0,
        lastSold: stats?.lastSold
      },
      score,
      reason,
      isRecent,
      isFrequent
    };
  }, [productStats, currentCustomer, customerStats]);

  // Función de scoring para clientes
  const scoreCustomer = useCallback((customer: Customer, query: string): AutocompleteResult<Customer> => {
    const stats = customerStats.get(customer.id);
    let score = 0;
    let reason = '';
    let isRecent = false;
    let isFrequent = false;

    // Puntuación por coincidencia de texto
    const nameMatch = customer.name.toLowerCase().includes(query.toLowerCase());
    const documentMatch = customer.document.includes(query);
    const emailMatch = customer.email.toLowerCase().includes(query.toLowerCase());
    const phoneMatch = customer.phone.includes(query);
    
    if (nameMatch) score += 100;
    if (documentMatch) score += 90;
    if (emailMatch) score += 70;
    if (phoneMatch) score += 60;

    // Puntuación por historial de compras
    if (stats) {
      const purchaseCount = stats.totalPurchases || 0;
      score += Math.min(purchaseCount * 5, 50); // Máximo 50 puntos por compras
      
      // Verificar si es cliente frecuente (más de 5 compras)
      if (purchaseCount > 5) {
        isFrequent = true;
        score += 25;
      }
      
      // Verificar si compró recientemente (últimos 30 días)
      if (stats.lastPurchase) {
        const daysSinceLastPurchase = Math.floor(
          (Date.now() - new Date(stats.lastPurchase).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceLastPurchase <= 30) {
          isRecent = true;
          score += 20;
        }
      }
    }

    // Determinar razón principal
    if (isFrequent && isRecent) {
      reason = 'Cliente frecuente y reciente';
    } else if (isFrequent) {
      reason = 'Cliente frecuente';
    } else if (isRecent) {
      reason = 'Compra reciente';
    } else if (nameMatch) {
      reason = 'Coincidencia en nombre';
    } else if (documentMatch) {
      reason = 'Coincidencia en documento';
    } else {
      reason = 'Cliente registrado';
    }

    return {
      item: {
        ...customer,
        lastPurchase: stats?.lastPurchase,
        totalPurchases: stats?.totalPurchases || 0,
        favoriteProducts: stats?.favoriteProducts || []
      },
      score,
      reason,
      isRecent,
      isFrequent
    };
  }, [customerStats]);

  // Búsqueda de productos con debounce
  const debouncedProductSearch = useMemo(
    () => debounce((query: string) => {
      setIsProductLoading(true);
      
      setTimeout(() => {
        setIsProductLoading(false);
      }, 300); // Simular delay de API
    }, 300),
    []
  );

  // Búsqueda de clientes con debounce
  const debouncedCustomerSearch = useMemo(
    () => debounce((query: string) => {
      setIsCustomerLoading(true);
      
      setTimeout(() => {
        setIsCustomerLoading(false);
      }, 300); // Simular delay de API
    }, 300),
    []
  );

  // Resultados de productos filtrados y ordenados
  const productResults = useMemo(() => {
    if (!productQuery.trim()) {
      // Sin query, mostrar productos más populares
      return products
        .map(product => scoreProduct(product, ''))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    }

    return products
      .map(product => scoreProduct(product, productQuery))
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [products, productQuery, scoreProduct]);

  // Resultados de clientes filtrados y ordenados
  const customerResults = useMemo(() => {
    if (!customerQuery.trim()) {
      // Sin query, mostrar clientes más frecuentes
      return customers
        .map(customer => scoreCustomer(customer, ''))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    }

    return customers
      .map(customer => scoreCustomer(customer, customerQuery))
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [customers, customerQuery, scoreCustomer]);

  // Sugerencias de productos basadas en el cliente actual
  const customerProductSuggestions = useMemo(() => {
    if (!currentCustomer) return [];
    
    const stats = customerStats.get(currentCustomer.id);
    if (!stats?.favoriteProducts.length) return [];
    
    // Contar frecuencia de productos favoritos
    const productFrequency = new Map<number, number>();
    stats.favoriteProducts.forEach(productId => {
      productFrequency.set(productId, (productFrequency.get(productId) || 0) + 1);
    });
    
    // Obtener productos más frecuentes
    return Array.from(productFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([productId]) => products.find(p => p.id === productId))
      .filter(Boolean) as Product[];
  }, [currentCustomer, customerStats, products]);

  // Efectos para activar debounce
  useEffect(() => {
    if (productQuery) {
      debouncedProductSearch(productQuery);
    }
  }, [productQuery, debouncedProductSearch]);

  useEffect(() => {
    if (customerQuery) {
      debouncedCustomerSearch(customerQuery);
    }
  }, [customerQuery, debouncedCustomerSearch]);

  return {
    // Estados de búsqueda
    productQuery,
    setProductQuery,
    customerQuery,
    setCustomerQuery,
    isProductLoading,
    isCustomerLoading,
    
    // Resultados
    productResults,
    customerResults,
    customerProductSuggestions,
    
    // Estadísticas
    productStats,
    customerStats
  };
}