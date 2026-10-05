import assert from 'node:assert/strict';

export async function runStudioRobustnessSmoke(page){
  const result=await page.evaluate(async()=>{
    const studio=__NAGWEB_INTERACTION_STUDIO__,field=studio.influenceField,stage=document.querySelector('#stage');
    const wait=()=>new Promise(resolve=>setTimeout(resolve,40));
    const originalCount=field.targetCount,root=document.createElement('div'),nodes=[];
    const ids=['__proto__','constructor','toString','card"\\[日本]'];
    root.style.cssText='position:absolute;inset:0;pointer-events:none';stage.append(root);await wait();
    field.pause();field.impulseTarget('headline-0',{x:24,y:-6,rotation:3,scale:.02,strength:1});
    const before=field.getTargetState('headline-0'),revision=studio.targetRegistry.revision;
    const fragment=document.createDocumentFragment();
    for(let i=0;i<140;i++){
      const n=document.createElement('span'),id=ids[i]||'robust-'+i;
      n.textContent='Objetivo '+i;n.style.cssText='position:absolute;left:'+(20+i%14*42)+'px;top:'+(40+Math.floor(i/14)*24)+'px;width:30px;height:16px';
      n.setAttribute('data-nw-target-id',id);n.setAttribute('data-nw-reactive',i%2?'0':'1');
      n.setAttribute('data-nw-influence-weight',i%2?'.4':'1.3');
      n.setAttribute('data-nw-influence-move',i%2?'.5':'1');n.setAttribute('data-nw-influence-rotate',i%2?'1':'0');n.setAttribute('data-nw-influence-scale',i%2?'0':'1');
      n.setAttribute('data-nw-influence-return',i%2?'1.5':'.7');
      fragment.append(n);nodes.push(n);
    }
    root.append(fragment);await wait();
    const added={same:studio.influenceField===field,count:field.targetCount,revision:studio.targetRegistry.revision-revision,state:field.getTargetState('headline-0')};
    const calls={membership:0,all:0,updated:[]},setTargets=field.setTargets,syncTargets=field.syncTargets,syncTarget=field.syncTarget;
    field.setTargets=function(list){calls.membership++;return setTargets(list);};
    field.syncTargets=function(){calls.all++;return syncTargets();};
    field.syncTarget=function(el){calls.updated.push(el.getAttribute('data-nw-target-id'));return syncTarget(el);};
    nodes[0].setAttribute('data-nw-influence-weight','1.31');nodes[0].setAttribute('data-nw-influence-weight','1.3');await wait();
    const incremental={calls:JSON.parse(JSON.stringify(calls)),state:field.getTargetState('headline-0')};
    field.setTargets=setTargets;field.syncTargets=syncTargets;field.syncTarget=syncTarget;
    const expectedIds=nodes.map(n=>n.getAttribute('data-nw-target-id'));
    const selected=studio.selectTargets(expectedIds.concat('missing-object'),'replace');
    const mixed={move:document.querySelector('#targetMove').indeterminate,rotate:document.querySelector('#targetRotate').indeterminate,scale:document.querySelector('#targetScale').indeterminate,weight:document.querySelector('#targetWeightOut').value,speed:document.querySelector('#targetReturnOut').value};
    const rotate=document.querySelector('#targetRotate');rotate.checked=true;rotate.dispatchEvent(new Event('change',{bubbles:true}));await wait();
    const channels=nodes.map((n,i)=>({move:Number(n.getAttribute('data-nw-influence-move')),rotate:Number(n.getAttribute('data-nw-influence-rotate')),scale:Number(n.getAttribute('data-nw-influence-scale'))}));
    studio.selectTargets([ids[3],ids[0]],'replace');
    const weight=document.querySelector('#targetWeight');weight.value='1.7';weight.dispatchEvent(new Event('input',{bubbles:true}));await wait();
    const encoded=JSON.stringify(studio.getSession()),saved=JSON.parse(encoded);
    const special=saved.influenceOptions.targetSelection.filter(t=>ids.includes(t.id));
    // Restore after changing the DOM config; IDs must be matched literally, including prototype-like names.
    nodes[0].setAttribute('data-nw-influence-weight','.2');nodes[3].setAttribute('data-nw-influence-weight','.2');await wait();
    await studio.applySession(encoded);await wait();
    const restored={weights:[field.getTargetWeight(ids[0]),Number(nodes[3].getAttribute('data-nw-influence-weight'))],same:studio.influenceField===field,state:field.getTargetState('headline-0')};
    studio.selectTargets(expectedIds,'replace');nodes.slice(0,20).forEach(n=>n.remove());await wait();
    const removed={count:field.targetCount,selected:studio.selectedTargetIds.length,primary:document.querySelector('#targetName').textContent,state:field.getTargetState('headline-0')};
    // A preview outside target editing owns temporary motion and must preserve a manually paused field.
    studio.selectTargets(['robust-20'],'replace');const state=field.getTargetState('robust-20');studio.previewTargets();await wait();
    const previewPaused={paused:field.paused,state:field.getTargetState('robust-20'),active:studio.previewActive};studio.clearPreview();const manualPauseKept=field.paused;
    field.resume();studio.previewTargets();await wait();const pausedDuringLivePreview=field.paused;studio.clearPreview();const resumedAfterLivePreview=!field.paused;
    studio.previewTargets();await wait();const config=document.querySelector('#influenceSource');config.value='head';config.dispatchEvent(new Event('change',{bubbles:true}));const clearedOnChange=!studio.previewActive&&!field.paused;config.value='body';config.dispatchEvent(new Event('change',{bubbles:true}));
    studio.selectTargets([]);root.remove();await wait();
    const final={count:field.targetCount,selected:studio.selectedTargetIds,hidden:document.querySelector('#targetEditor').hidden,same:studio.influenceField===field,preview:studio.previewActive};
    return {originalCount,before,added,incremental,expectedIds,selected,mixed,channels,special,restored,removed,state,previewPaused,manualPauseKept,pausedDuringLivePreview,resumedAfterLivePreview,clearedOnChange,final};
  });
  assert.equal(result.added.same,true);assert.equal(result.added.count,result.originalCount+70);assert.equal(result.added.revision,1,'One DOM batch should publish one registry update');assert.deepEqual(result.added.state,result.before);
  assert.deepEqual(result.incremental.calls,{membership:0,all:0,updated:['__proto__']},'Editing one target in a large composition must not synchronize or measure all targets');assert.deepEqual(result.incremental.state,result.before);
  assert.deepEqual(result.selected,result.expectedIds,'Unknown IDs must not inflate a real selection');
  assert.deepEqual(result.mixed,{move:false,rotate:true,scale:true,weight:'Mixto',speed:'Mixto'},'Different nonzero strengths still mean the Move channel is enabled for every target');
  result.channels.forEach((v,i)=>assert.deepEqual(v,{move:i%2?.5:1,rotate:1,scale:i%2?0:1},'A group edit changes only its selected channel'));
  assert.equal(result.special.length,4,'Special IDs must survive export');assert.equal(result.special.find(t=>t.id==='__proto__').weight,1.7);
  assert.deepEqual(result.restored.weights,[1.7,1.7]);assert.equal(result.restored.same,true);assert.deepEqual(result.restored.state,result.before,'Session restore must retain existing target physics');
  assert.equal(result.removed.count,result.originalCount+60);assert.equal(result.removed.selected,120);assert.match(result.removed.primary,/120 elementos/);assert.deepEqual(result.removed.state,result.before);
  assert.equal(result.previewPaused.paused,true);assert.equal(result.previewPaused.active,true);assert.deepEqual(result.previewPaused.state,result.state,'Preview cannot advance the main field at the same time');
  assert.equal(result.manualPauseKept,true);assert.equal(result.pausedDuringLivePreview,true);assert.equal(result.resumedAfterLivePreview,true);assert.equal(result.clearedOnChange,true);
  assert.deepEqual(result.final,{count:result.originalCount,selected:[],hidden:true,same:true,preview:false});
  console.log('Interaction Studio robustness: 140 mixed targets, batched updates, literal IDs, group channels, session roundtrip, partial removal, exclusive previews and final cleanup PASS');
}

