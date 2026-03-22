import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// GET all campaigns
export async function GET() {
  try {
    const { rows } = await db.query(
      `SELECT c.*, 
        COUNT(DISTINCT b.id) AS banner_count,
        COUNT(DISTINCT e.id) AS event_count
       FROM campaigns c
       LEFT JOIN banners b ON b.campaign_id = c.id
       LEFT JOIN tracking_events e ON e.campaign_id = c.id
       GROUP BY c.id
       ORDER BY c.created_at DESC`
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

// POST create a new campaign
export async function POST(request: Request) {
  try {
    const { name, description } = await request.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const id = randomUUID();
    await db.query(
      `INSERT INTO campaigns (id, name, description) VALUES ($1, $2, $3)`,
      [id, name, description || null]
    );

    const { rows } = await db.query(`SELECT * FROM campaigns WHERE id = $1`, [id]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
