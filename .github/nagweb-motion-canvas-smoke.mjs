import assert from 'node:assert/strict';

export async function runMotionCanvasSmoke(page){
 const previous=await page.evaluate(()=>({project:JSON.stringify(project),curPage,curSec,curEl,curPane,selection,secFocus,mode:NAGWEB_STORY_EDITOR.canvasMode(),timeline:NAGWEB_STORY_TIMELINE_UI.state()}));
 const errors=[],onError=e=>errors.push(String(e));page.on('pageerror',onError);
 try{
  const fixture=await page.evaluate(()=>{
   project.pages[0].sections=[mkSection({layout:'free',sdEnabled:false,elements:[]})];curPage=0;curSec=0;curEl=0;selection=[];secFocus=false;
   const gid=NAGWEB_MOTION_LAB.insertGroup(),e=sec().elements.find(e=>e.parent===gid&&e.type==='image'&&e.x===50);
   return {gid,id:e.id,element:JSON.parse(JSON.stringify(e)),scene:JSON.stringify(sec())};
  });
  async function open(){
   await page.evaluate(id=>NAGWEB_MOTION_LAB.edit(id),fixture.gid);
   await page.waitForFunction(id=>document.querySelector('.nw-motion-dialog iframe')?.contentDocument?.querySelector('[data-id="'+id+'"][data-motion-canvas]'),{},fixture.id);
   const handle=await page.$('.nw-motion-dialog iframe');return handle.contentFrame();
  }
  async function drag(frame,dx,dy){
   const node=await frame.$('[data-id="'+fixture.id+'"]'),box=await node.boundingBox();assert.ok(box);
   const size=await node.evaluate(n=>({w:n.offsetParent.clientWidth,h:n.offsetParent.clientHeight}));
   await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+dx,box.y+box.height/2+dy,{steps:5});await page.mouse.up();return size;
  }
  let frame=await open();await drag(frame,36,24);
  assert.match(await page.$eval('[data-motion-selection]',n=>n.textContent),/Lámina 2/);
  assert.ok(await frame.$('[data-id="'+fixture.id+'"].nw-motion-selected'));
  assert.equal(await page.evaluate(()=>JSON.stringify(sec())),fixture.scene,'Draft must not write project');
  await page.click('[data-motion-close]');assert.equal(await page.evaluate(()=>JSON.stringify(sec())),fixture.scene,'Close discards position draft');
  frame=await open();const size=await drag(frame,36,24);
  const xy=await page.$$eval('[data-motion-position]',nodes=>nodes.map(n=>n.valueAsNumber));
  assert.ok(Math.abs(xy[0]-(50+36/size.w*100))<.02);assert.ok(Math.abs(xy[1]-(55+24/size.h*100))<.02);
  // Native pointer cancellation restores the gesture's initial draft position.
  const node=await frame.$('[data-id="'+fixture.id+'"]'),box=await node.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+20,box.y+box.height/2+10);
  await node.evaluate(n=>n.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:1})));await page.mouse.up();
  assert.deepEqual(await page.$$eval('[data-motion-position]',nodes=>nodes.map(n=>n.valueAsNumber)),xy);
  await page.keyboard.press('ArrowRight');
  assert.ok((await page.$eval('[data-motion-position="x"]',n=>n.valueAsNumber))>xy[0]);
  await page.$eval('[data-motion-position="x"]',n=>{n.value='62';n.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.$eval('[data-motion-position="y"]',n=>{n.value='58';n.dispatchEvent(new Event('change',{bubbles:true}));});
  // Content reload keeps the selected member and current preview moment.
  await page.$eval('[data-motion-progress]',n=>{n.value='72';n.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.$eval('[data-motion-config="duration"]',n=>{n.value='3';n.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.waitForFunction(id=>{const f=document.querySelector('.nw-motion-dialog iframe'),n=f?.contentDocument?.querySelector('[data-id="'+id+'"].nw-motion-selected');return n&&n.style.left==='62%'&&f.contentWindow.__NAG_SCROLL_DIRECTOR?.[f.contentDocument.querySelector('.sc').dataset.id]?.progress()===.72;},{timeout:10000},fixture.id);
  await page.click('[data-motion-save]');
  const saved=await page.evaluate(id=>({scene:JSON.stringify(sec()),e:sec().elements.find(e=>e.id===id),stored:JSON.parse(localStorage.getItem(STORE_KEY)).pages[0].sections[0]}),fixture.id);
  assert.equal(saved.e.x,62);assert.equal(saved.e.y,58);assert.deepEqual(saved.e.sdKeyframes,fixture.element.sdKeyframes);assert.deepEqual(saved.e.mobile,fixture.element.mobile);assert.equal(saved.e.parent,fixture.gid);
  assert.equal(JSON.parse(saved.scene).elements.filter(e=>e.nwMotionInstance).length,1);assert.equal(JSON.parse(saved.scene).sdEnabled,false);assert.deepEqual(saved.stored,JSON.parse(saved.scene));
  await page.evaluate(()=>undo());assert.equal(await page.evaluate(()=>JSON.stringify(sec())),fixture.scene);
  await page.evaluate(()=>redo());assert.equal(await page.evaluate(()=>JSON.stringify(sec())),saved.scene);
  frame=await open();await drag(frame,0,0);assert.equal(await page.$eval('[data-motion-position="x"]',n=>n.value),'62');
  await page.click('[data-motion-close]');assert.deepEqual(errors,[]);
  console.log('Lienzo Motion Lab: arrastre real, selección, cancelar gesto, teclado, posición numérica, momento conservado, guardar sin duplicar, cerrar, historial y keyframes intactos OK');
 }finally{
  page.off('pageerror',onError);
  await page.evaluate(p=>{document.querySelector('.nw-motion-dialog').close();clearTimeout(previewTimer);project=JSON.parse(p.project);curPage=p.curPage;curSec=p.curSec;curEl=p.curEl;curPane=p.curPane;selection=p.selection;secFocus=p.secFocus;history=[];future=[];NAGWEB_STORY_EDITOR.setCanvasMode(p.mode);NAGWEB_STORY_TIMELINE_UI.setState(p.timeline);saveProject();renderScenes();renderPane();renderPreview();},previous);
 }
}
