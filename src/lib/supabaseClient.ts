// src/lib/supabaseClient.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Garantimos singleton no browser para não recriar a cada import
let browserClient: SupabaseClient | undefined;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseFunctionsUrl = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;

// Valida envs em build/run (ajuda a evitar "undefined" em produção)
if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabaseClient] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY ausentes. ' +
      'Configure no Vercel (Environment Variables) e no .env.local.'
  );
}

export function getSupabaseClient(): SupabaseClient {
  if (browserClient) return browserClient;

  browserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true, // importante para magic links / OAuth
    },
    // Se você usa Edge Functions via cliente:
    ...(supabaseFunctionsUrl
      ? { functions: { url: supabaseFunctionsUrl } }
      : {}),
  });

  return browserClient;
}

// Use este export direto quando for comum em Client Components:
// import { supabase } from '@/lib/supabaseClient'
export const supabase = getSupabaseClient();
