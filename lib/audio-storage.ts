import { env } from 'cloudflare:workers';

export const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

export type AudioMetadata = {
  contentType: string;
  fileName: string;
  size: number;
};

export const audioKeyFor = (dailyId: string, audio: File) => {
  const extension = audio.type.includes('mp4') ? 'm4a' : 'webm';
  return `dailys/${dailyId}/audio.${extension}`;
};

export const putAudio = async (key: string, audio: File) => {
  await env.AUDIO_FILES.put(key, audio.stream(), {
    metadata: {
      contentType: audio.type || 'audio/webm',
      fileName: audio.name,
      size: audio.size,
    } satisfies AudioMetadata,
  });
};

export const deleteAudio = async (key: string) => {
  await env.AUDIO_FILES.delete(key);
};
