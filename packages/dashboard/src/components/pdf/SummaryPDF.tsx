import { Document, Page, View, Text } from '@react-pdf/renderer';
import { registerFonts } from './pdf-fonts';

// Register fonts when this module is loaded
registerFonts();
import { styles, colors } from './pdf-styles';
import { PDFHeader } from './PDFHeader';
import { PDFFooter } from './PDFFooter';
import {
  ScoreCircle,
  ScoreBar,
  RatingBadge,
  ModeDistribution,
  DomainCard,
  InterviewProbe,
  SectionTitle,
} from './PDFComponents';
import type { Credential } from '@/types/credential';

interface SummaryPDFProps {
  credential: Credential;
}

const TOTAL_PAGES = 4;

// Page 1: Summary (same as full report)
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
        <Text style={[styles.bodySmall, { marginTop: 4 }]}>Summary Report</Text>
        {credential.holder_name && (
          <Text style={[styles.body, { fontSize: 14, marginTop: 8 }]}>
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

      {/* Key Findings */}
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

// Page 2: Dimension Overview with Interview Probes
function DimensionOverviewPage({ credential }: { credential: Credential }) {
  return (
    <Page size="A4" style={styles.page}>
      <PDFHeader
        credentialId={credential.credential_id}
        pageNumber={2}
        totalPages={TOTAL_PAGES}
      />

      <SectionTitle
        title="Dimension Overview"
        subtitle="The Three Rs of AI collaboration"
      />

      {/* Three Rs Summary */}
      <View style={styles.grid3}>
        <View style={styles.cardSmall}>
          <Text style={[styles.label, { marginBottom: 8 }]}>Results</Text>
          <ScoreBar label="Decision Quality" score={credential.results_decision_quality} />
          <ScoreBar label="Output Accuracy" score={credential.results_output_accuracy} />
          <ScoreBar label="Efficiency" score={credential.results_efficiency} />
        </View>
        <View style={styles.cardSmall}>
          <Text style={[styles.label, { marginBottom: 8 }]}>Relationship</Text>
          <ScoreBar label="Reliance" score={credential.relationship_appropriateness_of_reliance} />
          <ScoreBar label="Trust" score={credential.relationship_trust_calibration} />
          <ScoreBar label="Dialogue" score={credential.relationship_dialogue_quality} />
        </View>
        <View style={styles.cardSmall}>
          <Text style={[styles.label, { marginBottom: 8 }]}>Resilience</Text>
          <ScoreBar label="Cognitive" score={credential.resilience_cognitive_sustainability} />
          <ScoreBar label="Skills" score={credential.resilience_skill_trajectory} />
          <ScoreBar label="Expertise" score={credential.resilience_expertise_preservation} />
        </View>
      </View>

      <View style={styles.divider} />

      {/* Interview Probes */}
      <SectionTitle
        title="Interview Probes"
        subtitle="Questions for hiring managers"
      />

      <View style={styles.column}>
        {(credential.interview_probes || []).slice(0, 3).map((probe, index) => (
          <InterviewProbe
            key={index}
            area={probe.area}
            probe={probe.probe}
            rationale={probe.rationale}
          />
        ))}
      </View>

      <PDFFooter verificationUrl={credential.verification_url} />
    </Page>
  );
}

// Page 3: Domain Analysis (Condensed)
function DomainAnalysisPage({ credential }: { credential: Credential }) {
  return (
    <Page size="A4" style={styles.page}>
      <PDFHeader
        credentialId={credential.credential_id}
        pageNumber={3}
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

      <View style={styles.divider} />

      {/* Mode Distribution */}
      <SectionTitle
        title="Collaboration Mode"
        subtitle="How you work with AI"
      />

      <View style={styles.card}>
        <View style={[styles.row, styles.gap8, { alignItems: 'center', marginBottom: 12 }]}>
          <Text style={styles.label}>Primary Mode</Text>
          <View style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ fontSize: 10, color: colors.text, fontWeight: 600 }}>
              {credential.mode_primary.charAt(0).toUpperCase() + credential.mode_primary.slice(1)}
            </Text>
          </View>
        </View>
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

      <PDFFooter verificationUrl={credential.verification_url} />
    </Page>
  );
}

