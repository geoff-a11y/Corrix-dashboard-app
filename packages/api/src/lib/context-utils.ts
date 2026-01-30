import UAParser from 'ua-parser-js';
import { Request } from 'express';

export interface UserContext {
  // Device
  deviceType: string;
  browserFamily: string;
  osFamily: string;
  screenCategory: string | null;

  // Geographic
  countryCode: string | null;
  region: string | null;
  timezone: string | null;

  // Timing
  timeOfDayBucket: string;
  dayOfWeek: number;

  // Attribution
  referralSource: string | null;
}

/**
 * Extract user context from request headers and body
 */
export function extractUserContext(req: Request): UserContext {
  const ua = new UAParser(req.headers['user-agent']);

  // Device type detection
  const deviceType = ua.getDevice().type || 'desktop';

  // Browser family
  const browserName = ua.getBrowser().name || 'Unknown';
  const browserFamily = normalizeBrowserFamily(browserName);

  // OS family
  const osName = ua.getOS().name || 'Unknown';
  const osFamily = normalizeOsFamily(osName);

  // Screen category (from body if provided)
  const screenCategory = req.body?.screenCategory || null;

  // Geographic - from headers or body
  // In production, you'd use a geo-IP service. For now, accept from frontend or headers
  const countryCode = req.body?.countryCode ||
    req.headers['cf-ipcountry'] as string || // Cloudflare
    req.headers['x-vercel-ip-country'] as string || // Vercel
    null;

  const region = req.body?.region || null;
  const timezone = req.body?.timezone || null;

  // Timing
  const now = new Date();
  const hour = now.getHours();
  const timeOfDayBucket = getTimeOfDayBucket(hour);
  const dayOfWeek = now.getDay();

  // Attribution - from query params or body
  const referralSource = req.body?.referralSource ||
    req.query?.utm_source as string ||
    req.headers['referer'] as string ||
    null;

  return {
    deviceType,
    browserFamily,
    osFamily,
    screenCategory,
    countryCode,
    region,
    timezone,
    timeOfDayBucket,
    dayOfWeek,
    referralSource,
  };
}

function normalizeBrowserFamily(name: string): string {
  const normalized = name.toLowerCase();
  if (normalized.includes('chrome')) return 'Chrome';
  if (normalized.includes('safari')) return 'Safari';
  if (normalized.includes('firefox')) return 'Firefox';
  if (normalized.includes('edge')) return 'Edge';
  if (normalized.includes('opera')) return 'Opera';
  if (normalized.includes('samsung')) return 'Samsung';
  return 'Other';
}

function normalizeOsFamily(name: string): string {
  const normalized = name.toLowerCase();
  if (normalized.includes('windows')) return 'Windows';
  if (normalized.includes('mac')) return 'Mac';
  if (normalized.includes('ios')) return 'iOS';
  if (normalized.includes('android')) return 'Android';
  if (normalized.includes('linux')) return 'Linux';
  if (normalized.includes('chrome')) return 'ChromeOS';
  return 'Other';
}

function getTimeOfDayBucket(hour: number): string {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Calculate behavioral metrics from message history
 */
export function calculateBehavioralMetrics(messages: Array<{ role: string; content: string; created_at?: Date }>): {
  avgMessageLength: number;
  questionRatio: number;
  revisionCount: number;
  avgResponseTimeSeconds: number | null;
} {
  const userMessages = messages.filter(m => m.role === 'user');

  if (userMessages.length === 0) {
    return {
      avgMessageLength: 0,
      questionRatio: 0,
      revisionCount: 0,
      avgResponseTimeSeconds: null,
    };
  }

  // Average message length
  const totalChars = userMessages.reduce((sum, m) => sum + m.content.length, 0);
  const avgMessageLength = totalChars / userMessages.length;

  // Question ratio (messages containing ?)
  const questionMessages = userMessages.filter(m => m.content.includes('?'));
  const questionRatio = questionMessages.length / userMessages.length;

  // Revision count (messages asking for changes)
  const revisionPatterns = /\b(change|revise|modify|update|fix|adjust|try again|another|different|instead)\b/i;
  const revisionCount = userMessages.filter(m => revisionPatterns.test(m.content)).length;

  // Average response time (if timestamps available)
  let avgResponseTimeSeconds: number | null = null;
  if (messages.length > 1 && messages[0].created_at) {
    const responseTimes: number[] = [];
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].role === 'user' && messages[i - 1].role === 'assistant') {
        const assistantTime = new Date(messages[i - 1].created_at!).getTime();
        const userTime = new Date(messages[i].created_at!).getTime();
        const diffSeconds = (userTime - assistantTime) / 1000;
        if (diffSeconds > 0 && diffSeconds < 3600) { // Ignore gaps > 1 hour
          responseTimes.push(diffSeconds);
        }
      }
    }
    if (responseTimes.length > 0) {
      avgResponseTimeSeconds = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }
  }

  return {
    avgMessageLength,
    questionRatio,
    revisionCount,
    avgResponseTimeSeconds,
  };
}
