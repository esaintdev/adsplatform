import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET single banner with stats
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { rows } = await db.query(
      `SELECT b.*, c.name AS campaign_name,
        COUNT(e.id) FILTER (WHERE e.type = 'IMPRESSION') AS impressions,
        COUNT(DISTINCT e.ip_address) FILTER (WHERE e.type = 'IMPRESSION') AS unique_impressions,
        COUNT(e.id) FILTER (WHERE e.type = 'CLICK') AS clicks
       FROM banners b
       LEFT JOIN campaigns c ON c.id = b.campaign_id
       LEFT JOIN tracking_events e ON e.banner_id = b.id
       WHERE b.id = $1
       GROUP BY b.id, c.name`,
      [id]
    );

    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch banner' }, { status: 500 });
  }
}

// PUT update banner
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { name, imageUrl, targetUrl, size, isActive } = await request.json();
    await db.query(
      `UPDATE banners SET name = $1, image_url = $2, target_url = $3, size = $4, is_active = $5 WHERE id = $6`,
      [name, imageUrl, targetUrl, size || null, isActive !== undefined ? isActive : true, id]
    );
    const { rows } = await db.query(`SELECT * FROM banners WHERE id = $1`, [id]);
    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 });
  }
}

// DELETE banner
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.query(`DELETE FROM banners WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 });
  }
}
