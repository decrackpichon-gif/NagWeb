import assert from 'node:assert/strict';
import fs from 'node:fs';

export async function runCameraBrowserSmoke(page){
 const previous=await page.evaluate(()=>({project:JSON.stringify(project),curPage,curSec,curEl,curPane,selection,secFocus}));
 try{
  await page.evaluate(()=>{
   const s=JSON.parse(JSON.stringify(sec()));
   s.id='camera-browser-scene';s.layout='stack';s.sdEnabled=true;s.sdCameraEnabled=true;s.sdEase='linear';s.sdLength=320;s.sdPerspective=1000;s.stType='cut';
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
   const frame=a=>a?.effect?.getKeyframes?.()[0]?.transform||'';
   return{
    groupInWorld:group.parentNode===world,
    childInGroup:child.parentNode===group,
    groupStyle:getComputedStyle(group).transformStyle,
    authoredLeft:group.style.left,
    worldTransform:frame(world.getAnimations().find(a=>a.playState==='paused')),
    groupTransform:frame(group.getAnimations().find(a=>a.playState==='paused')),
    childTransform:frame(child.getAnimations().find(a=>a.playState==='paused')),
    perspective:getComputedStyle(scene.querySelector('.nw-sd-stage')).perspective
   };
  });
  assert.equal(runtime.groupInWorld,true);assert.equal(runtime.childInGroup,true);assert.equal(runtime.groupStyle,'preserve-3d');
  assert.ok(runtime.worldTransform.includes('rotateY(-20deg)')&&runtime.worldTransform.includes('translate3d(-225px,-125px,100px)'));
  assert.ok(runtime.groupTransform.includes('translateZ(-300.000px)'));
  assert.ok(runtime.childTransform.includes('translateZ(50.000px)')&&runtime.childTransform.includes('rotateX(10.000deg)')&&runtime.childTransform.includes('rotateY(-15.000deg)'));
  assert.ok(!runtime.childTransform.includes('perspective('),'Nested child must reuse shared camera perspective');
  assert.equal(runtime.perspective,'1000px');

  fs.mkdirSync('/tmp/nagweb-camera-visuals',{recursive:true});
  await page.screenshot({path:'/tmp/nagweb-camera-visuals/camera-editor.png',fullPage:true});
  const exportFrame=await (await page.$('#camera-browser-export')).contentFrame();
  await exportFrame.screenshot({path:'/tmp/nagweb-camera-visuals/camera-export.png'});
  console.log('Camera browser: mapa real, teclado, runtime exportado, stack absoluto y perspectiva 2.5D compartida OK');
 }finally{
  await page.evaluate(previous=>{
   document.getElementById('camera-browser-export')?.remove();clearTimeout(previewTimer);project=JSON.parse(previous.project);
   curPage=previous.curPage;curSec=previous.curSec;curEl=previous.curEl;curPane=previous.curPane;selection=previous.selection;secFocus=previous.secFocus;
   history=[];future=[];saveProject();renderScenes();renderPane();renderPreview();
  },previous);
 }
}
