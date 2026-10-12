import assert from "node:assert/strict";
import { browseLucideShapes } from "./snapshot/browse-lucide-shapes.mjs";
const original = '<svg\n  xmlns="http://www.w3.org/2000/svg"\n' +
  '  width="24" height="24" viewBox="0 0 24 24" fill="none"\n' +
  '  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n' +
  '  <path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" />\n' +
  '  <circle cx="12" cy="13" r="3" />\n</svg>';
const resource = svg => ({
  source: { provider: "lucide" }, runtime: { renderer: "nagweb-svg" },
  artifacts: [{ role: "icon-data", content: svg }]
});
assert.deepEqual(browseLucideShapes(resource(original))?.map(s => s[0]),["path","circle"]);
const geom = browseLucideShapes(resource(original));
assert.equal(geom[0][1].d[0],"M");
assert.deepEqual(geom[1][1],{cx:"12",cy:"13",r:"3"});
const withLine=original.replace('  <circle cx="12" cy="13" r="3" />',
  '  <line x1="1" y1="3" x2="22" y2="8" />');
assert.deepEqual(browseLucideShapes(resource(withLine))?.map(s=>s[0]),["path","line"]);
const withPolyline=original.replace('  <circle cx="12" cy="13" r="3" />',
  '  <polyline points="1,2 10,3 15,12" />');
assert.deepEqual(browseLucideShapes(resource(withPolyline))?.map(s=>s[0]),["path","polyline"]);
assert.equal(browseLucideShapes({...resource(original),source:{provider:"heroicons"}}),null);
for (const evil of [
  original.replace("<path", '<script>alert(1)</script><path'),
  original.replace('r="3"', 'r="3" onload="alert(1)"'),
  original.replace('stroke="currentColor"', 'stroke="url(https://example.test/foo)"'),
  original.replace('viewBox="0 0 24 24"', 'viewBox="0 0 16 16"'),
  original.replace('d="M13.997', 'd="M0 0&quot; onmouseover=&quot;x M13.997'),
  original.replace('<circle cx="12"', '<foreignObject/><circle cx="12"'),
  original.replace('r="3"', 'r="-3"'),
  original + "<svg></svg>"
]) assert.equal(browseLucideShapes(resource(evil)),null,evil.slice(0,60));
console.log("Lucide shape previews: path, circle, line, polyline, and unsafe markup rejection OK.");
