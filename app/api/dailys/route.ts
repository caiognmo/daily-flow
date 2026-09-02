import { env } from 'cloudflare:workers';
const identity = (request: Request) => {
  const url = new URL(request.url),
    local = ['localhost', '127.0.0.1'].includes(url.hostname);
  return (local
    ? 'caio@sistemasbr.com.br'
    : request.headers.get('cf-access-authenticated-user-email') ||
      request.headers.get('oai-authenticated-user-email') || '').toLowerCase();
};
const valid = (email: string) =>
  email.endsWith('@sistemasbr.net') || email.endsWith('@sistemasbr.com.br');
export async function GET(request: Request) {
  const email = identity(request);
  if (!valid(email))
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  const rows = await (env.DB as D1Database)
    .prepare(
      'SELECT id,client,city,state,plan,end_date,payload,audio_key,created_by,created_at,updated_at FROM dailys ORDER BY created_at DESC',
    )
    .all();
  return Response.json(rows.results);
}
export async function POST(request: Request) {
  const email = identity(request);
  if (!valid(email))
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
    audioKey = `dailys/${id}/${audio.name}`;
    await (env.FILES as R2Bucket).put(audioKey, audio.stream(), {
      httpMetadata: { contentType: audio.type },
    });
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
  return Response.json({ id }, { status: 201 });
}
