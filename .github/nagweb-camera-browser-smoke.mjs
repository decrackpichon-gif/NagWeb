import assert from 'node:assert/strict';
import fs from 'node:fs';

export async function runCameraBrowserSmoke(page){
 const previous=await page.evaluate(()=>({project:JSON.stringify(project),curPage,curSec,curEl,curPane,selection,secFocus}));
 try{
  await page.evaluate(()=>{
   const s=JSON.parse(JSON.stringify(sec()));
   s.id='camera-browser-scene';s.layout='stack';s.sdEnabled=true;s.sdCameraEnabled=true;s.sdCameraResponsive=true;s.sdCameraReferenceWidth=1000;s.sdEase='linear';s.sdLength=320;s.sdPerspective=1000;s.stType='cut';
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
   seek:document.querySelector('[data-camera-seek]')?.value
  }));
  assert.equal(ui.markers,3);assert.equal(ui.dots,3);assert.equal(ui.plane,'top');assert.equal(ui.head,'50%');assert.equal(+ui.seek,50);
  assert.ok(ui.label.includes('50%')&&ui.label.includes('X 200')&&ui.label.includes('Y 100')&&ui.label.includes('Z 100'));
  assert.ok((await page.$eval('[data-camera-map-box]',n=>n.textContent)).includes('ancho de referencia'));

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
   const worldA=matrixFromAnimation(world),groupA=matrixFromAnimation(group),childA=matrixFromAnimation(child);
   const worldE=matrixFromTransform('rotateZ(-5deg) rotateY(-20deg) rotateX(-10deg) translate3d(-225px,-125px,100px)');
   const groupE=matrixFromTransform('translateZ(-300px) rotateX(0deg) rotateY(0deg)');
   const childE=matrixFromTransform('translateZ(50px) rotateX(10deg) rotateY(-15deg)');
   return{
    groupInWorld:group.parentNode===world,
    childInGroup:child.parentNode===group,
    groupStyle:w.getComputedStyle(group).transformStyle,
    authoredLeft:group.style.left,
    worldError:error(worldA.matrix,worldE),
    groupError:error(groupA.matrix,groupE),
    childError:error(childA.matrix,childE),
    childRaw:childA.raw,
    perspective:w.getComputedStyle(scene.querySelector('.nw-sd-stage')).perspective
   };
  });
  assert.equal(runtime.groupInWorld,true);assert.equal(runtime.childInGroup,true);assert.equal(runtime.groupStyle,'preserve-3d');
  assert.ok(runtime.worldError<.001,'Camera matrix mismatch: '+JSON.stringify(runtime));
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
  assert.equal(savedResponsive.frame.rotateX,10);assert.equal(savedResponsive.frame.rotateY,20);assert.equal(savedResponsive.frame.rotate,5);

  fs.mkdirSync('/tmp/nagweb-camera-visuals',{recursive:true});
  await page.screenshot({path:'/tmp/nagweb-camera-visuals/camera-editor.png',fullPage:true});
  const exportElement=await page.$('#camera-browser-export');
  await exportElement.screenshot({path:'/tmp/nagweb-camera-visuals/camera-export-mobile.png'});
  await page.$eval('#camera-browser-export',n=>{n.style.width='1000px';});
  await page.evaluate(()=>document.querySelector('#camera-browser-export').contentWindow.dispatchEvent(new Event('resize')));
  await new Promise(r=>setTimeout(r,80));
  await exportElement.screenshot({path:'/tmp/nagweb-camera-visuals/camera-export.png'});
  console.log('Camera browser: mapa real, teclado, runtime exportado, resize mobile, stack absoluto y perspectiva 2.5D compartida OK');
 }finally{
  await page.evaluate(previous=>{
   document.getElementById('camera-browser-export')?.remove();clearTimeout(previewTimer);project=JSON.parse(previous.project);
   curPage=previous.curPage;curSec=previous.curSec;curEl=previous.curEl;curPane=previous.curPane;selection=previous.selection;secFocus=previous.secFocus;
   history=[];future=[];saveProject();renderScenes();renderPane();renderPreview();
  },previous);
 }
}
