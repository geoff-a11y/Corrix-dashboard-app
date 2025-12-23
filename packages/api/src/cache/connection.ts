import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redis: Redis | null = null;
let connectionAttempted = false;

/**
 * Get Redis client singleton
 * Returns null if Redis is not available (graceful degradation)
 */
export function getRedisClient(): Redis | null {
  if (redis) return redis;
  if (connectionAttempted) return null;

  connectionAttempted = true;

  try {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (times > 3) {
          console.warn('[Redis] Max retries reached, disabling cache');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000);
      },
      lazyConnect: true,
    });

    redis.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });

    redis.on('error', (err: Error) => {
      console.warn('[Redis] Connection error:', err.message);
      // Don't throw - allow graceful degradation
    });

    redis.on('close', () => {
      console.log('[Redis] Connection closed');
    });

    // Attempt lazy connection
    redis.connect().catch((err: Error) => {
      console.warn('[Redis] Failed to connect:', err.message);
      redis = null;
    });

    return redis;
  } catch (err) {
    console.warn('[Redis] Initialization failed:', err);
    redis = null;
    return null;
  }
}

/**
 * Check if Redis is available and connected
 */
export async function isRedisAvailable(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.ping();
    return true;
  } catch {
    return false;
  }
}

/**
 * Close Redis connection (for graceful shutdown)
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    connectionAttempted = false;
  }
}
