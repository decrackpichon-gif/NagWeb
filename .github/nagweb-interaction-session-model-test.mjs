import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const S=require('../js/nagweb-interaction-session-v1.js');

assert.equal(S.version,'1.7.0-alpha.1');
const s=S.normalize({
  mode:'auto',
  organicRenderer:'mesh-v3',
  bodyProfile:'character',
  display:{size:540},
  influenceEnabled:true,
  followerOptions:{follow:.12,maxSpeed:44,distanceFromPointer:36,assetForwardAngle:90},
  organicOptions:{length:510,sway:.06,columns:36,rows:12,headZoneEnd:.2,torsoZoneEnd:.64,headFlex:.04,torsoFlex:.4,lowerFlex:1},
  influenceOptions:{radius:240,strength:1.2,sourceMode:'body',sweptBody:true,targetScenario:'custom',targetSelection:[
    {id:'headline-0',enabled:true,weight:1,response:{move:1,rotate:0,scale:0},returnSpeed:1.5,profile:'displace'},
    {id:'content-0',enabled:false,weight:.52,response:{move:1,rotate:1,scale:.25},returnSpeed:.65,profile:'custom'},
    {id:'cta-0',enabled:true,weight:.72,response:{move:.6,rotate:1,scale:1},returnSpeed:1.2,profile:'tilt'}
  ]},
  preparationReport:{recommendedMode:'organic',quality:{score:96}},
  metadata:{name:'Prueba'}
});
assert.equal(s.schema,S.schema);
assert.equal(S.resolveMode(s),'organic');
assert.equal(s.organicRenderer,'mesh-v3');
assert.equal(s.bodyProfile,'character');
assert.equal(s.display.size,540);
assert.equal(S.summary(s).organicRenderer,'mesh-v3');
assert.equal(S.summary(s).bodyProfile,'character');
assert.equal(S.summary(s).displaySize,540);
assert.equal(S.summary(s).quality,96);

const forced=S.normalize({...s,mode:'follower'});
assert.equal(S.resolveMode(forced),'follower');

const round=S.deserialize(S.serialize(s));
assert.equal(round.organicOptions.length,510);
assert.equal(round.organicOptions.columns,36);
assert.equal(round.influenceOptions.radius,240);assert.equal(round.influenceOptions.targetScenario,'custom');assert.equal(round.influenceOptions.sweptBody,true);
assert.equal(round.influenceOptions.targetSelection.length,3);assert.equal(round.influenceOptions.targetSelection[1].profile,'floating');
assert.deepEqual(round.influenceOptions.targetSelection[0],{id:'headline-0',enabled:true,weight:1,response:{move:1,rotate:0,scale:0},returnSpeed:1.5,profile:'displace'});
assert.equal(S.summary(round).reactiveTargetCount,2);
assert.equal(round.organicRenderer,'mesh-v3');
assert.equal(round.bodyProfile,'character');
assert.equal(round.display.size,540);

const legacy=S.normalize({mode:'organic',organicOptions:{length:380}});
assert.equal(legacy.organicRenderer,'slices-v2');
assert.equal(legacy.bodyProfile,'custom');
assert.equal(legacy.display.size,380);assert.equal(legacy.influenceOptions.targetScenario,'headline');assert.deepEqual(legacy.influenceOptions.targetSelection,[]);

const cleaned=S.normalizeTargetSelection([
  {id:'a',enabled:true,weight:4},
  {id:'a',enabled:false,weight:.2},
  {id:'',enabled:true,weight:1},
  {id:'b',enabled:false,weight:-1}
]);
assert.deepEqual(cleaned,[
  {id:'a',enabled:true,weight:2,response:{move:1,rotate:1,scale:1},returnSpeed:1,profile:'custom'},
  {id:'b',enabled:false,weight:0,response:{move:1,rotate:1,scale:1},returnSpeed:1,profile:'custom'}
]);

assert.throws(()=>S.deserialize('{"bad":true}'),/invalid session/);
console.log('NagWeb Interaction Session V1.7 model tests: PASS');
