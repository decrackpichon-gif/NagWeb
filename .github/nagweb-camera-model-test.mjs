import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const ctx={window:{}};
for(const file of ['nagweb-story-model','nagweb-scroll-camera'])vm.runInNewContext(fs.readFileSync('js/'+file+'.js','utf8'),ctx);
const C=ctx.window.NAGWEB_SCROLL_CAMERA,M=ctx.window.NAGWEB_STORY_MODEL;
const scene={sdEnabled:true,sdCameraEnabled:true,sdCameraEndX:200,sdCameraEndY:-100,sdCameraEndZ:300};
assert.equal(C.config({sdEnabled:true}),null);
assert.equal(C.config({...scene,sdEnabled:false}),null);
assert.equal(C.config({...scene,nwMotionSource:'time'}),null);
const c=C.config(scene),before=JSON.stringify(scene);
for(const [p,x,y,z] of [[0,0,0,0],[.5,100,-50,150],[1,200,-100,300]]){
 const v=C.pose(c,p,M,'linear',false);assert.deepEqual(JSON.parse(JSON.stringify(v)),{x,y,z});
}
assert.deepEqual(JSON.parse(JSON.stringify(C.pose(c,.7,M,'linear',true))),{x:0,y:0,z:0});
assert.equal(JSON.stringify(scene),before);
assert.equal(C.config({...scene,sdCameraEndX:Infinity}).end.x,0);
const exported=vm.runInNewContext('('+ctx.window.NAGWEB_CREATE_SCROLL_CAMERA.toString()+')()');
assert.equal(JSON.stringify(exported.pose(c,.25,M,'smooth')),JSON.stringify(C.pose(c,.25,M,'smooth')));
let current,cancelled=false;
const world={style:{},classList:{contains:v=>v==='inner'},setAttribute(){},animate(frames){current=frames[0].transform;return{pause(){},cancel(){cancelled=true;},effect:{setKeyframes(frames){current=frames[0].transform;}}};}};
const stage={style:{},children:[world]};
assert.equal(C.attach(stage,null,1000),null);assert.deepEqual(stage.style,{});
const paint=C.attach(stage,c,1000);paint(C.pose(c,.5,M,'linear'));
assert.equal(current,'translate3d(-100px,50px,150px)');
paint(C.pose(c,0,M,'linear'));assert.equal(cancelled,true);
console.log('Camera: opt-in, interpolation, inverse translation, reduced motion, export factory and neutral reset OK');
