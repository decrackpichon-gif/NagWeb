import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const exe=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!exe)throw new Error('No Chromium/Chrome');
const browser=await puppeteer.launch({headless:true,executablePath:exe,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
try{
 const page=await browser.newPage();await page.setViewport({width:1600,height:920,deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(String(e&&e.stack||e)));
 await page.goto('http://127.0.0.1:4173/experiments/scene-composer-v1.html',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>window.__NAGWEB_SCENE_COMPOSER__?.renderer&&window.__NAGWEB_SCENE_COMPOSER__?.field,{timeout:15000});
 let state=await page.evaluate(()=>({scene:NAGWEB_SCENE_COMPOSER.version,influence:NAGWEB_INTERACTION_INFLUENCE.version,v4:NAGWEB_ORGANIC_ADAPTIVE_CURVE.version,count:__NAGWEB_SCENE_COMPOSER__.scene.elements.length,targets:__NAGWEB_SCENE_COMPOSER__.field.targetCount}));
 assert.equal(state.scene,'1.0.0-alpha.1');assert.equal(state.influence,'1.7.0');assert.equal(state.v4,'4.3.1-alpha.1');assert.equal(state.count,3);assert.equal(state.targets,3);

 // Editing/selecting must retain both the target DOM node and the active field instance.
 let persistent=await page.evaluate(()=>{
   const api=window.__NAGWEB_SCENE_COMPOSER__;
   const node=document.querySelector('[data-scene-id="scene-text-1"]');
   window.__composerTest={field:api.field,node};
   node.style.translate='13px 7px';
   api.view.setSelected('scene-text-1');
   return {field:window.__composerTest.field===api.field,node:window.__composerTest.node===document.querySelector('[data-scene-id="scene-text-1"]'),translate:node.style.translate};
 });
 assert.equal(persistent.field,true,'select must keep the influence field instance');
 assert.equal(persistent.node,true,'select must keep the target node');
 assert.equal(persistent.translate,'13px 7px','select must not reset inline motion');

 await page.$eval('#weight',el=>{el.value='1.5';el.dispatchEvent(new Event('input',{bubbles:true}));});
 persistent=await page.evaluate(()=>{
   const api=window.__NAGWEB_SCENE_COMPOSER__;
   return {field:window.__composerTest.field===api.field,node:window.__composerTest.node===document.querySelector('[data-scene-id="scene-text-1"]'),weight:api.field.getTargetWeight('scene-text-1')};
 });
 assert.equal(persistent.field,true,'editing a target must keep the field');
 assert.equal(persistent.node,true,'editing a target must keep its node');
 assert.equal(persistent.weight,1.5,'target attributes must synchronize without recreation');


 await page.click('.add[data-type="text"]');await new Promise(r=>setTimeout(r,80));
 state=await page.evaluate(()=>({count:__NAGWEB_SCENE_COMPOSER__.scene.elements.length,selected:__NAGWEB_SCENE_COMPOSER__.view.selected,type:__NAGWEB_SCENE_COMPOSER__.scene.elements.find(e=>e.id===__NAGWEB_SCENE_COMPOSER__.view.selected)?.type}));
 assert.equal(state.count,4);assert.equal(state.type,'text');
 assert.equal(await page.evaluate(()=>window.__composerTest.field===__NAGWEB_SCENE_COMPOSER__.field),true,'adding should keep active influence field');
 assert.equal(await page.evaluate(()=>window.__composerTest.node===document.querySelector('[data-scene-id="scene-text-1"]')),true,'adding should keep existing DOM targets');


 await page.$eval('#content',el=>{el.value='Texto del usuario';el.dispatchEvent(new Event('input',{bubbles:true}));});await new Promise(r=>setTimeout(r,80));
 assert.equal(await page.evaluate(()=>__NAGWEB_SCENE_COMPOSER__.scene.elements.find(e=>e.id===__NAGWEB_SCENE_COMPOSER__.view.selected).content),'Texto del usuario');

 await page.$eval('#zIndex',el=>{el.value='32';el.dispatchEvent(new Event('change',{bubbles:true}));});
 await page.$eval('#opacity',el=>{el.value='.65';el.dispatchEvent(new Event('change',{bubbles:true}));});await new Promise(r=>setTimeout(r,80));
 let visual=await page.evaluate(()=>{const e=__NAGWEB_SCENE_COMPOSER__.scene.elements.find(e=>e.id===__NAGWEB_SCENE_COMPOSER__.view.selected);return {z:e.zIndex,opacity:e.opacity}});
 assert.equal(visual.z,32);assert.equal(visual.opacity,.65);
 await page.$eval('#radiusScale',el=>{el.value='1.75';el.dispatchEvent(new Event('input',{bubbles:true}));});await new Promise(r=>setTimeout(r,80));
 let per=await page.evaluate(()=>({radius:__NAGWEB_SCENE_COMPOSER__.scene.elements.find(e=>e.id===__NAGWEB_SCENE_COMPOSER__.view.selected).interaction.radiusScale,field:__NAGWEB_SCENE_COMPOSER__.field.targetRadiusScales}));
 assert.equal(per.radius,1.75);assert.ok(per.field.includes(1.75));

 const beforeTargets=await page.evaluate(()=>__NAGWEB_SCENE_COMPOSER__.field.targetCount);
 await page.click('#reacts');await new Promise(r=>setTimeout(r,80));
 assert.equal(await page.evaluate(()=>__NAGWEB_SCENE_COMPOSER__.field.targetCount),beforeTargets-1);
 assert.equal(await page.evaluate(()=>window.__composerTest.field===__NAGWEB_SCENE_COMPOSER__.field),true,'disabling one target must not reset the field');

 await page.click('#reacts');await new Promise(r=>setTimeout(r,80));

 const id=await page.evaluate(()=>__NAGWEB_SCENE_COMPOSER__.view.selected);
 const box=await page.$eval('[data-scene-id="'+id+'"]',el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y};});
 const before=await page.evaluate(id=>{const e=__NAGWEB_SCENE_COMPOSER__.scene.elements.find(x=>x.id===id);return {x:e.x,y:e.y}},id);
 await page.mouse.move(box.x+10,box.y+10);await page.mouse.down();await page.mouse.move(box.x+90,box.y+60,{steps:6});await page.mouse.up();await new Promise(r=>setTimeout(r,100));
 const after=await page.evaluate(id=>{const e=__NAGWEB_SCENE_COMPOSER__.scene.elements.find(x=>x.id===id);return {x:e.x,y:e.y}},id);
 assert.ok(Math.hypot(after.x-before.x,after.y-before.y)>40,'drag should move scene element');


 // Mouse handles let users resize/rotate on the canvas without resetting physics.
 // Keep the character away from the selected item while checking the pointer handles.
 await page.evaluate(()=>__NAGWEB_SCENE_COMPOSER__.follower.setTarget(1080,710,'area'));
 await new Promise(r=>setTimeout(r,250));
 const rectBefore=await page.evaluate(id=>{const e=__NAGWEB_SCENE_COMPOSER__.scene.elements.find(x=>x.id===id);return {width:e.width,height:e.height,rotation:e.rotation};},id);
 const resizeRect=await page.$eval('.item.sel .resize-handle',el=>{const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});
 await page.mouse.move(resizeRect.x,resizeRect.y);
 await page.mouse.down();
 await page.mouse.move(resizeRect.x+86,resizeRect.y+44,{steps:8});
 await page.mouse.up();
 await new Promise(r=>setTimeout(r,120));
 const resized=await page.evaluate(id=>{const e=__NAGWEB_SCENE_COMPOSER__.scene.elements.find(x=>x.id===id);return {width:e.width,height:e.height,fieldStable:__NAGWEB_SCENE_COMPOSER__.field===__composerTest.field};},id);
 assert.ok(resized.width>rectBefore.width+60&&resized.height>rectBefore.height+25,'resize handle should change dimensions directly: '+JSON.stringify({before:rectBefore,after:resized,handle:resizeRect}));
 assert.equal(resized.fieldStable,true,'resize must not rebuild influence field');
 assert.equal(await page.$eval('#width',e=>Number(e.value)),resized.width,'inspector width should match pointer resize');
 const rotateRect=await page.$eval('.item.sel .rotate-handle',el=>{const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});
 await page.mouse.move(rotateRect.x,rotateRect.y);
 await page.mouse.down();
 await page.mouse.move(rotateRect.x+150,rotateRect.y+48,{steps:8});
 await page.mouse.up();
 await new Promise(r=>setTimeout(r,120));
 const rotated=await page.evaluate(id=>__NAGWEB_SCENE_COMPOSER__.scene.elements.find(x=>x.id===id).rotation,id);
 assert.ok(Math.abs(rotated-rectBefore.rotation)>10,'rotate handle should change angle directly');
 assert.equal(await page.$eval('#rotation',e=>Number(e.value)),rotated,'inspector rotation should track pointer rotation');
 await page.click('#locked');
 assert.equal(await page.$eval('.item.sel',n=>!!n.querySelector('.resize-handle')),false,'locking hides handles');
 const lockedBefore=await page.evaluate(id=>{const e=__NAGWEB_SCENE_COMPOSER__.scene.elements.find(x=>x.id===id);return {x:e.x,y:e.y};},id);
 const lockedRect=await page.$eval('.item.sel',el=>{const r=el.getBoundingClientRect();return {x:r.x+30,y:r.y+30};});
 await page.mouse.move(lockedRect.x,lockedRect.y);
 await page.mouse.down();
 await page.mouse.move(lockedRect.x+75,lockedRect.y+55,{steps:7});
 await page.mouse.up();
 const lockedAfter=await page.evaluate(id=>{const e=__NAGWEB_SCENE_COMPOSER__.scene.elements.find(x=>x.id===id);return {x:e.x,y:e.y,locked:e.locked};},id);
 assert.deepEqual({x:lockedAfter.x,y:lockedAfter.y},lockedBefore,'locked elements should ignore drag gestures');
 assert.equal(lockedAfter.locked,true);
 await page.click('#locked');
 assert.equal(await page.$eval('.item.sel',n=>!!n.querySelector('.resize-handle')),true,'unlocking restores the resize handle');

 await page.click('#duplicate');await new Promise(r=>setTimeout(r,80));
 assert.equal(await page.evaluate(()=>__NAGWEB_SCENE_COMPOSER__.scene.elements.length),5);

 await page.click('#exportScene');const json=await page.$eval('#sceneJson',el=>el.value);assert.ok(json.includes('nagweb-scene-composer'));
 await page.click('#applyScene');await new Promise(r=>setTimeout(r,80));assert.equal(await page.evaluate(()=>__NAGWEB_SCENE_COMPOSER__.scene.elements.length),5);


 // Viewport transforms are presentation only: scene coordinates and schema remain stable.
 const viewportStart=await page.evaluate(()=>({json:NAGWEB_SCENE_COMPOSER.serialize(__NAGWEB_SCENE_COMPOSER__.scene),field:__NAGWEB_SCENE_COMPOSER__.field,zoom:__NAGWEB_SCENE_COMPOSER__.zoom}));
 assert.equal(viewportStart.zoom,1);
 await page.click('#zoomOut');
 const firstZoom=await page.evaluate(()=>({zoom:__NAGWEB_SCENE_COMPOSER__.zoom,stageWidth:document.querySelector('#stage').getBoundingClientRect().width,spaceWidth:document.querySelector('#stageSpace').getBoundingClientRect().width,json:NAGWEB_SCENE_COMPOSER.serialize(__NAGWEB_SCENE_COMPOSER__.scene),fieldStable:__NAGWEB_SCENE_COMPOSER__.field===__composerTest.field}));
 assert.equal(firstZoom.zoom,.75);
 assert.ok(Math.abs(firstZoom.stageWidth-900)<1);
 assert.ok(Math.abs(firstZoom.spaceWidth-firstZoom.stageWidth)<1);
 assert.equal(firstZoom.json,viewportStart.json,'zoom should not mutate the scene JSON');
 assert.equal(firstZoom.fieldStable,true,'zoom should preserve influence physics instance');
 // A 75 px cursor movement at 75% zoom translates to approximately 100 scene units.
 const zoomId=await page.evaluate(()=>__NAGWEB_SCENE_COMPOSER__.view.selected);
 const zoomBefore=await page.evaluate(id=>{const el=__NAGWEB_SCENE_COMPOSER__.scene.elements.find(x=>x.id===id);return {x:el.x,y:el.y};},zoomId);
 const zoomRect=await page.$eval('.item.sel',el=>{const r=el.getBoundingClientRect();return {x:r.x+20,y:r.y+20};});
 await page.mouse.move(zoomRect.x,zoomRect.y);await page.mouse.down();
 await page.mouse.move(zoomRect.x+75,zoomRect.y+37.5,{steps:7});await page.mouse.up();
 const zoomAfter=await page.evaluate(id=>{const el=__NAGWEB_SCENE_COMPOSER__.scene.elements.find(x=>x.id===id);return {x:el.x,y:el.y};},zoomId);
 assert.ok(Math.abs(zoomAfter.x-zoomBefore.x-100)<=3,'drag must compensate viewport zoom');
 assert.ok(Math.abs(zoomAfter.y-zoomBefore.y-50)<=3,'vertical drag must compensate viewport zoom');
 await page.click('#zoomActual');
 await page.click('#zoomIn');
 const beforePan=await page.evaluate(()=>({scroll:document.querySelector('#work').scrollLeft,selected:__NAGWEB_SCENE_COMPOSER__.view.selected}));
 const canvasBox=await page.$eval('#work',el=>{const r=el.getBoundingClientRect();return {x:r.left+650,y:r.top+390};});
 await page.keyboard.down('Space');
 await page.mouse.move(canvasBox.x,canvasBox.y);await page.mouse.down();
 await page.mouse.move(canvasBox.x-140,canvasBox.y,{steps:7});await page.mouse.up();
 await page.keyboard.up('Space');
 const afterPan=await page.evaluate(()=>({scroll:document.querySelector('#work').scrollLeft,selected:__NAGWEB_SCENE_COMPOSER__.view.selected}));
 assert.ok(afterPan.scroll>beforePan.scroll+75,'holding Space and dragging pans viewport');
 assert.equal(afterPan.selected,beforePan.selected,'panning must not change selection');
 await page.click('#zoomFit');
 assert.ok(await page.evaluate(()=>__NAGWEB_SCENE_COMPOSER__.zoom<1),'fit scales the 1200px stage to visible workspace');
 await page.click('#zoomActual');
 assert.equal(await page.evaluate(()=>__NAGWEB_SCENE_COMPOSER__.zoom),1);

 const stage=await page.$eval('#stage',el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y}});
 await page.mouse.move(stage.x+300,stage.y+200,{steps:8});await new Promise(r=>setTimeout(r,500));
 const moved=await page.$$eval('.item[data-reactive="1"]',els=>els.some(el=>el.style.translate&&el.style.translate!=='0.00px 0.00px'));
 assert.equal(moved,true,'at least one scene object should react to character');
 assert.equal(errors.length,0,errors.join('\n'));
 fs.mkdirSync('/tmp/nagweb-interaction-experimental',{recursive:true});await page.screenshot({path:'/tmp/nagweb-interaction-experimental/scene-composer-v1.png',fullPage:true});
 console.log('NagWeb Scene Composer V1 browser smoke: PASS');
}finally{await browser.close();}