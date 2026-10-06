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
 const v=C.pose(c,p,M,'linear',false);assert.deepEqual(JSON.parse(JSON.stringify(v)),{x,y,z,rotateX:0,rotateY:0,rotate:0});
}
assert.deepEqual(JSON.parse(JSON.stringify(C.pose(c,.7,M,'linear',true))),{x:0,y:0,z:0,rotateX:0,rotateY:0,rotate:0});
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
assert.deepEqual(JSON.parse(JSON.stringify(C.pose(path,.2,M,'linear'))),{x:100,y:50,z:150,rotateX:0,rotateY:0,rotate:0});
assert.deepEqual(JSON.parse(JSON.stringify(C.pose(path,.7,M,'linear'))),{x:50,y:-50,z:150,rotateX:0,rotateY:0,rotate:0});
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
 document:{getElementById(){return{addEventListener(type,fn){listeners[type]=fn;},querySelector(){return null;}};}},
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

// Orientations are camera angles, so the world receives their inverse in reverse order.
const rotating=C.config({...scene,sdCameraFrames:[{at:0,ease:'linear'},{at:100,x:100,y:40,z:200,rotateX:30,rotateY:60,rotate:360}]});
const middle=C.pose(rotating,.5,M,'linear');
assert.deepEqual(JSON.parse(JSON.stringify(middle)),{x:50,y:20,z:100,rotateX:15,rotateY:30,rotate:180});
assert.equal(C.transform(middle),'rotateZ(-180deg) rotateY(-30deg) rotateX(-15deg) translate3d(-50px,-20px,100px)');
assert.equal(C.pose(rotating,.75,M,'linear').rotate,270,'Full turns must not take the shortest angular path');
assert.deepEqual(JSON.parse(JSON.stringify(C.pose(rotating,.5,M,'linear',true))),{x:0,y:0,z:0,rotateX:0,rotateY:0,rotate:0});
assert.equal(C.normalize([{at:0,rotateX:Infinity,rotateY:9999,rotate:-9999}])[0].rotateX,0);
assert.equal(C.normalize([{at:0,rotateY:9999}])[0].rotateY,3600);
assert.equal(C.transform({x:0,y:0,z:0,rotateY:90}),'rotateY(-90deg) translate3d(0px,0px,0px)');
assert.equal(exported.transform(middle),C.transform(middle));
paint({x:0,y:0,z:0,rotateY:90});assert.equal(current,'rotateY(-90deg) translate3d(0px,0px,0px)','Pure rotation should create an effect even at zero translation');
editable.sdCameraEnabled=true;
change(100,'rotateY',45);
assert.equal(editable.sdCameraFrames[1].rotateY,45);
assert.equal(editable.sdCameraFrames[0].rotateY,0,'Rotation edit is local to selected key');
pct=50;click('cameraAdd',true);
assert.equal(editable.sdCameraFrames[1].rotateY,22.5,'New keys capture interpolated orientation');
console.log('Camera orientation: inverse transform order, full turns, isolated edits, legacy defaults and reduced motion OK');
// Pointer transactions commit once on release; cancel never mutates project/history.
const track={getBoundingClientRect(){return{left:0,width:1000};}};
function marker(at){
 const handlers={};let captured=false;
 return {dataset:{cameraJump:String(at)},style:{left:at+'%'},title:'',handlers,
 closest(selector){return selector==='[data-camera-track]'?track:this;},focus(){},
 setPointerCapture(){captured=true;},hasPointerCapture(){return captured;},releasePointerCapture(){captured=false;},
 addEventListener(type,fn){handlers[type]=fn;},removeEventListener(type){delete handlers[type];}};
}
function pointerStart(button,x){listeners.pointerdown({button:0,pointerId:7,clientX:x,target:button,preventDefault(){}});}
function pointerMove(button,x){button.handlers.pointermove({pointerId:7,clientX:x});}
let point=marker(50),beforeDrag=JSON.stringify(editable),undoBefore=history.length;
pointerStart(point,500);pointerMove(point,620);
assert.equal(point.style.left,'62%');
assert.equal(JSON.stringify(editable),beforeDrag,'Dragging changes only the marker until release');
point.handlers.pointerup({pointerId:7,clientX:620});
assert.equal(editable.sdCameraFrames[1].at,62);
assert.equal(history.length,undoBefore+1,'One drag creates exactly one undo snapshot');
assert.equal(Object.keys(point.handlers).length,0,'All drag listeners removed');
point=marker(62);beforeDrag=JSON.stringify(editable);undoBefore=history.length;
pointerStart(point,620);pointerMove(point,750);point.handlers.pointercancel({pointerId:7});
assert.equal(JSON.stringify(editable),beforeDrag);assert.equal(history.length,undoBefore);assert.equal(point.style.left,'62%');
point=marker(62);pointerStart(point,620);pointerMove(point,850);
point.handlers.keydown({key:'Escape',preventDefault(){},stopPropagation(){}});
assert.equal(JSON.stringify(editable),beforeDrag);assert.equal(history.length,undoBefore);
point=marker(62);pointerStart(point,620);pointerMove(point,1000);point.handlers.pointerup({pointerId:7,clientX:1000});
assert.equal(JSON.stringify(editable),beforeDrag,'Cannot overwrite endpoint by dragging');
assert.equal(history.length,undoBefore);
point=marker(62);pointerStart(point,620);pointerMove(point,-500);point.handlers.lostpointercapture({pointerId:7});
assert.equal(JSON.stringify(editable),beforeDrag,'Losing capture cancels gesture');
listeners.input({target:{matches(){return true;},value:'37.5'}});assert.equal(pct,37.5);
const blank={closest(selector){return selector==='[data-camera-track]'?track:null;}};
listeners.pointerdown({button:0,pointerId:8,clientX:800,target:blank});assert.equal(pct,80);
console.log('Camera track: drag commit, cancel, Escape, collision, capture loss, seek and click OK');

