'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { brandApi } from '@/app/services/api'; // ajusta la ruta según tu proyecto

type Brand = {
  id: number;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  website?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

type FormState = Omit<Brand, 'id' | 'created_at' | 'updated_at'>;

const emptyForm: FormState = {
  name: '',
  description: '',
  logo_url: '',
  website: '',
  contact_email: '',
  contact_phone: '',
  is_active: true,
};

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);

  // búsqueda / paginación
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // modal form
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // confirm delete
  const [openConfirm, setOpenConfirm] = useState(false);
  const [toDelete, setToDelete] = useState<Brand | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await brandApi.getBrands();
      const data: Brand[] = res?.data?.data ?? [];
      setBrands(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) =>
      [b.name, b.description, b.website, b.contact_email, b.contact_phone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [brands, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setOpenForm(true);
  };

  const openEdit = (b: Brand) => {
    setEditing(b);
    setForm({
      name: b.name ?? '',
      description: b.description ?? '',
      logo_url: b.logo_url ?? '',
      website: b.website ?? '',
      contact_email: b.contact_email ?? '',
      contact_phone: b.contact_phone ?? '',
      is_active: !!b.is_active,
    });
    setErrors({});
    setOpenForm(true);
  };

  const validate = (f: FormState) => {
    const e: Record<string, string> = {};
    if (!f.name?.trim()) e.name = 'El nombre es obligatorio';
    if (f.website && !/^https?:\/\//i.test(f.website)) e.website = 'Debe iniciar con http:// o https://';
    if (f.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.contact_email)) e.contact_email = 'Correo no válido';
    if (f.contact_phone && !/^[\d\-\+\s\(\)]+$/.test(f.contact_phone)) e.contact_phone = 'Teléfono no válido';
    return e;
  };

  const onSubmit = async () => {
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        logo_url: form.logo_url,
        website: form.website,
        contact_email: form.contact_email,
        contact_phone: form.contact_phone,
        is_active: form.is_active,
      };
      if (editing) {
        await brandApi.updateBrand(editing.id, payload);
      } else {
        await brandApi.createBrand(payload);
      }
      setOpenForm(false);
      setEditing(null);
      setForm(emptyForm);
      fetchBrands();
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (b: Brand) => {
    setToDelete(b);
    setOpenConfirm(true);
  };

  const onDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await brandApi.deleteBrand(toDelete.id);
      setOpenConfirm(false);
      setToDelete(null);
      fetchBrands();
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (b: Brand) => {
    // simple toggle local + update
    const next = { ...b, is_active: !b.is_active };
    setBrands((prev) => prev.map((x) => (x.id === b.id ? next : x)));
    try {
      await brandApi.updateBrand(b.id, { is_active: next.is_active, name: b.name }); // name requerido por backend
    } catch {
      // rollback simple
      setBrands((prev) => prev.map((x) => (x.id === b.id ? b : x)));
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Marcas</h1>
          <p className="text-sm text-gray-500">Crea, edita y administra la información de tus marcas.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-black"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Nueva marca
        </button>
      </div>

      {/* Buscador */}
      <div className="rounded-xl border bg-white p-4">
        <div className="relative max-w-md">
          <input
            className="w-full rounded-lg border px-10 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
            placeholder="Buscar por nombre, web, correo, teléfono…"
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
        <table className="min-w-[960px] w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="p-3 font-semibold">Logo</th>
              <th className="p-3 font-semibold">Nombre</th>
              <th className="p-3 font-semibold">Descripción</th>
              <th className="p-3 font-semibold">Sitio web</th>
              <th className="p-3 font-semibold">Contacto</th>
              <th className="p-3 font-semibold">Estado</th>
              <th className="p-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  <span className="inline-flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Cargando marcas…
                  </span>
                </td>
              </tr>
            ) : current.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">No hay resultados.</td>
              </tr>
            ) : current.map((b) => (
              <tr key={b.id} className="border-t hover:bg-gray-50/60">
                <td className="p-3">
                  {b.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.logo_url} alt={b.name} className="h-10 w-10 rounded bg-white object-contain ring-1 ring-gray-200" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-gray-400 ring-1 ring-gray-200">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M4 5h16v14H4z" stroke="currentColor" strokeWidth="2"/><path d="M4 16l4-4 3 3 5-5 4 4" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
                    </div>
                  )}
                </td>
                <td className="p-3 font-medium text-gray-900">{b.name}</td>
                <td className="p-3 max-w-[320px]">
                  <span className="line-clamp-2 text-gray-500">{b.description || '—'}</span>
                </td>
                <td className="p-3">
                  {b.website ? (
                    <a href={b.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"><path d="M14 3h7v7M10 14L21 3M5 5h6M3 7h8M5 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                      Visitar
                    </a>
                  ) : '—'}
                </td>
                <td className="p-3 text-gray-600">
                  <div className="space-y-1">
                    {b.contact_email ? (
                      <a className="block hover:underline" href={`mailto:${b.contact_email}`}>{b.contact_email}</a>
                    ) : null}
                    {b.contact_phone ? (
                      <a className="block hover:underline" href={`tel:${b.contact_phone}`}>{b.contact_phone}</a>
                    ) : null}
                    {!b.contact_email && !b.contact_phone ? '—' : null}
                  </div>
                </td>
                <td className="p-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${b.is_active ? 'bg-green-50 text-green-700 ring-green-200' : 'bg-gray-100 text-gray-600 ring-gray-300'}`}>
                    {b.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-2">
                    {/* Toggle activo */}
                    <button
                      onClick={() => toggleActive(b)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                        b.is_active ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                      aria-label="Cambiar estado"
                      title="Cambiar estado"
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                          b.is_active ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>

                    {/* Editar */}
                    <button
                      onClick={() => openEdit(b)}
                      className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"><path d="M4 21h4l11-11a2.828 2.828 0 1 0-4-4L4 17v4z" stroke="currentColor" strokeWidth="2"/></svg>
                      Editar
                    </button>

                    {/* Eliminar */}
                    <button
                      onClick={() => confirmDelete(b)}
                      className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Mostrando <b className="text-gray-700">{current.length}</b> de <b className="text-gray-700">{filtered.length}</b> marcas
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">Página {page} de {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* Modal Form */}
      {openForm && (
        <Modal onClose={() => setOpenForm(false)} title={editing ? 'Editar marca' : 'Nueva marca'}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Nombre" required error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Yamaha"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
              />
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

            <Field label="Descripción" full>
              <textarea
                rows={3}
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Breve descripción…"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
              />
            </Field>

            <Field label="Logo (URL)">
              <input
                value={form.logo_url ?? ''}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                placeholder="https://…/logo.png"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
              />
            </Field>

            <Field label="Sitio web" error={errors.website}>
              <input
                value={form.website ?? ''}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://www.ejemplo.com"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
              />
            </Field>

            <Field label="Correo de contacto" error={errors.contact_email}>
              <input
                value={form.contact_email ?? ''}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                placeholder="contacto@marca.com"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
              />
            </Field>

            <Field label="Teléfono de contacto" error={errors.contact_phone}>
              <input
                value={form.contact_phone ?? ''}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                placeholder="+57 300 000 0000"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
              />
            </Field>

            {/* preview */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Previsualización de logo</label>
              <div className="mt-2 flex h-16 w-16 items-center justify-center rounded border bg-white">
                {form.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logo_url} alt="logo preview" className="h-16 w-16 object-contain" />
                ) : (
                  <svg className="h-6 w-6 text-gray-400" viewBox="0 0 24 24" fill="none"><path d="M4 5h16v14H4z" stroke="currentColor" strokeWidth="2"/><path d="M4 16l4-4 3 3 5-5 4 4" stroke="currentColor" strokeWidth="2"/></svg>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              onClick={() => setOpenForm(false)}
              className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={onSubmit}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-black disabled:opacity-50"
            >
              {saving && <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              {editing ? 'Guardar cambios' : 'Crear marca'}
            </button>
          </div>
        </Modal>
      )}

      {/* Confirmación Eliminar */}
      {openConfirm && (
        <Modal onClose={() => setOpenConfirm(false)} title="Eliminar marca">
          <p className="text-sm text-gray-600">
            Esta acción no se puede deshacer. ¿Seguro que deseas eliminar <b className="text-gray-800">{toDelete?.name}</b>?
          </p>
          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              onClick={() => setOpenConfirm(false)}
              className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={onDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting && <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              Eliminar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------- Componentes UI básicos (Tailwind puros) ---------- */

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  // cierre al presionar ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
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

function Field({
  label,
  required,
  error,
  children,
  full,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  full?: boolean;
}) {
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
