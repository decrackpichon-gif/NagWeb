'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');const {chromium}=require('playwright');
(async()=>{
const browser=await chromium.launch({...(process.env.NAGWEB_BROWSER?{executablePath:process.env.NAGWEB_BROWSER}:{}),headless:true,args:['--enable-unsafe-swiftshader']});
try{
fs.mkdirSync('work',{recursive:true});const vendor=process.env.NAGWEB_TEST_VENDOR_DIR;
const names=['CopyShader.js','LuminosityHighPassShader.js','EffectComposer.js','RenderPass.js','ShaderPass.js','UnrealBloomPass.js','GLTFLoader.js','ScrollTrigger.js','gsap.js','three.cjs'];
const source=file=>fs.readFileSync(vendor?path.join(vendor,file):require.resolve(file==='three.cjs'?'three/build/three.js':file==='gsap.js'||file==='ScrollTrigger.js'?'gsap/dist/'+(file==='gsap.js'?'gsap.js':'ScrollTrigger.js'):'three/examples/js/'+(file==='GLTFLoader.js'?'loaders/':/Shader.js$/.test(file)?'shaders/':'postprocessing/')+file));
let missing=false;const page=await browser.newPage({viewport:{width:1000,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/Shader Error|VALIDATE_STATUS|Error compiling/.test(m.text()))errors.push(m.text());});
await page.route('https://**/*',route=>{const u=route.request().url(),base=u.split('/').at(-1),file=/three(?:\.min)?\.js/.test(u)?'three.cjs':/gsap.min/.test(u)?'gsap.js':/ScrollTrigger/.test(u)?'ScrollTrigger.js':base;return names.includes(file)&&!(missing&&file==='UnrealBloomPass.js')?route.fulfill({contentType:'text/javascript',body:source(file)}):route.abort();});
await page.goto('file:///'+path.resolve('index.html').replaceAll('\\','/'));await page.waitForFunction(()=>!!window.NAGWEB_CREATE_SPATIAL_BLOOM);assert.deepEqual(errors,[]);
const generated=await page.evaluate(()=>{
 const p=starterProject();p.light='soft';p.progress=false;
 p.sections=[mkSection({id:'glow',layout:'free',sdEnabled:true,sdCameraEnabled:true,sdEase:'linear',sdCameraFrames:[{at:0,x:0,y:0,z:0},{at:100,x:200,y:0,z:0}],elements:[mkEl('shape3d',{sdEnter:'none',id:'box',shape:'box',motion:'still',env:'',color:'#FFFFFF',metalness:0,roughness:1,x:30,y:50,w:20}),mkEl('shape3d',{sdEnter:'none',id:'model',shape:'model',modelId:'triangle',motion:'still',env:'',x:70,y:50,w:20})]}),mkSection({id:'red',layout:'free',sdEnabled:true,sdCameraEnabled:true,elements:[mkEl('shape3d',{sdEnter:'none',id:'red-box',shape:'box',motion:'still',env:'',color:'#FF0000',metalness:0,roughness:1,x:90,y:50,w:20})]})];
 const bin=new Float32Array([-1,-1,0,1,-1,0,0,1,0]),json={asset:{version:'2.0'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0}],meshes:[{name:'realGLB',primitives:[{attributes:{POSITION:0},material:0}]}],materials:[{emissiveFactor:[1,1,1],pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],metallicFactor:0,roughnessFactor:1}}],buffers:[{byteLength:bin.byteLength}],bufferViews:[{buffer:0,byteOffset:0,byteLength:bin.byteLength}],accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3',min:[-1,-1,0],max:[1,1,0]}]};let j=JSON.stringify(json);while(j.length%4)j+=' ';const bytes=new Uint8Array(28+j.length+bin.byteLength),v=new DataView(bytes.buffer);v.setUint32(0,0x46546c67,true);v.setUint32(4,2,true);v.setUint32(8,bytes.length,true);v.setUint32(12,j.length,true);v.setUint32(16,0x4e4f534a,true);bytes.set(new TextEncoder().encode(j),20);v.setUint32(20+j.length,bin.byteLength,true);v.setUint32(24+j.length,0x004e4942,true);bytes.set(new Uint8Array(bin.buffer),28+j.length);p.assets.models=[{id:'triangle',format:'glb',data:btoa(String.fromCharCode(...bytes))}];
 const result={};for(const edit of [true,false])for(const [name,bloom,strength] of [['off',false,1.2],['zero',true,0],['on',true,1.2]]){p.bloom=bloom;p.bloomStrength=strength;result[(edit?'edit':'exported')+'-'+name]=generateSite(structuredClone(p),edit,false,false);}p.sections.forEach(s=>{s.sdEnabled=false;s.sdCameraEnabled=false;});for(const [name,bloom,strength] of [['off',false,1.2],['zero',true,0],['on',true,1.2]]){p.bloom=bloom;p.bloomStrength=strength;result['legacy-'+name]=generateSite(structuredClone(p),false,false,false);}return result;
});
async function open(name,html){
 errors.length=0;await page.emulateMedia({reducedMotion:'reduce'});
 const instrumented=html.replace('  function connectSpatial3D(ev){',`  window.__bloomTest={adapter:spatial3D,objects:objects,renderer:renderer,scene:scene,camera:camera,tick:tick,get legacy(){return legacyBloom;}};
  function connectSpatial3D(ev){`),file='work/bloom-'+name+'.html';fs.writeFileSync(file,instrumented);await page.goto('file:///'+path.resolve(file).replaceAll('\\','/'));await page.waitForFunction(()=>window.__bloomTest&&window.__bloomTest.objects[1].children.some(n=>n.children.some(m=>m.name==='realGLB')));await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>{
  const d=window.__bloomTest;if(window.__NAG_SCROLL_DIRECTOR&&window.__NAG_SCROLL_DIRECTOR.glow)window.__NAG_SCROLL_DIRECTOR.glow.set(0);d.tick();
  window.__bloomPixels=()=>{
   d.tick();const g=d.objects[0],view=d.adapter.view(g),cam=view?view.camera:d.camera,rect=view?view.rect:{left:0,top:0,width:innerWidth,height:innerHeight},box=new THREE.Box3().setFromObject(g),points=[];
   for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new THREE.Vector3(x,y,z).project(cam);points.push({x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2});}
   const right=Math.max(...points.map(p=>p.x)),cx=points.reduce((a,p)=>a+p.x,0)/8,cy=points.reduce((a,p)=>a+p.y,0)/8;
   const gl=d.renderer.getContext(),ratio=d.renderer.getPixelRatio(),read=(x,y)=>{const p=new Uint8Array(4);gl.readPixels(Math.floor(x*ratio),Math.floor((innerHeight-y-1)*ratio),1,1,gl.RGBA,gl.UNSIGNED_BYTE,p);return Array.from(p);};
   const modelBox=new THREE.Box3().setFromObject(d.objects[1]),model=modelBox.getCenter(new THREE.Vector3()).project(cam),modelRight=new THREE.Vector3(modelBox.max.x,modelBox.min.y,modelBox.max.z).project(cam);
   return{halo:read(right+8,cy),center:read(cx,cy),model:read(rect.left+(model.x+1)*rect.width/2,rect.top+(1-model.y)*rect.height/2),modelHalo:read(rect.left+(modelRight.x+1)*rect.width/2+8,rect.top+(1-model.y)*rect.height/2),corner:read(5,5),textures:d.renderer.info.memory.textures,cameraX:cam.position.x,position:g.userData.holder.position.toArray()};
  };
  window.__bloomEmpty=()=>{
   const visible=d.objects.map(g=>g.visible);d.objects.forEach(g=>g.visible=false);d.tick();
   const gl=d.renderer.getContext(),pixel=new Uint8Array(4);gl.readPixels(5,5,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
   d.objects.forEach((g,i)=>g.visible=visible[i]);d.tick();return Array.from(pixel);
  };
 });
}
const samples={};for(const [name,html] of Object.entries(generated)){
 await open(name,html);const sample=await page.evaluate(()=>window.__bloomPixels());samples[name]=sample;
 // Distant pixels can include the widest bloom mip; the empty pass below checks exact alpha.
 assert.equal(sample.center[3],255,'shape must still render');assert.equal(sample.model[3],255,'the loaded GLB must draw actual pixels');
 assert.deepEqual(await page.evaluate(()=>window.__bloomEmpty()),[0,0,0,0],'empty bloom must preserve a fully transparent canvas');
 if(name.endsWith('-on')){assert.ok(sample.halo[3]>2&&sample.halo[0]>2,'real bloom must reach beyond geometry');assert.ok(sample.modelHalo[3]>2,'the real emissive GLB must also receive bloom');}else{assert.equal(sample.halo[3],0,'off/zero bloom cannot create a halo');assert.equal(sample.modelHalo[3],0);}
 assert.deepEqual(errors,[]);console.log('PASS '+name+': geometry/GLB and transparent glow pixels',JSON.stringify({halo:sample.halo,modelHalo:sample.modelHalo,center:sample.center,corner:sample.corner}));
 sample.gray=await page.evaluate(()=>{const d=window.__bloomTest,saved=[];d.objects[0].traverse(n=>{if(n.isMesh){saved.push([n,n.material]);n.material=new THREE.MeshBasicMaterial({color:0x202020});}});const pixel=window.__bloomPixels().center;saved.forEach(([n,m])=>{n.material.dispose();n.material=m;});d.tick();return pixel;});
 if(name==='exported-on'){
  const moved=await page.evaluate(()=>{const before=window.__bloomTest.objects[0].userData.holder.position.toArray();window.__NAG_SCROLL_DIRECTOR.glow.set(.5);return{before,after:window.__bloomPixels()};});assert.equal(moved.after.cameraX,100);assert.deepEqual(moved.after.position,moved.before);assert.ok(moved.after.halo[3]>2);
  await page.screenshot({path:'work/bloom-spatial.png'});
  const offscreen=await page.evaluate(()=>{const d=window.__bloomTest,s=d.objects[0].userData.anchorEl.closest('.nw-sd-stage'),saved=s.style.transform,before=d.renderer.info.memory.textures;s.style.transform='translateY(10000px)';d.tick();const released=d.renderer.info.memory.textures;s.style.transform=saved;d.tick();return{before,released,restored:d.renderer.info.memory.textures};});assert.ok(offscreen.released<offscreen.before);assert.equal(offscreen.restored,offscreen.before);
  await page.setViewportSize({width:500,height:600});await page.waitForFunction(()=>Math.abs(window.__bloomTest.adapter.view(window.__bloomTest.objects[0]).camera.aspect-5/6)<1e-8);const resized=await page.evaluate(()=>window.__bloomPixels());assert.ok(resized.halo[3]>0);assert.deepEqual(await page.evaluate(()=>window.__bloomEmpty()),[0,0,0,0]);
  const hidpi=await page.evaluate(()=>{const d=window.__bloomTest;d.renderer.setPixelRatio(2);d.renderer.setSize(innerWidth,innerHeight);return window.__bloomPixels();});assert.deepEqual(await page.evaluate(()=>window.__bloomEmpty()),[0,0,0,0]);assert.ok(hidpi.halo[3]>0);
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>window.__bloomTest.adapter.view(window.__bloomTest.objects[0]).camera.position.x===0);assert.ok((await page.evaluate(()=>window.__bloomPixels())).halo[3]>0);await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:1000,height:800});
  const clipped=await page.evaluate(()=>{const d=window.__bloomTest;d.renderer.setPixelRatio(1);d.renderer.setSize(1000,800);const stages=['glow','red'].map(id=>document.querySelector('.sc[data-id="'+id+'"] .nw-sd-stage'));stages.forEach((s,i)=>{s.style.cssText+=';position:fixed;top:0;left:'+i*500+'px;width:500px;height:400px;min-height:400px';window.__NAG_SCROLL_DIRECTOR[i?'red':'glow'].set(0);});d.objects[0].userData.anchorEl.style.left='98%';d.objects[1].userData.anchorEl.style.visibility='hidden';d.objects[1].visible=false;d.tick();const gl=d.renderer.getContext(),read=x=>{const p=new Uint8Array(4);gl.readPixels(x,600,1,1,gl.RGBA,gl.UNSIGNED_BYTE,p);return Array.from(p);};return{left:read(499),right:read(501)};});
  assert.ok(clipped.left[1]>2,'white source must reach the edge of its viewport');assert.ok(clipped.right[1]<=1&&clipped.right[2]<=1,'white bloom cannot cross into the red stage');
  console.log('PASS exported-on: Director camera motion, resize, DPR, reduced motion and stage scissor',JSON.stringify(clipped));
  const resource=await page.evaluate(()=>{const d=window.__bloomTest;d.tick();const before=d.renderer.info.memory.textures;window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));const retained=d.renderer.info.memory.textures;window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false}));return{before,retained,after:d.renderer.info.memory.textures};});assert.ok(resource.before>0);assert.equal(resource.retained,resource.before);assert.equal(resource.after,0);console.log('PASS: bloom resources released on final pagehide',resource);
 }
}
for(const mode of ['edit','exported','legacy'])assert.ok(samples[mode+'-off'].gray[0]>0&&samples[mode+'-off'].gray[0]<250&&samples[mode+'-zero'].gray.slice(0,3).every((v,i)=>Math.abs(v-samples[mode+'-off'].gray[i])<=3),'zero strength preserves source color');
// Missing CDN dependency and a failed spatial composer preserve the direct renderer.
missing=true;await open('missing',generated['exported-on']);const fallback=await page.evaluate(()=>window.__bloomPixels());assert.equal(fallback.halo[3],0);assert.equal(fallback.center[3],255);assert.deepEqual(errors,[]);missing=false;
await open('failure',generated['exported-on']);const failure=await page.evaluate(()=>{const d=window.__bloomTest,cam=d.adapter.view(d.objects[0]).camera,original=THREE.EffectComposer.prototype.render;let errors=0;THREE.EffectComposer.prototype.render=function(delta){if(this.passes[0].camera===cam){errors++;throw Error('simulated composer failure');}return original.call(this,delta);};const a=window.__bloomPixels(),b=window.__bloomPixels();THREE.EffectComposer.prototype.render=original;return{a,b,errors};});assert.equal(failure.errors,1);assert.equal(failure.b.halo[3],0);assert.equal(failure.b.center[3],255);assert.deepEqual(errors,[]);console.log('PASS: missing dependency and composer failure keep objects visible without repeated retries');
await page.screenshot({path:'work/bloom-fallback.png'});
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
