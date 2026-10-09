import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { groupEditableControls, countChangedControls } from "../resource-browser/control-groups.mjs";

const controls = [
  { id: "stroke", label: "Color", kind: "color", defaultValue: "#aabbcc" },
  { id: "size", label: "Tamaño", kind: "range", defaultValue: 24, min: 16, max: 64, step: 1, unit: "px" },
  { id: "loop", label: "Repetir", kind: "toggle", defaultValue: true },
  { id: "uiversePlay1", label: "Dirección", kind: "select", defaultValue: "normal",
    options: [{ value: "normal", label: "Normal" }, { value: "reverse", label: "Inversa" }] }
];
assert.deepEqual(groupEditableControls([]), []);
assert.deepEqual(groupEditableControls(controls).map(g => g.id), ["color", "size", "animation"]);
const categoryCases = [
  ["uiverseLength1", "size"], ["uiverseSpace1", "spacing"],
  ["uiverseDetail1", "appearance"], ["opacity", "appearance"],
  ["uiverseTime1", "animation"], ["uiverseTrack1", "animation"],
  ["uiverseBezier1", "animation"], ["uiverseEase1", "animation"],
  ["customVariable", "other"]
];
for (const [id, expected] of categoryCases) {
  assert.equal(groupEditableControls([{ id, kind: "range" }])[0].id, expected);
}
assert.equal(countChangedControls(controls, { stroke: "#AABBCC", loop: false }), 1);

