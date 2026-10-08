/* Optional scene camera. The Director owns progress; this module has no clock. */
(function(){
'use strict';
function createCamera(){
 function number(v){return Number.isFinite(+v)?Math.max(-4000,Math.min(4000,+v)):0;}
 function angle(v){return Number.isFinite(+v)?Math.max(-3600,Math.min(3600,+v)):0;}
 function curveTension(v){var n=Number.isFinite(+v)?Math.max(-100,Math.min(100,+v)):0;return Object.is(n,-0)?0:n;}
 function handlePrefix(side){return side==='in'?'curveIn':'curveOut';}
 function handleFree(k,side){return !!(k&&k[handlePrefix(side)+'Free']);}
 function targetEligible(e,s){return !!e&&!!s&&s.layout==='free'&&layerEligible(e,s)&&Number.isFinite(+e.x)&&Number.isFinite(+e.y);}
 function targetMotion(e){return {id:e.id,sdKeyframesEnabled:e.sdKeyframesEnabled,sdKeyframes:Array.isArray(e.sdKeyframes)?e.sdKeyframes:[],sdStart:e.sdStart,sdEnd:e.sdEnd,sdSpan:e.sdSpan,sdEnter:e.sdEnter,sdExit:e.sdExit,sdMoveX:e.sdMoveX,sdMoveY:e.sdMoveY,sdRotate:e.sdRotate,sdScale:e.sdScale};}
 function targetConfig(e){return {id:String(e.id),x:+e.x,y:+e.y,z:number(e.sdCameraDepth),motion:targetMotion(e)};}
 function config(s){
  if(!s.sdCameraEnabled||!s.sdEnabled||s.nwMotionSource==='time'||s.layout==='horizontal')return null;
  return {pathMode:s.sdCameraPathMode==='smooth'?'smooth':'linear',orientationMode:s.sdCameraOrientationMode==='lookAt'?'lookAt':'manual',lookPathMode:s.sdCameraLookPathMode==='smooth'?'smooth':'linear',lookFrames:normalizeLook(s.sdCameraLookFrames),targets:(s.elements||[]).filter(function(e){return targetEligible(e,s);}).map(targetConfig),responsive:!!s.sdCameraResponsive,referenceWidth:Math.max(320,Math.min(2400,Number.isFinite(+s.sdCameraReferenceWidth)&&+s.sdCameraReferenceWidth>0?+s.sdCameraReferenceWidth:1000)),containers:(s.elements||[]).filter(function(e){return e.type==='container'&&layerEligible(e,s);}).map(function(e){return e.id;}),layers:(s.elements||[]).filter(function(e){return layerEligible(e,s);}).map(function(e){return {id:e.id,z:number(e.sdCameraDepth)};}),frames:normalize(s.sdCameraFrames),start:{x:number(s.sdCameraStartX),y:number(s.sdCameraStartY),z:number(s.sdCameraStartZ)},end:{x:number(s.sdCameraEndX),y:number(s.sdCameraEndY),z:number(s.sdCameraEndZ)}};
 }
 function layerEligible(e,s){return !!e&&!e.parent&&!e.fixed&&!e.modal&&!e.nwMotionInstance&&['shape3d','light3d','spacer'].indexOf(e.type)<0&&(e.type!=='container'||!!s&&(s.layout==='free'||s.layout==='stack'));}
 function layer(c,id){return c&&(c.layers||[]).find(function(l){return l.id===id;})||null;}
 function layerPose(v,l,reduced,scale){var factor=l&&Number.isFinite(+scale)&&+scale>0?+scale:1;return Object.assign({},v,{z:(v.z+(l&&!reduced?number(l.z):0))*factor});}
 function layerTransform(v,perspective,shared){
  return (shared?'':'perspective('+perspective+'px) ')+'translateZ('+v.z.toFixed(3)+'px) rotateX('+v.rotateX.toFixed(3)+'deg) rotateY('+v.rotateY.toFixed(3)+'deg)';
 }
 function normalize(input){
  var out=[];
  (Array.isArray(input)?input:[]).filter(function(k){return k&&Number.isFinite(+k.at);}).slice(0,128).sort(function(a,b){return +a.at-+b.at;}).forEach(function(k){
   var frame={at:Math.round(Math.max(0,Math.min(100,+k.at))*10)/10,x:number(k.x),y:number(k.y),z:number(k.z),rotateX:angle(k.rotateX),rotateY:angle(k.rotateY),rotate:angle(k.rotate)};
   if(k.tension!==undefined&&k.tension!==null&&k.tension!=='')frame.tension=curveTension(k.tension);
   ['in','out'].forEach(function(side){var p=handlePrefix(side);if(k[p+'Free']){frame[p+'Free']=true;frame[p+'DX']=number(k[p+'DX']);frame[p+'DY']=number(k[p+'DY']);frame[p+'DZ']=number(k[p+'DZ']);}});
   if(['linear','smooth','cinematic','ease-in','ease-out','ease-in-out'].indexOf(k.ease)>=0)frame.ease=k.ease;
   if(out.length&&out[out.length-1].at===frame.at)out.pop();out.push(frame);
  });return out;
 }
 function normalizeLook(input){
  var out=[];
  (Array.isArray(input)?input:[]).filter(function(k){return k&&Number.isFinite(+k.at);}).slice(0,128).sort(function(a,b){return +a.at-+b.at;}).forEach(function(k){
   var frame={at:Math.round(Math.max(0,Math.min(100,+k.at))*10)/10,x:number(k.x),y:number(k.y),z:number(k.z)};
   if(typeof k.targetId==='string'&&k.targetId)frame.targetId=k.targetId;
   if(k.tension!==undefined&&k.tension!==null&&k.tension!=='')frame.tension=curveTension(k.tension);
   ['in','out'].forEach(function(side){var p=handlePrefix(side);if(k[p+'Free']){frame[p+'Free']=true;frame[p+'DX']=number(k[p+'DX']);frame[p+'DY']=number(k[p+'DY']);frame[p+'DZ']=number(k[p+'DZ']);}});
   if(['linear','smooth','cinematic','ease-in','ease-out','ease-in-out'].indexOf(k.ease)>=0)frame.ease=k.ease;
   if(out.length&&out[out.length-1].at===frame.at)out.pop();out.push(frame);
  });return out;
 }
 function frames(c,ease){
  return c.frames&&c.frames.length?normalize(c.frames):normalize([{at:0,x:c.start.x,y:c.start.y,z:c.start.z,ease:ease},{at:100,x:c.end.x,y:c.end.y,z:c.end.z}]);
 }
 function lookFrames(c){return c&&c.lookFrames&&c.lookFrames.length?normalizeLook(c.lookFrames):[];}
 function compile(c,model,ease){
  var list=frames(c,ease),targetTracks={};
  (c.targets||[]).forEach(function(t){if(t&&t.id)targetTracks[t.id]=model.compile(t.motion||{id:t.id});});
  return {keyframes:model.normalize(list.map(function(k){return Object.assign({},k,{ease:k.ease||ease||'cinematic'});} )),targetTracks:targetTracks};
 }
 function catmull(a,b,c,d,t,tension){
  var t2=t*t,t3=t2*t,scale=1-curveTension(tension)/100;
  var m1=(c-a)*.5*scale,m2=(d-b)*.5*scale;
  var h00=2*t3-3*t2+1,h10=t3-2*t2+t,h01=-2*t3+3*t2,h11=t3-t2;
  return h00*b+h10*m1+h01*c+h11*m2;
 }
 function cubicBezier(a,b,c,d,t){var u=1-t,u2=u*u,t2=t*t;return u2*u*a+3*u2*t*b+3*u*t2*c+t2*t*d;}
 function pointAt(list,p,model,ease,mode){
  if(!list||!list.length)return null;
  var at=Math.max(0,Math.min(100,(+p||0)*100));
  if(at<=list[0].at)return {x:list[0].x,y:list[0].y,z:list[0].z};
  if(at>=list[list.length-1].at){var last=list[list.length-1];return {x:last.x,y:last.y,z:last.z};}
  var i=0;while(i<list.length-2&&at>list[i+1].at)i++;
  var b=list[i],cc=list[i+1],span=Math.max(.0001,cc.at-b.at),t=(at-b.at)/span;
  if(b.x===cc.x&&b.y===cc.y&&b.z===cc.z)return {x:b.x,y:b.y,z:b.z};
  t=model&&typeof model.ease==='function'?model.ease(t,b.ease||ease||'cinematic'):Math.max(0,Math.min(1,t));
  if(mode==='smooth'&&list.length>=3){
   if(handleFree(b,'out')||handleFree(cc,'in')){
    var h1=handleAt(list,i,'out'),h2=handleAt(list,i+1,'in');
    if(h1&&h2)return {x:number(cubicBezier(b.x,h1.x,h2.x,cc.x,t)),y:number(cubicBezier(b.y,h1.y,h2.y,cc.y,t)),z:number(cubicBezier(b.z,h1.z,h2.z,cc.z,t))};
   }
   var a=list[Math.max(0,i-1)],d=list[Math.min(list.length-1,i+2)],segmentTension=b.tension===undefined?0:b.tension;
   return {x:number(catmull(a.x,b.x,cc.x,d.x,t,segmentTension)),y:number(catmull(a.y,b.y,cc.y,d.y,t,segmentTension)),z:number(catmull(a.z,b.z,cc.z,d.z,t,segmentTension))};
  }
  return {x:number(b.x+(cc.x-b.x)*t),y:number(b.y+(cc.y-b.y)*t),z:number(b.z+(cc.z-b.z)*t)};
 }
 function smoothPosition(c,p,model,ease){return pointAt(frames(c,ease),p,model,ease,'smooth');}
 function targetById(c,id){return c&&id&&(c.targets||[]).find(function(t){return t.id===id;})||null;}
 function elementTarget(c,id,p,model,ease,size,compiled){
  var t=targetById(c,id);if(!t)return null;
  var width=size&&Number.isFinite(+size.width)&&+size.width>0?+size.width:(c.referenceWidth||1000);
  var height=size&&Number.isFinite(+size.height)&&+size.height>0?+size.height:width;
  var track=compiled&&compiled.targetTracks&&compiled.targetTracks[id]||model.compile(t.motion||{id:t.id});
  var motion=model.evaluate(track,p,ease,false);
  return {x:number((t.x-50)/100*width+motion.x),y:number((t.y-50)/100*height+motion.y),z:number(t.z+motion.z)};
 }
 function resolvedLookFrames(c,p,model,ease,size,compiled){
  return lookFrames(c).map(function(f){if(!f.targetId)return f;var t=elementTarget(c,f.targetId,p,model,ease,size,compiled);return t?Object.assign({},f,t):f;});
 }
 function lookTarget(c,p,model,ease,size,compiled){return pointAt(resolvedLookFrames(c,p,model,ease,size,compiled),p,model,ease,c&&c.lookPathMode==='smooth'?'smooth':'linear');}
 function lookAngles(position,target){
  if(!position||!target)return null;
  var dx=number(target.x)-number(position.x),dy=number(target.y)-number(position.y),dz=number(target.z)-number(position.z),flat=Math.hypot(dx,dz);
  if(Math.hypot(dx,dy,dz)<.000001)return null;
  return {rotateX:angle(Math.atan2(dy,Math.max(.000001,flat))*180/Math.PI),rotateY:angle(Math.atan2(-dx,dz)*180/Math.PI)};
 }
 function forwardTarget(pose,distance){
  var d=Math.max(1,Math.min(4000,Number.isFinite(+distance)?+distance:1000)),rx=angle(pose&&pose.rotateX)*Math.PI/180,ry=angle(pose&&pose.rotateY)*Math.PI/180,cp=Math.cos(rx);
  return {x:number(number(pose&&pose.x)-Math.sin(ry)*cp*d),y:number(number(pose&&pose.y)+Math.sin(rx)*d),z:number(number(pose&&pose.z)+Math.cos(ry)*cp*d)};
 }
 function defaultLookFrames(c,model,ease,distance){
  if(!c)return [];
  var manual=Object.assign({},c,{orientationMode:'manual'}),list=frames(c,ease);
  return normalizeLook(list.map(function(k){var v=pose(manual,k.at/100,model,ease,false),t=forwardTarget(v,distance);return {at:k.at,x:t.x,y:t.y,z:t.z,ease:k.ease||ease||'cinematic'};}));
 }
 function pose(c,p,model,ease,reduced,compiled,size){
  var prepared=compiled||compile(c,model,ease),v=model.evaluate(prepared,p,ease,reduced);
  if(!reduced&&c&&c.pathMode==='smooth'){var s=smoothPosition(c,p,model,ease);if(s){v.x=s.x;v.y=s.y;v.z=s.z;}}
  if(!reduced&&c&&c.orientationMode==='lookAt'){var target=lookTarget(c,p,model,ease,size,prepared),angles=lookAngles(v,target);if(angles){v.rotateX=angles.rotateX;v.rotateY=angles.rotateY;}}
  return {x:v.x,y:v.y,z:v.z,rotateX:v.rotateX,rotateY:v.rotateY,rotate:v.rotate};
 }
 function pathSamples(c,model,ease,steps){
  var list=frames(c,ease);
  if(!c||c.pathMode!=='smooth'||list.length<3)return list;
  var count=Math.max(16,Math.min(128,Number.isFinite(+steps)?Math.round(+steps):Math.max(24,(list.length-1)*12))),start=list[0].at/100,end=list[list.length-1].at/100,out=[];
  for(var i=0;i<=count;i++){var p=start+(end-start)*(i/count),v=pose(c,p,model,ease,false);out.push({at:p*100,x:v.x,y:v.y,z:v.z,rotateX:v.rotateX,rotateY:v.rotateY,rotate:v.rotate});}
  return out;
 }
 function lookSamples(c,model,ease,steps,size,compiled){
  var list=lookFrames(c),dynamic=list.some(function(k){return !!k.targetId;});
  if(!list.length)return [];
  if((!c||c.lookPathMode!=='smooth'||list.length<3)&&!dynamic)return list;
  var count=Math.max(16,Math.min(128,Number.isFinite(+steps)?Math.round(+steps):Math.max(24,(list.length-1)*12))),start=list[0].at/100,end=list[list.length-1].at/100,out=[];
  for(var i=0;i<=count;i++){var p=start+(end-start)*(i/count),v=lookTarget(c,p,model,ease,size,compiled);out.push({at:p*100,x:v.x,y:v.y,z:v.z});}
  return out;
 }
 function viewportScale(c,width){
  if(!c||!c.responsive||!Number.isFinite(+width)||+width<=0)return 1;
  return Math.min(1,+width/c.referenceWidth);
 }
 function scalePose(v,scale){return Object.assign({},v,{x:v.x*scale,y:v.y*scale,z:v.z*scale});}
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
 function tangentOwner(list,i,side){return side==='in'?i-1:i;}
 function handleAt(list,i,side){
  side=side==='in'?'in':'out';
  if(i<0||list.length<3||side==='out'&&i>=list.length-1||side==='in'&&i<=0)return null;
  var key=list[i],owner=tangentOwner(list,i,side),segmentStart=list[owner],segmentEnd=list[owner+1],p=handlePrefix(side);
  if(segmentStart.x===segmentEnd.x&&segmentStart.y===segmentEnd.y&&segmentStart.z===segmentEnd.z)return null;
  if(handleFree(key,side))return {at:key.at,ownerAt:segmentStart.at,side:side,free:true,x:key.x+number(key[p+'DX']),y:key.y+number(key[p+'DY']),z:key.z+number(key[p+'DZ']),keyX:key.x,keyY:key.y,keyZ:key.z,tension:curveTension(segmentStart.tension)};
  var a=list[Math.max(0,owner-1)],d=list[Math.min(list.length-1,owner+2)],scale=1-curveTension(segmentStart.tension)/100;
  var vx=side==='in'?d.x-segmentStart.x:segmentEnd.x-a.x,vy=side==='in'?d.y-segmentStart.y:segmentEnd.y-a.y,vz=side==='in'?d.z-segmentStart.z:segmentEnd.z-a.z;
  var dx=vx/6,dy=vy/6,dz=vz/6,sign=side==='in'?-1:1;
  if(Math.hypot(dx,dy,dz)<.000001)return null;
  return {at:key.at,ownerAt:segmentStart.at,side:side,free:false,x:number(key.x+dx*scale*sign),y:number(key.y+dy*scale*sign),z:number(key.z+dz*scale*sign),keyX:key.x,keyY:key.y,keyZ:key.z,scale:scale,tension:curveTension(segmentStart.tension)};
 }
 function tangentHandle(input,at,side){side=side==='in'?'in':'out';var list=normalize(input),i=list.findIndex(function(k){return k.at===at;});return handleAt(list,i,side);}
 function setHandleMode(input,at,side,free){
  side=side==='in'?'in':'out';var list=normalize(input),i=list.findIndex(function(k){return k.at===at;});if(i<0)return list;
  var key=list[i],p=handlePrefix(side),already=handleFree(key,side);if(!!free===already)return list;
  if(free){var h=handleAt(list,i,side);if(!h)return list;key[p+'Free']=true;key[p+'DX']=number(h.x-key.x);key[p+'DY']=number(h.y-key.y);key[p+'DZ']=number(h.z-key.z);}
  else{delete key[p+'Free'];delete key[p+'DX'];delete key[p+'DY'];delete key[p+'DZ'];}
  return normalize(list);
 }
 function setFreeHandle(input,at,side,point){
  side=side==='in'?'in':'out';var list=normalize(input),i=list.findIndex(function(k){return k.at===at;});if(i<0||!point)return list;
  var key=list[i],p=handlePrefix(side);key[p+'Free']=true;key[p+'DX']=number((+point.x||0)-key.x);key[p+'DY']=number((+point.y||0)-key.y);key[p+'DZ']=number((+point.z||0)-key.z);return normalize(list);
 }
 function lookTangentHandle(input,at,side){side=side==='in'?'in':'out';var list=normalizeLook(input),i=list.findIndex(function(k){return k.at===at;});return handleAt(list,i,side);}
 function setLookHandleMode(input,at,side,free){
  side=side==='in'?'in':'out';var list=normalizeLook(input),i=list.findIndex(function(k){return k.at===at;});if(i<0)return list;
  var key=list[i],p=handlePrefix(side),already=handleFree(key,side);if(!!free===already)return list;
  if(free){var h=handleAt(list,i,side);if(!h)return list;key[p+'Free']=true;key[p+'DX']=number(h.x-key.x);key[p+'DY']=number(h.y-key.y);key[p+'DZ']=number(h.z-key.z);}
  else{delete key[p+'Free'];delete key[p+'DX'];delete key[p+'DY'];delete key[p+'DZ'];}
  return normalizeLook(list);
 }
 function setLookFreeHandle(input,at,side,point){
  side=side==='in'?'in':'out';var list=normalizeLook(input),i=list.findIndex(function(k){return k.at===at;});if(i<0||!point)return list;
  var key=list[i],p=handlePrefix(side);key[p+'Free']=true;key[p+'DX']=number((+point.x||0)-key.x);key[p+'DY']=number((+point.y||0)-key.y);key[p+'DZ']=number((+point.z||0)-key.z);return normalizeLook(list);
 }
 function tensionFromList(list,at,spec,point,side){
  side=side==='in'?'in':'out';var i=list.findIndex(function(k){return k.at===at;});
  if(i<0||list.length<3||!spec||!point||side==='out'&&i>=list.length-1||side==='in'&&i<=0||handleFree(list[i],side))return null;
  var owner=tangentOwner(list,i,side),key=list[i],start=list[owner],end=list[owner+1],axis=spec.axis==='y'?'y':'z';
  if(start.x===end.x&&start.y===end.y&&start.z===end.z)return null;
  var a=list[Math.max(0,owner-1)],d=list[Math.min(list.length-1,owner+2)],sign=side==='in'?-1:1;
  var vx=side==='in'?d.x-start.x:end.x-a.x,vy=side==='in'?d[axis]-start[axis]:end[axis]-a[axis];
  var bx=vx/6*sign,by=vy/6*sign,den=bx*bx+by*by;
  if(den<.000001)return null;
  var px=(+point.x||0)-key.x,py=(+point[axis]||0)-key[axis],scale=(px*bx+py*by)/den;
  scale=Math.max(0,Math.min(2,scale));
  return curveTension(Math.round((1-scale)*100));
 }
 function tensionFromHandle(input,at,spec,point,side){return tensionFromList(normalize(input),at,spec,point,side);}
 function lookTensionFromHandle(input,at,spec,point,side){return tensionFromList(normalizeLook(input),at,spec,point,side);}
 function mapSpec(list,plane){
  var axis=plane==='front'?'y':'z',range=500;
  list.forEach(function(k){range=Math.max(range,Math.abs(number(k.x))*1.2,Math.abs(number(k[axis]))*1.2);});
  return {axis:axis,sign:axis==='z'?-1:1,range:range};
 }
 function mapPoint(k,spec){return {x:50+number(k.x)/spec.range*50,y:50+number(k[spec.axis])/spec.range*50*spec.sign};}
 function moveSpatial(k,spec,dx,dy){var copy=Object.assign({},k);copy.x=number(Math.round(k.x+dx*spec.range*2));copy[spec.axis]=number(Math.round(k[spec.axis]+dy*spec.range*2*spec.sign));return copy;}
 function nearestPathAt(samples,spec,point,scale){
  if(!Array.isArray(samples)||samples.length<2||!spec||!point)return null;
  var sx=scale&&Number.isFinite(+scale.x)&&+scale.x>0?+scale.x:1,sy=scale&&Number.isFinite(+scale.y)&&+scale.y>0?+scale.y:1,best=null;
  for(var i=0;i<samples.length-1;i++){
   var a=mapPoint(samples[i],spec),b=mapPoint(samples[i+1],spec),vx=(b.x-a.x)*sx,vy=(b.y-a.y)*sy,qx=(+point.x-a.x)*sx,qy=(+point.y-a.y)*sy,len=vx*vx+vy*vy;
   var u=len>.000001?Math.max(0,Math.min(1,(qx*vx+qy*vy)/len)):0,dx=qx-vx*u,dy=qy-vy*u,dist=Math.hypot(dx,dy);
   if(!best||dist<best.distance){best={at:samples[i].at+(samples[i+1].at-samples[i].at)*u,distance:dist,segment:i,t:u};}
  }
  return best;
 }
 function attach(stage,c,perspective){
  if(!c)return null;
  var world=Array.from(stage.children).find(function(n){return n.classList.contains('inner');});
  if(!world)return null;
  // Free-layout roots and absolute roots in stacked scenes may be generated beside
  // .inner. Reparenting only eligible roots keeps them inside the shared camera world.
  // Keep their children intact: camera motion is applied exactly once to the world.
  var containers=c.containers||[];
  if(containers.length)Array.from(stage.children).forEach(function(n){
   if(n!==world&&n.classList.contains('container-box')&&containers.indexOf(n.getAttribute('data-id'))>=0)world.appendChild(n);
  });
  function find(root,id){
   if(root.getAttribute&&root.getAttribute('data-id')===id)return root;
   var children=Array.from(root.children||[]);
   for(var i=0;i<children.length;i++){var hit=find(children[i],id);if(hit)return hit;}
   return null;
  }
  function inside(root,node){for(var p=node;p;p=p.parentNode)if(p===root)return true;return false;}
  stage.style.perspective=perspective+'px';stage.style.perspectiveOrigin='50% 50%';
  world.style.transformStyle='preserve-3d';world.setAttribute('data-nw-camera-world','');
  containers.forEach(function(id){var n=find(world,id);if(n&&n.style)n.style.transformStyle='preserve-3d';});
  var animation=null,last='';
  function paint(v,scale){
   stage.style.perspective=(perspective*(Number.isFinite(+scale)&&+scale>0?+scale:1))+'px';
   // Camera translation is the inverse world translation. Positive Z travels forward.
   var value=transform(v);
   if(value===last)return;last=value;
   if(!v.x&&!v.y&&!v.z&&!v.rotateX&&!v.rotateY&&!v.rotate){if(animation)animation.cancel();animation=null;return;}
   var frames=[{transform:value},{transform:value}];
   if(animation)animation.effect.setKeyframes(frames);
   else{animation=world.animate(frames,{duration:1,fill:'both',composite:'add'});animation.pause();animation.currentTime=0;}
  }
  paint.contains=function(n){return inside(world,n);};
  return paint;
 }
 return {config:config,compile:compile,pose:pose,pathSamples:pathSamples,lookSamples:lookSamples,lookTarget:lookTarget,lookAngles:lookAngles,forwardTarget:forwardTarget,defaultLookFrames:defaultLookFrames,normalizeLook:normalizeLook,lookFrames:lookFrames,targetEligible:targetEligible,elementTarget:elementTarget,curveTension:curveTension,tangentHandle:tangentHandle,tensionFromHandle:tensionFromHandle,lookTangentHandle:lookTangentHandle,lookTensionFromHandle:lookTensionFromHandle,handleFree:handleFree,setHandleMode:setHandleMode,setFreeHandle:setFreeHandle,setLookHandleMode:setLookHandleMode,setLookFreeHandle:setLookFreeHandle,nearestPathAt:nearestPathAt,viewportScale:viewportScale,scalePose:scalePose,attach:attach,normalize:normalize,frames:frames,transform:transform,layerEligible:layerEligible,layer:layer,layerPose:layerPose,layerTransform:layerTransform,mapSpec:mapSpec,mapPoint:mapPoint,moveSpatial:moveSpatial,copyFrame:copyFrame,holdFrame:holdFrame,preset:preset};
}
window.NAGWEB_CREATE_SCROLL_CAMERA=createCamera;
window.NAGWEB_SCROLL_CAMERA=createCamera();
var presetChoices=Object.create(null),holdDurations=Object.create(null),mapOpen=Object.create(null),mapPlanes=Object.create(null),suppressedClick=null,selected=Object.create(null),lookSelected=Object.create(null),C=window.NAGWEB_SCROLL_CAMERA;
function safeLabel(v){return String(v==null?'':v).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,42).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
function targetLabel(e){var label=safeLabel(e&&((e.name||e.text||e.label)||e.type));return label||'Elemento';}
function keys(s){return C.frames(C.config(s),s.sdEase);}
function lookKeys(s){var cfg=C.config(s);return cfg?C.lookFrames(cfg):[];}
function progress(s){return window.NAGWEB_SCROLL_DIRECTOR?window.NAGWEB_SCROLL_DIRECTOR.progress(s.id):0;}
function choose(s,list){var at=selected[s.id],k=list.find(function(k){return k.at===at;});return k||list[0];}
function chooseLook(s,list){var at=lookSelected[s.id],k=list.find(function(k){return k.at===at;});return k||list[0];}
function jump(s,at){selected[s.id]=at;window.NAGWEB_SCROLL_DIRECTOR.scrub(s.id,at/100);renderPane();}
function jumpLook(s,at){lookSelected[s.id]=at;window.NAGWEB_SCROLL_DIRECTOR.scrub(s.id,at/100);renderPane();}
function persist(s,list,at){s.sdCameraFrames=C.normalize(list);selected[s.id]=at;saveProject();renderPane();schedulePreview();window.NAGWEB_SCROLL_DIRECTOR.scrub(s.id,at/100);}
function persistLook(s,list,at){s.sdCameraLookFrames=C.normalizeLook(list);lookSelected[s.id]=at;saveProject();renderPane();schedulePreview();window.NAGWEB_SCROLL_DIRECTOR.scrub(s.id,at/100);}
C.elementPanel=function(s,e){
 if(!C.config(s)||!C.layerEligible(e,s))return '';
 var z=C.layer(C.config(s),e.id);z=z?z.z:0;
 return (e.type==='container'?'<p class="hint gh">Este plano mueve el contenedor completo con sus elementos internos.</p>':'')+'<h4 class="gsub">Plano en la escena de cámara</h4>'+cRow('Profundidad fija (px)','<input type="number" class="cnum" aria-label="Profundidad fija del elemento" data-camera-depth value="'+z+'" min="-4000" max="4000" step="25">')+'<p class="hint gh">Negativo: más lejos · 0: plano original · Positivo: más cerca. Se suma a la animación de profundidad. Al desactivar la cámara se conserva este ajuste.</p>';
};
function previewReferenceSize(s){
 var cfg=C.config(s),width=cfg?cfg.referenceWidth:1000,height=width;
 try{
  var f=document.getElementById('preview'),doc=f&&f.contentDocument,scene=doc&&doc.querySelector('.sc[data-id="'+s.id+'"]'),stage=scene&&(scene.querySelector('.nw-sd-stage')||scene);
  if(stage&&stage.clientWidth&&stage.clientHeight){var scale=C.viewportScale(cfg,stage.clientWidth);width=stage.clientWidth/Math.max(.0001,scale);height=stage.clientHeight/Math.max(.0001,scale);}
 }catch(_){}
 return {width:width,height:height};
}
function resolvedLookKeys(s,cfg,list,size){
 return list.map(function(k){if(!k.targetId)return k;var v=C.elementTarget(cfg,k.targetId,k.at/100,window.NAGWEB_STORY_MODEL,s.sdEase,size);return v?Object.assign({},k,v):k;});
}
function mapCurrent(s,pct){
 var reduced=typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;
 return C.pose(C.config(s),pct/100,window.NAGWEB_STORY_MODEL,s.sdEase,reduced,undefined,previewReferenceSize(s));
}
function mapLabel(v,pct){return 'Ahora: '+Math.round(pct*10)/10+'% · X '+Math.round(v.x)+' · Y '+Math.round(v.y)+' · Z '+Math.round(v.z);}
function mapFrameOptions(list,at){
 return list.map(function(f){return '<option value="'+f.at+'"'+(f.at===at?' selected':'')+'>'+f.at+'%</option>';}).join('');
}
function freeSegmentPaths(keys,samples,spec,kind,sampleAt){
 if(!keys||keys.length<3)return '';
 var html='',stroke=kind==='look'?'var(--accent)':'currentColor';
 for(var i=0;i<keys.length-1;i++){
  var a=keys[i],b=keys[i+1];
  if(!(a.curveOutFree||b.curveInFree)||b.at<=a.at)continue;
  var inner=samples.filter(function(p){return p.at>a.at&&p.at<b.at;});
  if(inner.length<3&&typeof sampleAt==='function'){
   inner=[];
   for(var j=1;j<4;j++){var p=sampleAt((a.at+(b.at-a.at)*j/4)/100);if(p)inner.push(p);}
  }
  var points=[a].concat(inner,[b]).map(function(p){var m=C.mapPoint(p,spec);return m.x+','+m.y;}).join(' ');
  html+='<polyline data-camera-bezier-segment="'+kind+'" points="'+points+'" fill="none" stroke="'+stroke+'" opacity=".95" stroke-width="1.4" pointer-events="none"/>';
 }
 return html;
}
function updateMapSelectionGuide(map,camera,look,spec){
 var line=map.querySelector('[data-camera-map-selection-link]');
 if(!line)return;
 var box=map.closest('[data-camera-map-box]'),label=box&&box.querySelector('[data-camera-map-selection-label]');
 if(!camera||!look){line.style.display='none';if(label)label.textContent='';return;}
 var a=C.mapPoint(camera,spec),b=C.mapPoint(look,spec);
 line.setAttribute('x1',a.x);line.setAttribute('y1',a.y);
 line.setAttribute('x2',b.x);line.setAttribute('y2',b.y);
 line.style.display='';
 if(label){
  var distance=Math.round(Math.hypot(camera.x-look.x,camera.y-look.y,camera.z-look.z));
  label.textContent='◆ '+camera.at+'% ↔ ● '+look.at+'% · Distancia XYZ: '+distance+' px. Guía comparativa, no vincula los recorridos.';
 }
}
function mapDraw(map,list,spec,s,lookList){
 if(!map.querySelector)return;
 var path=map.querySelector('[data-camera-map-path]'),cfg=s&&C.config(s);
 var draw=cfg?C.pathSamples(Object.assign({},cfg,{frames:list}),window.NAGWEB_STORY_MODEL,s.sdEase):list;
 if(path)path.setAttribute('points',draw.map(function(k){var p=C.mapPoint(k,spec);return p.x+','+p.y;}).join(' '));
 var cameraSegments=map.querySelector('[data-camera-free-segments]');
 if(cameraSegments)cameraSegments.innerHTML=cfg&&cfg.pathMode==='smooth'?freeSegmentPaths(list,draw,spec,'camera',function(p){return C.pose(Object.assign({},cfg,{frames:list}),p,window.NAGWEB_STORY_MODEL,s.sdEase,false);}):'';
 list.forEach(function(k){var dot=map.querySelector('[data-camera-map-dot="'+k.at+'"]'),p=C.mapPoint(k,spec);if(dot){dot.setAttribute('cx',p.x);dot.setAttribute('cy',p.y);}});
 var selectedButton=map.querySelector('[data-camera-map-point]');
 if(selectedButton&&cfg&&cfg.pathMode==='smooth'){
  var selectedAt=+selectedButton.dataset.cameraMapPoint,selectedKey=list.find(function(k){return k.at===selectedAt;});
  ['in','out'].forEach(function(side){
   var tangentLine=map.querySelector('[data-camera-tangent-line="'+side+'"]'),tangentDot=map.querySelector('[data-camera-tangent-handle="'+side+'"]'),tangentButton=map.querySelector('[data-camera-tension-handle][data-camera-tension-side="'+side+'"]'),th=C.tangentHandle(list,selectedAt,side);
   if(tangentLine&&tangentDot&&selectedKey&&th){var kp=C.mapPoint(selectedKey,spec),hp=C.mapPoint(th,spec);tangentLine.setAttribute('x1',kp.x);tangentLine.setAttribute('y1',kp.y);tangentLine.setAttribute('x2',hp.x);tangentLine.setAttribute('y2',hp.y);tangentDot.setAttribute('cx',hp.x);tangentDot.setAttribute('cy',hp.y);tangentLine.style.display='';tangentDot.style.display='';if(tangentButton){tangentButton.style.left=hp.x+'%';tangentButton.style.top=hp.y+'%';tangentButton.style.display='';}}
   else{if(tangentLine)tangentLine.style.display='none';if(tangentDot)tangentDot.style.display='none';if(tangentButton)tangentButton.style.display='none';}
  });
 }
 if(cfg&&cfg.orientationMode==='lookAt'){
  var looks=lookList||lookKeys(s),size=previewReferenceSize(s),lookPath=map.querySelector('[data-camera-look-map-path]'),lookHit=map.querySelector('[data-camera-look-map-path-hit]'),lookCfg=Object.assign({},cfg,{lookFrames:looks});
  var lookDraw=C.lookSamples(lookCfg,window.NAGWEB_STORY_MODEL,s.sdEase,undefined,size),resolved=resolvedLookKeys(s,lookCfg,looks,size),lookPoints=lookDraw.map(function(k){var p=C.mapPoint(k,spec);return p.x+','+p.y;}).join(' ');
  if(lookPath)lookPath.setAttribute('points',lookPoints);if(lookHit)lookHit.setAttribute('points',lookPoints);
  var lookSegments=map.querySelector('[data-camera-look-free-segments]');
  if(lookSegments)lookSegments.innerHTML=cfg.lookPathMode==='smooth'?freeSegmentPaths(resolved,lookDraw,spec,'look',function(p){return C.lookTarget(lookCfg,p,window.NAGWEB_STORY_MODEL,s.sdEase,size);}):'';
  resolved.forEach(function(k){var dot=map.querySelector('[data-camera-look-map-dot="'+k.at+'"]'),p=C.mapPoint(k,spec);if(dot){dot.setAttribute('cx',p.x);dot.setAttribute('cy',p.y);}});
  var selectedLookButton=map.querySelector('[data-camera-look-map-point]');
  updateMapSelectionGuide(map,selectedButton?list.find(function(k){return k.at===+selectedButton.dataset.cameraMapPoint;}):null,selectedLookButton?resolved.find(function(k){return k.at===+selectedLookButton.dataset.cameraLookMapPoint;}):null,spec);
  if(selectedLookButton&&cfg.lookPathMode==='smooth'){
   var selectedLookAt=+selectedLookButton.dataset.cameraLookMapPoint,selectedLook=resolved.find(function(k){return k.at===selectedLookAt;});
   ['in','out'].forEach(function(side){
    var line=map.querySelector('[data-camera-look-tangent-line="'+side+'"]'),dot=map.querySelector('[data-camera-look-tangent-handle="'+side+'"]'),button=map.querySelector('[data-camera-look-tension-handle][data-camera-look-tension-side="'+side+'"]'),th=C.lookTangentHandle(resolved,selectedLookAt,side);
    if(line&&dot&&selectedLook&&th){var kp=C.mapPoint(selectedLook,spec),hp=C.mapPoint(th,spec);line.setAttribute('x1',kp.x);line.setAttribute('y1',kp.y);line.setAttribute('x2',hp.x);line.setAttribute('y2',hp.y);dot.setAttribute('cx',hp.x);dot.setAttribute('cy',hp.y);line.style.display='';dot.style.display='';if(button){button.style.left=hp.x+'%';button.style.top=hp.y+'%';button.style.display='';}}
    else{if(line)line.style.display='none';if(dot)dot.style.display='none';if(button)button.style.display='none';}
   });
  }
 }
}
function spatialMap(s,list,k){
 var plane=mapPlanes[s.id]||'top',cfg=C.config(s),looks=cfg&&cfg.orientationMode==='lookAt'?lookKeys(s):[],lk=looks.length?chooseLook(s,looks):null,size=previewReferenceSize(s),resolvedLooks=resolvedLookKeys(s,cfg,looks,size),tangents=cfg&&cfg.pathMode==='smooth'?list.flatMap(function(f){return[C.tangentHandle(list,f.at,'in'),C.tangentHandle(list,f.at,'out')];}).filter(Boolean):[],lookTangents=cfg&&cfg.lookPathMode==='smooth'?resolvedLooks.flatMap(function(f){return[C.lookTangentHandle(resolvedLooks,f.at,'in'),C.lookTangentHandle(resolvedLooks,f.at,'out')];}).filter(Boolean):[],spec=C.mapSpec(list.concat(resolvedLooks,tangents,lookTangents),plane),point=C.mapPoint(k,spec),tangentIn=cfg&&cfg.pathMode==='smooth'?C.tangentHandle(list,k.at,'in'):null,tangentOut=cfg&&cfg.pathMode==='smooth'?C.tangentHandle(list,k.at,'out'):null,tangentInPoint=tangentIn?C.mapPoint(tangentIn,spec):null,tangentOutPoint=tangentOut?C.mapPoint(tangentOut,spec):null,resolvedLk=lk&&lk.targetId?(C.elementTarget(cfg,lk.targetId,lk.at/100,window.NAGWEB_STORY_MODEL,s.sdEase,size)||lk):lk,lookKeyPoint=resolvedLk?C.mapPoint(resolvedLk,spec):null,lookTangentIn=cfg&&cfg.lookPathMode==='smooth'&&lk?C.lookTangentHandle(resolvedLooks,lk.at,'in'):null,lookTangentOut=cfg&&cfg.lookPathMode==='smooth'&&lk?C.lookTangentHandle(resolvedLooks,lk.at,'out'):null,lookTangentInPoint=lookTangentIn?C.mapPoint(lookTangentIn,spec):null,lookTangentOutPoint=lookTangentOut?C.mapPoint(lookTangentOut,spec):null,current=mapCurrent(s,progress(s)),now=C.mapPoint(current,spec);
 var draw=C.pathSamples(Object.assign({},cfg,{frames:list}),window.NAGWEB_STORY_MODEL,s.sdEase),path=draw.map(function(f){var p=C.mapPoint(f,spec);return p.x+','+p.y;}).join(' ');
 var lookDraw=cfg&&cfg.orientationMode==='lookAt'?C.lookSamples(cfg,window.NAGWEB_STORY_MODEL,s.sdEase,undefined,size):[],lookPath=lookDraw.map(function(f){var p=C.mapPoint(f,spec);return p.x+','+p.y;}).join(' '),lookNow=cfg&&cfg.orientationMode==='lookAt'?C.lookTarget(cfg,progress(s)/100,window.NAGWEB_STORY_MODEL,s.sdEase,size):null,lookPoint=lookNow?C.mapPoint(lookNow,spec):null;
 var html='<details data-camera-map-box'+(mapOpen[s.id]?' open':'')+'><summary style="cursor:pointer;margin:8px 0">Mapa del recorrido</summary><label>Vista <select class="csel" data-camera-map-plane><option value="top"'+(plane==='top'?' selected':'')+'>Desde arriba · X/Z</option><option value="front"'+(plane==='front'?' selected':'')+'>De frente · X/Y</option></select></label>';
 if(cfg&&cfg.orientationMode==='lookAt'&&looks.length){
  html+='<div data-camera-map-pair style="display:flex;flex-wrap:wrap;gap:8px;margin:8px 0"><label style="flex:1;min-width:110px">◆ Encuadre <select class="csel" data-camera-map-camera-select aria-label="Encuadre seleccionado en el mapa">'+mapFrameOptions(list,k.at)+'</select></label><label style="flex:1;min-width:110px">● Objetivo <select class="csel" data-camera-map-look-select aria-label="Objetivo seleccionado en el mapa">'+mapFrameOptions(looks,lk.at)+'</select></label></div>';
  html+='<p class="hint gh">Seleccioná cada recorrido por separado. La vista previa sigue el último punto elegido.</p>';
 }
 html+='<div data-camera-map data-plane="'+plane+'" data-range="'+spec.range+'" style="position:relative;width:100%;aspect-ratio:1.5;border:1px solid var(--line);margin-top:8px;touch-action:none">';
 html+='<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:auto"><path d="M50 0V100M0 50H100" stroke="currentColor" opacity=".2" stroke-width=".5"/><polyline data-camera-map-path points="'+path+'" fill="none" stroke="currentColor" opacity=".65" stroke-width=".7"/>';
 if(lookPath)html+='<polyline data-camera-look-map-path-hit points="'+lookPath+'" fill="none" stroke="var(--accent)" opacity=".001" stroke-width="6" pointer-events="stroke" style="cursor:crosshair"/><polyline data-camera-look-map-path points="'+lookPath+'" fill="none" stroke="var(--accent)" opacity=".65" stroke-width=".7" stroke-dasharray="2 2" pointer-events="stroke" style="cursor:crosshair"/>';
 html+='<g data-camera-free-segments pointer-events="none">'+(cfg.pathMode==='smooth'?freeSegmentPaths(list,draw,spec,'camera',function(p){return C.pose(Object.assign({},cfg,{frames:list}),p,window.NAGWEB_STORY_MODEL,s.sdEase,false);}):'')+'</g>';
 html+='<g data-camera-look-free-segments pointer-events="none">'+(cfg.lookPathMode==='smooth'?freeSegmentPaths(resolvedLooks,lookDraw,spec,'look',function(p){return C.lookTarget(cfg,p,window.NAGWEB_STORY_MODEL,s.sdEase,size);}):'')+'</g>';
 if(lookKeyPoint)html+='<line data-camera-map-selection-link x1="'+point.x+'" y1="'+point.y+'" x2="'+lookKeyPoint.x+'" y2="'+lookKeyPoint.y+'" stroke="var(--accent)" stroke-width=".75" stroke-dasharray="1 4" opacity=".7" pointer-events="none"/>';
 if(tangentInPoint)html+='<line data-camera-tangent-line="in" x1="'+point.x+'" y1="'+point.y+'" x2="'+tangentInPoint.x+'" y2="'+tangentInPoint.y+'" stroke="var(--accent)" opacity=".48" stroke-width=".6" stroke-dasharray="1.5 1.5" pointer-events="none"/><circle data-camera-tangent-handle="in" cx="'+tangentInPoint.x+'" cy="'+tangentInPoint.y+'" r="1.55" fill="none" stroke="var(--accent)" opacity=".7" stroke-width=".8" pointer-events="none"/>';
 if(tangentOutPoint)html+='<line data-camera-tangent-line="out" x1="'+point.x+'" y1="'+point.y+'" x2="'+tangentOutPoint.x+'" y2="'+tangentOutPoint.y+'" stroke="var(--accent)" opacity=".72" stroke-width=".6" stroke-dasharray="1.5 1.5" pointer-events="none"/><circle data-camera-tangent-handle="out" cx="'+tangentOutPoint.x+'" cy="'+tangentOutPoint.y+'" r="1.6" fill="none" stroke="var(--accent)" stroke-width=".8" pointer-events="none"/>';
 if(lookTangentInPoint&&lookKeyPoint)html+='<line data-camera-look-tangent-line="in" x1="'+lookKeyPoint.x+'" y1="'+lookKeyPoint.y+'" x2="'+lookTangentInPoint.x+'" y2="'+lookTangentInPoint.y+'" stroke="var(--accent)" opacity=".45" stroke-width="'+(lookTangentIn&&lookTangentIn.free?'1.1':'.7')+'" stroke-dasharray="'+(lookTangentIn&&lookTangentIn.free?'none':'3 1')+'" pointer-events="none"/><circle data-camera-look-tangent-handle="in" cx="'+lookTangentInPoint.x+'" cy="'+lookTangentInPoint.y+'" r="1.5" fill="var(--accent)" opacity=".65" pointer-events="none"/>';
 if(lookTangentOutPoint&&lookKeyPoint)html+='<line data-camera-look-tangent-line="out" x1="'+lookKeyPoint.x+'" y1="'+lookKeyPoint.y+'" x2="'+lookTangentOutPoint.x+'" y2="'+lookTangentOutPoint.y+'" stroke="var(--accent)" opacity=".65" stroke-width="'+(lookTangentOut&&lookTangentOut.free?'1.1':'.7')+'" stroke-dasharray="'+(lookTangentOut&&lookTangentOut.free?'none':'3 1')+'" pointer-events="none"/><circle data-camera-look-tangent-handle="out" cx="'+lookTangentOutPoint.x+'" cy="'+lookTangentOutPoint.y+'" r="1.5" fill="var(--accent)" opacity=".85" pointer-events="none"/>';
 list.forEach(function(f){var p=C.mapPoint(f,spec);html+='<circle data-camera-map-dot="'+f.at+'" cx="'+p.x+'" cy="'+p.y+'" r="1.8" fill="currentColor" stroke="transparent" stroke-width="5" style="cursor:pointer;pointer-events:all"/>';});
 resolvedLooks.forEach(function(f){var p=C.mapPoint(f,spec);html+='<circle data-camera-look-map-dot="'+f.at+'" cx="'+p.x+'" cy="'+p.y+'" r="1.55" fill="var(--accent)" opacity=".65" stroke="transparent" stroke-width="5" style="cursor:pointer;pointer-events:all"/>';});
 html+='<circle data-camera-position cx="'+now.x+'" cy="'+now.y+'" r="3" fill="none" stroke="var(--accent)" stroke-width="1"/>';
 if(lookPoint)html+='<circle data-camera-look-position cx="'+lookPoint.x+'" cy="'+lookPoint.y+'" r="2.2" fill="var(--accent)" opacity=".8"/>';
 html+='</svg>';
 if(tangentInPoint)html+='<button type="button" class="btn tiny" data-camera-tension-handle="'+k.at+'" data-camera-tension-side="in" data-camera-handle-free="'+(tangentIn&&tangentIn.free?'true':'false')+'" aria-label="Editar entrada de curva" title="'+(tangentIn&&tangentIn.free?'Dirección libre · arrastrá en el mapa':'Automática · arrastrá para ajustar tensión')+'" style="position:absolute;left:'+tangentInPoint.x+'%;top:'+tangentInPoint.y+'%;transform:translate(-50%,-50%);touch-action:none;padding:1px 4px;border-radius:50%;z-index:19">◁</button>';
 if(tangentOutPoint)html+='<button type="button" class="btn tiny" data-camera-tension-handle="'+k.at+'" data-camera-tension-side="out" data-camera-handle-free="'+(tangentOut&&tangentOut.free?'true':'false')+'" aria-label="Editar salida de curva" title="'+(tangentOut&&tangentOut.free?'Dirección libre · arrastrá en el mapa':'Automática · arrastrá para ajustar tensión')+'" style="position:absolute;left:'+tangentOutPoint.x+'%;top:'+tangentOutPoint.y+'%;transform:translate(-50%,-50%);touch-action:none;padding:1px 4px;border-radius:50%;z-index:19">▷</button>';
 if(lk&&!lk.targetId&&lookTangentInPoint)html+='<button type="button" class="btn tiny" data-camera-look-tension-handle="'+lk.at+'" data-camera-look-tension-side="in" data-camera-look-handle-free="'+(lookTangentIn&&lookTangentIn.free?'true':'false')+'" aria-label="'+(lookTangentIn&&lookTangentIn.free?'Entrada libre del objetivo: arrastrar handle':'Entrada automática del objetivo: ajustar tensión')+'" title="'+(lookTangentIn&&lookTangentIn.free?'Entrada libre · arrastrá para dirigir la curva':'Entrada automática · arrastrá para ajustar tensión')+'" style="position:absolute;left:'+lookTangentInPoint.x+'%;top:'+lookTangentInPoint.y+'%;transform:translate(-50%,-50%);touch-action:none;padding:1px 4px;border-radius:50%;z-index:22;'+(lookTangentIn&&lookTangentIn.free?'outline:2px solid var(--accent);outline-offset:2px;':'')+'">◁</button>';
 if(lk&&!lk.targetId&&lookTangentOutPoint)html+='<button type="button" class="btn tiny" data-camera-look-tension-handle="'+lk.at+'" data-camera-look-tension-side="out" data-camera-look-handle-free="'+(lookTangentOut&&lookTangentOut.free?'true':'false')+'" aria-label="'+(lookTangentOut&&lookTangentOut.free?'Salida libre del objetivo: arrastrar handle':'Salida automática del objetivo: ajustar tensión')+'" title="'+(lookTangentOut&&lookTangentOut.free?'Salida libre · arrastrá para dirigir la curva':'Salida automática · arrastrá para ajustar tensión')+'" style="position:absolute;left:'+lookTangentOutPoint.x+'%;top:'+lookTangentOutPoint.y+'%;transform:translate(-50%,-50%);touch-action:none;padding:1px 4px;border-radius:50%;z-index:22;'+(lookTangentOut&&lookTangentOut.free?'outline:2px solid var(--accent);outline-offset:2px;':'')+'">▷</button>';
 html+='<button type="button" class="btn tiny" data-camera-map-point="'+k.at+'" aria-label="Mover encuadre '+k.at+'% en el mapa" style="position:absolute;left:'+point.x+'%;top:'+point.y+'%;transform:translate(-50%,-50%);touch-action:none;padding:3px;outline:2px solid var(--accent);z-index:20">◆</button>';
 if(lk&&lookKeyPoint)html+='<button type="button" class="btn tiny" data-camera-look-map-point="'+lk.at+'" aria-label="'+(lk.targetId?'Objetivo vinculado a un elemento':'Mover objetivo de mirada '+lk.at+'% en el mapa')+'"'+(lk.targetId?' disabled title="Desvinculá el elemento para mover este punto manualmente."':'')+' style="position:absolute;left:'+lookKeyPoint.x+'%;top:'+lookKeyPoint.y+'%;transform:translate(-50%,-50%);touch-action:none;padding:2px 5px;outline:2px dashed var(--accent);z-index:21">●</button>';
 html+='</div>';
 if(lookKeyPoint)html+='<p class="hint gh" data-camera-map-selection-label>◆ '+k.at+'% ↔ ● '+lk.at+'% · Distancia XYZ: '+Math.round(Math.hypot(k.x-resolvedLk.x,k.y-resolvedLk.y,k.z-resolvedLk.z))+' px. Guía comparativa, no vincula los recorridos.</p>';
 if(s.sdCameraResponsive)html+='<p class="hint gh">El mapa muestra el recorrido con el ancho de referencia.</p>';
 html+='<p class="hint gh" data-camera-position-label>'+mapLabel(current,progress(s))+'</p>';
 html+='<p class="hint gh">◆ encuadre seleccionado · ○ posición actual'+(tangentInPoint||tangentOutPoint?' · ◁ entrada / ▷ salida':'')+(cfg&&cfg.orientationMode==='lookAt'?' · ● objetivo seleccionado · línea punteada: recorrido de mirada'+(lookTangentInPoint||lookTangentOutPoint?' · ◁/▷ del ●: curva de mirada':''):'')+(cfg&&(cfg.pathMode==='smooth'||cfg.lookPathMode==='smooth')?' · Trazo destacado: tramo Bézier libre; trazo normal: Catmull-Rom':'')+'. Clic cerca de un punto: seleccionar · Doble clic línea normal: agregar ◆ · línea punteada: agregar ● · Arrastrá ◆ o ● · Arrastrá ◯: ajustar curva · Shift + arrastre: bloquear al eje dominante. Horizontal: X. Vertical: '+(spec.axis==='z'?'Z (arriba = adelante)':'Y (abajo = abajo)')+'. Flechas: 25 px; Shift + flecha: 100 px. Escape cancela. Escala: ±'+Math.round(spec.range)+' px.</p></details>';
 return html;
}
C.panel=function(s){
 var html=cRow('Cámara 3D',cSeg('sec.sdCameraEnabled',!!s.sdCameraEnabled,[['false','Desactivada'],['true','Activada']],'bool'));
 if(!s.sdCameraEnabled||!C.config(s))return html;
 var list=keys(s),k=choose(s,list);
 html+=cRow('Trayectoria','<select class="csel" data-camera-path-mode aria-label="Trayectoria de cámara"><option value="linear"'+((s.sdCameraPathMode==='smooth')?'':' selected')+'>Por tramos</option><option value="smooth"'+(s.sdCameraPathMode==='smooth'?' selected':'')+'>Curva suave</option></select>');
 if(s.sdCameraPathMode==='smooth')html+='<p class="hint gh">Los encuadres XYZ se convierten en puntos de una trayectoria continua. Las permanencias con dos posiciones iguales siguen siendo pausas reales.</p>';
 html+=cRow('Orientación','<select class="csel" data-camera-orientation-mode aria-label="Orientación de cámara"><option value="manual"'+(s.sdCameraOrientationMode==='lookAt'?'':' selected')+'>Ángulos manuales</option><option value="lookAt"'+(s.sdCameraOrientationMode==='lookAt'?' selected':'')+'>Mirar hacia</option></select>');
 if(s.sdCameraOrientationMode==='lookAt'){
  var lookList=lookKeys(s),lk=lookList.length?chooseLook(s,lookList):null;
  html+=cRow('Trayectoria de mirada','<select class="csel" data-camera-look-path-mode aria-label="Trayectoria del objetivo"><option value="linear"'+(s.sdCameraLookPathMode==='smooth'?'':' selected')+'>Por tramos</option><option value="smooth"'+(s.sdCameraLookPathMode==='smooth'?' selected':'')+'>Curva suave</option></select>');
  html+='<p class="hint gh">La posición de cámara y el punto que mira tienen recorridos y momentos independientes. El giro del horizonte sigue usando su ángulo manual.</p>';
  if(lookList.length){
   html+='<div style="margin:8px 8px 10px"><div style="position:relative;height:30px;border-bottom:2px dotted var(--line)">';
   lookList.forEach(function(f){html+='<button type="button" class="btn tiny" data-camera-look-jump="'+f.at+'" aria-label="Objetivo de mirada en '+f.at+' por ciento" style="position:absolute;left:'+f.at+'%;top:3px;transform:translateX(-50%);padding:3px;min-width:20px;'+(lk&&f.at===lk.at?'outline:2px solid var(--accent)':'')+'">●</button>';});
   html+='</div></div><button type="button" class="btn tiny" data-camera-look-add>Agregar objetivo aquí</button>';
   var targetEls=(s.elements||[]).filter(function(e){return C.targetEligible(e,s);}),targetFound=!lk.targetId||targetEls.some(function(e){return e.id===lk.targetId;});
   var targetOptions='<option value="">Punto XYZ</option>'+targetEls.map(function(e){return '<option value="'+safeLabel(e.id)+'"'+(lk.targetId===e.id?' selected':'')+'>'+targetLabel(e)+'</option>';}).join('');
   if(lk.targetId&&!targetFound)targetOptions+='<option value="'+safeLabel(lk.targetId)+'" selected>Elemento no disponible · usa respaldo XYZ</option>';
   html+=cRow('Objetivo de mirada','<select class="csel" data-camera-look-target data-camera-look-at="'+lk.at+'">'+targetOptions+'</select>');
   if(s.layout!=='free')html+='<p class="hint gh">“Mirar elemento” se habilita primero en Lienzo libre. En otras disposiciones, usá Punto XYZ.</p>';
   else if(lk.targetId)html+='<p class="hint gh">La cámara sigue el centro del elemento y sus keyframes X/Y/Z del Director. Elegí Punto XYZ para volver a editar el ● a mano.</p>';
   function lookField(label,key,value,min,max,step){return cRow(label,'<input class="cnum" type="number" aria-label="'+label+'" data-camera-look-field="'+key+'" data-camera-look-at="'+lk.at+'" value="'+value+'" min="'+min+'" max="'+max+'" step="'+step+'">');}
   html+=lookField('Momento objetivo (%)','at',lk.at,0,100,.1);
   if(!lk.targetId)['x','y','z'].forEach(function(axis){html+=lookField('Objetivo '+axis.toUpperCase(),axis,lk[axis],-4000,4000,25);});
   var lookIndex=lookList.findIndex(function(f){return f.at===lk.at;}),lookInFree=C.handleFree(lk,'in'),lookOutFree=C.handleFree(lk,'out');
   function lookModeRow(label,side,free){return cRow(label,'<select class="csel" data-camera-look-handle-mode data-camera-look-handle-side="'+side+'" data-camera-look-at="'+lk.at+'"><option value="auto"'+(free?'':' selected')+'>Automática</option><option value="free"'+(free?' selected':'')+'>Libre</option></select>');}
   function lookVectorRows(side){var p=side==='in'?'curveIn':'curveOut',name=side==='in'?'Entrada':'Salida',out='';['x','y','z'].forEach(function(axis){var prop=p+'D'+axis.toUpperCase();out+=cRow(name+' libre '+axis.toUpperCase()+' (px)','<input class="cnum" type="number" data-camera-look-handle-vector data-camera-look-handle-side="'+side+'" data-camera-look-handle-axis="'+axis+'" data-camera-look-at="'+lk.at+'" value="'+(+lk[prop]||0)+'" min="-4000" max="4000" step="25">');});return out;}
   if(s.sdCameraLookPathMode==='smooth'&&!lk.targetId&&lookIndex>0){
    var lookPrev=lookList[lookIndex-1];html+=lookModeRow('Dirección de entrada del objetivo','in',lookInFree);
    html+=cRow('Entrada del objetivo (%)','<input class="cnum" type="number" data-camera-look-incoming-tension data-camera-look-at="'+lk.at+'" value="'+(lookPrev.tension===undefined?0:lookPrev.tension)+'" min="-100" max="100" step="5"'+(lookInFree?' disabled':'')+'>');
    if(lookInFree)html+=lookVectorRows('in');
   }
   if(s.sdCameraLookPathMode==='smooth'&&!lk.targetId&&lookIndex>=0&&lookIndex<lookList.length-1){
    html+=lookModeRow('Dirección de salida del objetivo','out',lookOutFree);
    html+=cRow('Salida del objetivo (%)','<input class="cnum" type="number" data-camera-look-field="tension" data-camera-look-at="'+lk.at+'" value="'+(lk.tension===undefined?0:lk.tension)+'" min="-100" max="100" step="5"'+(lookOutFree?' disabled':'')+'>');
    if(lookOutFree)html+=lookVectorRows('out');
   }
   if(s.sdCameraLookPathMode==='smooth'&&lk.targetId)html+='<p class="hint gh">Los objetivos vinculados a elementos mantienen tangentes automáticas para seguir el movimiento del elemento sin offsets ambiguos. Elegí Punto XYZ para liberar sus handles.</p>';
   else if(s.sdCameraLookPathMode==='smooth'&&(lookIndex>0||lookIndex<lookList.length-1))html+='<p class="hint gh">Los handles del ● son independientes de los del ◆. Automática usa Catmull-Rom; Libre permite diseñar la trayectoria del objetivo en X/Y/Z.</p>';
   html+=cRow('Movimiento del objetivo','<select class="csel" data-camera-look-field="ease" data-camera-look-at="'+lk.at+'">'+[['linear','Directo'],['smooth','Suave'],['cinematic','Cinemático'],['ease-in','Acelerar'],['ease-out','Frenar'],['ease-in-out','Acelerar y frenar']].map(function(e){return '<option value="'+e[0]+'"'+((lk.ease||s.sdEase||'cinematic')===e[0]?' selected':'')+'>'+e[1]+'</option>';}).join('')+'</select>');
   html+='<button type="button" class="btn tiny" data-camera-look-delete="'+lk.at+'"'+(lookList.length<=1?' disabled':'')+'>Eliminar objetivo</button>';
  }else html+='<button type="button" class="btn tiny" data-camera-look-init>Crear objetivos desde los ángulos actuales</button>';
 }
 html+=cRow('Adaptar recorrido al ancho',cSeg('sec.sdCameraResponsive',!!s.sdCameraResponsive,[['false','No'],['true','Sí']],'bool'));
 if(s.sdCameraResponsive)html+=cRow('Ancho de referencia',cNum('sec.sdCameraReferenceWidth',C.config(s).referenceWidth,'px',{min:320,max:2400,step:100}))+'<p class="hint gh">En pantallas más angostas, reduce el recorrido, la profundidad y la perspectiva en la misma proporción. Conserva los valores guardados.</p>';
 html+='<button type="button" class="btn tiny" data-camera-first>Volver al primer encuadre</button>';
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
 var keyIndex=list.findIndex(function(f){return f.at===k.at;}),inFree=C.handleFree(k,'in'),outFree=C.handleFree(k,'out');
 function handleModeRow(label,side,free){return cRow(label,'<select class="csel" data-camera-handle-mode data-camera-handle-side="'+side+'" data-camera-at="'+k.at+'"><option value="auto"'+(free?'':' selected')+'>Automática</option><option value="free"'+(free?' selected':'')+'>Libre</option></select>');}
 function freeVectorRows(side){var p=side==='in'?'curveIn':'curveOut',name=side==='in'?'Entrada':'Salida',out='';['x','y','z'].forEach(function(axis){var keyName=p+'D'+axis.toUpperCase();out+=cRow(name+' libre '+axis.toUpperCase()+' (px)','<input class="cnum" type="number" data-camera-handle-vector data-camera-handle-side="'+side+'" data-camera-handle-axis="'+axis+'" data-camera-at="'+k.at+'" value="'+(+k[keyName]||0)+'" min="-4000" max="4000" step="25">');});return out;}
 if(s.sdCameraPathMode==='smooth'&&keyIndex>0){
  var prevKey=list[keyIndex-1];
  html+=handleModeRow('Dirección de entrada','in',inFree);
  html+=cRow('Entrada desde el anterior (%)','<input class="cnum" type="number" aria-label="Tensión de entrada desde el encuadre anterior" data-camera-incoming-tension data-camera-at="'+k.at+'" value="'+(prevKey.tension===undefined?0:prevKey.tension)+'" min="-100" max="100" step="5"'+(inFree?' disabled':'')+'>');
  if(inFree)html+=freeVectorRows('in');
 }
 if(s.sdCameraPathMode==='smooth'&&keyIndex>=0&&keyIndex<list.length-1){
  html+=handleModeRow('Dirección de salida','out',outFree);
  html+=cRow('Salida hacia el siguiente (%)','<input class="cnum" type="number" aria-label="Salida hacia el siguiente (%)" data-camera-field="tension" data-camera-at="'+k.at+'" value="'+(k.tension===undefined?0:k.tension)+'" min="-100" max="100" step="5"'+(outFree?' disabled':'')+'>');
  if(outFree)html+=freeVectorRows('out');
 }
 if(s.sdCameraPathMode==='smooth'&&(keyIndex>0||keyIndex<list.length-1)){
  html+='<p class="hint gh">Automática usa la tensión Catmull-Rom. Libre conserva la forma actual y permite inclinar el handle en X/Z o X/Y desde el mapa. Entrada y salida pueden liberarse por separado.</p>';
 }
 [['rotateX','Inclinar arriba / abajo (°)'],['rotateY','Mirar izquierda / derecha (°)'],['rotate','Girar el horizonte (°)']].forEach(function(axis){html+=field(axis[1],axis[0],k[axis[0]],-3600,3600,5);});
 html+='<p class="hint gh">'+(s.sdCameraOrientationMode==='lookAt'?'Con “Mirar hacia”, estos ángulos de inclinación quedan guardados pero X/Y se calculan desde el objetivo. El giro del horizonte sí permanece activo.':'Los ángulos se recorren tal como los escribís: 0° → 360° da una vuelta completa.')+'</p>';
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
  var cfg=C.config(s),lookDot=map.querySelector('[data-camera-look-position]'),look=cfg&&cfg.orientationMode==='lookAt'?C.lookTarget(cfg,pct/100,window.NAGWEB_STORY_MODEL,s.sdEase,previewReferenceSize(s)):null;
  if(lookDot&&look){var lp=C.mapPoint(look,spec);lookDot.setAttribute('cx',lp.x);lookDot.setAttribute('cy',lp.y);}
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
function pickSpatial(s,map,clientX,clientY){
 var cfg=C.config(s),r=map&&map.getBoundingClientRect();if(!cfg||!r||!r.width||!r.height)return false;
 var spec={range:+map.dataset.range||500,axis:map.dataset.plane==='front'?'y':'z',sign:map.dataset.plane==='front'?1:-1},size=previewReferenceSize(s),hits=[];
 function add(kind,k,point){var p=C.mapPoint(point,spec),x=r.left+p.x/100*r.width,y=r.top+p.y/100*r.height,d=Math.hypot(clientX-x,clientY-y);if(d<=18)hits.push({kind:kind,at:k.at,d:d});}
 keys(s).forEach(function(k){add('camera',k,k);});
 if(cfg.orientationMode==='lookAt'){var list=lookKeys(s),resolved=resolvedLookKeys(s,cfg,list,size);list.forEach(function(k,i){add('look',k,resolved[i]||k);});}
 if(!hits.length)return false;
 hits.sort(function(a,b){return a.d-b.d;});
 var near=hits.filter(function(h){return h.d<=hits[0].d+2;}),cameraAt=selected[s.id],lookAt=lookSelected[s.id];
 var best=near.find(function(h){return h.kind==='camera'?h.at!==cameraAt:h.at!==lookAt;})||near[0];
 if(best.kind==='look')jumpLook(s,best.at);else jump(s,best.at);
 return true;
}
function insertOnPath(s,map,clientX,clientY){
 var cfg=C.config(s),r=map&&map.getBoundingClientRect(),list=keys(s);if(!cfg||!r||!r.width||!r.height||list.length>=128)return false;
 var spec={range:+map.dataset.range||500,axis:map.dataset.plane==='front'?'y':'z',sign:map.dataset.plane==='front'?1:-1};
 var point={x:(clientX-r.left)/r.width*100,y:(clientY-r.top)/r.height*100},sx=r.width/100,sy=r.height/100,nearKey=null;
 list.forEach(function(k){var p=C.mapPoint(k,spec),d=Math.hypot((point.x-p.x)*sx,(point.y-p.y)*sy);if(d<=8&&(!nearKey||d<nearKey.distance))nearKey={at:k.at,distance:d};});
 if(nearKey){jump(s,nearKey.at);return true;}
 var draw=C.pathSamples(Object.assign({},cfg,{frames:list}),window.NAGWEB_STORY_MODEL,s.sdEase,128);
 var hit=C.nearestPathAt(draw,spec,point,{x:sx,y:sy});
 if(!hit||hit.distance>14)return false;
 var at=Math.round(Math.max(0,Math.min(100,hit.at))*10)/10,existing=list.find(function(k){return k.at===at;});
 if(existing){jump(s,at);return true;}
 var pathCfg=Object.assign({},cfg,{frames:list}),v=C.pose(pathCfg,at/100,window.NAGWEB_STORY_MODEL,s.sdEase,false,undefined,previewReferenceSize(s));
 var source=list[0];for(var i=0;i<list.length;i++){if(list[i].at<=at)source=list[i];else break;}
 var frame=Object.assign({at:at,ease:source.ease||s.sdEase||'cinematic'},v);
 if(cfg.pathMode==='smooth'&&source.tension!==undefined)frame.tension=source.tension;
 snapshot();list.push(frame);persist(s,list,at);toast('Encuadre agregado sobre la trayectoria.');return true;
}
function insertLookOnPath(s,map,clientX,clientY){
 var cfg=C.config(s),r=map&&map.getBoundingClientRect(),list=lookKeys(s);if(!cfg||cfg.orientationMode!=='lookAt'||!r||!r.width||!r.height||!list.length||list.length>=128)return false;
 var spec={range:+map.dataset.range||500,axis:map.dataset.plane==='front'?'y':'z',sign:map.dataset.plane==='front'?1:-1},size=previewReferenceSize(s);
 var point={x:(clientX-r.left)/r.width*100,y:(clientY-r.top)/r.height*100},sx=r.width/100,sy=r.height/100,lookCfg=Object.assign({},cfg,{lookFrames:list}),resolved=resolvedLookKeys(s,lookCfg,list,size),nearKey=null;
 resolved.forEach(function(k,i){var p=C.mapPoint(k,spec),d=Math.hypot((point.x-p.x)*sx,(point.y-p.y)*sy);if(d<=8&&(!nearKey||d<nearKey.distance))nearKey={at:list[i].at,distance:d};});
 if(nearKey){jumpLook(s,nearKey.at);return true;}
 var draw=C.lookSamples(lookCfg,window.NAGWEB_STORY_MODEL,s.sdEase,128,size),hit=C.nearestPathAt(draw,spec,point,{x:sx,y:sy});
 if(!hit||hit.distance>14)return false;
 var at=Math.round(Math.max(0,Math.min(100,hit.at))*10)/10,existing=list.find(function(k){return k.at===at;});
 if(existing){jumpLook(s,at);return true;}
 var target=C.lookTarget(lookCfg,at/100,window.NAGWEB_STORY_MODEL,s.sdEase,size);if(!target)return false;
 var source=list[0];for(var i=0;i<list.length;i++){if(list[i].at<=at)source=list[i];else break;}
 snapshot();list.push({at:at,x:target.x,y:target.y,z:target.z,ease:source.ease||s.sdEase||'cinematic'});persistLook(s,list,at);toast('Objetivo agregado sobre la trayectoria de mirada.');return true;
}
function tensionCommit(s,at,value,side){
 if(sec()!==s||!C.config(s))return false;
 side=side==='in'?'in':'out';var list=keys(s),i=list.findIndex(function(k){return k.at===at;}),owner=side==='in'?i-1:i,next=C.curveTension(value);if(i<0||owner<0||owner>=list.length-1)return false;
 var k=list[owner],current=k.tension===undefined?0:C.curveTension(k.tension);if(current===next)return false;
 snapshot();k.tension=next;persist(s,list,at);return true;
}
function freeHandleCommit(s,at,side,point){
 if(sec()!==s||!C.config(s))return false;
 var list=keys(s),before=C.tangentHandle(list,at,side),next=C.setFreeHandle(list,at,side,point),after=C.tangentHandle(next,at,side);
 if(!before||!after||Math.hypot(before.x-after.x,before.y-after.y,before.z-after.z)<.0001)return false;
 snapshot();persist(s,next,at);return true;
}
function freeHandleDrag(ev,button){
 var s=sec(),cfg=C.config(s);if(!cfg||cfg.pathMode!=='smooth')return;
 var map=button.closest('[data-camera-map]'),r=map&&map.getBoundingClientRect(),list=keys(s),at=+button.dataset.cameraTensionHandle,side=button.dataset.cameraTensionSide==='in'?'in':'out',key=list.find(function(k){return k.at===at;}),original=C.tangentHandle(list,at,side);
 if(!map||!r.width||!r.height||!key||!original||!original.free)return;
 var spec={range:+map.dataset.range||500,axis:map.dataset.plane==='front'?'y':'z',sign:map.dataset.plane==='front'?1:-1},next=original,moved=false,done=false;
 ev.preventDefault();ev.stopPropagation();button.focus();button.setPointerCapture(ev.pointerId);
 function move(e){
  if(e.pointerId!==ev.pointerId)return;
  var rawX=e.clientX-ev.clientX,rawY=e.clientY-ev.clientY;if(Math.hypot(rawX,rawY)>=3)moved=true;
  if(e.shiftKey){if(Math.abs(rawX)>=Math.abs(rawY))rawY=0;else rawX=0;}
  var cx=ev.clientX+rawX,cy=ev.clientY+rawY,nx=(cx-r.left)/r.width,ny=(cy-r.top)/r.height,probe={x:(nx*2-1)*spec.range,y:original.y,z:original.z};
  probe[spec.axis]=((ny*2-1)*spec.range)/spec.sign;next=probe;
  var temp=C.setFreeHandle(list,at,side,next);mapDraw(map,temp,spec,s);
 }
 function finish(e,cancel){
  if(done||e.pointerId!=null&&e.pointerId!==ev.pointerId)return;done=true;
  if(!cancel&&e.clientX!=null)move(e);
  button.removeEventListener('pointermove',move);button.removeEventListener('pointerup',up);button.removeEventListener('pointercancel',abort);button.removeEventListener('lostpointercapture',abort);button.removeEventListener('keydown',keyDown);
  if(button.hasPointerCapture(ev.pointerId))button.releasePointerCapture(ev.pointerId);
  if(cancel||!moved||!freeHandleCommit(s,at,side,next))renderPane();
 }
 function up(e){finish(e,false);}function abort(e){finish(e,true);}function keyDown(e){if(e.key==='Escape'){e.preventDefault();e.stopPropagation();finish(e,true);}}
 button.addEventListener('pointermove',move);button.addEventListener('pointerup',up);button.addEventListener('pointercancel',abort);button.addEventListener('lostpointercapture',abort);button.addEventListener('keydown',keyDown);
}
function freeHandleKey(ev,button){
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].indexOf(ev.key)<0)return;
 var s=sec(),list=keys(s),at=+button.dataset.cameraTensionHandle,side=button.dataset.cameraTensionSide==='in'?'in':'out',map=button.closest('[data-camera-map]'),h=C.tangentHandle(list,at,side);if(!map||!h||!h.free)return;
 ev.preventDefault();ev.stopPropagation();
 var spec={axis:map.dataset.plane==='front'?'y':'z',sign:map.dataset.plane==='front'?1:-1,range:+map.dataset.range||500},amount=ev.shiftKey?100:25,unit=amount/(spec.range*2),dx=ev.key==='ArrowRight'?unit:ev.key==='ArrowLeft'?-unit:0,dy=ev.key==='ArrowDown'?unit:ev.key==='ArrowUp'?-unit:0,next=C.moveSpatial(h,spec,dx,dy);
 if(freeHandleCommit(s,at,side,next)){var n=document.getElementById('pane').querySelector('[data-camera-tension-handle][data-camera-tension-side="'+side+'"]');if(n)n.focus();}
}
function tensionDrag(ev,button){
 var s=sec(),cfg=C.config(s);if(!cfg||cfg.pathMode!=='smooth')return;
 var map=button.closest('[data-camera-map]'),r=map&&map.getBoundingClientRect(),list=keys(s),at=+button.dataset.cameraTensionHandle,side=button.dataset.cameraTensionSide==='in'?'in':'out',i=list.findIndex(function(k){return k.at===at;}),owner=side==='in'?i-1:i,k=list[i],ownerKey=list[owner];
 if(!map||!r.width||!r.height||!k||!ownerKey||!C.tangentHandle(list,at,side))return;
 var spec={range:+map.dataset.range||500,axis:map.dataset.plane==='front'?'y':'z',sign:map.dataset.plane==='front'?1:-1},original=ownerKey.tension===undefined?0:C.curveTension(ownerKey.tension),next=original,moved=false,done=false;
 ev.preventDefault();ev.stopPropagation();button.focus();button.setPointerCapture(ev.pointerId);
 function move(e){
  if(e.pointerId!==ev.pointerId)return;
  if(Math.hypot(e.clientX-ev.clientX,e.clientY-ev.clientY)>=3)moved=true;
  var nx=(e.clientX-r.left)/r.width,ny=(e.clientY-r.top)/r.height,probe={x:(nx*2-1)*spec.range,y:k.y,z:k.z};
  probe[spec.axis]=((ny*2-1)*spec.range)/spec.sign;
  var value=C.tensionFromHandle(list,at,spec,probe,side);if(value===null)return;next=value;
  var temp=list.map(function(f,idx){return idx===owner?Object.assign({},f,{tension:next}):f;}),th=C.tangentHandle(temp,at,side);
  if(th){var hp=C.mapPoint(th,spec);button.style.left=hp.x+'%';button.style.top=hp.y+'%';}
  var input=document.querySelector('[data-camera-field="tension"][data-camera-at="'+ownerKey.at+'"]');if(input)input.value=next;
  mapDraw(map,temp,spec,s);
 }
 function finish(e,cancel){
  if(done||e.pointerId!=null&&e.pointerId!==ev.pointerId)return;done=true;
  if(!cancel&&e.clientX!=null)move(e);
  button.removeEventListener('pointermove',move);button.removeEventListener('pointerup',up);button.removeEventListener('pointercancel',abort);button.removeEventListener('lostpointercapture',abort);button.removeEventListener('keydown',key);
  if(button.hasPointerCapture(ev.pointerId))button.releasePointerCapture(ev.pointerId);
  if(cancel||!moved||!tensionCommit(s,at,next,side))renderPane();
 }
 function up(e){finish(e,false);}function abort(e){finish(e,true);}function key(e){if(e.key==='Escape'){e.preventDefault();e.stopPropagation();finish(e,true);}}
 button.addEventListener('pointermove',move);button.addEventListener('pointerup',up);button.addEventListener('pointercancel',abort);button.addEventListener('lostpointercapture',abort);button.addEventListener('keydown',key);
}
function tensionKey(ev,button){
 var keysAllowed=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'];if(keysAllowed.indexOf(ev.key)<0)return;
 var s=sec(),list=keys(s),at=+button.dataset.cameraTensionHandle,side=button.dataset.cameraTensionSide==='in'?'in':'out',i=list.findIndex(function(k){return k.at===at;}),owner=side==='in'?i-1:i,k=list[owner];if(!k)return;
 ev.preventDefault();ev.stopPropagation();var current=k.tension===undefined?0:C.curveTension(k.tension),next;
 if(ev.key==='Home')next=0;else next=current+((ev.key==='ArrowRight'||ev.key==='ArrowUp')?1:-1)*(ev.shiftKey?20:5);
 if(tensionCommit(s,at,next,side)){var n=document.getElementById('pane').querySelector('[data-camera-tension-handle][data-camera-tension-side="'+side+'"]');if(n)n.focus();}
}
function lookTensionCommit(s,at,value,side){
 if(sec()!==s||!C.config(s))return false;side=side==='in'?'in':'out';
 var list=lookKeys(s),i=list.findIndex(function(k){return k.at===at;}),owner=side==='in'?i-1:i,next=C.curveTension(value);if(i<0||owner<0||owner>=list.length-1)return false;
 var k=list[owner],current=k.tension===undefined?0:C.curveTension(k.tension);if(current===next)return false;snapshot();k.tension=next;persistLook(s,list,at);return true;
}
function lookFreeHandleCommit(s,at,side,point){
 if(sec()!==s||!C.config(s))return false;var list=lookKeys(s),key=list.find(function(k){return k.at===at;});if(!key||key.targetId)return false;
 var before=C.lookTangentHandle(list,at,side),next=C.setLookFreeHandle(list,at,side,point),after=C.lookTangentHandle(next,at,side);
 if(!before||!after||Math.hypot(before.x-after.x,before.y-after.y,before.z-after.z)<.0001)return false;snapshot();persistLook(s,next,at);return true;
}
function lookFreeHandleDrag(ev,button){
 var s=sec(),cfg=C.config(s);if(!cfg||cfg.orientationMode!=='lookAt'||cfg.lookPathMode!=='smooth')return;
 var map=button.closest('[data-camera-map]'),r=map&&map.getBoundingClientRect(),list=lookKeys(s),at=+button.dataset.cameraLookTensionHandle,side=button.dataset.cameraLookTensionSide==='in'?'in':'out',key=list.find(function(k){return k.at===at;}),original=C.lookTangentHandle(list,at,side);
 if(!map||!r.width||!r.height||!key||key.targetId||!original||!original.free)return;
 var spec={range:+map.dataset.range||500,axis:map.dataset.plane==='front'?'y':'z',sign:map.dataset.plane==='front'?1:-1},next=original,moved=false,done=false;
 ev.preventDefault();ev.stopPropagation();button.focus();button.setPointerCapture(ev.pointerId);
 function move(e){if(e.pointerId!==ev.pointerId)return;var rawX=e.clientX-ev.clientX,rawY=e.clientY-ev.clientY;if(Math.hypot(rawX,rawY)>=3)moved=true;if(e.shiftKey){if(Math.abs(rawX)>=Math.abs(rawY))rawY=0;else rawX=0;}var cx=ev.clientX+rawX,cy=ev.clientY+rawY,nx=(cx-r.left)/r.width,ny=(cy-r.top)/r.height,probe={x:(nx*2-1)*spec.range,y:original.y,z:original.z};probe[spec.axis]=((ny*2-1)*spec.range)/spec.sign;next=probe;mapDraw(map,keys(s),spec,s,C.setLookFreeHandle(list,at,side,next));}
 function finish(e,cancel){if(done||e.pointerId!=null&&e.pointerId!==ev.pointerId)return;done=true;if(!cancel&&e.clientX!=null)move(e);button.removeEventListener('pointermove',move);button.removeEventListener('pointerup',up);button.removeEventListener('pointercancel',abort);button.removeEventListener('lostpointercapture',abort);button.removeEventListener('keydown',keyDown);if(button.hasPointerCapture(ev.pointerId))button.releasePointerCapture(ev.pointerId);if(cancel||!moved||!lookFreeHandleCommit(s,at,side,next))renderPane();}
 function up(e){finish(e,false);}function abort(e){finish(e,true);}function keyDown(e){if(e.key==='Escape'){e.preventDefault();e.stopPropagation();finish(e,true);}}
 button.addEventListener('pointermove',move);button.addEventListener('pointerup',up);button.addEventListener('pointercancel',abort);button.addEventListener('lostpointercapture',abort);button.addEventListener('keydown',keyDown);
}
function lookFreeHandleKey(ev,button){
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].indexOf(ev.key)<0)return;var s=sec(),list=lookKeys(s),at=+button.dataset.cameraLookTensionHandle,side=button.dataset.cameraLookTensionSide==='in'?'in':'out',map=button.closest('[data-camera-map]'),h=C.lookTangentHandle(list,at,side),key=list.find(function(k){return k.at===at;});if(!map||!h||!h.free||!key||key.targetId)return;
 ev.preventDefault();ev.stopPropagation();var spec={axis:map.dataset.plane==='front'?'y':'z',sign:map.dataset.plane==='front'?1:-1,range:+map.dataset.range||500},amount=ev.shiftKey?100:25,unit=amount/(spec.range*2),dx=ev.key==='ArrowRight'?unit:ev.key==='ArrowLeft'?-unit:0,dy=ev.key==='ArrowDown'?unit:ev.key==='ArrowUp'?-unit:0,next=C.moveSpatial(h,spec,dx,dy);
 if(lookFreeHandleCommit(s,at,side,next)){var n=document.getElementById('pane').querySelector('[data-camera-look-tension-handle][data-camera-look-tension-side="'+side+'"]');if(n)n.focus();}
}
function lookTensionDrag(ev,button){
 var s=sec(),cfg=C.config(s);if(!cfg||cfg.orientationMode!=='lookAt'||cfg.lookPathMode!=='smooth')return;
 var map=button.closest('[data-camera-map]'),r=map&&map.getBoundingClientRect(),list=lookKeys(s),at=+button.dataset.cameraLookTensionHandle,side=button.dataset.cameraLookTensionSide==='in'?'in':'out',i=list.findIndex(function(k){return k.at===at;}),owner=side==='in'?i-1:i,key=list[i],ownerKey=list[owner];
 if(!map||!r.width||!r.height||!key||key.targetId||!ownerKey||!C.lookTangentHandle(list,at,side))return;
 var spec={range:+map.dataset.range||500,axis:map.dataset.plane==='front'?'y':'z',sign:map.dataset.plane==='front'?1:-1},original=ownerKey.tension===undefined?0:C.curveTension(ownerKey.tension),next=original,moved=false,done=false;
 ev.preventDefault();ev.stopPropagation();button.focus();button.setPointerCapture(ev.pointerId);
 function move(e){if(e.pointerId!==ev.pointerId)return;if(Math.hypot(e.clientX-ev.clientX,e.clientY-ev.clientY)>=3)moved=true;var nx=(e.clientX-r.left)/r.width,ny=(e.clientY-r.top)/r.height,probe={x:(nx*2-1)*spec.range,y:key.y,z:key.z};probe[spec.axis]=((ny*2-1)*spec.range)/spec.sign;var value=C.lookTensionFromHandle(list,at,spec,probe,side);if(value===null)return;next=value;var temp=list.map(function(f,idx){return idx===owner?Object.assign({},f,{tension:next}):f;});mapDraw(map,keys(s),spec,s,temp);}
 function finish(e,cancel){if(done||e.pointerId!=null&&e.pointerId!==ev.pointerId)return;done=true;if(!cancel&&e.clientX!=null)move(e);button.removeEventListener('pointermove',move);button.removeEventListener('pointerup',up);button.removeEventListener('pointercancel',abort);button.removeEventListener('lostpointercapture',abort);button.removeEventListener('keydown',keyDown);if(button.hasPointerCapture(ev.pointerId))button.releasePointerCapture(ev.pointerId);if(cancel||!moved||!lookTensionCommit(s,at,next,side))renderPane();}
 function up(e){finish(e,false);}function abort(e){finish(e,true);}function keyDown(e){if(e.key==='Escape'){e.preventDefault();e.stopPropagation();finish(e,true);}}
 button.addEventListener('pointermove',move);button.addEventListener('pointerup',up);button.addEventListener('pointercancel',abort);button.addEventListener('lostpointercapture',abort);button.addEventListener('keydown',keyDown);
}
function lookTensionKey(ev,button){
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].indexOf(ev.key)<0)return;var s=sec(),list=lookKeys(s),at=+button.dataset.cameraLookTensionHandle,side=button.dataset.cameraLookTensionSide==='in'?'in':'out',i=list.findIndex(function(k){return k.at===at;}),owner=side==='in'?i-1:i,k=list[owner];if(!k)return;
 ev.preventDefault();ev.stopPropagation();var current=k.tension===undefined?0:C.curveTension(k.tension),next=ev.key==='Home'?0:current+((ev.key==='ArrowRight'||ev.key==='ArrowUp')?1:-1)*(ev.shiftKey?20:5);if(lookTensionCommit(s,at,next,side)){var n=document.getElementById('pane').querySelector('[data-camera-look-tension-handle][data-camera-look-tension-side="'+side+'"]');if(n)n.focus();}
}
function lookSpatialCommit(s,original,next){
 if(sec()!==s||!C.config(s))return false;
 var list=lookKeys(s),i=list.findIndex(function(k){return k.at===original.at;});
 if(i<0||list[i].x===next.x&&list[i].y===next.y&&list[i].z===next.z)return false;
 snapshot();list[i]=next;persistLook(s,list,next.at);return true;
}
function lookSpatialDrag(ev,button){
 var s=sec(),cfg=C.config(s);if(!cfg||cfg.orientationMode!=='lookAt')return;
 var map=button.closest('[data-camera-map]'),r=map.getBoundingClientRect(),looks=lookKeys(s),original=looks.find(function(k){return k.at===+button.dataset.cameraLookMapPoint;});
 if(!original||!r.width||!r.height)return;
 var spec={range:+map.dataset.range,axis:map.dataset.plane==='front'?'y':'z',sign:map.dataset.plane==='front'?1:-1},next=original,done=false,moved=false;
 ev.preventDefault();button.focus();button.setPointerCapture(ev.pointerId);
 function move(e){if(e.pointerId!==ev.pointerId)return;var rawX=e.clientX-ev.clientX,rawY=e.clientY-ev.clientY;if(Math.hypot(rawX,rawY)>=3)moved=true;var px=rawX,py=rawY;if(e.shiftKey){if(Math.abs(px)>=Math.abs(py))py=0;else px=0;}next=C.moveSpatial(original,spec,px/r.width,py/r.height);var p=C.mapPoint(next,spec);button.style.left=p.x+'%';button.style.top=p.y+'%';mapDraw(map,keys(s),spec,s,looks.map(function(k){return k.at===original.at?next:k;}));}
 function finish(e,cancel){
  if(done||e.pointerId!=null&&e.pointerId!==ev.pointerId)return;done=true;
  if(!cancel&&e.clientX!=null)move(e);
  button.removeEventListener('pointermove',move);button.removeEventListener('pointerup',up);button.removeEventListener('pointercancel',abort);button.removeEventListener('lostpointercapture',abort);button.removeEventListener('keydown',key);
  if(button.hasPointerCapture(ev.pointerId))button.releasePointerCapture(ev.pointerId);
  if(!cancel&&!moved&&e.clientX!=null){pickSpatial(s,map,e.clientX,e.clientY);return;}
  if(cancel||!lookSpatialCommit(s,original,next)){var p=C.mapPoint(original,spec);button.style.left=p.x+'%';button.style.top=p.y+'%';mapDraw(map,keys(s),spec,s,looks);}
 }
 function up(e){finish(e,false);}function abort(e){finish(e,true);}function key(e){if(e.key==='Escape'){e.preventDefault();e.stopPropagation();finish(e,true);}}
 button.addEventListener('pointermove',move);button.addEventListener('pointerup',up);button.addEventListener('pointercancel',abort);button.addEventListener('lostpointercapture',abort);button.addEventListener('keydown',key);
}
function spatialDrag(ev,button){
 var s=sec();if(!C.config(s))return;
 var map=button.closest('[data-camera-map]'),r=map.getBoundingClientRect(),list=keys(s),original=list.find(function(k){return k.at===+button.dataset.cameraMapPoint;});
 if(!original||!r.width||!r.height)return;
 var spec={range:+map.dataset.range,axis:map.dataset.plane==='front'?'y':'z',sign:map.dataset.plane==='front'?1:-1},next=original,done=false,moved=false;
 ev.preventDefault();button.focus();button.setPointerCapture(ev.pointerId);
 function move(e){if(e.pointerId!==ev.pointerId)return;var rawX=e.clientX-ev.clientX,rawY=e.clientY-ev.clientY;if(Math.hypot(rawX,rawY)>=3)moved=true;var px=rawX,py=rawY;if(e.shiftKey){if(Math.abs(px)>=Math.abs(py))py=0;else px=0;}next=C.moveSpatial(original,spec,px/r.width,py/r.height);var p=C.mapPoint(next,spec);button.style.left=p.x+'%';button.style.top=p.y+'%';mapDraw(map,list.map(function(k){return k.at===original.at?next:k;}),spec,s);}
 function finish(e,cancel){
  if(done||e.pointerId!=null&&e.pointerId!==ev.pointerId)return;done=true;
  if(!cancel&&e.clientX!=null)move(e);
  button.removeEventListener('pointermove',move);button.removeEventListener('pointerup',up);button.removeEventListener('pointercancel',abort);button.removeEventListener('lostpointercapture',abort);button.removeEventListener('keydown',key);
  if(button.hasPointerCapture(ev.pointerId))button.releasePointerCapture(ev.pointerId);
  if(!cancel&&!moved&&e.clientX!=null){pickSpatial(s,map,e.clientX,e.clientY);return;}
  if(cancel||!spatialCommit(s,original,next)){var p=C.mapPoint(original,spec);button.style.left=p.x+'%';button.style.top=p.y+'%';mapDraw(map,list,spec,s);}
 }
 function up(e){finish(e,false);}function abort(e){finish(e,true);}function key(e){if(e.key==='Escape'){e.preventDefault();e.stopPropagation();finish(e,true);}}
 button.addEventListener('pointermove',move);button.addEventListener('pointerup',up);button.addEventListener('pointercancel',abort);button.addEventListener('lostpointercapture',abort);button.addEventListener('keydown',key);
}
function spatialKey(ev,button){
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].indexOf(ev.key)<0)return;
 var s=sec();if(!C.config(s))return;var map=button.closest('[data-camera-map]'),spec={axis:map.dataset.plane==='front'?'y':'z',sign:map.dataset.plane==='front'?1:-1,range:+map.dataset.range||500};
 var k=keys(s).find(function(k){return k.at===+button.dataset.cameraMapPoint;});if(!k)return;
 ev.preventDefault();ev.stopPropagation();var amount=ev.shiftKey?100:25,unit=amount/(spec.range*2),dx=ev.key==='ArrowRight'?unit:ev.key==='ArrowLeft'?-unit:0,dy=ev.key==='ArrowDown'?unit:ev.key==='ArrowUp'?-unit:0;
 if(spatialCommit(s,k,C.moveSpatial(k,spec,dx,dy))){var n=document.getElementById('pane').querySelector('[data-camera-map-point]');if(n)n.focus();}
}
function lookSpatialKey(ev,button){
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].indexOf(ev.key)<0)return;
 var s=sec(),cfg=C.config(s);if(!cfg||cfg.orientationMode!=='lookAt')return;var map=button.closest('[data-camera-map]'),spec={axis:map.dataset.plane==='front'?'y':'z',sign:map.dataset.plane==='front'?1:-1,range:+map.dataset.range||500};
 var k=lookKeys(s).find(function(k){return k.at===+button.dataset.cameraLookMapPoint;});if(!k)return;
 ev.preventDefault();ev.stopPropagation();var amount=ev.shiftKey?100:25,unit=amount/(spec.range*2),dx=ev.key==='ArrowRight'?unit:ev.key==='ArrowLeft'?-unit:0,dy=ev.key==='ArrowDown'?unit:ev.key==='ArrowUp'?-unit:0;
 if(lookSpatialCommit(s,k,C.moveSpatial(k,spec,dx,dy))){var n=document.getElementById('pane').querySelector('[data-camera-look-map-point]');if(n)n.focus();}
}
var pane=document.getElementById('pane');
if(pane){
 pane.addEventListener('toggle',function(ev){if(ev.target.matches('[data-camera-map-box]'))mapOpen[sec().id]=ev.target.open;},true);
 pane.addEventListener('input',function(ev){
  if(!ev.target.matches('[data-camera-seek]'))return;
  var s=sec();if(C.config(s))window.NAGWEB_SCROLL_DIRECTOR.scrub(s.id,+ev.target.value/100);
 });
 pane.addEventListener('dblclick',function(ev){
  if(ev.button!==undefined&&ev.button!==0)return;
  var map=ev.target.closest('[data-camera-map]');if(!map)return;
  var lookPath=ev.target.closest('[data-camera-look-map-path-hit],[data-camera-look-map-path]');
  if(lookPath&&insertLookOnPath(sec(),map,ev.clientX,ev.clientY)){ev.preventDefault();ev.stopPropagation();return;}
  if(ev.target.closest('[data-camera-map-point],[data-camera-look-map-point],[data-camera-tension-handle],[data-camera-look-tension-handle],[data-camera-map-dot],[data-camera-look-map-dot],[data-camera-position],[data-camera-look-position]'))return;
  if(insertOnPath(sec(),map,ev.clientX,ev.clientY)){ev.preventDefault();ev.stopPropagation();}
 });
 pane.addEventListener('pointerdown',function(ev){
  if(ev.button!==0)return;
  var tensionHandle=ev.target.closest('[data-camera-tension-handle]');if(tensionHandle){if(tensionHandle.dataset.cameraHandleFree==='true')freeHandleDrag(ev,tensionHandle);else tensionDrag(ev,tensionHandle);return;}
  var lookCurveHandle=ev.target.closest('[data-camera-look-tension-handle]');if(lookCurveHandle){if(lookCurveHandle.dataset.cameraLookHandleFree==='true')lookFreeHandleDrag(ev,lookCurveHandle);else lookTensionDrag(ev,lookCurveHandle);return;}
  var lookSpatial=ev.target.closest('[data-camera-look-map-point]');if(lookSpatial){lookSpatialDrag(ev,lookSpatial);return;}
  var spatial=ev.target.closest('[data-camera-map-point]');if(spatial){spatialDrag(ev,spatial);return;}
  var mapDot=ev.target.closest('[data-camera-look-map-dot],[data-camera-map-dot]'),spatialMapNode=ev.target.closest('[data-camera-map]');
  if(mapDot&&spatialMapNode&&pickSpatial(sec(),spatialMapNode,ev.clientX,ev.clientY)){ev.preventDefault();ev.stopPropagation();return;}
  if(spatialMapNode&&pickSpatial(sec(),spatialMapNode,ev.clientX,ev.clientY)){ev.preventDefault();ev.stopPropagation();return;}
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
  var tensionHandle=ev.target.closest('[data-camera-tension-handle]');if(tensionHandle){if(tensionHandle.dataset.cameraHandleFree==='true')freeHandleKey(ev,tensionHandle);else tensionKey(ev,tensionHandle);return;}
  var lookCurveHandle=ev.target.closest('[data-camera-look-tension-handle]');if(lookCurveHandle){if(lookCurveHandle.dataset.cameraLookHandleFree==='true')lookFreeHandleKey(ev,lookCurveHandle);else lookTensionKey(ev,lookCurveHandle);return;}
  var lookSpatial=ev.target.closest('[data-camera-look-map-point]');if(lookSpatial){lookSpatialKey(ev,lookSpatial);return;}
  var spatial=ev.target.closest('[data-camera-map-point]');if(spatial){spatialKey(ev,spatial);return;}
  var button=ev.target.closest('[data-camera-jump]');if(!button||['ArrowLeft','ArrowRight'].indexOf(ev.key)<0)return;
  var s=sec();if(!C.config(s))return;ev.preventDefault();ev.stopPropagation();
  var from=+button.dataset.cameraJump,to=Math.round(Math.max(0,Math.min(100,from+(ev.key==='ArrowLeft'?-1:1)*(ev.shiftKey?10:1)))*10)/10;
  if(retime(s,from,to)){var next=pane.querySelector('[data-camera-jump="'+to+'"]');if(next)next.focus();}
 });
 pane.addEventListener('click',function(ev){
  var button=ev.target.closest('[data-camera-jump],[data-camera-add],[data-camera-delete],[data-camera-first],[data-camera-copy],[data-camera-hold],[data-camera-preset],[data-camera-look-jump],[data-camera-look-add],[data-camera-look-delete],[data-camera-look-init]');if(!button)return;
  if(button===suppressedClick){suppressedClick=null;return;}
  var s=sec(),cfg=C.config(s);if(!cfg)return;var list=keys(s);
  if(button.dataset.cameraLookInit!==undefined){
   var generated=C.defaultLookFrames(cfg,window.NAGWEB_STORY_MODEL,s.sdEase,1000);if(!generated.length)return;
   snapshot();s.sdCameraLookFrames=generated;s.sdCameraLookPathMode=s.sdCameraPathMode==='smooth'?'smooth':'linear';lookSelected[s.id]=generated[0].at;saveProject();renderPane();schedulePreview();return;
  }
  if(button.dataset.cameraLookJump!==undefined){jumpLook(s,+button.dataset.cameraLookJump);return;}
  if(button.dataset.cameraLookAdd!==undefined){
   var lookList=lookKeys(s),lat=Math.round(progress(s)*10)/10;
   if(lookList.some(function(k){return k.at===lat;})){jumpLook(s,lat);return;}
   if(lookList.length>=128){toast('Máximo: 128 objetivos de mirada.');return;}
   var target=C.lookTarget(cfg,lat/100,window.NAGWEB_STORY_MODEL,s.sdEase);
   if(!target){var manualPose=C.pose(Object.assign({},cfg,{orientationMode:'manual'}),lat/100,window.NAGWEB_STORY_MODEL,s.sdEase,false);target=C.forwardTarget(manualPose,1000);}
   snapshot();lookList.push({at:lat,x:target.x,y:target.y,z:target.z,ease:s.sdEase||'cinematic'});persistLook(s,lookList,lat);return;
  }
  if(button.dataset.cameraLookDelete!==undefined){
   var deleteList=lookKeys(s);if(deleteList.length<=1)return;
   snapshot();deleteList=deleteList.filter(function(k){return k.at!==+button.dataset.cameraLookDelete;});persistLook(s,deleteList,deleteList[0].at);return;
  }
  if(button.dataset.cameraFirst!==undefined){jump(s,list[0].at);return;}
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
  if(input.dataset.cameraMapCameraSelect!==undefined){
   var cs=sec(),ca=+input.value;
   if(C.config(cs)&&keys(cs).some(function(f){return f.at===ca;}))jump(cs,ca);else renderPane();
   return;
  }
  if(input.dataset.cameraMapLookSelect!==undefined){
   var ls=sec(),la=+input.value,lc=C.config(ls);
   if(lc&&lc.orientationMode==='lookAt'&&lookKeys(ls).some(function(f){return f.at===la;}))jumpLook(ls,la);else renderPane();
   return;
  }
  if(input.dataset.cameraPresetChoice!==undefined){presetChoices[sec().id]=input.value;return;}
  if(input.dataset.cameraPathMode!==undefined){
   var pathScene=sec(),mode=input.value==='smooth'?'smooth':'linear',currentMode=pathScene.sdCameraPathMode==='smooth'?'smooth':'linear';
   if(mode===currentMode)return;snapshot();pathScene.sdCameraPathMode=mode;saveProject();renderPane();schedulePreview();return;
  }
  if(input.dataset.cameraOrientationMode!==undefined){
   var os=sec(),om=input.value==='lookAt'?'lookAt':'manual',oc=os.sdCameraOrientationMode==='lookAt'?'lookAt':'manual';if(om===oc)return;
   snapshot();
   if(om==='lookAt'&&(!Array.isArray(os.sdCameraLookFrames)||!os.sdCameraLookFrames.length)){
    var baseCfg=C.config(os),created=C.defaultLookFrames(Object.assign({},baseCfg,{orientationMode:'manual'}),window.NAGWEB_STORY_MODEL,os.sdEase,1000);
    os.sdCameraLookFrames=created;os.sdCameraLookPathMode=os.sdCameraPathMode==='smooth'?'smooth':'linear';if(created.length)lookSelected[os.id]=created[0].at;
   }
   os.sdCameraOrientationMode=om;saveProject();renderPane();schedulePreview();return;
  }
  if(input.dataset.cameraLookPathMode!==undefined){
   var ls=sec(),lm=input.value==='smooth'?'smooth':'linear',lc=ls.sdCameraLookPathMode==='smooth'?'smooth':'linear';if(lm===lc)return;
   snapshot();ls.sdCameraLookPathMode=lm;saveProject();renderPane();schedulePreview();return;
  }
  if(input.dataset.cameraLookTarget!==undefined){
   var ts=sec(),tc=C.config(ts),tl=lookKeys(ts),tk=tl.find(function(k){return k.at===+input.dataset.cameraLookAt;}),tid=input.value;if(!tk||!tc)return;
   var oldId=tk.targetId||'';if(oldId===tid)return;snapshot();
   if(tid){var tv=C.elementTarget(tc,tid,tk.at/100,window.NAGWEB_STORY_MODEL,ts.sdEase,previewReferenceSize(ts));tk.targetId=tid;if(tv){tk.x=tv.x;tk.y=tv.y;tk.z=tv.z;}}
   else delete tk.targetId;
   persistLook(ts,tl,tk.at);return;
  }
  if(input.dataset.cameraLookHandleMode!==undefined){
   var lhs=sec(),lhList=lookKeys(lhs),lhAt=+input.dataset.cameraLookAt,lhSide=input.dataset.cameraLookHandleSide==='in'?'in':'out',lhKey=lhList.find(function(k){return k.at===lhAt;}),lhFree=input.value==='free';
   if(!lhKey||lhKey.targetId){renderPane();return;}if(C.handleFree(lhKey,lhSide)===lhFree)return;var lhNext=C.setLookHandleMode(lhList,lhAt,lhSide,lhFree),lhChanged=lhNext.find(function(k){return k.at===lhAt;});if(!lhChanged||C.handleFree(lhChanged,lhSide)!==lhFree){renderPane();return;}snapshot();persistLook(lhs,lhNext,lhAt);return;
  }
  if(input.dataset.cameraLookHandleVector!==undefined){
   var lvs=sec(),lvList=lookKeys(lvs),lvAt=+input.dataset.cameraLookAt,lvSide=input.dataset.cameraLookHandleSide==='in'?'in':'out',lvAxis=['x','y','z'].indexOf(input.dataset.cameraLookHandleAxis)>=0?input.dataset.cameraLookHandleAxis:null,lvKey=lvList.find(function(k){return k.at===lvAt;});
   if(!lvKey||lvKey.targetId||!lvAxis||!C.handleFree(lvKey,lvSide)){renderPane();return;}var lv=+input.value;if(!Number.isFinite(lv)||input.value===''){renderPane();return;}lv=Math.max(-4000,Math.min(4000,lv));var lp=lvSide==='in'?'curveIn':'curveOut',lprop=lp+'D'+lvAxis.toUpperCase(),lcurrent=+lvKey[lprop]||0;if(lcurrent===lv){input.value=lv;return;}var lh=C.lookTangentHandle(lvList,lvAt,lvSide);if(!lh){renderPane();return;}var lpoint={x:lh.x,y:lh.y,z:lh.z};lpoint[lvAxis]=lvKey[lvAxis]+lv;var lvNext=C.setLookFreeHandle(lvList,lvAt,lvSide,lpoint);snapshot();persistLook(lvs,lvNext,lvAt);return;
  }
  if(input.dataset.cameraLookIncomingTension!==undefined){
   var lis=sec(),liList=lookKeys(lis),liAt=+input.dataset.cameraLookAt,liIndex=liList.findIndex(function(k){return k.at===liAt;});if(liIndex<=0){renderPane();return;}var liValue=+input.value;if(!Number.isFinite(liValue)||input.value===''){renderPane();return;}liValue=C.curveTension(liValue);var liOwner=liList[liIndex-1],liCurrent=liOwner.tension===undefined?0:C.curveTension(liOwner.tension);if(liCurrent===liValue){renderPane();return;}snapshot();liOwner.tension=liValue;persistLook(lis,liList,liAt);return;
  }
  if(input.dataset.cameraLookField!==undefined){
   var lookScene=sec(),lookList=lookKeys(lookScene),lk=lookList.find(function(k){return k.at===+input.dataset.cameraLookAt;}),lf=input.dataset.cameraLookField;if(!lk)return;
   var lv=lf==='ease'?input.value:+input.value;if(lf!=='ease'&&(!Number.isFinite(lv)||input.value==='')){renderPane();return;}
   if(lf==='at'){lv=Math.round(Math.max(0,Math.min(100,lv))*10)/10;if(lookList.some(function(f){return f!==lk&&f.at===lv;})){toast('Ya existe un objetivo en ese momento.');renderPane();return;}}
   if(lf==='tension')lv=C.curveTension(lv);
   if(lk[lf]===lv)return;snapshot();lk[lf]=lv;persistLook(lookScene,lookList,lk.at);return;
  }
  if(input.dataset.cameraHoldDuration!==undefined){if(Number.isFinite(+input.value)&&+input.value>0)holdDurations[sec().id]=Math.min(100,+input.value);else{input.value=holdDurations[sec().id]||10;toast('Ingresá una duración mayor que cero.');}return;}
  if(input.dataset.cameraMapPlane!==undefined){mapPlanes[sec().id]=input.value==='front'?'front':'top';renderPane();return;}
  if(input.dataset.cameraHandleMode!==undefined){
   var modeScene=sec();if(!C.config(modeScene))return;
   var modeList=keys(modeScene),modeAt=+input.dataset.cameraAt,modeSide=input.dataset.cameraHandleSide==='in'?'in':'out',wantFree=input.value==='free',modeKey=modeList.find(function(f){return f.at===modeAt;});
   if(!modeKey||C.handleFree(modeKey,modeSide)===wantFree)return;
   var changed=C.setHandleMode(modeList,modeAt,modeSide,wantFree),changedKey=changed.find(function(f){return f.at===modeAt;});
   if(!changedKey||C.handleFree(changedKey,modeSide)!==wantFree){renderPane();return;}
   snapshot();persist(modeScene,changed,modeAt);return;
  }
  if(input.dataset.cameraHandleVector!==undefined){
   var vectorScene=sec();if(!C.config(vectorScene))return;
   var vectorList=keys(vectorScene),vectorAt=+input.dataset.cameraAt,vectorSide=input.dataset.cameraHandleSide==='in'?'in':'out',vectorAxis=['x','y','z'].indexOf(input.dataset.cameraHandleAxis)>=0?input.dataset.cameraHandleAxis:null,vectorKey=vectorList.find(function(f){return f.at===vectorAt;});
   if(!vectorKey||!vectorAxis||!C.handleFree(vectorKey,vectorSide)){renderPane();return;}
   var delta=+input.value;if(!Number.isFinite(delta)||input.value===''){renderPane();return;}delta=Math.max(-4000,Math.min(4000,delta));
   var prefix=vectorSide==='in'?'curveIn':'curveOut',prop=prefix+'D'+vectorAxis.toUpperCase(),current=+vectorKey[prop]||0;if(current===delta){input.value=delta;return;}
   var handle=C.tangentHandle(vectorList,vectorAt,vectorSide);if(!handle){renderPane();return;}var point={x:handle.x,y:handle.y,z:handle.z};point[vectorAxis]=vectorKey[vectorAxis]+delta;
   var vectorNext=C.setFreeHandle(vectorList,vectorAt,vectorSide,point);snapshot();persist(vectorScene,vectorNext,vectorAt);return;
  }
  if(input.dataset.cameraIncomingTension!==undefined){
   var incomingScene=sec();if(!C.config(incomingScene))return;
   var incomingList=keys(incomingScene),selectedAt=+input.dataset.cameraAt,index=incomingList.findIndex(function(f){return f.at===selectedAt;});
   if(index<=0){renderPane();return;}
   var incomingValue=+input.value;if(!Number.isFinite(incomingValue)||input.value===''){renderPane();return;}
   incomingValue=C.curveTension(incomingValue);var owner=incomingList[index-1],currentIncoming=owner.tension===undefined?0:C.curveTension(owner.tension);
   if(currentIncoming===incomingValue){renderPane();return;}
   snapshot();owner.tension=incomingValue;persist(incomingScene,incomingList,selectedAt);return;
  }
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
