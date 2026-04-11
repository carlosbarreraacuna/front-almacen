'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  UserPlus, Search, Plus, Edit, Trash2, Eye, Phone, Mail,
  MapPin, DollarSign, ShoppingBag, X, Save, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ToggleLeft, ToggleRight, Package
} from 'lucide-react';
import { customerApi, ApiCustomer, CreateCustomerData } from '../../services/api';

type CustomerType = 'individual' | 'business' | 'wholesale' | 'retail';

interface CustomerSale {
  id: number;
  sale_number: string;
  sale_date: string;
  total_amount: number;
  status: string;
  payment_method: string;
}

const PAYMENT_METHODS: Record<string, string> = {
  cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia',
  check: 'Cheque', credit: 'Crédito',
};

const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  individual: 'Individual', business: 'Empresa',
  wholesale: 'Mayorista', retail: 'Minorista',
};

const PAYMENT_TERMS_LABELS: Record<string, string> = {
  cash: 'Contado', credit: 'Crédito',
  net_15: 'Neto 15 días', net_30: 'Neto 30 días', net_60: 'Neto 60 días',
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const emptyForm = (): CreateCustomerData & { is_active: boolean } => ({
  name: '', email: '', phone: '', tax_id: '', customer_type: 'individual',
  address: '', city: '', state: '', country: 'Colombia',
  credit_limit: 0, payment_terms: 'cash', notes: '', is_active: true,
});

// ── Column filter dropdown ───────────────────────────────────────────────────
function ColFilterDropdown({
  label, options, value, onChange, onClose,
}: {
  label: string; options?: string[];
  value: string; onChange: (v: string) => void; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
      <div className="p-2 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-600 uppercase mb-1.5">{label}</p>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
          <input
            type="text"
            autoFocus
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-7 pr-6 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {value && (
            <button onClick={() => onChange('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      {options && (
        <div className="max-h-48 overflow-y-auto p-1">
          {options.filter(o => !value || o.toLowerCase().includes(value.toLowerCase())).map(o => (
            <button
              key={o}
              onClick={() => { onChange(o); onClose(); }}
              className={`w-full text-left px-2 py-1.5 rounded text-xs hover:bg-gray-50 ${value === o ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ColHeader ────────────────────────────────────────────────────────────────
function ColHeader({
  label, columnId, activeCol, onActivate, colFilters, onFilter, options,
}: {
  label: string; columnId: string; activeCol: string | null;
  onActivate: (id: string | null) => void;
  colFilters: Record<string, string>;
  onFilter: (col: string, val: string) => void;
  options?: string[];
}) {
  const isActive = activeCol === columnId;
  const hasFilter = !!colFilters[columnId];
  return (
    <div className="relative inline-flex items-center gap-1">
      <span className="text-xs font-semibold text-gray-500 uppercase">{label}</span>
      <button
        onClick={() => onActivate(isActive ? null : columnId)}
        className={`p-0.5 rounded transition-colors ${hasFilter ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        title={hasFilter ? `Filtro: ${colFilters[columnId]}` : 'Filtrar'}
      >
        <Search className="w-3 h-3" />
      </button>
      {hasFilter && (
        <button onClick={() => onFilter(columnId, '')} className="text-blue-400 hover:text-blue-600">
          <X className="w-3 h-3" />
        </button>
      )}
      {isActive && (
        <ColFilterDropdown
          label={label}
          options={options}
          value={colFilters[columnId] ?? ''}
          onChange={v => onFilter(columnId, v)}
          onClose={() => onActivate(null)}
        />
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function CustomersContent() {
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Global search
  const [search, setSearch] = useState('');

  // Column filters
  const [colFilters, setColFilters] = useState<Record<string, string>>({});
  const [activeCol, setActiveCol] = useState<string | null>(null);

  // Pagination
  const [clientPage, setClientPage] = useState(1);
  const PER_PAGE = 15;

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Detail modal
  const [detailCustomer, setDetailCustomer] = useState<ApiCustomer | null>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'sales'>('info');
  const [customerSales, setCustomerSales] = useState<CustomerSale[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesPage, setSalesPage] = useState(1);
  const [salesLastPage, setSalesLastPage] = useState(1);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customerApi.getCustomers({ per_page: 1000 });
      const pag = res?.data;
      setCustomers(Array.isArray(pag?.data) ? pag.data : Array.isArray(pag) ? pag : []);
    } catch {
      setError('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  // Unique values for dropdowns
  const uniqueTypes = useMemo(() =>
    [...new Set(customers.map(c => CUSTOMER_TYPE_LABELS[c.customer_type ?? 'individual']))].sort(), [customers]);
  const uniqueStatuses = ['Activo', 'Inactivo'];
  const uniqueCities = useMemo(() =>
    [...new Set(customers.map(c => c.city).filter(Boolean) as string[])].sort(), [customers]);

  const setColFilter = (col: string, val: string) => {
    setColFilters(prev => ({ ...prev, [col]: val }));
    setClientPage(1);
  };

  // Client-side filtering
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      // Global search
      if (search) {
        const q = search.toLowerCase();
        const matches =
          c.name.toLowerCase().includes(q) ||
          (c.email ?? '').toLowerCase().includes(q) ||
          (c.phone ?? '').toLowerCase().includes(q) ||
          (c.tax_id ?? '').toLowerCase().includes(q) ||
          (c.city ?? '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      // Column filters
      const f = colFilters;
      if (f.name && !c.name.toLowerCase().includes(f.name.toLowerCase())) return false;
      if (f.contact) {
        const q = f.contact.toLowerCase();
        const m = (c.email ?? '').toLowerCase().includes(q) || (c.phone ?? '').toLowerCase().includes(q) || (c.city ?? '').toLowerCase().includes(q);
        if (!m) return false;
      }
      if (f.type) {
        const label = CUSTOMER_TYPE_LABELS[c.customer_type ?? 'individual'];
        if (label !== f.type) return false;
      }
      if (f.status) {
        const label = c.is_active ? 'Activo' : 'Inactivo';
        if (label !== f.status) return false;
      }
      return true;
    });
  }, [customers, search, colFilters]);

  // Pagination
  const lastPage = Math.max(1, Math.ceil(filteredCustomers.length / PER_PAGE));
  const pagedCustomers = filteredCustomers.slice((clientPage - 1) * PER_PAGE, clientPage * PER_PAGE);

  useEffect(() => { setClientPage(1); }, [search, colFilters]);

  const loadCustomerSales = async (customerId: number, p = 1) => {
    setSalesLoading(true);
    try {
      const res = await customerApi.getCustomerSales(customerId, p);
      const pag = res?.data;
      setCustomerSales(Array.isArray(pag?.data) ? pag.data : []);
      setSalesLastPage(pag?.last_page ?? 1);
      setSalesPage(p);
    } catch {
      setCustomerSales([]);
    } finally {
      setSalesLoading(false);
    }
  };

  const openDetail = (c: ApiCustomer) => {
    setDetailCustomer(c);
    setDetailTab('info');
    setCustomerSales([]);
    setSalesPage(1);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (c: ApiCustomer) => {
    setEditingId(c.id);
    setForm({
      name: c.name, email: c.email ?? '', phone: c.phone ?? '',
      tax_id: c.tax_id ?? '', customer_type: (c.customer_type as CustomerType) ?? 'individual',
      address: c.address ?? '', city: c.city ?? '', state: c.state ?? '',
      country: c.country ?? 'Colombia', credit_limit: c.credit_limit ?? 0,
      payment_terms: c.payment_terms ?? 'cash', notes: c.notes ?? '', is_active: c.is_active,
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('El nombre es obligatorio'); return; }
    setSaving(true);
    setFormError(null);
    try {
      if (editingId) await customerApi.updateCustomer(editingId, form);
      else await customerApi.createCustomer(form);
      setShowForm(false);
      loadCustomers();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    try {
      await customerApi.deleteCustomer(id);
      loadCustomers();
    } catch { alert('Error al eliminar'); }
  };

  const handleToggleStatus = async (c: ApiCustomer) => {
    try {
      await customerApi.toggleStatus(c.id);
      loadCustomers();
    } catch { alert('Error al cambiar estado'); }
  };

  const activeCount = customers.filter(c => c.is_active).length;
  const totalRevenue = customers.reduce((s, c) => s + (c.total_sales_amount ?? 0), 0);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Clientes', value: customers.length, icon: UserPlus, color: 'blue' },
          { label: 'Activos', value: activeCount, icon: UserPlus, color: 'green' },
          { label: 'Empresas', value: customers.filter(c => c.customer_type === 'business' || c.customer_type === 'wholesale').length, icon: ShoppingBag, color: 'purple' },
          { label: 'Revenue Total', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'yellow', raw: true },
        ].map(({ label, value, icon: Icon, color, raw }) => (
          <div key={label} className="bg-white p-4 rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-${color}-100 rounded-lg`}>
                <Icon className={`w-5 h-5 text-${color}-600`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search bar + buttons */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por nombre, email, teléfono, ciudad..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => { setSearch(''); setColFilters({}); loadCustomers(); }}
          className="p-2 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          title="Restablecer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Cargando clientes...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">{error}</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{search ? 'No se encontraron clientes' : 'No hay clientes registrados'}</p>
            {!search && (
              <button onClick={openCreate} className="mt-3 text-blue-600 text-sm hover:underline">Crear primer cliente</button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <ColHeader label="Cliente" columnId="name" activeCol={activeCol} onActivate={setActiveCol}
                        colFilters={colFilters} onFilter={setColFilter} />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <ColHeader label="Contacto" columnId="contact" activeCol={activeCol} onActivate={setActiveCol}
                        colFilters={colFilters} onFilter={setColFilter} />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <ColHeader label="Tipo" columnId="type" activeCol={activeCol} onActivate={setActiveCol}
                        colFilters={colFilters} onFilter={setColFilter} options={uniqueTypes} />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="text-xs font-semibold text-gray-500 uppercase">Ventas</span>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <ColHeader label="Estado" columnId="status" activeCol={activeCol} onActivate={setActiveCol}
                        colFilters={colFilters} onFilter={setColFilter} options={uniqueStatuses} />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="text-xs font-semibold text-gray-500 uppercase">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pagedCustomers.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">{c.name}</p>
                            {c.tax_id && <p className="text-xs text-gray-400">NIT: {c.tax_id}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5 text-xs text-gray-600">
                          {c.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</div>}
                          {c.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</div>}
                          {c.city && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.city}</div>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                          {CUSTOMER_TYPE_LABELS[c.customer_type ?? 'individual'] ?? c.customer_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <p className="font-medium text-gray-900">{c.sales_count ?? 0} ventas</p>
                        {(c.total_sales_amount ?? 0) > 0 && (
                          <p className="text-xs text-green-600">{formatCurrency(c.total_sales_amount ?? 0)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleToggleStatus(c)} title="Cambiar estado">
                          {c.is_active
                            ? <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700"><ToggleRight className="w-3 h-3" />Activo</span>
                            : <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700"><ToggleLeft className="w-3 h-3" />Inactivo</span>
                          }
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openDetail(c)} className="text-blue-600 hover:text-blue-800" title="Ver detalle">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEdit(c)} className="text-indigo-600 hover:text-indigo-800" title="Editar">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700" title="Eliminar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50 text-sm">
              <span className="text-xs text-gray-500">
                Mostrando {Math.min((clientPage - 1) * PER_PAGE + 1, filteredCustomers.length)}–{Math.min(clientPage * PER_PAGE, filteredCustomers.length)} de {filteredCustomers.length}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setClientPage(1)} disabled={clientPage === 1}
                  className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-white transition-colors">
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setClientPage(p => p - 1)} disabled={clientPage === 1}
                  className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-white transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 py-1 text-xs text-gray-600">Pág. {clientPage} / {lastPage}</span>
                <button onClick={() => setClientPage(p => p + 1)} disabled={clientPage === lastPage}
                  className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-white transition-colors">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setClientPage(lastPage)} disabled={clientPage === lastPage}
                  className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-white transition-colors">
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Detail Modal ──────────────────────────────────── */}
      {detailCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                  {detailCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{detailCustomer.name}</h2>
                  <p className="text-xs text-gray-500">
                    {CUSTOMER_TYPE_LABELS[detailCustomer.customer_type ?? 'individual']} •{' '}
                    <span className={detailCustomer.is_active ? 'text-green-600' : 'text-red-500'}>
                      {detailCustomer.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </p>
                </div>
              </div>
              <button onClick={() => setDetailCustomer(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b px-5">
              {(['info', 'sales'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => {
                    setDetailTab(t);
                    if (t === 'sales' && customerSales.length === 0) loadCustomerSales(detailCustomer.id, 1);
                  }}
                  className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${detailTab === t ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  {t === 'info' ? 'Información' : 'Historial de Ventas'}
                </button>
              ))}
            </div>

            <div className="p-5">
              {detailTab === 'info' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 uppercase mb-3">Datos de Contacto</h3>
                    <div className="space-y-2 text-sm">
                      {detailCustomer.email && <p><span className="text-gray-500">Email:</span> {detailCustomer.email}</p>}
                      {detailCustomer.phone && <p><span className="text-gray-500">Teléfono:</span> {detailCustomer.phone}</p>}
                      {detailCustomer.address && <p><span className="text-gray-500">Dirección:</span> {detailCustomer.address}</p>}
                      {detailCustomer.city && <p><span className="text-gray-500">Ciudad:</span> {detailCustomer.city}{detailCustomer.state ? `, ${detailCustomer.state}` : ''}</p>}
                      {detailCustomer.country && <p><span className="text-gray-500">País:</span> {detailCustomer.country}</p>}
                      {detailCustomer.tax_id && <p><span className="text-gray-500">NIT/RUT:</span> {detailCustomer.tax_id}</p>}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 uppercase mb-3">Datos Comerciales</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-500">Tipo:</span> {CUSTOMER_TYPE_LABELS[detailCustomer.customer_type ?? 'individual']}</p>
                      <p><span className="text-gray-500">Condición de Pago:</span> {PAYMENT_TERMS_LABELS[detailCustomer.payment_terms ?? 'cash']}</p>
                      {(detailCustomer.credit_limit ?? 0) > 0 && (
                        <p><span className="text-gray-500">Límite de Crédito:</span> {formatCurrency(detailCustomer.credit_limit ?? 0)}</p>
                      )}
                      <p><span className="text-gray-500">Ventas Realizadas:</span> {detailCustomer.sales_count ?? 0}</p>
                      {(detailCustomer.total_sales_amount ?? 0) > 0 && (
                        <p><span className="text-gray-500">Total Comprado:</span> <strong className="text-green-600">{formatCurrency(detailCustomer.total_sales_amount ?? 0)}</strong></p>
                      )}
                      {detailCustomer.created_at && (
                        <p><span className="text-gray-500">Registro:</span> {new Date(detailCustomer.created_at).toLocaleDateString('es-CO')}</p>
                      )}
                    </div>
                    {detailCustomer.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">{detailCustomer.notes}</div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  {salesLoading ? (
                    <div className="py-10 text-center text-gray-400 text-sm">Cargando ventas...</div>
                  ) : customerSales.length === 0 ? (
                    <div className="py-10 text-center text-gray-400 text-sm">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      Este cliente no tiene ventas registradas
                    </div>
                  ) : (
                    <>
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase">N° Venta</th>
                            <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase">Fecha</th>
                            <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase">Pago</th>
                            <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase">Total</th>
                            <th className="px-3 py-2 text-left text-xs text-gray-500 uppercase">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {customerSales.map(s => (
                            <tr key={s.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 font-mono text-blue-600 text-xs">{s.sale_number}</td>
                              <td className="px-3 py-2 text-gray-600">{new Date(s.sale_date).toLocaleDateString('es-CO')}</td>
                              <td className="px-3 py-2 text-gray-600">{PAYMENT_METHODS[s.payment_method] ?? s.payment_method}</td>
                              <td className="px-3 py-2 font-semibold text-green-700">{formatCurrency(Number(s.total_amount))}</td>
                              <td className="px-3 py-2">
                                <span className={`inline-flex px-2 py-0.5 text-xs rounded-full font-medium ${
                                  s.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  s.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {s.status === 'completed' ? 'Completada' : s.status === 'cancelled' ? 'Cancelada' : 'Borrador'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {salesLastPage > 1 && (
                        <div className="flex justify-end gap-2 mt-3">
                          <button disabled={salesPage === 1} onClick={() => loadCustomerSales(detailCustomer.id, salesPage - 1)} className="p-1.5 border rounded disabled:opacity-40">
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-xs text-gray-500 self-center">Pág. {salesPage}/{salesLastPage}</span>
                          <button disabled={salesPage === salesLastPage} onClick={() => loadCustomerSales(detailCustomer.id, salesPage + 1)} className="p-1.5 border rounded disabled:opacity-40">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Form Modal ────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-gray-900">{editingId ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{formError}</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nombre completo o razón social" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email ?? ''} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="correo@ejemplo.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label>
                  <input type="tel" value={form.phone ?? ''} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+57 300 000 0000" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">NIT / Cédula</label>
                  <input type="text" value={form.tax_id ?? ''} onChange={e => setForm({ ...form, tax_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="900.123.456-7" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                  <select value={form.customer_type} onChange={e => setForm({ ...form, customer_type: e.target.value as CustomerType })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    {Object.entries(CUSTOMER_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ciudad</label>
                  <input type="text" value={form.city ?? ''} onChange={e => setForm({ ...form, city: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Bogotá" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Departamento</label>
                  <input type="text" value={form.state ?? ''} onChange={e => setForm({ ...form, state: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Cundinamarca" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Dirección</label>
                  <input type="text" value={form.address ?? ''} onChange={e => setForm({ ...form, address: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Calle 123 # 45-67" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Condición de Pago</label>
                  <select value={form.payment_terms ?? 'cash'} onChange={e => setForm({ ...form, payment_terms: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    {Object.entries(PAYMENT_TERMS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Límite de Crédito</label>
                  <input type="number" min="0" value={form.credit_limit ?? 0} onChange={e => setForm({ ...form, credit_limit: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notas</label>
                  <textarea value={form.notes ?? ''} onChange={e => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Información adicional..." />
                </div>
                {editingId && (
                  <div className="col-span-2 flex items-center gap-2">
                    <input type="checkbox" id="isActive" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4" />
                    <label htmlFor="isActive" className="text-sm text-gray-700">Cliente activo</label>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingId ? 'Actualizar' : 'Crear Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
