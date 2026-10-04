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

  var VERSION='1.0.0';
  var DEFAULTS={
    follow:0.09,
    damping:0.82,
    maxSpeed:34,
    rotateToTarget:true,
    rotationOffset:0,
    turnSmoothing:0.18,
    tilt:0,
    speedScale:0.05,
    minScale:0.94,
    maxScale:1.08,
    idle:{enabled:true,delay:2600,amplitudeX:0.24,amplitudeY:0.16,speed:0.00024},
    reducedMotion:'respect',
    pointerDown:true,
    clampToBounds:false,
    padding:0,
    start:'center'
  };

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function lerp(a,b,t){return a+(b-a)*t;}
  function normAngle(a){return Math.atan2(Math.sin(a),Math.cos(a));}
  function deg(rad){return rad*180/Math.PI;}
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function isFiniteNumber(v){return typeof v==='number'&&Number.isFinite(v);}
  function merge(base,extra){
    var out=clone(base||{}),src=extra||{};
    Object.keys(src).forEach(function(k){
      if(src[k]&&typeof src[k]==='object'&&!Array.isArray(src[k])&&out[k]&&typeof out[k]==='object'&&!Array.isArray(out[k])) out[k]=merge(out[k],src[k]);
      else out[k]=src[k];
    });
    return out;
  }
  function normalizeOptions(input){
    var o=merge(DEFAULTS,input||{});
    o.follow=clamp(Number(o.follow)||0,0.005,0.65);
    o.damping=clamp(Number(o.damping)||0,0,0.995);
    o.maxSpeed=clamp(Number(o.maxSpeed)||0,0.5,240);
    o.turnSmoothing=clamp(Number(o.turnSmoothing)||0,0.01,1);
    o.tilt=clamp(Number(o.tilt)||0,0,45);
    o.speedScale=clamp(Number(o.speedScale)||0,0,0.5);
    o.minScale=clamp(Number(o.minScale)||0.01,0.05,4);
    o.maxScale=clamp(Number(o.maxScale)||1,0.05,4);
    if(o.minScale>o.maxScale){var t=o.minScale;o.minScale=o.maxScale;o.maxScale=t;}
    o.padding=Math.max(0,Number(o.padding)||0);
    o.rotationOffset=Number(o.rotationOffset)||0;
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

  function step(state,target,bounds,options,dt){
    var o=options, s=state;
    var frame=clamp((dt||16.6667)/16.6667,0.25,3);
    var dx=target.x-s.x,dy=target.y-s.y;
    var desiredVx=dx*o.follow*frame,desiredVy=dy*o.follow*frame;
    s.vx=(s.vx+(desiredVx-s.vx)*(1-o.damping))*Math.pow(o.damping,Math.max(0,frame-1));
    s.vy=(s.vy+(desiredVy-s.vy)*(1-o.damping))*Math.pow(o.damping,Math.max(0,frame-1));
    var speed=Math.hypot(s.vx,s.vy),limit=o.maxSpeed*frame;
    if(speed>limit&&speed>0){s.vx=s.vx/speed*limit;s.vy=s.vy/speed*limit;speed=limit;}
    s.x+=s.vx;s.y+=s.vy;

    if(o.clampToBounds&&bounds){
      var p=o.padding||0;
      s.x=clamp(s.x,bounds.x+p,bounds.x+bounds.width-p);
      s.y=clamp(s.y,bounds.y+p,bounds.y+bounds.height-p);
    }

    var desiredAngle=Math.atan2(dy,dx)+o.rotationOffset*Math.PI/180;
    if(o.rotateToTarget&&Math.hypot(dx,dy)>1){
      s.angle+=normAngle(desiredAngle-s.angle)*o.turnSmoothing*frame;
    }

    var nx=clamp(dx/Math.max(1,bounds.width*0.5),-1,1);
    var ny=clamp(dy/Math.max(1,bounds.height*0.5),-1,1);
    s.tiltX=lerp(s.tiltX,-ny*o.tilt,clamp(o.turnSmoothing*frame,0,1));
    s.tiltY=lerp(s.tiltY,nx*o.tilt,clamp(o.turnSmoothing*frame,0,1));
    var ratio=clamp(speed/Math.max(1,o.maxSpeed),0,1);
    s.scale=clamp(1+ratio*o.speedScale,o.minScale,o.maxScale);
    s.targetX=target.x;s.targetY=target.y;
    return s;
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
    var o=normalizeOptions(inputOptions);
    var area=(inputOptions&&inputOptions.area)||element.parentElement||window;
    var bounds=getBounds(area);
    var start=resolveStart(bounds,o.start);
    var s=createState(start.x,start.y);
    var target={x:start.x,y:start.y};
    var destroyed=false,paused=false,raf=0,last=performance.now(),lastInput=performance.now();
    var media=(typeof matchMedia==='function')?matchMedia('(prefers-reduced-motion: reduce)'):null;
    var reduce=o.reducedMotion==='always'||(o.reducedMotion==='respect'&&media&&media.matches);
    var motionTarget=(inputOptions&&inputOptions.motionTarget)||element;
    var original={
      translate:motionTarget.style.translate,
      rotate:motionTarget.style.rotate,
      scale:motionTarget.style.scale,
      transform:motionTarget.style.transform,
      transformOrigin:motionTarget.style.transformOrigin,
      willChange:motionTarget.style.willChange
    };
    motionTarget.style.transformOrigin=motionTarget.style.transformOrigin||'50% 50%';
    motionTarget.style.willChange='translate, rotate, scale, transform';

    function setTarget(clientX,clientY){
      bounds=getBounds(area);
      target.x=clientX;target.y=clientY;lastInput=performance.now();s.active=true;
    }
    function onMove(ev){setTarget(ev.clientX,ev.clientY);}
    function onDown(ev){if(o.pointerDown)setTarget(ev.clientX,ev.clientY);}
    function onResize(){bounds=getBounds(area);}
    function apply(){
      var x=s.x,y=s.y;
      if(area!==window&&area!==document&&area!==document.body&&area!==document.documentElement){x-=bounds.x;y-=bounds.y;}
      motionTarget.style.translate='calc('+x.toFixed(2)+'px - 50%) calc('+y.toFixed(2)+'px - 50%)';
      motionTarget.style.rotate=o.rotateToTarget?deg(s.angle).toFixed(2)+'deg':'';
      motionTarget.style.scale=s.scale.toFixed(4);
      if(o.tilt>0){
        motionTarget.style.transform='perspective(900px) rotateX('+s.tiltX.toFixed(2)+'deg) rotateY('+s.tiltY.toFixed(2)+'deg)';
      }else if(original.transform){motionTarget.style.transform=original.transform;}
      element.style.setProperty('--nw-if-x',x.toFixed(2)+'px');
      element.style.setProperty('--nw-if-y',y.toFixed(2)+'px');
      element.style.setProperty('--nw-if-angle',deg(s.angle).toFixed(2)+'deg');
      element.style.setProperty('--nw-if-speed',Math.hypot(s.vx,s.vy).toFixed(3));
      element.style.setProperty('--nw-if-scale',s.scale.toFixed(4));
    }
    function frame(now){
      if(destroyed)return;
      var dt=now-last;last=now;
      if(!paused){
        bounds=getBounds(area);
        if(reduce){
          var c=resolveStart(bounds,'center');s.x=c.x;s.y=c.y;s.vx=s.vy=0;s.angle=0;s.tiltX=s.tiltY=0;s.scale=1;
        }else{
          var useTarget=target;
          if(o.idle.enabled&&now-lastInput>=o.idle.delay) useTarget=idleTarget(now,bounds,o);
          step(s,useTarget,bounds,o,dt);
        }
        apply();
      }
      raf=requestAnimationFrame(frame);
    }

    var eventTarget=(area===window||area===document)?window:area;
    eventTarget.addEventListener('pointermove',onMove,{passive:true});
    eventTarget.addEventListener('pointerdown',onDown,{passive:true});
    window.addEventListener('resize',onResize,{passive:true});
    apply();
    raf=requestAnimationFrame(frame);

    return {
      version:VERSION,
      element:element,
      state:s,
      get options(){return clone(o);},
      setOptions:function(next){o=normalizeOptions(merge(o,next||{}));return clone(o);},
      setTarget:function(x,y){setTarget(x,y);},
      pause:function(){paused=true;},
      resume:function(){paused=false;last=performance.now();},
      reset:function(){bounds=getBounds(area);var p=resolveStart(bounds,o.start);s=createState(p.x,p.y);target={x:p.x,y:p.y};lastInput=performance.now();apply();this.state=s;},
      destroy:function(){
        if(destroyed)return;destroyed=true;cancelAnimationFrame(raf);
        eventTarget.removeEventListener('pointermove',onMove);eventTarget.removeEventListener('pointerdown',onDown);window.removeEventListener('resize',onResize);
        motionTarget.style.translate=original.translate;motionTarget.style.rotate=original.rotate;motionTarget.style.scale=original.scale;motionTarget.style.transform=original.transform;motionTarget.style.transformOrigin=original.transformOrigin;motionTarget.style.willChange=original.willChange;
        ['--nw-if-x','--nw-if-y','--nw-if-angle','--nw-if-speed','--nw-if-scale'].forEach(function(k){element.style.removeProperty(k);});
      }
    };
  }

  return {
    version:VERSION,
    defaults:clone(DEFAULTS),
    normalizeOptions:normalizeOptions,
    createState:createState,
    idleTarget:idleTarget,
    step:step,
    createFollower:createFollower,
    utils:{clamp:clamp,lerp:lerp,normAngle:normAngle}
  };
});
