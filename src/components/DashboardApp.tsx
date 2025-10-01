'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Piece = {
  id: string;
  user_id: string;
  name: string;
  client_email: string | null;
  image_path: string | null;
};

type Measurement = {
  piece_id: string;
  width: number | null;
  height: number | null;
  diameter: number | null;
  length: number | null;
  unit: string | null;
  notes: string | null;
};

type SessionRow = {
  id: string;
  start_at: string;
  end_at: string;
  duration_sec: number | null;
};

export default function DashboardApp({ userId }: { userId: string }) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // criação
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // seleção
  const [currentId, setCurrentId] = useState<string | null>(null);

  // timer
  const [running, setRunning] = useState(false);
  const [startTs, setStartTs] = useState<number | null>(null);
  const [accumMs, setAccumMs] = useState(0);
  const tickRef = useRef<number | null>(null);

  // sessões & medidas da peça selecionada
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [meas, setMeas] = useState<Measurement | null>(null);
  const [measSaving, setMeasSaving] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  /* ---------- boot/load ---------- */
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('pieces')
        .select('id,user_id,name,client_email,image_path')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      setPieces(data ?? []);
      setCurrentId(data?.[0]?.id ?? null);
      setLoading(false);
    })();
  }, [userId]);

  useEffect(() => {
    if (!currentId) return;
    (async () => {
      // sessões
      const { data: sessData } = await supabase
        .from('piece_sessions')
        .select('id,start_at,end_at,duration_sec')
        .eq('piece_id', currentId)
        .order('start_at', { ascending: false });

      setSessions(sessData ?? []);

      // medidas
      const { data: mData } = await supabase
        .from('measurements')
        .select('piece_id,width,height,diameter,length,unit,notes')
        .eq('piece_id', currentId)
        .maybeSingle();

      setMeas(mData ?? { piece_id: currentId, width: null, height: null, diameter: null, length: null, unit: 'cm', notes: null });

      // imagem pública (se houver path salvo)
      const piece = pieces.find(p => p.id === currentId);
      if (piece?.image_path) {
        const { data: pub } = supabase.storage.from('pieces').getPublicUrl(piece.image_path);
        setImgUrl(pub?.publicUrl ?? null);
      } else {
        setImgUrl(null);
      }
    })();
  }, [currentId, pieces]);

  /* ---------- helpers ---------- */
  const totalMs = useMemo(() => (sessions ?? []).reduce((a, s) => a + (s.duration_sec ?? 0), 0) * 1000, [sessions]);

  function fmtHMS(ms: number) {
    const s = Math.floor(ms / 1000);
    const hh = Math.floor(s / 3600).toString().padStart(2, '0');
    const mm = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const ss = (s % 60).toString().padStart(2, '0');
    return `${hh}h${mm}m${ss}s`;
  }

  /* ---------- criar peça (estoque se email vazio) ---------- */
  async function createPiece() {
    if (!newName.trim()) return;
    setCreating(true);
    const { data, error } = await supabase
      .from('pieces')
      .insert([{ user_id: userId, name: newName.trim(), client_email: newEmail.trim() || null }])
      .select('id,user_id,name,client_email,image_path')
      .single();

    setCreating(false);
    if (error) return alert(error.message);

    setPieces(prev => [...prev, data!]);
    setCurrentId(data!.id);
    setNewName('');
    setNewEmail('');
  }

  /* ---------- timer ---------- */
  useEffect(() => {
    if (!running) {
      if (tickRef.current) {
        cancelAnimationFrame(tickRef.current);
        tickRef.current = null;
      }
      return;
    }
    let raf: number;
    const loop = () => {
      if (startTs) setAccumMs(Date.now() - startTs);
      raf = requestAnimationFrame(loop);
      tickRef.current = raf;
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [running, startTs]);

  function start() {
    if (running) return;
    setStartTs(Date.now() - accumMs); // retoma se estava pausado
    setRunning(true);
  }

  function pause() {
    if (!running) return;
    setRunning(false);
    setAccumMs(prev => (startTs ? Date.now() - startTs : prev));
    setStartTs(null);
  }

  function resetTimer() {
    setRunning(false);
    setStartTs(null);
    setAccumMs(0);
  }

  async function endSession() {
    if (!currentId || accumMs <= 0) return;
    const end = new Date();
    const start = new Date(end.getTime() - accumMs);

    const { error } = await supabase.from('piece_sessions').insert([
      { piece_id: currentId, start_at: start.toISOString(), end_at: end.toISOString() },
    ]);

    if (error) return alert(error.message);

    // recarrega
    const { data: sessData } = await supabase
      .from('piece_sessions')
      .select('id,start_at,end_at,duration_sec')
      .eq('piece_id', currentId)
      .order('start_at', { ascending: false });

    setSessions(sessData ?? []);
    resetTimer();
  }

  /* ---------- salvar medidas/notas (UPSERT por piece_id) ---------- */
  async function saveMeasurements() {
    if (!currentId || !meas) return;
    setMeasSaving(true);
    const payload = {
      piece_id: currentId,
      width: meas.width,
      height: meas.height,
      diameter: meas.diameter,
      length: meas.length,
      unit: meas.unit || 'cm',
      notes: meas.notes ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('measurements')
      .upsert(payload, { onConflict: 'piece_id' });

    setMeasSaving(false);
    if (error) return alert(error.message);
  }

  /* ---------- upload de foto da peça ---------- */
  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    if (!currentId) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setImgUploading(true);
    const path = `${userId}/${currentId}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage.from('pieces').upload(path, file, { upsert: false });
    if (upErr) { setImgUploading(false); alert(upErr.message); return; }

    const { error: upRowErr } = await supabase.from('pieces').update({ image_path: path }).eq('id', currentId);
    if (upRowErr) { setImgUploading(false); alert(upRowErr.message); return; }

    const { data: pub } = supabase.storage.from('pieces').getPublicUrl(path);
    setImgUrl(pub?.publicUrl ?? null);
    setPieces(prev => prev.map(p => p.id === currentId ? { ...p, image_path: path } : p));
    setImgUploading(false);
  }

  /* ---------- export CSV ---------- */
  function exportCsv() {
    if (!currentId) return;
    const piece = pieces.find(p => p.id === currentId);
    const rows: string[][] = [];
    rows.push(['Peça', piece?.name ?? '']);
    rows.push(['Cliente (opcional)', piece?.client_email ?? '']);
    rows.push([]);
    rows.push(['Medidas']);
    rows.push(['Unidade', meas?.unit ?? 'cm']);
    rows.push(['Largura','Altura','Diâmetro','Comprimento']);
    rows.push([`${meas?.width ?? ''}`, `${meas?.height ?? ''}`, `${meas?.diameter ?? ''}`, `${meas?.length ?? ''}`]);
    rows.push([]);
    rows.push(['Total acumulado', fmtHMS(totalMs)]);
    rows.push([]);
    rows.push(['Sessões']);
    rows.push(['Início','Fim','Duração (hh:mm:ss)']);
    sessions.forEach(s => {
      const hms = fmtHMS((s.duration_sec ?? 0) * 1000);
      rows.push([new Date(s.start_at).toLocaleString(), new Date(s.end_at).toLocaleString(), hms]);
    });
    rows.push([]);
    rows.push(['Notas']);
    rows.push([ (meas?.notes ?? '').replace(/\n/g,' ') ]);

    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${piece?.name ?? 'peca'}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  /* ---------- UI ---------- */
  if (loading) return <div className="p-6 text-stone-200">Carregando…</div>;

  const current = pieces.find(p => p.id === currentId) || null;

  return (
    <div className="p-4 md:p-6 text-stone-100">
      <h1 className="text-2xl font-bold text-stone-100">Dashboard</h1>

      {/* Criar peça */}
      <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="mb-3 font-medium text-stone-200">Nova peça</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Nome da peça"
                 className="rounded-md bg-stone-900 px-3 py-2 text-stone-100 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-amber-400"/>
          <input value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="E-mail do cliente (opcional)"
                 className="rounded-md bg-stone-900 px-3 py-2 text-stone-100 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-amber-400"/>
          <button onClick={createPiece} disabled={creating}
                  className="rounded-md bg-amber-400 px-4 py-2 font-medium text-stone-950 disabled:opacity-60">
            {creating ? 'Criando…' : 'Criar'}
          </button>
        </div>
      </div>

      {/* Lista de peças */}
      {pieces.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {pieces.map(p => (
            <button key={p.id}
              onClick={()=>setCurrentId(p.id)}
              className={`rounded-full px-3 py-1 text-sm border ${currentId===p.id ? 'bg-amber-400 text-stone-900 border-amber-400' : 'border-white/10 text-stone-200 hover:border-amber-400/60'}`}>
              {p.name}{p.client_email ? '' : ' • estoque'}
            </button>
          ))}
        </div>
      )}

      {/* Detalhe da peça */}
      {current && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {/* Resumo + foto */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold">{current.name}</div>
                <div className="text-sm text-stone-400">{current.client_email || 'Peça de estoque'}</div>
              </div>
              <div className="text-right">
                <div className="text-stone-400 text-sm">Total</div>
                <div className="font-bold">{fmtHMS(totalMs)}</div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <input type="file" accept="image/*" onChange={onPickImage}
                     className="block w-full rounded-md border border-white/10 bg-stone-900 px-3 py-2 text-stone-100"/>
              <span className="text-sm text-stone-400">{imgUploading ? 'Enviando…' : ''}</span>
            </div>

            {imgUrl && (
              <img src={imgUrl} alt="Foto da peça" className="mt-3 aspect-video w-full rounded-xl object-cover border border-white/10"/>
            )}
          </div>

          {/* Timer */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="text-stone-300">Tempo da sessão</div>
            <div className="mt-1 text-4xl font-extrabold tabular-nums">{fmtHMS(accumMs)}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={start} disabled={running}
                className="rounded-md bg-emerald-500 px-4 py-2 font-medium text-stone-950 disabled:opacity-60">Iniciar</button>
              <button onClick={pause} disabled={!running}
                className="rounded-md bg-stone-700 px-4 py-2 font-medium text-stone-100 disabled:opacity-60">Pausar</button>
              <button onClick={endSession} disabled={accumMs<=0}
                className="rounded-md bg-amber-500 px-4 py-2 font-medium text-stone-950 disabled:opacity-60">Encerrar sessão</button>
              <button onClick={resetTimer} disabled={running || accumMs<=0}
                className="rounded-md border border-white/15 px-4 py-2 font-medium text-stone-100 disabled:opacity-60">Zerar</button>
            </div>
            <div className="mt-2 text-xs text-stone-400">Dica: você pode fazer várias sessões por dia; cada encerramento entra no histórico.</div>
          </div>

          {/* Medidas */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="text-stone-300">Medidas</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input value={meas?.width ?? ''} onChange={e=>setMeas(m=>m?{...m,width:parseFloatOrNull(e.target.value)}:m)}
                     placeholder="Largura" className="rounded-md bg-stone-900 px-3 py-2 ring-1 ring-white/10 text-stone-100"/>
              <input value={meas?.height ?? ''} onChange={e=>setMeas(m=>m?{...m,height:parseFloatOrNull(e.target.value)}:m)}
                     placeholder="Altura" className="rounded-md bg-stone-900 px-3 py-2 ring-1 ring-white/10 text-stone-100"/>
              <input value={meas?.diameter ?? ''} onChange={e=>setMeas(m=>m?{...m,diameter:parseFloatOrNull(e.target.value)}:m)}
                     placeholder="Diâmetro" className="rounded-md bg-stone-900 px-3 py-2 ring-1 ring-white/10 text-stone-100"/>
              <input value={meas?.length ?? ''} onChange={e=>setMeas(m=>m?{...m,length:parseFloatOrNull(e.target.value)}:m)}
                     placeholder="Comprimento" className="rounded-md bg-stone-900 px-3 py-2 ring-1 ring-white/10 text-stone-100"/>
            </div>
            <div className="mt-2 flex gap-2">
              <select value={meas?.unit ?? 'cm'} onChange={e=>setMeas(m=>m?{...m,unit:e.target.value}:m)}
                      className="rounded-md bg-stone-900 px-3 py-2 ring-1 ring-white/10 text-stone-100">
                <option value="cm">cm</option><option value="mm">mm</option><option value="m">m</option><option value="pol">pol</option>
              </select>
              <button onClick={saveMeasurements} disabled={measSaving}
                      className="rounded-md bg-amber-400 px-4 py-2 font-medium text-stone-950 disabled:opacity-60">
                {measSaving ? 'Salvando…' : 'Salvar medidas'}
              </button>
            </div>

            <textarea
              value={meas?.notes ?? ''}
              onChange={e=>setMeas(m=>m?{...m,notes:e.target.value}:m)}
              placeholder="Fio, agulha, referência, observações…"
              className="mt-3 w-full min-h-[120px] rounded-md bg-stone-900 px-3 py-2 ring-1 ring-white/10 text-stone-100"
            />
          </div>

          {/* Histórico */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 md:col-span-2">
            <div className="flex items-center justify-between">
              <div className="font-medium text-stone-300">Histórico de sessões</div>
              <button onClick={exportCsv}
                className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-stone-100 hover:border-amber-400/60">Exportar CSV</button>
            </div>

            <div className="mt-3 space-y-2 max-h-[300px] overflow-auto pr-1">
              {sessions.map(s => (
                <div key={s.id} className="flex items-center justify-between rounded-md border border-white/10 bg-stone-900 px-3 py-2">
                  <div className="text-stone-200">
                    <b className="mr-2">{fmtHMS((s.duration_sec ?? 0)*1000)}</b>
                    <span className="text-stone-400 text-sm">
                      {new Date(s.start_at).toLocaleString()} → {new Date(s.end_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
              {sessions.length === 0 && <div className="text-sm text-stone-400">Sem sessões ainda.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function parseFloatOrNull(v: string): number | null {
  if (!v?.trim()) return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
