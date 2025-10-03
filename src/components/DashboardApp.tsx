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

type Piece = { id: string; name: string };
type PieceSession = {
  id: string;
  piece_id: string;
  start_at: string | null;
  end_at: string | null;
  kind: 'interrupt' | 'stage' | null;
  note: string | null;
  photo_url: string | null;
  created_at: string | null;
};

function pad(n: number) { return String(n).padStart(2, '0'); }
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
function fileExt(name: string) {
  const m = name.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/i);
  return m ? m[1] : 'jpg';
}

export default function DashboardApp() {
  // auth (para paths no storage, se desejar usar privado no futuro)
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // pieces
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => pieces.find((p) => p.id === selectedId) || null, [pieces, selectedId]);

  // create piece
  const [newName, setNewName] = useState('');

  // sessions
  const [sessions, setSessions] = useState<PieceSession[]>([]);
  const totalMs = useMemo(
    () => sessions.reduce((acc, s) => acc + diffMs(s.start_at, s.end_at), 0),
    [sessions]
  );

  // live timer
  const [accMs, setAccMs] = useState(0);
  const [running, setRunning] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // note para pausa/etapa
  const [note, setNote] = useState('');

  // camera input
  const fileRef = useRef<HTMLInputElement | null>(null);

  // measurements
  const [measures, setMeasures] = useState<{
    width: number | null; height: number | null; diameter: number | null; length: number | null; unit: MeasurementUnit;
  }>({ width: null, height: null, diameter: null, length: null, unit: 'cm' });

  // notas locais
  const [notes, setNotes] = useState('');

  // load pieces once
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('pieces').select('id,name');
      if (!error) {
        setPieces(data || []);
        if (!selectedId && data && data.length) setSelectedId(data[0].id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // load sessions + measurements when piece changes
  useEffect(() => {
    if (!selectedId) {
      setSessions([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('piece_sessions')
        .select('id,piece_id,start_at,end_at,kind,note,photo_url,created_at')
        .eq('piece_id', selectedId);
      setSessions(data || []);

      const m = await fetchMeasurement(supabase, selectedId);
      setMeasures({
        width: (m?.width as number | null) ?? null,
        height: (m?.height as number | null) ?? null,
        diameter: (m?.diameter as number | null) ?? null,
        length: (m?.length as number | null) ?? null,
        unit: ((m?.unit as MeasurementUnit) ?? 'cm') as MeasurementUnit,
      });

      setAccMs(0); setRunning(false); startedAtRef.current = null; stopLoop();
      setNote('');
    })();
  }, [selectedId]);

  /* ---------------- Timer ---------------- */
  function startLoop() {
    stopLoop();
    let last = Date.now();
    const loop = () => {
      if (running) {
        const now = Date.now();
        setAccMs((v) => v + (now - last));
        last = now;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }
  function stopLoop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current!);
    rafRef.current = null;
  }
  function handleStart() {
    if (running) return;
    setRunning(true);
    startLoop();
  }
  function handlePauseOnly() {
    setRunning(false);
  }
  function resetTimer() {
    setRunning(false); setAccMs(0); stopLoop();
  }

  /* ------------ Persistir sessão (dois tipos) ------------ */
  async function persistSession(kind: 'interrupt' | 'stage', file?: File | null) {
    if (!selectedId) return;
    const ms = accMs;
    if (ms <= 0) return;

    const end = new Date();
    const start = new Date(end.getTime() - ms);

    // 1) cria a sessão e pega o id
    const { data: inserted, error } = await supabase
      .from('piece_sessions')
      .insert({
        piece_id: selectedId,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        kind,
        note: note || null,
      })
      .select('id')
      .single();

    if (error || !inserted?.id) {
      alert('Falha ao salvar sessão.');
      return;
    }

    // 2) se tiver foto, faz upload e atualiza photo_url
    if (file) {
      try {
        const ext = fileExt(file.name || 'foto.jpg');
        const path = `${userId ?? 'anon'}/${selectedId}/${inserted.id}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('piece-photos').upload(path, file, { upsert: true });
        if (upErr) throw upErr;

        const { data: pub } = supabase.storage.from('piece-photos').getPublicUrl(path);
        const publicUrl = pub?.publicUrl ?? null;

        if (publicUrl) {
          await supabase.from('piece_sessions').update({ photo_url: publicUrl }).eq('id', inserted.id);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('upload foto', e);
        alert('Sessão salva, mas não consegui subir a foto.');
      }
    }

    // 3) recarrega a lista
    const { data: rec } = await supabase
      .from('piece_sessions')
      .select('id,piece_id,start_at,end_at,kind,note,photo_url,created_at')
      .eq('piece_id', selectedId);
    setSessions(rec || []);

    // reset
    resetTimer();
    setNote('');
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleInterrupt() {
    persistSession('interrupt', null);
  }

  function handleStageWithPhotoClick() {
    // Abrir câmera/galeria; ao escolher, salvamos.
    fileRef.current?.click();
  }
  async function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    await persistSession('stage', file);
  }

  /* ---------------- Pieces ---------------- */
  async function handleCreatePiece() {
    const name = newName.trim();
    if (!name) return;

    const { data, error } = await supabase
      .from('pieces')
      .insert({ name })
      .select('id,name')
      .single();

    if (error) { alert('Erro ao criar peça.'); return; }

    await ensureMeasurementRow(supabase, data.id, 'cm');
    setPieces((curr) => [data, ...curr]);
    setSelectedId(data.id);
    setNewName('');
  }

  /* -------------- Measurements -------------- */
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
      alert('Medidas salvas!');
    } catch {
      alert('Não foi possível salvar as medidas.');
    }
  }

  /* ---------------- Dossiê imprimível ---------------- */
  function openDossier() {
    const piece = selected;
    const total = fmtHMS(totalMs);
    const rows = sessions
      .slice()
      .sort((a, b) => (a.start_at || '').localeCompare(b.start_at || ''))
      .map((s, i) => {
        const ms = fmtHMS(diffMs(s.start_at, s.end_at));
        const title = s.kind === 'stage' ? `Etapa ${i + 1}` : 'Interrupção';
        const photo = s.photo_url ? `<img src="${s.photo_url}" style="max-width:160px;border-radius:10px;border:1px solid #eee;margin-top:6px"/>` : '';
        const noteHtml = s.note ? `<div style="margin-top:4px;color:#555;font-size:12px">${s.note}</div>` : '';
        return `
          <tr>
            <td style="padding:8px 10px;border-bottom:1px solid #eee">
              <b>${title}</b><br/>
              <small>${new Date(s.start_at!).toLocaleString()} → ${new Date(s.end_at!).toLocaleString()}</small>
              ${noteHtml}
              ${photo}
            </td>
            <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right">${ms}</td>
          </tr>`;
      })
      .join('');

    const html = `
    <html>
    <head>
      <meta charset="utf-8"/>
      <title>Dossiê — ${piece?.name ?? 'Peça'}</title>
      <style>
        body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial;padding:24px;background:#faf9f7;color:#1b1a19}
        h1{margin:0 0 6px}
        table{width:100%;border-collapse:collapse;margin-top:12px}
      </style>
    </head>
    <body>
      <h1>Dossiê — ${piece?.name ?? 'Peça'}</h1>
      <div>Total acumulado: <b>${total}</b></div>
      <table>
        <thead>
          <tr>
            <th style="text-align:left;padding:8px 10px;border-bottom:2px solid #111">Etapas / Interrupções</th>
            <th style="text-align:right;padding:8px 10px;border-bottom:2px solid #111">Duração</th>
          </tr>
        </thead>
        <tbody>${rows || `<tr><td colspan="2" style="padding:12px">Sem registros.</td></tr>`}</tbody>
      </table>
      <script>window.print()</script>
    </body>
    </html>`;

    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  }

  /* ---------------- UI ---------------- */
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
          <button onClick={handleCreatePiece} className="rounded-md bg-emerald-500 px-4 py-2 font-medium text-slate-900">
            Criar
          </button>
        </div>
      </div>

      {/* Seleção de peça + total + dossiê */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-300">Peça:</span>
          <select
            value={selectedId ?? ''}
            onChange={(e) => setSelectedId(e.target.value || null)}
            className="min-w-[240px] rounded-md bg-slate-900 px-3 py-2 text-slate-100 ring-1 ring-white/10"
          >
            {pieces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="ml-auto text-sm text-slate-300">
            Total acumulado: <span className="font-semibold text-slate-100">{fmtHMS(totalMs)}</span>
          </div>
          <button onClick={openDossier} className="rounded-md border border-white/15 px-3 py-2 text-sm">
            Dossiê (imprimir)
          </button>
        </div>
      </div>

      {selected ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Timer */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-2 font-semibold">Tempo da sessão</h3>
            <div className="text-4xl font-extrabold tabular-nums">{fmtHMS(accMs)}</div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={handleStart} disabled={running}
                className="rounded-md bg-emerald-500 px-4 py-2 font-medium text-slate-900 disabled:opacity-60">Iniciar</button>
              <button onClick={handlePauseOnly} disabled={!running}
                className="rounded-md bg-slate-700 px-4 py-2 font-medium text-slate-100 disabled:opacity-60">Pausar</button>

              <button onClick={handleInterrupt} disabled={accMs <= 0}
                className="rounded-md bg-amber-500 px-4 py-2 font-medium text-slate-900 disabled:opacity-60 col-span-2">
                Registrar pausa (interrupção)
              </button>

              <button onClick={handleStageWithPhotoClick} disabled={accMs <= 0}
                className="rounded-md bg-blue-500/80 px-4 py-2 font-medium text-white disabled:opacity-60 col-span-2">
                Finalizar etapa (com foto)
              </button>

              <button onClick={resetTimer} disabled={running || accMs <= 0}
                className="rounded-md border border-white/15 px-4 py-2 font-medium text-slate-100 disabled:opacity-60 col-span-2">
                Zerar contador
              </button>
            </div>

            <div className="mt-3">
              <label className="text-sm text-slate-300">Nota (opcional)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex.: etapa terminada; envio para cliente"
                className="mt-1 w-full rounded-md bg-slate-900 px-3 py-2 text-slate-100 ring-1 ring-white/10"
              />
            </div>

            {/* input oculto para câmera/galeria */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={onFileChosen}
            />
          </div>

          {/* Medidas */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-3 font-semibold">Medidas</h3>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Largura" value={measures.width ?? ''} onChange={(e) => setMeasures((s) => ({ ...s, width: e.target.value as unknown as number | null }))} className="rounded-md bg-slate-900 px-3 py-2 text-slate-100 ring-1 ring-white/10" />
              <input placeholder="Altura" value={measures.height ?? ''} onChange={(e) => setMeasures((s) => ({ ...s, height: e.target.value as unknown as number | null }))} className="rounded-md bg-slate-900 px-3 py-2 text-slate-100 ring-1 ring-white/10" />
              <input placeholder="Diâmetro" value={measures.diameter ?? ''} onChange={(e) => setMeasures((s) => ({ ...s, diameter: e.target.value as unknown as number | null }))} className="rounded-md bg-slate-900 px-3 py-2 text-slate-100 ring-1 ring-white/10" />
              <input placeholder="Comprimento" value={measures.length ?? ''} onChange={(e) => setMeasures((s) => ({ ...s, length: e.target.value as unknown as number | null }))} className="rounded-md bg-slate-900 px-3 py-2 text-slate-100 ring-1 ring-white/10" />
              <select value={measures.unit} onChange={(e) => setMeasures((s) => ({ ...s, unit: e.target.value as MeasurementUnit }))} className="rounded-md bg-slate-900 px-3 py-2 text-slate-100 ring-1 ring-white/10">
                <option value="cm">cm</option><option value="mm">mm</option><option value="m">m</option><option value="pol">pol</option>
              </select>
              <div className="flex items-center">
                <button onClick={handleSaveMeasures} className="rounded-md bg-emerald-500 px-4 py-2 font-medium text-slate-900">Salvar medidas</button>
              </div>
            </div>
          </div>

          {/* Notas locais */}
          <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-3 font-semibold">Notas / materiais</h3>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full min-h-28 rounded-md bg-slate-900 px-3 py-2 text-slate-100 ring-1 ring-white/10" placeholder="Fio, agulha, referência…"/>
          </div>

          {/* Histórico */}
          <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Histórico</h3>
              <span className="text-sm text-slate-300">{sessions.length} registro(s)</span>
            </div>

            <div className="grid gap-2">
              {sessions
                .slice()
                .sort((a, b) => (b.start_at || '').localeCompare(a.start_at || ''))
                .map((s, idx) => {
                  const ms = fmtHMS(diffMs(s.start_at, s.end_at));
                  const badge =
                    s.kind === 'stage'
                      ? <span className="rounded-full bg-blue-400/20 text-blue-200 px-2 py-0.5 text-xs">Etapa</span>
                      : <span className="rounded-full bg-amber-400/20 text-amber-200 px-2 py-0.5 text-xs">Interrupção</span>;
                  return (
                    <div key={s.id} className="flex items-start justify-between gap-3 rounded-md bg-slate-900 px-3 py-2 ring-1 ring-white/10">
                      <div className="text-sm">
                        <div className="flex items-center gap-2">
                          <b>#{sessions.length - idx}</b> {badge}
                          <span className="text-slate-300">
                            {s.start_at ? new Date(s.start_at).toLocaleString() : '—'} → {s.end_at ? new Date(s.end_at).toLocaleString() : '—'}
                          </span>
                        </div>
                        {s.note && <div className="text-slate-300 mt-1">{s.note}</div>}
                        {s.photo_url && (
                          <a href={s.photo_url} target="_blank" rel="noreferrer">
                            <img src={s.photo_url} alt="foto da etapa" className="mt-2 max-h-28 rounded border border-white/10"/>
                          </a>
                        )}
                      </div>
                      <div className="text-sm font-semibold">{ms}</div>
                    </div>
                  );
                })}
              {!sessions.length && <div className="text-sm text-slate-300">Sem registros ainda.</div>}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-slate-300">Crie uma peça para começar.</div>
      )}
    </div>
  );
}
