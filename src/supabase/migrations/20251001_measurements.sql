-- 20251001_measurements.sql
-- Tabela de medidas por peça (1:1 com pieces)
create table if not exists public.measurements (
  piece_id uuid primary key references public.pieces(id) on delete cascade,
  width numeric,
  height numeric,
  diameter numeric,
  length numeric,
  unit text check (unit in ('cm','mm','m','pol')) default 'cm',
  updated_at timestamptz not null default now()
);

alter table public.measurements enable row level security;

-- Dono da peça pode ler
create policy if not exists "read own measurement"
on public.measurements for select
using (
  exists (
    select 1 from public.pieces p
    where p.id = measurements.piece_id and p.user_id = auth.uid()
  )
);

-- Dono da peça pode inserir
create policy if not exists "insert own measurement"
on public.measurements for insert
with check (
  exists (
    select 1 from public.pieces p
    where p.id = measurements.piece_id and p.user_id = auth.uid()
  )
);

-- Dono da peça pode atualizar
create policy if not exists "update own measurement"
on public.measurements for update
using (
  exists (
    select 1 from public.pieces p
    where p.id = measurements.piece_id and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.pieces p
    where p.id = measurements.piece_id and p.user_id = auth.uid()
  )
);

-- Trigger de updated_at
create or replace function public.touch_measurements_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_touch_measurements on public.measurements;
create trigger trg_touch_measurements
before update on public.measurements
for each row execute procedure public.touch_measurements_updated_at();
