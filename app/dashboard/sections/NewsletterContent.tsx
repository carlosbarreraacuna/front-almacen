'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Mail, Users, Send, CheckCircle2, AlertCircle, RefreshCw,
  ChevronDown, ChevronUp, History, LayoutTemplate, Plus,
  Trash2, Edit2, X, Save, Eye, Tag, Flame, Calendar, Megaphone,
} from 'lucide-react';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Subscriber { id: number; name: string; email: string; first_name: string | null; last_name: string | null; }
interface Template { id: number; name: string; description: string | null; category: string; html_body: string; is_default: boolean; }
interface Campaign { id: number; subject: string; sent_count: number; failed_count: number; recipient_count: number; status: string; sent_at: string; }
type TplMode = 'promo' | 'product' | 'flash' | 'event' | 'general' | 'custom';

// ── Auth ───────────────────────────────────────────────────────────────────────
function h(): Record<string, string> {
  const t = Cookies.get('auth_token');
  return { 'Content-Type': 'application/json', Accept: 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}
async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { ...opts, headers: h() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error');
  return data;
}

// ── Mode config ────────────────────────────────────────────────────────────────
const MODES: { id: TplMode; label: string; icon: React.ElementType; active: string; ring: string; defaultSubject: string }[] = [
  { id: 'promo',   label: 'Promoción',      icon: Tag,           active: 'bg-orange-50 border-orange-400 text-orange-700', ring: 'text-orange-500', defaultSubject: '🔥 Promociones especiales del mes – Moto Spa' },
  { id: 'product', label: 'Nuevo producto', icon: Megaphone,     active: 'bg-green-50 border-green-400 text-green-700',   ring: 'text-green-500',  defaultSubject: '✨ Nuevo en catálogo – Moto Spa' },
  { id: 'flash',   label: 'Oferta flash',   icon: Flame,         active: 'bg-red-50 border-red-400 text-red-700',         ring: 'text-red-500',    defaultSubject: '⚡ Liquidación por tiempo limitado – Moto Spa' },
  { id: 'event',   label: 'Evento',         icon: Calendar,      active: 'bg-blue-50 border-blue-400 text-blue-700',      ring: 'text-blue-500',   defaultSubject: '📅 Te invitamos a un evento especial – Moto Spa' },
  { id: 'general', label: 'General',        icon: Mail,          active: 'bg-gray-100 border-gray-400 text-gray-700',     ring: 'text-gray-500',   defaultSubject: 'Boletín informativo – Moto Spa' },
  { id: 'custom',  label: 'HTML libre',     icon: LayoutTemplate,active: 'bg-purple-50 border-purple-400 text-purple-700',ring: 'text-purple-500', defaultSubject: '' },
];

// ── Field definitions ──────────────────────────────────────────────────────────
interface FDef { key: string; label: string; type: 'text'|'textarea'|'number'; ph?: string; opt?: boolean; sec?: string; }

const FIELDS: Record<string, FDef[]> = {
  promo: [
    { key:'feat_name',  label:'Nombre del producto destacado', type:'text',   ph:'Ej: Casco Integral LS2 Thunder',   sec:'⭐ Producto destacado' },
    { key:'feat_desc',  label:'Descripción breve',              type:'text',   ph:'Ej: Ideal para todo tipo de moto', sec:'⭐ Producto destacado' },
    { key:'feat_price', label:'Precio de oferta',               type:'number', ph:'89000',                            sec:'⭐ Producto destacado' },
    { key:'feat_orig',  label:'Precio original',                type:'number', ph:'120000',   opt:true,               sec:'⭐ Producto destacado' },
    { key:'feat_pct',   label:'Descuento (%)',                   type:'number', ph:'25',       opt:true,               sec:'⭐ Producto destacado' },
    { key:'p1_name',   label:'Nombre',         type:'text',   ph:'Ej: Guantes Alpinestars', opt:true, sec:'📦 Producto adicional 1' },
    { key:'p1_ref',    label:'Referencia',     type:'text',   ph:'Ej: ALP-SP-2025',         opt:true, sec:'📦 Producto adicional 1' },
    { key:'p1_price',  label:'Precio oferta',  type:'number', ph:'55000',                   opt:true, sec:'📦 Producto adicional 1' },
    { key:'p1_orig',   label:'Precio original',type:'number', ph:'75000',                   opt:true, sec:'📦 Producto adicional 1' },
    { key:'p2_name',   label:'Nombre',         type:'text',   ph:'Ej: Aceite Motul 5100',   opt:true, sec:'📦 Producto adicional 2' },
    { key:'p2_ref',    label:'Referencia',     type:'text',   ph:'Ej: MOT-5100',             opt:true, sec:'📦 Producto adicional 2' },
    { key:'p2_price',  label:'Precio oferta',  type:'number', ph:'32000',                   opt:true, sec:'📦 Producto adicional 2' },
    { key:'p2_orig',   label:'Precio original',type:'number', ph:'45000',                   opt:true, sec:'📦 Producto adicional 2' },
  ],
  product: [
    { key:'prod_name',  label:'Nombre del producto', type:'text',     ph:'Ej: Kit de Cadena XAM 428H' },
    { key:'prod_desc',  label:'Descripción',          type:'textarea', ph:'Describe el producto, características y compatibilidad...' },
    { key:'prod_price', label:'Precio',               type:'number',   ph:'45000' },
    { key:'feat1', label:'Característica 1', type:'text', ph:'Ej: Compatible con motos 125-250cc',    sec:'✅ Características' },
    { key:'feat2', label:'Característica 2', type:'text', ph:'Ej: Acero reforzado',    opt:true, sec:'✅ Características' },
    { key:'feat3', label:'Característica 3', type:'text', ph:'Ej: Incluye eslabón maestro', opt:true, sec:'✅ Características' },
  ],
  flash: [
    { key:'pct',       label:'Descuento máximo (%)',    type:'number', ph:'40' },
    { key:'end_short', label:'Fecha límite (corta)',    type:'text',   ph:'Ej: 30/04' },
    { key:'prod_name', label:'Producto en liquidación', type:'text',   ph:'Ej: Aceite Motul 5000 4T 1L' },
    { key:'price',     label:'Precio de liquidación',   type:'number', ph:'18000' },
    { key:'orig_price',label:'Precio original',         type:'number', ph:'28000', opt:true },
    { key:'end_full',  label:'Fecha límite completa',   type:'text',   ph:'Ej: 30/04/2025' },
  ],
  event: [
    { key:'name',     label:'Nombre del evento', type:'text',     ph:'Ej: Taller de Mantenimiento Preventivo' },
    { key:'desc',     label:'Descripción',        type:'textarea', ph:'Explica de qué trata el evento o taller...' },
    { key:'date',     label:'Fecha',              type:'text',     ph:'Ej: 28 de abril de 2025' },
    { key:'time',     label:'Horario',            type:'text',     ph:'Ej: 9:00 AM – 1:00 PM' },
    { key:'location', label:'Lugar',              type:'text',     ph:'Ej: Cra 15 #32-10, Bogotá' },
  ],
  general: [
    { key:'title', label:'Título',    type:'text',     ph:'Ej: Novedades de Moto Spa' },
    { key:'body',  label:'Contenido', type:'textarea', ph:'Escribe el contenido del boletín...' },
  ],
};

// ── HTML generators ────────────────────────────────────────────────────────────
function cop(v?: string): string {
  const n = parseFloat(v ?? '');
  if (!v || isNaN(n) || n === 0) return '';
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

function genPromo(f: Record<string, string>): string {
  const p1 = f.p1_name ? `<div style="display:flex;align-items:center;padding:12px 0;${f.p2_name ? 'border-bottom:1px solid #f3f4f6;' : ''}gap:16px"><div style="width:60px;height:60px;background:#f3f4f6;border-radius:8px;flex-shrink:0"></div><div style="flex:1"><p style="margin:0 0 2px;font-weight:bold;font-size:14px;color:#111">${f.p1_name}</p>${f.p1_ref ? `<p style="margin:0;font-size:12px;color:#999">${f.p1_ref}</p>` : ''}</div><div style="text-align:right"><p style="margin:0;font-weight:bold;color:#dc2626;font-size:15px">${cop(f.p1_price)}</p>${f.p1_orig ? `<p style="margin:0;font-size:11px;color:#999;text-decoration:line-through">${cop(f.p1_orig)}</p>` : ''}</div></div>` : '';
  const p2 = f.p2_name ? `<div style="display:flex;align-items:center;padding:12px 0;gap:16px"><div style="width:60px;height:60px;background:#f3f4f6;border-radius:8px;flex-shrink:0"></div><div style="flex:1"><p style="margin:0 0 2px;font-weight:bold;font-size:14px;color:#111">${f.p2_name}</p>${f.p2_ref ? `<p style="margin:0;font-size:12px;color:#999">${f.p2_ref}</p>` : ''}</div><div style="text-align:right"><p style="margin:0;font-weight:bold;color:#dc2626;font-size:15px">${cop(f.p2_price)}</p>${f.p2_orig ? `<p style="margin:0;font-size:11px;color:#999;text-decoration:line-through">${cop(f.p2_orig)}</p>` : ''}</div></div>` : '';
  const extras = (p1||p2) ? `<div style="padding:0 24px"><h3 style="font-size:16px;color:#111;margin:0 0 16px;padding-bottom:8px;border-bottom:2px solid #f3f4f6">Más productos en oferta</h3>${p1}${p2}</div>` : '';
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;background:#fff"><div style="background:linear-gradient(135deg,#1a1a1a,#333);padding:32px 24px;text-align:center"><h1 style="color:#fff;margin:0;font-size:26px;letter-spacing:1px">MOTO SPA</h1><p style="color:#f59e0b;margin:8px 0 0;font-size:14px;font-weight:bold;text-transform:uppercase;letter-spacing:2px">🔥 Promociones del mes</p></div><div style="padding:28px 24px 0"><h2 style="font-size:20px;color:#111;margin:0 0 8px">¡Hola! Tenemos ofertas especiales para ti</h2><p style="color:#666;font-size:14px;line-height:1.6;margin:0">Este mes preparamos los mejores descuentos en repuestos, accesorios y equipos para tu moto.</p></div><div style="margin:24px;background:#fff7ed;border:2px solid #f59e0b;border-radius:12px;padding:20px;text-align:center"><p style="margin:0 0 4px;font-size:12px;font-weight:bold;color:#d97706;text-transform:uppercase;letter-spacing:1px">⭐ Oferta destacada</p><h3 style="font-size:22px;color:#111;margin:8px 0">${f.feat_name||'NOMBRE DEL PRODUCTO'}</h3><div style="margin:12px 0"><span style="font-size:28px;font-weight:bold;color:#dc2626">${cop(f.feat_price)||'$XX.XXX'}</span>${f.feat_orig?`&nbsp;<span style="font-size:18px;color:#999;text-decoration:line-through">${cop(f.feat_orig)}</span>`:''}${f.feat_pct?`&nbsp;<span style="background:#dc2626;color:#fff;font-size:13px;font-weight:bold;padding:4px 10px;border-radius:20px">-${f.feat_pct}%</span>`:''}</div>${f.feat_desc?`<p style="color:#666;font-size:13px;margin:0 0 16px">${f.feat_desc}</p>`:''}<a href="https://motospa.com.co/catalogo" style="background:#f59e0b;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block">Ver oferta →</a></div>${extras}<div style="text-align:center;padding:24px"><a href="https://motospa.com.co/catalogo?en_oferta=true" style="background:#111;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block">Ver todas las ofertas →</a></div><div style="background:#f9fafb;padding:20px 24px;text-align:center;border-top:1px solid #e5e7eb"><p style="margin:0;color:#999;font-size:12px">© Moto Spa · <a href="https://motospa.com.co/cuenta/perfil" style="color:#f59e0b">Desuscribirse</a></p></div></div>`;
}

function genProduct(f: Record<string, string>): string {
  const feats = [f.feat1, f.feat2, f.feat3].filter(Boolean);
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;background:#fff"><div style="background:#111;padding:28px 24px;text-align:center"><h1 style="color:#fff;margin:0;font-size:24px">MOTO SPA</h1><p style="color:#6b7280;margin:6px 0 0;font-size:13px">Novedades</p></div><div style="padding:32px 24px;text-align:center"><span style="background:#dcfce7;color:#16a34a;font-size:12px;font-weight:bold;padding:4px 14px;border-radius:20px;text-transform:uppercase;letter-spacing:1px">✨ Nuevo en catálogo</span><h2 style="font-size:24px;color:#111;margin:16px 0 8px">${f.prod_name||'NOMBRE DEL PRODUCTO'}</h2>${f.prod_desc?`<p style="color:#666;font-size:14px;line-height:1.7;max-width:420px;margin:0 auto 20px">${f.prod_desc}</p>`:''}<p style="font-size:28px;font-weight:bold;color:#111;margin:0 0 20px">${cop(f.prod_price)||'$XX.XXX'}</p><a href="https://motospa.com.co/catalogo" style="background:#111;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block">Ver producto →</a></div>${feats.length?`<div style="padding:0 24px 28px"><h3 style="font-size:15px;color:#111;margin:0 0 14px">Características destacadas</h3><ul style="padding:0;margin:0;list-style:none">${feats.map((ft,i)=>`<li style="padding:8px 0;${i<feats.length-1?'border-bottom:1px solid #f3f4f6;':''}font-size:13px;color:#444">✅ ${ft}</li>`).join('')}</ul></div>`:''}<div style="background:#f9fafb;padding:20px 24px;text-align:center;border-top:1px solid #e5e7eb"><p style="margin:0;color:#999;font-size:12px">© Moto Spa · <a href="https://motospa.com.co/cuenta/perfil" style="color:#6b7280">Desuscribirse</a></p></div></div>`;
}

function genFlash(f: Record<string, string>): string {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;background:#fff"><div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:32px 24px;text-align:center"><p style="color:#fca5a5;font-size:12px;font-weight:bold;margin:0 0 6px;text-transform:uppercase;letter-spacing:2px">⚡ Oferta por tiempo limitado</p><h1 style="color:#fff;margin:0;font-size:32px;font-weight:900">LIQUIDACIÓN</h1><p style="color:#fecaca;margin:8px 0 0;font-size:15px">Hasta <strong>${f.pct||'XX'}% de descuento</strong> · Solo hasta el ${f.end_short||'DD/MM'}</p></div><div style="background:#1a1a1a;padding:16px 24px;text-align:center"><p style="color:#f59e0b;font-size:13px;font-weight:bold;margin:0">⏰ La oferta termina pronto — ¡Aprovecha ahora!</p></div><div style="padding:28px 24px"><p style="font-size:14px;color:#666;line-height:1.6;margin:0 0 24px">Hola, tenemos una liquidación especial de inventario con descuentos por tiempo limitado.</p><div style="border:2px dashed #dc2626;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px"><p style="margin:0 0 4px;font-size:11px;font-weight:bold;color:#dc2626;text-transform:uppercase">🔥 Hasta agotar existencias</p><h3 style="font-size:20px;color:#111;margin:8px 0">${f.prod_name||'PRODUCTO EN LIQUIDACIÓN'}</h3><div style="margin:12px 0"><span style="font-size:32px;font-weight:900;color:#dc2626">${cop(f.price)||'$XX.XXX'}</span>${f.orig_price?`&nbsp;<span style="font-size:18px;color:#9ca3af;text-decoration:line-through">${cop(f.orig_price)}</span>`:''}</div><a href="https://motospa.com.co/catalogo?en_oferta=true" style="background:#dc2626;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block;margin-top:8px">Comprar ahora →</a></div><p style="font-size:13px;color:#9ca3af;text-align:center;margin:0">* Precios válidos hasta agotar existencias o hasta el ${f.end_full||'DD/MM/YYYY'}</p></div><div style="background:#f9fafb;padding:20px 24px;text-align:center;border-top:1px solid #e5e7eb"><p style="margin:0;color:#999;font-size:12px"><a href="https://motospa.com.co/cuenta/perfil" style="color:#6b7280">Desuscribirse del boletín</a></p></div></div>`;
}

function genEvent(f: Record<string, string>): string {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;background:#fff"><div style="background:#1e3a5f;padding:32px 24px;text-align:center"><h1 style="color:#fff;margin:0;font-size:24px">MOTO SPA</h1><p style="color:#93c5fd;margin:8px 0 0;font-size:13px">Te invita a</p></div><div style="padding:32px 24px;text-align:center"><span style="background:#eff6ff;color:#1d4ed8;font-size:12px;font-weight:bold;padding:4px 14px;border-radius:20px;text-transform:uppercase;letter-spacing:1px">📅 Evento especial</span><h2 style="font-size:26px;color:#111;margin:16px 0 8px">${f.name||'NOMBRE DEL EVENTO'}</h2>${f.desc?`<p style="color:#666;font-size:14px;line-height:1.7;margin:0 auto 24px;max-width:420px">${f.desc}</p>`:''}<div style="background:#f8fafc;border-radius:12px;padding:20px;text-align:left;margin-bottom:24px">${f.date?`<div style="padding:10px 0;border-bottom:1px solid #e5e7eb"><p style="margin:0;font-size:12px;color:#9ca3af">📅 Fecha</p><p style="margin:4px 0 0;font-weight:bold;color:#111;font-size:14px">${f.date}</p></div>`:''} ${f.time?`<div style="padding:10px 0;${f.location?'border-bottom:1px solid #e5e7eb;':''}"><p style="margin:0;font-size:12px;color:#9ca3af">🕐 Hora</p><p style="margin:4px 0 0;font-weight:bold;color:#111;font-size:14px">${f.time}</p></div>`:''} ${f.location?`<div style="padding:10px 0"><p style="margin:0;font-size:12px;color:#9ca3af">📍 Lugar</p><p style="margin:4px 0 0;font-weight:bold;color:#111;font-size:14px">${f.location}</p></div>`:''}</div><a href="https://motospa.com.co" style="background:#1e3a5f;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block">Más información →</a></div><div style="background:#f9fafb;padding:20px 24px;text-align:center;border-top:1px solid #e5e7eb"><p style="margin:0;color:#999;font-size:12px">© Moto Spa · <a href="https://motospa.com.co/cuenta/perfil" style="color:#6b7280">Desuscribirse</a></p></div></div>`;
}

function genGeneral(f: Record<string, string>): string {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;background:#fff"><div style="background:#111;padding:28px 24px;text-align:center"><h1 style="color:#fff;margin:0;font-size:24px">MOTO SPA</h1></div><div style="padding:32px 24px">${f.title?`<h2 style="font-size:22px;color:#111;margin:0 0 16px">${f.title}</h2>`:''} ${f.body?`<p style="color:#555;font-size:14px;line-height:1.8">${f.body.replace(/\n/g,'<br>')}</p>`:''}<div style="text-align:center;margin-top:28px"><a href="https://motospa.com.co/catalogo" style="background:#111;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block">Ver catálogo →</a></div></div><div style="background:#f9fafb;padding:20px 24px;text-align:center;border-top:1px solid #e5e7eb"><p style="margin:0;color:#999;font-size:12px">© Moto Spa · <a href="https://motospa.com.co/cuenta/perfil" style="color:#6b7280">Desuscribirse</a></p></div></div>`;
}

function buildHtml(mode: TplMode, fields: Record<string, string>, customHtml: string): string {
  if (mode === 'custom')   return customHtml;
  if (mode === 'promo')    return genPromo(fields);
  if (mode === 'product')  return genProduct(fields);
  if (mode === 'flash')    return genFlash(fields);
  if (mode === 'event')    return genEvent(fields);
  return genGeneral(fields);
}

// ── Misc ───────────────────────────────────────────────────────────────────────
const CAT: Record<string, { label: string; color: string }> = {
  general: { label: 'General',   color: 'bg-gray-100 text-gray-600' },
  promo:   { label: 'Promoción', color: 'bg-orange-100 text-orange-700' },
  product: { label: 'Producto',  color: 'bg-blue-100 text-blue-700' },
  event:   { label: 'Evento',    color: 'bg-purple-100 text-purple-700' },
};
const STATUS_COLORS: Record<string, string> = { sent: 'bg-green-100 text-green-700', partial: 'bg-yellow-100 text-yellow-700', failed: 'bg-red-100 text-red-700' };
const STATUS_LABELS: Record<string, string> = { sent: 'Enviado', partial: 'Parcial', failed: 'Fallido' };

// ── Component ──────────────────────────────────────────────────────────────────
export default function NewsletterContent() {
  const [tab, setTab] = useState<'compose' | 'history' | 'templates'>('compose');

  // Compose
  const [tplMode, setTplMode]     = useState<TplMode>('promo');
  const [fields, setFields]       = useState<Record<string, string>>({});
  const [customHtml, setCustomHtml] = useState('');
  const [subject, setSubject]     = useState(MODES[0].defaultSubject);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [sendToAll, setSendToAll] = useState(true);
  const [selected, setSelected]   = useState<number[]>([]);
  const [showSubs, setShowSubs]   = useState(false);
  const [sending, setSending]     = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);
  const [sendError, setSendError] = useState('');

  // History
  const [campaigns, setCampaigns]     = useState<Campaign[]>([]);
  const [loadingCamp, setLoadingCamp] = useState(false);

  // Templates
  const [templates, setTemplates]     = useState<Template[]>([]);
  const [loadingTpls, setLoadingTpls] = useState(false);
  const [previewTpl, setPreviewTpl]   = useState<Template | null>(null);
  const [editingTpl, setEditingTpl]   = useState<Template | null>(null);
  const [newTpl, setNewTpl]           = useState(false);
  const [tplForm, setTplForm]         = useState({ name: '', description: '', category: 'general', html_body: '' });
  const [savingTpl, setSavingTpl]     = useState(false);

  useEffect(() => {
    api<any>('/newsletter/subscribers').then(r => setSubscribers(r.data ?? [])).finally(() => setLoadingSubs(false));
  }, []);

  useEffect(() => {
    if (tab === 'history' && campaigns.length === 0) {
      setLoadingCamp(true);
      api<any>('/newsletter/campaigns').then(r => setCampaigns(r.data ?? [])).finally(() => setLoadingCamp(false));
    }
    if (tab === 'templates' && templates.length === 0) {
      setLoadingTpls(true);
      api<any>('/newsletter/templates').then(r => setTemplates(r.data ?? [])).finally(() => setLoadingTpls(false));
    }
  }, [tab]);

  const generatedHtml = useMemo(() => buildHtml(tplMode, fields, customHtml), [tplMode, fields, customHtml]);

  const switchMode = (m: TplMode) => {
    setTplMode(m);
    setFields({});
    const cfg = MODES.find(x => x.id === m);
    if (cfg?.defaultSubject) setSubject(cfg.defaultSubject);
  };

  const setField = (k: string, v: string) => setFields(p => ({ ...p, [k]: v }));

  const recipientCount = sendToAll ? subscribers.length : selected.length;
  const toggleSelect = (id: number) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAll = () => setSelected(selected.length === subscribers.length ? [] : subscribers.map(s => s.id));

  const applyTemplate = (tpl: Template) => {
    setTplMode('custom');
    setCustomHtml(tpl.html_body);
    setTab('compose');
  };

  const handleSend = async () => {
    if (!subject.trim()) { setSendError('El asunto es obligatorio.'); return; }
    if (!generatedHtml.trim()) { setSendError('El contenido está vacío.'); return; }
    if (!sendToAll && selected.length === 0) { setSendError('Selecciona al menos un destinatario.'); return; }
    setSending(true); setSendError(''); setSendResult(null);
    try {
      const res = await api<any>('/newsletter/send', {
        method: 'POST',
        body: JSON.stringify({ subject, body: generatedHtml, recipient_ids: sendToAll ? null : selected }),
      });
      setSendResult({ sent: res.sent, failed: res.failed });
      setFields({}); setSubject(''); setSelected([]);
      api<any>('/newsletter/campaigns').then(r => setCampaigns(r.data ?? []));
    } catch (e) {
      setSendError(e instanceof Error ? e.message : 'Error al enviar.');
    } finally { setSending(false); }
  };

  // Template CRUD
  const openNewTpl = () => { setTplForm({ name: '', description: '', category: 'general', html_body: '' }); setNewTpl(true); setEditingTpl(null); };
  const openEditTpl = (t: Template) => { setTplForm({ name: t.name, description: t.description ?? '', category: t.category, html_body: t.html_body }); setEditingTpl(t); setNewTpl(false); };
  const saveTpl = async () => {
    if (!tplForm.name || !tplForm.html_body) return;
    setSavingTpl(true);
    try {
      if (editingTpl) {
        const res = await api<any>(`/newsletter/templates/${editingTpl.id}`, { method: 'PUT', body: JSON.stringify(tplForm) });
        setTemplates(p => p.map(t => t.id === editingTpl.id ? res.data : t));
      } else {
        const res = await api<any>('/newsletter/templates', { method: 'POST', body: JSON.stringify(tplForm) });
        setTemplates(p => [...p, res.data]);
      }
      setNewTpl(false); setEditingTpl(null);
    } catch (e) { alert(e instanceof Error ? e.message : 'Error'); }
    finally { setSavingTpl(false); }
  };
  const deleteTpl = async (id: number) => {
    if (!confirm('¿Eliminar esta plantilla?')) return;
    await api(`/newsletter/templates/${id}`, { method: 'DELETE' });
    setTemplates(p => p.filter(t => t.id !== id));
  };
  const deleteCampaign = async (id: number) => {
    if (!confirm('¿Eliminar este registro?')) return;
    await api(`/newsletter/campaigns/${id}`, { method: 'DELETE' });
    setCampaigns(p => p.filter(c => c.id !== id));
  };

  // Render form fields grouped by section
  const renderFields = () => {
    if (tplMode === 'custom') {
      return (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">HTML personalizado</label>
          <textarea value={customHtml} onChange={e => setCustomHtml(e.target.value)} rows={14}
            placeholder="Pega tu HTML aquí o usa una plantilla de la pestaña Plantillas..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-primary outline-none resize-y" />
        </div>
      );
    }
    const defs = FIELDS[tplMode] ?? [];
    const sections: Record<string, FDef[]> = {};
    for (const d of defs) {
      const s = d.sec ?? '_';
      if (!sections[s]) sections[s] = [];
      sections[s].push(d);
    }
    return (
      <div className="space-y-5">
        {Object.entries(sections).map(([sec, sfields]) => (
          <div key={sec}>
            {sec !== '_' && (
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 pb-1.5 border-b border-gray-100">{sec}</p>
            )}
            <div className="space-y-3">
              {sfields.map(fd => (
                <div key={fd.key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {fd.label}
                    {fd.opt ? <span className="text-gray-400 font-normal ml-1">(opcional)</span> : <span className="text-red-400 ml-0.5">*</span>}
                  </label>
                  {fd.type === 'textarea' ? (
                    <textarea value={fields[fd.key] ?? ''} onChange={e => setField(fd.key, e.target.value)}
                      rows={3} placeholder={fd.ph}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none resize-none" />
                  ) : (
                    <input type={fd.type === 'number' ? 'number' : 'text'} value={fields[fd.key] ?? ''}
                      onChange={e => setField(fd.key, e.target.value)} placeholder={fd.ph}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const TABS = [
    { id: 'compose',   label: 'Redactar',   icon: Mail },
    { id: 'history',   label: 'Historial',  icon: History },
    { id: 'templates', label: 'Plantillas', icon: LayoutTemplate },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── REDACTAR ── */}
      {tab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* LEFT: form */}
          <div className="lg:col-span-3 space-y-4">

            {/* Tipo de plantilla */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Tipo de boletín</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {MODES.map(m => {
                  const Icon = m.icon;
                  const isActive = tplMode === m.id;
                  return (
                    <button key={m.id} onClick={() => switchMode(m.id)}
                      className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border-2 transition-all text-center ${isActive ? m.active : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                      <Icon className={`w-5 h-5 ${isActive ? m.ring : 'text-gray-400'}`} />
                      <span className={`text-xs font-semibold leading-tight ${isActive ? '' : 'text-gray-500'}`}>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Asunto */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Asunto del correo *</label>
              <input value={subject} onChange={e => setSubject(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                placeholder="Ej: 🔥 Promociones de abril – Moto Spa" />
            </div>

            {/* Campos del formulario */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Contenido</p>
                {tplMode !== 'custom' && (
                  <button onClick={() => switchMode('custom')} className="text-xs text-gray-400 hover:text-gray-600">
                    Usar HTML personalizado →
                  </button>
                )}
              </div>
              <div className="p-4">{renderFields()}</div>
            </div>

            {/* Destinatarios + Enviar */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
              {sendError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {sendError}
                </div>
              )}
              {sendResult && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span><strong>¡Enviado!</strong> {sendResult.sent} correo{sendResult.sent !== 1 ? 's' : ''} enviado{sendResult.sent !== 1 ? 's' : ''}{sendResult.failed > 0 ? `, ${sendResult.failed} fallido${sendResult.failed !== 1 ? 's' : ''}` : ''}.</span>
                </div>
              )}

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Destinatarios</p>
                <div className="flex gap-6 bg-gray-50 rounded-lg p-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={sendToAll} onChange={() => setSendToAll(true)} className="accent-primary" />
                    <span className="text-sm text-gray-700">Todos <span className="font-semibold">({subscribers.length})</span></span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={!sendToAll} onChange={() => setSendToAll(false)} className="accent-primary" />
                    <span className="text-sm text-gray-700">Seleccionados <span className="font-semibold">({selected.length})</span></span>
                  </label>
                </div>
              </div>

              {/* Send button */}
              <button onClick={handleSend} disabled={sending || recipientCount === 0}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
                {sending
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Enviando...</>
                  : <><Send className="w-4 h-4" /> Enviar a {recipientCount} suscriptor{recipientCount !== 1 ? 'es' : ''}</>
                }
              </button>
            </div>
          </div>

          {/* RIGHT: Preview + Suscriptores */}
          <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-6">
            {/* Preview */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-semibold text-gray-700">Vista previa en tiempo real</p>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 520 }}>
                <div className="p-4">
                  <div className="max-w-full overflow-hidden text-[13px]" dangerouslySetInnerHTML={{ __html: generatedHtml || '<p style="color:#9ca3af;text-align:center;padding:40px 20px;font-family:sans-serif">Completa los campos para ver la vista previa</p>' }} />
                </div>
              </div>
            </div>

            {/* Suscriptores */}
            {!sendToAll && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button onClick={() => setShowSubs(p => !p)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700">Seleccionar suscriptores</span>
                    <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">{selected.length}/{subscribers.length}</span>
                  </div>
                  {showSubs ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {showSubs && (
                  <div className="max-h-64 overflow-y-auto border-t border-gray-100">
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2 sticky top-0">
                      <input type="checkbox" checked={selected.length === subscribers.length} onChange={toggleAll} className="w-4 h-4 accent-primary" />
                      <span className="text-xs text-gray-600 font-medium">Seleccionar todos</span>
                    </div>
                    {subscribers.map(s => (
                      <div key={s.id} onClick={() => toggleSelect(s.id)}
                        className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${selected.includes(s.id) ? 'bg-primary/5' : ''}`}>
                        <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggleSelect(s.id)} onClick={e => e.stopPropagation()} className="w-4 h-4 accent-primary flex-shrink-0" />
                        <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">{(s.first_name || s.name || s.email).charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{s.first_name ? `${s.first_name} ${s.last_name || ''}`.trim() : s.name}</p>
                          <p className="text-xs text-gray-400 truncate">{s.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── HISTORIAL ── */}
      {tab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <History className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-800">Campañas enviadas</h2>
            <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">{campaigns.length}</span>
          </div>
          {loadingCamp ? (
            <div className="py-16 text-center"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary mx-auto" /></div>
          ) : campaigns.length === 0 ? (
            <div className="py-16 text-center">
              <History className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Sin campañas enviadas aún</p>
              <button onClick={() => setTab('compose')} className="mt-3 text-sm text-primary hover:underline">Crear primer boletín</button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {campaigns.map(c => {
                const date = new Date(c.sent_at).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={c.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm truncate">{c.subject}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{date}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right text-xs text-gray-500">
                        <p><span className="font-semibold text-green-600">{c.sent_count}</span> enviados</p>
                        {c.failed_count > 0 && <p><span className="font-semibold text-red-500">{c.failed_count}</span> fallidos</p>}
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                      <button onClick={() => deleteCampaign(c.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── PLANTILLAS ── */}
      {tab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{templates.length} plantillas HTML disponibles</p>
            <button onClick={openNewTpl} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90">
              <Plus className="w-4 h-4" /> Nueva plantilla
            </button>
          </div>
          {loadingTpls ? (
            <div className="py-16 text-center"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary mx-auto" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(tpl => {
                const cat = CAT[tpl.category] ?? CAT.general;
                return (
                  <div key={tpl.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors">
                    <div className="h-36 bg-gray-50 overflow-hidden relative pointer-events-none select-none">
                      <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%' }}>
                        <div dangerouslySetInnerHTML={{ __html: tpl.html_body }} />
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-gray-900 text-sm">{tpl.name}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${cat.color}`}>{cat.label}</span>
                          {tpl.is_default && <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded">Base</span>}
                        </div>
                      </div>
                      {tpl.description && <p className="text-xs text-gray-400 mb-3">{tpl.description}</p>}
                      <div className="flex items-center gap-2 mt-3">
                        <button onClick={() => applyTemplate(tpl)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90">
                          <Send className="w-3.5 h-3.5" /> Usar en boletín
                        </button>
                        <button onClick={() => setPreviewTpl(tpl)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg" title="Vista previa"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openEditTpl(tpl)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg" title="Editar"><Edit2 className="w-4 h-4" /></button>
                        {!tpl.is_default && (
                          <button onClick={() => deleteTpl(tpl.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal crear/editar plantilla */}
          {(newTpl || editingTpl) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">{editingTpl ? 'Editar plantilla' : 'Nueva plantilla HTML'}</h3>
                  <button onClick={() => { setNewTpl(false); setEditingTpl(null); }} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
                      <input value={tplForm.name} onChange={e => setTplForm(p => ({ ...p, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
                      <select value={tplForm.category} onChange={e => setTplForm(p => ({ ...p, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none">
                        {Object.entries(CAT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                    <input value={tplForm.description} onChange={e => setTplForm(p => ({ ...p, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">HTML *</label>
                    <textarea value={tplForm.html_body} onChange={e => setTplForm(p => ({ ...p, html_body: e.target.value }))}
                      rows={14} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none resize-y font-mono" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 px-6 pb-6">
                  <button onClick={() => { setNewTpl(false); setEditingTpl(null); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
                  <button onClick={saveTpl} disabled={savingTpl || !tplForm.name || !tplForm.html_body}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 disabled:opacity-60">
                    <Save className="w-4 h-4" /> {savingTpl ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal vista previa */}
          {previewTpl && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
              <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">Vista previa: {previewTpl.name}</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { applyTemplate(previewTpl); setPreviewTpl(null); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90">
                      <Send className="w-3.5 h-3.5" /> Usar esta plantilla
                    </button>
                    <button onClick={() => setPreviewTpl(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                  </div>
                </div>
                <div className="overflow-y-auto flex-1 p-4">
                  <div dangerouslySetInnerHTML={{ __html: previewTpl.html_body }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
