import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedFile = join(__dirname, '../src/db/migrations/002_seed_demo_data.sql');

async function seedData() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if demo org already exists
    const { rows } = await client.query(
      "SELECT id FROM organizations WHERE id = '00000000-0000-0000-0000-000000000001'"
    );

    if (rows.length > 0) {
      console.log('Demo data already exists, skipping...');
      return;
    }

    console.log('Seeding demo data...');
    const sql = readFileSync(seedFile, 'utf-8');
    await client.query(sql);
    console.log('Demo data seeded successfully');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedData();
