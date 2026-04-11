'use client';

import { useState } from 'react';
import { User, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface TopCustomer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  customer_type: string | null;
  purchases_count: number;
  total_spent: number;
  avg_ticket: number;
  last_purchase: string;
}

interface TopCustomersTableProps {
  data: TopCustomer[];
  loading: boolean;
  limit: number;
  onLimitChange: (l: number) => void;
}

type SortKey = 'total_spent' | 'purchases_count' | 'avg_ticket';

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

const formatDate = (s: string) => {
  const d = new Date(s);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const typeBadge: Record<string, string> = {
  individual: 'bg-blue-100 text-blue-700',
  business:   'bg-purple-100 text-purple-700',
  wholesale:  'bg-orange-100 text-orange-700',
};
const typeLabel: Record<string, string> = {
  individual: 'Individual',
  business:   'Empresa',
  wholesale:  'Mayorista',
};

function SortIcon({ col, sortKey, dir }: { col: SortKey; sortKey: SortKey; dir: 'asc' | 'desc' }) {
  if (col !== sortKey) return <ChevronsUpDown className="w-3 h-3 text-gray-300 inline ml-1" />;
  return dir === 'asc'
    ? <ChevronUp className="w-3 h-3 text-blue-600 inline ml-1" />
    : <ChevronDown className="w-3 h-3 text-blue-600 inline ml-1" />;
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const colors = ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-emerald-100 text-emerald-700',
    'bg-orange-100 text-orange-700', 'bg-pink-100 text-pink-700'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${color}`}>
      {initials}
    </div>
  );
}

export default function TopCustomersTable({ data, loading, limit, onLimitChange }: TopCustomersTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('total_spent');
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
    { key: 'total_spent',    label: 'Total' },
    { key: 'purchases_count',label: 'Compras' },
    { key: 'avg_ticket',     label: 'Promedio' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800">Top Clientes</h3>
          <p className="text-xs text-gray-400 mt-0.5">Mayor facturación en el período</p>
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
              <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
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
              <th className="text-right py-2 px-2 text-xs font-semibold text-gray-500 uppercase">Última compra</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="py-3 px-2">
                        <div className="h-4 bg-gray-100 animate-pulse rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              : sorted.length === 0
              ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 text-sm">
                    Sin clientes con compras en el período
                  </td>
                </tr>
              )
              : sorted.map((c, idx) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-2 text-xs text-gray-400 font-semibold">{idx + 1}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={c.name} />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate max-w-[150px] text-xs">{c.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {c.customer_type && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${typeBadge[c.customer_type] ?? 'bg-gray-100 text-gray-600'}`}>
                              {typeLabel[c.customer_type] ?? c.customer_type}
                            </span>
                          )}
                          {c.phone && <span className="text-xs text-gray-400">{c.phone}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right font-bold text-blue-700 text-xs">{formatCOP(c.total_spent)}</td>
                  <td className="py-3 px-2 text-right text-gray-700 text-xs font-medium">{c.purchases_count}</td>
                  <td className="py-3 px-2 text-right text-gray-600 text-xs">{formatCOP(c.avg_ticket)}</td>
                  <td className="py-3 px-2 text-right text-gray-400 text-xs">{formatDate(c.last_purchase)}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
