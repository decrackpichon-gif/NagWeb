import assert from "node:assert/strict";
import { canQuickPreview, offlineQuickPreviewDoc } from "./runtime/quick-preview.mjs";
import { buildMotionNativePreview, realCardPreviewEligible, schematicMarkup, illustrativePreviewDoc } from "./preview/visual-previews.mjs";
import { isVerifiedNoiseShader, buildGlslNoisePreview } from "./preview/glsl-noise-browser-preview.mjs";
import { GLSL_NOISE_SOURCE_COMMIT, GLSL_NOISE_DEFAULTS, normalizeGlslNoiseValues } from "./runtime/glsl-noise-params.mjs";
import { isNativeGlslNoiseResource, glslNoiseShaderFromEnvelope } from "./runtime/nagweb-glsl-noise-native.mjs";
import { buildInsertDescriptor } from "./runtime/insert-adapters.mjs";
import { editorUseOf, canInsertInEditor } from "./runtime/editor-availability.mjs";
import { describeEditableControls } from "./runtime/editable-controls.mjs";
import { buildNoiseShaderBlock, loadNoiseSources, adaptNoiseCode } from "./runtime/build-glsl-noise-shader-block.mjs";
import { readFileSync } from "node:fs";
import { buildNativeThreePreview } from "./preview/native-three-browser-preview.mjs";

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

const noise={
  id:"glsl-noise:classic:2d",
  source:{provider:"glsl-noise"},
  license:{verified:true},
  runtime:{renderer:"nagweb-glsl-snippet",entryArtifactId:"shader",
    setup:{family:"classic",dimension:"2d",exportedSymbol:"cnoise"}},
  artifacts:[{id:"shader",role:"source",format:"glsl",content:
    "// Source GLSL, not an HTML-based placeholder.\n"+
    "float cnoise(vec2 p){return sin(p.x)*cos(p.y);}\n"+
    "#pragma glslify: export(cnoise)"}]
};
assert.equal(isVerifiedNoiseShader(noise),true);
assert.equal(buildGlslNoisePreview({...noise,license:{verified:false}}),null);
assert.equal(buildGlslNoisePreview({...noise,id:"glsl-noise:classic:4d"}),null);
const noiseCard=buildGlslNoisePreview(noise,{thumbnail:true});
assert.match(noiseCard,/float libNoise/,"Preview uses the exact function the editor embeds (symbol renamed to libNoise)");
assert.doesNotMatch(noiseCard,/float cnoise/);
assert.match(noiseCard,/gl\.drawArrays/);
assert.match(noiseCard,/img-src data:/);
assert.match(noiseCard,/script-src 'unsafe-inline'/);
assert.match(noiseCard,/const still=true/);
assert.match(buildGlslNoisePreview(noise),/const still=false/);
assert.equal(realCardPreviewEligible(noise),true);
assert.equal(buildGlslNoisePreview({...noise,artifacts:[{...noise.artifacts[0],
  content:noise.artifacts[0].content+"\n<script>alert(1)</script>"}]}),null);
// Simplex 4D ships "#define F4 <number>": numeric constants are safe, other directives are not.
const withLine=line=>({...noise,artifacts:[{...noise.artifacts[0],
  content:noise.artifacts[0].content.replace("float cnoise",line+"\nfloat cnoise")}]});
assert.match(buildGlslNoisePreview(withLine("#define F4 0.309016994374947451")),/#define F4 0\.309016994374947451/,
  "Numeric constants keep simplex 4D previewable");
for(const unsafe of ["#define X foo(1)","#include \"other.glsl\"","#ifdef GL_ES","#version 300 es","#define Y 1 + 2"]){
  assert.equal(buildGlslNoisePreview(withLine(unsafe)),null,"Rejects preprocessor line: "+unsafe);
}
console.log("GLSL WebGL previews: original code, CSP and script separation OK");

