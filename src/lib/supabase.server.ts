// src/lib/supabase.server.ts
import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export function getServerSupabase() {
  const cookieStore = cookies(); // ReadonlyRequestCookies

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value ?? null;
        },
        // Em RSC o cookie store é somente-leitura; tentar escrever lança erro.
        // Mantemos as chamadas num try/catch para usar os parâmetros e evitar warnings.
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            /* no-op em RSC */
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 });
          } catch {
            /* no-op em RSC */
          }
        },
      },
    }
  );
}

// Back-compat com código antigo que fazia `await createSupabaseServer()`
export async function createSupabaseServer() {
  return getServerSupabase();
}
