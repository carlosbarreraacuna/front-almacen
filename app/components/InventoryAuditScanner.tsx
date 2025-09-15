'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ClipboardList, Package, Scan, CheckCircle, AlertTriangle, 
  X, Save, Download, Upload, Filter, Search, BarChart3,
  TrendingUp, TrendingDown, Minus, Plus, Eye, FileText,
  Calendar, Clock, User, Hash, AlertCircle
} from 'lucide-react';
import useDigitalPosScanner, { ScannedProduct } from '../hooks/useDigitalPosScanner';
import DigitalPosScannerConfig from './DigitalPosScannerConfig';

interface AuditItem {
  id: string;
  barcode: string;
  productName: string;
  expectedQuantity: number;
  scannedQuantity: number;
  actualQuantity?: number;
  difference: number;
  status: 'pending' | 'verified' | 'discrepancy' | 'missing';
  lastScanned?: Date;
  notes?: string;
  location?: string;
  batch?: string;
  expiryDate?: string;
  unitCost?: number;
  totalValue?: number;
}

interface AuditSession {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'completed' | 'paused';
  auditedBy: string;
  totalItems: number;
  completedItems: number;
  discrepancies: number;
  totalValue: number;
  items: AuditItem[];
}

interface InventoryAuditScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onAuditComplete?: (session: AuditSession) => void;
  initialProducts?: any[];
}

