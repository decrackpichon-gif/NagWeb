import {
  createNagWebPersistentVaultClient
} from "../src/runtime/persistent-vault-client.mjs";
import { defaultEditableValues } from "../src/runtime/instance.mjs";
import { describeEditableControls } from "../src/runtime/editable-controls.mjs";
import { groupEditableControls, countChangedControls, matchesControlSearch } from "./control-groups.mjs";
import { htmlWithCustomStyle } from "../src/runtime/html-css-customization.mjs";
import { inferUiverseCssTimingProps } from "../src/runtime/uiverse-timing.mjs";
import { inferUiverseCssMultiTimingProps } from "../src/runtime/uiverse-multi-timing.mjs";
import { buildLottieBrowserPreview } from "../src/preview/lottie-browser-preview.mjs";
import { buildCssShakeBrowserPreview } from "../src/preview/csshake-browser-preview.mjs";
import { buildMagicCssBrowserPreview } from "../src/preview/magiccss-browser-preview.mjs";
import { prepareUiverseSandboxHtml } from "../src/runtime/nagweb-html-sandbox.mjs";
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
  previewReplay: document.querySelector("[data-preview-replay]"),
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
let detailRevision = 0;
let previewRevision = 0;
const categoryStateKey = "nagweb:resource-browser:categories:v1";
const categoryStates = new Map();
try {
  const saved = JSON.parse(sessionStorage.getItem(categoryStateKey) || "[]");
  if (Array.isArray(saved)) for (const entry of saved.slice(-24)) {
    if (Array.isArray(entry) && typeof entry[0] === "string" && Array.isArray(entry[1])) {
      categoryStates.set(entry[0], new Map(entry[1].filter(pair => Array.isArray(pair) && typeof pair[0] === "string" && typeof pair[1] === "boolean")));
    }
  }
} catch { /* Optional organization preferences do not block the library. */ }
function rememberCategories() {
  if (!selectedResource || el.customize.hidden) return;
  const id = selectedResource.id;
  categoryStates.delete(id);
  categoryStates.set(id, new Map([...el.customizeControls.querySelectorAll("details")].map(group => [group.dataset.category, group.open])));
  if (categoryStates.size > 24) categoryStates.delete(categoryStates.keys().next().value);
  try { sessionStorage.setItem(categoryStateKey, JSON.stringify([...categoryStates].map(([id, groups]) => [id, [...groups]]))); }
  catch { /* Keep preferences in memory if session storage is unavailable. */ }
}
let previewReplayRevision = 0;
let searchTimer = null;
let pendingApplyId = null;
let pendingApplyResourceId = null;
let pendingApplyTimer = null;
const applyTarget = resolveResourceApplyTarget();
const editParams = new URLSearchParams(location.search);
// Optional UI hint: absent means a generic host with unrestricted adapters.
const hostKindsText = applyTarget ? editParams.get("hostKinds") : null;
const hostKinds = hostKindsText === null ? null :
  new Set(hostKindsText.split(",").filter(kind => /^(?:svg|uiverse-html|html|react|threejs|css-inline-effect|css-class-effect|lottie)$/.test(kind)));
