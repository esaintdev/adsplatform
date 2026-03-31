'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "../../lib/utils";
import { ExternalLink, Trash2, Pause, Play, Code2, Plus, Loader2, Pencil } from "lucide-react";
import CustomAlert from '@/components/ui/custom-alert';
import ConfirmationBox from '@/components/ui/confirmation-box';

interface Banner {
  id: string;
  name: string;
  image_url: string;
  target_url: string;
  size: string;
  is_active: boolean;
  campaign_id: string;
  campaign_name: string;
  impressions: number;
  clicks: number;
  created_at: string;
}
interface Campaign { id: string; name: string; }

function EmbedModal({ banner, baseUrl, onClose }: { banner: Banner; baseUrl: string; onClose: () => void }) {
  const [isFloating, setIsFloating] = useState(false);
  const [position, setPosition] = useState('bottom-right');
  const trackerBaseUrl = process.env.NEXT_PUBLIC_TRACKER_URL || baseUrl;
  const trackClickUrl = `${trackerBaseUrl}/click?bannerId=${banner.id}`;
  const trackImprUrl = `${trackerBaseUrl}/impression?bannerId=${banner.id}`;

  const getPositionStyles = () => {
    switch (position) {
      case 'bottom-right': return 'bottom:20px;right:20px;';
      case 'bottom-left': return 'bottom:20px;left:20px;';
      case 'top-right': return 'top:20px;right:20px;';
      case 'top-left': return 'top:20px;left:20px;';
      default: return 'bottom:20px;right:20px;';
    }
  };

  const bannerHtml = `
<a href="${trackClickUrl}" target="_blank" rel="noopener">
  <img src="${baseUrl}/api/banners/${banner.id}/image" width="${banner.size?.split('x')[0] || 'auto'}" height="${banner.size?.split('x')[1] || 'auto'}" alt="Ad" style="display:block;border:0;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.15);" />
  <img src="${trackImprUrl}" width="1" height="1" style="display:none" alt="" />
</a>`.trim();

  const html = isFloating
    ? `<!-- AdTrack Floating Banner: ${banner.name} -->
<div id="adtrack-banner-${banner.id}" style="position:fixed;${getPositionStyles()}z-index:9999;line-height:0;margin:0;padding:0;">
  <button onclick="document.getElementById('adtrack-banner-${banner.id}').style.display='none'" style="position:absolute;top:-10px;right:-10px;width:24px;height:24px;border-radius:50%;border:none;background:#fff;color:#000;box-shadow:0 2px 4px rgba(0,0,0,0.2);cursor:pointer;font-weight:bold;font-size:14px;display:flex;align-items:center;justify-content:center;z-index:1;margin:0;padding:0;">×</button>
  ${bannerHtml}
</div>`
    : `<!-- AdTrack Inline Banner: ${banner.name} -->
${bannerHtml}`;

  return (
    <div className="modal-backdrop bg-slate-950/80 backdrop-blur-sm fixed inset-0 flex items-center justify-center z-50 p-6" onClick={onClose}>
      <Card className="w-full max-w-2xl bg-slate-900 border-slate-800 shadow-2xl p-0 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-8 border-b border-white/5">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Code2 className="w-5 h-5 text-blue-400" />
            Banner Embed Code
          </h2>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="floating-toggle"
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-500"
                checked={isFloating}
                onChange={e => setIsFloating(e.target.checked)}
              />
              <label htmlFor="floating-toggle" className="text-sm font-bold text-slate-200 cursor-pointer uppercase tracking-widest">Floating Interaction Mode</label>
            </div>

            {isFloating && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Screen Position</label>
                <select className="w-full h-10 bg-slate-800 border-slate-700 rounded-xl text-sm px-4 outline-none focus:border-blue-500 transition-colors" value={position} onChange={e => setPosition(e.target.value)}>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </select>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm text-slate-400 font-medium">
              Copy this HTML snippet and paste it within the <code className="text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">&lt;body&gt;</code> of your website:
            </p>
            <pre className="p-6 bg-black/40 border border-white/5 rounded-2xl text-[12px] font-mono text-blue-300 overflow-x-auto leading-relaxed shadow-inner">
              {html}
            </pre>
          </div>
        </div>

        <div className="p-8 bg-slate-900/50 border-t border-white/5 flex items-center justify-end gap-3">
          <button className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-lg shadow-blue-600/20" onClick={() => { navigator.clipboard.writeText(html); }}>Copy Snippet</button>
          <button className="h-10 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold border border-white/10 transition-all font-mono" onClick={onClose}>Dismiss</button>
        </div>
      </Card>
    </div>
  );
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [embedBanner, setEmbedBanner] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ name: '', imageUrl: '', targetUrl: '', size: '300x250', campaignId: '' });
  const [alert, setAlert] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const trackerBaseUrl = process.env.NEXT_PUBLIC_TRACKER_URL || baseUrl;

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/banners').then(r => r.json()),
      fetch('/api/campaigns').then(r => r.json()),
    ]).then(([b, c]) => {
      setBanners(Array.isArray(b) ? b : []);
      setCampaigns(Array.isArray(c) ? c : []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let finalImageUrl = form.imageUrl;

    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Convert file to base64 for the VPS upload
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });

      const uploadRes = await fetch(`${trackerBaseUrl}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: filePath, fileData: base64 }),
      });

      if (!uploadRes.ok) {
        setAlert({ message: 'Error uploading image to VPS.', type: 'error' });
        setSaving(false);
        return;
      }

      const { url } = await uploadRes.json();
      finalImageUrl = url;
    }

    if (!finalImageUrl) {
      setAlert({ message: 'Please provide an image URL or upload a file.', type: 'error' });
      setSaving(false);
      return;
    }

    const res = await fetch(editingBanner ? `/api/banners/${editingBanner.id}` : '/api/banners', {
      method: editingBanner ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, imageUrl: finalImageUrl }),
    });

    if (res.ok) {
      setAlert({ message: editingBanner ? 'Creative asset updated' : 'Banner deployed successfully', type: 'success' });
      setShowCreate(false);
      setEditingBanner(null);
      setFile(null);
      setForm({ name: '', imageUrl: '', targetUrl: '', size: '300x250', campaignId: '' });
      load();
    } else {
      setAlert({ message: 'Failed to save banner', type: 'error' });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      await fetch(`/api/banners/${id}`, { method: 'DELETE' });
      setAlert({ message: 'Creative asset removed', type: 'success' });
      load();
    } catch (err) {
      setAlert({ message: 'Failed to delete asset', type: 'error' });
    } finally {
      setSaving(false);
      setConfirmDelete(null);
    }
  };

  const sizes = ['300x250', '250x250', '300x300', '728x90', '160x600', '320x50', '468x60', '970x90', '125x125'];

  return (
    <div className="bg-background text-foreground flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-h-screen bg-background overflow-y-auto relative">
        {alert && (
          <CustomAlert
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert(null)}
          />
        )}

        {confirmDelete && (
          <ConfirmationBox
            title="Delete Asset"
            description="Are you sure you want to permanently delete this creative asset? This action cannot be undone."
            onConfirm={() => handleDelete(confirmDelete)}
            onCancel={() => setConfirmDelete(null)}
            confirmText="Delete"
            loading={saving}
          />
        )}

        <div className="px-10 py-8 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Banners</h1>
            <p className="text-sm text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Registry • Creative Asset Management</p>
          </div>
          <button className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />
            New Banner
          </button>
        </div>

        <div className="px-10 py-10">
          {loading ? (
            <div className="flex h-[60vh] items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : banners.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-3xl mb-6 shadow-xl border border-white/5">
                <ExternalLink className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-lg font-bold text-slate-200">No creative assets yet</p>
              <p className="text-sm text-slate-500 mt-2 max-w-xs leading-relaxed">Add your first banner to generate professional tracking embed codes for your clients.</p>
              <button className="mt-8 h-11 px-8 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold border border-white/10 transition-all uppercase tracking-widest text-[10px]" onClick={() => setShowCreate(true)}>
                Create First Banner
              </button>
            </div>
          ) : (
            <Card className="border-slate-800/60 bg-slate-900/40 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-white/[0.01]">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-[10px] uppercase font-extrabold text-slate-500 py-5 px-6 tracking-widest">Creative Detail</TableHead>
                      <TableHead className="text-[10px] uppercase font-extrabold text-slate-500 px-6 tracking-widest">Campaign</TableHead>
                      <TableHead className="text-[10px] uppercase font-extrabold text-slate-500 px-6 tracking-widest">Dimension</TableHead>
                      <TableHead className="text-[10px] uppercase font-extrabold text-slate-500 text-right px-6 tracking-widest">Total Impr</TableHead>
                      <TableHead className="text-[10px] uppercase font-extrabold text-slate-500 text-right px-6 tracking-widest">Unique Impr</TableHead>
                      <TableHead className="text-[10px] uppercase font-extrabold text-slate-500 px-6 tracking-widest">Insights</TableHead>
                      <TableHead className="text-[10px] uppercase font-extrabold text-slate-500 px-6 tracking-widest">Status</TableHead>
                      <TableHead className="text-[10px] uppercase font-extrabold text-slate-500 text-right px-6 tracking-widest">Manage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {banners.map(b => {
                      const imp = Number(b.impressions);
                      const clk = Number(b.clicks);
                      const ctr = imp > 0 ? ((clk / imp) * 100).toFixed(1) : '0.0';
                      return (
                        <TableRow key={b.id} className="border-white/5 hover:bg-white/[0.01] transition-colors group">
                          <TableCell className="px-6 py-6 border-b border-white/5">
                            <div className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors uppercase tracking-tight text-sm">{b.name}</div>
                            <div className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest opacity-60">{new URL(b.target_url).hostname}</div>
                          </TableCell>
                          <TableCell className="px-6 border-b border-white/5">
                            <Badge variant="outline" className="border-slate-800 bg-slate-900 text-slate-400 text-[9px] tracking-widest uppercase py-0.5 px-2">
                              {b.campaign_name}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 border-b border-white/5 text-slate-400 font-mono text-[10px]">{b.size || '—'}</TableCell>
                          <TableCell className="px-6 border-b border-white/5 text-right tabular-nums font-bold text-slate-200">{imp.toLocaleString()}</TableCell>
                          <TableCell className="px-6 border-b border-white/5 text-right tabular-nums font-bold text-slate-200">{Number((b as any).unique_impressions || 0).toLocaleString()}</TableCell>
                          <TableCell className="px-6 border-b border-white/5">
                            <div className="flex flex-col gap-1.5">
                              <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em]">{clk.toLocaleString()} CLICKS</div>
                              <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-500" style={{ width: `${Math.min(Number(ctr) * 10, 100)}%` }} />
                              </div>
                              <span className="text-[10px] font-bold text-blue-400">{ctr}% CTR</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 border-b border-white/5">
                            {b.is_active ? (
                              imp > 0 ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Live</span>
                                </div>
                              )
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Paused</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="px-6 border-b border-white/5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                className={cn(
                                  "h-8 px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                                  b.is_active ? "bg-white/5 hover:bg-white/10 text-slate-300" : "bg-blue-600 hover:bg-blue-500 text-white"
                                )}
                                onClick={async () => {
                                  await fetch(`/api/banners/${b.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ ...b, isActive: !b.is_active })
                                  });
                                  load();
                                }}
                              >
                                {b.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                              </button>
                              <button className="h-8 w-8 rounded-lg bg-white/5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-all flex items-center justify-center" onClick={() => {
                                setEditingBanner(b);
                                setForm({
                                  name: b.name,
                                  imageUrl: b.image_url,
                                  targetUrl: b.target_url,
                                  size: b.size,
                                  campaignId: b.campaign_id
                                });
                                setShowCreate(true);
                              }}>
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button className="h-8 w-8 rounded-lg bg-white/5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-all flex items-center justify-center" onClick={() => setEmbedBanner(b)}>
                                <Code2 className="w-3.5 h-3.5" />
                              </button>
                              <button className="h-8 w-8 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all flex items-center justify-center" onClick={() => setConfirmDelete(b.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </div>

        {showCreate && (
          <div className="modal-backdrop bg-slate-950/90 backdrop-blur-md fixed inset-0 flex items-center justify-center z-50 p-6" onClick={() => setShowCreate(false)}>
            <Card className="modal w-full max-w-2xl bg-slate-900 border-slate-800 shadow-2xl p-0 overflow-hidden rounded-3xl" onClick={e => e.stopPropagation()}>
              <div className="p-8 border-b border-white/5 bg-white/[0.01]">
                <h2 className="text-xl font-bold text-white flex items-center gap-3 italic tracking-tight">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center not-italic">
                    {editingBanner ? <Pencil className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
                  </div>
                  {editingBanner ? 'Edit Creative Asset' : 'New Creative Asset'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Asset Identity</label>
                    <input className="w-full h-12 bg-slate-800 border-slate-700/50 rounded-2xl px-5 text-sm outline-none focus:border-blue-500 transition-all shadow-inner placeholder:text-slate-600" placeholder="e.g. Q1 Global Promo" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Parent Campaign</label>
                    <select className="w-full h-12 bg-slate-800 border-slate-700/50 rounded-2xl px-5 text-sm outline-none focus:border-blue-500 transition-all cursor-pointer appearance-none shadow-inner" value={form.campaignId} onChange={e => setForm(f => ({ ...f, campaignId: e.target.value }))} required>
                      <option value="">Select Target...</option>
                      {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="p-6 bg-black/20 rounded-3xl border border-white/5 space-y-5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex justify-between px-1">
                    Visual Blueprint
                    <span className="text-blue-500/60 lowercase font-bold">upload or stream</span>
                  </label>

                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      id="banner-file-input"
                      accept="image/*"
                      onChange={e => {
                        const newFile = e.target.files?.[0] || null;
                        setFile(newFile);
                        if (newFile) setForm(f => ({ ...f, imageUrl: '' }));
                      }}
                      className="block w-full text-[10px] text-slate-400 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-blue-600 file:text-white hover:file:bg-blue-500 file:transition-all cursor-pointer file:tracking-widest"
                    />
                    {file && (
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          const input = document.getElementById('banner-file-input') as HTMLInputElement;
                          if (input) input.value = '';
                        }}
                        className="h-9 px-4 rounded-xl bg-rose-500/20 text-rose-500 text-[9px] font-black uppercase tracking-widest hover:bg-rose-500/30 transition-all border border-rose-500/20"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-4 opacity-20">
                    <div className="h-px flex-1 bg-white" />
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">OR</span>
                    <div className="h-px flex-1 bg-white" />
                  </div>

                  <input
                    className="w-full h-11 bg-slate-800/40 border-slate-700/30 rounded-xl px-5 text-[11px] font-mono outline-none focus:border-blue-500/50 transition-all shadow-inner placeholder:text-slate-700 disabled:opacity-30"
                    placeholder="Direct URL (static/animated)..."
                    value={form.imageUrl}
                    onChange={e => {
                      setForm(f => ({ ...f, imageUrl: e.target.value }));
                      if (e.target.value && file) {
                        setFile(null);
                        const input = document.getElementById('banner-file-input') as HTMLInputElement;
                        if (input) input.value = '';
                      }
                    }}
                    disabled={!!file}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Landing Protocol</label>
                    <input className="w-full h-12 bg-slate-800 border-slate-700/50 rounded-2xl px-5 text-sm outline-none focus:border-blue-500 transition-all font-mono text-blue-400/80 shadow-inner" placeholder="https://external-site.com" value={form.targetUrl} onChange={e => setForm(f => ({ ...f, targetUrl: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Geometric Size</label>
                    <select className="w-full h-12 bg-slate-800 border-slate-700/50 rounded-2xl px-5 text-sm outline-none focus:border-blue-500 transition-all cursor-pointer appearance-none shadow-inner" value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))}>
                      {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="pt-6 flex items-center gap-4 border-t border-white/5">
                  <button type="submit" className="flex-1 h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50" disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (editingBanner ? 'Update Asset' : 'Deploy Asset')}
                  </button>
                  <button type="button" className="h-12 px-8 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-black uppercase tracking-[0.2em] border border-white/10 transition-all" onClick={() => {
                    setShowCreate(false);
                    setEditingBanner(null);
                    setForm({ name: '', imageUrl: '', targetUrl: '', size: '300x250', campaignId: '' });
                  }}>Abort</button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {embedBanner && <EmbedModal banner={embedBanner} baseUrl={baseUrl} onClose={() => setEmbedBanner(null)} />}
      </main>
    </div>
  );
}
