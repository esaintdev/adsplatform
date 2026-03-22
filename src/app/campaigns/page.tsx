'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';

interface Campaign {
  id: string;
  name: string;
  description: string;
  banner_count: number;
  event_count: number;
  created_at: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/campaigns').then(r => r.json()).then(d => { setCampaigns(d); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowModal(false);
    setForm({ name: '', description: '' });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign? This will also remove all related banners and events.')) return;
    await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Campaigns</h1>
            <p className="page-subtitle">Organise your banners into campaigns</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Campaign</button>
        </div>
        <div className="page-body">
          {loading ? (
            <div className="loading-wrap"><div className="loading-spinner" /></div>
          ) : campaigns.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <p style={{ fontWeight: 600, marginBottom: 6 }}>No campaigns yet</p>
              <p style={{ fontSize: 13, marginBottom: 20 }}>Create your first campaign to start tracking</p>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Campaign</button>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Name</th><th>Description</th><th>Banners</th><th>Events</th><th>Created</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {campaigns.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{c.description || '—'}</td>
                      <td><span className="badge badge-blue">{c.banner_count}</span></td>
                      <td><span className="badge badge-green">{c.event_count}</span></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">New Campaign</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Campaign Name *</label>
                <input className="form-input" placeholder="e.g. Summer Sale 2025" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" placeholder="Optional description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Create Campaign'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
