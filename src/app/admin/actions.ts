// src/app/admin/actions.ts
'use server';
import { createSupabaseServer } from '@/lib/supabaseServer';

export async function getUserProfile() {
  const supabase = await createSupabaseServer(); // <- COM await
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single();

  return { user, profile };
}
