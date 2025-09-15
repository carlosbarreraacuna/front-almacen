'use client';

import { useState, useCallback, useRef } from 'react';
import { KeyboardScanResult } from '../components/KeyboardBarcodeReader';

interface UseKeyboardBarcodeReaderProps {
  onProductScan?: (data: KeyboardScanResult) => void;
  onInvoiceScan?: (data: KeyboardScanResult) => void;
  onCustomerScan?: (data: KeyboardScanResult) => void;
  onCouponScan?: (data: KeyboardScanResult) => void;
  onAuthScan?: (data: KeyboardScanResult) => void;
  onInventoryScan?: (data: KeyboardScanResult) => void;
  continuous?: boolean;
  autoClose?: boolean;
  scanDelay?: number;
}

interface KeyboardReaderState {
  isOpen: boolean;
  mode: 'product' | 'invoice' | 'customer' | 'coupon' | 'inventory' | 'auth';
  title: string;
  continuous: boolean;
}

export const useKeyboardBarcodeReader = ({
  onProductScan,
  onInvoiceScan,
  onCustomerScan,
  onCouponScan,
  onAuthScan,
  onInventoryScan,
  continuous = false,
  autoClose = true,
  scanDelay = 1000
}: UseKeyboardBarcodeReaderProps = {}) => {
  const [readerState, setReaderState] = useState<KeyboardReaderState>({
    isOpen: false,
    mode: 'product',
    title: 'Lector de Códigos por Teclado',
    continuous
  });

  const [scanHistory, setScanHistory] = useState<KeyboardScanResult[]>([]);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const lastScanRef = useRef<string>('');

  const openReader = useCallback((mode: KeyboardReaderState['mode'], title?: string, isContinuous?: boolean) => {
    setReaderState({
      isOpen: true,
      mode,
      title: title || getTitleForMode(mode),
      continuous: isContinuous ?? continuous
    });
  }, [continuous]);

  const closeReader = useCallback(() => {
    setReaderState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const getTitleForMode = (mode: string): string => {
    switch (mode) {
      case 'product': return 'Escanear Producto - Lector Teclado';
      case 'invoice': return 'Escanear Factura - Lector Teclado';
      case 'customer': return 'Escanear Cliente - Lector Teclado';
      case 'coupon': return 'Escanear Cupón - Lector Teclado';
      case 'inventory': return 'Escanear Inventario - Lector Teclado';
      case 'auth': return 'Autorización de Supervisor - Lector Teclado';
      default: return 'Lector de Códigos por Teclado';
    }
  };

  const handleScan = useCallback((result: KeyboardScanResult) => {
    const now = Date.now();
    
    // Evitar escaneos duplicados muy rápidos
    if (now - lastScanTime < scanDelay && lastScanRef.current === result.data) {
      return;
    }

    setLastScanTime(now);
    lastScanRef.current = result.data;

    // Agregar al historial
    setScanHistory(prev => {
      const newHistory = [result, ...prev];
      return newHistory.slice(0, 50); // Mantener solo los últimos 50 escaneos
    });

    // Llamar al callback correspondiente según el modo
    switch (readerState.mode) {
      case 'product':
        if (onProductScan) {
          onProductScan(result);
        }
        break;
      case 'invoice':
        if (onInvoiceScan) {
          onInvoiceScan(result);
        }
        break;
      case 'customer':
        if (onCustomerScan) {
          onCustomerScan(result);
        }
        break;
      case 'coupon':
        if (onCouponScan) {
          onCouponScan(result);
        }
        break;
      case 'inventory':
        if (onInventoryScan) {
          onInventoryScan(result);
        }
        break;
      case 'auth':
        if (onAuthScan) {
          onAuthScan(result);
        }
        break;
    }

    // Cerrar automáticamente si no es continuo
    if (autoClose && !readerState.continuous) {
      setTimeout(() => {
        closeReader();
      }, 1500);
    }
  }, [readerState.mode, lastScanTime, scanDelay, onProductScan, onInvoiceScan, onCustomerScan, onCouponScan, onAuthScan, onInventoryScan, autoClose, readerState.continuous, closeReader]);

  // Funciones de conveniencia para abrir el lector en diferentes modos
  const openProductReader = useCallback((title?: string, isContinuous?: boolean) => {
    openReader('product', title || 'Escanear Producto - Lector Teclado', isContinuous);
  }, [openReader]);

  const openInvoiceReader = useCallback((title?: string, isContinuous?: boolean) => {
    openReader('invoice', title || 'Escanear Factura - Lector Teclado', isContinuous);
  }, [openReader]);

  const openCustomerReader = useCallback((title?: string, isContinuous?: boolean) => {
    openReader('customer', title || 'Escanear Cliente - Lector Teclado', isContinuous);
  }, [openReader]);

  const openCouponReader = useCallback((title?: string, isContinuous?: boolean) => {
    openReader('coupon', title || 'Escanear Cupón - Lector Teclado', isContinuous);
  }, [openReader]);

  const openInventoryReader = useCallback((title?: string, isContinuous?: boolean) => {
    openReader('inventory', title || 'Escanear Inventario - Lector Teclado', isContinuous);
  }, [openReader]);

  const openAuthReader = useCallback((title?: string, isContinuous?: boolean) => {
    openReader('auth', title || 'Autorización de Supervisor - Lector Teclado', isContinuous);
  }, [openReader]);

  // Funciones de utilidad
  const clearHistory = useCallback(() => {
    setScanHistory([]);
  }, []);

  const getLastScan = useCallback(() => {
    return scanHistory[0] || null;
  }, [scanHistory]);

  const getScansByMode = useCallback((mode: string) => {
    return scanHistory.filter(scan => {
      // Inferir el modo basado en los datos parseados
      if (mode === 'product' && scan.parsedData?.productCode) return true;
      if (mode === 'invoice' && scan.parsedData?.cufe) return true;
      if (mode === 'customer' && scan.parsedData?.customerId) return true;
      if (mode === 'coupon' && scan.parsedData?.couponId) return true;
      if (mode === 'auth' && scan.parsedData?.authCode) return true;
      return false;
    });
  }, [scanHistory]);

  const getStatistics = useCallback(() => {
    const totalScans = scanHistory.length;
    const uniqueScans = new Set(scanHistory.map(scan => scan.data)).size;
    
    const lastHour = Date.now() - (60 * 60 * 1000);
    const recentScans = scanHistory.filter(scan => scan.timestamp > lastHour).length;

    return {
      totalScans,
      uniqueScans,
      recentScans,
      averagePerHour: recentScans
    };
  }, [scanHistory]);

  return {
    // Estado
    isOpen: readerState.isOpen,
    mode: readerState.mode,
    title: readerState.title,
    continuous: readerState.continuous,
    scanHistory,
    lastScanTime,

    // Funciones principales
    openReader,
    closeReader,
    handleScan,

    // Funciones de conveniencia
    openProductReader,
    openInvoiceReader,
    openCustomerReader,
    openCouponReader,
    openInventoryReader,
    openAuthReader,

    // Utilidades
    clearHistory,
    getLastScan,
    getScansByMode,
    getStatistics
  };
};

export default useKeyboardBarcodeReader;