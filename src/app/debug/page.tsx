// app/debug/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type DebugOut = {
  url: string;
  hasSession: boolean;
};

export default function DebugPage() {
  const [out, setOut] = useState<DebugOut | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setOut({
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
        hasSession: Boolean(session),
      });
    })();
  }, []);

  return <pre>{JSON.stringify(out, null, 2)}</pre>;
}
