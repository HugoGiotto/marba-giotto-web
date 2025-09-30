//src/components/SignInScreen.tsx
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
    if (!email || !password) {
      setErr('Informe e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const msg = error.message?.toLowerCase() ?? '';
        if (msg.includes('invalid')) {
          setErr('E-mail ou senha inválidos.');
        } else {
          setErr(error.message || 'Erro ao entrar.');
        }
        return;
      }
      // sucesso: você pode redirecionar ou recarregar a página
      // window.location.href = '/dashboard';
      window.location.reload();
    } catch (e: unknown) {
      // Falhas de rede ou CORS
      setErr('Não foi possível conectar ao servidor. Tente novamente.');
      // opcional: console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp() {
    setErr(null);
    if (!email || !password) {
      setErr('Informe e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setErr(error.message || 'Erro ao criar conta.');
        return;
      }
      // Se “Auto-confirm” estiver ON no Supabase, já pode logar.
      setErr('Conta criada! Verifique seu e-mail (se necessário) e faça login.');
    } catch {
      setErr('Não foi possível conectar ao servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-slate-900">
      {/* esquerda: vídeo */}
      <div className="relative">
        <video
          className="h-48 w-full object-cover md:h-full" // topo 48 em mobile, full em desktop
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/images/login-poster.jpg" // opcional, fallback
          // disableRemotePlayback // opcional
          src="/videos/video-login.mp4"
        />
        {/* overlay suave opcional */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/30 to-slate-950/0 md:bg-none" />
      </div>

      {/* Formulário */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <form onSubmit={handleSignIn} className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-800/40 p-6">
          <h1 className="mb-4 text-2xl font-semibold text-white">Marba Giotto – Acesso</h1>

          {err && <p className="mb-3 text-sm text-red-400">{err}</p>}

          <label className="mb-1 block text-sm text-slate-200">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-3 w-full rounded-md bg-slate-900 px-3 py-2 text-slate-100 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500"
            placeholder="voce@email.com"
            autoComplete="email"
          />

          <label className="mb-1 block text-sm text-slate-200">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 w-full rounded-md bg-slate-900 px-3 py-2 text-slate-100 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500"
            placeholder="••••••••"
            autoComplete="current-password"
          />

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-emerald-500 px-4 py-2 font-medium text-slate-900 disabled:opacity-60"
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="flex-1 rounded-md bg-slate-700 px-4 py-2 font-medium text-slate-100 disabled:opacity-60"
            >
              Criar conta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
