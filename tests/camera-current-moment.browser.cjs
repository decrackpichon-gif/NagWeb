'use strict';
// Real editor, Director, pointer interaction and Undo; one bounded regression flow.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({...(process.env.NAGWEB_BROWSER?{executablePath:process.env.NAGWEB_BROWSER}:{}),headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const vendor=process.env.NAGWEB_TEST_VENDOR_DIR||'work',names=['three.cjs','GLTFLoader.js','gsap.js','ScrollTrigger.js','CopyShader.js','LuminosityHighPassShader.js','EffectComposer.js','RenderPass.js','ShaderPass.js','UnrealBloomPass.js'];
  await page.route('https://**/*',r=>{
   const u=r.request().url(),f=/three(?:\.min)?\.js/.test(u)?'three.cjs':/gsap.min/.test(u)?'gsap.js':/ScrollTrigger/.test(u)?'ScrollTrigger.js':u.split('/').at(-1);
   return names.includes(f)?r.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(vendor,f))}):r.abort();
  });
  await page.goto('file:///'+path.resolve('index.html').replaceAll('\\','/'));
  await page.waitForSelector('#preview');
  await page.evaluate(()=>{
   const s=JSON.parse(JSON.stringify(sec()));
   Object.assign(s,{id:'camera-current-moment',layout:'stack',sdEnabled:true,sdCameraEnabled:true,sdCameraPathMode:'smooth',sdCameraResponsive:true,sdCameraReferenceWidth:1000,sdEase:'linear',sdLength:320,sdPerspective:1000,stType:'cut',
    sdCameraFrames:[{at:0,x:0,y:0,z:0},{at:50,x:200,y:100,z:100,rotateX:10,rotateY:20,rotate:5},{at:100,x:400,y:-100,z:0}],
    elements:[mkEl('heading',{id:'moment-heading',text:'Cámara',anim:'none'})]});
   project.pages[0].sections=[s];curPage=0;curSec=0;curEl=0;curPane='elements';selection=[];secFocus=true;
   history=[];future=[];saveProject();renderScenes();renderPane();renderPreview();
  });
  await page.waitForFunction(()=>document.querySelector('#preview')?.contentWindow?.__NAG_SCROLL_DIRECTOR?.['camera-current-moment']);
  await page.$eval('[data-camera-map-box]',n=>{n.open=true;n.dispatchEvent(new Event('toggle'));});
  const read=()=>page.evaluate(()=>({frames:JSON.stringify(sec().sdCameraFrames),looks:JSON.stringify(sec().sdCameraLookFrames),history:history.length,
   selected:document.querySelector('[data-camera-map-point]')?.dataset.cameraMapPoint||'',time:document.querySelector('[data-camera-current-time]')?.textContent,
   enabled:sec().sdCameraEnabled,focus:secFocus,pane:curPane}));
  await page.click('[data-camera-jump="50"]');
  const baseline=await read();assert.equal(baseline.selected,'50');
  // Editing then undoing before creation also exercises restoration of project identity.
  await page.click('[data-camera-easy-move="right"]');await page.evaluate(()=>undo());
  assert.equal((await read()).frames,baseline.frames);
  await page.evaluate(()=>NAGWEB_SCROLL_DIRECTOR.scrub('camera-current-moment',.42));
  await page.waitForFunction(()=>document.querySelector('[data-camera-current-time]')?.textContent==='42%');
  assert.equal((await read()).selected,'50','Scrubbing keeps selection');
  await page.click('[data-camera-edit-current]');
  const created=await read();assert.equal(created.selected,'42');assert.equal(JSON.parse(created.frames).length,4);assert.equal(created.history,baseline.history+1);
  const point=page.locator('[data-camera-map-point="42"]');await point.scrollIntoViewIfNeeded();
  const r=await point.boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.mouse.move(r.x+r.width/2+12,r.y+r.height/2+8,{steps:4});await page.mouse.up();
  const dragged=await read();assert.notEqual(dragged.frames,created.frames,'Real pointer edits new keyframe');assert.equal(dragged.history,created.history+1);
  await page.evaluate(()=>undo());await page.evaluate(()=>undo());
  const restored=await read();assert.equal(restored.frames,baseline.frames);assert.equal(restored.looks,baseline.looks);
  await page.evaluate(()=>NAGWEB_SCROLL_DIRECTOR.scrub('camera-current-moment',.5));
  await page.waitForFunction(()=>document.querySelector('[data-camera-current-time]')?.textContent==='50%');
  const beforeSelect=await read();await page.click('[data-camera-edit-current]');
  const selected=await read();assert.equal(selected.selected,'50',JSON.stringify({beforeSelect,selected}));assert.equal(selected.frames,baseline.frames);assert.equal(selected.history,beforeSelect.history);
  await page.evaluate(()=>redo());const redone=await read();assert.equal(redone.frames,created.frames,'Selection preserves redo stack');
  await page.evaluate(()=>undo());assert.equal((await read()).frames,baseline.frames);
  // Native closed details may retain client rects in current Chromium.
  // Check actual visibility and occupied height, then persistence on rerender.
  await page.click('[data-camera-overview-toggle]');
  await page.click('[data-camera-overview-metrics] > summary');
  const technical=page.locator('[data-camera-overview-technical]');
  const visibility=()=>technical.evaluate(n=>({open:n.open,visible:n.querySelector('[data-camera-overview-snapshot-info="a"]').checkVisibility(),height:n.getBoundingClientRect().height}));
  const closed=await visibility();assert.equal(closed.open,false);assert.equal(closed.visible,false);
  // No task boundary between native activation and the render caused by a
  // plane change: this reproduces a queued toggle event losing UI state.
  const rapid=await page.evaluate(()=>{
   document.querySelector('[data-camera-overview-technical] > summary').click();
   const plane=document.querySelector('[data-camera-map-plane]');plane.value='front';plane.dispatchEvent(new Event('change',{bubbles:true}));
   return document.querySelector('[data-camera-overview-technical]').open;
  });assert.equal(rapid,true,'Open state survives an immediate plane change before the toggle task');
  const opened=await visibility();assert.equal(opened.visible,true);assert.ok(opened.height>closed.height);
  await page.evaluate(()=>renderPane());assert.equal((await visibility()).visible,true);
  await technical.locator('summary').click();assert.equal((await visibility()).visible,false);
  const final=await read();assert.equal(final.frames,baseline.frames);assert.equal(final.history,baseline.history);
  assert.deepEqual(errors,[]);console.log('PASS current moment: real editor + Director, create, pointer drag, two Undo, exact selection, no duplicate/history edit and Redo');
  console.log('PASS technical details: native visibility, collapsed height, open/close and pane persistence without authored edits');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
