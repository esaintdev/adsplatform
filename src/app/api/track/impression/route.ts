import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// A transparent 1x1 pixel in base64
const TRANSPARENT_GIF_BASE64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const transparentGifBuffer = Buffer.from(TRANSPARENT_GIF_BASE64, 'base64');

function servePixel() {
  return new NextResponse(transparentGifBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bannerId = searchParams.get('bannerId');
  const campaignId = searchParams.get('campaignId');

  if (bannerId || campaignId) {
    try {
      if (bannerId) {
        const { rows } = await db.query(`SELECT is_active FROM banners WHERE id = $1`, [bannerId]);
        if (rows.length > 0 && !rows[0].is_active) {
            return servePixel();
        }
      }

      const id = randomUUID();
      const ipAddress = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
      const userAgent = request.headers.get('user-agent') ?? 'unknown';

      await db.query(
        `INSERT INTO tracking_events (id, type, banner_id, campaign_id, ip_address, user_agent, created_at) 
         VALUES ($1, 'IMPRESSION', $2, $3, $4, $5, NOW())`,
        [id, bannerId || null, campaignId || null, ipAddress, userAgent]
      );
    } catch (error) {
      console.error('Error logging impression:', error);
    }
  }

  return servePixel();
}
