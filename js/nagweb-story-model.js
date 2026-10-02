/* Modelo puro, compartido por el editor y el único runtime exportado del Director.
   Los valores son relativos al diseño base. El easing pertenece al tramo saliente. */
(function(){
'use strict';
function createStoryModel(){
 var properties={
  x:{label:'Movimiento horizontal',unit:'px',base:0,min:-10000,max:10000},
  y:{label:'Movimiento vertical',unit:'px',base:0,min:-10000,max:10000},
  scale:{label:'Escala',unit:'%',base:100,min:0,max:1000},
  rotate:{label:'Rotación',unit:'°',base:0,min:-3600,max:3600},
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
  return{x:x,y:y,scale:sc*100,rotate:rot,opacity:clamp(op,0,1)*100,blur:blur};
 }
 function compile(e){
  var frames=e.sdKeyframesEnabled===false?[]:normalize(e.sdKeyframes);
  if(frames.length)return{id:e.id,keyframes:frames.map(function(f){var k=Object.assign({},f);delete k.id;return k;})};
  return{id:e.id,start:number(e.sdStart,0),end:number(e.sdEnd,82),span:number(e.sdSpan,8),enter:e.sdEnter||'fade',exit:e.sdExit||'keep',moveX:number(e.sdMoveX,0),moveY:number(e.sdMoveY,0),rotate:number(e.sdRotate,0),scale:number(e.sdScale,100)};
 }
 function evaluate(c,p,k,reduce){
  var out=c.keyframes&&c.keyframes.length?framesAt(c.keyframes,p):legacy(c,clamp(number(p,0),0,1),k||'cinematic');
  // Preserve base styling and narrative visibility. Neutralize only added motion/filter.
  if(reduce){out.x=0;out.y=0;out.scale=100;out.rotate=0;out.blur=0;}
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
})();
