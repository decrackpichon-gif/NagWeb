import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const candidates=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const executablePath=candidates.find(p=>fs.existsSync(p));
if(!executablePath) throw new Error('No Chromium/Chrome executable found on runner');

const browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage();
await page.setViewport({width:1440,height:900,deviceScaleFactor:1});
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e&&e.stack||e)));

await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForFunction(()=>window.NAGWEB_FEEDBACK16===1 && !!window.NAGWEB_UNIVERSAL && !!window.NAGWEB_SCROLL_DIRECTOR,{timeout:30000});
await page.waitForSelector('#preview',{timeout:30000});
await page.waitForFunction(()=>{
 const f=document.querySelector('#preview');
 return !!(f&&f.contentDocument&&f.contentDocument.body&&f.contentDocument.body.innerHTML.length>50);
},{timeout:30000});

const state=await page.evaluate(()=>({
 title:document.title,
 main:!!document.querySelector('main'),
 left:!!document.querySelector('.col.scenes'),
 right:!!document.querySelector('.col.inspector'),
 preview:!!document.querySelector('#preview'),
 workspace:window.NAGWEB_WORKSPACE16===1,
 feedback:window.NAGWEB_FEEDBACK16===1,
 director:!!window.NAGWEB_SCROLL_DIRECTOR,
 universal:window.NAGWEB_UNIVERSAL&&window.NAGWEB_UNIVERSAL.version,
 kineticToggle:!!(window.SCW&&SCW.kinds&&SCW.kinds.kineticstrip&&SCW.kinds.kineticstrip.fields||[]).find(f=>f&&f.k==='showProgress'),
 heroTexts:!!(window.SCW&&SCW.kinds&&SCW.kinds.layeredhero&&SCW.kinds.layeredhero.fields||[]).find(f=>f&&f.k==='texts'),
 heroFiveLayers:(()=>{const d=window.SCW&&SCW.kinds&&SCW.kinds.layeredhero,fs=d&&d.fields||[];return ['img1','img2','img3','img4','img5'].every(k=>fs.some(f=>f&&f.k===k));})(),
 heroTextList:(()=>{const fs=window.SCW&&SCW.kinds&&SCW.kinds.layeredhero&&SCW.kinds.layeredhero.fields||[],f=fs.find(x=>x&&x.k==='texts');return !!(f&&f.type==='list'&&Array.isArray(f.item)&&f.item.some(x=>x&&x.k==='text')&&f.item.some(x=>x&&x.k==='style'));})(),
 heroPartSelector:(()=>{const d=window.SCW&&SCW.kinds&&SCW.kinds.layeredhero;return !!(d&&typeof d.markup==='function'&&String(d.markup).includes('data-nw-part'));})(),
 storyChapterSelector:(()=>{const d=window.SCW&&SCW.kinds&&SCW.kinds.scrollstory;return !!(d&&typeof d.markup==='function'&&String(d.markup).includes('data-nw-story-ch="1"')&&String(d.markup).includes('data-nw-story-ch="2"')&&String(d.markup).includes('data-nw-story-ch="3"'));})(),
 storyFollowScroll:(()=>{const d=window.SCW&&SCW.kinds&&SCW.kinds.scrollstory;return !!(d&&typeof d.markup==='function'&&String(d.markup).includes('data-nw-story-live'));})(),
 storyEditableParts:(()=>{const d=window.SCW&&SCW.kinds&&SCW.kinds.scrollstory,m=d&&typeof d.markup==='function'?String(d.markup):'';return ['k1','t1','c1','media-1','k2','t2','c2','media-2','k3','t3','c3','media-3'].every(k=>m.includes(k));})(),
 kineticSticky:(()=>{const d=window.SCW&&SCW.kinds&&SCW.kinds.kineticstrip,m=d&&typeof d.markup==='function'?String(d.markup):'';return m.includes('nw-ks-sticky')&&m.includes('nw-ks-track')&&m.includes('nw-ks-progress');})(),
 kineticControls:(()=>{const fs=window.SCW&&SCW.kinds&&SCW.kinds.kineticstrip&&SCW.kinds.kineticstrip.fields||[];return ['perCard','cardW','cardH','gap','tilt','round'].every(k=>fs.some(f=>f&&f.k===k));})(),
 kineticProjectList:(()=>{const fs=window.SCW&&SCW.kinds&&SCW.kinds.kineticstrip&&SCW.kinds.kineticstrip.fields||[],f=fs.find(x=>x&&x.k==='projects');return !!(f&&f.type==='list');})(),
 directorLoaded:window.NAGWEB_SCROLL_DIRECTOR16===1,
 directorApi:(()=>{const d=window.NAGWEB_SCROLL_DIRECTOR;return !!(d&&d.version==='1.0'&&typeof d.scrub==='function'&&typeof d.live==='function');})(),
 directorScenePanel:(()=>{const s=String(window.paneSceneNew||'');return s.includes('Director de scroll')&&s.includes('data-sd-scrub')&&s.includes('data-sd-play')&&s.includes('data-sd-live');})(),
 directorElementPanel:(()=>{const s=String(window.paneElementNew||'');return s.includes('Momento en la historia')&&s.includes('sdStart')&&s.includes('sdEnd')&&s.includes('sdEnter')&&s.includes('sdExit');})(),
 directorExportRuntime:(()=>{const s=String(window.generateSite||'');return s.includes('nw-scroll-director-css')&&s.includes('sdEnabled');})(),
 directorQuickActions:(()=>{const s=String(window.paneSceneNew||'');return s.includes('data-sd-auto')&&s.includes('data-sd-reset');})(),
 directorMotionControls:(()=>{const s=String(window.paneElementNew||'');return ['sdMoveX','sdMoveY','sdRotate','sdScale','sdSpan'].every(k=>s.includes(k));})(),
 directorTransitions:(()=>{const s=String(window.paneElementNew||'');return ['fade','up','down','left','right','zoom','blur','depth','keep'].every(k=>s.includes(k));})(),
 directorUniversalCompose:(()=>{const s=String(window.generateSite||'');return s.includes('nw-scroll-director-css')&&String(document.documentElement.innerHTML).includes('nagweb-universal-container.js');})(),
 directorCssVarsCompose:(()=>{const scripts=Array.from(document.scripts).map(x=>x.textContent||'').join('\n');return scripts.includes('--nw-uc-dx')&&scripts.includes('--nw-uc-dy')&&scripts.includes('--nw-uc-scale')&&scripts.includes('--nw-sd-x')&&scripts.includes('--nw-sd-y')&&scripts.includes('--nw-sd-scale');})(),
 directorScaleCompose:(()=>{const scripts=Array.from(document.scripts).map(x=>x.textContent||'').join('\n');return scripts.includes('scale:calc(var(--nw-sd-scale,1) * var(--nw-uc-scale,1))');})(),
 directorDisablesUniversalTween:(()=>{const scripts=Array.from(document.scripts).map(x=>x.textContent||'').join('\n');return scripts.includes('transition:none!important;will-change:translate,scale,rotate,opacity,filter');})(),
 reducedMotionKeepsDirector:(()=>{const scripts=Array.from(document.scripts).map(x=>x.textContent||'').join('\n');return scripts.includes('--nw-uc-dx:0px!important')&&scripts.includes('--nw-uc-dy:0px!important')&&scripts.includes('--nw-uc-scale:1!important')&&!scripts.includes('.nw-uc>.el{translate:0 0!important;scale:1!important');})(),
 directorUniversalLoaded:(()=>{const u=window.NAGWEB_UNIVERSAL,d=window.NAGWEB_SCROLL_DIRECTOR;return !!(u&&u.version&&d&&d.version);})()
}));
for(const [k,v] of Object.entries(state)){
 if(!v) throw new Error('Smoke assertion failed: '+k+' = '+String(v));
}

