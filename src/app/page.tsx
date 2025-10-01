// src/app/page.tsx
import SignInScreen from '@/components/SignInScreen';
import { getServerSupabase } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';

export default async function Page() {
  const supabase = await getServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (session) redirect('/dashboard');
  return <SignInScreen />;
}
