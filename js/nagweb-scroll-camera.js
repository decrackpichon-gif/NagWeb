/* Optional scene camera. The Director owns progress; this module has no clock. */
(function(){
'use strict';
function createCamera(){
 function number(v){return Number.isFinite(+v)?Math.max(-4000,Math.min(4000,+v)):0;}
 function angle(v){return Number.isFinite(+v)?Math.max(-3600,Math.min(3600,+v)):0;}
 function config(s){
  if(!s.sdCameraEnabled||!s.sdEnabled||s.nwMotionSource==='time')return null;
  return {frames:normalize(s.sdCameraFrames),start:{x:number(s.sdCameraStartX),y:number(s.sdCameraStartY),z:number(s.sdCameraStartZ)},end:{x:number(s.sdCameraEndX),y:number(s.sdCameraEndY),z:number(s.sdCameraEndZ)}};
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
 function pose(c,p,model,ease,reduced){
  var list=frames(c,ease),compiled={keyframes:model.normalize(list.map(function(k){return Object.assign({},k,{ease:k.ease||ease||'cinematic'});} ))};
  var pose=model.evaluate(compiled,p,ease,reduced);return {x:pose.x,y:pose.y,z:pose.z,rotateX:pose.rotateX,rotateY:pose.rotateY,rotate:pose.rotate};
 }
 function transform(v){
  // Inverse of camera T(x,y,-z) * Rx(pitch) * Ry(yaw) * Rz(roll).
  var rx=angle(v.rotateX),ry=angle(v.rotateY),rz=angle(v.rotate);
  return (rz?'rotateZ('+(-rz)+'deg) ':'')+(ry?'rotateY('+(-ry)+'deg) ':'')+(rx?'rotateX('+(-rx)+'deg) ':'')+'translate3d('+(-number(v.x))+'px,'+(-number(v.y))+'px,'+number(v.z)+'px)';
 }
 function attach(stage,c,perspective){
  if(!c)return null;
  var world=Array.from(stage.children).find(function(n){return n.classList.contains('inner');});
  if(!world)return null;
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
 return {config:config,pose:pose,attach:attach,normalize:normalize,frames:frames,transform:transform};
}
window.NAGWEB_CREATE_SCROLL_CAMERA=createCamera;
window.NAGWEB_SCROLL_CAMERA=createCamera();
var suppressedClick=null,selected=Object.create(null),C=window.NAGWEB_SCROLL_CAMERA;
function keys(s){return C.frames(C.config(s),s.sdEase);}
function progress(s){return window.NAGWEB_SCROLL_DIRECTOR?window.NAGWEB_SCROLL_DIRECTOR.progress(s.id):0;}
function choose(s,list){var at=selected[s.id],k=list.find(function(k){return k.at===at;});return k||list[0];}
function jump(s,at){selected[s.id]=at;window.NAGWEB_SCROLL_DIRECTOR.scrub(s.id,at/100);renderPane();}
function persist(s,list,at){s.sdCameraFrames=C.normalize(list);selected[s.id]=at;saveProject();renderPane();schedulePreview();window.NAGWEB_SCROLL_DIRECTOR.scrub(s.id,at/100);}
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
};
function retime(s,from,to){
 var list=keys(s),k=list.find(function(k){return k.at===from;});
 to=Math.round(Math.max(0,Math.min(100,to))*10)/10;
 if(!k||to===from)return false;
 if(list.some(function(f){return f!==k&&f.at===to;})){toast('Ya existe un encuadre en ese momento.');return false;}
 snapshot();k.at=to;persist(s,list,to);return true;
}
var pane=document.getElementById('pane');
if(pane){
 pane.addEventListener('input',function(ev){
  if(!ev.target.matches('[data-camera-seek]'))return;
  var s=sec();if(C.config(s))window.NAGWEB_SCROLL_DIRECTOR.scrub(s.id,+ev.target.value/100);
 });
 pane.addEventListener('pointerdown',function(ev){
  if(ev.button!==0)return;
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
  var button=ev.target.closest('[data-camera-jump]');if(!button||['ArrowLeft','ArrowRight'].indexOf(ev.key)<0)return;
  var s=sec();if(!C.config(s))return;ev.preventDefault();ev.stopPropagation();
  var from=+button.dataset.cameraJump,to=Math.round(Math.max(0,Math.min(100,from+(ev.key==='ArrowLeft'?-1:1)*(ev.shiftKey?10:1)))*10)/10;
  if(retime(s,from,to)){var next=pane.querySelector('[data-camera-jump="'+to+'"]');if(next)next.focus();}
 });
 pane.addEventListener('click',function(ev){
  var button=ev.target.closest('[data-camera-jump],[data-camera-add],[data-camera-delete]');if(!button)return;
  if(button===suppressedClick){suppressedClick=null;return;}
  var s=sec();if(!C.config(s))return;var list=keys(s);
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
  var input=ev.target;if(!input.matches('[data-camera-field]'))return;
  var s=sec();if(!C.config(s))return;var list=keys(s),k=list.find(function(k){return k.at===+input.dataset.cameraAt;}),field=input.dataset.cameraField;
  if(!k)return;var value=field==='ease'?input.value:+input.value;
  if(field!=='ease'&&(!Number.isFinite(value)||input.value==='')){renderPane();return;}
  if(field==='at'){value=Math.round(Math.max(0,Math.min(100,value))*10)/10;if(list.some(function(f){return f!==k&&f.at===value;})){toast('Ya existe un encuadre en ese momento.');renderPane();return;}}
  if(k[field]===value)return;snapshot();k[field]=value;persist(s,list,k.at);
 });
}
})();
