import db from '../db/connection.js';
import type { BehavioralSignal } from '@corrix/shared';

interface IngestParams {
  anonymousId: string;
  organizationId?: string;
  signal: BehavioralSignal;
}

interface BatchIngestParams {
  anonymousId: string;
  organizationId?: string;
  signals: BehavioralSignal[];
}

export class SignalIngestionService {

  async ingestSignal(params: IngestParams): Promise<void> {
    const { anonymousId, organizationId, signal } = params;

    // Get or create user
    const userId = await this.getOrCreateUser(anonymousId, organizationId);

    // Insert signal
    const query = `
      INSERT INTO behavioral_signals (
        user_id,
        session_id,
        timestamp,
        platform,
        prompt_has_context,
        prompt_has_constraints,
        prompt_has_examples,
        prompt_has_format_spec,
        prompt_quality_score,
        prompt_word_count,
        action_type,
        time_to_action_seconds,
        conversation_depth,
        is_follow_up,
        has_verification_request,
        has_pushback,
        has_clarification_request,
        outcome_rating,
        session_duration_seconds,
        session_start_hour
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    `;

    await db.query(query, [
      userId,
      signal.sessionId,
      signal.timestamp,
      signal.platform,
      signal.promptHasContext,
      signal.promptHasConstraints,
      signal.promptHasExamples,
      signal.promptHasFormatSpec,
      signal.promptQualityScore,
      signal.promptWordCount,
      signal.actionType,
      signal.timeToActionSeconds,
      signal.conversationDepth,
      signal.isFollowUp,
      signal.hasVerificationRequest,
      signal.hasPushback,
      signal.hasClarificationRequest,
      signal.outcomeRating,
      signal.sessionDurationSeconds,
      signal.sessionStartHour,
    ]);

    // Update user last_seen_at
    await db.query(
      'UPDATE users SET last_seen_at = NOW() WHERE id = $1',
      [userId]
    );
  }

  async ingestBatch(params: BatchIngestParams): Promise<void> {
    const { anonymousId, organizationId, signals } = params;

    // Get or create user
    const userId = await this.getOrCreateUser(anonymousId, organizationId);

    // Use a transaction for batch insert
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      for (const signal of signals) {
        const query = `
          INSERT INTO behavioral_signals (
            user_id,
            session_id,
            timestamp,
            platform,
            prompt_has_context,
            prompt_has_constraints,
            prompt_has_examples,
            prompt_has_format_spec,
            prompt_quality_score,
            prompt_word_count,
            action_type,
            time_to_action_seconds,
            conversation_depth,
            is_follow_up,
            has_verification_request,
            has_pushback,
            has_clarification_request,
            outcome_rating,
            session_duration_seconds,
            session_start_hour
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        `;

        await client.query(query, [
          userId,
          signal.sessionId,
          signal.timestamp,
          signal.platform,
          signal.promptHasContext,
          signal.promptHasConstraints,
          signal.promptHasExamples,
          signal.promptHasFormatSpec,
          signal.promptQualityScore,
          signal.promptWordCount,
          signal.actionType,
          signal.timeToActionSeconds,
          signal.conversationDepth,
          signal.isFollowUp,
          signal.hasVerificationRequest,
          signal.hasPushback,
          signal.hasClarificationRequest,
          signal.outcomeRating,
          signal.sessionDurationSeconds,
          signal.sessionStartHour,
        ]);
      }

      // Update user last_seen_at
      await client.query(
        'UPDATE users SET last_seen_at = NOW() WHERE id = $1',
        [userId]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async getOrCreateUser(anonymousId: string, organizationId?: string): Promise<string> {
    // Try to find existing user
    const findQuery = 'SELECT id FROM users WHERE anonymous_id = $1';
    const findResult = await db.query(findQuery, [anonymousId]);

    if (findResult.rows.length > 0) {
      return findResult.rows[0].id;
    }

    // Create new user
    const insertQuery = `
      INSERT INTO users (anonymous_id, organization_id)
      VALUES ($1, $2)
      RETURNING id
    `;

    const insertResult = await db.query(insertQuery, [anonymousId, organizationId || null]);
    return insertResult.rows[0].id;
  }
}
