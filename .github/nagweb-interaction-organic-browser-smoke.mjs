import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const candidates=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const executablePath=candidates.find(p=>fs.existsSync(p));
if(!executablePath)throw new Error('No Chromium/Chrome executable found on runner');

const browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
  const page=await browser.newPage();
  await page.setViewport({width:1360,height:820,deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(String(e&&e.stack||e)));
  await page.goto('http://127.0.0.1:4173/experiments/organic-follower-v2.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>window.__NAGWEB_ORGANIC_V2__&&window.__NAGWEB_ORGANIC_V2__.renderer&&document.querySelector('#analysis')?.dataset.ready==='1',{timeout:15000});

  const initial=await page.evaluate(()=>({
    organicVersion:NAGWEB_ORGANIC_FOLLOWER.version,
    engineVersion:NAGWEB_INTERACTION_ENGINE.version,
    analysis:__NAGWEB_ORGANIC_V2__.analysis,
    options:__NAGWEB_ORGANIC_V2__.renderer.options,
    spine:__NAGWEB_ORGANIC_V2__.renderer.spine,
    canvas:{w:document.querySelector('#organicCanvas').width,h:document.querySelector('#organicCanvas').height}
  }));
  assert.equal(initial.organicVersion,'2.2.0-alpha.1');
  assert.equal(initial.engineVersion,'1.5.0');
  assert.equal(initial.analysis.silhouetteReliable,true);
  assert.ok(initial.analysis.elongation>1.75);
  assert.ok(initial.canvas.w>500&&initial.canvas.h>300);
  assert.equal(initial.spine.length,30);

  const stage=await page.$eval('#stage',el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
  const h0=initial.spine[0];
  await page.mouse.move(stage.x+stage.width*.78,stage.y+stage.height*.28);
  await new Promise(r=>setTimeout(r,650));
  const moved=await page.evaluate(()=>({spine:__NAGWEB_ORGANIC_V2__.renderer.spine,state:__NAGWEB_ORGANIC_V2__.follower.state}));
  assert.ok(Math.hypot(moved.spine[0].x-h0.x,moved.spine[0].y-h0.y)>10,'organic head should follow pointer');
  const expected=initial.options.length/(initial.options.points-1);
  const lengths=moved.spine.slice(1).map((p,i)=>Math.hypot(p.x-moved.spine[i].x,p.y-moved.spine[i].y));
  assert.ok(lengths.every(v=>Math.abs(v-expected)<.05),'spine segments should preserve length');
  const bends=moved.spine.slice(2).map((p,i)=>{
    const p0=moved.spine[i],p1=moved.spine[i+1];
    const a0=Math.atan2(p1.y-p0.y,p1.x-p0.x),a1=Math.atan2(p.y-p1.y,p.x-p1.x);
    return Math.abs(Math.atan2(Math.sin(a1-a0),Math.cos(a1-a0)));
  });
  assert.ok(bends.slice(0,5).every((v,i)=>v<=NAGWEB_ORGANIC_FOLLOWER.bendLimitAt((i+1.5)/(initial.options.points-1),initial.options)+.015),'head zone bend should be protected');

  const sway=await page.evaluate(()=>{
    const r=__NAGWEB_ORGANIC_V2__.renderer;
    return NAGWEB_ORGANIC_FOLLOWER.sampleSpine(r.spine,1,1.4,r.options,.8).sway;
  });
  assert.ok(Math.abs(sway)>1,'tail should have organic sway');

  await page.$eval('#length',el=>{el.value='520';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.$eval('#sway',el=>{el.value='.075';el.dispatchEvent(new Event('input',{bubbles:true}));});
  const anchorsBefore=await page.evaluate(()=>({
    trail:{left:parseFloat(document.querySelector('#trailAnchor').style.left),top:parseFloat(document.querySelector('#trailAnchor').style.top)},
    lead:{left:parseFloat(document.querySelector('#leadAnchor').style.left),top:parseFloat(document.querySelector('#leadAnchor').style.top)},
    source:__NAGWEB_ORGANIC_V2__.profile.organic.directionSource
  }));
  assert.equal(anchorsBefore.source,'auto');
  const leadBox=await page.$eval('#leadAnchor',el=>{const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});
  await page.mouse.move(leadBox.x,leadBox.y);
  await page.mouse.down();
  await page.mouse.move(leadBox.x-45,leadBox.y-28,{steps:6});
  await page.mouse.up();
  await new Promise(r=>setTimeout(r,100));
  const manual=await page.evaluate(()=>({profile:__NAGWEB_ORGANIC_V2__.profile,info:document.querySelector('#axisInfo').textContent}));
  assert.equal(manual.profile.organic.directionSource,'manual');
  assert.ok(/corregido manualmente/i.test(manual.info));
  await page.click('#prepare');
  await new Promise(r=>setTimeout(r,180));
  const changed=await page.evaluate(()=>({options:__NAGWEB_ORGANIC_V2__.renderer.options,spine:__NAGWEB_ORGANIC_V2__.renderer.spine,prepared:__NAGWEB_ORGANIC_V2__.prepared}));
  assert.equal(changed.options.length,520);assert.equal(changed.options.sway,.075);assert.equal(changed.options.leadEnd,'right');
  assert.ok(Number.isFinite(changed.prepared.axisAngle));
  const expected2=520/(changed.options.points-1);
  const d=Math.hypot(changed.spine[1].x-changed.spine[0].x,changed.spine[1].y-changed.spine[0].y);
  assert.ok(Math.abs(d-expected2)<.1,'live length changes should resegment body');

  assert.equal(errors.length,0,'V2 lab should have no page errors: '+errors.join('\n'));
  fs.mkdirSync('/tmp/nagweb-interaction-v1',{recursive:true});
  await page.screenshot({path:'/tmp/nagweb-interaction-v1/organic-v2-desktop.png',fullPage:true});

  const reduced=await browser.newPage();
  await reduced.setViewport({width:900,height:650,deviceScaleFactor:1});
  await reduced.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  await reduced.goto('http://127.0.0.1:4173/experiments/organic-follower-v2.html',{waitUntil:'domcontentloaded',timeout:30000});
  await reduced.waitForFunction(()=>window.__NAGWEB_ORGANIC_V2__&&window.__NAGWEB_ORGANIC_V2__.renderer,{timeout:15000});
  const rs=await reduced.evaluate(()=>{
    const r=__NAGWEB_ORGANIC_V2__.renderer;
    const p=NAGWEB_ORGANIC_FOLLOWER.sampleSpine(r.spine,1,1.4,Object.assign({},r.options,{sway:0}),.8);
    return {sway:p.sway,head:r.spine[0]};
  });
  assert.equal(rs.sway,0);
  await reduced.close();

  console.log('NagWeb Organic Follower V2.2 browser smoke: PASS');
}finally{await browser.close();}
