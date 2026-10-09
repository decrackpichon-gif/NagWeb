import assert from "node:assert/strict";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { transformUiverseComponent } from "./light-transformers.mjs";
import { describeEditableControls } from "./runtime/editable-controls.mjs";

// Run the unchanged production browser against an offline Vault and a test editor.
const { chromium } = await import(process.env.NAGWEB_PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.NAGWEB_PLAYWRIGHT_MODULE).href : "playwright");
const { expect } = await import(process.env.NAGWEB_PLAYWRIGHT_MODULE
  ? new URL("./test.mjs", pathToFileURL(process.env.NAGWEB_PLAYWRIGHT_MODULE)).href : "playwright/test");
const root = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const repo = path.resolve(root, "../..");
const require = createRequire(import.meta.url);
const gsapRoot = process.env.NAGWEB_GSAP_ROOT || path.dirname(require.resolve("gsap/package.json"));
const gsapFiles = new Map(await Promise.all(["gsap.min.js", "ScrollTrigger.min.js"].map(async name =>
  [name, await readFile(path.join(gsapRoot, "dist", name))])));
const threeRoot = process.env.NAGWEB_THREE_ROOT || path.dirname(require.resolve("three/package.json"));
const threeScript = await readFile(path.join(threeRoot, "build", "three.min.js"));
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
    const isEditor = url.pathname.startsWith("/editor/");
    const base = isEditor ? repo : root;
    const relative = decodeURIComponent(url.pathname.slice(isEditor ? 8 : 1));
    const file = path.resolve(base, relative.endsWith("/") || !relative ? relative + "index.html" : relative);
    if (!file.startsWith(base + path.sep)) { response.writeHead(403); response.end(); return; }
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
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  currentPage = page;
  page.on("pageerror", error => report.errors.push(`Editor: ${error.message}`));
  page.on("console", message => { if (message.type() === "error") report.errors.push(`Editor: ${message.text()}`); });
  await context.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.hostname === "127.0.0.1") return route.continue();
    const vault = url.origin === "https://raw.githubusercontent.com" ? fixtures.get(url.pathname.split("/").at(-1)) : null;
    if (vault) return route.fulfill({ contentType: "application/octet-stream", headers: { "access-control-allow-origin": "*" }, body: vault });
    const script = url.origin === "https://cdnjs.cloudflare.com" && /^\/ajax\/libs\/gsap\/3\.12\.5\//.test(url.pathname)
      ? gsapFiles.get(url.pathname.split("/").at(-1)) : null;
    if (script) return route.fulfill({ contentType: "text/javascript", body: script });
    if (url.href === "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js") return route.fulfill({ contentType: "text/javascript", body: threeScript });
    // Fonts are decorative; the editor and canvas run their real scripts offline.
    if (url.origin === "https://fonts.googleapis.com") return route.fulfill({ contentType: "text/css", body: "" });
    report.errors.push(`Unexpected editor request: ${url.origin}${url.pathname}`);
    return route.abort();
  });
  await page.addInitScript(() => {
    if (window !== window.top) return;
    if (!localStorage.getItem("scrollcraft.proyecto.v3")) localStorage.setItem("scrollcraft.proyecto.v3", JSON.stringify({
      title: "Prueba biblioteca", font: "grotesk", assets: { images: [], models: [] },
      pages: [{ id: "test-page", name: "Prueba", slug: "prueba", sections: [{ id: "test-scene", name: "Escena de prueba", layout: "free", height: 100, bg: "#ffffff", fg: "#111111", elements: [] }] }]
    }));
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/editor/`);
  await page.getByRole("button", { name: "Biblioteca de recursos", exact: true }).click();
  const libraryFrame = page.frameLocator('iframe[title="Biblioteca de recursos de NagWeb"]');
  await libraryFrame.locator('[data-resource-id="smoke:icon"]').click();
  const sizeGroup = libraryFrame.locator('details[data-category="size"]');
  if (!await sizeGroup.evaluate(n => n.open)) await sizeGroup.locator("summary").click();
  const sizeInput = libraryFrame.getByLabel("Tamaño", { exact: true });
  await sizeInput.focus();
  await sizeInput.press("Home");
  for (let i = 16; i < 40; i++) await sizeInput.press("ArrowRight");
  await libraryFrame.getByLabel("Color", { exact: true }).fill("#abcdef");
  // Record and resend the actual protocol message to exercise source checks and deduplication.
  await page.evaluate(() => {
    window.resourceMessages = [];
    window.addEventListener("message", event => { if (event.data?.type === "nagweb:resource-apply") window.resourceMessages.push(event.data); });
  });
  await libraryFrame.getByRole("button", { name: "Aplicar en NagWeb", exact: true }).click();
  await expect(libraryFrame.locator('[data-apply-status]')).toContainText("Ícono insertado y guardado");
  const inserted = await page.evaluate(() => ({ element: structuredClone(sec().elements[0]), selection: [...selection], saved: JSON.parse(localStorage.getItem(STORE_KEY)), width: designWpx(sec().elements[0], sec()) }));
  assert.equal(inserted.element.type, "vector");
  assert.equal(inserted.element.d, "M4 4L20 20");
  assert.equal(inserted.element.stroke, "#abcdef");
  assert.equal(inserted.element.strokeWidth, 2);
  assert.equal(inserted.element.nwResource.id, icon.id);
  assert.equal(inserted.element.nwResource.license.verified, true);
  assert.equal(inserted.saved.pages[0].sections[0].elements[0].id, inserted.element.id);
  assert.deepEqual(inserted.selection, [inserted.element.id]);
  assert.equal(inserted.width, 40);
  const envelope = await page.evaluate(() => window.resourceMessages[0]);
  const conversion = await page.evaluate(async message => {
    const { svgElementProps } = await import("/editor/tools/resource-etl/src/runtime/nagweb-svg-element.mjs");
    const convert = svg => svgElementProps({ ...message, descriptor: { ...message.descriptor, payload: { ...message.descriptor.payload, svg } } });
    const props = convert('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4"/><ellipse cx="12" cy="12" rx="4" ry="2"/><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="1" y1="2" x2="3" y2="4"/><polyline points="1,2 3,4 5,6"/><polygon points="1 2 3 4 5 6"/></svg>');
    const invalid = ['<script/>', '<path d="M0 0L24 24" onclick="alert(1)"/>', '<path d="M0 0L24 24" transform="translate(2)"/>', '<foreignObject/>'];
    const rejected = invalid.every(inner => { try { convert(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${inner}</svg>`); return false; } catch { return true; } });
    return { d: props.d, rejected };
  }, envelope);
  assert.match(conversion.d, /A2 2 0 0 1/);
  assert.match(conversion.d, /M1 2L3 4/);
  assert.equal(conversion.rejected, true);
  const browserChild = page.frames().find(frame => frame.url().includes("/resource-browser/"));
  await browserChild.evaluate(message => parent.postMessage(message, location.origin), envelope);
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => sec().elements.length), 1, "A repeated request must not insert twice");
  const rejected = { ...envelope, requestId: "unsafe-svg", descriptor: { ...envelope.descriptor, payload: { ...envelope.descriptor.payload, svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><script>alert(1)</script></svg>' } } };
  const historyBefore = await page.evaluate(() => history.length);
  await browserChild.evaluate(message => parent.postMessage(message, location.origin), rejected);
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => sec().elements.length), 1);
  assert.equal(await page.evaluate(() => history.length), historyBefore, "Rejected geometry must not change undo history");
  await page.evaluate(message => window.postMessage({ ...message, requestId: "wrong-source" }, location.origin), envelope);
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => sec().elements.length), 1, "Only the library iframe can apply resources");
  await libraryFrame.getByRole("button", { name: "Cerrar", exact: true }).click();
  await libraryFrame.locator(`[data-resource-id="${css.id}"]`).click();
  await libraryFrame.getByRole("button", { name: "Aplicar en NagWeb", exact: true }).click();
  await expect(libraryFrame.locator('[data-apply-status]')).toContainText("Esta etapa permite insertar íconos SVG de trazo");
  assert.equal(await page.evaluate(() => sec().elements.length), 1, "Unsupported resources must not mutate the editor");
  await page.getByRole("button", { name: "Volver al editor", exact: true }).click();
  const svg = page.frameLocator("#preview").locator(`[data-id="${inserted.element.id}"] svg`);
  await expect(svg).toBeVisible();
  await expect(svg.locator('path[stroke]')).toHaveAttribute("stroke", "#abcdef");
  assert.ok(Math.abs(await svg.evaluate(n => n.getBoundingClientRect().width) - 40) < 1, "Canvas renders the chosen pixel size");
  assert.equal(await page.getByRole("button", { name: "Biblioteca de recursos", exact: true }).evaluate(n => document.activeElement === n), true);
  await page.locator("#btn-undo").click();
  assert.equal(await page.evaluate(() => sec().elements.length), 0);
  await page.locator("#btn-redo").click();
  assert.equal(await page.evaluate(() => sec().elements[0].nwResource.id), icon.id);
  const exported = await page.evaluate(() => generateSite(flattenPage(page()), false, true, false));
  assert.ok(exported.includes('stroke="#abcdef"') && exported.includes('M4 4L20 20'), "Published markup retains customized SVG geometry");
  await page.reload();
  assert.equal(await page.evaluate(() => sec().elements[0].nwResource.id), icon.id);
  await expect(page.frameLocator("#preview").locator(`[data-id="${inserted.element.id}"] svg`)).toBeVisible();
  await page.screenshot({ path: path.join(output, "editor-inserted.png"), fullPage: true });
  await page.locator("#btn-view-mob").click();
  await page.getByRole("button", { name: "Biblioteca de recursos", exact: true }).click();
  await libraryFrame.locator('[data-resource-id="smoke:icon"]').click();
  await libraryFrame.getByRole("button", { name: "Aplicar en NagWeb", exact: true }).click();
  await expect(libraryFrame.locator('[data-apply-status]')).toContainText("Ícono insertado y guardado");
  const mobileId = await page.evaluate(() => selection[0]);
  await page.getByRole("button", { name: "Volver al editor", exact: true }).click();
  const mobileSvg = page.frameLocator("#preview").locator(`[data-id="${mobileId}"] svg`);
  await expect(mobileSvg).toBeVisible();
  assert.ok(Math.abs(await mobileSvg.evaluate(n => n.getBoundingClientRect().width) - 24) < 1);
  await page.locator("#btn-view-desk").click();
  await expect(mobileSvg).toBeVisible();
  assert.ok(Math.abs(await mobileSvg.evaluate(n => n.getBoundingClientRect().width) - 24) < 1, "Insertion from mobile keeps the chosen size on desktop too");
  report.scenarios.push({ editor: "NagWeb real", status: "passed", insert: "vector", saved: true, undoRedo: true, reload: true, export: true, mobileInsert: true, deduplicated: true, invalidSourceRejected: true });
  await context.close();
  assert.deepEqual(report.errors, [], "Browser must not emit uncaught errors or external requests");
  console.log("Resource Browser Chromium smoke: panel desktop/mobile + real NagWeb vector insert, save, undo/redo, reload, export and rejected inputs OK.");
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
