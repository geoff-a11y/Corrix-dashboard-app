import crypto from 'crypto';

export type QualificationRating = 'exceptional' | 'strong' | 'qualified' | 'developing' | 'concern';

interface Scores {
  overall: number;
  results: { overall: number; decision_quality: number; output_accuracy: number; efficiency: number };
  relationship: { overall: number; appropriateness_of_reliance: number; trust_calibration: number; dialogue_quality: number };
  resilience: { overall: number; cognitive_sustainability: number; skill_trajectory: number; expertise_preservation: number };
}

/**
 * Generate unique credential ID in format CRX-YYYY-MM-DD-XXXX
 */
export function generateCredentialId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  // Generate 4 random alphanumeric characters (uppercase)
  const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase();

  return `CRX-${year}-${month}-${day}-${randomPart}`;
}

/**
 * Calculate qualification rating based on calibrated overall score
 */
export function calculateQualificationRating(calibratedScore: number): QualificationRating {
  if (calibratedScore >= 85) return 'exceptional';
  if (calibratedScore >= 70) return 'strong';
  if (calibratedScore >= 55) return 'qualified';
  if (calibratedScore >= 40) return 'developing';
  return 'concern';
}

/**
 * Get rating badge color for display
 */
export function getRatingColor(rating: QualificationRating): string {
  switch (rating) {
    case 'exceptional': return '#22C55E'; // Green
    case 'strong': return '#3B82F6'; // Blue
    case 'qualified': return '#7877DF'; // Corrix Purple
    case 'developing': return '#F59E0B'; // Amber
    case 'concern': return '#EF4444'; // Red
  }
}

/**
 * Get rating description for display
 */
export function getRatingDescription(rating: QualificationRating): string {
  switch (rating) {
    case 'exceptional':
      return 'Ready for AI-leadership roles requiring sophisticated human-AI collaboration';
    case 'strong':
      return 'Ready for AI-intensive roles with minimal supervision';
    case 'qualified':
      return 'Meets baseline requirements for effective AI collaboration';
    case 'developing':
      return 'Shows potential with targeted development areas';
    case 'concern':
      return 'Significant development needed before AI-intensive work';
  }
}

/**
 * Identify potential red flags from assessment data
 */
export function identifyRedFlags(scores: Scores, modes: { delegating_pct: number; mode_switching_awareness?: string }): string[] {
  const redFlags: string[] = [];

  // Low resilience with high delegation is concerning
  if (scores.resilience.overall < 50 && modes.delegating_pct > 40) {
    redFlags.push('High AI delegation with low skill preservation - risk of deskilling');
  }

  // Poor trust calibration suggests over or under-reliance
  if (scores.relationship.trust_calibration < 40) {
    redFlags.push('Trust calibration concerns - may over or under-rely on AI');
  }

  // Low cognitive sustainability is a warning sign
  if (scores.resilience.cognitive_sustainability < 45) {
    redFlags.push('Cognitive sustainability concerns - may be offloading too much thinking');
  }

  // Very low decision quality despite AI use
  if (scores.results.decision_quality < 40) {
    redFlags.push('Decision quality issues even with AI assistance');
  }

  // Poor dialogue quality limits AI effectiveness
  if (scores.relationship.dialogue_quality < 40) {
    redFlags.push('Communication with AI needs significant improvement');
  }

  // Low switching awareness with mixed modes
  if (modes.mode_switching_awareness === 'low' && modes.delegating_pct > 20) {
    redFlags.push('Low awareness of when to switch collaboration modes');
  }

  // Expertise preservation critically low
  if (scores.resilience.expertise_preservation < 40) {
    redFlags.push('Risk of expertise erosion through AI over-reliance');
  }

  return redFlags;
}

/**
 * Generate key strengths from assessment data
 */
