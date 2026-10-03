import assert from 'node:assert/strict';

export async function runHistorySmoke(page){
 const previous=await page.evaluate(()=>({project:JSON.stringify(project),curPage,curSec,curEl,curPane,selection,secFocus}));
 try{
  await page.evaluate(()=>{
   const s=JSON.parse(JSON.stringify(sec()));
   s.id='history-scene';s.layout='free';s.sdEnabled=true;s.sdEase='linear';
   s.sdBeats=[{id:'history-beat',at:50,name:'Centro'}];
   s.elements=[mkEl('heading',{
    id:'history-text',text:'Historial',anim:'none',x:20,y:30,
    sdKeyframesEnabled:true,
    sdKeyframes:[{id:'history-first',at:0,x:0},{id:'history-middle',at:50,x:100},{id:'history-last',at:100,x:200}]
   })];
   project.pages[0].sections=[s];curPage=0;curSec=0;curEl=0;curPane='elements';selection=['history-text'];secFocus=false;
   history=[];future=[];renderPane();renderPreview();saveProject();
  });
  const state=()=>page.evaluate(()=>({
   scene:JSON.parse(JSON.stringify(sec())),
   saved:JSON.parse(localStorage.getItem(STORE_KEY)).pages[0].sections[0],
   past:history.length,future:future.length
  }));
  const initial=await state();
  await page.evaluate(()=>NAGWEB_STORY_EDITOR.update('history-text','history-middle',{x:177,scale:125,ease:'smooth'}));
  const edited=await state();
  assert.equal(edited.scene.elements[0].sdKeyframes[1].x,177);
  assert.deepEqual(edited.saved,edited.scene);
  assert.deepEqual(edited.scene.sdBeats,initial.scene.sdBeats);
  assert.equal(edited.past,1);

  // Repetir el mismo valor no debe consumir un paso ni borrar la pila de rehacer.
  assert.equal(await page.evaluate(()=>NAGWEB_STORY_EDITOR.update('history-text','history-middle',{x:177,scale:125,ease:'smooth'})),false);
  assert.equal((await state()).past,1);
  await page.click('#btn-undo');
  const undone=await state();
  assert.deepEqual(undone.scene,initial.scene);
  assert.deepEqual(undone.saved,initial.scene);
  assert.equal(undone.future,1);
  await page.click('#btn-redo');
  const redone=await state();
  assert.deepEqual(redone.scene,edited.scene);
  assert.deepEqual(redone.saved,edited.scene);

  // Recargar inmediatamente después de deshacer debe cargar el estado deshecho.
  await page.click('#btn-undo');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.NAGWEB_STORY_EDITOR&&typeof project!=='undefined'&&project.pages?.[0]?.sections?.[0]?.id==='history-scene');
  const reloaded=await state();
  assert.deepEqual(reloaded.scene.elements[0].sdKeyframes,initial.scene.elements[0].sdKeyframes);
  assert.deepEqual(reloaded.scene.sdBeats,initial.scene.sdBeats);

  // Una edición nueva después de deshacer invalida el recorrido anterior de rehacer.
  await page.evaluate(()=>{
   curPage=0;curSec=0;curEl=0;curPane='elements';selection=['history-text'];secFocus=false;renderPane();
   NAGWEB_STORY_EDITOR.update('history-text','history-middle',{x:177});
  });
  await page.click('#btn-undo');
  await page.evaluate(()=>NAGWEB_STORY_EDITOR.update('history-text','history-middle',{y:-45}));
  const branched=await state();
  assert.equal(branched.future,0);
  await page.click('#btn-redo');
  assert.deepEqual((await state()).scene,branched.scene);
  assert.deepEqual(branched.saved,branched.scene);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.NAGWEB_STORY_EDITOR&&typeof project!=='undefined'&&project.pages?.[0]?.sections?.[0]?.id==='history-scene');
  assert.deepEqual((await state()).scene.elements[0].sdKeyframes,branched.scene.elements[0].sdKeyframes);
  console.log('Historial: edición, no-op, botones Deshacer/Rehacer, nueva edición y recarga OK');
 }finally{
  await page.evaluate(previous=>{
   clearTimeout(previewTimer);
   project=JSON.parse(previous.project);
   curPage=previous.curPage;curSec=previous.curSec;curEl=previous.curEl;curPane=previous.curPane;selection=previous.selection;secFocus=previous.secFocus;
   history=[];future=[];saveProject();renderScenes();renderPane();renderPreview();
  },previous);
 }
}
