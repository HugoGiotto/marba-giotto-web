// src/lib/measurements.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export type MeasurementUnit = 'cm' | 'mm' | 'm' | 'pol';
export type MeasurementVals = {
  width?: number | null;
  height?: number | null;
  diameter?: number | null;
  length?: number | null;
  unit?: MeasurementUnit;
  // opcional: só use se a coluna existir no banco
  notes?: string | null;
};

export async function fetchMeasurements(
  supabase: SupabaseClient,
  pieceId: string
) {
  const { data, error } = await supabase
    .from('measurements')
    .select('piece_id,width,height,diameter,length,unit,updated_at')
    .eq('piece_id', pieceId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertMeasurements(
  supabase: SupabaseClient,
  pieceId: string,
  vals: MeasurementVals
) {
  const payload = { piece_id: pieceId, ...vals };

  const { data, error } = await supabase
    .from('measurements')
    .upsert(payload, { onConflict: 'piece_id' })
    .select('piece_id,width,height,diameter,length,unit,updated_at')
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Garante que exista uma linha em `measurements` para a peça.
 * Se não existir, cria { piece_id } (unit usa o default do banco).
 */
export async function ensureMeasurementRow(
  supabase: SupabaseClient,
  pieceId: string
) {
  const { data, error } = await supabase
    .from('measurements')
    .select('piece_id')
    .eq('piece_id', pieceId)
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  const { data: upserted, error: upErr } = await supabase
    .from('measurements')
    .upsert({ piece_id: pieceId }, { onConflict: 'piece_id' })
    .select('piece_id')
    .maybeSingle();

  if (upErr) throw upErr;
  return upserted;
}

/** Aliases para manter compatibilidade com o DashboardApp.tsx */
export const fetchMeasurement = fetchMeasurements;
export const upsertMeasurement = upsertMeasurements;
