'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const T=process.argv[2]?require(require('path').resolve(process.argv[2])):require('three');
const c={window:{},CustomEvent:class extends Event{constructor(t,o){super(t);this.detail=o.detail;}}};vm.createContext(c);
const src=fs.readFileSync('js/nagweb-scroll-camera.js','utf8');
vm.runInContext(src.slice(0,src.indexOf('window.NAGWEB_CREATE_SCROLL_CAMERA='))+'window.NAGWEB_SCROLL_CAMERA=createCamera();})();',c);
vm.runInContext(fs.readFileSync('js/nagweb-spatial-renderer.js','utf8'),c);
class Stage extends EventTarget{
 constructor(id,left){super();this.id=id;this.left=left;this.clientWidth=500;this.clientHeight=400;this.isConnected=true;this.style={};this.children=[{classList:{contains:n=>n==='inner'},style:{},setAttribute(){},animate(){return{pause(){},effect:{setKeyframes(){}},cancel(){}};}}];}
 contains(n){return n.stage===this;}closest(){return{getAttribute:()=>this.id};}
 getBoundingClientRect(){return{left:this.left,top:0,right:this.left+this.clientWidth,bottom:this.clientHeight,width:this.clientWidth,height:this.clientHeight};}
}
function object(stage,id,offZ,geometry){
 const g=new T.Group(),h=new T.Group();g.add(new T.Mesh(geometry||new T.BoxGeometry(2,2,2),new T.MeshBasicMaterial({side:T.DoubleSide})));h.add(g);
 g.userData={o:{id,offZ:offZ||0},holder:h,nativeR:0,anchorEl:{stage,offsetWidth:100,offsetHeight:100,offsetLeft:250,offsetTop:200}};return g;
}
const a=new Stage('a',0),b=new Stage('b',600),scene=new T.Scene(),far=object(a,'far',-2),near=object(a,'near',2),other=object(b,'other',0),objects=[far,near,other];
objects.forEach(g=>scene.add(g.userData.holder));
const renderer={domElement:{clientWidth:1000,clientHeight:800},autoClear:true,setViewport(){},setScissor(){},setScissorTest(){},clearDepth(){},render(){}};
const api=c.window.NAGWEB_SCROLL_CAMERA,paint=[a,b].map(s=>api.attach(s,{containers:[]},1000)),pose={x:0,y:0,z:0,rotate:0,rotateX:0,rotateY:0};paint.forEach(p=>p(pose,1));
const legacyCamera=new T.PerspectiveCamera(50,1.25,.1,100);legacyCamera.position.z=6;
const adapter=c.window.NAGWEB_CREATE_SPATIAL_RENDERER(T,renderer,scene,objects,[]);adapter.connect(api,[a,b]);adapter.render(()=>{});
assert.equal(adapter.pick([far,near],250,200,legacyCamera),near,'a nearer real surface wins regardless of candidate order');
const projected=(g,p)=>{const v=adapter.view(g),n=p.clone().project(v.camera);return[v.rect.left+(n.x+1)*v.rect.width/2,v.rect.top+(1-n.y)*v.rect.height/2];};
near.userData.anchorEl.offsetLeft=490;adapter.render(()=>{});
assert.equal(adapter.pick([near],510,200,legacyCamera),null,'geometry outside the stage scissor cannot be grabbed');
near.userData.anchorEl.offsetLeft=250;adapter.render(()=>{});
b.left=0;adapter.render(()=>{});assert.equal(adapter.pick(objects,250,200,legacyCamera),other,'later spatial pass wins when stages overlap');b.left=600;
near.children[0].visible=false;assert.equal(adapter.pick([near],250,200,legacyCamera),null,'invisible mesh cannot create a target');near.children[0].visible=true;
near.children[0].material.visible=false;assert.equal(adapter.pick([near],250,200,legacyCamera),null);near.children[0].material.visible=true;
near.children[0].material.opacity=0;assert.equal(adapter.pick([near],250,200,legacyCamera),null);near.children[0].material.opacity=1;
a.isConnected=false;assert.equal(adapter.pick([near],250,200,legacyCamera),null);a.isConnected=true;
near.userData.o.offZ=100;adapter.render(()=>{});assert.equal(adapter.pick([near],250,200,legacyCamera),null,'behind-camera geometry cannot be selected');near.userData.o.offZ=2;
const unit=a.clientHeight/(12*Math.tan(25*Math.PI/180));near.userData.anchorEl.offsetWidth=.001;near.userData.o.offZ=(1000-.01)/unit;adapter.render(()=>{});assert.equal(adapter.pick([near],250,200,legacyCamera),null,'geometry entirely before the near plane cannot be selected');near.userData.anchorEl.offsetWidth=100;near.userData.o.offZ=2;
paint[0]({...pose,x:40,y:20,rotate:5,rotateX:8,rotateY:12},1);adapter.render(()=>{});
const world=near.userData.holder.getWorldPosition(new T.Vector3()),screen=projected(near,world),hit=adapter.anchorPoint(near,...screen);
assert.ok(hit.distanceTo(world)<1e-7,'rotated camera unprojects the anchor plane in CSS world units');
const shifted=world.clone().add(new T.Vector3(35,-22,0)),shiftedHit=adapter.anchorPoint(near,...projected(near,shifted));assert.ok(shiftedHit.distanceTo(shifted)<1e-7);
assert.equal(adapter.anchorPoint(near,NaN,0),null);assert.equal(adapter.pick(objects,NaN,0,legacyCamera),null);
paint[0](pose,1);near.children[0].geometry.dispose();near.children[0].geometry=new T.RingGeometry(.7,1.6,64);near.userData.nativeR=0;near.userData.o.offZ=0;adapter.render(()=>{});
assert.equal(adapter.pick([near],250,200,legacyCamera),near,'ring hole preserves the approximate drag target');
near.children[0].geometry.dispose();near.remove(near.children[0]);const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,1,1,0],3));near.add(new T.Points(geo,new T.PointsMaterial()));near.userData.nativeR=0;adapter.render(()=>{});assert.equal(adapter.pick([near],250,200,legacyCamera),near,'point clouds retain a usable approximate target');
const legacy=new T.Group();legacy.add(new T.Mesh(new T.BoxGeometry(),new T.MeshBasicMaterial()));scene.add(legacy);assert.equal(adapter.pick([legacy],500,400,legacyCamera),legacy,'unowned objects retain the legacy camera');
assert.equal(adapter.pick(objects,-1,200,legacyCamera),null);assert.equal(adapter.pick(objects,1000,200,legacyCamera),null);
a.clientWidth=250;a.clientHeight=200;near.userData.anchorEl.offsetLeft=125;near.userData.anchorEl.offsetTop=100;paint[0](pose,1);adapter.render(()=>{});assert.equal(adapter.pick([near],125,100,legacyCamera),near,'resize updates picking projection');
adapter.destroy();assert.equal(adapter.anchorPoint(near,125,100),null);
console.log('PASS: real ray intersections, nearest surface, stage scissor/order, visibility, near/behind clipping, rotated anchor-plane inverse, ring/points fallback, legacy camera and resize');
