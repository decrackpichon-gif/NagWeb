import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync(new URL('../js/nagweb-story-model.js',import.meta.url),'utf8'),scope);
const m=scope.window.NAGWEB_STREAM_MODEL,c=m.config({ringTilt:0,turns:3,start:20,end:80});
assert.equal(m.phase(.1,c,true),0);assert.equal(m.phase(.5,c,true),1.5);assert.equal(m.phase(.9,c,true),3);
const explicitShowcase=m.config({kind:'showcase-stream',ringTilt:-28,backFade:70});assert.equal(explicitShowcase.kind,'showcase-stream','Procedural renderer must recognize explicit Showcase templates');assert.equal(m.config(explicitShowcase).kind,'showcase-stream','Saved/reopened Showcase stays detectable');
const plain=x=>JSON.parse(JSON.stringify(x)),a=plain(m.layout(1280,720,c,0,12)),b=plain(m.layout(1280,720,c,1,12));assert.deepEqual(a,b,'Integer revolutions close at the exact same curved geometry');
const front=a.find(x=>x.slot===3),back=a.find(x=>x.slot===9);assert.equal(front.depth,1);assert.equal(front.alpha,1);assert.ok(Math.abs(back.alpha-.3)<1e-9);assert.ok(front.width>back.width,'Perspective enlarges the front surface');assert.ok(front.upper.some(p=>Math.abs(p.y-front.upper[0].y)>1),'A card is curved rather than a rigid flat plane');assert.equal(a.length,12);assert.ok(a.every((x,i)=>!i||x.depth>=a[i-1].depth));
const bounded=m.config({turns:Infinity,start:90,end:10,ringSize:999,perspective:-10});assert.equal(bounded.turns,1);assert.equal(bounded.end,91);assert.equal(bounded.ringSize,95);assert.equal(bounded.perspective,0);
console.log('Showcase Stream: ciclo exacto, fases de scroll y límites, profundidad/perspectiva, curvatura real y orden de superficies OK');


const directorSource=fs.readFileSync(new URL('../js/nagweb-scroll-director-v16.js',import.meta.url),'utf8');
const from=directorSource.indexOf('function streamData(s,c){'),until=directorSource.indexOf('\n var data=secs.map',from);
assert.ok(from>=0&&until>from,'Preview/export serializer present');
const streamData=new Function('p','window','groupOwner',directorSource.slice(from,until)+';return streamData;')({assets:{images:[]}},scope.window,()=>null);
for(const template of ['showcase-stream','spread-columns','cover-ring','iso-orbit','orbit-globe','focus-slider']){
 const serialized=streamData({elements:[]},{template,stream:{ringTilt:-28}});
 assert.equal(serialized.stream.kind,template,'Render and export know the selected preset: '+template);
 assert.equal(serialized.stream.ringTilt,-28,'Existing customization retained: '+template);
}
assert.deepEqual(streamData({elements:[]},{template:'unsupported-preset',stream:{}}),{},'Reject unregistered templates');
const editorSource=fs.readFileSync(new URL('../js/nagweb-story-editor.js',import.meta.url),'utf8');
assert.ok(editorSource.includes("stream:streamModel.config({kind:'showcase-stream',ringTilt:-28"),'New Showcase compositions preserve their kind');
console.log('Motion Lab: preview/export identity and legacy configurations OK');
