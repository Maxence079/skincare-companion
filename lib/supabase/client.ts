import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for use in Client Components
 * This client runs in the browser and has access to cookies
 */
export function createClient() {
  // During build, env vars might not be available
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  return createBrowserClient(url, key)
}