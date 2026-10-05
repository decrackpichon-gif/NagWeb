import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const candidates=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const executablePath=candidates.find(p=>fs.existsSync(p));if(!executablePath)throw new Error('No Chromium/Chrome executable found');
const browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
try{
  const page=await browser.newPage();await page.setViewport({width:1480,height:860,deviceScaleFactor:1});
  const errors=[],consoleErrors=[];page.on('pageerror',e=>errors.push(String(e&&e.stack||e)));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
  await page.goto('http://127.0.0.1:4173/experiments/organic-adaptive-curve-v4c.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>{
    const x=window.__NAGWEB_V4C_AB__,status=document.querySelector('#status')?.textContent||'';
    return !!(x&&x.v3&&x.v4c)||/^ERROR/.test(status);
  },{timeout:15000});

  const boot=await page.evaluate(()=>({
    ready:!!(__NAGWEB_V4C_AB__.v3&&__NAGWEB_V4C_AB__.v4c),
    status:document.querySelector('#status').textContent,
    v3Version:NAGWEB_ORGANIC_MESH.version,
    v4bVersion:NAGWEB_ORGANIC_WEIGHTED_CURVE.version,
    v4cVersion:NAGWEB_ORGANIC_ADAPTIVE_CURVE.version,
    renderer:__NAGWEB_V4C_AB__.v4c?.renderer,
    summary:__NAGWEB_V4C_AB__.v4c?.adaptiveSummary,
    controls:__NAGWEB_V4C_AB__.v4c?.adaptiveControls,
    opts:__NAGWEB_V4C_AB__.v4c?.options,
    analysis:__NAGWEB_V4C_AB__.analysis
  }));
  if(!boot.ready)throw new Error('V4-C A/B boot failed · '+JSON.stringify({boot,errors,consoleErrors}));
  assert.equal(boot.v3Version,'3.2.0-alpha.1');assert.equal(boot.v4bVersion,'4.2.0-alpha.1');assert.equal(boot.v4cVersion,'4.3.1-alpha.1');
  assert.equal(boot.renderer,'webgl-adaptive-curve-v4c');assert.equal(boot.opts.adaptivePreset,'character');
  assert.equal(boot.opts.thicknessGuard,true);assert.equal(boot.opts.preserveLocalControlDips,true);
  assert.equal(boot.summary.controlCount,9);assert.ok(boot.summary.maxWidth>boot.summary.minWidth);
  assert.ok(boot.controls.details.some(d=>Math.abs(d.flex-d.baseFlex)>.005||Math.abs(d.bend-d.baseBend)>.005),'adaptive silhouette should alter controls');
  assert.ok(boot.controls.details.some(d=>d.geometryCapped),'thickness guard should cap at least one fallback silhouette zone');
  assert.ok(boot.controls.details.filter(d=>d.geometryCapped).every(d=>d.bend<=d.safeBend+1e-9),'capped controls must stay under local safe bend');
  assert.equal(boot.analysis.silhouetteReliable,true);
  assert.equal(await page.$eval('#lengthOut',el=>el.value),'380 px');

  const cmp=await page.$eval('#compare',el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};});
  const before=await page.evaluate(()=>({v3:{...__NAGWEB_V4C_AB__.v3.spine[0]},v4:{...__NAGWEB_V4C_AB__.v4c.spine[0]}}));
  const route=[[.82,.24],[.72,.58],[.55,.78],[.30,.66],[.20,.38],[.44,.18],[.70,.38],[.56,.68],[.34,.42],[.65,.22]];
  for(const [x,y] of route){await page.mouse.move(cmp.x+cmp.w*x,cmp.y+cmp.h*y,{steps:6});await new Promise(r=>setTimeout(r,90));}
  const after=await page.evaluate(()=>({
    v3:{...__NAGWEB_V4C_AB__.v3.spine[0]},
    v4:{...__NAGWEB_V4C_AB__.v4c.spine[0]},
    guard:__NAGWEB_V4C_AB__.v4c.guard,
    spine:__NAGWEB_V4C_AB__.v4c.spine
  }));
  assert.ok(Math.hypot(after.v3.x-before.v3.x,after.v3.y-before.v3.y)>10);
  assert.ok(Math.hypot(after.v4.x-before.v4.x,after.v4.y-before.v4.y)>10);
  assert.ok(after.spine.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));

  const charFlex=await page.evaluate(()=>__NAGWEB_V4C_AB__.v4c.adaptiveControls.flex.slice());
  await page.select('#preset','creature');await new Promise(r=>setTimeout(r,130));
  const creature=await page.evaluate(()=>({preset:__NAGWEB_V4C_AB__.v4c.options.adaptivePreset,flex:__NAGWEB_V4C_AB__.v4c.adaptiveControls.flex.slice(),count:__NAGWEB_V4C_AB__.v4c.adaptiveSummary.controlCount}));
  assert.equal(creature.preset,'creature');assert.equal(creature.count,10);assert.notDeepEqual(creature.flex,charFlex);
  await page.select('#preset','soft');await new Promise(r=>setTimeout(r,130));
  const soft=await page.evaluate(()=>({preset:__NAGWEB_V4C_AB__.v4c.options.adaptivePreset,flex:__NAGWEB_V4C_AB__.v4c.adaptiveControls.flex.slice()}));
  assert.equal(soft.preset,'soft');assert.notDeepEqual(soft.flex,creature.flex);
  await page.select('#preset','character');await new Promise(r=>setTimeout(r,100));

  const diagOn=await page.$eval('#diagnostic',el=>el.checked);assert.equal(diagOn,true);
  await page.click('#diagnostic');await new Promise(r=>setTimeout(r,60));assert.equal(await page.$eval('#diagnostic',el=>el.checked),false);
  await page.click('#diagnostic');await new Promise(r=>setTimeout(r,60));assert.equal(await page.$eval('#diagnostic',el=>el.checked),true);

  const gl=await page.evaluate(()=>['canvasV3','canvasV4C'].map(id=>{const c=document.getElementById(id),g=c.getContext('webgl')||c.getContext('experimental-webgl');return !!g&&g.getError()===g.NO_ERROR;}));
  assert.deepEqual(gl,[true,true]);
  assert.equal(errors.length,0,'V4-C lab should have no page errors: '+errors.join('\n'));
  assert.equal(consoleErrors.length,0,'V4-C lab should have no console errors: '+consoleErrors.join('\n'));
  fs.mkdirSync('/tmp/nagweb-interaction-experimental',{recursive:true});
  await page.screenshot({path:'/tmp/nagweb-interaction-experimental/organic-v3-v4c-ab.png',fullPage:true});
  console.log('NagWeb Organic V3 vs Adaptive Curve V4-C browser smoke: PASS');
}finally{await browser.close();}
