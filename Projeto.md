
git add -A
git commit -m "chore: supabase env + @supabase/ssr"
git push origin main


Deploy via GitHub (auto)
git add -A
git commit -m "deploy"
git push origin main


Deploy direto pelo Vercel CLI (manual)
# 1) vincule a pasta ao projeto (já está, mas deixo o comando)
npx vercel link --scope hugogiottos-projects --project marba-giotto-web

# 2) confira as ENVs de produção
npx vercel env ls --environment=production

# 3) crie um novo deploy de produção
npx vercel deploy --prod

# 4) abrir no navegador
open https://vercel.com/hugogiottos-projects/marba-giotto-web


Se precisou ajustar uma env:
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
# repita para as demais
npx vercel deploy --prod


Supabase: banco e functions:
supabase login
supabase link --project-ref uujvwpcpnbvfgcvqgql
supabase db push
# functions, se houver:
# supabase functions deploy minha-func



==================

Opção B — Manter estático no mobile (imagem) e vídeo só no desktop
<div className="relative">
  {/* imagem para mobile */}
  <img
    src="/images/login-poster.jpg"
    alt=""
    className="block h-48 w-full object-cover md:hidden"
    loading="eager"
  />
  {/* vídeo só ≥ md */}
  <video
    className="hidden md:block md:h-full md:w-full md:object-cover"
    autoPlay
    muted
    loop
    playsInline
    preload="metadata"
    poster="/images/login-poster.jpg"
    src="/videos/login-hero.mp4"
  />
</div>


ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1anZ3cGNwbmJ2Zmd2Y3F2Z3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MTE0NTksImV4cCI6MjA3MzA4NzQ1OX0.Zu4qnWbDycxG13cHuOncBS0LH_yvsIttIDZYe7JGG_M'


curl -i -X POST 'https://uujvwpcpnbvfgvcqvgql.supabase.co/auth/v1/token?grant_type=password' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1anZ3cGNwbmJ2Zmd2Y3F2Z3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MTE0NTksImV4cCI6MjA3MzA4NzQ1OX0.Zu4qnWbDycxG13cHuOncBS0LH_yvsIttIDZYe7JGG_M' \
  -H 'Content-Type: application/json' \
  -d '{"email":"ateliemabagiotto@gmail.com","password":"Mg@41540@"}'


SERVICE_ROLE='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1anZ3cGNwbmJ2Zmd2Y3F2Z3FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzUxMTQ1OSwiZXhwIjoyMDczMDg3NDU5fQ.O-3acntEAc_CCNSGE7TS-7YKDEdxWz0CHJvxAq5TcFY'
USER_ID='66631655-f571-40f3-b042-ac9500f6187c'

curl -X PATCH "https://uujvwpcpnbvfgvcqvgql.supabase.co/auth/v1/admin/users/$USER_ID" \
  -H "apikey: $SERVICE_ROLE" -H "Authorization: Bearer $SERVICE_ROLE" \
  -H "Content-Type: application/json" \
  -d '{"password": "Mg@41540@"}'




===========


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


========