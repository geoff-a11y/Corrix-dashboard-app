import { Router, Request, Response } from 'express';
import db from '../db/connection.js';
import { calibrateScore, calculatePercentile, getCalibrationVersion, updateCalibrationStats, Platform } from '../lib/calibration.js';
import {
  generateCredentialId,
  calculateQualificationRating,
  identifyRedFlags,
  identifyStrengths,
  identifyGrowthAreas,
  generateInterviewProbes,
  generateVerificationUrl,
} from '../lib/credential-utils.js';

const router = Router();

const CREDENTIAL_TEAM_ID = 'a0000000-0000-0000-0000-000000000002';

// Compact format from AI
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
  // Extended credential fields (AI-generated)
  pr?: { t: string; d: string }; // profile: type, description
  rf?: string[]; // red_flags array
  ip?: Array<{ a: string; p: string; r: string }>; // interview_probes: area, probe, rationale
}

// Expanded format
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
  // Extended credential fields
  profile?: { type: string; description: string };
  red_flags?: string[];
  interview_probes?: Array<{ area: string; probe: string; rationale: string }>;
}

// Normalize enum values from AI output to database-allowed values
function normalizeLearningTrajectory(value: string): 'accelerating' | 'steady' | 'declining' {
  const v = value?.toLowerCase();
  if (['accelerating', 'upward', 'improving', 'growing', 'rising'].includes(v)) return 'accelerating';
  if (['declining', 'downward', 'decreasing', 'falling'].includes(v)) return 'declining';
  return 'steady';
}

function normalizeVocabGrowth(value: string): 'rapid' | 'moderate' | 'stable' {
  const v = value?.toLowerCase();
  if (['rapid', 'fast', 'quick', 'high'].includes(v)) return 'rapid';
  if (['stable', 'slow', 'minimal', 'low'].includes(v)) return 'stable';
  return 'moderate';
}

function normalizeTopicBreadth(value: string): 'focused' | 'moderate' | 'broad' {
  const v = value?.toLowerCase();
  if (['focused', 'narrow', 'specialized', 'deep'].includes(v)) return 'focused';
  if (['broad', 'wide', 'diverse', 'varied'].includes(v)) return 'broad';
  return 'moderate';
}

function normalizeSwitchingAwareness(value: string): 'high' | 'some' | 'low' {
  const v = value?.toLowerCase();
  if (['high', 'strong', 'excellent', 'good'].includes(v)) return 'high';
  if (['low', 'poor', 'weak', 'minimal'].includes(v)) return 'low';
  return 'some';
}

function normalizeDomainExpertise(value: string): 'novice' | 'advanced_beginner' | 'competent' | 'proficient' | 'expert' {
  const v = value?.toLowerCase();
  if (['expert', 'master', 'advanced'].includes(v)) return 'expert';
  if (['proficient', 'skilled'].includes(v)) return 'proficient';
  if (['competent', 'capable', 'intermediate'].includes(v)) return 'competent';
  if (['advanced_beginner', 'beginner', 'learning'].includes(v)) return 'advanced_beginner';
  return 'novice';
}

