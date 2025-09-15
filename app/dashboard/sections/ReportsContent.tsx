'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  Download, 
  Calendar, 
  BarChart3, 
  PieChart, 
  FileText, 
  Filter,
  Search,
  Eye,
  RefreshCw,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  AlertTriangle
} from 'lucide-react';

interface ReportData {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
  status: 'completed' | 'processing' | 'failed';
  description: string;
}

interface DashboardMetric {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
}

export default function ReportsContent() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'analytics'>('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReportType, setSelectedReportType] = useState('all');

  // Mock data para métricas del dashboard
  const dashboardMetrics: DashboardMetric[] = [
    {
      title: 'Ventas Totales',
      value: '$125,430',
      change: '+12.5%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'green'
    },
    {
      title: 'Productos Vendidos',
      value: '2,847',
      change: '+8.2%',
      changeType: 'positive',
      icon: Package,
      color: 'blue'
    },
    {
      title: 'Clientes Activos',
      value: '1,234',
      change: '+15.3%',
      changeType: 'positive',
      icon: Users,
      color: 'purple'
    },
    {
      title: 'Órdenes Pendientes',
      value: '23',
      change: '-5.1%',
      changeType: 'negative',
      icon: AlertTriangle,
      color: 'orange'
    }
  ];

  // Mock data para reportes
  const reportsData: ReportData[] = [
    {
      id: '1',
      name: 'Reporte de Ventas Mensual',
      type: 'sales',
      date: '2024-01-20',
      size: '2.3 MB',
      status: 'completed',
      description: 'Análisis completo de ventas del mes actual'
    },
    {
      id: '2',
      name: 'Inventario por Categorías',
      type: 'inventory',
      date: '2024-01-19',
      size: '1.8 MB',
      status: 'completed',
      description: 'Estado actual del inventario por categorías'
    },
    {
      id: '3',
      name: 'Análisis de Clientes',
      type: 'customers',
      date: '2024-01-18',
      size: '945 KB',
      status: 'processing',
      description: 'Comportamiento y segmentación de clientes'
    },
    {
      id: '4',
      name: 'Productos Más Vendidos',
      type: 'products',
      date: '2024-01-17',
      size: '1.2 MB',
      status: 'completed',
      description: 'Top 50 productos con mejor rendimiento'
    },
    {
      id: '5',
      name: 'Reporte Financiero',
      type: 'financial',
      date: '2024-01-16',
      size: '3.1 MB',
      status: 'failed',
      description: 'Estado financiero y flujo de caja'
    }
  ];

  const reportTypes = [
    { value: 'all', label: 'Todos los Reportes' },
    { value: 'sales', label: 'Ventas' },
    { value: 'inventory', label: 'Inventario' },
    { value: 'customers', label: 'Clientes' },
    { value: 'products', label: 'Productos' },
    { value: 'financial', label: 'Financiero' }
  ];

  const filteredReports = reportsData.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedReportType === 'all' || report.type === selectedReportType;
    return matchesSearch && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'processing': return 'Procesando';
      case 'failed': return 'Fallido';
      default: return 'Desconocido';
    }
  };

  const generateReport = (type: string) => {
    alert(`Generando reporte de ${type}...`);
  };

  const downloadReport = (reportId: string) => {
    alert(`Descargando reporte ${reportId}...`);
  };

  const viewReport = (reportId: string) => {
    alert(`Visualizando reporte ${reportId}...`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <span>Reportes y Analytics</span>
          </h1>
          <p className="text-gray-600 mt-1">Dashboard de reportes y análisis del sistema</p>
        </div>
        <div className="flex items-center space-x-3">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="day">Hoy</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mes</option>
            <option value="quarter">Este Trimestre</option>
            <option value="year">Este Año</option>
          </select>
          <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <RefreshCw className="w-4 h-4" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Reportes
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Analytics
          </button>
        </nav>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{metric.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                      <p className={`text-sm ${
                        metric.changeType === 'positive' ? 'text-green-600' :
                        metric.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {metric.change}
                      </p>
                    </div>
                    <div className={`p-3 bg-${metric.color}-100 rounded-lg`}>
                      <Icon className={`w-6 h-6 text-${metric.color}-600`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gráficos del dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Ventas por Mes</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                  <p>Gráfico de ventas mensuales</p>
                  <p className="text-sm">Datos de los últimos 12 meses</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Distribución por Categorías</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center text-gray-500">
                  <PieChart className="w-12 h-12 mx-auto mb-2" />
                  <p>Gráfico circular</p>
                  <p className="text-sm">Ventas por categoría de producto</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tendencias */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Tendencias de Ventas</h3>
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center text-gray-500">
                <TrendingUp className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg font-medium">Gráfico de Tendencias</p>
                <p>Análisis de ventas en tiempo real</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Filtros y búsqueda */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar reportes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedReportType}
                  onChange={(e) => setSelectedReportType(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                >
                  {reportTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={() => generateReport('nuevo')}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <FileText className="w-4 h-4" />
                <span>Nuevo Reporte</span>
              </button>
            </div>
          </div>

          {/* Lista de reportes */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Reportes Disponibles</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <div key={report.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-lg font-medium text-gray-900">{report.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                          {getStatusText(report.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>Generado: {report.date}</span>
                        <span>Tamaño: {report.size}</span>
                        <span className="capitalize">Tipo: {report.type}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {report.status === 'completed' && (
                        <>
                          <button 
                            onClick={() => viewReport(report.id)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                            title="Ver reporte"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => downloadReport(report.id)}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                            title="Descargar reporte"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {report.status === 'processing' && (
                        <div className="flex items-center space-x-2 text-yellow-600">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Procesando...</span>
                        </div>
                      )}
                      {report.status === 'failed' && (
                        <button 
                          onClick={() => generateReport(report.type)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                        >
                          Reintentar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Generadores de reportes rápidos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Reporte de Ventas', desc: 'Análisis detallado de ventas por período', icon: BarChart3, color: 'blue', type: 'sales' },
              { title: 'Estado de Inventario', desc: 'Reporte completo del inventario actual', icon: Package, color: 'green', type: 'inventory' },
              { title: 'Análisis de Clientes', desc: 'Comportamiento y segmentación de clientes', icon: Users, color: 'purple', type: 'customers' },
              { title: 'Productos Top', desc: 'Productos más vendidos y rentables', icon: TrendingUp, color: 'orange', type: 'products' },
              { title: 'Reporte Financiero', desc: 'Estado financiero y flujo de caja', icon: DollarSign, color: 'emerald', type: 'financial' },
              { title: 'Análisis de Órdenes', desc: 'Estadísticas de órdenes de compra', icon: ShoppingCart, color: 'indigo', type: 'orders' }
            ].map((report, index) => {
              const Icon = report.icon;
              return (
                <div key={index} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                  <div className={`w-12 h-12 bg-${report.color}-100 rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 text-${report.color}-600`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{report.desc}</p>
                  <button 
                    onClick={() => generateReport(report.type)}
                    className={`w-full bg-${report.color}-600 text-white py-2 rounded-lg hover:bg-${report.color}-700 transition-colors`}
                  >
                    Generar Reporte
                  </button>
                </div>
              );
            })}
          </div>

          {/* Análisis avanzado */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Análisis Avanzado</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Configuración de Reportes</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Período de Análisis</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                      <option>Últimos 7 días</option>
                      <option>Últimos 30 días</option>
                      <option>Últimos 3 meses</option>
                      <option>Último año</option>
                      <option>Personalizado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Formato de Exportación</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                      <option>PDF</option>
                      <option>Excel (XLSX)</option>
                      <option>CSV</option>
                      <option>JSON</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm text-gray-700">Incluir gráficos</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm text-gray-700">Enviar por email</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Reportes Programados</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Reporte Semanal de Ventas</p>
                        <p className="text-xs text-gray-600">Cada lunes a las 9:00 AM</p>
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Inventario Mensual</p>
                        <p className="text-xs text-gray-600">Primer día del mes</p>
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2">
                    + Programar nuevo reporte
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}