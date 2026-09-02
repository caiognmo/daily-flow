import { env } from 'cloudflare:workers';
export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const url = new URL(request.url),
    local = ['localhost', '127.0.0.1'].includes(url.hostname),
    email = (local
      ? 'caio@sistemasbr.com.br'
      : request.headers.get('cf-access-authenticated-user-email') ||
        request.headers.get('oai-authenticated-user-email') || '').toLowerCase();
  if (
    !email.endsWith('@sistemasbr.net') &&
    !email.endsWith('@sistemasbr.com.br')
  )
    return new Response('Não autorizado', { status: 401 });
  const { key } = await params,
    obj = await (env.FILES as R2Bucket).get(key.join('/'));
  if (!obj) return new Response('Não encontrado', { status: 404 });
  const h = new Headers();
  obj.writeHttpMetadata(h);
  h.set('cache-control', 'private, max-age=3600');
  return new Response(obj.body, { headers: h });
}