function expandCompact(c: CompactAssessment): DecodedAssessment {
  const expanded: DecodedAssessment = {
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

  // Extended fields
  if (c.pr) {
    expanded.profile = { type: c.pr.t, description: c.pr.d };
  }
  if (c.rf) {
    expanded.red_flags = c.rf;
  }
  if (c.ip) {
    expanded.interview_probes = c.ip.map(p => ({ area: p.a, probe: p.p, rationale: p.r }));
  }

  return expanded;
}

function verifyChecksum(compact: CompactAssessment): boolean {
  try {
    const scores = [
      compact.s.o,
      compact.s.r.o, compact.s.r.d, compact.s.r.a, compact.s.r.e,
      compact.s.l.o, compact.s.l.r, compact.s.l.t, compact.s.l.q,
      compact.s.i.o, compact.s.i.c, compact.s.i.s, compact.s.i.x,
    ];
    const concat = scores.join('');
    const digitSum = concat.split('').reduce((sum, d) => sum + parseInt(d, 10), 0);
    const checkValue = digitSum * compact.s.o;
    const expectedCs = checkValue.toString(16).padStart(6, '0').slice(0, 6);
    return compact.cs === expectedCs;
  } catch {
    return false;
  }
}

function decodeCredential(encodedText: string): DecodedAssessment {
  let base64 = '';

  // Try CRX1: format
  const crxMatch = encodedText.match(/CRX1:([A-Za-z0-9+/=]+)/);
  if (crxMatch) {
    base64 = crxMatch[1];
  } else {
    // Fallback: any large base64 starting with eyJ
    const fallbackMatch = encodedText.match(/(eyJ[A-Za-z0-9+/=]{50,})/);
    if (fallbackMatch) {
      base64 = fallbackMatch[1];
    }
  }

  if (!base64) {
    throw new Error('Invalid format: Could not find encoded data');
  }

  base64 = base64.replace(/\s/g, '');

  try {
    const json = Buffer.from(base64, 'base64').toString('utf-8');
    console.log('[Credential] Decoded JSON preview:', json.substring(0, 200));

    let parsed;
    try {
      parsed = JSON.parse(json);
    } catch (parseErr) {
      throw new Error(`Invalid JSON: ${json.substring(0, 100)}...`);
    }

    // Check if it's compact format
    if (parsed.v && parsed.s) {
      const compact = parsed as CompactAssessment;
      if (!verifyChecksum(compact)) {
        console.warn('[Credential] Checksum mismatch - possible tampering');
      }
      return expandCompact(compact);
    }

    if (!parsed.scores && !parsed.s) {
      throw new Error('Missing scores data');
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
 * POST /api/credential/generate
 * Generate a new credential from AI assessment output
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { email, encodedData, holderName } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    let decoded: DecodedAssessment;
    try {
      decoded = decodeCredential(encodedData);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Unknown error';
      console.error('[Credential] Decode error:', errorMsg);
      return res.status(400).json({
        error: `Could not decode: ${errorMsg}. Use the credential prompt from dashboard.corrix.ai/credential`,
      });
    }

    const errors = validateAssessment(decoded);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Invalid assessment data', details: errors });
    }

    // Apply calibration
    const platform = decoded.platform_detected as Platform;
    const rawScore = decoded.scores.overall;
    const calibratedScore = await calibrateScore(rawScore, platform);
    const percentile = await calculatePercentile(calibratedScore, platform);

    // Calculate qualification rating
    const qualificationRating = calculateQualificationRating(calibratedScore);

    // Generate credential ID
    const credentialId = generateCredentialId();

    // Get profile from AI output or generate defaults
    const profileType = decoded.profile?.type || `${decoded.modes.primary.charAt(0).toUpperCase() + decoded.modes.primary.slice(1)} Collaborator`;
    const profileDescription = decoded.profile?.description || decoded.observations.mode_insight;

    // Get or generate red flags, strengths, growth areas, interview probes
    const redFlags = decoded.red_flags || identifyRedFlags(decoded.scores, {
      delegating_pct: decoded.modes.delegating_pct,
      mode_switching_awareness: decoded.modes.switching_awareness,
    });
    const strengths = identifyStrengths(decoded.scores);
    const growthAreas = identifyGrowthAreas(decoded.scores);
    const interviewProbes = decoded.interview_probes || generateInterviewProbes(
      decoded.scores,
      { primary: decoded.modes.primary, delegating_pct: decoded.modes.delegating_pct },
      redFlags
    );

    const verificationUrl = generateVerificationUrl(credentialId);

    // Insert credential
    const credentialResult = await db.query(
      `INSERT INTO credentials (
        credential_id, email, holder_name, platform_detected,
        raw_overall_score, calibrated_overall_score, calibration_version, percentile,
        conversation_count_analyzed, assessment_version, qualification_rating,
        profile_type, profile_description,
        results_overall, results_decision_quality, results_output_accuracy, results_efficiency,
        relationship_overall, relationship_appropriateness_of_reliance, relationship_trust_calibration, relationship_dialogue_quality,
        resilience_overall, resilience_cognitive_sustainability, resilience_skill_trajectory, resilience_expertise_preservation,
        mode_primary, mode_approving_pct, mode_consulting_pct, mode_supervising_pct, mode_delegating_pct, mode_switching_awareness,
        usage_peak_time, usage_weekly_hours, usage_weekly_interactions, usage_critical_engagement_rate,
        usage_learning_trajectory, usage_vocabulary_growth, usage_topic_breadth, usage_knowledge_transfer,
        obs_strengths, obs_growth_opportunities, obs_mode_insight, obs_domain_insight, obs_risk_flag,
        strengths, growth_areas, red_flags, recommendations, interview_probes,
        raw_assessment_json, team_id, verification_url
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39,
        $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51, $52
      ) RETURNING id`,
      [
        credentialId,
        email.toLowerCase().trim(),
        holderName || null,
        decoded.platform_detected,
        rawScore,
        calibratedScore,
        getCalibrationVersion(),
        percentile,
        decoded.conversation_count_analyzed,
        decoded.version,
        qualificationRating,
        profileType,
        profileDescription,
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
        normalizeSwitchingAwareness(decoded.modes.switching_awareness),
        decoded.usage.peak_time,
        decoded.usage.weekly_hours_estimate,
        decoded.usage.weekly_interactions_estimate,
        decoded.usage.critical_engagement_rate,
        normalizeLearningTrajectory(decoded.usage.learning_trajectory),
        normalizeVocabGrowth(decoded.usage.vocabulary_growth),
        normalizeTopicBreadth(decoded.usage.topic_breadth),
        decoded.usage.knowledge_transfer,
        decoded.observations.strengths,
        decoded.observations.growth_opportunities,
        decoded.observations.mode_insight,
        decoded.observations.domain_insight,
        decoded.observations.risk_flag,
        strengths,
        growthAreas,
        redFlags,
        decoded.observations.recommendations,
        JSON.stringify(interviewProbes),
        JSON.stringify(decoded),
        CREDENTIAL_TEAM_ID,
        verificationUrl,
      ]
    );

    const id = credentialResult.rows[0].id;

    // Insert domains
    if (decoded.domains && decoded.domains.length > 0) {
      for (let i = 0; i < decoded.domains.length; i++) {
        const domain = decoded.domains[i];
        await db.query(
          `INSERT INTO credential_domains (
            credential_id, domain_name, domain_pct, domain_expertise,
            domain_results, domain_relationship, domain_resilience, domain_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [id, domain.name, domain.pct, normalizeDomainExpertise(domain.expertise), domain.results, domain.relationship, domain.resilience, i + 1]
        );
      }
    }

    // Update calibration stats (async, non-blocking)
    updateCalibrationStats(platform, rawScore).catch(err => {
      console.error('[Credential] Failed to update calibration stats:', err);
    });

    res.json({
      success: true,
      credential: {
        id,
        credential_id: credentialId,
        verification_url: verificationUrl,
        qualification_rating: qualificationRating,
        calibrated_score: calibratedScore,
        raw_score: rawScore,
        percentile,
        profile_type: profileType,
        holder_name: holderName || null,
      },
    });
  } catch (error) {
    console.error('[Credential] Generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Server error', details: errorMessage });
  }
});

/**
 * GET /api/credential/verify/:credentialId
 * Public endpoint for credential verification
 */
router.get('/verify/:credentialId', async (req: Request, res: Response) => {
  try {
    const { credentialId } = req.params;

    const result = await db.query(
      `SELECT
        credential_id, holder_name, qualification_rating, calibrated_overall_score,
        results_overall, relationship_overall, resilience_overall,
        profile_type, issued_at, expires_at, is_verified
       FROM credentials
       WHERE credential_id = $1`,
      [credentialId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Credential not found', valid: false });
    }

    const credential = result.rows[0];
    const isExpired = credential.expires_at && new Date(credential.expires_at) < new Date();

    res.json({
      valid: credential.is_verified && !isExpired,
      credential_id: credential.credential_id,
      holder_name: credential.holder_name,
      qualification_rating: credential.qualification_rating,
      overall_score: credential.calibrated_overall_score,
      scores: {
        results: credential.results_overall,
        relationship: credential.relationship_overall,
        resilience: credential.resilience_overall,
      },
      profile_type: credential.profile_type,
      issued_at: credential.issued_at,
      expires_at: credential.expires_at,
      is_expired: isExpired,
    });
  } catch (error) {
    console.error('[Credential] Verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/credential/:id
 * Full credential data (for PDF generation)
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Support lookup by either UUID or credential_id
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const query = isUuid
      ? `SELECT * FROM credentials WHERE id = $1`
      : `SELECT * FROM credentials WHERE credential_id = $1`;

    const credentialResult = await db.query(query, [id]);

    if (credentialResult.rows.length === 0) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    const credential = credentialResult.rows[0];

    const domainsResult = await db.query(
      `SELECT * FROM credential_domains WHERE credential_id = $1 ORDER BY domain_order`,
      [credential.id]
    );

    res.json({
      ...credential,
      domains: domainsResult.rows,
      interview_probes: typeof credential.interview_probes === 'string'
        ? JSON.parse(credential.interview_probes)
        : credential.interview_probes,
    });
  } catch (error) {
    console.error('[Credential] Get error:', error);
    res.status(500).json({ error: 'Failed to fetch credential' });
  }
});

/**
 * GET /api/credential
 * List recent credentials (admin)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT id, credential_id, email, holder_name, qualification_rating, calibrated_overall_score,
              profile_type, platform_detected, issued_at
       FROM credentials
       WHERE team_id = $1
       ORDER BY issued_at DESC
       LIMIT 100`,
      [CREDENTIAL_TEAM_ID]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('[Credential] List error:', error);
    res.status(500).json({ error: 'Failed to fetch credentials' });
  }
});

export default router;
