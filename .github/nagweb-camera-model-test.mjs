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
// Container reparenting is limited to eligible scene roots; children retain
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
assert.equal(C.layerEligible(free.elements.find(e=>e.id==='universal'),{layout:'stack'}),true);
const stage2=domNode('stage'),world2=domNode('world',['inner']);stage2.appendChild(world2);
const group=domNode('universal',['container-box']),child=domNode('child',['el']);
child.style.left='35%';child.style.top='20%';group.style.left='10%';group.style.width='80%';
group.appendChild(child);stage2.appendChild(group);
const other=domNode('motion-container',['container-box']),modal=domNode('modal-container',['container-box']);stage2.appendChild(other);stage2.appendChild(modal);
const originalChildren=group.children.slice(),childStyle=JSON.stringify(child.style);
const containerPaint=C.attach(stage2,cfg,1000);
assert.equal(group.parentNode,world2);
assert.equal(child.parentNode,group);
assert.deepEqual(group.children,originalChildren);
assert.equal(group.style.left,'10%');assert.equal(group.style.width,'80%');
assert.equal(group.style.transformStyle,'preserve-3d');assert.equal(JSON.stringify(child.style),childStyle);
assert.equal(containerPaint.contains(child),true);
assert.equal(other.parentNode,stage2);assert.equal(modal.parentNode,stage2);assert.equal(containerPaint.contains(other),false);
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
const mapBox={dataset:{plane:'top',range:'500'},getBoundingClientRect(){return{left:0,top:0,width:200,height:200};}};
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
spatialPoint=mapMarker();mapHistory=history.length;
listeners.pointerdown({button:0,pointerId:7,clientX:100,clientY:100,target:spatialPoint,preventDefault(){}});
spatialPoint.handlers.pointermove({pointerId:7,clientX:150,clientY:130,shiftKey:true});
spatialPoint.handlers.pointerup({pointerId:7,clientX:150,clientY:130,shiftKey:true});
assert.equal(editable.sdCameraFrames[1].x,600);assert.equal(editable.sdCameraFrames[1].z,400,'Shift-drag locks camera movement to dominant horizontal axis');
assert.equal(history.length,mapHistory+1);
pct=0;mapBox.dataset.plane='top';mapBox.dataset.range='800';
const camera100=C.mapPoint(editable.sdCameraFrames.find(k=>k.at===100),{axis:'z',sign:-1,range:800});
listeners.pointerdown({button:0,pointerId:15,clientX:camera100.x/100*200,clientY:camera100.y/100*200,target:{closest(selector){return selector==='[data-camera-map]'?mapBox:null;}},preventDefault(){},stopPropagation(){}});
assert.equal(pct,100,'Clicking near a camera point selects and scrubs it directly');
mapBox.dataset.plane='front';mapBox.dataset.range='800';
listeners.keydown({target:mapMarker(),key:'ArrowDown',shiftKey:true,preventDefault(){},stopPropagation(){}});
assert.equal(editable.sdCameraFrames[1].y,300);assert.equal(editable.sdCameraFrames[1].z,400,'Keyboard step stays 100px when the map auto-range changes');
editable={...editable,sdCameraOrientationMode:'lookAt',sdCameraLookFrames:[
 {at:0,x:0,y:0,z:800},{at:50,x:300,y:100,z:700,ease:'linear'},{at:100,x:500,y:0,z:500}
]};
mapBox.dataset.plane='top';mapBox.dataset.range='800';
function lookMapMarker(){const point=marker(50);point.dataset={cameraLookMapPoint:'50'};point.closest=function(selector){return selector==='[data-camera-map]'?mapBox:selector==='[data-camera-look-map-point]'?this:null;};return point;}
let lookPoint=lookMapMarker(),beforeLookMap=JSON.stringify(editable.sdCameraLookFrames),lookHistory=history.length;
listeners.pointerdown({button:0,pointerId:9,clientX:100,clientY:100,target:lookPoint,preventDefault(){}});
lookPoint.handlers.pointermove({pointerId:9,clientX:125,clientY:75});
assert.equal(JSON.stringify(editable.sdCameraLookFrames),beforeLookMap,'Look drag must stay visual until release');
lookPoint.handlers.pointerup({pointerId:9,clientX:125,clientY:75});
assert.equal(editable.sdCameraLookFrames[1].x,500);assert.equal(editable.sdCameraLookFrames[1].z,900);
assert.equal(editable.sdCameraLookFrames[1].y,100);assert.equal(history.length,lookHistory+1);
lookPoint=lookMapMarker();beforeLookMap=JSON.stringify(editable.sdCameraLookFrames);lookHistory=history.length;
listeners.pointerdown({button:0,pointerId:9,clientX:100,clientY:100,target:lookPoint,preventDefault(){}});
lookPoint.handlers.pointermove({pointerId:9,clientX:50,clientY:150});
lookPoint.handlers.keydown({key:'Escape',preventDefault(){},stopPropagation(){}});
assert.equal(JSON.stringify(editable.sdCameraLookFrames),beforeLookMap);assert.equal(history.length,lookHistory);
lookPoint=lookMapMarker();lookHistory=history.length;
listeners.pointerdown({button:0,pointerId:9,clientX:100,clientY:100,target:lookPoint,preventDefault(){}});
lookPoint.handlers.pointermove({pointerId:9,clientX:120,clientY:150,shiftKey:true});
lookPoint.handlers.pointerup({pointerId:9,clientX:120,clientY:150,shiftKey:true});
assert.equal(editable.sdCameraLookFrames[1].x,500,'Shift-drag locks look target horizontal coordinate when vertical movement dominates');
assert.equal(editable.sdCameraLookFrames[1].z,500,'Vertical-dominant Shift drag changes only Z in top view');assert.equal(history.length,lookHistory+1);
pct=0;mapBox.dataset.plane='top';mapBox.dataset.range='800';
const look100=C.mapPoint(editable.sdCameraLookFrames.find(k=>k.at===100),{axis:'z',sign:-1,range:800});
listeners.pointerdown({button:0,pointerId:16,clientX:look100.x/100*200,clientY:look100.y/100*200,target:{closest(selector){return selector==='[data-camera-map]'?mapBox:null;}},preventDefault(){},stopPropagation(){}});
assert.equal(pct,100,'Clicking near a look point selects and scrubs it directly');
mapBox.dataset.plane='front';
listeners.keydown({target:lookMapMarker(),key:'ArrowLeft',shiftKey:false,preventDefault(){},stopPropagation(){}});
assert.equal(editable.sdCameraLookFrames[1].x,475,'Look keyboard move stays exactly 25px at an 800px map range');
assert.equal(editable.sdCameraLookFrames[1].y,100);assert.equal(editable.sdCameraLookFrames[1].z,500);
console.log('Camera spatial map: camera + look target drag transactions, cancellation, direct selection, axis locking, dynamic-range keyboard steps and bounds OK');
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

