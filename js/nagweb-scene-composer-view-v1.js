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
    o.className='item '+el.type+(selected===el.id?' sel':'');
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
    if(el.type==='background'){o.onclick=null;o.onpointerdown=null;}
    else{
      o.onclick=e=>{e.stopPropagation();select(el.id)};
      o.onpointerdown=e=>{select(el.id);if(!el.locked)start(e,el)};
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
  function start(e,el){
    e.preventDefault();e.stopPropagation();
    if(input.onDragStart)input.onDragStart();
    drag={id:el.id,sx:e.clientX,sy:e.clientY,x:el.x,y:el.y};
    addEventListener('pointermove',move);
    addEventListener('pointerup',end,{once:true});
  }
  function move(e){
    if(!drag)return;
    var x=Math.round(drag.x+e.clientX-drag.sx),y=Math.round(drag.y+e.clientY-drag.sy);
    scene=S.updateElement(scene,drag.id,{x:x,y:y});
    var n=Array.from(stage.querySelectorAll('.item')).find(el=>el.dataset.sceneId===drag.id);
    if(n){n.style.left=x+'px';n.style.top=y+'px';}
    if(input.onDragMove)input.onDragMove(scene,drag.id,n);
  }
  function end(){removeEventListener('pointermove',move);drag=null;render();}
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
root.NAGWEB_SCENE_COMPOSER_VIEW={version:'1.1.0-alpha.1',create:create};
})(typeof window!=='undefined'?window:globalThis);
