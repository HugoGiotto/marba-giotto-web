// src/lib/supabaseClient.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// estes 3 precisam existir em Vercel (.env) e em .env.local para dev
const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const fn   = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL; // opcional

let client: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  client = createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    ...(fn ? { functions: { url: fn } } : {}),
  });

  return client;
}

export const supabase = getSupabaseClient();

// debug só no dev (não derruba a página em prod)
if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.info('[supabase] URL em uso:', url);
}
