import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.runInNewContext(fs.readFileSync('js/nagweb-story-model.js','utf8'),scope);
const model=scope.window.NAGWEB_STREAM_MODEL,plain=x=>JSON.parse(JSON.stringify(x)),cfg=model.config({kind:'column-drift'}),near=(a,b,t=1e-6)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`),pose=(p,c={},n=12,w=1280,h=720,ratio=1)=>plain(model.layout(w,h,{...cfg,...c},p,n,ratio));
assert.equal(cfg.kind,'column-drift');assert.equal(cfg.cardRatio,'1:1');assert.equal(cfg.gap,3);assert.equal(model.config({kind:'column-drift',gap:999}).gap,8);assert.equal(model.config({kind:'column-drift',gap:-999}).gap,1);assert.equal(model.config({kind:'column-drift',cardRatio:'frame'}).cardRatio,'1:1');
for(const n of [0,1,5,6,7,8,9,12,15,18,99])assert.equal(pose(0,{},n).length,n===0?12:Math.max(6,Math.min(18,Math.round(n/3)*3)));
for(const frameRatio of ['auto','16:9','9:16','1:1'])for(const cardRatio of ['auto','1:1','3:4','16:9','9:16'])for(const n of [6,9,12,15,18])for(const gap of [1,3,8]){
 const c={frameRatio,cardRatio,gap,cornerRadius:12},start=pose(0,c,n),clip=start[0].clip,unit=Math.min(frameRatio==='9:16'?405:1280,frameRatio==='1:1'?720:720)/100,rows=n/3;assert.deepEqual(start,pose(1,c,n));
 for(const p of [0,.03,.125,.25,.5,.875,.999]){const cards=pose(p,c,n);for(let i=0;i<n;i++){const card=cards[i];assert.equal(card.column,Math.floor(i/rows));assert.equal(card.row,i%rows);assert.equal(card.direction,card.column===1?-1:1);near(card.textureWidth,start[i].textureWidth);near(card.textureHeight,start[i].textureHeight);near(card.textureWidth/card.textureHeight,model.ratios[cardRatio]||1);assert.ok(card.corner<=Math.min(card.textureWidth,card.textureHeight)/2);for(const t of card.instances){assert.equal(t.alpha,1);near(t.rounded.radius,card.corner);near(t.rounded.scaleX,1);near(t.rounded.scaleY,1);near(t.rounded.cx,clip.left+card.column*(card.textureWidth+gap*Math.min(clip.width/(1-2*cfg.padding/100),clip.height/(1-2*cfg.padding/100))/100)+card.textureWidth/2);for(const q of t.polygon)assert.ok(q.x>=clip.left-1e-6&&q.x<=clip.left+clip.width+1e-6&&q.y>=clip.top&&q.y<=clip.top+clip.height);}
  }
  // Independent HAR repeat equation: every source that intersects the window is present once per repeat.
  const pitch=cards[0].textureHeight+(cards[0].clip.width-cards[0].textureWidth*3)/2,length=pitch*rows;
  for(let i=0;i<n;i++){const card=cards[i],at=((i%rows*pitch+p*length*card.direction)%length+length)%length,ys=[];for(let y=clip.top+at-length*Math.ceil((at+clip.height)/length);y<clip.top+clip.height;y+=length)if(Math.min(y+card.textureHeight,clip.top+clip.height)-Math.max(y,clip.top)>1e-7)ys.push(y);assert.equal(card.instances.length,ys.length,JSON.stringify({c,n,p,i,instances:card.instances,ys}));card.instances.forEach((t,k)=>near(t.rounded.cy,ys[k]+card.textureHeight/2));}
 }
}
const repeated=pose(.2,{frameRatio:'9:16',cardRatio:'16:9'},6);assert.ok(repeated.every(c=>c.instances.length>1));const a=pose(0),b=pose(.01);for(const i of [0,4,8]){const first=a[i].instances[0],next=b[i].instances.find(t=>Math.abs(t.rounded.cy-first.rounded.cy)<a[i].cycleLength/2);near(next.rounded.cy-first.rounded.cy,a[i].cycleLength*.01*(i===4?-1:1));}
for(const ratio of [.1,.25,1,4,10]){const a=pose(0,{cardRatio:'auto'},12,1280,720,ratio)[0];near(a.textureWidth/a.textureHeight,Math.max(.25,Math.min(4,ratio)));}
for(const p of [0,.17,.5,.89]){const a=pose(p),b=pose(p,{},12,2560,1440);for(let i=0;i<12;i++){near(b[i].left,a[i].left*2);near(b[i].top,a[i].top*2);near(b[i].textureWidth,a[i].textureWidth*2);near(b[i].textureHeight,a[i].textureHeight*2);}}
const scroll={...cfg,start:20,end:80,turns:3};assert.deepEqual(plain(model.layout(1280,720,scroll,.1,12,1,true)),plain(model.layout(1280,720,scroll,.9,12,1,true)));
const exported=vm.runInNewContext('('+scope.window.NAGWEB_CREATE_STREAM_MODEL.toString()+')()');assert.deepEqual(plain(exported.layout(390,844,scroll,.317,18,1,true)),plain(model.layout(390,844,scroll,.317,18,1,true)));
console.log('Column Drift: HAR three-column repeat equation/counter-flow, 6–18 sources in steps of three, per-column ordering, all card/frame ratios, repeated/clipped copies, rounded content/card geometry, stable textures, seamless loop/scroll/export and proportional resizing OK');
