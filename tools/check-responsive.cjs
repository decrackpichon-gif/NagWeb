'use strict';
// Abre el exportado en celular y con "reducir movimiento"; revisa errores, scroll horizontal y que el Director responda.
// Uso: node tools/check-responsive.cjs <exportado.html>
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
(async()=>{
 const vendor=process.env.NAGWEB_TEST_VENDOR_DIR||'work/spatial-vendors',names=['three.cjs','GLTFLoader.js','gsap.js','ScrollTrigger.js','CopyShader.js','LuminosityHighPassShader.js','EffectComposer.js','RenderPass.js','ShaderPass.js','UnrealBloomPass.js'];
 const browser=await chromium.launch({...(process.env.NAGWEB_BROWSER?{executablePath:process.env.NAGWEB_BROWSER}:{}),headless:true,args:['--enable-unsafe-swiftshader']});
 const res={};
 for(const [name,opt] of [['celular_390x844',{viewport:{width:390,height:844},isMobile:true,hasTouch:true}],['tablet_820x1180',{viewport:{width:820,height:1180},isMobile:true,hasTouch:true}],['reducir_movimiento_1200x1030',{viewport:{width:1200,height:1030},reducedMotion:'reduce'}]]){
  const ctx=await browser.newContext(opt),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>{const u=r.request().url(),f=/three(?:\.min)?\.js/.test(u)?'three.cjs':/gsap.min/.test(u)?'gsap.js':/ScrollTrigger/.test(u)?'ScrollTrigger.js':u.split('/').at(-1);return names.includes(f)?r.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(vendor,f))}):r.abort();});
  await page.goto('file:///'+path.resolve(process.argv[2]).replaceAll('\\','/'),{waitUntil:'load'});await page.waitForTimeout(2000);
  const out={ida_y_vuelta:[]};
  for(const p of [0,.25,.5,.75,1,.75,.5,.25,0]){await page.evaluate(p=>window.__NAG_SCROLL_DIRECTOR['aceptacion-camara-2'].set(p),p);await page.waitForTimeout(300);const got=await page.evaluate(()=>window.__NAG_SCROLL_DIRECTOR['aceptacion-camara-2'].progress());out.ida_y_vuelta.push([p,got]);}
  out.progresoCoincide=out.ida_y_vuelta.every(a=>Math.abs(a[0]-a[1])<.001);
  out.scrollHorizontal=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
  out.canvasGL=await page.evaluate(()=>!!document.querySelector('canvas'));
  out.errores=errors;res[name]=out;await ctx.close();
 }
 console.log(JSON.stringify(res,null,1));await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
