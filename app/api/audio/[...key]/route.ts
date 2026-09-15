import { env } from 'cloudflare:workers';
import { authorizedCompanyEmail } from '@/lib/request-identity';
import type { AudioMetadata } from '@/lib/audio-storage';
export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  if (!(await authorizedCompanyEmail(request)))
    return new Response('Não autorizado', {
      status: 401,
      headers: { 'cache-control': 'no-store' },
    });
  const { key } = await params,
    stored = await env.AUDIO_FILES.getWithMetadata<AudioMetadata>(
      key.join('/'),
      'arrayBuffer',
    );
  if (!stored.value) return new Response('Não encontrado', { status: 404 });
  const bytes = new Uint8Array(stored.value),
    size = bytes.byteLength,
    h = new Headers({
      'content-type': stored.metadata?.contentType || 'audio/webm',
      'accept-ranges': 'bytes',
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
    });
  const range = request.headers.get('range')?.match(/^bytes=(\d*)-(\d*)$/);
  if (!range) {
    h.set('content-length', String(size));
    return new Response(bytes, { headers: h });
  }
  const [, rawStart, rawEnd] = range;
  let start: number, end: number;
  if (!rawStart && rawEnd) {
    const suffixLength = Number(rawEnd);
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(rawStart || 0);
    end = rawEnd ? Math.min(Number(rawEnd), size - 1) : size - 1;
  }
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    start >= size ||
    end < start
  ) {
    h.set('content-range', `bytes */${size}`);
    return new Response(null, { status: 416, headers: h });
  }
  const chunk = bytes.slice(start, end + 1);
  h.set('content-range', `bytes ${start}-${end}/${size}`);
  h.set('content-length', String(chunk.byteLength));
  return new Response(chunk, { status: 206, headers: h });
}
