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
  await page.waitForFunction(()=>window.__NAGWEB_INTERACTION_V1__&&window.NAGWEB_INTERACTION_ENGINE&&window.NAGWEB_INTERACTION_ASSET_PREP&&window.NAGWEB_INTERACTION_INFLUENCE,{timeout:10000});
  await page.waitForFunction(()=>document.querySelector('#analysis')?.dataset.ready==='1',{timeout:10000});

  const initial=await page.evaluate(()=>({
    version:NAGWEB_INTERACTION_ENGINE.version,
    prepVersion:NAGWEB_INTERACTION_ASSET_PREP.version,
    influenceVersion:NAGWEB_INTERACTION_INFLUENCE.version,
    prep:(()=>{const el=document.querySelector('#analysis');return {ready:el.dataset.ready,text:el.textContent};})(),
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
  assert.equal(initial.version,'1.5.0');
  assert.equal(initial.prepVersion,'1.2.0');
  assert.equal(initial.influenceVersion,'1.12.0');
  assert.equal(initial.prep.ready,'1');
  assert.ok(initial.prep.text.includes('Recomendación'));
  assert.ok(initial.title.includes('Interaction Engine'));
  assert.deepEqual(initial.controls,{upload:true,preset:true,size:true,directions:4,config:true});
  const runtimeInitial=await page.evaluate(()=>NAGWEB_INTERACTION_ENGINE.runtimeStats());
  assert.equal(runtimeInitial.instances,1);
  assert.ok(runtimeInitial.active>=2,'follower and influence field should share the ticker');
  assert.equal(runtimeInitial.running,true);
  assert.equal(runtimeInitial.pointerHubs,1);
  assert.equal(runtimeInitial.pointerSubscribers,1);

  const box=await page.$eval('#stage',el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
  await page.mouse.move(box.x+box.width*.82,box.y+box.height*.70);
  await new Promise(r=>setTimeout(r,500));
  const moved=await page.evaluate(()=>({x:__NAGWEB_INTERACTION_V1__.engine.state.x,y:__NAGWEB_INTERACTION_V1__.engine.state.y}));
  assert.ok(Math.hypot(moved.x-initial.state.x,moved.y-initial.state.y)>5,'follower should move after pointer input');

  await page.mouse.move(box.x+box.width*.50,box.y+box.height*.50);
  await new Promise(r=>setTimeout(r,350));
  const influenced=await page.$$eval('#reactiveWord span',els=>els.map(el=>el.style.translate));
  assert.ok(influenced.some(v=>v&&v!=='0.00px 0.00px'),'nearby letters should be displaced by the follower');

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
  const size=await page.$eval('#target',el=>({width:el.offsetWidth,height:el.offsetHeight}));
  assert.ok(Math.abs(Math.max(size.width,size.height)-260)<2,'asset base longest side should follow size control');

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
  assert.equal(multi.created.pointerHubs,multi.baseline.pointerHubs,'followers on one stage must share a single pointer hub');
  assert.equal(multi.created.pointerSubscribers,multi.baseline.pointerSubscribers+24,'pointer hub should track subscribers without extra DOM listeners');
  assert.equal(multi.halfPaused.active,multi.baseline.active+12,'paused followers should leave the shared ticker');
  assert.ok(multi.frameDelta>2&&multi.frameDelta<40,'24 followers should advance on one shared frame clock');
  assert.equal(multi.restored.preset,'agile');
  assert.equal(multi.cleaned,true,'destroy should restore inline motion styles');
  assert.equal(multi.final.instances,multi.baseline.instances,'destroy should release every stress instance');
  assert.equal(multi.final.active,multi.baseline.active,'destroy should release every stress tick');
  assert.equal(multi.final.pointerSubscribers,multi.baseline.pointerSubscribers,'destroy should release pointer subscriptions');

  const broadphase=await page.evaluate(async()=>{
    const stage=document.querySelector('#stage'),r=stage.getBoundingClientRect(),items=[];
    let sourcePath=[
      {x:r.left+38,y:r.top+42},
      {x:r.left+92,y:r.top+42},
      {x:r.left+148,y:r.top+56}
    ];
    for(let i=0;i<120;i++){
      const d=document.createElement('div');
      d.style.position='absolute';d.style.width='14px';d.style.height='14px';d.style.pointerEvents='none';
      if(i<12){
        d.style.left=(28+(i%6)*22)+'px';d.style.top=(28+Math.floor(i/6)*24)+'px';
      }else{
        d.style.left=Math.max(260,r.width-180+(i%6)*18)+'px';
        d.style.top=Math.max(220,r.height-160+Math.floor((i%30)/6)*18)+'px';
      }
      stage.appendChild(d);items.push(d);
    }
    const field=NAGWEB_INTERACTION_INFLUENCE.createField({
      source:()=>({points:sourcePath}),
      targets:items,
      radius:72,
      sourceRadius:10,
      sweptBody:true,
      maxSweepDistance:220
    });
    await new Promise(resolve=>setTimeout(resolve,180));
    const near=field.stats;
    sourcePath=[
      {x:r.right+1600,y:r.bottom+1600},
      {x:r.right+1700,y:r.bottom+1600},
      {x:r.right+1800,y:r.bottom+1650}
    ];
    await new Promise(resolve=>setTimeout(resolve,1500));
    const asleep=field.stats;
    const wakesBefore=asleep.wakes;
    sourcePath=[
      {x:r.left+38,y:r.top+42},
      {x:r.left+92,y:r.top+42},
      {x:r.left+148,y:r.top+56}
    ];
    await new Promise(resolve=>setTimeout(resolve,180));
    const rewake=field.stats;
    field.destroy();items.forEach(el=>el.remove());
    return {near,asleep,rewake,wakesBefore};
  });
  assert.equal(broadphase.near.broadphase,true);
  assert.equal(broadphase.near.targetCount,120);
  assert.equal(broadphase.near.lastEvaluated+broadphase.near.lastCulled,120);
  assert.ok(broadphase.near.lastCulled>=80,'broadphase should reject most distant targets before path math');
  assert.ok(broadphase.near.lastEvaluated>0,'nearby targets must still reach precise influence math');
  assert.ok(broadphase.near.evaluatedTargets<broadphase.near.culledTargets,'stress run should spend less precise work on distant targets');
  assert.equal(broadphase.near.sleepWake,true);
  assert.ok(broadphase.near.sleepingTargets>=80,'most distant targets should remain asleep');
  assert.ok(broadphase.near.lastSkippedWrites>=80,'sleeping targets should skip per-frame DOM writes');
  assert.ok(broadphase.near.lastDomWrites<40,'only nearby or settling targets should write motion styles');
  assert.ok(broadphase.near.skippedWrites>broadphase.near.domWrites,'stress run should skip more DOM writes than it performs');
  assert.equal(broadphase.asleep.sleepingTargets,120,'all targets should sleep after the body moves far away and they settle');
  assert.equal(broadphase.asleep.lastSkippedWrites,120,'a fully sleeping field should perform no unnecessary motion writes');
  assert.equal(broadphase.asleep.lastDomWrites,0,'sleeping targets should leave the DOM untouched');
  assert.ok(broadphase.rewake.wakes>broadphase.wakesBefore,'nearby targets should wake when the body returns');
  assert.ok(broadphase.rewake.sleepingTargets<120,'returning body should reactivate nearby targets');

  const dynamicTargets=await page.evaluate(async()=>{
    const stage=document.querySelector('#stage'),sr=stage.getBoundingClientRect();
    function make(id,left){
      const el=document.createElement('div');
      el.setAttribute('data-nw-target-id',id);
      el.style.cssText='position:absolute;width:18px;height:18px;left:'+left+'px;top:80px;pointer-events:none';
      stage.appendChild(el);return el;
    }
    const a=make('dyn-a',80),b=make('dyn-b',140),c=make('dyn-c',200);
    const field=NAGWEB_INTERACTION_INFLUENCE.createField({
      source:()=>({x:sr.right+5000,y:sr.bottom+5000}),
      targets:[a],
      radius:80
    });
    field.setTargetWeight('dyn-a',.4);
    field.impulseTarget('dyn-a',{x:30,y:-8,rotation:4,scale:.04,strength:1});
    const aBefore=field.getTargetState('dyn-a');
    const added=field.addTarget(b);
    const duplicate=field.addTarget(b);
    const aAfterAdd=field.getTargetState('dyn-a');
    const countAfterAdd=field.targetCount;
    const setCount=field.setTargets([a,b,c]);
    const aAfterSet=field.getTargetState('dyn-a');
    const weightAfterSet=field.getTargetWeight('dyn-a');
    const removed=field.removeTarget('dyn-a');
    const removedState=field.getTargetState('dyn-a');
    const restoredA={translate:a.style.translate,rotate:a.style.rotate,scale:a.style.scale};
    field.setTargetWeight('dyn-b',.73);
    field.setTargets([b]);
    const final={count:field.targetCount,bWeight:field.getTargetWeight('dyn-b'),hasB:field.hasTarget('dyn-b'),hasC:field.hasTarget('dyn-c')};
    field.destroy();[a,b,c].forEach(el=>el.remove());
    return {added,duplicate,countAfterAdd,setCount,aBefore,aAfterAdd,aAfterSet,weightAfterSet,removed,removedState,restoredA,final};
  });
  assert.equal(dynamicTargets.added,true);
  assert.equal(dynamicTargets.duplicate,false,'adding the same DOM target twice should be ignored');
  assert.equal(dynamicTargets.countAfterAdd,2);
  assert.equal(dynamicTargets.setCount,3);
  assert.equal(dynamicTargets.aAfterAdd.x,dynamicTargets.aBefore.x,'adding another target must preserve existing target state');
  assert.equal(dynamicTargets.aAfterSet.x,dynamicTargets.aBefore.x,'setTargets diff must preserve retained target state');
  assert.equal(dynamicTargets.weightAfterSet,.4,'setTargets diff must preserve retained target configuration');
  assert.equal(dynamicTargets.removed,true);
  assert.equal(dynamicTargets.removedState,null);
  assert.deepEqual(dynamicTargets.restoredA,{translate:'',rotate:'',scale:''},'removing a target must restore its motion styles');
  assert.deepEqual(dynamicTargets.final,{count:1,bWeight:.73,hasB:true,hasC:false});

  const composed=await page.evaluate(async()=>{
    const stage=document.querySelector('#stage'),d=document.createElement('div');
    d.style.cssText='position:absolute;left:0;top:0;width:40px;height:40px;transform:rotate(12deg);background:#fff';
    stage.appendChild(d);
    const before=d.style.transform;
    const f=NAGWEB_INTERACTION_ENGINE.createFollower(d,{area:stage,renderMode:'variables',preset:'soft'});
    f.setTarget(120,90,'area');await new Promise(r=>setTimeout(r,120));
    const during={transform:d.style.transform,x:d.style.getPropertyValue('--nw-if-x'),mode:f.status.renderMode};
    f.destroy();
    const after={transform:d.style.transform,x:d.style.getPropertyValue('--nw-if-x')};d.remove();
    return {before,during,after};
  });
  assert.equal(composed.during.mode,'variables');
  assert.equal(composed.during.transform,composed.before,'variables mode must preserve existing transform');
  assert.ok(composed.during.x,'variables mode should emit motion variables');
  assert.equal(composed.after.transform,composed.before,'destroy must preserve original transform');
  assert.equal(composed.after.x,'','destroy must restore motion variables');

  assert.equal(pageErrors.length,0,'page should have no JS errors: '+pageErrors.join('\n'));
  fs.mkdirSync('/tmp/nagweb-interaction-v1',{recursive:true});
  await page.screenshot({path:'/tmp/nagweb-interaction-v1/lab-desktop.png',fullPage:true});

  const mobile=await browser.newPage();
  await mobile.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await mobile.goto(process.env.NAGWEB_INTERACTION_URL||'http://127.0.0.1:4173/experiments/interaction-engine-v1.html',{waitUntil:'domcontentloaded',timeout:30000});
  await mobile.waitForFunction(()=>window.__NAGWEB_INTERACTION_V1__&&window.NAGWEB_INTERACTION_ENGINE&&window.NAGWEB_INTERACTION_INFLUENCE,{timeout:10000});
  const mbox=await mobile.$eval('#stage',el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
  const mstart=await mobile.evaluate(()=>({x:__NAGWEB_INTERACTION_V1__.engine.state.x,y:__NAGWEB_INTERACTION_V1__.engine.state.y}));
  await mobile.touchscreen.tap(mbox.x+mbox.width*.75,mbox.y+mbox.height*.35);
  await new Promise(r=>setTimeout(r,300));
  const mend=await mobile.evaluate(()=>({x:__NAGWEB_INTERACTION_V1__.engine.state.x,y:__NAGWEB_INTERACTION_V1__.engine.state.y}));
  assert.ok(Math.hypot(mend.x-mstart.x,mend.y-mstart.y)>1,'touch pointerdown should steer follower');
  await mobile.screenshot({path:'/tmp/nagweb-interaction-v1/lab-mobile.png',fullPage:true});
  await mobile.close();

  const reduced=await browser.newPage();
  await reduced.setViewport({width:900,height:650,deviceScaleFactor:1});
  await reduced.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  await reduced.goto(process.env.NAGWEB_INTERACTION_URL||'http://127.0.0.1:4173/experiments/interaction-engine-v1.html',{waitUntil:'domcontentloaded',timeout:30000});
  await reduced.waitForFunction(()=>window.__NAGWEB_INTERACTION_V1__&&window.NAGWEB_INTERACTION_ENGINE&&window.NAGWEB_INTERACTION_INFLUENCE,{timeout:10000});
  const rb=await reduced.$eval('#stage',el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
  const r0=await reduced.evaluate(()=>({x:__NAGWEB_INTERACTION_V1__.engine.state.x,y:__NAGWEB_INTERACTION_V1__.engine.state.y}));
  await reduced.mouse.move(rb.x+rb.width*.9,rb.y+rb.height*.2);
  await new Promise(r=>setTimeout(r,250));
  const r1=await reduced.evaluate(()=>({x:__NAGWEB_INTERACTION_V1__.engine.state.x,y:__NAGWEB_INTERACTION_V1__.engine.state.y}));
  assert.ok(Math.hypot(r1.x-r0.x,r1.y-r0.y)<1,'reduced motion should keep follower resting');
  await reduced.close();

  console.log('NagWeb Interaction Engine V1.12 declarative-config browser smoke: PASS');
} finally {
  await browser.close();
}
