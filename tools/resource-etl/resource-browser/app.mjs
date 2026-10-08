import {
  createNagWebPersistentVaultClient
} from "../src/runtime/persistent-vault-client.mjs";
import { defaultEditableValues } from "../src/runtime/instance.mjs";
import { describeEditableControls } from "../src/runtime/editable-controls.mjs";
import { buildLottieBrowserPreview } from "../src/preview/lottie-browser-preview.mjs";
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
  customize: document.querySelector("[data-customize]"),
  customizeTitle: document.querySelector("[data-customize-title]"),
  customizeControls: document.querySelector("[data-customize-controls]"),
  resetCustomize: document.querySelector("[data-reset-customize]"),
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

  if (renderer === "lottie" || renderer === "dotlottie-web") {
    return buildLottieBrowserPreview(resource, values, {
      playerUrl: new URL("./vendor/lottie_light.min.js", import.meta.url).href
    });
  }

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

function renderEditableControls(resource) {
  el.customizeControls.replaceChildren();
  const controls = describeEditableControls(resource);
  const renderer = resource.runtime?.renderer;
  el.customizeTitle.textContent = renderer === "nagweb-svg"
    ? "Personalizar ícono"
    : ["lottie", "dotlottie-web", "nagweb-css-class-effect"].includes(renderer)
      ? "Personalizar animación"
      : "Personalizar componente CSS";

  for (const [index, control] of controls.entries()) {
    selectedValues[control.id] = control.defaultValue;
    const field = document.createElement("div");
    const label = document.createElement("label");
    const row = document.createElement("div");
    const input = document.createElement("input");
    const output = document.createElement("output");

    input.id = `editable-control-${index}`;
    label.htmlFor = input.id;
    label.textContent = control.label;
    output.htmlFor = input.id;

    if (control.kind === "color") {
      row.className = "color-row";
      input.type = "color";
      input.value = control.defaultValue;
    } else if (control.kind === "range") {
      row.className = "size-row";
      input.type = "range";
      input.min = String(control.min);
      input.max = String(control.max);
      input.step = String(control.step);
      input.value = String(control.defaultValue);
    } else if (control.kind === "toggle") {
      row.className = "toggle-row";
      input.type = "checkbox";
      input.checked = control.defaultValue;
    } else {
      row.className = "select-row";
      const select = document.createElement("select");
      select.id = input.id;
      input.removeAttribute("id");
      for (const option of control.options) {
        const choice = document.createElement("option");
        choice.value = option.value;
        choice.textContent = option.label;
        select.appendChild(choice);
      }
      select.value = control.defaultValue;
      row.appendChild(select);
    }

    const format = (value) => control.kind === "color"
      ? value.toUpperCase()
      : control.kind === "range"
        ? `${value}${control.unit}`
        : control.kind === "toggle"
          ? value ? "Activado" : "Desactivado"
          : control.options.find((option) => option.value === value)?.label || value;
    output.textContent = format(control.defaultValue);

    const controlElement = control.kind === "select" ? row.querySelector("select") : input;
    controlElement.addEventListener("change", () => {
      if (selectedResource !== resource || el.customize.hidden) return;
      const value = control.kind === "color" || control.kind === "select"
        ? controlElement.value
        : control.kind === "toggle"
          ? controlElement.checked
          : Number(controlElement.value);
      if (control.kind === "color") {
        if (!/^#[0-9a-f]{6}$/i.test(value)) return;
      } else if (control.kind === "range") {
        if (!Number.isFinite(value) || value < control.min || value > control.max) return;
      } else if (control.kind === "select") {
        if (!control.options.some((option) => option.value === value)) return;
      }

      selectedValues[control.id] = value;
      output.textContent = format(value);
      redrawEditablePreview();
    });
    if (control.kind === "color" || control.kind === "range") {
      controlElement.addEventListener("input", () => {
        if (selectedResource !== resource || el.customize.hidden) return;
        const value = control.kind === "color" ? controlElement.value
          : Number(controlElement.value);
        if (control.kind === "color") {
          if (!/^#[0-9a-f]{6}$/i.test(value)) return;
        } else if (!Number.isFinite(value) ||
          value < control.min || value > control.max) return;
        selectedValues[control.id] = value;
        output.textContent = format(value);
        redrawEditablePreview();
      });
    }

    if (control.kind !== "select") row.appendChild(input);
    row.appendChild(output);
    field.append(label, row);
    el.customizeControls.appendChild(field);
  }
  el.customize.hidden = controls.length === 0;
}

async function openDetail(id) {
  selectedResource = null;
  selectedValues = {};
  el.customize.hidden = true;
  el.customizeControls.replaceChildren();
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
    renderEditableControls(resource);
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
  const isLottie = ["lottie", "dotlottie-web"].includes(resource.runtime?.renderer);
  el.preview.setAttribute("sandbox", doc && isLottie ? "allow-scripts" : "");
  if (doc) {
    el.previewFallback.hidden = true;
    el.preview.hidden = false;
    el.preview.srcdoc = doc;
    el.previewNote.textContent = isLottie
      ? "Vista previa Lottie animada con reproductor local y aislamiento de seguridad."
      : "Preview segura generada desde nuestra copia persistente.";
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

async function redrawEditablePreview() {
  const resource = selectedResource;
  if (!resource || el.customize.hidden) return;
  const values = { ...selectedValues };
  const doc = await previewDoc(resource, values);
  if (
    doc && selectedResource === resource &&
    Object.keys(selectedValues).length === Object.keys(values).length &&
    Object.entries(values).every(([id, value]) => selectedValues[id] === value)
  ) {
    el.preview.srcdoc = doc;
  }
}

el.resetCustomize.addEventListener("click", () => {
  if (!selectedResource || el.customize.hidden) return;

  selectedValues = defaultEditableValues(selectedResource);
  renderEditableControls(selectedResource);
  redrawEditablePreview();
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
