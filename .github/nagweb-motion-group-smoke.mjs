import assert from 'node:assert/strict';

export async function runMotionGroupSmoke(page){
 const errors=[],onError=e=>errors.push(String(e));page.on('pageerror',onError);
 const previous=await page.evaluate(()=>({project:JSON.stringify(project),curPage,curSec,curEl,curPane,selection,secFocus,mode:NAGWEB_STORY_EDITOR.canvasMode(),timeline:NAGWEB_STORY_TIMELINE_UI.state()}));
 try{
  await page.evaluate(()=>{
   const s=mkSection({id:'motion-host',name:'Mi escena',layout:'free',bg:'#161822',height:100,sdEnabled:false,elements:[mkEl('heading',{id:'host-title',text:'Mi contenido',anim:'none',sdKeyframes:[{id:'h0',at:0,x:0},{id:'h1',at:100,x:100}]})]});
   project.pages[0].sections=[s];curPage=0;curSec=0;curEl=0;curPane='elements';selection=['host-title'];secFocus=false;renderPane();renderPreview();saveProject();
  });
  const before=await page.evaluate(()=>({scene:JSON.stringify(sec()),images:project.assets.images.length}));
  await page.click('.tb-left [data-motion-open]');await page.click('[data-motion-insert-group]');
  const inserted=await page.evaluate(()=>({count:page().sections.length,group:sec().elements.find(e=>e.nwMotionInstance),scene:JSON.stringify(sec()),selected:selection[0],images:project.assets.images.length}));
  const gid=inserted.group.id;assert.equal(inserted.count,1);assert.equal(JSON.parse(inserted.scene).sdEnabled,false);
  assert.deepEqual(JSON.parse(inserted.scene).elements[0],JSON.parse(before.scene).elements[0]);assert.equal(inserted.images,before.images+3);
  assert.equal(JSON.parse(inserted.scene).elements.filter(e=>e.parent===gid).length,6);
  await page.waitForFunction(id=>document.getElementById('preview')?.contentWindow?.__NAG_SCROLL_DIRECTOR?.[id],{},gid);
  assert.ok(await page.$('[data-story-field="z"]'));assert.ok(await page.$('[data-motion-edit="'+gid+'"]'));
  const pose=await page.evaluate(id=>{const e=sec().elements.find(e=>e.id===id);return JSON.stringify(e.sdKeyframes);},inserted.selected);
  await page.evaluate(id=>NAGWEB_STORY_EDITOR.canvasEdit(id,{x:42},35),inserted.selected);
  assert.equal(await page.evaluate(id=>sec().elements.find(e=>e.id===id).sdKeyframes[1].x,inserted.selected),42);
  assert.equal(await page.evaluate(()=>sec().sdEnabled),false);
  await page.evaluate(()=>undo());assert.equal(await page.evaluate(id=>JSON.stringify(sec().elements.find(e=>e.id===id).sdKeyframes),inserted.selected),pose);
  // Undo deliberately clears selection in NagWeb; select the restored member again.
  await page.evaluate(id=>{const e=sec().elements.find(e=>e.id===id);NAGWEB_STORY_EDITOR.select(id,e.sdKeyframes[1].id);},inserted.selected);

  // Reopening saves into the existing group; closing discards a draft.
  await page.click('[data-motion-edit="'+gid+'"]');
  assert.equal(await page.$eval('[data-motion-edit-form]',n=>n.closest('.nw-motion-inspector')!=null),true);
  assert.equal(await page.$eval('[data-motion-gallery-details]',n=>n.hidden),true);
  await page.waitForFunction(id=>document.querySelector('.nw-motion-dialog iframe')?.contentWindow?.__NAG_SCROLL_DIRECTOR?.[id],{},gid);
  await page.$eval('[data-motion-content="3"]',n=>{n.value='Mi marca';n.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.$eval('[data-motion-config="duration"]',n=>{n.value='2';n.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.select('[data-motion-content="0"]',JSON.parse(inserted.scene).elements[3].assetId);
  await page.click('[data-motion-save]');
  const saved=await page.evaluate(id=>({scene:JSON.stringify(sec()),count:page().sections.length,config:sec().elements.find(e=>e.id===id).nwMotionInstance,stored:JSON.parse(localStorage.getItem(STORE_KEY)).pages[0].sections[0]}),gid);
  assert.equal(saved.count,1);assert.equal(saved.config.duration,2);
  const members=JSON.parse(saved.scene).elements.filter(e=>e.parent===gid);assert.equal(members[3].text,'Mi marca');assert.equal(members[0].assetId,JSON.parse(inserted.scene).elements[3].assetId);
  assert.deepEqual(saved.stored,JSON.parse(saved.scene));
  await page.click('[data-motion-edit="'+gid+'"]');assert.equal(await page.$eval('[data-motion-content="3"]',n=>n.value),'Mi marca');
  await page.$eval('[data-motion-content="3"]',n=>{n.value='Descartar';n.dispatchEvent(new Event('change',{bubbles:true}));});await page.click('[data-motion-close]');
  assert.equal(await page.evaluate(()=>JSON.stringify(sec())),saved.scene);
  await page.evaluate(()=>undo());assert.equal(await page.evaluate(()=>JSON.stringify(sec())),inserted.scene);
  await page.evaluate(()=>redo());assert.equal(await page.evaluate(()=>JSON.stringify(sec())),saved.scene);
  const second=await page.evaluate(()=>NAGWEB_MOTION_LAB.insertGroup());assert.notEqual(second,gid);
  assert.equal(await page.evaluate(()=>page().sections.length),1);await page.evaluate(()=>undo());

  // Director owns the host track; each group owns its own members and clock.
  await page.evaluate(()=>{sec().sdEnabled=true;renderPreview();const f=document.createElement('iframe');f.id='group-export';f.style.cssText='position:fixed;top:0;left:0;z-index:999999;width:900px;height:600px';f.srcdoc=generateSite(flattenPage(page()),false,false,false);document.body.append(f);});
  await page.waitForFunction(id=>document.getElementById('group-export')?.contentWindow?.__NAG_SCROLL_DIRECTOR?.[id],{},gid);
  const independent=await page.evaluate(id=>{
   const f=document.getElementById('group-export'),r=f.contentWindow.__NAG_SCROLL_DIRECTOR,d=f.contentDocument;
   r['motion-host'].set(1);r[id].set(0);
   const g=d.querySelector('[data-id="'+id+'"]');return{host:d.querySelector('[data-id="host-title"]').style.getPropertyValue('--nw-sd-x'),z:g.querySelector('[data-nw-sd-el]').style.getPropertyValue('--nw-sd-z'),stages:g.querySelectorAll('.nw-sd-stage').length,rootAnimated:g.hasAttribute('data-nw-sd-el'),images:g.querySelectorAll('img').length};
  },gid);
  assert.deepEqual(independent,{host:'100.00px',z:'-320.00px',stages:0,rootAnimated:false,images:3});
  await page.evaluate(id=>document.getElementById('group-export').contentWindow.__NAG_SCROLL_DIRECTOR[id].live(),gid);
  await page.waitForFunction(id=>document.getElementById('group-export').contentWindow.__NAG_SCROLL_DIRECTOR[id].progress()>.1,{},gid);
  assert.equal(await page.evaluate(()=>document.getElementById('group-export').contentWindow.__NAG_SCROLL_DIRECTOR['motion-host'].progress()),1);
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  try{await page.waitForFunction(id=>document.getElementById('group-export').contentDocument.querySelector('[data-id="'+id+'"] [data-nw-sd-el]').style.getPropertyValue('--nw-sd-z')==='0.00px',{timeout:5000},gid);}catch(e){
   const diagnostic=await page.evaluate(id=>{const f=document.getElementById('group-export'),g=f.contentDocument.querySelector('[data-id="'+id+'"]'),n=g.querySelector('[data-nw-sd-el]');return{media:f.contentWindow.matchMedia('(prefers-reduced-motion:reduce)').matches,progress:f.contentWindow.__NAG_SCROLL_DIRECTOR[id].progress(),z:n.style.getPropertyValue('--nw-sd-z'),classes:g.className,parent:g.closest('.sc')?.dataset.id};},gid);
   throw new Error('Group reduced motion: '+JSON.stringify({diagnostic,errors}));
  }
  console.log('Grupos Motion Lab: inserción en escena existente, poses por instancia, reapertura, contenido, guardado, cancelación, historial, IDs y exportación junto al Director OK');
 }finally{
  page.off('pageerror',onError);
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'no-preference'}]);
  await page.evaluate(p=>{document.querySelector('.nw-motion-dialog').close();document.getElementById('group-export')?.remove();clearTimeout(previewTimer);project=JSON.parse(p.project);curPage=p.curPage;curSec=p.curSec;curEl=p.curEl;curPane=p.curPane;selection=p.selection;secFocus=p.secFocus;history=[];future=[];NAGWEB_STORY_EDITOR.setCanvasMode(p.mode);NAGWEB_STORY_TIMELINE_UI.setState(p.timeline);saveProject();renderScenes();renderPane();renderPreview();},previous);
 }
}
