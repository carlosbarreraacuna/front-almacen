'use client';
import React, { useEffect, useState } from 'react';
import { categoryApi } from '../../services/api';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<{ id: number, name: string } | null>(null);

  const fetchCategories = async () => {
    const res = await categoryApi.getCategories();
    setCategories(res.data?.data || []);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    await categoryApi.createCategory({ name });
    setName('');
    fetchCategories();
  };

  const handleEdit = (category: any) => {
    setEditing({ id: category.id, name: category.name });
  };

  const handleUpdate = async () => {
    if (!editing?.name.trim()) return;
    await categoryApi.updateCategory(editing.id, { name: editing.name });
    setEditing(null);
    fetchCategories();
  };

  const handleDelete = async (id: number) => {
    await categoryApi.deleteCategory(id);
    fetchCategories();
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Gestión de Categorías</h2>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={editing ? editing.name : name}
          onChange={e => editing
            ? setEditing({ ...editing, name: e.target.value })
            : setName(e.target.value)
          }
          placeholder="Nombre de la categoría"
          className="border px-3 py-2 rounded w-64"
        />
        {editing ? (
          <>
            <button onClick={handleUpdate} className="bg-blue-600 text-white px-4 py-2 rounded">Actualizar</button>
            <button onClick={() => setEditing(null)} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          </>
        ) : (
          <button onClick={handleCreate} className="bg-green-600 text-white px-4 py-2 rounded">Agregar</button>
        )}
      </div>
      <ul className="divide-y">
        {categories.map((category: any) => (
          <li key={category.id} className="py-2 flex justify-between items-center">
            <span>{category.name}</span>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(category)} className="text-blue-600">Editar</button>
              <button onClick={() => handleDelete(category.id)} className="text-red-600">Eliminar</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}