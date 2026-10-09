'use strict';
// Real Three.js lights; GPU appearance is checked separately in the browser test.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const T=process.argv[2]?require(require('node:path').resolve(process.argv[2])):require('three');
const context={window:{},CustomEvent:class extends Event{constructor(type,o){super(type);this.detail=o.detail;}}};vm.createContext(context);
const cameraSource=fs.readFileSync('js/nagweb-scroll-camera.js','utf8');
vm.runInContext(cameraSource.slice(0,cameraSource.indexOf('window.NAGWEB_CREATE_SCROLL_CAMERA='))+'window.NAGWEB_SCROLL_CAMERA=createCamera();})();',context);
vm.runInContext(fs.readFileSync('js/nagweb-spatial-renderer.js','utf8'),context);
const api=context.window.NAGWEB_SCROLL_CAMERA;
class Stage extends EventTarget{
 constructor(id){super();this.id=id;this.clientWidth=1000;this.clientHeight=800;this.isConnected=true;this.style={};this.children=[{classList:{contains:n=>n==='inner'},style:{},setAttribute(){},animate(){return{pause(){},effect:{setKeyframes(){}},cancel(){}};}}];}
 contains(n){return n.stage===this;}
 closest(){return{getAttribute:()=>this.id};}
 getBoundingClientRect(){return{left:0,top:0,right:this.clientWidth,bottom:this.clientHeight,width:this.clientWidth,height:this.clientHeight};}
}
function object(stage){const g=new T.Group();g.add(new T.Mesh(new T.BoxGeometry(),new T.MeshStandardMaterial()));g.userData={o:{offZ:0},anchorEl:{stage,offsetWidth:200,offsetHeight:200,offsetLeft:500,offsetTop:400},nativeR:0,holder:new T.Group()};g.userData.holder.add(g);return g;}
const a=new Stage('a'),b=new Stage('b'),scene=new T.Scene(),objects=[object(a),object(b)];objects.forEach(g=>scene.add(g.userData.holder));
const ambient=new T.AmbientLight(0xffffff,.5),preset=new T.SpotLight(0xffffff,1.5,60,.7,.5);preset.position.set(4,7,6);
function authored(L,section,offset){L.position.set(1,2+offset,3);L.userData={sectionId:section,sectionOffsetY:offset};scene.add(L);return L;}
const point=authored(new T.PointLight(0xff0000,2,22),'a',0),spot=authored(new T.SpotLight(0x00ff00,3,10,.6,.4),'b',-7),directional=authored(new T.DirectionalLight(0x0000ff,4),'b',-7),foreign=authored(new T.PointLight(0xffffff,50,0),'other',-14);
const gizmo=new T.Mesh(new T.SphereGeometry(.16),new T.MeshBasicMaterial());point.add(gizmo);scene.add(ambient,preset);
const lights=[ambient,preset,point,spot,directional,foreign],legacyPositions=lights.map(l=>l.position.toArray()),legacyDistances=lights.map(l=>l.distance),legacyTargets=lights.map(l=>l.target&&l.target.position.toArray());
const paints=[a,b].map(s=>api.attach(s,{containers:[]},1000));const pose={x:0,y:0,z:0,rotate:0,rotateX:0,rotateY:0};paints.forEach(p=>p(pose,1));
let passes=[],fail=false;
const renderer={domElement:{clientWidth:1000,clientHeight:800},autoClear:true,setViewport(){},setScissor(){},setScissorTest(){},clearDepth(){},render(){if(fail)throw Error('GPU failure');const active=[];scene.traverseVisible(n=>{if(n.isLight)active.push(n);});passes.push(active);}};
const baseChildren=scene.children.length,adapter=context.window.NAGWEB_CREATE_SPATIAL_RENDERER(T,renderer,scene,objects,lights);adapter.connect(api,[a,b]);
assert.equal(scene.children.length,baseChildren+2,'one rig per stage');
adapter.render(()=>{assert.ok(lights.every(l=>l.visible));assert.equal(gizmo.visible,false,'legacy light marker is suppressed, source light is preserved');});
assert.equal(passes.length,2);assert.equal(passes[0].length,3);assert.equal(passes[1].length,4);assert.ok(passes.every(pass=>pass.every(l=>!lights.includes(l))));
assert.equal(passes[0].filter(l=>l.userData.sectionId==='a').length,1);assert.equal(passes[0].some(l=>l.userData.sectionId==='b'||l.userData.sectionId==='other'),false);
assert.equal(passes[1].filter(l=>l.userData.sectionId==='b').length,2);assert.equal(adapter.view(foreign),null);
const u=800/(12*Math.tan(50*Math.PI/360)),copy=adapter.view(point).object,spotCopy=adapter.view(spot).object,dirCopy=adapter.view(directional).object;
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
close(copy.getWorldPosition(new T.Vector3()).x,u);close(copy.getWorldPosition(new T.Vector3()).y,2*u);close(copy.getWorldPosition(new T.Vector3()).z,-1000+3*u);close(copy.distance,22*u);
close(spotCopy.getWorldPosition(new T.Vector3()).y,2*u);close(spotCopy.distance,10*u);
assert.deepEqual(spotCopy.target.getWorldPosition(new T.Vector3()).toArray(),[0,0,-1000]);assert.deepEqual(dirCopy.target.getWorldPosition(new T.Vector3()).toArray(),[0,0,-1000]);
assert.equal(spotCopy.angle,spot.angle);assert.equal(spotCopy.penumbra,spot.penumbra);
assert.deepEqual(lights.map(l=>l.position.toArray()),legacyPositions);assert.deepEqual(lights.map(l=>l.distance),legacyDistances);assert.deepEqual(lights.map(l=>l.target&&l.target.position.toArray()),legacyTargets);assert.equal(gizmo.visible,true);
const stable=copy.getWorldPosition(new T.Vector3()).toArray();paints[0]({...pose,x:80,y:30,rotateX:10,rotateY:20},1);adapter.render(()=>{});assert.deepEqual(copy.getWorldPosition(new T.Vector3()).toArray(),stable,'camera cannot move the light');
const screen=copy.getWorldPosition(new T.Vector3()).project(adapter.view(point).camera),native=adapter.lightPoint(point,(screen.x+1)*500,(1-screen.y)*400);close(native.x,1);close(native.y,2);close(native.z,3);
point.intensity=5;point.distance=0;point.color.set(0x123456);adapter.render(()=>{});assert.equal(copy.intensity,5);assert.equal(copy.distance,0);assert.equal(copy.color.getHex(),point.color.getHex());
a.clientHeight=400;paints[0](pose,1);adapter.render(()=>{});close(copy.getWorldPosition(new T.Vector3()).x,u/2);
fail=true;assert.throws(()=>adapter.render(()=>{}),/GPU failure/);assert.equal(renderer.autoClear,true);assert.ok(lights.every(l=>l.visible));assert.equal(gizmo.visible,true);assert.ok(scene.children.filter(n=>!objects.some(g=>g.userData.holder===n)&&!lights.includes(n)).every(n=>!n.visible));fail=false;
adapter.connect(api,[a,b]);assert.equal(scene.children.length,baseChildren+2,'reconnect cannot leak rigs');adapter.destroy();assert.equal(scene.children.length,baseChildren);assert.equal(adapter.view(point),null);assert.equal(adapter.lightPoint(point,500,400),null);
console.log('PASS: point/spot/directional and preset lights, section isolation, native units, targets, reach, camera/resize, inverse picking, legacy state, failure recovery and teardown');
