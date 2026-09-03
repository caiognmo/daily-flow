import { env } from 'cloudflare:workers';
import { audioKeyFor, MAX_AUDIO_BYTES, putAudio } from '@/lib/audio-storage';
import { isAllowedCompanyEmail, requestEmail } from '@/lib/request-identity';

export async function GET(request: Request) {
  const email = await requestEmail(request);
  if (!isAllowedCompanyEmail(email))
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  const rows = await (env.DB as D1Database)
    .prepare(
      'SELECT id,client,city,state,plan,end_date,payload,audio_key,created_by,created_at,updated_at FROM dailys ORDER BY created_at DESC',
    )
    .all();
  return Response.json(rows.results);
}
export async function POST(request: Request) {
  const email = await requestEmail(request);
  if (!isAllowedCompanyEmail(email))
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  const form = await request.formData(),
    data = JSON.parse(String(form.get('payload') || '{}')) as Record<
      string,
      unknown
    >,
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
  await (env.DB as D1Database)
    .prepare(
      'INSERT INTO dailys (id,client,city,state,plan,end_date,payload,audio_key,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    )
    .bind(
      id,
      String(data.client || ''),
      String(data.city || ''),
      String(data.state || ''),
      String(data.plan || ''),
      String(data.endDate || data.endDateText || ''),
      JSON.stringify({ ...data, createdBy: email }),
      audioKey,
      email,
      now,
      now,
    )
    .run();
  return Response.json({ id, audioKey }, { status: 201 });
}
