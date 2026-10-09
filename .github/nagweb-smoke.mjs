import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import './nagweb-depth-model-test.mjs';
import './nagweb-stream-model-test.mjs';
import './nagweb-orbit-model-test.mjs';
import {runStorytellingSmoke} from './nagweb-storytelling-smoke.mjs';
import {runCompositionSmoke} from './nagweb-composition-smoke.mjs';
import {runHistorySmoke} from './nagweb-history-smoke.mjs';
import {runLegacySmoke} from './nagweb-legacy-smoke.mjs';
import {runTransparentSmoke} from './nagweb-transparent-smoke.mjs';
import {runCancelSmoke} from './nagweb-cancel-smoke.mjs';
import {runDepthSmoke} from './nagweb-depth-smoke.mjs';
import {runMotionLabSmoke} from './nagweb-motion-lab-smoke.mjs';
import {runTimeSmoke} from './nagweb-time-smoke.mjs';
import {runMotionGroupSmoke} from './nagweb-motion-group-smoke.mjs';
import {runMotionCanvasSmoke} from './nagweb-motion-canvas-smoke.mjs';
import {runMotionPrepareSmoke} from './nagweb-motion-prepare-smoke.mjs';
import {runMotionBankSmoke} from './nagweb-motion-bank-smoke.mjs';
import {runMotionTunnelSmoke} from './nagweb-motion-tunnel-smoke.mjs';
import {runMotionBloomSmoke} from './nagweb-motion-bloom-smoke.mjs';
import {runMotionTextSmoke} from './nagweb-motion-text-smoke.mjs';
import {runMotionUploadSmoke} from './nagweb-motion-upload-smoke.mjs';
import {runMotionStyleSmoke} from './nagweb-motion-style-smoke.mjs';
import {runMotionKeySmoke} from './nagweb-motion-key-smoke.mjs';
import {runMotionTransitionSmoke} from './nagweb-motion-transition-smoke.mjs';
import {runMotionPointsSmoke} from './nagweb-motion-points-smoke.mjs';
import {runMotionRetimeSmoke} from './nagweb-motion-retime-smoke.mjs';
import {runMotionLayersSmoke} from './nagweb-motion-layers-smoke.mjs';
import {runMotionDuplicateSmoke} from './nagweb-motion-duplicate-smoke.mjs';
import {runMotionRemoveSmoke} from './nagweb-motion-remove-smoke.mjs';
import {runMotionAddTextSmoke} from './nagweb-motion-add-text-smoke.mjs';
import {runMotionAddImageSmoke} from './nagweb-motion-add-image-smoke.mjs';
import {runMotionNameSmoke} from './nagweb-motion-name-smoke.mjs';
import {runMotionInspectorSmoke} from './nagweb-motion-inspector-smoke.mjs';
import {runMotionLibrarySmoke} from './nagweb-motion-library-smoke.mjs';
import {runMotionSearchSmoke} from './nagweb-motion-search-smoke.mjs';
import {runMotionExpandSmoke} from './nagweb-motion-expand-smoke.mjs';
import {runMotionDropSmoke} from './nagweb-motion-drop-smoke.mjs';
import {runMotionStreamSmoke} from './nagweb-motion-stream-smoke.mjs';
import {runMotionStreamPlacementSmoke} from './nagweb-motion-stream-placement-smoke.mjs';
import './nagweb-flip-model-test.mjs';
import './nagweb-orbit-carousel-model-test.mjs';
import './nagweb-column-drift-model-test.mjs';
import './nagweb-spotlight-model-test.mjs';
import './nagweb-sphere-model-test.mjs';
import './nagweb-sphere-cascade-model-test.mjs';
import './nagweb-totem-wall-model-test.mjs';
import './nagweb-parallax-totem-model-test.mjs';
import './nagweb-vortex-model-test.mjs';
import './nagweb-globe-model-test.mjs';
import './nagweb-orbit-globe-model-test.mjs';
import './nagweb-marquee-model-test.mjs';
import './nagweb-grid-strip-model-test.mjs';
import './nagweb-depth-stack-model-test.mjs';
import './nagweb-spread-model-test.mjs';
import './nagweb-scatter-model-test.mjs';
import {runMotionScatterSmoke} from './nagweb-motion-scatter-smoke.mjs';
import {runMotionScatterPathsSmoke} from './nagweb-motion-scatter-paths-smoke.mjs';
import './nagweb-fan-model-test.mjs';
import {runMotionFanSmoke} from './nagweb-motion-fan-smoke.mjs';
import './nagweb-feed-model-test.mjs';
import {runMotionFeedSmoke} from './nagweb-motion-feed-smoke.mjs';
import './nagweb-collage-model-test.mjs';
import {runMotionCollageSmoke} from './nagweb-motion-collage-smoke.mjs';
import './nagweb-triple-model-test.mjs';
import {runMotionTripleSmoke} from './nagweb-motion-triple-smoke.mjs';
import './nagweb-sweep-model-test.mjs';
import {runMotionSweepSmoke} from './nagweb-motion-sweep-smoke.mjs';
import './nagweb-spread-columns-model-test.mjs';
import {runMotionSpreadColumnsSmoke} from './nagweb-motion-spread-columns-smoke.mjs';
import {runMotionSpreadSmoke} from './nagweb-motion-spread-smoke.mjs';
import {runMotionDepthStackSmoke} from './nagweb-motion-depth-stack-smoke.mjs';
import {runMotionGridStripSmoke} from './nagweb-motion-grid-strip-smoke.mjs';
import {runMotionMarqueeSmoke} from './nagweb-motion-marquee-smoke.mjs';
import {runMotionOrbitGlobeSmoke} from './nagweb-motion-orbit-globe-smoke.mjs';
import {runMotionGlobeSmoke} from './nagweb-motion-globe-smoke.mjs';
import {runMotionParallaxTotemSmoke} from './nagweb-motion-parallax-totem-smoke.mjs';
import {runMotionVortexSmoke} from './nagweb-motion-vortex-smoke.mjs';
import {runMotionTotemWallSmoke} from './nagweb-motion-totem-wall-smoke.mjs';
import {runMotionSphereCascadeSmoke} from './nagweb-motion-sphere-cascade-smoke.mjs';
if(['sphere-wall','sphere-cascade','totem-wall','parallax-totem','vortex-spin','sphere-globe','orbit-globe','mosaic-marquee','grid-zoom-strip','depth-stack-scroll','spread-rows','spread-columns','sweep-ring','triple-scene','collage-reel','feed-scroll','fan-shuffle','scatter-dial'].includes(process.env.NAGWEB_SMOKE_SUITE))await import('./nagweb-sphere-renderer-test.mjs');
import {runMotionSphereSmoke} from './nagweb-motion-sphere-smoke.mjs';
import './nagweb-focus-slider-model-test.mjs';
import {runMotionFocusSliderSmoke} from './nagweb-motion-focus-slider-smoke.mjs';
import './nagweb-focus-orbit-model-test.mjs';
import {runMotionFocusOrbitSmoke} from './nagweb-motion-focus-orbit-smoke.mjs';
import {runMotionSpotlightSmoke} from './nagweb-motion-spotlight-smoke.mjs';
import {runMotionColumnDriftSmoke} from './nagweb-motion-column-drift-smoke.mjs';
import {runMotionOrbitCarouselSmoke} from './nagweb-motion-orbit-carousel-smoke.mjs';
import {runMotionFlipSmoke} from './nagweb-motion-flip-smoke.mjs';
import './nagweb-hero-model-test.mjs';
import {runMotionHeroSmoke} from './nagweb-motion-hero-smoke.mjs';
import './nagweb-mosaic-model-test.mjs';
import {runMotionMosaicSmoke} from './nagweb-motion-mosaic-smoke.mjs';
import './nagweb-stripe-model-test.mjs';
import {runMotionStripeSmoke} from './nagweb-motion-stripe-smoke.mjs';
import './nagweb-wipe-model-test.mjs';
import {runMotionWipeSmoke} from './nagweb-motion-wipe-smoke.mjs';
import './nagweb-split-model-test.mjs';
import {runMotionSplitSmoke} from './nagweb-motion-split-smoke.mjs';
import './nagweb-showcase-orbit-model-test.mjs';
import {runMotionShowcaseOrbitSmoke} from './nagweb-motion-showcase-orbit-smoke.mjs';
import './nagweb-cascade-deck-model-test.mjs';
import {runMotionCascadeDeckSmoke} from './nagweb-motion-cascade-deck-smoke.mjs';
import './nagweb-dance-model-test.mjs';
import {runMotionDanceSmoke} from './nagweb-motion-dance-smoke.mjs';
import './nagweb-trail-model-test.mjs';
import {runMotionTrailSmoke} from './nagweb-motion-trail-smoke.mjs';
import './nagweb-ring-model-test.mjs';
import './nagweb-ring-vertical-model-test.mjs';
import {runMotionRingSmoke} from './nagweb-motion-ring-smoke.mjs';
import './nagweb-cover-model-test.mjs';
import {runMotionCoverSmoke} from './nagweb-motion-cover-smoke.mjs';
import './nagweb-bottom-model-test.mjs';
import {runMotionBottomSmoke} from './nagweb-motion-bottom-smoke.mjs';
import './nagweb-spin-model-test.mjs';
import {runMotionSpinSmoke} from './nagweb-motion-spin-smoke.mjs';
import './nagweb-wheel-model-test.mjs';
import {runMotionWheelSmoke} from './nagweb-motion-wheel-smoke.mjs';
import './nagweb-photo-model-test.mjs';
import {runMotionPhotoSmoke} from './nagweb-motion-photo-smoke.mjs';
import './nagweb-burst-model-test.mjs';
import {runMotionBurstSmoke} from './nagweb-motion-burst-smoke.mjs';
import './nagweb-peel-model-test.mjs';
import {runMotionPeelSmoke} from './nagweb-motion-peel-smoke.mjs';
import './nagweb-band-model-test.mjs';
import {runMotionBandSmoke} from './nagweb-motion-band-smoke.mjs';
import './nagweb-spiral-model-test.mjs';
import {runMotionSpiralSmoke} from './nagweb-motion-spiral-smoke.mjs';
import './nagweb-shift-model-test.mjs';
import {runMotionFocusShiftSmoke,runMotionFocusShiftDepthSmoke} from './nagweb-motion-focus-shift-smoke.mjs';
import './nagweb-drop-model-test.mjs';
import {runMotionDropCascadeSmoke,runMotionDropCascadeDepthSmoke} from './nagweb-motion-drop-cascade-smoke.mjs';
import './nagweb-zoom-model-test.mjs';
import {runMotionZoomSmoke} from './nagweb-motion-zoom-smoke.mjs';
import './nagweb-reveal-model-test.mjs';
import {runMotionGridRevealSmoke} from './nagweb-motion-grid-reveal-smoke.mjs';
import './nagweb-diagonal-model-test.mjs';
import {runMotionDiagonalSmoke} from './nagweb-motion-diagonal-smoke.mjs';
import './nagweb-toss-model-test.mjs';
import {runMotionTossSmoke,runMotionTossDepthSmoke} from './nagweb-motion-toss-smoke.mjs';
import './nagweb-focus-model-test.mjs';
import {runMotionFocusSmoke,runMotionFocusDepthSmoke} from './nagweb-motion-focus-smoke.mjs';
import './nagweb-stack-model-test.mjs';
import {runMotionStackSmoke} from './nagweb-motion-stack-smoke.mjs';
import './nagweb-carousel-model-test.mjs';
import {runMotionCarouselSmoke} from './nagweb-motion-carousel-smoke.mjs';
import './nagweb-ticker-loop-model-test.mjs';
import {runMotionTickerLoopSmoke} from './nagweb-motion-ticker-loop-smoke.mjs';
import './nagweb-ticker-model-test.mjs';
import {runMotionTickerSmoke} from './nagweb-motion-ticker-smoke.mjs';
import './nagweb-orbit-bloom-model-test.mjs';
import {runMotionOrbitBloomDepthSmoke} from './nagweb-motion-orbit-bloom-depth-smoke.mjs';
import {runMotionOrbitBloomSmoke} from './nagweb-motion-orbit-bloom-smoke.mjs';
import './nagweb-stage-model-test.mjs';
import {runMotionStageSmoke} from './nagweb-motion-stage-smoke.mjs';
import './nagweb-pop-model-test.mjs';
import './nagweb-image-crop-model-test.mjs';
import {runMotionImageCropSmoke} from './nagweb-motion-image-crop-smoke.mjs';
import {runMotionPopGridSmoke} from './nagweb-motion-pop-grid-smoke.mjs';
import {runMotionIsoOrbitSmoke} from './nagweb-motion-iso-orbit-smoke.mjs';
import {runMotionBatchImagesSmoke} from './nagweb-motion-batch-images-smoke.mjs';

