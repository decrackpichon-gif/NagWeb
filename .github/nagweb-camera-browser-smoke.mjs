import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const visuals=process.env.NAGWEB_CAMERA_VISUALS||'/tmp/nagweb-camera-visuals';

export async function runCameraBrowserSmoke(page){
 const previous=await page.evaluate(()=>({project:JSON.stringify(project),curPage,curSec,curEl,curPane,selection,secFocus}));
 try{
  await page.evaluate(()=>{
   const s=JSON.parse(JSON.stringify(sec()));
   s.id='camera-browser-scene';s.layout='stack';s.sdEnabled=true;s.sdCameraEnabled=true;s.sdCameraPathMode='smooth';s.sdCameraResponsive=true;s.sdCameraReferenceWidth=1000;s.sdEase='linear';s.sdLength=320;s.sdPerspective=1000;s.stType='cut';
   s.sdCameraFrames=[
    {at:0,x:0,y:0,z:0,rotateX:0,rotateY:0,rotate:0,ease:'linear'},
    {at:50,x:200,y:100,z:100,rotateX:10,rotateY:20,rotate:5,ease:'linear'},
    {at:100,x:400,y:-100,z:0,rotateX:0,rotateY:0,rotate:0,ease:'linear'}
   ];
   s.elements=[
    mkEl('container',{id:'camera-abs',w:70,h:320,x:15,y:18,sdCameraDepth:-300,sdEnter:'none',sdEnd:100}),
    mkEl('heading',{id:'camera-child',parent:'camera-abs',text:'Plano 2.5D',x:24,y:26,w:45,anim:'none',
      sdKeyframes:[{at:0,z:0,rotateX:0,rotateY:0,ease:'linear'},{at:100,z:100,rotateX:20,rotateY:-30}]})
   ];
   project.pages[0].sections=[s];curPage=0;curSec=0;curEl=0;curPane='elements';selection=[];secFocus=true;
   saveProject();renderScenes();renderPane();renderPreview();
  });
  await page.waitForFunction(()=>document.querySelector('[data-camera-map-box]')&&document.querySelector('#preview')?.contentWindow?.__NAG_SCROLL_DIRECTOR?.['camera-browser-scene']);
  await page.$eval('[data-camera-map-box]',n=>{n.open=true;n.dispatchEvent(new Event('toggle',{bubbles:true}));});
  await page.evaluate(()=>NAGWEB_SCROLL_DIRECTOR.scrub('camera-browser-scene',.5));
  await page.click('[data-camera-jump="50"]');
  await page.waitForFunction(()=>document.querySelector('[data-camera-map-point="50"]'));

  const ui=await page.evaluate(()=>({
   markers:document.querySelectorAll('[data-camera-jump]').length,
   dots:document.querySelectorAll('[data-camera-map-dot]').length,
   plane:document.querySelector('[data-camera-map]')?.dataset.plane,
   label:document.querySelector('[data-camera-position-label]')?.textContent,
   head:document.querySelector('[data-camera-head]')?.style.left,
   seek:document.querySelector('[data-camera-seek]')?.value,
   pathPoints:(document.querySelector('[data-camera-map-path]')?.getAttribute('points')||'').trim().split(/\s+/).filter(Boolean).length
  }));
  assert.equal(ui.markers,3);assert.equal(ui.dots,3);assert.equal(ui.plane,'top');assert.equal(ui.head,'50%');assert.equal(+ui.seek,50);
  assert.ok(ui.pathPoints>ui.dots,'Smooth camera path should render sampled curve points');
  assert.ok(ui.label.includes('50%')&&ui.label.includes('X 200')&&ui.label.includes('Y 100')&&ui.label.includes('Z 100'));
  assert.ok((await page.$eval('[data-camera-map-box]',n=>n.textContent)).includes('ancho de referencia'));
  fs.mkdirSync(visuals,{recursive:true});
  async function capture(name){
   await page.$eval('[data-camera-map]',n=>n.scrollIntoView({block:'center'}));
   await (await page.$('[data-camera-map]')).screenshot({path:path.join(visuals,name+'.png')});
  }
  await capture('map-top');
  const originalFrames=await page.evaluate(()=>JSON.stringify(sec().sdCameraFrames));
  for(const plane of ['top','front']){
   await page.select('[data-camera-map-plane]',plane);
   await capture('map-'+plane);
   for(const zoom of [.5,.75,1,1.25,1.5,2,3]){
    await page.click('[data-camera-map-zoom="0"]');
    for(let i=0;i<Math.abs([.5,.75,1,1.25,1.5,2,3].indexOf(zoom)-2);i++)await page.click('[data-camera-map-zoom="'+(zoom<1?-1:1)+'"]');
    if(zoom>1)await page.click('[data-camera-map-pan="right"]');
    await page.$eval('[data-camera-map]',n=>n.scrollIntoView({block:'center'}));
    const start=await page.evaluate(()=>{
     const map=document.querySelector('[data-camera-map]'),r=map.getBoundingClientRect(),b=document.querySelector('[data-camera-map-point="50"]').getBoundingClientRect();
     return{x:b.left+b.width/2,y:b.top+b.height/2,width:r.width,height:r.height,range:+map.dataset.range,frame:{...sec().sdCameraFrames.find(k=>k.at===50)},history:history.length};
    });
    await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(start.x+12,start.y+8,{steps:4});await page.mouse.up();
    const end=await page.evaluate(()=>({frame:sec().sdCameraFrames.find(k=>k.at===50),history:history.length}));
    assert.ok(Math.abs(end.frame.x-start.frame.x-24*start.range/start.width)<=1,'Zoom/pan X coordinate mismatch at '+plane+' '+zoom);
    const axis=plane==='front'?'y':'z',sign=plane==='front'?1:-1;
    assert.ok(Math.abs(end.frame[axis]-start.frame[axis]-sign*16*start.range/start.height)<=1,'Zoom/pan vertical coordinate mismatch at '+plane+' '+zoom);
    assert.equal(end.frame[plane==='front'?'z':'y'],start.frame[plane==='front'?'z':'y']);
    assert.equal(end.history,start.history+1);
    if(zoom===3)await capture('map-'+plane+'-zoom-pan');
    await page.evaluate(()=>undo());
    assert.equal(await page.evaluate(()=>JSON.stringify(sec().sdCameraFrames)),originalFrames,'Undo restores zoomed/panned point edit');
   }
  }
  await page.select('[data-camera-map-plane]','top');
  await page.click('[data-camera-map-zoom="0"]');
  await page.focus('[data-camera-map]');
  await page.$eval('[data-camera-map]',n=>n.scrollIntoView({block:'center'}));
  const wheelHit=await page.$eval('[data-camera-map]',n=>{const r=n.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};});
  await page.mouse.move(wheelHit.x,wheelHit.y);
  await page.keyboard.down('Control');await page.mouse.wheel({deltaY:-100});await page.keyboard.up('Control');
  await page.waitForFunction(()=>document.querySelector('[data-camera-map-zoom-label]')?.textContent==='125%');
  assert.equal(await page.$eval('[data-camera-map-zoom-label]',n=>n.textContent),'125%');
  await page.keyboard.down('Meta');await page.mouse.wheel({deltaY:-100});await page.keyboard.up('Meta');
  await page.waitForFunction(()=>document.querySelector('[data-camera-map-zoom-label]')?.textContent==='150%');
  assert.equal(await page.$eval('[data-camera-map-zoom-label]',n=>n.textContent),'150%');
  const origin=()=>page.$eval('[data-camera-map]',n=>({x:+n.dataset.originX,y:+n.dataset.originAxis}));
  const beforePan=await origin();
  await page.focus('[data-camera-map]');await page.keyboard.down('Alt');await page.keyboard.press('ArrowRight');await page.keyboard.up('Alt');
  assert.ok((await origin()).x>beforePan.x,'Alt+Right pans the enlarged map');
  await page.click('[data-camera-map-pan="center"]');
  assert.deepEqual(await origin(),beforePan,'Center returns to selected camera');
  for(const cancel of [true,false]){
   await page.$eval('[data-camera-map]',n=>n.scrollIntoView({block:'center'}));
   const rect=await page.$eval('[data-camera-map]',n=>{const r=n.getBoundingClientRect();return{x:r.left+10,y:r.top+10};});
   const before=await origin();
   await page.keyboard.down('Shift');await page.mouse.move(rect.x,rect.y);await page.mouse.down();await page.mouse.move(rect.x+30,rect.y+20,{steps:3});
   if(cancel)await page.keyboard.press('Escape');
   await page.mouse.up();await page.keyboard.up('Shift');
   if(cancel)assert.deepEqual(await origin(),before,'Escape cancels map pan');
   else assert.ok((await origin()).x<before.x,'Shift+background drag pans map');
  }
  const middle=await page.$eval('[data-camera-map]',n=>{const r=n.getBoundingClientRect();return{x:r.left+10,y:r.top+10};});
  const beforeMiddle=await origin();
  await page.mouse.move(middle.x,middle.y);await page.mouse.down({button:'middle'});await page.mouse.move(middle.x+20,middle.y,{steps:3});await page.mouse.up({button:'middle'});
  assert.ok((await origin()).x<beforeMiddle.x,'Middle-button drag pans map');
  await page.focus('[data-camera-map]');await page.keyboard.press('Home');
  assert.equal(await page.$eval('[data-camera-map-zoom-label]',n=>n.textContent),'100%');
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.$eval('[data-camera-map-point]',n=>+n.dataset.cameraMapPoint),100);
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.$eval('[data-camera-map-point]',n=>+n.dataset.cameraMapPoint),50);
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().sdCameraFrames)),originalFrames,'Map shortcuts leave authored coordinates untouched');
  console.log('Camera browser: both planes, every zoom level, pan + drag coordinate parity and undo OK');
  // Minimap regression: click, drag, cancellation, precision keyboard and no camera edits.
  await page.click('[data-camera-overview-toggle]');
  assert.ok(await page.$('[data-camera-overview]'),'Overview toggle should show minimap at 100%');

  const overviewInitial=await page.evaluate(()=>{
   const map=document.querySelector('[data-camera-overview]'),dot=map.querySelector('[data-camera-overview-current]'),s=sec();
   const key=s.sdCameraFrames.find(k=>k.at===50),spec={range:+map.dataset.range,axis:map.dataset.plane==='front'?'y':'z',sign:map.dataset.plane==='front'?1:-1};
   const expected=NAGWEB_SCROLL_CAMERA.mapPoint(key,spec);
   return {x:+dot.getAttribute('cx'),y:+dot.getAttribute('cy'),expected,arrows:map.querySelectorAll('[data-camera-overview-direction="camera"] polygon').length,look:map.querySelector('[data-camera-overview-direction="look"]'),label:map.querySelector('[data-camera-overview-progress]').textContent.trim()};
  });
  assert.ok(Math.abs(overviewInitial.x-overviewInitial.expected.x)<.01&&Math.abs(overviewInitial.y-overviewInitial.expected.y)<.01,'Initial minimap progress dot must use world coordinates, not already projected coordinates');
  assert.equal(overviewInitial.arrows,3,'Camera trajectory has three direction indicators');
  assert.equal(overviewInitial.look,null,'Manual camera does not show a look trajectory');
  assert.equal(overviewInitial.label,'50%','Minimap initially displays selected scrub progress');
  const activeInitially=await page.evaluate(()=>{
   const node=document.querySelector('[data-camera-overview]');
   return {segment:node.querySelector('[data-camera-overview-active-label]')?.textContent,points:node.querySelector('[data-camera-overview-active-camera]')?.getAttribute('points'),ends:node.querySelectorAll('[data-camera-overview-ends="camera"] text').length};
  });
  assert.equal(activeInitially.segment,'◆ 50–100%','Minimap highlights the selected camera keyframe interval');
  assert.equal(activeInitially.ends,2,'Start and end markers are visible for the camera trajectory');
  assert.ok(activeInitially.points?.length>6,'Active camera interval is drawn in the minimap');

  assert.ok((await page.$eval('[data-camera-overview-label]',n=>n.textContent)).includes('X/Z'));
  await page.click('[data-camera-map-zoom="1"]');
  const miniOrigin=()=>page.$eval('[data-camera-map]',n=>({x:+n.dataset.originX,y:+n.dataset.originAxis}));
  const miniBox=()=>page.$eval('[data-camera-overview]',n=>{n.scrollIntoView({block:'center'});const r=n.getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height};});
  let miniRect=await miniBox();
  const miniBase=await miniOrigin();
  await page.mouse.click(miniRect.left+miniRect.width*.7,miniRect.top+miniRect.height*.7);
  const miniClicked=await miniOrigin();
  assert.ok(Math.hypot(miniClicked.x-miniBase.x,miniClicked.y-miniBase.y)>5,'Clicking minimap recenters enlarged map');
  await page.focus('[data-camera-overview]');
  const miniFineStart=await miniOrigin();
  await page.keyboard.down('Shift');await page.keyboard.press('ArrowRight');await page.keyboard.up('Shift');
  const miniFineEnd=await miniOrigin();
  const miniMapRange=await page.$eval('[data-camera-map]',n=>+n.dataset.range);
  assert.ok(Math.abs(miniFineEnd.x-miniFineStart.x-miniMapRange*.1)<1,'Shift+arrow uses 5% fine pan');
  await page.focus('[data-camera-overview]');
  await page.keyboard.press('ArrowRight');
  const miniNormalEnd=await miniOrigin();
  assert.ok(Math.abs(miniNormalEnd.x-miniFineEnd.x-miniMapRange*.4)<1,'Arrow uses 20% pan');
  miniRect=await miniBox();
  const miniDragStart=await miniOrigin();
  await page.mouse.move(miniRect.left+miniRect.width*.45,miniRect.top+miniRect.height*.55);
  await page.mouse.down();
  await page.mouse.move(miniRect.left+miniRect.width*.6,miniRect.top+miniRect.height*.45,{steps:5});
  await page.mouse.up();
  const miniDragEnd=await miniOrigin();
  assert.ok(Math.hypot(miniDragEnd.x-miniDragStart.x,miniDragEnd.y-miniDragStart.y)>3,'Dragging minimap moves viewport');
  miniRect=await miniBox();
  const miniAbortStart=await miniOrigin();
  await page.mouse.move(miniRect.left+miniRect.width*.4,miniRect.top+miniRect.height*.5);
  await page.mouse.down();
  await page.mouse.move(miniRect.left+miniRect.width*.8,miniRect.top+miniRect.height*.4,{steps:4});
  await page.keyboard.press('Escape');
  await page.mouse.up();
  assert.deepEqual(await miniOrigin(),miniAbortStart,'Escape cancels minimap drag');
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().sdCameraFrames)),originalFrames,'Minimap interactions cannot mutate camera frames');

  // Marker click selects a keyframe, while ordinary click/drag continues to navigate the minimap.
  const miniMarkerCenter=(kind,at)=>page.$eval('[data-camera-overview-'+kind+'-marker="'+at+'"]',n=>{n.scrollIntoView({block:'center'});const r=n.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};});
  const miniMarker100=await miniMarkerCenter('camera',100);
  await page.mouse.click(miniMarker100.x,miniMarker100.y);
  assert.equal(await page.$eval('[data-camera-map-point]',n=>+n.dataset.cameraMapPoint),100,'Clicking a camera diamond selects its keyframe');
  const miniMarker0=await miniMarkerCenter('camera',0);
  await page.mouse.click(miniMarker0.x,miniMarker0.y);
  assert.equal(await page.$eval('[data-camera-map-point]',n=>+n.dataset.cameraMapPoint),0,'Camera marker selection works for another keyframe');
  // Temporarily put two camera keys and one look key on the same X/Z coordinate.
  const miniOriginalLook=await page.evaluate(()=>({orientation:sec().sdCameraOrientationMode,mode:sec().sdCameraLookPathMode,frames:JSON.stringify(sec().sdCameraLookFrames||[])}));
  await page.evaluate(()=>{
   const scene=sec(),zero=scene.sdCameraFrames.find(f=>f.at===0),middle=scene.sdCameraFrames.find(f=>f.at===50);
   middle.x=zero.x;middle.z=zero.z;
   scene.sdCameraOrientationMode='lookAt';
   scene.sdCameraLookPathMode='linear';
   scene.sdCameraLookFrames=[{at:20,x:zero.x,y:0,z:zero.z,ease:'linear'},{at:100,x:300,y:0,z:300,ease:'linear'}];
   renderPane();
  });
  await page.waitForFunction(()=>document.querySelector('[data-camera-overview-look-marker="20"]')&&document.querySelector('[data-camera-overview-overlaps] [data-camera-overlap-count="3"]'));
  const miniBlankRect=await miniBox();
  await page.mouse.click(miniBlankRect.left+miniBlankRect.width*.97,miniBlankRect.top+miniBlankRect.height*.03);
  const miniSequence=[];
  for(let i=0;i<4;i++){
   const miniSamePoint=await miniMarkerCenter('camera',0);
   await page.mouse.click(miniSamePoint.x,miniSamePoint.y);
   miniSequence.push(await page.evaluate(()=>({camera:+document.querySelector('[data-camera-map-point]').dataset.cameraMapPoint,look:+document.querySelector('[data-camera-look-map-point]').dataset.cameraLookMapPoint,seek:+document.querySelector('[data-camera-seek]').value})));
  }
  assert.deepEqual(miniSequence.map(v=>v.camera),[0,50,50,0],'Repeated minimap clicks cycle all overlapping camera and look markers');
  assert.ok(Math.abs(miniSequence[2].seek-20)<.5,'Third overlapping click scrubs to the look target');
  assert.equal(await page.$('[data-camera-overview-selected-look]')!==null,true,'Look target has a dedicated selection ring');
  assert.equal(await page.$('[data-camera-overview-legend]')!==null,true,'Minimap shows an explicit camera/look legend');
  await page.evaluate(saved=>{
   const scene=sec();scene.sdCameraFrames=JSON.parse(saved.camera);
   scene.sdCameraOrientationMode=saved.orientation;scene.sdCameraLookPathMode=saved.mode;scene.sdCameraLookFrames=JSON.parse(saved.frames);
   renderPane();
  },{camera:originalFrames,...miniOriginalLook});
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().sdCameraFrames)),originalFrames,'Overlapping test restores original camera frames');

  // Route analysis: pauses, true 3D reversals and sharp turns on camera and look tracks.
  const motionBefore=await page.evaluate(()=>({orientation:sec().sdCameraOrientationMode,pathMode:sec().sdCameraPathMode,lookMode:sec().sdCameraLookPathMode,lookFrames:JSON.stringify(sec().sdCameraLookFrames||[])}));
  await page.evaluate(()=>{
   const sc=sec(),route=[
    {at:0,x:0,y:0,z:0},{at:20,x:100,y:0,z:0},{at:40,x:100,y:0,z:0},
    {at:60,x:0,y:0,z:0},{at:80,x:0,y:100,z:0},{at:100,x:0,y:150,z:0}
   ];
   sc.sdCameraPathMode='linear';sc.sdCameraOrientationMode='lookAt';sc.sdCameraLookPathMode='linear';
   sc.sdCameraFrames=route.map(f=>({...f,rotateX:0,rotateY:0,rotate:0,ease:'linear'}));
   sc.sdCameraLookFrames=route.map(f=>({...f,z:f.z+250,ease:'linear'}));
   renderPane();
  });
  await page.waitForFunction(()=>document.querySelectorAll('[data-camera-overview-event-kind="camera"]').length===3&&document.querySelectorAll('[data-camera-overview-event-kind="look"]').length===3);
  const motionEvents=await page.evaluate(()=>{
   const mini=document.querySelector('[data-camera-overview]');
   return {
    camera:Array.from(mini.querySelectorAll('[data-camera-overview-event-kind="camera"]')).map(el=>el.dataset.cameraOverviewEventType),
    look:Array.from(mini.querySelectorAll('[data-camera-overview-event-kind="look"]')).map(el=>el.dataset.cameraOverviewEventType),
    summary:mini.querySelector('[data-camera-overview-motion-summary]')?.textContent,
    tooltips:mini.querySelectorAll('[data-camera-overview-event-kind] title').length
   };
  });
  assert.deepEqual(motionEvents.camera,['reverse','pause','turn'],'Camera motion analysis detects reverse, authored hold and turn');
  assert.deepEqual(motionEvents.look,['reverse','pause','turn'],'Look motion analysis is independent');
  assert.equal(motionEvents.summary,'◆ ‖1 ↶1 ↗1 · ● ‖1 ↶1 ↗1','Minimap summarizes events by track');
  assert.equal(motionEvents.tooltips,6,'Each motion event has an accessible explanation');

  // Motion event navigation: select exact event, step through distinct times, click marker.
  const motionNavigationInitial=await page.evaluate(()=>({
   count:document.querySelectorAll('[data-camera-overview-event-select] option').length,
   names:Array.from(document.querySelectorAll('[data-camera-overview-event-select] option')).map(o=>o.textContent),
   frames:JSON.stringify(sec().sdCameraFrames),looks:JSON.stringify(sec().sdCameraLookFrames),
   historyCount:history.length
  }));
  assert.equal(motionNavigationInitial.count,7,'All six motion events are individually selectable');
  assert.ok(motionNavigationInitial.names[3].includes('Pausa')&&motionNavigationInitial.names[3].includes('30%'),'Paused interval appears with its timestamp');
  await page.select('[data-camera-overview-event-select]','2');
  await page.waitForFunction(()=>Math.abs(+document.querySelector('[data-camera-seek]').value-30)<.01);
  assert.equal(+await page.$eval('[data-camera-seek]',n=>n.value),30,'Selecting a motion event seeks directly to that moment');
  await page.click('[data-camera-overview-event-step="-1"]');
  await page.waitForFunction(()=>Math.abs(+document.querySelector('[data-camera-seek]').value-20)<.01);
  assert.equal(+await page.$eval('[data-camera-seek]',n=>n.value),20,'Previous skips duplicate events at the same moment');
  await page.click('[data-camera-overview-event-step="1"]');
  await page.waitForFunction(()=>Math.abs(+document.querySelector('[data-camera-seek]').value-30)<.01);
  assert.equal(+await page.$eval('[data-camera-seek]',n=>n.value),30,'Next navigates to following event time');
  const markerHit=await page.$eval('[data-camera-overview-event-kind="camera"][data-camera-overview-event-type="turn"] circle',n=>{
   n.scrollIntoView({block:'center',inline:'nearest'});const r=n.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};
  });
  await page.mouse.click(markerHit.x,markerHit.y);
  await page.waitForFunction(()=>Math.abs(+document.querySelector('[data-camera-seek]').value-60)<.01);
  assert.equal(+await page.$eval('[data-camera-seek]',n=>n.value),60,'Clicking turn glyph seeks directly to detected moment');
  const motionNavigationFinal=await page.evaluate(()=>({
   frames:JSON.stringify(sec().sdCameraFrames),looks:JSON.stringify(sec().sdCameraLookFrames),historyCount:history.length
  }));
  assert.deepEqual(motionNavigationFinal,motionNavigationInitial&&{
   frames:motionNavigationInitial.frames,looks:motionNavigationInitial.looks,historyCount:motionNavigationInitial.historyCount
  },'Motion event navigation cannot change authored keyframes or project history');
  console.log('Camera minimap event navigation: select, previous/next, clickable glyph and nondestructive seek OK');

  // Event filters: scoped glyphs, selector options, scrub-only navigation and selected-state ring.
  await page.select('[data-camera-overview-filter-kind]','camera');
  const cameraOnly=await page.evaluate(()=>({
   marks:Array.from(document.querySelectorAll('[data-camera-overview-event-kind]')).map(n=>n.dataset.cameraOverviewEventKind),
   count:document.querySelector('[data-camera-overview-filter-count]')?.textContent,
   options:document.querySelectorAll('[data-camera-overview-event-select] option').length
  }));
  assert.equal(cameraOnly.count,'3/6','Camera filter reports number of visible events');
  assert.equal(cameraOnly.options,4,'Camera filter removes look events from selector');
  assert.deepEqual(cameraOnly.marks,['camera','camera','camera'],'Camera filter removes only look glyphs, not routes');
  await page.select('[data-camera-overview-filter-type]','pause');
  const cameraPauses=await page.evaluate(()=>({
   labels:Array.from(document.querySelectorAll('[data-camera-overview-event-kind]')).map(n=>n.dataset.cameraOverviewEventType),
   count:document.querySelector('[data-camera-overview-filter-count]')?.textContent,
   options:document.querySelectorAll('[data-camera-overview-event-select] option').length,
   stepNext:document.querySelector('[data-camera-overview-event-step="1"]').disabled
  }));
  assert.deepEqual(cameraPauses.labels,['pause'],'Combined filters show only camera pauses');
  assert.equal(cameraPauses.count,'1/6');
  assert.equal(cameraPauses.options,2);
  await page.select('[data-camera-overview-event-select]','0');
  await page.waitForFunction(()=>Math.abs(+document.querySelector('[data-camera-seek]').value-30)<.01);
  assert.equal(await page.$eval('[data-camera-overview-event-kind="camera"][data-camera-overview-event-type="pause"]',n=>n.dataset.cameraOverviewEventSelected),'true','Selected event is visibly emphasized');
  assert.equal(await page.$eval('[data-camera-overview-event-step="1"]',n=>n.disabled),true,'Next disabled when filtered event has no successor');
  await page.select('[data-camera-overview-filter-kind]','look');
  assert.equal(await page.$eval('[data-camera-overview-filter-count]',n=>n.textContent),'1/6','Changing kind preserves selected type filter');
  await page.select('[data-camera-overview-event-select]','0');
  await page.waitForFunction(()=>Math.abs(+document.querySelector('[data-camera-seek]').value-30)<.01);
  assert.equal(await page.$eval('[data-camera-overview-event-kind="look"][data-camera-overview-event-type="pause"]',n=>n.dataset.cameraOverviewEventSelected),'true','Look event can be highlighted independently at same progress');
  await page.select('[data-camera-overview-filter-type]','all');
  assert.equal(await page.$eval('[data-camera-overview-filter-count]',n=>n.textContent),'3/6');
  await page.click('[data-camera-overview-event-step="1"]');
  await page.waitForFunction(()=>Math.abs(+document.querySelector('[data-camera-seek]').value-60)<.01);
  assert.equal(await page.$eval('[data-camera-overview-event-kind="look"][data-camera-overview-event-type="turn"]',n=>n.dataset.cameraOverviewEventSelected),'true','Next chooses only a visible look event');
  await page.select('[data-camera-overview-filter-kind]','all');
  assert.equal(await page.$eval('[data-camera-overview-filter-count]',n=>n.textContent),'6/6','Reset restores all motion events');
  assert.equal(await page.$$eval('[data-camera-overview-event-kind]',els=>els.length),6,'Reset restores every minimap event marker');
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().sdCameraFrames)),motionNavigationInitial.frames,'Filtering must not modify authored camera frames');
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().sdCameraLookFrames)),motionNavigationInitial.looks,'Filtering must not modify authored look frames');
  assert.equal(await page.evaluate(()=>history.length),motionNavigationInitial.historyCount,'Filtering and event selection must not create history entries');
  console.log('Camera minimap filters: camera/look, event types, selected highlight, filtered navigation and no edits OK');

  // 3D path statistics: integrated route length, scroll-normalized average pace and interval changes.
  assert.ok(await page.$('[data-camera-overview-metrics]'),'Spatial metrics disclosure is available with minimap');
  await page.click('[data-camera-overview-metrics] summary');
  assert.equal(await page.$eval('[data-camera-overview-metrics]',n=>n.open),true,'Diagnostics disclosure opens');
  const metricAt=async(value)=>{
   await page.evaluate(v=>NAGWEB_SCROLL_DIRECTOR.scrub('camera-browser-scene',v/100),value);
   await page.waitForFunction(v=>document.querySelector('[data-camera-overview-progress]')?.textContent===v+'%',{},value);
   return page.evaluate(()=>{
    const camera=document.querySelector('[data-camera-overview-metric-camera]')?.textContent||'';
    const look=document.querySelector('[data-camera-overview-metric-look]')?.textContent||'';
    const total=document.querySelector('[data-camera-overview-metric-total]')?.textContent||'';
    return {camera,look,total};
   });
  };
  const metric10=await metricAt(10);
  assert.ok(metric10.camera.includes('◆ 0–20%')&&metric10.camera.includes('5,0 px/%'),'First camera interval reports 100 px across 20% progress');
  assert.ok(metric10.look.includes('● 0–20%')&&metric10.look.includes('5,0 px/%'),'Look path is measured independently in 3D');
  assert.ok(metric10.total.includes('◆ 350,0 px')&&metric10.total.includes('● 350,0 px'),'Total 3D route length uses all intervals');
  const metric30=await metricAt(30);
  assert.ok(metric30.camera.includes('◆ 20–40%')&&metric30.camera.includes('0,0 px · 0,0 px/%')&&metric30.camera.includes('↓ 5,0 px/%'),'A hold has zero pace and reports slowdown');
  const metric50=await metricAt(50);
  assert.ok(metric50.camera.includes('◆ 40–60%')&&metric50.camera.includes('↑ 5,0 px/%'),'Motion resumed after hold reports increase');
  const metric90=await metricAt(90);
  assert.ok(metric90.camera.includes('◆ 80–100%')&&metric90.camera.includes('2,5 px/%')&&metric90.camera.includes('↓ 2,5 px/%'),'Final interval shows slower pace than previous');
  await page.select('[data-camera-map-plane]','front');
  assert.equal(await page.$eval('[data-camera-overview-metrics]',n=>n.open),true,'Expanded 3D diagnostic is retained across plane switches');
  assert.ok((await page.$eval('[data-camera-overview-metric-camera]',n=>n.textContent)).includes('◆ 80–100%'),'Metrics are preserved in front view');
  await page.select('[data-camera-map-plane]','top');
  assert.equal(await page.$eval('[data-camera-overview-metrics]',n=>n.open),true,'Disclosed diagnostics survive top/front toggles');
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().sdCameraFrames)),motionNavigationInitial.frames,'3D metrics must not mutate authored camera frames');
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().sdCameraLookFrames)),motionNavigationInitial.looks,'3D metrics must not mutate authored look frames');
  assert.equal(await page.evaluate(()=>history.length),motionNavigationInitial.historyCount,'3D diagnostics must not add undo history entries');
  console.log('Camera minimap 3D path metrics: arc length, zero-speed hold, pace deltas, live scrub and view persistence OK');

  // Read-only contextual hover plus A/B distance and pace comparison across both tracks.
  const hoverSpot=await page.$eval('[data-camera-overview]',mini=>{
   mini.scrollIntoView({block:'center'});
   const r=mini.getBoundingClientRect(),poly=mini.querySelector('[data-camera-overview-pace="camera"] [data-camera-overview-pace-from="0"]');
   const coords=poly.getAttribute('points').split(' ').map(p=>p.split(',').map(Number));
   const a=coords[0],b=coords[coords.length-1];
   return {x:r.left+(a[0]+b[0])/2*r.width/100,y:r.top+(a[1]+b[1])/2*r.height/100};
  });
  await page.mouse.move(hoverSpot.x,hoverSpot.y);
  const hovered=await page.evaluate(pos=>{
   const tip=document.querySelector('[data-camera-overview-hover]'),mini=document.querySelector('[data-camera-overview]');
   const hit=document.elementFromPoint(pos.x,pos.y),rect=mini.getBoundingClientRect();
   return {hidden:tip.hidden,label:tip.textContent,target:hit?.tagName,inMini:!!(hit&&mini.contains(hit)),range:{x:rect.left,y:rect.top,width:rect.width,height:rect.height}};
  },hoverSpot);
  assert.equal(hovered.hidden,false,'Pointer hover must show noninteractive contextual info: '+JSON.stringify(hovered));
  assert.ok(hovered.label.includes('◆ Cámara 0–20%')&&hovered.label.includes('◆ Cámara 40–60%'),'Hover lists both coincident forward and reverse intervals: '+JSON.stringify(hovered));
  assert.ok(hovered.label.includes('100,0 px')&&hovered.label.includes('5,0 px/%'),'Hover provides contextual 3D distance and pace');
  await page.mouse.move(2,2);
  await page.waitForFunction(()=>document.querySelector('[data-camera-overview-hover]')?.hidden);
  assert.ok(await page.$('[data-camera-overview-comparison]'),'A/B comparison is available in expanded diagnostics');
  await page.select('[data-camera-overview-compare-a]','camera:0:20');
  await page.select('[data-camera-overview-compare-b]','camera:20:40');
  const diffPause=await page.$eval('[data-camera-overview-compare-result]',n=>n.textContent);
  assert.ok(diffPause.includes('−100,0 px')&&diffPause.includes('−5,0 px/%'),'Comparison reports a hold is 100 px shorter and 5 px/% slower');
  await page.select('[data-camera-overview-compare-b]','look:80:100');
  const diffCrossTrack=await page.$eval('[data-camera-overview-compare-result]',n=>n.textContent);
  assert.ok(diffCrossTrack.includes('−50,0 px')&&diffCrossTrack.includes('−2,5 px/%'),'Camera and look can be compared across different intervals');
  await page.select('[data-camera-map-plane]','front');
  assert.equal(await page.$eval('[data-camera-overview-compare-b]',n=>n.value),'look:80:100','Selected comparison survives front view');
  assert.ok((await page.$eval('[data-camera-overview-compare-result]',n=>n.textContent)).includes('−50,0 px'),'3D comparison is view-independent');
  await page.select('[data-camera-map-plane]','top');
  assert.equal(await page.$eval('[data-camera-overview-compare-a]',n=>n.value),'camera:0:20','Comparison survives returning to top view');
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().sdCameraFrames)),motionNavigationInitial.frames,'Hover and comparison never modify camera keyframes');
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().sdCameraLookFrames)),motionNavigationInitial.looks,'Hover and comparison never modify look keyframes');
  assert.equal(await page.evaluate(()=>history.length),motionNavigationInitial.historyCount,'Comparison does not modify undo history');
  console.log('Camera minimap context: hovered segment info, A/B comparison across tracks and both projections, nondestructive behavior OK');


  // Pace overlay: classify sampled camera/look motion by distance per 1% of Director progress.
  const paceInitial=await page.evaluate(()=>{
   const mini=document.querySelector('[data-camera-overview]');
   const bars=kind=>Array.from(mini.querySelectorAll('[data-camera-overview-pace="'+kind+'"] [data-camera-overview-pace-band]')).map(el=>el.getAttribute('data-camera-overview-pace-band'));
   return {camera:bars('camera'),look:bars('look'),checked:document.querySelector('[data-camera-overview-pace-toggle]')?.checked,
     legend:document.querySelector('[data-camera-overview-pace-legend]')?.textContent,
     summaryOpen:document.querySelector('[data-camera-overview-metrics]')?.open};
  });
  assert.equal(paceInitial.checked,true,'3D rhythm overlay is initially enabled');
  assert.deepEqual(paceInitial.camera,['fast','pause','fast','fast','normal'],'Camera pace overlay identifies moving, held and slower intervals');
  assert.deepEqual(paceInitial.look,['fast','pause','fast','fast','normal'],'Look target has independent pace bands');
  assert.ok(paceInitial.legend.includes('Lento')&&paceInitial.legend.includes('Pausa'),'Pace legend explains visual categories');
  assert.equal(paceInitial.summaryOpen,true,'Pace legend appears in expanded diagnostics');
  await page.click('[data-camera-overview-pace-toggle]');
  await page.waitForFunction(()=>!document.querySelector('[data-camera-overview-pace]'));
  assert.equal(await page.$eval('[data-camera-overview-pace-toggle]',n=>n.checked),false,'Visual rhythm can be disabled without hiding the minimap');
  assert.equal(await page.$eval('[data-camera-overview-metrics]',n=>n.open),true,'Pace toggle keeps diagnostics expanded');
  assert.ok(await page.$('[data-camera-overview-path]'),'Original camera trajectory remains visible with rhythm hidden');
  await page.select('[data-camera-map-plane]','front');
  assert.equal(await page.$eval('[data-camera-overview-pace-toggle]',n=>n.checked),false,'Pace visibility is preserved when changing projection');
  await page.click('[data-camera-overview-pace-toggle]');
  await page.waitForFunction(()=>document.querySelectorAll('[data-camera-overview-pace]').length===2);
  assert.equal(await page.$$eval('[data-camera-overview-pace-band="pause"]',els=>els.length),2,'Both camera and look display 3D pauses in front view');
  await page.select('[data-camera-map-plane]','top');
  assert.equal(await page.$$eval('[data-camera-overview-pace-band="fast"]',els=>els.length),6,'Rhythm overlay remains usable after returning to top view');
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().sdCameraFrames)),motionNavigationInitial.frames,'Rhythm visualization does not modify camera frames');
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().sdCameraLookFrames)),motionNavigationInitial.looks,'Rhythm visualization does not modify look frames');
  assert.equal(await page.evaluate(()=>history.length),motionNavigationInitial.historyCount,'Rhythm visualization does not modify the undo history');
  console.log('Camera minimap pace overlay: camera/look categories, pause marks, toggle, two projections, nondestructive behavior OK');

  // A/B interval overlays: distinct tracks, pause rings, coincident paths and disclosure visibility.
  await page.waitForFunction(()=>{
   const detail=document.querySelector('[data-camera-overview-metrics]'),overlay=document.querySelector('[data-camera-overview-compare-overlay]');
   return detail?.open&&overlay&&getComputedStyle(overlay).display!=='none';
  });
  const comparisonOverlay=()=>page.$eval('[data-camera-overview-compare-overlay]',node=>{
   const info=letter=>{
    const el=node.querySelector('[data-camera-overview-compare="'+letter+'"]');
    return {kind:el?.dataset.cameraOverviewCompareKind,from:el?.dataset.cameraOverviewCompareFrom,
     to:el?.dataset.cameraOverviewCompareTo,polyline:!!el?.querySelector('polyline'),
     pause:!!el?.querySelector('[data-camera-overview-compare-hold]'),
     stroke:el?.querySelector('polyline')?.getAttribute('stroke'),
     dash:el?.querySelector('polyline')?.getAttribute('stroke-dasharray'),
     title:el?.querySelector('title')?.textContent};
   };
   return {visible:getComputedStyle(node).display!=='none',noPointerEvents:node.getAttribute('pointer-events')==='none',a:info('a'),b:info('b')};
  });
  let comparisonView=await comparisonOverlay();
  assert.equal(comparisonView.noPointerEvents,true,'A/B overlays must not intercept map interactions');
  assert.equal(comparisonView.a.kind,'camera','A overlays the camera interval');
  assert.equal(comparisonView.b.kind,'look','B overlays the look interval independently');
  assert.equal(comparisonView.a.stroke,'#22d3ee','A has distinctive cyan stroke');
  assert.equal(comparisonView.b.stroke,'#f472b6','B has distinctive pink stroke');
  assert.equal(comparisonView.b.dash,'2 1.2','B has dashed stroke, including for coincident geometry');
  await page.select('[data-camera-overview-compare-b]','camera:20:40');
  comparisonView=await comparisonOverlay();
  assert.equal(comparisonView.b.pause,true,'Paused comparison interval draws a ring instead of an invisible path');
  assert.equal(comparisonView.b.from,'20');
  assert.equal(comparisonView.b.to,'40');
  await page.select('[data-camera-overview-compare-b]','camera:40:60');
  comparisonView=await comparisonOverlay();
  assert.equal(comparisonView.a.polyline,true,'A remains visible for the forward interval');
  assert.equal(comparisonView.b.polyline,true,'B remains visible for the reverse interval on the same line');
  assert.equal(comparisonView.b.dash,'2 1.2','Coincident B route is visually distinct');
  await page.select('[data-camera-overview-compare-a]','look:0:20');
  comparisonView=await comparisonOverlay();
  assert.equal(comparisonView.a.kind,'look','Changing A highlights the chosen look trajectory');
  assert.equal(comparisonView.b.kind,'camera','Changing A preserves selected camera B');
  await page.click('[data-camera-overview-metrics] summary');
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('[data-camera-overview-compare-overlay]')).display==='none');
  await page.click('[data-camera-overview-metrics] summary');
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('[data-camera-overview-compare-overlay]')).display!=='none');
  await page.select('[data-camera-map-plane]','front');
  comparisonView=await comparisonOverlay();
  assert.equal(comparisonView.visible,true,'Selected intervals remain visible in front view');
  assert.equal(comparisonView.a.kind,'look');
  assert.equal(comparisonView.b.kind,'camera');
  await page.select('[data-camera-map-plane]','top');
  comparisonView=await comparisonOverlay();
  assert.equal(comparisonView.visible,true,'Selected intervals remain visible after returning to top view');
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().sdCameraFrames)),motionNavigationInitial.frames,'Comparison overlays do not change camera keyframes');
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().sdCameraLookFrames)),motionNavigationInitial.looks,'Comparison overlays do not change look keyframes');
  assert.equal(await page.evaluate(()=>history.length),motionNavigationInitial.historyCount,'Comparison overlays do not add undo history');
  console.log('Camera minimap A/B overlays: distinct cyan/pink, hold rings, reverse overlap, live selections, disclosure and projections OK');

  // Micro-etapa 33: map-projected B minus A distances and jump to segment midpoints.
  const abProgressBefore=await page.evaluate(()=>NAGWEB_SCROLL_DIRECTOR.progress('camera-browser-scene'));
  const abDelta=()=>page.$eval('[data-camera-overview-compare-difference]',el=>({
   distance:el.getAttribute('data-delta-distance'),pace:el.getAttribute('data-delta-pace'),
   distanceText:el.querySelector('[data-camera-overview-delta-distance]')?.textContent,
   paceText:el.querySelector('[data-camera-overview-delta-pace]')?.textContent,
   noninteractive:el.getAttribute('pointer-events')==='none',
   guide:Array.from(['x1','y1','x2','y2']).map(attr=>+el.querySelector('[data-camera-overview-compare-guide]').getAttribute(attr))
  }));
  const initialDelta=await abDelta();
  assert.equal(initialDelta.distance,'0','Equal-distance camera/look A/B comparison shows zero delta');
  assert.equal(initialDelta.pace,'0','Equal-pace A/B comparison shows zero pace delta');
  assert.equal(initialDelta.noninteractive,true,'Delta annotations do not intercept minimap interaction');
  assert.ok(initialDelta.guide.every(Number.isFinite),'Map comparison connector has valid coordinates');
  await page.click('[data-camera-overview-compare-jump="a"]');
  await page.waitForFunction(()=>Math.abs(+document.querySelector('[data-camera-seek]').value-10)<.01);
  assert.equal(await page.$eval('[data-camera-seek]',el=>+el.value),10,'Jump A seeks the midpoint of the selected look interval');
  await page.click('[data-camera-overview-compare-jump="b"]');
  await page.waitForFunction(()=>Math.abs(+document.querySelector('[data-camera-seek]').value-50)<.01);
  assert.equal(await page.$eval('[data-camera-seek]',el=>+el.value),50,'Jump B seeks the midpoint of selected reverse camera interval');
  assert.equal(await page.$eval('[data-camera-overview-compare-a]',n=>n.value),'look:0:20','Jump preserves selected interval A');
  assert.equal(await page.$eval('[data-camera-overview-compare-b]',n=>n.value),'camera:40:60','Jump preserves selected interval B');
  await page.select('[data-camera-overview-compare-b]','camera:20:40');
  const holdDelta=await abDelta();
  assert.equal(holdDelta.distance,'-100','Pause B vs moving A has -100 px spatial distance delta');
  assert.equal(holdDelta.pace,'-5','Pause B vs moving A has -5 px/% pace delta');
  assert.ok(holdDelta.distanceText.includes('−100,0 px')&&holdDelta.paceText.includes('−5,0 px/%'),'Map shows the negative B-A delta text');
  await page.click('[data-camera-overview-compare-jump="b"]');
  await page.waitForFunction(()=>Math.abs(+document.querySelector('[data-camera-seek]').value-30)<.01);
  assert.equal(await page.$eval('[data-camera-seek]',el=>+el.value),30,'Jump B can seek a zero-distance pause midpoint');
  await page.select('[data-camera-map-plane]','front');
  assert.ok((await abDelta()).guide.every(Number.isFinite),'Delta guide is valid in front projection');
  await page.select('[data-camera-map-plane]','top');
  assert.ok((await abDelta()).distanceText.includes('−100,0 px'),'Delta annotation survives top/front switching');
  await page.click('[data-camera-overview-metrics] summary');
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('[data-camera-overview-compare-overlay]')).display==='none');
  await page.click('[data-camera-overview-metrics] summary');
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('[data-camera-overview-compare-overlay]')).display!=='none');
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().sdCameraFrames)),motionNavigationInitial.frames,'A/B jump buttons do not mutate camera keyframes');
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().sdCameraLookFrames)),motionNavigationInitial.looks,'A/B jump buttons do not mutate look keyframes');
  assert.equal(await page.evaluate(()=>history.length),motionNavigationInitial.historyCount,'A/B jump buttons never write undo history');
  await page.evaluate(v=>NAGWEB_SCROLL_DIRECTOR.scrub('camera-browser-scene',v/100),abProgressBefore);
  await page.waitForFunction(v=>Math.abs(+document.querySelector('[data-camera-seek]').value-v)<.05,{},abProgressBefore);
  assert.equal(await page.evaluate(()=>NAGWEB_SCROLL_DIRECTOR.progress('camera-browser-scene')),abProgressBefore,'A/B navigation tests restore prior Director progress for later editing cases');
  console.log('Camera minimap A/B deltas: map guide, signed distance/pace, A/B and pause midpoint navigation, view parity, no mutations OK');

  // Micro-etapa 34: single-control A/B switching and truthful live preview indication.
  const beforeSwitch=await page.evaluate(()=>NAGWEB_SCROLL_DIRECTOR.progress('camera-browser-scene'));
  const viewPreview=()=>page.evaluate(()=>{
   const status=document.querySelector('[data-camera-overview-preview-status]')?.textContent||'';
   const toggle=document.querySelector('[data-camera-overview-compare-alternate]')?.textContent||'';
   const active=Array.from(document.querySelectorAll('[data-camera-overview-compare]')).filter(el=>el.dataset.cameraOverviewCompareSelected==='true').map(el=>el.dataset.cameraOverviewCompare);
   const rings=Array.from(document.querySelectorAll('[data-camera-overview-compare-preview-ring]')).filter(el=>getComputedStyle(el).display!=='none').map(el=>el.dataset.cameraOverviewComparePreviewRing);
   return {status,toggle,active,rings,progress:+document.querySelector('[data-camera-seek]').value};
  });
  const initialPreview=await viewPreview();
  assert.ok(initialPreview.status.includes('Previsualización libre'),'Free scrub progress cannot falsely claim an A/B preview');
  await page.click('[data-camera-overview-compare-alternate]');
  await page.waitForFunction(()=>Math.abs(+document.querySelector('[data-camera-seek]').value-10)<.05);
  let preview=await viewPreview();
  assert.ok(preview.status.includes('Previsualizando A')&&preview.status.includes('● Mirada'),'Alternate first previews selected A interval');
  assert.equal(preview.toggle,'Alternar → B','After A, toggle offers B');
  assert.deepEqual(preview.rings,['a'],'Only A receives the preview selection ring');
  await page.click('[data-camera-overview-compare-alternate]');
  await page.waitForFunction(()=>Math.abs(+document.querySelector('[data-camera-seek]').value-30)<.05);
  preview=await viewPreview();
  assert.ok(preview.status.includes('Previsualizando B')&&preview.status.includes('◆ Cámara'),'Second click previews B');
  assert.equal(preview.toggle,'Alternar → A','After B, toggle offers A');
  assert.deepEqual(preview.active,['b'],'Only B is selected on minimap');
  await page.evaluate(()=>NAGWEB_SCROLL_DIRECTOR.scrub('camera-browser-scene',.74));
  await page.waitForFunction(()=>Math.abs(+document.querySelector('[data-camera-seek]').value-74)<.05);
  preview=await viewPreview();
  assert.ok(preview.status.includes('Previsualización libre'),'Manual scrub away clears displayed preview status');
  assert.deepEqual(preview.rings,[],'Manual scrub away removes both preview rings');
  await page.select('[data-camera-overview-compare-b]','look:0:20');
  await page.click('[data-camera-overview-compare-jump="b"]');
  await page.waitForFunction(()=>Math.abs(+document.querySelector('[data-camera-seek]').value-10)<.05);
  preview=await viewPreview();
  assert.ok(preview.status.includes('Previsualizando B'),'Same-midpoint A/B selection keeps explicitly chosen B');
  assert.deepEqual(preview.rings,['b'],'Same-midpoint A/B ring matches explicit B');
  await page.click('[data-camera-overview-compare-alternate]');
  preview=await viewPreview();
  assert.ok(preview.status.includes('Previsualizando A'),'Toggle switches preferred identity even at same progress');
  assert.deepEqual(preview.rings,['a'],'Same-midpoint A/B ring can switch to A');
  await page.select('[data-camera-map-plane]','front');
  assert.ok((await viewPreview()).status.includes('Previsualizando A'),'Selected preview survives front projection');
  await page.select('[data-camera-map-plane]','top');
  assert.deepEqual((await viewPreview()).rings,['a'],'Selected preview survives return to top projection');
  await page.select('[data-camera-overview-compare-b]','camera:20:40');
  await page.evaluate(v=>NAGWEB_SCROLL_DIRECTOR.scrub('camera-browser-scene',v/100),beforeSwitch);
  await page.waitForFunction(v=>Math.abs(+document.querySelector('[data-camera-seek]').value-v)<.05,{},beforeSwitch);
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().sdCameraFrames)),motionNavigationInitial.frames,'Preview switching never mutates camera frames');
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().sdCameraLookFrames)),motionNavigationInitial.looks,'Preview switching never mutates look frames');
  assert.equal(await page.evaluate(()=>history.length),motionNavigationInitial.historyCount,'Preview switching never modifies undo history');
  console.log('Camera minimap compare preview: A/B toggle, status, exclusive rings, free scrub and same-point identity OK');

  // Micro-etapa 35: compare actual camera poses, orientation arrows and look target at A/B segment centers.
  const poseSnapshots=()=>page.evaluate(()=>{
   const mini=document.querySelector('[data-camera-overview]'),sc=sec(),cfg=NAGWEB_SCROLL_CAMERA.config(sc);
   const spec={range:+mini.dataset.range,axis:mini.dataset.plane==='front'?'y':'z',sign:mini.dataset.plane==='front'?1:-1,originX:+mini.dataset.originX||0,originAxis:+mini.dataset.originAxis||0};
   const read=which=>{
    const node=mini.querySelector('[data-camera-overview-pose="'+which+'"]');
    const circle=node?.querySelector('[data-camera-overview-pose-camera]');
    const arrow=node?.querySelector('[data-camera-overview-pose-heading]');
    const target=node?.querySelector('[data-camera-overview-pose-look]');
    return {at:+node?.dataset.cameraOverviewPoseAt,x:+circle?.getAttribute('cx'),y:+circle?.getAttribute('cy'),
     heading:arrow?['x1','y1','x2','y2'].map(k=>+arrow.getAttribute(k)):[],
     target:target?{x:+target.getAttribute('cx'),y:+target.getAttribute('cy')}:null,
     expected:(()=>{const at=+node.dataset.cameraOverviewPoseAt;
      const v=NAGWEB_SCROLL_CAMERA.pose(cfg,at/100,NAGWEB_STORY_MODEL,sc.sdEase,false);
      return NAGWEB_SCROLL_CAMERA.mapPoint(v,spec);
     })()};
   };
   const data=mini.querySelector('[data-camera-overview-compare-poses]');
   return {a:read('a'),b:read('b'),label:document.querySelector('[data-camera-overview-snapshot-delta]')?.textContent,
    detailCount:document.querySelectorAll('[data-camera-overview-snapshot-info]').length,
    connector:!!mini.querySelector('[data-camera-overview-pose-distance]'),
    pointerEvents:data?.getAttribute('pointer-events'),mode:sc.sdCameraOrientationMode};
  });
  let poseView=await poseSnapshots();
  assert.equal(poseView.a.at,10,'A snapshot uses its interval midpoint');
  assert.equal(poseView.b.at,30,'B snapshot uses its interval midpoint');
  assert.equal(poseView.detailCount,2,'Both camera poses have independent numeric descriptions');
  assert.equal(poseView.connector,true,'Minimap connects actual camera positions at A and B');
  assert.equal(poseView.pointerEvents,'none','Snapshot markers do not intercept camera editing');
  for(const snap of [poseView.a,poseView.b]){
   assert.ok(Math.hypot(snap.x-snap.expected.x,snap.y-snap.expected.y)<.001,'Snapshot uses the camera pose evaluated by Director progress');
   assert.ok(snap.heading.length===4&&snap.heading.every(Number.isFinite),'Snapshot orientation heading is finite');
   assert.ok(snap.target&&Number.isFinite(snap.target.x)&&Number.isFinite(snap.target.y),'Look-at snapshot includes target marker');
  }
  assert.ok(poseView.label.includes('Desplazamiento XYZ entre encuadres')&&poseView.label.includes('Δ giro X'),'Snapshot comparison provides position and orientation differences');
  await page.select('[data-camera-map-plane]','front');
  poseView=await poseSnapshots();
  assert.ok(Math.hypot(poseView.a.x-poseView.a.expected.x,poseView.a.y-poseView.a.expected.y)<.001,'Front projection of A matches actual camera position');
  assert.ok(Math.hypot(poseView.b.x-poseView.b.expected.x,poseView.b.y-poseView.b.expected.y)<.001,'Front projection of B matches actual camera position');
  await page.select('[data-camera-map-plane]','top');
  const previousMode=await page.evaluate(()=>sec().sdCameraOrientationMode);
  await page.evaluate(()=>{sec().sdCameraOrientationMode='manual';renderPane();});
  poseView=await poseSnapshots();
  assert.equal(poseView.a.target,null,'Manual orientation omits look-at target for A');
  assert.equal(poseView.b.target,null,'Manual orientation omits look-at target for B');
  assert.ok(poseView.a.heading.every(Number.isFinite)&&poseView.b.heading.every(Number.isFinite),'Manual mode still draws orientation headings');
  await page.evaluate(mode=>{sec().sdCameraOrientationMode=mode;renderPane();},previousMode);
  poseView=await poseSnapshots();
  assert.ok(poseView.a.target&&poseView.b.target,'Look-at target markers return after restoring orientation mode');
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().sdCameraFrames)),motionNavigationInitial.frames,'A/B camera snapshots never modify camera frames');
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().sdCameraLookFrames)),motionNavigationInitial.looks,'A/B camera snapshots never modify look frames');
  assert.equal(await page.evaluate(()=>history.length),motionNavigationInitial.historyCount,'A/B snapshots do not add undo snapshots');
  console.log('Camera minimap pose comparison: camera XYZ, orientations, lookAt/manual, top/front, no edits OK');

  // Micro-etapa 36: project consistent A/B FOV cones using the existing main map's perspective.
  const readComparisonFov=()=>page.evaluate(()=>{
   const mini=document.querySelector('[data-camera-overview]');
   const group=mini?.querySelector('[data-camera-overview-compare-fovs]');
   const shapes=Array.from(group?.querySelectorAll('[data-camera-overview-fov]')||[]).map(poly=>{
    const points=poly.getAttribute('points').split(' ').map(pair=>pair.split(',').map(Number));
    return {which:poly.dataset.cameraOverviewFov,angle:+poly.dataset.cameraOverviewFovAngle,
     fill:poly.getAttribute('fill'),dash:poly.getAttribute('stroke-dasharray'),
     points,finite:points.every(p=>p.length===2&&p.every(Number.isFinite))};
   });
   return {checked:document.querySelector('[data-camera-overview-compare-fov-toggle]')?.checked,
    count:shapes.length,shapes,nonInteractive:group?.getAttribute('pointer-events')==='none',
    note:document.querySelector('[data-camera-overview-compare-fov-note]')?.textContent||'',
    orientation:sec().sdCameraOrientationMode};
  });
  let fovView=await readComparisonFov();
  assert.equal(fovView.checked,true,'A/B view cones start enabled');
  assert.deepEqual(fovView.shapes.map(x=>x.which),['a','b'],'Both camera fields of view appear in top projection');
  assert.equal(fovView.nonInteractive,true,'FOV overlays never capture map pointer gestures');
  assert.ok(fovView.shapes.every(x=>x.finite&&x.angle>0&&x.angle<180),'Both projected FOV cones have finite positive opening angles');
  assert.ok(fovView.shapes[0].fill==='#22d3ee'&&fovView.shapes[1].fill==='#f472b6'&&fovView.shapes[1].dash==='2 1','A has cyan and B dashed pink FOV');
  assert.ok(fovView.note.includes('no representa oclusiones'),'View cones are explicitly labeled approximate and occlusion-free');
  const originalPerspective=await page.evaluate(()=>sec().sdPerspective);
  await page.evaluate(()=>{sec().sdPerspective=650;renderPane();});
  const narrowerPerspective=await readComparisonFov();
  assert.ok(Math.abs(narrowerPerspective.shapes[0].angle-fovView.shapes[0].angle)>.1,'Changing perspective recalculates A/B aperture');
  await page.evaluate(value=>{sec().sdPerspective=value;renderPane();},originalPerspective);
  await page.click('[data-camera-overview-compare-fov-toggle]');
  await page.waitForFunction(()=>document.querySelectorAll('[data-camera-overview-fov]').length===0);
  assert.equal((await readComparisonFov()).checked,false,'Cones are independently hideable without hiding A/B position markers');
  assert.equal(await page.$$eval('[data-camera-overview-pose-camera]',nodes=>nodes.length),2,'Camera positions remain visible with cones disabled');
  await page.select('[data-camera-map-plane]','front');
  assert.equal((await readComparisonFov()).checked,false,'Cones visibility persists across projection changes');
  await page.click('[data-camera-overview-compare-fov-toggle]');
  assert.equal((await readComparisonFov()).count,0,'Edge-on frustums are not rendered as false polygons in front view');
  const stored3d=await page.evaluate(()=>({mode:sec().sdCameraOrientationMode,frames:JSON.stringify(sec().sdCameraFrames)}));
  await page.evaluate(()=>{
   const sc=sec();sc.sdCameraOrientationMode='manual';
   sc.sdCameraFrames=sc.sdCameraFrames.map(frame=>({...frame,rotateX:25,rotateY:35}));
   renderPane();
  });
  fovView=await readComparisonFov();
  assert.deepEqual(fovView.shapes.map(x=>x.which),['a','b'],'Tilted manual camera cones can be seen from front');
  assert.ok(fovView.shapes.every(x=>x.finite),'Tilted front-view FOV points remain valid');
  await page.evaluate(original=>{
   const sc=sec();sc.sdCameraFrames=JSON.parse(original.frames);
   sc.sdCameraOrientationMode=original.mode;renderPane();
  },stored3d);
  await page.select('[data-camera-map-plane]','top');
  assert.equal((await readComparisonFov()).count,2,'Restored lookAt mode and top view show both cones again');
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().sdCameraFrames)),motionNavigationInitial.frames,'Cones do not persist any camera frame changes');
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().sdCameraLookFrames)),motionNavigationInitial.looks,'Cones do not persist any look target changes');
  assert.equal(await page.evaluate(()=>history.length),motionNavigationInitial.historyCount,'Cones and view toggles create no undo history');
  console.log('Camera minimap A/B field of view: shared perspective, top/front/edge-on, manual/target, visibility toggle, no edits OK');

  // Micro-etapa 37: projected 2D overlap, identical and disjoint cones, edge-on unavailability, visibility separation.
  const originalOverlapSelection=await page.evaluate(()=>({
   a:document.querySelector('[data-camera-overview-compare-a]').value,
   b:document.querySelector('[data-camera-overview-compare-b]').value,
   orientation:sec().sdCameraOrientationMode,
   camera:JSON.stringify(sec().sdCameraFrames)
  }));
  const exclusiveState=()=>page.evaluate(()=>{
    const regions=Array.from(document.querySelectorAll('[data-camera-overview-fov-exclusive]'));
    return {enabled:document.querySelector('[data-camera-overview-compare-exclusive-toggle]')?.checked===true,
     summary:document.querySelector('[data-camera-overview-exclusive-summary]')?.textContent||'',
     regions:regions.map(n=>({which:n.dataset.cameraOverviewFovExclusive,percent:+n.dataset.cameraOverviewExclusivePercent,
      d:n.getAttribute('d'),rule:n.getAttribute('fill-rule'),pointer:n.getAttribute('pointer-events')}))};
   });
   const focusState=()=>page.evaluate(()=>{
    const select=document.querySelector('[data-camera-overview-compare-focus]');
    const regions=Array.from(document.querySelectorAll('[data-camera-overview-fov-exclusive]'));
    const shared=document.querySelector('[data-camera-overview-fov-overlap]');
    return {value:select?.value||'',disabled:!!select?.disabled,
     areas:regions.map(n=>({which:n.dataset.cameraOverviewFovExclusive,opacity:+n.getAttribute('fill-opacity'),stroke:n.getAttribute('stroke')})),
     sharedOpacity:shared?+shared.getAttribute('fill-opacity'):null,sharedWidth:shared?+shared.getAttribute('stroke-width'):null};
   });
   const focusDetailState=()=>page.evaluate(()=>{
    const detail=document.querySelector('[data-camera-overview-focus-detail]');
    return {present:!!detail,kind:detail?.dataset.cameraOverviewFocusKind||'',
     content:detail?.textContent||'',role:detail?.getAttribute('role')||''};
   });
   const planesState=()=>page.evaluate(()=>{
    const root=document.querySelector('[data-camera-overview-plane-comparison]'),parts=Array.from(root?.querySelectorAll('[data-camera-overview-plane]')||[]);
    return {exists:!!root,region:root?.dataset.cameraOverviewPlaneRegion||'',
      cells:parts.map(n=>({plane:n.dataset.cameraOverviewPlane,value:n.dataset.cameraOverviewPlaneValue,
       current:n.dataset.cameraOverviewPlaneCurrent,text:n.textContent})),
      delta:root?.querySelector('[data-camera-overview-plane-delta]')?.dataset.cameraOverviewPlaneDeltaValue??null,
      unavailable:!!root?.querySelector('[data-camera-overview-plane-delta-unavailable]'),
      text:root?.textContent||''};
   });
   const unionState=()=>page.evaluate(()=>{
    const bar=document.querySelector('[data-camera-overview-union-bar]'),legend=document.querySelector('[data-camera-overview-union-legend]');
    return {present:!!bar,aria:bar?.getAttribute('aria-label')||'',role:bar?.getAttribute('role')||'',
      legend:legend?.textContent||'',
      note:document.querySelector('[data-camera-overview-union-summary]')?.textContent||'',
      parts:Array.from(bar?.querySelectorAll('[data-camera-overview-union-part]')||[]).map(el=>({
        kind:el.dataset.cameraOverviewUnionPart,percent:+el.dataset.cameraOverviewUnionPercent,
        width:parseFloat(el.style.flexBasis),opacity:+el.style.opacity
      }))};
   });
   const overlapState=()=>page.evaluate(()=>{
   const result=document.querySelector('[data-camera-overview-overlap-summary]'),poly=document.querySelector('[data-camera-overview-fov-overlap]');
   const parse=poly?.getAttribute('points')?.split(' ').map(p=>p.split(',').map(Number))||[];
   return {status:result?.dataset.cameraOverviewOverlapStatus||'',message:result?.textContent||'',note:result?.nextElementSibling?.textContent||'',
    visibleCones:document.querySelectorAll('[data-camera-overview-fov]').length,polygon:!!poly,
    a:poly?+poly.dataset.cameraOverviewOverlapA:null,b:poly?+poly.dataset.cameraOverviewOverlapB:null,
    finite:parse.every(p=>p.length===2&&p.every(Number.isFinite)),nonInteractive:poly?.getAttribute('pointer-events')==='none'};
  });
  await page.select('[data-camera-overview-compare-a]','look:0:20');
  await page.select('[data-camera-overview-compare-b]','look:0:20');
  let cov=await overlapState();
  assert.equal(cov.status,'shared','Identical view cones have a shared projected area');
  assert.equal(cov.polygon,true,'Overlap region is displayed on minimap');
  assert.ok(Math.abs(cov.a-100)<.01&&Math.abs(cov.b-100)<.01,'Identical A/B cones share 100% of each projected area');
  assert.ok(cov.finite&&cov.nonInteractive,'Overlap polygon uses valid SVG coordinates and does not intercept editing');
  assert.ok(cov.note.includes('proyectada X/Z o X/Y')&&cov.note.includes('no visibilidad real'),'Diagnostic clearly distinguishes 2D coverage from actual 3D visibility');
   let union=await unionState();
   assert.equal(union.present,true,'Identical cones have a compact combined-area bar');
   assert.equal(union.role,'img','Combined-area breakdown has an accessible text alternative');
   assert.deepEqual(union.parts.map(p=>p.kind),['a','shared','b'],'Bar shows exclusive A, shared, exclusive B in spatial order');
   assert.ok(Math.abs(union.parts[0].percent)<.001&&Math.abs(union.parts[1].percent-100)<.001&&Math.abs(union.parts[2].percent)<.001,'Identical cones have 100% common area of the projected union');
   assert.ok(union.aria.includes('En común 100')&&union.note.includes('Distinto de los porcentajes calculados sobre cada cono'),'Bar clearly distinguishes union versus individual-cone denominators');
   let planes=await planesState();
   assert.equal(planes.exists,true,'Top/front projected coverage comparison is available');
   assert.equal(planes.region,'shared','Default comparison measures shared fraction of projected union');
   assert.deepEqual(planes.cells.map(c=>c.plane),['top','front'],'Both planes use the same A/B selection');
   assert.equal(planes.cells[0].current,'true','Current top map is marked');
   assert.ok(Math.abs(+planes.cells[0].value-100)<.001,'Identical cones: full shared area in top view');
   assert.equal(planes.cells[1].value,'','Edge-on frontal view does not invent coverage');
   assert.ok(planes.unavailable&&planes.text.includes('No evaluable'),'Unavailable plane cannot produce a false delta');
   assert.ok(planes.text.includes('No compara volumen, oclusión ni visibilidad 3D'),'Differences describe only projected geometry');
   let exclusive=await exclusiveState();
   assert.equal(exclusive.enabled,false,'Exclusive regions default off to keep the minimap uncluttered');
   assert.equal(exclusive.regions.length,0);
   await page.click('[data-camera-overview-compare-exclusive-toggle]');
   exclusive=await exclusiveState();
   assert.equal(exclusive.enabled,true,'Exclusive overlay switches on');
   assert.deepEqual(exclusive.regions.map(r=>r.which),['a','b']);
   assert.ok(exclusive.regions.every(r=>Math.abs(r.percent)<.01&&r.rule==='evenodd'&&r.pointer==='none'&&!r.d.includes('NaN')),'Identical cones: zero exclusive area and finite non-interactive paths');
   assert.ok(exclusive.summary.includes('Solo A:')&&exclusive.summary.includes('Solo B:'),'A/B exclusive coverage is explained');
   await page.select('[data-camera-overview-compare-focus]','shared');
   let focus=await focusState();
   assert.equal(focus.value,'shared','Shared-region focus is selected');
   assert.equal(focus.sharedOpacity,.76,'Shared region is emphasized in the minimap');
   assert.equal(focus.sharedWidth,1.65,'Shared outline becomes easier to see');
   assert.ok(focus.areas.every(r=>r.opacity===.05),'Nonfocused exclusive areas become unobtrusive');
   union=await unionState();
   assert.equal(union.parts.find(p=>p.kind==='shared').opacity,1,'The combined-area bar emphasizes the shared region');
   assert.ok(union.parts.filter(p=>p.kind!=='shared').every(p=>p.opacity===.28),'Other combined-area segments are dimmed, preserving their proportions');
   let detail=await focusDetailState();
   assert.equal(detail.kind,'shared','Shared focus shows its corresponding contextual detail');
   assert.ok(detail.content.includes('100,0% del encuadre A')&&detail.content.includes('100,0% del encuadre B')&&detail.content.includes('100,0% del área combinada'),'Shared focus distinguishes both cones and combined denominator');
   assert.equal(detail.role,'status','Selected region explanation is accessible');
   await page.select('[data-camera-overview-compare-focus]','a');
   detail=await focusDetailState();
   assert.equal(detail.kind,'a');
   assert.ok(detail.content.includes('0,0% del encuadre A')&&detail.content.includes('0,0% del área combinada')&&detail.content.includes('Sin área exclusiva'),'Identical cones explain that A has no exclusive area');
   await page.select('[data-camera-overview-compare-focus]','all');
   assert.equal((await focusDetailState()).present,false,'All-regions mode omits redundant contextual text');
   await page.select('[data-camera-overview-compare-focus]','all');
  await page.click('[data-camera-overview-compare-fov-toggle]');
  cov=await overlapState();
  assert.equal(cov.polygon,false,'Hiding cones also hides purple overlap visualization');
  assert.equal(cov.visibleCones,0);
   assert.equal((await exclusiveState()).regions.length,0,'Hiding cones also hides exclusive areas');
  assert.equal(cov.status,'shared','Hiding geometry retains computed coverage in the diagnostic');
  assert.ok(cov.message.includes('conos ocultos'),'Hidden cones are labeled in diagnostic');
  await page.click('[data-camera-overview-compare-fov-toggle]');
  cov=await overlapState();
  assert.equal(cov.polygon,true,'Shared region reappears when cones are shown');
  await page.select('[data-camera-map-plane]','front');
  cov=await overlapState();
  assert.equal(cov.status,'unavailable','Edge-on projection reports unavailable instead of falsely reporting zero overlap');
   planes=await planesState();
   assert.equal(planes.cells[0].current,'false','Top is no longer the current viewport');
   assert.equal(planes.cells[1].current,'true','Frontal is clearly marked as the active map');
   assert.ok(Math.abs(+planes.cells[0].value-100)<.001&&planes.cells[1].value==='','Available top result stays visible when switching to front');
  assert.equal(cov.polygon,false,'Edge-on geometry has no misleading filled area');
   exclusive=await exclusiveState();
   assert.equal(exclusive.regions.length,0,'Edge-on view does not fake exclusive areas');
   assert.ok(exclusive.summary.includes('no evaluable'),'Unsupported projected exclusivity is explained');
   assert.equal((await focusDetailState()).present,false,'Profile projections do not show fabricated contextual percentages');
   union=await unionState();
   assert.equal(union.present,false,'Edge-on projection does not display a misleading projected-area distribution');
  await page.select('[data-camera-map-plane]','top');
  // Spread manually oriented camera intervals far apart so the projected cones are disjoint.
  await page.evaluate(()=>{
   const sc=sec();sc.sdCameraOrientationMode='manual';
   sc.sdCameraFrames=sc.sdCameraFrames.map((f,i)=>({...f,x:i*1000,rotateX:0,rotateY:0}));
   renderPane();
  });
  await page.select('[data-camera-overview-compare-a]','camera:0:20');
  await page.select('[data-camera-overview-compare-b]','camera:80:100');
  cov=await overlapState();
  assert.equal(cov.status,'none','Well-separated camera cones report no projected overlap');
  assert.equal(cov.polygon,false,'Disjoint cones do not draw a shared purple region');
  assert.ok(cov.message.includes('Sin superposición'),'No-overlap diagnostic explains the result');
   exclusive=await exclusiveState();
   assert.equal(exclusive.regions.length,2,'Separate cones render two distinct exclusive areas');
   assert.ok(exclusive.regions.every(r=>Math.abs(r.percent-100)<.01&&r.rule==='evenodd'&&r.pointer==='none'),'Disjoint cones: 100% exclusive of their own projected areas');
   union=await unionState();
   assert.equal(union.present,true,'Disjoint cones still have a measurable combined area');
   assert.ok(union.parts[0].percent>0&&union.parts[2].percent>0&&Math.abs(union.parts[1].percent)<.001,'Separate cones have no shared part of the union');
   assert.ok(Math.abs(union.parts.reduce((sum,p)=>sum+p.percent,0)-100)<.000001,'Bar segments always sum to the total union');
   assert.ok(union.parts.every(p=>Math.abs(p.width-p.percent)<.001),'Each bar segment uses its measured width, allowing browser CSS rounding');
   assert.ok(union.aria.includes('En común 0,0%'),'Disjoint cones report exactly 0% common projected area, not a rounding artifact');
   planes=await planesState();
   assert.equal(planes.region,'shared','Default two-plane metric is shared coverage');
   assert.equal(+planes.cells[0].value,0,'Separate cones have zero shared top-plane area');
   await page.select('[data-camera-overview-compare-focus]','a');
   focus=await focusState();
   assert.equal(focus.value,'a','Exclusive A focus is selected');
   assert.equal(focus.areas.find(r=>r.which==='a').opacity,.65,'A is emphasized');
   assert.equal(focus.areas.find(r=>r.which==='b').opacity,.05,'B is dimmed');
   assert.equal(focus.areas.find(r=>r.which==='a').stroke,'#22d3ee','Focused A has a visible boundary');
   union=await unionState();
   assert.equal(union.parts.find(p=>p.kind==='a').opacity,1,'Focus on A also highlights its share in the bar');
   assert.equal(union.parts.find(p=>p.kind==='b').opacity,.28,'The B segment is dimmed in the bar');
   planes=await planesState();
   assert.equal(planes.region,'a','Plane comparison follows selected exclusive A region');
   assert.ok(+planes.cells[0].value>0,'Top view measures exclusive A against combined area');
   detail=await focusDetailState();
   assert.equal(detail.kind,'a','Exclusive A focus displays A context');
   assert.ok(detail.content.includes('100,0% del encuadre A')&&detail.content.includes('% del área combinada')&&detail.content.includes('no se superpone con B'),'Exclusive A clarifies the two area denominators');
   await page.select('[data-camera-overview-compare-focus]','b');
   focus=await focusState();
   assert.equal(focus.value,'b','Exclusive B focus is selected');
   assert.equal(focus.areas.find(r=>r.which==='b').opacity,.65,'B is emphasized');
   assert.equal(focus.areas.find(r=>r.which==='a').opacity,.05,'A is dimmed');
   union=await unionState();
   assert.equal(union.parts.find(p=>p.kind==='b').opacity,1,'Focus on B also highlights its share in the bar');
   planes=await planesState();
   assert.equal(planes.region,'b','Plane comparison follows selected exclusive B region');
   detail=await focusDetailState();
   assert.equal(detail.kind,'b','Exclusive B focus displays B context');
   assert.ok(detail.content.includes('100,0% del encuadre B')&&detail.content.includes('% del área combinada')&&detail.content.includes('no se superpone con A'),'Exclusive B clarifies the two area denominators');
   await page.select('[data-camera-map-plane]','front');
   focus=await focusState();
   assert.equal(focus.value,'b','Focus persists across projection changes');
   assert.equal(focus.disabled,true,'Focus cannot claim reliable areas in edge-on view');
   assert.equal((await focusDetailState()).present,false,'Previously selected focus must not show bogus edge-on coverage');
   await page.select('[data-camera-map-plane]','top');
   focus=await focusState();
   assert.equal(focus.value,'b','Focus is restored on evaluable projections');
   assert.equal(focus.disabled,false,'Focus becomes available again');
   assert.equal((await focusDetailState()).kind,'b','Returning to an evaluable view restores the selected region explanation');
   await page.select('[data-camera-overview-compare-focus]','all');
   focus=await focusState();
   assert.ok(focus.areas.every(r=>r.opacity===.29),'Default view restores balanced area emphasis');
   await page.evaluate(()=>{
    const sc=sec();
    sc.sdCameraFrames=sc.sdCameraFrames.map(f=>({...f,rotateX:25,rotateY:30}));
    renderPane();
   });
   planes=await planesState();
   assert.equal(planes.region,'shared','Pitched camera keeps common region as default metric');
   assert.ok(planes.cells.every(c=>c.value!==''&&Number.isFinite(+c.value)),'Tilting the camera allows measurable X/Z and X/Y projections');
   assert.ok(planes.delta!==null&&Number.isFinite(+planes.delta),'Both valid projections show a finite difference in percentage points');
   assert.ok(Math.abs(+planes.delta-(+planes.cells[1].value- +planes.cells[0].value))<.000001,'Frontal minus top delta uses matching area denominators');
   await page.select('[data-camera-map-plane]','front');
   planes=await planesState();
   assert.equal(planes.cells[1].current,'true','Switching planes changes the current marker but not measurements');
   assert.ok(planes.cells.every(c=>c.value!==''),'Both projected values remain when current plane changes');
   await page.select('[data-camera-map-plane]','top');
   await page.evaluate(()=>{
    const sc=sec();
    sc.sdCameraFrames=sc.sdCameraFrames.map(f=>({...f,rotateX:0,rotateY:0}));
    renderPane();
   });
  await page.evaluate(saved=>{
   const sc=sec();sc.sdCameraOrientationMode=saved.orientation;
   sc.sdCameraFrames=JSON.parse(saved.camera);renderPane();
  },originalOverlapSelection);
  await page.select('[data-camera-overview-compare-a]',originalOverlapSelection.a);
  await page.select('[data-camera-overview-compare-b]',originalOverlapSelection.b);
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().sdCameraFrames)),motionNavigationInitial.frames,'Overlap visualization does not change authored camera frames');
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().sdCameraLookFrames)),motionNavigationInitial.looks,'Overlap visualization does not change authored look frames');
  await page.click('[data-camera-overview-compare-exclusive-toggle]');
   exclusive=await exclusiveState();
   assert.equal(exclusive.enabled,false,'Exclusive overlay can be disabled again');
   assert.equal(exclusive.regions.length,0,'Hiding exclusive areas preserves existing cone visualization');
   assert.equal(await page.evaluate(()=>history.length),motionNavigationInitial.historyCount,'Coverage calculations and UI do not add undo snapshots');
  console.log('Camera minimap FOV overlap/union: top/front comparison, active plane, unavailable views, finite deltas and non-destructive restore OK');










  await page.select('[data-camera-map-plane]','front');
  assert.equal(await page.$$eval('[data-camera-overview-event-kind]',nodes=>nodes.length),6,'Motion analysis uses XYZ, not the current 2D projection');
  await page.select('[data-camera-map-plane]','top');
  await page.evaluate(saved=>{
   const sc=sec();
   sc.sdCameraFrames=JSON.parse(saved.camera);sc.sdCameraOrientationMode=saved.orientation;
   sc.sdCameraPathMode=saved.pathMode;sc.sdCameraLookPathMode=saved.lookMode;sc.sdCameraLookFrames=JSON.parse(saved.lookFrames);
   renderPane();
  },{camera:originalFrames,...motionBefore});
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().sdCameraFrames)),originalFrames,'Motion diagnostics must not change authored camera frames');
  console.log('Camera minimap motion diagnostics: pauses, 3D reversals, turns, track separation and both projections OK');

  console.log('Camera minimap markers: camera/target glyphs, direct keyframe selection, three-way overlap cycling and restore OK');

  await page.click('[data-camera-map-zoom="0"]');
  await page.click('[data-camera-overview-toggle]');
  assert.equal(await page.$('[data-camera-overview]'),null,'Hiding minimap restores working area');
  console.log('Camera minimap: click, drag, Escape, keyboard precision, hide and nondestructive interactions OK');
  const curveBefore=await page.$eval('[data-camera-map-path]',n=>n.getAttribute('points'));
  await page.$eval('[data-camera-map]',n=>n.scrollIntoView({block:'center',inline:'nearest'}));
  const insertHit=await page.evaluate(()=>{
   const s=sec(),cfg=NAGWEB_SCROLL_CAMERA.config(s),list=NAGWEB_SCROLL_CAMERA.frames(cfg,s.sdEase),map=document.querySelector('[data-camera-map]'),r=map.getBoundingClientRect(),spec={range:+map.dataset.range,axis:map.dataset.plane==='front'?'y':'z',sign:map.dataset.plane==='front'?1:-1};
   const samples=NAGWEB_SCROLL_CAMERA.pathSamples({...cfg,frames:list},NAGWEB_STORY_MODEL,s.sdEase,128),sample=samples.reduce((a,v)=>Math.abs(v.at-25)<Math.abs(a.at-25)?v:a,samples[0]),p=NAGWEB_SCROLL_CAMERA.mapPoint(sample,spec);
   return{x:r.left+p.x/100*r.width,y:r.top+p.y/100*r.height,at:sample.at,pose:NAGWEB_SCROLL_CAMERA.pose({...cfg,frames:list},sample.at/100,NAGWEB_STORY_MODEL,s.sdEase,false),history:history.length};
  });
  await page.mouse.click(insertHit.x,insertHit.y,{count:2,delay:45});
  await page.waitForFunction(()=>sec().sdCameraFrames.length===4);
  const insertedBrowser=await page.evaluate(()=>({frame:sec().sdCameraFrames.find(k=>![0,50,100].includes(k.at)),history:history.length}));
  assert.ok(insertedBrowser.frame,'Double click on map path did not create a camera key');
  assert.ok(Math.abs(insertedBrowser.frame.at-insertHit.at)<1,'Inserted map key should use the clicked path moment: '+JSON.stringify({insertHit,insertedBrowser}));
  assert.ok(Math.hypot(insertedBrowser.frame.x-insertHit.pose.x,insertedBrowser.frame.y-insertHit.pose.y,insertedBrowser.frame.z-insertHit.pose.z)<3,'Inserted map key should capture the clicked curve pose');
  assert.equal(insertedBrowser.history,insertHit.history+1,'Map curve insertion should create one undo snapshot');
  const insertedAt=insertedBrowser.frame.at;
  await page.click('[data-camera-delete="'+insertedAt+'"]');
  await page.waitForFunction(()=>sec().sdCameraFrames.length===3);
  assert.equal(await page.$eval('[data-camera-map-path]',n=>n.getAttribute('points')),curveBefore,'Deleting the inserted key should restore the original sampled path');
  await page.click('[data-camera-jump="50"]');
  await page.waitForFunction(()=>document.querySelector('[data-camera-field="tension"][data-camera-at="50"]'));
  const tangentBefore=await page.evaluate(()=>{
   const h=document.querySelector('[data-camera-tangent-handle="out"]'),k=document.querySelector('[data-camera-map-dot="50"]');
   return{exists:!!h,hx:+h?.getAttribute('cx'),hy:+h?.getAttribute('cy'),kx:+k?.getAttribute('cx'),ky:+k?.getAttribute('cy')};
  });
  assert.equal(tangentBefore.exists,true);assert.ok(Math.hypot(tangentBefore.hx-tangentBefore.kx,tangentBefore.hy-tangentBefore.ky)>.1,'0% tension should show a visible outgoing tangent');
  assert.equal(await page.$eval('[data-camera-field="tension"][data-camera-at="50"]',n=>+n.value),0);
  const dualHandles=await page.evaluate(()=>({
   incoming:!!document.querySelector('[data-camera-tension-handle][data-camera-tension-side="in"]'),
   outgoing:!!document.querySelector('[data-camera-tension-handle][data-camera-tension-side="out"]'),
   inSvg:!!document.querySelector('[data-camera-tangent-handle="in"]'),
   outSvg:!!document.querySelector('[data-camera-tangent-handle="out"]')
  }));
  assert.deepEqual(dualHandles,{incoming:true,outgoing:true,inSvg:true,outSvg:true},'Middle camera key should expose incoming and outgoing curve handles');
  assert.equal(await page.$eval('[data-camera-incoming-tension][data-camera-at="50"]',n=>+n.value),0);
  assert.equal(await page.$eval('[data-camera-field="tension"][data-camera-at="50"]',n=>+n.value),0);
  await page.$eval('[data-camera-incoming-tension][data-camera-at="50"]',n=>{n.value='30';n.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.waitForFunction(()=>sec().sdCameraFrames.find(k=>k.at===0)?.tension===30&&document.querySelector('[data-camera-map-point="50"]'));
  const numericDual=await page.evaluate(()=>({prev:sec().sdCameraFrames.find(k=>k.at===0).tension,current:sec().sdCameraFrames.find(k=>k.at===50).tension??0,selected:document.querySelector('[data-camera-map-point]')?.dataset.cameraMapPoint}));
  assert.deepEqual(numericDual,{prev:30,current:0,selected:'50'},'Incoming numeric control must edit only the previous segment and preserve selection');
  await page.$eval('[data-camera-incoming-tension][data-camera-at="50"]',n=>{n.value='0';n.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.waitForFunction(()=>sec().sdCameraFrames.find(k=>k.at===0)?.tension===0);
  const freeBefore=await page.evaluate(()=>NAGWEB_SCROLL_CAMERA.pose(NAGWEB_SCROLL_CAMERA.config(sec()),.75,NAGWEB_STORY_MODEL,sec().sdEase,false));
  await page.select('[data-camera-handle-mode][data-camera-handle-side="out"]','free');
  await page.waitForFunction(()=>sec().sdCameraFrames.find(k=>k.at===50)?.curveOutFree===true&&document.querySelector('[data-camera-tension-handle][data-camera-tension-side="out"]')?.dataset.cameraHandleFree==='true');
  const freeEnabled=await page.evaluate(()=>({pose:NAGWEB_SCROLL_CAMERA.pose(NAGWEB_SCROLL_CAMERA.config(sec()),.75,NAGWEB_STORY_MODEL,sec().sdEase,false),frame:sec().sdCameraFrames.find(k=>k.at===50),disabled:document.querySelector('[data-camera-field="tension"][data-camera-at="50"]')?.disabled}));
  assert.ok(Math.hypot(freeEnabled.pose.x-freeBefore.x,freeEnabled.pose.y-freeBefore.y,freeEnabled.pose.z-freeBefore.z)<.001,'Switching to free handle must preserve current curve');
  assert.equal(freeEnabled.frame.curveOutFree,true);assert.equal(freeEnabled.disabled,true);
  const vectorUi=await page.evaluate(()=>({
   count:document.querySelectorAll('[data-camera-handle-vector][data-camera-handle-side="out"]').length,
   x:+document.querySelector('[data-camera-handle-vector][data-camera-handle-side="out"][data-camera-handle-axis="x"]')?.value,
   y:+document.querySelector('[data-camera-handle-vector][data-camera-handle-side="out"][data-camera-handle-axis="y"]')?.value,
   z:+document.querySelector('[data-camera-handle-vector][data-camera-handle-side="out"][data-camera-handle-axis="z"]')?.value
  }));
  assert.equal(vectorUi.count,3);
  const vectorPathBefore=await page.$eval('[data-camera-map-path]',n=>n.getAttribute('points'));
  await page.$eval('[data-camera-handle-vector][data-camera-handle-side="out"][data-camera-handle-axis="x"]',(n,v)=>{n.value=String(v);n.dispatchEvent(new Event('change',{bubbles:true}));},vectorUi.x+40);
  await page.waitForFunction(v=>sec().sdCameraFrames.find(k=>k.at===50)?.curveOutDX===v,{},vectorUi.x+40);
  assert.notEqual(await page.$eval('[data-camera-map-path]',n=>n.getAttribute('points')),vectorPathBefore,'Numeric free-handle X vector must redraw the X/Z map curve');
  await page.$eval('[data-camera-handle-vector][data-camera-handle-side="out"][data-camera-handle-axis="x"]',(n,v)=>{n.value=String(v);n.dispatchEvent(new Event('change',{bubbles:true}));},vectorUi.x);
  await page.waitForFunction(v=>sec().sdCameraFrames.find(k=>k.at===50)?.curveOutDX===v,{},vectorUi.x);
  await page.click('[data-camera-map-zoom="1"]');
  await page.click('[data-camera-map-pan="right"]');
  await page.$eval('[data-camera-tension-handle][data-camera-tension-side="out"]',n=>n.scrollIntoView({block:'center'}));
  const freeDragStart=await page.evaluate(()=>{const h=document.querySelector('[data-camera-tension-handle][data-camera-tension-side="out"]').getBoundingClientRect();return{x:h.left+h.width/2,y:h.top+h.height/2,history:history.length,path:document.querySelector('[data-camera-map-path]').getAttribute('points')};});
  await page.mouse.move(freeDragStart.x,freeDragStart.y);await page.mouse.down();await page.mouse.move(freeDragStart.x,freeDragStart.y+35,{steps:5});await page.mouse.up();
  await capture('map-complex-free-curve');
  const freeDragEnd=await page.evaluate(()=>({frame:sec().sdCameraFrames.find(k=>k.at===50),history:history.length,path:document.querySelector('[data-camera-map-path]').getAttribute('points'),pose:NAGWEB_SCROLL_CAMERA.pose(NAGWEB_SCROLL_CAMERA.config(sec()),.75,NAGWEB_STORY_MODEL,sec().sdEase,false)}));
  assert.equal(freeDragEnd.frame.curveOutFree,true);assert.ok(Math.abs(freeDragEnd.frame.curveOutDZ)>10,'Top-view free drag should bend the handle in Z');
  assert.notEqual(freeDragEnd.path,freeDragStart.path);assert.equal(freeDragEnd.history,freeDragStart.history+1);
  assert.equal(+await page.$eval('[data-camera-handle-vector][data-camera-handle-side="out"][data-camera-handle-axis="z"]',n=>n.value),freeDragEnd.frame.curveOutDZ,'Mouse drag and numeric free-handle vector must stay synchronized');
  assert.ok(Math.hypot(freeDragEnd.pose.x-freeBefore.x,freeDragEnd.pose.y-freeBefore.y,freeDragEnd.pose.z-freeBefore.z)>1,'Free direction must change spatial path');
  await page.evaluate(()=>undo());
  assert.equal(await page.$eval('[data-camera-map-path]',n=>n.getAttribute('points')),freeDragStart.path,'Undo restores curve after zoomed/panned free-handle edit');
  await page.evaluate(()=>redo());
  assert.deepEqual(await page.evaluate(()=>sec().sdCameraFrames.find(k=>k.at===50)),freeDragEnd.frame,'Redo restores edited free handle');
  await page.evaluate(()=>{const html=generateSite(flattenPage(page()),false,false,false),f=document.createElement('iframe');f.id='camera-free-export';f.style.cssText='width:1000px;height:600px;border:0';f.srcdoc=html;document.body.append(f);});
  await page.waitForFunction(()=>document.querySelector('#camera-free-export')?.contentWindow?.__NAG_SCROLL_DIRECTOR?.['camera-browser-scene']);
  const freeExportError=await page.evaluate(expected=>{
   const f=document.querySelector('#camera-free-export'),w=f.contentWindow,d=f.contentDocument;w.__NAG_SCROLL_DIRECTOR['camera-browser-scene'].set(.75);
   const world=d.querySelector('.sc[data-id="camera-browser-scene"] .inner'),a=world.getAnimations().find(a=>a.playState==='paused'),raw=a?.effect?.getKeyframes?.()[0]?.transform||'none',actual=new w.DOMMatrix(raw);
   const probe=d.createElement('i');probe.style.transform=(expected.rotate?'rotateZ('+(-expected.rotate)+'deg) ':'')+(expected.rotateY?'rotateY('+(-expected.rotateY)+'deg) ':'')+(expected.rotateX?'rotateX('+(-expected.rotateX)+'deg) ':'')+'translate3d('+(-expected.x)+'px,'+(-expected.y)+'px,'+expected.z+'px)';d.body.append(probe);
   const target=new w.DOMMatrix(w.getComputedStyle(probe).transform);probe.remove();const keys=['m11','m12','m13','m14','m21','m22','m23','m24','m31','m32','m33','m34','m41','m42','m43','m44'];return Math.max(...keys.map(k=>Math.abs(actual[k]-target[k])));
  },freeDragEnd.pose);
  assert.ok(freeExportError<.001,'Free Bezier handle must serialize into exported runtime');
  await page.$eval('#camera-free-export',n=>n.remove());
  await page.click('[data-camera-map-zoom="0"]');
  await page.select('[data-camera-handle-mode][data-camera-handle-side="out"]','auto');
  await page.waitForFunction(()=>!sec().sdCameraFrames.find(k=>k.at===50)?.curveOutFree&&document.querySelector('[data-camera-tension-handle][data-camera-tension-side="out"]')?.dataset.cameraHandleFree==='false');
  const incomingStart=await page.evaluate(()=>{
   const h=document.querySelector('[data-camera-tension-handle][data-camera-tension-side="in"]').getBoundingClientRect(),k=document.querySelector('[data-camera-map-point="50"]').getBoundingClientRect();
   return{hx:h.left+h.width/2,hy:h.top+h.height/2,kx:k.left+k.width/2,ky:k.top+k.height/2,prev:sec().sdCameraFrames.find(k=>k.at===0).tension??0,current:sec().sdCameraFrames.find(k=>k.at===50).tension??0,history:history.length};
  });
  await page.mouse.move(incomingStart.hx,incomingStart.hy);await page.mouse.down();await page.mouse.move((incomingStart.hx+incomingStart.kx)/2,(incomingStart.hy+incomingStart.ky)/2,{steps:4});await page.mouse.up();
  const incomingEnd=await page.evaluate(()=>({prev:sec().sdCameraFrames.find(k=>k.at===0).tension??0,current:sec().sdCameraFrames.find(k=>k.at===50).tension??0,history:history.length}));
  assert.ok(incomingEnd.prev>=45&&incomingEnd.prev<=55,'Incoming handle should edit previous segment tension: '+JSON.stringify(incomingEnd));
  assert.equal(incomingEnd.current,incomingStart.current,'Incoming handle must not alter outgoing segment tension');
  assert.equal(incomingEnd.history,incomingStart.history+1,'Incoming tangent drag creates one undo snapshot');
  await page.evaluate(()=>{const s=sec(),k=s.sdCameraFrames.find(k=>k.at===0);k.tension=0;saveProject();renderPane();});
  await page.waitForFunction(()=>document.querySelector('[data-camera-tension-handle][data-camera-tension-side="in"]'));
  await page.$eval('[data-camera-tension-handle][data-camera-tension-side="out"]',n=>n.scrollIntoView({block:'center'}));
  const tensionDragStart=await page.evaluate(()=>{
   const h=document.querySelector('[data-camera-tension-handle][data-camera-tension-side="out"]').getBoundingClientRect(),k=document.querySelector('[data-camera-map-point="50"]').getBoundingClientRect();
   return{hx:h.left+h.width/2,hy:h.top+h.height/2,kx:k.left+k.width/2,ky:k.top+k.height/2,history:history.length};
  });
  await page.mouse.move(tensionDragStart.hx,tensionDragStart.hy);await page.mouse.down();
  await page.mouse.move((tensionDragStart.hx+tensionDragStart.kx)/2,(tensionDragStart.hy+tensionDragStart.ky)/2,{steps:4});await page.mouse.up();
  const tensionDragEnd=await page.evaluate(()=>({value:sec().sdCameraFrames.find(k=>k.at===50).tension,history:history.length}));
  assert.ok(tensionDragEnd.value>=45&&tensionDragEnd.value<=55,'Half-length tangent drag should produce about +50 tension: '+JSON.stringify(tensionDragEnd));
  assert.equal(tensionDragEnd.history,tensionDragStart.history+1,'Tangent drag should create one undo snapshot');
  const tensionCancelStart=await page.evaluate(()=>({value:sec().sdCameraFrames.find(k=>k.at===50).tension,history:history.length}));
  const tensionBox=await page.$eval('[data-camera-tension-handle][data-camera-tension-side="out"]',n=>{const r=n.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};});
  await page.mouse.move(tensionBox.x,tensionBox.y);await page.mouse.down();await page.mouse.move(tensionBox.x+35,tensionBox.y-25,{steps:3});await page.keyboard.press('Escape');await page.mouse.up();
  const tensionCancelEnd=await page.evaluate(()=>({value:sec().sdCameraFrames.find(k=>k.at===50).tension,history:history.length}));
  assert.deepEqual(tensionCancelEnd,tensionCancelStart,'Escape must cancel tangent drag without history mutation');
  await page.$eval('[data-camera-field="tension"][data-camera-at="50"]',n=>{n.value='0';n.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.waitForFunction(()=>sec().sdCameraFrames.find(k=>k.at===50)?.tension===0);
  await page.$eval('[data-camera-field="tension"][data-camera-at="50"]',n=>{n.value='100';n.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.waitForFunction(()=>sec().sdCameraFrames.find(k=>k.at===50)?.tension===100&&document.querySelector('[data-camera-field="tension"][data-camera-at="50"]'));
  const curveAfter=await page.$eval('[data-camera-map-path]',n=>n.getAttribute('points'));
  assert.notEqual(curveAfter,curveBefore,'Changing segment tension must redraw the sampled spatial path');
  const tangentAfter=await page.evaluate(()=>{
   const h=document.querySelector('[data-camera-tangent-handle="out"]'),k=document.querySelector('[data-camera-map-dot="50"]');
   return{hx:+h?.getAttribute('cx'),hy:+h?.getAttribute('cy'),kx:+k?.getAttribute('cx'),ky:+k?.getAttribute('cy')};
  });
  assert.ok(Math.hypot(tangentAfter.hx-tangentAfter.kx,tangentAfter.hy-tangentAfter.ky)<.001,'+100% tension should retract the tangent preview onto the selected key');
  await page.select('[data-camera-path-mode]','linear');
  await page.waitForFunction(()=>!document.querySelector('[data-camera-field="tension"]')&&!document.querySelector('[data-camera-tangent-handle="out"]'));
  await page.select('[data-camera-path-mode]','smooth');
  await page.waitForFunction(()=>document.querySelector('[data-camera-field="tension"][data-camera-at="50"]')&&document.querySelector('[data-camera-tangent-handle="out"]'));
  assert.equal(await page.$eval('[data-camera-field="tension"][data-camera-at="50"]',n=>+n.value),100,'Tension survives temporary linear mode');

  await page.evaluate(()=>{
   const s=sec();s.sdCameraOrientationMode='lookAt';s.sdCameraLookPathMode='smooth';s.sdCameraLookFrames=[
    {at:0,x:-200,y:0,z:900,ease:'linear'},
    {at:50,x:0,y:200,z:1200,ease:'linear'},
    {at:100,x:300,y:-100,z:800,ease:'linear'}
   ];saveProject();renderPane();schedulePreview();
  });
  await page.waitForFunction(()=>document.querySelector('[data-camera-look-jump="50"]'));
  await page.click('[data-camera-look-jump="50"]');
  await page.waitForFunction(()=>document.querySelector('[data-camera-look-map-point="50"]')&&document.querySelectorAll('[data-camera-look-tension-handle]').length===2);
  // Direction and live camera/target synchronization when orientation is lookAt.
  await page.click('[data-camera-overview-toggle]');
  await page.waitForFunction(()=>document.querySelector('[data-camera-overview-current-link]')&&document.querySelector('[data-camera-overview-look-current]'));
  const lookMiniInitial=await page.evaluate(()=>{
   const node=document.querySelector('[data-camera-overview]');
   return {camera:node.querySelectorAll('[data-camera-overview-direction="camera"] polygon').length,look:node.querySelectorAll('[data-camera-overview-direction="look"] polygon').length,begin:+node.querySelector('[data-camera-overview-current]').getAttribute('cx')};
  });
  assert.equal(lookMiniInitial.camera,3,'Camera directions remain visible in lookAt mode');
  assert.equal(lookMiniInitial.look,3,'Look trajectory has distinct arrows showing its direction');
  await page.evaluate(()=>NAGWEB_SCROLL_DIRECTOR.scrub('camera-browser-scene',.75));
  await page.waitForFunction(()=>document.querySelector('[data-camera-overview-progress]')?.textContent==='75%');
  const lookMiniMoved=await page.evaluate(()=>{
   const node=document.querySelector('[data-camera-overview]'),camera=node.querySelector('[data-camera-overview-current]'),look=node.querySelector('[data-camera-overview-look-current]'),link=node.querySelector('[data-camera-overview-current-link]');
   const n=(el,name)=>+el.getAttribute(name);
   const spec={range:+node.dataset.range,axis:node.dataset.plane==='front'?'y':'z',sign:node.dataset.plane==='front'?1:-1},s=sec(),cfg=NAGWEB_SCROLL_CAMERA.config(s);
   const expectedLook=NAGWEB_SCROLL_CAMERA.mapPoint(NAGWEB_SCROLL_CAMERA.lookTarget(cfg,.75,NAGWEB_STORY_MODEL,s.sdEase,undefined,{width:1000,height:600}),spec);
   return {camX:n(camera,'cx'),camY:n(camera,'cy'),lookX:n(look,'cx'),lookY:n(look,'cy'),link:[n(link,'x1'),n(link,'y1'),n(link,'x2'),n(link,'y2')],expectedLook,progress:node.querySelector('[data-camera-overview-progress]').textContent};
  });
  assert.ok(Math.abs(lookMiniMoved.camX-lookMiniInitial.begin)>.2,'Camera live minimap dot responds to scroll progress');
  assert.deepEqual(lookMiniMoved.link,[lookMiniMoved.camX,lookMiniMoved.camY,lookMiniMoved.lookX,lookMiniMoved.lookY],'Camera and look live markers stay connected at the same scroll progress');
  assert.equal(lookMiniMoved.progress,'75%','Minimap updates its progress label while scrubbing');
  const active75=await page.evaluate(()=>{
   const node=document.querySelector('[data-camera-overview]');
   return {label:node.querySelector('[data-camera-overview-active-label]')?.textContent,cam:node.querySelector('[data-camera-overview-active-camera]')?.getAttribute('points'),look:node.querySelector('[data-camera-overview-active-look]')?.getAttribute('points'),cameraEnds:node.querySelectorAll('[data-camera-overview-ends="camera"] text').length,lookEnds:node.querySelectorAll('[data-camera-overview-ends="look"] text').length};
  });
  assert.equal(active75.label,'◆ 50–100% · ● 50–100%','Both camera and look intervals are identified during scroll');
  assert.equal(active75.cameraEnds,2,'Camera start and finish remain visible in lookAt mode');
  assert.equal(active75.lookEnds,2,'Look target start and finish are distinguished');
  assert.ok(active75.cam.length>6&&active75.look.length>6,'Camera and look active segments are visibly highlighted');
  await page.evaluate(()=>NAGWEB_SCROLL_DIRECTOR.scrub('camera-browser-scene',.25));
  await page.waitForFunction(()=>document.querySelector('[data-camera-overview-active-label]')?.textContent==='◆ 0–50% · ● 0–50%');
  const active25=await page.evaluate(()=>{
   const node=document.querySelector('[data-camera-overview]');
   return {cam:node.querySelector('[data-camera-overview-active-camera]')?.getAttribute('points'),look:node.querySelector('[data-camera-overview-active-look]')?.getAttribute('points'),label:node.querySelector('[data-camera-overview-active-label]')?.textContent};
  });
  assert.ok(active25.cam!==active75.cam&&active25.look!==active75.look,'Highlighted camera and look intervals switch at the keyframe boundary');
  assert.equal(active25.label,'◆ 0–50% · ● 0–50%');
  console.log('Camera minimap: dynamic camera/look active intervals and initial/final markers OK');
  await page.evaluate(()=>NAGWEB_SCROLL_DIRECTOR.scrub('camera-browser-scene',.5));
  await page.click('[data-camera-overview-toggle]');
  const lookCurveUi=await page.evaluate(()=>({
   handles:document.querySelectorAll('[data-camera-look-tension-handle]').length,
   path:(document.querySelector('[data-camera-look-map-path]')?.getAttribute('points')||''),
   target:NAGWEB_SCROLL_CAMERA.lookTarget(NAGWEB_SCROLL_CAMERA.config(sec()),.75,NAGWEB_STORY_MODEL,sec().sdEase),
   history:history.length
  }));
  assert.equal(lookCurveUi.handles,2);assert.ok(lookCurveUi.path.length>20);
  await page.select('[data-camera-look-handle-mode][data-camera-look-handle-side="out"]','free');
  await page.waitForFunction(()=>sec().sdCameraLookFrames.find(k=>k.at===50)?.curveOutFree===true&&document.querySelector('[data-camera-look-tension-handle][data-camera-look-tension-side="out"]')?.dataset.cameraLookHandleFree==='true');
  const lookFreeEnabled=await page.evaluate(()=>({
   target:NAGWEB_SCROLL_CAMERA.lookTarget(NAGWEB_SCROLL_CAMERA.config(sec()),.75,NAGWEB_STORY_MODEL,sec().sdEase),
   vectors:document.querySelectorAll('[data-camera-look-handle-vector][data-camera-look-handle-side="out"]').length
  }));
  assert.equal(lookFreeEnabled.vectors,3);
  assert.ok(Math.hypot(lookFreeEnabled.target.x-lookCurveUi.target.x,lookFreeEnabled.target.y-lookCurveUi.target.y,lookFreeEnabled.target.z-lookCurveUi.target.z)<.001,'Enabling free look handle must preserve target path');
  const lookVectorStart=await page.evaluate(()=>({
   x:+document.querySelector('[data-camera-look-handle-vector][data-camera-look-handle-side="out"][data-camera-look-handle-axis="x"]').value,
   path:document.querySelector('[data-camera-look-map-path]').getAttribute('points')
  }));
  await page.$eval('[data-camera-look-handle-vector][data-camera-look-handle-side="out"][data-camera-look-handle-axis="x"]',(n,v)=>{n.value=String(v);n.dispatchEvent(new Event('change',{bubbles:true}));},lookVectorStart.x+40);
  await page.waitForFunction(v=>sec().sdCameraLookFrames.find(k=>k.at===50)?.curveOutDX===v,{},lookVectorStart.x+40);
  assert.notEqual(await page.$eval('[data-camera-look-map-path]',n=>n.getAttribute('points')),lookVectorStart.path,'Numeric look-handle vector must redraw target path');
  await page.$eval('[data-camera-look-handle-vector][data-camera-look-handle-side="out"][data-camera-look-handle-axis="x"]',(n,v)=>{n.value=String(v);n.dispatchEvent(new Event('change',{bubbles:true}));},lookVectorStart.x);
  await page.waitForFunction(v=>sec().sdCameraLookFrames.find(k=>k.at===50)?.curveOutDX===v,{},lookVectorStart.x);
  await page.$eval('[data-camera-look-tension-handle][data-camera-look-tension-side="out"]',n=>n.scrollIntoView({block:'center'}));
  const lookDragStart=await page.evaluate(()=>{const h=document.querySelector('[data-camera-look-tension-handle][data-camera-look-tension-side="out"]').getBoundingClientRect();return{x:h.left+h.width/2,y:h.top+h.height/2,history:history.length,path:document.querySelector('[data-camera-look-map-path]').getAttribute('points')};});
  await page.mouse.move(lookDragStart.x,lookDragStart.y);await page.mouse.down();await page.mouse.move(lookDragStart.x,lookDragStart.y+32,{steps:5});await page.mouse.up();
  const lookDragEnd=await page.evaluate(()=>({
   frame:sec().sdCameraLookFrames.find(k=>k.at===50),history:history.length,path:document.querySelector('[data-camera-look-map-path]').getAttribute('points'),
   target:NAGWEB_SCROLL_CAMERA.lookTarget(NAGWEB_SCROLL_CAMERA.config(sec()),.75,NAGWEB_STORY_MODEL,sec().sdEase),
   vectorZ:+document.querySelector('[data-camera-look-handle-vector][data-camera-look-handle-side="out"][data-camera-look-handle-axis="z"]').value
  }));
  assert.equal(lookDragEnd.frame.curveOutFree,true);assert.ok(Math.abs(lookDragEnd.frame.curveOutDZ)>10);assert.equal(lookDragEnd.vectorZ,lookDragEnd.frame.curveOutDZ);
  assert.notEqual(lookDragEnd.path,lookDragStart.path);assert.equal(lookDragEnd.history,lookDragStart.history+1);
  assert.ok(Math.hypot(lookDragEnd.target.x-lookCurveUi.target.x,lookDragEnd.target.y-lookCurveUi.target.y,lookDragEnd.target.z-lookCurveUi.target.z)>1);
  const expectedLookPose=await page.evaluate(()=>NAGWEB_SCROLL_CAMERA.pose(NAGWEB_SCROLL_CAMERA.config(sec()),.75,NAGWEB_STORY_MODEL,sec().sdEase,false));
  await page.evaluate(()=>{const html=generateSite(flattenPage(page()),false,false,false),f=document.createElement('iframe');f.id='camera-look-export';f.style.cssText='width:1000px;height:600px;border:0';f.srcdoc=html;document.body.append(f);});
  await page.waitForFunction(()=>document.querySelector('#camera-look-export')?.contentWindow?.__NAG_SCROLL_DIRECTOR?.['camera-browser-scene']);
  const lookExportError=await page.evaluate(expected=>{
   const f=document.querySelector('#camera-look-export'),w=f.contentWindow,d=f.contentDocument;w.__NAG_SCROLL_DIRECTOR['camera-browser-scene'].set(.75);
   const world=d.querySelector('.sc[data-id="camera-browser-scene"] .inner'),a=world.getAnimations().find(a=>a.playState==='paused'),raw=a?.effect?.getKeyframes?.()[0]?.transform||'none',actual=new w.DOMMatrix(raw);
   const probe=d.createElement('i');probe.style.transform=(expected.rotate?'rotateZ('+(-expected.rotate)+'deg) ':'')+(expected.rotateY?'rotateY('+(-expected.rotateY)+'deg) ':'')+(expected.rotateX?'rotateX('+(-expected.rotateX)+'deg) ':'')+'translate3d('+(-expected.x)+'px,'+(-expected.y)+'px,'+expected.z+'px)';d.body.append(probe);const target=new w.DOMMatrix(w.getComputedStyle(probe).transform);probe.remove();
   const keys=['m11','m12','m13','m14','m21','m22','m23','m24','m31','m32','m33','m34','m41','m42','m43','m44'];return Math.max(...keys.map(k=>Math.abs(actual[k]-target[k])));
  },expectedLookPose);
  assert.ok(lookExportError<.001,'Free look-target Bezier must serialize into exported camera orientation');
  await page.$eval('#camera-look-export',n=>n.remove());
  await page.select('[data-camera-look-handle-mode][data-camera-look-handle-side="out"]','auto');
  await page.waitForFunction(()=>!sec().sdCameraLookFrames.find(k=>k.at===50)?.curveOutFree);
  await page.select('[data-camera-orientation-mode]','manual');
  await page.waitForFunction(()=>sec().sdCameraOrientationMode==='manual');

  await page.focus('[data-camera-map-point="50"]');await page.keyboard.press('ArrowRight');
  assert.equal(await page.evaluate(()=>sec().sdCameraFrames.find(k=>k.at===50).x),225);
  await page.select('[data-camera-map-plane]','front');
  await page.waitForFunction(()=>document.querySelector('[data-camera-map]')?.dataset.plane==='front');
  await page.focus('[data-camera-map-point="50"]');await page.keyboard.press('ArrowDown');
  const edited=await page.evaluate(()=>sec().sdCameraFrames.find(k=>k.at===50));
  assert.equal(edited.x,225);assert.equal(edited.y,125);assert.equal(edited.z,100);assert.equal(edited.rotateY,20);

  await page.evaluate(()=>{
   const html=generateSite(flattenPage(page()),false,false,false),f=document.createElement('iframe');
   f.id='camera-browser-export';f.style.cssText='width:1000px;height:650px;border:0';f.srcdoc=html;document.body.append(f);
  });
  await page.waitForFunction(()=>document.querySelector('#camera-browser-export')?.contentWindow?.__NAG_SCROLL_DIRECTOR?.['camera-browser-scene']);
  const runtime=await page.evaluate(()=>{
   const f=document.querySelector('#camera-browser-export'),w=f.contentWindow,d=f.contentDocument;
   w.__NAG_SCROLL_DIRECTOR['camera-browser-scene'].set(.5);
   const scene=d.querySelector('.sc[data-id="camera-browser-scene"]'),world=scene.querySelector('.inner'),group=d.querySelector('[data-id="camera-abs"]'),child=d.querySelector('[data-id="camera-child"]');
   const entries=['m11','m12','m13','m14','m21','m22','m23','m24','m31','m32','m33','m34','m41','m42','m43','m44'];
   function matrixFromAnimation(n){
    const a=n.getAnimations().find(a=>a.playState==='paused'),t=a?.effect?.getKeyframes?.()[0]?.transform||'none';
    return {matrix:new w.DOMMatrix(t),raw:t};
   }
   function matrixFromTransform(t){
    const probe=d.createElement('i');probe.style.transform=t;d.body.append(probe);
    const m=new w.DOMMatrix(w.getComputedStyle(probe).transform);probe.remove();return m;
   }
   function error(a,b){return Math.max(...entries.map(k=>Math.abs(a[k]-b[k])));}
   w.__NAG_SCROLL_DIRECTOR['camera-browser-scene'].set(.25);
   const quarterA=matrixFromAnimation(world),quarterE=matrixFromTransform('rotateZ(-2.5deg) rotateY(-10deg) rotateX(-5deg) translate3d(-101.5625px,-76.5625px,56.25px)');
   w.__NAG_SCROLL_DIRECTOR['camera-browser-scene'].set(.5);
   const worldA=matrixFromAnimation(world),groupA=matrixFromAnimation(group),childA=matrixFromAnimation(child);
   const worldE=matrixFromTransform('rotateZ(-5deg) rotateY(-20deg) rotateX(-10deg) translate3d(-225px,-125px,100px)');
   const groupE=matrixFromTransform('translateZ(-300px) rotateX(0deg) rotateY(0deg)');
   const childE=matrixFromTransform('translateZ(50px) rotateX(10deg) rotateY(-15deg)');
   w.__NAG_SCROLL_DIRECTOR['camera-browser-scene'].set(.75);
   const tensionA=matrixFromAnimation(world),tensionE=matrixFromTransform('rotateZ(-2.5deg) rotateY(-10deg) rotateX(-5deg) translate3d(-312.5px,-12.5px,50px)');
   return{
    groupInWorld:group.parentNode===world,
    childInGroup:child.parentNode===group,
    groupStyle:w.getComputedStyle(group).transformStyle,
    authoredLeft:group.style.left,
    quarterError:error(quarterA.matrix,quarterE),
    worldError:error(worldA.matrix,worldE),
    tensionError:error(tensionA.matrix,tensionE),
    groupError:error(groupA.matrix,groupE),
    childError:error(childA.matrix,childE),
    childRaw:childA.raw,
    perspective:w.getComputedStyle(scene.querySelector('.nw-sd-stage')).perspective
   };
  });
  assert.equal(runtime.groupInWorld,true);assert.equal(runtime.childInGroup,true);assert.equal(runtime.groupStyle,'preserve-3d');
  assert.ok(runtime.quarterError<.001,'Smooth camera quarter-path mismatch: '+JSON.stringify(runtime));
  assert.ok(runtime.worldError<.001,'Camera matrix mismatch: '+JSON.stringify(runtime));
  assert.ok(runtime.tensionError<.001,'Per-segment tension was not preserved in exported camera runtime: '+JSON.stringify(runtime));
  assert.ok(runtime.groupError<.001,'Container depth matrix mismatch: '+JSON.stringify(runtime));
  assert.ok(runtime.childError<.001,'Nested 2.5D matrix mismatch: '+JSON.stringify(runtime));
  assert.ok(!runtime.childRaw.includes('perspective('),'Nested child must reuse shared camera perspective');
  assert.equal(runtime.perspective,'1000px');

  // Resize the same paused export to a narrow viewport. The camera should adapt
  // spatial movement and shared perspective, while preserving authored angles and
  // nested child depth that is not a camera layer.
  await page.$eval('#camera-browser-export',n=>{n.style.width='390px';});
  await page.evaluate(()=>document.querySelector('#camera-browser-export').contentWindow.dispatchEvent(new Event('resize')));
  await new Promise(r=>setTimeout(r,120));
  const mobileRuntime=await page.evaluate(()=>{
   const f=document.querySelector('#camera-browser-export'),w=f.contentWindow,d=f.contentDocument,api=w.__NAG_SCROLL_DIRECTOR['camera-browser-scene'];
   api.set(.5);
   const scene=d.querySelector('.sc[data-id="camera-browser-scene"]'),stage=scene.querySelector('.nw-sd-stage'),world=scene.querySelector('.inner'),group=d.querySelector('[data-id="camera-abs"]'),child=d.querySelector('[data-id="camera-child"]');
   const entries=['m11','m12','m13','m14','m21','m22','m23','m24','m31','m32','m33','m34','m41','m42','m43','m44'];
   function matrixFromAnimation(n){
    const a=n.getAnimations().find(a=>a.playState==='paused'),t=a?.effect?.getKeyframes?.()[0]?.transform||'none';
    return {matrix:new w.DOMMatrix(t),raw:t};
   }
   function matrixFromTransform(t){
    const probe=d.createElement('i');probe.style.transform=t;d.body.append(probe);
    const m=new w.DOMMatrix(w.getComputedStyle(probe).transform);probe.remove();return m;
   }
   function error(a,b){return Math.max(...entries.map(k=>Math.abs(a[k]-b[k])));}
   const scale=Math.min(1,stage.clientWidth/1000),worldA=matrixFromAnimation(world),groupA=matrixFromAnimation(group),childA=matrixFromAnimation(child);
   const worldE=matrixFromTransform('rotateZ(-5deg) rotateY(-20deg) rotateX(-10deg) translate3d('+(-225*scale)+'px,'+(-125*scale)+'px,'+(100*scale)+'px)');
   const groupE=matrixFromTransform('translateZ('+(-300*scale)+'px) rotateX(0deg) rotateY(0deg)');
   const childE=matrixFromTransform('translateZ(50px) rotateX(10deg) rotateY(-15deg)');
   return{
    width:stage.clientWidth,scale,
    worldError:error(worldA.matrix,worldE),groupError:error(groupA.matrix,groupE),childError:error(childA.matrix,childE),
    perspective:w.getComputedStyle(stage).perspective,
    worldRaw:worldA.raw,groupRaw:groupA.raw,childRaw:childA.raw
   };
  });
  assert.ok(mobileRuntime.width<=390&&mobileRuntime.width>=360,'Unexpected narrow stage width: '+JSON.stringify(mobileRuntime));
  assert.ok(mobileRuntime.scale<.4&&mobileRuntime.scale>.35,'Responsive scale not applied: '+JSON.stringify(mobileRuntime));
  assert.ok(mobileRuntime.worldError<.001,'Responsive camera matrix mismatch: '+JSON.stringify(mobileRuntime));
  assert.ok(mobileRuntime.groupError<.001,'Responsive layer depth mismatch: '+JSON.stringify(mobileRuntime));
  assert.ok(mobileRuntime.childError<.001,'Nested child should preserve authored 2.5D motion: '+JSON.stringify(mobileRuntime));
  assert.equal(mobileRuntime.perspective,(1000*mobileRuntime.scale)+'px');
  assert.ok(!mobileRuntime.childRaw.includes('perspective('),'Mobile nested child must keep shared perspective');

  const savedResponsive=await page.evaluate(()=>({
   responsive:sec().sdCameraResponsive,
   referenceWidth:sec().sdCameraReferenceWidth,
   frame:sec().sdCameraFrames.find(k=>k.at===50)
  }));
  assert.equal(savedResponsive.responsive,true);assert.equal(savedResponsive.referenceWidth,1000);
  assert.equal(savedResponsive.frame.x,225);assert.equal(savedResponsive.frame.y,125);assert.equal(savedResponsive.frame.z,100);
  assert.equal(savedResponsive.frame.rotateX,10);assert.equal(savedResponsive.frame.rotateY,20);assert.equal(savedResponsive.frame.rotate,5);assert.equal(savedResponsive.frame.tension,100);

  // Existing DOM -> Three.js anchors should inherit camera motion automatically
  // because they project the transformed anchor rect on every update.
  const anchorBridge=await page.evaluate(()=>{
   const f=document.querySelector('#camera-browser-export'),w=f.contentWindow,d=f.contentDocument,api=w.__NAG_SCROLL_DIRECTOR['camera-browser-scene'];
   const el=d.querySelector('[data-id="camera-child"]');
   function vec(x=0,y=0,z=0){return{x,y,z,set(a,b,c){this.x=a;this.y=b;this.z=c;}}}
   const object={position:vec(),scale:vec(1,1,1),rotation:vec()};
   const handle=w.NAGWEB_3D_ANCHOR.bind(el,object,{},{
    project:({ndcX,ndcY})=>({x:ndcX,y:ndcY,z:3}),
    followSize:false,followCssScale:false,followCssRotation:false
   });
   api.set(0);handle.update();
   const first={x:object.position.x,y:object.position.y,z:object.position.z,rect:handle.snapshot().anchorRect};
   api.set(.5);
   // The Director now refreshes 3D anchors inside the same camera paint.
   const second={x:object.position.x,y:object.position.y,z:object.position.z,rect:handle.snapshot().anchorRect};
   handle.destroy();
   return{
    moved:Math.abs(second.x-first.x)>.01||Math.abs(second.y-first.y)>.01,
    projected:first.z===3&&second.z===3,
    rectMoved:Math.abs(second.rect.left-first.rect.left)>.5||Math.abs(second.rect.top-first.rect.top)>.5,
    cleaned:w.NAGWEB_3D_ANCHOR.count()===0,
    first,second
   };
  });
  assert.equal(anchorBridge.moved,true,'3D anchor did not follow camera motion: '+JSON.stringify(anchorBridge));
  assert.equal(anchorBridge.projected,true);assert.equal(anchorBridge.rectMoved,true);assert.equal(anchorBridge.cleaned,true);

  // Look-at mode keeps its own target timeline and derives pitch/yaw from it.
  await page.evaluate(()=>{
   const s=sec();
   s.sdCameraOrientationMode='lookAt';s.sdCameraLookPathMode='linear';
   s.sdCameraLookFrames=[
    {at:0,x:0,y:0,z:1000,ease:'linear'},
    {at:50,x:1225,y:125,z:100,ease:'linear'},
    {at:100,x:400,y:-100,z:1000,ease:'linear'}
   ];
   renderPane();renderPreview();
  });
  await page.waitForFunction(()=>document.querySelector('[data-camera-orientation-mode]')?.value==='lookAt'&&document.querySelectorAll('[data-camera-look-jump]').length===3);
  const lookUi=await page.evaluate(()=>({
   targets:document.querySelectorAll('[data-camera-look-jump]').length,
   hasPath:!!document.querySelector('[data-camera-look-map-path]'),
   hasCurrent:!!document.querySelector('[data-camera-look-position]'),
   mode:document.querySelector('[data-camera-look-path-mode]')?.value
  }));
  assert.equal(lookUi.targets,3);assert.equal(lookUi.hasPath,true);assert.equal(lookUi.hasCurrent,true);assert.equal(lookUi.mode,'linear');
  const lookPathBefore=await page.$eval('[data-camera-look-map-path]',n=>n.getAttribute('points'));
  await page.$eval('[data-camera-look-map-path-hit]',n=>n.closest('[data-camera-map]')?.scrollIntoView({block:'center',inline:'nearest'}));
  const lookInsertHit=await page.evaluate(()=>{
   const s=sec(),cfg=NAGWEB_SCROLL_CAMERA.config(s),map=document.querySelector('[data-camera-map]'),r=map.getBoundingClientRect(),spec={range:+map.dataset.range,axis:map.dataset.plane==='front'?'y':'z',sign:map.dataset.plane==='front'?1:-1},size={width:1000,height:1000},target=NAGWEB_SCROLL_CAMERA.lookTarget(cfg,.25,NAGWEB_STORY_MODEL,s.sdEase,size),p=NAGWEB_SCROLL_CAMERA.mapPoint(target,spec),top=document.elementFromPoint(r.left+p.x/100*r.width,r.top+p.y/100*r.height);
   return{x:r.left+p.x/100*r.width,y:r.top+p.y/100*r.height,target,history:history.length,top:top?.getAttribute?.('data-camera-look-map-path')!==null||top?.getAttribute?.('data-camera-look-map-path-hit')!==null};
  });
  assert.equal(lookInsertHit.top,true,'Look path should expose a wide double-click hit area');
  await page.mouse.click(lookInsertHit.x,lookInsertHit.y,{count:2,delay:45});
  await page.waitForFunction(()=>sec().sdCameraLookFrames.length===4);
  const insertedLookBrowser=await page.evaluate(()=>({frame:sec().sdCameraLookFrames.find(k=>![0,50,100].includes(k.at)),history:history.length}));
  assert.ok(insertedLookBrowser.frame&&!insertedLookBrowser.frame.targetId,'Dotted-path double click should create a manual look target');
  assert.ok(Math.abs(insertedLookBrowser.frame.at-25)<1);
  const expectedInsertedLook=await page.evaluate(at=>{
   const s=sec(),cfg=NAGWEB_SCROLL_CAMERA.config(s),originals=cfg.lookFrames.filter(k=>[0,50,100].includes(k.at));
   return NAGWEB_SCROLL_CAMERA.lookTarget({...cfg,lookFrames:originals},at/100,NAGWEB_STORY_MODEL,s.sdEase,{width:1000,height:1000});
  },insertedLookBrowser.frame.at);
  assert.ok(Math.hypot(insertedLookBrowser.frame.x-expectedInsertedLook.x,insertedLookBrowser.frame.y-expectedInsertedLook.y,insertedLookBrowser.frame.z-expectedInsertedLook.z)<.5,'Inserted look target should capture the original dotted-path pose');
  assert.equal(insertedLookBrowser.history,lookInsertHit.history+1);
  const insertedLookAt=insertedLookBrowser.frame.at;
  await page.click('[data-camera-look-delete="'+insertedLookAt+'"]');
  await page.waitForFunction(()=>sec().sdCameraLookFrames.length===3);
  assert.equal(await page.$eval('[data-camera-look-map-path]',n=>n.getAttribute('points')),lookPathBefore,'Deleting inserted look target restores original dotted path');
  await page.click('[data-camera-look-jump="50"]');
  await page.waitForFunction(()=>document.querySelector('[data-camera-look-field="x"][data-camera-look-at="50"]'));
  assert.equal(await page.$eval('[data-camera-look-field="x"][data-camera-look-at="50"]',n=>+n.value),1225);
  async function clickSpatialDot(selector){
   await page.$eval(selector,n=>n.closest('[data-camera-map]')?.scrollIntoView({block:'center',inline:'nearest'}));
   await new Promise(r=>setTimeout(r,40));
   const p=await page.$eval(selector,n=>{const map=n.closest('[data-camera-map]'),mr=map.getBoundingClientRect(),cx=+n.getAttribute('cx'),cy=+n.getAttribute('cy'),x=mr.left+cx/100*mr.width,y=mr.top+cy/100*mr.height,top=document.elementFromPoint(x,y);return{x,y,hit:!!top?.matches?.('[data-camera-map-dot],[data-camera-look-map-dot],[data-camera-map-point],[data-camera-look-map-point],[data-camera-position],[data-camera-look-position]'),top:top?.outerHTML?.slice(0,500)||String(top)};});
   assert.equal(p.hit,true,'Spatial key has no clickable hit target: '+JSON.stringify(p));
   await page.mouse.click(p.x,p.y);
  }
  await clickSpatialDot('[data-camera-map-dot="100"]');
  await page.waitForFunction(()=>document.querySelector('[data-camera-map-point="100"]'));
  assert.equal(await page.$eval('[data-camera-head]',n=>n.style.left),'100%');
  // Camera 100 and look 100 may overlap. A second click cycles to the other key.
  await clickSpatialDot('[data-camera-look-map-dot="100"]');
  await page.waitForFunction(()=>document.querySelector('[data-camera-look-map-point="100"]'));
  await clickSpatialDot('[data-camera-map-dot="50"]');
  await page.waitForFunction(()=>document.querySelector('[data-camera-map-point="50"]'));
  await clickSpatialDot('[data-camera-look-map-dot="50"]');
  await page.waitForFunction(()=>document.querySelector('[data-camera-look-map-point="50"]'));

  await page.evaluate(()=>{
   const html=generateSite(flattenPage(page()),false,false,false),f=document.createElement('iframe');
   f.id='camera-look-export';f.style.cssText='width:1000px;height:650px;border:0';f.srcdoc=html;document.body.append(f);
  });
  await page.waitForFunction(()=>document.querySelector('#camera-look-export')?.contentWindow?.__NAG_SCROLL_DIRECTOR?.['camera-browser-scene']);
  const lookRuntime=await page.evaluate(()=>{
   const f=document.querySelector('#camera-look-export'),w=f.contentWindow,d=f.contentDocument,api=w.__NAG_SCROLL_DIRECTOR['camera-browser-scene'];
   api.set(.5);
   const world=d.querySelector('.sc[data-id="camera-browser-scene"] .inner'),entries=['m11','m12','m13','m14','m21','m22','m23','m24','m31','m32','m33','m34','m41','m42','m43','m44'];
   const a=world.getAnimations().find(a=>a.playState==='paused'),raw=a?.effect?.getKeyframes?.()[0]?.transform||'none',actual=new w.DOMMatrix(raw);
   const probe=d.createElement('i');probe.style.transform='rotateZ(-5deg) rotateY(90deg) translate3d(-225px,-125px,100px)';d.body.append(probe);
   const expected=new w.DOMMatrix(w.getComputedStyle(probe).transform);probe.remove();
   return{raw,error:Math.max(...entries.map(k=>Math.abs(actual[k]-expected[k])))};
  });
  assert.ok(lookRuntime.error<.001,'Look-at runtime matrix mismatch: '+JSON.stringify(lookRuntime));

  // Selected look target is editable directly on the spatial map.
  await page.waitForFunction(()=>document.querySelector('[data-camera-look-map-point="50"]'));
  await page.focus('[data-camera-look-map-point="50"]');await page.keyboard.press('ArrowRight');
  let lookEdited=await page.evaluate(()=>sec().sdCameraLookFrames.find(k=>k.at===50));
  assert.equal(lookEdited.x,1250,'Look-map ArrowRight must move exactly 25px');
  await page.select('[data-camera-map-plane]','front');
  await page.waitForFunction(()=>document.querySelector('[data-camera-map]')?.dataset.plane==='front'&&document.querySelector('[data-camera-look-map-point="50"]'));
  await page.focus('[data-camera-look-map-point="50"]');await page.keyboard.press('ArrowDown');
  lookEdited=await page.evaluate(()=>sec().sdCameraLookFrames.find(k=>k.at===50));
  assert.equal(lookEdited.y,150,'Look-map ArrowDown must move exactly 25px');
  const axisStart=await page.evaluate(()=>({frame:{...sec().sdCameraLookFrames.find(k=>k.at===50)},history:history.length,box:(()=>{const r=document.querySelector('[data-camera-look-map-point="50"]').getBoundingClientRect();return{cx:r.left+r.width/2,cy:r.top+r.height/2};})()}));
  await page.mouse.move(axisStart.box.cx,axisStart.box.cy);await page.keyboard.down('Shift');await page.mouse.down();await page.mouse.move(axisStart.box.cx+34,axisStart.box.cy+12,{steps:3});await page.mouse.up();await page.keyboard.up('Shift');
  const axisEnd=await page.evaluate(()=>({frame:{...sec().sdCameraLookFrames.find(k=>k.at===50)},history:history.length}));
  assert.equal(axisEnd.frame.y,axisStart.frame.y,'Shift drag should lock look target to horizontal axis');
  assert.notEqual(axisEnd.frame.x,axisStart.frame.x);assert.equal(axisEnd.history,axisStart.history+1);
  const dragStart=await page.evaluate(()=>{
   const map=document.querySelector('[data-camera-map]'),point=document.querySelector('[data-camera-look-map-point="50"]'),mr=map.getBoundingClientRect(),pr=point.getBoundingClientRect(),k=sec().sdCameraLookFrames.find(k=>k.at===50);
   return{cx:pr.left+pr.width/2,cy:pr.top+pr.height/2,width:mr.width,height:mr.height,range:+map.dataset.range,frame:{...k},history:history.length};
  });
  const dx=28,dy=-18;
  await page.mouse.move(dragStart.cx,dragStart.cy);await page.mouse.down();await page.mouse.move(dragStart.cx+dx,dragStart.cy+dy,{steps:4});await page.mouse.up();
  const dragEnd=await page.evaluate(()=>({frame:{...sec().sdCameraLookFrames.find(k=>k.at===50)},history:history.length}));
  assert.equal(dragEnd.frame.x,Math.max(-4000,Math.min(4000,Math.round(dragStart.frame.x+dx/dragStart.width*dragStart.range*2))));
  assert.equal(dragEnd.frame.y,Math.max(-4000,Math.min(4000,Math.round(dragStart.frame.y+dy/dragStart.height*dragStart.range*2))));
  assert.equal(dragEnd.frame.z,dragStart.frame.z);assert.equal(dragEnd.history,dragStart.history+1,'Look-map drag should create one undo snapshot');
  const cancelStart=await page.evaluate(()=>({frame:JSON.stringify(sec().sdCameraLookFrames),history:history.length}));
  const cancelBox=await page.$eval('[data-camera-look-map-point="50"]',n=>{const r=n.getBoundingClientRect();return{cx:r.left+r.width/2,cy:r.top+r.height/2};});
  await page.mouse.move(cancelBox.cx,cancelBox.cy);await page.mouse.down();await page.mouse.move(cancelBox.cx-35,cancelBox.cy+25,{steps:3});await page.keyboard.press('Escape');await page.mouse.up();
  const cancelEnd=await page.evaluate(()=>({frame:JSON.stringify(sec().sdCameraLookFrames),history:history.length}));
  assert.equal(cancelEnd.frame,cancelStart.frame,'Escape must cancel look target drag');assert.equal(cancelEnd.history,cancelStart.history);

  // "Mirar elemento": bind both look keys to a free-layout element and prove
  // exported camera orientation follows that element's Director X/Y/Z motion.
  await page.evaluate(()=>{
   const s=sec();
   s.layout='free';s.sdCameraPathMode='linear';s.sdCameraOrientationMode='lookAt';s.sdCameraLookPathMode='linear';
   s.sdCameraResponsive=true;s.sdCameraReferenceWidth=1000;s.sdPerspective=1000;s.sdEase='linear';
   s.sdCameraFrames=[
    {at:0,x:0,y:0,z:0,rotateX:0,rotateY:0,rotate:0,ease:'linear'},
    {at:100,x:0,y:0,z:0,rotateX:0,rotateY:0,rotate:0,ease:'linear'}
   ];
   s.sdCameraLookFrames=[
    {at:0,x:0,y:0,z:1000,ease:'linear'},
    {at:100,x:0,y:0,z:1000,ease:'linear'}
   ];
   s.elements=[
    mkEl('heading',{id:'camera-target-el',text:'Objetivo móvil',x:75,y:50,w:20,anim:'none',sdCameraDepth:500,
      sdKeyframes:[{at:0,x:0,y:0,z:0,ease:'linear'},{at:100,x:100,y:0,z:100,ease:'linear'}]})
   ];
   curEl=0;selection=[];secFocus=true;saveProject();renderScenes();renderPane();renderPreview();
  });
  await page.waitForFunction(()=>document.querySelector('[data-camera-look-jump="0"]')&&document.querySelector('[data-camera-look-target]'));
  await page.click('[data-camera-look-jump="0"]');
  await page.waitForFunction(()=>document.querySelector('[data-camera-look-target]')?.dataset.cameraLookAt==='0');
  await page.select('[data-camera-look-target]','camera-target-el');
  await page.waitForFunction(()=>sec().sdCameraLookFrames.find(k=>k.at===0)?.targetId==='camera-target-el');
  await page.click('[data-camera-look-jump="100"]');
  await page.waitForFunction(()=>document.querySelector('[data-camera-look-target]')?.dataset.cameraLookAt==='100');
  await page.select('[data-camera-look-target]','camera-target-el');
  await page.waitForFunction(()=>sec().sdCameraLookFrames.every(k=>k.targetId==='camera-target-el'));

  await page.select('[data-camera-map-plane]','top');
  await capture('map-look-target-fov');
  const targetUi=await page.evaluate(()=>({
   bound:sec().sdCameraLookFrames.map(k=>k.targetId),
   xyzFields:document.querySelectorAll('[data-camera-look-field="x"],[data-camera-look-field="y"],[data-camera-look-field="z"]').length,
   linkedMapDisabled:!!document.querySelector('[data-camera-look-map-point][disabled]'),
   optionText:Array.from(document.querySelectorAll('[data-camera-look-target] option')).map(o=>o.textContent)
  }));
  assert.deepEqual(targetUi.bound,['camera-target-el','camera-target-el']);
  assert.equal(targetUi.xyzFields,0,'Linked look target should hide manual XYZ fields');
  assert.equal(targetUi.linkedMapDisabled,true,'Linked map target should not be manually draggable');
  assert.ok(targetUi.optionText.some(t=>t.includes('Objetivo móvil')),'Target selector should expose the element by a readable label');

  await page.evaluate(()=>{
   const html=generateSite(flattenPage(page()),false,false,false),f=document.createElement('iframe');
   f.id='camera-target-export';f.style.cssText='width:1000px;height:650px;border:0';f.srcdoc=html;document.body.append(f);
  });
  await page.waitForFunction(()=>document.querySelector('#camera-target-export')?.contentWindow?.__NAG_SCROLL_DIRECTOR?.['camera-browser-scene']);

  const targetRuntime=await page.evaluate(()=>{
   const f=document.querySelector('#camera-target-export'),w=f.contentWindow,d=f.contentDocument,api=w.__NAG_SCROLL_DIRECTOR['camera-browser-scene'];
   const scene=d.querySelector('.sc[data-id="camera-browser-scene"]'),stage=scene.querySelector('.nw-sd-stage'),world=scene.querySelector('.inner');
   const entries=['m11','m12','m13','m14','m21','m22','m23','m24','m31','m32','m33','m34','m41','m42','m43','m44'];
   function actual(){
    const a=world.getAnimations().find(a=>a.playState==='paused'),raw=a?.effect?.getKeyframes?.()[0]?.transform||'none';
    return {raw,m:new w.DOMMatrix(raw)};
   }
   function expected(progress){
    const scale=Math.min(1,stage.clientWidth/1000),rw=stage.clientWidth/Math.max(.0001,scale);
    const targetX=.25*rw+100*progress,targetZ=500+100*progress;
    const yaw=Math.atan2(-targetX,targetZ)*180/Math.PI;
    const probe=d.createElement('i');probe.style.transform='rotateY('+(-yaw)+'deg) translate3d(0px,0px,0px)';d.body.append(probe);
    const m=new w.DOMMatrix(w.getComputedStyle(probe).transform);probe.remove();
    return {m,yaw,targetX,targetZ,scale,rw};
   }
   function err(a,b){return Math.max(...entries.map(k=>Math.abs(a[k]-b[k])));}
   api.set(0);const a0=actual(),e0=expected(0);
   api.set(.5);const a50=actual(),e50=expected(.5);
   return{
    width:stage.clientWidth,
    startError:err(a0.m,e0.m),midError:err(a50.m,e50.m),
    startYaw:e0.yaw,midYaw:e50.yaw,
    startRaw:a0.raw,midRaw:a50.raw,
    refWidth:e50.rw,targetX:e50.targetX,targetZ:e50.targetZ
   };
  });
  assert.ok(targetRuntime.startError<.001,'Element target start matrix mismatch: '+JSON.stringify(targetRuntime));
  assert.ok(targetRuntime.midError<.001,'Element target mid matrix mismatch: '+JSON.stringify(targetRuntime));
  assert.ok(Math.abs(targetRuntime.midYaw-targetRuntime.startYaw)>.25,'Camera yaw should react to target Director motion: '+JSON.stringify(targetRuntime));

  await page.$eval('#camera-target-export',n=>{n.style.width='500px';});
  await page.evaluate(()=>document.querySelector('#camera-target-export').contentWindow.dispatchEvent(new Event('resize')));
  await new Promise(r=>setTimeout(r,120));
  const targetMobile=await page.evaluate(()=>{
   const f=document.querySelector('#camera-target-export'),w=f.contentWindow,d=f.contentDocument,api=w.__NAG_SCROLL_DIRECTOR['camera-browser-scene'];
   const scene=d.querySelector('.sc[data-id="camera-browser-scene"]'),stage=scene.querySelector('.nw-sd-stage'),world=scene.querySelector('.inner');
   api.set(.5);
   const a=world.getAnimations().find(a=>a.playState==='paused'),raw=a?.effect?.getKeyframes?.()[0]?.transform||'none',actual=new w.DOMMatrix(raw);
   const scale=Math.min(1,stage.clientWidth/1000),rw=stage.clientWidth/Math.max(.0001,scale),targetX=.25*rw+50,targetZ=550,yaw=Math.atan2(-targetX,targetZ)*180/Math.PI;
   const probe=d.createElement('i');probe.style.transform='rotateY('+(-yaw)+'deg) translate3d(0px,0px,0px)';d.body.append(probe);
   const expected=new w.DOMMatrix(w.getComputedStyle(probe).transform);probe.remove();
   const keys=['m11','m12','m13','m14','m21','m22','m23','m24','m31','m32','m33','m34','m41','m42','m43','m44'];
   return{width:stage.clientWidth,scale,rw,yaw,raw,error:Math.max(...keys.map(k=>Math.abs(actual[k]-expected[k])))};
  });
  assert.ok(targetMobile.scale<.55&&targetMobile.scale>.45,'Element target mobile scale mismatch: '+JSON.stringify(targetMobile));
  assert.ok(targetMobile.error<.001,'Element target responsive matrix mismatch: '+JSON.stringify(targetMobile));
  assert.ok(Math.abs(targetMobile.yaw-targetRuntime.midYaw)<.001,'Responsive camera should preserve look direction in reference coordinates');

  fs.mkdirSync(visuals,{recursive:true});
  await page.screenshot({path:visuals+'/camera-editor.png',fullPage:true});
  const exportElement=await page.$('#camera-browser-export');
  await exportElement.screenshot({path:visuals+'/camera-export-mobile.png'});
  await page.$eval('#camera-browser-export',n=>{n.style.width='1000px';});
  await page.evaluate(()=>document.querySelector('#camera-browser-export').contentWindow.dispatchEvent(new Event('resize')));
  await new Promise(r=>setTimeout(r,80));
  await exportElement.screenshot({path:visuals+'/camera-export.png'});
  const lookExport=await page.$('#camera-look-export');await lookExport.screenshot({path:visuals+'/camera-lookat.png'});
  const targetExport=await page.$('#camera-target-export');await targetExport.screenshot({path:visuals+'/camera-target-element.png'});
  console.log('Camera browser: mapa real, teclado, runtime exportado, resize mobile, look-at independiente, objetivo por elemento, stack absoluto, perspectiva 2.5D y puente de anclas 3D OK');
 }finally{
  await page.evaluate(previous=>{
   document.getElementById('camera-browser-export')?.remove();document.getElementById('camera-look-export')?.remove();document.getElementById('camera-target-export')?.remove();clearTimeout(previewTimer);project=JSON.parse(previous.project);
   curPage=previous.curPage;curSec=previous.curSec;curEl=previous.curEl;curPane=previous.curPane;selection=previous.selection;secFocus=previous.secFocus;
   history=[];future=[];saveProject();renderScenes();renderPane();renderPreview();
  },previous);
 }
}
