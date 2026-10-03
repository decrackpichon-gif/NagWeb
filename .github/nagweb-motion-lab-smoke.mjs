import assert from 'node:assert/strict';

export async function runMotionLabSmoke(page){
 const viewport=page.viewport();
 const previous=await page.evaluate(()=>({project:JSON.stringify(project),curPage,curSec,curEl,curPane,selection,secFocus,canvasMode:NAGWEB_STORY_EDITOR.canvasMode(),timeline:NAGWEB_STORY_TIMELINE_UI.state()}));
 try{
  await page.click('.tb-left [data-motion-open]');
  await page.waitForFunction(()=>document.querySelector('.nw-motion-dialog[open] iframe')?.contentWindow?.__NAG_SCROLL_DIRECTOR);
  const layout=await page.evaluate(()=>{
   const r=s=>document.querySelector(s).getBoundingClientRect(),a=r('.nw-motion-library'),b=r('.nw-motion-stage'),c=r('.nw-motion-inspector'),f=r('.nw-motion-frame'),t=r('.nw-motion-controls');
   return{columns:a.right<=b.left+1&&b.right<=c.left+1,stageWidth:b.width,libraryWidth:a.width,inspectorWidth:c.width,playbackBelow:t.top>=f.bottom-3,previewHeight:f.height};
  });
  assert.equal(layout.columns,true);assert.ok(layout.stageWidth>layout.libraryWidth&&layout.stageWidth>layout.inspectorWidth);assert.equal(layout.playbackBelow,true);assert.ok(layout.previewHeight>450);
  assert.equal(await page.evaluate(()=>JSON.stringify(project)),previous.project,'Browsing must not change the project');
  const preview=await page.evaluate(()=>{
   const f=document.querySelector('.nw-motion-dialog iframe'),w=f.contentWindow,d=w.__NAG_SCROLL_DIRECTOR,id=Object.keys(d)[0],n=f.contentDocument.querySelector('[data-nw-sd-el]');
   d[id].set(0);const first=n.style.getPropertyValue('--nw-sd-z');d[id].set(.5);const middle=n.style.getPropertyValue('--nw-sd-z');d[id].set(1);return{first,middle,last:n.style.getPropertyValue('--nw-sd-z'),images:f.contentDocument.querySelectorAll('img').length};
  });
  assert.equal(preview.first,'-320.00px');assert.equal(preview.middle,'0.00px');assert.equal(preview.last,'-320.00px');assert.ok(preview.images>=3);
  await page.click('[data-motion-play]');await page.waitForFunction(()=>document.querySelector('[data-motion-now]').textContent!=='50%');
  assert.equal(await page.$eval('[data-motion-play]',n=>n.getAttribute('aria-pressed')),'true');
  await page.click('[data-motion-play]');assert.equal(await page.$eval('[data-motion-play]',n=>n.getAttribute('aria-pressed')),'false');
  await page.click('[data-motion-close]');assert.equal(await page.evaluate(()=>JSON.stringify(project)),previous.project);

  await page.click('.tb-left [data-motion-open]');await page.click('[data-motion-insert]');
  const inserted=await page.evaluate(()=>({project:JSON.stringify(project),scene:sec(),selected:selection,mode:NAGWEB_STORY_EDITOR.canvasMode(),docked:NAGWEB_STORY_TIMELINE_UI.state().docked,stored:localStorage.getItem(STORE_KEY)}));
  const old=JSON.parse(previous.project),next=JSON.parse(inserted.project);
  assert.equal(next.pages[previous.curPage].sections.length,old.pages[previous.curPage].sections.length+1);
  assert.deepEqual(next.pages[previous.curPage].sections.filter(s=>s.id!==inserted.scene.id),old.pages[previous.curPage].sections);
  assert.equal(inserted.scene.sdMotionTemplate,'iso-focus');assert.equal(inserted.scene.sdEnabled,false);assert.equal(inserted.scene.nwMotionSource,'time');
  assert.equal(inserted.scene.elements.length,6);assert.equal(inserted.scene.elements.filter(e=>e.type==='image').length,3);
  assert.ok(inserted.scene.elements.slice(0,3).every(e=>e.sdKeyframes.length===4&&e.assetId));
  assert.equal(next.assets.images.length,old.assets.images.length+3);assert.equal(inserted.mode,'moment');assert.equal(inserted.docked,true);
  assert.equal(JSON.parse(inserted.stored).pages[previous.curPage].sections[previous.curSec+1].id,inserted.scene.id);
  assert.ok(await page.$('[data-story-field="z"]'));
  await page.waitForFunction(id=>document.getElementById('preview')?.contentWindow?.__NAG_SCROLL_DIRECTOR?.[id],{},inserted.scene.id);
  // A normal keyframe edit changes only its selected moment, never a closed widget.
  await page.focus('[data-story-field="z"]');await page.keyboard.down('Control');await page.keyboard.press('a');await page.keyboard.up('Control');await page.keyboard.type('120');await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>sec().elements[1].sdKeyframes[1].z),120);
  assert.equal(await page.evaluate(()=>sec().elements[1].sdKeyframes[0].z),-160);
  await page.evaluate(()=>undo());assert.equal(await page.evaluate(()=>sec().elements[1].sdKeyframes[1].z),0);
  await page.evaluate(()=>undo());assert.equal(await page.evaluate(()=>JSON.stringify(project)),previous.project,'Undo removes scene and its sample assets');
  await page.evaluate(()=>redo());assert.equal(await page.evaluate(()=>JSON.stringify(project)),inserted.project);

  const repeated=await page.evaluate(()=>{
   const id=NAGWEB_MOTION_LAB.insert(),ids=page().sections.flatMap(s=>[s.id,...s.elements.map(e=>e.id)]);return{id,unique:new Set(ids).size===ids.length};
  });
  assert.notEqual(repeated.id,inserted.scene.id);assert.equal(repeated.unique,true);await page.evaluate(()=>undo());
  await page.evaluate(()=>{const f=document.createElement('iframe');f.id='motion-export';f.srcdoc=generateSite(flattenPage(page()),false,false,false);document.body.append(f);});
  await page.waitForFunction(id=>document.getElementById('motion-export')?.contentWindow?.__NAG_SCROLL_DIRECTOR?.[id],{},inserted.scene.id);
  const exported=await page.evaluate(id=>{
   const f=document.getElementById('motion-export');f.contentWindow.__NAG_SCROLL_DIRECTOR[id].set(0);
   const s=f.contentDocument.querySelector('[data-id="'+id+'"]');return{images:s.querySelectorAll('img').length,z:s.querySelector('[data-nw-sd-el]').style.getPropertyValue('--nw-sd-z')};
  },inserted.scene.id);
  assert.equal(exported.images,3);assert.equal(exported.z,'-320.00px');
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  await page.evaluate(()=>NAGWEB_MOTION_LAB.open());
  assert.ok(await page.evaluate(()=>{const r=document.querySelector('.nw-motion-dialog').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.height<=innerHeight;}));
  assert.ok(await page.evaluate(()=>{const d=document.querySelector('.nw-motion-dialog'),r=s=>d.querySelector(s).getBoundingClientRect(),a=r('.nw-motion-library'),b=r('.nw-motion-stage'),c=r('.nw-motion-inspector');return a.bottom<=b.top+1&&b.bottom<=c.top+1&&d.scrollWidth<=d.clientWidth+2;}));
  await page.click('[data-motion-close]');
  console.log('Motion Lab: acceso visible, preview compartido, reproducción, inserción sin pérdida, momentos editables, guardado, Undo/Redo, IDs únicos, export y móvil OK');
 }finally{
  await page.setViewport(viewport);
  await page.evaluate(p=>{
   document.querySelector('.nw-motion-dialog').close();document.getElementById('motion-export')?.remove();clearTimeout(previewTimer);project=JSON.parse(p.project);
   curPage=p.curPage;curSec=p.curSec;curEl=p.curEl;curPane=p.curPane;selection=p.selection;secFocus=p.secFocus;history=[];future=[];
   NAGWEB_STORY_EDITOR.setCanvasMode(p.canvasMode);NAGWEB_STORY_TIMELINE_UI.setState(p.timeline);
   localStorage.setItem('nagweb.story.timeline.ui.v1',JSON.stringify(p.timeline));saveProject();renderScenes();renderPane();renderPreview();
  },previous);
 }
}
