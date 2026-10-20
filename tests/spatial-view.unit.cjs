'use strict';
// Matemática pura de la vista de trabajo (sin navegador).
const assert=require('node:assert/strict'),V=require('../js/nagweb-spatial-view.js');
const near=(a,b,e,m)=>assert.ok(Math.abs(a-b)<=(e||1e-6),(m||'')+' '+a+' ≠ '+b);
const W=800,H=600;
// Vistas ortogonales: mismos signos que el panel (derecha=+X; arriba de pantalla: top=+Z, front/side=arriba real).
let view=V.defaultView('top'),b=V.basis(view,W,H),o=V.project(b,V.toD({x:0,y:0,z:500})),r=V.project(b,V.toD({x:100,y:0,z:500})),f=V.project(b,V.toD({x:0,y:0,z:600}));
assert.ok(r.x>o.x,'top: +X a la derecha');assert.ok(f.y<o.y,'top: +Z (adelante) hacia arriba de la pantalla');
b=V.basis(V.defaultView('front'),W,H);o=V.project(b,V.toD({x:0,y:0,z:500}));
assert.ok(V.project(b,V.toD({x:100,y:0,z:500})).x>o.x,'front: +X a la derecha');
assert.ok(V.project(b,V.toD({x:0,y:-100,z:500})).y<o.y,'front: y negativa de autoría (arriba real) sube');
b=V.basis(V.defaultView('side'),W,H);o=V.project(b,V.toD({x:0,y:0,z:500}));
assert.ok(V.project(b,V.toD({x:0,y:0,z:600})).x>o.x,'side: +Z (adelante) a la derecha');
assert.ok(V.project(b,V.toD({x:0,y:-100,z:500})).y<o.y,'side: arriba real sube');
// El objetivo cae al centro en todas las vistas.
['persp','top','front','side'].forEach(m=>{const v=V.defaultView(m);v.target=V.v(10,20,30);const bb=V.basis(v,W,H),p=V.project(bb,v.target);near(p.x,W/2,1e-6,m);near(p.y,H/2,1e-6,m);});
// Rayo ↔ proyección: el rayo de un píxel pasa por el punto proyectado.
['persp','top','front','side'].forEach(m=>{const v=V.defaultView(m),bb=V.basis(v,W,H),P=V.v(120,-80,640),s=V.project(bb,P),ry=V.ray(bb,s.x,s.y),t=V.dot(V.sub(P,ry.o),ry.d),Q=V.add(ry.o,V.mul(ry.d,t));near(V.len(V.sub(P,Q)),0,1e-6,'rayo '+m);});
// Eje: arrastrar a lo largo de un eje devuelve el parámetro correcto.
{const v=V.defaultView('persp'),bb=V.basis(v,W,H),O=V.v(0,0,500),A=V.v(1,0,0),P=V.add(O,V.mul(A,230)),s=V.project(bb,P);near(V.axisParam(V.ray(bb,s.x,s.y),O,A),230,1e-3,'axisParam');}
// Plano: la intersección rayo-plano vuelve al punto.
{const v=V.defaultView('persp'),bb=V.basis(v,W,H),P=V.v(50,40,700),s=V.project(bb,P),h=V.planeHit(V.ray(bb,s.x,s.y),P,V.v(0,0,1));near(V.len(V.sub(h,P)),0,1e-6,'planeHit');}
// Pose ↔ vista: ida y vuelta sin saltos de orientación.
[{x:0,y:0,z:-900,rotateX:0,rotateY:0},{x:120,y:-40,z:300,rotateX:12,rotateY:-35},{x:-300,y:80,z:50,rotateX:-20,rotateY:60}].forEach(p=>{
 const pose=Object.assign({rotate:0},p),back=V.poseFromView(V.viewFromPose(V.defaultView('persp'),pose,1200));
 near(back.rotateY,pose.rotateY,.15,'rotateY');near(back.rotateX,pose.rotateX,.15,'rotateX');
 near(V.len(V.sub(V.v(back.x,back.y,back.z),V.v(pose.x,pose.y,pose.z))),0,.5,'posición');
});
// Cámara narrativa: la vista "camera" mira hacia adelante (+Z de autoría) cuando los ángulos son 0.
{const pose={x:0,y:0,z:0,rotateX:0,rotateY:0,rotate:0,width:1000,height:800,perspective:1000},bb=V.basis({mode:'camera'},W,H,pose);
 assert.ok(V.project(bb,V.toD({x:0,y:0,z:500})).visible,'delante es visible');assert.ok(!V.project(bb,V.toD({x:0,y:0,z:-500})).visible,'detrás no se dibuja');
 near(V.cameraAxes({rotateY:90}).fwd.x,-1,1e-9,'rotateY positivo gira a la izquierda');}
// Encuadrar nunca devuelve NaN y respeta los límites.
{const pts=[V.v(-500,0,0),V.v(500,300,1500)],nv=V.frameView(V.defaultView('persp'),pts,W,H);assert.ok(Number.isFinite(nv.dist)&&nv.dist>=300&&nv.dist<=30000);
 const ov=V.frameView(V.defaultView('top'),pts,W,H);assert.ok(Number.isFinite(ov.zoom)&&ov.zoom>=.02&&ov.zoom<=6);
 assert.equal(V.frameView(V.defaultView('top'),[],W,H).mode,'top');}
// Segmento recortado: un extremo detrás del ojo no produce NaN.
{const bb=V.basis(V.defaultView('persp'),W,H),sg=V.segment(bb,V.v(0,0,-5000),V.v(0,0,2000));assert.ok(!sg||Number.isFinite(sg[0].x)&&Number.isFinite(sg[1].x));}
console.log('PASS spatial-view: ejes de las 4 vistas, rayos, ejes/planos, pose↔vista, encuadre y recorte');
