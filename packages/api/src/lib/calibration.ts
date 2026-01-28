import db from '../db/connection.js';

export type Platform = 'chatgpt' | 'claude' | 'gemini' | 'unknown';

interface CalibrationData {
  platform: Platform;
  calibration_offset: number;
  sample_size: number;
  mean_score: number | null;
  std_dev: number | null;
}

// Cache calibration data (refresh every hour)
let calibrationCache: Map<string, CalibrationData> = new Map();
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getCalibrationData(): Promise<Map<string, CalibrationData>> {
  const now = Date.now();
  if (calibrationCache.size > 0 && now - cacheTimestamp < CACHE_TTL) {
    return calibrationCache;
  }

  try {
    const result = await db.query(
      `SELECT DISTINCT ON (platform) platform, calibration_offset, sample_size, mean_score, std_dev
       FROM platform_calibration
       ORDER BY platform, effective_date DESC`
    );

    calibrationCache = new Map();
    for (const row of result.rows) {
      calibrationCache.set(row.platform, {
        platform: row.platform,
        calibration_offset: parseFloat(row.calibration_offset),
        sample_size: row.sample_size,
        mean_score: row.mean_score ? parseFloat(row.mean_score) : null,
        std_dev: row.std_dev ? parseFloat(row.std_dev) : null,
      });
    }
    cacheTimestamp = now;
  } catch (error) {
    console.error('[Calibration] Failed to load calibration data:', error);
    // Use defaults if DB fails
    calibrationCache = new Map([
      ['claude', { platform: 'claude', calibration_offset: 0, sample_size: 0, mean_score: null, std_dev: null }],
      ['chatgpt', { platform: 'chatgpt', calibration_offset: -2.5, sample_size: 0, mean_score: null, std_dev: null }],
      ['gemini', { platform: 'gemini', calibration_offset: -1.2, sample_size: 0, mean_score: null, std_dev: null }],
    ]);
    cacheTimestamp = now;
  }

  return calibrationCache;
}

/**
 * Apply platform-specific calibration to raw score
 * Returns calibrated score clamped to 0-100
 */
export async function calibrateScore(rawScore: number, platform: Platform): Promise<number> {
  if (platform === 'unknown') {
    return rawScore;
  }

  const calibrationData = await getCalibrationData();
  const data = calibrationData.get(platform);

  if (!data) {
    console.warn(`[Calibration] No data for platform: ${platform}`);
    return rawScore;
  }

  const calibrated = Math.round(rawScore + data.calibration_offset);
  return Math.max(0, Math.min(100, calibrated));
}

/**
 * Calculate percentile within platform cohort
 * Uses normal distribution approximation when we have sufficient sample size
 */
export async function calculatePercentile(score: number, platform: Platform): Promise<number | null> {
  if (platform === 'unknown') {
    return null;
  }

  const calibrationData = await getCalibrationData();
  const data = calibrationData.get(platform);

  if (!data || data.sample_size < 100 || !data.mean_score || !data.std_dev) {
    // Not enough data for reliable percentile calculation
    return null;
  }

  // Z-score calculation
  const zScore = (score - data.mean_score) / data.std_dev;

  // Approximate percentile using error function
  // P(Z < z) = 0.5 * (1 + erf(z / sqrt(2)))
  const percentile = Math.round(50 * (1 + erf(zScore / Math.SQRT2)));

  return Math.max(1, Math.min(99, percentile));
}

/**
 * Error function approximation for normal distribution CDF
 */
function erf(x: number): number {
  // Horner form approximation
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

/**
 * Get current calibration version string
 */
export function getCalibrationVersion(): string {
  return '1.0';
}

/**
 * Update calibration statistics after new assessment
 * Called after each successful credential generation
 */
export async function updateCalibrationStats(platform: Platform, score: number): Promise<void> {
  if (platform === 'unknown') return;

  try {
    // Get current stats
    const result = await db.query(
      `SELECT sample_size, mean_score, std_dev
       FROM platform_calibration
       WHERE platform = $1
       ORDER BY effective_date DESC
       LIMIT 1`,
      [platform]
    );

    if (result.rows.length === 0) return;

    const current = result.rows[0];
    const n = current.sample_size + 1;
    const oldMean = current.mean_score || score;
    const oldVariance = current.std_dev ? current.std_dev * current.std_dev : 0;

    // Welford's online algorithm for running mean and variance
    const newMean = oldMean + (score - oldMean) / n;
    const newVariance = n > 1
      ? ((n - 2) * oldVariance + (score - oldMean) * (score - newMean)) / (n - 1)
      : 0;
    const newStdDev = Math.sqrt(newVariance);

    // Update stats
    await db.query(
      `UPDATE platform_calibration
       SET sample_size = $1, mean_score = $2, std_dev = $3, updated_at = NOW()
       WHERE platform = $4 AND effective_date = CURRENT_DATE`,
      [n, newMean.toFixed(2), newStdDev.toFixed(2), platform]
    );

    // Invalidate cache
    cacheTimestamp = 0;
  } catch (error) {
    console.error('[Calibration] Failed to update stats:', error);
    // Non-critical - don't throw
  }
}
