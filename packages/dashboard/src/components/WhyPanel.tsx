interface Driver {
  factor: string;
  impact: number;
  direction: 'positive' | 'negative';
  recommendation?: string;
}

interface WhyPanelProps {
  metric: string;
  value: number;
  drivers: Driver[];
}

export function WhyPanel({ metric, value, drivers }: WhyPanelProps) {
  const recommendation = drivers.find(d => d.recommendation)?.recommendation;

  return (
    <div className="p-4 bg-bg-tertiary rounded-lg border border-border-subtle">
      <h4 className="text-sm font-medium text-text-secondary mb-3">
        Why is {metric} at {value.toFixed(0)}?
      </h4>
      <div className="space-y-2">
        {drivers.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className={d.direction === 'positive' ? 'text-score-high' : 'text-score-low'}>
              {d.direction === 'positive' ? '↑' : '↓'}
            </span>
            <span className="text-text-primary">{d.factor}</span>
            <span className="text-text-muted">
              ({d.impact > 0 ? '+' : ''}{d.impact}%)
            </span>
          </div>
        ))}
      </div>
      {recommendation && (
        <p className="mt-3 text-sm text-accent flex items-center gap-1">
          💡 {recommendation}
        </p>
      )}
    </div>
  );
}
