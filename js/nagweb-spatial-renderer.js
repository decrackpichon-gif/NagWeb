(function(){
'use strict';
// Rendering adapter only: no scroll reader, progress evaluator or animation clock.
function createSpatialRenderer(T,renderer,scene,objects){
 var rows=[],api=null;
 function connect(cameraAPI,stages){
  destroy();api=cameraAPI;
  (stages||[]).forEach(function(stage){
   var members=objects.filter(function(g){return g.userData.anchorEl&&stage.contains(g.userData.anchorEl);});
   if(!members.length)return;
   var cam=new T.PerspectiveCamera(50,1,.1,100000),row={stage:stage,camera:cam,objects:members,state:null};
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
  var depth=row.state.cssPerspective,unit=2*6*Math.tan(50*Math.PI/360)/Math.max(1,stage.clientHeight);
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
  var autoClear=renderer.autoClear;
  try{
   roots.forEach(function(g,i){if(owns(objects[i])){g.visible=false;visible[i]=false;}});
   legacyRender();
   renderer.autoClear=false;
   rows.forEach(function(row){
    if(!row.state||!row.stage.isConnected)return;
    var r=row.stage.getBoundingClientRect(),W=renderer.domElement.clientWidth,H=renderer.domElement.clientHeight;
    if(r.bottom<=0||r.top>=H||r.right<=0||r.left>=W||!r.width||!r.height)return;
    roots.forEach(function(g){g.visible=false;});
    row.objects.forEach(function(g){place(g,row);visible[objects.indexOf(g)]=g.userData.holder.visible;});
    renderer.setViewport(r.left,H-r.bottom,r.width,r.height);
    renderer.setScissor(Math.max(0,r.left),Math.max(0,H-r.bottom),Math.min(W,r.right)-Math.max(0,r.left),Math.min(H,r.bottom)-Math.max(0,r.top));
    renderer.setScissorTest(true);renderer.clearDepth();renderer.render(scene,row.camera);
   });
  }finally{
   renderer.setScissorTest(false);renderer.setViewport(0,0,renderer.domElement.clientWidth,renderer.domElement.clientHeight);
   renderer.autoClear=autoClear;roots.forEach(function(g,i){g.visible=visible[i];});
  }
 }
 function destroy(){rows.forEach(function(row){row.unbind();});rows=[];}
 return{connect:connect,owns:owns,render:render,destroy:destroy,view:function(g){var row=rows.find(function(r){return r.objects.indexOf(g)>=0;});return row&&row.state?{camera:row.camera,rect:row.stage.getBoundingClientRect()}:null;}};
}
window.NAGWEB_CREATE_SPATIAL_RENDERER=createSpatialRenderer;
})();
