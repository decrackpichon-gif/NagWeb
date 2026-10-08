import {
  createNagWebPersistentVaultClient
} from "../src/runtime/persistent-vault-client.mjs";
import { defaultEditableValues } from "../src/runtime/instance.mjs";
import {
  buildResourceApplyEnvelope,
  resolveResourceApplyTarget,
  sendResourceApplyEnvelope,
  isMatchingResourceApplyResult
} from "../src/runtime/resource-apply-bridge.mjs";

const vault = createNagWebPersistentVaultClient();
const PAGE_SIZE = 48;

const el = {
  status: document.querySelector("[data-status]"),
  total: document.querySelector("[data-total]"),
  search: document.querySelector("[data-search]"),
  provider: document.querySelector("[data-provider]"),
  family: document.querySelector("[data-family]"),
  kind: document.querySelector("[data-kind]"),
  clear: document.querySelector("[data-clear]"),
  refresh: document.querySelector("[data-refresh]"),
  resultCount: document.querySelector("[data-result-count]"),
  pageLabel: document.querySelector("[data-page-label]"),
  prev: document.querySelector("[data-prev]"),
  next: document.querySelector("[data-next]"),
  grid: document.querySelector("[data-grid]"),
  empty: document.querySelector("[data-empty]"),
  detail: document.querySelector("[data-detail]"),
  detailProvider: document.querySelector("[data-detail-provider]"),
  detailTitle: document.querySelector("[data-detail-title]"),
  detailId: document.querySelector("[data-detail-id]"),
  detailBadges: document.querySelector("[data-detail-badges]"),
  detailDescription: document.querySelector("[data-detail-description]"),
  detailLicense: document.querySelector("[data-detail-license]"),
  detailAuthor: document.querySelector("[data-detail-author]"),
  detailControls: document.querySelector("[data-detail-controls]"),
  detailArtifacts: document.querySelector("[data-detail-artifacts]"),
  preview: document.querySelector("[data-preview]"),
  previewFallback: document.querySelector("[data-preview-fallback]"),
  previewNote: document.querySelector("[data-preview-note]"),
  svgColor: document.querySelector("[data-svg-color]"),
  strokeInput: document.querySelector("[data-icon-stroke]"),
  strokeValue: document.querySelector("[data-icon-stroke-value]"),
  svgSize: document.querySelector("[data-svg-size]"),
  sizeInput: document.querySelector("[data-icon-size]"),
  sizeValue: document.querySelector("[data-icon-size-value]"),
  svgStrokeWidth: document.querySelector("[data-svg-stroke-width]"),
  strokeWidthInput: document.querySelector("[data-icon-stroke-width]"),
  strokeWidthValue: document.querySelector("[data-icon-stroke-width-value]"),
  resetSvg: document.querySelector("[data-reset-svg]"),
  cssColor: document.querySelector("[data-css-color]"),
  cssColorInput: document.querySelector("[data-css-color-input]"),
  cssColorValue: document.querySelector("[data-css-color-value]"),
  cssColorLabel: document.querySelector("[data-css-color-label]"),
  cssSize: document.querySelector("[data-css-size]"),
  cssSizeInput: document.querySelector("[data-css-size-input]"),
  cssSizeValue: document.querySelector("[data-css-size-value]"),
  cssSizeLabel: document.querySelector("[data-css-size-label]"),
  apply: document.querySelector("[data-apply]"),
  applyStatus: document.querySelector("[data-apply-status]"),
  applyBox: document.querySelector(".apply-box"),
  copyId: document.querySelector("[data-copy-id]"),
  copyCode: document.querySelector("[data-copy-code]"),
  code: document.querySelector("[data-code]"),
  close: document.querySelector("[data-close]")
};

let offset = 0;
let selectedResource = null;
let selectedValues = {};
let searchTimer = null;
let pendingApplyId = null;
let pendingApplyResourceId = null;
let pendingApplyTimer = null;
const applyTarget = resolveResourceApplyTarget();

