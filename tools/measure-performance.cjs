'use strict';
// Mide (no inventa) el costo de dibujar el sitio exportado y el espacio de trabajo.
// Reporta el navegador y el renderizador reales: aquí suele ser SwiftShader (CPU), NO la GTX 1050.
// Uso: NAGWEB_BROWSER=... node tools/measure-performance.cjs <exportado.html> <salida.json>
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
(async()=>{
 const html=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]||'rendimiento.json');
 const vendor=process.env.NAGWEB_TEST_VENDOR_DIR||'work/spatial-vendors',names=['three.cjs','GLTFLoader.js','gsap.js','ScrollTrigger.js','CopyShader.js','LuminosityHighPassShader.js','EffectComposer.js','RenderPass.js','ShaderPass.js','UnrealBloomPass.js'];
 const route=r=>{const u=r.request().url(),f=/three(?:\.min)?\.js/.test(u)?'three.cjs':/gsap.min/.test(u)?'gsap.js':/ScrollTrigger/.test(u)?'ScrollTrigger.js':u.split('/').at(-1);return names.includes(f)?r.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(vendor,f))}):r.abort();};
 const browser=await chromium.launch({...(process.env.NAGWEB_BROWSER?{executablePath:process.env.NAGWEB_BROWSER}:{}),headless:true,args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 const src=fs.readFileSync(html,'utf8'),variants={con_oclusion_parcial:src,sin_oclusion_parcial:src.replace('{bloom:BLOOM,','{inverseOcclusion:false,bloom:BLOOM,')};
 const result={fecha:new Date().toISOString(),navegador:browser.version(),nota:'Medido en el entorno de desarrollo (sin GPU real). Sirve para comparar variantes entre sí, no como cifra de la GTX 1050 ni de iPhone/iPad.',variantes:{}};
 for(const [name,body] of Object.entries(variants)){
  const f=path.join(path.dirname(html),'_perf_'+name+'.html');fs.writeFileSync(f,body);
  const page=await browser.newPage({viewport:{width:1200,height:1030}});await page.route('https://**/*',route);
  await page.goto('file:///'+f.replaceAll('\\','/'),{waitUntil:'load'});await page.waitForTimeout(2500);
  const r=await page.evaluate(async()=>{
   const info=(()=>{const c=document.createElement('canvas'),g=c.getContext('webgl');const e=g&&g.getExtension('WEBGL_debug_renderer_info');return e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):'desconocido';})();
   const D=window.__NAG_SCROLL_DIRECTOR['aceptacion-camara-2'],times=[];
   const raf=()=>new Promise(r=>requestAnimationFrame(r));
   for(let i=0;i<=120;i++){const t0=performance.now();D.set(i/120);await raf();times.push(performance.now()-t0);}
   times.shift();times.sort((a,b)=>a-b);const sum=times.reduce((a,b)=>a+b,0);
   return {renderizador:info,fotogramas:times.length,promedio_ms:+(sum/times.length).toFixed(2),mediana_ms:+times[times.length>>1].toFixed(2),p95_ms:+times[Math.floor(times.length*.95)].toFixed(2),max_ms:+times[times.length-1].toFixed(2)};
  });
  result.variantes[name]=r;await page.close();fs.unlinkSync(f);
 }
 // Espacio de trabajo: tiempo de dibujo con la escena de aceptación.
 const page=await browser.newPage({viewport:{width:1440,height:900}});await page.route('https://**/*',route);
 await page.goto('file:///'+path.resolve('index.html').replaceAll('\\','/'));await page.waitForSelector('#preview');
 await page.setInputFiles('#file-json',path.resolve('acceptance/NagWeb-Camara-2-Aceptacion.json'));
 await page.waitForFunction(()=>sec()&&sec().id==='aceptacion-camara-2');await page.waitForTimeout(1500);
 await page.evaluate(()=>document.querySelector('[data-camera-workspace-open]').click());await page.waitForSelector('[data-ws-canvas]');
 const cv=await page.evaluate(()=>NAGWEB_SPATIAL_WORKSPACE._screen().canvas);
 await page.mouse.move(cv.x+cv.w/2,cv.y+cv.h/2);await page.mouse.down({button:'middle'});
 const t=[];for(let i=0;i<90;i++){const t0=Date.now();await page.mouse.move(cv.x+cv.w/2+Math.sin(i/8)*160,cv.y+cv.h/2+Math.cos(i/8)*60);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));t.push(Date.now()-t0);}
 await page.mouse.up({button:'middle'});t.sort((a,b)=>a-b);
 result.espacio_de_trabajo={orbitando_ms_por_paso:{mediana:t[t.length>>1],p95:t[Math.floor(t.length*.95)],max:t[t.length-1]},nota:'Incluye la espera de dos fotogramas y la latencia de Playwright; es un techo, no el costo del dibujo.'};
 fs.writeFileSync(out,JSON.stringify(result,null,1));console.log(JSON.stringify(result,null,1));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
