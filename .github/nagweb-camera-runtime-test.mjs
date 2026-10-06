// Executes the actual generated Director script in an isolated DOM harness.
// This verifies wiring and serialized runtime behavior; it is not a browser/layout test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=name=>fs.readFileSync('js/'+name+'.js','utf8');
const author={window:{NAGWEB_3D_ANCHOR:{version:'test'}},console:{info(){}},
 document:{getElementById(){return null;},createElement(){return{};},head:{appendChild(){}}},
 generateSite(){return '<html><head></head><body></body></html>';},paneSceneNew(){return '';},paneElementNew(){return '';}};
vm.createContext(author);
for(const name of ['nagweb-story-model','nagweb-scroll-camera','nagweb-scroll-director-v16'])vm.runInContext(source(name),author);
const scene={id:'camera-scene',layout:'free',sdEnabled:true,sdCameraEnabled:true,sdLength:320,sdEase:'linear',sdPerspective:1000,
 sdCameraFrames:[{at:0,ease:'linear'},{at:40,x:200,z:100,rotateY:20,ease:'linear'},{at:60,x:200,z:100,rotateY:20,ease:'linear'},{at:100,x:400,z:0,rotateY:0}],
 elements:[
  {id:'image',type:'image',sdCameraDepth:150,sdKeyframes:[{at:0,z:0,ease:'linear'},{at:100,z:100}]},
  {id:'group',type:'container',universal:true,sdCameraDepth:-300,sdEnter:'none',sdEnd:100},
  {id:'child',type:'heading',parent:'group',sdKeyframes:[{at:0,x:0,ease:'linear'},{at:100,x:100}]}
 ]};
