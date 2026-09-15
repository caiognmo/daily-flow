import { env } from 'cloudflare:workers';
import { requestEmail } from '@/lib/request-identity';
import { canReadActivity } from '@/lib/activity';

export async function GET(request: Request) {
  const headers = { 'cache-control': 'no-store' };
  if (!canReadActivity(await requestEmail(request)))
    return Response.json(
      { error: 'Acesso exclusivo do Caio.' },
      { status: 403, headers },
    );
  const p = new URL(request.url).searchParams;
  const start = Date.parse(`${p.get('from')}T00:00:00-03:00`);
  const end = Date.parse(`${p.get('to')}T23:59:59.999-03:00`);
  const page = Number(p.get('page') || 0);
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start > end ||
    !Number.isInteger(page) ||
    page < 0 ||
    page > 100000
  )
    return Response.json(
      { error: 'Informe um período válido.' },
      { status: 400, headers },
    );
  const email = (p.get('email') || '').slice(0, 254).toLowerCase();
  const report = (p.get('report') || '').slice(0, 36);
  const action = p.get('action') || '';
  if (action && !['access', 'view', 'create', 'edit'].includes(action))
    return Response.json({ error: 'Ação inválida.' }, { status: 400, headers });
  const where =
    "created_at>=? AND created_at<=? AND (?='' OR email=?) AND (?='' OR report_id=?) AND (?='' OR action=?)";
  const args = [start, end, email, email, report, report, action, action];
  try {
    const [logs, total, users, since] = await Promise.all([
      env.DB.prepare(
        `SELECT * FROM activity_events WHERE ${where} ORDER BY created_at DESC,id DESC LIMIT 50 OFFSET ?`,
      )
        .bind(...args, page * 50)
        .all(),
      env.DB.prepare(
        `SELECT COUNT(*) AS count FROM activity_events WHERE ${where}`,
      )
        .bind(...args)
        .first<{ count: number }>(),
      env.DB.prepare(`WITH known AS (
        SELECT email FROM permissions UNION SELECT created_by FROM dailys UNION SELECT email FROM activity_events
      ), stats AS (
        SELECT email, COUNT(*) AS events, SUM(action='access') AS accesses,
          SUM(action='view') AS views, SUM(action='create') AS creations,
          COUNT(DISTINCT strftime('%Y-%m-%d',created_at/1000,'unixepoch','-3 hours')) AS active_days
        FROM activity_events WHERE created_at>=? AND created_at<=? AND (?='' OR report_id=?) GROUP BY email
      ), last_seen AS (SELECT email,MAX(created_at) AS last_seen FROM activity_events GROUP BY email)
      SELECT k.email, l.last_seen, COALESCE(s.events,0) AS events, COALESCE(s.accesses,0) AS accesses,
        COALESCE(s.views,0) AS views, COALESCE(s.creations,0) AS creations, COALESCE(s.active_days,0) AS active_days
      FROM known k LEFT JOIN stats s ON s.email=k.email LEFT JOIN last_seen l ON l.email=k.email
      WHERE (?='' OR k.email=?) ORDER BY events ASC,k.email`)
        .bind(start, end, report, report, email, email)
        .all(),
      env.DB.prepare(
        'SELECT MIN(created_at) AS since FROM activity_events',
      ).first<{ since: number | null }>(),
    ]);
    return Response.json(
      {
        logs: logs.results,
        total: total?.count || 0,
        users: users.results,
        since: since?.since || null,
      },
      { headers },
    );
  } catch {
    return Response.json(
      { error: 'Não foi possível carregar o histórico. Tente novamente.' },
      { status: 503, headers },
    );
  }
}
