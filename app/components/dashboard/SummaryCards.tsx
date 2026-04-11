'use client';

import { TrendingUp, TrendingDown, Minus, DollarSign, ShoppingCart, Receipt, Users, Tag, Percent } from 'lucide-react';

interface KpiValue {
  current: number;
  previous: number;
  change: number;
}

interface SummaryData {
  revenue:       KpiValue;
  sales_count:   KpiValue;
  avg_ticket:    KpiValue;
  gross_profit:  KpiValue;
  discounts:     KpiValue;
  tax_collected: KpiValue;
  new_customers: KpiValue;
}

interface SummaryCardsProps {
  data: SummaryData | null;
  loading: boolean;
}

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

function ChangeChip({ change }: { change: number }) {
  const abs = Math.abs(change);
  if (abs < 0.1) return (
    <span className="inline-flex items-center gap-0.5 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
      <Minus className="w-3 h-3" /> Sin cambio
    </span>
  );
  const up = change > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full font-semibold ${
      up ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
    }`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {abs}%
    </span>
  );
}

function Card({
  title, value, icon: Icon, color, change, subtitle, loading,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  change: number;
  subtitle?: string;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      {loading ? (
        <div className="h-7 w-32 bg-gray-200 animate-pulse rounded" />
      ) : (
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
      )}
      <div className="flex items-center gap-2">
        {loading ? (
          <div className="h-5 w-24 bg-gray-100 animate-pulse rounded-full" />
        ) : (
          <>
            <ChangeChip change={change} />
            <span className="text-xs text-gray-400">vs período anterior</span>
          </>
        )}
      </div>
      {subtitle && !loading && (
        <p className="text-xs text-gray-400 -mt-1">{subtitle}</p>
      )}
    </div>
  );
}

export default function SummaryCards({ data, loading }: SummaryCardsProps) {
  const cards = [
    {
      title: 'Ingresos',
      value: data ? formatCOP(data.revenue.current) : '—',
      icon: DollarSign,
      color: 'bg-blue-600',
      change: data?.revenue.change ?? 0,
    },
    {
      title: 'Ventas',
      value: data ? String(data.sales_count.current) : '—',
      icon: ShoppingCart,
      color: 'bg-indigo-600',
      change: data?.sales_count.change ?? 0,
    },
    {
      title: 'Ticket promedio',
      value: data ? formatCOP(data.avg_ticket.current) : '—',
      icon: Receipt,
      color: 'bg-violet-600',
      change: data?.avg_ticket.change ?? 0,
    },
    {
      title: 'Utilidad bruta',
      value: data ? formatCOP(data.gross_profit.current) : '—',
      icon: TrendingUp,
      color: 'bg-emerald-600',
      change: data?.gross_profit.change ?? 0,
    },
    {
      title: 'Descuentos',
      value: data ? formatCOP(data.discounts.current) : '—',
      icon: Tag,
      color: 'bg-orange-500',
      change: data?.discounts.change ?? 0,
    },
    {
      title: 'IVA recaudado',
      value: data ? formatCOP(data.tax_collected.current) : '—',
      icon: Percent,
      color: 'bg-teal-600',
      change: data?.tax_collected.change ?? 0,
    },
    {
      title: 'Nuevos clientes',
      value: data ? String(data.new_customers.current) : '—',
      icon: Users,
      color: 'bg-pink-600',
      change: data?.new_customers.change ?? 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      {cards.map((c) => (
        <Card key={c.title} {...c} loading={loading} />
      ))}
    </div>
  );
}
