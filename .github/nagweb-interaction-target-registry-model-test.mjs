import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const R=require('../js/nagweb-interaction-target-registry-v1.js');

assert.equal(R.version,'1.2.0');
const a={},b={},c={};
assert.deepEqual(R.uniqueElements([a,a,b,null,b]),[a,b]);
const d=R.diffElements([a,b],[b,c]);
assert.deepEqual(d.added,[c]);assert.deepEqual(d.removed,[a]);assert.deepEqual(d.retained,[b]);

function fake(id){return {getAttribute(name){return name==='data-nw-target-id'?id:null;}};}
assert.deepEqual(R.duplicateIds([fake('a'),fake('b'),fake('a'),fake('b'),fake('c')]),['a','b']);
console.log('NagWeb Interaction Target Registry V1.2 model tests: PASS');
