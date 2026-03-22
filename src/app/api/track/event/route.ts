import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, bannerId, campaignId, metadata } = body;

    // Validate type
    if (!['VISIT', 'ACTION'].includes(type)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    // Check if banner is active if bannerId is provided
    if (bannerId) {
      const { rows } = await db.query(`SELECT is_active FROM banners WHERE id = $1`, [bannerId]);
      if (rows.length > 0 && !rows[0].is_active) {
          return NextResponse.json({ success: false, error: 'Banner is paused' }, { status: 200 });
      }
    }

    const id = randomUUID();
    const ipAddress = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
    const userAgent = request.headers.get('user-agent') ?? 'unknown';

    await db.query(
      `INSERT INTO tracking_events (id, type, banner_id, campaign_id, ip_address, user_agent, metadata, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        id, 
        type, 
        bannerId || null, 
        campaignId || null, 
        ipAddress, 
        userAgent, 
        metadata || null
      ]
    );

    return NextResponse.json({ success: true, eventId: id }, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });

  } catch (error) {
    console.error('Error logging event:', error);
    return NextResponse.json({ error: 'Failed to process event' }, { status: 500 });
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }
  });
}
