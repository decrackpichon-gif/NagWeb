import assert from 'node:assert/strict';
const near=(a,b,t=.04)=>assert.ok(Math.abs(a-b)<t,`${a} ≠ ${b}`);

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
 assert.ok(await page.evaluate(()=>!!window.NAGWEB_STORY_TIMELINE_UI));

 // Diseño base y Momento de la escena son capas distintas.
 assert.equal(await page.evaluate(()=>NAGWEB_STORY_EDITOR.canvasMode()),'base');
 assert.ok(await page.$('[data-story-canvas-mode="base"]'));
 assert.ok(await page.$('[data-story-canvas-mode="moment"]'));
 await page.click('[data-story-canvas-mode="moment"]');
 assert.equal(await page.evaluate(()=>NAGWEB_STORY_EDITOR.canvasMode()),'moment');
 await page.evaluate(()=>NAGWEB_SCROLL_DIRECTOR.scrub('story-scene',.5));
 let previewHandle=await page.$('#preview'),previewFrame=await previewHandle.contentFrame();
 const moveMetric=await previewFrame.evaluate(()=>({handles:[...document.querySelectorAll('.nw-story-transform-h')].map(h=>getComputedStyle(h).display)}));
 assert.ok(moveMetric.handles.length===2&&moveMetric.handles.every(x=>x!=='none'));
 await previewFrame.evaluate(()=>{
  const n=document.querySelector('[data-id="story-text"]'),r=n.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
  n.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,clientX:x,clientY:y,button:0,pointerId:21}));
  window.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:x+50,clientY:y,button:0,pointerId:21}));
  window.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:x+50,clientY:y,button:0,pointerId:21}));
 });
 await page.waitForFunction(()=>sec().elements[0].sdKeyframes.some(k=>Math.abs(k.at-50)<.11));
 let momentEdit=await page.evaluate(()=>({baseX:sec().elements[0].x,frames:NAGWEB_STORY_EDITOR.frames(sec().elements[0])}));
 assert.equal(momentEdit.baseX,20);
 assert.equal(momentEdit.frames.find(k=>k.at===0).x,0);
 assert.equal(momentEdit.frames.find(k=>k.at===100).x,200);
 near(momentEdit.frames.find(k=>Math.abs(k.at-50)<.11).x,150,2);

 // Editar un keyframe existente cambia solo ese punto, no los vecinos.
 await page.evaluate(()=>NAGWEB_SCROLL_DIRECTOR.scrub('story-scene',0));
 previewHandle=await page.$('#preview');previewFrame=await previewHandle.contentFrame();
 await previewFrame.evaluate(()=>{
  const n=document.querySelector('[data-id="story-text"]'),r=n.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
  n.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,clientX:x,clientY:y,button:0,pointerId:22}));
  window.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:x+20,clientY:y+15,button:0,pointerId:22}));
  window.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:x+20,clientY:y+15,button:0,pointerId:22}));
 });
 await page.waitForFunction(()=>NAGWEB_STORY_EDITOR.frames(sec().elements[0]).find(k=>k.at===0).x>0);
 const isolated=await page.evaluate(()=>NAGWEB_STORY_EDITOR.frames(sec().elements[0]));
 near(isolated.find(k=>k.at===0).x,20,2);near(isolated.find(k=>k.at===0).y,15,2);
 assert.equal(isolated.find(k=>k.at===100).x,200);
 assert.ok(isolated.some(k=>Math.abs(k.at-50)<.11));

 // En Diseño base el drag vuelve a modificar la geometría general, sin tocar keyframes.
 await page.click('[data-story-canvas-mode="base"]');
 const framesBeforeBase=await page.evaluate(()=>JSON.stringify(NAGWEB_STORY_EDITOR.frames(sec().elements[0])));
 previewHandle=await page.$('#preview');previewFrame=await previewHandle.contentFrame();
 await previewFrame.evaluate(()=>parent.postMessage({sc:true,type:'change',id:'story-text',x:30,y:30,w:60,rot:0},'*'));
 await page.waitForFunction(()=>sec().elements[0].x===30);
 assert.equal(await page.evaluate(()=>JSON.stringify(NAGWEB_STORY_EDITOR.frames(sec().elements[0]))),framesBeforeBase);

 // Alt+Shift + handle de tamaño escala proporcionalmente texto y caja en Diseño base.
 await page.evaluate(()=>{sec().elements[0].x=20;sec().elements[0].w=60;sec().elements[0].rot=0;sec().elements[0].customSize=0;renderPane();renderPreview();});
 await page.waitForFunction(()=>document.querySelector('#preview')?.contentDocument?.querySelector('.nw-story-transform-h.size'));
 previewHandle=await page.$('#preview');previewFrame=await previewHandle.contentFrame();
 await previewFrame.evaluate(()=>{
  const h=document.querySelector('.nw-story-transform-h.size'),r=h.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
  h.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,clientX:x,clientY:y,button:0,pointerId:31,altKey:true,shiftKey:true}));
  window.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:x+70,clientY:y+70,button:0,pointerId:31,altKey:true,shiftKey:true}));
  window.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:x+70,clientY:y+70,button:0,pointerId:31,altKey:true,shiftKey:true}));
 });
 await page.waitForFunction(()=>sec().elements[0].w>60&&sec().elements[0].customSize>0);
 const proportional=await page.evaluate(()=>({w:sec().elements[0].w,size:sec().elements[0].customSize,frames:JSON.stringify(NAGWEB_STORY_EDITOR.frames(sec().elements[0]))}));
 assert.ok(proportional.w>60&&proportional.size>0);
 assert.equal(proportional.frames,framesBeforeBase);

 // Restaurar fixture para el resto de las pruebas históricas.
 await page.evaluate(()=>{
  const e=sec().elements[0];e.x=20;e.y=30;e.w=60;e.rot=0;e.customSize=0;e.sdKeyframes=[{at:0,x:0,opacity:100},{at:100,x:200,y:-100,scale:150,rotate:20,opacity:50,blur:4}];e.sdKeyframesEnabled=true;
  NAGWEB_STORY_EDITOR.setCanvasMode('base');renderPane();renderPreview();
 });
 await page.waitForFunction(()=>document.querySelector('#preview')?.contentWindow?.__NAG_SCROLL_DIRECTOR?.['story-scene']);

 await page.click('[data-story-tl-dock]');
 assert.ok(await page.$('.nw-sd-timeline.nw-sd-docked'));
 const dockBefore=await page.$eval('.nw-sd-timeline.nw-sd-docked',n=>n.getBoundingClientRect().height);
 const resize=await page.$('.nw-sd-dock-resize'),rb=await resize.boundingBox();
 await page.mouse.move(rb.x+rb.width/2,rb.y+rb.height/2);await page.mouse.down();await page.mouse.move(rb.x+rb.width/2,rb.y-60,{steps:4});await page.mouse.up();
 const dockAfter=await page.$eval('.nw-sd-timeline.nw-sd-docked',n=>n.getBoundingClientRect().height);
 assert.ok(dockAfter>dockBefore+35);
 await page.click('[data-story-tl-zoom="1"]');await page.click('[data-story-tl-zoom="1"]');
 const zoomed=await page.evaluate(()=>({state:NAGWEB_STORY_TIMELINE_UI.state(),canvas:document.querySelector('.nw-sd-canvas').style.width}));
 assert.ok(zoomed.state.zoom>1);assert.notEqual(zoomed.canvas,'100%');
 await page.click('[data-story-tl-minimize]');assert.ok(await page.$('.nw-sd-timeline.is-minimized'));
 await page.click('[data-story-tl-minimize]');assert.equal(await page.$('.nw-sd-timeline.is-minimized'),null);
 await page.click('[data-story-tl-fit]');
 assert.equal(await page.evaluate(()=>NAGWEB_STORY_TIMELINE_UI.state().zoom),1);
 assert.equal(await page.$eval('.nw-sd-canvas',n=>n.style.width),'100%');
 await page.click('[data-story-tl-dock]');
 assert.equal(await page.$('.nw-sd-timeline.nw-sd-docked'),null);
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

 // Los marcadores antiguos se conservan en datos, pero ya no ocupan la Timeline
 // ni atraen keyframes invisiblemente.
 await page.evaluate(()=>{sec().sdBeats=[{id:'legacy-beat',at:51,name:'PRODUCTO'}];sec().sdSnapBeats=true;renderPane();});
 assert.equal(await page.$('[data-story-beat-add]'),null);
 assert.equal(await page.$('[data-sd-beat]'),null);
 assert.equal(await page.$('[data-story-beat-line]'),null);
 assert.deepEqual(await page.evaluate(()=>({beats:sec().sdBeats,ui:{markersVisible:NAGWEB_STORY_TIMELINE_UI.markersVisible,directScrub:NAGWEB_STORY_TIMELINE_UI.directScrub}})),{
  beats:[{id:'legacy-beat',at:51,name:'PRODUCTO'}],ui:{markersVisible:false,directScrub:true}
 });

 // La Timeline misma funciona como scrub: regla y pista actualizan el mismo
 // progreso que el control "Ver un momento".
 const ruler=await page.$eval('[data-story-scrub-ruler]',n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};});
 await page.mouse.click(ruler.x+ruler.w*.37,ruler.y+ruler.h/2);
 const rulerScrub=await page.evaluate(()=>({p:NAGWEB_SCROLL_DIRECTOR.progress(sec().id),slider:+document.querySelector('[data-sd-scrub="'+sec().id+'"]').value}));
 assert.ok(Math.abs(rulerScrub.p-37)<1);assert.ok(Math.abs(rulerScrub.slider-37)<1);

 const directTrack=await page.$eval('[data-story-track="story-text"]',n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};});
 await page.mouse.click(directTrack.x+directTrack.w*.58,directTrack.y+directTrack.h/2);
 const trackScrub=await page.evaluate(()=>({p:NAGWEB_SCROLL_DIRECTOR.progress(sec().id),slider:+document.querySelector('[data-sd-scrub="'+sec().id+'"]').value,beats:sec().sdBeats.length}));
 assert.ok(Math.abs(trackScrub.p-58)<1);assert.ok(Math.abs(trackScrub.slider-58)<1);assert.equal(trackScrub.beats,1);
 assert.equal(await page.evaluate(()=>sec().elements.length),2);
 await page.evaluate(()=>NAGWEB_STORY_EDITOR.select('story-text',NAGWEB_STORY_EDITOR.frames(sec().elements[0])[1].id));
 await page.click('[data-story-action="hold"]');
 const held=await page.evaluate(()=>NAGWEB_STORY_EDITOR.frames(sec().elements[0]));
 assert.equal(held[2].at,held[1].at+10);
 for(const prop of ['x','y','scale','rotate','opacity','blur'])assert.equal(held[2][prop],held[1][prop]);
 assert.ok(await page.$('.nw-sd-hold'));
 // Double click also works on the legacy timing bar, without its drag handler
 // replacing the track between clicks or creating a spurious undo step.
 await page.$eval('[data-story-track="story-old"]',n=>n.scrollIntoView({block:'center'}));
 const legacyTrack=await page.$eval('[data-story-track="story-old"]',n=>{const r=n.getBoundingClientRect();return{x:r.x+r.width*.5,y:r.y+r.height/2};});
 const beforeLegacyAdd=await page.evaluate(()=>history.length);
 await page.mouse.click(legacyTrack.x,legacyTrack.y,{count:2});
 assert.equal(await page.evaluate(()=>sec().elements[1].sdKeyframes.length),1);
 assert.equal(await page.evaluate(()=>history.length),beforeLegacyAdd+1);
 await page.keyboard.down('Shift');await page.click('[data-story-select="story-text"]');await page.keyboard.up('Shift');
 assert.equal(await page.evaluate(()=>selection.length),2);
 await page.keyboard.down('Shift');await page.click('[data-story-select="story-old"]');await page.keyboard.up('Shift');
 assert.deepEqual(await page.evaluate(()=>({ids:selection,element:sec().elements[curEl].id})),{ids:['story-text'],element:'story-text'});
 assert.equal(await page.$('.nw-sd-key.is-selected'),null);
 const staggerIds=await page.evaluate(()=>{
  const s=sec();s.elements=[];
  for(let i=0;i<6;i++)s.elements.push(mkEl('heading',{id:'stagger-'+i,text:'Texto '+i,anim:'none',sdStart:20,sdEnd:75}));
  s.elements.push(mkEl('container',{id:'universal-stagger',universal:true}),mkEl('heading',{id:'uc-child',parent:'universal-stagger',sdStart:20,sdEnd:80}),mkEl('heading',{id:'fixed-skip',fixed:true}),mkEl('container',{id:'modal-skip',modal:true}),mkEl('light3d',{id:'light-skip'}));
  selection=s.elements.map(e=>e.id);renderPane();return selection;
 });
 await page.click('[data-story-stagger-apply]');
 const staggered=await page.evaluate(()=>sec().elements.map(e=>[e.id,e.sdStart]));
 assert.deepEqual(staggered.slice(0,6).map(e=>e[1]),[20,25,30,35,40,45]);
 assert.equal(staggered[7][1],50);assert.ok(staggered.slice(8).every(e=>e[1]!==55));
 assert.equal(staggered[6][1],null); // No automatic timing is added to the Universal container.
 const preset=await page.evaluate(()=>{
  selection=['stagger-0'];curEl=0;renderPane();const before=sec().elements.length;
  NAGWEB_STORY_EDITOR.preset('stagger-0','cinematic');
  return{count:sec().elements.length,before,frames:sec().elements[0].sdKeyframes.length,start:sec().elements[0].sdStart};
 });
 assert.equal(preset.count,preset.before);assert.equal(preset.frames,4);assert.equal(preset.start,20);
 await page.evaluate(ids=>NAGWEB_STORY_EDITOR.stagger(ids,5,20),staggerIds);
 assert.equal(await page.evaluate(()=>sec().elements[0].sdKeyframes[0].at),20);
 assert.equal(await page.evaluate(()=>sec().elements[0].sdKeyframes.at(-1).at),100);
 const behavior=await page.evaluate(()=>{
  const e=sec().elements[1];selection=[e.id];curEl=1;renderPane();
  const before={start:e.sdStart,end:e.sdEnd};
  NAGWEB_BEHAVIORS.apply('reveal');NAGWEB_BEHAVIORS.apply('parallax');
  const combined=NAGWEB_BEHAVIORS.applied(e).filter(c=>c.enabled).map(c=>c.id);
  e.sdMoveY=-220;NAGWEB_BEHAVIORS.toggle('parallax',false);const paused=e.sdMoveY;
  NAGWEB_BEHAVIORS.toggle('parallax',true);const resumed=e.sdMoveY;
  NAGWEB_BEHAVIORS.toggle('reveal',false);
  const restored=e.sdStart===before.start&&e.sdEnd===before.end;
  selection=['uc-child'];curEl=sec().elements.findIndex(e=>e.id==='uc-child');renderPane();
  NAGWEB_BEHAVIORS.apply('depth');NAGWEB_BEHAVIORS.apply('magnet');
  const child=sec().elements[curEl],configs=NAGWEB_BEHAVIORS.applied(child);
  const legacy=mkEl('heading',{nwBehaviors:['reveal'],sdStart:17,sdEnter:'up'});
  return{combined,paused,resumed,restored,depthOff:!configs.find(c=>c.id==='depth').enabled,magnetOn:configs.find(c=>c.id==='magnet').enabled,legacy:NAGWEB_BEHAVIORS.applied(legacy)[0].params.sdStart};
 });
 assert.deepEqual(behavior.combined,['reveal','parallax']);assert.equal(behavior.paused,0);assert.equal(behavior.resumed,-220);assert.ok(behavior.restored&&behavior.depthOff&&behavior.magnetOn);assert.equal(behavior.legacy,17);
 await page.focus('[data-behavior-id="magnet"][data-behavior-field="ucStrength"]');await page.keyboard.down('Control');await page.keyboard.press('a');await page.keyboard.up('Control');await page.keyboard.type('61');await page.keyboard.press('Tab');
 await page.click('[data-behavior-toggle="magnet"]');await page.click('[data-behavior-toggle="magnet"]');
 assert.equal(await page.evaluate(()=>sec().elements[curEl].ucStrength),61);
 const frameBehaviors=await page.evaluate(()=>{
  const e=sec().elements[0];selection=[e.id];curEl=0;renderPane();
  NAGWEB_BEHAVIORS.apply('reveal');NAGWEB_BEHAVIORS.apply('parallax');
  const both=NAGWEB_BEHAVIORS.applied(e).filter(c=>c.enabled).map(c=>c.id),ys=e.sdKeyframes.map(k=>k.y);
  NAGWEB_BEHAVIORS.toggle('reveal',false);const independent=JSON.stringify(ys)===JSON.stringify(e.sdKeyframes.map(k=>k.y));
  NAGWEB_BEHAVIORS.toggle('reveal',true);const resumed=NAGWEB_BEHAVIORS.applied(e).filter(c=>c.enabled).length===2;
  const legacy=mkEl('heading',{id:'legacy-recipe-with-frames',nwBehaviors:['reveal'],sdKeyframes:[{at:0,x:0},{at:100,x:120}]});sec().elements.push(legacy);selection=[legacy.id];curEl=sec().elements.length-1;renderPane();
  const original=JSON.stringify(legacy.sdKeyframes);NAGWEB_BEHAVIORS.toggle('reveal',false);return{both,independent,resumed,kept:original===JSON.stringify(legacy.sdKeyframes)};
 });
 assert.deepEqual(frameBehaviors.both,['reveal','parallax']);assert.ok(frameBehaviors.independent&&frameBehaviors.resumed&&frameBehaviors.kept);
 console.log('Storytelling: modelo, compatibilidad, interpolación y runtime exportado OK');
}
