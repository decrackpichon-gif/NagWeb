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
 const p=starterProject();p.sections=[mkSection({id:'space',layout:'free',sdEnabled:true,sdCameraEnabled:true,sdEase:'linear',sdCameraFrames:[{at:0,x:0,y:0,z:0},{at:100,x:200,y:0,z:0}],elements:[mkEl('shape3d',{sdEnter:'none',id:'shape',shape:'box',motion:'still',env:'',x:70,y:50,w:20}),mkEl('shape3d',{sdEnter:'none',id:'model',shape:'model',modelId:'triangle',motion:'still',env:'',x:35,y:50,w:20})]})];
 const bin=new Float32Array([-1,-1,0,1,-1,0,0,1,0]);const json={asset:{version:'2.0'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0}],meshes:[{name:'realGLB',primitives:[{attributes:{POSITION:0}}]}],buffers:[{byteLength:bin.byteLength}],bufferViews:[{buffer:0,byteOffset:0,byteLength:bin.byteLength}],accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3',min:[-1,-1,0],max:[1,1,0]}]};
 let j=JSON.stringify(json);while(j.length%4)j+=' ';const bytes=new Uint8Array(12+8+j.length+8+bin.byteLength),v=new DataView(bytes.buffer);v.setUint32(0,0x46546c67,true);v.setUint32(4,2,true);v.setUint32(8,bytes.length,true);v.setUint32(12,j.length,true);v.setUint32(16,0x4e4f534a,true);bytes.set(new TextEncoder().encode(j),20);v.setUint32(20+j.length,bin.byteLength,true);v.setUint32(24+j.length,0x004e4942,true);bytes.set(new Uint8Array(bin.buffer),28+j.length);
 p.assets.models=[{id:'triangle',format:'glb',data:btoa(String.fromCharCode(...bytes))}];
 return {edit:generateSite(structuredClone(p),true,false,false),exported:generateSite(structuredClone(p),false,false,false)};
});
for(const [mode,html] of Object.entries(generated)){
 errors.length=0;
 let instrumented=html.replace("  function connectSpatial3D(ev){","  window.__test3D={adapter:spatial3D,objects:objects,renderer:renderer,scene:scene,tick:tick};\n  function connectSpatial3D(ev){");
 // Expose only the genuine runtime camera to this local fixture; no production global.
 instrumented=instrumented.replace('var camera=createCamera(),spatialStages=[];','var camera=createCamera(),spatialStages=[];window.__testCameraApi=camera;');
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

 // Real GPU depth prepass. An opaque DOM surface in front of a box punches
 // only the covered WebGL pixels, while the original DOM stays selectable.
 if(mode==='exported'){
  const occlusion=await page.evaluate(()=>{
   const d=window.__test3D,box=d.objects[0],stage=box.userData.anchorEl.closest('.nw-sd-stage'),
     world=stage.querySelector('[data-nw-camera-world]'),original=window.__NAG_SCROLL_DIRECTOR.space;
   original.set(0);d.tick();
   const cam=d.adapter.view(box).camera,gl=d.renderer.getContext(),ratio=d.renderer.getPixelRatio();
   const center=box.userData.holder.getWorldPosition(new THREE.Vector3()).project(cam),
     rect=stage.getBoundingClientRect(),
     sx=rect.left+(center.x+1)*rect.width/2,sy=rect.top+(1-center.y)*rect.height/2;
   function alpha(){
    d.tick();
    const px=new Uint8Array(4),canvas=d.renderer.domElement,cr=canvas.getBoundingClientRect();
    const x=Math.floor((sx-cr.left)/cr.width*gl.drawingBufferWidth),
      y=Math.floor((cr.bottom-sy)/cr.height*gl.drawingBufferHeight);
    gl.readPixels(x,y,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);
    return px[3];
   }
   const before=alpha(),block=document.createElement('div');
   block.setAttribute('data-nw-sd-el','1');
   block.style.cssText='position:absolute;left:60%;top:37.5%;width:20%;height:25%;background-color:rgb(255,255,255);pointer-events:auto';
   block.__nwSpatialPose={x:0,y:0,z:180,scale:100,rotate:0,rotateX:0,rotateY:0,opacity:1};
   world.appendChild(block);
   const api=window.__testCameraApi;d.adapter.connect(api,[stage]);
   original.set(0);const occluded=alpha();
   const probe=d.scene.children.find(m=>m.isMesh&&m.material&&m.material.colorWrite===false);
   const depth=probe&&probe.position.z;
   // Independent, deterministic GPU reference. This verifies a depth-only
   // plane masks just its footprint, without sampling an arbitrary project GLB.
   let gpu=null;
   if(probe){
    const gpuScene=new THREE.Scene(),gpuCamera=new THREE.OrthographicCamera(-2,2,2,-2,.1,100);
    const back=new THREE.Mesh(new THREE.PlaneGeometry(6,6),new THREE.MeshBasicMaterial({color:0xff4455}));
    back.position.z=-3;
    const front=probe.clone();front.position.set(0,0,-2);front.rotation.set(0,0,0);front.scale.set(1,1,1);
    gpuScene.add(back,front);
    d.renderer.setScissorTest(false);
    d.renderer.setViewport(0,0,d.renderer.domElement.clientWidth,d.renderer.domElement.clientHeight);
    const getAlpha=(fx,fy)=>{
     d.renderer.render(gpuScene,gpuCamera);
     const px=new Uint8Array(4);
     gl.readPixels(Math.floor(fx*gl.drawingBufferWidth),Math.floor(fy*gl.drawingBufferHeight),1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);
     return px[3];
    };
    front.visible=false;const unmasked=getAlpha(.5,.5);
    front.visible=true;const masked=getAlpha(.5,.5),outside=getAlpha(.8,.5);
    gpu={unmasked,masked,outside};
    back.geometry.dispose();back.material.dispose();
   }
   block.__nwSpatialPose.opacity=.5;const restored=alpha();
   const cs=getComputedStyle(block),diagnostic={attached:block.parentElement===world,
    width:block.offsetWidth,height:block.offsetHeight,styleTransform:block.style.transform,
    opacity:cs.opacity,background:cs.backgroundColor,borderRadius:cs.borderRadius,
    clipPath:cs.clipPath,mask:cs.maskImage,filter:cs.filter,mixBlend:cs.mixBlendMode};
   block.remove();d.adapter.connect(api,[stage]);original.set(0);d.tick();
   return{before,occluded,restored,depth,hasProxy:!!probe,gpu,diagnostic,canvas:d.renderer.domElement.getBoundingClientRect().toJSON(),stage:rect.toJSON(),pos:{sx,sy}};
  });
  assert.ok(occlusion.hasProxy,'Opaque DOM layer creates a real GPU depth proxy: '+JSON.stringify(occlusion));
  assert.ok(occlusion.gpu.unmasked>0,'GPU reference paints a visible pixel: '+JSON.stringify(occlusion));
  assert.equal(occlusion.gpu.masked,0,'Depth-only HTML proxy hides geometry behind its footprint');
  assert.ok(occlusion.gpu.outside>0,'Uncovered GPU pixels remain visible beside the DOM proxy');
  console.log('PASS real WebGL depth-only HTML occlusion: box, partial coverage and alpha fallback');

  // Loaded PNG alpha is used as a fragment mask, not as a solid rectangle.
  const transparency=await page.evaluate(async()=>{
   const d=window.__test3D,stage=d.objects[0].userData.anchorEl.closest('.nw-sd-stage'),
     world=stage.querySelector('[data-nw-camera-world]'),api=window.__testCameraApi,gl=d.renderer.getContext();
   const canvas=document.createElement('canvas');canvas.width=8;canvas.height=8;
   const cx=canvas.getContext('2d');cx.clearRect(0,0,8,8);
   cx.fillStyle='#fff';cx.fillRect(0,0,4,8);
   const img=document.createElement('img');img.setAttribute('data-nw-sd-el','1');
   img.style.cssText='position:absolute;left:40%;top:37.5%;width:20%;height:25%;object-fit:fill';
   img.src=canvas.toDataURL('image/png');world.appendChild(img);await img.decode();
   img.__nwSpatialPose={x:0,y:0,z:200,scale:100,rotate:0,rotateX:0,rotateY:0,opacity:1};
   d.adapter.connect(api,[stage]);d.tick();
   const proxy=d.scene.children.find(x=>x.isMesh&&x.material&&x.material.colorWrite===false);
   if(!proxy||!proxy.material.map){img.remove();d.adapter.connect(api,[stage]);return null;}
   // Read two pixels *inside* the proxy footprint, on its solid and empty halves.
   const f=new THREE.Scene(),cam=new THREE.OrthographicCamera(-2,2,2,-2,.1,100);
   const back=new THREE.Mesh(new THREE.PlaneGeometry(6,6),new THREE.MeshBasicMaterial({color:0xff3344}));back.position.z=-3;
   const front=proxy.clone();front.position.set(0,0,-2);front.rotation.set(0,0,0);front.scale.set(2,2,1);
   f.add(back,front);
   d.renderer.setScissorTest(false);
   d.renderer.setViewport(0,0,d.renderer.domElement.clientWidth,d.renderer.domElement.clientHeight);
   function read(x){
    d.renderer.render(f,cam);const bytes=new Uint8Array(4);
    gl.readPixels(Math.floor(x*gl.drawingBufferWidth),Math.floor(.5*gl.drawingBufferHeight),1,1,gl.RGBA,gl.UNSIGNED_BYTE,bytes);
    return bytes[3];
   }
   front.visible=false;const base=read(.4),baseRight=read(.6);
   front.visible=true;const solid=read(.4),clear=read(.6);
   // Rebuild the mask when CSS shape changes; transparent PNG and rounded
   // corners must intersect in one alpha texture, without rewriting the DOM.
   img.style.borderRadius='40%';d.tick();
   const roundedTex=proxy.material.alphaMap,corner=read(.29,.29),roundedSolid=read(.40),roundedClear=read(.60);
   img.style.borderRadius='0';img.style.clipPath='circle(38% at 50% 50%)';d.tick();
   const circleTex=proxy.material.alphaMap,circleCorner=read(.29,.29),circleSolid=read(.40);
   img.style.clipPath='inset(20% 20% 20% 20% round 10px)';d.tick();
   const insetTex=proxy.material.alphaMap,insetCorner=read(.29,.29),insetSolid=read(.40);
   img.style.clipPath='none';img.style.objectFit='cover';img.style.width='210px';img.style.height='110px';d.tick();
   const fittedTex=proxy.material.alphaMap,fitKeyChanged=!!fittedTex&&fittedTex!==insetTex;
   const texture=proxy.material.map,depth=proxy.position.z;
   back.geometry.dispose();back.material.dispose();
   img.remove();d.adapter.connect(api,[stage]);d.tick();
   return{base,baseRight,solid,clear,hasTexture:!!texture,depth,textureDisposed:!d.scene.children.includes(proxy),shapes:{rounded:!!roundedTex,corner,roundedSolid,roundedClear,circle:!!circleTex,circleCorner,circleSolid,inset:!!insetTex,insetCorner,insetSolid,fitKeyChanged}};
  });
  assert.ok(transparency,'Embedded PNG generates a Three depth proxy');
  assert.ok(transparency.base>0&&transparency.baseRight>0,'GPU reference covers both image halves');
  assert.equal(transparency.solid,0,'Opaque PNG pixels occlude the model behind them');
  assert.ok(transparency.clear>0,'Transparent PNG pixels reveal the model behind them');
  assert.equal(transparency.textureDisposed,true,'Alpha-depth proxy is released on reconnect');
  assert.equal(transparency.shapes.rounded,true,'Border-radius creates GPU alpha mask');
  assert.equal(transparency.shapes.corner,transparency.base,'Rounded corner reveals geometry behind transparent cutout');
  assert.equal(transparency.shapes.roundedSolid,0,'Rounded PNG interior still occludes geometry');
  assert.ok(transparency.shapes.roundedClear>0,'Rounded PNG preserves its own alpha');
  assert.equal(transparency.shapes.circle,true,'Circular clip-path produces GPU alpha mask');
  assert.equal(transparency.shapes.circleCorner,transparency.base,'Circle clip cuts away the diagonal corner');
  assert.equal(transparency.shapes.circleSolid,0,'Circle clip still retains image opacity');
  assert.equal(transparency.shapes.inset,true,'Inset clip-path produces GPU alpha mask');
  assert.equal(transparency.shapes.insetCorner,transparency.base,'Inset clip reveals pixels outside its box');
  assert.equal(transparency.shapes.insetSolid,0,'Inset clip retains its opaque interior');
  assert.equal(transparency.shapes.fitKeyChanged,true,'Object-fit cover regenerates an aligned image silhouette');
  console.log('PASS real WebGL alpha-depth masking: PNG opaque pixels block, transparent pixels pass, texture cleanup');

 }

 await page.screenshot({path:'work/spatial-'+mode+'.png'});
 assert.deepEqual(errors,[]);console.log('PASS '+mode+': resize and reduced motion');
 const delayed=instrumented.replace('"env":""','"env":"studio"').replaceAll('function(gltf){ fitGLTF(gltf, o, group); }','function(gltf){ window.__lateRoot=gltf.scene;window.__finishGLB=function(){fitGLTF(gltf,o,group);};window.__failGLB=fallback; }');
 fs.writeFileSync('work/generated-late-'+mode+'.html',delayed);
 await page.goto('file:///'+path.resolve('work/generated-late-'+mode+'.html').replaceAll('\\','/'));
 await page.waitForFunction(()=>window.__finishGLB&&window.__test3D.adapter.owns(window.__test3D.objects[0]));
 const lifecycle=await page.evaluate(()=>{
  const d=window.__test3D,resources=new Set(),counts={geometry:0,material:0,texture:0,renderer:0,renders:0};
  const texture=new THREE.Texture();window.__lateRoot.children[0].material.map=texture;
  window.__lateRoot.add(window.__lateRoot.children[0].clone()); // Shared geometry, material and texture dispose once.
  function watch(root){root.traverse(n=>{
   if(n.geometry)resources.add(n.geometry);
   (Array.isArray(n.material)?n.material:[n.material]).filter(Boolean).forEach(m=>{resources.add(m);Object.values(m).filter(v=>v&&v.isTexture).forEach(t=>resources.add(t));});
  });}
  watch(d.scene);watch(window.__lateRoot);
  resources.forEach(r=>r.addEventListener('dispose',()=>counts[r.isTexture?'texture':r.isMaterial?'material':'geometry']++));
  const render=d.renderer.render.bind(d.renderer),dispose=d.renderer.dispose.bind(d.renderer);
  d.renderer.render=function(){counts.renders++;return render(...arguments);};d.renderer.dispose=function(){counts.renderer++;return dispose();};
  d.tick();const before=counts.renders;
  window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));d.tick();
  const retained=counts.renders>before&&counts.geometry===0&&counts.renderer===0&&d.adapter.owns(d.objects[0]);
  window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false}));const stopped=counts.renders;
  window.__finishGLB();window.__finishGLB();window.__failGLB();d.tick();window.dispatchEvent(new Event('resize'));
  window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false}));
  return {retained,counts,expected:resources.size,noRender:counts.renders===stopped,children:d.objects[1].children.length,owned:d.adapter.owns(d.objects[0])};
 });
 assert.equal(lifecycle.retained,true,'Persisted pagehide retains renderer resources');
 assert.equal(lifecycle.noRender,true,'Final pagehide stops rendering and resize');
 assert.equal(lifecycle.counts.renderer,1,'Final disposal is idempotent');
 assert.equal(lifecycle.counts.geometry+lifecycle.counts.material+lifecycle.counts.texture,lifecycle.expected,'Loaded and late GLB resources dispose once');
 assert.equal(lifecycle.children,0,'Late GLB never attaches after final pagehide');assert.equal(lifecycle.owned,false);
 assert.deepEqual(errors,[]);console.log('PASS '+mode+': final teardown, retained page cache and late real GLB disposal');
}
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
