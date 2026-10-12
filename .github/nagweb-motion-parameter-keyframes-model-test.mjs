import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const m=scope.window.NAGWEB_STREAM_MODEL,clean=x=>JSON.parse(JSON.stringify(x));
const base=m.config({kind:'grid-dive',diveZoom:2.7,backgroundColor:'#000000'});
const raw={...base,paramKeys:{diveZoom:[{at:25,value:3.7},{at:75,value:1.7}],backgroundColor:[{at:50,value:'#ffffff'}]}},cfg=m.config(raw);
assert.deepEqual(clean(cfg.paramKeys.diveZoom),[{at:25,value:3.7},{at:75,value:1.7}]);
const eps=1e-8,near=(a,b)=>assert.ok(Math.abs(a-b)<eps,a+' != '+b);
for(const [p,z] of [[0,2.7],[.125,3.2],[.25,3.7],[.5,2.7],[.75,1.7],[.875,2.2],[1,2.7]])near(m.paramPose(cfg,p,false).diveZoom,z);
assert.equal(m.paramPose(cfg,.25,false).backgroundColor,'#808080');
assert.equal(m.paramPose(cfg,.5,false).backgroundColor,'#ffffff');
const zoomMoment=.25+.5/12; // Inside a Grid Dive zoom, not at the grid-reset seam.
const fallback=m.layout(1280,720,base,zoomMoment,12,1.6),plain=m.layout(1280,720,m.config(base),zoomMoment,12,1.6);
assert.deepEqual(clean(fallback),clean(plain),'Existing presets keep their original geometry');
assert.notDeepEqual(clean(m.layout(1280,720,cfg,zoomMoment,12,1.6)),clean(fallback),'A keyed slider modifies the runtime layout');
const scroll=m.config({...cfg,start:20,end:80,turns:1});near(m.paramPose(scroll,.35,true).diveZoom,3.7);
const malformed=m.config({kind:'grid-dive',paramKeys:{diveZoom:[null,{at:-20,value:999},{at:35,value:NaN},{at:500,value:3},{}],backgroundColor:[{at:30,value:'javascript:evil'},{at:40,value:'#f0F0f0'}],constructor:[{at:10,value:1}]}});
assert.deepEqual(clean(malformed.paramKeys.diveZoom),[{at:0,value:4},{at:100,value:3}]);
assert.deepEqual(clean(malformed.paramKeys.backgroundColor),[{at:40,value:'#f0f0f0'}]);
assert.equal(Object.prototype.hasOwnProperty.call(malformed.paramKeys,'constructor'),false);
for(const kind of ['grid-dive','fan-shuffle','sphere-wall','focus-slider']){const cfg=m.config({kind,paramKeys:{padding:[{at:30,value:8}]}});
 if(typeof cfg.padding==='number'){assert.ok(cfg.paramKeys?.padding);assert.equal(m.layout(1280,720,cfg,.4,12,1.5).length>0,true);}
}
console.log('Motion Lab parameter keyframes: numbers, colours, continuity, scroll, sanitization and legacy geometry OK');