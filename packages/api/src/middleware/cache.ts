import { Request, Response, NextFunction } from 'express';
import { CacheService, generateCacheKey, CACHE_TTL } from '../cache/CacheService.js';

export type CacheTTL = keyof typeof CACHE_TTL;

/**
 * Cache middleware factory
 * Creates middleware that caches GET responses based on endpoint and query params
 */
export function cacheMiddleware(ttlType: CacheTTL = 'DISTRIBUTIONS') {
  const ttl = CACHE_TTL[ttlType];

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from path and query params
    const cacheKey = generateCacheKey(
      req.path,
      req.query as Record<string, unknown>
    );

    // Try to get from cache
    const cached = await CacheService.get(cacheKey);
    if (cached !== null) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json to cache the response
    res.json = (body: unknown) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        CacheService.set(cacheKey, body, ttl).catch(() => {
          // Ignore cache errors
        });
        res.setHeader('X-Cache', 'MISS');
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Specific middleware for common endpoints
 */
export const cacheBenchmarks = cacheMiddleware('BENCHMARKS');
export const cacheDistributions = cacheMiddleware('DISTRIBUTIONS');
export const cacheTrends = cacheMiddleware('TRENDS');
export const cacheRankings = cacheMiddleware('RANKINGS');
export const cacheLists = cacheMiddleware('LISTS');
