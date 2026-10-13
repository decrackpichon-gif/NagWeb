'use strict';
// Short, independent Chromium regression for all 3D-map object pointer editing.
// Deliberately runs before heavyweight WebGL tests: no previous gestures, Undo,
// iframe reloads or focus state can contaminate the starting conditions.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({...(process.env.NAGWEB_BROWSER?{executablePath:process.env.NAGWEB_BROWSER}:{}),headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const vendor=process.env.NAGWEB_TEST_VENDOR_DIR||'work',names=['three.cjs','GLTFLoader.js','gsap.js','ScrollTrigger.js','CopyShader.js','LuminosityHighPassShader.js','EffectComposer.js','RenderPass.js','ShaderPass.js','UnrealBloomPass.js'];
  await page.route('https://**/*',route=>{
   const u=route.request().url(),f=/three(?:\.min)?\.js/.test(u)?'three.cjs':/gsap.min/.test(u)?'gsap.js':/ScrollTrigger/.test(u)?'ScrollTrigger.js':u.split('/').at(-1);
   return names.includes(f)?route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(vendor,f))}):route.abort();
  });
  await page.goto('file:///'+path.resolve('index.html').replaceAll('\\','/'));
  await page.waitForSelector('#preview');
  await page.evaluate(()=>{
   const s=JSON.parse(JSON.stringify(sec()));
   Object.assign(s,{id:'spatial-drag-isolated',layout:'free',sdEnabled:true,sdCameraEnabled:true,
    sdCameraOrientationMode:'manual',sdCameraPathMode:'linear',sdEase:'linear',
    sdCameraFrames:[{at:0,x:0,y:0,z:0},{at:100,x:0,y:0,z:0}],
    elements:[mkEl('shape3d',{id:'spatial-test-box',anchor:true,shape:'box',x:62,y:54,w:22,h:22,offZ:0}),
     mkEl('heading',{id:'spatial-test-heading',text:'Plano de texto',x:45,y:50,w:25,sdCameraDepth:0,sdEnter:'none'})]});
   project.pages[0].sections=[s];curPage=0;curSec=0;curEl=0;curPane='elements';selection=[];secFocus=true;
   history=[];future=[];saveProject();renderScenes();renderPane();renderPreview();
  });
  await page.waitForSelector('[data-camera-space-open]');
  await page.evaluate(()=>document.querySelector('[data-camera-space-open]').click());
  await page.locator('[data-camera-map-plane]').selectOption('front');
  const marker=page.locator('[data-camera-scene-object-pick="1"]');
  await marker.scrollIntoViewIfNeeded();
  const rect=await marker.boundingBox(),mapRect=await page.locator('[data-camera-map]').boundingBox();
  assert.ok(rect?.width&&mapRect?.width,'Object marker and map must have real dimensions');
  const px=rect.x+rect.width/2,py=rect.y+rect.height/2;
  const leftRoom=px-mapRect.x,rightRoom=mapRect.x+mapRect.width-px;
  const dx=rightRoom>=leftRoom?Math.min(30,rightRoom-8):-Math.min(30,leftRoom-8);
  assert.ok(Math.abs(dx)>=8,'Pointer drag remains within the physical map');
  const before=await page.evaluate(()=>({x:sec().elements.find(e=>e.id==='spatial-test-heading').x,
   camera:JSON.stringify(sec().sdCameraFrames),undo:history.length}));
  await page.evaluate(()=>{
   window.__isolatedDragTrace=[];
   for(const type of ['pointerdown','pointermove','pointerup','mousemove','mouseup','pointercancel']){
    document.addEventListener(type,e=>{
     if(window.__isolatedDragTrace.length<25)window.__isolatedDragTrace.push({type,x:e.clientX,y:e.clientY,tag:e.target.tagName});
    },true);
   }
  });
  await page.mouse.move(px,py);await page.mouse.down();
  const shieldAtStart=await page.evaluate(()=>({
   shield:!!document.querySelector('[data-nw-spatial-drag-shield]'),
   captured:document.querySelector('[data-nw-spatial-drag-shield]')?.hasPointerCapture?.(1),
   focused:document.hasFocus()
  }));
  await page.mouse.move(px+dx,py,{steps:6});await page.mouse.up();
  const after=await page.evaluate(()=>({x:sec().elements.find(e=>e.id==='spatial-test-heading').x,
   camera:JSON.stringify(sec().sdCameraFrames),undo:history.length,
   shield:!!document.querySelector('[data-nw-spatial-drag-shield]'),events:window.__isolatedDragTrace}));
  if(!((after.x-before.x)*dx>0))console.log('ISOLATED MAP DRAG TRACE '+JSON.stringify({before,after,shieldAtStart,mapRect,rect,dx}));
  assert.ok((after.x-before.x)*dx>0,'Real pointer changes the HTML object X within the map');
  assert.equal(after.camera,before.camera,'Object drag preserves camera frames');
  assert.equal(after.undo,before.undo+1,'One mouse gesture creates exactly one Undo');
  assert.equal(after.shield,false,'Temporary pointer shield is removed after mouseup');
  await page.evaluate(()=>undo());
  assert.equal(await page.evaluate(()=>sec().elements.find(e=>e.id==='spatial-test-heading').x),before.x,'Undo restores authored position');
  assert.deepEqual(errors,[]);
  console.log('PASS isolated Chromium spatial map: real pointer movement, DOM X, cleanup, one Undo and camera isolation');
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