const shapes=[
  ["webgl_geometry_colors","Icosahedron","icosa"],
  ["webgl_interactive_cubes","Box","box"],
  ["webgl_materials_envmaps_fasthdr","Sphere","sphere"]
];
for(const [slug,constructor,shape] of shapes){
  const three={
    id:"threejs:example:"+slug,
    source:{provider:"threejs",externalId:"examples/"+slug+".html",
      commit:"e9a8a1264c58150907230122ac17f5760a1ebab1"},
    license:{verified:true},
    runtime:{type:"three",renderer:"three",setup:{codeOnly:true},entryArtifactId:"s"},
    artifacts:[{id:"s",role:"source",format:"html",
      content:"<html>new THREE."+constructor+"Geometry(1,1)</html>"}]
  };
  const doc=buildNativeThreePreview(three,{speed:2.5});
  assert.ok(doc,"Preview actual native geometry "+shape);
  assert.ok(doc.includes('data-native-geometry="'+shape+'"'));
  assert.ok(doc.includes('data-native-speed="2.5"'));
  assert.match(doc,/canvas role="img"/);
  assert.match(doc,/WebGL no disponible/);
  assert.match(doc,/default-src 'none'/);
  assert.match(doc,/connect-src 'none'/);
  assert.match(doc,/prefers-reduced-motion: reduce/);
  assert.equal(buildNativeThreePreview({...three,license:{verified:false}}),null);
  assert.equal(buildNativeThreePreview({...three,source:{...three.source,commit:"unverified"}}),null);
  assert.ok(buildNativeThreePreview(three,{speed:100}).includes('data-native-speed="1"'));
}
console.log("Actual native 3D geometry previews: source-verified icosa, box, sphere; CSP, speed and safety OK");

// Motion-preset card thumbnails: one large centred sample that loops by itself, inert and control-free.
import { buildCssShakeBrowserPreview } from "./preview/csshake-browser-preview.mjs";
import { buildMagicCssBrowserPreview } from "./preview/magiccss-browser-preview.mjs";
{
  const shake={id:"csshake:shake",title:"Shake",source:{provider:"csshake"},
    runtime:{renderer:"nagweb-css-class-effect"},
    artifacts:[{role:"animation-data",content:'{"className":"shake"}'}]};
  const thumb=buildCssShakeBrowserPreview(shake,{}, {stylesheet:".shake{animation:x 1s}",thumbnail:true});
  assert.match(thumb,/class="demo shake shake-constant"/,"Card sample loops on its own (cards cannot be hovered)");
  assert.match(thumb,/script-src 'none'/);
  assert.doesNotMatch(thumb,/<script|preview-pause|Siempre/,"No controls, scripts or two-panel comparison in a card");
  const full=buildCssShakeBrowserPreview(shake,{}, {stylesheet:".shake{animation:x 1s}"});
  assert.match(full,/preview-pause/,"The detail view keeps its playback controls");
  const magic={id:"magic-css:bling:puffIn",title:"Puff In",source:{provider:"magic-css"},
    runtime:{renderer:"nagweb-css-inline-effect",setup:{baseClass:"magictime",className:"puffIn"}},
    artifacts:[{role:"stylesheet",content:".puffIn{animation-name:puffIn}"}]};
  const magicThumb=buildMagicCssBrowserPreview(magic,{}, {thumbnail:true});
  assert.match(magicThumb,/animation-iteration-count:infinite!important/);
  assert.doesNotMatch(magicThumb,/<script|preview-pause|loop-preview/);
  const magicFull=buildMagicCssBrowserPreview(magic,{iterations:1});
  assert.match(magicFull,/id="loop-preview" type="checkbox" checked/,"Detail loops by default, with an off switch");
  assert.match(magicFull,/\.preview-loop:checked ~ main \.demo\.magictime\{animation-iteration-count:infinite!important\}/);
  console.log("Motion preset card samples loop, stay inert and keep detail controls OK");
}

