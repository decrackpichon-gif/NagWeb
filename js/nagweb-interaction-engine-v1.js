/* NagWeb Interaction Engine v1
   Generic pointer-following motion for any visual asset.
   Standalone by design: no editor globals required.
*/
(function(root,factory){
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.NAGWEB_INTERACTION_ENGINE=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  var VERSION='1.5.0';
  var SCHEMA='nagweb-interaction-follower';
  var INSTANCES=new Set(), TICKS=new Set(), TICKING=false, TICK_ID=0, LAST_TICK=0, FRAME_COUNT=0, LAST_DT=0;
  var POINTER_HUBS=new WeakMap(), POINTER_HUB_COUNT=0, POINTER_SUBSCRIBERS=0;
  function runtimeFrame(now){
    if(!TICKING)return;
    var dt=LAST_TICK?now-LAST_TICK:16.6667;LAST_TICK=now;LAST_DT=dt;FRAME_COUNT++;
    TICKS.forEach(function(fn){fn(now,dt);});
    if(TICKS.size)TICK_ID=requestAnimationFrame(runtimeFrame);
    else {TICKING=false;TICK_ID=0;LAST_TICK=0;}
  }
  function addTick(fn){
    TICKS.add(fn);
    if(!TICKING&&TICKS.size){TICKING=true;LAST_TICK=performance.now();TICK_ID=requestAnimationFrame(runtimeFrame);}
  }
  function removeTick(fn){
    TICKS.delete(fn);
    if(!TICKS.size&&TICKING){cancelAnimationFrame(TICK_ID);TICKING=false;TICK_ID=0;LAST_TICK=0;}
  }
  function subscribePointer(target,handlers){
    var hub=POINTER_HUBS.get(target);
    if(!hub){
      hub={subs:new Set()};
      hub.move=function(ev){hub.subs.forEach(function(s){if(s.move)s.move(ev);});};
      hub.down=function(ev){hub.subs.forEach(function(s){if(s.down)s.down(ev);});};
      hub.enter=function(ev){hub.subs.forEach(function(s){if(s.enter)s.enter(ev);});};
      hub.leave=function(ev){hub.subs.forEach(function(s){if(s.leave)s.leave(ev);});};
      target.addEventListener('pointermove',hub.move,{passive:true});
      target.addEventListener('pointerdown',hub.down,{passive:true});
      target.addEventListener('pointerenter',hub.enter,{passive:true});
      target.addEventListener('pointerleave',hub.leave,{passive:true});
      POINTER_HUBS.set(target,hub);POINTER_HUB_COUNT++;
    }
    hub.subs.add(handlers);POINTER_SUBSCRIBERS++;
    var live=true;
    return function(){
      if(!live)return;live=false;
      if(hub.subs.delete(handlers))POINTER_SUBSCRIBERS--;
      if(!hub.subs.size){
        target.removeEventListener('pointermove',hub.move);target.removeEventListener('pointerdown',hub.down);
        target.removeEventListener('pointerenter',hub.enter);target.removeEventListener('pointerleave',hub.leave);
        POINTER_HUBS.delete(target);POINTER_HUB_COUNT--;
      }
    };
  }
  function runtimeStats(){return {instances:INSTANCES.size,active:TICKS.size,running:TICKING,frames:FRAME_COUNT,lastDt:LAST_DT,pointerHubs:POINTER_HUB_COUNT,pointerSubscribers:POINTER_SUBSCRIBERS};}

  var PRESETS={
    soft:{label:'Suave',follow:0.065,damping:0.87,maxSpeed:28,turnSmoothing:0.12,tilt:4,speedScale:0.025,distanceFromPointer:20,idle:{enabled:true,delay:2600,amplitudeX:0.18,amplitudeY:0.12,speed:0.00020}},
    floating:{label:'Flotante',follow:0.045,damping:0.91,maxSpeed:22,turnSmoothing:0.09,tilt:10,speedScale:0.045,distanceFromPointer:28,idle:{enabled:true,delay:1900,amplitudeX:0.27,amplitudeY:0.19,speed:0.00018}},
    agile:{label:'Ágil',follow:0.16,damping:0.70,maxSpeed:58,turnSmoothing:0.34,tilt:6,speedScale:0.055,distanceFromPointer:8,idle:{enabled:true,delay:3200,amplitudeX:0.18,amplitudeY:0.13,speed:0.00030}},
    heavy:{label:'Pesado',follow:0.04,damping:0.94,maxSpeed:19,turnSmoothing:0.065,tilt:3,speedScale:0.015,distanceFromPointer:38,idle:{enabled:true,delay:3000,amplitudeX:0.13,amplitudeY:0.09,speed:0.00014}},
    magnetic:{label:'Magnético',follow:0.23,damping:0.61,maxSpeed:78,turnSmoothing:0.46,tilt:5,speedScale:0.085,distanceFromPointer:0,idle:{enabled:false,delay:2600,amplitudeX:0.15,amplitudeY:0.10,speed:0.00024}},
    character:{label:'Personaje',follow:0.082,damping:0.84,maxSpeed:31,turnSmoothing:0.16,tilt:7,speedScale:0.025,distanceFromPointer:54,idle:{enabled:true,delay:2400,amplitudeX:0.20,amplitudeY:0.12,speed:0.00019}}
  };
  var DEFAULTS={
    preset:'custom',
    follow:0.09,
    damping:0.82,
    maxSpeed:34,
    rotateToTarget:true,
    assetForwardAngle:0,
    rotationOffset:0,
    turnSmoothing:0.18,
    tilt:0,
    speedScale:0.05,
    minScale:0.94,
    maxScale:1.08,
    distanceFromPointer:0,
    idle:{enabled:true,delay:2600,amplitudeX:0.24,amplitudeY:0.16,speed:0.00024},
    reducedMotion:'respect',
    pointerDown:true,
    leaveBehavior:'idle',
    pauseWhenHidden:true,
    edgeMode:'free',
    edgePadding:0,
    start:'center'
  };

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function lerp(a,b,t){return a+(b-a)*t;}
  function normAngle(a){return Math.atan2(Math.sin(a),Math.cos(a));}
  function deg(rad){return rad*180/Math.PI;}
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function isFiniteNumber(v){return typeof v==='number'&&Number.isFinite(v);}
  function plainInput(input){
    var src=input||{},out={};
    Object.keys(src).forEach(function(k){
      if(k==='area'||k==='motionTarget'||k==='variableTarget'||k==='renderMode'||k==='onRender')return;
      out[k]=src[k];
    });
    return out;
  }
  function merge(base,extra){
    var out=clone(base||{}),src=extra||{};
    Object.keys(src).forEach(function(k){
      if(src[k]&&typeof src[k]==='object'&&!Array.isArray(src[k])&&out[k]&&typeof out[k]==='object'&&!Array.isArray(out[k])) out[k]=merge(out[k],src[k]);
      else out[k]=src[k];
    });
    return out;
  }
  function presetOptions(name){
    var p=PRESETS[name];
    return p?clone(p):null;
  }
  function normalizeOptions(input){
    var clean=plainInput(input);
    var named=clean.preset&&PRESETS[clean.preset]?clean.preset:null;
    var o=merge(DEFAULTS,named?PRESETS[named]:{});
    o=merge(o,clean);
    o.preset=named||clean.preset||'custom';
    if(!PRESETS[o.preset]&&o.preset!=='custom')o.preset='custom';
    o.follow=clamp(Number(o.follow)||0,0.005,0.65);
    o.damping=clamp(Number(o.damping)||0,0,0.995);
    o.maxSpeed=clamp(Number(o.maxSpeed)||0,0.5,240);
    o.turnSmoothing=clamp(Number(o.turnSmoothing)||0,0.01,1);
    o.tilt=clamp(Number(o.tilt)||0,0,45);
    o.speedScale=clamp(Number(o.speedScale)||0,0,0.5);
    o.minScale=clamp(Number(o.minScale)||0.01,0.05,4);
    o.maxScale=clamp(Number(o.maxScale)||1,0.05,4);
    if(o.minScale>o.maxScale){var t=o.minScale;o.minScale=o.maxScale;o.maxScale=t;}
    o.distanceFromPointer=clamp(Number(o.distanceFromPointer)||0,0,2000);
    o.edgePadding=Math.max(0,Number(o.edgePadding)||0);
    o.assetForwardAngle=Number(o.assetForwardAngle)||0;
    o.rotationOffset=Number(o.rotationOffset)||0;
    o.edgeMode=o.edgeMode==='contain'?'contain':'free';
    o.leaveBehavior=['idle','hold','center'].indexOf(o.leaveBehavior)>=0?o.leaveBehavior:'idle';
    o.pauseWhenHidden=o.pauseWhenHidden!==false;
    o.idle=o.idle||{};
    o.idle.enabled=o.idle.enabled!==false;
    o.idle.delay=Math.max(0,Number(o.idle.delay)||0);
    o.idle.amplitudeX=clamp(Number(o.idle.amplitudeX)||0,0,0.8);
    o.idle.amplitudeY=clamp(Number(o.idle.amplitudeY)||0,0,0.8);
    o.idle.speed=clamp(Number(o.idle.speed)||0.00024,0.00001,0.01);
    return o;
  }

  function createState(x,y){
    return {x:x||0,y:y||0,vx:0,vy:0,angle:0,tiltX:0,tiltY:0,scale:1,targetX:x||0,targetY:y||0,lastInput:0,active:false};
  }

  function idleTarget(now,bounds,o){
    var t=now*o.idle.speed;
    return {
      x:bounds.x+bounds.width*0.5+Math.sin(t*1.3)*bounds.width*o.idle.amplitudeX,
      y:bounds.y+bounds.height*0.5+Math.sin(t*2.1+1)*bounds.height*o.idle.amplitudeY
    };
  }

  function resolveFollowTarget(state,target,distance){
    var d=Math.max(0,Number(distance)||0);
    if(!d)return {x:target.x,y:target.y};
    var dx=target.x-state.x,dy=target.y-state.y,len=Math.hypot(dx,dy);
    if(len<=d||len<0.0001)return {x:state.x,y:state.y};
    return {x:target.x-dx/len*d,y:target.y-dy/len*d};
  }

  function constrainState(state,bounds,size,o){
    if(!bounds||o.edgeMode!=='contain')return state;
    var halfW=Math.max(0,(size&&size.width||0)/2),halfH=Math.max(0,(size&&size.height||0)/2),p=o.edgePadding||0;
    var minX=bounds.x+halfW+p,maxX=bounds.x+bounds.width-halfW-p;
    var minY=bounds.y+halfH+p,maxY=bounds.y+bounds.height-halfH-p;
    if(minX>maxX)minX=maxX=bounds.x+bounds.width/2;
    if(minY>maxY)minY=maxY=bounds.y+bounds.height/2;
    var ox=state.x,oy=state.y;
    state.x=clamp(state.x,minX,maxX);state.y=clamp(state.y,minY,maxY);
    if(state.x!==ox)state.vx=0;
    if(state.y!==oy)state.vy=0;
    return state;
  }

  function step(state,target,bounds,options,dt,size){
    var o=options, s=state;
    var frame=clamp((dt||16.6667)/16.6667,0.25,3);
    var effective=resolveFollowTarget(s,target,o.distanceFromPointer);
    var dx=effective.x-s.x,dy=effective.y-s.y;
    var pointerDx=target.x-s.x,pointerDy=target.y-s.y;
    var desiredVx=dx*o.follow*frame,desiredVy=dy*o.follow*frame;
    s.vx=(s.vx+(desiredVx-s.vx)*(1-o.damping))*Math.pow(o.damping,Math.max(0,frame-1));
    s.vy=(s.vy+(desiredVy-s.vy)*(1-o.damping))*Math.pow(o.damping,Math.max(0,frame-1));
    var speed=Math.hypot(s.vx,s.vy),limit=o.maxSpeed*frame;
    if(speed>limit&&speed>0){s.vx=s.vx/speed*limit;s.vy=s.vy/speed*limit;speed=limit;}
    s.x+=s.vx;s.y+=s.vy;
    constrainState(s,bounds,size,o);

    var desiredAngle=Math.atan2(pointerDy,pointerDx)-o.assetForwardAngle*Math.PI/180+o.rotationOffset*Math.PI/180;
    if(o.rotateToTarget&&Math.hypot(pointerDx,pointerDy)>1){
      s.angle+=normAngle(desiredAngle-s.angle)*o.turnSmoothing*frame;
    }

    var nx=clamp(pointerDx/Math.max(1,bounds.width*0.5),-1,1);
    var ny=clamp(pointerDy/Math.max(1,bounds.height*0.5),-1,1);
    s.tiltX=lerp(s.tiltX,-ny*o.tilt,clamp(o.turnSmoothing*frame,0,1));
    s.tiltY=lerp(s.tiltY,nx*o.tilt,clamp(o.turnSmoothing*frame,0,1));
    var ratio=clamp(speed/Math.max(1,o.maxSpeed),0,1);
    s.scale=clamp(1+ratio*o.speedScale,o.minScale,o.maxScale);
    s.targetX=target.x;s.targetY=target.y;
    return s;
  }

  function serializeOptions(options){
    return JSON.stringify({schema:SCHEMA,version:1,options:normalizeOptions(options)});
  }
  function deserializeOptions(value){
    var data=typeof value==='string'?JSON.parse(value):clone(value);
    if(!data||data.schema!==SCHEMA||data.version!==1||!data.options)throw new Error('NagWeb Interaction Engine: invalid follower config');
    return normalizeOptions(data.options);
  }

  function getBounds(el){
    if(!el||el===window||el===document||el===document.documentElement||el===document.body){
      return {x:0,y:0,width:window.innerWidth,height:window.innerHeight};
    }
    var r=el.getBoundingClientRect();
    return {x:r.left,y:r.top,width:r.width,height:r.height};
  }

  function resolveStart(bounds,start){
    if(start&&typeof start==='object'&&isFiniteNumber(start.x)&&isFiniteNumber(start.y)) return {x:start.x,y:start.y};
    return {x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2};
  }

  function createFollower(element,inputOptions){
    if(!element||!element.style) throw new Error('NagWeb Interaction Engine: element is required');
    inputOptions=inputOptions||{};
    var o=normalizeOptions(inputOptions);
    var area=inputOptions.area||element.parentElement||window;
    var bounds=getBounds(area);
    var start=resolveStart(bounds,o.start);
    var s=createState(start.x,start.y);
    var target={x:start.x,y:start.y};
    var destroyed=false,paused=false,hidden=false,pointerInside=true,lastInput=performance.now();
    var media=(typeof matchMedia==='function')?matchMedia('(prefers-reduced-motion: reduce)'):null;
    var reduce=o.reducedMotion==='always'||(o.reducedMotion==='respect'&&media&&media.matches);
    var motionTarget=inputOptions.motionTarget||element;
    var variableTarget=inputOptions.variableTarget||motionTarget;
    var renderMode=['variables','none'].indexOf(inputOptions.renderMode)>=0?inputOptions.renderMode:'style';
    var onRender=typeof inputOptions.onRender==='function'?inputOptions.onRender:null;
    var original={
      translate:motionTarget.style.translate,
      rotate:motionTarget.style.rotate,
      scale:motionTarget.style.scale,
      transform:motionTarget.style.transform,
      transformOrigin:motionTarget.style.transformOrigin,
      willChange:motionTarget.style.willChange
    };
    var varNames=['--nw-if-x','--nw-if-y','--nw-if-angle','--nw-if-speed','--nw-if-scale'];
    var originalVars={};varNames.forEach(function(k){originalVars[k]=variableTarget.style.getPropertyValue(k);});
    if(renderMode==='style'){
      motionTarget.style.transformOrigin=motionTarget.style.transformOrigin||'50% 50%';
      motionTarget.style.willChange='translate, rotate, scale, transform';
    }
    var size={width:0,height:0},sizeObserver=null,areaObserver=null;
    function refreshSize(){var r=element.getBoundingClientRect();size.width=r.width;size.height=r.height;}
    refreshSize();

    function setTarget(clientX,clientY){
      bounds=getBounds(area);
      target.x=clientX;target.y=clientY;lastInput=performance.now();s.active=true;pointerInside=true;
    }
    function onMove(ev){setTarget(ev.clientX,ev.clientY);}
    function onDown(ev){if(o.pointerDown)setTarget(ev.clientX,ev.clientY);}
    function onEnter(){pointerInside=true;}
    function onLeave(){
      pointerInside=false;
      if(o.leaveBehavior==='center'){var c=resolveStart(getBounds(area),'center');target.x=c.x;target.y=c.y;lastInput=performance.now();}
      else if(o.leaveBehavior==='idle') lastInput=performance.now()-o.idle.delay;
    }
    function onVisibility(){
      hidden=!!(o.pauseWhenHidden&&document.hidden);
      if(hidden)removeTick(frame);
      else if(!paused&&!destroyed)addTick(frame);
    }
    function onResize(){bounds=getBounds(area);refreshSize();}
    function apply(){
      var x=s.x,y=s.y;
      if(area!==window&&area!==document&&area!==document.body&&area!==document.documentElement){x-=bounds.x;y-=bounds.y;}
      var values={x:x,y:y,angle:deg(s.angle),speed:Math.hypot(s.vx,s.vy),scale:s.scale,tiltX:s.tiltX,tiltY:s.tiltY};
      if(renderMode==='style'){
        motionTarget.style.translate='calc('+x.toFixed(2)+'px - 50%) calc('+y.toFixed(2)+'px - 50%)';
        motionTarget.style.rotate=o.rotateToTarget?values.angle.toFixed(2)+'deg':'';
        motionTarget.style.scale=s.scale.toFixed(4);
        if(o.tilt>0)motionTarget.style.transform='perspective(900px) rotateX('+s.tiltX.toFixed(2)+'deg) rotateY('+s.tiltY.toFixed(2)+'deg)';
        else motionTarget.style.transform=original.transform;
      }
      if(renderMode!=='none'){
        variableTarget.style.setProperty('--nw-if-x',x.toFixed(2)+'px');
        variableTarget.style.setProperty('--nw-if-y',y.toFixed(2)+'px');
        variableTarget.style.setProperty('--nw-if-angle',values.angle.toFixed(2)+'deg');
        variableTarget.style.setProperty('--nw-if-speed',values.speed.toFixed(3));
        variableTarget.style.setProperty('--nw-if-scale',s.scale.toFixed(4));
      }
      if(onRender)onRender(values,s);
    }
    function frame(now,dt){
      if(destroyed)return;
      if(!paused&&!hidden){
        if(reduce){
          var c=resolveStart(bounds,'center');s.x=c.x;s.y=c.y;s.vx=s.vy=0;s.angle=0;s.tiltX=s.tiltY=0;s.scale=1;
        }else{
          var useTarget=target;
          if(o.idle.enabled&&now-lastInput>=o.idle.delay) useTarget=idleTarget(now,bounds,o);
          step(s,useTarget,bounds,o,dt,size);
        }
        apply();
      }
    }

    var eventTarget=(area===window||area===document)?window:area;
    var unsubscribePointer=subscribePointer(eventTarget,{move:onMove,down:onDown,enter:onEnter,leave:onLeave});
    window.addEventListener('resize',onResize,{passive:true});
    window.addEventListener('scroll',onResize,true);
    document.addEventListener('visibilitychange',onVisibility,{passive:true});
    if(typeof ResizeObserver==='function'){
      sizeObserver=new ResizeObserver(refreshSize);sizeObserver.observe(element);
      if(area&&area!==window&&area!==document){areaObserver=new ResizeObserver(onResize);areaObserver.observe(area);}
    }
    var instanceToken={};INSTANCES.add(instanceToken);addTick(frame);onVisibility();
    apply();

    return {
      version:VERSION,
      element:element,
      state:s,
      get options(){return clone(o);},
      setOptions:function(next){
        var clean=plainInput(next||{});
        if(clean.preset&&PRESETS[clean.preset])o=normalizeOptions(clean);
        else {delete clean.preset;o=normalizeOptions(merge(o,clean));o.preset='custom';}
        onVisibility();
        return clone(o);
      },
      applyPreset:function(name,overrides){
        if(!PRESETS[name])throw new Error('NagWeb Interaction Engine: unknown preset '+name);
        o=normalizeOptions(merge({preset:name},overrides||{}));
        onVisibility();
        return clone(o);
      },
      setTarget:function(x,y,space){
        bounds=getBounds(area);
        if(space==='area'){x+=bounds.x;y+=bounds.y;}
        setTarget(x,y);
      },
      get status(){return {paused:paused,hidden:hidden,pointerInside:pointerInside,destroyed:destroyed,renderMode:renderMode};},
      pause:function(){paused=true;removeTick(frame);},
      resume:function(){paused=false;if(!hidden&&!destroyed)addTick(frame);},
      reset:function(){bounds=getBounds(area);var p=resolveStart(bounds,o.start);s=createState(p.x,p.y);target={x:p.x,y:p.y};lastInput=performance.now();apply();this.state=s;},
      serialize:function(){return serializeOptions(o);},
      destroy:function(){
        if(destroyed)return;destroyed=true;removeTick(frame);INSTANCES.delete(instanceToken);
        unsubscribePointer();window.removeEventListener('resize',onResize);window.removeEventListener('scroll',onResize,true);document.removeEventListener('visibilitychange',onVisibility);
        if(sizeObserver)sizeObserver.disconnect();if(areaObserver)areaObserver.disconnect();
        if(renderMode==='style'){
          motionTarget.style.translate=original.translate;motionTarget.style.rotate=original.rotate;motionTarget.style.scale=original.scale;motionTarget.style.transform=original.transform;motionTarget.style.transformOrigin=original.transformOrigin;motionTarget.style.willChange=original.willChange;
        }
        varNames.forEach(function(k){if(originalVars[k])variableTarget.style.setProperty(k,originalVars[k]);else variableTarget.style.removeProperty(k);});
      }
    };
  }

  return {
    version:VERSION,
    schema:SCHEMA,
    defaults:clone(DEFAULTS),
    presets:clone(PRESETS),
    presetOptions:presetOptions,
    normalizeOptions:normalizeOptions,
    createState:createState,
    idleTarget:idleTarget,
    resolveFollowTarget:resolveFollowTarget,
    constrainState:constrainState,
    step:step,
    serializeOptions:serializeOptions,
    deserializeOptions:deserializeOptions,
    createFollower:createFollower,
    subscribeFrame:function(fn){
      if(typeof fn!=='function')throw new Error('NagWeb Interaction Engine: frame subscriber must be a function');
      addTick(fn);
      var live=true;
      return function(){if(!live)return;live=false;removeTick(fn);};
    },
    runtimeStats:runtimeStats,
    utils:{clamp:clamp,lerp:lerp,normAngle:normAngle}
  };
});
