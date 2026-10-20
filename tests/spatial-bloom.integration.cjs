'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const T=process.argv[2]?require(path.resolve(process.argv[2])):require('three'),vendor=process.env.NAGWEB_TEST_VENDOR_DIR;
const c={THREE:T,window:{},console};vm.createContext(c);
for(const file of ['CopyShader.js','LuminosityHighPassShader.js','EffectComposer.js','RenderPass.js','ShaderPass.js','UnrealBloomPass.js']){
 const local=vendor?path.join(vendor,file):require.resolve('three/examples/js/'+(/Shader.js$/.test(file)?'shaders/':'postprocessing/')+file);vm.runInContext(fs.readFileSync(local,'utf8'),c);
}
vm.runInContext(fs.readFileSync('js/nagweb-spatial-bloom.js','utf8'),c);
const create=c.window.NAGWEB_CREATE_SPATIAL_BLOOM;
assert.equal(create({...T,UnrealBloomPass:null},{},null,null,1),null,'missing dependency must select direct rendering');
const targets=[],materials=[],composers=[];const RT=T.WebGLRenderTarget,SM=T.ShaderMaterial,EC=T.EffectComposer;
T.WebGLRenderTarget=class extends RT{constructor(...args){super(...args);this.disposals=0;this.addEventListener('dispose',()=>this.disposals++);targets.push(this);}};
T.ShaderMaterial=class extends SM{constructor(...args){super(...args);this.disposals=0;this.addEventListener('dispose',()=>this.disposals++);materials.push(this);}};
T.EffectComposer=class extends EC{constructor(...args){super(...args);this.clock.getDelta=()=>{throw Error('postprocessing cannot read its clock');};composers.push(this);}};
let viewport=new T.Vector4(17,23,480,320),scissor=new T.Vector4(30,40,440,300),scissorTest=true,color=new T.Color(0x123456),alpha=.25,target=null,pixelRatio=1,fail=false,calls=[];
const renderer={autoClear:true,getRenderTarget:()=>target,setRenderTarget:v=>{target=v;},getViewport:v=>v.copy(viewport),setViewport:(v,y,w,h)=>{viewport=v.isVector4?v.clone():new T.Vector4(v,y,w,h);},getScissor:v=>v.copy(scissor),setScissor:(v,y,w,h)=>{scissor=v.isVector4?v.clone():new T.Vector4(v,y,w,h);},getScissorTest:()=>scissorTest,setScissorTest:v=>{scissorTest=v;},getClearColor:v=>v.copy(color),getClearAlpha:()=>alpha,setClearColor:(v,a)=>{color=new T.Color(v);if(a!==undefined)alpha=a;},getPixelRatio:()=>pixelRatio,clear(){},render(){if(fail)throw Error('render failed');calls.push({target,viewport:viewport.toArray(),scissor:scissor.toArray(),scissorTest});}};
const original={viewport:viewport.toArray(),scissor:scissor.toArray(),color:color.getHex(),alpha,autoClear:renderer.autoClear};
const scene=new T.Scene(),camera=new T.PerspectiveCamera(),pipeline=create(T,renderer,scene,camera,1.2);assert.ok(pipeline);assert.ok(targets.length>10);
function restored(){assert.equal(target,null);assert.deepEqual(viewport.toArray(),original.viewport);assert.deepEqual(scissor.toArray(),original.scissor);assert.equal(scissorTest,true);assert.equal(color.getHex(),original.color);assert.equal(alpha,original.alpha);assert.equal(renderer.autoClear,original.autoClear);}
pipeline.render(480,320);restored();assert.equal(calls.at(-1).target,null);assert.equal(calls.at(-1).scissorTest,true);assert.deepEqual(calls.at(-1).viewport,original.viewport);
pixelRatio=2;pipeline.render(480,320);assert.equal(composers[0].renderTarget1.width,960);assert.equal(composers[0].renderTarget1.height,640);restored();
pipeline.render(1,1);assert.ok(targets.every(t=>t.width>0&&t.height>0),'small stages must keep all bloom mip buffers nonzero');restored();
fail=true;assert.throws(()=>pipeline.render(320,240),/render failed/);restored();fail=false;
pipeline.dispose();assert.ok(targets.every(t=>t.disposals>0));assert.ok(materials.every(m=>m.disposals>0));const before=targets.map(t=>t.disposals);pipeline.dispose();assert.deepEqual(targets.map(t=>t.disposals),before);assert.equal(pipeline.render(480,320),false);
// The adapter creates postprocessing only for visible stages and stops retrying failures.
vm.runInContext(fs.readFileSync('js/nagweb-spatial-renderer.js','utf8'),c);
const g=new T.Group();g.userData={o:{offZ:0},nativeR:1,holder:new T.Group()};g.userData.holder.add(g);scene.add(g.userData.holder);
let offscreen=false,created=0,disposed=0,rendered=0,throwBloom=false;
const stage={clientWidth:500,clientHeight:400,isConnected:true,contains:n=>n===g.userData.anchorEl,closest:()=>({getAttribute:()=> 'stage'}),getBoundingClientRect:()=>({left:0,top:offscreen?-500:0,right:500,bottom:offscreen?-100:400,width:500,height:400})};g.userData.anchorEl={offsetWidth:100,offsetHeight:100,offsetLeft:250,offsetTop:200};
renderer.domElement={clientWidth:1000,clientHeight:800};renderer.clearDepth=()=>{};
const api={bindThreeCamera(s,cam,onState){onState({cssPerspective:1000});return()=>{};}};
const factory=()=>{created++;return{render(){rendered++;if(throwBloom)throw Error('bloom failed');},dispose(){disposed++;}};};
const adapter=c.window.NAGWEB_CREATE_SPATIAL_RENDERER(T,renderer,scene,[g],[],{bloom:true,strength:1,createBloom:factory});adapter.connect(api,[stage]);assert.equal(created,0);
adapter.render(()=>{});assert.equal(created,1);assert.equal(rendered,1);offscreen=true;adapter.render(()=>{});assert.equal(disposed,1);offscreen=false;adapter.render(()=>{});assert.equal(created,2);
throwBloom=true;adapter.render(()=>{});assert.equal(disposed,2);const failures=rendered;adapter.render(()=>{});assert.equal(created,2);assert.equal(rendered,failures);assert.equal(g.userData.holder.visible,true);adapter.destroy();
console.log('PASS: real r128 bloom passes, no clock reads, viewport/transparency state, DPR/resize, small buffers, disposal, lazy stages, offscreen release and failure fallback');
