#!/usr/bin/env node
// Validates the story graph so a broken link can't ship.
// Checks: dangling next/auto targets, unknown images, unknown speakers,
// bad stat/relationship keys, and unreachable scenes.
// Usage: npm run validate
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SCENES, ENDINGS, CHARACTERS, STAT_DEFS } from "../js/story.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const STAT_KEYS = new Set(STAT_DEFS.map((s) => s.key));
const REL_KEYS = new Set(Object.keys(CHARACTERS).filter((c) => c !== "you"));
const SPECIAL = new Set(["__ending__"]);

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const images = JSON.parse(await readFile(join(root, "assets", "images.json"), "utf8"));
const IMG_IDS = new Set(images.images.map((i) => i.id));

const targets = (scene) => {
  const t = [];
  if (scene.auto) t.push(scene.auto);
  for (const c of scene.choices ?? []) if (c.next) t.push(c.next);
  return t;
};

// 0. Character art references resolve.
for (const [cid, c] of Object.entries(CHARACTERS)) {
  if (c.img && !IMG_IDS.has(c.img)) err(`character "${cid}" portrait image "${c.img}" not in manifest`);
  if (c.sprite && !IMG_IDS.has(c.sprite)) err(`character "${cid}" sprite image "${c.sprite}" not in manifest`);
}

// 1. Per-scene structural checks.
for (const [id, scene] of Object.entries(SCENES)) {
  if (!scene.title) warn(`scene "${id}" has no title`);
  if (scene.image && !IMG_IDS.has(scene.image)) err(`scene "${id}" references unknown image "${scene.image}"`);
  if (!scene.beats || !scene.beats.length) warn(`scene "${id}" has no beats`);
  for (const [bi, b] of (scene.beats ?? []).entries()) {
    if (!b.text) warn(`scene "${id}" beat #${bi + 1} has no text`);
    if (b.speaker && !CHARACTERS[b.speaker]) err(`scene "${id}" beat #${bi + 1} unknown speaker "${b.speaker}"`);
  }
  if (!scene.auto && !(scene.choices && scene.choices.length))
    err(`scene "${id}" is a dead end (no auto and no choices)`);

  for (const tgt of targets(scene)) {
    if (!SPECIAL.has(tgt) && !SCENES[tgt]) err(`scene "${id}" links to missing scene "${tgt}"`);
  }

  for (const [i, c] of (scene.choices ?? []).entries()) {
    const where = `scene "${id}" choice #${i + 1} ("${(c.text || "").slice(0, 30)}")`;
    if (!c.text) err(`${where} has no text`);
    if (!c.next) err(`${where} has no next`);
    for (const k of Object.keys(c.effects ?? {})) if (!STAT_KEYS.has(k)) err(`${where} bad stat key "${k}"`);
    for (const k of Object.keys(c.rel ?? {})) if (!REL_KEYS.has(k)) err(`${where} bad relationship key "${k}"`);
    if (c.require?.minRel && !REL_KEYS.has(c.require.minRel[0]))
      err(`${where} require.minRel bad character "${c.require.minRel[0]}"`);
  }
}

// 2. Endings sanity.
if (!ENDINGS.length) err("no endings defined");
for (const e of ENDINGS) {
  if (typeof e.when !== "function") err(`ending "${e.id}" has no when() function`);
  if (e.image && !IMG_IDS.has(e.image)) err(`ending "${e.id}" references unknown image "${e.image}"`);
}
if (ENDINGS.length && ENDINGS.at(-1).when() !== true)
  warn("last ending is not an unconditional fallback — some stat combos may produce no ending");

// 3. Reachability from "start".
const seen = new Set();
const queue = ["start"];
while (queue.length) {
  const id = queue.shift();
  if (seen.has(id) || SPECIAL.has(id)) continue;
  seen.add(id);
  if (SCENES[id]) for (const t of targets(SCENES[id])) queue.push(t);
}
for (const id of Object.keys(SCENES)) if (!seen.has(id)) warn(`scene "${id}" is unreachable from "start"`);

// Report.
const total = Object.keys(SCENES).length;
console.log(`Validated ${total} scenes, ${ENDINGS.length} endings, ${IMG_IDS.size} images.`);
for (const w of warnings) console.log(`  ⚠ ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error(`\n${errors.length} error(s).`);
  process.exit(1);
}
console.log(`\n✓ Story graph OK${warnings.length ? ` (${warnings.length} warning(s))` : ""}.`);
