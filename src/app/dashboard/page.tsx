// src/app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabaseServer';

export default async function Dashboard() {
  const supabase = await getServerSupabase(); // <- COM await
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single();

  return (
    <div className="p-6 text-slate-100">
      <h1 className="text-xl font-bold">Dashboard</h1>
      <p>Olá, {profile?.name ?? 'sem nome'} — role: {profile?.role}</p>
    </div>
  );
}
