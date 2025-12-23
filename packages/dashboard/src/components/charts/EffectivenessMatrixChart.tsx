import type { EffectivenessMatrix, EffectivenessMatrixCell } from '@corrix/shared';

interface Props {
  matrix: EffectivenessMatrix;
}

export function EffectivenessMatrixChart({ matrix }: Props) {
  if (!matrix || matrix.cells.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        No effectiveness data available yet
      </div>
    );
  }

  const { rows, columns, cells } = matrix;

  // Create a map for quick lookup
  const cellMap = new Map<string, EffectivenessMatrixCell>();
  cells.forEach(cell => {
    const key = `${cell.coachingType}-${cell.segment}`;
    cellMap.set(key, cell);
  });

  // Column display names
  const columnDisplayNames: Record<string, string> = {
    novice: 'Novice',
    advanced_beginner: 'Adv. Beginner',
    competent: 'Competent',
    proficient: 'Proficient',
    expert: 'Expert',
  };

  // Row display names
  const rowDisplayNames: Record<string, string> = {
    hallucination_risk: 'Hallucination',
    refusal_recovery: 'Refusal Recovery',
    stop_ramble: 'Stop Ramble',
    math_date_check: 'Math/Date',
    contradictory_instructions: 'Contradictory',
    action_extraction: 'Action Extract',
    red_team_check: 'Red Team',
    fact_check_mode: 'Fact Check',
    anti_generic: 'Anti-Generic',
    stepwise_mode: 'Stepwise',
    off_piste_drift: 'Topic Drift',
    off_piste_constraint: 'Constraint',
    off_piste_invented: 'Invented',
    off_piste_looping: 'Looping',
    sycophancy_detection: 'Sycophancy',
  };

  const getEffectivenessColor = (rate: number, sampleSize: number): string => {
    if (sampleSize < 5) return 'bg-surface-tertiary'; // Not enough data
    if (rate >= 0.6) return 'bg-score-high/80';
    if (rate >= 0.4) return 'bg-score-high/50';
    if (rate >= 0.25) return 'bg-score-mid/60';
    if (rate >= 0.15) return 'bg-score-low/50';
    return 'bg-score-low/80';
  };

  const getTextColor = (rate: number, sampleSize: number): string => {
    if (sampleSize < 5) return 'text-text-muted';
    if (rate >= 0.4) return 'text-white';
    return 'text-white';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left text-xs font-medium text-text-muted p-2 w-32">
              Coaching Type
            </th>
            {columns.map(col => (
              <th key={col} className="text-center text-xs font-medium text-text-muted p-2 min-w-[80px]">
                {columnDisplayNames[col] || col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row} className="border-t border-border/50">
              <td className="text-left text-sm text-text-primary p-2 font-medium">
                {rowDisplayNames[row] || row}
              </td>
              {columns.map(col => {
                const cell = cellMap.get(`${row}-${col}`);
                const rate = cell?.effectivenessRate || 0;
                const size = cell?.sampleSize || 0;

                return (
                  <td key={col} className="p-1">
                    <div
                      className={`
                        rounded-md p-2 text-center transition-all cursor-default
                        ${getEffectivenessColor(rate, size)}
                        ${getTextColor(rate, size)}
                      `}
                      title={size >= 5
                        ? `${(rate * 100).toFixed(0)}% effective (n=${size})`
                        : `Insufficient data (n=${size})`
                      }
                    >
                      {size >= 5 ? (
                        <span className="text-sm font-medium">
                          {(rate * 100).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-xs">—</span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="text-text-muted">Effectiveness:</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-4 rounded bg-score-low/80" />
          <span className="text-xs text-text-muted">&lt;15%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-4 rounded bg-score-mid/60" />
          <span className="text-xs text-text-muted">25-40%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-4 rounded bg-score-high/50" />
          <span className="text-xs text-text-muted">40-60%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-4 rounded bg-score-high/80" />
          <span className="text-xs text-text-muted">&gt;60%</span>
        </div>
      </div>
    </div>
  );
}
