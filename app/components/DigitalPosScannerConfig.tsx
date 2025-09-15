'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, Zap, Wifi, Volume2, VolumeX, 
  CheckCircle, AlertCircle, Scan, Save,
  RotateCcw, TestTube, Monitor
} from 'lucide-react';

interface ScannerConfig {
  // Configuración de conexión
  connectionType: 'usb' | 'bluetooth' | 'wifi';
  deviceId: string;
  baudRate: number;
  
  // Configuración de escaneo
  scanMode: 'single' | 'continuous' | 'auto';
  scanDelay: number;
  autoEnter: boolean;
  prefixChars: string;
  suffixChars: string;
  
  // Configuración de audio
  beepEnabled: boolean;
  beepVolume: number;
  beepDuration: number;
  
  // Configuración de códigos soportados
  supportedCodes: {
    ean13: boolean;
    ean8: boolean;
    code128: boolean;
    code39: boolean;
    qr: boolean;
    dataMatrix: boolean;
    pdf417: boolean;
    gs1: boolean;
  };
  
  // Configuración avanzada
  readTimeout: number;
  retryAttempts: number;
  illuminationEnabled: boolean;
  aimingEnabled: boolean;
}

interface DigitalPosScannerConfigProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: ScannerConfig) => void;
  currentConfig?: Partial<ScannerConfig>;
}

const defaultConfig: ScannerConfig = {
  connectionType: 'usb',
  deviceId: '',
  baudRate: 9600,
  scanMode: 'single',
  scanDelay: 100,
  autoEnter: true,
  prefixChars: '',
  suffixChars: '\r\n',
  beepEnabled: true,
  beepVolume: 5,
  beepDuration: 100,
  supportedCodes: {
    ean13: true,
    ean8: true,
    code128: true,
    code39: true,
    qr: true,
    dataMatrix: false,
    pdf417: false,
    gs1: true
  },
  readTimeout: 5000,
  retryAttempts: 3,
  illuminationEnabled: true,
  aimingEnabled: true
};