const stackConfig=C.config({...free,layout:'stack',elements:[{id:'flow',type:'container',stackDir:'column',sdCameraDepth:200},{id:'absolute',type:'container',sdCameraDepth:500}]});
assert.deepEqual(Array.from(stackConfig.containers),['flow','absolute']);
assert.equal(C.layer(stackConfig,'flow').z,200);assert.equal(C.layer(stackConfig,'absolute').z,500);
const stackStage=domNode('stack-stage'),stackWorld=domNode('stack-world',['inner']);stackStage.appendChild(stackWorld);
const flowRoot=domNode('flow',['container-box']),absoluteRoot=domNode('absolute',['container-box']),absoluteChild=domNode('absolute-child',['el']);
absoluteRoot.style.left='18%';absoluteRoot.style.top='9%';
stackWorld.appendChild(flowRoot);absoluteRoot.appendChild(absoluteChild);stackStage.appendChild(absoluteRoot);
const absoluteChildren=absoluteRoot.children.slice();
const stackPaint=C.attach(stackStage,stackConfig,1000);
assert.equal(flowRoot.parentNode,stackWorld,'In-flow stacked roots stay in the camera world');
assert.equal(absoluteRoot.parentNode,stackWorld,'Absolute stacked roots join the camera world');
assert.equal(absoluteChild.parentNode,absoluteRoot);assert.deepEqual(absoluteRoot.children,absoluteChildren);
assert.equal(absoluteRoot.style.left,'18%');assert.equal(absoluteRoot.style.top,'9%');
assert.equal(flowRoot.style.transformStyle,'preserve-3d');assert.equal(absoluteRoot.style.transformStyle,'preserve-3d');
assert.equal(stackPaint.contains(absoluteChild),true);
stackPaint({x:0,y:0,z:0,rotateX:0,rotateY:0,rotate:0});
assert.equal(C.config({...scene,layout:'horizontal'}),null);
let normalizations=0;const countingModel={...M,normalize(input){normalizations++;return M.normalize(input);}};
const prepared=C.compile(rotating,countingModel,'linear');
assert.equal(normalizations,1);
for(const p of [0,.1,.5,.9,1]){
 assert.equal(JSON.stringify(C.pose(rotating,p,countingModel,'linear',false,prepared)),JSON.stringify(C.pose(rotating,p,M,'linear')));
}
assert.equal(normalizations,1,'Prepared camera should not normalize keyframes on each paint');
console.log('Stacked roots: in-flow and absolute containers share camera scope; prepared track parity OK');
const adaptive=C.config({...scene,sdCameraResponsive:true,sdCameraReferenceWidth:1000});
assert.equal(C.viewportScale(adaptive,375),.375);assert.equal(C.viewportScale(adaptive,2000),1);
assert.equal(C.viewportScale(C.config(scene),375),1,'Existing scenes preserve fixed pixel movement');
assert.equal(C.viewportScale(adaptive,0),1);assert.equal(C.viewportScale(adaptive,NaN),1);
const basePose={x:200,y:-100,z:300,rotateX:10,rotateY:20,rotate:30};
assert.deepEqual(JSON.parse(JSON.stringify(C.scalePose(basePose,.5))),{x:100,y:-50,z:150,rotateX:10,rotateY:20,rotate:30});
assert.equal(basePose.x,200);
assert.equal(C.layerPose({z:100},{z:200},false,.5).z,150);
assert.equal(C.layerPose({z:100},null,false,.5).z,100,'Excluded layers keep their authored depth');
assert.equal(exported.viewportScale(JSON.parse(JSON.stringify(adaptive)),375),.375);
editable={...scene,id:'first-test',sdCameraFrames:[{at:15,x:100},{at:80,x:300}]};pct=65;
const beforeFirst=history.length;click('cameraFirst','');assert.equal(pct,15);assert.equal(history.length,beforeFirst);
console.log('Camera adaptive width: proportional positions/depth, stable angles, default compatibility, serialization and first-key navigation OK');

