import assert from 'node:assert/strict';
import fs from 'node:fs';

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
   const h=document.querySelector('[data-camera-tangent-handle]'),k=document.querySelector('[data-camera-map-dot="50"]');
   return{exists:!!h,hx:+h?.getAttribute('cx'),hy:+h?.getAttribute('cy'),kx:+k?.getAttribute('cx'),ky:+k?.getAttribute('cy')};
  });
  assert.equal(tangentBefore.exists,true);assert.ok(Math.hypot(tangentBefore.hx-tangentBefore.kx,tangentBefore.hy-tangentBefore.ky)>.1,'0% tension should show a visible outgoing tangent');
  assert.equal(await page.$eval('[data-camera-field="tension"][data-camera-at="50"]',n=>+n.value),0);
  await page.$eval('[data-camera-tension-handle]',n=>n.scrollIntoView({block:'center'}));
  const tensionDragStart=await page.evaluate(()=>{
   const h=document.querySelector('[data-camera-tension-handle]').getBoundingClientRect(),k=document.querySelector('[data-camera-map-point="50"]').getBoundingClientRect();
   return{hx:h.left+h.width/2,hy:h.top+h.height/2,kx:k.left+k.width/2,ky:k.top+k.height/2,history:history.length};
  });
  await page.mouse.move(tensionDragStart.hx,tensionDragStart.hy);await page.mouse.down();
  await page.mouse.move((tensionDragStart.hx+tensionDragStart.kx)/2,(tensionDragStart.hy+tensionDragStart.ky)/2,{steps:4});await page.mouse.up();
  const tensionDragEnd=await page.evaluate(()=>({value:sec().sdCameraFrames.find(k=>k.at===50).tension,history:history.length}));
  assert.ok(tensionDragEnd.value>=45&&tensionDragEnd.value<=55,'Half-length tangent drag should produce about +50 tension: '+JSON.stringify(tensionDragEnd));
  assert.equal(tensionDragEnd.history,tensionDragStart.history+1,'Tangent drag should create one undo snapshot');
  const tensionCancelStart=await page.evaluate(()=>({value:sec().sdCameraFrames.find(k=>k.at===50).tension,history:history.length}));
  const tensionBox=await page.$eval('[data-camera-tension-handle]',n=>{const r=n.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};});
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
   const h=document.querySelector('[data-camera-tangent-handle]'),k=document.querySelector('[data-camera-map-dot="50"]');
   return{hx:+h?.getAttribute('cx'),hy:+h?.getAttribute('cy'),kx:+k?.getAttribute('cx'),ky:+k?.getAttribute('cy')};
  });
  assert.ok(Math.hypot(tangentAfter.hx-tangentAfter.kx,tangentAfter.hy-tangentAfter.ky)<.001,'+100% tension should retract the tangent preview onto the selected key');
  await page.select('[data-camera-path-mode]','linear');
  await page.waitForFunction(()=>!document.querySelector('[data-camera-field="tension"]')&&!document.querySelector('[data-camera-tangent-handle]'));
  await page.select('[data-camera-path-mode]','smooth');
  await page.waitForFunction(()=>document.querySelector('[data-camera-field="tension"][data-camera-at="50"]')&&document.querySelector('[data-camera-tangent-handle]'));
  assert.equal(await page.$eval('[data-camera-field="tension"][data-camera-at="50"]',n=>+n.value),100,'Tension survives temporary linear mode');

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

  fs.mkdirSync('/tmp/nagweb-camera-visuals',{recursive:true});
  await page.screenshot({path:'/tmp/nagweb-camera-visuals/camera-editor.png',fullPage:true});
  const exportElement=await page.$('#camera-browser-export');
  await exportElement.screenshot({path:'/tmp/nagweb-camera-visuals/camera-export-mobile.png'});
  await page.$eval('#camera-browser-export',n=>{n.style.width='1000px';});
  await page.evaluate(()=>document.querySelector('#camera-browser-export').contentWindow.dispatchEvent(new Event('resize')));
  await new Promise(r=>setTimeout(r,80));
  await exportElement.screenshot({path:'/tmp/nagweb-camera-visuals/camera-export.png'});
  const lookExport=await page.$('#camera-look-export');await lookExport.screenshot({path:'/tmp/nagweb-camera-visuals/camera-lookat.png'});
  const targetExport=await page.$('#camera-target-export');await targetExport.screenshot({path:'/tmp/nagweb-camera-visuals/camera-target-element.png'});
  console.log('Camera browser: mapa real, teclado, runtime exportado, resize mobile, look-at independiente, objetivo por elemento, stack absoluto, perspectiva 2.5D y puente de anclas 3D OK');
 }finally{
  await page.evaluate(previous=>{
   document.getElementById('camera-browser-export')?.remove();document.getElementById('camera-look-export')?.remove();document.getElementById('camera-target-export')?.remove();clearTimeout(previewTimer);project=JSON.parse(previous.project);
   curPage=previous.curPage;curSec=previous.curSec;curEl=previous.curEl;curPane=previous.curPane;selection=previous.selection;secFocus=previous.secFocus;
   history=[];future=[];saveProject();renderScenes();renderPane();renderPreview();
  },previous);
 }
}
