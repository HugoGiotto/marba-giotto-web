//src/components/DashboardApp.tsx

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  ensureMeasurementRow,
  fetchMeasurement,
  upsertMeasurement,
  type MeasurementUnit,
  type MeasurementVals,
} from '@/lib/measurements';

/** ------------------------- Types ------------------------- */

type Piece = {
  id: string;
  name: string;
};

type PieceSession = {
  id: string;
  piece_id: string;
  start_at: string | null;
  end_at: string | null;
};

/** ------------------------- Utils ------------------------- */

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function fmtHMS(ms: number) {
  const s = Math.floor(ms / 1000);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${pad(hh)}h${pad(mm)}m${pad(ss)}s`;
}
function toNumOrNull(v: unknown) {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
function diffMs(a: string | null, b: string | null) {
  if (!a || !b) return 0;
  return Math.max(0, new Date(b).getTime() - new Date(a).getTime());
}

/** ------------------------- Component ------------------------- */

export default function DashboardApp() {
  /** pieces */
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => pieces.find((p) => p.id === selectedId) || null, [pieces, selectedId]);

  /** create piece form */
  const [newName, setNewName] = useState('');

  /** sessions */
  const [sessions, setSessions] = useState<PieceSession[]>([]);
  const totalMs = useMemo(
    () => sessions.reduce((acc, s) => acc + diffMs(s.start_at, s.end_at), 0),
    [sessions]
  );

  /** live timer for current piece */
  const [accMs, setAccMs] = useState(0);
  const [running, setRunning] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  /** measurements state */
  const [measures, setMeasures] = useState<{
    width: number | null;
    height: number | null;
    diameter: number | null;
    length: number | null;
    unit: MeasurementUnit;
  }>({ width: null, height: null, diameter: null, length: null, unit: 'cm' });

  /** notes (local) */
  const [notes, setNotes] = useState('');

  /** ---------------------- Effects ---------------------- */

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('pieces').select('id,name');
      if (error) {
        // eslint-disable-next-line no-console
        console.error('load pieces error', error);
        return;
      }
      setPieces(data || []);
      if (!selectedId && data && data.length) setSelectedId(data[0].id);
    })();
  }, []); // load once

  // load sessions + measurements when piece changes
  useEffect(() => {
    if (!selectedId) {
      setSessions([]);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('piece_sessions')
        .select('id,piece_id,start_at,end_at')
        .eq('piece_id', selectedId);
      if (!error) setSessions(data || []);

      const m = await fetchMeasurement(supabase, selectedId);
      setMeasures({
        width: (m?.width as number | null) ?? null,
        height: (m?.height as number | null) ?? null,
        diameter: (m?.diameter as number | null) ?? null,
        length: (m?.length as number | null) ?? null,
        unit: ((m?.unit as MeasurementUnit) ?? 'cm') as MeasurementUnit,
      });

      setAccMs(0);
      setRunning(false);
      startedAtRef.current = null;
      stopLoop();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  /** ---------------------- Timer ---------------------- */

  function startLoop() {
    stopLoop();
    const loop = () => {
      if (running && startedAtRef.current) {
        const now = Date.now();
        setAccMs((base) => {
          const delta = now - (startedAtRef.current as number);
          return (startedAtRef.current ? delta : 0) + base;
        });
        startedAtRef.current = now; // “tick” acumulando
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }
  function stopLoop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }

  function handleStart() {
    if (running) return;
    startedAtRef.current = Date.now();
    setRunning(true);
    startLoop();
  }
  function handlePause() {
    if (!running) return;
    setRunning(false);
    startedAtRef.current = null;
    // loop segue rodando com RAF pra manter UI fluida, mas poderíamos parar aqui
  }
  function handleReset() {
    setRunning(false);
    startedAtRef.current = null;
    setAccMs(0);
    stopLoop();
  }

  async function handleEndSession() {
    if (!selectedId) return;
    const duration = accMs;
    if (duration <= 0) return;

    const end = new Date();
    const start = new Date(end.getTime() - duration);

    const { error } = await supabase.from('piece_sessions').insert({
      piece_id: selectedId,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
    });
    if (error) {
      alert('Falha ao salvar sessão.');
      return;
    }
    // reload sessions
    const { data } = await supabase
      .from('piece_sessions')
      .select('id,piece_id,start_at,end_at')
      .eq('piece_id', selectedId);
    setSessions(data || []);

    handleReset();
  }

  /** ---------------------- Pieces ---------------------- */

  async function handleCreatePiece() {
    const name = newName.trim();
    if (!name) return;

    const { data, error } = await supabase
      .from('pieces')
      .insert({ name })
      .select('id,name')
      .single();

    if (error) {
      alert('Erro ao criar peça.');
      return;
    }

    // cria linha 1:1 em measurements
    await ensureMeasurementRow(supabase, data.id, 'cm');

    setPieces((curr) => [data, ...curr]);
    setSelectedId(data.id);
    setNewName('');
  }

  /** ---------------------- Measurements ---------------------- */

  async function handleSaveMeasures() {
    if (!selectedId) return;
    const payload: MeasurementVals = {
      width: toNumOrNull(measures.width),
      height: toNumOrNull(measures.height),
      diameter: toNumOrNull(measures.diameter),
      length: toNumOrNull(measures.length),
      unit: measures.unit,
    };
    try {
      await upsertMeasurement(supabase, selectedId, payload);
      // feedback simples
      // eslint-disable-next-line no-alert
      alert('Medidas salvas!');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      alert('Não foi possível salvar as medidas.');
    }
  }

  /** ---------------------- Render ---------------------- */

  return (
    <div className="p-6 text-slate-100">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {/* Nova peça */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-6">
        <h2 className="font-semibold mb-2">Nova peça</h2>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 rounded-md bg-slate-900 px-3 py-2 text-slate-100 outline-none ring-1 ring-white/10"
            placeholder="Nome da peça"
          />
          <button
            onClick={handleCreatePiece}
            className="rounded-md bg-emerald-500 px-4 py-2 font-medium text-slate-900"
          >
            Criar
          </button>
        </div>
      </div>

      {/* Seleção da peça */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-300">Peça:</span>
          <select
            value={selectedId ?? ''}
            onChange={(e) => setSelectedId(e.target.value || null)}
            className="min-w-[240px] rounded-md bg-slate-900 px-3 py-2 text-slate-100 ring-1 ring-white/10"
          >
            {pieces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <div className="ml-auto text-sm text-slate-300">
            Total acumulado:{' '}
            <span className="font-semibold text-slate-100">{fmtHMS(totalMs)}</span>
          </div>
        </div>
      </div>

      {/* Conteúdo da peça selecionada */}
      {selected ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Timer */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-3 font-semibold">Tempo da sessão</h3>
            <div className="text-4xl font-extrabold tabular-nums">{fmtHMS(accMs)}</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={handleStart}
                disabled={running}
                className="rounded-md bg-emerald-500 px-4 py-2 font-medium text-slate-900 disabled:opacity-60"
              >
                Iniciar
              </button>
              <button
                onClick={handlePause}
                disabled={!running}
                className="rounded-md bg-slate-700 px-4 py-2 font-medium text-slate-100 disabled:opacity-60"
              >
                Pausar
              </button>
              <button
                onClick={handleEndSession}
                disabled={accMs <= 0}
                className="rounded-md bg-amber-500 px-4 py-2 font-medium text-slate-900 disabled:opacity-60"
              >
                Encerrar sessão
              </button>
              <button
                onClick={handleReset}
                disabled={running || accMs <= 0}
                className="rounded-md border border-white/15 px-4 py-2 font-medium text-slate-100 disabled:opacity-60"
              >
                Zerar
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-300">
              Total acumulado: <span className="font-semibold">{fmtHMS(totalMs)}</span>
            </p>
          </div>

          {/* Medidas */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-3 font-semibold">Medidas</h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Largura"
                value={measures.width ?? ''}
                onChange={(e) => setMeasures((s) => ({ ...s, width: e.target.value as unknown as number | null }))}
                className="rounded-md bg-slate-900 px-3 py-2 text-slate-100 ring-1 ring-white/10"
              />
              <input
                placeholder="Altura"
                value={measures.height ?? ''}
                onChange={(e) => setMeasures((s) => ({ ...s, height: e.target.value as unknown as number | null }))}
                className="rounded-md bg-slate-900 px-3 py-2 text-slate-100 ring-1 ring-white/10"
              />
              <input
                placeholder="Diâmetro"
                value={measures.diameter ?? ''}
                onChange={(e) => setMeasures((s) => ({ ...s, diameter: e.target.value as unknown as number | null }))}
                className="rounded-md bg-slate-900 px-3 py-2 text-slate-100 ring-1 ring-white/10"
              />
              <input
                placeholder="Comprimento"
                value={measures.length ?? ''}
                onChange={(e) => setMeasures((s) => ({ ...s, length: e.target.value as unknown as number | null }))}
                className="rounded-md bg-slate-900 px-3 py-2 text-slate-100 ring-1 ring-white/10"
              />
              <select
                value={measures.unit}
                onChange={(e) =>
                  setMeasures((s) => ({ ...s, unit: e.target.value as MeasurementUnit }))
                }
                className="rounded-md bg-slate-900 px-3 py-2 text-slate-100 ring-1 ring-white/10"
              >
                <option value="cm">cm</option>
                <option value="mm">mm</option>
                <option value="m">m</option>
                <option value="pol">pol</option>
              </select>
              <div className="flex items-center">
                <button
                  onClick={handleSaveMeasures}
                  className="rounded-md bg-emerald-500 px-4 py-2 font-medium text-slate-900"
                >
                  Salvar medidas
                </button>
              </div>
            </div>
          </div>

          {/* Notas (apenas local) */}
          <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-3 font-semibold">Notas / materiais</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-28 rounded-md bg-slate-900 px-3 py-2 text-slate-100 ring-1 ring-white/10"
              placeholder="Fio, agulha, referência…"
            />
          </div>

          {/* Histórico */}
          <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Histórico de sessões</h3>
              <span className="text-sm text-slate-300">{sessions.length} registro(s)</span>
            </div>
            <div className="grid gap-2">
              {sessions
                .slice()
                .sort((a, b) => (b.start_at || '').localeCompare(a.start_at || ''))
                .map((s) => {
                  const ms = diffMs(s.start_at, s.end_at);
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-md bg-slate-900 px-3 py-2 ring-1 ring-white/10"
                    >
                      <div className="text-sm">
                        <b className="mr-2">{fmtHMS(ms)}</b>
                        <span className="text-slate-300">
                          {s.start_at ? new Date(s.start_at).toLocaleString() : '—'} →{' '}
                          {s.end_at ? new Date(s.end_at).toLocaleString() : '—'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              {!sessions.length && (
                <div className="text-sm text-slate-300">Sem sessões ainda.</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-slate-300">Crie uma peça para começar.</div>
      )}
    </div>
  );
}
