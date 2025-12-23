import { useEffect, useState } from 'react';
import { behaviorsDeepApi } from '@/api';
import { useScope } from '@/contexts/ScopeContext';
import { useDateRange } from '@/contexts/DateRangeContext';
import type {
  VerificationBehaviorAnalysis,
  EditRatioAnalysis,
  DialogueDepthAnalysis,
  TimeToActionAnalysis,
  CriticalEngagementAnalysis,
  FeedbackQualityAnalysis,
} from '@corrix/shared';
import { clsx } from 'clsx';

export function BehaviorDeepDivePage() {
  const { scope } = useScope();
  const { dateRange } = useDateRange();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [verification, setVerification] = useState<VerificationBehaviorAnalysis | null>(null);
  const [editRatio, setEditRatio] = useState<EditRatioAnalysis | null>(null);
  const [dialogueDepth, setDialogueDepth] = useState<DialogueDepthAnalysis | null>(null);
  const [timeToAction, setTimeToAction] = useState<TimeToActionAnalysis | null>(null);
  const [criticalEngagement, setCriticalEngagement] = useState<CriticalEngagementAnalysis | null>(null);
  const [feedbackQuality, setFeedbackQuality] = useState<FeedbackQualityAnalysis | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      const params = {
        organizationId: scope.organizationId,
        teamId: scope.level === 'team' ? scope.teamId : undefined,
        userId: scope.userId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };

      try {
        const [verData, editData, depthData, ttaData, ceData, fqData] = await Promise.all([
          behaviorsDeepApi.getVerificationAnalysis(params),
          behaviorsDeepApi.getEditRatioAnalysis(params),
          behaviorsDeepApi.getDialogueDepthAnalysis(params),
          behaviorsDeepApi.getTimeToActionAnalysis(params),
          behaviorsDeepApi.getCriticalEngagementAnalysis(params),
          behaviorsDeepApi.getFeedbackQualityAnalysis(params),
        ]);

        setVerification(verData);
        setEditRatio(editData);
        setDialogueDepth(depthData);
        setTimeToAction(ttaData);
        setCriticalEngagement(ceData);
        setFeedbackQuality(fqData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [scope]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading behavior analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-score-low mb-2">Error loading data</p>
          <p className="text-sm text-text-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Behavior Deep Dive</h1>
        <p className="mt-1 text-text-secondary">
          Detailed analysis of verification, editing, dialogue, and engagement patterns
        </p>
      </div>

      {/* Grid of behavior cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Verification Behavior */}
        {verification && (
          <div className="card">
            <h3 className="text-sm font-medium text-text-secondary mb-4">Verification Rate</h3>
            <div className="text-3xl font-bold text-text-primary mb-2">
              {verification.verificationRate.toFixed(1)}%
            </div>
            <p className="text-xs text-text-muted mb-4">of responses trigger verification</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">vs Population</span>
                <span className="text-text-primary">P{verification.vsPopulation.percentile.toFixed(0)}</span>
              </div>
              <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-primary rounded-full"
                  style={{ width: `${verification.vsPopulation.percentile}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Edit Ratio */}
        {editRatio && (
          <div className="card">
            <h3 className="text-sm font-medium text-text-secondary mb-4">Edit Ratio</h3>
            <div className="text-3xl font-bold text-text-primary mb-2">
              {editRatio.overallEditRatio.toFixed(1)}%
            </div>
            <p className={clsx(
              'text-xs mb-4 px-2 py-1 rounded inline-block',
              editRatio.insight === 'optimal' ? 'bg-score-high/10 text-score-high' :
              editRatio.insight === 'over_accepting' ? 'bg-score-low/10 text-score-low' :
              'bg-score-medium/10 text-score-medium'
            )}>
              {editRatio.insight.replace(/_/g, ' ')}
            </p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Used as-is</span>
                <span className="text-text-primary">{editRatio.usedAsIs.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Minor edits</span>
                <span className="text-text-primary">{editRatio.minorEdits.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Major edits</span>
                <span className="text-text-primary">{editRatio.majorEdits.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Discarded</span>
                <span className="text-text-primary">{editRatio.discarded.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Dialogue Depth */}
        {dialogueDepth && (
          <div className="card">
            <h3 className="text-sm font-medium text-text-secondary mb-4">Dialogue Depth</h3>
            <div className="text-3xl font-bold text-text-primary mb-2">
              {dialogueDepth.averageDepth.toFixed(1)}
            </div>
            <p className="text-xs text-text-muted mb-4">average turns per conversation</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Single turn</span>
                <span className="text-text-primary">{dialogueDepth.distribution.singleTurn.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Short (2-3)</span>
                <span className="text-text-primary">{dialogueDepth.distribution.short.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Medium (4-7)</span>
                <span className="text-text-primary">{dialogueDepth.distribution.medium.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Deep (8+)</span>
                <span className="text-text-primary">{(dialogueDepth.distribution.deep + dialogueDepth.distribution.veryDeep).toFixed(0)}%</span>
              </div>
            </div>
            <p className="text-xs text-text-muted mt-3">
              {dialogueDepth.inOptimalRange.toFixed(0)}% in optimal range
            </p>
          </div>
        )}

        {/* Time to Action */}
        {timeToAction && (
          <div className="card">
            <h3 className="text-sm font-medium text-text-secondary mb-4">Time to Action</h3>
            <div className="text-3xl font-bold text-text-primary mb-2">
              {timeToAction.medianTimeToAction.toFixed(0)}s
            </div>
            <p className={clsx(
              'text-xs mb-4 px-2 py-1 rounded inline-block',
              timeToAction.insight === 'optimal' ? 'bg-score-high/10 text-score-high' :
              timeToAction.insight === 'impulsive' ? 'bg-score-low/10 text-score-low' :
              'bg-score-medium/10 text-score-medium'
            )}>
              {timeToAction.insight.replace(/_/g, ' ')}
            </p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Immediate (&lt;5s)</span>
                <span className="text-text-primary">{timeToAction.distribution.immediate.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Considered (15-60s)</span>
                <span className="text-text-primary">{timeToAction.distribution.considered.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Deliberate (1-5m)</span>
                <span className="text-text-primary">{timeToAction.distribution.deliberate.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Critical Engagement */}
        {criticalEngagement && (
          <div className="card">
            <h3 className="text-sm font-medium text-text-secondary mb-4">Critical Engagement</h3>
            <div className="text-3xl font-bold text-text-primary mb-2">
              {criticalEngagement.criticalEngagementRate.toFixed(1)}%
            </div>
            <p className="text-xs text-text-muted mb-4">of conversations include pushback or questioning</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Pushback</span>
                <span className="text-text-primary">{criticalEngagement.byType.pushback.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Reasoning requests</span>
                <span className="text-text-primary">{criticalEngagement.byType.reasoningRequest.toFixed(0)}%</span>
              </div>
            </div>
            <p className="text-xs text-text-muted mt-3">
              Correlation with outcomes: {criticalEngagement.correlationWithOutcomes.toFixed(2)}
            </p>
          </div>
        )}

        {/* Feedback Quality */}
        {feedbackQuality && (
          <div className="card">
            <h3 className="text-sm font-medium text-text-secondary mb-4">Feedback Quality</h3>
            <div className="text-3xl font-bold text-text-primary mb-2">
              {feedbackQuality.overallQuality.toFixed(0)}
            </div>
            <p className="text-xs text-text-muted mb-4">overall quality score</p>
            <div className="space-y-2">
              {Object.entries(feedbackQuality.components).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-xs text-text-muted w-24 capitalize">{key}</span>
                  <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className={clsx(
                        'h-full rounded-full',
                        value >= 70 ? 'bg-score-high' :
                        value >= 40 ? 'bg-score-medium' : 'bg-score-low'
                      )}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-primary w-8">{value.toFixed(0)}</span>
                </div>
              ))}
            </div>
            {feedbackQuality.improvementAreas.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border-default">
                <p className="text-xs text-text-muted mb-2">Areas to improve:</p>
                <ul className="text-xs text-text-secondary space-y-1">
                  {feedbackQuality.improvementAreas.slice(0, 2).map((area, i) => (
                    <li key={i}>• {area}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
