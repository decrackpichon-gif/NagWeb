/* NagWeb Organic Adaptive Curve V4-C
   Experimental silhouette-adaptive wrapper over V4-B Weighted Curve.
   Reads the prepared transparent asset along its longitudinal axis and derives
   continuous flex/bend controls from local silhouette width and width transitions.
*/
(function(root,factory){
  'use strict';
  var v4b=root&&root.NAGWEB_ORGANIC_WEIGHTED_CURVE;
  if(typeof module==='object'&&module.exports){
    try{v4b=require('./nagweb-interaction-organic-v4b.js');}catch(_){}
    module.exports=factory(v4b);
  }else if(root){
    root.NAGWEB_ORGANIC_ADAPTIVE_CURVE=factory(v4b);
  }
})(typeof window!=='undefined'?window:globalThis,function(v4b){
  'use strict';
  var VERSION='4.3.0-alpha.1';
  var PRESETS={
    character:{label:'Personaje',adaptiveStrength:.78,wideRigidity:.32,thinFlexBoost:.18,transitionStabilize:.46,headLock:.18,controlCount:9},
    creature:{label:'Criatura',adaptiveStrength:.62,wideRigidity:.16,thinFlexBoost:.34,transitionStabilize:.28,headLock:.10,controlCount:10},
    soft:{label:'Forma blanda',adaptiveStrength:.42,wideRigidity:.06,thinFlexBoost:.46,transitionStabilize:.16,headLock:.05,controlCount:9}
  };
  var DEFAULTS={
    adaptivePreset:'character',
    adaptiveStrength:.78,
    wideRigidity:.32,
    thinFlexBoost:.18,
    transitionStabilize:.46,
    headLock:.18,
    profileSamples:96,
    profileSmoothRadius:3,
    alphaThreshold:8,
    diagnostic:true
  };
  var BASE_FLEX=[.02,.055,.16,.36,.62,.86,1];
  var BASE_BEND=[.055,.070,.105,.155,.205,.265,.32];

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function lerp(a,b,t){return a+(b-a)*t;}
  function clean(v,f){v=Number(v);return Number.isFinite(v)?v:f;}
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function merge(a,b){var o=clone(a||{});Object.keys(b||{}).forEach(function(k){o[k]=b[k];});return o;}
  function seriesAt(series,u){u=clamp(clean(u,0),0,1);var p=u*(series.length-1),a=Math.floor(p),b=Math.min(series.length-1,a+1),t=p-a;return lerp(series[a],series[b],t);}
  function smoothArray(values,radius){
    radius=Math.max(0,Math.round(radius||0));if(!radius)return values.slice();
    return values.map(function(_,i){var s=0,n=0;for(var j=Math.max(0,i-radius);j<=Math.min(values.length-1,i+radius);j++){s+=values[j];n++;}return n?s/n:values[i];});
  }
  function normalizeOptions(input){
    input=input||{};var presetName=PRESETS[input.adaptivePreset]?input.adaptivePreset:'character',o=merge(DEFAULTS,PRESETS[presetName]);o=merge(o,input);
    o.adaptivePreset=PRESETS[o.adaptivePreset]?o.adaptivePreset:presetName;
    o.adaptiveStrength=clamp(clean(o.adaptiveStrength,.78),0,1.5);
    o.wideRigidity=clamp(clean(o.wideRigidity,.32),0,.8);
    o.thinFlexBoost=clamp(clean(o.thinFlexBoost,.18),0,.8);
    o.transitionStabilize=clamp(clean(o.transitionStabilize,.46),0,.9);
    o.headLock=clamp(clean(o.headLock,.18),0,.35);
    o.profileSamples=Math.round(clamp(clean(o.profileSamples,96),24,256));
    o.profileSmoothRadius=Math.round(clamp(clean(o.profileSmoothRadius,3),0,12));
    o.alphaThreshold=Math.round(clamp(clean(o.alphaThreshold,8),1,254));
    o.diagnostic=o.diagnostic!==false;
    o.controlCount=Math.round(clamp(clean(o.controlCount,PRESETS[o.adaptivePreset].controlCount),5,14));
    return o;
  }

  function analyzeAlphaData(data,width,height,opts){
    var o=normalizeOptions(opts),samples=o.profileSamples,raw=[];
    width=Math.max(1,Math.round(width));height=Math.max(1,Math.round(height));
    for(var s=0;s<samples;s++){
      var x0=Math.floor(s*width/samples),x1=Math.max(x0+1,Math.floor((s+1)*width/samples));
      var minY=height,maxY=-1,opaque=0,total=Math.max(1,(x1-x0)*height);
      for(var x=x0;x<Math.min(width,x1);x++)for(var y=0;y<height;y++){
        var a=data[(y*width+x)*4+3];if(a>=o.alphaThreshold){if(y<minY)minY=y;if(y>maxY)maxY=y;opaque++;}
      }
      raw.push({
        sourceX:(x0+x1-1)*.5/Math.max(1,width-1),
        width:maxY>=minY?(maxY-minY+1)/height:0,
        occupancy:opaque/total,
        center:maxY>=minY?((minY+maxY)*.5/height):.5
      });
    }
    var widths=smoothArray(raw.map(function(p){return p.width;}),o.profileSmoothRadius);
    var centers=smoothArray(raw.map(function(p){return p.center;}),o.profileSmoothRadius);
    var maxWidth=Math.max.apply(Math,widths.concat([1e-6])),nonzero=widths.filter(function(v){return v>.002;}),meanWidth=nonzero.length?nonzero.reduce(function(a,b){return a+b;},0)/nonzero.length:0;
    var gradient=widths.map(function(v,i){
      var a=widths[Math.max(0,i-1)],b=widths[Math.min(widths.length-1,i+1)];
      return Math.abs(b-a)*.5;
    });
    var maxGrad=Math.max.apply(Math,gradient.concat([1e-6]));
    var points=raw.map(function(p,i){
      var u=1-p.sourceX; // prepared assets use leadEnd:right, so u=0 is right/head side
      return {u:u,width:widths[i],widthNorm:widths[i]/maxWidth,center:centers[i],occupancy:p.occupancy,gradient:gradient[i],gradientNorm:gradient[i]/maxGrad};
    }).sort(function(a,b){return a.u-b.u;});
    if(points.length){points[0].u=0;points[points.length-1].u=1;}
    return {samples:samples,width:width,height:height,maxWidth:maxWidth,meanWidth:meanWidth,maxGradient:maxGrad,points:points};
  }

  function analyzeCanvas(canvas,opts){
    if(!canvas||typeof canvas.getContext!=='function')throw new Error('NagWeb Organic Adaptive Curve: canvas is required');
    var ctx=canvas.getContext('2d',{willReadFrequently:true}),image=ctx.getImageData(0,0,canvas.width,canvas.height);
    return analyzeAlphaData(image.data,image.width,image.height,opts);
  }

  function profileAt(profile,u){
    var pts=profile.points;if(!pts||!pts.length)return {u:u,width:0,widthNorm:0,center:.5,occupancy:0,gradient:0,gradientNorm:0};
    u=clamp(clean(u,0),0,1);var p=u*(pts.length-1),a=Math.floor(p),b=Math.min(pts.length-1,a+1),t=p-a,A=pts[a],B=pts[b];
    var out={u:u};['width','widthNorm','center','occupancy','gradient','gradientNorm'].forEach(function(k){out[k]=lerp(A[k],B[k],t);});return out;
  }

  function deriveAdaptiveControls(profile,opts){
    var o=normalizeOptions(opts),count=o.controlCount,positions=[],flex=[],bend=[],details=[];
    for(var i=0;i<count;i++){
      var u=count===1?0:i/(count-1),p=profileAt(profile,u),baseFlex=seriesAt(BASE_FLEX,u),baseBend=seriesAt(BASE_BEND,u);
      var widthPenalty=p.widthNorm*o.wideRigidity;
      var thinBoost=(1-p.widthNorm)*o.thinFlexBoost;
      var transitionPenalty=p.gradientNorm*o.transitionStabilize;
      var adapt=o.adaptiveStrength;
      var adaptiveFlex=baseFlex*(1+adapt*(thinBoost-widthPenalty-transitionPenalty));
      var adaptiveBend=baseBend*(1+adapt*(thinBoost*.65-widthPenalty*.72-transitionPenalty*.78));
      var headMask=u<o.headLock?(u/Math.max(.001,o.headLock)):1;
      if(u<o.headLock){adaptiveFlex*=lerp(.30,1,headMask);adaptiveBend*=lerp(.58,1,headMask);}
      adaptiveFlex=clamp(adaptiveFlex,.012,1);adaptiveBend=clamp(adaptiveBend,.035,.42);
      positions.push(u);flex.push(adaptiveFlex);bend.push(adaptiveBend);
      details.push({u:u,width:p.width,widthNorm:p.widthNorm,gradientNorm:p.gradientNorm,baseFlex:baseFlex,flex:adaptiveFlex,baseBend:baseBend,bend:adaptiveBend});
    }
    // Keep a monotonic global character progression while preserving local adaptive dents.
    for(var j=1;j<flex.length;j++)flex[j]=Math.max(flex[j],flex[j-1]*.90);
    for(var k=1;k<bend.length;k++)bend[k]=Math.max(bend[k],bend[k-1]*.90);
    details.forEach(function(d,idx){d.flex=flex[idx];d.bend=bend[idx];});
    return {positions:positions,flex:flex,bend:bend,details:details};
  }

  function summarizeProfile(profile,controls){
    var details=controls.details||[],minW=Infinity,maxW=0,transitions=0;
    details.forEach(function(d){minW=Math.min(minW,d.width);maxW=Math.max(maxW,d.width);if(d.gradientNorm>.55)transitions++;});
    if(!Number.isFinite(minW))minW=0;
    return {samples:profile.samples,minWidth:minW,maxWidth:maxW,meanWidth:profile.meanWidth,transitions:transitions,controlCount:details.length};
  }

  function makeV4BOptions(image,adaptiveInput){
    var o=normalizeOptions(adaptiveInput),profile=analyzeCanvas(image,o),controls=deriveAdaptiveControls(profile,o);
    var base=Object.assign({},adaptiveInput||{},{
      controlCount:controls.positions.length,
      controlPositions:controls.positions,
      controlFlex:controls.flex,
      controlBend:controls.bend
    });
    delete base.adaptivePreset;delete base.adaptiveStrength;delete base.wideRigidity;delete base.thinFlexBoost;delete base.transitionStabilize;delete base.headLock;delete base.profileSamples;delete base.profileSmoothRadius;delete base.alphaThreshold;delete base.diagnostic;
    delete base.leader;delete base.canvas;delete base.area;delete base.image;delete base.onContextLost;
    return {options:base,profile:profile,controls:controls,summary:summarizeProfile(profile,controls),adaptiveOptions:o};
  }

  function createRenderer(input){
    if(!v4b||typeof v4b.createRenderer!=='function')throw new Error('NagWeb Organic Adaptive Curve: V4-B Weighted Curve is required');
    input=input||{};if(!input.image)throw new Error('NagWeb Organic Adaptive Curve: prepared image is required');
    var currentInput=Object.assign({},input),derived=makeV4BOptions(input.image,input),inner=v4b.createRenderer(Object.assign({},currentInput,derived.options));
    function rederive(next){
      currentInput=Object.assign({},currentInput,next||{});
      derived=makeV4BOptions(currentInput.image,currentInput);
      inner.setOptions(derived.options);
    }
    return {
      version:VERSION,renderer:'webgl-adaptive-curve-v4c',
      get options(){var a=derived.adaptiveOptions;return Object.assign({},inner.options,{adaptivePreset:a.adaptivePreset,adaptiveStrength:a.adaptiveStrength,wideRigidity:a.wideRigidity,thinFlexBoost:a.thinFlexBoost,transitionStabilize:a.transitionStabilize,headLock:a.headLock,profileSamples:a.profileSamples,profileSmoothRadius:a.profileSmoothRadius,alphaThreshold:a.alphaThreshold,diagnostic:a.diagnostic});},
      get adaptiveProfile(){return clone(derived.profile);},
      get adaptiveControls(){return clone(derived.controls);},
      get adaptiveSummary(){return clone(derived.summary);},
      get spine(){return inner.spine;},get guard(){return inner.guard;},get topology(){return inner.topology;},get textureInfo(){return inner.textureInfo;},get contextLost(){return inner.contextLost;},
      setOptions:function(next){rederive(next);return this.options;},
      pause:function(){inner.pause();},resume:function(){inner.resume();},measure:function(){inner.measure();},
      destroy:function(){inner.destroy();}
    };
  }

  function prepareAsset(image,analysis,opts){
    if(v4b&&typeof v4b.prepareAsset==='function')return v4b.prepareAsset(image,analysis,opts);
    return Promise.reject(new Error('NagWeb Organic Adaptive Curve: V4-B prepareAsset is required'));
  }

  return {version:VERSION,presets:clone(PRESETS),defaults:clone(DEFAULTS),normalizeOptions:normalizeOptions,analyzeAlphaData:analyzeAlphaData,analyzeCanvas:analyzeCanvas,profileAt:profileAt,deriveAdaptiveControls:deriveAdaptiveControls,summarizeProfile:summarizeProfile,makeV4BOptions:makeV4BOptions,prepareAsset:prepareAsset,createRenderer:createRenderer};
});
