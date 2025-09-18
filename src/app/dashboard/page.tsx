//src/app/dashboard/page.tsx
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export default async function Dashboard() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="p-6 text-slate-100">Você precisa estar logado.</div>;

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

