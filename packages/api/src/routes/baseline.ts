import { Router, Request, Response } from 'express';
import db from '../db/connection.js';
import { ASSESSMENT_TEAM_ID } from '../services/AlphaUserSyncService.js';

const router = Router();

// Assessment users go to the "Corrix assessment" team
const OPEN_BASELINE_TEAM_ID = ASSESSMENT_TEAM_ID;

// Compact format (new)
interface CompactAssessment {
  v: string;
  ts: string;
  p: string;
  n: number;
  cs: string;
  s: {
    o: number;
    r: { o: number; d: number; a: number; e: number };
    l: { o: number; r: number; t: number; q: number };
    i: { o: number; c: number; s: number; x: number };
  };
  m: { p: string; a: number; c: number; s: number; d: number; w: string };
  do: Array<{ n: string; pct: number; x: string; r: number; l: number; i: number }>;
  u: { pt: string; wh: number; wi: number; ce: number; lt: string; vg: string; tb: string; kt: number };
  ob: { st: string; go: string; mi: string; di: string; rf: string; rc: string[] };
}

// Expanded format (old, for backwards compat)
interface DecodedAssessment {
  version: string;
  generated_at: string;
  platform_detected: 'chatgpt' | 'claude' | 'gemini' | 'unknown';
  conversation_count_analyzed: number;
  scores: {
    overall: number;
    results: { overall: number; decision_quality: number; output_accuracy: number; efficiency: number };
    relationship: { overall: number; appropriateness_of_reliance: number; trust_calibration: number; dialogue_quality: number };
    resilience: { overall: number; cognitive_sustainability: number; skill_trajectory: number; expertise_preservation: number };
  };
  modes: { primary: string; approving_pct: number; consulting_pct: number; supervising_pct: number; delegating_pct: number; switching_awareness: string };
  domains: Array<{ name: string; pct: number; expertise: string; results: number; relationship: number; resilience: number }>;
  usage: { peak_time: string; weekly_hours_estimate: number; weekly_interactions_estimate: number; critical_engagement_rate: number; learning_trajectory: string; vocabulary_growth: string; topic_breadth: string; knowledge_transfer: number };
  observations: { strengths: string; growth_opportunities: string; mode_insight: string; domain_insight: string; risk_flag: string; recommendations: string[] };
}

// Expand compact format to full format
function expandCompact(c: CompactAssessment): DecodedAssessment {
  return {
    version: c.v,
    generated_at: c.ts,
    platform_detected: c.p as DecodedAssessment['platform_detected'],
    conversation_count_analyzed: c.n,
    scores: {
      overall: c.s.o,
      results: { overall: c.s.r.o, decision_quality: c.s.r.d, output_accuracy: c.s.r.a, efficiency: c.s.r.e },
      relationship: { overall: c.s.l.o, appropriateness_of_reliance: c.s.l.r, trust_calibration: c.s.l.t, dialogue_quality: c.s.l.q },
      resilience: { overall: c.s.i.o, cognitive_sustainability: c.s.i.c, skill_trajectory: c.s.i.s, expertise_preservation: c.s.i.x },
    },
    modes: { primary: c.m.p, approving_pct: c.m.a, consulting_pct: c.m.c, supervising_pct: c.m.s, delegating_pct: c.m.d, switching_awareness: c.m.w },
    domains: c.do.map(d => ({ name: d.n, pct: d.pct, expertise: d.x, results: d.r, relationship: d.l, resilience: d.i })),
    usage: { peak_time: c.u.pt, weekly_hours_estimate: c.u.wh, weekly_interactions_estimate: c.u.wi, critical_engagement_rate: c.u.ce, learning_trajectory: c.u.lt, vocabulary_growth: c.u.vg, topic_breadth: c.u.tb, knowledge_transfer: c.u.kt },
    observations: { strengths: c.ob.st, growth_opportunities: c.ob.go, mode_insight: c.ob.mi, domain_insight: c.ob.di, risk_flag: c.ob.rf, recommendations: c.ob.rc as [string, string, string] },
  };
}

// Verify checksum to prevent tampering
function verifyChecksum(compact: CompactAssessment): boolean {
  try {
    // Extract all scores
    const scores = [
      compact.s.o,
      compact.s.r.o, compact.s.r.d, compact.s.r.a, compact.s.r.e,
      compact.s.l.o, compact.s.l.r, compact.s.l.t, compact.s.l.q,
      compact.s.i.o, compact.s.i.c, compact.s.i.s, compact.s.i.x,
    ];

    // Concatenate and sum digits
    const concat = scores.join('');
    const digitSum = concat.split('').reduce((sum, d) => sum + parseInt(d, 10), 0);

    // Multiply by overall score and convert to hex
    const checkValue = digitSum * compact.s.o;
    const expectedCs = checkValue.toString(16).padStart(6, '0').slice(0, 6);

    return compact.cs === expectedCs;
  } catch {
    return false;
  }
}

