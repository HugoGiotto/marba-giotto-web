// src/lib/supabaseClient.ts
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  throw new Error('Faltam NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

let client: SupabaseClient | undefined;

export function getSupabaseClient() {
  if (!client) {
    client = createBrowserClient(url, anon, {
      cookies: { // browser: `@supabase/ssr` cuida do storage de sessão/cookies
        get() { return null; }, set() {}, remove() {},
      },
    });
  }
  return client;
}

export const supabase = getSupabaseClient();

// debug opcional em dev
if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.info('[supabase] URL em uso:', url);
}
