(function(){
'use strict';
// Rendering adapter only: no scroll reader, progress evaluator or animation clock.
function createSpatialRenderer(T,renderer,scene,objects,lightSources,options){
 var rows=[],api=null,inverseStyle=null;options=options||{};
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
   var cam=new T.PerspectiveCamera(50,1,.1,100000),rig=new T.Group(),row={stage:stage,sectionId:sectionId,camera:cam,objects:members,state:null,rig:rig,lights:[],materials:new Map(),occluders:[],inverseLayers:[]};
   lightSources.forEach(function(source,index){
    if(source.userData.sectionId&&source.userData.sectionId!==sectionId)return;
    var copy=source.clone();rig.add(copy);if(copy.target)rig.add(copy.target);
    row.lights.push({source:source,copy:copy,index:index});
   });
   rig.visible=false;scene.add(rig);
   row.unbind=api.bindThreeCamera(stage,cam,function(state){row.state=state;});
   rows.push(row);
   discoverOccluders(row);
   // 2.0: partial WebGL→HTML composition is on by default; pass
   // {inverseOcclusion:false} to keep authored HTML fully in front (fallback).
   if(options.inverseOcclusion!==false&&options.experimentalInverseOcclusion!==false)discoverInverseLayers(row);
  });
 }

 // A depth-only proxy makes fully opaque HTML rectangles occlude WebGL
 // geometry pixel by pixel. The CSS surface keeps rendering its actual text,
 // image, links and focus; no rasterization of the DOM is involved.
 // Deliberately refuse transparency, clipping and transformed ancestry rather
 // than drawing an inaccurate rectangle in front of somebody else's content.

 function cssUnit(value,basis){
  var m=/^(-?(?:\d+(?:\.\d*)?|\.\d+))(px|%)?$/.exec(String(value||'').trim());
  return m?(+m[1])*(m[2]==='%'?basis/100:1):NaN;
 }
 function imagePosition(value){
  var v=String(value||'50% 50%').trim().split(/\s+/);
  if(v.length>2||v.length<1)return null;
  function pos(s,vertical){
   if(s==='center')return .5;if(s===(vertical?'top':'left'))return 0;
   if(s===(vertical?'bottom':'right'))return 1;
   var n=cssUnit(s,1);return /%$/.test(s)&&Number.isFinite(n)?n:NaN;
  }
  var x=pos(v[0],false),y=pos(v[1]||'50%',true);
  return Number.isFinite(x)&&Number.isFinite(y)?[x,y]:null;
 }
 function shapeSpec(node,cs,w,h){
  var names=['borderTopLeftRadius','borderTopRightRadius','borderBottomRightRadius','borderBottomLeftRadius'];
  var fallback=String(cs.borderRadius||'0px').trim().split(/\s+/);
  // CSS corner properties allow elliptical radii; complex shorthand with
  // nontrivial slash syntax is handled by each computed corner instead.
  var corners=[];
  for(var i=0;i<4;i++){
   var raw=cs[names[i]]||fallback[0]||'0px',parts=String(raw).split(/\s+/);
   if(parts.length>2)return null;
   var rx=cssUnit(parts[0],w),ry=cssUnit(parts[1]||parts[0],h);
   if(!Number.isFinite(rx)||!Number.isFinite(ry)||rx<0||ry<0)return null;
   corners.push([rx,ry]);
  }
  var factor=Math.min(1,
   w/Math.max(1e-9,corners[0][0]+corners[1][0]),
   w/Math.max(1e-9,corners[3][0]+corners[2][0]),
   h/Math.max(1e-9,corners[0][1]+corners[3][1]),
   h/Math.max(1e-9,corners[1][1]+corners[2][1]));
  corners.forEach(function(p){p[0]*=factor;p[1]*=factor;});
  var rounded=corners.some(function(p){return p[0]>.01&&p[1]>.01;});
  var rawClip=String(cs.clipPath||'none').trim(),clip=null;
  if(rawClip!=='none'){
   var m;
   if((m=/^inset\((.+)\)$/i.exec(rawClip))){
    var sections=m[1].split(/\s+round\s+/i);
    if(sections.length>2)return null;
    var tokens=sections[0].trim().split(/\s+/);if(tokens.length<1||tokens.length>4)return null;
    var values=tokens.map(function(v,i){return cssUnit(v,i%2===0?h:w);});
    if(values.some(function(v){return !Number.isFinite(v);}))return null;
    var t=values[0],r=values[1]!=null?values[1]:t,b=values[2]!=null?values[2]:t,l=values[3]!=null?values[3]:r;
    var rad=sections[1]?cssUnit(sections[1].trim(),Math.min(w,h)):0;
    if(!Number.isFinite(rad)||rad<0)return null;
    clip={kind:'inset',l:l,t:t,r:w-r,b:h-b,rad:rad};
   }else if((m=/^circle\(([^)]+)\)$/i.exec(rawClip))){
    var vals=m[1].split(/\s+at\s+/i),pts=(vals[1]||'50% 50%').trim().split(/\s+/);
    if(pts.length!==2)return null;
    var radius=cssUnit(vals[0].trim(),Math.sqrt((w*w+h*h)/2)),
       cx=cssUnit(pts[0],w),cy=cssUnit(pts[1],h);
    if([radius,cx,cy].some(function(v){return !Number.isFinite(v)||v<0;}))return null;
    clip={kind:'ellipse',cx:cx,cy:cy,rx:radius,ry:radius};
   }else if((m=/^ellipse\(([^)]+)\)$/i.exec(rawClip))){
    var pieces=m[1].split(/\s+at\s+/i),rr=pieces[0].trim().split(/\s+/),
       pp=(pieces[1]||'50% 50%').trim().split(/\s+/);
    if(rr.length!==2||pp.length!==2)return null;
    var cx=cssUnit(pp[0],w),cy=cssUnit(pp[1],h),rx=cssUnit(rr[0],w),ry=cssUnit(rr[1],h);
    if([cx,cy,rx,ry].some(function(v){return !Number.isFinite(v)||v<0;}))return null;
    clip={kind:'ellipse',cx:cx,cy:cy,rx:rx,ry:ry};
   }else return null;
  }
  return{corners:corners,rounded:rounded,clip:clip};
 }
 function roundedPath(ctx,l,t,r,b,c){
  var sx=r-l,sy=b-t,tl=c[0],tr=c[1],br=c[2],bl=c[3];
  function curve(x,y,rx,ry,a,b){
   if(rx>.001&&ry>.001)ctx.ellipse(x,y,rx,ry,0,a,b);
   else ctx.lineTo(x+rx*Math.cos(b),y+ry*Math.sin(b));
  }
  ctx.beginPath();ctx.moveTo(l+tl[0],t);ctx.lineTo(r-tr[0],t);
  curve(r-tr[0],t+tr[1],tr[0],tr[1],-Math.PI/2,0);
  ctx.lineTo(r,b-br[1]);curve(r-br[0],b-br[1],br[0],br[1],0,Math.PI/2);
  ctx.lineTo(l+bl[0],b);curve(l+bl[0],b-bl[1],bl[0],bl[1],Math.PI/2,Math.PI);
  ctx.lineTo(l,t+tl[1]);curve(l+tl[0],t+tl[1],tl[0],tl[1],Math.PI,Math.PI*1.5);
  ctx.closePath();
 }
 function safeImage(node){
  var img=node&&node.tagName==='IMG'?node:null;
  if(!img&&node&&node.children&&node.children.length===1&&node.children[0].tagName==='IMG'){
   img=node.children[0];
   if(Math.abs(img.offsetLeft)>1||Math.abs(img.offsetTop)>1||
      Math.abs(img.offsetWidth-node.offsetWidth)>1||Math.abs(img.offsetHeight-node.offsetHeight)>1)return null;
  }
  if(!img||!img.style||img.style.transform&&img.style.transform!=='none')return null;
  var cs=window.getComputedStyle(img);
  if(!cs||cs.opacity!=='1'||cs.visibility==='hidden'||cs.display==='none'||
     cs.filter&&cs.filter!=='none'&&!/^(?:blur\(0(?:px)?\)\s*)+$/.test(cs.filter))return null;
  var fit=cs.objectFit||'fill',position=imagePosition(cs.objectPosition);
  if(['fill','cover','contain'].indexOf(fit)<0||!position)return null;
  var shape=shapeSpec(img,cs,img.offsetWidth,img.offsetHeight);
  if(!shape||cs.maskImage&&cs.maskImage!=='none'||cs.mixBlendMode&&cs.mixBlendMode!=='normal')return null;
  var src=img.currentSrc||img.src||'';
  if(!/^data:image\/(?:png|webp|svg\+xml|jpeg)[;,]/i.test(src)&&!/^blob:/i.test(src))return null;
  return {img:img,src:src,jpeg:/^data:image\/jpeg[;,]/i.test(src),fit:fit,position:position,shape:shape};
 }
 function surfaceKind(node){
  if(!node||!node.style||!node.offsetWidth||!node.offsetHeight||
     node.style.transform&&node.style.transform!=='none'||!window.getComputedStyle)return null;
  var cs=window.getComputedStyle(node);
  if(!cs||cs.visibility==='hidden'||cs.display==='none'||cs.opacity!=='1')return null;
  if(cs.maskImage&&cs.maskImage!=='none'||
     cs.filter&&cs.filter!=='none'&&!/^(?:blur\(0(?:px)?\)\s*)+$/.test(cs.filter)||
     cs.mixBlendMode&&cs.mixBlendMode!=='normal')return null;
  var shape=shapeSpec(node,cs,node.offsetWidth,node.offsetHeight);
  if(!shape)return null;
  var color=cs.backgroundColor||'',opaque=/^rgb\(/i.test(color);
  if(/^rgba\(/i.test(color)){var parts=color.match(/[\d.]+/g);opaque=!!parts&&parts.length>=4&&+parts[3]>=.999;}
  if(opaque)return{kind:'opaque',shape:shape};
  var candidate=safeImage(node);
  if(!candidate)return null;
  return candidate.jpeg&&candidate.fit==='fill'&&!candidate.shape.rounded&&!candidate.shape.clip?
   {kind:'opaque',shape:shape}:{kind:'image',img:candidate.img,src:candidate.src,fit:candidate.fit,position:candidate.position,shape:shape,imgShape:candidate.shape};
 }
 function makeMask(surface,w,h){
  if(typeof document==='undefined')return null;
  var max=Math.max(w,h),factor=Math.min(1,1024/max),can=document.createElement('canvas');
  can.width=Math.max(1,Math.round(w*factor));can.height=Math.max(1,Math.round(h*factor));
  var ctx=can.getContext('2d');if(!ctx)return null;
  ctx.scale(can.width/w,can.height/h);
  ctx.fillStyle='#fff';
  if(surface.kind==='image'){
   var img=surface.img,iw=img.naturalWidth,ih=img.naturalHeight;
   if(!iw||!ih)return null;
   var sx=surface.fit==='cover'?Math.max(w/iw,h/ih):surface.fit==='contain'?Math.min(w/iw,h/ih):0;
   var dw=sx?iw*sx:w,dh=sx?ih*sx:h;
   var dx=(w-dw)*surface.position[0],dy=(h-dh)*surface.position[1];
   ctx.drawImage(img,dx,dy,dw,dh);
   ctx.globalCompositeOperation='source-in';ctx.fillRect(0,0,w,h);
  }else ctx.fillRect(0,0,w,h);
  function intersect(shape){
   if(!shape)return;
   if(shape.rounded){
    ctx.globalCompositeOperation='destination-in';roundedPath(ctx,0,0,w,h,shape.corners);ctx.fill();
   }
   if(shape.clip){
    var clip=shape.clip;ctx.globalCompositeOperation='destination-in';ctx.beginPath();
    if(clip.kind==='ellipse')ctx.ellipse(clip.cx,clip.cy,Math.max(.00001,clip.rx),Math.max(.00001,clip.ry),0,0,Math.PI*2);
    else if(clip.rad>0){
     var rad=Math.min(clip.rad,Math.max(0,(clip.r-clip.l)/2),Math.max(0,(clip.b-clip.t)/2));
     roundedPath(ctx,clip.l,clip.t,clip.r,clip.b,[[rad,rad],[rad,rad],[rad,rad],[rad,rad]]);
    }else ctx.rect(clip.l,clip.t,clip.r-clip.l,clip.b-clip.t);
    ctx.fill();
   }
  }
  intersect(surface.shape);
  if(surface.kind==='image')intersect(surface.imgShape);
  var tex=new T.CanvasTexture(can);tex.generateMipmaps=false;tex.minFilter=T.LinearFilter;tex.magFilter=T.LinearFilter;
  tex.needsUpdate=true;return tex;
 }
 // Nested depth surfaces use the same affine ancestry bridge as WebGL
 // objects. Refuse flattening, clipping and semi-transparent containers,
 // which cannot be represented by an independent quad with correct depth.
 function depthParentUsable(node,world){
  var parent=node.parentElement,count=0;
  while(parent&&parent!==world&&count++<8){
   if(!parent.classList||!parent.classList.contains('container-box'))return false;
   var cs=window.getComputedStyle(parent);
   if(!cs||cs.display==='none'||cs.visibility==='hidden'||
      !Number.isFinite(+cs.opacity)||+cs.opacity<.999||
      cs.transformStyle!=='preserve-3d'||
      cs.overflowX&&cs.overflowX!=='visible'||
      cs.overflowY&&cs.overflowY!=='visible'||
      cs.clipPath&&cs.clipPath!=='none'||
      cs.maskImage&&cs.maskImage!=='none'||
      cs.filter&&cs.filter!=='none'&&!/^(?:blur\(0(?:px)?\)\s*)+$/.test(cs.filter)||
      cs.mixBlendMode&&cs.mixBlendMode!=='normal')return false;
   parent=parent.parentElement;
  }
  return parent===world;
 }
 function discoverOccluders(row){
  if(typeof row.stage.querySelectorAll!=='function')return;
  var world=row.stage.querySelector('[data-nw-camera-world]');
  if(!world)return;
  Array.from(row.stage.querySelectorAll('[data-nw-sd-el]')).forEach(function(node){
   var nested=node.parentElement!==world;
   if(nested&&!depthParentUsable(node,world))return;
   if(!surfaceKind(node))return;
   var mat=new T.MeshBasicMaterial({colorWrite:false,depthWrite:true,depthTest:true,side:T.DoubleSide});
   var mesh=new T.Mesh(new T.PlaneGeometry(1,1),mat);
   mesh.visible=false;mesh.renderOrder=-1000;mesh.frustumCulled=false;scene.add(mesh);
   row.occluders.push({node:node,world:world,nested:nested,mesh:mesh,texture:null,source:null});
  });
 }

 // Inverse composition uses the same opaque geometry and camera as the color
 // pass. A depth texture is sampled in each HTML plane's local coordinates.
 // The resulting clip preserves real DOM and browser hit testing; there is no
 // sparse-ray whole-element guess, second clock, or first-N layer cutoff.
 function discoverInverseLayers(row){
  if(typeof row.stage.querySelectorAll!=='function')return;
  var world=row.stage.querySelector('[data-nw-camera-world]');if(!world)return;
  Array.from(row.stage.querySelectorAll('[data-nw-sd-el]')).forEach(function(node){
   if(!node||!node.style||!node.offsetWidth||!node.offsetHeight||
      row.objects.some(function(g){return g.userData.anchorEl===node;})||
      node.style.transform&&node.style.transform!=='none'||
      node.classList&&node.classList.contains('container-box'))return;
   var nested=node.parentElement!==world;
   if(nested&&!depthParentUsable(node,world))return;
   row.inverseLayers.push({node:node,world:world,nested:nested,quad:new T.Object3D(),
    clip:node.style.getPropertyValue?node.style.getPropertyValue('clip-path'):'',
    priority:node.style.getPropertyPriority?node.style.getPropertyPriority('clip-path'):'',key:null,path:null});
  });
  if(!row.inverseLayers.length||inverseStyle||typeof document==='undefined'||!document.head)return;
  inverseStyle=document.createElement('style');
  inverseStyle.textContent='.nw-spatial-inverse-occluded{visibility:hidden!important;pointer-events:none!important}';
  document.head.appendChild(inverseStyle);
 }
 function resetInverse(row){
  row.inverseLayers.forEach(function(q){
   if(q.node.classList)q.node.classList.remove('nw-spatial-inverse-occluded');
   if(q.applied&&q.node.style.setProperty){
    if(q.clip)q.node.style.setProperty('clip-path',q.clip,q.priority);
    else q.node.style.removeProperty('clip-path');
   }
   q.applied=false;
  });
 }
 function inverseResources(row){
  if(row.inverseGPU)return row.inverseGPU;
  if(!renderer.readRenderTargetPixels||!renderer.getRenderTarget)return null;
  var depth=new T.WebGLRenderTarget(1,1,{minFilter:T.NearestFilter,magFilter:T.NearestFilter}),
    mask=new T.WebGLRenderTarget(1,1,{minFilter:T.NearestFilter,magFilter:T.NearestFilter,depthBuffer:false}),
    geometry=new T.PlaneGeometry(2,2),material=new T.ShaderMaterial({
     uniforms:{depthMap:{value:depth.texture},clipMatrix:{value:new T.Matrix4()},nearFar:{value:new T.Vector2(.1,100000)}},
     vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
     fragmentShader:'\n#include <packing>\nvarying vec2 vUv;uniform sampler2D depthMap;uniform mat4 clipMatrix;uniform vec2 nearFar;void main(){vec4 c=clipMatrix*vec4(vUv-.5,0.,1.);vec3 p=c.xyz/c.w;float visible=1.;if(c.w>0.&&abs(p.x)<=1.&&abs(p.y)<=1.&&abs(p.z)<=1.){float d=unpackRGBAToDepth(texture2D(depthMap,p.xy*.5+.5));float front=-perspectiveDepthToViewZ(d,nearFar.x,nearFar.y);float plane=-perspectiveDepthToViewZ(p.z*.5+.5,nearFar.x,nearFar.y);if(front+.5<plane)visible=0.;}gl_FragColor=vec4(vec3(visible),1.);}',
     depthTest:false,depthWrite:false,blending:T.NoBlending});
  var gpu={depth:depth,mask:mask,geometry:geometry,material:material,quad:new T.Mesh(geometry,material),
   camera:new T.Camera(),scene:new T.Scene(),proxies:new Map(),key:null,reads:0,pixels:0};
  row.inverseGPU=gpu;return gpu;
 }
 function disposeInverse(row){
  resetInverse(row);var gpu=row.inverseGPU;if(!gpu)return;
  gpu.depth.dispose();gpu.mask.dispose();gpu.geometry.dispose();gpu.material.dispose();
  gpu.proxies.forEach(function(p){p.material.dispose();});gpu.proxies.clear();row.inverseGPU=null;
  row.inverseLayers.forEach(function(q){q.key=null;q.path=null;});
 }
 function fullInverseOcclusion(row){
  if(!row.state||!row.inverseLayers.length||row.inverseFailed)return;
  var gpu=inverseResources(row);if(!gpu)return;
  var solids=[],keyParts=[];
  row.objects.forEach(function(g){
   if(!g.userData.holder||!g.userData.holder.visible||g.userData.spatialOpacity<.999)return;
   // place() changed the holder since the preceding render. Ray/pixel queries
   // must consume this pose immediately, including every descendant GLB mesh.
   g.userData.holder.updateWorldMatrix(true,true);
   g.traverseVisible(function(m){
    if(!m.isMesh||m.isSkinnedMesh||m.morphTargetInfluences&&m.morphTargetInfluences.length||!m.geometry||!m.material||!m.layers.test(row.camera.layers))return;
    var mats=Array.isArray(m.material)?m.material:[m.material];
    if(mats.some(function(mat){return !mat||!mat.visible||mat.transparent&&!(+mat.alphaTest>0)||+mat.opacity<.999||mat.alphaMap&&!(+mat.alphaTest>0)||mat.displacementMap||mat.wireframe||mat.clippingPlanes&&mat.clippingPlanes.length||mat.isShaderMaterial;}))return;
    var side=mats[0].side;
    if(mats.some(function(mat){return mat.side!==side;}))return;
    var proxy=gpu.proxies.get(m);
    if(!proxy){proxy=new T.Mesh(m.geometry,new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,side:side}));proxy.matrixAutoUpdate=false;gpu.proxies.set(m,proxy);gpu.scene.add(proxy);}
    proxy.geometry=m.geometry;if(proxy.material.side!==side){proxy.material.side=side;proxy.material.needsUpdate=true;}
    // Cutout (glTF MASK / alphaTest) surfaces keep their holes in the depth pass,
    // so HTML behind a hole stays visible. Blended (BLEND) surfaces never occlude.
    var cut=mats.find(function(mat){return +mat.alphaTest>0;}),dm=proxy.material,wantMap=cut?cut.map||null:null,wantAlphaMap=cut?cut.alphaMap||null:null,wantTest=cut?+cut.alphaTest:0;
    if(dm.map!==wantMap||dm.alphaMap!==wantAlphaMap||dm.alphaTest!==wantTest){dm.map=wantMap;dm.alphaMap=wantAlphaMap;dm.alphaTest=wantTest;dm.needsUpdate=true;}proxy.matrix.copy(m.matrixWorld);proxy.visible=true;
    solids.push(m);
    keyParts.push(m.uuid,side,m.geometry.uuid,m.geometry.attributes.position&&m.geometry.attributes.position.version,m.geometry.index&&m.geometry.index.version,m.geometry.drawRange.start,m.geometry.drawRange.count,m.matrixWorld.elements.join(','));
   });
  });
  gpu.proxies.forEach(function(p,m){p.visible=solids.indexOf(m)>=0;});
  if(!solids.length)return;
  row.camera.updateMatrixWorld(true);
  var w=Math.max(1,row.stage.clientWidth),h=Math.max(1,row.stage.clientHeight),factor=Math.min(1,1024/Math.max(w,h)),dw=Math.max(1,Math.round(w*factor)),dh=Math.max(1,Math.round(h*factor)),
    viewProjection=new T.Matrix4().multiplyMatrices(row.camera.projectionMatrix,row.camera.matrixWorldInverse);
  keyParts.push(dw,dh,viewProjection.elements.join(','));var depthKey=keyParts.join('|');
  var state={target:renderer.getRenderTarget(),viewport:renderer.getViewport(new T.Vector4()),scissor:renderer.getScissor(new T.Vector4()),scissorTest:renderer.getScissorTest(),autoClear:renderer.autoClear,color:renderer.getClearColor(new T.Color()),alpha:renderer.getClearAlpha()};
  try{
   renderer.autoClear=true;renderer.setScissorTest(false);
   if(gpu.key!==depthKey){
    gpu.depth.setSize(dw,dh);renderer.setRenderTarget(gpu.depth);renderer.setClearColor(0xffffff,1);renderer.clear();renderer.render(gpu.scene,row.camera);gpu.key=depthKey;
   }
   gpu.material.uniforms.nearFar.value.set(row.camera.near,row.camera.far);
   var sharedMasks=new Map();
   row.inverseLayers.forEach(function(q){
    var node=q.node,pose=node.__nwSpatialPose,cs=window.getComputedStyle(node);
    if(!node.isConnected||!pose||+pose.opacity<=0||cs.display==='none'||cs.visibility==='hidden'||
       cs.clipPath&&cs.clipPath!=='none'||cs.maskImage&&cs.maskImage!=='none'||
       node.style.transform&&node.style.transform!=='none'||!Number.isFinite(+pose.z)||!Number.isFinite(+pose.scale)||+pose.scale<=0||!placeDepthQuad(row,q,pose,q.quad))return;
    q.quad.updateMatrixWorld(true);
    var nw=node.offsetWidth,nh=node.offsetHeight,mf=Math.min(1,256/Math.max(nw,nh)),mw=Math.max(1,Math.ceil(nw*mf)),mh=Math.max(1,Math.ceil(nh*mf)),
      matrix=new T.Matrix4().multiplyMatrices(viewProjection,q.quad.matrixWorld),key=depthKey+'|'+matrix.elements.join(',')+'|'+nw+','+nh;
    var shared=sharedMasks.get(key);if(shared){q.key=key;q.hidden=shared.hidden;q.path=shared.path;}
    if(q.key!==key){
     gpu.mask.setSize(mw,mh);gpu.material.uniforms.clipMatrix.value.copy(matrix);
     renderer.setRenderTarget(gpu.mask);renderer.setClearColor(0xffffff,1);renderer.clear();renderer.render(gpu.quad,gpu.camera);
     var pixels=new Uint8Array(mw*mh*4);renderer.readRenderTargetPixels(gpu.mask,0,0,mw,mh,pixels);gpu.reads++;gpu.pixels+=mw*mh;
     // Merge identical spans vertically: clip-path respects hit testing as well
     // as painting, unlike a CSS mask-image. Pixel precision is bounded explicitly.
     var path=[],active=new Map(),count=0;
     function emit(r){var x=r.x*nw/mw,y=r.y*nh/mh,rw=r.w*nw/mw,rh=r.h*nh/mh;path.push('M'+x.toFixed(3)+' '+y.toFixed(3)+'h'+rw.toFixed(3)+'v'+rh.toFixed(3)+'h'+(-rw).toFixed(3)+'z');}
     for(var y=0;y<mh;y++){
      var next=new Map(),x=0;
      while(x<mw){if(pixels[((mh-1-y)*mw+x)*4]<128){x++;continue;}var start=x;
       while(x<mw&&pixels[((mh-1-y)*mw+x)*4]>=128){count++;x++;}
       var id=start+':'+x,r=active.get(id)||{x:start,y:y,w:x-start,h:0};r.h++;next.set(id,r);
      }
      active.forEach(function(r,id){if(!next.has(id))emit(r);});active=next;
     }
     active.forEach(emit);q.hidden=count===0;q.path=count===mw*mh?null:'path("'+path.join('')+'")';q.key=key;
    }
    sharedMasks.set(key,{hidden:q.hidden,path:q.path});
    if(q.hidden){node.classList.add('nw-spatial-inverse-occluded');}
    else if(q.path){node.style.setProperty('clip-path',q.path,'important');q.applied=true;}
   });
  }catch(error){
   // Fail visibly open, release resources, and retry only after reconnect.
   disposeInverse(row);row.inverseFailed=true;
   if(typeof console!=='undefined')console.warn('NagWeb: partial occlusion unavailable',error);
  }finally{
   renderer.setRenderTarget(state.target);renderer.setViewport(state.viewport);renderer.setScissor(state.scissor);renderer.setScissorTest(state.scissorTest);renderer.setClearColor(state.color,state.alpha);renderer.autoClear=state.autoClear;
  }
 }

 function updateOccluders(row){
  row.occluders.forEach(function(o){
   var node=o.node,mesh=o.mesh,pose=node.__nwSpatialPose;
   mesh.visible=false;
   var surface=surfaceKind(node);
   if(!row.state||!node.isConnected||!surface||!pose||
      !Number.isFinite(+pose.z)||!Number.isFinite(+pose.scale)||
      +pose.scale<=0||!Number.isFinite(+pose.opacity)||+pose.opacity<.999)return;
   if(surface.kind==='image'&&(!surface.img.complete||!surface.img.naturalWidth||!surface.img.naturalHeight))return;
   var w=node.offsetWidth,h=node.offsetHeight,shape=surface.shape;
   var needsMask=shape.rounded||!!shape.clip||surface.kind==='image'&&
     (surface.fit!=='fill'||surface.imgShape.rounded||!!surface.imgShape.clip);
   var key=JSON.stringify({type:surface.kind,src:surface.src||'',w:w,h:h,
     shape:shape,imgShape:surface.imgShape,fit:surface.fit,position:surface.position});
   if(o.source!==key||o.image!==surface.img){
    var next=null;
    if(needsMask)next=makeMask(surface,w,h);
    else if(surface.kind==='image'){next=new T.Texture(surface.img);next.needsUpdate=true;}
    if((needsMask||surface.kind==='image')&&!next)return;
    if(o.texture)o.texture.dispose();
    o.texture=next;o.source=key;o.image=surface.img||null;
    mesh.material.map=needsMask?null:next;
    mesh.material.alphaMap=needsMask?next:null;
    mesh.material.alphaTest=next?.08:0;
    mesh.material.needsUpdate=true;
   }
   if(!placeDepthQuad(row,o,pose,mesh))return;
   mesh.visible=true;
  });
 }

 function placeDepthQuad(row,o,pose,quad){
  var node=o.node;
  if(!node||!node.offsetWidth||!node.offsetHeight)return false;
   var world=o.world,w=node.offsetWidth,h=node.offsetHeight,mesh=quad;
   // Authored NagWeb elements already carry CSS centering, origin, hover and
   // the Director's paused additive transform. Read that evaluated matrix once
   // through the existing hierarchy bridge rather than adding the pose twice.
   if(window.DOMMatrix&&node.classList&&node.classList.contains('el')&&node.style.getPropertyValue&&node.style.getPropertyValue('--nw-sd-scale')!==''){
    if(o.nested&&!depthParentUsable(node,world))return false;
    var css=parentSpace({userData:{anchorEl:node}},row,true,true);
    if(!css||css.opacity<=0||Math.abs(css.matrix.determinant())<1e-10)return false;
    mesh.matrixAutoUpdate=false;
    mesh.matrix.copy(css.matrix).multiply(new T.Matrix4().makeTranslation(w/2,-h/2,0)).multiply(new T.Matrix4().makeScale(w,h,1));
    mesh.matrix.decompose(mesh.position,mesh.quaternion,mesh.scale);mesh.matrixWorldNeedsUpdate=true;return true;
   }

   var rotation=new T.Euler(-(+pose.rotateX||0)*Math.PI/180,(+pose.rotateY||0)*Math.PI/180,
     -(+pose.rotate||0)*Math.PI/180,'ZXY'),scale=pose.scale/100;
   if(o.nested){
    if(!depthParentUsable(node,world))return;
    // parentSpace is the existing CSS-to-Three matrix bridge. No second
    // hierarchy parser and no change to the Director's evaluation clock.
    var parent=parentSpace({userData:{anchorEl:node}},row,true);
    if(!parent||parent.opacity<.999||Math.abs(parent.matrix.determinant())<1e-10)return;
    var host=node.offsetParent||node.parentElement;
    var local=new T.Matrix4().compose(new T.Vector3(
      node.offsetLeft+(host&&host.clientLeft||0)-(host&&host.scrollLeft||0)+w/2+(+pose.x||0),
      -node.offsetTop-(host&&host.clientTop||0)+(host&&host.scrollTop||0)-h/2-(+pose.y||0),
      +pose.z),new T.Quaternion().setFromEuler(rotation),new T.Vector3(w*scale,h*scale,1));
    mesh.matrixAutoUpdate=false;
    mesh.matrix.copy(parent.matrix).multiply(local);
    mesh.matrix.decompose(mesh.position,mesh.quaternion,mesh.scale);
    mesh.matrixWorldNeedsUpdate=true;
   }else{
    // Match the shared .inner offset convention used by spatial 3D anchors.
    var offset={x:(world.offsetLeft||0)+(row.stage.clientLeft||0),
      y:(world.offsetTop||0)+(row.stage.clientTop||0)};
    var x=node.offsetLeft+offset.x+(world.clientLeft||0)-(world.scrollLeft||0)+w/2;
    var y=node.offsetTop+offset.y+(world.clientTop||0)-(world.scrollTop||0)+h/2;
    mesh.position.set(x-row.stage.clientWidth/2+(+pose.x||0),
      row.stage.clientHeight/2-y-(+pose.y||0),-row.state.cssPerspective+pose.z);
    mesh.rotation.copy(rotation);
    mesh.scale.set(w*scale,h*scale,1);
   }
   return true;
 }

 function owns(g){return rows.some(function(row){return row.objects.indexOf(g)>=0;});}
 function worldOffset(node,row){
  var world=node.closest&&node.closest('[data-nw-camera-world]');
  return {world:world,x:world?(world.offsetLeft||0)+(row.stage.clientLeft||0):0,y:world?(world.offsetTop||0)+(row.stage.clientTop||0):0};
 }
 function parentSpace(g,row,force,includeSelf){
  var node=g.userData.anchorEl;
  if(!force&&(!node.hasAttribute||!node.hasAttribute('data-nw-spatial-parent')))return null;
  var chain=[],n=includeSelf?node:node.parentElement,world=node.closest('[data-nw-camera-world]');
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
 // Static object placement composes with the Director's animated pose.
 // It is not a new animation track: keyframed rotate/scale still come from Director.
 function baseSpatialTransform(g){
  var o=g.userData.o||{},tmp=g.userData.nwPreviewBaseTransform||{};
  function value(key,fallback,min,max){
   var v=Object.prototype.hasOwnProperty.call(tmp,key)?tmp[key]:o['nwSpatial'+key];
   return v!=null&&v!==''&&Number.isFinite(+v)?Math.max(min,Math.min(max,+v)):fallback;
  }
  return {rotateX:value('RotateX',0,-3600,3600),rotateY:value('RotateY',0,-3600,3600),scale:value('Scale',100,10,500)};
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
  var depth=row.state.cssPerspective,unit=1/units(row),base=baseSpatialTransform(g);
  // Editor-only temporary depth: the authored o.offZ stays immutable.
  var offZ=Object.prototype.hasOwnProperty.call(g.userData,'nwPreviewOffZ')?g.userData.nwPreviewOffZ:(o.offZ||0);
  if(parent){
   var rotation=new T.Quaternion().setFromEuler(new T.Euler(-(pose.rotateX+base.rotateX)*Math.PI/180,(pose.rotateY+base.rotateY)*Math.PI/180,-pose.rotate*Math.PI/180,'ZXY'));
   var host=node.offsetParent,local=new T.Matrix4().compose(new T.Vector3(node.offsetLeft+(host.clientLeft||0)-(host.scrollLeft||0)+pose.x,-node.offsetTop-(host.clientTop||0)+(host.scrollTop||0)-pose.y,offZ/unit+pose.z),rotation,new T.Vector3(1,1,1).multiplyScalar(width/2/g.userData.nativeR*pose.scale/100*base.scale/100));
   h.matrixAutoUpdate=false;h.matrix.copy(parent.matrix).multiply(local);h.matrix.decompose(h.position,h.quaternion,h.scale);h.matrixWorldNeedsUpdate=true;
   g.userData.spatialParent=parent.matrix;return;
  }
  h.matrixAutoUpdate=true;delete g.userData.spatialParent;
  // offsetLeft/Top are relative to .inner's padding edge, not the stage.
  // Its layout offset and border/scroll remain independent of camera motion.
  var offset=worldOffset(node,row),host=offset.world;
  var x=node.offsetLeft+offset.x+(host&&host.clientLeft||0)-(host&&host.scrollLeft||0),y=node.offsetTop+offset.y+(host&&host.clientTop||0)-(host&&host.scrollTop||0);
  h.position.set(x-stage.clientWidth/2+pose.x,stage.clientHeight/2-y-pose.y,-depth+offZ/unit+pose.z);
  h.scale.setScalar(width/2/g.userData.nativeR*pose.scale/100*base.scale/100);
  // CSS y points down; local positive z points toward the viewer. Individual
  // rotate precedes the additive rotateX/rotateY transform (ZXY order).
  h.rotation.set(-(pose.rotateX+base.rotateX)*Math.PI/180,(pose.rotateY+base.rotateY)*Math.PI/180,-pose.rotate*Math.PI/180,'ZXY');
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
   rows.forEach(function(row){row.occluders.forEach(function(o){o.mesh.visible=false;});});
   roots.forEach(function(g,i){if(owns(objects[i])){g.visible=false;visible[i]=false;}});
   gizmos.forEach(function(g){g.node.visible=false;});
   legacyRender();
   renderer.autoClear=false;
   lightSources.forEach(function(light){light.visible=false;});
   rows.forEach(function(row){
    if(!row.state||!row.stage.isConnected){if(row.bloom){row.bloom.dispose();row.bloom=null;}disposeInverse(row);return;}
    var r=row.stage.getBoundingClientRect(),W=renderer.domElement.clientWidth,H=renderer.domElement.clientHeight;
    if(r.bottom<=0||r.top>=H||r.right<=0||r.left>=W||!r.width||!r.height){if(row.bloom){row.bloom.dispose();row.bloom=null;}disposeInverse(row);return;}
    rows.forEach(function(other){other.rig.visible=false;other.occluders.forEach(function(o){o.mesh.visible=false;});});
    syncLights(row,lightVisible);row.rig.visible=true;
    roots.forEach(function(g){g.visible=false;});
    row.objects.forEach(function(g){place(g,row);visible[objects.indexOf(g)]=g.userData.holder.visible;});
    resetInverse(row);
    updateOccluders(row);
    if(row.inverseLayers.length)fullInverseOcclusion(row);
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
   rows.forEach(function(row){row.rig.visible=false;row.occluders.forEach(function(o){o.mesh.visible=false;});});
   gizmos.forEach(function(g){g.node.visible=g.visible;});
  }
 }
 function destroy(){rows.forEach(function(row){disposeInverse(row);row.inverseLayers.forEach(function(q){if(q.node.classList)q.node.classList.remove('nw-spatial-inverse-occluded');});row.occluders.forEach(function(o){scene.remove(o.mesh);if(o.texture)o.texture.dispose();o.mesh.geometry.dispose();o.mesh.material.dispose();});row.unbind();row.objects.forEach(function(g){delete g.userData.nwPreviewOffZ;delete g.userData.nwPreviewBaseTransform;});if(row.bloom)row.bloom.dispose();row.materials.forEach(function(copies){copies.forEach(function(m){m.dispose();});});row.objects.forEach(function(g){delete g.userData.spatialOpacity;delete g.userData.spatialParent;g.userData.holder.matrixAutoUpdate=true;g.userData.holder.rotation.x=0;g.userData.holder.rotation.y=0;});scene.remove(row.rig);});rows=[];if(inverseStyle){if(inverseStyle.parentNode)inverseStyle.parentNode.removeChild(inverseStyle);inverseStyle=null;}}
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
 // Exact mesh intersection, separate from the generous drag-picking fallback.
 function surfacePoint(id,x,y,sectionId){
  if(typeof id!=='string'||!id||!Number.isFinite(x)||!Number.isFinite(y))return null;
  var best=null,ray=new T.Raycaster();
  rows.forEach(function(row,layer){
   if(!row.state||!row.stage.isConnected||sectionId&&row.sectionId!==sectionId)return;
   var r=row.stage.getBoundingClientRect(),W=renderer.domElement.clientWidth,H=renderer.domElement.clientHeight;
   if(!r.width||!r.height||x<Math.max(0,r.left)||y<Math.max(0,r.top)||x>=Math.min(W,r.right)||y>=Math.min(H,r.bottom))return;
   row.camera.updateMatrixWorld(true);
   ray.setFromCamera(new T.Vector2((x-r.left)/r.width*2-1,1-(y-r.top)/r.height*2),row.camera);
   row.objects.forEach(function(g){
    if(String(g.userData.o&&g.userData.o.id)!==id||!interactive(g))return;
    g.updateWorldMatrix(true,true);
    var hit=ray.intersectObject(g,true).find(function(h){
     var m=h.object.material;if(Array.isArray(m))m=m[h.face?h.face.materialIndex:0];
     var z=h.point.clone().project(row.camera).z;return visible(h.object)&&materialVisible(m)&&z>=-1&&z<=1;
    });
    if(hit&&(!best||layer>best.layer||layer===best.layer&&hit.distance<best.distance)){
     best={layer:layer,distance:hit.distance,point:{x:hit.point.x,y:hit.point.y,z:hit.point.z},scale:row.state.scale};
    }
   });
  });
  return best&&Number.isFinite(best.scale)&&best.scale>0?{id:id,point:best.point,scale:best.scale}:null;
 }
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
 // Set/restore the preview override only in the matching stage. No project
 // writes and no timer: the existing render loop consumes the next value.
 function previewDepth(id,value,sectionId,commit){
  if(typeof id!=='string'||!id||typeof sectionId!=='string'||!sectionId||value!==null&&(!Number.isFinite(value)||Math.abs(value)>100)||commit&&value===null)return false;
  var matching=[];
  rows.forEach(function(row){
   if(row.sectionId!==sectionId||!row.stage.isConnected||!row.state)return;
   row.objects.forEach(function(g){if(g.userData.o&&String(g.userData.o.id)===id)matching.push(g);});
  });
  if(!matching.length)return false;
  matching.forEach(function(g){
   if(commit){
    // The iframe holds a generated copy: promote the confirmed depth in place.
    // This removes the transient override without a one-frame visual snap.
    g.userData.o.offZ=value;
    delete g.userData.nwPreviewOffZ;
   }else if(value===null)delete g.userData.nwPreviewOffZ;else g.userData.nwPreviewOffZ=value;
  });
  return true;
 }
 // Only the editor explicitly calls this same-origin API for the selected 3D model.
 function previewBaseTransform(id,axis,value,sectionId,commit){
  var bounds={RotateX:[-3600,3600],RotateY:[-3600,3600],Scale:[10,500]};
  if(typeof id!=='string'||!id||typeof sectionId!=='string'||!sectionId||!Object.prototype.hasOwnProperty.call(bounds,axis)||
   value!==null&&(!Number.isFinite(value)||value<bounds[axis][0]||value>bounds[axis][1])||commit&&value===null)return false;
  var matches=[];
  rows.forEach(function(row){
   if(row.sectionId!==sectionId||!row.stage.isConnected||!row.state)return;
   row.objects.forEach(function(g){if(g.userData.o&&String(g.userData.o.id)===id)matches.push(g);});
  });
  if(!matches.length)return false;
  matches.forEach(function(g){
   var tmp=g.userData.nwPreviewBaseTransform||(g.userData.nwPreviewBaseTransform={});
   if(commit){
    // The iframe's model is independent of the editor's saved project.
    // Promote the previewed value atomically, preventing a one-frame snap.
    g.userData.o['nwSpatial'+axis]=value;
    delete tmp[axis];
   }else if(value===null)delete tmp[axis];else tmp[axis]=value;
   if(!Object.keys(tmp).length)delete g.userData.nwPreviewBaseTransform;
  });
  return true;
 }
 // 3D pivot projected into the corresponding stage, not a bounding-box guess.
 function screenPoint(id,sectionId){
  if(typeof id!=='string'||!id||typeof sectionId!=='string'||!sectionId)return null;
  for(var i=rows.length-1;i>=0;i--){
   var row=rows[i];if(row.sectionId!==sectionId||!row.stage.isConnected||!row.state)continue;
   var r=row.stage.getBoundingClientRect();if(!r.width||!r.height)continue;
   var g=row.objects.find(function(o){return o.userData.o&&String(o.userData.o.id)===id;});
   if(!g||!interactive(g)||!g.userData.holder)return null;
   row.camera.updateMatrixWorld(true);g.userData.holder.updateWorldMatrix(true,false);
   var pos=g.userData.holder.getWorldPosition(new T.Vector3()).project(row.camera);
   if(!Number.isFinite(pos.x)||!Number.isFinite(pos.y)||!Number.isFinite(pos.z)||pos.z<-1||pos.z>1)return null;
   var x=(pos.x*.5+.5)*r.width,y=(-pos.y*.5+.5)*r.height;
   return x>=0&&y>=0&&x<r.width&&y<r.height?{x:x,y:y}:null;
  }
  return null;
 }
 var adapter={connect:connect,owns:owns,render:render,destroy:destroy,view:view,lightPoint:lightPoint,anchorPoint:anchorPoint,pick:pick,interactive:interactive,surfacePoint:surfacePoint,previewDepth:previewDepth,previewBaseTransform:previewBaseTransform,screenPoint:screenPoint};
 // Same-origin editor-only request, no automatic pointer listeners in exports.
 window.NAGWEB_SPATIAL_SURFACE_PICK=function(id,x,y,sectionId){return adapter.surfacePoint(id,x,y,sectionId);};
 window.NAGWEB_SPATIAL_PREVIEW_DEPTH=function(id,value,sectionId,commit){return adapter.previewDepth(id,value,sectionId,commit);};
 window.NAGWEB_SPATIAL_SCREEN_POINT=function(id,sectionId){return adapter.screenPoint(id,sectionId);};
 window.NAGWEB_SPATIAL_PREVIEW_BASE_TRANSFORM=function(id,axis,value,sectionId,commit){return adapter.previewBaseTransform(id,axis,value,sectionId,commit);};
 return adapter;
}
window.NAGWEB_CREATE_SPATIAL_RENDERER=createSpatialRenderer;
})();
