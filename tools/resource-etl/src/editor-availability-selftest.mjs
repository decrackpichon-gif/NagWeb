import assert from "node:assert/strict";
import { editorUseOf, canInsertInEditor } from "./runtime/editor-availability.mjs";
const svg={
 id:"lucide:camera",source:{provider:"lucide"},license:{verified:true},
 runtime:{renderer:"nagweb-svg",entryArtifactId:"svg"},
 artifacts:[{id:"svg",role:"icon-data",format:"svg",content:'<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>'}]
};
const html={
 id:"uiverse:test",source:{provider:"uiverse"},license:{verified:true},
 runtime:{renderer:"nagweb-html-tailwind",entryArtifactId:"component"},
 artifacts:[{id:"component",role:"component",format:"html",content:"<button>Test</button>"}]
};
assert.equal(editorUseOf(svg),"svg");
assert.equal(editorUseOf(html),"uiverse-html");
assert.equal(editorUseOf({...svg,license:{verified:false}}),"code");
assert.equal(editorUseOf({...svg,runtime:{renderer:"nagweb-react",entryArtifactId:"svg"}}),"code");
assert.equal(editorUseOf({...svg,artifacts:[]}),"code");
assert.equal(editorUseOf({...svg,artifacts:[{...svg.artifacts[0],format:"json"}]}),"code");
assert.equal(editorUseOf({...html,source:{provider:"magicui"}}),"code");
assert.equal(editorUseOf({...html,artifacts:[{...html.artifacts[0],content:""}]}),"code");
assert.equal(editorUseOf({...html,runtime:{renderer:"nagweb-motion-native",entryArtifactId:"component"}}),"code");
assert.equal(canInsertInEditor("svg",["svg","uiverse-html"]),true);
assert.equal(canInsertInEditor("uiverse-html",["svg","uiverse-html"]),true);
assert.equal(canInsertInEditor("uiverse-html",["html"]),true);
assert.equal(canInsertInEditor("uiverse-html",["svg"]),false);
assert.equal(canInsertInEditor("svg",["uiverse-html"]),false);
assert.equal(canInsertInEditor("code",["react"]),false);
assert.equal(canInsertInEditor("code"),false);
console.log("Native editor availability: real renderer, artifact, license, provider, host capability OK.");
