import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const candidates=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const executablePath=candidates.find(p=>fs.existsSync(p));if(!executablePath)throw new Error('No Chromium/Chrome executable found');
const browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
  const page=await browser.newPage();await page.setViewport({width:1440,height:900,deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(String(e&&e.stack||e)));
  await page.goto('http://127.0.0.1:4173/experiments/interaction-studio-v1.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>window.__NAGWEB_INTERACTION_STUDIO__&&window.__NAGWEB_INTERACTION_STUDIO__.prepResult&&document.querySelector('#s4')?.classList.contains('on'),{timeout:15000});

  const init=await page.evaluate(()=>({
    title:document.title,
    mode:__NAGWEB_INTERACTION_STUDIO__.mode,
    quality:__NAGWEB_INTERACTION_STUDIO__.prepResult.report.quality.score,
    recommended:__NAGWEB_INTERACTION_STUDIO__.prepResult.report.recommendedMode,
    sessionVersion:NAGWEB_INTERACTION_SESSION.version,
    assetVersion:NAGWEB_INTERACTION_ASSET_PREP.version,
    organicVersion:NAGWEB_ORGANIC_FOLLOWER.version,
    influence:!!__NAGWEB_INTERACTION_STUDIO__.influenceField
  }));
  assert.equal(init.title,'NagWeb · Interaction Studio');assert.ok(init.quality>=72);assert.equal(init.recommended,'organic');assert.equal(init.mode,'organic');
  assert.equal(init.sessionVersion,'1.0.0-alpha.1');assert.equal(init.assetVersion,'1.2.0');assert.equal(init.organicVersion,'2.2.0-alpha.1');assert.equal(init.influence,true);

  const stage=await page.$eval('#stage',el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};});
  const head0=await page.evaluate(()=>({x:__NAGWEB_INTERACTION_STUDIO__.follower.state.x,y:__NAGWEB_INTERACTION_STUDIO__.follower.state.y}));
  await page.mouse.move(stage.x+stage.w*.76,stage.y+stage.h*.28);await new Promise(r=>setTimeout(r,550));
  const head1=await page.evaluate(()=>({x:__NAGWEB_INTERACTION_STUDIO__.follower.state.x,y:__NAGWEB_INTERACTION_STUDIO__.follower.state.y}));
  assert.ok(Math.hypot(head1.x-head0.x,head1.y-head0.y)>10,'studio leader follows pointer');

  await page.select('#mode','follower');await new Promise(r=>setTimeout(r,120));
  assert.equal(await page.evaluate(()=>__NAGWEB_INTERACTION_STUDIO__.mode),'follower');
  assert.equal(await page.$eval('#followerVisual',el=>getComputedStyle(el).display),'grid');

  await page.select('#mode','organic');await new Promise(r=>setTimeout(r,450));
  assert.equal(await page.evaluate(()=>__NAGWEB_INTERACTION_STUDIO__.mode),'organic');
  assert.equal(await page.$eval('#organicCanvas',el=>getComputedStyle(el).display),'block');

  await page.$eval('#influence',el=>{el.checked=false;el.dispatchEvent(new Event('change',{bubbles:true}));});
  assert.equal(await page.evaluate(()=>__NAGWEB_INTERACTION_STUDIO__.influenceField===null),true);
  await page.$eval('#influence',el=>{el.checked=true;el.dispatchEvent(new Event('change',{bubbles:true}));});
  assert.equal(await page.evaluate(()=>!!__NAGWEB_INTERACTION_STUDIO__.influenceField),true);

  await page.click('#export');
  const exported=await page.$eval('#sessionJson',el=>el.value);
  const data=JSON.parse(exported);assert.equal(data.schema,'nagweb-interaction-session');assert.equal(data.version,1);assert.ok(data.assetProfile);assert.ok(data.preparationReport);

  assert.equal(errors.length,0,'Interaction Studio should have no page errors: '+errors.join('\n'));
  fs.mkdirSync('/tmp/nagweb-interaction-v1',{recursive:true});
  await page.screenshot({path:'/tmp/nagweb-interaction-v1/interaction-studio-v1.png',fullPage:true});
  console.log('NagWeb Interaction Studio V1 browser smoke: PASS');
}finally{await browser.close();}
