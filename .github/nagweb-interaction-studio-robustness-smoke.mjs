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
    return {originalCount,before,added,expectedIds,selected,mixed,channels,special,restored,removed,state,previewPaused,manualPauseKept,pausedDuringLivePreview,resumedAfterLivePreview,clearedOnChange,final};
  });
  assert.equal(result.added.same,true);assert.equal(result.added.count,result.originalCount+70);assert.equal(result.added.revision,1,'One DOM batch should publish one registry update');assert.deepEqual(result.added.state,result.before);
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
