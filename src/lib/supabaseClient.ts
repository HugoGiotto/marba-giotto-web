// src/lib/supabaseClient.ts
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const fn   = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;

let client: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  client = createBrowserClient(url, anon, fn ? { functions: { url: fn } } : undefined);
  return client;
}

export const supabase = getSupabaseClient();

// (debug em dev)
if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.info('[supabase] URL em uso:', url);
}
