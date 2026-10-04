/* NagWeb Interaction Asset Prep v1
   Local image analysis for interaction readiness.
   No network calls, no external dependencies.
*/
(function(root,factory){
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.NAGWEB_INTERACTION_ASSET_PREP=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  var VERSION='1.2.0';
  var PROFILE_SCHEMA='nagweb-interaction-asset-profile';

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function analyzePixels(imageData,opts){
    opts=opts||{};
    var data=imageData&&imageData.data||imageData;
    var width=Number(imageData&&imageData.width||opts.width)||0;
    var height=Number(imageData&&imageData.height||opts.height)||0;
    if(!data||!width||!height||data.length<width*height*4)throw new Error('NagWeb Asset Prep: invalid pixel data');
    var alphaThreshold=opts.alphaThreshold==null?16:clamp(Number(opts.alphaThreshold)||0,0,255);
    var total=width*height,opaque=0,transparent=0,borderTotal=0,borderTransparent=0;
    var minX=width,minY=height,maxX=-1,maxY=-1,wsum=0,sx=0,sy=0;
    var x,y,i,a,w;
    for(y=0;y<height;y++){
      for(x=0;x<width;x++){
        i=(y*width+x)*4;a=data[i+3];
        var border=(x===0||y===0||x===width-1||y===height-1);
        if(border){borderTotal++;if(a<alphaThreshold)borderTransparent++;}
        if(a>=alphaThreshold){
          opaque++;w=a/255;wsum+=w;sx+=x*w;sy+=y*w;
          if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
        }else transparent++;
      }
    }
    var transparentRatio=transparent/total;
    var hasTransparency=transparentRatio>0.005;
    var transparentBorderRatio=borderTotal?borderTransparent/borderTotal:0;
    var reliable=hasTransparency&&transparentBorderRatio>0.55&&opaque>0;
    var cx=wsum?sx/wsum:width/2,cy=wsum?sy/wsum:height/2;
    var cxx=0,cyy=0,cxy=0;
    if(reliable&&wsum){
      for(y=0;y<height;y++){
        for(x=0;x<width;x++){
          i=(y*width+x)*4;a=data[i+3];if(a<alphaThreshold)continue;
          w=a/255;var dx=x-cx,dy=y-cy;cxx+=dx*dx*w;cyy+=dy*dy*w;cxy+=dx*dy*w;
        }
      }
      cxx/=wsum;cyy/=wsum;cxy/=wsum;
    }
    var trace=cxx+cyy,disc=Math.sqrt(Math.max(0,(cxx-cyy)*(cxx-cyy)+4*cxy*cxy));
    var l1=(trace+disc)/2,l2=(trace-disc)/2;
    var elongation=reliable?Math.sqrt(Math.max(l1,1e-6)/Math.max(l2,1e-6)):Math.max(width,height)/Math.max(1,Math.min(width,height));
    var angle=reliable?0.5*Math.atan2(2*cxy,cxx-cyy)*180/Math.PI:(width>=height?0:90);
    var bbox=opaque?{
      x:minX/width,y:minY/height,
      width:(maxX-minX+1)/width,height:(maxY-minY+1)/height
    }:{x:0,y:0,width:1,height:1};
    var bboxArea=bbox.width*bbox.height;
    var organicCandidate=!!(reliable&&elongation>=1.75&&bboxArea>=0.04);
    var warnings=[];
    if(!hasTransparency)warnings.push('La imagen no tiene transparencia detectable.');
    else if(!reliable)warnings.push('La transparencia existe, pero la silueta toca demasiado los bordes para analizarla con confianza.');
    if(width<220||height<220)warnings.push('La resolución puede ser baja para una animación grande.');
    if(opaque/total<0.025)warnings.push('El objeto ocupa muy poco espacio dentro del archivo.');
    return {
      width:width,height:height,
      hasTransparency:hasTransparency,
      transparentRatio:transparentRatio,
      transparentBorderRatio:transparentBorderRatio,
      silhouetteReliable:reliable,
      subjectBounds:bbox,
      centroid:{x:cx/width,y:cy/height},
      principalAxisAngle:angle,
      elongation:elongation,
      organicCandidate:organicCandidate,
      needsBackgroundRemoval:!reliable,
      recommendedMode:organicCandidate?'organic':'follower',
      warnings:warnings
    };
  }

  function drawForAnalysis(image,maxDimension){
    maxDimension=Math.max(64,Number(maxDimension)||512);
    var iw=image.naturalWidth||image.videoWidth||image.width,ih=image.naturalHeight||image.videoHeight||image.height;
    if(!iw||!ih)throw new Error('NagWeb Asset Prep: image has no dimensions');
    var scale=Math.min(1,maxDimension/Math.max(iw,ih));
    var w=Math.max(1,Math.round(iw*scale)),h=Math.max(1,Math.round(ih*scale));
    var canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    var ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.clearRect(0,0,w,h);ctx.drawImage(image,0,0,w,h);
    return {canvas:canvas,imageData:ctx.getImageData(0,0,w,h),sourceWidth:iw,sourceHeight:ih};
  }

  function analyzeImage(image,opts){
    if(typeof document==='undefined')return Promise.reject(new Error('NagWeb Asset Prep: browser environment required'));
    return Promise.resolve().then(function(){
      var sample=drawForAnalysis(image,opts&&opts.maxDimension);
      var result=analyzePixels(sample.imageData,opts);
      result.sourceWidth=sample.sourceWidth;result.sourceHeight=sample.sourceHeight;
      result.sampleWidth=sample.canvas.width;result.sampleHeight=sample.canvas.height;
      return result;
    });
  }

  function trimTransparent(image,analysis,opts){
    opts=opts||{};
    if(typeof document==='undefined')return Promise.reject(new Error('NagWeb Asset Prep: browser environment required'));
    return Promise.resolve().then(function(){
      var a=analysis;
      return a?Promise.resolve(a):analyzeImage(image,opts);
    }).then(function(a){
      if(!a.silhouetteReliable)throw new Error('NagWeb Asset Prep: transparent subject bounds are not reliable');
      var iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height,b=a.subjectBounds;
      var pad=Math.max(0,Number(opts.paddingRatio)||0);
      var x0=clamp(b.x-pad,0,1),y0=clamp(b.y-pad,0,1),x1=clamp(b.x+b.width+pad,0,1),y1=clamp(b.y+b.height+pad,0,1);
      var sx=Math.floor(x0*iw),sy=Math.floor(y0*ih),sw=Math.max(1,Math.ceil((x1-x0)*iw)),sh=Math.max(1,Math.ceil((y1-y0)*ih));
      if(sx+sw>iw)sw=iw-sx;if(sy+sh>ih)sh=ih-sy;
      var canvas=document.createElement('canvas');canvas.width=sw;canvas.height=sh;
      canvas.getContext('2d').drawImage(image,sx,sy,sw,sh,0,0,sw,sh);
      return {canvas:canvas,width:sw,height:sh,bounds:{x:sx,y:sy,width:sw,height:sh},analysis:a};
    });
  }


  function clamp01(v){return clamp(Number(v)||0,0,1);}
  function normalizeAnchor(p,fallback){
    p=p||fallback||{x:.5,y:.5};
    return {x:clamp01(p.x),y:clamp01(p.y)};
  }
  function axisAnchors(a){
    if(!a)throw new Error('NagWeb Asset Prep: analysis is required');
    var w=Math.max(1,Number(a.sampleWidth||a.width||a.sourceWidth)||1);
    var h=Math.max(1,Number(a.sampleHeight||a.height||a.sourceHeight)||1);
    var c={x:clamp01(a.centroid&&a.centroid.x),y:clamp01(a.centroid&&a.centroid.y)};
    var b=a.subjectBounds||{x:0,y:0,width:1,height:1};
    var minX=clamp01(b.x)*w,maxX=clamp01(b.x+b.width)*w,minY=clamp01(b.y)*h,maxY=clamp01(b.y+b.height)*h;
    var cx=c.x*w,cy=c.y*h,rad=(Number(a.principalAxisAngle)||0)*Math.PI/180,dx=Math.cos(rad),dy=Math.sin(rad);
    var hits=[];
    function add(t){
      if(!Number.isFinite(t))return;
      var x=cx+t*dx,y=cy+t*dy;
      if(x>=minX-1e-6&&x<=maxX+1e-6&&y>=minY-1e-6&&y<=maxY+1e-6)hits.push({t:t,x:x/w,y:y/h});
    }
    if(Math.abs(dx)>1e-8){add((minX-cx)/dx);add((maxX-cx)/dx);}
    if(Math.abs(dy)>1e-8){add((minY-cy)/dy);add((maxY-cy)/dy);}
    hits.sort(function(p,q){return p.t-q.t;});
    if(hits.length<2){
      var rx=Math.cos(rad)*.35,ry=Math.sin(rad)*.35*(w/h);
      return {start:normalizeAnchor({x:c.x-rx,y:c.y-ry}),end:normalizeAnchor({x:c.x+rx,y:c.y+ry}),source:'auto'};
    }
    return {start:normalizeAnchor(hits[0]),end:normalizeAnchor(hits[hits.length-1]),source:'auto'};
  }
  function axisAngleFromAnchors(start,end,width,height){
    start=normalizeAnchor(start);end=normalizeAnchor(end);
    width=Math.max(1,Number(width)||1);height=Math.max(1,Number(height)||1);
    return Math.atan2((end.y-start.y)*height,(end.x-start.x)*width)*180/Math.PI;
  }

  function createProfile(a,input){
    if(!a)throw new Error('NagWeb Asset Prep: analysis is required');
    input=input||{};
    var autoAxis=axisAnchors(a);
    var trail=normalizeAnchor(input.trailAnchor,autoAxis.start);
    var lead=normalizeAnchor(input.leadAnchor,autoAxis.end);
    var axisAngle=axisAngleFromAnchors(trail,lead,a.sampleWidth||a.width||a.sourceWidth,a.sampleHeight||a.height||a.sourceHeight);
    return {
      schema:PROFILE_SCHEMA,
      version:1,
      source:{width:a.sourceWidth||a.width,height:a.sourceHeight||a.height},
      readiness:{
        backgroundReady:!a.needsBackgroundRemoval,
        silhouetteReliable:!!a.silhouetteReliable,
        organicCandidate:!!a.organicCandidate,
        recommendedMode:a.recommendedMode
      },
      geometry:{
        subjectBounds:Object.assign({},a.subjectBounds),
        centroid:Object.assign({},a.centroid),
        principalAxisAngle:Number(a.principalAxisAngle)||0,
        elongation:Number(a.elongation)||1
      },
      organic:{
        leadEnd:input.leadEnd==='left'?'left':'right',
        cropPadding:input.cropPadding==null ? .015 : Math.max(0,Number(input.cropPadding)||0),
        trailAnchor:trail,
        leadAnchor:lead,
        axisAngle:axisAngle,
        directionSource:(input.trailAnchor||input.leadAnchor)?'manual':'auto'
      },
      warnings:(a.warnings||[]).slice()
    };
  }
  function serializeProfile(profile){
    if(!profile||profile.schema!==PROFILE_SCHEMA||profile.version!==1)throw new Error('NagWeb Asset Prep: invalid asset profile');
    return JSON.stringify(profile);
  }
  function deserializeProfile(value){
    var p=typeof value==='string'?JSON.parse(value):JSON.parse(JSON.stringify(value));
    if(!p||p.schema!==PROFILE_SCHEMA||p.version!==1||!p.geometry||!p.readiness)throw new Error('NagWeb Asset Prep: invalid asset profile');
    p.organic=p.organic||{leadEnd:'right',cropPadding:.015};
    p.organic.leadEnd=p.organic.leadEnd==='left'?'left':'right';
    var fallback=p.geometry&&p.geometry.subjectBounds?{x:.5,y:.5}:{x:.5,y:.5};
    p.organic.trailAnchor=normalizeAnchor(p.organic.trailAnchor,fallback);
    p.organic.leadAnchor=normalizeAnchor(p.organic.leadAnchor,fallback);
    p.organic.axisAngle=Number(p.organic.axisAngle);
    if(!Number.isFinite(p.organic.axisAngle))p.organic.axisAngle=Number(p.geometry&&p.geometry.principalAxisAngle)||0;
    p.organic.directionSource=p.organic.directionSource==='manual'?'manual':'auto';
    return p;
  }

  function summarize(a){
    if(!a)return null;
    return {
      background:a.needsBackgroundRemoval?'remove-recommended':'ready',
      silhouette:a.silhouetteReliable?'reliable':'uncertain',
      mode:a.recommendedMode,
      axis:a.principalAxisAngle,
      elongation:a.elongation,
      warnings:a.warnings.slice()
    };
  }

  return {version:VERSION,profileSchema:PROFILE_SCHEMA,analyzePixels:analyzePixels,analyzeImage:analyzeImage,trimTransparent:trimTransparent,axisAnchors:axisAnchors,axisAngleFromAnchors:axisAngleFromAnchors,createProfile:createProfile,serializeProfile:serializeProfile,deserializeProfile:deserializeProfile,summarize:summarize};
});
