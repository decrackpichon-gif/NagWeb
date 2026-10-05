/* NagWeb Organic Weighted Curve V4-B
   Experimental alternative to V3 and V4.1.
   Keeps one ordered longitudinal mapping per mesh column (V3 strength),
   while virtual control weights modulate flexibility/bend instead of blending positions.
   Includes conservative non-neighbour spine anti-fold protection.
*/
(function(root,factory){
  'use strict';
  var v3=root&&root.NAGWEB_ORGANIC_MESH;
  if(typeof module==='object'&&module.exports){
    try{v3=require('./nagweb-interaction-organic-v3.js');}catch(_){}
    module.exports=factory(null,null,v3);
  }else if(root){
    root.NAGWEB_ORGANIC_WEIGHTED_CURVE=factory(root.NAGWEB_INTERACTION_ENGINE,root.NAGWEB_INTERACTION_ASSET_PREP,v3);
  }
})(typeof window!=='undefined'?window:globalThis,function(engine,assetPrep,v3){
  'use strict';

  var VERSION='4.2.0-alpha.1';
  var DEFAULT_POS=[0,.10,.22,.40,.60,.80,1];
  var DEFAULT_FLEX=[.02,.055,.16,.36,.62,.86,1];
  var DEFAULT_BEND=[.055,.070,.105,.155,.205,.265,.32];
  var DEFAULTS={
    spinePoints:38,
    columns:38,
    rows:12,
    length:380,
    sway:.035,
    swayWaves:4,
    swayPower:1.8,
    phaseBase:.06,
    phaseSpeed:.12,
    activityBase:.38,
    activitySpeed:.68,
    controlCount:7,
    controlPositions:DEFAULT_POS,
    controlFlex:DEFAULT_FLEX,
    controlBend:DEFAULT_BEND,
    weightRadius:.24,
    weightPower:2.1,
    preserveLocalControlDips:false,
    turnProtection:.80,
    antiFold:true,
    antiFoldDistance:1.15,
    antiFoldGap:4,
    antiFoldStrength:.48,
    antiFoldIterations:2,
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
  function clean(v,fallback){v=Number(v);return Number.isFinite(v)?v:fallback;}

  function resampleSeries(value,count,fallback){
    var src=Array.isArray(value)&&value.length?value:fallback,out=[];
    for(var i=0;i<count;i++){
      var f=count===1?0:i/(count-1),p=f*(src.length-1),a=Math.floor(p),b=Math.min(src.length-1,a+1),t=p-a;
      out.push(lerp(clean(src[a],0),clean(src[b],0),t));
    }
    return out;
  }

  function normalizeOptions(input){
    input=input||{};var o=merge(DEFAULTS,input);
    o.spinePoints=Math.round(clamp(clean(o.spinePoints,38),10,96));
    o.columns=Math.round(clamp(clean(o.columns,38),8,72));
    o.rows=Math.round(clamp(clean(o.rows,12),2,28));
    o.length=clamp(clean(o.length,380),40,2400);
    o.sway=clamp(clean(o.sway,.035),0,.20);
    o.swayWaves=clamp(clean(o.swayWaves,4),.2,12);
    o.swayPower=clamp(clean(o.swayPower,1.8),.2,5);
    o.phaseBase=clamp(clean(o.phaseBase,.06),0,1);
    o.phaseSpeed=clamp(clean(o.phaseSpeed,.12),0,1);
    o.activityBase=clamp(clean(o.activityBase,.38),0,2);
    o.activitySpeed=clamp(clean(o.activitySpeed,.68),0,3);
    o.controlCount=Math.round(clamp(clean(o.controlCount,7),4,12));
    o.weightRadius=clamp(clean(o.weightRadius,.24),.08,.60);
    o.weightPower=clamp(clean(o.weightPower,2.1),.5,6);
    o.preserveLocalControlDips=o.preserveLocalControlDips===true;
    o.turnProtection=clamp(clean(o.turnProtection,.80),0,1);
    o.antiFold=o.antiFold!==false;
    o.antiFoldDistance=clamp(clean(o.antiFoldDistance,1.15),.55,2.5);
    o.antiFoldGap=Math.round(clamp(clean(o.antiFoldGap,4),3,10));
    o.antiFoldStrength=clamp(clean(o.antiFoldStrength,.48),0,1);
    o.antiFoldIterations=Math.round(clamp(clean(o.antiFoldIterations,2),1,5));
    o.leadEnd=o.leadEnd==='left'?'left':'right';
    o.maxDpr=clamp(clean(o.maxDpr,2),1,3);
    o.maxTextureDimension=Math.round(clamp(clean(o.maxTextureDimension,4096),512,8192));
    o.reducedMotion=['respect','always','never'].indexOf(o.reducedMotion)>=0?o.reducedMotion:'respect';
    o.shadow=o.shadow!==false;
    o.shadowBlur=clamp(clean(o.shadowBlur,18),0,80);
    o.shadowOffsetX=clamp(clean(o.shadowOffsetX,10),-80,80);
    o.shadowOffsetY=clamp(clean(o.shadowOffsetY,18),-80,80);
    o.shadowAlpha=clamp(clean(o.shadowAlpha,.32),0,1);

    var pos=resampleSeries(o.controlPositions,o.controlCount,DEFAULT_POS);
    pos[0]=0;pos[pos.length-1]=1;
    for(var i=1;i<pos.length-1;i++)pos[i]=clamp(pos[i],pos[i-1]+.015,1-(pos.length-1-i)*.015);
    o.controlPositions=pos;
    o.controlFlex=resampleSeries(o.controlFlex,o.controlCount,DEFAULT_FLEX).map(function(v){return clamp(v,0,1);});
    o.controlBend=resampleSeries(o.controlBend,o.controlCount,DEFAULT_BEND).map(function(v){return clamp(v,.02,.8);});
    if(!o.preserveLocalControlDips){
      for(var j=1;j<o.controlFlex.length;j++)o.controlFlex[j]=Math.max(o.controlFlex[j],o.controlFlex[j-1]);
      for(var k=1;k<o.controlBend.length;k++)o.controlBend[k]=Math.max(o.controlBend[k],o.controlBend[k-1]);
    }
    return o;
  }

  function createControls(opts){
    var o=normalizeOptions(opts),controls=[];
    for(var i=0;i<o.controlCount;i++)controls.push({index:i,id:'control-'+i,u:o.controlPositions[i],flex:o.controlFlex[i],bend:o.controlBend[i]});
    return {controls:controls,count:controls.length};
  }

  function weightsAt(u,controls,opts){
    var o=normalizeOptions(opts),x=clamp(clean(u,0),0,1),raw=[],set=controls&&controls.controls?controls:createControls(o);
    set.controls.forEach(function(c){
      var d=Math.abs(x-c.u),q=clamp(1-d/o.weightRadius,0,1);
      if(q>0)raw.push({index:c.index,weight:Math.pow(q,o.weightPower),distance:d});
    });
    if(!raw.length){
      var nearest=set.controls.reduce(function(best,c){var d=Math.abs(x-c.u);return !best||d<best.distance?{index:c.index,weight:1,distance:d}:best;},null);
      raw=[nearest];
    }
    var sum=raw.reduce(function(s,w){return s+w.weight;},0)||1;
    raw.forEach(function(w){w.weight/=sum;});
    return raw;
  }

  function weightedFieldAt(u,key,opts){
    var o=normalizeOptions(opts),controls=createControls(o),weights=weightsAt(u,controls,o),sum=0;
    weights.forEach(function(w){sum+=controls.controls[w.index][key]*w.weight;});
    return sum;
  }
  function flexAt(u,opts){return weightedFieldAt(u,'flex',opts);}
  function bendAt(u,opts){return weightedFieldAt(u,'bend',opts);}

  function createSpine(count,x,y,heading,length){
    if(v3&&v3.createSpine)return v3.createSpine(count,x,y,heading,length);
    count=Math.max(2,Math.round(count||38));length=Math.max(1,clean(length,380));heading=clean(heading,0);
    var seg=length/(count-1),out=[];for(var i=0;i<count;i++)out.push({x:clean(x,0)-Math.cos(heading)*seg*i,y:clean(y,0)-Math.sin(heading)*seg*i});
    return out;
  }

  function resegmentSpine(spine,length,heading){
    if(v3&&v3.resegmentSpine)return v3.resegmentSpine(spine,length,heading);
    if(!spine||spine.length<2)return spine;var seg=Math.max(.001,clean(length,1))/(spine.length-1),h=clean(heading,0);
    for(var i=1;i<spine.length;i++){var a=spine[i-1],p=spine[i],dx=p.x-a.x,dy=p.y-a.y,d=Math.hypot(dx,dy);if(d<1e-5){dx=-Math.cos(h);dy=-Math.sin(h);d=1;}p.x=a.x+dx/d*seg;p.y=a.y+dy/d*seg;}return spine;
  }

  function limitWeightedBend(spine,length,heading,opts){
    if(!spine||spine.length<2)return spine;var o=normalizeOptions(opts),seg=Math.max(.001,o.length)/(spine.length-1),previous=clean(heading,0)+Math.PI;
    for(var i=1;i<spine.length;i++){
      var a=spine[i-1],p=spine[i],raw=Math.atan2(p.y-a.y,p.x-a.x),u=(i-.5)/(spine.length-1),limit=bendAt(u,o),next=previous+clamp(angleDelta(raw,previous),-limit,limit);
      p.x=a.x+Math.cos(next)*seg;p.y=a.y+Math.sin(next)*seg;previous=next;
    }
    return spine;
  }

  function closestPointsSegments(a,b,c,d){
    var ux=b.x-a.x,uy=b.y-a.y,vx=d.x-c.x,vy=d.y-c.y,wx=a.x-c.x,wy=a.y-c.y;
    var A=ux*ux+uy*uy,B=ux*vx+uy*vy,C=vx*vx+vy*vy,D=ux*wx+uy*wy,E=vx*wx+vy*wy,den=A*C-B*B,s=0,t=0;
    if(A<1e-10&&C<1e-10)return {a:{x:a.x,y:a.y},b:{x:c.x,y:c.y},s:0,t:0,distance:Math.hypot(a.x-c.x,a.y-c.y)};
    if(A<1e-10){s=0;t=clamp(E/Math.max(C,1e-10),0,1);}
    else if(C<1e-10){t=0;s=clamp(-D/Math.max(A,1e-10),0,1);}
    else{
      if(Math.abs(den)>1e-10)s=clamp((B*E-C*D)/den,0,1);else s=0;
      t=(B*s+E)/C;
      if(t<0){t=0;s=clamp(-D/A,0,1);}else if(t>1){t=1;s=clamp((B-D)/A,0,1);}
    }
    var p={x:a.x+ux*s,y:a.y+uy*s},q={x:c.x+vx*t,y:c.y+vy*t};
    return {a:p,b:q,s:s,t:t,distance:Math.hypot(p.x-q.x,p.y-q.y)};
  }

  function spineMinSeparation(spine,gap){
    gap=Math.max(2,Math.round(gap||4));var best={distance:Infinity,i:-1,j:-1,a:null,b:null};
    for(var i=0;i<spine.length-1;i++)for(var j=i+gap;j<spine.length-1;j++){
      var hit=closestPointsSegments(spine[i],spine[i+1],spine[j],spine[j+1]);
      if(hit.distance<best.distance)best={distance:hit.distance,i:i,j:j,a:hit.a,b:hit.b};
    }
    return best;
  }

  function antiFoldGuard(spine,length,heading,opts){
    var o=normalizeOptions(opts);if(!o.antiFold||!spine||spine.length<o.antiFoldGap+2)return {spine:spine,conflicts:0,minDistance:Infinity};
    var seg=o.length/(spine.length-1),threshold=seg*o.antiFoldDistance,total=0,minDistance=Infinity;
    for(var iteration=0;iteration<o.antiFoldIterations;iteration++){
      var changed=false;
      for(var i=0;i<spine.length-1;i++){
        for(var j=i+o.antiFoldGap;j<spine.length-1;j++){
          var hit=closestPointsSegments(spine[i],spine[i+1],spine[j],spine[j+1]);minDistance=Math.min(minDistance,hit.distance);
          if(hit.distance>=threshold)continue;
          var dx=hit.b.x-hit.a.x,dy=hit.b.y-hit.a.y,d=hit.distance;
          if(d<1e-5){
            var ex=spine[i+1].x-spine[i].x,ey=spine[i+1].y-spine[i].y,el=Math.hypot(ex,ey)||1;
            dx=-ey/el;dy=ex/el;
            var midx=(spine[j].x+spine[j+1].x-spine[i].x-spine[i+1].x)*.5,midy=(spine[j].y+spine[j+1].y-spine[i].y-spine[i+1].y)*.5;
            if(dx*midx+dy*midy<0){dx=-dx;dy=-dy;}d=1;
          }else{dx/=d;dy/=d;}
          var push=(threshold-hit.distance)*o.antiFoldStrength;
          var start=Math.min(spine.length-1,j+1);
          for(var k=start;k<spine.length;k++){
            var fade=.35+.65*(k-start+1)/Math.max(1,spine.length-start);
            spine[k].x+=dx*push*fade;spine[k].y+=dy*push*fade;
          }
          total++;changed=true;
        }
      }
      if(!changed)break;
      resegmentSpine(spine,o.length,heading);limitWeightedBend(spine,o.length,heading,o);
    }
    var final=spineMinSeparation(spine,o.antiFoldGap);minDistance=Math.min(minDistance,final.distance);
    return {spine:spine,conflicts:total,minDistance:minDistance,threshold:threshold};
  }

  function advanceSpine(spine,head,length,heading,opts){
    if(!spine||!spine.length)throw new Error('NagWeb Organic Weighted Curve: spine is required');
    var o=normalizeOptions(Object.assign({},opts,{length:length}));spine[0].x=clean(head.x,0);spine[0].y=clean(head.y,0);
    resegmentSpine(spine,o.length,heading);limitWeightedBend(spine,o.length,heading,o);
    return antiFoldGuard(spine,o.length,heading,o);
  }

  function localCurvature(spine,i){
    if(!spine||spine.length<3)return 0;i=Math.round(clamp(i,1,spine.length-2));
    var a=Math.atan2(spine[i].y-spine[i-1].y,spine[i].x-spine[i-1].x),b=Math.atan2(spine[i+1].y-spine[i].y,spine[i+1].x-spine[i].x);
    return Math.abs(angleDelta(b,a));
  }

  function sampleCenterline(spine,u,phase,opts,speedRatio){
    var o=normalizeOptions(opts);u=clamp(clean(u,0),0,1);
    var pos=u*(spine.length-1),i=Math.floor(pos),t=pos-i,a=spine[clamp(i,0,spine.length-1)],b=spine[clamp(i+1,0,spine.length-1)];
    var x=lerp(a.x,b.x,t),y=lerp(a.y,b.y,t),ia=clamp(i-1,0,spine.length-1),ib=clamp(i+1,0,spine.length-1),vx=spine[ia].x-spine[ib].x,vy=spine[ia].y-spine[ib].y,angle=Math.atan2(vy,vx);
    var curvature=localCurvature(spine,Math.round(pos)),ref=Math.max(.001,bendAt(u,o)),turnDamp=1-o.turnProtection*clamp(curvature/ref,0,1),activity=o.activityBase+o.activitySpeed*clamp(clean(speedRatio,0),0,1),flex=flexAt(u,o);
    var sway=Math.sin(clean(phase,0)-u*o.swayWaves)*o.length*o.sway*activity*Math.pow(u,o.swayPower)*flex*turnDamp;
    x+=-Math.sin(angle)*sway;y+=Math.cos(angle)*sway;
    return {x:x,y:y,angle:angle,sway:sway,curvature:curvature,turnDamp:turnDamp,flex:flex,bend:ref};
  }

  function weightedFrame(spine,u,phase,opts,speedRatio){
    var o=normalizeOptions(opts),p=sampleCenterline(spine,u,phase,o,speedRatio),head=sampleCenterline(spine,0,phase,o,speedRatio),flex=flexAt(u,o);
    var straightX=head.x-Math.cos(head.angle)*o.length*u,straightY=head.y-Math.sin(head.angle)*o.length*u;
    return {x:lerp(straightX,p.x,flex),y:lerp(straightY,p.y,flex),angle:head.angle+angleDelta(p.angle,head.angle)*flex,flex:flex,bend:bendAt(u,o),curvature:p.curvature};
  }

  function createTopology(columns,rows,leadEnd){
    return v3&&v3.createTopology?v3.createTopology(columns,rows,leadEnd):null;
  }

  function deformTopology(topology,spine,imageWidth,imageHeight,phase,opts,speedRatio){
    var o=normalizeOptions(opts),iw=Math.max(1,clean(imageWidth,1)),ih=Math.max(1,clean(imageHeight,1)),height=o.length*(ih/iw),positions=new Float32Array(topology.vertices.length*2),texcoords=new Float32Array(topology.vertices.length*2),frames=new Array(topology.columns+1);
    for(var c=0;c<=topology.columns;c++)frames[c]=weightedFrame(spine,c/topology.columns,phase,o,speedRatio);
    for(var i=0;i<topology.vertices.length;i++){
      var v=topology.vertices[i],f=frames[Math.round(v.u*topology.columns)],offset=(v.v-.5)*height,nx=-Math.sin(f.angle),ny=Math.cos(f.angle);
      positions[i*2]=f.x+nx*offset;positions[i*2+1]=f.y+ny*offset;texcoords[i*2]=v.tx;texcoords[i*2+1]=v.ty;
    }
    return {positions:positions,texcoords:texcoords,indices:new Uint16Array(topology.indices),height:height,frames:frames};
  }

  function advancePhase(phase,speedRatio,opts,dt){
    var o=normalizeOptions(opts),frame=clamp(clean(dt,16.6667)/16.6667,.25,3);
    return clean(phase,0)+(o.phaseBase+o.phaseSpeed*clamp(clean(speedRatio,0),0,1))*frame;
  }

  function fitTextureDimensions(width,height,maxDimension){
    return v3&&v3.fitTextureDimensions?v3.fitTextureDimensions(width,height,maxDimension):{width:width,height:height,scale:1,scaled:false};
  }
  function prepareAsset(image,analysis,opts){
    if(v3&&v3.prepareAsset)return v3.prepareAsset(image,analysis,opts);
    return Promise.reject(new Error('NagWeb Organic Weighted Curve: Organic Mesh V3 prepareAsset is required'));
  }

  function shader(gl,type,source){var s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){var msg=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error('NagWeb Organic Weighted Curve shader: '+msg);}return s;}
  function program(gl,vs,fs){var p=gl.createProgram(),vs0=shader(gl,gl.VERTEX_SHADER,vs),fs0=shader(gl,gl.FRAGMENT_SHADER,fs);gl.attachShader(p,vs0);gl.attachShader(p,fs0);gl.linkProgram(p);gl.deleteShader(vs0);gl.deleteShader(fs0);if(!gl.getProgramParameter(p,gl.LINK_STATUS)){var msg=gl.getProgramInfoLog(p);gl.deleteProgram(p);throw new Error('NagWeb Organic Weighted Curve program: '+msg);}return p;}

  function createRenderer(input){
    if(typeof document==='undefined')throw new Error('NagWeb Organic Weighted Curve: browser environment required');
    if(!engine||typeof engine.subscribeFrame!=='function')throw new Error('NagWeb Organic Weighted Curve: Interaction Engine v1.4+ is required');
    if(!v3)throw new Error('NagWeb Organic Weighted Curve: Organic Mesh V3 is required');
    input=input||{};if(!input.leader||!input.leader.state)throw new Error('NagWeb Organic Weighted Curve: leader follower is required');if(!input.canvas)throw new Error('NagWeb Organic Weighted Curve: canvas is required');if(!input.image)throw new Error('NagWeb Organic Weighted Curve: prepared image is required');

    var canvas=input.canvas,gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false})||canvas.getContext('experimental-webgl',{alpha:true,antialias:true,premultipliedAlpha:false});
    if(!gl)throw new Error('NagWeb Organic Weighted Curve: WebGL is unavailable');
    var VS='attribute vec2 a_position;attribute vec2 a_texcoord;uniform vec2 u_resolution;varying vec2 v_texcoord;void main(){vec2 zero=a_position/u_resolution;vec2 clip=zero*2.0-1.0;gl_Position=vec4(clip.x,-clip.y,0.0,1.0);v_texcoord=a_texcoord;}';
    var FS='precision mediump float;uniform sampler2D u_image;varying vec2 v_texcoord;void main(){gl_FragColor=texture2D(u_image,v_texcoord);}';
    var prog=program(gl,VS,FS),posLoc=gl.getAttribLocation(prog,'a_position'),texLoc=gl.getAttribLocation(prog,'a_texcoord'),resLoc=gl.getUniformLocation(prog,'u_resolution'),imgLoc=gl.getUniformLocation(prog,'u_image');
    var posBuffer=gl.createBuffer(),texBuffer=gl.createBuffer(),indexBuffer=gl.createBuffer(),texture=gl.createTexture(),o=normalizeOptions(input),leader=input.leader,area=input.area||canvas.parentElement||document.documentElement,img=input.image;
    var topology=createTopology(o.columns,o.rows,o.leadEnd),indexCount=topology.indices.length,phase=0,lastHeading=0,destroyed=false,paused=false,contextLost=false,bounds={left:0,top:0,width:1,height:1},dpr=1,lastGuard={conflicts:0,minDistance:Infinity,threshold:0};
    var textureSource=null,textureInfo=null,gpuTextureLimit=Math.max(512,Number(gl.getParameter(gl.MAX_TEXTURE_SIZE))||4096),media=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
    function reduced(){return o.reducedMotion==='always'||(o.reducedMotion==='respect'&&media&&media.matches);}
    var speed0=Math.hypot(leader.state.vx||0,leader.state.vy||0);if(speed0>.05)lastHeading=Math.atan2(leader.state.vy,leader.state.vx);
    var spine=createSpine(o.spinePoints,leader.state.x,leader.state.y,lastHeading,o.length);

    function uploadTexture(){var iw=img.width||img.naturalWidth,ih=img.height||img.naturalHeight,limit=Math.min(gpuTextureLimit,o.maxTextureDimension),fit=fitTextureDimensions(iw,ih,limit);textureSource=img;if(fit.scaled){var tc=document.createElement('canvas');tc.width=fit.width;tc.height=fit.height;var tctx=tc.getContext('2d');tctx.imageSmoothingEnabled=true;tctx.imageSmoothingQuality='high';tctx.drawImage(img,0,0,fit.width,fit.height);textureSource=tc;}textureInfo={sourceWidth:iw,sourceHeight:ih,width:fit.width,height:fit.height,scale:fit.scale,scaled:fit.scaled,gpuLimit:gpuTextureLimit,limit:limit};gl.useProgram(prog);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,textureSource);}
    function updateShadow(){canvas.style.filter=o.shadow?('drop-shadow('+o.shadowOffsetX+'px '+o.shadowOffsetY+'px '+o.shadowBlur+'px rgba(0,0,0,'+o.shadowAlpha+'))'):'none';}
    function measure(){var r=area.getBoundingClientRect?area.getBoundingClientRect():{left:0,top:0,width:innerWidth,height:innerHeight};bounds={left:r.left||0,top:r.top||0,width:Math.max(1,r.width||innerWidth),height:Math.max(1,r.height||innerHeight)};dpr=Math.min(devicePixelRatio||1,o.maxDpr);var w=Math.max(1,Math.round(bounds.width*dpr)),h=Math.max(1,Math.round(bounds.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;canvas.style.width=bounds.width+'px';canvas.style.height=bounds.height+'px';}gl.viewport(0,0,w,h);}
    function rebuildTopology(){topology=createTopology(o.columns,o.rows,o.leadEnd);indexCount=topology.indices.length;gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(topology.indices),gl.STATIC_DRAW);var tc=new Float32Array(topology.vertices.length*2);for(var i=0;i<topology.vertices.length;i++){tc[i*2]=topology.vertices[i].tx;tc[i*2+1]=topology.vertices[i].ty;}gl.bindBuffer(gl.ARRAY_BUFFER,texBuffer);gl.bufferData(gl.ARRAY_BUFFER,tc,gl.STATIC_DRAW);}
    function ensureSpine(){if(spine.length!==o.spinePoints)spine=createSpine(o.spinePoints,leader.state.x,leader.state.y,lastHeading,o.length);}
    function render(speedRatio){var ro=reduced()?merge(o,{sway:0}):o,iw=img.width||img.naturalWidth,ih=img.height||img.naturalHeight;if(!iw||!ih)return;var mesh=deformTopology(topology,spine,iw,ih,phase,ro,speedRatio),positions=mesh.positions;for(var i=0;i<positions.length;i+=2){positions[i]-=bounds.left;positions[i+1]-=bounds.top;}gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(prog);gl.uniform2f(resLoc,bounds.width,bounds.height);gl.uniform1i(imgLoc,0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.bindBuffer(gl.ARRAY_BUFFER,posBuffer);gl.bufferData(gl.ARRAY_BUFFER,positions,gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(posLoc);gl.vertexAttribPointer(posLoc,2,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,texBuffer);gl.enableVertexAttribArray(texLoc);gl.vertexAttribPointer(texLoc,2,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.drawElements(gl.TRIANGLES,indexCount,gl.UNSIGNED_SHORT,0);}
    function frame(now,dt){if(paused||destroyed||contextLost)return;var vx=leader.state.vx||0,vy=leader.state.vy||0,speed=Math.hypot(vx,vy);if(speed>.08)lastHeading=Math.atan2(vy,vx);var max=(leader.options&&leader.options.maxSpeed)||34,ratio=clamp(speed/Math.max(1,max),0,1);ensureSpine();lastGuard=advanceSpine(spine,leader.state,o.length,lastHeading,o);if(!reduced())phase=advancePhase(phase,ratio,o,dt);render(ratio);}
    function onContextLost(ev){if(ev&&ev.preventDefault)ev.preventDefault();contextLost=true;paused=true;if(typeof input.onContextLost==='function')try{input.onContextLost({renderer:'weighted-curve-v4b',reason:'webgl-context-lost'});}catch(_){}}
    function onMeasure(){measure();}
    uploadTexture();gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.DEPTH_TEST);rebuildTopology();measure();updateShadow();canvas.addEventListener('webglcontextlost',onContextLost,false);window.addEventListener('resize',onMeasure,{passive:true});window.addEventListener('scroll',onMeasure,true);var robs=typeof ResizeObserver==='function'?new ResizeObserver(onMeasure):null;if(robs)robs.observe(area);var unsub=engine.subscribeFrame(frame);

    return {version:VERSION,renderer:'webgl-weighted-curve-v4b',
      get options(){return clone(o);},get spine(){return spine.map(function(p){return {x:p.x,y:p.y};});},get controls(){return clone(createControls(o));},get guard(){return clone(lastGuard);},
      get topology(){return {columns:topology.columns,rows:topology.rows,vertexCount:topology.vertices.length,indexCount:indexCount};},get textureInfo(){return clone(textureInfo);},get contextLost(){return contextLost;},
      setOptions:function(next){var pc=o.columns,pr=o.rows,pl=o.leadEnd,pt=o.maxTextureDimension;o=normalizeOptions(merge(o,next||{}));ensureSpine();limitWeightedBend(spine,o.length,lastHeading,o);if(pc!==o.columns||pr!==o.rows||pl!==o.leadEnd)rebuildTopology();if(pt!==o.maxTextureDimension&&!contextLost)uploadTexture();updateShadow();measure();return clone(o);},
      pause:function(){paused=true;},resume:function(){if(!contextLost)paused=false;},measure:measure,
      destroy:function(){if(destroyed)return;destroyed=true;if(unsub)unsub();if(robs)robs.disconnect();canvas.removeEventListener('webglcontextlost',onContextLost,false);window.removeEventListener('resize',onMeasure);window.removeEventListener('scroll',onMeasure,true);if(!contextLost){gl.deleteBuffer(posBuffer);gl.deleteBuffer(texBuffer);gl.deleteBuffer(indexBuffer);gl.deleteTexture(texture);gl.deleteProgram(prog);}textureSource=null;canvas.style.filter='';}
    };
  }

  return {version:VERSION,defaults:clone(DEFAULTS),normalizeOptions:normalizeOptions,createControls:createControls,weightsAt:weightsAt,weightedFieldAt:weightedFieldAt,flexAt:flexAt,bendAt:bendAt,createSpine:createSpine,resegmentSpine:resegmentSpine,limitWeightedBend:limitWeightedBend,closestPointsSegments:closestPointsSegments,spineMinSeparation:spineMinSeparation,antiFoldGuard:antiFoldGuard,advanceSpine:advanceSpine,sampleCenterline:sampleCenterline,weightedFrame:weightedFrame,createTopology:createTopology,deformTopology:deformTopology,advancePhase:advancePhase,fitTextureDimensions:fitTextureDimensions,prepareAsset:prepareAsset,createRenderer:createRenderer};
});
