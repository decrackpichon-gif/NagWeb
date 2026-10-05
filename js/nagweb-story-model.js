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
 var stageSpecs={travel:[60,20,120,5],cardSize:[86,60,100,1]};
 var ratios={'1:1':1,'4:3':4/3,'3:4':3/4,'4:5':4/5,'16:9':16/9,'9:16':9/16};
 function config(raw){raw=raw||{};var out={},orbit=raw.kind==='iso-orbit',pop=raw.kind==='pop-grid',stage=raw.kind==='center-stage',fields=stage?Object.assign({},specs,stageSpecs):orbit?Object.assign({},specs,orbitSpecs):pop?Object.assign({},specs,popSpecs):specs;Object.keys(fields).forEach(function(k){var s=fields[k],n=raw[k];out[k]=Math.max(s[1],Math.min(s[2],n!==''&&n!=null&&isFinite(+n)?+n:s[0]));});out.end=Math.max(out.start+1,out.end);out.cardRatio=raw.cardRatio==='auto'||ratios[raw.cardRatio]?raw.cardRatio:orbit?'1:1':'16:9';out.frameRatio=raw.frameRatio==='auto'||ratios[raw.frameRatio]?raw.frameRatio:'16:9';out.shadow=!!raw.shadow;out.backgroundType=['none','color','gradient','image'].indexOf(raw.backgroundType)>=0?raw.backgroundType:'color';out.backgroundColor=/^#[0-9a-f]{6}$/i.test(raw.backgroundColor||'')?raw.backgroundColor:'#101014';out.gradientColor=/^#[0-9a-f]{6}$/i.test(raw.gradientColor||'')?raw.gradientColor:'#3a3a5a';out.backgroundId=typeof raw.backgroundId==='string'?raw.backgroundId:'';if(orbit){out.kind='iso-orbit';out.motion=raw.motion==='spin'?'spin':'swing';}if(pop)out.kind='pop-grid';if(stage){out.kind='center-stage';out.ghosts=raw.ghosts!==false;}return out;}
 function imageFocus(raw){raw=raw||{};var out={};['x','y'].forEach(function(k){var n=raw[k];out[k]=n!==''&&n!=null&&isFinite(+n)?Math.max(0,Math.min(100,+n)):50;});return out;}
 function imageCrop(iw,ih,width,height,raw){var focus=imageFocus(raw),scale=Math.max(width/iw,height/ih),w=iw*scale,h=ih*scale;return{x:(width-w)*focus.x/100,y:(height-h)*focus.y/100,width:w,height:h};}
 function phase(progress,c,scroll){var p=scroll?Math.max(0,Math.min(1,(progress*100-c.start)/(c.end-c.start))):progress;return p*c.turns;}
 function layout(width,height,raw,progress,count,imageRatio,scroll){
  var c=config(raw),fw=width,fh=height,ratio=ratios[c.frameRatio];if(ratio){if(fw/fh>ratio)fw=fh*ratio;else fh=fw/ratio;}
  if(c.kind==='iso-orbit')return orbitLayout(width,height,fw,fh,c,progress,imageRatio,scroll);
  if(c.kind==='center-stage')return stageLayout(width,height,fw,fh,c,progress,count,scroll);
  if(c.kind==='pop-grid')return popLayout(width,height,fw,fh,c,progress,count,scroll);
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
 return{config:config,imageFocus:imageFocus,imageCrop:imageCrop,specs:specs,orbitSpecs:orbitSpecs,popSpecs:popSpecs,stageSpecs:stageSpecs,ratios:ratios,phase:phase,layout:layout};
}
window.NAGWEB_CREATE_STREAM_MODEL=createStreamModel;
window.NAGWEB_STREAM_MODEL=createStreamModel();
})();
