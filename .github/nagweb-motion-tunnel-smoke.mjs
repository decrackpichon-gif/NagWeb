import assert from 'node:assert/strict';

export async function runMotionTunnelSmoke(page){
 const previous=await page.evaluate(()=>({project:JSON.stringify(project),curPage,curSec,curEl,curPane,selection,secFocus,mode:NAGWEB_STORY_EDITOR.canvasMode(),timeline:NAGWEB_STORY_TIMELINE_UI.state()}));
 try{
  await page.evaluate(()=>{project.pages[0].sections=[mkSection({layout:'free',sdEnabled:false,elements:[]})];curPage=0;curSec=0;curEl=0;selection=[];secFocus=false;saveProject();renderPane();renderPreview();history=[];future=[];});
  const before=await page.evaluate(()=>({project:JSON.stringify(project),assets:project.assets.images.length}));
  await page.click('.tb-left [data-motion-open]');await page.click('[data-motion-template="card-tunnel"]');
  await page.waitForFunction(()=>{const f=document.querySelector('.nw-motion-dialog iframe');return f?.contentDocument?.querySelector('.hd')?.textContent==='Una nueva perspectiva.'&&f.contentWindow.__NAG_SCROLL_DIRECTOR;});
  assert.equal(await page.$eval('[data-motion-config="duration"]',n=>n.value),'12');assert.equal(await page.$eval('[data-motion-config="perspective"]',n=>n.value),'1200');
  const tunnel=await page.evaluate(()=>{
   const f=document.querySelector('.nw-motion-dialog iframe'),d=f.contentDocument,id=d.querySelector('.sc').dataset.id,rt=f.contentWindow.__NAG_SCROLL_DIRECTOR[id],nodes=[...d.querySelectorAll('.im-hov')];
   const pose=()=>nodes.map(n=>['z','rx','ry','opacity'].map(k=>n.style.getPropertyValue('--nw-sd-'+k)));
   rt.set(0);const start=pose();rt.set(1);const end=pose();rt.set(.5);
   const layers=nodes.map(n=>({id:n.dataset.id,z:+n.style.getPropertyValue('--nw-sd-z').replace('px',''),layer:+n.style.zIndex})),r=nodes[1].getBoundingClientRect(),hit=d.elementFromPoint(r.left+r.width*.8,r.top+r.height*.5)?.closest('[data-id]')?.dataset.id;
   rt.set(.999);const beforeReset=+nodes[0].style.getPropertyValue('--nw-sd-opacity');rt.set(1);const afterReset=+nodes[0].style.getPropertyValue('--nw-sd-opacity');return{start,end,layers,hit,beforeReset,afterReset};
  });
  assert.deepEqual(tunnel.start,tunnel.end,'Loop closes all poses and visibility');assert.equal(tunnel.beforeReset,0);assert.equal(tunnel.afterReset,0,'Depth reset occurs while hidden');assert.equal(tunnel.layers[1].layer,3);assert.equal(tunnel.hit,tunnel.layers[1].id,'Closest card remains in front where cards overlap');
  for(const a of tunnel.layers)for(const b of tunnel.layers)if(a.z>b.z)assert.ok(a.layer>b.layer);
  await page.$eval('[data-motion-content="4"]',n=>{n.value='Mi recorrido';n.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.click('[data-motion-template="soft-orbit"]');await page.click('[data-motion-template="card-tunnel"]');assert.equal(await page.$eval('[data-motion-content="4"]',n=>n.value),'Mi recorrido');
  assert.equal(await page.evaluate(()=>JSON.stringify(project)),before.project);await page.click('[data-motion-insert-group]');
  const saved=await page.evaluate(()=>({project:JSON.stringify(project),group:sec().elements.find(e=>e.nwMotionInstance),members:sec().elements.filter(e=>e.parent),assets:project.assets.images.length}));
  assert.equal(saved.group.nwMotionInstance.template,'card-tunnel');assert.equal(saved.group.name,'Túnel de láminas · composición');assert.equal(saved.members[4].text,'Mi recorrido');assert.equal(saved.assets,before.assets+3);assert.equal(JSON.parse(saved.project).pages[0].sections[0].sdEnabled,false);
  const models=await page.evaluate(id=>sec().elements.filter(e=>e.parent===id&&e.type==='image').map(e=>({a:NAGWEB_STORY_MODEL.evaluate(NAGWEB_STORY_MODEL.compile(e),0),b:NAGWEB_STORY_MODEL.evaluate(NAGWEB_STORY_MODEL.compile(e),1)})),saved.group.id);for(const m of models)assert.deepEqual(m.a,m.b);
  await page.evaluate(id=>NAGWEB_MOTION_LAB.edit(id),saved.group.id);await page.waitForFunction(()=>document.querySelector('.nw-motion-dialog iframe')?.contentDocument?.querySelector('.hd')?.textContent==='Mi recorrido');
  const reopened=await page.evaluate(()=>{const f=document.querySelector('.nw-motion-dialog iframe'),d=f.contentDocument,id=d.querySelector('.sc').dataset.id;f.contentWindow.__NAG_SCROLL_DIRECTOR[id].set(.5);return [...d.querySelectorAll('.im-hov')].map(n=>+n.style.zIndex);});assert.deepEqual(reopened,tunnel.layers.map(n=>n.layer));await page.click('[data-motion-close]');
  await page.evaluate(()=>undo());assert.equal(await page.evaluate(()=>JSON.stringify(project)),before.project);await page.evaluate(()=>redo());assert.equal(await page.evaluate(()=>JSON.stringify(project)),saved.project);
  await page.evaluate(()=>{const f=document.createElement('iframe');f.id='tunnel-export';f.srcdoc=generateSite(flattenPage(page()),false,false,false);document.body.append(f);});await page.waitForFunction(id=>document.getElementById('tunnel-export')?.contentWindow?.__NAG_SCROLL_DIRECTOR?.[id],{},saved.group.id);
  const exported=await page.evaluate(id=>{const f=document.getElementById('tunnel-export');f.contentWindow.__NAG_SCROLL_DIRECTOR[id].set(.5);return [...f.contentDocument.querySelector('[data-id="'+id+'"]').querySelectorAll('.im-hov')].map(n=>({z:+n.style.getPropertyValue('--nw-sd-z').replace('px',''),layer:+n.style.zIndex}));},saved.group.id);assert.deepEqual(exported,tunnel.layers.map(({z,layer})=>({z,layer})));
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await page.waitForFunction(id=>[...document.getElementById('tunnel-export').contentDocument.querySelector('[data-id="'+id+'"]').querySelectorAll('.im-hov')].every(n=>n.style.getPropertyValue('--nw-sd-z')==='0.00px'),{timeout:5000},saved.group.id);
  console.log('Túnel Motion Lab: poses y fundidos, ciclo sin salto visible, capas por profundidad y solapamiento real, borrador, inserción, reapertura, historial, exportación y movimiento reducido OK');
 }finally{
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'no-preference'}]);await page.evaluate(p=>{document.querySelector('.nw-motion-dialog').close();document.getElementById('tunnel-export')?.remove();clearTimeout(previewTimer);project=JSON.parse(p.project);curPage=p.curPage;curSec=p.curSec;curEl=p.curEl;curPane=p.curPane;selection=p.selection;secFocus=p.secFocus;history=[];future=[];NAGWEB_STORY_EDITOR.setCanvasMode(p.mode);NAGWEB_STORY_TIMELINE_UI.setState(p.timeline);saveProject();renderScenes();renderPane();renderPreview();},previous);
 }
}
