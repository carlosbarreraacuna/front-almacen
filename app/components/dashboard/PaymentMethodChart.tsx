'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface PaymentRow {
  payment_method: string;
  count: number;
  total: number;
}

interface PaymentMethodChartProps {
  data: PaymentRow[];
  loading: boolean;
}

const COLORS: Record<string, string> = {
  cash:     '#10b981',
  card:     '#3b82f6',
  transfer: '#8b5cf6',
  check:    '#f59e0b',
  credit:   '#ef4444',
};
const DEFAULT_COLOR = '#6b7280';

const LABELS: Record<string, string> = {
  cash:     'Efectivo',
  card:     'Tarjeta',
  transfer: 'Transferencia',
  check:    'Cheque',
  credit:   'Crédito',
};

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, notation: 'compact' }).format(n);

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{d.label}</p>
      <p className="text-gray-600">{d.count} ventas</p>
      <p className="font-bold text-gray-900">{formatCOP(d.total)}</p>
    </div>
  );
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

export default function PaymentMethodChart({ data, loading }: PaymentMethodChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="h-5 w-48 bg-gray-200 animate-pulse rounded mb-4" />
        <div className="h-56 bg-gray-100 animate-pulse rounded-lg" />
      </div>
    );
  }

  const chartData = data.map(d => ({
    ...d,
    label: LABELS[d.payment_method] ?? d.payment_method,
    fill:  COLORS[d.payment_method] ?? DEFAULT_COLOR,
  }));

  const totalRevenue = chartData.reduce((s, d) => s + d.total, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800">Métodos de Pago</h3>
        <p className="text-xs text-gray-400 mt-0.5">Distribución de ingresos por método</p>
      </div>

      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
          Sin datos para el período
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                dataKey="total"
                labelLine={false}
                label={renderCustomLabel}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(_, entry: any) => entry.payload.label}
                wrapperStyle={{ fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Tabla resumen */}
          <div className="mt-3 space-y-1.5">
            {chartData.map((d) => (
              <div key={d.payment_method} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.fill }} />
                  <span className="text-gray-600">{d.label}</span>
                </div>
                <div className="flex gap-3 text-right">
                  <span className="text-gray-400">{d.count} ventas</span>
                  <span className="font-semibold text-gray-800 w-24">{formatCOP(d.total)}</span>
                  <span className="text-gray-400 w-10">
                    {totalRevenue > 0 ? ((d.total / totalRevenue) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
