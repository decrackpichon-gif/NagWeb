'use strict';
// Usage: node tests/spatial-renderer.integration.cjs path/to/three-r128.js
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const T=process.argv[2]?require(require('node:path').resolve(process.argv[2])):require('three');
const context={window:{},CustomEvent:class extends Event{constructor(type,o){super(type);this.detail=o.detail;}}};
vm.createContext(context);
const cameraSource=fs.readFileSync('js/nagweb-scroll-camera.js','utf8');
vm.runInContext(cameraSource.slice(0,cameraSource.indexOf('window.NAGWEB_CREATE_SCROLL_CAMERA='))+'window.NAGWEB_SCROLL_CAMERA=createCamera();})();',context);
vm.runInContext(fs.readFileSync('js/nagweb-spatial-renderer.js','utf8'),context);
const api=context.window.NAGWEB_SCROLL_CAMERA;
class Stage extends EventTarget{
 constructor(id){super();this.id=id;this.clientWidth=1000;this.clientHeight=800;this.isConnected=true;this.style={};this.children=[{classList:{contains:n=>n==='inner'},style:{},setAttribute(){},animate(){return{pause(){},effect:{setKeyframes(){}},cancel(){}};}}];}
 contains(n){return n.stage===this;}
 getBoundingClientRect(){return{left:0,top:0,right:1000,bottom:800,width:1000,height:800};}
}
function object(stage,model){
 const g=new T.Group();g.userData={o:{offZ:0},anchorEl:{stage,offsetWidth:200,offsetHeight:200,offsetLeft:700,offsetTop:400},nativeR:0,holder:new T.Group()};
 if(!model)g.add(new T.Mesh(new T.BoxGeometry(2,2,2),new T.MeshBasicMaterial()));
 g.userData.holder.add(g);return g;
}
const a=new Stage('a'),b=new Stage('b'),scene=new T.Scene(),shape=object(a),glb=object(b,true),legacy=new T.Group();legacy.userData={};scene.add(shape.userData.holder,glb.userData.holder,legacy);
const paints=[a,b].map(stage=>api.attach(stage,{containers:[]},1000));
paints[0]({x:0,y:0,z:0,rotate:0,rotateX:0,rotateY:0},1);
paints[1]({x:100,y:0,z:0,rotate:0,rotateX:0,rotateY:0},1);
let calls=[],renderer={domElement:{clientWidth:1000,clientHeight:800},autoClear:true,setViewport(...v){calls.push(['viewport',...v]);},setScissor(...v){calls.push(['scissor',...v]);},setScissorTest(){},clearDepth(){},render(s,c){calls.push(['render',c,shape.userData.holder.visible,glb.userData.holder.visible,legacy.visible]);}};
const adapter=context.window.NAGWEB_CREATE_SPATIAL_RENDERER(T,renderer,scene,[shape,glb,legacy]);adapter.connect(api,[a,b]);
assert.equal(adapter.owns(shape),true);assert.equal(adapter.owns(legacy),false);
const world=a.children[0];world.offsetLeft=27;world.offsetTop=19;world.clientLeft=4;world.clientTop=3;world.scrollLeft=7;world.scrollTop=5;
shape.userData.anchorEl.closest=()=>world;adapter.render(()=>{});
assert.deepEqual(shape.userData.holder.position.toArray(),[224,-17,-1000],'root anchor includes inner layout, border and scroll');
world.offsetLeft=0;world.offsetTop=0;world.clientLeft=0;world.clientTop=0;world.scrollLeft=0;world.scrollTop=0;
calls=[];
assert.equal(adapter.view(glb).camera.position.x,100,'cached pose replays on connect');
adapter.render(()=>{assert.equal(shape.userData.holder.visible,false);calls.push(['legacy']);});
let rendered=calls.filter(c=>c[0]==='render');assert.equal(rendered.length,2);assert.equal(rendered[0][2],true);assert.equal(rendered[0][3],false);assert.equal(rendered[0][4],false);assert.equal(rendered[1][3],false,'empty async model stays hidden');
// The real loader populates the same stable Group after an asynchronous load.
glb.add(new T.Mesh(new T.BoxGeometry(),new T.MeshBasicMaterial()));adapter.render(()=>{});assert.equal(glb.userData.holder.visible,true);
const cam=adapter.view(shape).camera;scene.updateMatrixWorld(true);let start=shape.userData.holder.position.clone().project(cam);assert.ok(Math.abs(start.x-.4)<1e-8);
const stable=shape.userData.holder.position.clone();paints[0]({x:100,y:50,z:100,rotate:10,rotateX:5,rotateY:15},1);adapter.render(()=>{});assert.deepEqual(shape.userData.holder.position.toArray(),stable.toArray(),'camera cannot re-anchor object to its transformed rect');assert.notEqual(shape.userData.holder.position.clone().project(cam).x,start.x);
assert.equal(adapter.view(glb).camera.position.x,100,'section cameras isolated');
// Resize updates bridge projection and geometric placement without another scroll clock.
a.clientWidth=500;a.clientHeight=400;shape.userData.anchorEl.offsetLeft=350;shape.userData.anchorEl.offsetTop=200;shape.userData.anchorEl.offsetWidth=100;
paints[0]({x:0,y:0,z:0,rotate:0,rotateX:0,rotateY:0},.5);adapter.render(()=>{});assert.equal(cam.aspect,1.25);assert.equal(shape.userData.holder.position.z,-500);assert.equal(renderer.autoClear,true);
// An unchanged pose must still publish new projection dimensions.
let events=0;a.addEventListener('nagweb:spatial-camera',()=>events++);
a.clientWidth=600;a.clientHeight=400;paints[0]({x:0,y:0,z:0,rotate:0,rotateX:0,rotateY:0},.5);
assert.equal(events,1);assert.equal(cam.aspect,1.5);
paints[0]({x:0,y:0,z:0,rotate:0,rotateX:0,rotateY:0},.5);assert.equal(events,1,'same pose and dimensions deduplicate');
const originalRender=renderer.render;renderer.render=()=>{throw Error('GPU failure');};
assert.throws(()=>adapter.render(()=>{}),/GPU failure/);assert.equal(renderer.autoClear,true);assert.equal(legacy.visible,true);
renderer.render=originalRender;
// Reconnecting removes old bindings, and offscreen spatial holders stop hit testing.
adapter.connect(api,[a,b]);a.getBoundingClientRect=()=>({left:0,top:-900,right:600,bottom:-500,width:600,height:400});
adapter.render(()=>{});assert.equal(shape.userData.holder.visible,false);
const currentCam=adapter.view(shape).camera,old=currentCam.position.clone();adapter.destroy();paints[0]({x:222,y:0,z:0,rotate:0,rotateX:0,rotateY:0},1);assert.deepEqual(currentCam.position.toArray(),old.toArray(),'destroy removes bindings');assert.equal(adapter.owns(shape),false);
const html=fs.readFileSync('index.html','utf8');assert.ok(html.includes('${window.NAGWEB_CREATE_SPATIAL_RENDERER.toString()}'));assert.ok(html.indexOf('src="js/nagweb-spatial-renderer.js"')<html.indexOf('src="js/nagweb-scroll-director-v16.js"'));
for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(!/\bsrc=/.test(m[1])&&(!/\btype=/.test(m[1])||/javascript|module/.test(m[1])))new vm.Script(m[2]);}
console.log('PASS: real Three.js groups, camera replay, movement, async model population, isolation, resize, teardown and inline syntax');
