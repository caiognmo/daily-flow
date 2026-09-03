const SESSION_COOKIE = 'sigedaily_session';
const SESSION_SECONDS = 8 * 60 * 60;

type SessionPayload = {
  email: string;
  issuedAt: number;
  expiresAt: number;
};

const encoder = new TextEncoder();

const bytesToBase64Url = (bytes: Uint8Array) => {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '');
};

const base64UrlToBytes = (value: string) => {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    '=',
  );
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const signingKey = (secret: string, usages: KeyUsage[]) =>
  crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usages,
  );

export const createSessionToken = async (email: string, secret: string) => {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    email: email.trim().toLowerCase(),
    issuedAt: now,
    expiresAt: now + SESSION_SECONDS,
  };
  const encodedPayload = bytesToBase64Url(
    encoder.encode(JSON.stringify(payload)),
  );
  const key = await signingKey(secret, ['sign']);
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(encodedPayload),
  );
  return `${encodedPayload}.${bytesToBase64Url(new Uint8Array(signature))}`;
};

export const verifySessionToken = async (
  token: string,
  secret: string,
): Promise<SessionPayload | null> => {
  const [encodedPayload, encodedSignature, extra] = token.split('.');
  if (!encodedPayload || !encodedSignature || extra) return null;
  try {
    const key = await signingKey(secret, ['verify']);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlToBytes(encodedSignature),
      encoder.encode(encodedPayload),
    );
    if (!valid) return null;
    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(encodedPayload)),
    ) as Partial<SessionPayload>;
    const now = Math.floor(Date.now() / 1000);
    if (
      typeof payload.email !== 'string' ||
      typeof payload.issuedAt !== 'number' ||
      typeof payload.expiresAt !== 'number' ||
      payload.issuedAt > now + 60 ||
      payload.expiresAt <= now
    )
      return null;
    return payload as SessionPayload;
  } catch {
    return null;
  }
};

export const sessionCookie = (token: string) =>
  `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_SECONDS}`;

export const expiredSessionCookie = () =>
  `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

export const sessionTokenFromRequest = (request: Request) => {
  const cookie = request.headers.get('cookie') || '';
  for (const part of cookie.split(';')) {
    const [name, ...value] = part.trim().split('=');
    if (name === SESSION_COOKIE) return value.join('=');
  }
  return '';
};
