'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Calendar, DollarSign, User, Search, Filter,
  Eye, Trash2, XCircle, RefreshCw, ChevronLeft, ChevronRight,
  ShoppingCart, Package, TrendingUp, CreditCard, X, CheckCircle,
  Clock, AlertCircle
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

interface Stats {
  total_sales: number;
  total_revenue: number;
  by_payment_method: { payment_method: string; count: number; total: number }[];
}

const PAYMENT_METHODS: Record<string, string> = {
  cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia',
  check: 'Cheque', credit: 'Crédito',
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(Number(n));

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

export default function SalesHistoryContent() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [perPage] = useState(20);

  // Pagination
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Detail modal
  const [detailSale, setDetailSale] = useState<Sale | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Action state
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
        per_page: perPage,
      });
      const pag = res?.data;
      setSales(Array.isArray(pag?.data) ? pag.data : Array.isArray(pag) ? pag : []);
      setLastPage(pag?.last_page ?? 1);
      setTotal(pag?.total ?? 0);
    } catch (e) {
      setError('Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterPayment, dateFrom, dateTo, perPage, page]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await saleApi.getStats(dateFrom || undefined, dateTo || undefined);
      if (res?.success) setStats(res.data);
    } catch { /* ignore */ } finally {
      setStatsLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { setPage(1); }, [search, filterStatus, filterPayment, dateFrom, dateTo]);
  useEffect(() => { loadSales(); }, [loadSales]);
  useEffect(() => { loadStats(); }, [loadStats]);

  const openDetail = async (sale: Sale) => {
    if (sale.sale_items) { setDetailSale(sale); return; }
    setDetailLoading(true);
    setDetailSale(sale);
    try {
      const res = await saleApi.getSale(sale.id);
      if (res?.success) setDetailSale(res.data);
    } catch { /* keep partial data */ } finally {
      setDetailLoading(false);
    }
  };

  const handleCancel = async (sale: Sale) => {
    if (!confirm(`¿Cancelar la venta ${sale.sale_number}? Se restaurará el stock.`)) return;
    setActionLoading(sale.id);
    try {
      await saleApi.cancelSale(sale.id);
      loadSales();
      loadStats();
      if (detailSale?.id === sale.id) setDetailSale(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al cancelar');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (sale: Sale) => {
    if (!confirm(`¿Eliminar permanentemente la venta ${sale.sale_number}?`)) return;
    setActionLoading(sale.id);
    try {
      await saleApi.deleteSale(sale.id);
      loadSales();
      loadStats();
      if (detailSale?.id === sale.id) setDetailSale(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al eliminar');
    } finally {
      setActionLoading(null);
    }
  };

  const todayRevenue = stats?.total_revenue ?? 0;
  const totalSalesCount = stats?.total_sales ?? 0;
  const avgSale = totalSalesCount > 0 ? todayRevenue / totalSalesCount : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-600" />
            Historial de Ventas
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} ventas encontradas</p>
        </div>
        <button onClick={() => { loadSales(); loadStats(); }} className="p-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg" title="Actualizar">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><ShoppingCart className="w-5 h-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Ventas</p>
              <p className="text-2xl font-bold text-gray-900">{statsLoading ? '…' : totalSalesCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><DollarSign className="w-5 h-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Ingresos</p>
              <p className="text-xl font-bold text-gray-900">{statsLoading ? '…' : formatCurrency(todayRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><TrendingUp className="w-5 h-5 text-purple-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Promedio</p>
              <p className="text-xl font-bold text-gray-900">{statsLoading ? '…' : formatCurrency(avgSale)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg"><CreditCard className="w-5 h-5 text-orange-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Método Top</p>
              <p className="text-base font-bold text-gray-900">
                {statsLoading || !stats?.by_payment_method?.length ? '…'
                  : PAYMENT_METHODS[stats.by_payment_method.sort((a, b) => b.count - a.count)[0]?.payment_method] ?? '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment method breakdown */}
      {stats?.by_payment_method && stats.by_payment_method.length > 0 && (
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Ventas por Método de Pago</h3>
          <div className="flex flex-wrap gap-3">
            {stats.by_payment_method.map(m => (
              <div key={m.payment_method} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border">
                <PaymentBadge method={m.payment_method} />
                <span className="text-sm font-medium text-gray-700">{m.count} ventas</span>
                <span className="text-sm text-green-600 font-semibold">{formatCurrency(m.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Filter className="w-4 h-4" />Filtros
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Número de venta, cliente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            title="Fecha desde"
          />
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            title="Fecha hasta"
          />
          <div className="flex gap-2">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
              <option value="">Estado</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
              <option value="draft">Borrador</option>
            </select>
            <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
              <option value="">Pago</option>
              {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
        {(search || dateFrom || dateTo || filterStatus || filterPayment) && (
          <button
            onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setFilterStatus(''); setFilterPayment(''); }}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            <X className="w-3 h-3" />Limpiar filtros
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-400">
            <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin opacity-40" />
            Cargando ventas...
          </div>
        ) : error ? (
          <div className="p-16 text-center text-red-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-60" />
            {error}
          </div>
        ) : sales.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No hay ventas registradas</p>
            <p className="text-sm mt-1">Las ventas realizadas desde el Punto de Venta aparecerán aquí</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venta</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pago</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.map(sale => (
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
                    <td className="px-4 py-3">
                      <PaymentBadge method={sale.payment_method} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(Number(sale.total_amount))}</span>
                      {Number(sale.discount_amount) > 0 && (
                        <p className="text-xs text-orange-500">Desc: {formatCurrency(Number(sale.discount_amount))}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={sale.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openDetail(sale)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {sale.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancel(sale)}
                            disabled={actionLoading === sale.id}
                            className="text-orange-500 hover:text-orange-700 disabled:opacity-40"
                            title="Cancelar venta"
                          >
                            {actionLoading === sale.id
                              ? <RefreshCw className="w-4 h-4 animate-spin" />
                              : <XCircle className="w-4 h-4" />
                            }
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(sale)}
                          disabled={actionLoading === sale.id}
                          className="text-red-500 hover:text-red-700 disabled:opacity-40"
                          title="Eliminar"
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

        {/* Pagination */}
        {lastPage > 1 && !loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <span className="text-sm text-gray-500">Página {page} de {lastPage} · {total} registros</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-white text-gray-600">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page - 2 + i;
                if (p < 1 || p > lastPage) return null;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded border text-sm ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-white text-gray-600'}`}>
                    {p}
                  </button>
                );
              })}
              <button disabled={page === lastPage} onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-white text-gray-600">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Modal ──────────────────────────────────── */}
      {detailSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Venta {detailSale.sale_number}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{formatDate(detailSale.sale_date)}</p>
              </div>
              <button onClick={() => setDetailSale(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Status + Payment */}
              <div className="flex flex-wrap gap-3">
                <StatusBadge status={detailSale.status} />
                <PaymentBadge method={detailSale.payment_method} />
              </div>

              {/* Customer + User */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1 font-medium uppercase">Cliente</p>
                  {detailSale.customer ? (
                    <>
                      <p className="text-sm font-medium text-gray-900">{detailSale.customer.name}</p>
                      {detailSale.customer.email && <p className="text-xs text-gray-500">{detailSale.customer.email}</p>}
                      {detailSale.customer.phone && <p className="text-xs text-gray-500">{detailSale.customer.phone}</p>}
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Sin cliente asignado</p>
                  )}
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1 font-medium uppercase">Vendedor</p>
                  <p className="text-sm font-medium text-gray-900">{detailSale.user?.name ?? 'Sistema'}</p>
                  {detailSale.notes && <p className="text-xs text-gray-500 mt-1">Nota: {detailSale.notes}</p>}
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase mb-2">Productos</p>
                {detailLoading ? (
                  <div className="py-6 text-center text-gray-400 text-sm">
                    <RefreshCw className="w-5 h-5 mx-auto mb-1 animate-spin" />
                    Cargando productos...
                  </div>
                ) : detailSale.sale_items && detailSale.sale_items.length > 0 ? (
                  <table className="w-full text-sm border border-gray-100 rounded-lg overflow-hidden">
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
                    <Package className="w-8 h-8 mx-auto mb-1 opacity-30" />
                    Sin productos
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(Number(detailSale.subtotal))}</span>
                </div>
                {Number(detailSale.tax_amount) > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>IVA (19%)</span>
                    <span>{formatCurrency(Number(detailSale.tax_amount))}</span>
                  </div>
                )}
                {Number(detailSale.discount_amount) > 0 && (
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>Descuento</span>
                    <span>-{formatCurrency(Number(detailSale.discount_amount))}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t">
                  <span>Total</span>
                  <span className="text-green-700">{formatCurrency(Number(detailSale.total_amount))}</span>
                </div>
              </div>

              {/* Actions */}
              {detailSale.status !== 'cancelled' && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleCancel(detailSale)}
                    disabled={actionLoading === detailSale.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2 border border-orange-300 text-orange-600 rounded-lg text-sm hover:bg-orange-50 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancelar Venta
                  </button>
                  <button
                    onClick={() => handleDelete(detailSale)}
                    disabled={actionLoading === detailSale.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
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