const editResourceId = applyTarget ? editParams.get("editResource") : null;
const editSession = editResourceId ? editParams.get("editSession") : null;
const editKind = editSession ? editParams.get("editKind") : null;
let editInitialValues = {};
if (editSession) {
  try {
    const encoded = editParams.get("editValues") || "";
    if (encoded.length > 0 && encoded.length <= 8192) {
      const values = JSON.parse(encoded);
      if (editKind === "uiverse-html") {
        if (values && Object.getPrototypeOf(values) === Object.prototype &&
            Object.keys(values).length > 0 && Object.keys(values).length <= 128 &&
            Object.entries(values).every(([key, value]) =>
              /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(key) &&
              (typeof value === "boolean" ||
                (typeof value === "number" && Number.isFinite(value)) ||
                (typeof value === "string" && value.length <= 128)))) {
          editInitialValues = { ...values };
        }
      } else if (Number.isFinite(values.size) && values.size >= 4 && values.size <= 512 &&
          /^#[a-f\d]{6}$/i.test(values.stroke) && Number.isFinite(values.strokeWidth) &&
          values.strokeWidth >= .25 && values.strokeWidth <= 8) {
        editInitialValues = { size: values.size, stroke: values.stroke, strokeWidth: values.strokeWidth };
      }
    }
  } catch { /* Invalid initial values must not enable an edit. */ }
  el.apply.textContent = editKind === "uiverse-html"
    ? "Guardar cambios en el componente" : "Guardar cambios en el ícono";
}

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
    return `<!doctype html><meta name="viewport" content="width=device-width"><style>html,body{height:100%;margin:0}body{display:grid;place-items:center;background:#f4f5f7}.root{display:grid;place-items:center;min-width:100%;min-height:100%;}</style><div class="root" style="${cssVarStyle(resource, values)}">${htmlWithCustomStyle(resource, values, artifact.content)}</div>`;
  }

  if (renderer === "nagweb-css-inline-effect") {
    return buildMagicCssBrowserPreview(resource, values);
  }

  if (renderer === "nagweb-css-class-effect") {
    const dependency = (resource.runtime?.registryDependencies || [])[0];
    const runtime = dependency ? await vault.getResource(dependency) : null;
    const style = (runtime?.artifacts || []).find((item) => item.role === "stylesheet");
    return buildCssShakeBrowserPreview(resource, values, {
      stylesheet: style?.content
    });
  }

  return null;
}

function isLottieLivePreview(resource) {
  return ["lottie", "dotlottie-web"].includes(resource?.runtime?.renderer);
}

function isMagicCssLivePreview(resource) {
  return resource?.source?.provider === "magic-css" &&
    resource?.runtime?.renderer === "nagweb-css-inline-effect";
}

function hasUiverseCssAnimation(resource) {
  if (resource?.source?.provider !== "uiverse" ||
      resource?.runtime?.renderer !== "nagweb-html-tailwind") return false;
  const source = mainArtifact(resource)?.content || "";
  return inferUiverseCssTimingProps(source).length > 0 ||
    inferUiverseCssMultiTimingProps(source).length > 0;
}

function isCssShakeLivePreview(resource) {
  return resource?.source?.provider === "csshake" &&
    resource?.runtime?.renderer === "nagweb-css-class-effect";
}

function updateCssLivePreview(resource) {
  if (
    resource !== selectedResource || !el.detail.open || el.preview.hidden
  ) return;
  const isMagic = isMagicCssLivePreview(resource);
  const isLottie = isLottieLivePreview(resource);
  if (!isMagic && !isCssShakeLivePreview(resource) && !isLottie) return;

  // A sandboxed srcdoc frame has an opaque origin. It validates event.source,
  // resourceId and the permitted message type and values.
  const message = isLottie
    ? {
      type: "nagweb:lottie-preview:update",
      resourceId: resource.id,
      values: { ...selectedValues }
    }
    : isMagic
      ? {
        type: "nagweb:magic-css-preview:update",
        resourceId: resource.id,
        values: { ...selectedValues }
      }
      : {
        type: "nagweb:cssshake-preview:update",
        resourceId: resource.id,
        trigger: selectedValues.trigger
      };
  el.preview.contentWindow?.postMessage(message, "*");
}

el.preview.addEventListener("load", () => {
  updateCssLivePreview(selectedResource);
});