const curvedScene={...scene,sdCameraPathMode:'smooth',sdCameraFrames:[
 {at:0,x:0,y:0,z:0,rotateY:0,ease:'linear'},
 {at:33,x:100,y:100,z:0,rotateY:10,ease:'linear'},
 {at:66,x:200,y:0,z:100,rotateY:20,ease:'linear'},
 {at:100,x:300,y:100,z:0,rotateY:30,ease:'linear'}
]};
const curvedConfig=C.config(curvedScene);
assert.equal(curvedConfig.pathMode,'smooth');assert.equal(C.config(scene).pathMode,'linear');
const exactCurveKey=C.pose(curvedConfig,.33,M,'linear',false);
assert.ok(Math.abs(exactCurveKey.x-100)<1e-9&&Math.abs(exactCurveKey.y-100)<1e-9&&Math.abs(exactCurveKey.z)<1e-9);
const curvedMid=C.pose(curvedConfig,.495,M,'linear',false),linearMid=C.pose({...curvedConfig,pathMode:'linear'},.495,M,'linear',false);
assert.ok(Math.hypot(curvedMid.x-linearMid.x,curvedMid.y-linearMid.y,curvedMid.z-linearMid.z)>1,'Smooth path must differ spatially from straight interpolation between keys');
assert.ok(curvedMid.rotateY>10&&curvedMid.rotateY<20,'Angles keep the existing keyframe interpolation');
const curveSamples=C.pathSamples(curvedConfig,M,'linear');
assert.ok(curveSamples.length>curvedConfig.frames.length);assert.equal(curveSamples[0].x,0);assert.equal(curveSamples.at(-1).x,300);
const explicitZero=C.config({...curvedScene,sdCameraFrames:curvedScene.sdCameraFrames.map((k,i)=>i===1?{...k,tension:0}:k)});
assert.deepEqual(JSON.parse(JSON.stringify(C.pose(explicitZero,.4,M,'linear',false))),JSON.parse(JSON.stringify(C.pose(curvedConfig,.4,M,'linear',false))),'0% tension preserves the existing Catmull-Rom curve exactly');
const tightConfig=C.config({...curvedScene,sdCameraFrames:curvedScene.sdCameraFrames.map((k,i)=>i===1?{...k,tension:100}:k)});
const looseConfig=C.config({...curvedScene,sdCameraFrames:curvedScene.sdCameraFrames.map((k,i)=>i===1?{...k,tension:-100}:k)});
const defaultAt40=C.pose(curvedConfig,.4,M,'linear',false),tightAt40=C.pose(tightConfig,.4,M,'linear',false),looseAt40=C.pose(looseConfig,.4,M,'linear',false);
assert.ok(tightAt40.x<defaultAt40.x&&defaultAt40.x<looseAt40.x,'Per-segment tension must tighten/loosen the spatial tangent without changing key positions');
assert.ok(Math.abs(C.pose(tightConfig,.33,M,'linear',false).x-100)<1e-9&&Math.abs(C.pose(looseConfig,.66,M,'linear',false).x-200)<1e-9);
assert.equal(C.normalize([{at:0,x:0,tension:250},{at:100,x:100,tension:-250}])[0].tension,100);
assert.equal(C.normalize([{at:0,x:0,tension:250},{at:100,x:100,tension:-250}])[1].tension,-100);
assert.equal(C.curveTension('bad'),0);
const tangentDefault=C.tangentHandle(curvedConfig.frames,33),tangentTight=C.tangentHandle(tightConfig.frames,33),tangentLoose=C.tangentHandle(looseConfig.frames,33);
assert.ok(tangentDefault&&tangentTight&&tangentLoose);
assert.ok(Math.abs(tangentDefault.x-133.33333333333334)<1e-9&&Math.abs(tangentDefault.z-16.666666666666668)<1e-9);
assert.equal(tangentTight.x,100);assert.equal(tangentTight.y,100);assert.equal(tangentTight.z,0,'+100% tension retracts the outgoing tangent to the key');
assert.ok(tangentLoose.x>tangentDefault.x&&tangentLoose.z>tangentDefault.z,'Negative tension lengthens the outgoing tangent');
assert.equal(C.tangentHandle(curvedConfig.frames,100),null);
assert.equal(C.tangentHandle(C.normalize([{at:0,x:50,y:25,z:-10},{at:20,x:50,y:25,z:-10},{at:100,x:300,y:0,z:0}]),0),null,'A real hold has no outgoing tangent preview');
const tangentSpec={axis:'z',sign:-1,range:500};
assert.equal(C.tensionFromHandle(curvedConfig.frames,33,tangentSpec,tangentDefault),0);
assert.equal(C.tensionFromHandle(curvedConfig.frames,33,tangentSpec,tangentTight),100);
assert.equal(C.tensionFromHandle(curvedConfig.frames,33,tangentSpec,tangentLoose),-100);
assert.equal(C.tensionFromHandle(curvedConfig.frames,100,tangentSpec,tangentDefault),null);
const incomingDefault=C.tangentHandle(curvedConfig.frames,66,'in');
assert.ok(incomingDefault&&incomingDefault.side==='in'&&incomingDefault.ownerAt===33);
assert.ok(Math.abs(incomingDefault.x-166.66666666666666)<1e-9&&Math.abs(incomingDefault.y)<1e-9&&Math.abs(incomingDefault.z-100)<1e-9,'Incoming handle is the Bezier/Hermite control of the previous segment');
const incomingTightFrames=curvedConfig.frames.map(k=>k.at===33?{...k,tension:100}:k),incomingTight=C.tangentHandle(incomingTightFrames,66,'in');
assert.equal(incomingTight.x,200);assert.equal(incomingTight.y,0);assert.equal(incomingTight.z,100,'Previous segment +100 retracts incoming handle onto selected key');
assert.equal(C.tensionFromHandle(curvedConfig.frames,66,tangentSpec,incomingDefault,'in'),0);
assert.equal(C.tensionFromHandle(incomingTightFrames,66,tangentSpec,incomingTight,'in'),100);
assert.equal(C.tangentHandle(curvedConfig.frames,0,'in'),null);assert.equal(C.tangentHandle(curvedConfig.frames,100,'out'),null);
const autoPose40=C.pose(curvedConfig,.4,M,'linear',false),freeOutFrames=C.setHandleMode(curvedConfig.frames,33,'out',true),freeOutKey=freeOutFrames.find(k=>k.at===33);
assert.equal(C.handleFree(freeOutKey,'out'),true);assert.equal(C.handleFree(freeOutKey,'in'),false);
const freeOutConfig={...curvedConfig,frames:freeOutFrames},freePose40=C.pose(freeOutConfig,.4,M,'linear',false);
assert.ok(Math.hypot(autoPose40.x-freePose40.x,autoPose40.y-freePose40.y,autoPose40.z-freePose40.z)<1e-9,'Enabling a free handle captures the automatic control without moving the curve');
const movedFreeFrames=C.setFreeHandle(freeOutFrames,33,'out',{x:145,y:150,z:80}),movedFreeConfig={...curvedConfig,frames:movedFreeFrames},movedFreePose=C.pose(movedFreeConfig,.4,M,'linear',false);
assert.ok(Math.hypot(movedFreePose.x-autoPose40.x,movedFreePose.y-autoPose40.y,movedFreePose.z-autoPose40.z)>1,'Moving a free handle changes spatial curve direction');
assert.equal(C.pose(movedFreeConfig,.33,M,'linear',false).x,100);assert.equal(C.pose(movedFreeConfig,.66,M,'linear',false).x,200);
assert.equal(C.tensionFromHandle(movedFreeFrames,33,tangentSpec,C.tangentHandle(movedFreeFrames,33,'out'),'out'),null,'Free handle drag is no longer reduced to scalar tension');
const roundTripFree=C.normalize(JSON.parse(JSON.stringify(movedFreeFrames))),roundTripKey=roundTripFree.find(k=>k.at===33);
assert.equal(roundTripKey.curveOutFree,true);assert.equal(roundTripKey.curveOutDX,45);assert.equal(roundTripKey.curveOutDY,50);assert.equal(roundTripKey.curveOutDZ,80);
const freeInFrames=C.setHandleMode(curvedConfig.frames,66,'in',true),freeInKey=freeInFrames.find(k=>k.at===66);
assert.equal(C.handleFree(freeInKey,'in'),true);assert.equal(C.handleFree(freeInKey,'out'),false);
const autoAgain=C.setHandleMode(movedFreeFrames,33,'out',false),autoAgainPose=C.pose({...curvedConfig,frames:autoAgain},.4,M,'linear',false);
assert.equal(C.handleFree(autoAgain.find(k=>k.at===33),'out'),false);assert.ok(Math.hypot(autoAgainPose.x-autoPose40.x,autoAgainPose.y-autoPose40.y,autoAgainPose.z-autoPose40.z)<1e-9);
editable={...curvedScene,id:'free-vector-ui',sdCameraFrames:C.setHandleMode(curvedConfig.frames,33,'out',true)};
const vectorFieldHistory=history.length;
listeners.change({target:{dataset:{cameraHandleVector:'',cameraHandleSide:'out',cameraHandleAxis:'z',cameraAt:'33'},matches(){return false;},value:'125'}});
assert.equal(editable.sdCameraFrames.find(k=>k.at===33).curveOutDZ,125,'Free-handle numeric Z field edits the stored relative vector');
assert.equal(history.length,vectorFieldHistory+1);assert.equal(pct,33,'Free-handle numeric edit preserves selected key moment');
const nearestSpec=C.mapSpec(curvedConfig.frames,'top'),nearestSample=curveSamples[Math.floor(curveSamples.length*.25)],nearestPoint=C.mapPoint(nearestSample,nearestSpec);
const nearestHit=C.nearestPathAt(curveSamples,nearestSpec,nearestPoint,{x:3,y:2});
assert.ok(nearestHit&&nearestHit.distance<1e-9&&Math.abs(nearestHit.at-nearestSample.at)<1e-9,'Projected path lookup recovers the sampled narrative moment');
const aSample=curveSamples[5],bSample=curveSamples[6],ap=C.mapPoint(aSample,nearestSpec),bp=C.mapPoint(bSample,nearestSpec);
const midpointHit=C.nearestPathAt(curveSamples,nearestSpec,{x:(ap.x+bp.x)/2,y:(ap.y+bp.y)/2},{x:3,y:2});
assert.ok(Math.abs(midpointHit.at-(aSample.at+bSample.at)/2)<.01,'Projected segment lookup interpolates narrative time between samples');
assert.equal(C.nearestPathAt([],nearestSpec,{x:50,y:50}),null);
const holdCurve={...curvedConfig,frames:C.normalize([{at:0,x:50,y:25,z:-10,ease:'linear'},{at:20,x:50,y:25,z:-10,ease:'linear'},{at:100,x:300,y:0,z:0}])};
const smoothHold=C.pose(holdCurve,.1,M,'linear',false);
assert.equal(smoothHold.x,50);assert.equal(smoothHold.y,25);assert.equal(smoothHold.z,-10);
assert.equal(C.pose(curvedConfig,.495,M,'linear',true).x,0,'Reduced motion still neutralizes the camera');
editable={...curvedScene,id:'curve-tension-ui'};
const tensionHistory=history.length;
listeners.change({target:{dataset:{cameraField:'tension',cameraAt:'33'},matches(){return true;},value:'80'}});
assert.equal(editable.sdCameraFrames.find(k=>k.at===33).tension,80);assert.equal(history.length,tensionHistory+1);
listeners.change({target:{dataset:{cameraField:'tension',cameraAt:'33'},matches(){return true;},value:'500'}});
assert.equal(editable.sdCameraFrames.find(k=>k.at===33).tension,100,'Editor persistence clamps tension through camera normalization');
const incomingPanelHistory=history.length;
listeners.change({target:{dataset:{cameraIncomingTension:'',cameraAt:'66'},matches(){return false;},value:'-35'}});
assert.equal(editable.sdCameraFrames.find(k=>k.at===33).tension,-35,'Incoming numeric field edits previous segment tension');
assert.equal(history.length,incomingPanelHistory+1);
assert.equal(pct,66,'Incoming numeric edit preserves the selected key moment');
editable={...curvedScene,id:'curve-insert-ui'};
const insertCfg=ui.window.NAGWEB_SCROLL_CAMERA.config(editable),insertList=ui.window.NAGWEB_SCROLL_CAMERA.frames(insertCfg,editable.sdEase),insertSpec=ui.window.NAGWEB_SCROLL_CAMERA.mapSpec(insertList,'top'),insertPose=ui.window.NAGWEB_SCROLL_CAMERA.pose(insertCfg,.2,M,'linear',false),insertPoint=ui.window.NAGWEB_SCROLL_CAMERA.mapPoint(insertPose,insertSpec);
const insertMap={dataset:{plane:'top',range:String(insertSpec.range)},getBoundingClientRect(){return{left:0,top:0,width:300,height:200};}};
const insertHistory=history.length,insertTarget={closest(selector){return selector==='[data-camera-map]'?insertMap:null;}};
listeners.dblclick({button:0,clientX:insertPoint.x/100*300,clientY:insertPoint.y/100*200,target:insertTarget,preventDefault(){},stopPropagation(){}});
assert.equal(editable.sdCameraFrames.length,5,'Double click on sampled curve inserts a camera key');
const inserted=editable.sdCameraFrames.find(k=>![0,33,66,100].includes(k.at));assert.ok(inserted);
const expectedInserted=ui.window.NAGWEB_SCROLL_CAMERA.pose(insertCfg,inserted.at/100,M,'linear',false);
assert.ok(Math.hypot(inserted.x-expectedInserted.x,inserted.y-expectedInserted.y,inserted.z-expectedInserted.z)<.01,'Inserted key captures the pre-insertion camera pose');
assert.equal(history.length,insertHistory+1,'Curve insertion creates one undo snapshot');
const insertionCount=editable.sdCameraFrames.length,repeatHistory=history.length,repeatPoint=ui.window.NAGWEB_SCROLL_CAMERA.mapPoint(inserted,insertSpec);
listeners.dblclick({button:0,clientX:repeatPoint.x/100*300,clientY:repeatPoint.y/100*200,target:insertTarget,preventDefault(){},stopPropagation(){}});
assert.equal(editable.sdCameraFrames.length,insertionCount,'Double clicking an occupied moment does not duplicate the key');
assert.equal(history.length,repeatHistory,'Selecting an existing curve key does not create history');
console.log('Camera smooth path: exact keys, per-segment tension, curve insertion, editor history, holds, samples and reduced motion OK');


