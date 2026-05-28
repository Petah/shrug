#!/usr/bin/env node
// Generates an SVG placeholder for every image in assets/images.json.
// Each placeholder is stamped with the image's description so you (or an
// artist) know exactly what to draw before swapping in the real asset.
//
// Usage: npm run placeholders
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const manifestPath = join(root, "assets", "images.json");
const outDir = join(root, "assets", "images");

const PALETTE = {
  scene: { bg: "#1f2a3a", accent: "#3b5170", text: "#dbe4f0", tag: "#5b7aa8" },
  portrait: { bg: "#2a2230", accent: "#5a3f63", text: "#efe1f0", tag: "#9a6fae" },
};

function esc(s) {
  return String(s).replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]));
}

// Naive word-wrap into <= maxChars lines, capped at maxLines (… on overflow).
function wrap(text, maxChars, maxLines) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > maxChars) {
      lines.push(line.trim());
      line = w;
      if (lines.length === maxLines - 1) break;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line && lines.length < maxLines) lines.push(line.trim());
  const used = words.join(" ").length;
  const shown = lines.join(" ").length;
  if (shown < used && lines.length) lines[lines.length - 1] += " …";
  return lines;
}

function svgFor(img) {
  const pal = PALETTE[img.kind] || PALETTE.scene;
  const { w, h } = img;
  const pad = Math.round(Math.min(w, h) * 0.08);
  const maxChars = Math.max(18, Math.round(w / 13));
  const lines = wrap(img.description, maxChars, 10);
  const lineH = Math.round(Math.min(w, h) * 0.045);
  const descStartY = Math.round(h * 0.42);
  const descSvg = lines
    .map((ln, i) => `<text x="${pad}" y="${descStartY + i * lineH}" class="desc">${esc(ln)}</text>`)
    .join("\n    ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(img.alt)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${pal.bg}"/>
      <stop offset="1" stop-color="${pal.accent}"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0V40" fill="none" stroke="${pal.accent}" stroke-opacity="0.25" stroke-width="1"/>
    </pattern>
    <style>
      .tag  { font: 700 ${Math.round(lineH * 0.9)}px system-ui, sans-serif; fill: ${pal.text}; letter-spacing: 2px; }
      .id   { font: 800 ${Math.round(lineH * 1.4)}px system-ui, sans-serif; fill: ${pal.text}; }
      .desc { font: 400 ${Math.round(lineH * 0.72)}px system-ui, sans-serif; fill: ${pal.text}; fill-opacity: 0.85; }
      .meta { font: 500 ${Math.round(lineH * 0.6)}px ui-monospace, monospace; fill: ${pal.text}; fill-opacity: 0.6; }
    </style>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect width="${w}" height="${h}" fill="url(#grid)"/>
  <rect x="6" y="6" width="${w - 12}" height="${h - 12}" fill="none" stroke="${pal.tag}" stroke-width="3" stroke-dasharray="14 10"/>
  <text x="${pad}" y="${pad + lineH}" class="tag">PLACEHOLDER · ${esc(img.kind.toUpperCase())}</text>
  <text x="${pad}" y="${Math.round(h * 0.3)}" class="id">${esc(img.id)}</text>
  ${descSvg}
  <text x="${pad}" y="${h - pad}" class="meta">${w}×${h} · replace with real art</text>
</svg>
`;
}

async function main() {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  await mkdir(outDir, { recursive: true });
  let count = 0;
  for (const img of manifest.images) {
    const out = join(outDir, img.file);
    await writeFile(out, svgFor(img), "utf8");
    count++;
    console.log(`  ✓ ${img.file.padEnd(28)} (${img.w}×${img.h})`);
  }
  console.log(`\nGenerated ${count} placeholder(s) into assets/images/`);
}

main().catch((e) => {
  console.error("Failed to generate placeholders:", e);
  process.exit(1);
});
