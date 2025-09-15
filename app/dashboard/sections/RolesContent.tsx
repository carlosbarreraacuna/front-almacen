'use client';

import React, { useState } from 'react';
import { UserCheck, Plus, Shield, Users, Edit, Trash2, X, Save, AlertTriangle, Check } from 'lucide-react';

export default function RolesContent() {
  const [roles, setRoles] = useState([
    {
      id: 1,
      name: 'Administrador',
      description: 'Acceso completo al sistema',
      users: 2,
      permissions: ['Crear', 'Leer', 'Actualizar', 'Eliminar'],
      color: 'purple'
    },
    {
      id: 2,
      name: 'Gerente',
      description: 'Gestión de inventario y ventas',
      users: 3,
      permissions: ['Crear', 'Leer', 'Actualizar'],
      color: 'blue'
    },
    {
      id: 3,
      name: 'Empleado',
      description: 'Operaciones básicas de venta',
      users: 8,
      permissions: ['Leer', 'Crear ventas'],
      color: 'green'
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [deletingRole, setDeletingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'blue',
    permissions: []
  });

  const availablePermissions = [
    'Crear',
    'Leer',
    'Actualizar',
    'Eliminar',
    'Gestionar usuarios',
    'Ver reportes',
    'Configurar sistema',
    'Gestionar inventario',
    'Procesar ventas',
    'Gestionar proveedores'
  ];

  const colorOptions = [
    { value: 'purple', label: 'Púrpura', class: 'bg-purple-500' },
    { value: 'blue', label: 'Azul', class: 'bg-blue-500' },
    { value: 'green', label: 'Verde', class: 'bg-green-500' },
    { value: 'red', label: 'Rojo', class: 'bg-red-500' },
    { value: 'yellow', label: 'Amarillo', class: 'bg-yellow-500' },
    { value: 'indigo', label: 'Índigo', class: 'bg-indigo-500' }
  ];

  const handleCreateRole = () => {
    setFormData({
      name: '',
      description: '',
      color: 'blue',
      permissions: []
    });
    setShowCreateModal(true);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      color: role.color,
      permissions: [...role.permissions]
    });
    setShowEditModal(true);
  };

  const handleDeleteRole = (role) => {
    setDeletingRole(role);
    setShowDeleteModal(true);
  };

  const handleSubmitCreate = (e) => {
    e.preventDefault();
    const newRole = {
      id: Date.now(),
      ...formData,
      users: 0
    };
    setRoles([...roles, newRole]);
    setShowCreateModal(false);
    setFormData({
      name: '',
      description: '',
      color: 'blue',
      permissions: []
    });
  };

  const handleSubmitEdit = (e) => {
    e.preventDefault();
    const updatedRoles = roles.map(role => 
      role.id === editingRole.id 
        ? { ...role, ...formData }
        : role
    );
    setRoles(updatedRoles);
    setShowEditModal(false);
    setEditingRole(null);
  };

  const confirmDelete = () => {
    const updatedRoles = roles.filter(role => role.id !== deletingRole.id);
    setRoles(updatedRoles);
    setShowDeleteModal(false);
    setDeletingRole(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePermissionChange = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <UserCheck className="w-8 h-8 text-blue-600" />
            <span>Gestión de Roles</span>
          </h1>
          <p className="text-gray-600 mt-1">Administra roles y permisos del sistema</p>
        </div>
        <button 
          onClick={handleCreateRole}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Rol</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 bg-${role.color}-100 rounded-lg flex items-center justify-center`}>
                  <Shield className={`w-6 h-6 text-${role.color}-600`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button 
                  onClick={() => handleEditRole(role)}
                  className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteRole(role)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>Usuarios asignados</span>
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${role.color}-100 text-${role.color}-800`}>
                  {role.users}
                </span>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Permisos:</p>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.map((permission, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Matriz de Permisos</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Rol</th>
                <th className="text-center py-3 px-4">Usuarios</th>
                <th className="text-center py-3 px-4">Productos</th>
                <th className="text-center py-3 px-4">Ventas</th>
                <th className="text-center py-3 px-4">Reportes</th>
                <th className="text-center py-3 px-4">Sistema</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{role.name}</td>
                  <td className="text-center py-3 px-4">
                    <span className={`w-3 h-3 rounded-full inline-block ${
                      role.name === 'Administrador' ? 'bg-green-500' : 
                      role.name === 'Gerente' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`w-3 h-3 rounded-full inline-block ${
                      role.name !== 'Empleado' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="w-3 h-3 rounded-full inline-block bg-green-500"></span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`w-3 h-3 rounded-full inline-block ${
                      role.name === 'Administrador' ? 'bg-green-500' : 
                      role.name === 'Gerente' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`w-3 h-3 rounded-full inline-block ${
                      role.name === 'Administrador' ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span>Acceso completo</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span>Acceso limitado</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span>Sin acceso</span>
          </div>
        </div>
      </div>

      {/* Modal de Crear Rol */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Crear Nuevo Rol</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Rol</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <div className="flex space-x-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                      className={`w-8 h-8 rounded-full ${color.class} ${formData.color === color.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permisos</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {availablePermissions.map((permission) => (
                    <label key={permission} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission)}
                        onChange={() => handlePermissionChange(permission)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{permission}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Crear Rol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Editar Rol */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Editar Rol</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Rol</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <div className="flex space-x-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                      className={`w-8 h-8 rounded-full ${color.class} ${formData.color === color.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permisos</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {availablePermissions.map((permission) => (
                    <label key={permission} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission)}
                        onChange={() => handlePermissionChange(permission)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{permission}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Eliminar Rol */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Confirmar Eliminación
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-600">
                ¿Estás seguro de que deseas eliminar el rol <strong>{deletingRole?.name}</strong>?
              </p>
              <p className="text-sm text-red-600 mt-2">
                Esta acción no se puede deshacer y afectará a {deletingRole?.users} usuarios.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}