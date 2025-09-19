// src/lib/supabaseServer.ts (opcional futuramente)
import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export function createSupabaseServer() {
  const cookieStore = cookies();
  const supa = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {}, // Next 15: use server actions para setar cookies, se necessário
        remove() {},
      },
      ...(process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL
        ? { functions: { url: process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL } }
        : {}),
      global: { headers: { 'x-forwarded-host': headers().get('host') ?? '' } },
    }
  );
  return supa;
}
