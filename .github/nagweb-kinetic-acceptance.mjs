// Acceptance probe on the exact published HTML. Measures sticky geometry
// and checks that Collage doesn't expose authoring gestures publicly.
export async function runKineticAcceptanceSmoke(page){
 const specs=['flow','free'];
 for(const mode of specs){
  await page.evaluate(mode=>{
   const p=flattenPage(page()),imgs=['uno','dos','tres','cuatro','cinco'].map((title,i)=>({title,href:'#',img:''}));
   const strip=mkEl('widget',{id:'nw-accept-kinetic',wk:'kineticstrip',w:100,x:50,y:50,wp:{projects:imgs,perCard:52,cardW:36,cardH:68}});
   const scene=mkSection({id:'nw-accept-scene',layout:mode,height:100,elements:[strip]});
   const tail=mkSection({id:'nw-accept-tail',height:120,elements:[mkEl('heading',{text:'Final'})]});
   const frame=document.createElement('iframe');
   frame.id='nw-accept-public';frame.style.cssText='width:1000px;height:600px;border:0;display:block';
   frame.srcdoc=generateSite({...p,sections:[scene,tail]},false,false,false);
   document.body.append(frame);
  },mode);
  await page.waitForFunction(()=>!!document.querySelector('#nw-accept-public')?.contentDocument?.querySelector('.nw-ks-sticky'),{timeout:20000});
  const res=await page.evaluate(async()=>{
   const frame=document.querySelector('#nw-accept-public'),win=frame.contentWindow,doc=frame.contentDocument,
    ks=doc.querySelector('.nw-ks'),sticky=doc.querySelector('.nw-ks-sticky'),track=doc.querySelector('.nw-ks-track');
   const scrollAt=async f=>{
    const r=ks.getBoundingClientRect(),start=win.scrollY+r.top,span=Math.max(1,r.height-win.innerHeight);
    win.scrollTo(0,start+span*f);
    await new Promise(ok=>win.requestAnimationFrame(()=>win.requestAnimationFrame(ok)));
    const box=sticky.getBoundingClientRect(),root=ks.getBoundingClientRect();
    return{f,top:box.top,rootTop:root.top,scrollY:win.scrollY,
     trackX:track.style.getPropertyValue('--tx'),
     progress:ks.style.getPropertyValue('--p')};
   };
   const at0=await scrollAt(0),at25=await scrollAt(.25),at50=await scrollAt(.5),at75=await scrollAt(.75);
   const ancestors=[];let n=sticky;
   while(n&&n.nodeType===1&&ancestors.length<10){const cs=win.getComputedStyle(n);ancestors.push({tag:n.tagName,cls:n.className,position:cs.position,overflow:cs.overflow,overflowX:cs.overflowX,overflowY:cs.overflowY,height:Math.round(n.getBoundingClientRect().height)});n=n.parentElement;}
   return{at0,at25,at50,at75,documentHeight:doc.documentElement.scrollHeight,viewport:win.innerHeight,ancestors};
  });
  console.log('Diagnóstico cinta '+mode+' '+JSON.stringify(res));
  await page.evaluate(()=>document.querySelector('#nw-accept-public').remove());
 }
 await page.evaluate(()=>{
  const w=mkEl('widget',{id:'nw-accept-collage',wk:'editorialcollage',w:90,wp:{label:'Portfolio',caption:'Tres imágenes'}});
  const sc=mkSection({id:'nw-accept-collage-scene',layout:'flow',elements:[w]});
  const frame=document.createElement('iframe');frame.id='nw-accept-collage-public';
  frame.style.cssText='width:1000px;height:600px';frame.srcdoc=generateSite({...flattenPage(page()),sections:[sc]},false,false,false);
  document.body.append(frame);
 });
 await page.waitForFunction(()=>!!document.querySelector('#nw-accept-collage-public')?.contentDocument?.querySelector('.scx-ec-grid .a'));
 const collage=await page.evaluate(()=>{
  const f=document.querySelector('#nw-accept-collage-public'),w=f.contentWindow,d=f.contentDocument,n=d.querySelector('.scx-ec-grid .a'),
   initial=n.getBoundingClientRect(),x=initial.left+initial.width/2,y=initial.top+initial.height/2;
  n.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,button:0,pointerId:7,clientX:x,clientY:y}));
  w.dispatchEvent(new w.PointerEvent('pointermove',{bubbles:true,button:0,pointerId:7,clientX:x+90,clientY:y+40}));
  w.dispatchEvent(new w.PointerEvent('pointerup',{bubbles:true,button:0,pointerId:7,clientX:x+90,clientY:y+40}));
  const end=n.getBoundingClientRect();
  return{deltaX:end.x-initial.x,deltaY:end.y-initial.y,draggable:n.draggable,
   pointerEvents:w.getComputedStyle(n).pointerEvents,
   isEdit:!!w.SC_EDIT,cssTranslate:w.getComputedStyle(n).translate};
 });
 console.log('Diagnóstico collage público '+JSON.stringify(collage));
 await page.evaluate(()=>document.querySelector('#nw-accept-collage-public').remove());
}
