'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const T=process.argv[2]?require(require('path').resolve(process.argv[2])):require('three');
// CSSOM fixtures describe already evaluated styles. Real DOMMatrix/CSS layout
// is exercised independently in spatial-hierarchy.browser.cjs.
class Matrix{
 constructor(s){const v=s.match(/matrix\(([^)]+)\)/)[1].split(',').map(Number);this.m=new T.Matrix4().set(v[0],v[2],0,v[4],v[1],v[3],0,v[5],0,0,1,0,0,0,0,1);}
 toFloat64Array(){return Float64Array.from(this.m.elements);}
}
const c={window:{DOMMatrix:Matrix,getComputedStyle:n=>n.css}};vm.createContext(c);vm.runInContext(fs.readFileSync('js/nagweb-spatial-renderer.js','utf8'),c);
const stage={clientWidth:1000,clientHeight:800,isConnected:true,contains:()=>true,closest:()=>null,getBoundingClientRect:()=>({left:0,top:0,right:1000,bottom:800,width:1000,height:800})},world={clientLeft:0,clientTop:0,scrollLeft:0,scrollTop:0};
const css=extra=>Object.assign({transformOrigin:'0px 0px',translate:'none',rotate:'none',scale:'none',transform:'none',opacity:'1',display:'block',visibility:'visible'},extra);
const outer={parentElement:world,offsetParent:world,offsetLeft:300,offsetTop:200,offsetWidth:200,offsetHeight:150,clientLeft:0,clientTop:0,css:css({translate:'10px 20px',rotate:'90deg',scale:'2 1',opacity:'.5'})};
const inner={parentElement:outer,offsetParent:outer,offsetLeft:30,offsetTop:40,offsetWidth:100,offsetHeight:80,clientLeft:0,clientTop:0,css:css({transform:'matrix(1,0,0,1,5,-8)',opacity:'.4'})};
const source=new T.MeshBasicMaterial({opacity:.6,transparent:true}),g=new T.Group(),h=new T.Group(),scene=new T.Scene();h.add(g);scene.add(h);g.add(new T.Mesh(new T.BoxGeometry(2,2,2),source));
const node={parentElement:inner,offsetParent:inner,offsetLeft:40,offsetTop:30,offsetWidth:80,offsetHeight:80,hasAttribute:()=>true,closest:()=>world,__nwSpatialPose:{x:10,y:5,z:0,scale:100,rotate:0,rotateX:0,rotateY:0,opacity:.5}};
g.userData={o:{offZ:0},anchorEl:node,holder:h,nativeR:0};
const renderer={domElement:{clientWidth:1000,clientHeight:800},autoClear:true,setViewport(){},setScissor(){},setScissorTest(){},clearDepth(){},render(){if(h.visible)assert.ok(Math.abs(g.children[0].material.opacity-.06)<1e-10);}};
const api={bindThreeCamera(s,cam,fn){cam.fov=2*Math.atan(800/2000)*180/Math.PI;cam.aspect=1.25;cam.updateProjectionMatrix();fn({cssPerspective:1000});return()=>{};}};
const adapter=c.window.NAGWEB_CREATE_SPATIAL_RENDERER(T,renderer,scene,[g],[]);adapter.connect(api,[stage]);adapter.render(()=>{});
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,a+' != '+b);h.position.toArray().forEach((x,i)=>close(x,[-257,10,-1000][i]));close(g.userData.spatialOpacity,.1);assert.equal(h.matrixAutoUpdate,false);assert.equal(g.children[0].material,source);
world.offsetLeft=27;world.offsetTop=19;world.clientLeft=4;world.clientTop=3;world.scrollLeft=7;world.scrollTop=5;
adapter.render(()=>{});h.position.toArray().forEach((x,i)=>close(x,[-233,-7,-1000][i]));
world.offsetLeft=0;world.offsetTop=0;world.clientLeft=0;world.clientTop=0;world.scrollLeft=0;world.scrollTop=0;
adapter.render(()=>{});
outer.clientLeft=5;outer.clientTop=3;inner.clientLeft=2;inner.clientTop=1;adapter.render(()=>{});h.position.toArray().forEach((x,i)=>close(x,[-261,-4,-1000][i]));
outer.clientLeft=0;outer.clientTop=0;inner.clientLeft=0;inner.clientTop=0;adapter.render(()=>{});
inner.scrollLeft=3;inner.scrollTop=7;adapter.render(()=>{});h.position.toArray().forEach((x,i)=>close(x,[-250,16,-1000][i]));inner.scrollLeft=0;inner.scrollTop=0;
outer.css.rotate='100grad';adapter.render(()=>{});h.position.toArray().forEach((x,i)=>close(x,[-257,10,-1000][i]));outer.css.rotate='90deg';
// Check a point on a nonuniform inherited plane, using real Three cameras/rays.
scene.updateMatrixWorld(true);const cam=adapter.view(g).camera,target=new T.Vector3(57,-19,0),screen=target.clone().applyMatrix4(g.userData.spatialParent).project(cam),hit=adapter.anchorPoint(g,(screen.x+1)*500,(1-screen.y)*400);hit.toArray().forEach((x,i)=>close(x,target.toArray()[i]));
const pointer=g.userData.holder.position.clone().project(cam),px=(pointer.x+1)*500,py=(1-pointer.y)*400;assert.equal(adapter.pick([g],px,py),g);
inner.css.opacity='0';assert.equal(adapter.pick([g],px,py),null,'ancestor opacity blocks gestures before the next frame');adapter.render(()=>{});assert.equal(h.visible,false);
inner.css.opacity='.4';outer.css.scale='0';adapter.render(()=>{});assert.equal(h.visible,false);assert.equal(adapter.anchorPoint(g,px,py),null,'singular parents cannot define an editable plane');
outer.css.scale='2 1';adapter.render(()=>{});assert.equal(h.visible,true);assert.equal(adapter.pick([g],px,py),g);
console.log('PASS: nested affine composition, nonuniform scale, multiplied alpha, local-plane inversion, hidden picking and singular/recovered parents');
// A late model's radius comes from its own geometry, even after a singular holder.
g.clear();g.userData.nativeR=0;h.matrix.makeScale(0,0,0);g.add(new T.Mesh(new T.PlaneGeometry(2,2),source));adapter.render(()=>{});close(g.userData.nativeR,Math.SQRT2);assert.equal(h.visible,true);
const native=g.userData.nativeR;outer.css.scale='3 .5';adapter.render(()=>{});close(g.userData.nativeR,native);
adapter.destroy();assert.equal(h.matrixAutoUpdate,true);assert.equal(g.userData.spatialParent,undefined);assert.equal(g.userData.spatialOpacity,undefined);assert.equal(g.children[0].material,source);
console.log('PASS: late model size independent of parent transforms, resize stability and teardown');
