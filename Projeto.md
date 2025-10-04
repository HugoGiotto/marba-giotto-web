
git add -A
git commit -m "chore: supabase env + @supabase/ssr"
git push origin main


Deploy via GitHub (auto)
git add -A
git commit -m "deploy"
git push origin main


ateliemarbagiotto@gmail.com
Mg@41540@


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


eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1anZ3cGNwbmJ2Zmd2Y3F2Z3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MTE0NTksImV4cCI6MjA3MzA4NzQ1OX0.Zu4qnWbDycxG13cHuOncBS0LH_yvsIttIDZYe7JGG_M

curl -i "https://uujvwpcpnbvfgvcqvgql.supabase.co/auth/v1/health" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1anZ3cGNwbmJ2Zmd2Y3F2Z3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MTE0NTksImV4cCI6MjA3MzA4NzQ1OX0.Zu4qnWbDycxG13cHuOncBS0LH_yvsIttIDZYe7JGG_M"



curl -sS -X POST \
  'https://uujvwpcpnbvfgvcqvgql.supabase.co/auth/v1/token?grant_type=password' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1anZ3cGNwbmJ2Zmd2Y3F2Z3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MTE0NTksImV4cCI6MjA3MzA4NzQ1OX0.Zu4qnWbDycxG13cHuOncBS0LH_yvsIttIDZYe7JGG_M' \
  -H 'Content-Type: application/json' \
  -d '{"email":"ateliemarbagiotto@gmail.com","password":"Mg@41540@"}'



curl -i -X POST 'https://uujvwpcpnbvfgvcqvgql.supabase.co/auth/v1/token?grant_type=password' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1anZ3cGNwbmJ2Zmd2Y3F2Z3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MTE0NTksImV4cCI6MjA3MzA4NzQ1OX0.Zu4qnWbDycxG13cHuOncBS0LH_yvsIttIDZYe7JGG_M' \
  -H 'Content-Type: application/json' \
  -d '{"email":"ateliemarbagiotto@gmail.com","password":"Mg@41540@"}'






export USER_ID='5b7bbffd-cf73-4b1c-bf95-419686252f2e'

curl -sS -X POST "https://${PROJECT_REF}.supabase.co/rest/v1/profiles" \
  -H "apikey: ${SERVICE_ROLE}" \
  -H "Authorization: Bearer ${SERVICE_ROLE}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"id\": \"${USER_ID}\",
    \"email\": \"ateliemarbagiotto@gmail.com\",
    \"name\": \"Ateliê Marba Giotto\",
    \"role\": \"user\"
  }"

========


mkdir -p tmp-icons
magick convert tmp-icons/icon-256.png src/app/favicon.ico

magick convert icon-256.png favicon.ico
mv favicon.ico src/app/favicon.ico


O vídeo está grande, poderia diminuir, talvez colocar em um form com duas colunas esquerda o vídeo e direita login




grep -R "from '@/lib/supabaseServer'" src

grep -R "from '@/lib'" src | grep -v "from '@/lib/supabaseClient'" | grep -v "from '@/lib/supabase.server'"


============

begin;

-- Se tiver objetos no bucket 'piece-photos', apague-os manualmente no Storage (UI) ou via API.
-- Tabelas de atividade primeiro, depois 'pieces'.
truncate table public.piece_sessions restart identity cascade;
truncate table public.time_entries  restart identity cascade;
truncate table public.measurements  restart identity cascade;
truncate table public.pieces        restart identity cascade;

commit;


===============

@import "tailwindcss";

:root{
  --bg:#151311;
  --surface:#1f1b18;
  --ink:#f4efe9;
  --muted:#cfc7bd;
  --border:rgba(255,255,255,.08);
  --accent:#d6b692;
  --accent-2:#a68b6a;
}

/* Use estas variáveis */
html,body{ background:linear-gradient(180deg,#1b1714,#151311 40%,#1b1714); color:var(--ink); }

/* remova o bloco que recoloca --background/--foreground,
   ou defina-os coerentes com a paleta: */
:root{
  --background: transparent;  /* já usamos o gradient acima */
  --foreground: var(--ink);
}

body {
  font-family: Arial, Helvetica, sans-serif;
}


===============