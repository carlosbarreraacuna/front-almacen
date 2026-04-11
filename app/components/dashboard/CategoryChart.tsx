'use client';

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell,
} from 'recharts';

interface CategoryRow {
  category_name: string;
  units_sold: number;
  revenue: number;
}

interface CategoryChartProps {
  data: CategoryRow[];
  loading: boolean;
}

const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#be185d', '#65a30d'];

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, notation: 'compact' }).format(n);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1 truncate max-w-[180px]">{label}</p>
      <p className="text-gray-600">{payload[0]?.payload?.units_sold} unidades</p>
      <p className="font-bold text-gray-900">{formatCOP(payload[0]?.value ?? 0)}</p>
    </div>
  );
};

export default function CategoryChart({ data, loading }: CategoryChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="h-5 w-48 bg-gray-200 animate-pulse rounded mb-4" />
        <div className="h-56 bg-gray-100 animate-pulse rounded-lg" />
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  const totalRevenue = sorted.reduce((s, r) => s + r.revenue, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800">Ingresos por Categoría</h3>
        <p className="text-xs text-gray-400 mt-0.5">Distribución de ventas por categoría de producto</p>
      </div>

      {sorted.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
          Sin datos para el período seleccionado
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={sorted}
              layout="vertical"
              margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis
                type="number"
                tickFormatter={formatCOP}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="category_name"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={20}>
                {sorted.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Mini tabla de % */}
          <div className="mt-3 space-y-1.5">
            {sorted.map((row, i) => (
              <div key={row.category_name} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-gray-600 flex-1 truncate">{row.category_name}</span>
                <span className="text-gray-400">{row.units_sold} uds</span>
                <span className="font-semibold text-gray-700 w-16 text-right">
                  {totalRevenue > 0 ? ((row.revenue / totalRevenue) * 100).toFixed(1) : 0}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
