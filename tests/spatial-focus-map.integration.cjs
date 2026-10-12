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
previewWindow.NAGWEB_SPATIAL_PREVIEW_DEPTH=(id,value,sectionId)=>{
 depthEvents.push({id,value,sectionId});return id==='glb'&&sectionId==='scene';
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
assert.equal(undos,prevDepthUndo+1,'Confirmed depth creates exactly one Undo entry');
assert.equal(saves,prevDepthSave+1,'Confirmed depth saves once');
assert.equal(liveOverlay,null,'Committed tool removes itself');
assert.equal(JSON.stringify({camera:scene.sdCameraFrames,look:scene.sdCameraLookFrames,model:object.sdKeyframes}),modelStateBefore,'Depth edit leaves timeline and GLB motion unchanged');
depthClick();
const duringCancel=liveOverlay;
duringCancel.listeners.pointerdown({button:0,pointerId:63,clientY:120,preventDefault(){},stopPropagation(){}});
previewDocument.listeners.pointermove({pointerId:63,clientY:0,shiftKey:false,preventDefault(){}});
outsideListeners.keydown({key:'Escape',preventDefault(){},stopPropagation(){}});
assert.equal(object.offZ,1,'Escape cancels unsaved changes');
assert.equal(undos,prevDepthUndo+1);
assert.equal(depthEvents.at(-1).value,null,'Cancelled edit clears renderer override');
assert.equal(liveOverlay,null,'Escape disposes the editor-only depth control');
depthClick();
const keyboardHandle=liveOverlay;
const beforeDepthKeyboard=undos;
keyboardHandle.listeners.keydown({key:'ArrowUp',shiftKey:true,preventDefault(){},stopPropagation(){}});
assert.equal(object.offZ,1.02,'Keyboard Shift nudge preserves fine depth precision');
assert.equal(undos,beforeDepthKeyboard+1,'Keyboard nudge creates one Undo');
assert.equal(liveOverlay,null);
depthClick();
orbitIframe.load();
assert.equal(liveOverlay,null,'Preview reload disposes 3D gizmo');
assert.equal(depthEvents.at(-1).value,null,'Preview reload clears temporary depth');
assert.equal(previewDocument.listeners.pointermove,undefined,'Depth listeners must not leak after reload');
console.log('PASS object depth gizmo: projected model, live preview, axis units, Undo, keyboard, Escape and cleanup');
