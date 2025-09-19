'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { categoryApi } from '@/app/services/api';

type Category = {
  id: number;
  name: string;
  description?: string | null;
  parent_id?: number | null;
  image_url?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  children_count?: number;
};

type FormState = {
  name: string;
  description?: string | null;
  parent_id?: number | null;
  image_url?: string | null;
  is_active: boolean;
  sort_order: number;
};

const emptyForm: FormState = {
  name: '',
  description: '',
  parent_id: null,
  image_url: '',
  is_active: true,
  sort_order: 0,
};

export default function CategoriesPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [parents, setParents] = useState<{id:number; name:string}[]>([]);
  const [loading, setLoading] = useState(false);

  // search + client-side pagination simple
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // modal
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // confirm delete
  const [openConfirm, setOpenConfirm] = useState(false);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [listRes, selRes] = await Promise.all([
        categoryApi.getCategories(),
        categoryApi.select(),
      ]);
      setRows(listRes?.data?.data ?? listRes?.data ?? []);
      setParents((selRes?.data?.data ?? []).map((x: any) => ({ id: x.id, name: x.name })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((c) =>
      [c.name, c.description, c.image_url]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [rows, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setOpenForm(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({
      name: c.name ?? '',
      description: c.description ?? '',
      parent_id: c.parent_id ?? null,
      image_url: c.image_url ?? '',
      is_active: !!c.is_active,
      sort_order: c.sort_order ?? 0,
    });
    setErrors({});
    setOpenForm(true);
  };

  const validate = (f: FormState) => {
    const e: Record<string,string> = {};
    if (!f.name?.trim()) e.name = 'El nombre es obligatorio';
    if (f.image_url && !/^https?:\/\//i.test(f.image_url)) e.image_url = 'Debe iniciar con http:// o https://';
    if (f.sort_order < 0) e.sort_order = 'Debe ser 0 o mayor';
    if (editing && editing.id === f.parent_id) e.parent_id = 'No puede ser su propio padre';
    return e;
    };

  const onSubmit = async () => {
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name || undefined,
        description: form.description || null,
        parent_id: form.parent_id ?? null,
        image_url: form.image_url || null,
        is_active: !!form.is_active,
        sort_order: Number.isFinite(form.sort_order) ? form.sort_order : 0,
      };

      if (editing) {
        await categoryApi.updateCategory(editing.id, payload);
      } else {
        await categoryApi.createCategory(payload);
      }

      setOpenForm(false);
      setEditing(null);
      setForm(emptyForm);
      fetchAll();
    } catch (err: any) {
      if (err?.status === 422 && err?.payload?.errors) {
        const serverErrors: Record<string, string> = {};
        Object.entries(err.payload.errors).forEach(([field, messages]: any) => {
          serverErrors[field] = Array.isArray(messages) ? messages[0] : String(messages);
        });
        setErrors(serverErrors);
      } else {
        alert('Error al guardar la categoría');
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: Category) => {
    const next = { ...c, is_active: !c.is_active };
    setRows((prev) => prev.map((x) => x.id === c.id ? next : x));
    try {
      await categoryApi.updateCategory(c.id, { is_active: next.is_active });
    } catch {
      setRows((prev) => prev.map((x) => x.id === c.id ? c : x));
    }
  };

  const confirmDelete = (c: Category) => {
    setToDelete(c);
    setOpenConfirm(true);
  };

  const onDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await categoryApi.deleteCategory(toDelete.id);
      setOpenConfirm(false);
      setToDelete(null);
      fetchAll();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Categorías</h1>
          <p className="text-sm text-gray-500">Crea, edita y organiza tus categorías.</p>
        </div>
        <button onClick={openCreate} className="rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-black">
          Nueva categoría
        </button>
      </div>

      {/* Buscador */}
      <div className="rounded-xl border bg-white p-4">
        <div className="relative max-w-md">
          <input
            className="w-full rounded-lg border px-10 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
            placeholder="Buscar por nombre o descripción…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none">
            <path d="M21 21l-4.3-4.3M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="p-3 font-semibold">Nombre</th>
              <th className="p-3 font-semibold">Padre</th>
              <th className="p-3 font-semibold">Descripción</th>
              <th className="p-3 font-semibold">Orden</th>
              <th className="p-3 font-semibold">Estado</th>
              <th className="p-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-6 text-center text-gray-500">Cargando…</td></tr>
            ) : current.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-gray-500">Sin resultados.</td></tr>
            ) : current.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50/60">
                <td className="p-3 font-medium text-gray-900">{c.name}</td>
                <td className="p-3 text-gray-600">{rows.find(r => r.id === c.parent_id)?.name ?? '—'}</td>
                <td className="p-3 max-w-[360px]"><span className="line-clamp-2 text-gray-500">{c.description || '—'}</span></td>
                <td className="p-3">{c.sort_order ?? 0}</td>
                <td className="p-3">
                  <button
                    onClick={() => toggleActive(c)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${c.is_active ? 'bg-green-600' : 'bg-gray-300'}`}
                    title="Cambiar estado"
                  >
                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${c.is_active ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(c)} className="rounded-lg border px-3 py-1.5 text-gray-700 hover:bg-gray-50">Editar</button>
                    <button onClick={() => confirmDelete(c)} className="rounded-lg bg-red-600 px-3 py-1.5 text-white hover:bg-red-700">Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Mostrando <b className="text-gray-700">{current.length}</b> de <b className="text-gray-700">{filtered.length}</b> categorías</p>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">Anterior</button>
          <span className="text-sm text-gray-600">Página {page} de {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">Siguiente</button>
        </div>
      </div>

      {/* Modal Form */}
      {openForm && (
        <Modal title={editing ? 'Editar categoría' : 'Nueva categoría'} onClose={() => setOpenForm(false)}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Nombre" required error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Aceites"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
              />
            </Field>

            <Field label="Padre" error={errors.parent_id}>
              <select
                value={form.parent_id ?? ''}
                onChange={(e) => setForm({ ...form, parent_id: e.target.value ? Number(e.target.value) : null })}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
              >
                <option value="">— Ninguno —</option>
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Estado">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${form.is_active ? 'bg-green-600' : 'bg-gray-300'}`}
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  aria-label="Cambiar estado"
                >
                  <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${form.is_active ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm text-gray-700">{form.is_active ? 'Activa' : 'Inactiva'}</span>
              </div>
            </Field>

            <Field label="Orden" error={errors.sort_order}>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
              />
            </Field>

            <Field label="Descripción" full error={errors.description}>
              <textarea
                rows={3}
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Breve descripción…"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
              />
            </Field>

            <Field label="Imagen (URL)" error={errors.image_url}>
              <input
                value={form.image_url ?? ''}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://…/imagen.png"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
              />
            </Field>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <button onClick={() => setOpenForm(false)} className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button onClick={onSubmit} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-black disabled:opacity-50">
              {saving && <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              {editing ? 'Guardar cambios' : 'Crear categoría'}
            </button>
          </div>
        </Modal>
      )}

      {/* Confirmación Eliminar */}
      {openConfirm && (
        <Modal title="Eliminar categoría" onClose={() => setOpenConfirm(false)}>
          <p className="text-sm text-gray-600">
            Esta acción no se puede deshacer. ¿Seguro que deseas eliminar <b className="text-gray-800">{toDelete?.name}</b>?
          </p>
          <div className="mt-6 flex items-center justify-end gap-2">
            <button onClick={() => setOpenConfirm(false)} className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button onClick={onDelete} disabled={deleting} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50">
              {deleting && <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              Eliminar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---- UI helpers (Modal/Field) ---- */
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  useEffect(() => { const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [onClose]);
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div role="dialog" aria-modal="true" className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5">
          <div className="mb-4 flex items-start justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button onClick={onClose} aria-label="Cerrar" className="rounded p-1 text-gray-500 hover:bg-gray-100">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, error, children, full }: { label: string; required?: boolean; error?: string; children: React.ReactNode; full?: boolean; }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
