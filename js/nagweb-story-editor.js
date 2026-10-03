/* Timeline v2. No runtime propio: toda edición usa el modelo del Director. */
(function(){
'use strict';
var M=window.NAGWEB_STORY_MODEL,D=window.NAGWEB_SCROLL_DIRECTOR,pane=document.getElementById('pane');
if(!M||!D||!pane)return;
var selected=null,selectedBeat=null;
function motionOwner(s,e){var seen={};while(e){if(e.nwMotionInstance)return e;if(!e.parent||seen[e.parent])break;seen[e.parent]=1;e=(s.elements||[]).find(function(n){return n.id===e.parent;});}return null;}
function storyContext(s,e){var g=motionOwner(s,e);if(!g)return s;var c=g.nwMotionInstance;return Object.assign({},s,{id:g.id,__motionOwner:g,nwMotionSource:c.source||'time',nwMotionDuration:c.duration||8,nwMotionLoop:c.loop!==false,sdPerspective:c.perspective||1000,sdEnabled:c.source==='scroll',elements:(s.elements||[]).filter(function(n){return motionOwner(s,n)===g;})});}
function storySec(e){return storyContext(sec(),e||current());}
function storyEnabled(s,e){return !!motionOwner(s,e)||s.sdEnabled||s.nwMotionSource==='time';}
function enableStory(s){if(!s.__motionOwner&&s.nwMotionSource!=='time')s.sdEnabled=true;}
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
 e.sdKeyframesEnabled=true;enableStory(s);
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
var timelineUISaveTimer=0;
function saveTimelineUI(){try{localStorage.setItem(TIMELINE_UI_KEY,JSON.stringify(timelineUI))}catch(_){}}
function queueTimelineUISave(){clearTimeout(timelineUISaveTimer);timelineUISaveTimer=setTimeout(saveTimelineUI,120);}
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
 selectElement(id,false);selected={element:id,key:key};D.scrub(storySec(e).id,k.at/100);
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
 snapshot();changes.forEach(function(c){Object.assign(c.e,c.values);});enableStory(s);persist();return true;
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
 depth:{name:'Salida hacia profundidad',frames:[{at:0},{at:55},{at:90,scale:65,opacity:0,blur:14}]},
 iso_focus:{name:'Iso Focus · enfoque inclinado',frames:[{at:0,z:-260,rotateX:32,rotateY:-28},{at:35,z:0,rotateX:0,rotateY:0},{at:65},{at:100,z:-260,rotateX:32,rotateY:28}]}
};
function preset(id,name){
 var e=element(id),p=presets[name];if(!p||!M.eligible(e,sec()))return false;
 snapshot();e.sdKeyframes=M.normalize(p.frames.map(function(k){return Object.assign({id:nid(),ease:name==='parallax'?'linear':'cinematic'},k);}));e.sdKeyframesEnabled=true;enableStory(storySec(e));
 selected={element:id,key:e.sdKeyframes[0].id};persist();D.scrub(storySec(e).id,e.sdKeyframes[0].at/100);return true;
}
function presetPanel(){return cRow('Plantilla de movimiento','<select class="csel" data-story-preset aria-label="Plantilla de movimiento"><option value="">Elegir plantilla…</option>'+Object.keys(presets).map(function(k){return '<option value="'+k+'">'+presets[k].name+'</option>';}).join('')+'</select>')+'<p class="hint gh"><b>Plantilla</b> = un recorrido prearmado para este mismo elemento. No agrega otro objeto: reemplaza sus momentos y después podés editar cada uno.</p>';}
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
 snapshot();enableStory(storySec(e));e.sdKeyframesEnabled=true;
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
 snapshot();list[i]=next;e.sdKeyframes=list;selected={element:id,key:key};D.scrub(storySec(e).id,next.at/100);persist();return true;
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
 e.sdKeyframesEnabled=true;enableStory(storySec(e));selected={element:e.id,key:frames(e)[0].id};persist();
}
function num(attr,key,value,label,min,max,unit){
 return '<label class="num"><input type="number" '+attr+'="'+key+'" value="'+value+'" min="'+min+'" max="'+max+'" step="0.1" aria-label="'+label+'"><span class="u">'+unit+'</span></label>';
}
function transport(s){var val=D.progress(s.id);return '<div class="field cstack"><label>Recorrer la escena <span data-sd-val>'+Math.round(val)+'%</span></label><input aria-label="Recorrer la escena" class="crange" type="range" data-sd-scrub="'+s.id+'" min="0" max="100" step="0.1" value="'+val+'"></div><div class="nw-sd-actions"><button type="button" class="btn tiny" data-sd-play="'+s.id+'">▶ Reproducir</button><button type="button" class="btn tiny" data-sd-pause="'+s.id+'">Pausar</button><button type="button" class="btn tiny" data-sd-live="'+s.id+'">'+(s.nwMotionSource==='time'?'Reiniciar por tiempo':'Volver al scroll real')+'</button></div>';}
function timeline(s,val){
 if(selected&&(selection.length!==1||selected.element!==selection[0]))selected=null;
 var list=(s.elements||[]).filter(function(e){return e.id!==s.id&&M.eligible(e,s);});
 var zoom=Math.max(1,Math.min(6,+timelineUI.zoom||1)),docked=!!timelineUI.docked,min=!!timelineUI.minimized;
 var chosen=selection.length===1?list.find(function(e){return e.id===selection[0];}):null;
 var chosenName=chosen?esc(chosen.name||chosen.label||chosen.text||chosen.type):selection.length>1?(selection.length+' elementos'):'Ningún elemento';
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
  var name=esc(e.name||e.label||e.text||e.type),isSelected=selection.indexOf(e.id)>=0,mode=use?(ks.length+' momento'+(ks.length===1?'':'s')):'recorrido simple';
  return '<div class="nw-sd-trow'+(isSelected?' is-selected':'')+'" data-sd-row="'+e.id+'"><button type="button" class="nw-sd-tname" data-story-select="'+e.id+'" title="'+name+' · '+mode+'"><span>'+name+'</span><small>'+mode+'</small></button><div class="nw-sd-ttrack" data-story-track="'+e.id+'" title="Clic: recorrer la escena · Doble clic: guardar momento"><i class="nw-sd-playhead"></i><i class="nw-sd-tbar" '+(use?'':'data-sd-bar="1"')+' style="left:'+a+'%;width:'+Math.max(.1,b-a)+'%">'+(use?'':'<button type="button" class="nw-sd-thandle start" data-sd-edge="start" aria-label="Mover inicio"></button><button type="button" class="nw-sd-thandle end" data-sd-edge="end" aria-label="Mover fin"></button>')+'</i>'+ (use?ks.map(function(k,i){
   var prev=ks[i-1],hold=prev&&Object.keys(M.properties).every(function(p){return prev[p]===k[p];});
   return (hold?'<i class="nw-sd-hold" title="Permanencia" style="left:'+prev.at+'%;width:'+(k.at-prev.at)+'%"></i>':'')+'<button type="button" class="nw-sd-key'+(selected&&selected.element===e.id&&selected.key===k.id?' is-selected':'')+'" data-sd-key="'+k.id+'" style="left:'+k.at+'%" aria-label="Momento '+k.at+'% de '+name+'" aria-pressed="'+!!(selected&&selected.element===e.id&&selected.key===k.id)+'" title="'+k.at+'% · '+M.easings[k.ease]+'"></button>';
  }).join(''):'')+'</div></div>';
 }).join('');
 return '<div class="nw-sd-timeline'+(docked?' nw-sd-docked':'')+(min?' is-minimized':'')+'" data-sd-timeline="'+s.id+'" style="--sd-play:'+val+'%;--nw-timeline-height:'+timelineUI.height+'px">'+
  (docked?'<i class="nw-sd-dock-resize" data-story-tl-resize title="Arrastrá para cambiar la altura"></i>':'')+
  '<div class="nw-sd-timeline-head"><div class="nw-sd-timeline-context"><span class="nw-sd-eyebrow">LÍNEA DE TIEMPO</span><strong>'+chosenName+'</strong><em data-story-timeline-now>'+Math.round(val)+'%</em></div>'+controls+'</div>'+
  '<div class="nw-sd-scroll"><div class="nw-sd-canvas" style="width:'+Math.round(zoom*100)+'%"><div class="nw-sd-ruler" data-story-scrub-ruler title="Clic para ir a un momento de la escena"><i class="nw-sd-ruler-playhead"></i><span style="left:0%">0</span><span style="left:25%">25</span><span style="left:50%">50</span><span style="left:75%">75</span><span style="left:100%">100%</span></div><div class="nw-sd-timeline-grid">'+rows+'</div></div></div>'+
  '</div>';
}

