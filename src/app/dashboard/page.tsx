// src/app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabaseServer';
import DashboardApp from '@/components/DashboardApp';

export default async function DashboardPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  return <DashboardApp userId={user.id} />;
}
