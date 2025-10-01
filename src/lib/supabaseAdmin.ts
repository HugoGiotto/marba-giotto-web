//src/lib/supabaseAdmin.ts

import 'server-only';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;           // ok expor a URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE!;       // segredo!

export const supabaseAdmin = createClient(url, serviceRole, {
  auth: { persistSession: false },
});
