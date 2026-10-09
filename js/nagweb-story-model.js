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
 var mosaicSpecs={rows:[4,1,8,1],columns:[4,1,8,1],slats:[8,2,20,1],stagger:[60,0,100,5],speedVariation:[0,0,100,5],offsetX:[0,-50,50,1],offsetY:[0,-50,50,1]};
 var sphereSpecs={zoom:[20,10,50,1],tilt:[0,-45,45,1],padding:[13,0,20,.5],cornerRadius:[.5,0,12,.5],curvature:[-100,-150,150,5],gap:[5,.5,20,.25],edgeFade:[0,0,100,5],stops:[5,2,12,1],focusZoom:[2.8,1.2,4,.1]};
 var totemWallSpecs=Object.assign({},sphereSpecs,{zoom:[33,10,50,1],gap:[4.5,.5,20,.25]});delete totemWallSpecs.stops;delete totemWallSpecs.focusZoom;
 var spreadSpecs={rows:[3,1,7,1],rowsOdd:[3,1,7,2],rowGap:[3,0,12,.5],cardGap:[3,0,12,.5],stackScale:[50,10,100,5],zoom:[50,0,120,5],drift:[16,0,40,1],rowDelay:[4,0,12,1]};

 // Sweep Ring follows the HAR's two-stage clock. Textures stay fixed while planes scale.


 var scatterSpecs={scatterSize:[30,15,50,1],cardSize:[30,15,80,1],ringSize:[36,15,60,1],ringTravel:[100,-100,100,5]};
 var scatterPoints=[{x:[390.857,1508.571,1508.571],y:[485.068,677.068,954.782],s:[45,21,54]},{x:[1628.571,634.286,377.143],y:[351.354,337.639,821.068],s:[30,56,46]},{x:[672,1265.143,654.857],y:[1016.496,865.639,166.211],s:[38,23,45]},{x:[918.857,1793.143,1412.571],y:[118.211,282.782,498.782],s:[38,31,15]},{x:[1560,435.429,1505.143],y:[872.496,1061.068,203.925],s:[19,41,30]}];
 function scatterPath(raw){
  if(!Array.isArray(raw))return null;var changed=false,path=[0,1,2].map(function(i){var point=raw[i],out={};if(!point||typeof point!=='object')return out;['x','y','size'].forEach(function(k){var n=point[k];if(typeof n==='number'&&isFinite(n)){out[k]=Math.max(k==='size'?5:0,Math.min(k==='size'?150:100,n));changed=true;}});return out;});return changed?path:null;
 }
 function scatterWaypoints(raw,slot){
  var base=scatterPoints[Math.max(0,Math.min(4,Math.round(slot)||0))],path=scatterPath(raw);return{x:base.x.map(function(n,i){return path&&path[i].x!=null?path[i].x*19.2:n;}),y:base.y.map(function(n,i){return path&&path[i].y!=null?path[i].y*10.8:n;}),s:base.s.map(function(n,i){return path&&path[i].size!=null?path[i].size:n;})};
 }
 function scatterLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(5,Math.min(12,Math.round(count)||8)),unit=Math.min(fw,fh)/100,pad=unit*c.padding,content={x:pad,y:pad,w:fw-2*pad,h:fh-2*pad},ratio=c.cardRatio==='auto'?Math.max(.25,Math.min(4,+imageRatio||1)):ratios[c.cardRatio]||16/9,tw=content.w,th=content.h;if(tw/th>ratio)tw=th*ratio;else th=tw/ratio;
  var cx=content.x+content.w/2,cy=content.y+content.h/2,baseRadius=Math.min(unit*c.cornerRadius,tw/2,th/2),ring=unit*c.ringSize,card=c.cardSize/100,scatter=c.scatterSize/100,clock=(phase(progress,c,scroll)%1+1)%1*532,ease=sweepEase(c.easing,c.easeBezier),clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},cards=[],order=0;
  function range(t,a,b){return Math.max(0,Math.min(1,(t-a)/(b-a)));}function mix(a,b,t){return a+(b-a)*t;}
  for(var slot=0;slot<total;slot++)cards.push({slot:slot,depth:0,alpha:0,visible:false,instances:[],left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],textureWidth:tw,textureHeight:th,corner:0,clip:clip});
  function draw(source,px,py,scale,stage){
   if(!(scale>0)||!isFinite(scale)||!isFinite(px)||!isFinite(py))return;px+=clip.left;py+=clip.top;var x=px-tw*scale/2,y=py-th*scale/2,left=Math.max(clip.left,x),top=Math.max(clip.top,y),right=Math.min(clip.left+fw,x+tw*scale),bottom=Math.min(clip.top+fh,y+th*scale);if(right<=left||bottom<=top)return;
   var matrix=[scale,0,x,0,scale,y,0,0,1],vertices=[{x:x,y:y,u:0,v:0},{x:x+tw*scale,y:y,u:1,v:0},{x:x,y:y+th*scale,u:0,v:1},{x:x+tw*scale,y:y+th*scale,u:1,v:1}],mesh={columns:1,rows:1,width:tw,height:th,radius:baseRadius,vertices:vertices},upper=vertices.slice(0,2),lower=vertices.slice(2),polygon=upper.concat(lower.slice().reverse()),instance={stage:stage,source:source,cardScale:scale,angle:0,center:{x:px,y:py},depth:order++,alpha:1,shade:1,mesh:mesh,homography:{matrix:matrix,inverse:inversePlane(matrix),width:tw,height:th,radius:baseRadius,columns:1,rows:1},upper:upper,lower:lower,polygon:polygon,shadowPolygon:polygon,planeClipRadius:baseRadius,rounded:{cx:px,cy:py,width:tw,height:th,radius:baseRadius,angle:0,scaleX:scale,scaleY:scale},left:left,top:top,width:right-left,height:bottom-top},card=cards[source%total];
   card.instances=[instance];card.depth=instance.depth;card.alpha=1;card.visible=true;card.left=left;card.top=top;card.width=right-left;card.height=bottom-top;card.upper=upper;card.lower=lower;
  }
  if(clock<90||clock>=442){var closing=clock>=442,t=closing?532-clock:clock,index=Math.min(2,Math.floor(t/30)),p=ease(range(t,index*30,(index+1)*30));for(var i=4;i>=0;i--){var point=c.scatterPaths&&c.scatterPaths[i]?scatterWaypoints(c.scatterPaths[i],i):scatterPoints[i];function at(values,j,fallback){return j<3?values[j]:fallback;}var x=mix(at(point.x,index,960),at(point.x,index+1,960),p)/1920,y=mix(at(point.y,index,540),at(point.y,index+1,540),p)/1080;function size(j){return j<3?point.s[j]/30*scatter:card;}var scale=mix(size(index),size(index+1),p);draw(i,content.x+x*content.w,content.y+y*content.h,scale,closing?'scatter-closing':'scatter-opening');}}
  else{var t=clock-90;function transition(a,b){return ease(range(t,a,b));}var scale=t<16?mix(1,.66,transition(0,16)):t<290?mix(.66,1,transition(16,90)):t<325?mix(1,.66,transition(290,324)):mix(.66,1,transition(325,352)),bottom=content.y+content.h,targetY=c.ringTravel===100?bottom:cy+(bottom-cy)*c.ringTravel/100,centerY=mix(cy,targetY,transition(16,90)-transition(290,324)),step=2*Math.PI*Math.max(1,Math.round(total/4))/total,rotation=2*Math.PI*transition(0,90);for(var i=0;i<4;i++)rotation+=step*transition(90+i*50,90+(i+1)*50);rotation-=step*4*transition(290,352);var open=transition(0,16)-transition(325,352);
   for(var i=total-1;i>=0;i--){var angle=rotation*(c.direction==='ccw'?-1:1)-i*2*Math.PI/total,r=ring*open*scale;draw(i,cx+Math.cos(angle)*r,centerY+Math.sin(angle)*r,card*scale,'ring');}
  }return cards;
 }

 var fanSpecs={deckCards:[6,2,10,1],fanSpread:[7.8,0,25,.2],fanAngle:[-47,-90,90,1],columns:[3,2,6,1],gap:[2.5,0,8,.25],rowShift:[77,0,150,1],gridZoom:[80,50,100,1]};
 var fanMaps={};
 function fanDistribution(total,columns){
  var key=total+':'+columns;if(fanMaps[key])return fanMaps[key];var size=Math.max(1,total-1),best={a:1,b:1,reach:0};
  function mod(a,b){return(a%b+b)%b;}function reach(a,b){for(var i=0;i<=size;i++)if(mod(a-i*b,size)===0||mod(a+i*b,size)===0)return i;return size;}
  for(var b=1;b<=size;b++){var valid=true;for(var i=1;i<columns&&valid;i++)if(mod(b*i,size)===0)valid=false;if(valid)for(var a=1;a<=size;a++){var r=reach(a,b);if(r>best.reach)best={a:a,b:b,reach:r};}}
  var order=[],seed=size;for(var i=0;i<size;i++)order.push(i);function random(){seed|=0;seed=seed+1831565813|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}
  for(var i=size-1;i>0;i--){var j=Math.floor(random()*(i+1)),t=order[i];order[i]=order[j];order[j]=t;}return fanMaps[key]={a:best.a,b:best.b,size:size,perm:order};
 }
 function fanLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(3,Math.min(30,Math.round(count)||18)),unit=Math.min(fw,fh)/100,ratio=c.cardRatio==='auto'?Math.max(.25,Math.min(4,+imageRatio||1)):ratios[c.cardRatio]||16/9,gap=unit*c.gap,zoom=c.gridZoom/100,columns=Math.max(2,c.columns-(fh>fw*1.05?1:0)),pitchX=fw/zoom/columns,tw=Math.max(1,pitchX-gap),th=tw/ratio,pitchY=th+gap,angle=c.fanAngle*Math.PI/180,fanX=unit*c.fanSpread*Math.cos(angle),fanY=unit*c.fanSpread*Math.sin(angle),shift=pitchX*(c.rowShift/100),radius=Math.min(unit*c.cornerRadius,tw/2,th/2),clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},clock=(phase(progress,c,scroll)%1+1)%1*529,ease=sweepEase(c.easing,c.easeBezier),cards=[],order=0;
  function range(t,a,b){return Math.max(0,Math.min(1,(t-a)/(b-a)));}function mod(a,b){return(a%b+b)%b;}
  for(var slot=0;slot<total;slot++)cards.push({slot:slot,depth:0,alpha:0,visible:false,instances:[],left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],textureWidth:tw,textureHeight:th,corner:0,clip:clip});
  function draw(source,cx,cy,scale,alpha,stage,row,col){
   if(!(scale>0)||!isFinite(scale)||!isFinite(cx)||!isFinite(cy)||!(alpha>0)||!isFinite(alpha)||order>=8192)return;alpha=Math.min(1,alpha);var x=clip.left+(stage==='wall'?fw/2+(cx-tw/2)*scale:cx-tw/2),y=clip.top+(stage==='wall'?fh/2+(cy-th/2)*scale:cy-th/2);cx=x+tw*scale/2;cy=y+th*scale/2;var left=Math.max(clip.left,x),top=Math.max(clip.top,y),right=Math.min(clip.left+fw,x+tw*scale),bottom=Math.min(clip.top+fh,y+th*scale);if(right<=left||bottom<=top)return;
   var matrix=[scale,0,x,0,scale,y,0,0,1],vertices=[{x:x,y:y,u:0,v:0},{x:x+tw*scale,y:y,u:1,v:0},{x:x,y:y+th*scale,u:0,v:1},{x:x+tw*scale,y:y+th*scale,u:1,v:1}],mesh={columns:1,rows:1,width:tw,height:th,radius:radius,vertices:vertices},upper=vertices.slice(0,2),lower=vertices.slice(2),polygon=upper.concat(lower.slice().reverse()),instance={stage:stage,row:row,column:col,source:source,copy:order,cardScale:scale,cameraZoom:scale,angle:0,center:{x:cx,y:cy},depth:order++,alpha:alpha,shade:1,mesh:mesh,homography:{matrix:matrix,inverse:inversePlane(matrix),width:tw,height:th,radius:radius,columns:1,rows:1},upper:upper,lower:lower,polygon:polygon,shadowPolygon:polygon,planeClipRadius:radius,rounded:{cx:cx,cy:cy,width:tw,height:th,radius:radius,angle:0,scaleX:scale,scaleY:scale},left:left,top:top,width:right-left,height:bottom-top},card=cards[mod(source,total)];
   card.instances.push(instance);card.depth=instance.depth;card.alpha=Math.max(card.alpha,alpha);card.visible=true;if(card.instances.length===1){card.left=left;card.top=top;card.width=right-left;card.height=bottom-top;card.upper=upper;card.lower=lower;}else{var farX=Math.max(card.left+card.width,right),farY=Math.max(card.top+card.height,bottom);card.left=Math.min(card.left,left);card.top=Math.min(card.top,top);card.width=farX-card.left;card.height=farY-card.top;}
  }
  if(clock<118||clock>=429){var closing=clock>=429,t=closing?clock-429:clock,open=ease(range(t,19,49))-ease(range(t,69,99));for(var i=c.deckCards-1;i>=0;i--){var offset=((closing?c.deckCards-1-i:i)-(c.deckCards-1)/2)*open;draw(i,fw/2+offset*fanX,fh/2+offset*fanY,1,1,closing?'closing':'opening',0,i);}}
  else{var t=clock-118,enter=range(t,0,30),exit=range(t,280,310),alpha=enter-exit,camera=1+(zoom-1)*(ease(enter)-ease(exit)),walk=0,sway=0;for(var i=0;i<4;i++){var a=50+i*60,v=ease(range(t,a,a+50));walk+=v;sway+=(i%2===0?1:-1)*v;}sway*=shift;
   if(!(camera>0)||!isFinite(camera)||!isFinite(walk)||!isFinite(sway))return cards;
   var visibleW=fw/camera,visibleH=fh/camera,rows=(visibleH/2+th/2)/pitchY,across=(visibleW/2+tw/2+Math.abs(shift)+pitchX/2)/pitchX,minCol=Math.max(-64,Math.floor(-across)),maxCol=Math.min(64,Math.ceil(across)),distribution=fanDistribution(total,Math.ceil(visibleW/pitchX)+1),minRow=Math.max(Math.floor(walk-rows),Math.floor(walk)-128),maxRow=Math.min(Math.ceil(walk+rows),Math.ceil(walk)+128);
   for(var row=minRow;row<=maxRow;row++){var even=mod(row,2)===0,dx=(even?0:.5)*pitchX+(even?-sway:sway),dy=(row-walk)*pitchY;if(Math.abs(dy)>visibleH/2+th/2)continue;for(var col=minCol;col<=maxCol;col++){var x=col*pitchX+dx;if(Math.abs(x)>visibleW/2+tw/2)continue;var hero=col===0&&(row===0||row===4),source=hero?0:1+distribution.perm[mod(distribution.a*row+distribution.b*col,distribution.size)];draw(source,x,dy,camera,hero?1:alpha,'wall',row,col);}}
  }return cards;
 }

 var feedSpecs={cardSize:[52,30,80,1],spacing:[70,40,140,1],lanes:[100,0,100,1],move:[55,20,100,5],fade:[50,10,100,5],stagger:[0,0,100,5],offsetX:[0,-50,50,1],offsetY:[0,-50,50,1]};
 // Keep the HAR's alternating pitch and per-card flick clock, including odd-count lanes.
 function feedLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(8,Math.min(16,Math.round(count)||12)),unit=Math.min(fw,fh)/100,pad=unit*c.padding,ox=unit*c.offsetX,oy=unit*c.offsetY,ratio=c.cardRatio==='auto'?Math.max(.25,Math.min(4,+imageRatio||1)):ratios[c.cardRatio]||16/9,tw=(fw-2*pad)*(c.cardSize/100),th=tw/ratio,pitch=th*(c.spacing/100),laneSpread=(fw-2*pad-tw)*(c.lanes/100),fade=Math.max(.1,c.fade/100),move=c.move/100,hold=Math.max(.1,(1-move)/2),travel=Math.min(move,1-hold),tail=1-hold-travel,flicks=c.motion!=='steady',slide=flicks&&c.enter==='slide',p=(phase(progress,c,scroll)%1+1)%1,clock=p*total,head=Math.floor(clock),local=clock-head,stagger=flicks?c.stagger/100:0,visibleRows=Math.min(total-1,Math.floor(fh/pitch)+1),positions=[],span=0,cards=[],frame={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},feedLeft=frame.left+pad+ox,feedTop=frame.top+oy,left=Math.max(frame.left,feedLeft),top=Math.max(frame.top,feedTop),clip={left:left,top:top,width:Math.max(0,Math.min(frame.left+fw,feedLeft+fw-2*pad)-left),height:Math.max(0,Math.min(frame.top+fh,feedTop+fh)-top)},radius=Math.min(unit*c.cornerRadius,tw/2,th/2),ease=sweepEase('smooth');
  function clamp(t){return Math.max(0,Math.min(1,t));}function range(t,a,b){return b<=a?(t>=b?1:0):clamp((t-a)/(b-a));}
  for(var i=0;i<total;i++){positions.push(span);span+=pitch*(i%2===0?.85:1.15);}
  var start=head>=total?span:positions[head],end=head+1>=total?span:positions[head+1];
  for(var slot=0;slot<total;slot++){
   var card={slot:slot,depth:slot,alpha:0,visible:false,instances:[],left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],textureWidth:tw,textureHeight:th,corner:0,clip:clip},relative=((slot-head)%total+total)%total,shift;
   cards.push(card);
   if(flicks){if(slide&&relative===visibleRows)shift=start-pitch+(end-start+pitch)*ease(range(local,0,hold+travel/3));else{var behind=clamp((visibleRows-Math.min(relative,visibleRows))/visibleRows),duration=travel/(1+behind*stagger*4),delay=Math.min(behind*stagger*tail,1-hold-duration);shift=start+(end-start)*ease(clamp((local-hold-delay)/duration));}}else shift=p*span;
   var wrapped=((positions[slot]-shift)%span+span)%span,y=wrapped-th;if(y>fh||y+th<0)continue;
   var alpha=flicks?(relative>visibleRows?0:relative<visibleRows||slide?1:ease(range(local,hold*(1-fade),hold))):clamp(((fh-y)/th-(1-fade))/fade);if(alpha<=0)continue;
   var lane=(total%4===1&&slot===total-1?0:[2,1,0,1][slot%4])-1,x=feedLeft+(fw-2*pad-tw)/2+lane*laneSpread/2;y+=feedTop;
   var l=Math.max(clip.left,x),t=Math.max(clip.top,y),r=Math.min(clip.left+clip.width,x+tw),b=Math.min(clip.top+clip.height,y+th);if(r<=l||b<=t)continue;
   var matrix=[1,0,x,0,1,y,0,0,1],vertices=[{x:x,y:y,u:0,v:0},{x:x+tw,y:y,u:1,v:0},{x:x,y:y+th,u:0,v:1},{x:x+tw,y:y+th,u:1,v:1}],mesh={columns:1,rows:1,width:tw,height:th,radius:radius,vertices:vertices},upper=vertices.slice(0,2),lower=vertices.slice(2),polygon=upper.concat(lower.slice().reverse()),cx=x+tw/2,cy=y+th/2,instance={stage:'feed',lane:lane,relative:relative,shift:shift,feedSpan:span,cardScale:1,angle:0,center:{x:cx,y:cy},depth:slot,alpha:alpha,shade:1,mesh:mesh,homography:{matrix:matrix,inverse:inversePlane(matrix),width:tw,height:th,radius:radius,columns:1,rows:1},upper:upper,lower:lower,polygon:polygon,shadowPolygon:polygon,planeClipRadius:radius,rounded:{cx:cx,cy:cy,width:tw,height:th,radius:radius,angle:0,scaleX:1,scaleY:1},left:l,top:t,width:r-l,height:b-t};
   card.instances=[instance];card.visible=true;card.alpha=alpha;card.left=l;card.top=t;card.width=r-l;card.height=b-t;card.upper=upper;card.lower=lower;
  }return cards;
 }

 var collageSpecs={padding:[2,0,20,.5],heroSize:[52,25,100,1],zoom:[40,15,80,1],staggerX:[68,0,150,1],rowPitch:[61,25,150,1],cardSpacing:[186,60,300,2],reelSpin:[90,0,180,5]};
 // The HAR uses fixed entry/exit curves; the configurable curve opens and closes the collage.
 function collageLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(3,Math.min(24,Math.round(count)||8)),unit=Math.min(fw,fh)/100,pad=unit*c.padding,ratio=c.cardRatio==='auto'?Math.max(.25,Math.min(4,+imageRatio||1)):ratios[c.cardRatio]||16/9,wallW=(fw-2*pad)*(c.zoom/100),wallH=wallW/ratio,heroW=Math.min(fw-2*pad,(fh-2*pad)*ratio)*c.heroSize/100,heroH=heroW/ratio,stepX=wallW*(c.staggerX/100),stepY=wallH*(c.rowPitch/100),bandX=Math.max(wallW*.25,wallW*(c.cardSpacing/100)),rows=Math.min(16,Math.ceil((fh/2+wallH)/Math.max(1,stepY))),columns=Math.min(10,Math.ceil((fw/2+wallW)/bandX)),tw=Math.max(wallW,heroW),th=tw/ratio,radius=unit*c.cornerRadius,clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},span=125+total*57,t=(phase(progress,c,scroll)%1+1)%1*span,ease=sweepEase(c.easing,c.easeBezier),enter=sweepBezier(.26,1,.48,1),exit=sweepBezier(.64,0,.78,0),direction={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[c.reelDirection],spin=c.reelSpin*Math.PI/180,travel=(Math.abs(direction[0])*fw+Math.abs(direction[1])*fh)/2+Math.hypot(heroW,heroH)/2,cards=[],order=0;
  function range(v,a,b){return Math.max(0,Math.min(1,(v-a)/(b-a)));}var open=ease(range(t,30,70))-ease(range(t,span-40,span));
  for(var slot=0;slot<total;slot++)cards.push({slot:slot,depth:0,alpha:0,visible:false,instances:[],left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],textureWidth:tw,textureHeight:th,corner:0,clip:clip,collageOpen:open});
  function draw(source,cx,cy,w,angle,stage,row,col,offset){
   if(!(w>0)||!isFinite(w)||!isFinite(cx)||!isFinite(cy)||!isFinite(angle))return;
   var scale=w/tw,cos=Math.cos(angle),sin=Math.sin(angle),baseRadius=Math.min(radius/scale,tw/2,th/2);cx+=clip.left;cy+=clip.top;
   var a=scale*cos,b=-scale*sin,d=scale*sin,e=scale*cos,x=cx-a*tw/2-b*th/2,y=cy-d*tw/2-e*th/2,matrix=[a,b,x,d,e,y,0,0,1],vertices=[[0,0],[1,0],[0,1],[1,1]].map(function(uv){return{x:x+a*uv[0]*tw+b*uv[1]*th,y:y+d*uv[0]*tw+e*uv[1]*th,u:uv[0],v:uv[1]};}),left=Math.max(clip.left,Math.min.apply(null,vertices.map(function(v){return v.x;}))),top=Math.max(clip.top,Math.min.apply(null,vertices.map(function(v){return v.y;}))),right=Math.min(clip.left+fw,Math.max.apply(null,vertices.map(function(v){return v.x;}))),bottom=Math.min(clip.top+fh,Math.max.apply(null,vertices.map(function(v){return v.y;})));if(right<=left||bottom<=top)return;
   var slot=(source%total+total)%total,mesh={columns:1,rows:1,width:tw,height:th,radius:baseRadius,vertices:vertices},upper=vertices.slice(0,2),lower=vertices.slice(2),polygon=upper.concat(lower.slice().reverse()),instance={stage:stage,row:row,column:col,source:source,copy:order,cardScale:scale,angle:angle,reelOffset:offset,collageOpen:open,center:{x:cx,y:cy},depth:order++,alpha:1,shade:1,mesh:mesh,homography:{matrix:matrix,inverse:inversePlane(matrix),width:tw,height:th,radius:baseRadius,columns:1,rows:1},upper:upper,lower:lower,polygon:polygon,shadowPolygon:polygon,planeClipRadius:baseRadius,rounded:{cx:cx,cy:cy,width:tw,height:th,radius:baseRadius,angle:angle,scaleX:scale,scaleY:scale},left:left,top:top,width:right-left,height:bottom-top},card=cards[slot];
   card.instances.push(instance);card.depth=instance.depth;card.alpha=1;card.visible=true;if(card.instances.length===1){card.left=left;card.top=top;card.width=right-left;card.height=bottom-top;card.upper=upper;card.lower=lower;}else{var farX=Math.max(card.left+card.width,right),farY=Math.max(card.top+card.height,bottom);card.left=Math.min(card.left,left);card.top=Math.min(card.top,top);card.width=farX-card.left;card.height=farY-card.top;}
  }
  if(open<1){var spread=1+2.2*open,w=wallW*(1+.5*open),counter=0;for(var row=-rows;row<=rows;row++){var origin=Math.round(-row*stepX/bandX);for(var col=origin-columns;col<=origin+columns;col++){if(col===0&&row===0)continue;var cx=fw/2+(row*stepX+col*bandX)*spread,cy=fh/2+row*stepY*spread,source=1+(total+counter++)%Math.max(1,total-1),h=w/ratio;if(cx-w/2<fw-.5&&cy-h/2<fh-.5&&cx+w/2>.5&&cy+h/2>.5)draw(source,cx,cy,w,0,'wall',row,col,0);}}}
  var w=wallW+(heroW-wallW)*open;for(var index=total;index>=0;index--){var start=70+index*57,offset=0;if(t<start){if(index>0){var u=range(t,start-25,start);if(u<=0)continue;offset=enter(u)-1;}}else if(index<total){var u=range(t,start+10,start+35);if(u>=1)continue;offset=exit(u);}draw(index===total?0:index,fw/2+direction[0]*travel*offset,fh/2+direction[1]*travel*offset,w,offset*spin,'hero',index,0,offset);}
  return cards;
 }

 var tripleSpecs={padding:[2,0,20,.5],heroSize:[58,30,100,2],heroGap:[4,0,40,1],columns:[3,2,5,1],perColumn:[6,3,10,1],gap:[1.5,0,8,.25],columnDrift:[22,0,50,1],rowTilt:[17,-40,40,1],rowRise:[12,0,40,1]};
 // Triple Scene preserves stage overlap and modulo source reuse from the HAR.
 function tripleLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(3,Math.min(24,Math.round(count)||12)),unit=Math.min(fw,fh)/100,pad=unit*c.padding,ratio=c.cardRatio==='auto'?Math.max(.25,Math.min(4,+imageRatio||1)):ratios[c.cardRatio]||16/9,gap=unit*c.gap,columns=Math.max(2,c.columns-(fh>fw*1.05?1:0)),cardW=(fw-2*pad-gap*(columns-1))/columns,cardH=cardW/ratio,heroW=Math.min(fw-2*pad,(fh-2*pad)*ratio)*c.heroSize/100,heroH=heroW/ratio,pitch=cardH+gap,tw=Math.max(cardW,heroW),th=tw/ratio,radius=unit*c.cornerRadius,t=(phase(progress,c,scroll)%1+1)%1*350,ease=sweepEase(c.easing,c.easeBezier),linear=sweepBezier(.167,.167,.833,.833),clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},cards=[],order=0,beltEnd=3;
  function range(t,a,b){return Math.max(0,Math.min(1,(t-a)/(b-a)));}function fast(t){return 1-Math.pow(1-t,5);}function perColumn(col){return Math.max(2,c.perColumn-col%2);}function colX(col){return pad+col*(cardW+gap)+cardW/2;}
  for(var col=0;col<columns;col++)beltEnd+=perColumn(col);
  for(var slot=0;slot<total;slot++)cards.push({slot:slot,depth:0,alpha:0,visible:false,instances:[],left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],textureWidth:tw,textureHeight:th,corner:0,clip:clip,columns:columns});
  function draw(source,cx,cy,w,stage,col,row){
   var h=w/ratio,x=cx-w/2,y=cy-h/2;if(!(w>0)||!isFinite(w)||!isFinite(cx)||!isFinite(cy)||x>=fw-.5||y>=fh-.5||x+w<=.5||y+h<=.5)return;
   var slot=(source%total+total)%total,scale=w/tw,baseRadius=Math.min(radius/scale,tw/2,th/2);cx+=clip.left;cy+=clip.top;x+=clip.left;y+=clip.top;
   var left=Math.max(clip.left,x),top=Math.max(clip.top,y),right=Math.min(clip.left+fw,x+w),bottom=Math.min(clip.top+fh,y+h),matrix=[scale,0,x,0,scale,y,0,0,1],mesh={columns:1,rows:1,width:tw,height:th,radius:baseRadius,vertices:[{x:x,y:y,u:0,v:0},{x:x+w,y:y,u:1,v:0},{x:x,y:y+h,u:0,v:1},{x:x+w,y:y+h,u:1,v:1}]},upper=mesh.vertices.slice(0,2),lower=mesh.vertices.slice(2),polygon=upper.concat(lower.slice().reverse()),instance={stage:stage,column:col,row:row,source:source,copy:order,cardScale:scale,center:{x:cx,y:cy},depth:order++,alpha:1,shade:1,mesh:mesh,homography:{matrix:matrix,inverse:inversePlane(matrix),width:tw,height:th,radius:baseRadius,columns:1,rows:1},upper:upper,lower:lower,polygon:polygon,shadowPolygon:polygon,planeClipRadius:baseRadius,rounded:{cx:cx,cy:cy,width:tw,height:th,radius:baseRadius,angle:0,scaleX:scale,scaleY:scale},left:left,top:top,width:right-left,height:bottom-top},card=cards[slot];
   card.instances.push(instance);card.depth=instance.depth;card.alpha=1;card.visible=true;if(card.instances.length===1){card.left=left;card.top=top;card.width=right-left;card.height=bottom-top;card.upper=upper;card.lower=lower;}else{var farX=Math.max(card.left+card.width,right),farY=Math.max(card.top+card.height,bottom);card.left=Math.min(card.left,left);card.top=Math.min(card.top,top);card.width=farX-card.left;card.height=farY-card.top;}
  }
  if(t<102){var progressHero=Math.min(3,Math.max(0,(t-10)/30)),active=Math.min(2,Math.floor(progressHero)),heroPosition=active+ease(progressHero-active),heroStep=fh/2+heroH/2+unit*c.heroGap;for(var row=0;row<3;row++)draw(row,fw/2,fh/2+(heroPosition-row)*heroStep,heroW,'hero',-1,row);}
  if(t>=89&&t<200){var beltTime=t-89,source=3;for(var col=0;col<columns;col++){var n=perColumn(col),direction=col%2===0?1:-1,travel=fh/2+cardH/2+(n-1)/2*pitch,drift=-direction*unit*c.columnDrift*linear(range(beltTime,21,90));for(var row=0;row<n;row++){var local=beltTime-(direction>0?row:n-1-row),move=fast(range(local,0,30))+ease(range(local,76,106));draw(source++,colX(col),fh/2+drift+direction*travel*(1-move)+(row-(n-1)/2)*pitch,cardW,'columns',col,row);}}}
  if(t>=183){var rowTime=t-183,middle=Math.floor(columns/2);for(var layer=1;layer>=0;layer--)for(var col=columns-1;col>=0;col--){var hero=layer===1&&col===middle,local=rowTime-([0,66][layer]+col*6);if(local<=0)continue;var grow=fast(range(local,0,25));if(grow<=0)continue;var shifted=layer===0||col<middle?col:col-1,x=colX(col),y=fh/2+unit*c.rowRise*(1-linear(range(local,0,62)))+(col-(columns-1)/2)*unit*c.rowTilt,w=cardW*grow;
   if(hero){var focus=ease(range(rowTime,133,150));w=(cardW+(heroW-cardW)*focus)*grow;x+=(fw/2-x)*focus;y+=(fh/2-y)*focus;}else{var exit=[55,121][layer]+shifted*6;y+=(-cardH/2-y)*ease(range(rowTime,exit,exit+20));}
   var source=hero?0:1+(beltEnd+layer*columns+shifted)%Math.max(1,total-1);draw(source,x,y,w,hero?'final-hero':'row',col,layer);
  }}return cards;
 }

 var sweepSpecs={rowCard:[60,20,100,1],cardGap:[4,0,12,.5],deckDepth:[5,0,15,1],ringCard:[30,10,60,1],ringSize:[36,10,60,1]};
 var sweepEasings={custom:'Personalizado',smooth:'Suave',natural:'Natural',slowdown:'Frenar',snappy:'Rápido',accelerate:'Acelerar',elastic:'Elástico',bounce:'Rebote',overshoot:'Sobrepasar',impulse:'Impulso',swing:'Balanceo',linear:'Lineal'};
 function sweepBezier(x1,y1,x2,y2){
  var a=3*x1,b=3*(x2-x1)-a,c=1-a-b,d=3*y1,e=3*(y2-y1)-d,f=1-d-e;
  function x(t){return((c*t+b)*t+a)*t;}function y(t){return((f*t+e)*t+d)*t;}function slope(t){return(3*c*t+2*b)*t+a;}
  return function(t){if(t<=0)return 0;if(t>=1)return 1;var p=t;for(var j=0;j<6;j++){var error=x(p)-t;if(Math.abs(error)<1e-5)return y(p);var v=slope(p);if(Math.abs(v)<1e-6)break;p-=error/v;}var lo=0,hi=1;for(p=t;hi-lo>1e-5;){if(x(p)<t)lo=p;else hi=p;p=(lo+hi)/2;}return y(p);};
 }
 function sweepEase(name,curve){
  if(name==='custom'){var p=String(curve||'').split(',').map(Number);if(p.length===4&&p.every(function(n){return isFinite(n)&&Math.abs(n)<=1e6;}))return sweepBezier(Math.max(0,Math.min(1,p[0])),p[1],Math.max(0,Math.min(1,p[2])),p[3]);return function(t){return 1-Math.pow(1-t,3.4);};}
  var curves={natural:[.4,0,.2,1],slowdown:[0,0,.35,1],accelerate:[.55,0,.85,.3],impulse:[.5,-.6,.3,1]};if(curves[name])return sweepBezier.apply(null,curves[name]);
  return function(t){var k=2.5949095;if(name==='linear')return t;if(name==='snappy')return t>=1?1:1-Math.pow(2,-10*t);if(name==='overshoot')return 1+3.2*Math.pow(t-1,3)+2.2*Math.pow(t-1,2);if(name==='swing')return t<.5?Math.pow(2*t,2)*((k+1)*2*t-k)/2:(Math.pow(2*t-2,2)*((k+1)*(t*2-2)+k)+2)/2;if(name==='bounce')return t<1/2.75?7.5625*t*t:t<2/2.75?7.5625*(t-=1.5/2.75)*t+.75:t<2.5/2.75?7.5625*(t-=2.25/2.75)*t+.9375:7.5625*(t-=2.625/2.75)*t+.984375;if(name==='elastic')return t<=0?0:t>=1?1:Math.pow(2,-10*t)*Math.sin((t*10-.75)*2*Math.PI/3)+1;return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
 }
 function sweepLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(3,Math.min(16,Math.round(count)||8)),unit=Math.min(fw,fh)/100,pad=unit*c.padding,ratio=c.cardRatio==='auto'?Math.max(.25,Math.min(4,+imageRatio||1)):ratios[c.cardRatio]||16/9,tw=Math.min(fw-2*pad,(fh-2*pad)*ratio),th=tw/ratio,baseRadius=Math.min(unit*c.cornerRadius,tw/2,th/2),clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},a=Math.max(1,total-2),rowSpan=140+a*25,t=(phase(progress,c,scroll)%1+1)%1*(rowSpan+270),ease=sweepEase(c.easing,c.easeBezier),rowScale=c.rowCard/100,ringScale=c.ringCard/100,pitch=tw*rowScale+unit*c.cardGap,cards=[];
  function range(v,start,end){return end<=start?(v>=end?1:0):Math.max(0,Math.min(1,(v-start)/(end-start)));}function mix(x,y,p){return x+(y-x)*p;}
  for(var slot=0;slot<total;slot++)cards.push({slot:slot,depth:total-1-slot,alpha:0,visible:false,instances:[],left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],textureWidth:tw,textureHeight:th,corner:0,clip:clip});
  for(var slot=total-1;slot>=0;slot--){
   var scale,dx=0,dy=0,stage=t<rowSpan?'row':'ring';
   if(stage==='row'){var back=Math.max(ringScale,rowScale-Math.max(0,slot-2)*c.deckDepth/100),close=ease(range(t,103+a*25,rowSpan)),walk=ease(range(t,100,100+a*25))*a;scale=t<50?mix(1,back,ease(range(t,20,50))):t<90?mix(back,rowScale,ease(range(t,60,90))):mix(rowScale,ringScale,close);dx=(slot-1-walk)*pitch*ease(range(t,60,90))*(1-close);}
   else{var r=t-rowSpan,open=ease(range(r,0,30))-ease(range(r,210,240)),angle=2*Math.PI*ease(range(r,30,210))-slot*2*Math.PI/total;dx=Math.cos(angle)*unit*c.ringSize*open;dy=Math.sin(angle)*unit*c.ringSize*open;scale=slot===0?mix(ringScale,1,ease(range(r,240,270))):ringScale;}
   if(!(scale>0)||!isFinite(scale)||!isFinite(dx)||!isFinite(dy))continue;
   var cx=width/2+dx,cy=height/2+dy,x=cx-tw*scale/2,y=cy-th*scale/2,left=Math.max(clip.left,x),top=Math.max(clip.top,y),right=Math.min(clip.left+fw,x+tw*scale),bottom=Math.min(clip.top+fh,y+th*scale);if(right<=left||bottom<=top)continue;
   var matrix=[scale,0,x,0,scale,y,0,0,1],mesh={columns:1,rows:1,width:tw,height:th,radius:baseRadius,vertices:[{x:x,y:y,u:0,v:0},{x:x+tw*scale,y:y,u:1,v:0},{x:x,y:y+th*scale,u:0,v:1},{x:x+tw*scale,y:y+th*scale,u:1,v:1}]},upper=mesh.vertices.slice(0,2),lower=mesh.vertices.slice(2),polygon=upper.concat(lower.slice().reverse()),instance={stage:stage,cardScale:scale,center:{x:cx,y:cy},depth:total-1-slot,alpha:1,shade:1,mesh:mesh,homography:{matrix:matrix,inverse:inversePlane(matrix),width:tw,height:th,radius:baseRadius,columns:1,rows:1},upper:upper,lower:lower,polygon:polygon,shadowPolygon:polygon,planeClipRadius:baseRadius,rounded:{cx:cx,cy:cy,width:tw,height:th,radius:baseRadius,angle:0,scaleX:scale,scaleY:scale},left:left,top:top,width:right-left,height:bottom-top},card=cards[slot];
   card.instances=[instance];card.alpha=1;card.visible=true;card.left=left;card.top=top;card.width=right-left;card.height=bottom-top;card.upper=upper;card.lower=lower;
  }return cards;
 }

 var spreadMaps={};
 var depthStackSpecs={size:[25,20,70,1],cardCount:[24,4,50,1],spacing:[32,18,80,2],spread:[74,0,120,2],spreadAngle:[-58,-180,180,2],wobble:[0,0,100,5],depthFade:[45,0,100,5],blur:[0,0,8,.5]};
 var gridStripSpecs={zoom:[2,1.2,3,.1],gridGap:[2,0,8,.5]};
 var marqueeSpecs={size:[55,30,80,1],gap:[3,.5,8,.5],offsetX:[0,-50,50,1],offsetY:[0,-50,50,1]};
 var orbitGlobeSpecs={cornerRadius:[1,0,12,.5],globeSize:[50,40,95,1],cardSize:[28,8,30,1],gap:[2.5,.5,8,.25],backFade:[55,0,90,5],tilt:[27,-45,45,1]};
 var globeSpecs={cornerRadius:[1,0,12,.5],globeSize:[70,40,95,1],cardSize:[20,8,30,1],gap:[2.5,.5,8,.25],backFade:[55,0,90,5],tilt:[0,-45,45,1],stops:[5,2,12,1],zoom:[2.8,1.2,4,.1]};
 var vortexSpecs={cornerRadius:[1,0,12,.5],rings:[3,2,4,1],ringSize:[34,20,90,1],cardSize:[15,8,24,1],depth:[50,10,100,5],backFade:[35,0,80,5],offsetX:[0,-50,50,1],offsetY:[0,-50,50,1]};
 var parallaxTotemSpecs=Object.assign({},totemWallSpecs,{zoom:[50,10,50,1],scatter:[70,0,100,5],sizeVar:[30,0,50,5],parallax:[50,0,100,5],gap:[6.75,.5,20,.25]});delete parallaxTotemSpecs.tilt;
 var focusSliderSpecs={cardSize:[82,40,100,2],centerScale:[200,120,260,5],offset:[55,0,90,5],gap:[6,1,20,.5],glide:[80,30,95,5]};
 var focusOrbitSpecs={pulse:[60,10,90,5],zoom:[2.4,1.5,3.5,.1],spinStops:[5,2,20,1],ringSize:[72,40,95,1],rotateY:[0,-70,70,1],perspective:[55,0,80,5],cardSize:[18,10,32,1]};
 var spotlightSpecs={gap:[3,0,10,.5],dimming:[45,0,80,5]};
 var columnDriftSpecs={gap:[3,1,8,.5]};
 var orbitCarouselSpecs={spread:[70,40,100,5],depth:[60,20,90,5],offsetX:[0,-50,50,1],offsetY:[0,-50,50,1]};
 var flipSpecs={gap:[3,0,10,.5],offsetX:[0,-50,50,1],offsetY:[0,-50,50,1]};
 var heroSpecs=Object.assign({},mosaicSpecs,{lift:[1.8,0,4,.1],activeScale:[108,100,120,1],gap:[2,0,6,.5],heroOpacity:[55,0,100,5],kenBurns:[60,0,100,5],hold:[55,20,80,5]});
 var stripeSpecs={strips:[7,3,14,1],offsetX:[0,-50,50,1],offsetY:[0,-50,50,1]};
 var wipeSpecs={angle:[-20,-45,45,5],edgeGlow:[60,0,100,5],offsetX:[0,-50,50,1],offsetY:[0,-50,50,1]};
 var splitSpecs={splitRatio:[50,30,70,1],gap:[2,0,8,.5],offsetX:[0,-50,50,1],offsetY:[0,-50,50,1]};
 var showcaseSpecs={pulse:[60,10,90,5],ringWidth:[64,30,90,1],ringHeight:[26,8,60,1],ringTilt:[0,-45,45,1],spread:[100,0,100,1],cardSize:[22,12,34,1],perspective:[55,0,100,5],backFade:[45,0,90,5],offsetX:[0,-50,50,1],offsetY:[0,-50,50,1]};
 var cascadeDeckSpecs={cardSize:[80,45,100,1],overlap:[70,40,85,1],offsetX:[0,-50,50,1],offsetY:[0,-50,50,1]};
 var danceSpecs={cardSize:[28,16,42,1],spacing:[0,-20,20,1],cornerRadius:[4,0,12,.5],offsetX:[0,-50,50,1],offsetY:[0,-50,50,1]};
 var trailSpecs={cardSize:[19,10,32,.5],trailLength:[18,8,24,1],popFrom:[50,0,80,5],cornerRadius:[0,0,12,.5],offsetX:[0,-50,50,1],offsetY:[0,-50,50,1]};
 var ringVerticalSpecs={rotate:[0,-60,60,1]};
 var ringSpecs={cardSize:[37,16,100,1],ringSize:[131,50,400,1],tilt:[0,-60,60,1],perspective:[55,0,100,5],backFade:[55,0,90,5],offsetX:[0,-50,50,1],offsetY:[0,-50,50,1]};
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
 function config(raw){raw=raw||{};var out={},orbit=raw.kind==='iso-orbit',pop=raw.kind==='pop-grid',reveal=raw.kind==='grid-reveal',zoom=raw.kind==='zoom-parallax',drop=raw.kind==='cascade-drop',shift=raw.kind==='focus-shift',spiral=raw.kind==='spiral-stream',feed=raw.kind==='feed-scroll',fan=raw.kind==='fan-shuffle',scatter=raw.kind==='scatter-dial',collage=raw.kind==='collage-reel',triple=raw.kind==='triple-scene',sweep=raw.kind==='sweep-ring',spread=raw.kind==='spread-rows'||raw.kind==='spread-columns',depthStack=raw.kind==='depth-stack-scroll',strip=raw.kind==='grid-zoom-strip',marquee=raw.kind==='mosaic-marquee',orbitGlobe=raw.kind==='orbit-globe',globe=raw.kind==='sphere-globe',vortex=raw.kind==='vortex-spin',parallaxTotem=raw.kind==='parallax-totem',totemWall=raw.kind==='totem-wall',sphere=parallaxTotem||totemWall||raw.kind==='sphere-wall'||raw.kind==='sphere-cascade',focusSlider=raw.kind==='focus-slider',focusOrbit=raw.kind==='focus-orbit',spotlight=raw.kind==='spotlight-zoom',columnDrift=raw.kind==='column-drift',orbitCarousel=raw.kind==='orbit-carousel',flip=raw.kind==='flip-grid',hero=raw.kind==='hero-reel',mosaic=raw.kind==='mosaic-wipe',stripe=raw.kind==='stripe-reveal',wipe=raw.kind==='diagonal-wipe',split=raw.kind==='split-reveal',showcase=raw.kind==='orbit-showcase',deck=raw.kind==='cascade-deck',dance=raw.kind==='position-dance',trail=raw.kind==='image-trail',ringVertical=raw.kind==='cover-ring-vertical',ring=ringVertical||raw.kind==='cover-ring',cover=raw.kind==='cover-flow'||raw.kind==='cover-flow-vertical',coverVertical=raw.kind==='cover-flow-vertical',bottom=raw.kind==='wheel-spin-bottom',spin=bottom||raw.kind==='wheel-spin',wheel=raw.kind==='wheel-carousel',photo=raw.kind==='photo-orbit',burst=raw.kind==='poster-burst',peel=raw.kind==='deck-peel',film=raw.kind==='film-strip',totem=raw.kind==='card-totem',stage=raw.kind==='center-stage',bloom=raw.kind==='orbit-bloom',ticker=raw.kind==='ticker-tilt',tickerLoop=raw.kind==='ticker-loop',carousel=raw.kind==='carousel-flow',stack=raw.kind==='stack-slide',focus=raw.kind==='iso-focus-sequence',toss=raw.kind==='card-toss',diagonal=raw.kind==='diagonal-carousel',cascade=raw.kind==='iso-cascade',fields=scatter?Object.assign({},specs,scatterSpecs):fan?Object.assign({},specs,fanSpecs):feed?Object.assign({},specs,feedSpecs):collage?Object.assign({},specs,collageSpecs):triple?Object.assign({},specs,tripleSpecs):sweep?Object.assign({},specs,sweepSpecs):spread?Object.assign({},specs,spreadSpecs):depthStack?Object.assign({},specs,depthStackSpecs):strip?Object.assign({},specs,gridStripSpecs):marquee?Object.assign({},specs,marqueeSpecs):orbitGlobe?Object.assign({},specs,orbitGlobeSpecs):globe?Object.assign({},specs,globeSpecs):vortex?Object.assign({},specs,vortexSpecs):sphere?Object.assign({},specs,parallaxTotem?parallaxTotemSpecs:totemWall?totemWallSpecs:sphereSpecs):focusSlider?Object.assign({},specs,focusSliderSpecs):focusOrbit?Object.assign({},specs,focusOrbitSpecs):spotlight?Object.assign({},specs,spotlightSpecs):columnDrift?Object.assign({},specs,columnDriftSpecs):orbitCarousel?Object.assign({},specs,orbitCarouselSpecs):flip?Object.assign({},specs,flipSpecs):hero?Object.assign({},specs,heroSpecs):mosaic?Object.assign({},specs,mosaicSpecs):stripe?Object.assign({},specs,stripeSpecs):wipe?Object.assign({},specs,wipeSpecs):split?Object.assign({},specs,splitSpecs):showcase?Object.assign({},specs,showcaseSpecs):deck?Object.assign({},specs,cascadeDeckSpecs):dance?Object.assign({},specs,danceSpecs):trail?Object.assign({},specs,trailSpecs):ring?Object.assign({},specs,ringSpecs,ringVertical?ringVerticalSpecs:{}):cover?Object.assign({},specs,coverSpecs):bottom?Object.assign({},specs,bottomSpecs):spin?Object.assign({},specs,spinSpecs):wheel?Object.assign({},specs,wheelSpecs):photo?Object.assign({},specs,photoSpecs):burst?Object.assign({},specs,burstSpecs):peel?Object.assign({},specs,peelSpecs):film?Object.assign({},specs,filmSpecs):totem?Object.assign({},specs,totemSpecs):spiral?Object.assign({},specs,spiralSpecs):shift?Object.assign({},specs,shiftSpecs):drop?Object.assign({},specs,dropSpecs):zoom?Object.assign({},specs,zoomSpecs):reveal?Object.assign({},specs,revealSpecs):diagonal?Object.assign({},specs,diagonalSpecs):cascade?Object.assign({},specs,cascadeSpecs):toss?Object.assign({},specs,tossSpecs):focus?Object.assign({},specs,focusSpecs):stack?Object.assign({},specs,stackSpecs):carousel?Object.assign({},specs,carouselSpecs):tickerLoop?Object.assign({},specs,tickerLoopSpecs):ticker?Object.assign({},specs,tickerSpecs):bloom?Object.assign({},specs,bloomSpecs):stage?Object.assign({},specs,stageSpecs):orbit?Object.assign({},specs,orbitSpecs):pop?Object.assign({},specs,popSpecs):specs;Object.keys(fields).forEach(function(k){var s=fields[k],n=raw[k];out[k]=Math.max(s[1],Math.min(s[2],n!==''&&n!=null&&isFinite(+n)?+n:s[0]));});out.end=Math.max(out.start+1,out.end);out.cardRatio=strip?(raw.cardRatio==='auto'||raw.cardRatio==='frame'||ratios[raw.cardRatio]?raw.cardRatio:'frame'):spotlight||flip?'frame':hero?'1:1':mosaic||stripe||split||wipe?'frame':raw.cardRatio==='auto'||(orbitCarousel||carousel||stack||drop||burst)&&raw.cardRatio==='frame'||ratios[raw.cardRatio]?raw.cardRatio:toss?'3:4':orbit||bloom||ticker||tickerLoop||carousel||stack||focus||diagonal||cascade||drop||spiral||film||totem||peel||burst||photo||wheel||spin||cover||ring||trail||dance||deck||showcase||orbitCarousel||columnDrift||focusOrbit||focusSlider||orbitGlobe||marquee||depthStack||spread?'1:1':'16:9';out.frameRatio=raw.frameRatio==='auto'||ratios[raw.frameRatio]?raw.frameRatio:'16:9';out.shadow=!!raw.shadow;out.backgroundType=['none','color','gradient','image'].indexOf(raw.backgroundType)>=0?raw.backgroundType:'color';out.backgroundColor=/^#[0-9a-f]{6}$/i.test(raw.backgroundColor||'')?raw.backgroundColor:'#101014';out.gradientColor=/^#[0-9a-f]{6}$/i.test(raw.gradientColor||'')?raw.gradientColor:'#3a3a5a';out.backgroundId=typeof raw.backgroundId==='string'?raw.backgroundId:'';if(orbit){out.kind='iso-orbit';out.motion=raw.motion==='spin'?'spin':'swing';}if(bloom){out.kind='orbit-bloom';out.direction=raw.direction==='left'?'left':'right';out.motion=raw.motion==='pulse'?'pulse':'linear';}if(ticker){out.kind='ticker-tilt';out.direction=raw.direction==='right'?'right':'left';out.flow=['same','staggered'].indexOf(raw.flow)>=0?raw.flow:'opposed';}if(tickerLoop){out.kind='ticker-loop';out.orientation=raw.orientation==='vertical'?'vertical':'horizontal';out.direction=raw.direction==='same'?'same':'opposed';out.movement=['zoomPulse','zoomWaypoints'].indexOf(raw.movement)>=0?raw.movement:'continuous';}if(diagonal){out.kind='diagonal-carousel';out.direction=['downRight','downLeft','upRight','upLeft'].indexOf(raw.direction)>=0?raw.direction:'downRight';out.movement=raw.movement==='stepped'?'stepped':'continuous';}if(cascade){out.kind='iso-cascade';out.direction=['up','down','down-right','up-left'].indexOf(raw.direction)>=0?raw.direction:'up';out.motion=raw.motion==='stepped'?'stepped':'continuous';}if(toss){out.kind='card-toss';out.flow=raw.flow==='one'?'one':'staggered';}if(focus){out.kind='iso-focus-sequence';out.direction=raw.direction==='up'?'up':'down';}if(stack)out.kind='stack-slide';if(carousel){out.kind='carousel-flow';out.direction=raw.direction==='vertical'?'vertical':'horizontal';}if(reveal){out.kind='grid-reveal';out.order=['row','column','diagonal'].indexOf(raw.order)>=0?raw.order:'row';}if(film||totem){out.kind=film?'film-strip':'card-totem';out.motion=raw.motion==='steps'?'steps':'flow';}if(spiral){out.kind='spiral-stream';out.cardCount=Math.round(out.cardCount);out.direction=raw.direction==='up'?'up':'down';out.motion=['pulse','steps'].indexOf(raw.motion)>=0?raw.motion:'flow';out.cardStyle=raw.cardStyle==='upright'?'upright':'curved';}if(feed){out.kind='feed-scroll';out.motion=raw.motion==='steady'?'steady':'flicks';out.enter=raw.enter==='slide'?'slide':'fade';}if(collage||triple||sweep||fan||scatter){out.kind=scatter?'scatter-dial':fan?'fan-shuffle':collage?'collage-reel':triple?'triple-scene':'sweep-ring';if(collage)out.reelDirection=['down','left','right'].indexOf(raw.reelDirection)>=0?raw.reelDirection:'up';if(scatter){out.direction=raw.direction==='ccw'?'ccw':'cw';var paths=Array.isArray(raw.scatterPaths)?raw.scatterPaths.slice(0,5).map(scatterPath):[];if(paths.some(function(p){return !!p;}))out.scatterPaths=paths;}if(fan){out.deckCards=Math.round(out.deckCards);out.columns=Math.round(out.columns);}if(triple){out.columns=Math.round(out.columns);out.perColumn=Math.round(out.perColumn);}out.easing=Object.prototype.hasOwnProperty.call(sweepEasings,raw.easing)?raw.easing:'custom';out.easeBezier=typeof raw.easeBezier==='string'?raw.easeBezier.slice(0,256):scatter?'0.84,0,0.16,1':'0.88,0.14,0.12,0.86';out.motion='continuous';}if(spread){out.kind=raw.kind;out.rows=Math.round(out.rows);out.rowsOdd=Math.round(out.rowsOdd)|1;out.stackStyle=raw.stackStyle==='rowEdges'?'rowEdges':'single';out.motion='continuous';}if(depthStack){out.kind='depth-stack-scroll';out.cardCount=Math.round(out.cardCount);out.layout=raw.layout==='fan'?'fan':'scatter';out.direction=raw.direction==='backward'?'backward':'forward';out.motion='continuous';}if(strip){out.kind='grid-zoom-strip';out.direction=raw.direction==='vertical'?'vertical':'horizontal';out.focusMode=raw.focusMode==='center'?'center':'start';out.movement=raw.movement==='stepped'?'stepped':'smooth';out.fade=!!raw.fade;out.motion='continuous';}if(marquee){out.kind='mosaic-marquee';out.direction=raw.direction==='right'?'right':'left';out.variant=['2','3'].indexOf(String(raw.variant))>=0?String(raw.variant):'1';out.motion='continuous';}if(orbitGlobe){out.kind='orbit-globe';out.direction=['right','alternate'].indexOf(raw.direction)>=0?raw.direction:'left';out.motion=raw.motion==='waypoints'?'waypoints':'continuous';}if(globe){out.kind='sphere-globe';out.direction=['right','alternate'].indexOf(raw.direction)>=0?raw.direction:'left';out.motion=['waypoints','waypoints-move'].indexOf(raw.motion)>=0?raw.motion:'continuous';out.stops=Math.round(out.stops);out.focusStyle=raw.focusStyle==='spotlight'?'spotlight':'overlap';}if(vortex){out.kind='vortex-spin';out.rings=Math.round(out.rings);out.direction=['cw','ccw'].indexOf(raw.direction)>=0?raw.direction:'alternate';out.cardStyle=raw.cardStyle==='flat'?'flat':'curved';out.motion='continuous';}if(sphere){var vertical=parallaxTotem||totemWall||raw.kind==='sphere-cascade';out.kind=parallaxTotem?'parallax-totem':totemWall?'totem-wall':vertical?'sphere-cascade':'sphere-wall';out.direction=(vertical?(parallaxTotem?['down']:['down','alternate']):['right','alternate']).indexOf(raw.direction)>=0?raw.direction:vertical?'up':'left';out.motion=!(totemWall||parallaxTotem)&&['waypoints','waypoints-move'].indexOf(raw.motion)>=0?raw.motion:'continuous';if(parallaxTotem)out.tilt=0;if(!totemWall&&!parallaxTotem){out.focusStyle=raw.focusStyle==='spotlight'?'spotlight':'overlap';out.stops=Math.round(out.stops);}}
if(focusSlider){out.kind='focus-slider';out.direction=raw.direction==='vertical'?'vertical':'horizontal';out.weave=raw.weave==='fixed'?'fixed':'alternate';}if(focusOrbit){out.kind='focus-orbit';out.direction=raw.direction==='left'?'left':'right';out.motion=raw.motion==='pulse'?'pulse':'smooth';out.zoomStyle=raw.zoomStyle==='spotlight'?'spotlight':'overlap';out.rotateYScope=raw.rotateYScope==='zoom'?'zoom':'always';out.cardFacing=raw.cardFacing==='follow'?'follow':'front';out.spinStops=Math.round(out.spinStops);}if(spotlight)out.kind='spotlight-zoom';if(columnDrift)out.kind='column-drift';if(orbitCarousel)out.kind='orbit-carousel';if(flip){out.kind='flip-grid';out.axis=raw.axis==='vertical'?'vertical':'horizontal';}if(hero||mosaic){out.kind=hero?'hero-reel':'mosaic-wipe';['rows','columns','slats'].forEach(function(k){out[k]=Math.round(out[k]);});out.style=raw.style==='blinds'?'blinds':'grid';out.pattern=['diagonal','radial','spiral','random'].indexOf(raw.pattern)>=0?raw.pattern:'normal';out.orientation=raw.orientation==='vertical'?'vertical':'horizontal';out.openFrom=['end','center','alternate'].indexOf(raw.openFrom)>=0?raw.openFrom:'start';}if(stripe){out.kind='stripe-reveal';out.strips=Math.round(out.strips);}if(wipe)out.kind='diagonal-wipe';if(split)out.kind='split-reveal';if(showcase){out.kind='orbit-showcase';out.direction=raw.direction==='left'?'left':'right';out.motion=raw.motion==='pulse'?'pulse':'linear';}if(deck){out.kind='cascade-deck';out.motion=raw.motion==='together'?'together':'staggered';}if(dance)out.kind='position-dance';if(trail){out.kind='image-trail';out.trailLength=Math.round(out.trailLength);}if(ring){out.kind=ringVertical?'cover-ring-vertical':'cover-ring';out.direction=ringVertical?(raw.direction==='down'?'down':'up'):(raw.direction==='left'?'left':'right');out.motion=raw.motion==='flow'?'flow':'steps';}if(cover){out.kind=coverVertical?'cover-flow-vertical':'cover-flow';out.direction=coverVertical?(raw.direction==='down'?'down':'up'):(raw.direction==='right'?'right':'left');out.motion=raw.motion==='flow'?'flow':'steps';if(coverVertical)out.flowAngle=0;}if(spin){out.kind=bottom?'wheel-spin-bottom':'wheel-spin';out.direction=raw.direction==='left'?'left':'right';out.movement=raw.movement==='stepped'?'stepped':'continuous';out.spinStyle=['self','flip'].indexOf(raw.spinStyle)>=0?raw.spinStyle:'none';out.flipAxis=raw.flipAxis==='x'?'x':'y';out.rotations=Math.round(out.rotations);out.spinRate=Math.round(out.spinRate);}if(wheel){out.kind='wheel-carousel';out.direction=raw.direction==='left'?'left':'right';}if(photo){out.kind='photo-orbit';out.direction=raw.direction==='left'?'left':'right';out.motion=['pulse','steps'].indexOf(raw.motion)>=0?raw.motion:'linear';}if(burst){out.kind='poster-burst';out.flow=['staggered','volley'].indexOf(raw.flow)>=0?raw.flow:'sequential';out.groupSize=Math.round(out.groupSize);}if(peel)out.kind='deck-peel';if(shift)out.kind='focus-shift';if(drop)out.kind='cascade-drop';if(zoom){out.kind='zoom-parallax';out.panDir=['left','right','alternate'].indexOf(raw.panDir)>=0?raw.panDir:'alternate';}if(pop)out.kind='pop-grid';if(stage){out.kind='center-stage';out.ghosts=raw.ghosts!==false;}return out;}
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
  if(c.kind==='scatter-dial')return scatterLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='fan-shuffle')return fanLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='feed-scroll')return feedLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='collage-reel')return collageLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='triple-scene')return tripleLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='sweep-ring')return sweepLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='spread-rows'||c.kind==='spread-columns')return spreadLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='depth-stack-scroll')return depthStackLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='grid-zoom-strip')return gridStripLayout(width,height,fw,fh,c,progress,imageRatio,scroll);
  if(c.kind==='mosaic-marquee')return marqueeLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='orbit-globe')return orbitGlobeLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='sphere-globe')return globeLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='vortex-spin')return vortexLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='parallax-totem'||c.kind==='totem-wall'||c.kind==='sphere-wall'||c.kind==='sphere-cascade')return sphereLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='focus-slider')return focusSliderLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='focus-orbit')return focusOrbitLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='spotlight-zoom')return spotlightLayout(width,height,fw,fh,c,progress,count,scroll);
  if(c.kind==='column-drift')return columnDriftLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='orbit-carousel')return orbitCarouselLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='flip-grid')return flipLayout(width,height,fw,fh,c,progress,count,scroll);
  if(c.kind==='hero-reel')return heroLayout(width,height,fw,fh,c,progress,count,scroll);
  if(c.kind==='mosaic-wipe')return mosaicLayout(width,height,fw,fh,c,progress,count,scroll);
  if(c.kind==='stripe-reveal')return stripeLayout(width,height,fw,fh,c,progress,count,scroll);
  if(c.kind==='diagonal-wipe')return wipeLayout(width,height,fw,fh,c,progress,count,scroll);
  if(c.kind==='split-reveal')return splitLayout(width,height,fw,fh,c,progress,scroll);
  if(c.kind==='orbit-showcase')return showcaseOrbitLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='cascade-deck')return cascadeDeckLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='position-dance')return danceLayout(width,height,fw,fh,c,progress,imageRatio,scroll);
  if(c.kind==='image-trail')return trailLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
  if(c.kind==='cover-ring'||c.kind==='cover-ring-vertical')return ringLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll);
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
 // Stable seeded orders and mask timings make forward/reverse scroll reproducible.
 function mosaicRandom(seed){return function(){seed=seed+1831565813|0;var n=Math.imul(seed^seed>>>15,1|seed);n=n+Math.imul(n^n>>>7,61|n)^n;return((n^n>>>14)>>>0)/4294967296;};}
 function mosaicOrder(rows,columns,pattern){
  var ranks=[],total=rows*columns;for(var i=0;i<total;i++)ranks.push(i);
  if(pattern==='diagonal'||pattern==='radial'){for(var row=0;row<rows;row++)for(var col=0;col<columns;col++)ranks[row*columns+col]=pattern==='diagonal'?row+col:Math.hypot(col-(columns-1)/2,row-(rows-1)/2);}
  else if(pattern==='spiral'){var top=0,bottom=rows-1,left=0,right=columns-1,rank=0;while(top<=bottom&&left<=right){for(var x=left;x<=right;x++)ranks[top*columns+x]=rank++;top++;for(var y=top;y<=bottom;y++)ranks[y*columns+right]=rank++;right--;if(top<=bottom){for(x=right;x>=left;x--)ranks[bottom*columns+x]=rank++;bottom--;}if(left<=right){for(y=bottom;y>=top;y--)ranks[y*columns+left]=rank++;left++;}}}
  else if(pattern==='random'){var rng=mosaicRandom(rows*1000+columns),order=ranks.slice();for(i=total-1;i>0;i--){var j=Math.floor(rng()*(i+1)),swap=order[i];order[i]=order[j];order[j]=swap;}order.forEach(function(cell,rank){ranks[cell]=rank;});}
  return ranks;
 }
 // The HAR orbit/zoom/spin/return camera shares the same deterministic progress as every stream.
 // An even sequence glides between centered holds; alternate weave closes after a full cycle.
 // Curved cards share the same triangulation for painting and native selection.
 function meshTriangles(mesh,visit){var stride=mesh.columns+1;for(var y=0;y<mesh.rows;y++)for(var x=0;x<mesh.columns;x++){var i=y*stride+x,a=mesh.vertices[i],b=mesh.vertices[i+1],c=mesh.vertices[i+stride+1],d=mesh.vertices[i+stride];if(a&&b&&c)visit(a,b,c);if(a&&c&&d)visit(a,c,d);}}
 function meshPoint(mesh,u,v){u=Math.max(0,Math.min(1,u));v=Math.max(0,Math.min(1,v));var x=Math.min(mesh.columns-1,Math.floor(u*mesh.columns)),y=Math.min(mesh.rows-1,Math.floor(v*mesh.rows)),fx=u*mesh.columns-x,fy=v*mesh.rows-y,i=y*(mesh.columns+1)+x,a=mesh.vertices[i],b=mesh.vertices[i+1],c=mesh.vertices[i+mesh.columns+2],d=mesh.vertices[i+mesh.columns+1],tri=fx>=fy?[a,b,c]:[a,c,d],w=fx>=fy?[1-fx,fx-fy,fy]:[1-fy,fx,fy-fx];if(tri.some(function(p){return !p;}))return null;return{x:tri.reduce(function(n,p,i){return n+p.x*w[i];},0),y:tri.reduce(function(n,p,i){return n+p.y*w[i];},0)};}
 function meshUV(mesh,x,y){var hit=null;meshTriangles(mesh,function(a,b,c){var det=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(det)<1e-8)return;var u=((b.y-c.y)*(x-c.x)+(c.x-b.x)*(y-c.y))/det,v=((c.y-a.y)*(x-c.x)+(a.x-c.x)*(y-c.y))/det,w=1-u-v;if(Math.min(u,v,w)<-1e-7)return;var sx=(a.u*u+b.u*v+c.u*w)*mesh.width,sy=(a.v*u+b.v*v+c.v*w)*mesh.height,r=mesh.radius,dx=Math.max(0,Math.abs(sx-mesh.width/2)-(mesh.width/2-r)),dy=Math.max(0,Math.abs(sy-mesh.height/2)-(mesh.height/2-r));if(dx*dx+dy*dy<=r*r+1e-6)hit={u:sx/mesh.width,v:sy/mesh.height};});return hit;}





 function spreadDistribution(total,rows){
  var key=total+':'+rows;if(spreadMaps[key])return spreadMaps[key];
  function mod(a,b){return(a%b+b)%b;}function gcd(a,b){while(b){var t=b;b=a%b;a=t;}return a;}
  function reach(a,b,n){for(var i=0;i<=n;i++)if(mod(a-i*b,n)===0||mod(a+i*b,n)===0)return i;return n;}
  var best={a:1,b:1,spread:-1,gap:-1,reach:-1};
  for(var b=1;b<=total;b++){var gap=Math.min(total/gcd(b,total),12);for(var a=1;a<=total;a++){var spread=Math.min(total/gcd(a,total),rows),r=reach(a,b,total);if(spread>best.spread||spread===best.spread&&(gap>best.gap||gap===best.gap&&r>best.reach))best={a:a,b:b,spread:spread,gap:gap,reach:r};}}
  var order=[],seed=total;for(var i=0;i<total;i++)order.push(i);
  function random(){seed|=0;seed=seed+1831565813|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}
  for(var i=total-1;i>0;i--){var j=Math.floor(random()*(i+1)),t=order[i];order[i]=order[j];order[j]=t;}
  var distribution=[];for(var row=0;row<rows;row++){var lane=[];for(var col=0;col<12;col++)lane.push(order[mod(best.a*row+best.b*col,total)]);distribution.push(lane);}
  return spreadMaps[key]=distribution;
 }
 function spreadLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var vertical=c.kind==='spread-columns',total=Math.max(3,Math.min(24,Math.round(count)||12)),edges=c.stackStyle==='rowEdges',rows=edges?c.rowsOdd:c.rows,unit=Math.min(fw,fh)/100,pad=unit*c.padding,clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},contentWidth=fw-2*pad,contentHeight=fh-2*pad,rowGap=unit*c.rowGap,cardGap=unit*c.cardGap,acrossSize=vertical?fw:fh,alongSize=vertical?fh:fw,contentAcross=vertical?contentWidth:contentHeight,contentAlong=vertical?contentHeight:contentWidth,laneStep=(contentAcross+rowGap)/rows,laneSize=Math.max(1,laneStep-rowGap),ratio=c.cardRatio==='auto'?Math.max(.25,Math.min(4,+imageRatio||1)):ratios[c.cardRatio]||1,th=vertical?laneSize/ratio:laneSize,tw=vertical?laneSize:th*ratio,step=(vertical?th:tw)+cardGap,baseRadius=Math.min(unit*c.cornerRadius,tw/2,th/2),cycle=(phase(progress,c,scroll)%1+1)%1,delay=c.rowDelay/100,drift=contentAlong*c.drift/100,distribution=spreadDistribution(total,rows),cards=[],lanes=[],draws=[];
  function range(t,a,b){return Math.max(0,Math.min(1,(t-a)/(b-a)));}function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
  var camera=1+c.zoom/100*(1-ease(range(cycle,0,.42))+ease(range(cycle,.9,1)));
  for(var row=0;row<rows;row++){
   var offset=row*delay,spread=ease(range(cycle,.08+offset,.22+offset))-ease(range(cycle,.7+offset,.84+offset)),origin=edges?(row===(rows-1)/2?5.5:row<(rows-1)/2?0:11):5.5,along=alongSize/2+(row%2?-1:1)*drift*Math.sin(Math.PI*2*cycle),anchor=edges?alongSize/2+(origin-5.5)*step/camera:alongSize/2,across=edges?pad+row*laneStep+laneSize/2:acrossSize/2+(pad+row*laneStep+laneSize/2-acrossSize/2)*spread;
   lanes.push({spread:spread,origin:origin,along:along,anchor:anchor,across:across,far:Math.max(origin,11-origin)||1});
   for(var col=0;col<12;col++)draws.push({row:row,column:col,distance:Math.abs(col-origin)});
  }
  draws.sort(function(a,b){return b.distance-a.distance;});
  for(var slot=0;slot<total;slot++)cards.push({slot:slot,depth:0,alpha:0,visible:false,instances:[],left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],textureWidth:tw,textureHeight:th,corner:0,clip:clip,cameraZoom:camera});
  draws.forEach(function(draw,order){var lane=lanes[draw.row],cardScale=1+(c.stackScale/100-1)*draw.distance/lane.far;cardScale+=(1-cardScale)*lane.spread;var along=lane.anchor+(lane.along+(draw.column-5.5)*step-lane.anchor)*lane.spread,half=(vertical?th:tw)*cardScale/2;if(along+half<0||along-half>alongSize)return;
   var scale=cardScale*camera,cx=width/2+((vertical?lane.across:along)-fw/2)*camera,cy=height/2+((vertical?along:lane.across)-fh/2)*camera,x=cx-tw*scale/2,y=cy-th*scale/2,left=Math.max(clip.left,x),top=Math.max(clip.top,y),right=Math.min(clip.left+fw,x+tw*scale),bottom=Math.min(clip.top+fh,y+th*scale);if(right<=left||bottom<=top)return;
   var slot=distribution[draw.row][draw.column],card=cards[slot],matrix=[scale,0,x,0,scale,y,0,0,1],mesh={columns:1,rows:1,width:tw,height:th,radius:baseRadius,vertices:[{x:x,y:y,u:0,v:0},{x:x+tw*scale,y:y,u:1,v:0},{x:x,y:y+th*scale,u:0,v:1},{x:x+tw*scale,y:y+th*scale,u:1,v:1}]},upper=mesh.vertices.slice(0,2),lower=mesh.vertices.slice(2),polygon=upper.concat(lower.slice().reverse()),t={row:draw.row,column:draw.column,copy:draw.row*12+draw.column,spread:lane.spread,stackOrigin:lane.origin,cardScale:cardScale,cameraZoom:camera,center:{x:cx,y:cy},depth:order,alpha:1,shade:1,mesh:mesh,homography:{matrix:matrix,inverse:inversePlane(matrix),width:tw,height:th,radius:baseRadius,columns:1,rows:1},upper:upper,lower:lower,polygon:polygon,shadowPolygon:polygon,planeClipRadius:baseRadius,rounded:{cx:cx,cy:cy,width:tw,height:th,radius:baseRadius,angle:0,scaleX:scale,scaleY:scale},left:left,top:top,width:right-left,height:bottom-top};
   card.instances.push(t);card.depth=order;card.alpha=1;card.visible=true;if(card.instances.length===1){card.left=left;card.top=top;card.width=right-left;card.height=bottom-top;card.upper=upper;card.lower=lower;}else{var farX=Math.max(card.left+card.width,right),farY=Math.max(card.top+card.height,bottom);card.left=Math.min(card.left,left);card.top=Math.min(card.top,top);card.width=farX-card.left;card.height=farY-card.top;}
  });return cards;
 }

 function depthStackLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(4,Math.min(16,Math.round(count)||12)),short=Math.min(fw,fh),unit=short/100,ratio=c.cardRatio==='auto'?Math.max(.25,Math.min(4,+imageRatio||1)):ratios[c.cardRatio]||1,th=unit*c.size,tw=th*ratio,baseRadius=Math.min(unit*c.cornerRadius,tw/2,th/2),gap=short*c.spacing/100,fade=c.depthFade/100,blur=unit*c.blur,n=c.cardCount,near=short*.22,far=near+gap*n,cycle=(phase(progress,c,scroll)%1+1)%1,travel=(c.direction==='backward'?-1:1)*cycle*gap*n,scatter=c.layout==='scatter',spread=c.spread/100,wobble=c.wobble/100,angle=c.spreadAngle*Math.PI/180,dx=Math.cos(angle)*short*spread,dy=Math.sin(angle)*short*spread,px=-Math.sin(angle),py=Math.cos(angle),clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},cards=[],seed=6070558,offsets=[];
  function random(){seed|=0;seed=seed+1831565813|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}
  function clamp(t){return Math.max(0,Math.min(1,t));}
  for(var i=0;i<n;i++){var a=random()*Math.PI*2,r=Math.sqrt(random())*spread*short*1.5;offsets.push({perp:(random()*2-1)*wobble,rotation:(random()*2-1)*wobble*.3,x:Math.cos(a)*r,y:Math.sin(a)*r});}
  for(var slot=0;slot<total;slot++)cards.push({slot:slot,depth:0,alpha:0,visible:false,instances:[],left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],textureWidth:tw,textureHeight:th,corner:0,clip:clip});
  var first=Math.ceil((near+travel)/gap-.5);
  for(var order=n-1;order>=0;order--){
   var index=first+order,distance=(index+.5)*gap-travel+near,scale=short/distance,z=clamp((distance-near)/(far-near)),alpha=(1-fade*Math.pow(z,1.1))*clamp((far-distance)/(gap*.9))*clamp((distance-near)/(gap*.4));if(alpha<=.004||tw*scale<1)continue;
   var stackIndex=(index%n+n)%n,slot=stackIndex%total,offset=offsets[stackIndex],drift=1+.6*(scale-1),cx=width/2+(scatter?offset.x*drift:dx*z+px*offset.perp*th),cy=height/2+(scatter?offset.y*drift:dy*z+py*offset.perp*th),co=Math.cos(offset.rotation),si=Math.sin(offset.rotation),matrix=[co*scale,-si*scale,cx-co*tw*scale/2+si*th*scale/2,si*scale,co*scale,cy-si*tw*scale/2-co*th*scale/2,0,0,1],vertices=[{u:0,v:0},{u:1,v:0},{u:0,v:1},{u:1,v:1}].map(function(p){var v=projectPlane(matrix,p.u*tw,p.v*th);return{x:v.x,y:v.y,u:p.u,v:p.v};}),left=Math.max(clip.left,Math.min.apply(null,vertices.map(function(p){return p.x;}))),right=Math.min(clip.left+fw,Math.max.apply(null,vertices.map(function(p){return p.x;}))),top=Math.max(clip.top,Math.min.apply(null,vertices.map(function(p){return p.y;}))),bottom=Math.min(clip.top+fh,Math.max.apply(null,vertices.map(function(p){return p.y;})));if(right<=left||bottom<=top)continue;
   var mesh={columns:1,rows:1,width:tw,height:th,radius:baseRadius,vertices:vertices},homography={matrix:matrix,inverse:inversePlane(matrix),width:tw,height:th,radius:baseRadius,columns:1,rows:1},upper=vertices.slice(0,2),lower=vertices.slice(2),polygon=upper.concat(lower.slice().reverse()),q=blur*Math.pow(z,1.2),depth=-distance,t={stackIndex:stackIndex,copy:Math.floor(stackIndex/total),distance:distance,normalizedDepth:z,projectionScale:scale,angle:offset.rotation,center:{x:cx,y:cy},depth:depth,alpha:alpha,shade:1,mesh:mesh,homography:homography,upper:upper,lower:lower,polygon:polygon,shadowPolygon:polygon,planeClipRadius:baseRadius,blur:q>.3?+q.toFixed(2):0,shadowStrength:scale,rounded:{cx:cx,cy:cy,width:tw,height:th,radius:baseRadius,angle:offset.rotation,scaleX:scale,scaleY:scale},left:left,top:top,width:right-left,height:bottom-top},card=cards[slot];
   card.instances.push(t);card.depth=Math.max(card.instances.length===1?depth:card.depth,depth);card.alpha=Math.max(card.alpha,alpha);card.visible=true;if(card.instances.length===1){card.left=left;card.top=top;card.width=right-left;card.height=bottom-top;card.upper=upper;card.lower=lower;}else{var farX=Math.max(card.left+card.width,right),farY=Math.max(card.top+card.height,bottom);card.left=Math.min(card.left,left);card.top=Math.min(card.top,top);card.width=farX-card.left;card.height=farY-card.top;}
  }
  return cards;
 }

 function gridStripLayout(width,height,fw,fh,c,progress,imageRatio,scroll){
  var unit=Math.min(fw,fh)/100,pad=unit*c.padding,gap=unit*c.gridGap,clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},cw=fw-2*pad,ch=fh-2*pad,tw=(cw-2*gap)/3,th=(ch-2*gap)/3,ratio=c.cardRatio==='auto'?Math.max(.25,Math.min(4,+imageRatio||1)):ratios[c.cardRatio]||1;
  if(c.cardRatio!=='frame'){tw=Math.min(tw,th*ratio);th=tw/ratio;}
  var gx=clip.left+pad+(cw-(3*tw+2*gap))/2,gy=clip.top+pad+(ch-(3*th+2*gap))/2,fit=Math.min(cw/(tw*c.zoom),ch/(th*c.zoom),1),zw=tw*c.zoom*fit,zh=th*c.zoom*fit,vertical=c.direction==='vertical',step=(vertical?zh:zw)+gap*c.zoom*fit,period=9*step,center=c.focusMode==='center',first=center?4:0,segments=center?9:8,cycle=(phase(progress,c,scroll)%1+1)%1,blend=0,position=first,cards=[];
  function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
  function range(t,a,b){return Math.max(0,Math.min(1,(t-a)/(b-a)));}
  if(cycle<.08){}else if(cycle<.24)blend=ease(range(cycle,.08,.24));else if(cycle<.78){blend=1;var travel=range(cycle,.24,.78);if(c.movement==='stepped'){var at=travel*segments,index=Math.min(Math.floor(at),segments-1);position+=index+ease(range(at-index,.35,1));}else position+=ease(travel)*segments;}else{blend=1-ease(range(cycle,.78,1));position+=segments;}
  var focused=((Math.round(position)%9)+9)%9,transition=blend>.001&&blend<.999;
  for(var slot=0;slot<9;slot++){
   var grid={x:gx+slot%3*(tw+gap),y:gy+Math.floor(slot/3)*(th+gap),w:tw,h:th},delta=(slot-position)*step;if(center)delta-=period*Math.round(delta/period);
   var strip=vertical?{x:width/2-zw/2,y:height/2+delta-zh/2,w:zw,h:zh}:{x:width/2+delta-zw/2,y:height/2-zh/2,w:zw,h:zh},card={slot:slot,depth:slot*2,alpha:0,visible:false,instances:[],left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],textureWidth:tw,textureHeight:th,corner:0,clip:clip,zoomBlend:blend,stripPosition:position,focusedSlot:focused};cards.push(card);
   function add(rect,alpha,role,copy){
    if(alpha<=.004||(vertical?(rect.y+rect.h<clip.top||rect.y>clip.top+fh):(rect.x+rect.w<clip.left||rect.x>clip.left+fw)))return;
    var left=Math.max(clip.left,rect.x),top=Math.max(clip.top,rect.y),right=Math.min(clip.left+fw,rect.x+rect.w),bottom=Math.min(clip.top+fh,rect.y+rect.h);if(right<=left||bottom<=top)return;
    var scale=rect.w/tw,radius=Math.min(unit*c.cornerRadius,rect.w/2,rect.h/2),matrix=[scale,0,rect.x,0,scale,rect.y,0,0,1],homography={matrix:matrix,inverse:inversePlane(matrix),width:tw,height:th,radius:radius/scale,columns:1,rows:1},vertices=[{x:rect.x,y:rect.y,u:0,v:0},{x:rect.x+rect.w,y:rect.y,u:1,v:0},{x:rect.x,y:rect.y+rect.h,u:0,v:1},{x:rect.x+rect.w,y:rect.y+rect.h,u:1,v:1}],mesh={columns:1,rows:1,width:tw,height:th,radius:radius/scale,vertices:vertices},upper=vertices.slice(0,2),lower=vertices.slice(2),polygon=upper.concat(lower.slice().reverse()),depth=slot*2+copy,t={role:role,copy:copy,center:{x:rect.x+rect.w/2,y:rect.y+rect.h/2},depth:depth,alpha:alpha,shade:1,mesh:mesh,homography:homography,upper:upper,lower:lower,polygon:polygon,shadowPolygon:polygon,clipRounded:{x:rect.x,y:rect.y,width:rect.w,height:rect.h,radius:radius},rounded:{cx:rect.x+rect.w/2,cy:rect.y+rect.h/2,width:rect.w,height:rect.h,radius:radius,angle:0},left:left,top:top,width:right-left,height:bottom-top};
    card.instances.push(t);card.depth=depth;card.alpha=Math.max(card.alpha,alpha);card.visible=true;if(card.instances.length===1){card.left=left;card.top=top;card.width=right-left;card.height=bottom-top;card.upper=upper;card.lower=lower;}else{var farX=Math.max(card.left+card.width,right),farY=Math.max(card.top+card.height,bottom);card.left=Math.min(card.left,left);card.top=Math.min(card.top,top);card.width=farX-card.left;card.height=farY-card.top;}
   }
   if(c.fade&&transition&&slot!==focused){add(grid,1-blend,'grid',0);add(strip,blend,'strip',1);}else add({x:grid.x+(strip.x-grid.x)*blend,y:grid.y+(strip.y-grid.y)*blend,w:tw+(zw-tw)*blend,h:th+(zh-th)*blend},1,'morph',0);
  }
  return cards;
 }

 function marqueeLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(4,Math.min(20,Math.round(count)||10)),unit=Math.min(fw,fh)/100,pad=unit*c.padding,clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},content={left:clip.left+pad,top:clip.top+pad,width:fw-2*pad,height:fh-2*pad},gap=unit*c.gap,ratio=c.cardRatio==='auto'?Math.max(.25,Math.min(4,+imageRatio||1)):ratios[c.cardRatio]||1,bigH=Math.min(content.height,unit*c.size),smallH=Math.max(1,(bigH-gap)/2),bigW=bigH*ratio,smallW=smallH*ratio,bandTop=content.top+(content.height-bigH)/2,offsetX=unit*c.offsetX,offsetY=unit*c.offsetY,cycle=(phase(progress,c,scroll)%1+1)%1,patterns={1:['big','pair','big','top','pair','bot','big','pair','big','bot'],2:['pair','big','top','big','pair','bot','big','top','pair','big'],3:['big','top','pair','big','bot','pair','top','big','pair','big']},pattern=patterns[c.variant]||patterns[1],columns=[],used=0,span=0,cards=[];
  for(var index=0;used<total;index++){var kind=pattern[index%pattern.length];if(kind==='pair'&&total-used<2)kind='top';var cells=kind==='pair'?[used,used+1]:[used],w=kind==='big'?bigW:smallW;columns.push({kind:kind,x:span,width:w,cells:cells});used+=cells.length;span+=w+gap;}
  for(var slot=0;slot<total;slot++)cards.push({slot:slot,depth:0,alpha:0,visible:false,instances:[],left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],clip:clip,cycleWidth:span});
  columns.forEach(function(column,columnIndex){column.cells.forEach(function(slot,cell){var card=cards[slot],height=column.kind==='big'?bigH:smallH;card.textureWidth=column.width;card.textureHeight=height;card.corner=Math.min(unit*c.cornerRadius,column.width/2,height/2);card.layoutKind=column.kind;card.columnIndex=columnIndex;card.cell=cell;});});
  var repeats=Math.ceil(content.width/span)+2,shift=(c.direction==='right'?1:-1)*cycle*span;
  for(var copy=-1;copy<=repeats;copy++)columns.forEach(function(column,columnIndex){var baseX=content.left+column.x+copy*span+shift;if(baseX>content.left+content.width+bigW||baseX+column.width<content.left-bigW)return;
   column.cells.forEach(function(slot,cell){var card=cards[slot],tw=card.textureWidth,th=card.textureHeight,x=baseX+offsetX,y=bandTop+offsetY+((column.kind==='bot'||column.kind==='pair'&&cell===1)?bigH-smallH:0),left=Math.max(clip.left,x),right=Math.min(clip.left+fw,x+tw),top=Math.max(clip.top,y),bottom=Math.min(clip.top+fh,y+th);if(right<=left||bottom<=top)return;
    var matrix=[1,0,x,0,1,y,0,0,1],homography={matrix:matrix,inverse:inversePlane(matrix),width:tw,height:th,radius:card.corner,columns:1,rows:1},vertices=[{x:x,y:y,u:0,v:0},{x:x+tw,y:y,u:1,v:0},{x:x,y:y+th,u:0,v:1},{x:x+tw,y:y+th,u:1,v:1}],mesh={columns:1,rows:1,width:tw,height:th,radius:card.corner,vertices:vertices},upper=vertices.slice(0,2),lower=vertices.slice(2),polygon=upper.concat(lower.slice().reverse()),depth=copy*total+slot,t={copy:copy,columnIndex:columnIndex,layoutKind:column.kind,cell:cell,center:{x:x+tw/2,y:y+th/2},depth:depth,alpha:1,shade:1,mesh:mesh,homography:homography,upper:upper,lower:lower,polygon:polygon,shadowPolygon:polygon,left:left,top:top,width:right-left,height:bottom-top};
    card.instances.push(t);card.depth=card.instances.length===1?depth:Math.max(card.depth,depth);card.alpha=1;card.visible=true;if(card.instances.length===1){card.left=left;card.top=top;card.width=right-left;card.height=bottom-top;card.upper=upper;card.lower=lower;}else{var farX=Math.max(card.left+card.width,right),farY=Math.max(card.top+card.height,bottom);card.left=Math.min(card.left,left);card.top=Math.min(card.top,top);card.width=farX-card.left;card.height=farY-card.top;}
   });
  });
  return cards;
 }
 function orbitGlobeLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(4,Math.min(30,Math.round(count)||12)),unit=Math.min(fw,fh)/100,clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},rad=unit*c.globeSize,tw=unit*c.cardSize,ratio=c.cardRatio==='auto'?Math.max(.25,Math.min(4,+imageRatio||1)):ratios[c.cardRatio]||1,th=tw/ratio,corner=Math.min(unit*c.cornerRadius,tw/2,th/2),gap=unit*c.gap,step=(th+gap)/rad,rowMax=Math.max(1,Math.floor(1.15/step)),rows=rowMax*2+1,stride=Math.max(1,Math.round(total/rows)),focal=rad*1.5,cx=width/2,cy=height/2,cycle=(phase(progress,c,scroll)%1+1)%1,waypoints=c.motion==='waypoints',yaw=0,pitch=0,stopIndex=0,angle=c.tilt*Math.PI/180,co=Math.cos(angle),si=Math.sin(angle),cards=[],order=0;
  if(waypoints){var stops=[[0,0],[60,-22],[-70,16],[150,-18],[-55,26]],at=cycle*stops.length;if(Math.abs(at-Math.round(at))<1e-10)at=Math.round(at);stopIndex=Math.min(stops.length-1,Math.floor(at));var local=at-stopIndex,t=Math.max(0,Math.min(1,(local-.18)/.64)),blend=t*t*(3-2*t),a=stops[stopIndex],b=stops[(stopIndex+1)%stops.length];yaw=(a[0]+(b[0]-a[0])*blend)*Math.PI/180;pitch=(a[1]+(b[1]-a[1])*blend)*Math.PI/180;}
  var cw=Math.cos(yaw),sw=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
  for(var slot=0;slot<total;slot++)cards.push({slot:slot,depth:0,alpha:0,visible:false,instances:[],left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],textureWidth:tw,textureHeight:th,corner:corner,clip:clip,stopIndex:stopIndex,cameraYaw:yaw,cameraPitch:pitch});
  for(var row=-rowMax;row<=rowMax;row++){var rowIndex=row+rowMax,lat=row*step,cl=Math.cos(lat),sl=Math.sin(lat),columns=Math.max(3,Math.round(2*Math.PI*rad*cl/(tw+gap))),direction=c.direction==='left'?1:c.direction==='right'||rowIndex%2?-1:1;
   for(var column=0;column<columns;column++){var longitude=rowIndex*.37+2*Math.PI*column/columns,lon=longitude+(waypoints?0:direction*2*Math.PI*cycle),x,y,z;if(waypoints){var ox=cl*Math.sin(longitude),oy=sl,oz=cl*Math.cos(longitude),rx=ox*cw+oz*sw,rz=-ox*sw+oz*cw;x=rx;y=oy*cp-rz*sp;z=oy*sp+rz*cp;}else{x=Math.sin(lon)*cl;y=sl;z=Math.cos(lon)*cl;}
    var den=focal+rad*(1-z),lens=focal/den,dx=rad*x*lens,dy=-rad*y*lens,center={x:cx+dx*co-dy*si,y:cy+dx*si+dy*co},alpha=1-c.backFade/100*(1-z)/2,matrix=[lens,0,center.x-tw*lens/2,0,lens,center.y-th*lens/2,0,0,1],homography={matrix:matrix,inverse:inversePlane(matrix),width:tw,height:th,radius:corner,columns:1,rows:1},mesh={columns:1,rows:1,width:tw,height:th,radius:corner,vertices:[]};
    for(var v=0;v<=1;v++)for(var u=0;u<=1;u++)mesh.vertices.push({x:center.x+(u-.5)*tw*lens,y:center.y+(v-.5)*th*lens,u:u,v:v});
    var vertices=mesh.vertices,left=Math.max(clip.left,vertices[0].x),right=Math.min(clip.left+fw,vertices[1].x),top=Math.max(clip.top,vertices[0].y),bottom=Math.min(clip.top+fh,vertices[2].y);if(right<=left||bottom<=top)continue;
    var upper=vertices.slice(0,2),lower=vertices.slice(2),polygon=upper.concat(lower.slice().reverse()),depth=-den+(order++)*1e-9,tile={row:row,column:column,rowIndex:rowIndex,longitude:lon,latitude:lat,normalDepth:z,scale:lens,center:center,depth:depth,alpha:alpha,shade:1,mesh:mesh,homography:homography,upper:upper,lower:lower,polygon:polygon,shadowPolygon:polygon,left:left,top:top,width:right-left,height:bottom-top},index=((column+rowIndex*stride)%total+total)%total,card=cards[index];card.instances.push(tile);card.depth=card.instances.length===1?depth:Math.max(card.depth,depth);card.alpha=1;card.visible=true;
    if(card.instances.length===1){card.left=left;card.top=top;card.width=right-left;card.height=bottom-top;card.upper=upper;card.lower=lower;}else{var farX=Math.max(card.left+card.width,right),farY=Math.max(card.top+card.height,bottom);card.left=Math.min(card.left,left);card.top=Math.min(card.top,top);card.width=farX-card.left;card.height=farY-card.top;}
   }
  }
  return cards;
 }
 function globeLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(4,Math.min(30,Math.round(count)||12)),unit=Math.min(fw,fh)/100,clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},rad=unit*c.globeSize,tw=unit*c.cardSize,ratio=c.cardRatio==='auto'?Math.max(.25,Math.min(4,+imageRatio||1)):ratios[c.cardRatio]||16/9,th=tw/ratio,corner=Math.min(unit*c.cornerRadius,tw/2,th/2),gap=unit*c.gap,step=(th+gap)/rad,rowMax=Math.max(1,Math.floor(1.15/step)),rows=rowMax*2+1,stride=Math.max(1,Math.round(total/rows)),focal=rad*1.5,cx=width/2,cy=height/2,cycle=(phase(progress,c,scroll)%1+1)%1,waypoints=c.motion!=='continuous',yaw=0,pitch=0,zoom=1,envelope=0,stopIndex=0,angle=c.tilt*Math.PI/180,co=Math.cos(angle),si=Math.sin(angle),cards=[],order=0;
  function wrap(n){return(n%total+total)%total;}
  function columns(lat){return Math.max(3,Math.round(2*Math.PI*rad*Math.cos(lat)/(tw+gap)));}
  function shortest(a){return a-2*Math.PI*Math.round(a/(2*Math.PI));}
  if(waypoints){var seed=6221143;function random(){seed|=0;seed=seed+1831565813|0;var n=Math.imul(seed^seed>>>15,1|seed);n=n+Math.imul(n^n>>>7,61|n)^n;return((n^n>>>14)>>>0)/4294967296;}var slots=Array.from({length:total},function(_,i){return i;});for(var i=total-1;i>0;i--){var j=Math.floor(random()*(i+1)),temp=slots[i];slots[i]=slots[j];slots[j]=temp;}var stops=[],extent=Math.min(rowMax,2);for(var i=0;i<c.stops;i++){var target=slots[i%total],row=Math.floor(random()*(2*extent+1))-extent,lat=row*step,count=columns(lat),column=wrap(target-(row+rowMax)*stride)%count,phi=-((row+rowMax)*.37+2*Math.PI*column/count),previous=i?stops[i-1].phi:phi;stops.push({phi:previous+shortest(phi-previous),lat:lat});}stops.push({phi:stops[c.stops-1].phi+shortest(stops[0].phi-stops[c.stops-1].phi),lat:stops[0].lat});var at=cycle*c.stops;if(Math.abs(at-Math.round(at))<1e-10)at=Math.round(at);stopIndex=Math.min(c.stops-1,Math.floor(at));var local=at-stopIndex,t=Math.max(0,Math.min(1,(local-.16)/.68)),blend=t*t*(3-2*t),a=stops[stopIndex],b=stops[stopIndex+1];yaw=a.phi+(b.phi-a.phi)*blend;pitch=a.lat+(b.lat-a.lat)*blend;envelope=1-Math.sin(Math.PI*t);zoom=1+((c.motion==='waypoints-move'?1:c.zoom)-1)*envelope;}
  var cp=Math.cos(pitch),sp=Math.sin(pitch),focusRange=(tw+gap)/rad*1.6;
  function finalPoint(x,y,u,v){var dx=(x-cx)*zoom,dy=(y-cy)*zoom;return{x:cx+dx*co-dy*si,y:cy+dx*si+dy*co,u:u,v:v};}
  function projected(lon,lat,u,v){var cl=Math.cos(lon),sl=Math.sin(lon),ct=Math.cos(lat),st=Math.sin(lat),x=rad*sl*ct,y=rad*(st*cp-cl*ct*sp),z=rad*(st*sp+cl*ct*cp),den=focal+rad-z,lens=focal/den,p=finalPoint(cx+x*lens,cy-y*lens,u,v);return{point:p,x:x,y:y,z:z,den:den,lens:lens};}
  function tangent(e,p){var x=p.lens*(e.x+p.x*e.z/p.den)*zoom,y=-p.lens*(e.y+p.y*e.z/p.den)*zoom;return{x:x*co-y*si,y:x*si+y*co};}
  for(var slot=0;slot<total;slot++)cards.push({slot:slot,depth:0,alpha:0,visible:false,instances:[],left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],textureWidth:tw,textureHeight:th,corner:corner,clip:clip,zoom:zoom,envelope:envelope,stopIndex:stopIndex,cameraYaw:yaw,cameraPitch:pitch});
  for(var row=-rowMax;row<=rowMax;row++){var rowIndex=row+rowMax,lat=row*step,count=columns(lat),direction=c.direction==='left'?1:c.direction==='right'||rowIndex%2?-1:1,rotation=(waypoints?yaw:direction*2*Math.PI*cycle)+rowIndex*.37;
   for(var column=0;column<count;column++){var lon=rotation+2*Math.PI*column/count,p=projected(lon,lat,.5,.5),normal=p.z/rad,alpha=1-c.backFade/100*(1-normal)/2;if(waypoints&&c.focusStyle==='spotlight'){var weight=Math.max(0,1-Math.hypot(shortest(lon),lat-pitch)/focusRange);alpha*=1-envelope*(1-weight);}if(alpha<=.01)continue;
    var mesh={columns:waypoints?1:Math.min(12,Math.max(4,Math.round(tw*p.lens/32))),rows:waypoints?1:Math.min(9,Math.max(3,Math.round(th*p.lens/32))),width:tw,height:th,radius:corner,vertices:[]},homography=null;
    if(waypoints){var cl=Math.cos(lon),sl=Math.sin(lon),ct=Math.cos(lat),st=Math.sin(lat),tx=tangent({x:cl,y:sl*sp,z:-sl*cp},p),ty=tangent({x:sl*st,y:-ct*cp-cl*st*sp,z:-ct*sp+cl*st*cp},p),matrix=[tx.x,ty.x,p.point.x-tx.x*tw/2-ty.x*th/2,tx.y,ty.y,p.point.y-tx.y*tw/2-ty.y*th/2,0,0,1],inverse=inversePlane(matrix);if(!inverse)continue;homography={matrix:matrix,inverse:inverse,width:tw,height:th,radius:corner,columns:1,rows:1};}
    for(var y=0;y<=mesh.rows;y++)for(var x=0;x<=mesh.columns;x++){var u=x/mesh.columns,v=y/mesh.rows,point;if(waypoints){point=projectPlane(homography.matrix,u*tw,v*th);point.u=u;point.v=v;}else{var latitude=lat-(v-.5)*th/rad,cosine=Math.cos(latitude);if(Math.abs(cosine)<1e-6)cosine=cosine<0?-1e-6:1e-6;point=projected(lon+(u-.5)*tw/(rad*cosine),latitude,u,v).point;}mesh.vertices.push(point);}
    var vertices=mesh.vertices,left=Math.max(clip.left,Math.min.apply(null,vertices.map(function(v){return v.x;}))),right=Math.min(clip.left+fw,Math.max.apply(null,vertices.map(function(v){return v.x;}))),top=Math.max(clip.top,Math.min.apply(null,vertices.map(function(v){return v.y;}))),bottom=Math.min(clip.top+fh,Math.max.apply(null,vertices.map(function(v){return v.y;})));if(right<=left||bottom<=top)continue;
    var upper=vertices.slice(0,mesh.columns+1),lower=vertices.slice(mesh.rows*(mesh.columns+1)),boundary=upper.slice();for(var y=1;y<=mesh.rows;y++)boundary.push(vertices[y*(mesh.columns+1)+mesh.columns]);for(var x=mesh.columns-1;x>=0;x--)boundary.push(vertices[mesh.rows*(mesh.columns+1)+x]);for(var y=mesh.rows-1;y>0;y--)boundary.push(vertices[y*(mesh.columns+1)]);
    var depth=-p.den+(order++)*1e-9,t={row:row,column:column,rowIndex:rowIndex,longitude:lon,latitude:lat,normalDepth:normal,center:p.point,depth:depth,alpha:alpha,shade:1,mesh:mesh,homography:homography,upper:upper,lower:lower,polygon:boundary,shadowPolygon:boundary,left:left,top:top,width:right-left,height:bottom-top},card=cards[wrap(column+rowIndex*stride)];card.instances.push(t);card.depth=card.instances.length===1?depth:Math.max(card.depth,depth);card.alpha=1;card.visible=true;
    if(card.instances.length===1){card.left=left;card.top=top;card.width=right-left;card.height=bottom-top;card.upper=upper;card.lower=lower;}else{var farX=Math.max(card.left+card.width,right),farY=Math.max(card.top+card.height,bottom);card.left=Math.min(card.left,left);card.top=Math.min(card.top,top);card.width=farX-card.left;card.height=farY-card.top;}
   }
  }
  return cards;
 }
 function vortexLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(4,Math.min(16,Math.round(count)||8)),unit=Math.min(fw,fh)/100,clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},radius=unit*c.ringSize,tw=unit*c.cardSize,ratio=c.cardRatio==='auto'?Math.max(.25,Math.min(4,+imageRatio||1)):ratios[c.cardRatio]||16/9,th=tw/ratio,corner=Math.min(unit*c.cornerRadius,tw/2,th/2),cx=width/2+unit*c.offsetX,cy=height/2+unit*c.offsetY,focal=Math.min(fw,fh)*1.2,separation=focal*c.depth/100*.7,stride=Math.max(1,Math.round(total/c.rings)),cycle=(phase(progress,c,scroll)%1+1)%1,curved=c.cardStyle!=='flat',cards=[];
  for(var slot=0;slot<total;slot++)cards.push({slot:slot,depth:0,alpha:0,visible:false,instances:[],left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],textureWidth:tw,textureHeight:th,corner:corner,clip:clip});
  for(var ring=c.rings-1;ring>=0;ring--){var scale=focal/(focal+ring*separation),direction=c.direction==='cw'?1:c.direction==='ccw'||ring%2?-1:1,spin=2*Math.PI*cycle*direction+ring*Math.PI/total,atten=1-c.backFade/100*ring/(c.rings-1),columns=curved?Math.min(30,Math.max(8,Math.round(tw*scale/8))):1;
   for(var index=0;index<total;index++){var slot=(index+ring*stride)%total,angle=spin+2*Math.PI*index/total,co=Math.cos(angle),si=Math.sin(angle),center={x:cx+co*radius*scale,y:cy+si*radius*scale},mesh={columns:columns,rows:1,width:tw,height:th,radius:corner,vertices:[]},homography=null;
    if(!curved){var matrix=[-si*scale,-co*scale,center.x+si*scale*tw/2+co*scale*th/2,co*scale,-si*scale,center.y-co*scale*tw/2+si*scale*th/2,0,0,1];homography={matrix:matrix,inverse:inversePlane(matrix),width:tw,height:th,radius:corner,columns:1,rows:1};}
    for(var y=0;y<=1;y++)for(var x=0;x<=columns;x++){var u=x/columns,v=y,p;if(curved){var theta=angle+(u-.5)*tw/radius,r=radius-(v-.5)*th;p={x:cx+Math.cos(theta)*r*scale,y:cy+Math.sin(theta)*r*scale};}else p=projectPlane(homography.matrix,u*tw,v*th);p.u=u;p.v=v;mesh.vertices.push(p);}
    var vertices=mesh.vertices,left=Math.max(clip.left,Math.min.apply(null,vertices.map(function(p){return p.x;}))),right=Math.min(clip.left+fw,Math.max.apply(null,vertices.map(function(p){return p.x;}))),top=Math.max(clip.top,Math.min.apply(null,vertices.map(function(p){return p.y;}))),bottom=Math.min(clip.top+fh,Math.max.apply(null,vertices.map(function(p){return p.y;})));if(right<=left||bottom<=top)continue;
    var upper=vertices.slice(0,columns+1),lower=vertices.slice(columns+1),polygon=upper.concat(lower.slice().reverse()),depth=-ring*1000+index,t={ring:ring,index:index,angle:angle,scale:scale,center:center,depth:depth,alpha:curved?1:atten,shade:curved?atten:1,mesh:mesh,homography:homography,upper:upper,lower:lower,polygon:polygon,shadowPolygon:polygon,left:left,top:top,width:right-left,height:bottom-top},card=cards[slot];card.instances.push(t);card.depth=card.instances.length===1?depth:Math.max(card.depth,depth);card.alpha=1;card.visible=true;
    if(card.instances.length===1){card.left=left;card.top=top;card.width=right-left;card.height=bottom-top;card.upper=upper;card.lower=lower;}else{var farX=Math.max(card.left+card.width,right),farY=Math.max(card.top+card.height,bottom);card.left=Math.min(card.left,left);card.top=Math.min(card.top,top);card.width=farX-card.left;card.height=farY-card.top;}
   }
  }
  return cards;
 }
 function sphereLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var scattered=c.kind==='parallax-totem',drum=scattered||c.kind==='totem-wall',vertical=drum||c.kind==='sphere-cascade',total=Math.max(4,Math.min(30,Math.round(count)||8)),unit=Math.min(fw,fh)/100,pad=unit*c.padding,clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},columns=100/c.zoom,gap=unit*c.gap,tw=Math.max(2,(fw-2*pad-(columns-1)*gap)/columns),ratio=c.cardRatio==='auto'?Math.max(.25,Math.min(4,+imageRatio||1)):ratios[c.cardRatio]||16/9,th=tw/ratio,corner=Math.min(unit*c.cornerRadius,tw/2,th/2),rad=Math.min(fw,fh)*110/Math.max(5,Math.abs(c.curvature)),sign=c.curvature<0?-1:1,wx=(tw+gap)/rad,wy=(th+gap)/rad,focal=rad*1.5,cx=width/2,cy=height/2,angle=c.tilt*Math.PI/180,co=Math.cos(angle),si=Math.sin(angle),maxX=c.tilt?Math.hypot(fw,fh)/2:fw/2,maxY=c.tilt?Math.hypot(fw,fh)/2:fh/2,rowMax=Math.ceil(vertical?(maxX+tw)/(tw+gap):(maxY+th)/(th+gap)),colMax=Math.ceil(Math.PI*.45/(vertical?wy:wx)),stride=Math.max(2,Math.round(total/4)),cycle=(phase(progress,c,scroll)%1+1)%1,waypoints=!drum&&c.motion!=='continuous',shift=0,yaw=0,zoom=1,envelope=0,stopIndex=0,cards=[],order=0;
  function wrap(n){return(n%total+total)%total;}
  function seeded(seed){return function(){seed|=0;seed=seed+1831565813|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  function smooth(t){t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);}
  if(waypoints){var seed=6221143;function rng(){seed|=0;seed=seed+1831565813|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}var slots=Array.from({length:total},function(_,i){return i;});for(var i=total-1;i>0;i--){var j=Math.floor(rng()*(i+1)),tmp=slots[i];slots[i]=slots[j];slots[j]=tmp;}var stops=[];for(var i=0;i<c.stops;i++){var fix=Math.floor(rng()*columns)-Math.floor(columns/2),move=wrap(slots[i%total]-fix*stride);if(move>total/2)move-=total;stops.push({move:move,fix:fix,slot:slots[i%total]});}var at=cycle*c.stops;if(Math.abs(at-Math.round(at))<1e-10)at=Math.round(at)%c.stops;stopIndex=Math.floor(at);var local=at-stopIndex,t=Math.max(0,Math.min(1,(local-.16)/.68)),blend=smooth(t),a=stops[stopIndex],b=stops[(stopIndex+1)%c.stops];shift=(a.move+(b.move-a.move)*blend)*(vertical?wy:wx);yaw=(a.fix+(b.fix-a.fix)*blend)*(vertical?wx:wy);envelope=1-Math.sin(Math.PI*t);zoom=1+((c.motion==='waypoints-move'?1:c.focusZoom)-1)*envelope;}
  function rotate(n){return vertical?{x:n.x*Math.cos(yaw)-n.z*Math.sin(yaw),y:n.y,z:n.x*Math.sin(yaw)+n.z*Math.cos(yaw)}:{x:n.x,y:n.y*Math.cos(yaw)-n.z*Math.sin(yaw),z:n.y*Math.sin(yaw)+n.z*Math.cos(yaw)};}
  function finalPoint(x,y,u,v){x=(x-cx)*zoom;y=(y-cy)*zoom;return{x:cx+x*co-y*si,y:cy+x*si+y*co,u:u,v:v};}
  function project(lon,lat,u,v,zOffset){var n=rotate({x:drum?0:Math.sin(lon)*Math.cos(lat),y:Math.sin(lat),z:(drum?1:Math.cos(lon))*Math.cos(lat)}),den=focal+sign*rad*(1-n.z)+(zOffset||0);if(den<=rad*.08)return null;var p=finalPoint(cx+rad*(drum?lon:n.x)*focal/den,cy-rad*n.y*focal/den,u,v);return Math.max(Math.abs(p.x-cx),Math.abs(p.y-cy))>Math.max(fw,fh)*10?null:p;}
  for(var slot=0;slot<total;slot++)cards.push({slot:slot,alpha:0,visible:false,depth:0,left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],instances:[],textureWidth:tw,textureHeight:th,corner:corner,clip:clip,zoom:zoom,stopIndex:stopIndex,envelope:envelope});
  for(var row=-rowMax;row<=rowMax;row++){var rowDirection=c.direction==='alternate'?((row%2+2)%2?-1:1):vertical?(c.direction==='up'?-1:1):c.direction==='left'?1:-1,F=waypoints?shift:rowDirection*cycle*(vertical?wy:wx)*total,centerCol=Math.round(F/(vertical?wy:wx));for(var col=centerCol-colMax;col<=centerCol+colMax;col++){
   var sourceRow=vertical?col:row,sourceCol=vertical?row:col,lon=sourceCol*wx-(vertical?0:F),lat=sourceRow*wy-(vertical?F:0),size=1,zOffset=0,dim=1,layer=0,priority=0;if(scattered){var random=seeded((wrap(sourceRow)+1)*7919+(sourceCol+4096)*131);lon+=(random()-.5)*wx*c.scatter/100;lat+=(random()-.5)*wy*c.scatter/100;size=1+(random()-.5)*2*c.sizeVar/100;layer=Math.floor(random()*3);zOffset=layer*c.parallax/100*rad*.4;dim=1-layer*.22*c.parallax/100;priority=random();}var tileWidth=tw*size,tileHeight=th*size,n=rotate({x:drum?0:Math.sin(lon)*Math.cos(lat),y:Math.sin(lat),z:(drum?1:Math.cos(lon))*Math.cos(lat)});if(n.z<.15)continue;if(!waypoints&&(Math.abs(rad*(drum?lon:Math.sin(lon)))>maxX+tileWidth*1.5||Math.abs(rad*Math.sin(lat))>maxY+tileHeight*1.5))continue;
   var den=focal+sign*rad*(1-n.z)+zOffset,lens=focal/den,center=finalPoint(cx+rad*(drum?lon:n.x)*lens,cy-rad*n.y*lens,.5,.5),atten=1-c.edgeFade/100*Math.pow(Math.max(0,1-(n.z-.15)/.85),.65);atten*=dim;if(waypoints&&c.focusStyle==='spotlight'){var weight=Math.max(0,1-Math.hypot(lon-(vertical?yaw:0),lat-(vertical?0:yaw))/(Math.max(wx,wy)*1.6));atten*=1-envelope*(1-weight);}if(atten<=.003)continue;
   var mesh={columns:waypoints?1:Math.min(64,Math.max(8,Math.round(Math.max(tileWidth/24,tileWidth/(rad*(drum?1:Math.max(.2,Math.cos(lat))))/.02)))),rows:waypoints?1:Math.min(48,Math.max(6,Math.round(Math.max(tileHeight/24,tileHeight/rad/.02)))),width:tileWidth,height:tileHeight,radius:corner*size,vertices:[]},homography=null;
   if(waypoints){var e1=rotate({x:Math.cos(lon),y:0,z:-Math.sin(lon)}),e2=rotate({x:Math.sin(lon)*Math.sin(lat),y:-Math.cos(lat),z:Math.cos(lon)*Math.sin(lat)});function tangent(e){var x=lens*(e.x+rad*n.x*sign*e.z/den)*zoom,y=-lens*(e.y+rad*n.y*sign*e.z/den)*zoom;return{x:x*co-y*si,y:x*si+y*co};}var tx=tangent(e1),ty=tangent(e2),matrix=[tx.x,ty.x,center.x-tx.x*tw/2-ty.x*th/2,tx.y,ty.y,center.y-tx.y*tw/2-ty.y*th/2,0,0,1],inverse=inversePlane(matrix);if(!inverse)continue;homography={matrix:matrix,inverse:inverse,width:tw,height:th,radius:corner,columns:1,rows:1};}
   for(var y=0;y<=mesh.rows;y++)for(var x=0;x<=mesh.columns;x++){var u=x/mesh.columns,v=y/mesh.rows,p;if(waypoints){p=projectPlane(homography.matrix,u*tw,v*th);p.u=u;p.v=v;}else{var latitude=lat-(v-.5)*tileHeight/rad,longitude=lon+(u-.5)*tileWidth/(rad*(drum?1:Math.max(.08,Math.cos(latitude))));p=project(longitude,latitude,u,v,zOffset);}mesh.vertices.push(p);}
   var valid=mesh.vertices.filter(Boolean);if(valid.length<3)continue;var left=Math.max(clip.left,Math.min.apply(null,valid.map(function(p){return p.x;}))),right=Math.min(clip.left+fw,Math.max.apply(null,valid.map(function(p){return p.x;}))),top=Math.max(clip.top,Math.min.apply(null,valid.map(function(p){return p.y;}))),bottom=Math.min(clip.top+fh,Math.max.apply(null,valid.map(function(p){return p.y;})));if(right<=left||bottom<=top)continue;
   var polygon=[{x:left,y:top},{x:right,y:top},{x:right,y:bottom},{x:left,y:bottom}],boundary=[];for(var x=0;x<=mesh.columns;x++)boundary.push(mesh.vertices[x]);for(var y=1;y<=mesh.rows;y++)boundary.push(mesh.vertices[y*(mesh.columns+1)+mesh.columns]);for(var x=mesh.columns-1;x>=0;x--)boundary.push(mesh.vertices[mesh.rows*(mesh.columns+1)+x]);for(var y=mesh.rows-1;y>0;y--)boundary.push(mesh.vertices[y*(mesh.columns+1)]);boundary=boundary.filter(Boolean);
   var depth=(scattered?-(c.parallax>0?layer*2:0)-priority:-den)+(order++)*1e-9,t={row:sourceRow,column:sourceCol,longitude:lon,latitude:lat,center:center,depth:depth,alpha:waypoints?atten:1,shade:waypoints?1:atten,mesh:mesh,homography:homography,polygon:polygon,shadowPolygon:boundary,left:left,top:top,width:right-left,height:bottom-top},card=cards[wrap(vertical?sourceRow+sourceCol*stride:sourceCol+sourceRow*stride)];if(scattered){t.scale=size;t.zOffset=zOffset;t.layer=layer;t.priority=priority;t.dim=dim;}card.instances.push(t);card.alpha=1;card.visible=true;card.depth=Math.max(card.depth||-Infinity,depth);
  }}
  cards.forEach(function(card){if(!card.visible){card.upper=[{x:clip.left,y:clip.top}];card.lower=card.upper.slice();return;}card.left=Math.min.apply(null,card.instances.map(function(t){return t.left;}));card.top=Math.min.apply(null,card.instances.map(function(t){return t.top;}));card.width=Math.max.apply(null,card.instances.map(function(t){return t.left+t.width;}))-card.left;card.height=Math.max.apply(null,card.instances.map(function(t){return t.top+t.height;}))-card.top;card.upper=[{x:card.left,y:card.top},{x:card.left+card.width,y:card.top}];card.lower=[{x:card.left,y:card.top+card.height},{x:card.left+card.width,y:card.top+card.height}];});return cards;
 }
 function focusSliderLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(4,Math.min(12,Math.round((+count||8)/2)*2)),unit=Math.min(fw,fh)/100,pad=unit*c.padding,clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},maximum=c.centerScale/100,main=Math.min(Math.max(1,fw-2*pad),Math.max(1,fh-2*pad))/maximum*c.cardSize/100,ratio=c.cardRatio==='auto'?Math.max(.25,Math.min(4,+imageRatio||1)):ratios[c.cardRatio]||1,vertical=c.direction==='vertical',cross=vertical?main*ratio:main/ratio,tw=vertical?cross:main,th=vertical?main:cross,corner=Math.min(unit*c.cornerRadius,tw/2,th/2),pitch=main*(maximum+1)/2+unit*c.gap,length=pitch*total,cycle=(phase(progress,c,scroll)%1+1)%1,at=cycle*total;
  if(Math.abs(at-Math.round(at))<1e-10)at=Math.round(at)%total;
  var index=Math.floor(at),local=at-index,t=Math.max(0,Math.min(1,local/(c.glide/100))),ease=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,step=index+ease,weave=c.weave==='fixed'?1:-Math.cos(Math.PI*step),shift=cross*c.offset/100,baseX=width/2,baseY=height/2,cards=[];
  for(var slot=0;slot<total;slot++){
   var distance=(slot-step)*pitch;distance=(distance%length+length*1.5)%length-length/2;if(Math.abs(distance)<1e-9)distance=0;
   var relative=distance/pitch,focus=Math.max(0,1-Math.abs(relative)),scale=1+(maximum-1)*focus,side=Math.max(-1,Math.min(1,relative)),across=-side*shift*(1-focus)*weave,x=baseX+(vertical?across:distance),y=baseY+(vertical?distance:across),w=tw*scale,h=th*scale,l=x-w/2,r=x+w/2,top=y-h/2,bottom=y+h/2,vl=Math.max(l,clip.left),vr=Math.min(r,clip.left+fw),vt=Math.max(top,clip.top),vb=Math.min(bottom,clip.top+fh),visible=vr>vl&&vb>vt,depth=-Math.abs(distance)+slot*1e-9,upper=[{x:l,y:top},{x:l,y:bottom}],lower=[{x:r,y:top},{x:r,y:bottom}],instance={depth:depth,alpha:1,focus:focus,upper:upper,lower:lower,polygon:[{x:vl,y:vt},{x:vl,y:vb},{x:vr,y:vb},{x:vr,y:vt}],rounded:{cx:x,cy:y,width:tw,height:th,radius:corner,angle:0,scaleX:scale,scaleY:scale},shadowStrength:2*focus};
   cards.push({slot:slot,index:index,local:local,step:step,weave:weave,pitch:pitch,distance:distance,focus:focus,scale:scale,depth:depth,alpha:visible?1:0,visible:visible,left:visible?vl:clip.left,top:visible?vt:clip.top,width:visible?vr-vl:1,height:visible?vb-vt:1,upper:upper,lower:lower,instances:visible?[instance]:[],textureWidth:tw,textureHeight:th,corner:corner,clip:clip});
  }return cards;
 }
 function focusOrbitLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(8,Math.min(28,Math.round(count)||20)),unit=Math.min(fw,fh)/100,pad=unit*c.padding,clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},rad=Math.min(Math.max(1,fw-2*pad),Math.max(1,fh-2*pad))/2*c.ringSize/100,tw=unit*c.cardSize,ratio=ratios[c.cardRatio]||Math.max(.25,Math.min(4,imageRatio||1)),th=tw/ratio,bx=width/2,by=height/2,cycle=(phase(progress,c,scroll)%1+1)%1,travel=0,focus=0,stage='orbit';
  [0,.28,.36,.88,1].some(function(boundary){if(Math.abs(cycle-boundary)<1e-10){cycle=boundary===1?0:boundary;return true;}return false;});
  function ease(t){t=Math.max(0,Math.min(1,t));return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
  if(cycle<.28){var t=cycle/.28;if(c.motion==='pulse'){var mix=Math.max(0,Math.min(1,(t-.6)/.4));mix=mix*mix*(3-2*mix);var pulse=Math.max(0,Math.min(1,t+c.pulse/100/(2*Math.PI)*Math.sin(2*Math.PI*t)));travel=pulse+(ease(t)-pulse)*mix;}else travel=ease(t);}
  else if(cycle<.36){travel=1;focus=ease((cycle-.28)/.08);stage='zoom-in';}
  else if(cycle<.88){var at=(cycle-.36)/.52*c.spinStops,stop=Math.min(c.spinStops-1,Math.floor(at)),local=at-stop;travel=1+(stop+ease(local/.45))/c.spinStops;focus=1;stage='spin';}
  else{travel=2;focus=ease(1-(cycle-.88)/.12);stage='zoom-out';}
  var zoom=1+(c.zoom-1)*focus,centerX=bx,centerY=by-rad*focus,angleY=c.rotateY*Math.PI/180*(c.rotateYScope==='zoom'?focus:1),co=Math.cos(angleY),si=Math.sin(angleY),focal=rad*(5-2.8*c.perspective/100),dir=c.direction==='left'?-1:1,cards=[],order=[];
  for(var slot=0;slot<total;slot++){
   var angle=2*Math.PI*(dir*travel+slot/total),x=Math.sin(angle)*rad,y=-Math.cos(angle)*rad,p=focal/(focal+x*si),signed=(angle%(2*Math.PI)+2*Math.PI)%(2*Math.PI);if(signed>Math.PI)signed-=2*Math.PI;
   var weight=Math.max(0,1-Math.abs(signed)/(2*Math.PI/total)),alpha=c.zoomStyle==='spotlight'?1-focus*(1-weight):1,follow=c.cardFacing==='follow'&&Math.abs(si)>=.001,h,corner=Math.min(tw/2,th/2,unit*c.cornerRadius*.5/(follow?1:p)),ox=bx+zoom*(bx-centerX),oy=by+zoom*(by-centerY);
   if(follow){var x0=x-tw/2,y0=y-th/2,den=focal+x0*si;h=[(ox*si+zoom*focal*co)/focal,0,(ox*den+zoom*focal*x0*co)/focal,oy*si/focal,zoom,(oy*den+zoom*focal*y0)/focal,si/focal,0,den/focal];}
   else{var scale=zoom*p,cx=bx+zoom*(bx+x*co*p-centerX),cy=by+zoom*(by+y*p-centerY);h=[scale,0,cx-tw*scale/2,0,scale,cy-th*scale/2,0,0,1];}
   var card={slot:slot,alpha:alpha,visible:false,depth:0,z:-x*si,signedAngle:signed,weight:weight,focus:focus,zoom:zoom,travel:travel,stage:stage,effectiveRotateY:angleY,follow:follow,left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],instances:[],textureWidth:tw,textureHeight:th,corner:0,clip:clip};cards.push(card);order.push({card:card,y:y});
   var inv=inversePlane(h);if(alpha<=.003||!inv)continue;
   var upper=[projectPlane(h,0,0),projectPlane(h,tw,0)],lower=[projectPlane(h,0,th),projectPlane(h,tw,th)],polygon=upper.concat(lower.slice().reverse()),xs=polygon.map(function(p){return p.x;}),ys=polygon.map(function(p){return p.y;}),minX=Math.min.apply(null,xs),maxX=Math.max.apply(null,xs),minY=Math.min.apply(null,ys),maxY=Math.max.apply(null,ys);if(maxX<=clip.left||minX>=clip.left+fw||maxY<=clip.top||minY>=clip.top+fh)continue;
   var shadowPolygon=[];for(var k=0;k<4;k++){var u=k===0||k===3?tw-corner:corner,v=k<2?th-corner:corner;for(var j=0;j<=12;j++){var a=(k*.5+j/12*.5)*Math.PI;shadowPolygon.push(projectPlane(h,u+Math.cos(a)*corner,v+Math.sin(a)*corner));}}
   var minDen=Math.min(h[8],h[6]*tw+h[8]),columns=Math.max(1,Math.min(32,Math.ceil(Math.abs(h[6])*tw/minDen*32))),margin=unit*3,left=Math.max(clip.left,minX-margin),top=Math.max(clip.top,minY-margin),right=Math.min(clip.left+fw,maxX+margin),bottom=Math.min(clip.top+fh,maxY+margin),plane={matrix:h,inverse:inv,width:tw,height:th,radius:corner,columns:columns,rows:1},instance={alpha:alpha,depth:0,upper:upper,lower:lower,polygon:polygon,homography:plane,shadowPolygon:shadowPolygon,shadowStrength:1.5};
   card.visible=true;card.left=left;card.top=top;card.width=right-left;card.height=bottom-top;card.upper=upper;card.lower=lower;card.instances=[instance];
  }
  order.sort(function(a,b){return a.card.z-b.card.z||a.card.signedAngle-b.card.signedAngle;});if(c.zoomStyle==='spotlight'&&focus>.01){var front=0;for(var i=1;i<order.length;i++)if(order[i].y<order[front].y)front=i;order.push(order.splice(front,1)[0]);}
  order.forEach(function(q,rank){q.card.depth=rank;q.card.instances.forEach(function(t){t.depth=rank;});});return cards;
 }
 // Each grid tile takes a turn expanding to the padded frame, holding and returning.
 function spotlightLayout(width,height,fw,fh,c,progress,count,scroll){
  var total=Math.max(2,Math.min(9,Math.round(count)||4)),columns=total===2?2:total===3?3:total===4?2:3,rows=Math.ceil(total/columns),unit=Math.min(fw,fh)/100,pad=unit*c.padding,gap=unit*c.gap,clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},content={left:clip.left+pad,top:clip.top+pad,width:Math.max(1,fw-2*pad),height:Math.max(1,fh-2*pad)},tw=Math.max(1,(content.width-gap*(columns-1))/columns),th=Math.max(1,(content.height-gap*(rows-1))/rows),cycle=(phase(progress,c,scroll)%1+1)%1,at=cycle*total;
  if(Math.abs(at-Math.round(at))<1e-10)at=Math.round(at)%total;
  var index=Math.floor(at),local=at-index,t=local<.22?local/.22:local<.78?1:(1-local)/.22;t=Math.max(0,Math.min(1,t));var expansion=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,cards=[];
  for(var slot=0;slot<total;slot++){
   var active=slot===index,amount=active?expansion:0,base={left:content.left+slot%columns*(tw+gap),top:content.top+Math.floor(slot/columns)*(th+gap),width:tw,height:th},rect={left:base.left+(content.left-base.left)*amount,top:base.top+(content.top-base.top)*amount,width:tw+(content.width-tw)*amount,height:th+(content.height-th)*amount},corner=Math.min(unit*c.cornerRadius*(1+.4*amount),rect.width/2,rect.height/2),rounded={cx:rect.left+rect.width/2,cy:rect.top+rect.height/2,width:rect.width,height:rect.height,radius:corner,angle:0,scaleX:1,scaleY:1},alpha=active?1:1-c.dimming/100*expansion,depth=active?100:slot,upper=[{x:rect.left,y:rect.top},{x:rect.left,y:rect.top+rect.height}],lower=[{x:rect.left+rect.width,y:rect.top},{x:rect.left+rect.width,y:rect.top+rect.height}],instance={depth:depth,alpha:alpha,active:active,upper:upper,lower:lower,polygon:[upper[0],upper[1],lower[1],lower[0]],rounded:rounded,panelClip:rounded,imageFrame:rect,zoom:1,panX:0,panY:0,shadowStrength:active?3*expansion:0};
   cards.push({slot:slot,index:index,local:local,active:active,expansion:expansion,base:base,depth:depth,alpha:alpha,visible:true,left:rect.left,top:rect.top,width:rect.width,height:rect.height,upper:upper,lower:lower,instances:[instance],textureWidth:tw,textureHeight:th,corner:0,clip:clip});
  }
  return cards;
 }
 // Three contiguous source columns repeat with counter-flow inside the rounded content window.
 function columnDriftLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(6,Math.min(18,Math.round((+count||12)/3)*3)),rows=total/3,unit=Math.min(fw,fh)/100,pad=unit*c.padding,gap=unit*c.gap,clip={left:(width-fw)/2+pad,top:(height-fh)/2+pad,width:Math.max(1,fw-2*pad),height:Math.max(1,fh-2*pad)},ratio=c.cardRatio==='auto'?Math.max(.25,Math.min(4,+imageRatio||1)):ratios[c.cardRatio]||1,tw=Math.max(1,(clip.width-2*gap)/3),th=tw/ratio,pitch=th+gap,length=rows*pitch,corner=Math.min(unit*c.cornerRadius*.7,tw/2,th/2),contentRadius=Math.min(unit*c.cornerRadius,clip.width/2,clip.height/2),cycle=(phase(progress,c,scroll)%1+1)%1,cards=[];
  for(var slot=0;slot<total;slot++){
   var column=Math.floor(slot/rows),row=slot%rows,direction=column===1?-1:1,x=clip.left+column*(tw+gap),at=((row*pitch+cycle*length*direction)%length+length)%length,instances=[];
   if(Math.abs(at)<1e-9||Math.abs(at-length)<1e-9)at=0;
   for(var y=clip.top+at-length*Math.ceil((at+clip.height)/length);y<clip.top+clip.height;y+=length){
    var top=Math.max(y,clip.top),bottom=Math.min(y+th,clip.top+clip.height);if(bottom-top<=1e-7)continue;
    var upper=[{x:x,y:y},{x:x,y:y+th}],lower=[{x:x+tw,y:y},{x:x+tw,y:y+th}];instances.push({column:column,row:row,depth:slot,alpha:1,upper:upper,lower:lower,polygon:[{x:x,y:top},{x:x,y:bottom},{x:x+tw,y:bottom},{x:x+tw,y:top}],rounded:{cx:x+tw/2,cy:y+th/2,width:tw,height:th,radius:corner,angle:0,scaleX:1,scaleY:1},shadowStrength:1});
   }
   var visible=instances.length>0,ys=[];instances.forEach(function(t){t.polygon.forEach(function(p){ys.push(p.y);});});var top=visible?Math.min.apply(null,ys):clip.top,bottom=visible?Math.max.apply(null,ys):top+1,first=instances[0];
   cards.push({slot:slot,column:column,row:row,direction:direction,cycleLength:length,depth:slot,alpha:visible?1:0,visible:visible,left:x,top:top,width:tw,height:bottom-top,upper:first?first.upper:[],lower:first?first.lower:[],instances:instances,textureWidth:tw,textureHeight:th,corner:corner,contentRadius:contentRadius,contentClip:clip,clip:clip});
  }
  return cards;
 }
 // Upright cards circulate in depth; source textures stay constant throughout each cycle.
 function orbitCarouselLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(3,Math.min(10,Math.round(count)||4)),unit=Math.min(fw,fh)/100,pad=unit*c.padding,clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},cw=Math.max(1,fw-2*pad),ch=Math.max(1,fh-2*pad),cx=width/2+unit*c.offsetX,cy=height/2+unit*c.offsetY,tw=cw*.52,th=ch*.52,ratio=c.cardRatio==='auto'?Math.max(.25,Math.min(4,+imageRatio||1)):ratios[c.cardRatio];
  if(ratio){if(tw/th>ratio)tw=th*ratio;else th=tw/ratio;}
  var corner=Math.min(unit*c.cornerRadius,tw/2,th/2),vertical=fh>fw*1.05,spread=(vertical?ch:cw)*.5*c.spread/100,depth=c.depth/100,cycle=(phase(progress,c,scroll)%1+1)%1,cards=[];
  for(var slot=0;slot<total;slot++){
   var angle=2*Math.PI*(cycle+slot/total),z=Math.cos(angle),front=(z+1)/2,scale=1-depth*.55*(1-front),alpha=1-depth*(1-front),offset=Math.sin(angle)*spread,x=cx+(vertical?0:offset),y=cy+(vertical?offset:0),w=tw*scale,h=th*scale,l=x-w/2,r=x+w/2,top=y-h/2,bottom=y+h/2,vl=Math.max(l,clip.left),vr=Math.min(r,clip.left+fw),vt=Math.max(top,clip.top),vb=Math.min(bottom,clip.top+fh),visible=vr>vl&&vb>vt,upper=[{x:l,y:top},{x:l,y:bottom}],lower=[{x:r,y:top},{x:r,y:bottom}],instance={depth:z+slot*1e-9,alpha:alpha,upper:upper,lower:lower,polygon:[{x:vl,y:vt},{x:vl,y:vb},{x:vr,y:vb},{x:vr,y:vt}],rounded:{cx:x,cy:y,width:tw,height:th,radius:corner,angle:0,scaleX:scale,scaleY:scale},shadowStrength:2.5*front};
   cards.push({slot:slot,depth:z+slot*1e-9,front:front,scale:scale,alpha:alpha,visible:visible,left:visible?vl:clip.left,top:visible?vt:clip.top,width:visible?vr-vl:1,height:visible?vb-vt:1,upper:upper,lower:lower,instances:visible?[instance]:[],textureWidth:tw,textureHeight:th,corner:corner,clip:clip});
  }
  return cards;
 }
 // Each tile alternates two sources; raster dimensions stay stable while the face compresses.
 function flipLayout(width,height,fw,fh,c,progress,count,scroll){
  var total=Math.max(6,Math.min(12,Math.round((+count||8)/2)*2)),pairs=total/2,columns=pairs===3?3:pairs===4?2:3,rows=Math.ceil(pairs/columns),unit=Math.min(fw,fh)/100,pad=unit*c.padding,gap=unit*c.gap,clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},rect={left:clip.left+pad+unit*c.offsetX,top:clip.top+pad+unit*c.offsetY,width:Math.max(1,fw-pad*2),height:Math.max(1,fh-pad*2)},tw=Math.max(1,(rect.width-gap*(columns-1))/columns),th=Math.max(1,(rect.height-gap*(rows-1))/rows),corner=Math.min(unit*c.cornerRadius,tw/2,th/2),cycle=(phase(progress,c,scroll)%1+1)%1,cards=[];
  for(var slot=0;slot<total;slot++)cards.push({slot:slot,pair:slot%pairs,depth:slot%pairs,alpha:0,visible:false,instances:[],left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],textureWidth:tw,textureHeight:th,corner:corner,clip:clip});
  for(var pair=0;pair<pairs;pair++){
   var local=(cycle-pair*.13+1)%1;[0,.06,.12,.5,.56,.62,1].forEach(function(boundary){if(Math.abs(local-boundary)<1e-10)local=boundary===1?0:boundary;});
   var scale=1,back=false,t=0,half=local>=.5;
   if(local<.12||local>=.5&&local<.62){t=(local-(half?.5:0))/.12;t=Math.max(0,Math.min(1,t));var ease=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;scale=Math.max(.001,Math.abs(Math.cos(Math.PI*ease)));back=half?ease<.5:ease>=.5;}else back=local<.5;
   var slot=pair+(back?pairs:0),card=cards[slot],sx=c.axis==='horizontal'?scale:1,sy=c.axis==='vertical'?scale:1,cx=rect.left+(pair%columns)*(tw+gap)+tw/2,cy=rect.top+Math.floor(pair/columns)*(th+gap)+th/2,l=cx-tw*sx/2,r=cx+tw*sx/2,top=cy-th*sy/2,bottom=cy+th*sy/2,vl=Math.max(l,clip.left),vr=Math.min(r,clip.left+clip.width),vt=Math.max(top,clip.top),vb=Math.min(bottom,clip.top+clip.height);
   card.local=local;card.flipScale=scale;card.back=back;if(vr<=vl||vb<=vt)continue;
   var upper=[{x:l,y:top},{x:l,y:bottom}],lower=[{x:r,y:top},{x:r,y:bottom}],instance={pair:pair,back:back,depth:pair,alpha:1,upper:upper,lower:lower,polygon:[{x:vl,y:vt},{x:vl,y:vb},{x:vr,y:vb},{x:vr,y:vt}],rounded:{cx:cx,cy:cy,width:tw,height:th,radius:corner,angle:0,scaleX:sx,scaleY:sy},shadowStrength:(1-scale)*3};
   card.alpha=1;card.visible=true;card.left=vl;card.top=vt;card.width=vr-vl;card.height=vb-vt;card.upper=upper;card.lower=lower;card.instances=[instance];
  }
  return cards;
 }
 // Every source has a square thumbnail and optional full-frame backdrop windows.
 function heroLayout(width,height,fw,fh,c,progress,count,scroll){
  var total=Math.max(3,Math.min(10,Math.round(count)||7)),unit=Math.min(fw,fh)/100,clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},pad=unit*c.padding,content={left:clip.left+pad+unit*c.offsetX,top:clip.top+pad+unit*c.offsetY,width:Math.max(1,fw-2*pad),height:Math.max(1,fh-2*pad)},gap=unit*c.gap,size=Math.max(1,Math.min(content.height*.3,(content.width-(total-1)*gap)/total)),start=content.left+(content.width-total*size-(total-1)*gap)/2,cycle=(phase(progress,c,scroll)%1+1)%1,at=cycle*total;
  if(Math.abs(at-Math.round(at))<1e-10)at=Math.round(at);
  var index=Math.floor(at)%total,local=at-Math.floor(at),hold=c.hold/100,t=Math.max(0,Math.min(1,(local-hold)/(1-hold))),ease=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,active=index+ease,next=(index+1)%total,ken=c.kenBurns/100,zoom=1.03+ken*.06*(.5-.5*Math.cos(cycle*2*Math.PI)),panX=ken*.1*Math.sin(cycle*2*Math.PI),panY=ken*.06*Math.cos(cycle*2*Math.PI),masks=t>0&&t<1?mosaicMasks(clip,c,t):[],cards=[];
  function plane(rect,mask,rounded,depth,alpha,role,piece,replace,raise){var l=Math.max(mask.left,clip.left),top=Math.max(mask.top,clip.top),r=Math.min(mask.left+mask.width,clip.left+clip.width),b=Math.min(mask.top+mask.height,clip.top+clip.height);if(r-l<=1e-7||b-top<=1e-7||alpha<=0)return null;return{role:role,piece:piece,raise:raise||0,depth:depth,alpha:alpha,upper:[{x:rect.left,y:rect.top},{x:rect.left,y:rect.top+rect.height}],lower:[{x:rect.left+rect.width,y:rect.top},{x:rect.left+rect.width,y:rect.top+rect.height}],polygon:[{x:l,y:top},{x:l,y:b},{x:r,y:b},{x:r,y:top}],rounded:rounded,panelClip:rounded,imageFrame:rect,zoom:role==='backdrop'?zoom:1,panX:role==='backdrop'?panX:0,panY:role==='backdrop'?panY:0,mosaicMask:piece>=0,replace:replace,shadowStrength:role==='thumbnail'?.5+(raise||0):0};}
  for(var slot=0;slot<total;slot++){
   var distance=Math.abs(slot-active),around=Math.min(distance,total-distance),q=Math.max(0,Math.min(1,1-around))-1,raise=Math.max(0,1+2.2*q*q*q+1.2*q*q),scale=1+(c.activeScale/100-1)*raise,thumbSize=size*scale,cx=start+slot*(size+gap)+size/2,cy=content.top+content.height*.5-unit*c.lift*raise,rect={left:cx-thumbSize/2,top:cy-thumbSize/2,width:thumbSize,height:thumbSize},radius=Math.min(unit*c.cornerRadius,size*.16,thumbSize/2),rounded={cx:cx,cy:cy,width:thumbSize,height:thumbSize,angle:0,radius:radius},frameRound={cx:clip.left+fw/2,cy:clip.top+fh/2,width:fw,height:fh,angle:0,radius:0},instances=[],opacity=c.heroOpacity/100;
   if(slot===index&&t<1){var backdrop=plane(clip,clip,frameRound,-2,opacity,'backdrop',-1,false,0);if(backdrop)instances.push(backdrop);}
   if(slot===next&&t>0){if(t>=1){var complete=plane(clip,clip,frameRound,-1,opacity,'backdrop',-1,true,0);if(complete)instances.push(complete);}else masks.forEach(function(mask){var part=plane(clip,mask.rect,frameRound,-1+mask.piece*1e-9,opacity,'backdrop',mask.piece,true,0);if(part)instances.push(part);});}
   var thumb=plane(rect,rect,rounded,10+raise+slot*1e-9,1,'thumbnail',-1,false,raise);if(thumb)instances.push(thumb);
   var points=[];instances.forEach(function(t){points=points.concat(t.polygon);});var visible=instances.length>0,xs=points.map(function(p){return p.x;}),ys=points.map(function(p){return p.y;}),l=visible?Math.min.apply(null,xs):clip.left,top=visible?Math.min.apply(null,ys):clip.top,r=visible?Math.max.apply(null,xs):l+1,b=visible?Math.max.apply(null,ys):top+1;
   cards.push({slot:slot,raise:raise,scale:scale,transition:t,index:index,thumbnail:rect,depth:thumb?thumb.depth:-2,alpha:visible?1:0,visible:visible,left:l,top:top,width:r-l,height:b-top,upper:[{x:rect.left,y:rect.top},{x:rect.left,y:rect.top+rect.height}],lower:[{x:rect.left+rect.width,y:rect.top},{x:rect.left+rect.width,y:rect.top+rect.height}],instances:instances,textureWidth:size,textureHeight:size,corner:0,clip:clip});
  }
  return cards;
 }
 function mosaicMasks(rect,c,p){
  var blinds=c.style==='blinds',ranks=blinds?[]:mosaicOrder(c.rows,c.columns,c.pattern),last=blinds?Math.max(1,c.slats-1):Math.max.apply(null,[1].concat(ranks)),pieces=blinds?c.slats:c.rows*c.columns,stagger=c.stagger/100,duration=Math.max(.05,1-stagger),rng=mosaicRandom(blinds?c.slats+(c.orientation==='vertical'?7:3):c.rows*500+c.columns*7+1),masks=[];
  for(var piece=0;piece<pieces;piece++){
   var delay=Math.min(.97,(blinds?piece:ranks[piece])/last*stagger),length=Math.min(1-delay,Math.max(.03,duration*(1+(rng()*2-1)*c.speedVariation/100*.7))),t=Math.max(0,Math.min(1,(p-delay)/length)),reveal=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,mask={left:rect.left,top:rect.top,width:rect.width,height:rect.height};
   if(blinds){var vertical=c.orientation==='vertical',start=(vertical?rect.left:rect.top)+piece*(vertical?rect.width:rect.height)/pieces,span=(vertical?rect.width:rect.height)/pieces,size=span*reveal,from=c.openFrom==='alternate'?(piece%2===0?'start':'end'):c.openFrom,position=start+(from==='end'?span-size:from==='center'?(span-size)/2:0);if(vertical){mask.left=position;mask.width=size;}else{mask.top=position;mask.height=size;}}
   else{var row=Math.floor(piece/c.columns),col=piece%c.columns,cellW=rect.width/c.columns,cellH=rect.height/c.rows;mask.left+=col*cellW+cellW*(1-reveal)/2;mask.top+=row*cellH+cellH*(1-reveal)/2;mask.width=cellW*reveal;mask.height=cellH*reveal;}
   masks.push({rect:mask,piece:piece,reveal:reveal,delay:delay,duration:length});
  }
  return masks;
 }
 function mosaicLayout(width,height,fw,fh,c,progress,count,scroll){
  var total=Math.max(2,Math.min(8,Math.round(count)||4)),unit=Math.min(fw,fh)/100,pad=unit*c.padding,clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},rect={left:clip.left+pad+unit*c.offsetX,top:clip.top+pad+unit*c.offsetY,width:Math.max(1,fw-2*pad),height:Math.max(1,fh-2*pad)},cycle=(phase(progress,c,scroll)%1+1)%1,at=cycle*total;
  if(Math.abs(at-Math.round(at))<1e-10)at=Math.round(at);
  var index=Math.floor(at)%total,previous=(index+total-1)%total,local=at-Math.floor(at),p=Math.abs(local-.6)<1e-10?1:Math.min(1,local/.6),masks=mosaicMasks(rect,c,p),rounded={cx:rect.left+rect.width/2,cy:rect.top+rect.height/2,width:rect.width,height:rect.height,angle:0,radius:Math.min(rect.width/2,rect.height/2,unit*c.cornerRadius)},upper=[{x:rect.left,y:rect.top},{x:rect.left,y:rect.top+rect.height}],lower=[{x:rect.left+rect.width,y:rect.top},{x:rect.left+rect.width,y:rect.top+rect.height}],cards=[];
  function plane(mask,depth,replace,piece,reveal){var l=Math.max(mask.left,clip.left),t=Math.max(mask.top,clip.top),r=Math.min(mask.left+mask.width,clip.left+clip.width),b=Math.min(mask.top+mask.height,clip.top+clip.height);if(r-l<=1e-7||b-t<=1e-7)return null;return{depth:depth,alpha:1,piece:piece,reveal:reveal,upper:upper,lower:lower,polygon:[{x:l,y:t},{x:l,y:b},{x:r,y:b},{x:r,y:t}],rounded:rounded,panelClip:rounded,mosaicMask:piece>=0,replace:replace};}
  for(var slot=0;slot<total;slot++){
   var instances=[],base=slot===previous,incoming=slot===index;
   if(base&&p<1){var full=plane(rect,0,false,-1,1);if(full)instances.push(full);}
   if(incoming){if(p>=1){var complete=plane(rect,0,false,-1,1);if(complete)instances.push(complete);}else masks.forEach(function(mask){var tile=plane(mask.rect,1+mask.piece*1e-9,true,mask.piece,mask.reveal);if(tile)instances.push(tile);});}
   var points=[];instances.forEach(function(t){points=points.concat(t.polygon);});var visible=instances.length>0,xs=points.map(function(p){return p.x;}),ys=points.map(function(p){return p.y;}),l=visible?Math.min.apply(null,xs):clip.left,top=visible?Math.min.apply(null,ys):clip.top,r=visible?Math.max.apply(null,xs):l+1,b=visible?Math.max.apply(null,ys):top+1;
   cards.push({slot:slot,incoming:incoming,previous:base,local:local,depth:visible?instances[instances.length-1].depth:-1,alpha:visible?1:0,visible:visible,left:l,top:top,width:r-l,height:b-top,upper:upper,lower:lower,instances:instances,textureWidth:rect.width,textureHeight:rect.height,corner:0,clip:clip});
  }
  return cards;
 }
 // Each fixed strip clips a translated full source plane, preserving its authored crop.
 function stripeLayout(width,height,fw,fh,c,progress,count,scroll){
  var total=Math.max(2,Math.min(8,Math.round(count)||3)),unit=Math.min(fw,fh)/100,pad=unit*c.padding,clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},rect={left:clip.left+pad+unit*c.offsetX,top:clip.top+pad+unit*c.offsetY,width:Math.max(1,fw-2*pad),height:Math.max(1,fh-2*pad)},vertical=fh<=fw*1.05,cycle=(phase(progress,c,scroll)%1+1)%1,at=cycle*total;
  if(Math.abs(at-Math.round(at))<1e-10)at=Math.round(at);
  var index=Math.floor(at)%total,previous=(index+total-1)%total,local=at-Math.floor(at),p=Math.min(1,local/.5),strips=Math.round(c.strips),duration=1/(strips-(strips-1)*.65),delay=duration*.35,rounded={cx:rect.left+rect.width/2,cy:rect.top+rect.height/2,width:rect.width,height:rect.height,angle:0,radius:Math.min(rect.width/2,rect.height/2,unit*c.cornerRadius)},cards=[];
  function plane(left,top,mask,depth,replace,strip,reveal){
   var l=Math.max(left,mask.left,clip.left),t=Math.max(top,mask.top,clip.top),r=Math.min(left+rect.width,mask.left+mask.width,clip.left+clip.width),b=Math.min(top+rect.height,mask.top+mask.height,clip.top+clip.height);
   if(r-l<=1e-7||b-t<=1e-7)return null;
   return{depth:depth,alpha:1,strip:strip,stripeAxis:strip>=0?(vertical?'x':'y'):null,reveal:reveal,upper:[{x:left,y:top},{x:left,y:top+rect.height}],lower:[{x:left+rect.width,y:top},{x:left+rect.width,y:top+rect.height}],polygon:[{x:l,y:t},{x:l,y:b},{x:r,y:b},{x:r,y:t}],rounded:rounded,panelClip:rounded,replace:replace};
  }
  for(var slot=0;slot<total;slot++){
   var instances=[],base=slot===previous,incoming=slot===index;
   if(base&&p<1){var full=plane(rect.left,rect.top,rect,0,false,-1,1);if(full)instances.push(full);}
   if(incoming){
    if(p>=1){var complete=plane(rect.left,rect.top,rect,0,false,-1,1);if(complete)instances.push(complete);}
    else for(var stripe=0;stripe<strips;stripe++){
     var t=Math.max(0,Math.min(1,(p-stripe*delay)/duration)),reveal=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,sign=stripe%2===0?-1:1,mask={left:rect.left,top:rect.top,width:rect.width,height:rect.height};
     if(vertical){mask.left+=stripe*rect.width/strips;mask.width=rect.width/strips;}else{mask.top+=stripe*rect.height/strips;mask.height=rect.height/strips;}
     var shifted=plane(rect.left+(vertical?0:sign*(1-reveal)*rect.width),rect.top+(vertical?sign*(1-reveal)*rect.height:0),mask,1+stripe*1e-9,true,stripe,reveal);if(shifted)instances.push(shifted);
    }
   }
   var points=[];instances.forEach(function(t){points=points.concat(t.polygon);});var visible=instances.length>0,xs=points.map(function(p){return p.x;}),ys=points.map(function(p){return p.y;}),l=visible?Math.min.apply(null,xs):clip.left,top=visible?Math.min.apply(null,ys):clip.top,r=visible?Math.max.apply(null,xs):l+1,b=visible?Math.max.apply(null,ys):top+1;
   cards.push({slot:slot,vertical:vertical,incoming:incoming,previous:base,local:local,depth:visible?instances[instances.length-1].depth:-1,alpha:visible?1:0,visible:visible,left:l,top:top,width:r-l,height:b-top,upper:[{x:rect.left,y:rect.top},{x:rect.left,y:rect.top+rect.height}],lower:[{x:rect.left+rect.width,y:rect.top},{x:rect.left+rect.width,y:rect.top+rect.height}],instances:instances,textureWidth:rect.width,textureHeight:rect.height,corner:0,clip:clip});
  }
  return cards;
 }
 // Full source textures stay still while a half-plane mask sweeps across the rounded frame.
 function wipeLayout(width,height,fw,fh,c,progress,count,scroll){
  var total=Math.max(2,Math.min(8,Math.round(count)||3)),unit=Math.min(fw,fh)/100,pad=unit*c.padding,clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},rect={left:clip.left+pad+unit*c.offsetX,top:clip.top+pad+unit*c.offsetY,width:Math.max(1,fw-2*pad),height:Math.max(1,fh-2*pad)},cx=rect.left+rect.width/2,cy=rect.top+rect.height/2,angle=c.angle*Math.PI/180,nx=Math.cos(angle),ny=Math.sin(angle),span=fw+fh,cycle=(phase(progress,c,scroll)%1+1)%1,at=Math.abs(cycle*total-Math.round(cycle*total))<1e-10?Math.round(cycle*total):cycle*total,index=Math.floor(at)%total,local=at-Math.floor(at),t=Math.max(0,Math.min(1,(local-.65)/.35)),reveal=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,threshold=span*(.5-reveal),radius=Math.min(rect.width/2,rect.height/2,unit*c.cornerRadius),rounded={cx:cx,cy:cy,width:rect.width,height:rect.height,angle:0,radius:radius},left=Math.max(rect.left,clip.left),top=Math.max(rect.top,clip.top),right=Math.min(rect.left+rect.width,clip.left+clip.width),bottom=Math.min(rect.top+rect.height,clip.top+clip.height),base=right>left&&bottom>top?[{x:left,y:top},{x:left,y:bottom},{x:right,y:bottom},{x:right,y:top}]:[],upper=[{x:rect.left,y:rect.top},{x:rect.left,y:rect.top+rect.height}],lower=[{x:rect.left+rect.width,y:rect.top},{x:rect.left+rect.width,y:rect.top+rect.height}],cards=[];
  function swept(polygon){var out=[];if(!polygon.length)return out;var a=polygon[polygon.length-1],da=(a.x-cx)*nx+(a.y-cy)*ny-threshold;polygon.forEach(function(b){var db=(b.x-cx)*nx+(b.y-cy)*ny-threshold;if((da>=0)!==(db>=0)){var u=da/(da-db);out.push({x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u});}if(db>=0)out.push(b);a=b;da=db;});return out;}
  for(var slot=0;slot<total;slot++){
   var active=slot===index,incoming=slot===(index+1)%total&&local>.65,polygon=active?base:incoming?swept(base):[],area=0;polygon.forEach(function(p,i){var q=polygon[(i+1)%polygon.length];area+=p.x*q.y-q.x*p.y;});var visible=polygon.length>=3&&Math.abs(area)>1e-7,depth=incoming?1:active?0:-1,edge=incoming?{cx:cx,cy:cy,angle:angle,nx:nx,ny:ny,threshold:threshold,width:unit*1.2,reach:span,alpha:.5*c.edgeGlow/100*Math.sin(Math.PI*reveal)}:null,instance={depth:depth,alpha:1,upper:upper,lower:lower,polygon:polygon,rounded:rounded,panelClip:rounded,replace:incoming,edge:edge},xs=polygon.map(function(p){return p.x;}),ys=polygon.map(function(p){return p.y;}),l=visible?Math.min.apply(null,xs):clip.left,r=visible?Math.max.apply(null,xs):l+1,tt=visible?Math.min.apply(null,ys):clip.top,b=visible?Math.max.apply(null,ys):tt+1;
   cards.push({slot:slot,active:active,incoming:incoming,reveal:reveal,depth:depth,alpha:visible?1:0,visible:visible,left:l,top:tt,width:r-l,height:b-tt,upper:upper,lower:lower,instances:visible?[instance]:[],textureWidth:rect.width,textureHeight:rect.height,corner:0,clip:clip});
  }
  return cards;
 }
 // Four sources alternate in two fixed rounded windows; moving planes retain their full crop.
 function splitLayout(width,height,fw,fh,c,progress,scroll){
  var unit=Math.min(fw,fh)/100,pad=unit*c.padding,clip={left:(width-fw)/2,top:(height-fh)/2,width:fw,height:fh},content={left:clip.left+pad+unit*c.offsetX,top:clip.top+pad+unit*c.offsetY,width:Math.max(1,fw-2*pad),height:Math.max(1,fh-2*pad)},vertical=fh>fw*1.05,gap=unit*c.gap,ratio=c.splitRatio/100,cycle=(phase(progress,c,scroll)%1+1)%1,at=cycle*2,index=Math.floor(at),local=at-index,cards=[];
  function ease(t){t=Math.max(0,Math.min(1,t));return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
  for(var slot=0;slot<4;slot++){
   var panel=slot%2,first=panel===0,r={left:content.left,top:content.top,width:content.width,height:content.height};
   if(vertical){r.height=Math.max(1,content.height*(first?ratio:1-ratio)-gap/2);if(!first)r.top+=content.height*ratio+gap/2;}
   else{r.width=Math.max(1,content.width*(first?ratio:1-ratio)-gap/2);if(!first)r.left+=content.width*ratio+gap/2;}
   var arriving=Math.floor(slot/2)===index,reveal=ease((local-panel*.08)/.5),shift=arriving?(1-reveal)*(vertical?r.height:r.width)*(first?-1:1):0,left=r.left+(vertical?0:shift),top=r.top+(vertical?shift:0),upper=[{x:left,y:top},{x:left,y:top+r.height}],lower=[{x:left+r.width,y:top},{x:left+r.width,y:top+r.height}],l=Math.max(left,r.left,clip.left),t=Math.max(top,r.top,clip.top),right=Math.min(left+r.width,r.left+r.width,clip.left+clip.width),bottom=Math.min(top+r.height,r.top+r.height,clip.top+clip.height),visible=right-l>1e-7&&bottom-t>1e-7,depth=(arriving?1:0)+panel*1e-9,radius=Math.min(r.width/2,r.height/2,unit*c.cornerRadius),rounded={cx:r.left+r.width/2,cy:r.top+r.height/2,width:r.width,height:r.height,angle:0,radius:radius},polygon=[{x:l,y:t},{x:l,y:bottom},{x:right,y:bottom},{x:right,y:t}],instance={depth:depth,alpha:1,upper:upper,lower:lower,polygon:polygon,rounded:rounded,panelClip:rounded,shadowStrength:arriving?2*(1-Math.abs(reveal*2-1)):0};
   cards.push({slot:slot,panel:panel,vertical:vertical,reveal:reveal,arriving:arriving,depth:depth,alpha:visible?1:0,visible:visible,left:visible?l:clip.left,top:visible?t:clip.top,width:visible?right-l:1,height:visible?bottom-t:1,upper:upper,lower:lower,instances:visible?[instance]:[],textureWidth:r.width,textureHeight:r.height,corner:0,clip:clip});
  }
  return cards;
 }
 // Upright source planes share a tilted orbit; angular depth controls scale, fade and paint order.
 function showcaseOrbitLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(4,Math.min(16,Math.round(count)||12)),unit=Math.min(fw,fh)/100,pad=unit*c.padding,clip={left:(width-fw)/2+pad,top:(height-fh)/2+pad,width:Math.max(1,fw-2*pad),height:Math.max(1,fh-2*pad)},tw=unit*c.cardSize,th=tw/(ratios[c.cardRatio]||Math.max(.25,Math.min(4,imageRatio||1))),corner=Math.min(tw/2,th/2,unit*c.cornerRadius),rx=clip.width*c.ringWidth/200*c.spread/100,ry=clip.height*c.ringHeight/200*c.spread/100,tilt=c.ringTilt*Math.PI/180,co=Math.cos(tilt),si=Math.sin(tilt),perspective=c.perspective/100,cycle=(phase(progress,c,scroll)%1+1)%1,travel=cycle,cards=[];
  if(c.motion==='pulse')travel+=c.pulse/100*Math.sin(cycle*2*Math.PI)/(2*Math.PI);
  for(var slot=0;slot<total;slot++){
   var angle=2*Math.PI*((c.direction==='left'?-travel:travel)+slot/total),cos=Math.cos(angle),depth=(cos+1)/2,scale=1+perspective*(.9*depth-.55),alpha=1-c.backFade/100*(1-depth),ox=Math.sin(angle)*rx*(1+.18*perspective*cos),oy=cos*ry,cx=width/2+ox*co-oy*si+unit*c.offsetX,cy=height/2+ox*si+oy*co+unit*c.offsetY,w=tw*scale,h=th*scale,left=cx-w/2,top=cy-h/2,upper=[{x:left,y:top},{x:left,y:top+h}],lower=[{x:left+w,y:top},{x:left+w,y:top+h}],polygon=upper.concat(lower.slice().reverse()),rounded={cx:cx,cy:cy,width:w,height:h,angle:0,radius:corner*scale},visible=left+w>clip.left&&left<clip.left+clip.width&&top+h>clip.top&&top<clip.top+clip.height,margin=unit*3,l=Math.max(clip.left,left-margin),t=Math.max(clip.top,top-margin),r=Math.min(clip.left+clip.width,left+w+margin),b=Math.min(clip.top+clip.height,top+h+margin),instance={scale:scale,depth:depth+slot*1e-9,alpha:alpha,upper:upper,lower:lower,polygon:polygon,rounded:rounded};
   cards.push({slot:slot,depth:instance.depth,alpha:visible?alpha:0,visible:visible,left:visible?l:clip.left,top:visible?t:clip.top,width:visible?r-l:1,height:visible?b-t:1,upper:upper,lower:lower,instances:visible?[instance]:[],textureWidth:tw,textureHeight:th,corner:corner,clip:clip});
  }
  return cards;
 }
 // Spread a central stack, exchange its diagonals on each axis, then close it in source order.
 function cascadeDeckLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(3,Math.min(12,Math.round(count)||8)),unit=Math.min(fw,fh)/100,pad=unit*c.padding,clip={left:(width-fw)/2+pad,top:(height-fh)/2+pad,width:Math.max(1,fw-2*pad),height:Math.max(1,fh-2*pad)},aspect=ratios[c.cardRatio]||Math.max(.25,Math.min(4,imageRatio||1)),overlap=c.overlap/100,size=Math.min(clip.width,clip.height)*c.cardSize/100/(1+(total-1)*(1-overlap)),gap=size*(1-overlap),tw=size*Math.min(1,aspect),th=size/Math.max(1,aspect),corner=Math.min(tw/2,th/2,unit*c.cornerRadius),cx=width/2+unit*c.offsetX,cy=height/2+unit*c.offsetY,cycle=(phase(progress,c,scroll)%1+1)%1,cards=[];
  function transition(from,to,index){var t=Math.max(0,Math.min(1,(cycle-from)/(to-from)));if(c.motion!=='together'){var duration=2/(total+1),delay=index/(total+1);t=Math.max(0,Math.min(1,(t-delay)/duration));}return t*t*(3-2*t);}
  for(var slot=0;slot<total;slot++){
   var offset=(slot-(total-1)/2)*gap,spread=transition(0,.15,slot)*(1-transition(.74,1,slot)),x=cx+offset*(1-2*transition(.47,.65,total-1-slot))*spread,y=cy+offset*(1-2*transition(.22,.40,slot))*spread,left=x-tw/2,top=y-th/2,upper=[{x:left,y:top},{x:left,y:top+th}],lower=[{x:left+tw,y:top},{x:left+tw,y:top+th}],polygon=upper.concat(lower.slice().reverse()),rounded={cx:x,cy:y,width:tw,height:th,angle:0,radius:corner},depth=total-1-slot,visible=left+tw>clip.left&&left<clip.left+clip.width&&top+th>clip.top&&top<clip.top+clip.height,margin=unit*3,l=Math.max(clip.left,left-margin),t=Math.max(clip.top,top-margin),r=Math.min(clip.left+clip.width,left+tw+margin),b=Math.min(clip.top+clip.height,top+th+margin),instance={depth:depth,alpha:1,upper:upper,lower:lower,polygon:polygon,rounded:rounded};
   cards.push({slot:slot,depth:depth,alpha:visible?1:0,visible:visible,left:visible?l:clip.left,top:visible?t:clip.top,width:visible?r-l:1,height:visible?b-t:1,upper:upper,lower:lower,instances:visible?[instance]:[],textureWidth:tw,textureHeight:th,corner:corner,clip:clip});
  }
  return cards;
 }
 // Six upright sources exchange three authored poses. Each turn holds, then eases to the next.
 function danceLayout(width,height,fw,fh,c,progress,imageRatio,scroll){
  var poses=[
   [[.44,.63,1],[.15,.51,.72],[.19,.81,1.18],1.10],
   [[.19,.81,1],[.31,.81,1.46],[.48,.50,1.48],.68],
   [[.81,.81,1],[.56,.48,1.28],[.19,.24,.82],1.08],
   [[.61,.20,1],[.80,.20,.44],[.80,.58,1],1.36],
   [[.80,.50,1],[.80,.81,.72],[.51,.81,.72],.98],
   [[.16,.36,1],[.25,.18,1.46],[.69,.21,1.48],.76]
  ],unit=Math.min(fw,fh)/100,pad=unit*c.padding,clip={left:(width-fw)/2+pad,top:(height-fh)/2+pad,width:Math.max(1,fw-2*pad),height:Math.max(1,fh-2*pad)},tw=unit*c.cardSize*(1+c.spacing/100),th=tw/(ratios[c.cardRatio]||Math.max(.25,Math.min(4,imageRatio||1))),corner=Math.min(tw/2,th/2,unit*c.cornerRadius),cycle=(phase(progress,c,scroll)%1+1)%1,turn=cycle*3;
  if(Math.abs(turn-Math.round(turn))<1e-10)turn=Math.round(turn)%3;
  var step=Math.floor(turn),local=Math.max(0,Math.min(1,(turn-step-.3)/.7)),ease=local*local*(3-2*local);
  return poses.map(function(poses,slot){
   var a=poses[step],b=poses[(step+1)%3],scale=poses[3]*(a[2]+(b[2]-a[2])*ease),cx=(width-fw)/2+(a[0]+(b[0]-a[0])*ease)*fw+unit*c.offsetX,cy=(height-fh)/2+(a[1]+(b[1]-a[1])*ease)*fh+unit*c.offsetY,w=tw*scale,h=th*scale,left=cx-w/2,top=cy-h/2,upper=[{x:left,y:top},{x:left,y:top+h}],lower=[{x:left+w,y:top},{x:left+w,y:top+h}],polygon=upper.concat(lower.slice().reverse()),rounded={cx:cx,cy:cy,width:w,height:h,angle:0,radius:corner*scale},visible=left+w>clip.left&&left<clip.left+clip.width&&top+h>clip.top&&top<clip.top+clip.height,margin=unit*3,l=Math.max(clip.left,left-margin),t=Math.max(clip.top,top-margin),r=Math.min(clip.left+clip.width,left+w+margin),bt=Math.min(clip.top+clip.height,top+h+margin),instance={scale:scale,depth:slot,alpha:1,upper:upper,lower:lower,polygon:polygon,rounded:rounded};
   return{slot:slot,depth:slot,alpha:visible?1:0,visible:visible,left:visible?l:clip.left,top:visible?t:clip.top,width:visible?r-l:1,height:visible?bt-t:1,upper:upper,lower:lower,instances:visible?[instance]:[],textureWidth:tw,textureHeight:th,corner:corner,clip:clip};
  });
 }
 // Two opposing cubic arcs share reusable source textures; younger cards paint last.
 function trailPath(t){t=Math.max(0,Math.min(1,t));var q=1-t;return{x:q*q*q*.79+3*q*q*t*.60+3*q*t*t*.26+t*t*t*.05,y:q*q*q*.389+3*q*q*t*.07+3*q*t*t*.03+t*t*t*.3205};}
 function trailLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var total=Math.max(4,Math.min(20,Math.round(count)||12)),length=Math.max(Math.ceil(total/2),c.trailLength),unit=Math.min(fw,fh)/100,pad=unit*c.padding,clip={left:(width-fw)/2+pad,top:(height-fh)/2+pad,width:Math.max(1,fw-2*pad),height:Math.max(1,fh-2*pad)},tw=unit*c.cardSize,th=tw/(ratios[c.cardRatio]||Math.max(.25,Math.min(4,imageRatio||1))),corner=Math.min(tw/2,th/2,unit*c.cornerRadius),cycle=(phase(progress,c,scroll)%1+1)%1,pop=c.popFrom/100,cards=[];
  function smooth(t){t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);}
  for(var slot=0;slot<total;slot++)cards.push({slot:slot,depth:-2,alpha:0,visible:false,left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],instances:[],textureWidth:tw,textureHeight:th,corner:corner,clip:clip});
  for(var pass=0;pass<2;pass++){
   var time=(cycle-pass*.5+1)%1;
   for(var index=0;index<length;index++){
    var at=index/(length-1),birth=at*.236,retire=.29+at*.21;if(time<birth||time>=retire+.05)continue;
    var age=time-birth,enter=pop+(1-pop)*smooth((time-birth)/.08),exit=1-(1-pop)*(1-smooth(1-(time-retire)/.05)),scale=enter*exit;if(scale<1e-5)continue;
    var point=trailPath(at),cx=(width-fw)/2+(pass?1-point.x:point.x)*fw+unit*c.offsetX,cy=(height-fh)/2+(pass?1-point.y:point.y)*fh+unit*c.offsetY,w=tw*scale,h=th*scale,left=cx-w/2,top=cy-h/2;
    if(left+w<=clip.left||left>=clip.left+clip.width||top+h<=clip.top||top>=clip.top+clip.height)continue;
    var slot=(pass*length+index)%total,card=cards[slot],depth=-age+(pass*length+index)*1e-9,upper=[{x:left,y:top},{x:left,y:top+h}],lower=[{x:left+w,y:top},{x:left+w,y:top+h}],polygon=upper.concat(lower.slice().reverse()),rounded={cx:cx,cy:cy,width:w,height:h,angle:0,radius:corner*scale},instance={pass:pass,index:index,age:age,scale:scale,depth:depth,alpha:1,upper:upper,lower:lower,polygon:polygon,rounded:rounded};
    var margin=unit*3,l=Math.max(clip.left,left-margin),t=Math.max(clip.top,top-margin),r=Math.min(clip.left+clip.width,left+w+margin),b=Math.min(clip.top+clip.height,top+h+margin);
    if(card.visible){l=Math.min(l,card.left);t=Math.min(t,card.top);r=Math.max(r,card.left+card.width);b=Math.max(b,card.top+card.height);}else{card.upper=upper;card.lower=lower;}
    card.left=l;card.top=t;card.width=r-l;card.height=b-t;card.depth=Math.max(card.depth,depth);card.instances.push(instance);card.alpha=1;card.visible=true;
   }
  }
  return cards;
 }
 // A homogeneous plane supports true perspective in both texture axes and mirrored rear faces.
 function projectPlane(h,u,v){var den=h[6]*u+h[7]*v+h[8];return{x:(h[0]*u+h[1]*v+h[2])/den,y:(h[3]*u+h[4]*v+h[5])/den};}
 function inversePlane(h){var a=h[0],b=h[1],c=h[2],d=h[3],e=h[4],f=h[5],g=h[6],i=h[7],j=h[8],A=e*j-f*i,B=c*i-b*j,C=b*f-c*e,D=f*g-d*j,E=a*j-c*g,F=c*d-a*f,G=d*i-e*g,H=b*g-a*i,I=a*e-b*d,det=a*A+b*D+c*G;if(Math.abs(det)<1e-6)return null;return[A/det,B/det,C/det,D/det,E/det,F/det,G/det,H/det,I/det];}
 function ringLayout(width,height,fw,fh,c,progress,count,imageRatio,scroll){
  var vertical=c.kind==='cover-ring-vertical',total=Math.max(4,Math.min(16,Math.round(count)||8)),unit=Math.min(fw,fh)/100,pad=unit*c.padding,clip={left:(width-fw)/2+pad,top:(height-fh)/2+pad,width:Math.max(1,fw-2*pad),height:Math.max(1,fh-2*pad)},aspect=ratios[c.cardRatio]||Math.max(.25,Math.min(4,imageRatio||1)),th=unit*c.cardSize,tw=th*aspect,rad=Math.min(clip.width,clip.height)/2*c.ringSize/100,focal=Math.max(rad*(8-5.6*c.perspective/100),rad+Math.hypot(tw,th)*.55),tilt=(vertical?c.rotate:c.tilt)*Math.PI/180,ct=Math.cos(tilt),st=Math.sin(tilt),screenTilt=vertical?c.tilt*Math.PI/180:0,cr=Math.cos(screenTilt),sr=Math.sin(screenTilt),ox=width/2+unit*c.offsetX,oy=height/2+unit*c.offsetY,cycle=(phase(progress,c,scroll)%1+1)%1,travel=cycle*total,dir=c.direction==='left'||c.direction==='down'?-1:1,cards=[];
  if(c.motion==='steps'){if(Math.abs(travel-Math.round(travel))<1e-10)travel=Math.round(travel)%total;var local=Math.min(1,(travel-Math.floor(travel))/.55);travel=Math.floor(travel)+local*local*(3-2*local);}
  for(var slot=0;slot<total;slot++){
   var angle=(slot+dir*travel+.1)*Math.PI*2/total,co=Math.cos(angle),si=Math.sin(angle),depth=co+slot*1e-9,alpha=1-c.backFade/100+c.backFade/100*Math.max(0,Math.min(1,(co+.3)/.6)),corner=Math.min(tw/2,th/2,unit*c.cornerRadius*1.2),card={slot:slot,depth:depth,alpha:0,visible:false,left:clip.left,top:clip.top,width:1,height:1,upper:[],lower:[],instances:[],textureWidth:tw,textureHeight:th,corner:corner,clip:clip};cards.push(card);
   var du=si*ct,dv=st,d0=focal-(rad*co+tw/2*si)*ct-th/2*st,x0=rad*si-tw/2*co,y0=-th/2*ct+(rad*co+tw/2*si)*st,h=[(ox*du+focal*co)/focal,ox*dv/focal,(ox*d0+focal*x0)/focal,(oy*du-focal*si*st)/focal,(oy*dv+focal*ct)/focal,(oy*d0+focal*y0)/focal,du/focal,dv/focal,d0/focal],inv;
   if(vertical){
    // The upright tangent plane uses v-down texture coordinates. Yaw precedes the lens;
    // screen tilt rotates the projected ring around its offset center.
    du=-st;dv=-si*ct;d0=focal+tw/2*st-(rad*co-th/2*si)*ct;
    x0=-tw/2*ct-(rad*co-th/2*si)*st;y0=-rad*si-th/2*co;
    var xu=ct*cr,xv=-si*st*cr-co*sr,yu=ct*sr,yv=-si*st*sr+co*cr,rx=x0*cr-y0*sr,ry=x0*sr+y0*cr;
    h=[(ox*du+focal*xu)/focal,(ox*dv+focal*xv)/focal,(ox*d0+focal*rx)/focal,(oy*du+focal*yu)/focal,(oy*dv+focal*yv)/focal,(oy*d0+focal*ry)/focal,du/focal,dv/focal,d0/focal];
   }
   inv=inversePlane(h);if(!inv)continue;
   var upper=[projectPlane(h,0,0),projectPlane(h,tw,0)],lower=[projectPlane(h,0,th),projectPlane(h,tw,th)],polygon=upper.concat(lower.slice().reverse()),xs=polygon.map(function(p){return p.x;}),ys=polygon.map(function(p){return p.y;}),minX=Math.min.apply(null,xs),maxX=Math.max.apply(null,xs),minY=Math.min.apply(null,ys),maxY=Math.max.apply(null,ys);if(maxX<=clip.left||minX>=clip.left+clip.width||maxY<=clip.top||minY>=clip.top+clip.height)continue;
   var shadowPolygon=[];for(var k=0;k<4;k++){var x=k===0||k===3?tw-corner:corner,y=k<2?th-corner:corner;for(var j=0;j<=12;j++){var a=(k*.5+j/12*.5)*Math.PI;shadowPolygon.push(projectPlane(h,x+Math.cos(a)*corner,y+Math.sin(a)*corner));}}
   var minDen=Math.min(h[8],h[6]*tw+h[8],h[7]*th+h[8],h[6]*tw+h[7]*th+h[8]),columns=Math.max(1,Math.min(32,Math.ceil(Math.abs(h[6])*tw/minDen*32))),rows=Math.max(1,Math.min(32,Math.ceil(Math.abs(h[7])*th/minDen*32))),margin=unit*3,left=Math.max(clip.left,minX-margin),top=Math.max(clip.top,minY-margin),right=Math.min(clip.left+clip.width,maxX+margin),bottom=Math.min(clip.top+clip.height,maxY+margin),plane={matrix:h,inverse:inv,width:tw,height:th,radius:corner,columns:columns,rows:rows},instance={angle:angle,depth:depth,alpha:alpha,upper:upper,lower:lower,polygon:polygon,homography:plane,shadowPolygon:shadowPolygon};
   card.left=left;card.top=top;card.width=right-left;card.height=bottom-top;card.upper=upper;card.lower=lower;card.instances=[instance];card.alpha=alpha;card.visible=true;
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
 return{config:config,scatterPath:scatterPath,scatterWaypoints:scatterWaypoints,scatterSpecs:scatterSpecs,fanSpecs:fanSpecs,feedSpecs:feedSpecs,collageSpecs:collageSpecs,tripleSpecs:tripleSpecs,sweepSpecs:sweepSpecs,sweepEasings:sweepEasings,sweepEase:sweepEase,spreadSpecs:spreadSpecs,spreadDistribution:spreadDistribution,depthStackSpecs:depthStackSpecs,gridStripSpecs:gridStripSpecs,marqueeSpecs:marqueeSpecs,orbitGlobeSpecs:orbitGlobeSpecs,globeSpecs:globeSpecs,vortexSpecs:vortexSpecs,sphereSpecs:sphereSpecs,totemWallSpecs:totemWallSpecs,parallaxTotemSpecs:parallaxTotemSpecs,meshPoint:meshPoint,meshUV:meshUV,meshTriangles:meshTriangles,focusSliderSpecs:focusSliderSpecs,focusOrbitSpecs:focusOrbitSpecs,spotlightSpecs:spotlightSpecs,columnDriftSpecs:columnDriftSpecs,orbitCarouselSpecs:orbitCarouselSpecs,flipSpecs:flipSpecs,heroSpecs:heroSpecs,mosaicMasks:mosaicMasks,mosaicSpecs:mosaicSpecs,mosaicOrder:mosaicOrder,stripeSpecs:stripeSpecs,wipeSpecs:wipeSpecs,splitSpecs:splitSpecs,showcaseSpecs:showcaseSpecs,cascadeDeckSpecs:cascadeDeckSpecs,danceSpecs:danceSpecs,trailSpecs:trailSpecs,trailPath:trailPath,projectPlane:projectPlane,inversePlane:inversePlane,ringSpecs:ringSpecs,ringVerticalSpecs:ringVerticalSpecs,imageFocus:imageFocus,imageCrop:imageCrop,imageZoomCrop:imageZoomCrop,zoomSpecs:zoomSpecs,dropSpecs:dropSpecs,shiftSpecs:shiftSpecs,spiralSpecs:spiralSpecs,coverSpecs:coverSpecs,bottomSpecs:bottomSpecs,spinSpecs:spinSpecs,wheelSpecs:wheelSpecs,photoSpecs:photoSpecs,burstSpecs:burstSpecs,peelSpecs:peelSpecs,filmSpecs:filmSpecs,totemSpecs:totemSpecs,specs:specs,orbitSpecs:orbitSpecs,popSpecs:popSpecs,revealSpecs:revealSpecs,stageSpecs:stageSpecs,bloomSpecs:bloomSpecs,tickerSpecs:tickerSpecs,tickerLoopSpecs:tickerLoopSpecs,carouselSpecs:carouselSpecs,stackSpecs:stackSpecs,focusSpecs:focusSpecs,tossSpecs:tossSpecs,diagonalSpecs:diagonalSpecs,cascadeSpecs:cascadeSpecs,ratios:ratios,phase:phase,layout:layout};
}
window.NAGWEB_CREATE_STREAM_MODEL=createStreamModel;
window.NAGWEB_STREAM_MODEL=createStreamModel();
})();
