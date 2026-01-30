import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import authRouter from './routes/auth.js';
import scoresRouter from './routes/scores.js';
import behaviorsRouter from './routes/behaviors.js';
import teamsRouter from './routes/teams.js';
import organizationsRouter from './routes/organizations.js';
import usersRouter from './routes/users.js';
import signalsRouter from './routes/signals.js';
// Phase 2 routes
import temporalRouter from './routes/temporal.js';
import skillsRouter from './routes/skills.js';
import benchmarksRouter from './routes/benchmarks.js';
// Coaching routes
import coachingRouter from './routes/coaching.js';
// Targeting routes
import targetingRouter from './routes/targeting.js';
// Dashboard redesign routes
import alertsRouter from './routes/alerts.js';
import performanceRouter from './routes/performance.js';
// Baseline assessment (public)
import baselineRouter from './routes/baseline.js';
// Credential system (public)
import credentialRouter from './routes/credential.js';
// Live chat assessment (public)
import liveChatRouter from './routes/live-chat.js';
import { requireAuth, enforceOrgScope, requireAdmin } from './middleware/auth.js';
import { getRedisClient, isRedisAvailable, closeRedis } from './cache/connection.js';
import { runAlphaUserSyncJob, getAlphaUserSyncJobStatus } from './jobs/AlphaUserSyncJob.js';
import { runMigrations } from './db/migrate.js';

dotenv.config();

// Initialize Redis (lazy connection)
getRedisClient();

const app = express();
const PORT = process.env.PORT || 3001;
const BUILD_VERSION = '2026-01-29-v3'; // Live chat assessment

// Middleware
app.use(helmet());
// Parse CORS origins from environment variable (comma-separated) or use defaults for local dev
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3004', 'http://localhost:5173'];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', async (_req, res) => {
  const redisAvailable = await isRedisAvailable();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    redis: redisAvailable ? 'connected' : 'unavailable',
    version: BUILD_VERSION,
  });
});

// Auth routes (public)
app.use('/api/auth', authRouter);

// Baseline assessment (public - no auth required for submit)
app.use('/api/baseline', baselineRouter);

// Credential system (public - no auth required)
app.use('/api/credential', credentialRouter);

// Live chat assessment (public - no auth required)
app.use('/api/live-chat', liveChatRouter);

// API routes (protected)
app.use('/api/scores', requireAuth, enforceOrgScope, scoresRouter);
app.use('/api/behaviors', requireAuth, enforceOrgScope, behaviorsRouter);
app.use('/api/teams', requireAuth, enforceOrgScope, teamsRouter);
app.use('/api/organizations', requireAuth, enforceOrgScope, organizationsRouter);
app.use('/api/users', requireAuth, enforceOrgScope, usersRouter);

// Phase 2 routes (protected)
app.use('/api/temporal', requireAuth, enforceOrgScope, temporalRouter);
app.use('/api/skills', requireAuth, enforceOrgScope, skillsRouter);
app.use('/api/benchmarks', requireAuth, enforceOrgScope, benchmarksRouter);

// Coaching routes (protected)
app.use('/api/coaching', requireAuth, enforceOrgScope, coachingRouter);

// Targeting routes (protected, admin only)
app.use('/api/targeting', requireAuth, targetingRouter);

// Dashboard redesign routes (protected)
app.use('/api/alerts', requireAuth, enforceOrgScope, alertsRouter);
app.use('/api/performance', requireAuth, enforceOrgScope, performanceRouter);

// Signal ingestion (separate auth via extension headers)
app.use('/api/signals', signalsRouter);

// Admin sync endpoints (protected, admin only)
app.post('/api/admin/sync', requireAuth, requireAdmin, async (_req, res) => {
  try {
    console.log('[Admin] Manual sync triggered');
    await runAlphaUserSyncJob();
    res.json({ success: true, message: 'Sync completed' });
  } catch (error) {
    console.error('[Admin] Sync failed:', error);
    res.status(500).json({ error: 'Sync failed', message: (error as Error).message });
  }
});

app.get('/api/admin/sync/status', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const status = await getAlphaUserSyncJobStatus();
    res.json(status);
  } catch (error) {
    console.error('[Admin] Status check failed:', error);
    res.status(500).json({ error: 'Status check failed' });
  }
});

// Admin migration endpoint
app.post('/api/admin/migrate', requireAuth, requireAdmin, async (_req, res) => {
  try {
    console.log('[Admin] Running migrations...');
    const result = await runMigrations();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[Admin] Migration failed:', error);
    res.status(500).json({ error: 'Migration failed', message: (error as Error).message });
  }
});

// One-time endpoint to seed migrations table with already-run migrations
app.post('/api/admin/seed-migrations', async (_req, res) => {
  try {
    const alreadyRunMigrations = [
      '001_initial_schema.sql',
      '002_seed_demo_data.sql',
      '003_temporal_indicators.sql',
      '004_skill_tracking.sql',
      '005_user_metadata.sql',
      '006_benchmarks.sql',
      '007_seed_phase2_data.sql',
      '008_seed_multiorg_data.sql',
      '009_aggregation_tables.sql',
      '010_coaching_outcomes.sql',
      '011_domain_scores.sql',
      '012_admin_accounts.sql',
      '013_admin_passwords.sql',
      '014_baseline_assessments.sql',
      '015_credentials.sql',
      '016_restructure_orgs.sql',
    ];

    const db = (await import('./db/connection.js')).default;

    // Create migrations table if needed
    await db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Insert all already-run migrations
    for (const migration of alreadyRunMigrations) {
      await db.query(
        `INSERT INTO migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
        [migration]
      );
    }

    // Now run any new migrations
    const result = await runMigrations();
    res.json({ success: true, seeded: alreadyRunMigrations.length, ...result });
  } catch (error) {
    console.error('[Admin] Seed migrations failed:', error);
    res.status(500).json({ error: 'Failed', message: (error as Error).message });
  }
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, async () => {
  console.log(`[Corrix API] Server running on port ${PORT}`);

  // Run pending migrations on startup
  try {
    console.log('[Corrix API] Running migrations...');
    const migrationResult = await runMigrations();
    console.log(`[Corrix API] Migrations: ${migrationResult.executed.length} executed, ${migrationResult.skipped.length} skipped`);
  } catch (error) {
    console.error('[Corrix API] Migrations failed:', error);
  }

  // Run alpha user sync on startup to ensure all orgs/teams exist
  try {
    console.log('[Corrix API] Running startup sync job...');
    await runAlphaUserSyncJob();
    console.log('[Corrix API] Startup sync completed');
  } catch (error) {
    console.error('[Corrix API] Startup sync failed:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Corrix API] SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('[Corrix API] HTTP server closed');
  });
  await closeRedis();
  process.exit(0);
});

export { app };
