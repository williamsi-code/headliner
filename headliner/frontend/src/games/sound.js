// Tiny Web Audio synth so the games make sound without any audio files.
let ctx = null;
function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function tone(freq, ms = 160, type = 'triangle', vol = 0.18) {
  const a = audio();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + ms / 1000);
  o.connect(g).connect(a.destination);
  o.start();
  o.stop(a.currentTime + ms / 1000 + 0.02);
}

export const LANE_NOTES = [261.6, 329.6, 392.0, 523.3];
export const buzz = () => tone(110, 180, 'sawtooth', 0.12);
