'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardApi } from '../../services/api';

import DateRangePicker, { DateRange } from '../../components/dashboard/DateRangePicker';
import SummaryCards from '../../components/dashboard/SummaryCards';
import SalesTrendChart from '../../components/dashboard/SalesTrendChart';
import PaymentMethodChart from '../../components/dashboard/PaymentMethodChart';
import TopProductsTable from '../../components/dashboard/TopProductsTable';
import TopCustomersTable from '../../components/dashboard/TopCustomersTable';
import CategoryChart from '../../components/dashboard/CategoryChart';
import HourlyChart from '../../components/dashboard/HourlyChart';
import InventoryHealthCards from '../../components/dashboard/InventoryHealthCards';

// ── Estado inicial del rango: este mes ──────────────────────────────────────
function getThisMonth(): DateRange {
  const now  = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const fmt   = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(first), to: fmt(now), label: 'Este mes' };
}

export default function DashboardContent() {
  const { user } = useAuth();

  // ── Rango de fechas central ──────────────────────────────────────────────
  const [range, setRange] = useState<DateRange>(getThisMonth);

  // ── Datos y estados de carga ─────────────────────────────────────────────
  const [summary, setSummary]     = useState<any>(null);
  const [trend, setTrend]         = useState<{ data: any[]; group_by: string }>({ data: [], group_by: 'day' });
  const [payMethods, setPayMethods] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [categories, setCategories]   = useState<any[]>([]);
  const [hourly, setHourly]           = useState<any[]>([]);
  const [invHealth, setInvHealth]     = useState<any>(null);

  const [loadingSummary,  setLoadingSummary]  = useState(true);
  const [loadingTrend,    setLoadingTrend]    = useState(true);
  const [loadingPay,      setLoadingPay]      = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCustomers,setLoadingCustomers]= useState(true);
  const [loadingCat,      setLoadingCat]      = useState(true);
  const [loadingHourly,   setLoadingHourly]   = useState(true);
  const [loadingInv,      setLoadingInv]      = useState(true);

  const [productsLimit,  setProductsLimit]  = useState(10);
  const [customersLimit, setCustomersLimit] = useState(10);

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ── Fetch de todos los endpoints en paralelo ─────────────────────────────
  const fetchAll = useCallback(async (r: DateRange, pLimit: number, cLimit: number) => {
    const { from, to } = r;

    // Summary
    setLoadingSummary(true);
    dashboardApi.getSummary(from, to)
      .then(res => { if (res?.success) setSummary(res.data); })
      .catch(() => {})
      .finally(() => setLoadingSummary(false));

    // Trend
    setLoadingTrend(true);
    dashboardApi.getSalesTrend(from, to)
      .then(res => { if (res?.success) setTrend({ data: res.data, group_by: res.group_by }); })
      .catch(() => {})
      .finally(() => setLoadingTrend(false));

    // Top products
    setLoadingProducts(true);
    dashboardApi.getTopProducts(from, to, pLimit)
      .then(res => { if (res?.success) setTopProducts(res.data); })
      .catch(() => {})
      .finally(() => setLoadingProducts(false));

    // Top customers
    setLoadingCustomers(true);
    dashboardApi.getTopCustomers(from, to, cLimit)
      .then(res => { if (res?.success) setTopCustomers(res.data); })
      .catch(() => {})
      .finally(() => setLoadingCustomers(false));

    // By category
    setLoadingCat(true);
    dashboardApi.getByCategory(from, to)
      .then(res => { if (res?.success) setCategories(res.data); })
      .catch(() => {})
      .finally(() => setLoadingCat(false));

    // Hourly
    setLoadingHourly(true);
    dashboardApi.getHourly(from, to)
      .then(res => { if (res?.success) setHourly(res.data); })
      .catch(() => {})
      .finally(() => setLoadingHourly(false));

    // Inventory health
    setLoadingInv(true);
    dashboardApi.getInventoryHealth(from, to)
      .then(res => { if (res?.success) setInvHealth(res.data); })
      .catch(() => {})
      .finally(() => setLoadingInv(false));

    setLastUpdated(new Date());
  }, []);

  // Fetch de métodos de pago separado (usa /sales/stats existente)
  const fetchPaymentMethods = useCallback(async (from: string, to: string) => {
    setLoadingPay(true);
    try {
      const { saleApi } = await import('../../services/api');
      const res = await saleApi.getStats(from, to);
      if (res?.success) setPayMethods(res.data?.by_payment_method ?? []);
    } catch {}
    setLoadingPay(false);
  }, []);

  // Carga inicial y al cambiar el rango
  useEffect(() => {
    fetchAll(range, productsLimit, customersLimit);
    fetchPaymentMethods(range.from, range.to);
  }, [range, fetchAll, fetchPaymentMethods]);

  // Al cambiar límites de tablas
  useEffect(() => {
    setLoadingProducts(true);
    dashboardApi.getTopProducts(range.from, range.to, productsLimit)
      .then(res => { if (res?.success) setTopProducts(res.data); })
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productsLimit]);

  useEffect(() => {
    setLoadingCustomers(true);
    dashboardApi.getTopCustomers(range.from, range.to, customersLimit)
      .then(res => { if (res?.success) setTopCustomers(res.data); })
      .catch(() => {})
      .finally(() => setLoadingCustomers(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customersLimit]);

  const handleRefresh = () => {
    fetchAll(range, productsLimit, customersLimit);
    fetchPaymentMethods(range.from, range.to);
  };

  const fmt = (d: Date) => d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">

      {/* ── Barra superior: bienvenida + date picker + refresh ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Bienvenido, {user?.name ?? 'Usuario'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Dashboard de métricas y análisis del negocio
            {lastUpdated && (
              <span className="ml-2 text-gray-400">· Actualizado a las {fmt(lastUpdated)}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker value={range} onChange={setRange} />
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-300"
            title="Actualizar datos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Cards de resumen (KPIs) ── */}
      <SummaryCards data={summary} loading={loadingSummary} />

      {/* ── Gráfica de tendencia + Métodos de pago ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <SalesTrendChart data={trend.data} loading={loadingTrend} groupBy={trend.group_by} />
        </div>
        <div>
          <PaymentMethodChart data={payMethods} loading={loadingPay} />
        </div>
      </div>

      {/* ── Layout principal: contenido izquierdo + inventario derecho ── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

        {/* Columna principal (3/4) */}
        <div className="xl:col-span-3 space-y-6">

          {/* Top Productos */}
          <TopProductsTable
            data={topProducts}
            loading={loadingProducts}
            limit={productsLimit}
            onLimitChange={setProductsLimit}
          />

          {/* Top Clientes */}
          <TopCustomersTable
            data={topCustomers}
            loading={loadingCustomers}
            limit={customersLimit}
            onLimitChange={setCustomersLimit}
          />

          {/* Gráficas secundarias */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoryChart data={categories} loading={loadingCat} />
            <HourlyChart   data={hourly}     loading={loadingHourly} />
          </div>
        </div>

        {/* Columna lateral: Inventario (1/4) */}
        <div className="xl:col-span-1">
          <InventoryHealthCards data={invHealth} loading={loadingInv} />
        </div>
      </div>

    </div>
  );
}
