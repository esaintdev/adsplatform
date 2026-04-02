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
        COUNT(CASE WHEN type = 'IMPRESSION' THEN id END) AS total_impressions,
        COUNT(DISTINCT CASE WHEN type = 'IMPRESSION' THEN ip_address END) AS unique_impressions,
        COUNT(CASE WHEN type = 'CLICK' THEN id END) AS total_clicks,
        COUNT(CASE WHEN type = 'VISIT' THEN id END) AS total_visits,
        COUNT(DISTINCT CASE WHEN type = 'VISIT' THEN ip_address END) AS unique_visits,
        COUNT(CASE WHEN type = 'ACTION' THEN id END) AS total_actions
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
        COUNT(CASE WHEN type = 'IMPRESSION' THEN id END) AS impressions,
        COUNT(DISTINCT CASE WHEN type = 'IMPRESSION' THEN ip_address END) AS unique_impressions,
        COUNT(CASE WHEN type = 'CLICK' THEN id END) AS clicks,
        COUNT(CASE WHEN type = 'VISIT' THEN id END) AS visits,
        COUNT(CASE WHEN type = 'ACTION' THEN id END) AS actions
       FROM tracking_events e
       WHERE e.created_at >= NOW() - (INTERVAL '1 day' * ${chartDaysPlaceholder})
       ${campaignFilter}
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      chartValues
    );

    // Top banners by clicks within the requested timeframe
    const topBannersValues: (string | number)[] = campaignId ? [campaignId, days] : [days];
    const topBannersDaysPlaceholder = campaignId ? '$2' : '$1';

    const { rows: topBanners } = await db.query(
      `SELECT b.id, b.name, b.image_url, b.target_url,
        stats.impressions,
        stats.unique_impressions,
        stats.clicks
       FROM banners b
       INNER JOIN (
         SELECT banner_id,
           COUNT(CASE WHEN type = 'IMPRESSION' THEN id END) AS impressions,
           COUNT(DISTINCT CASE WHEN type = 'IMPRESSION' THEN ip_address END) AS unique_impressions,
           COUNT(CASE WHEN type = 'CLICK' THEN id END) AS clicks
         FROM tracking_events
         WHERE created_at >= NOW() - (INTERVAL '1 day' * ${topBannersDaysPlaceholder})
         ${campaignId ? 'AND campaign_id = $1' : ''}
         GROUP BY banner_id
       ) stats ON stats.banner_id = b.id
       ORDER BY stats.clicks DESC
       LIMIT 10`,
      topBannersValues
    );

    const summary = (totalRows as any[])[0] || {
      total_impressions: 0,
      unique_impressions: 0,
      total_clicks: 0,
      total_visits: 0,
      unique_visits: 0,
      total_actions: 0
    };
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
