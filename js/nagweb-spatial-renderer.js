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
   var cam=new T.PerspectiveCamera(50,1,.1,100000),rig=new T.Group(),row={stage:stage,sectionId:sectionId,camera:cam,objects:members,state:null,rig:rig,lights:[]};
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
 function place(g,row){
  var node=g.userData.anchorEl,h=g.userData.holder,o=g.userData.o,stage=row.stage;
  // Anchors are direct stage children. Layout coordinates exclude camera transforms.
  var width=node.offsetWidth,height=node.offsetHeight;
  if(!g.userData.nativeR)g.userData.nativeR=measure(g);
  h.visible=width>0&&height>0&&g.userData.nativeR>0;
  if(!h.visible)return;
  var depth=row.state.cssPerspective,unit=1/units(row);
  h.position.set(node.offsetLeft-stage.clientWidth/2,stage.clientHeight/2-node.offsetTop,-depth+(o.offZ||0)/unit);
  h.scale.setScalar(width/2/g.userData.nativeR);
  h.rotation.set(0,0,0);
 }
 function measure(g){
  g.updateMatrixWorld(true);
  var box=new T.Box3().setFromObject(g);
  if(box.isEmpty())return 0;
  var sphere=new T.Sphere(),scale=new T.Vector3();box.getBoundingSphere(sphere);g.getWorldScale(scale);
  return sphere.radius/(scale.x||1);
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
    if(row.bloom){
     try{row.bloom.render(r.width,r.height);}catch(_){row.bloom.dispose();row.bloom=null;row.bloomFailed=true;renderer.render(scene,row.camera);}
    }else renderer.render(scene,row.camera);
   });
  }finally{
   renderer.setScissorTest(false);renderer.setViewport(0,0,renderer.domElement.clientWidth,renderer.domElement.clientHeight);
   renderer.autoClear=autoClear;roots.forEach(function(g,i){g.visible=visible[i];});
   lightSources.forEach(function(light,i){light.visible=lightVisible[i];});
   rows.forEach(function(row){row.rig.visible=false;});
   gizmos.forEach(function(g){g.node.visible=g.visible;});
  }
 }
 function destroy(){rows.forEach(function(row){row.unbind();if(row.bloom)row.bloom.dispose();scene.remove(row.rig);});rows=[];}
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
  var v=view(g),h=g.userData.holder;if(!v||!h||!v.rect.width||!v.rect.height||!Number.isFinite(x)||!Number.isFinite(y))return null;
  v.camera.updateMatrixWorld(true);h.updateWorldMatrix(true,false);
  var origin=h.getWorldPosition(new T.Vector3()),ray=new T.Raycaster();
  ray.setFromCamera(new T.Vector2((x-v.rect.left)/v.rect.width*2-1,1-(y-v.rect.top)/v.rect.height*2),v.camera);
  var hit=ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,0,1),-origin.z),new T.Vector3());
  if(!hit)return null;var z=hit.clone().project(v.camera).z;
  return Number.isFinite(z)&&z>=-1&&z<=1?hit:null;
 }
 function visible(n){for(var p=n;p;p=p.parent)if(!p.visible)return false;return true;}
 function materialVisible(m){return !!m&&(Array.isArray(m)?m.some(materialVisible):m.visible&&m.opacity>0);}
 function pick(candidates,x,y,legacyCamera){
  var W=renderer.domElement.clientWidth,H=renderer.domElement.clientHeight,best=null;
  if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>=W||y>=H)return null;
  var ray=new T.Raycaster(),box=new T.Box3(),part=new T.Box3(),sphere=new T.Sphere(),center=new T.Vector3(),edge=new T.Vector3(),right=new T.Vector3();
  function choose(g,layer,exact,distance,depth){
   if(!best||layer>best.layer||(layer===best.layer&&(exact&&!best.exact||exact===best.exact&&(distance<best.distance||distance===best.distance&&depth<best.depth))))best={g:g,layer:layer,exact:exact,distance:distance,depth:depth};
  }
  candidates.forEach(function(g){
   if(!visible(g))return;
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
 return{connect:connect,owns:owns,render:render,destroy:destroy,view:view,lightPoint:lightPoint,anchorPoint:anchorPoint,pick:pick};
}
window.NAGWEB_CREATE_SPATIAL_RENDERER=createSpatialRenderer;
})();
