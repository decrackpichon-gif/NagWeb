import assert from 'node:assert/strict';

// Comprobación de cierre V1.0: flujo cotidiano completo en un navegador sin
// adaptadores privados, desde la UI hasta los archivos descargados.
export async function runReleaseSmoke(page){
 const previous=await page.evaluate(()=>({
  project:JSON.stringify(project),curPage,curSec,curEl,curPane,
  selection:selection.slice(),secFocus,history:history.slice(),future:future.slice()
 }));
 try{
  const authored=await page.evaluate(()=>{
   document.getElementById('btn-page-add').click();
   const name=document.getElementById('page-name');
   name.value='Entrega V1.0';name.dispatchEvent(new Event('input',{bubbles:true}));
   name.dispatchEvent(new Event('change',{bubbles:true}));
   document.getElementById('btn-add').click();
   document.querySelector('[data-ltab="layers"]').click();
   document.getElementById('el-type').value='button';
   document.querySelector('#lp-layers [data-act="el-add"]').click();
   const pg=project.pages[curPage];
   return{pages:project.pages.length,pageName:pg.name,scenes:pg.sections.length,
    hasButton:pg.sections.some(s=>s.elements.some(e=>e.type==='button')),
    stored:JSON.parse(localStorage.getItem(STORE_KEY)).pages[curPage].name};
  });
  assert.ok(authored.pages>=2,'crear una página desde la interfaz');
  assert.equal(authored.pageName,'Entrega V1.0');
  assert.equal(authored.stored,'Entrega V1.0');
  assert.equal(authored.scenes,2,'insertar escena desde selector real');
  assert.equal(authored.hasButton,true,'insertar botón como elemento normal');

  const exported=await page.evaluate(async()=>{
   const nativeFiles=[];
   const originalCreate=URL.createObjectURL,originalRevoke=URL.revokeObjectURL,
    originalClick=HTMLAnchorElement.prototype.click;
   URL.createObjectURL=blob=>{
    const f={blob,filename:'',url:'blob:release-'+nativeFiles.length};
    nativeFiles.push(f);return f.url;
   };
   URL.revokeObjectURL=()=>{};
   HTMLAnchorElement.prototype.click=function(){
    const last=nativeFiles[nativeFiles.length-1];
    if(last)last.filename=this.download;
   };
   try{
    const visible=document.getElementById('btn-export').style.display!=='none';
    const label=document.getElementById('btn-download').textContent;
    document.getElementById('btn-export').click();
    await Promise.resolve();
    document.getElementById('btn-download').click();
    await Promise.resolve();
    return{
     visible,label,files:await Promise.all(nativeFiles.map(async f=>({
      name:f.filename,mime:f.blob.type,text:await f.blob.text()
     }))),dialogOpen:document.getElementById('code-dialog').open
    };
   }finally{
    URL.createObjectURL=originalCreate;URL.revokeObjectURL=originalRevoke;
    HTMLAnchorElement.prototype.click=originalClick;
   }
  });
  assert.equal(exported.visible,true,'Guardar proyecto visible en navegador');
  assert.match(exported.label,/Descargar index\.html/,'no exigir copiar código');
  assert.equal(exported.files.length,2,'descargas reales para proyecto y sitio');
  assert.equal(exported.files[0].name,'proyecto-scrollcraft.json');
  assert.match(exported.files[0].mime,/application\/json/);
  assert.equal(exported.files[1].name,'index.html');
  assert.match(exported.files[1].mime,/text\/html/);
  const disk=JSON.parse(exported.files[0].text);
  assert.equal(disk.pages.at(-1).name,'Entrega V1.0');
  assert.equal(disk.pages.at(-1).sections.length,2);
  assert.equal(disk.pages.at(-1).sections.some(s=>s.elements.some(e=>e.type==='button')),true);
  assert.match(exported.files[1].text,/<!doctype html/i);
  assert.match(exported.files[1].text,/Entrega V1\.0/);
  assert.equal(exported.dialogOpen,false,'HTML descargado, no solo mostrado');

  // Persistencia tras recargar y reapertura efectiva del JSON descargado.
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof project!=='undefined' &&
   project.pages?.at(-1)?.name==='Entrega V1.0');
  const reopened=await page.evaluate(()=>({
   pages:project.pages.length,last:project.pages.at(-1).name,
   scenes:project.pages.at(-1).sections.length
  }));
  assert.equal(reopened.pages,authored.pages);
  assert.equal(reopened.scenes,2);
  await page.evaluate(data=>{
   const input=document.getElementById('file-json'),transfer=new DataTransfer();
   transfer.items.add(new File([data],'respaldo-v1.json',{type:'application/json'}));
   input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));
  },exported.files[0].text);
  await page.waitForFunction(()=>document.getElementById('toast').textContent.startsWith('Proyecto abierto:'));
  const imported=await page.evaluate(()=>JSON.parse(JSON.stringify(project)));
  // El importador normaliza campos opcionales de proyectos antiguos y nuevos.
  // La igualdad relevante en V1.0 es la del contenido y la estructura, no
  // la presencia textual de defaults como fixed:false o collection:''.
  const essential=p=>({
   title:p.title,assets:p.assets,styles:p.styles,
   pages:p.pages.map(pg=>({
    id:pg.id,name:pg.name,slug:pg.slug,
    sections:pg.sections.map(scene=>({
     id:scene.id,name:scene.name,layout:scene.layout,sdEnabled:!!scene.sdEnabled,
     elements:scene.elements.map(el=>({
      id:el.id,type:el.type,text:el.text||'',href:el.href||'',
      parent:el.parent||'',assetId:el.assetId||'',
      sdKeyframes:el.sdKeyframes||[]
     }))
    }))
   }))
  });
  assert.deepEqual(essential(imported),essential(disk),'páginas, escenas y contenido intactos al importar');
  console.log('Cierre V1.0: crear página, escena y botón, guardar JSON y HTML desde navegador, recargar e importar OK');
 }finally{
  await page.evaluate(prev=>{
   clearTimeout(previewTimer);
   project=JSON.parse(prev.project);curPage=prev.curPage;curSec=prev.curSec;
   curEl=prev.curEl;curPane=prev.curPane;selection=prev.selection;secFocus=prev.secFocus;
   history=prev.history;future=prev.future;
   saveProject();renderPages();renderScenes();renderPane();renderPreview();
  },previous);
 }
}
