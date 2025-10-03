// src/lib/supabaseClient.ts
import { createBrowserClient, type CookieOptions } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !anon) {
  throw new Error('Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

function enc(v: string) {
  return encodeURIComponent(v);
}
function dec(v: string) {
  try { return decodeURIComponent(v); } catch { return v; }
}

export const supabase = createBrowserClient(url, anon, {
  cookies: {
    get(name: string): string | null {
      const prefix = `${name}=`;
      const hit = document.cookie.split('; ').find((c) => c.startsWith(prefix));
      return hit ? dec(hit.slice(prefix.length)) : null;
    },
    set(name: string, value: string, options: CookieOptions): void {
      const parts: string[] = [
        `${name}=${enc(value)}`,
        `Path=${options?.path ?? '/'}`,
        `SameSite=${options?.sameSite ?? 'Lax'}`,
      ];
      if (options?.domain) parts.push(`Domain=${options.domain}`);
      if (options?.maxAge) parts.push(`Max-Age=${options.maxAge}`);
      if (options?.expires) parts.push(`Expires=${new Date(options.expires).toUTCString()}`);
      if (typeof window !== 'undefined' && window.location.protocol === 'https:') parts.push('Secure');
      document.cookie = parts.join('; ');
    },
    remove(name: string, options: CookieOptions): void {
      const parts: string[] = [
        `${name}=`,
        `Path=${options?.path ?? '/'}`,
        'Max-Age=0',
        'SameSite=Lax',
      ];
      if (options?.domain) parts.push(`Domain=${options.domain}`);
      if (typeof window !== 'undefined' && window.location.protocol === 'https:') parts.push('Secure');
      document.cookie = parts.join('; ');
    },
  },
});
