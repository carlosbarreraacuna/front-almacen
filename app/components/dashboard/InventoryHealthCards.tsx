'use client';

import { Package, AlertTriangle, XCircle, DollarSign, ArrowDown, ArrowUp, TrendingDown } from 'lucide-react';

interface InventoryHealthData {
  total_value:        number;
  total_products:     number;
  normal_stock:       number;
  low_stock:          number;
  out_of_stock:       number;
  stock_in_period:    number;
  stock_out_period:   number;
  no_sales_in_period: number;
}

interface InventoryHealthCardsProps {
  data: InventoryHealthData | null;
  loading: boolean;
}

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

function MiniCard({
  title, value, sub, icon: Icon, iconBg, border, loading,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconBg: string;
  border: string;
  loading: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3 ${border}`}>
      <div className={`p-2.5 rounded-lg flex-shrink-0 ${iconBg}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{title}</p>
        {loading ? (
          <div className="h-5 w-20 bg-gray-200 animate-pulse rounded mt-1" />
        ) : (
          <>
            <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
            {sub && <p className="text-xs text-gray-400">{sub}</p>}
          </>
        )}
      </div>
    </div>
  );
}

export default function InventoryHealthCards({ data, loading }: InventoryHealthCardsProps) {
  const pctLow = data && data.total_products > 0
    ? Math.round((data.low_stock / data.total_products) * 100)
    : 0;
  const pctOut = data && data.total_products > 0
    ? Math.round((data.out_of_stock / data.total_products) * 100)
    : 0;

  const cards = [
    {
      title:   'Valor del inventario',
      value:   data ? formatCOP(data.total_value) : '—',
      sub:     data ? `${data.total_products} productos activos` : undefined,
      icon:    DollarSign,
      iconBg:  'bg-blue-600',
      border:  'border-blue-100',
    },
    {
      title:   'Stock normal',
      value:   data ? String(data.normal_stock) : '—',
      sub:     data ? `${data.total_products - data.out_of_stock - data.low_stock} de ${data.total_products}` : undefined,
      icon:    Package,
      iconBg:  'bg-emerald-600',
      border:  'border-emerald-100',
    },
    {
      title:   'Stock bajo',
      value:   data ? String(data.low_stock) : '—',
      sub:     data ? `${pctLow}% del catálogo` : undefined,
      icon:    AlertTriangle,
      iconBg:  data && data.low_stock > 0 ? 'bg-yellow-500' : 'bg-gray-400',
      border:  data && data.low_stock > 0 ? 'border-yellow-100' : 'border-gray-100',
    },
    {
      title:   'Sin stock',
      value:   data ? String(data.out_of_stock) : '—',
      sub:     data ? `${pctOut}% del catálogo` : undefined,
      icon:    XCircle,
      iconBg:  data && data.out_of_stock > 0 ? 'bg-red-600' : 'bg-gray-400',
      border:  data && data.out_of_stock > 0 ? 'border-red-100' : 'border-gray-100',
    },
    {
      title:   'Entradas (período)',
      value:   data ? String(data.stock_in_period) : '—',
      sub:     'Unidades ingresadas',
      icon:    ArrowUp,
      iconBg:  'bg-teal-600',
      border:  'border-teal-100',
    },
    {
      title:   'Salidas (período)',
      value:   data ? String(data.stock_out_period) : '—',
      sub:     'Unidades despachadas',
      icon:    ArrowDown,
      iconBg:  'bg-indigo-600',
      border:  'border-indigo-100',
    },
    {
      title:   'Sin ventas (período)',
      value:   data ? String(data.no_sales_in_period) : '—',
      sub:     'Productos con posible sobrestock',
      icon:    TrendingDown,
      iconBg:  data && data.no_sales_in_period > 0 ? 'bg-orange-500' : 'bg-gray-400',
      border:  data && data.no_sales_in_period > 0 ? 'border-orange-100' : 'border-gray-100',
    },
  ];

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-gray-800">Salud del Inventario</h3>
        <p className="text-xs text-gray-400 mt-0.5">Snapshot actual del inventario</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
        {cards.map(c => (
          <MiniCard key={c.title} {...c} loading={loading} />
        ))}
      </div>
    </div>
  );
}
