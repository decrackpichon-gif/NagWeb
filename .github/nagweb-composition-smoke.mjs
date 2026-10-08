import assert from 'node:assert/strict';
import fs from 'node:fs';
const near=(a,b,t=.04)=>assert.ok(Math.abs(a-b)<t,`${a} ≠ ${b}`);

export async function runCompositionSmoke(page){
 // Two seconds of synthetic video, with a keyframe in every frame, no network dependency.
 const videoUrl='data:video/webm;base64,'+fs.readFileSync(new URL('./fixtures/story-probe.webm',import.meta.url)).toString('base64');
 await page.evaluate(videoUrl=>{
  const s=JSON.parse(JSON.stringify(sec()));s.id='compose-scene';s.sdEnabled=true;s.sdLength=300;s.layout='free';s.stType='cut';s.pin=false;
  s.elements=[
   mkEl('container',{id:'compose-universal',universal:true,name:'Escena universal',w:85,h:360,x:50,y:50,ucFx:'depth',ucDepth:40,sdEnter:'none',sdEnd:100}),
   mkEl('heading',{id:'compose-child',parent:'compose-universal',text:'Narrativa',x:30,y:35,w:45,anim:'fade-up',opac:.6,ucReaction:'depth',ucStrength:100,sdKeyframes:[{at:0,x:0,opacity:100},{at:100,x:200,y:-40,scale:150,rotate:20,opacity:50,blur:4}]}),
   mkEl('container',{id:'compose-group',parent:'compose-universal',w:30,h:100,x:65,y:60}),
   mkEl('paragraph',{id:'compose-nested',parent:'compose-group',text:'Hijo anidado',ucReaction:'depth',ucStrength:100,sdKeyframes:[{at:0},{at:100,x:100}]}),
   mkEl('video',{id:'compose-video',url:videoUrl,nwVideoScrub:true,nwVideoScrubSpan:100,w:15,x:85,y:80,sdEnter:'none',sdEnd:100}),
  ];
  project.pages[0].sections=[s];curSec=0;curEl=1;selection=['compose-child'];renderPane();renderPreview();
  const p=Object.assign({},flattenPage(page()),{sections:[s]});
  let html=generateSite(p,false,false,false);
  // Authored base styling must survive Director + Universal + reduced motion.
  html=html.replace('</head>','<style>[data-id="compose-child"]{filter:brightness(.8) blur(1px);pointer-events:none;transform:rotate(12deg) scale(1.3)}</style></head>');
  const frame=document.createElement('iframe');frame.id='composition-export';frame.style.cssText='width:1000px;height:600px';frame.srcdoc=html;document.body.append(frame);
 },videoUrl);
 await page.waitForFunction(()=>document.querySelector('#composition-export')?.contentWindow?.NAGWEB_3D_ANCHOR&&document.querySelector('#preview')?.contentWindow?.__NAG_SCROLL_DIRECTOR?.['compose-scene']);
 await page.waitForFunction(()=>{const v=document.querySelector('#composition-export')?.contentDocument?.querySelector('[data-id="compose-video"]');return v&&Number.isFinite(v.duration)&&v.duration>0;});
 await page.evaluate(()=>{
  const f=document.querySelector('#composition-export'),w=f.contentWindow,d=f.contentDocument,u=d.querySelector('[data-id="compose-universal"]');
  w.__NAG_SCROLL_DIRECTOR['compose-scene'].set(.5);
  const r=u.getBoundingClientRect();u.dispatchEvent(new w.PointerEvent('pointermove',{clientX:r.left+r.width*.9,clientY:r.top+r.height*.7,bubbles:true}));
 });
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const compose=await page.evaluate(()=>{
  const f=document.querySelector('#composition-export'),w=f.contentWindow,n=f.contentDocument.querySelector('[data-id="compose-child"]'),nested=f.contentDocument.querySelector('[data-id="compose-nested"]'),cs=w.getComputedStyle(n),ns=w.getComputedStyle(nested);
  return{x:parseFloat(cs.translate),sdX:parseFloat(n.style.getPropertyValue('--nw-sd-x')),ucX:parseFloat(n.style.getPropertyValue('--nw-uc-dx')),scale:parseFloat(cs.scale),opacity:+cs.opacity,filter:cs.filter,pointer:cs.pointerEvents,transform:cs.transform,nestedX:parseFloat(ns.translate),nestedUC:parseFloat(nested.style.getPropertyValue('--nw-uc-dx')),anim:n.dataset.anim};
 });
 near(compose.sdX,100);assert.ok(Math.abs(compose.ucX)>1);near(compose.x,100+compose.ucX);near(compose.scale,1.25);near(compose.opacity,.45);
 assert.ok(compose.filter.includes('brightness(0.8)')&&compose.filter.includes('blur(1px)')&&compose.filter.includes('blur(2px)'));
 assert.equal(compose.pointer,'none');assert.equal(compose.anim,'none');assert.notEqual(compose.transform,'none');
 near(compose.nestedX,50+compose.nestedUC);assert.ok(Math.abs(compose.nestedUC)>0);
 const video=await page.evaluate(()=>{const f=document.querySelector('#composition-export'),v=f.contentDocument.querySelector('[data-id="compose-video"]');return{time:v.currentTime,duration:v.duration,paused:v.paused,autoplay:v.hasAttribute('autoplay')};});
 near(video.time,video.duration*.5);assert.ok(video.paused&&!video.autoplay);

 const anchor=await page.evaluate(()=>{
  const f=document.querySelector('#composition-export'),w=f.contentWindow,n=f.contentDocument.querySelector('[data-id="compose-child"]');
  const vec=()=>({x:0,y:0,z:0,set(x,y,z){Object.assign(this,{x,y,z});}}),o={position:vec(),scale:vec(),rotation:vec()};Object.assign(o.scale,{x:1,y:1,z:1});
  const handle=w.NAGWEB_3D_ANCHOR.bind(n,o,{}, {project:({ndcX,ndcY})=>({x:ndcX,y:ndcY,z:3})});
  w.__NAG_SCROLL_DIRECTOR['compose-scene'].set(.2);handle.update();const first=o.position.x;
  w.__NAG_SCROLL_DIRECTOR['compose-scene'].set(.7);handle.update();const out={delta:o.position.x-first,scale:o.scale.x,rot:o.rotation.z};handle.destroy();return out;
 });
 assert.ok(Math.abs(anchor.delta)>.05);near(anchor.scale,1.35);near(anchor.rot,14*Math.PI/180);

 await page.evaluate(()=>NAGWEB_SCROLL_DIRECTOR.scrub('compose-scene',.25));
 await page.waitForFunction(()=>document.querySelector('#preview').contentDocument.querySelector('[data-id="compose-child"]').style.getPropertyValue('--nw-sd-x')==='50.00px');
 await page.waitForFunction(()=>{const v=document.querySelector('#preview').contentDocument.querySelector('[data-id="compose-video"]');return Number.isFinite(v.duration)&&Math.abs(v.currentTime/v.duration-.25)<.02;});
 await page.click('[data-sd-play="compose-scene"]');
 // Playback restarts at zero; wait past the first frames and the asynchronous scrub message.
 const playHandle=await page.waitForFunction(()=>{const p=NAGWEB_SCROLL_DIRECTOR.progress('compose-scene'),f=document.querySelector('#preview'),runtime=f.contentWindow.__NAG_SCROLL_DIRECTOR['compose-scene'].progress()*100,x=parseFloat(f.contentDocument.querySelector('[data-id="compose-child"]').style.getPropertyValue('--nw-sd-x'));return p>6&&p<20&&Math.abs(runtime-p)<.5&&Math.abs(x-p*2)<1?{p,x}:false;});
 const play=await playHandle.jsonValue();await playHandle.dispose();
 near(play.x,play.p*2,1);
 await page.evaluate(()=>{NAGWEB_SCROLL_DIRECTOR.live('compose-scene');const w=document.querySelector('#composition-export').contentWindow;w.__NAG_SCROLL_DIRECTOR['compose-scene'].live();const n=w.document.querySelector('[data-id="compose-scene"]');w.scrollTo(0,n.getBoundingClientRect().top+w.scrollY+(n.offsetHeight-w.innerHeight)*.5);});
 await page.waitForFunction(()=>document.querySelector('#composition-export').contentDocument.querySelector('[data-id="compose-child"]').style.getPropertyValue('--nw-sd-x')==='100.00px');
 // The editor's live playhead and "here" actions must use actual preview progress.
 await page.evaluate(()=>{const w=document.querySelector('#preview').contentWindow,n=w.document.querySelector('[data-id="compose-scene"]');w.scrollTo(0,n.getBoundingClientRect().top+w.scrollY+(n.offsetHeight-w.innerHeight)*.5);});
 await page.waitForFunction(()=>Math.abs(NAGWEB_SCROLL_DIRECTOR.progress('compose-scene')-50)<.1&&Math.abs(+document.querySelector('[data-sd-scrub="compose-scene"]').value-50)<.1);
 assert.equal(await page.$('[data-story-beat-add]'),null);
 const liveRuler=await page.$eval('[data-story-scrub-ruler]',n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};});
 await page.mouse.click(liveRuler.x+liveRuler.w*.62,liveRuler.y+liveRuler.h/2);
 const liveScrub=await page.evaluate(()=>({p:NAGWEB_SCROLL_DIRECTOR.progress('compose-scene'),slider:+document.querySelector('[data-sd-scrub="compose-scene"]').value}));
 near(liveScrub.p,62,1);near(liveScrub.slider,62,1);

 await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
 await page.waitForFunction(()=>document.querySelector('#composition-export').contentDocument.querySelector('[data-id="compose-child"]').style.getPropertyValue('--nw-sd-x')==='0.00px');
 const reduced=await page.evaluate(()=>{const f=document.querySelector('#composition-export'),n=f.contentDocument.querySelector('[data-id="compose-child"]'),c=f.contentWindow.getComputedStyle(n);return{x:parseFloat(c.translate),scale:parseFloat(c.scale),opacity:+c.opacity,filter:c.filter,transform:c.transform,pointer:c.pointerEvents};});
 near(reduced.x,0);near(reduced.scale,1);near(reduced.opacity,.45);assert.equal(reduced.transform,compose.transform);assert.ok(reduced.filter.includes('brightness(0.8)')&&reduced.filter.includes('blur(1px)'));assert.equal(reduced.pointer,'none');
 const frozenVideo=await page.evaluate(()=>{const f=document.querySelector('#composition-export'),v=f.contentDocument.querySelector('[data-id="compose-video"]'),before=v.currentTime;f.contentWindow.__NAG_SCROLL_DIRECTOR['compose-scene'].set(.8);return v.currentTime===before;});assert.ok(frozenVideo);
 // Also load a fresh export with reduced motion already enabled; base capture must match.
 await page.evaluate(()=>{const old=document.querySelector('#composition-export'),fresh=old.cloneNode();old.replaceWith(fresh);});
 await page.waitForFunction(()=>document.querySelector('#composition-export')?.contentWindow?.__NAG_SCROLL_DIRECTOR?.['compose-scene']);
 const reducedBoot=await page.evaluate(()=>{const f=document.querySelector('#composition-export'),w=f.contentWindow;w.__NAG_SCROLL_DIRECTOR['compose-scene'].set(.5);const c=w.getComputedStyle(f.contentDocument.querySelector('[data-id="compose-child"]'));return{opacity:+c.opacity,filter:c.filter,transform:c.transform,x:parseFloat(c.translate)};});
 near(reducedBoot.opacity,.45);near(reducedBoot.x,0);assert.equal(reducedBoot.transform,compose.transform);assert.ok(reducedBoot.filter.includes('brightness(0.8)')&&reducedBoot.filter.includes('blur(1px)'));
 await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'no-preference'}]);
 await page.evaluate(()=>document.querySelector('#composition-export').remove());

 await page.evaluate(()=>{
  const base=sec(),sections=['morph','push','overlay','fade','zoom','cut'].map((type,i)=>Object.assign({},base,{id:'transition-'+i,name:'Transición '+i,sdEnabled:i===0,sdLength:200,stType:type,stSpan:24,height:100,elements:[mkEl('heading',{id:'transition-text-'+i,text:'Escena '+i,anim:'none',sdEnter:'none',sdEnd:100})]}));
  const f=document.createElement('iframe');f.id='transition-export';f.style.cssText='width:1000px;height:600px';f.srcdoc=generateSite(Object.assign({},flattenPage(page()),{sections}),false,false,false);document.body.append(f);
 });
 await page.waitForFunction(()=>document.querySelector('#transition-export')?.contentWindow?.__NAG_SCENE_TRANSITIONS);
 async function transition(index){
  await page.evaluate(i=>{const f=document.querySelector('#transition-export'),w=f.contentWindow,n=f.contentDocument.querySelector('[data-id="transition-'+i+'"]'),slot=n.__nwStoryLayout;w.scrollTo(0,slot.getBoundingClientRect().bottom+w.scrollY-w.innerHeight+w.innerHeight*.12);},index);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  return page.evaluate(i=>{
   const f=document.querySelector('#transition-export'),w=f.contentWindow,n=f.contentDocument.querySelector('[data-id="transition-'+i+'"]'),next=f.contentDocument.querySelector('[data-id="transition-'+(i+1)+'"]'),c=w.getComputedStyle(n),nc=w.getComputedStyle(next);
   const p=Math.max(0,Math.min(1,(w.innerHeight-next.__nwStoryLayout.getBoundingClientRect().top)/(w.innerHeight*.24)));
   return{opacity:+c.opacity,scale:parseFloat(c.scale),nextScale:parseFloat(nc.scale),x:parseFloat(c.translate),expectedX:-w.innerWidth*p,radius:c.borderRadius,nextOpacity:+nc.opacity,top:next.getBoundingClientRect().top,overflow:f.contentDocument.documentElement.scrollWidth>w.innerWidth+1,progress:f.contentDocument.querySelector('[data-id="transition-0"]').style.getPropertyValue('--nw-sd-progress')};
  },index);
 }
 const first=await transition(0);near(first.opacity,.5);near(first.nextOpacity,.5);assert.equal(first.overflow,false);
 const middle=await transition(1);near(middle.x,middle.expectedX);near(middle.opacity,1);assert.equal(middle.radius,'0px');assert.equal(middle.overflow,false);near(+middle.progress,1);
 const overlay=await transition(2);near(overlay.opacity,1);near(overlay.nextOpacity,.5);near(overlay.top,0,1);assert.equal(overlay.overflow,false);
 const fade=await transition(3);near(fade.opacity,.5);near(fade.nextOpacity,.5);near(fade.scale,1);assert.equal(fade.overflow,false);
 const zoom=await transition(4);near(zoom.opacity,.825);near(zoom.scale,1.04);near(zoom.nextOpacity,.5);near(zoom.nextScale,.93);assert.equal(zoom.overflow,false);
 const rewind=await transition(0);near(rewind.opacity,first.opacity);near(rewind.scale,first.scale);
 await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
 await page.waitForFunction(()=>document.querySelector('#transition-export').contentWindow.getComputedStyle(document.querySelector('#transition-export').contentDocument.querySelector('[data-id="transition-0"]')).opacity==='1');
 const reducedTransition=await page.evaluate(()=>{const f=document.querySelector('#transition-export');return [...f.contentDocument.querySelectorAll('.nw-st-visual')].every(n=>{const c=f.contentWindow.getComputedStyle(n);return +c.opacity===1&&parseFloat(c.scale)===1&&parseFloat(c.translate)===0;});});assert.ok(reducedTransition);
 await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'no-preference'}]);
 await page.evaluate(()=>document.querySelector('#transition-export').remove());
 console.log('Storytelling: Universal, ancla 3D, scroll/scrub/playback, transiciones y reduced motion OK');
}
