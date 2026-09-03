import { env } from 'cloudflare:workers';
import {
  audioKeyFor,
  deleteAudio,
  MAX_AUDIO_BYTES,
  putAudio,
} from '@/lib/audio-storage';
import { isAllowedCompanyEmail, requestEmail } from '@/lib/request-identity';

const textField = (value: unknown) => (typeof value === 'string' ? value : '');

export async function GET(request: Request) {
  const email = await requestEmail(request);
  if (!isAllowedCompanyEmail(email))
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  const rows = await (env.DB as D1Database)
    .prepare(
      'SELECT id,client,city,state,plan,end_date,payload,audio_key,created_by,created_at,updated_at FROM dailys ORDER BY created_at DESC',
    )
    .all();
  return Response.json(rows.results, {
    headers: { 'cache-control': 'no-store' },
  });
}
export async function POST(request: Request) {
  const email = await requestEmail(request);
  if (!isAllowedCompanyEmail(email))
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  const form = await request.formData(),
    rawPayload = form.get('payload'),
    data = JSON.parse(
      typeof rawPayload === 'string' ? rawPayload : '{}',
    ) as Record<string, unknown>,
    audio = form.get('audio'),
    id = crypto.randomUUID(),
    now = Date.now();
  let audioKey: string | null = null;
  if (audio instanceof File && audio.size) {
    if (audio.size > MAX_AUDIO_BYTES)
      return Response.json(
        { error: 'O áudio deve ter no máximo 20 MB.' },
        { status: 413 },
      );
    audioKey = audioKeyFor(id, audio);
    await putAudio(audioKey, audio);
  }
  const db = env.DB as D1Database;
  let write: D1Result;
  try {
    write = await db
      .prepare(
        'INSERT INTO dailys (id,client,city,state,plan,end_date,payload,audio_key,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      )
      .bind(
        id,
        textField(data.client),
        textField(data.city),
        textField(data.state),
        textField(data.plan),
        textField(data.endDate) || textField(data.endDateText),
        JSON.stringify({ ...data, createdBy: email }),
        audioKey,
        email,
        now,
        now,
      )
      .run();
  } catch {
    if (audioKey) await deleteAudio(audioKey);
    return Response.json(
      { error: 'Não foi possível confirmar a gravação da daily.' },
      { status: 500 },
    );
  }
  if (!write.success || write.meta.changes !== 1) {
    if (audioKey) await deleteAudio(audioKey);
    return Response.json(
      { error: 'Não foi possível confirmar a gravação da daily.' },
      { status: 500 },
    );
  }
  const saved = await db
    .prepare(
      'SELECT id,client,city,state,plan,end_date,payload,audio_key,created_by,created_at,updated_at FROM dailys WHERE id=?',
    )
    .bind(id)
    .first();
  if (!saved)
    return Response.json(
      { error: 'A daily não apareceu na lista após a gravação.' },
      { status: 500 },
    );
  return Response.json(
    { id, audioKey, saved: true, record: saved },
    { status: 201, headers: { 'cache-control': 'no-store' } },
  );
}
