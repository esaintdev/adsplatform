import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Manually load .env since this is a script
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.warn('.env file not found');
}

async function init() {
  console.log('Connecting to database...');
  console.log(`URL: ${process.env.DATABASE_URL}`);
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  await client.connect();

  console.log('Connected! Creating tables...');

  try {
    // Enable UUID extension if needed (Postgres usually has it, but good to be sure)
    // Actually using CUID or randomUUID in JS, so VARCHAR is fine.

    // Campaigns Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ campaigns table exists');

    // Banners Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        image_url VARCHAR(1000) NOT NULL,
        target_url VARCHAR(1000) NOT NULL,
        size VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        campaign_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ banners table exists');

    // Tracking Events Table
    // Postgres ENUM is a bit different, checking if exists first
    try {
        await client.query(`CREATE TYPE event_type AS ENUM ('IMPRESSION', 'CLICK', 'VISIT', 'ACTION')`);
    } catch (e) {
        // already exists
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS tracking_events (
        id VARCHAR(36) PRIMARY KEY,
        type event_type NOT NULL,
        banner_id VARCHAR(36),
        ip_address VARCHAR(45),
        user_agent VARCHAR(500),
        metadata JSONB,
        campaign_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_banner FOREIGN KEY (banner_id) REFERENCES banners(id) ON DELETE SET NULL,
        CONSTRAINT fk_campaign_event FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
      )
    `);
    
    // Indices
    await client.query(`CREATE INDEX IF NOT EXISTS idx_type ON tracking_events(type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_banner ON tracking_events(banner_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_campaign ON tracking_events(campaign_id)`);

    console.log('✅ tracking_events table exists');

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await client.end();
  }
}

init();
