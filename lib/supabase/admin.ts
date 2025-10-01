/**
 * Supabase Admin Client (Service Role)
 * Singleton pattern to avoid creating multiple connections
 * Use ONLY on server-side for administrative operations
 * NEVER import this on client-side - bypasses RLS!
 */

import { createClient } from '@supabase/supabase-js'

// Singleton instance
let adminClient: ReturnType<typeof createClient> | null = null

export function getAdminClient() {
  if (!adminClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      // During build time, return null instead of throwing
      if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
        console.warn('[Supabase Admin] Missing credentials during build - will initialize at runtime')
        return null as any
      }
      throw new Error('[Supabase Admin] Missing URL or Service Role Key')
    }

    adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-application-name': 'skincare-admin',
        },
      },
    })
  }

  return adminClient
}

// Backwards compatibility
export function createAdminClient() {
  return getAdminClient()
}

// Default export for convenience - lazy initialization
export const supabaseAdmin = typeof process.env.NEXT_PUBLIC_SUPABASE_URL !== 'undefined'
  ? getAdminClient()
  : null as any