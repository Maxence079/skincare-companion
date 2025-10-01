/**
 * Health Check Endpoint
 * Monitors system health for uptime monitoring and alerts
 */

import { NextResponse } from 'next/server'
import { isRedisHealthy, getCacheStats } from '@/lib/cache/redis'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    checks: {
      redis: { status: 'unknown' as 'healthy' | 'unhealthy', message: '' },
      database: { status: 'unknown' as 'healthy' | 'unhealthy', message: '' },
      api: { status: 'healthy' as 'healthy', message: 'API responding' },
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  }

  // Check Redis
  try {
    const redisHealthy = await isRedisHealthy()
    const cacheStats = await getCacheStats()

    if (redisHealthy) {
      checks.checks.redis = {
        status: 'healthy',
        message: `Connected (${cacheStats.keysCount || 0} keys)`,
      }
    } else {
      checks.checks.redis = {
        status: 'unhealthy',
        message: cacheStats.error || 'Connection failed',
      }
      checks.status = 'degraded'
    }
  } catch (error) {
    checks.checks.redis = {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
    }
    checks.status = 'degraded'
  }

  // Check Database
  try {
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .limit(1)

    if (error) {
      checks.checks.database = {
        status: 'unhealthy',
        message: error.message,
      }
      checks.status = 'unhealthy'
    } else {
      checks.checks.database = {
        status: 'healthy',
        message: 'Connected',
      }
    }
  } catch (error) {
    checks.checks.database = {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
    }
    checks.status = 'unhealthy'
  }

  // Return appropriate status code
  const statusCode = checks.status === 'healthy' ? 200 : checks.status === 'degraded' ? 207 : 503

  return NextResponse.json(checks, { status: statusCode })
}
