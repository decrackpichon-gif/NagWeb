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
  // The same real editor can author a complete five-waypoint 3D story
  // from its existing text + image + text, without creating new renderers.
  await page.evaluate(()=>{
   const s=sec();
   s.elements.push(mkEl('img',{id:'journey-test-photo',x:42,y:35,w:45,h:40,src:'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%222%22 height=%222%22/%3E'}));
   s.elements.push(mkEl('heading',{id:'journey-test-outro',text:'Después de la imagen',x:26,y:42,w:40,sdEnter:'none'}));
   renderPane();
  });
  const beforeJourney=await page.evaluate(()=>({frames:JSON.stringify(sec().sdCameraFrames),
   photo:sec().elements.find(e=>e.id==='journey-test-photo')?.sdCameraDepth||0,
   untouched:JSON.stringify(sec().elements.find(e=>e.id==='spatial-test-box')),undo:history.length}));
  const journeyButton=page.locator('[data-camera-journey-apply]');
  await journeyButton.waitFor({state:'visible'});
  assert.equal(await journeyButton.isEnabled(),true);
  await journeyButton.click();
  const trip=await page.evaluate(()=>{
   const s=sec(),C=window.NAGWEB_SCROLL_CAMERA,cfg=C.config(s);
   return {frames:s.sdCameraFrames.map(k=>({at:k.at,z:k.z})),depths:['spatial-test-heading','journey-test-photo','journey-test-outro'].map(id=>s.elements.find(e=>e.id===id)?.sdCameraDepth),
    motion:s.sdCameraPathMode,look:s.sdCameraOrientationMode,length:s.sdLength,undo:history.length,
    other:JSON.stringify(s.elements.find(e=>e.id==='spatial-test-box')),
    start:C.pose(cfg,0,window.NAGWEB_STORY_MODEL,'linear',false).z,
    end:C.pose(cfg,1,window.NAGWEB_STORY_MODEL,'linear',false).z};
  });
  assert.equal(JSON.stringify(trip.depths),JSON.stringify([700,200,-300]));
  assert.equal(JSON.stringify(trip.frames.map(k=>k.at)),JSON.stringify([0,25,50,75,100]));
  assert.equal(trip.start,-900);assert.equal(trip.end,1300);
  assert.equal(trip.look,'manual');assert.equal(trip.motion,'linear');
  assert.ok(trip.length>=480);
  assert.equal(trip.undo,beforeJourney.undo+1,'Journey is one undoable action');
  assert.equal(trip.other,beforeJourney.untouched,'Existing unrelated GLB is unchanged');
  await page.evaluate(()=>undo());
  const reverted=await page.evaluate(()=>({frames:JSON.stringify(sec().sdCameraFrames),
   depth:sec().elements.find(e=>e.id==='journey-test-photo')?.sdCameraDepth||0}));
  assert.equal(reverted.frames,beforeJourney.frames,'Undo restores earlier camera path');
  assert.equal(reverted.depth,beforeJourney.photo,'Undo restores earlier photo depth');
  // A self-contained scene example must work from the real editor, without external assets.
  const beforeDemo=await page.evaluate(()=>({elements:JSON.stringify(sec().elements),count:sec().elements.length,
   undo:history.length,frames:JSON.stringify(sec().sdCameraFrames)}));
  await page.locator('[data-camera-journey-demo]').click();
  const afterDemo=await page.evaluate(()=>{const s=sec(),added=s.elements.slice(-3);return {
   count:s.elements.length,earlier:JSON.stringify(s.elements.slice(0,-3)),types:added.map(e=>e.type),
   ids:added.map(e=>e.id),image:(((project.assets||{}).images||[]).find(a=>a.id===added[1].assetId)||{}).data,depths:added.map(e=>e.sdCameraDepth),
   frames:s.sdCameraFrames.length,undo:history.length};});
  assert.equal(afterDemo.count,beforeDemo.count+3,'Real editor creates three sample layers');
  assert.equal(afterDemo.earlier,beforeDemo.elements,'Real editor leaves existing layers unchanged');
  assert.equal(JSON.stringify(afterDemo.types),JSON.stringify(['heading','image','heading']));
  assert.equal(new Set(afterDemo.ids).size,3,'Each sample has a unique ID');
  assert.ok(afterDemo.image.startsWith('data:image/svg+xml;charset=utf-8,'),'Sample loads offline (stored as a real project image asset)');
  assert.equal(JSON.stringify(afterDemo.depths),JSON.stringify([700,200,-300]));
  assert.equal(afterDemo.frames,5);assert.equal(afterDemo.undo,beforeDemo.undo+1);
  await page.evaluate(()=>undo());
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().elements)),beforeDemo.elements,'One Undo removes the sample without altering existing content');
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().sdCameraFrames)),beforeDemo.frames,'Undo restores camera path');

  // Large workspace uses the very same scene, selection and Director controls.
  await page.locator('[data-camera-space-open]').click();
  const workspaceBefore=await page.evaluate(()=>({data:JSON.stringify(sec()),undo:history.length}));
  await page.locator('[data-camera-map-expand]').click();
  const wide=await page.locator('[data-camera-map]').boundingBox();
  assert.ok(wide.width>700&&wide.height>500,'Expanded map has usable workspace dimensions: '+JSON.stringify(wide));
  await page.locator('[data-camera-map-plane]').selectOption('side');
  assert.equal(await page.locator('[data-camera-map-wide]').count(),1,'Wide layout survives inspector rerenders');
  await page.locator('[data-camera-space-seek]').fill('37.5');
  await page.waitForFunction(()=>Math.abs(NAGWEB_SCROLL_DIRECTOR.progress(sec().id)-37.5)<.01);
  assert.equal(await page.locator('[data-camera-space-progress]').textContent(),'37.5%','Wide slider shares the Director progress');
  await page.screenshot({path:'work/camera-workspace.png'});
  await page.locator('[data-camera-map-expand]').focus();await page.keyboard.press('Escape');
  assert.equal(await page.locator('[data-camera-map-wide]').count(),0,'Escape returns to compact panel');
  assert.equal(await page.evaluate(()=>JSON.stringify(sec())),workspaceBefore.data,'Layout navigation never edits scene data');
  assert.equal(await page.evaluate(()=>history.length),workspaceBefore.undo,'Layout navigation never creates Undo steps');
  console.log('PASS wide spatial workspace: dimensions, views, Escape and unchanged authored scene');

  // V1.0 acceptance: Undo must persist, not just update in-memory state.
  // Reload the actual editor, then build the exported HTML from the recovered
  // scene. No test-only project serializer or second camera evaluator.
  const beforeReload=await page.evaluate(()=>{
   const scene=sec(),saved=JSON.parse(localStorage.getItem('scrollcraft.proyecto.v3')||'null');
   const preserved=els=>JSON.stringify((els||[]).map(e=>{
    const fields=['id','type','text','src','shape','modelId','x','y','w','h','offX','offY','offZ',
     'sdCameraDepth','sdEnter','nwSpatialScale','nwSpatialRotateX','nwSpatialRotateY'];
    return Object.fromEntries(fields.filter(k=>e[k]!==undefined).map(k=>[k,e[k]]));
   }));
   return {sceneId:scene.id,frames:JSON.stringify(scene.sdCameraFrames),
    elements:preserved(scene.elements),
    storedFrames:JSON.stringify(saved?.pages?.[0]?.sections?.[0]?.sdCameraFrames),
    storedElements:preserved(saved?.pages?.[0]?.sections?.[0]?.elements)};
  });
  assert.equal(beforeReload.frames,beforeReload.storedFrames,'Undo persists camera frames to localStorage');
  assert.equal(beforeReload.elements,beforeReload.storedElements,'Undo persists authored layers without resurrecting deleted demo');
  await page.reload({waitUntil:'load'});
  await page.waitForFunction(()=>typeof sec==='function'&&sec()?.id==='spatial-drag-isolated');
  const recovered=await page.evaluate(()=>{
   const scene=sec(),html=generateSite(flattenPage(page()),false,false,false);
   const preserved=els=>JSON.stringify((els||[]).map(e=>{
    const fields=['id','type','text','src','shape','modelId','x','y','w','h','offX','offY','offZ',
     'sdCameraDepth','sdEnter','nwSpatialScale','nwSpatialRotateX','nwSpatialRotateY'];
    return Object.fromEntries(fields.filter(k=>e[k]!==undefined).map(k=>[k,e[k]]));
   }));
   return {sceneId:scene.id,frames:JSON.stringify(scene.sdCameraFrames),
    elements:preserved(scene.elements),exportedBytes:html.length,
    hasScene:html.includes('id="scene"')};
  });
  assert.equal(recovered.sceneId,beforeReload.sceneId,'Editor reopens the same authored 3D scene');
  assert.equal(recovered.frames,beforeReload.frames,'Reopened camera keyframes match saved project');
  assert.equal(recovered.elements,beforeReload.elements,'Reopened text, image and GLB layers match saved project');
  assert.ok(recovered.exportedBytes>10000&&recovered.hasScene,
   'Recovered editor exports a complete HTML document: '+JSON.stringify(recovered));
  // The separate spatial-renderer browser test verifies the serialized
  // Three.js GLB, Director camera and real WebGL pixels in exported HTML.
  // Do not couple project-persistence QA to private runtime string markers.
  console.log('PASS V1.0 browser round trip: Undo -> localStorage -> reload -> camera/layers -> exported HTML');

  console.log('PASS real editor offline sample: three reusable planes, five stops, zero external assets, one Undo');
  console.log('PASS real editor journey: text/image/text depths, five waypoints, camera crossing, one Undo');
  assert.deepEqual(errors,[]);
  console.log('PASS isolated Chromium spatial map: real pointer movement, DOM X, cleanup, one Undo and camera isolation');
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
