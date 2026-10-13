'use strict';
// Run from the repository root: node tests/spatial-focus-map.integration.cjs
// No external dependencies: exercises the real editor event handlers in an isolated DOM.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const handlers={},pane={addEventListener(type,fn){handlers[type]=fn;},querySelector(){return control;},contains(){return false;}};
const previewDocument={listeners:{},addEventListener(t,fn){this.listeners[t]=fn;},removeEventListener(t,fn){if(this.listeners[t]===fn)delete this.listeners[t];},querySelector(){return null;}};
const previewWindow={NAGWEB_SPATIAL_SURFACE_PICK(id,x,y,sectionId){
 if(id==='glb'&&sectionId==='scene'&&x===330&&y===240)return {id,scale:1,point:{x:120,y:-35,z:-880}};
 return null;
}};
const document={getElementById(id){return id==='pane'?pane:id==='preview'?{contentDocument:previewDocument,contentWindow:previewWindow}:null;}};
const object={id:'glb',type:'shape3d',anchor:true,x:68,y:45,offZ:2,w:20,h:20,
 sdKeyframes:[{at:0,x:0,y:0,z:0,ease:'linear'},{at:100,x:80,y:20,z:40}]};
const title={id:'title',type:'heading',x:60,y:35,sdCameraDepth:100};
const scene={id:'scene',layout:'free',sdEnabled:true,sdCameraEnabled:true,sdPerspective:1000,
 sdCameraOrientationMode:'lookAt',sdEase:'linear',
 sdCameraFrames:[{at:0,x:0,y:0,z:0},{at:100,x:0,y:0,z:0}],
 sdCameraLookFrames:[{at:0,targetId:'glb',x:0,y:0,z:700,focusOffsetY:-60,ease:'linear'},
 {at:100,targetId:'glb',x:0,y:0,z:700,ease:'linear'}],
 elements:[object,title]};
let undos=0,saves=0,renders=0;
const window={NAGWEB_SCROLL_DIRECTOR:{progress(){return 0;},scrub(){}}};
const ctx={window,document,sec(){return scene;},snapshot(){undos++;},saveProject(){saves++;},
 renderPane(){renders++;},schedulePreview(){},toast(){},
 cRow(label,html){return html;},cSeg(){return '';},cNum(){return '';},cSel(){return '';},
 CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts.detail;}}};
for(const name of ['nagweb-story-model','nagweb-scroll-camera'])
 vm.runInNewContext(fs.readFileSync('js/'+name+'.js','utf8'),ctx,{filename:name+'.js'});
const C=window.NAGWEB_SCROLL_CAMERA;
const map={dataset:{plane:'front',range:'500',originX:'0',originAxis:'0'},
 getBoundingClientRect(){return {left:0,top:0,width:600,height:400};},querySelector(){return null;}};
let pointerCapture=false;
const control={dataset:{cameraLookMapPoint:'0'},style:{},listeners:{},
 closest(selector){if(selector==='[data-camera-map]')return map;if(selector==='[data-camera-look-map-point]')return this;return null;},
 matches(){return false;},addEventListener(t,fn){this.listeners[t]=fn;},removeEventListener(t){delete this.listeners[t];},
 setPointerCapture(){pointerCapture=true;},hasPointerCapture(){return pointerCapture;},releasePointerCapture(){pointerCapture=false;},focus(){}};
