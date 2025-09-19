
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