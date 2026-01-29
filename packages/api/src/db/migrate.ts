import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import db from './connection.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, 'migrations');

export interface MigrationResult {
  executed: string[];
  skipped: string[];
  errors: string[];
}

export async function runMigrations(): Promise<MigrationResult> {
  const result: MigrationResult = {
    executed: [],
    skipped: [],
    errors: [],
  };

  try {
    // Create migrations tracking table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Get already executed migrations
    const { rows: executed } = await db.query('SELECT name FROM migrations');
    const executedNames = new Set(executed.map((r: { name: string }) => r.name));

    // Get migration files
    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (executedNames.has(file)) {
        result.skipped.push(file);
        continue;
      }

      console.log(`[Migrations] Running: ${file}`);
      const sql = readFileSync(join(migrationsDir, file), 'utf-8');

      try {
        await db.query('BEGIN');
        await db.query(sql);
        await db.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
        await db.query('COMMIT');
        result.executed.push(file);
        console.log(`[Migrations] Completed: ${file}`);
      } catch (error) {
        await db.query('ROLLBACK');
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`${file}: ${errorMsg}`);
        console.error(`[Migrations] Failed: ${file}`, error);
      }
    }

    console.log(`[Migrations] Done: ${result.executed.length} executed, ${result.skipped.length} skipped, ${result.errors.length} errors`);
    return result;
  } catch (error) {
    console.error('[Migrations] Fatal error:', error);
    throw error;
  }
}
