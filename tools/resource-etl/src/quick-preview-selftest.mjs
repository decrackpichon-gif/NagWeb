import assert from "node:assert/strict";
import { canQuickPreview, offlineQuickPreviewDoc } from "./runtime/quick-preview.mjs";

assert.equal(canQuickPreview({provider:"uiverse",editorUse:"uiverse-html"}),true);
assert.equal(canQuickPreview({provider:"uiverse",editorUse:"code"}),false);
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
