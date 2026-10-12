import assert from 'node:assert/strict';

// Smoke exclusivo del Editor principal: foco de partes y edición de textos.
export async function runEditorPartsSmoke(page){
 const saved=await page.evaluate(()=>({
  project:JSON.stringify(project),curPage,curSec,curEl,curPane,
  selection:selection.slice(),secFocus,history:history.slice(),future:future.slice()
 }));
 const markup=n=>'<!doctype html><html><body data-parts-run="'+n+'">'+
  '<div class="el wdg" data-id="test-hero"><section class="nw-lh">'+
  '<button data-nw-part="">Todos</button><button data-nw-part="layer-2">Foto 2</button>'+
  '<div data-wpart="layer-2">Imagen</div>'+
  '<p data-wpart="text-extra-0" data-nw-listobj="texts" data-nw-row="0" data-nw-key="text">Texto original</p></section></div>'+
  '<div class="el wdg" data-id="test-story"><section class="nw-story">'+
  '<button data-nw-story-ch="1" class="on">1</button><button data-nw-story-ch="2">2</button>'+
  '<button data-nw-story-ch="3">3</button><button data-nw-story-part="media">Imagen</button>'+
  '<button data-nw-story-live="1">Seguir scroll</button>'+
  '<article data-nw-story-step="1" class="is-active"></article><article data-nw-story-step="2"></article>'+
  '<article data-nw-story-step="3"></article><i data-wpart="media-1" data-nw-story-media="1" class="is-active"></i>'+
  '<i data-wpart="media-2" data-nw-story-media="2"></i><i data-wpart="media-3" data-nw-story-media="3"></i>'+
  '</section></div></body></html>';
 async function load(n){
  await page.evaluate(html=>{document.querySelector('#preview').srcdoc=html;},markup(n));
  await page.waitForFunction(n=>{
   const f=document.querySelector('#preview');
   return f.contentDocument?.body?.dataset.partsRun===String(n)&&f.contentWindow?.__nwFeedback16Editors===1;
  },{},n);
 }
 async function fire(selector,type='pointerdown'){
  await page.evaluate(({selector,type})=>{
   const d=document.querySelector('#preview').contentDocument,el=d.querySelector(selector);
   if(!el)throw Error('No existe '+selector);
   const Constructor=type==='dblclick'?d.defaultView.MouseEvent:d.defaultView.PointerEvent;
   el.dispatchEvent(new Constructor(type,{bubbles:true,cancelable:true,button:0,pointerId:77}));
  },{selector,type});
 }
 async function select(id){
  await page.evaluate(id=>{curEl=sec().elements.findIndex(e=>e.id===id);selection=[id];secFocus=false;},id);
 }
 const inspect=()=>page.evaluate(()=>{
  const d=document.querySelector('#preview').contentDocument,h=d.querySelector('.nw-lh'),s=d.querySelector('.nw-story');
  return {
   hero:h.querySelector('.nw-part-edit-active')?.dataset.wpart||null,
   chapter:s.querySelector('[data-nw-story-ch].on')?.dataset.nwStoryCh||null,
   step:s.querySelector('[data-nw-story-step].is-active')?.dataset.nwStoryStep||null,
   media:s.querySelector('.nw-part-edit-active')?.dataset.wpart||null,
   manual:s.__nwStoryManual===true
  };
 });
 try{
  await page.evaluate(()=>{
   sec().elements.push(mkEl('widget',{id:'test-hero',kind:'layeredhero',wp:{texts:[{text:'Texto original'}]}}));
   sec().elements.push(mkEl('widget',{id:'test-story',kind:'scrollstory',wp:{}}));
   sec().elements.find(e=>e.id==='test-hero').wp={texts:[{text:'Texto original'}]};
  });
  await load(1);await select('test-hero');await fire('[data-nw-part="layer-2"]');
  await select('test-story');await fire('[data-nw-story-ch="2"]');await fire('[data-nw-story-part="media"]');
  const expected={hero:'layer-2',chapter:'2',step:'2',media:'media-2',manual:true};
  assert.deepEqual(await inspect(),expected);
  await load(2);
  assert.deepEqual(await inspect(),expected,'reconstruir iframe conserva selección');
  await fire('[data-nw-story-live]');
  await load(3);
  const live=await inspect();
  assert.equal(live.manual,false);assert.equal(live.media,null);assert.equal(live.chapter,'1');
  await select('test-hero');
  const start=await page.evaluate(()=>({
   text:sec().elements.find(e=>e.id==='test-hero').wp.texts[0].text,undo:history.length
  }));
  await fire('[data-nw-listobj]','dblclick');
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,n=d.querySelector('[data-nw-listobj]');
   n.innerText='Texto descartado';
   n.dispatchEvent(new d.defaultView.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
  });
  const cancel=await page.evaluate(()=>({
   text:sec().elements.find(e=>e.id==='test-hero').wp.texts[0].text,
   visual:document.querySelector('#preview').contentDocument.querySelector('[data-nw-listobj]').innerText,
   undo:history.length
  }));
  assert.equal(cancel.text,start.text);assert.equal(cancel.visual,start.text);assert.equal(cancel.undo,start.undo);
  await fire('[data-nw-listobj]','dblclick');
  await page.evaluate(()=>document.querySelector('#preview').contentDocument.querySelector('[data-nw-listobj]').blur());
  assert.equal(await page.evaluate(()=>history.length),start.undo,'sin cambios no agrega historial');
  await fire('[data-nw-listobj]','dblclick');
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,n=d.querySelector('[data-nw-listobj]');
   n.innerText='Texto guardado';
   n.dispatchEvent(new d.defaultView.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
  });
  const committed=await page.evaluate(()=>({
   text:sec().elements.find(e=>e.id==='test-hero').wp.texts[0].text,
   stored:JSON.parse(localStorage.getItem(STORE_KEY)).pages[curPage].sections[curSec].elements.find(e=>e.id==='test-hero')?.wp?.texts?.[0]?.text,
   undo:history.length
  }));
  assert.equal(committed.text,'Texto guardado');assert.equal(committed.stored,committed.text);
  assert.equal(committed.undo,start.undo+1);
  console.log('Editor partes: foco, restauración, Escape, Enter e historial OK');
 }finally{
  await page.evaluate(old=>{
   clearTimeout(previewTimer);
   project=JSON.parse(old.project);curPage=old.curPage;curSec=old.curSec;curEl=old.curEl;
   curPane=old.curPane;selection=old.selection;secFocus=old.secFocus;
   history=old.history;future=old.future;saveProject();renderScenes();renderPane();renderPreview();
  },saved);
 }
}
