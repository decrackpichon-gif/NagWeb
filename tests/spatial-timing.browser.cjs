'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({...(process.env.NAGWEB_BROWSER?{executablePath:process.env.NAGWEB_BROWSER}:{}),headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  fs.mkdirSync('work',{recursive:true});const vendor=process.env.NAGWEB_TEST_VENDOR_DIR;
  const names=['three.cjs','GLTFLoader.js','gsap.js','ScrollTrigger.js','CopyShader.js','LuminosityHighPassShader.js','EffectComposer.js','RenderPass.js','ShaderPass.js','UnrealBloomPass.js'];
  const source=f=>fs.readFileSync(vendor?path.join(vendor,f):require.resolve(f==='three.cjs'?'three/build/three.js':f==='gsap.js'||f==='ScrollTrigger.js'?'gsap/dist/'+f:'three/examples/js/'+(f==='GLTFLoader.js'?'loaders/':/Shader.js$/.test(f)?'shaders/':'postprocessing/')+f));
  const page=await browser.newPage({viewport:{width:1000,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&/Shader Error|VALIDATE_STATUS|Error compiling/.test(m.text()))errors.push(m.text());});
  await page.route('https://**/*',r=>{const u=r.request().url(),f=/three(?:\.min)?\.js/.test(u)?'three.cjs':/gsap.min/.test(u)?'gsap.js':/ScrollTrigger/.test(u)?'ScrollTrigger.js':u.split('/').at(-1);return names.includes(f)?r.fulfill({contentType:'text/javascript',body:source(f)}):r.abort();});
  await page.goto('file:///'+path.resolve('index.html').replaceAll('\\','/'));await page.waitForFunction(()=>window.NAGWEB_CREATE_SPATIAL_RENDERER);
  const generated=await page.evaluate(()=>{
   const p=starterProject();p.progress=false;p.bloom=false;p.light='soft';
   p.sections=[mkSection({id:'space',layout:'free',sdEnabled:true,sdCameraEnabled:true,sdEase:'linear',sdCameraFrames:[{at:0,x:0,y:0,z:0},{at:100,x:40,y:10,z:20,rotate:3,rotateX:4,rotateY:8}],elements:[
    mkEl('shape3d',{id:'box',shape:'box',motion:'spin',entrance:'grow',env:'',x:30,y:50,w:18,dragRotate:true,sdStart:20,sdEnd:70,sdSpan:10,sdEnter:'fade',sdExit:'fade',sdMoveX:120,sdMoveY:40,sdRotate:30,sdScale:150}),
    mkEl('shape3d',{id:'model',shape:'model',modelId:'triangle',motion:'tumble',entrance:'left',env:'',x:65,y:50,w:18,dragRotate:true,sdKeyframes:[{at:0,opacity:0},{at:20,opacity:0,x:-80,y:30},{at:40,opacity:100,x:0,y:0},{at:60,opacity:50,x:60,y:-20,z:80,rotateX:10,rotateY:20,rotate:30,scale:140},{at:80,opacity:0,x:120},{at:100,opacity:0}]})]
   }),mkSection({id:'second',layout:'free',sdEnabled:true,sdCameraEnabled:true,elements:[mkEl('shape3d',{id:'second-box',shape:'box',motion:'pulse',x:50,y:50,w:20})]})];
   const bin=new Float32Array([-1,-1,0,1,-1,0,0,1,0]),json={asset:{version:'2.0'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0}],meshes:[{name:'realGLB',primitives:[{attributes:{POSITION:0},material:0}]}],materials:[{emissiveFactor:[1,1,1],pbrMetallicRoughness:{baseColorFactor:[1,1,1,.6],metallicFactor:0,roughnessFactor:1},alphaMode:'BLEND',doubleSided:true}],buffers:[{byteLength:bin.byteLength}],bufferViews:[{buffer:0,byteOffset:0,byteLength:bin.byteLength}],accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3',min:[-1,-1,0],max:[1,1,0]}]};
   let j=JSON.stringify(json);while(j.length%4)j+=' ';const bytes=new Uint8Array(28+j.length+bin.byteLength),v=new DataView(bytes.buffer);v.setUint32(0,0x46546c67,true);v.setUint32(4,2,true);v.setUint32(8,bytes.length,true);v.setUint32(12,j.length,true);v.setUint32(16,0x4e4f534a,true);bytes.set(new TextEncoder().encode(j),20);v.setUint32(20+j.length,bin.byteLength,true);v.setUint32(24+j.length,0x004e4942,true);bytes.set(new Uint8Array(bin.buffer),28+j.length);
   p.assets.models=[{id:'triangle',format:'glb',data:btoa(String.fromCharCode(...bytes))}];
   const result={edit:generateSite(structuredClone(p),true,false,false),exported:generateSite(structuredClone(p),false,false,false)};p.bloom=true;p.bloomStrength=1.2;result.bloom=generateSite(structuredClone(p),false,false,false);return result;
  });
  const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,a+' != '+b);
  for(const [mode,html] of Object.entries(generated)){
   errors.length=0;await page.emulateMedia({reducedMotion:'reduce'});
   const file='work/timing-'+mode+'.html',instrumented=html.replace('  function connectSpatial3D(ev){','  window.__timing={adapter:spatial3D,objects:objects,scene:scene,renderer:renderer,tick:tick};\n  function connectSpatial3D(ev){');
   fs.writeFileSync(file,instrumented);await page.goto('file:///'+path.resolve(file).replaceAll('\\','/'));await page.waitForFunction(()=>window.__NAG_SCROLL_DIRECTOR&&window.__timing&&window.__timing.objects[1].children.some(n=>n.children.some(m=>m.name==='realGLB')));
   await page.emulateMedia({reducedMotion:'no-preference'});
   await page.evaluate(()=>{
    const d=window.__timing;window.__timingSample=p=>{
     window.__NAG_SCROLL_DIRECTOR.space.set(p);d.tick();const g=d.objects[1],v=d.adapter.view(g),center=new THREE.Box3().setFromObject(g).getCenter(new THREE.Vector3()).project(v.camera),x=v.rect.left+(center.x+1)*v.rect.width/2,y=v.rect.top+(1-center.y)*v.rect.height/2;
     const gl=d.renderer.getContext(),pixel=new Uint8Array(4),ratio=d.renderer.getPixelRatio();gl.readPixels(Math.floor(x*ratio),Math.floor((innerHeight-y-1)*ratio),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
     return{progress:window.__NAG_SCROLL_DIRECTOR.space.progress(),alpha:pixel[3],camera:v.camera.position.toArray(),objects:d.objects.slice(0,2).map(g=>({pose:g.userData.anchorEl.__nwSpatialPose,pos:g.userData.holder.position.toArray(),scale:g.userData.holder.scale.x,rotation:g.userData.holder.rotation.toArray(),visible:g.userData.holder.visible,anchor:[g.userData.anchorEl.offsetLeft,g.userData.anchorEl.offsetTop,g.userData.anchorEl.offsetWidth],local:[g.position.toArray(),g.rotation.toArray(),g.scale.toArray()],sourceAlpha:g.children[0].material?g.children[0].material.opacity:g.children[0].children[0].material.opacity,tweens:gsap.getTweensOf([g.position,g.rotation,g.scale]).length})),picked:d.adapter.pick([g],x,y)?'model':null,proxies:Array.from(document.querySelectorAll('.sc-proxy')).filter(n=>['box','model'].includes(n.dataset.id)).map(n=>({id:n.dataset.id,display:n.style.display}))};
    };
   });
   const before=await page.evaluate(()=>window.__timingSample(.1));assert.ok(before.objects.every(g=>!g.visible));assert.equal(before.alpha,0);assert.equal(before.picked,null);
   const full=await page.evaluate(()=>window.__timingSample(.4));assert.ok(full.objects.every(g=>g.visible));assert.equal(full.picked,'model');assert.ok(full.objects.every(g=>g.tweens===0),'spatial objects cannot have competing GSAP scroll tweens');
   const half=await page.evaluate(()=>window.__timingSample(.6)),model=half.objects[1],box=half.objects[0];
   close(model.pos[0],model.anchor[0]-500+60);close(model.pos[1],400-model.anchor[1]+20);close(model.pos[2],-920);close(model.pose.opacity,.5);close(model.rotation[0],-10*Math.PI/180);close(model.rotation[1],20*Math.PI/180);close(model.rotation[2],-30*Math.PI/180);assert.equal(model.rotation[3],'ZXY');
   close(box.pos[0],box.anchor[0]-500+96);close(box.pos[1],400-box.anchor[1]-32);close(box.pose.scale,140);close(box.rotation[2],-24*Math.PI/180);assert.notDeepEqual(half.camera,full.camera);
   close(model.sourceAlpha,.6);if(mode!=='bloom'){assert.ok(Math.abs(full.alpha-153)<=2,'GLB authored alpha is rendered');assert.ok(Math.abs(half.alpha-77)<=2,'Director alpha multiplies GLB authored alpha');}else {
    const low=await page.evaluate(()=>{const pose=Object.assign({},window.__timing.objects[1].userData.anchorEl.__nwSpatialPose,{at:0,opacity:5});window.__NAG_SCROLL_DIRECTOR.space.update({id:'model',keyframes:window.NAGWEB_STORY_MODEL.normalize([pose])});return window.__timingSample(.6);});assert.ok(low.alpha>0&&low.alpha<half.alpha,'same-pose bloom fades with the Director opacity');
    await page.evaluate(()=>{const pose=Object.assign({},window.__timing.objects[1].userData.anchorEl.__nwSpatialPose,{at:0,opacity:50});window.__NAG_SCROLL_DIRECTOR.space.update({id:'model',keyframes:window.NAGWEB_STORY_MODEL.normalize([Object.assign({},pose,{at:60}),{at:80,opacity:0},{at:100,opacity:0}])});});
   }
   await page.waitForTimeout(150);assert.deepEqual((await page.evaluate(()=>window.__timingSample(.6))).objects.map(g=>g.local),half.objects.map(g=>g.local),'paused poses cannot drift with the renderer clock');
   await page.evaluate(()=>window.__NAG_SCROLL_DIRECTOR.second.set(.75));assert.deepEqual((await page.evaluate(()=>window.__timingSample(.6))).objects,half.objects,'section timing stays isolated');
   if(mode!=='edit'){
    const gesture=await page.evaluate(()=>{const d=window.__timing,g=d.objects[1],v=d.adapter.view(g),p=new THREE.Box3().setFromObject(g).getCenter(new THREE.Vector3()).project(v.camera),x=v.rect.left+(p.x+1)*v.rect.width/2,y=v.rect.top+(1-p.y)*v.rect.height/2;
     const initial=g.rotation.toArray();window.dispatchEvent(new PointerEvent('pointerdown',{pointerId:99,button:0,clientX:x,clientY:y}));window.dispatchEvent(new PointerEvent('pointermove',{pointerId:99,clientX:x+20,clientY:y+10}));const before=g.rotation.toArray();window.__NAG_SCROLL_DIRECTOR.space.set(.9);window.dispatchEvent(new PointerEvent('pointermove',{pointerId:99,clientX:x+60,clientY:y+30}));d.tick();return{initial,before,after:g.rotation.toArray(),velocity:[g.userData.spinVX,g.userData.spinVY]};});assert.notDeepEqual(gesture.before,gesture.initial);assert.deepEqual(gesture.after,gesture.before);assert.deepEqual(gesture.velocity,[0,0]);
   }
   const after=await page.evaluate(()=>window.__timingSample(.9));assert.ok(after.objects.every(g=>!g.visible));assert.equal(after.alpha,0);assert.equal(after.picked,null);if(mode==='edit')assert.ok(after.proxies.every(p=>p.display==='none'));
   // Live DOM editor updates use the exact same Director evaluation path.
   const updated=await page.evaluate(()=>{window.__NAG_SCROLL_DIRECTOR.space.update({id:'model',keyframes:window.NAGWEB_STORY_MODEL.normalize([{at:0,x:25,y:-15,scale:120,opacity:60},{at:100,x:25,y:-15,scale:120,opacity:60}])});return window.__timingSample(.6);});close(updated.objects[1].pose.x,25);close(updated.objects[1].pose.opacity,.6);assert.equal(updated.objects[1].visible,true);assert.ok(updated.objects[1].pos.every(Number.isFinite));
   await page.emulateMedia({reducedMotion:'reduce'});const reduced=await page.evaluate(()=>window.__timingSample(.6));close(reduced.objects[0].pose.x,0);close(reduced.objects[0].pose.scale,100);close(reduced.objects[1].pose.opacity,.6);close(reduced.objects[1].pos[0],reduced.objects[1].anchor[0]-500);assert.ok(reduced.objects[1].rotation.slice(0,3).every(x=>x===0));
   await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:600,height:500});
   const resized=await page.evaluate(()=>window.__timingSample(.6));close(resized.objects[1].pos[0],resized.objects[1].anchor[0]-300+25);close(resized.objects[1].pos[1],250-resized.objects[1].anchor[1]+15);
   await page.setViewportSize({width:1000,height:800});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.evaluate(()=>{window.__NAG_SCROLL_DIRECTOR.space.live();const sec=document.querySelector('.sc[data-id="space"]');scrollTo(0,(sec.offsetHeight-innerHeight)*.5);});
   try{await page.waitForFunction(()=>Math.abs(window.__NAG_SCROLL_DIRECTOR.space.progress()-.5)<.002);}catch(e){console.log('Live scroll diagnostics',await page.evaluate(()=>({p:window.__NAG_SCROLL_DIRECTOR.space.progress(),scrollY,sec:document.querySelector('.sc[data-id="space"]').getBoundingClientRect().toJSON(),height:document.querySelector('.sc[data-id="space"]').offsetHeight,innerHeight})));throw e;}const live=await page.evaluate(()=>{const d=window.__timing;d.tick();return{p:window.__NAG_SCROLL_DIRECTOR.space.progress(),pose:d.objects[0].userData.anchorEl.__nwSpatialPose};});close(live.pose.x,120*(live.p-.2)/.5);
   assert.deepEqual(errors,[]);console.log('PASS '+mode+': real GLB alpha/visibility, legacy timing and keyframes, moving camera, no competing tweens, updates, reduced motion, resize and live Director scroll');
   await page.evaluate(()=>scrollTo(0,0));
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
