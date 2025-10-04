// src/components/SignInScreen.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const emailClean = email.trim().toLowerCase();
    if (!emailClean || !password) {
      setErr('Informe e-mail e senha.');
      return;
    }
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
    // deixa o servidor cuidar do redirect através da /dashboard
    window.location.assign('/dashboard');
  }

  return (
    <div className="min-h-screen grid md:grid-cols-[minmax(0,1fr)_460px] bg-[var(--bg)]">
      {/* Coluna do vídeo — escondido no mobile e mais estreito no desktop */}
      <div className="relative hidden md:block">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay muted loop playsInline preload="metadata"
          poster="/images/login-poster.jpg" src="/videos/video-login.mp4"
        />
        <div className="pointer-events-none absolute inset-0 bg-black/25" />
      </div>

      {/* Coluna do formulário */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <form onSubmit={handleSignIn} className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h1 className="mb-4 text-2xl font-semibold text-stone-100">Marba Giotto – Acesso</h1>

          {err && <p className="mb-3 text-sm text-red-400">{err}</p>}

          <label className="mb-1 block text-sm text-stone-300">E-mail</label>
          <input
            type="email" value={email} onChange={(e)=>setEmail(e.target.value)}
            className="mb-3 w-full rounded-md bg-stone-900 px-3 py-2 text-stone-100 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-amber-400"
            placeholder="voce@email.com" autoComplete="email"
          />

          <label className="mb-1 block text-sm text-stone-300">Senha</label>
          <input
            type="password" value={password} onChange={(e)=>setPassword(e.target.value)}
            className="mb-6 w-full rounded-md bg-stone-900 px-3 py-2 text-stone-100 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-amber-400"
            placeholder="••••••••" autoComplete="current-password"
          />

          <button
            type="submit" disabled={loading}
            className="w-full rounded-md bg-amber-400 px-4 py-2 font-medium text-stone-950 disabled:opacity-60"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>

          {/* Sem botão de "Criar conta" por enquanto */}
        </form>
      </div>
    </div>
  );
}
