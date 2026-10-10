import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { groupEditableControls, countChangedControls, matchesControlSearch } from "../resource-browser/control-groups.mjs";

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
assert.equal(matchesControlSearch(controls[1], "  TAMANO  "), true);
assert.equal(matchesControlSearch(controls[3], "direccio\u0301n"), true);
assert.equal(matchesControlSearch(controls[3], "uiverseplay1"), true);
assert.equal(matchesControlSearch(controls[0], "   "), true);
assert.equal(matchesControlSearch(controls[0], "<script>"), false);

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
const resource = { id: "panel-test", runtime: { renderer: "nagweb-svg" } };
const values = {};
let redraws = 0;
const source = await readFile(new URL("../resource-browser/app.mjs", import.meta.url), "utf8");
const renderer = source.slice(source.indexOf("function renderEditableControls("), source.indexOf("async function openDetail("));
const context = {
  document: { createElement: tag => new Element(tag) }, el,
  selectedResource: resource, selectedValues: values,
  categoryStates: new Map(),
  rememberCategories: () => {
    context.categoryStates.set(resource.id, new Map(el.customizeControls.querySelectorAll("details").map(group => [group.dataset.category, group.open])));
  },
  describeEditableControls: () => controls, groupEditableControls, countChangedControls, matchesControlSearch,
  redrawEditablePreview: () => { redraws += 1; }
};
runInNewContext(renderer, context);
context.renderEditableControls(resource);
let sections = el.customizeControls.querySelectorAll("details");
assert.deepEqual(sections.map(s => s.open), [true, false, false]);
sections[0].open = false;
sections[2].open = true;
const editableInputs = () => el.customizeControls.querySelectorAll("input")
  .filter(input => !input.dataset.changedOnly && !input.dataset.searchControls);
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
animationReset.focus();
animationReset.events.click();
assert.equal(context.document.activeElement, sections[2].querySelector("summary"),
  "Restoring a visible category preserves keyboard focus on its heading");
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


// Search composes with changed-only filtering and never mutates the resource's values.
let search = el.customizeControls.querySelectorAll("input").find(input => input.dataset.searchControls);
let clearSearch = el.customizeControls.querySelectorAll("button").find(button => button.className === "secondary clear-control-search");
filter = el.customizeControls.querySelectorAll("input").find(input => input.dataset.changedOnly);
sections = el.customizeControls.querySelectorAll("details");
const searchInputs = editableInputs();
sections[1].open = true;
searchInputs[1].value = "36";
searchInputs[1].events.input();
const searchedSelect = sections[2].querySelector("select");
searchedSelect.value = "reverse";
searchedSelect.events.change();
const searchValues = { ...values };
const searchRedraws = redraws;
assert.equal(search.value, "");
assert.equal(clearSearch.disabled, true);
search.value = "  DIRECCION  ";
search.events.input();
assert.deepEqual(sections.map(section => section.hidden), [true, true, false]);
assert.equal(sections[2].children[1].hidden, true);
assert.equal(sections[2].children[2].hidden, false);
assert.match(sections[2].querySelector("summary").textContent, /1 visibles/);
assert.match(el.customizeControls.children[0].textContent, /1 visibles/);
assert.equal(clearSearch.disabled, false);
filter.checked = true;
filter.events.change();
assert.deepEqual(values, searchValues);
assert.equal(redraws, searchRedraws);
assert.equal(el.customizeControls.querySelector("select"), searchedSelect);
search.value = "color";
search.events.input();
assert.ok(sections.every(section => section.hidden));
assert.match(el.customizeControls.querySelectorAll("p")[1].textContent, /entre los ajustes modificados/);
filter.checked = false;
filter.events.change();
assert.equal(sections[0].hidden, false);
search.value = "<script>alert(1)</script>";
search.events.input();
assert.ok(sections.every(section => section.hidden));
assert.equal(search.value, "<script>alert(1)</script>");
assert.match(el.customizeControls.querySelectorAll("p")[1].textContent, /No hay ajustes que coincidan/);
search.value = "tamano";
search.events.input();
filter.checked = true;
filter.events.change();
clearSearch.events.click();
assert.equal(search.value, "");
assert.equal(filter.checked, true);
assert.deepEqual(sections.map(section => section.hidden), [true, false, false]);
assert.deepEqual(sections.map(section => section.open), [true, true, false]);
assert.equal(context.document.activeElement, search);
assert.deepEqual(values, searchValues);
assert.equal(redraws, searchRedraws);
search.value = "direction-does-not-match";
search.events.input();
context.selectedResource = {};
clearSearch.events.click();
assert.equal(search.value, "direction-does-not-match", "Obsolete buttons cannot change the panel");
context.selectedResource = resource;
search.value = "DIRECCIÓN";
search.events.input();
// Reset the whole category even if search hides some of its modified controls.
filter.checked = false;
filter.events.change();
sections[2].querySelector("input").checked = false;
sections[2].querySelector("input").events.change();
context.document.activeElement = sections[2].querySelector("button");
filter.checked = true;
filter.events.change();
sections[2].querySelector("button").events.click();
assert.equal(values.loop, true);
assert.equal(values.uiversePlay1, "normal");
assert.equal(values.size, 36);
assert.equal(context.document.activeElement, search);
assert.ok(sections.every(section => section.hidden));
context.renderEditableControls(resource, { preserveGroups: true });
search = el.customizeControls.querySelectorAll("input").find(input => input.dataset.searchControls);
assert.equal(search.value, "DIRECCIÓN");
assert.equal(el.customizeControls.querySelectorAll("input").find(input => input.dataset.changedOnly).checked, true);
assert.deepEqual(el.customizeControls.querySelectorAll("details").map(section => section.open), [true, true, false]);
for (const control of controls) values[control.id] = control.defaultValue;
context.renderEditableControls(resource, { preserveGroups: true });
assert.equal(el.customizeControls.querySelectorAll("input").find(input => input.dataset.searchControls).value, "DIRECCIÓN");
assert.ok(el.customizeControls.querySelectorAll("details").every(section => section.hidden));
context.renderEditableControls(resource);
assert.equal(el.customizeControls.querySelectorAll("input").find(input => input.dataset.searchControls).value, "");
assert.ok(el.customizeControls.querySelectorAll("details").every(section => !section.hidden));

// Category actions return keyboard focus to the available opposite action.
const groupButtons = el.customizeControls.querySelectorAll("button");
const expandCategories = groupButtons.find(button => button.textContent === "Expandir categorías");
const collapseCategories = groupButtons.find(button => button.textContent === "Plegar categorías");
const actionRedraws = redraws;
const actionValues = { ...values };
collapseCategories.focus();
collapseCategories.events.click();
assert.equal(collapseCategories.disabled, true);
assert.equal(context.document.activeElement, expandCategories);
expandCategories.events.click();
assert.equal(expandCategories.disabled, true);
assert.equal(context.document.activeElement, collapseCategories);
const actionSearch = el.customizeControls.querySelectorAll("input").find(input => input.dataset.searchControls);
actionSearch.focus();
collapseCategories.events.click();
assert.equal(context.document.activeElement, actionSearch, "Unfocused actions do not move focus");
assert.deepEqual(values, actionValues);
assert.equal(redraws, actionRedraws);
