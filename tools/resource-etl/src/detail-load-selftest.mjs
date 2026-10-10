import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

// Run the actual asynchronous detail loader with controllable response order.
const source = await readFile(new URL("../resource-browser/app.mjs", import.meta.url), "utf8");
const loader = source.slice(source.indexOf("async function openDetail("), source.indexOf("async function refreshIndex("));
const redraw = source.slice(source.indexOf("async function redrawEditablePreview("), source.indexOf('el.previewReplay.addEventListener("click"'));
const replay = source.slice(source.indexOf('el.previewReplay.addEventListener("click"'), source.indexOf('el.resetCustomize.addEventListener("click"'));
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const resources = new Map(), previews = new Map(), rendered = [];
const el = Object.fromEntries(["customize", "customizeControls", "apply", "applyStatus", "detailTitle", "detailId", "preview", "previewReplay", "previewFallback", "code", "detailProvider", "detailDescription", "detailLicense", "detailAuthor", "detailControls", "detailArtifacts", "detailBadges", "copyId", "copyCode", "previewNote"].map(key => [key, { textContent: "", replaceChildren() {}, setAttribute() {} }]));
el.detail = { open: false, showModal() { this.open = true; } };
el.previewReplay.addEventListener = (type, handler) => { el.previewReplay[type] = handler; };
const context = {
  el, detailRevision: 0, previewRevision: 0, previewReplayRevision: 0, selectedResource: null, selectedValues: {},
  editResourceId: null, editInitialValues: {}, rememberCategories() {},
  vault: { getResource(id) { const gate = deferred(); resources.set(id, gate); return gate.promise; } },
  previewDoc(resource) { const gate = deferred(); previews.set(resource.id, gate); return gate.promise; },
  renderEditableControls(resource) { rendered.push(resource.id); el.customize.hidden = false; }, updateApplyReadiness() {},
  mainArtifact: resource => ({ content: resource.id + " code" }), badge: value => value,
  isLottieLivePreview: () => false, isCssShakeLivePreview: () => false,
  isMagicCssLivePreview: () => false, hasUiverseCssAnimation: () => false
};
runInNewContext(loader + redraw + replay, context);
const resource = id => ({ id, title: id, runtime: {} });
const resolveResource = async id => { resources.get(id).resolve(resource(id)); await new Promise(setImmediate); };

el.detailLicense.textContent = "Previous license";
el.detailProvider.textContent = "Previous provider";
el.detailBadges.innerHTML = "Previous badges";
const first = context.openDetail("first"), second = context.openDetail("second");
assert.equal(el.detailLicense.textContent, "");
assert.equal(el.detailProvider.textContent, "");
assert.equal(el.detailBadges.innerHTML, "");
assert.equal(el.copyId.disabled, true);
assert.equal(el.copyCode.disabled, true);
assert.equal(el.preview.hidden, false, "The blank loading frame retains its layout");
assert.equal(el.previewFallback.hidden, false, "Loading overlay covers the blank frame");
await resolveResource("second");
previews.get("second").resolve("second preview");
await second;
await resolveResource("first");
await first;
assert.deepEqual(rendered, ["second"], "An older resource response cannot rebuild the current controls");
assert.equal(context.selectedResource.id, "second");
assert.equal(el.preview.srcdoc, "second preview");
assert.equal(previews.has("first"), false);
assert.equal(el.copyId.disabled, false);
assert.equal(el.copyCode.disabled, false);

const closedResource = context.openDetail("closed-resource");
el.detail.open = false;
await resolveResource("closed-resource");
await closedResource;
assert.equal(context.selectedResource, null);
assert.equal(previews.has("closed-resource"), false);

const oldPreview = context.openDetail("old-preview");
await resolveResource("old-preview");
const newPreview = context.openDetail("new-preview");
await resolveResource("new-preview");
previews.get("new-preview").resolve("new preview");
await newPreview;
previews.get("old-preview").resolve("obsolete preview");
await oldPreview;
assert.equal(el.preview.srcdoc, "new preview", "An older preview response cannot replace the current preview");
assert.equal(el.detailId.textContent, "new-preview");

