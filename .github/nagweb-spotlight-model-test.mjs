import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const model=scope.window.NAGWEB_STREAM_MODEL,plain=x=>JSON.parse(JSON.stringify(x)),cfg=model.config({kind:'spotlight-zoom'}),near=(a,b,t=1e-6)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`),pose=(p,c={},n=4,w=1280,h=720)=>plain(model.layout(w,h,{...cfg,...c},p,n,1)),ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
assert.equal(cfg.kind,'spotlight-zoom');assert.equal(cfg.cardRatio,'frame');assert.equal(model.config({kind:'spotlight-zoom',cardRatio:'1:1'}).cardRatio,'frame');
for(const [key,s] of Object.entries(model.spotlightSpecs)){assert.equal(cfg[key],s[0]);assert.equal(model.config({kind:'spotlight-zoom',[key]:-999})[key],s[1]);assert.equal(model.config({kind:'spotlight-zoom',[key]:999})[key],s[2]);}
for(const n of [0,1,2,3,4,7,9,99])assert.equal(pose(0,{},n).length,n===0?4:Math.max(2,Math.min(9,n)));
for(const n of [2,3,4,5,6,7,8,9])for(const frameRatio of ['auto','16:9','9:16','1:1'])for(const dimming of [0,45,80]){
 const c={frameRatio,dimming,cornerRadius:12,gap:10},base=pose(0,c,n),clip=base[0].clip,unit=Math.min(clip.width,clip.height)/100,pad=unit*cfg.padding,gap=unit*10,cw=clip.width-2*pad,ch=clip.height-2*pad,cols=n===2?2:n===3?3:n===4?2:3,rows=Math.ceil(n/cols),tw=(cw-(cols-1)*gap)/cols,th=(ch-(rows-1)*gap)/rows;assert.deepEqual(base,pose(1,c,n));
 for(let index=0;index<n;index++)for(const local of [0,.055,.11,.22,.5,.78,.89,.945,.999]){
  const t=local<.22?local/.22:local<.78?1:(1-local)/.22,expansion=ease(t),cards=pose((index+local)/n,c,n);for(let i=0;i<n;i++){const card=cards[i],active=i===index,amount=active?expansion:0,x=clip.left+pad+i%cols*(tw+gap),y=clip.top+pad+Math.floor(i/cols)*(th+gap),rect={left:x+(clip.left+pad-x)*amount,top:y+(clip.top+pad-y)*amount,width:tw+(cw-tw)*amount,height:th+(ch-th)*amount};assert.equal(card.active,active);near(card.local,local);near(card.expansion,expansion);near(card.alpha,active?1:1-dimming/100*expansion);for(const key of ['left','top','width','height'])near(card[key],rect[key]);near(card.textureWidth,tw);near(card.textureHeight,th);assert.equal(card.corner,0);const instance=card.instances[0];near(instance.rounded.radius,Math.min(unit*12*(1+.4*amount),rect.width/2,rect.height/2));near(instance.shadowStrength,active?3*expansion:0);assert.equal(instance.depth,active?100:i);assert.deepEqual(instance.panelClip,instance.rounded);for(const key of ['left','top','width','height'])near(instance.imageFrame[key],rect[key]);assert.equal(instance.zoom,1);for(const q of instance.polygon)assert.ok(q.x>=clip.left-1e-6&&q.x<=clip.left+clip.width+1e-6&&q.y>=clip.top-1e-6&&q.y<=clip.top+clip.height+1e-6);}
 }
}
// Dimming does not alter active geometry or intrinsic source opacity; focus is applied by the live cover crop.
const clear=pose(.11/4,{dimming:0}),dim=pose(.11/4,{dimming:80});for(let i=0;i<4;i++){for(const key of ['left','top','width','height'])near(clear[i][key],dim[i][key]);}near(dim[1].alpha,.6);near(dim[0].alpha,1);
for(const p of [0,.0275,.1,.4725,.89]){const a=pose(p),b=pose(p,{},4,2560,1440);for(let i=0;i<4;i++){near(b[i].left,a[i].left*2);near(b[i].top,a[i].top*2);near(b[i].width,a[i].width*2);near(b[i].height,a[i].height*2);}}
const scroll={...cfg,start:20,end:80,turns:3};assert.deepEqual(plain(model.layout(1280,720,scroll,.1,4,1,true)),plain(model.layout(1280,720,scroll,.9,4,1,true)));
const exported=vm.runInNewContext('('+scope.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(exported.layout(390,844,scroll,.317,9,1,true)),plain(model.layout(390,844,scroll,.317,9,1,true)));
console.log('Spotlight Zoom: HAR grid and 22/56/22% expand/hold/return stages, cubic timing, 2–9 sources, dimming/foreground priority, dynamic rectangles/radii/shadows, stable full-source texture geometry, loop/scroll/export and proportional resizing OK');