const lookScene={...scene,sdCameraOrientationMode:'lookAt',sdCameraLookPathMode:'linear',sdCameraFrames:[
 {at:0,x:0,y:0,z:0,rotate:0,ease:'linear'},
 {at:100,x:0,y:0,z:0,rotate:40,ease:'linear'}
],sdCameraLookFrames:[
 {at:0,x:0,y:0,z:1000,ease:'linear'},
 {at:50,x:1000,y:0,z:0,ease:'linear'},
 {at:100,x:0,y:1000,z:1000,ease:'linear'}
]};
const lookConfig=C.config(lookScene);
assert.equal(lookConfig.orientationMode,'lookAt');assert.equal(C.config(scene).orientationMode,'manual');
assert.equal(lookConfig.lookPathMode,'linear');assert.equal(lookConfig.lookFrames.length,3);
let lookPose=C.pose(lookConfig,0,M,'linear',false);
assert.ok(Math.abs(lookPose.rotateX)<1e-9&&Math.abs(lookPose.rotateY)<1e-9);
lookPose=C.pose(lookConfig,.5,M,'linear',false);
assert.ok(Math.abs(lookPose.rotateX)<1e-9);assert.ok(Math.abs(lookPose.rotateY+90)<1e-9);
assert.equal(lookPose.rotate,20,'LookAt keeps authored horizon roll');
lookPose=C.pose(lookConfig,1,M,'linear',false);
assert.ok(Math.abs(lookPose.rotateX-45)<1e-9&&Math.abs(lookPose.rotateY)<1e-9);
const targetAt30=C.lookTarget({...lookConfig,lookFrames:C.normalizeLook([
 {at:0,x:0,y:0,z:1000,ease:'linear'},{at:30,x:300,y:0,z:1000,ease:'linear'},{at:100,x:-100,y:0,z:1000}
])},.3,M,'linear');
assert.equal(targetAt30.x,300,'Look target owns its own timing independent from camera keys');
const smoothLook={...lookConfig,lookPathMode:'smooth',lookFrames:C.normalizeLook([
 {at:0,x:-200,y:0,z:900,ease:'linear'},{at:50,x:0,y:200,z:1200,ease:'linear'},{at:100,x:300,y:-100,z:800}
])};
assert.ok(C.lookSamples(smoothLook,M,'linear').length>smoothLook.lookFrames.length);
const smoothLookAuto=C.lookTarget(smoothLook,.75,M,'linear'),lookFreeOut=C.setLookHandleMode(smoothLook.lookFrames,50,'out',true),lookFreeKey=lookFreeOut.find(k=>k.at===50);
assert.equal(C.handleFree(lookFreeKey,'out'),true);assert.equal(C.handleFree(lookFreeKey,'in'),false);
const smoothLookFree={...smoothLook,lookFrames:lookFreeOut},smoothLookCaptured=C.lookTarget(smoothLookFree,.75,M,'linear');
assert.ok(Math.hypot(smoothLookCaptured.x-smoothLookAuto.x,smoothLookCaptured.y-smoothLookAuto.y,smoothLookCaptured.z-smoothLookAuto.z)<1e-9,'Look free mode captures current automatic tangent without moving target path');
const movedLookFree=C.setLookFreeHandle(lookFreeOut,50,'out',{x:180,y:320,z:1450}),movedLookCfg={...smoothLook,lookFrames:movedLookFree},movedLookTarget=C.lookTarget(movedLookCfg,.75,M,'linear');
assert.ok(Math.hypot(movedLookTarget.x-smoothLookAuto.x,movedLookTarget.y-smoothLookAuto.y,movedLookTarget.z-smoothLookAuto.z)>1,'Moving free look handle changes independent target path');
assert.equal(C.lookTarget(movedLookCfg,.5,M,'linear').x,0);assert.equal(C.lookTarget(movedLookCfg,1,M,'linear').x,300);
const lookRoundTrip=C.normalizeLook(JSON.parse(JSON.stringify(movedLookFree))),lookRoundKey=lookRoundTrip.find(k=>k.at===50);
assert.equal(lookRoundKey.curveOutFree,true);assert.equal(lookRoundKey.curveOutDX,180);assert.equal(lookRoundKey.curveOutDY,120);assert.equal(lookRoundKey.curveOutDZ,250);
const autoLookAgain=C.setLookHandleMode(movedLookFree,50,'out',false),autoLookTarget=C.lookTarget({...smoothLook,lookFrames:autoLookAgain},.75,M,'linear');
assert.equal(C.handleFree(autoLookAgain.find(k=>k.at===50),'out'),false);assert.ok(Math.hypot(autoLookTarget.x-smoothLookAuto.x,autoLookTarget.y-smoothLookAuto.y,autoLookTarget.z-smoothLookAuto.z)<1e-9);
const linkedLookRound=C.normalizeLook([{at:0,targetId:'focus',x:0,y:0,z:1000,curveOutFree:true,curveOutDX:20,curveOutDY:-10,curveOutDZ:30},{at:100,targetId:'focus',x:0,y:0,z:1000}]);
assert.equal(linkedLookRound[0].targetId,'focus');assert.equal(linkedLookRound[0].curveOutFree,true);
editable={...lookScene,id:'look-insert-ui',sdEase:'linear'};
const lookInsertCfg=ui.window.NAGWEB_SCROLL_CAMERA.config(editable),lookInsertList=ui.window.NAGWEB_SCROLL_CAMERA.lookFrames(lookInsertCfg),lookInsertSize={width:1000,height:1000},lookInsertResolved=lookInsertList,lookInsertSpec=ui.window.NAGWEB_SCROLL_CAMERA.mapSpec(ui.window.NAGWEB_SCROLL_CAMERA.frames(lookInsertCfg,'linear').concat(lookInsertResolved),'top'),lookInsertTarget=ui.window.NAGWEB_SCROLL_CAMERA.lookTarget(lookInsertCfg,.25,M,'linear',lookInsertSize),lookInsertPoint=ui.window.NAGWEB_SCROLL_CAMERA.mapPoint(lookInsertTarget,lookInsertSpec);
const lookInsertMap={dataset:{plane:'top',range:String(lookInsertSpec.range)},getBoundingClientRect(){return{left:0,top:0,width:300,height:200};}},lookPathTarget={closest(selector){if(selector==='[data-camera-map]')return lookInsertMap;if(selector==='[data-camera-look-map-path-hit],[data-camera-look-map-path]')return this;return null;}};
const lookInsertHistory=history.length;
listeners.dblclick({button:0,clientX:lookInsertPoint.x/100*300,clientY:lookInsertPoint.y/100*200,target:lookPathTarget,preventDefault(){},stopPropagation(){}});
assert.equal(editable.sdCameraLookFrames.length,4,'Double click on dotted look path inserts a look target');
const insertedLook=editable.sdCameraLookFrames.find(k=>![0,50,100].includes(k.at));assert.ok(insertedLook&&!insertedLook.targetId,'Inserted look-path point is a manual XYZ target');
const expectedLook=ui.window.NAGWEB_SCROLL_CAMERA.lookTarget(lookInsertCfg,insertedLook.at/100,M,'linear',lookInsertSize);
assert.ok(Math.hypot(insertedLook.x-expectedLook.x,insertedLook.y-expectedLook.y,insertedLook.z-expectedLook.z)<.01);
assert.equal(history.length,lookInsertHistory+1,'Look-path insertion creates one undo snapshot');
const repeatLookHistory=history.length,repeatLookPoint=ui.window.NAGWEB_SCROLL_CAMERA.mapPoint(insertedLook,lookInsertSpec);
listeners.dblclick({button:0,clientX:repeatLookPoint.x/100*300,clientY:repeatLookPoint.y/100*200,target:lookPathTarget,preventDefault(){},stopPropagation(){}});
assert.equal(editable.sdCameraLookFrames.length,4,'Repeated double click on the same look target does not duplicate it');
assert.equal(history.length,repeatLookHistory,'Selecting an existing look target creates no history');
editable=lookScene;
const authoredPose={x:120,y:-40,z:80,rotateX:25,rotateY:-40,rotate:15},forward=C.forwardTarget(authoredPose,750),roundTrip=C.lookAngles(authoredPose,forward);
assert.ok(Math.abs(roundTrip.rotateX-authoredPose.rotateX)<1e-9);
assert.ok(Math.abs(roundTrip.rotateY-authoredPose.rotateY)<1e-9);
const manualLookSource=C.config({...scene,sdEase:'linear',sdCameraFrames:[
 {at:0,x:0,y:0,z:0,rotateX:10,rotateY:-20,rotate:0,ease:'linear'},
 {at:100,x:200,y:100,z:300,rotateX:-15,rotateY:35,rotate:10,ease:'linear'}
]});
const generatedLook=C.defaultLookFrames(manualLookSource,M,'linear',800);
assert.equal(generatedLook.length,2);assert.equal(generatedLook[0].at,0);assert.equal(generatedLook[1].at,100);
const generatedConfig={...manualLookSource,orientationMode:'lookAt',lookPathMode:'linear',lookFrames:generatedLook};
const generatedStart=C.pose(generatedConfig,0,M,'linear',false),generatedEnd=C.pose(generatedConfig,1,M,'linear',false);
assert.ok(Math.abs(generatedStart.rotateX-10)<1e-9&&Math.abs(generatedStart.rotateY+20)<1e-9);
assert.ok(Math.abs(generatedEnd.rotateX+15)<1e-9&&Math.abs(generatedEnd.rotateY-35)<1e-9);
assert.deepEqual(JSON.parse(JSON.stringify(C.pose(lookConfig,.5,M,'linear',true))),{x:0,y:0,z:0,rotateX:0,rotateY:0,rotate:0});
editable={...scene,id:'look-ui',sdEase:'linear',sdCameraFrames:[
 {at:0,x:0,y:0,z:0,rotateX:0,rotateY:0,ease:'linear'},
 {at:100,x:100,y:0,z:0,rotateX:0,rotateY:45,ease:'linear'}
]};
const beforeLookMode=history.length;
listeners.change({target:{dataset:{cameraOrientationMode:''},value:'lookAt'}});
assert.equal(editable.sdCameraOrientationMode,'lookAt');assert.equal(editable.sdCameraLookFrames.length,2);assert.equal(history.length,beforeLookMode+1);
const retainedLook=JSON.stringify(editable.sdCameraLookFrames);
listeners.change({target:{dataset:{cameraLookField:'x',cameraLookAt:String(editable.sdCameraLookFrames[0].at)},value:'250'}});
assert.equal(editable.sdCameraLookFrames[0].x,250);
listeners.change({target:{dataset:{cameraOrientationMode:''},value:'manual'}});
assert.equal(editable.sdCameraOrientationMode,'manual');assert.equal(JSON.stringify(editable.sdCameraLookFrames).includes('250'),true,'Manual mode preserves look targets');
assert.notEqual(JSON.stringify(editable.sdCameraLookFrames),retainedLook);
console.log('Camera look-at: independent target timing/path, angle solving, roll preservation, manual-to-look conversion, reduced motion and editor retention OK');

