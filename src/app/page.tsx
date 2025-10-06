// src/app/page.tsx  (Server Component)
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setErr('Informe e-mail e senha.');
    router.push('/dashboard');
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Coluna do vídeo */}
      <div className="relative hidden lg:block">
        {/* Coloque o arquivo em /public/login.mp4 (ou troque o src abaixo) */}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/login.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/login-poster.jpg"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Coluna do formulário */}
      <div className="flex items-center justify-center p-6">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow"
        >
          <h1 className="mb-1 text-2xl font-semibold">Marba Giotto – Acesso</h1>
          {err && <p className="mb-4 text-sm" style={{ color: '#e57373' }}>{err}</p>}

          <label className="mb-1 mt-4 block text-sm muted">E-mail</label>
          <input
            type="email"
            className="input w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            autoComplete="email"
          />

          <label className="mb-1 mt-4 block text-sm muted">Senha</label>
          <input
            type="password"
            className="input w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="submit" disabled={loading} className="btn btn-start w-full">
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
            <Link href="/signup" className="btn btn-outline w-full text-center">
              Criar conta
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
