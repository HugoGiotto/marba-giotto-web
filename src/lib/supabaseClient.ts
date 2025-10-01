// src/lib/supabaseClient.ts
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// const fn = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL; // (opcional, mas vamos omitir)

let client: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  // ✅ sem o 3º parâmetro "functions"
  client = createBrowserClient(url, anon);
  return client;
}

export const supabase = getSupabaseClient();

// debug só em dev
if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  console.info('[supabase] URL em uso:', url);
}
