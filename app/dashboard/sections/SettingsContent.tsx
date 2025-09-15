'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  Database, 
  Shield, 
  Bell, 
  Palette, 
  Globe,
  X,
  Edit,
  Trash2,
  Plus,
  Check,
  AlertTriangle,
  Download,
  Upload,
  RefreshCw,
  Monitor,
  Smartphone,
  Mail,
  Lock,
  Key,
  Server,
  HardDrive,
  Wifi,
  Eye,
  EyeOff
} from 'lucide-react';

export default function SettingsContent() {
  const [activeTab, setActiveTab] = useState('general');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados para configuraciones
  const [generalSettings, setGeneralSettings] = useState({
    companyName: 'Mi Empresa',
    companyEmail: 'contacto@miempresa.com',
    companyPhone: '+1234567890',
    timezone: 'America/Mexico_City',
    language: 'es',
    currency: 'MXN',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h'
  });
  
  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: 8,
    requireSpecialChars: true,
    sessionTimeout: 30,
    twoFactorAuth: false,
    loginAttempts: 5,
    lockoutDuration: 15
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    lowStockAlerts: true,
    orderAlerts: true,
    systemAlerts: true
  });
  
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'light',
    primaryColor: '#3B82F6',
    sidebarCollapsed: false,
    compactMode: false,
    showAnimations: true
  });
  
  const [systemSettings, setSystemSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    maintenanceMode: false,
    debugMode: false,
    logLevel: 'info',
    cacheEnabled: true
  });
  
  const [apiKeys, setApiKeys] = useState([
    { id: '1', name: 'API Principal', key: 'sk_live_***************', status: 'active', created: '2024-01-15' },
    { id: '2', name: 'API Desarrollo', key: 'sk_test_***************', status: 'active', created: '2024-01-10' },
    { id: '3', name: 'API Webhook', key: 'whk_***************', status: 'inactive', created: '2024-01-05' }
  ]);
  
  const [backupHistory, setBackupHistory] = useState([
    { id: '1', name: 'backup_2024_01_20.sql', size: '45.2 MB', date: '2024-01-20 03:00', status: 'completed' },
    { id: '2', name: 'backup_2024_01_19.sql', size: '44.8 MB', date: '2024-01-19 03:00', status: 'completed' },
    { id: '3', name: 'backup_2024_01_18.sql', size: '44.1 MB', date: '2024-01-18 03:00', status: 'completed' }
  ]);

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'security', name: 'Seguridad', icon: Shield },
    { id: 'notifications', name: 'Notificaciones', icon: Bell },
    { id: 'appearance', name: 'Apariencia', icon: Palette },
    { id: 'system', name: 'Sistema', icon: Database },
    { id: 'api', name: 'API Keys', icon: Key },
    { id: 'backup', name: 'Respaldos', icon: HardDrive }
  ];
  
  // Funciones CRUD
  const handleSaveSettings = (settingsType, newSettings) => {
    switch(settingsType) {
      case 'general':
        setGeneralSettings(newSettings);
        break;
      case 'security':
        setSecuritySettings(newSettings);
        break;
      case 'notifications':
        setNotificationSettings(newSettings);
        break;
      case 'appearance':
        setAppearanceSettings(newSettings);
        break;
      case 'system':
        setSystemSettings(newSettings);
        break;
    }
    alert('Configuración guardada exitosamente');
  };
  
  const handleCreateApiKey = (keyData) => {
    const newKey = {
      id: Date.now().toString(),
      ...keyData,
      key: `sk_${keyData.type}_${Math.random().toString(36).substring(2, 15)}`,
      status: 'active',
      created: new Date().toISOString().split('T')[0]
    };
    setApiKeys([...apiKeys, newKey]);
    setShowModal(false);
    alert('API Key creada exitosamente');
  };
  
  const handleEditApiKey = (id, keyData) => {
    setApiKeys(apiKeys.map(key => 
      key.id === id ? { ...key, ...keyData } : key
    ));
    setShowModal(false);
    setEditingItem(null);
    alert('API Key actualizada exitosamente');
  };
  
  const handleDeleteApiKey = (id) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta API Key?')) {
      setApiKeys(apiKeys.filter(key => key.id !== id));
      alert('API Key eliminada exitosamente');
    }
  };
  
  const handleCreateBackup = () => {
    const newBackup = {
      id: Date.now().toString(),
      name: `backup_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.sql`,
      size: `${(Math.random() * 50 + 40).toFixed(1)} MB`,
      date: new Date().toLocaleString('es-ES'),
      status: 'completed'
    };
    setBackupHistory([newBackup, ...backupHistory]);
    alert('Respaldo creado exitosamente');
  };
  
  const handleDeleteBackup = (id) => {
    if (confirm('¿Estás seguro de que quieres eliminar este respaldo?')) {
      setBackupHistory(backupHistory.filter(backup => backup.id !== id));
      alert('Respaldo eliminado exitosamente');
    }
  };
  
  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    setShowModal(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Configuración General</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Empresa
                  </label>
                  <input
                    type="text"
                    value={generalSettings.companyName}
                    onChange={(e) => setGeneralSettings({...generalSettings, companyName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de Contacto
                  </label>
                  <input
                    type="email"
                    value={generalSettings.companyEmail}
                    onChange={(e) => setGeneralSettings({...generalSettings, companyEmail: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={generalSettings.companyPhone}
                    onChange={(e) => setGeneralSettings({...generalSettings, companyPhone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Moneda
                  </label>
                  <select 
                    value={generalSettings.currency}
                    onChange={(e) => setGeneralSettings({...generalSettings, currency: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD - Dólar Americano</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="MXN">MXN - Peso Mexicano</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zona Horaria
                  </label>
                  <select 
                    value={generalSettings.timezone}
                    onChange={(e) => setGeneralSettings({...generalSettings, timezone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="America/Mexico_City">America/Mexico_City</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Europe/Madrid">Europe/Madrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Idioma
                  </label>
                  <select 
                    value={generalSettings.language}
                    onChange={(e) => setGeneralSettings({...generalSettings, language: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Configuración de Seguridad</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Autenticación de Dos Factores</h4>
                    <p className="text-sm text-gray-600">Añade una capa extra de seguridad</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Sesiones Múltiples</h4>
                    <p className="text-sm text-gray-600">Permitir múltiples sesiones activas</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiempo de Sesión (minutos)
                  </label>
                  <input
                    type="number"
                    defaultValue="120"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Configuración de Notificaciones</h3>
              <div className="space-y-4">
                {[
                  { title: 'Nuevas Ventas', desc: 'Notificar cuando se registre una nueva venta' },
                  { title: 'Stock Bajo', desc: 'Alertas cuando el inventario esté bajo' },
                  { title: 'Nuevos Usuarios', desc: 'Notificar registro de nuevos usuarios' },
                  { title: 'Reportes', desc: 'Notificaciones de reportes generados' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={index < 2} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Configuración de Apariencia</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tema
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Claro', 'Oscuro', 'Automático'].map((theme) => (
                      <label key={theme} className="relative">
                        <input
                          type="radio"
                          name="theme"
                          defaultChecked={theme === 'Claro'}
                          className="sr-only peer"
                        />
                        <div className="p-4 border-2 border-gray-200 rounded-lg cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-50">
                          <div className="text-center">
                            <div className={`w-8 h-8 mx-auto mb-2 rounded ${
                              theme === 'Claro' ? 'bg-white border-2 border-gray-300' :
                              theme === 'Oscuro' ? 'bg-gray-800' : 'bg-gradient-to-r from-white to-gray-800'
                            }`}></div>
                            <span className="text-sm font-medium">{theme}</span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color Principal
                  </label>
                  <div className="flex space-x-3">
                    {['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-orange-500'].map((color) => (
                      <label key={color} className="relative">
                        <input
                          type="radio"
                          name="color"
                          defaultChecked={color === 'bg-blue-500'}
                          className="sr-only peer"
                        />
                        <div className={`w-8 h-8 rounded-full cursor-pointer ${color} peer-checked:ring-4 peer-checked:ring-offset-2 peer-checked:ring-gray-300`}></div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'system':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Configuración del Sistema</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Respaldo Automático</h4>
                    <p className="text-sm text-gray-600">Crear respaldos automáticos del sistema</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={systemSettings.autoBackup}
                      onChange={(e) => setSystemSettings({...systemSettings, autoBackup: e.target.checked})}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Modo de Mantenimiento</h4>
                    <p className="text-sm text-gray-600">Activar modo de mantenimiento del sistema</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={systemSettings.maintenanceMode}
                      onChange={(e) => setSystemSettings({...systemSettings, maintenanceMode: e.target.checked})}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frecuencia de Respaldo
                  </label>
                  <select 
                    value={systemSettings.backupFrequency}
                    onChange={(e) => setSystemSettings({...systemSettings, backupFrequency: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="hourly">Cada Hora</option>
                    <option value="daily">Diario</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'api':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">API Keys</h3>
              <button 
                onClick={() => openModal('createApiKey')}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva API Key</span>
              </button>
            </div>
            
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creada</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {apiKeys.map((key) => (
                    <tr key={key.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{key.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{key.key}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          key.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {key.status === 'active' ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{key.created}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => openModal('editApiKey', key)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteApiKey(key.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case 'backup':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Historial de Respaldos</h3>
              <button 
                onClick={handleCreateBackup}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                <span>Crear Respaldo</span>
              </button>
            </div>
            
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Archivo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tamaño</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {backupHistory.map((backup) => (
                    <tr key={backup.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{backup.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{backup.size}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{backup.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          backup.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {backup.status === 'completed' ? 'Completado' : 'En Proceso'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Download className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteBackup(backup.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <Settings className="w-8 h-8 text-blue-600" />
          <span>Configuración del Sistema</span>
        </h1>
        <p className="text-gray-600 mt-1">Personaliza y configura el sistema</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
          
          {/* Save Button */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-end">
              <button 
                onClick={() => handleSaveSettings(activeTab, 
                  activeTab === 'general' ? generalSettings :
                  activeTab === 'security' ? securitySettings :
                  activeTab === 'notifications' ? notificationSettings :
                  activeTab === 'appearance' ? appearanceSettings :
                  activeTab === 'system' ? systemSettings : {}
                )}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
         </div>
       </div>
       
       {/* Modal para API Keys */}
       {showModal && (modalType === 'createApiKey' || modalType === 'editApiKey') && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-md">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-semibold">
                 {modalType === 'createApiKey' ? 'Nueva API Key' : 'Editar API Key'}
               </h3>
               <button 
                 onClick={() => setShowModal(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <X className="w-5 h-5" />
               </button>
             </div>
             
             <form onSubmit={(e) => {
               e.preventDefault();
               const formData = new FormData(e.target);
               const keyData = {
                 name: formData.get('name'),
                 type: formData.get('type')
               };
               
               if (modalType === 'createApiKey') {
                 handleCreateApiKey(keyData);
               } else {
                 handleEditApiKey(editingItem.id, keyData);
               }
             }}>
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Nombre de la API Key
                   </label>
                   <input
                     type="text"
                     name="name"
                     defaultValue={editingItem?.name || ''}
                     className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     required
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Tipo
                   </label>
                   <select
                     name="type"
                     className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     required
                   >
                     <option value="live">Producción</option>
                     <option value="test">Desarrollo</option>
                     <option value="webhook">Webhook</option>
                   </select>
                 </div>
               </div>
               
               <div className="flex justify-end space-x-3 mt-6">
                 <button
                   type="button"
                   onClick={() => setShowModal(false)}
                   className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                 >
                   Cancelar
                 </button>
                 <button
                   type="submit"
                   className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                 >
                   <Save className="w-4 h-4" />
                   <span>{modalType === 'createApiKey' ? 'Crear' : 'Actualizar'}</span>
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}
     </div>
   );
 }