import { env } from 'cloudflare:workers';
const adminEmails = () =>
  (
    (env as unknown as Record<string, string>).ADMIN_EMAILS ||
    'caio@sistemasbr.com.br,caio@sistemasbr.net'
  )
    .toLowerCase()
    .split(',')
    .map((value) => value.trim());
const identity = (request: Request) => {
  const u = new URL(request.url),
    local = ['localhost', '127.0.0.1'].includes(u.hostname);
  return (
    local
      ? 'caio@sistemasbr.com.br'
      : request.headers.get('cf-access-authenticated-user-email') ||
        request.headers.get('oai-authenticated-user-email') ||
        ''
  ).toLowerCase();
};
export async function GET(request: Request) {
  if (!adminEmails().includes(identity(request)))
    return Response.json({ error: 'Sem permissão' }, { status: 403 });
  const rows = await (env.DB as D1Database)
    .prepare(
      'SELECT email,can_edit,can_delete,enabled FROM permissions ORDER BY email',
    )
    .all();
  return Response.json(rows.results);
}
export async function POST(request: Request) {
  if (!adminEmails().includes(identity(request)))
    return Response.json({ error: 'Sem permissão' }, { status: 403 });
  const d = (await request.json()) as {
      email: string;
      canEdit: boolean;
      canDelete: boolean;
      enabled: boolean;
    },
    email = d.email.toLowerCase();
  if (
    !email.endsWith('@sistemasbr.net') &&
    !email.endsWith('@sistemasbr.com.br')
  )
    return Response.json({ error: 'Domínio inválido' }, { status: 400 });
  await (env.DB as D1Database)
    .prepare(
      'INSERT INTO permissions(email,can_edit,can_delete,enabled,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(email) DO UPDATE SET can_edit=excluded.can_edit,can_delete=excluded.can_delete,enabled=excluded.enabled,updated_at=excluded.updated_at',
    )
    .bind(
      email,
      d.canEdit ? 1 : 0,
      d.canDelete ? 1 : 0,
      d.enabled ? 1 : 0,
      Date.now(),
    )
    .run();
  return Response.json({ ok: true });
}