// --- Native shader insertion (verified glsl-noise) ---
{
  const native={...noise,sourceCommit:GLSL_NOISE_SOURCE_COMMIT,source:{...noise.source,commit:GLSL_NOISE_SOURCE_COMMIT},
    license:{...noise.license,id:"MIT",verified:true}};
  assert.equal(isNativeGlslNoiseResource(native),true);
  assert.equal(isNativeGlslNoiseResource(noise),false,"Unpinned revision is never native");
  assert.equal(editorUseOf(native),"shader-native");
  assert.equal(canInsertInEditor("shader-native",["svg","shader-native"]),true);
  assert.equal(canInsertInEditor("shader-native",["svg"]),false);
  const controls=describeEditableControls(native);
  assert.deepEqual(controls.map(c=>c.id),["c1","c2","scale","contrast","speed","seed"]);
  assert.equal(controls.filter(c=>c.kind==="color").length,2);
  // Colours really reach the rendered program.
  const a=buildGlslNoisePreview(native,{values:{c1:"#ff0000",c2:"#00ff00"}});
  const b=buildGlslNoisePreview(native,{values:{c1:"#0000ff",c2:"#00ff00"}});
  assert.notEqual(a,b,"Changing a colour changes the preview program");
  assert.match(buildGlslNoisePreview(native,{values:{speed:2.5}}),/t\/1000\*2\.5000/);
  assert.equal(JSON.stringify(normalizeGlslNoiseValues({scale:999,c1:"red"})),JSON.stringify(normalizeGlslNoiseValues({})));
  const descriptor=buildInsertDescriptor(native,{values:{scale:2}});
  assert.equal(descriptor.kind,"shader-native");
  assert.equal(descriptor.payload.shaderId,"noise-classic-2d");
  const envelope={resource:{id:native.id,provider:"glsl-noise",sourceCommit:GLSL_NOISE_SOURCE_COMMIT,license:native.license},descriptor};
  const props=glslNoiseShaderFromEnvelope(envelope);
  assert.equal(props.sid,"noise-classic-2d");
  assert.equal(props.sp.scale,2);
  for(const bad of [
    {...envelope,resource:{...envelope.resource,sourceCommit:"deadbeef"}},
    {...envelope,resource:{...envelope.resource,license:{...native.license,verified:false}}},
    {...envelope,descriptor:{...descriptor,payload:{...descriptor.payload,shaderId:"noise-simplex-4d"}}},
    {...envelope,descriptor:{...descriptor,instance:{...descriptor.instance,values:{...descriptor.instance.values,scale:99}}}},
    {...envelope,descriptor:{...descriptor,payload:{...descriptor.payload,values:{...descriptor.payload.values,scale:3}}}}
  ]) assert.throws(()=>glslNoiseShaderFromEnvelope(bad));
  // A resource never carries GLSL into the project: the props are ids and numbers only.
  assert.doesNotMatch(JSON.stringify(props),/void main|float /);
}
// Generated editor block: up to date, pinned checksums, and the shim matches index.html.
{
  const html=readFileSync(new URL("../../../index.html",import.meta.url),"utf8");
  const block=buildNoiseShaderBlock(loadNoiseSources());
  assert.ok(html.includes(block),"index.html embeds the generated noise block");
  assert.equal((block.match(/R\(\{id:/g)||[]).length,9);
  const {SCSHADER_GLSL_SHIM}=await import("./runtime/glsl-noise-params.mjs");
  for(const [name,code] of Object.entries(SCSHADER_GLSL_SHIM)){
    const first=code.split("\n")[0].replace(/\s+/g,"");
    assert.ok(html.replace(/\s+/g,"").includes(first),"SCShader helper "+name+" is unchanged in index.html");
  }
  assert.match(adaptNoiseCode("#pragma glslify: export(snoise)\nfloat snoise(vec2 v){}","snoise"),/float libNoise\(/);
}
console.log("Native GLSL shader tests passed.");
