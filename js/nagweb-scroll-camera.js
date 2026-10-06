/* Optional scene camera. The Director owns progress; this module has no clock. */
(function(){
'use strict';
function createCamera(){
 function number(v){return Number.isFinite(+v)?Math.max(-4000,Math.min(4000,+v)):0;}
 function angle(v){return Number.isFinite(+v)?Math.max(-3600,Math.min(3600,+v)):0;}
 function config(s){
  if(!s.sdCameraEnabled||!s.sdEnabled||s.nwMotionSource==='time'||s.layout==='horizontal')return null;
  return {containers:(s.elements||[]).filter(function(e){return e.type==='container'&&s.layout==='free'&&layerEligible(e,s);}).map(function(e){return e.id;}),layers:(s.elements||[]).filter(function(e){return layerEligible(e,s);}).map(function(e){return {id:e.id,z:number(e.sdCameraDepth)};}),frames:normalize(s.sdCameraFrames),start:{x:number(s.sdCameraStartX),y:number(s.sdCameraStartY),z:number(s.sdCameraStartZ)},end:{x:number(s.sdCameraEndX),y:number(s.sdCameraEndY),z:number(s.sdCameraEndZ)}};
 }
 function layerEligible(e,s){return !!e&&!e.parent&&!e.fixed&&!e.modal&&!e.nwMotionInstance&&['shape3d','light3d','spacer'].indexOf(e.type)<0&&(e.type!=='container'||!!s&&(s.layout==='free'||s.layout!=='horizontal'&&!!e.stackDir));}
 function layer(c,id){return c&&(c.layers||[]).find(function(l){return l.id===id;})||null;}
 function layerPose(v,l,reduced){return Object.assign({},v,{z:v.z+(l&&!reduced?number(l.z):0)});}
 function layerTransform(v,perspective,shared){
  return (shared?'':'perspective('+perspective+'px) ')+'translateZ('+v.z.toFixed(3)+'px) rotateX('+v.rotateX.toFixed(3)+'deg) rotateY('+v.rotateY.toFixed(3)+'deg)';
 }
 function normalize(input){
  var out=[];
  (Array.isArray(input)?input:[]).filter(function(k){return k&&Number.isFinite(+k.at);}).slice(0,128).sort(function(a,b){return +a.at-+b.at;}).forEach(function(k){
   var frame={at:Math.round(Math.max(0,Math.min(100,+k.at))*10)/10,x:number(k.x),y:number(k.y),z:number(k.z),rotateX:angle(k.rotateX),rotateY:angle(k.rotateY),rotate:angle(k.rotate)};
   if(['linear','smooth','cinematic','ease-in','ease-out','ease-in-out'].indexOf(k.ease)>=0)frame.ease=k.ease;
   if(out.length&&out[out.length-1].at===frame.at)out.pop();out.push(frame);
  });return out;
 }
 function frames(c,ease){
  return c.frames&&c.frames.length?normalize(c.frames):normalize([{at:0,x:c.start.x,y:c.start.y,z:c.start.z,ease:ease},{at:100,x:c.end.x,y:c.end.y,z:c.end.z}]);
 }
 function compile(c,model,ease){
  var list=frames(c,ease);return {keyframes:model.normalize(list.map(function(k){return Object.assign({},k,{ease:k.ease||ease||'cinematic'});} ))};
 }
 function pose(c,p,model,ease,reduced,compiled){
  var pose=model.evaluate(compiled||compile(c,model,ease),p,ease,reduced);return {x:pose.x,y:pose.y,z:pose.z,rotateX:pose.rotateX,rotateY:pose.rotateY,rotate:pose.rotate};
 }
 function transform(v){
  // Inverse of camera T(x,y,-z) * Rx(pitch) * Ry(yaw) * Rz(roll).
  var rx=angle(v.rotateX),ry=angle(v.rotateY),rz=angle(v.rotate);
  return (rz?'rotateZ('+(-rz)+'deg) ':'')+(ry?'rotateY('+(-ry)+'deg) ':'')+(rx?'rotateX('+(-rx)+'deg) ':'')+'translate3d('+(-number(v.x))+'px,'+(-number(v.y))+'px,'+number(v.z)+'px)';
 }
 function copyFrame(input,from,to){
  var list=normalize(input),key=list.find(function(k){return k.at===from;});
  if(!key||!Number.isFinite(+to))return {error:'Elegí un encuadre y un momento válidos.'};
  to=Math.round(Math.max(0,Math.min(100,+to))*10)/10;
  if(list.length>=128)return {error:'Máximo: 128 encuadres de cámara.'};
  if(list.some(function(k){return k.at===to;}))return {error:'Ya existe un encuadre en ese momento. Mové el indicador a un lugar libre.'};
  list.push(Object.assign({},key,{at:to}));return {frames:normalize(list),at:to};
 }
 function holdFrame(input,from,duration){
  var list=normalize(input),next=list.find(function(k){return k.at>from;});
  if(!Number.isFinite(+duration)||+duration<=0)return {error:'La permanencia debe ser mayor que cero.'};
  var to=Math.round((from+(+duration))*10)/10;
  if(to>100||next&&to>=next.at)return {error:'La permanencia debe terminar antes del siguiente encuadre y dentro del recorrido.'};
  return copyFrame(list,from,to);
 }
 function preset(name,perspective){
  var d=Math.min(240,Math.max(200,Number.isFinite(+perspective)?+perspective:1000)/4),list;
  if(name==='approach')list=[{at:0,z:-d},{at:70,z:d*.5},{at:100,z:d*.5}];
  else if(name==='lateral')list=[{at:0,x:-220},{at:50,x:0},{at:100,x:220}];
  else if(name==='rise')list=[{at:0,y:180,z:-d*.5},{at:60,y:-120,z:0},{at:100,y:-120,z:0}];
  else if(name==='tour')list=[{at:0,x:-180,z:-d*.5,rotateY:-8},{at:40,x:0,z:d*.3},{at:65,x:0,z:d*.3},{at:100,x:180,z:-d*.5,rotateY:8}];
  else return null;
  return normalize(list.map(function(k){return Object.assign({ease:'smooth'},k);}));
 }
 function mapSpec(list,plane){
  var axis=plane==='front'?'y':'z',range=500;
  list.forEach(function(k){range=Math.max(range,Math.abs(number(k.x))*1.2,Math.abs(number(k[axis]))*1.2);});
  return {axis:axis,sign:axis==='z'?-1:1,range:range};
 }
 function mapPoint(k,spec){return {x:50+number(k.x)/spec.range*50,y:50+number(k[spec.axis])/spec.range*50*spec.sign};}
 function moveSpatial(k,spec,dx,dy){var copy=Object.assign({},k);copy.x=number(Math.round(k.x+dx*spec.range*2));copy[spec.axis]=number(Math.round(k[spec.axis]+dy*spec.range*2*spec.sign));return copy;}
 function attach(stage,c,perspective){
  if(!c)return null;
  var world=Array.from(stage.children).find(function(n){return n.classList.contains('inner');});
  if(!world)return null;
  // Free-layout containers are generated beside .inner. Both use the full
  // viewport box, so reparenting the eligible roots retains percentage geometry.
  // Keep their children intact: camera motion is applied exactly once to the world.
  var containers=c.containers||[];
  if(containers.length)Array.from(stage.children).forEach(function(n){
   if(n!==world&&n.classList.contains('container-box')&&containers.indexOf(n.getAttribute('data-id'))>=0)world.appendChild(n);
  });
  stage.style.perspective=perspective+'px';stage.style.perspectiveOrigin='50% 50%';
  world.style.transformStyle='preserve-3d';world.setAttribute('data-nw-camera-world','');
  var animation=null,last='';
  return function(v){
   // Camera translation is the inverse world translation. Positive Z travels forward.
   var value=transform(v);
   if(value===last)return;last=value;
   if(!v.x&&!v.y&&!v.z&&!v.rotateX&&!v.rotateY&&!v.rotate){if(animation)animation.cancel();animation=null;return;}
   var frames=[{transform:value},{transform:value}];
   if(animation)animation.effect.setKeyframes(frames);
   else{animation=world.animate(frames,{duration:1,fill:'both',composite:'add'});animation.pause();animation.currentTime=0;}
  };
 }
 return {config:config,compile:compile,pose:pose,attach:attach,normalize:normalize,frames:frames,transform:transform,layerEligible:layerEligible,layer:layer,layerPose:layerPose,layerTransform:layerTransform,mapSpec:mapSpec,mapPoint:mapPoint,moveSpatial:moveSpatial,copyFrame:copyFrame,holdFrame:holdFrame,preset:preset};
}
window.NAGWEB_CREATE_SCROLL_CAMERA=createCamera;
window.NAGWEB_SCROLL_CAMERA=createCamera();
var presetChoices=Object.create(null),holdDurations=Object.create(null),mapOpen=Object.create(null),mapPlanes=Object.create(null),suppressedClick=null,selected=Object.create(null),C=window.NAGWEB_SCROLL_CAMERA;
function keys(s){return C.frames(C.config(s),s.sdEase);}
function progress(s){return window.NAGWEB_SCROLL_DIRECTOR?window.NAGWEB_SCROLL_DIRECTOR.progress(s.id):0;}
function choose(s,list){var at=selected[s.id],k=list.find(function(k){return k.at===at;});return k||list[0];}
function jump(s,at){selected[s.id]=at;window.NAGWEB_SCROLL_DIRECTOR.scrub(s.id,at/100);renderPane();}
function persist(s,list,at){s.sdCameraFrames=C.normalize(list);selected[s.id]=at;saveProject();renderPane();schedulePreview();window.NAGWEB_SCROLL_DIRECTOR.scrub(s.id,at/100);}
C.elementPanel=function(s,e){
 if(!C.config(s)||!C.layerEligible(e,s))return '';
 var z=C.layer(C.config(s),e.id);z=z?z.z:0;
 return (e.type==='container'?'<p class="hint gh">Este plano mueve el contenedor completo con sus elementos internos.</p>':'')+'<h4 class="gsub">Plano en la escena de cámara</h4>'+cRow('Profundidad fija (px)','<input type="number" class="cnum" aria-label="Profundidad fija del elemento" data-camera-depth value="'+z+'" min="-4000" max="4000" step="25">')+'<p class="hint gh">Negativo: más lejos · 0: plano original · Positivo: más cerca. Se suma a la animación de profundidad. Al desactivar la cámara se conserva este ajuste.</p>';
};
function mapCurrent(s,pct){
 var reduced=typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;
 return C.pose(C.config(s),pct/100,window.NAGWEB_STORY_MODEL,s.sdEase,reduced);
}
function mapLabel(v,pct){return 'Ahora: '+Math.round(pct*10)/10+'% · X '+Math.round(v.x)+' · Y '+Math.round(v.y)+' · Z '+Math.round(v.z);}
function mapDraw(map,list,spec){
 if(!map.querySelector)return;
 var path=map.querySelector('[data-camera-map-path]');
 if(path)path.setAttribute('points',list.map(function(k){var p=C.mapPoint(k,spec);return p.x+','+p.y;}).join(' '));
 list.forEach(function(k){var dot=map.querySelector('[data-camera-map-dot="'+k.at+'"]'),p=C.mapPoint(k,spec);if(dot){dot.setAttribute('cx',p.x);dot.setAttribute('cy',p.y);}});
}
function spatialMap(s,list,k){
 var plane=mapPlanes[s.id]||'top',spec=C.mapSpec(list,plane),point=C.mapPoint(k,spec),current=mapCurrent(s,progress(s)),now=C.mapPoint(current,spec);
 var path=list.map(function(f){var p=C.mapPoint(f,spec);return p.x+','+p.y;}).join(' ');
 var html='<details data-camera-map-box'+(mapOpen[s.id]?' open':'')+'><summary style="cursor:pointer;margin:8px 0">Mapa del recorrido</summary><label>Vista <select class="csel" data-camera-map-plane><option value="top"'+(plane==='top'?' selected':'')+'>Desde arriba · X/Z</option><option value="front"'+(plane==='front'?' selected':'')+'>De frente · X/Y</option></select></label>';
 html+='<div data-camera-map data-plane="'+plane+'" data-range="'+spec.range+'" style="position:relative;width:100%;aspect-ratio:1.5;border:1px solid var(--line);margin-top:8px;touch-action:none">';
 html+='<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"><path d="M50 0V100M0 50H100" stroke="currentColor" opacity=".2" stroke-width=".5"/><polyline data-camera-map-path points="'+path+'" fill="none" stroke="currentColor" opacity=".65" stroke-width=".7"/>';
 list.forEach(function(f){var p=C.mapPoint(f,spec);html+='<circle data-camera-map-dot="'+f.at+'" cx="'+p.x+'" cy="'+p.y+'" r="1.5" fill="currentColor"/>';});
 html+='<circle data-camera-position cx="'+now.x+'" cy="'+now.y+'" r="3" fill="none" stroke="var(--accent)" stroke-width="1"/>';
 html+='</svg><button type="button" class="btn tiny" data-camera-map-point="'+k.at+'" aria-label="Mover encuadre '+k.at+'% en el mapa" style="position:absolute;left:'+point.x+'%;top:'+point.y+'%;transform:translate(-50%,-50%);touch-action:none;padding:3px;outline:2px solid var(--accent)">◆</button></div>';
 html+='<p class="hint gh" data-camera-position-label>'+mapLabel(current,progress(s))+'</p>';
 html+='<p class="hint gh">◆ encuadre seleccionado · ○ posición actual. Arrastrá el punto seleccionado. Horizontal: X. Vertical: '+(spec.axis==='z'?'Z (arriba = adelante)':'Y (abajo = abajo)')+'. Flechas: 25 px; Shift: 100 px. Escala: ±'+Math.round(spec.range)+' px. Elegí otro encuadre en la pista.</p></details>';
 return html;
}
C.panel=function(s){
 var html=cRow('Cámara 3D',cSeg('sec.sdCameraEnabled',!!s.sdCameraEnabled,[['false','Desactivada'],['true','Activada']],'bool'));
 if(!s.sdCameraEnabled||!C.config(s))return html;
 var list=keys(s),k=choose(s,list);
 html+='<p class="hint gh">Elegí un encuadre para editarlo. +X: derecha · +Y: abajo · +Z: adelante. Desactivar conserva el recorrido.</p>';
 html+='<div class="nw-camera-timeline" style="margin:10px 8px"><div role="group" aria-label="Encuadres de cámara" data-camera-track style="position:relative;height:32px;border-bottom:2px solid var(--line);touch-action:none">';
 html+='<i data-camera-head style="position:absolute;top:0;bottom:0;width:2px;background:var(--accent);pointer-events:none;left:'+progress(s)+'%"></i>';
 list.forEach(function(f){html+='<button type="button" class="btn tiny" data-camera-jump="'+f.at+'" aria-label="Encuadre de cámara en '+f.at+' por ciento" title="Arrastrá para cambiar el momento" aria-pressed="'+(f.at===k.at)+'" style="position:absolute;left:'+f.at+'%;top:3px;transform:translateX(-50%);padding:3px;min-width:20px;touch-action:none;'+(f.at===k.at?'outline:2px solid var(--accent)':'')+'">◆</button>';});
 html+='</div><input type="range" aria-label="Recorrer cámara" data-camera-seek min="0" max="100" step="0.1" value="'+progress(s)+'" style="width:100%;margin:4px 0"><div style="display:flex;justify-content:space-between;font-size:10px"><span>0%</span><span>50%</span><span>100%</span></div></div><button type="button" class="btn tiny" data-camera-add>Agregar encuadre aquí</button>';
 html+='<p class="hint gh">Clic en la pista: recorrer · Arrastrar punto: mover encuadre. Flechas: 1%; Shift: 10%. Escape cancela el arrastre.</p>';
 function field(label,key,value,min,max,step){return cRow(label,'<input class="cnum" type="number" aria-label="'+label+'" data-camera-field="'+key+'" data-camera-at="'+k.at+'" value="'+value+'" min="'+min+'" max="'+max+'" step="'+step+'">');}
 html+='<details><summary style="cursor:pointer;margin:8px 0">Pausas y recorridos rápidos</summary><button type="button" class="btn tiny" data-camera-copy>Copiar encuadre al momento actual</button><p class="hint gh">Copiá este encuadre en el porcentaje elegido con la barra de progreso.</p>';
 html+=cRow('Permanencia (%)','<input class="cnum" type="number" data-camera-hold-duration aria-label="Duración de la permanencia" min="0.1" max="100" step="1" value="'+(holdDurations[s.id]||10)+'">')+'<button type="button" class="btn tiny" data-camera-hold>Mantener este encuadre</button>';
 html+=cRow('Recorrido','<select class="csel" data-camera-preset-choice aria-label="Recorrido de cámara">'+[['approach','Acercamiento con pausa'],['lateral','Viaje lateral'],['rise','Ascenso y descanso'],['tour','Visita con profundidad']].map(function(p){return '<option value="'+p[0]+'"'+((presetChoices[s.id]||'approach')===p[0]?' selected':'')+'>'+p[1]+'</option>';}).join('')+'</select>')+'<button type="button" class="btn tiny" data-camera-preset>Aplicar recorrido</button><p class="hint gh">Reemplaza los encuadres de cámara. Podés recuperarlos con Deshacer. Los elementos conservan su diseño y sus animaciones.</p></details>';
 html+=spatialMap(s,list,k);
 html+=field('Momento (%)','at',k.at,0,100,.1);
 ['x','y','z'].forEach(function(axis){html+=field('Cámara '+axis.toUpperCase(),axis,k[axis],-4000,4000,25);});
 [['rotateX','Inclinar arriba / abajo (°)'],['rotateY','Mirar izquierda / derecha (°)'],['rotate','Girar el horizonte (°)']].forEach(function(axis){html+=field(axis[1],axis[0],k[axis[0]],-3600,3600,5);});
 html+='<p class="hint gh">Los ángulos se recorren tal como los escribís: 0° → 360° da una vuelta completa.</p>';
 html+=cRow('Movimiento hacia el siguiente','<select class="csel" aria-label="Movimiento de cámara" data-camera-field="ease" data-camera-at="'+k.at+'">'+[['linear','Directo'],['smooth','Suave'],['cinematic','Cinemático'],['ease-in','Acelerar'],['ease-out','Frenar'],['ease-in-out','Acelerar y frenar']].map(function(e){return '<option value="'+e[0]+'"'+((k.ease||s.sdEase||'cinematic')===e[0]?' selected':'')+'>'+e[1]+'</option>';}).join('')+'</select>');
 html+='<button type="button" class="btn tiny" data-camera-delete="'+k.at+'"'+(list.length<=2?' disabled':'')+'>Eliminar encuadre</button>';
 return html;
};
C.paint=function(pct){
 var pane=document.getElementById('pane');if(!pane)return;
 var head=pane.querySelector('[data-camera-head]'),seek=pane.querySelector('[data-camera-seek]');
 if(head)head.style.left=pct+'%';if(seek)seek.value=pct;
 var map=pane.querySelector('[data-camera-map]'),s=sec();
 if(map&&C.config(s)){
  var spec={range:+map.dataset.range,axis:map.dataset.plane==='front'?'y':'z',sign:map.dataset.plane==='front'?1:-1},v=mapCurrent(s,pct),p=C.mapPoint(v,spec),dot=map.querySelector('[data-camera-position]'),label=pane.querySelector('[data-camera-position-label]');
  if(dot){dot.setAttribute('cx',p.x);dot.setAttribute('cy',p.y);}if(label)label.textContent=mapLabel(v,pct);
 }
};
function retime(s,from,to){
 var list=keys(s),k=list.find(function(k){return k.at===from;});
 to=Math.round(Math.max(0,Math.min(100,to))*10)/10;
 if(!k||to===from)return false;
 if(list.some(function(f){return f!==k&&f.at===to;})){toast('Ya existe un encuadre en ese momento.');return false;}
 snapshot();k.at=to;persist(s,list,to);return true;
}
function spatialCommit(s,original,next){
 if(sec()!==s||!C.config(s))return false;
 var list=keys(s),i=list.findIndex(function(k){return k.at===original.at;});
 if(i<0||list[i].x===next.x&&list[i].y===next.y&&list[i].z===next.z)return false;
 snapshot();list[i]=next;persist(s,list,next.at);return true;
}
function spatialDrag(ev,button){
 var s=sec();if(!C.config(s))return;
 var map=button.closest('[data-camera-map]'),r=map.getBoundingClientRect(),list=keys(s),original=list.find(function(k){return k.at===+button.dataset.cameraMapPoint;});
 if(!original||!r.width||!r.height)return;
 var spec={range:+map.dataset.range,axis:map.dataset.plane==='front'?'y':'z',sign:map.dataset.plane==='front'?1:-1},next=original,done=false;
 ev.preventDefault();button.focus();button.setPointerCapture(ev.pointerId);
 function move(e){if(e.pointerId!==ev.pointerId)return;next=C.moveSpatial(original,spec,(e.clientX-ev.clientX)/r.width,(e.clientY-ev.clientY)/r.height);var p=C.mapPoint(next,spec);button.style.left=p.x+'%';button.style.top=p.y+'%';mapDraw(map,list.map(function(k){return k.at===original.at?next:k;}),spec);}
 function finish(e,cancel){
  if(done||e.pointerId!=null&&e.pointerId!==ev.pointerId)return;done=true;
  if(!cancel&&e.clientX!=null)move(e);
  button.removeEventListener('pointermove',move);button.removeEventListener('pointerup',up);button.removeEventListener('pointercancel',abort);button.removeEventListener('lostpointercapture',abort);button.removeEventListener('keydown',key);
  if(button.hasPointerCapture(ev.pointerId))button.releasePointerCapture(ev.pointerId);
  if(cancel||!spatialCommit(s,original,next)){var p=C.mapPoint(original,spec);button.style.left=p.x+'%';button.style.top=p.y+'%';mapDraw(map,list,spec);}
 }
 function up(e){finish(e,false);}function abort(e){finish(e,true);}function key(e){if(e.key==='Escape'){e.preventDefault();e.stopPropagation();finish(e,true);}}
 button.addEventListener('pointermove',move);button.addEventListener('pointerup',up);button.addEventListener('pointercancel',abort);button.addEventListener('lostpointercapture',abort);button.addEventListener('keydown',key);
}
function spatialKey(ev,button){
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].indexOf(ev.key)<0)return;
 var s=sec();if(!C.config(s))return;var map=button.closest('[data-camera-map]'),spec={axis:map.dataset.plane==='front'?'y':'z',sign:map.dataset.plane==='front'?1:-1,range:500};
 var k=keys(s).find(function(k){return k.at===+button.dataset.cameraMapPoint;});if(!k)return;
 ev.preventDefault();ev.stopPropagation();var step=(ev.shiftKey?100:25)/1000,dx=ev.key==='ArrowRight'?step:ev.key==='ArrowLeft'?-step:0,dy=ev.key==='ArrowDown'?step:ev.key==='ArrowUp'?-step:0;
 if(spatialCommit(s,k,C.moveSpatial(k,spec,dx,dy))){var n=document.getElementById('pane').querySelector('[data-camera-map-point]');if(n)n.focus();}
}
var pane=document.getElementById('pane');
if(pane){
 pane.addEventListener('toggle',function(ev){if(ev.target.matches('[data-camera-map-box]'))mapOpen[sec().id]=ev.target.open;},true);
 pane.addEventListener('input',function(ev){
  if(!ev.target.matches('[data-camera-seek]'))return;
  var s=sec();if(C.config(s))window.NAGWEB_SCROLL_DIRECTOR.scrub(s.id,+ev.target.value/100);
 });
 pane.addEventListener('pointerdown',function(ev){
  if(ev.button!==0)return;
  var spatial=ev.target.closest('[data-camera-map-point]');if(spatial){spatialDrag(ev,spatial);return;}
  var track=ev.target.closest('[data-camera-track]');if(!track)return;
  var s=sec();if(!C.config(s))return;
  var button=ev.target.closest('[data-camera-jump]'),rect=track.getBoundingClientRect();
  if(!rect.width)return;
  function at(x){return Math.round(Math.max(0,Math.min(100,(x-rect.left)/rect.width*100))*10)/10;}
  if(!button){window.NAGWEB_SCROLL_DIRECTOR.scrub(s.id,at(ev.clientX)/100);return;}
  ev.preventDefault();button.focus();suppressedClick=null;
  var from=+button.dataset.cameraJump,start=ev.clientX,to=from,moved=false,done=false;
  function move(e){if(e.pointerId!==ev.pointerId)return;if(Math.abs(e.clientX-start)<3&&!moved)return;moved=true;to=Math.round(Math.max(0,Math.min(100,from+(e.clientX-start)/rect.width*100))*10)/10;button.style.left=to+'%';button.title=to+'%';}
  function finish(e,cancel){
   if(done||e.pointerId!=null&&e.pointerId!==ev.pointerId)return;done=true;
   if(!cancel&&e.clientX!=null)move(e);
   button.removeEventListener('pointermove',move);button.removeEventListener('pointerup',up);button.removeEventListener('pointercancel',abort);button.removeEventListener('lostpointercapture',abort);button.removeEventListener('keydown',key);
   if(button.hasPointerCapture(ev.pointerId))button.releasePointerCapture(ev.pointerId);
   if(moved){suppressedClick=button;if(cancel||sec()!==s||!retime(s,from,to)){button.style.left=from+'%';button.title='Arrastrá para cambiar el momento';}}
  }
  function up(e){finish(e,false);}function abort(e){finish(e,true);}function key(e){if(e.key==='Escape'){e.preventDefault();e.stopPropagation();finish(e,true);}}
  button.setPointerCapture(ev.pointerId);button.addEventListener('pointermove',move);button.addEventListener('pointerup',up);button.addEventListener('pointercancel',abort);button.addEventListener('lostpointercapture',abort);button.addEventListener('keydown',key);
 });
 pane.addEventListener('keydown',function(ev){
  var spatial=ev.target.closest('[data-camera-map-point]');if(spatial){spatialKey(ev,spatial);return;}
  var button=ev.target.closest('[data-camera-jump]');if(!button||['ArrowLeft','ArrowRight'].indexOf(ev.key)<0)return;
  var s=sec();if(!C.config(s))return;ev.preventDefault();ev.stopPropagation();
  var from=+button.dataset.cameraJump,to=Math.round(Math.max(0,Math.min(100,from+(ev.key==='ArrowLeft'?-1:1)*(ev.shiftKey?10:1)))*10)/10;
  if(retime(s,from,to)){var next=pane.querySelector('[data-camera-jump="'+to+'"]');if(next)next.focus();}
 });
 pane.addEventListener('click',function(ev){
  var button=ev.target.closest('[data-camera-jump],[data-camera-add],[data-camera-delete],[data-camera-copy],[data-camera-hold],[data-camera-preset]');if(!button)return;
  if(button===suppressedClick){suppressedClick=null;return;}
  var s=sec();if(!C.config(s))return;var list=keys(s);
  if(button.dataset.cameraCopy!==undefined||button.dataset.cameraHold!==undefined){
   var k=choose(s,list),result=button.dataset.cameraCopy!==undefined?C.copyFrame(list,k.at,progress(s)):C.holdFrame(list,k.at,holdDurations[s.id]||10);
   if(result.error){toast(result.error);return;}snapshot();persist(s,result.frames,result.at);return;
  }
  if(button.dataset.cameraPreset!==undefined){
   var frames=C.preset(presetChoices[s.id]||'approach',s.sdPerspective);if(!frames)return;
   snapshot();persist(s,frames,0);toast('Recorrido aplicado. Cada encuadre sigue siendo editable.');return;
  }
  if(button.hasAttribute('data-camera-jump')){jump(s,+button.dataset.cameraJump);return;}
  if(button.hasAttribute('data-camera-add')){
   var at=Math.round(progress(s)*10)/10;
   if(list.some(function(k){return k.at===at;})){jump(s,at);return;}
   if(list.length>=128){toast('Máximo: 128 encuadres de cámara.');return;}
   var v=C.pose(C.config(s),at/100,window.NAGWEB_STORY_MODEL,s.sdEase,false);
   snapshot();list.push(Object.assign({at:at,ease:s.sdEase||'cinematic'},v));persist(s,list,at);return;
  }
  if(list.length<=2)return;
  snapshot();list=list.filter(function(k){return k.at!==+button.dataset.cameraDelete;});persist(s,list,list[0].at);
 });
 pane.addEventListener('change',function(ev){
  var input=ev.target;
  if(input.dataset.cameraPresetChoice!==undefined){presetChoices[sec().id]=input.value;return;}
  if(input.dataset.cameraHoldDuration!==undefined){if(Number.isFinite(+input.value)&&+input.value>0)holdDurations[sec().id]=Math.min(100,+input.value);else{input.value=holdDurations[sec().id]||10;toast('Ingresá una duración mayor que cero.');}return;}
  if(input.dataset.cameraMapPlane!==undefined){mapPlanes[sec().id]=input.value==='front'?'front':'top';renderPane();return;}
  if(input.dataset.cameraDepth!==undefined){
   var scene=sec(),element=scene.elements[curEl];
   if(!C.config(scene)||!C.layerEligible(element,scene)||selection.length!==1)return;
   if(input.value===''||!Number.isFinite(+input.value)){renderPane();return;}
   var depth=Math.max(-4000,Math.min(4000,+input.value));if((+element.sdCameraDepth||0)===depth)return;
   snapshot();element.sdCameraDepth=depth;saveProject();renderPane();schedulePreview();return;
  }
  if(!input.matches('[data-camera-field]'))return;
  var s=sec();if(!C.config(s))return;var list=keys(s),k=list.find(function(k){return k.at===+input.dataset.cameraAt;}),field=input.dataset.cameraField;
  if(!k)return;var value=field==='ease'?input.value:+input.value;
  if(field!=='ease'&&(!Number.isFinite(value)||input.value==='')){renderPane();return;}
  if(field==='at'){value=Math.round(Math.max(0,Math.min(100,value))*10)/10;if(list.some(function(f){return f!==k&&f.at===value;})){toast('Ya existe un encuadre en ese momento.');renderPane();return;}}
  if(k[field]===value)return;snapshot();k[field]=value;persist(s,list,k.at);
 });
}
})();
