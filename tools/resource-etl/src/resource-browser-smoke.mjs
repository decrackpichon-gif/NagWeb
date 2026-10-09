import assert from "node:assert/strict";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { transformUiverseComponent } from "./light-transformers.mjs";
import { describeEditableControls } from "./runtime/editable-controls.mjs";

// Run the unchanged production browser against an offline Vault and a test editor.
const { chromium } = await import(process.env.NAGWEB_PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.NAGWEB_PLAYWRIGHT_MODULE).href : "playwright");
const { expect } = await import(process.env.NAGWEB_PLAYWRIGHT_MODULE
  ? new URL("./test.mjs", pathToFileURL(process.env.NAGWEB_PLAYWRIGHT_MODULE)).href : "playwright/test");
const root = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const output = path.resolve(process.argv.find(arg => arg.startsWith("--out="))?.slice(6) || "browser-smoke-results");
await mkdir(output, { recursive: true });
const icon = {
  id: "smoke:icon", title: "Ícono de prueba", family: "icon", kind: "svg",
  source: { provider: "smoke" }, license: { id: "MIT", name: "MIT", verified: true },
  runtime: { renderer: "nagweb-svg", entryArtifactId: "icon" },
  artifacts: [{ id: "icon", role: "icon-data", content: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 4L20 20"/></svg>' }],
  editableProps: [
    { id: "stroke", label: "Color", valueType: "color", defaultValue: "#112233", binding: { type: "runtime", path: "svg.stroke" } },
    { id: "size", label: "Tamaño", valueType: "number", defaultValue: 24, constraints: { min: 16, max: 64, step: 1, unit: "px" }, binding: { type: "runtime", path: "svg.size" } },
    { id: "strokeWidth", label: "Grosor", valueType: "number", defaultValue: 2, constraints: { min: 1, max: 4, step: 0.5 }, binding: { type: "runtime", path: "svg.strokeWidth" } }
  ]
};
const css = transformUiverseComponent({
  repository: "https://github.com/uiverse-io/galaxy", commit: "offline-smoke",
  item: { metadata: { category: "Buttons", author: "smoke", slug: "animation" },
    entry: { path: "Buttons/smoke_animation.html", sha: "offline" },
    content: '<style>.card{width:80px;background:#123456;animation:spin 1s 2 alternate}@keyframes spin{to{transform:rotate(360deg)}}</style><button class="card">Prueba</button>' }
});
css.title = "Componente de prueba";
css.license = { id: "MIT", name: "MIT", verified: true };
const resources = [icon, css];
const zip = data => gzipSync(JSON.stringify(data));
const index = zip({ format: "nagweb-resource-browse-index", resourceCount: 2,
  resources: resources.map(r => ({ id: r.id, title: r.title, family: r.family, kind: r.kind, provider: r.source.provider })) });
const library = zip({ format: "nagweb-resource-vault-bundle", resourceCount: 2, resources });
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const fixtures = new Map([
  ["vault-manifest.json", Buffer.from(JSON.stringify({ format: "nagweb-resource-vault-index",
    consolidated: { count: 2, browseIndexPath: "index.json.gz", browseIndexSha256: sha(index), libraryPath: "library.json.gz", sha256: sha(library) } }))],
  ["index.json.gz", index], ["library.json.gz", library]
]);
const host = `<!doctype html><meta charset="utf-8"><title>Editor de prueba</title>
<style>body{margin:0}iframe{width:100%;height:100vh;border:0}</style>
<div id="inserted" hidden></div><script type="module">
import { buildResourceApplyResult } from '/src/runtime/resource-apply-bridge.mjs';
window.received = [];
const frame = document.createElement('iframe');
frame.title = 'Biblioteca de prueba';
frame.src = '/resource-browser/?hostOrigin=' + encodeURIComponent(location.origin);
document.body.append(frame);
window.addEventListener('message', event => {
  if (event.source !== frame.contentWindow || event.origin !== location.origin || event.data?.type !== 'nagweb:resource-apply') return;
  const message = event.data;
  window.received.push(message);
  const target = document.querySelector('#inserted');
  target.innerHTML = message.descriptor.payload.svg || message.descriptor.payload.html;
  const svg = target.querySelector('svg');
  if (svg) { svg.style.width = message.descriptor.payload.size + 'px'; svg.style.stroke = message.descriptor.payload.stroke; }
  event.source.postMessage(buildResourceApplyResult(message, { status: 'applied', message: 'Recurso aplicado en el editor de prueba.' }), event.origin);
});</script>`;
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    if (url.pathname === "/host") { response.setHeader("Content-Type", "text/html; charset=utf-8"); response.end(host); return; }
    if (url.pathname === "/favicon.ico") { response.writeHead(204); response.end(); return; }
    const relative = decodeURIComponent(url.pathname.slice(1));
    const file = path.resolve(root, relative.endsWith("/") ? relative + "index.html" : relative);
    if (!file.startsWith(root + path.sep)) { response.writeHead(403); response.end(); return; }
    response.setHeader("Content-Type", ({ ".html": "text/html", ".mjs": "text/javascript", ".js": "text/javascript", ".css": "text/css" })[path.extname(file)] + "; charset=utf-8");
    response.end(await readFile(file));
  } catch { response.writeHead(404); response.end("Not found"); }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
let browser;
let currentPage;
const report = { platform: process.platform, scenarios: [], errors: [] };
try {
  browser = await chromium.launch({ headless: true,
    ...(process.env.NAGWEB_BROWSER_EXECUTABLE ? { executablePath: process.env.NAGWEB_BROWSER_EXECUTABLE } : {}) });
  for (const width of [1280, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    currentPage = page;
    page.on("pageerror", error => report.errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") report.errors.push(message.text()); });
    await context.route("**/*", async route => {
      const url = new URL(route.request().url());
      if (url.hostname === "127.0.0.1") return route.continue();
      const body = url.origin === "https://raw.githubusercontent.com" ? fixtures.get(url.pathname.split("/").at(-1)) : null;
      if (!body) { report.errors.push(`Unexpected external request: ${url.origin}${url.pathname}`); return route.abort(); }
      return route.fulfill({ status: 200, contentType: "application/octet-stream", headers: { "access-control-allow-origin": "*" }, body });
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/host`);
    const frame = page.frameLocator('iframe[title="Biblioteca de prueba"]');
    await frame.locator('[data-resource-id="smoke:icon"]').click();
    await frame.locator('[data-customize]').waitFor({ state: "visible" });
    const search = frame.getByLabel("Buscar ajustes");
    const changedOnly = frame.getByLabel("Mostrar solo ajustes modificados");
    const showCategory = async category => {
      const group = frame.locator(`details[data-category="${category}"]`);
      if (!await group.evaluate(node => node.open)) await group.locator("summary").click();
    };
    const setRange = async (label, value) => {
      const input = frame.getByLabel(label, { exact: true });
      await input.focus();
      await input.press("Home");
      while (Number(await input.inputValue()) < value) await input.press("ArrowRight");
    };
    await showCategory("size");
    await setRange("Tamaño", 40);
    await frame.getByLabel("Color", { exact: true }).fill("#abcdef");
    const preview = frame.locator('[data-preview]');
    await page.waitForFunction(() => {
      const browserFrame = document.querySelector('iframe').contentDocument;
      return browserFrame.querySelector('[data-preview]').srcdoc.includes('width:40px') && browserFrame.querySelector('[data-preview]').srcdoc.includes('#abcdef');
    });
    const originalPreview = await preview.getAttribute("srcdoc");
    const renderedSvg = frame.frameLocator('[data-preview]').locator("svg");
    await expect(renderedSvg).toBeVisible();
    await expect(renderedSvg).toHaveCSS("width", "40px");
    await expect(renderedSvg).toHaveCSS("stroke", "rgb(171, 205, 239)");
    await expect(frame.locator('[data-preview-fallback]')).toBeHidden();
    await search.fill("TAMANO");
    await changedOnly.check();
    assert.equal(await frame.getByLabel("Color", { exact: true }).isVisible(), false);
    assert.equal(await frame.getByLabel("Tamaño", { exact: true }).inputValue(), "40");
    assert.equal(await preview.getAttribute("srcdoc"), originalPreview, "Filtering must not redraw the preview");
    await search.fill("ninguna coincidencia");
    await frame.getByText("No hay coincidencias entre los ajustes modificados.", { exact: false }).waitFor({ state: "visible" });
    await frame.getByRole("button", { name: "Limpiar búsqueda", exact: true }).click();
    assert.equal(await changedOnly.isChecked(), true);
    await search.fill("Color");
    await frame.getByRole("button", { name: "Restaurar colores", exact: true }).click();
    assert.equal(await search.evaluate(node => node === document.activeElement), true, "Focus returns to the search when reset hides the category");
    await frame.getByRole("button", { name: "Limpiar búsqueda", exact: true }).click();
    assert.equal(await frame.getByLabel("Tamaño", { exact: true }).inputValue(), "40");
    await frame.getByRole("button", { name: "Aplicar en NagWeb", exact: true }).click();
    await frame.locator('[data-apply-status]').filter({ hasText: "Recurso aplicado en el editor de prueba." }).waitFor();
    const envelope = await page.evaluate(() => window.received.at(-1));
    assert.equal(envelope.descriptor.payload.size, 40);
    assert.equal(envelope.descriptor.payload.stroke, "#112233");
    assert.equal(await page.locator('#inserted svg').evaluate(node => node.style.width), "40px");
    await frame.getByRole("button", { name: "Restaurar valores originales", exact: true }).click();
    assert.equal(await changedOnly.isChecked(), true);
    await frame.getByText("No hay ajustes modificados.", { exact: false }).waitFor({ state: "visible" });
    await changedOnly.uncheck();
    assert.equal(await frame.getByLabel("Tamaño", { exact: true }).inputValue(), "24");
    await expect(renderedSvg).toHaveCSS("width", "24px");
    await expect(renderedSvg).toHaveCSS("stroke", "rgb(17, 34, 51)");
    await page.screenshot({ path: path.join(output, `panel-${width}.png`), fullPage: true });
    await frame.getByRole("button", { name: "Cerrar", exact: true }).click();
    await frame.locator(`[data-resource-id="${css.id}"]`).click();
    await frame.locator('[data-customize]').waitFor({ state: "visible" });
    assert.equal(await search.inputValue(), "");
    assert.equal(await changedOnly.isChecked(), false);
    await expect(frame.locator('[data-preview-fallback]')).toBeHidden();
    const playback = describeEditableControls(css).find(control => control.id === "uiversePlay1");
    assert.ok(playback, "CSS fixture must expose a genuine playback selector");
    await search.fill(playback.label);
    await showCategory("animation");
    await frame.getByLabel(playback.label, { exact: true }).selectOption("4");
    await changedOnly.check();
    await frame.getByRole("button", { name: "Aplicar en NagWeb", exact: true }).click();
    await frame.locator('[data-apply-status]').filter({ hasText: "Recurso aplicado en el editor de prueba." }).waitFor();
    const cssEnvelope = await page.evaluate(() => window.received.at(-1));
    assert.equal(cssEnvelope.descriptor.instance.values.uiversePlay1, "4");
    assert.match(cssEnvelope.descriptor.payload.html, /spin 1s 4 alternate/);
    assert.equal(await page.locator('#inserted .card').textContent(), "Prueba");
    assert.equal(await frame.locator('[data-customize]').evaluate(node => node.scrollWidth <= node.clientWidth), true, "Panel must fit its width");
    report.scenarios.push({ width, status: "passed", applies: await page.evaluate(() => window.received.length) });
    await context.close();
  }
  assert.deepEqual(report.errors, [], "Browser must not emit uncaught errors or external requests");
  console.log("Resource Browser Chromium smoke: search, edits, reset, focus, preview and confirmed Apply OK (desktop + mobile).");
} catch (error) {
  report.errors.push(error.stack || String(error));
  if (currentPage && !currentPage.isClosed()) {
    await currentPage.screenshot({ path: path.join(output, "failure.png"), fullPage: true }).catch(() => {});
  }
  throw error;
} finally {
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
