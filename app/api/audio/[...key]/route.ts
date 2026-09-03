import { env } from 'cloudflare:workers';
import type { AudioMetadata } from '@/lib/audio-storage';
import { isAllowedCompanyEmail, requestEmail } from '@/lib/request-identity';
export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const email = await requestEmail(request);
  if (!isAllowedCompanyEmail(email))
    return new Response('Não autorizado', { status: 401 });
  const { key } = await params,
    stored = await env.AUDIO_FILES.getWithMetadata<AudioMetadata>(
      key.join('/'),
      'stream',
    );
  if (!stored.value) return new Response('Não encontrado', { status: 404 });
  const h = new Headers({
    'content-type': stored.metadata?.contentType || 'audio/webm',
  });
  h.set('cache-control', 'private, max-age=3600');
  return new Response(stored.value, { headers: h });
}
