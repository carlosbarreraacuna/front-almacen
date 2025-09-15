'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, Scan, AlertCircle, CheckCircle } from 'lucide-react';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: ScanResult) => void;
  mode?: 'product' | 'invoice' | 'customer' | 'coupon' | 'inventory' | 'auth';
  title?: string;
  allowedFormats?: Html5QrcodeSupportedFormats[];
}

export interface ScanResult {
  data: string;
  format: string;
  type: 'QR' | 'EAN' | 'CODE128' | 'CODE39' | 'DATAMATRIX';
  parsedData?: {
    productCode?: string;
    gtin?: string;
    batch?: string;
    expiryDate?: string;
    cufe?: string;
    customerId?: string;
    couponId?: string;
    authCode?: string;
    [key: string]: any;
  };
}

export interface GS1Data {
  gtin?: string;        // (01) Global Trade Item Number
  batch?: string;       // (10) Batch/Lot Number
  expiryDate?: string;  // (17) Expiry Date
  serialNumber?: string; // (21) Serial Number
  quantity?: string;    // (30) Variable Count
  price?: string;       // (392n) Price for Variable Measure
  pricePerUnit?: string; // (8005) Price per unit of measure
  amount?: string;      // (390n) Amount payable - single monetary area
  amountWithCurrency?: { // (391n) Amount payable with ISO currency code
    currency: string;
    amount: string;
  };
  weight?: string;      // (310n-315n) Net weight in kg
  length?: string;      // (311n-315n) Length in meters
  width?: string;       // (312n-315n) Width in meters
  height?: string;      // (313n-315n) Height in meters
  area?: string;        // (314n-315n) Area in square meters
  volume?: string;      // (315n-316n) Volume in liters/cubic meters
  packagingDate?: string; // (13) Packaging date
  bestBefore?: string;  // (15) Best before date
  sellBy?: string;      // (16) Sell by date
  productionDate?: string; // (11) Production date
  variant?: string;     // (20) Product variant
  count?: string;       // (37) Count of trade items
}

