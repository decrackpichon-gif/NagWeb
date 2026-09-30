/* NagWeb · Escena Universal v1.1
   Contenedor abierto: hijos nativos + efectos de escena + reacciones por elemento. */
(function(){
'use strict';
if(typeof window==='undefined')return;
if(typeof insertElement!=='function'||typeof containerMarkup!=='function'||typeof generateSite!=='function')return;
if(window.NAGWEB_UNIVERSAL&&window.NAGWEB_UNIVERSAL.version)return;

var UC_DEFAULTS={
 universal:true,name:'Escena universal',bg:'#11131A',bgOpacity:1,border:'',radius:28,shadow:true,w:78,h:520,hugHeight:false,stackDir:'',
 ucFx:'depth',ucDepth:22,ucScroll:0,ucIntensity:.72,ucAccent:'#8C6BFF',ucAccent2:'#2EE6D0',ucClip:true
};
var CHILD_DEFAULTS={ucReaction:'depth',ucStrength:60,ucAxis:'both',ucScroll:0};

function applyDefaults(e){
 if(!e||e.type!=='container')return e;
 Object.keys(UC_DEFAULTS).forEach(function(k){if(e[k]==null)e[k]=UC_DEFAULTS[k];});
 return e;
}
function applyChildDefaults(e){
 if(!e)return e;
 Object.keys(CHILD_DEFAULTS).forEach(function(k){if(e[k]==null)e[k]=CHILD_DEFAULTS[k];});
 return e;
}
function isUniversal(e){return!!(e&&e.type==='container'&&e.universal);}
function byId(s,id){return s&&s.elements&&s.elements.find(function(x){return x.id===id;});}
function nearestUniversal(s,e){
 var guard=0,cur=e;
 while(cur&&cur.parent&&guard++<30){
  cur=byId(s,cur.parent);
  if(isUniversal(cur))return cur;
 }
 return null;
}
function currentUniversal(){
 try{
  if(selection.length!==1)return null;
  var e=sec().elements.find(function(x){return x.id===selection[0];});
  return isUniversal(e)?e:null;
 }catch(_){return null;}
}

/* Si la escena universal está seleccionada, Insertar manda el nuevo elemento adentro. */
var _insertElement=insertElement;
insertElement=function(type,over,opts){
 opts=opts||{};
 var u=currentUniversal();
 if(u&&opts.parent==null&&type!=='shape3d'&&type!=='light3d'){
  opts=Object.assign({},opts,{parent:u.id});
  over=Object.assign({},CHILD_DEFAULTS,over||{});
 }
 return _insertElement(type,over,opts);
};
/* Lo mismo para composiciones/ramas prearmadas. */
var _insertBranch=insertBranch;
insertBranch=function(els,rootIds){
 var u=currentUniversal();
 if(u&&Array.isArray(els)){
  var roots=new Set(rootIds||(els[0]?[els[0].id]:[]));
  els.forEach(function(e){
   if(roots.has(e.id)&&e.type!=='shape3d'&&e.type!=='light3d'){
    e.parent=u.id;applyChildDefaults(e);
   }
  });
 }
 return _insertBranch(els,rootIds);
};

function universalConfig(c,p,kids){
 function n(v,d,min,max){v=+v;if(!isFinite(v))v=d;return Math.max(min,Math.min(max,v));}
 function color(v,fallback){try{return resolveColor(v||fallback,(p&&p.styles)||project.styles);}catch(_){return v||fallback;}}
 return{
  fx:['none','depth','spotlight','holo'].indexOf(c.ucFx)>=0?c.ucFx:'depth',
  depth:n(c.ucDepth,22,0,120),
  scroll:n(c.ucScroll,0,-160,160),
  intensity:n(c.ucIntensity,.72,0,1),
  a:color(c.ucAccent,'#8C6BFF'),b:color(c.ucAccent2,'#2EE6D0'),
  children:(kids||[]).map(function(k,i){
   return{
    id:k.id,
    reaction:['none','depth','magnet','repel','zoom'].indexOf(k.ucReaction)>=0?k.ucReaction:'depth',
    strength:n(k.ucStrength,60,0,100),
    axis:['both','x','y'].indexOf(k.ucAxis)>=0?k.ucAxis:'both',
    scroll:n(k.ucScroll,0,-160,160),
    order:i
   };
  })
 };
}

var _containerMarkup=containerMarkup;
containerMarkup=function(c,kids,p,z,mode,allEls,depth){
 var html=_containerMarkup(c,kids,p,z,mode,allEls,depth);
 if(!isUniversal(c)||!html)return html;
 applyDefaults(c);
 var cfg=universalConfig(c,p||project,kids),cls=' nw-uc nw-uc--'+cfg.fx;
 html=html.replace('class="el container-box','class="el container-box'+cls);
 var marker=' data-id="'+c.id+'"';
 html=html.replace(marker,' data-nw-uc="'+esc(JSON.stringify(cfg))+'"'+marker);
 var css='--nw-uc-a:'+cfg.a+';--nw-uc-b:'+cfg.b+';--nw-uc-int:'+cfg.intensity+';overflow:'+(c.ucClip===false?'visible':'hidden')+';';
 var styleAt=html.indexOf(' style="');
 if(styleAt>=0)html=html.slice(0,styleAt+8)+css+html.slice(styleAt+8);
 if(p&&p._edit&&(!kids||!kids.length)){
  var gt=html.indexOf('>');
  if(gt>=0)html=html.slice(0,gt+1)+'<div class="nw-uc-emptyhint">ESCENA UNIVERSAL · seleccionála y agregá elementos desde Insertar</div>'+html.slice(gt+1);
 }
 return html;
};

var UC_CSS=[
'.nw-uc{isolation:isolate;transform-style:preserve-3d}',
'.nw-uc:before{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;border-radius:inherit;opacity:0;transition:opacity .25s ease;background-position:center}',
'.nw-uc--spotlight:before{opacity:var(--nw-uc-int,.7);background:radial-gradient(circle at var(--nw-uc-x,50%) var(--nw-uc-y,50%),color-mix(in srgb,var(--nw-uc-a) 42%,transparent) 0,transparent 34%);mix-blend-mode:screen}',
'.nw-uc--holo:before{opacity:var(--nw-uc-int,.72);background:radial-gradient(circle at var(--nw-uc-x,50%) var(--nw-uc-y,50%),rgba(255,255,255,.48) 0,transparent 19%),conic-gradient(from 145deg at var(--nw-uc-x,50%) var(--nw-uc-y,50%),transparent,var(--nw-uc-a),var(--nw-uc-b),rgba(255,255,255,.82),var(--nw-uc-a),transparent);mix-blend-mode:screen;filter:saturate(1.25)}',
'.nw-uc--depth:before{opacity:calc(var(--nw-uc-int,.7)*.24);background:radial-gradient(circle at var(--nw-uc-x,50%) var(--nw-uc-y,50%),var(--nw-uc-a),transparent 45%);mix-blend-mode:screen}',
'.nw-uc>.el{will-change:translate,scale;transition:translate .16s cubic-bezier(.2,.8,.2,1),scale .18s cubic-bezier(.2,.8,.2,1)}',
'.nw-uc-emptyhint{position:absolute;inset:18px;z-index:5;display:grid;place-items:center;border:1.5px dashed color-mix(in srgb,currentColor 40%,transparent);border-radius:18px;padding:24px;text-align:center;font:700 10px/1.5 system-ui,sans-serif;letter-spacing:.12em;opacity:.55;pointer-events:none}',
'@media(prefers-reduced-motion:reduce){.nw-uc>.el{translate:0 0!important;scale:1!important;transition:none!important}}'
].join('\n');

var UC_RUNTIME="(function(){"+
"var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;"+
"function boot(el){if(el.__nwUniversal)return;el.__nwUniversal=1;var c={};try{c=JSON.parse(el.getAttribute('data-nw-uc')||'{}')}catch(_){}var px=.5,py=.5,busy=0;"+
"var map={};(c.children||[]).forEach(function(x){map[x.id]=x});"+
"function childList(){return Array.prototype.filter.call(el.children,function(n){return n.classList&&n.classList.contains('el')})}"+
"function paint(){busy=0;el.style.setProperty('--nw-uc-x',(px*100).toFixed(2)+'%');el.style.setProperty('--nw-uc-y',(py*100).toFixed(2)+'%');var a=childList(),d=reduce?0:(+c.depth||0),baseScroll=reduce?0:(+c.scroll||0),pr=el.getBoundingClientRect(),cx=pr.left+px*pr.width,cy=pr.top+py*pr.height,vp=(innerHeight/2-(pr.top+pr.height/2))/Math.max(innerHeight,pr.height);for(var i=0;i<a.length;i++){var n=a[i],cc=map[n.getAttribute('data-id')]||{},r=cc.reaction||'depth',st=reduce?0:((+cc.strength||60)/100),axis=cc.axis||'both',ord=a.length<2?1:(i/(a.length-1)*2-1),dx=0,dy=0,sc=1,ownScroll=(+cc.scroll||0)+baseScroll;if(r==='depth'){dx=(px-.5)*d*ord*st;dy=(py-.5)*d*.68*ord*st;}else if(r==='magnet'||r==='repel'){var nr=n.getBoundingClientRect(),vx=cx-(nr.left+nr.width/2),vy=cy-(nr.top+nr.height/2),dist=Math.max(50,Math.sqrt(vx*vx+vy*vy)),near=Math.max(0,1-dist/Math.max(180,Math.min(pr.width,pr.height)*.72)),sg=r==='repel'?-1:1;dx=vx/dist*d*2.3*near*st*sg;dy=vy/dist*d*2.3*near*st*sg;}else if(r==='zoom'){var nr2=n.getBoundingClientRect(),vx2=cx-(nr2.left+nr2.width/2),vy2=cy-(nr2.top+nr2.height/2),dist2=Math.sqrt(vx2*vx2+vy2*vy2),near2=Math.max(0,1-dist2/Math.max(160,Math.min(pr.width,pr.height)*.7));sc=1+near2*.18*st;}if(axis==='x')dy=0;if(axis==='y')dx=0;dy+=vp*ownScroll*st;n.style.translate=dx.toFixed(2)+'px '+dy.toFixed(2)+'px';n.style.scale=sc.toFixed(4)}}"+
"function req(){if(!busy){busy=1;requestAnimationFrame(paint)}}"+
"el.addEventListener('pointermove',function(ev){var r=el.getBoundingClientRect();px=Math.max(0,Math.min(1,(ev.clientX-r.left)/Math.max(1,r.width)));py=Math.max(0,Math.min(1,(ev.clientY-r.top)/Math.max(1,r.height)));req()});"+
"el.addEventListener('pointerleave',function(){px=.5;py=.5;req()});addEventListener('scroll',req,{passive:true});addEventListener('resize',req);paint()}"+
"document.querySelectorAll('.nw-uc').forEach(boot)})();";

var _generateSite=generateSite;
generateSite=function(p,edit,minify,mobile){
 var html=_generateSite(p,edit,minify,mobile),uses=(p.sections||[]).some(function(s){return(s.elements||[]).some(isUniversal);});
 if(!uses)return html;
 html=html.replace('</head>','<style id="nw-universal-css">'+UC_CSS+'</style></head>');
 html=html.replace('</body>','<script>'+UC_RUNTIME+'</script></body>');
 return html;
};

var _paneElementNew=paneElementNew;
paneElementNew=function(){
 var html=_paneElementNew();
 try{
  if(selection.length!==1)return html;
  var s=sec(),raw=s.elements[curEl];
  if(!raw)return html;

  /* Panel de la propia Escena universal */
  if(raw.type==='container'){
   if(!raw.universal){
    return html+grp('universal','Escena universal',
      '<p class="hint">Convertí este marco en un contenedor abierto: todo lo que metas adentro sigue siendo un elemento real de NagWeb y puede compartir efectos.</p>'+
      '<button type="button" class="btn tiny" data-uc-enable="1">Convertir en escena universal</button>');
   }
   applyDefaults(raw);
   var e=viewMobile?Object.assign({},raw,raw.mobile):raw,direct=s.elements.filter(function(x){return x.parent===raw.id}).length;
   var fx=cRow('Efecto de escena',cSel('el.ucFx',[
     ['none','Sin efecto de superficie'],['depth','Profundidad / luz suave'],['spotlight','Spotlight que sigue al cursor'],['holo','Holográfico']
   ],e.ucFx||'depth'));
   fx+='<p class="hint gh">Este efecto pertenece al contenedor. El movimiento de cada elemento se configura por separado seleccionándolo en el lienzo.</p>';
   fx+=cRow('Profundidad base',cNum('el.ucDepth',e.ucDepth==null?22:e.ucDepth,'px',{step:2,min:0,max:120}));
   fx+=cRow('Parallax de toda la escena',cNum('el.ucScroll',e.ucScroll==null?0:e.ucScroll,'px',{step:4,min:-160,max:160}));
   fx+=cRow('Intensidad visual',cNum('el.ucIntensity',e.ucIntensity==null?.72:e.ucIntensity,'',{step:.05,min:0,max:1}));
   fx+=cRow('Color A',cColor('el.ucAccent',e.ucAccent||'#8C6BFF'))+cRow('Color B',cColor('el.ucAccent2',e.ucAccent2||'#2EE6D0'));
   fx+=cRow('Recortar contenido',cSeg('el.ucClip',e.ucClip!==false,[['true','Sí'],['false','No']],'bool'));
   var quick='<div class="row" style="flex-wrap:wrap"><button type="button" class="btn tiny" data-uc-add="heading">+ Título</button><button type="button" class="btn tiny" data-uc-add="paragraph">+ Texto</button><button type="button" class="btn tiny" data-uc-add="image">+ Imagen</button><button type="button" class="btn tiny" data-uc-add="video">+ Video</button><button type="button" class="btn tiny" data-uc-add="button">+ Botón</button><button type="button" class="btn tiny" data-uc-add="container">+ Contenedor</button></div>';
   var body='<p class="hint"><b>'+direct+'</b> elemento(s) directo(s). Con la escena seleccionada, cualquier elemento nuevo entra acá automáticamente.</p>'+quick+
     '<p class="hint gh">Podés mover, rotar, escalar, editar, borrar o anidar elementos sin convertirlos en una caja cerrada.</p>'+fx+
     '<div class="row"><button type="button" class="btn tiny danger" data-uc-disable="1">Volver a contenedor normal</button></div>';
   return html+grp('universal','Escena universal',body);
  }

  /* Panel del hijo: reacción propia dentro de la Escena universal */
  var host=nearestUniversal(s,raw);
  if(host){
   applyChildDefaults(raw);
   var child=viewMobile?Object.assign({},raw,raw.mobile):raw;
   var body2='<p class="hint">Este elemento vive dentro de «'+escHtml(host.name||'Escena universal')+'». Su reacción al mouse es independiente del resto.</p>'+
     cRow('Reacción al mouse',cSel('el.ucReaction',[
       ['none','Ninguna'],['depth','Profundidad / parallax'],['magnet','Atraerse al cursor'],['repel','Alejarse del cursor'],['zoom','Zoom al acercarse']
     ],child.ucReaction||'depth'))+
     cRow('Intensidad',cNum('el.ucStrength',child.ucStrength==null?60:child.ucStrength,'%',{step:5,min:0,max:100}))+
     cRow('Eje',cSeg('el.ucAxis',child.ucAxis||'both',[['both','X + Y'],['x','Solo X'],['y','Solo Y']]))+
     cRow('Parallax al scroll',cNum('el.ucScroll',child.ucScroll==null?0:child.ucScroll,'px',{step:4,min:-160,max:160}))+
     '<p class="hint gh">Elegí «Ninguna» para dejar este elemento completamente quieto aunque otros reaccionen.</p>';
   return html+grp('uc-child','Reacción dentro de Escena universal',body2);
  }
  return html;
 }catch(_){return html;}
};

var pane=document.getElementById('pane');
if(pane)pane.addEventListener('click',function(ev){
 var en=ev.target.closest('[data-uc-enable]'),dis=ev.target.closest('[data-uc-disable]'),add=ev.target.closest('[data-uc-add]');
 if(!en&&!dis&&!add)return;
 var e=sec().elements[curEl];if(!e||e.type!=='container')return;
 if(en){
  snapshot();var keepName=e.name;Object.assign(e,UC_DEFAULTS,{universal:true,name:keepName&&keepName!=='Contenedor'?keepName:'Escena universal'});
  saveProject();renderPane();schedulePreview();return;
 }
 if(dis){snapshot();e.universal=false;saveProject();renderPane();schedulePreview();return;}
 if(add&&isUniversal(e)){
  var type=add.dataset.ucAdd;
  var over=type==='heading'?{text:'Título de la escena',size:'lg',anim:'none'}:
    type==='paragraph'?{text:'Texto editable dentro de la escena.',anim:'none'}:
    type==='button'?{text:'Acción',anim:'none'}:
    type==='container'?{name:'Subcontenedor',w:42,h:220,bgOpacity:.35,anim:'none'}:{anim:'none'};
  over=Object.assign({},CHILD_DEFAULTS,over);
  var made=_insertElement(type,over,{parent:e.id});
  if(type==='image'&&made)setTimeout(function(){var f=document.getElementById('file-img');if(f)f.click();},60);
 }
});

function insertUniversalContainer(over){
 var e=_insertElement('container',Object.assign({},UC_DEFAULTS,over||{}));
 if(e)applyDefaults(e);
 return e;
}
try{
 var cat=INSERT_CATS.find(function(c){return c.key==='creative';});
 if(cat&&!cat.__nwUniversal){
  cat.__nwUniversal=true;var oldItems=cat.items;
  cat.items=function(){
   var item={label:'Escena universal',desc:'Contenedor abierto: agregá elementos reales de NagWeb y decidí qué reacción tiene cada uno frente al mouse y al scroll.',icon:'frame',group:'Sistemas abiertos',vaultKey:'universal-container',run:function(){return insertUniversalContainer();}};
   return[item].concat(oldItems());
  };
 }
}catch(_){}

window.NAGWEB_UNIVERSAL={
 version:'1.1',defaults:UC_DEFAULTS,childDefaults:CHILD_DEFAULTS,create:insertUniversalContainer,isUniversal:isUniversal,applyDefaults:applyDefaults,
 supported:'Elementos DOM nativos de NagWeb. Objetos y luces 3D siguen en la escena Three.js compartida y requieren una capa de anclaje específica.'
};
console.info('[NagWeb] Escena universal v1.1 activa');
})();