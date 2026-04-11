'use client';

import {
  ResponsiveContainer, ComposedChart, Line, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

interface TrendRow {
  period: string;
  sales_count: number;
  revenue: number;
  discounts: number;
}

interface SalesTrendChartProps {
  data: TrendRow[];
  loading: boolean;
  groupBy: string;
}

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, notation: 'compact' }).format(n);

const formatPeriod = (period: string, groupBy: string) => {
  if (groupBy === 'day') {
    const [, m, d] = period.split('-');
    return `${d}/${m}`;
  }
  if (groupBy === 'week') return period.replace(/(\d{4})-W(\d+)/, 'S$2');
  if (groupBy === 'month') {
    const [y, m] = period.split('-');
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${months[parseInt(m) - 1]} ${y.slice(2)}`;
  }
  return period;
};

const CustomTooltip = ({ active, payload, label, groupBy }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{formatPeriod(label, groupBy)}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}:</span>
          <span className="font-semibold">
            {p.dataKey === 'revenue' ? formatCOP(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function SalesTrendChart({ data, loading, groupBy }: SalesTrendChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="h-5 w-48 bg-gray-200 animate-pulse rounded mb-4" />
        <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
      </div>
    );
  }

  const formatted = data.map(row => ({
    ...row,
    label: formatPeriod(row.period, groupBy),
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-gray-800">Tendencia de Ventas</h3>
          <p className="text-xs text-gray-400 mt-0.5">Ingresos y número de ventas por período</p>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
          Agrupado por {groupBy === 'day' ? 'día' : groupBy === 'week' ? 'semana' : 'mes'}
        </span>
      </div>

      {formatted.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
          Sin datos para el período seleccionado
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="revenue"
              orientation="left"
              tickFormatter={formatCOP}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              width={75}
            />
            <YAxis
              yAxisId="count"
              orientation="right"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              width={35}
            />
            <Tooltip content={<CustomTooltip groupBy={groupBy} />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              formatter={(value) => value === 'revenue' ? 'Ingresos' : 'Ventas'}
            />
            <Bar
              yAxisId="count"
              dataKey="sales_count"
              name="Ventas"
              fill="#e0e7ff"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="revenue"
              type="monotone"
              dataKey="revenue"
              name="Ingresos"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#2563eb' }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
