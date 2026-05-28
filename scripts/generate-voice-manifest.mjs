#!/usr/bin/env node
// Enumerates every spoken line in the story and writes assets/audio/voices.json,
// one entry per line: { key, speaker, text, file }. Each spoken line needs its
// own clip — fill in `file` to play a real recording for that line; leave it ""
// to use the synthesized blip.
//
// Re-running PRESERVES any `file` values you've already set (matched by `key`),
// adds entries for new lines, and drops entries for lines that no longer exist.
//
// Usage: npm run voices
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SCENES } from "../js/story.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "assets", "audio");
const outPath = join(outDir, "voices.json");

// Load existing file assignments so a regenerate doesn't wipe them.
const existing = {};
try {
  const prev = JSON.parse(await readFile(outPath, "utf8"));
  for (const line of prev.lines ?? []) if (line.file) existing[line.key] = line.file;
} catch {
  /* no previous manifest */
}

const lines = [];
for (const [sceneId, scene] of Object.entries(SCENES)) {
  (scene.beats ?? []).forEach((beat, i) => {
    if (!beat.speaker) return; // narration has no voice line
    const key = `${sceneId}:${i}`;
    lines.push({ key, speaker: beat.speaker, text: beat.text, file: existing[key] ?? "" });
  });
}

const manifest = {
  _comment:
    "One entry per spoken line. Put a clip filename (in assets/audio/) into `file` to play it for that line; leave \"\" for the synthesized blip. `key` is sceneId:beatIndex and must match the story — regenerate with `npm run voices`.",
  lines,
};

await mkdir(outDir, { recursive: true });
await writeFile(outPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

const assigned = lines.filter((l) => l.file).length;
console.log(`Wrote ${lines.length} spoken line(s) to assets/audio/voices.json (${assigned} with a clip, ${lines.length - assigned} using blips).`);
