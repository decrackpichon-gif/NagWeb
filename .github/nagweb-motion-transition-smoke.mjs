import assert from 'node:assert/strict';

function readPose({selector,id,gid,progress}){
 const f=document.querySelector(selector),d=f.contentDocument,n=d.querySelector('[data-id="'+id+'"]');
 const clock=f.contentWindow.__NAG_SCROLL_DIRECTOR[gid||d.querySelector('.sc').dataset.id];
 if(progress!=null)clock.set(progress);
 const cs=f.contentWindow.getComputedStyle(n);
 return {vars:['x','y','scale','rot','opacity','blur','z','rx','ry'].map(k=>n.style.getPropertyValue('--nw-sd-'+k)),base:[n.style.left,n.style.top,n.style.width,n.style.getPropertyValue('--rot')],opacity:+cs.opacity,filter:cs.filter,rotate:cs.rotate,scale:cs.scale,translate:cs.translate};
}
export async function runMotionTransitionSmoke(page){
 const previous=await page.evaluate(()=>({project:JSON.stringify(project),curPage,curSec,curEl,curPane,selection,secFocus,mode:NAGWEB_STORY_EDITOR.canvasMode(),timeline:NAGWEB_STORY_TIMELINE_UI.state()}));
 try{
  await page.evaluate(()=>{project.pages[0].sections=[mkSection({layout:'free',sdEnabled:false,elements:[]})];curPage=0;curSec=0;curEl=0;selection=[];secFocus=false;saveProject();renderPane();renderPreview();history=[];future=[];});
  const before=await page.evaluate(()=>({project:JSON.stringify(project),stored:localStorage.getItem(STORE_KEY),factory:NAGWEB_MOTION_LAB.create().scene.elements}));
  async function frame(){await page.waitForFunction(()=>document.querySelector('.nw-motion-dialog iframe')?.contentDocument?.querySelector('.im-hov[data-motion-canvas]'));return (await page.$('.nw-motion-dialog iframe')).contentFrame();}
  async function select(id){const f=await frame(),n=await f.$(id?'[data-id="'+id+'"]':'.im-hov');await n.focus();await page.keyboard.press('Space');return n.evaluate(n=>n.dataset.id);}
  async function moment(at){const id=await page.$eval('[data-motion-key]',(n,at)=>[...n.options].find(o=>o.textContent===at+'%').value,at);await page.select('[data-motion-key]',id);}
  async function change(key,value){await page.$eval('[data-motion-key-property="'+key+'"]',(n,v)=>{n.value=String(v);n.dispatchEvent(new Event('change',{bubbles:true}));},value);}
  async function pose(id,progress){return page.evaluate(readPose,{selector:'.nw-motion-dialog iframe',id,progress});}
  const values={x:40,y:-25,scale:80,rotate:-12,opacity:55,blur:3};
  await page.click('.tb-left [data-motion-open]');const id=await select();await moment(0);const original=await pose(id,0);
  await page.click('[data-motion-key-more] summary');assert.equal(await page.$eval('[data-motion-key-more]',n=>n.open),true);
  for(const [key,value] of Object.entries(values))await change(key,value);
  const cinematic=await pose(id,.105);assert.equal(cinematic.vars[0],'35.68px','Default outgoing cinematic easing still applies');
  await page.select('[data-motion-key-ease]','linear');
  const linear=await pose(id,.105),expected=['28.00px','-17.50px','0.8600','-8.40deg','0.6850','2.10px','-224.00px','22.40deg','-28.00deg'];
  assert.deepEqual(linear.vars,expected,'Linear transition evaluates all nine properties at 30% of the first segment');assert.deepEqual(linear.base,original.base,'Base geometry remains separate');assert.notDeepEqual(linear.vars,cinematic.vars);
  assert.ok(Math.abs(linear.opacity-.685)<.00001);assert.ok(linear.filter.includes('blur(2.1px)'));assert.equal(linear.rotate,'-8.4deg');assert.equal(linear.scale,'0.86');assert.equal(linear.translate,'28px -17.5px');
  await moment(35);assert.equal(await page.$eval('[data-motion-key-ease]',n=>n.value),'cinematic');const neutral=await pose(id,.35);assert.deepEqual(neutral.vars,['0.00px','0.00px','1.0000','0.00deg','1.0000','0.00px','0.00px','0.00deg','0.00deg']);
  await moment(100);assert.equal(await page.$eval('[data-motion-key-ease]',n=>n.disabled),true,'No outgoing transition after final moment');await moment(0);
  await change('blur',-2);assert.equal(await page.$eval('[data-motion-key-property="blur"]',n=>n.valueAsNumber),0,'Model limits are respected');await change('blur',3);
  await page.click('[data-motion-template="soft-orbit"]');await page.waitForFunction(()=>document.querySelector('.nw-motion-dialog iframe')?.contentDocument?.querySelector('.hd')?.textContent==='Diseño en movimiento.');await page.click('[data-motion-template="iso-focus"]');await page.waitForFunction(id=>document.querySelector('.nw-motion-dialog iframe')?.contentDocument?.querySelector('[data-id="'+id+'"].nw-motion-selected'),{},id);
  const fields=await page.$$eval('[data-motion-key-property]',ns=>Object.fromEntries(ns.map(n=>[n.dataset.motionKeyProperty,n.valueAsNumber])));for(const [k,v] of Object.entries(values))assert.equal(fields[k],v);assert.equal(await page.$eval('[data-motion-key-ease]',n=>n.value),'linear');
  assert.equal(await page.evaluate(()=>JSON.stringify(project)),before.project);assert.equal(await page.evaluate(()=>localStorage.getItem(STORE_KEY)),before.stored);assert.equal(await page.evaluate(()=>history.length),0);
  await page.click('[data-motion-insert-group]');
  const inserted=await page.evaluate(id=>({project:JSON.stringify(project),group:sec().elements.find(e=>e.nwMotionInstance),element:sec().elements.find(e=>e.id===id),images:sec().elements.filter(e=>e.type==='image')}),id);
  const strip=keys=>keys.map(({id,...k})=>k),expectedFrames=strip(before.factory[0].sdKeyframes);expectedFrames[0]={...expectedFrames[0],...values,ease:'linear'};assert.deepEqual(strip(inserted.element.sdKeyframes),expectedFrames);for(let i=1;i<3;i++)assert.deepEqual(strip(inserted.images[i].sdKeyframes),strip(before.factory[i].sdKeyframes));
  await page.evaluate(gid=>NAGWEB_MOTION_LAB.edit(gid),inserted.group.id);await select(id);await moment(0);assert.equal(await page.$eval('[data-motion-key-ease]',n=>n.value),'linear');for(const [key,value] of Object.entries(values))assert.equal(await page.$eval('[data-motion-key-property="'+key+'"]',n=>n.valueAsNumber),value);
  await change('opacity',60);await change('blur',2);await page.click('[data-motion-save]');
  const saved=await page.evaluate(id=>({project:JSON.stringify(project),element:sec().elements.find(e=>e.id===id),groups:sec().elements.filter(e=>e.nwMotionInstance).length}),id);const finalElement=structuredClone(inserted.element);finalElement.sdKeyframes[0].opacity=60;finalElement.sdKeyframes[0].blur=2;assert.deepEqual(saved.element,finalElement);assert.equal(saved.groups,1);
  await page.evaluate(gid=>NAGWEB_MOTION_LAB.edit(gid),inserted.group.id);await select(id);await moment(0);await change('scale',40);await page.select('[data-motion-key-ease]','ease-in');await page.click('[data-motion-close]');assert.equal(await page.evaluate(()=>JSON.stringify(project)),saved.project);
  await page.evaluate(()=>undo());assert.equal(await page.evaluate(()=>JSON.stringify(project)),inserted.project);await page.evaluate(()=>redo());assert.equal(await page.evaluate(()=>JSON.stringify(project)),saved.project);
  await page.evaluate(()=>{const f=document.createElement('iframe');f.id='transition-export';f.srcdoc=generateSite(flattenPage(page()),false,false,false);document.body.append(f);});await page.waitForFunction(gid=>document.querySelector('#transition-export')?.contentWindow?.__NAG_SCROLL_DIRECTOR?.[gid],{},inserted.group.id);
  const exported=await page.evaluate(readPose,{selector:'#transition-export',id,gid:inserted.group.id,progress:.105}),savedExpected=[...expected];savedExpected[4]='0.7200';savedExpected[5]='1.40px';assert.deepEqual(exported.vars,savedExpected);assert.ok(Math.abs(exported.opacity-.72)<.00001);assert.ok(exported.filter.includes('blur(1.4px)'));assert.equal(exported.rotate,linear.rotate);assert.equal(exported.scale,linear.scale);assert.equal(exported.translate,linear.translate);
  console.log('Transiciones Motion Lab: nueve propiedades renderizadas, easing saliente e interpolación, geometría base, límites, borradores, inserción/guardado/cancelar, historial y HTML exportado OK');
 }finally{
  await page.evaluate(p=>{document.querySelector('.nw-motion-dialog').close();document.querySelector('#transition-export')?.remove();clearTimeout(previewTimer);project=JSON.parse(p.project);curPage=p.curPage;curSec=p.curSec;curEl=p.curEl;curPane=p.curPane;selection=p.selection;secFocus=p.secFocus;history=[];future=[];NAGWEB_STORY_EDITOR.setCanvasMode(p.mode);NAGWEB_STORY_TIMELINE_UI.setState(p.timeline);saveProject();renderScenes();renderPane();renderPreview();},previous);
 }
}
