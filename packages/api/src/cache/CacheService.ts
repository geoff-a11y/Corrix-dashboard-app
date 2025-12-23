import { getRedisClient } from './connection.js';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

// Default TTLs for different data types (in seconds)
export const CACHE_TTL = {
  BENCHMARKS: 24 * 60 * 60, // 24 hours
  DISTRIBUTIONS: 60 * 60,   // 1 hour
  TRENDS: 30 * 60,          // 30 minutes
  RANKINGS: 60 * 60,        // 1 hour
  LISTS: 5 * 60,            // 5 minutes (for dropdown lists)
} as const;

/**
 * Generate a cache key from endpoint and params
 */
export function generateCacheKey(
  endpoint: string,
  params: Record<string, unknown>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .filter(key => params[key] !== undefined && params[key] !== null)
    .map(key => `${key}:${params[key]}`)
    .join(':');

  return `corrix:${endpoint}:${sortedParams}`;
}

/**
 * Cache service for Redis operations with graceful degradation
 */
export const CacheService = {
  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    const redis = getRedisClient();
    if (!redis) return null;

    try {
      const value = await redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (err) {
      console.warn('[Cache] Get error:', err);
      return null;
    }
  },

  /**
   * Set cached value with TTL
   */
  async set(key: string, value: unknown, ttlSeconds: number): Promise<boolean> {
    const redis = getRedisClient();
    if (!redis) return false;

    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn('[Cache] Set error:', err);
      return false;
    }
  },

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<boolean> {
    const redis = getRedisClient();
    if (!redis) return false;

    try {
      await redis.del(key);
      return true;
    } catch (err) {
      console.warn('[Cache] Delete error:', err);
      return false;
    }
  },

  /**
   * Delete all keys matching pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    const redis = getRedisClient();
    if (!redis) return 0;

    try {
      let cursor = '0';
      let deletedCount = 0;

      do {
        const [newCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = newCursor;

        if (keys.length > 0) {
          await redis.del(...keys);
          deletedCount += keys.length;
        }
      } while (cursor !== '0');

      return deletedCount;
    } catch (err) {
      console.warn('[Cache] Delete pattern error:', err);
      return 0;
    }
  },

  /**
   * Invalidate cache for a specific organization
   */
  async invalidateOrg(organizationId: string): Promise<number> {
    return this.deletePattern(`corrix:*:organizationId:${organizationId}*`);
  },

  /**
   * Invalidate cache for a specific team
   */
  async invalidateTeam(teamId: string): Promise<number> {
    return this.deletePattern(`corrix:*:teamId:${teamId}*`);
  },

  /**
   * Invalidate benchmarks cache (called after benchmark update job)
   */
  async invalidateBenchmarks(): Promise<number> {
    return this.deletePattern('corrix:benchmarks:*');
  },

  /**
   * Get or set with callback (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const fresh = await fetchFn();

    // Cache it (fire and forget)
    this.set(key, fresh, ttlSeconds).catch(() => {
      // Ignore cache errors
    });

    return fresh;
  },
};
