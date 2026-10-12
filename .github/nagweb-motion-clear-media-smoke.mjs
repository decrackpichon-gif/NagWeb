import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export async function runMotionClearMediaSmoke(page){
 const previous=await page.evaluate(()=>({project:JSON.stringify(project),curPage,curSec,curEl,curPane,selection,secFocus,mode:NAGWEB_STORY_EDITOR.canvasMode(),timeline:NAGWEB_STORY_TIMELINE_UI.state()}));
 const folder=await fs.mkdtemp(path.join(os.tmpdir(),'nagweb-clear-media-')),file=path.join(folder,'Imagen nueva.svg');
 await fs.writeFile(file,'<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180"><rect width="300" height="180" fill="#1976a5"/></svg>');
 try{
  await page.click('.tb-left [data-motion-open]');
  await page.click('[data-motion-template="showcase-stream"]');
  async function ready(expected=12){
   await page.waitForFunction(n=>{const d=document.querySelector('.nw-motion-dialog iframe')?.contentDocument;return d&&d.querySelectorAll('[data-nw-stream-slot]').length===n&&d.querySelectorAll('.nw-stream-card').length===n&&[...d.querySelectorAll('[data-nw-stream-slot] img')].length===n&&[...d.querySelectorAll('[data-nw-stream-slot] img')].every(im=>im.complete&&im.naturalWidth>0);},{timeout:20000},expected);
  }
  await ready();
  const initial=await page.$$eval('[data-motion-layer]',ns=>ns.map(n=>n.dataset.motionLayer));
  assert.equal(initial.length,12);
  assert.equal(await page.$eval('[data-motion-card-ratio="auto"]',n=>n.getAttribute('aria-pressed')),'true','Animos Auto aspect begins selected');
  await page.click('[data-motion-card-ratio="3:4"]');
  assert.equal(await page.$eval('[data-motion-stream="cardRatio"]',n=>n.value),'3:4','Card aspect button changes existing selector');
  assert.equal(await page.$eval('[data-motion-card-ratio="3:4"]',n=>n.getAttribute('aria-pressed')),'true');
  await page.click('[data-motion-card-ratio="auto"]');
  assert.equal(await page.$eval('[data-motion-stream="cardRatio"]',n=>n.value),'auto');
  await page.$eval('[data-motion-config="duration"]',n=>{n.value='20';n.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.click('[data-motion-library-tab="elements"]');await page.click('[data-motion-add-text]');
  const textId=await page.$eval('[data-motion-layer][aria-pressed="true"]',n=>n.dataset.motionLayer);
  await page.click('[data-motion-stream-clear-images]');
  await ready();
  const empty=await page.$eval('.nw-motion-dialog iframe',f=>[...f.contentDocument.querySelectorAll('[data-nw-stream-slot] img')].map(n=>({width:n.naturalWidth,src:n.currentSrc})));
  assert.equal(empty.length,12);assert.ok(empty.every(e=>e.width===8),'All slots use the transparent local 8x8 image');
  assert.equal(await page.$eval('[data-motion-stream-count]',n=>n.value),'12','Clear media does not alter slot count');
  assert.equal(await page.$eval('[data-motion-config="duration"]',n=>n.value),'20','Clear media preserves loop duration');
  assert.ok((await page.$$eval('[data-motion-layer]',ns=>ns.map(n=>n.dataset.motionLayer))).includes(textId),'Free text overlay remains');
  assert.deepEqual((await page.$$eval('[data-motion-layer]',ns=>ns.map(n=>n.dataset.motionLayer))).filter(n=>initial.includes(n)),initial,'Slots preserve their order');
  const preview=await page.$eval('.nw-motion-layer-thumb img',ns=>ns.map(n=>n.hidden));assert.equal(preview.length,12);
  assert.ok(preview.every(Boolean),'Blank slots show no ghost thumbnails');
  await (await page.$('[data-motion-stream-batch-upload]')).uploadFile(file,file);
  await page.waitForFunction(()=>{const imgs=[...document.querySelector('.nw-motion-dialog iframe')?.contentDocument.querySelectorAll('[data-nw-stream-slot] img')||[]];return imgs.length===12&&imgs[0].naturalWidth===300&&imgs[1].naturalWidth===300&&imgs.slice(2).every(im=>im.naturalWidth===8);},{timeout:20000});
  await page.click('[data-motion-insert-group]');
  const state=await page.evaluate(()=>{const group=sec().elements.find(e=>e.nwMotionInstance?.template==='showcase-stream');if(!group)return null;const slots=sec().elements.filter(e=>e.parent===group.id&&e.nwStreamSlot);return{groupId:group.id,count:slots.length,empty:slots.filter(e=>e.nwStreamEmpty).length,assets:slots.map(e=>e.assetId),order:slots.map(e=>e.id),duration:group.nwMotionInstance.duration,textCount:sec().elements.filter(e=>e.parent===group.id&&e.type!=='image').length};});
  assert.ok(state?.groupId,'Empty slots survive insertion');
  assert.equal(state.count,12);assert.equal(state.empty,10);assert.equal(state.duration,20);assert.ok(state.textCount>=1);
  assert.equal(new Set(state.assets.slice(2)).size,1,'All blanks share one lightweight transparent asset');
  await page.evaluate(id=>NAGWEB_MOTION_LAB.edit(id),state.groupId);
  await ready();
  const after=await page.$eval('.nw-motion-dialog iframe',f=>[...f.contentDocument.querySelectorAll('[data-nw-stream-slot] img')].map(n=>n.naturalWidth));
  assert.deepEqual(after,[300,300,...Array(10).fill(8)],'Reopened composition retains replaced and empty slots');
  await page.click('[data-motion-close]');
  console.log('Animos media: card aspect shortcuts, Clear images, transparent geometry, partial reload, free text, insert/reopen and 10 remaining blanks OK');
 }finally{
  await page.evaluate(p=>{const d=document.querySelector('.nw-motion-dialog');if(d?.open)d.close();clearTimeout(previewTimer);project=JSON.parse(p.project);curPage=p.curPage;curSec=p.curSec;curEl=p.curEl;curPane=p.curPane;selection=p.selection;secFocus=p.secFocus;history=[];future=[];NAGWEB_STORY_EDITOR.setCanvasMode(p.mode);NAGWEB_STORY_TIMELINE_UI.setState(p.timeline);saveProject();renderScenes();renderPane();renderPreview();},previous);
  await fs.rm(folder,{recursive:true,force:true});
 }
}
