'use strict';
// Construye la escena de aceptación (texto A → foto → texto B + anillo GLB propio) dentro del
// editor real y la guarda como proyecto .json. No usa recursos privados: la imagen es un SVG
// incrustado y el modelo se genera con tools/make-acceptance-glb.mjs.
// Uso: NAGWEB_BROWSER=/ruta/chrome node tools/build-acceptance.cjs [salida.json]
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
(async()=>{
 const out=path.resolve(process.argv[2]||'acceptance/NagWeb-Camara-2-Aceptacion.json');
 const vendor=process.env.NAGWEB_TEST_VENDOR_DIR||'work/spatial-vendors',names=['three.cjs','GLTFLoader.js','gsap.js','ScrollTrigger.js','CopyShader.js','LuminosityHighPassShader.js','EffectComposer.js','RenderPass.js','ShaderPass.js','UnrealBloomPass.js'];
 const browser=await chromium.launch({...(process.env.NAGWEB_BROWSER?{executablePath:process.env.NAGWEB_BROWSER}:{}),headless:true,args:['--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 await page.route('https://**/*',route=>{const u=route.request().url(),f=/three(?:\.min)?\.js/.test(u)?'three.cjs':/gsap.min/.test(u)?'gsap.js':/ScrollTrigger/.test(u)?'ScrollTrigger.js':u.split('/').at(-1);return names.includes(f)?route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(vendor,f))}):route.abort();});
 await page.goto('file:///'+path.resolve('index.html').replaceAll('\\','/'));await page.waitForSelector('#preview');
 const glb=fs.readFileSync(path.resolve('acceptance/NagWeb-Anillo-Aceptacion.glb')).toString('base64');
 const json=await page.evaluate((glb)=>{
  const s=JSON.parse(JSON.stringify(sec()));
  Object.assign(s,{id:'aceptacion-camara-2',name:'Aceptación Cámara 2.0',layout:'free',sdEnabled:true,sdCameraEnabled:true,sdCameraOrientationMode:'manual',sdCameraPathMode:'linear',sdEase:'linear',sdPerspective:1000,elements:[]});
  const demo=NAGWEB_SCROLL_CAMERA.layerJourneyDemo(s,mkEl);
  // Identificadores estables: el proyecto de aceptación es reproducible byte a byte.
  ['texto-a','foto','texto-b'].forEach((id,i)=>{demo.layers[i].id=id;demo.created[i].id=id;});
  project.assets=project.assets||{};project.assets.images=[demo.asset];
  s.elements.push(...demo.created);
  demo.layers.forEach(l=>{const e=s.elements.find(v=>v.id===l.id);e.x=50;e.y=50;e.sdCameraDepth=l.z;e.sdStart=0;e.sdEnd=100;e.sdEnter='none';e.sdExit='keep';});
  // Recorrido de aceptación: cada momento deja ver planos nítidos (el 'viaje' de ejemplo cruza justo una capa en 50 y 75 %).
  const zs=[-900,-240,150,520,1000];s.sdCameraFrames=demo.frames.map((f,i)=>Object.assign({},f,{z:zs[i]}));s.sdLength=demo.length;
  project.assets=project.assets||{};project.assets.models=[{id:'anillo-aceptacion',name:'Anillo de aceptación',format:'glb',data:glb}];
  // Z mundo del anillo = perspectiva − offZ·unidad; 800 = mismo plano que la foto, así la cruza.
  // La unidad del Z de los objetos 3D es 1/12 de la ALTURA del escenario (1030 px en este editor a 1440×900).
  const unit=1030/(12*Math.tan(25*Math.PI/180));
  s.elements.push(mkEl('shape3d',{id:'anillo-3d',name:'Anillo 3D',anchor:true,shape:'model',modelId:'anillo-aceptacion',x:50,y:50,offX:0,offY:0,offZ:Math.round((1000-800)/unit*1000)/1000,scale:1.5,motion:'still',entrance:'none',keepMat:true,env:'studio'}));
  project.name='NagWeb · Aceptación Cámara 2.0';
  project.pages[0].id='pagina-aceptacion';project.pages[0].name='Inicio';
  project.pages[0].sections=[s];
  saveProject();
  return JSON.stringify(project);
 },glb);
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,json);
 console.log('Proyecto de aceptación escrito:',out,json.length,'bytes');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
