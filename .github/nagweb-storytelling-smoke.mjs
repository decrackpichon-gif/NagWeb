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
 await page.evaluate(()=>{
  project.pages[0].sections=[window.__storyScene];curPage=0;curSec=0;curEl=0;curPane='elements';selection=['story-text'];secFocus=false;
  renderPane();renderPreview();
 });
 await page.waitForFunction(()=>document.querySelector('#preview')?.contentWindow?.__NAG_SCROLL_DIRECTOR?.['story-scene']);
 await page.$eval('[data-story-track="story-text"]',n=>n.scrollIntoView({block:'center'}));
 const track=await page.$eval('[data-story-track="story-text"]',n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};});
 await page.mouse.click(track.x+track.w*.25,track.y+track.h/2,{count:2});
 const added=await page.evaluate(()=>NAGWEB_STORY_EDITOR.frames(sec().elements[0]));
 assert.equal(added.length,3);assert.ok(Math.abs(added[1].at-25)<1);
 const key=added[1].id;
 assert.equal(await page.$eval('[data-story-inspector]',n=>n.dataset.storyInspector),key);
 await page.$eval('[data-sd-key="'+key+'"]',n=>n.scrollIntoView({block:'center'}));
 const drag=await page.$eval('[data-sd-key="'+key+'"]',n=>{const r=n.getBoundingClientRect(),t=n.parentElement.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,to:t.x+t.width*.4};});
 await page.mouse.move(drag.x,drag.y);await page.mouse.down();await page.mouse.move(drag.to,drag.y,{steps:5});await page.mouse.up();
 assert.ok(Math.abs(await page.evaluate(k=>sec().elements[0].sdKeyframes.find(f=>f.id===k).at,key)-40)<1);
 const historyBefore=await page.evaluate(()=>history.length);
 await page.focus('[data-story-field="x"]');await page.keyboard.down('Control');await page.keyboard.press('a');await page.keyboard.up('Control');await page.keyboard.type('80');await page.keyboard.press('Tab');
 assert.equal(await page.evaluate(k=>sec().elements[0].sdKeyframes.find(f=>f.id===k).x,key),80);
 assert.equal(await page.evaluate(()=>history.length),historyBefore+1);
 assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(STORE_KEY)).pages[0].sections[0].elements[0].sdKeyframes.find(f=>f.id===k).x,key),80);
 await page.focus('[data-sd-key="'+key+'"]');await page.keyboard.press('Delete');
 assert.equal(await page.evaluate(()=>sec().elements[0].sdKeyframes.length),2);
 assert.equal(await page.evaluate(()=>sec().elements.length),2);
 await page.evaluate(()=>undo());
 assert.equal(await page.evaluate(()=>sec().elements[0].sdKeyframes.length),3);
 await page.evaluate(()=>{selection=['story-text'];curEl=0;renderPane();NAGWEB_SCROLL_DIRECTOR.scrub(sec().id,.65);});
 await page.click('[data-story-action="add"]');
 assert.equal(await page.evaluate(()=>sec().elements[0].sdKeyframes.length),4);
 assert.equal(await page.evaluate(()=>sec().elements[0].sdKeyframes[2].at),65);
 await page.evaluate(()=>NAGWEB_SCROLL_DIRECTOR.scrub(sec().id,.5));
 await page.click('[data-story-beat-add]');
 const beatId=await page.evaluate(()=>sec().sdBeats[0].id);
 await page.focus('[data-story-beat-field="name"]');await page.keyboard.down('Control');await page.keyboard.press('a');await page.keyboard.up('Control');await page.keyboard.type('PRODUCTO');await page.keyboard.press('Tab');
 assert.equal(await page.evaluate(()=>sec().sdBeats[0].name),'PRODUCTO');
 await page.focus('[data-sd-beat="'+beatId+'"]');await page.keyboard.press('ArrowRight');
 assert.equal(await page.evaluate(()=>sec().sdBeats[0].at),51);
 assert.equal(await page.$$eval('[data-story-beat-line]',ns=>ns.length),2);
 await page.$eval('[data-sd-key="'+key+'"]',n=>n.scrollIntoView({block:'center'}));
 const snapDrag=await page.$eval('[data-sd-key="'+key+'"]',n=>{const r=n.getBoundingClientRect(),t=n.parentElement.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,to:t.x+t.width*.505};});
 await page.mouse.move(snapDrag.x,snapDrag.y);await page.mouse.down();await page.mouse.move(snapDrag.to,snapDrag.y,{steps:3});await page.mouse.up();
 assert.equal(await page.evaluate(k=>sec().elements[0].sdKeyframes.find(f=>f.id===k).at,key),51);
 await page.focus('[data-sd-beat="'+beatId+'"]');await page.keyboard.press('Backspace');
 assert.equal(await page.evaluate(()=>sec().sdBeats.length),0);
 assert.equal(await page.evaluate(()=>sec().elements.length),2);
 console.log('Storytelling: modelo, compatibilidad, interpolación y runtime exportado OK');
}