const suite=process.env.NAGWEB_SMOKE_SUITE||'all';
if(!['all','procedural','editor','diagonal','grid','zoom','drop','shift','spiral','film','totem','peel','burst','photo','wheel','spin','bottom','cover','cover-vertical','ring','ring-vertical','trail','dance','deck','showcase','split','wipe','stripe','mosaic','hero','flip','orbit-carousel','column-drift','spotlight','focus-orbit','focus-slider','sphere-wall','sphere-cascade','totem-wall','parallax-totem','vortex-spin','sphere-globe','orbit-globe','mosaic-marquee','grid-zoom-strip','depth-stack-scroll','spread-rows','spread-columns','sweep-ring','triple-scene','collage-reel','feed-scroll','fan-shuffle','scatter-dial'].includes(suite))throw new Error('Unknown NagWeb smoke suite: '+suite);

const feedbackSource=fs.readFileSync(new URL('../js/nagweb-feedback-v16.js',import.meta.url),'utf8');
const directorSource=fs.readFileSync(new URL('../js/nagweb-scroll-director-v16.js',import.meta.url),'utf8');
const universalSource=fs.readFileSync(new URL('../js/nagweb-universal-container.js',import.meta.url),'utf8');
const directionSource=fs.readFileSync(new URL('../js/nagweb-v14-direction.js',import.meta.url),'utf8');
const behaviorSource=fs.readFileSync(new URL('../js/nagweb-behaviors-v2.js',import.meta.url),'utf8');
const storySource=fs.readFileSync(new URL('../js/nagweb-story-editor.js',import.meta.url),'utf8');
const contractState={
 heroPartSelector:feedbackSource.includes('data-nw-part'),
 storyChapterSelector:['data-nw-story-ch="1"','data-nw-story-ch="2"','data-nw-story-ch="3"'].every(x=>feedbackSource.includes(x)),
 storyFollowScroll:feedbackSource.includes('data-nw-story-live'),
 storyEditableParts:["data-wpart=\"k'+i+'\"","data-wpart=\"t'+i+'\"","data-wpart=\"c'+i+'\"","data-wpart=\"media-'+i+'\""].every(x=>feedbackSource.includes(x)),
 kineticSticky:['nw-ks-sticky','nw-ks-track','nw-ks-progress'].every(x=>feedbackSource.includes(x)),
 directorScenePanel:['Director de scroll','data-sd-scrub','data-sd-play','data-sd-live'].every(x=>directorSource.includes(x)),
 directorElementPanel:['Momento en la historia','sdStart','sdEnd','sdEnter','sdExit'].every(x=>directorSource.includes(x)),
 directorExportRuntime:directorSource.includes('nw-scroll-director-css')&&directorSource.includes('sdEnabled'),
 directorQuickActions:directorSource.includes('data-sd-auto')&&directorSource.includes('data-sd-reset'),
 directorMotionControls:['sdMoveX','sdMoveY','sdRotate','sdScale','sdSpan'].every(x=>directorSource.includes(x)),
 directorTransitions:['fade','up','down','left','right','zoom','blur','depth','keep'].every(x=>directorSource.includes(x)),
 directorUniversalCompose:['--nw-uc-dx','--nw-uc-dy','--nw-uc-scale'].every(x=>directorSource.includes(x))&&['--nw-uc-dx','--nw-uc-dy','--nw-uc-scale'].every(x=>universalSource.includes(x)),
 directorPanelMatchesEligibility:directorSource.includes("raw.type==='light3d'||raw.fixed||raw.modal"),
 directorExportMatchesTimelineEligibility:directorSource.includes("e.type!=='light3d'&&!e.fixed&&!e.modal"),
 directorResetMatchesEligibility:directorSource.includes("if(e.type==='light3d'||e.fixed||e.modal)return"),
 directorAutoIncludesUniversalChildren:directorSource.includes('insideUniversal(e)')&&directorSource.includes("host.type==='container'&&host.universal"),
 directorAutoSkipsUniversalContainer:directorSource.includes("!(e.type==='container'&&e.universal)"),
 directorCssVarsCompose:['--nw-uc-dx','--nw-uc-dy','--nw-uc-scale','--nw-sd-x','--nw-sd-y','--nw-sd-scale'].every(x=>directorSource.includes(x)),
 directorScaleCompose:directorSource.includes('scale:calc(var(--nw-sd-scale,1) * var(--nw-uc-scale,1))'),
 directorOpacityCompose:directorSource.includes('--nw-sd-base-opacity')&&directorSource.includes('opacity:calc(var(--nw-sd-base-opacity,1) * var(--nw-sd-opacity,1))!important'),
 directorFilterCompose:directorSource.includes('--nw-sd-base-filter')&&directorSource.includes('filter:var(--nw-sd-base-filter,blur(0px)) blur(var(--nw-sd-blur,0px))'),
 directorPointerEventsPreserved:directorSource.includes("basePointer=cs.pointerEvents||'auto'")&&directorSource.includes("n.style.pointerEvents=op<.025?'none':q.basePointer"),
 directorDisablesUniversalTween:directorSource.includes('.nw-uc>[data-nw-sd-el]{transition:none!important}')&&!directorSource.includes('filter:blur(var(--nw-sd-blur,0px));transition:none!important;will-change:translate,scale,rotate,opacity,filter'),
 reducedMotionKeepsDirector:universalSource.includes('--nw-uc-dx:0px!important')&&universalSource.includes('--nw-uc-dy:0px!important')&&universalSource.includes('--nw-uc-scale:1!important')&&!universalSource.includes('.nw-uc>.el{translate:0 0!important;scale:1!important'),
 anchor3dSource:['NAGWEB_3D_ANCHOR','getBoundingClientRect','unproject(cam)','followSize','followCssRotation'].every(x=>directorSource.includes(x)),
 anchor3dExport:directorSource.includes('nw-3d-anchor-runtime')&&directorSource.includes('rt3DAnchor.toString()'),
 behaviorCatalogSource:directionSource.includes("ensureCategory('behavior','Comportamientos'")&&['reveal','hold','parallax','sticky','sceneTransition','cursor','magnet','depth','videoScrub','orbit3d'].every(x=>directionSource.includes(x+':{label:')),
 catalogLanguage:directionSource.includes("creativeCat.label='Plantillas animadas'")&&directionSource.includes("cat.desc='Aplican movimiento o interacción")&&behaviorSource.includes('<b>Comportamiento</b> = una acción')&&storySource.includes("Plantilla de movimiento"),
 behaviorRuntimeSource:directionSource.includes('function rtBehaviors(DATA)')&&directionSource.includes('nw-behaviors-runtime')&&directionSource.includes('nwVideoScrub')&&directionSource.includes('nw3dOrbit'),
 behaviorOrbitBridge:directorSource.includes("data-nw-3d-orbit")&&directorSource.includes('orbitSpeed')&&directorSource.includes('performance.now()-b.started')
};