function updateApplyReadiness(resource) {
  el.apply.disabled = true;
  if (editResourceId && (!editSession || resource?.id !== editResourceId || !Object.keys(editInitialValues).length)) {
    el.applyStatus.textContent = "Volvé a abrir la personalización desde el ícono seleccionado en NagWeb.";
    return;
  }

  if (!resource?.id) {
    el.applyStatus.textContent = "Recurso no disponible para insertar.";
    return;
  }

  if (!resource.license?.verified) {
    el.applyStatus.textContent = "No se puede insertar: la licencia todavía no está verificada.";
    return;
  }

  let prepared;
  try {
    prepared = buildResourceApplyEnvelope(resource, { requestId: "nagweb-apply-readiness" });
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

  const acceptsUiverseHtml = hostKinds?.has("uiverse-html") &&
    prepared.descriptor.kind === "html" && resource.source?.provider === "uiverse";
  if (hostKinds && !hostKinds.has(prepared.descriptor.kind) && !acceptsUiverseHtml) {
    el.applyStatus.textContent = hostKinds.has("svg")
      ? "Este editor admite SVG y HTML/CSS Uiverse compatibles. Este recurso todavía no se puede insertar, pero podés explorar y copiar su código."
      : "Este editor todavía no admite insertar este tipo de recurso. Podés explorarlo y copiar su código.";
    return;
  }
  if (acceptsUiverseHtml) {
    try {
      prepareUiverseSandboxHtml(prepared);
    } catch (error) {
      el.applyStatus.textContent = "Este componente no se puede insertar de forma segura: " +
        (error?.message || String(error));
      return;
    }
  }

  if (pendingApplyId) {
    el.applyStatus.textContent = "Esperando confirmación del editor…";
    return;
  }

  el.apply.disabled = false;
  el.applyStatus.textContent = "Recurso listo para aplicar en el editor conectado.";
}

function renderEditableControls(resource, { preserveGroups = false } = {}) {
  const previousChangedOnly = el.customizeControls.querySelectorAll("input");
  const changedOnlyWasChecked = [...previousChangedOnly]
    .find(input => input.dataset.changedOnly)?.checked === true;
  const previousSearch = [...previousChangedOnly].find(input => input.dataset.searchControls)?.value || "";
  const previousGroups = new Map([...el.customizeControls.querySelectorAll("details")]
    .map(group => [group.dataset.category, group.open]));
  el.customizeControls.replaceChildren();
  const controls = describeEditableControls(resource);
  const syncControls = new Map();
  const fields = [];
  const overview = document.createElement("p");
  overview.className = "customize-overview";
  overview.setAttribute("role", "status");
  el.customizeControls.appendChild(overview);
  const searchLabel = document.createElement("label");
  searchLabel.className = "control-search";
  const searchText = document.createElement("span");
  searchText.textContent = "Buscar ajustes";
  const search = document.createElement("input");
  search.type = "search";
  search.maxLength = 120;
  search.dataset.searchControls = "true";
  search.placeholder = "Nombre del ajuste";
  search.value = preserveGroups ? previousSearch : "";
  searchLabel.append(searchText, search);
  el.customizeControls.appendChild(searchLabel);
  const clearSearch = document.createElement("button");
  clearSearch.type = "button";
  clearSearch.className = "secondary clear-control-search";
  clearSearch.textContent = "Limpiar búsqueda";
  el.customizeControls.appendChild(clearSearch);
  const filterLabel = document.createElement("label");
  filterLabel.className = "changed-only";
  const changedOnly = document.createElement("input");
  changedOnly.type = "checkbox";
  changedOnly.dataset.changedOnly = "true";
  changedOnly.checked = preserveGroups && changedOnlyWasChecked;
  const filterText = document.createElement("span");
  filterText.textContent = "Mostrar solo ajustes modificados";
  filterLabel.append(changedOnly, filterText);
  el.customizeControls.appendChild(filterLabel);
  const emptyChanges = document.createElement("p");
  emptyChanges.textContent = "No hay ajustes modificados. Desmarcá el filtro para ver todos.";
  el.customizeControls.appendChild(emptyChanges);
  const categoryActions = document.createElement("div");
  const expand = document.createElement("button");
  const collapse = document.createElement("button");
  for (const [button, label, open] of [[expand, "Expandir categorías", true], [collapse, "Plegar categorías", false]]) {
    button.type = "button";
    button.className = "secondary";
    button.textContent = label;
    button.addEventListener("click", () => {
      if (selectedResource !== resource || el.customize.hidden) return;
      for (const group of groups) if (!group.section.hidden) group.section.open = open;
      rememberCategories();
      updateCategoryActions();
    });
    categoryActions.appendChild(button);
  }
  el.customizeControls.appendChild(categoryActions);
  const rememberedGroups = categoryStates.get(resource.id);
  const groups = groupEditableControls(controls).map((group, index) => {
    const section = document.createElement("details");
    section.className = "control-group";
    section.dataset.category = group.id;
    section.open = preserveGroups && previousGroups.has(group.id)
      ? previousGroups.get(group.id) : rememberedGroups?.get(group.id) ?? index === 0;
    section.addEventListener("toggle", () => {
      if (selectedResource !== resource || el.customize.hidden) return;
      rememberCategories();
      updateCategoryActions();
    });
    const summary = document.createElement("summary");
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "secondary reset-category";
    reset.textContent = `Restaurar ${group.label.toLowerCase()}`;
    reset.title = "Restaura toda la categoría, incluidos los ajustes ocultos por los filtros.";
    reset.addEventListener("click", () => {
      if (selectedResource !== resource || el.customize.hidden || reset.disabled) return;
      for (const control of group.controls) {
        selectedValues[control.id] = control.defaultValue;
        syncControls.get(control.id)();
      }
      updateSummary();
      redrawEditablePreview();
    });
    section.appendChild(summary);
    el.customizeControls.appendChild(section);
    return { ...group, section, summary, reset };
  });
  const updateCategoryActions = () => {
    const visible = groups.filter(group => !group.section.hidden);
    expand.disabled = !visible.some(group => !group.section.open);
    collapse.disabled = !visible.some(group => group.section.open);
  };
  const updateSummary = () => {
    const focusedElement = document.activeElement;
    const changed = countChangedControls(controls, selectedValues);
    const hasSearch = search.value.trim().length > 0;
    const visibleIds = new Set();
    const focusTarget = hasSearch ? search : changedOnly;
    for (const { control, field, input } of fields) {
      field.hidden = !matchesControlSearch(control, search.value) ||
        changedOnly.checked && countChangedControls([control], selectedValues) === 0;
      if (!field.hidden) visibleIds.add(control.id);
      // Keep keyboard focus visible when restoring the active control to its default.
      if (field.hidden && focusedElement === input) focusTarget.focus();
    }
    overview.textContent = `${controls.length} ajustes · ${groups.length} categorías · ${changed} modificados` +
      (hasSearch || changedOnly.checked ? ` · ${visibleIds.size} visibles` : "");
    emptyChanges.hidden = visibleIds.size > 0;
    emptyChanges.textContent = hasSearch
      ? changedOnly.checked
        ? "No hay coincidencias entre los ajustes modificados. Limpiá la búsqueda o desmarcá el filtro."
        : "No hay ajustes que coincidan. Limpiá la búsqueda para ver todos."
      : "No hay ajustes modificados. Desmarcá el filtro para ver todos.";
    clearSearch.disabled = search.value.length === 0;
    for (const group of groups) {
      const count = countChangedControls(group.controls, selectedValues);
      group.summary.textContent = `${group.label} (${group.controls.length}) · ${count} modificados`;
      group.reset.disabled = count === 0;
      const visible = group.controls.filter(control => visibleIds.has(control.id)).length;
      if (hasSearch || changedOnly.checked) group.summary.textContent += ` · ${visible} visibles`;
      group.section.hidden = visible === 0;
      if (group.section.hidden &&
          [group.reset, group.summary].includes(focusedElement)) focusTarget.focus();
    }
    el.resetCustomize.disabled = changed === 0;
    updateCategoryActions();
  };
  changedOnly.addEventListener("change", () => {
    if (selectedResource !== resource || el.customize.hidden) return;
    updateSummary();
  });
  search.addEventListener("input", () => {
    if (selectedResource !== resource || el.customize.hidden) return;
    updateSummary();
  });
  clearSearch.addEventListener("click", () => {
    if (selectedResource !== resource || el.customize.hidden || clearSearch.disabled) return;
    search.value = "";
    search.focus();
    updateSummary();
  });
  const renderer = resource.runtime?.renderer;
  el.customizeTitle.textContent = renderer === "nagweb-svg"
    ? "Personalizar ícono"
    : ["lottie", "dotlottie-web", "nagweb-css-class-effect", "nagweb-css-inline-effect"].includes(renderer)
      ? "Personalizar animación"
      : "Personalizar componente CSS";

  for (const [index, control] of controls.entries()) {
    if (!Object.hasOwn(selectedValues, control.id)) selectedValues[control.id] = control.defaultValue;
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
      input.value = selectedValues[control.id];
    } else if (control.kind === "range") {
      row.className = "size-row";
      input.type = "range";
      input.min = String(control.min);
      input.max = String(control.max);
      input.step = String(control.step);
      input.value = String(selectedValues[control.id]);
    } else if (control.kind === "toggle") {
      row.className = "toggle-row";
      input.type = "checkbox";
      input.checked = selectedValues[control.id];
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
      select.value = selectedValues[control.id];
      row.appendChild(select);
    }

    const format = (value) => control.kind === "color"
      ? value.toUpperCase()
      : control.kind === "range"
        ? `${value}${control.unit}`
        : control.kind === "toggle"
          ? value ? "Activado" : "Desactivado"
          : control.options.find((option) => option.value === value)?.label || value;
    output.textContent = format(selectedValues[control.id]);

    const controlElement = control.kind === "select" ? row.querySelector("select") : input;
    fields.push({ control, field, input: controlElement });
    syncControls.set(control.id, () => {
      const value = selectedValues[control.id];
      if (control.kind === "toggle") controlElement.checked = value;
      else controlElement.value = String(value);
      output.textContent = format(value);
    });
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
      updateSummary();
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
        updateSummary();
        redrawEditablePreview();
      });
    }

    if (control.kind !== "select") row.appendChild(input);
    row.appendChild(output);
    field.append(label, row);
    groups.find(group => group.controls.includes(control)).section.appendChild(field);
  }
  for (const group of groups) group.section.appendChild(group.reset);
  updateSummary();
  el.customize.hidden = controls.length === 0;
}

