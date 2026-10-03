import assert from 'node:assert/strict';
const near=(a,b,label,t=.015)=>assert.ok(Math.abs(a-b)<t,`${label}: ${a} ≠ ${b}`);

export async function runTransparentSmoke(page){
 for(const viewport of [{width:1000,height:600},{width:390,height:844}]){
  for(const type of ['fade','overlay','push','zoom','morph']){
   const label=`${type} ${viewport.width}px`;
   try{
    await page.evaluate(({viewport,type})=>{
     const sections=[180,140,100].map((height,i)=>Object.assign({},sec(),{
      id:'alpha-'+i,name:'Transparencia '+i,layout:'free',height,pin:false,navFixed:false,
      sdEnabled:false,stType:i===0?type:'cut',stSpan:24,
      bg:i===1?'rgba(20, 40, 60, 0.25)':'transparent',
      elements:[mkEl('heading',{id:'alpha-text-'+i,text:'Escena '+i,anim:'none',x:50,y:50})]
     }));
     const f=document.createElement('iframe');f.id='alpha-export';
     f.style.cssText=`border:0;width:${viewport.width}px;height:${viewport.height}px`;
     let html=generateSite(Object.assign({},flattenPage(page()),{sections}),false,false,viewport.width<500);
     html=html.replace('</head>','<style>body{background:#123456}[data-id="alpha-0"]{opacity:.7}[data-id="alpha-1"]{opacity:.6}</style></head>');
     f.srcdoc=html;document.body.append(f);
    },{viewport,type});
    await page.waitForFunction(()=>document.getElementById('alpha-export')?.contentWindow?.__NAG_SCENE_TRANSITIONS);
    const initial=await page.evaluate(()=>{
     const f=document.getElementById('alpha-export'),w=f.contentWindow,d=f.contentDocument;
     return{
      height:d.documentElement.scrollHeight,
      slots:[...d.querySelectorAll('.nw-st-slot')].map(n=>n.offsetHeight),
      current:w.getComputedStyle(d.querySelector('[data-id="alpha-0"]')).backgroundColor,
      next:w.getComputedStyle(d.querySelector('[data-id="alpha-1"]')).backgroundColor,
      opacity:+w.getComputedStyle(d.querySelector('[data-id="alpha-1"]')).opacity,
      pointer:w.getComputedStyle(d.querySelector('[data-id="alpha-1"]')).pointerEvents,
      viewport:w.innerHeight
     };
    });
    assert.equal(initial.current,'rgba(0, 0, 0, 0)',label+' transparent background');
    assert.equal(initial.next,'rgba(20, 40, 60, 0.25)',label+' authored alpha');
    assert.equal(initial.opacity,0,label+' future scene hidden');
    assert.equal(initial.pointer,'none',label+' future scene cannot intercept clicks');
    assert.ok(initial.slots[0]>=initial.viewport*1.8-2,label+' tall outgoing scene');
    assert.ok(initial.slots[1]>=initial.viewport*1.4-2,label+' tall incoming scene');

    async function sample(progress){
     await page.evaluate(progress=>{
      const f=document.getElementById('alpha-export'),w=f.contentWindow,n=f.contentDocument.querySelector('[data-id="alpha-1"]');
      const top=n.__nwStoryLayout.getBoundingClientRect().top+w.scrollY;
      w.scrollTo(0,top-w.innerHeight+w.innerHeight*.24*progress);
     },progress);
     await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
     return page.evaluate(()=>{
      const f=document.getElementById('alpha-export'),w=f.contentWindow,d=f.contentDocument,a=d.querySelector('[data-id="alpha-0"]'),b=d.querySelector('[data-id="alpha-1"]'),ac=w.getComputedStyle(a),bc=w.getComputedStyle(b);
      return{
       outgoing:+ac.opacity,incoming:+bc.opacity,
       pointer:bc.pointerEvents,bg:bc.backgroundColor,
       height:d.documentElement.scrollHeight,
       slots:[...d.querySelectorAll('.nw-st-slot')].map(n=>n.offsetHeight),
       overflow:d.documentElement.scrollWidth>w.innerWidth+1,
       scale:parseFloat(bc.scale),x:parseFloat(bc.translate),width:w.innerWidth
      };
     });
    }
    const middle=await sample(.5);
    near(middle.incoming,type==='push'?.6:.3,label+' incoming opacity');
    near(middle.outgoing,.7*(['fade','morph'].includes(type)?.5:type==='zoom'?.825:1),label+' outgoing opacity');
    assert.equal(middle.pointer,'auto',label+' incoming clicks');
    assert.equal(middle.bg,initial.next,label+' background stays authored');
    assert.deepEqual(middle.slots,initial.slots,label+' stable layout slots');
    assert.equal(middle.height,initial.height,label+' stable document length');
    assert.equal(middle.overflow,false,label+' no horizontal overflow');
    if(type==='push')near(middle.x,middle.width*.5,label+' incoming push',2);

    const end=await sample(1.1);
    near(end.incoming,.6,label+' authored opacity restored');
    near(end.scale,1,label+' incoming scale restored');
    assert.equal(end.overflow,false,label+' completed overflow');
    const rewind=await sample(0);
    assert.equal(rewind.incoming,0,label+' rewind hides future scene');
    assert.equal(rewind.pointer,'none',label+' rewind disables future clicks');
    near(rewind.outgoing,.7,label+' rewind restores outgoing opacity');
    const again=await sample(.5);
    near(again.incoming,middle.incoming,label+' repeat incoming');
    near(again.outgoing,middle.outgoing,label+' repeat outgoing');

    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    await page.waitForFunction(()=>{
     const f=document.getElementById('alpha-export'),w=f.contentWindow,n=f.contentDocument.querySelector('[data-id="alpha-1"]');
     return Math.abs(+w.getComputedStyle(n).opacity-.6)<.001;
    });
    const reduced=await sample(.5);
    near(reduced.outgoing,.7,label+' reduced outgoing');
    near(reduced.incoming,.6,label+' reduced incoming');
    near(reduced.scale,1,label+' reduced scale');
    near(reduced.x,0,label+' reduced displacement');
    assert.equal(reduced.bg,initial.next,label+' reduced background');
    assert.deepEqual(reduced.slots,initial.slots,label+' reduced layout');
   }finally{
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'no-preference'}]);
    await page.evaluate(()=>document.getElementById('alpha-export')?.remove());
   }
  }
 }
 console.log('Transparencia: cinco transiciones, escritorio/móvil, escenas altas, opacidad, rewind, interacción y movimiento reducido OK');
}
