import { env } from 'cloudflare:workers';
import {
  audioKeyFor,
  deleteAudio,
  MAX_AUDIO_BYTES,
  putAudio,
} from '@/lib/audio-storage';
import {
  isAllowedCompanyEmail,
  requestEmail,
} from '@/lib/request-identity';
const user = async (request: Request) => {
  const email = requestEmail(request),
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
    data = JSON.parse(String(form.get('payload') || '{}')) as Record<
      string,
      unknown
    >;
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
    if (audioKey && audioKey !== nextAudioKey)
      await deleteAudio(audioKey);
    audioKey = nextAudioKey;
  }
  const storedPayload = { ...data, createdBy: existing.created_by };
  await (env.DB as D1Database)
    .prepare(
      'UPDATE dailys SET client=?,city=?,state=?,plan=?,end_date=?,payload=?,audio_key=?,updated_at=? WHERE id=?',
    )
    .bind(
      String(data.client || ''),
      String(data.city || ''),
      String(data.state || ''),
      String(data.plan || ''),
      String(data.endDate || data.endDateText || ''),
      JSON.stringify(storedPayload),
      audioKey,
      Date.now(),
      id,
    )
    .run();
  return Response.json({ ok: true, id, audioKey });
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
