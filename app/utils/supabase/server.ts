import { createServerClient } from "@supabase/ssr";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import type { Database } from "@/app/types/database.types"; // Keep existing alias

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing env.NEXT_PUBLIC_SUPABASE_URL or env.NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

// Note: This function now expects the cookie store to be passed in.
// You'll need to call cookies() from next/headers in the Server Component
// or Route Handler where you use this function.
export const createClient = (cookieStore: ReadonlyRequestCookies) => {
  return createServerClient<Database>( // Keep generic type if needed, or remove if causing issues
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        // Use getAll to retrieve all cookies
        getAll() {
          return cookieStore.getAll();
        },
        // Use setAll to set multiple cookies
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        }, // Added missing comma here if needed by formatter, but likely just braces needed
      }, // Added missing closing brace for cookies object
    } // Added missing closing brace for createServerClient options object
  ); // Added missing closing parenthesis for createServerClient call
}; // Added missing closing brace for createClient function
