'use client';

import { useState } from 'react';
import { Package, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface TopProduct {
  id: number;
  name: string;
  sku: string;
  image_url: string | null;
  category_name: string | null;
  units_sold: number;
  revenue: number;
  gross_profit: number;
  revenue_pct: number;
  stock: number;
  stock_status: 'ok' | 'low' | 'out';
}

interface TopProductsTableProps {
  data: TopProduct[];
  loading: boolean;
  limit: number;
  onLimitChange: (l: number) => void;
}

type SortKey = 'revenue' | 'units_sold' | 'gross_profit' | 'stock';

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

const stockBadge = (status: string, stock: number) => {
  if (status === 'out') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Agotado</span>;
  if (status === 'low') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">{stock} bajo</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">{stock}</span>;
};

function SortIcon({ col, sortKey, dir }: { col: SortKey; sortKey: SortKey; dir: 'asc' | 'desc' }) {
  if (col !== sortKey) return <ChevronsUpDown className="w-3 h-3 text-gray-300 inline ml-1" />;
  return dir === 'asc'
    ? <ChevronUp className="w-3 h-3 text-blue-600 inline ml-1" />
    : <ChevronDown className="w-3 h-3 text-blue-600 inline ml-1" />;
}

export default function TopProductsTable({ data, loading, limit, onLimitChange }: TopProductsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('revenue');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = [...data].sort((a, b) => {
    const diff = (a[sortKey] as number) - (b[sortKey] as number);
    return sortDir === 'asc' ? diff : -diff;
  });

  const cols: { key: SortKey; label: string }[] = [
    { key: 'revenue',     label: 'Ingresos' },
    { key: 'units_sold',  label: 'Unidades' },
    { key: 'gross_profit',label: 'Utilidad' },
    { key: 'stock',       label: 'Stock' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800">Top Productos</h3>
          <p className="text-xs text-gray-400 mt-0.5">Más vendidos en el período</p>
        </div>
        <select
          value={limit}
          onChange={e => onLimitChange(Number(e.target.value))}
          className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {[5, 10, 20].map(n => <option key={n} value={n}>Top {n}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500 uppercase">#</th>
              <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500 uppercase">Producto</th>
              {cols.map(c => (
                <th
                  key={c.key}
                  onClick={() => handleSort(c.key)}
                  className="text-right py-2 px-2 text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-700"
                >
                  {c.label}
                  <SortIcon col={c.key} sortKey={sortKey} dir={sortDir} />
                </th>
              ))}
              <th className="text-right py-2 px-2 text-xs font-semibold text-gray-500 uppercase">% Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="py-3 px-2">
                        <div className="h-4 bg-gray-100 animate-pulse rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              : sorted.length === 0
              ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 text-sm">
                    Sin ventas en el período seleccionado
                  </td>
                </tr>
              )
              : sorted.map((p, idx) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-2 text-xs text-gray-400 font-semibold">{idx + 1}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-8 h-8 rounded object-cover border border-gray-200 flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-gray-300" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate max-w-[160px] text-xs">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right font-semibold text-blue-700 text-xs">{formatCOP(p.revenue)}</td>
                  <td className="py-3 px-2 text-right text-gray-700 text-xs font-medium">{p.units_sold}</td>
                  <td className="py-3 px-2 text-right text-emerald-700 font-semibold text-xs">{formatCOP(p.gross_profit)}</td>
                  <td className="py-3 px-2 text-right">{stockBadge(p.stock_status, p.stock)}</td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-semibold text-gray-700">{p.revenue_pct}%</span>
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min(100, p.revenue_pct)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