function decodeBaseline(encodedText: string): DecodedAssessment {
  let base64 = '';

  // Try new compact format first: CRX1:base64
  const crxMatch = encodedText.match(/CRX1:([A-Za-z0-9+/=]+)/);
  if (crxMatch) {
    base64 = crxMatch[1];
  } else {
    // Try old format patterns
    const patterns = [
      /:::\s*CORRIX_BASELINE_V1\s*:::\s*([\s\S]*?)\s*:::\s*END_CORRIX\s*:::/i,
      /CORRIX_BASELINE_V1[\s:]*\n+([\s\S]*?)\n+[\s:]*END_CORRIX/i,
      /═{10,}\s*([\s\S]*?)\s*═{10,}/,
    ];

    for (const pattern of patterns) {
      const match = encodedText.match(pattern);
      if (match && match[1]) {
        const content = match[1].trim();
        const base64Match = content.match(/([A-Za-z0-9+/=]{50,})/);
        if (base64Match) {
          base64 = base64Match[1];
          break;
        }
      }
    }

    // Fallback: any large base64 starting with eyJ
    if (!base64) {
      const fallbackMatch = encodedText.match(/(eyJ[A-Za-z0-9+/=]{50,})/);
      if (fallbackMatch) {
        base64 = fallbackMatch[1];
      }
    }
  }

  if (!base64) {
    throw new Error('Invalid format: Could not find encoded data');
  }

  base64 = base64.replace(/\s/g, '');

  try {
    const json = Buffer.from(base64, 'base64').toString('utf-8');
    console.log('[Baseline] Decoded JSON preview:', json.substring(0, 200));

    let parsed;
    try {
      parsed = JSON.parse(json);
    } catch (parseErr) {
      throw new Error(`Invalid JSON: ${json.substring(0, 100)}...`);
    }

    // Check if it's compact format (has 'v' and 's' keys)
    if (parsed.v && parsed.s) {
      const compact = parsed as CompactAssessment;

      // Verify checksum (warn but don't block for now during testing)
      if (!verifyChecksum(compact)) {
        console.warn('[Baseline] Checksum mismatch - possible tampering');
      }

      return expandCompact(compact);
    }

    // Otherwise it's already expanded format - validate key fields exist
    if (!parsed.scores && !parsed.s) {
      throw new Error('Missing scores data - AI may have output wrong format');
    }

    return parsed as DecodedAssessment;
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error('Invalid format: Could not decode data');
  }
}

function validateAssessment(data: DecodedAssessment): string[] {
  const errors: string[] = [];

  if (!data.scores?.overall) errors.push('Missing overall score');
  if (!data.scores?.results?.overall) errors.push('Missing results score');
  if (!data.scores?.relationship?.overall) errors.push('Missing relationship score');
  if (!data.scores?.resilience?.overall) errors.push('Missing resilience score');
  if (!data.modes?.primary) errors.push('Missing primary mode');
  if (!data.domains?.length) errors.push('Missing domains');

  const checkScore = (name: string, value: number | undefined) => {
    if (value !== undefined && (value < 0 || value > 100)) {
      errors.push(`${name} out of range: ${value}`);
    }
  };

  checkScore('overall', data.scores?.overall);
  checkScore('results.overall', data.scores?.results?.overall);
  checkScore('relationship.overall', data.scores?.relationship?.overall);
  checkScore('resilience.overall', data.scores?.resilience?.overall);

  const modeSum = (data.modes?.approving_pct || 0) +
                  (data.modes?.consulting_pct || 0) +
                  (data.modes?.supervising_pct || 0) +
                  (data.modes?.delegating_pct || 0);
  if (modeSum !== 100) {
    errors.push(`Mode percentages sum to ${modeSum}, expected 100`);
  }

  if (data.domains?.length > 3) {
    errors.push('Too many domains (max 3)');
  }

  return errors;
}

