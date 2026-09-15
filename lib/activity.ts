import { env } from 'cloudflare:workers';

// This permission is deliberately independent of delegated administration.
export const canReadActivity = (email: string) =>
  ['caio@sistemasbr.net', 'caio@sistemasbr.com.br'].includes(email);

export async function recordActivity(
  email: string,
  action: 'access' | 'view' | 'create' | 'edit',
  reportId = '',
  client = '',
) {
  const now = Date.now();
  // Collapse repeated session checks (30 minutes) and repeated loads (1 minute).
  const interval =
    action === 'access' ? 30 * 60_000 : action === 'view' ? 60_000 : 0;
  try {
    await env.DB.prepare(`INSERT INTO activity_events(id,email,action,report_id,client,created_at)
      SELECT ?,?,?,?,?,? WHERE NOT EXISTS (
        SELECT 1 FROM activity_events WHERE email=? AND action=? AND report_id=? AND created_at>?
      )`)
      .bind(
        crypto.randomUUID(),
        email,
        action,
        reportId,
        client.slice(0, 500),
        now,
        email,
        action,
        reportId,
        now - interval,
      )
      .run();
  } catch {
    // An unavailable audit store must not make a successfully saved daily look failed.
    console.error('activity_write_failed', { action });
  }
}
