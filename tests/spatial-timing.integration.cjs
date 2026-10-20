'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const T=process.argv[2]?require(require('path').resolve(process.argv[2])):require('three');
const c={window:{}};vm.createContext(c);vm.runInContext(fs.readFileSync('js/nagweb-spatial-renderer.js','utf8'),c);
const stage={clientWidth:1000,clientHeight:800,isConnected:true,contains:n=>n.stage===stage,closest:()=>null,getBoundingClientRect:()=>({left:0,top:0,right:1000,bottom:800,width:1000,height:800})};
const source=new T.MeshBasicMaterial({opacity:.6,transparent:true,alphaTest:.2}),scene=new T.Scene();
function object(x){const g=new T.Group(),h=new T.Group();h.add(g);scene.add(h);g.add(new T.Mesh(new T.BoxGeometry(2,2,2),source));g.userData={o:{offZ:0},holder:h,nativeR:0,anchorEl:{stage,offsetWidth:200,offsetHeight:200,offsetLeft:x,offsetTop:400}};return g;}
const a=object(300),b=object(700),model=object(500);model.clear();model.userData.nativeR=0;
const originalArray=[source,source];a.add(new T.Mesh(new T.PlaneGeometry(2,2),originalArray));
function pose(g,extra){g.userData.anchorEl.__nwSpatialPose=Object.freeze(Object.assign({x:0,y:0,z:0,scale:100,rotate:0,rotateX:0,rotateY:0,opacity:1},extra));}
pose(a,{x:80,y:40,z:100,scale:150,rotate:30,rotateX:20,rotateY:10,opacity:.5});pose(b,{opacity:.25});pose(model,{opacity:0});
let passes=0,throwRender=false,clones=[];
const renderer={domElement:{clientWidth:1000,clientHeight:800},autoClear:true,setViewport(){},setScissor(){},setScissorTest(){},clearDepth(){},render(s,cam){
 passes++;assert.equal(a.children[0].material.opacity,.3);assert.equal(b.children[0].material.opacity,.15);assert.notEqual(a.children[0].material,b.children[0].material);assert.notEqual(a.children[0].material,source);assert.equal(source.opacity,.6);assert.equal(a.children[0].material.depthWrite,false);assert.equal(a.children[0].material.alphaTest,.1);assert.equal(a.children[1].material[0],a.children[0].material);assert.equal(a.children[1].material[1],a.children[0].material);
 clones=[a.children[0].material,b.children[0].material];assert.equal(model.userData.holder.visible,false);if(throwRender)throw Error('GPU failed');
}};
const api={bindThreeCamera(s,cam,fn){cam.position.set(0,0,0);cam.fov=2*Math.atan(800/2000)*180/Math.PI;cam.aspect=1.25;cam.updateProjectionMatrix();fn({cssPerspective:1000});return()=>{};}};
const adapter=c.window.NAGWEB_CREATE_SPATIAL_RENDERER(T,renderer,scene,[a,b,model],[]);adapter.connect(api,[stage]);adapter.render(()=>{});
assert.deepEqual(a.userData.holder.position.toArray(),[-120,-40,-900]);assert.ok(Math.abs(a.userData.holder.scale.x-150/Math.sqrt(3))<1e-8);
const expected=new T.Quaternion().setFromEuler(new T.Euler(-20*Math.PI/180,10*Math.PI/180,-30*Math.PI/180,'ZXY'));assert.ok(expected.angleTo(a.userData.holder.quaternion)<1e-7);
assert.equal(a.children[0].material,source);assert.equal(a.children[1].material,originalArray);assert.equal(b.children[0].material,source);assert.equal(source.depthWrite,true);assert.equal(source.alphaTest,.2);
const firstCopies=clones.slice();adapter.render(()=>{});assert.deepEqual(clones,firstCopies,'fade copies are reused, without per-frame material allocation');
throwRender=true;assert.throws(()=>adapter.render(()=>{}),/GPU failed/);assert.equal(a.children[0].material,source);assert.equal(b.children[0].material,source);assert.equal(renderer.autoClear,true);throwRender=false;
console.log('PASS: evaluated poses, CSS rotation order, independent alpha for shared materials, reuse and exception restoration');
renderer.render=()=>{};
// Geometry arriving at zero progress stays hidden; replay reads the latest pose.
model.add(new T.Mesh(new T.PlaneGeometry(2,2),source));adapter.render(()=>{});assert.ok(model.userData.nativeR>0);assert.equal(model.userData.holder.visible,false);
pose(model,{opacity:1});adapter.render(()=>{});assert.equal(model.userData.holder.visible,true);assert.equal(adapter.pick([model],500,400),model);
pose(model,{opacity:0});assert.equal(adapter.pick([model],500,400),null,'cached Director visibility blocks a new gesture before the next render');pose(model,{opacity:1});
pose(model,{opacity:.01});adapter.render(()=>{});assert.equal(model.userData.holder.visible,true);assert.equal(adapter.pick([model],500,400),null,'pointer threshold matches the Director');
pose(model,{scale:0});adapter.render(()=>{});assert.equal(model.userData.holder.visible,false);assert.equal(adapter.pick([model],500,400),null);
pose(model,{opacity:0});adapter.render(()=>{});assert.equal(model.userData.holder.visible,false);
let disposed=0;firstCopies.forEach(m=>m.addEventListener('dispose',()=>disposed++));adapter.destroy();assert.equal(disposed,2);assert.equal(a.userData.spatialOpacity,undefined);adapter.destroy();assert.equal(disposed,2);assert.equal(source.opacity,.6);
console.log('PASS: late geometry, cached visibility, zero size, invisible picking and fade-resource teardown');
const html=fs.readFileSync('index.html','utf8'),director=fs.readFileSync('js/nagweb-scroll-director-v16.js','utf8');
for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/\bsrc=/.test(m[1])&&(!/\btype=/.test(m[1])||/javascript|module/.test(m[1])))new vm.Script(m[2]);
new vm.Script(director);new vm.Script(fs.readFileSync('js/nagweb-spatial-renderer.js','utf8'));
console.log('PASS: edited modules and all inline script syntax');
