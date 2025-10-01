// src/lib/supabaseServer.ts
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export function createServerSupabase() {
  const cookieStore = cookies(); // Readonly no Server Component

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // no Server Component não dá pra mutar cookies; deixamos no-op
        set(_name: string, _value: string, _options: CookieOptions) {},
        remove(_name: string, _options: CookieOptions) {},
      },
    }
  );
}
