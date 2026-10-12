import assert from 'node:assert/strict';
export async function runMotionPopParadeSmoke(page){
 const previous=await page.evaluate(()=>({project:JSON.stringify(project),curPage,curSec,curEl,curPane,selection,secFocus,mode:NAGWEB_STORY_EDITOR.canvasMode(),timeline:NAGWEB_STORY_TIMELINE_UI.state()}));
 try{
  await page.click('.tb-left [data-motion-open]');
  await page.click('[data-motion-template="pop-parade"]');
  await page.waitForFunction(()=>{const f=document.querySelector('.nw-motion-dialog iframe'),d=f?.contentDocument,id=d?.querySelector('.sc')?.dataset.id;return d?.querySelectorAll('.im-hov').length===12&&f.contentWindow.__NAG_SCROLL_DIRECTOR?.[id]&&[...d.querySelectorAll('.im-hov img')].every(n=>n.complete&&n.naturalWidth===480);},{timeout:20000});
  assert.equal(await page.$eval('[data-motion-config="duration"]',n=>n.value),'14');
  const pose=async p=>page.$eval('.nw-motion-dialog iframe',(f,p)=>{const d=f.contentDocument,id=d.querySelector('.sc').dataset.id;f.contentWindow.__NAG_SCROLL_DIRECTOR[id].set(p);return [...d.querySelectorAll('.im-hov')].map(n=>({opacity:n.style.getPropertyValue('--nw-sd-opacity'),scale:n.style.getPropertyValue('--nw-sd-scale'),z:n.style.getPropertyValue('--nw-sd-z')}));},p);
  const first=await pose(0),last=await pose(1),middle=await pose(.10);
  assert.deepEqual(first,last,'Pop Parade timeline closes without a jump');
  assert.ok(first.every(x=>parseFloat(x.opacity)===0),'No cards visible at the seam');
  assert.ok(middle.some(x=>parseFloat(x.opacity)>0),'Parade brings images into view');
  assert.notDeepEqual(middle,first,'Parade changes pose');
  const layers=await page.$$eval('[data-motion-layer]',ns=>ns.map(n=>n.dataset.motionLayer));assert.equal(layers.length,12);
  await page.click('[data-motion-library-tab="elements"]');await page.click('[data-motion-layer="'+layers[0]+'"]');
  assert.ok((await page.$$eval('[data-motion-key-jump]',ns=>ns.map(n=>n.textContent))).some(n=>n.includes('%')),'Keyframes remain editable');
  await page.click('[data-motion-insert-group]');
  const insertion=await page.evaluate(()=>{const group=sec().elements.find(e=>e.nwMotionInstance&&e.nwMotionInstance.template==='pop-parade');return group?{id:group.id,source:group.nwMotionInstance.source,images:sec().elements.filter(e=>e.parent===group.id&&e.type==='image').length}:null;});
  assert.ok(insertion,'Editable composition inserted');assert.equal(insertion.images,12);assert.equal(insertion.source,'time');
  await page.evaluate(id=>NAGWEB_MOTION_LAB.edit(id),insertion.id);
  await page.waitForFunction(()=>document.querySelector('.nw-motion-dialog iframe')?.contentDocument?.querySelectorAll('.im-hov').length===12,{timeout:20000});
  assert.deepEqual(await pose(0),first,'Reopening preserves original keyframes');
  await page.click('[data-motion-close]');
  await page.evaluate(()=>{document.querySelector('#pop-parade-export')?.remove();const f=document.createElement('iframe');f.id='pop-parade-export';f.srcdoc=generateSite(flattenPage(page()),false,false,false);document.body.append(f);});
  await page.waitForFunction(id=>document.querySelector('#pop-parade-export')?.contentWindow?.__NAG_SCROLL_DIRECTOR?.[id],{timeout:20000},insertion.id);
  const exported=await page.$eval('#pop-parade-export',(f,id)=>{const rt=f.contentWindow.__NAG_SCROLL_DIRECTOR[id];rt.set(.10);return [...f.contentDocument.querySelector('[data-id="'+id+'"]').querySelectorAll('.im-hov')].some(n=>parseFloat(n.style.getPropertyValue('--nw-sd-opacity'))>0);},insertion.id);
  assert.equal(exported,true,'Export shares animated keyframe behavior');
  console.log('Pop Parade: 12 editable keyframed images, loop, stage preview, insert/reopen and export OK');
 }finally{
  await page.evaluate(p=>{document.querySelector('.nw-motion-dialog').close();document.querySelector('#pop-parade-export')?.remove();clearTimeout(previewTimer);project=JSON.parse(p.project);curPage=p.curPage;curSec=p.curSec;curEl=p.curEl;curPane=p.curPane;selection=p.selection;secFocus=p.secFocus;history=[];future=[];NAGWEB_STORY_EDITOR.setCanvasMode(p.mode);NAGWEB_STORY_TIMELINE_UI.setState(p.timeline);saveProject();renderScenes();renderPane();renderPreview();},previous);
 }
}
