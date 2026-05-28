// Bootstraps the game and wires the HUD buttons.
import { Game, setImageMap } from "./engine.js";
import { registerVoiceFiles } from "./audio.js";

// Resolve image ids -> real file paths from the manifest, so dropping in real
// art (any extension) "just works". Falls back to <id>.svg if the manifest
// can't be fetched (e.g. opened via file:// — use `npm run serve` to avoid that).
try {
  const res = await fetch("assets/images.json");
  if (res.ok) {
    const manifest = await res.json();
    const map = {};
    for (const img of manifest.images) map[img.id] = `assets/images/${img.file}`;
    setImageMap(map);
  }
} catch {
  /* fall back to <id>.svg defaults */
}

// Optional: real voice clips, one per spoken line. assets/audio/voices.json
// lists every line with a "key" ("sceneId:beatIndex") and a "file". Fill in the
// file to play a clip for that line; leave it "" for the synthesized blip.
// Regenerate the list with `npm run voices` after editing story content.
try {
  const res = await fetch("assets/audio/voices.json");
  if (res.ok) {
    const manifest = await res.json();
    const resolved = {};
    for (const line of manifest.lines ?? []) {
      if (line.file) resolved[line.key] = `assets/audio/${line.file}`;
    }
    registerVoiceFiles(resolved);
  }
} catch {
  /* synth blips only */
}

const root = document.querySelector("#game");
const game = new Game(root);
window.__game = game; // handy for debugging in the console

const hasSave = !!localStorage.getItem("promotion-season-save");
const resumeBtn = document.querySelector("#btn-resume");
if (hasSave) resumeBtn.hidden = false;

resumeBtn?.addEventListener("click", () => game.load());
document.querySelector("#btn-restart")?.addEventListener("click", () => {
  if (confirm("Restart from Day 1? Your current run will be lost.")) game.reset();
});

// Panel toggles: each button shows/hides its target overlay panel.
document.querySelectorAll(".toggle").forEach((btn) => {
  const panel = document.getElementById(btn.dataset.target);
  if (!panel) return;
  btn.addEventListener("click", () => {
    const open = panel.classList.toggle("hidden") === false;
    btn.classList.toggle("active", open);
  });
});
