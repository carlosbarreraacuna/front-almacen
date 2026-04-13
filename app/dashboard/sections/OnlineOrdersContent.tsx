'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag, Search, RefreshCw, ChevronDown, X, Save,
  Package, Truck, CheckCircle2, XCircle, Clock, CreditCard,
  Globe, Eye, AlertCircle, ChevronLeft, ChevronRight,
} from 'lucide-react';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// ── Types ──────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  price: string | number;
  subtotal: string | number;
}

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  subtotal: string | number;
  shipping_cost: string | number;
  total: string | number;
  payment_method: string | null;
  payment_reference: string | null;
  status: string;
  tracking_number: string | null;
  shipping_company: string | null;
  notes: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  items: OrderItem[];
}

interface Stats {
  total: number;
  pending: number;
  paid: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  revenue: string | number;
}

interface Meta { current_page: number; last_page: number; total: number; per_page: number; }

// ── Auth helper ────────────────────────────────────────────────────────────────

function h(): Record<string, string> {
  const t = Cookies.get('auth_token');
  return { 'Content-Type': 'application/json', Accept: 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { ...opts, headers: h() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error');
  return data;
}

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:    { label: 'Pendiente',   color: 'bg-yellow-100 text-yellow-700 border-yellow-200',  icon: Clock },
  paid:       { label: 'Pagado',      color: 'bg-blue-100 text-blue-700 border-blue-200',        icon: CreditCard },
  processing: { label: 'Procesando',  color: 'bg-purple-100 text-purple-700 border-purple-200',  icon: RefreshCw },
  shipped:    { label: 'Enviado',     color: 'bg-amber-100 text-amber-700 border-amber-200',     icon: Truck },
  delivered:  { label: 'Entregado',   color: 'bg-green-100 text-green-700 border-green-200',     icon: CheckCircle2 },
  cancelled:  { label: 'Cancelado',   color: 'bg-red-100 text-red-700 border-red-200',           icon: XCircle },
};

const ALL_STATUSES = Object.entries(STATUS).map(([k, v]) => ({ value: k, label: v.label }));

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, color: 'bg-gray-100 text-gray-600 border-gray-200', icon: Clock };
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.color}`}>
      <Icon className="w-3 h-3" /> {s.label}
    </span>
  );
}

function fmt(n: string | number) {
  return Number(n).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function OnlineOrdersContent() {
  const [orders, setOrders]     = useState<Order[]>([]);
  const [stats, setStats]       = useState<Stats | null>(null);
  const [meta, setMeta]         = useState<Meta>({ current_page: 1, last_page: 1, total: 0, per_page: 20 });
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage]         = useState(1);
  const [selected, setSelected] = useState<Order | null>(null);
  const [editing, setEditing]   = useState(false);
  const [form, setForm]         = useState({ status: '', tracking_number: '', shipping_company: '', notes: '' });
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: '20' });
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      const res = await api<any>(`/admin/orders?${params}`);
      setOrders(res.data ?? []);
      setMeta(res.meta ?? { current_page: 1, last_page: 1, total: 0, per_page: 20 });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, search, filterStatus]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api<any>('/admin/orders/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  // Reload stats after saving
  const reloadStats = () => api<any>('/admin/orders/stats').then(r => setStats(r.data)).catch(() => {});

  const openOrder = (o: Order) => {
    setSelected(o);
    setEditing(false);
    setForm({ status: o.status, tracking_number: o.tracking_number ?? '', shipping_company: o.shipping_company ?? '', notes: o.notes ?? '' });
    setSaveError('');
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true); setSaveError('');
    try {
      const res = await api<any>(`/admin/orders/${selected.id}`, { method: 'PUT', body: JSON.stringify(form) });
      const updated = res.data as Order;
      setSelected(updated);
      setOrders(p => p.map(o => o.id === updated.id ? updated : o));
      setEditing(false);
      reloadStats();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); load(); };

  // Stats cards
  const statCards = stats ? [
    { label: 'Total pedidos',  value: stats.total,      color: 'text-gray-700', bg: 'bg-gray-50'     },
    { label: 'Pendientes',     value: stats.pending,    color: 'text-yellow-700', bg: 'bg-yellow-50'  },
    { label: 'Procesando',     value: stats.processing + stats.paid, color: 'text-purple-700', bg: 'bg-purple-50' },
    { label: 'Enviados',       value: stats.shipped,    color: 'text-amber-700',  bg: 'bg-amber-50'   },
    { label: 'Entregados',     value: stats.delivered,  color: 'text-green-700',  bg: 'bg-green-50'   },
    { label: 'Ingresos',       value: fmt(stats.revenue), color: 'text-blue-700', bg: 'bg-blue-50'    },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos online</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión de órdenes de la tienda en línea</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2">
          <Globe className="w-4 h-4 text-blue-500" />
          <span className="font-bold text-gray-900">{meta.total}</span>
          <span className="text-sm text-gray-500">pedidos</span>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map(c => (
            <div key={c.label} className={`${c.bg} rounded-xl p-3 border border-transparent`}>
              <p className="text-xs text-gray-500 mb-1">{c.label}</p>
              <p className={`font-bold text-base ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-56">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por # pedido, cliente, email..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" />
          </div>
          <button type="submit" className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
            Buscar
          </button>
        </form>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none">
          <option value="">Todos los estados</option>
          {ALL_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={() => { setSearch(''); setFilterStatus(''); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50">
          Limpiar
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center">
            <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No hay pedidos</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"># Pedido</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Pago</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-gray-900 text-xs">{o.order_number}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 truncate max-w-[140px]">{o.customer_name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[140px]">{o.customer_email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell whitespace-nowrap">
                        {fmtDate(o.created_at)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{fmt(o.total)}</td>
                      <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell capitalize">{o.payment_method ?? '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openOrder(o)}
                          className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Ver detalle">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta.last_page > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Página {meta.current_page} de {meta.last_page} · {meta.total} pedidos
                </p>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page}
                    className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Detail modal ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-8">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">Pedido {selected.order_number}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{fmtDate(selected.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                {!editing && (
                  <button onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                    Editar
                  </button>
                )}
                <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-160px)]">
              {saveError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {saveError}
                </div>
              )}

              {/* Status + edit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Estado</p>
                  {editing ? (
                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none">
                      {ALL_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  ) : (
                    <StatusBadge status={selected.status} />
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Total</p>
                  <p className="text-xl font-bold text-gray-900">{fmt(selected.total)}</p>
                </div>
              </div>

              {/* Shipping info */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Envío</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Número de rastreo</label>
                    {editing ? (
                      <input value={form.tracking_number} onChange={e => setForm(p => ({ ...p, tracking_number: e.target.value }))}
                        placeholder="Ej: 1Z999AA10123456784"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" />
                    ) : (
                      <p className="text-sm text-gray-800">{selected.tracking_number || '—'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Transportadora</label>
                    {editing ? (
                      <input value={form.shipping_company} onChange={e => setForm(p => ({ ...p, shipping_company: e.target.value }))}
                        placeholder="Ej: Servientrega, Coordinadora..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" />
                    ) : (
                      <p className="text-sm text-gray-800">{selected.shipping_company || '—'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Cliente</p>
                <p className="font-medium text-gray-900">{selected.customer_name}</p>
                <p className="text-sm text-gray-500">{selected.customer_email}</p>
                {selected.customer_phone && <p className="text-sm text-gray-500">{selected.customer_phone}</p>}
                {selected.shipping_address && (
                  <p className="text-sm text-gray-500 mt-1">
                    {selected.shipping_address}{selected.shipping_city ? `, ${selected.shipping_city}` : ''}{selected.shipping_state ? ` (${selected.shipping_state})` : ''}
                  </p>
                )}
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Productos</p>
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  {selected.items.map((it, i) => (
                    <div key={it.id} className={`flex items-center justify-between px-4 py-3 gap-4 ${i < selected.items.length - 1 ? 'border-b border-gray-100' : ''}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{it.product_name}</p>
                          <p className="text-xs text-gray-400">{it.product_sku} · x{it.quantity}</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 shrink-0">{fmt(it.subtotal)}</p>
                    </div>
                  ))}
                  <div className="px-4 py-3 bg-gray-50 flex justify-between text-sm border-t border-gray-100">
                    <span className="text-gray-500">Envío</span>
                    <span className="font-medium">{fmt(selected.shipping_cost)}</span>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 flex justify-between font-bold text-gray-900 border-t border-gray-100">
                    <span>Total</span>
                    <span>{fmt(selected.total)}</span>
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Método de pago</p>
                  <p className="font-medium text-gray-800 capitalize">{selected.payment_method ?? '—'}</p>
                </div>
                {selected.payment_reference && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Referencia</p>
                    <p className="font-mono text-xs text-gray-700">{selected.payment_reference}</p>
                  </div>
                )}
                {selected.paid_at && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Fecha de pago</p>
                    <p className="font-medium text-gray-800">{fmtDate(selected.paid_at)}</p>
                  </div>
                )}
                {selected.shipped_at && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Fecha de envío</p>
                    <p className="font-medium text-gray-800">{fmtDate(selected.shipped_at)}</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Notas internas</p>
                {editing ? (
                  <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    rows={3} placeholder="Notas internas sobre el pedido..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none resize-none" />
                ) : (
                  <p className="text-sm text-gray-700">{selected.notes || <span className="text-gray-400">Sin notas</span>}</p>
                )}
              </div>

              {/* Save / Cancel */}
              {editing && (
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => { setEditing(false); setSaveError(''); }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                    Cancelar
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 disabled:opacity-60">
                    {saving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Guardando...</> : <><Save className="w-4 h-4" /> Guardar cambios</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
