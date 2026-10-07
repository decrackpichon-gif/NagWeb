import assert from 'node:assert/strict';

// Pre-pages project format, with both legacy timing and imported keyframes.
const legacy={
 name:'Proyecto anterior',
 assets:{models:[{id:'legacy-model',name:'Modelo anterior',text:'# old OBJ'}],images:[{id:'legacy-image',name:'Imagen anterior',data:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII='}]},
 sections:[{
  id:'legacy-scene',name:'Escena anterior',layout:'free',height:100,bg:'#102030',fg:'#FFFFFF',sdEnabled:true,sdLength:300,sdEase:'linear',
  elements:[
   {id:'legacy-text',type:'heading',text:'Texto anterior',x:20,y:30,w:60,anim:'none',sdStart:20,sdEnd:80,sdSpan:10,sdEnter:'fade',sdExit:'fade',sdMoveX:120,sdMoveY:0,sdScale:100,sdRotate:0},
   {id:'legacy-keys',type:'paragraph',text:'Momentos importados',x:30,y:60,w:50,anim:'none',sdKeyframesEnabled:true,sdKeyframes:[{at:0,x:0},{at:100,x:200}]},
   {id:'legacy-picture',type:'image',assetId:'legacy-image',x:80,y:30,w:10,anim:'none'}
  ]
 }]
};

async function importJson(page,data){
 await page.evaluate(data=>{
  window.__legacyImportFinished=false;
  const input=document.getElementById('file-json'),transfer=new DataTransfer();
  transfer.items.add(new File([data],'proyecto-anterior.json',{type:'application/json'}));
  input.files=transfer.files;
  // The reader completes after the real import handler has processed the file.
  const Original=window.FileReader;
  window.FileReader=class extends Original{
   constructor(){super();this.addEventListener('loadend',()=>{window.__legacyImportFinished=true;});}
  };
  try{input.dispatchEvent(new Event('change',{bubbles:true}));}finally{window.FileReader=Original;}
 },data);
 await page.waitForFunction(()=>window.__legacyImportFinished===true);
}

export async function runLegacySmoke(page){
 const previous=await page.evaluate(()=>({project:JSON.stringify(project),curPage,curSec,curEl,curPane,selection,secFocus}));
 try{
  await importJson(page,JSON.stringify(legacy));
  const migrated=await page.evaluate(()=>JSON.parse(JSON.stringify(project)));
  assert.equal(migrated.pages.length,1);
  assert.equal(migrated.pages[0].sections[0].id,'legacy-scene');
  assert.equal(migrated.pages[0].sections[0].elements[0].text,'Texto anterior');
  assert.equal(migrated.pages[0].sections[0].elements[0].sdStart,20);
  assert.equal(migrated.pages[0].sections[0].elements[0].sdMoveX,120);
  assert.deepEqual(migrated.pages[0].sections[0].elements[1].sdKeyframes,legacy.sections[0].elements[1].sdKeyframes);
  assert.equal(migrated.assets.models[0].format,'obj');
  assert.equal(migrated.assets.models[0].text,legacy.assets.models[0].text);
  assert.deepEqual(migrated.assets.images,legacy.assets.images);
  assert.equal(migrated.styles.colors[0].value,'#102030');

  // Actual project export button; only the host download service is substituted.
  const exported=await page.evaluate(async()=>{
   const old=downloads;let result;
   downloads={save:async file=>{result=file;}};
   try{document.getElementById('btn-export').click();await Promise.resolve();return result;}
   finally{downloads=old;}
  });
  assert.equal(exported.filename,'proyecto-scrollcraft.json');
  assert.deepEqual(JSON.parse(exported.data),migrated);
  await importJson(page,exported.data);
  assert.deepEqual(await page.evaluate(()=>JSON.parse(JSON.stringify(project))),migrated);

  // An invalid project must leave both the live project and saved copy intact.
  const savedBefore=await page.evaluate(()=>localStorage.getItem(STORE_KEY));
  for(const invalid of ['{broken',JSON.stringify({pages:[{id:'empty',sections:[]}]})]){
   await importJson(page,invalid);
   assert.deepEqual(await page.evaluate(()=>JSON.parse(JSON.stringify(project))),migrated);
   assert.equal(await page.evaluate(()=>localStorage.getItem(STORE_KEY)),savedBefore);
  }

  // Verify the generated site executes the previous timing and new keyframes.
  await page.evaluate(()=>{
   const f=document.createElement('iframe');f.id='legacy-export';f.style.cssText='width:1000px;height:600px';
   f.srcdoc=generateSite(flattenPage(page()),false,false,false);document.body.append(f);
  });
  await page.waitForFunction(()=>document.querySelector('#legacy-export')?.contentWindow?.__NAG_SCROLL_DIRECTOR?.['legacy-scene']);
  const runtime=await page.evaluate(()=>{
   const f=document.getElementById('legacy-export'),d=f.contentDocument;
   f.contentWindow.__NAG_SCROLL_DIRECTOR['legacy-scene'].set(.5);
   return{
    oldX:d.querySelector('[data-id="legacy-text"]').style.getPropertyValue('--nw-sd-x'),
    newX:d.querySelector('[data-id="legacy-keys"]').style.getPropertyValue('--nw-sd-x'),
    text:d.querySelector('[data-id="legacy-text"]').textContent,
    image:d.querySelector('[data-id="legacy-picture"] img')?.getAttribute('src')
   };
  });
  assert.equal(runtime.oldX,'60.00px');assert.equal(runtime.newX,'100.00px');
  assert.ok(runtime.text.includes('Texto anterior'));assert.equal(runtime.image,legacy.assets.images[0].data);
  console.log('Compatibilidad: importación antigua, exportación JSON, reapertura, rechazo sin pérdida y runtime HTML OK');
 }finally{
  await page.evaluate(previous=>{
   document.getElementById('legacy-export')?.remove();
   clearTimeout(previewTimer);project=JSON.parse(previous.project);
   curPage=previous.curPage;curSec=previous.curSec;curEl=previous.curEl;curPane=previous.curPane;selection=previous.selection;secFocus=previous.secFocus;
   history=[];future=[];saveProject();renderPages();renderScenes();renderPane();renderPreview();
   delete window.__legacyImportFinished;
  },previous);
 }
}
