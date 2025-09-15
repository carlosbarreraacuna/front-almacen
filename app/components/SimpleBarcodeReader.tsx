'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Scan, CheckCircle } from 'lucide-react';

interface SimpleBarcodeReaderProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

const SimpleBarcodeReader: React.FC<SimpleBarcodeReaderProps> = ({
  isOpen,
  onClose,
  onScan
}) => {
  const [isListening, setIsListening] = useState(false);
  const [lastScan, setLastScan] = useState<string>('');
  const [scanCount, setScanCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');

  // Auto-focus cuando se abre y está escuchando
  useEffect(() => {
    if (isOpen && isListening && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isListening]);

  // Mantener el foco en el input
  useEffect(() => {
    if (isOpen && isListening) {
      const interval = setInterval(() => {
        if (inputRef.current && document.activeElement !== inputRef.current) {
          inputRef.current.focus();
        }
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [isOpen, isListening]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const scannedData = inputValue.trim();
      
      if (scannedData.length > 0) {
        console.log('Código escaneado:', scannedData);
        setLastScan(scannedData);
        setScanCount(prev => prev + 1);
        onScan(scannedData);
        setInputValue(''); // Limpiar el input
      }
    }
  };

  const startListening = () => {
    setIsListening(true);
    setInputValue('');
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const stopListening = () => {
    setIsListening(false);
    setInputValue('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Lector de Códigos de Barras
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Input principal */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Campo de escaneo:
              </label>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Escanee un código de barras..." : "Presione 'Iniciar' para comenzar"}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!isListening}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>

            {/* Estado actual */}
            <div className="flex items-center space-x-2 text-sm">
              {isListening ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">Listo para escanear</span>
                </>
              ) : (
                <>
                  <Scan className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Detenido</span>
                </>
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
                <Scan className="w-5 h-5" />
                <span>Iniciar</span>
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

          {/* Estadísticas */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-gray-600">Escaneos</div>
              <div className="font-semibold text-blue-600">{scanCount}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-gray-600">Estado</div>
              <div className="font-semibold">
                {isListening ? (
                  <span className="text-green-600">Activo</span>
                ) : (
                  <span className="text-gray-600">Inactivo</span>
                )}
              </div>
            </div>
          </div>

          {/* Último escaneo */}
          {lastScan && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-green-700 font-medium mb-1">Último escaneo:</div>
              <div className="text-sm text-green-600 font-mono break-all">{lastScan}</div>
            </div>
          )}

          {/* Instrucciones */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-blue-700 font-medium mb-1">Instrucciones:</div>
            <div className="text-sm text-blue-600 space-y-1">
              <p>1. Presione "Iniciar" para activar el lector</p>
              <p>2. Asegúrese de que el campo esté enfocado</p>
              <p>3. Escanee el código de barras</p>
              <p>4. El código aparecerá automáticamente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleBarcodeReader;