// src/lib/measurements.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerSupabase } from '@/lib/supabaseServer';
import { supabase as supabaseBrowser } from '@/lib/supabaseClient';

export type Unit = 'cm' | 'mm' | 'm' | 'pol';
export type MeasurementRow = {
  piece_id: string;
  width: number | null;
  height: number | null;
  diameter: number | null;
  length: number | null;
  unit: Unit | null;
  updated_at?: string | null;
};

type Side = 'server' | 'client';

async function getClient(side: Side): Promise<SupabaseClient> {
  if (side === 'server') {
    return await getServerSupabase();
  }
  return supabaseBrowser;
}

/** Garante que existe uma linha de medidas para a peça (idempotente) */
export async function ensureMeasurementRow(
  pieceId: string,
  unit: Unit = 'cm',
  side: Side = 'server'
): Promise<MeasurementRow> {
  const supabase = await getClient(side);
  const { data, error } = await supabase
    .from('measurements')
    .upsert({ piece_id: pieceId, unit }, { onConflict: 'piece_id' })
    .select()
    .single();
  if (error) throw error;
  return data as MeasurementRow;
}

/** Atualiza/cria medidas (upsert) para a peça */
export async function upsertMeasurement(
  pieceId: string,
  vals: Partial<Omit<MeasurementRow, 'piece_id' | 'updated_at'>>,
  side: Side = 'client'
): Promise<MeasurementRow> {
  const supabase = await getClient(side);
  const payload = { piece_id: pieceId, ...vals };
  const { data, error } = await supabase
    .from('measurements')
    .upsert(payload, { onConflict: 'piece_id' })
    .select()
    .single();
  if (error) throw error;
  return data as MeasurementRow;
}

/** Busca as medidas de um conjunto de peças */
export async function fetchMeasurementsByPieceIds(
  pieceIds: string[],
  side: Side = 'server'
): Promise<MeasurementRow[]> {
  if (!pieceIds.length) return [];
  const supabase = await getClient(side);
  const { data, error } = await supabase
    .from('measurements')
    .select('piece_id,width,height,diameter,length,unit,updated_at')
    .in('piece_id', pieceIds);
  if (error) throw error;
  return data as MeasurementRow[];
}

/** Busca as medidas de uma peça */
export async function fetchMeasurement(
  pieceId: string,
  side: Side = 'server'
): Promise<MeasurementRow | null> {
  const supabase = await getClient(side);
  const { data, error } = await supabase
    .from('measurements')
    .select('*')
    .eq('piece_id', pieceId)
    .maybeSingle();
  if (error) throw error;
  return (data as MeasurementRow) ?? null;
}
