import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bannerId = searchParams.get('bannerId');

  if (!bannerId) {
    return NextResponse.json({ error: 'Missing bannerId' }, { status: 400 });
  }

  try {
    // 1. Fetch banner target URL
    const { rows } = await db.query(
      `SELECT target_url, campaign_id FROM banners WHERE id = $1 AND is_active = TRUE`,
      [bannerId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Banner not found or inactive' }, { status: 404 });
    }

    const { target_url, campaign_id } = rows[0] as any;

    // 2. Log the click event
    const id = randomUUID();
    const ipAddress = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
    const userAgent = request.headers.get('user-agent') ?? 'unknown';

    await db.query(
      `INSERT INTO tracking_events (id, type, banner_id, campaign_id, ip_address, user_agent, created_at) 
       VALUES ($1, 'CLICK', $2, $3, $4, $5, NOW())`,
      [id, bannerId, campaign_id, ipAddress, userAgent]
    );

    // 3. Redirect to the target
    return NextResponse.redirect(target_url, 302);

  } catch (error) {
    console.error('Error logging click:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
