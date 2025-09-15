'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Lock, Unlock, User, Key, AlertCircle, 
  CheckCircle, X, Clock, Settings, Eye, EyeOff,
  UserCheck, Scan, Hash
} from 'lucide-react';

interface SupervisorCode {
  id: string;
  code: string;
  supervisorName: string;
  permissions: string[];
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  lastUsed?: Date;
  usageCount: number;
}

interface AuthRequest {
  id: string;
  operation: string;
  description: string;
  requiredPermissions: string[];
  requestedBy: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  approvedBy?: string;
  approvedAt?: Date;
}

interface SupervisorAuthSystemProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (supervisor: SupervisorCode, permissions: string[]) => void;
  onAuthFailed: (reason: string) => void;
  requiredPermissions: string[];
  operation: string;
  description: string;
  allowScannerInput?: boolean;
}

const AVAILABLE_PERMISSIONS = [
  'price_override',
  'discount_apply',
  'void_transaction',
  'refund_process',
  'inventory_adjust',
  'cash_drawer_open',
  'system_settings',
  'user_management',
  'report_access',
  'emergency_override'
];

const SupervisorAuthSystem: React.FC<SupervisorAuthSystemProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  onAuthFailed,
  requiredPermissions,
  operation,
  description,
  allowScannerInput = true
}) => {
  const [authMode, setAuthMode] = useState<'code' | 'scanner' | 'manage'>('code');
  const [inputCode, setInputCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supervisorCodes, setSupervisorCodes] = useState<SupervisorCode[]>([]);
  const [authHistory, setAuthHistory] = useState<AuthRequest[]>([]);
  const [isListening, setIsListening] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cargar códigos de supervisor desde localStorage
  useEffect(() => {
    const loadSupervisorCodes = () => {
      const saved = localStorage.getItem('supervisor-codes');
      if (saved) {
        try {
          const codes = JSON.parse(saved).map((code: any) => ({
            ...code,
            createdAt: new Date(code.createdAt),
            expiresAt: code.expiresAt ? new Date(code.expiresAt) : undefined,
            lastUsed: code.lastUsed ? new Date(code.lastUsed) : undefined
          }));
          setSupervisorCodes(codes);
        } catch (err) {
          console.error('Error loading supervisor codes:', err);
          initializeDefaultCodes();
        }
      } else {
        initializeDefaultCodes();
      }
    };

    const loadAuthHistory = () => {
      const saved = localStorage.getItem('auth-history');
      if (saved) {
        try {
          const history = JSON.parse(saved).map((req: any) => ({
            ...req,
            timestamp: new Date(req.timestamp),
            approvedAt: req.approvedAt ? new Date(req.approvedAt) : undefined
          }));
          setAuthHistory(history);
        } catch (err) {
          console.error('Error loading auth history:', err);
        }
      }
    };

    loadSupervisorCodes();
    loadAuthHistory();
  }, []);

  // Inicializar códigos por defecto
  const initializeDefaultCodes = () => {
    const defaultCodes: SupervisorCode[] = [
      {
        id: 'admin-001',
        code: '123456',
        supervisorName: 'Administrador Principal',
        permissions: AVAILABLE_PERMISSIONS,
        isActive: true,
        createdAt: new Date(),
        usageCount: 0
      },
      {
        id: 'supervisor-001',
        code: '789012',
        supervisorName: 'Supervisor de Ventas',
        permissions: ['price_override', 'discount_apply', 'void_transaction', 'cash_drawer_open'],
        isActive: true,
        createdAt: new Date(),
        usageCount: 0
      },
      {
        id: 'manager-001',
        code: '345678',
        supervisorName: 'Gerente de Tienda',
        permissions: ['price_override', 'discount_apply', 'void_transaction', 'refund_process', 'inventory_adjust', 'cash_drawer_open', 'report_access'],
        isActive: true,
        createdAt: new Date(),
        usageCount: 0
      }
    ];
    
    setSupervisorCodes(defaultCodes);
    localStorage.setItem('supervisor-codes', JSON.stringify(defaultCodes));
  };

  // Enfocar input al abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Escuchar entrada del escáner
  useEffect(() => {
    if (!isOpen || !allowScannerInput || authMode !== 'scanner') return;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        if (inputCode.length >= 4) {
          handleAuth();
        }
        return;
      }
      
      // Acumular caracteres del escáner
      if (event.key.length === 1) {
        setInputCode(prev => prev + event.key);
        
        // Reset timeout para detectar fin de escaneo
        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current);
        }
        
        scanTimeoutRef.current = setTimeout(() => {
          if (inputCode.length >= 4) {
            handleAuth();
          }
        }, 100);
      }
    };

    if (isListening) {
      document.addEventListener('keypress', handleKeyPress);
      return () => {
        document.removeEventListener('keypress', handleKeyPress);
        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current);
        }
      };
    }
  }, [isOpen, allowScannerInput, authMode, isListening, inputCode]);

  const handleAuth = async () => {
    if (!inputCode.trim()) {
      setError('Ingrese un código de autorización');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Buscar código de supervisor
      const supervisor = supervisorCodes.find(s => 
        s.code === inputCode.trim() && 
        s.isActive && 
        (!s.expiresAt || s.expiresAt > new Date())
      );

      if (!supervisor) {
        throw new Error('Código de autorización inválido o expirado');
      }

      // Verificar permisos
      const hasRequiredPermissions = requiredPermissions.every(permission => 
        supervisor.permissions.includes(permission)
      );

      if (!hasRequiredPermissions) {
        throw new Error('El supervisor no tiene los permisos necesarios para esta operación');
      }

      // Actualizar estadísticas de uso
      const updatedCodes = supervisorCodes.map(code => 
        code.id === supervisor.id 
          ? { ...code, lastUsed: new Date(), usageCount: code.usageCount + 1 }
          : code
      );
      setSupervisorCodes(updatedCodes);
      localStorage.setItem('supervisor-codes', JSON.stringify(updatedCodes));

      // Registrar en historial
      const authRequest: AuthRequest = {
        id: `auth-${Date.now()}`,
        operation,
        description,
        requiredPermissions,
        requestedBy: 'Sistema POS',
        timestamp: new Date(),
        status: 'approved',
        approvedBy: supervisor.supervisorName,
        approvedAt: new Date()
      };

      const updatedHistory = [authRequest, ...authHistory.slice(0, 49)];
      setAuthHistory(updatedHistory);
      localStorage.setItem('auth-history', JSON.stringify(updatedHistory));

      // Éxito
      onAuthSuccess(supervisor, supervisor.permissions);
      onClose();
      setInputCode('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de autenticación';
      setError(errorMessage);
      onAuthFailed(errorMessage);
      
      // Registrar intento fallido
      const authRequest: AuthRequest = {
        id: `auth-${Date.now()}`,
        operation,
        description,
        requiredPermissions,
        requestedBy: 'Sistema POS',
        timestamp: new Date(),
        status: 'denied'
      };

      const updatedHistory = [authRequest, ...authHistory.slice(0, 49)];
      setAuthHistory(updatedHistory);
      localStorage.setItem('auth-history', JSON.stringify(updatedHistory));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCode = (newCode: Omit<SupervisorCode, 'id' | 'createdAt' | 'usageCount'>) => {
    const code: SupervisorCode = {
      ...newCode,
      id: `supervisor-${Date.now()}`,
      createdAt: new Date(),
      usageCount: 0
    };
    
    const updatedCodes = [...supervisorCodes, code];
    setSupervisorCodes(updatedCodes);
    localStorage.setItem('supervisor-codes', JSON.stringify(updatedCodes));
  };

  const handleUpdateCode = (id: string, updates: Partial<SupervisorCode>) => {
    const updatedCodes = supervisorCodes.map(code => 
      code.id === id ? { ...code, ...updates } : code
    );
    setSupervisorCodes(updatedCodes);
    localStorage.setItem('supervisor-codes', JSON.stringify(updatedCodes));
  };

  const handleDeleteCode = (id: string) => {
    const updatedCodes = supervisorCodes.filter(code => code.id !== id);
    setSupervisorCodes(updatedCodes);
    localStorage.setItem('supervisor-codes', JSON.stringify(updatedCodes));
  };

  const formatPermission = (permission: string) => {
    return permission.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Autorización de Supervisor</h2>
                <p className="text-red-100">Se requiere autorización para continuar</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Operation Info */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800">Operación: {operation}</h3>
              <p className="text-yellow-700 text-sm">{description}</p>
              <div className="mt-2">
                <span className="text-xs text-yellow-600">Permisos requeridos: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {requiredPermissions.map(permission => (
                    <span key={permission} className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs">
                      {formatPermission(permission)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Auth Mode Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setAuthMode('code')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                authMode === 'code'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Código Manual</span>
            </button>
            
            {allowScannerInput && (
              <button
                onClick={() => setAuthMode('scanner')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                  authMode === 'scanner'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Scan className="w-4 h-4" />
                <span>Escáner</span>
              </button>
            )}
            
            <button
              onClick={() => setAuthMode('manage')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                authMode === 'manage'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Gestionar</span>
            </button>
          </div>

          {/* Auth Input */}
          {(authMode === 'code' || authMode === 'scanner') && (
            <div className="space-y-4">
              {authMode === 'scanner' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Scan className="w-5 h-5 text-blue-600" />
                      <span className="text-blue-800 font-medium">Modo Escáner</span>
                    </div>
                    <button
                      onClick={() => setIsListening(!isListening)}
                      className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-colors ${
                        isListening
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-600 text-white'
                      }`}
                    >
                      {isListening ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      <span>{isListening ? 'Escuchando' : 'Activar'}</span>
                    </button>
                  </div>
                  <p className="text-blue-600 text-sm mt-2">
                    {isListening 
                      ? 'Escanee el código de autorización del supervisor'
                      : 'Active el modo escáner para detectar códigos automáticamente'
                    }
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Código de Autorización
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    type={showCode ? 'text' : 'password'}
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                    placeholder="Ingrese el código de supervisor"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                    disabled={isLoading || (authMode === 'scanner' && isListening)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCode(!showCode)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800 text-sm">{error}</span>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAuth}
                  disabled={isLoading || !inputCode.trim()}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                  <span>{isLoading ? 'Verificando...' : 'Autorizar'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Management Panel */}
          {authMode === 'manage' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Active Supervisors */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Supervisores Activos</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {supervisorCodes.filter(code => code.isActive).map(code => (
                      <div key={code.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-800">{code.supervisorName}</h4>
                            <p className="text-sm text-gray-600">Código: {code.code}</p>
                            <p className="text-xs text-gray-500">
                              Usado {code.usageCount} veces
                              {code.lastUsed && ` • Último: ${code.lastUsed.toLocaleDateString()}`}
                            </p>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleUpdateCode(code.id, { isActive: false })}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Desactivar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {code.permissions.slice(0, 3).map(permission => (
                              <span key={permission} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                {formatPermission(permission)}
                              </span>
                            ))}
                            {code.permissions.length > 3 && (
                              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                +{code.permissions.length - 3} más
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Auth History */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Historial Reciente</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {authHistory.slice(0, 10).map(auth => (
                      <div key={auth.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-800">{auth.operation}</h4>
                            <p className="text-sm text-gray-600">{auth.description}</p>
                            <p className="text-xs text-gray-500">
                              {auth.timestamp.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {auth.status === 'approved' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className={`text-xs px-2 py-1 rounded ${
                              auth.status === 'approved' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {auth.status === 'approved' ? 'Aprobado' : 'Denegado'}
                            </span>
                          </div>
                        </div>
                        {auth.approvedBy && (
                          <p className="text-xs text-gray-500 mt-1">
                            Por: {auth.approvedBy}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupervisorAuthSystem;
export type { SupervisorCode, AuthRequest };