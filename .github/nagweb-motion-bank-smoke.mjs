import assert from 'node:assert/strict';

export async function runMotionBankSmoke(page){
 const viewport=page.viewport(),previous=await page.evaluate(()=>({project:JSON.stringify(project),curPage,curSec,curEl,curPane,selection,secFocus,mode:NAGWEB_STORY_EDITOR.canvasMode(),timeline:NAGWEB_STORY_TIMELINE_UI.state()}));
 try{
  await page.evaluate(()=>{project.pages[0].sections=[mkSection({layout:'free',sdEnabled:false,elements:[]})];curPage=0;curSec=0;curEl=0;selection=[];secFocus=false;saveProject();renderPane();renderPreview();history=[];future=[];});
  const before=await page.evaluate(()=>({project:JSON.stringify(project),assets:project.assets.images.length,stored:localStorage.getItem(STORE_KEY)}));
  await page.click('.tb-left [data-motion-open]');await page.waitForFunction(()=>document.querySelector('.nw-motion-dialog iframe')?.contentDocument?.querySelector('[data-motion-canvas]'));
  assert.deepEqual(await page.$$eval('[data-motion-template]:not([data-motion-saved])',ns=>ns.map(n=>n.dataset.motionTemplate)),['iso-focus','soft-orbit','card-tunnel','card-bloom','showcase-stream','iso-orbit','pop-grid','center-stage','orbit-bloom','ticker-tilt','ticker-loop','carousel-flow','stack-slide','iso-focus-sequence','card-toss','diagonal-carousel','iso-cascade','grid-reveal','zoom-parallax','cascade-drop','focus-shift','spiral-stream','film-strip','card-totem','deck-peel','poster-burst','photo-orbit','wheel-carousel','wheel-spin','wheel-spin-bottom','cover-flow','cover-flow-vertical','cover-ring','cover-ring-vertical','image-trail','position-dance','cascade-deck','orbit-showcase','split-reveal','diagonal-wipe','stripe-reveal','mosaic-wipe','hero-reel','flip-grid','orbit-carousel','column-drift','spotlight-zoom','focus-orbit','focus-slider','sphere-wall']);
  const focusId=await page.evaluate(()=>document.querySelector('.nw-motion-dialog iframe').contentDocument.querySelector('.sc').dataset.id);
  async function change(selector,value){await page.$eval(selector,(n,v)=>{n.value=v;n.dispatchEvent(new Event('change',{bubbles:true}));},value);}
  await change('[data-motion-content="3"]','Mi foco');await change('[data-motion-config="duration"]','6');
  await page.$eval('[data-motion-progress]',n=>{n.value='32';n.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.click('[data-motion-template="soft-orbit"]');
  await page.waitForFunction(id=>{const f=document.querySelector('.nw-motion-dialog iframe'),s=f?.contentDocument?.querySelector('.sc');return s&&s.dataset.id!==id&&f.contentWindow.__NAG_SCROLL_DIRECTOR?.[s.dataset.id];}, {},focusId);
  const orbitId=await page.evaluate(()=>document.querySelector('.nw-motion-dialog iframe').contentDocument.querySelector('.sc').dataset.id);
  assert.equal(await page.$eval('[data-motion-template="soft-orbit"]',n=>n.getAttribute('aria-pressed')),'true');assert.equal(await page.$eval('[data-motion-template="iso-focus"]',n=>n.getAttribute('aria-pressed')),'false');
  assert.match(await page.$eval('.nw-motion-stage-label',n=>n.textContent),/ÓRBITA SUAVE/);assert.equal(await page.$eval('[data-motion-config="duration"]',n=>n.value),'10');
  const poses=await page.evaluate(id=>{const f=document.querySelector('.nw-motion-dialog iframe'),rt=f.contentWindow.__NAG_SCROLL_DIRECTOR[id],n=f.contentDocument.querySelector('[data-motion-canvas].im-hov'),pose=()=>['x','y','z','rx','ry','rot'].map(k=>n.style.getPropertyValue('--nw-sd-'+k));rt.set(0);const start=pose();rt.set(.25);const quarter=pose();rt.set(.5);const middle=pose();rt.set(1);return{start,quarter,middle,end:pose()};},orbitId);
  assert.deepEqual(poses.start,poses.end,'Orbit loop closes without pose jump');assert.notDeepEqual(poses.start,poses.middle);assert.equal(poses.start[2],'5.00px');assert.equal(poses.middle[2],'-135.00px');assert.equal(poses.quarter[4],'18.00deg');
  await change('[data-motion-content="3"]','Mi órbita');await change('[data-motion-config="duration"]','12');
  await page.click('[data-motion-template="iso-focus"]');await page.waitForFunction(id=>document.querySelector('.nw-motion-dialog iframe')?.contentDocument?.querySelector('.sc')?.dataset.id===id,{},focusId);
  assert.equal(await page.$eval('[data-motion-content="3"]',n=>n.value),'Mi foco');assert.equal(await page.$eval('[data-motion-config="duration"]',n=>n.value),'6');assert.equal(await page.$eval('[data-motion-progress]',n=>n.value),'32');
  await page.click('[data-motion-template="soft-orbit"]');await page.waitForFunction(id=>document.querySelector('.nw-motion-dialog iframe')?.contentDocument?.querySelector('.sc')?.dataset.id===id,{},orbitId);
  assert.equal(await page.$eval('[data-motion-content="3"]',n=>n.value),'Mi órbita');assert.equal(await page.$eval('[data-motion-config="duration"]',n=>n.value),'12');
  assert.equal(await page.evaluate(()=>JSON.stringify(project)),before.project);assert.equal(await page.evaluate(()=>localStorage.getItem(STORE_KEY)),before.stored);assert.equal(await page.evaluate(()=>history.length),0);
  await page.click('[data-motion-insert-group]');
  const inserted=await page.evaluate(()=>({project:JSON.stringify(project),group:sec().elements.find(e=>e.nwMotionInstance),members:sec().elements.filter(e=>e.parent),assets:project.assets.images.length}));
  assert.equal(inserted.group.name,'Órbita suave · composición');assert.equal(inserted.group.nwMotionInstance.template,'soft-orbit');assert.equal(inserted.group.nwMotionInstance.duration,12);assert.equal(inserted.assets,before.assets+3,'Only chosen artwork is inserted');assert.equal(inserted.members[3].text,'Mi órbita');assert.ok(inserted.members.slice(0,3).every(e=>e.sdKeyframes.length===21));
  const ids=JSON.parse(inserted.project).pages[0].sections.flatMap(s=>[s.id,...s.elements.map(e=>e.id)]);assert.equal(new Set(ids).size,ids.length);
  await page.evaluate(id=>NAGWEB_MOTION_LAB.edit(id),inserted.group.id);assert.equal(await page.$$eval('[data-motion-template]',ns=>ns.every(n=>n.disabled)),true);assert.equal(await page.$eval('[data-motion-content="3"]',n=>n.value),'Mi órbita');assert.match(await page.$eval('.nw-motion-stage-label',n=>n.textContent),/ÓRBITA SUAVE/);await page.click('[data-motion-close]');
  await page.evaluate(()=>undo());assert.equal(await page.evaluate(()=>JSON.stringify(project)),before.project);await page.evaluate(()=>redo());assert.equal(await page.evaluate(()=>JSON.stringify(project)),inserted.project);
  await page.evaluate(()=>{const f=document.createElement('iframe');f.id='orbit-export';f.srcdoc=generateSite(flattenPage(page()),false,false,false);document.body.append(f);});
  await page.waitForFunction(id=>document.getElementById('orbit-export')?.contentWindow?.__NAG_SCROLL_DIRECTOR?.[id],{},inserted.group.id);
  const exported=await page.evaluate(id=>{const f=document.getElementById('orbit-export');f.contentWindow.__NAG_SCROLL_DIRECTOR[id].set(.5);const n=f.contentDocument.querySelector('[data-id="'+id+'"] [data-nw-sd-el]');return n.style.getPropertyValue('--nw-sd-z');},inserted.group.id);assert.equal(exported,poses.middle[2]);
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});await page.evaluate(()=>NAGWEB_MOTION_LAB.open());await page.click('[data-motion-template="soft-orbit"]');assert.ok(await page.evaluate(()=>{const d=document.querySelector('.nw-motion-dialog'),lib=d.querySelector('.nw-motion-library');return d.scrollWidth<=d.clientWidth+2&&lib.scrollWidth>=lib.clientWidth;}));
  await page.click('[data-motion-close]');assert.equal(await page.evaluate(()=>JSON.stringify(project)),inserted.project);
  console.log('Banco Motion Lab: veinticuatro plantillas, selección y preview distintos, ciclo de órbita continuo, borradores por plantilla, inserción sin recursos extra, reapertura, historial, exportación y móvil OK');
 }finally{
  await page.setViewport(viewport);await page.evaluate(p=>{document.querySelector('.nw-motion-dialog').close();document.getElementById('orbit-export')?.remove();clearTimeout(previewTimer);project=JSON.parse(p.project);curPage=p.curPage;curSec=p.curSec;curEl=p.curEl;curPane=p.curPane;selection=p.selection;secFocus=p.secFocus;history=[];future=[];NAGWEB_STORY_EDITOR.setCanvasMode(p.mode);NAGWEB_STORY_TIMELINE_UI.setState(p.timeline);saveProject();renderScenes();renderPane();renderPreview();},previous);
 }
}
