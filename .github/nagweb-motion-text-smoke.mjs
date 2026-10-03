import assert from 'node:assert/strict';

export async function runMotionTextSmoke(page){
 const previous=await page.evaluate(()=>({project:JSON.stringify(project),curPage,curSec,curEl,curPane,selection,secFocus,mode:NAGWEB_STORY_EDITOR.canvasMode(),timeline:NAGWEB_STORY_TIMELINE_UI.state()}));
 try{
  await page.evaluate(()=>{project.pages[0].sections=[mkSection({layout:'free',sdEnabled:false,elements:[]})];curPage=0;curSec=0;curEl=0;selection=[];secFocus=false;saveProject();renderPane();renderPreview();history=[];future=[];});
  const before=await page.evaluate(()=>({project:JSON.stringify(project),stored:localStorage.getItem(STORE_KEY)}));
  async function frame(){await page.waitForFunction(()=>document.querySelector('.nw-motion-dialog iframe')?.contentDocument?.querySelector('.hd[data-motion-text]'));return (await page.$('.nw-motion-dialog iframe')).contentFrame();}
  async function edit(f,selector,text){const n=await f.$(selector),r=await n.boundingBox();assert.ok(r);await page.mouse.click(r.x+r.width/2,r.y+r.height/2,{clickCount:2});assert.equal(await n.evaluate(n=>n.isContentEditable),true,'Double click starts editing: '+JSON.stringify(await n.evaluate(n=>{const r=n.getBoundingClientRect();return {id:n.dataset.id,hit:n.ownerDocument.elementFromPoint(r.left+r.width/2,r.top+r.height/2)?.outerHTML.slice(0,450),active:n.ownerDocument.activeElement?.outerHTML.slice(0,250)};})));await page.keyboard.type(text);return n;}
  await page.click('.tb-left [data-motion-open]');let f=await frame();
  let n=await edit(f,'.hd','Mi estudio <b>creativo</b>');
  const x=await page.$eval('[data-motion-position="x"]',n=>n.value);
  await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowLeft');assert.equal(await page.$eval('[data-motion-position="x"]',n=>n.value),x,'Arrows edit the caret, not geometry');
  await page.keyboard.press('Enter');assert.equal(await n.evaluate(n=>n.isContentEditable),false);assert.equal(await n.evaluate(n=>n.textContent),'Mi estudio <b>creativo</b>');assert.equal(await n.$('b'),null,'Typed markup remains literal text');
  assert.equal(await page.$eval('[data-motion-content="4"]',n=>n.value),'Mi estudio <b>creativo</b>');
  await page.keyboard.press('Enter');assert.equal(await n.evaluate(n=>n.isContentEditable),true,'Keyboard enters text editing');await page.keyboard.type('Descartar');await page.keyboard.press('Escape');assert.equal(await n.evaluate(n=>n.textContent),'Mi estudio <b>creativo</b>');assert.equal(await page.$eval('.nw-motion-dialog',n=>n.open),true);
  n=await edit(f,'.pg','Diseño para marcas');await page.click('[data-motion-config="duration"]');assert.equal(await n.evaluate(n=>n.isContentEditable),false);assert.equal(await page.$eval('[data-motion-content="5"]',n=>n.value),'Diseño para marcas','Blur confirms');
  await page.click('[data-motion-template="soft-orbit"]');await page.waitForFunction(()=>document.querySelector('.nw-motion-dialog iframe')?.contentDocument?.querySelector('.hd')?.textContent==='Diseño en movimiento.');
  await page.click('[data-motion-template="iso-focus"]');await page.waitForFunction(()=>document.querySelector('.nw-motion-dialog iframe')?.contentDocument?.querySelector('.hd[data-motion-text]')?.textContent==='Mi estudio <b>creativo</b>');f=await frame();assert.equal(await f.$eval('.hd',n=>n.textContent),'Mi estudio <b>creativo</b>','Template switching retains inline edits');
  assert.equal(await page.evaluate(()=>JSON.stringify(project)),before.project);assert.equal(await page.evaluate(()=>localStorage.getItem(STORE_KEY)),before.stored);assert.equal(await page.evaluate(()=>history.length),0);
  await edit(f,'.lbl','ESTUDIO PERSONAL');
  const gid=await page.evaluate(()=>NAGWEB_MOTION_LAB.insertGroup());
  const inserted=await page.evaluate(gid=>({project:JSON.stringify(project),children:sec().elements.filter(e=>e.parent===gid)}),gid);
  assert.equal(inserted.children.find(e=>e.type==='label').text,'ESTUDIO PERSONAL','Programmatic insertion confirms active edit');assert.equal(inserted.children.find(e=>e.type==='heading').text,'Mi estudio <b>creativo</b>');assert.equal(inserted.children.find(e=>e.type==='paragraph').text,'Diseño para marcas');
  await page.evaluate(()=>undo());assert.equal(await page.evaluate(()=>JSON.stringify(project)),before.project);await page.evaluate(()=>redo());assert.equal(await page.evaluate(()=>JSON.stringify(project)),inserted.project);
  await page.evaluate(gid=>NAGWEB_MOTION_LAB.edit(gid),gid);f=await frame();n=await edit(f,'.hd','Título guardado');await page.click('[data-motion-save]');
  const saved=await page.evaluate(gid=>({project:JSON.stringify(project),heading:sec().elements.find(e=>e.parent===gid&&e.type==='heading'),groups:sec().elements.filter(e=>e.nwMotionInstance).length}),gid);
  assert.equal(saved.heading.text,'Título guardado');assert.equal(saved.groups,1);assert.equal(saved.heading.id,inserted.children.find(e=>e.type==='heading').id);assert.deepEqual(saved.heading.sdKeyframes,inserted.children.find(e=>e.type==='heading').sdKeyframes);
  await page.evaluate(gid=>NAGWEB_MOTION_LAB.edit(gid),gid);f=await frame();await edit(f,'.hd','Edición sin guardar');await page.click('[data-motion-close]');assert.equal(await page.evaluate(()=>JSON.stringify(project)),saved.project,'Close discards entire draft');
  await page.evaluate(()=>undo());assert.equal(await page.evaluate(()=>JSON.stringify(project)),inserted.project);await page.evaluate(()=>redo());assert.equal(await page.evaluate(()=>JSON.stringify(project)),saved.project);
  await page.evaluate(()=>{const f=document.createElement('iframe');f.id='text-export';f.srcdoc=generateSite(flattenPage(page()),false,false,false);document.body.appendChild(f);});
  await page.waitForFunction(id=>document.querySelector('#text-export')?.contentDocument?.querySelector('[data-id="'+id+'"]')?.textContent==='Título guardado',{},saved.heading.id);
  console.log('Texto directo Motion Lab: doble clic y teclado, cursor sin mover geometría, texto seguro, Enter/Escape/blur, borradores por plantilla, inserción, guardar misma instancia, cerrar, historial y exportación OK');
 }finally{
  await page.evaluate(p=>{document.querySelector('.nw-motion-dialog').close();document.querySelector('#text-export')?.remove();clearTimeout(previewTimer);project=JSON.parse(p.project);curPage=p.curPage;curSec=p.curSec;curEl=p.curEl;curPane=p.curPane;selection=p.selection;secFocus=p.secFocus;history=[];future=[];NAGWEB_STORY_EDITOR.setCanvasMode(p.mode);NAGWEB_STORY_TIMELINE_UI.setState(p.timeline);saveProject();renderScenes();renderPane();renderPreview();},previous);
 }
}
