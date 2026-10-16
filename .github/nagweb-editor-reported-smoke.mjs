import assert from 'node:assert/strict';

// Reproduce explicitly the user's manual failures #1, #2 and #7.
// Tests real pointer gestures in the preview iframe and quota failure.
export async function runReportedEditorSmoke(page){
 const original=await page.evaluate(()=>({
  project:JSON.stringify(project),curPage,curSec,curEl,curPane,selection:selection.slice(),secFocus,viewMobile,
  history:history.slice(),future:future.slice()
 }));
 try{
  await page.evaluate(()=>{
   const p=mkEl('image',{id:'qa-image-repeat',x:25,y:32,w:22});
   const t=mkEl('heading',{id:'qa-heading-scale',x:58,y:52,w:30,text:'Título para escalar'});
   project.pages=[{id:nid(),name:'QA manual',slug:'qa-manual',sections:[
    mkSection({id:'qa-free',name:'Prueba libre',layout:'free',height:160,elements:[p,t]})]}];
   curPage=0;curSec=0;curEl=0;selection=[];secFocus=true;viewMobile=false;
   saveProject();renderPages();renderPreview();
  });
  await page.waitForFunction(()=>{
   const d=document.querySelector('#preview')?.contentDocument;
   return !!(d&&d.querySelector('[data-id="qa-image-repeat"]')&&d.querySelector('[data-id="qa-heading-scale"]')&&d.querySelector('.sc'));
  },{timeout:20000});
  async function drag(id,dx,dy,shift,handle){
   return page.evaluate(({id,dx,dy,shift,handle})=>{
    const d=document.querySelector('#preview').contentDocument,w=d.defaultView;
    const n=d.querySelector('.el[data-id="'+id+'"]');
    if(!n)throw Error('No existe elemento '+id);
    if(handle&&!n.querySelector('[data-handle="size"]')){
     n.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,cancelable:true,button:0,pointerId:90,clientX:0,clientY:0}));
     w.dispatchEvent(new w.PointerEvent('pointerup',{bubbles:true,button:0,pointerId:90,clientX:0,clientY:0}));
    }
    const target=handle?n.querySelector('[data-handle="size"]'):n;
    if(!target)throw Error('Sin tirador de tamaño');
    const rect=target.getBoundingClientRect();
    const x=rect.left+rect.width/2,y=rect.top+rect.height/2;
    const before={x:+n.dataset.x,y:+n.dataset.y,w:+n.dataset.w,
      font:parseFloat(w.getComputedStyle(n).fontSize)};
    target.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,cancelable:true,button:0,
      pointerId:91,clientX:x,clientY:y,shiftKey:shift}));
    w.dispatchEvent(new w.PointerEvent('pointermove',{bubbles:true,button:0,pointerId:91,
      clientX:x+dx,clientY:y+dy,shiftKey:shift}));
    w.dispatchEvent(new w.PointerEvent('pointerup',{bubbles:true,button:0,pointerId:91,
      clientX:x+dx,clientY:y+dy,shiftKey:shift}));
    return{before,after:{x:+n.dataset.x,y:+n.dataset.y,w:+n.dataset.w,
      font:parseFloat(w.getComputedStyle(n).fontSize)}};
   },{id,dx,dy,shift,handle});
  }
  const first=await drag('qa-image-repeat',100,60,false,false);
  assert.ok(first.after.x>first.before.x && first.after.y>first.before.y,'A -> B realmente mueve la imagen');
  await page.waitForFunction(()=>project.pages[0].sections[0].elements[0].x>25);
  const second=await drag('qa-image-repeat',60,35,false,false);
  assert.equal(second.before.x,first.after.x,'segundo drag empieza en B');
  assert.ok(second.after.x>first.after.x,'B -> C avanza desde B sin saltar a A');
  await page.waitForFunction(()=>project.pages[0].sections[0].elements[0].x>35);

  const normal=await drag('qa-heading-scale',70,0,false,true);
  assert.ok(normal.after.w>normal.before.w,'tirador de caja cambia ancho');
  assert.ok(Math.abs(normal.after.font-normal.before.font)<.1,'sin Shift tamaño de letra inalterado');

  const proportional=await drag('qa-heading-scale',60,0,true,true);
  assert.ok(proportional.after.w>proportional.before.w,'Shift aumenta ancho de caja');
  assert.ok(proportional.after.font>proportional.before.font,'Shift aumenta letra proporcionalmente');
  await page.waitForFunction(()=>project.pages[0].sections[0].elements[1].customSize>0);

  const unsaved=await page.evaluate(()=>{
   const native=Storage.prototype.setItem;
   Storage.prototype.setItem=function(k,v){if(k===STORE_KEY)throw new DOMException('Quota exceeded','QuotaExceededError');return native.call(this,k,v);};
   let ok;
   try{ok=saveProject();}finally{Storage.prototype.setItem=native;}
   const warning=document.getElementById('nw-save-warning');
   const hadWarning=!!warning,button=warning?.querySelector('button')?.textContent;
   const repaired=saveProject(),stillVisible=!!document.getElementById('nw-save-warning');
   return{ok,hadWarning,button,repaired,stillVisible};
  });
  assert.equal(unsaved.ok,false,'cuota llena no puede indicar guardado correcto');
  assert.equal(unsaved.hadWarning,true,'aviso persistente al perder guardado');
  assert.match(unsaved.button,/Descargar respaldo/);
  assert.equal(unsaved.repaired,true);
  assert.equal(unsaved.stillVisible,false,'aviso desaparece tras guardar exitosamente');

  // Incidencias #3 y #4: todas las capas del Hero (texto/foto) se ordenan
  // desde inspector, y móvil puede tener otro orden y restablecerlo.
  const layers=await page.evaluate(()=>{
   const actor=mkEl('widget',{id:'qa-hero-layer-order',wk:'layeredhero',wp:{title:'NAGWEB',eyebrow:'PRUEBA',sub:'Capas',texts:[{text:'Otra línea',style:'body'}]}});
   sec().elements.push(actor);
   curEl=sec().elements.length-1;selection=[actor.id];secFocus=false;curPane='elements';
   renderPane();
   const pane=document.getElementById('pane'),box=pane.querySelector('[data-hero-layers]');
   if(!box)throw Error('No aparece Capas del Hero en inspector');
   const names=[...box.querySelectorAll('[data-hero-layer]')].map(n=>n.dataset.heroLayer);
   const move=(from,to)=>{
    const src=box.querySelector('[data-hero-layer="'+from+'"]'),
     dest=box.querySelector('[data-hero-layer="'+to+'"]'),transfer=new DataTransfer();
    src.dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer:transfer}));
    dest.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:transfer}));
   };
   move('layer-1','title');
   const desktop={image:actor.wp.__parts['layer-1']?.z,title:actor.wp.__parts.title?.z};
   const temp=document.createElement('template');
   temp.innerHTML=SCW.kinds.layeredhero.markup(actor.wp,{edit:false});
   const exportTextZ=temp.content.querySelector('[data-wpart="title"]')?.style.getPropertyValue('--nw-z');
   viewMobile=true;renderPane();
   const mob=document.querySelector('#pane [data-hero-layers]'),mobileNames=[...mob.children].map(n=>n.dataset.heroLayer);
   const src=mob.querySelector('[data-hero-layer="title"]'),dest=mob.querySelector('[data-hero-layer="layer-1"]'),transfer=new DataTransfer();
   src.dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer:transfer}));
   dest.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:transfer}));
   const mobile={image:actor.wp.__partsMobile['layer-1']?.z,title:actor.wp.__partsMobile.title?.z};
   document.querySelector('#pane [data-hero-reset-order]').click();
   const reset={image:actor.wp.__partsMobile['layer-1']?.z,title:actor.wp.__partsMobile.title?.z};
   return{names,desktop,exportTextZ,mobile,mobileNames,reset};
  });
  assert.ok(layers.names.includes('text-extra-0')&&layers.names.includes('eyebrow'),'lista incluye textos adicionales');
  assert.ok(layers.desktop.image>layers.desktop.title,'imagen puede quedar sobre texto en desktop');
  assert.equal(Number(layers.exportTextZ),layers.desktop.title,'exportación conserva orden de textos');
  assert.ok(layers.mobile.title>layers.mobile.image,'orden móvil independiente');
  assert.equal(layers.reset.image,undefined);assert.equal(layers.reset.title,undefined);
  console.log('Incidencias 1/2/7: Shift escala texto, dos arrastres A-B-C, alerta de cuota y recuperación OK');
 } finally {
  await page.evaluate(prev=>{
   project=JSON.parse(prev.project);curPage=prev.curPage;curSec=prev.curSec;curEl=prev.curEl;
   curPane=prev.curPane;selection=prev.selection;secFocus=prev.secFocus;viewMobile=prev.viewMobile;
   history=prev.history;future=prev.future;
   saveProject();renderPages();renderScenes();renderPane();renderPreview();
  },original);
 }
}
