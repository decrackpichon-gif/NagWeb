/* Modelo puro, compartido por el editor y el único runtime exportado del Director.
   Los valores son relativos al diseño base. El easing pertenece al tramo saliente. */
(function(){
'use strict';
function createStoryModel(){
 var properties={
  x:{label:'Mover izquierda / derecha',unit:'px',base:0,min:-10000,max:10000},
  y:{label:'Mover arriba / abajo',unit:'px',base:0,min:-10000,max:10000},
  z:{label:'Profundidad',unit:'px',base:0,min:-10000,max:10000},
  rotateX:{label:'Inclinar arriba / abajo',unit:'°',base:0,min:-3600,max:3600},
  rotateY:{label:'Inclinar izquierda / derecha',unit:'°',base:0,min:-3600,max:3600},
  scale:{label:'Tamaño',unit:'%',base:100,min:0,max:1000},
  rotate:{label:'Giro',unit:'°',base:0,min:-3600,max:3600},
  opacity:{label:'Opacidad',unit:'%',base:100,min:0,max:100},
  blur:{label:'Desenfoque',unit:'px',base:0,min:0,max:100}
 };
 var easings={linear:'Lineal',smooth:'Suave', 'ease-in':'Acelera', 'ease-out':'Frena', 'ease-in-out':'Acelera y frena',cinematic:'Cinemática'};
 function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
 function number(v,d){return v==null||v===''||!isFinite(+v)?d:+v;}
 function ease(p,k){
  p=clamp(number(p,0),0,1);
  if(k==='linear')return p;
  if(k==='smooth'||k==='ease')return p*p*(3-2*p);
  if(k==='ease-in')return p*p;
  if(k==='ease-out')return 1-(1-p)*(1-p);
  if(k==='ease-in-out')return p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
  return p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
 }
 function normalize(frames){
  var out=[],previous={};
  (Array.isArray(frames)?frames:[]).filter(function(k){return k&&isFinite(+k.at);}).slice(0,512)
  .sort(function(a,b){return +a.at-+b.at;}).forEach(function(k){
   var f={at:Math.round(clamp(+k.at,0,100)*10)/10,ease:k.ease==='ease'?'smooth':(easings[k.ease]?k.ease:'linear')};
   if(k.id)f.id=String(k.id);
   Object.keys(properties).forEach(function(key){var d=properties[key];f[key]=clamp(number(k[key],number(previous[key],d.base)),d.min,d.max);});
   // Imported collisions have a deterministic winner. Interactive editing prevents them.
   if(out.length&&out[out.length-1].at===f.at)out.pop();
   out.push(f);previous=f;
  });
  return out;
 }
 function framesAt(frames,p){
  var at=clamp(number(p,0),0,1)*100,a=frames[0],b=a;
  for(var i=1;i<frames.length;i++){b=frames[i];if(at<=b.at)break;a=b;}
  var t=a===b?0:ease((at-a.at)/(b.at-a.at),a.ease),out={};
  Object.keys(properties).forEach(function(k){out[k]=a[k]+(b[k]-a[k])*t;});
  return out;
 }
 function legacy(c,p,k){
  var s=clamp(number(c.start,0)/100,0,1),en=clamp(number(c.end,82)/100,s,1),sp=clamp(number(c.span,8)/100,.005,.3);
  var ip=ease((p-s)/sp,k),ep=c.exit==='keep'?0:ease((p-en)/sp,k),life=ease((p-s)/Math.max(.001,en-s),k);
  var x=number(c.moveX,0)*life,y=number(c.moveY,0)*life,sc=1+(Math.max(.1,number(c.scale,100)/100)-1)*life,rot=number(c.rotate,0)*life,blur=0,op=p<s?0:1;
  if(c.enter==='fade')op*=ip;
  else if(c.enter==='up')y+=(1-ip)*70;
  else if(c.enter==='down')y-=(1-ip)*70;
  else if(c.enter==='left')x-=(1-ip)*110;
  else if(c.enter==='right')x+=(1-ip)*110;
  else if(c.enter==='zoom')sc*=.65+.35*ip;
  else if(c.enter==='blur'){op*=ip;blur+=(1-ip)*18;}
  else if(c.enter==='depth'){op*=ip;sc*=.78+.22*ip;y+=(1-ip)*28;}
  if(c.exit!=='keep'&&p>=en){
   op*=1-ep;
   if(c.exit==='up')y-=ep*70;else if(c.exit==='down')y+=ep*70;
   else if(c.exit==='left')x-=ep*110;else if(c.exit==='right')x+=ep*110;
   else if(c.exit==='zoom')sc*=1+ep*.22;else if(c.exit==='blur')blur+=ep*18;
  }
  return{x:x,y:y,z:0,rotateX:0,rotateY:0,scale:sc*100,rotate:rot,opacity:clamp(op,0,1)*100,blur:blur};
 }
 function compile(e){
  var frames=e.sdKeyframesEnabled===false?[]:normalize(e.sdKeyframes);
  if(frames.length)return{id:e.id,keyframes:frames.map(function(f){var k=Object.assign({},f);delete k.id;return k;})};
  return{id:e.id,start:number(e.sdStart,0),end:number(e.sdEnd,82),span:number(e.sdSpan,8),enter:e.sdEnter||'fade',exit:e.sdExit||'keep',moveX:number(e.sdMoveX,0),moveY:number(e.sdMoveY,0),rotate:number(e.sdRotate,0),scale:number(e.sdScale,100)};
 }
 function evaluate(c,p,k,reduce){
  var out=c.keyframes&&c.keyframes.length?framesAt(c.keyframes,p):legacy(c,clamp(number(p,0),0,1),k||'cinematic');
  // Preserve base styling and narrative visibility. Neutralize only added motion/filter.
  if(reduce){out.x=0;out.y=0;out.z=0;out.rotateX=0;out.rotateY=0;out.scale=100;out.rotate=0;out.blur=0;}
  return out;
 }
 function eligible(e,s){
  if(!e||!s||s.layout==='horizontal'||e.type==='light3d'||e.fixed||e.modal||e.type==='shape3d'&&e.anchor===false)return false;
  var node=e,seen=new Set();
  while(node.parent){
   if(seen.has(node.parent))return false;seen.add(node.parent);
   node=(s.elements||[]).find(function(n){return n.id===node.parent;});
   if(!node||node.fixed||node.modal)return false;
  }
  return true;
 }
 return{version:'2.0',properties:properties,easings:easings,normalize:normalize,compile:compile,evaluate:evaluate,ease:ease,eligible:eligible,clamp:clamp,number:number};
}
window.NAGWEB_CREATE_STORY_MODEL=createStoryModel;
window.NAGWEB_STORY_MODEL=createStoryModel();
// Procedural motion keeps the same progress source as the Director. Each card
// is a curved surface, rather than a flat image with a sampled keyframe track.
function createStreamModel(){
 var specs={ringTilt:[0,-60,60,1],ringOpening:[55,15,85,1],ringSize:[80,50,95,1],cardSize:[21,12,80,1],backFade:[70,10,95,5],perspective:[18,0,40,2],padding:[6,0,20,.5],cornerRadius:[3,0,12,.5],turns:[1,.25,20,.25],start:[0,0,99,1],end:[100,1,100,1],scrollLength:[320,140,900,20]};
 var orbitSpecs={orbitSize:[85,40,130,1],spacing:[18,0,60,1],tilt:[55,20,100,1],swingAngle:[30,5,80,1],float:[2.5,0,8,.5]};
 var popSpecs={gap:[3,0,10,.5],visible:[62,30,85,1]};
 var revealSpecs={gap:[3,0,10,.5]};
 var zoomSpecs={zoomAmount:[12,4,25,1]};
 var dropSpecs={rotation:[100,0,200,5],cardSize:[78,50,95,1]};
 var coverSpecs={cardSize:[46,30,62,1],gap:[4,0,16,.5],sideTilt:[40,0,70,1],flowAngle:[0,0,90,1],offsetX:[0,-50,50,1],offsetY:[0,-50,50,1]};
 var bottomSpecs={cornerRadius:[5,0,12,.5],cardSize:[20,10,36,1],wheelSize:[50,30,90,1],rotations:[1,1,4,1],anticipation:[20,0,40,1],overshoot:[10,0,30,1],hold:[33,0,60,1],stagger:[40,0,100,1],spinRate:[2,1,8,1],offsetX:[0,-50,50,1],offsetY:[0,-50,50,1]};
 var spinSpecs={cornerRadius:[5,0,12,.5],cardSize:[26,12,45,1],wheelSize:[92,50,100,1],rotations:[1,1,4,1],anticipation:[20,0,40,1],overshoot:[10,0,30,1],hold:[33,0,60,1],spinRate:[2,1,8,1],offsetX:[0,-50,50,1],offsetY:[0,-50,50,1]};
 var wheelSpecs={cornerRadius:[5,0,12,.5],cardSize:[70,40,90,1],wheelSize:[105,70,160,1],anticipation:[20,0,40,1],overshoot:[10,0,30,1],hold:[33,0,60,1],offsetX:[0,-50,50,1],offsetY:[0,-50,50,1]};
 var photoSpecs={pulse:[60,10,90,5],ringWidth:[56,30,80,1],ringHeight:[56,30,80,1],cardSize:[26,14,38,1]};
 var burstSpecs={overlap:[60,20,100,5],groupSize:[3,2,10,1],hold:[30,0,60,5]};
 var peelSpecs={cardSize:[48,35,65,1],peek:[4,2,8,.5]};
 var filmSpecs={cardSize:[32,22,48,1],gap:[2.5,1,8,.5],curve:[70,-100,100,5]},totemSpecs={cardSize:[34,22,50,1],gap:[2.5,1,8,.5],curve:[70,-100,100,5]};
 var spiralSpecs={spiralTurns:[3.75,1,6,.25],cardCount:[24,8,48,1],pulse:[60,10,90,5],ringSize:[62,35,90,1],taper:[0,-90,90,5],cardSize:[33,12,36,1],backFade:[55,10,95,5],perspective:[20,0,40,2],tilt:[0,-45,45,1],gap:[28,0,50,2],scalePulse:[0,0,60,5]};
 var shiftSpecs={railSize:[26,18,40,1],gap:[2.5,.5,8,.5]};
 var bloomSpecs={pulse:[60,10,90,5],lean:[0,0,100,5],ringWidth:[50,30,95,1],ringHeight:[25,8,95,1],ringTilt:[-29,-45,45,1],cardSize:[24,10,80,1],perspective:[55,0,100,5],backFade:[45,0,90,5],curve:[0,-100,100,5]};
 var stageSpecs={travel:[60,20,120,5],cardSize:[86,60,100,1]};
 var tickerSpecs={zoom:[32,15,60,1],tilt:[30,-55,55,1],perspective:[60,0,100,5],rowGap:[4,1,10,.5],staggerDelay:[8,2,20,1]};
 var tickerLoopSpecs={zoom:[45,18,70,1],angle:[-6,-15,15,1],rowGap:[4,1,10,.5],pulseCount:[3,1,8,1],zoomPulseAmount:[25,5,60,1],stops:[5,2,12,1],waypointZoom:[1.8,1.2,3,.1],creepSpeed:[15,0,50,1],pause:[35,0,70,1]};
 var tossSpecs={cardSize:[26,14,45,1],sizeVar:[20,0,50,5],throwHeight:[75,40,95,5],spread:[70,0,100,5],spin:[12,0,45,1],offsetX:[0,-50,50,1],offsetY:[0,-50,50,1]};
 var diagonalSpecs={cardSize:[40,20,70,1],overlap:[55,0,85,1],stagger:[40,0,100,1]};
 var cascadeSpecs={size:[42,25,70,1],skew:[70,0,90,1],spacing:[40,20,100,1]};
 var focusSpecs={size:[42,25,70,1],skew:[20,0,90,1],spacing:[20,10,60,1],focusGap:[85,30,150,5],centerScale:[100,80,160,5]};
 var stackSpecs={inset:[4,0,15,.5],depthScale:[.95,.85,1,.01],offsetX:[0,-50,50,1],offsetY:[0,-50,50,1]};
 var carouselSpecs={sideScale:[.82,.6,1,.01],gap:[5,1,15,.5]};
 var ratios={'1:1':1,'4:3':4/3,'3:4':3/4,'4:5':4/5,'16:9':16/9,'9:16':9/16};
 function config(raw){raw=raw||{};var out={},orbit=raw.kind==='iso-orbit',pop=raw.kind==='pop-grid',reveal=raw.kind==='grid-reveal',zoom=raw.kind==='zoom-parallax',drop=raw.kind==='cascade-drop',shift=raw.kind==='focus-shift',spiral=raw.kind==='spiral-stream',cover=raw.kind==='cover-flow'||raw.kind==='cover-flow-vertical',coverVertical=raw.kind==='cover-flow-vertical',bottom=raw.kind==='wheel-spin-bottom',spin=bottom||raw.kind==='wheel-spin',wheel=raw.kind==='wheel-carousel',photo=raw.kind==='photo-orbit',burst=raw.kind==='poster-burst',peel=raw.kind==='deck-peel',film=raw.kind==='film-strip',totem=raw.kind==='card-totem',stage=raw.kind==='center-stage',bloom=raw.kind==='orbit-bloom',ticker=raw.kind==='ticker-tilt',tickerLoop=raw.kind==='ticker-loop',carousel=raw.kind==='carousel-flow',stack=raw.kind==='stack-slide',focus=raw.kind==='iso-focus-sequence',toss=raw.kind==='card-toss',diagonal=raw.kind==='diagonal-carousel',cascade=raw.kind==='iso-cascade',fields=cover?Object.assign({},specs,coverSpecs):bottom?Object.assign({},specs,bottomSpecs):spin?Object.assign({},specs,spinSpecs):wheel?Object.assign({},specs,wheelSpecs):photo?Object.assign({},specs,photoSpecs):burst?Object.assign({},specs,burstSpecs):peel?Object.assign({},specs,peelSpecs):film?Object.assign({},specs,filmSpecs):totem?Object.assign({},specs,totemSpecs):spiral?Object.assign({},specs,spiralSpecs):shift?Object.assign({},specs,shiftSpecs):drop?Object.assign({},specs,dropSpecs):zoom?Object.assign({},specs,zoomSpecs):reveal?Object.assign({},specs,revealSpecs):diagonal?Object.assign({},specs,diagonalSpecs):cascade?Object.assign({},specs,cascadeSpecs):toss?Object.assign({},specs,tossSpecs):focus?Object.assign({},specs,focusSpecs):stack?Object.assign({},specs,stackSpecs):carousel?Object.assign({},specs,carouselSpecs):tickerLoop?Object.assign({},specs,tickerLoopSpecs):ticker?Object.assign({},specs,tickerSpecs):bloom?Object.assign({},specs,bloomSpecs):stage?Object.assign({},specs,stageSpecs):orbit?Object.assign({},specs,orbitSpecs):pop?Object.assign({},specs,popSpecs):specs;Object.keys(fields).forEach(function(k){var s=fields[k],n=raw[k];out[k]=Math.max(s[1],Math.min(s[2],n!==''&&n!=null&&isFinite(+n)?+n:s[0]));});out.end=Math.max(out.start+1,out.end);out.cardRatio=raw.cardRatio==='auto'||(carousel||stack||drop||burst)&&raw.cardRatio==='frame'||ratios[raw.cardRatio]?raw.cardRatio:toss?'3:4':orbit||bloom||ticker||tickerLoop||carousel||stack||focus||diagonal||cascade||drop||spiral||film||totem||peel||burst||photo||wheel||spin||cover?'1:1':'16:9';out.frameRatio=raw.frameRatio==='auto'||ratios[raw.frameRatio]?raw.frameRatio:'16:9';out.shadow=!!raw.shadow;out.backgroundType=['none','color','gradient','image'].indexOf(raw.backgroundType)>=0?raw.backgroundType:'color';out.backgroundColor=/^#[0-9a-f]{6}$/i.test(raw.backgroundColor||'')?raw.backgroundColor:'#101014';out.gradientColor=/^#[0-9a-f]{6}$/i.test(raw.gradientColor||'')?raw.gradientColor:'#3a3a5a';out.backgroundId=typeof raw.backgroundId==='string'?raw.backgroundId:'';if(orbit){out.kind='iso-orbit';out.motion=raw.motion==='spin'?'spin':'swing';}if(bloom){out.kind='orbit-bloom';out.direction=raw.direction==='left'?'left':'right';out.motion=raw.motion==='pulse'?'pulse':'linear';}if(ticker){out.kind='ticker-tilt';out.direction=raw.direction==='right'?'right':'left';out.flow=['same','staggered'].indexOf(raw.flow)>=0?raw.flow:'opposed';}if(tickerLoop){out.kind='ticker-loop';out.orientation=raw.orientation==='vertical'?'vertical':'horizontal';out.direction=raw.direction==='same'?'same':'opposed';out.movement=['zoomPulse','zoomWaypoints'].indexOf(raw.movement)>=0?raw.movement:'continuous';}if(diagonal){out.kind='diagonal-carousel';out.direction=['downRight','downLeft','upRight','upLeft'].indexOf(raw.direction)>=0?raw.direction:'downRight';out.movement=raw.movement==='stepped'?'stepped':'continuous';}if(cascade){out.kind='iso-cascade';out.direction=['up','down','down-right','up-left'].indexOf(raw.direction)>=0?raw.direction:'up';out.motion=raw.motion==='stepped'?'stepped':'continuous';}if(toss){out.kind='card-toss';out.flow=raw.flow==='one'?'one':'staggered';}if(focus){out.kind='iso-focus-sequence';out.direction=raw.direction==='up'?'up':'down';}if(stack)out.kind='stack-slide';if(carousel){out.kind='carousel-flow';out.direction=raw.direction==='vertical'?'vertical':'horizontal';}if(reveal){out.kind='grid-reveal';out.order=['row','column','diagonal'].indexOf(raw.order)>=0?raw.order:'row';}if(film||totem){out.kind=film?'film-strip':'card-totem';out.motion=raw.motion==='steps'?'steps':'flow';}if(spiral){out.kind='spiral-stream';out.cardCount=Math.round(out.cardCount);out.direction=raw.direction==='up'?'up':'down';out.motion=['pulse','steps'].indexOf(raw.motion)>=0?raw.motion:'flow';out.cardStyle=raw.cardStyle==='upright'?'upright':'curved';}if(cover){out.kind=coverVertical?'cover-flow-vertical':'cover-flow';out.direction=coverVertical?(raw.direction==='down'?'down':'up'):(raw.direction==='right'?'right':'left');out.motion=raw.motion==='flow'?'flow':'steps';if(coverVertical)out.flowAngle=0;}if(spin){out.kind=bottom?'wheel-spin-bottom':'wheel-spin';out.direction=raw.direction==='left'?'left':'right';out.movement=raw.movement==='stepped'?'stepped':'continuous';out.spinStyle=['self','flip'].indexOf(raw.spinStyle)>=0?raw.spinStyle:'none';out.flipAxis=raw.flipAxis==='x'?'x':'y';out.rotations=Math.round(out.rotations);out.spinRate=Math.round(out.spinRate);}if(wheel){out.kind='wheel-carousel';out.direction=raw.direction==='left'?'left':'right';}if(photo){out.kind='photo-orbit';out.direction=raw.direction==='left'?'left':'right';out.motion=['pulse','steps'].indexOf(raw.motion)>=0?raw.motion:'linear';}if(burst){out.kind='poster-burst';out.flow=['staggered','volley'].indexOf(raw.flow)>=0?raw.flow:'sequential';out.groupSize=Math.round(out.groupSize);}if(peel)out.kind='deck-peel';if(shift)out.kind='focus-shift';if(drop)out.kind='cascade-drop';if(zoom){out.kind='zoom-parallax';out.panDir=['left','right','alternate'].indexOf(raw.panDir)>=0?raw.panDir:'alternate';}if(pop)out.kind='pop-grid';if(stage){out.kind='center-stage';out.ghosts=raw.ghosts!==false;}return out;}
 function imageFocus(raw){raw=raw||{};var out={};['x','y'].forEach(function(k){var n=raw[k];out[k]=n!==''&&n!=null&&isFinite(+n)?Math.max(0,Math.min(100,+n)):50;});return out;}
 function imageCrop(iw,ih,width,height,raw){var focus=imageFocus(raw),scale=Math.max(width/iw,height/ih),w=iw*scale,h=ih*scale;return{x:(width-w)*focus.x/100,y:(height-h)*focus.y/100,width:w,height:h};}
 // Keep the original aspect ratio and all source pixels available for the drift.
 function imageZoomCrop(iw,ih,width,height,zoom,panX,raw){var focus=imageFocus(raw),scale=Math.max(width/iw,height/ih)*Math.max(1,zoom),w=iw*scale,h=ih*scale,x=Math.max(0,Math.min(100,focus.x+panX*50));return{x:(width-w)*x/100,y:(height-h)*focus.y/100,width:w,height:h};}
 function phase(progress,c,scroll){var p=scroll?Math.max(0,Math.min(1,(progress*100-c.start)/(c.end-c.start))):progress;return p*c.turns;}
 function layout(width,height,raw,progress,count,imageRatio,scroll){
  var c=config(raw),fw=width,fh=height,ratio=ratios[c.frameRatio];if(ratio){if(fw/fh>ratio)fw=fh*ratio;else fh=fw/ratio;}
  if(c.kind==='iso-orbit')return orbitLayout(width,height,fw,fh,c,progress,imageRatio,scroll);
  if(c.kind==='orbit-bloom')return bloomLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='center-stage')return stageLayout(width,height,fw,fh,c,progress,count,scroll);
  if(c.kind==='pop-grid')return popLayout(width,height,fw,fh,c,progress,count,scroll);
  if(c.kind==='zoom-parallax')return zoomLayout(width,height,fw,fh,c,progress,count,scroll);
  if(c.kind==='grid-reveal')return revealLayout(width,height,fw,fh,c,progress,count,scroll);
  if(c.kind==='cover-flow'||c.kind==='cover-flow-vertical')return coverLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='wheel-spin-bottom')return bottomLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='wheel-spin')return spinLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='wheel-carousel')return wheelLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='photo-orbit')return photoLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='poster-burst')return burstLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='deck-peel')return peelLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='film-strip'||c.kind==='card-totem')return bandLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='spiral-stream')return spiralLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='focus-shift')return shiftLayout(width,height,fw,fh,c,progress,count,scroll);
  if(c.kind==='cascade-drop')return dropLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='card-toss')return tossLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='diagonal-carousel'||c.kind==='iso-cascade')return diagonalLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='iso-focus-sequence')return focusLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='stack-slide')return stackLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='carousel-flow')return carouselLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='ticker-loop')return tickerLoopLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='ticker-tilt')return tickerLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  var unit=Math.min(fw,fh)/100,inset=unit*c.padding,radius=Math.min(fw-2*inset,fh-2*inset)/2*c.ringSize/100*1.15,cardW=unit*c.cardSize,cardH=cardW/(ratios[c.cardRatio]||Math.max(.25,Math.min(4,imageRatio||1))),tilt=c.ringTilt*Math.PI/180,opening=c.ringOpening/100,axis=Math.sqrt(1-opening*opening),co=Math.cos(tilt),si=Math.sin(tilt),angle=2*Math.PI*((phase(progress,c,scroll)%1+1)%1),cards=[];
  function point(a){var x=radius*Math.cos(a),y=-radius*Math.sin(a)*opening,scale=1+c.perspective/100*Math.sin(a);return{x:width/2+(x*co-y*si)*scale,y:height/2-(x*si+y*co)*scale,ax:-axis*si*scale*cardH/2,ay:axis*co*scale*cardH/2,depth:Math.sin(a)};}
  for(var i=0;i<count;i++){var a=angle+2*Math.PI*i/count,mid=point(a),steps=Math.min(60,Math.max(12,Math.round(cardW/4))),top=[],bottom=[],minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
   for(var j=0;j<=steps;j++){var p=point(a-(j/steps-.5)*cardW/Math.max(1,radius)),t={x:p.x-p.ax,y:p.y-p.ay},b={x:p.x+p.ax,y:p.y+p.ay};top.push(t);bottom.push(b);minX=Math.min(minX,t.x,b.x);maxX=Math.max(maxX,t.x,b.x);minY=Math.min(minY,t.y,b.y);maxY=Math.max(maxY,t.y,b.y);}
   var front=Math.max(0,Math.min(1,(mid.depth+.3)/.6));cards.push({slot:i,depth:mid.depth,alpha:1-c.backFade/100+c.backFade/100*front,left:Math.floor(minX)-3,top:Math.floor(minY)-3,width:Math.max(1,Math.ceil(maxX)-Math.floor(minX)+6),height:Math.max(1,Math.ceil(maxY)-Math.floor(minY)+6),upper:top,lower:bottom,textureWidth:cardW,textureHeight:cardH,corner:unit*c.cornerRadius*1.4});
  }
  return cards.sort(function(a,b){return a.depth-b.depth;});
 }
 function orbitLayout(width,height,fw,fh,c,progress,imageRatio,scroll){
  var cycle=(phase(progress,c,scroll)%1+1)%1,angle=c.motion==='spin'?cycle*2*Math.PI:c.swingAngle*Math.PI/180*Math.sin(cycle*2*Math.PI),co=Math.cos(angle),si=Math.sin(angle),iso=Math.cos(Math.PI/6),tilt=c.tilt/100,ux=(co-si)*iso,uy=(co+si)*iso*tilt,vx=(-si-co)*iso,vy=(-si+co)*iso*tilt;
  var aspect=ratios[c.cardRatio]||Math.max(.25,Math.min(4,imageRatio||1)),unit=Math.min(fw,fh)/100,pad=unit*c.padding,bob=unit*c.float,stepX=aspect*(1+c.spacing/100),stepY=1+c.spacing/100,extent=Math.SQRT2*iso*(Math.hypot(stepX,stepY)+Math.hypot(aspect,1)/2),scale=Math.min((fw-2*pad)/(2*extent),(fh-2*pad-2*bob)/(2*extent*tilt))*c.orbitSize/100,cardW=scale*aspect,cardH=scale,cards=[];
  for(var i=0;i<9;i++){
   var gx=(i%3-1)*stepX,gy=(Math.floor(i/3)-1)*stepY,depth=gx*uy+gy*vy,cx=width/2+(gx*ux+gy*vx)*scale,cy=height/2+depth*scale-bob*Math.sin(cycle*2*Math.PI+i*2.399963229728653),upper=[],lower=[];
   for(var j=0;j<2;j++){var dx=(j-.5)*cardW;upper.push({x:cx+dx*ux-cardH/2*vx,y:cy+dx*uy-cardH/2*vy});lower.push({x:cx+dx*ux+cardH/2*vx,y:cy+dx*uy+cardH/2*vy});}
   var points=upper.concat(lower),left=Math.floor(Math.min.apply(null,points.map(function(p){return p.x;})))-3,top=Math.floor(Math.min.apply(null,points.map(function(p){return p.y;})))-3,right=Math.ceil(Math.max.apply(null,points.map(function(p){return p.x;})))+3,bottom=Math.ceil(Math.max.apply(null,points.map(function(p){return p.y;})))+3;
   cards.push({slot:i,depth:depth,alpha:1,left:left,top:top,width:Math.max(1,right-left),height:Math.max(1,bottom-top),upper:upper,lower:lower,textureWidth:cardW,textureHeight:cardH,corner:unit*c.cornerRadius});
  }
  return cards.sort(function(a,b){return a.depth-b.depth;});
 }
 function popLayout(width,height,fw,fh,c,progress,count,scroll){
  var total=Math.max(2,Math.min(12,Math.round(count)||6)),portrait=fw<fh,columns=total===2?(portrait?1:2):total===3?(portrait?1:3):total<=4||portrait?2:3,rows=Math.ceil(total/columns),unit=Math.min(fw,fh)/100,pad=unit*c.padding,gap=unit*c.gap,tileW=Math.max(1,(fw-pad*2-gap*(columns-1))/columns),tileH=Math.max(1,(fh-pad*2-gap*(rows-1))/rows),ox=(width-fw)/2+pad,oy=(height-fh)/2+pad,edge=(1-c.visible/100)/2,cycle=(phase(progress,c,scroll)%1+1)%1,cards=[],seed=42;
  for(var i=0;i<total;i++){
   seed=(seed+1831565813)|0;var n=Math.imul(seed^seed>>>15,1|seed);n=n+Math.imul(n^n>>>7,61|n)^n;var offset=((n^n>>>14)>>>0)/4294967296,p=(cycle+offset)%1,appearance=p<edge?p/edge:p<1-edge?1:(1-p)/edge,scale=p<edge?1+3.2*Math.pow(appearance-1,3)+2.2*Math.pow(appearance-1,2):appearance;scale=Math.max(.001,scale);
   var cx=ox+(i%columns)*(tileW+gap)+tileW/2,cy=oy+Math.floor(i/columns)*(tileH+gap)+tileH/2,w=tileW*scale,h=tileH*scale,upper=[{x:cx-w/2,y:cy-h/2},{x:cx+w/2,y:cy-h/2}],lower=[{x:cx-w/2,y:cy+h/2},{x:cx+w/2,y:cy+h/2}],left=Math.floor(cx-w/2)-3,top=Math.floor(cy-h/2)-3;
   cards.push({slot:i,depth:i,alpha:Math.min(1,appearance*1.6),scale:scale,left:left,top:top,width:Math.ceil(cx+w/2)-left+3,height:Math.ceil(cy+h/2)-top+3,upper:upper,lower:lower,textureWidth:tileW,textureHeight:tileH,corner:unit*c.cornerRadius});
  }
  return cards;
 }
 // A calibrated tangent plane projects each card; the same projection is inverted for picking.
 function coverLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(3,Math.min(12,Math.round(count)||5)),vertical=c.kind==='cover-flow-vertical',unit=Math.min(fw,fh)/100,pad=unit*c.padding,clip={left:(width-fw)/2+pad,top:(height-fh)/2+pad,width:Math.max(1,fw-2*pad),height:Math.max(1,fh-2*pad)},aspect=ratios[c.cardRatio]||Math.max(.25,Math.min(4,imageRatio||1)),th=unit*c.cardSize,tw=th*aspect,extent=vertical?th:tw,stride=extent+unit*c.gap,span=total*stride,tilt=c.sideTilt*Math.PI/180,focal=Math.max(extent*1.9,stride*Math.tan(tilt/2)*1.05),radius=tilt>1e-8?stride*focal/(focal*Math.sin(tilt)-stride*(1-Math.cos(tilt))):0,ox=width/2+unit*c.offsetX,oy=height/2+unit*c.offsetY,flow=c.flowAngle*Math.PI/180,cycle=(phase(progress,c,scroll)%1+1)%1,travel=cycle*total,dir=c.direction==='right'||c.direction==='down'?-1:1,cards=[];
  if(c.motion==='steps'){if(Math.abs(travel-Math.round(travel))<1e-10)travel=Math.round(travel)%total;var local=Math.min(1,(travel-Math.floor(travel))/.55);travel=Math.floor(travel)+local*local*(3-2*local);}
  for(var slot=0;slot<total;slot++){
   var offset=slot*stride-dir*travel*stride;offset-=span*Math.round(offset/span);var distance=offset/stride,alpha=Math.max(0,Math.min(1,(1.5-Math.abs(distance))/.3))*(1-.16*Math.min(1,Math.abs(distance))),corner=Math.min(tw/2,th/2,unit*c.cornerRadius),depth=-Math.abs(distance)+slot*1e-9,card={slot:slot,depth:depth,alpha:0,visible:false,left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],instances:[],textureWidth:tw,textureHeight:th,corner:corner,clip:clip};cards.push(card);if(alpha<=0)continue;
   var angle=distance*tilt,co=Math.cos(angle),si=Math.sin(angle),axis=tilt>1e-8?radius*Math.sin(angle):offset,z=tilt>1e-8?radius*(1-Math.cos(angle)):0,center=axis*focal/(focal+z);if(focal*co+radius*(co-1)<=unit*.0001)continue;
   var cx=vertical?ox:ox+center*Math.cos(flow),cy=vertical?oy+center:oy+center*Math.sin(flow),steps=tilt>1e-8?48:1,upper=[],lower=[],stripDepth=[];
   function point(u,v){var along=vertical?v:u,scale=focal/(focal+z+along*si),projected=(axis+along*co)*scale-center;return{x:vertical?cx+u*scale:cx+projected,y:vertical?cy+projected:cy+v*scale};}
   for(var j=0;j<=steps;j++){var p=(j/steps-.5)*extent;upper.push(vertical?point(-tw/2,p):point(p,-th/2));lower.push(vertical?point(tw/2,p):point(p,th/2));if(j<steps)stripDepth.push(depth);}
   var polygon=upper.concat(lower.slice().reverse()),xs=polygon.map(function(q){return q.x;}),ys=polygon.map(function(q){return q.y;}),minX=Math.min.apply(null,xs),maxX=Math.max.apply(null,xs),minY=Math.min.apply(null,ys),maxY=Math.max.apply(null,ys);if(maxX<=clip.left||minX>=clip.left+clip.width||maxY<=clip.top||minY>=clip.top+clip.height)continue;
   var shadowPolygon=[];for(var k=0;k<4;k++){var cornerX=k===0||k===3?tw/2-corner:-tw/2+corner,cornerY=k<2?th/2-corner:-th/2+corner;for(var j=0;j<=5;j++){var a=(k*.5+j/5*.5)*Math.PI;shadowPolygon.push(point(cornerX+Math.cos(a)*corner,cornerY+Math.sin(a)*corner));}}
   var margin=unit*3,left=Math.max(clip.left,minX-margin),top=Math.max(clip.top,minY-margin),right=Math.min(clip.left+clip.width,maxX+margin),bottom=Math.min(clip.top+clip.height,maxY+margin),projectiveRound={cx:cx,cy:cy,axis:axis,z:z,center:center,focal:focal,angle:angle,width:tw,height:th,radius:corner,vertical:vertical},instance={center:distance,depth:depth,alpha:alpha,upper:upper,lower:lower,polygon:polygon,stripDepth:stripDepth,vertical:vertical,projectiveRound:projectiveRound,shadowPolygon:shadowPolygon};
   card.left=left;card.top=top;card.width=right-left;card.height=bottom-top;card.upper=upper;card.lower=lower;card.instances=[instance];card.alpha=alpha;card.visible=true;
  }
  return cards;
 }
 // Opposite physical cards link to one editable source. Delays finish within the same turn.
 function bottomLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(4,Math.min(14,Math.round(count)||8)),physical=total*2,unit=Math.min(fw,fh)/100,pad=unit*c.padding,clip={left:(width-fw)/2+pad,top:(height-fh)/2+pad,width:Math.max(1,fw-2*pad),height:Math.max(1,fh-2*pad)},aspect=ratios[c.cardRatio]||Math.max(.25,Math.min(4,imageRatio||1)),th=unit*c.cardSize,tw=th*aspect,radius=unit*c.wheelSize,ox=width/2+unit*c.offsetX,oy=height/2+radius+unit*c.offsetY,cycle=(phase(progress,c,scroll)%1+1)%1,dir=c.direction==='left'?-1:1,travel=cycle*physical*c.rotations,step=Math.PI*2/physical,self=dir*Math.PI*2*c.spinRate*cycle,cards=[];
  if(Math.abs(travel-Math.round(travel))<1e-10)travel=Math.round(travel);
  var turn=Math.floor(travel),local=travel-turn,moving=1-c.hold/100,a=c.anticipation/100,o=c.overshoot/100;
  function wrap(p){return(p%1+1)%1;}
  function smooth(p){p=Math.max(0,Math.min(1,p));return p*p*(3-2*p);}
  function tick(t){t=Math.max(0,Math.min(1,t));return t<.2?-a*smooth(t/.2):t<.6?-a+(1+o+a)*smooth((t-.2)/.4):1+o*(1-smooth((t-.6)/.4));}
  for(var slot=0;slot<total;slot++)cards.push({slot:slot,depth:-2,alpha:0,visible:false,left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],instances:[],textureWidth:tw,textureHeight:th,corner:Math.min(tw/2,th/2,unit*c.cornerRadius),clip:clip});
  for(var index=0;index<physical;index++){
   var slot=index%total,delay=Math.min(wrap(wrap(index/physical+dir*turn/physical)+.5)*c.stagger/100,c.hold/100/moving),orbit=c.movement==='stepped'?dir*(turn+tick(local/moving-delay))*step:dir*Math.PI*2*c.rotations*cycle,raw=index*step+orbit,angle=Math.atan2(Math.sin(raw),Math.cos(raw)),rotation=c.spinStyle==='self'?angle+self:angle,co=Math.cos(rotation),si=Math.sin(rotation),flip=c.spinStyle==='flip'?Math.cos(self+index*step):1,sx=c.spinStyle==='flip'&&c.flipAxis==='y'?flip:1,sy=c.spinStyle==='flip'&&c.flipAxis==='x'?flip:1,cx=ox+Math.sin(angle)*radius,cy=oy-Math.cos(angle)*radius,depth=Math.cos(angle)+slot*1e-9+(angle>=0?1e-10:0),card=cards[slot];if(Math.abs(flip)<.002)continue;
   function point(x,y){return{x:cx+x*sx*co-y*sy*si,y:cy+x*sx*si+y*sy*co};}
   var upper=[point(-tw/2,-th/2),point(tw/2,-th/2)],lower=[point(-tw/2,th/2),point(tw/2,th/2)],polygon=upper.concat(lower.slice().reverse()),xs=polygon.map(function(q){return q.x;}),ys=polygon.map(function(q){return q.y;}),minX=Math.min.apply(null,xs),maxX=Math.max.apply(null,xs),minY=Math.min.apply(null,ys),maxY=Math.max.apply(null,ys);if(maxX<=clip.left||minX>=clip.left+clip.width||maxY<=clip.top||minY>=clip.top+clip.height)continue;
   var margin=unit*3,left=Math.max(clip.left,minX-margin),top=Math.max(clip.top,minY-margin),right=Math.min(clip.left+clip.width,maxX+margin),bottom=Math.min(clip.top+clip.height,maxY+margin),rounded={cx:cx,cy:cy,width:tw,height:th,angle:rotation,radius:card.corner,scaleX:sx,scaleY:sy},instance={angle:angle,depth:depth,alpha:1,upper:upper,lower:lower,polygon:polygon,stripDepth:[depth],vertical:false,rounded:rounded};
   if(!card.instances.length){card.left=left;card.top=top;card.width=right-left;card.height=bottom-top;card.upper=upper;card.lower=lower;}else{var farX=Math.max(card.left+card.width,right),farY=Math.max(card.top+card.height,bottom);card.left=Math.min(card.left,left);card.top=Math.min(card.top,top);card.width=farX-card.left;card.height=farY-card.top;}
   card.instances.push(instance);card.alpha=1;card.visible=true;card.depth=Math.max(card.depth,depth);
  }
  return cards;
 }
 // The wheel and each card share the Director's phase; textures keep their unprojected size.
 function spinLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(4,Math.min(14,Math.round(count)||8)),unit=Math.min(fw,fh)/100,pad=unit*c.padding,clip={left:(width-fw)/2+pad,top:(height-fh)/2+pad,width:Math.max(1,fw-2*pad),height:Math.max(1,fh-2*pad)},aspect=ratios[c.cardRatio]||Math.max(.25,Math.min(4,imageRatio||1)),th=unit*c.cardSize,tw=th*aspect,radius=Math.max(0,Math.min(clip.width,clip.height)/2-Math.hypot(tw,th)/2)*c.wheelSize/100,ox=width/2+unit*c.offsetX,oy=height/2+unit*c.offsetY,cycle=(phase(progress,c,scroll)%1+1)%1,dir=c.direction==='left'?-1:1,travel=cycle*total*c.rotations,cards=[];
  if(c.movement==='stepped'){
   if(Math.abs(travel-Math.round(travel))<1e-10)travel=Math.round(travel);
   var turn=Math.floor(travel),t=Math.min(1,(travel-turn)/(1-c.hold/100)),a=c.anticipation/100,o=c.overshoot/100;
   function smooth(p){p=Math.max(0,Math.min(1,p));return p*p*(3-2*p);}
   travel=turn+(t<.2?-a*smooth(t/.2):t<.6?-a+(1+o+a)*smooth((t-.2)/.4):1+o*(1-smooth((t-.6)/.4)));
  }
  var orbit=dir*travel*Math.PI*2/total,self=dir*Math.PI*2*c.spinRate*cycle;
  for(var slot=0;slot<total;slot++){
   var raw=slot*Math.PI*2/total+orbit,angle=Math.atan2(Math.sin(raw),Math.cos(raw)),rotation=c.spinStyle==='self'?angle+self:angle,co=Math.cos(rotation),si=Math.sin(rotation),flip=c.spinStyle==='flip'?Math.cos(self+slot*Math.PI*2/total):1,sx=c.spinStyle==='flip'&&c.flipAxis==='y'?flip:1,sy=c.spinStyle==='flip'&&c.flipAxis==='x'?flip:1,cx=ox+Math.sin(angle)*radius,cy=oy-Math.cos(angle)*radius,depth=Math.cos(angle)+slot*1e-9,corner=Math.min(tw/2,th/2,unit*c.cornerRadius),card={slot:slot,depth:depth,alpha:0,visible:false,left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],instances:[],textureWidth:tw,textureHeight:th,corner:corner,clip:clip};
   cards.push(card);if(Math.abs(flip)<.002)continue;
   function point(x,y){return{x:cx+x*sx*co-y*sy*si,y:cy+x*sx*si+y*sy*co};}
   var upper=[point(-tw/2,-th/2),point(tw/2,-th/2)],lower=[point(-tw/2,th/2),point(tw/2,th/2)],polygon=upper.concat(lower.slice().reverse()),xs=polygon.map(function(q){return q.x;}),ys=polygon.map(function(q){return q.y;}),minX=Math.min.apply(null,xs),maxX=Math.max.apply(null,xs),minY=Math.min.apply(null,ys),maxY=Math.max.apply(null,ys);if(maxX<=clip.left||minX>=clip.left+clip.width||maxY<=clip.top||minY>=clip.top+clip.height)continue;
   var margin=unit*3,left=Math.max(clip.left,minX-margin),top=Math.max(clip.top,minY-margin),right=Math.min(clip.left+clip.width,maxX+margin),bottom=Math.min(clip.top+clip.height,maxY+margin),rounded={cx:cx,cy:cy,width:tw,height:th,angle:rotation,radius:corner,scaleX:sx,scaleY:sy},instance={angle:angle,depth:depth,alpha:1,upper:upper,lower:lower,polygon:polygon,stripDepth:[depth],vertical:false,rounded:rounded};
   card.left=left;card.top=top;card.width=right-left;card.height=bottom-top;card.upper=upper;card.lower=lower;card.instances=[instance];card.alpha=1;card.visible=true;
  }
  return cards;
 }
 function wheelLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(4,Math.min(10,Math.round(count)||6)),unit=Math.min(fw,fh)/100,pad=unit*c.padding,clip={left:(width-fw)/2+pad,top:(height-fh)/2+pad,width:Math.max(1,fw-2*pad),height:Math.max(1,fh-2*pad)},aspect=ratios[c.cardRatio]||Math.max(.25,Math.min(4,imageRatio||1)),th=unit*c.cardSize,tw=th*aspect,radius=unit*c.wheelSize,ox=width/2+unit*c.offsetX,oy=height/2+radius+unit*c.offsetY,cycle=(phase(progress,c,scroll)%1+1)%1,at=cycle*total,cards=[];
  if(Math.abs(at-Math.round(at))<1e-10)at=Math.round(at)%total;
  var turn=Math.floor(at),t=Math.min(1,(at-turn)/(1-c.hold/100)),a=c.anticipation/100,o=c.overshoot/100;
  function smooth(p){p=Math.max(0,Math.min(1,p));return p*p*(3-2*p);}
  var offset=t<.2?-a*smooth(t/.2):t<.6?-a+(1+o+a)*smooth((t-.2)/.4):1+o*(1-smooth((t-.6)/.4)),position=turn+offset;
  for(var slot=0;slot<total;slot++)cards.push({slot:slot,depth:-2,alpha:0,visible:false,left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],instances:[],textureWidth:tw,textureHeight:th,corner:Math.min(tw/2,th/2,unit*c.cornerRadius),clip:clip});
  for(var index=0;index<total*2;index++){
   var slot=index%total,raw=(c.direction==='left'?-1:1)*(position-index)*Math.PI/total,angle=Math.atan2(Math.sin(raw),Math.cos(raw)),co=Math.cos(angle),si=Math.sin(angle);if(co<-.05)continue;
   var cx=ox+si*radius,cy=oy-co*radius,depth=co+slot*1e-9+(angle>=0?1e-10:0),card=cards[slot];
   function point(x,y){return{x:cx+x*co-y*si,y:cy+x*si+y*co};}
   var upper=[point(-tw/2,-th/2),point(tw/2,-th/2)],lower=[point(-tw/2,th/2),point(tw/2,th/2)],polygon=upper.concat(lower.slice().reverse()),xs=polygon.map(function(q){return q.x;}),ys=polygon.map(function(q){return q.y;}),minX=Math.min.apply(null,xs),maxX=Math.max.apply(null,xs),minY=Math.min.apply(null,ys),maxY=Math.max.apply(null,ys);if(maxX<=clip.left||minX>=clip.left+clip.width||maxY<=clip.top||minY>=clip.top+clip.height)continue;
   var margin=unit*3,left=Math.max(clip.left,minX-margin),top=Math.max(clip.top,minY-margin),right=Math.min(clip.left+clip.width,maxX+margin),bottom=Math.min(clip.top+clip.height,maxY+margin),rounded={cx:cx,cy:cy,width:tw,height:th,angle:angle,radius:card.corner},instance={angle:angle,depth:depth,alpha:1,upper:upper,lower:lower,polygon:polygon,stripDepth:[depth],vertical:false,rounded:rounded};instance.alpha=Math.min(1,Math.max(0,(co+.05)/.1));if(instance.alpha<=0)continue;
   if(!card.instances.length){card.left=left;card.top=top;card.width=right-left;card.height=bottom-top;card.upper=upper;card.lower=lower;}else{var farX=Math.max(card.left+card.width,right),farY=Math.max(card.top+card.height,bottom);card.left=Math.min(card.left,left);card.top=Math.min(card.top,top);card.width=farX-card.left;card.height=farY-card.top;}
   card.instances.push(instance);card.alpha=1;card.visible=true;card.depth=Math.max(card.depth,depth);
  }
  return cards;
 }
 function photoLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(3,Math.min(12,Math.round(count)||8)),unit=Math.min(fw,fh)/100,pad=unit*c.padding,clip={left:(width-fw)/2+pad,top:(height-fh)/2+pad,width:Math.max(1,fw-2*pad),height:Math.max(1,fh-2*pad)},aspect=ratios[c.cardRatio]||Math.max(.25,Math.min(4,imageRatio||1)),cycle=(phase(progress,c,scroll)%1+1)%1,travel=cycle,rx=clip.width*c.ringWidth/200,ry=clip.height*c.ringHeight/200,sizes=[1,.88,.96,.8,1.04,.9,.98,.84],radii=[0,5,-3,7,-5,3,-7,4],cards=[];
  if(c.motion==='pulse')travel+=c.pulse/100*Math.sin(cycle*2*Math.PI)/(2*Math.PI);
  if(c.motion==='steps'){var at=cycle*total; if(Math.abs(at-Math.round(at))<1e-10)at=Math.round(at)%total;var local=Math.min(1,(at-Math.floor(at))/.55);travel=(Math.floor(at)+local*local*(3-2*local))/total;}
  for(var i=0;i<total;i++){
   var angle=2*Math.PI*((c.direction==='left'?-travel:travel)+i/total),spread=1+radii[i%radii.length]/100,w=unit*c.cardSize*sizes[i%sizes.length],h=w/aspect,cx=width/2+Math.sin(angle)*rx*spread,cy=height/2-Math.cos(angle)*ry*spread,rect={left:cx-w/2,top:cy-h/2,width:w,height:h},margin=unit*3,left=Math.max(clip.left,rect.left-margin),top=Math.max(clip.top,rect.top-margin),right=Math.min(clip.left+clip.width,rect.left+w+margin),bottom=Math.min(clip.top+clip.height,rect.top+h+margin),visible=rect.left<clip.left+clip.width&&rect.left+w>clip.left&&rect.top<clip.top+clip.height&&rect.top+h>clip.top;
   // Cards stay upright and keep their source order when they overlap.
   cards.push({slot:i,depth:i,alpha:visible?1:0,visible:visible,angle:angle,rect:rect,clip:clip,left:left,top:top,width:Math.max(1,right-left),height:Math.max(1,bottom-top),upper:[{x:rect.left,y:rect.top},{x:rect.left+w,y:rect.top}],lower:[{x:rect.left,y:rect.top+h},{x:rect.left+w,y:rect.top+h}],textureWidth:w,textureHeight:h,corner:Math.min(w/2,h/2,unit*c.cornerRadius*.5)});
  }
  return cards;
 }
 function burstLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(2,Math.min(10,Math.round(count)||4)),unit=Math.min(fw,fh)/100,pad=unit*c.padding,clip={left:(width-fw)/2+pad,top:(height-fh)/2+pad,width:Math.max(1,fw-2*pad),height:Math.max(1,fh-2*pad)},aspect=c.cardRatio==='frame'?clip.width/clip.height:ratios[c.cardRatio]||Math.max(.25,Math.min(4,imageRatio||1)),th=Math.max(clip.height,clip.width/aspect),tw=th*aspect,cycle=(phase(progress,c,scroll)%1+1)%1,at=cycle*total,group=Math.min(total,c.groupSize),interval=1/Math.ceil(total/group),delay=interval*Math.min(.16,.6/Math.max(1,group-1)),grow=c.flow==='staggered'?Math.min((1+3*c.overlap/100)/total,1-1/total):interval*(total===2?.16:.26),scales=[],ages=[],cards=[];
  if(Math.abs(at-Math.round(at))<1e-10)at=Math.round(at)%total;
  function impulse(t){t=Math.max(0,Math.min(1,t));return .5+4*Math.pow(t-.5,3);}
  for(var i=0;i<total;i++){
   if(c.flow==='sequential'){var current=Math.floor(at),local=at-current;scales[i]=i===current?impulse(local/(1-c.hold/100)):i===(current+total-1)%total?1:0;ages[i]=i===current?local/total:i===(current+total-1)%total?(local+1)/total:1;}
   else{var start=c.flow==='volley'?Math.floor(i/group)*interval+(i%group)*delay:i/total,age=((cycle-start)%1+1)%1;if(age<1e-10)age=0;ages[i]=age;var t=Math.min(1,age/grow);scales[i]=c.flow==='staggered'?1-Math.pow(1-t,3):impulse(t);}
  }
  // Once a source covers the frame, older covered sources need no raster work.
  var youngestFull=1;for(var i=0;i<total;i++)if(scales[i]===1)youngestFull=Math.min(youngestFull,ages[i]);
  for(var i=0;i<total;i++){
   var scale=scales[i],w=tw*scale,h=th*scale,rect={left:width/2-w/2,top:height/2-h/2,width:w,height:h},visible=scale>1e-7&&ages[i]<=youngestFull+1e-10,margin=unit*3,left=Math.max(clip.left,rect.left-margin),top=Math.max(clip.top,rect.top-margin),right=Math.min(clip.left+clip.width,rect.left+w+margin),bottom=Math.min(clip.top+clip.height,rect.top+h+margin),corner=Math.min(w/2,h/2,unit*c.cornerRadius*4*(1-scale*.92));
   cards.push({slot:i,depth:1-ages[i],age:ages[i],alpha:visible?1:0,visible:visible,scale:scale,rect:rect,clip:clip,shadowStrength:Math.sin(Math.PI*scale),left:left,top:top,width:Math.max(1,right-left),height:Math.max(1,bottom-top),upper:[{x:rect.left,y:rect.top},{x:rect.left+w,y:rect.top}],lower:[{x:rect.left,y:rect.top+h},{x:rect.left+w,y:rect.top+h}],textureWidth:tw,textureHeight:th,corner:corner});
  }
  return cards.sort(function(a,b){return a.depth-b.depth;});
 }
 function peelLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(4,Math.min(8,Math.round(count)||4)),unit=Math.min(fw,fh)/100,pad=unit*c.padding,clip={left:(width-fw)/2+pad,top:(height-fh)/2+pad,width:Math.max(1,fw-2*pad),height:Math.max(1,fh-2*pad)},aspect=ratios[c.cardRatio]||Math.max(.25,Math.min(4,imageRatio||1)),tw=unit*c.cardSize,th=tw/aspect,peek=unit*c.peek,cycle=(phase(progress,c,scroll)%1+1)%1,at=cycle*total; if(Math.abs(at-Math.round(at))<1e-10)at=Math.round(at)%total;
  var current=Math.floor(at),local=Math.min(1,(at-current)/.45),p=local*local*(3-2*local),cards=[];
  for(var i=0;i<total;i++)cards.push({slot:i,depth:-5,alpha:0,visible:false,left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],instances:[],textureWidth:tw,textureHeight:th,corner:unit*c.cornerRadius*1.6,clip:clip});
  function add(slot,level,fall,alpha){
   if(alpha<=0)return;
   var sx=1-.03*level,angle=fall*5*Math.PI/180,co=Math.cos(angle),si=Math.sin(angle),cx=width/2,cy=height/2-level*peek+fall*(clip.top+clip.height-height/2+th/2+unit*12+tw*.1),depth=fall>=0&&level===0?5:-level;
   function point(x,y){return{x:cx+x*co-y*si,y:cy+x*si+y*co};}
   var upper=[point(-tw*sx/2,-th/2),point(tw*sx/2,-th/2)],lower=[point(-tw*sx/2,th/2),point(tw*sx/2,th/2)],polygon=upper.concat(lower.slice().reverse()),xs=polygon.map(function(q){return q.x;}),ys=polygon.map(function(q){return q.y;}),left=Math.max(clip.left,Math.min.apply(null,xs)),top=Math.max(clip.top,Math.min.apply(null,ys)),right=Math.min(clip.left+clip.width,Math.max.apply(null,xs)),bottom=Math.min(clip.top+clip.height,Math.max.apply(null,ys));if(right<=left||bottom<=top)return;
   var card=cards[slot],t={level:level,fall:fall,depth:depth,alpha:alpha,upper:upper,lower:lower,polygon:polygon,stripDepth:[depth],vertical:false};
   if(!card.instances.length){card.left=left;card.top=top;card.width=right-left;card.height=bottom-top;card.upper=upper;card.lower=lower;}else{var farX=Math.max(card.left+card.width,right),farY=Math.max(card.top+card.height,bottom);card.left=Math.min(card.left,left);card.top=Math.min(card.top,top);card.width=farX-card.left;card.height=farY-card.top;}
   card.instances.push(t);card.alpha=1;card.visible=true;card.depth=Math.max(card.depth,depth);
  }
  for(var level=4;level>=1;level--)add((current+level)%total,level-p,0,level===4?p:1);
  add(current,0,p,1);return cards;
 }
 function bandLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(3,Math.min(12,Math.round(count)||6)),vertical=c.kind==='card-totem',unit=Math.min(fw,fh)/100,pad=unit*c.padding,clip={left:(width-fw)/2+pad,top:(height-fh)/2+pad,width:Math.max(1,fw-2*pad),height:Math.max(1,fh-2*pad)},aspect=ratios[c.cardRatio]||Math.max(.25,Math.min(4,imageRatio||1)),size=unit*c.cardSize,textureW=vertical?size:size*aspect,textureH=vertical?size/aspect:size,axis=vertical?textureH:textureW,cross=vertical?textureW:textureH,step=axis+unit*c.gap,period=step*total,frame=vertical?clip.height:clip.width,view=frame/2+step,bend=Math.abs(c.curve)/100,sign=Math.sign(c.curve),radius=view/Math.max(.06,bend*Math.PI/2.2),normal=1-Math.cos(Math.max(.06,bend*Math.PI/2.2)),cycle=(phase(progress,c,scroll)%1+1)%1,travel=cycle*period,cards=[];
  if(c.motion==='steps'){var at=cycle*total,local=Math.min(1,(at-Math.floor(at))/.55);travel=(Math.floor(at)+local*local*(3-2*local))*step;}
  function position(x){if(sign>0)return Math.sin(Math.max(-Math.PI/2,Math.min(Math.PI/2,x/radius)))*radius;if(sign<0)return x*(1+.45*bend*Math.pow(x/view,2));return x;}
  function recession(x){return Math.min(1.5,(1-Math.cos(Math.min(Math.abs(x)/radius,Math.PI/2)))/normal);}
  function breadth(x){return cross*(sign>0?1-.55*bend*recession(x):sign<0?1+.4*bend*recession(x):1);}
  var reach=sign>0?radius*(radius>frame/2?Math.asin(frame/2/radius):Math.PI/2)+axis/2:frame/2+axis/2,steps=bend<.03?1:48;
  for(var slot=0;slot<total;slot++){
   var card={slot:slot,depth:-2,alpha:0,visible:false,left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],instances:[],textureWidth:textureW,textureHeight:textureH,corner:unit*c.cornerRadius*1.2,clip:clip},origin=slot*step-travel,first=Math.ceil((-reach-origin)/period),last=Math.floor((reach-origin)/period);
   for(var rep=first;rep<=last;rep++){
    var center=origin+rep*period,upper=[],lower=[],stripDepth=[];
    for(var j=0;j<=steps;j++){var raw=center+(j/steps-.5)*axis,projected=position(raw),extent=breadth(raw)/2;if(vertical){upper.push({x:width/2-extent,y:height/2+projected});lower.push({x:width/2+extent,y:height/2+projected});}else{upper.push({x:width/2+projected,y:height/2-extent});lower.push({x:width/2+projected,y:height/2+extent});}if(j<steps)stripDepth.push(-Math.abs(center+((j+.5)/steps-.5)*axis)/view);}
    var polygon=upper.concat(lower.slice().reverse()),xs=polygon.map(function(p){return p.x;}),ys=polygon.map(function(p){return p.y;}),left=Math.max(clip.left,Math.min.apply(null,xs)),top=Math.max(clip.top,Math.min.apply(null,ys)),right=Math.min(clip.left+clip.width,Math.max.apply(null,xs)),bottom=Math.min(clip.top+clip.height,Math.max.apply(null,ys));if(right<=left||bottom<=top)continue;
    var alpha=sign>0?Math.max(.25,1-.45*bend*recession(center)):1,depth=-Math.abs(center)/view,instance={copy:rep,center:center,depth:depth,alpha:alpha,upper:upper,lower:lower,polygon:polygon,stripDepth:stripDepth,vertical:vertical};
    if(!card.instances.length){card.left=left;card.top=top;card.width=right-left;card.height=bottom-top;card.upper=upper;card.lower=lower;}else{var farX=Math.max(card.left+card.width,right),farY=Math.max(card.top+card.height,bottom);card.left=Math.min(card.left,left);card.top=Math.min(card.top,top);card.width=farX-card.left;card.height=farY-card.top;}
    card.instances.push(instance);card.alpha=1;card.visible=true;card.depth=Math.max(card.depth,depth);
   }
   cards.push(card);
  }
  return cards;
 }
 function spiralLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(6,Math.min(20,Math.round(count)||12)),unit=Math.min(fw,fh)/100,pad=unit*c.padding,clip={left:(width-fw)/2+pad,top:(height-fh)/2+pad,width:Math.max(1,fw-2*pad),height:Math.max(1,fh-2*pad)},radius=clip.width*c.ringSize/200,baseW=unit*c.cardSize,baseH=baseW/(ratios[c.cardRatio]||Math.max(.25,Math.min(4,imageRatio||1))),perspective=c.perspective/100,tilt=c.tilt*Math.PI/180,co=Math.cos(tilt),si=Math.sin(tilt),cycle=(phase(progress,c,scroll)%1+1)%1,travel=cycle,cards=[],flat=c.cardStyle==='upright';
  if(c.motion==='pulse')travel+=c.pulse/100*Math.sin(cycle*2*Math.PI)/(2*Math.PI);
  if(c.motion==='steps'){var at=cycle*c.cardCount,local=Math.min(1,(at-Math.floor(at))/.55);travel=(Math.floor(at)+local*local*(3-2*local))/c.cardCount;}
  // Leave enough space beyond both frame edges for the wrap, including tilt and the largest card.
  var span=(Math.abs(fw*si)+Math.abs(fh*co)+2*baseH*(1+c.scalePulse/100)*(1+perspective)+2*baseW)/(1-perspective),slope=span/(2*Math.PI*c.spiralTurns*Math.max(1,radius));
  function ring(y){var t=Math.max(0,Math.min(1,y/span+.5)),taper=c.taper/100;return radius*(1-(taper>0?taper*(1-t):-taper*t));}
  function project(angle,y,offset){var d=Math.cos(angle),scale=1+perspective*d,x=ring(y)*Math.sin(angle)*scale,yy=y*scale+offset*scale;return{x:width/2+x*co-yy*si,y:height/2+x*si+yy*co,depth:d,scale:scale};}
  for(var i=0;i<total;i++)cards.push({slot:i,depth:-2,alpha:0,visible:false,left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],instances:[],textureWidth:baseW,textureHeight:baseH,corner:unit*c.cornerRadius*1.2,clip:clip});
  for(var index=0;index<c.cardCount;index++){
   var position=((index/c.cardCount+(c.direction==='up'?-travel:travel))%1+1)%1,angle=(position-.5)*2*Math.PI*c.spiralTurns,y=(position-.5)*span,depth=Math.cos(angle),scale=(1-c.gap/100)*(1+c.scalePulse/100*Math.max(0,depth))*ring(y)/Math.max(1,radius),w=baseW*scale,h=baseH*scale,upper=[],lower=[],stripDepth=[],steps=flat?1:48,center=project(angle,y,0);
   for(var j=0;j<=steps;j++){
    var dx=(j/steps-.5)*w,a,b;
    if(flat){a={x:center.x+dx*center.scale,y:center.y-h*center.scale/2};b={x:a.x,y:center.y+h*center.scale/2};}
    else{a=project(angle+dx/Math.max(1,ring(y)),y+dx*slope,-h/2);b=project(angle+dx/Math.max(1,ring(y)),y+dx*slope,h/2);}
    upper.push({x:a.x,y:a.y});lower.push({x:b.x,y:b.y});
    if(j<steps)stripDepth.push((flat?depth:Math.cos(angle+((j+.5)/steps-.5)*w/Math.max(1,ring(y))))+index*1e-9);
   }
   var polygon=upper.concat(lower.slice().reverse()),xs=polygon.map(function(p){return p.x;}),ys=polygon.map(function(p){return p.y;}),left=Math.max(clip.left,Math.min.apply(null,xs)),top=Math.max(clip.top,Math.min.apply(null,ys)),right=Math.min(clip.left+clip.width,Math.max.apply(null,xs)),bottom=Math.min(clip.top+clip.height,Math.max.apply(null,ys));
   if(right<=left||bottom<=top)continue;
   var front=Math.max(0,Math.min(1,(depth+.3)/.6)),alpha=1-c.backFade/100*(1-front),instance={index:index,position:position,depth:depth+index*1e-9,alpha:alpha,upper:upper,lower:lower,polygon:polygon,stripDepth:stripDepth,vertical:false},card=cards[index%total];
   if(!card.instances.length){card.left=left;card.top=top;card.width=right-left;card.height=bottom-top;card.upper=upper;card.lower=lower;}
   else{var farX=Math.max(card.left+card.width,right),farY=Math.max(card.top+card.height,bottom);card.left=Math.min(card.left,left);card.top=Math.min(card.top,top);card.width=farX-card.left;card.height=farY-card.top;}
   card.instances.push(instance);card.visible=true;card.alpha=1;card.depth=Math.max(card.depth,depth);
  }
  return cards;
 }
 function shiftLayout(width,height,fw,fh,c,progress,count,scroll){
  var total=Math.max(3,Math.min(6,Math.round(count)||4)),unit=Math.min(fw,fh)/100,pad=unit*c.padding,content={left:(width-fw)/2+pad,top:(height-fh)/2+pad,width:Math.max(1,fw-2*pad),height:Math.max(1,fh-2*pad)},portrait=fh>fw*1.05,gap=unit*c.gap,rail=c.railSize/100,thumbs=[],hero,rest=total-1,cycle=(phase(progress,c,scroll)%1+1)%1,at=cycle*total,current=Math.floor(at),previous=(current+total-1)%total,local=at-current,t=Math.max(0,Math.min(1,local/.4)),blend=t*t*(3-2*t),before=[],after=[],cards=[];
  if(portrait){var railH=content.height*rail,thumbW=(content.width-gap*(rest-1))/rest;hero={left:content.left,top:content.top,width:content.width,height:content.height-railH-gap};for(var j=0;j<rest;j++)thumbs.push({left:content.left+j*(thumbW+gap),top:content.top+content.height-railH,width:thumbW,height:railH});}
  else{var railW=content.width*rail,thumbH=(content.height-gap*(rest-1))/rest;hero={left:content.left,top:content.top,width:content.width-railW-gap,height:content.height};for(var k=0;k<rest;k++)thumbs.push({left:content.left+content.width-railW,top:content.top+k*(thumbH+gap),width:railW,height:thumbH});}
  for(var n=0;n<rest;n++){before.push((previous+n+1)%total);after.push((current+n+1)%total);}
  for(var i=0;i<total;i++){
   var from=i===previous?hero:thumbs[before.indexOf(i)],to=i===current?hero:thumbs[after.indexOf(i)],rect={},focus=i===current?blend:i===previous?1-blend:0;['left','top','width','height'].forEach(function(key){rect[key]=from[key]+(to[key]-from[key])*blend;});
   cards.push({slot:i,depth:i===current?total+1:i===previous?total:i,alpha:1,visible:true,focus:focus,rail:portrait?'bottom':'right',left:Math.floor(rect.left)-3,top:Math.floor(rect.top)-3,width:Math.ceil(rect.left+rect.width)-Math.floor(rect.left)+6,height:Math.ceil(rect.top+rect.height)-Math.floor(rect.top)+6,upper:[{x:rect.left,y:rect.top},{x:rect.left+rect.width,y:rect.top}],lower:[{x:rect.left,y:rect.top+rect.height},{x:rect.left+rect.width,y:rect.top+rect.height}],textureWidth:content.width,textureHeight:content.height,corner:unit*c.cornerRadius*(.8+.2*focus),rect:rect,clip:content});
  }
  return cards.sort(function(a,b){return a.depth-b.depth;});
 }
 function dropLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(2,Math.min(8,Math.round(count)||4)),unit=Math.min(fw,fh)/100,pad=unit*c.padding,clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},boxW=Math.max(1,fw-2*pad)*c.cardSize/100,boxH=Math.max(1,fh-2*pad)*c.cardSize/100,aspect=c.cardRatio==='frame'?boxW/boxH:ratios[c.cardRatio]||Math.max(.25,Math.min(4,imageRatio||1)),cardW=Math.min(boxW,boxH*aspect),cardH=cardW/aspect,cycle=(phase(progress,c,scroll)%1+1)%1,fall=Math.min(1,cycle/.62),span=1/(total-(total-1)*.35),sweep=Math.max(0,Math.min(1,(cycle-.82)/.18)),exit=(sweep>0?Math.pow(2,10*sweep-10):0)*(height+cardH),startY=clip.top-Math.hypot(cardW,cardH)/2-unit*5,cards=[];
  for(var i=0;i<total;i++){
   var local=Math.max(0,Math.min(1,(fall-i*span*.65)/span)),arrival=local===0?0:local===1?1:1+3.2*Math.pow(local-1,3)+2.2*Math.pow(local-1,2),target=[-3,2,-1.5,2.5][i%4]*c.rotation/100,angle=target*(2.5-1.5*Math.min(1,arrival)),co=Math.cos(angle*Math.PI/180),si=Math.sin(angle*Math.PI/180),cx=width/2+(i%2===0?-1:1)*unit*.56*i,cy=startY+(height/2-startY)*arrival+exit;
   function point(x,y){return{x:cx+x*co-y*si,y:cy+x*si+y*co};}
   var upper=[point(-cardW/2,-cardH/2),point(cardW/2,-cardH/2)],lower=[point(-cardW/2,cardH/2),point(cardW/2,cardH/2)],points=upper.concat(lower),minX=Math.min.apply(null,points.map(function(p){return p.x;})),maxX=Math.max.apply(null,points.map(function(p){return p.x;})),minY=Math.min.apply(null,points.map(function(p){return p.y;})),maxY=Math.max.apply(null,points.map(function(p){return p.y;})),visible=local>0&&maxX>clip.left&&minX<clip.left+fw&&maxY>clip.top&&minY<clip.top+fh,left=Math.floor(Math.max(clip.left,Math.min(clip.left+fw,minX)))-3,top=Math.floor(Math.max(clip.top,Math.min(clip.top+fh,minY)))-3;
   cards.push({slot:i,depth:i,alpha:visible?1:0,visible:visible,arrival:arrival,angle:angle,left:left,top:top,width:visible?Math.max(1,Math.ceil(Math.min(clip.left+fw,maxX))-left+3):1,height:visible?Math.max(1,Math.ceil(Math.min(clip.top+fh,maxY))-top+3):1,upper:upper,lower:lower,textureWidth:cardW,textureHeight:cardH,corner:unit*c.cornerRadius,clip:clip});
  }
  return cards;
 }
 function zoomLayout(width,height,fw,fh,c,progress,count,scroll){
  var total=Math.max(2,Math.min(8,Math.round(count)||3)),unit=Math.min(fw,fh)/100,pad=unit*c.padding,clip={left:(width-fw)/2+pad,top:(height-fh)/2+pad,width:Math.max(1,fw-2*pad),height:Math.max(1,fh-2*pad)},cycle=(phase(progress,c,scroll)%1+1)%1,at=cycle*total,index=Math.floor(at),local=at-index,fade=.18,cards=[];
  for(var i=0;i<total;i++){
   var active=i===index,incoming=i===(index+1)%total&&local>1-fade,p=Math.max(0,Math.min(1,(local-1+fade)/fade)),alpha=active?1:incoming?p*p*(3-2*p):0;
   // The incoming image starts moving during the fade and keeps that pose at handoff.
   var age=incoming?local-1:active?local:0,t=(age+fade)/(1+fade),direction=c.panDir==='left'?-1:c.panDir==='right'?1:i%2===0?-1:1;
   cards.push({slot:i,depth:incoming?1:active?0:-1,alpha:alpha,visible:alpha>0,zoom:1+c.zoomAmount/100*t,panX:direction*(t-.5),left:Math.floor(clip.left)-3,top:Math.floor(clip.top)-3,width:Math.ceil(clip.left+clip.width)-Math.floor(clip.left)+6,height:Math.ceil(clip.top+clip.height)-Math.floor(clip.top)+6,upper:[{x:clip.left,y:clip.top},{x:clip.left+clip.width,y:clip.top}],lower:[{x:clip.left,y:clip.top+clip.height},{x:clip.left+clip.width,y:clip.top+clip.height}],textureWidth:clip.width,textureHeight:clip.height,corner:unit*c.cornerRadius,clip:clip});
  }
  return cards.sort(function(a,b){return a.depth-b.depth;});
 }
 function revealLayout(width,height,fw,fh,c,progress,count,scroll){
  var total=Math.max(2,Math.min(9,Math.round(count)||4)),columns=total<=3?total:total<=4?2:3,rows=Math.ceil(total/columns),unit=Math.min(fw,fh)/100,pad=unit*c.padding,gap=unit*c.gap,tileW=Math.max(1,(fw-2*pad-gap*(columns-1))/columns),tileH=Math.max(1,(fh-2*pad-gap*(rows-1))/rows),ox=(width-fw)/2+pad,oy=(height-fh)/2+pad,cycle=(phase(progress,c,scroll)%1+1)%1,order=[],cards=[],clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh};
  for(var slot=0;slot<total;slot++)order.push(slot);
  if(c.order==='column')order.sort(function(a,b){return a%columns-b%columns||Math.floor(a/columns)-Math.floor(b/columns);});
  if(c.order==='diagonal')order.sort(function(a,b){return Math.floor(a/columns)+a%columns-Math.floor(b/columns)-b%columns||Math.floor(a/columns)-Math.floor(b/columns);});
  function ease(t){t=Math.max(0,Math.min(1,t));return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
  for(var i=0;i<total;i++){
   var rank=order.indexOf(i),span=2/(total+1),alpha=cycle<.35?ease((cycle/.35-rank/(total+1))/span):cycle<.65?1:1-ease(((cycle-.65)/.35-(total-1-rank)/(total+1))/span),scale=.7+.3*alpha,cx=ox+(i%columns)*(tileW+gap)+tileW/2,cy=oy+Math.floor(i/columns)*(tileH+gap)+tileH/2,w=tileW*scale,h=tileH*scale,upper=[{x:cx-w/2,y:cy-h/2},{x:cx+w/2,y:cy-h/2}],lower=[{x:cx-w/2,y:cy+h/2},{x:cx+w/2,y:cy+h/2}];
   cards.push({slot:i,depth:i,alpha:alpha,visible:alpha>0,scale:scale,revealRank:rank,left:cx-w/2-3,top:cy-h/2-3,width:w+6,height:h+6,upper:upper,lower:lower,textureWidth:tileW,textureHeight:tileH,corner:unit*c.cornerRadius,clip:clip});
  }
  return cards;
 }
 function bloomLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(4,Math.min(16,Math.round(count)||12)),cycle=(phase(progress,c,scroll)%1+1)%1;if(c.motion==='pulse')cycle+=c.pulse/100/(2*Math.PI)*Math.sin(cycle*2*Math.PI);
  var unit=Math.min(fw,fh)/100,pad=unit*c.padding,rx=(fw-2*pad)/2*c.ringWidth/100,ry=(fh-2*pad)/2*c.ringHeight/100,ratio=rx>0?Math.min(ry/rx,.92):.92,axis=Math.sqrt(1-ratio*ratio),lean=c.lean/100*Math.PI/2,lc=Math.cos(lean),ls=Math.sin(lean),tilt=c.ringTilt*Math.PI/180,co=Math.cos(tilt),si=Math.sin(tilt),perspective=c.perspective/100,near=1+.35*perspective,far=1-.55*perspective,baseW=unit*c.cardSize,aspect=ratios[c.cardRatio]||Math.max(.25,Math.min(4,imageRatio||1)),textureW=baseW*near,textureH=textureW/aspect,bend=Math.abs(c.curve)>3?Math.abs(c.curve)/100*Math.PI/2.2:0,sign=Math.sign(c.curve),steps=bend>.03?Math.min(128,Math.max(24,Math.ceil(textureW/3))):1,cards=[];
  for(var i=0;i<total;i++){
   var angle=2*Math.PI*((c.direction==='left'?-cycle:cycle)+i/total),sn=Math.sin(angle),cs=Math.cos(angle),depth=(cs+1)/2,scale=far+(near-far)*depth,cx=sn*rx*(1+.18*perspective*cs),cy=cs*ry,w=baseW*scale,h=w/aspect,ux=sn*lc,uy=-ls*axis+cs*lc*ratio,vx=sn*ls,vy=lc*axis+cs*ls*ratio,upper=[],lower=[],stripDepth=[];
   function point(t,edge){var x=(t-.5)*w,z=0;if(bend>.03){x=-w/2+w/bend*Math.sin(t*bend);z=sign*w/bend*(1-Math.cos(t*bend));}var px=cx+x*ux-z*cs+edge*h/2*vx,py=cy+x*uy+z*sn*ratio+edge*h/2*vy;return{x:width/2+px*co-py*si,y:height/2+px*si+py*co};}
   for(var j=0;j<=steps;j++){upper.push(point(j/steps,-1));lower.push(point(j/steps,1));if(j<steps){var t=(j+.5)/steps,x=(t-.5)*w,z=0;if(bend>.03){x=-w/2+w/bend*Math.sin(t*bend);z=sign*w/bend*(1-Math.cos(t*bend));}stripDepth.push(rx*cs*axis+x*cs*lc+z*sn);}}
   var points=upper.concat(lower.slice().reverse()),area=0;for(var k=0;k<points.length;k++){var a=points[k],b=points[(k+1)%points.length];area+=a.x*b.y-a.y*b.x;}
   var left=Math.floor(Math.min.apply(null,points.map(function(p){return p.x;})))-3,top=Math.floor(Math.min.apply(null,points.map(function(p){return p.y;})))-3,right=Math.ceil(Math.max.apply(null,points.map(function(p){return p.x;})))+3,bottom=Math.ceil(Math.max.apply(null,points.map(function(p){return p.y;})))+3;
   cards.push({slot:i,depth:depth,alpha:1-c.backFade/100*(1-depth),visible:Math.abs(area)>textureW*textureH*.002,stripDepth:bend>.03?stripDepth:null,left:left,top:top,width:Math.max(1,right-left),height:Math.max(1,bottom-top),upper:upper,lower:lower,textureWidth:textureW,textureHeight:textureH,corner:unit*c.cornerRadius*near});
  }
  return cards.sort(function(a,b){return a.depth-b.depth;});
 }
 function stageLayout(width,height,fw,fh,c,progress,count,scroll){
  var total=Math.max(2,Math.min(6,Math.round(count)||3)),cycle=(phase(progress,c,scroll)%1+1)%1,step=cycle*total,active=Math.floor(step),local=step-active,unit=Math.min(fw,fh)/100,pad=unit*c.padding,baseW=(fw-pad*2)*c.cardSize/100,baseH=(fh-pad*2)*c.cardSize/100,travel=width*c.travel/100,cards=[];
  function ease(t){t=Math.max(0,Math.min(1,t));return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
  function surface(scale,offset,alpha){var cx=width/2+offset,w=baseW*scale,h=baseH*scale;return{upper:[{x:cx-w/2,y:height/2-h/2},{x:cx+w/2,y:height/2-h/2}],lower:[{x:cx-w/2,y:height/2+h/2},{x:cx+w/2,y:height/2+h/2}],alpha:alpha};}
  for(var i=0;i<total;i++){
   var scale=1,offset=0,alpha=0,trails=[];
   if(i===active){if(local<.75){var entry=ease(local/.3);scale=.9+.1*entry;offset=travel*(1-entry);alpha=entry;}else{var exit=ease((local-.75)/.25);scale=1-.08*exit;offset=-travel*exit;alpha=1-exit;if(c.ghosts)for(var k=3;k>=1;k--){var lag=ease((local-k*.025-.75)/.25);trails.push(surface(1-.08*lag,-travel*lag,.12*(4-k)));}}}
   var main=surface(scale,offset,1),points=main.upper.concat(main.lower);trails.forEach(function(t){points=points.concat(t.upper,t.lower);});var left=Math.floor(Math.min.apply(null,points.map(function(p){return p.x;})))-3,top=Math.floor(Math.min.apply(null,points.map(function(p){return p.y;})))-3,right=Math.ceil(Math.max.apply(null,points.map(function(p){return p.x;})))+3,bottom=Math.ceil(Math.max.apply(null,points.map(function(p){return p.y;})))+3;
   cards.push({slot:i,depth:i===active?1:0,alpha:alpha,scale:scale,left:left,top:top,width:right-left,height:bottom-top,upper:main.upper,lower:main.lower,trails:trails,textureWidth:baseW,textureHeight:baseH,corner:unit*c.cornerRadius});
  }
  return cards.sort(function(a,b){return a.depth-b.depth;});
 }
 function tickerLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(4,Math.min(24,Math.round(count)||12)),cycle=(phase(progress,c,scroll)%1+1)%1,unit=Math.min(fw,fh)/100,rowStep=Math.max(2,fh*c.zoom/100),gap=unit*c.rowGap,tileH=Math.max(1,rowStep-gap),aspect=ratios[c.cardRatio]||Math.max(.25,Math.min(4,imageRatio||1)),tileW=tileH*aspect,stepX=tileW+unit*3,period=stepX*total,angle=c.tilt*Math.PI/180,sn=Math.sin(angle),cs=Math.cos(angle),planeH=fh*2.4,distance=planeH*(1.4-.9*c.perspective/100),minScale=distance/(distance+planeH/2*Math.abs(sn)),planeW=fw/minScale*1.06,rows=Math.ceil(planeH/rowStep)+1,clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},cards=[];
  function point(x,y){var dy=planeH/2-y,scale=distance/(distance+dy*sn);return{x:width/2+(x-planeW/2)*scale,y:height/2-dy*cs*scale};}
  for(var i=0;i<total;i++)cards.push({slot:i,depth:i,alpha:0,visible:false,instances:[],left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],textureWidth:tileW,textureHeight:tileH,corner:unit*c.cornerRadius*.8,clip:clip});
  for(var row=0;row<rows;row++){
   var direction=(c.direction==='right'?1:-1)*(c.flow==='opposed'&&row%2?-1:1),delay=c.flow==='staggered'?Math.min(c.staggerDelay/100*row,.85):0,p=Math.max(0,Math.min(1,(cycle-delay)/(1-delay))),amount=delay?(p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2):p,shift=direction*period*amount+(c.flow==='staggered'?0:row*stepX*1.5),y=row*rowStep+gap/2;
   shift=(shift%period+period)%period;
   for(var slot=0;slot<total;slot++){
    var origin=slot*stepX+shift-tileW/2,first=Math.floor((-origin-tileW)/period),last=Math.ceil((planeW-origin)/period);
    for(var rep=first;rep<=last;rep++){
     var x=origin+rep*period,corners=[point(x,y),point(x+tileW,y),point(x+tileW,y+tileH),point(x,y+tileH)],left=Math.min.apply(null,corners.map(function(p){return p.x;})),right=Math.max.apply(null,corners.map(function(p){return p.x;})),top=corners[0].y,bottom=corners[2].y;
     if(right<=clip.left||left>=clip.left+fw||bottom<=clip.top||top>=clip.top+fh)continue;
     var upper=[],lower=[],steps=c.tilt===0?1:Math.min(160,Math.max(24,Math.ceil(tileH/3)));
     for(var j=0;j<=steps;j++){upper.push(point(x,y+tileH*j/steps));lower.push(point(x+tileW,y+tileH*j/steps));}
     var instance={row:row,upper:upper,lower:lower,polygon:corners,vertical:true},card=cards[slot];card.instances.push(instance);card.alpha=1;card.visible=true;
     left=Math.max(clip.left,left);right=Math.min(clip.left+fw,right);top=Math.max(clip.top,top);bottom=Math.min(clip.top+fh,bottom);
     if(card.instances.length===1){card.left=left;card.top=top;card.width=right-left;card.height=bottom-top;card.upper=upper;card.lower=lower;}else{var farX=Math.max(card.left+card.width,right),farY=Math.max(card.top+card.height,bottom);card.left=Math.min(card.left,left);card.top=Math.min(card.top,top);card.width=farX-card.left;card.height=farY-card.top;}
     var center={x:(corners[0].x+corners[1].x+corners[2].x+corners[3].x)/4,y:(top+bottom)/2};if(center.x>clip.left&&center.x<clip.left+fw&&corners[0].y>clip.top&&corners[2].y<clip.top+fh){card.upper=upper;card.lower=lower;}
    }
   }
  }
  return cards;
 }
 function tossLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(4,Math.min(16,Math.round(count)||8)),cycle=(phase(progress,c,scroll)%1+1)%1,unit=Math.min(fw,fh)/100,baseW=unit*c.cardSize,aspect=ratios[c.cardRatio]||Math.max(.25,Math.min(4,imageRatio||1)),baseH=baseW/aspect,variation=c.sizeVar/100,throwHeight=c.throwHeight/100,spread=c.spread/100,spin=c.spin*Math.PI/180,span=c.flow==='one'?1/total:Math.min(.5,2.6/total),clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},pad=unit*c.padding,target=clip.top+pad+(fh-pad*2)*(1-throwHeight)+baseH/2,margin=unit*2,cards=[];
  function random(seed){return function(){seed=seed+1831565813|0;var n=Math.imul(seed^seed>>>15,1|seed);n=n+Math.imul(n^n>>>7,61|n)^n;return ((n^n>>>14)>>>0)/4294967296;};}
  for(var slot=0;slot<total;slot++){
   var rng=random(slot*7349+13),scale=1+(rng()-.5)*2*variation,x=width/2+(rng()-.5)*spread*(fw-baseW*scale),lift=.82+rng()*.18,drift=(rng()-.5)*baseW*1.2,sense=rng()<.5?-1:1,rest=(rng()-.5)*spin,w=baseW*scale,h=baseH*scale,radius=Math.hypot(baseW,baseH)*scale/2,launch=clip.top+fh+radius,flight=((cycle-slot/total+1)%1)/span,active=flight<1,cx=x+drift*(flight-.5)*2+unit*c.offsetX,cy=launch-4*(launch-target)*lift*flight*(1-flight)+unit*c.offsetY,angle=rest+sense*spin*(flight-.5),card={slot:slot,depth:slot,alpha:0,visible:false,active:active,flight:active?flight:null,scale:scale,rotation:active?angle:0,left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],textureWidth:w,textureHeight:h,corner:unit*c.cornerRadius,clip:clip};
   if(active){var co=Math.cos(angle),si=Math.sin(angle);function point(dx,dy){return{x:cx+dx*co-dy*si,y:cy+dx*si+dy*co};}var corners=[point(-w/2,-h/2),point(w/2,-h/2),point(w/2,h/2),point(-w/2,h/2)],xs=corners.map(function(p){return p.x;}),ys=corners.map(function(p){return p.y;}),left=Math.max(clip.left,Math.min.apply(null,xs)-margin),right=Math.min(clip.left+fw,Math.max.apply(null,xs)+margin),top=Math.max(clip.top,Math.min.apply(null,ys)-margin),bottom=Math.min(clip.top+fh,Math.max.apply(null,ys)+margin);card.visible=right>left&&bottom>top;card.alpha=card.visible?1:0;card.upper=[corners[0],corners[1]];card.lower=[corners[3],corners[2]];if(card.visible){card.left=left;card.top=top;card.width=right-left;card.height=bottom-top;}}
   cards.push(card);
  }
  return cards;
 }
 function stackLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(3,Math.min(8,Math.round(count)||4)),cycle=(phase(progress,c,scroll)%1+1)%1,at=cycle*total,index=Math.floor(at),local=at-index,part=Math.max(0,Math.min(1,local/.55)),land=part<.5?4*part*part*part:1-Math.pow(-2*part+2,3)/2,unit=Math.min(fw,fh)/100,inset=unit*(c.padding+c.inset),baseW=Math.max(1,fw-inset*2),baseH=Math.max(1,fh-inset*2),aspect=ratios[c.cardRatio]||Math.max(.25,Math.min(4,imageRatio||1));
  if(c.cardRatio!=='frame'){if(baseW/baseH>aspect)baseW=baseH*aspect;else baseH=baseW/aspect;}
  var baseX=(width-baseW)/2+unit*c.offsetX,baseY=(height-baseH)/2+unit*c.offsetY,clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},margin=unit*2,cards=[];
  for(var slot=0;slot<total;slot++)cards.push({slot:slot,depth:-1,alpha:0,visible:false,left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],textureWidth:baseW,textureHeight:baseH,corner:unit*c.cornerRadius,clip:clip});
  function surface(slot,depth,scale,y,angle,alpha){
   var card=cards[slot],w=baseW*scale,h=baseH*scale,cx=baseX+baseW/2,cy=y+h/2,co=Math.cos(angle),si=Math.sin(angle);
   function point(x,y){return{x:cx+x*co-y*si,y:cy+x*si+y*co};}
   var corners=[point(-w/2,-h/2),point(w/2,-h/2),point(w/2,h/2),point(-w/2,h/2)],xs=corners.map(function(p){return p.x;}),ys=corners.map(function(p){return p.y;}),left=Math.max(clip.left,Math.min.apply(null,xs)-margin),right=Math.min(clip.left+fw,Math.max.apply(null,xs)+margin),top=Math.max(clip.top,Math.min.apply(null,ys)-margin),bottom=Math.min(clip.top+fh,Math.max.apply(null,ys)+margin),visible=right>left&&bottom>top;
   card.depth=depth;card.alpha=visible?alpha:0;card.visible=visible;card.upper=[corners[0],corners[1]];card.lower=[corners[3],corners[2]];if(visible){card.left=left;card.top=top;card.width=right-left;card.height=bottom-top;}
  }
  for(var back=2;back>=1;back--){var level=back-1+land,scale=Math.pow(c.depthScale,level),y=baseY+(baseH-baseH*scale)/2-unit*1.2*level;surface((index-back+total)%total,2-back,scale,y,0,Math.max(0,1-level*.28));}
  var below=height+baseH*.1+unit*c.offsetY;surface(index,2,1,below+(baseY-below)*land,(1-land)*Math.PI/90,1);
  return cards.sort(function(a,b){return a.depth-b.depth;});
 }
 function diagonalLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var cascade=c.kind==='iso-cascade',total=Math.max(cascade?4:3,Math.min(cascade?20:12,Math.round(count)||(cascade?10:6))),cycle=(phase(progress,c,scroll)%1+1)%1,at=cycle*total,index=Math.floor(at),local=at-index,unit=Math.min(fw,fh)/100,baseH=unit*(cascade?c.size:c.cardSize),aspect=ratios[c.cardRatio]||Math.max(.25,Math.min(4,imageRatio||1)),baseW=baseH*aspect;
  var step=Math.max(unit*.01,cascade?baseH*c.spacing/100:Math.min(baseW,baseH)*(1-c.overlap/100)),skew=cascade?c.skew/100:0,stepped=(cascade?c.motion:c.movement)==='stepped',ux,uy;
  if(cascade){var reverse=c.direction==='down'||c.direction==='up-left',slope=c.direction==='down-right'||c.direction==='up-left'?1:-1;ux=Math.cos(34*Math.PI/180)*(reverse?1:-1);uy=Math.sin(34*Math.PI/180)*slope*(reverse?1:-1);if(slope===1)skew=-skew;}
  else{ux=c.direction==='downLeft'||c.direction==='upLeft'?1:-1;uy=c.direction==='upLeft'||c.direction==='upRight'?1:-1;}
  var reach=Math.hypot(fw,fh)/2+Math.max(baseW,baseH)*(1+Math.abs(skew)),limit=Math.ceil(reach/step)+2,clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},cards=[];
  for(var slot=0;slot<total;slot++)cards.push({slot:slot,depth:-limit-1,alpha:0,visible:false,instances:[],left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],textureWidth:baseW,textureHeight:baseH,corner:unit*c.cornerRadius,clip:clip});
  for(var offset=-limit;offset<=limit;offset++){
   var advance=local;
   if(stepped){var delay=cascade?.15+Math.min(Math.abs(offset),5)*.04:.4*c.stagger/100*Math.max(0,Math.min(1,(offset*step+reach)/(2*reach))),span=cascade?.5:.6,part=Math.max(0,Math.min(1,(local-delay)/span));advance=part<.5?4*part*part*part:1-Math.pow(-2*part+2,3)/2;}
   var position=offset-advance,distance=position*step,cx=width/2+distance*ux,cy=height/2+distance*uy,polygon=[{x:cx-baseW/2,y:cy-baseH/2-baseW/2*skew},{x:cx+baseW/2,y:cy-baseH/2+baseW/2*skew},{x:cx+baseW/2,y:cy+baseH/2+baseW/2*skew},{x:cx-baseW/2,y:cy+baseH/2-baseW/2*skew}],xs=polygon.map(function(p){return p.x;}),ys=polygon.map(function(p){return p.y;}),left=Math.max(clip.left,Math.min.apply(null,xs)),right=Math.min(clip.left+fw,Math.max.apply(null,xs)),top=Math.max(clip.top,Math.min.apply(null,ys)),bottom=Math.min(clip.top+fh,Math.max.apply(null,ys));
   if(right<=left||bottom<=top)continue;
   var source=((index+offset)%total+total)%total,card=cards[source],depth=cascade?(reverse?-offset:offset):-Math.abs(position)+offset*.000001,focus=Math.max(0,1-Math.abs(position)),instance={upper:[polygon[0],polygon[3]],lower:[polygon[1],polygon[2]],polygon:polygon,alpha:1,depth:depth,position:position,focus:focus};card.instances.push(instance);card.depth=Math.max(card.depth,depth);card.alpha=1;
   if(!card.visible){card.left=left;card.top=top;card.width=right-left;card.height=bottom-top;card.upper=[polygon[0],polygon[1]];card.lower=[polygon[3],polygon[2]];card.visible=true;}else{var farX=Math.max(card.left+card.width,right),farY=Math.max(card.top+card.height,bottom);card.left=Math.min(card.left,left);card.top=Math.min(card.top,top);card.width=farX-card.left;card.height=farY-card.top;}
   if(focus>0){card.upper=[polygon[0],polygon[1]];card.lower=[polygon[3],polygon[2]];}
  }
  return cards.sort(function(a,b){return a.depth-b.depth;});
 }
 function focusLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(4,Math.min(16,Math.round(count)||10)),cycle=(phase(progress,c,scroll)%1+1)%1,at=cycle*total,index=Math.floor(at),local=at-index,unit=Math.min(fw,fh)/100,baseH=unit*c.size,aspect=ratios[c.cardRatio]||Math.max(.25,Math.min(4,imageRatio||1)),baseW=baseH*aspect,skew=c.skew/100,step=Math.max(unit*.01,baseH*c.spacing/100),gap=baseH*c.focusGap/100,centerScale=c.centerScale/100,textureScale=Math.max(1,centerScale),angle=-34*Math.PI/180,direction=c.direction==='up'?-1:1,ux=Math.cos(angle)*direction,uy=Math.sin(angle)*direction,reach=Math.hypot(fw,fh)/2+Math.max(baseW,baseH)*(1+skew)*textureScale,limit=Math.ceil((reach+gap)/step)+2,clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},cards=[];
  for(var slot=0;slot<total;slot++)cards.push({slot:slot,depth:-Infinity,alpha:0,visible:false,instances:[],left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],textureWidth:baseW*textureScale,textureHeight:baseH*textureScale,corner:unit*c.cornerRadius*textureScale,clip:clip});
  for(var offset=limit;offset>=-limit;offset--){
   var delay=.15+Math.min(Math.abs(offset),5)*.04,part=Math.max(0,Math.min(1,(local-delay)/.5)),advance=part<.5?4*part*part*part:1-Math.pow(-2*part+2,3)/2,position=offset-advance,distance=position*step+gap*Math.max(-1,Math.min(1,position)),focus=Math.max(0,1-Math.abs(position)),scale=1+(centerScale-1)*focus,w=baseW*scale,h=baseH*scale,cx=width/2+distance*ux,cy=height/2+distance*uy;
   var polygon=[{x:cx-w/2,y:cy-h/2-w/2*skew},{x:cx+w/2,y:cy-h/2+w/2*skew},{x:cx+w/2,y:cy+h/2+w/2*skew},{x:cx-w/2,y:cy+h/2-w/2*skew}],xs=polygon.map(function(p){return p.x;}),ys=polygon.map(function(p){return p.y;}),left=Math.max(clip.left,Math.min.apply(null,xs)),top=Math.max(clip.top,Math.min.apply(null,ys)),right=Math.min(clip.left+fw,Math.max.apply(null,xs)),bottom=Math.min(clip.top+fh,Math.max.apply(null,ys));
   if(right<=left||bottom<=top)continue;var source=((index+offset)%total+total)%total,card=cards[source],instance={upper:[polygon[0],polygon[3]],lower:[polygon[1],polygon[2]],polygon:polygon,alpha:1,focus:focus,depth:-offset,position:position};card.instances.push(instance);card.depth=Math.max(card.depth,instance.depth);card.alpha=1;
   if(!card.visible){card.left=left;card.top=top;card.width=right-left;card.height=bottom-top;card.upper=[polygon[0],polygon[1]];card.lower=[polygon[3],polygon[2]];card.visible=true;}else{var farX=Math.max(card.left+card.width,right),farY=Math.max(card.top+card.height,bottom);card.left=Math.min(card.left,left);card.top=Math.min(card.top,top);card.width=farX-card.left;card.height=farY-card.top;}
   if(focus>0){card.upper=[polygon[0],polygon[1]];card.lower=[polygon[3],polygon[2]];}
  }
  cards.forEach(function(card){if(!card.visible)card.depth=-limit-1;});return cards.sort(function(a,b){return a.depth-b.depth;});
 }
 function carouselLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(3,Math.min(10,Math.round(count)||5)),cycle=(phase(progress,c,scroll)%1+1)%1,at=cycle*total,index=Math.floor(at),local=at-index,part=Math.max(0,Math.min(1,local/.45)),advance=part<.5?4*part*part*part:1-Math.pow(-2*part+2,3)/2,position=index+advance,vertical=c.direction==='vertical',unit=Math.min(fw,fh)/100,pad=unit*c.padding,primary=(vertical?fh:fw)-2*pad,cross=(vertical?fw:fh)-2*pad,aspect=ratios[c.cardRatio]||Math.max(.25,Math.min(4,imageRatio||1)),tileW,tileH;
  if(c.cardRatio==='frame'){tileW=vertical?cross:primary*.62;tileH=vertical?primary*.62:cross;}else{var across=cross,along=vertical?across/aspect:across*aspect;if(along>primary){along=primary*.82;across=vertical?along*aspect:along/aspect;}tileW=vertical?across:along;tileH=vertical?along:across;}
  var step=(vertical?tileH:tileW)+unit*c.gap,period=step*total,extent=(vertical?fh:fw)/2+(vertical?tileH:tileW)/2,clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},cards=[];
  for(var slot=0;slot<total;slot++){
   var offset=((slot-position)*step%period+period*1.5)%period-period/2,card={slot:slot,depth:-Math.abs(offset),alpha:0,visible:false,instances:[],left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],textureWidth:tileW,textureHeight:tileH,corner:unit*c.cornerRadius,clip:clip},first=Math.floor((-extent-offset)/period),last=Math.ceil((extent-offset)/period);
   for(var rep=first;rep<=last;rep++){
    var shift=offset+rep*period,focus=Math.max(0,1-Math.abs(shift)/step),scale=c.sideScale+(1-c.sideScale)*focus,w=tileW*scale,h=tileH*scale,x=width/2+(vertical?0:shift)-w/2,y=height/2+(vertical?shift:0)-h/2;
    if(x+w<=clip.left||x>=clip.left+fw||y+h<=clip.top||y>=clip.top+fh)continue;
    var corners=[{x:x,y:y},{x:x+w,y:y},{x:x+w,y:y+h},{x:x,y:y+h}],instance={upper:[corners[0],corners[3]],lower:[corners[1],corners[2]],polygon:corners,alpha:.55+.45*focus,focus:focus},left=Math.max(clip.left,x),top=Math.max(clip.top,y),right=Math.min(clip.left+fw,x+w),bottom=Math.min(clip.top+fh,y+h);card.instances.push(instance);card.visible=true;card.alpha=Math.max(card.alpha,instance.alpha);
    if(card.instances.length===1){card.left=left;card.top=top;card.width=right-left;card.height=bottom-top;card.upper=[corners[0],corners[1]];card.lower=[corners[3],corners[2]];}else{var farX=Math.max(card.left+card.width,right),farY=Math.max(card.top+card.height,bottom);card.left=Math.min(card.left,left);card.top=Math.min(card.top,top);card.width=farX-card.left;card.height=farY-card.top;}
    if(focus>0){card.upper=[corners[0],corners[1]];card.lower=[corners[3],corners[2]];}
   }
   cards.push(card);
  }
  return cards.sort(function(a,b){return a.depth-b.depth;});
 }
 function tickerLoopLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(4,Math.min(24,Math.round(count)||12)),cycle=(phase(progress,c,scroll)%1+1)%1,vertical=c.orientation==='vertical',unit=Math.min(fw,fh)/100,gap=unit*c.rowGap,baseZoom=c.zoom/100,pulse=c.movement==='zoomPulse',waypoints=c.movement==='zoomWaypoints',local=0,position=cycle,zoom=baseZoom,cameraScale=1,cameraX=width/2,cameraY=height/2;
  if(pulse){var pulses=Math.max(1,Math.round(c.pulseCount)),index=Math.floor(cycle*pulses);local=cycle*pulses-index;var edge=(1-c.pause/100)/2,advance=local<edge?.5*(1-Math.pow(1-local/edge,2)):local<1-edge?.5:.5+.5*Math.pow((local-(1-edge))/edge,2);position=(index+advance)/pulses;zoom+=c.zoomPulseAmount/100*Math.pow(Math.sin(Math.PI*local),2);}
  if(waypoints){var stops=Math.max(2,Math.round(c.stops)),stop=Math.floor(cycle*stops),part=cycle*stops-stop,hold=c.pause/200,travel=Math.max(0,Math.min(1,(part-hold)/(1-2*hold))),smooth=travel*travel*(3-2*travel),pull=1-Math.sin(Math.PI*travel),pad=unit*c.padding,contentW=fw-2*pad,contentH=fh-2*pad,seed=8001511,points=[];
   function random(){seed=(seed+1831565813)|0;var n=Math.imul(seed^seed>>>15,1|seed);n=n+Math.imul(n^n>>>7,61|n)^n;return((n^n>>>14)>>>0)/4294967296;}
   for(var k=0;k<stops;k++)points.push({x:width/2+contentW*(.18+random()*.64-.5),y:height/2+contentH*(.18+random()*.64-.5)});
   var from=points[stop],to=points[(stop+1)%stops],targetX=from.x+(to.x-from.x)*smooth,targetY=from.y+(to.y-from.y)*smooth;cameraX=width/2+(targetX-width/2)*pull;cameraY=height/2+(targetY-height/2)*pull;cameraScale=1+(c.waypointZoom-1)*pull;position=(stop+(1-c.creepSpeed/100)*smooth+c.creepSpeed/100*part)/stops;
  }
  var primary=vertical?fh:fw,cross=vertical?fw:fh,extent=primary*1.6,rowBase=cross*baseZoom,rowStep=cross*zoom,short=Math.max(1,rowStep-gap),baseShort=Math.max(1,rowBase-gap),textureShort=Math.max(1,cross*(baseZoom+(pulse?c.zoomPulseAmount/100:0))-gap)*(waypoints?c.waypointZoom:1),aspect=ratios[c.cardRatio]||Math.max(.25,Math.min(4,imageRatio||1)),tileW=vertical?short:short*aspect,tileH=vertical?short/aspect:short,textureW=vertical?textureShort:textureShort*aspect,textureH=vertical?textureShort/aspect:textureShort,step=(vertical?tileH:tileW)+unit*3,period=step*total,rows=Math.max(2,Math.round(cross*1.5/rowBase)),origin=-rows*rowStep/2+gap/2,angle=c.angle*Math.PI/180,co=Math.cos(angle),si=Math.sin(angle),clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},cards=[];
  function point(x,y){return{x:width/2+(width/2+x*co-y*si-cameraX)*cameraScale,y:height/2+(height/2+x*si+y*co-cameraY)*cameraScale};}
  for(var i=0;i<total;i++)cards.push({slot:i,depth:i,alpha:0,visible:false,instances:[],left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],textureWidth:textureW,textureHeight:textureH,corner:unit*c.cornerRadius*.8*textureShort/baseShort,clip:clip,cameraScale:cameraScale});
  for(var row=0;row<rows;row++){
   var direction=c.direction==='opposed'&&row%2?1:-1,shift=position*period*direction+row*step*1.5,across=origin+row*rowStep;shift=(shift%period+period)%period;
   for(var slot=0;slot<total;slot++){
    var start=slot*step+shift-(vertical?tileH:tileW)/2,first=Math.floor((-extent/2-start-(vertical?tileH:tileW))/period),last=Math.ceil((extent/2-start)/period);
    for(var rep=first;rep<=last;rep++){
     var along=start+rep*period,x=vertical?across:along,y=vertical?along:across,corners=[point(x,y),point(x+tileW,y),point(x+tileW,y+tileH),point(x,y+tileH)],left=Math.min.apply(null,corners.map(function(p){return p.x;})),right=Math.max.apply(null,corners.map(function(p){return p.x;})),top=Math.min.apply(null,corners.map(function(p){return p.y;})),bottom=Math.max.apply(null,corners.map(function(p){return p.y;}));
     if(right<=clip.left||left>=clip.left+fw||bottom<=clip.top||top>=clip.top+fh)continue;
     var upper=[corners[0],corners[3]],lower=[corners[1],corners[2]],instance={row:row,upper:upper,lower:lower,polygon:corners,vertical:true},card=cards[slot];card.instances.push(instance);card.alpha=1;card.visible=true;left=Math.max(clip.left,left);right=Math.min(clip.left+fw,right);top=Math.max(clip.top,top);bottom=Math.min(clip.top+fh,bottom);
     if(card.instances.length===1){card.left=left;card.top=top;card.width=right-left;card.height=bottom-top;card.upper=upper;card.lower=lower;}else{var farX=Math.max(card.left+card.width,right),farY=Math.max(card.top+card.height,bottom);card.left=Math.min(card.left,left);card.top=Math.min(card.top,top);card.width=farX-card.left;card.height=farY-card.top;}
     if(corners.every(function(p){return p.x>clip.left&&p.x<clip.left+fw&&p.y>clip.top&&p.y<clip.top+fh;})){card.upper=upper;card.lower=lower;}
    }
   }
  }
  return cards;
 }
 return{config:config,imageFocus:imageFocus,imageCrop:imageCrop,imageZoomCrop:imageZoomCrop,zoomSpecs:zoomSpecs,dropSpecs:dropSpecs,shiftSpecs:shiftSpecs,spiralSpecs:spiralSpecs,coverSpecs:coverSpecs,bottomSpecs:bottomSpecs,spinSpecs:spinSpecs,wheelSpecs:wheelSpecs,photoSpecs:photoSpecs,burstSpecs:burstSpecs,peelSpecs:peelSpecs,filmSpecs:filmSpecs,totemSpecs:totemSpecs,specs:specs,orbitSpecs:orbitSpecs,popSpecs:popSpecs,revealSpecs:revealSpecs,stageSpecs:stageSpecs,bloomSpecs:bloomSpecs,tickerSpecs:tickerSpecs,tickerLoopSpecs:tickerLoopSpecs,carouselSpecs:carouselSpecs,stackSpecs:stackSpecs,focusSpecs:focusSpecs,tossSpecs:tossSpecs,diagonalSpecs:diagonalSpecs,cascadeSpecs:cascadeSpecs,ratios:ratios,phase:phase,layout:layout};
}
window.NAGWEB_CREATE_STREAM_MODEL=createStreamModel;
window.NAGWEB_STREAM_MODEL=createStreamModel();
})();
