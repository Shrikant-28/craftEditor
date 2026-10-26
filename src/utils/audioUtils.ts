/**
 * Audio Utilities for Voice Notes
 */

/**
 * Formats time in seconds to mm:ss format (e.g., 01:23)
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Generates an aesthetic, realistic pseudo-waveform array of normalized peaks (0.15 to 0.95)
 */
export function generateWaveform(sampleCount = 36, seed = 'voice-note'): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  const bars: number[] = new Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    // Combine multiple sine waves and pseudo-random hash variations for natural speech cadences
    const t = i / sampleCount;
    const wave1 = Math.sin(t * Math.PI * 3.5);
    const wave2 = Math.cos(t * Math.PI * 6.2);
    const pseudoRand = Math.abs(Math.sin(hash + i * 19.3));
    const combined = Math.abs(wave1 * 0.4 + wave2 * 0.3 + pseudoRand * 0.3);
    const normalized = Math.max(0.15, Math.min(0.95, combined));
    bars[i] = Math.round(normalized * 100) / 100;
  }
  return bars;
}

/**
 * Generates a valid standard 16-bit PCM WAV audio clip encoded in Base64 Data URL.
 * Produces a warm, pleasant dual-tone chime.
 * Optimized with chunked conversion to prevent heap string thrashing.
 */
export function createSampleAudioBase64(durationSeconds = 2.5, sampleRate = 8000): string {
  const numSamples = Math.floor(durationSeconds * sampleRate);
  const bytesPerSample = 2; // 16-bit
  const subChunk2Size = numSamples * bytesPerSample;
  const chunkSize = 36 + subChunk2Size;

  // Header 44 bytes
  const buffer = new Uint8Array(44 + subChunk2Size);
  const view = new DataView(buffer.buffer);

  // RIFF chunk descriptor
  buffer.set([0x52, 0x49, 0x46, 0x46], 0); // 'RIFF'
  view.setUint32(4, chunkSize, true);
  buffer.set([0x57, 0x41, 0x56, 0x45], 8); // 'WAVE'

  // fmt sub-chunk
  buffer.set([0x66, 0x6d, 0x74, 0x20], 12); // 'fmt '
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * bytesPerSample, true); // ByteRate
  view.setUint16(32, bytesPerSample, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample (16)

  // data sub-chunk
  buffer.set([0x64, 0x61, 0x74, 0x61], 36); // 'data'
  view.setUint32(40, subChunk2Size, true);

  // Generate pleasant dual-tone bell chime with gentle decay
  const freq1 = 523.25; // C5
  const freq2 = 659.25; // E5
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const decay = Math.exp(-1.8 * t);
    const sampleVal = (Math.sin(2 * Math.PI * freq1 * t) * 0.5 + Math.sin(2 * Math.PI * freq2 * t) * 0.5) * decay;
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sampleVal * 28000)));
    view.setInt16(44 + i * 2, intSample, true);
  }

  // Convert binary to base64 using 8KB chunking to prevent intermediate string allocations
  let binary = '';
  const len = buffer.byteLength;
  const CHUNK_SIZE = 8192;
  for (let i = 0; i < len; i += CHUNK_SIZE) {
    const chunk = buffer.subarray(i, Math.min(i + CHUNK_SIZE, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  const base64 = btoa(binary);
  return `data:audio/wav;base64,${base64}`;
}

/**
 * Downloads audio data URL to user's computer
 */
export function downloadAudioFile(audioData: string, filename = 'voice-note.webm') {
  const link = document.createElement('a');
  link.href = audioData;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
