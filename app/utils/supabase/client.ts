import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/app/types/database.types'

// Accept URL and Key as arguments
export const createClient = (supabaseUrl: string, supabaseAnonKey: string) => {
  // Remove env var access from here

  if (!supabaseUrl || !supabaseAnonKey) {
    // Check arguments instead
    throw new Error(
      'Missing env.NEXT_PUBLIC_SUPABASE_URL or env.NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
      },
    }
  )
}