/**
 * POST /api/baseline/submit
 */
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const { email, encodedData } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    let decoded: DecodedAssessment;
    try {
      decoded = decodeBaseline(encodedData);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Unknown error';
      console.error('[Baseline] Decode error:', errorMsg);
      console.error('[Baseline] Input preview:', encodedData?.substring(0, 200));
      return res.status(400).json({
        error: `Could not decode: ${errorMsg}. Try using the new prompt from dashboard.corrix.ai/baseline`,
      });
    }

    const errors = validateAssessment(decoded);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Invalid assessment data', details: errors });
    }

    const assessmentResult = await db.query(
      `INSERT INTO baseline_assessments (
        email, platform_detected, conversation_count_analyzed, assessment_version,
        overall_score,
        results_overall, results_decision_quality, results_output_accuracy, results_efficiency,
        relationship_overall, relationship_appropriateness_of_reliance, relationship_trust_calibration, relationship_dialogue_quality,
        resilience_overall, resilience_cognitive_sustainability, resilience_skill_trajectory, resilience_expertise_preservation,
        mode_primary, mode_approving_pct, mode_consulting_pct, mode_supervising_pct, mode_delegating_pct, mode_switching_awareness,
        usage_peak_time, usage_weekly_hours, usage_weekly_interactions, usage_critical_engagement_rate,
        usage_learning_trajectory, usage_vocabulary_growth, usage_topic_breadth, usage_knowledge_transfer,
        obs_strengths, obs_growth_opportunities, obs_mode_insight, obs_domain_insight, obs_risk_flag,
        obs_recommendation_1, obs_recommendation_2, obs_recommendation_3,
        raw_assessment_json, team_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41
      ) RETURNING id`,
      [
        email.toLowerCase().trim(),
        decoded.platform_detected,
        decoded.conversation_count_analyzed,
        decoded.version,
        decoded.scores.overall,
        decoded.scores.results.overall,
        decoded.scores.results.decision_quality,
        decoded.scores.results.output_accuracy,
        decoded.scores.results.efficiency,
        decoded.scores.relationship.overall,
        decoded.scores.relationship.appropriateness_of_reliance,
        decoded.scores.relationship.trust_calibration,
        decoded.scores.relationship.dialogue_quality,
        decoded.scores.resilience.overall,
        decoded.scores.resilience.cognitive_sustainability,
        decoded.scores.resilience.skill_trajectory,
        decoded.scores.resilience.expertise_preservation,
        decoded.modes.primary,
        decoded.modes.approving_pct,
        decoded.modes.consulting_pct,
        decoded.modes.supervising_pct,
        decoded.modes.delegating_pct,
        decoded.modes.switching_awareness,
        decoded.usage.peak_time,
        decoded.usage.weekly_hours_estimate,
        decoded.usage.weekly_interactions_estimate,
        decoded.usage.critical_engagement_rate,
        decoded.usage.learning_trajectory,
        decoded.usage.vocabulary_growth,
        decoded.usage.topic_breadth,
        decoded.usage.knowledge_transfer,
        decoded.observations.strengths,
        decoded.observations.growth_opportunities,
        decoded.observations.mode_insight,
        decoded.observations.domain_insight,
        decoded.observations.risk_flag,
        decoded.observations.recommendations[0] || '',
        decoded.observations.recommendations[1] || '',
        decoded.observations.recommendations[2] || '',
        JSON.stringify(decoded),
        OPEN_BASELINE_TEAM_ID,
      ]
    );

    const assessmentId = assessmentResult.rows[0].id;

    if (decoded.domains && decoded.domains.length > 0) {
      for (let i = 0; i < decoded.domains.length; i++) {
        const domain = decoded.domains[i];
        await db.query(
          `INSERT INTO baseline_domains (
            assessment_id, domain_name, domain_pct, domain_expertise,
            domain_results, domain_relationship, domain_resilience, domain_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [assessmentId, domain.name, domain.pct, domain.expertise, domain.results, domain.relationship, domain.resilience, i + 1]
        );
      }
    }

    res.json({ success: true, assessment: { id: assessmentId, ...decoded } });
  } catch (error) {
    console.error('[Baseline] Submission error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/baseline/list
 */
router.get('/list', async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT id, email, platform_detected, overall_score, results_overall, relationship_overall, resilience_overall, mode_primary, created_at
       FROM baseline_assessments WHERE team_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [OPEN_BASELINE_TEAM_ID]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('[Baseline] List error:', error);
    res.status(500).json({ error: 'Failed to fetch baselines' });
  }
});

/**
 * GET /api/baseline/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assessmentResult = await db.query(`SELECT * FROM baseline_assessments WHERE id = $1`, [id]);

    if (assessmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const domainsResult = await db.query(
      `SELECT * FROM baseline_domains WHERE assessment_id = $1 ORDER BY domain_order`,
      [id]
    );

    res.json({ ...assessmentResult.rows[0], domains: domainsResult.rows });
  } catch (error) {
    console.error('[Baseline] Get error:', error);
    res.status(500).json({ error: 'Failed to fetch assessment' });
  }
});

export default router;
