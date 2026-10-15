import assert from 'node:assert/strict';

export async function runMotionOriginalControlsSmoke(page){
 const previous=await page.evaluate(()=>({project:JSON.stringify(project),curPage,curSec,curEl,curPane,selection,secFocus,mode:NAGWEB_STORY_EDITOR.canvasMode(),timeline:NAGWEB_STORY_TIMELINE_UI.state()}));
 try{
  await page.click('.tb-left [data-motion-open]');
  await page.click('[data-motion-template="showcase-stream"]');
  await page.waitForFunction(()=>{const f=document.querySelector('.nw-motion-dialog iframe'),d=f?.contentDocument,id=d?.querySelector('.sc')?.dataset.id;return f?.contentWindow.__NAG_SCROLL_DIRECTOR?.[id]&&document.querySelector('[data-motion-stream-reset]')&&document.querySelectorAll('[data-motion-frame-ratio]').length===6;},{timeout:20000});
  const stored=await page.$$eval('[data-motion-layer]',ns=>ns.map(n=>({name:n.textContent,media:n.querySelector('img')?.src})));
  assert.equal(stored.length,12);
  assert.equal(await page.$eval('[data-motion-stream="ringTilt"]',n=>n.value),'-28');
  assert.equal(await page.$eval('[data-motion-stream="cardRatio"]',n=>n.value),'auto');
  assert.equal(await page.$eval('[data-motion-stream="cornerRadius"]',n=>n.value),'3','Reference corner radius defaults to 3%');
  await page.click('[data-motion-frame-ratio="1:1"]');
  assert.equal(await page.$eval('[data-motion-stream="frameRatio"]',n=>n.value),'1:1','ratio shortcut uses real format control');
  assert.equal(await page.$eval('[data-motion-frame-ratio="1:1"]',n=>n.getAttribute('aria-pressed')),'true');
  await page.$eval('[data-motion-stream="ringTilt"]',n=>{n.value='9';n.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.$eval('[data-motion-stream="cornerRadius"]',n=>{n.value='10';n.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await page.$eval('[data-motion-stream="cornerRadius"]',n=>n.value),'10','Corner radius remains editable');
  await page.$eval('[data-motion-stream="cardRatio"]',n=>{n.value='4:3';n.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.$eval('[data-motion-config="duration"]',n=>{n.value='20';n.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.$eval('[data-motion-progress]',n=>{n.value='25';n.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.click('[data-motion-stream-key="ringTilt"]');
  assert.equal(await page.$eval('[data-motion-param-count]',n=>n.textContent),'1 pista');
  assert.equal(await page.$eval('[data-motion-stream="ringTilt"]',n=>n.value),'9');
  await page.click('[data-motion-stream-reset]');
  assert.equal(await page.$eval('[data-motion-stream="ringTilt"]',n=>n.value),'-28','reset restores template-specific tilt');
  assert.equal(await page.$eval('[data-motion-stream="cornerRadius"]',n=>n.value),'3','reset restores original corner radius');
  assert.equal(await page.$eval('[data-motion-stream="cardRatio"]',n=>n.value),'auto','reset restores template card aspect');
  assert.equal(await page.$eval('[data-motion-stream="frameRatio"]',n=>n.value),'16:9','reset restores frame');
  assert.equal(await page.$eval('[data-motion-frame-ratio="16:9"]',n=>n.getAttribute('aria-pressed')),'true');
  assert.equal(await page.$eval('[data-motion-config="duration"]',n=>n.value),'20','reset does not destroy timing');
  assert.equal(await page.$eval('[data-motion-param-count]',n=>n.textContent),'0 pistas','reset clears authored parameter keys');
  assert.deepEqual(await page.$$eval('[data-motion-layer]',ns=>ns.map(n=>({name:n.textContent,media:n.querySelector('img')?.src}))),stored,'reset retains media and layer order');
  await page.click('[data-motion-insert-group]');
  const inserted=await page.evaluate(()=>{const g=sec().elements.find(e=>e.nwMotionInstance?.template==='showcase-stream');if(!g)return null;return{id:g.id,config:g.nwMotionInstance,images:sec().elements.filter(e=>e.parent===g.id&&e.type==='image').length};});
  assert.ok(inserted?.id,'reset composition inserts');
  assert.equal(inserted.images,12,'all author images survive insertion');
  assert.equal(inserted.config.duration,20);
  assert.equal(inserted.config.stream.ringTilt,-28);
  assert.equal(inserted.config.stream.cardRatio,'auto');
  assert.equal(inserted.config.stream.paramKeys,undefined);
  await page.evaluate(id=>NAGWEB_MOTION_LAB.edit(id),inserted.id);
  await page.waitForFunction(()=>document.querySelector('[data-motion-stream-reset]')&&document.querySelector('.nw-motion-dialog iframe')?.contentDocument?.querySelector('.sc'),{timeout:20000});
  assert.equal(await page.$eval('[data-motion-stream="ringTilt"]',n=>n.value),'-28','reopening keeps restored settings');
  await page.click('[data-motion-close]');
  await page.click('.tb-left [data-motion-open]');
  await page.click('[data-motion-template="grid-dive"]');
  await page.waitForFunction(()=>document.querySelector('[data-motion-stream="diveZoom"]'),{timeout:20000});
  const originalZoom=await page.$eval('[data-motion-stream="diveZoom"]',n=>n.value);
  await page.$eval('[data-motion-stream="diveZoom"]',n=>{n.value='3.9';n.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.click('[data-motion-stream-reset]');
  assert.equal(await page.$eval('[data-motion-stream="diveZoom"]',n=>n.value),originalZoom,'Reset is factory-specific, not hardcoded for Showcase Stream');
  await page.click('[data-motion-close]');
  console.log('Motion Lab original controls: frame shortcuts, full visual reset, media preservation, retained timing, keyframe clearing, insert/reopen, independent template defaults OK');
 }finally{
  await page.evaluate(p=>{const dialog=document.querySelector('.nw-motion-dialog');if(dialog?.open)dialog.close();clearTimeout(previewTimer);project=JSON.parse(p.project);curPage=p.curPage;curSec=p.curSec;curEl=p.curEl;curPane=p.curPane;selection=p.selection;secFocus=p.secFocus;history=[];future=[];NAGWEB_STORY_EDITOR.setCanvasMode(p.mode);NAGWEB_STORY_TIMELINE_UI.setState(p.timeline);saveProject();renderScenes();renderPane();renderPreview();},previous);
 }
}
