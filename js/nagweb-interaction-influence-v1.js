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
  var VERSION='1.12.0';
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
  function pathBounds(points,extraPoints,padding){
    var minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity,count=0;
    function include(list){
      if(!Array.isArray(list))return;
      list.forEach(function(p){
        if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))return;
        minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y);count++;
      });
    }
    include(points);include(extraPoints);
    if(!count)return null;
    padding=Math.max(0,num(padding,0));
    return {minX:minX-padding,minY:minY-padding,maxX:maxX+padding,maxY:maxY+padding};
  }
  function pointInBounds(point,bounds){
    return !!(bounds&&point&&Number.isFinite(point.x)&&Number.isFinite(point.y)&&point.x>=bounds.minX&&point.x<=bounds.maxX&&point.y>=bounds.minY&&point.y<=bounds.maxY);
  }
  function computeSweptPathRepulsion(points,previous,target,o,knownPathDistance){
    var current=computePathRepulsion(points,target,o);
    if(!o.sweptBody||!Array.isArray(previous)||previous.length<2)return current;
    var avg=Number.isFinite(knownPathDistance)?knownPathDistance:pathDistance(points,previous);
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
  function cleanZero(v){v=Number(v)||0;return Math.abs(v)<1e-12?0:v;}
  function weightGoal(goal,weight){
    weight=clamp(Number(weight)||0,0,2);
    return {
      x:cleanZero(goal.x*weight),
      y:cleanZero(goal.y*weight),
      rotation:cleanZero(goal.rotation*weight),
      scale:cleanZero(1+(goal.scale-1)*weight),
      strength:cleanZero(goal.strength*weight)
    };
  }
  function normalizeResponse(input){
    input=input||{};
    function channel(v){return clamp(v==null?1:num(v,1),0,2);}
    return {move:channel(input.move),rotate:channel(input.rotate),scale:channel(input.scale)};
  }
  function responseGoal(goal,response){
    var r=normalizeResponse(response),presence=Math.max(r.move,r.rotate,r.scale);
    return {
      x:cleanZero(goal.x*r.move),
      y:cleanZero(goal.y*r.move),
      rotation:cleanZero(goal.rotation*r.rotate),
      scale:cleanZero(1+(goal.scale-1)*r.scale),
      strength:cleanZero(goal.strength*presence)
    };
  }
  function targetDynamics(o,returnSpeed){
    var speed=clamp(num(returnSpeed,1),.25,2);
    return Object.assign({},o,{spring:clamp(o.spring*speed,.001,1)});
  }
  function impulseGoal(input,weight,response){
    input=input||{};
    var strength=clamp(num(input.strength,1),0,3);
    var goal={
      x:num(input.x,42)*strength,
      y:num(input.y,-18)*strength,
      rotation:num(input.rotation,9)*strength,
      scale:1+num(input.scale,.08)*strength,
      strength:strength
    };
    if(weight!==1)goal=weightGoal(goal,weight);
    return responseGoal(goal,response);
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
  function stateSettled(s){
    return Math.abs(s.x)<.02&&Math.abs(s.y)<.02&&Math.abs(s.vx)<.02&&Math.abs(s.vy)<.02&&
      Math.abs(s.rotation)<.02&&Math.abs(s.vr)<.02&&Math.abs(s.scale-1)<.0005&&Math.abs(s.vs)<.0005;
  }
  function resetState(s){
    s.x=0;s.y=0;s.vx=0;s.vy=0;s.rotation=0;s.vr=0;s.scale=1;s.vs=0;s.strength=0;return s;
  }
  function goalActive(goal){
    return !!goal&&(Math.abs(goal.x)>1e-6||Math.abs(goal.y)>1e-6||Math.abs(goal.rotation)>1e-6||Math.abs(goal.scale-1)>1e-6||Math.abs(goal.strength)>1e-6);
  }
  function createField(input){
    if(typeof document==='undefined')throw new Error('NagWeb Influence: browser environment required');
    input=input||{};
    if(typeof input.source!=='function')throw new Error('NagWeb Influence: source() is required');
    if(!engine||typeof engine.subscribeFrame!=='function')throw new Error('NagWeb Influence: Interaction Engine v1.4+ is required');
    var o=normalizeOptions(input),targets=[],paused=false,destroyed=false,unsub=null,previousPath=null,maxTargetRadius=0;
    var perf={frames:0,evaluatedTargets:0,culledTargets:0,lastEvaluated:0,lastCulled:0,domWrites:0,skippedWrites:0,lastDomWrites:0,lastSkippedWrites:0,wakes:0,sleeps:0};
    var media=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
    var reduce=o.reducedMotion==='always'||(o.reducedMotion==='respect'&&media&&media.matches);

    function readTargetConfig(el){
      var rawWeight=el&&el.getAttribute&&el.getAttribute('data-nw-influence-weight');
      return {
        id:el&&el.getAttribute&&el.getAttribute('data-nw-target-id')||null,
        weight:rawWeight==null?1:clamp(num(rawWeight,1),0,2),
        response:normalizeResponse({
          move:el&&el.getAttribute&&el.getAttribute('data-nw-influence-move'),
          rotate:el&&el.getAttribute&&el.getAttribute('data-nw-influence-rotate'),
          scale:el&&el.getAttribute&&el.getAttribute('data-nw-influence-scale')
        }),
        returnSpeed:clamp(num(el&&el.getAttribute&&el.getAttribute('data-nw-influence-return'),1),.25,2),
        profile:String(el&&el.getAttribute&&el.getAttribute('data-nw-reaction-profile')||'custom').slice(0,48)
      };
    }
    function applyTargetConfig(record,config){
      if(!record||!config)return null;
      record.id=config.id;record.weight=config.weight;record.response=normalizeResponse(config.response);
      record.returnSpeed=clamp(num(config.returnSpeed,1),.25,2);record.profile=String(config.profile||'custom').slice(0,48);
      return {id:record.id,weight:record.weight,response:Object.assign({},record.response),returnSpeed:record.returnSpeed,profile:record.profile};
    }
    function makeRecord(el){
      var original={translate:el.style.translate,rotate:el.style.rotate,scale:el.style.scale,willChange:el.style.willChange};
      el.style.willChange='translate, rotate, scale';
      var config=readTargetConfig(el);
      return {el:el,id:config.id,state:newState(),rest:{x:0,y:0,radius:0},weight:config.weight,response:config.response,returnSpeed:config.returnSpeed,profile:config.profile,sleeping:true,original:original};
    }
    function targetIndex(ref){
      return targets.findIndex(function(t){return t.el===ref||t.id===ref;});
    }
    function validTargetElement(el){
      return !!(el&&el.style&&typeof el.getBoundingClientRect==='function');
    }
    function addTarget(el,skipMeasure){
      if(!validTargetElement(el)||targetIndex(el)>=0)return false;
      var rec=makeRecord(el);targets.push(rec);
      if(input.__ro)input.__ro.observe(el);
      if(!skipMeasure)measure();
      return true;
    }
    function removeTarget(ref,skipMeasure){
      var idx=targetIndex(ref);if(idx<0)return false;
      var rec=targets[idx];
      if(input.__ro)try{input.__ro.unobserve(rec.el);}catch(e){}
      restore(rec);targets.splice(idx,1);
      if(!skipMeasure)measure();
      return true;
    }
    function setTargets(list){
      var wanted=Array.from(list||[]).filter(validTargetElement);
      wanted=Array.from(new Set(wanted));
      targets.slice().forEach(function(t){if(wanted.indexOf(t.el)<0)removeTarget(t.el,true);});
      wanted.forEach(function(el){if(targetIndex(el)<0)addTarget(el,true);});
      measure();
      return targets.length;
    }
    function restore(t){
      t.el.style.translate=t.original.translate;t.el.style.rotate=t.original.rotate;t.el.style.scale=t.original.scale;t.el.style.willChange=t.original.willChange;
      ['--nw-influence-x','--nw-influence-y','--nw-influence-rotation','--nw-influence-scale','--nw-influence-strength'].forEach(function(k){t.el.style.removeProperty(k);});
    }
    function measure(){
      maxTargetRadius=0;
      targets.forEach(function(t){
        var tr=t.el.style.translate,rr=t.el.style.rotate,sr=t.el.style.scale;
        t.el.style.translate=t.original.translate;t.el.style.rotate=t.original.rotate;t.el.style.scale=t.original.scale;
        var r=t.el.getBoundingClientRect();
        t.rest.x=r.left+r.width/2;t.rest.y=r.top+r.height/2;t.rest.radius=Math.hypot(r.width,r.height)*0.20;
        maxTargetRadius=Math.max(maxTargetRadius,t.rest.radius);
        t.el.style.translate=tr;t.el.style.rotate=rr;t.el.style.scale=sr;
      });
    }
    function clearMotion(t){
      t.el.style.translate=t.original.translate;t.el.style.rotate=t.original.rotate;t.el.style.scale=t.original.scale;
      ['--nw-influence-x','--nw-influence-y','--nw-influence-rotation','--nw-influence-scale','--nw-influence-strength'].forEach(function(k){t.el.style.removeProperty(k);});
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
      var zero={x:0,y:0,rotation:0,scale:1,strength:0},evaluated=0,culled=0,sweepDistance=Infinity,sweepActive=false,bounds=null;
      if(path){
        if(o.sweptBody&&Array.isArray(previousPath)&&previousPath.length>1){
          sweepDistance=pathDistance(path,previousPath);
          sweepActive=Number.isFinite(sweepDistance)&&sweepDistance>0&&sweepDistance<=o.maxSweepDistance;
        }
        bounds=pathBounds(path,sweepActive?previousPath:null,o.radius+o.sourceRadius+maxTargetRadius);
      }
      var writes=0,skipped=0;
      targets.forEach(function(t){
        var goal;
        if(reduce)goal=zero;
        else if(path&&bounds&&!pointInBounds(t.rest,bounds)){goal=zero;culled++;}
        else{
          goal=path?computeSweptPathRepulsion(path,previousPath,t.rest,o,sweepDistance):computeRepulsion(point,t.rest,o);
          evaluated++;
        }
        if(!reduce&&t.weight!==1)goal=weightGoal(goal,t.weight);
        if(!reduce)goal=responseGoal(goal,t.response);
        var active=goalActive(goal);
        if(t.sleeping&&!active){skipped++;return;}
        if(t.sleeping&&active){t.sleeping=false;perf.wakes++;}
        springStep(t.state,goal,targetDynamics(o,t.returnSpeed),dt);
        if(!active&&stateSettled(t.state)){
          resetState(t.state);clearMotion(t);writes++;t.sleeping=true;perf.sleeps++;
        }else{apply(t);writes++;}
      });
      perf.frames++;perf.lastEvaluated=evaluated;perf.lastCulled=culled;perf.evaluatedTargets+=evaluated;perf.culledTargets+=culled;
      perf.lastDomWrites=writes;perf.lastSkippedWrites=skipped;perf.domWrites+=writes;perf.skippedWrites+=skipped;
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
      get targetWeights(){return targets.map(function(t){return t.weight;});},
      get targetIds(){return targets.map(function(t){return t.id;});},
      get targetResponses(){return targets.map(function(t){return Object.assign({},t.response);});},
      get targetReturnSpeeds(){return targets.map(function(t){return t.returnSpeed;});},
      get targetProfiles(){return targets.map(function(t){return t.profile;});},
      get stats(){return {frames:perf.frames,targetCount:targets.length,evaluatedTargets:perf.evaluatedTargets,culledTargets:perf.culledTargets,lastEvaluated:perf.lastEvaluated,lastCulled:perf.lastCulled,domWrites:perf.domWrites,skippedWrites:perf.skippedWrites,lastDomWrites:perf.lastDomWrites,lastSkippedWrites:perf.lastSkippedWrites,wakes:perf.wakes,sleeps:perf.sleeps,sleepingTargets:targets.filter(function(t){return t.sleeping;}).length,broadphase:true,sleepWake:true};},
      getTargetProfile:function(ref){
        var hit=targets.find(function(t){return t.el===ref||t.id===ref;});
        return hit?hit.profile:null;
      },
      setTargetWeight:function(ref,weight){
        weight=clamp(num(weight,1),0,2);
        var hit=targets.find(function(t){return t.el===ref||t.id===ref;});
        if(!hit)return null;
        hit.weight=weight;hit.profile='custom';
        if(hit.el&&hit.el.setAttribute){hit.el.setAttribute('data-nw-influence-weight',String(weight));hit.el.setAttribute('data-nw-reaction-profile','custom');}
        return hit.weight;
      },
      getTargetWeight:function(ref){
        var hit=targets.find(function(t){return t.el===ref||t.id===ref;});
        return hit?hit.weight:null;
      },
      setTargetResponse:function(ref,next){
        var hit=targets.find(function(t){return t.el===ref||t.id===ref;});
        if(!hit)return null;
        hit.response=normalizeResponse(Object.assign({},hit.response,next||{}));hit.profile='custom';
        if(hit.el&&hit.el.setAttribute){
          hit.el.setAttribute('data-nw-reaction-profile','custom');
          hit.el.setAttribute('data-nw-influence-move',String(hit.response.move));
          hit.el.setAttribute('data-nw-influence-rotate',String(hit.response.rotate));
          hit.el.setAttribute('data-nw-influence-scale',String(hit.response.scale));
        }
        return Object.assign({},hit.response);
      },
      getTargetResponse:function(ref){
        var hit=targets.find(function(t){return t.el===ref||t.id===ref;});
        return hit?Object.assign({},hit.response):null;
      },
      setTargetReturnSpeed:function(ref,speed){
        var hit=targets.find(function(t){return t.el===ref||t.id===ref;});
        if(!hit)return null;
        hit.returnSpeed=clamp(num(speed,1),.25,2);hit.profile='custom';
        if(hit.el&&hit.el.setAttribute){hit.el.setAttribute('data-nw-influence-return',String(hit.returnSpeed));hit.el.setAttribute('data-nw-reaction-profile','custom');}
        return hit.returnSpeed;
      },
      getTargetReturnSpeed:function(ref){
        var hit=targets.find(function(t){return t.el===ref||t.id===ref;});
        return hit?hit.returnSpeed:null;
      },
      impulseTarget:function(ref,impulse){
        var hit=targets.find(function(t){return t.el===ref||t.id===ref;});
        if(!hit)return null;
        var goal=impulseGoal(impulse,hit.weight,hit.response);
        hit.state.x=goal.x;hit.state.y=goal.y;hit.state.rotation=goal.rotation;hit.state.scale=goal.scale;hit.state.strength=goal.strength;
        hit.state.vx=0;hit.state.vy=0;hit.state.vr=0;hit.state.vs=0;
        if(hit.sleeping){hit.sleeping=false;perf.wakes++;}
        apply(hit);
        return {x:hit.state.x,y:hit.state.y,rotation:hit.state.rotation,scale:hit.state.scale,strength:hit.state.strength};
      },
      getTargetState:function(ref){
        var hit=targets.find(function(t){return t.el===ref||t.id===ref;});
        return hit?Object.assign({},hit.state):null;
      },
      setOptions:function(next){o=normalizeOptions(Object.assign({},o,next||{}));previousPath=null;return Object.assign({},o);},
      hasTarget:function(ref){return targetIndex(ref)>=0;},
      addTarget:function(el){return addTarget(el,false);},
      removeTarget:function(ref){return removeTarget(ref,false);},
      setTargets:function(list){return setTargets(list);},
      syncTarget:function(ref){
        var idx=targetIndex(ref);if(idx<0)return null;
        return applyTargetConfig(targets[idx],readTargetConfig(targets[idx].el));
      },
      syncTargets:function(){
        return targets.map(function(t){return applyTargetConfig(t,readTargetConfig(t.el));});
      },
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
  return {version:VERSION,normalizeOptions:normalizeOptions,readTargetConfig:readTargetConfig,computeRepulsion:computeRepulsion,closestPointOnSegment:closestPointOnSegment,computePathRepulsion:computePathRepulsion,pathDistance:pathDistance,pathBounds:pathBounds,pointInBounds:pointInBounds,computeSweptPathRepulsion:computeSweptPathRepulsion,weightGoal:weightGoal,normalizeResponse:normalizeResponse,responseGoal:responseGoal,targetDynamics:targetDynamics,impulseGoal:impulseGoal,springStep:springStep,stateSettled:stateSettled,resetState:resetState,goalActive:goalActive,createField:createField};
});