export function identifyStrengths(scores: Scores): string[] {
  const strengths: string[] = [];

  if (scores.results.decision_quality >= 80) {
    strengths.push('Excellent decision quality enhanced by AI collaboration');
  }
  if (scores.relationship.dialogue_quality >= 80) {
    strengths.push('Strong prompting and iteration skills');
  }
  if (scores.resilience.skill_trajectory >= 80) {
    strengths.push('Continuous skill development through AI interaction');
  }
  if (scores.relationship.trust_calibration >= 80) {
    strengths.push('Well-calibrated trust in AI capabilities');
  }
  if (scores.resilience.cognitive_sustainability >= 80) {
    strengths.push('Maintains independent thinking while leveraging AI');
  }
  if (scores.results.efficiency >= 80) {
    strengths.push('Highly efficient AI collaboration');
  }
  if (scores.resilience.expertise_preservation >= 80) {
    strengths.push('Successfully preserving and growing expertise');
  }

  // If we don't have many high scores, look for relative strengths
  if (strengths.length < 2) {
    const allScores = [
      { name: 'Decision making with AI', score: scores.results.decision_quality },
      { name: 'Output accuracy', score: scores.results.output_accuracy },
      { name: 'Collaboration efficiency', score: scores.results.efficiency },
      { name: 'Appropriate reliance', score: scores.relationship.appropriateness_of_reliance },
      { name: 'Trust calibration', score: scores.relationship.trust_calibration },
      { name: 'Dialogue quality', score: scores.relationship.dialogue_quality },
      { name: 'Cognitive sustainability', score: scores.resilience.cognitive_sustainability },
      { name: 'Skill trajectory', score: scores.resilience.skill_trajectory },
      { name: 'Expertise preservation', score: scores.resilience.expertise_preservation },
    ];

    allScores.sort((a, b) => b.score - a.score);
    for (const item of allScores.slice(0, 3)) {
      if (item.score >= 60 && strengths.length < 3) {
        strengths.push(`Solid ${item.name.toLowerCase()}`);
      }
    }
  }

  return strengths.slice(0, 5); // Max 5 strengths
}

/**
 * Generate growth areas from assessment data
 */
export function identifyGrowthAreas(scores: Scores): string[] {
  const areas: string[] = [];

  if (scores.results.decision_quality < 60) {
    areas.push('Improve decision-making processes when using AI');
  }
  if (scores.relationship.dialogue_quality < 60) {
    areas.push('Develop more effective prompting techniques');
  }
  if (scores.resilience.cognitive_sustainability < 60) {
    areas.push('Maintain more independent critical thinking');
  }
  if (scores.relationship.trust_calibration < 60) {
    areas.push('Better calibrate trust in AI outputs');
  }
  if (scores.resilience.expertise_preservation < 60) {
    areas.push('Focus on preserving and building domain expertise');
  }
  if (scores.results.efficiency < 60) {
    areas.push('Improve efficiency of AI collaboration');
  }

  return areas.slice(0, 4); // Max 4 growth areas
}

/**
 * Generate interview probes based on assessment patterns
 */
export function generateInterviewProbes(
  scores: Scores,
  modes: { primary: string; delegating_pct: number },
  redFlags: string[]
): Array<{ area: string; probe: string; rationale: string }> {
  const probes: Array<{ area: string; probe: string; rationale: string }> = [];

  // Always include mode-based probe
  probes.push({
    area: 'Collaboration Mode',
    probe: `Your primary mode is "${modes.primary}". Walk me through a recent project where you chose a different mode. What drove that decision?`,
    rationale: 'Assesses mode-switching awareness and intentionality',
  });

  // Add probes based on potential concerns
  if (scores.resilience.cognitive_sustainability < 65) {
    probes.push({
      area: 'Independent Thinking',
      probe: 'Describe a time when you disagreed with AI output. How did you evaluate it and what did you do?',
      rationale: 'Explores critical evaluation of AI outputs',
    });
  }

  if (scores.relationship.trust_calibration < 65) {
    probes.push({
      area: 'Trust Calibration',
      probe: 'How do you decide when to trust AI output versus when to verify or seek other sources?',
      rationale: 'Assesses meta-awareness of trust decisions',
    });
  }

  if (modes.delegating_pct > 30) {
    probes.push({
      area: 'Delegation Boundaries',
      probe: 'What types of tasks do you never delegate to AI, even when you could? Why?',
      rationale: 'Explores intentional boundaries in AI delegation',
    });
  }

  if (scores.results.decision_quality < 70) {
    probes.push({
      area: 'Decision Quality',
      probe: 'Tell me about a decision you made with AI assistance that turned out poorly. What would you do differently?',
      rationale: 'Assesses learning from AI-assisted mistakes',
    });
  }

  if (redFlags.length > 0) {
    probes.push({
      area: 'Risk Awareness',
      probe: 'What do you see as the biggest risks of relying too heavily on AI in your work?',
      rationale: 'Explores self-awareness of potential over-reliance',
    });
  }

  if (scores.resilience.expertise_preservation < 65) {
    probes.push({
      area: 'Expertise Development',
      probe: 'How do you ensure you continue building expertise in your field despite AI assistance?',
      rationale: 'Assesses intentional skill preservation strategies',
    });
  }

  return probes.slice(0, 6); // Max 6 probes
}

/**
 * Generate verification URL for credential
 */
export function generateVerificationUrl(credentialId: string): string {
  const baseUrl = process.env.FRONTEND_URL || 'https://dashboard.corrix.ai';
  return `${baseUrl}/verify/${credentialId}`;
}
