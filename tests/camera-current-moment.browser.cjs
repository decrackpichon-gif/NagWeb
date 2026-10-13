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
  await page.selectOption('[data-camera-map-plane]','top');
  const cones=()=>page.locator('[data-camera-overview-fov]').count(),fov=page.locator('[data-camera-overview-compare-fov-toggle]');
  assert.equal(await fov.isChecked(),true);assert.equal(await cones(),2);
  await page.evaluate(()=>{const p=sec().sdPerspective;sec().sdPerspective=650;renderPane();sec().sdPerspective=p;renderPane();});
  await fov.click();assert.equal(await fov.isChecked(),false);assert.equal(await cones(),0,'Pointer hides both FOV cones after perspective rerenders');
  await fov.focus();await page.keyboard.press('Space');assert.equal(await fov.isChecked(),true);assert.equal(await cones(),2,'Keyboard restores both cones');
  await fov.focus();await page.keyboard.press('Space');assert.equal(await cones(),0);
  await page.selectOption('[data-camera-map-plane]','front');assert.equal(await fov.isChecked(),false,'Hidden state survives plane change');
  const final=await read();assert.equal(final.frames,baseline.frames);assert.equal(final.history,baseline.history);
  // Rebuilding a preview retains Director progress: establish zero explicitly
  // before asserting a moving object's map displacement at the next sample.
  await page.evaluate(()=>{
   const s=sec();s.layout='free';s.elements=[mkEl('heading',{id:'guide-regression',text:'Objeto móvil',x:75,y:50,w:20,anim:'none',sdCameraDepth:500,
    sdKeyframes:[{at:0,x:0,y:0,z:0,ease:'linear'},{at:100,x:100,y:0,z:100,ease:'linear'}]})];
   NAGWEB_SCROLL_DIRECTOR.scrub(s.id,.5);renderPane();renderPreview();
  });
  await page.selectOption('[data-camera-map-plane]','top');
  const guideX=()=>page.locator('[data-camera-scene-object]').first().evaluate(n=>+n.getAttribute('transform').match(/translate\(([-\d.]+)/)[1]);
  const retained=await guideX();
  await page.evaluate(()=>NAGWEB_SCROLL_DIRECTOR.scrub(sec().id,0));const start=await guideX();
  await page.evaluate(()=>NAGWEB_SCROLL_DIRECTOR.scrub(sec().id,.5));const moved=await guideX();
  assert.ok(moved>start+1,'Object map follows Director from zero to 50%');
  assert.ok(Math.abs(retained-moved)<.001,'Preview rebuild retains the existing 50% moment');
  await page.selectOption('[data-camera-object-select]','0');
  const inspect=()=>page.locator('[data-camera-object-xyz]').textContent();
  const width=await page.evaluate(()=>document.querySelector('#preview').contentDocument.querySelector('.nw-sd-stage').clientWidth);
  assert.ok((await inspect()).includes('X '+Math.round(width*.25+50))&&(await inspect()).includes('Z 550'),'Inspector follows actual wide-stage coordinates');
  await page.evaluate(()=>{document.querySelector('#preview').style.setProperty('width','600px','important');});
  await page.waitForFunction(()=>document.querySelector('#preview').contentDocument.querySelector('.nw-sd-stage').clientWidth===600);
  await page.evaluate(()=>renderPane());
  assert.ok((await inspect()).includes('X 300')&&(await inspect()).includes('Z 550'),'Responsive inspector uses reference coordinates in narrow preview');
  await page.evaluate(()=>NAGWEB_SCROLL_DIRECTOR.scrub(sec().id,0));
  assert.ok((await inspect()).includes('X 250')&&(await inspect()).includes('Z 500'),'Narrow inspector follows Director zero moment');
  // Full browser editor -> same-origin preview -> WebGL holder workflow.
  // The generated 3D box needs no external model download; the separate
  // spatial-interaction.browser suite already exercises real loaded GLBs.
  await page.evaluate(()=>{
   const s=sec();s.layout='free';s.sdCameraOrientationMode='manual';
   s.sdCameraFrames=[{at:0,x:0,y:0,z:0,rotateX:0,rotateY:0},{at:100,x:0,y:0,z:0,rotateX:0,rotateY:0}];
   s.elements=[mkEl('shape3d',{id:'gizmo-real-box',name:'Objeto de prueba',shape:'box',anchor:true,
    x:50,y:50,w:24,h:24,offZ:0,motion:'still',sdEnter:'none',sdEnd:100})];
   NAGWEB_SCROLL_DIRECTOR.scrub(s.id,0);renderPane();renderPreview();
  });
  await page.waitForFunction(()=>{
   const w=document.getElementById('preview')?.contentWindow,s=sec();
   return w&&typeof w.NAGWEB_SPATIAL_SCREEN_POINT==='function'&&w.NAGWEB_SPATIAL_SCREEN_POINT('gizmo-real-box',s.id);
  },{timeout:20000});
  await page.selectOption('[data-camera-object-select]','0');
  const edit3D=()=>page.evaluate(()=>({yaw:sec().elements[0].nwSpatialRotateY||0,
   depth:sec().elements[0].offZ||0,scale:sec().elements[0].nwSpatialScale||100,
   camera:JSON.stringify(sec().sdCameraFrames),history:history.length,progress:NAGWEB_SCROLL_DIRECTOR.progress(sec().id)}));
  const beforeGizmo=await edit3D();
  // Undo schedules an iframe refresh: a stale world point can exist before
  // that refresh starts and then dismiss the next tool on iframe 'load'.
  async function awaitSettledPreview(){
   await page.evaluate(()=>new Promise(resolve=>{
    const frame=document.getElementById('preview');
    const fallback=setTimeout(resolve,1300);
    frame.addEventListener('load',()=>{clearTimeout(fallback);setTimeout(resolve,100);},{once:true});
   }));
   await page.waitForFunction(()=>{
    const w=document.getElementById('preview')?.contentWindow;
    return w&&w.NAGWEB_SPATIAL_SCREEN_POINT?.('gizmo-real-box',sec().id);
   });
  }
  await page.click('[data-camera-object-transform]');
  const yaw=page.frameLocator('#preview').locator('[data-nw-base-axis="RotateY"]');
  await yaw.waitFor({state:'visible'});
  const yr=await yaw.boundingBox();assert.ok(yr&&yr.width>0);
  // Physical mouse pixels may be scaled into iframe-local CSS coordinates.
  // Record the real local pointer delta the editor actually receives.
  await page.evaluate(()=>{
   const d=document.getElementById('preview').contentDocument;
   window.__gizmoProbe={yaw:{}};
   d.addEventListener('pointerdown',ev=>{
    if(ev.target.closest&&ev.target.closest('[data-nw-base-axis="RotateY"]'))window.__gizmoProbe.yaw.start=ev.clientX;
   },true);
   d.addEventListener('pointermove',ev=>{
    if(window.__gizmoProbe.yaw.start!==undefined)window.__gizmoProbe.yaw.end=ev.clientX;
   },true);
  });
  await page.mouse.move(yr.x+yr.width/2,yr.y+yr.height/2);
  await page.mouse.down();await page.mouse.move(yr.x+yr.width/2+50,yr.y+yr.height/2,{steps:5});
  await page.mouse.up();
  const turned=await edit3D();
  const realYawDelta=await page.evaluate(()=>window.__gizmoProbe.yaw.end-window.__gizmoProbe.yaw.start);
  assert.ok(Number.isFinite(realYawDelta)&&realYawDelta>0,'Real iframe received pointer movement');
  assert.equal(turned.yaw,Math.round(realYawDelta*.6*10)/10,'Yaw follows measured iframe-local mouse delta');
  assert.equal(turned.history,beforeGizmo.history+1,'Real gizmo drag creates a single Undo');
  assert.equal(turned.camera,beforeGizmo.camera,'Gizmo cannot rewrite camera frames');
  await page.evaluate(()=>undo());
  assert.equal((await edit3D()).yaw,0,'Undo restores original 3D orientation');
  await awaitSettledPreview();
  await page.click('[data-camera-object-depth]');
  const depth=page.frameLocator('#preview').locator('[data-nw-object-depth-handle]');
  await depth.waitFor({state:'visible'});
  const dr=await depth.boundingBox();assert.ok(dr&&dr.width>0);
  await page.evaluate(()=>{
   const d=document.getElementById('preview').contentDocument;
   window.__gizmoProbe.depth={};
   d.addEventListener('pointerdown',ev=>{
    if(ev.target.closest&&ev.target.closest('[data-nw-object-depth-handle]'))window.__gizmoProbe.depth.start=ev.clientY;
   },true);
   d.addEventListener('pointermove',ev=>{
    if(window.__gizmoProbe.depth.start!==undefined)window.__gizmoProbe.depth.end=ev.clientY;
   },true);
  });
  await page.mouse.move(dr.x+dr.width/2,dr.y+dr.height/2);
  await page.mouse.down();await page.mouse.move(dr.x+dr.width/2,dr.y+dr.height/2-70,{steps:5});
  await page.mouse.up();
  const closer=await edit3D();
  const realDepthDelta=await page.evaluate(()=>window.__gizmoProbe.depth.start-window.__gizmoProbe.depth.end);
  assert.ok(Number.isFinite(realDepthDelta)&&realDepthDelta>0,'Depth drag reaches actual preview');
  assert.equal(closer.depth,Math.round(realDepthDelta*.01*100)/100,'Z uses actual iframe-local mouse delta');
  assert.equal(closer.history,beforeGizmo.history+1,'Undo of yaw followed by Z creates one history entry');
  await page.evaluate(()=>undo());assert.equal((await edit3D()).depth,0,'Undo restores depth without changing the camera');
  await awaitSettledPreview();
  await page.click('[data-camera-object-transform]');
  const scale=page.frameLocator('#preview').locator('[data-nw-base-axis="Scale"]');
  await scale.waitFor({state:'visible'});
  const sr=await scale.boundingBox();assert.ok(sr);
  await page.mouse.move(sr.x+sr.width/2,sr.y+sr.height/2);
  await page.mouse.down();await page.mouse.move(sr.x+sr.width/2,sr.y+sr.height/2-35,{steps:4});
  await page.keyboard.press('Escape');
  assert.equal((await edit3D()).scale,100,'Escape cancels real pointer scale gesture');
  assert.equal((await edit3D()).history,beforeGizmo.history,'Cancelled scale does not create an Undo');
  console.log('PASS browser 3D gizmos: real pointer yaw/Z, live WebGL, one Undo, Escape and camera isolation');
  // Visual discoverability / layout depth: test the actual editor and DOM fields.
  await page.evaluate(()=>{
   sec().elements.push(mkEl('heading',{id:'story-depth-text',text:'Primer plano',x:45,y:50,w:25,sdCameraDepth:0,sdEnter:'none'}));
   renderPane();
  });
  await page.evaluate(()=>document.querySelector('[data-camera-space-open]').click());
  assert.equal(await page.locator('[data-camera-map-box]').evaluate(n=>n.open),true,'Edit space shortcut opens camera/object map');
  assert.equal(await page.locator('[data-camera-layer-pick]').count(),2,'Real editor lists the HTML layer and 3D geometry');
  const cameraBeforeDepth=await page.evaluate(()=>JSON.stringify(sec().sdCameraFrames));
  await page.evaluate(()=>document.querySelector('[data-camera-layer-pick="1"]').click());
  const contrast=await page.locator('[data-camera-object-world-z]').evaluate(n=>({color:getComputedStyle(n).color,background:getComputedStyle(n).backgroundColor}));
  assert.equal(contrast.color,'rgb(23, 23, 23)','World Z text is dark and legible');
  assert.equal(contrast.background,'rgb(255, 255, 255)','World Z field has a light background');
  await page.locator('[data-camera-object-world-z]').fill('325');
  await page.locator('[data-camera-object-world-z]').press('Tab');
  const worldState=await page.evaluate(()=>({text:sec().elements.find(e=>e.id==='story-depth-text')?.sdCameraDepth,frames:JSON.stringify(sec().sdCameraFrames),history:history.length}));
  assert.equal(worldState.text,325,'DOM layer Z persists into existing authored sdCameraDepth');
  assert.equal(worldState.frames,cameraBeforeDepth,'Editing depth never changes camera frames');
  await page.evaluate(()=>undo());
  assert.equal(await page.evaluate(()=>sec().elements.find(e=>e.id==='story-depth-text')?.sdCameraDepth||0),0,'Undo restores DOM spatial depth');
  console.log('PASS browser spatial UX: shortcut, mixed HTML/3D layer list, legible Z field, HTML depth, undo and camera isolation');
  // Real pointer manipulation in the actual panel/map (not a simulated DOM).
  await page.evaluate(()=>document.querySelector('[data-camera-space-open]').click());
  await page.locator('[data-camera-map-plane]').selectOption('front');
  const objectMarker=page.locator('[data-camera-scene-object-pick="1"]');
  await objectMarker.scrollIntoViewIfNeeded();
  const markerRect=await objectMarker.boundingBox();
  assert.ok(markerRect&&markerRect.width>0,'Map provides a visible draggable HTML marker');
  const beforeMap=await page.evaluate(()=>({x:sec().elements.find(e=>e.id==='story-depth-text').x,
   frames:JSON.stringify(sec().sdCameraFrames),history:history.length}));
  // Capture the actual browser gesture without relying on model assumptions.
  await page.evaluate(()=>{
   window.__nwDragEvents=[];
   ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture'].forEach(type=>document.addEventListener(type,e=>{
    if(window.__nwDragEvents.length>=18)return;
    window.__nwDragEvents.push({type,x:Math.round(e.clientX),y:Math.round(e.clientY),target:e.target.getAttribute?.('data-camera-scene-object-pick')||e.target.tagName});
   },true));
  });
  const px=markerRect.x+markerRect.width/2,py=markerRect.y+markerRect.height/2;
  // A narrow right sidebar can end before the browser viewport. Keep the
  // gesture inside the actual map, not merely inside the window: crossing
  // over the preview iframe would send subsequent events to another document.
  const mapRect=await page.locator('[data-camera-map]').boundingBox();
  assert.ok(mapRect&&mapRect.width>50,'Spatial map has a usable interactive area');
  const leftRoom=px-mapRect.x,rightRoom=mapRect.x+mapRect.width-px;
  const delta=rightRoom>=leftRoom?Math.min(32,rightRoom-8):-Math.min(32,leftRoom-8);
  assert.ok(Number.isFinite(delta)&&Math.abs(delta)>=8,'Drag fits inside the spatial map');
  await page.mouse.move(px,py);
  await page.mouse.down();
  await page.mouse.move(px+delta,py,{steps:5});
  await page.mouse.up();
  const movedMap=await page.evaluate(()=>({x:sec().elements.find(e=>e.id==='story-depth-text').x,
   frames:JSON.stringify(sec().sdCameraFrames),history:history.length}));
  if(!((movedMap.x-beforeMap.x)*delta>0))console.log('SPATIAL MAP DRAG TRACE '+JSON.stringify(await page.evaluate(()=>({events:window.__nwDragEvents,mode:document.querySelector('[data-camera-map-object-mode]')?.getAttribute('aria-pressed'),selected:document.querySelector('[data-camera-object-select]')?.value,scroll:document.querySelector('#pane')?.scrollTop,active:document.activeElement?.outerHTML?.slice(0,160)})))+' / bounds='+JSON.stringify(mapRect)+' / delta='+delta+' / x='+beforeMap.x+'->'+movedMap.x);
  assert.ok((movedMap.x-beforeMap.x)*delta>0,'Dragging inward changes DOM X in the pointer direction');
  assert.equal(movedMap.history,beforeMap.history+1,'Direct map drag persists once');
  assert.equal(movedMap.frames,beforeMap.frames,'Direct map drag never rewrites camera frames');
  await page.evaluate(()=>undo());
  assert.equal(await page.evaluate(()=>sec().elements.find(e=>e.id==='story-depth-text').x),beforeMap.x,'Undo restores direct spatial XY change');
  console.log('PASS browser object map drag: real mouse edits DOM X, one Undo, camera path untouched');
  assert.deepEqual(errors,[]);console.log('PASS object guide: retained preview progress and explicit 0→50% Director displacement');
  console.log('PASS current moment: real editor + Director, create, pointer drag, two Undo, exact selection, no duplicate/history edit and Redo');
  console.log('PASS technical details: native visibility, collapsed height, open/close and pane persistence without authored edits');
  console.log('PASS FOV controls: pointer and keyboard toggles, perspective rerenders, plane persistence and unchanged history');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
