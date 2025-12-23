/**
 * Seed coaching outcomes test data
 *
 * Creates realistic coaching tip outcomes across:
 * - Multiple coaching types
 * - Different expertise levels
 * - Various domains
 * - Different action types
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../../.env') });

const COACHING_TYPES = [
  'hallucination_risk',
  'refusal_recovery',
  'stop_ramble',
  'math_date_check',
  'contradictory_instructions',
  'action_extraction',
  'red_team_check',
  'fact_check_mode',
  'anti_generic',
  'stepwise_mode',
  'off_piste_drift',
  'off_piste_constraint',
  'off_piste_invented',
  'off_piste_looping',
  'sycophancy_detection',
];

const EXPERTISE_STAGES = ['novice', 'advanced_beginner', 'competent', 'proficient', 'expert'];
const DOMAINS = ['software', 'marketing', 'finance', 'healthcare', 'education', 'general'];
const ACTIONS = ['injected_prompt', 'dismissed', 'thumbs_up', 'thumbs_down', 'clicked_away'];
const PLATFORMS = ['claude', 'chatgpt', 'gemini'];
const BEHAVIOR_PROFILES = ['quick_accepter', 'careful_reader', 'heavy_editor', 'iterative_refiner', 'mixed'];

// Effectiveness rates by coaching type (for realistic distribution)
const EFFECTIVENESS_RATES: Record<string, number> = {
  hallucination_risk: 0.55,
  refusal_recovery: 0.62,
  stop_ramble: 0.45,
  math_date_check: 0.70,
  contradictory_instructions: 0.38,
  action_extraction: 0.58,
  red_team_check: 0.42,
  fact_check_mode: 0.65,
  anti_generic: 0.35,
  stepwise_mode: 0.52,
  off_piste_drift: 0.40,
  off_piste_constraint: 0.75,
  off_piste_invented: 0.48,
  off_piste_looping: 0.55,
  sycophancy_detection: 0.32,
};

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAction(coachingType: string): string {
  const effectivenessRate = EFFECTIVENESS_RATES[coachingType] || 0.5;
  const rand = Math.random();

  if (rand < effectivenessRate * 0.7) {
    return 'injected_prompt';
  } else if (rand < effectivenessRate) {
    return 'thumbs_up';
  } else if (rand < effectivenessRate + 0.15) {
    return 'dismissed';
  } else if (rand < effectivenessRate + 0.25) {
    return 'clicked_away';
  } else {
    return 'thumbs_down';
  }
}

function randomImproved(action: string): boolean | null {
  if (action === 'dismissed' || action === 'clicked_away' || action === 'thumbs_down') {
    return null;
  }
  return Math.random() < 0.6;
}

async function seedCoachingData() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get existing users, teams, orgs for reference
    const { rows: users } = await client.query('SELECT id FROM users LIMIT 20');
    const { rows: teams } = await client.query('SELECT id FROM teams LIMIT 5');
    const { rows: orgs } = await client.query('SELECT id FROM organizations LIMIT 3');

    if (users.length === 0 || teams.length === 0 || orgs.length === 0) {
      console.log('No existing users/teams/orgs found. Creating sample coaching data without references...');
    }

    // Generate coaching outcomes for the last 30 days
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    const outcomes: any[] = [];
    const numOutcomes = 500;

    for (let i = 0; i < numOutcomes; i++) {
      const coachingType = randomChoice(COACHING_TYPES);
      const action = randomAction(coachingType);
      const timestamp = new Date(thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo));

      const outcome = {
        client_id: `test_client_${Math.floor(Math.random() * 50)}`,
        user_id: users.length > 0 ? randomChoice(users).id : null,
        team_id: teams.length > 0 ? randomChoice(teams).id : null,
        organization_id: orgs.length > 0 ? randomChoice(orgs).id : null,
        coaching_type: coachingType,
        action_taken: action,
        next_prompt_improved: randomImproved(action),
        expertise_stage: randomChoice(EXPERTISE_STAGES),
        domain: randomChoice(DOMAINS),
        behavior_profile: randomChoice(BEHAVIOR_PROFILES),
        platform: randomChoice(PLATFORMS),
        client_timestamp: timestamp.toISOString(),
        created_at: timestamp.toISOString(),
      };

      outcomes.push(outcome);
    }

    // Insert in batches
    const batchSize = 50;
    for (let i = 0; i < outcomes.length; i += batchSize) {
      const batch = outcomes.slice(i, i + batchSize);

      const values = batch.map((o, idx) => {
        const offset = idx * 12;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12})`;
      }).join(', ');

      const params = batch.flatMap(o => [
        o.client_id,
        o.user_id,
        o.team_id,
        o.organization_id,
        o.coaching_type,
        o.action_taken,
        o.next_prompt_improved,
        o.expertise_stage,
        o.domain,
        o.behavior_profile,
        o.platform,
        o.client_timestamp,
      ]);

      await client.query(`
        INSERT INTO coaching_outcomes (
          client_id, user_id, team_id, organization_id, coaching_type,
          action_taken, next_prompt_improved, expertise_stage, domain,
          behavior_profile, platform, client_timestamp
        ) VALUES ${values}
      `, params);

      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(outcomes.length / batchSize)}`);
    }

    // Refresh the materialized view
    console.log('Refreshing materialized view...');
    await client.query('REFRESH MATERIALIZED VIEW coaching_effectiveness');

    console.log(`Successfully seeded ${outcomes.length} coaching outcomes`);

  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedCoachingData();
