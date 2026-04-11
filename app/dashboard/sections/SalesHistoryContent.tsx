'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  FileText, Calendar, DollarSign, Search, Filter,
  Eye, Trash2, XCircle, RefreshCw, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, ShoppingCart, Package, TrendingUp,
  CreditCard, X, CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import { saleApi } from '../../services/api';

interface SaleItem {
  id: number;
  product?: { id: number; name: string; sku: string };
  quantity: number;
  unit_price: number;
  discount_amount: number;
  total_amount: number;
}

interface Sale {
  id: number;
  sale_number: string;
  sale_date: string;
  customer?: { id: number; name: string; email?: string; phone?: string };
  user?: { id: number; name: string };
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  status: string;
  notes?: string;
  sale_items?: SaleItem[];
}

const PAYMENT_METHODS: Record<string, string> = {
  cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia',
  check: 'Cheque', credit: 'Crédito',
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(n));

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const StatusBadge = ({ status }: { status: string }) => {
  if (status === 'completed') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
      <CheckCircle className="w-3 h-3" />Completada
    </span>
  );
  if (status === 'cancelled') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
      <XCircle className="w-3 h-3" />Cancelada
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
      <Clock className="w-3 h-3" />Borrador
    </span>
  );
};

const PaymentBadge = ({ method }: { method: string }) => {
  const colors: Record<string, string> = {
    cash: 'bg-emerald-100 text-emerald-700',
    card: 'bg-blue-100 text-blue-700',
    transfer: 'bg-purple-100 text-purple-700',
    check: 'bg-orange-100 text-orange-700',
    credit: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${colors[method] ?? 'bg-gray-100 text-gray-600'}`}>
      {PAYMENT_METHODS[method] ?? method}
    </span>
  );
};

// ── Column filter dropdown ───────────────────────────────────────────────────
function ColFilterDropdown({
  columnId, label, options, value, onChange, onClose, freeText = false, datePicker = false,
}: {
  columnId: string; label: string; options?: string[];
  value: string; onChange: (v: string) => void; onClose: () => void; freeText?: boolean; datePicker?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  if (datePicker) {
    return (
      <div ref={ref} className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-3">
        <p className="text-xs font-semibold text-gray-600 uppercase mb-2">{label}</p>
        <input
          type="date"
          autoFocus
          value={value}
          onChange={e => { onChange(e.target.value); if (e.target.value) onClose(); }}
          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {value && (
          <button
            onClick={() => { onChange(''); onClose(); }}
            className="mt-2 w-full text-xs text-red-500 hover:text-red-700 flex items-center justify-center gap-1"
          >
            <X className="w-3 h-3" /> Limpiar filtro
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
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
          {options
            .filter(o => !value || o.toLowerCase().includes(value.toLowerCase()))
            .map(o => (
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
  label, columnId, activeCol, onActivate, colFilters, onFilter, options, freeText, datePicker,
}: {
  label: string; columnId: string; activeCol: string | null;
  onActivate: (id: string | null) => void;
  colFilters: Record<string, string>;
  onFilter: (col: string, val: string) => void;
  options?: string[]; freeText?: boolean; datePicker?: boolean;
}) {
  const isActive = activeCol === columnId;
  const hasFilter = !!colFilters[columnId];
  const filterDisplay = datePicker && colFilters[columnId]
    ? new Date(colFilters[columnId] + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
    : colFilters[columnId];
  return (
    <div className="relative inline-flex items-center gap-1">
      <span className="text-xs font-semibold text-gray-500 uppercase">{label}</span>
      <button
        onClick={() => onActivate(isActive ? null : columnId)}
        className={`p-0.5 rounded transition-colors ${hasFilter ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        title={hasFilter ? `Filtro: ${filterDisplay}` : 'Filtrar'}
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
          columnId={columnId}
          label={label}
          options={options}
          value={colFilters[columnId] ?? ''}
          onChange={v => onFilter(columnId, v)}
          onClose={() => onActivate(null)}
          freeText={freeText}
          datePicker={datePicker}
        />
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function SalesHistoryContent() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Global filters (server-side)
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');

  // Column filters (client-side)
  const [colFilters, setColFilters] = useState<Record<string, string>>({});
  const [activeCol, setActiveCol] = useState<string | null>(null);

  // Pagination
  const [clientPage, setClientPage] = useState(1);
  const PER_PAGE = 15;

  // Detail modal
  const [detailSale, setDetailSale] = useState<Sale | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadSales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await saleApi.getSales({
        search: search || undefined,
        status: filterStatus || undefined,
        payment_method: filterPayment || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        per_page: 1000,
      });
      const pag = res?.data;
      setSales(Array.isArray(pag?.data) ? pag.data : Array.isArray(pag) ? pag : []);
    } catch {
      setError('Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterPayment, dateFrom, dateTo]);

  useEffect(() => { setClientPage(1); setColFilters({}); }, [search, filterStatus, filterPayment, dateFrom, dateTo]);
  useEffect(() => { loadSales(); }, [loadSales]);

  // Unique values per column for dropdown options
  const uniqueCustomers = useMemo(() =>
    [...new Set(sales.map(s => s.customer?.name).filter(Boolean) as string[])].sort(), [sales]);
  const uniqueUsers = useMemo(() =>
    [...new Set(sales.map(s => s.user?.name).filter(Boolean) as string[])].sort(), [sales]);
  const uniquePayments = useMemo(() =>
    [...new Set(sales.map(s => PAYMENT_METHODS[s.payment_method] ?? s.payment_method))].sort(), [sales]);
  const uniqueStatuses = ['Completada', 'Cancelada', 'Borrador'];

  const setColFilter = (col: string, val: string) => {
    setColFilters(prev => ({ ...prev, [col]: val }));
    setClientPage(1);
  };

  // Client-side column filtering
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const f = colFilters;
      if (f.sale_number && !sale.sale_number.toLowerCase().includes(f.sale_number.toLowerCase())) return false;
      if (f.date && !sale.sale_date.startsWith(f.date)) return false;
      if (f.customer) {
        const name = sale.customer?.name ?? 'Sin cliente';
        if (!name.toLowerCase().includes(f.customer.toLowerCase())) return false;
      }
      if (f.payment) {
        const label = PAYMENT_METHODS[sale.payment_method] ?? sale.payment_method;
        if (label !== f.payment) return false;
      }
      if (f.status) {
        const map: Record<string, string> = { completed: 'Completada', cancelled: 'Cancelada', draft: 'Borrador' };
        if ((map[sale.status] ?? sale.status) !== f.status) return false;
      }
      if (f.total && !String(Math.round(Number(sale.total_amount))).includes(f.total)) return false;
      return true;
    });
  }, [sales, colFilters]);

  // Computed KPIs from filtered data
  const kpis = useMemo(() => {
    const total_sales = filteredSales.length;
    const total_revenue = filteredSales.reduce((s, sale) => s + Number(sale.total_amount), 0);
    const avg = total_sales > 0 ? total_revenue / total_sales : 0;
    const byMethod: Record<string, { count: number; total: number }> = {};
    filteredSales.forEach(sale => {
      const k = sale.payment_method;
      if (!byMethod[k]) byMethod[k] = { count: 0, total: 0 };
      byMethod[k].count++;
      byMethod[k].total += Number(sale.total_amount);
    });
    const byMethodArr = Object.entries(byMethod)
      .map(([payment_method, d]) => ({ payment_method, ...d }))
      .sort((a, b) => b.count - a.count);
    return { total_sales, total_revenue, avg, byMethodArr };
  }, [filteredSales]);

  // Pagination
  const clientLastPage = Math.max(1, Math.ceil(filteredSales.length / PER_PAGE));
  const pagedSales = filteredSales.slice((clientPage - 1) * PER_PAGE, clientPage * PER_PAGE);

  const hasGlobalFilters = !!(search || dateFrom || dateTo || filterStatus || filterPayment);
  const hasColFilters = Object.values(colFilters).some(Boolean);

  const openDetail = async (sale: Sale) => {
    if (sale.sale_items) { setDetailSale(sale); return; }
    setDetailLoading(true);
    setDetailSale(sale);
    try {
      const res = await saleApi.getSale(sale.id);
      if (res?.success) setDetailSale(res.data);
    } catch { } finally {
      setDetailLoading(false);
    }
  };

  const handleCancel = async (sale: Sale) => {
    if (!confirm(`¿Cancelar la venta ${sale.sale_number}? Se restaurará el stock.`)) return;
    setActionLoading(sale.id);
    try {
      await saleApi.cancelSale(sale.id);
      loadSales();
      if (detailSale?.id === sale.id) setDetailSale(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al cancelar');
    } finally { setActionLoading(null); }
  };

  const handleDelete = async (sale: Sale) => {
    if (!confirm(`¿Eliminar permanentemente la venta ${sale.sale_number}?`)) return;
    setActionLoading(sale.id);
    try {
      await saleApi.deleteSale(sale.id);
      loadSales();
      if (detailSale?.id === sale.id) setDetailSale(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al eliminar');
    } finally { setActionLoading(null); }
  };

  return (
    <div className="space-y-4">
      {/* ── 1. FILTROS ── */}
      <div className="bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Filter className="w-4 h-4" />Filtros
          </div>
          <button onClick={loadSales} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors" title="Actualizar">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Número de venta, cliente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 w-full border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" title="Desde" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" title="Hasta" />
          
        </div>
        {(hasGlobalFilters || hasColFilters) && (
          <button
            onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setFilterStatus(''); setFilterPayment(''); setColFilters({}); }}
            className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            <X className="w-3 h-3" />Limpiar todos los filtros
          </button>
        )}
      </div>

      {/* ── 2. KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Ventas', value: loading ? '…' : String(kpis.total_sales), icon: ShoppingCart, color: 'blue' },
          { label: 'Ingresos', value: loading ? '…' : formatCurrency(kpis.total_revenue), icon: DollarSign, color: 'green' },
          { label: 'Promedio', value: loading ? '…' : formatCurrency(kpis.avg), icon: TrendingUp, color: 'purple' },
          { label: 'Método Top', value: loading ? '…' : (kpis.byMethodArr[0] ? PAYMENT_METHODS[kpis.byMethodArr[0].payment_method] ?? '—' : '—'), icon: CreditCard, color: 'orange' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-${color}-100 rounded-lg`}><Icon className={`w-5 h-5 text-${color}-600`} /></div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ventas por método de pago */}
      {!loading && kpis.byMethodArr.length > 0 && (
        <div className="bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Ventas por Método de Pago</h3>
          <div className="flex flex-wrap gap-3">
            {kpis.byMethodArr.map(m => (
              <div key={m.payment_method} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                <PaymentBadge method={m.payment_method} />
                <span className="text-sm font-medium text-gray-700">{m.count} ventas</span>
                <span className="text-sm text-green-600 font-semibold">{formatCurrency(m.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. TABLA ── */}
      <div className="bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-400">
            <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin opacity-40" />
            Cargando ventas...
          </div>
        ) : error ? (
          <div className="p-16 text-center text-red-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-60" />{error}
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No hay ventas registradas</p>
            <p className="text-sm mt-1">Las ventas realizadas desde el Punto de Venta aparecerán aquí</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <ColHeader label="Venta" columnId="sale_number" activeCol={activeCol} onActivate={setActiveCol}
                        colFilters={colFilters} onFilter={setColFilter} freeText />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <ColHeader label="Fecha" columnId="date" activeCol={activeCol} onActivate={setActiveCol}
                        colFilters={colFilters} onFilter={setColFilter} datePicker />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <ColHeader label="Cliente" columnId="customer" activeCol={activeCol} onActivate={setActiveCol}
                        colFilters={colFilters} onFilter={setColFilter} options={uniqueCustomers} freeText />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <ColHeader label="Pago" columnId="payment" activeCol={activeCol} onActivate={setActiveCol}
                        colFilters={colFilters} onFilter={setColFilter} options={uniquePayments} />
                    </th>
                    <th className="px-4 py-3 text-right">
                      <ColHeader label="Total" columnId="total" activeCol={activeCol} onActivate={setActiveCol}
                        colFilters={colFilters} onFilter={setColFilter} freeText />
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
                  {pagedSales.map(sale => (
                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-blue-600 font-medium">{sale.sale_number}</span>
                        {sale.user && <p className="text-xs text-gray-400 mt-0.5">Por: {sale.user.name}</p>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {formatDate(sale.sale_date)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {sale.customer ? (
                          <div>
                            <p className="text-sm font-medium text-gray-900">{sale.customer.name}</p>
                            {sale.customer.phone && <p className="text-xs text-gray-400">{sale.customer.phone}</p>}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Sin cliente</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><PaymentBadge method={sale.payment_method} /></td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(Number(sale.total_amount))}</span>
                        {Number(sale.discount_amount) > 0 && (
                          <p className="text-xs text-orange-500">Desc: {formatCurrency(Number(sale.discount_amount))}</p>
                        )}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={sale.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openDetail(sale)} className="text-blue-600 hover:text-blue-800" title="Ver detalle">
                            <Eye className="w-4 h-4" />
                          </button>
                          {sale.status !== 'cancelled' && (
                            <button onClick={() => handleCancel(sale)} disabled={actionLoading === sale.id}
                              className="text-orange-500 hover:text-orange-700 disabled:opacity-40" title="Cancelar">
                              {actionLoading === sale.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            </button>
                          )}
                          <button onClick={() => handleDelete(sale)} disabled={actionLoading === sale.id}
                            className="text-red-500 hover:text-red-700 disabled:opacity-40" title="Eliminar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/60">
              <span className="text-sm text-gray-500">
                {filteredSales.length} registros · Página {clientPage} de {clientLastPage}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setClientPage(1)} disabled={clientPage === 1}
                  className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-white text-gray-600">
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setClientPage(p => p - 1)} disabled={clientPage === 1}
                  className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-white text-gray-600">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, clientLastPage) }, (_, i) => {
                  const p = clientPage <= 3 ? i + 1 : clientPage - 2 + i;
                  if (p < 1 || p > clientLastPage) return null;
                  return (
                    <button key={p} onClick={() => setClientPage(p)}
                      className={`w-8 h-8 rounded border text-sm ${p === clientPage ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 hover:bg-white text-gray-600'}`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setClientPage(p => p + 1)} disabled={clientPage === clientLastPage}
                  className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-white text-gray-600">
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button onClick={() => setClientPage(clientLastPage)} disabled={clientPage === clientLastPage}
                  className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-white text-gray-600">
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Modal detalle ── */}
      {detailSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Venta {detailSale.sale_number}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{formatDate(detailSale.sale_date)}</p>
              </div>
              <button onClick={() => setDetailSale(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex flex-wrap gap-3">
                <StatusBadge status={detailSale.status} />
                <PaymentBadge method={detailSale.payment_method} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1 font-medium uppercase">Cliente</p>
                  {detailSale.customer ? (
                    <>
                      <p className="text-sm font-medium text-gray-900">{detailSale.customer.name}</p>
                      {detailSale.customer.email && <p className="text-xs text-gray-500">{detailSale.customer.email}</p>}
                      {detailSale.customer.phone && <p className="text-xs text-gray-500">{detailSale.customer.phone}</p>}
                    </>
                  ) : <p className="text-sm text-gray-400 italic">Sin cliente asignado</p>}
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1 font-medium uppercase">Vendedor</p>
                  <p className="text-sm font-medium text-gray-900">{detailSale.user?.name ?? 'Sistema'}</p>
                  {detailSale.notes && <p className="text-xs text-gray-500 mt-1">Nota: {detailSale.notes}</p>}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase mb-2">Productos</p>
                {detailLoading ? (
                  <div className="py-6 text-center text-gray-400 text-sm">
                    <RefreshCw className="w-5 h-5 mx-auto mb-1 animate-spin" />Cargando productos...
                  </div>
                ) : detailSale.sale_items && detailSale.sale_items.length > 0 ? (
                  <table className="w-full text-sm rounded-lg overflow-hidden border border-gray-100">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs text-gray-500">Producto</th>
                        <th className="px-3 py-2 text-right text-xs text-gray-500">Cant.</th>
                        <th className="px-3 py-2 text-right text-xs text-gray-500">Precio</th>
                        <th className="px-3 py-2 text-right text-xs text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {detailSale.sale_items.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <p className="font-medium text-gray-900">{item.product?.name ?? 'Producto eliminado'}</p>
                            {item.product?.sku && <p className="text-xs text-gray-400">{item.product.sku}</p>}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-700">{item.quantity}</td>
                          <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(Number(item.unit_price))}</td>
                          <td className="px-3 py-2 text-right font-semibold text-gray-900">{formatCurrency(Number(item.total_amount))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-4 text-center text-gray-400 text-sm">
                    <Package className="w-8 h-8 mx-auto mb-1 opacity-30" />Sin productos
                  </div>
                )}
              </div>
              <div className="border-t pt-4 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span><span>{formatCurrency(Number(detailSale.subtotal))}</span>
                </div>
                {Number(detailSale.tax_amount) > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>IVA (19%)</span><span>{formatCurrency(Number(detailSale.tax_amount))}</span>
                  </div>
                )}
                {Number(detailSale.discount_amount) > 0 && (
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>Descuento</span><span>-{formatCurrency(Number(detailSale.discount_amount))}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t">
                  <span>Total</span><span className="text-green-700">{formatCurrency(Number(detailSale.total_amount))}</span>
                </div>
              </div>
              {detailSale.status !== 'cancelled' && (
                <div className="flex gap-3 pt-2">
                  <button onClick={() => handleCancel(detailSale)} disabled={actionLoading === detailSale.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2 border border-orange-300 text-orange-600 rounded-lg text-sm hover:bg-orange-50 disabled:opacity-50">
                    <XCircle className="w-4 h-4" />Cancelar Venta
                  </button>
                  <button onClick={() => handleDelete(detailSale)} disabled={actionLoading === detailSale.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50">
                    <Trash2 className="w-4 h-4" />Eliminar
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
