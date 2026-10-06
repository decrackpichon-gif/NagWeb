/* Optional scene camera. The Director owns progress; this module has no clock. */
(function(){
'use strict';
function createCamera(){
 function number(v){return Number.isFinite(+v)?Math.max(-4000,Math.min(4000,+v)):0;}
 function config(s){
  if(!s.sdCameraEnabled||!s.sdEnabled||s.nwMotionSource==='time')return null;
  return {start:{x:number(s.sdCameraStartX),y:number(s.sdCameraStartY),z:number(s.sdCameraStartZ)},end:{x:number(s.sdCameraEndX),y:number(s.sdCameraEndY),z:number(s.sdCameraEndZ)}};
 }
 function pose(c,p,model,ease,reduced){
  var t=model.ease(Math.max(0,Math.min(1,Number.isFinite(+p)?+p:0)),ease),v={};
  ['x','y','z'].forEach(function(k){v[k]=reduced?0:number(c.start[k])+(number(c.end[k])-number(c.start[k]))*t;});return v;
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
   var value='translate3d('+(-v.x)+'px,'+(-v.y)+'px,'+v.z+'px)';
   if(value===last)return;last=value;
   if(!v.x&&!v.y&&!v.z){if(animation)animation.cancel();animation=null;return;}
   var frames=[{transform:value},{transform:value}];
   if(animation)animation.effect.setKeyframes(frames);
   else{animation=world.animate(frames,{duration:1,fill:'both',composite:'add'});animation.pause();animation.currentTime=0;}
  };
 }
 return {config:config,pose:pose,attach:attach};
}
window.NAGWEB_CREATE_SCROLL_CAMERA=createCamera;
window.NAGWEB_SCROLL_CAMERA=createCamera();
window.NAGWEB_SCROLL_CAMERA.panel=function(s){
 var html=cRow('Cámara 3D',cSeg('sec.sdCameraEnabled',!!s.sdCameraEnabled,[['false','Desactivada'],['true','Activada']],'bool'));
 if(!s.sdCameraEnabled)return html;
 html+='<p class="hint gh">El scroll recorre dos encuadres de cámara. +X va a la derecha, +Y hacia abajo y +Z hacia adelante. Desactivarla conserva tus ajustes.</p>';
 ['Start','End'].forEach(function(point){html+='<h4 class="gsub">'+(point==='Start'?'Encuadre inicial · 0%':'Encuadre final · 100%')+'</h4>';['X','Y','Z'].forEach(function(axis){var key='sdCamera'+point+axis;html+=cRow('Cámara '+axis,cNum('sec.'+key,s[key]||0,'px',{step:25,min:-4000,max:4000}));});});
 return html;
};
})();
