#!/usr/bin/env node
// Minimal zero-dependency static file server for local play/testing.
// Usage: npm run serve   (then open http://localhost:5173)
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, normalize, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT) || 5173;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
};

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (urlPath === "/") urlPath = "/index.html";
    // Prevent path traversal: resolve and ensure it stays under root.
    const filePath = normalize(join(root, urlPath));
    if (!filePath.startsWith(root)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    const info = await stat(filePath);
    if (info.isDirectory()) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    const body = await readFile(filePath);
    res.writeHead(200, { "Content-Type": TYPES[extname(filePath)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" }).end("404 Not Found");
  }
});

server.listen(port, () => {
  console.log(`As Per My Last Email running at http://localhost:${port}`);
  console.log("Press Ctrl+C to stop.");
});
