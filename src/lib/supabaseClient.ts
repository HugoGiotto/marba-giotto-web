// src/lib/supabaseClient.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Helper que garante string (e dá erro claro se faltar)
function requiredEnv(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY'): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

const supabaseUrl = requiredEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = requiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const supabaseFunctionsUrl = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL; // opcional

let browserClient: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
  if (browserClient) return browserClient;

  browserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    ...(supabaseFunctionsUrl ? { functions: { url: supabaseFunctionsUrl } } : {}),
  });

  return browserClient;
}

export const supabase = getSupabaseClient();

// Debug só em dev
if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  console.info('[supabase] URL em uso:', supabaseUrl);
}