const closedPreview = context.openDetail("closed-preview");
await resolveResource("closed-preview");
el.detail.open = false;
previews.get("closed-preview").resolve("closed preview");
await closedPreview;
assert.equal(el.preview.srcdoc, "");

const oldFailure = context.openDetail("old-failure");
const liveFailure = context.openDetail("live-failure");
resources.get("live-failure").reject(new Error("offline"));
await liveFailure;
assert.equal(el.detailTitle.textContent, "No pude cargar el recurso");
assert.equal(el.apply.disabled, true);
resources.get("old-failure").reject(new Error("obsolete error"));
await oldFailure;
assert.equal(el.previewNote.textContent, "offline", "An obsolete error cannot overwrite the current message");

const previewFailure = context.openDetail("preview-failure");
await resolveResource("preview-failure");
previews.get("preview-failure").reject(new Error("renderer unavailable"));
await previewFailure;
assert.equal(context.selectedResource.id, "preview-failure");
assert.equal(el.code.textContent, "preview-failure code");
assert.equal(el.preview.hidden, true);

// Refresh the real index loader against select elements that clear removed options.
const makeSelect = value => ({
  value, options: [{ value: "" }, { value }],
  remove(index) {
    if (this.options[index].value === this.value) this.value = "";
    this.options.splice(index, 1);
  }
});
const refreshEl = {
  provider: makeSelect("smoke"), family: makeSelect("icon"), kind: makeSelect("svg"),
  status: {}, total: {}, search: { value: "Ícono" }
};
let availableFacets = { providers: [{ value: "smoke" }], families: [{ value: "icon" }], kinds: [{ value: "svg" }] };
const refreshedFilters = [];
let invalidatedSearches = 0;
const refreshContext = {
  el: refreshEl, offset: 48, searchTimer: null,
  clearTimeout() {},
  resultSearch: { invalidate() { invalidatedSearches++; } },
  vault: { async loadManifest() {}, async loadBrowseIndex() { return { resourceCount: 2 }; }, async facets() { return availableFacets; } },
  fillSelect(select, items) { select.options.push(...items); },
  async renderResults() { refreshedFilters.push([refreshEl.provider.value, refreshEl.family.value, refreshEl.kind.value, refreshEl.search.value]); }
};
runInNewContext(source.slice(source.indexOf("async function refreshIndex("), source.indexOf('el.search.addEventListener("input"')), refreshContext);
await refreshContext.refreshIndex();
assert.deepEqual(refreshedFilters[0], ["smoke", "icon", "svg", "Ícono"]);
assert.equal(refreshContext.offset, 0);
availableFacets = { providers: [], families: [{ value: "icon" }], kinds: [{ value: "svg" }] };
await refreshContext.refreshIndex();
assert.deepEqual(refreshedFilters[1], ["", "icon", "svg", "Ícono"], "Only unavailable filters are cleared");
assert.equal(invalidatedSearches, 2, "Refreshing the index invalidates obsolete searches");
assert.match(el.previewNote.textContent, /renderer unavailable/);

const initial = context.openDetail("initial-vs-edit");
await resolveResource("initial-vs-edit");
const initialGate = previews.get("initial-vs-edit");
context.selectedValues.size = 40;
const adjusted = context.redrawEditablePreview();
previews.get("initial-vs-edit").resolve("adjusted preview");
await adjusted;
initialGate.resolve("initial preview");
await initial;
assert.equal(el.preview.srcdoc, "adjusted preview", "The initial preview cannot replace a later adjustment");
assert.equal(el.preview.hidden, false);
assert.equal(el.previewFallback.hidden, true);

