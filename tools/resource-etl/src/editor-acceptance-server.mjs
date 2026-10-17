// Local-only launcher for the integrated NagWeb 05 acceptance test.
// No npm dependencies, downloads, editor mutations or external deployment.
import http from "node:http";
import path from "node:path";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const mime = {
  ".html": "text/html; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".gif": "image/gif", ".avif": "image/avif",
  ".ico": "image/x-icon", ".webm": "video/webm", ".mp4": "video/mp4",
  ".gltf": "model/gltf+json", ".glb": "model/gltf-binary",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf",
  ".otf": "font/otf", ".wasm": "application/wasm", ".txt": "text/plain; charset=utf-8"
};

const args = new Set(process.argv.slice(2));
const portArg = [...args].find(value => value.startsWith("--port="));
const fixedPort = portArg ? Number(portArg.slice(7)) : null;
if (portArg && (!Number.isInteger(fixedPort) || fixedPort < 0 || fixedPort > 65535)) {
  console.error("Puerto inválido. Usá --port=8000 o dejá el predeterminado.");
  process.exit(1);
}

function localFile(rawUrl) {
  let requested;
  try { requested = decodeURIComponent((rawUrl || "/").split(/[?#]/, 1)[0]); }
  catch { return null; }
  if (requested.includes("\\") || requested.includes("\0") || !requested.startsWith("/")) return null;
  const segments = requested.split("/").filter(Boolean);
  if (segments.some(segment => segment.startsWith(".") || segment === "..")) return null;
  // The editor opens /tools/resource-etl/resource-browser/ (a directory URL).
  // Resolve directory URLs to their index.html, not to the directory inode.
  // Keep the trailing slash in the browser so relative CSS/JS modules resolve.
  const absolute = path.resolve(repoRoot, ...segments, requested.endsWith("/") ? "index.html" : "");
  if (!absolute.startsWith(repoRoot + path.sep)) return null;
  return absolute;
}

const server = http.createServer(async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    res.end();
    return;
  }
  const file = localFile(req.url);
  if (!file) {
    res.writeHead(403);
    res.end("Acceso denegado");
    return;
  }
  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error("Not a file");
    res.writeHead(200, {
      "Content-Type": mime[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Content-Length": info.size,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    });
    if (req.method === "HEAD") res.end();
    else createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Archivo no encontrado");
  }
});

function listen(port, remaining) {
  server.once("error", error => {
    if (error.code === "EADDRINUSE" && remaining > 0) listen(port + 1, remaining - 1);
    else {
      console.error("No pude iniciar el servidor local:", error.message);
      process.exitCode = 1;
    }
  });
  server.listen(port, "127.0.0.1", () => {
    const url = `http://127.0.0.1:${server.address().port}/`;
    console.log(`NagWeb 05 abierto en: ${url}`);
    console.log("Dejá esta ventana abierta durante la prueba. Ctrl+C para cerrar.");
    if (args.has("--open")) {
      const command = process.platform === "win32" ? `start "" "${url}"` :
        process.platform === "darwin" ? `open "${url}"` : `xdg-open "${url}"`;
      exec(command, () => {});
    }
  });
}

listen(fixedPort ?? 8000, fixedPort === null ? 8 : 0);
