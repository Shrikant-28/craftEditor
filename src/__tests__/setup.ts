import { vi } from 'vitest';

// Polyfill URL.createObjectURL and revokeObjectURL in JSDOM
if (typeof window !== 'undefined') {
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = vi.fn((blob: Blob) => `blob:mock-url-${Math.random().toString(36).slice(2)}`);
  }
  if (!window.URL.revokeObjectURL) {
    window.URL.revokeObjectURL = vi.fn();
  }
}

// Polyfill HTMLMediaElement.prototype.play and pause in JSDOM
window.HTMLMediaElement.prototype.play = vi.fn().mockImplementation(function (this: HTMLMediaElement) {
  this.dispatchEvent(new Event('play'));
  return Promise.resolve();
});

window.HTMLMediaElement.prototype.pause = vi.fn().mockImplementation(function (this: HTMLMediaElement) {
  this.dispatchEvent(new Event('pause'));
});

// Polyfill AudioContext for JSDOM
class MockAnalyserNode {
  fftSize = 64;
  smoothingTimeConstant = 0.8;
  frequencyBinCount = 32;
  getByteFrequencyData(array: Uint8Array) {
    array.fill(128);
  }
  connect() {}
  disconnect() {}
}

class MockAudioContext {
  state = 'running';
  createMediaStreamSource() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }
  createAnalyser() {
    return new MockAnalyserNode();
  }
  close() {
    this.state = 'closed';
    return Promise.resolve();
  }
}

(window as any).AudioContext = MockAudioContext;
(window as any).webkitAudioContext = MockAudioContext;
