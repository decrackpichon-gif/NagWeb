import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const S=require('../js/nagweb-interaction-selection-v1.js');

assert.equal(S.version,'1.0.0');
assert.deepEqual(S.normalizeRect({x:40,y:30},{x:10,y:5}),{left:10,top:5,right:40,bottom:30,width:30,height:25});
assert.equal(S.intersectionArea({left:0,top:0,right:20,bottom:20},{left:10,top:10,right:30,bottom:30}),100);
assert.equal(S.centerInside({left:20,top:20,right:40,bottom:40},{left:0,top:0,right:35,bottom:35}),true);
assert.equal(S.hitRect({left:20,top:20,right:40,bottom:40},{left:0,top:0,right:29,bottom:29},{minOverlap:.2}),true);
assert.equal(S.hitRect({left:20,top:20,right:40,bottom:40},{left:0,top:0,right:22,bottom:22},{minOverlap:.2}),false);

const entries=[
  {id:'a',rect:{left:0,top:0,right:10,bottom:10}},
  {id:'b',rect:{left:20,top:0,right:30,bottom:10}},
  {id:'c',rect:{left:40,top:0,right:50,bottom:10}}
];
assert.deepEqual(S.hitIds(entries,{left:-2,top:-2,right:32,bottom:12}),['a','b']);
assert.deepEqual(S.applySelection(['a'],['b','c'],'replace'),['b','c']);
assert.deepEqual(S.applySelection(['a'],['b','a'],'add'),['a','b']);
assert.deepEqual(S.applySelection(['a','b','c'],['b'],'subtract'),['a','c']);
assert.deepEqual(S.applySelection(['a','b'],['b','c'],'toggle'),['a','c']);

console.log('NagWeb Interaction Selection V1 model tests: PASS');
