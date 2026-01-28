import { Document, Page, View, Text } from '@react-pdf/renderer';
import { registerFonts } from './pdf-fonts';

// Register fonts when this module is loaded
registerFonts();
import { styles, colors, getRatingColor } from './pdf-styles';
import { PDFHeader } from './PDFHeader';
import { PDFFooter } from './PDFFooter';
import {
  ScoreCircle,
  ScoreBar,
  RatingBadge,
  ModeDistribution,
  BulletList,
  NumberedList,
  DomainCard,
  SectionTitle,
  StatsGrid,
} from './PDFComponents';
import type { Credential } from '@/types/credential';

interface FullReportPDFProps {
  credential: Credential;
}

const TOTAL_PAGES = 8;

// Page 1: Summary
function SummaryPage({ credential }: { credential: Credential }) {
  const ratingDescriptions: Record<string, string> = {
    exceptional: 'Ready for AI-leadership roles requiring sophisticated human-AI collaboration',
    strong: 'Ready for AI-intensive roles with minimal supervision',
    qualified: 'Meets baseline requirements for effective AI collaboration',
    developing: 'Shows potential with targeted development areas',
    concern: 'Significant development needed before AI-intensive work',
  };

  return (
    <Page size="A4" style={styles.page}>
      <PDFHeader
        credentialId={credential.credential_id}
        pageNumber={1}
        totalPages={TOTAL_PAGES}
      />

      {/* Title */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <Text style={styles.h1}>AI Collaboration Credential</Text>
        {credential.holder_name && (
          <Text style={[styles.body, { fontSize: 14, marginTop: 4 }]}>
            {credential.holder_name}
          </Text>
        )}
      </View>

      {/* Rating Badge */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <RatingBadge rating={credential.qualification_rating} />
        <Text style={[styles.bodySmall, { marginTop: 8, textAlign: 'center', maxWidth: 300 }]}>
          {ratingDescriptions[credential.qualification_rating]}
        </Text>
      </View>

      {/* Overall Score */}
      <View style={[styles.card, { alignItems: 'center', marginBottom: 24 }]}>
        <View style={[styles.row, styles.gap16, { alignItems: 'center' }]}>
          <ScoreCircle score={credential.calibrated_overall_score} label="Overall Score" size="large" />
          <View style={[styles.column, styles.gap8]}>
            <ScoreCircle score={credential.results_overall} label="Results" />
            <ScoreCircle score={credential.relationship_overall} label="Relationship" />
            <ScoreCircle score={credential.resilience_overall} label="Resilience" />
          </View>
        </View>
      </View>

      {/* Profile Type */}
      <View style={[styles.card, styles.mb24]}>
        <Text style={styles.label}>Profile Type</Text>
        <Text style={[styles.h3, { marginBottom: 4 }]}>{credential.profile_type}</Text>
        {credential.profile_description && (
          <Text style={styles.body}>{credential.profile_description}</Text>
        )}
      </View>

      {/* Key Findings Grid */}
      <View style={styles.grid2}>
        <View style={[styles.cardSmall, { backgroundColor: '#065F46' }]}>
          <Text style={styles.label}>Top Strength</Text>
          <Text style={[styles.body, { marginTop: 4 }]}>
            {credential.strengths?.[0] || credential.obs_strengths}
          </Text>
        </View>
        <View style={[styles.cardSmall, { backgroundColor: '#78350F' }]}>
          <Text style={styles.label}>Growth Focus</Text>
          <Text style={[styles.body, { marginTop: 4 }]}>
            {credential.growth_areas?.[0] || credential.obs_growth_opportunities}
          </Text>
        </View>
      </View>

      <PDFFooter verificationUrl={credential.verification_url} />
    </Page>
  );
}

// Page 2: How to Use This Credential
function HowToUsePage({ credential }: { credential: Credential }) {
  return (
    <Page size="A4" style={styles.page}>
      <PDFHeader
        credentialId={credential.credential_id}
        pageNumber={2}
        totalPages={TOTAL_PAGES}
      />

      <SectionTitle
        title="How to Use This Credential"
        subtitle="Understanding your AI collaboration assessment"
      />

      <View style={[styles.card, styles.mb16]}>
        <Text style={[styles.h3, { marginBottom: 8 }]}>The Three Rs Methodology</Text>
        <Text style={[styles.body, styles.mb12]}>
          The Corrix assessment measures AI collaboration effectiveness across three dimensions:
        </Text>

        <View style={styles.mb12}>
          <Text style={[styles.body, { fontWeight: 600, color: colors.primary }]}>
            Results (30%)
          </Text>
          <Text style={styles.bodySmall}>
            Measures whether AI collaboration produces better work outcomes, including decision quality, output accuracy, and efficiency.
          </Text>
        </View>

        <View style={styles.mb12}>
          <Text style={[styles.body, { fontWeight: 600, color: colors.primary }]}>
            Relationship (40%)
          </Text>
          <Text style={styles.bodySmall}>
            Evaluates the health of human-AI collaboration patterns, including appropriate reliance, trust calibration, and dialogue quality.
          </Text>
        </View>

        <View>
          <Text style={[styles.body, { fontWeight: 600, color: colors.primary }]}>
            Resilience (30%)
          </Text>
          <Text style={styles.bodySmall}>
            Assesses long-term sustainability, including cognitive sustainability, skill trajectory, and expertise preservation.
          </Text>
        </View>
      </View>

      <View style={[styles.card, styles.mb16]}>
        <Text style={[styles.h3, { marginBottom: 8 }]}>Qualification Ratings</Text>
        <View style={styles.gap8}>
          {[
            { rating: 'exceptional', range: '85-100', desc: 'AI-leadership ready' },
            { rating: 'strong', range: '70-84', desc: 'AI-intensive roles' },
            { rating: 'qualified', range: '55-69', desc: 'Baseline competency' },
            { rating: 'developing', range: '40-54', desc: 'Growth needed' },
            { rating: 'concern', range: '0-39', desc: 'Significant development required' },
          ].map((item) => (
            <View key={item.rating} style={[styles.row, styles.gap8, { alignItems: 'center' }]}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  backgroundColor: getRatingColor(item.rating),
                }}
              />
              <Text style={[styles.body, { width: 80 }]}>
                {item.rating.charAt(0).toUpperCase() + item.rating.slice(1)}
              </Text>
              <Text style={styles.bodySmall}>{item.range} - {item.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={[styles.h3, { marginBottom: 8 }]}>Sharing Your Credential</Text>
        <Text style={styles.body}>
          Your credential includes a unique verification URL that employers or colleagues can use to confirm its authenticity. The verification page shows your rating, overall score, and issue date without revealing detailed breakdowns.
        </Text>
      </View>

      <PDFFooter verificationUrl={credential.verification_url} />
    </Page>
  );
}

// Page 3: Results Deep Dive
function ResultsDeepDivePage({ credential }: { credential: Credential }) {
  return (
    <Page size="A4" style={styles.page}>
      <PDFHeader
        credentialId={credential.credential_id}
        pageNumber={3}
        totalPages={TOTAL_PAGES}
      />

      <SectionTitle
        title="Results Dimension"
        subtitle="Is AI making your work better?"
      />

      <View style={[styles.row, styles.gap16, styles.mb24]}>
        <View style={{ alignItems: 'center' }}>
          <ScoreCircle score={credential.results_overall} label="Results Overall" size="large" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.body, { marginBottom: 12 }]}>
            The Results dimension measures whether your AI collaboration actually improves work outcomes. High scores indicate effective use of AI to enhance decision-making, accuracy, and efficiency.
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <ScoreBar
          label="Decision Quality"
          score={credential.results_decision_quality}
          description="Are you making better decisions when collaborating with AI?"
        />
        <View style={styles.mb8} />
        <ScoreBar
          label="Output Accuracy"
          score={credential.results_output_accuracy}
          description="Is the work produced with AI assistance accurate and reliable?"
        />
        <View style={styles.mb8} />
        <ScoreBar
          label="Efficiency"
          score={credential.results_efficiency}
          description="Is the effort invested proportional to the value delivered?"
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.card}>
        <Text style={[styles.h3, { marginBottom: 8 }]}>What This Means</Text>
        {credential.results_overall >= 70 ? (
          <Text style={styles.body}>
            Your Results score indicates strong effectiveness in leveraging AI to improve work outcomes. You demonstrate good judgment in using AI assistance to enhance decision quality while maintaining accuracy.
          </Text>
        ) : credential.results_overall >= 55 ? (
          <Text style={styles.body}>
            Your Results score shows baseline competency in using AI for work outcomes. There may be opportunities to better leverage AI for decision support or to improve accuracy verification processes.
          </Text>
        ) : (
          <Text style={styles.body}>
            Your Results score suggests opportunities to improve how you use AI to enhance work outcomes. Consider focusing on when and how to incorporate AI assistance into your decision-making process.
          </Text>
        )}
      </View>

      <PDFFooter verificationUrl={credential.verification_url} />
    </Page>
  );
}

// Page 4: Relationship Deep Dive
function RelationshipDeepDivePage({ credential }: { credential: Credential }) {
  return (
    <Page size="A4" style={styles.page}>
      <PDFHeader
        credentialId={credential.credential_id}
        pageNumber={4}
        totalPages={TOTAL_PAGES}
      />

      <SectionTitle
        title="Relationship Dimension"
        subtitle="Is your collaboration with AI healthy?"
      />

      <View style={[styles.row, styles.gap16, styles.mb24]}>
        <View style={{ alignItems: 'center' }}>
          <ScoreCircle score={credential.relationship_overall} label="Relationship Overall" size="large" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.body, { marginBottom: 12 }]}>
            The Relationship dimension evaluates the health and effectiveness of your human-AI collaboration patterns. This includes how appropriately you rely on AI, how well-calibrated your trust is, and the quality of your interactions.
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <ScoreBar
          label="Appropriateness of Reliance"
          score={credential.relationship_appropriateness_of_reliance}
          description="Are you relying on AI the right amount - not too much, not too little?"
        />
        <View style={styles.mb8} />
        <ScoreBar
          label="Trust Calibration"
          score={credential.relationship_trust_calibration}
          description="Is your trust in AI outputs well-matched to actual AI capabilities?"
        />
        <View style={styles.mb8} />
        <ScoreBar
          label="Dialogue Quality"
          score={credential.relationship_dialogue_quality}
          description="Are your prompts clear and your iterations constructive?"
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.card}>
        <Text style={[styles.h3, { marginBottom: 8 }]}>What This Means</Text>
        {credential.relationship_overall >= 70 ? (
          <Text style={styles.body}>
            Your Relationship score indicates healthy AI collaboration patterns. You demonstrate appropriate reliance on AI, well-calibrated trust, and effective communication in your interactions.
          </Text>
        ) : credential.relationship_overall >= 55 ? (
          <Text style={styles.body}>
            Your Relationship score shows developing collaboration patterns. Consider whether you're finding the right balance of AI reliance and whether your prompting strategies could be more effective.
          </Text>
        ) : (
          <Text style={styles.body}>
            Your Relationship score suggests potential over or under-reliance on AI. Focus on developing better trust calibration and improving the clarity of your AI interactions.
          </Text>
        )}
      </View>

      <PDFFooter verificationUrl={credential.verification_url} />
    </Page>
  );
}

