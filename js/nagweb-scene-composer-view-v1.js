(function(root){'use strict';
// Keyed canvas reconciliation: visual nodes are not recreated during selection or editing.
function create(input){
  var S=input.model,stage=input.stage,layers=input.layers,canvas=input.canvas,scene=input.scene,selected=null,drag=null;
  function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function itemNode(el){
    var o=document.createElement('div'),n=document.createElement('div');
    n.className='inner';o.appendChild(n);
    return o;
  }
  function patchItem(o,el){
    o.className='item '+el.type+(selected===el.id?' sel':'')+(el.locked?' locked':'');
    o.dataset.sceneId=el.id;
    o.dataset.reactive=el.interaction.enabled?'1':'0';
    Object.assign(o.style,{left:el.x+'px',top:el.y+'px',width:el.width+'px',height:el.height+'px',zIndex:el.zIndex,opacity:el.opacity});
    var a=S.interactionAttributes(el);
    Object.keys(a).forEach(k=>o.setAttribute(k,a[k]));
    var n=o.firstElementChild;
    Object.assign(n.style,{transform:'rotate('+el.rotation+'deg) scale('+el.scale+')',color:el.style.color,background:el.style.background,fontSize:el.style.fontSize+'px',fontWeight:el.style.fontWeight,borderRadius:el.style.borderRadius+'px',padding:el.style.padding+'px'});
    if(el.type==='image'&&el.src){
      var im=n.firstElementChild;
      if(!im||im.tagName!=='IMG'){n.textContent='';im=document.createElement('img');n.appendChild(im);}
      if(im.getAttribute('src')!==el.src)im.src=el.src;
      im.style.objectFit=el.style.objectFit;
    }else{
      var content=el.type==='image'?'Seleccioná una imagen':el.content;
      if(n.textContent!==content||n.firstElementChild)n.textContent=content;
    }
    // Pointer handles live outside .inner so editing content doesn't remove them.
    var active=selected===el.id&&!el.locked&&el.type!=='background';
    ['resize','rotate'].forEach(function(mode){
      var handle=Array.from(o.children).find(function(c){return c.dataset.handle===mode;});
      if(active){
        if(!handle){handle=document.createElement('button');handle.type='button';handle.className='transform-handle '+mode+'-handle';handle.dataset.handle=mode;handle.setAttribute('aria-label',mode==='resize'?'Cambiar tamaño':'Rotar');o.appendChild(handle);}
        handle.onpointerdown=function(e){e.stopPropagation();start(e,el,mode);};
        handle.onclick=function(e){e.stopPropagation();};
      }else if(handle){handle.remove();}
    });
    if(el.type==='background'){o.onclick=null;o.onpointerdown=null;}
    else{
      o.onclick=e=>{e.stopPropagation();select(el.id)};
      o.onpointerdown=e=>{e.stopPropagation();select(el.id);if(!el.locked)start(e,el,'move')};
    }
  }
  function render(){
    var existing=new Map();
    stage.querySelectorAll('.item').forEach(n=>existing.set(n.dataset.sceneId,n));
    Object.assign(stage.style,{width:scene.stage.width+'px',height:scene.stage.height+'px',background:scene.stage.background});
    var ordered=scene.elements.slice().sort((a,b)=>a.zIndex-b.zIndex);
    var nodes=ordered.map(el=>{
      var node=existing.get(el.id);
      if(node)existing.delete(el.id);else node=itemNode(el);
      patchItem(node,el);
      return node;
    });
    existing.forEach(n=>n.remove());
    // Move only when stacking order changed, and leave the canvas/leader untouched.
    var anchor=canvas;
    for(var i=nodes.length-1;i>=0;i--){
      if(nodes[i].nextSibling!==anchor)stage.insertBefore(nodes[i],anchor);
      anchor=nodes[i];
    }
    layers.innerHTML='';
    ordered.slice().reverse().forEach(el=>{
      var r=document.createElement('div');
      r.className='layer'+(selected===el.id?' on':'');
      r.innerHTML='<span>'+esc(el.name)+'</span> <small>'+esc(el.type)+'</small>';
      r.onclick=()=>select(el.id);
      layers.appendChild(r);
    });
    if(input.afterRender)input.afterRender(scene,selected);
  }
  function select(id){selected=id;render();}
  function start(e,el,mode){
    if(el.locked||el.type==='background')return;
    e.preventDefault();e.stopPropagation();
    // A single operation has one origin, while the scene stays serializable.
    if(selected!==el.id)select(el.id);
    if(drag)end();
    if(input.onDragStart)input.onDragStart();
    var node=Array.from(stage.querySelectorAll('.item')).find(n=>n.dataset.sceneId===el.id);
    var bounds=node.getBoundingClientRect();
    var cx=bounds.left+bounds.width/2,cy=bounds.top+bounds.height/2;
    drag={id:el.id,mode:mode,sx:e.clientX,sy:e.clientY,
      x:el.x,y:el.y,width:el.width,height:el.height,rotation:el.rotation,
      cx:cx,cy:cy,angle:Math.atan2(e.clientY-cy,e.clientX-cx)};
    addEventListener('pointermove',move);
    addEventListener('pointerup',end,{once:true});
    addEventListener('pointercancel',end,{once:true});
  }
  function move(e){
    if(!drag)return;
    var dx=e.clientX-drag.sx,dy=e.clientY-drag.sy,patch={};
    if(drag.mode==='move'){
      patch.x=Math.round(drag.x+dx);patch.y=Math.round(drag.y+dy);
    }else if(drag.mode==='resize'){
      patch.width=Math.max(16,Math.round(drag.width+dx));
      patch.height=e.shiftKey?Math.max(16,Math.round(patch.width*drag.height/drag.width)):
        Math.max(16,Math.round(drag.height+dy));
    }else if(drag.mode==='rotate'){
      var angle=Math.atan2(e.clientY-drag.cy,e.clientX-drag.cx);
      var delta=Math.atan2(Math.sin(angle-drag.angle),Math.cos(angle-drag.angle))*180/Math.PI;
      var value=drag.rotation+delta;
      patch.rotation=e.shiftKey?Math.round(value/15)*15:Math.round(value*10)/10;
    }
    scene=S.updateElement(scene,drag.id,patch);
    var el=scene.elements.find(x=>x.id===drag.id);
    var n=Array.from(stage.querySelectorAll('.item')).find(x=>x.dataset.sceneId===drag.id);
    if(n&&el){
      if(drag.mode==='move'){n.style.left=el.x+'px';n.style.top=el.y+'px';}
      if(drag.mode==='resize'){n.style.width=el.width+'px';n.style.height=el.height+'px';}
      if(drag.mode==='rotate'){
        n.firstElementChild.style.transform='rotate('+el.rotation+'deg) scale('+el.scale+')';
      }
    }
    if(input.onDragMove)input.onDragMove(scene,drag.id,n);
  }
  function end(){
    if(!drag)return;
    removeEventListener('pointermove',move);
    removeEventListener('pointerup',end);
    removeEventListener('pointercancel',end);
    drag=null;render();
  }
  stage.onpointerdown=e=>{if(e.target===stage||e.target===canvas){selected=null;render();}};
  return {
    render:render,
    get scene(){return scene},
    setScene:s=>{scene=S.normalizeScene(s);render()},
    get selected(){return selected},
    setSelected:id=>{selected=id;render()},
    update:(id,p)=>{scene=S.updateElement(scene,id,p);render()},
    add:(t,p)=>{scene=S.addElement(scene,t,p);selected=scene.elements.at(-1).id;render()},
    remove:id=>{scene=S.removeElement(scene,id);if(selected===id)selected=null;render()},
    duplicate:id=>{var old=new Set(scene.elements.map(e=>e.id));scene=S.duplicateElement(scene,id);selected=scene.elements.find(e=>!old.has(e.id)).id;render()}
  };
}
root.NAGWEB_SCENE_COMPOSER_VIEW={version:'1.2.0-alpha.1',create:create};
})(typeof window!=='undefined'?window:globalThis);
