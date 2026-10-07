import path from "node:path";
import { writeFile } from "node:fs/promises";

function safeJsonForHtml(value) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026");
}

function galleryResource(entry) {
  return {
    id: entry.id,
    title: entry.title || entry.name || entry.id,
    description: entry.description || "",
    family: entry.family || "other",
    kind: entry.kind || "unknown",
    provider: entry.source?.provider || "unknown",
    tags: entry.taxonomy?.tags || [],
    categories: entry.taxonomy?.categories || [],
    previewStatus: entry.previewStatus || "none",
    previewPath: entry.previewPath || null,
    previewReason: entry.previewReason || null,
    vaultPath: entry.vaultPath || null,
    capabilities: entry.capabilities || []
  };
}

export async function buildVaultGallery(rootDir, catalog) {
  const resources = (catalog.resources || []).map(galleryResource);
  const data = safeJsonForHtml(resources);

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>NagWeb Code Vault</title>
<style>
:root{color-scheme:dark;background:#0b0b0d;color:#f4f4f5;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;background:radial-gradient(circle at 20% 0,#22222b 0,transparent 34rem),#0b0b0d}
button,input,select{font:inherit}
header{position:sticky;top:0;z-index:20;padding:18px 22px;border-bottom:1px solid #27272a;background:rgba(11,11,13,.9);backdrop-filter:blur(18px)}
.top{display:flex;align-items:center;gap:16px;justify-content:space-between;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:12px}
.logo{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:#fafafa;color:#09090b;font-weight:900}
h1{font-size:17px;margin:0}.muted{color:#a1a1aa;font-size:12px}
.controls{display:grid;grid-template-columns:minmax(180px,1fr) repeat(3,minmax(130px,180px));gap:10px;margin-top:14px}
input,select{width:100%;border:1px solid #303038;border-radius:10px;background:#151519;color:#f4f4f5;padding:10px 12px;outline:none}
input:focus,select:focus{border-color:#71717a}
main{padding:22px}
.summary{display:flex;gap:10px;align-items:center;margin-bottom:16px;color:#a1a1aa;font-size:13px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:16px}
.card{min-width:0;border:1px solid #27272a;background:#111114;border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 50px rgba(0,0,0,.16)}
.preview{height:210px;background:#18181b;border-bottom:1px solid #27272a;display:grid;place-items:center;overflow:hidden;position:relative}
.preview iframe{width:100%;height:100%;border:0;background:white}
.placeholder{padding:20px;text-align:center;color:#71717a;font-size:12px;line-height:1.5}
.body{padding:15px;display:flex;flex-direction:column;gap:10px;min-height:180px}
.meta{display:flex;gap:6px;flex-wrap:wrap}
.pill{font-size:10px;letter-spacing:.03em;text-transform:uppercase;padding:5px 7px;border:1px solid #303038;border-radius:999px;color:#a1a1aa;background:#18181b}
.status-ready,.status-ready-react{color:#bbf7d0;border-color:#166534;background:#052e16}
.title{font-size:15px;font-weight:700;margin:0;line-height:1.3}
.desc{font-size:12px;line-height:1.45;color:#a1a1aa;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.tags{font-size:11px;color:#71717a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.actions{display:flex;gap:8px;margin-top:auto}
.actions a,.actions button{border:1px solid #303038;background:#18181b;color:#e4e4e7;border-radius:9px;padding:7px 9px;text-decoration:none;font-size:11px;cursor:pointer}
.actions a:hover,.actions button:hover{background:#27272a}
.empty{grid-column:1/-1;padding:50px;text-align:center;color:#71717a}
@media(max-width:820px){.controls{grid-template-columns:1fr 1fr}.controls input{grid-column:1/-1}}
@media(max-width:520px){.controls{grid-template-columns:1fr}main{padding:12px}.grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<header>
  <div class="top">
    <div class="brand">
      <div class="logo">N</div>
      <div>
        <h1>NagWeb Code Vault</h1>
        <div class="muted">Biblioteca local de recursos autosuficientes</div>
      </div>
    </div>
    <div id="total" class="muted"></div>
  </div>
  <div class="controls">
    <input id="search" type="search" placeholder="Buscar: blur, icono, card, shader...">
    <select id="provider"><option value="">Todos los proveedores</option></select>
    <select id="family"><option value="">Todas las familias</option></select>
    <select id="status">
      <option value="">Todos los estados</option>
      <option value="ready">Preview lista</option>
      <option value="deferred">Preview diferida</option>
    </select>
  </div>
</header>
<main>
  <div class="summary"><span id="shown"></span></div>
  <div id="grid" class="grid"></div>
</main>
<script>
const resources=${data};
const search=document.getElementById("search");
const provider=document.getElementById("provider");
const family=document.getElementById("family");
const status=document.getElementById("status");
const grid=document.getElementById("grid");
const shown=document.getElementById("shown");
const total=document.getElementById("total");

const esc=(value)=>String(value??"").replace(/[&<>"']/g,(char)=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
}[char]));

function fillSelect(node,values){
  for(const value of [...new Set(values)].sort()){
    if(!value) continue;
    const option=document.createElement("option");
    option.value=value;
    option.textContent=value;
    node.appendChild(option);
  }
}

fillSelect(provider,resources.map(r=>r.provider));
fillSelect(family,resources.map(r=>r.family));
total.textContent=resources.length+" recursos";

function isReady(resource){
  return resource.previewStatus==="ready" || resource.previewStatus==="ready-react";
}

function matches(resource){
  const q=search.value.trim().toLowerCase();
  if(provider.value && resource.provider!==provider.value) return false;
  if(family.value && resource.family!==family.value) return false;
  if(status.value==="ready" && !isReady(resource)) return false;
  if(status.value==="deferred" && isReady(resource)) return false;
  if(!q) return true;

  const haystack=[
    resource.id,resource.title,resource.description,resource.provider,
    resource.family,resource.kind,...resource.tags,...resource.categories
  ].join(" ").toLowerCase();
  return haystack.includes(q);
}

function card(resource){
  const node=document.createElement("article");
  node.className="card";

  const preview=isReady(resource)&&resource.previewPath
    ? `<iframe loading="lazy" sandbox="allow-scripts allow-same-origin" src="${esc(resource.previewPath)}" title="${esc(resource.title)}"></iframe>`
    : `<div class="placeholder">Preview no disponible todavía.<br>${esc(resource.previewReason||"Requiere adaptación adicional.")}</div>`;

  const previewAction=isReady(resource)&&resource.previewPath
    ? `<a href="${esc(resource.previewPath)}" target="_blank" rel="noreferrer">Abrir preview</a>`
    : "";

  const jsonAction=resource.vaultPath
    ? `<a href="${esc(resource.vaultPath)}" target="_blank" rel="noreferrer">resource.json</a>`
    : "";

  node.innerHTML=`
    <div class="preview">${preview}</div>
    <div class="body">
      <div class="meta">
        <span class="pill">${esc(resource.provider)}</span>
        <span class="pill">${esc(resource.kind)}</span>
        <span class="pill status-${esc(resource.previewStatus)}">${esc(resource.previewStatus)}</span>
      </div>
      <h2 class="title">${esc(resource.title)}</h2>
      <div class="desc">${esc(resource.description)}</div>
      <div class="tags">${esc(resource.tags.slice(0,8).join(" · "))}</div>
      <div class="actions">
        ${previewAction}
        ${jsonAction}
        <button type="button" data-copy="${esc(resource.id)}">Copiar ID</button>
      </div>
    </div>`;

  node.querySelector("[data-copy]")?.addEventListener("click",async(event)=>{
    const value=event.currentTarget.dataset.copy;
    try{
      await navigator.clipboard.writeText(value);
      event.currentTarget.textContent="Copiado";
      setTimeout(()=>event.currentTarget.textContent="Copiar ID",900);
    }catch{
      window.prompt("ID del recurso",value);
    }
  });

  return node;
}

function render(){
  const filtered=resources.filter(matches);
  shown.textContent=filtered.length+" visibles";
  grid.replaceChildren();

  if(!filtered.length){
    const empty=document.createElement("div");
    empty.className="empty";
    empty.textContent="No encontré recursos con esos filtros.";
    grid.appendChild(empty);
    return;
  }

  const fragment=document.createDocumentFragment();
  for(const resource of filtered) fragment.appendChild(card(resource));
  grid.appendChild(fragment);
}

for(const control of [search,provider,family,status]){
  control.addEventListener(control===search?"input":"change",render);
}
render();
</script>
</body>
</html>`;

  const outputPath = path.join(rootDir, "index.html");
  await writeFile(outputPath, html, "utf8");

  return {
    outputPath,
    resources: resources.length,
    ready: resources.filter(
      (resource) =>
        resource.previewStatus === "ready" ||
        resource.previewStatus === "ready-react"
    ).length
  };
}
