import { useEffect, useState } from 'react';
import { temporalApi } from '@/api';
import { useScope } from '@/contexts/ScopeContext';
import { useDateRange } from '@/contexts/DateRangeContext';
import { TemporalIndicatorPanel } from '@/components/charts/TemporalIndicatorPanel';
import type { TemporalIndicatorDashboard, TemporalIndicator, LeadingIndicatorAlert } from '@corrix/shared';

export function TemporalIndicatorsPage() {
  const { scope } = useScope();
  const { dateRange } = useDateRange();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dashboard, setDashboard] = useState<TemporalIndicatorDashboard | null>(null);
  const [alerts, setAlerts] = useState<LeadingIndicatorAlert[]>([]);
  const [selectedIndicator, setSelectedIndicator] = useState<TemporalIndicator | null>(null);

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
        const [dashboardData, alertsData] = await Promise.all([
          temporalApi.getDashboard(params),
          temporalApi.getLeadingAlerts(params),
        ]);

        setDashboard(dashboardData);
        setAlerts(alertsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [scope, dateRange]);

  const handleIndicatorClick = (indicator: TemporalIndicator) => {
    setSelectedIndicator(indicator);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading temporal indicators...</div>
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
        <h1 className="text-2xl font-bold text-text-primary">Temporal Indicators</h1>
        <p className="mt-1 text-text-secondary">
          Leading, concurrent, and lagging indicators for proactive insights
        </p>
      </div>

      {/* Main Panel */}
      {dashboard && (
        <TemporalIndicatorPanel
          data={dashboard}
          onIndicatorClick={handleIndicatorClick}
        />
      )}

      {/* Selected Indicator Detail */}
      {selectedIndicator && (
        <div className="card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-medium text-text-primary">{selectedIndicator.displayName}</h3>
              <p className="text-sm text-text-muted mt-1">
                {selectedIndicator.temporality} indicator • {selectedIndicator.dimension} dimension
              </p>
            </div>
            <button
              onClick={() => setSelectedIndicator(null)}
              className="text-text-muted hover:text-text-primary"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-xs text-text-muted">Current Value</p>
              <p className="text-2xl font-bold text-text-primary">{selectedIndicator.currentValue.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Your Baseline</p>
              <p className="text-2xl font-bold text-text-secondary">{selectedIndicator.baselineValue.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Population Avg</p>
              <p className="text-2xl font-bold text-text-secondary">{selectedIndicator.populationValue.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Percentile</p>
              <p className="text-2xl font-bold text-accent-primary">P{selectedIndicator.percentileRank.toFixed(0)}</p>
            </div>
          </div>

          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-text-muted">vs Baseline: </span>
              <span className={selectedIndicator.deviationFromBaseline >= 0 ? 'text-score-high' : 'text-score-low'}>
                {selectedIndicator.deviationFromBaseline >= 0 ? '+' : ''}{selectedIndicator.deviationFromBaseline.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-text-muted">vs Population: </span>
              <span className={selectedIndicator.deviationFromPopulation >= 0 ? 'text-score-high' : 'text-score-low'}>
                {selectedIndicator.deviationFromPopulation >= 0 ? '+' : ''}{selectedIndicator.deviationFromPopulation.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-text-muted">Trend: </span>
              <span className={
                selectedIndicator.trendDirection === 'improving' ? 'text-score-high' :
                selectedIndicator.trendDirection === 'declining' ? 'text-score-low' : 'text-text-muted'
              }>
                {selectedIndicator.trendDirection} ({selectedIndicator.trendVelocity >= 0 ? '+' : ''}{selectedIndicator.trendVelocity.toFixed(2)}/day)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Active Alerts</h3>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  alert.alertType === 'critical'
                    ? 'bg-score-low/10 border border-score-low/30'
                    : 'bg-score-medium/10 border border-score-medium/30'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-text-primary">{alert.indicator.displayName}</p>
                    <p className="text-sm text-text-secondary mt-1">{alert.message}</p>
                    <p className="text-sm text-text-muted mt-2">
                      <strong>Recommendation:</strong> {alert.recommendation}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    alert.alertType === 'critical'
                      ? 'bg-score-low/20 text-score-low'
                      : 'bg-score-medium/20 text-score-medium'
                  }`}>
                    {alert.alertType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