const original=JSON.stringify(scene.elements);
function exportScript(s,edit=false){
 const html=author.generateSite({sections:[JSON.parse(JSON.stringify(s))],assets:{images:[]}},edit,false,false);
 assert.ok(html.includes('nw-scroll-director-css'));
 const match=html.match(/<script id="nw-scroll-director-runtime">([\s\S]*?)<\/script>/);
 assert.ok(match,'Actual export includes a serialized Director runtime');return match[1];
}
class Node {
 constructor(id,classes=[]){this.id=id;this.className=classes.join(' ');this.children=[];this.parentNode=null;this.offsetHeight=2000;this.top=0;this.attrs={};this.effects=[];this.events=[];this.style={setProperty(k,v){this[k]=v;}};
  this.classList={contains:n=>this.className.split(' ').includes(n),add:n=>{this.className+=' '+n;}};
 }
 get firstChild(){return this.children[0]||null;}
 appendChild(n){if(n.parentNode)n.parentNode.children=n.parentNode.children.filter(c=>c!==n);this.children.push(n);n.parentNode=this;}
 setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return k==='data-id'?this.id:this.attrs[k];}
 getBoundingClientRect(){return {top:this.top,bottom:this.top+this.offsetHeight,width:1000,height:this.offsetHeight};}
 querySelector(selector){const id=selector.match(/data-id="([^"]+)"/)?.[1];for(const c of this.children){if(c.id===id)return c;const found=c.querySelector(selector);if(found)return found;}return null;}
 closest(selector){return selector==='.sc'?(this.classList.contains('sc')?this:this.parentNode?.closest(selector)):null;}
 dispatchEvent(ev){this.events.push(ev);}
 animate(keys,options){const e={keys,options,cancelled:false,pause(){this.paused=true;},cancel(){this.cancelled=true;}};e.effect={setKeyframes(k){e.keys=k;}};this.effects.push(e);return e;}
 get activeTransform(){return this.effects.filter(e=>!e.cancelled).at(-1)?.keys[0].transform||'none';}
}
function run(script){
 const root=new Node('camera-scene',['sc','free']),world=new Node('', ['inner']),picture=new Node('image'),group=new Node('group',['container-box']),child=new Node('child');
 picture.style.transform='rotate(8deg)';group.style.left='10%';child.style.left='25%';
 root.appendChild(world);world.appendChild(picture);root.appendChild(group);group.appendChild(child);
 const callbacks={},mediaCallbacks={},raf=[];
 const motion={matches:false,addEventListener(type,fn){mediaCallbacks[type]=fn;}};
 const context={window:null,document:{hidden:false,querySelector(){return root;},createElement(){return new Node('');},addEventListener(){}},
 matchMedia(){return motion;},performance:{now(){return 0;}},innerHeight:600,
 getComputedStyle(){return {opacity:'1',filter:'none',pointerEvents:'auto'};},
 requestAnimationFrame(fn){raf.push(fn);return raf.length;},addEventListener(type,fn){callbacks[type]=fn;},
 parent:{},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}}};
 context.window=context;vm.runInNewContext(script,context);
 return {root,world,picture,group,child,callbacks,motion,mediaCallbacks,context,flush(){while(raf.length)raf.shift()(0);},state:context.__NAG_SCROLL_DIRECTOR['camera-scene']};
}
const live=run(exportScript(scene));
assert.equal(live.group.parentNode,live.world,'Export moves free-layout container into camera world');
assert.equal(live.child.parentNode,live.group);
live.state.set(.5);
assert.equal(live.world.activeTransform,'rotateY(-20deg) translate3d(-200px,0px,100px)');
assert.equal(live.picture.activeTransform,'translateZ(200.000px) rotateX(0.000deg) rotateY(0.000deg)');
assert.equal(live.group.activeTransform,'translateZ(-300.000px) rotateX(0.000deg) rotateY(0.000deg)');
assert.equal(live.child.style['--nw-sd-x'],'50.00px');
assert.equal(live.picture.style.transform,'rotate(8deg)','Camera preserves authored transforms');
assert.equal(live.group.style.left,'10%');assert.equal(live.child.style.left,'25%');
assert.equal(live.root.events.at(-1).detail.progress,.5);
const holdPose=live.world.activeTransform;live.state.set(.45);assert.equal(live.world.activeTransform,holdPose);live.state.set(.55);assert.equal(live.world.activeTransform,holdPose);
const preview=run(exportScript(scene,true));preview.state.set(.55);
assert.equal(preview.world.activeTransform,live.world.activeTransform,'Preview and export run the same camera');
live.callbacks.message({source:{},data:{sc:true,type:'nw-sd-scrub',secId:scene.id,progress:1}});assert.equal(live.state.progress(),.55);
live.callbacks.message({source:live.context.parent,data:{sc:true,type:'nw-sd-scrub',secId:scene.id,progress:.2}});assert.equal(live.state.progress(),.2);
live.root.top=-700;live.state.live();assert.equal(live.state.progress(),.5);
live.root.top=-1400;live.callbacks.scroll();live.flush();assert.equal(live.state.progress(),1);
assert.equal(live.world.activeTransform,'translate3d(-400px,0px,0px)');
live.motion.matches=true;live.mediaCallbacks.change();
assert.equal(live.world.activeTransform,'none');assert.equal(live.picture.activeTransform,'none');assert.equal(live.group.activeTransform,'none');
live.motion.matches=false;live.mediaCallbacks.change();assert.equal(live.world.activeTransform,'translate3d(-400px,0px,0px)');
const off=run(exportScript({...scene,sdCameraEnabled:false}));off.state.set(.5);
assert.equal(off.world.activeTransform,'none');assert.equal(off.group.parentNode,off.root.children[0]);
assert.equal(off.picture.activeTransform,'perspective(1000px) translateZ(50.000px) rotateX(0.000deg) rotateY(0.000deg)');
assert.equal(JSON.stringify(scene.elements),original);
console.log('Exported camera runtime: preview/export parity, scroll progress, parent messaging, holds, depth composition, container hierarchy, reduced motion and disabled compatibility OK');
