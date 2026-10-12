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
