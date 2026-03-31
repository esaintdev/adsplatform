require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const crypto = require('crypto');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

app.use('/uploads', express.static(UPLOADS_DIR));
// trust proxy to get real IPs if Namecheap runs Nginx reverse proxy
app.set('trust proxy', true);

// Configure with your Namecheap database connection URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// A transparent 1x1 pixel in base64
const TRANSPARENT_GIF_BASE64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const transparentGifBuffer = Buffer.from(TRANSPARENT_GIF_BASE64, 'base64');

// Memory bucket for impressions
let impressionBatch = [];
// Memory cache for banner active status
let bannerActiveCache = new Map();

// Update banner active cache every 60 seconds avoids hitting DB on every view
async function updateBannerCache() {
  try {
    const { rows } = await pool.query('SELECT id, is_active FROM banners');
    const newCache = new Map();
    rows.forEach(r => newCache.set(r.id, r.is_active));
    bannerActiveCache = newCache;
  } catch (e) {
    console.error('Failed to update banner cache:', e.message);
  }
}

// Background worker: Flush impressions every 60 seconds
setInterval(async () => {
  if (impressionBatch.length === 0) return;
  
  // Swap buckets so new impressions can keep collecting during insert
  const batchToProcess = [...impressionBatch];
  impressionBatch = [];

  try {
    const values = [];
    const placeholders = [];
    
    batchToProcess.forEach((item, index) => {
      const offset = index * 5;
      placeholders.push(`($${offset + 1}, 'IMPRESSION', $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, NOW())`);
      values.push(
        crypto.randomUUID(),
        item.bannerId || null,
        item.campaignId || null,
        item.ipAddress,
        item.userAgent
      );
    });

    // Single query for hundreds of impressions reduces DB strain to practically zero
    const query = `
      INSERT INTO tracking_events (id, type, banner_id, campaign_id, ip_address, user_agent, created_at) 
      VALUES ${placeholders.join(', ')}
    `;
    
    await pool.query(query, values);
    console.log(`[${new Date().toISOString()}] Successfully batch inserted ${batchToProcess.length} impressions`);
  } catch (error) {
    console.error('Failed to insert batch:', error);
    // If DB fails, push them back into queue so we don't drop traffic!
    impressionBatch.push(...batchToProcess); 
  }
}, 60 * 1000); // Batches every 60 seconds

// Initial cache load
updateBannerCache();
setInterval(updateBannerCache, 60 * 1000);

// Tracking Endpoint Route GET /impression
app.get('/impression', (req, res) => {
  // Always serve pixel instantly (0ms latency to the user)
  res.set({
    'Content-Type': 'image/gif',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Access-Control-Allow-Origin': '*'
  });
  res.status(200).send(transparentGifBuffer);

  const bannerId = req.query.bannerId;
  const campaignId = req.query.campaignId;

  if (bannerId || campaignId) {
    // Check if banner is paused from cache (saving a Database Query!)
    if (bannerId) {
       const isActive = bannerActiveCache.get(bannerId);
       // Ignore fake/deleted banners (undefined) or paused banners (false)
       if (isActive === false || isActive === undefined) return; 
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Push into memory array
    impressionBatch.push({
      bannerId: bannerId || null,
      campaignId: campaignId || null,
      ipAddress: ipAddress.toString().split(',')[0].trim(),
      userAgent: userAgent.substring(0, 255)
    });
  }
});

// Click Tracking Route GET /click
app.get('/click', async (req, res) => {
  const bannerId = req.query.bannerId;
  if (!bannerId) return res.status(400).send('Missing ID');

  try {
    const { rows } = await pool.query(
      `SELECT target_url, campaign_id FROM banners WHERE id = $1`,
      [bannerId]
    );

    if (rows.length === 0) return res.status(404).send('Not Found');
    const { target_url, campaign_id } = rows[0];

    // Log click as a separate event (clicks are lower volume so we can INSERT immediately)
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    await pool.query(
      `INSERT INTO tracking_events (id, type, banner_id, campaign_id, ip_address, user_agent, created_at) 
       VALUES ($1, 'CLICK', $2, $3, $4, $5, NOW())`,
      [crypto.randomUUID(), bannerId, campaign_id, ipAddress.toString().split(',')[0].trim(), userAgent.substring(0, 255)]
    );

    res.redirect(target_url);
  } catch (e) {
    console.error('Click error:', e);
    res.status(500).send('Server Error');
  }
});

app.post('/upload', async (req, res) => {
  const { fileName, fileData } = req.body;
  if (!fileName || !fileData) return res.status(400).send('Missing data');

  try {
    const filePath = path.join(UPLOADS_DIR, fileName);
    const buffer = Buffer.from(fileData, 'base64');
    fs.writeFileSync(filePath, buffer);

    const trackerUrl = process.env.NEXT_PUBLIC_TRACKER_URL || `http://${req.headers.host}`;
    const fileUrl = `${trackerUrl}/uploads/${fileName}`;
    res.json({ url: fileUrl });
  } catch (e) {
    console.error('Upload error:', e);
    res.status(500).send('Upload failed');
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Tracker microservice running on port ${PORT}`);
});
