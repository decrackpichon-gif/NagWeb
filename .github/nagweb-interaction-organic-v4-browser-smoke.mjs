import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const candidates=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const executablePath=candidates.find(p=>fs.existsSync(p));if(!executablePath)throw new Error('No Chromium/Chrome executable found');
const browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
try{
  const page=await browser.newPage();await page.setViewport({width:1480,height:860,deviceScaleFactor:1});
  const errors=[],consoleErrors=[];page.on('pageerror',e=>errors.push(String(e&&e.stack||e)));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
  await page.goto('http://127.0.0.1:4173/experiments/organic-skin-v4.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>{
    const x=window.__NAGWEB_ORGANIC_V4_AB__,status=document.querySelector('#status')?.textContent||'';
    return !!(x&&x.v3&&x.v4)||/^ERROR/.test(status);
  },{timeout:15000});
  const boot=await page.evaluate(()=>({
    ready:!!(__NAGWEB_ORGANIC_V4_AB__.v3&&__NAGWEB_ORGANIC_V4_AB__.v4),
    status:document.querySelector('#status').textContent,
    v3Version:NAGWEB_ORGANIC_MESH.version,
    v4Version:NAGWEB_ORGANIC_SKIN.version,
    v3Renderer:__NAGWEB_ORGANIC_V4_AB__.v3?.renderer,
    v4Renderer:__NAGWEB_ORGANIC_V4_AB__.v4?.renderer,
    rig:__NAGWEB_ORGANIC_V4_AB__.v4?.rig,
    topology:__NAGWEB_ORGANIC_V4_AB__.v4?.topology,
    analysis:__NAGWEB_ORGANIC_V4_AB__.analysis
  }));
  if(!boot.ready)throw new Error('V4 A/B boot failed · '+JSON.stringify({boot,errors,consoleErrors}));
  assert.equal(boot.v3Version,'3.2.0-alpha.1');assert.equal(boot.v4Version,'4.0.0-alpha.1');
  assert.equal(boot.v3Renderer,'webgl-mesh');assert.equal(boot.v4Renderer,'webgl-skin-v4');
  assert.equal(boot.rig.count,7);assert.equal(boot.topology.columns,36);assert.equal(boot.topology.rows,12);
  assert.ok(Math.abs(boot.topology.weightStats.minSum-1)<1e-6);assert.ok(Math.abs(boot.topology.weightStats.maxSum-1)<1e-6);
  assert.ok(boot.topology.weightStats.maxInfluences<=4);assert.equal(boot.analysis.silhouetteReliable,true);

  const cmp=await page.$eval('#compare',el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};});
  const before=await page.evaluate(()=>({v3:{...__NAGWEB_ORGANIC_V4_AB__.v3.spine[0]},v4:{...__NAGWEB_ORGANIC_V4_AB__.v4.spine[0]}}));
  await page.mouse.move(cmp.x+cmp.w*.82,cmp.y+cmp.h*.23);await new Promise(r=>setTimeout(r,750));
  const after=await page.evaluate(()=>({
    v3:{...__NAGWEB_ORGANIC_V4_AB__.v3.spine[0]},
    v4:{...__NAGWEB_ORGANIC_V4_AB__.v4.spine[0]},
    frames:__NAGWEB_ORGANIC_V4_AB__.v4.boneFrames
  }));
  assert.ok(Math.hypot(after.v3.x-before.v3.x,after.v3.y-before.v3.y)>10);
  assert.ok(Math.hypot(after.v4.x-before.v4.x,after.v4.y-before.v4.y)>10);
  assert.equal(after.frames.length,7);assert.ok(after.frames.every(f=>Number.isFinite(f.x)&&Number.isFinite(f.y)&&Number.isFinite(f.angle)));

  await page.$eval('#bones',el=>{el.value='9';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.$eval('#radius',el=>{el.value='.33';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.$eval('#influences',el=>{el.value='3';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await new Promise(r=>setTimeout(r,180));
  const changed=await page.evaluate(()=>({rig:__NAGWEB_ORGANIC_V4_AB__.v4.rig,topology:__NAGWEB_ORGANIC_V4_AB__.v4.topology,options:__NAGWEB_ORGANIC_V4_AB__.v4.options}));
  assert.equal(changed.rig.count,9);assert.equal(changed.options.maxInfluences,3);assert.ok(changed.topology.weightStats.maxInfluences<=3);
  assert.ok(Math.abs(changed.topology.weightStats.minSum-1)<1e-6);assert.ok(Math.abs(changed.topology.weightStats.maxSum-1)<1e-6);

  const gl=await page.evaluate(()=>['canvasV3','canvasV4'].map(id=>{const c=document.getElementById(id),g=c.getContext('webgl')||c.getContext('experimental-webgl');return !!g&&g.getError()===g.NO_ERROR;}));
  assert.deepEqual(gl,[true,true]);
  assert.equal(errors.length,0,'V4 A/B lab should have no page errors: '+errors.join('\n'));
  assert.equal(consoleErrors.length,0,'V4 A/B lab should have no console errors: '+consoleErrors.join('\n'));
  fs.mkdirSync('/tmp/nagweb-interaction-experimental',{recursive:true});
  await page.screenshot({path:'/tmp/nagweb-interaction-experimental/organic-v3-v4-ab.png',fullPage:true});
  console.log('NagWeb Organic V3 vs Skin V4.0 A/B browser smoke: PASS');
}finally{await browser.close();}
