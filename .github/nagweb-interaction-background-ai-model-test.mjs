import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const AI=require('../js/nagweb-interaction-background-ai-v1.js');

assert.equal(AI.version,'1.0.0-alpha.1');
assert.equal(AI.providerInfo('general').license,'Apache-2.0');
assert.equal(AI.providerInfo('portrait').model,'Xenova/modnet');
assert.equal(AI.normalizeOptions({provider:'wat'}).provider,'general');
assert.equal(AI.chooseDevice({device:'auto'},{gpu:{}}),'webgpu');
assert.equal(AI.chooseDevice({device:'auto'},{}),'wasm');
assert.equal(AI.chooseDevice({device:'wasm'},{gpu:{}}),'wasm');

let calls=0;
const fakeRaw={data:new Uint8ClampedArray([255,0,0,255]),width:1,height:1,channels:4};
const fakeModule={
  RawImage:{read:async x=>({wrapped:x})},
  pipeline:async(task,model,options)=>{
    calls++;
    assert.equal(task,'background-removal');
    assert.equal(model,'onnx-community/ormbg-ONNX');
    assert.equal(options.device,'wasm');
    return async input=>{assert.deepEqual(input,{wrapped:'fake-image'});return [fakeRaw];};
  }
};
const remover=AI.createRemover({device:'wasm',moduleLoader:async()=>fakeModule});
assert.equal(remover.status.loaded,false);
await remover.load();
assert.equal(remover.status.loaded,true);
assert.equal(calls,1);
const result=await remover.remove('fake-image');
assert.equal(result.raw,fakeRaw);
assert.equal(result.provider,'general');
assert.equal(calls,1,'pipeline should be cached');
await remover.dispose();
assert.equal(remover.status.loaded,false);

let attempts=[];
const fallbackModule={
  RawImage:{read:async x=>x},
  pipeline:async(task,model,options)=>{
    attempts.push(options.device);
    if(options.device==='webgpu')throw new Error('gpu unavailable');
    return async()=>[fakeRaw];
  }
};
const fallback=AI.createRemover({device:'auto',environment:{gpu:{}},moduleLoader:async()=>fallbackModule});
await fallback.load();
assert.deepEqual(attempts,['webgpu','wasm']);
assert.equal(fallback.status.device,'wasm');

console.log('NagWeb Background AI V1 model tests: PASS');