const sameValuesOld = context.redrawEditablePreview();
const oldGate = previews.get("initial-vs-edit");
context.selectedValues.size = 48;
const intermediate = context.redrawEditablePreview();
const middleGate = previews.get("initial-vs-edit");
context.selectedValues.size = 40;
const sameValuesNew = context.redrawEditablePreview();
previews.get("initial-vs-edit").resolve("latest preview");
await sameValuesNew;
middleGate.resolve("intermediate preview");
await intermediate;
oldGate.resolve("earlier preview with same values");
await sameValuesOld;
assert.equal(el.preview.srcdoc, "latest preview", "Returning to the same values still preserves the latest request");

const closingAdjustment = context.redrawEditablePreview();
el.detail.open = false;
previews.get("initial-vs-edit").resolve("closed adjustment");
await closingAdjustment;
assert.equal(el.preview.srcdoc, "latest preview");
el.detail.open = true;
el.previewReplay.hidden = false;
const earlierReplay = el.previewReplay.click();
const earlierReplayGate = previews.get("initial-vs-edit");
const laterReplay = el.previewReplay.click();
previews.get("initial-vs-edit").resolve("latest replay");
await laterReplay;
const replayed = el.preview.srcdoc;
earlierReplayGate.resolve("obsolete replay");
await earlierReplay;
assert.equal(el.preview.srcdoc, replayed, "An earlier replay cannot restart the preview after a later replay");
assert.equal(context.previewReplayRevision, 1);
const replayBeforeLiveChanges = el.previewReplay.click();
const liveReplayGate = previews.get("initial-vs-edit");
context.isLottieLivePreview = () => true;
let liveUpdates = 0;
context.updateCssLivePreview = () => { liveUpdates++; };
context.selectedValues.size = 48;
await context.redrawEditablePreview();
context.selectedValues.size = 40;
await context.redrawEditablePreview();
liveReplayGate.resolve("replay before live changes");
await replayBeforeLiveChanges;
assert.equal(el.preview.srcdoc, replayed);
assert.equal(liveUpdates, 2, "Live controls keep their message updates without reloading the frame");
context.isLottieLivePreview = () => false;
context.hasUiverseCssAnimation = () => true;
const savedValues = JSON.stringify(context.selectedValues);
const failedAdjustment = context.redrawEditablePreview();
previews.get("initial-vs-edit").reject(new Error("failed adjustment"));
await failedAdjustment;
assert.equal(el.preview.hidden, true);
assert.match(el.previewNote.textContent, /No pude actualizar/);
assert.equal(JSON.stringify(context.selectedValues), savedValues);
const recoveredAdjustment = context.redrawEditablePreview();
previews.get("initial-vs-edit").resolve("recovered adjustment");
await recoveredAdjustment;
assert.equal(el.preview.hidden, false);
assert.equal(el.preview.srcdoc, "recovered adjustment");
const oldAdjustmentError = context.redrawEditablePreview();
const oldErrorGate = previews.get("initial-vs-edit");
const newAdjustment = context.redrawEditablePreview();
previews.get("initial-vs-edit").resolve("new adjustment");
await newAdjustment;
oldErrorGate.reject(new Error("obsolete adjustment error"));
await oldAdjustmentError;
assert.equal(el.preview.hidden, false);
assert.equal(el.preview.srcdoc, "new adjustment");
const failedReplay = el.previewReplay.click();
previews.get("initial-vs-edit").reject(new Error("failed replay"));
await failedReplay;
assert.equal(el.preview.srcdoc, "new adjustment");
assert.match(el.previewNote.textContent, /No pude volver a reproducir/);
assert.equal(JSON.stringify(context.selectedValues), savedValues);
const recoveredReplay = el.previewReplay.click();
previews.get("initial-vs-edit").resolve("recovered replay");
await recoveredReplay;
assert.match(el.preview.srcdoc, /recovered replay/);
assert.doesNotMatch(el.previewNote.textContent, /No pude/);
const missing = context.openDetail("missing");
resources.get("missing").resolve(null);
await missing;
assert.equal(el.detailTitle.textContent, "No encontré el recurso");
assert.equal(el.copyId.disabled, true);
assert.equal(el.copyCode.disabled, true);
assert.equal(el.preview.hidden, true);
