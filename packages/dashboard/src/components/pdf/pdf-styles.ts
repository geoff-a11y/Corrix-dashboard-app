import { StyleSheet } from '@react-pdf/renderer';

// Brand colors
export const colors = {
  primary: '#7877DF',       // Corrix purple
  background: '#1A1A1A',    // Dark background
  surface: '#2A2A2A',       // Card background
  text: '#FFFFFF',          // Primary text
  textSecondary: '#9CA3AF', // Secondary text
  textMuted: '#6B7280',     // Muted text
  border: '#374151',        // Border color
  // Rating colors
  exceptional: '#22C55E',   // Green
  strong: '#3B82F6',        // Blue
  qualified: '#7877DF',     // Purple
  developing: '#F59E0B',    // Amber
  concern: '#EF4444',       // Red
  // Score colors
  scoreHigh: '#22C55E',     // Green (80+)
  scoreMid: '#F59E0B',      // Yellow (60-79)
  scoreLow: '#EF4444',      // Red (<60)
};

// Common styles
export const styles = StyleSheet.create({
  // Page
  page: {
    backgroundColor: colors.background,
    padding: 40,
    fontFamily: 'OpenSans',
    color: colors.text,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBox: {
    width: 28,
    height: 28,
    backgroundColor: colors.primary,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerBrand: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
  },
  headerCredentialId: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  headerPageNumber: {
    fontSize: 10,
    color: colors.textMuted,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerCopyright: {
    fontSize: 8,
    color: colors.textMuted,
  },
  footerUrl: {
    fontSize: 8,
    color: colors.primary,
  },

  // Typography
  h1: {
    fontFamily: 'YoungSerif',
    fontSize: 28,
    color: colors.text,
    marginBottom: 10,
  },
  h2: {
    fontFamily: 'YoungSerif',
    fontSize: 20,
    color: colors.text,
    marginBottom: 8,
  },
  h3: {
    fontFamily: 'YoungSerif',
    fontSize: 16,
    color: colors.text,
    marginBottom: 6,
  },
  body: {
    fontSize: 10,
    color: colors.text,
    lineHeight: 1.5,
  },
  bodySmall: {
    fontSize: 9,
    color: colors.textSecondary,
    lineHeight: 1.4,
  },
  label: {
    fontSize: 8,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },

  // Layout
  row: {
    flexDirection: 'row',
  },
  column: {
    flexDirection: 'column',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  gap4: {
    gap: 4,
  },
  gap8: {
    gap: 8,
  },
  gap12: {
    gap: 12,
  },
  gap16: {
    gap: 16,
  },
  mb8: {
    marginBottom: 8,
  },
  mb12: {
    marginBottom: 12,
  },
  mb16: {
    marginBottom: 16,
  },
  mb24: {
    marginBottom: 24,
  },

  // Cards
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
  },
  cardSmall: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    padding: 12,
  },

  // Score display
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreCircleLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreValueLarge: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },

  // Score bar
  scoreBar: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreBarLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  // Rating badge
  ratingBadge: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignSelf: 'center',
  },
  ratingBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },

  // Mode bars
  modeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  modeBar: {
    flex: 1,
    alignItems: 'center',
  },
  modeBarTrack: {
    width: '100%',
    height: 60,
    backgroundColor: '#374151',
    borderRadius: 4,
    justifyContent: 'flex-end',
    padding: 2,
  },
  modeBarFill: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  modeLabel: {
    fontSize: 8,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  modeValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 2,
  },

  // Lists
  listItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  listBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  listNumber: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listNumberText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text,
  },

  // Interview probes
  probeCard: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
  },
  probeArea: {
    fontSize: 8,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  probeQuestion: {
    fontSize: 10,
    color: colors.text,
    marginBottom: 4,
  },
  probeRationale: {
    fontSize: 8,
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },

  // Grid
  grid2: {
    flexDirection: 'row',
    gap: 12,
  },
  grid3: {
    flexDirection: 'row',
    gap: 10,
  },
  gridItem: {
    flex: 1,
  },
});

// Helper to get score color
export function getScoreColor(score: number): string {
  if (score >= 80) return colors.scoreHigh;
  if (score >= 60) return colors.scoreMid;
  return colors.scoreLow;
}

// Helper to get rating color
export function getRatingColor(rating: string): string {
  switch (rating) {
    case 'exceptional': return colors.exceptional;
    case 'strong': return colors.strong;
    case 'qualified': return colors.qualified;
    case 'developing': return colors.developing;
    case 'concern': return colors.concern;
    default: return colors.qualified;
  }
}
