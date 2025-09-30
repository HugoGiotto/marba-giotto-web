// src/lib/supabaseClient.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseFunctionsUrl = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;

// Mensagem de erro amigável se as envs não existirem
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase envs ausentes. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

let browserClient: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
  if (browserClient) return browserClient;

  browserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    // Opcional: se não passar, o SDK usa `${supabaseUrl}/functions/v1`
    ...(supabaseFunctionsUrl
      ? { functions: { url: supabaseFunctionsUrl } }
      : {}),
  });

  return browserClient;
}

export const supabase = getSupabaseClient();

// Debug só em dev (sem expor chaves)
if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.info('[supabase] URL em uso:', supabaseUrl);
}
