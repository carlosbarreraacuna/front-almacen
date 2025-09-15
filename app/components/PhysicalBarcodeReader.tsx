'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserMultiFormatReader, Result, NotFoundException } from '@zxing/library';
import { Camera, X, Scan, AlertCircle, CheckCircle, Settings, Zap } from 'lucide-react';

interface PhysicalBarcodeReaderProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: PhysicalScanResult) => void;
  mode?: 'product' | 'invoice' | 'customer' | 'coupon' | 'inventory' | 'auth';
  title?: string;
  continuous?: boolean;
}

export interface PhysicalScanResult {
  data: string;
  format: string;
  type: 'QR' | 'EAN' | 'CODE128' | 'CODE39' | 'DATAMATRIX' | 'PDF417' | 'AZTEC';
  timestamp: number;
  confidence?: number;
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

const PhysicalBarcodeReader: React.FC<PhysicalBarcodeReaderProps> = ({
  isOpen,
  onClose,
  onScan,
  mode = 'product',
  title,
  continuous = false
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [scanHistory, setScanHistory] = useState<PhysicalScanResult[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar el lector ZXing
  useEffect(() => {
    if (isOpen) {
      initializeReader();
    } else {
      cleanup();
    }

    return () => cleanup();
  }, [isOpen]);

  // Obtener dispositivos de cámara disponibles
  const getVideoDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      
      // Seleccionar la cámara trasera por defecto si está disponible
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      
      if (backCamera) {
        setSelectedDevice(backCamera.deviceId);
      } else if (videoDevices.length > 0) {
        setSelectedDevice(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Error getting video devices:', err);
      setError('No se pudieron obtener las cámaras disponibles');
    }
  };

  const initializeReader = async () => {
    try {
      setError(null);
      await getVideoDevices();
      
      // Crear instancia del lector ZXing
      readerRef.current = new BrowserMultiFormatReader();
      
      // Configurar hints para mejor rendimiento
      const hints = new Map();
      hints.set(2, true); // PURE_BARCODE
      hints.set(3, true); // POSSIBLE_FORMATS
      
      readerRef.current.setHints(hints);
      
    } catch (err) {
      console.error('Error initializing reader:', err);
      setError('Error al inicializar el lector de códigos');
    }
  };

  const startScanning = async () => {
    if (!readerRef.current || !videoRef.current) return;

    try {
      setIsScanning(true);
      setError(null);

      // Configurar constraints de video para mejor calidad
      const constraints = {
        video: {
          deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          facingMode: selectedDevice ? undefined : { ideal: 'environment' },
          focusMode: 'continuous',
          exposureMode: 'continuous',
          whiteBalanceMode: 'continuous'
        }
      };

      // Obtener stream de video
      streamRef.current = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.current.srcObject = streamRef.current;
      
      await videoRef.current.play();

      // Iniciar decodificación continua
      readerRef.current.decodeFromVideoDevice(
        selectedDevice || undefined,
        videoRef.current,
        (result: Result | null, error?: Error) => {
          if (result) {
            handleScanSuccess(result);
          } else if (error && !(error instanceof NotFoundException)) {
            console.warn('Scan error:', error);
          }
        }
      );

    } catch (err) {
      console.error('Error starting scan:', err);
      setError('Error al acceder a la cámara. Verifique los permisos.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    
    if (readerRef.current) {
      readerRef.current.reset();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
  };

  const cleanup = () => {
    stopScanning();
    if (readerRef.current) {
      readerRef.current = null;
    }
  };

  const handleScanSuccess = useCallback((result: Result) => {
    const scannedData = result.getText();
    
    // Evitar escaneos duplicados rápidos
    if (lastScan === scannedData) {
      return;
    }
    
    setLastScan(scannedData);
    setScanCount(prev => prev + 1);

    // Determinar el tipo de código basado en el formato
    let type: PhysicalScanResult['type'] = 'CODE128';
    const format = result.getBarcodeFormat();
    
    switch (format.toString()) {
      case 'QR_CODE':
        type = 'QR';
        break;
      case 'EAN_13':
      case 'EAN_8':
        type = 'EAN';
        break;
      case 'CODE_128':
        type = 'CODE128';
        break;
      case 'CODE_39':
        type = 'CODE39';
        break;
      case 'DATA_MATRIX':
        type = 'DATAMATRIX';
        break;
      case 'PDF_417':
        type = 'PDF417';
        break;
      case 'AZTEC':
        type = 'AZTEC';
        break;
    }

    // Parsear datos según el modo
    const parsedData = parseScannedData(scannedData, mode);

    const scanResult: PhysicalScanResult = {
      data: scannedData,
      format: format.toString(),
      type,
      timestamp: Date.now(),
      parsedData
    };

    // Agregar al historial
    setScanHistory(prev => [scanResult, ...prev.slice(0, 9)]);

    // Llamar callback
    onScan(scanResult);

    // Si no es continuo, cerrar después del escaneo
    if (!continuous) {
      scanTimeoutRef.current = setTimeout(() => {
        onClose();
      }, 1500);
    }
  }, [lastScan, mode, onScan, continuous, onClose]);

  const parseScannedData = (data: string, scanMode: string) => {
    const parsed: any = {};

    switch (scanMode) {
      case 'product':
        // Detectar códigos de producto
        if (data.length === 13 && /^\d+$/.test(data)) {
          parsed.gtin = data;
          parsed.productCode = data;
        } else if (data.startsWith('01')) {
          // Código GS1
          parsed.gtin = data.substring(2, 16);
          parsed.productCode = parsed.gtin;
        }
        break;
        
      case 'invoice':
        // Detectar CUFE o datos de factura
        if (data.length === 96) {
          parsed.cufe = data;
        }
        break;
        
      case 'customer':
        // Detectar ID de cliente
        parsed.customerId = data;
        break;
        
      case 'coupon':
        // Detectar ID de cupón
        parsed.couponId = data;
        break;
        
      case 'auth':
        // Código de autorización
        parsed.authCode = data;
        break;
    }

    return parsed;
  };

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDevice(deviceId);
    if (isScanning) {
      stopScanning();
      setTimeout(() => startScanning(), 500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <h2 className="text-lg font-semibold">
              {title || 'Lector Físico de Códigos'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Selector de cámara */}
          {devices.length > 1 && (
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-gray-500" />
              <select
                value={selectedDevice}
                onChange={(e) => handleDeviceChange(e.target.value)}
                className="flex-1 p-2 border rounded-lg text-sm"
              >
                {devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Cámara ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Video container */}
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            
            {/* Overlay de escaneo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-red-500 w-64 h-64 relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-red-500"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-red-500"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-red-500"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-red-500"></div>
                
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-1 bg-red-500 animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Controles */}
          <div className="flex justify-center space-x-4">
            {!isScanning ? (
              <button
                onClick={startScanning}
                className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Camera className="w-5 h-5" />
                <span>Iniciar Escaneo</span>
              </button>
            ) : (
              <button
                onClick={stopScanning}
                className="flex items-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                <X className="w-5 h-5" />
                <span>Detener</span>
              </button>
            )}
          </div>

          {/* Estado y estadísticas */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-gray-600">Estado</div>
              <div className="font-semibold flex items-center space-x-1">
                {isScanning ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">Escaneando</span>
                  </>
                ) : (
                  <>
                    <Scan className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Detenido</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-gray-600">Escaneos</div>
              <div className="font-semibold text-blue-600">{scanCount}</div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Último escaneo */}
          {lastScan && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-green-700 font-medium mb-1">Último escaneo:</div>
              <div className="text-sm text-green-600 font-mono break-all">{lastScan}</div>
            </div>
          )}

          {/* Historial reciente */}
          {scanHistory.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700">Historial reciente:</h3>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {scanHistory.slice(0, 5).map((scan, index) => (
                  <div key={index} className="text-xs bg-gray-50 p-2 rounded border">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-gray-600">{scan.data.slice(0, 20)}...</span>
                      <span className="text-gray-500">{scan.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instrucciones */}
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>• Apunte la cámara hacia el código de barras o QR</p>
            <p>• Mantenga el dispositivo estable para mejor lectura</p>
            <p>• Asegúrese de tener buena iluminación</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhysicalBarcodeReader;