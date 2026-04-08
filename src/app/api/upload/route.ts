import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

// Force Node.js runtime (required for fs operations)
export const runtime = 'nodejs';

// Uploads are written to public/uploads/ which is volume-mounted from the host.
// Host path: /root/ads-uploads  →  Container path: /app/public/uploads
const UPLOADS_DIR = join(process.cwd(), 'public', 'uploads');

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

export async function POST(request: Request) {
  try {
    // Ensure uploads directory exists (handles first-run and volume mount cases)
    if (!existsSync(UPLOADS_DIR)) {
      await mkdir(UPLOADS_DIR, { recursive: true });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Allowed: jpg, png, gif, webp, svg` },
        { status: 415 }
      );
    }

    // Build a safe filename — strip dangerous characters
    const ext = (file.name.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '');
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${ext}`;
    const filePath = join(UPLOADS_DIR, fileName);

    // Write to disk (async — does not block the event loop)
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Build the public URL — served as a Next.js static asset
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const fileUrl = `${appUrl}/uploads/${fileName}`;

    return NextResponse.json({ url: fileUrl }, { status: 201 });
  } catch (error) {
    console.error('[Upload] Error:', error);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}
