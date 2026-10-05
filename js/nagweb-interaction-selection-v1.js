/* NagWeb Interaction Selection Geometry v1
   Pure helpers for marquee/lasso selection of reactive DOM targets.
*/
(function(root,factory){
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.NAGWEB_INTERACTION_SELECTION=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  var VERSION='1.0.0';
  function num(v,d){v=Number(v);return Number.isFinite(v)?v:d;}
  function normalizeRect(a,b){
    a=a||{};b=b||{};
    var x1=num(a.x!=null?a.x:a.left,0),y1=num(a.y!=null?a.y:a.top,0);
    var x2=num(b.x!=null?b.x:b.right,x1),y2=num(b.y!=null?b.y:b.bottom,y1);
    var left=Math.min(x1,x2),right=Math.max(x1,x2),top=Math.min(y1,y2),bottom=Math.max(y1,y2);
    return {left:left,top:top,right:right,bottom:bottom,width:right-left,height:bottom-top};
  }
  function cleanRect(r){
    r=r||{};
    var left=num(r.left,0),top=num(r.top,0);
    var right=num(r.right,left+Math.max(0,num(r.width,0)));
    var bottom=num(r.bottom,top+Math.max(0,num(r.height,0)));
    if(right<left){var tx=right;right=left;left=tx;}
    if(bottom<top){var ty=bottom;bottom=top;top=ty;}
    return {left:left,top:top,right:right,bottom:bottom,width:right-left,height:bottom-top};
  }
  function intersectionArea(a,b){
    a=cleanRect(a);b=cleanRect(b);
    var w=Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left));
    var h=Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
    return w*h;
  }
  function centerInside(rect,box){
    rect=cleanRect(rect);box=cleanRect(box);
    var x=(rect.left+rect.right)/2,y=(rect.top+rect.bottom)/2;
    return x>=box.left&&x<=box.right&&y>=box.top&&y<=box.bottom;
  }
  function hitRect(rect,box,options){
    options=options||{};rect=cleanRect(rect);box=cleanRect(box);
    if(centerInside(rect,box))return true;
    var area=Math.max(1,rect.width*rect.height);
    var minOverlap=Math.max(0,Math.min(1,num(options.minOverlap,.35)));
    return intersectionArea(rect,box)/area>=minOverlap;
  }
  function hitIds(entries,box,options){
    var out=[];
    (Array.isArray(entries)?entries:[]).forEach(function(entry){
      if(!entry||entry.id==null||!entry.rect)return;
      if(hitRect(entry.rect,box,options))out.push(String(entry.id));
    });
    return Array.from(new Set(out));
  }
  function applySelection(current,hits,mode){
    var base=Array.from(new Set((Array.isArray(current)?current:[]).map(String)));
    var incoming=Array.from(new Set((Array.isArray(hits)?hits:[]).map(String)));
    mode=mode==='add'||mode==='subtract'||mode==='toggle'?mode:'replace';
    if(mode==='replace')return incoming;
    if(mode==='add')return base.concat(incoming.filter(function(id){return base.indexOf(id)<0;}));
    if(mode==='subtract')return base.filter(function(id){return incoming.indexOf(id)<0;});
    incoming.forEach(function(id){var i=base.indexOf(id);if(i>=0)base.splice(i,1);else base.push(id);});
    return base;
  }
  return {
    version:VERSION,
    normalizeRect:normalizeRect,
    cleanRect:cleanRect,
    intersectionArea:intersectionArea,
    centerInside:centerInside,
    hitRect:hitRect,
    hitIds:hitIds,
    applySelection:applySelection
  };
});
