'use strict';
// Run from the repository root: node tests/spatial-focus-map.integration.cjs
// No external dependencies: exercises the real editor event handlers in an isolated DOM.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const handlers={},pane={addEventListener(type,fn){handlers[type]=fn;},querySelector(){return control;},contains(){return false;}};
const document={getElementById(id){return id==='pane'?pane:null;}};
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
console.log('PASS spatial focus map: linked GLB X/Y/Z, fractional anchor, drag, keyboard, Escape, undo and HTML isolation');
