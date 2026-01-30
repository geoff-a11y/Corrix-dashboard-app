import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';
import { LiveChatService } from '../services/LiveChatService.js';
import { extractUserContext } from '../lib/context-utils.js';

const router = Router();

// Start a new live chat session
router.post('/start', async (req: Request, res: Response) => {
  try {
    const {
      scenarioId,
      industry,
      role,
      companySize,
      yearsExperience,
      primaryFunction,
      // Device context from frontend
      screenCategory,
      timezone,
      countryCode,
      region,
      referralSource,
    } = req.body;

    if (!scenarioId) {
      return res.status(400).json({ error: 'scenarioId is required' });
    }

    // Extract additional context from request
    const userContext = extractUserContext(req);

    console.log(`[LiveChat] Starting session: scenario=${scenarioId}, industry=${industry}, role=${role}, country=${userContext.countryCode || countryCode}`);

    // Get scenario variant
    const scenarioResult = await db.query(
      `SELECT * FROM scenario_variants WHERE scenario_id = $1 AND is_active = TRUE`,
      [scenarioId]
    );

    if (scenarioResult.rows.length === 0) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    const scenario = scenarioResult.rows[0];
    const sessionToken = uuidv4();

    // Create session with full context
    const sessionResult = await db.query(
      `INSERT INTO live_sessions (
        session_token, scenario_variant_id, scenario_id, current_state,
        industry, role_level, company_size, years_experience, primary_function,
        country_code, region, timezone,
        device_type, browser_family, os_family, screen_category,
        referral_source
      ) VALUES ($1, $2, $3, 'opening', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id, session_token`,
      [
        sessionToken,
        scenario.id,
        scenarioId,
        industry || null,
        role || null,
        companySize || null,
        yearsExperience || null,
        primaryFunction || null,
        countryCode || userContext.countryCode || null,
        region || userContext.region || null,
        timezone || userContext.timezone || null,
        userContext.deviceType,
        userContext.browserFamily,
        userContext.osFamily,
        screenCategory || userContext.screenCategory || null,
        referralSource || userContext.referralSource || null,
      ]
    );

    const session = sessionResult.rows[0];

    // Insert opening message
    await db.query(
      `INSERT INTO live_messages (session_id, role, content, sequence_number, session_state)
       VALUES ($1, 'assistant', $2, 1, 'opening')`,
      [session.id, scenario.opening_message]
    );

    // Update session exchange count
    await db.query(
      `UPDATE live_sessions SET exchange_count = 1 WHERE id = $1`,
      [session.id]
    );

    res.json({
      sessionId: session.session_token,
      openingMessage: scenario.opening_message,
      scenarioName: scenario.name,
      scenarioContext: scenario.context,
    });
  } catch (error) {
    console.error('[LiveChat] Start session error:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// Send a message in a live chat session
router.post('/message', async (req: Request, res: Response) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: 'sessionId and message are required' });
    }

    // Get session
    const sessionResult = await db.query(
      `SELECT ls.*, sv.system_prompt, sv.assessment_moments, sv.min_exchanges, sv.max_exchanges
       FROM live_sessions ls
       JOIN scenario_variants sv ON ls.scenario_variant_id = sv.id
       WHERE ls.session_token = $1`,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Session is no longer active' });
    }

    // Get message history
    const messagesResult = await db.query(
      `SELECT role, content FROM live_messages
       WHERE session_id = $1
       ORDER BY sequence_number ASC`,
      [session.id]
    );

    const messageHistory = messagesResult.rows;
    const nextSequence = messageHistory.length + 1;

    // Detect signals in user message
    const service = new LiveChatService();
    const signals = service.detectSignals(message, session.current_state);

    // Store user message
    await db.query(
      `INSERT INTO live_messages (session_id, role, content, sequence_number, session_state, signals)
       VALUES ($1, 'user', $2, $3, $4, $5)`,
      [session.id, message, nextSequence, session.current_state, JSON.stringify(signals)]
    );

    // Update session with user message stats
    await db.query(
      `UPDATE live_sessions SET
        exchange_count = exchange_count + 1,
        total_user_chars = total_user_chars + $1,
        signals_detected = signals_detected || $2,
        last_activity_at = NOW()
       WHERE id = $3`,
      [message.length, JSON.stringify(signals), session.id]
    );

    // Determine next state and whether to inject a moment
    const assessmentMoments = session.assessment_moments || [];
    const stateTransition = service.analyzeState(
      session.current_state,
      messageHistory,
      message,
      assessmentMoments,
      session.exchange_count
    );

    // Generate AI response
    const response = await service.generateResponse(
      session.system_prompt,
      [...messageHistory, { role: 'user', content: message }],
      stateTransition.injection
    );

    // Check if session should complete
    const isComplete = service.shouldComplete(
      session.exchange_count + 1,
      session.min_exchanges,
      session.max_exchanges,
      stateTransition.newState
    );

    // Store assistant message
    await db.query(
      `INSERT INTO live_messages (session_id, role, content, sequence_number, session_state)
       VALUES ($1, 'assistant', $2, $3, $4)`,
      [session.id, response, nextSequence + 1, stateTransition.newState]
    );

    // Update session state
    const statesVisited = session.states_visited || [];
    if (!statesVisited.includes(stateTransition.newState)) {
      statesVisited.push(stateTransition.newState);
    }

    await db.query(
      `UPDATE live_sessions SET
        current_state = $1,
        states_visited = $2,
        exchange_count = exchange_count + 1,
        total_ai_chars = total_ai_chars + $3,
        last_activity_at = NOW()
       WHERE id = $4`,
      [stateTransition.newState, statesVisited, response.length, session.id]
    );

    // If complete, generate credential
    let credentialId = null;
    if (isComplete) {
      credentialId = await service.completeSession(session.id);
    }

    res.json({
      response,
      state: stateTransition.newState,
      isComplete,
      credentialId,
    });
  } catch (error) {
    console.error('[LiveChat] Message error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Send a message with streaming response (SSE)
router.post('/message/stream', async (req: Request, res: Response) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: 'sessionId and message are required' });
    }

    // Get session
    const sessionResult = await db.query(
      `SELECT ls.*, sv.system_prompt, sv.assessment_moments, sv.min_exchanges, sv.max_exchanges
       FROM live_sessions ls
       JOIN scenario_variants sv ON ls.scenario_variant_id = sv.id
       WHERE ls.session_token = $1`,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Session is no longer active' });
    }

    // Get message history
    const messagesResult = await db.query(
      `SELECT role, content FROM live_messages
       WHERE session_id = $1
       ORDER BY sequence_number ASC`,
      [session.id]
    );

    const messageHistory = messagesResult.rows;
    const nextSequence = messageHistory.length + 1;

    // Detect signals in user message
    const service = new LiveChatService();
    const signals = service.detectSignals(message, session.current_state);

    // Store user message
    await db.query(
      `INSERT INTO live_messages (session_id, role, content, sequence_number, session_state, signals)
       VALUES ($1, 'user', $2, $3, $4, $5)`,
      [session.id, message, nextSequence, session.current_state, JSON.stringify(signals)]
    );

    // Update session with user message stats
    await db.query(
      `UPDATE live_sessions SET
        exchange_count = exchange_count + 1,
        total_user_chars = total_user_chars + $1,
        signals_detected = signals_detected || $2,
        last_activity_at = NOW()
       WHERE id = $3`,
      [message.length, JSON.stringify(signals), session.id]
    );

    // Determine next state and whether to inject a moment
    const assessmentMoments = session.assessment_moments || [];
    const stateTransition = service.analyzeState(
      session.current_state,
      messageHistory,
      message,
      assessmentMoments,
      session.exchange_count
    );

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Stream the response
    let fullResponse = '';
    try {
      for await (const chunk of service.generateResponseStream(
        session.system_prompt,
        [...messageHistory, { role: 'user', content: message }],
        stateTransition.injection
      )) {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
      }
    } catch (streamError) {
      console.error('[LiveChat] Stream error:', streamError);
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Streaming failed' })}\n\n`);
      res.end();
      return;
    }

    // Check if session should complete
    const isComplete = service.shouldComplete(
      session.exchange_count + 1,
      session.min_exchanges,
      session.max_exchanges,
      stateTransition.newState
    );

    // Store assistant message
    await db.query(
      `INSERT INTO live_messages (session_id, role, content, sequence_number, session_state)
       VALUES ($1, 'assistant', $2, $3, $4)`,
      [session.id, fullResponse, nextSequence + 1, stateTransition.newState]
    );

    // Update session state
    const statesVisited = session.states_visited || [];
    if (!statesVisited.includes(stateTransition.newState)) {
      statesVisited.push(stateTransition.newState);
    }

    await db.query(
      `UPDATE live_sessions SET
        current_state = $1,
        states_visited = $2,
        exchange_count = exchange_count + 1,
        total_ai_chars = total_ai_chars + $3,
        last_activity_at = NOW()
       WHERE id = $4`,
      [stateTransition.newState, statesVisited, fullResponse.length, session.id]
    );

    // If complete, generate credential
    let credentialId = null;
    if (isComplete) {
      credentialId = await service.completeSession(session.id);
    }

    // Send final metadata
    res.write(`data: ${JSON.stringify({
      type: 'done',
      state: stateTransition.newState,
      isComplete,
      credentialId,
    })}\n\n`);

    res.end();
  } catch (error) {
    console.error('[LiveChat] Stream message error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Complete a session and get results
router.post('/complete', async (req: Request, res: Response) => {
  try {
    const { sessionId, email } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    // Get session
    const sessionResult = await db.query(
      `SELECT * FROM live_sessions WHERE session_token = $1`,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Update email if provided
    if (email) {
      await db.query(
        `UPDATE live_sessions SET email = $1 WHERE id = $2`,
        [email, session.id]
      );
    }

    // If already complete, return existing credential
    if (session.credential_id) {
      const credResult = await db.query(
        `SELECT credential_id FROM credentials WHERE id = $1`,
        [session.credential_id]
      );
      return res.json({
        credentialId: credResult.rows[0]?.credential_id,
        alreadyComplete: true,
      });
    }

    // Complete the session
    const service = new LiveChatService();
    const credentialId = await service.completeSession(session.id, email);

    res.json({
      credentialId,
      alreadyComplete: false,
    });
  } catch (error) {
    console.error('[LiveChat] Complete error:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

// Get session status
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const sessionResult = await db.query(
      `SELECT ls.*, sv.name as scenario_name, sv.context as scenario_context
       FROM live_sessions ls
       JOIN scenario_variants sv ON ls.scenario_variant_id = sv.id
       WHERE ls.session_token = $1`,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Get messages
    const messagesResult = await db.query(
      `SELECT role, content, created_at
       FROM live_messages
       WHERE session_id = $1
       ORDER BY sequence_number ASC`,
      [session.id]
    );

    res.json({
      sessionId: session.session_token,
      scenarioName: session.scenario_name,
      scenarioContext: session.scenario_context,
      status: session.status,
      currentState: session.current_state,
      exchangeCount: session.exchange_count,
      messages: messagesResult.rows,
      credentialId: session.credential_id,
    });
  } catch (error) {
    console.error('[LiveChat] Get session error:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// Get available scenarios
router.get('/scenarios', async (_req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT scenario_id, category, name, context, description
       FROM scenario_variants
       WHERE is_active = TRUE
       ORDER BY category, name`
    );

    // Group by category
    const byCategory: Record<string, Array<{
      id: string;
      name: string;
      context: string;
      description: string;
    }>> = {};

    for (const row of result.rows) {
      if (!byCategory[row.category]) {
        byCategory[row.category] = [];
      }
      byCategory[row.category].push({
        id: row.scenario_id,
        name: row.name,
        context: row.context,
        description: row.description,
      });
    }

    res.json({ scenarios: byCategory });
  } catch (error) {
    console.error('[LiveChat] Get scenarios error:', error);
    res.status(500).json({ error: 'Failed to get scenarios' });
  }
});

export default router;
