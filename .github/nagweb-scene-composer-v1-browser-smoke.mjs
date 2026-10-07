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

 await page.click('.add[data-type="text"]');await new Promise(r=>setTimeout(r,80));
 state=await page.evaluate(()=>({count:__NAGWEB_SCENE_COMPOSER__.scene.elements.length,selected:__NAGWEB_SCENE_COMPOSER__.view.selected,type:__NAGWEB_SCENE_COMPOSER__.scene.elements.find(e=>e.id===__NAGWEB_SCENE_COMPOSER__.view.selected)?.type}));
 assert.equal(state.count,4);assert.equal(state.type,'text');

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
 await page.click('#reacts');await new Promise(r=>setTimeout(r,80));

 const id=await page.evaluate(()=>__NAGWEB_SCENE_COMPOSER__.view.selected);
 const box=await page.$eval('[data-scene-id="'+id+'"]',el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y};});
 const before=await page.evaluate(id=>{const e=__NAGWEB_SCENE_COMPOSER__.scene.elements.find(x=>x.id===id);return {x:e.x,y:e.y}},id);
 await page.mouse.move(box.x+10,box.y+10);await page.mouse.down();await page.mouse.move(box.x+90,box.y+60,{steps:6});await page.mouse.up();await new Promise(r=>setTimeout(r,100));
 const after=await page.evaluate(id=>{const e=__NAGWEB_SCENE_COMPOSER__.scene.elements.find(x=>x.id===id);return {x:e.x,y:e.y}},id);
 assert.ok(Math.hypot(after.x-before.x,after.y-before.y)>40,'drag should move scene element');

 await page.click('#duplicate');await new Promise(r=>setTimeout(r,80));
 assert.equal(await page.evaluate(()=>__NAGWEB_SCENE_COMPOSER__.scene.elements.length),5);

 await page.click('#exportScene');const json=await page.$eval('#sceneJson',el=>el.value);assert.ok(json.includes('nagweb-scene-composer'));
 await page.click('#applyScene');await new Promise(r=>setTimeout(r,80));assert.equal(await page.evaluate(()=>__NAGWEB_SCENE_COMPOSER__.scene.elements.length),5);

 const stage=await page.$eval('#stage',el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y}});
 await page.mouse.move(stage.x+300,stage.y+200,{steps:8});await new Promise(r=>setTimeout(r,500));
 const moved=await page.$$eval('.item[data-reactive="1"]',els=>els.some(el=>el.style.translate&&el.style.translate!=='0.00px 0.00px'));
 assert.equal(moved,true,'at least one scene object should react to character');
 assert.equal(errors.length,0,errors.join('\n'));
 fs.mkdirSync('/tmp/nagweb-interaction-experimental',{recursive:true});await page.screenshot({path:'/tmp/nagweb-interaction-experimental/scene-composer-v1.png',fullPage:true});
 console.log('NagWeb Scene Composer V1 browser smoke: PASS');
}finally{await browser.close();}