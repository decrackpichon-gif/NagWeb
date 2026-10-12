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
  let maxV3=0,maxV4=0;
  for(const [x,y] of route){
    await page.mouse.move(cmp.x+cmp.w*x,cmp.y+cmp.h*y,{steps:6});
    await new Promise(r=>setTimeout(r,125));
    const point=await page.evaluate(()=>({v3:__NAGWEB_V4C_AB__.v3.spine[0],v4:__NAGWEB_V4C_AB__.v4c.spine[0]}));
    maxV3=Math.max(maxV3,Math.hypot(point.v3.x-before.v3.x,point.v3.y-before.v3.y));
    maxV4=Math.max(maxV4,Math.hypot(point.v4.x-before.v4.x,point.v4.y-before.v4.y));
  }
  const after=await page.evaluate(()=>({
    meshSafety:__NAGWEB_V4C_AB__.v4c.meshSafety,
    spine:__NAGWEB_V4C_AB__.v4c.spine,
    options:__NAGWEB_V4C_AB__.v4c.options
  }));
  assert.ok(maxV3>10,'V3 must move during the route');
  assert.ok(maxV4>10,'V4-C.1 must move during the route');
  assert.ok(after.spine.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
  assert.equal(after.options.meshFoldGuard,true);
  assert.ok(after.meshSafety.minScale>0&&after.meshSafety.minScale<=1);

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
  // Run the same path on both engines and retain diagnostic samples.
  const reviewBoot=await page.evaluate(()=>({available:!!window.__NAGWEB_AB_REVIEW__,runCount:window.__NAGWEB_AB_REVIEW__?.runCount||0}));
  assert.equal(reviewBoot.available,true,'A/B repeatable runner must be available');
  assert.equal(reviewBoot.runCount,0);
  fs.mkdirSync('/tmp/nagweb-interaction-experimental',{recursive:true});
  await page.click('#abRun');
  await page.waitForFunction(()=>window.__NAGWEB_AB_REVIEW__.running,{timeout:3000});
  await new Promise(r=>setTimeout(r,700));
  await page.screenshot({path:'/tmp/nagweb-interaction-experimental/organic-v3-v4c-route-in-progress.png',fullPage:true});
  await page.waitForFunction(()=>!!window.__NAGWEB_AB_REVIEW__.lastReport,{timeout:14000});
  const review=await page.evaluate(()=>window.__NAGWEB_AB_REVIEW__.lastReport);
  assert.equal(review.schema,'nagweb-organic-ab-review');
  assert.equal(review.status,'completo');
  assert.equal(review.route,'tight');
  assert.equal(review.asset,'fixture-svg-interno');
  assert.equal(review.cancelled,false);
  assert.ok(review.samples.length>=8,'A/B route should collect enough diagnostic samples');
  assert.equal(review.invalidSamples,0,'both spines should remain finite during repeated route');
  assert.ok(review.samples.every(s=>s.target.length===2&&s.v3.finite&&s.v4c.finite));
  assert.ok(review.samples.some(s=>s.progress>.85),'route must reach its final segment');
  assert.equal(await page.$eval('#abExport',el=>el.disabled),false,'finished run allows JSON export');
  await page.evaluate(()=>{void window.__NAGWEB_AB_REVIEW__.start({route:'smooth',durationMs:1500});});
  await page.waitForFunction(()=>window.__NAGWEB_AB_REVIEW__.running,{timeout:3000});
  await page.click('#abStop');
  const cancelled=await page.evaluate(()=>window.__NAGWEB_AB_REVIEW__.lastReport);
  assert.equal(cancelled.status,'interrumpido');
  assert.equal(cancelled.cancelled,true);
  assert.equal(await page.evaluate(()=>window.__NAGWEB_AB_REVIEW__.running),false);


  // Simulate out-of-order asynchronous preparation without relying on network timing.
  const races=await page.evaluate(async()=>{
    const api=window.__NAGWEB_V4C_AB__,prep=NAGWEB_INTERACTION_ASSET_PREP,mesh=NAGWEB_ORGANIC_MESH;
    const realAnalyze=prep.analyzeImage,realPrepare=mesh.prepareAsset;
    let pending=[],started=[];
    try{
      prep.analyzeImage=function(img){
        started.push(img.src);
        return new Promise((resolve,reject)=>pending.push({src:img.src,resolve,reject}));
      };
      const svg=part=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="140" height="200"><rect x="35" y="16" width="70" height="168" rx="28" fill="'+part+'"/></svg>');
      const first=svg('red'),second=svg('blue');
      api.loadAsset(first);
      await new Promise(r=>setTimeout(r,100));
      api.loadAsset(second);
      await new Promise(r=>setTimeout(r,100));
      const previous=api.v4c,source=api.assetSource;
      pending.find(p=>p.src===first)?.reject(new Error('old asset failure'));
      await new Promise(r=>setTimeout(r,20));
      const staleIgnored=api.v4c===previous&&api.assetSource===source;
      const secondTask=pending.find(p=>p.src===second);
      if(!secondTask)return {tasks:pending.length,staleIgnored,activeCompleted:false};
      const realImage=new Image();
      realImage.src=second;
      await realImage.decode();
      const analysis=await realAnalyze(realImage,{maxDimension:512});
      secondTask.resolve(analysis);
      const deadline=performance.now()+5000;
      while(api.assetSource!==second&&performance.now()<deadline&&!(document.querySelector('#status')?.textContent||'').startsWith('ERROR'))await new Promise(r=>setTimeout(r,50));
      return {tasks:pending.length,staleIgnored,activeCompleted:api.assetSource===second,version:api.v4c?.version,preview:document.querySelector('#preview').src===second,error:document.querySelector('#status')?.textContent};
    }finally{prep.analyzeImage=realAnalyze;mesh.prepareAsset=realPrepare;}
  });
  assert.equal(races.tasks,2,'both separate asset jobs should be initiated');
  assert.equal(races.staleIgnored,true,'obsolete load failure must not replace current renderer');
  assert.equal(races.activeCompleted,true,'current asset should install');
  assert.equal(races.preview,true,'preview should match latest asset');

  assert.equal(errors.length,0,'V4-C lab should have no page errors: '+errors.join('\n'));
  assert.equal(consoleErrors.length,0,'V4-C lab should have no console errors: '+consoleErrors.join('\n'));
  fs.mkdirSync('/tmp/nagweb-interaction-experimental',{recursive:true});
  await page.screenshot({path:'/tmp/nagweb-interaction-experimental/organic-v3-v4c-ab.png',fullPage:true});
  console.log('NagWeb Organic V3 vs Adaptive Curve V4-C browser smoke: PASS');
}finally{await browser.close();}
