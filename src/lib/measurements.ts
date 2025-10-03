// src/lib/measurements.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export type Unit = 'cm' | 'mm' | 'm' | 'pol';

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
  payload: {
    width?: number | null;
    height?: number | null;
    diameter?: number | null;
    length?: number | null;
    unit?: Unit;
  }
) {
  const { data, error } = await supabase
    .from('measurements')
    .upsert({ piece_id: pieceId, ...payload }, { onConflict: 'piece_id' })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}
