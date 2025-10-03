// src/components/SignInScreen.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Se já houver sessão no CLIENT, manda para o dashboard (sem SSR).
  useEffect(() => {
    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      if (data.session) router.replace('/dashboard');
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (session) router.replace('/dashboard');
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const emailClean = email.trim().toLowerCase();
    if (!emailClean || !password) return setErr('Informe e-mail e senha.');

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: emailClean, password });
    setLoading(false);

    if (error) {
      const msg = (error.message || '').toLowerCase();
      setErr(
        msg.includes('invalid') ? 'E-mail ou senha inválidos.' :
        msg.includes('confirm') ? 'E-mail não confirmado.' :
        'Erro ao entrar.'
      );
      return;
    }

    router.replace('/dashboard');
  }

  async function handleSignUp() {
    setErr(null);
    const emailClean = email.trim().toLowerCase();
    if (!emailClean || !password) return setErr('Informe e-mail e senha.');

    setLoading(true);
    const { error } = await supabase.auth.signUp({ email: emailClean, password });
    setLoading(false);

    if (error) return setErr(error.message || 'Erro ao criar conta.');
    setErr('Conta criada! Verifique seu e-mail e faça login.');
  }

  return (
    <main className="min-h-screen grid md:grid-cols-[1.2fr_1fr] bg-[var(--bg)]">
      {/* Coluna do vídeo (escondida no mobile para economizar) */}
      <section className="relative hidden md:block">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/videos/video-login.mp4"
          poster="/images/login-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
        <div className="absolute inset-0 bg-black/30" />
      </section>

      {/* Coluna do formulário */}
      <section className="flex items-center justify-center p-6 md:p-10">
        <form
          onSubmit={handleSignIn}
          className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
        >
          <h1 className="mb-4 text-2xl font-semibold text-stone-100">
            Marba Giotto – Acesso
          </h1>

          {err && (
            <p className="mb-3 text-sm text-red-400" aria-live="polite">
              {err}
            </p>
          )}

          <label className="mb-1 block text-sm text-stone-300" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-3 w-full rounded-md bg-stone-900 px-3 py-2 text-stone-100 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-amber-400"
            placeholder="voce@email.com"
            autoComplete="email"
          />

          <label className="mb-1 block text-sm text-stone-300" htmlFor="password">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 w-full rounded-md bg-stone-900 px-3 py-2 text-stone-100 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-amber-400"
            placeholder="••••••••"
            autoComplete="current-password"
          />

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-amber-400 px-4 py-2 font-medium text-stone-950 disabled:opacity-60"
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="flex-1 rounded-md bg-stone-700 px-4 py-2 font-medium text-stone-100 disabled:opacity-60"
            >
              Criar conta
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
