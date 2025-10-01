// src/lib/supabaseServer.ts
import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function getServerSupabase() {
  // Next 15: em Server Actions cookies() é Promise
  const store = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          store.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          store.set({ name, value: '', ...options });
        },
      },
    }
  );
}

// Alias p/ código legado que ainda importa createSupabaseServer
export const createSupabaseServer = getServerSupabase;
