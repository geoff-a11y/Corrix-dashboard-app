/**
 * Seed behavioral signals test data
 *
 * Creates realistic behavioral data for:
 * - Prompt quality metrics
 * - Action patterns (accept, edit, copy, regenerate, abandon)
 * - Session analytics
 * - Time to action
 * - Verification behaviors
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../../.env') });

const PLATFORMS = ['claude', 'chatgpt', 'gemini', 'other'];
const ACTION_TYPES = ['accept', 'edit', 'copy', 'regenerate', 'abandon'];

// Weighted distribution for actions (more accepts than abandons)
const ACTION_WEIGHTS = {
  accept: 0.35,
  edit: 0.25,
  copy: 0.20,
  regenerate: 0.15,
  abandon: 0.05,
};

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedRandomAction(): string {
  const rand = Math.random();
  let cumulative = 0;
  for (const [action, weight] of Object.entries(ACTION_WEIGHTS)) {
    cumulative += weight;
    if (rand < cumulative) return action;
  }
  return 'accept';
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomBool(probability = 0.5): boolean {
  return Math.random() < probability;
}

async function seedBehavioralData() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get users from Demo Organization
    const { rows: users } = await client.query(`
      SELECT id FROM users
      WHERE organization_id = '00000000-0000-0000-0000-000000000001'
    `);

    if (users.length === 0) {
      console.error('No users found in Demo Organization');
      process.exit(1);
    }

    console.log(`Found ${users.length} users in Demo Organization`);

    // Generate behavioral signals for the last 30 days
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const signals: any[] = [];
    const numSignals = 2000;

    // Track sessions per user for realistic session_id generation
    const sessionCounters: Map<string, number> = new Map();

    for (let i = 0; i < numSignals; i++) {
      const userId = randomChoice(users).id;

      // Generate session ID
      const userSessionCount = (sessionCounters.get(userId) || 0) + 1;
      sessionCounters.set(userId, userSessionCount);
      const sessionId = `session_${userId.slice(0, 8)}_${userSessionCount}`;

      const timestamp = new Date(thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo));
      const actionType = weightedRandomAction();

      // Prompt quality correlates with better outcomes
      const promptQuality = randomInt(30, 95);
      const hasContext = randomBool(0.4 + promptQuality / 200);
      const hasConstraints = randomBool(0.3 + promptQuality / 250);
      const hasExamples = randomBool(0.2 + promptQuality / 300);
      const hasFormatSpec = randomBool(0.25 + promptQuality / 250);

      // Time to action - faster for accepts, slower for edits/regenerates
      let timeToAction: number;
      switch (actionType) {
        case 'accept':
          timeToAction = randomFloat(2, 30);
          break;
        case 'copy':
          timeToAction = randomFloat(5, 45);
          break;
        case 'edit':
          timeToAction = randomFloat(15, 120);
          break;
        case 'regenerate':
          timeToAction = randomFloat(10, 60);
          break;
        case 'abandon':
          timeToAction = randomFloat(30, 180);
          break;
        default:
          timeToAction = randomFloat(10, 60);
      }

      // Edit ratio - higher for edit actions
      let editRatio: number;
      switch (actionType) {
        case 'edit':
          editRatio = randomFloat(0.1, 0.8);
          break;
        case 'accept':
        case 'copy':
          editRatio = randomFloat(0, 0.1);
          break;
        default:
          editRatio = randomFloat(0, 0.3);
      }

      // Outcome rating correlates with action type
      let outcomeRating: number;
      switch (actionType) {
        case 'accept':
        case 'copy':
          outcomeRating = randomInt(3, 5);
          break;
        case 'edit':
          outcomeRating = randomInt(2, 4);
          break;
        case 'regenerate':
          outcomeRating = randomInt(2, 4);
          break;
        case 'abandon':
          outcomeRating = randomInt(1, 2);
          break;
        default:
          outcomeRating = randomInt(2, 4);
      }

      const signal = {
        user_id: userId,
        session_id: sessionId,
        timestamp: timestamp.toISOString(),
        platform: randomChoice(PLATFORMS),
        prompt_has_context: hasContext,
        prompt_has_constraints: hasConstraints,
        prompt_has_examples: hasExamples,
        prompt_has_format_spec: hasFormatSpec,
        prompt_quality_score: promptQuality,
        prompt_word_count: randomInt(10, 500),
        action_type: actionType,
        time_to_action_seconds: timeToAction,
        conversation_depth: randomInt(1, 15),
        is_follow_up: randomBool(0.4),
        has_verification_request: randomBool(0.15),
        has_pushback: randomBool(0.1),
        has_clarification_request: randomBool(0.2),
        outcome_rating: outcomeRating,
        session_duration_seconds: randomInt(60, 3600),
        session_start_hour: randomInt(8, 22),
        first_attempt_success: actionType === 'accept' ? randomBool(0.8) : randomBool(0.4),
        error_recovery_time: actionType === 'regenerate' ? randomInt(5, 120) : null,
        edit_ratio: editRatio,
        fatigue_score: randomFloat(0, 100),
      };

      signals.push(signal);
    }

    // Insert in batches
    const batchSize = 100;
    for (let i = 0; i < signals.length; i += batchSize) {
      const batch = signals.slice(i, i + batchSize);

      for (const signal of batch) {
        await client.query(`
          INSERT INTO behavioral_signals (
            user_id, session_id, timestamp, platform,
            prompt_has_context, prompt_has_constraints, prompt_has_examples, prompt_has_format_spec,
            prompt_quality_score, prompt_word_count, action_type, time_to_action_seconds,
            conversation_depth, is_follow_up, has_verification_request, has_pushback,
            has_clarification_request, outcome_rating, session_duration_seconds, session_start_hour,
            first_attempt_success, error_recovery_time, edit_ratio, fatigue_score
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
          )
        `, [
          signal.user_id,
          signal.session_id,
          signal.timestamp,
          signal.platform,
          signal.prompt_has_context,
          signal.prompt_has_constraints,
          signal.prompt_has_examples,
          signal.prompt_has_format_spec,
          signal.prompt_quality_score,
          signal.prompt_word_count,
          signal.action_type,
          signal.time_to_action_seconds,
          signal.conversation_depth,
          signal.is_follow_up,
          signal.has_verification_request,
          signal.has_pushback,
          signal.has_clarification_request,
          signal.outcome_rating,
          signal.session_duration_seconds,
          signal.session_start_hour,
          signal.first_attempt_success,
          signal.error_recovery_time,
          signal.edit_ratio,
          signal.fatigue_score,
        ]);
      }

      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(signals.length / batchSize)}`);
    }

    console.log(`Successfully seeded ${signals.length} behavioral signals`);

  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedBehavioralData();
