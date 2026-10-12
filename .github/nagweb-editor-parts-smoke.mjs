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
   return f.contentDocument?.body?.dataset.partsRun===String(n)&&f.contentWindow?.__nwFeedback16Editors===1&&!!f.contentDocument?.__nwCanvasPartAPI;
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
  const actualHero=await toolPart();
  assert.deepEqual(actualHero,{part:'layer-2',handles:2},'Hero: un clic en Foto 2 habilita mover, escalar y rotar');
  await select('test-story');await fire('[data-nw-story-ch="2"]');
  assert.deepEqual(await toolPart(),{part:null,handles:0},'cambiar capítulo limpia tiradores anteriores');
  await fire('[data-nw-story-part="media"]');
  assert.deepEqual(await toolPart(),{part:'media-2',handles:2},'Historia: el botón Imagen habilita la transformación');
  // Comprobar la hoja real del widget: las imágenes sticky no pisan el escalado manual.
  const storyScale=await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument;
   const css=document.createElement('style');css.textContent=window.SCW.css.scrollstory;d.head.appendChild(css);
   const media=d.querySelector('[data-wpart="media-2"]');
   media.style.setProperty('--nw-ps','1.7');media.style.transition='none';media.classList.add('is-active');
   return parseFloat(d.defaultView.getComputedStyle(media).scale);
  });
  assert.ok(Math.abs(storyScale-1.7)<.02,'la imagen sticky respeta el escalado guardado');
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
  
  // Edición de precisión sin rearmar escenas ni agregar un segundo motor.
  await load(5);await select('test-hero');
  await fire('[data-nw-part=""]');
  await fire('[data-wpart="layer-2"]');
  const direct=await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument;
   return{button:d.querySelector('[data-nw-part="layer-2"]')?.classList.contains('on'),
    selected:d.querySelector('.nw-part-edit-active')?.getAttribute('data-wpart'),handle:d.querySelector('.nw-wpart-sel')?.getAttribute('data-wpart')};
  });
  assert.deepEqual(direct,{button:true,selected:'layer-2',handle:'layer-2'},'clic directo sincroniza lienzo y barra del Hero');
  await load(6);
  assert.deepEqual(await toolPart(),{part:'layer-2',handles:2},'reconstrucción conserva la selección interna');
  await select('test-story');await fire('[data-wpart="media-3"]');
  const directStory=await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,st=d.querySelector('.nw-story');
   return{chapter:st.__nwStoryChapter,selected:d.querySelector('.nw-story .nw-part-edit-active')?.getAttribute('data-wpart'),
    button:st.querySelector('[data-nw-story-part="media"]')?.classList.contains('on')};
  });
  assert.deepEqual(directStory,{chapter:3,selected:'media-3',button:true},'clic directo también cambia capítulo de Historia sticky');
  await load(7);await select('test-hero');await fire('[data-nw-part="layer-2"]');
  const keyBefore=await page.evaluate(()=>{
   const el=sec().elements.find(x=>x.id==='test-hero');
   return{part:{...el.wp.__parts['layer-2']},history:history.length};
  });
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,w=d.defaultView,target=d.querySelector('[data-nw-part="layer-2"]');
   for(const shift of [true,false])target.dispatchEvent(new w.KeyboardEvent('keydown',{bubbles:true,cancelable:true,key:'ArrowRight',shiftKey:shift}));
   target.dispatchEvent(new w.KeyboardEvent('keyup',{bubbles:true,cancelable:true,key:'ArrowRight'}));
  });
  const nudged=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-hero');
   return{part:{...e.wp.__parts['layer-2']},history:history.length};
  });
  assert.equal(nudged.part.x,keyBefore.part.x+11,'Mayús y flecha realizan movimientos precisos');
  assert.equal(nudged.part.y,keyBefore.part.y);
  assert.equal(nudged.history,keyBefore.history+1,'repetición de flecha genera un solo Deshacer');
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,w=d.defaultView,n=d.querySelector('[data-wpart="layer-2"]');
   n.setAttribute('contenteditable','true');
   n.dispatchEvent(new w.KeyboardEvent('keydown',{bubbles:true,cancelable:true,key:'ArrowRight'}));
   n.dispatchEvent(new w.KeyboardEvent('keyup',{bubbles:true,cancelable:true,key:'ArrowRight'}));
   n.removeAttribute('contenteditable');
  });
  assert.equal(await page.evaluate(()=>sec().elements.find(x=>x.id==='test-hero').wp.__parts['layer-2'].x),nudged.part.x,'editar texto no mueve capas');
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,n=d.querySelector('.nw-wpart-reset');
   if(!n)throw Error('No aparece Restablecer con transformación activa');n.click();
  });
  const reset=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-hero');
   return{part:e.wp.__parts['layer-2'],history:history.length,
    visibleReset:!!document.querySelector('#preview').contentDocument.querySelector('.nw-wpart-reset')};
  });
  assert.deepEqual(reset.part,{x:0,y:0,r:0,s:1},'Restablecer afecta únicamente a la pieza');
  assert.equal(reset.history,nudged.history+1,'Restablecer genera Deshacer');
  assert.equal(reset.visibleReset,false,'el botón desaparece al quedar neutral');
  await page.click('#btn-undo');
  assert.equal(await page.evaluate(()=>sec().elements.find(x=>x.id==='test-hero').wp.__parts['layer-2'].x),nudged.part.x);
  await page.click('#btn-redo');
  assert.equal(await page.evaluate(()=>sec().elements.find(x=>x.id==='test-hero').wp.__parts['layer-2'].x),0);
  const storedNeutral=await page.evaluate(()=>JSON.parse(localStorage.getItem(STORE_KEY)).pages[curPage].sections[curSec].elements.find(x=>x.id==='test-hero').wp.__parts['layer-2']);
  assert.deepEqual(storedNeutral,reset.part,'restablecimiento se guarda en el proyecto');

  // La nueva posición Hero tiene referencia de ancho/alto al guardar y responde al resize.
  await load(8);await select('test-hero');
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,hero=d.querySelector('.nw-lh');
   hero.style.cssText='width:800px;height:400px;--h:400px;display:block;position:relative';
   const n=d.querySelector('[data-wpart="layer-2"]');
   n.style.display='block';
   const w=d.defaultView,x=200,y=160;
   n.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerId:91,button:0,clientX:x,clientY:y}));
   w.dispatchEvent(new w.PointerEvent('pointermove',{bubbles:true,pointerId:91,button:0,clientX:x+80,clientY:y+40}));
   w.dispatchEvent(new w.PointerEvent('pointerup',{bubbles:true,pointerId:91,button:0,clientX:x+80,clientY:y+40}));
  });
  const relative=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-hero');
   return{p:e.wp.__parts['layer-2'],stored:JSON.parse(localStorage.getItem(STORE_KEY)).pages[curPage].sections[curSec].elements.find(x=>x.id==='test-hero').wp.__parts['layer-2']};
  });
  assert.equal(relative.p.refW,800);assert.equal(relative.p.refH,400);
  assert.equal(relative.p.x,80);assert.equal(relative.p.y,40);
  assert.deepEqual(relative.stored,relative.p,'guardar referencias del Hero');
  const liveRelativeStyle=await page.evaluate(()=>{
   const n=document.querySelector('#preview').contentDocument.querySelector('[data-wpart="layer-2"]');
   return{x:n.style.getPropertyValue('--nw-tx'),y:n.style.getPropertyValue('--nw-ty')};
  });
  assert.match(liveRelativeStyle.x,/cqw$/,'la edición viva también conserva X proporcional');
  assert.match(liveRelativeStyle.y,/^calc\(var\(--h\)/,'la edición viva también conserva Y proporcional');
  // El mismo widget exportado debe usar unidades relativas, sin un runtime alternativo.
  const markupResponsive=await page.evaluate(()=>{
   const e={__parts:{'layer-1':{x:80,y:40,r:0,s:1,refW:800,refH:400}}};
   const ctx={edit:false};
   const html=window.SCW.kinds.layeredhero.markup(e,ctx);
   const old=window.SCW.kinds.layeredhero.markup({__parts:{'layer-1':{x:80,y:40,r:0,s:1}}},ctx);
   const css=window.SCW.css.layeredhero;
   return{html,old,hasContainer:css.includes('container-type:inline-size')};
  });
  assert.match(markupResponsive.html,/--nw-tx:10\.00000cqw/,'X relativa a ancho de Hero');
  assert.match(markupResponsive.html,/--nw-ty:calc\(var\(--h\) \* 0\.100000\)/,'Y relativa a alto de Hero');
  assert.match(markupResponsive.old,/--nw-tx:80px;--nw-ty:40px/,'posiciones antiguas en píxeles sin migración destructiva');
  assert.equal(markupResponsive.hasContainer,true,'Hero sirve como contenedor de medida');
  // Al cambiar el ancho del Hero, los valores de la posición guardada se interpolan por proporción.
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,hero=d.querySelector('.nw-lh');
   hero.style.width='400px';hero.style.height='200px';hero.style.setProperty('--h','200px');
   const part=d.querySelector('[data-wpart="layer-2"]');
   d.__nwCanvasPartAPI.select('test-hero','layer-2');
   part.dispatchEvent(new d.defaultView.PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerId:92,button:0,clientX:100,clientY:80}));
   d.defaultView.dispatchEvent(new d.defaultView.PointerEvent('pointermove',{bubbles:true,pointerId:92,button:0,clientX:100,clientY:80}));
   d.defaultView.dispatchEvent(new d.defaultView.PointerEvent('pointerup',{bubbles:true,pointerId:92,button:0,clientX:100,clientY:80}));
  });
  const unchanged=await page.evaluate(()=>sec().elements.find(x=>x.id==='test-hero').wp.__parts['layer-2']);
  assert.deepEqual(unchanged,relative.p,'no-ops con otro viewport no reescriben la posición');

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
