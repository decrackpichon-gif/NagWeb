/* NagWeb Organic Mesh V3
   Continuous WebGL textured mesh. No independent image slices.
   Designed for high-quality organic deformation of transparent 2D assets.
*/
(function(root,factory){
  'use strict';
  var api=factory(root&&root.NAGWEB_INTERACTION_ENGINE,root&&root.NAGWEB_INTERACTION_ASSET_PREP);
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.NAGWEB_ORGANIC_MESH=api;
})(typeof window!=='undefined'?window:globalThis,function(engine,assetPrep){
  'use strict';

  var VERSION='3.1.0-alpha.1';
  var DEFAULTS={
    spinePoints:34,
    columns:32,
    rows:10,
    length:380,
    sway:0.035,
    swayWaves:4.0,
    swayPower:1.8,
    phaseBase:0.06,
    phaseSpeed:0.12,
    activityBase:0.38,
    activitySpeed:0.68,
    headZoneEnd:0.22,
    torsoZoneEnd:0.66,
    zoneBlend:0.075,
    headFlex:0.035,
    torsoFlex:0.42,
    lowerFlex:1,
    headMaxBend:0.065,
    torsoMaxBend:0.16,
    bodyMaxBend:0.30,
    turnProtection:0.78,
    leadEnd:'right',
    maxDpr:2,
    reducedMotion:'respect',
    shadow:true,
    shadowBlur:18,
    shadowOffsetX:10,
    shadowOffsetY:18,
    shadowAlpha:0.32
  };

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function lerp(a,b,t){return a+(b-a)*t;}
  function smoothstep(a,b,x){if(a===b)return x>=b?1:0;var t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);}
  function angleDelta(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b));}
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function merge(a,b){var o=clone(a||{});Object.keys(b||{}).forEach(function(k){o[k]=b[k];});return o;}

  function normalizeOptions(input){
    var o=merge(DEFAULTS,input||{});
    o.spinePoints=Math.round(clamp(Number(o.spinePoints)||34,8,96));
    o.columns=Math.round(clamp(Number(o.columns)||32,8,64));
    o.rows=Math.round(clamp(Number(o.rows)||10,2,24));
    o.length=clamp(Number(o.length)||380,40,2400);
    o.sway=clamp(Number(o.sway)||0,0,.20);
    o.swayWaves=clamp(Number(o.swayWaves)||4,.2,12);
    o.swayPower=clamp(Number(o.swayPower)||1.8,.2,5);
    o.phaseBase=clamp(Number(o.phaseBase)||0,0,1);
    o.phaseSpeed=clamp(Number(o.phaseSpeed)||0,0,1);
    o.activityBase=clamp(Number(o.activityBase)||0,0,2);
    o.activitySpeed=clamp(Number(o.activitySpeed)||0,0,3);
    if(input&&input.headZoneEnd==null&&input.headRigidFraction!=null)o.headZoneEnd=input.headRigidFraction;
    if(input&&input.zoneBlend==null&&input.rigidBlendWidth!=null)o.zoneBlend=input.rigidBlendWidth;
    o.headZoneEnd=clamp(Number(o.headZoneEnd)||.22,.04,.55);
    o.torsoZoneEnd=clamp(Number(o.torsoZoneEnd)||.66,o.headZoneEnd+.08,.94);
    o.zoneBlend=clamp(Number(o.zoneBlend)||.075,.015,.22);
    o.headFlex=clamp(o.headFlex==null?.035:Number(o.headFlex),0,1);
    o.torsoFlex=clamp(o.torsoFlex==null?.42:Number(o.torsoFlex),o.headFlex,1);
    o.lowerFlex=clamp(o.lowerFlex==null?1:Number(o.lowerFlex),o.torsoFlex,1);
    o.headMaxBend=clamp(Number(o.headMaxBend)||.065,.01,.8);
    o.torsoMaxBend=clamp(Number(o.torsoMaxBend)||.16,o.headMaxBend,1);
    o.bodyMaxBend=clamp(Number(o.bodyMaxBend)||.30,o.torsoMaxBend,1.2);
    o.headRigidFraction=o.headZoneEnd;
    o.rigidBlendWidth=o.zoneBlend;
    o.turnProtection=clamp(Number(o.turnProtection)||0,0,1);
    o.leadEnd=o.leadEnd==='left'?'left':'right';
    o.maxDpr=clamp(Number(o.maxDpr)||2,1,3);
    o.reducedMotion=['respect','always','never'].indexOf(o.reducedMotion)>=0?o.reducedMotion:'respect';
    o.shadow=o.shadow!==false;
    o.shadowBlur=clamp(Number(o.shadowBlur)||0,0,80);
    o.shadowOffsetX=clamp(Number(o.shadowOffsetX)||0,-80,80);
    o.shadowOffsetY=clamp(Number(o.shadowOffsetY)||0,-80,80);
    o.shadowAlpha=clamp(Number(o.shadowAlpha)||0,0,1);
    return o;
  }

  function zoneBlendValue(u,a,b,c,opts){
    var o=normalizeOptions(opts),x=clamp(Number(u)||0,0,1);
    var t1=smoothstep(Math.max(0,o.headZoneEnd-o.zoneBlend),Math.min(1,o.headZoneEnd+o.zoneBlend),x);
    var t2=smoothstep(Math.max(0,o.torsoZoneEnd-o.zoneBlend),Math.min(1,o.torsoZoneEnd+o.zoneBlend),x);
    return lerp(lerp(a,b,t1),c,t2);
  }

  function zoneFlexAt(u,opts){
    var o=normalizeOptions(opts);
    return zoneBlendValue(u,o.headFlex,o.torsoFlex,o.lowerFlex,o);
  }

  function bendLimitAt(u,opts){
    var o=normalizeOptions(opts);
    return zoneBlendValue(u,o.headMaxBend,o.torsoMaxBend,o.bodyMaxBend,o);
  }

  function zoneAt(u,opts){
    var o=normalizeOptions(opts),x=clamp(Number(u)||0,0,1);
    return x<o.headZoneEnd?'head':(x<o.torsoZoneEnd?'torso':'lower');
  }

  function createSpine(count,x,y,heading,length){
    count=Math.max(2,Math.round(count||34));length=Math.max(1,Number(length)||380);heading=Number(heading)||0;
    var seg=length/(count-1),out=[];
    for(var i=0;i<count;i++)out.push({x:(Number(x)||0)-Math.cos(heading)*seg*i,y:(Number(y)||0)-Math.sin(heading)*seg*i});
    return out;
  }

  function resegmentSpine(spine,length,heading){
    if(!spine||spine.length<2)return spine;
    var seg=Math.max(.001,Number(length)||1)/(spine.length-1);heading=Number(heading)||0;
    for(var i=1;i<spine.length;i++){
      var prev=spine[i-1],p=spine[i],dx=p.x-prev.x,dy=p.y-prev.y,d=Math.hypot(dx,dy);
      if(d<.0001){dx=-Math.cos(heading);dy=-Math.sin(heading);d=1;}
      p.x=prev.x+dx/d*seg;p.y=prev.y+dy/d*seg;
    }
    return spine;
  }

  function limitSpineBend(spine,length,heading,opts){
    if(!spine||spine.length<2)return spine;
    var o=normalizeOptions(opts),seg=Math.max(.001,Number(length)||1)/(spine.length-1),previous=(Number(heading)||0)+Math.PI;
    for(var i=1;i<spine.length;i++){
      var prev=spine[i-1],p=spine[i],raw=Math.atan2(p.y-prev.y,p.x-prev.x),u=(i-.5)/(spine.length-1),limit=bendLimitAt(u,o);
      var next=previous+clamp(angleDelta(raw,previous),-limit,limit);
      p.x=prev.x+Math.cos(next)*seg;p.y=prev.y+Math.sin(next)*seg;previous=next;
    }
    return spine;
  }

  function advanceSpine(spine,head,length,heading,opts){
    if(!spine||!spine.length)throw new Error('NagWeb Organic Mesh: spine is required');
    spine[0].x=Number(head.x)||0;spine[0].y=Number(head.y)||0;
    resegmentSpine(spine,length,heading);return limitSpineBend(spine,length,heading,opts||DEFAULTS);
  }

  function localCurvature(spine,i){
    if(!spine||spine.length<3)return 0;
    i=Math.round(clamp(i,1,spine.length-2));
    var a=Math.atan2(spine[i].y-spine[i-1].y,spine[i].x-spine[i-1].x);
    var b=Math.atan2(spine[i+1].y-spine[i].y,spine[i+1].x-spine[i].x);
    return Math.abs(angleDelta(b,a));
  }

  function sampleCenterline(spine,u,phase,opts,speedRatio){
    var o=normalizeOptions(opts);u=clamp(Number(u)||0,0,1);
    var pos=u*(spine.length-1),i=Math.floor(pos),t=pos-i;
    var a=spine[clamp(i,0,spine.length-1)],b=spine[clamp(i+1,0,spine.length-1)];
    var x=lerp(a.x,b.x,t),y=lerp(a.y,b.y,t);
    var ia=clamp(i-1,0,spine.length-1),ib=clamp(i+1,0,spine.length-1);
    var vx=spine[ia].x-spine[ib].x,vy=spine[ia].y-spine[ib].y,angle=Math.atan2(vy,vx);
    var curvature=localCurvature(spine,Math.round(pos));
    var ref=Math.max(.001,bendLimitAt(u,o)),turnDamp=1-o.turnProtection*clamp(curvature/ref,0,1);
    var activity=o.activityBase+o.activitySpeed*clamp(Number(speedRatio)||0,0,1);
    var flex=zoneFlexAt(u,o);
    var sway=Math.sin((Number(phase)||0)-u*o.swayWaves)*o.length*o.sway*activity*Math.pow(u,o.swayPower)*flex*turnDamp;
    x+=-Math.sin(angle)*sway;y+=Math.cos(angle)*sway;
    return {x:x,y:y,angle:angle,sway:sway,curvature:curvature,turnDamp:turnDamp};
  }

  function rigidFrame(spine,u,phase,opts,speedRatio){
    var o=normalizeOptions(opts),p=sampleCenterline(spine,u,phase,o,speedRatio),head=sampleCenterline(spine,0,phase,o,speedRatio);
    var flexible=zoneFlexAt(u,o);
    var straightX=head.x-Math.cos(head.angle)*o.length*u,straightY=head.y-Math.sin(head.angle)*o.length*u;
    return {
      x:lerp(straightX,p.x,flexible),
      y:lerp(straightY,p.y,flexible),
      angle:head.angle+angleDelta(p.angle,head.angle)*flexible,
      flexible:flexible,
      zone:zoneAt(u,o),
      curvature:p.curvature
    };
  }

  function createTopology(columns,rows,leadEnd){
    columns=Math.max(1,Math.round(columns));rows=Math.max(1,Math.round(rows));leadEnd=leadEnd==='left'?'left':'right';
    var vertices=[],indices=[];
    for(var c=0;c<=columns;c++){
      var u=c/columns,sx=leadEnd==='right'?1-u:u;
      for(var r=0;r<=rows;r++){
        var v=r/rows;vertices.push({u:u,v:v,tx:sx,ty:v});
      }
    }
    var stride=rows+1;
    for(var x=0;x<columns;x++)for(var y=0;y<rows;y++){
      var a=x*stride+y,b=(x+1)*stride+y,c0=(x+1)*stride+y+1,d=x*stride+y+1;
      indices.push(a,b,c0,a,c0,d);
    }
    return {columns:columns,rows:rows,vertices:vertices,indices:indices};
  }

  function deformTopology(topology,spine,imageWidth,imageHeight,phase,opts,speedRatio){
    var o=normalizeOptions(opts),iw=Math.max(1,Number(imageWidth)||1),ih=Math.max(1,Number(imageHeight)||1),height=o.length*(ih/iw);
    var positions=new Float32Array(topology.vertices.length*2),texcoords=new Float32Array(topology.vertices.length*2);
    var frames=new Array(topology.columns+1);
    for(var c=0;c<=topology.columns;c++)frames[c]=rigidFrame(spine,c/topology.columns,phase,o,speedRatio);
    for(var i=0;i<topology.vertices.length;i++){
      var v=topology.vertices[i],f=frames[Math.round(v.u*topology.columns)],offset=(v.v-.5)*height;
      var nx=-Math.sin(f.angle),ny=Math.cos(f.angle);
      positions[i*2]=f.x+nx*offset;positions[i*2+1]=f.y+ny*offset;
      texcoords[i*2]=v.tx;texcoords[i*2+1]=v.ty;
    }
    return {positions:positions,texcoords:texcoords,indices:new Uint16Array(topology.indices),height:height,frames:frames};
  }

  function advancePhase(phase,speedRatio,opts,dt){
    var o=normalizeOptions(opts),frame=clamp((Number(dt)||16.6667)/16.6667,.25,3);
    return (Number(phase)||0)+(o.phaseBase+o.phaseSpeed*clamp(Number(speedRatio)||0,0,1))*frame;
  }

  function prepareAsset(image,analysis,opts){
    if(typeof document==='undefined')return Promise.reject(new Error('NagWeb Organic Mesh: browser environment required'));
    if(!assetPrep)return Promise.reject(new Error('NagWeb Organic Mesh: Asset Prep v1 is required'));
    opts=opts||{};
    var run=analysis?Promise.resolve(analysis):assetPrep.analyzeImage(image,{maxDimension:512});
    return run.then(function(a){
      if(!a.silhouetteReliable)throw new Error('NagWeb Organic Mesh: a reliable transparent silhouette is required');
      var iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height,axisAngle=Number(opts.axisAngle);
      if(!Number.isFinite(axisAngle)&&opts.profile&&opts.profile.organic)axisAngle=Number(opts.profile.organic.axisAngle);
      if(!Number.isFinite(axisAngle))axisAngle=Number(a.principalAxisAngle)||0;
      var rad=-axisAngle*Math.PI/180,co=Math.abs(Math.cos(rad)),si=Math.abs(Math.sin(rad)),w=Math.ceil(iw*co+ih*si),h=Math.ceil(iw*si+ih*co);
      var canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
      var c=canvas.getContext('2d');c.translate(w/2,h/2);c.rotate(rad);c.drawImage(image,-iw/2,-ih/2);
      return assetPrep.analyzeImage(canvas,{maxDimension:512}).then(function(rot){
        return assetPrep.trimTransparent(canvas,rot,{paddingRatio:opts.paddingRatio==null ? .015 : opts.paddingRatio});
      }).then(function(trimmed){
        return {canvas:trimmed.canvas,analysis:a,axisAngle:axisAngle,width:trimmed.width,height:trimmed.height,leadEnd:'right'};
      });
    });
  }

  function shader(gl,type,source){
    var s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){var msg=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error('NagWeb Organic Mesh shader: '+msg);}
    return s;
  }
  function program(gl,vs,fs){
    var p=gl.createProgram(),v=shader(gl,gl.VERTEX_SHADER,vs),f=shader(gl,gl.FRAGMENT_SHADER,fs);
    gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS)){var msg=gl.getProgramInfoLog(p);gl.deleteProgram(p);throw new Error('NagWeb Organic Mesh program: '+msg);}
    return p;
  }

  function createRenderer(input){
    if(typeof document==='undefined')throw new Error('NagWeb Organic Mesh: browser environment required');
    if(!engine||typeof engine.subscribeFrame!=='function')throw new Error('NagWeb Organic Mesh: Interaction Engine v1.4+ is required');
    input=input||{};
    if(!input.leader||!input.leader.state)throw new Error('NagWeb Organic Mesh: leader follower is required');
    if(!input.canvas)throw new Error('NagWeb Organic Mesh: canvas is required');
    if(!input.image)throw new Error('NagWeb Organic Mesh: prepared image is required');

    var canvas=input.canvas,gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false})||canvas.getContext('experimental-webgl',{alpha:true,antialias:true,premultipliedAlpha:false});
    if(!gl)throw new Error('NagWeb Organic Mesh: WebGL is unavailable');

    var VS='attribute vec2 a_position;attribute vec2 a_texcoord;uniform vec2 u_resolution;varying vec2 v_texcoord;void main(){vec2 zero=a_position/u_resolution;vec2 clip=zero*2.0-1.0;gl_Position=vec4(clip.x,-clip.y,0.0,1.0);v_texcoord=a_texcoord;}';
    var FS='precision mediump float;uniform sampler2D u_image;varying vec2 v_texcoord;void main(){gl_FragColor=texture2D(u_image,v_texcoord);}';
    var prog=program(gl,VS,FS),posLoc=gl.getAttribLocation(prog,'a_position'),texLoc=gl.getAttribLocation(prog,'a_texcoord'),resLoc=gl.getUniformLocation(prog,'u_resolution'),imgLoc=gl.getUniformLocation(prog,'u_image');
    var posBuffer=gl.createBuffer(),texBuffer=gl.createBuffer(),indexBuffer=gl.createBuffer(),texture=gl.createTexture();
    var o=normalizeOptions(input),leader=input.leader,area=input.area||canvas.parentElement||document.documentElement,img=input.image;
    var topology=createTopology(o.columns,o.rows,o.leadEnd),indexCount=topology.indices.length,phase=0,lastHeading=0,destroyed=false,paused=false,bounds={left:0,top:0,width:1,height:1},dpr=1;
    var media=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
    function reduced(){return o.reducedMotion==='always'||(o.reducedMotion==='respect'&&media&&media.matches);}
    var speed0=Math.hypot(leader.state.vx||0,leader.state.vy||0);if(speed0>.05)lastHeading=Math.atan2(leader.state.vy,leader.state.vx);
    var spine=createSpine(o.spinePoints,leader.state.x,leader.state.y,lastHeading,o.length);

    gl.useProgram(prog);
    gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);

    function updateShadow(){
      canvas.style.filter=o.shadow?('drop-shadow('+o.shadowOffsetX+'px '+o.shadowOffsetY+'px '+o.shadowBlur+'px rgba(0,0,0,'+o.shadowAlpha+'))'):'none';
    }
    function measure(){
      var r=area.getBoundingClientRect?area.getBoundingClientRect():{left:0,top:0,width:innerWidth,height:innerHeight};
      bounds={left:r.left||0,top:r.top||0,width:Math.max(1,r.width||innerWidth),height:Math.max(1,r.height||innerHeight)};
      dpr=Math.min(devicePixelRatio||1,o.maxDpr);
      var w=Math.max(1,Math.round(bounds.width*dpr)),h=Math.max(1,Math.round(bounds.height*dpr));
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;canvas.style.width=bounds.width+'px';canvas.style.height=bounds.height+'px';}
      gl.viewport(0,0,w,h);
    }
    function rebuildTopology(){
      topology=createTopology(o.columns,o.rows,o.leadEnd);indexCount=topology.indices.length;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(topology.indices),gl.STATIC_DRAW);
      var tc=new Float32Array(topology.vertices.length*2);
      for(var i=0;i<topology.vertices.length;i++){tc[i*2]=topology.vertices[i].tx;tc[i*2+1]=topology.vertices[i].ty;}
      gl.bindBuffer(gl.ARRAY_BUFFER,texBuffer);gl.bufferData(gl.ARRAY_BUFFER,tc,gl.STATIC_DRAW);
    }
    function ensureSpine(){if(spine.length!==o.spinePoints)spine=createSpine(o.spinePoints,leader.state.x,leader.state.y,lastHeading,o.length);}
    function render(speedRatio){
      var ro=reduced()?merge(o,{sway:0}):o,iw=img.width||img.naturalWidth,ih=img.height||img.naturalHeight;
      if(!iw||!ih)return;
      var mesh=deformTopology(topology,spine,iw,ih,phase,ro,speedRatio),positions=mesh.positions;
      for(var i=0;i<positions.length;i+=2){positions[i]-=bounds.left;positions[i+1]-=bounds.top;}
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(prog);gl.uniform2f(resLoc,bounds.width,bounds.height);gl.uniform1i(imgLoc,0);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.bindBuffer(gl.ARRAY_BUFFER,posBuffer);gl.bufferData(gl.ARRAY_BUFFER,positions,gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(posLoc);gl.vertexAttribPointer(posLoc,2,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ARRAY_BUFFER,texBuffer);gl.enableVertexAttribArray(texLoc);gl.vertexAttribPointer(texLoc,2,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.drawElements(gl.TRIANGLES,indexCount,gl.UNSIGNED_SHORT,0);
    }
    function frame(now,dt){
      if(paused||destroyed)return;
      var vx=leader.state.vx||0,vy=leader.state.vy||0,speed=Math.hypot(vx,vy);if(speed>.08)lastHeading=Math.atan2(vy,vx);
      var max=(leader.options&&leader.options.maxSpeed)||34,ratio=clamp(speed/Math.max(1,max),0,1);
      ensureSpine();advanceSpine(spine,leader.state,o.length,lastHeading,o);if(!reduced())phase=advancePhase(phase,ratio,o,dt);render(ratio);
    }
    function onMeasure(){measure();}
    rebuildTopology();measure();updateShadow();
    window.addEventListener('resize',onMeasure,{passive:true});window.addEventListener('scroll',onMeasure,true);
    var ro=null;if(typeof ResizeObserver==='function'){ro=new ResizeObserver(onMeasure);ro.observe(area);}
    var unsub=engine.subscribeFrame(frame);

    return {
      version:VERSION,
      renderer:'webgl-mesh',
      get options(){return clone(o);},
      get spine(){return spine.map(function(p){return {x:p.x,y:p.y};});},
      get topology(){return {columns:topology.columns,rows:topology.rows,vertexCount:topology.vertices.length,indexCount:indexCount};},
      setOptions:function(next){
        var prevCols=o.columns,prevRows=o.rows,prevLead=o.leadEnd;o=normalizeOptions(merge(o,next||{}));
        ensureSpine();limitSpineBend(spine,o.length,lastHeading,o);
        if(prevCols!==o.columns||prevRows!==o.rows||prevLead!==o.leadEnd)rebuildTopology();updateShadow();measure();return clone(o);
      },
      pause:function(){paused=true;},
      resume:function(){paused=false;},
      redraw:function(){render(clamp(Math.hypot(leader.state.vx||0,leader.state.vy||0)/Math.max(1,(leader.options&&leader.options.maxSpeed)||34),0,1));},
      destroy:function(){
        if(destroyed)return;destroyed=true;if(unsub)unsub();if(ro)ro.disconnect();
        window.removeEventListener('resize',onMeasure);window.removeEventListener('scroll',onMeasure,true);
        gl.deleteBuffer(posBuffer);gl.deleteBuffer(texBuffer);gl.deleteBuffer(indexBuffer);gl.deleteTexture(texture);gl.deleteProgram(prog);canvas.style.filter='';
      }
    };
  }

  return {
    version:VERSION,
    defaults:clone(DEFAULTS),
    normalizeOptions:normalizeOptions,
    bendLimitAt:bendLimitAt,
    zoneFlexAt:zoneFlexAt,
    zoneAt:zoneAt,
    createSpine:createSpine,
    resegmentSpine:resegmentSpine,
    limitSpineBend:limitSpineBend,
    advanceSpine:advanceSpine,
    sampleCenterline:sampleCenterline,
    rigidFrame:rigidFrame,
    createTopology:createTopology,
    deformTopology:deformTopology,
    advancePhase:advancePhase,
    prepareAsset:prepareAsset,
    createRenderer:createRenderer
  };
});
