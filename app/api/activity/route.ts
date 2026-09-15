import { env } from 'cloudflare:workers';
import { requestEmail, isAllowedCompanyEmail } from '@/lib/request-identity';
import { recordActivity } from '@/lib/activity';

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin)
    return Response.json({ error: 'Origem inválida' }, { status: 403 });
  const email = await requestEmail(request);
  if (!isAllowedCompanyEmail(email)) return new Response(null, { status: 401 });
  const permission = await env.DB.prepare(
    'SELECT enabled FROM permissions WHERE email=?',
  )
    .bind(email)
    .first<{ enabled: number }>();
  if (permission?.enabled === 0) return new Response(null, { status: 403 });
  let id: unknown;
  try {
    id = ((await request.json()) as { reportId?: unknown }).reportId;
  } catch {
    return new Response(null, { status: 400 });
  }
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id))
    return new Response(null, { status: 400 });
  const row = await env.DB.prepare('SELECT client FROM dailys WHERE id=?')
    .bind(id)
    .first<{ client: string }>();
  if (!row) return new Response(null, { status: 404 });
  await recordActivity(email, 'view', id, row.client);
  return new Response(null, { status: 204 });
}