// Page 5: Resilience Deep Dive
function ResilienceDeepDivePage({ credential }: { credential: Credential }) {
  return (
    <Page size="A4" style={styles.page}>
      <PDFHeader
        credentialId={credential.credential_id}
        pageNumber={5}
        totalPages={TOTAL_PAGES}
      />

      <SectionTitle
        title="Resilience Dimension"
        subtitle="Can your collaboration patterns be sustained?"
      />

      <View style={[styles.row, styles.gap16, styles.mb24]}>
        <View style={{ alignItems: 'center' }}>
          <ScoreCircle score={credential.resilience_overall} label="Resilience Overall" size="large" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.body, { marginBottom: 12 }]}>
            The Resilience dimension assesses whether your AI collaboration patterns are sustainable long-term. This includes maintaining independent thinking, continuing to develop skills, and preserving your expertise.
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <ScoreBar
          label="Cognitive Sustainability"
          score={credential.resilience_cognitive_sustainability}
          description="Are you maintaining sustainable thinking patterns while using AI?"
        />
        <View style={styles.mb8} />
        <ScoreBar
          label="Skill Trajectory"
          score={credential.resilience_skill_trajectory}
          description="Are you continuing to learn and develop through AI collaboration?"
        />
        <View style={styles.mb8} />
        <ScoreBar
          label="Expertise Preservation"
          score={credential.resilience_expertise_preservation}
          description="Are you maintaining and growing your domain expertise?"
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.card}>
        <Text style={[styles.h3, { marginBottom: 8 }]}>What This Means</Text>
        {credential.resilience_overall >= 70 ? (
          <Text style={styles.body}>
            Your Resilience score indicates sustainable AI collaboration patterns. You're effectively using AI while maintaining independent thinking and continuing to develop your expertise.
          </Text>
        ) : credential.resilience_overall >= 55 ? (
          <Text style={styles.body}>
            Your Resilience score shows areas to monitor. Consider whether you're balancing AI assistance with opportunities for independent thinking and skill development.
          </Text>
        ) : (
          <Text style={styles.body}>
            Your Resilience score raises concerns about long-term sustainability. Focus on maintaining critical thinking skills and ensuring AI use doesn't erode your expertise.
          </Text>
        )}
      </View>

      <PDFFooter verificationUrl={credential.verification_url} />
    </Page>
  );
}

