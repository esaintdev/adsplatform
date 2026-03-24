import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// A transparent 1x1 pixel in base64
const TRANSPARENT_GIF_BASE64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const transparentGifBuffer = Buffer.from(TRANSPARENT_GIF_BASE64, 'base64');

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { rows } = await db.query(
      `SELECT image_url, is_active FROM banners WHERE id = $1`,
      [id]
    );

    // If banner doesn't exist or is paused, serve a silent transparent pixel
    if (rows.length === 0 || !rows[0].is_active) {
      return new NextResponse(transparentGifBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    const imageUrl = rows[0].image_url;
    
    // Redirect to the actual image URL
    // We add no-cache headers here too to force the browser to check the latest visual every time
    return new NextResponse(null, {
      status: 302,
      headers: {
        'Location': imageUrl,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error fetching banner image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
