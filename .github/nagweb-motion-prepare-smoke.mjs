import assert from 'node:assert/strict';

export async function runMotionPrepareSmoke(page){
 const previous=await page.evaluate(()=>({project:JSON.stringify(project),curPage,curSec,curEl,curPane,selection,secFocus,mode:NAGWEB_STORY_EDITOR.canvasMode(),timeline:NAGWEB_STORY_TIMELINE_UI.state()}));
 try{
  await page.evaluate(()=>{
   project.pages[0].sections=[mkSection({layout:'free',sdEnabled:false,elements:[]})];curPage=0;curSec=0;curEl=0;selection=[];secFocus=false;
   project.assets.images.push({id:'prepare-image',name:'Mi imagen',data:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="480" height="620"><rect width="480" height="620" fill="tomato"/></svg>')});saveProject();renderPane();renderPreview();history=[];future=[];
  });
  const before=await page.evaluate(()=>({project:JSON.stringify(project),stored:localStorage.getItem(STORE_KEY)}));
  async function open(){
   await page.click('.tb-left [data-motion-open]');await page.waitForFunction(()=>document.querySelector('.nw-motion-dialog iframe')?.contentDocument?.querySelector('[data-motion-canvas]'));
   assert.equal(await page.$eval('[data-motion-edit-form]',n=>n.hidden),false);assert.equal(await page.$('[data-motion-save]'),null);
   const handle=await page.$('.nw-motion-dialog iframe');return handle.contentFrame();
  }
  async function change(selector,value){await page.$eval(selector,(n,v)=>{if(n.type==='checkbox')n.checked=v;else n.value=v;n.dispatchEvent(new Event('change',{bubbles:true}));},value);}
  let frame=await open();await change('[data-motion-content="3"]','Borrador descartado');
  await page.click('[data-motion-close]');assert.equal(await page.evaluate(()=>JSON.stringify(project)),before.project);assert.equal(await page.evaluate(()=>localStorage.getItem(STORE_KEY)),before.stored);
  frame=await open();
  const node=await frame.$('[data-motion-canvas].im-hov'),box=await node.boundingBox(),id=await node.evaluate(n=>n.dataset.id);
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+24,box.y+box.height/2+12,{steps:4});await page.mouse.up();
  await change('[data-motion-position="x"]','28');await change('[data-motion-width]','27');await change('[data-motion-angle]','-12');
  await change('[data-motion-content="3"]','Mi identidad');await page.select('[data-motion-content="0"]','prepare-image');await change('[data-motion-config="duration"]','3');await change('[data-motion-config="perspective"]','850');await change('[data-motion-config="loop"]',false);
  await page.waitForFunction(id=>{const f=document.querySelector('.nw-motion-dialog iframe'),n=f?.contentDocument?.querySelector('[data-id="'+id+'"]');return n?.style.left==='28%'&&n.style.width==='27%'&&n.style.getPropertyValue('--rot')==='-12deg'&&n.querySelector('img')?.getAttribute('src').includes('tomato');},{timeout:10000},id);
  assert.equal(await page.evaluate(()=>JSON.stringify(project)),before.project,'Preparing changes only the draft');assert.equal(await page.evaluate(()=>history.length),0);
  await page.click('[data-motion-insert-group]');
  const inserted=await page.evaluate(id=>({project:JSON.stringify(project),group:sec().elements.find(e=>e.nwMotionInstance),element:sec().elements.find(e=>e.id===id),text:sec().elements.find(e=>e.type==='label').text,stored:localStorage.getItem(STORE_KEY)}),id);
  assert.equal(JSON.parse(inserted.project).pages[0].sections.length,1);assert.equal(inserted.element.x,28);assert.equal(inserted.element.w,27);assert.equal(inserted.element.rot,-12);assert.equal(inserted.element.assetId,'prepare-image');assert.equal(inserted.element.parent,inserted.group.id);assert.equal(inserted.text,'Mi identidad');
  assert.deepEqual(inserted.group.nwMotionInstance,{template:'iso-focus',source:'time',duration:3,loop:false,perspective:850});assert.equal(JSON.parse(inserted.project).pages[0].sections[0].sdEnabled,false);assert.deepEqual(JSON.parse(inserted.stored),JSON.parse(inserted.project));
  await page.evaluate(id=>NAGWEB_MOTION_LAB.edit(id),inserted.group.id);assert.equal(await page.$eval('[data-motion-content="3"]',n=>n.value),'Mi identidad');await page.click('[data-motion-close]');
  await page.evaluate(()=>undo());assert.equal(await page.evaluate(()=>JSON.stringify(project)),before.project);await page.evaluate(()=>redo());assert.equal(await page.evaluate(()=>JSON.stringify(project)),inserted.project);
  // The alternative scene insertion consumes the same prepared values and source.
  await open();await change('[data-motion-content="4"]','Mi escena preparada');await change('[data-motion-config="source"]','scroll');await change('[data-motion-config="duration"]','5');await page.click('[data-motion-insert]');
  const scene=await page.evaluate(()=>sec());assert.equal(scene.elements[4].text,'Mi escena preparada');assert.equal(scene.sdEnabled,true);assert.equal(scene.nwMotionSource,'scroll');assert.equal(scene.nwMotionDuration,5);assert.ok(scene.elements.every(e=>!e.parent));assert.equal(new Set(scene.elements.map(e=>e.id)).size,6);
  await page.evaluate(()=>undo());assert.equal(await page.evaluate(()=>JSON.stringify(project)),inserted.project);
  console.log('Preparar en Motion Lab: edición antes de insertar, preview, imagen/texto/geometría/configuración, cerrar sin alterar proyecto, insertar grupo o escena, reapertura e historial OK');
 }finally{
  await page.evaluate(p=>{document.querySelector('.nw-motion-dialog').close();clearTimeout(previewTimer);project=JSON.parse(p.project);curPage=p.curPage;curSec=p.curSec;curEl=p.curEl;curPane=p.curPane;selection=p.selection;secFocus=p.secFocus;history=[];future=[];NAGWEB_STORY_EDITOR.setCanvasMode(p.mode);NAGWEB_STORY_TIMELINE_UI.setState(p.timeline);saveProject();renderScenes();renderPane();renderPreview();},previous);
 }
}