const InventoryAuditScanner: React.FC<InventoryAuditScannerProps> = ({
  isOpen,
  onClose,
  onAuditComplete,
  initialProducts = []
}) => {
  const {
    isConnected,
    isScanning,
    lastScanResult,
    config,
    setConfig,
    connect,
    disconnect,
    startScanning,
    stopScanning,
    scanSingle,
    error: scannerError,
    clearError
  } = useDigitalPosScanner();

  const [currentSession, setCurrentSession] = useState<AuditSession | null>(null);
  const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<'scan' | 'review' | 'reports'>('scan');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<AuditItem | null>(null);
  const [manualQuantity, setManualQuantity] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicializar sesión de auditoría
  useEffect(() => {
    if (isOpen && !currentSession) {
      initializeAuditSession();
    }
  }, [isOpen]);

  // Procesar resultados de escaneo
  useEffect(() => {
    if (lastScanResult?.success && lastScanResult.product) {
      handleProductScanned(lastScanResult.product);
    }
  }, [lastScanResult]);

  const initializeAuditSession = () => {
    const session: AuditSession = {
      id: `audit-${Date.now()}`,
      name: `Auditoría ${new Date().toLocaleDateString()}`,
      description: 'Auditoría de inventario con escáner DigitalPos',
      startDate: new Date(),
      status: 'active',
      auditedBy: 'Usuario POS',
      totalItems: initialProducts.length,
      completedItems: 0,
      discrepancies: 0,
      totalValue: 0,
      items: []
    };

    // Convertir productos iniciales a items de auditoría
    const items: AuditItem[] = initialProducts.map(product => ({
      id: `item-${product.id || product.barcode}`,
      barcode: product.barcode,
      productName: product.name,
      expectedQuantity: product.stock || 0,
      scannedQuantity: 0,
      difference: 0,
      status: 'pending',
      location: product.location,
      unitCost: product.cost || product.price,
      totalValue: (product.cost || product.price) * (product.stock || 0)
    }));

    session.items = items;
    session.totalValue = items.reduce((sum, item) => sum + (item.totalValue || 0), 0);
    
    setCurrentSession(session);
    setAuditItems(items);
  };

  const handleProductScanned = useCallback((product: ScannedProduct) => {
    if (!currentSession) return;

    setAuditItems(prevItems => {
      const existingIndex = prevItems.findIndex(item => item.barcode === product.barcode);
      
      if (existingIndex >= 0) {
        // Producto existente - incrementar cantidad escaneada
        const updatedItems = [...prevItems];
        const item = updatedItems[existingIndex];
        
        updatedItems[existingIndex] = {
          ...item,
          scannedQuantity: item.scannedQuantity + 1,
          lastScanned: new Date(),
          batch: product.batch || item.batch,
          expiryDate: product.expiryDate || item.expiryDate,
          status: 'verified'
        };
        
        // Calcular diferencia
        const newItem = updatedItems[existingIndex];
        newItem.difference = newItem.scannedQuantity - newItem.expectedQuantity;
        
        if (newItem.difference !== 0) {
          newItem.status = 'discrepancy';
        }
        
        return updatedItems;
      } else {
        // Producto no esperado - agregar como nuevo item
        const newItem: AuditItem = {
          id: `item-${Date.now()}`,
          barcode: product.barcode,
          productName: product.name,
          expectedQuantity: 0,
          scannedQuantity: 1,
          difference: 1,
          status: 'discrepancy',
          lastScanned: new Date(),
          batch: product.batch,
          expiryDate: product.expiryDate,
          unitCost: product.price,
          totalValue: product.price
        };
        
        return [...prevItems, newItem];
      }
    });
  }, [currentSession]);

  const handleManualQuantityUpdate = (item: AuditItem, quantity: number) => {
    setAuditItems(prevItems => 
      prevItems.map(auditItem => 
        auditItem.id === item.id
          ? {
              ...auditItem,
              actualQuantity: quantity,
              difference: quantity - auditItem.expectedQuantity,
              status: quantity === auditItem.expectedQuantity ? 'verified' : 'discrepancy',
              notes
            }
          : auditItem
      )
    );
    
    setSelectedItem(null);
    setManualQuantity(0);
    setNotes('');
  };

  const handleCompleteAudit = async () => {
    if (!currentSession) return;

    setIsLoading(true);
    try {
      const completedItems = auditItems.filter(item => item.status !== 'pending').length;
      const discrepancies = auditItems.filter(item => item.status === 'discrepancy').length;
      
      const completedSession: AuditSession = {
        ...currentSession,
        endDate: new Date(),
        status: 'completed',
        completedItems,
        discrepancies,
        items: auditItems
      };

      // Guardar sesión en localStorage
      const savedSessions = JSON.parse(localStorage.getItem('audit-sessions') || '[]');
      savedSessions.unshift(completedSession);
      localStorage.setItem('audit-sessions', JSON.stringify(savedSessions.slice(0, 50)));

      // Actualizar inventario en el backend
      await updateInventoryFromAudit(auditItems);
      
      onAuditComplete?.(completedSession);
      onClose();
    } catch (err) {
      setError('Error al completar la auditoría');
    } finally {
      setIsLoading(false);
    }
  };

  const updateInventoryFromAudit = async (items: AuditItem[]) => {
    const updates = items
      .filter(item => item.status === 'verified' || item.status === 'discrepancy')
      .map(item => ({
        barcode: item.barcode,
        newQuantity: item.actualQuantity ?? item.scannedQuantity,
        difference: item.difference,
        notes: item.notes
      }));

    try {
      const response = await fetch('/api/inventory/audit-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });
      
      if (!response.ok) {
        throw new Error('Error al actualizar inventario');
      }
    } catch (err) {
      console.error('Error updating inventory:', err);
      throw err;
    }
  };

  const exportAuditReport = () => {
    if (!currentSession) return;

    const csvContent = [
      ['Código de Barras', 'Producto', 'Cantidad Esperada', 'Cantidad Escaneada', 'Cantidad Real', 'Diferencia', 'Estado', 'Notas'],
      ...auditItems.map(item => [
        item.barcode,
        item.productName,
        item.expectedQuantity.toString(),
        item.scannedQuantity.toString(),
        (item.actualQuantity ?? item.scannedQuantity).toString(),
        item.difference.toString(),
        item.status,
        item.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria-${currentSession.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredItems = auditItems.filter(item => {
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.barcode.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-50';
      case 'discrepancy': return 'text-red-600 bg-red-50';
      case 'missing': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4" />;
      case 'discrepancy': return <AlertTriangle className="w-4 h-4" />;
      case 'missing': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ClipboardList className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Auditoría de Inventario</h2>
                <p className="text-green-100">
                  {currentSession?.name} • {currentSession?.status === 'active' ? 'En progreso' : 'Completada'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowConfig(true)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                title="Configurar escáner"
              >
                <Scan className="w-5 h-5" />
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

        {/* Stats Bar */}
        {currentSession && (
          <div className="bg-gray-50 px-6 py-4 border-b">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{currentSession.totalItems}</div>
                <div className="text-sm text-gray-600">Total Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{currentSession.completedItems}</div>
                <div className="text-sm text-gray-600">Completados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{currentSession.discrepancies}</div>
                <div className="text-sm text-gray-600">Discrepancias</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round((currentSession.completedItems / currentSession.totalItems) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Progreso</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  ${currentSession.totalValue.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Valor Total</div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {(error || scannerError) && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{error || scannerError}</span>
              </div>
              <button
                onClick={() => { setError(null); clearError(); }}
                className="text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="flex h-[600px]">
          {/* Sidebar - Scanner Controls */}
          <div className="w-80 bg-gray-50 border-r p-4 space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Control del Escáner</h3>
              
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm">
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>

              {!isConnected ? (
                <button
                  onClick={connect}
                  className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Scan className="w-4 h-4" />
                  <span>Conectar Escáner</span>
                </button>
              ) : (
                <div className="space-y-2">
                  {!isScanning ? (
                    <button
                      onClick={startScanning}
                      className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Scan className="w-4 h-4" />
                      <span>Iniciar Escaneo</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopScanning}
                      className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Detener Escaneo</span>
                    </button>
                  )}
                  
                  <button
                    onClick={scanSingle}
                    className="w-full flex items-center justify-center space-x-2 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Package className="w-4 h-4" />
                    <span>Escaneo Individual</span>
                  </button>
                </div>
              )}
            </div>

            <div className="border-t pt-4 space-y-3">
              <h3 className="font-semibold text-gray-800">Filtros</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendientes</option>
                  <option value="verified">Verificados</option>
                  <option value="discrepancy">Discrepancias</option>
                  <option value="missing">Faltantes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Producto o código..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <button
                onClick={exportAuditReport}
                className="w-full flex items-center justify-center space-x-2 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Reporte</span>
              </button>
              
              <button
                onClick={handleCompleteAudit}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isLoading ? 'Guardando...' : 'Completar Auditoría'}</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  Items de Auditoría ({filteredItems.length})
                </h3>
              </div>

              <div className="space-y-2">
                {filteredItems.map(item => (
                  <div key={item.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${getStatusColor(item.status)}`}>
                            {getStatusIcon(item.status)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800">{item.productName}</h4>
                            <p className="text-sm text-gray-600">Código: {item.barcode}</p>
                            {item.batch && (
                              <p className="text-xs text-gray-500">Lote: {item.batch}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="text-sm text-gray-600">Esperado</div>
                          <div className="text-lg font-semibold">{item.expectedQuantity}</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-sm text-gray-600">Escaneado</div>
                          <div className="text-lg font-semibold text-blue-600">{item.scannedQuantity}</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-sm text-gray-600">Diferencia</div>
                          <div className={`text-lg font-semibold ${
                            item.difference > 0 ? 'text-green-600' : 
                            item.difference < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {item.difference > 0 ? '+' : ''}{item.difference}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setManualQuantity(item.actualQuantity ?? item.scannedQuantity);
                            setNotes(item.notes || '');
                          }}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Editar cantidad"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {item.notes && (
                      <div className="mt-3 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
                        <strong>Notas:</strong> {item.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Manual Quantity Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Ajustar Cantidad - {selectedItem.productName}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad Real
                    </label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setManualQuantity(Math.max(0, manualQuantity - 1))}
                        className="p-2 border rounded-lg hover:bg-gray-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        value={manualQuantity}
                        onChange={(e) => setManualQuantity(parseInt(e.target.value) || 0)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                        min="0"
                      />
                      <button
                        onClick={() => setManualQuantity(manualQuantity + 1)}
                        className="p-2 border rounded-lg hover:bg-gray-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notas (Opcional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Agregar observaciones..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleManualQuantityUpdate(selectedItem, manualQuantity)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scanner Config Modal */}
        {showConfig && (
          <DigitalPosScannerConfig
            isOpen={showConfig}
            onClose={() => setShowConfig(false)}
            onSave={setConfig}
            currentConfig={config || undefined}
          />
        )}
      </div>
    </div>
  );
};

export default InventoryAuditScanner;
export type { AuditItem, AuditSession };