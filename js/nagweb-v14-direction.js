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
 {sel:'.scx-bn-copy b',field:'label'},{sel:'.scx-bn-copy p',field:'text',multi:true}
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


/* batch 5: ya trae data-wfield/data-wpart; este decorador hace persistentes
   los movimientos internos también en la web exportada. */
['holocard','cursorreveal','scrollzoom','depthheadline','magneticmosaic'].forEach(function(k){
 decorate(k,{mode:'creative'});
});

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
addMotion('projectindex','.wk-projectindex .scx-pi-row{position:relative;overflow:hidden}.wk-projectindex .scx-pi-row:before{content:\"\";position:absolute;inset:0;background:radial-gradient(180px circle at var(--mx,50%) 50%,color-mix(in srgb,var(--ac) 14%,transparent),transparent 70%);opacity:0;transition:opacity .2s;pointer-events:none}.wk-projectindex .scx-pi-row:hover:before{opacity:1}.wk-projectindex .scx-pi-row>*{position:relative;z-index:1}', "if(!window.SC_EDIT&&!reduce){var rs=el.querySelectorAll('.scx-pi-row');for(var j=0;j<rs.length;j++)rs[j].addEventListener('pointermove',function(ev){var r=this.getBoundingClientRect();this.style.setProperty('--mx',((ev.clientX-r.left)/r.width*100)+'%');});}");
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
   st.insertBefore(i5,st.firstChild);st.insertBefore(i4,st.firstChild);var pp=e&&e.__parts||{};[['card-3',i4],['card-4',i5]].forEach(function(q){var p=pp[q[0]];if(!p)return;q[1].style.setProperty('--nw-tx',(p.x||0)+'px');q[1].style.setProperty('--nw-ty',(p.y||0)+'px');q[1].style.setProperty('--nw-pr',(p.r||0)+'deg');q[1].style.setProperty('--nw-ps',(p.s==null?1:p.s));q[1].classList.add('nw-part-t');});
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
 var K=W.kinds[e.wk],src=(e.wp[field]!=null?e.wp[field]:(K&&K.defaults?K.defaults[field]:''));var ls=String(src||'').split(/\n/);
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