const DigitalPosScannerConfig: React.FC<DigitalPosScannerConfigProps> = ({
  isOpen,
  onClose,
  onSave,
  currentConfig
}) => {
  const [config, setConfig] = useState<ScannerConfig>({ ...defaultConfig, ...currentConfig });
  const [activeTab, setActiveTab] = useState<'connection' | 'scanning' | 'audio' | 'codes' | 'advanced'>('connection');
  const [isTestMode, setIsTestMode] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (currentConfig) {
      setConfig({ ...defaultConfig, ...currentConfig });
    }
  }, [currentConfig]);

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const handleReset = () => {
    setConfig(defaultConfig);
  };

  const handleTest = async () => {
    setIsTestMode(true);
    setTestResult(null);
    
    try {
      // Simular prueba de conexión
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Aquí iría la lógica real de prueba del escáner
      const success = Math.random() > 0.3; // Simulación
      
      setTestResult({
        success,
        message: success 
          ? 'Escáner DigitalPos conectado correctamente'
          : 'Error de conexión. Verificar configuración.'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Error al probar la conexión'
      });
    } finally {
      setIsTestMode(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Zap className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Configuración DigitalPos</h2>
                <p className="text-blue-100">Configurar escáner de códigos de barras</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r">
            <nav className="p-4 space-y-2">
              {[
                { id: 'connection', label: 'Conexión', icon: Wifi },
                { id: 'scanning', label: 'Escaneo', icon: Scan },
                { id: 'audio', label: 'Audio', icon: Volume2 },
                { id: 'codes', label: 'Códigos', icon: Monitor },
                { id: 'advanced', label: 'Avanzado', icon: Settings }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'connection' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800">Configuración de Conexión</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Conexión
                    </label>
                    <select
                      value={config.connectionType}
                      onChange={(e) => setConfig({ ...config, connectionType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="usb">USB (Recomendado)</option>
                      <option value="bluetooth">Bluetooth</option>
                      <option value="wifi">WiFi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID del Dispositivo
                    </label>
                    <input
                      type="text"
                      value={config.deviceId}
                      onChange={(e) => setConfig({ ...config, deviceId: e.target.value })}
                      placeholder="Detectar automáticamente"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Velocidad de Transmisión
                    </label>
                    <select
                      value={config.baudRate}
                      onChange={(e) => setConfig({ ...config, baudRate: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={9600}>9600 bps</option>
                      <option value={19200}>19200 bps</option>
                      <option value={38400}>38400 bps</option>
                      <option value={57600}>57600 bps</option>
                      <option value={115200}>115200 bps</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-center">
                    <button
                      onClick={handleTest}
                      disabled={isTestMode}
                      className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <TestTube className="w-5 h-5" />
                      <span>{isTestMode ? 'Probando...' : 'Probar Conexión'}</span>
                    </button>
                  </div>
                </div>

                {testResult && (
                  <div className={`p-4 rounded-lg flex items-center space-x-3 ${
                    testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'scanning' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800">Configuración de Escaneo</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modo de Escaneo
                    </label>
                    <select
                      value={config.scanMode}
                      onChange={(e) => setConfig({ ...config, scanMode: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="single">Individual (Recomendado para ventas)</option>
                      <option value="continuous">Continuo (Para inventario)</option>
                      <option value="auto">Automático</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Retraso entre Escaneos (ms)
                    </label>
                    <input
                      type="number"
                      value={config.scanDelay}
                      onChange={(e) => setConfig({ ...config, scanDelay: parseInt(e.target.value) })}
                      min="50"
                      max="2000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Caracteres de Prefijo
                    </label>
                    <input
                      type="text"
                      value={config.prefixChars}
                      onChange={(e) => setConfig({ ...config, prefixChars: e.target.value })}
                      placeholder="Opcional"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Caracteres de Sufijo
                    </label>
                    <input
                      type="text"
                      value={config.suffixChars}
                      onChange={(e) => setConfig({ ...config, suffixChars: e.target.value })}
                      placeholder="\r\n (Enter)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="autoEnter"
                      checked={config.autoEnter}
                      onChange={(e) => setConfig({ ...config, autoEnter: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="autoEnter" className="text-sm font-medium text-gray-700">
                      Enviar Enter automáticamente después del escaneo
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="illumination"
                      checked={config.illuminationEnabled}
                      onChange={(e) => setConfig({ ...config, illuminationEnabled: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="illumination" className="text-sm font-medium text-gray-700">
                      Habilitar iluminación LED
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="aiming"
                      checked={config.aimingEnabled}
                      onChange={(e) => setConfig({ ...config, aimingEnabled: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="aiming" className="text-sm font-medium text-gray-700">
                      Habilitar láser de puntería
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800">Configuración de Audio</h3>
                
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="beepEnabled"
                      checked={config.beepEnabled}
                      onChange={(e) => setConfig({ ...config, beepEnabled: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="beepEnabled" className="text-sm font-medium text-gray-700">
                      Habilitar sonido de confirmación
                    </label>
                    {config.beepEnabled ? <Volume2 className="w-5 h-5 text-green-600" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
                  </div>

                  {config.beepEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-7">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Volumen (1-10)
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={config.beepVolume}
                          onChange={(e) => setConfig({ ...config, beepVolume: parseInt(e.target.value) })}
                          className="w-full"
                        />
                        <div className="text-center text-sm text-gray-600 mt-1">{config.beepVolume}</div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duración (ms)
                        </label>
                        <input
                          type="number"
                          value={config.beepDuration}
                          onChange={(e) => setConfig({ ...config, beepDuration: parseInt(e.target.value) })}
                          min="50"
                          max="1000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'codes' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800">Códigos Soportados</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(config.supportedCodes).map(([code, enabled]) => (
                    <div key={code} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <input
                        type="checkbox"
                        id={code}
                        checked={enabled}
                        onChange={(e) => setConfig({
                          ...config,
                          supportedCodes: {
                            ...config.supportedCodes,
                            [code]: e.target.checked
                          }
                        })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor={code} className="text-sm font-medium text-gray-700 flex-1">
                        {code.toUpperCase()}
                        {code === 'gs1' && <span className="text-xs text-blue-600 ml-2">(Recomendado)</span>}
                      </label>
                      {enabled && <CheckCircle className="w-4 h-4 text-green-600" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800">Configuración Avanzada</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timeout de Lectura (ms)
                    </label>
                    <input
                      type="number"
                      value={config.readTimeout}
                      onChange={(e) => setConfig({ ...config, readTimeout: parseInt(e.target.value) })}
                      min="1000"
                      max="30000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Intentos de Reintento
                    </label>
                    <input
                      type="number"
                      value={config.retryAttempts}
                      onChange={(e) => setConfig({ ...config, retryAttempts: parseInt(e.target.value) })}
                      min="1"
                      max="10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t">
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restablecer</span>
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalPosScannerConfig;
export type { ScannerConfig };