// Exercise the actual browser renderer and event handlers without a network or DOM dependency.
class Element {
  constructor(tag) { this.tag = tag; this.children = []; this.dataset = {}; this.events = {}; }
  appendChild(child) { this.children.push(child); return child; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(name, value) { this[name] = value; }
  removeAttribute(name) { delete this[name]; }
  addEventListener(name, callback) { this.events[name] = callback; }
  focus() { context.document.activeElement = this; }
  contains(element) { return this === element || this.children.some(child => child.contains(element)); }
  set hidden(value) {
    this.isHidden = value;
    if (value && this.contains(context.document.activeElement)) context.document.activeElement = null;
  }
  get hidden() { return this.isHidden; }
  set disabled(value) {
    this.isDisabled = value;
    if (value && context.document.activeElement === this) context.document.activeElement = null;
  }
  get disabled() { return this.isDisabled; }
  querySelectorAll(tag) {
    return this.children.flatMap(child => [ ...(child.tag === tag ? [child] : []), ...child.querySelectorAll(tag) ]);
  }
  querySelector(tag) { return this.querySelectorAll(tag)[0]; }
}
const el = {
  customizeControls: new Element("div"), customizeTitle: new Element("strong"),
  customize: { hidden: false }, resetCustomize: new Element("button")
};
const resource = { runtime: { renderer: "nagweb-svg" } };
const values = {};
let redraws = 0;
const source = await readFile(new URL("../resource-browser/app.mjs", import.meta.url), "utf8");
const renderer = source.slice(source.indexOf("function renderEditableControls("), source.indexOf("async function openDetail("));
const context = {
  document: { createElement: tag => new Element(tag) }, el,
  selectedResource: resource, selectedValues: values,
  describeEditableControls: () => controls, groupEditableControls, countChangedControls,
  redrawEditablePreview: () => { redraws += 1; }
};
runInNewContext(renderer, context);
context.renderEditableControls(resource);
let sections = el.customizeControls.querySelectorAll("details");
assert.deepEqual(sections.map(s => s.open), [true, false, false]);
sections[0].open = false;
sections[2].open = true;
const editableInputs = () => el.customizeControls.querySelectorAll("input")
  .filter(input => !input.dataset.changedOnly);
const inputs = editableInputs();
inputs[1].value = "32";
inputs[1].events.input();
inputs[2].checked = false;
inputs[2].events.change();
const select = el.customizeControls.querySelector("select");
select.value = "reverse";
select.events.change();
assert.equal(values.size, 32);
assert.equal(values.loop, false);
assert.equal(values.uiversePlay1, "reverse");
assert.equal(redraws, 3);
assert.match(el.customizeControls.children[0].textContent, /3 modificados/);
assert.equal(el.resetCustomize.disabled, false);
const animationReset = sections[2].querySelector("button");
const sizeReset = sections[1].querySelector("button");
assert.equal(sections[0].querySelector("button").disabled, true);
assert.equal(animationReset.disabled, false);
animationReset.events.click();
assert.equal(values.loop, true);
assert.equal(values.uiversePlay1, "normal");
assert.equal(values.size, 32, "Restoring animation preserves another category's edit");
assert.equal(inputs[2].checked, true);
assert.equal(select.value, "normal");
assert.equal(el.customizeControls.querySelector("select"), select, "Reset does not rebuild the DOM");
assert.deepEqual(sections.map(s => s.open), [false, false, true]);
assert.equal(animationReset.disabled, true);
assert.equal(sizeReset.disabled, false);
assert.match(el.customizeControls.children[0].textContent, /1 modificados/);
assert.equal(redraws, 4);
animationReset.events.click();
assert.equal(redraws, 4, "Restoring an unchanged category is a no-op");
context.selectedResource = {};
sizeReset.events.click();
assert.equal(values.size, 32, "A stale resource's button cannot change current values");
context.selectedResource = resource;
el.customize.hidden = true;
sizeReset.events.click();
assert.equal(values.size, 32, "Hidden customization cannot be changed");
el.customize.hidden = false;
sizeReset.events.click();
assert.equal(values.size, 24);
assert.equal(inputs[1].value, "24");
assert.equal(sizeReset.disabled, true);
assert.equal(el.resetCustomize.disabled, true);
assert.equal(redraws, 5);
inputs[0].value = "#112233";
inputs[0].events.input();
const colorReset = sections[0].querySelector("button");
assert.equal(colorReset.disabled, false);
colorReset.events.click();
assert.equal(values.stroke, "#aabbcc");
assert.equal(inputs[0].value, "#aabbcc");
assert.equal(sections[0].querySelector("output").textContent, "#AABBCC");
assert.equal(colorReset.disabled, true);
inputs[1].value = "32";
inputs[1].events.input();
select.value = "reverse";
select.events.change();
context.renderEditableControls(resource, { preserveGroups: true });
assert.equal(editableInputs()[1].value, "32");
assert.equal(el.customizeControls.querySelector("select").value, "reverse");
for (const control of controls) values[control.id] = control.defaultValue;
context.renderEditableControls(resource, { preserveGroups: true });
sections = el.customizeControls.querySelectorAll("details");
assert.deepEqual(sections.map(s => s.open), [false, false, true]);
assert.match(el.customizeControls.children[0].textContent, /0 modificados/);
assert.equal(el.resetCustomize.disabled, true);
assert.equal(editableInputs()[1].value, "24");
context.renderEditableControls(resource);
assert.deepEqual(el.customizeControls.querySelectorAll("details").map(s => s.open), [true, false, false]);

// Filtering is presentation only: no preview redraw, no value loss or DOM rebuild.
let filter = el.customizeControls.querySelectorAll("input").find(input => input.dataset.changedOnly);
sections = el.customizeControls.querySelectorAll("details");
const editedInputs = editableInputs();
const beforeFilterRedraws = redraws;
assert.equal(filter.checked, false);
filter.checked = true;
filter.events.change();
assert.ok(sections.every(section => section.hidden));
assert.equal(el.customizeControls.querySelectorAll("p")[1].hidden, false);
assert.equal(redraws, beforeFilterRedraws);
filter.checked = false;
filter.events.change();
assert.ok(sections.every(section => !section.hidden));
sections[1].open = true;
editedInputs[1].value = "40";
editedInputs[1].events.input();
const animationSelect = sections[2].querySelector("select");
animationSelect.value = "reverse";
animationSelect.events.change();
const beforeValues = { ...values };
const beforeChangedFilterRedraws = redraws;
filter.checked = true;
filter.events.change();
assert.deepEqual(values, beforeValues);
assert.equal(redraws, beforeChangedFilterRedraws);
assert.deepEqual(sections.map(section => section.hidden), [true, false, false]);
assert.equal(editedInputs[1], editableInputs()[1]);
assert.equal(sections[1].children[1].hidden, false);
assert.equal(sections[2].children[1].hidden, true, "Unchanged toggles are hidden within a changed category");
assert.equal(sections[2].children[2].hidden, false);
context.document.activeElement = sections[2].querySelector("button");
sections[2].querySelector("button").events.click();
assert.equal(sections[2].hidden, true);
assert.equal(context.document.activeElement, filter);
assert.equal(values.size, 40);
context.document.activeElement = editedInputs[1];
editedInputs[1].value = "24";
editedInputs[1].events.input();
assert.equal(context.document.activeElement, filter, "Hidden focused controls return focus to the filter");
assert.equal(el.customizeControls.querySelectorAll("p")[1].hidden, false);
filter.checked = false;
filter.events.change();
editedInputs[0].value = "#AABBCC";
editedInputs[0].events.input();
filter.checked = true;
filter.events.change();
assert.equal(sections[0].hidden, true, "Color case alone does not count as a modification");
filter.checked = false;
filter.events.change();
editedInputs[1].value = "48";
editedInputs[1].events.input();
filter.checked = true;
filter.events.change();
context.renderEditableControls(resource, { preserveGroups: true });
filter = el.customizeControls.querySelectorAll("input").find(input => input.dataset.changedOnly);
assert.equal(filter.checked, true);
assert.equal(values.size, 48);
assert.deepEqual(el.customizeControls.querySelectorAll("details").map(section => section.open), [true, true, false]);
for (const control of controls) values[control.id] = control.defaultValue;
context.renderEditableControls(resource, { preserveGroups: true });
assert.equal(el.customizeControls.querySelectorAll("input").find(input => input.dataset.changedOnly).checked, true);
assert.ok(el.customizeControls.querySelectorAll("details").every(section => section.hidden));
assert.equal(el.customizeControls.querySelectorAll("p")[1].hidden, false);
context.renderEditableControls(resource);
assert.equal(el.customizeControls.querySelectorAll("input").find(input => input.dataset.changedOnly).checked, false);
assert.ok(el.customizeControls.querySelectorAll("details").every(section => !section.hidden));
