import assert from 'node:assert/strict';

export async function runCancelSmoke(page){
 const previous=await page.evaluate(()=>({project:JSON.stringify(project),curPage,curSec,curEl,curPane,selection,secFocus,canvas:NAGWEB_STORY_EDITOR.canvasMode(),history:history.slice(),future:future.slice()}));
 const state=()=>page.evaluate(()=>({scene:JSON.stringify(sec()),saved:localStorage.getItem(STORE_KEY),history:history.slice(),future:future.slice()}));
 try{
  await page.evaluate(()=>{
   const s=JSON.parse(JSON.stringify(sec()));s.id='cancel-scene';s.sdEnabled=true;s.layout='free';s.sdEase='linear';s.stType='cut';
   s.elements=[mkEl('heading',{id:'cancel-text',text:'Cancelar gesto',anim:'none',x:20,y:30,w:60,rot:0,sdKeyframesEnabled:true,sdKeyframes:NAGWEB_STORY_MODEL.normalize([{id:'cancel-start',at:0,x:0},{id:'cancel-mid',at:50,x:100},{id:'cancel-end',at:100,x:200}])})];
   project.pages[0].sections=[s];curPage=0;curSec=0;curEl=0;curPane='elements';selection=['cancel-text'];secFocus=false;history=[];future=[];
   NAGWEB_STORY_EDITOR.update('cancel-text','cancel-mid',{x:101});undo();
   selection=['cancel-text'];renderPane();renderPreview();saveProject();
  });
  await page.waitForFunction(()=>document.querySelector('#preview')?.contentDocument?.querySelector('.nw-story-transform-h.size'));
  for(const [mode,gesture] of [['moment','move'],['moment','size'],['moment','rot'],['base','size'],['base','rot'],['moment','tiny']]){
   await page.evaluate(mode=>{NAGWEB_STORY_EDITOR.setCanvasMode(mode);NAGWEB_SCROLL_DIRECTOR.scrub('cancel-scene',.5);},mode);
   const before=await state();
   const visual=await page.evaluate(gesture=>{
    const d=document.getElementById('preview').contentDocument,w=d.defaultView,n=d.querySelector('[data-id="cancel-text"]');
    const target=gesture==='move'||gesture==='tiny'?n:d.querySelector('.nw-story-transform-h.'+gesture);
    const nr=n.getBoundingClientRect(),r=target.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
    const props=['--nw-sd-x','--nw-sd-y','--nw-sd-scale','--nw-sd-rot','--rot','width','font-size'];
    const values=()=>props.map(k=>[n.style.getPropertyValue(k),n.style.getPropertyPriority(k)]);
    const initial=values();
    const event=(type,cx,cy)=>new w.PointerEvent(type,{bubbles:true,cancelable:true,clientX:cx,clientY:cy,button:0,pointerId:51,altKey:true,shiftKey:gesture==='size'});
    target.dispatchEvent(event('pointerdown',x,y));
    const mx=gesture==='rot'?nr.left+nr.width/2+55:x+(gesture==='tiny'?.5:70);
    const my=gesture==='rot'?nr.top+nr.height/2:y+(gesture==='tiny'?0:35);
    w.dispatchEvent(event('pointermove',mx,my));
    const moved=values();
    w.dispatchEvent(event(gesture==='tiny'?'pointerup':'pointercancel',mx,my));
    const restored=values();
    // Old listeners must not respond to a later move/up after cancellation.
    w.dispatchEvent(event('pointermove',mx+30,my+30));w.dispatchEvent(event('pointerup',mx+30,my+30));
    return{initial,moved,restored,after:values()};
   },gesture);
   assert.notDeepEqual(visual.moved,visual.initial,mode+' '+gesture+' moved visually');
   assert.deepEqual(visual.restored,visual.initial,mode+' '+gesture+' restored styles');
   assert.deepEqual(visual.after,visual.initial,mode+' '+gesture+' removed listeners');
   assert.deepEqual(await state(),before,mode+' '+gesture+' preserves saved project and undo/redo');
  }

  // Use a real captured mouse pointer for Timeline dragging.
  await page.evaluate(()=>{NAGWEB_STORY_EDITOR.setCanvasMode('base');NAGWEB_STORY_EDITOR.select('cancel-text','cancel-mid');});
  await page.$eval('[data-sd-key="cancel-mid"]',n=>n.scrollIntoView({block:'center'}));
  const before=await state();
  const key=await page.$eval('[data-sd-key="cancel-mid"]',n=>{const r=n.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};});
  await page.mouse.move(key.x,key.y);await page.mouse.down();await page.mouse.move(key.x+35,key.y,{steps:3});
  assert.notEqual(await page.evaluate(()=>sec().elements[0].sdKeyframes[1].at),50);
  await page.$eval('[data-sd-key="cancel-mid"]',n=>n.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:1})));
  await page.mouse.up();
  assert.deepEqual(await state(),before,'Timeline cancellation preserves data, undo and redo');
  console.log('Gestos: cancelar movimiento, tamaño, giro y Timeline conserva diseño, guardado y Deshacer/Rehacer OK');
 }finally{
  await page.evaluate(previous=>{
   clearTimeout(previewTimer);project=JSON.parse(previous.project);
   curPage=previous.curPage;curSec=previous.curSec;curEl=previous.curEl;curPane=previous.curPane;selection=previous.selection;secFocus=previous.secFocus;
   history=previous.history;future=previous.future;NAGWEB_STORY_EDITOR.setCanvasMode(previous.canvas);
   saveProject();renderScenes();renderPane();renderPreview();
  },previous);
 }
}
