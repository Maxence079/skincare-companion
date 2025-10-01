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

// Default export for convenience
export const supabaseAdmin = getAdminClient()