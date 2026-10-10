(function(){
'use strict';
// Rendering adapter only: no scroll reader, progress evaluator or animation clock.
function createSpatialRenderer(T,renderer,scene,objects,lightSources,options){
 var rows=[],api=null;options=options||{};
 lightSources=lightSources||scene.children.filter(function(n){return n.isLight;});
 function units(row){return Math.max(1,row.stage.clientHeight)/(2*6*Math.tan(50*Math.PI/360));}
 function lightRow(light){return rows.find(function(row){return row.lights.some(function(q){return q.source===light;})&&light.userData.sectionId===row.sectionId;});}
 function syncLights(row,visible){
  row.rig.position.set(0,0,-row.state.cssPerspective);row.rig.scale.setScalar(units(row));
  row.lights.forEach(function(q){
   var source=q.source,copy=q.copy;
   copy.visible=visible[q.index];copy.color.copy(source.color);copy.intensity=source.intensity;
   copy.position.copy(source.position);
   if(source.userData.sectionId)copy.position.y-=source.userData.sectionOffsetY||0;
   if('distance' in source)copy.distance=source.distance*units(row);
   if('decay' in source)copy.decay=source.decay;
   if('angle' in source)copy.angle=source.angle;
   if('penumbra' in source)copy.penumbra=source.penumbra;
   if(copy.target)copy.target.position.copy(source.target.position);
  });
 }
 function connect(cameraAPI,stages){
  destroy();api=cameraAPI;
  (stages||[]).forEach(function(stage){
   var members=objects.filter(function(g){return g.userData.anchorEl&&stage.contains(g.userData.anchorEl);});
   if(!members.length)return;
   var section=stage.closest?stage.closest('.sc'):null,sectionId=section&&section.getAttribute('data-id');
   var cam=new T.PerspectiveCamera(50,1,.1,100000),rig=new T.Group(),row={stage:stage,sectionId:sectionId,camera:cam,objects:members,state:null,rig:rig,lights:[],materials:new Map()};
   lightSources.forEach(function(source,index){
    if(source.userData.sectionId&&source.userData.sectionId!==sectionId)return;
    var copy=source.clone();rig.add(copy);if(copy.target)rig.add(copy.target);
    row.lights.push({source:source,copy:copy,index:index});
   });
   rig.visible=false;scene.add(rig);
   row.unbind=api.bindThreeCamera(stage,cam,function(state){row.state=state;});
   rows.push(row);
  });
 }
 function owns(g){return rows.some(function(row){return row.objects.indexOf(g)>=0;});}
 function worldOffset(node,row){
  var world=node.closest&&node.closest('[data-nw-camera-world]');
  return {world:world,x:world?(world.offsetLeft||0)+(row.stage.clientLeft||0):0,y:world?(world.offsetTop||0)+(row.stage.clientTop||0):0};
 }
 function parentSpace(g,row){
  var node=g.userData.anchorEl;
  if(!node.hasAttribute||!node.hasAttribute('data-nw-spatial-parent'))return null;
  var chain=[],n=node.parentElement,world=node.closest('[data-nw-camera-world]');
  while(n&&n!==world&&n!==row.stage&&chain.length<8){chain.unshift(n);n=n.parentElement;}
  if(!world||n!==world)return{opacity:0,matrix:new T.Matrix4()};
  var matrix=new T.Matrix4(),opacity=1;
  function length(value,size){var f=parseFloat(value);return Number.isFinite(f)?f*(/%$/.test(value)?size/100:1):0;}
  chain.forEach(function(el){
   var cs=window.getComputedStyle(el),parts,origin=cs.transformOrigin.split(/\s+/),parent=el.offsetParent;
   var x=el.offsetLeft+(parent&&parent.clientLeft||0)-(parent&&parent.scrollLeft||0),y=el.offsetTop+(parent&&parent.clientTop||0)-(parent&&parent.scrollTop||0);
   var ox=length(origin[0],el.offsetWidth),oy=length(origin[1],el.offsetHeight),oz=length(origin[2],0),local=new T.Matrix4().makeTranslation(x+ox,y+oy,oz);
   if(cs.translate&&cs.translate!=='none'){
    parts=cs.translate.split(/\s+/);local.multiply(new T.Matrix4().makeTranslation(length(parts[0],el.offsetWidth),length(parts[1],el.offsetHeight),length(parts[2],0)));
   }
   if(cs.rotate&&cs.rotate!=='none'){
    parts=cs.rotate.split(/\s+/);var a=parts.pop(),r=parseFloat(a)*(a.endsWith('grad')?Math.PI/200:a.endsWith('rad')?1:a.endsWith('turn')?2*Math.PI:Math.PI/180),axis=new T.Vector3(0,0,1);
    if(parts.length===1)axis.set(parts[0]==='x'?1:0,parts[0]==='y'?1:0,parts[0]==='z'?1:0);
    else if(parts.length===3)axis.set(+parts[0],+parts[1],+parts[2]).normalize();
    local.multiply(new T.Matrix4().makeRotationAxis(axis,r));
   }
   if(cs.scale&&cs.scale!=='none'){
    parts=cs.scale.split(/\s+/).map(Number);local.multiply(new T.Matrix4().makeScale(parts[0],parts.length>1?parts[1]:parts[0],parts.length>2?parts[2]:1));
   }
   if(cs.transform&&cs.transform!=='none')local.multiply(new T.Matrix4().fromArray(new window.DOMMatrix(cs.transform).toFloat64Array()));
   local.multiply(new T.Matrix4().makeTranslation(-ox,-oy,-oz));matrix.multiply(local);
   opacity*=cs.display==='none'||cs.visibility==='hidden'?0:Math.max(0,Math.min(1,+cs.opacity));
  });
  // Convert CSS coordinates to Three world coordinates, excluding the camera
  // world itself: bindThreeCamera already supplies that view transformation.
  var offset=worldOffset(node,row),flip=new T.Matrix4().makeScale(1,-1,1),worldMatrix=new T.Matrix4().makeTranslation(offset.x-row.stage.clientWidth/2,row.stage.clientHeight/2-offset.y,-row.state.cssPerspective);
  worldMatrix.multiply(flip).multiply(matrix).multiply(flip);
  return{opacity:opacity,matrix:worldMatrix};
 }
 function place(g,row){
  var node=g.userData.anchorEl,h=g.userData.holder,o=g.userData.o,stage=row.stage;
  // Layout coordinates exclude camera transforms; nested anchors use their
  // actual container ancestry and its already evaluated CSS transforms.
  var width=node.offsetWidth,height=node.offsetHeight;
  if(!g.userData.nativeR)g.userData.nativeR=measure(g);
  var pose=node.__nwSpatialPose||{x:0,y:0,z:0,scale:100,rotate:0,rotateX:0,rotateY:0,opacity:1};
  var parent=parentSpace(g,row);
  g.userData.spatialOpacity=Math.max(0,Math.min(1,pose.opacity))*(parent?parent.opacity:1);
  h.visible=width>0&&height>0&&g.userData.nativeR>0&&pose.scale>0&&g.userData.spatialOpacity>0&&(!parent||Math.abs(parent.matrix.determinant())>1e-10);
  if(!h.visible)return;
  var depth=row.state.cssPerspective,unit=1/units(row);
  if(parent){
   var rotation=new T.Quaternion().setFromEuler(new T.Euler(-pose.rotateX*Math.PI/180,pose.rotateY*Math.PI/180,-pose.rotate*Math.PI/180,'ZXY'));
   var host=node.offsetParent,local=new T.Matrix4().compose(new T.Vector3(node.offsetLeft+(host.clientLeft||0)-(host.scrollLeft||0)+pose.x,-node.offsetTop-(host.clientTop||0)+(host.scrollTop||0)-pose.y,(o.offZ||0)/unit+pose.z),rotation,new T.Vector3(1,1,1).multiplyScalar(width/2/g.userData.nativeR*pose.scale/100));
   h.matrixAutoUpdate=false;h.matrix.copy(parent.matrix).multiply(local);h.matrix.decompose(h.position,h.quaternion,h.scale);h.matrixWorldNeedsUpdate=true;
   g.userData.spatialParent=parent.matrix;return;
  }
  h.matrixAutoUpdate=true;delete g.userData.spatialParent;
  // offsetLeft/Top are relative to .inner's padding edge, not the stage.
  // Its layout offset and border/scroll remain independent of camera motion.
  var offset=worldOffset(node,row),host=offset.world;
  var x=node.offsetLeft+offset.x+(host&&host.clientLeft||0)-(host&&host.scrollLeft||0),y=node.offsetTop+offset.y+(host&&host.clientTop||0)-(host&&host.scrollTop||0);
  h.position.set(x-stage.clientWidth/2+pose.x,stage.clientHeight/2-y-pose.y,-depth+(o.offZ||0)/unit+pose.z);
  h.scale.setScalar(width/2/g.userData.nativeR*pose.scale/100);
  // CSS y points down; local positive z points toward the viewer. Individual
  // rotate precedes the additive rotateX/rotateY transform (ZXY order).
  h.rotation.set(-pose.rotateX*Math.PI/180,pose.rotateY*Math.PI/180,-pose.rotate*Math.PI/180,'ZXY');
 }
 function measure(g){
  // Measure in Group space. A late GLB must not inherit a stale, nonuniform or
  // singular holder matrix when deriving its native size.
  var matrices=new Map(),box=new T.Box3(),part=new T.Box3();matrices.set(g,new T.Matrix4());
  g.traverse(function(n){
   if(n!==g){if(n.matrixAutoUpdate)n.updateMatrix();matrices.set(n,new T.Matrix4().multiplyMatrices(matrices.get(n.parent),n.matrix));}
   if(!n.geometry)return;if(!n.geometry.boundingBox)n.geometry.computeBoundingBox();
   if(n.geometry.boundingBox)box.union(part.copy(n.geometry.boundingBox).applyMatrix4(matrices.get(n)));
  });
  if(box.isEmpty())return 0;
  var sphere=new T.Sphere();box.getBoundingSphere(sphere);return sphere.radius;
 }
 function fade(row){
  var assignments=[];
  row.objects.forEach(function(g){
   var opacity=g.userData.spatialOpacity;
   if(!g.userData.holder.visible||opacity>=1)return;
   var copies=row.materials.get(g);if(!copies){copies=new Map();row.materials.set(g,copies);}
   function faded(source){
    if(!source)return source;
    var copy=copies.get(source);if(!copy){copy=source.clone();copies.set(source,copy);}
    // Copies are private to each object, even if a GLB shares a material.
    // Source materials (including loader-owned alpha) remain untouched.
    copy.copy(source);copy.opacity=source.opacity*opacity;copy.alphaTest=source.alphaTest*opacity;copy.transparent=true;copy.depthWrite=false;
    return copy;
   }
   g.traverse(function(n){if(n.material){assignments.push({node:n,material:n.material});n.material=Array.isArray(n.material)?n.material.map(faded):faded(n.material);}});
  });
  return function(){assignments.forEach(function(q){q.node.material=q.material;});};
 }
 function render(legacyRender){
  if(!rows.some(function(row){return !!row.state;})){legacyRender();return;}
  var roots=objects.map(function(g){return g.userData.holder||g;}),visible=roots.map(function(g){return g.visible;});
  var autoClear=renderer.autoClear,lightVisible=lightSources.map(function(light){return light.visible;}),gizmos=[];
  lightSources.forEach(function(light){if(lightRow(light))light.children.forEach(function(child){gizmos.push({node:child,visible:child.visible});});});
  try{
   roots.forEach(function(g,i){if(owns(objects[i])){g.visible=false;visible[i]=false;}});
   gizmos.forEach(function(g){g.node.visible=false;});
   legacyRender();
   renderer.autoClear=false;
   lightSources.forEach(function(light){light.visible=false;});
   rows.forEach(function(row){
    if(!row.state||!row.stage.isConnected){if(row.bloom){row.bloom.dispose();row.bloom=null;}return;}
    var r=row.stage.getBoundingClientRect(),W=renderer.domElement.clientWidth,H=renderer.domElement.clientHeight;
    if(r.bottom<=0||r.top>=H||r.right<=0||r.left>=W||!r.width||!r.height){if(row.bloom){row.bloom.dispose();row.bloom=null;}return;}
    rows.forEach(function(other){other.rig.visible=false;});
    syncLights(row,lightVisible);row.rig.visible=true;
    roots.forEach(function(g){g.visible=false;});
    row.objects.forEach(function(g){place(g,row);visible[objects.indexOf(g)]=g.userData.holder.visible;});
    renderer.setViewport(r.left,H-r.bottom,r.width,r.height);
    renderer.setScissor(Math.max(0,r.left),Math.max(0,H-r.bottom),Math.min(W,r.right)-Math.max(0,r.left),Math.min(H,r.bottom)-Math.max(0,r.top));
    renderer.setScissorTest(true);renderer.clearDepth();
    if(options.bloom&&options.createBloom&&!row.bloomFailed&&!row.bloom){row.bloom=options.createBloom(T,renderer,scene,row.camera,options.strength);if(!row.bloom)row.bloomFailed=true;}
    var restore=fade(row);
    try{
     if(row.bloom){
      try{row.bloom.render(r.width,r.height);}catch(_){row.bloom.dispose();row.bloom=null;row.bloomFailed=true;renderer.render(scene,row.camera);}
     }else renderer.render(scene,row.camera);
    }finally{restore();}
   });
  }finally{
   renderer.setScissorTest(false);renderer.setViewport(0,0,renderer.domElement.clientWidth,renderer.domElement.clientHeight);
   renderer.autoClear=autoClear;roots.forEach(function(g,i){g.visible=visible[i];});
   lightSources.forEach(function(light,i){light.visible=lightVisible[i];});
   rows.forEach(function(row){row.rig.visible=false;});
   gizmos.forEach(function(g){g.node.visible=g.visible;});
  }
 }
 function destroy(){rows.forEach(function(row){row.unbind();if(row.bloom)row.bloom.dispose();row.materials.forEach(function(copies){copies.forEach(function(m){m.dispose();});});row.objects.forEach(function(g){delete g.userData.spatialOpacity;delete g.userData.spatialParent;g.userData.holder.matrixAutoUpdate=true;g.userData.holder.rotation.x=0;g.userData.holder.rotation.y=0;});scene.remove(row.rig);});rows=[];}
 function view(g){
  var row=rows.find(function(r){return r.objects.indexOf(g)>=0;})||lightRow(g);
  if(!row||!row.state)return null;
  var q=row.lights.find(function(q){return q.source===g;});
  return{camera:row.camera,rect:row.stage.getBoundingClientRect(),object:q?q.copy:null};
 }
 function lightPoint(light,x,y){
  var row=lightRow(light),v=view(light);if(!row||!v)return null;
  var r=v.rect;if(!r.width||!r.height)return null;
  var origin=new T.Vector3();v.object.getWorldPosition(origin);
  var ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((x-r.left)/r.width*2-1,1-(y-r.top)/r.height*2),v.camera);
  var hit=ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,0,1),-origin.z),new T.Vector3());
  return hit?row.rig.worldToLocal(hit):null;
 }
 function anchorPoint(g,x,y){
  var v=view(g),h=g.userData.holder;if(!v||!h||!v.rect.width||!v.rect.height||!Number.isFinite(x)||!Number.isFinite(y)||!interactive(g))return null;
  v.camera.updateMatrixWorld(true);h.updateWorldMatrix(true,false);
  var origin=h.getWorldPosition(new T.Vector3()),ray=new T.Raycaster(),parent=g.userData.spatialParent,normal=new T.Vector3(0,0,1);
  if(parent){if(Math.abs(parent.determinant())<1e-10)return null;normal.applyMatrix3(new T.Matrix3().getNormalMatrix(parent)).normalize();}
  ray.setFromCamera(new T.Vector2((x-v.rect.left)/v.rect.width*2-1,1-(y-v.rect.top)/v.rect.height*2),v.camera);
  var hit=ray.ray.intersectPlane(new T.Plane().setFromNormalAndCoplanarPoint(normal,origin),new T.Vector3());
  if(!hit)return null;var z=hit.clone().project(v.camera).z;
  if(!Number.isFinite(z)||z<-1||z>1)return null;
  return parent?hit.applyMatrix4(parent.clone().invert()):hit;
 }
 function visible(n){for(var p=n;p;p=p.parent)if(!p.visible)return false;return true;}
 function interactive(g){
  var node=g.userData.anchorEl,pose=node&&node.__nwSpatialPose;
  var row=rows.find(function(r){return r.objects.indexOf(g)>=0;}),parent=row&&row.state?parentSpace(g,row):null;
  return visible(g)&&g.userData.spatialOpacity!==0&&(!row||(pose?pose.opacity:1)*(parent?parent.opacity:1)>=.025&&(pose?pose.scale:100)>0&&(!parent||Math.abs(parent.matrix.determinant())>1e-10));
 }
 function materialVisible(m){return !!m&&(Array.isArray(m)?m.some(materialVisible):m.visible&&m.opacity>0);}
 function pick(candidates,x,y,legacyCamera){
  var W=renderer.domElement.clientWidth,H=renderer.domElement.clientHeight,best=null;
  if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>=W||y>=H)return null;
  var ray=new T.Raycaster(),box=new T.Box3(),part=new T.Box3(),sphere=new T.Sphere(),center=new T.Vector3(),edge=new T.Vector3(),right=new T.Vector3();
  function choose(g,layer,exact,distance,depth){
   if(!best||layer>best.layer||(layer===best.layer&&(exact&&!best.exact||exact===best.exact&&(distance<best.distance||distance===best.distance&&depth<best.depth))))best={g:g,layer:layer,exact:exact,distance:distance,depth:depth};
  }
  candidates.forEach(function(g){
   if(!interactive(g))return;
   var layer=rows.findIndex(function(row){return row.objects.indexOf(g)>=0;}),row=rows[layer];
   if(row&&(!row.state||!row.stage.isConnected))return;
   var cam=row?row.camera:legacyCamera,r=row?row.stage.getBoundingClientRect():{left:0,top:0,width:W,height:H};
   // These are the same screen/stage bounds used by the render scissor.
   if(!cam||!r.width||!r.height||x<r.left||y<r.top||x>=r.left+r.width||y>=r.top+r.height)return;
   cam.updateMatrixWorld(true);g.updateWorldMatrix(true,true);
   ray.setFromCamera(new T.Vector2((x-r.left)/r.width*2-1,1-(y-r.top)/r.height*2),cam);
   var hit=ray.intersectObject(g,true).find(function(hit){
    var m=hit.object.material;if(Array.isArray(m))m=m[hit.face?hit.face.materialIndex:0];
    var z=hit.point.clone().project(cam).z;return visible(hit.object)&&materialVisible(m)&&z>=-1&&z<=1;
   });
   if(hit){choose(g,layer,true,hit.distance,hit.distance);return;}
   // Preserve the generous target for ring holes and point clouds when no surface is hit.
   box.makeEmpty();g.traverse(function(n){if(!n.geometry||!visible(n)||!materialVisible(n.material))return;if(!n.geometry.boundingBox)n.geometry.computeBoundingBox();if(n.geometry.boundingBox)box.union(part.copy(n.geometry.boundingBox).applyMatrix4(n.matrixWorld));});
   if(box.isEmpty())return;box.getBoundingSphere(sphere);center.copy(sphere.center).project(cam);
   if(!Number.isFinite(center.x)||!Number.isFinite(center.y)||center.z<-1||center.z>1)return;
   right.set(1,0,0).applyQuaternion(cam.quaternion);edge.copy(sphere.center).addScaledVector(right,sphere.radius).project(cam);
   var sx=r.left+(center.x*.5+.5)*r.width,sy=r.top+(-center.y*.5+.5)*r.height,rad=Math.abs((edge.x-center.x)*.5*r.width)*.85,d=Math.hypot(x-sx,y-sy);
   if(d<=rad)choose(g,layer,false,d,sphere.center.distanceTo(cam.position));
  });
  return best?best.g:null;
 }
 return{connect:connect,owns:owns,render:render,destroy:destroy,view:view,lightPoint:lightPoint,anchorPoint:anchorPoint,pick:pick,interactive:interactive};
}
window.NAGWEB_CREATE_SPATIAL_RENDERER=createSpatialRenderer;
})();