if (applyTarget) {
  el.apply.disabled = false;
  el.applyBox.dataset.connected = "true";
  el.applyStatus.textContent =
    `Editor conectado de forma explícita: ${applyTarget.targetOrigin}`;
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function badge(value) {
  return `<span class="badge">${esc(value)}</span>`;
}

function fillSelect(select, items) {
  for (const item of items) {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = `${item.value} · ${item.count.toLocaleString("es-AR")}`;
    select.appendChild(option);
  }
}

function currentFilters() {
  return {
    query: el.search.value.trim(),
    providers: el.provider.value || undefined,
    families: el.family.value || undefined,
    kinds: el.kind.value || undefined,
    offset,
    limit: PAGE_SIZE
  };
}

async function renderResults() {
  el.grid.setAttribute("aria-busy", "true");
  const result = await vault.search(currentFilters());

  el.resultCount.textContent =
    `${result.total.toLocaleString("es-AR")} resultados`;
  const page = result.total ? Math.floor(result.offset / result.limit) + 1 : 0;
  const pages = result.total ? Math.ceil(result.total / result.limit) : 0;
  el.pageLabel.textContent = pages ? `Página ${page} de ${pages}` : "";
  el.prev.disabled = result.offset <= 0;
  el.next.disabled = !result.hasMore;

  el.grid.innerHTML = result.items.map((item) => `
    <button type="button" class="resource-card" data-resource-id="${esc(item.id)}">
      <span class="provider">${esc(item.provider)}</span>
      <h3>${esc(item.title || item.name || item.id)}</h3>
      <p>${esc(item.description || item.searchText || item.id)}</p>
      <span class="card-foot">
        ${badge(item.family)}
        ${badge(item.kind)}
      </span>
    </button>
  `).join("");

  el.empty.hidden = result.total !== 0;
  el.grid.hidden = result.total === 0;
  el.grid.removeAttribute("aria-busy");
}

function mainArtifact(resource) {
  const entryId = resource.runtime?.entryArtifactId;
  if (entryId) {
    const entry = (resource.artifacts || []).find((item) => item.id === entryId);
    if (entry?.content) return entry;
  }
  return (resource.artifacts || []).find((item) => item.content) || null;
}

function defaultCssVariables(resource, values = {}) {
  const output = { ...(resource.runtime?.cssVariables || {}) };
  for (const prop of resource.editableProps || []) {
    if (prop.binding?.type !== "css-variable") continue;
    let value = Object.hasOwn(values, prop.id) ? values[prop.id] : prop.defaultValue;
    if (typeof value === "number" && prop.constraints?.unit) {
      value = `${value}${prop.constraints.unit}`;
    }
    output[prop.binding.variable] = String(value);
  }
  return output;
}

function cssVarStyle(resource, values = {}) {
  return Object.entries(defaultCssVariables(resource, values))
    .map(([name, value]) => `${name}:${String(value).replaceAll('"', "&quot;")}`)
    .join(";");
}

async function previewDoc(resource, values = {}) {
  const renderer = resource.runtime?.renderer;
  const provider = resource.source?.provider;

  if (renderer === "nagweb-svg") {
    const artifact = (resource.artifacts || []).find(
      (item) => item.role === "icon-data"
    );
    if (!artifact?.content) return null;
    const stroke = /^#[0-9a-f]{6}$/i.test(values.stroke || "")
      ? values.stroke
      : "#111111";
    const size = Number.isFinite(values.size)
      ? Math.min(512, Math.max(4, values.size))
      : 24;
    const strokeWidth = Number.isFinite(values.strokeWidth)
      ? Math.min(8, Math.max(0.25, values.strokeWidth))
      : 2;
    return `<!doctype html><style>html,body{height:100%;margin:0}body{display:grid;place-items:center;background:#f4f5f7}svg{width:${size}px;height:${size}px;max-width:calc(100vw - 24px);max-height:calc(100vh - 24px);stroke:${stroke};stroke-width:${strokeWidth}}</style>${artifact.content}`;
  }

  if (renderer === "nagweb-html-tailwind" && provider !== "hyperui") {
    const artifact = mainArtifact(resource);
    if (!artifact?.content) return null;
    return `<!doctype html><meta name="viewport" content="width=device-width"><style>html,body{height:100%;margin:0}body{display:grid;place-items:center;background:#f4f5f7}.root{display:grid;place-items:center;min-width:100%;min-height:100%;}</style><div class="root" style="${cssVarStyle(resource, values)}">${artifact.content}</div>`;
  }

  if (renderer === "nagweb-css-inline-effect") {
    const style = (resource.artifacts || []).find((item) => item.role === "stylesheet");
    const effect = resource.runtime?.setup || {};
    if (!style?.content || !effect.className) return null;
    return `<!doctype html><style>${style.content} html,body{height:100%;margin:0}body{display:grid;place-items:center;background:#f4f5f7;perspective:1200px}.demo{width:210px;height:130px;border-radius:24px;background:#fff;box-shadow:0 24px 70px #0002;display:grid;place-items:center;font:700 16px system-ui}</style><div class="demo ${esc(effect.baseClass || "")} ${esc(effect.className)}">${esc(resource.title)}</div>`;
  }

  if (renderer === "nagweb-css-class-effect") {
    const dependency = (resource.runtime?.registryDependencies || [])[0];
    const runtime = dependency ? await vault.getResource(dependency) : null;
    const style = (runtime?.artifacts || []).find((item) => item.role === "stylesheet");
    const data = (resource.artifacts || []).find((item) => item.role === "animation-data");
    if (!style?.content || !data?.content) return null;
    const effect = JSON.parse(data.content);
    const classes = (effect.previewClassNames || [effect.className]).join(" ");
    return `<!doctype html><style>${style.content} html,body{height:100%;margin:0}body{display:grid;place-items:center;background:#f4f5f7}.demo{padding:24px 34px;border-radius:18px;background:#fff;box-shadow:0 20px 60px #0002;font:700 16px system-ui}</style><div class="demo ${esc(classes)}">${esc(resource.title)}</div>`;
  }

  return null;
}

function updateApplyReadiness(resource) {
  el.apply.disabled = true;

  if (!resource?.id) {
    el.applyStatus.textContent = "Recurso no disponible para insertar.";
    return;
  }

  if (!resource.license?.verified) {
    el.applyStatus.textContent = "No se puede insertar: la licencia todavía no está verificada.";
    return;
  }

  try {
    buildResourceApplyEnvelope(resource, { requestId: "nagweb-apply-readiness" });
  } catch (error) {
    el.applyStatus.textContent =
      /no NagWeb insert adapter/.test(error?.message || "")
        ? "Este recurso todavía no tiene un adaptador de inserción compatible con NagWeb."
        : "No se puede preparar este recurso para insertarlo.";
    return;
  }

  if (!applyTarget) {
    el.applyStatus.textContent =
      "Modo exploración: abrí la biblioteca desde NagWeb para insertar este recurso.";
    return;
  }

  if (pendingApplyId) {
    el.applyStatus.textContent = "Esperando confirmación del editor…";
    return;
  }

  el.apply.disabled = false;
  el.applyStatus.textContent = "Recurso listo para aplicar en el editor conectado.";
}

function configureSvgColor(resource) {
  const colorProp = resource.runtime?.renderer === "nagweb-svg"
    ? (resource.editableProps || []).find(
      (prop) => prop.id === "stroke" && prop.valueType === "color"
    )
    : null;
  const color = colorProp?.defaultValue;
  if (!/^#[0-9a-f]{6}$/i.test(color || "")) return;

  selectedValues.stroke = color;
  el.strokeInput.value = color;
  el.strokeValue.textContent = color.toUpperCase();
  el.svgColor.hidden = false;

  const sizeProp = (resource.editableProps || []).find(
    (prop) => prop.id === "size" && prop.valueType === "number"
  );
  const size = sizeProp?.defaultValue;
  const min = sizeProp?.constraints?.min ?? 4;
  const max = sizeProp?.constraints?.max ?? 512;
  const step = sizeProp?.constraints?.step ?? 1;
  if (
    Number.isFinite(size) && Number.isFinite(min) &&
    Number.isFinite(max) && Number.isFinite(step) &&
    min > 0 && max >= min && step > 0 && size >= min && size <= max
  ) {
    selectedValues.size = size;
    el.sizeInput.min = String(min);
    el.sizeInput.max = String(max);
    el.sizeInput.step = String(step);
    el.sizeInput.value = String(size);
    el.sizeValue.textContent = `${size} px`;
    el.svgSize.hidden = false;
  }

  const widthProp = (resource.editableProps || []).find(
    (prop) => prop.id === "strokeWidth" && prop.valueType === "number"
  );
  const width = widthProp?.defaultValue;
  const widthMin = widthProp?.constraints?.min ?? 0.25;
  const widthMax = widthProp?.constraints?.max ?? 8;
  const widthStep = widthProp?.constraints?.step ?? 0.25;
  if (
    Number.isFinite(width) && Number.isFinite(widthMin) &&
    Number.isFinite(widthMax) && Number.isFinite(widthStep) &&
    widthMin > 0 && widthMax >= widthMin &&
    widthStep > 0 && width >= widthMin && width <= widthMax
  ) {
    selectedValues.strokeWidth = width;
    el.strokeWidthInput.min = String(widthMin);
    el.strokeWidthInput.max = String(widthMax);
    el.strokeWidthInput.step = String(widthStep);
    el.strokeWidthInput.value = String(width);
    el.strokeWidthValue.textContent = String(width);
    el.svgStrokeWidth.hidden = false;
  }
}

function configureCssColor(resource) {
  if (resource.runtime?.renderer !== "nagweb-html-tailwind") return;
  const prop = (resource.editableProps || []).find(
    (entry) => entry.id === "color" &&
      entry.valueType === "color" &&
      entry.binding?.type === "css-variable" &&
      /^--[a-z0-9-]+$/i.test(entry.binding.variable || "") &&
      /^#[0-9a-f]{6}$/i.test(entry.defaultValue || "")
  );
  if (!prop) return;

  selectedValues.color = prop.defaultValue;
  el.cssColorInput.value = prop.defaultValue;
  el.cssColorValue.textContent = prop.defaultValue.toUpperCase();
  el.cssColorLabel.textContent = prop.label || "Color";
  el.cssColor.hidden = false;

  const sizeProp = (resource.editableProps || []).find(
    (entry) => entry.id === "size" &&
      entry.valueType === "number" &&
      entry.binding?.type === "css-variable" &&
      /^--[a-z0-9-]+$/i.test(entry.binding.variable || "")
  );
  const size = sizeProp?.defaultValue;
  const min = sizeProp?.constraints?.min;
  const max = sizeProp?.constraints?.max;
  const step = sizeProp?.constraints?.step;
  if (
    Number.isFinite(size) && Number.isFinite(min) &&
    Number.isFinite(max) && Number.isFinite(step) &&
    min > 0 && max >= min && step > 0 &&
    size >= min && size <= max
  ) {
    selectedValues.size = size;
    el.cssSizeInput.min = String(min);
    el.cssSizeInput.max = String(max);
    el.cssSizeInput.step = String(step);
    el.cssSizeInput.value = String(size);
    el.cssSizeValue.textContent = `${size}${sizeProp.constraints?.unit || ""}`;
    el.cssSizeLabel.textContent = sizeProp.label || "Tamaño";
    el.cssSize.hidden = false;
  }
}

async function openDetail(id) {
  selectedResource = null;
  selectedValues = {};
  el.svgColor.hidden = true;
  el.svgSize.hidden = true;
  el.svgStrokeWidth.hidden = true;
  el.cssColor.hidden = true;
  el.cssSize.hidden = true;
  el.apply.disabled = true;
  el.applyStatus.textContent = "Comprobando si el recurso se puede insertar…";
  el.detail.showModal();
  el.detailTitle.textContent = "Cargando recurso…";
  el.detailId.textContent = id;
  el.preview.srcdoc = "";
  el.previewFallback.hidden = false;
  el.code.textContent = "";

  const resource = await vault.getResource(id);
  selectedResource = resource;
  if (resource) {
    configureSvgColor(resource);
    configureCssColor(resource);
  }
  updateApplyReadiness(resource);

  if (!resource) {
    el.detailTitle.textContent = "No encontré el recurso";
    return;
  }

  el.detailProvider.textContent = resource.source?.provider || "";
  el.detailTitle.textContent = resource.title || resource.name || resource.id;
  el.detailId.textContent = resource.id;
  el.detailDescription.textContent = resource.description || "Sin descripción.";
  el.detailLicense.textContent = resource.license?.name || resource.license?.id || "Sin dato";
  el.detailAuthor.textContent = resource.source?.author || "No informado";
  el.detailControls.textContent = String((resource.editableProps || []).length);
  el.detailArtifacts.textContent = String((resource.artifacts || []).length);
  el.detailBadges.innerHTML = [
    resource.family,
    resource.kind,
    ...(resource.taxonomy?.categories || []).slice(0, 4)
  ].filter(Boolean).map(badge).join("");

  const artifact = mainArtifact(resource);
  el.code.textContent = artifact?.content || JSON.stringify(resource.runtime || {}, null, 2);
  el.copyCode.disabled = !artifact?.content;

  const doc = await previewDoc(resource, selectedValues);
  if (doc) {
    el.previewFallback.hidden = true;
    el.preview.hidden = false;
    el.preview.srcdoc = doc;
    el.previewNote.textContent = "Preview segura generada desde nuestra copia persistente.";
  } else {
    el.preview.hidden = true;
    el.previewFallback.hidden = false;
    el.previewNote.textContent =
      "Este tipo requiere el renderer/compilador completo de NagWeb. El recurso y su código sí están guardados.";
  }
}

async function refreshIndex() {
  el.status.textContent = "Actualizando índice y verificando checksum…";
  await vault.loadManifest({ force: true });
  const index = await vault.loadBrowseIndex({ force: true });
  const facets = await vault.facets();

  for (const select of [el.provider, el.family, el.kind]) {
    while (select.options.length > 1) select.remove(1);
  }
  fillSelect(el.provider, facets.providers);
  fillSelect(el.family, facets.families);
  fillSelect(el.kind, facets.kinds);

  el.total.textContent = `${index.resourceCount.toLocaleString("es-AR")} recursos`;
  el.status.textContent =
    "Índice verificado. El código completo se carga sólo al abrir un recurso.";
  offset = 0;
  await renderResults();
}

el.search.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    offset = 0;
    renderResults();
  }, 120);
});
for (const select of [el.provider, el.family, el.kind]) {
  select.addEventListener("change", () => {
    offset = 0;
    renderResults();
  });
}
el.clear.addEventListener("click", () => {
  el.search.value = "";
  el.provider.value = "";
  el.family.value = "";
  el.kind.value = "";
  offset = 0;
  renderResults();
});
el.prev.addEventListener("click", () => {
  offset = Math.max(0, offset - PAGE_SIZE);
  renderResults();
});
el.next.addEventListener("click", () => {
  offset += PAGE_SIZE;
  renderResults();
});
el.refresh.addEventListener("click", refreshIndex);
el.grid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-resource-id]");
  if (card) openDetail(card.dataset.resourceId);
});
el.close.addEventListener("click", () => el.detail.close());
window.addEventListener("message", (event) => {
  if (!applyTarget) return;
  if (event.source !== applyTarget.targetWindow) return;
  if (event.origin !== applyTarget.targetOrigin) return;
  if (!isMatchingResourceApplyResult(event.data, {
    requestId: pendingApplyId,
    resourceId: pendingApplyResourceId
  })) return;

  const completedResourceId = pendingApplyResourceId;
  clearTimeout(pendingApplyTimer);
  pendingApplyTimer = null;
  pendingApplyId = null;
  pendingApplyResourceId = null;
  updateApplyReadiness(selectedResource);

  // A reply for a previous selection must never appear on another resource.
  if (!el.detail.open || selectedResource?.id !== completedResourceId) return;

  if (event.data.status === "applied") {
    el.applyStatus.textContent =
      event.data.message || "Recurso aplicado en NagWeb.";
    return;
  }

  if (event.data.status === "rejected") {
    el.applyStatus.textContent =
      event.data.message || "El editor rechazó este recurso.";
    return;
  }

  el.applyStatus.textContent =
    event.data.message || "El editor informó un error al aplicar el recurso.";
});

