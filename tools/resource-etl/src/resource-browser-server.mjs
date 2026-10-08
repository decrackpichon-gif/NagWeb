import http from "node:http";
import path from "node:path";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const token = arg.slice(2);
    const eq = token.indexOf("=");
    if (eq === -1) out[token] = true;
    else out[token.slice(0, eq)] = token.slice(eq + 1);
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const port = Number.parseInt(args.port, 10) || 4177;
const etlRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function safePath(urlPath) {
  let decoded = decodeURIComponent(urlPath.split("?")[0]);
  if (decoded === "/" || decoded === "/resource-browser") {
    decoded = "/resource-browser/";
  }
  if (decoded.endsWith("/")) decoded += "index.html";

  const absolute = path.resolve(etlRoot, "." + decoded);
  if (!absolute.startsWith(etlRoot + path.sep)) return null;
  return absolute;
}

const server = http.createServer(async (request, response) => {
  const filePath = safePath(request.url || "/");
  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("Not a file");

    response.writeHead(200, {
      "Content-Type": mime[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${port}/resource-browser/`;
  console.log(`NagWeb Resource Browser: ${url}`);
  console.log("Cerrá esta ventana o presioná Ctrl+C para detenerlo.");

  if (args.open) {
    const command =
      process.platform === "win32"
        ? `start "" "${url}"`
        : process.platform === "darwin"
          ? `open "${url}"`
          : `xdg-open "${url}"`;
    exec(command, () => {});
  }
});
