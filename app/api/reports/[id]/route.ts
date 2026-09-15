import { env } from 'cloudflare:workers';
import { authorizedCompanyEmail } from '@/lib/request-identity';

const audioUrlForKey = (key: string) =>
  `/api/audio/${key.split('/').map(encodeURIComponent).join('/')}`;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await authorizedCompanyEmail(request)))
    return Response.json(
      { error: 'Entre com uma conta corporativa autorizada.' },
      { status: 401, headers: { 'cache-control': 'no-store' } },
    );
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id))
    return Response.json({ error: 'Relatório inválido' }, { status: 400 });
  const row = await (env.DB as D1Database)
    .prepare('SELECT payload,audio_key,created_by FROM dailys WHERE id=?')
    .bind(id)
    .first<{
      payload: string;
      audio_key: string | null;
      created_by: string;
    }>();
  if (!row)
    return Response.json(
      { error: 'Relatório não encontrado' },
      { status: 404 },
    );
  try {
    const payload = JSON.parse(row.payload) as Record<string, unknown>;
    return Response.json(
      {
        ...payload,
        createdBy: row.created_by,
        audioUrl: row.audio_key ? audioUrlForKey(row.audio_key) : undefined,
      },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch {
    return Response.json({ error: 'Relatório corrompido' }, { status: 500 });
  }
}
