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
 closest(selector){return selector==='[data-camera-track]'?track:selector==='[data-camera-jump]'?this:null;},focus(){},
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
// Container reparenting is limited to eligible free-layout roots; children retain
// their authored coordinates and one shared camera transform on the world.
function domNode(id,classes=[]){return {id,children:[],parentNode:null,style:{},attributes:{},
 classList:{contains(name){return classes.includes(name);}},
 getAttribute(name){return name==='data-id'?id:this.attributes[name];},
 setAttribute(name,value){this.attributes[name]=value;},
 appendChild(node){if(node.parentNode)node.parentNode.children=node.parentNode.children.filter(n=>n!==node);node.parentNode=this;this.children.push(node);},
 animate(){throw new Error('Neutral camera must not animate');}};}
const free={...layersScene,layout:'free',elements:[...layersScene.elements,
 {id:'universal',type:'container',universal:true,sdCameraDepth:-300},
 {id:'nested-container',type:'container',parent:'universal',sdCameraDepth:300},
 {id:'modal-container',type:'container',modal:true},
 {id:'fixed-container',type:'container',fixed:true},
 {id:'motion-container',type:'container',nwMotionInstance:{source:'time'}}]};
const cfg=C.config(free);
assert.deepEqual(Array.from(cfg.containers),['group','universal']);
assert.equal(C.layer(cfg,'universal').z,-300);
assert.equal(C.layer(cfg,'nested-container'),null);
assert.equal(C.layerEligible(free.elements.find(e=>e.id==='universal'),{layout:'stack'}),false);
const stage2=domNode('stage'),world2=domNode('world',['inner']);stage2.appendChild(world2);
const group=domNode('universal',['container-box']),child=domNode('child',['el']);
child.style.left='35%';child.style.top='20%';group.style.left='10%';group.style.width='80%';
group.appendChild(child);stage2.appendChild(group);
const other=domNode('motion-container',['container-box']),modal=domNode('modal-container',['container-box']);stage2.appendChild(other);stage2.appendChild(modal);
const originalChildren=group.children.slice(),groupStyle=JSON.stringify(group.style),childStyle=JSON.stringify(child.style);
const containerPaint=C.attach(stage2,cfg,1000);
assert.equal(group.parentNode,world2);
assert.equal(child.parentNode,group);
assert.deepEqual(group.children,originalChildren);
assert.equal(JSON.stringify(group.style),groupStyle);
assert.equal(JSON.stringify(child.style),childStyle);
assert.equal(other.parentNode,stage2);assert.equal(modal.parentNode,stage2);
containerPaint({x:0,y:0,z:0,rotateX:0,rotateY:0,rotate:0});
const offStage=domNode('off'),offWorld=domNode('off-world',['inner']),offGroup=domNode('universal',['container-box']);offStage.appendChild(offWorld);offStage.appendChild(offGroup);
assert.equal(C.attach(offStage,null,1000),null);assert.equal(offGroup.parentNode,offStage);
assert.equal(JSON.stringify(exported.config(free)),JSON.stringify(cfg));
editable={...free,id:'container-edit'};ui.curEl=editable.elements.findIndex(e=>e.id==='universal');ui.selection=['universal'];
listeners.change({target:{dataset:{cameraDepth:''},value:'-450'}});
assert.equal(editable.elements[ui.curEl].sdCameraDepth,-450);
assert.equal(editable.elements.find(e=>e.id==='nested-container').sdCameraDepth,300);
console.log('Camera containers: free-layout scope, rigid hierarchy, untouched styles, excluded groups, export and depth edit OK');
// Spatial editor: top view maps upward to forward Z; front maps down to positive Y.
const specTop=C.mapSpec([{x:0,y:0,z:0}], 'top');
assert.equal(specTop.range,500);
assert.deepEqual(JSON.parse(JSON.stringify(C.mapPoint({x:100,z:200},specTop))),{x:60,y:30});
const sourcePose={at:50,x:100,y:200,z:300,rotateX:15,rotateY:20,rotate:25,ease:'linear'};
const shifted=C.moveSpatial(sourcePose,specTop,.5,-.25);
assert.equal(shifted.x,600);assert.equal(shifted.y,200);assert.equal(shifted.z,550);
assert.equal(shifted.rotateY,20);assert.equal(shifted.at,50);assert.equal(sourcePose.x,100);
const specFront=C.mapSpec([sourcePose],'front');
assert.equal(C.moveSpatial(sourcePose,specFront,0,.1).y,300);
assert.equal(C.moveSpatial(sourcePose,specFront,0,.1).z,300);
assert.equal(C.moveSpatial(sourcePose,specTop,100,-100).x,4000);
assert.equal(exported.mapSpec([sourcePose],'top').axis,'z');
editable={...scene,id:'map-edit',sdCameraFrames:[{at:0,x:0,y:0,z:0},sourcePose,{at:100,x:300,y:400,z:500}]};
const mapBox={dataset:{plane:'top',range:'500'},getBoundingClientRect(){return{width:200,height:200};}};
function mapMarker(){const point=marker(50);point.dataset={cameraMapPoint:'50'};point.closest=function(selector){return selector==='[data-camera-map]'?mapBox:selector==='[data-camera-map-point]'?this:null;};return point;}
let spatialPoint=mapMarker(),beforeMap=JSON.stringify(editable),mapHistory=history.length;
listeners.pointerdown({button:0,pointerId:7,clientX:100,clientY:100,target:spatialPoint,preventDefault(){}});
spatialPoint.handlers.pointermove({pointerId:7,clientX:150,clientY:80});
assert.equal(JSON.stringify(editable),beforeMap);
spatialPoint.handlers.pointerup({pointerId:7,clientX:150,clientY:80});
assert.equal(editable.sdCameraFrames[1].x,350);assert.equal(editable.sdCameraFrames[1].z,400);
assert.equal(editable.sdCameraFrames[1].y,200);assert.equal(editable.sdCameraFrames[1].rotateX,15);
assert.equal(editable.sdCameraFrames[0].x,0);assert.equal(history.length,mapHistory+1);
spatialPoint=mapMarker();beforeMap=JSON.stringify(editable);mapHistory=history.length;
listeners.pointerdown({button:0,pointerId:7,clientX:100,clientY:100,target:spatialPoint,preventDefault(){}});
spatialPoint.handlers.pointermove({pointerId:7,clientX:20,clientY:30});
spatialPoint.handlers.keydown({key:'Escape',preventDefault(){},stopPropagation(){}});
assert.equal(JSON.stringify(editable),beforeMap);assert.equal(history.length,mapHistory);
mapBox.dataset.plane='front';
listeners.keydown({target:mapMarker(),key:'ArrowDown',shiftKey:true,preventDefault(){},stopPropagation(){}});
assert.equal(editable.sdCameraFrames[1].y,300);assert.equal(editable.sdCameraFrames[1].z,400);
console.log('Camera spatial map: projections, independent axes, drag transaction, cancellation, keyboard and bounds OK');
const initialPath=C.normalize([{at:0,x:100,y:50,z:20,rotateY:30,ease:'linear'},{at:50,x:200,z:100},{at:100,x:0}]);
const unchangedPath=JSON.stringify(initialPath),hold=C.holdFrame(initialPath,0,15);
assert.equal(hold.error,undefined);assert.equal(hold.frames.length,4);assert.equal(hold.at,15);
const heldPose=C.pose({frames:hold.frames},.1,M,'linear');
assert.equal(heldPose.x,100);assert.equal(heldPose.rotateY,30);
assert.equal(C.holdFrame(initialPath,0,50).frames,undefined,'Hold must not overwrite the next key');
assert.equal(C.holdFrame(initialPath,100,10).frames,undefined);
assert.equal(C.holdFrame(initialPath,0,-1).frames,undefined);
assert.equal(C.copyFrame(initialPath,0,50).frames,undefined);
const copied=C.copyFrame(initialPath,0,75);
assert.equal(copied.frames.find(k=>k.at===75).rotateY,30);assert.equal(copied.frames.find(k=>k.at===75).z,20);
assert.equal(JSON.stringify(initialPath),unchangedPath);
for(const name of ['approach','lateral','rise','tour']){
 const preset=C.preset(name,1000);assert.equal(preset[0].at,0);assert.equal(preset.at(-1).at,100);
 assert.deepEqual(JSON.parse(JSON.stringify(exported.preset(name,1000))),JSON.parse(JSON.stringify(preset)));
 assert.ok(C.preset(name,200).every(k=>Math.abs(k.z)<=50));
}
assert.equal(C.preset('missing',1000),null);
editable={...scene,id:'batch-edit',elements:[{id:'preserved',x:20,sdKeyframes:[{at:0,z:40}]}],sdCameraFrames:initialPath};
const elementsBefore=JSON.stringify(editable.elements),beforeAction=history.length;
click('cameraHold','');assert.equal(editable.sdCameraFrames[1].at,10);
assert.equal(history.length,beforeAction+1);pct=75;click('cameraCopy','');
assert.equal(editable.sdCameraFrames.find(k=>k.at===75).x,100);
listeners.change({target:{dataset:{cameraPresetChoice:''},value:'tour'}});click('cameraPreset','');
assert.equal(editable.sdCameraFrames.length,4);assert.equal(editable.sdCameraFrames[0].x,-180);
assert.equal(JSON.stringify(editable.elements),elementsBefore,'Camera actions do not alter element design or animation');
// Map cursor follows playback, separately from selected editable key, with reduced-motion parity.
const position={values:{},setAttribute(k,v){this.values[k]=v;}},readout={};
const playbackMap={dataset:{plane:'top',range:'500'},querySelector(){return position;}};
ui.document.getElementById=()=>({querySelector(selector){return selector==='[data-camera-map]'?playbackMap:selector==='[data-camera-position-label]'?readout:null;}});
ui.window.NAGWEB_SCROLL_CAMERA.paint(40);
assert.equal(position.values.cx,50);assert.equal(position.values.cy,42.8);
assert.ok(readout.textContent.includes('40%'));
ui.window.matchMedia=()=>({matches:true});ui.window.NAGWEB_SCROLL_CAMERA.paint(40);
assert.equal(position.values.cx,50);assert.equal(position.values.cy,50);
console.log('Camera batch: holds, copies, presets, action undo snapshots, untouched elements and live map cursor OK');
