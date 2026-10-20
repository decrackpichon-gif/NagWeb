'use strict';
// Captura el Espacio 3D con el proyecto de aceptación en las 4 vistas. Uso: node tools/capture-workspace.cjs <carpeta>
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
(async()=>{
 const out=path.resolve(process.argv[2]||'evidence');fs.mkdirSync(out,{recursive:true});
 const vendor=process.env.NAGWEB_TEST_VENDOR_DIR||'work/spatial-vendors',names=['three.cjs','GLTFLoader.js','gsap.js','ScrollTrigger.js','CopyShader.js','LuminosityHighPassShader.js','EffectComposer.js','RenderPass.js','ShaderPass.js','UnrealBloomPass.js'];
 const browser=await chromium.launch({...(process.env.NAGWEB_BROWSER?{executablePath:process.env.NAGWEB_BROWSER}:{}),headless:true,args:['--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 await page.route('https://**/*',r=>{const u=r.request().url(),f=/three(?:\.min)?\.js/.test(u)?'three.cjs':/gsap.min/.test(u)?'gsap.js':/ScrollTrigger/.test(u)?'ScrollTrigger.js':u.split('/').at(-1);return names.includes(f)?r.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(vendor,f))}):r.abort();});
 await page.goto('file:///'+path.resolve('index.html').replaceAll('\\','/'));await page.waitForSelector('#preview');
 await page.setInputFiles('#file-json',path.resolve('acceptance/NagWeb-Camara-2-Aceptacion.json'));
 await page.waitForFunction(()=>sec()&&sec().id==='aceptacion-camara-2');await page.waitForTimeout(1500);
 await page.evaluate(()=>NAGWEB_SCROLL_DIRECTOR.scrub(sec().id,.25));
 await page.evaluate(()=>document.querySelector('[data-camera-workspace-open]').click());await page.waitForSelector('[data-ws-canvas]');
 await page.click('[data-ws-pick="object:foto"]');
 for(const v of ['persp','top','front','side']){await page.click('[data-ws-view="'+v+'"]');await page.click('[data-ws-frame-all]');await page.waitForTimeout(250);await page.screenshot({path:path.join(out,'espacio-3d-'+v+'.png')});}
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
