// app/admin/actions.ts
'use server';
import { createSupabaseServer } from '@/lib/supabaseServer';

export async function getUserProfile() {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.from('profiles').select('*').single();
  if (error) throw error;
  return data;
}
