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
   const p=starterProject();snapOn=false;p.progress=false;p.bloom=false;p.light='soft';
   p.sections=[mkSection({id:'space',layout:'free',sdEnabled:true,sdCameraEnabled:true,sdEase:'linear',sdCameraFrames:[{at:0,x:0,y:0,z:0},{at:100,x:50,y:15,z:20}],elements:[
    mkEl('container',{id:'outer',x:50,y:50,w:50,h:400,rot:15,bg:'transparent',bgOpacity:0,border:'',shadow:false,sdCameraDepth:0,sdEnter:'none',sdKeyframes:[{at:0},{at:100,x:80,y:20,z:50,rotate:30,rotateX:10,rotateY:8,scale:140}]}),
    mkEl('container',{id:'nested',parent:'outer',x:60,y:40,w:65,h:200,rot:-10,bg:'transparent',bgOpacity:0,border:'',shadow:false,sdEnter:'none',sdKeyframes:[{at:0},{at:100,y:-30,z:20,rotate:-20,rotateX:-5,scale:80}]}),
    mkEl('shape3d',{id:'box',parent:'nested',shape:'box',motion:'spin',entrance:'grow',env:'',x:25,y:50,w:30,dragRotate:true,sdEnter:'none',sdKeyframes:[{at:0},{at:100,x:30,y:10,z:20,rotate:5,rotateX:5,rotateY:-10,scale:120}]}),
    mkEl('shape3d',{id:'model',parent:'nested',shape:'model',modelId:'triangle',motion:'tumble',entrance:'left',env:'',x:75,y:50,w:25,dragRotate:true,sdEnter:'none'}),
    mkEl('shape3d',{id:'outside',shape:'box',motion:'still',entrance:'none',env:'',x:88,y:80,w:8,sdEnter:'none'}),
    mkEl('container',{id:'auto',stackDir:'column',x:12,y:80,w:15,h:150,bg:'transparent',sdEnter:'none'}),
    mkEl('shape3d',{id:'unsupported',parent:'auto',shape:'box',motion:'still',entrance:'none',env:'',x:10,y:20,w:6,sdEnter:'none'})
   ]})];
   const bin=new Float32Array([-1,-1,0,1,-1,0,0,1,0]),json={asset:{version:'2.0'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0}],meshes:[{name:'realGLB',primitives:[{attributes:{POSITION:0},material:0}]}],materials:[{emissiveFactor:[1,1,1],pbrMetallicRoughness:{baseColorFactor:[1,1,1,.6],metallicFactor:0,roughnessFactor:1},alphaMode:'BLEND',doubleSided:true}],buffers:[{byteLength:bin.byteLength}],bufferViews:[{buffer:0,byteOffset:0,byteLength:bin.byteLength}],accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3',min:[-1,-1,0],max:[1,1,0]}]};
   let j=JSON.stringify(json);while(j.length%4)j+=' ';const bytes=new Uint8Array(28+j.length+bin.byteLength),v=new DataView(bytes.buffer);v.setUint32(0,0x46546c67,true);v.setUint32(4,2,true);v.setUint32(8,bytes.length,true);v.setUint32(12,j.length,true);v.setUint32(16,0x4e4f534a,true);bytes.set(new TextEncoder().encode(j),20);v.setUint32(20+j.length,bin.byteLength,true);v.setUint32(24+j.length,0x004e4942,true);bytes.set(new Uint8Array(bin.buffer),28+j.length);
   p.assets.models=[{id:'triangle',format:'glb',data:btoa(String.fromCharCode(...bytes))}];
   const result={edit:generateSite(structuredClone(p),true,false,false),exported:generateSite(structuredClone(p),false,false,false)};
   const anchors=html=>JSON.parse(html.match(/\)\((\[\{"id":"space"[\s\S]*?\]),function/)[1])[0].anchors;
   if(JSON.stringify(anchors(result.exported))!==JSON.stringify([{id:'box',parent:'nested'},{id:'model',parent:'nested'}]))throw Error('Incorrect supported hierarchy metadata');
   for(const special of [{stackDir:'column'},{listOf:'missing-collection'},{nwMotionInstance:{source:'scroll',template:'custom'}},{fixed:true},{modal:true},{sticky:true},{universal:true}]){
    const q=structuredClone(p);Object.assign(q.sections[0].elements[0],special);if(anchors(generateSite(q,false,false,false)).length)throw Error('Unsupported parent was reparented: '+JSON.stringify(special));
   }
   const noCamera=structuredClone(p);noCamera.sections[0].sdCameraEnabled=false;if(anchors(generateSite(noCamera,false,false,false)).length)throw Error('Disabled camera changed anchor ancestry');
   const stacked=structuredClone(p);stacked.sections[0].layout='stack';if(anchors(generateSite(stacked,false,false,false)).length)throw Error('Stack scene changed anchor ancestry');
   p.bloom=true;p.bloomStrength=1.2;result.bloom=generateSite(structuredClone(p),false,false,false);p.bloom=false;p.sections[0].sdCameraFrames[1]=Object.assign({},p.sections[0].sdCameraFrames[1],{rotate:5,rotateX:3,rotateY:8});result.rotated=generateSite(structuredClone(p),false,false,false);return result;
  });
  const close=(a,b,t=1e-4)=>assert.ok(Math.abs(a-b)<t,a+' != '+b);
  for(const [mode,html] of Object.entries(generated)){
   errors.length=0;await page.emulateMedia({reducedMotion:'reduce'});
   const file='work/hierarchy-'+mode+'.html',instrumented=html.replace('  function connectSpatial3D(ev){','  window.__hierarchy={adapter:spatial3D,objects:objects,scene:scene,renderer:renderer,tick:tick};\n  function connectSpatial3D(ev){');
   fs.writeFileSync(file,instrumented);await page.goto('file:///'+path.resolve(file).replaceAll('\\','/'));await page.waitForFunction(()=>window.__NAG_SCROLL_DIRECTOR&&window.__hierarchy&&window.__hierarchy.objects[1].children.some(n=>n.children.some(m=>m.name==='realGLB')));
   await page.emulateMedia({reducedMotion:'no-preference'});
   await page.evaluate(()=>{
    const d=window.__hierarchy;window.__hierarchySample=p=>{window.__NAG_SCROLL_DIRECTOR.space.set(p);d.tick();return d.objects.map(g=>({id:g.userData.o.id,parent:g.userData.anchorEl.parentElement.dataset.id||'',enabled:g.userData.anchorEl.hasAttribute('data-nw-spatial-parent'),width:g.userData.anchorEl.offsetWidth,pos:g.userData.holder.position.toArray(),matrix:g.userData.holder.matrix.toArray(),native:g.userData.nativeR,opacity:g.userData.spatialOpacity,visible:g.userData.holder.visible,tweens:gsap.getTweensOf([g.position,g.rotation,g.scale]).length}));};
    window.__hierarchyPoint=i=>{d.tick();const g=d.objects[i],v=d.adapter.view(g),p=g.userData.holder.getWorldPosition(new THREE.Vector3()).project(v.camera);return{x:v.rect.left+(p.x+1)*v.rect.width/2,y:v.rect.top+(1-p.y)*v.rect.height/2};};
    window.__hierarchyAlpha=()=>{const d=window.__hierarchy;d.tick();const p=window.__hierarchyPoint(1),gl=d.renderer.getContext(),pixel=new Uint8Array(4),ratio=d.renderer.getPixelRatio();gl.readPixels(Math.floor(p.x*ratio),Math.floor((innerHeight-p.y-1)*ratio),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);return pixel[3];};
   });
   const base=await page.evaluate(()=>window.__hierarchySample(0));assert.equal(base[0].parent,'nested');assert.equal(base[1].parent,'nested');assert.ok(base[0].enabled&&base[1].enabled);assert.equal(base[3].enabled,false);assert.ok(base[0].width<120,'anchor width is now relative to its real parent');assert.ok(base.every(g=>g.tweens===0));
   // Browser layout provides an independent reference for the nested centre.
   const alignment=await page.evaluate(()=>{const d=window.__hierarchy,g=d.objects[1],n=g.userData.anchorEl,m=document.createElement('div');m.style.cssText='position:absolute;width:0;height:0;left:'+n.style.left+';top:'+n.style.top+';pointer-events:none';n.parentElement.appendChild(m);const r=m.getBoundingClientRect(),p=window.__hierarchyPoint(1);m.remove();return{dom:[r.left,r.top],three:[p.x,p.y]};});close(alignment.dom[0],alignment.three[0],1);close(alignment.dom[1],alignment.three[1],1);
   // Actual adapter placement must include an offset/bordered camera world,
   // for both a root shape and the nested, asynchronously loaded GLB.
   const layoutAlignment=await page.evaluate(()=>{
    const d=window.__hierarchy,world=d.objects[1].userData.anchorEl.closest('[data-nw-camera-world]'),saved=world.style.cssText;
    const root=d.objects[2].userData.anchorEl,rootParent=root.parentElement,rootNext=root.nextSibling;world.appendChild(root);
    world.style.inset='19px 0 0 27px';world.style.border='4px solid transparent';
    window.__hierarchySample(0);
    const results=[1,2].map(i=>{
     const g=d.objects[i],n=g.userData.anchorEl,parents=[];for(let p=n.parentElement;p&&p!==world;p=p.parentElement)parents.push(p);
     const styles=parents.map(p=>p.style.cssText);parents.forEach(p=>{p.style.setProperty('overflow','visible');p.style.setProperty('filter','none','important');p.style.transformStyle='preserve-3d';p.style.willChange='transform';});
     const marker=document.createElement('div');marker.style.cssText='position:absolute;width:0;height:0;left:'+n.offsetLeft+'px;top:'+n.offsetTop+'px';n.parentElement.appendChild(marker);
     const r=marker.getBoundingClientRect(),p=window.__hierarchyPoint(i);marker.remove();parents.forEach((p,j)=>p.style.cssText=styles[j]);
     return{dom:[r.left,r.top],three:[p.x,p.y],native:g.userData.nativeR};
    });world.style.cssText=saved;rootParent.insertBefore(root,rootNext);window.__hierarchySample(0);return results;
   });
   layoutAlignment.forEach((q,i)=>{q.dom.forEach((x,j)=>close(x,q.three[j],1));close(q.native,base[i===0?1:2].native);});
   const moved=await page.evaluate(()=>window.__hierarchySample(.6));assert.notDeepEqual(moved[0].pos,base[0].pos);assert.notDeepEqual(moved[1].matrix,base[1].matrix);assert.deepEqual(moved[2].pos,base[2].pos);close(moved[1].native,base[1].native);assert.ok(moved[0].visible&&moved[1].visible);
   // Isolate affine transforms from CSS grouping/flattening. Production clipping,
   // filters and will-change stay untouched; their DOM/WebGL parity is outside v1.
   const spatialAlignment=await page.evaluate(()=>{const d=window.__hierarchy,g=d.objects[1],n=g.userData.anchorEl,parents=[n.parentElement,n.parentElement.parentElement],saved=parents.map(p=>p.style.cssText);parents.forEach(p=>{p.style.setProperty('overflow','visible');p.style.setProperty('filter','none','important');p.style.transformStyle='preserve-3d';p.style.willChange='transform';});const m=document.createElement('div');m.style.cssText='position:absolute;width:0;height:0;left:'+n.offsetLeft+'px;top:'+n.offsetTop+'px;pointer-events:none';n.parentElement.appendChild(m);const r=m.getBoundingClientRect(),point=window.__hierarchyPoint(1);m.remove();parents.forEach((p,i)=>p.style.cssText=saved[i]);return{dom:[r.left,r.top],three:[point.x,point.y]};});spatialAlignment.dom.forEach((x,i)=>close(x,spatialAlignment.three[i],1));
   // A ray through the inherited plane must recover local container pixels.
   const inverse=await page.evaluate(()=>{const d=window.__hierarchy,g=d.objects[1],m=g.userData.spatialParent,v=d.adapter.view(g),n=g.userData.anchorEl,point=new THREE.Vector3(n.offsetLeft+17,-n.offsetTop+12,0).applyMatrix4(m).project(v.camera),x=v.rect.left+(point.x+1)*v.rect.width/2,y=v.rect.top+(1-point.y)*v.rect.height/2,local=d.adapter.anchorPoint(g,x,y);return{local:local.toArray(),expected:[n.offsetLeft+17,-n.offsetTop+12,0]};});inverse.local.forEach((x,i)=>close(x,inverse.expected[i]));
   await page.evaluate(()=>window.__NAG_SCROLL_DIRECTOR.space.update(window.NAGWEB_STORY_MODEL.compile({id:'outer',sdKeyframes:[{at:0,opacity:50},{at:100,opacity:50}]})));await page.evaluate(()=>window.__hierarchySample(0));const halfAlpha=await page.evaluate(()=>window.__hierarchyAlpha());assert.ok(halfAlpha>0);if(mode!=='bloom')assert.ok(Math.abs(halfAlpha-77)<=2,'parent alpha multiplies original GLB alpha');
   await page.evaluate(()=>window.__NAG_SCROLL_DIRECTOR.space.update(window.NAGWEB_STORY_MODEL.compile({id:'nested',sdKeyframes:[{at:0,opacity:0},{at:100,opacity:0}]})));const hidden=await page.evaluate(()=>{const d=window.__hierarchy,p=window.__hierarchyPoint(1);const others=d.objects.slice(2).map(g=>g.visible);d.objects.slice(2).forEach(g=>g.visible=false);const alpha=window.__hierarchyAlpha();d.objects.slice(2).forEach((g,i)=>g.visible=others[i]);return{sample:window.__hierarchySample(0),pick:d.adapter.pick([d.objects[0],d.objects[1]],p.x,p.y),alpha,proxies:Array.from(document.querySelectorAll('.sc-proxy')).filter(n=>['box','model'].includes(n.dataset.id)).map(n=>n.style.display)};});assert.ok(!hidden.sample[0].visible&&!hidden.sample[1].visible);assert.equal(hidden.pick,null);assert.equal(hidden.alpha,0);if(mode==='edit')assert.ok(hidden.proxies.every(x=>x==='none'));
   await page.evaluate(()=>{for(const id of ['outer','nested'])window.__NAG_SCROLL_DIRECTOR.space.update(window.NAGWEB_STORY_MODEL.compile({id,sdEnter:'none'}));});await page.emulateMedia({reducedMotion:'reduce'});const reduced=await page.evaluate(()=>window.__hierarchySample(.6));reduced[1].pos.forEach((x,i)=>close(x,base[1].pos[i]));
   await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:600,height:500});const resized=await page.evaluate(()=>window.__hierarchySample(0));assert.ok(resized[1].width<base[1].width);close(resized[1].native,base[1].native);
   await page.setViewportSize({width:1000,height:800});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.evaluate(()=>window.__hierarchySample(0));
   if(mode==='edit'){
    const start=await page.evaluate(()=>{const d=window.__hierarchy,g=d.objects[1],n=g.userData.anchorEl,p=window.__hierarchyPoint(1);return{p,x:+n.dataset.x,y:+n.dataset.y,parent:n.parentElement.clientWidth,height:n.parentElement.clientHeight,point:d.adapter.anchorPoint(g,p.x,p.y).toArray()};});
    const endPoint={x:start.p.x+22,y:start.p.y+14};const expected=await page.evaluate(p=>{const d=window.__hierarchy;return d.adapter.anchorPoint(d.objects[1],p.x,p.y).toArray();},endPoint);
    await page.mouse.move(start.p.x,start.p.y);await page.mouse.down();await page.mouse.move(endPoint.x,endPoint.y,{steps:4});await page.mouse.up();const saved=await page.evaluate(()=>{const n=window.__hierarchy.objects[1].userData.anchorEl;return{x:parseFloat(n.style.left),y:parseFloat(n.style.top)};});close(saved.x,start.x+(expected[0]-start.point[0])/start.parent*100,.001);close(saved.y,start.y-(expected[1]-start.point[1])/start.height*100,.001);
   }
   assert.deepEqual(errors,[]);console.log('PASS '+mode+': nested layout/affine inheritance, loaded GLB, one camera pass, independent objects, parent alpha/visibility, inverse plane, resize and reduced motion');
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
