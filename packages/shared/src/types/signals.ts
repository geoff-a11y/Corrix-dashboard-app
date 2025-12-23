import type { ScoreDistribution } from './scores';

// Platform types
export type Platform = 'claude' | 'chatgpt' | 'gemini';

// Action types
export type ActionType = 'accept' | 'copy' | 'edit' | 'regenerate' | 'abandon';

// Incoming signal from Chrome extension
export interface BehavioralSignal {
  sessionId: string;
  timestamp: string;  // ISO timestamp
  platform: Platform;

  // Prompt analysis
  promptHasContext: boolean;
  promptHasConstraints: boolean;
  promptHasExamples: boolean;
  promptHasFormatSpec: boolean;
  promptQualityScore: number;
  promptWordCount: number;

  // Action taken
  actionType: ActionType;
  timeToActionSeconds: number;

  // Dialogue context
  conversationDepth: number;
  isFollowUp: boolean;
  hasVerificationRequest: boolean;
  hasPushback: boolean;
  hasClarificationRequest: boolean;

  // Outcome (optional)
  outcomeRating?: 1 | 2 | 3 | 4 | 5;

  // Session context
  sessionDurationSeconds: number;
  sessionStartHour: number;
}

// Aggregated behavior metrics
export interface BehaviorMetrics {
  // Prompt quality distribution
  promptQuality: {
    mean: number;
    distribution: ScoreDistribution;
    componentRates: {
      hasContext: number;      // % of prompts with context
      hasConstraints: number;
      hasExamples: number;
      hasFormatSpec: number;
    };
  };

  // Action distribution
  actions: {
    accept: number;      // % of responses accepted as-is
    copy: number;        // % copied (likely for editing)
    edit: number;        // % explicitly edited
    regenerate: number;  // % regenerated
    abandon: number;     // % abandoned
  };

  // Session patterns
  sessions: {
    averageDuration: number;       // seconds
    averageInteractions: number;
    peakHours: number[];           // Most active hours
    averageDepth: number;          // Turns per conversation
  };

  // Platform breakdown
  platforms: {
    claude: number;    // % of usage
    chatgpt: number;
    gemini: number;
  };
}
