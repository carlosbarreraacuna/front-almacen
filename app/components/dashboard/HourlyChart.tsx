'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

interface HourRow {
  hour: number;
  label: string;
  sales_count: number;
  revenue: number;
}

interface HourlyChartProps {
  data: HourRow[];
  loading: boolean;
}

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, notation: 'compact' }).format(n);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-gray-600">{payload[0]?.payload?.sales_count} ventas</p>
      <p className="font-bold text-gray-900">{formatCOP(payload[0]?.payload?.revenue ?? 0)}</p>
    </div>
  );
};

export default function HourlyChart({ data, loading }: HourlyChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="h-5 w-48 bg-gray-200 animate-pulse rounded mb-4" />
        <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.sales_count), 1);
  const peakHour = data.reduce((best, d) => d.sales_count > best.sales_count ? d : best, data[0]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800">Ventas por Hora</h3>
          <p className="text-xs text-gray-400 mt-0.5">Distribución horaria del período</p>
        </div>
        {peakHour && peakHour.sales_count > 0 && (
          <div className="text-right">
            <p className="text-xs text-gray-400">Hora pico</p>
            <p className="text-sm font-bold text-blue-600">{peakHour.label}</p>
            <p className="text-xs text-gray-500">{peakHour.sales_count} ventas</p>
          </div>
        )}
      </div>

      {data.every(d => d.sales_count === 0) ? (
        <div className="h-44 flex items-center justify-center text-gray-400 text-sm">
          Sin datos para el período seleccionado
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              interval={1}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={25}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="sales_count" radius={[3, 3, 0, 0]} maxBarSize={18}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.sales_count === maxCount && maxCount > 0 ? '#2563eb' : '#bfdbfe'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
