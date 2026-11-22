// The Velvet Vault — every sound is synthesized with WebAudio.
// No audio files: a footstep, a coin, a jewel chime, an alarm sting,
// the room-clear arpeggio and the getaway fanfare, all from oscillators.
let audioCtx = null;
let muted = false;

function ctx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

export function setMuted(value) {
  muted = value;
}

// A short tone: oscillator, frequency slide, gain envelope, done.
function tone(freq, dur, type, vol, slideTo) {
  if (muted) return;
  const ac = ctx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const now = ac.currentTime;
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, now);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
  gain.gain.setValueAtTime(vol || 0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

// A burst of filtered noise: footsteps, smoke, a door slamming.
function noise(dur, vol, lowFreq) {
  if (muted) return;
  const ac = ctx();
  if (!ac) return;
  const len = Math.floor(ac.sampleRate * dur);
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowFreq || 800;
  const gain = ac.createGain();
  gain.gain.value = vol || 0.08;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  src.start();
}

// Drain the world's event queue and play each cue once.
export function playEvents(events) {
  for (const event of events) {
    switch (event) {
      case 'step':
        noise(0.07, 0.05, 500);
        break;
      case 'coin':
        tone(2400, 0.09, 'triangle', 0.1, 1800);
        tone(3100, 0.12, 'triangle', 0.07, 2600);
        break;
      case 'loot':
        tone(880, 0.12, 'sine', 0.12);
        tone(1318, 0.18, 'sine', 0.1);
        break;
      case 'prize':
        tone(523, 0.14, 'triangle', 0.12);
        tone(659, 0.14, 'triangle', 0.12);
        tone(784, 0.2, 'triangle', 0.12);
        tone(1046, 0.3, 'triangle', 0.1);
        break;
      case 'alarm':
        tone(220, 0.22, 'sawtooth', 0.09, 440);
        tone(220, 0.22, 'sawtooth', 0.09, 440);
        break;
      case 'caught':
        tone(392, 0.25, 'sawtooth', 0.12, 196);
        tone(311, 0.3, 'sawtooth', 0.12, 155);
        noise(0.4, 0.12, 400);
        break;
      case 'clear':
        [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'triangle', 0.11), i * 95));
        break;
      case 'win':
        [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'triangle', 0.11), i * 110));
        break;
      case 'smoke':
        noise(0.6, 0.1, 1200);
        break;
      default:
        break;
    }
  }
  events.length = 0;
}
