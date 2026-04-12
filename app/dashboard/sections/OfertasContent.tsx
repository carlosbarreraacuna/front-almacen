'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Tag,
  Search,
  Save,
  X,
  CheckSquare,
  Square,
  AlertCircle,
  Percent,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { productApi, categoryApi, ApiProduct } from '../../services/api';

const fmt = (v: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(v);

interface OfertaRow {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  discount_percentage: number;
  pendingDiscount: number; // valor editado sin guardar
  stock: number;
}

type SortKey = 'name' | 'price' | 'discount_percentage' | 'category';
type SortDir = 'asc' | 'desc';

export default function OfertasContent() {
  const [rows, setRows] = useState<OfertaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterOnSale, setFilterOnSale] = useState(true);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkDiscount, setBulkDiscount] = useState('');

  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'name', dir: 'asc' });

  // ── Carga ──────────────────────────────────────────────────────────────────
  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [prodRes, catRes] = await Promise.all([
        productApi.getProducts({ per_page: 1000 }),
        categoryApi.getCategories(),
      ]);

      if (prodRes?.success) {
        const arr: ApiProduct[] = Array.isArray(prodRes.data?.data)
          ? prodRes.data.data
          : Array.isArray(prodRes.data)
          ? prodRes.data
          : [];

        setRows(
          arr.map((p) => {
            const disc = Math.max(0, Math.min(100, Number(p.discount_percentage ?? 0)));
            return {
              id: p.id,
              name: p.name,
              sku: p.sku,
              category: p.category?.name ?? 'Sin categoría',
              price: Number(p.unit_price ?? 0),
              discount_percentage: disc,
              pendingDiscount: disc,
              stock: Number(p.stock_quantity ?? 0),
            };
          }),
        );
      }

      const catPage = catRes?.data;
      const catArr = Array.isArray(catPage?.data) ? catPage.data : Array.isArray(catRes?.data) ? catRes.data : [];
      setCategories(catArr.map((c: any) => ({ id: c.id, name: c.name })));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Filtros + ordenamiento ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (s && !r.name.toLowerCase().includes(s) && !r.sku.toLowerCase().includes(s)) return false;
        if (filterCategory && r.category !== filterCategory) return false;
        if (filterOnSale && r.pendingDiscount === 0) return false;
        return true;
      })
      .sort((a, b) => {
        const dir = sort.dir === 'asc' ? 1 : -1;
        if (sort.key === 'name') return dir * a.name.localeCompare(b.name);
        if (sort.key === 'category') return dir * a.category.localeCompare(b.category);
        return dir * (a[sort.key] - b[sort.key]);
      });
  }, [rows, search, filterCategory, filterOnSale, sort]);

  // ── Selección ─────────────────────────────────────────────────────────────
  const toggleOne = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () => {
    const allIds = filtered.map((r) => r.id);
    const allSelected = allIds.every((id) => selected.has(id));
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        allIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => new Set([...prev, ...allIds]));
    }
  };

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  // ── Edición inline ────────────────────────────────────────────────────────
  const setRowDiscount = (id: number, value: number) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, pendingDiscount: Math.min(100, Math.max(0, value)) } : r)),
    );
  };

  // ── Descuento masivo ──────────────────────────────────────────────────────
  const applyBulk = () => {
    const pct = Math.min(100, Math.max(0, parseFloat(bulkDiscount) || 0));
    setRows((prev) =>
      prev.map((r) => (selected.has(r.id) ? { ...r, pendingDiscount: pct } : r)),
    );
    setBulkDiscount('');
  };

  const clearBulk = () => {
    setRows((prev) =>
      prev.map((r) => (selected.has(r.id) ? { ...r, pendingDiscount: 0 } : r)),
    );
  };

  // ── Guardar cambios pendientes ─────────────────────────────────────────────
  const saveChanges = async () => {
    const dirty = rows.filter((r) => r.pendingDiscount !== r.discount_percentage);
    if (dirty.length === 0) return;

    try {
      setSaving(true);
      setError(null);
      await Promise.all(
        dirty.map((r) =>
          productApi.updateProduct(r.id, { discount_percentage: r.pendingDiscount }),
        ),
      );
      setRows((prev) =>
        prev.map((r) =>
          dirty.find((d) => d.id === r.id)
            ? { ...r, discount_percentage: r.pendingDiscount }
            : r,
        ),
      );
      setSelected(new Set());
      setSuccess(`${dirty.length} producto(s) actualizados correctamente.`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const dirtyCount = rows.filter((r) => r.pendingDiscount !== r.discount_percentage).length;

  // ── Ordenar ────────────────────────────────────────────────────────────────
  const toggleSort = (key: SortKey) =>
    setSort((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));

  const SortIcon = ({ k }: { k: SortKey }) =>
    sort.key === k ? (
      sort.dir === 'asc' ? <ChevronUp className="w-3.5 h-3.5 inline ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 inline ml-0.5" />
    ) : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <Tag className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Gestión de Ofertas</h1>
            <p className="text-sm text-gray-500">
              Selecciona referencias y aplica descuentos para la tienda en línea
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Recargar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {dirtyCount > 0 && (
            <button
              onClick={saveChanges}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium text-sm"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar {dirtyCount} cambio{dirtyCount !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          <Save className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Barra de herramientas */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o referencia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={filterOnSale}
              onChange={(e) => setFilterOnSale(e.target.checked)}
              className="w-4 h-4 accent-red-600"
            />
            Solo en oferta
          </label>
        </div>

        {/* Acciones masivas (visible cuando hay selección) */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm font-medium text-blue-700">
              {selected.size} referencia{selected.size !== 1 ? 's' : ''} seleccionada{selected.size !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              <div className="flex items-center gap-1">
                <Percent className="w-4 h-4 text-blue-600" />
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="% descuento"
                  value={bulkDiscount}
                  onChange={(e) => setBulkDiscount(e.target.value)}
                  className="w-28 px-2 py-1.5 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && applyBulk()}
                />
              </div>
              <button
                onClick={applyBulk}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 font-medium"
              >
                Aplicar descuento
              </button>
              <button
                onClick={clearBulk}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
              >
                Quitar descuentos
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg"
                title="Deseleccionar todo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Cargando productos...</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleAll}>
                    {allFilteredSelected
                      ? <CheckSquare className="w-4 h-4 text-blue-600" />
                      : <Square className="w-4 h-4 text-gray-400" />}
                  </button>
                </th>
                <th
                  className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:text-gray-900"
                  onClick={() => toggleSort('name')}
                >
                  Producto <SortIcon k="name" />
                </th>
                <th
                  className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:text-gray-900 hidden md:table-cell"
                  onClick={() => toggleSort('category')}
                >
                  Categoría <SortIcon k="category" />
                </th>
                <th
                  className="px-4 py-3 text-right font-semibold text-gray-700 cursor-pointer hover:text-gray-900"
                  onClick={() => toggleSort('price')}
                >
                  Precio <SortIcon k="price" />
                </th>
                <th
                  className="px-4 py-3 text-center font-semibold text-gray-700 cursor-pointer hover:text-gray-900"
                  onClick={() => toggleSort('discount_percentage')}
                >
                  Descuento <SortIcon k="discount_percentage" />
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Precio oferta</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Vista previa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No se encontraron productos
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const isDirty = row.pendingDiscount !== row.discount_percentage;
                  const offerPrice =
                    row.pendingDiscount > 0
                      ? Math.round(row.price * (1 - row.pendingDiscount / 100))
                      : null;
                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        isDirty ? 'bg-yellow-50' : ''
                      } ${selected.has(row.id) ? 'bg-blue-50 hover:bg-blue-50' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3">
                        <button onClick={() => toggleOne(row.id)}>
                          {selected.has(row.id)
                            ? <CheckSquare className="w-4 h-4 text-blue-600" />
                            : <Square className="w-4 h-4 text-gray-400" />}
                        </button>
                      </td>

                      {/* Producto */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 leading-tight">{row.name}</p>
                        <p className="text-xs text-gray-400">{row.sku}</p>
                      </td>

                      {/* Categoría */}
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{row.category}</td>

                      {/* Precio original */}
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {fmt(row.price)}
                      </td>

                      {/* Input de descuento */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={row.pendingDiscount}
                            onChange={(e) =>
                              setRowDiscount(row.id, parseFloat(e.target.value) || 0)
                            }
                            className={`w-16 text-center px-2 py-1 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${
                              isDirty ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
                            }`}
                          />
                          <span className="text-gray-500 text-sm">%</span>
                        </div>
                      </td>

                      {/* Precio oferta calculado */}
                      <td className="px-4 py-3 text-right">
                        {offerPrice !== null ? (
                          <span className="font-bold text-red-600">{fmt(offerPrice)}</span>
                        ) : (
                          <span className="text-gray-400 text-xs">Sin descuento</span>
                        )}
                      </td>

                      {/* Vista previa estilo tienda */}
                      <td className="px-4 py-3">
                        {row.pendingDiscount > 0 ? (
                          <div className="flex items-center gap-1.5 justify-center flex-wrap">
                            <span className="font-bold text-gray-900 text-xs">{fmt(offerPrice!)}</span>
                            <span className="text-xs text-gray-400 line-through">{fmt(row.price)}</span>
                            <span className="text-xs font-bold text-red-600 bg-red-50 px-1 py-0.5 rounded">
                              -{row.pendingDiscount}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs text-center block">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {/* Footer con contadores */}
        {!loading && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
            <span>
              {filtered.length} producto{filtered.length !== 1 ? 's' : ''} mostrado{filtered.length !== 1 ? 's' : ''}
              {rows.filter((r) => r.discount_percentage > 0).length > 0 && (
                <> · <span className="text-red-600 font-medium">{rows.filter((r) => r.discount_percentage > 0).length} en oferta activa</span></>
              )}
            </span>
            {dirtyCount > 0 && (
              <span className="text-yellow-700 font-medium">
                {dirtyCount} cambio{dirtyCount !== 1 ? 's' : ''} sin guardar
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
