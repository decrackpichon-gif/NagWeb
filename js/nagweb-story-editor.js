/* Timeline v2. No runtime propio: toda edición usa el modelo del Director. */
(function(){
'use strict';
var M=window.NAGWEB_STORY_MODEL,D=window.NAGWEB_SCROLL_DIRECTOR,pane=document.getElementById('pane');
if(!M||!D||!pane)return;
var selected=null,selectedBeat=null;
function frames(e){return M.normalize(e.sdKeyframes).map(function(k,i){if(!k.id)k.id='key-'+i;return k;});}
function active(e){return e.sdKeyframesEnabled!==false&&frames(e).length>0;}
function element(id){return (sec().elements||[]).find(function(e){return e.id===id;});}
function current(){return selection.length===1?element(selection[0]):null;}
function picked(e){return selected&&selected.element===e.id?frames(e).find(function(k){return k.id===selected.key;}):null;}
function persist(){var top=pane.scrollTop;saveProject();renderPane();pane.scrollTop=top;schedulePreview();}
function selectElement(id,add){
 var f=findEl(id);if(!f)return;
 curSec=f[0];curEl=f[1];secFocus=false;curPane='elements';
 selection=add?(selection.indexOf(id)>=0?selection.filter(function(x){return x!==id;}):selection.concat(id)):[id];
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
function snap(at,list,index,skip){
 if(skip||sec().sdSnapBeats===false)return at;
 var b=bounds(list,index),near=beats(sec()).filter(function(k){return k.at>=b[0]&&k.at<=b[1]&&Math.abs(k.at-at)<=2;}).sort(function(a,b){return Math.abs(a.at-at)-Math.abs(b.at-at);})[0];
 return near?near.at:at;
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
 var list=(s.elements||[]).filter(function(e){return M.eligible(e,s);});
 
 return '<div class="nw-sd-timeline" data-sd-timeline="'+s.id+'" style="--sd-play:'+val+'%"><div class="nw-sd-timeline-head"><span>LÍNEA DE TIEMPO</span><span>0 · 25 · 50 · 75 · 100%</span></div>'+beatsPanel(s)+'<div class="nw-sd-timeline-grid">'+list.map(function(e){
  var ks=frames(e),use=active(e),a=use?ks[0].at:M.clamp(M.number(e.sdStart,0),0,100),b=use?ks[ks.length-1].at:M.clamp(M.number(e.sdEnd,82),a,100);
  var name=esc(e.name||e.label||e.text||e.type),isSelected=selection.indexOf(e.id)>=0;
  return '<div class="nw-sd-trow'+(isSelected?' is-selected':'')+'" data-sd-row="'+e.id+'"><button type="button" class="nw-sd-tname" data-story-select="'+e.id+'" title="'+name+'">'+name+'</button><div class="nw-sd-ttrack" data-story-track="'+e.id+'"><i class="nw-sd-playhead"></i>'+beats(s).map(function(b){return '<i class="nw-sd-beat-line" data-story-beat-line="'+b.id+'" style="left:'+b.at+'%" title="'+esc(b.name)+'"></i>';}).join('')+'<i class="nw-sd-tbar" '+(use?'':'data-sd-bar="1"')+' style="left:'+a+'%;width:'+Math.max(.1,b-a)+'%">'+(use?'':'<button type="button" class="nw-sd-thandle start" data-sd-edge="start" aria-label="Mover inicio"></button><button type="button" class="nw-sd-thandle end" data-sd-edge="end" aria-label="Mover fin"></button>')+'</i>'+ (use?ks.map(function(k,i){
   var prev=ks[i-1],hold=prev&&Object.keys(M.properties).every(function(p){return prev[p]===k[p];});
   return (hold?'<i class="nw-sd-hold" title="Permanencia" style="left:'+prev.at+'%;width:'+(k.at-prev.at)+'%"></i>':'')+'<button type="button" class="nw-sd-key'+(selected&&selected.element===e.id&&selected.key===k.id?' is-selected':'')+'" data-sd-key="'+k.id+'" style="left:'+k.at+'%" aria-label="Momento '+k.at+'% de '+name+'" aria-pressed="'+!!(selected&&selected.element===e.id&&selected.key===k.id)+'" title="'+k.at+'% · '+M.easings[k.ease]+'"></button>';
  }).join(''):'')+'</div></div>';
 }).join('')+'</div><p class="hint gh">Doble clic en una pista: agregar momento. Arrastrá los puntos para moverlos. Shift + clic en el nombre: selección múltiple.</p></div>';
}
function panel(s,e){
 var ks=frames(e),k=picked(e),body='';
 if(!active(e))return '<div class="nw-sd-actions"><button type="button" class="btn tiny" data-story-action="enable">'+(ks.length?'Reactivar keyframes':'Crear keyframes del recorrido')+'</button></div><p class="hint gh">Los valores del recorrido anterior se conservan. Después podés editar cada momento.</p>';
 body+=transport(s)+timeline(s,D.progress(s.id));
 body+='<div class="nw-sd-actions"><button type="button" class="btn tiny" data-story-action="add">+ Momento aquí</button><button type="button" class="btn tiny" data-story-action="disable">Usar recorrido anterior</button></div>';
 if(!k)return body+'<p class="hint gh">Seleccioná un punto para editarlo. Dos puntos con el mismo estado crean una permanencia.</p>';
 var i=ks.findIndex(function(x){return x.id===k.id;}),b=bounds(ks,i);
 body+='<div class="nw-sd-inspector" data-story-inspector="'+k.id+'"><h4 class="gsub">Momento seleccionado</h4>'+cRow('Momento en la escena',num('data-story-field','at',k.at,'Momento en la escena',b[0],b[1],'%'));
 body+='<h4 class="gsub">Transformación</h4>';
 Object.keys(M.properties).forEach(function(p){var def=M.properties[p];if(p==='opacity')body+='<h4 class="gsub">Apariencia</h4>';body+=cRow(def.label,num('data-story-field',p,k[p],def.label,def.min,def.max,def.unit));});
 body+='<h4 class="gsub">Interpolación</h4>'+cRow('Hacia el siguiente momento','<select class="csel" aria-label="Interpolación" data-story-field="ease">'+Object.keys(M.easings).map(function(key){return '<option value="'+key+'"'+(k.ease===key?' selected':'')+'>'+M.easings[key]+'</option>';}).join('')+'</select>');
 body+='<p class="hint gh">'+(i===ks.length-1?'Último momento: este estado se mantiene hasta el final.':'Este cambio de velocidad se aplica al tramo siguiente.')+' Los valores se suman al diseño del elemento; 100% conserva su escala y opacidad base.</p>';
 body+='<div class="nw-sd-actions"><button type="button" class="btn tiny danger" data-story-action="delete">Eliminar momento</button></div></div>';
 return body;
}
pane.addEventListener('change',function(ev){
 var beatField=ev.target.closest('[data-story-beat-field]');if(beatField&&selectedBeat){var patch={};patch[beatField.dataset.storyBeatField]=beatField.value;beatUpdate(selectedBeat.id,patch);return;}
 if(ev.target.matches('[data-story-snap]')){snapshot();sec().sdSnapBeats=ev.target.checked;saveProject();return;}
 var t=ev.target.closest('[data-story-field]'),e=current(),k=e&&picked(e);if(!t||!k)return;
 var patch={};patch[t.dataset.storyField]=t.value;update(e.id,k.id,patch);
});
pane.addEventListener('click',function(ev){
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
});
pane.addEventListener('dblclick',function(ev){var track=ev.target.closest('[data-story-track]');if(!track||ev.target.closest('[data-sd-key]'))return;ev.preventDefault();var r=track.getBoundingClientRect();add(track.dataset.storyTrack,(ev.clientX-r.left)/r.width*100);});
pane.addEventListener('pointerdown',function(ev){
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
var style=document.createElement('style');style.textContent='.nw-sd-ttrack{height:24px;overflow:visible;border-radius:5px;touch-action:none}.nw-sd-tbar{top:9px;bottom:9px;opacity:.65}.nw-sd-key{position:absolute;z-index:6;top:6px;width:12px;height:12px;transform:translateX(-50%) rotate(45deg);padding:0;border:2px solid var(--panel);border-radius:2px;background:var(--accent);cursor:ew-resize;touch-action:none}.nw-sd-key.is-selected,.nw-sd-key:focus-visible{background:var(--ink);outline:2px solid var(--accent);outline-offset:2px}.nw-sd-actions{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.nw-sd-inspector{margin-top:12px;padding-top:6px;border-top:1px solid var(--line)}.nw-sd-hold{position:absolute;top:17px;height:3px;background:var(--ink);opacity:.5;pointer-events:none}.nw-sd-timeline-grid:before{display:none}.nw-sd-ttrack{background:repeating-linear-gradient(90deg,transparent 0,transparent calc(25% - 1px),var(--line) calc(25% - 1px),var(--line) 25%),var(--panel)}.nw-sd-timeline-grid{gap:7px}.nw-sd-tname{min-height:24px}.nw-sd-playhead{z-index:5}.nw-sd-inspector input{min-width:0}';document.head.append(style);
style.textContent+='.nw-sd-beats{height:36px;margin-top:10px}.nw-sd-beat{position:absolute;top:20px;transform:translateX(-50%);padding:0;border:0;color:var(--accent);background:transparent;cursor:ew-resize;touch-action:none}.nw-sd-beat span{position:absolute;bottom:16px;left:0;max-width:64px;overflow:hidden;text-overflow:ellipsis;font:600 9px system-ui;white-space:nowrap}.nw-sd-beat.is-selected{color:var(--ink);outline:1px solid var(--accent)}.nw-sd-beat-line{position:absolute;top:-4px;bottom:-4px;width:1px;border-left:1px dashed var(--accent);opacity:.6;pointer-events:none}.nw-sd-beat-inspector{margin-bottom:10px;padding:6px;border:1px solid var(--line);border-radius:6px}';
window.NAGWEB_STORY_EDITOR={timeline:timeline,panel:panel,transport:transport,active:active,frames:frames,add:add,update:update,remove:remove,select:selectKey,beats:beats,beatAdd:beatAdd,beatUpdate:beatUpdate,beatRemove:beatRemove};
})();
