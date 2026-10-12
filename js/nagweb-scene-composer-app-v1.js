(function(){'use strict';
var q=id=>document.getElementById(id),E=NAGWEB_INTERACTION_ENGINE,A=NAGWEB_INTERACTION_ASSET_PREP,I=NAGWEB_INTERACTION_INFLUENCE,V3=NAGWEB_ORGANIC_MESH,V4=NAGWEB_ORGANIC_ADAPTIVE_CURVE,S=NAGWEB_SCENE_COMPOSER,V=NAGWEB_SCENE_COMPOSER_VIEW;
var stage=q('stage'),canvas=q('characterCanvas'),leader=q('leader'),work=q('work'),stageSpace=q('stageSpace'),interactionSpace=q('interactionSpace'),field=null,renderer=null,src=new Image(),srcUrl=null;
var zoom=1,spaceDown=false,pan=null;
function clamp(v,a,b){return Math.min(b,Math.max(a,v));}
function measureView(){
  const w=+stage.dataset.nwWidth||1200,h=+stage.dataset.nwHeight||800;
  stageSpace.style.width=(w*zoom)+'px';stageSpace.style.height=(h*zoom)+'px';
  stage.style.transformOrigin='top left';stage.style.transform='scale('+zoom+')';
  interactionSpace.style.transform='scale('+(1/zoom)+')';
  q('zoomValue').value=Math.round(zoom*100)+'%';
}
function setZoom(value,clientX,clientY){
  const next=clamp(Math.round(value*100)/100,.25,2.5);if(next===zoom)return zoom;
  const wr=work.getBoundingClientRect(),anchorX=clientX??(wr.left+wr.width/2),anchorY=clientY??(wr.top+wr.height/2);
  const before=stage.getBoundingClientRect(),logicalX=(anchorX-before.left)/zoom,logicalY=(anchorY-before.top)/zoom;
  zoom=next;measureView();
  const after=stage.getBoundingClientRect();
  work.scrollLeft+=after.left+logicalX*zoom-anchorX;
  work.scrollTop+=after.top+logicalY*zoom-anchorY;
  if(renderer)renderer.measure();
  if(field){field.setOptions({radius:view.scene.character.influenceRadius*zoom});field.measure();}
  return zoom;
}
function fitZoom(){
  const w=+stage.dataset.nwWidth||1200,h=+stage.dataset.nwHeight||800;
  const x=(work.clientWidth-64)/w,y=(work.clientHeight-124)/h;
  setZoom(Math.min(x,y,2.5));work.scrollLeft=0;work.scrollTop=0;
}
function stageCoords(clientX,clientY){
  const r=stage.getBoundingClientRect();
  return {x:(clientX-r.left)/zoom,y:(clientY-r.top)/zoom};
}
function projectedSpine(){
  const bounds=interactionSpace.getBoundingClientRect(),screen=stage.getBoundingClientRect();
  return renderer.spine.map(p=>({x:screen.left+(p.x-bounds.left)*zoom,y:screen.top+(p.y-bounds.top)*zoom}));
}
function syncStageDimensions(scene){
  const w=scene.stage.width,h=scene.stage.height;
  if(stage.dataset.nwWidth!==String(w)||stage.dataset.nwHeight!==String(h)){
    stage.dataset.nwWidth=String(w);stage.dataset.nwHeight=String(h);measureView();
  }
}
function editableTarget(t){return t&&(t.closest&&t.closest('input,textarea,select,[contenteditable="true"]'));}
q('zoomIn').onclick=()=>setZoom(zoom+.25);
q('zoomOut').onclick=()=>setZoom(zoom-.25);
q('zoomActual').onclick=()=>setZoom(1);
q('zoomFit').onclick=fitZoom;
work.addEventListener('wheel',e=>{
  if(!e.ctrlKey&&!e.metaKey)return;
  e.preventDefault();setZoom(zoom*(e.deltaY<0?1.12:1/1.12),e.clientX,e.clientY);
},{passive:false});
document.addEventListener('keydown',e=>{
  if(editableTarget(e.target))return;
  if(e.code==='Space'){spaceDown=true;if(e.cancelable)e.preventDefault();}
  if((e.key==='+'||e.key==='=')&&(e.ctrlKey||e.metaKey)){e.preventDefault();setZoom(zoom+.25);}
  if(e.key==='-'&&(e.ctrlKey||e.metaKey)){e.preventDefault();setZoom(zoom-.25);}
});
document.addEventListener('keyup',e=>{if(e.code==='Space')spaceDown=false;});
window.addEventListener('blur',()=>{spaceDown=false;endPan();});
function endPan(){if(!pan)return;pan=null;work.classList.remove('panning');window.removeEventListener('pointermove',movePan);window.removeEventListener('pointerup',endPan);window.removeEventListener('pointercancel',endPan);}
function movePan(e){if(!pan)return;work.scrollLeft=pan.left+pan.x-e.clientX;work.scrollTop=pan.top+pan.y-e.clientY;}
work.addEventListener('pointerdown',e=>{
  if(!spaceDown&&e.button!==1)return;
  e.preventDefault();e.stopPropagation();
  pan={x:e.clientX,y:e.clientY,left:work.scrollLeft,top:work.scrollTop};
  work.classList.add('panning');
  window.addEventListener('pointermove',movePan);window.addEventListener('pointerup',endPan);window.addEventListener('pointercancel',endPan);
},true);
stage.addEventListener('pointermove',e=>{
  if(pan)return;
  const p=stageCoords(e.clientX,e.clientY);follower.setTarget(p.x,p.y,'area');
},{passive:true});

var base=S.createScene({character:{size:360,preset:'character',influenceRadius:170},elements:[{id:'scene-text-1',type:'text',name:'Título',x:85,y:120,width:430,height:150,content:'LA ESCENA\nRESPONDE',style:{fontSize:62,color:'#fff'}},{id:'scene-button-1',type:'button',name:'Botón',x:920,y:625,content:'Explorar'},{id:'scene-shape-1',type:'shape',name:'Forma',x:820,y:145,width:150,height:150,style:{background:'#ff6a4d',borderRadius:999}}]});
var follower=E.createFollower(leader,{area:interactionSpace,preset:'character',renderMode:'none',distanceFromPointer:20,rotateToTarget:true,idle:{enabled:false}});
function stat(t){q('status').textContent=t}
function syncField(scene){
  if(!renderer){
    if(field){field.destroy();field=null;}
    if(api)api.field=null;
    return;
  }
  var nodes=stage.querySelectorAll('.item[data-reactive="1"]');
  if(!field){
    field=I.createField({source:()=>({points:projectedSpine()}),targets:nodes,radius:scene.character.influenceRadius*zoom,strength:scene.character.influenceStrength,maxPush:88,maxRotate:13,maxScale:.12,spring:.08,damping:.84,sweptBody:true});
  }else{
    field.setTargets(nodes);
    var options=field.options;
    if(options.radius!==scene.character.influenceRadius*zoom||options.strength!==scene.character.influenceStrength){
      field.setOptions({radius:scene.character.influenceRadius*zoom,strength:scene.character.influenceStrength});
    }
  }
  if(api)api.field=field;
}
var view=V.create({
  model:S,stage:stage,layers:q('layers'),canvas:canvas,scene:base,getZoom:()=>zoom,
  afterRender:(scene,id)=>{
    syncStageDimensions(scene);
    fill(scene,id);
    q('sceneJson').value=S.serialize(scene);
    syncField(scene);
    stat('V4-C.1 · '+scene.elements.length+' elementos · '+stage.querySelectorAll('.item[data-reactive="1"]').length+' reactivos');
  },
  onTransformHover:(hovered)=>{if(field){if(hovered)field.pause();else field.resume();}},
  onDragStart:()=>{if(field)field.pause();},
  onDragEnd:()=>{if(field){field.measure();field.resume();}},
  onDragMove:(scene,id,node)=>{
    if(field&&node)field.measure(node);
    if(view.selected===id){
      var element=scene.elements.find(e=>e.id===id);
      if(element){q('x').value=element.x;q('y').value=element.y;q('width').value=element.width;q('height').value=element.height;q('rotation').value=element.rotation;}
    }
  }
});
var ids=['name','content','x','y','width','height','rotation','elementScale','zIndex','opacity','locked','color','background','fontSize','borderRadius','reacts','weight','radiusScale','move','reactRotate','reactScale','returnSpeed'],ui={};ids.forEach(id=>ui[id]=q(id));
function fill(scene,id){var el=scene.elements.find(e=>e.id===id);q('editor').classList.toggle('hidden',!el);q('nothing').classList.toggle('hidden',!!el);if(!el)return;ui.name.value=el.name;ui.content.value=el.content;ui.x.value=el.x;ui.y.value=el.y;ui.width.value=el.width;ui.height.value=el.height;ui.rotation.value=el.rotation;ui.elementScale.value=el.scale;ui.zIndex.value=el.zIndex;ui.opacity.value=el.opacity;ui.locked.checked=el.locked;ui.color.value=el.style.color;ui.background.value=el.style.background;ui.fontSize.value=el.style.fontSize;ui.borderRadius.value=el.style.borderRadius;ui.reacts.checked=el.interaction.enabled;ui.weight.value=el.interaction.weight;ui.radiusScale.value=el.interaction.radiusScale;ui.move.value=el.interaction.move;ui.reactRotate.value=el.interaction.rotate;ui.reactScale.value=el.interaction.scale;ui.returnSpeed.value=el.interaction.returnSpeed;q('contentField').classList.toggle('hidden',['image','shape','background'].includes(el.type));q('imageField').classList.toggle('hidden',el.type!=='image')}
function patch(){var id=view.selected;if(!id)return;view.update(id,{name:ui.name.value,content:ui.content.value,x:+ui.x.value,y:+ui.y.value,width:+ui.width.value,height:+ui.height.value,rotation:+ui.rotation.value,scale:+ui.elementScale.value,zIndex:+ui.zIndex.value,opacity:+ui.opacity.value,locked:ui.locked.checked,style:{color:ui.color.value,background:ui.background.value,fontSize:+ui.fontSize.value,borderRadius:+ui.borderRadius.value},interaction:{enabled:ui.reacts.checked,weight:+ui.weight.value,radiusScale:+ui.radiusScale.value,move:+ui.move.value,rotate:+ui.reactRotate.value,scale:+ui.reactScale.value,returnSpeed:+ui.returnSpeed.value}})}
ids.forEach(id=>ui[id].addEventListener(['range','checkbox'].includes(ui[id].type)?'input':'change',patch));ui.name.oninput=ui.content.oninput=patch;
document.querySelectorAll('.add').forEach(b=>b.onclick=()=>view.add(b.dataset.type,{x:b.dataset.type==='background'?0:140+view.scene.elements.length*20,y:b.dataset.type==='background'?0:130+view.scene.elements.length*18}));
q('duplicate').onclick=()=>view.selected&&view.duplicate(view.selected);q('remove').onclick=()=>view.selected&&view.remove(view.selected);
q('imageFile').onchange=function(){var f=this.files&&this.files[0],id=view.selected;if(!f||!id)return;var r=new FileReader();r.onload=()=>view.update(id,{src:String(r.result)});r.readAsDataURL(f)};
q('exportScene').onclick=()=>q('sceneJson').value=S.serialize(view.scene);q('applyScene').onclick=()=>{try{view.setScene(S.deserialize(q('sceneJson').value));syncChar()}catch(e){stat('ERROR JSON · '+e.message)}};
function syncChar(){q('characterSize').value=view.scene.character.size;q('characterPreset').value=view.scene.character.preset;q('globalRadius').value=view.scene.character.influenceRadius}
q('characterSize').oninput=function(){view.setScene(S.setCharacter(view.scene,{size:+this.value}));if(renderer)renderer.setOptions({length:+this.value})};
q('characterPreset').onchange=function(){view.setScene(S.setCharacter(view.scene,{preset:this.value}));if(renderer)renderer.setOptions({adaptivePreset:this.value})};
q('globalRadius').oninput=function(){view.setScene(S.setCharacter(view.scene,{influenceRadius:+this.value}))};
var fallback='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="360" height="620"><ellipse cx="180" cy="92" rx="58" ry="72" fill="#ffd07a"/><path d="M122 84q58-88 116 0v22H122z" fill="#f6f0e7"/><path d="M102 176q78-52 156 0l34 185q-24 84-112 90-88-6-112-90z" fill="#d93118"/><path d="M145 178q35 44 70 0l16 262h-102z" fill="#ef4a2d"/></svg>');
async function prep(){stat('Analizando personaje…');var an=await A.analyzeImage(src,{maxDimension:512}),p=A.createProfile(an,{leadEnd:'right',cropPadding:.015}),prepared=await V3.prepareAsset(src,an,{profile:p,paddingRatio:.015});if(renderer)renderer.destroy();renderer=V4.createRenderer({leader:follower,canvas:canvas,area:interactionSpace,image:prepared.canvas,length:view.scene.character.size,adaptivePreset:view.scene.character.preset,antiFold:true});api.renderer=renderer;view.render()}
q('characterFile').onchange=function(){var f=this.files&&this.files[0];if(!f)return;if(srcUrl)URL.revokeObjectURL(srcUrl);srcUrl=URL.createObjectURL(f);src.onload=()=>prep().catch(e=>stat('ERROR · '+e.message));src.src=srcUrl};
var api=window.__NAGWEB_SCENE_COMPOSER__={view:view,follower:follower,renderer:null,field:null,get zoom(){return zoom;},setZoom:setZoom,fitZoom:fitZoom,stageCoords:stageCoords,get scene(){return view.scene}};syncChar();view.render();src.onload=()=>prep().catch(e=>stat('ERROR · '+e.message));src.src=fallback;
})();