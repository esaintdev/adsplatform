import { Pool } from 'pg';

const poolOptions = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
};

// Prevent connection exhaustion in Next.js API routes (Serverless/Development constraints)
const globalForDb = globalThis as unknown as {
  pgPool: Pool | undefined;
};

export const db =
  globalForDb.pgPool ?? new Pool(poolOptions);

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pgPool = db;
}

// Helper to normalized query response (Postgres uses 'rows' property)
export const query = async (text: string, params?: any[]) => {
  const res = await db.query(text, params);
  return [res.rows, res.fields];
};

