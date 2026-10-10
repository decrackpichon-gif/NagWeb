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
import { buildResourceApplyEnvelope } from "./runtime/resource-apply-bridge.mjs";

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
    content: '<style>.card{width:80px;background:#123456;animation:spin 1s 2 alternate}@keyframes spin{to{transform:rotate(360deg)}}</style><button class="card">Prueba</button><input class="email" placeholder="Tu correo">' }
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
window.deferNextResourceApply = false;
window.pendingResourceApply = null;
const frame = document.createElement('iframe');
frame.title = 'Biblioteca de prueba';
frame.src = '/resource-browser/?hostOrigin=' + encodeURIComponent(location.origin);
document.body.append(frame);
window.replyPendingResourceApply = () => {
  if (!window.pendingResourceApply) return;
  frame.contentWindow.postMessage(window.pendingResourceApply, location.origin);
  window.pendingResourceApply = null;
};
window.addEventListener('message', event => {
  if (event.source !== frame.contentWindow || event.origin !== location.origin || event.data?.type !== 'nagweb:resource-apply') return;
  const message = event.data;
  window.received.push(message);
  const target = document.querySelector('#inserted');
  target.innerHTML = message.descriptor.payload.svg || message.descriptor.payload.html;
  const svg = target.querySelector('svg');
  if (svg) { svg.style.width = message.descriptor.payload.size + 'px'; svg.style.stroke = message.descriptor.payload.stroke; }
  const result = buildResourceApplyResult(message, {
    status: 'applied', message: 'Recurso aplicado en el editor de prueba.'
  });
  if (window.deferNextResourceApply) {
    window.deferNextResourceApply = false;
    window.pendingResourceApply = result;
    return;
  }
  event.source.postMessage(result, event.origin);
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
      return route.fulfill({ status: 200, contentType: "application/octet-stream", headers: { "access-control-allow-origin": "*", "cache-control": "no-store" }, body });
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/host`);
    const frame = page.frameLocator('iframe[title="Biblioteca de prueba"]');
    await frame.locator('[data-resource-id="smoke:icon"]').waitFor();
    // Stage 73: check persistent favorites and filter against the local Vault index.
    const star=frame.locator('[data-favorite-id="smoke:icon"]');
    await star.click();
    await expect(star).toHaveAttribute("aria-pressed","true");
    await expect(star).toHaveText("★");
    await frame.locator("[data-favorite-only]").check();
    await expect(frame.locator('[data-resource-id="smoke:icon"]')).toBeVisible();
    await expect(frame.locator('[data-resource-id="'+css.id+'"]')).toHaveCount(0);
    await expect(frame.locator("[data-result-count]")).toContainText("1 resultados");
    assert.match(await frame.locator("body").evaluate(()=>localStorage.getItem(
      "nagweb:resource-browser:favorites:v1")) ,/smoke:icon/);
    await page.reload();
    await frame.locator('[data-resource-id="smoke:icon"]').waitFor();
    await expect(frame.locator('[data-favorite-id="smoke:icon"]')).toHaveAttribute("aria-pressed","true");
    await frame.locator("[data-favorite-only]").check();
    await expect(frame.locator('[data-resource-id="smoke:icon"]')).toBeVisible();
    await frame.locator("[data-favorite-only]").uncheck();
    await frame.locator('[data-resource-id="smoke:icon"]').click();
    const detailStar=frame.locator("[data-detail-favorite]");
    await expect(detailStar).toHaveAttribute("aria-pressed","true");
    await detailStar.click();
    await expect(detailStar).toHaveAttribute("aria-pressed","false");
    await frame.getByRole("button",{name:"Cerrar",exact:true}).click();
    await expect(frame.locator('[data-favorite-id="smoke:icon"]')).toHaveAttribute("aria-pressed","false");
    await frame.locator("[data-favorite-only]").check();
    await expect(frame.locator('[data-resource-id="smoke:icon"]')).toHaveCount(0);
    await frame.locator("[data-favorite-only]").uncheck();
    report.scenarios.push({browser:"persistent favorites and filtered resource search",
      width,status:"passed",persistence:true,detailToggle:true,noFullLibraryFetch:true});
    if (width === 1280) {
      // A separate tab changes the same saved favorites: existing open tabs
      // must synchronize buttons, counters and the filtered result list.
      const sibling = await context.newPage();
      sibling.on("pageerror", error => report.errors.push(`Favorites second tab: ${error.message}`));
      await sibling.goto(`http://127.0.0.1:${server.address().port}/resource-browser/`);
      const otherStar = sibling.locator('[data-favorite-id="smoke:icon"]');
      await otherStar.waitFor();
      await otherStar.click();
      await expect(otherStar).toHaveAttribute("aria-pressed","true");
      await expect(frame.locator('[data-favorite-id="smoke:icon"]')).toHaveAttribute("aria-pressed","true");
      await expect(frame.locator("[data-favorite-count]")).toHaveText("(1)");
      await frame.locator("[data-favorite-only]").check();
      await expect(frame.locator('[data-resource-id="smoke:icon"]')).toBeVisible();
      await otherStar.click();
      await expect(frame.locator('[data-resource-id="smoke:icon"]')).toHaveCount(0);
      await expect(frame.locator("[data-favorite-count]")).toHaveText("(0)");
      await frame.locator("[data-favorite-only]").uncheck();
      await expect(frame.locator('[data-favorite-id="smoke:icon"]')).toHaveAttribute("aria-pressed","false");
      await sibling.close();
      report.scenarios.push({browser:"favorites synced across open tabs",
        status:"passed",star:true,count:true,filteredResults:true});
    }
    await expect(frame.getByRole("button", { name: "Página anterior", exact: true })).toBeDisabled();
    await expect(frame.getByRole("button", { name: "Página siguiente", exact: true })).toBeDisabled();
    if (width === 1280) {
      // A corrupt incoming index must not erase the verified cards or block retry.
      const originalIndex = fixtures.get("index.json.gz");
      fixtures.set("index.json.gz", Buffer.from("not the indexed gzip payload"));
      try {
        await frame.getByRole("button", { name: "Actualizar índice", exact: true }).click();
        await expect(frame.locator("[data-status]")).toContainText("Se conserva la última versión verificada");
        await expect(frame.locator('[data-resource-id="smoke:icon"]')).toBeVisible();
        await expect(frame.getByRole("button", { name: "Actualizar índice", exact: true })).toBeEnabled();
      } finally {
        fixtures.set("index.json.gz", originalIndex);
      }
      await frame.getByRole("button", { name: "Actualizar índice", exact: true }).click();
      await expect(frame.locator("[data-status]")).toContainText("Índice verificado");
      report.scenarios.push({ browser: "atomic Vault refresh and recovery", status: "passed" });
    }
    await frame.getByLabel("Proveedor", { exact: true }).selectOption("smoke");
    await frame.getByLabel("Familia", { exact: true }).selectOption("icon");
    await frame.getByLabel("Tipo", { exact: true }).selectOption("svg");
    await frame.getByLabel("Buscar", { exact: true }).fill("Ícono");
    await frame.getByRole("button", { name: "Actualizar índice", exact: true }).click();
    await expect(frame.locator('[data-status]')).toContainText("Índice verificado");
    await expect(frame.getByLabel("Proveedor", { exact: true })).toHaveValue("smoke");
    await expect(frame.getByLabel("Familia", { exact: true })).toHaveValue("icon");
    await expect(frame.getByLabel("Tipo", { exact: true })).toHaveValue("svg");
    await expect(frame.getByLabel("Buscar", { exact: true })).toHaveValue("Ícono");
    await frame.getByRole("button", { name: "Limpiar filtros", exact: true }).click();
    await frame.locator('[data-resource-id="smoke:icon"]').click();
    await expect(frame.locator('[data-preview-replay]')).toBeHidden();
    await frame.locator('[data-customize]').waitFor({ state: "visible" });
    const search = frame.getByLabel("Buscar ajustes");
    const changedOnly = frame.getByLabel("Mostrar solo ajustes modificados");
    await search.fill("Colores");
    await expect(frame.locator('details[data-category="color"]')).toBeVisible();
    await expect(frame.locator('details[data-category="size"]')).toBeHidden();
    await frame.getByRole("button", { name: "Limpiar búsqueda", exact: true }).click();
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
    await expect(search).toBeFocused();
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
    // Stage 56: replay must restart CSS animations without scripts or touching
    // resource customization; an SVG has no animation replay control.
    const cssReplay = frame.locator('[data-preview-replay]');
    await expect(cssReplay).toBeVisible();
    await expect(frame.locator('[data-preview-note]'))
      .toContainText("volver a reproducir las animaciones CSS");
    const originalUiverseDoc=await frame.locator('[data-preview]').getAttribute("srcdoc");
    await cssReplay.click();
    const replayedUiverseDoc=await frame.locator('[data-preview]').getAttribute("srcdoc");
    assert.notEqual(replayedUiverseDoc,originalUiverseDoc,
      "Clicking Uiverse Replay navigates the isolated preview iframe");
    assert.match(replayedUiverseDoc,/css-preview-replay:/);
    assert.match(replayedUiverseDoc,/animation:spin 1s 2 alternate/,
      "Replay preserves the current CSS and timing settings");
    await expect(frame.frameLocator('[data-preview]').locator(".card")).toBeVisible();
    assert.equal(await search.inputValue(), "");
    assert.equal(await changedOnly.isChecked(), false);
    await expect(frame.locator('[data-preview-fallback]')).toBeHidden();
    const playback = describeEditableControls(css).find(control => control.id === "uiversePlay1");
    assert.ok(playback, "CSS fixture must expose a genuine playback selector");
    await search.fill(playback.label);
    await showCategory("animation");
    await frame.getByLabel(playback.label, { exact: true }).selectOption("4");
    await changedOnly.check();
    // The generic host deliberately does not advertise restricted capabilities.
    await expect(frame.getByRole("button", { name: "Aplicar en NagWeb", exact: true })).toBeEnabled();
    await frame.getByRole("button", { name: "Aplicar en NagWeb", exact: true }).click();
    await frame.locator('[data-apply-status]').filter({ hasText: "Recurso aplicado en el editor de prueba." }).waitFor();
    const cssEnvelope = await page.evaluate(() => window.received.at(-1));
    assert.equal(cssEnvelope.descriptor.instance.values.uiversePlay1, "4");
    assert.match(cssEnvelope.descriptor.payload.html, /spin 1s 4 alternate/);
    assert.equal(await page.locator('#inserted .card').textContent(), "Prueba");
    if (width === 1280) {
      // Delay a real host acknowledgement while changing an editable Uiverse
      // value. The acknowledgement confirms only the original submitted values.
      await page.evaluate(() => { window.deferNextResourceApply = true; });
      await frame.getByRole("button", { name: "Aplicar en NagWeb", exact: true }).click();
      await expect(frame.locator("[data-apply-status]")).toContainText("Esperando confirmación");
      // postMessage delivery is async: wait for the host to hold this exact
      // acknowledgement before releasing it, rather than racing a no-op.
      await expect.poll(() => page.evaluate(() => Boolean(window.pendingResourceApply))).toBe(true);
      await frame.getByLabel(playback.label, { exact: true }).selectOption("5");
      assert.equal(await page.evaluate(() => window.received.at(-1).descriptor.instance.values.uiversePlay1), "4");
      await page.evaluate(() => window.replyPendingResourceApply());
      await expect(frame.locator("[data-apply-status]")).toContainText("cambios posteriores que todavía no se aplicaron");
      await expect(frame.getByRole("button", { name: "Aplicar en NagWeb", exact: true })).toBeEnabled();
      await frame.getByRole("button", { name: "Aplicar en NagWeb", exact: true }).click();
      await expect(frame.locator("[data-apply-status]")).toContainText("Recurso aplicado en el editor de prueba.");
      assert.equal(await page.evaluate(() => window.received.at(-1).descriptor.instance.values.uiversePlay1), "5");
      // Stage 78: later edits must invalidate the previous successful notice,
      // even when they happen long after a prompt acknowledgement.
      await frame.getByLabel(playback.label, { exact: true }).selectOption("4");
      await expect(frame.locator("[data-apply-status]")).toContainText(
        "cambios posteriores que todavía no se aplicaron");
      await frame.getByLabel(playback.label, { exact: true }).selectOption("5");
      await expect(frame.locator("[data-apply-status]")).toHaveText(
        "Recurso aplicado en el editor de prueba.");
      await frame.getByLabel(playback.label, { exact: true }).selectOption("4");
      await expect(frame.locator("[data-apply-status]")).toContainText(
        "cambios posteriores que todavía no se aplicaron");
      report.scenarios.push({ browser: "Uiverse delayed confirmation protects later edits",
        status: "passed", confirmedSnapshot: true, pendingChangesVisible: true,
        subsequentChangesVisible: true, returningToConfirmedValues: true, resubmitted: true });
    }
    assert.equal(await frame.locator('[data-customize]').evaluate(node => node.scrollWidth <= node.clientWidth), true, "Panel must fit its width");
    const cssDocBeforeGroups = await frame.locator('[data-preview]').getAttribute("srcdoc");
    await frame.getByRole("button", { name: "Plegar categorías", exact: true }).click();
    await expect(frame.getByRole("button", { name: "Plegar categorías", exact: true })).toBeDisabled();
    await expect(frame.getByRole("button", { name: "Expandir categorías", exact: true })).toBeFocused();
    await frame.getByRole("button", { name: "Expandir categorías", exact: true }).click();
    await expect(frame.getByRole("button", { name: "Plegar categorías", exact: true })).toBeFocused();
    assert.equal(await frame.getByLabel(playback.label, { exact: true }).inputValue(), "4");
    assert.equal(await frame.locator('[data-preview]').getAttribute("srcdoc"), cssDocBeforeGroups, "Category actions only change organization");
    await frame.getByRole("button", { name: "Cerrar", exact: true }).click();
    await frame.locator('[data-resource-id="smoke:icon"]').click();
    await frame.getByRole("button", { name: "Plegar categorías", exact: true }).click();
    await showCategory("size");
    await frame.getByRole("button", { name: "Cerrar", exact: true }).click();
    // A new library document restores organization but still uses fresh values.
    const browserChild = page.frames().find(child => child.url().includes("/resource-browser/"));
    await browserChild.goto(browserChild.url());
    await frame.locator('[data-resource-id="smoke:icon"]').click();
    assert.equal(await frame.locator('details[data-category="size"]').evaluate(node => node.open), true);
    assert.equal(await frame.locator('details[data-category="color"]').evaluate(node => node.open), false);
    assert.equal(await frame.getByLabel("Tamaño", { exact: true }).inputValue(), "24");
    await expect(frame.getByRole("button", { name: "Expandir categorías", exact: true })).toBeEnabled();
    await frame.getByRole("button", { name: "Expandir categorías", exact: true }).click();
    await expect(frame.getByRole("button", { name: "Expandir categorías", exact: true })).toBeDisabled();
    assert.equal(await frame.locator("[data-customize] details").evaluateAll(groups => groups.every(group => group.open)), true);
    // Stage 75: presets are explicit, browser-local and not auto-applied.
    await setRange("Tamaño",44);
    await frame.getByRole("button",{name:"Guardar configuración",exact:true}).click();
    await expect(frame.locator("[data-saved-customization-status]"))
      .toContainText("Configuración guardada");
    assert.match(await frame.locator("body").evaluate(()=>
      localStorage.getItem("nagweb:resource-browser:customizations:v1")) ,/"size":44/);
    await frame.getByRole("button",{name:"Restaurar valores originales",exact:true}).click();
    await expect(frame.getByLabel("Tamaño",{exact:true})).toHaveValue("24");
    await frame.getByRole("button",{name:"Recuperar guardados",exact:true}).click();
    await expect(frame.getByLabel("Tamaño",{exact:true})).toHaveValue("44");
    // Stage 79: recovery must be reversible without rewriting local storage.
    const undoRecovery = frame.getByRole("button",{name:"Deshacer recuperación",exact:true});
    await expect(undoRecovery).toBeVisible();
    await undoRecovery.click();
    await expect(frame.getByLabel("Tamaño",{exact:true})).toHaveValue("24");
    await expect(undoRecovery).toBeHidden();
    await frame.getByRole("button",{name:"Recuperar guardados",exact:true}).click();
    await expect(frame.getByLabel("Tamaño",{exact:true})).toHaveValue("44");
    await setRange("Tamaño",40);
    await expect(undoRecovery).toBeHidden();
    await frame.getByRole("button",{name:"Recuperar guardados",exact:true}).click();
    await expect(frame.getByLabel("Tamaño",{exact:true})).toHaveValue("44");
    await frame.getByRole("button",{name:"Cerrar",exact:true}).click();
    const resourceChild=page.frames().find(child=>child.url().includes("/resource-browser/"));
    await resourceChild.goto(resourceChild.url());
    await frame.locator('[data-resource-id="smoke:icon"]').click();
    await expect(frame.getByLabel("Tamaño",{exact:true})).toHaveValue("24");
    await frame.getByRole("button",{name:"Recuperar guardados",exact:true}).click();
    await expect(frame.getByLabel("Tamaño",{exact:true})).toHaveValue("44");
    await frame.getByRole("button",{name:"Eliminar guardados",exact:true}).click();
    await expect(frame.getByRole("button",{name:"Recuperar guardados",exact:true})).toBeDisabled();
    await expect(frame.getByLabel("Tamaño",{exact:true})).toHaveValue("44");
    report.scenarios.push({browser:"saved reusable customization",width,status:"passed",
      roundTrip:true,explicitRestore:true,doesNotOverrideInitialSettings:true,
      reload:true,deleteKeepsCurrentValues:true,undoRecovery:true,
      invalidatesUndoAfterFurtherEditing:true});
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
    if (vault) return route.fulfill({ contentType: "application/octet-stream", headers: { "access-control-allow-origin": "*", "cache-control": "no-store" }, body: vault });
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
  // Stage 51: security and visual checks for the sandbox renderer that will
  // precede HTML/CSS insertion in later stages. No HTML enters the editor DOM.
  const sandboxEnvelope = buildResourceApplyEnvelope(css, { requestId: "sandbox-stage-51" });
  const sandboxCheck = await page.evaluate(async message => {
    const { createUiverseSandboxFrame, prepareUiverseSandboxHtml } =
      await import("/editor/tools/resource-etl/src/runtime/nagweb-html-sandbox.mjs");
    const iframe = createUiverseSandboxFrame(message);
    iframe.style.cssText = "position:fixed;left:0;top:0;width:180px;height:120px;z-index:9999";
    iframe.dataset.htmlStagePreview = "";
    await new Promise(resolve => {
      iframe.addEventListener("load", resolve, { once: true });
      document.body.append(iframe);
    });
    const malicious = [
      '<script>parent.__injected = true</script>',
      '<img src="https://example.test/track">',
      '<div onclick="parent.__injected = true">Click</div>',
      '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
      '<meta http-equiv="refresh" content="0;url=https://example.test">',
      '<form action="https://example.test"><button>Enviar</button></form>'
    ];
    const denied = malicious.every(html => {
      try {
        prepareUiverseSandboxHtml({ ...message, descriptor: {
          ...message.descriptor,
          payload: { ...message.descriptor.payload, html }
        } });
        return false;
      } catch { return true; }
    });
    const otherKindsRejected = ["svg", "react-component"].every(kind => {
      try {
        prepareUiverseSandboxHtml({ ...message, descriptor: {
          ...message.descriptor, kind
        } });
        return false;
      } catch { return true; }
    });
    const missingLicenseRejected = (() => {
      try {
        prepareUiverseSandboxHtml({ ...message, resource: {
          ...message.resource, license: { ...message.resource.license, verified: false }
        } });
        return false;
      } catch { return true; }
    })();
    return {
      denied, otherKindsRejected, missingLicenseRejected,
      noScriptPermission: !iframe.sandbox.contains("allow-scripts"),
      noSameOriginPermission: !iframe.sandbox.contains("allow-same-origin"),
      emptySandbox: iframe.getAttribute("sandbox") === "",
      referrerPolicy: iframe.getAttribute("referrerpolicy"),
      opaqueOrigin: iframe.contentDocument === null,
      csp: iframe.srcdoc.includes("default-src 'none'") &&
        iframe.srcdoc.includes("connect-src 'none'") &&
        iframe.srcdoc.includes("script-src 'none'")
    };
  }, sandboxEnvelope);
  assert.deepEqual(sandboxCheck, {
    denied:true,otherKindsRejected:true,missingLicenseRejected:true,
    noScriptPermission:true,noSameOriginPermission:true,
    emptySandbox:true,referrerPolicy:"no-referrer",
    opaqueOrigin:true,csp:true
  }, "Uiverse HTML must stay in a restrictive opaque-origin sandbox");
  const isolatedCard = page.frameLocator('iframe[data-html-stage-preview]').locator(".card");
  await expect(isolatedCard).toBeVisible();
  await expect(isolatedCard).toHaveCSS("background-color", "rgb(18, 52, 86)");
  await page.locator('iframe[data-html-stage-preview]').evaluate(node => node.remove());
  report.scenarios.push({ editor:"Uiverse HTML/CSS isolated rendering",status:"passed",
    liveStyles:true,opaqueOrigin:true,scriptsBlocked:true,externalAssetsBlocked:true });
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
  await expect(libraryFrame.getByRole("button", { name: "Aplicar en NagWeb", exact: true })).toBeEnabled();
  await expect(libraryFrame.locator('[data-apply-status]')).toContainText("Recurso listo para aplicar");
  assert.equal(await page.evaluate(() => sec().elements.length), 1, "Viewing a compatible Uiverse component must not insert it until Apply");
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
  // Canvas shortcut regression: a double-click on an existing SVG must
  // reopen that exact resource without inserting or mutating another element.
  const canvasShortcutHistory = await page.evaluate(() => history.length);
  await page.evaluate(() => { selection = []; curEl = -1; secFocus = false; });
  await page.frameLocator("#preview").locator(`[data-id="${inserted.element.id}"] svg`)
    .dispatchEvent("dblclick", { button: 0, bubbles: true });
  await expect(page.getByRole("dialog", { name: "Biblioteca de recursos", exact: true })).toBeVisible();
  const resourceFrameUrl = await page.locator('iframe[title="Biblioteca de recursos de NagWeb"]').getAttribute("src");
  assert.equal(new URL(resourceFrameUrl, "http://localhost").searchParams.get("editResource"), icon.id);
  assert.equal(await page.evaluate(() => selection[0]), inserted.element.id);
  await page.getByRole("button", { name: "Volver al editor", exact: true }).click();
  await page.getByRole("button", { name: "Personalizar ícono seleccionado", exact: true }).focus();
  await page.keyboard.press("Alt+Enter");
  await expect(page.getByRole("dialog", { name: "Biblioteca de recursos", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Volver al editor", exact: true }).click();
  assert.equal(await page.evaluate(() => history.length), canvasShortcutHistory,
    "Opening and cancelling direct canvas customization never adds undo history");
  assert.equal(await page.evaluate(() => sec().elements.length), 1);
  report.scenarios.push({ editor: "direct canvas SVG customization", doubleClick: true,
    keyboard: "Alt+Enter", preservesUndoHistory: true });
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
  // Reopen an existing vector, cancel safely, then edit it without replacing it.
  await page.evaluate(id => {
    const e = sec().elements.find(e => e.id === id);
    e.x = 17; e.y = 25; e.name = "Nombre propio"; e.anim = "fade";
    selection = [e.id]; curEl = sec().elements.indexOf(e); secFocus = false;
    refresh();
  }, inserted.element.id);
  const editButton = page.getByRole("button", { name: "Personalizar ícono seleccionado", exact: true });
  const reopenCustomization = async button => {
    const iframe = page.locator('iframe[title="Biblioteca de recursos de NagWeb"]');
    const previous = await iframe.getAttribute("src");
    await button.click();
    await expect(page.getByRole("dialog", { name: "Biblioteca de recursos", exact: true })).toBeVisible();
    const target = await iframe.getAttribute("src");
    assert.notEqual(target, previous, "Reopening must create a fresh editing session");
    // A hidden frame retains the cancelled controls until its new navigation commits.
    const child = await (await iframe.elementHandle()).contentFrame();
    await child.waitForURL(target, { waitUntil: "domcontentloaded", timeout: 30000 });
  };
  await expect(editButton).toBeEnabled();
  const countBeforeEdit = await page.evaluate(() => sec().elements.length);
  const historyBeforeEdit = await page.evaluate(() => history.length);
  await reopenCustomization(editButton);
  await expect(libraryFrame.getByLabel("Color", { exact: true })).toHaveValue("#abcdef");
  await libraryFrame.getByLabel("Color", { exact: true }).fill("#123456");
  await page.getByRole("button", { name: "Volver al editor", exact: true }).click();
  await expect(editButton).toBeFocused();
  assert.equal(await page.evaluate(() => history.length), historyBeforeEdit, "Cancel must not add an undo entry");
  assert.equal(await page.evaluate(id => sec().elements.find(e => e.id === id).stroke, inserted.element.id), "#abcdef");
  await reopenCustomization(editButton);
  await expect(libraryFrame.getByLabel("Color", { exact: true })).toHaveValue("#abcdef");
  const editSizeGroup = libraryFrame.locator('details[data-category="size"]');
  if (!await editSizeGroup.evaluate(n => n.open)) await editSizeGroup.locator("summary").click();
  const editSize = libraryFrame.getByLabel("Tamaño", { exact: true });
  await expect(editSize).toHaveValue("40");
  await editSize.focus(); await editSize.press("Home");
  for (let i = 16; i < 48; i++) await editSize.press("ArrowRight");
  await libraryFrame.getByLabel("Color", { exact: true }).fill("#123456");
  const thickness = libraryFrame.getByLabel("Grosor", { exact: true });
  const thicknessGroup = libraryFrame.locator("details").filter({ has: thickness });
  if (!await thicknessGroup.evaluate(n => n.open)) await thicknessGroup.locator("summary").click();
  await thickness.focus(); await thickness.press("ArrowRight"); await thickness.press("ArrowRight");
  await libraryFrame.getByRole("button", { name: "Guardar cambios en el ícono", exact: true }).click();
  await expect(libraryFrame.locator('[data-apply-status]')).toContainText("Cambios guardados en el ícono seleccionado");
  const edited = await page.evaluate(id => ({ element: structuredClone(sec().elements.find(e => e.id === id)), count: sec().elements.length, width: designWpx(sec().elements.find(e => e.id === id), sec()) }), inserted.element.id);
  assert.equal(edited.count, countBeforeEdit);
  assert.equal(edited.element.id, inserted.element.id);
  assert.equal(edited.element.stroke, "#123456");
  assert.equal(edited.element.strokeWidth, 3);
  assert.equal(edited.width, 48);
  assert.equal(edited.element.d, inserted.element.d);
  assert.equal(edited.element.name, "Nombre propio");
  assert.equal(edited.element.x, 17);
  assert.equal(edited.element.y, 25);
  assert.equal(edited.element.anim, "fade");
  assert.equal(edited.element.mobile.w, inserted.element.mobile.w, "Desktop edit preserves mobile size");
  await page.getByRole("button", { name: "Volver al editor", exact: true }).click();
  await page.locator("#btn-undo").click();
  assert.equal(await page.evaluate(id => sec().elements.find(e => e.id === id).stroke, inserted.element.id), "#abcdef");
  await page.locator("#btn-redo").click();
  assert.equal(await page.evaluate(id => sec().elements.find(e => e.id === id).stroke, inserted.element.id), "#123456");
  await page.reload();
  assert.equal(await page.evaluate(id => sec().elements.find(e => e.id === id).strokeWidth, inserted.element.id), 3);
  await page.screenshot({ path: path.join(output, "editor-edited.png"), fullPage: true });
  await page.evaluate(id => { selection = [id]; curEl = sec().elements.findIndex(e => e.id === id); renderPane(); }, inserted.element.id);
  await reopenCustomization(editButton);
  await expect(libraryFrame.getByRole("button", { name: "Guardar cambios en el ícono", exact: true })).toBeEnabled();
  const historyBeforeUnchanged = await page.evaluate(() => history.length);
  await libraryFrame.getByRole("button", { name: "Guardar cambios en el ícono", exact: true }).click();
  await expect(libraryFrame.locator('[data-apply-status]')).toContainText("Cambios guardados");
  assert.equal(await page.evaluate(() => history.length), historyBeforeUnchanged, "Saving unchanged values must not add an undo entry");
  // Simulate an external model change while the modal is open.
  await page.evaluate(id => { snapshot(); sec().elements = sec().elements.filter(e => e.id !== id); refresh(); }, inserted.element.id);
  const historyBeforeDeletedApply = await page.evaluate(() => history.length);
  await libraryFrame.getByRole("button", { name: "Guardar cambios en el ícono", exact: true }).click();
  await expect(libraryFrame.locator('[data-apply-status]')).toContainText("El recurso cambió o fue eliminado");
  assert.equal(await page.evaluate(() => history.length), historyBeforeDeletedApply);
  assert.equal(await page.evaluate(() => sec().elements.length), countBeforeEdit - 1, "A deleted target must not be recreated by Apply");
  await page.getByRole("button", { name: "Volver al editor", exact: true }).click();
  await page.locator("#btn-undo").click();
  assert.equal(await page.evaluate(() => sec().elements.length), countBeforeEdit);
  await page.evaluate(id => { selection = [id]; curEl = sec().elements.findIndex(e => e.id === id); renderPane(); }, inserted.element.id);
  await reopenCustomization(editButton);
  await expect(libraryFrame.getByRole("button", { name: "Guardar cambios en el ícono", exact: true })).toBeEnabled();
  await libraryFrame.getByLabel("Color", { exact: true }).fill("#654321");
  await page.evaluate(() => {
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === "scrollcraft.proyecto.v3") throw new DOMException("Full", "QuotaExceededError");
      return window.originalSetItem.call(this, key, value);
    };
  });
  await libraryFrame.getByRole("button", { name: "Guardar cambios en el ícono", exact: true }).click();
  await expect(libraryFrame.locator('[data-apply-status]')).toContainText("no se pudo guardar");
  assert.equal(await page.evaluate(id => JSON.parse(localStorage.getItem(STORE_KEY)).pages[0].sections[0].elements.find(e => e.id === id).stroke, inserted.element.id), "#123456", "An old saved ID alone must not count as persisted edits");
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
  await page.getByRole("button", { name: "Volver al editor", exact: true }).click();
  await page.locator("#btn-undo").click();
  assert.equal(await page.evaluate(id => sec().elements.find(e => e.id === id).stroke, inserted.element.id), "#123456");
  report.scenarios.push({ editor: "NagWeb edit existing SVG", status: "passed", sameId: true, noDuplicate: true, cancel: true, undoRedo: true, reload: true, placementPreserved: true, noOp: true, deletedTargetRejected: true, failedSaveDetected: true });
  report.scenarios.push({ editor: "NagWeb real", status: "passed", insert: "vector", saved: true, undoRedo: true, reload: true, export: true, mobileInsert: true, deduplicated: true, invalidSourceRejected: true });
  // Stage 52: use NagWeb's existing embed element, but never direct-inject
  // Uiverse markup in either edit view or exported website.
  // The preceding reload replaced window, so subscribe again for this scenario.
  await page.evaluate(() => {
    window.resourceMessages = [];
    window.addEventListener("message", event => {
      if (event.data?.type === "nagweb:resource-apply") window.resourceMessages.push(event.data);
    });
  });
  await page.getByRole("button", { name: "Biblioteca de recursos", exact: true }).click();
  await libraryFrame.locator(`[data-resource-id="${css.id}"]`).click();
  await expect(libraryFrame.getByRole("button", { name: "Aplicar en NagWeb", exact: true })).toBeEnabled();
  const htmlBefore = await page.evaluate(() => history.length);
  await libraryFrame.getByRole("button", { name: "Aplicar en NagWeb", exact: true }).click();
  await expect(libraryFrame.locator('[data-apply-status]')).toContainText("Componente HTML/CSS Uiverse insertado y guardado");
  const insertedHtml = await page.evaluate(() => {
    const e = sec().elements.find(e => e.nwResource?.kind === "uiverse-html");
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    return { element: structuredClone(e), currentCount:sec().elements.length,
      saved: saved?.pages?.flatMap(p => p.sections).flatMap(s => s.elements).some(x => x.id === e.id) };
  });
  assert.equal(insertedHtml.element.type,"embed");
  assert.equal(insertedHtml.element.mode,"html");
  assert.equal(insertedHtml.element.nwResource.id,css.id);
  assert.equal(insertedHtml.element.nwResource.license.verified,true);
  assert.equal(insertedHtml.saved,true,"Uiverse embed must be persisted");
  assert.equal(insertedHtml.currentCount,3);
  assert.ok(insertedHtml.element.w>0 && insertedHtml.element.ratio>0,
    "Native embed must have editable position and size");
  assert.ok(insertedHtml.element.mobile.w>0,"Native embed must preserve mobile width");
  assert.equal(await page.evaluate(() => history.length),htmlBefore+1,
    "HTML insertion creates one undo entry");
  const htmlEnvelope = await page.evaluate(() => window.resourceMessages.at(-1));
  // page.reload() replaced the original library iframe from the SVG tests.
  const liveBrowserFrame = page.frames().find(f => f.url().includes("/resource-browser/"));
  assert.ok(liveBrowserFrame, "Uiverse library must remain mounted during HTML insertion");
  const htmlRejected={ ...htmlEnvelope, requestId:"unsafe-html-payload",
    descriptor:{...htmlEnvelope.descriptor,payload:{
      ...htmlEnvelope.descriptor.payload,html:'<script>parent.__injected=true</script>'}}};
  await liveBrowserFrame.evaluate(message => parent.postMessage(message,location.origin),htmlRejected);
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => sec().elements.length),insertedHtml.currentCount,
    "A rejected HTML payload must not mutate editor elements");
  assert.equal(await page.evaluate(() => history.length),htmlBefore+1,
    "Rejected HTML must not create undo history");
  await liveBrowserFrame.evaluate(message => parent.postMessage(message,location.origin),htmlEnvelope);
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => sec().elements.length),insertedHtml.currentCount,
    "A duplicated HTML request must not create another element");
  await page.getByRole("button", { name: "Volver al editor", exact: true }).click();
  const isolatedFrame=page.frameLocator("#preview")
    .locator(`[data-id="${insertedHtml.element.id}"] iframe.emb-sand`);
  await expect(isolatedFrame).toBeVisible();
  assert.equal(await isolatedFrame.getAttribute("sandbox"),"",
    "Uiverse iframe must have no execution or same-origin capabilities");
  assert.equal(await isolatedFrame.getAttribute("referrerpolicy"),"no-referrer");
  const nestedCard=page.frameLocator("#preview")
    .frameLocator(`[data-id="${insertedHtml.element.id}"] iframe.emb-sand`).locator(".card");
  await expect(nestedCard).toBeVisible();
  await expect(nestedCard).toHaveCSS("background-color","rgb(18, 52, 86)");
  const htmlExport=await page.evaluate(() => generateSite(flattenPage(page()),false,true,false));
  assert.match(htmlExport,/sandbox=""[^>]+srcdoc=/,
    "Exported Uiverse HTML must remain isolated in a sandboxed iframe");
  assert.ok(htmlExport.includes("default-src") && htmlExport.includes("script-src"),
    "Export includes restrictive CSP for Uiverse HTML");
  assert.equal(await page.frameLocator("#preview")
    .locator(`[data-id="${insertedHtml.element.id}"] .card`).count(),0,
    "Uiverse markup must not enter the canvas DOM outside its frame");
  await page.locator("#btn-undo").click();
  assert.equal(await page.evaluate(() => sec().elements.some(e=>e.nwResource?.kind==="uiverse-html")),false);
  await page.locator("#btn-redo").click();
  assert.equal(await page.evaluate(() => sec().elements.some(e=>e.nwResource?.kind==="uiverse-html")),true);
  await page.reload();
  await expect(page.frameLocator("#preview")
    .frameLocator(`[data-id="${insertedHtml.element.id}"] iframe.emb-sand`).locator(".card")).toBeVisible();
  assert.equal(await page.evaluate(id=>sec().elements.find(e=>e.id===id)?.nwResource?.id,insertedHtml.element.id),css.id);
  // Stage 53: reopen an existing Uiverse HTML embed for controlled edits.
  // Cancel first, then save into the original ID without changing placement.
  await page.evaluate(id => {
    selection=[id];
    curEl=sec().elements.findIndex(e=>e.id===id);
    renderPane();
  },insertedHtml.element.id);
  const htmlEditButton=page.getByRole("button",{
    name:"Personalizar componente Uiverse seleccionado",exact:true
  });
  await expect(htmlEditButton).toBeEnabled();
  const originalHtmlElement=await page.evaluate(id=>structuredClone(
    sec().elements.find(e=>e.id===id)),insertedHtml.element.id);
  const originalHtmlCount=await page.evaluate(()=>sec().elements.length);
  const htmlPlayControl=describeEditableControls(css).find(c=>c.id==="uiversePlay1");
  assert.ok(htmlPlayControl,"The HTML fixture needs a real editable animation selector");
  await reopenCustomization(htmlEditButton);
  const editLiveLibrary=page.frameLocator('iframe[title="Biblioteca de recursos de NagWeb"]');
  const htmlSave=editLiveLibrary.getByRole("button",{
    name:"Guardar cambios en el componente",exact:true
  });
  await expect(htmlSave).toBeEnabled();
  const repetition=editLiveLibrary.getByLabel(htmlPlayControl.label,{exact:true});
  const repetitionGroup=editLiveLibrary.locator("details").filter({has:repetition});
  if (!await repetitionGroup.evaluate(n=>n.open))
    await repetitionGroup.locator("summary").click();
  await expect(repetition).toHaveValue("2");
  await repetition.selectOption("4");
  await page.getByRole("button",{name:"Volver al editor",exact:true}).click();
  assert.equal(await page.evaluate(id=>sec().elements.find(e=>e.id===id).nwResource.values.uiversePlay1,
    insertedHtml.element.id),"2","Cancelling HTML customization must not modify its model");
  await reopenCustomization(htmlEditButton);
  await expect(htmlSave).toBeEnabled();
  const resumedRepetition=editLiveLibrary.getByLabel(htmlPlayControl.label,{exact:true});
  const resumedGroup=editLiveLibrary.locator("details").filter({has:resumedRepetition});
  if (!await resumedGroup.evaluate(n=>n.open))
    await resumedGroup.locator("summary").click();
  await expect(resumedRepetition).toHaveValue("2");
  await resumedRepetition.selectOption("4");
  const beforeHtmlEditHistory=await page.evaluate(()=>history.length);
  await htmlSave.click();
  await expect(editLiveLibrary.locator("[data-apply-status]"))
    .toContainText("Cambios guardados en el componente Uiverse seleccionado");
  const reeditedHtml=await page.evaluate(id=>{
    const e=sec().elements.find(e=>e.id===id);
    return {element:structuredClone(e),count:sec().elements.length,
      stored:JSON.parse(localStorage.getItem(STORE_KEY)).pages[0].sections[0]
        .elements.find(x=>x.id===id)};
  },insertedHtml.element.id);
  assert.equal(reeditedHtml.count,originalHtmlCount,"HTML edit must never duplicate elements");
  assert.equal(reeditedHtml.element.id,originalHtmlElement.id);
  assert.equal(reeditedHtml.element.nwResource.values.uiversePlay1,"4");
  assert.equal(reeditedHtml.stored.nwResource.values.uiversePlay1,"4");
  assert.match(reeditedHtml.element.code,/spin 1s 4 alternate/,
    "The saved isolated HTML includes edited CSS");
  for (const key of ["x","y","w","h","mobile","ratio","parent","name","anim"]) {
    assert.deepEqual(reeditedHtml.element[key],originalHtmlElement[key],
      "Re-edit preserves HTML embed placement and property "+key);
  }
  assert.equal(await page.evaluate(()=>history.length),beforeHtmlEditHistory+1,
    "Changing HTML styling creates exactly one undo entry");
  await page.getByRole("button",{name:"Volver al editor",exact:true}).click();
  await expect(page.frameLocator("#preview")
    .frameLocator(`[data-id="${insertedHtml.element.id}"] iframe.emb-sand`)
    .locator(".card")).toHaveCSS("animation-iteration-count","4");
  const htmlEditedExport=await page.evaluate(()=>
    generateSite(flattenPage(page()),false,true,false));
  assert.match(htmlEditedExport,/spin 1s 4 alternate/);
  assert.match(htmlEditedExport,/sandbox=""/,"Edited HTML is still isolated on export");
  await page.locator("#btn-undo").click();
  assert.equal(await page.evaluate(id=>sec().elements.find(e=>e.id===id).nwResource.values.uiversePlay1,
    insertedHtml.element.id),"2");
  await page.locator("#btn-redo").click();
  assert.equal(await page.evaluate(id=>sec().elements.find(e=>e.id===id).nwResource.values.uiversePlay1,
    insertedHtml.element.id),"4");
  await page.reload();
  assert.equal(await page.evaluate(id=>sec().elements.find(e=>e.id===id).nwResource.values.uiversePlay1,
    insertedHtml.element.id),"4");
  // Stage 55: real-editor HTML edit hardening. A no-op must not create undo
  // history; a stale editing session must not mutate the selected embed;
  // failed browser storage must never be acknowledged as saved.
  await page.evaluate(id => {
    selection=[id];curEl=sec().elements.findIndex(e=>e.id===id);renderPane();
  },insertedHtml.element.id);
  await reopenCustomization(htmlEditButton);
  await expect(htmlSave).toBeEnabled();
  const noOpHistory=await page.evaluate(()=>history.length);
  await htmlSave.click();
  await expect(editLiveLibrary.locator("[data-apply-status]"))
    .toContainText("Cambios guardados en el componente Uiverse seleccionado");
  assert.equal(await page.evaluate(()=>history.length),noOpHistory,
    "Unchanged Uiverse HTML must not create a new undo entry");
  await page.evaluate(id => {
    const element=sec().elements.find(e=>e.id===id);
    snapshot();element.x=(element.x||0)+11;refresh();
  },insertedHtml.element.id);
  const staleHistory=await page.evaluate(()=>history.length);
  const stalePosition=await page.evaluate(id=>sec().elements.find(e=>e.id===id).x,
    insertedHtml.element.id);
  await htmlSave.click();
  await expect(editLiveLibrary.locator("[data-apply-status]"))
    .toContainText("El recurso cambió o fue eliminado");
  assert.equal(await page.evaluate(()=>history.length),staleHistory,
    "An externally moved HTML component must reject stale editing sessions");
  assert.equal(await page.evaluate(id=>sec().elements.find(e=>e.id===id).x,
    insertedHtml.element.id),stalePosition);
  await page.getByRole("button",{name:"Volver al editor",exact:true}).click();
  await page.locator("#btn-undo").click();
  await page.evaluate(id => {
    selection=[id];curEl=sec().elements.findIndex(e=>e.id===id);renderPane();
  },insertedHtml.element.id);
  await reopenCustomization(htmlEditButton);
  await expect(htmlSave).toBeEnabled();
  const storageRepetition=editLiveLibrary.getByLabel(htmlPlayControl.label,{exact:true});
  const storageGroup=editLiveLibrary.locator("details").filter({has:storageRepetition});
  if(!await storageGroup.evaluate(n=>n.open))await storageGroup.locator("summary").click();
  await expect(storageRepetition).toHaveValue("4");
  await storageRepetition.selectOption("5");
  await page.evaluate(()=>{
    window.stage55OriginalSetItem=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){
      if(key==="scrollcraft.proyecto.v3")
        throw new DOMException("Almacenamiento lleno","QuotaExceededError");
      return window.stage55OriginalSetItem.call(this,key,value);
    };
  });
  await htmlSave.click();
  await expect(editLiveLibrary.locator("[data-apply-status]"))
    .toContainText("no se pudo guardar");
  assert.equal(await page.evaluate(id=>{
    const saved=JSON.parse(localStorage.getItem(STORE_KEY));
    return saved.pages[0].sections[0].elements.find(e=>e.id===id)?.nwResource?.values?.uiversePlay1;
  },insertedHtml.element.id),"4",
  "A failed localStorage write cannot count as a persisted HTML change");
  await page.evaluate(()=>{Storage.prototype.setItem=window.stage55OriginalSetItem;});
  await page.getByRole("button",{name:"Volver al editor",exact:true}).click();
  await expect(page.getByRole("button", { name: "Personalizar componente Uiverse seleccionado", exact: true })).toBeFocused();
  report.scenarios.push({editor:"NagWeb HTML/CSS re-edit robustness",status:"passed",
    unchangedNoHistory:true,staleSessionRejected:true,storageFailureDetected:true});
  // Stage 71: edit a real Uiverse button label on an existing HTML embed.
  await page.evaluate(id=>{
    selection=[id];curEl=sec().elements.findIndex(e=>e.id===id);renderPane();
  },insertedHtml.element.id);
  await reopenCustomization(htmlEditButton);
  const labelField=editLiveLibrary.getByLabel("Texto del botón 1",{exact:true});
  const labelGroup=editLiveLibrary.locator('details[data-category="content"]');
  if (!await labelGroup.evaluate(n=>n.open)) await labelGroup.locator("summary").click();
  await expect(labelField).toHaveValue("Prueba");
  await labelField.fill("Comprar ahora");
  await htmlSave.click();
  await expect(editLiveLibrary.locator("[data-apply-status]"))
    .toContainText("Cambios guardados en el componente Uiverse seleccionado");
  await page.getByRole("button",{name:"Volver al editor",exact:true}).click();
  assert.equal(await page.evaluate(id=>sec().elements.find(e=>e.id===id).nwResource.values.uiverseText1,
    insertedHtml.element.id),"Comprar ahora");
  await expect(page.frameLocator("#preview")
    .frameLocator(`[data-id="${insertedHtml.element.id}"] iframe.emb-sand`)
    .locator("button.card")).toHaveText("Comprar ahora");
  const labelExport=await page.evaluate(()=>generateSite(flattenPage(page()),false,true,false));
  assert.match(labelExport,/Comprar ahora/);
  assert.match(labelExport,/sandbox=""/);
  await page.reload();
  assert.equal(await page.evaluate(id=>sec().elements.find(e=>e.id===id).nwResource.values.uiverseText1,
    insertedHtml.element.id),"Comprar ahora");
  // Stage 72: edit a real form placeholder without replacing the embed.
  await page.evaluate(id=>{
    selection=[id];curEl=sec().elements.findIndex(e=>e.id===id);renderPane();
  },insertedHtml.element.id);
  await reopenCustomization(htmlEditButton);
  const hintInput=editLiveLibrary.getByLabel("Texto de campo 1",{exact:true});
  const hintGroup=editLiveLibrary.locator('details[data-category="content"]');
  if(!await hintGroup.evaluate(n=>n.open)) await hintGroup.locator("summary").click();
  await expect(hintInput).toHaveValue("Tu correo");
  await hintInput.fill("Ingresá tu email");
  await htmlSave.click();
  await expect(editLiveLibrary.locator("[data-apply-status]"))
    .toContainText("Cambios guardados en el componente Uiverse seleccionado");
  await page.getByRole("button",{name:"Volver al editor",exact:true}).click();
  assert.equal(await page.evaluate(id=>sec().elements.find(e=>e.id===id).nwResource.values.uiverseHint1,
    insertedHtml.element.id),"Ingresá tu email");
  await expect(page.frameLocator("#preview")
    .frameLocator(`[data-id="${insertedHtml.element.id}"] iframe.emb-sand`)
    .locator("input.email")).toHaveAttribute("placeholder","Ingresá tu email");
  const hintExport=await page.evaluate(()=>generateSite(flattenPage(page()),false,true,false));
  assert.match(hintExport,/Ingresá tu email/);
  await page.reload();
  assert.equal(await page.evaluate(id=>sec().elements.find(e=>e.id===id).nwResource.values.uiverseHint1,
    insertedHtml.element.id),"Ingresá tu email");
  report.scenarios.push({editor:"NagWeb editable Uiverse placeholder",status:"passed",
    sameEmbed:true,preview:true,export:true,reload:true});
  report.scenarios.push({editor:"NagWeb editable Uiverse text",status:"passed",
    noDuplicate:true,preview:true,export:true,reload:true});
  report.scenarios.push({editor:"NagWeb HTML/CSS re-edit same embed",status:"passed",
    cancel:true,sameId:true,noDuplicate:true,positionPreserved:true,
    undoRedo:true,reload:true,export:true});
  report.scenarios.push({editor:"NagWeb persistent Uiverse HTML/CSS",status:"passed",
    iframeSandbox:true,save:true,undoRedo:true,reload:true,export:true,
    externalScriptsBlocked:true,invalidPayloadRejected:true});
  // A bordered grid has different column counts, spacing and padding on mobile.
  // Use rendered CSS width as the oracle, including a rotated native vector.
  await page.evaluate(id => {
    const vector = sec().elements.find(e => e.id === id);
    const container = mkEl("container", { w: 50, h: 320, x: 50, y: 50,
      stackDir: "grid", gridCols: 2, stackPad: 24, stackGap: 16,
      border: "#123456", borderWidth: 4, shadow: false, anim: "none",
      mobile: { w: 90, gridCols: 1, stackPad: 18, stackGap: 8 } });
    vector.parent = container.id;
    vector.w = 20; vector.mobile = { w: 20 }; vector.rot = 30; vector.anim = "none";
    sec().elements.push(container);
    selection = [vector.id]; curEl = sec().elements.indexOf(vector); secFocus = false;
    refresh();
    renderPreview();
  }, inserted.element.id);
  const gridVector = page.frameLocator("#preview").locator(`[data-id="${inserted.element.id}"]`);
  await expect(gridVector).toHaveAttribute("data-w", "20");
  await expect(gridVector).toHaveAttribute("data-rot", "30");
  const renderedWidth = () => gridVector.evaluate(n => Number.parseFloat(getComputedStyle(n).width));
  const setEditSize = async value => {
    const group = libraryFrame.locator('details[data-category="size"]');
    if (!await group.evaluate(n => n.open)) await group.locator("summary").click();
    const control = libraryFrame.getByLabel("Tamaño", { exact: true });
    await control.focus(); await control.press("Home");
    for (let i = 16; i < value; i++) await control.press("ArrowRight");
  };
  const openGridEdit = async () => {
    await reopenCustomization(page.getByRole("button", { name: "Personalizar ícono seleccionado", exact: true }));
    await expect(libraryFrame.getByRole("button", { name: "Guardar cambios en el ícono", exact: true })).toBeEnabled();
    const group = libraryFrame.locator('details[data-category="size"]');
    if (!await group.evaluate(n => n.open)) await group.locator("summary").click();
  };
  const desktopGridWidth = Math.round(await renderedWidth());
  const oldModelWidth = await page.evaluate(id => Math.round(designWpx(sec().elements.find(e => e.id === id), sec())), inserted.element.id);
  assert.notEqual(oldModelWidth, desktopGridWidth, "Bordered grid fixture must reproduce the previous sizing error");
  await openGridEdit();
  await expect(libraryFrame.getByLabel("Tamaño", { exact: true })).toHaveValue(String(desktopGridWidth));
  await setEditSize(48);
  await libraryFrame.getByRole("button", { name: "Guardar cambios en el ícono", exact: true }).click();
  await expect(libraryFrame.locator('[data-apply-status]')).toContainText("Cambios guardados");
  await page.getByRole("button", { name: "Volver al editor", exact: true }).click();
  await expect.poll(renderedWidth).toBeCloseTo(48, 1);
  const desktopState = await page.evaluate(id => ({ w: sec().elements.find(e => e.id === id).w, stroke: sec().elements.find(e => e.id === id).stroke }), inserted.element.id);
  await page.locator("#btn-view-mob").click();
  await expect(gridVector).toHaveAttribute("data-w", "20");
  const mobileGridWidth = Math.round(await renderedWidth());
  await openGridEdit();
  await expect(libraryFrame.getByLabel("Tamaño", { exact: true })).toHaveValue(String(mobileGridWidth));
  await expect(page.getByText("Personalizá el ícono seleccionado · versión celular.", { exact: true })).toBeVisible();
  await setEditSize(32);
  await libraryFrame.getByLabel("Color", { exact: true }).fill("#abcdef");
  await libraryFrame.getByRole("button", { name: "Guardar cambios en el ícono", exact: true }).click();
  await expect(libraryFrame.locator('[data-apply-status]')).toContainText("Cambios guardados");
  await page.getByRole("button", { name: "Volver al editor", exact: true }).click();
  await expect.poll(renderedWidth).toBeCloseTo(32, 1);
  const mobileState = await page.evaluate(id => structuredClone(sec().elements.find(e => e.id === id)), inserted.element.id);
  assert.equal(mobileState.w, desktopState.w, "Mobile edit preserves desktop width");
  assert.equal(mobileState.stroke, desktopState.stroke, "Mobile edit preserves desktop stroke");
  assert.equal(mobileState.mobile.stroke, "#abcdef");
  assert.equal(mobileState.rot, 30);
  await page.screenshot({ path: path.join(output, "editor-mobile-grid.png"), fullPage: true });
  await page.locator("#btn-undo").click();
  await expect(gridVector).toHaveAttribute("data-w", "20");
  await page.locator("#btn-redo").click();
  await expect.poll(renderedWidth).toBeCloseTo(32, 1);
  await page.locator("#btn-view-desk").click();
  await expect.poll(renderedWidth).toBeCloseTo(48, 1);
  await page.reload();
  await expect.poll(renderedWidth).toBeCloseTo(48, 1);
  await page.locator("#btn-view-mob").click();
  await expect.poll(renderedWidth).toBeCloseTo(32, 1);
  await page.evaluate(id => {
    const e = sec().elements.find(e => e.id === id);
    sec().elements.find(parent => parent.id === e.parent).stackDir = "masonry";
    selection = [id]; curEl = sec().elements.indexOf(e); secFocus = false; refresh();
  }, inserted.element.id);
  await expect(gridVector.locator("..")).toHaveClass(/lay-masonry/);
  await openGridEdit();
  await setEditSize(32);
  const fixedHistory = await page.evaluate(() => history.length);
  await libraryFrame.getByRole("button", { name: "Guardar cambios en el ícono", exact: true }).click();
  await expect(libraryFrame.locator('[data-apply-status]')).toContainText("Esta disposición fija el ancho del ícono");
  assert.equal(await page.evaluate(() => history.length), fixedHistory, "Forced layout widths must not produce a misleading saved size");
  await page.getByRole("button", { name: "Volver al editor", exact: true }).click();
  report.scenarios.push({ editor: "SVG in responsive bordered grid", status: "passed", desktopPx: 48, mobilePx: 32, rotationPreserved: true, undoRedo: true, reload: true, forcedWidthRejected: true });
  for (const layout of ["flow", "horizontal"]) {
    for (const insertMobile of [false, true]) {
      await page.evaluate(layout => {
        Object.assign(sec(), { layout, align: "left", valign: "top", mobile: { align: "center" }, elements: [] });
        selection = []; curEl = -1; secFocus = true; refresh();
      }, layout);
      await page.locator(insertMobile ? "#btn-view-mob" : "#btn-view-desk").click();
      await page.getByRole("button", { name: "Biblioteca de recursos", exact: true }).click();
      const libraryNode = page.locator('iframe[title="Biblioteca de recursos de NagWeb"]');
      const libraryChild = await (await libraryNode.elementHandle()).contentFrame();
      await libraryChild.waitForURL(await libraryNode.getAttribute("src"), { waitUntil: "domcontentloaded" });
      await libraryFrame.locator('[data-resource-id="smoke:icon"]').click();
      await setEditSize(44);
      const historyBeforeInsert = await page.evaluate(() => history.length);
      await libraryFrame.getByRole("button", { name: "Aplicar en NagWeb", exact: true }).click();
      await expect(libraryFrame.locator('[data-apply-status]')).toContainText("Ícono insertado y guardado");
      const id = await page.evaluate(() => selection[0]);
      assert.equal(await page.evaluate(() => history.length), historyBeforeInsert + 1, "Measuring both layouts adds no extra undo entries");
      assert.equal(await page.locator('[data-resource-size-probe]').count(), 0, "Measurement frames are removed");
      await page.getByRole("button", { name: "Volver al editor", exact: true }).click();
      const vector = page.frameLocator("#preview").locator(`[data-id="${id}"]`);
      const width = async () => {
        try { return await vector.evaluate(n => Number.parseFloat(getComputedStyle(n).width)); }
        catch (error) {
          if (/Execution context was destroyed|Frame was detached/.test(error.message)) return NaN;
          throw error;
        }
      };
      await expect.poll(width).toBeCloseTo(44, 1);
      await page.locator(insertMobile ? "#btn-view-desk" : "#btn-view-mob").click();
      await expect.poll(width).toBeCloseTo(44, 1);
      await reopenCustomization(page.getByRole("button", { name: "Personalizar ícono seleccionado", exact: true }));
      await setEditSize(48);
      await libraryFrame.getByRole("button", { name: "Guardar cambios en el ícono", exact: true }).click();
      await expect(libraryFrame.locator('[data-apply-status]')).toContainText("Cambios guardados en el ícono seleccionado");
      await page.getByRole("button", { name: "Volver al editor", exact: true }).click();
      await expect.poll(width).toBeCloseTo(48, 1);
      await page.locator("#btn-undo").click();
      await expect.poll(width).toBeCloseTo(44, 1);
      await page.locator("#btn-redo").click();
      await expect.poll(width).toBeCloseTo(48, 1);
      await page.reload();
      await page.locator(insertMobile ? "#btn-view-desk" : "#btn-view-mob").click();
      await expect.poll(width).toBeCloseTo(48, 1);
      await page.locator(insertMobile ? "#btn-view-mob" : "#btn-view-desk").click();
      await expect.poll(width).toBeCloseTo(44, 1);
      report.scenarios.push({ editor: "SVG insertion across native layouts", layout, insertMobile, initialPx: 44, editedPx: 48, independentViews: true, undoRedo: true, reload: true });
    }
  }
  for (const race of ["duplicate", "cancel-reopen", "changed-scene"]) {
    await page.evaluate(() => {
      if (!window.resourceMessages) {
        window.resourceMessages = [];
        window.addEventListener("message", event => { if (event.data?.type === "nagweb:resource-apply") window.resourceMessages.push(event.data); });
      }
      Object.assign(sec(), { layout: "flow", elements: [] });
      selection = []; curEl = -1; secFocus = true; refresh();
    });
    await page.locator("#btn-view-desk").click();
    await page.getByRole("button", { name: "Biblioteca de recursos", exact: true }).click();
    const iframe = page.locator('iframe[title="Biblioteca de recursos de NagWeb"]');
    const child = await (await iframe.elementHandle()).contentFrame();
    await child.waitForURL(await iframe.getAttribute("src"), { waitUntil: "domcontentloaded" });
    if (await libraryFrame.locator('[data-detail]').evaluate(node => node.open)) {
      await libraryFrame.getByRole("button", { name: "Cerrar", exact: true }).click();
    }
    await libraryFrame.locator('[data-resource-id="smoke:icon"]').click();
    await page.evaluate(() => {
      const original = document.createElement;
      let release;
      const gate = new Promise(resolve => { release = resolve; });
      // Hold native measurement load callbacks; avoid timing-dependent sleeps.
      document.createElement = function(...args) {
        const node = original.apply(this, args);
        if (args[0] === "iframe") {
          const add = node.addEventListener.bind(node);
          node.addEventListener = (type, listener, options) => add(type,
            type === "load" ? event => gate.then(() => listener.call(node, event)) : listener, options);
        }
        return node;
      };
      window.releaseResourceMeasurement = () => { document.createElement = original; release(); };
    });
    const before = await page.evaluate(() => history.length);
    await libraryFrame.getByRole("button", { name: "Aplicar en NagWeb", exact: true }).click();
    await expect(page.locator('[data-resource-size-probe]')).toHaveCount(2);
    if (race === "duplicate") {
      const request = await page.evaluate(() => window.resourceMessages.at(-1));
      await child.evaluate(message => { parent.postMessage(message, location.origin); parent.postMessage(message, location.origin); }, request);
    } else if (race === "cancel-reopen") {
      await page.getByRole("button", { name: "Volver al editor", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "Biblioteca de recursos", exact: true })).not.toBeVisible();
      await page.getByRole("button", { name: "Biblioteca de recursos", exact: true }).click();
    } else {
      await page.evaluate(() => { sec().bg = "#445566"; refresh(); });
    }
    await page.evaluate(() => window.releaseResourceMeasurement());
    await expect(libraryFrame.locator('[data-apply-status]')).toContainText(race === "duplicate" ? "Ícono insertado y guardado" : "La escena cambió durante la inserción");
    assert.equal(await page.evaluate(() => sec().elements.length), race === "duplicate" ? 1 : 0);
    assert.equal(await page.evaluate(() => history.length), before + (race === "duplicate" ? 1 : 0));
    await expect(page.locator('[data-resource-size-probe]')).toHaveCount(0);
    await page.getByRole("button", { name: "Volver al editor", exact: true }).click();
    report.scenarios.push({ editor: "SVG asynchronous insertion", race, status: "passed", probesRemoved: true, historyPreserved: true });
  }
  for (const layout of ["free", "flow", "horizontal"]) {
    await page.evaluate(layout => {
      Object.assign(sec(), { layout, elements: [], align: "left", mobile: { align: "center" } });
      selection = []; curEl = -1; secFocus = true; refresh();
    }, layout);
    await page.locator(layout === "horizontal" ? "#btn-view-mob" : "#btn-view-desk").click();
    await page.getByRole("button", { name: "Biblioteca de recursos", exact: true }).click();
    const iframe = page.locator('iframe[title="Biblioteca de recursos de NagWeb"]');
    const child = await (await iframe.elementHandle()).contentFrame();
    await child.waitForURL(await iframe.getAttribute("src"), { waitUntil: "domcontentloaded" });
    if (await libraryFrame.locator('[data-detail]').evaluate(node => node.open)) {
      await libraryFrame.getByRole("button", { name: "Cerrar", exact: true }).click();
    }
    await libraryFrame.locator(`[data-resource-id="${css.id}"]`).click();
    const before = await page.evaluate(() => history.length);
    await libraryFrame.getByRole("button", { name: "Aplicar en NagWeb", exact: true }).click();
    await expect(libraryFrame.locator('[data-apply-status]')).toContainText("insertado y guardado");
    const id = await page.evaluate(() => selection[0]);
    assert.equal(await page.evaluate(() => history.length), before + 1);
    await expect(page.locator('[data-resource-size-probe]')).toHaveCount(0);
    await page.getByRole("button", { name: "Volver al editor", exact: true }).click();
    const embed = page.frameLocator("#preview").locator(`[data-id="${id}"]`);
    const checkWidth = async mobile => {
      await page.locator(mobile ? "#btn-view-mob" : "#btn-view-desk").click();
      await expect(embed).toBeVisible();
      const percent = await page.evaluate(id => vget(sec().elements.find(element => element.id === id), "w"), id);
      await expect(embed).toHaveAttribute("data-w", String(percent));
      await expect.poll(async () => {
        try {
          return await embed.evaluate((node, { layout, mobile }) => {
            const limit = mobile ? 260 : 320;
            const expected = layout === "flow"
              ? Math.min(limit, Number.parseFloat(getComputedStyle(node.parentElement).width) * .85)
              : limit;
            return Number.parseFloat(getComputedStyle(node).width) - expected;
          }, { layout, mobile });
        }
        catch (error) { if (/Execution context was destroyed|Frame was detached/.test(error.message)) return NaN; throw error; }
      }).toBeCloseTo(0, 1);
      const sandbox = embed.locator('iframe[title="Componente Uiverse aislado"]');
      await expect(sandbox).toHaveAttribute("sandbox", "");
      assert.equal(await sandbox.evaluate(node => node.contentDocument === null), true);
    };
    await checkWidth(false);
    await checkWidth(true);
    await page.reload();
    await checkWidth(false);
    await checkWidth(true);
    assert.equal(await page.evaluate(id => sec().elements.find(e => e.id === id).nwResource.id, id), css.id);
    report.scenarios.push({ editor: "Uiverse insertion across native layouts", layout, mobileInsertion: layout === "horizontal", desktopMaxPx: 320, mobileMaxPx: 260, cappedAt85Percent: true, isolated: true, reload: true });
  }
  await context.close();
  assert.deepEqual(report.errors, [], "Browser must not emit uncaught errors or external requests");
  console.log("Resource Browser Chromium smoke: panel desktop/mobile + real NagWeb SVG insertion and editing, save, cancel, undo/redo, reload and rejected inputs OK.");
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
