// src/lib/supabaseServer.ts
import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export function createSupabaseServer() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Em Server Actions / Route Handlers, cookies() permite set/remove.
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
      ...(process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL
        ? { functions: { url: process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL } }
        : {}),
      global: {
        headers: {
          // útil atrás de proxy/CDN
          'x-forwarded-host': headers().get('host') ?? '',
        },
      },
    }
  );

  return supabase;
}
