/* NagWeb Interaction Preparation Pipeline v1
   Orchestrates local analysis, optional AI background removal, trimming,
   compatibility scoring and mode recommendation.
   Does not depend on NagWeb editor globals.
*/
(function(root,factory){
  'use strict';
  var api=factory(
    root&&root.NAGWEB_INTERACTION_ASSET_PREP,
    root&&root.NAGWEB_INTERACTION_BACKGROUND_AI
  );
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.NAGWEB_INTERACTION_PREPARATION=api;
})(typeof window!=='undefined'?window:globalThis,function(assetPrep,backgroundAI){
  'use strict';

  var VERSION='1.0.0-alpha.1';
  var SCHEMA='nagweb-interaction-preparation';

  function clone(v){return JSON.parse(JSON.stringify(v));}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

  function normalizeOptions(input){
    input=input||{};
    return {
      autoRemoveBackground:input.autoRemoveBackground!==false,
      allowAI:input.allowAI!==false,
      autoTrim:input.autoTrim!==false,
      maxDimension:Math.round(clamp(Number(input.maxDimension)||512,128,1600)),
      cropPadding:clamp(input.cropPadding==null?.015:(Number(input.cropPadding)||0),0,.2),
      organicThreshold:clamp(Number(input.organicThreshold)||1.75,1.1,5),
      remover:input.remover||null,
      progress:typeof input.progress==='function'?input.progress:null
    };
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
    if(!a||!a.silhouetteReliable)return {mode:'follower',confidence:'safe',reason:'Follower funciona sin deformar el asset.'};
    var elongated=Number(a.elongation)||1;
    if(elongated>=opts.organicThreshold){
      return {mode:'organic',confidence:elongated>=2.2?'high':'medium',reason:'La silueta es alargada y tiene un eje principal confiable.'};
    }
    return {mode:'follower',confidence:'high',reason:'La silueta no necesita deformación para seguir el cursor.'};
  }

  function makeReport(before,after,mode,usedAI,trimmed){
    var quality=scoreAnalysis(after||before);
    return {
      schema:SCHEMA,
      version:1,
      quality:quality,
      recommendedMode:mode.mode,
      recommendationConfidence:mode.confidence,
      recommendationReason:mode.reason,
      usedAI:!!usedAI,
      trimmed:!!trimmed,
      before:before?{
        backgroundReady:!before.needsBackgroundRemoval,
        silhouetteReliable:!!before.silhouetteReliable,
        elongation:Number(before.elongation)||1
      }:null,
      after:after?{
        backgroundReady:!after.needsBackgroundRemoval,
        silhouetteReliable:!!after.silhouetteReliable,
        elongation:Number(after.elongation)||1,
        principalAxisAngle:Number(after.principalAxisAngle)||0,
        subjectBounds:Object.assign({},after.subjectBounds)
      }:null
    };
  }

  function createPipeline(input){
    var o=normalizeOptions(input);
    function emit(stage,detail){
      if(o.progress)try{o.progress(Object.assign({stage:stage},detail||{}));}catch(e){}
    }
    async function analyze(image){
      if(!assetPrep||typeof assetPrep.analyzeImage!=='function')throw new Error('NagWeb Preparation: Asset Prep v1 is required');
      emit('analyze');
      return assetPrep.analyzeImage(image,{maxDimension:o.maxDimension});
    }
    async function removeBackground(image){
      var remover=o.remover;
      if(!remover){
        if(!backgroundAI||typeof backgroundAI.createRemover!=='function')throw new Error('NagWeb Preparation: Background AI adapter is unavailable');
        remover=backgroundAI.createRemover({});
      }
      emit('background-load');
      var result=await remover.remove(image);
      emit('background-complete',{provider:result.provider,device:result.device});
      return result;
    }
    async function trim(image,analysis){
      if(!o.autoTrim||!analysis.silhouetteReliable)return {image:image,trimmed:false};
      emit('trim');
      var t=await assetPrep.trimTransparent(image,analysis,{paddingRatio:o.cropPadding});
      return {image:t.canvas,trimmed:true,trim:t};
    }

    async function prepare(image){
      if(!image)throw new Error('NagWeb Preparation: image is required');
      emit('start');
      var before=await analyze(image),working=image,usedAI=false,aiResult=null;

      if(before.needsBackgroundRemoval&&o.autoRemoveBackground&&o.allowAI){
        try{
          aiResult=await removeBackground(working);
          working=aiResult.canvas||aiResult.raw||working;
          usedAI=true;
        }catch(err){
          emit('background-error',{error:String(err)});
        }
      }

      var after=working===image?before:await analyze(working);
      var trimmedResult=await trim(working,after);
      working=trimmedResult.image;
      if(trimmedResult.trimmed)after=await analyze(working);

      var mode=recommendMode(after,o);
      var report=makeReport(before,after,mode,usedAI,trimmedResult.trimmed);
      var profile=assetPrep.createProfile(after,{
        leadEnd:'right',
        cropPadding:o.cropPadding
      });
      profile.readiness.recommendedMode=mode.mode;

      emit('complete',{quality:report.quality,mode:mode.mode});
      return {
        image:working,
        analysis:after,
        profile:profile,
        report:report,
        usedAI:usedAI,
        aiResult:aiResult,
        trimmed:trimmedResult.trimmed
      };
    }

    return {
      version:VERSION,
      options:clone(o),
      analyze:analyze,
      prepare:prepare,
      score:scoreAnalysis,
      recommend:function(a){return recommendMode(a,o);}
    };
  }

  function serializeReport(report){
    if(!report||report.schema!==SCHEMA||report.version!==1)throw new Error('NagWeb Preparation: invalid report');
    return JSON.stringify(report);
  }
  function deserializeReport(value){
    var r=typeof value==='string'?JSON.parse(value):clone(value);
    if(!r||r.schema!==SCHEMA||r.version!==1||!r.quality)throw new Error('NagWeb Preparation: invalid report');
    return r;
  }

  return {
    version:VERSION,
    schema:SCHEMA,
    normalizeOptions:normalizeOptions,
    scoreAnalysis:scoreAnalysis,
    recommendMode:recommendMode,
    makeReport:makeReport,
    createPipeline:createPipeline,
    serializeReport:serializeReport,
    deserializeReport:deserializeReport
  };
});
