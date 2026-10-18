import assert from "node:assert/strict";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { transformUiverseComponent, transformSpinKitLoader, transformMagicCssEffect, transformAnimXyzPreset, transformHyperUiRuntime, transformHyperUiBlock, transformGlslNoise, transformThreeCodeScene, transformCssShakeRuntime, transformCssShakeEffect } from "./light-transformers.mjs";
import { normalizeHeroiconOutline } from "./extractors/heroicons.mjs";
import { transformHeroiconOutline } from "./heroicons-transformer.mjs";
import { browseHeroiconPaths } from "./snapshot/browse-icon-paths.mjs";
import { browseLucideShapes } from "./snapshot/browse-lucide-shapes.mjs";
import { editorUseOf } from "./runtime/editor-availability.mjs";
import { uiverseBucket } from "./snapshot/build-uiverse-shards.mjs";
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

const threeGalleryRoot=path.join(root,"resource-browser","three-previews");
const threeGallery=JSON.parse(await readFile(path.join(threeGalleryRoot,"manifest.json"),"utf8"));
assert.equal(threeGallery.format,"nagweb-threejs-source-gallery/1");
assert.equal(threeGallery.sourceCommit,"e9a8a1264c58150907230122ac17f5760a1ebab1");
const sceneEntries=Object.entries(threeGallery.entries||{});
assert.equal(sceneEntries.length,281,"All mirrored Three.js scenes have source screenshots");
for(const [id,entry] of sceneEntries){
  assert.match(id,/^threejs:example:[a-z0-9_-]+$/);
  assert.equal(entry.image,"screenshots/"+id.slice("threejs:example:".length)+".jpg");
  const bytes=await readFile(path.join(threeGalleryRoot,entry.image));
  assert.equal(bytes.subarray(0,3).toString("hex"),"ffd8ff");
  assert.equal(bytes.subarray(-2).toString("hex"),"ffd9");
  assert.equal(createHash("sha256").update(bytes).digest("hex"),entry.sha256);
}
console.log("Three.js gallery:",sceneEntries.length,"verified original examples from pinned source revision.");

const galleryRoot=path.join(root,"resource-browser","react-previews");
const gallery=JSON.parse(await readFile(path.join(galleryRoot,"manifest.json"),"utf8"));
assert.equal(gallery.format,"nagweb-compiled-react-gallery/1");
const realReactEntries=Object.entries(gallery.entries||{});
assert.ok(realReactEntries.length>=50 && realReactEntries.length<=69,
  "At least 50 real React previews must be published before the browser smoke");
assert.deepEqual((await readdir(galleryRoot)).sort(),["manifest.json","thumbnails"],
  "No executable React JavaScript or duplicate runtime may ship to the Library");
