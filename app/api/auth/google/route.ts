import { env } from 'cloudflare:workers';
import { createSessionToken, sessionCookie } from '@/lib/auth-session';
import { isAllowedCompanyEmail } from '@/lib/request-identity';

type GoogleTokenInfo = {
  aud?: string;
  issued_to?: string;
  email?: string;
  email_verified?: string | boolean;
  expires_in?: string;
};

export async function POST(request: Request) {
  const configuration = env as unknown as Record<string, string>;
  if (!configuration.GOOGLE_CLIENT_ID || !configuration.AUTH_SESSION_SECRET)
    return Response.json(
      { error: 'Login Google não configurado.' },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    );

  let accessToken = '';
  try {
    const body = (await request.json()) as { accessToken?: string };
    accessToken = body.accessToken?.trim() || '';
  } catch {
    return Response.json({ error: 'Solicitação inválida.' }, { status: 400 });
  }
  if (!accessToken || accessToken.length > 4096)
    return Response.json({ error: 'Token inválido.' }, { status: 400 });

  const verification = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
    { headers: { accept: 'application/json' } },
  );
  if (!verification.ok)
    return Response.json(
      { error: 'Não foi possível validar sua conta Google.' },
      { status: 401, headers: { 'cache-control': 'no-store' } },
    );
  const profile = (await verification.json()) as GoogleTokenInfo;
  const audience = profile.aud || profile.issued_to || '';
  const email = profile.email?.trim().toLowerCase() || '';
  const verified =
    profile.email_verified === true || profile.email_verified === 'true';
  if (audience !== configuration.GOOGLE_CLIENT_ID || !verified || !email)
    return Response.json(
      { error: 'A resposta do Google não é válida para este aplicativo.' },
      { status: 401, headers: { 'cache-control': 'no-store' } },
    );
  if (!isAllowedCompanyEmail(email))
    return Response.json(
      {
        code: 'invalid_domain',
        error:
          'Esta conta não pertence à SistemasBR. Escolha outra conta Google.',
      },
      { status: 403, headers: { 'cache-control': 'no-store' } },
    );

  const token = await createSessionToken(
    email,
    configuration.AUTH_SESSION_SECRET,
  );
  return Response.json(
    { authenticated: true, email },
    {
      headers: {
        'cache-control': 'no-store',
        'set-cookie': sessionCookie(token),
      },
    },
  );
}
