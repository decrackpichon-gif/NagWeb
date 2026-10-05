/* NagWeb Interaction Reaction Profiles v1
   Reusable data presets built on top of Influence Field target controls.
*/
(function(root,factory){
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.NAGWEB_INTERACTION_REACTION_PROFILES=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  var VERSION='1.0.0';
  var PRESETS={
    gentle:{id:'gentle',label:'Apartarse suave',weight:.55,response:{move:1,rotate:0,scale:0},returnSpeed:.75,description:'Desplazamiento moderado y regreso suave.'},
    shift:{id:'shift',label:'Desplazar',weight:1,response:{move:1,rotate:0,scale:0},returnSpeed:1,description:'Empuje directo sin rotación ni escala.'},
    tilt:{id:'tilt',label:'Inclinar',weight:.78,response:{move:1,rotate:1,scale:0},returnSpeed:1.05,description:'Se aparta y acompaña con inclinación.'},
    pulse:{id:'pulse',label:'Pulso',weight:.72,response:{move:0,rotate:0,scale:1},returnSpeed:1.3,description:'Reacciona sólo con escala.'},
    elastic:{id:'elastic',label:'Elástico',weight:1,response:{move:1,rotate:1,scale:1},returnSpeed:.55,description:'Respuesta completa con regreso más flotante.'},
    heavy:{id:'heavy',label:'Pesado',weight:.65,response:{move:1,rotate:0,scale:0},returnSpeed:.4,description:'Poco nervioso, con retorno lento.'},
    floating:{id:'floating',label:'Flotante',weight:.55,response:{move:1,rotate:1,scale:0},returnSpeed:.32,description:'Movimiento liviano con retorno prolongado.'}
  };
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function list(){return Object.keys(PRESETS).map(function(k){return clone(PRESETS[k]);});}
  function get(id){return PRESETS[id]?clone(PRESETS[id]):null;}
  function normalizeCustom(value){
    value=value||{};
    function clamp(v,a,b,d){v=Number(v);if(!Number.isFinite(v))v=d;return Math.max(a,Math.min(b,v));}
    return {
      weight:clamp(value.weight,0,2,1),
      response:{
        move:clamp(value.response&&value.response.move,0,2,1),
        rotate:clamp(value.response&&value.response.rotate,0,2,1),
        scale:clamp(value.response&&value.response.scale,0,2,1)
      },
      returnSpeed:clamp(value.returnSpeed,.25,2,1)
    };
  }
  function resolve(id,fallback){
    var p=get(id);
    return p||Object.assign({id:'custom',label:'Personalizado',description:'Configuración manual.'},normalizeCustom(fallback));
  }
  function matches(value,id,epsilon){
    var p=get(id);if(!p)return false;
    var v=normalizeCustom(value),e=Number(epsilon)||1e-6;
    return Math.abs(v.weight-p.weight)<=e &&
      Math.abs(v.response.move-p.response.move)<=e &&
      Math.abs(v.response.rotate-p.response.rotate)<=e &&
      Math.abs(v.response.scale-p.response.scale)<=e &&
      Math.abs(v.returnSpeed-p.returnSpeed)<=e;
  }
  function identify(value){
    var keys=Object.keys(PRESETS);
    for(var i=0;i<keys.length;i++)if(matches(value,keys[i]))return keys[i];
    return 'custom';
  }
  return {version:VERSION,list:list,get:get,resolve:resolve,identify:identify,matches:matches,normalizeCustom:normalizeCustom};
});
