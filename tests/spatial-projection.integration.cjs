'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const T=process.argv[2]?require(require('node:path').resolve(process.argv[2])):require('three');
const ctx={window:{},CustomEvent:class extends Event{constructor(type,o){super(type);this.detail=o.detail;}}};
const src=fs.readFileSync('js/nagweb-scroll-camera.js','utf8');
vm.runInNewContext(src.slice(0,src.indexOf('window.NAGWEB_CREATE_SCROLL_CAMERA='))+'window.api=createCamera();})();',ctx);
const C=ctx.window.api,rad=Math.PI/180,near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,a+' != '+b);
const poses=[
 {x:0,y:0,z:0,rotateX:0,rotateY:0,rotate:0},
 {x:120,y:-80,z:65,rotateX:23,rotateY:-31,rotate:17},
 {x:3999,y:-3999,z:3999,rotateX:25,rotateY:-30,rotate:0},
 {x:0,y:0,z:0,rotateX:90,rotateY:20,rotate:40},
 {x:0,y:0,z:0,rotateX:180,rotateY:17,rotate:-35},
 {x:0,y:0,z:0,rotateX:385,rotateY:-720,rotate:1080}
];
for(const p of poses){
 const state=C.threeCameraState(p,{width:1000,height:800},1000,.5),camera=new T.PerspectiveCamera();assert.ok(C.applyThreeCamera(camera,state));
 const axis=(v,a)=>new T.Quaternion().setFromAxisAngle(v,a*rad);
 const q=axis(new T.Vector3(0,1,0),p.rotateY).multiply(axis(new T.Vector3(1,0,0),-p.rotateX)).multiply(axis(new T.Vector3(0,0,1),-p.rotate));
 assert.ok(q.angleTo(camera.quaternion)<1e-7,'Full orientation, including upside-down poses, must survive without lookAt up-vector flipping');
 camera.position.toArray().forEach((n,i)=>near(n,[p.x*.5,-p.y*.5,-p.z*.5][i]));
 const forward=new T.Vector3(0,0,-1).applyQuaternion(q),target=new T.Vector3(state.target.x,state.target.y,state.target.z).sub(camera.position).normalize();assert.ok(forward.distanceTo(target)<1e-7,'Target direction cannot clamp at the authoring coordinate boundary');
 near(camera.fov,2*Math.atan(800/1000)/rad);near(camera.aspect,1.25);
}
class Stage extends EventTarget{
 constructor(){super();this.clientWidth=1000;this.clientHeight=800;this.clientLeft=0;this.clientTop=0;this.style={};this.animations=[];const self=this;
  this.children=[{offsetLeft:30,offsetTop:40,style:{},classList:{contains:n=>n==='inner'},setAttribute(){},animate(frames){const a={frames,cancelled:false,pause(){},effect:{setKeyframes(f){a.frames=f;}},cancel(){a.cancelled=true;}};self.animations.push(a);return a;}}];
 }
}
const stage=new Stage(),world=stage.children[0],camera=new T.PerspectiveCamera(),paint=C.attach(stage,{containers:[]},1000);let events=0;stage.addEventListener('nagweb:spatial-camera',()=>events++);
paint({...poses[0],rotate:35},1);assert.equal(stage.animations.at(-1).frames[0].transform,'rotateZ(-35deg) translate3d(0px,0px,0px)');assert.equal(world.style.transformOrigin,'470px 360px 1000px');
const unbind=C.bindThreeCamera(stage,camera);near(camera.rotation.z,-35*rad);const emitted=events;paint({...poses[0],rotate:35},1);assert.equal(events,emitted,'Equal pose, size and layout do not emit again');
world.offsetLeft=50;paint({...poses[0],rotate:35},1);assert.equal(world.style.transformOrigin,'450px 360px 1000px');assert.equal(events,emitted+1,'Layout changes refresh the CSS eye');
stage.clientWidth=500;stage.clientHeight=600;paint(C.scalePose(poses[1],.5),.5);near(camera.position.x,60);near(camera.position.y,40);near(camera.position.z,-32.5);near(camera.fov,2*Math.atan(600/1000)/rad);assert.equal(world.style.transformOrigin,'200px 260px 500px');
paint(poses[0],1);assert.equal(stage.animations.at(-1).cancelled,true,'A neutral pose releases the additive camera effect');near(camera.quaternion.angleTo(new T.Quaternion()),0);
const saved=camera.position.clone();unbind();paint({...poses[0],x:400},1);assert.deepEqual(camera.position.toArray(),saved.toArray());
// Keep accepting states emitted before rotationRadians was introduced.
const legacy={...C.threeCameraState(poses[1],{width:1000,height:800},1000,1)};delete legacy.rotationRadians;assert.ok(C.applyThreeCamera(camera,legacy));
console.log('PASS projection bridge: full Euler orientation, coordinate bounds, roll-only paint, eye pivot, layout/resize refresh, single responsive scaling, replay, neutral reset and teardown');
