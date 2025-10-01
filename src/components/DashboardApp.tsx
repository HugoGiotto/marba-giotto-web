// src/components/DashboardApp.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase as supabaseClient } from '@/lib/supabaseClient';

type Piece = {
  id: string;
  user_id: string;
  name: string;
  client_email: string | null;
  description: string | null;
  unit: 'cm' | 'mm' | 'm' | 'pol';
  measures: { largura?: number; altura?: number; diametro?: number; comprimento?: number };
  notes: string | null;
  created_at: string;
  updated_at: string;
};
type Session = {
  id: string;
  piece_id: string;
  start_at: string;
  end_at: string;
  duration_ms: number;
  created_at: string;
};

function pad(n: number) { return String(n).padStart(2, '0'); }
function fmtHMS(ms: number) {
  const s = Math.floor(ms / 1000);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${pad(hh)}h${pad(mm)}m${pad(ss)}s`;
}
function parseNum(v: string) {
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

export default function DashboardApp({ userId }: { userId: string }) {
  const supabase: SupabaseClient = supabaseClient;

  // dados
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  // form nova peça
  const [pName, setPName] = useState('');
  const [pEmail, setPEmail] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [loading, setLoading] = useState(false);

  // timer
  const [runningMs, setRunningMs] = useState(0);
  const startRef = useRef<number | null>(null);
  const tickRef  = useRef<ReturnType<typeof setInterval> | null>(null);


  const piece = useMemo(() => pieces.find(p => p.id === selected) || null, [pieces, selected]);
  const pieceSessions = useMemo(() => sessions.filter(s => s.piece_id === selected), [sessions, selected]);
  const totalMs = useMemo(() => pieceSessions.reduce((a, s) => a + (s.duration_ms || 0), 0), [pieceSessions]);

  // carregar dados
  useEffect(() => {
    (async () => {
      const { data: ps } = await supabase
        .from('pieces')
        .select('*')
        .order('created_at', { ascending: false });

      setPieces(ps || []);
      if (!selected && ps && ps.length) setSelected(ps[0].id);

      const { data: ss } = await supabase
        .from('piece_sessions')
        .select('*')
        .order('start_at', { ascending: false });

      setSessions(ss || []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // timer loop
  useEffect(() => {
    if (startRef.current != null) {
      tickRef.current = setInterval(() => {
        setRunningMs(Date.now() - (startRef.current as number));
      }, 200);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  async function createPiece() {
    if (!pName.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('pieces')
      .insert({
        user_id: userId,
        name: pName.trim(),
        client_email: pEmail.trim() || null,
        description: pDesc.trim() || null,
        unit: 'cm',
        measures: {},
        notes: null,
      })
      .select()
      .single();

    setLoading(false);
    if (error) return alert(error.message);
    setPieces(prev => [data as Piece, ...prev]);
    setSelected((data as Piece).id);
    setPName(''); setPEmail(''); setPDesc('');
  }

  async function saveMeasures(next: Partial<Piece['measures']> & { unit?: Piece['unit'] }) {
    if (!piece) return;
    const measures = { ...(piece.measures || {}), ...next };
    const { data, error } = await supabase
      .from('pieces')
      .update({ measures, unit: (next.unit || piece.unit) })
      .eq('id', piece.id)
      .select()
      .single();
    if (error) return alert(error.message);
    setPieces(prev => prev.map(p => p.id === piece.id ? (data as Piece) : p));
  }

  async function saveNotes(text: string) {
    if (!piece) return;
    const { data, error } = await supabase
      .from('pieces')
      .update({ notes: text })
      .eq('id', piece.id)
      .select()
      .single();
    if (error) return alert(error.message);
    setPieces(prev => prev.map(p => p.id === piece.id ? (data as Piece) : p));
  }

  function startTimer() {
    if (startRef.current != null) return;
    startRef.current = Date.now();
    // inicia o loop aqui
    tickRef.current = setInterval(() => {
        if (startRef.current != null) {
        setRunningMs(Date.now() - startRef.current);
        }
    }, 200);
    }

    function pauseTimer() {
    if (startRef.current == null) return;
    setRunningMs(Date.now() - startRef.current);
    startRef.current = null;
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    }

    function resetTimer() {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    startRef.current = null;
    setRunningMs(0);
    }

    // mantém só a limpeza no unmount
    useEffect(() => {
    return () => {
        if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    };
    }, []);


  async function endSession() {
    const now = Date.now();
    const started = startRef.current ?? (now - runningMs);
    if (!piece || !started) return;

    const startISO = new Date(started).toISOString();
    const endISO = new Date(now).toISOString();
    const duration = now - started;

    const { data, error } = await supabase
      .from('piece_sessions')
      .insert({
        piece_id: piece.id,
        start_at: startISO,
        end_at: endISO,
        duration_ms: duration,
      })
      .select()
      .single();

    if (error) return alert(error.message);
    setSessions(prev => [data as Session, ...prev]);
    resetTimer();
  }

  async function deleteSession(id: string) {
    const { error } = await supabase.from('piece_sessions').delete().eq('id', id);
    if (error) return alert(error.message);
    setSessions(prev => prev.filter(s => s.id !== id));
  }

  function exportCsv() {
    if (!piece) return;
    const rows: (string | number)[][] = [];
    rows.push(['Peça', piece.name]);
    rows.push(['Unidade', piece.unit]);
    rows.push(['Largura', 'Altura', 'Diâmetro', 'Comprimento'].map(h => `${h} (${piece.unit})`));
    rows.push([
      piece.measures?.largura ?? '',
      piece.measures?.altura ?? '',
      piece.measures?.diametro ?? '',
      piece.measures?.comprimento ?? '',
    ]);
    rows.push([]);
    rows.push(['Total', fmtHMS(totalMs)]);
    rows.push([]);
    rows.push(['Sessões']);
    rows.push(['Início', 'Fim', 'Duração']);
    pieceSessions.forEach(s => rows.push([
      new Date(s.start_at).toLocaleString(),
      new Date(s.end_at).toLocaleString(),
      fmtHMS(s.duration_ms),
    ]));
    rows.push([]);
    rows.push(['Notas']);
    rows.push([piece.notes?.replace(/\n/g, ' ') || '']);

    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = (piece.name || 'peca') + '.csv';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-5xl p-4 text-slate-100">
      <h1 className="mb-4 text-2xl font-semibold">Dashboard</h1>

      {/* Nova peça */}
      <div className="mb-6 rounded-xl border border-white/10 bg-slate-700/30 p-4">
        <h2 className="mb-2 font-medium">Nova peça</h2>
        <div className="grid gap-2 md:grid-cols-3">
          <input className="rounded-md bg-slate-900 px-3 py-2" placeholder="Nome da peça"
                 value={pName} onChange={e => setPName(e.target.value)} />
          <input className="rounded-md bg-slate-900 px-3 py-2" placeholder="E-mail do cliente (opcional)"
                 value={pEmail} onChange={e => setPEmail(e.target.value)} />
          <input className="rounded-md bg-slate-900 px-3 py-2 md:col-span-3" placeholder="Descrição (opcional)"
                 value={pDesc} onChange={e => setPDesc(e.target.value)} />
        </div>
        <button onClick={createPiece} disabled={loading || !pName.trim()}
                className="mt-3 rounded-md bg-emerald-500 px-4 py-2 font-medium text-slate-900 disabled:opacity-60">
          {loading ? 'Criando…' : 'Criar'}
        </button>
      </div>

      {/* Lista de peças (cards simples) */}
      {pieces.length === 0 ? (
        <p className="text-sm text-slate-300">Crie sua primeira peça acima.</p>
      ) : (
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          {pieces.map(p => {
            const tot = sessions.filter(s => s.piece_id === p.id).reduce((a, s) => a + s.duration_ms, 0);
            return (
              <button key={p.id}
                onClick={() => setSelected(p.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  selected === p.id ? 'border-emerald-400 bg-slate-700/40' : 'border-white/10 bg-slate-700/20 hover:bg-slate-700/30'
                }`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{p.name || 'Peça'}</h3>
                  <span className="text-sm text-slate-300">Total {fmtHMS(tot)}</span>
                </div>
                {p.description && <p className="mt-1 line-clamp-2 text-sm text-slate-300">{p.description}</p>}
                {p.client_email && <p className="mt-1 text-xs text-slate-400">Cliente: {p.client_email}</p>}
              </button>
            );
          })}
        </div>
      )}

      {/* Detalhe da peça selecionada */}
      {piece && (
        <>
          {/* Timer */}
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-slate-700/30 p-4">
              <div className="text-sm text-slate-300">Tempo da sessão</div>
              <div className="mt-1 text-4xl font-extrabold tabular-nums">{fmtHMS(runningMs)}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={startTimer} className="rounded-md bg-emerald-500 px-4 py-2 font-medium text-slate-900">Iniciar</button>
                <button onClick={pauseTimer} className="rounded-md bg-slate-700 px-4 py-2 font-medium">Pausar</button>
                <button onClick={endSession} className="rounded-md bg-amber-500 px-4 py-2 font-medium text-slate-900">Encerrar sessão</button>
                <button onClick={resetTimer} className="rounded-md border border-white/20 px-4 py-2 font-medium">Zerar</button>
              </div>
              <p className="mt-2 text-xs text-slate-400">Total acumulado: <b>{fmtHMS(totalMs)}</b></p>
            </div>

            {/* Medidas */}
            <div className="rounded-xl border border-white/10 bg-slate-700/30 p-4">
              <div className="text-sm text-slate-300">Medidas</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input className="rounded-md bg-slate-900 px-3 py-2" placeholder="Largura"
                       defaultValue={piece.measures?.largura ?? ''} onBlur={e => saveMeasures({ largura: parseNum(e.target.value) })}/>
                <input className="rounded-md bg-slate-900 px-3 py-2" placeholder="Altura"
                       defaultValue={piece.measures?.altura ?? ''} onBlur={e => saveMeasures({ altura: parseNum(e.target.value) })}/>
                <input className="rounded-md bg-slate-900 px-3 py-2" placeholder="Diâmetro"
                       defaultValue={piece.measures?.diametro ?? ''} onBlur={e => saveMeasures({ diametro: parseNum(e.target.value) })}/>
                <input className="rounded-md bg-slate-900 px-3 py-2" placeholder="Comprimento"
                       defaultValue={piece.measures?.comprimento ?? ''} onBlur={e => saveMeasures({ comprimento: parseNum(e.target.value) })}/>
                <select className="rounded-md bg-slate-900 px-3 py-2"
                        defaultValue={piece.unit}
                        onChange={e => saveMeasures({ unit: e.target.value as Piece['unit'] })}>
                  <option value="cm">cm</option><option value="mm">mm</option><option value="m">m</option><option value="pol">pol</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="mb-6 rounded-xl border border-white/10 bg-slate-700/30 p-4">
            <div className="text-sm text-slate-300">Notas / materiais</div>
            <textarea
              className="mt-2 w-full rounded-md bg-slate-900 px-3 py-2"
              defaultValue={piece.notes ?? ''}
              onBlur={(e) => saveNotes(e.target.value)}
              rows={5}
              placeholder="Fio, agulha, referência, observações..."
            />
          </div>

          {/* Histórico */}
          <div className="rounded-xl border border-white/10 bg-slate-700/30 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm text-slate-300">Histórico de sessões</div>
              <button onClick={exportCsv} className="rounded-md border border-white/20 px-3 py-1.5 text-sm">Exportar CSV</button>
            </div>

            {pieceSessions.length === 0 ? (
              <p className="text-sm text-slate-300">Nenhuma sessão ainda.</p>
            ) : (
              <ul className="space-y-2">
                {pieceSessions.map(s => (
                  <li key={s.id} className="flex items-center justify-between rounded-md border border-white/10 bg-slate-900 px-3 py-2">
                    <div className="text-sm">
                      <b className="mr-2">{fmtHMS(s.duration_ms)}</b>
                      <span className="text-slate-300">
                        {new Date(s.start_at).toLocaleString()} → {new Date(s.end_at).toLocaleString()}
                      </span>
                    </div>
                    <button onClick={() => deleteSession(s.id)} className="text-sm text-red-300 hover:underline">Excluir</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
