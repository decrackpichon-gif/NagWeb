import assert from "node:assert/strict";
import { editorUseOf, canInsertInEditor } from "./runtime/editor-availability.mjs";
import { transformMagicCssEffect } from "./light-transformers.mjs";
import { validatedMagicCssEffect,validSavedMagicEffect } from "./runtime/nagweb-magic-css-effect.mjs";
import { transformSpinKitLoader } from "./light-transformers.mjs";
import { buildResourceApplyEnvelope } from "./runtime/resource-apply-bridge.mjs";
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
const spinner=transformSpinKitLoader({
  raw:{ css:":root{--sk-size:40px;--sk-color:#333}.sk-plane{width:var(--sk-size);background:var(--sk-color)}",
    commit:"verified-smoke",repository:"https://github.com/tobiasahlin/SpinKit",
    packageJson:{version:"2.0"} },
  item:{name:"plane",title:"Plane",html:'<div class="sk-plane"></div>'}
});
assert.equal(editorUseOf(spinner),"spinkit-html");
assert.equal(editorUseOf({...spinner,license:{verified:false}}),"code");
assert.equal(editorUseOf({...spinner,source:{provider:"magicui"}}),"code");
assert.equal(editorUseOf({...spinner,id:"fake:plane"}),"code");
assert.equal(editorUseOf({...spinner,artifacts:[{...spinner.artifacts[0],format:"tsx"}]}),"code");
assert.equal(canInsertInEditor("spinkit-html",["svg","uiverse-html","spinkit-html"]),true);
assert.equal(canInsertInEditor("spinkit-html",["svg","uiverse-html"]),false);
assert.equal(canInsertInEditor("spinkit-html",["html"]),true);
const styled=buildResourceApplyEnvelope(spinner,{values:{size:72,color:"#3366aa"}});
assert.equal(styled.descriptor.kind,"html");
assert.match(styled.descriptor.payload.html,/--sk-size:72px;--sk-color:#3366aa/);
assert.match(styled.descriptor.payload.html,/\.sk-plane/);
assert.match(styled.descriptor.payload.html,/<div class="sk-plane"><\/div>/);
const escaped=buildResourceApplyEnvelope(spinner,{values:{size:300,color:"red;position:absolute"}});
assert.match(escaped.descriptor.payload.html,/--sk-size:40px;--sk-color:#333333/);
assert.doesNotMatch(escaped.descriptor.payload.html,/position:absolute/);

const magic=transformMagicCssEffect({
 raw:{baseCss:".magictime{animation-duration:1s;animation-fill-mode:both}",repository:"https://github.com/miniMAC/magic",commit:"test",
  packageJson:{version:"1.0"}},
 item:{name:"puffIn",category:"magic_effects",path:"puffIn.scss",
  code:".puffIn{animation-name:puffIn}@keyframes puffIn{from{opacity:0}to{opacity:1}}"}
});
assert.equal(editorUseOf(magic),"magic-css");
assert.equal(canInsertInEditor("magic-css",["svg","magic-css"]),true);
assert.equal(canInsertInEditor("magic-css",["svg"]),false);
assert.equal(editorUseOf({...magic,license:{verified:false}}),"code");
assert.equal(editorUseOf({...magic,artifacts:[]}),"code");
assert.equal(editorUseOf({...magic,source:{provider:"other"}}),"code");
const magicEnvelope=buildResourceApplyEnvelope(magic,{values:{duration:2,delay:0.4,easing:"linear",iterations:2}});
const valid=validatedMagicCssEffect(magicEnvelope);
assert.equal(valid.id,magic.id);
assert.deepEqual(valid.values,{duration:2,delay:0.4,easing:"linear",iterations:2});
assert.equal(validSavedMagicEffect(valid),true);
assert.throws(()=>validatedMagicCssEffect({...magicEnvelope,descriptor:{...magicEnvelope.descriptor,
 payload:{...magicEnvelope.descriptor.payload,css:"@import url(https://bad.example)"}}}),/no tiene identidad/);
assert.throws(()=>validatedMagicCssEffect({...magicEnvelope,descriptor:{...magicEnvelope.descriptor,
 payload:{...magicEnvelope.descriptor.payload,iterations:999}}}),/fuera de rango/);
assert.equal(validSavedMagicEffect({...valid,css:'<style>bad</style>'}),false);
console.log("Native editor availability: real renderer, artifact, license, provider, host capability OK.");
