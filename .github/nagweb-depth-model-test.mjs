import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../js/nagweb-story-model.js',import.meta.url),'utf8'),context);
const model=context.window.NAGWEB_STORY_MODEL;
const plain=value=>JSON.parse(JSON.stringify(value));
const input=[
 {id:'depth-start',at:0,z:-300,rotateX:10,rotateY:-20,rotate:15,opacity:100,ease:'linear'},
 {id:'depth-mid',at:50,z:100,rotateX:30,rotateY:20,scale:120,opacity:60,ease:'linear'},
 {id:'depth-end',at:100,z:500,rotateX:50,rotateY:60,rotate:45,opacity:20}
];
const original=JSON.stringify(input);
const compiled=model.compile({id:'depth-element',sdKeyframes:input});
const first=model.evaluate(compiled,.25),second=model.evaluate(compiled,.75);
assert.equal(first.z,-100);assert.equal(first.rotateX,20);assert.equal(first.rotateY,0);
assert.equal(first.rotate,15);assert.equal(first.scale,110);
assert.equal(second.z,300);assert.equal(second.rotateX,40);assert.equal(second.rotateY,40);
assert.equal(second.rotate,30);assert.equal(second.opacity,40);
assert.equal(model.evaluate(compiled,0).z,-300);
assert.equal(model.evaluate(compiled,1).z,500);
assert.equal(JSON.stringify(input),original,'Model evaluation must not change imported data');

// Old tracks and the previous Director produce a neutral depth pose.
for(const old of [{sdKeyframes:[{at:0,x:0},{at:100,x:200}]},{sdStart:20,sdEnd:80,sdMoveX:120,sdEnter:'none'}]){
 const pose=model.evaluate(model.compile(old),.5,'linear');
 assert.equal(pose.z,0);assert.equal(pose.rotateX,0);assert.equal(pose.rotateY,0);
 assert.ok(Math.abs(pose.x-(old.sdKeyframes?100:60))<1e-8);
}
const inherited=model.normalize([{at:0,z:-200,rotateX:12,rotateY:18},{at:100,x:50}]);
assert.equal(inherited[1].z,-200);assert.equal(inherited[1].rotateX,12);assert.equal(inherited[1].rotateY,18);
const bounded=model.normalize([{at:0,z:Infinity,rotateX:99999,rotateY:-99999}])[0];
assert.equal(bounded.z,0);assert.equal(bounded.rotateX,3600);assert.equal(bounded.rotateY,-3600);
assert.deepEqual(plain(model.normalize(JSON.parse(JSON.stringify(model.normalize(input))))),plain(model.normalize(input)),'JSON round trip preserves depth data and IDs');

const reduced=model.evaluate(compiled,.75,'linear',true);
for(const key of ['x','y','z','rotate','rotateX','rotateY','blur'])assert.equal(reduced[key],0);
assert.equal(reduced.scale,100);assert.equal(reduced.opacity,second.opacity);

// The serialized factory used by exported sites must produce identical poses.
const exported=vm.runInNewContext('('+context.window.NAGWEB_CREATE_STORY_MODEL.toString()+')()');
for(const progress of [0,.1,.25,.5,.75,.9,1]){
 assert.deepEqual(plain(exported.evaluate(JSON.parse(JSON.stringify(compiled)),progress)),plain(model.evaluate(compiled,progress)));
}
console.log('Modelo 2.5D: profundidad, inclinaciones, compatibilidad, JSON, movimiento reducido y fábrica exportada OK');
