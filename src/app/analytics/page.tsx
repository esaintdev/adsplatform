'use client';
import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

interface Analytics {
  summary: { 
    total_impressions: number; 
    unique_impressions: number;
    total_clicks: number; 
    total_visits: number; 
    unique_visits: number;
    total_actions: number; 
    ctr: string; 
  };
  daily: Array<{ 
    date: string; 
    impressions: number; 
    unique_impressions: number;
    clicks: number; 
    visits: number; 
    actions: number 
  }>;
  topBanners: Array<{ 
    id: string; 
    name: string; 
    impressions: number; 
    unique_impressions: number;
    clicks: number 
  }>;
}
interface Campaign { id: string; name: string; }

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignId, setCampaignId] = useState('');
  const [days, setDays] = useState('30');
  const [loading, setLoading] = useState(true);

  const load = (cid: string, d: string) => {
    setLoading(true);
    const params = new URLSearchParams({ days: d });
    if (cid) params.set('campaignId', cid);
    Promise.all([
      fetch(`/api/analytics?${params}`).then(r => r.json()),
      fetch('/api/campaigns').then(r => r.json()),
    ]).then(([a, c]) => { setData(a); setCampaigns(c); setLoading(false); });
  };

  useEffect(() => { load('', '30'); }, []);

  const handleFilter = (cid: string, d: string) => {
    setCampaignId(cid); setDays(d); load(cid, d);
  };

  const s = data?.summary;
  const rawDaily = data?.daily ?? [];

  // Format data for Recharts & Fill missing days
  const daily = useMemo(() => {
    const daysToCover = parseInt(days);
    const result = [];
    const now = new Date();
    
    // Create a map of existing data
    const dataMap = new Map();
    rawDaily.forEach(d => {
      const dateKey = new Date(d.date).toISOString().split('T')[0];
      dataMap.set(dateKey, d);
    });

    // Fill last N days
    for (let i = daysToCover - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      
      const existing = dataMap.get(dateKey);
      result.push({
        date: dateKey,
        formattedDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        impressions: Number(existing?.impressions || 0),
        uniques: Number(existing?.unique_impressions || 0),
        clicks: Number(existing?.clicks || 0),
        visits: Number(existing?.visits || 0),
        actions: Number(existing?.actions || 0),
      });
    }
    return result;
  }, [rawDaily, days]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="card" style={{ padding: '10px 14px', border: '1px solid var(--border-bright)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)', background: 'var(--bg-secondary)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>{label}</p>
          {payload.map((p: any) => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: p.color }}>
               <span style={{ fontSize: 16 }}>●</span>
               <span style={{ fontWeight: 600 }}>{p.value.toLocaleString()}</span>
               <span style={{ fontSize: 11, opacity: 0.8 }}>{p.name}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Analytics</h1>
            <p className="page-subtitle">Detailed performance metrics for your campaigns and banners</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select className="form-select" style={{ width: 180 }} value={campaignId} onChange={e => handleFilter(e.target.value, days)}>
              <option value="">All Campaigns</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="form-select" style={{ width: 130 }} value={days} onChange={e => handleFilter(campaignId, e.target.value)}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>
        <div className="page-body">
          {loading ? (
            <div className="loading-wrap"><div className="loading-spinner" /></div>
          ) : (
            <>
              <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
                {[
                  { label: 'Total Impr', value: Number(s?.total_impressions ?? 0).toLocaleString(), icon: '👁️', color: 'var(--accent)' },
                  { label: 'Unique Impr', value: Number(s?.unique_impressions ?? 0).toLocaleString(), icon: '👤', color: 'var(--accent)' },
                  { label: 'Clicks', value: Number(s?.total_clicks ?? 0).toLocaleString(), icon: '🖱️', color: 'var(--green)' },
                  { label: 'Total Visits', value: Number(s?.total_visits ?? 0).toLocaleString(), icon: '🌐', color: 'var(--purple)' },
                  { label: 'Unique Visitors', value: Number(s?.unique_visits ?? 0).toLocaleString(), icon: '🏠', color: 'var(--purple-light)' },
                  { label: 'Actions', value: Number(s?.total_actions ?? 0).toLocaleString(), icon: '⚡', color: 'var(--orange)' },
                  { label: 'CTR', value: `${s?.ctr ?? '0.00'}%`, icon: '🎯', color: 'var(--red)' },
                ].map(st => (
                  <div className="stat-card" key={st.label}>
                    <div className="stat-icon">{st.icon}</div>
                    <div className="stat-label">{st.label}</div>
                    <div className="stat-value" style={{ color: st.color }}>{st.value}</div>
                  </div>
                ))}
              </div>

              {daily.length > 0 ? (
                <>
                  <div className="card" style={{ marginBottom: 24, height: 400 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Market Reach (Daily)</h2>
                    <div style={{ height: 320, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={daily}>
                                <defs>
                                    <linearGradient id="colorImp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorUniq" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--purple)" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="var(--purple)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="formattedDate" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dx={-10} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="impressions" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorImp)" name="Total Impressions" />
                                <Area type="monotone" dataKey="uniques" stroke="var(--purple)" strokeWidth={3} fillOpacity={1} fill="url(#colorUniq)" name="Unique Reach" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="card" style={{ height: 400 }}>
                      <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Engagement (Clicks)</h2>
                      <div style={{ height: 320, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={daily}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="formattedDate" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dx={-10} />
                                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} content={<CustomTooltip />} />
                                <Bar dataKey="clicks" fill="var(--green)" radius={[4, 4, 0, 0]} barSize={40} name="Clicks" />
                            </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="card">
                      <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Top Banners</h2>
                      <div className="table-wrap" style={{ border: 'none' }}>
                        <table style={{ fontSize: 13 }}>
                          <thead>
                            <tr><th>Name</th><th style={{ textAlign: 'right' }}>Impr</th><th style={{ textAlign: 'right' }}>Clicks</th><th style={{ textAlign: 'center' }}>Efficiency</th></tr>
                          </thead>
                          <tbody>
                            {data?.topBanners.map(b => {
                                const ctr = Number(b.impressions) > 0 ? ((Number(b.clicks) / Number(b.impressions)) * 100).toFixed(1) : '0.0';
                                return (
                                    <tr key={b.id}>
                                        <td style={{ fontWeight: 600 }}>{b.name}</td>
                                        <td style={{ textAlign: 'right' }}>{Number(b.impressions).toLocaleString()}</td>
                                        <td style={{ textAlign: 'right' }}>{Number(b.clicks).toLocaleString()}</td>
                                        <td style={{ textAlign: 'center' }}><span className="badge badge-blue">{ctr}% CTR</span></td>
                                    </tr>
                                )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Detailed History</h2>
                    <div className="table-wrap">
                      <table style={{ fontSize: 13 }}>
                        <thead>
                          <tr><th>Date</th><th>Total Impr</th><th>Unique Impr</th><th>Clicks</th><th>Visits</th><th>Actions</th><th>CTR</th></tr>
                        </thead>
                        <tbody>
                          {[...daily].reverse().map(d => {
                            const imp = Number(d.impressions), clk = Number(d.clicks);
                            return (
                              <tr key={d.date}>
                                <td>{d.formattedDate}</td>
                                <td>{imp.toLocaleString()}</td>
                                <td>{Number(d.uniques || 0).toLocaleString()}</td>
                                <td>{clk.toLocaleString()}</td>
                                <td>{Number(d.visits).toLocaleString()}</td>
                                <td>{Number(d.actions).toLocaleString()}</td>
                                <td><span className="badge badge-blue">{imp > 0 ? ((clk / imp) * 100).toFixed(1) : '0.0'}%</span></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📈</div>
                  <p style={{ fontWeight: 600, marginBottom: 6 }}>No analytics data yet</p>
                  <p style={{ fontSize: 13 }}>Start embedding banners and tracker scripts to see data here.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}


