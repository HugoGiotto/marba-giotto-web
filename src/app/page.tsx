// src/app/page.tsx  (Server Component)
import SignInScreen from '@/components/SignInScreen';
import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase.server';

export default async function Page() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');
  return <SignInScreen />;  // só renderiza, sem useEffect de redirect
}
