#!/usr/bin/env node
// Assembles the deployable static site into dist/ — just the files the browser
// needs (no node scripts, node_modules, or docs). Run the asset generators and
// the validator before this (see `npm run build:site`).
//
// Usage: node scripts/build-site.mjs
import { rm, mkdir, cp, stat, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

// Warn (don't fail) if the manifest references art/audio files that aren't on
// disk — those would 404 on the deployed site.
async function checkReferenced() {
  const missing = [];
  try {
    const imgs = JSON.parse(await readFile(join(root, "assets", "images.json"), "utf8"));
    for (const img of imgs.images) {
      await stat(join(root, "assets", "images", img.file)).catch(() => missing.push(`assets/images/${img.file} (id: ${img.id})`));
    }
  } catch {
    /* no manifest */
  }
  try {
    const voices = JSON.parse(await readFile(join(root, "assets", "audio", "voices.json"), "utf8"));
    for (const line of voices.lines ?? []) {
      if (line.file) await stat(join(root, "assets", "audio", line.file)).catch(() => missing.push(`assets/audio/${line.file} (line: ${line.key})`));
    }
  } catch {
    /* no manifest */
  }
  for (const m of missing) console.warn(`  ⚠ referenced file not found: ${m}`);
  if (missing.length) console.warn(`  ⚠ ${missing.length} referenced file(s) missing — they'll 404 on the live site.`);
}

await checkReferenced();

// Everything the running game references, relative to repo root.
const INCLUDE = ["index.html", "css", "js", "assets"];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const entry of INCLUDE) {
  const src = join(root, entry);
  try {
    await stat(src);
  } catch {
    console.error(`✗ missing "${entry}" — cannot build site`);
    process.exit(1);
  }
  await cp(src, join(dist, entry), { recursive: true });
  console.log(`  ✓ ${entry}`);
}

console.log(`\nBuilt static site into dist/`);