function canvasModePanel(s,e){
 var at=atNow(s),hit=exactMoment(e,at),moment=canvasMode==='moment';
 var status=moment?(hit?'◆ Momento guardado · '+at+'%':'🎬 '+at+'% · al mover, girar o redimensionar se guarda un momento nuevo'):'Editás la posición, el tamaño y el giro base que usa toda la escena.';
 return '<div class="nw-story-canvas-mode '+(moment?'is-moment':'is-base')+'"><div class="nw-story-mode-head"><h4 class="gsub">Edición en el lienzo</h4><span>'+(moment?('Momento '+at+'%'):'Base')+'</span></div><div class="seg nw-story-mode-seg"><button type="button" data-story-canvas-mode="base" class="'+(!moment?'on':'')+'">Diseño base</button><button type="button" data-story-canvas-mode="moment" class="'+(moment?'on':'')+'">Momento de la escena</button></div><p class="hint gh" data-story-mode-status>'+status+'</p></div>';
}
function panel(s,e){
 s=storyContext(s,e);
 var ks=frames(e),k=picked(e),body=canvasModePanel(s,e);
 if(!active(e))return body+'<div class="nw-sd-actions"><button type="button" class="btn tiny" data-story-action="enable">'+(ks.length?'Reactivar momentos editables':'Crear momentos editables')+'</button></div><p class="hint gh">Con <b>Momento de la escena</b>, cada cambio del lienzo se guarda en el porcentaje actual sin modificar los demás momentos.</p>'+presetPanel();
 body+=transport(s)+timeline(s,D.progress(s.id));
 body+='<div class="nw-sd-actions nw-story-main-actions"><button type="button" class="btn tiny nw-story-primary" data-story-action="add">+ Guardar momento aquí</button><button type="button" class="btn tiny nw-story-secondary" data-story-action="disable">Volver al recorrido simple</button></div>';
 body+=presetPanel();
 if(!k)return body+'<p class="hint gh">Seleccioná un punto para editarlo. Dos puntos con el mismo estado crean una permanencia.</p>';
 var i=ks.findIndex(function(x){return x.id===k.id;}),b=bounds(ks,i);
 body+='<div class="nw-sd-inspector" data-story-inspector="'+k.id+'"><div class="nw-story-inspector-head"><span>Momento seleccionado</span><strong>'+k.at+'%</strong></div>'+cRow('Momento en la escena',num('data-story-field','at',k.at,'Momento en la escena',b[0],b[1],'%'));
 body+='<h4 class="gsub">Cómo está el elemento en este momento</h4>';
 ['x','y','scale','rotate','z','rotateX','rotateY','opacity','blur'].forEach(function(p){var def=M.properties[p];if(p==='z')body+='<h4 class="gsub">Profundidad e inclinación</h4><p class="hint gh">Profundidad positiva acerca el elemento; negativa lo aleja. Cero conserva el plano del diseño base. La perspectiva se ajusta en el Director de scroll de la escena.</p>';if(p==='opacity')body+='<h4 class="gsub">Apariencia</h4>';body+=cRow(def.label,num('data-story-field',p,k[p],def.label,def.min,def.max,def.unit));});
 body+='<p class="hint gh">En movimiento: valores negativos llevan a izquierda/arriba; positivos a derecha/abajo. X 0 e Y 0 significan la posición del diseño base.</p><h4 class="gsub">Cómo cambia hasta el próximo momento</h4>'+cRow('Ritmo del cambio','<select class="csel" aria-label="Ritmo del cambio" data-story-field="ease">'+Object.keys(M.easings).map(function(key){return '<option value="'+key+'"'+(k.ease===key?' selected':'')+'>'+M.easings[key]+'</option>';}).join('')+'</select>');
 body+='<p class="hint gh">'+(i===ks.length-1?'Último momento: este estado se mantiene hasta el final.':'Este cambio de velocidad se aplica al tramo siguiente.')+' Los valores se suman al diseño del elemento; 100% conserva su escala y opacidad base.</p>';
 body+=cRow('Mantener este estado durante',num('data-story-hold','gap',10,'Duración de la permanencia',.1,100,'%'))+'<div class="nw-sd-actions"><button type="button" class="btn tiny" data-story-action="hold">Crear permanencia</button><button type="button" class="btn tiny danger" data-story-action="delete">Eliminar momento</button></div></div>';
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
 if(scrubSurface&&!ev.target.closest('[data-sd-key],[data-sd-edge]')){
  var rr=scrubSurface.getBoundingClientRect(),pct=M.clamp((ev.clientX-rr.left)/Math.max(1,rr.width),0,1);
  D.scrub(storySec().id,pct);
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
 if(ev.target.closest('[data-story-beat-add]')){beatAdd(D.progress(storySec().id));return;}
 var beatDel=ev.target.closest('[data-story-beat-delete]');if(beatDel){beatRemove(beatDel.dataset.storyBeatDelete);return;}
 var name=ev.target.closest('[data-story-select]');if(name){selectElement(name.dataset.storySelect,ev.shiftKey);selected=null;renderPane();return;}
 var key=ev.target.closest('[data-sd-key]');if(key){selectKey(key.closest('[data-sd-row]').dataset.sdRow,key.dataset.sdKey);return;}
 var b=ev.target.closest('[data-story-action]'),e=current();if(!b||!e)return;
 var action=b.dataset.storyAction;
 if(action==='enable')enable(e);
 else if(action==='disable'){snapshot();e.sdKeyframesEnabled=false;selected=null;persist();}
 else if(action==='add')add(e.id,D.progress(storySec().id));
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
 var id=key.closest('[data-sd-row]').dataset.sdRow,e=element(id),originalFrames=e.sdKeyframes,undoBefore=history.slice(),redoBefore=future.slice(),list=frames(e),i=list.findIndex(function(k){return k.id===key.dataset.sdKey;}),r=key.parentElement.getBoundingClientRect(),startX=ev.clientX,startAt=list[i].at,changed=false;
 selectKey(id,list[i].id,false);key.focus({preventScroll:true});key.setPointerCapture(ev.pointerId);
 function move(event){
  var at=snap(moveValue(list,i,startAt+(event.clientX-startX)/Math.max(1,r.width)*100),list,i,event.altKey);
  if(at===list[i].at)return;
  if(!changed){snapshot();changed=true;}
  list[i].at=at;e.sdKeyframes=list;key.style.left=at+'%';
  D.update(storySec(e).id,e);D.scrub(storySec(e).id,at/100);
 }
 function end(event){
  if(event.type==='pointercancel'&&changed){list[i].at=startAt;e.sdKeyframes=originalFrames;history=undoBefore;future=redoBefore;D.update(storySec(e).id,e);D.scrub(storySec(e).id,startAt/100);}
  key.removeEventListener('pointermove',move);key.removeEventListener('pointerup',end);key.removeEventListener('pointercancel',end);
  if(changed)persist();else renderPane();
  var b=pane.querySelector('[data-sd-key="'+list[i].id+'"]');if(b)b.focus({preventScroll:true});
 }
 key.addEventListener('pointermove',move);key.addEventListener('pointerup',end);key.addEventListener('pointercancel',end);
});
pane.addEventListener('pointerdown',function(ev){
 var key=ev.target.closest('[data-sd-beat]');if(!key||ev.button!==0)return;
 ev.preventDefault();ev.stopPropagation();
 var s=sec(),originalBeats=s.sdBeats,undoBefore=history.slice(),redoBefore=future.slice(),list=beats(s),i=list.findIndex(function(k){return k.id===key.dataset.sdBeat;}),r=key.parentElement.getBoundingClientRect(),startX=ev.clientX,startAt=list[i].at,changed=false;
 selectedBeat={scene:s.id,id:list[i].id};key.setPointerCapture(ev.pointerId);
 function move(event){var at=moveValue(list,i,startAt+(event.clientX-startX)/Math.max(1,r.width)*100);if(at===list[i].at)return;if(!changed){snapshot();changed=true;}list[i].at=at;s.sdBeats=list;key.style.left=at+'%';pane.querySelectorAll('[data-story-beat-line="'+list[i].id+'"]').forEach(function(n){n.style.left=at+'%';});}
 function end(event){
  if(event.type==='pointercancel'&&changed){list[i].at=startAt;s.sdBeats=originalBeats;history=undoBefore;future=redoBefore;}
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
var style=document.createElement('style');style.textContent='.nw-story-canvas-mode{margin:8px 0 12px;padding:10px;border:1px solid var(--line);border-radius:10px;background:color-mix(in srgb,var(--panel) 88%,transparent)}.nw-story-mode-seg{display:grid;grid-template-columns:1fr 1fr;gap:4px}.nw-story-mode-seg button{min-width:0}.nw-story-mode-seg button.on{background:var(--ink);color:var(--panel)}.nw-sd-timeline{position:relative}.nw-sd-timeline-head{gap:8px}.nw-sd-ruler{position:relative;height:28px;margin:0 3px 6px 82px;border-bottom:1px solid var(--line);cursor:pointer;user-select:none}.nw-sd-ruler:before{content:"";position:absolute;left:0;right:0;bottom:-1px;height:7px;background:repeating-linear-gradient(90deg,var(--line) 0,var(--line) 1px,transparent 1px,transparent 5%);opacity:.65;pointer-events:none}.nw-sd-ruler span{position:absolute;bottom:8px;transform:translateX(-50%);font:600 9px var(--mono,monospace);color:var(--ink-soft);pointer-events:none}.nw-sd-ruler span:first-of-type{transform:none}.nw-sd-ruler span:last-of-type{transform:translateX(-100%)}.nw-sd-ruler-playhead{position:absolute;z-index:4;top:0;bottom:-5px;width:1px;background:var(--ink);left:var(--sd-play,0%);pointer-events:none}.nw-sd-timeline-tools{display:flex;align-items:center;gap:4px;margin-left:auto;flex-wrap:wrap}.nw-sd-zoom-label{min-width:38px;text-align:center;font:600 10px var(--mono,monospace);color:var(--ink-soft)}.nw-sd-scroll{overflow-x:auto;overflow-y:visible;overscroll-behavior:contain;padding:1px 2px 5px}.nw-sd-canvas{min-width:100%;box-sizing:border-box}.nw-sd-docked{position:fixed!important;z-index:12020;left:256px;right:calc(var(--nw-right-width,300px) + 8px);bottom:8px;height:var(--nw-timeline-height,320px);margin:0!important;display:flex;flex-direction:column;box-shadow:0 20px 70px rgba(0,0,0,.38);backdrop-filter:blur(18px);background:color-mix(in srgb,var(--panel) 96%,transparent)!important}.nw-sd-docked .nw-sd-timeline-head{flex:none}.nw-sd-docked .nw-sd-scroll{flex:1;min-height:0;overflow:auto}.nw-sd-docked .nw-sd-canvas{padding-bottom:2px}.nw-sd-docked .nw-sd-timeline-hint{flex:none}.nw-sd-docked.is-minimized{height:auto!important}.nw-sd-docked.is-minimized .nw-sd-scroll,.nw-sd-docked.is-minimized .nw-sd-timeline-hint{display:none}.nw-sd-dock-resize{position:absolute;z-index:9;left:0;right:0;top:-5px;height:10px;cursor:ns-resize;touch-action:none}.nw-sd-dock-resize:after{content:"";position:absolute;left:42%;right:42%;top:4px;height:2px;border-radius:2px;background:var(--line)}body.nw-left-collapsed .nw-sd-docked{left:42px}body.nw-right-collapsed .nw-sd-docked{right:42px}@media(max-width:1040px){.nw-sd-docked{position:relative!important;left:auto!important;right:auto!important;bottom:auto!important;height:auto!important;box-shadow:none}.nw-sd-dock-resize{display:none}}.nw-sd-ttrack{height:24px;overflow:visible;border-radius:5px;touch-action:none}.nw-sd-tbar{top:9px;bottom:9px;opacity:.65}.nw-sd-key{position:absolute;z-index:6;top:6px;width:12px;height:12px;transform:translateX(-50%) rotate(45deg);padding:0;border:2px solid var(--panel);border-radius:2px;background:var(--accent);cursor:ew-resize;touch-action:none}.nw-sd-key.is-selected,.nw-sd-key:focus-visible{background:var(--ink);outline:2px solid var(--accent);outline-offset:2px}.nw-sd-actions{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.nw-sd-inspector{margin-top:12px;padding-top:6px;border-top:1px solid var(--line)}.nw-sd-hold{position:absolute;top:17px;height:3px;background:var(--ink);opacity:.5;pointer-events:none}.nw-sd-timeline-grid:before{display:none}.nw-sd-ttrack{background:repeating-linear-gradient(90deg,transparent 0,transparent calc(25% - 1px),var(--line) calc(25% - 1px),var(--line) 25%),var(--panel)}.nw-sd-timeline-grid{gap:7px}.nw-sd-tname{min-height:24px}.nw-sd-playhead{z-index:5}.nw-sd-inspector input{min-width:0}';document.head.append(style);
style.textContent+='.nw-sd-beats{height:36px;margin-top:10px}.nw-sd-beat{position:absolute;top:20px;transform:translateX(-50%);padding:0;border:0;color:var(--accent);background:transparent;cursor:ew-resize;touch-action:none}.nw-sd-beat span{position:absolute;bottom:16px;left:0;max-width:64px;overflow:hidden;text-overflow:ellipsis;font:600 9px system-ui;white-space:nowrap}.nw-sd-beat.is-selected{color:var(--ink);outline:1px solid var(--accent)}.nw-sd-beat-line{position:absolute;top:-4px;bottom:-4px;width:1px;border-left:1px dashed var(--accent);opacity:.6;pointer-events:none}.nw-sd-beat-inspector{margin-bottom:10px;padding:6px;border:1px solid var(--line);border-radius:6px}';
style.textContent+='.nw-sd-timeline{--nw-story-label-width:92px;padding:5px 7px 4px!important}.nw-sd-timeline-head{align-items:center!important;min-height:22px!important;margin-bottom:2px!important;gap:7px}.nw-sd-timeline-context{display:flex;gap:6px;min-width:0;align-items:center;white-space:nowrap}.nw-sd-timeline-context .nw-sd-eyebrow{flex:none;font:700 7px/1 system-ui;letter-spacing:.1em;color:var(--muted)}.nw-sd-timeline-context strong{min-width:0;max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:700 10px/1.1 system-ui;color:var(--ink);letter-spacing:0;text-transform:none}.nw-sd-timeline-context em{flex:none;padding:2px 5px;border:1px solid color-mix(in srgb,var(--accent) 45%,var(--line));border-radius:999px;background:color-mix(in srgb,var(--accent) 10%,transparent);font:700 8px/1 var(--mono,monospace);font-style:normal;color:var(--ink)}.nw-sd-timeline-tools{gap:3px!important;flex-wrap:nowrap!important}.nw-sd-timeline-tools .btn.tiny{min-height:20px;padding-top:2px!important;padding-bottom:2px!important}.nw-sd-zoom-label{min-width:32px!important;font-size:8px!important}.nw-sd-ruler{height:19px!important;margin-bottom:2px!important}.nw-sd-ruler span{bottom:5px!important;font-size:8px!important}.nw-sd-ruler:before{height:5px!important}.nw-sd-scroll{padding-bottom:2px!important}.nw-sd-trow{grid-template-columns:var(--nw-story-label-width) minmax(0,1fr);padding:3px;border-left:2px solid transparent}.nw-sd-trow.is-selected{border-left-color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,transparent)}.nw-sd-tname{position:sticky;left:0;z-index:7;display:flex;flex-direction:column;justify-content:center;gap:1px;min-height:29px;padding:3px 5px 3px 3px!important;background:color-mix(in srgb,var(--panel) 96%,transparent)!important}.nw-sd-tname span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.nw-sd-tname small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:500 8px/1 system-ui;color:var(--muted)}.nw-sd-trow.is-selected .nw-sd-tname small{color:var(--ink-soft)}.nw-sd-ruler{margin-left:calc(var(--nw-story-label-width) + 10px)}.nw-sd-ttrack{height:23px}.nw-sd-docked{--nw-story-label-width:150px}.nw-sd-docked .nw-sd-timeline-head{display:grid!important;grid-template-columns:minmax(0,1fr) auto;height:24px!important;min-height:24px!important;margin-bottom:0!important;align-items:center!important}.nw-sd-docked .nw-sd-timeline-context{height:20px;gap:5px}.nw-sd-docked .nw-sd-eyebrow{display:none}.nw-sd-docked .nw-sd-timeline-tools{height:20px;align-items:center}.nw-sd-docked .nw-sd-timeline-tools .btn.tiny{height:20px!important;min-height:20px!important;margin:0!important;padding:0 6px!important;line-height:18px!important}.nw-sd-docked .nw-sd-ruler{height:17px!important;margin-bottom:1px!important}.nw-sd-docked .nw-sd-timeline-context strong{max-width:340px}.nw-sd-docked .nw-sd-tname{min-height:30px;padding-left:7px!important}.nw-story-mode-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px}.nw-story-mode-head .gsub{margin:0}.nw-story-mode-head span{padding:3px 6px;border-radius:999px;background:color-mix(in srgb,var(--line) 60%,transparent);font:700 8px/1 system-ui;color:var(--ink-soft)}.nw-story-canvas-mode.is-moment{border-color:color-mix(in srgb,var(--accent) 58%,var(--line));box-shadow:0 0 0 1px color-mix(in srgb,var(--accent) 10%,transparent) inset}.nw-story-canvas-mode.is-moment .nw-story-mode-head span{background:color-mix(in srgb,var(--accent) 16%,transparent);color:var(--ink)}.nw-story-main-actions{align-items:stretch}.nw-story-primary{border-color:var(--accent)!important;background:color-mix(in srgb,var(--accent) 18%,var(--panel))!important;color:var(--ink)!important;font-weight:700!important}.nw-story-secondary{opacity:.78}.nw-story-inspector-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:2px 0 9px}.nw-story-inspector-head span{font:700 10px/1.2 system-ui;color:var(--ink)}.nw-story-inspector-head strong{padding:4px 7px;border-radius:999px;background:color-mix(in srgb,var(--accent) 14%,transparent);font:700 10px/1 var(--mono,monospace);color:var(--ink)}@media(max-width:1040px){.nw-sd-timeline{--nw-story-label-width:86px}.nw-sd-timeline-context strong{max-width:150px}}';
pane.addEventListener('wheel',function(ev){
 var sc=ev.target.closest&&ev.target.closest('.nw-sd-scroll');if(!sc||!ev.shiftKey)return;
 ev.preventDefault();sc.scrollLeft+=Math.abs(ev.deltaY)>Math.abs(ev.deltaX)?ev.deltaY:ev.deltaX;timelineUI.scrollLeft=sc.scrollLeft;
},{passive:false});
pane.addEventListener('scroll',function(ev){if(ev.target&&ev.target.classList&&ev.target.classList.contains('nw-sd-scroll')){timelineUI.scrollLeft=ev.target.scrollLeft;queueTimelineUISave();}},true);
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
  var e=current(),s=sec();if(!e||!storyEnabled(s,e)||!M.eligible(e,s))return null;
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
 function rememberStyles(n,keys){
  var saved=keys.map(function(k){return[k,n.style.getPropertyValue(k),n.style.getPropertyPriority(k)];});
  return function(){saved.forEach(function(v){if(v[1])n.style.setProperty(v[0],v[1],v[2]);else n.style.removeProperty(v[0]);});draw();};
 }
 doc.addEventListener('pointerdown',function(ev){
  if(canvasMode!=='moment'||ev.button===2||ev.target.closest('.nw-story-transform-h'))return;
  var node=ev.target.closest&&ev.target.closest('.el[data-id]');if(!node||!node.hasAttribute('data-nw-sd-el')||node.classList.contains('sc-locked'))return;
  var id=node.dataset.id,found=typeof findEl==='function'&&findEl(id);if(!found)return;
  var s=page().sections[found[0]],e=s&&s.elements[found[1]];if(!s||!storyEnabled(s,e)||!M.eligible(e,s))return;
  if(ev.shiftKey)return; // conserva selección múltiple
  ev.preventDefault();ev.stopImmediatePropagation();
  if(!(selection.length===1&&selection[0]===id)){selectElement(id,false);curSec=found[0];curEl=found[1];renderPane();syncSelectionToFrame();}
  s=storyContext(s,e);var at=atNow(s),state=currentMomentState(e,s,at),sx=ev.clientX,sy=ev.clientY,moved=false,lastX=state.x,lastY=state.y,restore=rememberStyles(node,['--nw-sd-x','--nw-sd-y']);
  function mv(e2){
   var dx=e2.clientX-sx,dy=e2.clientY-sy;if(Math.abs(dx)+Math.abs(dy)>2)moved=true;
   lastX=state.x+dx;lastY=state.y+dy;
   node.style.setProperty('--nw-sd-x',lastX.toFixed(2)+'px');node.style.setProperty('--nw-sd-y',lastY.toFixed(2)+'px');draw();
  }
  function up(event){w.removeEventListener('pointermove',mv);w.removeEventListener('pointerup',up);w.removeEventListener('pointercancel',up);if(event.type==='pointercancel'||!moved){restore();return;}commitMomentState(e,s,at,state,{x:lastX,y:lastY});}
  w.addEventListener('pointermove',mv);w.addEventListener('pointerup',up);w.addEventListener('pointercancel',up);
 },true);

 size.addEventListener('pointerdown',function(ev){
  var q=target();if(!q)return;ev.preventDefault();ev.stopPropagation();
  var r=q.n.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dist0=Math.max(12,Math.hypot(ev.clientX-cx,ev.clientY-cy));
  var at=atNow(storyContext(q.s,q.e)),state=currentMomentState(q.e,q.s,at),bw=Math.max(5,+viewValue(q.e,'w',60)),font0=parseFloat(w.getComputedStyle(q.n).fontSize)||16;
  var text=/^(heading|paragraph|label|button)$/.test(q.e.type),proportional=canvasMode==='moment'||(text&&ev.altKey&&ev.shiftKey),last=1,moved=false,restore=rememberStyles(q.n,['--nw-sd-scale','width','font-size']);
  function mv(e2){last=Math.max(.08,Math.min(8,Math.hypot(e2.clientX-cx,e2.clientY-cy)/dist0));moved=Math.abs(last-1)>.005;
   if(canvasMode==='moment'){q.n.style.setProperty('--nw-sd-scale',(state.scale*last/100).toFixed(4));}
   else{q.n.style.width=Math.max(5,Math.min(100,bw*last))+'%';if(proportional&&text)q.n.style.fontSize=(font0*last)+'px';}
   draw();
  }
  function up(event){w.removeEventListener('pointermove',mv);w.removeEventListener('pointerup',up);w.removeEventListener('pointercancel',up);if(event.type==='pointercancel'||!moved){restore();return;}
   if(canvasMode==='moment')commitMomentState(q.e,storyContext(q.s,q.e),at,state,{scale:state.scale*last});
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
  w.addEventListener('pointermove',mv);w.addEventListener('pointerup',up);w.addEventListener('pointercancel',up);
 });
 rot.addEventListener('pointerdown',function(ev){
  var q=target();if(!q)return;ev.preventDefault();ev.stopPropagation();
  var r=q.n.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,a0=Math.atan2(ev.clientY-cy,ev.clientX-cx)*180/Math.PI;
  var at=atNow(storyContext(q.s,q.e)),state=currentMomentState(q.e,q.s,at),baseRot=+viewValue(q.e,'rot',0),delta=0,moved=false,restore=rememberStyles(q.n,['--nw-sd-rot','--rot']);
  function mv(e2){var a=Math.atan2(e2.clientY-cy,e2.clientX-cx)*180/Math.PI;delta=a-a0;moved=Math.abs(delta)>.2;
   if(canvasMode==='moment')q.n.style.setProperty('--nw-sd-rot',(state.rotate+delta).toFixed(2)+'deg');else q.n.style.setProperty('--rot',(baseRot+delta).toFixed(2)+'deg');draw();}
  function up(event){w.removeEventListener('pointermove',mv);w.removeEventListener('pointerup',up);w.removeEventListener('pointercancel',up);if(event.type==='pointercancel'||!moved){restore();return;}if(canvasMode==='moment')commitMomentState(q.e,storyContext(q.s,q.e),at,state,{rotate:state.rotate+delta});else basePatch(q,{rot:Math.round(baseRot+delta)});}
  w.addEventListener('pointermove',mv);w.addEventListener('pointerup',up);w.addEventListener('pointercancel',up);
 });
 w.addEventListener('pointermove',draw,true);w.addEventListener('scroll',draw,true);w.addEventListener('resize',draw);doc.addEventListener('nw-sd-progress',draw,true);
 w.addEventListener('message',function(ev){var d=ev.data||{};if(d.sc&&(d.type==='selectionset'||d.type==='nw-story-canvas-mode'))setTimeout(draw,0);});
 doc.__nwStoryCanvasTools={refresh:function(){doc.body.classList.toggle('nw-story-moment-mode',canvasMode==='moment');draw();},draw:draw};
 draw();
}
preview.addEventListener('load',function(){setTimeout(syncCanvasTools,120);});
setTimeout(syncCanvasTools,250);
window.NAGWEB_STORY_TIMELINE_UI={version:'1.1',markersVisible:false,directScrub:true,state:function(){return Object.assign({},timelineUI)},setState:function(state){Object.assign(timelineUI,state);saveTimelineUI();renderPane();},setZoom:function(z){timelineUI.zoom=Math.max(1,Math.min(6,+z||1));saveTimelineUI();renderPane();restoreTimelineViewport();},fit:function(){timelineUI.zoom=1;timelineUI.scrollLeft=0;saveTimelineUI();renderPane();restoreTimelineViewport();}};
window.NAGWEB_STORY_EDITOR={timeline:timeline,panel:panel,transport:transport,active:active,frames:frames,add:add,update:update,remove:remove,select:selectKey,beats:beats,beatAdd:beatAdd,beatUpdate:beatUpdate,beatRemove:beatRemove,hold:hold,stagger:stagger,staggerPanel:staggerPanel,preset:preset,presets:presets,context:storyContext,owner:motionOwner,canvasMode:function(){return canvasMode},setCanvasMode:setCanvasMode,canvasEdit:function(id,patch,at){var e=element(id),s=storySec(e);if(!e)return false;at=at==null?atNow(s):at;return commitMomentState(e,s,at,currentMomentState(e,s,at),patch);}};

// Motion Lab is a gallery of ordinary scenes, evaluated by the same Director.
function focusArtwork(i){
 var palettes=[['#c7b8ff','#191b25'],['#d5f58b','#18211b'],['#f1eee6','#23242a']],p=palettes[i],titles=['PULSO','FORMA','TRAZO'],motif='';
 if(i===0){
  motif='<circle cx="240" cy="348" r="132" fill="'+p[1]+'"/>';
  [108,84,60,36].forEach(function(r){motif+='<circle cx="240" cy="348" r="'+r+'" fill="none" stroke="'+p[0]+'" stroke-width="3"/>';});
  motif+='<path d="M108 348H372M240 216V480" stroke="'+p[0]+'" stroke-width="3"/><circle cx="240" cy="348" r="13" fill="'+p[0]+'"/>';
 }else if(i===1){
  motif='<path d="M99 463V354a141 141 0 0 1 282 0v109M167 463V354a73 73 0 0 1 146 0v109M235 463V354" fill="none" stroke="'+p[1]+'" stroke-width="36"/>';
 }else{
  for(var n=0;n<8;n++)motif+='<path d="M64 '+(235+n*29)+'C158 '+(175+n*29)+' 322 '+(415-n*29)+' 416 '+(355-n*12)+'" fill="none" stroke="'+(n%2?'#ff765b':p[1])+'" stroke-width="16"/>';
 }
 return '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="620" viewBox="0 0 480 620" role="img" aria-label="'+titles[i]+' · estudio de diseño"><rect width="480" height="620" fill="'+p[0]+'"/><g fill="'+p[1]+'" font-family="Arial,Helvetica,sans-serif"><text x="32" y="46" font-size="15" font-weight="700" letter-spacing="2">ESTUDIO / SERIES</text><text x="448" y="46" text-anchor="end" font-size="15">0'+(i+1)+'</text><path d="M32 65H448" stroke="'+p[1]+'"/><text x="26" y="145" font-size="94" font-weight="900" letter-spacing="-5">'+titles[i]+'</text><text x="32" y="174" font-size="13" letter-spacing="2">'+['IDENTIDAD &amp; SISTEMAS','FORMA &amp; PERSPECTIVA','DIRECCIÓN DE ARTE'][i]+'</text>'+motif+'<path d="M32 527H448" stroke="'+p[1]+'"/><text x="32" y="557" font-size="13" letter-spacing="1">EXPLORACIONES VISUALES / 2026</text><text x="32" y="592" font-size="22" font-weight="700">Diseño que deja huella.</text><path d="M421 577H444M434 567L444 577L434 587" fill="none" stroke="'+p[1]+'" stroke-width="2"/></g></svg>';
}
function focusComposition(){
 var assets=[],s=mkSection({name:'Iso Focus · Motion Lab',layout:'free',bg:'#10121b',fg:'#f5f3ed',height:100,sdEnabled:false,nwMotionSource:'time',nwMotionDuration:8,nwMotionLoop:true,sdLength:320,sdPerspective:1000,sdEase:'cinematic',sdMotionTemplate:'iso-focus'});
 ['Pulso','Forma','Trazo'].forEach(function(title,i){
  var a={id:nid(),name:'Motion Lab · '+title,data:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(focusArtwork(i))};assets.push(a);
  var edge=i===1?0:(i===0?-1:1),z=i===1?-160:-320;
  s.elements.push(mkEl('image',{name:'Lámina '+(i+1)+' · reemplazá la imagen',assetId:a.id,alt:title+' · estudio gráfico',x:50+edge*27,y:55,w:i===1?30:23,ratio:620/480,radius:6,anim:'none',mobile:{x:50+edge*29,y:52,w:i===1?36:23},sdKeyframesEnabled:true,sdKeyframes:M.normalize([{id:nid(),at:0,z:z,rotateX:32,rotateY:edge*28-12,ease:'cinematic'},{id:nid(),at:35,z:0,rotateX:0,rotateY:0,ease:'cinematic'},{id:nid(),at:65,ease:'cinematic'},{id:nid(),at:100,z:z,rotateX:32,rotateY:-edge*28+12,ease:'cinematic'}])}));
 });
 s.elements.push(mkEl('label',{name:'Etiqueta',text:'ESTUDIO / PORTFOLIO',customSize:11,weight:'600',letterSpacing:.14,x:50,y:10,w:90,textAlign:'center',color:'#d5f58b',anim:'none',sdEnter:'none',sdEnd:100}));
 s.elements.push(mkEl('heading',{name:'Título',text:'Ideas que toman forma.',customSize:34,weight:'700',letterSpacing:-.04,x:50,y:18,w:90,textAlign:'center',anim:'none',sdEnter:'none',sdEnd:100,mobile:{customSize:25}}));
 s.elements.push(mkEl('paragraph',{name:'Descripción',text:'Identidad · Dirección de arte · Diseño digital',customSize:13,color:'#a6a8b5',x:50,y:91,w:90,textAlign:'center',anim:'none',sdEnter:'none',sdEnd:100,mobile:{customSize:11}}));
 return{scene:s,assets:assets};
}
function orbitComposition(){
 var recipe=focusComposition(),s=recipe.scene;s.name='Órbita suave · Motion Lab';s.sdMotionTemplate='soft-orbit';s.nwMotionDuration=10;
 s.elements.slice(0,3).forEach(function(e,i){
  var frames=[];for(var j=0;j<=20;j++){
   var a=(j===20?0:j/20)*Math.PI*2+i*Math.PI*2/3,round=function(n){return Math.round(n*100)/100;};
   frames.push({id:nid(),at:j*5,ease:'linear',x:round(14*Math.cos(a)),y:round(18*Math.sin(a)),z:round(-65+70*Math.cos(a)),rotateX:round(5*Math.sin(a)),rotateY:round(18*Math.sin(a)),rotate:round(3*Math.cos(a))});
  }e.sdKeyframes=M.normalize(frames);
 });
 s.elements[3].text='ESTUDIO / ÓRBITA';s.elements[3].color='#c7b8ff';s.elements[4].text='Diseño en movimiento.';s.elements[5].text='Tres miradas. Un mismo universo.';
 return recipe;
}
var motionTemplates={
 'iso-focus':{name:'Iso Focus',description:'Enfoque e inclinación',create:focusComposition},
 'soft-orbit':{name:'Órbita suave',description:'Flotación y profundidad',create:orbitComposition}
};
var labStyle=document.createElement('style');labStyle.textContent='\n.nw-motion-dialog{width:min(1560px,96vw);height:92vh;max-width:none;max-height:94vh;padding:0;border:1px solid var(--line);border-radius:16px;background:var(--panel,#181820);color:var(--ink,#eee);overflow:hidden;box-sizing:border-box}\n.nw-motion-dialog::backdrop{background:#000b;backdrop-filter:blur(5px)}\n.nw-motion-head{height:62px;box-sizing:border-box;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid var(--line)}\n.nw-motion-head h2{margin:0;font-size:20px;line-height:1.2}.nw-motion-head small{display:block;color:var(--ink-soft);font-size:11px;margin-top:3px}\n.nw-motion-workspace{display:grid;grid-template-columns:190px minmax(0,1fr) 300px;height:calc(100% - 62px);min-height:0;margin:0;border:0;overflow:hidden}\n.nw-motion-library,.nw-motion-inspector{min-width:0;overflow:auto;padding:18px;box-sizing:border-box;background:var(--panel)}\n.nw-motion-library{border-right:1px solid var(--line)}.nw-motion-inspector{border-left:1px solid var(--line)}\n.nw-motion-library h3,.nw-motion-inspector h3{margin:0 0 12px;font-size:14px}.nw-motion-category{color:var(--ink-soft);font-size:10px;letter-spacing:.1em;text-transform:uppercase;margin:18px 0 10px}\n.nw-motion-template{width:100%;border:1px solid var(--accent);border-radius:10px;padding:8px;background:var(--panel-2);color:var(--ink);text-align:left;cursor:pointer}.nw-motion-template svg{display:block;width:100%;height:100px;background:#10121b;border-radius:6px}.nw-motion-template strong{display:block;font-size:12px;margin:9px 0 3px}.nw-motion-template small{font-size:10px;color:var(--ink-soft)}.nw-motion-template:disabled{cursor:default}.nw-motion-template+.nw-motion-template{margin-top:12px}\n.nw-motion-stage{min-width:0;min-height:0;display:flex;flex-direction:column;background-color:#171921;background-image:radial-gradient(#ffffff15 1px,transparent 1px);background-size:18px 18px}\n.nw-motion-stage-label{padding:12px 18px;display:flex;justify-content:space-between;gap:12px;color:#bfc1cd;font-size:11px;flex:none}\n.nw-motion-view{flex:1;min-height:0;padding:0 18px 18px;box-sizing:border-box;display:flex}\n.nw-motion-frame{width:100%;height:100%;min-height:0;display:block;border:1px solid #ffffff14;border-radius:12px;pointer-events:none;background:#10121b;box-shadow:0 14px 36px #0004}\n.nw-motion-controls{display:flex;align-items:center;gap:12px;margin:0;padding:14px 18px;background:var(--panel);border-top:1px solid var(--line);flex:none}.nw-motion-controls input{flex:1;min-width:40px}.nw-motion-controls output{font-variant-numeric:tabular-nums;min-width:36px;font-size:12px}\n.nw-motion-body{padding:0}.nw-motion-body .field{margin-bottom:14px}.nw-motion-body .csel{width:100%;box-sizing:border-box}.nw-motion-inspector .crow{display:flex;flex-direction:column;align-items:stretch;gap:6px}.nw-motion-inspector .crow>label{width:auto;font-size:11px;color:var(--ink-soft)}.nw-motion-inspector .ctl{min-width:0;width:100%}.nw-motion-description{line-height:1.5;color:var(--ink-soft);font-size:12px;margin:10px 0 18px}.nw-motion-actions{display:flex;flex-direction:column;gap:8px;margin-top:24px}.nw-motion-actions .btn{width:100%}.nw-motion-open{white-space:nowrap}.nw-motion-inspector [data-motion-save]{position:sticky;bottom:0;width:100%}\n@media(max-width:1100px){.nw-motion-workspace{grid-template-columns:150px minmax(0,1fr) 260px}.nw-motion-library,.nw-motion-inspector{padding:14px}}\n@media(max-width:760px){.nw-motion-dialog{height:94vh;width:96vw;border-radius:12px}.nw-motion-head{height:54px;padding:10px 14px}.nw-motion-workspace{height:calc(100% - 54px);grid-template-columns:minmax(0,1fr);grid-template-rows:76px minmax(220px,1fr) 220px}.nw-motion-library{display:flex;align-items:center;gap:14px;padding:8px 12px;border-right:0;border-bottom:1px solid var(--line);overflow:auto}.nw-motion-library h3{font-size:12px;margin:0}.nw-motion-library .nw-motion-category,.nw-motion-library>p{display:none}.nw-motion-template{width:auto;display:flex;align-items:center;gap:10px;flex:none;padding:6px 10px}.nw-motion-template svg{width:60px;height:48px}.nw-motion-template+.nw-motion-template{margin-top:0}.nw-motion-template strong{margin:0;font-size:11px}.nw-motion-template small{display:none}.nw-motion-inspector{border-left:0;border-top:1px solid var(--line)}.nw-motion-stage-label{padding:8px 12px}.nw-motion-view{padding:0 12px 12px}.nw-motion-controls{padding:10px 12px}.nw-motion-open{font-size:11px;padding:6px}.nw-motion-actions{margin-top:12px}}\n';document.head.appendChild(labStyle);
var labButton=document.createElement('button');labButton.type='button';labButton.className='btn nw-motion-open';labButton.dataset.motionOpen='';labButton.textContent='Motion Lab';labButton.title='Explorar composiciones animadas editables';document.querySelector('.tb-left').appendChild(labButton);
var labSide=labButton.cloneNode(true);labSide.style.cssText='width:100%;margin:8px 0 14px';labSide.textContent='Motion Lab · escenas animadas';document.getElementById('sec-add-box').before(labSide);
var lab=document.createElement('dialog');lab.className='nw-motion-dialog';lab.setAttribute('aria-labelledby','nw-motion-title');lab.innerHTML='<div class="nw-motion-head"><div><h2 id="nw-motion-title">Motion Lab</h2><small data-motion-mode>Explorar composiciones</small></div><button type="button" class="btn tiny" data-motion-close aria-label="Cerrar Motion Lab">Cerrar</button></div><div class="nw-motion-card nw-motion-workspace"><aside class="nw-motion-library" aria-label="Biblioteca de composiciones"><h3>Biblioteca</h3><div class="nw-motion-category">Profundidad · 2.5D</div><button type="button" class="nw-motion-template" data-motion-template="iso-focus" aria-pressed="true"><svg viewBox="0 0 160 100" aria-hidden="true"><rect x="14" y="31" width="36" height="46" rx="5" fill="#c9b3ff" transform="rotate(-14 32 54)"/><rect x="59" y="20" width="42" height="60" rx="5" fill="#b9f36b"/><rect x="112" y="31" width="36" height="46" rx="5" fill="#ffac83" transform="rotate(14 130 54)"/></svg><span><strong>Iso Focus</strong><small>Enfoque e inclinación</small></span></button><p class="nw-motion-description">Primera composición disponible. El banco se irá ampliando.</p></aside><section class="nw-motion-stage" aria-label="Vista previa de la composición"><div class="nw-motion-stage-label"><span>ISO FOCUS</span><span>Vista previa</span></div><div class="nw-motion-view"><iframe class="nw-motion-frame" title="Vista previa de Iso Focus" tabindex="-1" sandbox="allow-scripts allow-same-origin"></iframe></div><div class="nw-motion-controls"><button type="button" class="btn tiny" data-motion-play aria-pressed="false">▶ Reproducir</button><input type="range" data-motion-progress aria-label="Momento de la vista previa" min="0" max="100" value="50"><output data-motion-now>50%</output></div></section><aside class="nw-motion-inspector" aria-label="Controles de la composición"><div class="nw-motion-body" data-motion-gallery-details><h3>Iso Focus</h3><p class="nw-motion-description">Tres láminas se acercan desde un plano inclinado, permanecen de frente y vuelven a alejarse.</p><p class="hint">Imágenes, textos y momentos quedan editables después de insertar.</p><div class="nw-motion-actions"><button type="button" class="btn primary" data-motion-insert-group>Insertar en esta escena</button><button type="button" class="btn tiny" data-motion-insert>Como escena nueva</button></div><p class="nw-motion-description">Elegí dónde colocarla. Después seleccioná el grupo o una imagen y abrí Editar en Motion Lab.</p></div></aside></div>';document.body.appendChild(lab);
// The thumbnails use the artwork from the compositions.
var orbitButton=lab.querySelector('[data-motion-template]').cloneNode(true);orbitButton.dataset.motionTemplate='soft-orbit';orbitButton.querySelector('strong').textContent=motionTemplates['soft-orbit'].name;orbitButton.querySelector('small').textContent=motionTemplates['soft-orbit'].description;lab.querySelector('.nw-motion-library>p').before(orbitButton);lab.querySelector('.nw-motion-library>p').textContent='Elegí una composición y personalizala antes de insertar.';
lab.querySelectorAll('[data-motion-template]').forEach(function(b){var orbit=b.dataset.motionTemplate==='soft-orbit';b.querySelector('svg').innerHTML='<rect width="160" height="100" fill="#10121b"/>'+(orbit?'<ellipse cx="80" cy="52" rx="59" ry="24" fill="none" stroke="#c7b8ff" stroke-opacity=".5" stroke-dasharray="3 3"/>':'')+[0,1,2].map(function(i){var y=(orbit?[31,17,36]:[31,20,31])[i];return '<image href="data:image/svg+xml;charset=utf-8,'+encodeURIComponent(focusArtwork(i))+'" x="'+[16,59,113][i]+'" y="'+y+'" width="'+[34,42,34][i]+'" height="'+[44,60,44][i]+'" transform="rotate('+(orbit?[-18,5,16]:[-12,0,12])[i]+' '+[33,80,130][i]+' '+[53,50,53][i]+')"/>';}).join('');});
var labFrame=lab.querySelector('iframe'),labRange=lab.querySelector('[data-motion-progress]'),labPlay=lab.querySelector('[data-motion-play]'),labScene=null,labRAF=0,labStarted=0,labOffset=0,labDraft=null,labEditing=null,labEditTimer=0,labSource=null,labAssets=[],labDrafts={};
function labStop(){cancelAnimationFrame(labRAF);labRAF=0;labPlay.textContent='▶ Reproducir';labPlay.setAttribute('aria-pressed','false');}
function labSet(p){labRange.value=Math.round(p*100);lab.querySelector('[data-motion-now]').textContent=Math.round(p*100)+'%';try{var rt=labFrame.contentWindow.__NAG_SCROLL_DIRECTOR;if(rt&&labScene&&rt[labScene.id])rt[labScene.id].set(p);labPositionHandles();}catch(_){} }
function labTick(t){if(!lab.open){labStop();return;}var p=(t-labStarted)/((labDraft?labDraft.config.duration:8)*1000)+labOffset,loop=!labDraft||labDraft.config.loop!==false;labSet(loop?p%1:Math.min(1,p));if(!loop&&p>=1){labStop();return;}labRAF=requestAnimationFrame(labTick);}
function labTemplateState(key,editing){
 lab.querySelectorAll('[data-motion-template]').forEach(function(b){b.disabled=!!editing;b.setAttribute('aria-pressed',b.dataset.motionTemplate===key?'true':'false');b.style.borderColor=b.dataset.motionTemplate===key?'var(--accent)':'var(--line)';});
 var name=motionTemplates[key]?motionTemplates[key].name:'Composición';lab.querySelector('.nw-motion-stage-label span').textContent=name.toUpperCase();labFrame.title='Vista previa de '+name;
}
function labChoose(key){
 if(labEditing||!motionTemplates[key])return;if(labDraft&&labDraft.config.template===key)return;
 labStop();clearTimeout(labEditTimer);if(labDraft)labDrafts[labDraft.config.template]={draft:labDraft,source:labSource,assets:labAssets,selected:labSelected,moment:labRange.value};
 var cached=labDrafts[key];if(cached){labDraft=cached.draft;labSource=cached.source;labAssets=cached.assets;labSelected=cached.selected;labRange.value=cached.moment;}
 else{var recipe=motionTemplates[key].create();labSource=recipe.scene;labAssets=recipe.assets;labDraft={id:labSource.id,bg:labSource.bg,config:{template:key,source:'time',duration:labSource.nwMotionDuration,loop:true,perspective:labSource.sdPerspective},elements:recipe.scene.elements};labDraft.elements.forEach(function(e){e.parent=labDraft.id;});labSelected=null;labRange.value=50;}
 labTemplateState(key,false);labBuildForm();labPreviewDraft();
}
function labOpen(){
 if(lab.open)return;labDraft=null;labEditing=null;labDrafts={};
 lab.querySelector('[data-motion-insert]').hidden=false;lab.querySelector('[data-motion-insert-group]').hidden=false;lab.querySelector('[data-motion-gallery-details]').hidden=true;lab.querySelector('[data-motion-mode]').textContent='Personalizar antes de insertar';
 labActions.hidden=false;lab.showModal();labChoose('iso-focus');
}
lab.querySelector('.nw-motion-library').addEventListener('click',function(ev){var b=ev.target.closest('[data-motion-template]');if(b&&!b.disabled)labChoose(b.dataset.motionTemplate);});
function labRecipe(){
 var recipe=lab.open&&labDraft&&!labEditing?{scene:JSON.parse(JSON.stringify(labSource)),assets:JSON.parse(JSON.stringify(labAssets)),config:JSON.parse(JSON.stringify(labDraft.config))}:focusComposition();
 if(recipe.config){var c=recipe.config,s=recipe.scene;s.bg=labDraft.bg;s.elements=JSON.parse(JSON.stringify(labDraft.elements));s.elements.forEach(function(e){if(e.parent===labDraft.id)e.parent='';});s.nwMotionSource=c.source;s.nwMotionDuration=c.duration;s.nwMotionLoop=c.loop;s.sdPerspective=c.perspective;s.sdEnabled=c.source==='scroll';}
 else recipe.config={template:'iso-focus',source:'time',duration:8,loop:true,perspective:1000};
 return recipe;
}
labFrame.addEventListener('load',function(){if(lab.open){labSet(+labRange.value/100);labBindCanvas();}});
document.addEventListener('click',function(ev){if(ev.target.closest('[data-motion-open]'))labOpen();});
lab.querySelector('[data-motion-close]').addEventListener('click',function(){lab.close();});
lab.addEventListener('close',function(){if(lab.open)return;labStop();clearTimeout(labEditTimer);labFrame.srcdoc='';labFrame.style.pointerEvents='none';labFrame.tabIndex=-1;labSelected=null;labScene=null;labDraft=null;labEditing=null;labSource=null;labAssets=[];labDrafts={};labForm.hidden=true;labActions.hidden=false;lab.querySelector('[data-motion-gallery-details]').hidden=false;labTemplateState('iso-focus',false);lab.querySelector('[data-motion-mode]').textContent='Explorar composiciones';lab.querySelector('[data-motion-insert]').hidden=false;lab.querySelector('[data-motion-insert-group]').hidden=false;});
labRange.addEventListener('input',function(){labStop();labSet(+labRange.value/100);});
labPlay.addEventListener('click',function(){if(labRAF){labStop();return;}if(matchMedia('(prefers-reduced-motion: reduce)').matches){toast('Movimiento reducido activo. Podés recorrer la vista previa con el control de momento.');return;}labStarted=performance.now();labOffset=+labRange.value/100;labPlay.textContent='Ⅱ Pausar';labPlay.setAttribute('aria-pressed','true');labRAF=requestAnimationFrame(labTick);});
function labInsert(){
 var recipe=labRecipe(),s=recipe.scene;snapshot();project.assets.images=project.assets.images||[];Array.prototype.push.apply(project.assets.images,recipe.assets);
 page().sections.splice(curSec+1,0,s);curSec++;curEl=1;curPane='elements';selection=[s.elements[1].id];secFocus=false;
 canvasMode='moment';saveCanvasMode();timelineUI.docked=true;timelineUI.minimized=false;saveTimelineUI();closedGroups.delete('el-scroll-director');
 selected={element:s.elements[1].id,key:(s.elements[1].sdKeyframes.find(function(k){return k.at===35;})||s.elements[1].sdKeyframes[1]).id};lab.close();refresh();D.scrub(s.id,.35);syncSelectionToFrame();
 if(typeof pendingAfterLoad!=='undefined')pendingAfterLoad.push({type:'scrollto',id:s.id});
 toast('Escena insertada. Seleccioná una lámina para cambiar su imagen; los puntos de la línea de tiempo editan sus movimientos.');return s.id;
}
lab.querySelector('[data-motion-insert]').addEventListener('click',labInsert);
function labInsertGroup(){
 var recipe=labRecipe(),s=sec();if(s.layout==='horizontal'){toast('Elegí una escena de lienzo libre o de contenido para insertar la composición.');return false;}
 var group=mkEl('container',{name:(motionTemplates[recipe.config.template]||motionTemplates['iso-focus']).name+' · composición',x:50,y:50,w:86,h:600,bg:recipe.scene.bg,radius:20,anim:'none',nwMotionInstance:recipe.config});
 recipe.scene.elements.forEach(function(e){e.parent=group.id;});snapshot();project.assets.images=project.assets.images||[];Array.prototype.push.apply(project.assets.images,recipe.assets);
 s.elements.push(group);Array.prototype.push.apply(s.elements,recipe.scene.elements);if(group.nwMotionInstance.source==='scroll')s.sdEnabled=true;curEl=s.elements.indexOf(recipe.scene.elements[1]);selection=[s.elements[curEl].id];secFocus=false;curPane='elements';
 canvasMode='moment';saveCanvasMode();timelineUI.docked=true;timelineUI.minimized=false;saveTimelineUI();closedGroups.delete('el-scroll-director');closedGroups.delete('el-motion-instance');
 selected={element:s.elements[curEl].id,key:(s.elements[curEl].sdKeyframes.find(function(k){return k.at===35;})||s.elements[curEl].sdKeyframes[1]).id};lab.close();refresh();D.scrub(group.id,.35);syncSelectionToFrame();
 toast('Composición agregada. Editar en Motion Lab reabre este mismo grupo.');return group.id;
}
lab.querySelector('[data-motion-insert-group]').addEventListener('click',labInsertGroup);
var labForm=document.createElement('section');labForm.hidden=true;labForm.className='nw-motion-body';labForm.dataset.motionEditForm='';lab.querySelector('.nw-motion-inspector').appendChild(labForm);
var labActions=lab.querySelector('.nw-motion-actions');lab.querySelector('.nw-motion-inspector').appendChild(labActions);labActions.style.cssText='position:sticky;bottom:0;background:var(--panel);padding-top:12px';
var labSelected=null;
function labSelectedElement(){return labDraft&&labDraft.elements.find(function(e){return e.id===labSelected;});}
function labPositionHandles(){
 var doc=labFrame.contentDocument,b=doc&&doc.querySelector('[data-motion-resize]'),rot=doc&&doc.querySelector('[data-motion-rotate]'),e=labSelectedElement(),n=e&&doc.querySelector('[data-id="'+e.id+'"]');if(!b)return;
 b.hidden=!n;if(rot)rot.hidden=!n;if(!n)return;var r=n.getBoundingClientRect(),w=doc.documentElement.clientWidth,h=doc.documentElement.clientHeight;b.style.left=Math.max(12,Math.min(w-12,r.right+6))+'px';b.style.top=Math.max(12,Math.min(h-12,r.top+r.height/2))+'px';
 if(rot){rot.style.left=Math.max(12,Math.min(w-12,r.left+r.width/2))+'px';rot.style.top=Math.max(12,Math.min(h-12,r.top-20))+'px';}
}
function labSelectElement(id){
 labSelected=id;var e=labSelectedElement(),doc=labFrame.contentDocument;
 if(doc)doc.querySelectorAll('[data-motion-canvas]').forEach(function(n){n.classList.toggle('nw-motion-selected',n.dataset.id===id);});
 var name=labForm.querySelector('[data-motion-selection]');if(name)name.textContent=e?(e.name||e.type):'Seleccioná un elemento en el centro';
 labForm.querySelectorAll('[data-motion-position]').forEach(function(n){n.disabled=!e;n.value=e?e[n.dataset.motionPosition]:'';});
 var width=labForm.querySelector('[data-motion-width]');if(width){width.disabled=!e;width.value=e?e.w:'';}
 var angle=labForm.querySelector('[data-motion-angle]');if(angle){angle.disabled=!e;angle.value=e?(+e.rot||0):'';}
 labForm.querySelectorAll('[data-motion-content]').forEach(function(n){n.closest('.crow').style.outline=e&&labDraft.elements[+n.dataset.motionContent]===e?'1px solid var(--accent)':'';});
 labPositionHandles();
}
function labResizeElement(e,width){
 e.w=Math.round(Math.max(1,Math.min(100,width))*100)/100;var doc=labFrame.contentDocument,n=doc&&doc.querySelector('[data-id="'+e.id+'"]');if(n)n.style.setProperty('width',e.w+'%','important');labSelectElement(e.id);
}
function labRotateElement(e,angle){
 e.rot=Math.round((((angle+180)%360+360)%360-180)*100)/100;var doc=labFrame.contentDocument,n=doc&&doc.querySelector('[data-id="'+e.id+'"]');if(n)n.style.setProperty('--rot',e.rot+'deg','important');labSelectElement(e.id);
}
function labPlaceElement(e,x,y){
 e.x=Math.round(Math.max(0,Math.min(100,x))*100)/100;e.y=Math.round(Math.max(0,Math.min(100,y))*100)/100;
 var doc=labFrame.contentDocument,n=doc&&doc.querySelector('[data-id="'+e.id+'"]');
 if(n){n.style.setProperty('left',e.x+'%','important');n.style.setProperty('top',e.y+'%','important');}
 labSelectElement(e.id);
}
function labBindCanvas(){
 labFrame.style.pointerEvents=labDraft?'auto':'none';labFrame.tabIndex=labDraft?0:-1;if(!labDraft)return;
 var doc=labFrame.contentDocument,drag=null,style=doc.createElement('style');
 style.textContent='[data-motion-canvas]{cursor:grab;touch-action:none;user-select:none}[data-motion-canvas] *{user-select:none;-webkit-user-drag:none}.nw-motion-selected{outline:2px solid #b9f36b!important;outline-offset:4px}[data-motion-canvas]:focus-visible{outline:2px solid #b9f36b}[data-motion-resize],[data-motion-rotate]{all:initial;position:fixed;z-index:2147483647;width:22px;height:22px;box-sizing:border-box;transform:translate(-50%,-50%);border:2px solid #10121b;border-radius:5px;background:#b9f36b;color:#10121b;font:16px sans-serif;text-align:center;cursor:ew-resize;touch-action:none;user-select:none}[data-motion-resize][hidden],[data-motion-rotate][hidden]{display:none!important}[data-motion-resize]:focus-visible,[data-motion-rotate]:focus-visible{outline:2px solid white;outline-offset:2px}[data-motion-rotate]{border-radius:50%;background:#c9b3ff;cursor:grab}';doc.head.appendChild(style);
 var resize=doc.createElement('button');resize.type='button';resize.dataset.motionResize='';resize.hidden=true;resize.textContent='↔';resize.title='Arrastrá para cambiar el ancho';resize.setAttribute('aria-label','Cambiar ancho del elemento seleccionado');doc.body.appendChild(resize);labFrame.contentWindow.addEventListener('resize',labPositionHandles);
 var rotate=resize.cloneNode();rotate.removeAttribute('data-motion-resize');rotate.dataset.motionRotate='';rotate.textContent='↻';rotate.title='Arrastrá para girar · Mayús ajusta cada 15°';rotate.setAttribute('aria-label','Girar el elemento seleccionado');doc.body.appendChild(rotate);
 labDraft.elements.forEach(function(e){if(e.parent!==labDraft.id)return;var n=doc.querySelector('[data-id="'+e.id+'"]');if(!n)return;n.dataset.motionCanvas='';n.tabIndex=0;n.setAttribute('aria-label','Seleccionar '+(e.name||e.type));});
 doc.addEventListener('click',function(ev){ev.preventDefault();ev.stopImmediatePropagation();},true);
 doc.addEventListener('dragstart',function(ev){ev.preventDefault();});
 doc.addEventListener('pointerdown',function(ev){
  if(ev.button!==0||!ev.isPrimary)return;var sizing=ev.target.closest('[data-motion-resize]'),turning=ev.target.closest('[data-motion-rotate]'),n=(sizing||turning)?doc.querySelector('[data-id="'+labSelected+'"]'):ev.target.closest('[data-motion-canvas]');if(!n){labSelectElement(null);return;}
  var e=labDraft.elements.find(function(e){return e.id===n.dataset.id;}),parent=n.offsetParent;if(!e||!parent)return;
  ev.preventDefault();labStop();labSelectElement(e.id);var capture=sizing||turning||n,r=n.getBoundingClientRect();capture.focus({preventScroll:true});
  drag={node:capture,element:e,pointer:ev.pointerId,x:ev.clientX,y:ev.clientY,baseX:e.x,baseY:e.y,baseW:e.w,baseRot:+e.rot||0,sizing:!!sizing,turning:!!turning,cx:r.left+r.width/2,cy:r.top+r.height/2,delta:0,screenWidth:r.width,width:parent.clientWidth,height:parent.clientHeight};drag.angle=Math.atan2(ev.clientY-drag.cy,ev.clientX-drag.cx);capture.setPointerCapture(ev.pointerId);
 });
 doc.addEventListener('pointermove',function(ev){if(!drag||ev.pointerId!==drag.pointer)return;ev.preventDefault();if(drag.turning){var angle=Math.atan2(ev.clientY-drag.cy,ev.clientX-drag.cx),delta=angle-drag.angle;drag.delta+=Math.atan2(Math.sin(delta),Math.cos(delta))*180/Math.PI;drag.angle=angle;var rot=drag.baseRot+drag.delta;labRotateElement(drag.element,ev.shiftKey?Math.round(rot/15)*15:rot);}else if(drag.sizing){labResizeElement(drag.element,drag.baseW*(1+2*(ev.clientX-drag.x)/Math.max(1,drag.screenWidth)));}else labPlaceElement(drag.element,drag.baseX+(ev.clientX-drag.x)/drag.width*100,drag.baseY+(ev.clientY-drag.y)/drag.height*100);});
 function finish(ev,cancel){if(!drag||ev.pointerId!==drag.pointer)return;var d=drag;drag=null;if(cancel){if(d.turning)labRotateElement(d.element,d.baseRot);else if(d.sizing)labResizeElement(d.element,d.baseW);else labPlaceElement(d.element,d.baseX,d.baseY);}if(d.node.hasPointerCapture(d.pointer))d.node.releasePointerCapture(d.pointer);}
 doc.addEventListener('pointerup',function(ev){finish(ev,false);});doc.addEventListener('pointercancel',function(ev){finish(ev,true);});doc.addEventListener('lostpointercapture',function(ev){finish(ev,true);});
 doc.addEventListener('keydown',function(ev){
  if(ev.target.closest('[data-motion-rotate]')&&(ev.key==='ArrowLeft'||ev.key==='ArrowRight')){var e=labSelectedElement();if(e){ev.preventDefault();labStop();labRotateElement(e,(+e.rot||0)+(ev.key==='ArrowLeft'?-1:1)*(ev.shiftKey?15:1));}return;}
  if(ev.target.closest('[data-motion-resize]')&&(ev.key==='ArrowLeft'||ev.key==='ArrowRight')){var e=labSelectedElement();if(e){ev.preventDefault();labStop();labResizeElement(e,e.w+(ev.key==='ArrowLeft'?-1:1)*(ev.shiftKey?5:1));}return;}
  var n=ev.target.closest('[data-motion-canvas]');if(n&&(ev.key==='Enter'||ev.key===' ')){ev.preventDefault();labStop();labSelectElement(n.dataset.id);return;}
  var e=labSelectedElement(),dx=ev.key==='ArrowLeft'?-1:ev.key==='ArrowRight'?1:0,dy=ev.key==='ArrowUp'?-1:ev.key==='ArrowDown'?1:0;
  if(!e||(!dx&&!dy))return;n=doc.querySelector('[data-id="'+e.id+'"]');var p=n&&n.offsetParent;if(!p)return;ev.preventDefault();labStop();var step=ev.shiftKey?10:1;labPlaceElement(e,e.x+dx*step/p.clientWidth*100,e.y+dy*step/p.clientHeight*100);
 });
 labSelectElement(labSelected);
}
function labPreviewDraft(){
 if(!labDraft)return;var s=labEditing?page().sections.find(function(s){return s.id===labEditing.scene;}):labSource;if(!s)return;
 labScene=Object.assign({},s,{id:labDraft.id,bg:labDraft.bg,layout:'free',height:100,sdEnabled:false,nwMotionSource:'time',nwMotionDuration:labDraft.config.duration,nwMotionLoop:labDraft.config.loop,sdPerspective:labDraft.config.perspective,elements:labDraft.elements.map(function(e){var n=Object.assign({},e);if(n.parent===labDraft.id)n.parent='';n.mobile=Object.assign({},e.mobile,{x:e.x,y:e.y,w:e.w,rot:+e.rot||0});return n;})});
 labFrame.srcdoc=generateSite(Object.assign({},flattenPage(page()),{sections:[labScene],assets:Object.assign({},project.assets,{images:(project.assets.images||[]).concat(labAssets)})}),false,false,false);
}
function labBuildForm(){
 labForm.hidden=false;
 var c=labDraft.config;labForm.innerHTML='<h3>'+(labEditing?'Editar esta composición':'Personalizar '+esc((motionTemplates[labDraft.config.template]||motionTemplates['iso-focus']).name))+'</h3><p class="hint">'+(labEditing?'Los cambios se aplican al guardar.':'Los cambios se aplican al insertar.')+' Cerrar descarta esta edición.</p><p class="hint">Arrastrá un elemento en el centro para moverlo; el tirador lateral cambia su ancho y el superior lo gira. Las imágenes conservan su proporción y los momentos se mantienen.</p><p data-motion-selection>Seleccioná un elemento en el centro</p>'+cRow('Posición X (%)','<input class="csel" type="number" min="0" max="100" step="0.1" data-motion-position="x" disabled>')+cRow('Posición Y (%)','<input class="csel" type="number" min="0" max="100" step="0.1" data-motion-position="y" disabled>')+cRow('Ancho (%)','<input class="csel" type="number" min="1" max="100" step="0.1" data-motion-width disabled>')+cRow('Ángulo (°)','<input class="csel" type="number" min="-180" max="180" step="1" data-motion-angle disabled>')+cRow('Animar por','<select class="csel" data-motion-config="source"><option value="time"'+(c.source!=='scroll'?' selected':'')+'>Tiempo</option><option value="scroll"'+(c.source==='scroll'?' selected':'')+'>Scroll de esta escena</option></select>')+cRow('Duración (segundos)','<input class="csel" type="number" min="0.5" max="120" step="0.5" data-motion-config="duration" value="'+c.duration+'">')+cRow('Repetir','<input type="checkbox" data-motion-config="loop"'+(c.loop!==false?' checked':'')+'>')+cRow('Perspectiva (px)','<input class="csel" type="number" min="200" max="5000" step="50" data-motion-config="perspective" value="'+c.perspective+'">')+labDraft.elements.map(function(e,i){return cRow(esc(e.name||e.type),e.type==='image'?'<select class="csel" data-motion-content="'+i+'" data-motion-content-field="assetId">'+(project.assets.images||[]).concat(labAssets).map(function(a){return '<option value="'+esc(a.id)+'"'+(a.id===e.assetId?' selected':'')+'>'+esc(a.name)+'</option>';}).join('')+'</select>':'<input class="csel" data-motion-content="'+i+'" data-motion-content-field="text" value="'+esc(e.text||'')+'">');}).join('')+(labEditing?'<button type="button" class="btn primary" data-motion-save>Guardar cambios en este grupo</button>':'')+'<p class="hint">Scroll activa el Director de esta escena. Los momentos individuales se editan en la línea de tiempo del lienzo.</p>';
}
function labEdit(id){
 if(lab.open)return;var f=findEl(id),s=f&&page().sections[f[0]],g=s&&s.elements[f[1]];if(!g||!g.nwMotionInstance)return false;
 labSource=null;labAssets=[];labEditing={scene:s.id,group:g.id};labDraft={id:g.id,bg:g.bg,config:JSON.parse(JSON.stringify(g.nwMotionInstance)),elements:JSON.parse(JSON.stringify(s.elements.filter(function(e){return e!==g&&motionOwner(s,e)===g;})))};labSelected=null;labRange.value=50;
 lab.querySelector('[data-motion-insert]').hidden=true;lab.querySelector('[data-motion-insert-group]').hidden=true;labForm.hidden=false;lab.querySelector('[data-motion-gallery-details]').hidden=true;labTemplateState(g.nwMotionInstance.template,true);lab.querySelector('[data-motion-mode]').textContent='Editando esta composición';labActions.hidden=true;
 labBuildForm();
 lab.showModal();labPreviewDraft();return true;
}
labForm.addEventListener('change',function(ev){if(!labDraft)return;var t=ev.target,k=t.dataset.motionConfig;if(t.hasAttribute('data-motion-angle')){var e=labSelectedElement();if(e&&isFinite(t.valueAsNumber)){labStop();labRotateElement(e,t.valueAsNumber);}return;}if(t.hasAttribute('data-motion-width')){var e=labSelectedElement();if(e&&isFinite(t.valueAsNumber)){labStop();labResizeElement(e,t.valueAsNumber);}return;}if(t.dataset.motionPosition){var e=labSelectedElement();if(e&&isFinite(t.valueAsNumber)){labStop();labPlaceElement(e,t.dataset.motionPosition==='x'?t.valueAsNumber:e.x,t.dataset.motionPosition==='y'?t.valueAsNumber:e.y);}return;}if(k){labDraft.config[k]=k==='loop'?t.checked:k==='source'?t.value:Math.max(k==='duration'?.5:200,Math.min(k==='duration'?120:5000,+t.value||(k==='duration'?8:1000)));}else if(t.dataset.motionContent!=null){var e=labDraft.elements[+t.dataset.motionContent];if(e)e[t.dataset.motionContentField]=t.value;}else return;labStop();clearTimeout(labEditTimer);labEditTimer=setTimeout(labPreviewDraft,100);});
labForm.addEventListener('click',function(ev){if(!ev.target.closest('[data-motion-save]')||!labDraft||!labEditing)return;var s=page().sections.find(function(s){return s.id===labEditing.scene;}),g=s&&s.elements.find(function(e){return e.id===labEditing.group;});if(!g){lab.close();return;}snapshot();g.nwMotionInstance=labDraft.config;var edits={};labDraft.elements.forEach(function(e){edits[e.id]=e;});s.elements=s.elements.map(function(e){return edits[e.id]||e;});if(g.nwMotionInstance.source==='scroll')s.sdEnabled=true;var id=g.id;lab.close();refresh();D.scrub(id,.35);toast('Cambios guardados en la misma composición.');});
document.addEventListener('click',function(ev){var b=ev.target.closest('[data-motion-edit]');if(b)labEdit(b.dataset.motionEdit);});
window.NAGWEB_MOTION_LAB={open:labOpen,insert:labInsert,insertGroup:labInsertGroup,edit:labEdit,create:focusComposition};
})();
