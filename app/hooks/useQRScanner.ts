'use client';

import { useState, useCallback } from 'react';
import { ScanResult } from '../components/QRScanner';

interface UseQRScannerProps {
  onProductScan?: (productCode: string, quantity?: number, gs1Data?: any) => void;
  onInvoiceScan?: (cufe: string) => void;
  onCustomerScan?: (customerId: string) => void;
  onCouponScan?: (couponId: string) => void;
  onAuthScan?: (authCode: string) => void;
  onInventoryScan?: (data: any) => void;
}

interface QRScannerState {
  isOpen: boolean;
  mode: 'product' | 'invoice' | 'customer' | 'coupon' | 'inventory' | 'auth';
  title?: string;
}

export const useQRScanner = ({
  onProductScan,
  onInvoiceScan,
  onCustomerScan,
  onCouponScan,
  onAuthScan,
  onInventoryScan
}: UseQRScannerProps = {}) => {
  const [scannerState, setScannerState] = useState<QRScannerState>({
    isOpen: false,
    mode: 'product'
  });

  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [lastScanTime, setLastScanTime] = useState<number>(0);

  const openScanner = useCallback((mode: QRScannerState['mode'], title?: string) => {
    console.log('🚀 useQRScanner - Opening scanner with mode:', mode, 'title:', title);
    setScannerState({
      isOpen: true,
      mode,
      title
    });
    console.log('✅ useQRScanner - Scanner state updated to open');
  }, []);

  const closeScanner = useCallback(() => {
    console.log('🚪 useQRScanner - Closing scanner');
    setScannerState(prev => ({ ...prev, isOpen: false }));
    console.log('✅ useQRScanner - Scanner state updated to closed');
  }, []);

  const handleScan = useCallback((result: ScanResult) => {
    console.log('🎯 useQRScanner - handleScan called with result:', result);
    const now = Date.now();
    
    // Evitar escaneos duplicados muy rápidos (menos de 1 segundo)
    if (now - lastScanTime < 1000 && 
        scanHistory.length > 0 && 
        scanHistory[scanHistory.length - 1].data === result.data) {
      console.log('⚠️ useQRScanner - Duplicate scan detected, ignoring');
      return;
    }

    setLastScanTime(now);
    setScanHistory(prev => [...prev.slice(-9), result]); // Mantener últimos 10 escaneos

    console.log('🔄 useQRScanner - Processing scan for mode:', scannerState.mode);
    // Procesar según el modo
    switch (scannerState.mode) {
      case 'product':
        console.log('🛒 useQRScanner - Calling handleProductScan');
        handleProductScan(result);
        break;
      case 'invoice':
        handleInvoiceScan(result);
        break;
      case 'customer':
        handleCustomerScan(result);
        break;
      case 'coupon':
        handleCouponScan(result);
        break;
      case 'inventory':
        handleInventoryScan(result);
        break;
      case 'auth':
        handleAuthScan(result);
        break;
    }

    // Cerrar scanner después del escaneo exitoso
    console.log('🚪 useQRScanner - Closing scanner after successful scan');
    closeScanner();
  }, [scannerState.mode, lastScanTime, scanHistory, onProductScan, onInvoiceScan, onCustomerScan, onCouponScan, onAuthScan, onInventoryScan]);

  const handleProductScan = (result: ScanResult) => {
    console.log('🔍 useQRScanner - handleProductScan called with result:', result);
    
    if (!onProductScan) {
      console.error('❌ useQRScanner - onProductScan callback is not defined');
      return;
    }

    const productCode = result.parsedData?.productCode || 
                       result.parsedData?.gtin || 
                       result.data;
    
    const quantity = result.parsedData?.quantity || 1;
    
    // Pasar todos los datos GS1 si están disponibles
    const gs1Data = result.parsedData && Object.keys(result.parsedData).length > 0 ? result.parsedData : null;
    
    console.log('📦 useQRScanner - Calling onProductScan with:', { productCode, quantity, gs1Data });
    onProductScan(productCode, quantity, gs1Data);
    console.log('✅ useQRScanner - onProductScan callback executed');
  };

  const handleInvoiceScan = (result: ScanResult) => {
    if (!onInvoiceScan) return;

    const cufe = result.parsedData?.cufe;
    if (cufe) {
      onInvoiceScan(cufe);
    } else {
      // Intentar extraer CUFE del QR de factura
      try {
        const data = JSON.parse(result.data);
        if (data.cufe) {
          onInvoiceScan(data.cufe);
        }
      } catch {
        console.warn('No se pudo extraer CUFE del código escaneado');
      }
    }
  };

  const handleCustomerScan = (result: ScanResult) => {
    if (!onCustomerScan) return;

    const customerId = result.parsedData?.customerId;
    if (customerId) {
      onCustomerScan(customerId);
    } else {
      // Intentar extraer ID de cliente del QR
      try {
        const data = JSON.parse(result.data);
        if (data.customerId || data.id) {
          onCustomerScan(data.customerId || data.id);
        }
      } catch {
        console.warn('No se pudo extraer ID de cliente del código escaneado');
      }
    }
  };

  const handleCouponScan = (result: ScanResult) => {
    if (!onCouponScan) return;

    const couponId = result.parsedData?.couponId;
    if (couponId) {
      onCouponScan(couponId);
    } else {
      // Intentar extraer ID de cupón del QR
      try {
        const data = JSON.parse(result.data);
        if (data.couponId || data.id) {
          onCouponScan(data.couponId || data.id);
        }
      } catch {
        console.warn('No se pudo extraer ID de cupón del código escaneado');
      }
    }
  };

  const handleAuthScan = (result: ScanResult) => {
    if (!onAuthScan) return;

    const authCode = result.parsedData?.authCode;
    if (authCode) {
      onAuthScan(authCode);
    } else {
      // Intentar extraer código de autorización del QR
      try {
        const data = JSON.parse(result.data);
        if (data.authCode || data.code) {
          onAuthScan(data.authCode || data.code);
        }
      } catch {
        console.warn('No se pudo extraer código de autorización del código escaneado');
      }
    }
  };

  const handleInventoryScan = (result: ScanResult) => {
    if (!onInventoryScan) return;

    // Para inventario, pasar todos los datos parseados
    onInventoryScan({
      ...result.parsedData,
      rawData: result.data,
      format: result.format,
      type: result.type
    });
  };

  // Funciones de conveniencia para abrir el scanner en diferentes modos
  const scanProduct = useCallback((title?: string) => {
    openScanner('product', title || 'Escanear Producto');
  }, [openScanner]);

  const scanInvoice = useCallback((title?: string) => {
    openScanner('invoice', title || 'Escanear Factura');
  }, [openScanner]);

  const scanCustomer = useCallback((title?: string) => {
    openScanner('customer', title || 'Escanear Cliente');
  }, [openScanner]);

  const scanCoupon = useCallback((title?: string) => {
    openScanner('coupon', title || 'Escanear Cupón');
  }, [openScanner]);

  const scanInventory = useCallback((title?: string) => {
    openScanner('inventory', title || 'Escanear Inventario');
  }, [openScanner]);

  const scanAuth = useCallback((title?: string) => {
    openScanner('auth', title || 'Autorización de Supervisor');
  }, [openScanner]);

  return {
    // Estado
    isOpen: scannerState.isOpen,
    mode: scannerState.mode,
    title: scannerState.title,
    scanHistory,
    
    // Acciones
    openScanner,
    closeScanner,
    handleScan,
    
    // Funciones de conveniencia
    scanProduct,
    scanInvoice,
    scanCustomer,
    scanCoupon,
    scanInventory,
    scanAuth
  };
};

export default useQRScanner;