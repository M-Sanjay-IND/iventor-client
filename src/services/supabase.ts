import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
      'Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.',
  )
}

/**
 * Supabase client singleton.
 *
 * Configured with:
 * - Auto-refresh tokens
 * - Persistent sessions via localStorage
 * - URL detection for OAuth redirects
 *
 * This is the ONLY place the Supabase client is instantiated.
 * All services must import from here — never create additional clients.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
