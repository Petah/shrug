// Voice/SFX for dialogue. Uses the Web Audio API to synthesize a short "blip"
// per spoken line (no asset files required), with per-character pitch. You can
// later drop in real voice clips: register them via registerVoiceFiles() and
// they'll play instead of the synth blip (falling back to synth if a file is
// missing or can't play).

let ctx = null;
const fileMap = {}; // lineKey ("sceneId:beatIndex") -> url

// Must be (re)tried from a user gesture; browsers block audio before that.
function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

export function registerVoiceFiles(map) {
  Object.assign(fileMap, map || {});
}

// A short two-note "talk" blip at the given base frequency.
function blip(freq) {
  const ac = ensureCtx();
  if (!ac) return;
  if (ac.state === "suspended") ac.resume();
  const now = ac.currentTime;
  const gain = ac.createGain();
  gain.connect(ac.destination);
  gain.gain.setValueAtTime(0.0001, now);

  // Two quick chirps so it reads as "speech", not a UI beep.
  const notes = [
    { f: freq, t: 0, d: 0.09 },
    { f: freq * 1.18, t: 0.07, d: 0.1 },
  ];
  for (const n of notes) {
    const osc = ac.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(n.f, now + n.t);
    const g = ac.createGain();
    g.connect(ac.destination);
    g.gain.setValueAtTime(0.0001, now + n.t);
    g.gain.exponentialRampToValueAtTime(0.18, now + n.t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);
    osc.connect(g);
    osc.start(now + n.t);
    osc.stop(now + n.t + n.d + 0.02);
  }
}

// Play a spoken line's sound. line = { key, voice }.
// If a real clip is registered for this exact line key, play it; otherwise fall
// back to a synthesized blip at the character's pitch.
export function playVoice(line) {
  const url = line.key && fileMap[line.key];
  if (url) {
    try {
      const a = new Audio(url);
      a.volume = 0.9;
      a.play().catch(() => blip(line.voice || 260));
      return;
    } catch {
      /* fall through to synth */
    }
  }
  blip(line.voice || 260);
}

// A soft non-voice tick for narration / continue, optional.
export function tick() {
  blip(140);
}
