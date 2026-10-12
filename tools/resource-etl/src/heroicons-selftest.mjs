import assert from "node:assert/strict";
import { normalizeHeroiconOutline, selectHeroicons, HEROICONS_FEATURED } from "./extractors/heroicons.mjs";
import { transformHeroiconOutline } from "./heroicons-transformer.mjs";
import { buildInsertDescriptor } from "./runtime/insert-adapters.mjs";
import { buildStaticPreview } from "./preview/build-preview.mjs";
import { getSourcePolicy } from "./vault/source-policies.mjs";

const sha = "1234567890abcdef1234567890abcdef12345678";
const make = name => ({ name: name + ".svg", path: "optimized/24/outline/" + name + ".svg", sha, type: "file" });
const selected = selectHeroicons([make("arrow-left"), make("camera"), make("academic-cap"), make("photo")], { limit: 3 });
assert.deepEqual(selected.selected.map(e => e.name), ["academic-cap", "camera", "photo"]);
assert.equal(selected.available, 4);
assert.deepEqual(selectHeroicons([make("arrow-left"),make("camera")],{all:true}).selected.map(e=>e.name),["arrow-left","camera"]);
assert.equal(HEROICONS_FEATURED.length > 20, true);
assert.throws(()=>selectHeroicons([make("photo"),make("photo")]),/Duplicate/);

const upstream = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon">\n' +
  '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>\n</svg>';
const normalized = normalizeHeroiconOutline(upstream);
assert.match(normalized,/width="24"/);
assert.match(normalized,/stroke-linecap="round"/);
assert.ok(normalized.includes('<path d="M6 18 18 6M6 6l12 12"/>'));
assert.doesNotMatch(normalized,/aria-hidden|data-slot|currentColor/);
for (const malicious of [
  upstream.replace("<path", '<script>alert(1)</script><path'),
  upstream.replace('data-slot="icon"', 'onload="alert(1)"'),
  upstream.replace('d="M6 18 18 6M6 6l12 12"', 'd="M0 0&quot; onload=&quot;evil"'),
  upstream.replace('fill="none"', 'fill="red"'),
  upstream.replace('stroke-linecap="round"', 'stroke-linecap="square"'),
  upstream.replace('viewBox="0 0 24 24"', 'viewBox="0 0 16 16"'),
  upstream + "<svg></svg>"
]) assert.throws(()=>normalizeHeroiconOutline(malicious),/SVG|Heroicons|unsupported|Unsupported/);

const licenseText="MIT License\n\nCopyright (c) Tailwind Labs, Inc.\nPermission notice.";
const item={name:"x-mark",path:"optimized/24/outline/x-mark.svg",sha,sourceSvg:upstream,svg:normalized};
const resource=transformHeroiconOutline({item,commit:sha,licenseText});
assert.equal(resource.id,"heroicons:x-mark");
assert.equal(resource.source.provider,"heroicons");
assert.equal(resource.license.id,"MIT");
assert.ok(resource.license.verified);
assert.equal(resource.runtime.renderer,"nagweb-svg");
assert.ok(resource.artifacts.some(a=>a.targetPath==="LICENSE.txt"&&a.content===licenseText));
assert.ok(resource.artifacts.some(a=>a.targetPath==="upstream.svg"&&a.content===upstream));
assert.equal(getSourcePolicy("heroicons").mirrorMode,"full");
const descriptor=buildInsertDescriptor(resource,{values:{size:46,stroke:"#123456",strokeWidth:2.5}});
assert.equal(descriptor.kind,"svg");
assert.equal(descriptor.payload.stroke,"#123456");
assert.equal(descriptor.payload.size,46);
assert.equal(descriptor.payload.strokeWidth,2.5);
assert.equal(descriptor.payload.svg,normalized);
const preview=buildStaticPreview(resource,{values:{size:46,stroke:"#123456",strokeWidth:2.5}});
assert.equal(preview.supported,true);
assert.match(preview.html,/stroke="#123456"/);
assert.match(preview.html,/width="46"/);
console.log("Heroicons native SVG ingest, validation, license, descriptor and offline preview OK.");
