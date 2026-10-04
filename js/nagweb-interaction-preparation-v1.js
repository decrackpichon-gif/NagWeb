/* NagWeb Interaction Preparation Pipeline v1
   Robust orchestration for analysis, optional AI background removal,
   safe fallback, trimming and interaction-mode recommendation.
*/
(function(root,factory){
  'use strict';
  var api=factory(root&&root.NAGWEB_INTERACTION_ASSET_PREP,root&&root.NAGWEB_INTERACTION_BACKGROUND_AI);
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.NAGWEB_INTERACTION_PREPARATION=api;
})(typeof window!=='undefined'?window:globalThis,function(assetPrep,backgroundAI){
  'use strict';

  var VERSION='1.1.0-alpha.1';
  var SCHEMA='nagweb-interaction-preparation';
  var MB=1024*1024;

  function clone(v){return JSON.parse(JSON.stringify(v));}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function abortError(message){var e=new Error(message||'NagWeb Preparation: operation cancelled');e.name='AbortError';return e;}
  function throwIfAborted(signal){if(signal&&signal.aborted)throw abortError();}

  function normalizeOptions(input){
    input=input||{};
    var override=['auto','follower','organic'].indexOf(input.modeOverride)>=0?input.modeOverride:'auto';
    return {
      autoRemoveBackground:input.autoRemoveBackground!==false,
      allowAI:input.allowAI!==false,
      autoTrim:input.autoTrim!==false,
      maxDimension:Math.round(clamp(Number(input.maxDimension)||512,128,1600)),
      cropPadding:clamp(input.cropPadding==null?.015:(Number(input.cropPadding)||0),0,.2),
      organicThreshold:clamp(Number(input.organicThreshold)||1.75,1.1,5),
      maxFileBytes:Math.round(clamp(Number(input.maxFileBytes)||40*MB,1*MB,250*MB)),
      warnFileBytes:Math.round(clamp(Number(input.warnFileBytes)||16*MB,1*MB,200*MB)),
      maxSourcePixels:Math.round(clamp(Number(input.maxSourcePixels)||24000000,1000000,100000000)),
      hardMaxSourcePixels:Math.round(clamp(Number(input.hardMaxSourcePixels)||100000000,4000000,250000000)),
      maxAIDimension:Math.round(clamp(Number(input.maxAIDimension)||2048,512,4096)),
      modeOverride:override,
      remover:input.remover||null,
      progress:typeof input.progress==='function'?input.progress:null
    };
  }

  function validateFile(file,options){
    var o=normalizeOptions(options),size=Number(file&&file.size)||0,type=String(file&&file.type||'');
    var allowed=!type||/^image\/(png|jpeg|webp)$/i.test(type);
    var blocked=!allowed||(size>0&&size>o.maxFileBytes);
    var warnings=[];
    if(!allowed)warnings.push('Formato no admitido para preparación automática.');
    if(size>o.maxFileBytes)warnings.push('El archivo supera el límite seguro de '+Math.round(o.maxFileBytes/MB)+' MB.');
    else if(size>o.warnFileBytes)warnings.push('El archivo es pesado; la preparación puede usar una copia reducida para IA.');
    return {allowed:allowed,blocked:blocked,size:size,type:type,warnings:warnings};
  }

  function sourceInfo(image,meta,options){
    var o=normalizeOptions(options),w=Number(image&&(image.naturalWidth||image.videoWidth||image.width))||0,h=Number(image&&(image.naturalHeight||image.videoHeight||image.height))||0;
    var pixels=w*h,fileBytes=Number(meta&&meta.fileSizeBytes)||0,warnings=[];
    var blocked=pixels>o.hardMaxSourcePixels;
    if(blocked)warnings.push('Las dimensiones exceden el límite de seguridad de '+Math.round(o.hardMaxSourcePixels/1000000)+' MP.');
    else if(pixels>o.maxSourcePixels)warnings.push('Imagen grande: se limitará la entrada de IA para proteger memoria y rendimiento.');
    if(fileBytes>o.warnFileBytes)warnings.push('Archivo pesado: '+(fileBytes/MB).toFixed(1)+' MB.');
    return {width:w,height:h,pixels:pixels,fileBytes:fileBytes,blocked:blocked,warnings:warnings};
  }

  function scoreAnalysis(a){
    if(!a)return {score:0,level:'blocked',label:'No disponible',reasons:['No hay análisis del recurso.']};
    var score=100,reasons=[];
    if(a.needsBackgroundRemoval){score-=45;reasons.push('El fondo todavía no está preparado.');}
    if(!a.silhouetteReliable){score-=25;reasons.push('La silueta no puede medirse con confianza.');}
    if((a.sourceWidth||a.width)<220||(a.sourceHeight||a.height)<220){score-=18;reasons.push('La resolución es baja para usos grandes.');}
    var bbox=a.subjectBounds||{width:1,height:1};
    if(bbox.width*bbox.height<.025){score-=12;reasons.push('El sujeto ocupa muy poco del archivo.');}
    score=Math.round(clamp(score,0,100));
    var level=score>=90?'excellent':score>=72?'good':score>=50?'manual':'blocked';
    var label=level==='excellent'?'Excelente':level==='good'?'Buena':level==='manual'?'Requiere revisión':'No preparada';
    return {score:score,level:level,label:label,reasons:reasons};
  }

  function recommendMode(a,opts){
    opts=opts||normalizeOptions();
    if(!a||!a.silhouetteReliable)return {mode:'follower',confidence:'safe',reason:'Follower funciona sin deformar el asset.',manual:false,unsafe:false};
    var elongated=Number(a.elongation)||1;
    if(elongated>=opts.organicThreshold)return {mode:'organic',confidence:elongated>=2.2?'high':'medium',reason:'La silueta es alargada y tiene un eje principal confiable.',manual:false,unsafe:false};
    return {mode:'follower',confidence:'high',reason:'La silueta no necesita deformación para seguir el cursor.',manual:false,unsafe:false};
  }

  function applyModeOverride(autoMode,override,analysis){
    if(!override||override==='auto')return autoMode;
    if(override==='follower')return {mode:'follower',confidence:'manual',reason:'Modo elegido manualmente.',manual:true,unsafe:false,automatic:autoMode.mode};
    var unsafe=!(analysis&&analysis.silhouetteReliable);
    return {mode:'organic',confidence:'manual',reason:unsafe?'Movimiento orgánico elegido manualmente; la silueta requiere revisión.':'Movimiento orgánico elegido manualmente.',manual:true,unsafe:unsafe,automatic:autoMode.mode};
  }

  function makeReport(before,after,mode,details){
    details=details||{};
    var quality=scoreAnalysis(after||before);
    var warnings=(details.warnings||[]).slice();
    if(details.backgroundError)warnings.push('La IA de fondo falló; se conservó intacto el recurso original.');
    if(mode.unsafe)warnings.push('El modo orgánico fue forzado sin una silueta fiable.');
    return {
      schema:SCHEMA,version:1,quality:quality,
      recommendedMode:mode.mode,recommendationConfidence:mode.confidence,recommendationReason:mode.reason,
      manualMode:!!mode.manual,unsafeMode:!!mode.unsafe,automaticMode:mode.automatic||mode.mode,
      usedAI:!!details.usedAI,aiAttempted:!!details.aiAttempted,aiFallback:!!details.backgroundError,
      aiError:details.backgroundError?String(details.backgroundError):null,
      trimmed:!!details.trimmed,downscaledForAI:!!details.downscaledForAI,
      originalPreserved:true,warnings:warnings,
      source:details.source||null,
      before:before?{backgroundReady:!before.needsBackgroundRemoval,silhouetteReliable:!!before.silhouetteReliable,elongation:Number(before.elongation)||1}:null,
      after:after?{backgroundReady:!after.needsBackgroundRemoval,silhouetteReliable:!!after.silhouetteReliable,elongation:Number(after.elongation)||1,principalAxisAngle:Number(after.principalAxisAngle)||0,subjectBounds:Object.assign({},after.subjectBounds)}:null
    };
  }

  function createPipeline(input){
    var o=normalizeOptions(input),activeController=null,activeRemover=null;
    function emit(stage,detail){if(o.progress)try{o.progress(Object.assign({stage:stage},detail||{}));}catch(e){}}
    async function analyze(image,signal){throwIfAborted(signal);if(!assetPrep||typeof assetPrep.analyzeImage!=='function')throw new Error('NagWeb Preparation: Asset Prep v1 is required');emit('analyze');var a=await assetPrep.analyzeImage(image,{maxDimension:o.maxDimension});throwIfAborted(signal);return a;}
    function makeAICopy(image,source){
      if(typeof document==='undefined'||!source.width||!source.height)return {image:image,downscaled:false};
      var longest=Math.max(source.width,source.height);
      if(source.pixels<=o.maxSourcePixels&&longest<=o.maxAIDimension)return {image:image,downscaled:false};
      var scale=Math.min(1,o.maxAIDimension/longest),w=Math.max(1,Math.round(source.width*scale)),h=Math.max(1,Math.round(source.height*scale));
      var canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.getContext('2d').drawImage(image,0,0,w,h);
      return {image:canvas,downscaled:true,width:w,height:h};
    }
    async function removeBackground(image,signal){
      var remover=o.remover;
      if(!remover){if(!backgroundAI||typeof backgroundAI.createRemover!=='function')throw new Error('NagWeb Preparation: Background AI adapter is unavailable');remover=backgroundAI.createRemover({});}
      activeRemover=remover;emit('background-load');throwIfAborted(signal);
      var result=await remover.remove(image,{signal:signal});throwIfAborted(signal);
      emit('background-complete',{provider:result.provider,device:result.device});return result;
    }
    async function trim(image,analysis,signal){
      throwIfAborted(signal);if(!o.autoTrim||!analysis.silhouetteReliable)return {image:image,trimmed:false};
      emit('trim');var t=await assetPrep.trimTransparent(image,analysis,{paddingRatio:o.cropPadding});throwIfAborted(signal);
      return {image:t.canvas,trimmed:true,trim:t};
    }

    async function prepare(image,run){
      run=run||{};
      if(!image)throw new Error('NagWeb Preparation: image is required');
      var externalSignal=run.signal||null,ownController=typeof AbortController!=='undefined'?new AbortController():null;
      activeController=ownController;
      var signal=externalSignal||ownController&&ownController.signal||null;
      throwIfAborted(signal);emit('start');

      var original=image,source=sourceInfo(image,run,o);
      if(source.blocked)throw new Error('NagWeb Preparation: source dimensions exceed safe limits');
      var before=await analyze(original,signal),working=original,usedAI=false,aiAttempted=false,aiResult=null,backgroundError=null,downscaledForAI=false;

      if(before.needsBackgroundRemoval&&o.autoRemoveBackground&&o.allowAI){
        aiAttempted=true;
        try{
          var aiInput=makeAICopy(original,source);downscaledForAI=aiInput.downscaled;
          if(downscaledForAI)emit('background-downscale',{width:aiInput.width,height:aiInput.height});
          aiResult=await removeBackground(aiInput.image,signal);
          working=aiResult.canvas||aiResult.raw||original;usedAI=working!==original;
        }catch(err){
          if(err&&err.name==='AbortError')throw err;
          backgroundError=err;working=original;emit('background-error',{error:String(err),fallback:'original'});
        }
      }

      throwIfAborted(signal);
      var after=working===original?before:await analyze(working,signal);
      var trimmedResult=await trim(working,after,signal);working=trimmedResult.image;
      if(trimmedResult.trimmed)after=await analyze(working,signal);

      var automatic=recommendMode(after,o),override=run.modeOverride||o.modeOverride,mode=applyModeOverride(automatic,override,after);
      var report=makeReport(before,after,mode,{usedAI:usedAI,aiAttempted:aiAttempted,backgroundError:backgroundError,trimmed:trimmedResult.trimmed,downscaledForAI:downscaledForAI,source:source,warnings:source.warnings});
      var profile=assetPrep.createProfile(after,{leadEnd:'right',cropPadding:o.cropPadding});profile.readiness.recommendedMode=mode.mode;

      throwIfAborted(signal);emit('complete',{quality:report.quality,mode:mode.mode,fallback:!!backgroundError});
      activeController=null;activeRemover=null;
      return {originalImage:original,image:working,analysis:after,profile:profile,report:report,usedAI:usedAI,aiResult:aiResult,trimmed:trimmedResult.trimmed};
    }

    function cancel(){
      if(activeController&&!activeController.signal.aborted)activeController.abort();
      if(activeRemover&&typeof activeRemover.cancel==='function')activeRemover.cancel();
      emit('cancelled');
    }

    return {version:VERSION,options:clone(o),analyze:function(image){return analyze(image,null);},prepare:prepare,cancel:cancel,score:scoreAnalysis,recommend:function(a,override){return applyModeOverride(recommendMode(a,o),override||o.modeOverride,a);}};
  }

  function serializeReport(report){if(!report||report.schema!==SCHEMA||report.version!==1)throw new Error('NagWeb Preparation: invalid report');return JSON.stringify(report);}
  function deserializeReport(value){var r=typeof value==='string'?JSON.parse(value):clone(value);if(!r||r.schema!==SCHEMA||r.version!==1||!r.quality)throw new Error('NagWeb Preparation: invalid report');return r;}

  return {version:VERSION,schema:SCHEMA,normalizeOptions:normalizeOptions,validateFile:validateFile,sourceInfo:sourceInfo,scoreAnalysis:scoreAnalysis,recommendMode:recommendMode,applyModeOverride:applyModeOverride,makeReport:makeReport,createPipeline:createPipeline,serializeReport:serializeReport,deserializeReport:deserializeReport};
});
