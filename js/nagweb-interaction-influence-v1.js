/* NagWeb Interaction Influence Field v1
   Spring-based displacement for DOM elements near a moving source.
*/
(function(root,factory){
  'use strict';
  var api=factory(root&&root.NAGWEB_INTERACTION_ENGINE);
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.NAGWEB_INTERACTION_INFLUENCE=api;
})(typeof window!=='undefined'?window:globalThis,function(engine){
  'use strict';
  var VERSION='1.2.0';
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function num(v,d){v=Number(v);return Number.isFinite(v)?v:d;}
  function normalizeOptions(input){
    input=input||{};
    return {
      radius:Math.max(1,num(input.radius,180)),
      strength:clamp(num(input.strength,1),0,3),
      maxPush:Math.max(0,num(input.maxPush,70)),
      maxRotate:Math.max(0,num(input.maxRotate,10)),
      maxScale:Math.max(0,num(input.maxScale,0.08)),
      spring:clamp(num(input.spring,0.08),0.001,1),
      damping:clamp(num(input.damping,0.84),0.05,0.999),
      sourceMode:input.sourceMode==='head'?'head':'body',
      sweptBody:input.sweptBody!==false,
      maxSweepDistance:Math.max(0,num(input.maxSweepDistance,220)),
      sourceRadius:Math.max(0,num(input.sourceRadius,0)),
      reducedMotion:input.reducedMotion||'respect'
    };
  }
  function computeRepulsion(source,target,o){
    var dx=target.x-source.x,dy=target.y-source.y,d=Math.hypot(dx,dy);
    var r=Math.max(1,o.radius+(target.radius||0)+(source.radius||0)+o.sourceRadius);
    if(d>=r)return {x:0,y:0,rotation:0,scale:1,strength:0};
    if(d<0.001){dx=1;dy=0;d=1;}
    var k=Math.pow(1-d/r,2)*o.strength;
    var push=o.maxPush*k;
    var nx=dx/d,ny=dy/d;
    return {x:nx*push,y:ny*push,rotation:ny*o.maxRotate*k,scale:1+o.maxScale*k,strength:k};
  }
  function closestPointOnSegment(point,a,b){
    var abx=b.x-a.x,aby=b.y-a.y,den=abx*abx+aby*aby;
    if(den<1e-9)return {x:a.x,y:a.y,t:0};
    var t=((point.x-a.x)*abx+(point.y-a.y)*aby)/den;t=clamp(t,0,1);
    return {x:a.x+abx*t,y:a.y+aby*t,t:t};
  }
  function computePathRepulsion(points,target,o){
    points=Array.isArray(points)?points.filter(function(p){return p&&Number.isFinite(p.x)&&Number.isFinite(p.y);}):[];
    if(!points.length)return {x:0,y:0,rotation:0,scale:1,strength:0};
    if(points.length===1)return computeRepulsion(points[0],target,o);
    var best=null,bestD=Infinity;
    for(var i=0;i<points.length-1;i++){
      var p=closestPointOnSegment(target,points[i],points[i+1]);
      var d=Math.hypot(target.x-p.x,target.y-p.y);
      if(d<bestD){bestD=d;best=p;}
    }
    return computeRepulsion(best||points[0],target,o);
  }
  function pathDistance(a,b){
    if(!Array.isArray(a)||!Array.isArray(b)||!a.length||!b.length)return Infinity;
    var n=Math.min(a.length,b.length),sum=0;
    for(var i=0;i<n;i++)sum+=Math.hypot(a[i].x-b[i].x,a[i].y-b[i].y);
    return sum/n;
  }
  function computeSweptPathRepulsion(points,previous,target,o){
    var current=computePathRepulsion(points,target,o);
    if(!o.sweptBody||!Array.isArray(previous)||previous.length<2)return current;
    var avg=pathDistance(points,previous);
    if(!Number.isFinite(avg)||avg<=0||avg>o.maxSweepDistance)return current;
    var best=current;
    var n=Math.min(points.length,previous.length);
    for(var i=0;i<n;i++){
      var p=closestPointOnSegment(target,previous[i],points[i]);
      var rep=computeRepulsion(p,target,o);
      if(rep.strength>best.strength)best=rep;
    }
    return best;
  }
  function clonePath(points){
    return Array.isArray(points)?points.map(function(p){return {x:Number(p.x)||0,y:Number(p.y)||0,radius:Number(p.radius)||0};}):null;
  }
  function springStep(state,target,o,dt){
    var frame=clamp((dt||16.6667)/16.6667,0.25,3);
    function axis(pos,vel,want){
      vel=(vel+(want-pos)*o.spring*frame)*Math.pow(o.damping,frame);
      pos+=vel*frame;return [pos,vel];
    }
    var q=axis(state.x,state.vx,target.x);state.x=q[0];state.vx=q[1];
    q=axis(state.y,state.vy,target.y);state.y=q[0];state.vy=q[1];
    q=axis(state.rotation,state.vr,target.rotation);state.rotation=q[0];state.vr=q[1];
    q=axis(state.scale,state.vs,target.scale);state.scale=q[0];state.vs=q[1];
    state.strength=target.strength;
    return state;
  }
  function newState(){return {x:0,y:0,vx:0,vy:0,rotation:0,vr:0,scale:1,vs:0,strength:0};}
  function createField(input){
    if(typeof document==='undefined')throw new Error('NagWeb Influence: browser environment required');
    input=input||{};
    if(typeof input.source!=='function')throw new Error('NagWeb Influence: source() is required');
    if(!engine||typeof engine.subscribeFrame!=='function')throw new Error('NagWeb Influence: Interaction Engine v1.4+ is required');
    var o=normalizeOptions(input),targets=[],paused=false,destroyed=false,unsub=null,previousPath=null;
    var media=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
    var reduce=o.reducedMotion==='always'||(o.reducedMotion==='respect'&&media&&media.matches);

    function makeRecord(el){
      var original={translate:el.style.translate,rotate:el.style.rotate,scale:el.style.scale,willChange:el.style.willChange};
      el.style.willChange='translate, rotate, scale';
      return {el:el,state:newState(),rest:{x:0,y:0,radius:0},original:original};
    }
    function setTargets(list){
      targets.forEach(function(t){restore(t);});
      targets=Array.from(list||[]).filter(Boolean).map(makeRecord);
      measure();
    }
    function restore(t){
      t.el.style.translate=t.original.translate;t.el.style.rotate=t.original.rotate;t.el.style.scale=t.original.scale;t.el.style.willChange=t.original.willChange;
      ['--nw-influence-x','--nw-influence-y','--nw-influence-rotation','--nw-influence-scale','--nw-influence-strength'].forEach(function(k){t.el.style.removeProperty(k);});
    }
    function measure(){
      targets.forEach(function(t){
        var tr=t.el.style.translate,rr=t.el.style.rotate,sr=t.el.style.scale;
        t.el.style.translate=t.original.translate;t.el.style.rotate=t.original.rotate;t.el.style.scale=t.original.scale;
        var r=t.el.getBoundingClientRect();
        t.rest.x=r.left+r.width/2;t.rest.y=r.top+r.height/2;t.rest.radius=Math.hypot(r.width,r.height)*0.20;
        t.el.style.translate=tr;t.el.style.rotate=rr;t.el.style.scale=sr;
      });
    }
    function apply(t){
      var s=t.state;
      t.el.style.translate=s.x.toFixed(2)+'px '+s.y.toFixed(2)+'px';
      t.el.style.rotate=s.rotation.toFixed(2)+'deg';
      t.el.style.scale=s.scale.toFixed(4);
      t.el.style.setProperty('--nw-influence-x',s.x.toFixed(2)+'px');
      t.el.style.setProperty('--nw-influence-y',s.y.toFixed(2)+'px');
      t.el.style.setProperty('--nw-influence-rotation',s.rotation.toFixed(2)+'deg');
      t.el.style.setProperty('--nw-influence-scale',s.scale.toFixed(4));
      t.el.style.setProperty('--nw-influence-strength',s.strength.toFixed(4));
    }
    function frame(now,dt){
      if(paused||destroyed)return;
      var source=input.source();
      var path=source&&Array.isArray(source.points)?source.points:null;
      var point=source&&Number.isFinite(source.x)&&Number.isFinite(source.y)?source:null;
      if(!path&&!point)return;
      targets.forEach(function(t){
        var goal=reduce?{x:0,y:0,rotation:0,scale:1,strength:0}:(path?computeSweptPathRepulsion(path,previousPath,t.rest,o):computeRepulsion(point,t.rest,o));
        springStep(t.state,goal,o,dt);apply(t);
      });
      previousPath=path?clonePath(path):null;
    }
    function onResize(){measure();}
    setTargets(input.targets||[]);
    window.addEventListener('resize',onResize,{passive:true});window.addEventListener('scroll',onResize,true);
    if(typeof ResizeObserver==='function'){
      var ro=new ResizeObserver(onResize);targets.forEach(function(t){ro.observe(t.el);});input.__ro=ro;
    }
    unsub=engine.subscribeFrame(frame);
    return {
      version:VERSION,
      get options(){return Object.assign({},o);},
      get targetCount(){return targets.length;},
      setOptions:function(next){o=normalizeOptions(Object.assign({},o,next||{}));previousPath=null;return Object.assign({},o);},
      setTargets:function(list){if(input.__ro)input.__ro.disconnect();setTargets(list);if(typeof ResizeObserver==='function'){input.__ro=new ResizeObserver(onResize);targets.forEach(function(t){input.__ro.observe(t.el);});}},
      measure:measure,
      pause:function(){paused=true;},
      resume:function(){paused=false;},
      destroy:function(){
        if(destroyed)return;destroyed=true;if(unsub)unsub();if(input.__ro)input.__ro.disconnect();
        window.removeEventListener('resize',onResize);window.removeEventListener('scroll',onResize,true);
        targets.forEach(restore);targets=[];
      }
    };
  }
  return {version:VERSION,normalizeOptions:normalizeOptions,computeRepulsion:computeRepulsion,closestPointOnSegment:closestPointOnSegment,computePathRepulsion:computePathRepulsion,pathDistance:pathDistance,computeSweptPathRepulsion:computeSweptPathRepulsion,springStep:springStep,createField:createField};
});
