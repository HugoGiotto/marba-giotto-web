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
    if (!emailClean || !password) return setErr('Informe e-mail e senha.');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: emailClean, password });
    setLoading(false);
    if (error) {
      const msg = (error.message || '').toLowerCase();
      setErr(msg.includes('invalid') ? 'E-mail ou senha inválidos.'
        : msg.includes('confirm') ? 'E-mail não confirmado.'
        : 'Erro ao entrar.');
      return;
    }
    window.location.assign('/dashboard');
  }

  return (
    <div className="min-h-screen grid md:grid-cols-[minmax(0,1fr)_460px]">
      {/* vídeo à esquerda, escondido no mobile */}
      <div className="relative hidden md:block">
        <video className="absolute inset-0 h-full w-full object-cover"
          autoPlay muted loop playsInline preload="metadata"
          poster="/images/login-poster.jpg" src="/videos/video-login.mp4" />
        <div className="pointer-events-none absolute inset-0 bg-black/25" />
      </div>

      {/* formulário à direita */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <form onSubmit={handleSignIn}
              className="w-full max-w-md card">
          <h1 className="mb-4 text-2xl font-semibold">Marba Giotto – Acesso</h1>

          {err && <p className="mb-3 text-sm" style={{color:'#e66'}}>{err}</p>}

          <label className="mb-1 block text-sm text-[var(--muted)]">E-mail</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                 className="mb-3 w-full rounded-md bg-[var(--surface)] px-3 py-2 text-[var(--ink)] outline-none ring-token"
                 placeholder="voce@email.com" autoComplete="email" />

          <label className="mb-1 block text-sm text-[var(--muted)]">Senha</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                 className="mb-6 w-full rounded-md bg-[var(--surface)] px-3 py-2 text-[var(--ink)] outline-none ring-token"
                 placeholder="••••••••" autoComplete="current-password" />

          <button type="submit" disabled={loading}
                  className="btn w-full"
                  style={{ background:"var(--brand)", color:"#111", opacity:loading? .6:1 }}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
          {/* sem botão "Criar conta" por enquanto */}
        </form>
      </div>
    </div>
  );
}
