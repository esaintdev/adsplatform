import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};

// GET all banners (optionally filter by campaignId)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId');

  try {
    let query = `SELECT b.*, c.name AS campaign_name,
      COUNT(CASE WHEN e.type = 'IMPRESSION' THEN e.id END) AS impressions,
      COUNT(DISTINCT CASE WHEN e.type = 'IMPRESSION' THEN e.ip_address END) AS unique_impressions,
      COUNT(CASE WHEN e.type = 'CLICK' THEN e.id END) AS clicks
      FROM banners b
      LEFT JOIN campaigns c ON c.id = b.campaign_id
      LEFT JOIN tracking_events e ON e.banner_id = b.id`;

    const values: string[] = [];
    if (campaignId) {
      query += ` WHERE b.campaign_id = $1`;
      values.push(campaignId);
    }

    query += ` GROUP BY b.id, c.name ORDER BY b.created_at DESC`;

    const { rows } = await db.query(query, values);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
  }
}

// POST create banner
export async function POST(request: Request) {
  try {
    const { name, imageUrl, targetUrl, size, campaignId } = await request.json();
    if (!name || !imageUrl || !targetUrl || !campaignId) {
      return NextResponse.json({ error: 'name, imageUrl, targetUrl and campaignId are required' }, { status: 400 });
    }

    const id = randomUUID();
    await db.query(
      `INSERT INTO banners (id, name, image_url, target_url, size, campaign_id) VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, name, imageUrl, targetUrl, size || null, campaignId]
    );

    const { rows } = await db.query(`SELECT * FROM banners WHERE id = $1`, [id]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 });
  }
}
