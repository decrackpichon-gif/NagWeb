import assert from 'node:assert/strict';

export async function runTimeSmoke(page){
 const previous=await page.evaluate(()=>({project:JSON.stringify(project),curPage,curSec,curEl,curPane,selection,secFocus}));
 try{
  await page.evaluate(()=>{
   const s=NAGWEB_MOTION_LAB.create().scene;s.id='time-loop';s.nwMotionDuration=1;
   s.elements=[mkEl('heading',{id:'time-element',text:'Por tiempo',anim:'none',sdKeyframesEnabled:true,sdKeyframes:[{id:'t0',at:0,x:0,z:0,ease:'linear'},{id:'t1',at:100,x:200,z:100,ease:'linear'}]})];
   const once=JSON.parse(JSON.stringify(s));once.id='time-once';once.elements[0].id='once-element';once.nwMotionDuration=.5;once.nwMotionLoop=false;
   const scroll=JSON.parse(JSON.stringify(s));scroll.id='time-scroll';scroll.elements[0].id='scroll-element';scroll.nwMotionSource='scroll';scroll.sdEnabled=true;
   project.pages[0].sections=[s,once,scroll];curPage=0;curSec=0;curEl=0;curPane='elements';selection=['time-element'];secFocus=false;
   renderPane();renderPreview();saveProject();
   const f=document.createElement('iframe');f.id='time-export';f.style.cssText='width:900px;height:600px';f.srcdoc=generateSite(flattenPage(page()),false,false,false);document.body.append(f);
  });
  await page.waitForFunction(()=>document.getElementById('time-export')?.contentWindow?.__NAG_SCROLL_DIRECTOR?.['time-once']);
  const layout=await page.evaluate(()=>{
   const f=document.getElementById('time-export'),d=f.contentDocument,w=f.contentWindow,s=d.querySelector('[data-id="time-loop"]');
   return{sticky:s.classList.contains('nw-sd-active'),stage:!!s.querySelector('.nw-sd-stage'),height:s.offsetHeight,vh:w.innerHeight,scrollStage:!!d.querySelector('[data-id="time-scroll"] .nw-sd-stage')};
  });
  assert.equal(layout.sticky,false);assert.equal(layout.stage,false);assert.ok(Math.abs(layout.height-layout.vh)<3);assert.equal(layout.scrollStage,true);
  await page.waitForFunction(()=>document.getElementById('time-export').contentWindow.__NAG_SCROLL_DIRECTOR['time-once'].progress()===1);
  const paused=await page.evaluate(()=>{const r=document.getElementById('time-export').contentWindow.__NAG_SCROLL_DIRECTOR;r['time-loop'].pause();return r['time-loop'].progress();});
  await page.evaluate(()=>new Promise(r=>setTimeout(r,150)));
  assert.equal(await page.evaluate(()=>document.getElementById('time-export').contentWindow.__NAG_SCROLL_DIRECTOR['time-loop'].progress()),paused);
  assert.equal(await page.evaluate(()=>document.getElementById('time-export').contentWindow.__NAG_SCROLL_DIRECTOR['time-once'].progress()),1);
  await page.evaluate(()=>document.getElementById('time-export').contentWindow.__NAG_SCROLL_DIRECTOR['time-loop'].live());
  await page.waitForFunction(()=>document.getElementById('time-export').contentWindow.__NAG_SCROLL_DIRECTOR['time-loop'].progress()>.85);
  await page.waitForFunction(()=>document.getElementById('time-export').contentWindow.__NAG_SCROLL_DIRECTOR['time-loop'].progress()<.2);
  const independent=await page.evaluate(()=>{
   const f=document.getElementById('time-export'),w=f.contentWindow,r=w.__NAG_SCROLL_DIRECTOR;r['time-loop'].set(.3);w.scrollTo(0,1000);return r['time-loop'].progress();
  });
  await page.evaluate(()=>new Promise(r=>setTimeout(r,100)));
  assert.equal(await page.evaluate(()=>document.getElementById('time-export').contentWindow.__NAG_SCROLL_DIRECTOR['time-loop'].progress()),independent);
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  await page.evaluate(()=>document.getElementById('time-export').contentWindow.__NAG_SCROLL_DIRECTOR['time-loop'].live());
  await page.waitForFunction(()=>document.getElementById('time-export').contentDocument.querySelector('[data-id="time-element"]').style.getPropertyValue('--nw-sd-z')==='0.00px');
  assert.equal(await page.evaluate(()=>document.getElementById('time-export').contentWindow.__NAG_SCROLL_DIRECTOR['time-loop'].progress()),.5);
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'no-preference'}]);
  await page.waitForFunction(()=>document.getElementById('time-export').contentWindow.__NAG_SCROLL_DIRECTOR['time-loop'].progress()!==.5);

  await page.evaluate(()=>{curPane='scene';secFocus=true;selection=[];renderPane();});
  assert.ok(await page.$('[data-motion-source]'));assert.ok(await page.$('[data-bind="sec.nwMotionDuration"]'));
  const frames=await page.evaluate(()=>JSON.stringify(sec().elements[0].sdKeyframes));
  await page.select('[data-motion-source]','scroll');assert.equal(await page.evaluate(()=>sec().sdEnabled),true);
  await page.select('[data-motion-source]','time');assert.equal(await page.evaluate(()=>sec().sdEnabled),false);
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().elements[0].sdKeyframes)),frames);
  await page.evaluate(()=>{curPane='elements';curEl=0;selection=['time-element'];secFocus=false;renderPane();NAGWEB_STORY_EDITOR.select('time-element','t1');});
  await page.focus('[data-story-field="z"]');await page.keyboard.down('Control');await page.keyboard.press('a');await page.keyboard.up('Control');await page.keyboard.type('140');await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>sec().sdEnabled),false,'Editing a time moment must not enable Scroll');
  assert.equal(await page.evaluate(()=>sec().elements[0].sdKeyframes[1].z),140);
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem(STORE_KEY)).pages[0].sections[0]);
  assert.equal(stored.nwMotionSource,'time');assert.equal(stored.elements[0].sdKeyframes[1].z,140);
  await page.click('[data-sd-play="time-loop"]');await page.waitForFunction(()=>NAGWEB_SCROLL_DIRECTOR.progress('time-loop')>10&&NAGWEB_SCROLL_DIRECTOR.progress('time-loop')<90);
  await page.click('[data-sd-pause="time-loop"]');const p=await page.evaluate(()=>NAGWEB_SCROLL_DIRECTOR.progress('time-loop'));
  await page.evaluate(()=>new Promise(r=>setTimeout(r,150)));assert.equal(await page.evaluate(()=>NAGWEB_SCROLL_DIRECTOR.progress('time-loop')),p);
  console.log('Tiempo: duración, repetición, pausa, scroll independiente, altura normal, movimiento reducido, cambio de fuente, edición y guardado OK');
 }finally{
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'no-preference'}]);
  await page.evaluate(p=>{document.getElementById('time-export')?.remove();clearTimeout(previewTimer);project=JSON.parse(p.project);curPage=p.curPage;curSec=p.curSec;curEl=p.curEl;curPane=p.curPane;selection=p.selection;secFocus=p.secFocus;history=[];future=[];saveProject();renderScenes();renderPane();renderPreview();},previous);
 }
}
