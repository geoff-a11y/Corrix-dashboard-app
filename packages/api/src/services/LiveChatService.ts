import Anthropic from '@anthropic-ai/sdk';
import db from '../db/connection.js';
import {
  generateCredentialId,
  calculateQualificationRating,
  generateVerificationUrl,
} from '../lib/credential-utils.js';
import { calculateBehavioralMetrics } from '../lib/context-utils.js';

// Assessment team ID for live chat credentials
const ASSESSMENT_TEAM_ID = 'a0000000-0000-0000-0000-000000000002';

interface Signal {
  type: string;
  subtype: string;
  strength: 'strong' | 'moderate' | 'weak';
  evidence: string;
}

interface AssessmentMoment {
  state: string;
  trigger: string;
  injection: string;
}

interface StateTransition {
  newState: string;
  injection: string | null;
}

interface Message {
  role: string;
  content: string;
}

// Signal definitions for each Results and Relationship sub-component
const SIGNAL_PATTERNS: Record<string, RegExp[]> = {
  // Results - Decision Quality
  'results.decision_quality.positive': [
    /\b(let me think|consider|what if|alternatively|another approach|weigh|trade-?off|pros and cons)\b/i,
    /\b(why would|what's the reasoning|explain your|help me understand)\b/i,
    /\b(before we proceed|let's step back|reconsider)\b/i,
  ],
  'results.decision_quality.negative': [
    /\b(just do it|whatever you think|sounds good|perfect|that works)\b/i,
    /\b(don't care|doesn't matter|up to you)\b/i,
  ],

  // Results - Output Accuracy
  'results.output_accuracy.positive': [
    /\b(check|verify|accurate|correct|double[- ]check|make sure|confirm)\b/i,
    /\b(source|reference|citation|evidence|data)\b/i,
    /\b(is this right|does this look correct|can you verify)\b/i,
  ],
  'results.output_accuracy.negative': [
    /\b(don't worry about|skip the|no need to check)\b/i,
  ],

  // Results - Efficiency
  'results.efficiency.positive': [
    /\b(streamline|efficient|faster|simpler|cut|reduce|eliminate)\b/i,
    /\b(focus on|prioritize|most important|key|essential)\b/i,
  ],
  'results.efficiency.negative': [
    /\b(add more|include everything|don't leave out|comprehensive)\b/i,
  ],

  // Relationship - Appropriateness of Reliance
  'relationship.reliance.positive': [
    /\b(i think|in my experience|from what i know|my understanding)\b/i,
    /\b(i'll handle|i can do|let me|i should)\b/i,
    /\b(you help with|you focus on|your part)\b/i,
  ],
  'relationship.reliance.negative': [
    /\b(you decide|you do it|just tell me|what should i)\b/i,
    /\b(i don't know anything|you're the expert|i can't)\b/i,
  ],

  // Relationship - Trust Calibration
  'relationship.trust.positive': [
    /\b(but|however|although|that said|on the other hand)\b/i,
    /\b(i disagree|not sure about|i question|concerns about)\b/i,
    /\b(can you explain|why|how come|what makes you)\b/i,
  ],
  'relationship.trust.negative': [
    /\b(you're right|absolutely|exactly|perfect|great idea)\b/i,
  ],

  // Relationship - Dialogue Quality
  'relationship.dialogue.positive': [
    /\b(specifically|for example|in particular|such as|like when)\b/i,
    /\b(context|background|situation|scenario|use case)\b/i,
    /\b(because|since|the reason|given that|considering)\b/i,
  ],
  'relationship.dialogue.negative': [
    /\b(whatever|idk|dunno|idc|meh|fine)\b/i,
  ],

  // Mode indicators
  'mode.approving': [
    /\b(approve|okay|accepted|proceed|go ahead|green light)\b/i,
  ],
  'mode.consulting': [
    /\b(what do you think|your thoughts|your opinion|advice|suggest|recommend)\b/i,
    /\b(help me think|brainstorm|explore options)\b/i,
  ],
  'mode.supervising': [
    /\b(change this|revise|modify|update|fix|adjust)\b/i,
    /\b(try again|another version|different approach)\b/i,
    /\b(not quite|close but|almost)\b/i,
  ],
  'mode.delegating': [
    /\b(just do|handle it|take care of|you figure out)\b/i,
    /\b(i trust you|your call|whatever works)\b/i,
  ],
};

// State triggers based on conversation patterns
const STATE_TRIGGERS: Record<string, (history: Message[], latestMessage: string, exchangeCount: number) => boolean> = {
  'after_2_exchanges': (_h, _m, count) => count >= 2,
  'after_context': (history) => history.length >= 4,
  'context_provided': (history) => history.length >= 4,
  'user_accepts_first_draft': (_h, msg) => /\b(looks good|great|thanks|perfect|works for me|like it)\b/i.test(msg),
  'drafting_content': (history) => history.length >= 6,
  'drafting': (history) => history.length >= 6,
  'writing_request': (history) => history.length >= 6,
  'creating_content': (history) => history.length >= 6,
  'after_revision': (history) => history.length >= 8,
  'reviewing_draft': (history) => history.length >= 8,
  'reviewing_items': (history) => history.length >= 8,
  'reviewing_posts': (history) => history.length >= 8,
  'refining': (history) => history.length >= 10,
  'user_satisfied': (_h, msg) => /\b(perfect|great|send it|done|finish|ready|good to go)\b/i.test(msg),
  'near_complete': (history) => history.length >= 12,
  'completing': (history) => history.length >= 14,
  'wrapping_up': (history) => history.length >= 14,
  'topic_shared': (history) => history.length >= 4,
  'product_described': (history) => history.length >= 4,
  'focus_defined': (history) => history.length >= 4,
  'area_defined': (history) => history.length >= 4,
  'goals_shared': (history) => history.length >= 4,
  'project_described': (history) => history.length >= 4,
  'requirements_shared': (history) => history.length >= 4,
  'decision_explained': (history) => history.length >= 4,
  'problem_described': (history) => history.length >= 4,
  'process_described': (history) => history.length >= 4,
  'context_shared': (history) => history.length >= 4,
  'code_shared': (history) => history.length >= 4,
  'bug_described': (history) => history.length >= 4,
  'reviewing_options': (history) => history.length >= 6,
  'narrowing_down': (history) => history.length >= 8,
  'selecting_favorite': (history) => history.length >= 10,
  'listing_content': (history) => history.length >= 6,
  'writing_content': (history) => history.length >= 8,
  'finishing_draft': (history) => history.length >= 10,
  'identifying_issues': (history) => history.length >= 6,
  'proposing_solutions': (history) => history.length >= 8,
  'finalizing_approach': (history) => history.length >= 10,
  'finalizing': (history) => history.length >= 10,
  'listing_criteria': (history) => history.length >= 6,
  'scoring_options': (history) => history.length >= 8,
  'matrix_complete': (history) => history.length >= 10,
  'analyzing': (history) => history.length >= 6,
  'identifying_causes': (history) => history.length >= 8,
  'solution_forming': (history) => history.length >= 10,
  'listing_risks': (history) => history.length >= 6,
  'assessing_likelihood': (history) => history.length >= 8,
  'planning_mitigation': (history) => history.length >= 10,
  'explaining': (history) => history.length >= 6,
  'deeper_questions': (history) => history.length >= 8,
  'gathering_info': (history) => history.length >= 6,
  'analyzing_info': (history) => history.length >= 8,
  'synthesizing': (history) => history.length >= 10,
  'researching': (history) => history.length >= 6,
  'evaluating': (history) => history.length >= 8,
  'concluding': (history) => history.length >= 10,
  'going_deeper': (history) => history.length >= 8,
  'finishing': (history) => history.length >= 10,
  'planning': (history) => history.length >= 6,
  'structuring': (history) => history.length >= 8,
  'defining_goals': (history) => history.length >= 6,
  'adding_keyresults': (history) => history.length >= 8,
  'allocating': (history) => history.length >= 6,
  'adjusting': (history) => history.length >= 8,
  'creating_timeline': (history) => history.length >= 6,
  'setting_milestones': (history) => history.length >= 8,
  'writing_feedback': (history) => history.length >= 8,
  'investigating': (history) => history.length >= 6,
  'finding_root_cause': (history) => history.length >= 10,
  'designing': (history) => history.length >= 6,
  'detailing': (history) => history.length >= 8,
  'writing': (history) => history.length >= 6,
  'adding_details': (history) => history.length >= 8,
  'reviewing': (history) => history.length >= 10,
};

export class LiveChatService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Detect behavioral signals in a user message
   */
  detectSignals(message: string, currentState: string): Signal[] {
    const signals: Signal[] = [];

    for (const [patternKey, patterns] of Object.entries(SIGNAL_PATTERNS)) {
      for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match) {
          const [category, subcategory, valence] = patternKey.split('.');
          signals.push({
            type: `${category}.${subcategory}`,
            subtype: valence || 'neutral',
            strength: this.assessSignalStrength(message, match[0]),
            evidence: match[0],
          });
          break; // Only one signal per pattern category
        }
      }
    }

    return signals;
  }

  /**
   * Assess signal strength based on context
   */
  private assessSignalStrength(message: string, match: string): 'strong' | 'moderate' | 'weak' {
    // Strong if emphatic language nearby
    if (/\b(really|definitely|absolutely|strongly|very)\b/i.test(message)) {
      return 'strong';
    }
    // Weak if hedged
    if (/\b(maybe|perhaps|might|could|sort of|kind of)\b/i.test(message)) {
      return 'weak';
    }
    return 'moderate';
  }

  /**
   * Analyze conversation state and determine next state + any injection
   */
  analyzeState(
    currentState: string,
    history: Message[],
    latestMessage: string,
    assessmentMoments: AssessmentMoment[],
    exchangeCount: number
  ): StateTransition {
    // Find moments that match current state and trigger
    for (const moment of assessmentMoments) {
      if (moment.state === currentState) {
        const triggerFn = STATE_TRIGGERS[moment.trigger];
        if (triggerFn && triggerFn(history, latestMessage, exchangeCount)) {
          // This moment triggers - advance to next state
          const states = ['opening', 'drafting', 'refining', 'completing'];
          const currentIndex = states.indexOf(currentState);
          const nextState = currentIndex < states.length - 1 ? states[currentIndex + 1] : 'completing';

          return {
            newState: nextState,
            injection: moment.injection,
          };
        }
      }
    }

    // No moment triggered, stay in current state
    return {
      newState: currentState,
      injection: null,
    };
  }

  /**
   * Generate AI response using Claude
   */
  async generateResponse(
    systemPrompt: string,
    history: Message[],
    injection: string | null
  ): Promise<string> {
    // Build messages array for Claude
    const messages = history.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // If there's an injection, add it as a system instruction
    let enhancedSystem = systemPrompt;
    if (injection) {
      enhancedSystem += `\n\n[Assessment moment - incorporate naturally into your response: ${injection}]`;
    }

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: enhancedSystem,
        messages,
      });

      // Extract text from response
      const textBlock = response.content.find(block => block.type === 'text');
      return textBlock?.text || 'I apologize, but I encountered an issue. Could you repeat that?';
    } catch (error) {
      console.error('[LiveChatService] Claude API error:', error);
      throw new Error('Failed to generate response');
    }
  }

  /**
   * Generate AI response with streaming
   */
  async *generateResponseStream(
    systemPrompt: string,
    history: Message[],
    injection: string | null
  ): AsyncGenerator<string, void, unknown> {
    // Build messages array for Claude
    const messages = history.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // If there's an injection, add it as a system instruction
    let enhancedSystem = systemPrompt;
    if (injection) {
      enhancedSystem += `\n\n[Assessment moment - incorporate naturally into your response: ${injection}]`;
    }

    try {
      const stream = this.anthropic.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: enhancedSystem,
        messages,
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield event.delta.text;
        }
      }
    } catch (error) {
      console.error('[LiveChatService] Claude streaming error:', error);
      throw new Error('Failed to generate response');
    }
  }

  /**
   * Determine if session should complete
   */
  shouldComplete(
    exchangeCount: number,
    minExchanges: number,
    maxExchanges: number,
    currentState: string
  ): boolean {
    // Must meet minimum exchanges
    if (exchangeCount < minExchanges) {
      return false;
    }

    // Complete if at max exchanges
    if (exchangeCount >= maxExchanges) {
      return true;
    }

    // Complete if in completing state and enough exchanges
    if (currentState === 'completing' && exchangeCount >= minExchanges + 2) {
      return true;
    }

    return false;
  }

  /**
   * Complete a session and generate credential
   */
  async completeSession(sessionId: string, email?: string): Promise<string> {
    // Get session and all messages
    const sessionResult = await db.query(
      `SELECT ls.*, sv.name as scenario_name, sv.category, sv.scenario_id
       FROM live_sessions ls
       JOIN scenario_variants sv ON ls.scenario_variant_id = sv.id
       WHERE ls.id = $1`,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      throw new Error('Session not found');
    }

    const session = sessionResult.rows[0];

    // Get all messages with timestamps for behavioral metrics
    const messagesResult = await db.query(
      `SELECT role, content, signals, created_at
       FROM live_messages
       WHERE session_id = $1
       ORDER BY sequence_number`,
      [sessionId]
    );

    // Aggregate signals
    const allSignals: Signal[] = [];
    for (const msg of messagesResult.rows) {
      if (msg.signals && Array.isArray(msg.signals)) {
        allSignals.push(...msg.signals);
      }
    }

    // Calculate behavioral metrics from messages
    const behavioralMetrics = calculateBehavioralMetrics(messagesResult.rows);

    // Update session with behavioral metrics
    await db.query(
      `UPDATE live_sessions SET
        avg_response_time_seconds = $1,
        avg_message_length = $2
       WHERE id = $3`,
      [behavioralMetrics.avgResponseTimeSeconds, behavioralMetrics.avgMessageLength, sessionId]
    );

    // Calculate scores from signals
    const scores = this.calculateScores(allSignals, session);

    // Determine primary mode
    const mode = this.determinePrimaryMode(allSignals);

    // Generate credential
    const credentialId = generateCredentialId();
    const qualificationRating = calculateQualificationRating(scores.overall);
    const verificationUrl = generateVerificationUrl(credentialId);

    // Determine profile type based on scenario category
    const profileType = this.getProfileType(session.category, mode.primary);

    // Insert credential with metadata
    const credResult = await db.query(
      `INSERT INTO credentials (
        credential_id,
        email,
        assessment_type,
        platform_detected,
        raw_overall_score,
        calibrated_overall_score,
        qualification_rating,
        profile_type,
        profile_description,
        results_overall,
        results_decision_quality,
        results_output_accuracy,
        results_efficiency,
        relationship_overall,
        relationship_appropriateness_of_reliance,
        relationship_trust_calibration,
        relationship_dialogue_quality,
        resilience_overall,
        mode_primary,
        mode_approving_pct,
        mode_consulting_pct,
        mode_supervising_pct,
        mode_delegating_pct,
        conversation_count_analyzed,
        team_id,
        verification_url,
        raw_assessment_json,
        industry,
        role_level,
        country_code,
        scenario_category,
        company_size
      ) VALUES (
        $1, $2, 'live_chat', 'claude', $3, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12, $13, $14, NULL,
        $15, $16, $17, $18, $19, $20, $21, $22, $23,
        $24, $25, $26, $27, $28
      )
      RETURNING id, credential_id`,
      [
        credentialId,
        email || session.email,
        scores.overall,
        qualificationRating,
        profileType,
        `Assessed through ${session.scenario_name} live chat scenario`,
        scores.results.overall,
        scores.results.decisionQuality,
        scores.results.outputAccuracy,
        scores.results.efficiency,
        scores.relationship.overall,
        scores.relationship.reliance,
        scores.relationship.trust,
        scores.relationship.dialogue,
        mode.primary,
        mode.approving,
        mode.consulting,
        mode.supervising,
        mode.delegating,
        session.exchange_count,
        ASSESSMENT_TEAM_ID,
        verificationUrl,
        JSON.stringify({ session, scores, mode, signals: allSignals }),
        session.industry || null,
        session.role_level || null,
        session.country_code || null,
        session.category || null,
        session.company_size || null,
      ]
    );

    const credential = credResult.rows[0];

    // Update session with completion info
    await db.query(
      `UPDATE live_sessions SET
        status = 'completed',
        completed_at = NOW(),
        credential_id = $1,
        results_score = $2,
        relationship_score = $3,
        overall_score = $4,
        assessment_json = $5
       WHERE id = $6`,
      [
        credential.id,
        scores.results.overall,
        scores.relationship.overall,
        scores.overall,
        JSON.stringify({ scores, mode }),
        sessionId,
      ]
    );

    // Calculate duration
    const durationSeconds = session.created_at && session.completed_at
      ? Math.round((new Date().getTime() - new Date(session.created_at).getTime()) / 1000)
      : null;

    // Insert assessment metadata for analytics
    await db.query(
      `INSERT INTO assessment_metadata (
        credential_id,
        live_session_id,
        industry,
        role_level,
        company_size,
        years_experience,
        primary_function,
        country_code,
        region,
        timezone,
        device_type,
        browser_family,
        os_family,
        screen_category,
        started_at,
        completed_at,
        duration_seconds,
        assessment_type,
        scenario_category,
        scenario_id,
        platform_detected,
        exchange_count,
        total_user_chars,
        total_ai_chars,
        avg_response_time_seconds,
        avg_message_length,
        question_ratio,
        revision_count,
        referral_source
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, NOW(), $16, 'live_chat',
        $17, $18, 'claude', $19, $20, $21, $22, $23, $24, $25, $26
      )`,
      [
        credential.id,
        sessionId,
        session.industry || null,
        session.role_level || null,
        session.company_size || null,
        session.years_experience || null,
        session.primary_function || null,
        session.country_code || null,
        session.region || null,
        session.timezone || null,
        session.device_type || null,
        session.browser_family || null,
        session.os_family || null,
        session.screen_category || null,
        session.created_at,
        durationSeconds,
        session.category || null,
        session.scenario_id || null,
        session.exchange_count,
        session.total_user_chars || 0,
        session.total_ai_chars || 0,
        behavioralMetrics.avgResponseTimeSeconds,
        behavioralMetrics.avgMessageLength,
        behavioralMetrics.questionRatio,
        behavioralMetrics.revisionCount,
        session.referral_source || null,
      ]
    );

    return credentialId;
  }

  /**
   * Calculate scores from detected signals
   */
  private calculateScores(signals: Signal[], session: any): {
    overall: number;
    results: {
      overall: number;
      decisionQuality: number;
      outputAccuracy: number;
      efficiency: number;
    };
    relationship: {
      overall: number;
      reliance: number;
      trust: number;
      dialogue: number;
    };
  } {
    // Count positive and negative signals for each component
    const signalCounts: Record<string, { positive: number; negative: number }> = {
      'results.decision_quality': { positive: 0, negative: 0 },
      'results.output_accuracy': { positive: 0, negative: 0 },
      'results.efficiency': { positive: 0, negative: 0 },
      'relationship.reliance': { positive: 0, negative: 0 },
      'relationship.trust': { positive: 0, negative: 0 },
      'relationship.dialogue': { positive: 0, negative: 0 },
    };

    for (const signal of signals) {
      const key = signal.type;
      if (signalCounts[key]) {
        const weight = signal.strength === 'strong' ? 2 : signal.strength === 'moderate' ? 1 : 0.5;
        if (signal.subtype === 'positive') {
          signalCounts[key].positive += weight;
        } else if (signal.subtype === 'negative') {
          signalCounts[key].negative += weight;
        }
      }
    }

    // Calculate component scores (base 70, +/- based on signals)
    const calculateComponentScore = (key: string): number => {
      const counts = signalCounts[key];
      const netSignal = counts.positive - counts.negative;
      // Map net signal to score adjustment (-30 to +30)
      const adjustment = Math.max(-30, Math.min(30, netSignal * 10));
      return Math.max(0, Math.min(100, 70 + adjustment));
    };

    const decisionQuality = calculateComponentScore('results.decision_quality');
    const outputAccuracy = calculateComponentScore('results.output_accuracy');
    const efficiency = calculateComponentScore('results.efficiency');
    const resultsOverall = Math.round((decisionQuality + outputAccuracy + efficiency) / 3);

    const reliance = calculateComponentScore('relationship.reliance');
    const trust = calculateComponentScore('relationship.trust');
    const dialogue = calculateComponentScore('relationship.dialogue');
    const relationshipOverall = Math.round((reliance + trust + dialogue) / 3);

    // Overall is average of Results and Relationship (no Resilience for live chat)
    const overall = Math.round((resultsOverall + relationshipOverall) / 2);

    return {
      overall,
      results: {
        overall: resultsOverall,
        decisionQuality,
        outputAccuracy,
        efficiency,
      },
      relationship: {
        overall: relationshipOverall,
        reliance,
        trust,
        dialogue,
      },
    };
  }

  /**
   * Determine primary collaboration mode from signals
   */
  private determinePrimaryMode(signals: Signal[]): {
    primary: string;
    approving: number;
    consulting: number;
    supervising: number;
    delegating: number;
  } {
    const modeCounts = {
      approving: 0,
      consulting: 0,
      supervising: 0,
      delegating: 0,
    };

    for (const signal of signals) {
      if (signal.type.startsWith('mode.')) {
        const mode = signal.type.split('.')[1] as keyof typeof modeCounts;
        if (modeCounts[mode] !== undefined) {
          modeCounts[mode] += signal.strength === 'strong' ? 2 : 1;
        }
      }
    }

    // Calculate percentages
    const total = Object.values(modeCounts).reduce((a, b) => a + b, 0) || 1;
    const percentages = {
      approving: Math.round((modeCounts.approving / total) * 100),
      consulting: Math.round((modeCounts.consulting / total) * 100),
      supervising: Math.round((modeCounts.supervising / total) * 100),
      delegating: Math.round((modeCounts.delegating / total) * 100),
    };

    // Find primary mode
    let primary = 'consulting';
    let maxCount = 0;
    for (const [mode, count] of Object.entries(modeCounts)) {
      if (count > maxCount) {
        maxCount = count;
        primary = mode;
      }
    }

    return {
      primary,
      ...percentages,
    };
  }

  /**
   * Get profile type based on scenario category and mode
   */
  private getProfileType(category: string, primaryMode: string): string {
    const profileMap: Record<string, Record<string, string>> = {
      'professional-communication': {
        consulting: 'Collaborative Communicator',
        supervising: 'Precise Editor',
        delegating: 'Efficient Delegator',
        approving: 'Quality Gatekeeper',
      },
      'creative-content': {
        consulting: 'Creative Partner',
        supervising: 'Creative Director',
        delegating: 'Content Strategist',
        approving: 'Brand Guardian',
      },
      'problem-solving': {
        consulting: 'Strategic Analyst',
        supervising: 'Solution Architect',
        delegating: 'Efficiency Expert',
        approving: 'Decision Validator',
      },
      'learning-research': {
        consulting: 'Curious Learner',
        supervising: 'Critical Researcher',
        delegating: 'Information Synthesizer',
        approving: 'Knowledge Curator',
      },
      'planning-strategy': {
        consulting: 'Strategic Thinker',
        supervising: 'Plan Optimizer',
        delegating: 'Execution Focused',
        approving: 'Risk Manager',
      },
      'code-technical': {
        consulting: 'Technical Collaborator',
        supervising: 'Code Reviewer',
        delegating: 'Dev Efficiency Seeker',
        approving: 'Quality Assurance',
      },
    };

    return profileMap[category]?.[primaryMode] || 'AI Collaborator';
  }
}
