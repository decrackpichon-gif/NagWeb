'use strict';
// Espacio 3D grande (Cámara 2.0), probado en Chromium con mouse y teclado reales.
// Usa el proyecto de aceptación abierto por la ruta real "Abrir proyecto".
// Verifica: tamaño útil, selección lista↔escena, que NAVEGAR no cambie el proyecto,
// arrastre de flecha = un solo Deshacer, Escape cancela, Deshacer/Rehacer, y que el
// control de momento mueva el Director (única fuente de progreso).
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({...(process.env.NAGWEB_BROWSER?{executablePath:process.env.NAGWEB_BROWSER}:{}),headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const vendor=process.env.NAGWEB_TEST_VENDOR_DIR||'work/spatial-vendors',names=['three.cjs','GLTFLoader.js','gsap.js','ScrollTrigger.js','CopyShader.js','LuminosityHighPassShader.js','EffectComposer.js','RenderPass.js','ShaderPass.js','UnrealBloomPass.js'];
  await page.route('https://**/*',route=>{
   const u=route.request().url(),f=/three(?:\.min)?\.js/.test(u)?'three.cjs':/gsap.min/.test(u)?'gsap.js':/ScrollTrigger/.test(u)?'ScrollTrigger.js':u.split('/').at(-1);
   return names.includes(f)?route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(vendor,f))}):route.abort();
  });
  await page.goto('file:///'+path.resolve('index.html').replaceAll('\\','/'));
  await page.waitForSelector('#preview');
  await page.setInputFiles('#file-json',path.resolve('acceptance/NagWeb-Camara-2-Aceptacion.json'));
  await page.waitForFunction(()=>sec()&&sec().id==='aceptacion-camara-2',null,{timeout:15000});
  await page.waitForTimeout(1500);
  // Contadores de guardado: navegar jamás debe guardar.
  await page.evaluate(()=>{window.__saves=0;const o=window.saveProject;window.saveProject=function(){window.__saves++;return o.apply(this,arguments);};history.length;});
  const J=()=>page.evaluate(()=>JSON.stringify(sec()));
  // `history` del editor es una lista propia declarada con let/var global.
  const undoDepth=()=>page.evaluate(()=>{try{return (0,eval)('history').length;}catch(_){return -1;}});

  // 1 · Abrir y medir
  await page.evaluate(()=>document.querySelector('[data-camera-workspace-open]').click());
  await page.waitForSelector('[data-ws-canvas]');
  await page.waitForTimeout(400);
  const st=await page.evaluate(()=>NAGWEB_SPATIAL_WORKSPACE._state());
  assert.ok(st.w>=700&&st.h>=450,'El espacio de trabajo es grande ('+st.w+'×'+st.h+')');
  assert.ok(st.handles===0,'Sin selección no hay flechas');
  console.log('PASS abre grande:',st.w+'×'+st.h);

  // 2 · Elegir desde la lista sincroniza la escena
  const beforeJson=await J(),beforeUndo=await undoDepth(),beforeSaves=await page.evaluate(()=>window.__saves);
  await page.click('[data-ws-pick="object:foto"]');
  await page.waitForTimeout(200);
  let s2=await page.evaluate(()=>NAGWEB_SPATIAL_WORKSPACE._state());
  assert.equal(s2.sel&&s2.sel.kind,'object');assert.equal(String(s2.sel.id),'foto');
  assert.ok(s2.handles>=3,'Al elegir aparecen flechas y planos ('+s2.handles+')');
  console.log('PASS selección desde la lista muestra el gizmo');

  // 3 · Navegar no toca el proyecto
  for(const v of ['top','front','side','persp'])await page.click('[data-ws-view="'+v+'"]');
  await page.click('[data-ws-zoom="1"]');await page.click('[data-ws-zoom="-1"]');
  await page.click('[data-ws-frame]');await page.click('[data-ws-frame-all]');
  const cv=await page.evaluate(()=>NAGWEB_SPATIAL_WORKSPACE._screen().canvas);
  await page.mouse.move(cv.x+cv.w/2,cv.y+cv.h/2);
  await page.mouse.wheel(0,-240);await page.mouse.wheel(0,240);
  await page.mouse.down({button:'middle'});await page.mouse.move(cv.x+cv.w/2+90,cv.y+cv.h/2+40,{steps:6});await page.mouse.up({button:'middle'});
  await page.keyboard.down('Shift');await page.mouse.down({button:'middle'});await page.mouse.move(cv.x+cv.w/2-60,cv.y+cv.h/2-30,{steps:6});await page.mouse.up({button:'middle'});await page.keyboard.up('Shift');
  assert.equal(await J(),beforeJson,'Navegar no modifica la escena');
  assert.equal(await undoDepth(),beforeUndo,'Navegar no agrega pasos de Deshacer');
  assert.equal(await page.evaluate(()=>window.__saves),beforeSaves,'Navegar no guarda el proyecto');
  console.log('PASS orbitar, panear, zoom, encuadrar y cambiar de vista no cambian el proyecto');

  // 4 · Arrastrar una flecha: un solo Deshacer, el objeto cambia
  await page.click('[data-ws-view="top"]');await page.waitForTimeout(150);
  const arrow=async(axis)=>page.evaluate(a=>{const h=NAGWEB_SPATIAL_WORKSPACE._screen().handles.find(x=>x.type==='axis'&&x.axis===a);return h;},axis);
  const ax=await arrow('x');assert.ok(ax,'Existe la flecha X');
  const pt=(h,t)=>({x:h.from.x+(h.to.x-h.from.x)*t,y:h.from.y+(h.to.y-h.from.y)*t});
  const p0=pt(ax,.85),dir={x:ax.to.x-ax.from.x,y:ax.to.y-ax.from.y},dl=Math.hypot(dir.x,dir.y),u={x:dir.x/dl,y:dir.y/dl};
  const fotoBefore=await page.evaluate(()=>JSON.stringify(sec().elements.find(e=>e.id==='foto')));
  const u0=await undoDepth(),sv0=await page.evaluate(()=>window.__saves);
  await page.mouse.move(p0.x,p0.y);await page.mouse.down();
  await page.mouse.move(p0.x+u.x*60,p0.y+u.y*60,{steps:8});
  assert.equal(await page.evaluate(()=>NAGWEB_SPATIAL_WORKSPACE._state().drag),true,'Hay arrastre activo');
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().elements.find(e=>e.id==='foto'))),fotoBefore,'Durante el arrastre el proyecto no cambia (vista previa)');
  await page.mouse.up();await page.waitForTimeout(200);
  const fotoAfter=await page.evaluate(()=>JSON.stringify(sec().elements.find(e=>e.id==='foto')));
  assert.notEqual(fotoAfter,fotoBefore,'La flecha movió el objeto');
  assert.equal(await undoDepth(),u0+1,'Un arrastre = exactamente un Deshacer');
  assert.equal(await page.evaluate(()=>window.__saves),sv0+1,'Un arrastre = un guardado');
  const moved=JSON.parse(fotoAfter),orig=JSON.parse(fotoBefore);
  assert.ok(moved.x!==orig.x||moved.sdOffsetX!==orig.sdOffsetX||JSON.stringify(moved)!==JSON.stringify(orig));
  // Sólo cambió ese objeto
  const others=await page.evaluate(()=>sec().elements.filter(e=>e.id!=='foto').map(e=>JSON.stringify(e)));
  const othersOrig=JSON.parse(beforeJson).elements.filter(e=>e.id!=='foto').map(e=>JSON.stringify(e));
  assert.deepEqual(others,othersOrig,'El resto de los elementos queda intacto');
  console.log('PASS flecha X: mueve sólo ese objeto, 1 Deshacer, 1 guardado');

  // 5 · Deshacer / Rehacer desde el espacio
  await page.click('[data-ws-undo]');await page.waitForTimeout(200);
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().elements.find(e=>e.id==='foto'))),fotoBefore,'Deshacer restaura el objeto');
  await page.click('[data-ws-redo]');await page.waitForTimeout(200);
  assert.equal(await page.evaluate(()=>JSON.stringify(sec().elements.find(e=>e.id==='foto'))),fotoAfter,'Rehacer lo vuelve a mover');
  await page.click('[data-ws-undo]');await page.waitForTimeout(200);
  console.log('PASS Deshacer y Rehacer');

  // 6 · Escape cancela un arrastre en curso
  const ax2=await arrow('x'),q0=pt(ax2,.85),d2={x:ax2.to.x-ax2.from.x,y:ax2.to.y-ax2.from.y},l2=Math.hypot(d2.x,d2.y);
  const u1=await undoDepth(),j1=await J(),sv1=await page.evaluate(()=>window.__saves);
  await page.mouse.move(q0.x,q0.y);await page.mouse.down();await page.mouse.move(q0.x+d2.x/l2*70,q0.y+d2.y/l2*70,{steps:6});
  await page.keyboard.press('Escape');await page.mouse.up();await page.waitForTimeout(150);
  assert.equal(await J(),j1,'Escape deja la escena como estaba');
  assert.equal(await undoDepth(),u1,'Escape no agrega Deshacer');
  assert.equal(await page.evaluate(()=>window.__saves),sv1,'Escape no guarda');
  assert.equal(await page.evaluate(()=>NAGWEB_SPATIAL_WORKSPACE.isOpen()),true,'El primer Escape cancela el gesto y no cierra el espacio');
  console.log('PASS Escape cancela el arrastre sin guardar');

  // 7 · Mover el momento mueve el Director, sin tocar el proyecto
  const j2=await J(),u2=await undoDepth();
  await page.evaluate(()=>{const s=document.querySelector('[data-ws-seek]');s.value=50;s.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.waitForTimeout(300);
  const prog=await page.evaluate(()=>{const p=window.NAGWEB_SCROLL_DIRECTOR.progress;return typeof p==='function'?p(sec().id):null;});
  if(prog!==null)assert.ok(Math.abs((prog>1?prog/100:prog)-.5)<.01,'El espacio usa el progreso del Director ('+prog+')');
  assert.equal(await J(),j2,'Cambiar el momento no cambia el proyecto');
  assert.equal(await undoDepth(),u2);
  console.log('PASS el momento del espacio es el del Director');

  // 8 · Cerrar con Escape y sin errores
  await page.keyboard.press('Escape');await page.waitForTimeout(200);
  assert.equal(await page.evaluate(()=>NAGWEB_SPATIAL_WORKSPACE.isOpen()),false,'Escape cierra el espacio');
  assert.equal(await page.evaluate(()=>document.querySelectorAll('.nw-ws').length),0,'Se retira del documento al cerrar');
  assert.deepEqual(errors,[],'Sin errores de página');
  console.log('PASS cierra limpio, sin errores de página');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
