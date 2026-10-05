import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const P=require('../js/nagweb-interaction-reaction-profiles-v1.js');

assert.equal(P.version,'1.0.0');
const list=P.list();
assert.ok(list.length>=7);
assert.deepEqual(P.get('shift').response,{move:1,rotate:0,scale:0});
assert.equal(P.get('pulse').response.move,0);
assert.equal(P.get('pulse').response.scale,1);
assert.ok(P.get('heavy').returnSpeed<P.get('shift').returnSpeed);
assert.ok(P.get('elastic').returnSpeed<P.get('shift').returnSpeed);

const source=P.get('tilt');
assert.equal(P.identify(source),'tilt');
source.weight=.123;
assert.equal(P.identify(source),'custom');

const normalized=P.normalizeCustom({weight:9,response:{move:-3,rotate:2.8},returnSpeed:99});
assert.equal(normalized.weight,2);
assert.equal(normalized.response.move,0);
assert.equal(normalized.response.rotate,2);
assert.equal(normalized.response.scale,1);
assert.equal(normalized.returnSpeed,2);

const copy=P.get('shift');copy.weight=0;
assert.equal(P.get('shift').weight,1,'preset reads should be immutable copies');
assert.equal(P.resolve('missing',{weight:.3}).id,'custom');

console.log('NagWeb Reaction Profiles V1 model tests: PASS');
