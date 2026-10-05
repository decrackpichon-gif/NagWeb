import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const candidates=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const executablePath=candidates.find(p=>fs.existsSync(p));if(!executablePath)throw new Error('No Chromium/Chrome executable found');
const browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
  const page=await browser.newPage();await page.setViewport({width:1000,height:700,deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(String(e&&e.stack||e)));
  await page.goto('http://127.0.0.1:4173/experiments/interaction-engine-v1.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.addScriptTag({url:'http://127.0.0.1:4173/js/nagweb-interaction-target-registry-v1.js'});
  await page.waitForFunction(()=>window.NAGWEB_INTERACTION_TARGET_REGISTRY&&window.NAGWEB_INTERACTION_INFLUENCE&&window.NAGWEB_INTERACTION_ENGINE);

  const result=await page.evaluate(async()=>{
    const stage=document.querySelector('#stage'),root=document.createElement('div');
    root.style.cssText='position:absolute;inset:0;pointer-events:none';stage.appendChild(root);
    function make(id,left,active='1'){
      const el=document.createElement('div');el.setAttribute('data-nw-target-id',id);el.setAttribute('data-nw-reactive',active);
      el.style.cssText='position:absolute;left:'+left+'px;top:120px;width:20px;height:20px';root.appendChild(el);return el;
    }
    const a=make('reg-a',80),b=make('reg-b',140,'0');
    const field=NAGWEB_INTERACTION_INFLUENCE.createField({source:()=>({x:-10000,y:-10000}),targets:[],radius:60});
    const registry=NAGWEB_INTERACTION_TARGET_REGISTRY.createRegistry({root});
    const changes=[];registry.subscribe(s=>changes.push({revision:s.revision,ids:s.ids,added:s.added.length,removed:s.removed.length}));
    const unbind=registry.bindField(field);
    const initial={ids:registry.ids,count:field.targetCount};

    b.setAttribute('data-nw-reactive','1');
    await new Promise(r=>setTimeout(r,40));
    const enabled={ids:registry.ids,count:field.targetCount};

    field.setTargetWeight('reg-a',.42);
    const c=make('reg-c',200);
    await new Promise(r=>setTimeout(r,40));
    const afterAdd={ids:registry.ids,count:field.targetCount,aWeight:field.getTargetWeight('reg-a')};

    field.pause();
    field.impulseTarget('reg-a',{x:28,y:-7,rotation:4,scale:.03,strength:1});
    const beforeConfigState=field.getTargetState('reg-a');
    const calls={membership:0,all:0,updated:[]},setTargets=field.setTargets,syncTargets=field.syncTargets,syncTarget=field.syncTarget;
    field.setTargets=function(list){calls.membership++;return setTargets(list);};
    field.syncTargets=function(){calls.all++;return syncTargets();};
    field.syncTarget=function(el){calls.updated.push(el.getAttribute('data-nw-target-id'));return syncTarget(el);};
    let detail=null;const stopDetail=registry.subscribe(s=>{detail={updated:s.updated.map(el=>el.getAttribute('data-nw-target-id')),structure:s.structureChanged,config:s.configChanged};});
    a.setAttribute('data-nw-influence-weight','.77');
    a.setAttribute('data-nw-influence-move','0');
    a.setAttribute('data-nw-influence-rotate','1');
    a.setAttribute('data-nw-influence-scale','.5');
    a.setAttribute('data-nw-influence-return','1.65');
    a.setAttribute('data-nw-reaction-profile','external-profile');
    await new Promise(r=>setTimeout(r,40));
    const afterConfig={
      weight:field.getTargetWeight('reg-a'),
      response:field.getTargetResponse('reg-a'),
      returnSpeed:field.getTargetReturnSpeed('reg-a'),
      profile:field.getTargetProfile('reg-a'),
      state:field.getTargetState('reg-a'),
      revision:registry.revision
    };
    const incremental={calls:JSON.parse(JSON.stringify(calls)),detail};
    // Structural and configuration changes in one batch must retain both kinds of information.
    const d=make('reg-d',320);b.setAttribute('data-nw-influence-weight','.33');await new Promise(r=>setTimeout(r,40));
    const mixedBatch={count:field.targetCount,weight:field.getTargetWeight('reg-b'),detail};
    d.remove();await new Promise(r=>setTimeout(r,40));stopDetail();
    field.resume();

    a.remove();
    await new Promise(r=>setTimeout(r,40));
    const afterRemove={ids:registry.ids,count:field.targetCount,aState:field.getTargetState('reg-a')};

    const dup=make('reg-c',260);
    await new Promise(r=>setTimeout(r,40));
    const duplicates=registry.duplicates.slice();
    dup.remove();
    await new Promise(r=>setTimeout(r,20));

    unbind();registry.destroy();field.destroy();root.remove();
    return {initial,enabled,afterAdd,afterConfig,beforeConfigState,afterRemove,duplicates,changes,incremental,mixedBatch};
  });

  assert.deepEqual(result.initial,{ids:['reg-a'],count:1});
  assert.deepEqual(result.enabled.ids,['reg-a','reg-b']);assert.equal(result.enabled.count,2);
  assert.deepEqual(result.afterAdd.ids,['reg-a','reg-b','reg-c']);assert.equal(result.afterAdd.count,3);assert.equal(result.afterAdd.aWeight,.42);
  assert.equal(result.afterConfig.weight,.77);
  assert.deepEqual(result.afterConfig.response,{move:0,rotate:1,scale:.5});
  assert.equal(result.afterConfig.returnSpeed,1.65);assert.equal(result.afterConfig.profile,'external-profile');
  assert.equal(result.afterConfig.state.x,result.beforeConfigState.x,'attribute sync must preserve physical state');
  assert.equal(result.afterConfig.state.y,result.beforeConfigState.y,'attribute sync must preserve physical state');
  assert.deepEqual(result.incremental.calls,{membership:0,all:0,updated:['reg-a']},'Six attribute changes synchronize one target without remeasuring the field');
  assert.deepEqual(result.incremental.detail,{updated:['reg-a'],structure:false,config:true});
  assert.equal(result.mixedBatch.count,4);assert.equal(result.mixedBatch.weight,.33);
  assert.equal(result.mixedBatch.detail.structure,true);assert.equal(result.mixedBatch.detail.config,true);assert.deepEqual(result.mixedBatch.detail.updated,['reg-b']);
  assert.deepEqual(result.afterRemove.ids,['reg-b','reg-c']);assert.equal(result.afterRemove.count,2);assert.equal(result.afterRemove.aState,null);
  assert.deepEqual(result.duplicates,['reg-c']);
  assert.ok(result.changes.length>=4,'registry should publish coalesced membership changes');
  assert.equal(errors.length,0,'registry smoke should have no page errors: '+errors.join('\n'));
  console.log('NagWeb Interaction Target Registry V1.2 incremental browser smoke: PASS');
}finally{await browser.close();}