listeners.keydown({target:marker(62),key:'ArrowRight',shiftKey:true,preventDefault(){},stopPropagation(){}});
assert.equal(editable.sdCameraFrames[1].at,72);
listeners.keydown({target:marker(72),key:'ArrowLeft',shiftKey:false,preventDefault(){},stopPropagation(){}});
assert.equal(editable.sdCameraFrames[1].at,71);
console.log('Camera track keyboard: arrow and Shift adjustment OK');
const layersScene={...scene,elements:[
 {id:'near',type:'image',sdCameraDepth:250},
 {id:'far',type:'heading',sdCameraDepth:-600},
 {id:'neutral',type:'paragraph'},
 {id:'nested',type:'image',parent:'group',sdCameraDepth:200},
 {id:'group',type:'container',sdCameraDepth:200},
 {id:'fixed',type:'image',fixed:true,sdCameraDepth:200},
 {id:'webgl',type:'shape3d',sdCameraDepth:200},
 {id:'motion',type:'image',nwMotionInstance:{},sdCameraDepth:200}
]};
const layers=C.config(layersScene);
assert.deepEqual(Array.from(layers.layers,l=>l.id),['near','far','neutral']);
assert.equal(C.layer(layers,'far').z,-600);
assert.equal(C.layer(layers,'missing'),null);
const animated={x:10,y:20,z:100,rotateX:0,rotateY:0};
assert.equal(C.layerPose(animated,C.layer(layers,'near'),false).z,350);
assert.equal(animated.z,100,'Composition must not mutate evaluated animation');
assert.equal(C.layerPose(animated,null,false).z,100,'Camera off leaves original depth untouched');
assert.equal(C.layerPose({z:0},C.layer(layers,'near'),true).z,0,'Reduced motion neutralizes fixed camera depth');
assert.equal(C.layerTransform(C.layerPose(animated,C.layer(layers,'far'),false),1000,true),'translateZ(-500.000px) rotateX(0.000deg) rotateY(0.000deg)');
assert.equal(C.layerTransform(animated,1000,false),'perspective(1000px) translateZ(100.000px) rotateX(0.000deg) rotateY(0.000deg)','Legacy perspective is unchanged');
const savedLayers=JSON.parse(JSON.stringify(layers));
assert.equal(exported.layer(savedLayers,'near').z,250);
assert.equal(exported.layerPose(animated,exported.layer(savedLayers,'near'),false).z,350);
ui.curEl=0;ui.selection=['near'];editable={...layersScene,id:'depth-edit'};
listeners.change({target:{dataset:{cameraDepth:''},value:'375'}});
assert.equal(editable.elements[0].sdCameraDepth,375);
assert.equal(editable.elements[1].sdCameraDepth,-600);
listeners.change({target:{dataset:{cameraDepth:''},value:'Infinity'}});
assert.equal(editable.elements[0].sdCameraDepth,375);
editable.sdCameraEnabled=false;
assert.equal(C.config(editable),null);assert.equal(editable.elements[0].sdCameraDepth,375);
console.log('Camera layers: eligibility, independent edit, additive Z, shared perspective, legacy behavior and serialization OK');