const QRScanner: React.FC<QRScannerProps> = ({
  isOpen,
  onClose,
  onScan,
  mode = 'product',
  title,
  allowedFormats
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [multiplier, setMultiplier] = useState<number | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const elementId = 'qr-scanner-container';

  // Configuración por defecto de formatos soportados
  const defaultFormats = [
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.DATA_MATRIX
  ];

  const formats = allowedFormats || defaultFormats;

  useEffect(() => {
    if (isOpen && !isScanning) {
      startScanner().catch((err) => {
        console.error('Error starting scanner:', err);
        setError((err as Error).message || 'Error al inicializar el escáner');
        setIsScanning(false);
      });
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const checkCameraPermissions = async () => {
    try {
      // Verificar si getUserMedia está disponible
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Su navegador no soporta acceso a la cámara');
      }

      // Verificar permisos de cámara
      const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
      
      if (permissions.state === 'denied') {
        throw new Error('Permisos de cámara denegados. Por favor, habilite el acceso a la cámara en la configuración del navegador.');
      }

      // Intentar obtener acceso a la cámara
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop()); // Liberar inmediatamente
      
      return true;
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        throw new Error('Acceso a la cámara denegado. Por favor, permita el acceso a la cámara y recargue la página.');
      } else if (err.name === 'NotFoundError') {
        throw new Error('No se encontró ninguna cámara en este dispositivo.');
      } else if (err.name === 'NotReadableError') {
        throw new Error('La cámara está siendo utilizada por otra aplicación.');
      } else if (err.name === 'OverconstrainedError') {
        throw new Error('No se pudo configurar la cámara con los parámetros solicitados.');
      }
      throw err;
    }
  };

  const startScanner = async () => {
    console.log('🚀 QRScanner - Starting scanner with mode:', mode);
    try {
      setError(null);
      setIsScanning(true);

      // Verificar permisos de cámara antes de inicializar
      await checkCameraPermissions();

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        formatsToSupport: formats,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      };

      scannerRef.current = new Html5QrcodeScanner(elementId, config, false);
      console.log('📷 QRScanner - Scanner instance created, rendering...');
      
      scannerRef.current.render(
        (decodedText, decodedResult) => {
          console.log('🎯 QRScanner - Success callback triggered');
          handleScanSuccess(decodedText, decodedResult);
        },
        (errorMessage) => {
          // Ignorar errores de escaneo continuo
          if (!errorMessage.includes('NotFoundException')) {
            console.warn('QR Scanner error:', errorMessage);
            // Mostrar errores específicos de la cámara
            if (errorMessage.includes('NotAllowedError') || errorMessage.includes('Permission')) {
              setError('Acceso a la cámara denegado. Verifique los permisos del navegador.');
            } else if (errorMessage.includes('NotFoundError')) {
              setError('No se encontró ninguna cámara disponible.');
            } else if (errorMessage.includes('NotReadableError')) {
              setError('La cámara está siendo utilizada por otra aplicación.');
            }
          }
        }
      );
      console.log('✅ QRScanner - Scanner rendered successfully');
    } catch (err) {
      console.error('❌ QRScanner - Error initializing scanner:', err);
      setError((err as Error).message || 'Error al inicializar el escáner');
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.warn('Error al detener el escáner:', err);
      }
    }
    setIsScanning(false);
  };

  const handleScanSuccess = (decodedText: string, decodedResult: any) => {
    console.log('📱 QRScanner - handleScanSuccess called with:', { decodedText, decodedResult, mode });
    
    // Detectar doble escaneo para incrementar cantidad
    if (lastScan === decodedText && mode === 'product') {
      setScanCount(prev => prev + 1);
      // Si es el segundo escaneo del mismo código, incrementar cantidad
      if (scanCount === 0) {
        console.log('🔄 QRScanner - Double scan detected, setting quantity to 2');
        const result = parseScannedData(decodedText, decodedResult);
        result.parsedData = { ...result.parsedData, quantity: 2 };
        console.log('📤 QRScanner - Calling onScan with double scan result:', result);
        onScan(result);
        console.log('✅ QRScanner - Double scan onScan callback executed');
        return;
      }
    } else {
      setLastScan(decodedText);
      setScanCount(0);
    }

    const result = parseScannedData(decodedText, decodedResult);
    console.log('🔄 QRScanner - Parsed scan result:', result);
    
    // Aplicar multiplicador si existe
    if (multiplier && mode === 'product') {
      result.parsedData = { ...result.parsedData, quantity: multiplier };
      setMultiplier(null);
      console.log('🔢 QRScanner - Applied multiplier:', multiplier);
    }

    console.log('📤 QRScanner - Calling onScan with result:', result);
    onScan(result);
    console.log('✅ QRScanner - onScan callback executed');
  };

  const parseScannedData = (data: string, result: any): ScanResult => {
    const format = result.decodedResult?.format || 'UNKNOWN';
    let type: ScanResult['type'] = 'QR';
    let parsedData: ScanResult['parsedData'] = {};

    // Determinar tipo de código
    if (format.includes('QR')) {
      type = 'QR';
      parsedData = parseQRData(data);
    } else if (format.includes('EAN')) {
      type = 'EAN';
      parsedData = parseEANData(data);
    } else if (format.includes('CODE_128')) {
      type = 'CODE128';
      parsedData = parseCode128Data(data);
    } else if (format.includes('CODE_39')) {
      type = 'CODE39';
      parsedData = { productCode: data };
    } else if (format.includes('DATA_MATRIX')) {
      type = 'DATAMATRIX';
      parsedData = parseDataMatrixData(data);
    }

    return {
      data,
      format,
      type,
      parsedData
    };
  };

  const parseQRData = (data: string): ScanResult['parsedData'] => {
    try {
      // Intentar parsear como JSON
      const jsonData = JSON.parse(data);
      return jsonData;
    } catch {
      // Si no es JSON, verificar diferentes formatos
      if (data.startsWith('CUFE:')) {
        return { cufe: data.replace('CUFE:', '') };
      }
      if (data.startsWith('CUSTOMER:')) {
        return { customerId: data.replace('CUSTOMER:', '') };
      }
      if (data.startsWith('COUPON:')) {
        return { couponId: data.replace('COUPON:', '') };
      }
      if (data.startsWith('AUTH:')) {
        return { authCode: data.replace('AUTH:', '') };
      }
      
      // Verificar si es un código GS1
      const gs1Data = parseGS1(data);
      if (gs1Data && Object.keys(gs1Data).length > 0) {
        return gs1Data;
      }
      
      return { productCode: data };
    }
  };

  const parseEANData = (data: string): ScanResult['parsedData'] => {
    return { productCode: data, gtin: data };
  };

  const parseCode128Data = (data: string): ScanResult['parsedData'] => {
    // Verificar si contiene datos GS1
    const gs1Data = parseGS1(data);
    if (gs1Data && Object.keys(gs1Data).length > 0) {
      return gs1Data;
    }
    return { productCode: data };
  };

  const parseDataMatrixData = (data: string): ScanResult['parsedData'] => {
    // Los Data Matrix suelen contener datos GS1
    const gs1Data = parseGS1(data);
    if (gs1Data && Object.keys(gs1Data).length > 0) {
      return gs1Data;
    }
    return { productCode: data };
  };

  const parseGS1 = (data: string): GS1Data | null => {
    const gs1Data: GS1Data = {};
    
    // Función auxiliar para formatear fechas YYMMDD
    const formatDate = (dateStr: string): string => {
      if (dateStr.length === 6) {
        const year = '20' + dateStr.substring(0, 2);
        const month = dateStr.substring(2, 4);
        const day = dateStr.substring(4, 6);
        return `${year}-${month}-${day}`;
      }
      return dateStr;
    };

    // Función auxiliar para formatear precios con decimales
    const formatPrice = (priceStr: string, decimals: number): string => {
      if (decimals === 0) return priceStr;
      const divisor = Math.pow(10, decimals);
      return (parseInt(priceStr) / divisor).toFixed(decimals);
    };

    // Patrones GS1 expandidos
    const patterns = {
      // Identificación básica
      gtin: /\(01\)(\d{14})/,
      batch: /\(10\)([^\(]+)/,
      serialNumber: /\(21\)([^\(]+)/,
      variant: /\(20\)(\d{2})/,
      count: /\(37\)(\d+)/,
      
      // Fechas
      productionDate: /\(11\)(\d{6})/,
      packagingDate: /\(13\)(\d{6})/,
      bestBefore: /\(15\)(\d{6})/,
      sellBy: /\(16\)(\d{6})/,
      expiryDate: /\(17\)(\d{6})/,
      
      // Cantidades y medidas
      quantity: /\(30\)(\d+)/,
      
      // Precios y montos
      pricePerUnit: /\(8005\)(\d{6})/,
    };

    // Procesar patrones básicos
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = data.match(pattern);
      if (match) {
        let value = match[1];
        
        // Formatear fechas
        if (['productionDate', 'packagingDate', 'bestBefore', 'sellBy', 'expiryDate'].includes(key)) {
          value = formatDate(value);
        }
        
        // Formatear precio por unidad (8005) - 6 dígitos con posición decimal implícita
        if (key === 'pricePerUnit') {
          value = formatPrice(value, 2); // Asumimos 2 decimales por defecto
        }
        
        gs1Data[key as keyof GS1Data] = value;
      }
    }

    // Procesar pesos (310n-315n) - Net weight in kg
    const weightMatch = data.match(/\(31(0[0-5])\)(\d{6})/);
    if (weightMatch) {
      const decimals = parseInt(weightMatch[1].charAt(2));
      gs1Data.weight = formatPrice(weightMatch[2], decimals);
    }

    // Procesar longitud (311n-315n) - Length in meters
    const lengthMatch = data.match(/\(31(1[0-5])\)(\d{6})/);
    if (lengthMatch) {
      const decimals = parseInt(lengthMatch[1].charAt(2));
      gs1Data.length = formatPrice(lengthMatch[2], decimals);
    }

    // Procesar ancho (312n-315n) - Width in meters
    const widthMatch = data.match(/\(31(2[0-5])\)(\d{6})/);
    if (widthMatch) {
      const decimals = parseInt(widthMatch[1].charAt(2));
      gs1Data.width = formatPrice(widthMatch[2], decimals);
    }

    // Procesar altura (313n-315n) - Height in meters
    const heightMatch = data.match(/\(31(3[0-5])\)(\d{6})/);
    if (heightMatch) {
      const decimals = parseInt(heightMatch[1].charAt(2));
      gs1Data.height = formatPrice(heightMatch[2], decimals);
    }

    // Procesar área (314n-315n) - Area in square meters
    const areaMatch = data.match(/\(31(4[0-5])\)(\d{6})/);
    if (areaMatch) {
      const decimals = parseInt(areaMatch[1].charAt(2));
      gs1Data.area = formatPrice(areaMatch[2], decimals);
    }

    // Procesar volumen (315n-316n) - Volume in liters
    const volumeMatch = data.match(/\(31(5[0-5])\)(\d{6})/);
    if (volumeMatch) {
      const decimals = parseInt(volumeMatch[1].charAt(2));
      gs1Data.volume = formatPrice(volumeMatch[2], decimals);
    }

    // Procesar monto a pagar - área monetaria única (390n)
    const amountMatch = data.match(/\(390([0-9])\)(\d+)/);
    if (amountMatch) {
      const decimals = parseInt(amountMatch[1]);
      gs1Data.amount = formatPrice(amountMatch[2], decimals);
    }

    // Procesar monto a pagar con código de moneda ISO (391n)
    const amountCurrencyMatch = data.match(/\(391([0-9])\)(\d{3})(\d+)/);
    if (amountCurrencyMatch) {
      const decimals = parseInt(amountCurrencyMatch[1]);
      const currency = amountCurrencyMatch[2];
      const amount = formatPrice(amountCurrencyMatch[3], decimals);
      gs1Data.amountWithCurrency = { currency, amount };
    }

    // Procesar precio para artículo de medida variable - área monetaria única (392n)
    const priceMatch = data.match(/\(392([0-9])\)(\d+)/);
    if (priceMatch) {
      const decimals = parseInt(priceMatch[1]);
      gs1Data.price = formatPrice(priceMatch[2], decimals);
    }

    // Procesar precio para artículo de medida variable con código de moneda ISO (393n)
    const priceCurrencyMatch = data.match(/\(393([0-9])\)(\d{3})(\d+)/);
    if (priceCurrencyMatch) {
      const decimals = parseInt(priceCurrencyMatch[1]);
      const currency = priceCurrencyMatch[2];
      const amount = formatPrice(priceCurrencyMatch[3], decimals);
      // Almacenar como precio con información de moneda
      gs1Data.price = `${amount} ${currency}`;
    }

    return Object.keys(gs1Data).length > 0 ? gs1Data : null;
  };

  const handleMultiplierInput = (num: number) => {
    setMultiplier(num);
  };

  const getModeTitle = () => {
    if (title) return title;
    
    switch (mode) {
      case 'product': return 'Escanear Producto';
      case 'invoice': return 'Escanear Factura';
      case 'customer': return 'Escanear Cliente';
      case 'coupon': return 'Escanear Cupón';
      case 'inventory': return 'Escanear Inventario';
      case 'auth': return 'Autorización';
      default: return 'Escáner QR';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Scan className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">{getModeTitle()}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-700 text-sm font-medium">{error}</span>
              </div>
              {error.includes('Permisos') || error.includes('denegado') || error.includes('Permission') ? (
                <div className="text-xs text-red-600 mt-2">
                  <p className="mb-1"><strong>Cómo habilitar la cámara:</strong></p>
                  <p className="mb-1">• Haga clic en el ícono de cámara en la barra de direcciones</p>
                  <p className="mb-1">• Seleccione "Permitir" para el acceso a la cámara</p>
                  <p>• Recargue la página después de cambiar los permisos</p>
                </div>
              ) : null}
            </div>
          )}

          {/* Multiplicador para productos */}
          {mode === 'product' && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Cantidad rápida:</p>
              <div className="flex space-x-2">
                {[2, 5, 10, 20].map(num => (
                  <button
                    key={num}
                    onClick={() => handleMultiplierInput(num)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      multiplier === num
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    ×{num}
                  </button>
                ))}
                {multiplier && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                    Cantidad: {multiplier}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Scanner Container */}
          <div className="relative">
            <div id={elementId} className="w-full" />
            
            {!isScanning && (
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                <div className="text-center">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Iniciando cámara...</p>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-4 text-sm text-gray-600">
            <p className="mb-1">• Apunta la cámara hacia el código</p>
            <p className="mb-1">• Mantén el código dentro del marco</p>
            {mode === 'product' && (
              <>
                <p className="mb-1">• Doble escaneo incrementa cantidad</p>
                <p>• Usa ×N para multiplicar cantidad</p>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;