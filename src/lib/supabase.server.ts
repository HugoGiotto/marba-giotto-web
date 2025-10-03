// src/lib/supabase.server.ts
import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function getServerSupabase() {
  const store = await cookies(); // Next 15: Promise

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

// opcional para legado:
export const createSupabaseServer = getServerSupabase;
