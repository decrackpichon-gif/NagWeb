/* NagWeb Organic Skin V4
   Experimental alternative to Organic Mesh V3.
   Continuous textured mesh + virtual bones + smooth per-vertex skin weights.
   V3 remains the stable reference and is not replaced by this module.
*/
(function(root,factory){
  'use strict';
  var v3=root&&root.NAGWEB_ORGANIC_MESH;
  if(typeof module==='object'&&module.exports){
    try{v3=require('./nagweb-interaction-organic-v3.js');}catch(_){}
    module.exports=factory(null,null,v3);
  }else if(root){
    root.NAGWEB_ORGANIC_SKIN=factory(root.NAGWEB_INTERACTION_ENGINE,root.NAGWEB_INTERACTION_ASSET_PREP,v3);
  }
})(typeof window!=='undefined'?window:globalThis,function(engine,assetPrep,v3){
  'use strict';

  var VERSION='4.0.0-alpha.1';
  var DEFAULT_BONE_U=[0,.12,.28,.47,.66,.84,1];
  var DEFAULT_BONE_FLEX=[.02,.08,.22,.46,.70,.90,1];
  var DEFAULTS={
    spinePoints:36,
    columns:36,
    rows:12,
    length:380,
    sway:.035,
    swayWaves:4,
    swayPower:1.8,
    phaseBase:.06,
    phaseSpeed:.12,
    activityBase:.38,
    activitySpeed:.68,
    maxBend:.30,
    turnProtection:.78,
    boneCount:7,
    bonePositions:DEFAULT_BONE_U,
    boneFlex:DEFAULT_BONE_FLEX,
    weightRadius:.27,
    weightPower:2.2,
    maxInfluences:4,
    leadEnd:'right',
    maxDpr:2,
    maxTextureDimension:4096,
    reducedMotion:'respect',
    shadow:true,
    shadowBlur:18,
    shadowOffsetX:10,
    shadowOffsetY:18,
    shadowAlpha:.32
  };

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function lerp(a,b,t){return a+(b-a)*t;}
  function angleDelta(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b));}
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function merge(a,b){var o=clone(a||{});Object.keys(b||{}).forEach(function(k){o[k]=b[k];});return o;}

  function normalizedSeries(value,count,fallback){
    var src=Array.isArray(value)?value:fallback,out=[],i;
    for(i=0;i<count;i++){
      var f=count===1?0:i/(count-1),idx=f*(src.length-1),a=Math.floor(idx),b=Math.min(src.length-1,a+1),t=idx-a;
      out.push(lerp(Number(src[a])||0,Number(src[b])||0,t));
    }
    return out;
  }

  function normalizeOptions(input){
    input=input||{};var o=merge(DEFAULTS,input);
    o.spinePoints=Math.round(clamp(Number(o.spinePoints)||36,8,96));
    o.columns=Math.round(clamp(Number(o.columns)||36,8,72));
    o.rows=Math.round(clamp(Number(o.rows)||12,2,28));
    o.length=clamp(Number(o.length)||380,40,2400);
    o.sway=clamp(Number(o.sway)||0,0,.20);
    o.swayWaves=clamp(Number(o.swayWaves)||4,.2,12);
    o.swayPower=clamp(Number(o.swayPower)||1.8,.2,5);
    o.phaseBase=clamp(Number(o.phaseBase)||0,0,1);
    o.phaseSpeed=clamp(Number(o.phaseSpeed)||0,0,1);
    o.activityBase=clamp(Number(o.activityBase)||0,0,2);
    o.activitySpeed=clamp(Number(o.activitySpeed)||0,0,3);
    o.maxBend=clamp(Number(o.maxBend)||.30,.03,1.2);
    o.turnProtection=clamp(Number(o.turnProtection)||0,0,1);
    o.boneCount=Math.round(clamp(Number(o.boneCount)||7,4,12));
    o.weightRadius=clamp(Number(o.weightRadius)||.27,.08,.65);
    o.weightPower=clamp(Number(o.weightPower)||2.2,.5,6);
    o.maxInfluences=Math.round(clamp(Number(o.maxInfluences)||4,1,4));
    o.leadEnd=o.leadEnd==='left'?'left':'right';
    o.maxDpr=clamp(Number(o.maxDpr)||2,1,3);
    o.maxTextureDimension=Math.round(clamp(Number(o.maxTextureDimension)||4096,512,8192));
    o.reducedMotion=['respect','always','never'].indexOf(o.reducedMotion)>=0?o.reducedMotion:'respect';
    o.shadow=o.shadow!==false;
    o.shadowBlur=clamp(Number(o.shadowBlur)||0,0,80);
    o.shadowOffsetX=clamp(Number(o.shadowOffsetX)||0,-80,80);
    o.shadowOffsetY=clamp(Number(o.shadowOffsetY)||0,-80,80);
    o.shadowAlpha=clamp(Number(o.shadowAlpha)||0,0,1);

    var pos=normalizedSeries(o.bonePositions,o.boneCount,DEFAULT_BONE_U);
    pos[0]=0;pos[pos.length-1]=1;
    for(var i=1;i<pos.length-1;i++)pos[i]=clamp(pos[i],pos[i-1]+.015,1-(pos.length-1-i)*.015);
    o.bonePositions=pos;
    var flex=normalizedSeries(o.boneFlex,o.boneCount,DEFAULT_BONE_FLEX);
    for(var j=0;j<flex.length;j++)flex[j]=clamp(flex[j],0,1);
    for(var k=1;k<flex.length;k++)flex[k]=Math.max(flex[k],flex[k-1]);
    o.boneFlex=flex;
    return o;
  }

  function createRig(opts){
    var o=normalizeOptions(opts),bones=[];
    for(var i=0;i<o.boneCount;i++)bones.push({
      index:i,
      id:'bone-'+i,
      u:o.bonePositions[i],
      flex:o.boneFlex[i]
    });
    return {bones:bones,count:bones.length};
  }

  function boneWeightsAt(u,rig,opts){
    var o=normalizeOptions(opts),x=clamp(Number(u)||0,0,1),raw=[];
    rig=(rig&&rig.bones)?rig:createRig(o);
    rig.bones.forEach(function(b){
      var d=Math.abs(x-b.u),q=clamp(1-d/o.weightRadius,0,1);
      if(q>0)raw.push({index:b.index,id:b.id,weight:Math.pow(q,o.weightPower),distance:d});
    });
    if(!raw.length){
      var nearest=rig.bones.reduce(function(best,b){var d=Math.abs(x-b.u);return !best||d<best.distance?{index:b.index,id:b.id,weight:1,distance:d}:best;},null);
      raw=[nearest];
    }
    raw.sort(function(a,b){return b.weight-a.weight;});
    raw=raw.slice(0,o.maxInfluences);
    var sum=raw.reduce(function(s,w){return s+w.weight;},0)||1;
    raw.forEach(function(w){w.weight/=sum;});
    raw.sort(function(a,b){return a.index-b.index;});
    return raw;
  }

  function createWeightedTopology(columns,rows,opts){
    var o=normalizeOptions(Object.assign({},opts,{columns:columns,rows:rows})),base;
    if(v3&&v3.createTopology)base=v3.createTopology(o.columns,o.rows,o.leadEnd);
    else{
      var vertices=[],indices=[],stride=o.rows+1;
      for(var c=0;c<=o.columns;c++){
        var u=c/o.columns,sx=o.leadEnd==='right'?1-u:u;
        for(var r=0;r<=o.rows;r++){var vv=r/o.rows;vertices.push({u:u,v:vv,tx:sx,ty:vv});}
      }
      for(var x=0;x<o.columns;x++)for(var y=0;y<o.rows;y++){var a=x*stride+y,b=(x+1)*stride+y,c0=(x+1)*stride+y+1,d=x*stride+y+1;indices.push(a,b,c0,a,c0,d);}
      base={columns:o.columns,rows:o.rows,vertices:vertices,indices:indices};
    }
    var rig=createRig(o);
    base.vertices=base.vertices.map(function(vertex){
      var vtx=Object.assign({},vertex);vtx.weights=boneWeightsAt(vtx.u,rig,o);return vtx;
    });
    base.rig=rig;
    return base;
  }

  function v3Options(o){
    return {
      spinePoints:o.spinePoints,columns:o.columns,rows:o.rows,length:o.length,
      sway:o.sway,swayWaves:o.swayWaves,swayPower:o.swayPower,
      phaseBase:o.phaseBase,phaseSpeed:o.phaseSpeed,activityBase:o.activityBase,activitySpeed:o.activitySpeed,
      headZoneEnd:.18,torsoZoneEnd:.72,zoneBlend:.03,
      headFlex:1,torsoFlex:1,lowerFlex:1,
      headMaxBend:o.maxBend,torsoMaxBend:o.maxBend,bodyMaxBend:o.maxBend,
      turnProtection:o.turnProtection,leadEnd:o.leadEnd,maxDpr:o.maxDpr,maxTextureDimension:o.maxTextureDimension,
      reducedMotion:o.reducedMotion,shadow:o.shadow,shadowBlur:o.shadowBlur,shadowOffsetX:o.shadowOffsetX,shadowOffsetY:o.shadowOffsetY,shadowAlpha:o.shadowAlpha
    };
  }

  function poseRig(spine,phase,opts,speedRatio){
    if(!v3||!v3.sampleCenterline)throw new Error('NagWeb Organic Skin V4: Organic Mesh V3 helpers are required');
    var o=normalizeOptions(opts),rig=createRig(o),vo=v3Options(o),head=v3.sampleCenterline(spine,0,phase,vo,speedRatio),frames=[];
    rig.bones.forEach(function(b){
      var target=v3.sampleCenterline(spine,b.u,phase,vo,speedRatio);
      var straightX=head.x-Math.cos(head.angle)*o.length*b.u;
      var straightY=head.y-Math.sin(head.angle)*o.length*b.u;
      frames.push({
        index:b.index,id:b.id,u:b.u,flex:b.flex,
        x:lerp(straightX,target.x,b.flex),
        y:lerp(straightY,target.y,b.flex),
        angle:head.angle+angleDelta(target.angle,head.angle)*b.flex,
        targetX:target.x,targetY:target.y,targetAngle:target.angle
      });
    });
    return {rig:rig,frames:frames,head:head};
  }

  function transformRestPoint(restX,restY,bone,frame,length){
    var bx=-length*bone.u,dx=restX-bx,dy=restY;
    var co=Math.cos(frame.angle),si=Math.sin(frame.angle);
    return {x:frame.x+co*dx-si*dy,y:frame.y+si*dx+co*dy};
  }

  function skinVertex(vertex,rig,frames,length,height){
    var restX=-length*vertex.u,restY=(vertex.v-.5)*height,x=0,y=0,sum=0;
    var weights=vertex.weights||[];
    for(var i=0;i<weights.length;i++){
      var w=weights[i],bone=rig.bones[w.index],frame=frames[w.index];
      if(!bone||!frame)continue;
      var p=transformRestPoint(restX,restY,bone,frame,length);
      x+=p.x*w.weight;y+=p.y*w.weight;sum+=w.weight;
    }
    if(sum<=0){
      var f=frames[0];return {x:f.x,y:f.y};
    }
    return {x:x/sum,y:y/sum};
  }

  function deformTopology(topology,spine,imageWidth,imageHeight,phase,opts,speedRatio){
    var o=normalizeOptions(opts),iw=Math.max(1,Number(imageWidth)||1),ih=Math.max(1,Number(imageHeight)||1),height=o.length*(ih/iw);
    var pose=poseRig(spine,phase,o,speedRatio),positions=new Float32Array(topology.vertices.length*2),texcoords=new Float32Array(topology.vertices.length*2);
    for(var i=0;i<topology.vertices.length;i++){
      var v=topology.vertices[i],p=skinVertex(v,pose.rig,pose.frames,o.length,height);
      positions[i*2]=p.x;positions[i*2+1]=p.y;texcoords[i*2]=v.tx;texcoords[i*2+1]=v.ty;
    }
    return {positions:positions,texcoords:texcoords,indices:new Uint16Array(topology.indices),height:height,rig:pose.rig,boneFrames:pose.frames};
  }

  function weightStats(topology){
    var min=Infinity,max=-Infinity,total=0,count=0,maxInfluences=0;
    topology.vertices.forEach(function(v){
      var sum=(v.weights||[]).reduce(function(s,w){return s+w.weight;},0);
      min=Math.min(min,sum);max=Math.max(max,sum);total+=sum;count++;maxInfluences=Math.max(maxInfluences,(v.weights||[]).length);
    });
    return {minSum:min,maxSum:max,meanSum:count?total/count:0,maxInfluences:maxInfluences};
  }

  function fitTextureDimensions(width,height,maxDimension){
    if(v3&&v3.fitTextureDimensions)return v3.fitTextureDimensions(width,height,maxDimension);
    width=Math.max(1,Math.round(Number(width)||1));height=Math.max(1,Math.round(Number(height)||1));maxDimension=Math.max(1,Math.round(Number(maxDimension)||1));
    var scale=Math.min(1,maxDimension/Math.max(width,height));
    return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale)),scale:scale,scaled:scale<.999999};
  }

  function shader(gl,type,source){var s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){var msg=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error('NagWeb Organic Skin shader: '+msg);}return s;}
  function program(gl,vs,fs){var p=gl.createProgram(),v=shader(gl,gl.VERTEX_SHADER,vs),f=shader(gl,gl.FRAGMENT_SHADER,fs);gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(p,gl.LINK_STATUS)){var msg=gl.getProgramInfoLog(p);gl.deleteProgram(p);throw new Error('NagWeb Organic Skin program: '+msg);}return p;}

  function createRenderer(input){
    if(typeof document==='undefined')throw new Error('NagWeb Organic Skin V4: browser environment required');
    if(!engine||typeof engine.subscribeFrame!=='function')throw new Error('NagWeb Organic Skin V4: Interaction Engine v1.4+ is required');
    if(!v3)throw new Error('NagWeb Organic Skin V4: Organic Mesh V3 is required');
    input=input||{};if(!input.leader||!input.leader.state)throw new Error('NagWeb Organic Skin V4: leader follower is required');
    if(!input.canvas)throw new Error('NagWeb Organic Skin V4: canvas is required');if(!input.image)throw new Error('NagWeb Organic Skin V4: prepared image is required');

    var canvas=input.canvas,gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false})||canvas.getContext('experimental-webgl',{alpha:true,antialias:true,premultipliedAlpha:false});
    if(!gl)throw new Error('NagWeb Organic Skin V4: WebGL is unavailable');
    var VS='attribute vec2 a_position;attribute vec2 a_texcoord;uniform vec2 u_resolution;varying vec2 v_texcoord;void main(){vec2 zero=a_position/u_resolution;vec2 clip=zero*2.0-1.0;gl_Position=vec4(clip.x,-clip.y,0.0,1.0);v_texcoord=a_texcoord;}';
    var FS='precision mediump float;uniform sampler2D u_image;varying vec2 v_texcoord;void main(){gl_FragColor=texture2D(u_image,v_texcoord);}';
    var prog=program(gl,VS,FS),posLoc=gl.getAttribLocation(prog,'a_position'),texLoc=gl.getAttribLocation(prog,'a_texcoord'),resLoc=gl.getUniformLocation(prog,'u_resolution'),imgLoc=gl.getUniformLocation(prog,'u_image');
    var posBuffer=gl.createBuffer(),texBuffer=gl.createBuffer(),indexBuffer=gl.createBuffer(),texture=gl.createTexture();
    var o=normalizeOptions(input),leader=input.leader,area=input.area||canvas.parentElement||document.documentElement,img=input.image;
    var topology=createWeightedTopology(o.columns,o.rows,o),indexCount=topology.indices.length,phase=0,lastHeading=0,destroyed=false,paused=false,contextLost=false,bounds={left:0,top:0,width:1,height:1},dpr=1,lastMesh=null;
    var textureSource=null,textureInfo=null,gpuTextureLimit=Math.max(512,Number(gl.getParameter(gl.MAX_TEXTURE_SIZE))||4096);
    var media=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
    function reduced(){return o.reducedMotion==='always'||(o.reducedMotion==='respect'&&media&&media.matches);}
    var speed0=Math.hypot(leader.state.vx||0,leader.state.vy||0);if(speed0>.05)lastHeading=Math.atan2(leader.state.vy,leader.state.vx);
    var spine=v3.createSpine(o.spinePoints,leader.state.x,leader.state.y,lastHeading,o.length);

    function uploadTexture(){
      var iw=img.width||img.naturalWidth,ih=img.height||img.naturalHeight,limit=Math.min(gpuTextureLimit,o.maxTextureDimension),fit=fitTextureDimensions(iw,ih,limit);
      textureSource=img;
      if(fit.scaled){var tc=document.createElement('canvas');tc.width=fit.width;tc.height=fit.height;var tctx=tc.getContext('2d');tctx.imageSmoothingEnabled=true;tctx.imageSmoothingQuality='high';tctx.drawImage(img,0,0,fit.width,fit.height);textureSource=tc;}
      textureInfo={sourceWidth:iw,sourceHeight:ih,width:fit.width,height:fit.height,scale:fit.scale,scaled:fit.scaled,gpuLimit:gpuTextureLimit,limit:limit};
      gl.useProgram(prog);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,textureSource);
    }
    function updateShadow(){canvas.style.filter=o.shadow?('drop-shadow('+o.shadowOffsetX+'px '+o.shadowOffsetY+'px '+o.shadowBlur+'px rgba(0,0,0,'+o.shadowAlpha+'))'):'none';}
    function measure(){var r=area.getBoundingClientRect?area.getBoundingClientRect():{left:0,top:0,width:innerWidth,height:innerHeight};bounds={left:r.left||0,top:r.top||0,width:Math.max(1,r.width||innerWidth),height:Math.max(1,r.height||innerHeight)};dpr=Math.min(devicePixelRatio||1,o.maxDpr);var w=Math.max(1,Math.round(bounds.width*dpr)),h=Math.max(1,Math.round(bounds.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;canvas.style.width=bounds.width+'px';canvas.style.height=bounds.height+'px';}gl.viewport(0,0,w,h);}
    function rebuildTopology(){topology=createWeightedTopology(o.columns,o.rows,o);indexCount=topology.indices.length;gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(topology.indices),gl.STATIC_DRAW);var tc=new Float32Array(topology.vertices.length*2);for(var i=0;i<topology.vertices.length;i++){tc[i*2]=topology.vertices[i].tx;tc[i*2+1]=topology.vertices[i].ty;}gl.bindBuffer(gl.ARRAY_BUFFER,texBuffer);gl.bufferData(gl.ARRAY_BUFFER,tc,gl.STATIC_DRAW);}
    function ensureSpine(){if(spine.length!==o.spinePoints)spine=v3.createSpine(o.spinePoints,leader.state.x,leader.state.y,lastHeading,o.length);}
    function render(speedRatio){
      var ro=reduced()?merge(o,{sway:0}):o,iw=img.width||img.naturalWidth,ih=img.height||img.naturalHeight;if(!iw||!ih)return;
      var mesh=deformTopology(topology,spine,iw,ih,phase,ro,speedRatio),positions=mesh.positions;lastMesh=mesh;
      for(var i=0;i<positions.length;i+=2){positions[i]-=bounds.left;positions[i+1]-=bounds.top;}
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(prog);gl.uniform2f(resLoc,bounds.width,bounds.height);gl.uniform1i(imgLoc,0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.bindBuffer(gl.ARRAY_BUFFER,posBuffer);gl.bufferData(gl.ARRAY_BUFFER,positions,gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(posLoc);gl.vertexAttribPointer(posLoc,2,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ARRAY_BUFFER,texBuffer);gl.enableVertexAttribArray(texLoc);gl.vertexAttribPointer(texLoc,2,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.drawElements(gl.TRIANGLES,indexCount,gl.UNSIGNED_SHORT,0);
    }
    function frame(now,dt){
      if(paused||destroyed||contextLost)return;
      var vx=leader.state.vx||0,vy=leader.state.vy||0,speed=Math.hypot(vx,vy);if(speed>.08)lastHeading=Math.atan2(vy,vx);
      var max=(leader.options&&leader.options.maxSpeed)||34,ratio=clamp(speed/Math.max(1,max),0,1),vo=v3Options(o);
      ensureSpine();v3.advanceSpine(spine,leader.state,o.length,lastHeading,vo);if(!reduced())phase=v3.advancePhase(phase,ratio,vo,dt);render(ratio);
    }
    function onContextLost(ev){if(ev&&ev.preventDefault)ev.preventDefault();contextLost=true;paused=true;if(typeof input.onContextLost==='function')try{input.onContextLost({renderer:'skin-v4',reason:'webgl-context-lost'});}catch(_){}}
    function onMeasure(){measure();}
    uploadTexture();gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.DEPTH_TEST);rebuildTopology();measure();updateShadow();
    canvas.addEventListener('webglcontextlost',onContextLost,false);window.addEventListener('resize',onMeasure,{passive:true});window.addEventListener('scroll',onMeasure,true);
    var robs=typeof ResizeObserver==='function'?new ResizeObserver(onMeasure):null;if(robs)robs.observe(area);
    var unsub=engine.subscribeFrame(frame);

    return {
      version:VERSION,renderer:'webgl-skin-v4',
      get options(){return clone(o);},get spine(){return spine;},get rig(){return clone(topology.rig);},
      get boneFrames(){return lastMesh?clone(lastMesh.boneFrames):[];},
      get topology(){return {columns:topology.columns,rows:topology.rows,vertexCount:topology.vertices.length,indexCount:indexCount,weightStats:weightStats(topology)};},
      get textureInfo(){return clone(textureInfo);},get contextLost(){return contextLost;},
      setOptions:function(next){
        var pc=o.columns,pr=o.rows,pb=o.boneCount,pp=JSON.stringify(o.bonePositions),pf=JSON.stringify(o.boneFlex),pw=o.weightRadius,ppow=o.weightPower,pi=o.maxInfluences,pt=o.maxTextureDimension;
        o=normalizeOptions(merge(o,next||{}));ensureSpine();
        if(pc!==o.columns||pr!==o.rows||pb!==o.boneCount||pp!==JSON.stringify(o.bonePositions)||pf!==JSON.stringify(o.boneFlex)||pw!==o.weightRadius||ppow!==o.weightPower||pi!==o.maxInfluences)rebuildTopology();
        if(pt!==o.maxTextureDimension&&!contextLost)uploadTexture();updateShadow();measure();return clone(o);
      },
      pause:function(){paused=true;},resume:function(){if(!contextLost)paused=false;},measure:measure,
      destroy:function(){if(destroyed)return;destroyed=true;if(unsub)unsub();if(robs)robs.disconnect();canvas.removeEventListener('webglcontextlost',onContextLost,false);window.removeEventListener('resize',onMeasure);window.removeEventListener('scroll',onMeasure,true);if(!contextLost){gl.deleteBuffer(posBuffer);gl.deleteBuffer(texBuffer);gl.deleteBuffer(indexBuffer);gl.deleteTexture(texture);gl.deleteProgram(prog);}textureSource=null;canvas.style.filter='';}
    };
  }

  function prepareAsset(image,analysis,opts){
    if(v3&&v3.prepareAsset)return v3.prepareAsset(image,analysis,opts);
    return Promise.reject(new Error('NagWeb Organic Skin V4: Organic Mesh V3 prepareAsset is required'));
  }

  return {
    version:VERSION,
    normalizeOptions:normalizeOptions,
    createRig:createRig,
    boneWeightsAt:boneWeightsAt,
    createWeightedTopology:createWeightedTopology,
    poseRig:poseRig,
    transformRestPoint:transformRestPoint,
    skinVertex:skinVertex,
    deformTopology:deformTopology,
    weightStats:weightStats,
    prepareAsset:prepareAsset,
    createRenderer:createRenderer
  };
});
