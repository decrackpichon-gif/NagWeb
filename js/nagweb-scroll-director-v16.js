/* NagWeb 1.6 · Director de Scroll
   Una escena puede convertirse en una secuencia sticky con timing individual por elemento. */
(function(){
'use strict';
if(window.NAGWEB_SCROLL_DIRECTOR16)return;window.NAGWEB_SCROLL_DIRECTOR16=1;
if(typeof generateSite!=='function'||typeof paneSceneNew!=='function'||typeof paneElementNew!=='function')return;

var scrubState={},playRAF=0,model=window.NAGWEB_STORY_MODEL;

var timelineStyle=document.createElement('style');
timelineStyle.id='nw-scroll-director-timeline-css';
timelineStyle.textContent=[
 '.nw-sd-timeline{margin:10px 0 12px;padding:9px;border:1px solid var(--line);border-radius:10px;background:color-mix(in srgb,var(--panel) 88%,transparent)}',
 '.nw-sd-timeline-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:7px;font:700 9px/1 system-ui;letter-spacing:.08em;color:var(--muted)}',
 '.nw-sd-timeline-grid{position:relative;display:grid;gap:5px}',
 '.nw-sd-timeline-grid:before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0,transparent calc(25% - 1px),color-mix(in srgb,var(--line) 75%,transparent) calc(25% - 1px),color-mix(in srgb,var(--line) 75%,transparent) 25%);pointer-events:none}',
 '.nw-sd-trow{display:grid;grid-template-columns:72px minmax(0,1fr);gap:7px;align-items:center;min-height:16px;padding:2px 3px;border-radius:6px}',
 '.nw-sd-trow.is-selected{background:color-mix(in srgb,var(--accent) 14%,transparent)}',
 '.nw-sd-tname{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:600 9px/1.1 system-ui;color:var(--ink-soft);cursor:pointer}',
 '.nw-sd-trow.is-selected .nw-sd-tname{color:var(--ink)}',
 '.nw-sd-tname{border:0;background:transparent;padding:0;text-align:left}',
 '.nw-sd-ttrack{position:relative;height:8px;border-radius:999px;background:color-mix(in srgb,var(--line) 55%,transparent);overflow:hidden}',
 '.nw-sd-tbar{position:absolute;top:1px;bottom:1px;border-radius:999px;background:var(--accent);min-width:4px;cursor:grab}',
 '.nw-sd-tbar:active{cursor:grabbing}',
 '.nw-sd-thandle{position:absolute;z-index:4;top:50%;width:8px;height:14px;border:1px solid var(--panel);border-radius:4px;background:var(--accent);translate:0 -50%;cursor:ew-resize;box-shadow:0 1px 4px rgba(0,0,0,.25)}',
 '.nw-sd-thandle.start{left:-4px}.nw-sd-thandle.end{right:-4px}',
 '.nw-sd-playhead{position:absolute;z-index:3;top:-3px;bottom:-3px;width:1px;background:var(--ink);left:var(--sd-play,0%);pointer-events:none}',
].join('\n');
document.head.appendChild(timelineStyle);

function timelineHTML(s,val){
 if(window.NAGWEB_STORY_EDITOR)return window.NAGWEB_STORY_EDITOR.timeline(s,val);
 var list=(s.elements||[]).filter(function(e){return e.type!=='light3d'&&!e.fixed&&!e.modal;});
 if(!list.length)return '';
 var rows=list.map(function(e,i){
  elDefaults(e);var a=Math.max(0,Math.min(100,+e.sdStart||0)),b=Math.max(a,Math.min(100,+e.sdEnd||82));
  var name=(e.name||e.label||e.text||e.type||('Elemento '+(i+1)))+'';name=name.replace(/[<>&"]/g,function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]});
  var selected=Array.isArray(selection)&&selection.length===1&&selection[0]===e.id;
  return '<div class="nw-sd-trow'+(selected?' is-selected':'')+'" data-sd-row="'+e.id+'"><button type="button" class="nw-sd-tname" data-sd-select="'+e.id+'" title="'+name+'">'+name+'</button><span class="nw-sd-ttrack"><i class="nw-sd-tbar" data-sd-bar="1" style="left:'+a+'%;width:'+Math.max(1,b-a)+'%"><button type="button" class="nw-sd-thandle start" data-sd-edge="start" aria-label="Mover inicio"></button><button type="button" class="nw-sd-thandle end" data-sd-edge="end" aria-label="Mover fin"></button></i></span></div>';
 }).join('');
 return '<div class="nw-sd-timeline" data-sd-timeline="'+s.id+'" style="--sd-play:'+Math.max(0,Math.min(100,val))+'%"><div class="nw-sd-timeline-head"><span>LÍNEA DE TIEMPO</span><span>0 · 25 · 50 · 75 · 100%</span></div><div class="nw-sd-timeline-grid"><i class="nw-sd-playhead"></i>'+rows+'</div></div>';
}

function secDefaults(s){
 if(!s)return s;
 if(s.sdEnabled==null)s.sdEnabled=false;
 if(s.sdLength==null)s.sdLength=320;
 if(s.sdEase==null)s.sdEase='cinematic';
 if(s.sdPerspective==null)s.sdPerspective=1000;
 if(s.stType==null)s.stType='cut';
 if(s.stSpan==null)s.stSpan=24;
 return s;
}
function temporal(s){return s.nwMotionSource==='time';}
function directed(s){return temporal(s)||s.sdEnabled;}
function groupOwner(s,e){var seen={};while(e){if(e.nwMotionInstance)return e;if(!e.parent||seen[e.parent])break;seen[e.parent]=1;e=(s.elements||[]).find(function(n){return n.id===e.parent;});}return null;}
function playbackPanel(s){
 if(!s.sdMotionTemplate&&!s.nwMotionSource)return '';
 return grp('s-motion-playback','Reproducción de Motion Lab',cRow('Animar por','<select class="csel" data-motion-source aria-label="Animar por"><option value="time"'+(temporal(s)?' selected':'')+'>Tiempo</option><option value="scroll"'+(!temporal(s)?' selected':'')+'>Scroll</option></select>')+(temporal(s)?cRow('Duración',cNum('sec.nwMotionDuration',s.nwMotionDuration||8,'s',{min:.5,max:120,step:.5}))+cRow('Repetir',cSeg('sec.nwMotionLoop',s.nwMotionLoop!==false,[['false','No'],['true','Sí']],'bool'))+cRow('Perspectiva',cNum('sec.sdPerspective',s.sdPerspective,'px',{min:200,max:5000,step:50}))+timelineHTML(s,currentProgress(s.id))+'<button type="button" class="btn tiny" data-sd-play="'+s.id+'">▶ Reproducir</button><button type="button" class="btn tiny" data-sd-pause="'+s.id+'">Pausar</button><button type="button" class="btn tiny" data-sd-live="'+s.id+'">Reiniciar por tiempo</button><p class="hint gh">En el sitio se reproduce por tiempo, sin fijar la escena ni ampliar el recorrido de scroll. En edición podés recorrer y editar cada momento.</p>':'<p class="hint gh">El progreso sigue al Director de scroll de esta escena.</p>'));
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
 var val=currentProgress(s.id);
 var body=temporal(s)?'<p class="hint gh">Esta composición usa Tiempo. Cambiá Animar por a Scroll para vincularla al Director.</p>':cRow('Activar',cSeg('sec.sdEnabled',!!s.sdEnabled,[['false','No'],['true','Sí']],'bool'));
 if(s.sdEnabled){
  body+='<p class="hint gh">La escena se convierte en una pequeña película controlada por el scroll: queda fija mientras el recorrido avanza de 0% a 100%.</p>';
  body+=cRow('Longitud del recorrido',cNum('sec.sdLength',s.sdLength,'vh',{step:20,min:140,max:900}));
  body+=cRow('Perspectiva',cNum('sec.sdPerspective',s.sdPerspective,'px',{step:50,min:200,max:5000}));
  body+=cRow('Ritmo',cSeg('sec.sdEase',s.sdEase||'cinematic',[['linear','Directa'],['smooth','Suave'],['cinematic','Cinemática']]));
  body+='<div class="field cstack"><label>Previsualizar momento <span class="val" data-sd-val>'+Math.round(val)+'%</span></label><input type="range" class="crange" data-sd-scrub="'+s.id+'" min="0" max="100" step="1" value="'+val+'"></div>';
  body+=timelineHTML(s,val);
  body+='<div class="row"><button type="button" class="btn tiny" data-sd-play="'+s.id+'">▶ Reproducir secuencia</button><button type="button" class="btn tiny" data-sd-live="'+s.id+'">↕ Volver al scroll real</button></div>';
  body+='<div class="row" style="margin-top:7px"><button type="button" class="btn tiny" data-sd-auto="'+s.id+'">Distribuir entradas automáticamente</button><button type="button" class="btn tiny" data-sd-reset="'+s.id+'">Dejar todos visibles</button></div>';
  body+='<p class="hint gh">Después seleccioná cada elemento. En su panel aparece <b>Momento en la historia</b>, donde decidís cuándo entra, cuándo sale y qué recorrido hace.</p>';
 }
 var trans=cRow('Tipo',cSeg('sec.stType',s.stType||'cut',[['cut','Corte'],['fade','Fundido'],['overlay','Superposición'],['push','Empuje'],['zoom','Zoom'],['morph','Morph simple']]));
 if((s.stType||'cut')!=='cut')trans+=cRow('Duración',cNum('sec.stSpan',s.stSpan,'%',{step:1,min:8,max:60}));
 trans+='<p class="hint gh">Define cómo entra la escena siguiente. Corte, Fundido, Superposición, Empuje y Zoom cubren cambios clásicos. Morph simple hace una transformación continua de forma visual entre ambas escenas mediante escala, opacidad y redondeo.</p>';
 return html+playbackPanel(s)+grp('s-scroll-director','Director de scroll',body)+grp('s-scene-transition','Transición a la siguiente escena',trans);
};

var _paneElementNew=paneElementNew;
paneElementNew=function(){
 var html=_paneElementNew(),s=sec();secDefaults(s);
 var editor=window.NAGWEB_STORY_EDITOR;
 var chosen=selection.length===1?s.elements[curEl]:null,owner=groupOwner(s,chosen);
 if(owner){html+=grp('el-motion-instance','Composición de Motion Lab','<button type="button" class="btn primary" data-motion-edit="'+owner.id+'">Editar en Motion Lab</button><p class="hint gh">Edición de esta misma composición. Sus movimientos son independientes del resto de la escena.</p>');s=editor?editor.context(s,chosen):s;}
 if(!directed(s))return html;
 if(selection.length>1&&editor)return html+grp('el-scroll-director','Secuencia seleccionada',editor.transport(s)+timelineHTML(s,currentProgress(s.id))+editor.staggerPanel(s));
 if(selection.length!==1)return html;
 var raw=chosen||s.elements[curEl];if(!raw||raw.type==='light3d'||raw.fixed||raw.modal||!model.eligible(raw,s))return html;
 if(owner===raw)return html;
 elDefaults(raw);
 var e=viewMobile?Object.assign({},raw,raw.mobile):raw;
 var timing=cRow('Empieza / termina',cNum('el.sdStart',e.sdStart,'%',{step:1,min:0,max:100})+cNum('el.sdEnd',e.sdEnd,'%',{step:1,min:0,max:100}));
 timing+=cRow('Duración de entrada / salida',cNum('el.sdSpan',e.sdSpan,'%',{step:1,min:1,max:30}));
 timing+=cRow('Entrada',cSel('el.sdEnter',[
  ['none','Ya está'],['fade','Fundido'],['up','Desde abajo'],['down','Desde arriba'],['left','Desde izquierda'],['right','Desde derecha'],['zoom','Zoom'],['blur','Desenfoque'],['depth','Profundidad']
 ],e.sdEnter||'fade'));
 timing+=cRow('Salida',cSel('el.sdExit',[
  ['keep','Se queda'],['fade','Fundido'],['up','Hacia arriba'],['down','Hacia abajo'],['left','Hacia izquierda'],['right','Hacia derecha'],['zoom','Zoom'],['blur','Desenfoque']
 ],e.sdExit||'keep'));
 timing+='<h4 class="gsub">Movimiento durante la escena</h4>';
 timing+=cRow('Izquierda / derecha',cNum('el.sdMoveX',e.sdMoveX,'px',{step:10,min:-1600,max:1600}));timing+=cRow('Arriba / abajo',cNum('el.sdMoveY',e.sdMoveY,'px',{step:10,min:-1600,max:1600}));
 timing+=cRow('Giro / tamaño',cNum('el.sdRotate',e.sdRotate,'°',{step:5,min:-720,max:720})+cNum('el.sdScale',e.sdScale,'%',{step:5,min:10,max:500}));
 timing+='<p class="hint gh">En movimiento: − horizontal va a la izquierda y + a la derecha; − vertical va hacia arriba y + hacia abajo. Ejemplo: 20% → 55% hace que empiece cerca del 20% y complete su recorrido alrededor del 55%.</p>';
 if(raw.type==='shape3d'){
  timing+='<p class="hint gh">'+(raw.anchor!==false?'Este objeto 3D está anclado al lienzo: el Director mueve su ancla, así que el objeto Three.js la sigue.':'Este 3D no está anclado al lienzo. Activá su opción de anclaje si querés dirigirlo desde esta línea de tiempo.')+'</p>';
 }
 if(editor)timing=(editor.active(raw)?'':timing)+editor.panel(s,raw);
 return html+grp('el-scroll-director','Momento en la historia',timing);
};

function postScrub(id,p){
 try{preview.contentWindow.postMessage({sc:true,type:'nw-sd-scrub',secId:id,progress:p},'*');}catch(_){}
}
function postLive(id){
 try{preview.contentWindow.postMessage({sc:true,type:'nw-sd-live',secId:id},'*');}catch(_){}
}
function currentProgress(id){
 if(scrubState[id]!=null)return scrubState[id];
 try{var states=preview.contentWindow.__NAG_SCROLL_DIRECTOR;return states&&states[id]?states[id].progress()*100:0;}catch(_){return 0;}
}
function paintPlayhead(id,pct){
 var inp=pane.querySelector('[data-sd-scrub="'+id+'"]'),tl=pane.querySelector('[data-sd-timeline="'+id+'"]');
 if(inp){inp.value=pct;var val=inp.closest('.field').querySelector('[data-sd-val]');if(val)val.textContent=Math.round(pct)+'%';}
 if(tl){tl.style.setProperty('--sd-play',pct+'%');var now=tl.querySelector('[data-story-timeline-now]');if(now)now.textContent=Math.round(pct)+'%';}
}
var pane=document.getElementById('pane');
if(pane){
 pane.addEventListener('change',function(ev){if(!ev.target.matches('[data-motion-source]'))return;var s=sec();snapshot();s.nwMotionSource=ev.target.value==='time'?'time':'scroll';s.sdEnabled=!temporal(s);s.nwMotionDuration=s.nwMotionDuration||8;if(s.nwMotionLoop==null)s.nwMotionLoop=true;if(playRAF){cancelAnimationFrame(playRAF);playRAF=0;}delete scrubState[s.id];saveProject();renderPane();schedulePreview();});
 pane.addEventListener('pointerdown',function(ev){
  var h=ev.target.closest&&ev.target.closest('[data-sd-edge]'),bar0=ev.target.closest&&ev.target.closest('[data-sd-bar]');
  if(!h&&!bar0)return;
  var row=(h||bar0).closest('[data-sd-row]'),track=(h||bar0).closest('.nw-sd-ttrack');if(!row||!track)return;
  var s=sec(),e=(s.elements||[]).find(function(x){return x.id===row.dataset.sdRow;});if(!e)return;
  ev.preventDefault();ev.stopPropagation();elDefaults(e);
  var edge=h&&h.dataset.sdEdge,r=track.getBoundingClientRect(),bar=row.querySelector('.nw-sd-tbar');
  var start0=Math.max(0,Math.min(100,+e.sdStart||0)),end0=Math.max(start0,Math.min(100,+e.sdEnd||82)),dur=end0-start0,x0=ev.clientX;
  var changed=false,cap=h||bar0;try{cap.setPointerCapture(ev.pointerId)}catch(_){}
  function value(clientX){return Math.round(Math.max(0,Math.min(100,(clientX-r.left)/Math.max(1,r.width)*100)));}
  function draw(){var a=Math.max(0,Math.min(100,+e.sdStart||0)),b=Math.max(a,Math.min(100,+e.sdEnd||82));bar.style.left=a+'%';bar.style.width=Math.max(1,b-a)+'%';}
  function move(x){
   if(Math.abs(x-x0)<2&&!changed)return;
   var a=+e.sdStart,b=+e.sdEnd;
   if(edge){var v=value(x);if(edge==='start')a=Math.min(v,Math.max(0,b-1));else b=Math.max(v,Math.min(100,a+1));}
   else {var delta=Math.round((x-x0)/Math.max(1,r.width)*100);a=Math.max(0,Math.min(100-dur,start0+delta));b=a+dur;}
   if(a===+e.sdStart&&b===+e.sdEnd)return;
   if(!changed){snapshot();changed=true;}e.sdStart=a;e.sdEnd=b;
   draw();
  }
  function mv(e2){move(e2.clientX);}
  function up(e2){if(e2.type==='pointercancel'){e.sdStart=start0;e.sdEnd=end0;}else move(e2.clientX);cap.removeEventListener('pointermove',mv);cap.removeEventListener('pointerup',up);cap.removeEventListener('pointercancel',up);if(changed){saveProject();renderPane();schedulePreview();}}
  cap.addEventListener('pointermove',mv);cap.addEventListener('pointerup',up);cap.addEventListener('pointercancel',up);
 });
 pane.addEventListener('input',function(ev){
  var t=ev.target.closest('[data-sd-scrub]');if(!t)return;
  if(playRAF){cancelAnimationFrame(playRAF);playRAF=0;}
  var p=+t.value||0,id=t.dataset.sdScrub;scrubState[id]=p;
  var v=t.closest('.field')&&t.closest('.field').querySelector('[data-sd-val]');if(v)v.textContent=Math.round(p)+'%';
  var tl=document.querySelector('[data-sd-timeline="'+id+'"]');if(tl)tl.style.setProperty('--sd-play',Math.max(0,Math.min(100,p))+'%');
  postScrub(id,p/100);
 });
 pane.addEventListener('click',function(ev){
  var pick=ev.target.closest&&ev.target.closest('[data-sd-select]');
  if(pick){
   var id=pick.dataset.sdSelect,f=typeof findEl==='function'&&findEl(id);if(!f)return;
   curSec=f[0];curEl=f[1];selection=[id];secFocus=false;if(curPane!=='agent')curPane='elements';
   try{if(typeof unfoldTo==='function')unfoldTo(id)}catch(_){}
   renderPane();try{if(typeof syncSelectionToFrame==='function')syncSelectionToFrame()}catch(_){}return;
  }
  var pause=ev.target.closest('[data-sd-pause]');
  if(pause){if(playRAF){cancelAnimationFrame(playRAF);playRAF=0;}var pid=pause.dataset.sdPause,pct=currentProgress(pid);scrubState[pid]=pct;postScrub(pid,pct/100);renderPane();return;}
  var live=ev.target.closest('[data-sd-live]');
  if(live){if(playRAF){cancelAnimationFrame(playRAF);playRAF=0;}delete scrubState[live.dataset.sdLive];postLive(live.dataset.sdLive);renderPane();return;}
  var auto=ev.target.closest('[data-sd-auto]');
  if(auto){
   var s=sec();snapshot();function insideUniversal(e){var guard=0,p=e&&e.parent;while(p&&guard++<30){var host=(s.elements||[]).find(function(x){return x.id===p;});if(!host)return false;if(host.type==='container'&&host.universal)return true;p=host.parent;}return false;}var list=s.elements.filter(function(e){return (!e.parent||insideUniversal(e))&&!(e.type==='container'&&e.universal)&&e.type!=='light3d'&&!e.fixed&&!e.modal&&model.eligible(e,s)&&!model.normalize(e.sdKeyframes).length;});
   var n=Math.max(1,list.length),step=Math.min(22,72/n);
   list.forEach(function(e,i){elDefaults(e);e.sdStart=Math.round(5+i*step);e.sdEnd=Math.min(92,Math.round(e.sdStart+Math.max(18,step*1.35)));e.sdSpan=Math.max(4,Math.min(10,Math.round(step*.45)));e.sdEnter=i%3===0?'up':i%3===1?'fade':'depth';e.sdExit=i===list.length-1?'keep':'fade';});
   saveProject();renderPane();schedulePreview();return;
  }
  var reset=ev.target.closest('[data-sd-reset]');
  if(reset){var ss=sec();snapshot();ss.elements.forEach(function(e){if(e.type==='light3d'||e.fixed||e.modal)return;if(!model.eligible(e,ss))return;elDefaults(e);e.sdKeyframesEnabled=false;e.sdStart=0;e.sdEnd=100;e.sdSpan=6;e.sdEnter='none';e.sdExit='keep';e.sdMoveX=0;e.sdMoveY=0;e.sdRotate=0;e.sdScale=100;});saveProject();renderPane();schedulePreview();return;}
  var play=ev.target.closest('[data-sd-play]');
  if(play){
   if(playRAF)cancelAnimationFrame(playRAF);
   var playScene=window.NAGWEB_STORY_EDITOR?window.NAGWEB_STORY_EDITOR.context(sec(),sec().elements[curEl]):sec();
   var id=play.dataset.sdPlay,start=performance.now(),dur=temporal(playScene)?Math.max(.5,Math.min(120,+playScene.nwMotionDuration||8))*1000:9000;
   function tick(t){var p=Math.min(1,(t-start)/dur),pct=p*100;scrubState[id]=pct;postScrub(id,p);var inp=document.querySelector('[data-sd-scrub="'+id+'"]');if(inp){inp.value=pct;var vv=inp.closest('.field')&&inp.closest('.field').querySelector('[data-sd-val]');if(vv)vv.textContent=Math.round(pct)+'%';}var tl=document.querySelector('[data-sd-timeline="'+id+'"]');if(tl)tl.style.setProperty('--sd-play',pct+'%');if(p<1)playRAF=requestAnimationFrame(tick);else playRAF=0;}
   playRAF=requestAnimationFrame(tick);return;
  }
 });
}
var preview=document.getElementById('preview');
if(preview)preview.addEventListener('load',function(){
 var doc=preview.contentDocument;
 if(doc&&!doc.__nwStoryProgressListening){
  doc.__nwStoryProgressListening=true;
  doc.addEventListener('nw-sd-progress',function(ev){var id=ev.target.getAttribute('data-id');if(scrubState[id]==null)paintPlayhead(id,ev.detail.progress*100);});
 }
 setTimeout(function(){Object.keys(scrubState).forEach(function(id){postScrub(id,(+scrubState[id]||0)/100);});paintPlayhead(sec().id,currentProgress(sec().id));},120);
});

/* ---------- export / preview runtime ---------- */
function rt(DATA,createModel,createStreamModel){
 var model=createModel(),streamModel=createStreamModel(),motion=window.matchMedia('(prefers-reduced-motion:reduce)'),states={},paints=[],clocks=[],clockResets=[],clockRAF=0,busy=0;
 function clockTick(t){clockRAF=0;var active=false;clocks.forEach(function(fn){if(fn(t))active=true;});if(active)clockRAF=requestAnimationFrame(clockTick);}
 function clockStart(){if(!clockRAF&&!document.hidden&&!motion.matches)clockRAF=requestAnimationFrame(clockTick);}
 function req(){if(!busy){busy=1;requestAnimationFrame(function(){busy=0;paints.forEach(function(fn){fn();});});}}
 function streamRenderer(stage,cfg){
  if(!cfg.stream)return null;var params=streamModel.config(cfg.stream),scroll=!cfg.time||!!cfg.streamScroll;if(!scroll)params.turns=1;var slots=(cfg.streamSlots||[]).map(function(id){var node=stage.querySelector('[data-id="'+id+'"]'),img=node&&node.querySelector('img');if(!img)return null;var canvas=document.createElement('canvas');canvas.className='nw-stream-card'+(params.kind==='iso-orbit'?' nw-orbit-card':params.kind==='pop-grid'?' nw-pop-card':params.kind==='grid-reveal'?' nw-reveal-card':params.kind==='zoom-parallax'?' nw-zoom-card':params.kind==='cascade-drop'?' nw-drop-card':params.kind==='wheel-spin'?' nw-spin-card':params.kind==='wheel-carousel'?' nw-wheel-card':params.kind==='photo-orbit'?' nw-photo-card':params.kind==='poster-burst'?' nw-burst-card':params.kind==='deck-peel'?' nw-peel-card':params.kind==='film-strip'?' nw-band-card nw-film-card':params.kind==='card-totem'?' nw-band-card nw-totem-card':params.kind==='spiral-stream'?' nw-spiral-card':params.kind==='focus-shift'?' nw-shift-card':params.kind==='center-stage'?' nw-stage-card':params.kind==='orbit-bloom'?' nw-bloom-card':params.kind==='ticker-tilt'?' nw-ticker-card':params.kind==='ticker-loop'?' nw-ticker-card nw-ticker-loop-card':params.kind==='carousel-flow'?' nw-carousel-card':params.kind==='stack-slide'?' nw-stack-card':params.kind==='iso-focus-sequence'?' nw-focus-card':params.kind==='card-toss'?' nw-toss-card':params.kind==='diagonal-carousel'||params.kind==='iso-cascade'?' nw-diagonal-card':'');canvas.setAttribute('aria-hidden','true');canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';node.appendChild(canvas);node.dataset.nwStreamSlot='';node.querySelectorAll('img').forEach(function(n){n.style.cssText+=';opacity:0!important;visibility:hidden!important;pointer-events:none!important';});img.addEventListener('load',req);return{node:node,img:img,canvas:canvas,texture:null,key:''};}).filter(Boolean);
  if(!slots.length)return null;var host=slots[0].node.offsetParent||stage,bloomCanvas=null,parallax=params.kind==='zoom-parallax',drop=params.kind==='cascade-drop',shift=params.kind==='focus-shift',spiral=params.kind==='spiral-stream',spin=params.kind==='wheel-spin',wheel=spin||params.kind==='wheel-carousel',photo=params.kind==='photo-orbit',burst=params.kind==='poster-burst',peel=params.kind==='deck-peel',band=params.kind==='film-strip'||params.kind==='card-totem',fullImage=parallax||shift||burst,diagonal=params.kind==='diagonal-carousel'||params.kind==='iso-cascade',ticker=wheel||peel||band||spiral||diagonal||params.kind==='ticker-tilt'||params.kind==='ticker-loop'||params.kind==='carousel-flow'||params.kind==='iso-focus-sequence',tickerSelection=null;if(ticker||params.kind==='orbit-bloom'&&Math.abs(params.curve)>3){bloomCanvas=document.createElement('canvas');bloomCanvas.className=ticker?(wheel?(spin?'nw-spin-surface nw-ticker-surface':'nw-wheel-surface nw-ticker-surface'):peel?'nw-peel-surface nw-ticker-surface':band?'nw-band-surface nw-ticker-surface':spiral?'nw-spiral-surface nw-ticker-surface':diagonal?'nw-diagonal-surface':params.kind==='carousel-flow'?'nw-carousel-surface':params.kind==='iso-focus-sequence'?'nw-focus-surface':'nw-ticker-surface'):'nw-bloom-surface';bloomCanvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:'+(slots.length+1);host.appendChild(bloomCanvas);}if(ticker){tickerSelection=document.createElementNS('http://www.w3.org/2000/svg','svg');tickerSelection.setAttribute('aria-hidden','true');tickerSelection.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:'+(slots.length+2);host.appendChild(tickerSelection);slots.forEach(function(q){q.selection=document.createElementNS('http://www.w3.org/2000/svg','path');q.selection.style.cssText='display:none;fill:none;stroke:#b9f36b;stroke-width:2;vector-effect:non-scaling-stroke';q.selection.setAttribute('class','nw-ticker-selection'+(params.kind==='carousel-flow'?' nw-carousel-selection':''));q.node.classList.add('nw-ticker-slot');q.node.__nwTickerSelection=q.selection;tickerSelection.appendChild(q.selection);});}if(cfg.group)stage.classList.add('nw-stream-group');if(window.ResizeObserver)new ResizeObserver(req).observe(host);
  if(params.backgroundType==='none'){host.style.background='transparent';host.style.boxShadow='none';}
  else if(params.backgroundType==='gradient'){host.style.backgroundImage='radial-gradient(ellipse at center,'+params.gradientColor+','+params.backgroundColor+')';host.style.backgroundColor=params.backgroundColor;}
  else if(params.backgroundType==='image'&&cfg.streamBackground){host.style.backgroundImage='url('+JSON.stringify(cfg.streamBackground)+')';host.style.backgroundSize='cover';host.style.backgroundPosition='center';}
  else host.style.backgroundColor=params.backgroundColor;
  (cfg.elements||[]).forEach(function(e){if((cfg.streamSlots||[]).indexOf(e.id)<0){var n=stage.querySelector('[data-id="'+e.id+'"]');if(n)n.style.zIndex=slots.length+10;}});
  return function(progress){
   var w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;var staticReveal=motion.matches&&(params.kind==='grid-reveal'||parallax||drop||shift||spiral||band||peel||burst||photo||wheel),paintProgress=staticReveal?(drop?.72:shift?.75/slots.length:.5)/params.turns:motion.matches?.5:progress,paintScroll=scroll&&!staticReveal,ratio=slots[0].img.naturalWidth/slots[0].img.naturalHeight||1,cards=streamModel.layout(w,h,params,paintProgress,slots.length,ratio,paintScroll),density=Math.min(2,devicePixelRatio||1),bloomStrips=[],bloomShadows=[],tickerTiles=[];if(tickerSelection){tickerSelection.setAttribute('viewBox','0 0 '+w+' '+h);var view=cards[0].clip;tickerSelection.style.clipPath='inset('+view.top+'px '+(w-view.left-view.width)+'px '+(h-view.top-view.height)+'px '+view.left+'px)';}
   cards.forEach(function(card,rank){var q=slots[card.slot],n=q.node,canvas=q.canvas,cw=Math.ceil(card.width*density),ch=Math.ceil(card.height*density);
    n.style.setProperty('left',card.left+'px','important');n.style.setProperty('top',card.top+'px','important');n.style.setProperty('width',card.width+'px','important');n.style.setProperty('height',card.height+'px','important');n.style.setProperty('transform','none','important');n.style.setProperty('overflow','visible','important');if(cfg.edit&&cfg.group)n.style.setProperty('pointer-events','none','important');n.style.borderRadius='0';n.style.background='transparent';n.style.boxShadow='none';n.style.zIndex=rank+1;n.dataset.nwStreamDepth=card.depth.toFixed(6);n.dataset.nwStreamPhase=streamModel.phase(paintProgress,params,paintScroll).toFixed(6);canvas.style.opacity=card.alpha;canvas.style.visibility=bloomCanvas?'hidden':'';
    n.__nwMotionSurface=card.upper.concat(card.lower.slice().reverse());n.__nwMotionVisible=card.alpha>.05&&card.visible!==false;n.__nwMotionInstances=card.instances;n.__nwMotionClip=card.clip;n.__nwMotionRoundClip=burst||photo?{rect:card.rect,radius:card.corner}:null;if(q.selection)q.selection.setAttribute('d',card.instances.map(function(t){return 'M'+t.polygon.map(function(p){return p.x+','+p.y;}).join('L')+'Z';}).join(''));n.__nwMotionStrips=card.stripDepth&&card.stripDepth.map(function(z,i){return{depth:z,polygon:[card.upper[i],card.upper[i+1],card.lower[i+1],card.lower[i]]};});if(photo)n.dataset.nwPhotoAngle=card.angle.toFixed(6);if(burst){n.dataset.nwBurstScale=card.scale.toFixed(6);n.dataset.nwBurstAge=card.age.toFixed(6);}if(shift){n.dataset.nwShiftFocus=card.focus.toFixed(6);n.dataset.nwShiftRail=card.rail;}if(drop){n.dataset.nwDropAngle=card.angle.toFixed(6);n.dataset.nwDropArrival=card.arrival.toFixed(6);}if(parallax){n.dataset.nwZoomScale=card.zoom.toFixed(6);n.dataset.nwZoomPan=card.panX.toFixed(6);}if(params.kind==='pop-grid')n.dataset.nwPopScale=card.scale.toFixed(6);if(params.kind==='grid-reveal'){n.dataset.nwRevealRank=card.revealRank;n.dataset.nwRevealScale=card.scale.toFixed(6);}
    // Hidden sequence cards retain their texture and need no raster work.
    if(card.alpha<=0)return;
    var ctx;if(!bloomCanvas){if(canvas.width!==cw)canvas.width=cw;if(canvas.height!==ch)canvas.height=ch;ctx=canvas.getContext('2d');ctx.setTransform(density,0,0,density,0,0);ctx.clearRect(0,0,card.width,card.height);ctx.translate(-card.left,-card.top);}
    var tw=Math.max(2,Math.round(card.textureWidth*density)),th=Math.max(2,Math.round(card.textureHeight*density)),focus=streamModel.imageFocus((cfg.streamFocus||{})[n.dataset.id]);if((diagonal||params.kind==='ticker-loop'||params.kind==='iso-focus-sequence'||params.kind==='card-toss'||drop||spiral||band||peel||photo||wheel)&&Math.max(tw,th)>2048){var textureScale=2048/Math.max(tw,th);tw=Math.max(2,Math.round(tw*textureScale));th=Math.max(2,Math.round(th*textureScale));}if(fullImage){var fullScale=Math.min(1,2048/Math.max(q.img.naturalWidth||2,q.img.naturalHeight||2));tw=Math.max(2,Math.round((q.img.naturalWidth||2)*fullScale));th=Math.max(2,Math.round((q.img.naturalHeight||2)*fullScale));}var key=q.img.src+':'+tw+':'+th+':'+(fullImage?0:card.corner)+':'+focus.x+':'+focus.y;
    if(q.key!==key&&q.img.complete&&q.img.naturalWidth){q.key=key;q.texture=document.createElement('canvas');q.texture.width=tw;q.texture.height=th;var tx=q.texture.getContext('2d');tx.imageSmoothingQuality='high';if(fullImage)tx.drawImage(q.img,0,0,tw,th);else{tx.beginPath();tx.roundRect(0,0,tw,th,Math.min(tw/2,th/2,diagonal||params.kind==='ticker-loop'||params.kind==='iso-focus-sequence'||params.kind==='card-toss'||drop||spiral||band||peel||photo||wheel?card.corner*tw/card.textureWidth:card.corner*density));tx.clip();var crop=streamModel.imageCrop(q.img.naturalWidth,q.img.naturalHeight,tw,th,focus);tx.drawImage(q.img,crop.x,crop.y,crop.width,crop.height);}}
    if(!q.texture)return;
    if(spiral||band||peel||wheel){card.instances.forEach(function(t){if(params.shadow&&(wheel||peel||band||t.depth>.35))bloomShadows.push(t);for(var bi=0;bi<t.stripDepth.length;bi++)bloomStrips.push({depth:t.stripDepth[bi],alpha:t.alpha,texture:q.texture,tw:tw,th:th,index:bi,steps:t.stripDepth.length,vertical:t.vertical,a:t.upper[bi],b:t.upper[bi+1],d:t.lower[bi]});});return;}
    if(ticker){card.instances.forEach(function(t){tickerTiles.push({surface:t,texture:q.texture,tw:tw,th:th});if(params.shadow&&(params.kind!=='carousel-flow'||t.focus>0))bloomShadows.push(t);});return;}
    if(bloomCanvas){if(params.shadow)bloomShadows.push(card);for(var bi=0;bi<card.stripDepth.length;bi++)bloomStrips.push({depth:card.stripDepth[bi],alpha:card.alpha,texture:q.texture,tw:tw,th:th,index:bi,steps:card.stripDepth.length,a:card.upper[bi],b:card.upper[bi+1],d:card.lower[bi]});return;}
    if(shift||burst||photo){var rect=card.rect,crop=photo?{x:0,y:0,width:rect.width,height:rect.height}:streamModel.imageCrop(tw,th,rect.width,rect.height,focus);ctx.save();ctx.beginPath();ctx.roundRect(rect.left,rect.top,rect.width,rect.height,Math.min(card.corner,rect.width/2,rect.height/2));if(params.shadow){ctx.save();if(burst)ctx.globalAlpha=card.shadowStrength;ctx.fillStyle='#0004';ctx.shadowColor='#0008';ctx.shadowBlur=12;ctx.shadowOffsetY=5;ctx.fill();ctx.restore();}ctx.clip();ctx.drawImage(q.texture,rect.left+crop.x,rect.top+crop.y,crop.width,crop.height);ctx.restore();return;}
    if(drop){ctx.save();ctx.beginPath();ctx.rect(card.clip.left,card.clip.top,card.clip.width,card.clip.height);ctx.clip();}
    if(params.shadow){ctx.save();ctx.fillStyle='#0004';ctx.shadowColor='#0008';ctx.shadowBlur=12;ctx.shadowOffsetY=5;ctx.beginPath();card.upper.forEach(function(p,i){if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});card.lower.slice().reverse().forEach(function(p){ctx.lineTo(p.x,p.y);});ctx.closePath();ctx.fill();ctx.restore();}
    if(parallax){var frame=card.clip,zoomCrop=streamModel.imageZoomCrop(tw,th,frame.width,frame.height,card.zoom,card.panX,focus);ctx.save();ctx.beginPath();ctx.roundRect(frame.left,frame.top,frame.width,frame.height,Math.min(card.corner,frame.width/2,frame.height/2));ctx.clip();ctx.drawImage(q.texture,frame.left+zoomCrop.x,frame.top+zoomCrop.y,zoomCrop.width,zoomCrop.height);ctx.restore();return;}
    function drawSurface(surface){var steps=surface.upper.length-1,strip=tw/steps;ctx.globalAlpha=surface.alpha==null?1:surface.alpha;
    for(var i=0;i<steps;i++){var a=surface.upper[i],b=surface.upper[i+1],d=surface.lower[i],ux=(b.x-a.x)/strip,uy=(b.y-a.y)/strip,vx=(d.x-a.x)/th,vy=(d.y-a.y)/th,overlap=.5*strip/Math.max(1,Math.hypot(b.x-a.x,b.y-a.y));ctx.save();ctx.transform(ux,uy,vx,vy,a.x,a.y);ctx.drawImage(q.texture,i*strip,0,strip,th,i? -overlap:0,0,strip+(i?overlap:0)+(i<steps-1?overlap:0),th);ctx.restore();}}
    (card.trails||[]).forEach(drawSurface);drawSurface({upper:card.upper,lower:card.lower,alpha:1});ctx.globalAlpha=1;if(drop)ctx.restore();
   });
   if(bloomCanvas){var bw=Math.ceil(w*density),bh=Math.ceil(h*density);if(bloomCanvas.width!==bw)bloomCanvas.width=bw;if(bloomCanvas.height!==bh)bloomCanvas.height=bh;var bc=bloomCanvas.getContext('2d');bc.setTransform(density,0,0,density,0,0);bc.clearRect(0,0,w,h);bc.save();if(ticker){var clip=cards[0].clip;bc.beginPath();bc.rect(clip.left,clip.top,clip.width,clip.height);bc.clip();}
    bloomShadows.forEach(function(card){bc.save();bc.globalAlpha=card.alpha==null?1:card.alpha;bc.fillStyle='#0004';bc.shadowColor='#0008';bc.shadowBlur=12;bc.shadowOffsetY=5;bc.beginPath();if(card.rounded){var r=card.rounded;bc.translate(r.cx,r.cy);bc.rotate(r.angle);bc.scale(r.scaleX==null?1:r.scaleX,r.scaleY==null?1:r.scaleY);bc.roundRect(-r.width/2,-r.height/2,r.width,r.height,r.radius);}else{card.upper.concat(card.lower.slice().reverse()).forEach(function(p,i){if(i)bc.lineTo(p.x,p.y);else bc.moveTo(p.x,p.y);});bc.closePath();}bc.fill();bc.restore();});
    // Reuse each image texture across repeated rows and columns.
    if(diagonal||params.kind==='iso-focus-sequence')tickerTiles.sort(function(a,b){return a.surface.depth-b.surface.depth;});
    tickerTiles.forEach(function(q){var surface=q.surface,steps=surface.upper.length-1,strip=q.th/steps;bc.save();bc.globalAlpha=surface.alpha==null?1:surface.alpha;bc.beginPath();surface.polygon.forEach(function(p,i){if(i)bc.lineTo(p.x,p.y);else bc.moveTo(p.x,p.y);});bc.closePath();bc.clip();for(var i=0;i<steps;i++){var a=surface.upper[i],b=surface.lower[i],d=surface.upper[i+1],overlap=.5*strip/Math.max(1,Math.hypot(d.x-a.x,d.y-a.y));bc.save();bc.transform((b.x-a.x)/q.tw,(b.y-a.y)/q.tw,(d.x-a.x)/strip,(d.y-a.y)/strip,a.x,a.y);bc.drawImage(q.texture,0,i*strip,q.tw,strip,0,i?-overlap:0,q.tw,strip+(i?overlap:0)+(i<steps-1?overlap:0));bc.restore();}bc.restore();});
    // Sort curved strips across all petals, so overlapping surfaces retain depth.
    bloomStrips.sort(function(a,b){return a.depth-b.depth;}).forEach(function(q){if(q.vertical){var strip=q.th/q.steps,overlap=.5*strip/Math.max(1,Math.hypot(q.b.x-q.a.x,q.b.y-q.a.y));bc.save();bc.globalAlpha=q.alpha;bc.transform((q.d.x-q.a.x)/q.tw,(q.d.y-q.a.y)/q.tw,(q.b.x-q.a.x)/strip,(q.b.y-q.a.y)/strip,q.a.x,q.a.y);bc.drawImage(q.texture,0,q.index*strip,q.tw,strip,0,q.index?-overlap:0,q.tw,strip+(q.index?overlap:0)+(q.index<q.steps-1?overlap:0));bc.restore();return;}var strip=q.tw/q.steps,overlap=.5*strip/Math.max(1,Math.hypot(q.b.x-q.a.x,q.b.y-q.a.y));bc.save();bc.globalAlpha=q.alpha;bc.transform((q.b.x-q.a.x)/strip,(q.b.y-q.a.y)/strip,(q.d.x-q.a.x)/q.th,(q.d.y-q.a.y)/q.th,q.a.x,q.a.y);bc.drawImage(q.texture,q.index*strip,0,strip,q.th,q.index?-overlap:0,0,strip+(q.index?overlap:0)+(q.index<q.steps-1?overlap:0),q.th);bc.restore();});bc.restore();
   }
  };
 }
 function setup(cfg){
  var sec=document.querySelector((cfg.group?'':'.sc')+'[data-id="'+cfg.id+'"]');if(!sec||sec.classList.contains('horizontal'))return;
  var stage=sec;
  if(!cfg.time&&!cfg.group){
  sec.classList.add('nw-sd-active');sec.style.setProperty('--nw-sd-len',cfg.length+'vh');
  stage=document.createElement('div');stage.className='nw-sd-stage';
  stage.style.alignItems=sec.classList.contains('v-center')?'center':sec.classList.contains('v-bottom')?'flex-end':'flex-start';
  stage.style.justifyContent=sec.classList.contains('a-center')?'center':sec.classList.contains('a-right')?'flex-end':'flex-start';
  while(sec.firstChild)stage.appendChild(sec.firstChild);sec.appendChild(stage);
  }
  var els=[];
  (cfg.elements||[]).forEach(function(c){
   var n=stage.querySelector('[data-id="'+c.id+'"]');if(!n)return;
   // Keep authored opacity/filters readable even when reduced motion is active at boot.
   n.setAttribute('data-nw-sd-base','1');
   var cs=getComputedStyle(n),baseOpacity=parseFloat(cs.opacity),baseFilter=cs.filter&&cs.filter!=='none'?cs.filter:'blur(0px)',basePointer=cs.pointerEvents||'auto';
   n.style.setProperty('--nw-sd-base-opacity',isFinite(baseOpacity)?baseOpacity:1);
   n.style.setProperty('--nw-sd-base-filter',baseFilter);n.setAttribute('data-nw-sd-el','1');
   els.push({n:n,c:c,basePointer:basePointer,depth:null,depthValue:''});
  });
  var ordered=cfg.depthOrder?els.filter(function(q){return q.c.keyframes&&q.c.keyframes.length;}):[];
  var streamPaint=streamRenderer(stage,cfg);
  var manual=cfg.time&&cfg.edit?0:null,last=0,elapsed=0,previous=performance.now();
  function paint(){
   var scrollRoot=cfg.group?sec.closest('.sc'):sec,r=(scrollRoot.__nwStoryLayout||scrollRoot).getBoundingClientRect(),span=Math.max(1,scrollRoot.offsetHeight-innerHeight),timeP=cfg.loop?(elapsed%cfg.duration)/cfg.duration:Math.min(1,elapsed/cfg.duration),p=manual==null?(cfg.time?(motion.matches?.5:timeP):model.clamp(-r.top/span,0,1)):manual;
   last=p;
   if(ordered.length)ordered.slice().sort(function(a,b){return model.evaluate(a.c,p,cfg.ease,motion.matches).z-model.evaluate(b.c,p,cfg.ease,motion.matches).z;}).forEach(function(q,i){q.n.style.zIndex=i+1;});
   els.forEach(function(q){
    var n=q.n,v=model.evaluate(q.c,p,cfg.ease,motion.matches),op=v.opacity/100;
    n.style.setProperty('--nw-sd-x',v.x.toFixed(2)+'px');
    n.style.setProperty('--nw-sd-y',v.y.toFixed(2)+'px');
    n.style.setProperty('--nw-sd-scale',(v.scale/100).toFixed(4));
    n.style.setProperty('--nw-sd-rot',v.rotate.toFixed(2)+'deg');
    n.style.setProperty('--nw-sd-z',v.z.toFixed(2)+'px');
    n.style.setProperty('--nw-sd-rx',v.rotateX.toFixed(2)+'deg');
    n.style.setProperty('--nw-sd-ry',v.rotateY.toFixed(2)+'deg');
    // A paused additive effect renders this evaluated pose. It has no playback
    // clock or interpolation of its own, and keeps authored CSS transforms live.
    var depth=Math.abs(v.z)+Math.abs(v.rotateX)+Math.abs(v.rotateY)>.0001;
    if(!depth){if(q.depth){q.depth.cancel();q.depth=null;}q.depthValue='';}
    else{
     var transform='perspective('+cfg.perspective+'px) translateZ('+v.z.toFixed(3)+'px) rotateX('+v.rotateX.toFixed(3)+'deg) rotateY('+v.rotateY.toFixed(3)+'deg)';
     if(transform!==q.depthValue){
      var keys=[{transform:transform},{transform:transform}];
      if(q.depth)q.depth.effect.setKeyframes(keys);
      else{q.depth=n.animate(keys,{duration:1,fill:'both',composite:'add'});q.depth.pause();q.depth.currentTime=0;}
      q.depthValue=transform;
     }
    }
    n.style.setProperty('--nw-sd-opacity',op.toFixed(4));
    n.style.setProperty('--nw-sd-blur',v.blur.toFixed(2)+'px');
    n.style.pointerEvents=op<.025?'none':q.basePointer;
   });
   if(streamPaint)streamPaint(p);
   sec.style.setProperty('--nw-sd-progress',p.toFixed(4));
   sec.dispatchEvent(new CustomEvent('nw-sd-progress',{bubbles:true,detail:{progress:p,reduced:motion.matches}}));
  }
  states[cfg.id]={set:function(p){manual=model.clamp(+p||0,0,1);paint();},live:function(){manual=null;if(cfg.time){elapsed=0;previous=performance.now();clockStart();}paint();},pause:function(){manual=last;paint();},progress:function(){return last;},update:function(c){var q=els.find(function(q){return q.c.id===c.id;});if(q){q.c=c;paint();}}};
  if(cfg.time)clockResets.push(function(){previous=performance.now();});
  if(cfg.time)clocks.push(function(t){var dt=Math.max(0,t-previous);previous=t;if(motion.matches){paint();return false;}if(document.hidden||manual!=null||(!cfg.loop&&elapsed>=cfg.duration))return false;elapsed+=dt;paint();return cfg.loop||elapsed<cfg.duration;});
  paints.push(paint);paint();
 }
 (DATA||[]).forEach(setup);
 addEventListener('scroll',req,{passive:true});addEventListener('resize',req);
 // Apply accessibility changes immediately; background/offscreen frames may
 // throttle requestAnimationFrame exactly when their motion clock is stopped.
 motion.addEventListener('change',function(){clockResets.forEach(function(fn){fn();});paints.forEach(function(fn){fn();});clockStart();});
 document.addEventListener('visibilitychange',function(){clockResets.forEach(function(fn){fn();});clockStart();});
 addEventListener('message',function(ev){var d=ev.data||{},S=states[d.secId];if(!S||!d.sc||ev.source!==parent)return;if(d.type==='nw-sd-scrub')S.set(d.progress);else if(d.type==='nw-sd-live')S.live();else if(d.type==='nw-sd-update'&&d.element)S.update(d.element);});
 window.__NAG_SCROLL_DIRECTOR=states;
 window.NAGWEB_STORY_MODEL=model;
 clockStart();
}
var SD_CSS=[
'.nw-sd-active{display:block!important;padding:0!important;height:var(--nw-sd-len)!important;min-height:var(--nw-sd-len)!important;position:relative!important}',
'.nw-sd-stage{position:sticky;top:0;width:100%;height:100vh;min-height:100vh;box-sizing:border-box;display:flex;padding:13vh 8vw;overflow:hidden}',
'.nw-sd-active.free .nw-sd-stage{padding:0}',
'.nw-sd-active.free .nw-sd-stage>.inner{position:absolute;inset:0}',
'.nw-uc [data-nw-sd-el],[data-nw-sd-el]{translate:calc(var(--nw-sd-x,0px) + var(--nw-uc-dx,0px)) calc(var(--nw-sd-y,0px) + var(--nw-uc-dy,0px));scale:calc(var(--nw-sd-scale,1) * var(--nw-uc-scale,1));rotate:var(--nw-sd-rot,0deg);opacity:calc(var(--nw-sd-base-opacity,1) * var(--nw-sd-opacity,1))!important;filter:var(--nw-sd-base-filter,blur(0px)) blur(var(--nw-sd-blur,0px));will-change:translate,scale,rotate,opacity,filter}',
'.nw-uc>[data-nw-sd-el]{transition:none!important}',
'.nw-uc [data-nw-sd-el]{transition:none!important}',
'@media(prefers-reduced-motion:reduce){[data-nw-sd-el]{transition:none!important}}'
].join('\n');

var _generateSite=generateSite;
generateSite=function(p,edit,minify,mobile){
 p=Object.assign({},p,{sections:(p.sections||[]).map(function(s){if((!directed(s)&&!(s.elements||[]).some(function(e){return e.nwMotionInstance;}))||s.layout==='horizontal')return s;return Object.assign({},s,{pin:directed(s)?false:s.pin,syncReveal:directed(s)?false:s.syncReveal,elements:(s.elements||[]).map(function(e){return model.eligible(e,s)&&(directed(s)||groupOwner(s,e))?Object.assign({},e,{anim:'none',parallax:0}):e;})});})});
 var html=_generateSite(p,edit,minify,mobile);
 var secs=(p.sections||[]).filter(function(s){return directed(s)&&s.layout!=='horizontal';});

 function streamData(s,c){if(c.template!=='showcase-stream'&&c.template!=='iso-orbit'&&c.template!=='pop-grid'&&c.template!=='center-stage'&&c.template!=='orbit-bloom'&&c.template!=='ticker-tilt'&&c.template!=='ticker-loop'&&c.template!=='carousel-flow'&&c.template!=='stack-slide'&&c.template!=='iso-focus-sequence'&&c.template!=='card-toss'&&c.template!=='diagonal-carousel'&&c.template!=='iso-cascade'&&c.template!=='grid-reveal'&&c.template!=='zoom-parallax'&&c.template!=='cascade-drop'&&c.template!=='focus-shift'&&c.template!=='spiral-stream'&&c.template!=='film-strip'&&c.template!=='card-totem'&&c.template!=='deck-peel'&&c.template!=='poster-burst'&&c.template!=='photo-orbit'&&c.template!=='wheel-carousel'&&c.template!=='wheel-spin')return{};var id=c.stream&&c.stream.backgroundId,a=(p.assets.images||[]).find(function(a){return a.id===id;});return{stream:c.template==='iso-orbit'||c.template==='pop-grid'||c.template==='center-stage'||c.template==='orbit-bloom'||c.template==='ticker-tilt'||c.template==='ticker-loop'||c.template==='carousel-flow'||c.template==='stack-slide'||c.template==='iso-focus-sequence'||c.template==='card-toss'||c.template==='diagonal-carousel'||c.template==='iso-cascade'||c.template==='grid-reveal'||c.template==='zoom-parallax'||c.template==='cascade-drop'||c.template==='focus-shift'||c.template==='spiral-stream'||c.template==='film-strip'||c.template==='card-totem'||c.template==='deck-peel'||c.template==='poster-burst'||c.template==='photo-orbit'||c.template==='wheel-carousel'||c.template==='wheel-spin'?Object.assign({},c.stream,{kind:c.template}):c.stream||{},streamScroll:!!s.nwStreamPreviewScroll,streamBackground:a&&a.data||'',streamFocus:(s.elements||[]).reduce(function(out,e){if(e.nwStreamSlot&&e.nwStreamFocus)out[e.id]=window.NAGWEB_STREAM_MODEL.imageFocus(e.nwStreamFocus);return out;},{}),streamSlots:(s.elements||[]).filter(function(e){return e.nwStreamSlot&&(c.id?groupOwner(s,e)&&groupOwner(s,e).id===c.id:!groupOwner(s,e));}).map(function(e){return e.id;})};}
 var data=secs.map(function(s){return Object.assign({id:s.id,time:temporal(s),edit:!!edit,duration:Math.max(.5,Math.min(120,+s.nwMotionDuration||8))*1000,loop:s.nwMotionLoop!==false,depthOrder:s.sdMotionTemplate==='card-tunnel'||s.sdMotionTemplate==='card-bloom',length:Math.max(140,Math.min(900,+s.sdLength||320)),perspective:Math.max(200,Math.min(5000,+s.sdPerspective||1000)),ease:s.sdEase||'cinematic',elements:(s.elements||[]).filter(function(e){return model.eligible(e,s)&&!groupOwner(s,e);}).map(function(e){return model.compile(e);})},streamData(s,{template:s.sdMotionTemplate,stream:s.nwStream}));});
 (p.sections||[]).forEach(function(s){if(s.layout==='horizontal')return;(s.elements||[]).filter(function(g){return g.nwMotionInstance;}).forEach(function(g){var c=g.nwMotionInstance;data.push(Object.assign({id:g.id,group:true,time:c.source!=='scroll',edit:!!edit,duration:Math.max(.5,Math.min(120,+c.duration||8))*1000,loop:c.loop!==false,depthOrder:c.template==='card-tunnel'||c.template==='card-bloom',perspective:Math.max(200,Math.min(5000,+c.perspective||1000)),ease:s.sdEase||'cinematic',elements:(s.elements||[]).filter(function(e){return e!==g&&groupOwner(s,e)===g&&model.eligible(e,s);}).map(function(e){return model.compile(e);})},streamData(s,Object.assign({id:g.id},c))));});});
 if(!data.length)return html;
 html=html.replace('</head>','<style id="nw-scroll-director-css">'+SD_CSS+'</style></head>');
 html=html.replace('</body>','<script id="nw-scroll-director-runtime">('+rt.toString()+')('+JSON.stringify(data).replace(/</g,'\\u003c')+','+window.NAGWEB_CREATE_STORY_MODEL.toString()+','+window.NAGWEB_CREATE_STREAM_MODEL.toString()+');</script></body>');
 return html;
};


/* ---------- transiciones entre escenas v1 ---------- */
function rtTransitions(DATA){
 function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
 var nodes=new Map(),rows=[],busy=0,motion=matchMedia('(prefers-reduced-motion:reduce)');
 function node(el){
  if(nodes.has(el))return nodes.get(el);
  // The slot measures layout; transforms only affect the scene inside it.
  var slot=document.createElement('div');slot.className='nw-st-slot';el.before(slot);slot.append(el);
  var cs=getComputedStyle(el),opacity=parseFloat(cs.opacity),q={el:el,slot:slot,baseOpacity:isFinite(opacity)?opacity:1,basePointer:cs.pointerEvents,baseRadius:cs.borderRadius};
  el.__nwStoryLayout=slot;el.classList.add('nw-st-visual');
  // Compose the captured authored opacity even when custom CSS or inline styles
  // would otherwise override the transition class (including reduced motion).
  el.style.setProperty('opacity','var(--nw-st-opacity,1)','important');
  nodes.set(el,q);return q;
 }
 (DATA||[]).forEach(function(c){
  var cur=document.querySelector('.sc[data-id="'+c.id+'"]'),next=document.querySelector('.sc[data-id="'+c.next+'"]');
  if(!cur||!next||c.type==='cut')return;
  rows.push({cur:node(cur),next:node(next),c:c});
 });
 if(!rows.length)return;
 document.documentElement.classList.add('nw-st-enabled');
 // Preserve document order for real overlap, including a scene that also exits.
 Array.from(document.querySelectorAll('.nw-st-slot')).forEach(function(el,i){el.style.zIndex=String(i+1);});
 function identity(){return{opacity:1,x:0,y:0,scale:1,radius:0};}
 function paint(){
  busy=0;
  nodes.forEach(function(q){q.rect=q.slot.getBoundingClientRect();q.incoming=identity();q.outgoing=identity();});
  rows.forEach(function(q){
   var span=Math.max(1,innerHeight*clamp(+q.c.span||24,8,60)/100),p=clamp((innerHeight-q.next.rect.top)/span,0,1),a=q.cur.outgoing,b=q.next.incoming;
   if(motion.matches)return;
   // Hold the outgoing view while the next full view covers it. No negative margins,
   // clones or changes to layout length: both references remain stable while painting.
   a.y=clamp(innerHeight-q.cur.rect.bottom,0,innerHeight);
   b.y=-clamp(q.next.rect.top,0,innerHeight);
   if(q.c.type==='fade'){a.opacity=1-p;b.opacity=p;}
   else if(q.c.type==='overlay'){b.opacity=p;}
   else if(q.c.type==='push'){a.x=-p*innerWidth;b.x=(1-p)*innerWidth;}
   else if(q.c.type==='zoom'){a.opacity=1-p*.35;a.scale=1+p*.08;b.opacity=p;b.scale=.86+p*.14;}
   else if(q.c.type==='morph'){a.opacity=1-p;a.scale=1-p*.08;a.radius=p*28;b.opacity=p;b.scale=.92+p*.08;b.radius=(1-p)*28;}
   // A future scene must not cover the currently visible scene at zero progress.
   if(p===0)b.opacity=0;
  });
  nodes.forEach(function(q){
   var a=q.incoming,b=q.outgoing,op=a.opacity*b.opacity;
   q.el.style.setProperty('--nw-st-opacity',String(q.baseOpacity*op));
   q.el.style.setProperty('--nw-st-x',(a.x+b.x).toFixed(3)+'px');
   q.el.style.setProperty('--nw-st-y',(a.y+b.y).toFixed(3)+'px');
   q.el.style.setProperty('--nw-st-scale',(a.scale*b.scale).toFixed(4));
   q.el.style.setProperty('--nw-st-radius',Math.max(a.radius,b.radius)>0?Math.max(a.radius,b.radius).toFixed(2)+'px':q.baseRadius);
   q.el.style.pointerEvents=op<.025?'none':q.basePointer;
  });
 }
 function req(){if(!busy){busy=1;requestAnimationFrame(paint);}}
 addEventListener('scroll',req,{passive:true});addEventListener('resize',req);motion.addEventListener('change',req);paint();
 window.__NAG_SCENE_TRANSITIONS={refresh:paint};
}
var ST_CSS='html.nw-st-enabled{overflow-x:clip}.nw-st-slot{position:relative}.nw-st-visual{opacity:var(--nw-st-opacity,1);translate:var(--nw-st-x,0px) var(--nw-st-y,0px);scale:var(--nw-st-scale,1);border-radius:var(--nw-st-radius,0);overflow:clip;transform-origin:center center;will-change:opacity,translate,scale,border-radius}';
var _generateSiteTransitions=generateSite;
generateSite=function(p,edit,minify,mobile){
 var html=_generateSiteTransitions(p,edit,minify,mobile),ss=p.sections||[],data=[];
 ss.forEach(function(s,i){secDefaults(s);if(i>=ss.length-1||s.stType==='cut'||s.navFixed||ss[i+1].navFixed||s.layout==='horizontal'||ss[i+1].layout==='horizontal')return;data.push({id:s.id,next:ss[i+1].id,type:s.stType,span:Math.max(8,Math.min(60,+s.stSpan||24))});});
 if(!data.length)return html;
 html=html.replace('</head>','<style id="nw-scene-transitions-css">'+ST_CSS+'</style></head>');
 html=html.replace('</body>','<script id="nw-scene-transitions-runtime">('+rtTransitions.toString()+')('+JSON.stringify(data).replace(/</g,'\\u003c')+');</script></body>');
 return html;
};


/* ---------- anclaje DOM -> Three.js v1 ---------- */
function rt3DAnchor(){
 if(window.NAGWEB_3D_ANCHOR&&window.NAGWEB_3D_ANCHOR.version)return;
 var rows=new Map(),seq=0,raf=0,paused=false,motion=matchMedia('(prefers-reduced-motion:reduce)');
 function n(v,d){v=+v;return isFinite(v)?v:d}
 function rad(v){return n(v,0)*Math.PI/180}
 function esc(v){return String(v).replace(/\\/g,'\\\\').replace(/"/g,'\\"')}
 function resolveAnchor(ref){
  if(ref&&ref.nodeType===1)return ref;
  if(typeof ref!=='string'||!ref)return null;
  return document.getElementById(ref)||document.querySelector('[data-id="'+esc(ref)+'"]')||document.querySelector(ref);
 }
 function baseVec(v,d){
  return{x:v&&isFinite(+v.x)?+v.x:d,y:v&&isFinite(+v.y)?+v.y:d,z:v&&isFinite(+v.z)?+v.z:d};
 }
 function setVec(v,x,y,z){
  if(!v)return;
  if(typeof v.set==='function')v.set(x,y,z);
  else{v.x=x;v.y=y;v.z=z}
 }
 function scaleValue(cs){
  var s=cs&&cs.scale;
  if(!s||s==='none')return 1;
  var v=parseFloat(String(s).split(/\s+/)[0]);
  return isFinite(v)&&v!==0?v:1;
 }
 function angleValue(cs){
  var r=cs&&cs.rotate;
  if(!r||r==='none')return 0;
  var m=String(r).match(/(-?\d+(?:\.\d+)?)deg/);
  return m?n(m[1],0):0;
 }
 function viewportRect(b){
  var el=b.o.viewport||(b.o.renderer&&b.o.renderer.domElement);
  if(el&&typeof el.getBoundingClientRect==='function'){
   var r=el.getBoundingClientRect();
   if(r.width&&r.height)return r;
  }
  return{left:0,top:0,width:innerWidth||1,height:innerHeight||1};
 }
 function defaultProject(b,ar,vr,nx,ny){
  var T=window.THREE,cam=b.camera;
  if(!T||!T.Vector3||!cam)return null;
  try{
   if(typeof cam.updateMatrixWorld==='function')cam.updateMatrixWorld();
   var p=new T.Vector3(nx,ny,cam.isOrthographicCamera?0:.5);
   if(typeof p.unproject!=='function')return null;
   p.unproject(cam);
   if(cam.isPerspectiveCamera){
    var origin=new T.Vector3();
    if(typeof cam.getWorldPosition!=='function')return null;
    cam.getWorldPosition(origin);
    p.sub(origin).normalize();
    p=origin.add(p.multiplyScalar(b.distance));
   }
   return{x:p.x,y:p.y,z:p.z};
  }catch(_){return null}
 }
 function update(b){
  var el=b.el,obj=b.object,cam=b.camera;
  if(!el||!el.isConnected||!obj||!cam)return false;
  var ar=el.getBoundingClientRect(),vr=viewportRect(b);
  if(!ar.width&&!ar.height)return true;
  var cx=ar.left+ar.width/2,cy=ar.top+ar.height/2;
  var nx=((cx-vr.left)/Math.max(1,vr.width))*2-1;
  var ny=1-((cy-vr.top)/Math.max(1,vr.height))*2;
  var out=null;
  if(typeof b.o.project==='function'){
   try{out=b.o.project({anchor:el,anchorRect:ar,viewportRect:vr,ndcX:nx,ndcY:ny,camera:cam,object:obj,binding:b})}catch(_){}
  }else out=defaultProject(b,ar,vr,nx,ny);
  if(out&&obj.position){
   setVec(obj.position,n(out.x,0)+n(b.o.x,0),n(out.y,0)+n(b.o.y,0),n(out.z,0)+n(b.o.z,0));
  }
  var cs=null;try{cs=getComputedStyle(el)}catch(_){}
  var layoutW=Math.max(1,el.offsetWidth||b.baseW||1),layoutH=Math.max(1,el.offsetHeight||b.baseH||1);
  var responsive=b.o.followSize===false?1:Math.min(layoutW/Math.max(1,b.baseW),layoutH/Math.max(1,b.baseH));
  var cssScale=b.o.followCssScale===false?1:scaleValue(cs);
  var mul=n(b.o.scale,1)*responsive*cssScale;
  if(obj.scale)setVec(obj.scale,b.baseScale.x*mul,b.baseScale.y*mul,b.baseScale.z*mul);
  if(obj.rotation){
   var rz=b.o.followCssRotation===false?0:angleValue(cs),orbitY=b.orbit&&!motion.matches?((performance.now()-b.started)/1000)*b.orbitSpeed:0;
   setVec(obj.rotation,b.baseRotation.x+rad(b.o.rotationX),b.baseRotation.y+rad(b.o.rotationY+orbitY),b.baseRotation.z+rad(b.o.rotationZ)+rad(rz));
  }
  b.last={anchorRect:ar,viewportRect:vr,ndcX:nx,ndcY:ny,world:out,scale:mul};
  return true;
 }
 function frame(){
  raf=0;if(paused||!rows.size)return;
  rows.forEach(function(b,key){if(!update(b)&&b.o.autoRemove!==false)rows.delete(key)});
  if(rows.size)raf=requestAnimationFrame(frame);
 }
 function kick(){if(!paused&&!raf&&rows.size)raf=requestAnimationFrame(frame)}
 function bind(anchor,object,camera,options){
  var el=resolveAnchor(anchor),o=options||{};
  if(!el)throw new Error('NagWeb 3D Anchor: no se encontró el ancla DOM');
  if(!object||!object.position)throw new Error('NagWeb 3D Anchor: objeto 3D inválido');
  if(!camera)throw new Error('NagWeb 3D Anchor: cámara requerida');
  var r=el.getBoundingClientRect(),dist=n(o.distance,NaN);
  if(!isFinite(dist)){
   try{dist=camera.position&&typeof camera.position.distanceTo==='function'?camera.position.distanceTo(object.position):8}catch(_){dist=8}
  }
  if(!isFinite(dist)||dist<=0)dist=8;
  var id=o.id||('nw3da-'+(++seq));
  var orbit=o.orbit==null?el.getAttribute('data-nw-3d-orbit')==='1':!!o.orbit;
  var orbitSpeed=n(o.orbitSpeed,n(el.getAttribute('data-nw-3d-orbit-speed'),18));
  var b={
   id:id,el:el,object:object,camera:camera,o:o,distance:dist,orbit:orbit,orbitSpeed:orbitSpeed,started:performance.now(),
   baseW:Math.max(1,el.offsetWidth||r.width||1),baseH:Math.max(1,el.offsetHeight||r.height||1),
   baseScale:baseVec(object.scale,1),baseRotation:baseVec(object.rotation,0),last:null
  };
  rows.set(id,b);update(b);kick();
  return{id:id,update:function(){return update(b)},destroy:function(){rows.delete(id);if(!rows.size&&raf){cancelAnimationFrame(raf);raf=0}},snapshot:function(){return b.last}};
 }
 function unbind(ref){
  var id=typeof ref==='string'?ref:ref&&ref.id;
  if(!id)return false;
  var ok=rows.delete(id);if(!rows.size&&raf){cancelAnimationFrame(raf);raf=0}return ok;
 }
 window.NAGWEB_3D_ANCHOR={
  version:'1.0',
  bind:bind,
  unbind:unbind,
  refresh:function(){rows.forEach(function(b){update(b)});kick()},
  pause:function(){paused=true;if(raf){cancelAnimationFrame(raf);raf=0}},
  resume:function(){paused=false;kick()},
  count:function(){return rows.size}
 };
}
rt3DAnchor();

var _generateSite3DAnchor=generateSite;
generateSite=function(p,edit,minify,mobile){
 var html=_generateSite3DAnchor(p,edit,minify,mobile);
 if(html.indexOf('nw-3d-anchor-runtime')>=0)return html;
 html=html.replace('</body>','<script id="nw-3d-anchor-runtime">('+rt3DAnchor.toString()+')();</script></body>');
 return html;
};

try{if(typeof schedulePreview==='function')setTimeout(function(){schedulePreview();},0);}catch(_){}

window.NAGWEB_SCROLL_DIRECTOR={version:'2.0',
 scrub:function(id,p){if(playRAF){cancelAnimationFrame(playRAF);playRAF=0;}p=model.clamp(+p||0,0,1);scrubState[id]=p*100;postScrub(id,p);paintPlayhead(id,p*100);},
 live:function(id){if(playRAF){cancelAnimationFrame(playRAF);playRAF=0;}delete scrubState[id];postLive(id);},
 progress:currentProgress,
 update:function(id,e){try{preview.contentWindow.postMessage({sc:true,type:'nw-sd-update',secId:id,element:model.compile(e)},'*');}catch(_){}},
 evaluate:function(e,p,ease,reduce){return model.evaluate(model.compile(e),p,ease,reduce);}
};
console.info('[NagWeb] Director de Scroll v2.0 activo');
})();
