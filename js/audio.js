// Voice/SFX for dialogue. Uses the Web Audio API to synthesize a short "blip"
// per spoken line (no asset files required), with per-character pitch. You can
// later drop in real voice clips: register them via registerVoiceFiles() and
// they'll play instead of the synth blip (falling back to synth if a file is
// missing or can't play).

let ctx = null;
const fileMap = {}; // lineKey ("sceneId:beatIndex") -> url
let currentAudio = null; // active HTMLAudioElement (real clip)
let liveNodes = []; // active synth oscillators/gains, so we can cut them short

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
    const entry = { osc, gain: g };
    liveNodes.push(entry);
    osc.onended = () => {
      liveNodes = liveNodes.filter((e) => e !== entry);
    };
  }
}

// Immediately stop whatever voice is playing (clip or synth blip).
// Called when the player advances, so a line never bleeds into the next beat.
export function stopVoice() {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {
      /* ignore */
    }
    currentAudio = null;
  }
  if (ctx && liveNodes.length) {
    const now = ctx.currentTime;
    for (const { osc, gain } of liveNodes) {
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03); // tiny fade to avoid a click
        osc.stop(now + 0.04);
      } catch {
        /* already stopped */
      }
    }
    liveNodes = [];
  }
}

// Play a spoken line's sound. line = { key, voice }.
// If a real clip is registered for this exact line key, play it; otherwise fall
// back to a synthesized blip at the character's pitch.
export function playVoice(line) {
  stopVoice(); // never overlap with a previous line
  const url = line.key && fileMap[line.key];
  if (url) {
    try {
      const a = new Audio(url);
      a.volume = 0.9;
      currentAudio = a;
      a.addEventListener("ended", () => {
        if (currentAudio === a) currentAudio = null;
      });
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
