/* Timeline v2. No runtime propio: toda edición usa el modelo del Director. */
(function(){
'use strict';
var M=window.NAGWEB_STORY_MODEL,D=window.NAGWEB_SCROLL_DIRECTOR,pane=document.getElementById('pane');
if(!M||!D||!pane)return;
var selected=null,selectedBeat=null;
var TIMELINE_UI_KEY='nagweb.story.timeline.ui.v1';
function loadTimelineUI(){try{return Object.assign({docked:false,minimized:false,zoom:1,height:320,scrollLeft:0},JSON.parse(localStorage.getItem(TIMELINE_UI_KEY)||'{}'))}catch(_){return{docked:false,minimized:false,zoom:1,height:320,scrollLeft:0}}}
var timelineUI=loadTimelineUI();
var CANVAS_MODE_KEY='nagweb.story.canvas.mode.v1';
var canvasMode=(function(){try{var v=localStorage.getItem(CANVAS_MODE_KEY);return v==='moment'?'moment':'base'}catch(_){return'base'}})();
function saveCanvasMode(){try{localStorage.setItem(CANVAS_MODE_KEY,canvasMode)}catch(_){}}
function viewValue(e,k,d){var o=viewMobile&&e.mobile&&e.mobile[k]!=null?e.mobile:e;var v=o&&o[k];return v==null?d:v;}
function putViewValue(e,k,v){if(viewMobile){e.mobile=e.mobile||{};e.mobile[k]=v}else e[k]=v;}
function atNow(s){return Math.round(M.clamp(M.number(D.progress(s.id),0),0,100)*10)/10;}
function exactMoment(e,at){return frames(e).find(function(k){return Math.abs(k.at-at)<.11;})||null;}
function currentMomentState(e,s,at){return M.evaluate(M.compile(e),M.clamp(at/100,0,1),s.sdEase||'cinematic');}
function makeLegacyFrames(e,s){
 var compiled=M.compile(Object.assign({},e,{sdKeyframesEnabled:false,sdKeyframes:[]}));
 var a=M.clamp(M.number(e.sdStart,0),0,100),b=M.clamp(M.number(e.sdEnd,82),a,100),span=M.number(e.sdSpan,8);
 var ats=[0,a,a+span,b,b+span,100],seen={},out=[];
 ats.forEach(function(at){at=Math.round(M.clamp(at,0,100)*10)/10;if(seen[at])return;seen[at]=1;out.push(Object.assign({id:nid(),at:at,ease:s.sdEase||'cinematic'},M.evaluate(compiled,at/100,s.sdEase||'cinematic')));});
 return M.normalize(out);
}
function commitMomentState(e,s,at,state,patch){
 snapshot();
 var list=active(e)?frames(e):makeLegacyFrames(e,s);
 e.sdKeyframesEnabled=true;s.sdEnabled=true;
 var k=list.find(function(x){return Math.abs(x.at-at)<.11;});
 if(!k){k=Object.assign({id:nid(),at:at,ease:s.sdEase||'cinematic'},state);list.push(k);}
 Object.keys(patch||{}).forEach(function(p){if(!M.properties[p])return;var d=M.properties[p];k[p]=M.clamp(M.number(patch[p],k[p]),d.min,d.max);});
 e.sdKeyframes=M.normalize(list);k=e.sdKeyframes.find(function(x){return Math.abs(x.at-at)<.11;})||e.sdKeyframes.find(function(x){return x.id===k.id;});
 if(k)selected={element:e.id,key:k.id};
 saveProject();renderPane();D.scrub(s.id,at/100);schedulePreview();return k;
}
function commitBaseState(e,patch,afterSnapshot){
 snapshot();Object.keys(patch||{}).forEach(function(k){putViewValue(e,k,patch[k]);});if(typeof afterSnapshot==='function')afterSnapshot();saveProject();renderPane();schedulePreview();
}
function setCanvasMode(mode){
 canvasMode=mode==='moment'?'moment':'base';saveCanvasMode();renderPane();syncCanvasTools();
}
timelineUI.zoom=Math.max(1,Math.min(6,+timelineUI.zoom||1));
timelineUI.height=Math.max(190,Math.min(Math.round(innerHeight*.72),+timelineUI.height||320));
function saveTimelineUI(){try{localStorage.setItem(TIMELINE_UI_KEY,JSON.stringify(timelineUI))}catch(_){}}
function restoreTimelineViewport(){
 requestAnimationFrame(function(){
  var sc=pane.querySelector('.nw-sd-scroll');if(sc)sc.scrollLeft=Math.max(0,+timelineUI.scrollLeft||0);
 });
}
function frames(e){return M.normalize(e.sdKeyframes).map(function(k,i){if(!k.id)k.id='key-'+i;return k;});}
function active(e){return e.sdKeyframesEnabled!==false&&frames(e).length>0;}
function element(id){return (sec().elements||[]).find(function(e){return e.id===id;});}
function current(){return selection.length===1?element(selection[0]):null;}
function picked(e){return selected&&selected.element===e.id?frames(e).find(function(k){return k.id===selected.key;}):null;}
function persist(){var scroller=pane.closest('.col.inspector')||pane,top=scroller.scrollTop,tl=pane.querySelector('.nw-sd-scroll');if(tl)timelineUI.scrollLeft=tl.scrollLeft;saveProject();renderPane();scroller.scrollTop=top;restoreTimelineViewport();schedulePreview();}
function selectElement(id,add){
 var f=findEl(id);if(!f)return;
 curSec=f[0];curEl=f[1];secFocus=false;curPane='elements';
 selection=add?(selection.indexOf(id)>=0?selection.filter(function(x){return x!==id;}):selection.concat(id)):[id];
 if(selection.length===1)curEl=sec().elements.findIndex(function(e){return e.id===selection[0];});
 if(!selection.length){curEl=-1;secFocus=true;}
 if(typeof unfoldTo==='function')unfoldTo(id);
 syncSelectionToFrame();
}
function selectKey(id,key,render){
 var e=element(id),k=e&&frames(e).find(function(k){return k.id===key;});if(!k)return;
 selectElement(id,false);selected={element:id,key:key};D.scrub(sec().id,k.at/100);
 if(render!==false){renderPane();var b=pane.querySelector('[data-sd-key="'+key+'"]');if(b)b.focus({preventScroll:true});}
}
function bounds(list,index){return[index?list[index-1].at+.1:0,index<list.length-1?list[index+1].at-.1:100];}
function moveValue(list,index,at){var b=bounds(list,index);return Math.round(M.clamp(+at,b[0],b[1])*10)/10;}
function beats(s){
 return (Array.isArray(s.sdBeats)?s.sdBeats:[]).filter(function(b){return b&&isFinite(+b.at);}).map(function(b,i){return{id:b.id||'beat-'+i,at:Math.round(M.clamp(+b.at,0,100)*10)/10,name:String(b.name||'Momento').slice(0,60)};}).sort(function(a,b){return a.at-b.at;});
}
function beatAdd(at,name){
 var s=sec(),list=beats(s);at=Math.round(M.clamp(M.number(at,0),0,100)*10)/10;
 var existing=list.find(function(b){return b.at===at;});
 if(existing){selectedBeat={scene:s.id,id:existing.id};renderPane();return existing.id;}
 if(list.length>=128){toast('La escena admite hasta 128 marcadores.');return false;}
 snapshot();var b={id:nid(),at:at,name:String(name||'Nuevo momento').slice(0,60)};list.push(b);s.sdBeats=list;selectedBeat={scene:s.id,id:b.id};persist();return b.id;
}
function beatUpdate(id,patch){
 var s=sec(),list=beats(s),i=list.findIndex(function(b){return b.id===id;});if(i<0)return false;
 var next=Object.assign({},list[i]);if(patch.at!=null)next.at=moveValue(list,i,M.number(patch.at,next.at));if(patch.name!=null)next.name=String(patch.name).trim().slice(0,60)||'Momento';
 if(JSON.stringify(list[i])===JSON.stringify(next))return false;
 snapshot();list[i]=next;s.sdBeats=list;persist();return true;
}
function beatRemove(id){var s=sec(),list=beats(s);if(!list.some(function(b){return b.id===id;}))return false;snapshot();s.sdBeats=list.filter(function(b){return b.id!==id;});selectedBeat=null;persist();return true;}
function hold(id,key,gap){
 var e=element(id),list=e&&frames(e),i=list?list.findIndex(function(k){return k.id===key;}):-1;if(i<0)return false;
 var max=i<list.length-1?list[i+1].at-.1:100,at=Math.round(Math.min(max,list[i].at+M.clamp(M.number(gap,10),.1,100))*10)/10;
 if(at<=list[i].at){toast('No queda espacio después de este momento. Mové el siguiente punto.');return false;}
 return add(id,at,list[i]);
}
function staggerList(s,ids){return (s.elements||[]).filter(function(e){return ids.indexOf(e.id)>=0&&M.eligible(e,s)&&!(e.type==='container'&&e.universal);});}
function stagger(ids,step,start){
 var s=sec(),list=staggerList(s,ids),changes=[];step=M.clamp(M.number(step,5),.1,100);start=M.clamp(M.number(start,0),0,100);
 if(list.length<2){toast('Seleccioná al menos dos elementos dirigibles.');return false;}
 if(start+(list.length-1)*step>=100){toast('Las entradas no caben: bajá la separación o adelantá la primera.');return false;}
 for(var i=0;i<list.length;i++){
  var e=list[i],at=Math.round((start+i*step)*10)/10,ks=frames(e);
  if(active(e)){
   if(100-at<(ks.length-1)*.1){toast('Hay demasiados momentos para ese intervalo. Ampliá el recorrido.');return false;}
   var first=ks[0].at,last=ks[ks.length-1].at,ratio=last===first?1:Math.min(1,(100-at)/(last-first)),previous=at-.1;
   ks.forEach(function(k,j){k.at=Math.round(Math.max(previous+.1,Math.min(100-(ks.length-1-j)*.1,at+(k.at-first)*ratio))*10)/10;previous=k.at;});
   changes.push({e:e,values:{sdKeyframes:ks}});
  }else{
   var span=Math.min(M.number(e.sdSpan,8),(100-at)/2),end=Math.min(e.sdExit&&e.sdExit!=='keep'?100-span:100,at+Math.max(span,M.number(e.sdEnd,82)-M.number(e.sdStart,0)));
   changes.push({e:e,values:{sdStart:at,sdEnd:end,sdSpan:span}});
  }
 }
 snapshot();changes.forEach(function(c){Object.assign(c.e,c.values);});s.sdEnabled=true;persist();return true;
}
function staggerPanel(s){
 var list=staggerList(s,selection);if(list.length<2)return '';
 var first=active(list[0])?frames(list[0])[0].at:M.number(list[0].sdStart,0);
 return '<h4 class="gsub">Aparición escalonada</h4>'+cRow('Primera entrada',num('data-story-stagger','start',first,'Primera entrada',0,100,'%'))+cRow('Separación',num('data-story-stagger','step',5,'Separación entre entradas',.1,100,'%'))+'<button type="button" class="btn tiny" data-story-stagger-apply>Escalonar '+list.length+' elementos</button><p class="hint gh">Sigue el orden de las pistas. Si un recorrido supera el final, se acorta su duración conservando todos sus estados. Los contenedores de Escena universal quedan fuera del reparto.</p>';
}
var presets={
 cinematic:{name:'Entrada cinematográfica',frames:[{at:0,x:-180,y:25,scale:80,opacity:0,blur:12},{at:22,x:0,y:0,scale:100,opacity:100,blur:0},{at:65},{at:90,y:-80,opacity:0,scale:110}]},
 reveal:{name:'Revelado suave',frames:[{at:0,y:35,opacity:0},{at:25,y:0,opacity:100},{at:90}]},
 zoom:{name:'Zoom dramático',frames:[{at:0,scale:60,opacity:0},{at:35,scale:110,opacity:100},{at:55,scale:100},{at:90}]},
 parallax:{name:'Parallax lento',frames:[{at:0,y:60},{at:90,y:-60}]},
 floating:{name:'Texto flotante',frames:[{at:0,y:0},{at:25,y:-25},{at:50,y:0},{at:75,y:-25},{at:100,y:0}]},
 depth:{name:'Salida hacia profundidad',frames:[{at:0},{at:55},{at:90,scale:65,opacity:0,blur:14}]}
};
function preset(id,name){
 var e=element(id),p=presets[name];if(!p||!M.eligible(e,sec()))return false;
 snapshot();e.sdKeyframes=M.normalize(p.frames.map(function(k){return Object.assign({id:nid(),ease:name==='parallax'?'linear':'cinematic'},k);}));e.sdKeyframesEnabled=true;sec().sdEnabled=true;
 selected={element:id,key:e.sdKeyframes[0].id};persist();return true;
}
function presetPanel(){return cRow('Punto de partida','<select class="csel" data-story-preset aria-label="Preset de movimiento"><option value="">Elegir movimiento…</option>'+Object.keys(presets).map(function(k){return '<option value="'+k+'">'+presets[k].name+'</option>';}).join('')+'</select>')+'<p class="hint gh">Reemplaza los momentos de este elemento. Todos los valores quedan editables y podés deshacer.</p>';}
function snap(at,list,index,skip){
 // Marcadores narrativos se conservan en los datos por compatibilidad, pero
 // ya no forman parte de la UI. No hacemos snapping a guías invisibles.
 return at;
}
function beatsPanel(s){
 var list=beats(s),selected=selectedBeat&&selectedBeat.scene===s.id&&list.find(function(b){return b.id===selectedBeat.id;}),body='';
 body+='<div class="nw-sd-trow"><span class="nw-sd-tname">Marcadores</span><div class="nw-sd-ttrack nw-sd-beats" data-story-beat-track>'+list.map(function(b){return '<button type="button" class="nw-sd-beat'+(selected&&selected.id===b.id?' is-selected':'')+'" data-sd-beat="'+b.id+'" style="left:'+b.at+'%" title="'+esc(b.name)+' · '+b.at+'%" aria-label="Marcador '+esc(b.name)+' a '+b.at+'%"><span>'+esc(b.name)+'</span>▾</button>';}).join('')+'</div></div>';
 body+='<div class="nw-sd-actions"><button type="button" class="btn tiny" data-story-beat-add>+ Marcador aquí</button><label class="hint"><input type="checkbox" data-story-snap'+(s.sdSnapBeats!==false?' checked':'')+'> Ajustar a marcadores</label></div>';
 if(selected){var i=list.indexOf(selected),range=bounds(list,i);body+='<div class="nw-sd-beat-inspector" data-story-beat-inspector="'+selected.id+'">'+cRow('Nombre','<input class="csel" aria-label="Nombre del marcador" data-story-beat-field="name" maxlength="60" value="'+esc(selected.name)+'">')+cRow('Momento',num('data-story-beat-field','at',selected.at,'Momento del marcador',range[0],range[1],'%'))+'<button type="button" class="btn tiny danger" data-story-beat-delete="'+selected.id+'">Eliminar marcador</button></div>';}
 return body;
}
function add(id,at,state){
 var e=element(id);if(!M.eligible(e,sec()))return false;
 var list=frames(e);at=Math.round(M.clamp(M.number(at,0),0,100)*10)/10;
 var existing=list.find(function(k){return Math.abs(k.at-at)<.1;});
 if(existing){selectKey(id,existing.id);return existing.id;}
 if(list.length>=512){toast('La pista admite hasta 512 momentos.');return false;}
 var value=state||M.evaluate(M.compile(e),at/100,sec().sdEase);
 snapshot();sec().sdEnabled=true;e.sdKeyframesEnabled=true;
 var k=Object.assign({ease:sec().sdEase||'cinematic'},value,{at:at,id:nid()});
 list.push(k);e.sdKeyframes=M.normalize(list);selectKey(id,k.id,false);persist();return k.id;
}
function update(id,key,patch){
 var e=element(id);if(!M.eligible(e,sec()))return false;
 var list=frames(e),i=list.findIndex(function(k){return k.id===key;});if(i<0)return false;
 var k=list[i],next=Object.assign({},k);
 Object.keys(patch).forEach(function(p){
  if(p==='at')next.at=moveValue(list,i,M.number(patch.at,k.at));
  else if(p==='ease'&&M.easings[patch.ease])next.ease=patch.ease;
  else if(M.properties[p]){var def=M.properties[p];next[p]=M.clamp(M.number(patch[p],k[p]),def.min,def.max);}
 });
 if(JSON.stringify(next)===JSON.stringify(k))return false;
 snapshot();list[i]=next;e.sdKeyframes=list;selected={element:id,key:key};D.scrub(sec().id,next.at/100);persist();return true;
}
function remove(id,key){
 var e=element(id),list=e&&frames(e);if(!list||!list.some(function(k){return k.id===key;}))return false;
 snapshot();e.sdKeyframes=list.filter(function(k){return k.id!==key;});selected=null;persist();return true;
}
function enable(e){
 snapshot();
 if(!frames(e).length){
  var c=M.compile(e),a=M.clamp(M.number(e.sdStart,0),0,100),b=M.clamp(M.number(e.sdEnd,82),a,100),span=M.number(e.sdSpan,8);
  e.sdKeyframes=M.normalize([0,a,a+span,b,b+span,100].map(function(at){at=M.clamp(at,0,100);return Object.assign({id:nid(),at:at,ease:sec().sdEase||'cinematic'},M.evaluate(c,at/100,sec().sdEase));}));
 }
 e.sdKeyframesEnabled=true;sec().sdEnabled=true;selected={element:e.id,key:frames(e)[0].id};persist();
}
function num(attr,key,value,label,min,max,unit){
 return '<label class="num"><input type="number" '+attr+'="'+key+'" value="'+value+'" min="'+min+'" max="'+max+'" step="0.1" aria-label="'+label+'"><span class="u">'+unit+'</span></label>';
}
function transport(s){var val=D.progress(s.id);return '<div class="field cstack"><label>Ver un momento <span data-sd-val>'+Math.round(val)+'%</span></label><input aria-label="Ver un momento" class="crange" type="range" data-sd-scrub="'+s.id+'" min="0" max="100" step="0.1" value="'+val+'"></div><div class="nw-sd-actions"><button type="button" class="btn tiny" data-sd-play="'+s.id+'">▶ Reproducir secuencia</button><button type="button" class="btn tiny" data-sd-live="'+s.id+'">Volver al scroll real</button></div>';}
function timeline(s,val){
 if(selected&&(selection.length!==1||selected.element!==selection[0]))selected=null;
 var list=(s.elements||[]).filter(function(e){return M.eligible(e,s);});
 var zoom=Math.max(1,Math.min(6,+timelineUI.zoom||1)),docked=!!timelineUI.docked,min=!!timelineUI.minimized;
 var controls='<div class="nw-sd-timeline-tools">'+
  '<button type="button" class="btn tiny" data-story-tl-dock title="'+(docked?'Volver al inspector':'Abrir Timeline grande')+'">'+(docked?'↙ Inspector':'⤢ Timeline grande')+'</button>'+
  '<button type="button" class="btn tiny" data-story-tl-zoom="-1" title="Alejar">−</button>'+
  '<button type="button" class="btn tiny" data-story-tl-fit title="Encajar todo">Encajar</button>'+
  '<span class="nw-sd-zoom-label">'+Math.round(zoom*100)+'%</span>'+
  '<button type="button" class="btn tiny" data-story-tl-zoom="1" title="Acercar">+</button>'+
  (docked?'<button type="button" class="btn tiny" data-story-tl-minimize title="'+(min?'Restaurar Timeline':'Minimizar Timeline')+'">'+(min?'□':'−')+'</button>':'')+
  '</div>';
 var rows=list.map(function(e){
  var ks=frames(e),use=active(e),a=use?ks[0].at:M.clamp(M.number(e.sdStart,0),0,100),b=use?ks[ks.length-1].at:M.clamp(M.number(e.sdEnd,82),a,100);
  var name=esc(e.name||e.label||e.text||e.type),isSelected=selection.indexOf(e.id)>=0;
  return '<div class="nw-sd-trow'+(isSelected?' is-selected':'')+'" data-sd-row="'+e.id+'"><button type="button" class="nw-sd-tname" data-story-select="'+e.id+'" title="'+name+'">'+name+'</button><div class="nw-sd-ttrack" data-story-track="'+e.id+'"><i class="nw-sd-playhead"></i><i class="nw-sd-tbar" '+(use?'':'data-sd-bar="1"')+' style="left:'+a+'%;width:'+Math.max(.1,b-a)+'%">'+(use?'':'<button type="button" class="nw-sd-thandle start" data-sd-edge="start" aria-label="Mover inicio"></button><button type="button" class="nw-sd-thandle end" data-sd-edge="end" aria-label="Mover fin"></button>')+'</i>'+ (use?ks.map(function(k,i){
   var prev=ks[i-1],hold=prev&&Object.keys(M.properties).every(function(p){return prev[p]===k[p];});
   return (hold?'<i class="nw-sd-hold" title="Permanencia" style="left:'+prev.at+'%;width:'+(k.at-prev.at)+'%"></i>':'')+'<button type="button" class="nw-sd-key'+(selected&&selected.element===e.id&&selected.key===k.id?' is-selected':'')+'" data-sd-key="'+k.id+'" style="left:'+k.at+'%" aria-label="Momento '+k.at+'% de '+name+'" aria-pressed="'+!!(selected&&selected.element===e.id&&selected.key===k.id)+'" title="'+k.at+'% · '+M.easings[k.ease]+'"></button>';
  }).join(''):'')+'</div></div>';
 }).join('');
 return '<div class="nw-sd-timeline'+(docked?' nw-sd-docked':'')+(min?' is-minimized':'')+'" data-sd-timeline="'+s.id+'" style="--sd-play:'+val+'%;--nw-timeline-height:'+timelineUI.height+'px">'+
  (docked?'<i class="nw-sd-dock-resize" data-story-tl-resize title="Arrastrá para cambiar la altura"></i>':'')+
  '<div class="nw-sd-timeline-head"><span>LÍNEA DE TIEMPO</span>'+controls+'</div>'+
  '<div class="nw-sd-scroll"><div class="nw-sd-canvas" style="width:'+Math.round(zoom*100)+'%"><div class="nw-sd-ruler" data-story-scrub-ruler title="Clic para ir a un momento de la escena"><i class="nw-sd-ruler-playhead"></i><span style="left:0%">0</span><span style="left:25%">25</span><span style="left:50%">50</span><span style="left:75%">75</span><span style="left:100%">100%</span></div><div class="nw-sd-timeline-grid">'+rows+'</div></div></div>'+
  '<p class="hint gh nw-sd-timeline-hint">Clic en la regla o en una pista: ir a ese momento. Doble clic en una pista: agregar momento. Arrastrá los puntos para moverlos. Shift + clic en el nombre: selección múltiple. Shift + rueda: desplazamiento horizontal.</p></div>';
}

function canvasModePanel(s,e){
 var at=atNow(s),hit=exactMoment(e,at),moment=canvasMode==='moment';
 var status=moment?(hit?'◆ Keyframe · '+at+'%':'🎬 '+at+'% · al transformar se crea un keyframe'):'Editás posición, tamaño y rotación base para toda la escena.';
 return '<div class="nw-story-canvas-mode"><h4 class="gsub">Edición en el lienzo</h4><div class="seg nw-story-mode-seg"><button type="button" data-story-canvas-mode="base" class="'+(!moment?'on':'')+'">Diseño base</button><button type="button" data-story-canvas-mode="moment" class="'+(moment?'on':'')+'">Momento de la escena</button></div><p class="hint gh" data-story-mode-status>'+status+'</p></div>';
}
function panel(s,e){
 var ks=frames(e),k=picked(e),body=canvasModePanel(s,e);
 if(!active(e))return body+'<div class="nw-sd-actions"><button type="button" class="btn tiny" data-story-action="enable">'+(ks.length?'Reactivar keyframes':'Crear keyframes del recorrido')+'</button></div><p class="hint gh">Los valores del recorrido anterior se conservan. En “Momento de la escena”, mover o transformar en el lienzo crea el keyframe necesario automáticamente.</p>'+presetPanel();
 body+=transport(s)+timeline(s,D.progress(s.id));
 body+='<div class="nw-sd-actions"><button type="button" class="btn tiny" data-story-action="add">+ Momento aquí</button><button type="button" class="btn tiny" data-story-action="disable">Usar recorrido anterior</button></div>';
 body+=presetPanel();
 if(!k)return body+'<p class="hint gh">Seleccioná un punto para editarlo. Dos puntos con el mismo estado crean una permanencia.</p>';
 var i=ks.findIndex(function(x){return x.id===k.id;}),b=bounds(ks,i);
 body+='<div class="nw-sd-inspector" data-story-inspector="'+k.id+'"><h4 class="gsub">Momento seleccionado</h4>'+cRow('Momento en la escena',num('data-story-field','at',k.at,'Momento en la escena',b[0],b[1],'%'));
 body+='<h4 class="gsub">Transformación</h4>';
 Object.keys(M.properties).forEach(function(p){var def=M.properties[p];if(p==='opacity')body+='<h4 class="gsub">Apariencia</h4>';body+=cRow(def.label,num('data-story-field',p,k[p],def.label,def.min,def.max,def.unit));});
 body+='<h4 class="gsub">Interpolación</h4>'+cRow('Hacia el siguiente momento','<select class="csel" aria-label="Interpolación" data-story-field="ease">'+Object.keys(M.easings).map(function(key){return '<option value="'+key+'"'+(k.ease===key?' selected':'')+'>'+M.easings[key]+'</option>';}).join('')+'</select>');
 body+='<p class="hint gh">'+(i===ks.length-1?'Último momento: este estado se mantiene hasta el final.':'Este cambio de velocidad se aplica al tramo siguiente.')+' Los valores se suman al diseño del elemento; 100% conserva su escala y opacidad base.</p>';
 body+=cRow('Permanecer durante',num('data-story-hold','gap',10,'Duración de la permanencia',.1,100,'%'))+'<div class="nw-sd-actions"><button type="button" class="btn tiny" data-story-action="hold">Agregar permanencia</button><button type="button" class="btn tiny danger" data-story-action="delete">Eliminar momento</button></div></div>';
 return body;
}
pane.addEventListener('change',function(ev){
 if(ev.target.matches('[data-story-preset]')){var e=current();if(e&&ev.target.value)preset(e.id,ev.target.value);return;}
 var beatField=ev.target.closest('[data-story-beat-field]');if(beatField&&selectedBeat){var patch={};patch[beatField.dataset.storyBeatField]=beatField.value;beatUpdate(selectedBeat.id,patch);return;}
 if(ev.target.matches('[data-story-snap]')){snapshot();sec().sdSnapBeats=ev.target.checked;saveProject();return;}
 var t=ev.target.closest('[data-story-field]'),e=current(),k=e&&picked(e);if(!t||!k)return;
 var patch={};patch[t.dataset.storyField]=t.value;update(e.id,k.id,patch);
});
pane.addEventListener('click',function(ev){
 var modeBtn=ev.target.closest&&ev.target.closest('[data-story-canvas-mode]');
 if(modeBtn){setCanvasMode(modeBtn.dataset.storyCanvasMode);return;}
 var scrubSurface=ev.target.closest&&ev.target.closest('[data-story-scrub-ruler],[data-story-track]');
 if(scrubSurface&&!ev.target.closest('[data-sd-key],[data-sd-edge],[data-sd-bar]')){
  var rr=scrubSurface.getBoundingClientRect(),pct=M.clamp((ev.clientX-rr.left)/Math.max(1,rr.width),0,1);
  D.scrub(sec().id,pct);
  return;
 }
 var dockBtn=ev.target.closest('[data-story-tl-dock]');
 if(dockBtn){timelineUI.docked=!timelineUI.docked;timelineUI.minimized=false;saveTimelineUI();renderPane();restoreTimelineViewport();return;}
 if(ev.target.closest('[data-story-tl-minimize]')){timelineUI.minimized=!timelineUI.minimized;saveTimelineUI();renderPane();restoreTimelineViewport();return;}
 if(ev.target.closest('[data-story-tl-fit]')){timelineUI.zoom=1;timelineUI.scrollLeft=0;saveTimelineUI();renderPane();restoreTimelineViewport();return;}
 var zoomBtn=ev.target.closest('[data-story-tl-zoom]');
 if(zoomBtn){
  var steps=[1,1.25,1.5,2,3,4,6],cur=Math.max(0,steps.findIndex(function(z){return z>=timelineUI.zoom-.001;})),dir=+zoomBtn.dataset.storyTlZoom||0;
  cur=Math.max(0,Math.min(steps.length-1,cur+dir));timelineUI.zoom=steps[cur];saveTimelineUI();renderPane();restoreTimelineViewport();return;
 }
 if(ev.target.closest('[data-story-stagger-apply]')){stagger(selection,+pane.querySelector('[data-story-stagger="step"]').value,+pane.querySelector('[data-story-stagger="start"]').value);return;}
 if(ev.target.closest('[data-story-beat-add]')){beatAdd(D.progress(sec().id));return;}
 var beatDel=ev.target.closest('[data-story-beat-delete]');if(beatDel){beatRemove(beatDel.dataset.storyBeatDelete);return;}
 var name=ev.target.closest('[data-story-select]');if(name){selectElement(name.dataset.storySelect,ev.shiftKey);selected=null;renderPane();return;}
 var key=ev.target.closest('[data-sd-key]');if(key){selectKey(key.closest('[data-sd-row]').dataset.sdRow,key.dataset.sdKey);return;}
 var b=ev.target.closest('[data-story-action]'),e=current();if(!b||!e)return;
 var action=b.dataset.storyAction;
 if(action==='enable')enable(e);
 else if(action==='disable'){snapshot();e.sdKeyframesEnabled=false;selected=null;persist();}
 else if(action==='add')add(e.id,D.progress(sec().id));
  else if(action==='delete'&&picked(e))remove(e.id,picked(e).id);
 else if(action==='hold'&&picked(e))hold(e.id,picked(e).id,+pane.querySelector('[data-story-hold]').value);
});
pane.addEventListener('dblclick',function(ev){var track=ev.target.closest('[data-story-track]');if(!track||ev.target.closest('[data-sd-key]'))return;ev.preventDefault();var r=track.getBoundingClientRect();add(track.dataset.storyTrack,(ev.clientX-r.left)/r.width*100);});
pane.addEventListener('pointerdown',function(ev){
 var resize=ev.target.closest('[data-story-tl-resize]');
 if(resize&&ev.button===0){
  ev.preventDefault();ev.stopPropagation();var tl=resize.closest('.nw-sd-timeline'),startY=ev.clientY,startH=tl.getBoundingClientRect().height;
  try{resize.setPointerCapture(ev.pointerId)}catch(_){}
  function mv(e){var max=Math.max(220,Math.round(innerHeight*.78)),h=Math.max(190,Math.min(max,startH+(startY-e.clientY)));timelineUI.height=Math.round(h);tl.style.setProperty('--nw-timeline-height',timelineUI.height+'px');}
  function up(){resize.removeEventListener('pointermove',mv);resize.removeEventListener('pointerup',up);resize.removeEventListener('pointercancel',up);saveTimelineUI();}
  resize.addEventListener('pointermove',mv);resize.addEventListener('pointerup',up);resize.addEventListener('pointercancel',up);return;
 }
 var key=ev.target.closest('[data-sd-key]');if(!key||ev.button!==0)return;
 ev.preventDefault();ev.stopPropagation();
 var id=key.closest('[data-sd-row]').dataset.sdRow,e=element(id),list=frames(e),i=list.findIndex(function(k){return k.id===key.dataset.sdKey;}),r=key.parentElement.getBoundingClientRect(),startX=ev.clientX,startAt=list[i].at,changed=false;
 selectKey(id,list[i].id,false);key.focus({preventScroll:true});key.setPointerCapture(ev.pointerId);
 function move(event){
  var at=snap(moveValue(list,i,startAt+(event.clientX-startX)/Math.max(1,r.width)*100),list,i,event.altKey);
  if(at===list[i].at)return;
  if(!changed){snapshot();changed=true;}
  list[i].at=at;e.sdKeyframes=list;key.style.left=at+'%';
  D.update(sec().id,e);D.scrub(sec().id,at/100);
 }
 function end(event){
  if(event.type==='pointercancel'&&changed){list[i].at=startAt;e.sdKeyframes=list;}
  key.removeEventListener('pointermove',move);key.removeEventListener('pointerup',end);key.removeEventListener('pointercancel',end);
  if(changed)persist();else renderPane();
  var b=pane.querySelector('[data-sd-key="'+list[i].id+'"]');if(b)b.focus({preventScroll:true});
 }
 key.addEventListener('pointermove',move);key.addEventListener('pointerup',end);key.addEventListener('pointercancel',end);
});
pane.addEventListener('pointerdown',function(ev){
 var key=ev.target.closest('[data-sd-beat]');if(!key||ev.button!==0)return;
 ev.preventDefault();ev.stopPropagation();
 var s=sec(),list=beats(s),i=list.findIndex(function(k){return k.id===key.dataset.sdBeat;}),r=key.parentElement.getBoundingClientRect(),startX=ev.clientX,startAt=list[i].at,changed=false;
 selectedBeat={scene:s.id,id:list[i].id};key.setPointerCapture(ev.pointerId);
 function move(event){var at=moveValue(list,i,startAt+(event.clientX-startX)/Math.max(1,r.width)*100);if(at===list[i].at)return;if(!changed){snapshot();changed=true;}list[i].at=at;s.sdBeats=list;key.style.left=at+'%';pane.querySelectorAll('[data-story-beat-line="'+list[i].id+'"]').forEach(function(n){n.style.left=at+'%';});}
 function end(event){
  if(event.type==='pointercancel'&&changed){list[i].at=startAt;s.sdBeats=list;}
  key.removeEventListener('pointermove',move);key.removeEventListener('pointerup',end);key.removeEventListener('pointercancel',end);
  if(changed)persist();else renderPane();var b=pane.querySelector('[data-sd-beat="'+list[i].id+'"]');if(b)b.focus({preventScroll:true});
 }
 key.addEventListener('pointermove',move);key.addEventListener('pointerup',end);key.addEventListener('pointercancel',end);
});
// Capture before the editor's global Delete command, only while a timeline point has focus.
window.addEventListener('keydown',function(ev){
 var beat=ev.target.closest&&ev.target.closest('[data-sd-beat]');
 if(beat){
  var bid=beat.dataset.sdBeat;
  if(ev.key==='Delete'||ev.key==='Backspace'){ev.preventDefault();ev.stopImmediatePropagation();beatRemove(bid);}
  else if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();ev.stopImmediatePropagation();selectedBeat={scene:sec().id,id:bid};renderPane();}
  else if(ev.key==='ArrowLeft'||ev.key==='ArrowRight'){ev.preventDefault();ev.stopImmediatePropagation();var bb=beats(sec()).find(function(b){return b.id===bid;});beatUpdate(bid,{at:bb.at+(ev.key==='ArrowLeft'?-1:1)});var bn=pane.querySelector('[data-sd-beat="'+bid+'"]');if(bn)bn.focus({preventScroll:true});}
  return;
 }
 var b=ev.target.closest&&ev.target.closest('[data-sd-key]');if(!b)return;
 var id=b.closest('[data-sd-row]').dataset.sdRow,key=b.dataset.sdKey;
 if(ev.key==='Delete'||ev.key==='Backspace'){ev.preventDefault();ev.stopImmediatePropagation();remove(id,key);}
 else if(ev.key==='ArrowLeft'||ev.key==='ArrowRight'){
  ev.preventDefault();ev.stopImmediatePropagation();var k=frames(element(id)).find(function(k){return k.id===key;});update(id,key,{at:k.at+(ev.key==='ArrowLeft'?-1:1)*(ev.shiftKey?5:.1)});var next=pane.querySelector('[data-sd-key="'+key+'"]');if(next)next.focus({preventScroll:true});
 }
},true);
var style=document.createElement('style');style.textContent='.nw-story-canvas-mode{margin:8px 0 12px;padding:10px;border:1px solid var(--line);border-radius:10px;background:color-mix(in srgb,var(--panel) 88%,transparent)}.nw-story-mode-seg{display:grid;grid-template-columns:1fr 1fr;gap:4px}.nw-story-mode-seg button{min-width:0}.nw-story-mode-seg button.on{background:var(--ink);color:var(--panel)}.nw-sd-timeline{position:relative}.nw-sd-timeline-head{gap:8px}.nw-sd-ruler{position:relative;height:28px;margin:0 3px 6px 82px;border-bottom:1px solid var(--line);cursor:pointer;user-select:none}.nw-sd-ruler:before{content:"";position:absolute;left:0;right:0;bottom:-1px;height:7px;background:repeating-linear-gradient(90deg,var(--line) 0,var(--line) 1px,transparent 1px,transparent 5%);opacity:.65;pointer-events:none}.nw-sd-ruler span{position:absolute;bottom:8px;transform:translateX(-50%);font:600 9px var(--mono,monospace);color:var(--ink-soft);pointer-events:none}.nw-sd-ruler span:first-of-type{transform:none}.nw-sd-ruler span:last-of-type{transform:translateX(-100%)}.nw-sd-ruler-playhead{position:absolute;z-index:4;top:0;bottom:-5px;width:1px;background:var(--ink);left:var(--sd-play,0%);pointer-events:none}.nw-sd-timeline-tools{display:flex;align-items:center;gap:4px;margin-left:auto;flex-wrap:wrap}.nw-sd-zoom-label{min-width:38px;text-align:center;font:600 10px var(--mono,monospace);color:var(--ink-soft)}.nw-sd-scroll{overflow-x:auto;overflow-y:visible;overscroll-behavior:contain;padding:1px 2px 5px}.nw-sd-canvas{min-width:100%;box-sizing:border-box}.nw-sd-docked{position:fixed!important;z-index:12020;left:256px;right:calc(var(--nw-right-width,300px) + 8px);bottom:8px;height:var(--nw-timeline-height,320px);margin:0!important;display:flex;flex-direction:column;box-shadow:0 20px 70px rgba(0,0,0,.38);backdrop-filter:blur(18px);background:color-mix(in srgb,var(--panel) 96%,transparent)!important}.nw-sd-docked .nw-sd-timeline-head{flex:none}.nw-sd-docked .nw-sd-scroll{flex:1;min-height:0;overflow:auto}.nw-sd-docked .nw-sd-canvas{padding-bottom:8px}.nw-sd-docked .nw-sd-timeline-hint{flex:none}.nw-sd-docked.is-minimized{height:auto!important}.nw-sd-docked.is-minimized .nw-sd-scroll,.nw-sd-docked.is-minimized .nw-sd-timeline-hint{display:none}.nw-sd-dock-resize{position:absolute;z-index:9;left:0;right:0;top:-5px;height:10px;cursor:ns-resize;touch-action:none}.nw-sd-dock-resize:after{content:"";position:absolute;left:42%;right:42%;top:4px;height:2px;border-radius:2px;background:var(--line)}body.nw-left-collapsed .nw-sd-docked{left:42px}body.nw-right-collapsed .nw-sd-docked{right:42px}@media(max-width:1040px){.nw-sd-docked{position:relative!important;left:auto!important;right:auto!important;bottom:auto!important;height:auto!important;box-shadow:none}.nw-sd-dock-resize{display:none}}.nw-sd-ttrack{height:24px;overflow:visible;border-radius:5px;touch-action:none}.nw-sd-tbar{top:9px;bottom:9px;opacity:.65}.nw-sd-key{position:absolute;z-index:6;top:6px;width:12px;height:12px;transform:translateX(-50%) rotate(45deg);padding:0;border:2px solid var(--panel);border-radius:2px;background:var(--accent);cursor:ew-resize;touch-action:none}.nw-sd-key.is-selected,.nw-sd-key:focus-visible{background:var(--ink);outline:2px solid var(--accent);outline-offset:2px}.nw-sd-actions{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.nw-sd-inspector{margin-top:12px;padding-top:6px;border-top:1px solid var(--line)}.nw-sd-hold{position:absolute;top:17px;height:3px;background:var(--ink);opacity:.5;pointer-events:none}.nw-sd-timeline-grid:before{display:none}.nw-sd-ttrack{background:repeating-linear-gradient(90deg,transparent 0,transparent calc(25% - 1px),var(--line) calc(25% - 1px),var(--line) 25%),var(--panel)}.nw-sd-timeline-grid{gap:7px}.nw-sd-tname{min-height:24px}.nw-sd-playhead{z-index:5}.nw-sd-inspector input{min-width:0}';document.head.append(style);
style.textContent+='.nw-sd-beats{height:36px;margin-top:10px}.nw-sd-beat{position:absolute;top:20px;transform:translateX(-50%);padding:0;border:0;color:var(--accent);background:transparent;cursor:ew-resize;touch-action:none}.nw-sd-beat span{position:absolute;bottom:16px;left:0;max-width:64px;overflow:hidden;text-overflow:ellipsis;font:600 9px system-ui;white-space:nowrap}.nw-sd-beat.is-selected{color:var(--ink);outline:1px solid var(--accent)}.nw-sd-beat-line{position:absolute;top:-4px;bottom:-4px;width:1px;border-left:1px dashed var(--accent);opacity:.6;pointer-events:none}.nw-sd-beat-inspector{margin-bottom:10px;padding:6px;border:1px solid var(--line);border-radius:6px}';
pane.addEventListener('wheel',function(ev){
 var sc=ev.target.closest&&ev.target.closest('.nw-sd-scroll');if(!sc||!ev.shiftKey)return;
 ev.preventDefault();sc.scrollLeft+=Math.abs(ev.deltaY)>Math.abs(ev.deltaX)?ev.deltaY:ev.deltaX;timelineUI.scrollLeft=sc.scrollLeft;
},{passive:false});
pane.addEventListener('scroll',function(ev){if(ev.target&&ev.target.classList&&ev.target.classList.contains('nw-sd-scroll'))timelineUI.scrollLeft=ev.target.scrollLeft;},true);
var timelineObserver=new MutationObserver(function(){restoreTimelineViewport();});
timelineObserver.observe(pane,{childList:true,subtree:true});
function syncCanvasTools(){
 var doc,w;try{doc=preview.contentDocument;w=preview.contentWindow}catch(_){return}if(!doc||!doc.body||!w)return;
 doc.body.classList.toggle('nw-story-moment-mode',canvasMode==='moment');
 if(doc.__nwStoryCanvasTools){doc.__nwStoryCanvasTools.refresh();return;}
 var st=doc.createElement('style');st.textContent='.nw-sd-active .el.sc-sel>.sc-h{display:none!important}.nw-story-transform-box{position:fixed;z-index:2147482995;border:1.5px solid #8C6BFF;pointer-events:none;display:none;box-shadow:0 0 0 1px rgba(255,255,255,.22)}.nw-story-transform-h{position:fixed;z-index:2147483001;width:14px;height:14px;border-radius:4px;background:#fff;border:2px solid #8C6BFF;box-shadow:0 2px 7px rgba(0,0,0,.32);display:none;touch-action:none}.nw-story-transform-h.size{cursor:nwse-resize}.nw-story-transform-h.rot{border-radius:50%;background:#FFD34A;cursor:grab}.nw-story-moment-mode .sc-tip{display:none!important}';doc.head.appendChild(st);
 var box=doc.createElement('i'),size=doc.createElement('i'),rot=doc.createElement('i');
 box.className='nw-story-transform-box';size.className='nw-story-transform-h size';rot.className='nw-story-transform-h rot';
 doc.body.appendChild(box);doc.body.appendChild(size);doc.body.appendChild(rot);
 function target(){
  if(selection.length!==1)return null;
  var e=current(),s=sec();if(!e||!s.sdEnabled||!M.eligible(e,s))return null;
  var n=doc.querySelector('.el.sc-sel[data-id="'+e.id+'"]');if(!n||!n.closest('.nw-sd-active'))return null;
  return{e:e,s:s,n:n};
 }
 function hide(){box.style.display=size.style.display=rot.style.display='none';}
 function draw(){
  var q=target();if(!q){hide();return;}var r=q.n.getBoundingClientRect();if(!r.width||!r.height){hide();return;}
  box.style.display=size.style.display=rot.style.display='block';
  box.style.left=r.left+'px';box.style.top=r.top+'px';box.style.width=r.width+'px';box.style.height=r.height+'px';
  size.style.left=(r.right-7)+'px';size.style.top=(r.bottom-7)+'px';
  rot.style.left=(r.left+r.width/2-7)+'px';rot.style.top=(r.top-30)+'px';
 }
 function basePatch(q,patch,afterSnapshot){
  commitBaseState(q.e,patch,afterSnapshot);
 }
 doc.addEventListener('pointerdown',function(ev){
  if(canvasMode!=='moment'||ev.button===2||ev.target.closest('.nw-story-transform-h'))return;
  var node=ev.target.closest&&ev.target.closest('.el[data-id]');if(!node||!node.closest('.nw-sd-active')||node.classList.contains('sc-locked'))return;
  var id=node.dataset.id,found=typeof findEl==='function'&&findEl(id);if(!found)return;
  var s=page().sections[found[0]],e=s&&s.elements[found[1]];if(!s||!s.sdEnabled||!M.eligible(e,s))return;
  if(ev.shiftKey)return; // conserva selección múltiple
  ev.preventDefault();ev.stopImmediatePropagation();
  if(!(selection.length===1&&selection[0]===id)){selectElement(id,false);curSec=found[0];curEl=found[1];renderPane();syncSelectionToFrame();}
  var at=atNow(s),state=currentMomentState(e,s,at),sx=ev.clientX,sy=ev.clientY,moved=false,lastX=state.x,lastY=state.y;
  function mv(e2){
   var dx=e2.clientX-sx,dy=e2.clientY-sy;if(Math.abs(dx)+Math.abs(dy)>2)moved=true;
   lastX=state.x+dx;lastY=state.y+dy;
   node.style.setProperty('--nw-sd-x',lastX.toFixed(2)+'px');node.style.setProperty('--nw-sd-y',lastY.toFixed(2)+'px');draw();
  }
  function up(){w.removeEventListener('pointermove',mv);w.removeEventListener('pointerup',up);w.removeEventListener('pointercancel',up);if(moved)commitMomentState(e,s,at,state,{x:lastX,y:lastY});}
  w.addEventListener('pointermove',mv);w.addEventListener('pointerup',up);w.addEventListener('pointercancel',up);
 },true);

 size.addEventListener('pointerdown',function(ev){
  var q=target();if(!q)return;ev.preventDefault();ev.stopPropagation();
  var r=q.n.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dist0=Math.max(12,Math.hypot(ev.clientX-cx,ev.clientY-cy));
  var at=atNow(q.s),state=currentMomentState(q.e,q.s,at),bw=Math.max(5,+viewValue(q.e,'w',60)),font0=parseFloat(w.getComputedStyle(q.n).fontSize)||16;
  var text=/^(heading|paragraph|label|button)$/.test(q.e.type),proportional=canvasMode==='moment'||(text&&ev.altKey&&ev.shiftKey),last=1,moved=false;
  function mv(e2){last=Math.max(.08,Math.min(8,Math.hypot(e2.clientX-cx,e2.clientY-cy)/dist0));moved=Math.abs(last-1)>.005;
   if(canvasMode==='moment'){q.n.style.setProperty('--nw-sd-scale',(state.scale*last/100).toFixed(4));}
   else{q.n.style.width=Math.max(5,Math.min(100,bw*last))+'%';if(proportional&&text)q.n.style.fontSize=(font0*last)+'px';}
   draw();
  }
  function up(){w.removeEventListener('pointermove',mv);w.removeEventListener('pointerup',up);if(!moved)return;
   if(canvasMode==='moment')commitMomentState(q.e,q.s,at,state,{scale:state.scale*last});
   else{
    var patch={w:Math.round(Math.max(5,Math.min(100,bw*last))*10)/10};
    var scaleRuns=null;
    if(proportional&&text){
     var baseSize=+viewValue(q.e,'customSize',0);patch.customSize=Math.round((baseSize>0?baseSize*last:font0*last)*10)/10;
     if(q.e.richMode&&Array.isArray(q.e.runs))scaleRuns=function(){q.e.runs.forEach(function(run){if(+run.customSize)run.customSize=Math.round(run.customSize*last*10)/10;});};
    }
    basePatch(q,patch,scaleRuns);
   }
  }
  w.addEventListener('pointermove',mv);w.addEventListener('pointerup',up);
 });
 rot.addEventListener('pointerdown',function(ev){
  var q=target();if(!q)return;ev.preventDefault();ev.stopPropagation();
  var r=q.n.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,a0=Math.atan2(ev.clientY-cy,ev.clientX-cx)*180/Math.PI;
  var at=atNow(q.s),state=currentMomentState(q.e,q.s,at),baseRot=+viewValue(q.e,'rot',0),delta=0,moved=false;
  function mv(e2){var a=Math.atan2(e2.clientY-cy,e2.clientX-cx)*180/Math.PI;delta=a-a0;moved=Math.abs(delta)>.2;
   if(canvasMode==='moment')q.n.style.setProperty('--nw-sd-rot',(state.rotate+delta).toFixed(2)+'deg');else q.n.style.setProperty('--rot',(baseRot+delta).toFixed(2)+'deg');draw();}
  function up(){w.removeEventListener('pointermove',mv);w.removeEventListener('pointerup',up);if(!moved)return;if(canvasMode==='moment')commitMomentState(q.e,q.s,at,state,{rotate:state.rotate+delta});else basePatch(q,{rot:Math.round(baseRot+delta)});}
  w.addEventListener('pointermove',mv);w.addEventListener('pointerup',up);
 });
 w.addEventListener('pointermove',draw,true);w.addEventListener('scroll',draw,true);w.addEventListener('resize',draw);doc.addEventListener('nw-sd-progress',draw,true);
 w.addEventListener('message',function(ev){var d=ev.data||{};if(d.sc&&(d.type==='selectionset'||d.type==='nw-story-canvas-mode'))setTimeout(draw,0);});
 doc.__nwStoryCanvasTools={refresh:function(){doc.body.classList.toggle('nw-story-moment-mode',canvasMode==='moment');draw();},draw:draw};
 draw();
}
preview.addEventListener('load',function(){setTimeout(syncCanvasTools,120);});
setTimeout(syncCanvasTools,250);
window.NAGWEB_STORY_TIMELINE_UI={version:'1.1',markersVisible:false,directScrub:true,state:function(){return Object.assign({},timelineUI)},setZoom:function(z){timelineUI.zoom=Math.max(1,Math.min(6,+z||1));saveTimelineUI();renderPane();restoreTimelineViewport();},fit:function(){timelineUI.zoom=1;timelineUI.scrollLeft=0;saveTimelineUI();renderPane();restoreTimelineViewport();}};
window.NAGWEB_STORY_EDITOR={timeline:timeline,panel:panel,transport:transport,active:active,frames:frames,add:add,update:update,remove:remove,select:selectKey,beats:beats,beatAdd:beatAdd,beatUpdate:beatUpdate,beatRemove:beatRemove,hold:hold,stagger:stagger,staggerPanel:staggerPanel,preset:preset,presets:presets,canvasMode:function(){return canvasMode},setCanvasMode:setCanvasMode,canvasEdit:function(id,patch,at){var e=element(id),s=sec();if(!e)return false;at=at==null?atNow(s):at;return commitMomentState(e,s,at,currentMomentState(e,s,at),patch);}};
})();
