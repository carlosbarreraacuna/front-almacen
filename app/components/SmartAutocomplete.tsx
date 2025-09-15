'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Star, 
  Clock, 
  TrendingUp, 
  Package, 
  User,
  ChevronDown,
  Loader2
} from 'lucide-react';

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

interface AutocompleteResult<T> {
  item: T;
  score: number;
  reason: string;
  isRecent?: boolean;
  isFrequent?: boolean;
}

interface SmartAutocompleteProps<T> {
  type: 'product' | 'customer';
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  results: AutocompleteResult<T>[];
  isLoading: boolean;
  onSelect: (item: T) => void;
  suggestions?: T[];
  className?: string;
  onEnterSearch?: (searchTerm: string) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Ayer';
  if (diffDays <= 7) return `Hace ${diffDays} días`;
  if (diffDays <= 30) return `Hace ${Math.ceil(diffDays / 7)} semanas`;
  return date.toLocaleDateString('es-CO');
}

function ProductResultItem({ result, onSelect }: { 
  result: AutocompleteResult<Product>; 
  onSelect: (item: Product) => void; 
}) {
  const { item, reason, isRecent, isFrequent } = result;
  
  return (
    <div 
      onClick={() => onSelect(item)}
      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-medium text-gray-900">{item.name}</h4>
            {isFrequent && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                <TrendingUp className="w-3 h-3 mr-1" />
                Popular
              </span>
            )}
            {isRecent && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-800">
                <Clock className="w-3 h-3 mr-1" />
                Reciente
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {item.code} • {item.category}
          </p>
          <p className="text-xs text-gray-400 mt-1">{reason}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-blue-600">
            {formatCurrency(item.price)}
          </p>
          <p className={`text-xs ${
            item.stock > 10 ? 'text-green-600' :
            item.stock > 0 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            Stock: {item.stock}
          </p>
          {item.salesCount && item.salesCount > 0 && (
            <p className="text-xs text-gray-500">
              {item.salesCount} vendidos
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CustomerResultItem({ result, onSelect }: { 
  result: AutocompleteResult<Customer>; 
  onSelect: (item: Customer) => void; 
}) {
  const { item, reason, isRecent, isFrequent } = result;
  
  return (
    <div 
      onClick={() => onSelect(item)}
      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-medium text-gray-900">{item.name}</h4>
            {isFrequent && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-800">
                <Star className="w-3 h-3 mr-1" />
                VIP
              </span>
            )}
            {isRecent && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-800">
                <Clock className="w-3 h-3 mr-1" />
                Activo
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Doc: {item.document} • {item.email}
          </p>
          <p className="text-xs text-gray-400 mt-1">{reason}</p>
        </div>
        <div className="text-right text-sm text-gray-500">
          <p>{item.phone}</p>
          {item.totalPurchases && item.totalPurchases > 0 && (
            <p className="text-xs">
              {item.totalPurchases} compras
            </p>
          )}
          {item.lastPurchase && (
            <p className="text-xs">
              {formatDate(item.lastPurchase)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SuggestionItem<T extends Product | Customer>({ 
  item, 
  type, 
  onSelect 
}: { 
  item: T; 
  type: 'product' | 'customer'; 
  onSelect: (item: T) => void; 
}) {
  if (type === 'product') {
    const product = item as Product;
    return (
      <div 
        onClick={() => onSelect(item)}
        className="p-2 hover:bg-gray-50 cursor-pointer rounded border transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Package className="w-4 h-4 text-gray-400" />
          <div className="flex-1">
            <p className="font-medium text-sm">{product.name}</p>
            <p className="text-xs text-gray-500">{formatCurrency(product.price)}</p>
          </div>
        </div>
      </div>
    );
  } else {
    const customer = item as Customer;
    return (
      <div 
        onClick={() => onSelect(item)}
        className="p-2 hover:bg-gray-50 cursor-pointer rounded border transition-colors"
      >
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-gray-400" />
          <div className="flex-1">
            <p className="font-medium text-sm">{customer.name}</p>
            <p className="text-xs text-gray-500">{customer.document}</p>
          </div>
        </div>
      </div>
    );
  }
}

export default function SmartAutocomplete<T extends Product | Customer>({
  type,
  placeholder,
  value,
  onChange,
  results,
  isLoading,
  onSelect,
  suggestions = [],
  className = '',
  onEnterSearch
}: SmartAutocompleteProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastKeypressTime = useRef<number>(0);
  const scanBuffer = useRef<string>('');
  const scanTimeout = useRef<NodeJS.Timeout | null>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (scanTimeout.current) {
        clearTimeout(scanTimeout.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const currentTime = Date.now();
    const timeDiff = currentTime - lastKeypressTime.current;
    
    // Detectar si es entrada rápida del lector (menos de 50ms entre caracteres)
    const isBarcodeScan = timeDiff < 50 && newValue.length > value.length;
    
    if (isBarcodeScan) {
      // Es un escaneo de código de barras
      scanBuffer.current = newValue;
      
      // Limpiar timeout anterior
      if (scanTimeout.current) {
        clearTimeout(scanTimeout.current);
      }
      
      // Esperar un poco para procesar el código completo
      scanTimeout.current = setTimeout(() => {
        const scannedCode = scanBuffer.current.trim();
        if (scannedCode.length >= 3 && onEnterSearch) {
          console.log('Código detectado automáticamente:', scannedCode);
          onEnterSearch(scannedCode);
          setIsOpen(false);
        }
        scanBuffer.current = '';
      }, 100);
    } else {
      // Entrada manual normal
      setIsOpen(true);
    }
    
    onChange(newValue);
    lastKeypressTime.current = currentTime;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Limpiar cualquier timeout pendiente
      if (scanTimeout.current) {
        clearTimeout(scanTimeout.current);
        scanTimeout.current = null;
      }
      
      const codeToProcess = value.trim();
      if (codeToProcess && onEnterSearch) {
        console.log('Código procesado por Enter:', codeToProcess);
        onEnterSearch(codeToProcess);
        setIsOpen(false);
        
        // Limpiar el campo después de procesar
        setTimeout(() => {
          onChange('');
        }, 100);
      }
    }
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    setIsOpen(true);
  };

  const handleSelect = (item: T) => {
    onSelect(item);
    setIsOpen(false);
    setIsFocused(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const showSuggestions = !value.trim() && suggestions.length > 0;
  const showResults = value.trim() && results.length > 0;
  const showNoResults = value.trim() && results.length === 0 && !isLoading;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            isFocused ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-300'
          }`}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {/* Sugerencias (cuando no hay búsqueda) */}
          {showSuggestions && (
            <div className="p-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Star className="w-4 h-4 mr-1" />
                {type === 'product' ? 'Productos sugeridos' : 'Clientes frecuentes'}
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {suggestions.slice(0, 5).map((item, index) => (
                  <SuggestionItem
                    key={`suggestion-${index}`}
                    item={item}
                    type={type}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Resultados de búsqueda */}
          {showResults && (
            <div>
              <div className="p-2 bg-gray-50 border-b">
                <p className="text-sm text-gray-600">
                  {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
                </p>
              </div>
              {results.map((result, index) => (
                type === 'product' ? (
                  <ProductResultItem
                    key={`result-${index}`}
                    result={result as AutocompleteResult<Product>}
                    onSelect={handleSelect as (item: Product) => void}
                  />
                ) : (
                  <CustomerResultItem
                    key={`result-${index}`}
                    result={result as AutocompleteResult<Customer>}
                    onSelect={handleSelect as (item: Customer) => void}
                  />
                )
              ))}
            </div>
          )}

          {/* Sin resultados */}
          {showNoResults && (
            <div className="p-6 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No se encontraron resultados</p>
              <p className="text-sm">Intenta con otros términos de búsqueda</p>
            </div>
          )}

          {/* Loading */}
          {isLoading && value.trim() && (
            <div className="p-6 text-center">
              <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-blue-500" />
              <p className="text-sm text-gray-500">Buscando...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}