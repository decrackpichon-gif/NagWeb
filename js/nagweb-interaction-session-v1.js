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
  var VERSION='1.7.0-alpha.1';
  var SCHEMA='nagweb-interaction-session';

  function clone(v){return v==null?v:JSON.parse(JSON.stringify(v));}
  function mode(v){return ['auto','follower','organic'].indexOf(v)>=0?v:'auto';}
  function normalizeTargetSelection(value){
    if(!Array.isArray(value))return [];
    var seen={};
    return value.slice(0,200).map(function(item){
      item=item||{};
      var id=String(item.id||'').trim().slice(0,120);
      if(!id||seen[id])return null;
      seen[id]=true;
      var weight=Number(item.weight);
      if(!Number.isFinite(weight))weight=1;
      weight=Math.max(0,Math.min(2,weight));
      var response=item.response||{};
      function channel(v){v=Number(v);return Number.isFinite(v)?Math.max(0,Math.min(2,v)):1;}
      var returnSpeed=Number(item.returnSpeed);if(!Number.isFinite(returnSpeed))returnSpeed=1;returnSpeed=Math.max(.25,Math.min(2,returnSpeed));
      var profile=influence&&influence.reactionProfileName?influence.reactionProfileName(item.profile):'custom';
      return {id:id,enabled:item.enabled!==false,weight:weight,response:{move:channel(response.move),rotate:channel(response.rotate),scale:channel(response.scale)},returnSpeed:returnSpeed,profile:profile};
    }).filter(Boolean);
  }

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
    influenceOptions.targetScenario=['headline','all','custom'].indexOf(rawInfluence.targetScenario)>=0?rawInfluence.targetScenario:'headline';
    influenceOptions.targetSelection=normalizeTargetSelection(rawInfluence.targetSelection);
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
      targetScenario:s.influenceOptions.targetScenario,
      reactiveTargetCount:s.influenceOptions.targetSelection.filter(function(t){return t.enabled;}).length,
      hasAssetProfile:!!s.assetProfile,
      quality:s.preparationReport&&s.preparationReport.quality?s.preparationReport.quality.score:null,
      name:s.metadata.name
    };
  }

  return {version:VERSION,schema:SCHEMA,normalizeTargetSelection:normalizeTargetSelection,normalize:normalize,resolveMode:resolveMode,validate:validate,serialize:serialize,deserialize:deserialize,summary:summary};
});
