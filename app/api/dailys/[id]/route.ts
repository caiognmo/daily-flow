import { env } from 'cloudflare:workers';
import { recordActivity } from '@/lib/activity';
import {
  audioKeyFor,
  deleteAudio,
  MAX_AUDIO_BYTES,
  putAudio,
} from '@/lib/audio-storage';
import {
  isAllowedCompanyEmail,
  requestEmail,
  authorizedCompanyEmail,
} from '@/lib/request-identity';

const textField = (value: unknown) => (typeof value === 'string' ? value : '');
const user = async (request: Request) => {
  const email = await requestEmail(request),
    admins = (
      (env as unknown as Record<string, string>).ADMIN_EMAILS ||
      'caio@sistemasbr.com.br,caio@sistemasbr.net'
    )
      .toLowerCase()
      .split(',')
      .map((value) => value.trim());
  if (!isAllowedCompanyEmail(email)) return null;
  if (admins.includes(email)) return { email, canEdit: true, canDelete: true };
  const p = await (env.DB as D1Database)
    .prepare(
      'SELECT can_edit,can_delete,enabled FROM permissions WHERE email=?',
    )
    .bind(email)
    .first<{ can_edit: number; can_delete: number; enabled: number }>();
  return p?.enabled
    ? { email, canEdit: !!p.can_edit, canDelete: !!p.can_delete }
    : null;
};
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const email = await authorizedCompanyEmail(request);
  if (!isAllowedCompanyEmail(email))
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await params,
    saved = await (env.DB as D1Database)
      .prepare(
        'SELECT id,client,city,state,plan,end_date,payload,audio_key,created_by,created_at,updated_at FROM dailys WHERE id=?',
      )
      .bind(id)
      .first();
  if (!saved)
    return Response.json({ error: 'Daily não encontrada' }, { status: 404 });
  return Response.json(saved, { headers: { 'cache-control': 'no-store' } });
}
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const u = await user(request);
  if (!u?.canEdit)
    return Response.json({ error: 'Sem permissão' }, { status: 403 });
  const { id } = await params,
    existing = await (env.DB as D1Database)
      .prepare('SELECT audio_key,created_by FROM dailys WHERE id=?')
      .bind(id)
      .first<{ audio_key: string | null; created_by: string }>();
  if (!existing)
    return Response.json({ error: 'Daily não encontrada' }, { status: 404 });
  const contentType = request.headers.get('content-type') || '';
  let data: Record<string, unknown>,
    audio: FormDataEntryValue | null = null;
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const rawPayload = form.get('payload');
    data = JSON.parse(
      typeof rawPayload === 'string' ? rawPayload : '{}',
    ) as Record<string, unknown>;
    audio = form.get('audio');
  } else data = (await request.json()) as Record<string, unknown>;
  let audioKey = existing.audio_key;
  if (audio instanceof File && audio.size) {
    if (audio.size > MAX_AUDIO_BYTES)
      return Response.json(
        { error: 'O áudio deve ter no máximo 20 MB.' },
        { status: 413 },
      );
    const nextAudioKey = audioKeyFor(id, audio);
    await putAudio(nextAudioKey, audio);
    if (audioKey && audioKey !== nextAudioKey) await deleteAudio(audioKey);
    audioKey = nextAudioKey;
  }
  const storedPayload = { ...data, createdBy: existing.created_by };
  const db = env.DB as D1Database,
    write = await db
      .prepare(
        'UPDATE dailys SET client=?,city=?,state=?,plan=?,end_date=?,payload=?,audio_key=?,updated_at=? WHERE id=?',
      )
      .bind(
        textField(data.client),
        textField(data.city),
        textField(data.state),
        textField(data.plan),
        textField(data.endDate) || textField(data.endDateText),
        JSON.stringify(storedPayload),
        audioKey,
        Date.now(),
        id,
      )
      .run();
  if (!write.success || write.meta.changes !== 1)
    return Response.json(
      { error: 'Não foi possível confirmar a atualização da daily.' },
      { status: 500 },
    );
  const saved = await db
    .prepare(
      'SELECT id,client,city,state,plan,end_date,payload,audio_key,created_by,created_at,updated_at FROM dailys WHERE id=?',
    )
    .bind(id)
    .first();
  if (!saved)
    return Response.json(
      { error: 'A daily não apareceu na lista após a atualização.' },
      { status: 500 },
    );
  await recordActivity(u.email, 'edit', id, textField(data.client));
  return Response.json(
    { ok: true, id, audioKey, saved: true, record: saved },
    { headers: { 'cache-control': 'no-store' } },
  );
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const u = await user(request);
  if (!u?.canDelete)
    return Response.json({ error: 'Sem permissão' }, { status: 403 });
  const { id } = await params,
    existing = await env.DB.prepare('SELECT audio_key FROM dailys WHERE id=?')
      .bind(id)
      .first<{ audio_key: string | null }>();
  if (!existing)
    return Response.json({ error: 'Daily não encontrada' }, { status: 404 });
  await (env.DB as D1Database)
    .prepare('DELETE FROM dailys WHERE id=?')
    .bind(id)
    .run();
  if (existing.audio_key) await deleteAudio(existing.audio_key);
  return Response.json({ ok: true });
}
