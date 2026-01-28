// Compact format from AI (abbreviated keys)
export interface CompactAssessment {
  v: string;
  ts: string;
  p: 'chatgpt' | 'claude' | 'gemini' | 'unknown';
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
  u: {
    pt: string;
    wh: number;
    wi: number;
    ce: number;
    lt: string;
    vg: string;
    tb: string;
    kt: number;
  };
  ob: {
    st: string;
    go: string;
    mi: string;
    di: string;
    rf: string;
    rc: [string, string, string];
  };
}

// Expanded format for display (full keys)
export interface DecodedAssessment {
  version: string;
  generated_at: string;
  platform_detected: 'chatgpt' | 'claude' | 'gemini' | 'unknown';
  conversation_count_analyzed: number;
  scores: {
    overall: number;
    results: {
      overall: number;
      decision_quality: number;
      output_accuracy: number;
      efficiency: number;
    };
    relationship: {
      overall: number;
      appropriateness_of_reliance: number;
      trust_calibration: number;
      dialogue_quality: number;
    };
    resilience: {
      overall: number;
      cognitive_sustainability: number;
      skill_trajectory: number;
      expertise_preservation: number;
    };
  };
  modes: {
    primary: 'approving' | 'consulting' | 'supervising' | 'delegating';
    approving_pct: number;
    consulting_pct: number;
    supervising_pct: number;
    delegating_pct: number;
    switching_awareness: 'high' | 'some' | 'low';
  };
  domains: Array<{
    name: string;
    pct: number;
    expertise: 'novice' | 'advanced_beginner' | 'competent' | 'proficient' | 'expert';
    results: number;
    relationship: number;
    resilience: number;
  }>;
  usage: {
    peak_time: 'morning' | 'afternoon' | 'evening';
    weekly_hours_estimate: number;
    weekly_interactions_estimate: number;
    critical_engagement_rate: number;
    learning_trajectory: 'accelerating' | 'steady' | 'declining';
    vocabulary_growth: 'rapid' | 'moderate' | 'stable';
    topic_breadth: 'focused' | 'moderate' | 'broad';
    knowledge_transfer: number;
  };
  observations: {
    strengths: string;
    growth_opportunities: string;
    mode_insight: string;
    domain_insight: string;
    risk_flag: string;
    recommendations: [string, string, string];
  };
}

export interface BaselineSubmissionResponse {
  success: boolean;
  assessment: DecodedAssessment & { id: string };
}

// Convert compact to expanded format
export function expandAssessment(compact: CompactAssessment): DecodedAssessment {
  return {
    version: compact.v,
    generated_at: compact.ts,
    platform_detected: compact.p,
    conversation_count_analyzed: compact.n,
    scores: {
      overall: compact.s.o,
      results: {
        overall: compact.s.r.o,
        decision_quality: compact.s.r.d,
        output_accuracy: compact.s.r.a,
        efficiency: compact.s.r.e,
      },
      relationship: {
        overall: compact.s.l.o,
        appropriateness_of_reliance: compact.s.l.r,
        trust_calibration: compact.s.l.t,
        dialogue_quality: compact.s.l.q,
      },
      resilience: {
        overall: compact.s.i.o,
        cognitive_sustainability: compact.s.i.c,
        skill_trajectory: compact.s.i.s,
        expertise_preservation: compact.s.i.x,
      },
    },
    modes: {
      primary: compact.m.p as DecodedAssessment['modes']['primary'],
      approving_pct: compact.m.a,
      consulting_pct: compact.m.c,
      supervising_pct: compact.m.s,
      delegating_pct: compact.m.d,
      switching_awareness: compact.m.w as DecodedAssessment['modes']['switching_awareness'],
    },
    domains: compact.do.map((d) => ({
      name: d.n,
      pct: d.pct,
      expertise: d.x as DecodedAssessment['domains'][0]['expertise'],
      results: d.r,
      relationship: d.l,
      resilience: d.i,
    })),
    usage: {
      peak_time: compact.u.pt as DecodedAssessment['usage']['peak_time'],
      weekly_hours_estimate: compact.u.wh,
      weekly_interactions_estimate: compact.u.wi,
      critical_engagement_rate: compact.u.ce,
      learning_trajectory: compact.u.lt as DecodedAssessment['usage']['learning_trajectory'],
      vocabulary_growth: compact.u.vg as DecodedAssessment['usage']['vocabulary_growth'],
      topic_breadth: compact.u.tb as DecodedAssessment['usage']['topic_breadth'],
      knowledge_transfer: compact.u.kt,
    },
    observations: {
      strengths: compact.ob.st,
      growth_opportunities: compact.ob.go,
      mode_insight: compact.ob.mi,
      domain_insight: compact.ob.di,
      risk_flag: compact.ob.rf,
      recommendations: compact.ob.rc,
    },
  };
}
