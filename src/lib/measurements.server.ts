// src/lib/measurements.server.ts
import 'server-only';
import { getServerSupabase } from '@/lib/supabase.server';
import { fetchMeasurements as _fetch, upsertMeasurements as _upsert } from './measurements';

export async function fetchMeasurementsServer(pieceId: string) {
  const s = await getServerSupabase();
  return _fetch(s, pieceId);
}

export async function upsertMeasurementsServer(pieceId: string, payload: Parameters<typeof _upsert>[2]) {
  const s = await getServerSupabase();
  return _upsert(s, pieceId, payload);
}
