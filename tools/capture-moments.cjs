'use strict';
// Abre el proyecto de aceptación por la ruta real "Abrir proyecto", captura la vista previa del editor
// en 0/25/50/75/100 %, exporta el sitio, lo abre en un documento independiente y captura los mismos
// momentos. También compara numéricamente la posición de cada capa (editor vs exportado).
// Uso: NAGWEB_BROWSER=... node tools/capture-moments.cjs <carpeta-evidencia>
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const outDir=path.resolve(process.argv[2]||'evidence');fs.mkdirSync(outDir,{recursive:true});
 const vendor=process.env.NAGWEB_TEST_VENDOR_DIR||'work/spatial-vendors',names=['three.cjs','GLTFLoader.js','gsap.js','ScrollTrigger.js','CopyShader.js','LuminosityHighPassShader.js','EffectComposer.js','RenderPass.js','ShaderPass.js','UnrealBloomPass.js'];
 const browser=await chromium.launch({...(process.env.NAGWEB_BROWSER?{executablePath:process.env.NAGWEB_BROWSER}:{}),headless:true,args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 const route=r=>{const u=r.request().url(),f=/three(?:\.min)?\.js/.test(u)?'three.cjs':/gsap.min/.test(u)?'gsap.js':/ScrollTrigger/.test(u)?'ScrollTrigger.js':u.split('/').at(-1);return names.includes(f)?r.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(vendor,f))}):r.abort();};
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://**/*',route);
 await page.goto('file:///'+path.resolve('index.html').replaceAll('\\','/'));await page.waitForSelector('#preview');
 await page.setInputFiles('#file-json',path.resolve('acceptance/NagWeb-Camara-2-Aceptacion.json'));
 await page.waitForFunction(()=>sec()&&sec().id==='aceptacion-camara-2',null,{timeout:15000});
 await page.waitForTimeout(3000);
 const moments=[0,25,50,75,100],edit={};
 const frame=()=>page.frames().find(f=>f!==page.mainFrame());
 for(const m of moments){
  await page.evaluate(m=>NAGWEB_SCROLL_DIRECTOR.scrub(sec().id,m/100),m);await page.waitForTimeout(700);
  await page.locator('#preview').screenshot({path:path.join(outDir,'editor-'+String(m).padStart(3,'0')+'.png')});
  edit[m]=await frame().evaluate(()=>{const st=document.querySelector('.nw-sd-stage'),sr=st.getBoundingClientRect();const o={stage:[sr.width,sr.height]};document.querySelectorAll('[data-nw-sd-el]').forEach(n=>{const r=n.getBoundingClientRect();o[n.dataset.id||n.id||n.className]=[(r.left+r.width/2-sr.left)/sr.width,(r.top+r.height/2-sr.top)/sr.height,r.width/sr.width];});return o;});
 }
 const size=await page.evaluate(()=>{const r=document.querySelector('#preview').getBoundingClientRect();return [Math.round(r.width),Math.round(r.height)];});
 const html=await page.evaluate(()=>generateSite(flattenPage(page()),false,false,false));
 fs.writeFileSync(path.join(outDir,'exportado.html'),html);
 // El Z de los objetos 3D depende de la altura del escenario: el exportado se abre con el MISMO tamaño de escenario que el editor.
 const exp=await browser.newPage({viewport:{width:Math.round(edit[0].stage[0]),height:Math.round(edit[0].stage[1])}});await exp.route('https://**/*',route);exp.on('pageerror',e=>errors.push('export: '+e.message));
 await exp.goto('file:///'+path.join(outDir,'exportado.html').replaceAll('\\','/'),{waitUntil:'load'});await exp.waitForTimeout(2500);
 const worst={};
 for(const m of moments){
  await exp.evaluate(m=>{window.__NAG_SCROLL_DIRECTOR['aceptacion-camara-2'].set(m/100);},m);await exp.waitForTimeout(700);
  await exp.screenshot({path:path.join(outDir,'exportado-'+String(m).padStart(3,'0')+'.png')});
  const got=await exp.evaluate(()=>{const st=document.querySelector('.nw-sd-stage'),sr=st.getBoundingClientRect();const o={stage:[sr.width,sr.height]};document.querySelectorAll('[data-nw-sd-el]').forEach(n=>{const r=n.getBoundingClientRect();o[n.dataset.id||n.id||n.className]=[(r.left+r.width/2-sr.left)/sr.width,(r.top+r.height/2-sr.top)/sr.height,r.width/sr.width];});return o;});
  for(const k of Object.keys(edit[m]).filter(k=>k!=='stage')){
   const a=edit[m][k],b=got[k];if(!b){worst[m+':'+k]='falta en exportado';continue;}
   const d=Math.max(Math.abs(a[0]-b[0])*got.stage[0],Math.abs(a[1]-b[1])*got.stage[1]);worst[m+':'+k]=Math.round(d*100)/100;
  }
 }
 fs.writeFileSync(path.join(outDir,'paridad-editor-exportado.json'),JSON.stringify({viewport:size,diferenciaMaximaPx:worst,editor:edit},null,1));
 console.log('Paridad (px) editor vs exportado por momento:',JSON.stringify(worst));
 console.log('errores:',errors.slice(0,5));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
