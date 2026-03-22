import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET single campaign
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { rows } = await db.query(`SELECT * FROM campaigns WHERE id = $1`, [id]);
    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 });
  }
}

// PUT update campaign
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { name, description } = await request.json();
    await db.query(
      `UPDATE campaigns SET name = $1, description = $2 WHERE id = $3`,
      [name, description || null, id]
    );
    const { rows } = await db.query(`SELECT * FROM campaigns WHERE id = $1`, [id]);
    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}

// DELETE campaign
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.query(`DELETE FROM campaigns WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
  }
}