// Page 6: Mode Profile
function ModeProfilePage({ credential }: { credential: Credential }) {
  const modeDescriptions: Record<string, string> = {
    approving: 'You primarily select from AI-generated options, using AI as a source of alternatives to evaluate.',
    consulting: 'You seek AI input and perspectives but make your own decisions, using AI as an advisor.',
    supervising: 'You let AI draft work that you then refine and improve, acting as a quality controller.',
    delegating: 'You allow AI to work autonomously on defined tasks, trusting its output with minimal oversight.',
  };

  return (
    <Page size="A4" style={styles.page}>
      <PDFHeader
        credentialId={credential.credential_id}
        pageNumber={6}
        totalPages={TOTAL_PAGES}
      />

      <SectionTitle
        title="Collaboration Mode Profile"
        subtitle="How you work with AI"
      />

      <View style={[styles.card, styles.mb24]}>
        <View style={[styles.row, styles.gap8, { alignItems: 'center', marginBottom: 12 }]}>
          <Text style={styles.label}>Primary Mode</Text>
          <View style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ fontSize: 10, color: colors.text, fontWeight: 600 }}>
              {credential.mode_primary.charAt(0).toUpperCase() + credential.mode_primary.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.body}>
          {modeDescriptions[credential.mode_primary]}
        </Text>
      </View>

      <View style={[styles.card, styles.mb24]}>
        <Text style={[styles.h3, { marginBottom: 12 }]}>Mode Distribution</Text>
        <ModeDistribution
          modes={{
            approving: credential.mode_approving_pct,
            consulting: credential.mode_consulting_pct,
            supervising: credential.mode_supervising_pct,
            delegating: credential.mode_delegating_pct,
          }}
          primary={credential.mode_primary}
        />
      </View>

      <View style={styles.card}>
        <View style={[styles.row, styles.gap8, { alignItems: 'center', marginBottom: 8 }]}>
          <Text style={styles.label}>Mode Switching Awareness</Text>
          <View style={{ backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
            <Text style={{ fontSize: 9, color: colors.textSecondary }}>
              {credential.mode_switching_awareness.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.body}>
          {credential.obs_mode_insight}
        </Text>
      </View>

      <PDFFooter verificationUrl={credential.verification_url} />
    </Page>
  );
}

