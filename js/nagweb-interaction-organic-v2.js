/* NagWeb Organic Follower V2
   Flexible spine + sliced 2D asset renderer.
   V2.2 adds anti-seam compositing and protected rigid zones near the leading end.
*/
(function(root,factory){
  'use strict';
  var api=factory(root&&root.NAGWEB_INTERACTION_ENGINE,root&&root.NAGWEB_INTERACTION_ASSET_PREP);
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.NAGWEB_ORGANIC_FOLLOWER=api;
})(typeof window!=='undefined'?window:globalThis,function(engine,assetPrep){
  'use strict';

  var VERSION='2.2.0-alpha.1';
  var DEFAULTS={
    points:30,
    slices:72,
    length:380,
    sway:0.04,
    swayWaves:4.2,
    swayPower:1.8,
    phaseBase:0.07,
    phaseSpeed:0.13,
    activityBase:0.45,
    activitySpeed:0.8,
    overlap:1.72,
    seamGuard:0.72,
    sourceBleed:0.10,
    headRigidFraction:0.24,
    headMaxBend:0.11,
    bodyMaxBend:0.34,
    turnProtection:0.72,
    leadEnd:'right',
    shadow:true,
    shadowBlur:0.045,
    shadowOffsetX:0.035,
    shadowOffsetY:0.06,
    maxDpr:2,
    reducedMotion:'respect'
  };

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function lerp(a,b,t){return a+(b-a)*t;}
  function smoothstep(a,b,x){if(a===b)return x>=b?1:0;var t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);}
  function angleDelta(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b));}
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function merge(a,b){var o=clone(a||{});Object.keys(b||{}).forEach(function(k){o[k]=b[k];});return o;}

  function normalizeOptions(input){
    var o=merge(DEFAULTS,input||{});
    o.points=Math.round(clamp(Number(o.points)||30,6,120));
    o.slices=Math.round(clamp(Number(o.slices)||72,12,180));
    o.length=clamp(Number(o.length)||380,40,2400);
    o.sway=clamp(Number(o.sway)||0,0,0.25);
    o.swayWaves=clamp(Number(o.swayWaves)||4.2,0.2,12);
    o.swayPower=clamp(Number(o.swayPower)||1.8,0.2,5);
    o.phaseBase=clamp(Number(o.phaseBase)||0,0,1);
    o.phaseSpeed=clamp(Number(o.phaseSpeed)||0,0,1);
    o.activityBase=clamp(Number(o.activityBase)||0,0,2);
    o.activitySpeed=clamp(Number(o.activitySpeed)||0,0,3);
    o.overlap=clamp(Number(o.overlap)||1.72,1,3);
    o.seamGuard=clamp(Number(o.seamGuard)||0,0,2.5);
    o.sourceBleed=clamp(Number(o.sourceBleed)||0,0,0.45);
    o.headRigidFraction=clamp(Number(o.headRigidFraction)||0,0,0.65);
    o.headMaxBend=clamp(Number(o.headMaxBend)||0.11,0.015,1.2);
    o.bodyMaxBend=clamp(Number(o.bodyMaxBend)||0.34,o.headMaxBend,1.4);
    o.turnProtection=clamp(Number(o.turnProtection)||0,0,1);
    o.leadEnd=o.leadEnd==='left'?'left':'right';
    o.shadow=o.shadow!==false;
    o.shadowBlur=clamp(Number(o.shadowBlur)||0,0,0.2);
    o.shadowOffsetX=clamp(Number(o.shadowOffsetX)||0,-0.2,0.2);
    o.shadowOffsetY=clamp(Number(o.shadowOffsetY)||0,-0.2,0.2);
    o.maxDpr=clamp(Number(o.maxDpr)||2,1,3);
    o.reducedMotion=['respect','always','never'].indexOf(o.reducedMotion)>=0?o.reducedMotion:'respect';
    return o;
  }

  function bendLimitAt(u,opts){
    var o=normalizeOptions(opts),t=smoothstep(o.headRigidFraction,1,u);
    return lerp(o.headMaxBend,o.bodyMaxBend,t);
  }

  function flexAt(u,opts){
    var o=normalizeOptions(opts);
    if(o.headRigidFraction<=0)return 1;
    return smoothstep(0,o.headRigidFraction,u);
  }

  function createSpine(count,x,y,heading,length){
    count=Math.max(2,Math.round(count||30));
    length=Math.max(1,Number(length)||380);
    heading=Number(heading)||0;
    var seg=length/(count-1),out=[];
    for(var i=0;i<count;i++)out.push({
      x:(Number(x)||0)-Math.cos(heading)*seg*i,
      y:(Number(y)||0)-Math.sin(heading)*seg*i
    });
    return out;
  }

  function resegmentSpine(spine,length,heading){
    if(!spine||spine.length<2)return spine;
    var seg=Math.max(0.001,Number(length)||1)/(spine.length-1);
    heading=Number(heading)||0;
    for(var i=1;i<spine.length;i++){
      var prev=spine[i-1],p=spine[i];
      var dx=p.x-prev.x,dy=p.y-prev.y,d=Math.hypot(dx,dy);
      if(d<0.0001){dx=-Math.cos(heading);dy=-Math.sin(heading);d=1;}
      p.x=prev.x+dx/d*seg;p.y=prev.y+dy/d*seg;
    }
    return spine;
  }

  function limitSpineBend(spine,length,heading,opts){
    if(!spine||spine.length<2)return spine;
    var o=normalizeOptions(opts),seg=Math.max(.001,Number(length)||1)/(spine.length-1);
    var previousAngle=(Number(heading)||0)+Math.PI;
    for(var i=1;i<spine.length;i++){
      var prev=spine[i-1],p=spine[i],raw=Math.atan2(p.y-prev.y,p.x-prev.x);
      var u=(i-.5)/(spine.length-1),limit=bendLimitAt(u,o);
      var next=previousAngle+clamp(angleDelta(raw,previousAngle),-limit,limit);
      p.x=prev.x+Math.cos(next)*seg;p.y=prev.y+Math.sin(next)*seg;
      previousAngle=next;
    }
    return spine;
  }

  function advanceSpine(spine,head,length,heading,opts){
    if(!spine||!spine.length)throw new Error('NagWeb Organic: spine is required');
    spine[0].x=Number(head.x)||0;spine[0].y=Number(head.y)||0;
    resegmentSpine(spine,length,heading);
    return limitSpineBend(spine,length,heading,opts||DEFAULTS);
  }

  function localCurvature(spine,i){
    if(!spine||spine.length<3)return 0;
    var ia=clamp(i-1,0,spine.length-1),ib=clamp(i,0,spine.length-1),ic=clamp(i+1,0,spine.length-1);
    if(ia===ib||ib===ic)return 0;
    var a=Math.atan2(spine[ib].y-spine[ia].y,spine[ib].x-spine[ia].x);
    var b=Math.atan2(spine[ic].y-spine[ib].y,spine[ic].x-spine[ib].x);
    return Math.abs(angleDelta(b,a));
  }

  function sampleSpine(spine,u,phase,opts,speedRatio){
    opts=normalizeOptions(opts);
    u=clamp(Number(u)||0,0,1);
    var pos=u*(spine.length-1),i=Math.floor(pos),t=pos-i;
    var a=spine[clamp(i,0,spine.length-1)],b=spine[clamp(i+1,0,spine.length-1)];
    var x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
    var ia=clamp(i-1,0,spine.length-1),ib=clamp(i+1,0,spine.length-1);
    var vx=spine[ia].x-spine[ib].x,vy=spine[ia].y-spine[ib].y;
    var angle=Math.atan2(vy,vx);
    var curvature=localCurvature(spine,clamp(Math.round(pos),1,spine.length-2));
    var bendRef=Math.max(.001,bendLimitAt(u,opts));
    var turnDamp=1-opts.turnProtection*clamp(curvature/bendRef,0,1);
    var activity=opts.activityBase+opts.activitySpeed*clamp(Number(speedRatio)||0,0,1);
    var sway=Math.sin((Number(phase)||0)-u*opts.swayWaves)*opts.length*opts.sway*activity*Math.pow(u,opts.swayPower)*flexAt(u,opts)*turnDamp;
    x+=-Math.sin(angle)*sway;y+=Math.cos(angle)*sway;
    return {x:x,y:y,angle:angle,sway:sway,curvature:curvature,flex:flexAt(u,opts),turnDamp:turnDamp};
  }

  function seamOverlap(curvature,u,opts){
    var o=normalizeOptions(opts),ref=Math.max(.001,bendLimitAt(u,o));
    return o.overlap*(1+o.seamGuard*clamp((Number(curvature)||0)/ref,0,1));
  }

  function advancePhase(phase,speedRatio,opts,dt){
    opts=normalizeOptions(opts);
    var frame=clamp((Number(dt)||16.6667)/16.6667,0.25,3);
    return (Number(phase)||0)+(opts.phaseBase+opts.phaseSpeed*clamp(Number(speedRatio)||0,0,1))*frame;
  }

  function rotateAndCrop(image,analysis,opts){
    if(typeof document==='undefined')return Promise.reject(new Error('NagWeb Organic: browser environment required'));
    if(!assetPrep)return Promise.reject(new Error('NagWeb Organic: Asset Prep v1 is required'));
    opts=opts||{};
    var run=analysis?Promise.resolve(analysis):assetPrep.analyzeImage(image,{maxDimension:512});
    return run.then(function(a){
      if(!a.silhouetteReliable)throw new Error('NagWeb Organic: a reliable transparent silhouette is required');
      var iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height;
      var axisAngle=Number(opts.axisAngle);
      if(!Number.isFinite(axisAngle)&&opts.profile&&opts.profile.organic)axisAngle=Number(opts.profile.organic.axisAngle);
      if(!Number.isFinite(axisAngle))axisAngle=Number(a.principalAxisAngle)||0;
      var rad=-axisAngle*Math.PI/180,co=Math.abs(Math.cos(rad)),si=Math.abs(Math.sin(rad));
      var w=Math.ceil(iw*co+ih*si),h=Math.ceil(iw*si+ih*co);
      var canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
      var c=canvas.getContext('2d');c.translate(w/2,h/2);c.rotate(rad);c.drawImage(image,-iw/2,-ih/2);
      return assetPrep.analyzeImage(canvas,{maxDimension:512}).then(function(rotatedAnalysis){
        return assetPrep.trimTransparent(canvas,rotatedAnalysis,{paddingRatio:opts.paddingRatio==null ? .015 : opts.paddingRatio});
      }).then(function(trimmed){
        return {canvas:trimmed.canvas,analysis:a,axisAngle:axisAngle,width:trimmed.width,height:trimmed.height,leadEnd:'right'};
      });
    });
  }

  function createRenderer(input){
    if(typeof document==='undefined')throw new Error('NagWeb Organic: browser environment required');
    if(!engine||typeof engine.subscribeFrame!=='function')throw new Error('NagWeb Organic: Interaction Engine v1.4+ is required');
    input=input||{};
    if(!input.leader||!input.leader.state)throw new Error('NagWeb Organic: leader follower is required');
    if(!input.canvas||!input.canvas.getContext)throw new Error('NagWeb Organic: canvas is required');
    if(!input.image)throw new Error('NagWeb Organic: prepared image is required');

    var o=normalizeOptions(input),leader=input.leader,canvas=input.canvas,ctx=canvas.getContext('2d'),area=input.area||canvas.parentElement||document.documentElement;
    var bodyCanvas=document.createElement('canvas'),bodyCtx=bodyCanvas.getContext('2d');
    var dpr=1,bounds={left:0,top:0,width:0,height:0},phase=0,lastHeading=0,destroyed=false,paused=false;
    var media=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
    function reduced(){return o.reducedMotion==='always'||(o.reducedMotion==='respect'&&media&&media.matches);}
    var speed0=Math.hypot(leader.state.vx||0,leader.state.vy||0);
    if(speed0>.05)lastHeading=Math.atan2(leader.state.vy,leader.state.vx);
    var spine=createSpine(o.points,leader.state.x,leader.state.y,lastHeading,o.length);
    var img=input.image;

    function measure(){
      var r=area.getBoundingClientRect?area.getBoundingClientRect():{left:0,top:0,width:innerWidth,height:innerHeight};
      bounds={left:r.left||0,top:r.top||0,width:r.width||innerWidth,height:r.height||innerHeight};
      dpr=Math.min(devicePixelRatio||1,o.maxDpr);
      var w=Math.max(1,Math.round(bounds.width*dpr)),h=Math.max(1,Math.round(bounds.height*dpr));
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;canvas.style.width=bounds.width+'px';canvas.style.height=bounds.height+'px';}
      if(bodyCanvas.width!==w||bodyCanvas.height!==h){bodyCanvas.width=w;bodyCanvas.height=h;}
      ctx.setTransform(dpr,0,0,dpr,0,0);bodyCtx.setTransform(dpr,0,0,dpr,0,0);
    }
    function ensureSpine(){
      if(spine.length===o.points)return;
      spine=createSpine(o.points,leader.state.x,leader.state.y,lastHeading,o.length);
    }
    function drawBody(target,speedRatio){
      target.clearRect(0,0,bounds.width,bounds.height);
      var ro=reduced()?merge(o,{sway:0}):o;
      var iw=img.width||img.naturalWidth,ih=img.height||img.naturalHeight;
      if(!iw||!ih)return;
      var srcW=iw/o.slices,destH=o.length*(ih/iw),baseW=o.length/o.slices;
      for(var j=o.slices-1;j>=0;j--){
        var u=j/(o.slices-1),p=sampleSpine(spine,u,phase,ro,speedRatio);
        var overlap=seamOverlap(p.curvature,u,ro),dw=baseW*overlap;
        var idealX=o.leadEnd==='right'?iw-(j+1)*srcW:j*srcW;
        var bleed=srcW*ro.sourceBleed,srcX=Math.max(0,idealX-bleed),srcRight=Math.min(iw,idealX+srcW+bleed),srcDrawW=Math.max(.001,srcRight-srcX);
        var destBleed=baseW*(srcDrawW/srcW-1),destW=dw+Math.max(0,destBleed);
        target.save();target.translate(p.x-bounds.left,p.y-bounds.top);target.rotate(p.angle);
        target.drawImage(img,srcX,0,srcDrawW,ih,-destW/2,-destH/2,destW,destH);
        target.restore();
      }
    }
    function composite(){
      ctx.clearRect(0,0,bounds.width,bounds.height);
      ctx.save();
      if(o.shadow){
        ctx.shadowColor='rgba(0,0,0,.34)';
        ctx.shadowBlur=o.length*o.shadowBlur;
        ctx.shadowOffsetX=o.length*o.shadowOffsetX;
        ctx.shadowOffsetY=o.length*o.shadowOffsetY;
      }
      ctx.drawImage(bodyCanvas,0,0,bodyCanvas.width,bodyCanvas.height,0,0,bounds.width,bounds.height);
      ctx.restore();
    }
    function draw(speedRatio){drawBody(bodyCtx,speedRatio);composite();}
    function frame(now,dt){
      if(paused||destroyed)return;
      var vx=leader.state.vx||0,vy=leader.state.vy||0,speed=Math.hypot(vx,vy);
      if(speed>.08)lastHeading=Math.atan2(vy,vx);
      var max=(leader.options&&leader.options.maxSpeed)||34,speedRatio=clamp(speed/Math.max(1,max),0,1);
      ensureSpine();advanceSpine(spine,leader.state,o.length,lastHeading,o);
      if(!reduced())phase=advancePhase(phase,speedRatio,o,dt);draw(speedRatio);
    }
    function onMeasure(){measure();}
    measure();
    window.addEventListener('resize',onMeasure,{passive:true});window.addEventListener('scroll',onMeasure,true);
    var ro=null;if(typeof ResizeObserver==='function'){ro=new ResizeObserver(onMeasure);ro.observe(area);}
    var unsub=engine.subscribeFrame(frame);
    return {
      version:VERSION,
      get options(){return clone(o);},
      get spine(){return spine.map(function(p){return {x:p.x,y:p.y};});},
      setOptions:function(next){o=normalizeOptions(merge(o,next||{}));ensureSpine();limitSpineBend(spine,o.length,lastHeading,o);measure();return clone(o);},
      pause:function(){paused=true;},
      resume:function(){paused=false;},
      redraw:function(){draw(clamp(Math.hypot(leader.state.vx||0,leader.state.vy||0)/Math.max(1,(leader.options&&leader.options.maxSpeed)||34),0,1));},
      destroy:function(){
        if(destroyed)return;destroyed=true;if(unsub)unsub();if(ro)ro.disconnect();
        window.removeEventListener('resize',onMeasure);window.removeEventListener('scroll',onMeasure,true);
        ctx.clearRect(0,0,bounds.width,bounds.height);bodyCtx.clearRect(0,0,bounds.width,bounds.height);
      }
    };
  }

  return {
    version:VERSION,
    defaults:clone(DEFAULTS),
    normalizeOptions:normalizeOptions,
    bendLimitAt:bendLimitAt,
    flexAt:flexAt,
    createSpine:createSpine,
    resegmentSpine:resegmentSpine,
    limitSpineBend:limitSpineBend,
    advanceSpine:advanceSpine,
    localCurvature:localCurvature,
    sampleSpine:sampleSpine,
    seamOverlap:seamOverlap,
    advancePhase:advancePhase,
    rotateAndCrop:rotateAndCrop,
    createRenderer:createRenderer
  };
});
