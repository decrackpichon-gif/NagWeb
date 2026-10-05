import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync(new URL('../js/nagweb-story-model.js',import.meta.url),'utf8'),scope);
const model=scope.window.NAGWEB_STREAM_MODEL,plain=x=>JSON.parse(JSON.stringify(x));
assert.deepEqual(plain(model.imageFocus()),{x:50,y:50});assert.deepEqual(plain(model.imageFocus({x:null,y:''})),{x:50,y:50});assert.deepEqual(plain(model.imageFocus({x:-20,y:180})),{x:0,y:100});
for(const [iw,ih,w,h] of [[1200,200,160,160],[200,1200,160,160],[480,620,280,120],[300,180,90,160]])for(const x of [0,25,50,100])for(const y of [0,50,100]){const c=model.imageCrop(iw,ih,w,h,{x,y});assert.ok(c.width>=w-1e-8&&c.height>=h-1e-8);assert.ok(c.x<=1e-8&&c.y<=1e-8&&c.x+c.width>=w-1e-8&&c.y+c.height>=h-1e-8);assert.ok(Math.abs(c.width/c.height-iw/ih)<1e-8);const doubled=model.imageCrop(iw,ih,w*2,h*2,{x,y});for(const k of ['x','y','width','height'])assert.ok(Math.abs(doubled[k]-c[k]*2)<1e-8);}
assert.deepEqual(plain(model.imageCrop(1200,200,200,200,{x:0})),{x:0,y:0,width:1200,height:200});assert.equal(model.imageCrop(1200,200,200,200,{x:100}).x,-1000);assert.equal(model.imageCrop(200,1200,200,200,{y:100}).y,-1000);
const exported=vm.runInNewContext('('+scope.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(exported.imageCrop(1200,200,100,200,{x:85,y:10})),plain(model.imageCrop(1200,200,100,200,{x:85,y:10})));
console.log('Encuadre: imagen completa cubre tarjeta sin deformación, extremos/centro, límites, compatibilidad, proporcionalidad y fábrica exportada OK');
