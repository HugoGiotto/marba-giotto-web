// app/debug/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Debug() {
  const [out, setOut] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setOut({
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSession: !!session,
      });
    })();
  }, []);

  return <pre>{JSON.stringify(out, null, 2)}</pre>;
}
