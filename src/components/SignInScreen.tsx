//src/components/SignInScreen.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string|undefined>();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/dashboard');
    });
  }, [router]);

  const signIn = async () => {
    setErr(undefined);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErr(error.message); else router.replace('/dashboard');
  };

  const signUp = async () => {
    setErr(undefined);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setErr(error.message); else router.replace('/dashboard');
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-slate-900">
      {/* esquerda: vídeo */}
      <div className="hidden md:block relative">
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src="/video-login.mp4"
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* direita: formulário */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm bg-slate-800/70 border border-slate-700 rounded-2xl p-6">
          <h1 className="text-center text-2xl font-bold text-slate-100 mb-6">Marba Giotto – Acesso</h1>
          {!!err && <div className="text-red-400 text-sm mb-3">{err}</div>}

          <label className="block text-slate-300 text-sm">E-mail</label>
          <input
            className="w-full mt-1 mb-3 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 outline-none"
            value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@email.com"
          />

          <label className="block text-slate-300 text-sm">Senha</label>
          <input
            type="password"
            className="w-full mt-1 mb-4 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 outline-none"
            value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"
          />

          <div className="flex gap-3">
            <button onClick={signIn} className="flex-1 py-2 rounded-lg bg-emerald-500 font-semibold text-slate-900">Entrar</button>
            <button onClick={signUp} className="flex-1 py-2 rounded-lg bg-slate-700 font-semibold text-slate-100">Criar conta</button>
          </div>
        </div>
      </div>
    </div>
  );
}
