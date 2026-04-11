'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp, Download, Calendar, BarChart3, FileText,
  Eye, RefreshCw, DollarSign, Package, Users, ShoppingCart, X
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
} from 'recharts';
import * as XLSX from 'xlsx';
import { dashboardApi, saleApi, productApi, customerApi } from '../../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const today = new Date();
const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
const defaultFrom = firstOfMonth.toISOString().slice(0, 10);
const defaultTo   = today.toISOString().slice(0, 10);

const fmt = (n: any) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(n) || 0);

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#84cc16','#f97316','#6366f1'];
const DOW_ORDER = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const DOW_IDX   = [1,2,3,4,5,6,0]; // JS getDay() → Mon-Sun

function dlXlsx(rows: Record<string,any>[], sheet: string, file: string) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), sheet);
  XLSX.writeFile(wb, file);
}

// ── Recharts custom tooltip ───────────────────────────────────────────────────
const CopTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.value > 1000 ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function ReportsContent() {
  const [activeTab, setActiveTab] = useState<'dashboard'|'reports'|'analytics'>('dashboard');
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo,   setDateTo]   = useState(defaultTo);

  // Dashboard data — field names match actual API responses
  const [summary,     setSummary]     = useState<any>(null);   // { revenue:{current,prev,change}, sales_count, avg_ticket, ... }
  const [salesTrend,  setSalesTrend]  = useState<any[]>([]);   // [{ period, sales_count, revenue, discounts }]
  const [topProducts, setTopProducts] = useState<any[]>([]);   // [{ id, name, sku, units_sold, revenue, gross_profit, category_name }]
  const [byCategory,  setByCategory]  = useState<any[]>([]);   // [{ category_name, units_sold, revenue }]
  const [hourly,      setHourly]      = useState<any[]>([]);   // [{ hour, label, sales_count, revenue }]
  const [topCustomers,setTopCustomers]= useState<any[]>([]);   // [{ id, name, purchases_count, total_spent, avg_ticket }]
  const [invHealth,   setInvHealth]   = useState<any>(null);   // { total_value, total_products, low_stock, out_of_stock, ... }
  const [loadingDash, setLoadingDash] = useState(false);

  // Top products limit selector
  const [topLimit, setTopLimit] = useState(10);

  // Report modal
  const [modalReport,    setModalReport]    = useState<null|{title:string;type:string;data:any}>(null);
  const [generatingType, setGeneratingType] = useState<string|null>(null);

  // Analytics advanced
  const [advPeriod,  setAdvPeriod]  = useState('30');
  const [advFormat,  setAdvFormat]  = useState('xlsx');
  const [advLoading, setAdvLoading] = useState(false);
  const [advData,    setAdvData]    = useState<any>(null);

  // Day-of-week breakdown computed from salesTrend
  const dowData = useMemo(() => {
    const acc: Record<string, { day: string; sales_count: number; revenue: number }> = {};
    DOW_ORDER.forEach(d => { acc[d] = { day: d, sales_count: 0, revenue: 0 }; });
    salesTrend.forEach(row => {
      if (!row.period) return;
      const d = new Date(row.period + 'T12:00:00');
      const dow = DOW_ORDER[DOW_IDX.indexOf(d.getDay())];
      if (!dow) return;
      acc[dow].sales_count += Number(row.sales_count) || 0;
      acc[dow].revenue     += Number(row.revenue)     || 0;
    });
    return DOW_ORDER.map(d => acc[d]);
  }, [salesTrend]);

  const loadDashboard = useCallback(async () => {
    setLoadingDash(true);
    try {
      const [s, st, tp, bc, h, tc, ih] = await Promise.allSettled([
        dashboardApi.getSummary(dateFrom, dateTo),
        dashboardApi.getSalesTrend(dateFrom, dateTo, 'day'),
        dashboardApi.getTopProducts(dateFrom, dateTo, topLimit),
        dashboardApi.getByCategory(dateFrom, dateTo),
        dashboardApi.getHourly(dateFrom, dateTo),
        dashboardApi.getTopCustomers(dateFrom, dateTo, 10),
        dashboardApi.getInventoryHealth(dateFrom, dateTo),
      ]);
      if (s.status  === 'fulfilled') setSummary(s.value?.data  ?? null);
      if (st.status === 'fulfilled') setSalesTrend(Array.isArray(st.value?.data)  ? st.value.data  : []);
      if (tp.status === 'fulfilled') setTopProducts(Array.isArray(tp.value?.data) ? tp.value.data  : []);
      if (bc.status === 'fulfilled') setByCategory(Array.isArray(bc.value?.data)  ? bc.value.data  : []);
      if (h.status  === 'fulfilled') setHourly(Array.isArray(h.value?.data)       ? h.value.data   : []);
      if (tc.status === 'fulfilled') setTopCustomers(Array.isArray(tc.value?.data)? tc.value.data  : []);
      if (ih.status === 'fulfilled') setInvHealth(ih.value?.data ?? null);
    } finally {
      setLoadingDash(false);
    }
  }, [dateFrom, dateTo, topLimit]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // ── Report generators ─────────────────────────────────────────────────────
  const generateReport = async (type: string) => {
    setGeneratingType(type);
    try {
      let title = '';
      let data: any = {};

      if (type === 'sales') {
        title = 'Reporte de Ventas';
        const [sr, tr] = await Promise.allSettled([
          saleApi.getSales({ date_from: dateFrom, date_to: dateTo, per_page: 500 }),
          dashboardApi.getSalesTrend(dateFrom, dateTo, 'day'),
        ]);
        data = {
          sales: sr.status === 'fulfilled' ? (sr.value?.data?.data ?? []) : [],
          trend: tr.status === 'fulfilled' ? (tr.value?.data ?? []) : [],
          summary,
        };
      } else if (type === 'inventory') {
        title = 'Estado de Inventario';
        const [pr] = await Promise.allSettled([productApi.getProducts({ per_page: 1000 })]);
        data = {
          products: pr.status === 'fulfilled' ? (pr.value?.data?.data ?? []) : [],
          health: invHealth,
        };
      } else if (type === 'customers') {
        title = 'Análisis de Clientes';
        const [cr] = await Promise.allSettled([customerApi.getCustomers({ per_page: 500 })]);
        data = {
          customers: cr.status === 'fulfilled' ? (cr.value?.data?.data ?? cr.value?.data ?? []) : [],
          top: topCustomers,
        };
      } else if (type === 'products') {
        title = 'Productos Top';
        const [tr] = await Promise.allSettled([dashboardApi.getTopProducts(dateFrom, dateTo, 50)]);
        data = { top: tr.status === 'fulfilled' ? (tr.value?.data ?? []) : [], byCategory };
      } else if (type === 'financial') {
        title = 'Reporte Financiero';
        data = { summary, trend: salesTrend, byCategory };
      } else if (type === 'orders') {
        title = 'Análisis de Órdenes';
        const [sr] = await Promise.allSettled([saleApi.getSales({ date_from: dateFrom, date_to: dateTo, per_page: 500 })]);
        data = {
          sales:  sr.status === 'fulfilled' ? (sr.value?.data?.data ?? []) : [],
          hourly, dowData,
        };
      }
      setModalReport({ title, type, data });
    } finally {
      setGeneratingType(null);
    }
  };

  const downloadReport = (type: string, data: any) => {
    const d2 = dateFrom + '_' + dateTo;
    if (type === 'sales') {
      dlXlsx((data.sales ?? []).map((s: any) => ({
        'N° Venta': s.sale_number, 'Fecha': s.sale_date?.slice(0,10),
        'Cliente': s.customer?.name ?? '—', 'Método': s.payment_method,
        'Subtotal': s.subtotal, 'Impuesto': s.tax_amount, 'Descuento': s.discount_amount,
        'Total': s.total_amount, 'Estado': s.status,
      })), 'Ventas', `reporte_ventas_${d2}.xlsx`);
    } else if (type === 'inventory') {
      dlXlsx((data.products ?? []).map((p: any) => ({
        'SKU': p.sku, 'Nombre': p.name, 'Categoría': p.category?.name ?? '',
        'Marca': p.brand?.name ?? '', 'Stock': p.stock_quantity,
        'Stock Mín': p.min_stock_level, 'Costo': p.cost_price,
        'Precio': p.unit_price, 'Valor Inventario': p.stock_quantity * p.cost_price,
      })), 'Inventario', `reporte_inventario_${dateFrom}.xlsx`);
    } else if (type === 'customers') {
      dlXlsx((data.customers ?? []).map((c: any) => ({
        'Nombre': c.name, 'Email': c.email ?? '', 'Teléfono': c.phone ?? '',
        'Tipo': c.customer_type ?? '', 'Ciudad': c.city ?? '',
        'N° Ventas': c.sales_count ?? 0, 'Total Comprado': c.total_sales_amount ?? 0,
      })), 'Clientes', `reporte_clientes_${d2}.xlsx`);
    } else if (type === 'products') {
      dlXlsx((data.top ?? []).map((p: any, i: number) => ({
        '#': i+1, 'Producto': p.name, 'SKU': p.sku ?? '',
        'Unidades Vendidas': p.units_sold ?? 0, 'Ingresos': p.revenue ?? 0,
        'Utilidad Bruta': p.gross_profit ?? 0, 'Categoría': p.category_name ?? '',
      })), 'Top Productos', `reporte_productos_${d2}.xlsx`);
    } else if (type === 'financial') {
      const s = data.summary ?? {};
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
        { Métrica: 'Ingresos',          Valor: s.revenue?.current        ?? 0 },
        { Métrica: 'Total Ventas',      Valor: s.sales_count?.current    ?? 0 },
        { Métrica: 'Ticket Promedio',   Valor: s.avg_ticket?.current     ?? 0 },
        { Métrica: 'Utilidad Bruta',    Valor: s.gross_profit?.current   ?? 0 },
        { Métrica: 'Descuentos',        Valor: s.discounts?.current      ?? 0 },
        { Métrica: 'Impuestos',         Valor: s.tax_collected?.current  ?? 0 },
        { Métrica: 'Nuevos Clientes',   Valor: s.new_customers?.current  ?? 0 },
      ]), 'Resumen');
      if (data.trend?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.trend), 'Tendencia');
      XLSX.writeFile(wb, `reporte_financiero_${d2}.xlsx`);
    } else if (type === 'orders') {
      dlXlsx((data.sales ?? []).map((s: any) => ({
        'N° Venta': s.sale_number, 'Fecha': s.sale_date?.slice(0,10),
        'Cliente': s.customer?.name ?? '—', 'Método': s.payment_method,
        'Total': s.total_amount, 'Estado': s.status,
      })), 'Órdenes', `reporte_ordenes_${d2}.xlsx`);
    }
  };

  // ── Advanced analytics ────────────────────────────────────────────────────
  const runAdvancedAnalysis = async () => {
    setAdvLoading(true);
    setAdvData(null);
    const days = parseInt(advPeriod);
    const from = new Date();
    from.setDate(from.getDate() - days);
    const fromStr = from.toISOString().slice(0,10);
    const toStr   = new Date().toISOString().slice(0,10);
    try {
      const [s, st, tp, tc, bc, h] = await Promise.allSettled([
        dashboardApi.getSummary(fromStr, toStr),
        dashboardApi.getSalesTrend(fromStr, toStr, days <= 31 ? 'day' : 'month'),
        dashboardApi.getTopProducts(fromStr, toStr, 15),
        dashboardApi.getTopCustomers(fromStr, toStr, 10),
        dashboardApi.getByCategory(fromStr, toStr),
        dashboardApi.getHourly(fromStr, toStr),
      ]);
      const result = {
        summary:      s.status  === 'fulfilled' ? (s.value?.data  ?? {}) : {},
        trend:        st.status === 'fulfilled' ? (st.value?.data ?? []) : [],
        topProducts:  tp.status === 'fulfilled' ? (tp.value?.data ?? []) : [],
        topCustomers: tc.status === 'fulfilled' ? (tc.value?.data ?? []) : [],
        byCategory:   bc.status === 'fulfilled' ? (bc.value?.data ?? []) : [],
        hourly:       h.status  === 'fulfilled' ? (h.value?.data  ?? []) : [],
        from: fromStr, to: toStr,
      };
      setAdvData(result);

      if (advFormat === 'xlsx') {
        const wb = XLSX.utils.book_new();
        const su = result.summary;
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
          { Métrica: 'Ingresos',        Valor: su.revenue?.current      ?? 0 },
          { Métrica: 'Total Ventas',    Valor: su.sales_count?.current  ?? 0 },
          { Métrica: 'Ticket Promedio', Valor: su.avg_ticket?.current   ?? 0 },
          { Métrica: 'Utilidad Bruta',  Valor: su.gross_profit?.current ?? 0 },
        ]), 'Resumen');
        if (result.trend.length)        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(result.trend),        'Tendencia');
        if (result.topProducts.length)  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(result.topProducts),  'Top Productos');
        if (result.topCustomers.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(result.topCustomers), 'Top Clientes');
        XLSX.writeFile(wb, `analisis_avanzado_${fromStr}_${toStr}.xlsx`);
      }
    } finally {
      setAdvLoading(false);
    }
  };

  const reportCards = [
    { title:'Reporte de Ventas',    desc:'Análisis detallado de ventas por período',       icon:BarChart3,   color:'blue',   type:'sales'     },
    { title:'Estado de Inventario', desc:'Reporte completo del inventario actual',          icon:Package,    color:'green',  type:'inventory' },
    { title:'Análisis de Clientes', desc:'Comportamiento y segmentación de clientes',       icon:Users,      color:'purple', type:'customers' },
    { title:'Productos Top',        desc:'Productos más vendidos y rentables',              icon:TrendingUp, color:'orange', type:'products'  },
    { title:'Reporte Financiero',   desc:'Estado financiero y flujo de caja',              icon:DollarSign, color:'emerald',type:'financial' },
    { title:'Análisis de Órdenes',  desc:'Estadísticas de órdenes de compra',              icon:ShoppingCart,color:'indigo',type:'orders'   },
  ];
  const btnColor: Record<string,string> = {
    blue:'bg-blue-600 hover:bg-blue-700', green:'bg-green-600 hover:bg-green-700',
    purple:'bg-purple-600 hover:bg-purple-700', orange:'bg-orange-600 hover:bg-orange-700',
    emerald:'bg-emerald-600 hover:bg-emerald-700', indigo:'bg-indigo-600 hover:bg-indigo-700',
  };
  const iconBg: Record<string,string> = {
    blue:'bg-blue-100 text-blue-600', green:'bg-green-100 text-green-600',
    purple:'bg-purple-100 text-purple-600', orange:'bg-orange-100 text-orange-600',
    emerald:'bg-emerald-100 text-emerald-600', indigo:'bg-indigo-100 text-indigo-600',
  };

  return (
    <div className="space-y-4">
      {/* Tabs + date range */}
      <div className="flex items-center justify-between border-b border-gray-200">
        <nav className="-mb-px flex space-x-6">
          {([['dashboard','Dashboard',BarChart3],['reports','Reportes',FileText],['analytics','Analytics',TrendingUp]] as const).map(([key,label,Icon]) => (
            <button key={key} onClick={() => setActiveTab(key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-1.5 ${activeTab===key?'border-blue-500 text-blue-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2 pb-1">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none" />
          <span className="text-gray-400 text-xs">—</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none" />
          <button onClick={loadDashboard} disabled={loadingDash}
            className="p-1.5 text-gray-500 hover:text-blue-600 border border-gray-200 rounded hover:bg-gray-50 transition-colors" title="Actualizar">
            <RefreshCw className={`w-3.5 h-3.5 ${loadingDash?'animate-spin':''}`} />
          </button>
        </div>
      </div>

      {/* ── DASHBOARD TAB ─────────────────────────────────── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          {loadingDash && (
            <div className="flex justify-center py-16 text-gray-400 text-sm gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />Cargando datos...
            </div>
          )}

          {!loadingDash && (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label:'Ingresos',       value:fmt(summary?.revenue?.current ?? 0),         sub:`vs ${fmt(summary?.revenue?.previous ?? 0)}`,   change:summary?.revenue?.change,      icon:DollarSign,   bg:'bg-green-100',  ic:'text-green-600'  },
                  { label:'Total Ventas',   value:summary?.sales_count?.current ?? 0,            sub:`vs ${summary?.sales_count?.previous ?? 0}`,    change:summary?.sales_count?.change,  icon:ShoppingCart, bg:'bg-blue-100',   ic:'text-blue-600'   },
                  { label:'Ticket Promedio',value:fmt(summary?.avg_ticket?.current ?? 0),        sub:`vs ${fmt(summary?.avg_ticket?.previous ?? 0)}`, change:summary?.avg_ticket?.change,   icon:TrendingUp,   bg:'bg-purple-100', ic:'text-purple-600' },
                  { label:'Utilidad Bruta', value:fmt(summary?.gross_profit?.current ?? 0),      sub:`vs ${fmt(summary?.gross_profit?.previous ?? 0)}`,change:summary?.gross_profit?.change,icon:DollarSign,  bg:'bg-orange-100', ic:'text-orange-600' },
                ].map(({ label, value, sub, change, icon: Icon, bg, ic }) => (
                  <div key={label} className="bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className="text-lg font-bold text-gray-900 mt-0.5">{value}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                      </div>
                      <div className={`p-2 ${bg} rounded-lg`}>
                        <Icon className={`w-4 h-4 ${ic}`} />
                      </div>
                    </div>
                    {change !== undefined && (
                      <p className={`text-xs font-medium mt-2 ${Number(change)>=0?'text-green-600':'text-red-500'}`}>
                        {Number(change)>=0?'▲':'▼'} {Math.abs(Number(change))}% vs período anterior
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Tendencia + Categorías */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Tendencia de Ingresos</h3>
                  {salesTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={salesTrend}>
                        <defs>
                          <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                        <XAxis dataKey="period" tick={{fontSize:10}} tickFormatter={v => v?.slice(5)??v}/>
                        <YAxis tick={{fontSize:10}} tickFormatter={v => `$${(v/1000).toFixed(0)}k`}/>
                        <Tooltip content={<CopTooltip/>}/>
                        <Legend wrapperStyle={{fontSize:11}}/>
                        <Area type="monotone" dataKey="revenue"     name="Ingresos" stroke="#3b82f6" fill="url(#gr)" strokeWidth={2}/>
                        <Area type="monotone" dataKey="sales_count" name="Ventas"   stroke="#10b981" fill="transparent" strokeWidth={2}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : <Empty/>}
                </div>

                <div className="bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Por Categoría</h3>
                  {byCategory.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={byCategory} dataKey="revenue" nameKey="category_name" cx="50%" cy="50%" outerRadius={65} label={({percent}) => `${(percent*100).toFixed(0)}%`} labelLine={false}>
                            {byCategory.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                          </Pie>
                          <Tooltip formatter={(v:any) => fmt(v)}/>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                        {byCategory.map((c,i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:COLORS[i%COLORS.length]}}/>
                            <span className="flex-1 truncate text-gray-600">{c.category_name}</span>
                            <span className="font-semibold text-gray-800">{fmt(c.revenue)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : <Empty/>}
                </div>
              </div>

              {/* Top productos + selector */}
              <div className="bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700">Productos Más Vendidos</h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span>Mostrar Top:</span>
                    {[5,10,15].map(n => (
                      <button key={n} onClick={() => setTopLimit(n)}
                        className={`px-2.5 py-1 rounded font-medium transition-colors ${topLimit===n?'bg-blue-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                {topProducts.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <ResponsiveContainer width="100%" height={topLimit*26+20}>
                      <BarChart data={topProducts.slice(0,topLimit)} layout="vertical" margin={{left:10,right:10}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                        <XAxis type="number" tick={{fontSize:9}} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
                        <YAxis type="category" dataKey="name" tick={{fontSize:9}} width={120}/>
                        <Tooltip content={<CopTooltip/>}/>
                        <Bar dataKey="revenue" name="Ingresos" fill="#3b82f6" radius={[0,4,4,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5">
                      {topProducts.slice(0,topLimit).map((p,i) => {
                        const max = topProducts[0]?.revenue ?? 1;
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400 w-5 text-right">{i+1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline">
                                <p className="text-xs font-medium text-gray-700 truncate">{p.name}</p>
                                <p className="text-xs text-gray-500 ml-1 whitespace-nowrap">{Number(p.units_sold)} un.</p>
                              </div>
                              <div className="mt-0.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full transition-all" style={{width:`${(p.revenue/max)*100}%`}}/>
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-gray-800 whitespace-nowrap">{fmt(p.revenue)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : <Empty/>}
              </div>

              {/* Días que más se vende + Horas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Días que Más se Vende</h3>
                  {dowData.some(d => d.sales_count > 0) ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={dowData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                        <XAxis dataKey="day" tick={{fontSize:11}}/>
                        <YAxis yAxisId="left"  tick={{fontSize:9}} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
                        <YAxis yAxisId="right" orientation="right" tick={{fontSize:9}}/>
                        <Tooltip content={<CopTooltip/>}/>
                        <Legend wrapperStyle={{fontSize:11}}/>
                        <Bar yAxisId="left"  dataKey="revenue"     name="Ingresos" fill="#3b82f6" radius={[4,4,0,0]}>
                          {dowData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                        </Bar>
                        <Bar yAxisId="right" dataKey="sales_count" name="Ventas"   fill="#10b981" radius={[4,4,0,0]} fillOpacity={0.5}/>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <Empty label="Sin datos para el período"/>}
                </div>

                <div className="bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Ventas por Hora del Día</h3>
                  {hourly.some(h => h.sales_count > 0) ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={hourly.filter(h => h.sales_count > 0 || hourly.length <= 24)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                        <XAxis dataKey="label" tick={{fontSize:9}}/>
                        <YAxis tick={{fontSize:9}}/>
                        <Tooltip content={<CopTooltip/>}/>
                        <Legend wrapperStyle={{fontSize:11}}/>
                        <Bar dataKey="sales_count" name="Ventas" fill="#10b981" radius={[4,4,0,0]}>
                          {hourly.map((h,i) => <Cell key={i} fill={h.sales_count === Math.max(...hourly.map(x=>x.sales_count)) ? '#f59e0b' : '#10b981'}/>)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <Empty label="Sin datos para el período"/>}
                </div>
              </div>

              {/* Inventario health */}
              {invHealth && (
                <div className="bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Salud del Inventario</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label:'Total Productos',  value:invHealth.total_products  ?? '—', cls:'bg-gray-50 text-gray-900' },
                      { label:'Stock Normal',     value:invHealth.normal_stock    ?? '—', cls:'bg-green-50 text-green-700' },
                      { label:'Stock Bajo',       value:invHealth.low_stock       ?? '—', cls:'bg-yellow-50 text-yellow-600' },
                      { label:'Sin Stock',        value:invHealth.out_of_stock    ?? '—', cls:'bg-red-50 text-red-600' },
                      { label:'Valor Total',      value:fmt(invHealth.total_value ?? 0),  cls:'bg-blue-50 text-blue-700' },
                      { label:'Sin Ventas (período)', value:invHealth.no_sales_in_period ?? '—', cls:'bg-orange-50 text-orange-600' },
                      { label:'Entradas Período', value:invHealth.stock_in_period  ?? '—', cls:'bg-gray-50 text-gray-700' },
                      { label:'Salidas Período',  value:invHealth.stock_out_period ?? '—', cls:'bg-gray-50 text-gray-700' },
                    ].map(({ label, value, cls }) => (
                      <div key={label} className={`p-3 rounded-lg ${cls.split(' ')[0]}`}>
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className={`text-lg font-bold mt-0.5 ${cls.split(' ')[1]}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── REPORTS TAB ───────────────────────────────────── */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportCards.map(({ title, desc, icon: Icon, color, type }) => (
            <div key={type} className="bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-5 flex flex-col">
              <div className={`w-10 h-10 ${iconBg[color]} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-gray-400 text-xs mb-4 flex-1">{desc}</p>
              <button
                onClick={() => generateReport(type)}
                disabled={generatingType === type}
                className={`${btnColor[color]} text-white py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60`}
              >
                {generatingType === type
                  ? <><RefreshCw className="w-3.5 h-3.5 animate-spin"/>Generando...</>
                  : <><Eye className="w-3.5 h-3.5"/>Ver Reporte</>}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── ANALYTICS TAB ─────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Análisis Avanzado</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Período de Análisis</label>
                <select value={advPeriod} onChange={e => setAdvPeriod(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option value="7">Últimos 7 días</option>
                  <option value="30">Últimos 30 días</option>
                  <option value="90">Últimos 3 meses</option>
                  <option value="180">Últimos 6 meses</option>
                  <option value="365">Último año</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Acción</label>
                <select value={advFormat} onChange={e => setAdvFormat(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option value="xlsx">Visualizar y Descargar Excel</option>
                  <option value="view">Solo Visualizar</option>
                </select>
              </div>
              <button onClick={runAdvancedAnalysis} disabled={advLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-60">
                {advLoading ? <><RefreshCw className="w-4 h-4 animate-spin"/>Analizando...</> : <><BarChart3 className="w-4 h-4"/>Generar Análisis</>}
              </button>
            </div>
          </div>

          {advData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label:'Ingresos',       value:fmt(advData.summary?.revenue?.current      ?? 0) },
                  { label:'Total Ventas',   value:advData.summary?.sales_count?.current       ?? 0 },
                  { label:'Ticket Promedio',value:fmt(advData.summary?.avg_ticket?.current    ?? 0) },
                  { label:'Utilidad Bruta', value:fmt(advData.summary?.gross_profit?.current  ?? 0) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-4">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Tendencia ({advData.from} → {advData.to})</h3>
                  {advData.trend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={advData.trend}>
                        <defs>
                          <linearGradient id="adv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                        <XAxis dataKey="period" tick={{fontSize:10}} tickFormatter={v=>v?.slice(5)??v}/>
                        <YAxis tick={{fontSize:10}} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
                        <Tooltip content={<CopTooltip/>}/>
                        <Area type="monotone" dataKey="revenue" name="Ingresos" stroke="#8b5cf6" fill="url(#adv)" strokeWidth={2}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : <Empty/>}
                </div>

                <div className="bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Por Categoría</h3>
                  {advData.byCategory.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={advData.byCategory} dataKey="revenue" nameKey="category_name" cx="50%" cy="50%" outerRadius={65} label={({percent}) => `${(percent*100).toFixed(0)}%`} labelLine={false}>
                            {advData.byCategory.map((_:any,i:number) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                          </Pie>
                          <Tooltip formatter={(v:any) => fmt(v)}/>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-2 space-y-1">
                        {advData.byCategory.map((c:any,i:number) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:COLORS[i%COLORS.length]}}/>
                            <span className="flex-1 truncate text-gray-600">{c.category_name}</span>
                            <span className="font-semibold text-gray-800">{fmt(c.revenue)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : <Empty/>}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Top 15 Productos</h3>
                  {advData.topProducts.length > 0 ? advData.topProducts.slice(0,15).map((p:any,i:number) => {
                    const max = advData.topProducts[0]?.revenue ?? 1;
                    return (
                      <div key={i} className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs text-gray-400 w-5 text-right">{i+1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate">{p.name}</p>
                          <div className="mt-0.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{width:`${(p.revenue/max)*100}%`}}/>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">{Number(p.units_sold)} un. · {fmt(p.revenue)}</span>
                      </div>
                    );
                  }) : <Empty/>}
                </div>

                <div className="bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Top 10 Clientes</h3>
                  {advData.topCustomers.length > 0 ? advData.topCustomers.slice(0,10).map((c:any,i:number) => {
                    const max = advData.topCustomers[0]?.total_spent ?? 1;
                    return (
                      <div key={i} className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs text-gray-400 w-5 text-right">{i+1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate">{c.name}</p>
                          <div className="mt-0.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{width:`${(c.total_spent/max)*100}%`}}/>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">{c.purchases_count} compras · {fmt(c.total_spent)}</span>
                      </div>
                    );
                  }) : <Empty/>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── REPORT MODAL ────────────────────────────────────── */}
      {modalReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
              <div>
                <h2 className="font-bold text-gray-900">{modalReport.title}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{dateFrom} → {dateTo}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => downloadReport(modalReport.type, modalReport.data)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                  <Download className="w-4 h-4"/>Descargar Excel
                </button>
                <button onClick={() => setModalReport(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5"/>
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* SALES */}
              {modalReport.type === 'sales' && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {label:'Total Ventas', value:modalReport.data.sales?.length ?? 0},
                      {label:'Ingresos',     value:fmt(modalReport.data.sales?.reduce((s:any,v:any)=>s+Number(v.total_amount),0)??0)},
                      {label:'Ticket Prom.', value:fmt(modalReport.data.sales?.length ? modalReport.data.sales.reduce((s:any,v:any)=>s+Number(v.total_amount),0)/modalReport.data.sales.length : 0)},
                    ].map(({label,value}) => <StatCard key={label} label={label} value={value}/>)}
                  </div>
                  {modalReport.data.trend?.length > 0 && (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={modalReport.data.trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                        <XAxis dataKey="period" tick={{fontSize:9}} tickFormatter={v=>v?.slice(5)??v}/>
                        <YAxis tick={{fontSize:9}} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
                        <Tooltip content={<CopTooltip/>}/>
                        <Bar dataKey="revenue" name="Ingresos" fill="#3b82f6" radius={[4,4,0,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  <SaleTable sales={modalReport.data.sales ?? []}/>
                </>
              )}

              {/* INVENTORY */}
              {modalReport.type === 'inventory' && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {label:'Total Productos', value:modalReport.data.products?.length??0},
                      {label:'Valor Total',     value:fmt(modalReport.data.products?.reduce((s:any,p:any)=>s+p.stock_quantity*p.cost_price,0)??0)},
                      {label:'Stock Bajo',      value:modalReport.data.products?.filter((p:any)=>p.stock_quantity<=p.min_stock_level).length??0},
                    ].map(({label,value}) => <StatCard key={label} label={label} value={value}/>)}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50"><tr>
                        {['SKU','Nombre','Categoría','Marca','Stock','Mín','Precio','Valor'].map(h=>(
                          <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {(modalReport.data.products??[]).slice(0,100).map((p:any)=>(
                          <tr key={p.id} className={`hover:bg-gray-50 ${p.stock_quantity<=p.min_stock_level?'bg-yellow-50':''}`}>
                            <td className="px-3 py-2 font-mono text-gray-500">{p.sku}</td>
                            <td className="px-3 py-2 font-medium text-gray-900">{p.name}</td>
                            <td className="px-3 py-2 text-gray-600">{p.category?.name??'—'}</td>
                            <td className="px-3 py-2 text-gray-600">{p.brand?.name??'—'}</td>
                            <td className={`px-3 py-2 font-semibold ${p.stock_quantity===0?'text-red-600':p.stock_quantity<=p.min_stock_level?'text-yellow-600':'text-green-600'}`}>{p.stock_quantity}</td>
                            <td className="px-3 py-2 text-gray-500">{p.min_stock_level}</td>
                            <td className="px-3 py-2 text-gray-700">{fmt(p.unit_price)}</td>
                            <td className="px-3 py-2 text-blue-700 font-medium">{fmt(p.stock_quantity*p.cost_price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* CUSTOMERS */}
              {modalReport.type === 'customers' && (
                <>
                  {modalReport.data.top?.length > 0 && (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={modalReport.data.top.slice(0,10)} layout="vertical" margin={{left:10,right:10}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                        <XAxis type="number" tick={{fontSize:9}} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
                        <YAxis type="category" dataKey="name" tick={{fontSize:9}} width={110}/>
                        <Tooltip content={<CopTooltip/>}/>
                        <Bar dataKey="total_spent" name="Total Comprado" fill="#8b5cf6" radius={[0,4,4,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50"><tr>
                        {['Nombre','Email','Teléfono','Tipo','Ciudad','Ventas','Total','Estado'].map(h=>(
                          <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {(modalReport.data.customers??[]).slice(0,100).map((c:any)=>(
                          <tr key={c.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium text-gray-900">{c.name}</td>
                            <td className="px-3 py-2 text-gray-500">{c.email??'—'}</td>
                            <td className="px-3 py-2 text-gray-500">{c.phone??'—'}</td>
                            <td className="px-3 py-2 text-gray-600">{c.customer_type??'—'}</td>
                            <td className="px-3 py-2 text-gray-600">{c.city??'—'}</td>
                            <td className="px-3 py-2 text-center text-gray-700">{c.sales_count??0}</td>
                            <td className="px-3 py-2 font-semibold text-green-700">{fmt(c.total_sales_amount??0)}</td>
                            <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded-full text-xs ${c.is_active?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{c.is_active?'Activo':'Inactivo'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* PRODUCTS TOP */}
              {modalReport.type === 'products' && (
                <>
                  {modalReport.data.top?.length > 0 && (
                    <ResponsiveContainer width="100%" height={Math.min(modalReport.data.top.length,20)*22+20}>
                      <BarChart data={modalReport.data.top.slice(0,20)} layout="vertical" margin={{left:10,right:10}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                        <XAxis type="number" tick={{fontSize:9}} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
                        <YAxis type="category" dataKey="name" tick={{fontSize:9}} width={130}/>
                        <Tooltip content={<CopTooltip/>}/>
                        <Bar dataKey="revenue" name="Ingresos" fill="#f59e0b" radius={[0,4,4,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50"><tr>
                        {['#','Producto','SKU','Categoría','Unidades','Ingresos','Utilidad'].map(h=>(
                          <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {(modalReport.data.top??[]).slice(0,50).map((p:any,i:number)=>(
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-400 font-bold">{i+1}</td>
                            <td className="px-3 py-2 font-medium text-gray-900">{p.name}</td>
                            <td className="px-3 py-2 font-mono text-gray-500">{p.sku??'—'}</td>
                            <td className="px-3 py-2 text-gray-600">{p.category_name??'—'}</td>
                            <td className="px-3 py-2 text-center text-blue-700 font-semibold">{p.units_sold??0}</td>
                            <td className="px-3 py-2 font-semibold text-green-700">{fmt(p.revenue??0)}</td>
                            <td className="px-3 py-2 text-purple-700">{fmt(p.gross_profit??0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* FINANCIAL */}
              {modalReport.type === 'financial' && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      {label:'Ingresos',        value:fmt(modalReport.data.summary?.revenue?.current??0)},
                      {label:'Total Ventas',    value:modalReport.data.summary?.sales_count?.current??0},
                      {label:'Ticket Promedio', value:fmt(modalReport.data.summary?.avg_ticket?.current??0)},
                      {label:'Utilidad Bruta',  value:fmt(modalReport.data.summary?.gross_profit?.current??0)},
                      {label:'Descuentos',      value:fmt(modalReport.data.summary?.discounts?.current??0)},
                      {label:'Impuestos',       value:fmt(modalReport.data.summary?.tax_collected?.current??0)},
                    ].map(({label,value}) => <StatCard key={label} label={label} value={value}/>)}
                  </div>
                  {modalReport.data.trend?.length > 0 && (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={modalReport.data.trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                        <XAxis dataKey="period" tick={{fontSize:9}} tickFormatter={v=>v?.slice(5)??v}/>
                        <YAxis tick={{fontSize:9}} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
                        <Tooltip content={<CopTooltip/>}/>
                        <Legend wrapperStyle={{fontSize:11}}/>
                        <Line type="monotone" dataKey="revenue"     name="Ingresos" stroke="#10b981" strokeWidth={2} dot={false}/>
                        <Line type="monotone" dataKey="sales_count" name="Ventas"   stroke="#3b82f6" strokeWidth={2} dot={false}/>
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </>
              )}

              {/* ORDERS */}
              {modalReport.type === 'orders' && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {label:'Total Órdenes',   value:modalReport.data.sales?.length??0},
                      {label:'Completadas',     value:modalReport.data.sales?.filter((s:any)=>s.status==='completed').length??0},
                      {label:'Canceladas',      value:modalReport.data.sales?.filter((s:any)=>s.status==='cancelled').length??0},
                    ].map(({label,value}) => <StatCard key={label} label={label} value={value}/>)}
                  </div>
                  {modalReport.data.hourly?.some((h:any)=>h.sales_count>0) && (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={modalReport.data.hourly}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                        <XAxis dataKey="label" tick={{fontSize:9}}/>
                        <YAxis tick={{fontSize:9}}/>
                        <Tooltip content={<CopTooltip/>}/>
                        <Bar dataKey="sales_count" name="Órdenes" fill="#6366f1" radius={[4,4,0,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  <SaleTable sales={modalReport.data.sales??[]}/>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Utility sub-components ────────────────────────────────────────────────────
function Empty({ label = 'Sin datos para el período seleccionado' }: { label?: string }) {
  return (
    <div className="h-52 flex items-center justify-center text-gray-400 text-sm">{label}</div>
  );
}

function StatCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

function SaleTable({ sales }: { sales: any[] }) {
  const fmt = (n: any) => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',minimumFractionDigits:0,maximumFractionDigits:0}).format(Number(n)||0);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-gray-50"><tr>
          {['N° Venta','Fecha','Cliente','Método','Total','Estado'].map(h=>(
            <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase">{h}</th>
          ))}
        </tr></thead>
        <tbody className="divide-y divide-gray-100">
          {sales.slice(0,100).map((s:any)=>(
            <tr key={s.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 font-mono text-blue-600">{s.sale_number}</td>
              <td className="px-3 py-2 text-gray-600">{s.sale_date?.slice(0,10)}</td>
              <td className="px-3 py-2 text-gray-700">{s.customer?.name??'—'}</td>
              <td className="px-3 py-2 text-gray-600">{s.payment_method}</td>
              <td className="px-3 py-2 font-semibold text-green-700">{fmt(s.total_amount)}</td>
              <td className="px-3 py-2">
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${s.status==='completed'?'bg-green-100 text-green-700':s.status==='cancelled'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700'}`}>{s.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
