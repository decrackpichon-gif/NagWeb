'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
const browser=await chromium.launch({...(process.env.NAGWEB_BROWSER?{executablePath:process.env.NAGWEB_BROWSER}:{}),headless:true,args:['--enable-unsafe-swiftshader']});
fs.mkdirSync('work',{recursive:true});
const vendors=process.env.NAGWEB_TEST_VENDOR_DIR,source=file=>fs.readFileSync(vendors?path.join(vendors,file):require.resolve({'three.cjs':'three/build/three.js','GLTFLoader.js':'three/examples/js/loaders/GLTFLoader.js','gsap.js':'gsap/dist/gsap.js','ScrollTrigger.js':'gsap/dist/ScrollTrigger.js'}[file]));
try{
const page=await browser.newPage({viewport:{width:1000,height:800}}),errors=[];
page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',e.message);});
await page.route('https://**/*',route=>{
 const u=route.request().url(),file=/three(?:\.min)?\.js/.test(u)?'three.cjs':/GLTFLoader/.test(u)?'GLTFLoader.js':/ScrollTrigger/.test(u)?'ScrollTrigger.js':/gsap.min/.test(u)?'gsap.js':null;
 return file?route.fulfill({contentType:'text/javascript',body:source(file)}):route.abort();
});
await page.goto('file:///'+path.resolve('index.html').replaceAll('\\','/'));
await page.waitForFunction(()=>!!window.NAGWEB_CREATE_SPATIAL_RENDERER);
const generated=await page.evaluate(()=>{
 const p=starterProject();p.sections=[mkSection({id:'space',layout:'free',sdEnabled:true,sdCameraEnabled:true,sdEase:'linear',sdCameraFrames:[{at:0,x:0,y:0,z:0},{at:100,x:200,y:0,z:0}],elements:[mkEl('shape3d',{id:'shape',shape:'box',motion:'still',env:'',x:70,y:50,w:20}),mkEl('shape3d',{id:'model',shape:'model',modelId:'triangle',motion:'still',env:'',x:35,y:50,w:20})]})];
 const bin=new Float32Array([-1,-1,0,1,-1,0,0,1,0]);const json={asset:{version:'2.0'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0}],meshes:[{name:'realGLB',primitives:[{attributes:{POSITION:0}}]}],buffers:[{byteLength:bin.byteLength}],bufferViews:[{buffer:0,byteOffset:0,byteLength:bin.byteLength}],accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3',min:[-1,-1,0],max:[1,1,0]}]};
 let j=JSON.stringify(json);while(j.length%4)j+=' ';const bytes=new Uint8Array(12+8+j.length+8+bin.byteLength),v=new DataView(bytes.buffer);v.setUint32(0,0x46546c67,true);v.setUint32(4,2,true);v.setUint32(8,bytes.length,true);v.setUint32(12,j.length,true);v.setUint32(16,0x4e4f534a,true);bytes.set(new TextEncoder().encode(j),20);v.setUint32(20+j.length,bin.byteLength,true);v.setUint32(24+j.length,0x004e4942,true);bytes.set(new Uint8Array(bin.buffer),28+j.length);
 p.assets.models=[{id:'triangle',format:'glb',data:btoa(String.fromCharCode(...bytes))}];
 return {edit:generateSite(structuredClone(p),true,false,false),exported:generateSite(structuredClone(p),false,false,false)};
});
for(const [mode,html] of Object.entries(generated)){
 errors.length=0;
 let instrumented=html.replace("  function connectSpatial3D(ev){","  window.__test3D={adapter:spatial3D,objects:objects,renderer:renderer,scene:scene,tick:tick};\n  function connectSpatial3D(ev){");
 // Exercise the exact serialized generator runtime in an independent document.
 fs.writeFileSync('work/generated-'+mode+'.html',instrumented);
 await page.goto('file:///'+path.resolve('work/generated-'+mode+'.html').replaceAll('\\','/'),{waitUntil:'load'});

 await page.waitForFunction(()=>window.__test3D&&window.__NAG_SCROLL_DIRECTOR&&window.__test3D.objects[1].children.some(n=>n.children.some(m=>m.name==='realGLB')));
 const result=await page.evaluate(async()=>{
  const d=window.__test3D,g=d.objects[0],model=d.objects[1],director=window.__NAG_SCROLL_DIRECTOR.space;
  director.set(0);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  d.tick();const c=d.adapter.view(g).camera,start=g.userData.holder.position.clone().project(c).x,pos=g.userData.holder.position.toArray();
  director.set(1);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  d.tick();return {start,end:g.userData.holder.position.clone().project(c).x,pos,endPos:g.userData.holder.position.toArray(),cameraX:c.position.x,glb:model.children[0].children[0].name,visible:model.userData.holder.visible,webgl:!!d.renderer.getContext(),progress:director.progress(),rect:d.adapter.view(g).rect.toJSON(),canvas:[d.renderer.domElement.clientWidth,d.renderer.domElement.clientHeight],stage:[g.userData.anchorEl.parentElement.clientWidth,g.userData.anchorEl.parentElement.clientHeight],owns:d.adapter.owns(g),anchor:[g.userData.anchorEl.offsetLeft,g.userData.anchorEl.offsetTop,g.userData.anchorEl.offsetWidth]};
 });

 assert.ok(result.webgl);assert.equal(result.cameraX,200);assert.equal(result.progress,1);assert.deepEqual(result.pos,result.endPos);assert.ok(Number.isFinite(result.start)&&Number.isFinite(result.end)&&result.end<result.start);assert.equal(result.glb,'realGLB');assert.equal(result.visible,true);assert.deepEqual(errors,[]);
 console.log('PASS '+mode+': generated WebGL renderer + real GLB + Director manual progress');
 await page.setViewportSize({width:500,height:600});
 await page.waitForFunction(()=>Math.abs(window.__test3D.adapter.view(window.__test3D.objects[0]).camera.aspect-5/6)<1e-8);
 const resized=await page.evaluate(()=>{const d=window.__test3D;d.tick();return{z:d.objects[0].userData.holder.position.z,width:d.objects[0].userData.anchorEl.offsetWidth};});
 assert.equal(resized.z,-1000);assert.equal(resized.width,100);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.waitForFunction(()=>window.__test3D.adapter.view(window.__test3D.objects[0]).camera.position.x===0);
 const reduced=await page.evaluate(()=>{window.__test3D.tick();return window.__test3D.adapter.view(window.__test3D.objects[0]).camera.position.toArray();});
 assert.ok(reduced.every(v=>v===0));
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.setViewportSize({width:1000,height:800});
 await page.evaluate(()=>{window.__NAG_SCROLL_DIRECTOR.space.set(0);window.__test3D.tick();});
 await page.screenshot({path:'work/spatial-'+mode+'.png'});
 assert.deepEqual(errors,[]);console.log('PASS '+mode+': resize and reduced motion');
}
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
