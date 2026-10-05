/* NagWeb Interaction Session v1
   Portable configuration contract for the future editor integration.
   Stores behavior/profile/settings, never raw image bytes.
*/
(function(root,factory){
  'use strict';
  var api=factory(
    root&&root.NAGWEB_INTERACTION_ENGINE,
    root&&root.NAGWEB_ORGANIC_FOLLOWER,
    root&&root.NAGWEB_INTERACTION_INFLUENCE,
    root&&root.NAGWEB_INTERACTION_ASSET_PREP
  );
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.NAGWEB_INTERACTION_SESSION=api;
})(typeof window!=='undefined'?window:globalThis,function(engine,organic,influence,assetPrep){
  'use strict';
  var VERSION='1.3.0-alpha.1';
  var SCHEMA='nagweb-interaction-session';

  function clone(v){return v==null?v:JSON.parse(JSON.stringify(v));}
  function mode(v){return ['auto','follower','organic'].indexOf(v)>=0?v:'auto';}

  function normalize(input){
    input=input||{};
    var resolved=mode(input.mode);
    var followerOptions=engine&&engine.normalizeOptions?engine.normalizeOptions(input.followerOptions||{}):clone(input.followerOptions||{});
    var organicOptions=clone(input.organicOptions||{});
    var organicRenderer=input.organicRenderer==='mesh-v3'?'mesh-v3':'slices-v2';
    var bodyProfile=['character','creature','ribbon','custom'].indexOf(input.bodyProfile)>=0?input.bodyProfile:'custom';
    var displaySize=Math.max(40,Math.min(2400,Number(input.display&&input.display.size)||Number(organicOptions.length)||310));
    var rawInfluence=input.influenceOptions||{};
    var influenceOptions=influence&&influence.normalizeOptions?influence.normalizeOptions(rawInfluence):clone(rawInfluence);
    influenceOptions.targetScenario=rawInfluence.targetScenario==='all'?'all':'headline';
    return {
      schema:SCHEMA,
      version:1,
      mode:resolved,
      influenceEnabled:input.influenceEnabled!==false,
      followerOptions:followerOptions,
      organicRenderer:organicRenderer,
      bodyProfile:bodyProfile,
      display:{size:displaySize},
      organicOptions:organicOptions,
      influenceOptions:influenceOptions,
      assetProfile:input.assetProfile?clone(input.assetProfile):null,
      preparationReport:input.preparationReport?clone(input.preparationReport):null,
      assetRef:input.assetRef?clone(input.assetRef):null,
      metadata:{
        name:String(input.metadata&&input.metadata.name||'Interacción sin nombre').slice(0,120),
        updatedAt:String(input.metadata&&input.metadata.updatedAt||new Date().toISOString())
      }
    };
  }

  function resolveMode(session){
    var s=normalize(session);
    if(s.mode!=='auto')return s.mode;
    if(s.preparationReport&&['follower','organic'].indexOf(s.preparationReport.recommendedMode)>=0)return s.preparationReport.recommendedMode;
    if(s.assetProfile&&s.assetProfile.readiness&&s.assetProfile.readiness.recommendedMode==='organic')return 'organic';
    return 'follower';
  }

  function validate(value){
    var s=typeof value==='string'?JSON.parse(value):value;
    if(!s||s.schema!==SCHEMA||s.version!==1)throw new Error('NagWeb Interaction Session: invalid session');
    return normalize(s);
  }

  function serialize(value){return JSON.stringify(normalize(value),null,2);}
  function deserialize(value){return validate(value);}

  function summary(value){
    var s=normalize(value),resolved=resolveMode(s);
    return {
      mode:s.mode,
      resolvedMode:resolved,
      influenceEnabled:s.influenceEnabled,
      organicRenderer:s.organicRenderer,
      bodyProfile:s.bodyProfile,
      displaySize:s.display.size,
      hasAssetProfile:!!s.assetProfile,
      quality:s.preparationReport&&s.preparationReport.quality?s.preparationReport.quality.score:null,
      name:s.metadata.name
    };
  }

  return {version:VERSION,schema:SCHEMA,normalize:normalize,resolveMode:resolveMode,validate:validate,serialize:serialize,deserialize:deserialize,summary:summary};
});
