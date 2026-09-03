import { env } from 'cloudflare:workers';
import {
  sessionTokenFromRequest,
  verifySessionToken,
} from '@/lib/auth-session';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

export const isAllowedCompanyEmail = (email: string) =>
  email.toLowerCase().endsWith('@sistemasbr.net') ||
  email.toLowerCase().endsWith('@sistemasbr.com.br');

export const requestEmail = async (request: Request) => {
  const hostname = new URL(request.url).hostname.toLowerCase();
  if (LOCAL_HOSTS.has(hostname)) return 'caio@sistemasbr.com.br';

  const sitesEmail = hostname.endsWith('.chatgpt.site')
    ? request.headers.get('oai-authenticated-user-email')
    : null;
  if (sitesEmail) return sitesEmail.trim().toLowerCase();

  const secret = (env as unknown as Record<string, string>).AUTH_SESSION_SECRET;
  const token = sessionTokenFromRequest(request);
  if (!secret || !token) return '';
  const session = await verifySessionToken(token, secret);
  return session?.email || '';
};