/* ---------- catálogo de comportamientos abiertos ---------- */
(function(){
 if(window.NAGWEB_BEHAVIORS)return;

 function current(){
  try{
   var s=sec(),e=selection&&selection.length===1?(s.elements||[]).find(function(x){return x.id===selection[0]}):null;
   return{s:s,e:e};
  }catch(_){return{s:null,e:null}}
 }
 function parentUniversal(s,e){
  var guard=0,cur=e;
  while(s&&cur&&cur.parent&&guard++<30){
   cur=(s.elements||[]).find(function(x){return x.id===cur.parent});
   if(cur&&cur.type==='container'&&cur.universal)return cur;
  }
  return null;
 }
 function notice(msg){
  var n=document.getElementById('nw-behavior-notice');
  if(!n){n=document.createElement('div');n.id='nw-behavior-notice';n.style.cssText='position:fixed;right:18px;bottom:18px;z-index:2147483600;max-width:340px;padding:10px 12px;border-radius:10px;background:#171820;color:#fff;font:600 11px/1.45 system-ui;box-shadow:0 14px 40px rgba(0,0,0,.28);transition:opacity .2s';document.body.appendChild(n);}
  n.textContent=msg;n.style.opacity='1';clearTimeout(n.__t);n.__t=setTimeout(function(){n.style.opacity='0'},2600);
 }
 function persist(){
  try{saveProject();renderPane();schedulePreview();}catch(_){}
 }
 function tag(e,id){
  if(!e)return;e.nwBehaviors=Array.isArray(e.nwBehaviors)?e.nwBehaviors:[];
  if(e.nwBehaviors.indexOf(id)<0)e.nwBehaviors.push(id);
 }
 function director(s,e){
  if(!s||!e)return false;
  s.sdEnabled=true;
  if(s.sdLength==null)s.sdLength=320;
  if(!s.sdEase)s.sdEase='cinematic';
  return true;
 }
 function apply(id,options){
  options=options||{};
  var q=current(),s=q.s,e=q.e,host;
  try{
   if(!options.managed&&typeof snapshot==='function')snapshot();
   if(id==='reveal'){
    if(!director(s,e)){notice('Seleccioná un elemento para aplicar Revelar.');return false}
    e.sdStart=12;e.sdEnd=Math.max(72,+e.sdEnd||82);e.sdSpan=8;e.sdEnter='fade';e.sdExit=e.sdExit||'keep';tag(e,id);
   }else if(id==='hold'){
    if(!director(s,e)){notice('Seleccioná un elemento para aplicar Mantener.');return false}
    e.sdStart=0;e.sdEnd=100;e.sdSpan=6;e.sdEnter='none';e.sdExit='keep';tag(e,id);
   }else if(id==='parallax'){
    if(!e){notice('Seleccioná un elemento para aplicar Parallax.');return false}
    host=parentUniversal(s,e);
    if(host){e.ucScroll=e.ucScroll||80;e.ucReaction=e.ucReaction||'depth';e.ucStrength=e.ucStrength==null?55:e.ucStrength;}
    else{director(s,e);e.sdMoveY=e.sdMoveY||-120;}
    tag(e,id);
   }else if(id==='cursor'){
    if(!e){notice('Seleccioná un elemento o una Escena universal.');return false}
    if(e.type==='container'&&e.universal){e.ucFx='spotlight';e.ucIntensity=e.ucIntensity==null?.72:e.ucIntensity;tag(e,id);}
    else{
     host=parentUniversal(s,e);
     if(!host){notice('Seguir cursor usa Escena universal. Meté el elemento dentro de una para aplicarlo.');return false}
     e.ucReaction='magnet';e.ucStrength=35;e.ucAxis='both';tag(e,id);
    }
   }else if(id==='magnet'){
    if(!e){notice('Seleccioná un elemento dentro de una Escena universal.');return false}
    host=parentUniversal(s,e);
    if(!host){notice('Magnetismo necesita que el elemento viva dentro de una Escena universal.');return false}
    e.ucReaction='magnet';e.ucStrength=80;e.ucAxis='both';tag(e,id);
   }else if(id==='videoScrub'){
    if(!e){notice('Seleccioná un video para aplicar Scrub de video.');return false}
    e.nwVideoScrub=true;e.nwVideoScrubSpan=e.nwVideoScrubSpan||100;tag(e,id);
   }else if(id==='sticky'){
    if(!s){notice('No hay una escena activa.');return false}
    s.sdEnabled=true;s.sdLength=Math.max(260,+s.sdLength||320);s.sdEase=s.sdEase||'cinematic';
    s.nwBehaviors=Array.isArray(s.nwBehaviors)?s.nwBehaviors:[];if(s.nwBehaviors.indexOf(id)<0)s.nwBehaviors.push(id);
   }else if(id==='sceneTransition'){
    if(!s){notice('No hay una escena activa.');return false}
    s.stType=s.stType&&s.stType!=='cut'?s.stType:'fade';s.stSpan=s.stSpan||24;
    s.nwBehaviors=Array.isArray(s.nwBehaviors)?s.nwBehaviors:[];if(s.nwBehaviors.indexOf(id)<0)s.nwBehaviors.push(id);
   }else if(id==='depth'){
    if(!e){notice('Seleccioná un elemento o una Escena universal.');return false}
    if(e.type==='container'&&e.universal){e.ucFx='depth';e.ucDepth=e.ucDepth==null?28:e.ucDepth;tag(e,id);}
    else{
     host=parentUniversal(s,e);
     if(!host){notice('Profundidad interactiva necesita una Escena universal.');return false}
     e.ucReaction='depth';e.ucStrength=e.ucStrength==null?65:e.ucStrength;tag(e,id);
    }
   }else if(id==='orbit3d'){
    if(!e){notice('Seleccioná el elemento del lienzo al que querés vincular el objeto 3D.');return false}
    e.nw3dOrbit=true;e.nw3dOrbitSpeed=e.nw3dOrbitSpeed==null?18:e.nw3dOrbitSpeed;tag(e,id);
   }else return false;
   if(!options.managed){persist();notice((REGISTRY[id]&&REGISTRY[id].label||id)+' aplicado.');}
   return true;
  }catch(err){console.warn('[NagWeb behaviors]',err);notice('No se pudo aplicar este comportamiento en la selección actual.');return false}
 }

 var REGISTRY={
  reveal:{label:'Revelar',desc:'Hace entrar el elemento durante la narrativa de scroll.',icon:'eye',group:'Narrativa'},
  hold:{label:'Mantener',desc:'Mantiene el elemento presente durante toda la escena.',icon:'pin',group:'Narrativa'},
  parallax:{label:'Parallax',desc:'Desplazamiento relativo al scroll, compatible con Director y Escena universal.',icon:'arrows-down-up',group:'Narrativa'},
  sticky:{label:'Sticky',desc:'Convierte la escena actual en un recorrido sticky controlado por scroll.',icon:'push-pin',group:'Narrativa'},
  sceneTransition:{label:'Transición de escena',desc:'Activa una transición editable hacia la escena siguiente.',icon:'shuffle',group:'Narrativa'},
  cursor:{label:'Seguir cursor',desc:'Seguimiento suave usando el sistema abierto de Escena universal.',icon:'cursor',group:'Interacción'},
  magnet:{label:'Magnetismo',desc:'Atrae el elemento hacia el cursor dentro de una Escena universal.',icon:'magnet',group:'Interacción'},
  depth:{label:'Profundidad',desc:'Agrega reacción de profundidad/parallax al cursor.',icon:'stack',group:'Interacción'},
  videoScrub:{label:'Scrub de video',desc:'Vincula el tiempo del video al recorrido visible del elemento.',icon:'film-strip',group:'Media'},
  orbit3d:{label:'Órbita 3D',desc:'Hace girar un objeto 3D vinculado al elemento seleccionado.',icon:'globe',group:'3D'}
 };

 try{
  ensureCategory('behavior','Comportamientos','wand','creative');
  var cat=INSERT_CATS.find(function(x){return x.key==='behavior'});
  if(cat){
   cat.res=false;
   cat.items=function(){
    return Object.keys(REGISTRY).map(function(id){
     var b=REGISTRY[id];
     return{label:b.label,desc:b.desc,icon:b.icon||'wand',group:b.group||'Comportamientos',vaultKey:'behavior-'+id,run:function(){return window.NAGWEB_BEHAVIORS.apply(id)}};
    });
   };
  }
 }catch(_){}

 function rtBehaviors(DATA){
  function esc(v){return String(v).replace(/\\/g,'\\\\').replace(/"/g,'\\"')}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
  var videos=[],busy=0,motion=matchMedia('(prefers-reduced-motion:reduce)');
  (DATA||[]).forEach(function(c){
   var el=document.querySelector('[data-id="'+esc(c.id)+'"]');if(!el)return;
   if(c.orbit3d){el.setAttribute('data-nw-3d-orbit','1');el.setAttribute('data-nw-3d-orbit-speed',String(c.orbitSpeed==null?18:c.orbitSpeed));}
   if(c.videoScrub){
    var v=el.matches&&el.matches('video')?el:el.querySelector&&el.querySelector('video');
    if(v){v.pause();v.removeAttribute('autoplay');var scene=c.scene&&document.querySelector('.sc[data-id="'+esc(c.scene)+'"]');videos.push({el:el,v:v,scene:scene,span:Math.max(20,Math.min(200,+c.videoSpan||100))});if(scene)scene.addEventListener('nw-sd-progress',paint);}
   }
  });
  function paint(){
   busy=0;if(motion.matches)return;
   for(var i=0;i<videos.length;i++){
    var q=videos[i],r=q.el.getBoundingClientRect(),vh=innerHeight||1,p=clamp((vh-r.top)/(vh+Math.max(1,r.height)*(q.span/100)),0,1),d=q.v.duration;
    if(q.scene)p=clamp((parseFloat(q.scene.style.getPropertyValue('--nw-sd-progress'))||0)/(q.span/100),0,1);
    if(isFinite(d)&&d>0&&Math.abs(q.v.currentTime-d*p)>.025){try{q.v.currentTime=d*p}catch(_){}}
   }
  }
  function req(){if(!busy){busy=1;requestAnimationFrame(paint)}}
  if(videos.length){motion.addEventListener('change',req);addEventListener('scroll',req,{passive:true});addEventListener('resize',req);for(var j=0;j<videos.length;j++)videos[j].v.addEventListener('loadedmetadata',req);paint();}
 }
 var _generateBehaviorSite=generateSite;
 generateSite=function(p,edit,minify,mobile){
  var html=_generateBehaviorSite(p,edit,minify,mobile),data=[];
  (p.sections||[]).forEach(function(s){
   (s.elements||[]).forEach(function(e){
    if(!e.nwVideoScrub&&!e.nw3dOrbit)return;
    data.push({id:e.id,videoScrub:!!e.nwVideoScrub,videoSpan:+e.nwVideoScrubSpan||100,scene:s.sdEnabled&&s.layout!=='horizontal'?s.id:null,orbit3d:!!e.nw3dOrbit,orbitSpeed:e.nw3dOrbitSpeed==null?18:+e.nw3dOrbitSpeed});
   });
  });
  if(!data.length)return html;
  html=html.replace('</body>','<script id="nw-behaviors-runtime">('+rtBehaviors.toString()+')('+JSON.stringify(data)+');</script></body>');
  return html;
 };

 var _paneBehaviors=paneElementNew;
 paneElementNew=function(){
  var html=_paneBehaviors(),q=current(),e=q.e;
  if(!e)return html;
  if(window.NAGWEB_BEHAVIOR_EDITOR)return html+window.NAGWEB_BEHAVIOR_EDITOR.panel(e,q.s,false);
  var active=Array.isArray(e.nwBehaviors)?e.nwBehaviors.filter(function(id){return !!REGISTRY[id]}):[];
  if(!active.length)return html;
  var body='<p class="hint">Estos comportamientos son recetas abiertas. Los controles finos siguen viviendo en Director de Scroll, Escena universal o el sistema 3D correspondiente.</p>';
  body+='<div class="row" style="flex-wrap:wrap">'+active.map(function(id){return '<span class="btn tiny" style="pointer-events:none">'+REGISTRY[id].label+'</span>'}).join('')+'</div>';
  if(e.nwVideoScrub)body+=cRow('Recorrido del scrub',cNum('el.nwVideoScrubSpan',e.nwVideoScrubSpan||100,'%',{step:5,min:20,max:200}));
  if(e.nw3dOrbit)body+=cRow('Velocidad de órbita',cNum('el.nw3dOrbitSpeed',e.nw3dOrbitSpeed==null?18:e.nw3dOrbitSpeed,'°/s',{step:2,min:-180,max:180}));
  return html+grp('nw-behaviors','Comportamientos aplicados',body);
 };

 window.NAGWEB_BEHAVIORS={
  version:'1.0',
  list:function(){return Object.keys(REGISTRY).map(function(id){return{id:id,label:REGISTRY[id].label,desc:REGISTRY[id].desc,group:REGISTRY[id].group}})},
  apply:apply,
  registry:REGISTRY
 };
})();

console.info('[NagWeb] dirección v1.4: Creativos interactivos + Composiciones + Mockups + edición directa');
})();
