// src/lib/supabaseClient.ts
import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !anon) {
  throw new Error('Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createBrowserClient(url, anon, {
  cookies: {
    get(name: string) {
      const m = document.cookie.split('; ').find((c) => c.startsWith(name + '='));
      return m?.split('=')[1];
    },
    set(name: string, value: string, opts: any = {}) {
      let c = `${name}=${value}; Path=${opts.path ?? '/'}; SameSite=${opts.sameSite ?? 'Lax'}; Secure`;
      if (opts.maxAge) c += `; Max-Age=${opts.maxAge}`;
      if (opts.expires) c += `; Expires=${new Date(opts.expires).toUTCString()}`;
      document.cookie = c;
    },
    remove(name: string, opts: any = {}) {
      document.cookie = `${name}=; Path=${opts.path ?? '/'}; Max-Age=0`;
    },
  },
});