const candidates=[process.env.NAGWEB_CHROME_EXECUTABLE,'/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const executablePath=candidates.find(p=>p&&fs.existsSync(p));
if(!executablePath) throw new Error('No Chromium/Chrome executable found on runner');

const browserArgs=['--no-sandbox','--disable-dev-shm-usage'];
if(process.env.NAGWEB_BROWSER_PROXY) browserArgs.push('--proxy-server='+process.env.NAGWEB_BROWSER_PROXY);
const browser=await puppeteer.launch({headless:true,executablePath,args:browserArgs,pipe:true,timeout:60000});
try{
const page=await browser.newPage();
await page.setViewport({width:1440,height:900,deviceScaleFactor:1});
const pageErrors=[];
page.on('pageerror',e=>{const detail=String(e&&e.stack||e);pageErrors.push(detail);console.error('Browser page error:',detail);});

await page.goto(process.env.NAGWEB_SMOKE_URL||'http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForFunction(()=>window.NAGWEB_FEEDBACK16===1 && !!window.NAGWEB_UNIVERSAL && !!window.NAGWEB_SCROLL_DIRECTOR,{timeout:30000});
await page.waitForSelector('#preview',{timeout:30000});
await page.waitForFunction(()=>{
 const f=document.querySelector('#preview');
 return !!(f&&f.contentDocument&&f.contentDocument.body&&f.contentDocument.body.innerHTML.length>50&&f.contentWindow.NAGWEB_3D_ANCHOR);
},{timeout:30000});

const state=Object.assign(await page.evaluate(()=>({
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
 directorApi:(()=>{const d=window.NAGWEB_SCROLL_DIRECTOR;return !!(d&&d.version==='2.0'&&typeof d.scrub==='function'&&typeof d.live==='function'&&typeof d.evaluate==='function');})(),
 directorScenePanel:(()=>{const s=String(window.paneSceneNew||'');return s.includes('Director de scroll')&&s.includes('data-sd-scrub')&&s.includes('data-sd-play')&&s.includes('data-sd-live');})(),
 directorElementPanel:(()=>{const s=String(window.paneElementNew||'');return s.includes('Momento en la historia')&&s.includes('sdStart')&&s.includes('sdEnd')&&s.includes('sdEnter')&&s.includes('sdExit');})(),
 directorPanelMatchesEligibility:(()=>{const s=Array.from(document.scripts).map(x=>x.textContent||'').join('\n');return s.includes("raw.type==='light3d'||raw.fixed||raw.modal");})(),
 directorExportRuntime:(()=>{const s=String(window.generateSite||'');return s.includes('nw-scroll-director-css')&&s.includes('sdEnabled');})(),
 directorExportMatchesTimelineEligibility:(()=>{const s=Array.from(document.scripts).map(x=>x.textContent||'').join('\n');return s.includes("e.type!=='light3d'&&!e.fixed&&!e.modal");})(),
 directorQuickActions:(()=>{const s=String(window.paneSceneNew||'');return s.includes('data-sd-auto')&&s.includes('data-sd-reset');})(),
 directorResetMatchesEligibility:(()=>{const s=Array.from(document.scripts).map(x=>x.textContent||'').join('\n');return s.includes("if(e.type==='light3d'||e.fixed||e.modal)return");})(),
 directorAutoIncludesUniversalChildren:(()=>{const s=Array.from(document.scripts).map(x=>x.textContent||'').join('\n');return s.includes('insideUniversal(e)')&&s.includes("host.type==='container'&&host.universal");})(),
 directorAutoSkipsUniversalContainer:(()=>{const s=Array.from(document.scripts).map(x=>x.textContent||'').join('\n');return s.includes("!(e.type==='container'&&e.universal)");})(),
 directorMotionControls:(()=>{const s=String(window.paneElementNew||'');return ['sdMoveX','sdMoveY','sdRotate','sdScale','sdSpan'].every(k=>s.includes(k));})(),
 directorTransitions:(()=>{const s=String(window.paneElementNew||'');return ['fade','up','down','left','right','zoom','blur','depth','keep'].every(k=>s.includes(k));})(),
 directorUniversalCompose:(()=>{const s=String(window.generateSite||'');return s.includes('nw-scroll-director-css')&&String(document.documentElement.innerHTML).includes('nagweb-universal-container.js');})(),
 directorCssVarsCompose:(()=>{const scripts=Array.from(document.scripts).map(x=>x.textContent||'').join('\n');return scripts.includes('--nw-uc-dx')&&scripts.includes('--nw-uc-dy')&&scripts.includes('--nw-uc-scale')&&scripts.includes('--nw-sd-x')&&scripts.includes('--nw-sd-y')&&scripts.includes('--nw-sd-scale');})(),
 directorScaleCompose:(()=>{const scripts=Array.from(document.scripts).map(x=>x.textContent||'').join('\n');return scripts.includes('scale:calc(var(--nw-sd-scale,1) * var(--nw-uc-scale,1))');})(),
 directorOpacityCompose:(()=>{const scripts=Array.from(document.scripts).map(x=>x.textContent||'').join('\n');return scripts.includes('--nw-sd-base-opacity')&&scripts.includes('opacity:calc(var(--nw-sd-base-opacity,1) * var(--nw-sd-opacity,1))!important');})(),
 directorFilterCompose:(()=>{const scripts=Array.from(document.scripts).map(x=>x.textContent||'').join('\n');return scripts.includes('--nw-sd-base-filter')&&scripts.includes('filter:var(--nw-sd-base-filter,blur(0px)) blur(var(--nw-sd-blur,0px))');})(),
 directorPointerEventsPreserved:(()=>{const scripts=Array.from(document.scripts).map(x=>x.textContent||'').join('\n');return scripts.includes("basePointer=cs.pointerEvents||'auto'")&&scripts.includes("n.style.pointerEvents=op<.025?'none':q.basePointer");})(),
 directorDisablesUniversalTween:(()=>{const scripts=Array.from(document.scripts).map(x=>x.textContent||'').join('\n');return scripts.includes('.nw-uc>[data-nw-sd-el]{transition:none!important}')&&!scripts.includes('filter:blur(var(--nw-sd-blur,0px));transition:none!important;will-change:translate,scale,rotate,opacity,filter');})(),
 reducedMotionKeepsDirector:(()=>{const scripts=Array.from(document.scripts).map(x=>x.textContent||'').join('\n');return scripts.includes('--nw-uc-dx:0px!important')&&scripts.includes('--nw-uc-dy:0px!important')&&scripts.includes('--nw-uc-scale:1!important')&&!scripts.includes('.nw-uc>.el{translate:0 0!important;scale:1!important');})(),
 directorUniversalLoaded:(()=>{const u=window.NAGWEB_UNIVERSAL,d=window.NAGWEB_SCROLL_DIRECTOR;return !!(u&&u.version&&d&&d.version);})(),
 anchor3dApi:(()=>{const a=window.NAGWEB_3D_ANCHOR;return !!(a&&a.version==='1.0'&&typeof a.bind==='function'&&typeof a.unbind==='function'&&typeof a.refresh==='function');})(),
 anchor3dPreviewApi:(()=>{const f=document.querySelector('#preview'),a=f&&f.contentWindow&&f.contentWindow.NAGWEB_3D_ANCHOR;return !!(a&&a.version==='1.0'&&typeof a.bind==='function');})(),
 behaviorApi:(()=>{const b=window.NAGWEB_BEHAVIORS,l=b&&typeof b.list==='function'?b.list():[];return !!(b&&b.version==='2.0'&&typeof b.apply==='function'&&typeof b.toggle==='function'&&l.length===10&&['Revelar','Mantener','Parallax','Seguir cursor','Magnetismo','Scrub de video','Sticky','Transición de escena','Profundidad','Órbita 3D'].every(n=>l.some(x=>x.label===n)));})(),
 behaviorCategory:(()=>{try{const c=INSERT_CATS.find(x=>x.key==='behavior'),items=c&&c.items&&c.items();return !!(c&&c.label==='Comportamientos'&&Array.isArray(items)&&items.length===10);}catch(_){return false}})(),
 catalogLanguage:(()=>{try{const p=INSERT_CATS.find(x=>x.key==='creative'),b=INSERT_CATS.find(x=>x.key==='behavior');return !!(p&&p.label==='Plantillas animadas'&&p.desc&&b&&b.desc&&/elemento que ya seleccionaste/.test(b.desc));}catch(_){return false}})()
})),contractState);
for(const [k,v] of Object.entries(state)){
 if(!v) throw new Error('Smoke assertion failed: '+k+' = '+String(v));
}

const anchor3dState=await page.evaluate(()=>{
 const host=document.createElement('div');
 host.style.cssText='position:fixed;left:100px;top:120px;width:100px;height:50px;scale:1;rotate:0deg;pointer-events:none;';
 document.body.appendChild(host);
 function vec(x=0,y=0,z=0){return{x,y,z,set(a,b,c){this.x=a;this.y=b;this.z=c;}}}
 const object={position:vec(),scale:vec(1,1,1),rotation:vec()};
 const handle=window.NAGWEB_3D_ANCHOR.bind(host,object,{}, {
  project:({ndcX,ndcY})=>({x:ndcX,y:ndcY,z:3}),
  scale:2,rotationZ:15
 });
 const first={x:object.position.x,scale:object.scale.x,rot:object.rotation.z};
 host.style.left='300px';host.style.width='200px';host.style.height='100px';host.style.scale='1.5';host.style.rotate='10deg';
 handle.update();
 const second={x:object.position.x,y:object.position.y,z:object.position.z,scale:object.scale.x,rot:object.rotation.z,snapshot:handle.snapshot()};
 handle.destroy();host.remove();
 return{
  moved:Math.abs(second.x-first.x)>.05,
  projected:second.z===3,
  scaled:Math.abs(second.scale-6)<.05,
  rotated:Math.abs(second.rot-(25*Math.PI/180))<.03,
  snapshot:!!(second.snapshot&&second.snapshot.anchorRect&&second.snapshot.viewportRect),
  cleaned:window.NAGWEB_3D_ANCHOR.count()===0
 };
});
for(const [k,v] of Object.entries(anchor3dState)){
 if(!v) throw new Error('3D anchor assertion failed: '+k+' = '+String(v));
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

const inspectorGrip=await page.$('.nw-inspector-resize');
if(!inspectorGrip) throw new Error('Inspector resize grip missing');
// Dock transitions must settle before locating and measuring the resize grip.
await page.waitForFunction(()=>Math.abs(document.querySelector('.col.inspector').getBoundingClientRect().width-window.NAGWEB_WORKSPACE16_API.rightWidth())<1,{timeout:3000});
const inspectorBefore=await page.$eval('.col.inspector',n=>n.getBoundingClientRect().width);
const gripBox=await inspectorGrip.boundingBox();
await page.mouse.move(gripBox.x+gripBox.width/2,gripBox.y+80);
await page.mouse.down();
await page.mouse.move(gripBox.x-80,gripBox.y+80,{steps:5});
await page.mouse.up();
// State is saved on pointer-up; layout can still be inside its 220 ms transition.
await page.waitForFunction(()=>{const w=window.NAGWEB_WORKSPACE16_API.state().rightWidth;return w&&Math.abs(document.querySelector('.col.inspector').getBoundingClientRect().width-w)<1;},{timeout:3000});
const inspectorAfter=await page.$eval('.col.inspector',n=>n.getBoundingClientRect().width);
if(inspectorAfter<inspectorBefore+50) throw new Error('Inspector did not resize wider: '+JSON.stringify({inspectorBefore,inspectorAfter}));
const savedInspectorWidth=await page.evaluate(()=>window.NAGWEB_WORKSPACE16_API&&window.NAGWEB_WORKSPACE16_API.state().rightWidth);
if(!savedInspectorWidth||Math.abs(savedInspectorWidth-inspectorAfter)>3) throw new Error('Inspector width was not persisted in workspace state');

// Persistencia + idempotencia del workspace: al recargar debe conservar el panel
// izquierdo plegado y MutationObserver no debe duplicar controles.
await leftButton.click();
await page.reload({waitUntil:'domcontentloaded',timeout:60000});
await page.waitForFunction(()=>window.NAGWEB_WORKSPACE16===1 && !!document.querySelector('.nw-dock-toggle.left') && !!document.querySelector('.nw-dock-toggle.right'),{timeout:30000});
const workspaceState=await page.evaluate(()=>({
 leftPersisted:document.body.classList.contains('nw-left-collapsed'),
 leftToggles:document.querySelectorAll('.nw-dock-toggle.left').length,
 rightToggles:document.querySelectorAll('.nw-dock-toggle.right').length,
 rightWidth:window.NAGWEB_WORKSPACE16_API&&window.NAGWEB_WORKSPACE16_API.rightWidth()
}));
if(!workspaceState.leftPersisted) throw new Error('Left panel collapse state did not persist after reload');
if(workspaceState.leftToggles!==1||workspaceState.rightToggles!==1) throw new Error('Workspace controls duplicated after reload: '+JSON.stringify(workspaceState));
if(Math.abs(workspaceState.rightWidth-savedInspectorWidth)>3) throw new Error('Inspector width did not survive reload: '+JSON.stringify({workspaceState,savedInspectorWidth}));
await page.click('.nw-dock-toggle.left');

if(suite==='all'||suite==='procedural'){
await runMotionTossSmoke(page);
await runMotionTossDepthSmoke(page);
await runMotionStreamPlacementSmoke(page,'card-toss');
await runMotionFocusSmoke(page);
await runMotionFocusDepthSmoke(page);
await runMotionStreamPlacementSmoke(page,'iso-focus-sequence');
await runMotionStackSmoke(page);
await runMotionStreamPlacementSmoke(page,'stack-slide');
await runMotionCarouselSmoke(page);
await runMotionStreamPlacementSmoke(page,'carousel-flow');
await runMotionTickerLoopSmoke(page);
await runMotionStreamPlacementSmoke(page,'ticker-loop');
await runMotionTickerSmoke(page);
await runMotionStreamPlacementSmoke(page,'ticker-tilt');
await runMotionOrbitBloomDepthSmoke(page);
await runMotionOrbitBloomSmoke(page);
await runMotionStreamPlacementSmoke(page,'orbit-bloom');
await runMotionStageSmoke(page);
await runMotionStreamPlacementSmoke(page,'center-stage');
await runMotionImageCropSmoke(page);
await runMotionStreamPlacementSmoke(page);
await runMotionStreamSmoke(page);
await runMotionStreamPlacementSmoke(page,'iso-orbit');
await runMotionIsoOrbitSmoke(page);
await runMotionStreamPlacementSmoke(page,'pop-grid');
await runMotionPopGridSmoke(page);
await runMotionBatchImagesSmoke(page);
}
if(suite==='all'||suite==='editor'){
await runMotionDropSmoke(page);
await runMotionExpandSmoke(page);
await runHistorySmoke(page);
await runLegacySmoke(page);
await runCancelSmoke(page);
await runDepthSmoke(page);
await runMotionLabSmoke(page);
await runTimeSmoke(page);
await runMotionGroupSmoke(page);
await runMotionCanvasSmoke(page);
await runMotionPrepareSmoke(page);
await runMotionBankSmoke(page);
await runMotionTunnelSmoke(page);
await runMotionBloomSmoke(page);
await runMotionTextSmoke(page);
await runMotionUploadSmoke(page);
await runMotionStyleSmoke(page);
await runMotionKeySmoke(page);
await runMotionTransitionSmoke(page);
await runMotionPointsSmoke(page);
await runMotionRetimeSmoke(page);
await runMotionLayersSmoke(page);
await runMotionDuplicateSmoke(page);
await runMotionRemoveSmoke(page);
await runMotionAddTextSmoke(page);
await runMotionAddImageSmoke(page);
await runMotionNameSmoke(page);
await runMotionInspectorSmoke(page);
await runMotionLibrarySmoke(page);
await runMotionSearchSmoke(page);
await runStorytellingSmoke(page);
await runCompositionSmoke(page);
await runTransparentSmoke(page);
}
if(suite==='all'||suite==='diagonal'){
for(const kind of ['diagonal-carousel','iso-cascade']){await runMotionDiagonalSmoke(page,kind);await runMotionStreamPlacementSmoke(page,kind);}
}
if(suite==='all'||suite==='flip'){await runMotionFlipSmoke(page);await runMotionStreamPlacementSmoke(page,'flip-grid');await runMotionBatchImagesSmoke(page,['flip-grid']);}
if(suite==='all'||suite==='orbit-carousel'){await runMotionOrbitCarouselSmoke(page);await runMotionStreamPlacementSmoke(page,'orbit-carousel');await runMotionBatchImagesSmoke(page,['orbit-carousel']);}
if(suite==='all'||suite==='column-drift'){await runMotionColumnDriftSmoke(page);await runMotionStreamPlacementSmoke(page,'column-drift');await runMotionBatchImagesSmoke(page,['column-drift']);}
if(suite==='all'||suite==='spotlight'){await runMotionSpotlightSmoke(page);await runMotionStreamPlacementSmoke(page,'spotlight-zoom');await runMotionBatchImagesSmoke(page,['spotlight-zoom']);}
if(suite==='all'||suite==='sphere-wall'){await runMotionSphereSmoke(page);await runMotionStreamPlacementSmoke(page,'sphere-wall');await runMotionBatchImagesSmoke(page,['sphere-wall']);}
if(suite==='all'||suite==='sphere-cascade'){await runMotionSphereCascadeSmoke(page);await runMotionStreamPlacementSmoke(page,'sphere-cascade');await runMotionBatchImagesSmoke(page,['sphere-cascade']);}
if(suite==='all'||suite==='totem-wall'){await runMotionTotemWallSmoke(page);await runMotionStreamPlacementSmoke(page,'totem-wall');await runMotionBatchImagesSmoke(page,['totem-wall']);}
if(suite==='all'||suite==='parallax-totem'){await runMotionParallaxTotemSmoke(page);await runMotionStreamPlacementSmoke(page,'parallax-totem');await runMotionBatchImagesSmoke(page,['parallax-totem']);}
if(suite==='all'||suite==='scatter-dial'){await runMotionScatterSmoke(page);await runMotionScatterPathsSmoke(page);await runMotionStreamPlacementSmoke(page,'scatter-dial');await runMotionBatchImagesSmoke(page,['scatter-dial']);}
if(suite==='all'||suite==='fan-shuffle'){await runMotionFanSmoke(page);await runMotionStreamPlacementSmoke(page,'fan-shuffle');await runMotionBatchImagesSmoke(page,['fan-shuffle']);}
if(suite==='all'||suite==='feed-scroll'){await runMotionFeedSmoke(page);await runMotionStreamPlacementSmoke(page,'feed-scroll');await runMotionBatchImagesSmoke(page,['feed-scroll']);}
if(suite==='all'||suite==='collage-reel'){await runMotionCollageSmoke(page);await runMotionStreamPlacementSmoke(page,'collage-reel');await runMotionBatchImagesSmoke(page,['collage-reel']);}
if(suite==='all'||suite==='triple-scene'){await runMotionTripleSmoke(page);await runMotionStreamPlacementSmoke(page,'triple-scene');await runMotionBatchImagesSmoke(page,['triple-scene']);}
if(suite==='all'||suite==='sweep-ring'){await runMotionSweepSmoke(page);await runMotionStreamPlacementSmoke(page,'sweep-ring');await runMotionBatchImagesSmoke(page,['sweep-ring']);}
if(suite==='all'||suite==='spread-columns'){await runMotionSpreadColumnsSmoke(page);await runMotionStreamPlacementSmoke(page,'spread-columns');await runMotionBatchImagesSmoke(page,['spread-columns']);}
if(suite==='all'||suite==='spread-rows'){await runMotionSpreadSmoke(page);await runMotionStreamPlacementSmoke(page,'spread-rows');await runMotionBatchImagesSmoke(page,['spread-rows']);}
if(suite==='all'||suite==='depth-stack-scroll'){await runMotionDepthStackSmoke(page);await runMotionStreamPlacementSmoke(page,'depth-stack-scroll');await runMotionBatchImagesSmoke(page,['depth-stack-scroll']);}
if(suite==='all'||suite==='grid-zoom-strip'){await runMotionGridStripSmoke(page);await runMotionStreamPlacementSmoke(page,'grid-zoom-strip');await runMotionBatchImagesSmoke(page,['grid-zoom-strip']);}
if(suite==='all'||suite==='mosaic-marquee'){await runMotionMarqueeSmoke(page);await runMotionStreamPlacementSmoke(page,'mosaic-marquee');await runMotionBatchImagesSmoke(page,['mosaic-marquee']);}
if(suite==='all'||suite==='orbit-globe'){await runMotionOrbitGlobeSmoke(page);await runMotionStreamPlacementSmoke(page,'orbit-globe');await runMotionBatchImagesSmoke(page,['orbit-globe']);}
if(suite==='all'||suite==='sphere-globe'){await runMotionGlobeSmoke(page);await runMotionStreamPlacementSmoke(page,'sphere-globe');await runMotionBatchImagesSmoke(page,['sphere-globe']);}
if(suite==='all'||suite==='vortex-spin'){await runMotionVortexSmoke(page);await runMotionStreamPlacementSmoke(page,'vortex-spin');await runMotionBatchImagesSmoke(page,['vortex-spin']);}
if(suite==='all'||suite==='focus-slider'){await runMotionFocusSliderSmoke(page);await runMotionStreamPlacementSmoke(page,'focus-slider');await runMotionBatchImagesSmoke(page,['focus-slider']);}
if(suite==='all'||suite==='focus-orbit'){await runMotionFocusOrbitSmoke(page);await runMotionStreamPlacementSmoke(page,'focus-orbit');await runMotionBatchImagesSmoke(page,['focus-orbit']);}




if(suite==='all'||suite==='hero'){await runMotionHeroSmoke(page);await runMotionStreamPlacementSmoke(page,'hero-reel');await runMotionBatchImagesSmoke(page,['hero-reel']);}
if(suite==='all'||suite==='mosaic'){await runMotionMosaicSmoke(page);await runMotionStreamPlacementSmoke(page,'mosaic-wipe');await runMotionBatchImagesSmoke(page,['mosaic-wipe']);}
if(suite==='all'||suite==='stripe'){await runMotionStripeSmoke(page);await runMotionStreamPlacementSmoke(page,'stripe-reveal');await runMotionBatchImagesSmoke(page,['stripe-reveal']);}
if(suite==='all'||suite==='wipe'){await runMotionWipeSmoke(page);await runMotionStreamPlacementSmoke(page,'diagonal-wipe');await runMotionBatchImagesSmoke(page,['diagonal-wipe']);}
if(suite==='all'||suite==='split'){await runMotionSplitSmoke(page);await runMotionStreamPlacementSmoke(page,'split-reveal');await runMotionBatchImagesSmoke(page,['split-reveal']);}
if(suite==='all'||suite==='showcase'){await runMotionShowcaseOrbitSmoke(page);await runMotionStreamPlacementSmoke(page,'orbit-showcase');await runMotionBatchImagesSmoke(page,['orbit-showcase']);}
if(suite==='all'||suite==='deck'){await runMotionCascadeDeckSmoke(page);await runMotionStreamPlacementSmoke(page,'cascade-deck');await runMotionBatchImagesSmoke(page,['cascade-deck']);}
if(suite==='all'||suite==='dance'){await runMotionDanceSmoke(page);await runMotionStreamPlacementSmoke(page,'position-dance');await runMotionBatchImagesSmoke(page,['position-dance']);}
if(suite==='all'||suite==='trail'){await runMotionTrailSmoke(page);await runMotionStreamPlacementSmoke(page,'image-trail');await runMotionBatchImagesSmoke(page,['image-trail']);}
if(suite==='all'||suite==='ring-vertical'){await runMotionRingSmoke(page,'cover-ring-vertical');await runMotionStreamPlacementSmoke(page,'cover-ring-vertical');await runMotionBatchImagesSmoke(page,['cover-ring-vertical']);}
if(suite==='all'||suite==='ring'){await runMotionRingSmoke(page);await runMotionStreamPlacementSmoke(page,'cover-ring');await runMotionBatchImagesSmoke(page,['cover-ring']);}
for(const [coverSuite,coverTemplate] of [['cover','cover-flow'],['cover-vertical','cover-flow-vertical']])if(suite==='all'||suite===coverSuite){await runMotionCoverSmoke(page,coverTemplate);await runMotionStreamPlacementSmoke(page,coverTemplate);await runMotionBatchImagesSmoke(page,[coverTemplate]);}
if(suite==='all'||suite==='bottom'){await runMotionBottomSmoke(page);await runMotionStreamPlacementSmoke(page,'wheel-spin-bottom');await runMotionBatchImagesSmoke(page,['wheel-spin-bottom']);}
if(suite==='all'||suite==='spin'){await runMotionSpinSmoke(page);await runMotionStreamPlacementSmoke(page,'wheel-spin');await runMotionBatchImagesSmoke(page,['wheel-spin']);}
if(suite==='all'||suite==='wheel'){await runMotionWheelSmoke(page);await runMotionStreamPlacementSmoke(page,'wheel-carousel');await runMotionBatchImagesSmoke(page,['wheel-carousel']);}
if(suite==='all'||suite==='photo'){await runMotionPhotoSmoke(page);await runMotionStreamPlacementSmoke(page,'photo-orbit');await runMotionBatchImagesSmoke(page,['photo-orbit']);}
if(suite==='all'||suite==='burst'){await runMotionBurstSmoke(page);await runMotionStreamPlacementSmoke(page,'poster-burst');await runMotionBatchImagesSmoke(page,['poster-burst']);}
if(suite==='all'||suite==='peel'){await runMotionPeelSmoke(page);await runMotionStreamPlacementSmoke(page,'deck-peel');await runMotionBatchImagesSmoke(page,['deck-peel']);}
for(const [bandSuite,bandTemplate] of [['film','film-strip'],['totem','card-totem']])if(suite==='all'||suite===bandSuite){await runMotionBandSmoke(page,bandTemplate);await runMotionStreamPlacementSmoke(page,bandTemplate);await runMotionBatchImagesSmoke(page,[bandTemplate]);}
if(suite==='all'||suite==='spiral'){await runMotionSpiralSmoke(page);await runMotionStreamPlacementSmoke(page,'spiral-stream');await runMotionBatchImagesSmoke(page,['spiral-stream']);}
if(suite==='all'||suite==='shift'){await runMotionFocusShiftSmoke(page);await runMotionFocusShiftDepthSmoke(page);await runMotionStreamPlacementSmoke(page,'focus-shift');await runMotionImageCropSmoke(page,['focus-shift']);await runMotionBatchImagesSmoke(page,['focus-shift']);}
if(suite==='all'||suite==='drop'){await runMotionDropCascadeSmoke(page);await runMotionDropCascadeDepthSmoke(page);await runMotionStreamPlacementSmoke(page,'cascade-drop');await runMotionImageCropSmoke(page,['cascade-drop']);await runMotionBatchImagesSmoke(page,['cascade-drop']);}
if(suite==='all'||suite==='zoom'){await runMotionZoomSmoke(page);await runMotionStreamPlacementSmoke(page,'zoom-parallax');await runMotionBatchImagesSmoke(page,['zoom-parallax']);}
if(suite==='all'||suite==='grid'){await runMotionGridRevealSmoke(page);await runMotionStreamPlacementSmoke(page,'grid-reveal');await runMotionBatchImagesSmoke(page,['grid-reveal']);}
if(pageErrors.length) throw new Error('Browser page errors:\n'+pageErrors.join('\n\n'));
console.log('NagWeb smoke OK',suite,state);
}finally{
await browser.close();
}