// Page 7: Domain Analysis
function DomainAnalysisPage({ credential }: { credential: Credential }) {
  return (
    <Page size="A4" style={styles.page}>
      <PDFHeader
        credentialId={credential.credential_id}
        pageNumber={7}
        totalPages={TOTAL_PAGES}
      />

      <SectionTitle
        title="Domain Analysis"
        subtitle="Performance across your areas of focus"
      />

      <View style={[styles.column, styles.gap12, styles.mb24]}>
        {credential.domains.map((domain, index) => (
          <DomainCard
            key={index}
            name={domain.domain_name}
            percentage={domain.domain_pct}
            expertise={domain.domain_expertise}
            results={domain.domain_results}
            relationship={domain.domain_relationship}
            resilience={domain.domain_resilience}
          />
        ))}
      </View>

      <View style={styles.card}>
        <Text style={[styles.h3, { marginBottom: 8 }]}>Domain Insights</Text>
        <Text style={styles.body}>
          {credential.obs_domain_insight}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.card}>
        <Text style={[styles.h3, { marginBottom: 8 }]}>Usage Patterns</Text>
        <StatsGrid
          stats={[
            { value: credential.usage_weekly_hours, label: 'Hours/Week' },
            { value: credential.usage_weekly_interactions, label: 'Interactions/Week' },
            { value: credential.usage_peak_time, label: 'Peak Time' },
            { value: `${credential.usage_critical_engagement_rate}%`, label: 'Critical Engagement' },
          ]}
        />
      </View>

      <PDFFooter verificationUrl={credential.verification_url} />
    </Page>
  );
}

