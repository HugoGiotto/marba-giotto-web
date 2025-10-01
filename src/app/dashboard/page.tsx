// src/app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabaseServer';
import {
  createPieceAction,
  startTimerAction,
  stopTimerAction,
  addMinutesAction,
  saveMeasurementsAction,
} from './actions';

type TimeEntry = { started_at: string; ended_at: string | null };
type Piece = {
  id: string;
  name: string;
  description: string | null;
  client_email: string | null;
  time_entries: TimeEntry[];
  measurements: {
    width: number | null;
    height: number | null;
    diameter: number | null;
    length: number | null;
    notes: string | null;
  } | null;
};

function fmtTotal(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}m`;
}

export default async function Dashboard() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: pieces } = await supabase
    .from('pieces')
    .select(`
      id, name, description, client_email,
      time_entries ( started_at, ended_at ),
      measurements ( width, height, diameter, length, notes )
    `)
    .order('created_at', { ascending: false }) as { data: Piece[] | null };

  return (
    <div className="p-6 text-slate-100 space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Criar peça */}
      <form action={createPieceAction} className="grid gap-2 rounded-xl bg-slate-800/40 p-4 border border-white/10 max-w-xl">
        <h2 className="font-semibold">Nova peça</h2>
        <input name="name" placeholder="Nome da peça" className="rounded bg-slate-900 px-3 py-2 ring-1 ring-white/10" required />
        <input name="client_email" placeholder="E-mail do cliente (opcional)" className="rounded bg-slate-900 px-3 py-2 ring-1 ring-white/10" />
        <textarea name="description" placeholder="Descrição (opcional)" className="rounded bg-slate-900 px-3 py-2 ring-1 ring-white/10" />
        <button className="justify-self-start rounded bg-emerald-500 text-slate-900 px-4 py-2">Criar</button>
      </form>

      {/* Lista de peças */}
      <div className="grid gap-4 md:grid-cols-2">
        {(pieces ?? []).map((p) => {
          const totalSeconds = (p.time_entries ?? []).reduce((acc, te) => {
            if (!te.ended_at) return acc; // só fechadas contam no total
            const a = new Date(te.started_at).getTime();
            const b = new Date(te.ended_at).getTime();
            return acc + Math.max(0, Math.floor((b - a) / 1000));
          }, 0);
          const hasActive = (p.time_entries ?? []).some(te => te.ended_at === null);

          return (
            <div key={p.id} className="rounded-xl border border-white/10 bg-slate-800/40 p-4 space-y-4">
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  <p className="text-sm text-white/70">{p.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white/60">Total</div>
                  <div className="text-xl font-mono">{fmtTotal(totalSeconds)}</div>
                  {hasActive && <div className="text-xs text-amber-300">⏱ em andamento…</div>}
                </div>
              </div>

              {/* Cronômetro */}
              <div className="flex gap-2">
                <form action={startTimerAction}>
                  <input type="hidden" name="piece_id" value={p.id} />
                  <button className="rounded bg-emerald-500 text-slate-900 px-3 py-2">Iniciar</button>
                </form>
                <form action={stopTimerAction}>
                  <input type="hidden" name="piece_id" value={p.id} />
                  <button className="rounded bg-rose-500 text-slate-900 px-3 py-2">Parar</button>
                </form>
                <form action={addMinutesAction} className="flex items-center gap-2">
                  <input type="hidden" name="piece_id" value={p.id} />
                  <input name="minutes" type="number" min={1} placeholder="min" className="w-20 rounded bg-slate-900 px-2 py-2 ring-1 ring-white/10" />
                  <button className="rounded bg-slate-700 px-3 py-2">Adicionar</button>
                </form>
              </div>

              {/* Medidas */}
              <form action={saveMeasurementsAction} className="grid grid-cols-2 gap-2">
                <input type="hidden" name="piece_id" value={p.id} />
                <input name="width" defaultValue={p.measurements?.width ?? ''} placeholder="Largura" className="rounded bg-slate-900 px-3 py-2 ring-1 ring-white/10" />
                <input name="height" defaultValue={p.measurements?.height ?? ''} placeholder="Altura" className="rounded bg-slate-900 px-3 py-2 ring-1 ring-white/10" />
                <input name="diameter" defaultValue={p.measurements?.diameter ?? ''} placeholder="Diâmetro" className="rounded bg-slate-900 px-3 py-2 ring-1 ring-white/10" />
                <input name="length" defaultValue={p.measurements?.length ?? ''} placeholder="Comprimento" className="rounded bg-slate-900 px-3 py-2 ring-1 ring-white/10" />
                <textarea name="notes" defaultValue={p.measurements?.notes ?? ''} placeholder="Observações" className="col-span-2 rounded bg-slate-900 px-3 py-2 ring-1 ring-white/10" />
                <div className="col-span-2">
                  <button className="rounded bg-slate-700 px-3 py-2">Salvar medidas</button>
                </div>
              </form>

              {p.client_email && (
                <div className="text-xs text-white/60">Cliente: {p.client_email}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
