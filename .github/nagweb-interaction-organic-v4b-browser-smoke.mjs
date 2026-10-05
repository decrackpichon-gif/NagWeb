import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const candidates=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const executablePath=candidates.find(p=>fs.existsSync(p));if(!executablePath)throw new Error('No Chromium/Chrome executable found');
const browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
try{
  const page=await browser.newPage();await page.setViewport({width:1480,height:860,deviceScaleFactor:1});
  const errors=[],consoleErrors=[];page.on('pageerror',e=>errors.push(String(e&&e.stack||e)));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
  await page.goto('http://127.0.0.1:4173/experiments/organic-weighted-curve-v4b.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>{
    const x=window.__NAGWEB_V4B_AB__,status=document.querySelector('#status')?.textContent||'';
    return !!(x&&x.v3&&x.v4b)||/^ERROR/.test(status);
  },{timeout:15000});
  const boot=await page.evaluate(()=>({
    ready:!!(__NAGWEB_V4B_AB__.v3&&__NAGWEB_V4B_AB__.v4b),
    status:document.querySelector('#status').textContent,
    v3Version:NAGWEB_ORGANIC_MESH.version,
    v4bVersion:NAGWEB_ORGANIC_WEIGHTED_CURVE.version,
    v3Renderer:__NAGWEB_V4B_AB__.v3?.renderer,
    v4bRenderer:__NAGWEB_V4B_AB__.v4b?.renderer,
    controls:__NAGWEB_V4B_AB__.v4b?.controls,
    opts:__NAGWEB_V4B_AB__.v4b?.options,
    analysis:__NAGWEB_V4B_AB__.analysis
  }));
  if(!boot.ready)throw new Error('V4-B A/B boot failed · '+JSON.stringify({boot,errors,consoleErrors}));
  assert.equal(boot.v3Version,'3.2.0-alpha.1');assert.equal(boot.v4bVersion,'4.2.0-alpha.1');
  assert.equal(boot.v3Renderer,'webgl-mesh');assert.equal(boot.v4bRenderer,'webgl-weighted-curve-v4b');
  assert.equal(boot.controls.count,7);assert.equal(boot.opts.antiFold,true);assert.equal(boot.analysis.silhouetteReliable,true);
  assert.equal(await page.$eval('#lengthOut',el=>el.value),'380 px');

  const cmp=await page.$eval('#compare',el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};});
  const before=await page.evaluate(()=>({v3:{...__NAGWEB_V4B_AB__.v3.spine[0]},v4:{...__NAGWEB_V4B_AB__.v4b.spine[0]}}));
  const route=[
    [.82,.24],[.72,.58],[.55,.78],[.30,.66],[.20,.38],[.44,.18],[.70,.38],[.56,.68],[.34,.42],[.65,.22]
  ];
  for(const [x,y] of route){await page.mouse.move(cmp.x+cmp.w*x,cmp.y+cmp.h*y,{steps:6});await new Promise(r=>setTimeout(r,90));}
  const after=await page.evaluate(()=>({
    v3:{...__NAGWEB_V4B_AB__.v3.spine[0]},
    v4:{...__NAGWEB_V4B_AB__.v4b.spine[0]},
    guard:__NAGWEB_V4B_AB__.v4b.guard,
    spine:__NAGWEB_V4B_AB__.v4b.spine
  }));
  assert.ok(Math.hypot(after.v3.x-before.v3.x,after.v3.y-before.v3.y)>10);
  assert.ok(Math.hypot(after.v4.x-before.v4.x,after.v4.y-before.v4.y)>10);
  assert.ok(after.spine.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
  assert.ok(Number.isFinite(after.guard.minDistance)||after.guard.minDistance===null||after.guard.minDistance===Infinity);

  await page.$eval('#controls',el=>{el.value='9';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.$eval('#radius',el=>{el.value='.31';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.$eval('#foldDistance',el=>{el.value='1.35';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.$eval('#foldStrength',el=>{el.value='.65';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await new Promise(r=>setTimeout(r,150));
  const tuned=await page.evaluate(()=>({controls:__NAGWEB_V4B_AB__.v4b.controls.count,opts:__NAGWEB_V4B_AB__.v4b.options}));
  assert.equal(tuned.controls,9);assert.equal(tuned.opts.weightRadius,.31);assert.equal(tuned.opts.antiFoldDistance,1.35);assert.equal(tuned.opts.antiFoldStrength,.65);

  await page.click('#antiFold');await new Promise(r=>setTimeout(r,80));
  assert.equal(await page.evaluate(()=>__NAGWEB_V4B_AB__.v4b.options.antiFold),false);
  await page.click('#antiFold');await new Promise(r=>setTimeout(r,80));
  assert.equal(await page.evaluate(()=>__NAGWEB_V4B_AB__.v4b.options.antiFold),true);

  const gl=await page.evaluate(()=>['canvasV3','canvasV4B'].map(id=>{const c=document.getElementById(id),g=c.getContext('webgl')||c.getContext('experimental-webgl');return !!g&&g.getError()===g.NO_ERROR;}));
  assert.deepEqual(gl,[true,true]);
  assert.equal(errors.length,0,'V4-B lab should have no page errors: '+errors.join('\n'));
  assert.equal(consoleErrors.length,0,'V4-B lab should have no console errors: '+consoleErrors.join('\n'));
  fs.mkdirSync('/tmp/nagweb-interaction-experimental',{recursive:true});
  await page.screenshot({path:'/tmp/nagweb-interaction-experimental/organic-v3-v4b-ab.png',fullPage:true});
  console.log('NagWeb Organic V3 vs Weighted Curve V4-B browser smoke: PASS');
}finally{await browser.close();}