const leftButton=await page.$('.nw-dock-toggle.left');
const rightButton=await page.$('.nw-dock-toggle.right');
if(!leftButton||!rightButton) throw new Error('Dock collapse buttons missing');
await leftButton.click();
if(!(await page.evaluate(()=>document.body.classList.contains('nw-left-collapsed')))) throw new Error('Left panel did not collapse');
await leftButton.click();
await rightButton.click();
if(!(await page.evaluate(()=>document.body.classList.contains('nw-right-collapsed')))) throw new Error('Right panel did not collapse');
await rightButton.click();

// Persistencia + idempotencia del workspace: al recargar debe conservar el panel
// izquierdo plegado y MutationObserver no debe duplicar controles.
await leftButton.click();
await page.reload({waitUntil:'domcontentloaded',timeout:60000});
await page.waitForFunction(()=>window.NAGWEB_WORKSPACE16===1 && !!document.querySelector('.nw-dock-toggle.left') && !!document.querySelector('.nw-dock-toggle.right'),{timeout:30000});
const workspaceState=await page.evaluate(()=>({
 leftPersisted:document.body.classList.contains('nw-left-collapsed'),
 leftToggles:document.querySelectorAll('.nw-dock-toggle.left').length,
 rightToggles:document.querySelectorAll('.nw-dock-toggle.right').length
}));
if(!workspaceState.leftPersisted) throw new Error('Left panel collapse state did not persist after reload');
if(workspaceState.leftToggles!==1||workspaceState.rightToggles!==1) throw new Error('Workspace controls duplicated after reload: '+JSON.stringify(workspaceState));
await page.click('.nw-dock-toggle.left');

if(pageErrors.length) throw new Error('Browser page errors:\n'+pageErrors.join('\n\n'));
console.log('NagWeb smoke OK',state);
await browser.close();
