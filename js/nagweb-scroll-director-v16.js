/* NagWeb 1.6 · Director de Scroll
   Una escena puede convertirse en una secuencia sticky con timing individual por elemento. */
(function(){
'use strict';
if(window.NAGWEB_SCROLL_DIRECTOR16)return;window.NAGWEB_SCROLL_DIRECTOR16=1;
if(typeof generateSite!=='function'||typeof paneSceneNew!=='function'||typeof paneElementNew!=='function')return;

var scrubState={},playRAF=0;

function secDefaults(s){
 if(!s)return s;
 if(s.sdEnabled==null)s.sdEnabled=false;
 if(s.sdLength==null)s.sdLength=320;
 if(s.sdEase==null)s.sdEase='cinematic';
 return s;
}
function elDefaults(e){
 if(!e)return e;
 if(e.sdStart==null)e.sdStart=0;
 if(e.sdEnd==null)e.sdEnd=82;
 if(e.sdSpan==null)e.sdSpan=8;
 if(e.sdEnter==null)e.sdEnter='fade';
 if(e.sdExit==null)e.sdExit='keep';
 if(e.sdMoveX==null)e.sdMoveX=0;
 if(e.sdMoveY==null)e.sdMoveY=0;
 if(e.sdRotate==null)e.sdRotate=0;
 if(e.sdScale==null)e.sdScale=100;
 return e;
}

var _paneSceneNew=paneSceneNew;
paneSceneNew=function(){
 var html=_paneSceneNew(),s=sec();secDefaults(s);
 if(s.layout==='horizontal')return html;
 var val=scrubState[s.id]==null?0:scrubState[s.id];
 var body=cRow('Activar',cSeg('sec.sdEnabled',!!s.sdEnabled,[['false','No'],['true','Sí']],'bool'));
 if(s.sdEnabled){
  body+='<p class="hint gh">La escena se convierte en una pequeña película controlada por el scroll: queda fija mientras el recorrido avanza de 0% a 100%.</p>';
  body+=cRow('Duración',cNum('sec.sdLength',s.sdLength,'vh',{step:20,min:140,max:900}));
  body+=cRow('Sensación',cSeg('sec.sdEase',s.sdEase||'cinematic',[['linear','Directa'],['smooth','Suave'],['cinematic','Cinemática']]));
  body+='<div class="field cstack"><label>Ver un momento sin scrollear <span class="val" data-sd-val>'+Math.round(val)+'%</span></label><input type="range" class="crange" data-sd-scrub="'+s.id+'" min="0" max="100" step="1" value="'+val+'"></div>';
  body+='<div class="row"><button type="button" class="btn tiny" data-sd-play="'+s.id+'">▶ Reproducir secuencia</button><button type="button" class="btn tiny" data-sd-live="'+s.id+'">↕ Volver al scroll real</button></div>';
  body+='<div class="row" style="margin-top:7px"><button type="button" class="btn tiny" data-sd-auto="'+s.id+'">Repartir elementos en etapas</button><button type="button" class="btn tiny" data-sd-reset="'+s.id+'">Mostrar todos toda la escena</button></div>';
  body+='<p class="hint gh">Después seleccioná cada elemento. En su panel aparece <b>Momento en la historia</b>, donde decidís cuándo entra, cuándo sale y qué recorrido hace.</p>';
 }
 return html+grp('s-scroll-director','Director de scroll',body);
};

var _paneElementNew=paneElementNew;
paneElementNew=function(){
 var html=_paneElementNew(),s=sec();secDefaults(s);
 if(!s.sdEnabled||selection.length!==1)return html;
 var raw=s.elements[curEl];if(!raw||raw.type==='light3d')return html;
 elDefaults(raw);
 var e=viewMobile?Object.assign({},raw,raw.mobile):raw;
 var timing=cRow('Visible desde / hasta',cNum('el.sdStart',e.sdStart,'%',{step:1,min:0,max:100})+cNum('el.sdEnd',e.sdEnd,'%',{step:1,min:0,max:100}));
 timing+=cRow('Transición',cNum('el.sdSpan',e.sdSpan,'%',{step:1,min:1,max:30}));
 timing+=cRow('Entrada',cSel('el.sdEnter',[
  ['none','Ya está'],['fade','Fundido'],['up','Desde abajo'],['down','Desde arriba'],['left','Desde izquierda'],['right','Desde derecha'],['zoom','Zoom'],['blur','Desenfoque'],['depth','Profundidad']
 ],e.sdEnter||'fade'));
 timing+=cRow('Salida',cSel('el.sdExit',[
  ['keep','Se queda'],['fade','Fundido'],['up','Hacia arriba'],['down','Hacia abajo'],['left','Hacia izquierda'],['right','Hacia derecha'],['zoom','Zoom'],['blur','Desenfoque']
 ],e.sdExit||'keep'));
 timing+='<h4 class="gsub">Viaje mientras está en escena</h4>';
 timing+=cRow('Desplazamiento',cNum('el.sdMoveX',e.sdMoveX,'X px',{step:10,min:-1600,max:1600})+cNum('el.sdMoveY',e.sdMoveY,'Y px',{step:10,min:-1600,max:1600}));
 timing+=cRow('Rotación / escala',cNum('el.sdRotate',e.sdRotate,'°',{step:5,min:-720,max:720})+cNum('el.sdScale',e.sdScale,'%',{step:5,min:10,max:500}));
 timing+='<p class="hint gh">Ejemplo: 20% → 55% hace que aparezca cerca del 20%, permanezca mientras avanza la escena y complete su viaje alrededor del 55%.</p>';
 if(raw.type==='shape3d'){
  timing+='<p class="hint gh">'+(raw.anchor!==false?'Este objeto 3D está anclado al lienzo: el Director mueve su ancla, así que el objeto Three.js la sigue.':'Este 3D no está anclado al lienzo. Activá su opción de anclaje si querés dirigirlo desde esta línea de tiempo.')+'</p>';
 }
 return html+grp('el-scroll-director','Momento en la historia',timing);
};

function postScrub(id,p){
 try{preview.contentWindow.postMessage({sc:true,type:'nw-sd-scrub',secId:id,progress:p},'*');}catch(_){}
}
function postLive(id){
 try{preview.contentWindow.postMessage({sc:true,type:'nw-sd-live',secId:id},'*');}catch(_){}
}
var pane=document.getElementById('pane');
if(pane){
 pane.addEventListener('input',function(ev){
  var t=ev.target.closest('[data-sd-scrub]');if(!t)return;
  var p=+t.value||0,id=t.dataset.sdScrub;scrubState[id]=p;
  var v=t.closest('.field')&&t.closest('.field').querySelector('[data-sd-val]');if(v)v.textContent=Math.round(p)+'%';
  postScrub(id,p/100);
 });
 pane.addEventListener('click',function(ev){
  var live=ev.target.closest('[data-sd-live]');
  if(live){delete scrubState[live.dataset.sdLive];postLive(live.dataset.sdLive);renderPane();return;}
  var auto=ev.target.closest('[data-sd-auto]');
  if(auto){
   var s=sec();snapshot();var list=s.elements.filter(function(e){return !e.parent&&e.type!=='light3d'&&!e.fixed&&!e.modal;});
   var n=Math.max(1,list.length),step=Math.min(22,72/n);
   list.forEach(function(e,i){elDefaults(e);e.sdStart=Math.round(5+i*step);e.sdEnd=Math.min(92,Math.round(e.sdStart+Math.max(18,step*1.35)));e.sdSpan=Math.max(4,Math.min(10,Math.round(step*.45)));e.sdEnter=i%3===0?'up':i%3===1?'fade':'depth';e.sdExit=i===list.length-1?'keep':'fade';});
   saveProject();renderPane();schedulePreview();return;
  }
  var reset=ev.target.closest('[data-sd-reset]');
  if(reset){var ss=sec();snapshot();ss.elements.forEach(function(e){if(e.type==='light3d')return;elDefaults(e);e.sdStart=0;e.sdEnd=100;e.sdSpan=6;e.sdEnter='none';e.sdExit='keep';e.sdMoveX=0;e.sdMoveY=0;e.sdRotate=0;e.sdScale=100;});saveProject();renderPane();schedulePreview();return;}
  var play=ev.target.closest('[data-sd-play]');
  if(play){
   if(playRAF)cancelAnimationFrame(playRAF);
   var id=play.dataset.sdPlay,start=performance.now(),dur=9000;
   function tick(t){var p=Math.min(1,(t-start)/dur),pct=p*100;scrubState[id]=pct;postScrub(id,p);var inp=document.querySelector('[data-sd-scrub="'+id+'"]');if(inp){inp.value=pct;var vv=inp.closest('.field')&&inp.closest('.field').querySelector('[data-sd-val]');if(vv)vv.textContent=Math.round(pct)+'%';}if(p<1)playRAF=requestAnimationFrame(tick);else playRAF=0;}
   playRAF=requestAnimationFrame(tick);return;
  }
 });
}
var preview=document.getElementById('preview');
if(preview)preview.addEventListener('load',function(){setTimeout(function(){Object.keys(scrubState).forEach(function(id){postScrub(id,(+scrubState[id]||0)/100);});},120);});

/* ---------- export / preview runtime ---------- */
function rt(DATA){
 var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
 function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
 function smooth(p){return p*p*(3-2*p)}
 function cine(p){return p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2}
 function ease(p,k){p=clamp(p,0,1);return k==='linear'?p:k==='smooth'?smooth(p):cine(p)}
 var states={};
 function setup(cfg){
  var sec=document.querySelector('.sc[data-id="'+cfg.id+'"]');if(!sec||sec.classList.contains('horizontal'))return;
  sec.classList.add('nw-sd-active');sec.style.setProperty('--nw-sd-len',cfg.length+'vh');
  var stage=document.createElement('div');stage.className='nw-sd-stage';
  if(sec.classList.contains('v-center'))stage.style.alignItems='center';else if(sec.classList.contains('v-bottom'))stage.style.alignItems='flex-end';else stage.style.alignItems='flex-start';
  if(sec.classList.contains('a-center'))stage.style.justifyContent='center';else if(sec.classList.contains('a-right'))stage.style.justifyContent='flex-end';else stage.style.justifyContent='flex-start';
  while(sec.firstChild)stage.appendChild(sec.firstChild);sec.appendChild(stage);
  var els=[];
  (cfg.elements||[]).forEach(function(c){var n=stage.querySelector('[data-id="'+c.id+'"]');if(!n)return;n.setAttribute('data-nw-sd-el','1');els.push({n:n,c:c});});
  var manual=null,busy=0;
  function paint(force){
   busy=0;var r=sec.getBoundingClientRect(),span=Math.max(1,r.height-innerHeight),p=manual==null?clamp(-r.top/span,0,1):manual;
   if(reduce&&manual==null)p=p<.5?0:1;
   els.forEach(function(q){
    var n=q.n,c=q.c,s=clamp((+c.start||0)/100,0,1),en=clamp((+c.end||82)/100,s,1),sp=clamp((+c.span||8)/100,.005,.3);
    var ip=ease((p-s)/sp,cfg.ease),ep=c.exit==='keep'?0:ease((p-en)/sp,cfg.ease),life=ease((p-s)/Math.max(.001,en-s),cfg.ease);
    var x=(+c.moveX||0)*life,y=(+c.moveY||0)*life,sc=1+(Math.max(.1,(+c.scale||100)/100)-1)*life,rot=(+c.rotate||0)*life,blur=0,op=1;
    if(p<s)op=0;
    if(c.enter==='fade')op*=ip;
    else if(c.enter==='up')y+=(1-ip)*70;
    else if(c.enter==='down')y-=(1-ip)*70;
    else if(c.enter==='left')x-=(1-ip)*110;
    else if(c.enter==='right')x+=(1-ip)*110;
    else if(c.enter==='zoom')sc*=.65+.35*ip;
    else if(c.enter==='blur'){op*=ip;blur+=(1-ip)*18;}
    else if(c.enter==='depth'){op*=ip;sc*=.78+.22*ip;y+=(1-ip)*28;}
    if(c.exit!=='keep'&&p>=en){
      op*=1-ep;
      if(c.exit==='up')y-=ep*70;
      else if(c.exit==='down')y+=ep*70;
      else if(c.exit==='left')x-=ep*110;
      else if(c.exit==='right')x+=ep*110;
      else if(c.exit==='zoom')sc*=1+ep*.22;
      else if(c.exit==='blur')blur+=ep*18;
    }
    n.style.setProperty('--nw-sd-x',x.toFixed(2)+'px');
    n.style.setProperty('--nw-sd-y',y.toFixed(2)+'px');
    n.style.setProperty('--nw-sd-scale',sc.toFixed(4));
    n.style.setProperty('--nw-sd-rot',rot.toFixed(2)+'deg');
    n.style.setProperty('--nw-sd-opacity',clamp(op,0,1).toFixed(4));
    n.style.setProperty('--nw-sd-blur',blur.toFixed(2)+'px');
    n.style.pointerEvents=op<.025?'none':'';
   });
   sec.style.setProperty('--nw-sd-progress',p.toFixed(4));
  }
  function req(){if(!busy){busy=1;requestAnimationFrame(paint)}}
  addEventListener('scroll',req,{passive:true});addEventListener('resize',req);
  states[cfg.id]={set:function(p){manual=clamp(+p||0,0,1);paint(true)},live:function(){manual=null;paint(true)}};paint(true);
 }
 (DATA||[]).forEach(setup);
 addEventListener('message',function(ev){var d=ev.data||{},S=states[d.secId];if(!S||!d.sc)return;if(d.type==='nw-sd-scrub')S.set(d.progress);else if(d.type==='nw-sd-live')S.live();});
 window.__NAG_SCROLL_DIRECTOR=states;
}
var SD_CSS=[
'.nw-sd-active{display:block!important;padding:0!important;height:var(--nw-sd-len)!important;min-height:var(--nw-sd-len)!important;position:relative!important}',
'.nw-sd-stage{position:sticky;top:0;width:100%;height:100vh;min-height:100vh;box-sizing:border-box;display:flex;padding:13vh 8vw;overflow:hidden}',
'.nw-sd-active.free .nw-sd-stage{padding:0}',
'.nw-sd-active.free .nw-sd-stage>.inner{position:absolute;inset:0}',
'[data-nw-sd-el]{translate:calc(var(--nw-sd-x,0px) + var(--nw-uc-dx,0px)) calc(var(--nw-sd-y,0px) + var(--nw-uc-dy,0px));scale:var(--nw-sd-scale,var(--nw-uc-scale,1));rotate:var(--nw-sd-rot,0deg);opacity:var(--nw-sd-opacity,1)!important;filter:blur(var(--nw-sd-blur,0px));will-change:translate,scale,rotate,opacity,filter}',
'@media(prefers-reduced-motion:reduce){[data-nw-sd-el]{transition:none!important}}'
].join('\n');

var _generateSite=generateSite;
generateSite=function(p,edit,minify,mobile){
 var html=_generateSite(p,edit,minify,mobile);
 var secs=(p.sections||[]).filter(function(s){return !!s.sdEnabled&&s.layout!=='horizontal';});
 if(!secs.length)return html;
 var data=secs.map(function(s){secDefaults(s);return{id:s.id,length:Math.max(140,Math.min(900,+s.sdLength||320)),ease:['linear','smooth','cinematic'].indexOf(s.sdEase)>=0?s.sdEase:'cinematic',elements:(s.elements||[]).filter(function(e){return e.type!=='light3d'&&!e.fixed;}).map(function(e){elDefaults(e);return{id:e.id,start:e.sdStart,end:e.sdEnd,span:e.sdSpan,enter:e.sdEnter,exit:e.sdExit,moveX:e.sdMoveX,moveY:e.sdMoveY,rotate:e.sdRotate,scale:e.sdScale};})};});
 html=html.replace('</head>','<style id="nw-scroll-director-css">'+SD_CSS+'</style></head>');
 html=html.replace('</body>','<script>('+rt.toString()+')('+JSON.stringify(data)+');</script></body>');
 return html;
};

window.NAGWEB_SCROLL_DIRECTOR={version:'1.0',scrub:function(id,p){scrubState[id]=p*100;postScrub(id,p)},live:postLive};
console.info('[NagWeb] Director de Scroll v1.0 activo');
})();