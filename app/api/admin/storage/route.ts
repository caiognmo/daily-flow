import { env } from 'cloudflare:workers';
import type { AudioMetadata } from '@/lib/audio-storage';
import { requestEmail } from '@/lib/request-identity';

const AUDIO_LIMIT_BYTES = 1_000_000_000;
const adminEmails = () =>
  (
    (env as unknown as Record<string, string>).ADMIN_EMAILS ||
    'caio@sistemasbr.com.br,caio@sistemasbr.net'
  )
    .toLowerCase()
    .split(',')
    .map((value) => value.trim());

const requireAdmin = async (request: Request) =>
  adminEmails().includes(await requestEmail(request));

const parsePeriod = (from: string | null, to: string | null) => {
  if (
    !from ||
    !to ||
    !/^\d{4}-\d{2}-\d{2}$/.test(from) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(to) ||
    from > to
  )
    return null;
  return {
    from,
    to,
    start: Date.parse(`${from}T00:00:00-03:00`),
    end: Date.parse(`${to}T23:59:59.999-03:00`),
  };
};

const audioInventory = async () => {
  const sizes = new Map<string, number>();
  let cursor: string | undefined;
  do {
    const page = await env.AUDIO_FILES.list<AudioMetadata>({
      prefix: 'dailys/',
      cursor,
      limit: 1000,
    });
    for (const key of page.keys)
      sizes.set(key.name, Number(key.metadata?.size || 0));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return sizes;
};

export async function GET(request: Request) {
  if (!(await requireAdmin(request)))
    return Response.json({ error: 'Sem permissão' }, { status: 403 });
  const url = new URL(request.url),
    period = parsePeriod(
      url.searchParams.get('from'),
      url.searchParams.get('to'),
    ),
    db = env.DB as D1Database,
    [totals, audioSizes] = await Promise.all([
      db
        .prepare(
          `SELECT COUNT(*) AS daily_count,
          COALESCE(SUM(LENGTH(id)+LENGTH(client)+LENGTH(city)+LENGTH(state)+LENGTH(plan)+LENGTH(end_date)+LENGTH(payload)+LENGTH(COALESCE(audio_key,''))+LENGTH(created_by)),0) AS estimated_data_bytes
          FROM dailys`,
        )
        .first<{ daily_count: number; estimated_data_bytes: number }>(),
      audioInventory(),
    ]),
    audioBytes = [...audioSizes.values()].reduce((sum, size) => sum + size, 0),
    audioPercent = Math.min(100, (audioBytes / AUDIO_LIMIT_BYTES) * 100);
  let selection: {
    from: string;
    to: string;
    dailyCount: number;
    audioCount: number;
    audioBytes: number;
  } | null = null;
  if (period) {
    const selected = await db
      .prepare(
        'SELECT audio_key FROM dailys WHERE created_at>=? AND created_at<=?',
      )
      .bind(period.start, period.end)
      .all<{ audio_key: string | null }>();
    const keys = selected.results
      .map((row) => row.audio_key)
      .filter((key): key is string => Boolean(key));
    selection = {
      from: period.from,
      to: period.to,
      dailyCount: selected.results.length,
      audioCount: keys.length,
      audioBytes: keys.reduce(
        (sum, key) => sum + (audioSizes.get(key) || 0),
        0,
      ),
    };
  }
  return Response.json(
    {
      dailyCount: Number(totals?.daily_count || 0),
      estimatedDataBytes: Number(totals?.estimated_data_bytes || 0),
      audioCount: audioSizes.size,
      audioBytes,
      audioLimitBytes: AUDIO_LIMIT_BYTES,
      audioPercent,
      remainingAudioBytes: Math.max(0, AUDIO_LIMIT_BYTES - audioBytes),
      warning:
        audioPercent >= 90 ? 'critical' : audioPercent >= 80 ? 'warning' : 'ok',
      selection,
    },
    { headers: { 'cache-control': 'no-store' } },
  );
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin(request)))
    return Response.json({ error: 'Sem permissão' }, { status: 403 });
  const body = (await request.json()) as { from?: string; to?: string },
    period = parsePeriod(body.from || null, body.to || null);
  if (!period)
    return Response.json(
      { error: 'Informe um período inicial e final válido.' },
      { status: 400 },
    );
  const db = env.DB as D1Database,
    selected = await db
      .prepare(
        'SELECT id,audio_key FROM dailys WHERE created_at>=? AND created_at<=? ORDER BY created_at LIMIT 100',
      )
      .bind(period.start, period.end)
      .all<{ id: string; audio_key: string | null }>();
  if (!selected.results.length)
    return Response.json({ deleted: 0, deletedAudio: 0, remaining: 0 });
  await db.batch(
    selected.results.map((row) =>
      db.prepare('DELETE FROM dailys WHERE id=?').bind(row.id),
    ),
  );
  const audioKeys = selected.results
    .map((row) => row.audio_key)
    .filter((key): key is string => Boolean(key));
  await Promise.all(audioKeys.map((key) => env.AUDIO_FILES.delete(key)));
  const remaining = await db
    .prepare(
      'SELECT COUNT(*) AS count FROM dailys WHERE created_at>=? AND created_at<=?',
    )
    .bind(period.start, period.end)
    .first<{ count: number }>();
  return Response.json(
    {
      deleted: selected.results.length,
      deletedAudio: audioKeys.length,
      remaining: Number(remaining?.count || 0),
    },
    { headers: { 'cache-control': 'no-store' } },
  );
}
