/**
 * Redis Cache Layer with Upstash
 * Provides multi-layer caching strategy for high-performance data access
 */

import { Redis } from '@upstash/redis'

// Initialize Upstash Redis client (serverless-friendly)
// Singleton pattern to avoid multiple connections
let redisInstance: Redis | null = null

export function getRedisClient(): Redis {
  if (!redisInstance) {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
      console.warn('[Redis] Missing credentials - caching disabled')
      // Return mock client for development without Redis
      return createMockRedis()
    }

    redisInstance = new Redis({
      url,
      token,
      // Automatic retries with exponential backoff
      retry: {
        retries: 3,
        backoff: (retryCount) => Math.min(1000 * Math.pow(2, retryCount), 3000),
      },
    })
  }

  return redisInstance
}

export const redis = getRedisClient()

// Mock Redis client for development
function createMockRedis(): Redis {
  const mockStorage = new Map<string, any>()

  return {
    get: async (key: string) => mockStorage.get(key) || null,
    setex: async (key: string, ttl: number, value: any) => {
      mockStorage.set(key, value)
      setTimeout(() => mockStorage.delete(key), ttl * 1000)
      return 'OK'
    },
    del: async (...keys: string[]) => {
      keys.forEach(k => mockStorage.delete(k))
      return keys.length
    },
    keys: async (pattern: string) => {
      const regex = new RegExp(pattern.replace('*', '.*'))
      return Array.from(mockStorage.keys()).filter(k => regex.test(k))
    },
    ping: async () => 'PONG',
  } as any
}

// Cache key generators
export const CacheKeys = {
  profile: (userId: string) => `profile:${userId}`,
  session: (sessionId: string) => `session:${sessionId}`,
  userProfiles: (userId: string) => `user:${userId}:profiles`,
  environmentData: (lat: number, lng: number) => `env:${lat.toFixed(2)}:${lng.toFixed(2)}`,
  aiResponse: (hash: string) => `ai:response:${hash}`,
}

// Default TTLs (in seconds)
export const CacheTTL = {
  profile: 3600, // 1 hour
  session: 7200, // 2 hours
  userProfiles: 1800, // 30 minutes
  environmentData: 86400, // 24 hours
  aiResponse: 3600, // 1 hour
}

/**
 * Get value from cache with automatic JSON parsing
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key)
    return value as T | null
  } catch (error) {
    console.error('[Redis Cache] Get error:', error)
    return null // Fail gracefully - never break app due to cache
  }
}

/**
 * Set value in cache with TTL
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number = 3600
): Promise<boolean> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value))
    return true
  } catch (error) {
    console.error('[Redis Cache] Set error:', error)
    return false
  }
}

/**
 * Delete value from cache
 */
export async function deleteCached(key: string): Promise<boolean> {
  try {
    await redis.del(key)
    return true
  } catch (error) {
    console.error('[Redis Cache] Delete error:', error)
    return false
  }
}

/**
 * Invalidate multiple cache keys by pattern
 */
export async function invalidateCachePattern(pattern: string): Promise<number> {
  try {
    const keys = await redis.keys(pattern)
    if (keys.length === 0) return 0

    await redis.del(...keys)
    return keys.length
  } catch (error) {
    console.error('[Redis Cache] Invalidate pattern error:', error)
    return 0
  }
}

/**
 * Cache-aside pattern helper
 * Tries cache first, falls back to fetcher, then caches result
 */
export async function cacheAside<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  // Try cache first
  const cached = await getCached<T>(key)
  if (cached !== null) {
    console.log(`[Redis Cache] HIT - ${key}`)
    return cached
  }

  console.log(`[Redis Cache] MISS - ${key}`)

  // Cache miss - fetch from source
  const value = await fetcher()

  // Cache the result (fire and forget to avoid blocking)
  setCached(key, value, ttlSeconds).catch(err => {
    console.error('[Redis Cache] Background cache set failed:', err)
  })

  return value
}

/**
 * Check if Redis is connected and healthy
 */
export async function isRedisHealthy(): Promise<boolean> {
  try {
    const result = await redis.ping()
    return result === 'PONG'
  } catch (error) {
    console.error('[Redis Cache] Health check failed:', error)
    return false
  }
}

/**
 * Get cache statistics (useful for monitoring)
 */
export async function getCacheStats(): Promise<{
  healthy: boolean
  keysCount?: number
  error?: string
}> {
  try {
    const healthy = await isRedisHealthy()
    if (!healthy) {
      return { healthy: false, error: 'Redis not responding' }
    }

    // Get approximate key count
    const allKeys = await redis.keys('*')

    return {
      healthy: true,
      keysCount: allKeys.length,
    }
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
