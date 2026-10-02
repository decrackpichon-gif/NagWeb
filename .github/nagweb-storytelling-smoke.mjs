import assert from 'node:assert/strict';

export async function runStorytellingSmoke(page){
 const model=await page.evaluate(()=>{
  const m=NAGWEB_STORY_MODEL;
  const old={sdStart:20,sdEnd:80,sdSpan:10,sdEnter:'fade',sdExit:'fade',sdMoveX:120,sdMoveY:-60,sdScale:140,sdRotate:30};
  const frames=m.normalize([{at:0,x:-300,scale:80,opacity:0,ease:'linear'},{at:20,x:0,scale:100,opacity:100},{at:50,x:0,scale:100,opacity:100},{at:100,y:-150,scale:120,opacity:0,blur:8,rotate:4}]);
  const c={keyframes:frames},legacy=m.compile(old),before=JSON.stringify(old);
  return{
   version:m.version,mid:m.evaluate(c,.1),hold:m.evaluate(c,.35),end:m.evaluate(c,1),
   legacyBefore:m.evaluate(legacy,.1,'linear'),legacyMid:m.evaluate(legacy,.5,'linear'),
   unchanged:before===JSON.stringify(old),reduced:m.evaluate(c,.1,'linear',true),
   invalid:m.normalize([{at:-10,x:Infinity},{at:0,x:10},{at:150,opacity:500}]),
   easings:Object.keys(m.easings).map(k=>[k,m.ease(.25,k)]),
   eligible:m.eligible({id:'child',parent:'modal'},{elements:[{id:'modal',modal:true}]}),
  };
 });
 assert.equal(model.version,'2.0');
 assert.equal(model.mid.x,-150);assert.equal(model.mid.scale,90);assert.equal(model.mid.opacity,50);
 assert.equal(model.hold.x,0);assert.equal(model.hold.opacity,100);assert.equal(model.end.blur,8);
 assert.equal(model.legacyBefore.opacity,0);assert.ok(Math.abs(model.legacyMid.x-60)<1e-8);assert.equal(model.legacyMid.scale,120);
 assert.ok(model.unchanged);assert.equal(model.reduced.x,0);assert.equal(model.reduced.scale,100);assert.equal(model.reduced.opacity,50);
 assert.equal(model.invalid.length,2);assert.equal(model.invalid[0].at,0);assert.equal(model.invalid[1].opacity,100);
 assert.equal(model.easings.length,6);assert.deepEqual(model.easings.map(x=>x[1]),[.25,.15625,.0625,.4375,.125,.0625]);assert.equal(model.eligible,false);

 await page.evaluate(()=>{
  const s=JSON.parse(JSON.stringify(sec()));s.id='story-scene';s.layout='free';s.sdEnabled=true;s.sdEase='linear';s.sdLength=300;s.stType='cut';
  s.elements=[mkEl('heading',{id:'story-text',text:'Historia',anim:'none',x:20,y:30,sdKeyframes:[{at:0,x:0,opacity:100},{at:100,x:200,y:-100,scale:150,rotate:20,opacity:50,blur:4}]}),mkEl('paragraph',{id:'story-old',text:'Anterior',anim:'none',sdStart:20,sdEnd:80,sdEnter:'fade',sdMoveX:120})];
  window.__storyScene=s;
  const p=Object.assign({},flattenPage(page()),{sections:[s]});
  const html=generateSite(p,false,false,false);
  const frame=document.createElement('iframe');frame.id='story-export';frame.style.cssText='width:1000px;height:600px';frame.srcdoc=html;document.body.append(frame);
 });
 await page.waitForFunction(()=>document.querySelector('#story-export')?.contentWindow?.__NAG_SCROLL_DIRECTOR?.['story-scene']);
 const runtime=await page.evaluate(()=>{
  const f=document.querySelector('#story-export'),w=f.contentWindow,d=f.contentDocument,n=d.querySelector('[data-id="story-text"]'),old=d.querySelector('[data-id="story-old"]');
  w.__NAG_SCROLL_DIRECTOR['story-scene'].set(.5);
  return{x:n.style.getPropertyValue('--nw-sd-x'),scale:n.style.getPropertyValue('--nw-sd-scale'),opacity:n.style.getPropertyValue('--nw-sd-opacity'),oldX:old.style.getPropertyValue('--nw-sd-x'),count:d.querySelectorAll('#nw-scroll-director-runtime').length};
 });
 assert.equal(runtime.x,'100.00px');assert.equal(runtime.scale,'1.2500');assert.equal(runtime.opacity,'0.7500');assert.equal(runtime.oldX,'60.00px');assert.equal(runtime.count,1);
 await page.evaluate(()=>document.querySelector('#story-export').remove());
 console.log('Storytelling: modelo, compatibilidad, interpolación y runtime exportado OK');
}
