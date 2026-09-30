/* NagWeb 1.4 · nueva dirección de catálogo + edición directa en lienzo
   Criterio:
   - Creativos = animación, interacción o inmersión.
   - Composiciones = sistemas editoriales prearmados.
   - Mockups = presentaciones de dispositivos con movimiento.
   - Estructura = sistemas principalmente estáticos.
*/
(function(){
'use strict';
if(!window.SCW || !window.SCWX) return;
var W=window.SCW, X=window.SCWX;

/* ---------- categorías ---------- */
var composition=[
 'editorialposter','editorialcollage','splitfeature','floatingcaption','bignumber',
 'pullquote','casehero','typespecimen','eventposter','splitstatement'
];
var structures=['moodboard','brandboard','bentoshow'];
var mockups=['browsermock','devicepair'];
var creativeKeep=['duotoneimage','cardstack','drawunderline','photostrip','projectindex'];

composition.forEach(function(k){ if(W.kinds[k]) W.kinds[k].cat='composition'; });
structures.forEach(function(k){ if(W.kinds[k]) W.kinds[k].cat='layout'; });
mockups.forEach(function(k){ if(W.kinds[k]) W.kinds[k].cat='mockup'; });
creativeKeep.forEach(function(k){ if(W.kinds[k]) W.kinds[k].cat='creative'; });

function catIndex(k){ return INSERT_CATS.findIndex(function(c){return c.key===k;}); }
function ensureCategory(key,label,icon,after){
 if(INSERT_CATS.some(function(c){return c.key===key;})) return;
 var at=catIndex(after); if(at<0) at=catIndex('creative');
 INSERT_CATS.splice(at+1,0,{key:key,label:label,icon:icon||'wand',view:key,items:function(){return widgetItems(key);},res:false});
}
ensureCategory('composition','Composiciones','frame','creative');
ensureCategory('mockup','Mockups','monitor','composition');

var layoutCat=INSERT_CATS.find(function(c){return c.key==='layout';});
if(layoutCat && !layoutCat.__nwWidgets){
 layoutCat.__nwWidgets=true;
 var oldLayout=layoutCat.items;
 layoutCat.items=function(){
  return oldLayout().concat(widgetItems('layout').map(function(x){ if(!x.group)x.group='Composiciones estructurales'; return x; }));
 };
}

/* orden coherente dentro de Elementos */
var desired=['text','layout','shapes','icons','shaders','media','forms','interactive','social','creative','composition','mockup','3d','embed','vault','sections','mine','cms'];
INSERT_CATS.sort(function(a,b){
 var ai=desired.indexOf(a.key),bi=desired.indexOf(b.key);
 return (ai<0?999:ai)-(bi<0?999:bi);
});

/* ---------- decoradores de markup: edición directa + partes manipulables ---------- */
function decorate(kind,spec){
 var K=W.kinds[kind]; if(!K || K.__nwDecorated) return;
 K.__nwDecorated=true;
 var old=K.markup;
 K.markup=function(e,ctx){
  var html=old.call(K,e,ctx);
  if(!html || typeof document==='undefined') return html;
  var t=document.createElement('template'); t.innerHTML=html;
  var root=t.content.firstElementChild;
  if(!root) return html;
  if(spec.motion) root.classList.add('nw-motion');
  if(spec.mode) root.setAttribute('data-nw-mode',spec.mode);
  (spec.text||[]).forEach(function(d){
    var ns=t.content.querySelectorAll(d.sel);
    ns.forEach(function(n,idx){
      n.setAttribute('data-wfield',d.field);
      if(d.multi)n.setAttribute('data-wmulti','1');
      if(d.part)n.setAttribute('data-wpart',d.part+(ns.length>1?'-'+idx:''));
    });
  });
  (spec.parts||[]).forEach(function(d){
    var ns=t.content.querySelectorAll(d.sel);
    ns.forEach(function(n,idx){ n.setAttribute('data-wpart',d.name+(ns.length>1?'-'+idx:'')); });
  });
  if(typeof spec.custom==='function') spec.custom(t.content,e,ctx);
  var parts=e && e.__parts || {};
  t.content.querySelectorAll('[data-wpart]').forEach(function(n){
    var p=parts[n.getAttribute('data-wpart')]; if(!p)return;
    n.style.setProperty('--nw-tx',(p.x||0)+'px');
    n.style.setProperty('--nw-ty',(p.y||0)+'px');
    n.style.setProperty('--nw-pr',(p.r||0)+'deg');
    n.style.setProperty('--nw-ps',(p.s==null?1:p.s));
    n.classList.add('nw-part-t');
  });
  return t.innerHTML;
 };
}

/* Creativos que quedan */
decorate('cardstack',{motion:true,mode:'creative',text:[
 {sel:'.scx-cst-copy b',field:'title',part:'copy-title'},
 {sel:'.scx-cst-copy span',field:'sub',part:'copy-sub'}
],parts:[{sel:'.scx-cst-stage i',name:'card'}]});
decorate('projectindex',{motion:true,mode:'creative',custom:function(f){
 var rows=f.querySelectorAll('.scx-pi-row');
 rows.forEach(function(r,ri){
  var b=r.querySelector('b'),s=r.querySelector('span'),y=r.querySelector('strong');
  [[b,0],[s,1],[y,2]].forEach(function(q){if(q[0]){q[0].setAttribute('data-wlist','items');q[0].setAttribute('data-wrow',ri);q[0].setAttribute('data-wcol',q[1]);}});
 });
}});
decorate('photostrip',{motion:true,mode:'creative',text:[{sel:'.scx-film-roll small',field:'caption'}],parts:[{sel:'.scx-film-roll>i',name:'frame'}]});
decorate('duotoneimage',{motion:true,mode:'creative',text:[{sel:'figcaption',field:'caption'}],parts:[{sel:'.scx-duo-img',name:'image'}]});
decorate('drawunderline',{motion:true,mode:'creative'});

/* Composiciones */
decorate('editorialposter',{motion:true,mode:'composition',text:[
 {sel:'.scx-ep-top b',field:'eyebrow',part:'eyebrow'},{sel:'.scx-ep-top span',field:'number',part:'number'},
 {sel:'.scx-ep h2',field:'title',multi:true,part:'title'},{sel:'.scx-ep-foot small',field:'note',part:'note'}
]});
decorate('editorialcollage',{motion:true,mode:'composition',text:[
 {sel:'.scx-ec figcaption b',field:'label'},{sel:'.scx-ec figcaption span',field:'caption'}
],parts:[{sel:'.scx-ec-grid i',name:'image'}]});
decorate('splitfeature',{motion:true,mode:'composition',text:[
 {sel:'.scx-sf-side b',field:'kicker'},{sel:'.scx-sf-side h3',field:'title',multi:true,part:'title'},{sel:'.scx-sf-side p',field:'text',multi:true}
],parts:[{sel:'.scx-sf-main',name:'main-image'},{sel:'.scx-sf-side>i',name:'detail-image'}]});
decorate('floatingcaption',{motion:true,mode:'composition',text:[
 {sel:'.scx-fc figcaption b',field:'eyebrow'},{sel:'.scx-fc figcaption h3',field:'title',part:'title'},{sel:'.scx-fc figcaption p',field:'text',multi:true}
],parts:[{sel:'.scx-fc-img',name:'image'},{sel:'.scx-fc figcaption',name:'caption-card'}]});
decorate('bignumber',{motion:true,mode:'composition',text:[
 {sel:'.scx-bn-num',field:'number',part:'number'},{sel:'.scx-bn-copy b',field:'label'},{sel:'.scx-bn-copy p',field:'text',multi:true}
]});
decorate('pullquote',{motion:true,mode:'composition',text:[
 {sel:'.scx-pq p',field:'quote',multi:true,part:'quote'},{sel:'.scx-pq footer b',field:'author'},{sel:'.scx-pq footer span',field:'role'}
]});
decorate('casehero',{motion:true,mode:'composition',text:[
 {sel:'.scx-ch-copy>b',field:'eyebrow'},{sel:'.scx-ch-copy h2',field:'title',part:'title'},
 {sel:'.scx-ch-copy>div span',field:'meta'},{sel:'.scx-ch-copy>div strong',field:'year'}
],parts:[{sel:'.scx-ch-img',name:'image'}]});
decorate('typespecimen',{motion:true,mode:'composition',text:[
 {sel:'.scx-ts header b',field:'kicker'},{sel:'.scx-ts header span',field:'note'},{sel:'.scx-ts-grid strong',field:'hero',part:'hero'},
 {sel:'.scx-ts-grid p.up',field:'upper',multi:true},{sel:'.scx-ts-grid p:not(.up)',field:'lower',multi:true},{sel:'.scx-ts-grid em',field:'nums'}
]});
decorate('eventposter',{motion:true,mode:'composition',text:[
 {sel:'.scx-ev header b',field:'date'},{sel:'.scx-ev h2',field:'title',multi:true,part:'title'},
 {sel:'.scx-ev footer span',field:'place'},{sel:'.scx-ev footer strong',field:'cta'}
]});
decorate('splitstatement',{motion:true,mode:'composition',text:[
 {sel:'.scx-ss-copy b',field:'eyebrow'},{sel:'.scx-ss-copy h2',field:'title',multi:true,part:'title'}
],parts:[{sel:'.scx-ss-img',name:'image'}]});

/* Mockups */
decorate('browsermock',{motion:true,mode:'mockup',text:[
 {sel:'.scx-bm-bar b',field:'url'},{sel:'.scx-bm-bar em',field:'label'}
],parts:[{sel:'.scx-bm-win',name:'browser'}]});
decorate('devicepair',{motion:true,mode:'mockup',text:[{sel:'.scx-dp-stage>b',field:'label'}],
 parts:[{sel:'.scx-dp-desktop',name:'desktop'},{sel:'.scx-dp-phone',name:'phone'}]});

/* Estructura: editables, pero sin disfrazarlas de Creativos */
decorate('moodboard',{mode:'layout',text:[{sel:'figcaption',field:'label'}],parts:[{sel:'.scx-mb i',name:'image'}]});
decorate('brandboard',{mode:'layout',text:[
 {sel:'.scx-bb-copy b',field:'brand'},{sel:'.scx-bb-copy span',field:'tagline'},{sel:'.scx-bb-copy em',field:'sample'}
]});
decorate('bentoshow',{mode:'layout',text:[
 {sel:'.scx-bs-stat strong',field:'big',part:'stat'},{sel:'.scx-bs-stat span',field:'label'},
 {sel:'.scx-bs-copy b',field:'title'},{sel:'.scx-bs-copy p',field:'text',multi:true}
],parts:[{sel:'.scx-bs-img',name:'image'}]});

/* ---------- movimiento de calidad ---------- */
function addMotion(kind,extraCSS,extraRuntime){
 var K=W.kinds[kind]; if(!K)return;
 var common='.el.wdg.wk-'+kind+' [data-wpart].nw-part-t{translate:var(--nw-tx,0px) var(--nw-ty,0px);rotate:var(--nw-pr,0deg);scale:var(--nw-ps,1)}'+
 '.el.wdg.wk-'+kind+' .nw-motion{opacity:0;translate:0 22px;transition:opacity .7s ease,translate .9s cubic-bezier(.2,.8,.2,1),transform .25s ease;will-change:transform,translate}'+
 '.el.wdg.wk-'+kind+' .nw-motion.nw-in{opacity:1;translate:0 0}'+
 '@media(prefers-reduced-motion:reduce){.el.wdg.wk-'+kind+' .nw-motion{opacity:1;translate:0 0!important;transition:none!important;transform:none!important}}';
 W.css[kind]=(W.css[kind]||'')+common+(extraCSS||'');
 var rt="(function(){var a=document.querySelectorAll('.wk-"+kind+" .nw-motion');for(var i=0;i<a.length;i++)(function(el){if(el.__nwM)return;el.__nwM=1;var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;if(!reduce&&window.IntersectionObserver){var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){el.classList.add('nw-in');io.disconnect();}},{threshold:.16});io.observe(el);}else el.classList.add('nw-in');"+(extraRuntime||"")+"})(a[i]);})();";
 W.runtime[kind]=(W.runtime[kind]||'')+rt;
}
composition.forEach(function(k){addMotion(k,'', "if(!window.SC_EDIT&&!reduce){el.addEventListener('pointermove',function(ev){var r=el.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width-.5,y=(ev.clientY-r.top)/r.height-.5;el.style.transform='perspective(1100px) rotateX('+(-y*1.8)+'deg) rotateY('+(x*2.2)+'deg)';});el.addEventListener('pointerleave',function(){el.style.transform='';});}");});
addMotion('photostrip','', "if(!window.SC_EDIT&&!reduce){el.addEventListener('pointermove',function(ev){var r=el.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width-.5;var roll=el.querySelector('.scx-film-roll');if(roll)roll.style.translate=(x*-20)+'px 0';});el.addEventListener('pointerleave',function(){var roll=el.querySelector('.scx-film-roll');if(roll)roll.style.translate='';});}");
addMotion('projectindex','', "if(!window.SC_EDIT&&!reduce){var rs=el.querySelectorAll('.scx-pi-row');for(var j=0;j<rs.length;j++)rs[j].addEventListener('pointermove',function(ev){var r=this.getBoundingClientRect();this.style.setProperty('--mx',((ev.clientX-r.left)/r.width*100)+'%');});}");
addMotion('duotoneimage','.wk-duotoneimage .scx-duo-img{transition:filter .45s ease,scale .55s cubic-bezier(.2,.8,.2,1)}.wk-duotoneimage .scx-duo:hover .scx-duo-img{filter:grayscale(.15) contrast(var(--ct)) brightness(var(--br));scale:1.018}',"");
addMotion('cardstack','', "if(!window.SC_EDIT&&!reduce){el.addEventListener('pointermove',function(ev){var r=el.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width-.5,y=(ev.clientY-r.top)/r.height-.5;var st=el.querySelector('.scx-cst-stage');if(st)st.style.transform='perspective(900px) rotateX('+(-y*5)+'deg) rotateY('+(x*6)+'deg)';});el.addEventListener('pointerleave',function(){var st=el.querySelector('.scx-cst-stage');if(st)st.style.transform='';});}");
mockups.forEach(function(k){addMotion(k,'', "if(!window.SC_EDIT&&!reduce){el.addEventListener('pointermove',function(ev){var r=el.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width-.5,y=(ev.clientY-r.top)/r.height-.5;el.style.transform='perspective(1200px) rotateX('+(-y*4)+'deg) rotateY('+(x*5)+'deg)';var ph=el.querySelector('.scx-dp-phone');if(ph)ph.style.translate=(x*-14)+'px '+(y*-10)+'px';});el.addEventListener('pointerleave',function(){el.style.transform='';var ph=el.querySelector('.scx-dp-phone');if(ph)ph.style.translate='';});}");});

/* Mockup navegador: paneo interno al hover para que la captura se sienta viva */
if(W.css.browsermock) W.css.browsermock += '.wk-browsermock .scx-bm-shot{transition:background-position 2.4s cubic-bezier(.2,.7,.2,1)}.wk-browsermock .scx-bm-win:hover .scx-bm-shot{background-position:bottom center!important}';

/* Pila de proyectos: hasta cinco tarjetas */
(function(){
 var K=W.kinds.cardstack;if(!K||K.__nwFive)return;K.__nwFive=true;
 K.defaults.img4='';K.defaults.img5='';
 var fi=K.fields.findIndex(function(f){return f.k==='img3';});
 if(fi>=0)K.fields.splice(fi+1,0,{k:'img4',label:'Proyecto 4',type:'image'},{k:'img5',label:'Proyecto 5',type:'image'});
 var old=K.markup;
 K.markup=function(e,ctx){
  var h=old.call(K,e,ctx),t=document.createElement('template');t.innerHTML=h;
  var st=t.content.querySelector('.scx-cst-stage');
  if(st){
   var i4=document.createElement('i');i4.className='four';i4.setAttribute('data-wpart','card-3');i4.setAttribute('style','background:'+X.bgImg(ctx,e.img4,7));
   var i5=document.createElement('i');i5.className='five';i5.setAttribute('data-wpart','card-4');i5.setAttribute('style','background:'+X.bgImg(ctx,e.img5,9));
   st.insertBefore(i5,st.firstChild);st.insertBefore(i4,st.firstChild);
  }
  return t.innerHTML;
 };
 W.css.cardstack += '.scx-cst-stage .four{transform:rotate(calc(var(--sp)*-.72));translate:calc(var(--dp)*-1.1) calc(var(--dp)*.3)}.scx-cst-stage .five{transform:rotate(calc(var(--sp)*.66));translate:calc(var(--dp)*1.1) calc(var(--dp)*.45)}.scx-cst.has-h:hover .four{transform:rotate(calc(var(--sp)*-1.45));translate:-30% 7%}.scx-cst.has-h:hover .five{transform:rotate(calc(var(--sp)*1.4));translate:30% 8%}';
})();

/* ---------- edición tipo Canva dentro del iframe ---------- */
function currentWidget(id){
 try{return sec().elements.find(function(e){return e.id===id&&e.type==='widget';})||null;}catch(err){return null;}
}
function commitWidgetField(id,field,value){
 var e=currentWidget(id);if(!e||!field)return;
 e.wp=e.wp||{};
 if(e.wp[field]===value)return;
 snapshot();e.wp[field]=value;saveProject();renderPane();schedulePreview();
}
function commitWidgetList(id,field,row,col,value){
 var e=currentWidget(id);if(!e)return;e.wp=e.wp||{};
 var ls=String(e.wp[field]||'').split(/\n/);
 while(ls.length<=row)ls.push('');
 var p=ls[row].split('|');while(p.length<=col)p.push('');
 p[col]=value;ls[row]=p.join('|');
 snapshot();e.wp[field]=ls.join('\n');saveProject();renderPane();schedulePreview();
}
function commitPart(id,name,p){
 var e=currentWidget(id);if(!e)return;e.wp=e.wp||{};e.wp.__parts=e.wp.__parts||{};
 e.wp.__parts[name]={x:Math.round((p.x||0)*10)/10,y:Math.round((p.y||0)*10)/10,r:Math.round(p.r||0),s:Math.round((p.s==null?1:p.s)*1000)/1000};
 saveProject();
}
function installCanvasTools(){
 var fr=document.getElementById('preview');if(!fr)return;
 var doc;try{doc=fr.contentDocument;}catch(err){return;}if(!doc||!doc.body||doc.__nwCanvasTools)return;doc.__nwCanvasTools=1;
 var style=doc.createElement('style');
 style.textContent='[data-wfield],[data-wlist]{cursor:text}[data-wfield]:hover,[data-wlist]:hover{outline:1px dashed rgba(139,108,255,.75);outline-offset:3px}[data-wpart]{position:relative}.nw-wpart-sel{outline:1.5px solid #8C6BFF!important;outline-offset:3px!important}.nw-wpart-h{position:fixed;z-index:2147483000;width:12px;height:12px;border-radius:50%;background:#fff;border:2px solid #7C5CFF;box-shadow:0 1px 5px rgba(0,0,0,.3)}.nw-wpart-h.size{cursor:nwse-resize}.nw-wpart-h.rot{cursor:grab;background:#7C5CFF}.nw-canvas-editing{outline:2px solid #8C6BFF!important;outline-offset:2px!important;cursor:text!important}';
 doc.head.appendChild(style);
 var active=null,handles=[];
 function clear(){
  if(active)active.classList.remove('nw-wpart-sel');active=null;
  handles.forEach(function(h){h.remove();});handles=[];
 }
 function placeHandles(){
  handles.forEach(function(h){h.remove();});handles=[];if(!active)return;
  var r=active.getBoundingClientRect();
  var s=doc.createElement('i');s.className='nw-wpart-h size';s.style.left=(r.right-6)+'px';s.style.top=(r.bottom-6)+'px';
  var rot=doc.createElement('i');rot.className='nw-wpart-h rot';rot.style.left=(r.left+r.width/2-6)+'px';rot.style.top=(r.top-28)+'px';
  doc.body.appendChild(s);doc.body.appendChild(rot);handles=[s,rot];
  bindHandle(s,'size');bindHandle(rot,'rot');
 }
 function partState(root,n){
  var id=root.dataset.id,e=currentWidget(id),name=n.getAttribute('data-wpart'),p=e&&e.wp&&e.wp.__parts&&e.wp.__parts[name]||{};
  return {id:id,name:name,e:e,x:+p.x||0,y:+p.y||0,r:+p.r||0,s:p.s==null?1:+p.s};
 }
 function applyPart(n,p){
  n.style.setProperty('--nw-tx',p.x+'px');n.style.setProperty('--nw-ty',p.y+'px');n.style.setProperty('--nw-pr',p.r+'deg');n.style.setProperty('--nw-ps',p.s);n.classList.add('nw-part-t');
 }
 function bindHandle(h,mode){
  h.addEventListener('pointerdown',function(ev){
   if(!active)return;ev.preventDefault();ev.stopPropagation();
   var root=active.closest('.el.wdg[data-id]');if(!root)return;
   var p=partState(root,active),sx=ev.clientX,sy=ev.clientY,r=active.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dist0=Math.max(12,Math.hypot(sx-cx,sy-cy));
   function mv(e){
    if(mode==='size')p.s=Math.max(.2,Math.min(5,p.s*Math.hypot(e.clientX-cx,e.clientY-cy)/dist0));
    else p.r=Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI+90;
    applyPart(active,p);placeHandles();
   }
   function up(){doc.defaultView.removeEventListener('pointermove',mv);doc.defaultView.removeEventListener('pointerup',up);commitPart(p.id,p.name,p);}
   doc.defaultView.addEventListener('pointermove',mv);doc.defaultView.addEventListener('pointerup',up);
  });
 }
 doc.addEventListener('dblclick',function(ev){
  var n=ev.target.closest&&ev.target.closest('[data-wfield],[data-wlist]');if(!n)return;
  var root=n.closest('.el.wdg[data-id]');if(!root)return;
  ev.preventDefault();ev.stopPropagation();clear();
  n.setAttribute('contenteditable','plaintext-only');n.classList.add('nw-canvas-editing');n.focus();
  try{var rg=doc.createRange();rg.selectNodeContents(n);var sl=doc.defaultView.getSelection();sl.removeAllRanges();sl.addRange(rg);}catch(_){}
  var done=false;
  function fin(){
   if(done)return;done=true;n.removeAttribute('contenteditable');n.classList.remove('nw-canvas-editing');
   var v=n.innerText.replace(/[\r\n]+$/,'');
   if(n.hasAttribute('data-wfield'))commitWidgetField(root.dataset.id,n.getAttribute('data-wfield'),v);
   else commitWidgetList(root.dataset.id,n.getAttribute('data-wlist'),+n.getAttribute('data-wrow'),+n.getAttribute('data-wcol'),v);
  }
  n.addEventListener('blur',fin,{once:true});
  n.addEventListener('keydown',function(k){k.stopPropagation();if(k.key==='Escape'||(k.key==='Enter'&&!k.shiftKey&&!n.hasAttribute('data-wmulti'))){k.preventDefault();n.blur();}});
 },true);
 doc.addEventListener('pointerdown',function(ev){
  if(ev.target.closest&&ev.target.closest('[contenteditable]'))return;
  var n=ev.target.closest&&ev.target.closest('[data-wpart]');if(!n){clear();return;}
  var root=n.closest('.el.wdg[data-id]');if(!root)return;
  if(!(selection.length===1&&selection[0]===root.dataset.id))return;
  ev.preventDefault();ev.stopPropagation();active=n;doc.querySelectorAll('.nw-wpart-sel').forEach(function(x){x.classList.remove('nw-wpart-sel');});n.classList.add('nw-wpart-sel');placeHandles();
  var p=partState(root,n),sx=ev.clientX,sy=ev.clientY,ox=p.x,oy=p.y,moved=false;
  function mv(e){var dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)+Math.abs(dy)>2)moved=true;p.x=ox+dx;p.y=oy+dy;applyPart(n,p);placeHandles();}
  function up(){doc.defaultView.removeEventListener('pointermove',mv);doc.defaultView.removeEventListener('pointerup',up);if(moved)commitPart(p.id,p.name,p);}
  doc.defaultView.addEventListener('pointermove',mv);doc.defaultView.addEventListener('pointerup',up);
 },true);
 doc.defaultView.addEventListener('scroll',placeHandles);
 doc.defaultView.addEventListener('resize',placeHandles);
}
var preview=document.getElementById('preview');
if(preview){preview.addEventListener('load',function(){setTimeout(installCanvasTools,40);});setTimeout(installCanvasTools,250);}
var ob=new MutationObserver(function(){setTimeout(installCanvasTools,40);});if(preview)ob.observe(preview,{attributes:true,attributeFilter:['src','srcdoc']});

console.info('[NagWeb] dirección v1.4: Creativos interactivos + Composiciones + Mockups + edición directa');
})();