const galleryCounts={};
for(const [id,entry] of realReactEntries){
  const provider=id.split(":")[0];
  assert.ok(["magicui","shadcn","motion-primitives"].includes(provider));
  galleryCounts[provider]=(galleryCounts[provider]||0)+1;
  assert.match(entry.thumbnail||"",/^thumbnails\/[a-z0-9._-]+\.png$/);
  assert.equal(entry.html,undefined,"Static React gallery must not promise executable previews");
  const bytes=await readFile(path.join(galleryRoot,entry.thumbnail));
  assert.equal(bytes.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
  assert.equal(createHash("sha256").update(bytes).digest("hex"),entry.pngSha256);
}
for(const count of Object.values(galleryCounts))assert.ok(count>=12);
console.log("React verified PNG gallery:",realReactEntries.length,"cards, no JS shipped.");

const icon = {
  id: "smoke:icon", title: "Ícono de prueba", family: "icon", kind: "svg",
  source: { provider: "smoke" }, license: { id: "MIT", name: "MIT", verified: true },
  runtime: { renderer: "nagweb-svg", entryArtifactId: "icon" },
  artifacts: [{ id: "icon", role: "icon-data", format: "svg", content: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 4L20 20"/></svg>' }],
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
const spinkit=transformSpinKitLoader({
  raw:{repository:"https://github.com/tobiasahlin/SpinKit",commit:"offline-smoke",
    packageJson:{version:"2.0.0"},
    css:':root{--sk-size:40px;--sk-color:#333}.sk-plane{width:var(--sk-size);height:var(--sk-size);background-color:var(--sk-color);animation:sk-plane 1.2s infinite}@keyframes sk-plane{to{transform:rotate(360deg)}}'},
  item:{name:"plane",title:"Plane",html:'<div class="sk-plane"></div>'}
});
const magicCss=transformMagicCssEffect({
  raw:{repository:"https://github.com/miniMAC/magic",commit:"offline-smoke",
    baseCss:".magictime{animation-fill-mode:both;animation-duration:1s}",
    packageJson:{version:"1.0"}},
  item:{name:"puffIn",category:"magic_effects",path:"puffIn.scss",
    code:".puffIn{animation-name:puffIn}@keyframes puffIn{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}"}
});
const animxyz=transformAnimXyzPreset({preset:{name:"flip-right",tracks:[
  {property:"rotateY",from:90,to:0}]},
  commit:"offline-smoke",repository:"https://github.com/animxyz/animxyz"});
const hyperCss='.bg-black{background-color:rgb(17,51,85)}.text-white{color:rgb(255,255,255)}'+
  '.rounded-lg{border-radius:12px}'+'/*verified-css*/'.repeat(105);
const hyperRuntime=transformHyperUiRuntime({
  repository:"https://github.com/markmead/hyperui",commit:"offline-smoke",
  componentCss:hyperCss,componentJs:"// shared helper"
});
const hyperui=transformHyperUiBlock({
  repository:"https://github.com/markmead/hyperui",commit:"offline-smoke",
  item:{collection:"application",group:"buttons",index:1,key:"application/buttons/1",
    light:{path:"public/examples/application/buttons/1.html",sha:"111111"},
    dark:null,
    lightAnalysis:{body:'<button class="bg-black text-white rounded-lg">HyperUI Real</button>',codeOnly:true},
    darkAnalysis:null
  }
});
const glslShader=transformGlslNoise({
  repository:"https://github.com/hughsk/glsl-noise",commit:"offline-smoke",
  item:{path:"classic/2d.glsl",sha:"test",
    exportedSymbol:"cnoise",code:"// A test shader function with its actual sampled GLSL expression.\n"+
    "float cnoise(vec2 p) {float v=sin(p.x*1.7)*cos(p.y*2.3);return v;}\n"+
    "#pragma glslify: export(cnoise)"}
});
const shakeSource={repository:"https://github.com/elrumordelaluz/csshake",commit:"offline-smoke",
 packageJson:{version:"1.6"},scss:"// fixture",effects:[{name:"shake",className:"shake"}],
 css:".shake{display:inherit}.shake:hover,.shake.shake-constant{animation:shake .5s infinite}@keyframes shake{from{transform:translate(0)}to{transform:translate(2px)}}"};
const csshakeRuntime=transformCssShakeRuntime(shakeSource);
const csshake=transformCssShakeEffect({raw:shakeSource,effect:{name:"shake",className:"shake"}});
// Genuine Heroicons 24px outline, exercising its native editor integration.
const heroUpstream = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon">\n  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>\n</svg>';
const heroicon = transformHeroiconOutline({
  item: { name:"x-mark",path:"optimized/24/outline/x-mark.svg",
    sha:"1234567890abcdef1234567890abcdef12345678",
    sourceSvg:heroUpstream, svg:normalizeHeroiconOutline(heroUpstream) },
  commit:"1234567890abcdef1234567890abcdef12345678",
  licenseText:"MIT License\n\nCopyright (c) Tailwind Labs, Inc.\nPermission notice."
});
// Actual Lucide Camera shape, with a curved path and circle, for the
// lightweight browse preview. Insertion is already covered by SVG tests.
const lucideCamera = {
  ...icon, id: "lucide:camera", title: "Camera",
  source: { provider: "lucide" },
  artifacts: [{id:"icon",role:"icon-data",format:"svg",content:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" ' +
    'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/>' +
    '<circle cx="12" cy="13" r="3"/></svg>'}]
};
const codeOnly = {
  id:"magicui:reference", title:"Componente React de referencia",
  family:"ui",kind:"react-component",source:{provider:"magicui"},
  license:{id:"MIT",verified:true},
  runtime:{renderer:"nagweb-react",entryArtifactId:"react"},
  artifacts:[{id:"react",role:"component",format:"tsx",content:"export default function Demo() { return <div>Demo</div>; }"}]
};
const reactGalleryFixture={
  ...codeOnly,id:"magicui:android",title:"Android · React",
  artifacts:[{id:"react",role:"component",format:"tsx",
    content:"export function Android(){return <div>Android component</div>}"}]
};
const threeSceneFixture={
  id:"threejs:example:css3d_orthographic",title:"Three.js · CSS3D Orthographic",
  family:"3d",kind:"code-scene",source:{provider:"threejs"},
  license:{id:"MIT",verified:true},
  runtime:{renderer:"three",entryArtifactId:"scene-source"},
  artifacts:[{id:"scene-source",role:"source",format:"html",
    content:"<html><body><script type=module>import * as THREE from 'three';</script></body></html>"}]
};
assert.ok(threeGallery.entries[threeSceneFixture.id]);
const nativeThreeScene=transformThreeCodeScene({
  repository:"https://github.com/mrdoob/three.js",
  commit:threeGallery.sourceCommit,
  item:{path:"examples/webgl_geometry_colors.html",sha:"smoke-tested",
    html:"<html><title>three.js webgl - geometry - vertex colors</title><script type=\"module\">import * as THREE from 'three'; const g = new THREE.IcosahedronGeometry(1.5,0);</script></html>",
    analysis:{imports:["three"],codeOnly:true,reasons:[]}}
});
assert.equal(editorUseOf(nativeThreeScene),"three-native");
const resources = [icon, css, spinkit, magicCss, animxyz, hyperRuntime, hyperui, glslShader, csshakeRuntime, csshake, heroicon, lucideCamera, codeOnly, reactGalleryFixture, threeSceneFixture, nativeThreeScene];
const zip = data => gzipSync(JSON.stringify(data));
const index = zip({ format: "nagweb-resource-browse-index", resourceCount: resources.length,
  resources: resources.map(r => ({ id: r.id, title: r.title, family: r.family, kind: r.kind, provider: r.source.provider,
    ...(browseHeroiconPaths(r) ? { previewPaths: browseHeroiconPaths(r) } : {}),
    ...(browseLucideShapes(r) ? { previewShapes: browseLucideShapes(r) } : {}),
    snapshotId: r.source.provider,
    editorUse: editorUseOf(r),
    ...(r.source.provider === "uiverse" ? {detailShard:uiverseBucket(r.id)} : {}) })) });
const library = zip({ format: "nagweb-resource-vault-bundle", resourceCount: resources.length, resources });
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const snapshots = [...new Set(resources.map(r => r.source.provider))].map(provider => {
  const owned=resources.filter(r => r.source.provider===provider);
  const body=zip({format:"nagweb-provider-snapshot",provider,count:owned.length,resources:owned});
  return {id:provider,count:owned.length,libraryPath:provider+"-snapshot.json.gz",
    sha256:sha(body),body};
});
const uiverseProvider = snapshots.find(x => x.id === "uiverse");
const tinyShards = Array.from({length:8}, (_,i) => {
  const isCurrent = i === uiverseBucket(css.id);
  const contents = zip({format:"nagweb-provider-shard",sourceSnapshot:"uiverse",
    sourceSha256:uiverseProvider.sha256,shard:i,count:1,
    resources:[isCurrent ? css : {...css,id:"uiverse:other-"+i}]});
  return {id:"uiverse-part-"+i,sourceSnapshot:"uiverse",shard:i,count:1,
    libraryPath:"part-"+i+".json.gz",sha256:sha(contents),body:contents};
});
const fixtures = new Map([
  ["vault-manifest.json", Buffer.from(JSON.stringify({ format: "nagweb-resource-vault-index",
    snapshots: snapshots.map(({body,...meta})=>meta),
    detailShards:{uiverse:{algorithm:"sha256-first-byte-mod-8",
      sourceSha256:uiverseProvider.sha256,
      shards:tinyShards.map(({body,...meta})=>meta)}},
    consolidated: { count: resources.length, browseIndexPath: "index.json.gz", browseIndexSha256: sha(index), libraryPath: "library.json.gz", sha256: sha(library) } }))],
  // Deliberately DO NOT serve library.json.gz to the UI. Browsing/editing
  // must work even when the expensive consolidated source archive is offline.
  ["index.json.gz", index],
  // Uiverse full archive is also intentionally offline: only the exact
  // small detail shard is available for its component.
  ...snapshots.filter(x => x.id !== "uiverse").map(({libraryPath,body})=>[libraryPath,body]),
  ...tinyShards.map(({libraryPath,body})=>[libraryPath,body])
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
  // Standalone shell should keep working on a subsequent fully offline
  // reload. The verified Vault cache still owns manifest/index integrity.
  {
    const shellContext=await browser.newContext({viewport:{width:1080,height:800}});
    const shellPage=await shellContext.newPage();
    currentPage=shellPage;
    shellPage.on("pageerror",error=>report.errors.push("Offline shell: "+error.message));
    let shellExternalOffline=false;
    await shellContext.route("**/*",route=>{
      const url=new URL(route.request().url());
      if(url.hostname==="127.0.0.1")return route.continue();
      // Playwright route.fulfill() bypasses context.setOffline(); block the
      // test's mocked Vault responses too, or it falsely remains online.
      if(shellExternalOffline)return route.abort("internetdisconnected");
      const body=url.origin==="https://raw.githubusercontent.com"
        ? fixtures.get(url.pathname.split("/").at(-1)):null;
      if(!body){report.errors.push("Unexpected offline-shell request: "+url.href);return route.abort();}
      return route.fulfill({status:200,contentType:"application/octet-stream",
        headers:{"access-control-allow-origin":"*","cache-control":"no-store"},body});
    });
    try {
      await shellPage.goto(`http://127.0.0.1:${server.address().port}/resource-browser/`);
      await shellPage.locator('[data-resource-id="smoke:icon"]').waitFor();
      await expect.poll(()=>shellPage.evaluate(async()=>{
        const cache=await caches.open("nagweb-resource-browser-shell-v5");
        return Boolean(navigator.serviceWorker.controller &&
          (await cache.keys()).length>=30);
      }),{timeout:25000}).toBe(true);
      shellExternalOffline=true;
      await shellContext.setOffline(true);
      await shellPage.reload({waitUntil:"domcontentloaded",timeout:15000});
      await shellPage.locator('[data-resource-id="smoke:icon"]').waitFor({timeout:12000});
      await expect(shellPage.locator("[data-status]")).toContainText("Sin conexión");
      report.scenarios.push({browser:"standalone offline app shell and verified Vault index",
        status:"passed",serviceWorker:true,noThirdPartyAssets:true});
    }finally{
      shellExternalOffline=false;
      await shellContext.setOffline(false);
      await shellContext.close();
    }
  }
  for (const width of [1280, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    currentPage = page;
    let simulatedOffline = false;
    page.on("pageerror", error => report.errors.push(error.message));
    page.on("console", message => {
      if (!simulatedOffline && message.type() === "error") report.errors.push(message.text());
    });
    await context.route("**/*", async route => {
      const url = new URL(route.request().url());
      if (url.hostname === "127.0.0.1") return route.continue();
      if (simulatedOffline) return route.abort("internetdisconnected");
      const body = url.origin === "https://raw.githubusercontent.com" ? fixtures.get(url.pathname.split("/").at(-1)) : null;
      if (!body) { report.errors.push(`Unexpected external request: ${url.origin}${url.pathname}`); return route.abort(); }
      return route.fulfill({ status: 200, contentType: "application/octet-stream", headers: { "access-control-allow-origin": "*", "cache-control": "no-store" }, body });
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/host`);
    const frame = page.frameLocator('iframe[title="Biblioteca de prueba"]');
    await frame.locator('[data-resource-id="smoke:icon"]').waitFor();
    // A HyperUI card and detail use its own mirrored HTML and Tailwind CSS.
    // The preview is a real styled element, not a repeated category schematic.
    const hyperCard=frame.locator('[data-resource-id="'+hyperui.id+'"]');
    await hyperCard.scrollIntoViewIfNeeded();
    const hyperStage=frame.frameLocator('[data-auto-preview-id="'+hyperui.id+'"] iframe');
    await expect(hyperStage.getByRole("button",{name:"HyperUI Real"})).toBeVisible({timeout:15000});
    await expect(hyperStage.getByRole("button",{name:"HyperUI Real"}))
      .toHaveCSS("background-color","rgb(17, 51, 85)");
    await hyperCard.click();
    const hyperDetail=frame.frameLocator('[data-preview]');
    await expect(hyperDetail.getByRole("button",{name:"HyperUI Real"})).toBeVisible();
    await expect(hyperDetail.getByRole("button",{name:"HyperUI Real"}))
      .toHaveCSS("background-color","rgb(17, 51, 85)");
    await frame.getByRole("button",{name:"Cerrar",exact:true}).click();
    report.scenarios.push({browser:"HyperUI source HTML with verified Tailwind CSS in card and detail",
      width,status:"passed",realStyles:true,offline:true,noRemoteScripts:true});
    const glslCard=frame.locator('[data-resource-id="'+glslShader.id+'"]');
    await glslCard.scrollIntoViewIfNeeded();
    const glslStage=frame.frameLocator('[data-auto-preview-id="'+glslShader.id+'"] iframe');
    await expect(frame.locator('[data-auto-preview-id="'+glslShader.id+'"] iframe'))
      .toHaveAttribute("sandbox","allow-scripts",{timeout:15000});
    await expect(glslStage.locator("body[data-glsl-status]")).toBeVisible({timeout:15000});
    const cardStatus=await glslStage.locator("body").getAttribute("data-glsl-status");
    if(cardStatus==="rendered"){
      await expect(glslStage.locator('img[alt="Valores reales de GLSL"]')).toHaveAttribute("src",/^data:image\/png/);
    }else{
      assert.equal(cardStatus,"unavailable");
      await expect(glslStage.locator("[data-shader-message]")).toBeVisible();
    }
    await glslCard.click();
    const glslDetail=frame.frameLocator("[data-preview]");
    await expect(frame.locator("[data-preview]")).toHaveAttribute("sandbox","allow-scripts");
    await expect(glslDetail.locator("body[data-glsl-status]")).toBeVisible({timeout:15000});
    await expect(frame.locator("[data-preview-note]")).toContainText("función GLSL original");
    await frame.getByRole("button",{name:"Cerrar",exact:true}).click();
    report.scenarios.push({browser:"GLSL original function sampled with offline WebGL",
      width,status:"passed",realGPU:cardStatus==="rendered",offline:true,sandboxed:true});
    // Each Three.js thumbnail comes from the exact ORIGINAL git revision
    // whose source code is mirrored in our Vault. No remote URL or JS runtime.
    const threeCard=frame.locator('[data-resource-id="'+threeSceneFixture.id+'"]');
    const threeSurface=frame.locator('[data-resource-id="'+threeSceneFixture.id+'"] + .card-visual-surface');
    await threeCard.scrollIntoViewIfNeeded();
    await expect(threeSurface).toHaveClass(/is-three-preview/,{timeout:15000});
    const threeImg=threeSurface.locator("img");
    await expect(threeImg).toBeVisible();
    await expect.poll(()=>threeImg.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
    await threeCard.click();
    await expect(frame.locator("[data-preview]")).toHaveAttribute("sandbox","");
    await expect(frame.locator("[data-preview-note]")).toContainText("Captura oficial del ejemplo Three.js");
    const threeDetail=frame.frameLocator("[data-preview]").getByRole("img",
      {name:"Captura oficial del ejemplo Three.js"});
    await expect(threeDetail).toBeVisible();
    await expect.poll(()=>threeDetail.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
    await frame.getByRole("button",{name:"Cerrar",exact:true}).click();
    report.scenarios.push({browser:"Pinned real Three.js screenshot on card and detail",
      width,status:"passed",sourceMatched:true,static:true,noRemoteJS:true});
    // React thumbnails are screenshots of previously compiled original
    // components. They must load on the CARD and DETAIL, without any React JS.
    const reactCard=frame.locator('[data-resource-id="magicui:android"]');
    const reactThumb=frame.locator('[data-resource-id="magicui:android"] + .card-visual-surface img');
    await reactCard.scrollIntoViewIfNeeded();
    await expect(reactThumb).toBeVisible({timeout:15000});
    await expect.poll(()=>reactThumb.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
    await expect(frame.locator('[data-resource-id="magicui:android"] + .card-visual-surface'))
      .toHaveClass(/is-react-preview/);
    await reactCard.click();
    await expect(frame.locator("[data-preview]")).toHaveAttribute("sandbox","");
    await expect(frame.locator("[data-preview-note]")).toContainText("estática");
    const reactDetail=frame.frameLocator("[data-preview]").getByRole("img",
      {name:"Captura real del componente React compilado"});
    await expect(reactDetail).toBeVisible();
    await expect.poll(()=>reactDetail.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
    await frame.getByRole("button",{name:"Cerrar",exact:true}).click();
    report.scenarios.push({browser:"real audited React screenshot on card and detail",
      width,status:"passed",compiled:true,thumbnailLoaded:true,noReactExecution:true});
    // Explicit quick preview uses the real HTML/CSS in a sandboxed, network-
    // isolated frame, never auto-fetches 48 card details, and can be closed.
    const spinnerCard=frame.locator('[data-quick-preview-id="'+spinkit.id+'"]');
    await expect(spinnerCard).toHaveCount(1);
    // Every card starts with a visual; visible supported cards automatically load real CSS.
    await expect(frame.locator('[data-resource-id="magicui:reference"] + .card-visual-surface [data-visual-schematic]')).toHaveCount(1);
    const autoSample=frame.locator('[data-auto-preview-id="'+css.id+'"]');
    await autoSample.scrollIntoViewIfNeeded();
    await expect(autoSample.locator("iframe")).toHaveCount(1, {timeout:15000});
    await expect(frame.frameLocator('[data-auto-preview-id="'+css.id+'"] iframe').locator("button.card")).toBeVisible();
    await expect(frame.locator('[data-auto-preview-id="'+css.id+'"] iframe')).toHaveAttribute("sandbox","");

    await spinnerCard.click();
    await expect(frame.frameLocator('[data-quick-preview-id="'+spinkit.id+'"] + [data-quick-preview-panel] iframe').locator(".sk-plane")).toBeVisible();
    await spinnerCard.click();
    const previewTrigger=frame.locator('[data-quick-preview-id="'+css.id+'"]');
    await expect(previewTrigger).toHaveCount(1);
    await expect(frame.locator('[data-quick-preview-id="magicui:reference"]')).toHaveCount(0);
    await expect(previewTrigger).toHaveAttribute("aria-expanded","false");
    await previewTrigger.click();
    await expect(previewTrigger).toHaveAttribute("aria-expanded","true");
    const peekPanel=frame.locator('[data-quick-preview-id="'+css.id+'"] + [data-quick-preview-panel]');
    await expect(peekPanel).toBeVisible();
    const peekFrame=peekPanel.locator("iframe");
    await expect(peekFrame).toHaveAttribute("sandbox","");
    await expect(peekFrame).toHaveAttribute("referrerpolicy","no-referrer");
    await expect(peekFrame).toHaveAttribute("srcdoc",/Content-Security-Policy/);
    await expect(peekFrame).toHaveAttribute("srcdoc",/default-src 'none'/);
    await expect(frame.frameLocator('[data-quick-preview-id="'+css.id+'"] + [data-quick-preview-panel] iframe').locator("button.card")).toBeVisible();
    await expect(frame.frameLocator('[data-quick-preview-id="'+css.id+'"] + [data-quick-preview-panel] iframe').locator("button.card")).toHaveText("Prueba");
    await previewTrigger.click();
    await expect(previewTrigger).toHaveAttribute("aria-expanded","false");
    await expect(peekPanel).toBeHidden();
    await expect(peekPanel.locator("iframe")).toHaveCount(0);
    report.scenarios.push({browser:"real CSS component quick preview with offline sandbox",
      width,status:"passed",onDemand:true,noExternalResources:true});
    if (width === 1280) {
      // A reload creates a brand new Vault client, then the entire network is
      // blocked. The catalog and an already opened Uiverse shard must work.
      simulatedOffline = true;
      try {
        await page.reload({waitUntil:"domcontentloaded"});
        await frame.locator('[data-resource-id="smoke:icon"]').waitFor();
        await expect(frame.locator('[data-status]')).toContainText("Sin conexión");
        const storedPeek = frame.locator('[data-quick-preview-id="'+css.id+'"]');
        await storedPeek.click();
        await expect(frame.frameLocator('[data-quick-preview-id="'+css.id+'"] + [data-quick-preview-panel] iframe')
          .locator("button.card")).toBeVisible();
        await storedPeek.click();
        await expect(frame.locator('[data-quick-preview-panel] iframe')).toHaveCount(0);
      } finally { simulatedOffline = false; }
      await frame.getByRole("button",{name:"Actualizar índice",exact:true}).click();
      await expect(frame.locator('[data-status]')).toContainText("Índice verificado");
      report.scenarios.push({browser:"verified Vault offline after reload",
        width,status:"passed",persistentBrowse:true,persistentUiverseShard:true});
    }
    // Show and filter genuinely insertable vs source-only resources, without
    // requesting the source archive for any result card.
    const useFilter=frame.getByLabel("Uso en NagWeb",{exact:true});
    await expect(frame.locator('[data-resource-id="magicui:reference"] [data-editor-use-label="code"]')).toBeVisible();
    await expect(frame.locator('[data-resource-id="smoke:icon"] [data-editor-use-label="available"]')).toBeVisible();
    await useFilter.selectOption("available");
    await expect(frame.locator('[data-resource-id="smoke:icon"]')).toBeVisible();
    await expect(frame.locator('[data-resource-id="magicui:reference"]')).toHaveCount(0);
    await useFilter.selectOption("code");
    await expect(frame.locator('[data-resource-id="magicui:reference"]')).toBeVisible();
    await expect(frame.locator('[data-resource-id="smoke:icon"]')).toHaveCount(0);
    await frame.getByRole("button",{name:"Limpiar filtros",exact:true}).click();
    await expect(useFilter).toHaveValue("");
    report.scenarios.push({browser:"filter genuine native resources vs source-only",
      width,status:"passed",noFullLibraryFetch:true});
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
    // Stage 80: the designer can inspect responsive widths without changing
    // the HTML source, its customization or the running CSS animation.
    const viewportChoice=frame.getByLabel("Ancho de prueba",{exact:true});
    const previewStage=frame.locator("[data-preview-stage]");
    await viewportChoice.selectOption("320");
    const narrowWidth=await previewStage.evaluate(node=>node.getBoundingClientRect().width);
    assert.ok(narrowWidth>0 && narrowWidth<=321,
      "Mobile viewport must fit its panel without overflowing");
    await expect(frame.locator("[data-preview-width-actual]")).toContainText("px reales");
    assert.equal(await frame.locator("[data-preview]").getAttribute("srcdoc"),originalUiverseDoc,
      "Resizing preview must not reload Uiverse animation");
    await viewportChoice.selectOption("560");
    const tabletWidth=await previewStage.evaluate(node=>node.getBoundingClientRect().width);
    assert.ok(tabletWidth>=narrowWidth && tabletWidth<=561);
    assert.equal(await frame.locator("[data-preview]").getAttribute("srcdoc"),originalUiverseDoc);
    await viewportChoice.selectOption("custom");
    const customWidth=frame.getByLabel("Ancho personalizado (px)",{exact:true});
    await expect(customWidth).toBeVisible();
    await customWidth.fill("240");
    const customNarrow=await previewStage.evaluate(node=>node.getBoundingClientRect().width);
    assert.ok(customNarrow>0 && customNarrow<=241,"Custom slot must honor requested narrow width");
    await customWidth.fill("425");
    const customWide=await previewStage.evaluate(node=>node.getBoundingClientRect().width);
    assert.ok(customWide>=customNarrow && customWide<=426,
      "Custom width must be capped by actual preview panel space");
    assert.equal(await frame.locator("[data-preview]").getAttribute("srcdoc"),originalUiverseDoc,
      "Custom width changes must not reload HTML/CSS animations");
    assert.match(await frame.locator("body").evaluate(()=>
      sessionStorage.getItem("nagweb:resource-browser:preview-width:v1")),
      /"mode":"custom","custom":425/);
    await viewportChoice.selectOption("full");
    await expect(customWidth).toBeHidden();
    assert.equal(await frame.locator("[data-preview]").getAttribute("srcdoc"),originalUiverseDoc);
    report.scenarios.push({browser:"responsive resource preview",width,status:"passed",
      narrowWidth,tabletWidth,customNarrow,customWide,sourceUnchanged:true,
      animationNotRestarted:true,tabPreferenceSaved:true});
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
  page.on("pageerror", error => report.errors.push(`Editor: ${error.stack || error.message}`));
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
  // Stage 81: a fixed-width third-party component should fit the frame when
  // the designer places it in a much narrower responsive slot.
  const sandboxFrame=page.locator('iframe[data-html-stage-preview]');
  const sandboxSource=await sandboxFrame.getAttribute("srcdoc");
  assert.match(sandboxSource,/name="viewport" content="width=device-width,initial-scale=1"/);
  await sandboxFrame.evaluate(node=>{node.style.width="56px";});
  // Scrollbar width varies between OS/browser environments. Compare against
  // the actual narrow slot instead of requiring an exact CSS pixel count.
  await expect.poll(() => isolatedCard.evaluate(node =>
    node.getBoundingClientRect().width)).toBeLessThan(80);
  const narrowCardWidth=await isolatedCard.evaluate(node=>node.getBoundingClientRect().width);
  assert.ok(narrowCardWidth>0 && narrowCardWidth<=56,
    "The card must fit the narrow sandbox slot, scrollbar included");
  await sandboxFrame.evaluate(node=>{node.style.width="180px";});
  await expect(isolatedCard).toHaveCSS("width","80px");
  assert.equal(await sandboxFrame.getAttribute("sandbox"),"",
    "Responsive behavior must not weaken the iframe sandbox");
  await sandboxFrame.evaluate(node => node.remove());
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
  const canvasShortcutElement = await page.evaluate(id =>
    structuredClone(sec().elements.find(e=>e.id===id)),inserted.element.id);
  // On Windows the canvas SVG can be visible before the outer preview load
  // handler has cleared its editing readiness guard. Verify readiness first,
  // then remove selection to test that dblclick selects the SVG itself.
  await page.evaluate(id => {
    selection = [id]; curEl = sec().elements.findIndex(e => e.id === id);
    secFocus = false; renderPane();
  }, inserted.element.id);
  await expect(page.getByRole("button", {
    name: "Personalizar ícono seleccionado", exact: true
  })).toBeEnabled();
  await page.evaluate(() => { selection = []; curEl = -1; secFocus = false; });
  // RenderPane can schedule a new preview document after the toolbar is
  // enabled. Wait for bindings on the CURRENT srcdoc before interacting.
  // Use a real Chromium double-click, not a synthesized DOM event that can
  // target an old iframe document on Windows.
  await expect(page.frameLocator("#preview").locator('html[data-nagweb-resource-edit-ready="1"]'))
    .toBeAttached();
  // A bound document may still be in its first layout pass. The native
  // resource edit command deliberately refuses stale vector dimensions.
  // Ensure the current canvas has measurable geometry BEFORE the gesture.
  await expect.poll(()=>page.evaluate(id=>{
    const element=sec().elements.find(e=>e.id===id);
    const doc=preview.contentDocument;
    const node=doc?.querySelector('[data-id="'+id+'"]');
    if(!element||!node||doc?.readyState==="loading" ||
       node.closest(".sc")?.dataset.id!==sec()?.id)return false;
    const width=Number.parseFloat(doc.defaultView.getComputedStyle(node).width);
    return node.getClientRects().length>0&&width>0&&
      Math.abs(Number(node.dataset.w)-vget(element,"w"))<.001 &&
      Math.abs(doc.documentElement.clientWidth-frameW())<=1;
  },inserted.element.id),{timeout:15000}).toBe(true);
  const svgClickTarget=page.frameLocator("#preview").locator(`[data-id="${inserted.element.id}"] svg`);
  await expect(svgClickTarget).toBeVisible();
  await svgClickTarget.dblclick();
  await expect(page.getByRole("dialog", { name: "Biblioteca de recursos", exact: true }))
    .toBeVisible({timeout:10000});
  // A pure double-click must not create edit snapshots or round the
  // selected element's geometry. Real drags still create undo history.
  const gestureHistory=await page.evaluate(() => history.length);
  assert.equal(gestureHistory,canvasShortcutHistory,
    "Selecting a resource with double-click must not add undo history");
  assert.deepEqual(await page.evaluate(id =>
    structuredClone(sec().elements.find(e=>e.id===id)),inserted.element.id),
    canvasShortcutElement,"A real SVG double-click must preserve the inserted object");
  const resourceFrameUrl = await page.locator('iframe[title="Biblioteca de recursos de NagWeb"]').getAttribute("src");
  assert.equal(new URL(resourceFrameUrl, "http://localhost").searchParams.get("editResource"), icon.id);
  assert.equal(await page.evaluate(() => selection[0]), inserted.element.id);
  await page.getByRole("button", { name: "Volver al editor", exact: true }).click();
  assert.equal(await page.evaluate(() => history.length), gestureHistory,
    "Closing SVG customization must not add undo history");
  // The SVG toolbar only enables the shortcut once the selected vector's
  // pixels are measurable after a preview-frame reload. A .focus() alone
  // can race the asynchronous iframe readiness check.
  const editShortcutButton = page.getByRole("button", {
    name: "Personalizar ícono seleccionado", exact: true
  });
  await expect(editShortcutButton).toBeEnabled();
  // A previously closed dialog can trigger a new preview iframe render.
  // Do not simulate the next user click until the SAME selected vector is
  // measurable in the current canvas. This preserves the real click contract.
  await expect.poll(()=>page.evaluate(id=>{
    if(selection.length!==1||selection[0]!==id)return false;
    const element=sec().elements.find(e=>e.id===id);
    const doc=preview.contentDocument;
    const node=doc && [...doc.querySelectorAll(".el[data-id]")].find(n=>n.dataset.id===id);
    if(!element||!node || doc.readyState==="loading" ||
       doc.documentElement.clientWidth!==frameW() ||
       node.closest(".sc")?.dataset.id!==sec().id ||
       Number(node.dataset.w)!==vget(element,"w"))return false;
    const w=Number.parseFloat(doc.defaultView.getComputedStyle(node).width);
    return w>0&&node.getClientRects().length>0;
  },inserted.element.id),{timeout:12000}).toBe(true);
  await expect(editShortcutButton).toBeEnabled();
  // Windows CI may reserve Alt+Enter at the OS/Chromium level, even
  // when injecting a synthetic event. Check the real clickable button on
  // Windows; test the shortcut on Linux, plus native Enter on both below.
  await editShortcutButton.focus();
  if(process.platform==="win32") {
    await editShortcutButton.click();
  } else {
    await editShortcutButton.dispatchEvent("keydown",{
      key:"Enter",code:"Enter",altKey:true,bubbles:true,cancelable:true
    });
  }
  await expect(page.getByRole("dialog", { name: "Biblioteca de recursos", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Volver al editor", exact: true }).click();
  // Native Enter is the accessible fallback when the OS reserves Alt+Enter.
  await editShortcutButton.focus();
  await editShortcutButton.press("Enter");
  await expect(page.getByRole("dialog", { name: "Biblioteca de recursos", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Volver al editor", exact: true }).click();
  assert.equal(await page.evaluate(() => history.length), gestureHistory,
    "Opening and cancelling customization must not add history beyond normal canvas selection");
  assert.equal(await page.evaluate(() => sec().elements.length), 1);
  report.scenarios.push({ editor: "direct canvas SVG customization", doubleClick: true,
    keyboard: process.platform==="win32" ? "Alt+Enter handler and native Enter" : "Alt+Enter and native Enter",
    preservesElement:true,noCustomizationUndo:true,canvasClickSnapshots:gestureHistory-canvasShortcutHistory });
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
  await page.evaluate(async id => {
    // refresh() debounces the iframe render for 480ms. Waiting only for an
    // enabled toolbar button can click during the document swap, before the
    // current vector's actual dimensions can be measured. Follow the iframe
    // load event after scheduling the refresh, as a real editor interaction
    // needs its selected vector to be ready.
    const loaded = new Promise((resolve,reject) => {
      const watchdog = setTimeout(() => reject(new Error(
        "The editor preview did not finish rendering after refreshing the SVG")), 12000);
      preview.addEventListener("load", () => {
        clearTimeout(watchdog);
        resolve();
      }, {once:true});
    });
    const e = sec().elements.find(e => e.id === id);
    e.x = 17; e.y = 25; e.name = "Nombre propio"; e.anim = "fade";
    selection = [e.id]; curEl = sec().elements.indexOf(e); secFocus = false;
    refresh();
    await loaded;
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
  // The preview iframe is regenerated after reload and view switches. A
  // transient destroyed execution context is not a measured width; poll until
  // the new document exists, while propagating all non-navigation errors.
  const renderedWidth = async () => {
    try {
      return await gridVector.evaluate(n => Number.parseFloat(getComputedStyle(n).width));
    } catch (error) {
      if (/Execution context was destroyed|Frame was detached|Cannot find context/i.test(
        error?.message || "")) return NaN;
      throw error;
    }
  };
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
  // The desktop model stores a recalculated percentage, not the former
  // mobile 20%. Wait for the regenerated iframe and assert its actual width.
  await expect(gridVector).toBeVisible();
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
      await expect.poll(async () => {
        try { return await sandbox.evaluate(node => node.contentDocument === null); }
        catch (error) {
          if (/Execution context was destroyed|Frame was detached|Cannot find context/i.test(error.message)) return false;
          throw error;
        }
      }).toBe(true);
    };
    await checkWidth(false);
    await checkWidth(true);
    await page.reload();
    await checkWidth(false);
    await checkWidth(true);
    assert.equal(await page.evaluate(id => sec().elements.find(e => e.id === id).nwResource.id, id), css.id);
    report.scenarios.push({ editor: "Uiverse insertion across native layouts", layout, mobileInsertion: layout === "horizontal", desktopMaxPx: 320, mobileMaxPx: 260, cappedAt85Percent: true, isolated: true, reload: true });
  }
  // SpinKit uses the same verified, sandboxed native HTML insertion as Uiverse.
  // Keep CSS custom properties, editing, persistence and export independent.
  await page.evaluate(() => {
    Object.assign(sec(),{layout:"free",elements:[]});
    selection=[];curEl=-1;secFocus=true;refresh();
  });
  await page.locator("#btn-view-desk").click();
  await page.getByRole("button",{name:"Biblioteca de recursos",exact:true}).click();
  if (await libraryFrame.locator('[data-detail]').evaluate(node=>node.open))
    await libraryFrame.getByRole("button",{name:"Cerrar",exact:true}).click();
  await libraryFrame.locator('[data-resource-id="'+spinkit.id+'"]').click();
  await libraryFrame.locator('[data-customize]').waitFor({state:"visible"});
  const spinSizeGroup=libraryFrame.locator('details[data-category="size"]');
  if (!await spinSizeGroup.evaluate(node=>node.open)) await spinSizeGroup.locator("summary").click();
  const spinColorGroup=libraryFrame.locator('details[data-category="color"]');
  if (!await spinColorGroup.evaluate(node=>node.open)) await spinColorGroup.locator("summary").click();
  await libraryFrame.getByLabel("Color",{exact:true}).fill("#3366aa");
  const spinSizeInput=libraryFrame.getByLabel("Tamaño",{exact:true});
  await spinSizeInput.focus();
  await spinSizeInput.press("Home");
  for (let value=8;value<72;value++) await spinSizeInput.press("ArrowRight");
  await expect(libraryFrame.getByRole("button",{name:"Aplicar en NagWeb",exact:true})).toBeEnabled();
  await libraryFrame.getByRole("button",{name:"Aplicar en NagWeb",exact:true}).click();
  await expect(libraryFrame.locator("[data-apply-status]")).toContainText("insertado y guardado");
  const spinId=await page.evaluate(()=>selection[0]);
  assert.equal(await page.evaluate(id=>sec().elements.find(e=>e.id===id).nwResource.kind,spinId),"spinkit-html");
  assert.equal(await page.evaluate(id=>sec().elements.find(e=>e.id===id).nwResource.provider,spinId),"spinkit");
  await page.getByRole("button",{name:"Volver al editor",exact:true}).click();
  const spinFrame=page.frameLocator("#preview").locator('[data-id="'+spinId+'"] iframe.emb-sand');
  await expect(spinFrame).toHaveAttribute("sandbox","");
  await expect(spinFrame).toHaveAttribute("srcdoc",/--sk-size:72px;--sk-color:#3366aa/);
  await expect(page.frameLocator("#preview").frameLocator('[data-id="'+spinId+'"] iframe.emb-sand').locator(".sk-plane")).toHaveCSS("background-color","rgb(51, 102, 170)");
  await expect(page.getByRole("button",{name:"Personalizar componente SpinKit seleccionado",exact:true})).toBeEnabled();
  await page.getByRole("button",{name:"Personalizar componente SpinKit seleccionado",exact:true}).click();
  await libraryFrame.locator('[data-detail]').waitFor({state:"visible"});
  await expect(libraryFrame.getByLabel("Color",{exact:true})).toHaveValue("#3366aa");
  await libraryFrame.getByLabel("Color",{exact:true}).fill("#bb2244");
  await libraryFrame.getByRole("button",{name:"Guardar cambios en el componente",exact:true}).click();
  await expect(libraryFrame.locator("[data-apply-status]")).toContainText("guardados");
  await page.getByRole("button",{name:"Volver al editor",exact:true}).click();
  const updated=await page.evaluate(id=>sec().elements.find(e=>e.id===id),spinId);
  assert.equal(updated.nwResource.values.color,"#bb2244");
  assert.match(updated.code,/--sk-size:72px;--sk-color:#bb2244/);
  const spinExport=await page.evaluate(()=>generateSite(flattenPage(page()),false,true,false));
  assert.match(spinExport,/--sk-size:72px;--sk-color:#bb2244/);
  await page.reload();
  assert.equal(await page.evaluate(id=>sec().elements.find(e=>e.id===id).nwResource.values.color,spinId),"#bb2244");
  await expect(page.frameLocator("#preview").locator('[data-id="'+spinId+'"] iframe.emb-sand')).toHaveAttribute("sandbox","");
  report.scenarios.push({editor:"SpinKit native HTML/CSS insert, edit, save, export, reload",
    status:"passed",provider:"spinkit",sandbox:true,cssVariables:true,persistence:true,export:true});
  // Magic.css animates an existing heading without replacing it or changing
  // the outer element's free-canvas geometry. The source CSS is bundled locally.
  await page.evaluate(() => {
    Object.assign(sec(),{layout:"free",elements:[mkEl("heading",{
      name:"Texto animable",text:"Texto con Magic.css",size:"xl",
      x:50,y:40,w:60,rot:5,anim:"none"
    })]});
    selection=[sec().elements[0].id];curEl=0;secFocus=false;
    refresh();
  });
  await page.getByRole("button",{name:"Biblioteca de recursos",exact:true}).click();
  if(await libraryFrame.locator("[data-detail]").evaluate(node=>node.open))
    await libraryFrame.getByRole("button",{name:"Cerrar",exact:true}).click();
  const magicTile=libraryFrame.locator('[data-resource-id="'+magicCss.id+'"]');
  await expect(magicTile.locator('[data-editor-use-label="available"]')).toBeVisible();
  await magicTile.click();
  await expect(libraryFrame.getByRole("button",{name:"Aplicar animación al elemento",exact:true})).toBeEnabled();
  const initialState=await page.evaluate(()=>({
    id:sec().elements[0].id,x:sec().elements[0].x,rot:sec().elements[0].rot,w:sec().elements[0].w,
    historyLength:history.length
  }));
  await libraryFrame.getByRole("button",{name:"Aplicar animación al elemento",exact:true}).click();
  await expect(libraryFrame.locator("[data-apply-status]")).toContainText("aplicada y guardada");
  await page.getByRole("button",{name:"Volver al editor",exact:true}).click();
  const magicHeading=await page.evaluate(()=>sec().elements[0]);
  assert.equal(magicHeading.id,initialState.id);
  assert.equal(magicHeading.x,initialState.x);
  assert.equal(magicHeading.rot,initialState.rot);
  assert.equal(magicHeading.w,initialState.w);
  assert.equal(magicHeading.nwMagicCss.id,magicCss.id);
  assert.equal(await page.evaluate(()=>history.length),initialState.historyLength+1);
  const inner=page.frameLocator("#preview").locator('[data-id="'+initialState.id+'"] .nw-magic-inner');
  await expect(inner).toHaveClass(/puffIn/);
  const magicExport=await page.evaluate(()=>generateSite(flattenPage(page()),false,true,false));
  assert.match(magicExport,/@keyframes puffIn/);
  assert.match(magicExport,/class="nw-magic-inner magictime puffIn"/);
  assert.match(magicExport,/prefers-reduced-motion:reduce/);
  await expect(page.getByRole("button",{name:"Personalizar animación seleccionada",exact:true})).toBeEnabled();
  await page.getByRole("button",{name:"Personalizar animación seleccionada",exact:true}).click();
  await libraryFrame.locator("[data-detail]").waitFor({state:"visible"});
  const magicDuration=libraryFrame.getByLabel("Duración",{exact:true});
  const timingGroup=libraryFrame.locator("details").filter({has:magicDuration});
  if(!await timingGroup.evaluate(node=>node.open))await timingGroup.locator("summary").click();
  await magicDuration.focus();
  await magicDuration.press("Home");
  for(let i=1;i<20;i++)await magicDuration.press("ArrowRight");
  await expect(magicDuration).toHaveValue("2");
  await libraryFrame.getByRole("button",{name:"Guardar animación",exact:true}).click();
  await expect(libraryFrame.locator("[data-apply-status]")).toContainText("actualizada y guardada");
  await page.getByRole("button",{name:"Volver al editor",exact:true}).click();
  assert.equal(await page.evaluate(()=>sec().elements[0].nwMagicCss.values.duration),2);
  assert.equal(await page.evaluate(()=>sec().elements.length),1);
  await page.reload();
  assert.equal(await page.evaluate(()=>sec().elements[0].nwMagicCss.values.duration),2);
  await expect(page.frameLocator("#preview").locator('[data-id="'+initialState.id+'"] .nw-magic-inner')).toHaveCSS("animation-duration","2s");
  report.scenarios.push({editor:"Magic.css on existing text: apply, edit, export, reload, geometry",
    status:"passed",noNewElement:true,portableCss:true,history:true,reducedMotion:true});
  // Stage 96: images and vectors share the verified Magic.css effect path.
  for(const type of ["image","vector"]){
    await page.evaluate(type=>{
      if(type==="image")project.assets.images.push({id:"stage96-asset",name:"Imagen",
        data:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 4'%3E%3Crect width='4' height='4' fill='red'/%3E%3C/svg%3E"});
      const options=type==="image"?{assetId:"stage96-asset",alt:"Prueba"}
        :{kind:"path",d:"M0 0L24 24",pW:24,pH:24,stroke:"#335577"};
      Object.assign(sec(),{layout:"free",elements:[mkEl(type,{...options,x:40,y:45,w:35,rot:7,anim:"none"})]});
      selection=[sec().elements[0].id];curEl=0;secFocus=false;refresh();
    },type);
    const before=await page.evaluate(()=>structuredClone(sec().elements[0]));
    await page.getByRole("button",{name:"Biblioteca de recursos",exact:true}).click();
    if(await libraryFrame.locator("[data-detail]").evaluate(n=>n.open))
      await libraryFrame.getByRole("button",{name:"Cerrar",exact:true}).click();
    await libraryFrame.locator('[data-resource-id="'+magicCss.id+'"]').click();
    await expect(libraryFrame.getByRole("button",{name:"Aplicar animación al elemento",exact:true})).toBeEnabled();
    await libraryFrame.getByRole("button",{name:"Aplicar animación al elemento",exact:true}).click();
    await expect(libraryFrame.locator("[data-apply-status]")).toContainText("aplicada y guardada");
    await page.getByRole("button",{name:"Volver al editor",exact:true}).click();
    const after=await page.evaluate(()=>structuredClone(sec().elements[0]));
    for(const key of ["id","x","y","w","rot"])assert.equal(after[key],before[key]);
    assert.equal(after.nwMagicCss.id,magicCss.id);
    const outer=page.frameLocator("#preview").locator('[data-id="'+after.id+'"]');
    await expect(outer.locator(".nw-magic-inner")).toHaveClass(/puffIn/);
    await expect(outer.locator(type==="image"?"img.im-base":"svg.vec-svg")).toBeVisible();
    const exported=await page.evaluate(()=>generateSite(flattenPage(page()),false,true,false));
    assert.match(exported,/nw-magic-inner magictime puffIn/);
    assert.match(exported,/@keyframes puffIn/, "Export must include the stylesheet, not only the animation class");
    await page.reload();
    assert.equal(await page.evaluate(()=>sec().elements[0].nwMagicCss.id),magicCss.id);
    report.scenarios.push({editor:"Magic.css on "+type,status:"passed",geometry:true,export:true,reload:true});
  }
  // Stage 97: new SVG drawings and videos use the same Magic.css
  // application path, preserving the original object and its geometry.
  for(const type of ["svgdraw","video"]){
    await page.evaluate(type=>{
      const options=type==="svgdraw"
        ? {svgCode:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 2L22 22"/></svg>',
            color:"#335577",strokeWidth:3}
        : {url:"data:video/mp4;base64,AAAA",muted:true,loop:false};
      Object.assign(sec(),{layout:"free",elements:[mkEl(type,{...options,
        x:43,y:37,w:38,rot:8,anim:"none"})]});
      selection=[sec().elements[0].id];curEl=0;secFocus=false;refresh();
    },type);
    const before=await page.evaluate(()=>structuredClone(sec().elements[0]));
    await page.getByRole("button",{name:"Biblioteca de recursos",exact:true}).click();
    if(await libraryFrame.locator("[data-detail]").evaluate(n=>n.open))
      await libraryFrame.getByRole("button",{name:"Cerrar",exact:true}).click();
    await libraryFrame.locator('[data-resource-id="'+magicCss.id+'"]').click();
    await expect(libraryFrame.getByRole("button",{name:"Aplicar animación al elemento",exact:true})).toBeEnabled();
    await libraryFrame.getByRole("button",{name:"Aplicar animación al elemento",exact:true}).click();
    await expect(libraryFrame.locator("[data-apply-status]")).toContainText("aplicada y guardada");
    await page.getByRole("button",{name:"Volver al editor",exact:true}).click();
    const after=await page.evaluate(()=>structuredClone(sec().elements[0]));
    for(const key of ["id","x","y","w","rot"])assert.equal(after[key],before[key]);
    assert.equal(after.nwMagicCss.id,magicCss.id);
    const outer=page.frameLocator("#preview").locator('[data-id="'+after.id+'"]');
    await expect(outer.locator(".nw-magic-inner")).toHaveClass(/puffIn/);
    await expect(outer.locator(type==="svgdraw"?"svg.sd-inner":"video")).toBeAttached();
    const exported=await page.evaluate(()=>generateSite(flattenPage(page()),false,true,false));
    assert.match(exported,/nw-magic-inner magictime puffIn/);
    assert.match(exported,/@keyframes puffIn/, "Export must include the stylesheet, not only the animation class");
    await page.reload();
    assert.equal(await page.evaluate(()=>sec().elements[0].nwMagicCss.id),magicCss.id);
    report.scenarios.push({editor:"Magic.css on "+type,status:"passed",
      geometry:true,export:true,reload:true});
  }
  // A mixed-type selection shares one effect, one undo step and one
  // persisted operation; unrelated objects remain exactly as they were.
  await page.evaluate(()=>{
    const heading=mkEl("heading",{text:"Selección grupal",x:15,y:23,w:33,rot:4,anim:"none"});
    const drawing=mkEl("svgdraw",{svgCode:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 12L22 12"/></svg>',
      color:"#224466",strokeWidth:2,x:46,y:47,w:31,rot:9,anim:"none"});
    const unrelated=mkEl("button",{text:"No seleccionado",x:78,y:72,w:20,anim:"none"});
    Object.assign(sec(),{layout:"free",elements:[heading,drawing,unrelated]});
    selection=[heading.id,drawing.id];curEl=0;secFocus=false;refresh();
  });
  const multiBefore=await page.evaluate(()=>({
    ids:sec().elements.map(e=>e.id),
    geometry:sec().elements.map(e=>[e.x,e.y,e.w,e.rot]),
    history:history.length
  }));
  await page.getByRole("button",{name:"Biblioteca de recursos",exact:true}).click();
  if(await libraryFrame.locator("[data-detail]").evaluate(n=>n.open))
    await libraryFrame.getByRole("button",{name:"Cerrar",exact:true}).click();
  await libraryFrame.locator('[data-resource-id="'+magicCss.id+'"]').click();
  await expect(libraryFrame.getByRole("button",{name:"Aplicar animación al elemento",exact:true})).toBeEnabled();
  await libraryFrame.getByRole("button",{name:"Aplicar animación al elemento",exact:true}).click();
  await expect(libraryFrame.locator("[data-apply-status]")).toContainText("guardada en 2 elementos");
  await page.getByRole("button",{name:"Volver al editor",exact:true}).click();
  const multiAfter=await page.evaluate(()=>({
    ids:sec().elements.map(e=>e.id),
    geometry:sec().elements.map(e=>[e.x,e.y,e.w,e.rot]),
    effects:sec().elements.map(e=>e.nwMagicCss?.id||null),
    selected:[...selection],
    history:history.length
  }));
  assert.deepEqual(multiAfter.ids,multiBefore.ids);
  assert.deepEqual(multiAfter.geometry,multiBefore.geometry);
  assert.deepEqual(multiAfter.effects,[magicCss.id,magicCss.id,null]);
  assert.deepEqual(multiAfter.selected,multiBefore.ids.slice(0,2));
  assert.equal(multiAfter.history,multiBefore.history+1);
  const multiExport=await page.evaluate(()=>generateSite(flattenPage(page()),false,true,false));
  assert.equal((multiExport.match(/class="nw-magic-inner magictime puffIn"/g)||[]).length,2);
  await page.locator("#btn-undo").click();
  assert.deepEqual(await page.evaluate(()=>sec().elements.map(e=>e.nwMagicCss?.id||null)),[null,null,null]);
  await page.locator("#btn-redo").click();
  assert.deepEqual(await page.evaluate(()=>sec().elements.map(e=>e.nwMagicCss?.id||null)),
    [magicCss.id,magicCss.id,null]);
  await page.reload();
  assert.deepEqual(await page.evaluate(()=>sec().elements.map(e=>e.nwMagicCss?.id||null)),
    [magicCss.id,magicCss.id,null]);
  // Removal of a multi-selection must also be one undoable change.
  await page.evaluate(ids=>{
    selection=ids;curEl=0;secFocus=false;refresh();
  },multiBefore.ids.slice(0,2));
  const clearMultiple=page.getByRole("button",{name:"Quitar animación seleccionada",exact:true});
  await expect(clearMultiple).toBeEnabled();
  const multiClearHistory=await page.evaluate(()=>history.length);
  await clearMultiple.click();
  assert.deepEqual(await page.evaluate(()=>sec().elements.map(e=>e.nwMagicCss?.id||null)),[null,null,null]);
  assert.equal(await page.evaluate(()=>history.length),multiClearHistory+1);
  await page.locator("#btn-undo").click();
  assert.deepEqual(await page.evaluate(()=>sec().elements.map(e=>e.nwMagicCss?.id||null)),
    [magicCss.id,magicCss.id,null]);
  await page.locator("#btn-redo").click();
  assert.deepEqual(await page.evaluate(()=>sec().elements.map(e=>e.nwMagicCss?.id||null)),[null,null,null]);
  await page.reload();
  assert.deepEqual(await page.evaluate(()=>sec().elements.map(e=>e.nwMagicCss?.id||null)),[null,null,null]);
  report.scenarios.push({editor:"Magic.css multi-selection across heading and SVG",
    status:"passed",atomicHistory:true,undoRedo:true,persistence:true,export:true,noCollateral:true});


  // AnimXYZ animates original content, not a placeholder box. Verify the
  // real NagWeb canvas, CSS computed by Chromium, persistence and export.
  await page.evaluate(()=>{
    Object.assign(sec(),{layout:"free",elements:[mkEl("heading",{
      name:"Texto con AnimXYZ",text:"Texto editable",size:"xl",
      x:46,y:43,w:58,rot:8,anim:"none"
    })]});
    selection=[sec().elements[0].id];curEl=0;secFocus=false;refresh();
  });
  const xyzBefore=await page.evaluate(()=>structuredClone(sec().elements[0]));
  await page.getByRole("button",{name:"Biblioteca de recursos",exact:true}).click();
  if(await libraryFrame.locator("[data-detail]").evaluate(n=>n.open))
    await libraryFrame.getByRole("button",{name:"Cerrar",exact:true}).click();
  const xyzCard=libraryFrame.locator('[data-resource-id="'+animxyz.id+'"]');
  await expect(xyzCard.locator('[data-editor-use-label="available"]')).toBeVisible();
  await xyzCard.click();
  await expect(libraryFrame.getByRole("button",{name:"Aplicar animación al elemento",exact:true})).toBeEnabled();
  await libraryFrame.getByRole("button",{name:"Aplicar animación al elemento",exact:true}).click();
  await expect(libraryFrame.locator("[data-apply-status]")).toContainText("aplicada y guardada");
  await page.getByRole("button",{name:"Volver al editor",exact:true}).click();
  const xyzAfter=await page.evaluate(()=>structuredClone(sec().elements[0]));
  for(const key of ["id","text","x","y","w","rot"])assert.equal(xyzAfter[key],xyzBefore[key]);
  assert.equal(xyzAfter.nwMagicCss.sourceResourceId,animxyz.id);
  assert.equal(xyzAfter.nwMagicCss.id,"magic-css:nagweb-animxyz-flip-right");
  const xyzInner=page.frameLocator("#preview").locator('[data-id="'+xyzAfter.id+'"] .nw-magic-inner');
  await expect(xyzInner).toHaveCSS("animation-name","nwAnimxyzflip_rightFrames");
  const xyzExport=await page.evaluate(()=>generateSite(flattenPage(page()),false,true,false));
  assert.match(xyzExport,/@keyframes nwAnimxyzflip_rightFrames/);
  assert.match(xyzExport,/rotateY\(90deg\)/);
  assert.match(xyzExport,/prefers-reduced-motion:reduce/);
  await page.evaluate(()=>{sec().elements[0].text="Puedo editar el texto";refresh();});
  await expect(page.frameLocator("#preview").locator('[data-id="'+xyzAfter.id+'"]')).toContainText("Puedo editar el texto");
  await expect(page.getByRole("button",{name:"Personalizar animación seleccionada",exact:true})).toBeEnabled();
  await page.getByRole("button",{name:"Personalizar animación seleccionada",exact:true}).click();
  await libraryFrame.locator("[data-detail]").waitFor({state:"visible"});
  await expect(libraryFrame.getByRole("button",{name:"Guardar animación",exact:true})).toBeEnabled();
  await libraryFrame.getByRole("button",{name:"Guardar animación",exact:true}).click();
  await expect(libraryFrame.locator("[data-apply-status]")).toContainText("actualizada y guardada");
  await page.getByRole("button",{name:"Volver al editor",exact:true}).click();
  await page.reload();
  assert.equal(await page.evaluate(()=>sec().elements[0].nwMagicCss.sourceResourceId),animxyz.id);
  assert.equal(await page.evaluate(()=>sec().elements[0].text),"Puedo editar el texto");
  assert.match(await page.evaluate(()=>generateSite(flattenPage(page()),false,true,false)),
    /@keyframes nwAnimxyzflip_rightFrames/);
  report.scenarios.push({editor:"AnimXYZ: apply motion, edit text and settings, export, reload",
    status:"passed",noPlaceholder:true,portableCss:true});
  // A previewable effect isn't applicable to an empty selection.
  await page.evaluate(()=>{selection=[];curEl=-1;refresh();});
  await page.getByRole("button",{name:"Biblioteca de recursos",exact:true}).click();
  if(await libraryFrame.locator("[data-detail]").evaluate(n=>n.open))
    await libraryFrame.getByRole("button",{name:"Cerrar",exact:true}).click();
  await libraryFrame.locator('[data-resource-id="'+animxyz.id+'"]').click();
  await expect(libraryFrame.getByRole("button",{name:"Aplicar animación al elemento",exact:true})).toBeDisabled();
  await expect(libraryFrame.locator("[data-apply-status]")).toContainText("Seleccioná un texto");
  await page.getByRole("button",{name:"Volver al editor",exact:true}).click();
  report.scenarios.push({editor:"AnimXYZ without selection: safe guidance instead of fake insertion",status:"passed"});


  // CSSShake: verified Vault CSS, apply, editable Hover/Constant and offline export.
  await page.evaluate(()=>{
    const title=mkEl("heading",{text:"CSSShake",x:42,y:35,w:44,rot:12,anim:"none"});
    sec().elements=[title];selection=[title.id];curEl=0;secFocus=false;refresh();
  });
  const shakeBefore=await page.evaluate(()=>structuredClone(sec().elements[0]));
  await page.getByRole("button",{name:"Biblioteca de recursos",exact:true}).click();
  if(await libraryFrame.locator("[data-detail]").evaluate(n=>n.open))
    await libraryFrame.getByRole("button",{name:"Cerrar",exact:true}).click();
  const shakeTile=libraryFrame.locator('[data-resource-id="'+csshake.id+'"]');
  await expect(shakeTile.locator('[data-editor-use-label="available"]')).toBeVisible();
  await shakeTile.click();
  await expect(libraryFrame.getByRole("button",{name:"Aplicar animación al elemento",exact:true})).toBeEnabled();
  await libraryFrame.getByRole("button",{name:"Aplicar animación al elemento",exact:true}).click();
  await expect(libraryFrame.locator("[data-apply-status]")).toContainText("aplicada y guardada");
  await page.getByRole("button",{name:"Volver al editor",exact:true}).click();
  const shakeAfter=await page.evaluate(()=>structuredClone(sec().elements[0]));
  for(const key of ["id","x","y","w","rot"])assert.equal(shakeAfter[key],shakeBefore[key]);
  assert.equal(shakeAfter.nwMagicCss.provider,"csshake");
  assert.equal(shakeAfter.nwMagicCss.values.trigger,"hover");
  const shakeAnimated=page.frameLocator("#preview").locator('[data-id="'+shakeAfter.id+'"] .nw-magic-inner');
  await expect(shakeAnimated).toHaveClass(/shake/);
  await shakeAnimated.hover();
  await expect(shakeAnimated).toHaveCSS("animation-name","shake");
  let shakeExport=await page.evaluate(()=>generateSite(flattenPage(page()),false,true,false));
  assert.match(shakeExport,/@keyframes shake/);
  assert.match(shakeExport,/class="nw-magic-inner shake"/);
  await page.getByRole("button",{name:"Personalizar animación seleccionada",exact:true}).click();
  await libraryFrame.locator("[data-detail]").waitFor({state:"visible"});
  await libraryFrame.getByLabel("Activación",{exact:true}).selectOption("constant");
  await libraryFrame.getByRole("button",{name:"Guardar animación",exact:true}).click();
  await expect(libraryFrame.locator("[data-apply-status]")).toContainText("actualizada y guardada");
  await page.getByRole("button",{name:"Volver al editor",exact:true}).click();
  assert.equal(await page.evaluate(()=>sec().elements[0].nwMagicCss.values.trigger),"constant");
  await expect(page.frameLocator("#preview").locator('[data-id="'+shakeAfter.id+'"] .shake-constant'))
    .toHaveCSS("animation-name","shake");
  shakeExport=await page.evaluate(()=>generateSite(flattenPage(page()),false,true,false));
  assert.match(shakeExport,/shake shake-constant/);
  await page.reload();
  assert.equal(await page.evaluate(()=>sec().elements[0].nwMagicCss.values.trigger),"constant");
  await page.evaluate(()=>{selection=[sec().elements[0].id];curEl=0;secFocus=false;refresh();});
  const shakeClear=page.getByRole("button",{name:"Quitar animación seleccionada",exact:true});
  await expect(shakeClear).toBeEnabled();
  await shakeClear.click();
  assert.equal(await page.evaluate(()=>sec().elements[0].nwMagicCss),undefined);
  await page.locator("#btn-undo").click();
  assert.equal(await page.evaluate(()=>sec().elements[0].nwMagicCss.provider),"csshake");
  report.scenarios.push({editor:"CSSShake native hover, constant, edit, export, reload and undo",
    status:"passed",portableCss:true,noNewElement:true,reducedMotion:true});
  // Removing an existing Magic.css effect never deletes the target object.
  // Playwright page.evaluate runs in the browser, so transfer fixture data
  // explicitly rather than referencing Node's module-scoped magicCss.
  const removalFixture={id:magicCss.id,provider:"magic-css",className:"puffIn",
    css:magicCss.artifacts.find(a=>a.role==="stylesheet").content,
    values:{duration:1,delay:0,easing:"ease",iterations:1},
    license:magicCss.license};
  await page.evaluate(fixture=>{
    const element=mkEl("heading",{text:"Efecto reversible",x:48,y:40,w:60,rot:6,anim:"none"});
    element.nwMagicCss=structuredClone(fixture);
    sec().elements=[element];selection=[element.id];curEl=0;secFocus=false;refresh();
  },removalFixture);
  const clearing=await page.evaluate(()=>({id:sec().elements[0].id,history:history.length}));
  const clearMagic=page.getByRole("button",{name:"Quitar animación seleccionada",exact:true});
  await expect(clearMagic).toBeEnabled();
  await clearMagic.click();
  assert.equal(await page.evaluate(()=>sec().elements[0].id),clearing.id);
  assert.equal(await page.evaluate(()=>sec().elements[0].nwMagicCss),undefined);
  assert.equal(await page.evaluate(()=>history.length),clearing.history+1);
  await expect(clearMagic).toBeDisabled();
  await page.locator("#btn-undo").click();
  assert.equal(await page.evaluate(()=>sec().elements[0].nwMagicCss.id),magicCss.id);
  await page.evaluate(()=>{selection=[sec().elements[0].id];curEl=0;secFocus=false;refresh();});
  await expect(clearMagic).toBeEnabled();
  await page.locator("#btn-redo").click();
  assert.equal(await page.evaluate(()=>sec().elements[0].nwMagicCss),undefined);
  await expect(clearMagic).toBeDisabled();
  await page.reload();
  assert.equal(await page.evaluate(()=>sec().elements[0].nwMagicCss),undefined);
  report.scenarios.push({editor:"Remove existing Magic.css without removing object",status:"passed",
    history:true,undoRedo:true,persistence:true});
  // Stage 83: insert HTML and SVG inside an existing native container.
  await page.evaluate(() => {
    const scene=sec();scene.layout="free";scene.elements=[];
    const panel=mkEl("container",{
      name:"Contenedor de recursos",x:8,y:10,w:72,h:360,
      stackDir:"grid",gridCols:2,stackPad:12,stackGap:8,
      mobile:{w:92,gridCols:1,stackPad:10,stackGap:6}
    });
    scene.elements.push(panel);
    selection=[panel.id];curEl=scene.elements.indexOf(panel);secFocus=false;
    refresh();window.resourceStage83ParentId=panel.id;
  });
  await page.locator("#btn-view-desk").click();
  await page.getByRole("button",{name:"Biblioteca de recursos",exact:true}).click();
  const placement=page.getByRole("combobox",{name:"Insertar recurso en",exact:true});
  await expect(placement).toBeVisible();
  const parentId=await page.evaluate(()=>window.resourceStage83ParentId);
  await expect(placement).toHaveValue(parentId);
  await libraryFrame.locator(`[data-resource-id="${css.id}"]`).click();
  const nestedHistory=await page.evaluate(()=>history.length);
  await libraryFrame.getByRole("button",{name:"Aplicar en NagWeb",exact:true}).click();
  await expect(libraryFrame.locator("[data-apply-status]")).toContainText("insertado y guardado");
  const htmlChildId=await page.evaluate(()=>selection[0]);
  assert.equal(await page.evaluate(id=>sec().elements.find(e=>e.id===id)?.parent,htmlChildId),parentId);
  assert.equal(await page.evaluate(()=>history.length),nestedHistory+1);
  await expect(page.locator("[data-resource-size-probe]")).toHaveCount(0);
  await page.getByRole("button",{name:"Volver al editor",exact:true}).click();
  const child=page.frameLocator("#preview").locator(`[data-id="${htmlChildId}"]`);
  const sandbox=child.locator("iframe.emb-sand");
  await expect(sandbox).toHaveAttribute("sandbox","");
  for (const mobile of [false,true]) {
    await page.locator(mobile?"#btn-view-mob":"#btn-view-desk").click();
    await expect(child).toBeVisible();
    const dimensions=await child.evaluate(n=>({
      width:Number.parseFloat(getComputedStyle(n).width),
      slotWidth:Number.parseFloat(getComputedStyle(n.parentElement).width)
    }));
    assert.ok(dimensions.width>0 && dimensions.slotWidth>0 &&
      dimensions.width<=dimensions.slotWidth+2,"Nested HTML must fit its native slot");
  }
  await page.locator("#btn-view-desk").click();
  await page.evaluate(id=>{selection=[id];curEl=sec().elements.findIndex(e=>e.id===id);renderPane();},htmlChildId);
  await page.getByRole("button",{name:"Personalizar componente Uiverse seleccionado",exact:true}).click();
  const custom=page.frameLocator('iframe[title="Biblioteca de recursos de NagWeb"]');
  const repeat=custom.getByLabel(htmlPlayControl.label,{exact:true});
  const group=custom.locator("details").filter({has:repeat});
  if(!await group.evaluate(n=>n.open))await group.locator("summary").click();
  await repeat.selectOption("3");
  await custom.getByRole("button",{name:"Guardar cambios en el componente",exact:true}).click();
  await expect(custom.locator("[data-apply-status]")).toContainText("Cambios guardados");
  await page.getByRole("button",{name:"Volver al editor",exact:true}).click();
  assert.equal(await page.evaluate(id=>sec().elements.find(e=>e.id===id).parent,htmlChildId),parentId);
  const code=await page.evaluate(()=>generateSite(flattenPage(page()),false,true,false));
  assert.match(code,/sandbox=""/);
  assert.match(code,/spin 1s 3 alternate/);
  await page.reload();
  assert.equal(await page.evaluate(id=>sec().elements.find(e=>e.id===id).parent,htmlChildId),parentId);
  await expect(page.frameLocator("#preview").frameLocator(
    `[data-id="${htmlChildId}"] iframe.emb-sand`).locator(".card")).toBeVisible();
  await page.evaluate(id=>{selection=[id];curEl=sec().elements.findIndex(e=>e.id===id);renderPane();},parentId);
  await page.getByRole("button",{name:"Biblioteca de recursos",exact:true}).click();
  await expect(placement).toHaveValue(parentId);
  await libraryFrame.locator('[data-resource-id="smoke:icon"]').click();
  await libraryFrame.getByRole("button",{name:"Aplicar en NagWeb",exact:true}).click();
  await expect(libraryFrame.locator("[data-apply-status]")).toContainText("insertado y guardado");
  const vectorId=await page.evaluate(()=>selection[0]);
  assert.equal(await page.evaluate(id=>sec().elements.find(e=>e.id===id).parent,vectorId),parentId);
  await page.getByRole("button",{name:"Volver al editor",exact:true}).click();
  await expect(page.frameLocator("#preview").locator(`[data-id="${vectorId}"] svg`)).toBeVisible();
  const parents=await page.evaluate(ids=>{
    const saved=JSON.parse(localStorage.getItem(STORE_KEY));
    return ids.map(id=>saved.pages[0].sections[0].elements.find(e=>e.id===id)?.parent);
  },[htmlChildId,vectorId]);
  assert.deepEqual(parents,[parentId,parentId]);
  report.scenarios.push({editor:"native resources nested in selected container",
    status:"passed",html:true,svg:true,responsive:true,edit:true,export:true});

  // A published Heroicon must be searchable, selectable, editable and
  // exportable in the real NagWeb editor, not just present in the Vault.
  await page.getByRole("button",{name:"Biblioteca de recursos",exact:true}).click();
  // Reopening preserves the last resource's modal. Dismiss it through the
  // actual UI before clicking another resource card.
  if (await libraryFrame.locator("[data-detail]").evaluate(node => node.open))
    await libraryFrame.getByRole("button",{name:"Cerrar",exact:true}).click();
  await libraryFrame.getByLabel("Proveedor",{exact:true}).selectOption("heroicons");
  await expect(libraryFrame.locator('[data-resource-id="heroicons:x-mark"]')).toBeVisible();
  // Lightweight browse-index geometry paints a real icon thumbnail without
  // loading the full source bundle or a remote image.
  const thumbnail=libraryFrame.locator('[data-resource-id="heroicons:x-mark"] + .card-visual-surface [data-icon-thumbnail] svg');
  await expect(thumbnail.locator("path")).toHaveCount(1);
  await expect(thumbnail.locator("path")).toHaveAttribute("d","M6 18 18 6M6 6l12 12");
  await libraryFrame.locator('[data-resource-id="heroicons:x-mark"]').click();
  await libraryFrame.getByLabel("Color de trazo",{exact:true}).fill("#2468ab");
  await libraryFrame.getByRole("button",{name:"Aplicar en NagWeb",exact:true}).click();
  await expect(libraryFrame.locator("[data-apply-status]")).toContainText("insertado y guardado");
  const heroInserted=await page.evaluate(()=>({
    element:structuredClone(sec().elements.find(e=>e.nwResource?.id==="heroicons:x-mark")),
    selected:[...selection]
  }));
  assert.equal(heroInserted.element?.type,"vector");
  assert.equal(heroInserted.element?.nwResource?.provider,"heroicons");
  assert.equal(heroInserted.element?.stroke,"#2468ab");
  assert.deepEqual(heroInserted.selected,[heroInserted.element.id]);
  await page.getByRole("button",{name:"Volver al editor",exact:true}).click();
  const heroNative=page.frameLocator("#preview").locator(`[data-id="${heroInserted.element.id}"] svg`);
  await expect(heroNative).toBeVisible();
  // The native vector renderer emits a fill path, then a separate stroke
  // path. Validate the actual outline, not the intentionally un-stroked fill.
  const heroStroke=heroNative.locator('path[stroke]');
  await expect(heroStroke).toHaveCount(1);
  await expect(heroStroke).toHaveAttribute("stroke","#2468ab");
  await expect(heroStroke).toHaveAttribute("stroke-width","1.5");
  await expect(heroStroke).toHaveCSS("stroke","rgb(36, 104, 171)");
  await page.evaluate(id=>{selection=[id];curEl=sec().elements.findIndex(e=>e.id===id);secFocus=false;renderPane();},heroInserted.element.id);
  await expect(page.getByRole("button",{name:"Personalizar ícono seleccionado",exact:true})).toBeEnabled();
  await page.getByRole("button",{name:"Personalizar ícono seleccionado",exact:true}).click();
  const heroEditUrl=await page.locator('iframe[title="Biblioteca de recursos de NagWeb"]').getAttribute("src");
  assert.equal(new URL(heroEditUrl).searchParams.get("editResource"),heroicon.id);
  await page.getByRole("button",{name:"Volver al editor",exact:true}).click();
  const heroExport=await page.evaluate(()=>generateSite(flattenPage(page()),false,true,false));
  assert.match(heroExport,/M6 18 18 6M6 6l12 12/);
  assert.match(heroExport,/stroke="#2468ab"/);
  const persistedHero=await page.evaluate(id=>
    JSON.parse(localStorage.getItem(STORE_KEY)).pages[0].sections[0].elements.find(e=>e.id===id),heroInserted.element.id);
  assert.equal(persistedHero?.nwResource?.id,heroicon.id);
  await page.reload();
  await expect(page.frameLocator("#preview").locator(`[data-id="${heroInserted.element.id}"] svg`)).toBeVisible();
  report.scenarios.push({editor:"Heroicons native insert, customize and export",
    status:"passed",providerFilter:true,edit:true,export:true,persistence:true});

  // Lucide cards must show the real multi-shape icon from the search index.
  await page.getByRole("button",{name:"Biblioteca de recursos",exact:true}).click();
  await libraryFrame.getByLabel("Proveedor",{exact:true}).selectOption("lucide");
  const cameraCard=libraryFrame.locator('[data-resource-id="lucide:camera"]');
  await expect(cameraCard).toBeVisible();
  const lucidePreview=libraryFrame.locator('[data-resource-id="lucide:camera"] + .card-visual-surface [data-icon-thumbnail] svg');
  await expect(lucidePreview.locator("path")).toHaveCount(1);
  await expect(lucidePreview.locator("circle")).toHaveCount(1);
  await expect(lucidePreview.locator("circle")).toHaveAttribute("r","3");
  await cameraCard.click();
  await expect(libraryFrame.locator("[data-detail-title]")).toContainText("Camera");
  report.scenarios.push({editor:"Lucide visual thumbnails from verified lightweight index",
    status:"passed",providerFilter:true,realShapes:true,noExternalImages:true});

  // Contextual menu hover must tolerate submenu removal and not throw.
  // The same app menu is used during resource editing in the full editor.
  await page.getByRole("button",{name:"Volver al editor",exact:true}).click();
  await page.locator("#btn-appmenu").click();
  const topSubmenu=page.locator(".amenu .mi.has-sub:not(.dis)").first();
  await expect(topSubmenu).toBeVisible();
  await topSubmenu.hover();
  await expect(page.locator(".amenu-sub").first()).toBeVisible();
  await page.locator("#btn-appmenu").click();
  await expect(page.locator(".amenu")).toHaveCount(0);
  report.scenarios.push({editor:"app menu submenu hover and removal",
    status:"passed",noUncaughtExceptions:true});

  // Native geometry adaptation of the pinned Three.js IcosahedronGeometry.
  // Unlike the original Three.js screenshot, THIS is editable in NagWeb.
  await page.getByRole("button",{name:"Biblioteca de recursos",exact:true}).click();
  if(await libraryFrame.locator("[data-detail]").evaluate(node=>node.open))
    await libraryFrame.getByRole("button",{name:"Cerrar",exact:true}).click();
  await libraryFrame.getByRole("button",{name:"Limpiar filtros",exact:true}).click();
  const threeNativeCard=libraryFrame.locator('[data-resource-id="'+nativeThreeScene.id+'"]');
  await expect(threeNativeCard.locator('[data-editor-use-label="available"]')).toBeVisible();
  await threeNativeCard.click();
  await expect(libraryFrame.locator("[data-preview-note]")).toContainText("adaptación");
  await expect(libraryFrame.getByRole("button",{name:"Insertar geometría 3D editable",exact:true}))
    .toBeEnabled();
  const lengthBefore=await page.evaluate(()=>sec().elements.length);
  await libraryFrame.getByRole("button",{name:"Insertar geometría 3D editable",exact:true}).click();
  await expect(libraryFrame.locator("[data-apply-status]")).toContainText("insertado y guardado");
  const nativeScene=await page.evaluate(()=>({
    elements:structuredClone(sec().elements.filter(e=>e.nwResource?.kind==="three-native")),
    count:sec().elements.length,selection:[...selection],
    saved:JSON.parse(localStorage.getItem(STORE_KEY))
  }));
  assert.equal(nativeScene.count,lengthBefore+1);
  assert.equal(nativeScene.elements.length,1);
  const geometry=nativeScene.elements[0];
  assert.equal(geometry.type,"shape3d");
  assert.equal(geometry.shape,"icosa");
  assert.equal(geometry.dragRotate,true);
  assert.equal(geometry.nwResource.id,nativeThreeScene.id);
  assert.equal(geometry.nwResource.sourceCommit,threeGallery.sourceCommit);
  assert.equal(nativeScene.saved.pages[0].sections[0].elements
    .find(e=>e.id===geometry.id)?.shape,"icosa");
  assert.deepEqual(nativeScene.selection,[geometry.id]);
  await page.getByRole("button",{name:"Volver al editor",exact:true}).click();
  await expect(page.frameLocator("#preview").locator('.obj-anchor[data-id="'+geometry.id+'"]'))
    .toBeAttached();
  const exportedNative=await page.evaluate(()=>generateSite(flattenPage(page()),false,true,false));
  assert.match(exportedNative,/"shape":"icosa"/);
  // Existing NagWeb shape inspector, undo stack and HTML export remain native.
  await page.evaluate(id=>{
    const element=sec().elements.find(e=>e.id===id);
    snapshot();element.color="#22bbcc";element.amount=2;
    refresh();
  },geometry.id);
  const changedNative=await page.evaluate(id=>({
    element:sec().elements.find(e=>e.id===id),
    markup:generateSite(flattenPage(page()),false,true,false)
  }),geometry.id);
  assert.equal(changedNative.element.color,"#22bbcc");
  assert.equal(changedNative.element.amount,2);
  assert.match(changedNative.markup,/#22bbcc/i);
  await page.reload();
  const persistedNative=await page.evaluate(id=>
    sec().elements.find(e=>e.id===id),geometry.id);
  assert.equal(persistedNative?.color,"#22bbcc");
  assert.equal(persistedNative?.shape,"icosa");
  report.scenarios.push({editor:"Pinned Three.js geometry adapted to genuine NagWeb 3D",
    status:"passed",oneNativeObject:true,editableMaterial:true,export:true,persistent:true,
    originalSceneReproduction:false});

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
