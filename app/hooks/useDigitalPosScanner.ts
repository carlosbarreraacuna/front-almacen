'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ScannerConfig } from '../components/DigitalPosScannerConfig';

interface ScannedProduct {
  barcode: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  batch?: string;
  expiryDate?: string;
  manufacturingDate?: string;
  weight?: number;
  unit?: string;
}

interface GS1Data {
  gtin: string;
  batch?: string;
  expiryDate?: string;
  serialNumber?: string;
  weight?: number;
  price?: number;
  manufacturingDate?: string;
}

interface ScanResult {
  success: boolean;
  product?: ScannedProduct;
  error?: string;
  rawData: string;
  timestamp: Date;
  scanType: 'barcode' | 'qr' | 'gs1';
}

interface DigitalPosScannerHook {
  // Estado del escáner
  isConnected: boolean;
  isScanning: boolean;
  lastScanResult: ScanResult | null;
  scanHistory: ScanResult[];
  
  // Configuración
  config: ScannerConfig | null;
  setConfig: (config: ScannerConfig) => void;
  
  // Funciones principales
  connect: () => Promise<boolean>;
  disconnect: () => void;
  startScanning: () => void;
  stopScanning: () => void;
  scanSingle: () => Promise<ScanResult | null>;
  
  // Funciones de utilidad
  clearHistory: () => void;
  addToCart: (product: ScannedProduct, quantity?: number) => void;
  parseGS1: (data: string) => GS1Data | null;
  
  // Estados de error
  error: string | null;
  clearError: () => void;
}

