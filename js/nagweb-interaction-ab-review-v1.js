/* NagWeb Interaction Studio · Organic A/B Review V1.
   Same normalized cursor path for V3 and V4-C.1; this is a visual comparison
   aid, NOT a pixel-identical physics simulation or an automated quality verdict. */
(function(root){
  'use strict';
  var app=root.__NAGWEB_V4C_AB__;
  var byId=id=>document.getElementById(id);
  var run=byId('abRun'),stopButton=byId('abStop'),exportButton=byId('abExport');
  var select=byId('abRoute'),speed=byId('abDuration'),progress=byId('abProgress'),metrics=byId('abMetrics');
  var routes={
    tight:[[.50,.50],[.83,.15],[.18,.75],[.83,.75],[.17,.19],[.78,.54],[.24,.50],[.77,.16],[.50,.50]],
    smooth:[[.26,.54],[.38,.26],[.65,.23],[.78,.45],[.66,.73],[.38,.75],[.26,.54]]
  };
  var active=null,lastReport=null,runCount=0;
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function spineMetrics(spine){
    var finite=Array.isArray(spine)&&spine.length>=3&&spine.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
    if(!finite)return {finite:false,points:Array.isArray(spine)?spine.length:0,maxTurnDegrees:null,minSegmentPx:null};
    var maxTurn=0,minSegment=Infinity;
    for(var i=1;i<spine.length;i++){
      var dx=spine[i].x-spine[i-1].x,dy=spine[i].y-spine[i-1].y;
      minSegment=Math.min(minSegment,Math.hypot(dx,dy));
      if(i<2)continue;
      var ax=spine[i-1].x-spine[i-2].x,ay=spine[i-1].y-spine[i-2].y;
      var angle=Math.abs(Math.atan2(ax*dy-ay*dx,ax*dx+ay*dy))*180/Math.PI;
      maxTurn=Math.max(maxTurn,angle);
    }
    return {finite:true,points:spine.length,maxTurnDegrees:+maxTurn.toFixed(3),minSegmentPx:+minSegment.toFixed(3)};
  }
  function setTarget(x,y){
    var s3=byId('stageV3'),s4=byId('stageV4C');
    app.followerV3.setTarget(x*s3.clientWidth,y*s3.clientHeight,'area');
    app.followerV4C.setTarget(x*s4.clientWidth,y*s4.clientHeight,'area');
    [['crossV3',x,y],['crossV4C',x,y]].forEach(v=>{var c=byId(v[0]);c.style.left=x*100+'%';c.style.top=y*100+'%';});
  }
  function pointAt(route,t){
    var s=clamp(t,0,1)*(route.length-1),i=Math.min(route.length-2,Math.floor(s)),p=s-i;
    var a=route[i],b=route[i+1];
    // Same position path on both sides; sharp reversals are intentional.
    return [a[0]+(b[0]-a[0])*p,a[1]+(b[1]-a[1])*p];
  }
  function sample(current,t,target){
    var a=spineMetrics(app.v3.spine),b=spineMetrics(app.v4c.spine);
    var g=app.v4c.guard||{},controls=app.v4c.adaptiveControls;
    current.samples.push({progress:+t.toFixed(4),target:[+target[0].toFixed(4),+target[1].toFixed(4)],v3:a,v4c:b,
      thicknessCapped:controls.details.filter(d=>d.geometryCapped).length,
      antiFoldConflicts:Number.isFinite(g.conflicts)?g.conflicts:null});
    for(var entry of [a,b])if(!entry.finite)current.invalidSamples++;
    current.maxTurnV3=Math.max(current.maxTurnV3,a.maxTurnDegrees||0);
    current.maxTurnV4C=Math.max(current.maxTurnV4C,b.maxTurnDegrees||0);
  }
  function status(current,t){
    progress.value=Math.round(t*100)+'%';
    metrics.textContent='Recorrido: '+(current.route==='tight'?'giros cerrados':'curvas suaves')+
      '\nMuestras: '+current.samples.length+' · geometría inválida: '+current.invalidSamples+
      '\nMáx. giro local V3: '+current.maxTurnV3.toFixed(1)+'°'+
      ' · V4-C.1: '+current.maxTurnV4C.toFixed(1)+'°'+
      '\nLas métricas son diagnósticas, no una evaluación estética.';
  }
  function finish(cancelled){
    if(!active)return lastReport;
    var current=active;active=null;
    if(current.raf)cancelAnimationFrame(current.raf);
    current.cancelled=!!cancelled;
    current.finishedAt=new Date().toISOString();
    current.status=cancelled?'interrumpido':'completo';
    lastReport=JSON.parse(JSON.stringify(current));
    delete lastReport.raf;delete lastReport.startTime;delete lastReport.resolve;
    run.disabled=false;stopButton.disabled=true;exportButton.disabled=false;
    progress.value=cancelled?'Detenido':'100%';
    metrics.textContent+=(cancelled?'\nRecorrido detenido.':'\nRecorrido completado. Podés exportar el informe.');
    current.resolve(lastReport);
    return lastReport;
  }
  function start(options){
    options=options||{};
    if(active)stop();
    if(!app||!app.v3||!app.v4c)return Promise.reject(new Error('Primero debe cargarse el mismo personaje en ambos motores.'));
    var name=routes[options.route]?options.route:(routes[select.value]?select.value:'tight');
    var duration=clamp(Number(options.durationMs)||Number(speed.value)||4200,500,20000);
    var file=byId('file'),fileName=file.files&&file.files[0]?file.files[0].name:'fixture-svg-interno';
    var current={schema:'nagweb-organic-ab-review',version:1,runId:++runCount,route:name,routePoints:routes[name].map(p=>p.slice()),
      asset:fileName,preset:byId('preset').value,durationMs:duration,startedAt:new Date().toISOString(),
      samples:[],invalidSamples:0,maxTurnV3:0,maxTurnV4C:0,startTime:null,raf:null,resolve:null};
    lastReport=null;active=current;run.disabled=true;stopButton.disabled=false;exportButton.disabled=true;
    return new Promise(function(resolve){
      current.resolve=resolve;
      function step(now){
        if(active!==current)return;
        if(current.startTime===null)current.startTime=now;
        var t=clamp((now-current.startTime)/duration,0,1),p=pointAt(routes[name],t);
        setTarget(p[0],p[1]);
        if(!current.samples.length||now-(current.lastSampleAt||-Infinity)>=90||t===1){
          sample(current,t,p);current.lastSampleAt=now;
        }
        status(current,t);
        if(t===1){finish(false);return;}
        current.raf=requestAnimationFrame(step);
      }
      current.raf=requestAnimationFrame(step);
    });
  }
  function stop(){return finish(true);}
  run.addEventListener('click',()=>start().catch(e=>{metrics.textContent='ERROR · '+e.message;}));
  stopButton.addEventListener('click',stop);
  exportButton.addEventListener('click',()=>{
    if(!lastReport)return;
    var blob=new Blob([JSON.stringify(lastReport,null,2)],{type:'application/json'});
    var url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download='nagweb-v3-v4c-ab-'+lastReport.route+'.json';
    document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),500);
  });
  root.__NAGWEB_AB_REVIEW__={start:start,stop:stop,spineMetrics:spineMetrics,get running(){return !!active;},
    get progress(){return active&&active.samples.length?active.samples.at(-1).progress:0;},
    get lastReport(){return lastReport;},get runCount(){return runCount;}};
})(window);
