import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const S=require('../js/nagweb-interaction-session-v1.js');

assert.equal(S.version,'1.1.0-alpha.1');
const s=S.normalize({
  mode:'auto',
  organicRenderer:'mesh-v3',
  influenceEnabled:true,
  followerOptions:{follow:.12,maxSpeed:44},
  organicOptions:{length:510,sway:.06,columns:36,rows:12},
  influenceOptions:{radius:240,strength:1.2},
  preparationReport:{recommendedMode:'organic',quality:{score:96}},
  metadata:{name:'Prueba'}
});
assert.equal(s.schema,S.schema);
assert.equal(S.resolveMode(s),'organic');
assert.equal(s.organicRenderer,'mesh-v3');
assert.equal(S.summary(s).organicRenderer,'mesh-v3');
assert.equal(S.summary(s).quality,96);
assert.equal(S.summary(s).name,'Prueba');

const forced=S.normalize({...s,mode:'follower'});
assert.equal(S.resolveMode(forced),'follower');

const round=S.deserialize(S.serialize(s));
assert.equal(round.organicOptions.length,510);
assert.equal(round.organicOptions.columns,36);
assert.equal(round.influenceOptions.radius,240);
assert.equal(round.organicRenderer,'mesh-v3');

const legacy=S.normalize({mode:'organic',organicOptions:{length:380}});
assert.equal(legacy.organicRenderer,'slices-v2','legacy sessions preserve the old renderer unless V3 is explicit');

assert.throws(()=>S.deserialize('{"bad":true}'),/invalid session/);
console.log('NagWeb Interaction Session V1.1 model tests: PASS');
