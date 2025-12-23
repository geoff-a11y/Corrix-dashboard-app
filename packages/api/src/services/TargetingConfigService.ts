import db from '../db/connection.js';

export interface TargetingRule {
  coachingType: string;
  enabled: boolean;
  expertiseFilter: string[] | 'all';
  domainFilter: string[] | 'all';
  minEffectivenessRate: number;
  maxDismissalRate: number;
}

export interface TargetingConfig {
  id: string;
  version: number;
  rules: TargetingRule[];
  globalDisabled: string[];
  createdBy?: string;
  notes?: string;
  updatedAt: string;
  createdAt: string;
}

export interface UpdateTargetingConfigParams {
  rules?: TargetingRule[];
  globalDisabled?: string[];
  notes?: string;
  createdBy?: string;
}

export class TargetingConfigService {
  /**
   * Get the current (latest version) targeting config
   */
  async getCurrentConfig(): Promise<TargetingConfig | null> {
    const query = `
      SELECT
        id,
        version,
        rules,
        global_disabled,
        created_by,
        notes,
        updated_at,
        created_at
      FROM targeting_config
      ORDER BY version DESC
      LIMIT 1
    `;

    const result = await db.query(query);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      version: row.version,
      rules: row.rules || [],
      globalDisabled: row.global_disabled || [],
      createdBy: row.created_by,
      notes: row.notes,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
    };
  }

  /**
   * Update targeting config (creates new version)
   */
  async updateConfig(params: UpdateTargetingConfigParams): Promise<TargetingConfig> {
    // Get current version
    const currentConfig = await this.getCurrentConfig();
    const newVersion = (currentConfig?.version || 0) + 1;

    const query = `
      INSERT INTO targeting_config (
        version,
        rules,
        global_disabled,
        created_by,
        notes,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING
        id,
        version,
        rules,
        global_disabled,
        created_by,
        notes,
        updated_at,
        created_at
    `;

    const result = await db.query(query, [
      newVersion,
      JSON.stringify(params.rules || currentConfig?.rules || []),
      JSON.stringify(params.globalDisabled || currentConfig?.globalDisabled || []),
      params.createdBy || null,
      params.notes || null,
    ]);

    const row = result.rows[0];
    return {
      id: row.id,
      version: row.version,
      rules: row.rules || [],
      globalDisabled: row.global_disabled || [],
      createdBy: row.created_by,
      notes: row.notes,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
    };
  }

  /**
   * Toggle a coaching type's global enabled/disabled status
   */
  async toggleCoachingType(coachingType: string, enabled: boolean): Promise<TargetingConfig> {
    const currentConfig = await this.getCurrentConfig();
    const globalDisabled = currentConfig?.globalDisabled || [];

    let newDisabled: string[];
    if (enabled) {
      // Remove from disabled list
      newDisabled = globalDisabled.filter(t => t !== coachingType);
    } else {
      // Add to disabled list if not already there
      newDisabled = globalDisabled.includes(coachingType)
        ? globalDisabled
        : [...globalDisabled, coachingType];
    }

    return this.updateConfig({
      globalDisabled: newDisabled,
      notes: `${enabled ? 'Enabled' : 'Disabled'} ${coachingType}`,
    });
  }

  /**
   * Update a specific coaching type's targeting rule
   */
  async updateRule(coachingType: string, rule: Partial<TargetingRule>): Promise<TargetingConfig> {
    const currentConfig = await this.getCurrentConfig();
    const rules = currentConfig?.rules || [];

    // Find existing rule or create new one
    const existingIndex = rules.findIndex(r => r.coachingType === coachingType);

    const updatedRule: TargetingRule = {
      coachingType,
      enabled: rule.enabled ?? true,
      expertiseFilter: rule.expertiseFilter ?? 'all',
      domainFilter: rule.domainFilter ?? 'all',
      minEffectivenessRate: rule.minEffectivenessRate ?? 0,
      maxDismissalRate: rule.maxDismissalRate ?? 1,
    };

    if (existingIndex >= 0) {
      rules[existingIndex] = { ...rules[existingIndex], ...updatedRule };
    } else {
      rules.push(updatedRule);
    }

    return this.updateConfig({
      rules,
      notes: `Updated rule for ${coachingType}`,
    });
  }

  /**
   * Get config history
   */
  async getConfigHistory(limit: number = 10): Promise<TargetingConfig[]> {
    const query = `
      SELECT
        id,
        version,
        rules,
        global_disabled,
        created_by,
        notes,
        updated_at,
        created_at
      FROM targeting_config
      ORDER BY version DESC
      LIMIT $1
    `;

    const result = await db.query(query, [limit]);

    return result.rows.map(row => ({
      id: row.id,
      version: row.version,
      rules: row.rules || [],
      globalDisabled: row.global_disabled || [],
      createdBy: row.created_by,
      notes: row.notes,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
    }));
  }
}
