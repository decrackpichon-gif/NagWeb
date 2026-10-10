import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

// Run the actual asynchronous detail loader with controllable response order.
const source = await readFile(new URL("../resource-browser/app.mjs", import.meta.url), "utf8");
const loader = source.slice(source.indexOf("async function openDetail("), source.indexOf("async function refreshIndex("));
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const resources = new Map(), previews = new Map(), rendered = [];
const el = Object.fromEntries(["customize", "customizeControls", "apply", "applyStatus", "detailTitle", "detailId", "preview", "previewReplay", "previewFallback", "code", "detailProvider", "detailDescription", "detailLicense", "detailAuthor", "detailControls", "detailArtifacts", "detailBadges", "copyCode", "previewNote"].map(key => [key, { textContent: "", replaceChildren() {}, setAttribute() {} }]));
el.detail = { open: false, showModal() { this.open = true; } };
const context = {
  el, detailRevision: 0, selectedResource: null, selectedValues: {},
  editResourceId: null, editInitialValues: {}, rememberCategories() {},
  vault: { getResource(id) { const gate = deferred(); resources.set(id, gate); return gate.promise; } },
  previewDoc(resource) { const gate = deferred(); previews.set(resource.id, gate); return gate.promise; },
  renderEditableControls(resource) { rendered.push(resource.id); }, updateApplyReadiness() {},
  mainArtifact: resource => ({ content: resource.id + " code" }), badge: value => value,
  isLottieLivePreview: () => false, isCssShakeLivePreview: () => false,
  isMagicCssLivePreview: () => false, hasUiverseCssAnimation: () => false
};
runInNewContext(loader, context);
const resource = id => ({ id, title: id, runtime: {} });
const resolveResource = async id => { resources.get(id).resolve(resource(id)); await new Promise(setImmediate); };

const first = context.openDetail("first"), second = context.openDetail("second");
await resolveResource("second");
previews.get("second").resolve("second preview");
await second;
await resolveResource("first");
await first;
assert.deepEqual(rendered, ["second"], "An older resource response cannot rebuild the current controls");
assert.equal(context.selectedResource.id, "second");
assert.equal(el.preview.srcdoc, "second preview");
assert.equal(previews.has("first"), false);

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
assert.match(el.previewNote.textContent, /renderer unavailable/);
