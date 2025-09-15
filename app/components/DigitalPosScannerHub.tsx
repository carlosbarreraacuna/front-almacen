'use client';

import React, { useState, useEffect } from 'react';
import { 
  Scan, Settings, ShoppingCart, ClipboardList, Shield, 
  Zap, Package, BarChart3, Users, Clock, CheckCircle,
  AlertTriangle, X, Play, Pause, Wifi, WifiOff
} from 'lucide-react';
import useDigitalPosScanner from '../hooks/useDigitalPosScanner';
import DigitalPosScannerConfig from './DigitalPosScannerConfig';
import QuickScanComponent from './QuickScanComponent';
import SupervisorAuthSystem from './SupervisorAuthSystem';
import InventoryAuditScanner from './InventoryAuditScanner';

interface DigitalPosScannerHubProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded?: (product: any) => void;
  onAuditComplete?: (session: any) => void;
  cartItems?: any[];
  products?: any[];
}

type ActiveModule = 'dashboard' | 'quick-scan' | 'inventory-audit' | 'supervisor-auth' | 'config';

interface ScannerStats {
  totalScans: number;
  successfulScans: number;
  failedScans: number;
  averageTime: number;
  lastScanTime?: Date;
  sessionsToday: number;
}

const DigitalPosScannerHub: React.FC<DigitalPosScannerHubProps> = ({
  isOpen,
  onClose,
  onProductAdded,
  onAuditComplete,
  cartItems = [],
  products = []
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
    error: scannerError,
    clearError
  } = useDigitalPosScanner();

  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');
  const [stats, setStats] = useState<ScannerStats>({
    totalScans: 0,
    successfulScans: 0,
    failedScans: 0,
    averageTime: 0,
    sessionsToday: 0
  });
  const [connectionTime, setConnectionTime] = useState<Date | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  // Cargar estadísticas desde localStorage
  useEffect(() => {
    const savedStats = localStorage.getItem('digitalpos-scanner-stats');
    if (savedStats) {
      try {
        const parsedStats = JSON.parse(savedStats);
        setStats(parsedStats);
      } catch (err) {
        console.error('Error loading scanner stats:', err);
      }
    }
  }, []);

  // Guardar estadísticas en localStorage
  useEffect(() => {
    localStorage.setItem('digitalpos-scanner-stats', JSON.stringify(stats));
  }, [stats]);

  // Actualizar estadísticas cuando hay un nuevo escaneo
  useEffect(() => {
    if (lastScanResult) {
      setStats(prevStats => {
        const newStats = {
          ...prevStats,
          totalScans: prevStats.totalScans + 1,
          successfulScans: lastScanResult.success ? prevStats.successfulScans + 1 : prevStats.successfulScans,
          failedScans: !lastScanResult.success ? prevStats.failedScans + 1 : prevStats.failedScans,
          lastScanTime: new Date()
        };
        
        // Calcular tiempo promedio (simulado)
        newStats.averageTime = Math.round((newStats.totalScans * prevStats.averageTime + (Math.random() * 2000 + 500)) / newStats.totalScans);
        
        return newStats;
      });
    }
  }, [lastScanResult]);

  // Manejar conexión del escáner
  useEffect(() => {
    if (isConnected && !connectionTime) {
      setConnectionTime(new Date());
      setSessionStartTime(new Date());
      setStats(prev => ({ ...prev, sessionsToday: prev.sessionsToday + 1 }));
    } else if (!isConnected && connectionTime) {
      setConnectionTime(null);
      setSessionStartTime(null);
    }
  }, [isConnected, connectionTime]);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      console.error('Error connecting scanner:', err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (err) {
      console.error('Error disconnecting scanner:', err);
    }
  };

  const getSuccessRate = () => {
    if (stats.totalScans === 0) return 0;
    return Math.round((stats.successfulScans / stats.totalScans) * 100);
  };

  const getSessionDuration = () => {
    if (!sessionStartTime) return '00:00:00';
    const now = new Date();
    const diff = now.getTime() - sessionStartTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderDashboard = () => (
    <div className="p-6 space-y-6">
      {/* Connection Status */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {isConnected ? <Wifi className="w-6 h-6 text-white" /> : <WifiOff className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Escáner DigitalPos {isConnected ? 'Conectado' : 'Desconectado'}
              </h3>
              <p className="text-gray-600">
                {isConnected ? (
                  `Sesión activa: ${getSessionDuration()}`
                ) : (
                  'Haga clic en conectar para iniciar'
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {!isConnected ? (
              <button
                onClick={handleConnect}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Wifi className="w-4 h-4" />
                <span>Conectar</span>
              </button>
            ) : (
              <>
                {!isScanning ? (
                  <button
                    onClick={startScanning}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Iniciar Escaneo</span>
                  </button>
                ) : (
                  <button
                    onClick={stopScanning}
                    className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pausar</span>
                  </button>
                )}
                <button
                  onClick={handleDisconnect}
                  className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <WifiOff className="w-4 h-4" />
                  <span>Desconectar</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalScans}</div>
          <div className="text-sm text-gray-600">Total Escaneos</div>
        </div>
        
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{getSuccessRate()}%</div>
          <div className="text-sm text-gray-600">Tasa de Éxito</div>
        </div>
        
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.averageTime}ms</div>
          <div className="text-sm text-gray-600">Tiempo Promedio</div>
        </div>
        
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.sessionsToday}</div>
          <div className="text-sm text-gray-600">Sesiones Hoy</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveModule('quick-scan')}
          className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow text-left group"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Escaneo Rápido</h3>
              <p className="text-sm text-gray-600">Agregar productos al carrito</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveModule('inventory-audit')}
          className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow text-left group"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <ClipboardList className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Auditoría</h3>
              <p className="text-sm text-gray-600">Verificar inventario</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveModule('supervisor-auth')}
          className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow text-left group"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Autorización</h3>
              <p className="text-sm text-gray-600">Códigos de supervisor</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveModule('config')}
          className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow text-left group"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
              <Settings className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Configuración</h3>
              <p className="text-sm text-gray-600">Ajustes del escáner</p>
            </div>
          </div>
        </button>
      </div>

      {/* Recent Activity */}
      {stats.lastScanTime && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Actividad Reciente</h3>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-gray-800">Último escaneo exitoso</p>
              <p className="text-sm text-gray-600">
                {stats.lastScanTime.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {scannerError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <h4 className="font-medium text-red-800">Error del Escáner</h4>
                <p className="text-red-700">{scannerError}</p>
              </div>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'quick-scan':
        return (
          <QuickScanComponent
            isOpen={true}
            onClose={() => setActiveModule('dashboard')}
            onProductAdded={onProductAdded}
            cartItems={cartItems}
          />
        );
      
      case 'inventory-audit':
        return (
          <InventoryAuditScanner
            isOpen={true}
            onClose={() => setActiveModule('dashboard')}
            onAuditComplete={onAuditComplete}
            initialProducts={products}
          />
        );
      
      case 'supervisor-auth':
        return (
          <SupervisorAuthSystem
            isOpen={true}
            onClose={() => setActiveModule('dashboard')}
            onAuthSuccess={(supervisor) => {
              console.log('Supervisor authenticated:', supervisor);
              setActiveModule('dashboard');
            }}
          />
        );
      
      case 'config':
        return (
          <DigitalPosScannerConfig
            isOpen={true}
            onClose={() => setActiveModule('dashboard')}
            onSave={(newConfig) => {
              setConfig(newConfig);
              setActiveModule('dashboard');
            }}
            currentConfig={config}
          />
        );
      
      default:
        return renderDashboard();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Scan className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">DigitalPos Scanner Hub</h1>
                <p className="text-blue-100">
                  Centro de control del escáner de códigos de barras
                </p>
              </div>
            </div>
            
            {activeModule !== 'dashboard' && (
              <button
                onClick={() => setActiveModule('dashboard')}
                className="flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            )}
            
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="h-[600px] overflow-y-auto">
          {renderActiveModule()}
        </div>
      </div>
    </div>
  );
};

export default DigitalPosScannerHub;
export type { ScannerStats, ActiveModule };