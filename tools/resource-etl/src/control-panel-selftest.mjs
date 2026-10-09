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
const inputs = el.customizeControls.querySelectorAll("input");
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
context.renderEditableControls(resource, { preserveGroups: true });
assert.equal(el.customizeControls.querySelectorAll("input")[1].value, "32");
assert.equal(el.customizeControls.querySelector("select").value, "reverse");
for (const control of controls) values[control.id] = control.defaultValue;
context.renderEditableControls(resource, { preserveGroups: true });
sections = el.customizeControls.querySelectorAll("details");
assert.deepEqual(sections.map(s => s.open), [false, false, true]);
assert.match(el.customizeControls.children[0].textContent, /0 modificados/);
assert.equal(el.resetCustomize.disabled, true);
assert.equal(el.customizeControls.querySelectorAll("input")[1].value, "24");
context.renderEditableControls(resource);
assert.deepEqual(el.customizeControls.querySelectorAll("details").map(s => s.open), [true, false, false]);
