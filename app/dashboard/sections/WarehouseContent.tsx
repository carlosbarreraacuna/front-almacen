'use client';

import React, { useState } from 'react';
import { MapPin, Package, ArrowUpDown, Search, Plus, Edit, Trash2, Eye, X, Save } from 'lucide-react';

interface Location {
  id: number;
  code: string;
  name: string;
  type: 'zone' | 'aisle' | 'shelf' | 'bin';
  capacity: number;
  currentStock: number;
  parentLocation?: string;
  status: 'active' | 'inactive' | 'maintenance';
}

interface Movement {
  id: number;
  type: 'in' | 'out' | 'transfer';
  product: string;
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  date: string;
  user: string;
  reference: string;
}

export default function WarehouseContent() {
  const [activeTab, setActiveTab] = useState<'locations' | 'movements'>('locations');
  const [searchTerm, setSearchTerm] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [locationForm, setLocationForm] = useState({ code: '', name: '', type: 'shelf' as const, capacity: '', status: 'active' as const });
  const [movementForm, setMovementForm] = useState({ product: '', type: 'in' as const, quantity: '', location: '', reference: '' });

  // Mock data
  const [locations, setLocations] = useState<Location[]>([
    { id: 1, code: 'A-01-01', name: 'Zona A - Pasillo 1 - Estante 1', type: 'shelf', capacity: 100, currentStock: 75, parentLocation: 'Zona A', status: 'active' },
    { id: 2, code: 'A-01-02', name: 'Zona A - Pasillo 1 - Estante 2', type: 'shelf', capacity: 100, currentStock: 50, parentLocation: 'Zona A', status: 'active' },
    { id: 3, code: 'B-01-01', name: 'Zona B - Pasillo 1 - Estante 1', type: 'shelf', capacity: 150, currentStock: 120, parentLocation: 'Zona B', status: 'active' },
    { id: 4, code: 'C-01-01', name: 'Zona C - Pasillo 1 - Estante 1', type: 'shelf', capacity: 80, currentStock: 0, parentLocation: 'Zona C', status: 'maintenance' },
  ]);

  const [movements, setMovements] = useState<Movement[]>([
    { id: 1, type: 'in', product: 'Laptop Dell XPS 13', quantity: 10, toLocation: 'A-01-01', date: '2024-01-15 10:30', user: 'Juan Pérez', reference: 'PO-001' },
    { id: 2, type: 'out', product: 'Mouse Logitech', quantity: 5, fromLocation: 'A-01-02', date: '2024-01-15 11:45', user: 'María García', reference: 'SO-001' },
    { id: 3, type: 'transfer', product: 'Teclado Mecánico', quantity: 3, fromLocation: 'B-01-01', toLocation: 'A-01-01', date: '2024-01-15 14:20', user: 'Carlos López', reference: 'TR-001' },
  ]);

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMovements = movements.filter(movement =>
    movement.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movement.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'in': return 'bg-green-100 text-green-800';
      case 'out': return 'bg-red-100 text-red-800';
      case 'transfer': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'in': return 'Entrada';
      case 'out': return 'Salida';
      case 'transfer': return 'Transferencia';
      default: return type;
    }
  };

  // Funciones CRUD para ubicaciones
  const handleCreateLocation = () => {
    setEditingLocation(null);
    setLocationForm({ code: '', name: '', type: 'shelf', capacity: '', status: 'active' });
    setShowLocationModal(true);
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setLocationForm({
      code: location.code,
      name: location.name,
      type: location.type,
      capacity: location.capacity.toString(),
      status: location.status
    });
    setShowLocationModal(true);
  };

  const handleDeleteLocation = (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta ubicación?')) {
      setLocations(locations.filter(loc => loc.id !== id));
    }
  };

  const handleSaveLocation = () => {
    if (editingLocation) {
      setLocations(locations.map(loc => 
        loc.id === editingLocation.id 
          ? { ...loc, ...locationForm, capacity: parseInt(locationForm.capacity) }
          : loc
      ));
    } else {
      const newLocation: Location = {
        id: Math.max(...locations.map(l => l.id)) + 1,
        ...locationForm,
        capacity: parseInt(locationForm.capacity),
        currentStock: 0,
        parentLocation: locationForm.name.split(' - ')[0]
      };
      setLocations([...locations, newLocation]);
    }
    setShowLocationModal(false);
  };

  // Funciones CRUD para movimientos
  const handleCreateMovement = () => {
    setEditingMovement(null);
    setMovementForm({ product: '', type: 'in', quantity: '', location: '', reference: '' });
    setShowMovementModal(true);
  };

  const handleEditMovement = (movement: Movement) => {
    setEditingMovement(movement);
    setMovementForm({
      product: movement.product,
      type: movement.type,
      quantity: movement.quantity.toString(),
      location: movement.toLocation || movement.fromLocation || '',
      reference: movement.reference
    });
    setShowMovementModal(true);
  };

  const handleDeleteMovement = (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este movimiento?')) {
      setMovements(movements.filter(mov => mov.id !== id));
    }
  };

  const handleSaveMovement = () => {
    if (editingMovement) {
      setMovements(movements.map(mov => 
        mov.id === editingMovement.id 
          ? { 
              ...mov, 
              ...movementForm, 
              quantity: parseInt(movementForm.quantity),
              toLocation: movementForm.type === 'in' ? movementForm.location : undefined,
              fromLocation: movementForm.type === 'out' ? movementForm.location : undefined
            }
          : mov
      ));
    } else {
      const newMovement: Movement = {
        id: Math.max(...movements.map(m => m.id)) + 1,
        ...movementForm,
        quantity: parseInt(movementForm.quantity),
        toLocation: movementForm.type === 'in' ? movementForm.location : undefined,
        fromLocation: movementForm.type === 'out' ? movementForm.location : undefined,
        date: new Date().toISOString().slice(0, 16).replace('T', ' '),
        user: 'Usuario Actual'
      };
      setMovements([...movements, newMovement]);
    }
    setShowMovementModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Almacén</h1>
          <p className="text-gray-600">Administra ubicaciones y movimientos de inventario</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('locations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'locations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <MapPin className="w-4 h-4 inline mr-2" />
            Ubicaciones
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'movements'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ArrowUpDown className="w-4 h-4 inline mr-2" />
            Movimientos
          </button>
        </nav>
      </div>

      {/* Search and Actions */}
      <div className="flex justify-between items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={`Buscar ${activeTab === 'locations' ? 'ubicaciones' : 'movimientos'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => activeTab === 'locations' ? handleCreateLocation() : handleCreateMovement()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>{activeTab === 'locations' ? 'Nueva Ubicación' : 'Nuevo Movimiento'}</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'locations' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Actual</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLocations.map((location) => (
                <tr key={location.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{location.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{location.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{location.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{location.capacity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <span>{location.currentStock}</span>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${(location.currentStock / location.capacity) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(location.status)}`}>
                      {location.status === 'active' ? 'Activo' : location.status === 'inactive' ? 'Inactivo' : 'Mantenimiento'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditLocation(location)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteLocation(location.id)}
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
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destino</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referencia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMovements.map((movement) => (
                <tr key={movement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMovementTypeColor(movement.type)}`}>
                      {getMovementTypeLabel(movement.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{movement.product}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{movement.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{movement.fromLocation || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{movement.toLocation || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{movement.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{movement.user}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{movement.reference}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditMovement(movement)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteMovement(movement.id)}
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
      )}

      {/* Modal para Ubicaciones */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingLocation ? 'Editar Ubicación' : 'Nueva Ubicación'}
              </h3>
              <button 
                onClick={() => setShowLocationModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                <input
                  type="text"
                  value={locationForm.code}
                  onChange={(e) => setLocationForm({...locationForm, code: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: A-01-01"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={locationForm.name}
                  onChange={(e) => setLocationForm({...locationForm, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre de la ubicación"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={locationForm.type}
                  onChange={(e) => setLocationForm({...locationForm, type: e.target.value as any})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="zone">Zona</option>
                  <option value="aisle">Pasillo</option>
                  <option value="shelf">Estante</option>
                  <option value="bin">Contenedor</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
                <input
                  type="number"
                  value={locationForm.capacity}
                  onChange={(e) => setLocationForm({...locationForm, capacity: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={locationForm.status}
                  onChange={(e) => setLocationForm({...locationForm, status: e.target.value as any})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="maintenance">Mantenimiento</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowLocationModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveLocation}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Movimientos */}
      {showMovementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingMovement ? 'Editar Movimiento' : 'Nuevo Movimiento'}
              </h3>
              <button 
                onClick={() => setShowMovementModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                <input
                  type="text"
                  value={movementForm.product}
                  onChange={(e) => setMovementForm({...movementForm, product: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre del producto"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Movimiento</label>
                <select
                  value={movementForm.type}
                  onChange={(e) => setMovementForm({...movementForm, type: e.target.value as any})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="in">Entrada</option>
                  <option value="out">Salida</option>
                  <option value="transfer">Transferencia</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                <input
                  type="number"
                  value={movementForm.quantity}
                  onChange={(e) => setMovementForm({...movementForm, quantity: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                <select
                  value={movementForm.location}
                  onChange={(e) => setMovementForm({...movementForm, location: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar ubicación</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.code}>{location.code} - {location.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
                <input
                  type="text"
                  value={movementForm.reference}
                  onChange={(e) => setMovementForm({...movementForm, reference: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Referencia del movimiento"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowMovementModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveMovement}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}