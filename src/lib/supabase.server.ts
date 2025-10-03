// src/lib/supabase.server.ts
import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function getServerSupabase() {
  // cookies() pode ser Promise em Next 15 → aguardamos e tipamos como any pra evitar erros de TS quando for readonly
  const cookieStore = (await cookies()) as any;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore?.get?.(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Em RSC pode ser readonly: ignore se não puder escrever
          try { cookieStore?.set?.(name, value, options); } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore?.set?.(name, '', { ...options, maxAge: 0 }); } catch {}
        },
      },
    }
  );

  return supabase;
}

// compat
export async function createSupabaseServer() {
  return getServerSupabase();
}