export async function runStudioPreparationSmoke(page){
  const result=await page.evaluate(async()=>{
    const studio=__NAGWEB_INTERACTION_STUDIO__,M=NAGWEB_ORGANIC_MESH,O=NAGWEB_ORGANIC_FOLLOWER;
    const originals={mesh:M.prepareAsset,slices:O.rotateAndCrop,meshRenderer:M.createRenderer,slicesRenderer:O.createRenderer};
    const jobs=[],created={mesh:0,slices:0},destroyed={mesh:0,slices:0};
    const tick=async()=>{await Promise.resolve();await Promise.resolve();};
    function defer(kind,args){return new Promise((resolve,reject)=>jobs.push({kind,args,resolve,reject}));}
    async function release(job){job.resolve(await originals[job.kind](...job.args));}
    function wrap(kind,fn){return function(options){
      created[kind]++;const renderer=fn(options),destroy=renderer.destroy;
      renderer.destroy=function(){destroyed[kind]++;return destroy();};return renderer;
    };}
    M.prepareAsset=(...args)=>defer('mesh',args);O.rotateAndCrop=(...args)=>defer('slices',args);
    M.createRenderer=wrap('mesh',originals.meshRenderer);O.createRenderer=wrap('slices',originals.slicesRenderer);
    try{
      await studio.switchMode('follower');
      // An old failed Mesh request must not start fallback after Slices won.
      const oldFailure=studio.switchMode('organic'),newSlices=studio.switchOrganicEngine('slices-v2');
      await release(jobs[1]);await newSlices;const winningSlices=studio.organicRenderer;
      jobs[0].reject(new Error('Obsolete mesh request'));await oldFailure;
      const staleFailure={same:studio.organicRenderer===winningSlices,engine:studio.organicEngine,jobs:jobs.length,created:{...created}};
      // Likewise, an old successful preparation cannot install a renderer.
      const oldSuccess=studio.switchOrganicEngine('mesh-v3'),latest=studio.switchOrganicEngine('slices-v2');
      await release(jobs[3]);await latest;const latestRenderer=studio.organicRenderer;
      await release(jobs[2]);await oldSuccess;
      const staleSuccess={same:studio.organicRenderer===latestRenderer,engine:studio.organicEngine,created:{...created},destroyed:{...destroyed}};
      const pendingMode=studio.switchOrganicEngine('mesh-v3');await studio.switchMode('follower');
      await release(jobs[4]);await pendingMode;
      const follower={mode:studio.mode,renderer:studio.organicRenderer,display:getComputedStyle(document.querySelector('#followerVisual')).display,radius:studio.influenceField.options.sourceRadius,created:{...created},destroyed:{...destroyed}};
      // Session application stays pending until its renderer is installed.
      const saved=studio.getSession();saved.mode='organic';saved.organicRenderer='mesh-v3';
      document.querySelector('#prepStatus').textContent='Esperando';
      let settled=false;const restoring=studio.applySession(JSON.stringify(saved)).then(v=>{settled=true;return v;});await tick();
      const pendingRestore={settled,renderer:studio.organicRenderer,status:document.querySelector('#prepStatus').textContent};
      await release(jobs[5]);await restoring;
      const restored={settled,engine:studio.organicEngine,renderer:!!studio.organicRenderer,radius:studio.influenceField.options.sourceRadius,status:document.querySelector('#prepStatus').textContent};
      const supersededRestore=studio.applySession(JSON.stringify(saved));await studio.switchMode('follower');
      document.querySelector('#prepStatus').textContent='Última elección';jobs[6].reject(new Error('Obsolete session'));await supersededRestore;
      const canceledRestore={mode:studio.mode,renderer:studio.organicRenderer,status:document.querySelector('#prepStatus').textContent};
      // A current failure still falls back, and that fallback can itself be canceled.
      const fallback=studio.switchMode('organic');jobs[7].reject(new Error('Expected WebGL failure'));await tick();
      await release(jobs[8]);await fallback;
      const fallbackResult={engine:studio.organicEngine,renderer:!!studio.organicRenderer,radius:studio.influenceField.options.sourceRadius,status:document.querySelector('#prepStatus').textContent};
      const pendingFallback=studio.switchOrganicEngine('mesh-v3');jobs[9].reject(new Error('Delayed fallback'));await tick();
      await studio.switchMode('follower');await release(jobs[10]);await pendingFallback;
      const canceledFallback={mode:studio.mode,renderer:studio.organicRenderer,created:{...created},destroyed:{...destroyed}};
      return {staleFailure,staleSuccess,follower,pendingRestore,restored,canceledRestore,fallbackResult,canceledFallback};
    }finally{
      M.prepareAsset=originals.mesh;O.rotateAndCrop=originals.slices;
      M.createRenderer=originals.meshRenderer;O.createRenderer=originals.slicesRenderer;
      document.querySelector('#organicEngine').value='mesh-v3';await studio.switchMode('organic');
    }
  });
  assert.deepEqual(result.staleFailure,{same:true,engine:'slices-v2',jobs:2,created:{mesh:0,slices:1}},'Obsolete errors must not launch fallback or overwrite the latest renderer');
  assert.deepEqual(result.staleSuccess,{same:true,engine:'slices-v2',created:{mesh:0,slices:2},destroyed:{mesh:0,slices:1}});
  assert.deepEqual(result.follower,{mode:'follower',renderer:null,display:'grid',radius:0,created:{mesh:0,slices:2},destroyed:{mesh:0,slices:2}},'Follower mode must release the organic renderer and cancel pending work');
  assert.deepEqual(result.pendingRestore,{settled:false,renderer:null,status:'Esperando'});
  assert.equal(result.restored.settled,true);assert.equal(result.restored.engine,'mesh-v3');assert.equal(result.restored.renderer,true);assert.ok(result.restored.radius>0);assert.match(result.restored.status,/Configuración restaurada/);
  assert.deepEqual(result.canceledRestore,{mode:'follower',renderer:null,status:'Última elección'},'A superseded session must not report success');
  assert.equal(result.fallbackResult.engine,'slices-v2');assert.equal(result.fallbackResult.renderer,true);assert.ok(result.fallbackResult.radius>0);assert.match(result.fallbackResult.status,/Fallback automático/);
  assert.deepEqual(result.canceledFallback,{mode:'follower',renderer:null,created:{mesh:1,slices:3},destroyed:{mesh:1,slices:3}});
  console.log('Interaction Studio preparation: awaited sessions, out-of-order results, stale errors, renderer cleanup and cancelable WebGL fallback PASS');
}

