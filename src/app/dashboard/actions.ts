// src/app/dashboard/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getServerSupabase } from '@/lib/supabase.server'; // << AQUI: arquivo .server.ts

export async function createPieceAction(formData: FormData) {
  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const clientEmail = String(formData.get('client_email') || '').trim();

  if (!name) return;

  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('pieces').insert({
    user_id: user.id,
    name,
    description: description || null,
    client_email: clientEmail || null,
  });

  revalidatePath('/dashboard');
}

export async function startTimerAction(formData: FormData) {
  const pieceId = String(formData.get('piece_id') || '');
  if (!pieceId) return;

  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // se já houver uma entrada aberta, não cria outra
  const { data: active } = await supabase
    .from('time_entries')
    .select('id')
    .eq('user_id', user.id)
    .eq('piece_id', pieceId)
    .is('ended_at', null)
    .maybeSingle();

  if (!active) {
    await supabase.from('time_entries').insert({
      piece_id: pieceId,
      user_id: user.id,
      started_at: new Date().toISOString(),
    });
  }

  revalidatePath('/dashboard');
}

export async function stopTimerAction(formData: FormData) {
  const pieceId = String(formData.get('piece_id') || '');
  if (!pieceId) return;

  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('time_entries')
    .update({ ended_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('piece_id', pieceId)
    .is('ended_at', null);

  revalidatePath('/dashboard');
}

export async function addMinutesAction(formData: FormData) {
  const pieceId = String(formData.get('piece_id') || '');
  const minutes = Number(formData.get('minutes') || 0);
  if (!pieceId || !minutes || minutes <= 0 || Number.isNaN(minutes)) return;

  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const end = new Date();
  const start = new Date(end.getTime() - minutes * 60_000);

  await supabase.from('time_entries').insert({
    piece_id: pieceId,
    user_id: user.id,
    started_at: start.toISOString(),
    ended_at: end.toISOString(),
  });

  revalidatePath('/dashboard');
}

export async function saveMeasurementsAction(formData: FormData) {
  const pieceId = String(formData.get('piece_id') || '');
  if (!pieceId) return;

  const width = formData.get('width');
  const height = formData.get('height');
  const diameter = formData.get('diameter');
  const length = formData.get('length');
  const unit = String(formData.get('unit') || 'cm');

  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // sua tabela `measurements` tem PK em piece_id (1:1), então o upsert com onConflict:'piece_id' funciona
  await supabase
    .from('measurements')
    .upsert(
      {
        piece_id: pieceId,
        width: width ? Number(width) : null,
        height: height ? Number(height) : null,
        diameter: diameter ? Number(diameter) : null,
        length: length ? Number(length) : null,
        unit: unit || 'cm',
      },
      { onConflict: 'piece_id' }
    );

  revalidatePath('/dashboard');
}
