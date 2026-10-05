import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const candidates=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const executablePath=candidates.find(p=>fs.existsSync(p));if(!executablePath)throw new Error('No Chromium/Chrome executable found');
const browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
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
    reactionProfilesVersion:NAGWEB_INTERACTION_REACTION_PROFILES.version,
    assetVersion:NAGWEB_INTERACTION_ASSET_PREP.version,
    organicV2Version:NAGWEB_ORGANIC_FOLLOWER.version,
    organicV3Version:NAGWEB_ORGANIC_MESH.version,
    organicEngine:__NAGWEB_INTERACTION_STUDIO__.organicEngine,
    influence:!!__NAGWEB_INTERACTION_STUDIO__.influenceField,
    influenceVersion:NAGWEB_INTERACTION_INFLUENCE.version
  }));
  assert.equal(init.title,'NagWeb · Interaction Studio');assert.ok(init.quality>=72);assert.equal(init.recommended,'organic');assert.equal(init.mode,'organic');
  assert.equal(init.sessionVersion,'1.8.0-alpha.1');assert.equal(init.reactionProfilesVersion,'1.1.0');assert.equal(init.assetVersion,'1.2.0');assert.equal(init.organicV2Version,'2.2.0-alpha.1');assert.equal(init.organicV3Version,'3.2.0-alpha.1');assert.equal(init.organicEngine,'mesh-v3');assert.equal(init.influence,true);assert.equal(init.influenceVersion,'1.9.0');

  const stage=await page.$eval('#stage',el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};});
  const head0=await page.evaluate(()=>({x:__NAGWEB_INTERACTION_STUDIO__.follower.state.x,y:__NAGWEB_INTERACTION_STUDIO__.follower.state.y}));
  await page.mouse.move(stage.x+stage.w*.76,stage.y+stage.h*.28);await new Promise(r=>setTimeout(r,550));
  const head1=await page.evaluate(()=>({x:__NAGWEB_INTERACTION_STUDIO__.follower.state.x,y:__NAGWEB_INTERACTION_STUDIO__.follower.state.y}));
  assert.ok(Math.hypot(head1.x-head0.x,head1.y-head0.y)>10,'studio leader follows pointer');

  await page.select('#mode','follower');await new Promise(r=>setTimeout(r,120));
  assert.equal(await page.evaluate(()=>__NAGWEB_INTERACTION_STUDIO__.mode),'follower');
  assert.equal(await page.$eval('#followerVisual',el=>getComputedStyle(el).display),'grid');

  await page.select('#mode','organic');await new Promise(r=>setTimeout(r,650));
  assert.equal(await page.evaluate(()=>__NAGWEB_INTERACTION_STUDIO__.mode),'organic');
  assert.equal(await page.evaluate(()=>__NAGWEB_INTERACTION_STUDIO__.organicEngine),'mesh-v3');
  assert.equal(await page.$eval('#organicMeshCanvas',el=>getComputedStyle(el).display),'block');
  assert.equal(await page.$eval('#organicCanvas',el=>getComputedStyle(el).display),'none');

  await page.select('#organicEngine','slices-v2');await new Promise(r=>setTimeout(r,500));
  assert.equal(await page.evaluate(()=>__NAGWEB_INTERACTION_STUDIO__.organicEngine),'slices-v2');
  assert.equal(await page.$eval('#organicCanvas',el=>getComputedStyle(el).display),'block');
  assert.equal(await page.$eval('#organicMeshCanvas',el=>getComputedStyle(el).display),'none');

  await page.select('#organicEngine','mesh-v3');await new Promise(r=>setTimeout(r,650));
  assert.equal(await page.evaluate(()=>__NAGWEB_INTERACTION_STUDIO__.organicEngine),'mesh-v3');
  assert.equal(await page.$eval('#organicMeshCanvas',el=>getComputedStyle(el).display),'block');

  await page.$eval('#influence',el=>{el.checked=false;el.dispatchEvent(new Event('change',{bubbles:true}));});
  assert.equal(await page.evaluate(()=>__NAGWEB_INTERACTION_STUDIO__.influenceField===null),true);
  await page.$eval('#influence',el=>{el.checked=true;el.dispatchEvent(new Event('change',{bubbles:true}));});
  assert.equal(await page.evaluate(()=>!!__NAGWEB_INTERACTION_STUDIO__.influenceField),true);
  assert.equal(await page.evaluate(()=>__NAGWEB_INTERACTION_STUDIO__.influenceField.options.sourceMode),'body');
  await page.select('#influenceSource','head');await new Promise(r=>setTimeout(r,80));
  assert.equal(await page.evaluate(()=>__NAGWEB_INTERACTION_STUDIO__.influenceField.options.sourceMode),'head');
  await page.select('#influenceSource','body');await new Promise(r=>setTimeout(r,80));
  assert.equal(await page.evaluate(()=>__NAGWEB_INTERACTION_STUDIO__.influenceField.options.sourceMode),'body');
  const headlineTargets=await page.evaluate(()=>__NAGWEB_INTERACTION_STUDIO__.influenceField.targetCount);
  assert.equal(headlineTargets,10);
  await page.select('#influenceTargets','all');await new Promise(r=>setTimeout(r,100));
  const allTargets=await page.evaluate(()=>__NAGWEB_INTERACTION_STUDIO__.influenceField.targetCount);
  assert.ok(allTargets>headlineTargets,'complex scenario should add content targets');
  const weights=await page.evaluate(()=>__NAGWEB_INTERACTION_STUDIO__.influenceField.targetWeights);
  assert.ok(weights.includes(1)&&weights.some(v=>v<.6)&&weights.some(v=>v>.6&&v<1),'real-content targets should expose headline, copy and CTA weights');

  await page.click('#editTargets');await new Promise(r=>setTimeout(r,80));
  assert.equal(await page.evaluate(()=>__NAGWEB_INTERACTION_STUDIO__.targetEditing),true);
  assert.equal(await page.$eval('#influenceTargets',el=>el.value),'custom');
  const candidate=await page.$('[data-nw-target-id="content-0"]');assert.ok(candidate);
  await candidate.click();await new Promise(r=>setTimeout(r,60));
  assert.equal(await page.$eval('#targetEditor',el=>el.hidden),false);
  assert.equal(await page.$eval('#targetEnabled',el=>el.checked),true);
  await page.$eval('#targetEnabled',el=>{el.checked=false;el.dispatchEvent(new Event('change',{bubbles:true}));});await new Promise(r=>setTimeout(r,80));
  assert.equal(await page.$eval('[data-nw-target-id="content-0"]',el=>el.getAttribute('data-nw-reactive')),'0');

  const headline=await page.$('[data-nw-target-id="headline-0"]');await headline.click();await new Promise(r=>setTimeout(r,60));
  await page.select('#targetReactionProfile','tilt');await new Promise(r=>setTimeout(r,60));
  assert.equal(await page.$eval('[data-nw-target-id="headline-0"]',el=>el.getAttribute('data-nw-reaction-profile')),'tilt');
  assert.equal(await page.$eval('[data-nw-target-id="headline-0"]',el=>Number(el.getAttribute('data-nw-influence-weight'))),.78);
  assert.deepEqual(await page.$eval('[data-nw-target-id="headline-0"]',el=>({
    move:Number(el.getAttribute('data-nw-influence-move')),
    rotate:Number(el.getAttribute('data-nw-influence-rotate')),
    scale:Number(el.getAttribute('data-nw-influence-scale'))
  })),{move:1,rotate:1,scale:0});
  assert.equal(await page.$eval('[data-nw-target-id="headline-0"]',el=>Number(el.getAttribute('data-nw-influence-return'))),1.05);
  await page.$eval('#targetWeight',el=>{el.value='.37';el.dispatchEvent(new Event('input',{bubbles:true}));});await new Promise(r=>setTimeout(r,50));
  assert.equal(await page.$eval('#targetReactionProfile',el=>el.value),'custom');
  assert.equal(await page.$eval('[data-nw-target-id="headline-0"]',el=>el.getAttribute('data-nw-reaction-profile')),'custom');
  await page.$eval('#targetRotate',el=>{el.checked=false;el.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.$eval('#targetScale',el=>{el.checked=false;el.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.$eval('#targetReturn',el=>{el.value='1.65';el.dispatchEvent(new Event('input',{bubbles:true}));});
  const headline2=await page.$('[data-nw-target-id="headline-1"]');
  await page.keyboard.down('Shift');await headline2.click();await page.keyboard.up('Shift');await new Promise(r=>setTimeout(r,60));
  assert.deepEqual((await page.evaluate(()=>__NAGWEB_INTERACTION_STUDIO__.selectedTargetIds)).sort(),['headline-0','headline-1']);
  await page.$eval('#targetReturn',el=>{el.value='1.4';el.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await page.$eval('[data-nw-target-id="headline-0"]',el=>Number(el.getAttribute('data-nw-influence-return'))),1.4);
  assert.equal(await page.$eval('[data-nw-target-id="headline-1"]',el=>Number(el.getAttribute('data-nw-influence-return'))),1.4);
  assert.equal(await page.$eval('[data-nw-target-id="headline-0"]',el=>Number(el.getAttribute('data-nw-influence-weight'))),.37);
  const headline3=await page.$('[data-nw-target-id="headline-2"]');await headline3.click();await new Promise(r=>setTimeout(r,50));
  await page.select('#targetReactionProfile','pulse');await new Promise(r=>setTimeout(r,50));
  assert.equal(await page.$eval('[data-nw-target-id="headline-2"]',el=>el.getAttribute('data-nw-reaction-profile')),'pulse');
  assert.equal(await page.$eval('[data-nw-target-id="headline-2"]',el=>Number(el.getAttribute('data-nw-influence-scale'))),1);
  assert.deepEqual(await page.$eval('[data-nw-target-id="headline-0"]',el=>({
    move:Number(el.getAttribute('data-nw-influence-move')),
    rotate:Number(el.getAttribute('data-nw-influence-rotate')),
    scale:Number(el.getAttribute('data-nw-influence-scale'))
  })),{move:1,rotate:0,scale:0});
  assert.equal(await page.evaluate(()=>__NAGWEB_INTERACTION_STUDIO__.influenceField),null);
  await page.click('#editTargets');await new Promise(r=>setTimeout(r,120));
  assert.equal(await page.evaluate(()=>__NAGWEB_INTERACTION_STUDIO__.targetEditing),false);
  assert.equal(await page.evaluate(()=>__NAGWEB_INTERACTION_STUDIO__.influenceField.getTargetWeight('headline-0')),.37);
  assert.deepEqual(await page.evaluate(()=>__NAGWEB_INTERACTION_STUDIO__.influenceField.getTargetResponse('headline-0')),{move:1,rotate:0,scale:0});
  assert.equal(await page.evaluate(()=>__NAGWEB_INTERACTION_STUDIO__.influenceField.getTargetReturnSpeed('headline-0')),1.4);
  assert.equal(await page.evaluate(()=>__NAGWEB_INTERACTION_STUDIO__.influenceField.getTargetReturnSpeed('headline-1')),1.4);
  assert.equal(await page.evaluate(()=>__NAGWEB_INTERACTION_STUDIO__.influenceField.getTargetProfile('headline-2')),'pulse');

  const bodyOpts=await page.evaluate(()=>__NAGWEB_INTERACTION_STUDIO__.influenceField.options);
  assert.equal(bodyOpts.sweptBody,true);assert.ok(bodyOpts.sourceRadius>0);

  await page.click('#export');
  const exported=await page.$eval('#sessionJson',el=>el.value);
  const data=JSON.parse(exported);assert.equal(data.schema,'nagweb-interaction-session');assert.equal(data.version,1);assert.equal(data.organicRenderer,'mesh-v3');assert.ok(data.organicOptions.headFlex<data.organicOptions.torsoFlex);assert.ok(data.organicOptions.headZoneEnd<data.organicOptions.torsoZoneEnd);assert.equal(data.influenceOptions.sourceMode,'body');assert.equal(data.influenceOptions.targetScenario,'custom');assert.equal(data.influenceOptions.sweptBody,true);assert.ok(data.influenceOptions.targetSelection.length>10);assert.equal(data.influenceOptions.targetSelection.find(t=>t.id==='content-0').enabled,false);assert.equal(data.influenceOptions.targetSelection.find(t=>t.id==='headline-0').weight,.37);assert.deepEqual(data.influenceOptions.targetSelection.find(t=>t.id==='headline-0').response,{move:1,rotate:0,scale:0});assert.equal(data.influenceOptions.targetSelection.find(t=>t.id==='headline-0').returnSpeed,1.4);assert.equal(data.influenceOptions.targetSelection.find(t=>t.id==='headline-1').returnSpeed,1.4);assert.equal(data.influenceOptions.targetSelection.find(t=>t.id==='headline-0').profile,'custom');assert.equal(data.influenceOptions.targetSelection.find(t=>t.id==='headline-2').profile,'pulse');assert.ok(data.assetProfile);assert.ok(data.preparationReport);

  const savedSize=data.display.size,savedHead=data.organicOptions.headZoneEnd;
  await page.$eval('#size',el=>{el.value='180';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.$eval('#sessionJson',(el,value)=>{el.value=value;},exported);
  await page.click('#applySession');await new Promise(r=>setTimeout(r,500));
  assert.equal(Number(await page.$eval('#size',el=>el.value)),savedSize);
  assert.ok(Math.abs((await page.evaluate(()=>__NAGWEB_INTERACTION_STUDIO__.zones.headEnd))-savedHead)<.0001);
  assert.equal(await page.$eval('#preset',el=>el.value),'custom');
  const restoredSelection=await page.evaluate(()=>__NAGWEB_INTERACTION_STUDIO__.targetSelection);
  assert.equal(restoredSelection.find(t=>t.id==='content-0').enabled,false);
  assert.equal(restoredSelection.find(t=>t.id==='headline-0').weight,.37);
  assert.deepEqual(restoredSelection.find(t=>t.id==='headline-0').response,{move:1,rotate:0,scale:0});
  assert.equal(restoredSelection.find(t=>t.id==='headline-0').returnSpeed,1.4);
  assert.equal(restoredSelection.find(t=>t.id==='headline-1').returnSpeed,1.4);
  assert.equal(restoredSelection.find(t=>t.id==='headline-0').profile,'custom');
  assert.equal(restoredSelection.find(t=>t.id==='headline-2').profile,'pulse');

  await page.$eval('#organicMeshCanvas',c=>c.dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
  await page.waitForFunction(()=>window.__NAGWEB_INTERACTION_STUDIO__.organicEngine==='slices-v2',{timeout:5000});
  assert.equal(await page.$eval('#organicCanvas',el=>getComputedStyle(el).display),'block');

  assert.equal(errors.length,0,'Interaction Studio should have no page errors: '+errors.join('\n'));
  fs.mkdirSync('/tmp/nagweb-interaction-v1',{recursive:true});
  await page.screenshot({path:'/tmp/nagweb-interaction-v1/interaction-studio-v1.png',fullPage:true});
  console.log('NagWeb Interaction Studio V2.5 Influence 1.9 browser smoke: PASS');
}finally{await browser.close();}
