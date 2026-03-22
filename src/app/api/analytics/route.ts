import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET analytics overview
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId');
  const days = parseInt(searchParams.get('days') ?? '30');

  try {
    const campaignFilter = campaignId ? `AND e.campaign_id = $1` : '';
    const summaryValues: (string | number)[] = campaignId ? [campaignId, days] : [days];
    const summaryDaysPlaceholder = campaignId ? '$2' : '$1';

    // Summary totals
    const { rows: totalRows } = await db.query(
      `SELECT
        COUNT(id) FILTER (WHERE type = 'IMPRESSION') AS total_impressions,
        COUNT(DISTINCT ip_address) FILTER (WHERE type = 'IMPRESSION') AS unique_impressions,
        COUNT(id) FILTER (WHERE type = 'CLICK') AS total_clicks,
        COUNT(id) FILTER (WHERE type = 'VISIT') AS total_visits,
        COUNT(DISTINCT ip_address) FILTER (WHERE type = 'VISIT') AS unique_visits,
        COUNT(id) FILTER (WHERE type = 'ACTION') AS total_actions
       FROM tracking_events e
       WHERE e.created_at >= NOW() - (INTERVAL '1 day' * ${summaryDaysPlaceholder})
       ${campaignFilter}`,
      summaryValues
    );

    // Daily breakdown for charts
    const chartValues: (string | number)[] = campaignId ? [campaignId, days] : [days];
    const chartDaysPlaceholder = campaignId ? '$2' : '$1';

    const { rows: dailyRows } = await db.query(
      `SELECT
        DATE(created_at) AS date,
        COUNT(id) FILTER (WHERE type = 'IMPRESSION') AS impressions,
        COUNT(DISTINCT ip_address) FILTER (WHERE type = 'IMPRESSION') AS unique_impressions,
        COUNT(id) FILTER (WHERE type = 'CLICK') AS clicks,
        COUNT(id) FILTER (WHERE type = 'VISIT') AS visits,
        COUNT(id) FILTER (WHERE type = 'ACTION') AS actions
       FROM tracking_events e
       WHERE e.created_at >= NOW() - (INTERVAL '1 day' * ${chartDaysPlaceholder})
       ${campaignFilter}
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      chartValues
    );

    // Top banners by clicks
    const { rows: topBanners } = await db.query(
      `SELECT b.id, b.name, b.image_url, b.target_url,
        COUNT(e.id) FILTER (WHERE e.type = 'IMPRESSION') AS impressions,
        COUNT(DISTINCT e.ip_address) FILTER (WHERE e.type = 'IMPRESSION') AS unique_impressions,
        COUNT(e.id) FILTER (WHERE e.type = 'CLICK') AS clicks
       FROM banners b
       LEFT JOIN tracking_events e ON e.banner_id = b.id
       GROUP BY b.id
       ORDER BY clicks DESC
       LIMIT 10`
    );

    const summary = (totalRows as any[])[0];
    const impressions = Number(summary.total_impressions) || 0;
    const clicks = Number(summary.total_clicks) || 0;

    return NextResponse.json({
      summary: {
        ...summary,
        ctr: impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00',
      },
      daily: dailyRows,
      topBanners,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
