'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  label: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const fmt = (d: Date) => d.toISOString().slice(0, 10);

const today = () => {
  const d = new Date();
  return fmt(d);
};

const presets: { label: string; getRange: () => { from: string; to: string } }[] = [
  {
    label: 'Hoy',
    getRange: () => { const t = today(); return { from: t, to: t }; },
  },
  {
    label: 'Ayer',
    getRange: () => {
      const d = new Date(); d.setDate(d.getDate() - 1);
      const s = fmt(d); return { from: s, to: s };
    },
  },
  {
    label: 'Esta semana',
    getRange: () => {
      const d = new Date();
      const day = d.getDay() || 7;
      const mon = new Date(d); mon.setDate(d.getDate() - day + 1);
      return { from: fmt(mon), to: today() };
    },
  },
  {
    label: 'Últimos 7 días',
    getRange: () => {
      const d = new Date(); d.setDate(d.getDate() - 6);
      return { from: fmt(d), to: today() };
    },
  },
  {
    label: 'Este mes',
    getRange: () => {
      const d = new Date();
      const first = new Date(d.getFullYear(), d.getMonth(), 1);
      return { from: fmt(first), to: today() };
    },
  },
  {
    label: 'Últimos 30 días',
    getRange: () => {
      const d = new Date(); d.setDate(d.getDate() - 29);
      return { from: fmt(d), to: today() };
    },
  },
  {
    label: 'Últimos 90 días',
    getRange: () => {
      const d = new Date(); d.setDate(d.getDate() - 89);
      return { from: fmt(d), to: today() };
    },
  },
  {
    label: 'Este año',
    getRange: () => {
      const d = new Date();
      const first = new Date(d.getFullYear(), 0, 1);
      return { from: fmt(first), to: today() };
    },
  },
];

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(value.from);
  const [customTo, setCustomTo]   = useState(value.to);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click afuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectPreset = (preset: typeof presets[0]) => {
    const range = preset.getRange();
    onChange({ ...range, label: preset.label });
    setCustomFrom(range.from);
    setCustomTo(range.to);
    setOpen(false);
  };

  const applyCustom = () => {
    if (!customFrom || !customTo) return;
    const from = customFrom <= customTo ? customFrom : customTo;
    const to   = customFrom <= customTo ? customTo   : customFrom;
    onChange({ from, to, label: 'Rango personalizado' });
    setOpen(false);
  };

  const formatDisplay = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
      >
        <Calendar className="w-4 h-4 text-gray-500" />
        <span>
          {value.label !== 'Rango personalizado'
            ? value.label
            : `${formatDisplay(value.from)} – ${formatDisplay(value.to)}`}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Presets */}
          <div className="p-3 border-b">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Períodos rápidos</p>
            <div className="grid grid-cols-2 gap-1">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => selectPreset(p)}
                  className={`text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    value.label === p.label
                      ? 'bg-blue-600 text-white font-medium'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rango personalizado */}
          <div className="p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Rango personalizado</p>
            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                <label className="text-xs text-gray-500 w-10">Desde</label>
                <input
                  type="date"
                  value={customFrom}
                  max={customTo || today()}
                  onChange={e => setCustomFrom(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 items-center">
                <label className="text-xs text-gray-500 w-10">Hasta</label>
                <input
                  type="date"
                  value={customTo}
                  min={customFrom}
                  max={today()}
                  onChange={e => setCustomTo(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={applyCustom}
                disabled={!customFrom || !customTo}
                className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Aplicar rango
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
