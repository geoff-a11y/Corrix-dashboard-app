import { api } from './client';
import type {
  VerificationBehaviorAnalysis,
  EditRatioAnalysis,
  DialogueDepthAnalysis,
  TimeToActionAnalysis,
  CriticalEngagementAnalysis,
  FeedbackQualityAnalysis,
  DeepBehaviorSummary,
} from '@corrix/shared';

interface DeepBehaviorParams {
  organizationId?: string;
  teamId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export const behaviorsDeepApi = {
  getVerificationAnalysis(params: DeepBehaviorParams): Promise<VerificationBehaviorAnalysis> {
    return api.get('/behaviors/verification', params);
  },

  getEditRatioAnalysis(params: DeepBehaviorParams): Promise<EditRatioAnalysis> {
    return api.get('/behaviors/edit-ratio', params);
  },

  getDialogueDepthAnalysis(params: DeepBehaviorParams): Promise<DialogueDepthAnalysis> {
    return api.get('/behaviors/dialogue-depth', params);
  },

  getTimeToActionAnalysis(params: DeepBehaviorParams): Promise<TimeToActionAnalysis> {
    return api.get('/behaviors/time-to-action', params);
  },

  getCriticalEngagementAnalysis(params: DeepBehaviorParams): Promise<CriticalEngagementAnalysis> {
    return api.get('/behaviors/critical-engagement', params);
  },

  getFeedbackQualityAnalysis(params: DeepBehaviorParams): Promise<FeedbackQualityAnalysis> {
    return api.get('/behaviors/feedback-quality', params);
  },

  getDeepSummary(params: DeepBehaviorParams): Promise<DeepBehaviorSummary> {
    return api.get('/behaviors/deep-summary', params);
  },
};