const useDigitalPosScanner = (): DigitalPosScannerHook => {
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [config, setConfigState] = useState<ScannerConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const scannerRef = useRef<any>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cargar configuración desde localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('digitalpos-scanner-config');
    if (savedConfig) {
      try {
        setConfigState(JSON.parse(savedConfig));
      } catch (err) {
        console.error('Error loading scanner config:', err);
      }
    }
  }, []);

  // Guardar configuración en localStorage
  const setConfig = useCallback((newConfig: ScannerConfig) => {
    setConfigState(newConfig);
    localStorage.setItem('digitalpos-scanner-config', JSON.stringify(newConfig));
  }, []);

  // Parsear datos GS1
  const parseGS1 = useCallback((data: string): GS1Data | null => {
    try {
      const gs1Data: GS1Data = { gtin: '' };
      
      // Patrones GS1 comunes
      const patterns = {
        gtin: /\(01\)(\d{14})/,
        batch: /\(10\)([^\(]+)/,
        expiryDate: /\(17\)(\d{6})/,
        serialNumber: /\(21\)([^\(]+)/,
        weight: /\(3102\)(\d{6})/,
        price: /\(3922\)(\d+)/,
        manufacturingDate: /\(11\)(\d{6})/
      };

      // Extraer GTIN (obligatorio)
      const gtinMatch = data.match(patterns.gtin);
      if (!gtinMatch) return null;
      gs1Data.gtin = gtinMatch[1];

      // Extraer datos opcionales
      const batchMatch = data.match(patterns.batch);
      if (batchMatch) gs1Data.batch = batchMatch[1];

      const expiryMatch = data.match(patterns.expiryDate);
      if (expiryMatch) {
        const dateStr = expiryMatch[1];
        gs1Data.expiryDate = `20${dateStr.substring(0, 2)}-${dateStr.substring(2, 4)}-${dateStr.substring(4, 6)}`;
      }

      const serialMatch = data.match(patterns.serialNumber);
      if (serialMatch) gs1Data.serialNumber = serialMatch[1];

      const weightMatch = data.match(patterns.weight);
      if (weightMatch) gs1Data.weight = parseInt(weightMatch[1]) / 1000; // Convertir a kg

      const priceMatch = data.match(patterns.price);
      if (priceMatch) gs1Data.price = parseInt(priceMatch[1]) / 100; // Convertir a unidades monetarias

      const mfgDateMatch = data.match(patterns.manufacturingDate);
      if (mfgDateMatch) {
        const dateStr = mfgDateMatch[1];
        gs1Data.manufacturingDate = `20${dateStr.substring(0, 2)}-${dateStr.substring(2, 4)}-${dateStr.substring(4, 6)}`;
      }

      return gs1Data;
    } catch (err) {
      console.error('Error parsing GS1 data:', err);
      return null;
    }
  }, []);

  // Buscar producto por código de barras
  const fetchProductByBarcode = useCallback(async (barcode: string): Promise<ScannedProduct | null> => {
    try {
      const response = await fetch(`/api/products/barcode/${barcode}`);
      if (!response.ok) {
        throw new Error('Producto no encontrado');
      }
      return await response.json();
    } catch (err) {
      console.error('Error fetching product:', err);
      return null;
    }
  }, []);

  // Procesar resultado de escaneo
  const processScanResult = useCallback(async (rawData: string): Promise<ScanResult> => {
    const timestamp = new Date();
    
    try {
      let scanType: 'barcode' | 'qr' | 'gs1' = 'barcode';
      let barcode = rawData.trim();
      let product: ScannedProduct | null = null;

      // Detectar tipo de código
      if (rawData.includes('(01)')) {
        scanType = 'gs1';
        const gs1Data = parseGS1(rawData);
        if (gs1Data) {
          barcode = gs1Data.gtin;
          product = await fetchProductByBarcode(barcode);
          
          // Enriquecer producto con datos GS1
          if (product && gs1Data) {
            product = {
              ...product,
              batch: gs1Data.batch,
              expiryDate: gs1Data.expiryDate,
              manufacturingDate: gs1Data.manufacturingDate,
              weight: gs1Data.weight
            };
          }
        }
      } else if (rawData.startsWith('http') || rawData.length > 50) {
        scanType = 'qr';
        // Para QR, intentar extraer código de barras si está en la URL
        const barcodeMatch = rawData.match(/barcode=([\d]+)/);
        if (barcodeMatch) {
          barcode = barcodeMatch[1];
          product = await fetchProductByBarcode(barcode);
        }
      } else {
        // Código de barras estándar
        product = await fetchProductByBarcode(barcode);
      }

      const result: ScanResult = {
        success: !!product,
        product: product || undefined,
        error: product ? undefined : 'Producto no encontrado',
        rawData,
        timestamp,
        scanType
      };

      setLastScanResult(result);
      setScanHistory(prev => [result, ...prev.slice(0, 49)]); // Mantener últimos 50
      
      return result;
    } catch (err) {
      const result: ScanResult = {
        success: false,
        error: err instanceof Error ? err.message : 'Error desconocido',
        rawData,
        timestamp,
        scanType: 'barcode'
      };
      
      setLastScanResult(result);
      setScanHistory(prev => [result, ...prev.slice(0, 49)]);
      
      return result;
    }
  }, [parseGS1, fetchProductByBarcode]);

  // Conectar al escáner
  const connect = useCallback(async (): Promise<boolean> => {
    if (!config) {
      setError('Configuración del escáner no encontrada');
      return false;
    }

    try {
      setError(null);
      
      // Simular conexión (en implementación real, aquí iría la lógica de conexión)
      if (config.connectionType === 'usb') {
        // Intentar conectar por USB
        if ('serial' in navigator) {
          const port = await (navigator as any).serial.requestPort();
          await port.open({ baudRate: config.baudRate });
          scannerRef.current = port;
        } else {
          throw new Error('Web Serial API no soportada');
        }
      } else if (config.connectionType === 'bluetooth') {
        // Intentar conectar por Bluetooth
        if ('bluetooth' in navigator) {
          const device = await (navigator as any).bluetooth.requestDevice({
            filters: [{ services: ['battery_service'] }]
          });
          scannerRef.current = device;
        } else {
          throw new Error('Web Bluetooth API no soportada');
        }
      }
      
      setIsConnected(true);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMessage);
      setIsConnected(false);
      return false;
    }
  }, [config]);

  // Desconectar del escáner
  const disconnect = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    if (scannerRef.current) {
      try {
        if (config?.connectionType === 'usb' && scannerRef.current.close) {
          scannerRef.current.close();
        }
      } catch (err) {
        console.error('Error disconnecting scanner:', err);
      }
      scannerRef.current = null;
    }
    
    setIsConnected(false);
    setIsScanning(false);
    setError(null);
  }, [config]);

  // Iniciar escaneo continuo
  const startScanning = useCallback(() => {
    if (!isConnected || !config) {
      setError('Escáner no conectado');
      return;
    }

    setIsScanning(true);
    setError(null);

    if (config.scanMode === 'continuous') {
      scanIntervalRef.current = setInterval(async () => {
        // Simular lectura de datos del escáner
        // En implementación real, aquí se leería del puerto serie/bluetooth
        const mockData = generateMockScanData();
        if (mockData) {
          await processScanResult(mockData);
        }
      }, config.scanDelay);
    }
  }, [isConnected, config, processScanResult]);

  // Detener escaneo
  const stopScanning = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Escaneo individual
  const scanSingle = useCallback(async (): Promise<ScanResult | null> => {
    if (!isConnected) {
      setError('Escáner no conectado');
      return null;
    }

    try {
      setError(null);
      
      // Simular lectura individual
      const mockData = generateMockScanData();
      if (mockData) {
        return await processScanResult(mockData);
      }
      
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de escaneo';
      setError(errorMessage);
      return null;
    }
  }, [isConnected, processScanResult]);

  // Agregar producto al carrito
  const addToCart = useCallback((product: ScannedProduct, quantity: number = 1) => {
    try {
      // Obtener carrito actual
      const currentCart = JSON.parse(localStorage.getItem('shopping-cart') || '[]');
      
      // Buscar si el producto ya existe
      const existingIndex = currentCart.findIndex((item: any) => item.barcode === product.barcode);
      
      if (existingIndex >= 0) {
        // Actualizar cantidad
        currentCart[existingIndex].quantity += quantity;
      } else {
        // Agregar nuevo producto
        currentCart.push({
          ...product,
          quantity,
          addedAt: new Date().toISOString()
        });
      }
      
      // Guardar carrito actualizado
      localStorage.setItem('shopping-cart', JSON.stringify(currentCart));
      
      // Emitir evento personalizado para notificar cambios
      window.dispatchEvent(new CustomEvent('cart-updated', { detail: currentCart }));
      
      // Reproducir sonido de confirmación si está habilitado
      if (config?.beepEnabled) {
        playBeep(config.beepVolume, config.beepDuration);
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError('Error al agregar producto al carrito');
    }
  }, [config]);

  // Limpiar historial
  const clearHistory = useCallback(() => {
    setScanHistory([]);
    setLastScanResult(null);
  }, []);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
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
    clearHistory,
    addToCart,
    parseGS1,
    error,
    clearError
  };
};

// Función auxiliar para generar datos de prueba
function generateMockScanData(): string | null {
  const mockBarcodes = [
    '7501234567890',
    '(01)07501234567890(17)251231(10)ABC123',
    '1234567890123',
    'https://example.com/product?barcode=7501234567890',
    '(01)01234567890123(21)SERIAL123(17)251231'
  ];
  
  // 30% de probabilidad de escaneo exitoso (para simulación)
  return Math.random() > 0.7 ? mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)] : null;
}

// Función auxiliar para reproducir sonido
function playBeep(volume: number, duration: number) {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // Frecuencia del beep
    gainNode.gain.value = volume / 10; // Volumen normalizado
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration / 1000);
  } catch (err) {
    console.error('Error playing beep:', err);
  }
}

export default useDigitalPosScanner;
export type { ScannedProduct, GS1Data, ScanResult, DigitalPosScannerHook };