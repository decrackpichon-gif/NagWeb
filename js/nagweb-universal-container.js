/* NagWeb · Universal Creative Container v1 */
(function(){
'use strict';
if(typeof window==='undefined')return;
if(typeof insertElement!=='function'||typeof containerMarkup!=='function'||typeof generateSite!=='function')return;
if(window.NAGWEB_UNIVERSAL&&window.NAGWEB_UNIVERSAL.version)return;

var UC_DEFAULTS={
 universal:true,name:'Escena universal',bg:'#11131A',bgOpacity:1,border:'',radius:28,shadow:true,w:78,h:520,hugHeight:false,stackDir:'',
 ucFx:'depth',ucDepth:22,ucScroll:0,ucIntensity:.72,ucAccent:'#8C6BFF',ucAccent2:'#2EE6D0',ucClip:true
};
function applyDefaults(e){if(!e||e.type!=='container')return e;Object.keys(UC_DEFAULTS).forEach(function(k){if(e[k]==null)e[k]=UC_DEFAULTS[k];});return e;}
function isUniversal(e){return!!(e&&e.type==='container'&&e.universal);}
function currentUniversal(){try{if(selection.length!==1)return null;var e=sec().elements.find(function(x){return x.id===selection[0];});return isUniversal(e)?e:null;}catch(_){return null;}}

var _insertElement=insertElement;
insertElement=function(type,over,opts){
 opts=opts||{};var u=currentUniversal();
 if(u&&opts.parent==null&&type!=='shape3d'&&type!=='light3d')opts=Object.assign({},opts,{parent:u.id});
 return _insertElement(type,over,opts);
};
var _insertBranch=insertBranch;
insertBranch=function(els,rootIds){
 var u=currentUniversal();
 if(u&&Array.isArray(els)){var roots=new Set(rootIds||(els[0]?[els[0].id]:[]));els.forEach(function(e){if(roots.has(e.id)&&e.type!=='shape3d'&&e.type!=='light3d')e.parent=u.id;});}
 return _insertBranch(els,rootIds);
};

function universalConfig(c,p){
 function n(v,d,min,max){v=+v;if(!isFinite(v))v=d;return Math.max(min,Math.min(max,v));}
 function color(v,fallback){try{return resolveColor(v||fallback,(p&&p.styles)||project.styles);}catch(_){return v||fallback;}}
 return{fx:['none','depth','spotlight','holo'].indexOf(c.ucFx)>=0?c.ucFx:'depth',depth:n(c.ucDepth,22,0,100),scroll:n(c.ucScroll,0,-120,120),intensity:n(c.ucIntensity,.72,0,1),a:color(c.ucAccent,'#8C6BFF'),b:color(c.ucAccent2,'#2EE6D0')};
}
var _containerMarkup=containerMarkup;
containerMarkup=function(c,kids,p,z,mode,allEls,depth){
 var html=_containerMarkup(c,kids,p,z,mode,allEls,depth);if(!isUniversal(c)||!html)return html;applyDefaults(c);
 var cfg=universalConfig(c,p||project),cls=' nw-uc nw-uc--'+cfg.fx;
 html=html.replace('class="el container-box','class="el container-box'+cls);
 var marker=' data-id="'+c.id+'"',data=' data-nw-uc="'+esc(JSON.stringify(cfg))+'"';html=html.replace(marker,data+marker);
 var css='--nw-uc-a:'+cfg.a+';--nw-uc-b:'+cfg.b+';--nw-uc-int:'+cfg.intensity+';overflow:'+(c.ucClip===false?'visible':'hidden')+';';
 var styleAt=html.indexOf(' style="');if(styleAt>=0)html=html.slice(0,styleAt+8)+css+html.slice(styleAt+8);
 if(p&&p._edit&&(!kids||!kids.length)){var gt=html.indexOf('>');if(gt>=0)html=html.slice(0,gt+1)+'<div class="nw-uc-emptyhint">ESCENA UNIVERSAL · seleccionála y agregá cualquier elemento desde Insertar</div>'+html.slice(gt+1);}
 return html;
};

var UC_CSS=[
'.nw-uc{isolation:isolate;transform-style:preserve-3d}',
'.nw-uc:before{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;border-radius:inherit;opacity:0;transition:opacity .25s ease;background-position:center}',
'.nw-uc--spotlight:before{opacity:var(--nw-uc-int,.7);background:radial-gradient(circle at var(--nw-uc-x,50%) var(--nw-uc-y,50%),color-mix(in srgb,var(--nw-uc-a) 42%,transparent) 0,transparent 34%);mix-blend-mode:screen}',
'.nw-uc--holo:before{opacity:var(--nw-uc-int,.72);background:radial-gradient(circle at var(--nw-uc-x,50%) var(--nw-uc-y,50%),rgba(255,255,255,.48) 0,transparent 19%),conic-gradient(from 145deg at var(--nw-uc-x,50%) var(--nw-uc-y,50%),transparent,var(--nw-uc-a),var(--nw-uc-b),rgba(255,255,255,.82),var(--nw-uc-a),transparent);mix-blend-mode:screen;filter:saturate(1.25)}',
'.nw-uc--depth:before{opacity:calc(var(--nw-uc-int,.7)*.28);background:radial-gradient(circle at var(--nw-uc-x,50%) var(--nw-uc-y,50%),var(--nw-uc-a),transparent 45%);mix-blend-mode:screen}',
'.nw-uc>.el{will-change:translate;transition:translate .18s cubic-bezier(.2,.8,.2,1)}',
'.nw-uc-emptyhint{position:absolute;inset:18px;z-index:5;display:grid;place-items:center;border:1.5px dashed color-mix(in srgb,currentColor 40%,transparent);border-radius:18px;padding:24px;text-align:center;font:700 10px/1.5 system-ui,sans-serif;letter-spacing:.12em;opacity:.55;pointer-events:none}',
'@media(prefers-reduced-motion:reduce){.nw-uc>.el{translate:0 0!important;transition:none!important}}'
].join('\n');

var UC_RUNTIME="(function(){"+
"var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;"+
"function boot(el){if(el.__nwUniversal)return;el.__nwUniversal=1;var c={};try{c=JSON.parse(el.getAttribute('data-nw-uc')||'{}')}catch(_){}var px=.5,py=.5,busy=0;"+
"function kids(){return Array.prototype.filter.call(el.children,function(n){return n.classList&&n.classList.contains('el')})}"+
"function paint(){busy=0;el.style.setProperty('--nw-uc-x',(px*100).toFixed(2)+'%');el.style.setProperty('--nw-uc-y',(py*100).toFixed(2)+'%');var a=kids(),d=reduce?0:(+c.depth||0),sy=reduce?0:(+c.scroll||0),r=el.getBoundingClientRect(),vp=(innerHeight/2-(r.top+r.height/2))/Math.max(innerHeight,r.height);for(var i=0;i<a.length;i++){var k=a.length<2?1:(i/(a.length-1)*2-1),dx=(px-.5)*d*k,dy=(py-.5)*d*.65*k+vp*sy*k;a[i].style.translate=dx.toFixed(2)+'px '+dy.toFixed(2)+'px'}}"+
"function req(){if(!busy){busy=1;requestAnimationFrame(paint)}}"+
"el.addEventListener('pointermove',function(ev){var r=el.getBoundingClientRect();px=Math.max(0,Math.min(1,(ev.clientX-r.left)/Math.max(1,r.width)));py=Math.max(0,Math.min(1,(ev.clientY-r.top)/Math.max(1,r.height)));req()});"+
"el.addEventListener('pointerleave',function(){px=.5;py=.5;req()});addEventListener('scroll',req,{passive:true});addEventListener('resize',req);paint()}"+
"document.querySelectorAll('.nw-uc').forEach(boot)})();";

var _generateSite=generateSite;
generateSite=function(p,edit,minify,mobile){
 var html=_generateSite(p,edit,minify,mobile),uses=(p.sections||[]).some(function(s){return(s.elements||[]).some(isUniversal);});
 if(!uses)return html;
 html=html.replace('</head>','<style id="nw-universal-css">'+UC_CSS+'</style></head>');
 html=html.replace('</body>','<script>'+UC_RUNTIME+'<\\/script></body>');
 return html;
};

var _paneElementNew=paneElementNew;
paneElementNew=function(){
 var html=_paneElementNew();
 try{
  if(selection.length!==1)return html;var raw=sec().elements[curEl];if(!raw||raw.type!=='container')return html;
  if(!raw.universal)return html+grp('universal','Escena universal','<p class="hint">Convertí este marco en un contenedor abierto: todo lo que metas adentro seguirá siendo un elemento real de NagWeb y podrá compartir efectos de cursor/scroll.</p><button type="button" class="btn tiny" data-uc-enable="1">Convertir en escena universal</button>');
  applyDefaults(raw);var e=viewMobile?Object.assign({},raw,raw.mobile):raw,direct=sec().elements.filter(function(x){return x.parent===raw.id}).length;
  var fx=cRow('Experiencia',cSeg('el.ucFx',e.ucFx||'depth',[['none','Ninguna','Solo contenedor'],['depth','Profundidad','Los hijos se separan en planos'],['spotlight','Spotlight','Luz que sigue al cursor'],['holo','Holográfica','Iridescencia + profundidad']]));
  fx+=cRow('Profundidad',cNum('el.ucDepth',e.ucDepth==null?22:e.ucDepth,'px',{step:2,min:0,max:100}));
  fx+=cRow('Parallax scroll',cNum('el.ucScroll',e.ucScroll==null?0:e.ucScroll,'px',{step:4,min:-120,max:120}));
  fx+=cRow('Intensidad',cNum('el.ucIntensity',e.ucIntensity==null?.72:e.ucIntensity,'',{step:.05,min:0,max:1}));
  fx+=cRow('Color A',cColor('el.ucAccent',e.ucAccent||'#8C6BFF'))+cRow('Color B',cColor('el.ucAccent2',e.ucAccent2||'#2EE6D0'));
  fx+=cRow('Recortar',cSeg('el.ucClip',e.ucClip!==false,[['true','Sí','Oculta lo que sale'],['false','No','Permite desbordar']],'bool'));
  var quick='<div class="row" style="flex-wrap:wrap"><button type="button" class="btn tiny" data-uc-add="heading">+ Título</button><button type="button" class="btn tiny" data-uc-add="paragraph">+ Texto</button><button type="button" class="btn tiny" data-uc-add="image">+ Imagen</button><button type="button" class="btn tiny" data-uc-add="video">+ Video</button><button type="button" class="btn tiny" data-uc-add="button">+ Botón</button><button type="button" class="btn tiny" data-uc-add="container">+ Contenedor</button></div>';
  var body='<p class="hint"><b>'+direct+'</b> elemento(s) directo(s). Seleccioná esta escena y cualquier elemento que agregues desde Insertar entra acá automáticamente. También podés arrastrar capas dentro o fuera.</p>'+quick+'<p class="hint gh">Los elementos siguen siendo independientes: podés moverlos, rotarlos, editarlos, borrarlos o anidar otros contenedores. El efecto pertenece a la escena, no destruye el contenido.</p>'+fx+'<div class="row"><button type="button" class="btn tiny danger" data-uc-disable="1">Volver a contenedor normal</button></div>';
  return html+grp('universal','Escena universal',body);
 }catch(_){return html;}
};

var pane=document.getElementById('pane');
if(pane)pane.addEventListener('click',function(ev){
 var en=ev.target.closest('[data-uc-enable]'),dis=ev.target.closest('[data-uc-disable]'),add=ev.target.closest('[data-uc-add]');if(!en&&!dis&&!add)return;
 var e=sec().elements[curEl];if(!e||e.type!=='container')return;
 if(en){snapshot();var keepName=e.name;Object.assign(e,UC_DEFAULTS,{universal:true,name:keepName&&keepName!=='Contenedor'?keepName:'Escena universal'});saveProject();renderPane();schedulePreview();return;}
 if(dis){snapshot();e.universal=false;saveProject();renderPane();schedulePreview();return;}
 if(add&&isUniversal(e)){
  var type=add.dataset.ucAdd,over=type==='heading'?{text:'Título de la escena',size:'lg',anim:'none'}:type==='paragraph'?{text:'Texto editable dentro de la escena.',anim:'none'}:type==='button'?{text:'Acción',anim:'none'}:type==='container'?{name:'Subcontenedor',w:42,h:220,bgOpacity:.35,anim:'none'}:{anim:'none'};
  var made=_insertElement(type,over,{parent:e.id});if(type==='image'&&made)setTimeout(function(){var f=document.getElementById('file-img');if(f)f.click()},60);
 }
});

function insertUniversalContainer(over){var e=_insertElement('container',Object.assign({},UC_DEFAULTS,over||{}));if(e)applyDefaults(e);return e;}
try{
 var cat=INSERT_CATS.find(function(c){return c.key==='creative'});
 if(cat&&!cat.__nwUniversal){cat.__nwUniversal=true;var oldItems=cat.items;cat.items=function(){var item={label:'Escena universal',desc:'Contenedor abierto: agregá textos, imágenes, videos, widgets y otros contenedores; todos siguen editables y comparten una experiencia interactiva.',icon:'frame',group:'Sistemas abiertos',vaultKey:'universal-container',run:function(){return insertUniversalContainer();}};return[item].concat(oldItems());};}
}catch(_){}

window.NAGWEB_UNIVERSAL={version:'1.0',defaults:UC_DEFAULTS,create:insertUniversalContainer,isUniversal:isUniversal,applyDefaults:applyDefaults,supported:'Todos los elementos DOM de NagWeb; objetos y luces 3D siguen siendo de nivel escena.'};
console.info('[NagWeb] Escena universal v1 activa');
})();