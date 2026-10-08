import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const model=scope.window.NAGWEB_STREAM_MODEL,plain=x=>JSON.parse(JSON.stringify(x)),cfg=model.config({kind:'orbit-carousel'}),near=(a,b,t=1e-6)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`),pose=(p,c={},n=4,w=1280,h=720,ratio=1)=>plain(model.layout(w,h,{...cfg,...c},p,n,ratio));
assert.equal(cfg.kind,'orbit-carousel');assert.equal(cfg.cardRatio,'1:1');assert.equal(model.config({kind:'orbit-carousel',cardRatio:'frame'}).cardRatio,'frame');
for(const [key,s] of Object.entries(model.orbitCarouselSpecs)){assert.equal(cfg[key],s[0]);assert.equal(model.config({kind:'orbit-carousel',[key]:-999})[key],s[1]);assert.equal(model.config({kind:'orbit-carousel',[key]:999})[key],s[2]);}
for(const n of [0,1,3,4,7,10,99])assert.equal(pose(0,{},n).length,n===0?4:Math.max(3,Math.min(10,n)));
for(const frameRatio of ['auto','16:9','9:16','1:1'])for(const cardRatio of ['auto','frame','1:1','3:4','16:9'])for(const n of [3,4,7,10])for(const depth of [20,60,90]){
 const c={frameRatio,cardRatio,depth,spread:100},start=pose(0,c,n),clip=start[0].clip,unit=Math.min(clip.width,clip.height)/100,cw=clip.width-2*unit*cfg.padding,ch=clip.height-2*unit*cfg.padding,vertical=clip.height>clip.width*1.05;assert.deepEqual(start,pose(1,c,n));
 for(const p of [0,.125,.25,.333,.5,.75,.99]){const cards=pose(p,c,n);for(let i=0;i<n;i++){const card=cards[i],angle=2*Math.PI*(p+i/n),front=(Math.cos(angle)+1)/2,scale=1-depth/100*.55*(1-front),alpha=1-depth/100*(1-front);near(card.front,front);near(card.scale,scale);near(card.alpha,alpha);near(card.textureWidth,start[i].textureWidth);near(card.textureHeight,start[i].textureHeight);if(card.visible){const r=card.instances[0].rounded;near(r.cx,1280/2+(vertical?0:Math.sin(angle)*cw*.5));near(r.cy,720/2+(vertical?Math.sin(angle)*ch*.5:0));near(r.scaleX,scale);near(r.scaleY,scale);near(r.radius,card.corner);near(card.instances[0].shadowStrength,2.5*front);for(const q of card.instances[0].polygon)assert.ok(q.x>=clip.left&&q.x<=clip.left+clip.width&&q.y>=clip.top&&q.y<=clip.top+clip.height);}}
 }
}
const front=pose(0)[0],back=pose(.5)[0];near(front.alpha,1);near(front.scale,1);near(back.alpha,.4);near(back.scale,.67);const upright=pose(0,{frameRatio:'9:16'});near(upright[1].instances[0].rounded.cx,upright[0].instances[0].rounded.cx);assert.ok(upright[1].instances[0].rounded.cy>upright[0].instances[0].rounded.cy);
for(const ratio of [.1,.25,1,4,10]){const a=pose(0,{cardRatio:'auto'},4,1280,720,ratio)[0];near(a.textureWidth/a.textureHeight,Math.max(.25,Math.min(4,ratio)));}
for(const p of [0,.17,.5,.89]){const a=pose(p),b=pose(p,{},4,2560,1440);for(let i=0;i<4;i++){near(b[i].left,a[i].left*2);near(b[i].top,a[i].top*2);near(b[i].textureWidth,a[i].textureWidth*2);near(b[i].textureHeight,a[i].textureHeight*2);}}
const a=pose(.2),b=pose(.2,{offsetX:4,offsetY:-3});for(let i=0;i<4;i++){near(b[i].instances[0].rounded.cx-a[i].instances[0].rounded.cx,28.8);near(b[i].instances[0].rounded.cy-a[i].instances[0].rounded.cy,-21.6);}
const scroll={...cfg,start:20,end:80,turns:3};assert.deepEqual(plain(model.layout(1280,720,scroll,.1,4,1,true)),plain(model.layout(1280,720,scroll,.9,4,1,true)));
const exported=vm.runInNewContext('('+scope.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(exported.layout(390,844,scroll,.317,10,1,true)),plain(model.layout(390,844,scroll,.317,10,1,true)));
console.log('Orbit Carousel: HAR spread/depth/scale/alpha formulas, 3–10 sources, automatic horizontal/vertical travel, all card/frame ratios, bounded rounded geometry, stable textures, loop/scroll/export and proportional resizing OK');