// Page 4: Methodology
function MethodologyPage({ credential }: { credential: Credential }) {
  return (
    <Page size="A4" style={styles.page}>
      <PDFHeader
        credentialId={credential.credential_id}
        pageNumber={4}
        totalPages={TOTAL_PAGES}
      />

      <SectionTitle
        title="Methodology"
        subtitle="About the Corrix Assessment"
      />

      <View style={[styles.card, styles.mb16]}>
        <Text style={[styles.h3, { marginBottom: 8 }]}>The Three Rs Framework</Text>
        <Text style={[styles.body, styles.mb8]}>
          The Corrix assessment uses the Three Rs methodology to evaluate AI collaboration effectiveness:
        </Text>

        <View style={styles.mb8}>
          <Text style={[styles.body, { fontWeight: 600 }]}>Results (30% weight)</Text>
          <Text style={styles.bodySmall}>
            Measures whether AI collaboration produces better work outcomes through improved decisions, accuracy, and efficiency.
          </Text>
        </View>

        <View style={styles.mb8}>
          <Text style={[styles.body, { fontWeight: 600 }]}>Relationship (40% weight)</Text>
          <Text style={styles.bodySmall}>
            Evaluates the health of human-AI collaboration patterns including appropriate reliance and trust calibration.
          </Text>
        </View>

        <View>
          <Text style={[styles.body, { fontWeight: 600 }]}>Resilience (30% weight)</Text>
          <Text style={styles.bodySmall}>
            Assesses long-term sustainability of AI collaboration including skill development and expertise preservation.
          </Text>
        </View>
      </View>

      <View style={[styles.card, styles.mb16]}>
        <Text style={[styles.h3, { marginBottom: 8 }]}>Collaboration Modes</Text>
        <Text style={styles.body}>
          The assessment identifies four primary collaboration modes that reflect how you interact with AI:
        </Text>
        <View style={[styles.column, styles.gap4, { marginTop: 8 }]}>
          <Text style={styles.bodySmall}>• <Text style={{ fontWeight: 600 }}>Approving:</Text> Selecting from AI-generated options</Text>
          <Text style={styles.bodySmall}>• <Text style={{ fontWeight: 600 }}>Consulting:</Text> Seeking AI input while making own decisions</Text>
          <Text style={styles.bodySmall}>• <Text style={{ fontWeight: 600 }}>Supervising:</Text> AI drafts, you refine and improve</Text>
          <Text style={styles.bodySmall}>• <Text style={{ fontWeight: 600 }}>Delegating:</Text> AI works autonomously on tasks</Text>
        </View>
      </View>

      <View style={[styles.card, styles.mb16]}>
        <Text style={[styles.h3, { marginBottom: 8 }]}>Cross-Platform Calibration</Text>
        <Text style={styles.body}>
          Scores are calibrated across AI platforms (ChatGPT, Claude, Gemini) to ensure fair comparison. Your calibrated score accounts for platform-specific scoring tendencies.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={[styles.h3, { marginBottom: 8 }]}>Verification</Text>
        <Text style={styles.body}>
          This credential can be verified at:
        </Text>
        <Text style={[styles.body, { color: colors.primary, marginTop: 4 }]}>
          {credential.verification_url}
        </Text>
        <Text style={[styles.bodySmall, { marginTop: 8 }]}>
          Issued: {new Date(credential.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </Text>
        <Text style={styles.bodySmall}>
          Valid until: {new Date(credential.expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </Text>
      </View>

      <PDFFooter verificationUrl={credential.verification_url} />
    </Page>
  );
}

// Main Summary Document
export function SummaryPDF({ credential }: SummaryPDFProps) {
  return (
    <Document
      title={`Corrix Credential Summary - ${credential.credential_id}`}
      author="Corrix by Human Machines"
      subject="AI Collaboration Credential Summary"
    >
      <SummaryPage credential={credential} />
      <DimensionOverviewPage credential={credential} />
      <DomainAnalysisPage credential={credential} />
      <MethodologyPage credential={credential} />
    </Document>
  );
}

export default SummaryPDF;