async function openDetail(id) {
  const revision = ++detailRevision;
  previewRevision++;
  const isCurrent = () => revision === detailRevision && el.detail.open;
  rememberCategories();
  selectedResource = null;
  selectedValues = id === editResourceId ? { ...editInitialValues } : {};
  el.customize.hidden = true;
  el.customizeControls.replaceChildren();
  el.apply.disabled = true;
  el.applyStatus.textContent = "Comprobando si el recurso se puede insertar…";
  el.detail.showModal();
  el.detailTitle.textContent = "Cargando recurso…";
  el.detailId.textContent = id;
  for (const field of [el.detailProvider, el.detailDescription, el.detailLicense, el.detailAuthor, el.detailControls, el.detailArtifacts]) field.textContent = "";
  el.detailBadges.innerHTML = "";
  el.copyId.disabled = true;
  el.copyCode.disabled = true;
  el.preview.srcdoc = "";
  el.preview.hidden = true;
  el.previewNote.textContent = "Cargando vista previa…";
  el.previewReplay.hidden = true;
  el.previewFallback.hidden = false;
  el.code.textContent = "";

  let resource;
  try { resource = await vault.getResource(id); }
  catch (error) {
    if (!isCurrent()) return;
    el.detailTitle.textContent = "No pude cargar el recurso";
    el.applyStatus.textContent = "Cerrá la ficha y volvé a intentar abrirla.";
    el.preview.hidden = true;
    el.previewNote.textContent = error?.message || String(error);
    return;
  }
  if (!isCurrent()) return;
  selectedResource = resource;
  if (resource) {
    renderEditableControls(resource);
  }
  updateApplyReadiness(resource);

  if (!resource) {
    el.detailTitle.textContent = "No encontré el recurso";
    el.previewNote.textContent = "No hay una vista previa disponible para este recurso.";
    return;
  }
  el.copyId.disabled = false;

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

  let doc, previewError;
  const previewRequest = ++previewRevision;
  try { doc = await previewDoc(resource, selectedValues); }
  catch (error) { previewError = error?.message || String(error); }
  if (!isCurrent() || previewRequest !== previewRevision) return;
  const isLottie = isLottieLivePreview(resource);
  const isCssShake = isCssShakeLivePreview(resource);
  const isMagicCss = isMagicCssLivePreview(resource);
  el.preview.setAttribute("sandbox",
    doc && (isLottie || isMagicCss || isCssShake) ? "allow-scripts" : "");
  const uiverseAnimated = hasUiverseCssAnimation(resource);
  el.previewReplay.hidden = !doc || !(isCssShake || isMagicCss || uiverseAnimated);
  if (doc) {
    el.previewFallback.hidden = true;
    el.preview.hidden = false;
    el.preview.srcdoc = doc;
    el.previewNote.textContent = isLottie
      ? "Velocidad y repetición cambian sin reiniciar. La reproducción automática controla inicio y pausa."
      : isCssShake
        ? "Compará Hover y Siempre sin reiniciar. La pausa se conserva al cambiar de modo."
        : isMagicCss
          ? "Los ajustes se actualizan sin reiniciar la vista previa; podés pausar y reanudar."
          : uiverseAnimated
            ? "Podés volver a reproducir las animaciones CSS. Los efectos Hover se activan al pasar el cursor."
            : "Preview segura generada desde nuestra copia persistente.";
  } else {
    el.preview.hidden = true;
    el.previewFallback.hidden = false;
    el.previewNote.textContent = previewError
      ? "No pude generar la vista previa: " + previewError
      : "Este tipo requiere el renderer/compilador completo de NagWeb. El recurso y su código sí están guardados.";
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
el.detail.addEventListener("close", rememberCategories);
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
  if (!resource || el.customize.hidden || !el.detail.open) return;
  if (
    isLottieLivePreview(resource) ||
    isMagicCssLivePreview(resource) ||
    isCssShakeLivePreview(resource)
  ) {
    if (el.preview.srcdoc) previewRevision++;
    updateCssLivePreview(resource);
    return;
  }
  const values = { ...selectedValues };
  const request = ++previewRevision;
  let doc;
  try { doc = await previewDoc(resource, values); }
  catch {
    if (request === previewRevision && el.detail.open && selectedResource === resource) {
      el.preview.hidden = true;
      el.previewFallback.hidden = false;
      el.previewNote.textContent = "No pude actualizar la vista previa. Volvé a intentar cambiar el ajuste.";
    }
    return;
  }
  if (
    doc && request === previewRevision && el.detail.open && selectedResource === resource &&
    Object.keys(selectedValues).length === Object.keys(values).length &&
    Object.entries(values).every(([id, value]) => selectedValues[id] === value)
  ) {
    el.preview.setAttribute("sandbox", "");
    el.preview.hidden = false;
    el.previewFallback.hidden = true;
    const animated = hasUiverseCssAnimation(resource);
    el.previewReplay.hidden = !animated;
    el.previewNote.textContent = animated
      ? "Podés volver a reproducir las animaciones CSS. Los efectos Hover se activan al pasar el cursor."
      : "Preview segura generada desde nuestra copia persistente.";
    el.preview.srcdoc = doc;
  }
}

el.previewReplay.addEventListener("click", async () => {
  const resource = selectedResource;
  if (!resource || el.previewReplay.hidden || !el.detail.open) return;
  const values = { ...selectedValues };
  const request = ++previewRevision;
  let doc;
  try { doc = await previewDoc(resource, values); }
  catch {
    if (request === previewRevision && el.detail.open && selectedResource === resource) {
      el.previewNote.textContent = "No pude volver a reproducir la vista previa. Volvé a intentar.";
    }
    return;
  }
  if (
    !doc || request !== previewRevision || selectedResource !== resource || !el.detail.open ||
    el.previewReplay.hidden ||
    Object.keys(selectedValues).length !== Object.keys(values).length ||
    !Object.entries(values).every(([id, value]) => selectedValues[id] === value)
  ) return;

  // Force a new srcdoc navigation for supported CSS animations without
  // injecting scripts into the sandboxed content or changing Apply values.
  previewReplayRevision += 1;
  el.preview.srcdoc = `${doc}\n<!-- css-preview-replay:${previewReplayRevision} -->`;
  el.previewNote.textContent = "La vista previa volvió a empezar con tus ajustes.";
});

el.resetCustomize.addEventListener("click", () => {
  if (!selectedResource || el.customize.hidden) return;

  selectedValues = defaultEditableValues(selectedResource);
  renderEditableControls(selectedResource, { preserveGroups: true });
  redrawEditablePreview();
});

el.apply.addEventListener("click", () => {
  if (!selectedResource || !applyTarget || pendingApplyId || el.apply.disabled) return;

  try {
    const envelope = buildResourceApplyEnvelope(selectedResource, {
      values: { ...selectedValues }
    });
    if (editSession) envelope.editSession = editSession;
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
  if (editResourceId) await openDetail(editResourceId);
} catch (error) {
  console.error(error);
  el.status.textContent = `No pude cargar la biblioteca: ${error?.message || error}`;
}
