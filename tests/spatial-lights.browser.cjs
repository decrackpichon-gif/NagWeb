'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
const browser=await chromium.launch({...(process.env.NAGWEB_BROWSER?{executablePath:process.env.NAGWEB_BROWSER}:{}),headless:true,args:['--enable-unsafe-swiftshader']});
try{
fs.mkdirSync('work',{recursive:true});const vendors=process.env.NAGWEB_TEST_VENDOR_DIR;
const source=file=>fs.readFileSync(vendors?path.join(vendors,file):require.resolve({'three.cjs':'three/build/three.js','gsap.js':'gsap/dist/gsap.js','ScrollTrigger.js':'gsap/dist/ScrollTrigger.js'}[file]));
const page=await browser.newPage({viewport:{width:1000,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('https://**/*',route=>{const u=route.request().url(),file=/three(?:\.min)?\.js/.test(u)?'three.cjs':/ScrollTrigger/.test(u)?'ScrollTrigger.js':/gsap.min/.test(u)?'gsap.js':null;return file?route.fulfill({contentType:'text/javascript',body:source(file)}):route.abort();});
await page.goto('file:///'+path.resolve('index.html').replaceAll('\\','/'));await page.waitForFunction(()=>!!window.NAGWEB_CREATE_SPATIAL_RENDERER);
assert.deepEqual(errors,[]);
const generated=await page.evaluate(()=>{
 const p=starterProject();p.light='studio';p.progress=false;p.sections=[mkSection({id:'lit',layout:'free',sdEnabled:true,sdCameraEnabled:true,sdEase:'linear',sdCameraFrames:[{at:0,x:0,y:0,z:0},{at:100,x:150,y:30,z:0,rotateX:5,rotateY:10}],elements:[mkEl('shape3d',{sdEnter:'none',id:'box',shape:'box',motion:'still',env:'',color:'#FFFFFF',metalness:0,roughness:1,x:50,y:50,w:30}),mkEl('light3d',{id:'point',kind:'point',offX:1.2,offY:1.2,offZ:3,intensity:2,distance:22,color:'#FFFFFF'}),mkEl('light3d',{id:'spot',kind:'spot',offX:0,offY:1,offZ:4,intensity:3,distance:30,color:'#FFFFFF'}),mkEl('light3d',{id:'directional',kind:'directional',offX:1,offY:1,offZ:4,intensity:2,color:'#FFFFFF'})]}),mkSection({id:'foreign',layout:'free',elements:[mkEl('light3d',{id:'foreign-light',kind:'point',offX:0,offY:0,offZ:3,intensity:30,distance:60,color:'#FF0000'})]})];
 return{edit:generateSite(structuredClone(p),true,false,false),exported:generateSite(structuredClone(p),false,false,false)};
});
for(const [mode,html] of Object.entries(generated)){
 errors.length=0;const instrumented=html.replace('  function connectSpatial3D(ev){',`  window.__lightTest={adapter:spatial3D,objects:objects,lights:lightObjs,renderer:renderer,scene:scene,tick:tick,get proxies(){return proxies;}};
  function connectSpatial3D(ev){`);
 const file='work/lights-'+mode+'.html';fs.writeFileSync(file,instrumented);await page.goto('file:///'+path.resolve(file).replaceAll('\\','/'));await page.waitForFunction(()=>window.__lightTest&&window.__lightTest.adapter.view(window.__lightTest.lights[0]));
 const pixels=await page.evaluate(()=>{
  const d=window.__lightTest,lights=d.scene.children.filter(n=>n.isLight),director=window.__NAG_SCROLL_DIRECTOR.lit;director.set(0);
  lights.forEach(l=>l.intensity=0);
  function pixel(){d.tick();const gl=d.renderer.getContext(),p=new Uint8Array(4);gl.readPixels(gl.drawingBufferWidth/2,gl.drawingBufferHeight/2,1,1,gl.RGBA,gl.UNSIGNED_BYTE,p);return Array.from(p);}
  const off=pixel(),each={};d.lights.filter(l=>l.userData.sectionId==='lit').forEach(l=>{l.intensity=.2;each[l.userData.o.kind]=pixel();l.intensity=0;});
  const point=d.lights[0];point.intensity=.2;point.distance=.2;const short=pixel();point.distance=22;const on=pixel();d.lights[3].intensity=100;const foreign=pixel();
  return{off,each,short,on,foreign};
 });
 assert.equal(pixels.off[3],255,'sample must hit opaque geometry');const brightness=p=>p[0]+p[1]+p[2];
 for(const [kind,p] of Object.entries(pixels.each))assert.ok(brightness(p)>brightness(pixels.off)+30,kind+' must illuminate real geometry');
 assert.deepEqual(pixels.short,pixels.off,'short reach must stop before the object');assert.ok(brightness(pixels.on)>brightness(pixels.short)+30);assert.ok(pixels.on.slice(0,3).every(v=>v>0&&v<240),'isolation sample must remain unsaturated');assert.deepEqual(pixels.foreign,pixels.on,'foreign section light cannot change these pixels');
 console.log('PASS '+mode+': real GPU lighting and reach for point/spot/directional, no cross-section bleed',JSON.stringify(pixels));
 await page.evaluate(()=>{const d=window.__lightTest;window.__NAG_SCROLL_DIRECTOR.lit.set(.5);d.tick();});
 const before=await page.evaluate(()=>{const d=window.__lightTest,l=d.lights[0],v=d.adapter.view(l),p=v.object.getWorldPosition(new THREE.Vector3()).project(v.camera);return{x:v.rect.left+(p.x+1)*v.rect.width/2,y:v.rect.top+(1-p.y)*v.rect.height/2,world:v.object.getWorldPosition(new THREE.Vector3()).toArray(),legacy:l.position.toArray()};});
 if(mode==='edit'){
  await page.evaluate(()=>{const d=window.__lightTest;d.proxies.find(p=>p.id==='point').node.setAttribute('data-test-light','point');window.__lightMessages=[];addEventListener('message',e=>{if(e.data&&e.data.type==='change3d')window.__lightMessages.push(e.data);});});
  const proxy=await page.locator('[data-test-light="point"]').boundingBox();assert.ok(proxy);assert.ok(Math.abs(proxy.x+proxy.width/2-before.x)<1);assert.ok(Math.abs(proxy.y+proxy.height/2-before.y)<1);
  await page.mouse.move(before.x,before.y);await page.mouse.down();await page.mouse.move(before.x+30,before.y-20,{steps:4});await page.mouse.up();
  await page.waitForFunction(()=>window.__lightMessages.length>0);
  const drag=await page.evaluate(()=>{const d=window.__lightTest;d.tick();return{message:window.__lightMessages.at(-1),position:d.lights[0].position.toArray(),intensity:d.lights[0].intensity};});
  assert.equal(drag.message.id,'point');assert.ok(drag.message.offX>1.2);assert.ok(drag.message.offY>1.2);assert.equal(drag.position[0],drag.message.offX);assert.equal(drag.position[1],drag.message.offY);assert.equal(drag.intensity,.2);
  console.log('PASS edit: projected light handle and native-coordinate mouse drag under rotated spatial camera');
 }
 await page.setViewportSize({width:500,height:600});await page.waitForFunction(()=>Math.abs(window.__lightTest.adapter.view(window.__lightTest.lights[0]).camera.aspect-5/6)<1e-8);
 const resize=await page.evaluate(()=>{const d=window.__lightTest;d.tick();const l=d.lights[0],copy=d.adapter.view(l).object;return{scale:copy.parent.scale.x,reach:copy.distance,sourceDistance:l.distance};});
 assert.ok(Math.abs(resize.reach/resize.scale-resize.sourceDistance)<1e-7);
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>window.__lightTest.adapter.view(window.__lightTest.lights[0]).camera.position.x===0);await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:1000,height:800});
 await page.evaluate(()=>{window.__NAG_SCROLL_DIRECTOR.lit.set(0);window.__lightTest.tick();});await page.screenshot({path:'work/lights-'+mode+'.png'});
 const cleanup=await page.evaluate(()=>{const d=window.__lightTest,n=d.scene.children.length;window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));const retained=!!d.adapter.view(d.lights[0]);window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false}));return{retained,removed:n-d.scene.children.length,view:d.adapter.view(d.lights[0])};});
 assert.equal(cleanup.retained,true);assert.equal(cleanup.removed,1);assert.equal(cleanup.view,null);assert.deepEqual(errors,[]);console.log('PASS '+mode+': resize, reduced motion and pagehide cleanup');
}
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
