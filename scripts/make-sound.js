// Generates the lesson-reminder sound as a 16-bit PCM WAV, no audio deps.
//
// Design: a two-note ascending chime (E5 -> B5) with a struck-bell envelope —
// instant attack, exponential decay, plus a quiet octave partial so it reads as
// an instrument rather than a sine beep. Short and warm on purpose: a reminder
// that arrives during a lesson should not sound like an alarm.
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const BIT_DEPTH = 16;

/** One struck note: fundamental + a softer octave, exponentially decaying. */
function note({ freq, startSec, durationSec, gain }) {
  const samples = [];
  const total = Math.floor(durationSec * SAMPLE_RATE);

  for (let i = 0; i < total; i++) {
    const t = i / SAMPLE_RATE;
    // Fast attack (3ms) avoids the click a hard start makes.
    const attack = Math.min(1, t / 0.003);
    const decay = Math.exp(-t * 4.2);
    const body = Math.sin(2 * Math.PI * freq * t);
    const partial = 0.22 * Math.sin(2 * Math.PI * freq * 2 * t);
    samples.push({
      offset: Math.floor(startSec * SAMPLE_RATE) + i,
      value: gain * attack * decay * (body + partial),
    });
  }

  return samples;
}

const notes = [
  // E5 then B5: a rising interval reads as "something is starting".
  ...note({ freq: 659.25, startSec: 0, durationSec: 0.75, gain: 0.5 }),
  ...note({ freq: 987.77, startSec: 0.16, durationSec: 0.8, gain: 0.42 }),
];

const totalSamples = Math.max(...notes.map((s) => s.offset)) + 1;
const mixed = new Float32Array(totalSamples);
for (const { offset, value } of notes) mixed[offset] += value;

// Normalise to just under full scale, so no platform clips it.
let peak = 0;
for (const value of mixed) peak = Math.max(peak, Math.abs(value));
const scale = peak > 0 ? 0.89 / peak : 1;

const pcm = Buffer.alloc(totalSamples * 2);
for (let i = 0; i < totalSamples; i++) {
  pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(mixed[i] * scale * 32767))), i * 2);
}

function wav(data) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE((SAMPLE_RATE * BIT_DEPTH) / 8, 28);
  header.writeUInt16LE(BIT_DEPTH / 8, 32);
  header.writeUInt16LE(BIT_DEPTH, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

// Underscored, not hyphenated: the file lands in Android res/raw, whose
// resource names reject hyphens and fail prebuild.
const out = path.join(process.argv[2] ?? '.', 'lesson_reminder.wav');
fs.writeFileSync(out, wav(pcm));
console.log(`${out}: ${(totalSamples / SAMPLE_RATE).toFixed(2)}s, ${pcm.length + 44} bytes`);
