'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';

interface Analytics {
  summary: {
    total_impressions: number;
    total_clicks: number;
    total_visits: number;
    total_actions: number;
    ctr: string;
  };
  daily: Array<{ date: string; impressions: number; clicks: number; visits: number; actions: number }>;
  topBanners: Array<{ id: string; name: string; impressions: number; clicks: number }>;
}

export default function OverviewPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics?days=30')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content"><div className="loading-wrap"><div className="loading-spinner" /></div></main>
    </div>
  );

  const s = data?.summary;
  const daily = data?.daily ?? [];
  const maxImp = Math.max(...daily.map(d => Number(d.impressions)), 1);
  const maxClk = Math.max(...daily.map(d => Number(d.clicks)), 1);

  const stats = [
    { label: 'Total Impressions', value: Number(s?.total_impressions ?? 0).toLocaleString(), icon: '👁️', color: 'var(--accent)' },
    { label: 'Total Clicks', value: Number(s?.total_clicks ?? 0).toLocaleString(), icon: '🖱️', color: 'var(--green)' },
    { label: 'Site Visits', value: Number(s?.total_visits ?? 0).toLocaleString(), icon: '🌐', color: 'var(--purple)' },
    { label: 'Actions', value: Number(s?.total_actions ?? 0).toLocaleString(), icon: '⚡', color: 'var(--orange)' },
    { label: 'Click-Through Rate', value: `${s?.ctr ?? '0.00'}%`, icon: '🎯', color: 'var(--red)' },
  ];

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Overview</h1>
            <p className="page-subtitle">Last 30 days performance across all campaigns</p>
          </div>
        </div>
        <div className="page-body">
          <div className="stat-grid">
            {stats.map(st => (
              <div className="stat-card" key={st.label}>
                <div className="stat-icon">{st.icon}</div>
                <div className="stat-label">{st.label}</div>
                <div className="stat-value" style={{ color: st.color }}>{st.value}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          {daily.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Daily Activity</h2>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--accent)' }}>■ Impressions</span>
                <span style={{ fontSize: 12, color: 'var(--green)' }}>■ Clicks</span>
              </div>
              <div className="chart-bars">
                {daily.slice(-30).map((d) => (
                  <div className="chart-bar-wrap" key={d.date}>
                    <div
                      className="chart-bar impressions-bar"
                      style={{ height: `${(Number(d.impressions) / maxImp) * 90}px` }}
                      title={`${d.date}: ${d.impressions} impressions`}
                    />
                    <div
                      className="chart-bar clicks-bar"
                      style={{ height: `${(Number(d.clicks) / maxClk) * 90}px` }}
                      title={`${d.date}: ${d.clicks} clicks`}
                    />
                    <div className="chart-bar-label">{d.date.slice(5)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top banners */}
          {(data?.topBanners ?? []).length > 0 && (
            <div className="card">
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Top Banners</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Banner</th><th>Impressions</th><th>Clicks</th><th>CTR</th></tr>
                  </thead>
                  <tbody>
                    {data?.topBanners.map(b => {
                      const imp = Number(b.impressions);
                      const clk = Number(b.clicks);
                      const ctr = imp > 0 ? ((clk / imp) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={b.id}>
                          <td style={{ fontWeight: 600 }}>{b.name}</td>
                          <td>{imp.toLocaleString()}</td>
                          <td>{clk.toLocaleString()}</td>
                          <td><span className="badge badge-blue">{ctr}%</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {daily.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p style={{ fontWeight: 600, marginBottom: 6 }}>No data yet</p>
              <p style={{ fontSize: 13 }}>Create a campaign, add banners and start tracking to see data here.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
