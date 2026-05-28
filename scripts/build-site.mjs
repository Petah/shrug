#!/usr/bin/env node
// Assembles the deployable static site into dist/ — just the files the browser
// needs (no node scripts, node_modules, or docs). Run the asset generators and
// the validator before this (see `npm run build:site`).
//
// Usage: node scripts/build-site.mjs
import { rm, mkdir, cp, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

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
