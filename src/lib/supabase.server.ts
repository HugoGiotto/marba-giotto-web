// src/lib/supabase.server.ts
import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function getServerSupabase() {
  // No Next 15, usar await aqui evita o erro de Promise<ReadonlyRequestCookies>
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // Em RSC o cookie store é somente-leitura; no-op aqui já atende o SSR.
        set(_name: string, _value: string, _options: CookieOptions) {},
        remove(_name: string, _options: CookieOptions) {},
      },
    }
  );

  return supabase;
}

// compat com código antigo
export async function createSupabaseServer() {
  return getServerSupabase();
}
