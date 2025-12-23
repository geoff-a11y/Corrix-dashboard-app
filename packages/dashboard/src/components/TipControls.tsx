import { useState, useEffect } from 'react';
import { targetingApi, type TargetingConfig } from '@/api';
import { COACHING_TYPE_DISPLAY, type AdvancedCoachingType } from '@corrix/shared';

interface TipControlsProps {
  onConfigChange?: (config: TargetingConfig) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  safety: '🛡️',
  quality: '✨',
  efficiency: '⚡',
  behavior: '🎯',
};

export function TipControls({ onConfigChange }: TipControlsProps) {
  const [config, setConfig] = useState<TargetingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const data = await targetingApi.getConfig();
        setConfig(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load config');
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  const handleToggle = async (coachingType: string, currentlyEnabled: boolean) => {
    setToggling(coachingType);
    setError(null);

    try {
      const newConfig = await targetingApi.toggleCoachingType(coachingType, !currentlyEnabled);
      setConfig(newConfig);
      onConfigChange?.(newConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle');
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-surface-secondary rounded-xl p-6 border border-border">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Tip Controls</h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-surface-tertiary rounded" />
          ))}
        </div>
      </div>
    );
  }

  const allTypes = Object.keys(COACHING_TYPE_DISPLAY) as AdvancedCoachingType[];
  const disabledTypes = config?.globalDisabled || [];

  return (
    <div className="bg-surface-secondary rounded-xl p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary">Tip Controls</h2>
        {config?.version ? (
          <span className="text-xs text-text-muted px-2 py-1 bg-surface-tertiary rounded">v{config.version}</span>
        ) : null}
      </div>

      {error && (
        <div className="mb-4 p-2 bg-score-low/10 border border-score-low/30 rounded text-score-low text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {allTypes.map(type => {
          const display = COACHING_TYPE_DISPLAY[type];
          const isEnabled = !disabledTypes.includes(type);
          const isToggling = toggling === type;

          return (
            <div
              key={type}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                isEnabled ? 'bg-surface-tertiary/50 hover:bg-surface-tertiary' : 'bg-surface-tertiary/20 opacity-60'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{CATEGORY_ICONS[display.category] || '📝'}</span>
                  <span className="text-sm font-medium text-text-primary truncate">
                    {display.name}
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-0.5 truncate pl-6">
                  {display.description}
                </p>
              </div>

              <button
                onClick={() => handleToggle(type, isEnabled)}
                disabled={isToggling}
                className={`
                  ml-3 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
                  border-2 border-transparent transition-colors duration-200 ease-in-out
                  focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface-primary
                  ${isEnabled ? 'bg-accent' : 'bg-surface-tertiary'}
                  ${isToggling ? 'opacity-50 cursor-wait' : ''}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full
                    bg-white shadow ring-0 transition duration-200 ease-in-out
                    ${isEnabled ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-border text-xs text-text-muted">
        <div className="flex items-center justify-between">
          <span>{allTypes.length - disabledTypes.length} of {allTypes.length} tips enabled</span>
          {config?.updatedAt && (
            <span>Updated: {new Date(config.updatedAt).toLocaleDateString()}</span>
          )}
        </div>
      </div>
    </div>
  );
}