const targetScene={...scene,layout:'free',sdEase:'linear',elements:[
 {id:'focus',type:'heading',x:75,y:25,sdCameraDepth:100,sdKeyframes:[{at:0,x:0,y:0,z:0,ease:'linear'},{at:100,x:100,y:50,z:50}]},
 {id:'nested',type:'heading',parent:'focus',x:50,y:50},
 {id:'fixed-target',type:'heading',x:50,y:50,fixed:true}
],sdCameraOrientationMode:'lookAt',sdCameraLookPathMode:'linear',
sdCameraFrames:[{at:0,x:0,y:0,z:0,ease:'linear'},{at:100,x:0,y:0,z:0}],
sdCameraLookFrames:[{at:0,targetId:'focus',x:0,y:0,z:1000,ease:'linear'},{at:100,targetId:'focus',x:0,y:0,z:1000}]
};
const targetCfg=C.config(targetScene),targetCompiled=C.compile(targetCfg,M,'linear');
assert.deepEqual(Array.from(targetCfg.targets).map(x=>x.id),['focus']);
assert.equal(C.targetEligible(targetScene.elements[0],targetScene),true);
assert.equal(C.targetEligible(targetScene.elements[1],targetScene),false);assert.equal(C.targetEligible(targetScene.elements[2],targetScene),false);
assert.equal(C.targetEligible(targetScene.elements[0],{...targetScene,layout:'stack'}),false);
assert.equal(C.normalizeLook(targetScene.sdCameraLookFrames)[0].targetId,'focus','Look target binding survives normalization');
const resolvedTarget=C.elementTarget(targetCfg,'focus',.5,M,'linear',{width:1000,height:800},targetCompiled);
assert.deepEqual(JSON.parse(JSON.stringify(resolvedTarget)),{x:300,y:-175,z:125});
const targetPose=C.pose(targetCfg,.5,M,'linear',false,targetCompiled,{width:1000,height:800});
const expectedAngles=C.lookAngles({x:0,y:0,z:0},resolvedTarget);
assert.ok(Math.abs(targetPose.rotateX-expectedAngles.rotateX)<1e-9&&Math.abs(targetPose.rotateY-expectedAngles.rotateY)<1e-9);
const targetAtStart=C.elementTarget(targetCfg,'focus',0,M,'linear',{width:500,height:400},targetCompiled);
assert.deepEqual(JSON.parse(JSON.stringify(targetAtStart)),{x:125,y:-100,z:100},'Percent target resolves against current scene size');
const fallbackCfg={...targetCfg,targets:[]};
const fallback=C.lookTarget(fallbackCfg,.5,M,'linear',{width:1000,height:800},targetCompiled);
assert.equal(fallback.x,0);assert.equal(fallback.z,1000,'Deleted target falls back to stored XYZ');
assert.deepEqual(JSON.parse(JSON.stringify(C.pose(targetCfg,.5,M,'linear',true,targetCompiled,{width:1000,height:800}))),{x:0,y:0,z:0,rotateX:0,rotateY:0,rotate:0});
console.log('Camera element target: free-layout eligibility, responsive coordinates, Director XYZ following, fallback and reduced motion OK');
