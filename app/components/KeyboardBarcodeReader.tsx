'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Scan, AlertCircle, CheckCircle, Keyboard, Zap } from 'lucide-react';

interface KeyboardBarcodeReaderProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: KeyboardScanResult) => void;
  mode?: 'product' | 'invoice' | 'customer' | 'coupon' | 'inventory' | 'auth';
  title?: string;
  continuous?: boolean;
}

export interface KeyboardScanResult {
  data: string;
  timestamp: number;
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

const KeyboardBarcodeReader: React.FC<KeyboardBarcodeReaderProps> = ({
  isOpen,
  onClose,
  onScan,
  mode = 'product',
  title,
  continuous = false
}) => {
  const [isListening, setIsListening] = useState(false);
  const [buffer, setBuffer] = useState('');
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [scanHistory, setScanHistory] = useState<KeyboardScanResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const bufferRef = useRef('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastKeypressTime = useRef<number>(0);
  
  // Configuración para detectar lectores de códigos de barras
  const BARCODE_TIMEOUT = 100; // ms entre caracteres para considerar como código de barras
  const MIN_BARCODE_LENGTH = 4;
  const MAX_BARCODE_LENGTH = 50;

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!isListening) return;
    
    const currentTime = Date.now();
    const timeDiff = currentTime - lastKeypressTime.current;
    
    // Si pasa mucho tiempo entre teclas, reiniciar buffer
    if (timeDiff > BARCODE_TIMEOUT && bufferRef.current.length > 0) {
      bufferRef.current = '';
    }
    
    lastKeypressTime.current = currentTime;
    
    // Detectar Enter (fin de código de barras)
    if (event.key === 'Enter') {
      event.preventDefault();
      
      const scannedData = bufferRef.current.trim();
      
      if (scannedData.length >= MIN_BARCODE_LENGTH && scannedData.length <= MAX_BARCODE_LENGTH) {
        processScan(scannedData);
      }
      
      bufferRef.current = '';
      setBuffer('');
      return;
    }
    
    // Ignorar teclas especiales
    if (event.key.length > 1 && event.key !== 'Backspace') {
      return;
    }
    
    // Manejar Backspace
    if (event.key === 'Backspace') {
      bufferRef.current = bufferRef.current.slice(0, -1);
      setBuffer(bufferRef.current);
      return;
    }
    
    // Agregar carácter al buffer
    if (event.key.length === 1) {
      bufferRef.current += event.key;
      setBuffer(bufferRef.current);
      
      // Limpiar timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Configurar timeout para limpiar buffer si no se completa el código
      timeoutRef.current = setTimeout(() => {
        bufferRef.current = '';
        setBuffer('');
      }, BARCODE_TIMEOUT * 3);
    }
  }, [isListening]);

  const processScan = useCallback((scannedData: string) => {
    // Evitar escaneos duplicados
    if (lastScan === scannedData) {
      return;
    }
    
    setLastScan(scannedData);
    setScanCount(prev => prev + 1);
    setError(null);

    // Parsear datos según el modo
    const parsedData = parseScannedData(scannedData, mode);

    const scanResult: KeyboardScanResult = {
      data: scannedData,
      timestamp: Date.now(),
      parsedData
    };

    // Agregar al historial
    setScanHistory(prev => [scanResult, ...prev.slice(0, 9)]);

    // Llamar callback
    onScan(scanResult);

    // Si no es continuo, cerrar después del escaneo
    if (!continuous) {
      setTimeout(() => {
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
        } else {
          parsed.productCode = data;
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

  const startListening = () => {
    setIsListening(true);
    setError(null);
    bufferRef.current = '';
    setBuffer('');
  };

  const stopListening = () => {
    setIsListening(false);
    bufferRef.current = '';
    setBuffer('');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Ref para el input invisible
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Configurar event listeners
  useEffect(() => {
    if (isOpen && isListening) {
      document.addEventListener('keydown', handleKeyPress);
      
      // Enfocar el input invisible para capturar la entrada del lector
      if (hiddenInputRef.current) {
        hiddenInputRef.current.focus();
      }
      
      return () => {
        document.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [isOpen, isListening, handleKeyPress]);

  // Mantener el foco en el input invisible
  useEffect(() => {
    if (isOpen && isListening && hiddenInputRef.current) {
      const interval = setInterval(() => {
        if (hiddenInputRef.current && document.activeElement !== hiddenInputRef.current) {
          hiddenInputRef.current.focus();
        }
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [isOpen, isListening]);

  // Limpiar al cerrar
  useEffect(() => {
    if (!isOpen) {
      stopListening();
    }
  }, [isOpen]);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center space-x-2">
            <Keyboard className="w-5 h-5" />
            <h2 className="text-lg font-semibold">
              {title || 'Lector de Códigos por Teclado'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Área de entrada */}
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Scan className={`w-8 h-8 ${isListening ? 'text-blue-600 animate-pulse' : 'text-gray-400'}`} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-700">
                  {isListening ? 'Esperando código de barras...' : 'Lector detenido'}
                </h3>
                <p className="text-sm text-gray-500">
                  {isListening 
                    ? 'Escanee un código de barras con su lector físico'
                    : 'Haga clic en "Iniciar" para comenzar a escuchar'
                  }
                </p>
              </div>
              
              {/* Buffer actual */}
              {buffer && (
                <div className="bg-white border rounded-lg p-3 w-full max-w-md">
                  <div className="text-xs text-gray-500 mb-1">Leyendo:</div>
                  <div className="font-mono text-sm text-gray-700 break-all">
                    {buffer}<span className="animate-pulse">|</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controles */}
          <div className="flex justify-center space-x-4">
            {!isListening ? (
              <button
                onClick={startListening}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Keyboard className="w-5 h-5" />
                <span>Iniciar Escucha</span>
              </button>
            ) : (
              <button
                onClick={stopListening}
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
                {isListening ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">Escuchando</span>
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
                      <span className="font-mono text-gray-600">{scan.data.slice(0, 30)}...</span>
                      <span className="text-gray-500">{new Date(scan.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instrucciones */}
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>• Conecte su lector de códigos de barras USB</p>
            <p>• Haga clic en "Iniciar Escucha" y escanee un código</p>
            <p>• El lector debe estar configurado para enviar Enter al final</p>
            <p>• Funciona con lectores que actúan como teclado (HID)</p>
          </div>)}
        </div>
        
        {/* Input invisible para capturar entrada del lector */}
        <input
          ref={hiddenInputRef}
          type="text"
          value={buffer}
          onChange={(e) => {
            const newValue = e.target.value;
            bufferRef.current = newValue;
            setBuffer(newValue);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const scannedData = buffer.trim();
              if (scannedData.length >= MIN_BARCODE_LENGTH) {
                processScan(scannedData);
              }
              bufferRef.current = '';
              setBuffer('');
              e.currentTarget.value = '';
            }
          }}
          style={{
            position: 'absolute',
            left: '-9999px',
            opacity: 0,
            pointerEvents: 'none'
          }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>
    </div>
  );
};

export default KeyboardBarcodeReader;