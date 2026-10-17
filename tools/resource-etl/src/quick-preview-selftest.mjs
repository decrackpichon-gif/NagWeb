import assert from "node:assert/strict";
import { canQuickPreview, offlineQuickPreviewDoc } from "./runtime/quick-preview.mjs";
import { buildMotionNativePreview, realCardPreviewEligible, schematicMarkup, illustrativePreviewDoc } from "./preview/visual-previews.mjs";

assert.equal(canQuickPreview({provider:"uiverse",editorUse:"uiverse-html"}),true);
assert.equal(canQuickPreview({provider:"uiverse",editorUse:"code"}),false);
assert.equal(canQuickPreview({provider:"spinkit",editorUse:"spinkit-html"}),true);
assert.equal(canQuickPreview({provider:"spinkit",editorUse:"code"}),false);
assert.equal(canQuickPreview({provider:"magicui",editorUse:"uiverse-html"}),false);
assert.equal(canQuickPreview({provider:"heroicons",editorUse:"svg"}),false);
assert.equal(canQuickPreview(null),false);

const original='<!doctype html><meta name="viewport" content="width=device-width"><style>.demo{color:red}</style><button class="demo">Real</button>';
const preview=offlineQuickPreviewDoc(original);
assert.match(preview,/^<!doctype html><meta http-equiv="Content-Security-Policy"/);
assert.match(preview,/default-src 'none'/);
assert.match(preview,/style-src 'unsafe-inline'/);
assert.match(preview,/img-src data:/);
assert.match(preview,/form-action 'none'/);
assert.equal(preview.includes(original.slice(15)),true,"Keep the original live component and its CSS");
assert.equal((preview.match(/Content-Security-Policy/g)||[]).length,1);
const fallback=offlineQuickPreviewDoc("<button>real sample</button>");
assert.match(fallback,/^<!doctype html>/);
assert.match(fallback,/real sample/);
assert.throws(()=>offlineQuickPreviewDoc(""),/no tiene un documento seguro/);
assert.throws(()=>offlineQuickPreviewDoc("x".repeat(2_000_001)),/no tiene un documento seguro/);
console.log("NagWeb explicitly loaded Uiverse live card preview, strict CSP, no-fetch fallback and eligibility: OK");

const nativeMotion={
  id:"animxyz:preset:back",
  title:"Back",
  source:{provider:"animxyz"},
  license:{verified:true},
  runtime:{renderer:"nagweb-motion-native"},
  artifacts:[{role:"animation-data",format:"json",content:JSON.stringify({
    schema:"nagweb-motion-preset/0.1",duration:0.5,delay:0,ease:"ease",
    tracks:[{property:"z",from:-300,to:0}]
  })}]
};
const nativeDoc=buildMotionNativePreview(nativeMotion,{duration:1.25,delay:0.3,ease:"linear"});
assert.ok(nativeDoc.includes("translateZ(-300px)"));
assert.ok(nativeDoc.includes("translateZ(0px)"));
assert.ok(nativeDoc.includes("1.25s linear 0.3s infinite alternate"));
assert.match(nativeDoc,/prefers-reduced-motion/);
assert.match(nativeDoc,/default-src 'none'/);
assert.doesNotMatch(nativeDoc,/<script/);
assert.equal(buildMotionNativePreview({...nativeMotion,license:{verified:false}}),null);
assert.equal(buildMotionNativePreview({...nativeMotion,runtime:{renderer:"nagweb-react"}}),null);
assert.equal(realCardPreviewEligible({provider:"animxyz",id:"animxyz:preset:back"}),true);
assert.equal(realCardPreviewEligible({provider:"animxyz",id:"animxyz:core"}),false);
assert.equal(realCardPreviewEligible({provider:"magicui",editorUse:"code"}),false);
assert.match(schematicMarkup({kind:"react-component"}),/data-visual-schematic/);
assert.match(illustrativePreviewDoc({kind:"react-component"}),/no vista real del recurso/);
console.log("Visual-first cards: genuine native motion + honest schematic previews OK");