export async function runStudioOptionsSmoke(page){
  const result=await page.evaluate(async()=>{
    const studio=__NAGWEB_INTERACTION_STUDIO__,baseline=JSON.stringify(studio.getSession());
    const mesh={columns:48,rows:14,spinePoints:44,zoneBlend:.11,headMaxBend:.09,torsoMaxBend:.21,bodyMaxBend:.38,turnProtection:.54,shadow:false,maxDpr:1,phaseBase:0,phaseSpeed:.25,activityBase:.62,swayPower:2.4,leadEnd:'left'};
    const influence={maxPush:31,maxRotate:0,maxScale:0,spring:.13,damping:.91,sweptBody:false,maxSweepDistance:0,reducedMotion:'never'};
    const follower={follow:.18,damping:.73,maxSpeed:24,rotateToTarget:false,rotationOffset:23,turnSmoothing:.31,tilt:7,speedScale:0};
    const slices={points:42,slices:96,overlap:2.1,seamGuard:1.1,sourceBleed:.18,headRigidFraction:.31,headMaxBend:.15,bodyMaxBend:.47,shadow:false,shadowBlur:.09,maxDpr:1,leadEnd:'left'};
    function pick(value,keys){return Object.fromEntries(Object.keys(keys).map(key=>[key,value[key]]));}
    function state(){const saved=studio.getSession();return {
      organic:pick(studio.organicRenderer?studio.organicRenderer.options:saved.organicOptions,mesh),
      influence:pick(studio.influenceField?studio.influenceField.options:saved.influenceOptions,influence),
      follower:pick(studio.follower.options,follower),
      exported:{organic:pick(saved.organicOptions,mesh),influence:pick(saved.influenceOptions,influence),follower:pick(saved.followerOptions,follower)}
    };}
    function input(id,value){const el=document.querySelector('#'+id);el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));}
    try{
      const saved=JSON.parse(baseline);saved.mode='organic';saved.organicRenderer='mesh-v3';
      Object.assign(saved.organicOptions,mesh,{leader:null,canvas:null,area:null,image:null,onContextLost:null});
      Object.assign(saved.influenceOptions,influence,{sourceRadius:999});Object.assign(saved.followerOptions,follower);
      await studio.applySession(JSON.stringify(saved));const restored=state();
      const runtimeKeys=['leader','canvas','area','image','onContextLost'].filter(key=>key in studio.getSession().organicOptions);
      input('size','410');input('sway','.065');input('radius','250');const edited=state();
      const toggle=document.querySelector('#influence');toggle.checked=false;toggle.dispatchEvent(new Event('change'));
      const disabled=pick(studio.getSession().influenceOptions,influence);
      toggle.checked=true;toggle.dispatchEvent(new Event('change'));const reenabled=state();
      await studio.switchMode('follower');const pausedEngine=studio.getSession().organicRenderer,withoutRenderer=state();
      await studio.switchMode('organic');const rebuilt=state();
      await studio.switchOrganicEngine('slices-v2');const isolated={shadow:studio.organicRenderer.options.shadow,headMaxBend:studio.organicRenderer.options.headMaxBend};
      await studio.switchOrganicEngine('mesh-v3');const returned=state();
      const sliceSession=JSON.parse(baseline);sliceSession.mode='organic';sliceSession.organicRenderer='slices-v2';sliceSession.organicOptions=slices;
      await studio.applySession(JSON.stringify(sliceSession));const restoredSlices=pick(studio.organicRenderer.options,slices);
      input('size','405');input('waves','5.2');const editedSlices=pick(studio.organicRenderer.options,slices);
      await studio.switchMode('follower');const followerExport=studio.getSession();
      const sparse=JSON.parse(baseline);sparse.mode='organic';sparse.organicRenderer='mesh-v3';sparse.organicOptions={};sparse.influenceOptions={};
      await studio.applySession(JSON.stringify(sparse));const reset={mesh:pick(studio.organicRenderer.options,mesh),influence:pick(studio.influenceField.options,influence)};
      const defaults={mesh:pick(NAGWEB_ORGANIC_MESH.normalizeOptions({}),mesh),influence:pick(NAGWEB_INTERACTION_INFLUENCE.normalizeOptions({}),influence)};
      return {mesh,influence,follower,slices,restored,runtimeKeys,edited,disabled,reenabled,pausedEngine,withoutRenderer,rebuilt,isolated,returned,restoredSlices,editedSlices,followerExport:{engine:followerExport.organicRenderer,options:pick(followerExport.organicOptions,slices)},reset,defaults};
    }finally{await studio.applySession(baseline);}
  });
  const expected={organic:result.mesh,influence:result.influence,follower:result.follower,exported:{organic:result.mesh,influence:result.influence,follower:result.follower}};
  for(const name of ['restored','edited','reenabled','withoutRenderer','rebuilt','returned'])assert.deepEqual(result[name],expected,name+' must retain non-panel options in runtime and export');
  assert.deepEqual(result.runtimeKeys,[],'Imported configuration cannot replace renderer bindings');
  assert.deepEqual(result.disabled,result.influence);assert.equal(result.pausedEngine,'mesh-v3');
  assert.deepEqual(result.isolated,{shadow:true,headMaxBend:.11},'Mesh options must not become Slices defaults');
  assert.deepEqual(result.restoredSlices,result.slices);assert.deepEqual(result.editedSlices,result.slices);
  assert.deepEqual(result.followerExport,{engine:'slices-v2',options:result.slices},'A session exported in Follower mode must retain the selected organic engine');
  assert.deepEqual(result.reset,result.defaults,'A sparse session must not inherit advanced options from a previous import');
  console.log('Interaction Studio options: Mesh/Slices settings, influence zeros, follower rotation, edits, disable/re-enable, engine isolation, sparse restore and export PASS');
}
