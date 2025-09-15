'use client';

import React, { useState, useRef } from 'react';
import { 
  Package, Download, Printer, Copy, Check, 
  BarChart3, QrCode, Hash, Eye, X, Search,
  Grid, List, Filter, RefreshCw
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  code: string;
  category: string;
  sellByWeight?: boolean;
}

interface BarcodeGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  products?: Product[];
}

interface BarcodeConfig {
  format: 'CODE128' | 'EAN13' | 'CODE39' | 'QR';
  width: number;
  height: number;
  fontSize: number;
  margin: number;
  displayValue: boolean;
  background: string;
  lineColor: string;
}

const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({
  isOpen,
  onClose,
  products = []
}) => {
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [config, setConfig] = useState<BarcodeConfig>({
    format: 'CODE128',
    width: 2,
    height: 100,
    fontSize: 20,
    margin: 10,
    displayValue: true,
    background: '#ffffff',
    lineColor: '#000000'
  });
  const [showConfig, setShowConfig] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Productos con códigos de barras mejorados
  const enhancedProducts: Product[] = [
    { id: 1, name: 'Laptop HP Pavilion', price: 2500000, stock: 5, code: '7701234567890', category: 'Computadores' },
    { id: 2, name: 'Mouse Logitech MX', price: 150000, stock: 20, code: '7701234567891', category: 'Accesorios' },
    { id: 3, name: 'Teclado Mecánico', price: 300000, stock: 15, code: '7701234567892', category: 'Accesorios' },
    { id: 4, name: 'Monitor 24"', price: 800000, stock: 8, code: '7701234567893', category: 'Monitores' },
    { id: 5, name: 'Impresora Canon', price: 450000, stock: 3, code: '7701234567894', category: 'Impresoras' },
    { id: 6, name: 'Arroz Premium', price: 3500, stock: 100, code: '7702001234567', category: 'Alimentos', sellByWeight: true },
    { id: 7, name: 'Carne de Res', price: 25000, stock: 50, code: '7702002345678', category: 'Carnes', sellByWeight: true },
    { id: 8, name: 'Queso Campesino', price: 18000, stock: 30, code: '7702003456789', category: 'Lácteos', sellByWeight: true },
    { id: 9, name: 'Smartphone Samsung', price: 1200000, stock: 12, code: '7701234567895', category: 'Electrónicos' },
    { id: 10, name: 'Tablet iPad', price: 1800000, stock: 7, code: '7701234567896', category: 'Electrónicos' },
    { id: 11, name: 'Auriculares Sony', price: 250000, stock: 25, code: '7701234567897', category: 'Accesorios' },
    { id: 12, name: 'Cámara Canon EOS', price: 3500000, stock: 4, code: '7701234567898', category: 'Fotografía' },
    { id: 13, name: 'Disco Duro 1TB', price: 180000, stock: 18, code: '7701234567899', category: 'Almacenamiento' },
    { id: 14, name: 'Memoria RAM 16GB', price: 320000, stock: 22, code: '7701234567900', category: 'Componentes' },
    { id: 15, name: 'Procesador Intel i7', price: 1500000, stock: 6, code: '7701234567901', category: 'Componentes' }
  ];

  const allProducts = products.length > 0 ? products : enhancedProducts;

  // Generar código de barras usando Canvas
  const generateBarcode = (text: string, format: string = 'CODE128'): string => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Configurar canvas
    canvas.width = 300;
    canvas.height = 150;
    
    // Limpiar canvas
    ctx.fillStyle = config.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Generar patrón de barras simple para CODE128
    if (format === 'CODE128' || format === 'EAN13') {
      const barWidth = config.width;
      const barHeight = config.height;
      const startX = config.margin;
      const startY = config.margin;
      
      ctx.fillStyle = config.lineColor;
      
      // Generar patrón basado en el texto
      let x = startX;
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        const pattern = charCode % 4; // Patrón simple
        
        for (let j = 0; j < 8; j++) {
          if ((pattern >> j) & 1) {
            ctx.fillRect(x, startY, barWidth, barHeight);
          }
          x += barWidth;
        }
      }
      
      // Agregar texto si está habilitado
      if (config.displayValue) {
        ctx.fillStyle = config.lineColor;
        ctx.font = `${config.fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(text, canvas.width / 2, startY + barHeight + config.fontSize + 5);
      }
    } else if (format === 'QR') {
      // Generar QR simple (patrón de cuadrados)
      const qrSize = 20;
      const cellSize = Math.min(canvas.width, canvas.height) / qrSize;
      
      ctx.fillStyle = config.lineColor;
      
      for (let i = 0; i < qrSize; i++) {
        for (let j = 0; j < qrSize; j++) {
          // Patrón pseudo-aleatorio basado en el texto
          const hash = (text.charCodeAt(i % text.length) + i + j) % 3;
          if (hash === 0) {
            ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
          }
        }
      }
    }
    
    return canvas.toDataURL();
  };

  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.code.includes(searchTerm);
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(allProducts.map(p => p.category))];

  const toggleProductSelection = (productId: number) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    setSelectedProducts(filteredProducts.map(p => p.id));
  };

  const clearSelection = () => {
    setSelectedProducts([]);
  };

  const downloadBarcode = (product: Product) => {
    const dataUrl = generateBarcode(product.code, config.format);
    const link = document.createElement('a');
    link.download = `barcode-${product.code}.png`;
    link.href = dataUrl;
    link.click();
  };

  const downloadSelectedBarcodes = () => {
    selectedProducts.forEach(productId => {
      const product = allProducts.find(p => p.id === productId);
      if (product) {
        setTimeout(() => downloadBarcode(product), 100 * productId);
      }
    });
  };

  const copyBarcodeToClipboard = async (product: Product) => {
    try {
      const dataUrl = generateBarcode(product.code, config.format);
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      alert('Código de barras copiado al portapapeles');
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      // Fallback: copiar el código como texto
      await navigator.clipboard.writeText(product.code);
      alert('Código copiado como texto al portapapeles');
    }
  };

  const printBarcodes = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const selectedProductsData = allProducts.filter(p => selectedProducts.includes(p.id));
    
    let printContent = `
      <html>
        <head>
          <title>Códigos de Barras</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .barcode-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
            .barcode-item { border: 1px solid #ddd; padding: 15px; text-align: center; page-break-inside: avoid; }
            .barcode-image { max-width: 100%; height: auto; }
            .product-info { margin-top: 10px; }
            .product-name { font-weight: bold; margin-bottom: 5px; }
            .product-code { font-size: 14px; color: #666; }
            .product-price { font-size: 16px; color: #2563eb; font-weight: bold; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <h1>Códigos de Barras - ${new Date().toLocaleDateString()}</h1>
          <div class="barcode-grid">
    `;

    selectedProductsData.forEach(product => {
      const barcodeDataUrl = generateBarcode(product.code, config.format);
      printContent += `
        <div class="barcode-item">
          <img src="${barcodeDataUrl}" alt="Código de barras" class="barcode-image" />
          <div class="product-info">
            <div class="product-name">${product.name}</div>
            <div class="product-code">${product.code}</div>
            <div class="product-price">$${product.price.toLocaleString()}</div>
          </div>
        </div>
      `;
    });

    printContent += `
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <QrCode className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Generador de Códigos de Barras</h2>
                <p className="text-blue-100">
                  Genera e imprime códigos de barras para tus productos
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowConfig(!showConfig)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                title="Configuración"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex h-[600px]">
          {/* Sidebar - Configuración */}
          {showConfig && (
            <div className="w-80 bg-gray-50 border-r p-4 space-y-4">
              <h3 className="font-semibold text-gray-800">Configuración</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Formato</label>
                <select
                  value={config.format}
                  onChange={(e) => setConfig(prev => ({ ...prev, format: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="CODE128">CODE 128</option>
                  <option value="EAN13">EAN-13</option>
                  <option value="CODE39">CODE 39</option>
                  <option value="QR">QR Code</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ancho de Barra</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={config.width}
                  onChange={(e) => setConfig(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <span className="text-sm text-gray-600">{config.width}px</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Altura</label>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={config.height}
                  onChange={(e) => setConfig(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <span className="text-sm text-gray-600">{config.height}px</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño de Fuente</label>
                <input
                  type="range"
                  min="10"
                  max="30"
                  value={config.fontSize}
                  onChange={(e) => setConfig(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <span className="text-sm text-gray-600">{config.fontSize}px</span>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="displayValue"
                  checked={config.displayValue}
                  onChange={(e) => setConfig(prev => ({ ...prev, displayValue: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="displayValue" className="text-sm font-medium text-gray-700">
                  Mostrar texto
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color de Fondo</label>
                <input
                  type="color"
                  value={config.background}
                  onChange={(e) => setConfig(prev => ({ ...prev, background: e.target.value }))}
                  className="w-full h-10 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color de Líneas</label>
                <input
                  type="color"
                  value={config.lineColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, lineColor: e.target.value }))}
                  className="w-full h-10 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Controls */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar productos..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Todas las categorías</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    {selectedProducts.length} seleccionados
                  </span>
                  <button
                    onClick={selectAllProducts}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Seleccionar todos
                  </button>
                  <button
                    onClick={clearSelection}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
              
              {selectedProducts.length > 0 && (
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <button
                    onClick={downloadSelectedBarcodes}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Seleccionados</span>
                  </button>
                  <button
                    onClick={printBarcodes}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Seleccionados</span>
                  </button>
                </div>
              )}
            </div>

            {/* Products Grid/List */}
            <div className={viewMode === 'grid' ? 
              'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 
              'space-y-2'
            }>
              {filteredProducts.map(product => {
                const isSelected = selectedProducts.includes(product.id);
                const barcodeDataUrl = generateBarcode(product.code, config.format);
                
                return (
                  <div
                    key={product.id}
                    className={`border rounded-lg p-4 transition-all cursor-pointer ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    } ${viewMode === 'list' ? 'flex items-center space-x-4' : ''}`}
                    onClick={() => toggleProductSelection(product.id)}
                  >
                    <div className={`flex items-center space-x-2 ${viewMode === 'list' ? 'flex-1' : 'mb-3'}`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleProductSelection(product.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className={viewMode === 'list' ? 'flex-1' : ''}>
                        <h3 className="font-medium text-gray-800">{product.name}</h3>
                        <p className="text-sm text-gray-600">{product.category}</p>
                        <p className="text-sm font-mono text-gray-500">{product.code}</p>
                        <p className="text-lg font-bold text-blue-600">${product.price.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    {viewMode === 'grid' && barcodeDataUrl && (
                      <div className="text-center">
                        <img 
                          src={barcodeDataUrl} 
                          alt={`Código de barras ${product.code}`}
                          className="max-w-full h-auto mx-auto mb-2"
                        />
                      </div>
                    )}
                    
                    <div className={`flex items-center space-x-2 ${viewMode === 'list' ? '' : 'mt-3'}`}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadBarcode(product);
                        }}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Descargar"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyBarcodeToClipboard(product);
                        }}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Copiar"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Hidden canvas for barcode generation */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default BarcodeGenerator;
export type { Product, BarcodeConfig };