// Page 8: Behavioral Highlights & Recommendations
function BehavioralHighlightsPage({ credential }: { credential: Credential }) {
  return (
    <Page size="A4" style={styles.page}>
      <PDFHeader
        credentialId={credential.credential_id}
        pageNumber={8}
        totalPages={TOTAL_PAGES}
      />

      <SectionTitle
        title="Behavioral Highlights"
        subtitle="Key patterns and recommendations"
      />

      {/* Strengths */}
      <View style={[styles.card, styles.mb16, { backgroundColor: '#065F46' }]}>
        <Text style={[styles.h3, { marginBottom: 8 }]}>Strengths</Text>
        <BulletList items={credential.strengths?.length > 0 ? credential.strengths : [credential.obs_strengths]} color="#22C55E" />
      </View>

      {/* Growth Areas */}
      <View style={[styles.card, styles.mb16, { backgroundColor: '#78350F' }]}>
        <Text style={[styles.h3, { marginBottom: 8 }]}>Growth Areas</Text>
        <BulletList items={credential.growth_areas?.length > 0 ? credential.growth_areas : [credential.obs_growth_opportunities]} color="#F59E0B" />
      </View>

      {/* Red Flags */}
      {credential.red_flags && credential.red_flags.length > 0 && (
        <View style={[styles.card, styles.mb16, { backgroundColor: '#7F1D1D' }]}>
          <Text style={[styles.h3, { marginBottom: 8 }]}>Areas of Concern</Text>
          <BulletList items={credential.red_flags} color="#EF4444" />
        </View>
      )}

      {/* Recommendations */}
      <View style={[styles.card, { backgroundColor: '#312E81' }]}>
        <Text style={[styles.h3, { marginBottom: 8 }]}>Recommendations</Text>
        <NumberedList items={credential.recommendations || []} />
      </View>

      <PDFFooter verificationUrl={credential.verification_url} />
    </Page>
  );
}

// Main Full Report Document
export function FullReportPDF({ credential }: FullReportPDFProps) {
  return (
    <Document
      title={`Corrix Credential - ${credential.credential_id}`}
      author="Corrix by Human Machines"
      subject="AI Collaboration Credential"
    >
      <SummaryPage credential={credential} />
      <HowToUsePage credential={credential} />
      <ResultsDeepDivePage credential={credential} />
      <RelationshipDeepDivePage credential={credential} />
      <ResilienceDeepDivePage credential={credential} />
      <ModeProfilePage credential={credential} />
      <DomainAnalysisPage credential={credential} />
      <BehavioralHighlightsPage credential={credential} />
    </Document>
  );
}

export default FullReportPDF;
