// src/lib/supabaseClient.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const fn   = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;

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

// debug só em dev
if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  console.info('[supabase] URL em uso:', url);
}
