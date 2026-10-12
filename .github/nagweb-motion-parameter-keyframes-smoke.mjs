import assert from 'node:assert/strict';
export async function runMotionParameterKeysSmoke(page){
 const prev=await page.evaluate(()=>({project:JSON.stringify(project),curPage,curSec,curEl,curPane,selection,secFocus,mode:NAGWEB_STORY_EDITOR.canvasMode(),timeline:NAGWEB_STORY_TIMELINE_UI.state()}));
 try{
  await page.click('.tb-left [data-motion-open]');
  await page.click('[data-motion-template="grid-dive"]');
  await page.waitForFunction(()=>{const f=document.querySelector('.nw-motion-dialog iframe'),d=f?.contentDocument,id=d?.querySelector('.sc')?.dataset.id;return d?.querySelectorAll('.nw-grid-dive-card').length===12&&f.contentWindow.__NAG_SCROLL_DIRECTOR?.[id]&&document.querySelector('[data-motion-stream-key="diveZoom"]');},{timeout:20000});
  async function playhead(value){await page.$eval('[data-motion-progress]',(n,v)=>{n.value=String(v);n.dispatchEvent(new Event('input',{bubbles:true}));},value);}
  let revision=0;async function change(selector,value){const stamp='keyframe-'+(++revision);await page.$eval(selector,(n,{value,stamp})=>{document.querySelector('.nw-motion-dialog iframe').contentDocument.body.dataset.oldKeyframe=stamp;n.value=value;n.dispatchEvent(new Event('input',{bubbles:true}));},{value,stamp});await page.waitForFunction(stamp=>{const d=document.querySelector('.nw-motion-dialog iframe')?.contentDocument;return d?.body&&d.body.dataset.oldKeyframe!==stamp&&d.querySelector('.nw-grid-dive-card');},{timeout:20000},stamp);}
  const diamond='[data-motion-stream-key="diveZoom"]';
  await playhead(25);await page.click(diamond);
  assert.equal(await page.$eval(diamond,n=>n.getAttribute('aria-pressed')),'true','diamond created a keyframe');
  assert.equal(await page.$eval('[data-motion-param-count]',n=>n.textContent),'1 pista');
  assert.equal(await page.$eval('[data-motion-param-seek]',ns=>ns.length),1);
  await change('[data-motion-stream="diveZoom"]','3.7');
  await page.waitForFunction(()=>document.querySelector('[data-motion-stream="diveZoom"]')?.value==='3.7',{timeout:15000});
  await playhead(50);
  assert.ok(Math.abs(+(await page.$eval('[data-motion-stream="diveZoom"]',n=>n.value))-3.37)<.1,'slider shows interpolated value between keyed 25% and base 100%');
  await page.click('[data-motion-param-seek="25"]');assert.ok(Math.abs(+(await page.$eval('[data-motion-progress]',n=>n.value))-25)<.1,'timeline marker seeks the authored time');
  assert.equal(await page.$eval(diamond,n=>n.getAttribute('aria-pressed')),'true');
  await change('[data-motion-stream="backgroundType"]','color');
  await page.click('[data-motion-stream-key="backgroundColor"]');
  await change('[data-motion-stream="backgroundColor"]','#ff0000');
  assert.equal(await page.$eval('[data-motion-param-count]',n=>n.textContent),'2 pistas');
  await playhead(50);
  const colour=await page.$eval('.nw-motion-dialog iframe',f=>{const d=f.contentDocument,h=d.querySelector('[data-nw-stream-slot]').offsetParent;return getComputedStyle(h).backgroundColor;});
  assert.notEqual(colour,'rgb(255, 0, 0)','background colour is interpolated, not snapped');assert.notEqual(colour,'rgb(16, 16, 20)','background colour changes during the timeline');
  await page.click('[data-motion-insert-group]');
  const placed=await page.evaluate(()=>{const g=sec().elements.find(e=>e.nwMotionInstance?.template==='grid-dive');return g&&{id:g.id,keys:g.nwMotionInstance.stream.paramKeys};});
  assert.ok(placed?.keys?.diveZoom?.length,'numeric keyframe survives insertion');
  assert.ok(placed.keys.backgroundColor?.length,'colour keyframe survives insertion');
  await page.evaluate(id=>NAGWEB_MOTION_LAB.edit(id),placed.id);
  await page.waitForFunction(()=>document.querySelector('[data-motion-stream-key="diveZoom"]')&&document.querySelector('.nw-motion-dialog iframe')?.contentDocument?.querySelector('.nw-grid-dive-card'),{timeout:20000});
  await playhead(25);assert.equal(await page.$eval(diamond,n=>n.getAttribute('aria-pressed')),'true','reopened component restores the keyframe');
  await page.click(diamond);assert.equal(await page.$eval(diamond,n=>n.getAttribute('aria-pressed')),'false','diamond removes keyframe');
  assert.equal(await page.$eval('[data-motion-param-count]',n=>n.textContent),'1 pista');
  await page.click('[data-motion-close]');
  console.log('Motion Lab slider + colour diamonds: key/edit/interpolate/insert/reopen/remove OK');
 }finally{
  await page.evaluate(p=>{document.querySelector('.nw-motion-dialog').close();clearTimeout(previewTimer);project=JSON.parse(p.project);curPage=p.curPage;curSec=p.curSec;curEl=p.curEl;curPane=p.curPane;selection=p.selection;secFocus=p.secFocus;history=[];future=[];NAGWEB_STORY_EDITOR.setCanvasMode(p.mode);NAGWEB_STORY_TIMELINE_UI.setState(p.timeline);saveProject();renderScenes();renderPane();renderPreview();},prev);
 }
}
