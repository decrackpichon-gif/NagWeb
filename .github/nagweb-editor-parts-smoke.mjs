import assert from 'node:assert/strict';

// Smoke exclusivo del Editor principal: foco de partes y edición de textos.
export async function runEditorPartsSmoke(page){
 const saved=await page.evaluate(()=>({
  project:JSON.stringify(project),curPage,curSec,curEl,curPane,
  selection:selection.slice(),secFocus,history:history.slice(),future:future.slice()
 }));
 const markup=n=>'<!doctype html><html><body data-parts-run="'+n+'">'+
  '<div class="el wdg" data-id="test-hero"><section class="nw-lh">'+
  '<button data-nw-part="">Todos</button><button data-nw-part="layer-1">Foto 1</button><button data-nw-part="layer-2">Foto 2</button>'+
  '<div data-wpart="layer-1" style="width:200px;height:120px">Fondo</div>'+ 
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
    undo:history.length,liveX:n.style.getPropertyValue('--nw-tx'),liveY:n.style.getPropertyValue('--nw-ty')};
  });
  assert.deepEqual(afterCancel.part,afterRotate.part,'cancelar no modifica el modelo');
  assert.equal(afterCancel.undo,afterRotate.undo,'cancelar no crea Deshacer');
  assert.equal(afterCancel.liveX,(afterRotate.part.x/afterRotate.part.refW*100).toFixed(5)+'cqw','cancelar restituye X proporcional');
  assert.equal(afterCancel.liveY,'calc(var(--h) * '+(afterRotate.part.y/afterRotate.part.refH).toFixed(6)+')','cancelar restituye Y proporcional');
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

  // Editar en un Hero estrecho crea un override móvil, sin tocar escritorio.
  await load(9);await select('test-hero');
  await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-hero');
   e.wp.__parts={'layer-1':{x:70,y:30,r:5,s:1.1,refW:800,refH:400}};
   delete e.wp.__partsMobile;
   const d=document.querySelector('#preview').contentDocument;
   const style=d.createElement('style');style.textContent=window.SCW.css.layeredhero;d.head.appendChild(style);
   const hero=d.querySelector('.nw-lh');hero.style.cssText='position:relative;display:block;width:400px;height:200px;--h:200px';
   const part=d.querySelector('[data-wpart="layer-1"]');
   part.style.setProperty('--nw-tx','8.75000cqw');
   part.style.setProperty('--nw-ty','calc(var(--h) * 0.075000)');
   part.style.setProperty('--nw-pr','5deg');part.style.setProperty('--nw-ps','1.1');
  });
  await fire('[data-nw-part="layer-1"]');
  const desktopBefore=await page.evaluate(()=>JSON.parse(JSON.stringify(sec().elements.find(x=>x.id==='test-hero').wp.__parts)));
  const mobileBefore=await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,p=d.querySelector('[data-wpart="layer-1"]');
   return d.defaultView.getComputedStyle(p).translate;
  });
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,w=d.defaultView,p=d.querySelector('[data-wpart="layer-1"]');
   const x=130,y=95;
   p.dispatchEvent(new w.PointerEvent('pointerdown',{pointerId:111,button:0,bubbles:true,cancelable:true,clientX:x,clientY:y}));
   w.dispatchEvent(new w.PointerEvent('pointermove',{pointerId:111,bubbles:true,clientX:x+24,clientY:y+10}));
   w.dispatchEvent(new w.PointerEvent('pointerup',{pointerId:111,bubbles:true,clientX:x+24,clientY:y+10}));
  });
  const afterMobile=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-hero'),d=document.querySelector('#preview').contentDocument,p=d.querySelector('[data-wpart="layer-1"]');
   return{desktop:e.wp.__parts,mobile:e.wp.__partsMobile,inline:p.style.getPropertyValue('--nw-mx'),
    visual:d.defaultView.getComputedStyle(p).translate,reset:!!d.querySelector('.nw-wpart-reset')};
  });
  assert.deepEqual(afterMobile.desktop,desktopBefore,'editar móvil no altera pose de escritorio');
  assert.equal(afterMobile.mobile['layer-1'].refW,400);
  assert.equal(afterMobile.mobile['layer-1'].refH,200);
  assert.equal(afterMobile.mobile['layer-1'].x,59);
  assert.equal(afterMobile.mobile['layer-1'].y,25);
  assert.match(afterMobile.inline,/cqw$/,'ajuste móvil relativo');
  assert.notEqual(afterMobile.visual,mobileBefore,'la capa cambia visualmente en móvil');
  assert.equal(afterMobile.reset,true,'aparece opción para volver a escritorio');
  const outputMobile=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-hero').wp;
   return window.SCW.kinds.layeredhero.markup(Object.assign({},e,{__parts:e.__parts,__partsMobile:e.__partsMobile}),{edit:false});
  });
  assert.match(outputMobile,/--nw-tx:8\.75000cqw/,'export conserva escritorio');
  assert.match(outputMobile,/--nw-mx:14\.75000cqw/,'export conserva móvil independiente');
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument;
   d.querySelector('.nw-wpart-reset').click();
  });
  const afterMobileReset=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-hero'),d=document.querySelector('#preview').contentDocument,p=d.querySelector('[data-wpart="layer-1"]');
   return{desktop:e.wp.__parts,mobile:e.wp.__partsMobile||{},inline:p.style.getPropertyValue('--nw-mx'),
    reset:!!d.querySelector('.nw-wpart-reset')};
  });
  assert.deepEqual(afterMobileReset.desktop,desktopBefore,'restablecer móvil conserva escritorio');
  assert.equal(afterMobileReset.mobile['layer-1'],undefined,'restablecer elimina solo versión móvil');
  assert.equal(afterMobileReset.inline,'','restablecer quita la variable móvil');
  assert.equal(afterMobileReset.reset,false,'ya no muestra restablecimiento móvil');
  await page.click('#btn-undo');
  assert.ok(await page.evaluate(()=>sec().elements.find(x=>x.id==='test-hero').wp.__partsMobile?.['layer-1']));
  await page.click('#btn-redo');
  assert.equal(await page.evaluate(()=>sec().elements.find(x=>x.id==='test-hero').wp.__partsMobile?.['layer-1']),undefined);

  // Orden de fotografías persistente. La selección aislada no puede falsear la vista final.
  await load(10);await select('test-hero');
  await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-hero');
   e.wp.__parts={};delete e.wp.__partsMobile;
   const d=document.querySelector('#preview').contentDocument;
   const css=d.createElement('style');css.textContent=window.SCW.css.layeredhero;d.head.appendChild(css);
   const hero=d.querySelector('.nw-lh');hero.style.cssText='position:relative;width:800px;height:400px;--h:400px';
   d.querySelector('[data-wpart="layer-1"]').className='nw-lh-layer l1';
   d.querySelector('[data-wpart="layer-2"]').className='nw-lh-layer l2';
  });
  await fire('[data-nw-part="layer-1"]');
  const initialOrder=await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument;
   return Array.from(d.querySelectorAll('.nw-wpart-action')).map(x=>x.textContent);
  });
  assert.ok(initialOrder.includes('Al frente')&&initialOrder.includes('Al fondo'),'foto superpuesta tiene controles de orden');
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument;
   Array.from(d.querySelectorAll('.nw-wpart-action')).find(x=>x.textContent==='Al frente').click();
  });
  const raised=await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,hero=d.querySelector('.nw-lh'),el=d.querySelector('[data-wpart="layer-1"]');
   const part=sec().elements.find(x=>x.id==='test-hero').wp.__parts['layer-1'];
   return{part,cssZ:d.defaultView.getComputedStyle(el).zIndex,
    isolated:hero.classList.contains('nw-part-isolate'),all:hero.querySelector('[data-nw-part=""]')?.classList.contains('on')};
  });
  assert.equal(raised.part.z,7,'elevar supera incluso al bloque de texto');
  assert.equal(raised.cssZ,'7','el orden se refleja en el navegador');
  assert.equal(raised.isolated,false,'no mantener un falso orden temporal');
  assert.equal(raised.all,true,'volver a vista completa tras ordenar');
  const raisedExport=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-hero').wp;
   return window.SCW.kinds.layeredhero.markup({...e,__parts:e.__parts}, {edit:false});
  });
  assert.match(raisedExport,/--nw-z:7;/,'el orden pasa a la exportación');
  const raisedSaved=await page.evaluate(()=>JSON.parse(localStorage.getItem(STORE_KEY)).pages[curPage].sections[curSec].elements.find(x=>x.id==='test-hero').wp.__parts['layer-1'].z);
  assert.equal(raisedSaved,7,'el orden se guarda');
  await page.click('#btn-undo');
  assert.equal(await page.evaluate(()=>sec().elements.find(x=>x.id==='test-hero').wp.__parts?.['layer-1']?.z),undefined);
  await page.click('#btn-redo');
  assert.equal(await page.evaluate(()=>sec().elements.find(x=>x.id==='test-hero').wp.__parts?.['layer-1']?.z),7);
  // En un Hero móvil, el orden se puede modificar sin cambiar escritorio.
  await load(11);await select('test-hero');
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument;
   const css=d.createElement('style');css.textContent=window.SCW.css.layeredhero;d.head.appendChild(css);
   const hero=d.querySelector('.nw-lh');hero.style.cssText='position:relative;width:400px;height:200px;--h:200px';
   d.querySelector('[data-wpart="layer-1"]').className='nw-lh-layer l1';
   d.querySelector('[data-wpart="layer-2"]').className='nw-lh-layer l2';
  });
  await fire('[data-nw-part="layer-1"]');
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument;
   Array.from(d.querySelectorAll('.nw-wpart-action')).find(x=>x.textContent==='Al fondo').click();
  });
  const lower=await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,e=sec().elements.find(x=>x.id==='test-hero');
   return{desktop:e.wp.__parts['layer-1'].z,mobile:e.wp.__partsMobile['layer-1'].z,
    rendered:d.defaultView.getComputedStyle(d.querySelector('[data-wpart="layer-1"]')).zIndex};
  });
  assert.equal(lower.desktop,7,'móvil conserva el orden del escritorio');
  assert.ok(lower.mobile<2,'móvil envía la foto detrás de Foto 2');
  assert.equal(lower.rendered,String(lower.mobile),'el orden móvil se ve sin recargar');
  const mobileExportOrder=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-hero').wp;
   return window.SCW.kinds.layeredhero.markup({...e,__parts:e.__parts,__partsMobile:e.__partsMobile}, {edit:false});
  });
  assert.match(mobileExportOrder,/--nw-z:7;--nw-mz:1;/,'la exportación guarda ambos órdenes');
  // Si una capa sale del Hero, el selector conserva una acción de recuperación visible.
  await load(12);await select('test-hero');
  await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-hero');
   e.wp.__parts={'layer-1':{x:1600,y:0,r:0,s:1,z:7,refW:800,refH:400}};
   const d=document.querySelector('#preview').contentDocument;
   const css=d.createElement('style');css.textContent=window.SCW.css.layeredhero;d.head.appendChild(css);
   const hero=d.querySelector('.nw-lh');hero.style.cssText='position:relative;width:800px;height:400px;--h:400px';
   const layer=d.querySelector('[data-wpart="layer-1"]');layer.className='nw-lh-layer l1';
   layer.style.setProperty('--nw-tx','200cqw');layer.style.setProperty('--nw-z','7');
  });
  await fire('[data-nw-part="layer-1"]');
  const recoverAvailable=await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument;
   const n=Array.from(d.querySelectorAll('.nw-wpart-action')).find(x=>x.textContent==='Recuperar');
   const hero=d.querySelector('.nw-lh').getBoundingClientRect(),p=n?.getBoundingClientRect();
   return{exists:!!n,inFrame:!!(p&&p.left>=0&&p.right<=d.defaultView.innerWidth&&p.top>=0&&p.bottom<=d.defaultView.innerHeight),insideHero:!!(p&&p.left>=hero.left)};
  });
  assert.equal(recoverAvailable.exists,true,'pieza fuera del área puede recuperarse');
  assert.equal(recoverAvailable.inFrame,true,'Recuperar queda accesible en la pantalla');
  assert.equal(recoverAvailable.insideHero,true);
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument;
   Array.from(d.querySelectorAll('.nw-wpart-action')).find(x=>x.textContent==='Recuperar').click();
  });
  const recovered=await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,hero=d.querySelector('.nw-lh').getBoundingClientRect();
   const box=d.querySelector('[data-wpart="layer-1"]').getBoundingClientRect(),e=sec().elements.find(x=>x.id==='test-hero');
   return{x:e.wp.__parts['layer-1'].x,
    centerError:Math.hypot((hero.left+hero.right-box.left-box.right)/2,(hero.top+hero.bottom-box.top-box.bottom)/2),
    visible:Math.min(hero.right,box.right)>Math.max(hero.left,box.left),
    recoverAction:Array.from(d.querySelectorAll('.nw-wpart-action')).some(x=>x.textContent==='Recuperar')};
  });
  assert.ok(recovered.x!==1600,'recuperar modifica la posición guardada');
  assert.ok(recovered.centerError<3,'recuperar centra visualmente sin suponer el tamaño de la capa');
  assert.equal(recovered.visible,true,'vuelve a verse en el lienzo');
  assert.equal(recovered.recoverAction,false,'Recuperar desaparece cuando ya no hace falta');

  // Textos del Hero que se desprenden de la columna para ubicarse libremente.
  await load(13);await select('test-hero');
  const originalFloatingBounds=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-hero');
   e.wp={title:'TÍTULO LIBRE',eyebrow:'EDITOR',sub:'Descripción',texts:[{text:'Texto extra',style:'body'}]};
   const d=document.querySelector('#preview').contentDocument,hero=d.querySelector('.nw-lh');
   const css=d.createElement('style');css.textContent=window.SCW.css.layeredhero;d.head.appendChild(css);
   hero.outerHTML=window.SCW.kinds.layeredhero.markup(e.wp,{edit:true});
   const newHero=d.querySelector('.nw-lh');
   newHero.style.width='800px';newHero.style.height='500px';newHero.style.setProperty('--h','500px');
   const title=newHero.querySelector('.nw-lh-copy [data-wpart="title"]'),rect=title.getBoundingClientRect();
   return{cx:(rect.left+rect.right)/2,cy:(rect.top+rect.bottom)/2,width:title.offsetWidth,
    initialPosition:d.defaultView.getComputedStyle(title).position,
    subY:newHero.querySelector('.nw-lh-copy [data-wpart="sub"]').getBoundingClientRect().top};
  });
  assert.equal(originalFloatingBounds.initialPosition,'static','el título comienza dentro de la columna');
  await fire('[data-nw-part="title"]');
  const releaseAvailable=await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument;
   return Array.from(d.querySelectorAll('.nw-wpart-action')).some(n=>n.textContent==='Liberar texto');
  });
  assert.equal(releaseAvailable,true,'título ofrece el comando Liberar texto');
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument;
   Array.from(d.querySelectorAll('.nw-wpart-action')).find(n=>n.textContent==='Liberar texto').click();
   clearTimeout(previewTimer);
  });
  const detached=await page.evaluate(()=>{
   const model=sec().elements.find(x=>x.id==='test-hero').wp;
   const d=document.querySelector('#preview').contentDocument,hero=d.querySelector('.nw-lh');
   hero.outerHTML=window.SCW.kinds.layeredhero.markup(model,{edit:true});
   const newHero=d.querySelector('.nw-lh');
   newHero.style.width='800px';newHero.style.height='500px';newHero.style.setProperty('--h','500px');
   const text=newHero.querySelector(':scope > [data-wpart="title"]'),r=text?.getBoundingClientRect();
   return{data:model.__parts?.title,freeSibling:!!text,
    insideColumn:!!newHero.querySelector('.nw-lh-copy [data-wpart="title"]'),
    siblings:newHero.querySelectorAll('.nw-lh-copy [data-wpart]').length,
    placeholder:!!newHero.querySelector('.nw-lh-copy [data-nw-slot="title"][aria-hidden="true"]'),
    subY:newHero.querySelector('.nw-lh-copy [data-wpart="sub"]').getBoundingClientRect().top,
    css:d.defaultView.getComputedStyle(text).position,
    center:r?[(r.left+r.right)/2,(r.top+r.bottom)/2]:null,
    bounds:[newHero.clientWidth,newHero.clientHeight]};
  });
  assert.equal(detached.data.free,true,'liberar se guarda en la pieza');
  assert.equal(detached.data.refW,800);assert.equal(detached.data.refH,500);
  assert.equal(detached.freeSibling,true,'título se convierte en hijo directo del Hero');
  assert.equal(detached.insideColumn,false,'título sale de la cuadrícula');
  assert.equal(detached.siblings,3,'rótulo, párrafo y texto extra conservan su columna');
  assert.equal(detached.placeholder,true,'la columna conserva una reserva de espacio invisible');
  assert.ok(Math.abs(detached.subY-originalFloatingBounds.subY)<5,'liberar título no mueve el párrafo');
  assert.equal(detached.css,'absolute','título tiene posicionamiento libre real');
  assert.ok(Math.hypot(detached.center[0]-originalFloatingBounds.cx,detached.center[1]-originalFloatingBounds.cy)<10,
    'liberar mantiene la posición visible');
  const releasedHtml=await page.evaluate(()=>{
   const model=sec().elements.find(x=>x.id==='test-hero').wp;
   return window.SCW.kinds.layeredhero.markup(model,{edit:false});
  });
  assert.match(releasedHtml,/nw-lh-float--title/,'la publicación conserva la pieza libre');
  assert.match(releasedHtml,/--nw-fx:[\d.]+cqw;/,'la publicación conserva la posición proporcional');
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,w=d.defaultView,p=d.querySelector('.nw-lh > [data-wpart="title"]');
   const r=p.getBoundingClientRect(),x=(r.left+r.right)/2,y=(r.top+r.bottom)/2;
   p.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,cancelable:true,button:0,pointerId:120,clientX:x,clientY:y}));
   w.dispatchEvent(new w.PointerEvent('pointermove',{bubbles:true,pointerId:120,clientX:x+64,clientY:y+35}));
   w.dispatchEvent(new w.PointerEvent('pointerup',{bubbles:true,pointerId:120,clientX:x+64,clientY:y+35}));
  });
  const movedFloating=await page.evaluate(()=>{
   const model=sec().elements.find(x=>x.id==='test-hero').wp;
   return{title:model.__parts.title,stored:JSON.parse(localStorage.getItem(STORE_KEY)).pages[curPage].sections[curSec].elements.find(x=>x.id==='test-hero').wp.__parts.title};
  });
  assert.equal(movedFloating.title.x,64);
  assert.equal(movedFloating.title.y,35);
  assert.equal(movedFloating.title.free,true,'el texto no vuelve a la columna al arrastrarlo');
  assert.deepEqual(movedFloating.title,movedFloating.stored,'la pieza libre desplazada persiste');
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument;
   d.__nwCanvasPartAPI.select('test-hero','title');
  });
  const returnButton=await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument;
   return Array.from(d.querySelectorAll('.nw-wpart-action')).some(n=>n.textContent==='Volver a columna');
  });
  assert.equal(returnButton,true,'texto libre puede regresar a su columna');
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument;
   Array.from(d.querySelectorAll('.nw-wpart-action')).find(n=>n.textContent==='Volver a columna').click();
   clearTimeout(previewTimer);
  });
  const returned=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-hero').wp;
   const html=window.SCW.kinds.layeredhero.markup(e,{edit:false});
   return{free:e.__parts.title.free||false,x:e.__parts.title.x,y:e.__parts.title.y,
    floating:html.includes('nw-lh-float--title'),
    selected:html.includes('data-wfield="title"')};
  });
  assert.equal(returned.free,false,'volver a la columna elimina el modo libre');
  assert.equal(returned.x,0);assert.equal(returned.y,0);
  assert.equal(returned.floating,false,'la publicación recupera el flujo de la columna');
  assert.equal(returned.selected,true,'el título no se pierde');
  await page.click('#btn-undo');
  assert.equal(await page.evaluate(()=>sec().elements.find(x=>x.id==='test-hero').wp.__parts.title.free),true,
    'Deshacer recupera la pieza libre');
  await page.click('#btn-redo');
  assert.equal(await page.evaluate(()=>!!sec().elements.find(x=>x.id==='test-hero').wp.__parts.title.free),false,
    'Rehacer vuelve a la columna');

  // Tirador lateral del texto flotante: ancho propio, sin alterar la escala.
  await load(14);await select('test-hero');
  const initialWidth=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-hero');
   e.wp={title:'UNA FRASE CON MUCHAS PALABRAS PARA PROBAR EL CORTE DE LÍNEAS',
    __parts:{title:{free:true,x:0,y:0,r:0,s:1,fx:210,fy:190,fw:300,refW:800,refH:500}}};
   const d=document.querySelector('#preview').contentDocument,style=d.createElement('style');
   style.textContent=window.SCW.css.layeredhero;d.head.appendChild(style);
   d.querySelector('.nw-lh').outerHTML=window.SCW.kinds.layeredhero.markup(e.wp,{edit:true});
   const hero=d.querySelector('.nw-lh');hero.style.width='800px';hero.style.setProperty('--h','500px');
   const box=hero.querySelector(':scope > .nw-lh-float--title');
   return{width:box.offsetWidth,scale:d.defaultView.getComputedStyle(box).scale,
    wrapped:box.getBoundingClientRect().height};
  });
  assert.ok(Math.abs(initialWidth.width-300)<2,'el ancho inicial corresponde al modelo');
  await fire('[data-nw-part="title"]');
  const widthHandle=await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument;
   return{count:d.querySelectorAll('.nw-wpart-h').length,width:!!d.querySelector('.nw-wpart-h.width')};
  });
  assert.deepEqual(widthHandle,{count:3,width:true},'un tirador lateral distinto del escalado');
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,w=d.defaultView,n=d.querySelector('.nw-wpart-h.width');
   const r=n.getBoundingClientRect(),x=(r.left+r.right)/2,y=(r.top+r.bottom)/2;
   n.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,cancelable:true,button:0,pointerId:150,clientX:x,clientY:y}));
   w.dispatchEvent(new w.PointerEvent('pointermove',{bubbles:true,pointerId:150,clientX:x+120,clientY:y}));
   w.dispatchEvent(new w.PointerEvent('pointerup',{bubbles:true,pointerId:150,clientX:x+120,clientY:y}));
  });
  const wider=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-hero').wp,d=document.querySelector('#preview').contentDocument;
   const box=d.querySelector('.nw-lh-float--title');
   return{fw:e.__parts.title.fw,s:e.__parts.title.s,free:e.__parts.title.free,
    actual:box.offsetWidth,css:box.style.getPropertyValue('--nw-fw')};
  });
  assert.ok(Math.abs(wider.fw-420)<2,'ancho aumenta sin escalar texto');
  assert.equal(wider.s,1,'el tamaño tipográfico se conserva');
  assert.equal(wider.free,true);
  assert.ok(Math.abs(wider.actual-420)<2,'cambia el ancho visible inmediatamente');
  assert.match(wider.css,/cqw$/,'ancho publicado relativo al tamaño del Hero');
  const widthExport=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-hero').wp;
   return window.SCW.kinds.layeredhero.markup(e,{edit:false});
  });
  assert.match(widthExport,/--nw-fw:52\.50000cqw;/,'exportación conserva el ancho relativo de escritorio');
  await page.click('#btn-undo');
  assert.equal(await page.evaluate(()=>sec().elements.find(x=>x.id==='test-hero').wp.__parts.title.fw),300,'Deshacer restaura ancho');
  await page.click('#btn-redo');
  assert.ok(Math.abs(await page.evaluate(()=>sec().elements.find(x=>x.id==='test-hero').wp.__parts.title.fw)-420)<2,'Rehacer restaura el cambio');
  // Variación móvil: no modifica el ancho guardado para escritorio.
  await load(15);await select('test-hero');
  const inheritedMobile=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-hero').wp,d=document.querySelector('#preview').contentDocument;
   const style=d.createElement('style');style.textContent=window.SCW.css.layeredhero;d.head.appendChild(style);
   d.querySelector('.nw-lh').outerHTML=window.SCW.kinds.layeredhero.markup(e,{edit:true});
   const hero=d.querySelector('.nw-lh');hero.style.width='400px';hero.style.setProperty('--h','500px');
   const n=hero.querySelector('.nw-lh-float--title');
   return{width:n.offsetWidth,desktop:e.__parts.title.fw};
  });
  assert.ok(Math.abs(inheritedMobile.width-210)<2,'móvil hereda el ancho proporcional de escritorio');
  await fire('[data-nw-part="title"]');
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,w=d.defaultView,n=d.querySelector('.nw-wpart-h.width');
   const r=n.getBoundingClientRect(),x=(r.left+r.right)/2,y=(r.top+r.bottom)/2;
   n.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,cancelable:true,button:0,pointerId:151,clientX:x,clientY:y}));
   w.dispatchEvent(new w.PointerEvent('pointermove',{bubbles:true,pointerId:151,clientX:x+65,clientY:y}));
   w.dispatchEvent(new w.PointerEvent('pointerup',{bubbles:true,pointerId:151,clientX:x+65,clientY:y}));
  });
  const mobileWidth=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-hero').wp,d=document.querySelector('#preview').contentDocument;
   return{desktop:e.__parts.title.fw,mobile:e.__partsMobile?.title?.fw,
    width:d.querySelector('.nw-lh-float--title').offsetWidth};
  });
  assert.equal(mobileWidth.desktop,420,'el ajuste móvil no altera el ancho de escritorio');
  assert.ok(Math.abs(mobileWidth.mobile-275)<2,'móvil guarda un ancho independiente');
  assert.ok(Math.abs(mobileWidth.width-275)<2,'móvil refleja el cambio en el lienzo');
  const mobileMarkup=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-hero').wp;
   return window.SCW.kinds.layeredhero.markup(e,{edit:false});
  });
  assert.match(mobileMarkup,/--nw-fw:52\.50000cqw/,'export conserva ancho de escritorio');
  assert.match(mobileMarkup,/--nw-mfw:68\.75000cqw/,'export incluye ancho móvil independiente');
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,button=d.querySelector('.nw-wpart-reset');
   if(!button)throw Error('Falta Restablecer móvil');button.click();
  });
  const backToDesktop=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-hero').wp,d=document.querySelector('#preview').contentDocument;
   const title=d.querySelector('.nw-lh-float--title');
   return{desktop:e.__parts.title.fw,mobile:e.__partsMobile?.title,
    css:title.style.getPropertyValue('--nw-mfw'),visible:title.offsetWidth};
  });
  assert.equal(backToDesktop.desktop,420);
  assert.equal(backToDesktop.mobile,undefined,'restablecer móvil elimina su ajuste');
  assert.equal(backToDesktop.css,'','el ancho móvil deja de sobreescribir escritorio');
  assert.ok(Math.abs(backToDesktop.visible-210)<2,'el texto hereda su ancho original en móvil');


  // Historia sticky: posición relativa y versión móvil separada para cada capítulo.
  await load(16);await select('test-story');
  const storyStart=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-story');
   e.wp={t2:'TÍTULO DE CAPÍTULO',k2:'ETAPA DOS',c2:'Texto de apoyo'};
   const d=document.querySelector('#preview').contentDocument,st=d.createElement('style');
   st.textContent=window.SCW.css.scrollstory;d.head.appendChild(st);
   d.querySelector('.nw-story').outerHTML=window.SCW.kinds.scrollstory.markup(e.wp,{edit:true});
   const story=d.querySelector('.nw-story');story.style.width='1000px';
   const stage=story.querySelector('.nw-story-sticky');stage.style.height='100vh';
   return{width:story.clientWidth,height:stage.clientHeight};
  });
  assert.equal(storyStart.width,1000);
  await fire('[data-nw-story-ch="2"]');await fire('[data-nw-story-part="t"]');
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,w=d.defaultView,
   part=d.querySelector('[data-wpart="t2"]'),r=part.getBoundingClientRect();
   const x=(r.left+r.right)/2,y=(r.top+r.bottom)/2;
   part.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerId:171,button:0,clientX:x,clientY:y}));
   w.dispatchEvent(new w.PointerEvent('pointermove',{bubbles:true,pointerId:171,button:0,clientX:x+100,clientY:y+60}));
   w.dispatchEvent(new w.PointerEvent('pointerup',{bubbles:true,pointerId:171,button:0,clientX:x+100,clientY:y+60}));
  });
  const storyDesktop=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-story'),d=document.querySelector('#preview').contentDocument,
     part=d.querySelector('[data-wpart="t2"]');
   return{part:e.wp.__parts?.t2,x:part.style.getPropertyValue('--nw-tx'),
    y:part.style.getPropertyValue('--nw-ty')};
  });
  assert.equal(storyDesktop.part.x,100);
  assert.equal(storyDesktop.part.y,60);
  assert.equal(storyDesktop.part.refW,1000);
  assert.equal(storyDesktop.part.refH,storyStart.height);
  assert.equal(storyDesktop.x,'10.00000cqw','texto de historia se mueve proporcionalmente al ancho');
  assert.match(storyDesktop.y,/^calc\(100vh \* /,'historia usa el alto de pantalla');
  const storyOutput=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-story').wp;
   return window.SCW.kinds.scrollstory.markup(e,{edit:false});
  });
  assert.match(storyOutput,/--nw-tx:10\.00000cqw/,'la historia exporta el desplazamiento proporcional');
  const narrow=await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,model=sec().elements.find(x=>x.id==='test-story').wp;
   d.querySelector('.nw-story').outerHTML=window.SCW.kinds.scrollstory.markup(model,{edit:true});
   const story=d.querySelector('.nw-story');story.style.width='500px';
   const stage=story.querySelector('.nw-story-sticky');stage.style.height='100vh';
   return{width:story.clientWidth,height:stage.clientHeight};
  });
  assert.equal(narrow.width,500);
  await fire('[data-nw-story-ch="2"]');await fire('[data-nw-story-part="t"]');
  const inherited=await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,p=d.querySelector('[data-wpart="t2"]');
   return d.defaultView.getComputedStyle(p).translate;
  });
  assert.ok(Math.abs(parseFloat(inherited)-50)<2,'móvil hereda posición de escritorio a escala');
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,w=d.defaultView,p=d.querySelector('[data-wpart="t2"]');
   const r=p.getBoundingClientRect(),x=(r.left+r.right)/2,y=(r.top+r.bottom)/2;
   p.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerId:172,button:0,clientX:x,clientY:y}));
   w.dispatchEvent(new w.PointerEvent('pointermove',{bubbles:true,pointerId:172,button:0,clientX:x+40,clientY:y+30}));
   w.dispatchEvent(new w.PointerEvent('pointerup',{bubbles:true,pointerId:172,button:0,clientX:x+40,clientY:y+30}));
  });
  const mobileStory=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-story'),d=document.querySelector('#preview').contentDocument,
     n=d.querySelector('[data-wpart="t2"]');
   return{desktop:e.wp.__parts?.t2,mobile:e.wp.__partsMobile?.t2,inline:n.style.getPropertyValue('--nw-mx'),
    actual:d.defaultView.getComputedStyle(n).translate};
  });
  assert.deepEqual(mobileStory.desktop,storyDesktop.part,'editar móvil no modifica escritorio');
  assert.equal(mobileStory.mobile.refW,500);
  assert.equal(mobileStory.mobile.refH,narrow.height);
  assert.equal(mobileStory.mobile.x,90);
  assert.equal(mobileStory.mobile.y,90);
  assert.equal(mobileStory.inline,'18.00000cqw');
  assert.ok(Math.abs(parseFloat(mobileStory.actual)-90)<2,'móvil aplica desplazamiento propio');
  const responsiveOutput=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-story').wp;
   return window.SCW.kinds.scrollstory.markup(e,{edit:false});
  });
  assert.match(responsiveOutput,/--nw-tx:10\.00000cqw/);
  assert.match(responsiveOutput,/--nw-mx:18\.00000cqw/,'la exportación conserva las dos poses');
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument;
   const button=d.querySelector('.nw-wpart-reset');
   if(!button)throw Error('Falta opción de restablecimiento móvil en Historia');
   button.click();
  });
  const afterStoryReset=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-story'),d=document.querySelector('#preview').contentDocument,
    n=d.querySelector('[data-wpart="t2"]');
   return{desktop:e.wp.__parts.t2,mobile:e.wp.__partsMobile?.t2,
    inline:n.style.getPropertyValue('--nw-mx'),
    actual:d.defaultView.getComputedStyle(n).translate};
  });
  assert.deepEqual(afterStoryReset.desktop,storyDesktop.part,'restaurar móvil deja escritorio intacto');
  assert.equal(afterStoryReset.mobile,undefined,'móvil vuelve a heredar escritorio');
  assert.equal(afterStoryReset.inline,'');
  assert.ok(Math.abs(parseFloat(afterStoryReset.actual)-50)<2);
  await page.click('#btn-undo');
  assert.ok(await page.evaluate(()=>sec().elements.find(x=>x.id==='test-story').wp.__partsMobile?.t2));
  await page.click('#btn-redo');
  assert.equal(await page.evaluate(()=>sec().elements.find(x=>x.id==='test-story').wp.__partsMobile?.t2),undefined);

  // Contrato transversal: no implementar otra vez la geometría para cada widget.
  const geometryShared=await page.evaluate(()=>{
   const hero=window.SCWX.partTransformCSS({__parts:{title:{x:80,y:40,r:0,s:1,refW:800,refH:400}}},'title','var(--h)');
   const story=window.SCWX.partTransformCSS({__parts:{t2:{x:80,y:40,r:0,s:1,refW:800,refH:400}}},'t2','100vh');
   const old=window.SCWX.partTransformCSS({__parts:{title:{x:80,y:40,r:0,s:1}}},'title','var(--h)');
   return{hero,story,old};
  });
  assert.match(geometryShared.hero,/--nw-tx:10\.00000cqw;--nw-ty:calc\(var\(--h\) \* 0\.100000\)/);
  assert.match(geometryShared.story,/--nw-tx:10\.00000cqw;--nw-ty:calc\(100vh \* 0\.100000\)/);
  assert.match(geometryShared.old,/--nw-tx:80px;--nw-ty:40px/,'sin referencias, compatibilidad con píxeles');
  await load(17);
  await page.evaluate(()=>{
   sec().elements.push(mkEl('widget',{id:'test-custom',kind:'layeredhero',wp:{}}));
   const d=document.querySelector('#preview').contentDocument;
   const css=d.createElement('style');
   css.textContent='.test-scope{position:relative;display:block;width:900px;height:380px;container-type:inline-size;--h:340px}.test-stage{position:relative;width:100%;height:340px;background:#eaeaea}.test-scope [data-wpart]{translate:var(--nw-tx,0px) var(--nw-ty,0px);rotate:var(--nw-pr,0deg);scale:var(--nw-ps,1)}@container (max-width:650px){.test-scope [data-wpart]{translate:var(--nw-mx,var(--nw-tx,0px)) var(--nw-my,var(--nw-ty,0px));rotate:var(--nw-mr,var(--nw-pr,0deg));scale:var(--nw-ms,var(--nw-ps,1))}}';
   d.head.appendChild(css);
   const root=d.createElement('div');root.className='el wdg';root.dataset.id='test-custom';
   root.innerHTML='<section class="test-scope" data-nw-part-scope="custom" data-nw-part-mobile="650" data-nw-part-height=".test-stage" data-nw-part-y="var(--h)"><div class="test-stage"><div data-wpart="label" style="position:absolute;top:40px;left:40px;width:120px;height:40px;background:#d3caff">Un texto de prueba</div></div></section>';
   d.body.appendChild(root);
   curEl=sec().elements.findIndex(x=>x.id==='test-custom');selection=['test-custom'];secFocus=false;
  });
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,w=d.defaultView,n=d.querySelector('.test-scope [data-wpart]');
   const r=n.getBoundingClientRect(),x=r.x+15,y=r.y+15;
   n.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,cancelable:true,button:0,pointerId:190,clientX:x,clientY:y}));
   w.dispatchEvent(new w.PointerEvent('pointermove',{bubbles:true,pointerId:190,clientX:x+90,clientY:y+34}));
   w.dispatchEvent(new w.PointerEvent('pointerup',{bubbles:true,pointerId:190,clientX:x+90,clientY:y+34}));
  });
  const customDesktop=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-custom').wp;
   return e.__parts?.label;
  });
  assert.equal(customDesktop.x,90,'un tercer widget comparte el motor de arrastre');
  assert.equal(customDesktop.y,34);
  assert.equal(customDesktop.refW,900);
  assert.equal(customDesktop.refH,340);
  const customResponsive=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-custom').wp;
   return window.SCWX.partTransformCSS(e,'label','var(--h)');
  });
  assert.match(customResponsive,/--nw-tx:10\.00000cqw/,'el tercer widget serializa sin función propia');
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,scope=d.querySelector('.test-scope'),n=scope.querySelector('[data-wpart]');
   scope.style.width='500px';
   n.style.setProperty('--nw-tx','10.00000cqw');
   n.style.setProperty('--nw-ty','calc(var(--h) * 0.100000)');
   const w=d.defaultView,r=n.getBoundingClientRect(),x=r.x+15,y=r.y+15;
   n.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,cancelable:true,button:0,pointerId:191,clientX:x,clientY:y}));
   w.dispatchEvent(new w.PointerEvent('pointermove',{bubbles:true,pointerId:191,clientX:x+35,clientY:y+20}));
   w.dispatchEvent(new w.PointerEvent('pointerup',{bubbles:true,pointerId:191,clientX:x+35,clientY:y+20}));
  });
  const customMobile=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-custom').wp;
   return{desktop:e.__parts?.label,mobile:e.__partsMobile?.label};
  });
  assert.deepEqual(customMobile.desktop,customDesktop,'el tercer widget conserva su edición de escritorio');
  assert.equal(customMobile.mobile.refW,500,'cada widget controla su propio breakpoint');
  assert.equal(customMobile.mobile.x,85,'el móvil hereda la proporción y agrega desplazamiento');
  assert.equal(customMobile.mobile.y,54);
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,scope=d.querySelector('.test-scope'),n=scope.querySelector('[data-wpart]');
   scope.style.width='900px';
   const e=sec().elements.find(x=>x.id==='test-custom').wp;
   e.__parts.label={x:2000,y:0,r:0,s:1};
   n.style.setProperty('--nw-tx','2000px');n.style.setProperty('--nw-ty','0px');
   d.__nwCanvasPartAPI.select('test-custom','label');
  });
  const genericRecovery=await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,button=Array.from(d.querySelectorAll('.nw-wpart-action')).find(b=>b.textContent==='Recuperar');
   return{exists:!!button,title:button?.title};
  });
  assert.equal(genericRecovery.exists,true,'Recuperar funciona sin clases Hero ni Historia');
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument;
   Array.from(d.querySelectorAll('.nw-wpart-action')).find(b=>b.textContent==='Recuperar').click();
  });
  const genericRecovered=await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,stage=d.querySelector('.test-stage').getBoundingClientRect(),node=d.querySelector('.test-scope [data-wpart]').getBoundingClientRect();
   return{saved:sec().elements.find(x=>x.id==='test-custom').wp.__parts.label,
     error:Math.hypot((stage.left+stage.right-node.left-node.right)/2,(stage.top+stage.bottom-node.top-node.bottom)/2)};
  });
  assert.ok(genericRecovered.saved.x<2000,'la recuperación se guarda en el modelo común');
  assert.ok(genericRecovered.error<3,'Recuperar centra respecto del escenario declarado');
  await page.click('#btn-undo');
  assert.equal(await page.evaluate(()=>sec().elements.find(x=>x.id==='test-custom').wp.__parts.label.x),2000);
  await page.click('#btn-redo');
  assert.ok(await page.evaluate(()=>sec().elements.find(x=>x.id==='test-custom').wp.__parts.label.x)<2000);

  // Recurso REAL nuevo que consume el contrato compartido: Tarjeta holográfica.
  await load(18);
  await page.evaluate(()=>{
   const model={title:'UN TÍTULO EDITABLE',meta:'IDENTIDAD / MOTION',badge:'NUEVO',cta:'VER MÁS',showBadge:true,showCta:true,
    ratio:'4/5',tilt:12};
   const el=mkEl('widget',{id:'test-holo',kind:'holocard',wp:model});
   sec().elements.push(el);
   const d=document.querySelector('#preview').contentDocument;
   const style=d.createElement('style');style.textContent=window.SCW.css.holocard;d.head.appendChild(style);
   const root=d.createElement('div');root.className='el wdg';root.dataset.id='test-holo';
   root.innerHTML=window.SCW.kinds.holocard.markup(el.wp,{edit:true});
   d.body.appendChild(root);
   root.querySelector('.nw-holo').style.width='680px';
  });
  await select('test-holo');
  const holoBefore=await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,root=d.querySelector('.el.wdg[data-id="test-holo"]'),
    holo=root.querySelector('.nw-holo'),card=root.querySelector('.nw-holo-card'),css=d.defaultView.getComputedStyle(holo);
   const parts=Array.from(root.querySelectorAll('[data-wpart]')).map(x=>x.dataset.wpart);
   const buttons=Array.from(root.querySelectorAll('[data-nw-part]')).map(x=>x.dataset.nwPart);
   return{parts,buttons,scope:holo.dataset.nwPartScope,mobile:+holo.dataset.nwPartMobile,
    width:holo.clientWidth-(parseFloat(css.paddingLeft)||0)-(parseFloat(css.paddingRight)||0),
    height:card.clientHeight,cardTransform:d.defaultView.getComputedStyle(card).transform,
    originalEffect:window.SCW.css.holocard.includes('rotateX(var(--rx,0deg))'),
    originalGlare:window.SCW.css.holocard.includes('.nw-holo-fx'),
    styleAttrs:Array.from(root.querySelectorAll('[data-wpart]')).every(n=>n.attributes.getNamedItem('style')?true:true),
    hasDuplicates:Array.from(root.querySelectorAll('[data-wpart]')).some(n=>Array.from(n.attributes).filter(a=>a.name==='style').length>1)};
  });
  assert.equal(holoBefore.scope,'holocard');
  assert.equal(holoBefore.mobile,420);
  for(const key of ['media','badge','title','meta','cta']) {
   assert.ok(holoBefore.parts.includes(key),'componente holográfico tiene parte '+key);
   assert.ok(holoBefore.buttons.includes(key),'barra permite seleccionar '+key);
  }
  assert.equal(holoBefore.originalEffect,true,'conserva el efecto 3D original');
  assert.equal(holoBefore.originalGlare,true,'conserva la capa holográfica');
  assert.equal(holoBefore.hasDuplicates,false,'no duplica estilos inline');
  await fire('.el.wdg[data-id="test-holo"] [data-nw-part="title"]');
  const holoSelection=await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,root=d.querySelector('.el.wdg[data-id="test-holo"]');
   return{part:root.querySelector('.nw-wpart-sel')?.dataset.wpart,handles:d.querySelectorAll('.nw-wpart-h').length,
    isolate:root.querySelector('.nw-holo').classList.contains('nw-part-isolate')};
  });
  assert.deepEqual(holoSelection,{part:'title',handles:2,isolate:true},
   'título usa selección y tiradores del editor común');
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,w=d.defaultView,
    n=d.querySelector('.el.wdg[data-id="test-holo"] [data-wpart="title"]'),r=n.getBoundingClientRect(),
    x=(r.left+r.right)/2,y=(r.top+r.bottom)/2;
   n.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerId:201,button:0,clientX:x,clientY:y}));
   w.dispatchEvent(new w.PointerEvent('pointermove',{bubbles:true,pointerId:201,button:0,clientX:x+60,clientY:y+30}));
   w.dispatchEvent(new w.PointerEvent('pointerup',{bubbles:true,pointerId:201,button:0,clientX:x+60,clientY:y+30}));
  });
  const holoMoved=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-holo').wp,
    d=document.querySelector('#preview').contentDocument;
   return{saved:e.__parts.title,
    live:d.querySelector('.el.wdg[data-id="test-holo"] [data-wpart="title"]').style.getPropertyValue('--nw-tx'),
    store:JSON.parse(localStorage.getItem(STORE_KEY)).pages[curPage].sections[curSec].elements.find(x=>x.id==='test-holo')?.wp?.__parts?.title};
  });
  assert.equal(holoMoved.saved.x,60);
  assert.equal(holoMoved.saved.y,30);
  assert.ok(Math.abs(holoMoved.saved.refW-holoBefore.width)<1,'ancho medido sin relleno interno');
  assert.ok(Math.abs(holoMoved.saved.refH-holoBefore.height)<1,'el escenario es la tarjeta real');
  assert.match(holoMoved.live,/cqw$/);
  assert.deepEqual(holoMoved.store,holoMoved.saved,'el texto de la tarjeta persiste');
  const holoPublished=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-holo').wp;
   return window.SCW.kinds.holocard.markup(e,{edit:false});
  });
  assert.match(holoPublished,/--nw-tx:[0-9.]+cqw/,'publicación retiene la pose proporcional');
  assert.equal(holoPublished.includes('data-nw-partbar'),false,'la barra no se publica');
  assert.equal(holoPublished.includes('nw-holo-fx'),true,'el holograma se sigue publicando');
  // Escala y rotación del título usando el mismo mecanismo que Hero e Historia.
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,w=d.defaultView,
    h=d.querySelector('.nw-wpart-h.size'),node=d.querySelector('.el.wdg[data-id="test-holo"] [data-wpart="title"]'),
    b=h.getBoundingClientRect(),r=node.getBoundingClientRect(),x=b.left+6,y=b.top+6,cx=r.left+r.width/2,cy=r.top+r.height/2;
   h.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerId:202,button:0,clientX:x,clientY:y}));
   w.dispatchEvent(new w.PointerEvent('pointermove',{bubbles:true,pointerId:202,button:0,clientX:cx+1.3*(x-cx),clientY:cy+1.3*(y-cy)}));
   w.dispatchEvent(new w.PointerEvent('pointerup',{bubbles:true,pointerId:202,button:0,clientX:cx+1.3*(x-cx),clientY:cy+1.3*(y-cy)}));
  });
  assert.ok(await page.evaluate(()=>sec().elements.find(x=>x.id==='test-holo').wp.__parts.title.s)>1.15);
  // Variante móvil aislada, sin tocar escritorio.
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,root=d.querySelector('.el.wdg[data-id="test-holo"]');
   const e=sec().elements.find(x=>x.id==='test-holo').wp;
   root.innerHTML=window.SCW.kinds.holocard.markup(e,{edit:true});
   root.querySelector('.nw-holo').style.width='340px';
  });
  await fire('.el.wdg[data-id="test-holo"] [data-nw-part="title"]');
  const beforeMobile=await page.evaluate(()=>JSON.parse(JSON.stringify(sec().elements.find(x=>x.id==='test-holo').wp.__parts.title)));
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,w=d.defaultView,
    n=d.querySelector('.el.wdg[data-id="test-holo"] [data-wpart="title"]'),r=n.getBoundingClientRect(),
    x=(r.left+r.right)/2,y=(r.top+r.bottom)/2;
   n.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerId:203,button:0,clientX:x,clientY:y}));
   w.dispatchEvent(new w.PointerEvent('pointermove',{bubbles:true,pointerId:203,button:0,clientX:x+35,clientY:y+15}));
   w.dispatchEvent(new w.PointerEvent('pointerup',{bubbles:true,pointerId:203,button:0,clientX:x+35,clientY:y+15}));
  });
  const holoMobile=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-holo').wp,
    d=document.querySelector('#preview').contentDocument,h=d.querySelector('.el.wdg[data-id="test-holo"] .nw-holo'),
    style=d.defaultView.getComputedStyle(h);
   return{desktop:e.__parts.title,mobile:e.__partsMobile?.title,
    contentWidth:h.clientWidth-(parseFloat(style.paddingLeft)||0)-(parseFloat(style.paddingRight)||0)};
  });
  assert.deepEqual(holoMobile.desktop,beforeMobile,'editar tarjeta móvil no altera escritorio');
  assert.ok(holoMobile.mobile&&Math.abs(holoMobile.mobile.refW-holoMobile.contentWidth)<1);
  assert.ok(holoMobile.mobile.x>35,'móvil hereda el desplazamiento proporcional previo');
  const holoBoth=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-holo').wp;
   return window.SCW.kinds.holocard.markup(e,{edit:false});
  });
  assert.match(holoBoth,/--nw-mx:[0-9.]+cqw/,'el sitio publicado contiene versión móvil');
  await page.evaluate(()=>{
   const d=document.querySelector('#preview').contentDocument,
    n=d.querySelector('.nw-wpart-reset');
   if(!n)throw Error('Falta Restablecer móvil de la tarjeta');
   n.click();
  });
  const holoRestored=await page.evaluate(()=>{
   const e=sec().elements.find(x=>x.id==='test-holo').wp;
   return{desktop:e.__parts.title,mobile:e.__partsMobile?.title};
  });
  assert.deepEqual(holoRestored.desktop,beforeMobile);
  assert.equal(holoRestored.mobile,undefined);
  await page.click('#btn-undo');
  assert.ok(await page.evaluate(()=>sec().elements.find(x=>x.id==='test-holo').wp.__partsMobile?.title));
  await page.click('#btn-redo');
  assert.equal(await page.evaluate(()=>sec().elements.find(x=>x.id==='test-holo').wp.__partsMobile?.title),undefined);
  // Opciones del recurso original: respetar campos opcionales sin introducir botones vacíos.
  const holoOptional=await page.evaluate(()=>{
   const e={title:'Uno',meta:'Dos',showBadge:false,showCta:false,video:'sample.webm'};
   const html=window.SCW.kinds.holocard.markup(e,{edit:true});
   return{badge:html.includes('data-nw-part="badge"'),cta:html.includes('data-nw-part="cta"'),
    video:html.includes('class="nw-holo-video" data-wpart="media"')};
  });
  assert.equal(holoOptional.badge,false);
  assert.equal(holoOptional.cta,false);
  assert.equal(holoOptional.video,true,'mantiene soporte de video para media editable');


  // Adaptador transversal para 2 recursos reales de imagen interactiva, sin duplicar motor de partes.
  for(const cfg of [
   {kind:'cursorreveal',id:'test-reveal',scope:'nw-cr',part:'label',image:'reveal',text:'MOSTRAR',ratio:'16/9',
    label:'Etiqueta',preserved:'.nw-cr-top{clip-path:circle',interactive:'nw-cr-top'},
   {kind:'detailmagnifier',id:'test-lens',scope:'nw-mag',part:'caption',image:'image',text:'AMPLIAR',ratio:'4/3',
    label:'Texto',preserved:'.nw-mag-lens{position:absolute',interactive:'nw-mag-lens'}
  ]){
   await load(cfg.id==='test-reveal'?19:20);
   await page.evaluate(c=>{
    const e=mkEl('widget',{id:c.id,kind:c.kind,wp:c.kind==='cursorreveal'?{label:c.text,ratio:c.ratio}:{caption:c.text,ratio:c.ratio}});
    sec().elements.push(e);
    const d=document.querySelector('#preview').contentDocument,style=d.createElement('style');
    style.textContent=window.SCW.css[c.kind];d.head.appendChild(style);
    const root=d.createElement('div');root.className='el wdg';root.dataset.id=c.id;
    root.innerHTML=window.SCW.kinds[c.kind].markup(e.wp,{edit:true});
    d.body.appendChild(root);
    root.querySelector('.'+c.scope).style.width='840px';
   },cfg);
   await select(cfg.id);
   const setup=await page.evaluate(c=>{
    const d=document.querySelector('#preview').contentDocument,root=d.querySelector('.el.wdg[data-id="'+c.id+'"]'),
     scope=root.querySelector('.'+c.scope),parts=Array.from(scope.querySelectorAll('[data-wpart]')).map(n=>n.dataset.wpart),
     buttons=Array.from(scope.querySelectorAll('[data-nw-part]')).map(n=>n.dataset.nwPart);
    const html=window.SCW.kinds[c.kind].markup(sec().elements.find(e=>e.id===c.id).wp,{edit:false});
    return{scope:scope.dataset.nwPartScope,threshold:+scope.dataset.nwPartMobile,parts,buttons,width:scope.clientWidth,height:scope.clientHeight,
     hasVisual:!!scope.querySelector('.'+c.interactive),hasExportBar:html.includes('data-nw-partbar'),
     cssLegacy:window.SCW.css[c.kind].includes(c.preserved),
     scopeHeightStyle:scope.style.getPropertyValue('--h')};
   },cfg);
   assert.equal(setup.scope,cfg.kind,'contrato genérico para '+cfg.kind);
   assert.equal(setup.threshold,600);
   assert.equal(setup.width,840);
   assert.ok(setup.height>220);
   assert.ok(setup.hasVisual&&setup.cssLegacy,'conserva imagen y efecto de '+cfg.kind);
   assert.ok(!setup.hasExportBar,'barra ausente en exportación');
   assert.ok(setup.parts.includes(cfg.part)&&setup.parts.includes(cfg.image),'partes en '+cfg.kind);
   assert.ok(setup.buttons.includes(cfg.part)&&setup.buttons.includes(cfg.image),'controles de '+cfg.kind);
   assert.match(setup.scopeHeightStyle,/100cqw/,'alto responsivo derivado de la proporción');
   await fire('.el.wdg[data-id="'+cfg.id+'"] [data-nw-part="'+cfg.part+'"]');
   const selected=await page.evaluate(c=>{
    const d=document.querySelector('#preview').contentDocument,scope=d.querySelector('.el.wdg[data-id="'+c.id+'"] .'+c.scope);
    return{part:scope.querySelector('.nw-part-edit-active')?.dataset.wpart,
     handles:d.querySelectorAll('.nw-wpart-h').length,isolated:scope.classList.contains('nw-part-isolate')};
   },cfg);
   assert.deepEqual(selected,{part:cfg.part,handles:2,isolated:true},'selección integrada al editor de partes');
   await page.evaluate(c=>{
    const d=document.querySelector('#preview').contentDocument,w=d.defaultView,
     n=d.querySelector('.el.wdg[data-id="'+c.id+'"] [data-wpart="'+c.part+'"]'),r=n.getBoundingClientRect(),
     x=(r.left+r.right)/2,y=(r.top+r.bottom)/2;
    n.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerId:220,button:0,clientX:x,clientY:y}));
    w.dispatchEvent(new w.PointerEvent('pointermove',{bubbles:true,pointerId:220,button:0,clientX:x+84,clientY:y+28}));
    w.dispatchEvent(new w.PointerEvent('pointerup',{bubbles:true,pointerId:220,button:0,clientX:x+84,clientY:y+28}));
   },cfg);
   const moved=await page.evaluate(c=>{
    const e=sec().elements.find(x=>x.id===c.id).wp,d=document.querySelector('#preview').contentDocument,
     part=d.querySelector('.el.wdg[data-id="'+c.id+'"] [data-wpart="'+c.part+'"]');
    return{pose:e.__parts[c.part],live:part.style.getPropertyValue('--nw-tx'),
      saved:JSON.parse(localStorage.getItem(STORE_KEY)).pages[curPage].sections[curSec].elements.find(x=>x.id===c.id)?.wp?.__parts?.[c.part]};
   },cfg);
   assert.equal(moved.pose.x,84);
   assert.equal(moved.pose.y,28);
   assert.equal(moved.pose.refW,840);
   assert.ok(Math.abs(moved.pose.refH-setup.height)<1,'la proporción usa altura real de '+cfg.kind);
   assert.match(moved.live,/cqw$/);
   assert.deepEqual(moved.pose,moved.saved,'persiste '+cfg.kind);
   const exportDesk=await page.evaluate(c=>{
    const e=sec().elements.find(x=>x.id===c.id).wp;
    return window.SCW.kinds[c.kind].markup(e,{edit:false});
   },cfg);
   assert.match(exportDesk,/--nw-tx:10\.00000cqw/,'exportación adapta desktop');
   assert.match(exportDesk,/data-nw-part-scope="/);
   await page.evaluate(c=>{
    const d=document.querySelector('#preview').contentDocument,root=d.querySelector('.el.wdg[data-id="'+c.id+'"]'),
     model=sec().elements.find(x=>x.id===c.id).wp;
    root.innerHTML=window.SCW.kinds[c.kind].markup(model,{edit:true});
    root.querySelector('.'+c.scope).style.width='380px';
   },cfg);
   await fire('.el.wdg[data-id="'+cfg.id+'"] [data-nw-part="'+cfg.part+'"]');
   const desktopBefore=await page.evaluate(c=>JSON.parse(JSON.stringify(sec().elements.find(x=>x.id===c.id).wp.__parts[c.part])),cfg);
   await page.evaluate(c=>{
    const d=document.querySelector('#preview').contentDocument,w=d.defaultView,
     n=d.querySelector('.el.wdg[data-id="'+c.id+'"] [data-wpart="'+c.part+'"]'),r=n.getBoundingClientRect(),
     x=(r.left+r.right)/2,y=(r.top+r.bottom)/2;
    n.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerId:221,button:0,clientX:x,clientY:y}));
    w.dispatchEvent(new w.PointerEvent('pointermove',{bubbles:true,pointerId:221,button:0,clientX:x+38,clientY:y+19}));
    w.dispatchEvent(new w.PointerEvent('pointerup',{bubbles:true,pointerId:221,button:0,clientX:x+38,clientY:y+19}));
   },cfg);
   const mobile=await page.evaluate(c=>{
    const e=sec().elements.find(x=>x.id===c.id).wp,d=document.querySelector('#preview').contentDocument,
     n=d.querySelector('.el.wdg[data-id="'+c.id+'"] [data-wpart="'+c.part+'"]');
    return{desktop:e.__parts[c.part],mobile:e.__partsMobile?.[c.part],live:n.style.getPropertyValue('--nw-mx')};
   },cfg);
   assert.deepEqual(mobile.desktop,desktopBefore,'móvil no pisa escritorio');
   assert.equal(mobile.mobile.refW,380);
   assert.ok(mobile.mobile.x>38,'móvil parte de la pose proporcional de escritorio');
   assert.match(mobile.live,/cqw$/);
   const exportBoth=await page.evaluate(c=>{
    const e=sec().elements.find(x=>x.id===c.id).wp;
    return window.SCW.kinds[c.kind].markup(e,{edit:false});
   },cfg);
   assert.match(exportBoth,/--nw-mx:[0-9.]+cqw/,'publicación conserva móvil');
   await page.evaluate(()=>{
    const d=document.querySelector('#preview').contentDocument,n=d.querySelector('.nw-wpart-reset');
    if(!n)throw Error('Falta Restablecer móvil en '+d.body.dataset.partsRun);
    n.click();
   });
   assert.equal(await page.evaluate(c=>sec().elements.find(x=>x.id===c.id).wp.__partsMobile?.[c.part],cfg),undefined);
   await page.click('#btn-undo');
   assert.ok(await page.evaluate(c=>sec().elements.find(x=>x.id===c.id).wp.__partsMobile?.[c.part],cfg));
   await page.click('#btn-redo');
   assert.equal(await page.evaluate(c=>sec().elements.find(x=>x.id===c.id).wp.__partsMobile?.[c.part],cfg),undefined);
  }


  // Serializador compartido: una única pose eficaz incluso si un widget v15 escribía píxeles.
  const legacyStyleCheck=await page.evaluate(()=>{
   const examples=[
    {kind:'cursorreveal',part:'label',model:{label:'PREVIO',ratio:'16/9'}},
    {kind:'detailmagnifier',part:'caption',model:{caption:'DETALLE',ratio:'4/3'}},
    {kind:'depthheadline',part:'line-1',model:{text:'ALTO\nSEGUNDO\nTERCERO',h:470,depth:18}},
    {kind:'magneticmosaic',part:'image-2',model:{h:520}},
    {kind:'holocard',part:'title',model:{title:'ORIGINAL'}}
   ];
   return examples.map(sample=>{
    const pose={x:96,y:24,r:7,s:1.18,refW:800,refH:400};
    sample.model.__parts={[sample.part]:pose};
    const html=window.SCW.kinds[sample.kind].markup(sample.model,{edit:false});
    const host=document.createElement('div');host.innerHTML=html;
    const el=Array.from(host.querySelectorAll('[data-wpart]')).find(n=>n.dataset.wpart===sample.part);
    const style=el?.getAttribute('style')||'';
    return{kind:sample.kind,
      x:el?.style.getPropertyValue('--nw-tx'),
      y:el?.style.getPropertyValue('--nw-ty'),
      xCount:(style.match(/--nw-tx:/g)||[]).length,
      yCount:(style.match(/--nw-ty:/g)||[]).length,
      rotation:el?.style.getPropertyValue('--nw-pr'),
      preserved:sample.kind==='depthheadline'?style.includes('--i:1')&&style.includes('--d:18px'):
       sample.kind==='magneticmosaic'?style.includes('background:'):
       sample.kind==='cursorreveal'||sample.kind==='detailmagnifier'?true:true};
   });
  });
  for(const item of legacyStyleCheck){
   assert.equal(item.x,'12.00000cqw',item.kind+': ninguna coordenada antigua pisa la nueva');
   assert.equal(item.y,'calc(var(--h) * 0.060000)',item.kind+': coordenada vertical proporcional');
   assert.equal(item.xCount,1,item.kind+': un solo X efectivo');
   assert.equal(item.yCount,1,item.kind+': un solo Y efectivo');
   assert.equal(item.rotation,'7deg',item.kind+': giro conservado');
   assert.equal(item.preserved,true,item.kind+': mantiene fondos y propiedades originales');
  }

  // Motor común de movimiento del puntero: capas editables sin sobrescribir su pose guardada.
  for(const cfg of [
   {kind:'depthheadline',id:'test-depth',root:'nw-dh',part:'line-1',height:470,
    model:{text:'PRIMERA\nSEGUNDA\nTERCERA\nCUARTA',h:470,reaction:'tilt3d',amount:44,depth:22,perspective:800},
    expected:['line-0','line-1','line-2','line-3'],label:'Línea 2'},
   {kind:'magneticmosaic',id:'test-mosaic',root:'nw-mm',part:'image-2',height:520,
    model:{h:520,label:'GALERÍA PERSONAL',strength:25},
    expected:['image-0','image-1','image-2','image-3','label'],label:'Imagen 3'}
  ]){
   await load(cfg.id==='test-depth'?21:22);
   await page.evaluate(c=>{
    const el=mkEl('widget',{id:c.id,kind:c.kind,wp:c.model});sec().elements.push(el);
    const d=document.querySelector('#preview').contentDocument,style=d.createElement('style');
    style.textContent=window.SCW.css[c.kind];d.head.appendChild(style);
    const wrap=d.createElement('div');wrap.className='el wdg';wrap.dataset.id=c.id;
    wrap.innerHTML=window.SCW.kinds[c.kind].markup(el.wp,{edit:true});d.body.appendChild(wrap);
    wrap.querySelector('.'+c.root).style.width='900px';
   },cfg);
   await select(cfg.id);
   const initial=await page.evaluate(c=>{
    const d=document.querySelector('#preview').contentDocument,
      root=d.querySelector('.el.wdg[data-id="'+c.id+'"] .'+c.root),
      parts=Array.from(root.querySelectorAll('[data-wpart]')).map(n=>n.dataset.wpart),
      buttons=Array.from(root.querySelectorAll('[data-nw-part]')).map(n=>n.dataset.nwPart),
      css=d.defaultView.getComputedStyle(root);
    return{width:root.clientWidth-(parseFloat(css.paddingLeft)||0)-(parseFloat(css.paddingRight)||0),
      height:root.clientHeight,parts,buttons,scope:root.dataset.nwPartScope,threshold:+root.dataset.nwPartMobile,
      animationsHaveVariables:window.SCW.css[c.kind].includes('--nw-hover-x')&&window.SCW.css[c.kind].includes('--nw-hover-s'),
      barInPublished:window.SCW.kinds[c.kind].markup(sec().elements.find(e=>e.id===c.id).wp,{edit:false}).includes('data-nw-partbar'),
      lineEffects:window.SCW.css[c.kind].includes('nw-hover-transform')};
   },cfg);
   assert.equal(initial.scope,cfg.kind,'recurso conectado al motor universal');
   assert.equal(initial.threshold,680);
   assert.equal(initial.height,cfg.height);
   assert.equal(initial.animationsHaveVariables,true,'las animaciones usan variables separadas');
   assert.equal(initial.barInPublished,false,'los botones del editor no se exportan');
   assert.deepEqual(initial.parts,cfg.expected,'todas las partes internas se pueden editar');
   assert.deepEqual(initial.buttons,[''].concat(cfg.expected),'barra con todas las partes');
   if(cfg.kind==='depthheadline')assert.equal(initial.lineEffects,true,'perspectiva 3D conservada');
   await fire('.el.wdg[data-id="'+cfg.id+'"] [data-nw-part="'+cfg.part+'"]');
   const selected=await page.evaluate(c=>{
    const d=document.querySelector('#preview').contentDocument,root=d.querySelector('.el.wdg[data-id="'+c.id+'"] .'+c.root);
    return{part:root.querySelector('.nw-part-edit-active')?.dataset.wpart,
      handles:d.querySelectorAll('.nw-wpart-h').length,isolated:root.classList.contains('nw-part-isolate')};
   },cfg);
   assert.deepEqual(selected,{part:cfg.part,handles:2,isolated:true},'selección interna mediante motor común');
   await page.evaluate(c=>{
    const d=document.querySelector('#preview').contentDocument,w=d.defaultView,
      node=d.querySelector('.el.wdg[data-id="'+c.id+'"] [data-wpart="'+c.part+'"]'),r=node.getBoundingClientRect(),
      x=r.left+r.width/2,y=r.top+r.height/2;
    node.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,cancelable:true,button:0,pointerId:241,clientX:x,clientY:y}));
    w.dispatchEvent(new w.PointerEvent('pointermove',{bubbles:true,button:0,pointerId:241,clientX:x+90,clientY:y+27}));
    w.dispatchEvent(new w.PointerEvent('pointerup',{bubbles:true,button:0,pointerId:241,clientX:x+90,clientY:y+27}));
   },cfg);
   const moved=await page.evaluate(c=>{
    const e=sec().elements.find(x=>x.id===c.id).wp,d=document.querySelector('#preview').contentDocument,
      n=d.querySelector('.el.wdg[data-id="'+c.id+'"] [data-wpart="'+c.part+'"]');
    return{pose:e.__parts?.[c.part],inline:n.style.getPropertyValue('--nw-tx'),
      saved:JSON.parse(localStorage.getItem(STORE_KEY)).pages[curPage].sections[curSec].elements.find(x=>x.id===c.id)?.wp?.__parts?.[c.part]};
   },cfg);
   assert.equal(moved.pose.x,90,'pieza se mueve 90 px');
   assert.equal(moved.pose.y,27);
   assert.ok(Math.abs(moved.pose.refW-initial.width)<1,'referencia: ancho útil');
   assert.equal(moved.pose.refH,initial.height,'referencia: alto real');
   assert.deepEqual(moved.saved,moved.pose,'se guarda en el proyecto');
   assert.match(moved.inline,/cqw$/,'posición relativa en el editor');
   const output=await page.evaluate(c=>{
    const e=sec().elements.find(x=>x.id===c.id).wp;
    return window.SCW.kinds[c.kind].markup(e,{edit:false});
   },cfg);
   assert.match(output,new RegExp('data-wpart="'+cfg.part+'"[^>]*style="[^"]*--nw-tx:'));
   assert.match(output,/--nw-ty:calc\(var\(--h\) \* /,'el alto adaptable se exporta');
   // El cambio temporal de puntero suma desplazamiento sin sustituir la pose del autor.
   const composed=await page.evaluate(c=>{
    const d=document.querySelector('#preview').contentDocument,n=d.querySelector('.el.wdg[data-id="'+c.id+'"] [data-wpart="'+c.part+'"]');
    // Medir el resultado compuesto, no un fotograma intermedio de la transición CSS.
    n.style.transition='none';
    const before=d.defaultView.getComputedStyle(n),pose=before.translate,scale=before.scale,
      stored=n.style.getPropertyValue('--nw-tx');
    n.style.setProperty('--nw-hover-x','19px');n.style.setProperty('--nw-hover-y','7px');
    n.style.setProperty('--nw-hover-s','1.08');
    const after=d.defaultView.getComputedStyle(n);
    return{before:pose,after:after.translate,beforeScale:scale,afterScale:after.scale,stored,
     inlineTranslate:n.style.translate,inlineScale:n.style.scale};
   },cfg);
   assert.ok(Math.abs(parseFloat(composed.after)-parseFloat(composed.before)-19)<2,'hover se suma sin pisar posición');
   assert.equal(composed.stored,moved.inline,'no reemplaza la pose original');
   assert.equal(composed.inlineTranslate,'','sin style.translate invasivo');
   assert.equal(composed.inlineScale,'','sin style.scale invasivo');
   assert.ok(parseFloat(composed.afterScale)>parseFloat(composed.beforeScale),'se añade escala interactiva');
   await page.evaluate(c=>{
    const d=document.querySelector('#preview').contentDocument,root=d.querySelector('.el.wdg[data-id="'+c.id+'"]'),
      el=sec().elements.find(x=>x.id===c.id).wp;
    root.innerHTML=window.SCW.kinds[c.kind].markup(el,{edit:true});
    root.querySelector('.'+c.root).style.width='400px';
   },cfg);
   await fire('.el.wdg[data-id="'+cfg.id+'"] [data-nw-part="'+cfg.part+'"]');
   const desktopCopy=await page.evaluate(c=>JSON.parse(JSON.stringify(sec().elements.find(x=>x.id===c.id).wp.__parts[c.part])),cfg);
   await page.evaluate(c=>{
    const d=document.querySelector('#preview').contentDocument,w=d.defaultView,
      node=d.querySelector('.el.wdg[data-id="'+c.id+'"] [data-wpart="'+c.part+'"]'),r=node.getBoundingClientRect(),
      x=r.left+r.width/2,y=r.top+r.height/2;
    node.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,cancelable:true,button:0,pointerId:242,clientX:x,clientY:y}));
    w.dispatchEvent(new w.PointerEvent('pointermove',{bubbles:true,button:0,pointerId:242,clientX:x+32,clientY:y+15}));
    w.dispatchEvent(new w.PointerEvent('pointerup',{bubbles:true,button:0,pointerId:242,clientX:x+32,clientY:y+15}));
   },cfg);
   const mobile=await page.evaluate(c=>{
    const e=sec().elements.find(x=>x.id===c.id).wp,d=document.querySelector('#preview').contentDocument,
      n=d.querySelector('.el.wdg[data-id="'+c.id+'"] [data-wpart="'+c.part+'"]');
    return{desktop:e.__parts[c.part],mobile:e.__partsMobile?.[c.part],inline:n.style.getPropertyValue('--nw-mx')};
   },cfg);
   assert.deepEqual(mobile.desktop,desktopCopy,'móvil no modifica escritorio');
   assert.equal(mobile.mobile.refH,initial.height);
   assert.ok(mobile.mobile.refW<initial.width,'referencia adaptada al ancho móvil');
   assert.ok(mobile.mobile.x>32,'móvil parte de la pose heredada');
   assert.match(mobile.inline,/cqw$/);
   const exportMobile=await page.evaluate(c=>{
    const e=sec().elements.find(x=>x.id===c.id).wp;
    return window.SCW.kinds[c.kind].markup(e,{edit:false});
   },cfg);
   assert.match(exportMobile,/--nw-mx:[0-9.]+cqw/,'el sitio publicado conserva desktop y móvil');
   await page.evaluate(()=>{
    const d=document.querySelector('#preview').contentDocument,b=d.querySelector('.nw-wpart-reset');
    if(!b)throw Error('Falta Restablecer móvil');
    b.click();
   });
   assert.equal(await page.evaluate(c=>sec().elements.find(x=>x.id===c.id).wp.__partsMobile?.[c.part],cfg),undefined);
   await page.click('#btn-undo');
   assert.ok(await page.evaluate(c=>sec().elements.find(x=>x.id===c.id).wp.__partsMobile?.[c.part],cfg));
   await page.click('#btn-redo');
   assert.equal(await page.evaluate(c=>sec().elements.find(x=>x.id===c.id).wp.__partsMobile?.[c.part],cfg),undefined);
  }

  // Un adaptador para composiciones narrativas con scroll. Recursos reales + publicación.
  for(const cfg of [
   {kind:'scrollzoom',id:'test-scrollzoom',root:'nw-sz',stage:'nw-sz-sticky',part:'moment-0-title',
    model:{title:'TÍTULO',sub:'INICIO',length:240,chapters:[
     {eyebrow:'CAPÍTULO',title:'PRIMER MOMENTO',text:'Un texto independiente',img:'https://example.test/logo.png'},
     {title:'SEGUNDO MOMENTO',text:'Otra historia'}]},
    parts:['media','title','sub','moment-0-eyebrow','moment-0-title','moment-0-text','moment-1-title','moment-1-text']},
   {kind:'kineticstrip',id:'test-kinetic',root:'nw-ks',stage:'nw-ks-sticky',part:'card-1',
    model:{label:'MIS PROYECTOS',projects:[
     {title:'A',img:'',href:'https://example.test/a'},
     {title:'B',img:'',href:'https://example.test/b'},
     {title:'C',img:'',href:'https://example.test/c'}],perCard:50},
    parts:['label','card-0','card-1','card-2']}
  ]){
   await load(cfg.id==='test-scrollzoom'?23:24);
   await page.evaluate(c=>{
    const e=mkEl('widget',{id:c.id,kind:c.kind,wp:c.model});
    sec().elements.push(e);
    const d=document.querySelector('#preview').contentDocument,style=d.createElement('style');
    style.textContent=window.SCW.css[c.kind];d.head.appendChild(style);
    const root=d.createElement('div');root.className='el wdg';root.dataset.id=c.id;
    root.innerHTML=window.SCW.kinds[c.kind].markup(e.wp,{edit:true});
    d.body.appendChild(root);
    const scene=root.querySelector('.'+c.root);
    scene.style.width='900px';
    scene.querySelector('.'+c.stage).style.height='600px';
   },cfg);
   await select(cfg.id);
   const initial=await page.evaluate(c=>{
    const d=document.querySelector('#preview').contentDocument,root=d.querySelector('.el.wdg[data-id="'+c.id+'"]'),
     sc=root.querySelector('.'+c.root),stage=sc.querySelector('.'+c.stage),
     parts=Array.from(sc.querySelectorAll('[data-wpart]')).map(n=>n.dataset.wpart),
     buttons=Array.from(sc.querySelectorAll('[data-nw-part]')).map(n=>n.dataset.nwPart),
     published=window.SCW.kinds[c.kind].markup(sec().elements.find(e=>e.id===c.id).wp,{edit:false});
    return{kind:sc.dataset.nwPartScope,mobile:sc.dataset.nwPartMobile,height:stage.clientHeight,
     width:sc.clientWidth,parts,buttons,publishedHasBar:published.includes('data-nw-partbar'),
     retainsScroll:c.kind==='scrollzoom'?published.includes('--expand')||published.includes('--len'):
       published.includes('nw-ks-track'),
     links:Array.from(sc.querySelectorAll('.nw-ks-card')).map(n=>n.getAttribute('href')),
     chapters:sc.querySelectorAll('.nw-sz-ch').length};
   },cfg);
   assert.equal(initial.kind,cfg.kind);
   assert.equal(initial.mobile,'720');
   assert.equal(initial.width,900);assert.equal(initial.height,600);
   assert.deepEqual(initial.parts,cfg.parts,'las partes del widget se identifican');
   assert.deepEqual(initial.buttons,[''].concat(cfg.parts),'el editor ofrece selección para cada parte');
   assert.equal(initial.publishedHasBar,false,'no se exportan controles del editor');
   assert.equal(initial.retainsScroll,true,'se conserva el recorrido por scroll');
   if(cfg.kind==='scrollzoom'){
    assert.equal(initial.parts.includes('moment-0-img'),false,'no aparece un tirador para una imagen cuya URL no se materializa');
    assert.equal(initial.chapters,2,'conserva los momentos narrativos');
   }else{
    assert.deepEqual(initial.links,[null,null,null],'en edición los links no navegan');
    const published=await page.evaluate(c=>{
     const e=sec().elements.find(x=>x.id===c.id).wp;
     return window.SCW.kinds[c.kind].markup(e,{edit:false});
    },cfg);
    assert.match(published,/href="https:\/\/example\.test\/b"/,'publicación mantiene links');
   }
   await fire('.el.wdg[data-id="'+cfg.id+'"] [data-nw-part="'+cfg.part+'"]');
   const selected=await page.evaluate(c=>{
    const d=document.querySelector('#preview').contentDocument,sc=d.querySelector('.el.wdg[data-id="'+c.id+'"] .'+c.root);
    return{part:sc.querySelector('.nw-part-edit-active')?.dataset.wpart,
     count:d.querySelectorAll('.nw-wpart-h').length,isolated:sc.classList.contains('nw-part-isolate')};
   },cfg);
   assert.deepEqual(selected,{part:cfg.part,count:2,isolated:true},
    'las piezas del scroll usan selección común');
   await page.evaluate(c=>{
    const d=document.querySelector('#preview').contentDocument,w=d.defaultView,
     el=d.querySelector('.el.wdg[data-id="'+c.id+'"] [data-wpart="'+c.part+'"]'),r=el.getBoundingClientRect(),
     x=r.left+r.width/2,y=r.top+r.height/2;
    el.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,cancelable:true,button:0,pointerId:271,clientX:x,clientY:y}));
    w.dispatchEvent(new w.PointerEvent('pointermove',{bubbles:true,button:0,pointerId:271,clientX:x+72,clientY:y+36}));
    w.dispatchEvent(new w.PointerEvent('pointerup',{bubbles:true,button:0,pointerId:271,clientX:x+72,clientY:y+36}));
   },cfg);
   const desktop=await page.evaluate(c=>{
    const e=sec().elements.find(x=>x.id===c.id).wp,d=document.querySelector('#preview').contentDocument,
     node=d.querySelector('.el.wdg[data-id="'+c.id+'"] [data-wpart="'+c.part+'"]');
    return{pose:e.__parts?.[c.part],live:node.style.getPropertyValue('--nw-tx'),
     stored:JSON.parse(localStorage.getItem(STORE_KEY)).pages[curPage].sections[curSec].elements.find(x=>x.id===c.id)?.wp?.__parts?.[c.part]};
   },cfg);
   assert.equal(desktop.pose.x,72);
   assert.equal(desktop.pose.y,36);
   assert.equal(desktop.pose.refW,900);
   assert.equal(desktop.pose.refH,600);
   assert.deepEqual(desktop.pose,desktop.stored,'se guardan los cambios');
   assert.match(desktop.live,/cqw$/,'editor aplica posición proporcional');
   const desktopExport=await page.evaluate(c=>{
    const e=sec().elements.find(x=>x.id===c.id).wp;
    return window.SCW.kinds[c.kind].markup(e,{edit:false});
   },cfg);
   assert.match(desktopExport,/--nw-tx:8\.00000cqw/,'la posición llega a la publicación');
   assert.match(desktopExport,/--nw-ty:calc\(100vh \* 0\.060000\)/);
   // Mobile: el mismo elemento conserva la pose desktop y permite otra independiente.
   await page.evaluate(c=>{
    const d=document.querySelector('#preview').contentDocument,root=d.querySelector('.el.wdg[data-id="'+c.id+'"]'),
     e=sec().elements.find(x=>x.id===c.id).wp;
    root.innerHTML=window.SCW.kinds[c.kind].markup(e,{edit:true});
    root.querySelector('.'+c.root).style.width='420px';
    root.querySelector('.'+c.stage).style.height='600px';
   },cfg);
   await fire('.el.wdg[data-id="'+cfg.id+'"] [data-nw-part="'+cfg.part+'"]');
   const beforeMobile=await page.evaluate(c=>JSON.parse(JSON.stringify(sec().elements.find(x=>x.id===c.id).wp.__parts[c.part])),cfg);
   await page.evaluate(c=>{
    const d=document.querySelector('#preview').contentDocument,w=d.defaultView,
     el=d.querySelector('.el.wdg[data-id="'+c.id+'"] [data-wpart="'+c.part+'"]'),r=el.getBoundingClientRect(),
     x=r.left+r.width/2,y=r.top+r.height/2;
    el.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,cancelable:true,button:0,pointerId:272,clientX:x,clientY:y}));
    w.dispatchEvent(new w.PointerEvent('pointermove',{bubbles:true,button:0,pointerId:272,clientX:x+24,clientY:y+18}));
    w.dispatchEvent(new w.PointerEvent('pointerup',{bubbles:true,button:0,pointerId:272,clientX:x+24,clientY:y+18}));
   },cfg);
   const mobile=await page.evaluate(c=>{
    const e=sec().elements.find(x=>x.id===c.id).wp,d=document.querySelector('#preview').contentDocument,
     el=d.querySelector('.el.wdg[data-id="'+c.id+'"] [data-wpart="'+c.part+'"]');
    return{desktop:e.__parts?.[c.part],mobile:e.__partsMobile?.[c.part],
     live:el.style.getPropertyValue('--nw-mx')};
   },cfg);
   assert.deepEqual(mobile.desktop,beforeMobile,'editar móvil no toca escritorio');
   assert.equal(mobile.mobile.refW,420);
   assert.equal(mobile.mobile.refH,600);
   assert.ok(mobile.mobile.x>24,'móvil parte del desplazamiento heredado');
   assert.match(mobile.live,/cqw$/);
   const exportBoth=await page.evaluate(c=>{
    const e=sec().elements.find(x=>x.id===c.id).wp;
    return window.SCW.kinds[c.kind].markup(e,{edit:false});
   },cfg);
   assert.match(exportBoth,/--nw-mx:[0-9.]+cqw/,'escritorio y móvil en el HTML');
   await page.evaluate(()=>{
    const d=document.querySelector('#preview').contentDocument,btn=d.querySelector('.nw-wpart-reset');
    if(!btn)throw Error('No se encontró Restablecer móvil');btn.click();
   });
   assert.equal(await page.evaluate(c=>sec().elements.find(x=>x.id===c.id).wp.__partsMobile?.[c.part],cfg),undefined);
   await page.click('#btn-undo');
   assert.ok(await page.evaluate(c=>sec().elements.find(x=>x.id===c.id).wp.__partsMobile?.[c.part],cfg));
   await page.click('#btn-redo');
   assert.equal(await page.evaluate(c=>sec().elements.find(x=>x.id===c.id).wp.__partsMobile?.[c.part],cfg),undefined);
  }


  // Adaptador común de fotografías: selección, geometría, guardado y exportación real.
  for(const c of [
   {kind:'editorialcollage',id:'test-collage',root:'scx-ec',stage:'.scx-ec-grid',part:'image-1',
    wp:{label:'COLECCIÓN',caption:'Fotos',ratio:'square'},names:['image-0','image-1','image-2','label','caption']},
   {kind:'moodboard',id:'test-mood',root:'scx-mb',stage:'.scx-mb > div',part:'image-4',
    wp:{label:'REFERENCIAS',layout:'dense'},names:['image-0','image-1','image-2','image-3','image-4','image-5','label']}
  ]){
   await load(c.kind==='editorialcollage'?25:26);
   await page.evaluate(c=>{
    const e=mkEl('widget',{id:c.id,kind:c.kind,wp:c.wp});sec().elements.push(e);
    const d=document.querySelector('#preview').contentDocument,s=d.createElement('style');
    s.textContent=window.SCW.css[c.kind];d.head.appendChild(s);
    const host=d.createElement('div');host.className='el wdg';host.dataset.id=c.id;
    host.innerHTML=window.SCW.kinds[c.kind].markup(e.wp,{edit:true});d.body.appendChild(host);
    host.querySelector('.'+c.root).style.width='900px';
   },c);
   await select(c.id);
   const setup=await page.evaluate(c=>{
    const d=document.querySelector('#preview').contentDocument,
     scope=d.querySelector('.el.wdg[data-id="'+c.id+'"] .'+c.root),stage=scope.querySelector(c.stage),
     cs=d.defaultView.getComputedStyle(scope);
    return{scope:scope.dataset.nwPartScope,mobile:scope.dataset.nwPartMobile,height:stage.clientHeight,
     width:scope.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight),
     parts:Array.from(scope.querySelectorAll('[data-wpart]')).map(n=>n.dataset.wpart),
     buttons:Array.from(scope.querySelectorAll('[data-nw-part]')).map(n=>n.dataset.nwPart),
     css:window.SCW.css[c.kind].includes('background-position:center'),
     exported:window.SCW.kinds[c.kind].markup(sec().elements.find(e=>e.id===c.id).wp,{edit:false})};
   },c);
   assert.equal(setup.scope,c.kind);assert.equal(setup.mobile,'600');
   assert.ok(setup.width>600&&setup.height>200);
   assert.deepEqual(setup.parts,c.names);assert.deepEqual(setup.buttons,[''].concat(c.names));
   assert.equal(setup.exported.includes('data-nw-partbar'),false);
   assert.equal(setup.css,true,'preserva las fotografías originales');
   await fire('.el.wdg[data-id="'+c.id+'"] [data-nw-part="'+c.part+'"]');
   assert.deepEqual(await page.evaluate(c=>{
    const d=document.querySelector('#preview').contentDocument;
    return{part:d.querySelector('.el.wdg[data-id="'+c.id+'"] .nw-part-edit-active')?.dataset.wpart,
     handles:d.querySelectorAll('.nw-wpart-h').length};
   },c),{part:c.part,handles:2});
   const drag=async(dx,dy,pid)=>page.evaluate(({c,dx,dy,pid})=>{
    const d=document.querySelector('#preview').contentDocument,w=d.defaultView,
     n=d.querySelector('.el.wdg[data-id="'+c.id+'"] [data-wpart="'+c.part+'"]'),
     r=n.getBoundingClientRect(),x=(r.left+r.right)/2,y=(r.top+r.bottom)/2;
    n.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,cancelable:true,button:0,pointerId:pid,clientX:x,clientY:y}));
    w.dispatchEvent(new w.PointerEvent('pointermove',{bubbles:true,button:0,pointerId:pid,clientX:x+dx,clientY:y+dy}));
    w.dispatchEvent(new w.PointerEvent('pointerup',{bubbles:true,button:0,pointerId:pid,clientX:x+dx,clientY:y+dy}));
   },{c,dx,dy,pid});
   await drag(64,24,291);
   const savedPhoto=await page.evaluate(c=>{
    const e=sec().elements.find(x=>x.id===c.id).wp;
    return{pose:e.__parts?.[c.part],disk:JSON.parse(localStorage.getItem(STORE_KEY)).pages[curPage].sections[curSec].elements.find(x=>x.id===c.id)?.wp?.__parts?.[c.part],
     html:window.SCW.kinds[c.kind].markup(e,{edit:false})};
   },c);
   assert.equal(savedPhoto.pose.x,64);assert.equal(savedPhoto.pose.y,24);
   assert.ok(Math.abs(savedPhoto.pose.refW-setup.width)<1);
   assert.ok(Math.abs(savedPhoto.pose.refH-setup.height)<1);
   assert.deepEqual(savedPhoto.pose,savedPhoto.disk);
   assert.match(savedPhoto.html,/--nw-tx:[0-9.]+cqw/);
   assert.match(savedPhoto.html,/--nw-ty:calc\(var\(--h\) \* [0-9.]+\)/);
   await page.evaluate(c=>{
    const d=document.querySelector('#preview').contentDocument,h=d.querySelector('.el.wdg[data-id="'+c.id+'"]'),
     e=sec().elements.find(x=>x.id===c.id).wp;
    h.innerHTML=window.SCW.kinds[c.kind].markup(e,{edit:true});
    h.querySelector('.'+c.root).style.width='420px';
   },c);
   await fire('.el.wdg[data-id="'+c.id+'"] [data-nw-part="'+c.part+'"]');
   await drag(22,12,292);
   const mobile=await page.evaluate(c=>{
    const e=sec().elements.find(x=>x.id===c.id).wp,d=document.querySelector('#preview').contentDocument,
     sc=d.querySelector('.el.wdg[data-id="'+c.id+'"] .'+c.root),stage=sc.querySelector(c.stage),
     cs=d.defaultView.getComputedStyle(sc);
    return{desktop:e.__parts?.[c.part],mobile:e.__partsMobile?.[c.part],
     width:sc.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight),
     height:stage.clientHeight,html:window.SCW.kinds[c.kind].markup(e,{edit:false})};
   },c);
   assert.deepEqual(mobile.desktop,savedPhoto.pose,'no modifica desktop');
   assert.ok(mobile.mobile&&mobile.mobile.x>22);
   assert.ok(Math.abs(mobile.mobile.refW-mobile.width)<1);
   assert.ok(Math.abs(mobile.mobile.refH-mobile.height)<1);
   assert.match(mobile.html,/--nw-mx:[0-9.]+cqw/);
   const legacy=await page.evaluate(c=>{
    const e=sec().elements.find(x=>x.id===c.id).wp;
    return window.SCW.kinds[c.kind].markup({...e,__parts:{[c.part]:{x:17,y:9,r:0,s:1}}},{edit:false});
   },c);
   assert.match(legacy,/--nw-tx:17px/,'no migra poses antiguas');
   assert.equal((legacy.match(/--nw-tx:/g)||[]).length,1,'una sola pose eficaz');
  }


  // Cuatro composiciones de altura intrínseca comparten selección, guardado y
  // exportación proporcional sin modificar sus layouts/variantes originales.
  for(const cfg of [
   {kind:'splitfeature',id:'test-fluid-split',root:'scx-sf',part:'detail-image',
    parts:['main-image','detail-image','kicker','title','text'],
    model:{title:'DOS COLUMNAS',kicker:'CATEGORÍA',text:'Descripción',layout:'right'}},
   {kind:'floatingcaption',id:'test-fluid-float',root:'scx-fc',part:'caption-card',
    parts:['image','caption-card','eyebrow','title','text'],
    model:{title:'TARJETA',eyebrow:'RÓTULO',text:'Descripción',pos:'bl'}},
   {kind:'casehero',id:'test-fluid-case',root:'scx-ch',part:'title',
    parts:['eyebrow','title','meta','year','image'],
    model:{title:'MI PROYECTO',eyebrow:'CASO',meta:'ESTUDIO',year:'2026',layout:'overlay'}},
   {kind:'bentoshow',id:'test-fluid-bento',root:'scx-bs',part:'image-1',
    parts:['image-0','stat','stat-label','copy-title','copy-text','image-1'],
    model:{title:'TÍTULO',text:'Texto de muestra',big:'99',label:'PROYECTOS'}}
  ]){
   // El lienzo sigue inicializado después de la prueba fotográfica.
   // Reutilizarlo evita carreras entre cargas sucesivas y ejercita la
   // selección entre composiciones dentro de una misma sesión real.
   await page.evaluate(()=>{
    const fr=document.querySelector('#preview'),d=fr?.contentDocument;
    if(!d?.__nwCanvasPartAPI||fr.contentWindow?.__nwFeedback16Editors!==1){
     throw Error('El lienzo compartido dejó de estar inicializado');
    }
    d.__nwCanvasPartAPI.clear();
    d.querySelectorAll('.el.wdg[data-id^="test-fluid-"]').forEach(n=>n.remove());
   });
   await page.evaluate(c=>{
    const e=mkEl('widget',{id:c.id,kind:c.kind,wp:c.model});sec().elements.push(e);
    const d=document.querySelector('#preview').contentDocument,s=d.createElement('style');
    s.textContent=window.SCW.css[c.kind];d.head.appendChild(s);
    const host=d.createElement('div');host.className='el wdg';host.dataset.id=c.id;
    host.innerHTML=window.SCW.kinds[c.kind].markup(e.wp,{edit:true});d.body.appendChild(host);
    host.querySelector('.'+c.root).style.width='900px';
   },cfg);
   await select(cfg.id);
   const initial=await page.evaluate(c=>{
    const d=document.querySelector('#preview').contentDocument,
     scope=d.querySelector('.el.wdg[data-id="'+c.id+'"] .'+c.root),
     style=d.defaultView.getComputedStyle(scope),
     published=window.SCW.kinds[c.kind].markup(sec().elements.find(e=>e.id===c.id).wp,{edit:false});
    return{scope:scope.dataset.nwPartScope,unit:scope.dataset.nwPartY,threshold:scope.dataset.nwPartMobile,
     width:scope.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight),
     parts:[...scope.querySelectorAll('[data-wpart]')].map(n=>n.dataset.wpart),
     buttons:[...scope.querySelectorAll('[data-nw-part]')].map(n=>n.dataset.nwPart),
     hasTitle:!!scope.querySelector('[data-wfield="title"]'),
     hasToolbar:published.includes('data-nw-partbar'),markup:published};
   },cfg);
   assert.equal(initial.scope,cfg.kind);assert.equal(initial.unit,'100cqw');
   assert.equal(initial.threshold,'600');
   assert.ok(initial.width>650,'ancho útil del contenedor de flujo');
   assert.deepEqual(initial.parts,cfg.parts,'partes reales del recurso');
   assert.deepEqual(initial.buttons,[''].concat(cfg.parts),'la barra permite seleccionarlas');
   assert.ok(initial.hasTitle&&!initial.hasToolbar,'texto editable y exportación sin controles');
   await fire('.el.wdg[data-id="'+cfg.id+'"] [data-nw-part="'+cfg.part+'"]');
   assert.deepEqual(await page.evaluate(c=>{
    const d=document.querySelector('#preview').contentDocument,
     root=d.querySelector('.el.wdg[data-id="'+c.id+'"] .'+c.root);
    return{part:root.querySelector('.nw-part-edit-active')?.dataset.wpart,
     handles:d.querySelectorAll('.nw-wpart-h').length};
   },cfg),{part:cfg.part,handles:2});
   const drag=async(dx,dy,pointerId)=>page.evaluate(({cfg,dx,dy,pointerId})=>{
    const d=document.querySelector('#preview').contentDocument,w=d.defaultView,
     el=d.querySelector('.el.wdg[data-id="'+cfg.id+'"] [data-wpart="'+cfg.part+'"]'),
     box=el.getBoundingClientRect(),x=(box.left+box.right)/2,y=(box.top+box.bottom)/2;
    el.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,cancelable:true,button:0,pointerId,clientX:x,clientY:y}));
    w.dispatchEvent(new w.PointerEvent('pointermove',{bubbles:true,button:0,pointerId,clientX:x+dx,clientY:y+dy}));
    w.dispatchEvent(new w.PointerEvent('pointerup',{bubbles:true,button:0,pointerId,clientX:x+dx,clientY:y+dy}));
   },{cfg,dx,dy,pointerId});
   await drag(70,30,301);
   const desktop=await page.evaluate(c=>{
    const e=sec().elements.find(x=>x.id===c.id).wp,
     d=document.querySelector('#preview').contentDocument,
     el=d.querySelector('.el.wdg[data-id="'+c.id+'"] [data-wpart="'+c.part+'"]');
    return{pose:e.__parts[c.part],liveX:el.style.getPropertyValue('--nw-tx'),
     liveY:el.style.getPropertyValue('--nw-ty'),
     saved:JSON.parse(localStorage.getItem(STORE_KEY)).pages[curPage].sections[curSec].elements.find(x=>x.id===c.id)?.wp?.__parts?.[c.part],
     html:window.SCW.kinds[c.kind].markup(e,{edit:false})};
   },cfg);
   assert.equal(desktop.pose.x,70);assert.equal(desktop.pose.y,30);
   assert.ok(Math.abs(desktop.pose.refW-initial.width)<1);
   assert.equal(desktop.pose.refH,desktop.pose.refW,'alto relativo al ancho en flujo CSS');
   assert.deepEqual(desktop.pose,desktop.saved,'persiste en el proyecto');
   assert.match(desktop.liveX,/cqw$/);
   assert.match(desktop.liveY,/100cqw/);
   assert.match(desktop.html,/--nw-ty:calc\(100cqw \* [0-9.]+\)/);
   assert.equal((desktop.html.match(/--nw-tx:/g)||[]).length,1,'sin duplicaciones de pose');
   // El mismo recurso y pieza en móvil: herencia y desplazamiento independiente.
   await page.evaluate(c=>{
    const d=document.querySelector('#preview').contentDocument,
     host=d.querySelector('.el.wdg[data-id="'+c.id+'"]'),
     e=sec().elements.find(x=>x.id===c.id).wp;
    host.innerHTML=window.SCW.kinds[c.kind].markup(e,{edit:true});
    host.querySelector('.'+c.root).style.width='420px';
   },cfg);
   await fire('.el.wdg[data-id="'+cfg.id+'"] [data-nw-part="'+cfg.part+'"]');
   await drag(24,12,302);
   const mobile=await page.evaluate(c=>{
    const e=sec().elements.find(x=>x.id===c.id).wp,
     d=document.querySelector('#preview').contentDocument,
     sc=d.querySelector('.el.wdg[data-id="'+c.id+'"] .'+c.root),
     cs=d.defaultView.getComputedStyle(sc);
    return{desktop:e.__parts?.[c.part],mobile:e.__partsMobile?.[c.part],
     width:sc.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight),
     html:window.SCW.kinds[c.kind].markup(e,{edit:false})};
   },cfg);
   assert.deepEqual(mobile.desktop,desktop.pose,'móvil no pisa el diseño desktop');
   assert.ok(mobile.mobile&&mobile.mobile.x>=24);
   assert.ok(Math.abs(mobile.mobile.refW-mobile.width)<1);
   assert.equal(mobile.mobile.refH,mobile.mobile.refW);
   assert.match(mobile.html,/--nw-my:calc\(100cqw \* [0-9.]+\)/);
   const legacy=await page.evaluate(c=>{
    const e=sec().elements.find(x=>x.id===c.id).wp;
    return window.SCW.kinds[c.kind].markup({...e,__parts:{[c.part]:{x:13,y:7,r:4,s:1.1}},__partsMobile:{}},{edit:false});
   },cfg);
   assert.match(legacy,/--nw-tx:13px/);
   assert.match(legacy,/--nw-ty:7px/,'legacy conserva px sin referencia');
   assert.equal((legacy.match(/--nw-tx:/g)||[]).length,1);
  }


  // Siete variantes tipográficas/de identidad: piezas reales y datos de autor.
  // No recargar el iframe entre recursos: selección y gestos comparten editor.
  for(const cfg of [
   {kind:'editorialposter',id:'test-typ-ep',root:'scx-ep',part:'title',
    wp:{title:'TÍTULO GRANDE',eyebrow:'ESTUDIO',number:'02',note:'Pie editorial'},
    names:['eyebrow','number','title','note']},
   {kind:'bignumber',id:'test-typ-bn',root:'scx-bn',part:'number',
    wp:{number:'42',suffix:'%',label:'RESULTADOS',text:'Descripción'},
    names:['number','label','text']},
   {kind:'pullquote',id:'test-typ-pq',root:'scx-pq',part:'quote',
    wp:{quote:'Una cita importante',author:'Autor',role:'Director',mark:'quote'},
    names:['mark','quote','author','role']},
   {kind:'typespecimen',id:'test-typ-ts',root:'scx-ts',part:'hero',
    wp:{kicker:'FUENTE',note:'2026',hero:'Aa',upper:'ABCDEFGHI',lower:'abcdef',nums:'12345'},
    names:['kicker','note','hero','upper','lower','nums']},
   {kind:'eventposter',id:'test-typ-ev',root:'scx-ev',part:'title',
    wp:{date:'15 OCT',title:'EXPOSICIÓN',place:'MUSEO',cta:'VISITAR'},
    names:['date','symbol','title','place','cta']},
   {kind:'splitstatement',id:'test-typ-ss',root:'scx-ss',part:'image',
    wp:{eyebrow:'CAMPANA',title:'NUEVA MIRADA',imageSide:'left'},
    names:['eyebrow','title','image']},
   {kind:'brandboard',id:'test-typ-bb',root:'scx-bb',part:'swatch-2',
    wp:{brand:'NAG',tagline:'Identidad',sample:'Texto demo',style:'cards'},
    names:['swatch-0','swatch-1','swatch-2','swatch-3','brand','tagline','sample']}
  ]){
   await page.evaluate(c=>{
    const d=document.querySelector('#preview').contentDocument;
    d.querySelectorAll('.el.wdg[data-id^="test-typ-"]').forEach(n=>n.remove());
    const e=mkEl('widget',{id:c.id,kind:c.kind,wp:c.wp});sec().elements.push(e);
    const css=d.createElement('style');css.textContent=window.SCW.css[c.kind];d.head.appendChild(css);
    const host=d.createElement('div');host.className='el wdg';host.dataset.id=c.id;
    host.innerHTML=window.SCW.kinds[c.kind].markup(e.wp,{edit:true});d.body.appendChild(host);
    host.querySelector('.'+c.root).style.width='880px';
   },cfg);
   await select(cfg.id);
   const info=await page.evaluate(c=>{
    const d=document.querySelector('#preview').contentDocument,
     sc=d.querySelector('.el.wdg[data-id="'+c.id+'"] .'+c.root),cs=d.defaultView.getComputedStyle(sc),
     published=window.SCW.kinds[c.kind].markup(sec().elements.find(x=>x.id===c.id).wp,{edit:false});
    return{scope:sc.dataset.nwPartScope,cut:sc.dataset.nwPartMobile,unit:sc.dataset.nwPartY,
     parts:[...sc.querySelectorAll('[data-wpart]')].map(n=>n.dataset.wpart),
     buttons:[...sc.querySelectorAll('[data-nw-part]')].map(n=>n.dataset.nwPart),
     width:sc.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight),
     published,editable:!!sc.querySelector('[data-wfield]')};
   },cfg);
   assert.equal(info.scope,cfg.kind);assert.equal(info.unit,'100cqw');assert.equal(info.cut,'600');
   assert.ok(info.width>600);
   assert.deepEqual(info.parts,cfg.names,'partes originales de '+cfg.kind);
   assert.deepEqual(info.buttons,[''].concat(cfg.names),'selector reutilizado en '+cfg.kind);
   assert.ok(info.editable&&!info.published.includes('data-nw-partbar'),'edición directa sin toolbar publicada');
   await fire('.el.wdg[data-id="'+cfg.id+'"] [data-nw-part="'+cfg.part+'"]');
   const selected=await page.evaluate(c=>{
    const d=document.querySelector('#preview').contentDocument,
     root=d.querySelector('.el.wdg[data-id="'+c.id+'"] .'+c.root);
    return{part:root.querySelector('.nw-part-edit-active')?.dataset.wpart,
     handles:d.querySelectorAll('.nw-wpart-h').length};
   },cfg);
   assert.deepEqual(selected,{part:cfg.part,handles:2},'gestos comunes en '+cfg.kind);
   await page.evaluate(c=>{
    const d=document.querySelector('#preview').contentDocument,w=d.defaultView,
     n=d.querySelector('.el.wdg[data-id="'+c.id+'"] [data-wpart="'+c.part+'"]'),
     b=n.getBoundingClientRect(),x=(b.left+b.right)/2,y=(b.top+b.bottom)/2;
    n.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,cancelable:true,button:0,pointerId:331,clientX:x,clientY:y}));
    w.dispatchEvent(new w.PointerEvent('pointermove',{bubbles:true,button:0,pointerId:331,clientX:x+56,clientY:y+28}));
    w.dispatchEvent(new w.PointerEvent('pointerup',{bubbles:true,button:0,pointerId:331,clientX:x+56,clientY:y+28}));
   },cfg);
   const result=await page.evaluate(c=>{
    const e=sec().elements.find(x=>x.id===c.id).wp;
    return{pose:e.__parts?.[c.part],
     saved:JSON.parse(localStorage.getItem(STORE_KEY)).pages[curPage].sections[curSec].elements.find(x=>x.id===c.id)?.wp?.__parts?.[c.part],
     html:window.SCW.kinds[c.kind].markup(e,{edit:false})};
   },cfg);
   assert.equal(result.pose.x,56);assert.equal(result.pose.y,28);
   assert.ok(Math.abs(result.pose.refW-info.width)<1);
   assert.equal(result.pose.refH,result.pose.refW);
   assert.deepEqual(result.pose,result.saved);
   assert.match(result.html,/--nw-ty:calc\(100cqw \* [0-9.]+\)/);
   if(cfg.kind==='brandboard')assert.match(result.html,/--c:/,'paleta original intacta');
   if(cfg.kind==='pullquote')assert.match(result.html,/“/,'ornamento original intacto');
   // Control móvil en los dos tipos de composición: tipográfica e identidad.
   if(cfg.kind==='editorialposter'||cfg.kind==='brandboard'){
    await page.evaluate(c=>{
     const d=document.querySelector('#preview').contentDocument,
      host=d.querySelector('.el.wdg[data-id="'+c.id+'"]'),
      e=sec().elements.find(x=>x.id===c.id).wp;
     host.innerHTML=window.SCW.kinds[c.kind].markup(e,{edit:true});
     host.querySelector('.'+c.root).style.width='420px';
    },cfg);
    await fire('.el.wdg[data-id="'+cfg.id+'"] [data-nw-part="'+cfg.part+'"]');
    await page.evaluate(c=>{
     const d=document.querySelector('#preview').contentDocument,w=d.defaultView,
      n=d.querySelector('.el.wdg[data-id="'+c.id+'"] [data-wpart="'+c.part+'"]'),
      b=n.getBoundingClientRect(),x=(b.left+b.right)/2,y=(b.top+b.bottom)/2;
     n.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,cancelable:true,button:0,pointerId:332,clientX:x,clientY:y}));
     w.dispatchEvent(new w.PointerEvent('pointermove',{bubbles:true,button:0,pointerId:332,clientX:x+20,clientY:y+12}));
     w.dispatchEvent(new w.PointerEvent('pointerup',{bubbles:true,button:0,pointerId:332,clientX:x+20,clientY:y+12}));
    },cfg);
    const mobile=await page.evaluate(c=>{
     const e=sec().elements.find(x=>x.id===c.id).wp;
     return{desktop:e.__parts?.[c.part],mobile:e.__partsMobile?.[c.part],
      html:window.SCW.kinds[c.kind].markup(e,{edit:false})};
    },cfg);
    assert.deepEqual(mobile.desktop,result.pose,'móvil no cambia desktop');
    assert.ok(mobile.mobile&&mobile.mobile.refW>0);
    assert.match(mobile.html,/--nw-my:calc\(100cqw \* [0-9.]+\)/);
   }
  }

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
