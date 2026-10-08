import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { buildInsertDescriptor } from "../runtime/insert-adapters.mjs";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function svgPreview(descriptor, title) {
  const { svg, size = 96, stroke = "#111111", strokeWidth = 2 } = descriptor.payload;
  const prepared = String(svg)
    .replace(/width=["'][^"']+["']/i, `width="${size}"`)
    .replace(/height=["'][^"']+["']/i, `height="${size}"`)
    .replace(/stroke=["'][^"']+["']/i, `stroke="${stroke}"`)
    .replace(/stroke-width=["'][^"']+["']/i, `stroke-width="${strokeWidth}"`);

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${escapeHtml(title)}</title>
<style>html,body{height:100%;margin:0}body{display:grid;place-items:center;font-family:system-ui;background:#f5f5f5}.frame{padding:40px;background:white;border:1px solid #ddd;border-radius:20px;box-shadow:0 10px 40px #0001}</style>
</head><body><div class="frame">${prepared}</div></body></html>`;
}

function htmlPreview(descriptor, title, resource) {
  const body = descriptor.payload.html || "";
  const needsHyperUi = (resource.runtime?.registryDependencies || []).includes("hyperui:runtime");
  const css = needsHyperUi
    ? '<link rel="stylesheet" href="../providers/hyperui/hyperui-runtime/files/component.css">'
    : "";
  const js = needsHyperUi
    ? '<script src="../providers/hyperui/hyperui-runtime/files/component.js" defer></script>'
    : "";

  return `<!doctype html>
<html class="${descriptor.payload.theme === "dark" ? "dark" : ""}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${escapeHtml(title)}</title>${css}${js}
<style>html,body{min-height:100%;margin:0}</style>
</head><body>${body}</body></html>`;
}

function cssEffectPreview(descriptor, title) {
  const effect = descriptor.payload.effect || {};
  const classNames = effect.previewClassNames || [effect.className, "shake-constant"];
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="../providers/csshake/csshake-runtime/files/csshake.css">
<style>html,body{height:100%;margin:0}body{display:grid;place-items:center;background:#f3f4f6;font-family:system-ui}.demo{padding:24px 34px;border-radius:18px;background:white;box-shadow:0 20px 60px #0002;font-weight:700}</style>
</head><body><div class="demo ${classNames.join(" ")}">${escapeHtml(title)}</div></body></html>`;
}

function inlineCssEffectPreview(descriptor, title) {
  const effect = descriptor.payload.effect || {};
  const safeCss = String(descriptor.payload.css || "")
    .replace(/<\/style/gi, "<\\/style");
  const classes = [effect.baseClass, effect.className]
    .filter(Boolean)
    .join(" ");
  const duration = Number(descriptor.payload.duration || 1);
  const delay = Number(descriptor.payload.delay || 0);
  const easing = descriptor.payload.easing || "ease";
  const iterations = Math.max(1, Number(descriptor.payload.iterations || 1));

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${escapeHtml(title)}</title>
<style>${safeCss}
html,body{height:100%;margin:0}
body{display:grid;place-items:center;background:#f3f4f6;font-family:system-ui;perspective:1200px;overflow:hidden}
.demo{width:210px;height:130px;border-radius:24px;background:white;box-shadow:0 24px 70px #0002;display:grid;place-items:center;font-weight:800;text-align:center;padding:18px;box-sizing:border-box;animation-duration:${duration}s;animation-delay:${delay}s;animation-timing-function:${easing};animation-iteration-count:${iterations}}
</style>
</head><body><div id="demo" class="demo">${escapeHtml(title)}</div>
<script>
const el=document.getElementById("demo");
const classes=${JSON.stringify(classes.split(" ").filter(Boolean))};
const duration=${Math.max(0.1, duration)};
const delay=${Math.max(0, delay)};
const iterations=${iterations};
function play(){
  el.classList.remove(...classes);
  void el.offsetWidth;
  el.classList.add(...classes);
}
el.addEventListener("animationend",()=>{
  setTimeout(play,650);
});
setTimeout(play,120);
setInterval(()=>{
  if(!el.getAnimations().length) play();
},Math.max(1800,(duration*iterations+delay)*1000+900));
</script></body></html>`;
}

function motionPreview(descriptor, title) {
  const preset = descriptor.payload.preset || {};
  const payload = JSON.stringify(preset).replaceAll("<", "\\u003c");

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${escapeHtml(title)}</title>
<style>
html,body{height:100%;margin:0}body{display:grid;place-items:center;background:#f3f4f6;font-family:system-ui}
#demo{width:180px;height:120px;border-radius:24px;background:white;box-shadow:0 20px 60px #0002;display:grid;place-items:center;font-weight:700}
</style></head><body><div id="demo">${escapeHtml(title)}</div>
<script>
const preset=${payload};
const el=document.getElementById("demo");
const from={},to={};
let fromTransform=[],toTransform=[];
for(const track of preset.tracks||[]){
  const p=track.property;
  if(p==="opacity"){from.opacity=track.from;to.opacity=track.to;continue;}
  const map={x:"translateX",y:"translateY",z:"translateZ",rotateX:"rotateX",rotateY:"rotateY",rotateZ:"rotateZ",scale:"scale",scaleX:"scaleX",scaleY:"scaleY",skewX:"skewX",skewY:"skewY"};
  if(!map[p]) continue;
  const unit=/rotate|skew/.test(p)?"deg":(p==="scale"||p.startsWith("scale"))?"":typeof track.from==="string"?"":"px";
  fromTransform.push(map[p]+"("+track.from+unit+")");
  toTransform.push(map[p]+"("+track.to+unit+")");
}
if(fromTransform.length){from.transform=fromTransform.join(" ");to.transform=toTransform.join(" ");}
el.animate([from,to],{duration:(preset.duration||0.5)*1000,delay:(preset.delay||0)*1000,easing:preset.ease||"ease",iterations:Infinity,direction:"alternate",fill:"both"});
</script></body></html>`;
}

export function buildStaticPreview(resource, options = {}) {
  const descriptor = buildInsertDescriptor(resource, options);

  if (descriptor.kind === "svg") {
    return { supported: true, html: svgPreview(descriptor, resource.title) };
  }

  if (descriptor.kind === "html") {
    return { supported: true, html: htmlPreview(descriptor, resource.title, resource) };
  }

  if (descriptor.kind === "css-effect") {
    return { supported: true, html: cssEffectPreview(descriptor, resource.title) };
  }

  if (descriptor.kind === "css-inline-effect") {
    return {
      supported: true,
      html: inlineCssEffectPreview(descriptor, resource.title)
    };
  }

  if (descriptor.kind === "motion-preset") {
    return { supported: true, html: motionPreview(descriptor, resource.title) };
  }

  return {
    supported: false,
    reason:
      descriptor.kind === "react-component"
        ? "react-compile-sandbox-required"
        : "renderer-not-yet-static-previewable"
  };
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function buildVaultPreviews(rootDir, catalog) {
  const previewsDir = path.join(rootDir, "previews");
  await mkdir(previewsDir, { recursive: true });

  let built = 0;
  let deferred = 0;

  for (const entry of catalog.resources || []) {
    if (!entry.vaultPath) continue;
    const resource = await readJson(path.join(rootDir, entry.vaultPath));
    const preview = buildStaticPreview(resource);

    if (!preview.supported) {
      entry.previewStatus = "deferred";
      entry.previewReason = preview.reason;
      deferred += 1;
      continue;
    }

    const filename = resource.id.replace(/[^a-z0-9._-]+/gi, "__") + ".html";
    await writeFile(path.join(previewsDir, filename), preview.html, "utf8");
    entry.previewStatus = "ready";
    entry.previewPath = `previews/${filename}`;
    built += 1;
  }

  await writeFile(
    path.join(rootDir, "catalog.json"),
    JSON.stringify(catalog, null, 2) + "\n",
    "utf8"
  );

  return { built, deferred };
}
