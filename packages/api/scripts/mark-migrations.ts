import pg from 'pg';
import dotenv from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../../.env') });

async function markMigrations() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Mark already-executed migrations
  const existingMigrations = [
    '001_initial_schema.sql',
    '002_seed_demo_data.sql'
  ];

  for (const name of existingMigrations) {
    await client.query('INSERT INTO migrations (name) VALUES ($1) ON CONFLICT DO NOTHING', [name]);
    console.log('Marked as executed:', name);
  }

  await client.end();
  console.log('Done');
}

markMigrations();
