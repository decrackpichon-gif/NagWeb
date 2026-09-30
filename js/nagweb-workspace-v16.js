/* NagWeb 1.6 · mesa de trabajo
   Paneles laterales plegables + variantes minimizables y redimensionables. */
(function(){
'use strict';
if(window.NAGWEB_WORKSPACE16)return;window.NAGWEB_WORKSPACE16=1;

var style=document.createElement('style');
style.id='nw-workspace-v16-css';
style.textContent=[
'@media (min-width:1041px){',
'  main{transition:grid-template-columns .22s cubic-bezier(.2,.8,.2,1)}',
'  body.nw-left-collapsed main{grid-template-columns:34px minmax(0,1fr) 300px!important}',
'  body.nw-right-collapsed main{grid-template-columns:248px minmax(0,1fr) 34px!important}',
'  body.nw-left-collapsed.nw-right-collapsed main{grid-template-columns:34px minmax(0,1fr) 34px!important}',
'  .col.scenes,.col.inspector{position:relative;transition:padding .18s ease}',
'  .nw-dock-toggle{position:absolute;z-index:500;top:8px;width:24px;height:24px;border:1px solid var(--line);border-radius:7px;background:color-mix(in srgb,var(--panel) 90%,transparent);color:var(--ink-soft);display:grid;place-items:center;padding:0;box-shadow:0 4px 15px rgba(0,0,0,.12);font:700 14px/1 system-ui;backdrop-filter:blur(8px)}',
'  .nw-dock-toggle:hover{color:var(--ink);border-color:var(--accent)}',
'  .nw-dock-toggle.left{right:4px}.nw-dock-toggle.right{left:4px}',
'  body.nw-left-collapsed .col.scenes{padding:0!important;overflow:hidden!important}',
'  body.nw-right-collapsed .col.inspector{padding:0!important;overflow:hidden!important}',
'  body.nw-left-collapsed .col.scenes>*:not(.nw-dock-toggle){display:none!important}',
'  body.nw-right-collapsed .col.inspector>*:not(.nw-dock-toggle){display:none!important}',
'  body.nw-left-collapsed .nw-dock-toggle.left{right:5px;top:10px}',
'  body.nw-right-collapsed .nw-dock-toggle.right{left:5px;top:10px}',
'}',
'@media (max-width:1040px){.nw-dock-toggle{display:none!important}}',
'.sc-varpanel{min-width:250px;min-height:120px;max-width:calc(100vw - 12px)!important;max-height:calc(100vh - 12px)!important}',
'.sc-varpanel .nw-vmin{width:28px;height:28px;border:0;border-radius:8px;background:transparent;color:var(--muted);font:700 18px/1 system-ui;cursor:pointer;display:grid;place-items:center}',
'.sc-varpanel .nw-vmin:hover{background:var(--panel-3);color:var(--ink)}',
'.sc-varpanel .nw-vresize{position:absolute;right:2px;bottom:2px;width:18px;height:18px;z-index:10;cursor:nwse-resize;opacity:.6}',
'.sc-varpanel .nw-vresize:before,.sc-varpanel .nw-vresize:after{content:"";position:absolute;right:3px;bottom:3px;border-right:1px solid var(--muted);border-bottom:1px solid var(--muted)}',
'.sc-varpanel .nw-vresize:before{width:10px;height:10px}.sc-varpanel .nw-vresize:after{width:5px;height:5px}',
'.sc-varpanel.nw-vminimized{height:auto!important;min-height:0!important;width:min(360px,calc(100vw - 24px))!important}',
'.sc-varpanel.nw-vminimized .sc-varbody,.sc-varpanel.nw-vminimized .nw-vresize{display:none!important}',
'.sc-varpanel.nw-vminimized .sc-varhead{border-bottom:0}',
'.sc-varpanel.nw-vminimized .sc-vtitle small{display:none}',
].join('\n');
document.head.appendChild(style);

var KEY='nagweb.workspace.v16';
function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(_){return{}}}
function save(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch(_){}}
var st=load();

function setSide(side,on){
 document.body.classList.toggle('nw-'+side+'-collapsed',!!on);
 st[side]=!!on;save(st);
 var b=document.querySelector('.nw-dock-toggle.'+side);
 if(b){
  var collapsed=!!on;
  b.textContent=side==='left'?(collapsed?'›':'‹'):(collapsed?'‹':'›');
  b.setAttribute('aria-label',(collapsed?'Mostrar ':'Ocultar ')+(side==='left'?'panel izquierdo':'panel derecho'));
  b.title=(collapsed?'Mostrar ':'Ocultar ')+(side==='left'?'panel izquierdo':'panel derecho');
 }
 try{if(typeof layoutFrame==='function')setTimeout(layoutFrame,30);}catch(_){}
}
function installSides(){
 var left=document.querySelector('.col.scenes'),right=document.querySelector('.col.inspector');
 if(left&&!left.querySelector('.nw-dock-toggle.left')){
  var b=document.createElement('button');b.type='button';b.className='nw-dock-toggle left';b.addEventListener('click',function(){setSide('left',!document.body.classList.contains('nw-left-collapsed'));});left.appendChild(b);
 }
 if(right&&!right.querySelector('.nw-dock-toggle.right')){
  var c=document.createElement('button');c.type='button';c.className='nw-dock-toggle right';c.addEventListener('click',function(){setSide('right',!document.body.classList.contains('nw-right-collapsed'));});right.appendChild(c);
 }
 setSide('left',!!st.left);setSide('right',!!st.right);
}
installSides();

function enhanceVariant(P){
 if(!P||P.__nwWorkspace)return;P.__nwWorkspace=1;
 var head=P.querySelector('.sc-varhead'),close=P.querySelector('[data-vclose]');
 if(!head)return;
 var min=document.createElement('button');min.type='button';min.className='nw-vmin';min.setAttribute('aria-label','Minimizar variantes');min.title='Minimizar';min.textContent='−';
 if(close)head.insertBefore(min,close);else head.appendChild(min);
 var grip=document.createElement('i');grip.className='nw-vresize';grip.setAttribute('aria-hidden','true');P.appendChild(grip);

 var vs=st.variant||{};
 if(vs.w)P.style.width=Math.max(250,Math.min(innerWidth-12,+vs.w))+'px';
 if(vs.h)P.style.height=Math.max(120,Math.min(innerHeight-12,+vs.h))+'px';
 if(vs.min){P.classList.add('nw-vminimized');min.textContent='□';min.title='Restaurar';}

 min.addEventListener('click',function(ev){
  ev.stopPropagation();var on=P.classList.toggle('nw-vminimized');
  min.textContent=on?'□':'−';min.title=on?'Restaurar':'Minimizar';min.setAttribute('aria-label',min.title);
  st.variant=st.variant||{};st.variant.min=on;save(st);
 });

 grip.addEventListener('pointerdown',function(ev){
  ev.preventDefault();ev.stopPropagation();P.classList.remove('nw-vminimized');min.textContent='−';
  var r=P.getBoundingClientRect(),sx=ev.clientX,sy=ev.clientY,w0=r.width,h0=r.height;
  try{grip.setPointerCapture(ev.pointerId)}catch(_){}
  function mv(e){
   var w=Math.max(250,Math.min(innerWidth-r.left-6,w0+e.clientX-sx));
   var h=Math.max(120,Math.min(innerHeight-r.top-6,h0+e.clientY-sy));
   P.style.width=Math.round(w)+'px';P.style.height=Math.round(h)+'px';
  }
  function up(){
   grip.removeEventListener('pointermove',mv);grip.removeEventListener('pointerup',up);grip.removeEventListener('pointercancel',up);
   var rr=P.getBoundingClientRect();st.variant={w:Math.round(rr.width),h:Math.round(rr.height),min:false};save(st);
  }
  grip.addEventListener('pointermove',mv);grip.addEventListener('pointerup',up);grip.addEventListener('pointercancel',up);
 });
}
function scanVariants(){document.querySelectorAll('.sc-varpanel').forEach(enhanceVariant);}
scanVariants();
new MutationObserver(function(){scanVariants();installSides();}).observe(document.body,{childList:true,subtree:true});

console.info('[NagWeb] workspace v1.6: paneles plegables + variantes ajustables');
})();