async function redrawSvgPreview() {
  const resource = selectedResource;
  if (!resource || resource.runtime?.renderer !== "nagweb-svg") return;
  const values = { ...selectedValues };
  const doc = await previewDoc(resource, values);
  if (
    doc && selectedResource === resource &&
    selectedValues.stroke === values.stroke &&
    selectedValues.size === values.size &&
    selectedValues.strokeWidth === values.strokeWidth
  ) {
    el.preview.srcdoc = doc;
  }
}

async function redrawCssPreview() {
  const resource = selectedResource;
  if (!resource || el.cssColor.hidden) return;
  const values = { ...selectedValues };
  const doc = await previewDoc(resource, values);
  if (
    doc && selectedResource === resource &&
    selectedValues.color === values.color &&
    selectedValues.size === values.size
  ) {
    el.preview.srcdoc = doc;
  }
}

el.cssColorInput.addEventListener("input", () => {
  if (!selectedResource || el.cssColor.hidden) return;
  const color = el.cssColorInput.value;
  if (!/^#[0-9a-f]{6}$/i.test(color)) return;
  selectedValues.color = color;
  el.cssColorValue.textContent = color.toUpperCase();
  redrawCssPreview();
});

el.cssSizeInput.addEventListener("input", () => {
  if (!selectedResource || el.cssSize.hidden) return;
  const size = Number(el.cssSizeInput.value);
  const min = Number(el.cssSizeInput.min);
  const max = Number(el.cssSizeInput.max);
  if (!Number.isFinite(size) || size < min || size > max) return;
  selectedValues.size = size;
  const prop = (selectedResource.editableProps || []).find(
    (entry) => entry.id === "size" && entry.binding?.type === "css-variable"
  );
  el.cssSizeValue.textContent = `${size}${prop?.constraints?.unit || ""}`;
  redrawCssPreview();
});

el.strokeInput.addEventListener("input", () => {
  if (!selectedResource || el.svgColor.hidden) return;
  const stroke = el.strokeInput.value;
  if (!/^#[0-9a-f]{6}$/i.test(stroke)) return;
  selectedValues.stroke = stroke;
  el.strokeValue.textContent = stroke.toUpperCase();
  redrawSvgPreview();
});

el.sizeInput.addEventListener("input", () => {
  if (!selectedResource || el.svgSize.hidden) return;
  const size = Number(el.sizeInput.value);
  if (!Number.isFinite(size)) return;
  selectedValues.size = size;
  el.sizeValue.textContent = `${size} px`;
  redrawSvgPreview();
});

el.strokeWidthInput.addEventListener("input", () => {
  if (!selectedResource || el.svgStrokeWidth.hidden) return;
  const width = Number(el.strokeWidthInput.value);
  if (!Number.isFinite(width)) return;
  selectedValues.strokeWidth = width;
  el.strokeWidthValue.textContent = String(width);
  redrawSvgPreview();
});

el.resetSvg.addEventListener("click", () => {
  if (!selectedResource || el.svgColor.hidden) return;

  // Restore defaults from the UniversalResource, not hard-coded UI values.
  selectedValues = defaultEditableValues(selectedResource);
  configureSvgColor(selectedResource);
  redrawSvgPreview();
});

el.apply.addEventListener("click", () => {
  if (!selectedResource || !applyTarget || pendingApplyId) return;

  try {
    const envelope = buildResourceApplyEnvelope(selectedResource, {
      values: { ...selectedValues }
    });
    const id = sendResourceApplyEnvelope(envelope, applyTarget);

    clearTimeout(pendingApplyTimer);
    pendingApplyId = id;
    pendingApplyResourceId = selectedResource.id;
    el.apply.disabled = true;
    el.applyStatus.textContent = "Esperando confirmación del editor…";

    pendingApplyTimer = setTimeout(() => {
      if (pendingApplyId !== id) return;
      const timedOutResourceId = pendingApplyResourceId;
      pendingApplyId = null;
      pendingApplyResourceId = null;
      pendingApplyTimer = null;
      updateApplyReadiness(selectedResource);
      if (el.detail.open && selectedResource?.id === timedOutResourceId) {
        el.applyStatus.textContent =
          "El editor no confirmó la aplicación. No asumo que el recurso se haya insertado.";
      }
    }, 8000);
  } catch (error) {
    console.error(error);
    el.applyStatus.textContent =
      `No pude preparar el recurso: ${error?.message || error}`;
  }
});

el.copyId.addEventListener("click", async () => {
  if (!selectedResource) return;
  await navigator.clipboard.writeText(selectedResource.id);
  el.copyId.textContent = "ID copiado";
  setTimeout(() => (el.copyId.textContent = "Copiar ID"), 900);
});
el.copyCode.addEventListener("click", async () => {
  const artifact = selectedResource ? mainArtifact(selectedResource) : null;
  if (!artifact?.content) return;
  await navigator.clipboard.writeText(artifact.content);
  el.copyCode.textContent = "Código copiado";
  setTimeout(() => (el.copyCode.textContent = "Copiar código principal"), 900);
});

try {
  await refreshIndex();
} catch (error) {
  console.error(error);
  el.status.textContent = `No pude cargar la biblioteca: ${error?.message || error}`;
}
