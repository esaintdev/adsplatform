'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';

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

  const trackClickUrl = `${baseUrl}/api/track/click?bannerId=${banner.id}`;
  const trackImprUrl = `${baseUrl}/api/track/impression?bannerId=${banner.id}`;

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
  <img src="${banner.image_url}" width="${banner.size?.split('x')[0] || 'auto'}" height="${banner.size?.split('x')[1] || 'auto'}" alt="Ad" style="display:block;border:0;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.15);" />
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">🖼️ Banner Embed Code</h2>
        
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 8, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <input type="checkbox" id="floating-toggle" checked={isFloating} onChange={e => setIsFloating(e.target.checked)} />
            <label htmlFor="floating-toggle" style={{ fontWeight: 600, cursor: 'pointer' }}>Make it a Floating Banner</label>
          </div>

          {isFloating && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 12 }}>Position on screen</label>
              <select className="form-select" value={position} onChange={e => setPosition(e.target.value)} style={{ padding: '4px 8px', fontSize: 13 }}>
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
              </select>
            </div>
          )}
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
          Copy this HTML snippet and paste it inside the <code style={{ color: 'var(--accent)' }}>&lt;body&gt;</code>:
        </p>
        <pre className="code-block" style={{ maxHeight: 150, overflow: 'auto' }}>{html}</pre>
        
        <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={() => { navigator.clipboard.writeText(html); }}>Copy Code</button>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
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
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/banners').then(r => r.json()),
      fetch('/api/campaigns').then(r => r.json()),
    ]).then(([b, c]) => { setBanners(b); setCampaigns(c); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let finalImageUrl = form.imageUrl;

    // If a file is selected, upload it to Supabase Storage first
    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('banners')
        .upload(filePath, file);

      if (error) {
        alert('Error uploading image: ' + error.message);
        setSaving(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(filePath);
      
      finalImageUrl = publicUrl;
    }

    if (!finalImageUrl) {
        alert('Please provide an image URL or upload a file.');
        setSaving(false);
        return;
    }

    await fetch('/api/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, imageUrl: finalImageUrl }),
    });

    setSaving(false);
    setShowCreate(false);
    setFile(null);
    setForm({ name: '', imageUrl: '', targetUrl: '', size: '300x250', campaignId: '' });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    await fetch(`/api/banners/${id}`, { method: 'DELETE' });
    load();
  };

  const sizes = ['300x250', '250x250', '300x300', '728x90', '160x600', '320x50', '468x60', '970x90', '125x125'];

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Banners</h1>
            <p className="page-subtitle">Create banners and generate embed codes for external websites</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Banner</button>
        </div>
        <div className="page-body">
          {loading ? (
            <div className="loading-wrap"><div className="loading-spinner" /></div>
          ) : banners.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🖼️</div>
              <p style={{ fontWeight: 600, marginBottom: 6 }}>No banners yet</p>
              <p style={{ fontSize: 13, marginBottom: 20 }}>Add your first banner to generate a tracking embed code</p>
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Banner</button>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Banner</th><th>Campaign</th><th>Size</th><th>Total Impr</th><th>Unique Impr</th><th>Clicks</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {banners.map(b => {
                    const imp = Number(b.impressions);
                    const clk = Number(b.clicks);
                    const ctr = imp > 0 ? ((clk / imp) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={b.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{b.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{new URL(b.target_url).hostname}</div>
                        </td>
                        <td><span className="chip">{b.campaign_name}</span></td>
                        <td>{b.size || '—'}</td>
                        <td>{imp.toLocaleString()}</td>
                        <td>{Number((b as any).unique_impressions || 0).toLocaleString()}</td>
                        <td>{clk.toLocaleString()} <span className="badge badge-blue" style={{ marginLeft: 4 }}>{ctr}%</span></td>
                        <td>
                          {b.is_active ? (
                            imp > 0 ? (
                              <span className="badge badge-green">Active</span>
                            ) : (
                              <span className="badge badge-blue">Pending</span>
                            )
                          ) : (
                            <span className="badge badge-red">Paused</span>
                          )}
                        </td>
                        <td style={{ display: 'flex', gap: 6 }}>
                          <button 
                            className={`btn btn-sm ${b.is_active ? 'btn-ghost' : 'btn-primary'}`} 
                            style={{ minWidth: 80 }}
                            onClick={async () => {
                              await fetch(`/api/banners/${b.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ ...b, isActive: !b.is_active })
                              });
                              load();
                            }}
                          >
                            {b.is_active ? '⏸ Pause' : '▶️ Resume'}
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEmbedBanner(b)}>{'</>'}  Code</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.id)}>Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">New Banner</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Banner Name *</label>
                <input className="form-input" placeholder="e.g. Homepage Leaderboard" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Campaign *</label>
                <select className="form-select" value={form.campaignId} onChange={e => setForm(f => ({ ...f, campaignId: e.target.value }))} required>
                  <option value="">Select a campaign…</option>
                  {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ border: '1px dashed rgba(255,255,255,0.1)', padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  Banner Image
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Upload file or use URL</span>
                </label>
                
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/gif" 
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  style={{ fontSize: 13, marginBottom: 12, display: 'block' }} 
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0' }}>
                    <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.05)' }}></div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>OR USE URL</span>
                    <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.05)' }}></div>
                </div>

                <input 
                  className="form-input" 
                  placeholder="https://example.com/ad.gif" 
                  value={form.imageUrl} 
                  onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} 
                  disabled={!!file}
                />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Supports .jpg, .png, and animated .gif</p>
              </div>
              <div className="form-group">
                <label className="form-label">Click Destination URL *</label>
                <input className="form-input" placeholder="https://yoursite.com/landing" value={form.targetUrl} onChange={e => setForm(f => ({ ...f, targetUrl: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Size</label>
                <select className="form-select" value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))}>
                  {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Create Banner'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {embedBanner && <EmbedModal banner={embedBanner} baseUrl={baseUrl} onClose={() => setEmbedBanner(null)} />}
    </div>
  );
}
