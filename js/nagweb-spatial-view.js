/* NagWeb Cámara 2.0 · matemática pura de la vista de trabajo.
 *
 * Esta vista NO es la cámara narrativa: sólo sirve para mirar y editar el
 * espacio. No tiene reloj, no lee el proyecto y nunca modifica keyframes.
 *
 * Coordenadas de autoría A = (x, y, z): x hacia la derecha, y hacia ABAJO (CSS)
 * y z HACIA ADELANTE (la dirección en que avanza la cámara).
 * Coordenadas de vista D = (x, -y, z): y hacia arriba. Es un sistema con z hacia
 * adentro de la pantalla, así que "derecha = arriba × adelante".
 */
(function(root){
'use strict';
var D2R=Math.PI/180,R2D=180/Math.PI;
function v(x,y,z){return {x:x,y:y,z:z};}
function add(a,b){return v(a.x+b.x,a.y+b.y,a.z+b.z);}
function sub(a,b){return v(a.x-b.x,a.y-b.y,a.z-b.z);}
function mul(a,k){return v(a.x*k,a.y*k,a.z*k);}
function dot(a,b){return a.x*b.x+a.y*b.y+a.z*b.z;}
function cross(a,b){return v(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);}
function len(a){return Math.sqrt(dot(a,a));}
function norm(a){var l=len(a);return l>1e-12?mul(a,1/l):v(0,0,1);}
function toD(p){return v(+p.x||0,-(+p.y||0),+p.z||0);}
function toA(d){return v(d.x,-d.y,d.z);}
function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function finite(n,f){return Number.isFinite(+n)?+n:f;}

// Vistas oficiales: ejes y signos iguales en todas ellas.
//  persp : órbita libre.
//  top   : desde arriba. Derecha = +X, arriba de la pantalla = +Z (adelante).
//  front : de frente.    Derecha = +X, arriba = arriba (y negativa de autoría).
//  side  : de costado.   Derecha = +Z (adelante), arriba = arriba.
var ORTHO={
 top:{fwd:v(0,-1,0),up:v(0,0,1)},
 front:{fwd:v(0,0,1),up:v(0,1,0)},
 side:{fwd:v(-1,0,0),up:v(0,1,0)}
};
function defaultView(mode){
 return {mode:mode||'persp',target:v(0,0,500),yaw:-32*D2R,pitch:24*D2R,dist:2600,zoom:.28,fov:50*D2R};
}
// Base ortonormal (derecha, arriba, adelante) a partir de adelante + arriba.
function frame(fwd,up){
 var f=norm(fwd),r=cross(up,f);
 if(len(r)<1e-6)r=cross(v(0,0,1),f);
 r=norm(r);
 return {fwd:f,right:r,up:cross(f,r)};
}
// Devuelve la cámara de trabajo para un tamaño de lienzo (w, h) en píxeles.
function basis(view,w,h,narrative){
 var m=view.mode,cx=w/2,cy=h/2,near=1;
 if(m==='camera'&&narrative){
  var ax=cameraAxes(narrative),f=Math.min(w/Math.max(1,narrative.width),h/Math.max(1,narrative.height))*narrative.perspective*.92;
  return {ortho:false,eye:toD(narrative),fwd:toD(ax.fwd),right:toD(ax.right),up:toD(mul(ax.down,-1)),focal:f,cx:cx,cy:cy,near:near,mode:m};
 }
 if(m==='persp'){
  var cp=Math.cos(view.pitch),eye=add(view.target,v(Math.sin(view.yaw)*cp*view.dist,Math.sin(view.pitch)*view.dist,-Math.cos(view.yaw)*cp*view.dist));
  var fr=frame(sub(view.target,eye),v(0,1,0));
  return {ortho:false,eye:eye,fwd:fr.fwd,right:fr.right,up:fr.up,focal:(h/2)/Math.tan(view.fov/2),cx:cx,cy:cy,near:near,mode:m};
 }
 var o=ORTHO[m]||ORTHO.top,fo=frame(o.fwd,o.up);
 return {ortho:true,eye:sub(view.target,mul(fo.fwd,20000)),fwd:fo.fwd,right:fo.right,up:fo.up,scale:view.zoom,target:view.target,cx:cx,cy:cy,near:-1e9,mode:m};
}
// Ejes de la cámara narrativa en coordenadas de autoría (misma fórmula que forwardTarget).
function cameraAxes(pose){
 var rx=finite(pose.rotateX,0)*D2R,ry=finite(pose.rotateY,0)*D2R,rz=finite(pose.rotate,0)*D2R;
 var fwd=v(-Math.sin(ry)*Math.cos(rx),Math.sin(rx),Math.cos(ry)*Math.cos(rx));
 var right=v(Math.cos(ry),0,Math.sin(ry)),down=cross(fwd,right);
 var r2=add(mul(right,Math.cos(rz)),mul(down,Math.sin(rz))),d2=sub(mul(down,Math.cos(rz)),mul(right,Math.sin(rz)));
 return {fwd:fwd,right:r2,down:d2};
}
// Proyecta un punto de VISTA (D). Devuelve {x,y,depth,visible}.
function project(b,p){
 var rel=sub(p,b.eye);
 if(b.ortho){
  var t=sub(p,b.target);
  return {x:b.cx+dot(t,b.right)*b.scale,y:b.cy-dot(t,b.up)*b.scale,depth:dot(rel,b.fwd),visible:true};
 }
 var d=dot(rel,b.fwd);
 if(d<=b.near)return {x:NaN,y:NaN,depth:d,visible:false};
 return {x:b.cx+dot(rel,b.right)/d*b.focal,y:b.cy-dot(rel,b.up)/d*b.focal,depth:d,visible:true};
}
// Segmento recortado contra el plano cercano. Devuelve [a,b] proyectados o null.
function segment(b,p,q){
 if(b.ortho)return [project(b,p),project(b,q)];
 var dp=dot(sub(p,b.eye),b.fwd),dq=dot(sub(q,b.eye),b.fwd),n=b.near+.01;
 if(dp<=n&&dq<=n)return null;
 if(dp<=n){p=add(p,mul(sub(q,p),(n-dp)/(dq-dp)));}
 else if(dq<=n){q=add(q,mul(sub(p,q),(n-dq)/(dp-dq)));}
 return [project(b,p),project(b,q)];
}
// Rayo en el espacio de VISTA para un píxel.
function ray(b,sx,sy){
 var px=sx-b.cx,py=b.cy-sy;
 if(b.ortho)return {o:add(add(b.target,mul(b.right,px/b.scale)),add(mul(b.up,py/b.scale),mul(b.fwd,-20000))),d:b.fwd};
 return {o:b.eye,d:norm(add(add(mul(b.right,px/b.focal),mul(b.up,py/b.focal)),b.fwd))};
}
// Posición t sobre la recta (O + t·A) más cercana al rayo. null si son casi paralelos.
function axisParam(rayo,O,A){
 var b=dot(rayo.d,A),r=sub(rayo.o,O),d=dot(rayo.d,r),e=dot(A,r),den=1-b*b;
 if(Math.abs(den)<1e-4)return null;
 return (e-b*d)/den;
}
function planeHit(rayo,P,N){
 var den=dot(rayo.d,N);if(Math.abs(den)<1e-6)return null;
 var t=dot(sub(P,rayo.o),N)/den;return add(rayo.o,mul(rayo.d,t));
}
// Longitud de mundo que equivale a "px" píxeles de pantalla en el punto p.
function worldPerPixel(b,p){
 if(b.ortho)return 1/b.scale;
 var d=dot(sub(p,b.eye),b.fwd);return Math.max(d,1)/b.focal;
}
// Distancia (px) de un punto a un segmento 2D.
function distSegment(px,py,a,c){
 var vx=c.x-a.x,vy=c.y-a.y,wx=px-a.x,wy=py-a.y,l=vx*vx+vy*vy,t=l>1e-9?clamp((wx*vx+wy*vy)/l,0,1):0;
 return Math.hypot(px-(a.x+vx*t),py-(a.y+vy*t));
}
// Encuadra una nube de puntos de VISTA: devuelve el estado nuevo de la vista.
function frameView(view,pts,w,h){
 if(!pts||!pts.length)return view;
 var lo=v(Infinity,Infinity,Infinity),hi=v(-Infinity,-Infinity,-Infinity);
 pts.forEach(function(p){lo=v(Math.min(lo.x,p.x),Math.min(lo.y,p.y),Math.min(lo.z,p.z));hi=v(Math.max(hi.x,p.x),Math.max(hi.y,p.y),Math.max(hi.z,p.z));});
 var c=mul(add(lo,hi),.5),radius=Math.max(120,len(sub(hi,lo))/2),next=Object.assign({},view,{target:c});
 if(view.mode==='persp'||view.mode==='camera'){next.dist=clamp(radius/Math.sin(view.fov/2)*1.15,300,30000);}
 else{
  var ob=ORTHO[view.mode]||ORTHO.top,fo=frame(ob.fwd,ob.up),sx=Math.max(1,Math.abs(dot(sub(hi,lo),fo.right))),sy=Math.max(1,Math.abs(dot(sub(hi,lo),fo.up)));
  next.zoom=clamp(Math.min(w/(sx*1.3),h/(sy*1.3)),.02,6);
 }
 return next;
}
// Pose narrativa (ángulos de autoría) desde la vista de trabajo en perspectiva.
function poseFromView(view){
 var b=basis(Object.assign({},view,{mode:'persp'}),100,100),eye=toA(b.eye),F=toA(b.fwd);
 var rotateY=Math.atan2(-F.x,F.z)*R2D,rotateX=Math.atan2(F.y,Math.hypot(F.x,F.z))*R2D;
 function r1(n){return Math.round(n*10)/10;}
 return {x:r1(eye.x),y:r1(eye.y),z:r1(eye.z),rotateX:r1(rotateX),rotateY:r1(rotateY),rotate:0};
}
// Vista de trabajo que replica la cámara narrativa (para "mirar desde la cámara").
function viewFromPose(view,pose,distance){
 var ax=cameraAxes(pose),d=Math.max(300,distance||1200),eyeD=toD(pose),f=toD(ax.fwd);
 // La órbita pone el ojo en target + dist·(sin(yaw)cos(p), sin(p), -cos(yaw)cos(p)),
 // de modo que adelante = (-sin(yaw)cos(p), -sin(p), cos(yaw)cos(p)).
 return Object.assign({},view,{mode:'persp',target:add(eyeD,mul(f,d)),dist:d,pitch:Math.asin(clamp(-f.y,-1,1)),yaw:Math.atan2(-f.x,f.z)});
}
var api={D2R:D2R,R2D:R2D,v:v,add:add,sub:sub,mul:mul,dot:dot,cross:cross,len:len,norm:norm,toD:toD,toA:toA,clamp:clamp,
 defaultView:defaultView,frame:frame,basis:basis,cameraAxes:cameraAxes,project:project,segment:segment,ray:ray,axisParam:axisParam,
 planeHit:planeHit,worldPerPixel:worldPerPixel,distSegment:distSegment,frameView:frameView,poseFromView:poseFromView,viewFromPose:viewFromPose,ORTHO:ORTHO};
root.NAGWEB_SPATIAL_VIEW=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
