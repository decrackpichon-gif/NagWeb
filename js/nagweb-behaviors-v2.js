/* Configuración reversible sobre los sistemas existentes, sin otro motor visual.
   nwBehaviors conserva IDs antiguos; nwBehaviorConfig guarda activación y estados.
   Los campos del elemento son la fuente de verdad mientras la receta está activa. */
(function(){
'use strict';
var B=window.NAGWEB_BEHAVIORS,M=window.NAGWEB_STORY_MODEL,legacyApply=B&&B.apply;
if(!B||!M)return;
function clone(v){return JSON.parse(JSON.stringify(v));}
function current(id){return id==='sticky'||id==='sceneTransition'?sec():selection.length===1?sec().elements.find(function(e){return e.id===selection[0];}):null;}
function host(s,e){var seen=new Set();while(e&&e.parent&&!seen.has(e.parent)){seen.add(e.parent);e=s.elements.find(function(n){return n.id===e.parent;});if(e&&e.type==='container'&&e.universal)return e;}return null;}
function fields(id,t,s){
 var surface=t.type==='container'&&t.universal,inside=host(s,t),keys=[];
 if(id==='reveal'||id==='hold')keys=['sdStart','sdEnd','sdSpan','sdEnter','sdExit'];
 else if(id==='parallax')keys=inside?['ucScroll']:['sdMoveY'];
 else if(id==='cursor'||id==='magnet'||id==='depth')keys=surface?['ucFx',id==='depth'?'ucDepth':'ucIntensity']:['ucReaction','ucStrength','ucAxis'];
 else if(id==='videoScrub')keys=['nwVideoScrub','nwVideoScrubSpan'];
 else if(id==='orbit3d')keys=['nw3dOrbit','nw3dOrbitSpeed'];
 else if(id==='sticky')keys=['sdEnabled','sdLength','sdEase'];
 else if(id==='sceneTransition')keys=['stType','stSpan'];
 return keys;
}
function frameProperties(id,t,s){
 if(t.sdKeyframesEnabled===false||!M.normalize(t.sdKeyframes).length)return [];
 return id==='reveal'||id==='hold'?['opacity']:id==='parallax'&&!host(s,t)?['y']:[];
}
function capture(t,keys){var out={};keys.forEach(function(k){if(t[k]!==undefined)out[k]=clone(t[k]);});return out;}
function restore(t,c,value){c.fields.forEach(function(k){delete t[k];});Object.assign(t,clone(value));}
var neutral={sdStart:0,sdEnd:100,sdSpan:8,sdEnter:'none',sdExit:'keep',sdMoveY:0,ucScroll:0,ucFx:'none',ucDepth:0,ucIntensity:0,ucReaction:'none',ucStrength:0,ucAxis:'both',nwVideoScrub:false,nw3dOrbit:false,sdEnabled:false,stType:'cut',stSpan:24};
function records(t,s){
 var ids=(t.nwBehaviors||[]).filter(function(id){return !!B.registry[id];}),configs=t.nwBehaviorConfig||{};
 return ids.map(function(id,i){
  if(configs[id])return configs[id];
  var keys=fields(id,t,s),superseded=ids.slice(i+1).some(function(next){return fields(next,t,s).some(function(k){return keys.indexOf(k)>=0;});});
  // Old ID-only recipes never owned keyframes. Pausing them must not erase a newer track.
  return{id:id,enabled:!superseded,fields:keys,frameProps:[],params:capture(t,keys),before:capture(neutral,keys)};
 });
}
function materialize(t,s){var out={};records(t,s).forEach(function(c){out[c.id]=clone(c);});t.nwBehaviorConfig=out;return out;}
function compatible(id,t,s){
 if(!t||!s||s.layout==='horizontal')return false;
 if(id==='sticky'||id==='sceneTransition')return true;
 if(!M.eligible(t,s))return false;
 if(id==='videoScrub')return t.type==='video';
 if(id==='cursor'||id==='depth')return !!(t.type==='container'&&t.universal||host(s,t));
 if(id==='magnet')return !!host(s,t);
 return !!B.registry[id];
}
function finish(){saveProject();renderPane();schedulePreview();}
function restoreFrames(t,c,source){
 if(!c.frameProps||!c.frameProps.length||!source||!source.length)return;
 t.sdKeyframes=M.normalize(t.sdKeyframes).map(function(k){var v=M.evaluate({keyframes:source},k.at/100);c.frameProps.forEach(function(p){k[p]=v[p];});return k;});
}
function deactivate(t,c){c.params=capture(t,c.fields);c.frameParams=M.normalize(t.sdKeyframes);restore(t,c,c.before);restoreFrames(t,c,c.frameBefore);c.enabled=false;}
function conflicts(t,all,keys,props,except){Object.keys(all).forEach(function(id){var c=all[id];if(id!==except&&c.enabled&&(c.fields.some(function(k){return keys.indexOf(k)>=0;})||(c.frameProps||[]).some(function(p){return props.indexOf(p)>=0;})))deactivate(t,c);});}
function toggle(id,on){
 var t=current(id),s=sec();if(!t||on&&!compatible(id,t,s))return false;
 var found=records(t,s).find(function(c){return c.id===id;});if(!found||found.enabled===on)return false;
 snapshot();var all=materialize(t,s),c=all[id];
 if(on){conflicts(t,all,c.fields,c.frameProps||[],id);c.before=capture(t,c.fields);c.frameBefore=M.normalize(t.sdKeyframes);restore(t,c,c.params);restoreFrames(t,c,c.frameParams);c.enabled=true;}
 else deactivate(t,c);
 finish();return true;
}
function apply(id){
 var t=current(id),s=sec();if(!compatible(id,t,s)){toast(id==='videoScrub'?'Seleccioná un video nativo para controlar su reproducción.':'Seleccioná un elemento compatible. Las reacciones al cursor necesitan una Escena universal.');return false;}
 var old=records(t,s).find(function(c){return c.id===id;});
 if(old){if(!old.enabled)return toggle(id,true);toast('Ya está aplicado. Sus parámetros están en Comportamientos aplicados.');return true;}
 snapshot();var all=materialize(t,s),keys=fields(id,t,s),props=frameProperties(id,t,s);conflicts(t,all,keys,props,id);
 var before=capture(t,keys),ks=M.normalize(t.sdKeyframes),frameBefore=clone(ks);
 if(!legacyApply(id,{managed:true}))return false;
 if(ks.length&&t.sdKeyframesEnabled!==false){
  if(id==='hold')ks.forEach(function(k){k.opacity=100;});
  else if(id==='reveal'){
   var c={keyframes:ks};ks.forEach(function(k){if(k.at<=12)k.opacity=0;});
   [12,20].forEach(function(at){var k=Object.assign({id:nid(),at:at,ease:'smooth'},M.evaluate(c,at/100));k.opacity=at===12?0:100;ks=ks.filter(function(f){return f.at!==at;});ks.push(k);});
  }else if(id==='parallax'&&!host(s,t))ks.forEach(function(k){k.y=-120*k.at/100;});
  if(id==='hold'||id==='reveal'||id==='parallax'&&!host(s,t))t.sdKeyframes=M.normalize(ks);
 }
 all[id]={id:id,enabled:true,fields:keys,frameProps:props,frameBefore:props.length?frameBefore:[],frameParams:props.length?M.normalize(t.sdKeyframes):[],before:before,params:capture(t,keys)};
 finish();return true;
}
var controls={
 sdStart:['Visible desde','%',0,100],sdEnd:['Visible hasta','%',0,100],sdSpan:['Duración de entrada','%',1,30],sdMoveY:['Movimiento vertical','px',-1600,1600],
 sdEnter:['Entrada',[['none','Ya está'],['fade','Fundido'],['up','Desde abajo'],['down','Desde arriba'],['left','Desde izquierda'],['right','Desde derecha'],['zoom','Zoom'],['blur','Desenfoque'],['depth','Profundidad']]],
 sdExit:['Salida',[['keep','Se queda'],['fade','Fundido'],['up','Hacia arriba'],['down','Hacia abajo'],['left','Hacia izquierda'],['right','Hacia derecha'],['zoom','Zoom'],['blur','Desenfoque']]],
 ucScroll:['Parallax al scroll','px',-160,160],ucStrength:['Intensidad','%',0,100],ucAxis:['Eje',[['both','X + Y'],['x','Horizontal'],['y','Vertical']]],ucDepth:['Profundidad','px',0,120],ucIntensity:['Intensidad visual','',0,1],
 nwVideoScrubSpan:['Recorrido del video','%',20,200],nw3dOrbitSpeed:['Velocidad de órbita','°/s',-180,180],sdLength:['Duración de escena','vh',140,900],sdEase:['Sensación',Object.keys(M.easings).map(function(k){return[k,M.easings[k]];})],
 stType:['Tipo',[['cut','Corte'],['fade','Fundido'],['overlay','Superposición'],['push','Empuje'],['zoom','Zoom'],['morph','Morph simple']]],stSpan:['Duración','%',8,60]
};
function system(c,t,s){
 if(c.id==='sticky')return 'Director de scroll · fija la escena durante su recorrido.';
 if(c.id==='sceneTransition')return 'Transición hacia la escena siguiente.';
 if(c.id==='videoScrub')return 'Video · sigue el momento del Director si está activo; en otras escenas sigue el scroll.';
 if(c.id==='orbit3d')return 'Objeto 3D vinculado · gira alrededor de su ancla en el lienzo.';
 if(c.id==='reveal'||c.id==='hold'||c.id==='parallax'&&!host(s,t))return 'Director de scroll · usa los mismos momentos y valores de la pista.';
 return 'Escena universal · reacción al cursor o al scroll.';
}
function panel(t,s,isScene){
 var list=records(t,s);if(!list.length)return '';
 var html='<p class="hint gh">Podés pausar cada comportamiento y recuperar sus valores al reactivarlo. Si dos controlan las mismas propiedades, se activa uno a la vez.</p>';
 list.forEach(function(c){
  var values=c.enabled?t:c.params,hasFrames=(c.frameProps||[]).length||frameProperties(c.id,t,s).length;
  html+='<div class="nw-behavior-config" data-behavior="'+c.id+'"><h4 class="gsub">'+B.registry[c.id].label+'</h4><label class="hint"><input type="checkbox" data-behavior-toggle="'+c.id+'"'+(c.enabled?' checked':'')+'> Activado</label><p class="hint gh">'+system(c,t,s)+'</p>';
  if(hasFrames)html+='<p class="hint gh">'+((c.frameProps||[]).length?'Los valores están en los keyframes. Seleccioná un momento de la pista para editarlos.':'La pista de keyframes controla este recorrido. Esta receta conserva sus valores para el recorrido anterior.')+'</p>';
  c.fields.forEach(function(key){var def=controls[key];if(!def||hasFrames&&key.indexOf('sd')===0)return;var val=values[key]==null?(neutral[key]==null?0:neutral[key]):values[key],attrs=' data-behavior-field="'+key+'" data-behavior-id="'+c.id+'" aria-label="'+def[0]+'"';
   html+=cRow(def[0],Array.isArray(def[1])?'<select class="csel"'+attrs+'>'+def[1].map(function(o){return '<option value="'+o[0]+'"'+(val===o[0]?' selected':'')+'>'+o[1]+'</option>';}).join('')+'</select>':'<label class="num"><input type="number"'+attrs+' min="'+def[2]+'" max="'+def[3]+'" step="0.1" value="'+val+'"><span class="u">'+def[1]+'</span></label>');
  });html+='</div>';
 });
 return grp(isScene?'nw-scene-behaviors':'nw-behaviors','Comportamientos aplicados',html);
}
var oldScene=paneSceneNew;paneSceneNew=function(){return oldScene()+panel(sec(),sec(),true);};
document.getElementById('pane').addEventListener('change',function(ev){
 var toggleEl=ev.target.closest('[data-behavior-toggle]');if(toggleEl){toggle(toggleEl.dataset.behaviorToggle,toggleEl.checked);return;}
 var field=ev.target.closest('[data-behavior-field]');if(!field)return;
 var id=field.dataset.behaviorId,t=current(id),key=field.dataset.behaviorField,def=controls[key];if(!t||!def)return;
 var val=Array.isArray(def[1])?field.value:M.clamp(M.number(field.value,0),def[2],def[3]);
 snapshot();var c=materialize(t,sec())[id];if(!c)return;c.params[key]=val;if(c.enabled)t[key]=val;finish();
});
window.NAGWEB_BEHAVIOR_EDITOR={panel:panel,records:records};
B.version='2.0';B.apply=apply;B.toggle=toggle;B.applied=function(t,s){return records(t,s||sec()).map(function(c){return clone(c);});};
})();
