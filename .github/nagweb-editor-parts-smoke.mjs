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
  '<div data-wpart="layer-2" style="width:160px;height:96px">Imagen</div>'+
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
  // La barra y el lienzo seleccionan la MISMA parte: tiradores inmediatos.
  const toolPart=()=>page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument;
   return{part:d.querySelector('.nw-wpart-sel')?.getAttribute('data-wpart')||null,handles:d.querySelectorAll('.nw-wpart-h').length};
  });
  assert.deepEqual(await toolPart(),{part:'layer-2',handles:2},'Hero: un clic en Foto 2 habilita mover, escalar y rotar');
  await select('test-story');await fire('[data-nw-story-ch="2"]');
  assert.deepEqual(await toolPart(),{part:null,handles:0},'cambiar capítulo limpia tiradores anteriores');
  await fire('[data-nw-story-part="media"]');
  assert.deepEqual(await toolPart(),{part:'media-2',handles:2},'Historia: el botón Imagen habilita la transformación');
  const expected={hero:'layer-2',chapter:'2',step:'2',media:'media-2',manual:true};
  assert.deepEqual(await inspect(),expected);
  await load(2);
  assert.deepEqual(await inspect(),expected,'reconstruir iframe conserva selección');
  assert.deepEqual(await toolPart(),{part:'media-2',handles:2},'reconstruir iframe conserva además los tiradores');
  await fire('[data-nw-story-live]');
  await load(3);
  const live=await inspect();
  assert.equal(live.manual,false);assert.equal(live.media,null);assert.equal(live.chapter,'1');
  assert.deepEqual(await toolPart(),{part:null,handles:0},'Seguir scroll retira los tiradores manuales');
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
  // Drag, resize y rotate sobre la parte interna existente.
  await page.evaluate(()=>clearTimeout(previewTimer));await load(4);await select('test-hero');
  await page.waitForFunction(()=>document.querySelector('#preview')?.contentDocument?.__nwCanvasTools===1);
  const undoStart=await page.evaluate(()=>history.length);
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,w=d.defaultView,n=d.querySelector('[data-wpart="layer-2"]');
   const b=n.getBoundingClientRect(),x=b.left+b.width/2,y=b.top+b.height/2;
   n.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerId:41,button:0,clientX:x,clientY:y}));
   w.dispatchEvent(new w.PointerEvent('pointermove',{bubbles:true,pointerId:41,button:0,clientX:x+34,clientY:y+18}));
   w.dispatchEvent(new w.PointerEvent('pointerup',{bubbles:true,pointerId:41,button:0,clientX:x+34,clientY:y+18}));
  });
  const afterDrag=await page.evaluate(()=>({
   part:sec().elements.find(e=>e.id==='test-hero').wp.__parts?.['layer-2'],undo:history.length
  }));
  assert.equal(afterDrag.part.x,34);assert.equal(afterDrag.part.y,18);
  assert.equal(afterDrag.undo,undoStart+1,'mover una parte crea un historial reversible');
  const scaleExpected=await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,w=d.defaultView,n=d.querySelector('[data-wpart="layer-2"]');
   const handle=d.querySelector('.nw-wpart-h.size');if(!handle)throw Error('Tirador de tamaño ausente');
   const r=n.getBoundingClientRect(),b=handle.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
   const x=b.left+b.width/2,y=b.top+b.height/2,dist=Math.max(12,Math.hypot(x-cx,y-cy));
   handle.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerId:42,button:0,clientX:x,clientY:y}));
   for(const factor of [1.12,1.25,1.4]){
    w.dispatchEvent(new w.PointerEvent('pointermove',{bubbles:true,pointerId:42,button:0,clientX:cx+(x-cx)*factor,clientY:cy+(y-cy)*factor}));
   }
   w.dispatchEvent(new w.PointerEvent('pointerup',{bubbles:true,pointerId:42,button:0,clientX:cx+(x-cx)*1.4,clientY:cy+(y-cy)*1.4}));
   return Math.hypot((x-cx)*1.4,(y-cy)*1.4)/dist;
  });
  const afterScale=await page.evaluate(()=>({
   part:sec().elements.find(e=>e.id==='test-hero').wp.__parts['layer-2'],undo:history.length
  }));
  assert.ok(Math.abs(afterScale.part.s-scaleExpected)<.025,'la escala depende del inicio y no multiplica cada evento');
  assert.equal(afterScale.undo,undoStart+2);
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,w=d.defaultView,n=d.querySelector('[data-wpart="layer-2"]');
   const handle=d.querySelector('.nw-wpart-h.rot');if(!handle)throw Error('Tirador de giro ausente');
   const r=n.getBoundingClientRect(),b=handle.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
   const x=b.left+b.width/2,y=b.top+b.height/2,dist=Math.hypot(x-cx,y-cy);
   const angle=Math.atan2(y-cy,x-cx)+Math.PI/6;
   handle.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerId:43,button:0,clientX:x,clientY:y}));
   w.dispatchEvent(new w.PointerEvent('pointermove',{bubbles:true,pointerId:43,button:0,clientX:cx+dist*Math.cos(angle),clientY:cy+dist*Math.sin(angle)}));
   w.dispatchEvent(new w.PointerEvent('pointerup',{bubbles:true,pointerId:43,button:0,clientX:cx+dist*Math.cos(angle),clientY:cy+dist*Math.sin(angle)}));
  });
  const afterRotate=await page.evaluate(()=>({
   part:sec().elements.find(e=>e.id==='test-hero').wp.__parts['layer-2'],undo:history.length
  }));
  assert.ok(Math.abs(afterRotate.part.r-30)<2,'el giro respeta el ángulo inicial');
  assert.equal(afterRotate.undo,undoStart+3);
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,w=d.defaultView,n=d.querySelector('[data-wpart="layer-2"]');
   const b=n.getBoundingClientRect(),x=b.left+b.width/2,y=b.top+b.height/2;
   n.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerId:44,button:0,clientX:x,clientY:y}));
   w.dispatchEvent(new w.PointerEvent('pointermove',{bubbles:true,pointerId:44,button:0,clientX:x+60,clientY:y+22}));
   w.dispatchEvent(new w.PointerEvent('pointercancel',{bubbles:true,pointerId:44,button:0,clientX:x+60,clientY:y+22}));
  });
  const afterCancel=await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,n=d.querySelector('[data-wpart="layer-2"]');
   return{part:sec().elements.find(e=>e.id==='test-hero').wp.__parts['layer-2'],
    undo:history.length,liveX:parseFloat(n.style.getPropertyValue('--nw-tx'))};
  });
  assert.deepEqual(afterCancel.part,afterRotate.part,'cancelar no modifica el modelo');
  assert.equal(afterCancel.undo,afterRotate.undo,'cancelar no crea Deshacer');
  assert.equal(afterCancel.liveX,afterRotate.part.x,'cancelar restituye el elemento visible');
  const savedPart=await page.evaluate(()=>JSON.parse(localStorage.getItem(STORE_KEY)).pages[curPage].sections[curSec].elements.find(e=>e.id==='test-hero')?.wp.__parts['layer-2']);
  assert.deepEqual(savedPart,afterRotate.part,'las transformaciones persisten');
  await page.click('#btn-undo');
  assert.equal(await page.evaluate(()=>sec().elements.find(e=>e.id==='test-hero').wp.__parts['layer-2'].r),0);
  await page.click('#btn-redo');
  assert.equal(await page.evaluate(()=>sec().elements.find(e=>e.id==='test-hero').wp.__parts['layer-2'].r),afterRotate.part.r);
  
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
