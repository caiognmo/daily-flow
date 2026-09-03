import { expiredSessionCookie } from '@/lib/auth-session';

export async function POST() {
  return Response.json(
    { ok: true },
    {
      headers: {
        'cache-control': 'no-store',
        'set-cookie': expiredSessionCookie(),
      },
    },
  );
}
