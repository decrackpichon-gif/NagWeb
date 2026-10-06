import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const ctx={window:{},document:{getElementById(){return null;}}};
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

const path=C.config({...scene,sdCameraFrames:[{at:0,x:0,y:0,z:0,ease:'linear'},{at:40,x:200,y:100,z:300,ease:'linear'},{at:100,x:-100,y:-200,z:0}]});
assert.deepEqual(JSON.parse(JSON.stringify(C.pose(path,.2,M,'linear'))),{x:100,y:50,z:150});
assert.deepEqual(JSON.parse(JSON.stringify(C.pose(path,.7,M,'linear'))),{x:50,y:-50,z:150});
assert.equal(C.pose(path,.4,M,'linear').x,200);
assert.equal(C.pose(path,-1,M,'linear').x,0);
assert.equal(C.pose(path,2,M,'linear').x,-100);
assert.equal(C.normalize([{at:50,x:1},{at:50,x:2}]).length,1);
assert.equal(C.normalize([{at:50,x:1},{at:50,x:2}])[0].x,2);
const saved=JSON.parse(JSON.stringify(path));
assert.equal(JSON.stringify(C.pose(saved,.7,M,'linear')),JSON.stringify(exported.pose(path,.7,M,'linear')));
assert.equal(JSON.stringify(C.normalize(saved.frames)),JSON.stringify(saved.frames));
console.log('Camera keyframes: segments, exact moments, bounds, collisions and JSON round-trip OK');
// Exercise the editor handlers against saved scene state, including migration.
const listeners={},history=[];
let editable={...scene,id:'camera-test',sdEase:'linear'},pct=50,refreshes=0,saves=0;
const ui={window:{NAGWEB_STORY_MODEL:M,NAGWEB_SCROLL_DIRECTOR:{progress(){return pct;},scrub(id,p){pct=p*100;}}},
 document:{getElementById(){return{addEventListener(type,fn){listeners[type]=fn;}};}},
 sec(){return editable;},snapshot(){history.push(JSON.stringify(editable));},saveProject(){saves++;},renderPane(){refreshes++;},schedulePreview(){},toast(){}};
vm.runInNewContext(fs.readFileSync('js/nagweb-scroll-camera.js','utf8'),ui);
function click(action,value){const button={dataset:{[action]:String(value)},hasAttribute(attr){return attr==='data-camera-add'&&action==='cameraAdd'||attr==='data-camera-jump'&&action==='cameraJump';}};listeners.click({target:{closest(){return button;}}});}
function change(at,field,value){listeners.change({target:{matches(){return true;},dataset:{cameraAt:String(at),cameraField:field},value:String(value)}});}
click('cameraAdd',true);
assert.equal(editable.sdCameraFrames.length,3);
assert.equal(editable.sdCameraFrames[1].x,100,'New moment starts from current camera pose');
change(50,'x',450);
assert.equal(editable.sdCameraFrames[1].x,450);
assert.equal(editable.sdCameraFrames[0].x,0);
assert.equal(editable.sdCameraFrames[2].x,200,'Editing one camera key leaves other keys unchanged');
change(50,'at',0);
assert.equal(editable.sdCameraFrames.length,3,'Collision must not delete another key');
assert.equal(editable.sdCameraFrames[1].at,50);
change(50,'at',60);
assert.equal(editable.sdCameraFrames[1].at,60);
click('cameraDelete',60);
assert.equal(editable.sdCameraFrames.length,2);
assert.ok(history.length>=4&&saves>=4&&refreshes>=4);
const retained=JSON.stringify(editable.sdCameraFrames);
editable.sdCameraEnabled=false;
assert.equal(ui.window.NAGWEB_SCROLL_CAMERA.config(editable),null);
assert.equal(JSON.stringify(editable.sdCameraFrames),retained);
console.log('Camera editor: add, isolated edit, retime, collision, deletion, history and disabled retention OK');
