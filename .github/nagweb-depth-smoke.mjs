import assert from 'node:assert/strict';

export async function runDepthSmoke(page){
 const previous=await page.evaluate(()=>({project:JSON.stringify(project),curPage,curSec,curEl,curPane,selection,secFocus}));
 try{
  await page.evaluate(()=>{
   const s=JSON.parse(JSON.stringify(sec()));s.id='depth-scene';s.layout='free';s.sdEnabled=true;s.sdEase='linear';s.sdLength=300;s.sdPerspective=1000;s.stType='cut';
   const frames=[{id:'depth-zero',at:0,z:0,rotateX:0,rotateY:0,ease:'linear'},{id:'depth-full',at:100,z:200,rotateX:40,rotateY:-30,rotate:20,ease:'linear'}];
   s.elements=[
    mkEl('heading',{id:'depth-text',text:'Profundidad',x:30,y:40,w:40,rot:12,anim:'none',sdKeyframes:frames}),
    mkEl('container',{id:'depth-universal',universal:true,w:80,h:360,ucFx:'depth',ucDepth:40,sdEnter:'none',sdEnd:100}),
    mkEl('paragraph',{id:'depth-child',parent:'depth-universal',text:'Hijo con profundidad',x:30,y:30,w:40,ucReaction:'depth',ucStrength:100,anim:'none',sdKeyframes:frames})
   ];
   project.pages[0].sections=[s];curPage=0;curSec=0;curEl=0;curPane='elements';selection=['depth-text'];secFocus=false;
   renderPane();renderPreview();saveProject();NAGWEB_STORY_EDITOR.select('depth-text','depth-full');
   const f=document.createElement('iframe');f.id='depth-export';f.style.cssText='border:0;width:1000px;height:600px';
   f.srcdoc=generateSite(flattenPage(page()),false,false,false);document.body.append(f);
  });
  for(const field of ['z','rotateX','rotateY'])assert.ok(await page.$('[data-story-field="'+field+'"]'));
  await page.waitForFunction(()=>document.getElementById('depth-export')?.contentWindow?.__NAG_SCROLL_DIRECTOR?.['depth-scene']&&document.getElementById('preview')?.contentWindow?.__NAG_SCROLL_DIRECTOR?.['depth-scene']);
  const baseline=await page.evaluate(()=>{
   const f=document.getElementById('depth-export'),w=f.contentWindow,n=f.contentDocument.querySelector('[data-id="depth-text"]');
   w.__NAG_SCROLL_DIRECTOR['depth-scene'].set(0);
   return{transform:w.getComputedStyle(n).transform,inline:n.style.transform,count:n.getAnimations().length};
  });
  assert.equal(baseline.count,0);
  const result=await page.evaluate(base=>{
   const f=document.getElementById('depth-export'),w=f.contentWindow,d=f.contentDocument,n=d.querySelector('[data-id="depth-text"]');
   w.__NAG_SCROLL_DIRECTOR['depth-scene'].set(.5);
   const probe=d.createElement('i');probe.style.transform='perspective(1000px) translateZ(100px) rotateX(20deg) rotateY(-15deg)';d.body.append(probe);
   const expected=new w.DOMMatrix(base).multiply(new w.DOMMatrix(w.getComputedStyle(probe).transform));probe.remove();
   const actual=new w.DOMMatrix(w.getComputedStyle(n).transform);
   const entries=['m11','m12','m13','m14','m21','m22','m23','m24','m31','m32','m33','m34','m41','m42','m43','m44'];
   const child=d.querySelector('[data-id="depth-child"]');
   return{
    error:Math.max(...entries.map(k=>Math.abs(actual[k]-expected[k]))),
    z:n.style.getPropertyValue('--nw-sd-z'),rx:n.style.getPropertyValue('--nw-sd-rx'),ry:n.style.getPropertyValue('--nw-sd-ry'),
    inline:n.style.transform,count:n.getAnimations().length,paused:n.getAnimations()[0]?.playState,
    childZ:child.style.getPropertyValue('--nw-sd-z'),childTransform:w.getComputedStyle(child).transform
   };
  },baseline.transform);
  assert.ok(result.error<.001,'Additive depth must preserve authored transform: '+JSON.stringify(result));
  assert.equal(result.z,'100.00px');assert.equal(result.rx,'20.00deg');assert.equal(result.ry,'-15.00deg');
  assert.equal(result.inline,baseline.inline);assert.equal(result.count,1);assert.equal(result.paused,'paused');
  assert.equal(result.childZ,'100.00px');assert.ok(result.childTransform.startsWith('matrix3d'));
  const repeated=await page.evaluate(()=>{
   const f=document.getElementById('depth-export'),w=f.contentWindow,n=f.contentDocument.querySelector('[data-id="depth-text"]');
   for(const p of [.1,.4,.75,.25,.5])w.__NAG_SCROLL_DIRECTOR['depth-scene'].set(p);
   return n.getAnimations().length;
  });
  assert.equal(repeated,1,'Scrubbing must reuse one paused renderer');

  // Real inspector edit updates preview and persisted data, then Undo/Redo restores it.
  await page.focus('[data-story-field="z"]');await page.keyboard.down('Control');await page.keyboard.press('a');await page.keyboard.up('Control');await page.keyboard.type('240');await page.keyboard.press('Tab');
  await page.waitForFunction(()=>document.getElementById('preview')?.contentDocument?.querySelector('[data-id="depth-text"]')?.style.getPropertyValue('--nw-sd-z')==='240.00px');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(STORE_KEY)).pages[0].sections[0].elements[0].sdKeyframes[1].z),240);
  await page.evaluate(()=>undo());assert.equal(await page.evaluate(()=>sec().elements[0].sdKeyframes[1].z),200);
  await page.evaluate(()=>redo());assert.equal(await page.evaluate(()=>sec().elements[0].sdKeyframes[1].z),240);

  await page.evaluate(()=>{selection=['depth-text'];curEl=0;renderPane();});
  await page.waitForFunction(()=>document.getElementById('preview')?.contentDocument?.querySelector('[data-id="depth-text"]')?.style.getPropertyValue('--nw-sd-z')==='240.00px');
  await page.click('[data-sd-play="depth-scene"]');
  await page.waitForFunction(()=>NAGWEB_SCROLL_DIRECTOR.progress('depth-scene')>5);
  const playing=await page.evaluate(()=>({p:NAGWEB_SCROLL_DIRECTOR.progress('depth-scene'),z:parseFloat(document.getElementById('preview').contentDocument.querySelector('[data-id="depth-text"]').style.getPropertyValue('--nw-sd-z'))}));
  assert.ok(Math.abs(playing.z-playing.p*2.4)<3,'Playback must use the depth evaluator');
  await page.evaluate(()=>{
   NAGWEB_SCROLL_DIRECTOR.live('depth-scene');
   const w=document.getElementById('preview').contentWindow,n=w.document.querySelector('[data-id="depth-scene"]');
   w.scrollTo(0,n.getBoundingClientRect().top+w.scrollY+(n.offsetHeight-w.innerHeight)*.5);
  });
  await page.waitForFunction(()=>Math.abs(NAGWEB_SCROLL_DIRECTOR.progress('depth-scene')-50)<.1);
  assert.ok(Math.abs(await page.evaluate(()=>parseFloat(document.getElementById('preview').contentDocument.querySelector('[data-id="depth-text"]').style.getPropertyValue('--nw-sd-z')))-120)<1);

  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  await page.waitForFunction(()=>document.getElementById('depth-export').contentDocument.querySelector('[data-id="depth-text"]').getAnimations().length===0);
  const reduced=await page.evaluate(()=>{
   const f=document.getElementById('depth-export'),w=f.contentWindow,n=f.contentDocument.querySelector('[data-id="depth-text"]');
   return{transform:w.getComputedStyle(n).transform,z:n.style.getPropertyValue('--nw-sd-z'),rx:n.style.getPropertyValue('--nw-sd-rx'),ry:n.style.getPropertyValue('--nw-sd-ry')};
  });
  assert.equal(reduced.transform,baseline.transform);assert.equal(reduced.z,'0.00px');assert.equal(reduced.rx,'0.00deg');assert.equal(reduced.ry,'0.00deg');
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'no-preference'}]);
  await page.waitForFunction(()=>document.getElementById('depth-export').contentDocument.querySelector('[data-id="depth-text"]').getAnimations().length===1);
  await page.evaluate(()=>document.getElementById('depth-export').contentWindow.__NAG_SCROLL_DIRECTOR['depth-scene'].set(0));
  assert.equal(await page.evaluate(()=>document.getElementById('depth-export').contentDocument.querySelector('[data-id="depth-text"]').getAnimations().length),0);
  console.log('Profundidad visible: matrices, diseño base, Universal, inspector, guardado, Undo/Redo, scrub, export y movimiento reducido OK');
 }finally{
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'no-preference'}]);
  await page.evaluate(previous=>{
   document.getElementById('depth-export')?.remove();clearTimeout(previewTimer);project=JSON.parse(previous.project);
   curPage=previous.curPage;curSec=previous.curSec;curEl=previous.curEl;curPane=previous.curPane;selection=previous.selection;secFocus=previous.secFocus;
   history=[];future=[];saveProject();renderScenes();renderPane();renderPreview();
  },previous);
 }
}
