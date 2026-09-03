import { env } from 'cloudflare:workers';

export async function GET() {
  const clientId = (env as unknown as Record<string, string>).GOOGLE_CLIENT_ID;
  if (!clientId)
    return Response.json(
      { error: 'Login Google não configurado.' },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    );
  return Response.json(
    { clientId },
    { headers: { 'cache-control': 'no-store' } },
  );
}
