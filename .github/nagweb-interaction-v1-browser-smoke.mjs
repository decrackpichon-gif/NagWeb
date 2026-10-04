import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const candidates=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const executablePath=candidates.find(p=>fs.existsSync(p));
if(!executablePath) throw new Error('No Chromium/Chrome executable found on runner');

const browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
  const page=await browser.newPage();
  await page.setViewport({width:1360,height:820,deviceScaleFactor:1});
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e&&e.stack||e)));

  await page.goto(process.env.NAGWEB_INTERACTION_URL||'http://127.0.0.1:4173/experiments/interaction-engine-v1.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>window.__NAGWEB_INTERACTION_V1__&&window.NAGWEB_INTERACTION_ENGINE,{timeout:10000});

  const initial=await page.evaluate(()=>({
    version:NAGWEB_INTERACTION_ENGINE.version,
    title:document.title,
    controls:{
      upload:!!document.querySelector('#file'),
      preset:!!document.querySelector('#preset'),
      size:!!document.querySelector('#size'),
      directions:document.querySelectorAll('.dir').length,
      config:!!document.querySelector('#config')
    },
    state:{x:__NAGWEB_INTERACTION_V1__.engine.state.x,y:__NAGWEB_INTERACTION_V1__.engine.state.y}
  }));
  assert.equal(initial.version,'1.3.0');
  assert.ok(initial.title.includes('Interaction Engine'));
  assert.deepEqual(initial.controls,{upload:true,preset:true,size:true,directions:4,config:true});
  const runtimeInitial=await page.evaluate(()=>NAGWEB_INTERACTION_ENGINE.runtimeStats());
  assert.equal(runtimeInitial.instances,1);
  assert.equal(runtimeInitial.active,1);
  assert.equal(runtimeInitial.running,true);

  const box=await page.$eval('#stage',el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
  await page.mouse.move(box.x+box.width*.82,box.y+box.height*.70);
  await new Promise(r=>setTimeout(r,500));
  const moved=await page.evaluate(()=>({x:__NAGWEB_INTERACTION_V1__.engine.state.x,y:__NAGWEB_INTERACTION_V1__.engine.state.y}));
  assert.ok(Math.hypot(moved.x-initial.state.x,moved.y-initial.state.y)>5,'follower should move after pointer input');

  await page.select('#preset','character');
  await new Promise(r=>setTimeout(r,80));
  let options=await page.evaluate(()=>__NAGWEB_INTERACTION_V1__.engine.options);
  assert.equal(options.preset,'character');
  assert.equal(options.distanceFromPointer,54);

  await page.click('.dir[data-angle="-90"]');
  options=await page.evaluate(()=>__NAGWEB_INTERACTION_V1__.engine.options);
  assert.equal(options.assetForwardAngle,-90);

  await page.$eval('#distance',el=>{el.value='83';el.dispatchEvent(new Event('input',{bubbles:true}));});
  options=await page.evaluate(()=>__NAGWEB_INTERACTION_V1__.engine.options);
  assert.equal(options.preset,'custom');
  assert.equal(options.distanceFromPointer,83);

  await page.$eval('#size',el=>{el.value='260';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await new Promise(r=>setTimeout(r,80));
  const size=await page.$eval('#target',el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height};});
  assert.ok(Math.abs(Math.max(size.width,size.height)-260)<2,'asset longest side should follow size control');

  await page.click('#contain');
  options=await page.evaluate(()=>__NAGWEB_INTERACTION_V1__.engine.options);
  assert.equal(options.edgeMode,'contain');

  await page.mouse.move(50,50);
  await new Promise(r=>setTimeout(r,80));
  const leave=await page.evaluate(()=>__NAGWEB_INTERACTION_V1__.engine.status);
  assert.equal(leave.pointerInside,false,'pointerleave should be tracked');

  const pausedStart=await page.evaluate(()=>{const e=__NAGWEB_INTERACTION_V1__.engine;e.pause();e.setTarget(900,300,'area');return e.state.x;});
  await new Promise(r=>setTimeout(r,180));
  const pausedEnd=await page.evaluate(()=>__NAGWEB_INTERACTION_V1__.engine.state.x);
  assert.ok(Math.abs(pausedEnd-pausedStart)<0.01,'pause should freeze state');
  await page.evaluate(()=>__NAGWEB_INTERACTION_V1__.engine.resume());
  await new Promise(r=>setTimeout(r,220));
  const resumed=await page.evaluate(()=>__NAGWEB_INTERACTION_V1__.engine.state.x);
  assert.ok(Math.abs(resumed-pausedEnd)>0.5,'resume should continue motion');

  const multi=await page.evaluate(async()=>{
    const stage=document.querySelector('#stage');
    const baseline=NAGWEB_INTERACTION_ENGINE.runtimeStats();
    const items=[],followers=[];
    for(let i=0;i<24;i++){
      const d=document.createElement('div');
      d.style.cssText='position:absolute;left:0;top:0;width:'+(28+i%4*4)+'px;height:'+(24+i%3*5)+'px;background:#fff;pointer-events:none';
      stage.appendChild(d);items.push(d);
      const f=NAGWEB_INTERACTION_ENGINE.createFollower(d,{area:stage,preset:i%2?'soft':'agile',edgeMode:'contain'});
      f.setTarget(80+(i%8)*70,70+Math.floor(i/8)*120,'area');
      followers.push(f);
    }
    const created=NAGWEB_INTERACTION_ENGINE.runtimeStats();
    const framesBefore=created.frames;
    await new Promise(r=>setTimeout(r,260));
    const afterRun=NAGWEB_INTERACTION_ENGINE.runtimeStats();
    followers.slice(0,12).forEach(f=>f.pause());
    const halfPaused=NAGWEB_INTERACTION_ENGINE.runtimeStats();
    followers.slice(0,12).forEach(f=>f.resume());
    const restored=NAGWEB_INTERACTION_ENGINE.deserializeOptions(followers[0].serialize());
    followers.forEach(f=>f.destroy());
    const cleaned=items.every(d=>d.style.translate===''&&d.style.rotate===''&&d.style.scale==='');
    items.forEach(d=>d.remove());
    const final=NAGWEB_INTERACTION_ENGINE.runtimeStats();
    return {baseline,created,afterRun,halfPaused,final,restored,cleaned,frameDelta:afterRun.frames-framesBefore};
  });
  assert.equal(multi.created.instances,multi.baseline.instances+24,'all stress followers should register');
  assert.equal(multi.created.active,multi.baseline.active+24,'all stress followers should share the active runtime');
  assert.equal(multi.halfPaused.active,multi.baseline.active+12,'paused followers should leave the shared ticker');
  assert.ok(multi.frameDelta>2&&multi.frameDelta<40,'24 followers should advance on one shared frame clock');
  assert.equal(multi.restored.preset,'agile');
  assert.equal(multi.cleaned,true,'destroy should restore inline motion styles');
  assert.equal(multi.final.instances,multi.baseline.instances,'destroy should release every stress instance');
  assert.equal(multi.final.active,multi.baseline.active,'destroy should release every stress tick');

  assert.equal(pageErrors.length,0,'page should have no JS errors: '+pageErrors.join('\n'));
  fs.mkdirSync('/tmp/nagweb-interaction-v1',{recursive:true});
  await page.screenshot({path:'/tmp/nagweb-interaction-v1/lab.png',fullPage:true});
  console.log('NagWeb Interaction Engine V1.2 browser smoke: PASS');
} finally {
  await browser.close();
}
