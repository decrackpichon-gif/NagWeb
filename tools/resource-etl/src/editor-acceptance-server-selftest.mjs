// Offline HTTP smoke for the one-click Windows acceptance launcher.
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const serverFile = path.join(path.dirname(fileURLToPath(import.meta.url)), "editor-acceptance-server.mjs");
const child = spawn(process.execPath, [serverFile, "--port=0"], { stdio: ["ignore", "pipe", "pipe"] });
let output = "";
let errors = "";
child.stderr.setEncoding("utf8").on("data", data => { errors += data; });
child.stdout.setEncoding("utf8");
const base = await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error("El servidor no arrancó")), 5000);
  child.on("exit", code => { clearTimeout(timeout); reject(new Error(`Servidor terminó: ${code} ${errors}`)); });
  child.stdout.on("data", data => {
    output += data;
    const match = output.match(/http:\/\/127\.0\.0\.1:\d+\//);
    if (match) { clearTimeout(timeout); resolve(match[0]); }
  });
}).catch(error => { child.kill(); throw error; });

try {
  const home = await fetch(base);
  assert.equal(home.status, 200);
  assert.match(home.headers.get("content-type"), /^text\/html/);
  assert.match(await home.text(), /<html/i);

  const module = await fetch(base + "js/nagweb-resource-library.mjs");
  assert.equal(module.status, 200);
  assert.match(module.headers.get("content-type"), /^text\/javascript/);
  assert.match(await module.text(), /NAGWEB_RESOURCE_APPLY_PROTOCOL/);

  const head = await fetch(base + "index.html", { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.ok(Number(head.headers.get("content-length")) > 0);
  assert.equal(await head.text(), "");

  assert.equal((await fetch(base + ".git/config")).status, 403);
  assert.equal((await fetch(base + "missing-acceptance-file.xyz")).status, 404);
  assert.equal((await fetch(base, { method: "POST" })).status, 405);
  console.log("Inicio local NagWeb 05: HTTP, módulos, HEAD y accesos bloqueados OK");
} finally {
  child.kill();
}