function key(name,shift=false){handlers.keydown({key:name,shiftKey:shift,target:control,preventDefault(){},stopPropagation(){}});}
function pointer(type,changes={}){
 const e={target:control,pointerId:23,button:0,clientX:220,clientY:150,shiftKey:false,preventDefault(){},stopPropagation(){},...changes};
 if(type==='down')handlers.pointerdown(e);else control.listeners[type](e);
}
function frame(){return {...scene.sdCameraLookFrames[0]};}
function near(a,b,msg){assert.ok(Math.abs(a-b)<1e-7,msg+': '+a+' vs '+b);}
const modelBefore=JSON.stringify(object),before=frame();
const panel=C.panel(scene);
assert.match(panel,/data-camera-spatial-focus="true"/);
assert.match(panel,/data-camera-focus-anchor-line/);
assert.match(panel,/data-camera-spatial-focus-help/);
key('ArrowRight');
near(frame().focusOffsetX,25,'Front ArrowRight X');near(frame().focusOffsetY,-60,'X preserves Y');
assert.equal(frame().targetId,'glb');assert.equal(undos,1);assert.equal(saves,1);
key('ArrowLeft');near(frame().focusOffsetX,0,'Reverse nudge');
map.dataset.plane='side';key('ArrowRight');near(frame().focusOffsetZ,25,'Side X-axis is Z');
map.dataset.plane='top';key('ArrowDown');near(frame().focusOffsetZ,0,'Top down decreases Z');
map.dataset.plane='front';
const original=frame(),startUndo=undos;
pointer('down');pointer('pointermove',{clientX:256,clientY:128});
assert.equal(undos,startUndo,'Preview must not create snapshots');
pointer('pointerup',{clientX:256,clientY:128});
assert.equal(undos,startUndo+1,'One drag, one history operation');
assert.ok(frame().focusOffsetX>original.focusOffsetX);
assert.ok(frame().focusOffsetY<original.focusOffsetY);
assert.equal(frame().targetId,'glb','Drag must not detach model');
assert.equal(JSON.stringify(object),modelBefore,'Drag never mutates model');
const confirmed=JSON.stringify(frame()),afterUndo=undos;
pointer('down');pointer('pointermove',{clientX:250,clientY:165});
control.listeners.keydown({key:'Escape',preventDefault(){},stopPropagation(){}});
assert.equal(JSON.stringify(frame()),confirmed,'Escape cancels editing');
assert.equal(undos,afterUndo);assert.equal(pointerCapture,false,'Capture is released');
scene.sdCameraLookFrames[0]={...scene.sdCameraLookFrames[0],targetId:'title'};
const htmlBefore=JSON.stringify(frame());
key('ArrowRight');
assert.equal(JSON.stringify(frame()),htmlBefore,'Linked HTML stays protected');
assert.equal(undos,afterUndo);
const htmlPanel=C.panel(scene);
assert.match(htmlPanel,/disabled title="Desvinculá el elemento/);
// Click-to-focus is opt-in; it reuses the same linked-look keyframes.
scene.sdCameraLookFrames[0]={...scene.sdCameraLookFrames[0],targetId:'glb'};
C.panel(scene);
handlers.change({target:{dataset:{cameraObjectSelect:''},value:'0'}});
const action={dataset:{cameraSurfaceAim:''}};
const clickSurface=()=>handlers.click({target:{closest(){return action;}}});
const converted=C.surfaceFocusFromWorld({scale:2,point:{x:240,y:-70,z:-1760}});
assert.equal(converted.x,120);assert.equal(converted.y,35);assert.equal(converted.z,880);
assert.equal(C.surfaceFocusFromWorld({scale:0,point:{x:0,y:0,z:0}}),null);
assert.equal(C.surfaceFocusFromWorld({scale:1,point:{x:NaN,y:0,z:0}}),null);
const priorModel=JSON.stringify(object),surfaceUndoStart=undos;
clickSurface();assert.equal(typeof previewDocument.listeners.pointerdown,'function');
previewDocument.listeners.pointerdown({button:0,clientX:111,clientY:240});
assert.equal(undos,surfaceUndoStart,'missed click must never save an approximate focus');
previewDocument.listeners.pointerdown({button:0,clientX:330,clientY:240,preventDefault(){},stopImmediatePropagation(){}});
assert.equal(undos,surfaceUndoStart+1,'one surface selection creates one Undo operation');
assert.equal(scene.sdCameraLookFrames[0].targetId,'glb','point stays linked to chosen GLB');
assert.equal(scene.sdCameraLookFrames[0].x,120,'fallback uses surface X');
assert.equal(scene.sdCameraLookFrames[0].y,35,'fallback Y converts Three to CSS');
assert.equal(scene.sdCameraLookFrames[0].z,880,'fallback depth converts Three to CSS');
assert.equal(JSON.stringify(object),priorModel,'surface focus never modifies model');
assert.equal(previewDocument.listeners.pointerdown,undefined,'one-shot surface tool releases its listener');
clickSurface();assert.equal(typeof previewDocument.listeners.keydown,'function');
previewDocument.listeners.keydown({key:'Escape',preventDefault(){},stopPropagation(){}});
assert.equal(previewDocument.listeners.pointerdown,undefined,'Escape cancels surface targeting');
console.log('PASS spatial focus map: model focus, exact surface click, missing geometry, cancel, fallback and Undo');


// Direct manual-camera orientation works in the existing preview runtime.
// The temporary pose updates the real CSS camera transform before any save.
scene.sdCameraOrientationMode='manual';
scene.sdCameraFrames=[{at:0,x:0,y:0,z:0,rotateX:0,rotateY:0,rotate:0},{at:100,x:0,y:0,z:0,rotateX:0,rotateY:0,rotate:0}];
const cssFrames=[];
const world={classList:{contains(name){return name==='inner';}},style:{},setAttribute(){},children:[],
 animate(frames){cssFrames.push(frames[0].transform);return {pause(){},cancel(){},effect:{setKeyframes(next){cssFrames.push(next[0].transform);}}};}};
let captured=false;
const viewportStage={children:[world],style:{},clientWidth:600,clientHeight:400,clientLeft:0,clientTop:0,
 getBoundingClientRect(){return {left:0,top:0,right:600,bottom:400,width:600,height:400};},
 dispatchEvent(){},setPointerCapture(){captured=true;},hasPointerCapture(){return captured;},releasePointerCapture(){captured=false;}};
assert.ok(C.attach(viewportStage,C.config(scene),1000),'Existing camera must attach');
assert.equal(typeof viewportStage.__nwCameraPreviewPose,'function');
assert.equal(viewportStage.__nwCameraPreviewPose({x:0,y:0,z:0,rotateX:12,rotateY:-20,rotate:0}),true);
assert.ok(cssFrames.some(v=>v.includes('rotateX(-12deg)')&&v.includes('rotateY(20deg)')),'Temporary camera pose must repaint CSS before save');
const fakeSection={getAttribute(name){return name==='data-id'?'scene':null;},querySelector(sel){return sel==='.nw-sd-stage'?viewportStage:null;}};
previewDocument.querySelectorAll=()=>[fakeSection];
let restores=0;
previewWindow.__NAG_SCROLL_DIRECTOR={scene:{set(){restores++;}}};
const orbitIframe={contentDocument:previewDocument,contentWindow:previewWindow,
 load:null,addEventListener(type,fn){if(type==='load')this.load=fn;},
 removeEventListener(type,fn){if(type==='load'&&this.load===fn)this.load=null;}};
const outsideListeners={};
document.getElementById=id=>id==='pane'?pane:id==='preview'?orbitIframe:null;
document.addEventListener=(type,fn)=>{outsideListeners[type]=fn;};
document.removeEventListener=(type,fn)=>{if(outsideListeners[type]===fn)delete outsideListeners[type];};
C.panel(scene);
const orbitButton={dataset:{cameraViewportOrbit:''}};
const orbitClick=()=>handlers.click({target:{closest(){return orbitButton;}}});
const beforeOrbit=undos,beforeOrbitSave=saves;
orbitClick();
assert.equal(typeof previewDocument.listeners.pointerdown,'function','Orbit mode must be armed explicitly');
previewDocument.listeners.pointerdown({button:0,pointerId:88,clientX:100,clientY:100,preventDefault(){},stopImmediatePropagation(){}});
previewDocument.listeners.pointermove({pointerId:88,clientX:280,clientY:180,shiftKey:false,preventDefault(){}});
assert.equal(undos,beforeOrbit,'Preview must not create Undo entries during a drag');
assert.ok(cssFrames.length>1,'Dragging must update the real camera preview');
previewDocument.listeners.pointerup({pointerId:88,clientX:280,clientY:180,shiftKey:false,preventDefault(){}});
assert.equal(undos,beforeOrbit+1,'One viewport drag must create one Undo entry');
assert.equal(saves,beforeOrbitSave+1,'One viewport drag must save only once');
const addedOrbit=scene.sdCameraFrames.find(k=>k.at===0);
assert.equal(addedOrbit.rotateY,-54);
assert.equal(addedOrbit.rotateX,24);
assert.equal(previewDocument.listeners.pointerdown,undefined,'Completed orbit must release preview listeners');
assert.equal(orbitIframe.load,null,'Completed orbit must release iframe load listener');
orbitClick();
assert.equal(typeof previewDocument.listeners.pointerdown,'function');
outsideListeners.keydown({key:'Escape',preventDefault(){},stopPropagation(){}});
assert.equal(previewDocument.listeners.pointerdown,undefined,'Escape must cancel even before any drag');
orbitClick();
previewDocument.listeners.pointerdown({button:0,pointerId:91,clientX:200,clientY:100,preventDefault(){},stopImmediatePropagation(){}});
previewDocument.listeners.pointermove({pointerId:91,clientX:300,clientY:200,shiftKey:true,preventDefault(){}});
outsideListeners.keydown({key:'Escape',preventDefault(){},stopPropagation(){}});
assert.equal(undos,beforeOrbit+1,'Escape during drag must restore without history');
assert.equal(saves,beforeOrbitSave+1);
assert.ok(restores>=2,'Director must recover authority after commit and cancel');
const locked=C.orbitPose({rotateX:3,rotateY:2},100,10,600,400,true);
assert.equal(locked.rotateX,3,'Shift locks the smaller vertical axis');
assert.equal(locked.rotateY,-28);
assert.equal(C.orbitPose({},5,5,0,100,false),null,'Invalid viewport cannot change camera');
console.log('PASS camera viewport orbit: CSS live pose, commit once, Escape, Shift lock, and preview cleanup');


// Direct XYZ viewport translation reuses the Director's camera preview
// without a second progress evaluator or changes to GLB meshes.
const xyzOriginal=C.translatePose({x:10,y:20,z:30},'xy',15,-7,1);
assert.equal(xyzOriginal.x,25);assert.equal(xyzOriginal.y,13);assert.equal(xyzOriginal.z,30);
assert.equal(C.translatePose({x:10,y:20,z:30},'z',0,-10,1).z,50);
assert.equal(C.translatePose({x:10,y:20,z:30},'y',99,10,.2).y,22);
assert.equal(C.translatePose({x:10,y:20,z:30},'x',10,20,1).x,20);
assert.equal(C.translatePose({x:10,y:20,z:30},'bad',10,20,1),null);
assert.equal(C.translatePose({x:10,y:20,z:30},'x',Infinity,20,1),null);
assert.equal(C.translatePose({x:3995,y:20,z:30},'x',100,0,1).x,4000,'Translation clamps to camera bounds');
const fakeUi={
 style:{},listeners:{},innerHTML:'',parentNode:null,
 setAttribute(){},
 addEventListener(type,fn){this.listeners[type]=fn;},
 removeEventListener(type,fn){if(this.listeners[type]===fn)delete this.listeners[type];}
};
let liveOverlay=null;
previewDocument.createElement=()=>Object.assign({},fakeUi,{style:{},listeners:{}});
viewportStage.appendChild=element=>{liveOverlay=element;element.parentNode=viewportStage;};
viewportStage.removeChild=element=>{assert.equal(liveOverlay,element);liveOverlay=null;element.parentNode=null;};
scene.sdCameraOrientationMode='lookAt';
const modelInvariant=JSON.stringify(scene.elements);
const originalCameraPose=C.pose(C.config(scene),0,window.NAGWEB_STORY_MODEL,scene.sdEase,false);
C.panel(scene);
assert.match(C.panel(scene),/data-camera-viewport-translate/,'XYZ tool should work with Mirar hacia');
const xyzButton={dataset:{cameraViewportTranslate:''}};
const toggleXYZ=()=>handlers.click({target:{closest(){return xyzButton;}}});
const axisHandle=axis=>({
 axis,captured:false,
 getAttribute(k){return k==='data-nw-camera-axis'?axis:null;},
 closest(k){return k==='[data-nw-camera-axis]'?this:null;},
 setPointerCapture(){this.captured=true;},
 hasPointerCapture(){return this.captured;},
 releasePointerCapture(){this.captured=false;}
});
const downAxis=(handle,pointerId=34,x=100,y=120)=>liveOverlay.listeners.pointerdown({
 target:handle,button:0,pointerId,clientX:x,clientY:y,
 preventDefault(){},stopPropagation(){}
});
const moveAxis=(id,x,y,shift=false)=>previewDocument.listeners.pointermove({
 pointerId:id,clientX:x,clientY:y,shiftKey:shift,preventDefault(){}
});
const finishAxis=(id,x,y,shift=false)=>previewDocument.listeners.pointerup({
 pointerId:id,clientX:x,clientY:y,shiftKey:shift,preventDefault(){}
});
const beforeXYZ=undos,savedBeforeXYZ=saves,canvasBeforeXYZ=cssFrames.length;
toggleXYZ();
assert.ok(liveOverlay&&liveOverlay.innerHTML.includes('data-nw-camera-axis="xy"'),'XYZ overlay must show four axis handles');
assert.match(C.panel(scene),/Cerrar controles XYZ/);
const xHandle=axisHandle('x');
downAxis(xHandle);
moveAxis(34,220,120);
assert.equal(undos,beforeXYZ,'Preview moving X must not create Undo before release');
assert.ok(cssFrames.length>canvasBeforeXYZ,'Live preview updates the camera CSS transform');
finishAxis(34,220,120);
assert.equal(undos,beforeXYZ+1,'X drag creates one Undo');
assert.equal(saves,savedBeforeXYZ+1,'X drag persists once');
assert.equal(scene.sdCameraFrames[0].x,originalCameraPose.x+120);
assert.equal(scene.sdCameraFrames[0].y,originalCameraPose.y);
assert.equal(scene.sdCameraFrames[0].z,originalCameraPose.z);
assert.equal(JSON.stringify(scene.elements),modelInvariant,'Camera translation never mutates a GLB');
assert.ok(liveOverlay,'XYZ controls remain available for additional axes');
assert.equal(xHandle.captured,false,'Pointer capture releases after saving');
const beforeCancelXYZ=undos;
downAxis(axisHandle('y'),36,180,120);
moveAxis(36,180,210);
outsideListeners.keydown({key:'Escape',preventDefault(){},stopPropagation(){}});
assert.equal(undos,beforeCancelXYZ,'Escape cancels XYZ drag without history');
assert.equal(liveOverlay,null,'Escape removes XYZ handles');
assert.equal(previewDocument.listeners.pointermove,undefined,'Escape unbinds pointer tracking');
assert.equal(orbitIframe.load,null,'Escape unbinds iframe listener');
assert.ok(restores>=3,'Director reclaims preview on cancel');
toggleXYZ();
downAxis(axisHandle('z'),37,150,150);
moveAxis(37,150,50,true);
finishAxis(37,150,50,true);
assert.equal(scene.sdCameraFrames[0].z,originalCameraPose.z+40,'Z moves forward by 2x drag with Shift 20% precision');
assert.equal(undos,beforeCancelXYZ+1,'Z move saves once');
const beforeXY=scene.sdCameraFrames[0];
const savedXY={x:beforeXY.x,y:beforeXY.y,z:beforeXY.z};
downAxis(axisHandle('xy'),38,120,120);
moveAxis(38,160,145);
finishAxis(38,160,145);
assert.equal(scene.sdCameraFrames[0].x,savedXY.x+40,'XY drag moves X');
assert.equal(scene.sdCameraFrames[0].y,savedXY.y+25,'XY drag moves Y');
assert.equal(scene.sdCameraFrames[0].z,savedXY.z,'XY drag preserves Z');
const beforeKeyboardXYZ=undos;
const yKey=axisHandle('y');
liveOverlay.listeners.keydown({target:yKey,key:'ArrowDown',shiftKey:true,preventDefault(){},stopPropagation(){}});
assert.equal(scene.sdCameraFrames[0].y,savedXY.y+27,'Accessible keyboard nudge is precision-aware');
assert.equal(undos,beforeKeyboardXYZ+1,'Keyboard nudge saves once');
toggleXYZ();
assert.equal(liveOverlay,null,'Closing XYZ toolbar unmounts overlay');
console.log('PASS camera viewport translation: live XYZ/XY, GLB isolation, lookAt, Escape, Shift, Undo, keyboard, overlay cleanup');


// Model-space Z completes existing projected X/Y editing without modifying
// any keyframe of the camera or the GLB geometry.
assert.equal(C.objectDepthDrag(1,-100,false),2);
assert.equal(C.objectDepthDrag(1,-100,true),1.2);
assert.equal(C.objectDepthDrag(-1,100,false),-2);
assert.equal(C.objectDepthDrag(99.9,-1000,false),100);
assert.equal(C.objectDepthDrag(1,NaN,false),null);
object.offZ=0;
const depthEvents=[];
previewWindow.NAGWEB_SPATIAL_SCREEN_POINT=(id,sectionId)=>id==='glb'&&sectionId==='scene'?{x:150,y:160}:null;
previewWindow.NAGWEB_SPATIAL_PREVIEW_DEPTH=(id,value,sectionId,commit)=>{
 depthEvents.push({id,value,sectionId,commit:!!commit});return id==='glb'&&sectionId==='scene';
};
previewDocument.createElement=()=>({
 style:{},listeners:{},parentNode:null,textContent:'',
 setAttribute(){},addEventListener(t,fn){this.listeners[t]=fn;},
 removeEventListener(t,fn){if(this.listeners[t]===fn)delete this.listeners[t];},
 hasPointerCapture(){return !!this.captured;},
 setPointerCapture(){this.captured=true;},releasePointerCapture(){this.captured=false;}
});
const modelStateBefore=JSON.stringify({camera:scene.sdCameraFrames,look:scene.sdCameraLookFrames,model:object.sdKeyframes});
const depthButton={dataset:{cameraObjectDepth:''}},depthClick=()=>handlers.click({target:{closest(){return depthButton;}}});
const prevDepthUndo=undos,prevDepthSave=saves;
C.panel(scene);
assert.match(C.panel(scene),/data-camera-object-depth/,'Inspector exposes selected 3D depth tool');
depthClick();
assert.ok(liveOverlay&&liveOverlay.listeners.pointerdown,'Depth control must mount over the stage');
assert.equal(liveOverlay.textContent,'↕ Z 0','Handle labels current authored depth');
assert.match(C.panel(scene),/Cerrar editor de profundidad/);
const depthHandle=liveOverlay;
depthHandle.listeners.pointerdown({button:0,pointerId:61,clientY:150,preventDefault(){},stopPropagation(){}});
previewDocument.listeners.pointermove({pointerId:61,clientY:50,shiftKey:false,preventDefault(){}});
assert.equal(undos,prevDepthUndo,'Object depth drag must preview without Undo');
assert.equal(depthEvents.at(-1).value,1,'Upward drag moves the 3D model forward');
assert.equal(depthHandle.textContent,'↕ Z 1');
previewDocument.listeners.pointerup({pointerId:61,clientY:50,shiftKey:false,preventDefault(){}});
assert.equal(object.offZ,1,'Confirmed depth updates only the authored offZ value');
assert.equal(depthEvents.at(-1).commit,true,'Depth is promoted to the iframe source instead of left transient');
assert.equal(undos,prevDepthUndo+1,'Confirmed depth creates exactly one Undo entry');
assert.equal(saves,prevDepthSave+1,'Confirmed depth saves once');
assert.equal(liveOverlay,null,'Committed tool removes itself');
assert.equal(JSON.stringify({camera:scene.sdCameraFrames,look:scene.sdCameraLookFrames,model:object.sdKeyframes}),modelStateBefore,'Depth edit leaves timeline and GLB motion unchanged');
depthClick();
const duringCancel=liveOverlay;
duringCancel.listeners.pointerdown({button:0,pointerId:63,clientY:120,preventDefault(){},stopPropagation(){}});
previewDocument.listeners.pointermove({pointerId:63,clientY:0,shiftKey:false,preventDefault(){}});
outsideListeners.keydown({key:'Escape',preventDefault(){},stopPropagation(){}});
assert.equal(duringCancel.captured,false,'Depth Escape frees iframe pointer capture');
assert.equal(object.offZ,1,'Escape cancels unsaved changes');
assert.equal(undos,prevDepthUndo+1);
assert.equal(depthEvents.at(-1).value,null,'Cancelled edit clears renderer override');
assert.equal(liveOverlay,null,'Escape disposes the editor-only depth control');
depthClick();
const keyboardHandle=liveOverlay;
const beforeDepthKeyboard=undos;
keyboardHandle.listeners.keydown({key:'ArrowUp',shiftKey:true,preventDefault(){},stopPropagation(){}});
assert.equal(object.offZ,1.02,'Keyboard Shift nudge preserves fine depth precision');
assert.equal(depthEvents.at(-1).commit,true,'Keyboard depth nudge promotes confirmed value');
assert.equal(undos,beforeDepthKeyboard+1,'Keyboard nudge creates one Undo');
assert.equal(liveOverlay,null);
depthClick();
orbitIframe.load();
assert.equal(liveOverlay,null,'Preview reload disposes 3D gizmo');
assert.equal(depthEvents.at(-1).value,null,'Preview reload clears temporary depth');
assert.equal(previewDocument.listeners.pointermove,undefined,'Depth listeners must not leak after reload');
console.log('PASS object depth gizmo: projected model, live preview, axis units, Undo, keyboard, Escape and cleanup');


// The object's base 3D transform composes with its existing Director animation,
// without adding a competing progress evaluator.
assert.equal(C.objectBaseTransformDrag(0,'RotateY',100,0,false),60);
assert.equal(C.objectBaseTransformDrag(0,'RotateX',0,-100,false),60);
assert.equal(C.objectBaseTransformDrag(100,'Scale',0,-100,false),150);
assert.equal(C.objectBaseTransformDrag(100,'Scale',0,-100,true),110);
assert.equal(C.objectBaseTransformDrag(100,'Scale',0,-10000,false),500);
assert.equal(C.objectBaseTransformDrag(0,'RotateX',0,NaN,false),null);
assert.equal(C.objectBaseTransformDrag(0,'bad',100,0,false),null);
const baseEvents=[];
previewWindow.NAGWEB_SPATIAL_PREVIEW_BASE_TRANSFORM=(id,axis,value,sectionId,commit)=>{
 baseEvents.push({id,axis,value,sectionId,commit:!!commit});return id==='glb'&&sectionId==='scene';
};
const baseButton={dataset:{cameraObjectTransform:''}},baseClick=()=>handlers.click({target:{closest(){return baseButton;}}});
const staticBefore={camera:JSON.stringify(scene.sdCameraFrames),look:JSON.stringify(scene.sdCameraLookFrames),motion:JSON.stringify(object.sdKeyframes)};
const beforeBaseUndo=undos,beforeBaseSave=saves;
assert.match(C.panel(scene),/data-camera-object-transform/,'3D model inspector exposes base transform controls');
baseClick();
assert.ok(liveOverlay&&liveOverlay.innerHTML.includes('data-nw-base-axis="RotateX"'));
assert.ok(liveOverlay.innerHTML.includes('data-nw-base-axis="RotateY"'));
assert.ok(liveOverlay.innerHTML.includes('data-nw-base-axis="Scale"'));
assert.match(C.panel(scene),/Cerrar controles de giro\/tamaño/);
const yawHandle=axisHandle('RotateY');
yawHandle.getAttribute=k=>k==='data-nw-base-axis'?'RotateY':null;
yawHandle.closest=k=>k==='[data-nw-base-axis]'?yawHandle:null;
liveOverlay.listeners.pointerdown({target:yawHandle,button:0,pointerId:75,clientX:100,clientY:100,preventDefault(){},stopPropagation(){}});
previewDocument.listeners.pointermove({pointerId:75,clientX:200,clientY:100,shiftKey:false,preventDefault(){}});
assert.equal(undos,beforeBaseUndo,'Gizmo must not save any intermediate frame');
assert.equal(baseEvents.at(-1).value,60,'Live renderer sees yaw rotation');
previewDocument.listeners.pointerup({pointerId:75,clientX:200,clientY:100,shiftKey:false,preventDefault(){}});
assert.equal(object.nwSpatialRotateY,60,'Committed 3D base yaw is stored');
assert.equal(undos,beforeBaseUndo+1,'One drag is one undo operation');
assert.equal(saves,beforeBaseSave+1,'One drag is one save operation');
assert.equal(liveOverlay,null,'Gizmo exits after commit');
assert.equal(JSON.stringify(scene.sdCameraFrames),staticBefore.camera,'Gizmo does not modify camera');
assert.equal(JSON.stringify(scene.sdCameraLookFrames),staticBefore.look,'Gizmo does not modify focus');
assert.equal(JSON.stringify(object.sdKeyframes),staticBefore.motion,'Gizmo does not override animated track');
baseClick();
const pitchHandle=axisHandle('RotateX');
pitchHandle.getAttribute=k=>k==='data-nw-base-axis'?'RotateX':null;
pitchHandle.closest=k=>k==='[data-nw-base-axis]'?pitchHandle:null;
liveOverlay.listeners.pointerdown({target:pitchHandle,button:0,pointerId:76,clientX:100,clientY:150,preventDefault(){},stopPropagation(){}});
previewDocument.listeners.pointermove({pointerId:76,clientX:100,clientY:50,shiftKey:false,preventDefault(){}});
outsideListeners.keydown({key:'Escape',preventDefault(){},stopPropagation(){}});
assert.equal(pitchHandle.captured,false,'Base rotation Escape releases iframe pointer capture');
assert.equal(object.nwSpatialRotateX,undefined,'Cancel never persists pitch');
assert.equal(undos,beforeBaseUndo+1,'Cancel never snapshots');
assert.equal(baseEvents.at(-1).axis,'RotateX');
assert.equal(baseEvents.at(-1).value,null,'Cancel removes transient rotation from renderer');
assert.equal(liveOverlay,null,'Escape unmounts base-transform UI');
assert.equal(previewDocument.listeners.pointermove,undefined,'Escape removes gesture listeners');
baseClick();
const scaleHandle=axisHandle('Scale');
scaleHandle.getAttribute=k=>k==='data-nw-base-axis'?'Scale':null;
scaleHandle.closest=k=>k==='[data-nw-base-axis]'?scaleHandle:null;
liveOverlay.listeners.pointerdown({target:scaleHandle,button:0,pointerId:77,clientX:110,clientY:150,preventDefault(){},stopPropagation(){}});
previewDocument.listeners.pointermove({pointerId:77,clientX:110,clientY:50,shiftKey:true,preventDefault(){}});
previewDocument.listeners.pointerup({pointerId:77,clientX:110,clientY:50,shiftKey:true,preventDefault(){}});
assert.equal(object.nwSpatialScale,110,'Scale gizmo saves precision change');
const keyUndoStart=undos;
baseClick();
const keyboardPitch=axisHandle('RotateX');
keyboardPitch.getAttribute=k=>k==='data-nw-base-axis'?'RotateX':null;
keyboardPitch.closest=k=>k==='[data-nw-base-axis]'?keyboardPitch:null;
liveOverlay.listeners.keydown({target:keyboardPitch,key:'ArrowUp',shiftKey:true,preventDefault(){},stopPropagation(){}});
assert.equal(object.nwSpatialRotateX,1.2,'Keyboard precision works on pitch');
assert.equal(undos,keyUndoStart+1,'Keyboard adjustment produces one undo');
assert.equal(liveOverlay,null,'Keyboard save exits the editor');
baseClick();
orbitIframe.load();
assert.equal(liveOverlay,null,'Iframe reload removes the base gizmo');
assert.equal(orbitIframe.load,null,'Iframe load listener was released');
console.log('PASS object base gizmo: X/Y rotation, uniform scale, no timeline interference, Shift, keyboard, Escape and cleanup');


// Integration across tools: changing selection, preview reload and switching
// camera gestures must not leave invisible/competing editor listeners behind.
const bridgeAtStart=baseEvents.length,undoBeforeModes=undos,saveBeforeModes=saves;
scene.sdCameraOrientationMode='manual';
C.panel(scene);
baseClick();
const commitHandle=axisHandle('RotateY');
commitHandle.getAttribute=k=>k==='data-nw-base-axis'?'RotateY':null;
commitHandle.closest=k=>k==='[data-nw-base-axis]'?commitHandle:null;
const lastBase=object.nwSpatialRotateY;
liveOverlay.listeners.pointerdown({target:commitHandle,button:0,pointerId:96,clientX:150,clientY:150,preventDefault(){},stopPropagation(){}});
previewDocument.listeners.pointermove({pointerId:96,clientX:200,clientY:150,shiftKey:false,preventDefault(){}});
const previewCommit=baseEvents.at(-1);
previewDocument.listeners.pointerup({pointerId:96,clientX:200,clientY:150,shiftKey:false,preventDefault(){}});
assert.equal(object.nwSpatialRotateY,lastBase+30,'Scene editor commits second yaw to authored base');
assert.equal(baseEvents.at(-1).value,previewCommit.value,'Committed pose retains its position');
assert.equal(baseEvents.at(-1).commit,true,'Confirmed pose is promoted into the live renderer rather than left as a temporary override');
assert.equal(undos,undoBeforeModes+1);
assert.equal(saves,saveBeforeModes+1);
baseClick();
assert.ok(liveOverlay,'Selected 3D object exposes rotation controls');
const recordedBeforeSelect=baseEvents.length;
handlers.click({target:{closest(){return {dataset:{cameraSceneObjectPick:'1'}};}}});
assert.equal(liveOverlay,null,'Selecting HTML from spatial map removes stale 3D gizmo');
assert.equal(baseEvents.length,recordedBeforeSelect,'Selection does not undo a previously confirmed 3D pose');
assert.equal(undos,undoBeforeModes+1,'Selection change never snapshots a transform');
handlers.change({target:{dataset:{cameraObjectSelect:''},value:'0'}});
baseClick();
assert.ok(liveOverlay);
scene.sdCameraEnabled=false;C.panel(scene);
assert.equal(liveOverlay,null,'Disabling camera removes object transformation tools');
scene.sdCameraEnabled=true;C.panel(scene);
const aimWhenManual=()=>handlers.click({target:{closest(){return action;}}});
aimWhenManual();
assert.equal(typeof previewDocument.listeners.pointerdown,'function','Surface picking arms normally after other tools');
assert.ok(orbitIframe.load,'Surface picking now attaches a preview reload handler');
orbitClick();
assert.equal(typeof previewDocument.listeners.pointermove, 'undefined','Starting orbit does not inherit a surface drag');
assert.equal(orbitIframe.load!==null,true);
assert.equal(previewDocument.listeners.pointerdown!==undefined,true,'Orbit replaces surface tool, not stacks with it');
aimWhenManual();
assert.equal(orbitIframe.load!==null,true,'Surface picker owns reload after cancelling orbit');
assert.equal(typeof previewDocument.listeners.pointerdown,'function');
orbitIframe.load();
assert.equal(previewDocument.listeners.pointerdown,undefined,'Reload removes pending surface click');
assert.equal(orbitIframe.load,null,'Reload removes the old load listener');
assert.equal(previewDocument.listeners.keydown,undefined,'Reload removes stale Escape handler');
assert.equal(undos,undoBeforeModes+1,'Mode switches and reload do not change project');
assert.equal(JSON.stringify(scene.sdCameraLookFrames),staticBefore.look,'Switching tools does not modify lookAt path');
console.log('PASS 3D editor modes: selection cleanup, preview commit continuity, orbit/surface exclusivity, iframe reload');


// Spatial-first workflow: all objects, layer ordering and the SAME authored
// depth fields used by existing HTML planes and the Three renderer.
scene.sdCameraOrientationMode='manual';scene.sdCameraEnabled=true;scene.layout='free';
const layersBefore=JSON.stringify(scene.sdCameraFrames),motionBefore=JSON.stringify(object.sdKeyframes);
const extraLayers=Array.from({length:20},(_,i)=>({id:'layer-'+i,type:'heading',text:'Plano '+i,x:45+i%6,y:42+i%4,sdCameraDepth:450-i*25}));
scene.elements.push(...extraLayers);
const bigMap=C.panel(scene);
assert.match(bigMap,/Editar espacio 3D · Ver cámara y objetos/,'Spatial view entry is discoverable');
assert.match(bigMap,/data-camera-layer-list/,'Existing map gains a layered object list');
assert.match(bigMap,/data-camera-scene-object="21"/,'The object map no longer silently truncates at 16');
assert.match(bigMap,/data-camera-object-world-z/,'Selected model has a shared world-Z field');
assert.match(bigMap,/background:#fff!important;color:#171717!important/,'Camera fields always have readable contrast');
const editSpace={dataset:{cameraSpaceOpen:''}};
handlers.click({target:{closest(){return editSpace;}}});
assert.match(C.panel(scene),/data-camera-map-box open/,'Edit space opens the actual map, not a parallel viewport');
const domLayer={dataset:{cameraLayerPick:'1'}};
handlers.click({target:{closest(){return domLayer;}}});
const domPanel=C.panel(scene);
assert.match(domPanel,/Profundidad del objeto · Z/,'DOM layer can be edited from the spatial inspector');
const beforeDomUndo=undos,oldDepth=title.sdCameraDepth;
handlers.change({target:{dataset:{cameraObjectWorldZ:'1'},value:'350'}});
assert.equal(title.sdCameraDepth,350,'World depth is persisted into existing sdCameraDepth');
assert.equal(undos,beforeDomUndo+1,'World Z edit adds exactly one undo');
assert.equal(oldDepth,100);
const objLayer={dataset:{cameraLayerPick:'0'}};
handlers.click({target:{closest(){return objLayer;}}});
const before3DUndo=undos,previousOffZ=object.offZ,shapeMotion=JSON.stringify(object.sdKeyframes);
handlers.change({target:{dataset:{cameraObjectWorldZRange:'1'},value:'1400'}});
assert.ok(Math.abs(object.offZ-previousOffZ)>.1,'Three world-Z slider converts to authored offZ');
assert.equal(undos,before3DUndo+1,'Three depth slider creates one undo');
assert.equal(JSON.stringify(object.sdKeyframes),shapeMotion,'World Z never edits model keyframes');
assert.equal(JSON.stringify(scene.sdCameraFrames),layersBefore,'World Z never alters camera waypoints');
assert.equal(JSON.stringify(object.sdKeyframes),motionBefore);
scene.layout='stack';
assert.ok(!C.panel(scene).includes('data-camera-layer-list'),'Map never fabricates 3D coordinates for stack layout');
scene.layout='free';scene.elements.splice(scene.elements.length-extraLayers.length);
console.log('PASS spatial editor: 22 visible object guides, discoverable map, DOM/GLB world Z editing, Undo and untouched camera/motion');


// Spatial map is an editable compositing view: moving a DOM plane or a GLB
// anchor must preserve their Director tracks and produce one undo per gesture.
scene.layout='free';scene.sdCameraEnabled=true;scene.sdCameraOrientationMode='manual';
let activePointerShield=null;
document.body={
 appendChild(node){this.child=node;node.parentNode=this;activePointerShield=node;},
 removeChild(node){assert.equal(this.child,node,'Remove only the active drag shield');this.child=null;node.parentNode=null;activePointerShield=null;}
};
document.createElement=()=>({style:{},attributes:{},parentNode:null,captured:false,listeners:{},
 setAttribute(key,value){this.attributes[key]=value;},
 addEventListener(type,fn){this.listeners[type]=fn;},
 removeEventListener(type,fn){if(this.listeners[type]===fn)delete this.listeners[type];},
 setPointerCapture(){this.captured=true;},
 hasPointerCapture(){return this.captured;},
 releasePointerCapture(){this.captured=false;}
});
const mapObj={dataset:{plane:'top',range:'500',originX:'0',originAxis:'0'},captured:false,listeners:{},
 getBoundingClientRect(){return {left:10,top:20,width:600,height:400};},querySelector(){return null;},
 addEventListener(t,fn){this.listeners[t]=fn;},removeEventListener(t,fn){if(this.listeners[t]===fn)delete this.listeners[t];},
 setPointerCapture(){this.captured=true;},hasPointerCapture(){return this.captured;},releasePointerCapture(){this.captured=false;}};
function mapHandle(index){
 const holder={transform:null,setAttribute(name,value){if(name==='transform')this.transform=value;}};
 const node={dataset:{cameraSceneObjectPick:String(index)},parentNode:holder,captured:false,listeners:{},
  closest(q){if(q==='[data-camera-map]')return mapObj;if(q==='[data-camera-scene-object-pick]')return this;return null;},
  addEventListener(k,fn){this.listeners[k]=fn;},removeEventListener(k,fn){if(this.listeners[k]===fn)delete this.listeners[k];},
  setPointerCapture(){this.captured=true;},hasPointerCapture(){return this.captured;},releasePointerCapture(){this.captured=false;},focus(){},matches(){return false;}};
 return {node,holder};
}
function beginMapDrag(node,id=301,x=200,y=180){
 handlers.pointerdown({target:node,button:0,pointerId:id,clientX:x,clientY:y,shiftKey:false,
  preventDefault(){},stopPropagation(){}});
}
function mapMove(node,id,x,y,shift=false){
 outsideListeners.pointermove({pointerId:id,clientX:x,clientY:y,shiftKey:shift,preventDefault(){}});
}
function mapUp(node,id,x,y,shift=false){
 outsideListeners.pointerup({pointerId:id,clientX:x,clientY:y,shiftKey:shift,preventDefault(){}});
}
const firstPanel=C.panel(scene);assert.match(firstPanel,/Arrastrá el centro de un objeto/);
assert.match(firstPanel,/data-camera-scene-object-pick="0" tabindex="0"/,'Object map has a focusable drag affordance');
const cameraPathInvariant=JSON.stringify(scene.sdCameraFrames),motionInvariant=JSON.stringify(object.sdKeyframes);
const oldX=object.x,mapUndoStart=undos,mapSaveStart=saves;
const glbMap=mapHandle(0);
beginMapDrag(glbMap.node);mapMove(glbMap.node,301,260,180);
assert.ok(activePointerShield,'Drag installs a full-viewport shield over overlapping iframes');
assert.equal(activePointerShield.captured,true,'Full-screen shield owns pointer capture');
assert.equal(activePointerShield.attributes['aria-hidden'],'true','Temporary input shield has no semantic content');
assert.equal(mapObj.captured,false,'Stable map remains free of nested pointer capture');
assert.equal(glbMap.node.captured,false,'Marker does not own pointer capture');
assert.equal(undos,mapUndoStart,'No project snapshot during a map drag');
assert.equal(object.x,oldX,'Map preview cannot modify persisted GLB before pointer release');
assert.match(glbMap.holder.transform,/translate\(/,'Map marker moves live during a drag');
mapUp(glbMap.node,301,260,180);
assert.equal(activePointerShield,null,'Pointerup removes the temporary iframe-safe shield');
assert.equal(mapObj.captured,false,'Map has no stale capture');
assert.ok(object.x>oldX,'Dragging right changes anchored GLB base X');
assert.equal(undos,mapUndoStart+1,'Map pointer drag creates exactly one undo');
assert.equal(saves,mapSaveStart+1,'Map pointer drag saves once');
assert.equal(JSON.stringify(object.sdKeyframes),motionInvariant,'No timeline changes when editing base X');
assert.equal(JSON.stringify(scene.sdCameraFrames),cameraPathInvariant,'No camera waypoint edits from map objects');
C.panel(scene);
const oldZ=object.offZ,zStartUndo=undos;
const zMap=mapHandle(0);
beginMapDrag(zMap.node,302,200,180);mapMove(zMap.node,302,200,140);mapUp(zMap.node,302,200,140);
assert.ok(Math.abs(object.offZ-oldZ)>.01,'Top X/Z view moves the Three object in authored offZ');
assert.equal(undos,zStartUndo+1,'World Z gesture has one undo');
C.panel(scene);
mapObj.dataset.plane='front';
const htmlMap=mapHandle(1),oldY=title.y,htmlUndo=undos;
beginMapDrag(htmlMap.node,303,200,180);mapMove(htmlMap.node,303,200,220);
assert.equal(title.y,oldY,'DOM base coordinate remains unchanged before release');
mapUp(htmlMap.node,303,200,220);
assert.ok(title.y>oldY,'Front X/Y view edits DOM authored Y');
assert.equal(undos,htmlUndo+1);
const oldHtmlDepth=title.sdCameraDepth,oldCancel=undos;
C.panel(scene);
mapObj.dataset.plane='top';
const cancelMap=mapHandle(1);
beginMapDrag(cancelMap.node,304,200,180);mapMove(cancelMap.node,304,200,130);
outsideListeners.keydown({key:'Escape',preventDefault(){},stopPropagation(){}});
assert.equal(title.sdCameraDepth,oldHtmlDepth,'Escape cancels map Z movement');
assert.equal(undos,oldCancel,'Escape never creates an undo entry');
assert.equal(activePointerShield,null,'Escape removes the temporary drag shield');
assert.equal(mapObj.captured,false,'Escape leaves no map pointer capture');
assert.equal(outsideListeners.pointermove,undefined,'Escape cleans global map listeners');
const keyMap=mapHandle(1),depthBeforeKey=title.sdCameraDepth,keyUndo=undos;
handlers.keydown({target:keyMap.node,key:'ArrowUp',shiftKey:true,preventDefault(){},stopPropagation(){}});
assert.ok(title.sdCameraDepth>depthBeforeKey,'Shift+ArrowUp edits fine DOM Z in overhead view');
assert.equal(undos,keyUndo+1,'Keyboard map step uses one undo');
assert.equal(JSON.stringify(scene.sdCameraFrames),cameraPathInvariant,'Camera remains untouched after all 3D layout changes');
assert.equal(JSON.stringify(object.sdKeyframes),motionInvariant,'3D animation remains untouched after all layout changes');
const spaceNow=C.panel(scene);
assert.match(spaceNow,/data-camera-map-object-mode aria-pressed="true"/,'Entering edit space prioritizes object hit targets');
assert.match(spaceNow,/pointer-events:auto;z-index:24/,'Object mode puts SVG markers over camera HTML handles');
const modeToggle={dataset:{cameraMapObjectMode:''}};
handlers.click({target:{closest(){return modeToggle;}}});
assert.match(C.panel(scene),/data-camera-map-object-mode aria-pressed="false"/,'User can switch back to camera waypoints');
handlers.click({target:{closest(){return modeToggle;}}});
assert.match(C.panel(scene),/data-camera-map-object-mode aria-pressed="true"/,'Object edit mode can be rearmed without touching authored data');
console.log('PASS object map drag: X/Y/Z, DOM/GLB, live marker, keyboard, Shift, Escape, single Undo, camera isolation');
