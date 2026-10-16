/* NagWeb 1.6 · feedback de composición
   Hero editable por capas, Historia sticky navegable en edición y Cinta cinética sticky. */
(function(){
'use strict';
if(!window.SCWX||!window.SCW||window.NAGWEB_FEEDBACK16)return;window.NAGWEB_FEEDBACK16=1;
var X=window.SCWX,W=window.SCW;
var E=X.E,str=X.str,num=X.num,col=X.col,pick=X.pick,bool=X.bool,arr=X.arr,cfgAttr=X.cfgAttr,cssVars=X.cssVars,onColor=X.onColor,ICO=X.ICO,TH=X.TH,imgUrl=X.imgUrl,bgImg=X.bgImg,lines=X.lines,RT=X.RT,scwBoot=X.scwBoot,scwCfg=X.scwCfg,scwRM=X.scwRM;
// Contrato común de posicionamiento para widgets compuestos con partes internas.
// Sin referencias conserva píxeles antiguos; con refW/refH exporta coordenadas adaptables.
function partTransformCSS(e,n,heightUnit){
 var desktop=e&&e.__parts&&e.__parts[n],mobile=e&&e.__partsMobile&&e.__partsMobile[n];
 function serialize(p,keys){
  if(!p)return '';
  var x=num(p.x,0,-5000,5000),y=num(p.y,0,-5000,5000),relative=p.refW>0&&p.refH>0;
  var tx=relative?(x/num(p.refW,1,1,10000)*100).toFixed(5)+'cqw':x+'px';
  var ty=relative?'calc('+heightUnit+' * '+(y/num(p.refH,1,1,10000)).toFixed(6)+')':y+'px';
  return keys[0]+':'+tx+';'+keys[1]+':'+ty+';'+keys[2]+':'+num(p.r,0,-1080,1080)+'deg;'+keys[3]+':'+num(p.s,1,.05,12)+';';
 }
 return serialize(desktop,['--nw-tx','--nw-ty','--nw-pr','--nw-ps'])+
  serialize(mobile,['--nw-mx','--nw-my','--nw-mr','--nw-ms']);
}
// Otros widgets pueden compartir el serializador sin copiar esta lógica.
X.partTransformCSS=partTransformCSS;
// Un único inyector para recursos cuyos atributos style ya contenían poses en px.
// Limpia SOLO las 8 variables geométricas antiguas, conserva imágenes/colores y añade la pose vigente al final.
function partStyleMarkup(html,e,part,heightUnit){
 var css=partTransformCSS(e,part,heightUnit);
 if(!css)return html;
 var token='data-wpart="'+part+'"';
 return html.replace(new RegExp('<[a-z][^>]*'+token+'[^>]*>','i'),function(tag){
  var m=/\sstyle="([^"]*)"/.exec(tag);
  if(!m)return tag.slice(0,-1)+' style="'+css+'">';
  var keep=m[1].replace(/(?:^|;)\s*--nw-(?:tx|ty|pr|ps|mx|my|mr|ms):[^;]*/g,'');
  if(keep&&!keep.endsWith(';'))keep+=';';
  return tag.replace(m[0],' style="'+keep+css+'"');
 });
}
// Un solo contrato para historias/cintas sticky dentro de escenas libres.
// Los widgets absolutos no extendían la altura de la escena, así que al
// hacer scroll el escenario desaparecía y el efecto publicado quedaba roto.
function freeStickyRunway(el){
 var wrapper=el&&el.closest('.el.wdg'),inner=wrapper&&wrapper.parentElement,scene=inner&&inner.parentElement;
 if(!inner||!inner.classList.contains('inner')||!scene||!scene.classList.contains('free'))return;
 var originalVH=Math.max(1,parseFloat(scene.style.minHeight)||100);
 Array.prototype.forEach.call(inner.children,function(node){
  if(node===wrapper||!node.classList.contains('el'))return;
  var y=Number(node.getAttribute('data-y'));
  if(node.hasAttribute('data-y')&&isFinite(y))
   node.style.top=(originalVH*y/100).toFixed(3)+'vh';
 });
}
function heroPartCSS(e,n){
 var desktop=e&&e.__parts&&e.__parts[n],mobile=e&&e.__partsMobile&&e.__partsMobile[n];
 var z=desktop&&Number.isFinite(+desktop.z)?'--nw-z:'+Math.round(+desktop.z)+';':'';
 var mz=mobile&&Number.isFinite(+mobile.z)?'--nw-mz:'+Math.round(+mobile.z)+';':'';
 var mw=mobile&&Number.isFinite(+mobile.fw)&&mobile.fw>0&&mobile.refW>0?
  '--nw-mfw:'+(num(mobile.fw,240,20,10000)/num(mobile.refW,1,1,10000)*100).toFixed(5)+'cqw;':'';
 var free='';
 if(desktop&&desktop.free&&desktop.refW>0&&desktop.refH>0){
  var rw=num(desktop.refW,1,1,10000),rh=num(desktop.refH,1,1,10000);
  free='--nw-fx:'+(num(desktop.fx,0,-5000,5000)/rw*100).toFixed(5)+'cqw;'+
   '--nw-fy:calc(var(--h) * '+(num(desktop.fy,0,-5000,5000)/rh).toFixed(6)+');'+
   '--nw-fw:'+(num(desktop.fw,240,20,10000)/rw*100).toFixed(5)+'cqw;';
 }
 return partTransformCSS(e,n,'var(--h)')+z+mz+free+mw;
}
var PART='[data-wpart]{translate:var(--nw-tx,0px) var(--nw-ty,0px);rotate:var(--nw-pr,0deg);scale:var(--nw-ps,1)}.nw-edit-partbar{position:absolute;z-index:50;right:12px;top:12px;display:flex;gap:4px;flex-wrap:wrap;max-width:min(72%,560px);padding:6px;border-radius:10px;background:rgba(12,12,16,.82);backdrop-filter:blur(10px);box-shadow:0 8px 28px rgba(0,0,0,.25)}.nw-edit-partbar button{pointer-events:auto!important;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.08);color:#fff;border-radius:7px;padding:4px 7px;font:600 10px/1.2 system-ui;cursor:pointer}.nw-edit-partbar button:hover,.nw-edit-partbar button.on{background:#7658ff;border-color:#9e8aff}.nw-part-isolate [data-wpart]{pointer-events:none!important}.nw-part-isolate .nw-part-edit-active{pointer-events:auto!important;z-index:45!important;opacity:1!important;outline:2px solid #8C6BFF!important;outline-offset:3px!important}';

/* ---------- Hero por capas: más capas de texto + selector de parte en edición ---------- */
(function(){
 var old=W.kinds.layeredhero;if(!old)return;
 var def=Object.assign({},old);
 def.defaults=Object.assign({},old.defaults,{texts:[]});
 var baseFields=(old.fields||[]).filter(function(f){return f.k!=='img4'&&f.k!=='img5';});
 var at=baseFields.findIndex(function(f){return f.k==='img3';});
 if(at>=0)baseFields.splice(at+1,0,{k:'img4',label:'Plano extra 4 (opcional)',type:'image'},{k:'img5',label:'Plano extra 5 (opcional)',type:'image'});
 var cpos=baseFields.findIndex(function(f){return f.type==='group'&&f.label==='Colores';});
 var extras={k:'texts',label:'Bloques de texto extra',type:'list',itemLabel:'text',add:{text:'Nuevo bloque de texto',style:'title'},item:[
  {k:'text',label:'Texto',type:'textarea'},{k:'style',label:'Estilo',type:'select',options:[['title','Título'],['body','Párrafo'],['label','Rótulo']]}
 ]};
 if(cpos<0)baseFields.push(extras);else baseFields.splice(cpos,0,{type:'group',label:'Texto extra'},extras);
 def.fields=[{type:'hint',text:'Liberá un texto para moverlo libremente. El tirador lateral modifica el ancho de la caja y el corte de líneas sin cambiar el tamaño de las letras; el tirador de esquina escala todo. En la vista móvil podés guardar otro ancho y «Restablecer móvil» vuelve al de escritorio.'}].concat(baseFields);
 def.markup=function(e,ctx){
  var esc=E(ctx),bg=col(e.bg)||'#0A0C12',fg=col(e.color)||onColor(bg),a=col(e.accent)||'#8C6BFF',tl=lines(e.title),extra=arr(e.texts),buttons=[];
  if(!tl.length)tl=['UNA ESCENA','CON PROFUNDIDAD'];
  function layer(id,n,cls){var u=imgUrl(ctx,id);if(!u&&n>1)return '';buttons.push(['layer-'+n,'Foto '+n]);return '<div class="nw-lh-layer '+cls+(u?'':' is-placeholder')+'" data-wpart="layer-'+n+'" style="'+heroPartCSS(e,'layer-'+n)+(u?'':'background:'+bgImg(ctx,'',n*2+1))+'">'+(u?'<img src="'+esc(u)+'" alt="" draggable="false">':'')+'</div>';}
  var layers=layer(e.img1,1,'l1')+layer(e.img2,2,'l2')+layer(e.img3,3,'l3')+layer(e.img4,4,'l4')+layer(e.img5,5,'l5');
  buttons.push(['eyebrow','Antetítulo'],['title','Título'],['sub','Texto']);
  var floating=[];
  function textNode(tag,part,attrs,html,cls){
   var saved=e&&e.__parts&&e.__parts[part],free=!!(saved&&saved.free);
   var className=(cls||'')+(free?' nw-lh-float nw-lh-float--'+part.replace(/[^a-z0-9-]/g,''):'');
   var node='<'+tag+(className?' class="'+className.trim()+'"':'')+' '+attrs+
    ' data-wpart="'+part+'" style="'+heroPartCSS(e,part)+'">'+html+'</'+tag+'>';
   if(free){
    floating.push(node);
    // Conservar la altura del bloque original para no desplazar los demás textos.
    // El marcador no es interactivo, no tiene data-wpart ni campo editable.
    return '<'+tag+(cls?' class="'+cls+'"':'')+' data-nw-slot="'+part+'" aria-hidden="true"'+
     ' style="visibility:hidden;pointer-events:none">'+html+'</'+tag+'>';
   }
   return node;
  }
  var ex='';
  extra.forEach(function(t,i){
   var sty=pick(t.style,['title','body','label'],'body'),tag=sty==='title'?'h3':sty==='label'?'b':'p',part='text-extra-'+i;
   buttons.push([part,'Texto '+(i+1)]);
   ex+=textNode(tag,part,'data-nw-listobj="texts" data-nw-row="'+i+'" data-nw-key="text"',esc(t.text||''),'nw-lh-extra nw-lh-extra--'+sty);
  });
  var eyebrow=textNode('b','eyebrow','data-wfield="eyebrow"',esc(e.eyebrow||''),'');
  var title=textNode('h2','title','data-wfield="title" data-wmulti="1"',tl.map(function(x){return esc(x);}).join('<br>'),'');
  var sub=textNode('p','sub','data-wfield="sub"',esc(e.sub||''),'');
  var bar=ctx.edit?'<div class="nw-edit-partbar" data-nw-partbar><button type="button" data-nw-part="">Todos</button>'+buttons.map(function(b){return '<button type="button" data-nw-part="'+b[0]+'">'+b[1]+'</button>';}).join('')+'</div>':'';
  return '<section class="nw-lh" data-nw-part-scope="hero" data-nw-part-mobile="600" data-nw-part-y="var(--h)"'+cfgAttr(ctx,{amount:num(e.amount,28,0,100)})+' style="'+cssVars({'--bg':bg,'--fg':fg,'--ac':a,'--h':num(e.h,640,260,1000)+'px','--r':num(e.round,24,0,70)+'px'})+'">'+bar+layers+'<div class="nw-lh-copy">'+eyebrow+title+sub+ex+'</div>'+floating.join('')+'</section>';
 };
 var css=PART+'.nw-lh{position:relative;width:100%;height:var(--h);container-type:inline-size;overflow:hidden;border-radius:var(--r);background:var(--bg);color:var(--fg);isolation:isolate}.nw-lh-layer{position:absolute;overflow:hidden;z-index:var(--nw-z,var(--nw-base-z,0));transition:transform .18s ease-out;transform:translate(var(--px,0px),var(--py,0px));background-position:center!important;background-size:cover!important}.nw-lh-layer>img{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:cover}.nw-lh .l1{inset:0;opacity:.72;--nw-base-z:0}.nw-lh .l2{--nw-base-z:2;width:48%;height:62%;right:7%;top:10%;border-radius:calc(var(--r)*.7);box-shadow:0 35px 80px -40px #000}.nw-lh .l3{--nw-base-z:3;width:31%;height:43%;right:38%;bottom:7%;border-radius:calc(var(--r)*.55);box-shadow:0 30px 70px -40px #000}.nw-lh .l4{--nw-base-z:4;width:24%;height:32%;right:4%;bottom:7%;border-radius:calc(var(--r)*.5)}.nw-lh .l5{--nw-base-z:5;width:20%;height:26%;right:58%;top:8%;border-radius:calc(var(--r)*.45)}.nw-lh:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,color-mix(in srgb,var(--bg) 76%,transparent) 0%,color-mix(in srgb,var(--bg) 18%,transparent) 50%,transparent 78%);pointer-events:none}.nw-lh .nw-lh-float{position:absolute;z-index:7;overflow-wrap:anywhere;left:var(--nw-fx,50cqw);top:var(--nw-fy,calc(var(--h)*.5));width:var(--nw-fw,42cqw);max-width:none;margin:0;translate:calc(-50% + var(--nw-tx,0px)) calc(-50% + var(--nw-ty,0px))}.nw-lh-float--eyebrow{font-size:10px;letter-spacing:.16em;color:var(--ac);font-weight:700}.nw-lh-float--title{font-size:clamp(50px,8cqw,120px);line-height:.84;letter-spacing:-.06em}.nw-lh-float--sub{font-size:13px;opacity:.72}.nw-lh-copy{position:absolute;z-index:6;left:6%;top:50%;translate:0 -50%;max-width:54%;display:grid;gap:18px}.nw-lh-copy>b{font-size:10px;letter-spacing:.16em;color:var(--ac)}.nw-lh-copy h2{margin:0;font-size:clamp(50px,8cqw,120px);line-height:.84;letter-spacing:-.06em}.nw-lh-copy p{margin:0;max-width:38ch;font-size:13px;opacity:.72}.nw-lh-extra{position:relative;margin:0;max-width:32ch}.nw-lh-extra--title{font-size:clamp(28px,4cqw,64px);line-height:.95;letter-spacing:-.04em}.nw-lh-extra--body{font-size:clamp(13px,1.4cqw,18px);line-height:1.45}.nw-lh-extra--label{font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:var(--ac)}@container (max-width:600px){.nw-lh-layer{z-index:var(--nw-mz,var(--nw-z,var(--nw-base-z,0)))}.nw-lh [data-wpart]{translate:var(--nw-mx,var(--nw-tx,0px)) var(--nw-my,var(--nw-ty,0px));rotate:var(--nw-mr,var(--nw-pr,0deg));scale:var(--nw-ms,var(--nw-ps,1))}.nw-lh .nw-lh-float{width:var(--nw-mfw,var(--nw-fw,42cqw));translate:calc(-50% + var(--nw-mx,var(--nw-tx,0px))) calc(-50% + var(--nw-my,var(--nw-ty,0px)))}.nw-lh-copy{max-width:82%}.nw-lh .l2{width:62%;right:-8%}.nw-lh .l3{width:42%;right:15%}}';
 function run(){scwBoot('__nwLayeredHero16','.nw-lh',function(el){if(scwRM())return;var amt=+(scwCfg(el).amount||24),ls=el.querySelectorAll('.nw-lh-layer');el.addEventListener('pointermove',function(ev){if(window.SC_EDIT&&el.classList.contains('nw-part-isolate'))return;var r=el.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width-.5,y=(ev.clientY-r.top)/r.height-.5;for(var i=0;i<ls.length;i++){var k=(i+1)/Math.max(1,ls.length);ls[i].style.setProperty('--px',(x*amt*k)+'px');ls[i].style.setProperty('--py',(y*amt*k)+'px');}});el.addEventListener('pointerleave',function(){for(var i=0;i<ls.length;i++){ls[i].style.setProperty('--px','0px');ls[i].style.setProperty('--py','0px');}});});}
 X.reg('layeredhero',def,css,RT(scwBoot,scwCfg,scwRM,run));
})();

function storyPartCSS(e,n){return partTransformCSS(e,n,'100vh');}

/* ---------- Tarjeta holográfica: piezas editables sobre el runtime original ---------- */
(function(){
 var old=W.kinds.holocard;if(!old)return;
 var def=Object.assign({},old);
 var items=[['card','Tarjeta'],['media','Imagen / video'],['badge','Etiqueta'],['title','Título'],['meta','Detalle'],['cta','Botón']];
 def.fields=[{type:'hint',text:'Usá la barra interna para seleccionar la foto o video, etiqueta, título, detalle y botón. Podés moverlos, girarlos o escalarlos por separado sin perder el efecto holográfico. Para cambios móviles, reducí el ancho de la tarjeta a 420 px o menos.'}].concat((old.fields||[]).filter(function(x){return x.type!=='hint';}));
 def.markup=function(e,ctx){
  var html=old.markup(e,ctx),ratio=pick(e.ratio,['4/5','1/1','3/4'],'4/5');
  var factor=ratio==='1/1'?'1':ratio==='3/4'?'1.333333':'1.25';
  var controls=items.filter(function(item){
   return item[0]==='card'||item[0]==='media'||item[0]==='title'||item[0]==='meta'||
    (item[0]==='badge'&&bool(e.showBadge,true))||(item[0]==='cta'&&bool(e.showCta,true));
  });
  var bar=ctx.edit?'<div class="nw-edit-partbar nw-holo-editbar" data-nw-partbar><button type="button" data-nw-part="">Todos</button>'+
   controls.map(function(item){return '<button type="button" data-nw-part="'+item[0]+'">'+item[1]+'</button>';}).join('')+'</div>':'';
  // Los elementos internos declaran sus partes, pero el escenario mantiene la inclinación 3D original.
  html=html.replace('class="nw-holo" data-wpart="card"',
   'class="nw-holo" data-wpart="card" data-nw-part-scope="holocard" data-nw-part-mobile="420"'+
   ' data-nw-part-height=".nw-holo-card" data-nw-part-y="var(--h)"');
  html=html.replace('class="nw-holo-card"','class="nw-holo-card" style="--h:calc(100cqw * '+factor+')"');
  items.forEach(function(item){html=partStyleMarkup(html,e,item[0],'var(--h)');});
  if(bar)html=html.replace(/(<div class="nw-holo"[^>]*>)/,'$1'+bar);
  return html;
 };
 // Conservar el CSS y runtime del recurso. Solo se superpone el contrato de edición.
 var css=(W.css&&W.css.holocard||'')+
  '.nw-holo{position:relative;container-type:inline-size;box-sizing:border-box}' +
  '.nw-holo [data-wpart],.nw-holo[data-wpart]{translate:var(--nw-tx,0px) var(--nw-ty,0px);rotate:var(--nw-pr,0deg);scale:var(--nw-ps,1)}' +
  '.nw-holo-editbar{left:8px;right:8px;top:8px;max-width:none;z-index:55;justify-content:center}' +
  '.nw-holo .nw-holo-copy [data-wpart]{position:relative;display:block;max-width:100%}' +
  '.nw-holo .nw-holo-badge[data-wpart]{max-width:88%}' +
  '@container (max-width:420px){.nw-holo [data-wpart]{translate:var(--nw-mx,var(--nw-tx,0px)) var(--nw-my,var(--nw-ty,0px));rotate:var(--nw-mr,var(--nw-pr,0deg));scale:var(--nw-ms,var(--nw-ps,1))}}';
 function run(){scwBoot('__nwHolo','.nw-holo',function(el){
  if(window.SC_EDIT||scwRM())return;
  var c=scwCfg(el),amt=+c.tilt||10;
  function mv(ev){var r=el.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width,y=(ev.clientY-r.top)/r.height;
   el.style.setProperty('--mx',(x*100)+'%');el.style.setProperty('--my',(y*100)+'%');
   el.style.setProperty('--ry',((x-.5)*amt)+'deg');el.style.setProperty('--rx',((.5-y)*amt)+'deg');}
  function out(){el.style.setProperty('--ry','0deg');el.style.setProperty('--rx','0deg');}
  el.addEventListener('pointermove',mv);el.addEventListener('pointerleave',out);
 });}
 X.reg('holocard',def,css,RT(scwBoot,scwCfg,scwRM,run));
})();

/* ---------- Medios interactivos: un adaptador para Revelado y Lupa ---------- */
(function(){
 function enhanceMedia(kind,selector,items,ratioDefault,threshold,run){
  var old=W.kinds[kind];if(!old)return;
  var def=Object.assign({},old);
  def.fields=[{type:'hint',text:kind==='cursorreveal'?
   'Seleccioná Imagen base, Imagen revelada o Etiqueta. Movelas, giralas o escalalas independientemente; los cambios móviles se guardan aparte y se conserva el revelado por cursor.':
   'Seleccioná Imagen o Texto. Ajustá cada pieza con el mouse; la Lupa sigue funcionando y podés guardar una distribución móvil independiente.'}].concat((old.fields||[]).filter(function(f){return f.type!=='hint';}));
  def.markup=function(e,ctx){
   var html=old.markup(e,ctx),ratio=pick(e.ratio,['16/9','4/3','1/1','3/2','3/4'],ratioDefault);
   var parts=ratio.split('/'),factor=(+parts[1]/+parts[0]).toFixed(6);
   var bar=ctx.edit?'<div class="nw-edit-partbar nw-media-editbar" data-nw-partbar><button type="button" data-nw-part="">Todos</button>'+
    items.map(function(p){return '<button type="button" data-nw-part="'+p[0]+'">'+p[1]+'</button>';}).join('')+'</div>':'';
   // Preservar estructura, variantes e imágenes reales creadas en v15.
   html=html.replace(/(<figure class="[^"]+")/,'$1 data-nw-part-scope="'+kind+'" data-nw-part-mobile="'+threshold+
    '" data-nw-part-y="var(--h)"');
   html=html.replace(/(<figure[^>]*style=")/,'$1--h:calc(100cqw * '+factor+');');
   items.forEach(function(item){html=partStyleMarkup(html,e,item[0],'var(--h)');});
   if(bar)html=html.replace(/(<figure[^>]*>)/,'$1'+bar);
   return html;
  };
  var css=(W.css&&W.css[kind]||'')+
   '.'+selector+'{container-type:inline-size;box-sizing:border-box}' +
   '.'+selector+' [data-wpart]{translate:var(--nw-tx,0px) var(--nw-ty,0px);rotate:var(--nw-pr,0deg);scale:var(--nw-ps,1)}' +
   '.'+selector+' .nw-media-editbar{left:8px;right:8px;top:8px;max-width:none;z-index:60;justify-content:center}' +
   (kind==='cursorreveal'?'.nw-cr.nw-part-isolate .nw-cr-top.nw-part-edit-active{clip-path:inset(0)!important}':'')+
   '@container (max-width:'+threshold+'px){.'+selector+' [data-wpart]{translate:var(--nw-mx,var(--nw-tx,0px)) var(--nw-my,var(--nw-ty,0px));rotate:var(--nw-mr,var(--nw-pr,0deg));scale:var(--nw-ms,var(--nw-ps,1))}}';
  X.reg(kind,def,css,RT(scwBoot,scwCfg,scwRM,run));
 }
 function runReveal(){
  scwBoot('__nwCursorReveal16','.nw-cr',function(el){
   if(scwRM())return;
   var c=scwCfg(el),rad=+c.rad||160,top=el.querySelector('.nw-cr-top');if(!top)return;
   top.style.clipPath='circle('+rad+'px at 50% 50%)';
   function set(ev){
    if(window.SC_EDIT&&el.classList.contains('nw-part-isolate'))return;
    var r=el.getBoundingClientRect(),x=Math.max(0,Math.min(r.width,ev.clientX-r.left)),y=Math.max(0,Math.min(r.height,ev.clientY-r.top));
    top.style.clipPath='circle('+rad+'px at '+x+'px '+y+'px)';
    el.style.setProperty('--cx',x+'px');el.style.setProperty('--cy',y+'px');el.classList.add('is-on');
   }
   el.addEventListener('pointermove',set);el.addEventListener('pointerenter',set);
   el.addEventListener('pointerleave',function(){el.classList.remove('is-on');});
  });
 }
 function runMagnifier(){
  scwBoot('__nwMagnifier16','.nw-mag',function(el){
   if(scwRM())return;
   var lens=el.querySelector('.nw-mag-lens'),li=lens&&lens.querySelector('img'),c=scwCfg(el),zoom=Math.max(1,+c.zoom||2.2);
   function set(ev){
    if(window.SC_EDIT&&el.classList.contains('nw-part-isolate'))return;
    var r=el.getBoundingClientRect(),x=Math.max(0,Math.min(r.width,ev.clientX-r.left)),y=Math.max(0,Math.min(r.height,ev.clientY-r.top));
    el.style.setProperty('--lx',x+'px');el.style.setProperty('--ly',y+'px');
    if(li){var L=lens.getBoundingClientRect().width||180;li.style.width=(r.width*zoom)+'px';li.style.height=(r.height*zoom)+'px';
     li.style.left=(L/2-x*zoom)+'px';li.style.top=(L/2-y*zoom)+'px';}
    el.classList.add('is-on');
   }
   el.addEventListener('pointermove',set);el.addEventListener('pointerenter',set);
   el.addEventListener('pointerleave',function(){el.classList.remove('is-on');});
  });
 }
 enhanceMedia('cursorreveal','nw-cr',[['base','Imagen base'],['reveal','Imagen revelada'],['label','Etiqueta']],'16/9',600,runReveal);
 enhanceMedia('detailmagnifier','nw-mag',[['image','Imagen'],['caption','Texto']],'4/3',600,runMagnifier);
})();

/* ---------- Composiciones fotográficas: edición adaptable sin otro motor ---------- */
// Los decoradores de v14 ya identifican las fotos. Este adaptador reutiliza esos
// data-wpart y extiende el mismo contrato de Hero a Collage y Moodboard.
(function(){
 function enhance(kind,rootClass,stageSelector,images,extra,fields){
  var old=W.kinds[kind];if(!old)return;extra=extra||{};
  var def=Object.assign({},old);
  def.fields=[{type:'hint',text:extra.hint||'Seleccioná una foto o un texto desde la barra o el lienzo. Mové, escalá y girá cada pieza; la distribución móvil se guarda aparte y las composiciones anteriores siguen funcionando.'}]
   .concat((old.fields||[]).filter(function(f){return f.type!=='hint';}));
  def.markup=function(e,ctx){
   var t=document.createElement('template');t.innerHTML=old.markup(e,ctx);
   var root=t.content.firstElementChild;if(!root)return t.innerHTML;
   root.setAttribute('data-nw-part-scope',kind);
   root.setAttribute('data-nw-part-mobile',String(extra.mobile||600));
   if(stageSelector)root.setAttribute('data-nw-part-height',stageSelector);
   root.setAttribute('data-nw-part-y',extra.unitY||'var(--h)');
   // v14 no identificaba los dos textos del pie como partes movibles.
   (fields||[]).forEach(function(a){
    // Un selector puede representar una parte o una familia de piezas repetidas.
    // Se conservan IDs deterministas: color-0, color-1..., sin campos paralelos.
    var nodes=a[2]?root.querySelectorAll(a[1]):[root.querySelector(a[1])];
    nodes.forEach(function(node,i){
     if(node)node.setAttribute('data-wpart',a[0]+(a[2]?'-'+i:''));
    });
   });
   var parts=[];
   root.querySelectorAll('[data-wpart]').forEach(function(n){
    var name=n.getAttribute('data-wpart'),label=extra.labels&&extra.labels[name]||(/^image-/.test(name)?'Foto '+(+name.split('-')[1]+1):name==='label'?'Rótulo':name==='caption'?'Descripción':name);
    parts.push([name,label]);
   });
   if(ctx&&ctx.edit){
    var nav=document.createElement('nav');nav.className='nw-edit-partbar nw-photo-editbar';
    nav.setAttribute('data-nw-partbar','');
    var all=document.createElement('button');all.type='button';all.setAttribute('data-nw-part','');all.textContent='Todos';nav.appendChild(all);
    parts.forEach(function(a){var b=document.createElement('button');b.type='button';b.setAttribute('data-nw-part',a[0]);b.textContent=a[1];nav.appendChild(b);});
    root.insertBefore(nav,root.firstChild);
   }
   var html=t.innerHTML;
   parts.forEach(function(a){html=partStyleMarkup(html,e,a[0],extra.unitY||'var(--h)');});
   return html;
  };
  // La antigua regla .nw-part-t tenía especificidad mayor: el modo móvil
  // debe prevalecer sobre esa regla sin perder CSS de fotografías ni layout.
  var partSel='.'+rootClass+' [data-wpart],.el.wdg.wk-'+kind+' .'+rootClass+' [data-wpart]';
  var css=(W.css&&W.css[kind]||'')+
   '.'+rootClass+'{position:relative;container-type:inline-size;isolation:isolate}' +
   '.'+rootClass+' .nw-photo-editbar{position:absolute;display:flex;flex-wrap:wrap;gap:4px;left:10px;right:10px;top:10px;max-width:calc(100% - 20px);max-height:110px;padding:6px;border-radius:10px;background:rgba(12,12,16,.85);overflow:auto;z-index:70;box-sizing:border-box;box-shadow:0 8px 28px -12px #000;pointer-events:auto}' +
   '.'+rootClass+' .nw-photo-editbar button{pointer-events:auto;border:1px solid rgba(255,255,255,.2);border-radius:6px;background:rgba(255,255,255,.1);color:#fff;padding:4px 7px;font:600 10px/1.2 system-ui;cursor:pointer}' +
   '.'+rootClass+' .nw-photo-editbar button:hover,.'+rootClass+' .nw-photo-editbar button.on{background:#7658ff;border-color:#9e8aff}' +
   (extra.css||'')+
   partSel+'{translate:var(--nw-tx,0px) var(--nw-ty,0px);rotate:var(--nw-pr,0deg);scale:var(--nw-ps,1)}' +
   '@container (max-width:'+(extra.mobile||600)+'px){'+partSel+'{translate:var(--nw-mx,var(--nw-tx,0px)) var(--nw-my,var(--nw-ty,0px));rotate:var(--nw-mr,var(--nw-pr,0deg));scale:var(--nw-ms,var(--nw-ps,1))}}';
  X.reg(kind,def,css,W.runtime&&W.runtime[kind]||'');
 }
 enhance('editorialcollage','scx-ec','.scx-ec-grid',3,{
  css:'.scx-ec .scx-ec-grid,.scx-ec figcaption{--h:clamp(300px,48cqw,620px)}'+
   '.scx-ec--square .scx-ec-grid,.scx-ec--square figcaption{--h:min(78cqw,650px)}'+
   '.scx-ec--tall .scx-ec-grid,.scx-ec--tall figcaption{--h:min(100cqw,800px)}'+
   '.scx-ec .scx-ec-grid{height:var(--h)}'+
   '@container (max-width:560px){.scx-ec .scx-ec-grid,.scx-ec figcaption{--h:90cqw}}'
 },[['label','.scx-ec figcaption b'],['caption','.scx-ec figcaption span']]);
 enhance('moodboard','scx-mb','.scx-mb > div',6,{
  css:'.scx-mb>div,.scx-mb figcaption{--h:clamp(320px,55cqw,680px)}'+
   '.scx-mb>div{height:var(--h)}'+
   '@container (max-width:600px){.scx-mb>div,.scx-mb figcaption{--h:90cqw}}'
 },[['label','figcaption']]);
 // Cuatro composiciones de altura variable: conservar su flujo CSS y medir
 // las dos coordenadas respecto del ancho útil de su propio contenedor.
 // Así no hay que inventar una altura fija para maquetas de texto adaptable.
 enhance('splitfeature','scx-sf',null,2,{
  unitY:'100cqw',hint:'Editá imagen principal, imagen secundaria y los bloques de texto desde el lienzo; las posiciones móviles se guardan aparte.',
  labels:{'main-image':'Imagen principal','detail-image':'Imagen secundaria',kicker:'Rótulo',title:'Título',text:'Descripción'}
 },[['kicker','.scx-sf-side b'],['text','.scx-sf-side p']]);
 enhance('floatingcaption','scx-fc',null,1,{
  unitY:'100cqw',hint:'Mové la imagen, el recuadro flotante y sus textos por separado. Conservá variantes de escritorio y móvil.',
  labels:{image:'Imagen','caption-card':'Recuadro',eyebrow:'Rótulo',title:'Título',text:'Descripción'}
 },[['eyebrow','.scx-fc figcaption b'],['text','.scx-fc figcaption p']]);
 enhance('casehero','scx-ch',null,1,{
  unitY:'100cqw',hint:'Editá imagen, título y metadatos sin perder los diseños Split, Overlay e Imagen inferior.',
  labels:{image:'Imagen',eyebrow:'Rótulo',title:'Título',meta:'Información',year:'Año'}
 },[['eyebrow','.scx-ch-copy>b'],['meta','.scx-ch-copy>div span'],['year','.scx-ch-copy>div strong']]);
 enhance('bentoshow','scx-bs',null,2,{
  unitY:'100cqw',hint:'Seleccioná las dos imágenes, la cifra, el rótulo y los textos de Bento por separado.',
  labels:{'image-0':'Imagen 1','image-1':'Imagen 2',stat:'Cifra','stat-label':'Rótulo', 'copy-title':'Antetítulo','copy-text':'Texto'}
 },[['stat-label','.scx-bs-stat span'],['copy-title','.scx-bs-copy b'],['copy-text','.scx-bs-copy p']]);

 // Un solo adaptador para composiciones de texto, identidad y afiches;
 // la fuente de verdad visual sigue siendo cada recurso v14.
 enhance('editorialposter','scx-ep',null,0,{
  unitY:'100cqw',labels:{eyebrow:'Antetítulo',number:'Número',title:'Título',note:'Nota'},
  hint:'Acomodá antetítulo, número, título y nota por separado, sin cambiar la composición editorial.'
 });
 enhance('bignumber','scx-bn',null,0,{
  unitY:'100cqw',labels:{number:'Cifra',label:'Rótulo',text:'Texto'},
  hint:'Mové la cifra principal, el rótulo y la descripción con posiciones independientes para móvil.'
 },[['number','.scx-bn-num'],['label','.scx-bn-copy b'],['text','.scx-bn-copy p']]);
 enhance('pullquote','scx-pq',null,0,{
  unitY:'100cqw',labels:{quote:'Cita',author:'Autor',role:'Cargo',mark:'Comillas o línea'},
  hint:'Editá la cita, el autor, el cargo y el signo gráfico independientemente.'
 },[['author','footer b'],['role','footer span'],['mark',':scope > i']]);
 enhance('typespecimen','scx-ts',null,0,{
  unitY:'100cqw',labels:{kicker:'Rótulo',note:'Nota',hero:'Muestra principal',upper:'Texto superior',lower:'Texto inferior',nums:'Números'},
  hint:'Reordená los seis bloques de la muestra tipográfica desde el lienzo.'
 },[['kicker','header b'],['note','header span'],['upper','.scx-ts-grid p.up'],['lower','.scx-ts-grid p:not(.up)'],['nums','.scx-ts-grid em']]);
 enhance('eventposter','scx-ev',null,0,{
  unitY:'100cqw',labels:{date:'Fecha',symbol:'Símbolo',title:'Título',place:'Lugar',cta:'Llamado a la acción'},
  hint:'Mové título, fecha, símbolo, lugar y llamado a la acción sin alterar el afiche original.'
 },[['date','header b'],['symbol','header i'],['place','footer span'],['cta','footer strong']]);
 enhance('splitstatement','scx-ss',null,0,{
  unitY:'100cqw',labels:{eyebrow:'Antetítulo',title:'Título',image:'Imagen'},
  hint:'Editá el titular, antetítulo y fotografía conservando las variantes de división.'
 },[['eyebrow','.scx-ss-copy>b']]);
 enhance('brandboard','scx-bb',null,4,{
  unitY:'100cqw',labels:{'swatch-0':'Color 1','swatch-1':'Color 2','swatch-2':'Color 3','swatch-3':'Color 4',
   brand:'Marca',tagline:'Lema',sample:'Muestra'},
  hint:'Acomodá los cuatro colores y los textos de la presentación de marca. Sus valores se siguen editando en el inspector.'
 },[['swatch','.scx-bb-sw i',true],['brand','.scx-bb-copy b'],['tagline','.scx-bb-copy span'],['sample','.scx-bb-copy em']]);
})(); 

/* ---------- Composiciones reactivas: edición estable + movimiento independiente ---------- */
// Un mismo adaptador permite editar las líneas tipográficas y las fotos de una grilla.
// Las poses del autor van en --nw-tx/ty/ps, la animación nunca sobrescribe style.translate/scale.
(function(){
 function enhance(kind,selector,parts,renderExtra,run){
  var old=W.kinds[kind];if(!old)return;
  var def=Object.assign({},old);
  def.fields=[{type:'hint',text:kind==='depthheadline'?
   'Elegí una línea desde la barra para moverla, escalarla o girarla independientemente. La reacción 3D al cursor se suma a tu diseño, sin reemplazarlo. En móvil podés guardar una distribución distinta.':
   'Seleccioná cada fotografía o la etiqueta desde la barra. Podés acomodarlas por separado; la atracción al cursor conserva las posiciones diseñadas y funciona en la página publicada.'}]
   .concat((old.fields||[]).filter(function(field){return field.type!=='hint';}));
  def.markup=function(e,ctx){
   var html=old.markup(e,ctx),actual=parts(e),height=num(e.h,kind==='depthheadline'?440:520,240,1000);
   if(kind==='magneticmosaic'){
    // La etiqueta ya era editable en el inspector, pero no tenía selección de parte interna.
    html=html.replace('data-wfield="label"','data-wfield="label" data-wpart="label"');
   }
   var root=new RegExp('(<'+(kind==='depthheadline'?'div':'figure')+' class="[^"]+")','i');
   html=html.replace(root,'$1 data-nw-part-scope="'+kind+'" data-nw-part-mobile="680" data-nw-part-y="var(--h)"');
   html=html.replace(new RegExp('(<'+(kind==='depthheadline'?'div':'figure')+' class="[^"]+"[^>]*style=")','i'),'$1--h:'+height+'px;');
   for(var i=0;i<actual.length;i++)html=partStyleMarkup(html,e,actual[i][0],'var(--h)');
   if(ctx.edit){
    var bar='<div class="nw-edit-partbar nw-pointer-editbar" data-nw-partbar><button type="button" data-nw-part="">Todos</button>'+
     actual.map(function(item){return '<button type="button" data-nw-part="'+item[0]+'">'+item[1]+'</button>';}).join('')+'</div>';
    html=html.replace(new RegExp('(<'+(kind==='depthheadline'?'div':'figure')+' class="[^"]+"[^>]*>)','i'),'$1'+bar);
   }
   return html;
  };
  var css=(W.css&&W.css[kind]||'')+
   '.'+selector+'{position:relative;container-type:inline-size;isolation:isolate}' +
   '.'+selector+' .nw-pointer-editbar{left:8px;right:8px;top:8px;max-width:none;justify-content:center;z-index:70}' +
   '.'+selector+' [data-wpart]{translate:calc(var(--nw-tx,0px) + var(--nw-hover-x,0px)) calc(var(--nw-ty,0px) + var(--nw-hover-y,0px));rotate:var(--nw-pr,0deg);scale:calc(var(--nw-ps,1) * var(--nw-hover-s,1))}' +
   '@container (max-width:680px){.'+selector+' [data-wpart]{translate:calc(var(--nw-mx,var(--nw-tx,0px)) + var(--nw-hover-x,0px)) calc(var(--nw-my,var(--nw-ty,0px)) + var(--nw-hover-y,0px));rotate:var(--nw-mr,var(--nw-pr,0deg));scale:calc(var(--nw-ms,var(--nw-ps,1)) * var(--nw-hover-s,1))}}' +
   (kind==='depthheadline'?
    '.nw-dh .nw-dh-line{transform:var(--nw-hover-transform,translateZ(calc(var(--i) * var(--d))));transition:transform .18s ease-out,translate .18s ease-out,scale .18s ease-out}':
    '.nw-mm .nw-mm-grid i{transition:translate .18s ease-out,scale .18s ease-out}')+
   '@media(prefers-reduced-motion:reduce){.'+selector+' [data-wpart]{--nw-hover-x:0px;--nw-hover-y:0px;--nw-hover-s:1}'+
    (kind==='depthheadline'?'.nw-dh .nw-dh-line{transform:none!important;translate:calc(var(--nw-tx,0px) + var(--nw-hover-x,0px)) calc(var(--nw-ty,0px) + var(--nw-hover-y,0px))!important;scale:var(--nw-ps,1)!important}':
      '.nw-mm .nw-mm-grid i{translate:calc(var(--nw-tx,0px) + var(--nw-hover-x,0px)) calc(var(--nw-ty,0px) + var(--nw-hover-y,0px))!important;scale:var(--nw-ps,1)!important}')+
   '}';
  X.reg(kind,def,css,RT(scwBoot,scwCfg,scwRM,run));
 }
 function depthParts(e){
  var strings=lines(e.text);if(!strings.length)strings=['DESIGN','IN MOTION','WITH DEPTH'];
  return strings.map(function(s,i){return ['line-'+i,'Línea '+(i+1)];});
 }
 function mosaicParts(){
  return [['image-0','Imagen 1'],['image-1','Imagen 2'],['image-2','Imagen 3'],['image-3','Imagen 4'],['label','Etiqueta']];
 }
 function depthRuntime(){
  scwBoot('__nwDepthTitle16','.nw-dh',function(el){
   if(window.SC_EDIT||scwRM())return;
   var cfg=scwCfg(el),amp=(+cfg.amount||34)/100,mode=cfg.reaction||'tilt3d',dep=+cfg.depth||14,ls=el.querySelectorAll('.nw-dh-line');
   function pose(node,i,x,y,z,transform){
    node.style.setProperty('--nw-hover-x',x+'px');node.style.setProperty('--nw-hover-y',y+'px');
    node.style.setProperty('--nw-hover-s',z);
    node.style.setProperty('--nw-hover-transform',transform||'translateZ('+(i*dep)+'px)');
   }
   function reset(){for(var i=0;i<ls.length;i++)pose(ls[i],i,0,0,1);}
   reset();if(mode==='none')return;
   el.addEventListener('pointermove',function(ev){
    var r=el.getBoundingClientRect(),x=(ev.clientX-r.left)/Math.max(1,r.width)-.5,
      y=(ev.clientY-r.top)/Math.max(1,r.height)-.5;
    for(var i=0;i<ls.length;i++){
     var k=(i+1)/Math.max(1,ls.length),sg=i%2?-1:1,z='translateZ('+(i*dep)+'px)',dx=0,dy=0,sc=1;
     if(mode==='parallax'){dx=x*90*amp*k;dy=y*55*amp*k;}
     else if(mode==='tilt3d'){
      dx=x*24*amp*k;dy=y*12*amp*k;
      z+=' rotateX('+(-y*18*amp)+'deg) rotateY('+(x*24*amp)+'deg)';
     }else if(mode==='explode'){dx=x*150*amp*k*sg;dy=y*100*amp*k;sc=1+Math.abs(x+y)*.12*amp*k;}
     else if(mode==='wave'){
      dx=x*70*amp*Math.sin(i+1);dy=y*60*amp*Math.cos(i*.8);
      z+=' rotateZ('+(x*6*amp*sg)+'deg)';
     }
     pose(ls[i],i,dx,dy,sc,z);
    }
   });
   el.addEventListener('pointerleave',reset);
  });
 }
 function mosaicRuntime(){
  scwBoot('__nwMagMosaic16','.nw-mm',function(el){
   if(window.SC_EDIT||scwRM())return;
   var cfg=scwCfg(el),amt=+cfg.strength||20,cards=el.querySelectorAll('.nw-mm-grid i');
   el.addEventListener('pointermove',function(ev){
    var outer=el.getBoundingClientRect(),mx=ev.clientX-outer.left,my=ev.clientY-outer.top;
    for(var i=0;i<cards.length;i++){
     var r=cards[i].getBoundingClientRect(),cx=r.left-outer.left+r.width/2,cy=r.top-outer.top+r.height/2;
     var dx=mx-cx,dy=my-cy,dist=Math.max(70,Math.sqrt(dx*dx+dy*dy)),k=Math.min(1,170/dist);
     cards[i].style.setProperty('--nw-hover-x',(dx/dist*amt*k)+'px');
     cards[i].style.setProperty('--nw-hover-y',(dy/dist*amt*k)+'px');
     cards[i].style.setProperty('--nw-hover-s',String(1+.035*k));
    }
   });
   el.addEventListener('pointerleave',function(){
    for(var i=0;i<cards.length;i++){
     cards[i].style.setProperty('--nw-hover-x','0px');cards[i].style.setProperty('--nw-hover-y','0px');
     cards[i].style.setProperty('--nw-hover-s','1');
    }
   });
  });
 }
 enhance('depthheadline','nw-dh',depthParts,null,depthRuntime);
 enhance('magneticmosaic','nw-mm',mosaicParts,null,mosaicRuntime);
})();

/* ---------- Historia sticky: selector de capítulo para editar texto e imagen ---------- */
(function(){
 var old=W.kinds.scrollstory;if(!old)return;
 var def=Object.assign({},old);
 def.fields=[{type:'hint',text:'Elegí el capítulo 1, 2 o 3 y después Imagen, Rótulo, Título o Texto. Ahora sus posiciones se adaptan proporcionalmente al ancho de pantalla y podés ajustarlas por separado en vista móvil sin afectar escritorio.'}].concat((old.fields||[]).filter(function(f){return f.type!=='hint';}));
 def.markup=function(e,ctx){
  var esc=E(ctx),bg=col(e.bg)||'#F1EEE7',fg=col(e.color)||onColor(bg),a=col(e.accent)||'#C0522B',side=pick(e.mediaSide,['left','right'],'left'),h='',m='';
  for(var i=1;i<=3;i++){h+='<article class="nw-story-step'+(i===1?' is-active':'')+'" data-nw-story-step="'+i+'"><b data-wfield="k'+i+'" data-wpart="k'+i+'" style="'+storyPartCSS(e,'k'+i)+'">'+esc(e['k'+i]||'')+'</b><h3 data-wfield="t'+i+'" data-wpart="t'+i+'" style="'+storyPartCSS(e,'t'+i)+'">'+esc(e['t'+i]||'')+'</h3><p data-wfield="c'+i+'" data-wmulti="1" data-wpart="c'+i+'" style="'+storyPartCSS(e,'c'+i)+'">'+esc(e['c'+i]||'')+'</p></article>';var u=imgUrl(ctx,e['img'+i]);m+='<i class="nw-story-media'+(i===1?' is-active':'')+(u?'':' is-placeholder')+'" data-nw-story-media="'+i+'" data-wpart="media-'+i+'" style="'+storyPartCSS(e,'media-'+i)+(u?'':'background:'+bgImg(ctx,'',i*3))+'">'+(u?'<img src="'+esc(u)+'" alt="" draggable="false">':'')+'</i>';}
  var bar=ctx.edit?'<div class="nw-edit-partbar nw-story-editbar"><span class="nw-story-chs"><button type="button" class="on" data-nw-story-ch="1">Capítulo 1</button><button type="button" data-nw-story-ch="2">Capítulo 2</button><button type="button" data-nw-story-ch="3">Capítulo 3</button><button type="button" data-nw-story-live="1">Seguir scroll</button></span><span class="nw-story-parts"><button type="button" data-nw-story-part="media">Imagen</button><button type="button" data-nw-story-part="k">Rótulo</button><button type="button" data-nw-story-part="t">Título</button><button type="button" data-nw-story-part="c">Texto</button><button type="button" data-nw-story-part="all">Todos</button></span></div>':'';
  return '<section class="nw-story nw-story--'+side+'" data-nw-part-scope="story" data-nw-part-mobile="720" data-nw-part-y="100vh" data-nw-part-height=".nw-story-sticky" style="'+cssVars({'--bg':bg,'--fg':fg,'--ac':a,'--len':num(e.length,300,160,560)+'vh','--r':num(e.round,18,0,60)+'px'})+'">'+bar+'<div class="nw-story-sticky"><div class="nw-story-visual">'+m+'<span></span></div><div class="nw-story-copy">'+h+'<div class="nw-story-progress"><i></i></div></div></div></section>';
 };
 var css=PART+'.nw-story-editbar{left:12px;right:12px;top:12px;max-width:none;justify-content:space-between}.nw-story-editbar>span{display:flex;gap:4px;flex-wrap:wrap}.nw-story{position:relative;width:100%;container-type:inline-size;height:var(--len);background:var(--bg);color:var(--fg)}.nw-story-sticky{position:sticky;top:0;height:100vh;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(280px,.85fr);gap:clamp(28px,5vw,80px);align-items:center;padding:clamp(24px,5vw,74px);box-sizing:border-box;overflow:hidden}.nw-story--right .nw-story-visual{order:2}.nw-story-visual{position:relative;height:min(72vh,760px);overflow:hidden;border-radius:var(--r);background:#111}.nw-story-media{position:absolute;inset:0;overflow:hidden;background-size:cover!important;background-position:center!important;opacity:0;scale:calc(var(--nw-ps,1)*1.035);transition:opacity .55s ease,scale 1.1s cubic-bezier(.2,.8,.2,1)}.nw-story-media>img{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:cover}.nw-story-media.is-active{opacity:1;scale:var(--nw-ps,1)}.nw-story-visual>span{position:absolute;inset:0;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);border-radius:inherit;pointer-events:none}.nw-story-copy{position:relative;min-height:310px;display:grid;align-items:center}.nw-story-step{grid-area:1/1;opacity:0;translate:0 24px;pointer-events:none;transition:opacity .4s ease,translate .55s cubic-bezier(.2,.8,.2,1)}.nw-story-step.is-active{opacity:1;translate:0 0;pointer-events:auto}.nw-story-step>b{font-size:10px;letter-spacing:.16em;color:var(--ac)}.nw-story-step h3{margin:16px 0 12px;font-size:clamp(38px,6cqw,78px);line-height:.92;letter-spacing:-.045em}.nw-story-step p{margin:0;max-width:42ch;line-height:1.55;opacity:.7}.nw-story-progress{position:absolute;left:0;right:0;bottom:-34px;height:2px;background:color-mix(in srgb,var(--fg) 16%,transparent)}.nw-story-progress i{display:block;width:calc(var(--storyP,0)*100%);height:100%;background:var(--ac)}@container (max-width:720px){.nw-story [data-wpart]{translate:var(--nw-mx,var(--nw-tx,0px)) var(--nw-my,var(--nw-ty,0px));rotate:var(--nw-mr,var(--nw-pr,0deg));scale:var(--nw-ms,var(--nw-ps,1))}.nw-story-media.is-active{scale:var(--nw-ms,var(--nw-ps,1))}.nw-story-media:not(.is-active){scale:calc(var(--nw-ms,var(--nw-ps,1))*1.035)}.nw-story-sticky{grid-template-columns:1fr;grid-template-rows:56vh auto;align-content:center}.nw-story--right .nw-story-visual{order:0}.nw-story-copy{min-height:220px}}';
 // Escena de altura automática para Historia sticky en lienzo libre,
 // sin cambiar las escenas libres que no contienen esta composición.
 css+='.sc.free:has(> .inner > .el.wk-scrollstory){min-height:0!important;display:block}'+
  '.sc.free:has(> .inner > .el.wk-scrollstory)>.inner{position:relative!important;inset:auto!important;display:block!important;width:100%!important;max-width:none!important}'+
  '.sc.free:has(> .inner > .el.wk-scrollstory)>.inner>.el.wk-scrollstory{position:relative!important;left:auto!important;top:auto!important;transform:none!important;width:100%!important;margin:0!important}';
 function run(){scwBoot('__nwScrollStory16','.nw-story',function(el){freeStickyRunway(el);var cards=el.querySelectorAll('.nw-story-step'),media=el.querySelectorAll('.nw-story-media'),busy=0;function upd(){busy=0;if(window.SC_EDIT&&el.__nwStoryManual)return;var r=el.getBoundingClientRect(),span=Math.max(1,r.height-innerHeight),p=Math.max(0,Math.min(.999,-r.top/span)),idx=Math.min(cards.length-1,Math.floor(p*cards.length));for(var i=0;i<cards.length;i++){cards[i].classList.toggle('is-active',i===idx);if(media[i])media[i].classList.toggle('is-active',i===idx);}el.style.setProperty('--storyP',p);}function req(){if(!busy){busy=1;requestAnimationFrame(upd);}}upd();addEventListener('scroll',req,{passive:true});addEventListener('resize',req);});}
 X.reg('scrollstory',def,css,RT(scwBoot,run));
})();

/* ---------- Cinta cinética: sticky horizontal, recorre todas las tarjetas antes de salir ---------- */
(function(){
 var old=W.kinds.kineticstrip;if(!old)return;
 var def=Object.assign({},old);
 def.defaults=Object.assign({},old.defaults,{perCard:52,cardW:36,cardH:68,showProgress:true});
 var oldProjects=(old.fields||[]).find(function(f){return f.k==='projects';});
 def.fields=[
  oldProjects||{k:'projects',label:'Proyectos',type:'list',itemLabel:'title',add:{img:'',title:'Nuevo proyecto',href:'#'},item:[{k:'img',label:'Imagen',type:'image'},{k:'title',label:'Título',type:'text'},{k:'href',label:'Link',type:'url'}]},
  {type:'group',label:'Recorrido'},
  {k:'perCard',label:'Scroll por proyecto',type:'range',min:28,max:100,step:2,unit:'vh'},
  {k:'cardW',label:'Ancho de tarjeta',type:'range',min:22,max:72,step:1,unit:'vw'},
  {k:'cardH',label:'Alto de tarjeta',type:'range',min:36,max:82,step:1,unit:'vh'},
  {k:'label',label:'Rótulo general',type:'text'},{k:'gap',label:'Separación',type:'range',min:0,max:60,step:1,unit:'px'},{k:'tilt',label:'Rotación alternada',type:'range',min:0,max:10,step:.5,unit:'°'},{k:'round',label:'Redondeo',type:'range',min:0,max:40,step:1,unit:'px'},
  {k:'showProgress',label:'Mostrar barra de scroll',type:'bool'},
  {type:'group',label:'Colores'},{k:'bg',label:'Fondo',type:'color'},{k:'color',label:'Texto',type:'color'},{k:'accent',label:'Acento',type:'color'},
  {type:'hint',text:'La escena queda fija hasta que la última tarjeta haya pasado. Las tarjetas no se arrastran en la vista previa; el usuario solo las recorre con el scroll.'}
 ];
 def.markup=function(e,ctx){
  var esc=E(ctx),bg=col(e.bg)||'#0B0D12',fg=col(e.color)||onColor(bg),a=col(e.accent)||'#FF6B8A',projects=arr(e.projects),cards='',n=projects.length;
  if(!n){for(var z=1;z<=5;z++)if(e['img'+z])projects.push({img:e['img'+z],title:'Proyecto '+z,href:'#'});n=projects.length;}
  if(!n&&ctx.edit)projects=[{img:'',title:'Agregá un proyecto',href:'#'}],n=1;
  projects.forEach(function(p,i){var u=imgUrl(ctx,p.img),href=str(p.href||'').trim()||'#';cards+='<a class="nw-ks-card" href="'+esc(href)+'" style="--i:'+(i+1)+'">'+(u?'<img src="'+esc(u)+'" alt="" draggable="false">':'<i style="background:'+bgImg(ctx,'',i*2)+'"></i>')+(p.title?'<strong>'+esc(p.title)+'</strong>':'')+'</a>';});
  var len=Math.max(180,100+n*num(e.perCard,52,20,120));
  return '<section class="nw-ks" style="'+cssVars({'--bg':bg,'--fg':fg,'--ac':a,'--gap':num(e.gap,18,0,80)+'px','--r':num(e.round,16,0,60)+'px','--cw':num(e.cardW,36,18,86)+'vw','--ch':num(e.cardH,68,30,88)+'vh','--tilt':num(e.tilt,4,0,14)+'deg','--len':len+'vh'})+'"><div class="nw-ks-sticky"><header><b data-wfield="label">'+esc(e.label||'')+'</b><span></span></header><div class="nw-ks-clip"><div class="nw-ks-track">'+cards+'</div></div>'+(bool(e.showProgress,true)?'<small class="nw-ks-progress">SCROLL <i></i></small>':'')+'</div></section>';
 };
 var css='.nw-ks{position:relative;width:100%;height:var(--len);background:var(--bg);color:var(--fg)}.nw-ks-sticky{position:sticky;top:0;height:100vh;box-sizing:border-box;padding:clamp(20px,4vw,52px) 0;overflow:hidden;display:flex;flex-direction:column;justify-content:center}.nw-ks header{display:flex;align-items:center;gap:16px;padding:0 clamp(20px,4vw,52px);margin-bottom:clamp(18px,3vw,34px)}.nw-ks header b{font-size:10px;letter-spacing:.16em}.nw-ks header span{height:2px;background:var(--ac);flex:1}.nw-ks-clip{width:100%;overflow:hidden}.nw-ks-track{display:flex;align-items:center;gap:var(--gap);width:max-content;padding:0 max(6vw,40px);will-change:transform;transform:translate3d(var(--tx,0px),0,0)}.nw-ks-card{position:relative;display:block;flex:0 0 var(--cw);height:var(--ch);border-radius:var(--r);overflow:hidden;box-shadow:0 30px 65px -42px #000;rotate:calc((var(--i) - 3)*var(--tilt)*.22);text-decoration:none;color:#fff;background:#18191f;transition:scale .35s ease,filter .35s ease}.nw-ks-card>img,.nw-ks-card>i{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background-position:center!important;background-size:cover!important}.nw-ks-card:after{content:"";position:absolute;inset:45% 0 0;background:linear-gradient(transparent,rgba(0,0,0,.7));pointer-events:none}.nw-ks-card>strong{position:absolute;z-index:2;left:20px;right:20px;bottom:18px;font-size:clamp(18px,2.2vw,30px);line-height:1.05;letter-spacing:-.03em}.nw-ks-card:hover{scale:1.025;filter:saturate(1.08)}.nw-ks-progress{position:absolute;left:clamp(20px,4vw,52px);right:clamp(20px,4vw,52px);bottom:18px;display:flex;align-items:center;gap:12px;font:700 9px/1 system-ui;letter-spacing:.14em;opacity:.55}.nw-ks-progress i{display:block;flex:1;height:2px;background:linear-gradient(90deg,var(--ac) calc(var(--p,0)*100%),rgba(255,255,255,.18) 0)}@media(max-width:620px){.nw-ks{--cw:72vw!important}}';
 function run(){scwBoot('__nwKineticStrip16','.nw-ks',function(el){var track=el.querySelector('.nw-ks-track'),clip=el.querySelector('.nw-ks-clip'),busy=0;if(!track||!clip)return;function upd(){busy=0;var r=el.getBoundingClientRect(),span=Math.max(1,r.height-innerHeight),p=Math.max(0,Math.min(1,-r.top/span)),max=Math.max(0,track.scrollWidth-clip.clientWidth);track.style.setProperty('--tx',(-p*max)+'px');el.style.setProperty('--p',p.toFixed(4));}function req(){if(!busy){busy=1;requestAnimationFrame(upd);}}upd();addEventListener('scroll',req,{passive:true});addEventListener('resize',req);});}
 X.reg('kineticstrip',def,css,RT(scwBoot,run));
})();

/* ---------- Escenas con scroll: Media expandible + Cinta cinética ---------- */
(function(){
 // Un solo adaptador: posicionamiento de partes sobre el escenario sticky, sin tocar
 // el motor de scroll, ni la estructura de capítulos ni los enlaces publicados.
 function adapt(kind,items,threshold,stage,decorate,extraCSS,run){
  var old=W.kinds[kind];if(!old)return;
  var def=Object.assign({},old);
  def.fields=[{type:'hint',text:kind==='scrollzoom'?
    'Seleccioná Medio, Título o Indicación para editarlos. También podés elegir las piezas de cada momento sobre la imagen. Las posiciones de escritorio y móvil son independientes; la expansión sigue respondiendo al scroll.':
    'Seleccioná el Rótulo o una Tarjeta y ajustalos directamente. Los proyectos conservan sus links y el recorrido horizontal; en móvil podés guardar otros desplazamientos.'}]
    .concat((old.fields||[]).filter(function(f){return f.type!=='hint';}));
  def.markup=function(e,ctx){
   var html=old.markup(e,ctx),parts=items(e,ctx);
   html=html.replace(/(<section class="[^"]+")/,'$1 data-nw-part-scope="'+kind+
    '" data-nw-part-mobile="'+threshold+'" data-nw-part-height="'+stage+'" data-nw-part-y="100vh"');
   html=decorate(html,e,ctx,parts);
   parts.forEach(function(item){html=partStyleMarkup(html,e,item[0],'100vh');});
   if(ctx.edit){
    var bar='<div class="nw-edit-partbar nw-scroll-editbar" data-nw-partbar><button type="button" data-nw-part="">Todos</button>'+
     parts.map(function(it){return '<button type="button" data-nw-part="'+it[0]+'">'+it[1]+'</button>';}).join('')+'</div>';
    html=html.replace(/(<section class="[^"]+"[^>]*>)/,'$1'+bar);
   }
   return html;
  };
  var css=(W.css&&W.css[kind]||'')+
   '.nw-sz,.nw-ks{container-type:inline-size}' +
   '.'+(kind==='scrollzoom'?'nw-sz':'nw-ks')+' .nw-scroll-editbar{left:12px;right:12px;top:10px;max-width:calc(100% - 24px);max-height:110px;overflow:auto;z-index:70}' +
   extraCSS+
   '@container (max-width:'+threshold+'px){.'+(kind==='scrollzoom'?'nw-sz':'nw-ks')+
   ' [data-wpart]{translate:var(--nw-mx,var(--nw-tx,0px)) var(--nw-my,var(--nw-ty,0px));rotate:var(--nw-mr,var(--nw-pr,0deg));scale:var(--nw-ms,var(--nw-ps,1))}}';
  X.reg(kind,def,css,run);
 }
 function zoomParts(e,ctx){
  var list=[['media','Medio'],['title','Título inicial'],['sub','Indicación inicial']];
  arr(e.chapters).forEach(function(ch,i){
   var c=ch||{},n=i+1;
   if(imgUrl(ctx,c.img))list.push(['moment-'+i+'-img','Momento '+n+' · Imagen']);
   if(str(c.eyebrow||'').trim())list.push(['moment-'+i+'-eyebrow','Momento '+n+' · Rótulo']);
   if(str(c.title||'').trim())list.push(['moment-'+i+'-title','Momento '+n+' · Título']);
   if(str(c.text||'').trim())list.push(['moment-'+i+'-text','Momento '+n+' · Texto']);
  });
  return list;
 }
 function zoomMarkup(html,e){
  var i=0;
  return html.replace(/<article class="nw-sz-ch[^"]*"[^>]*>[\s\S]*?<\/article>/g,function(article){
   var id=i++;
   return article.replace(/<img\b/,'<img data-wpart="moment-'+id+'-img"')
    .replace(/<b>/,'<b data-wpart="moment-'+id+'-eyebrow">')
    .replace(/<h3>/,'<h3 data-wpart="moment-'+id+'-title">')
    .replace(/<p>/,'<p data-wpart="moment-'+id+'-text">');
  });
 }
 // No afectar el progreso/expansión original del medio ni los capítulos automáticos.
 function runZoom(){
  scwBoot('__nwScrollZoom16Parts','.nw-sz',function(el){
   var chs=el.querySelectorAll('.nw-sz-ch'),c=scwCfg(el),
     ee=Math.max(.1,Math.min(.8,(+c.expandEnd||32)/100)),
     xs=Math.max(ee+.05,Math.min(.99,(+c.exitStart||90)/100)),busy=0;
   function upd(){
    busy=0;var r=el.getBoundingClientRect(),span=Math.max(1,r.height-innerHeight),
      p=Math.max(0,Math.min(1,-r.top/span)),ep=Math.max(0,Math.min(1,p/ee)),
      ex=Math.max(0,Math.min(1,(p-xs)/Math.max(.01,1-xs)));
    el.style.setProperty('--p',ep.toFixed(4));el.style.setProperty('--exit',ex.toFixed(4));
    el.style.setProperty('--cap',String(Math.max(0,1-ep*1.65)));
    if(chs.length){var q=Math.max(0,Math.min(.999,(p-ee)/Math.max(.01,xs-ee))),
     idx=p<ee?-1:Math.min(chs.length-1,Math.floor(q*chs.length));
     for(var j=0;j<chs.length;j++)chs[j].classList.toggle('is-active',j===idx&&p<xs);
    }
   }
   function req(){if(!busy){busy=1;requestAnimationFrame(upd);}}
   upd();addEventListener('scroll',req,{passive:true});addEventListener('resize',req);
  });
 }
 adapt('scrollzoom',zoomParts,720,'.nw-sz-sticky',zoomMarkup,
  '.nw-sz [data-wpart]{translate:var(--nw-tx,0px) var(--nw-ty,0px);rotate:var(--nw-pr,0deg);scale:var(--nw-ps,1)}'+
  '.nw-sz .nw-sz-frame{scale:calc(var(--nw-ps,1) * (1 + var(--exit,0)*.035))}'+
  '.nw-sz .nw-sz-cap:has(.nw-part-edit-active){opacity:1!important}'+
  '.nw-sz.nw-part-isolate .nw-sz-ch{opacity:0!important}'+
  '.nw-sz.nw-part-isolate .nw-sz-ch:has(.nw-part-edit-active){opacity:1!important;scale:1!important}'+
  '.nw-sz.nw-part-isolate .nw-sz-ch:has(.nw-part-edit-active) [data-wpart]{pointer-events:auto!important}'+
  '@container (max-width:720px){.nw-sz .nw-sz-frame{scale:calc(var(--nw-ms,var(--nw-ps,1)) * (1 + var(--exit,0)*.035))}}',
  RT(scwBoot,scwCfg,runZoom));
 function stripParts(e,ctx){
  var projects=arr(e.projects).slice();
  if(!projects.length){for(var i=1;i<=5;i++)if(e['img'+i])projects.push({img:e['img'+i]});}
  if(!projects.length&&ctx.edit)projects=[{img:''}];
  return [['label','Rótulo']].concat(projects.map(function(p,i){return ['card-'+i,'Tarjeta '+(i+1)];}));
 }
 function stripMarkup(html,e,ctx){
  html=html.replace(/(<header><b data-wfield="label")/,'$1 data-wpart="label"');
  var i=0;
  return html.replace(/<a class="nw-ks-card"([^>]*)>/g,function(tag,attrs){
   var id=i++;
   // En edición un link no debe navegar; el href original sigue en el modelo y la publicación.
   if(ctx.edit)attrs=attrs.replace(/\shref="[^"]*"/,'');
   return '<a class="nw-ks-card" data-wpart="card-'+id+'"'+attrs+'>';
  });
 }
 function runStrip(){
  scwBoot('__nwKineticStrip16Parts','.nw-ks',function(el){
   var track=el.querySelector('.nw-ks-track'),clip=el.querySelector('.nw-ks-clip'),busy=0;
   if(!track||!clip)return;
   freeStickyRunway(el);
   function upd(){
    busy=0;var r=el.getBoundingClientRect(),span=Math.max(1,r.height-innerHeight),
     p=Math.max(0,Math.min(1,-r.top/span)),
     max=Math.max(0,track.scrollWidth-clip.clientWidth);
    track.style.setProperty('--tx',(-p*max)+'px');el.style.setProperty('--p',p.toFixed(4));
   }
   function req(){if(!busy){busy=1;requestAnimationFrame(upd);}}
   upd();addEventListener('scroll',req,{passive:true});addEventListener('resize',req);
  });
 }
 adapt('kineticstrip',stripParts,720,'.nw-ks-sticky',stripMarkup,
  // El sticky necesita que el lienzo reserve la altura real de la cinta.
  '.sc.free:has(> .inner > .el.wk-kineticstrip){min-height:0!important;display:block}'+
  '.sc.free:has(> .inner > .el.wk-kineticstrip)>.inner{position:relative!important;inset:auto!important;display:block!important;width:100%!important;max-width:none!important}'+
  '.sc.free:has(> .inner > .el.wk-kineticstrip)>.inner>.el.wk-kineticstrip{position:relative!important;left:auto!important;top:auto!important;transform:none!important;width:100%!important;margin:0!important}'+
  '.nw-ks [data-wpart]{translate:var(--nw-tx,0px) var(--nw-ty,0px);scale:var(--nw-ps,1);rotate:var(--nw-pr,0deg)}'+
  '.nw-ks .nw-ks-card{rotate:calc((var(--i) - 3)*var(--tilt)*.22 + var(--nw-pr,0deg))}'+
  '.nw-ks .nw-ks-card:hover{scale:calc(var(--nw-ps,1)*1.025)}'+
  '@container (max-width:720px){.nw-ks .nw-ks-card{rotate:calc((var(--i) - 3)*var(--tilt)*.22 + var(--nw-mr,var(--nw-pr,0deg)))}.nw-ks .nw-ks-card:hover{scale:calc(var(--nw-ms,var(--nw-ps,1))*1.025)}}',
  RT(scwBoot,runStrip));
})();

/* ---------- utilidades de edición interna ---------- */
function widgetById(id){try{return sec().elements.find(function(e){return e.id===id&&e.type==='widget';})||null}catch(_){return null}}
function selectWidget(id){
 try{if(selection.length===1&&selection[0]===id)return;var f=findEl(id);if(!f)return;curSec=f[0];curEl=f[1];selection=[id];secFocus=false;if(curPane!=='agent')curPane='elements';unfoldTo(id);renderPane();syncSelectionToFrame();}catch(_){}
}
// El foco en una capa o capítulo pertenece al editor, no al sitio exportado.
var partFocus=Object.create(null);
function syncPartHandles(doc,id,name){
 if(selection.length!==1||selection[0]!==id)return;
 var api=doc.__nwCanvasPartAPI;
 if(!api){
  doc.addEventListener('nw-canvas-parts-ready',function(){syncPartHandles(doc,id,name);},{once:true});
  return;
 }
 if(name)api.select(id,name);else api.clear();
}
function restorePartFocus(doc){
 doc.querySelectorAll('.el.wdg[data-id]').forEach(function(root){
  var state=partFocus[root.dataset.id];if(!state)return;
  if(state.type==='hero'){
   var hero=root.querySelector('.nw-lh');if(!hero)return;
   var btn=Array.prototype.find.call(hero.querySelectorAll('[data-nw-part]'),function(n){return n.dataset.nwPart===state.part;});
   if(!btn)return;btn.classList.add('on');
   if(!state.part){syncPartHandles(doc,root.dataset.id,'');return;}
   var part=hero.querySelector('[data-wpart="'+state.part+'"]');
   if(part){hero.classList.add('nw-part-isolate');part.classList.add('nw-part-edit-active');syncPartHandles(doc,root.dataset.id,state.part);}
  }else if(state.type==='scope'){
   var scope=root.querySelector('[data-nw-part-scope]');if(!scope)return;
   var btn0=Array.prototype.find.call(scope.querySelectorAll('[data-nw-part]'),function(n){return n.dataset.nwPart===state.part;});
   if(!btn0)return;btn0.classList.add('on');
   if(!state.part){syncPartHandles(doc,root.dataset.id,'');return;}
   var part0=Array.prototype.find.call(scope.querySelectorAll('[data-wpart]'),function(n){return n.dataset.wpart===state.part;});
   if(part0){scope.classList.add('nw-part-isolate');part0.classList.add('nw-part-edit-active');syncPartHandles(doc,root.dataset.id,state.part);}
  }else if(state.type==='story'){
   var story=root.querySelector('.nw-story');if(!story)return;
   var k=Math.max(1,Math.min(3,+state.chapter||1));
   story.__nwStoryManual=true;story.__nwStoryChapter=k;
   story.querySelectorAll('[data-nw-story-step]').forEach(function(n){n.classList.toggle('is-active',+n.dataset.nwStoryStep===k);});
   story.querySelectorAll('[data-nw-story-media]').forEach(function(n){n.classList.toggle('is-active',+n.dataset.nwStoryMedia===k);});
   story.querySelectorAll('[data-nw-story-ch]').forEach(function(n){n.classList.toggle('on',+n.dataset.nwStoryCh===k);});
   if(!state.part){syncPartHandles(doc,root.dataset.id,'');return;}
   var key=state.part==='media'?'media-'+k:state.part+k;
   var part2=story.querySelector('[data-wpart="'+key+'"]');
   var btn2=Array.prototype.find.call(story.querySelectorAll('[data-nw-story-part]'),function(n){return n.dataset.nwStoryPart===state.part;});
   if(btn2)btn2.classList.add('on');
   if(state.part!=='all'&&part2){story.classList.add('nw-part-isolate');part2.classList.add('nw-part-edit-active');syncPartHandles(doc,root.dataset.id,key);}
   else syncPartHandles(doc,root.dataset.id,'');
  }
 });
}
function installEditors(){
 var fr=document.getElementById('preview'),doc,w;try{doc=fr&&fr.contentDocument;w=fr&&fr.contentWindow}catch(_){return}
 if(!doc||!doc.head||!w||w.__nwFeedback16Editors)return;w.__nwFeedback16Editors=1;
 var st=doc.createElement('style');st.textContent='.nw-part-edit-active{outline:2px solid #8C6BFF!important;outline-offset:3px!important}.nw-story-editbar{left:12px;right:auto;top:12px}';doc.head.appendChild(st);
 doc.addEventListener('pointerdown',function(ev){
  var b=ev.target.closest&&ev.target.closest('[data-nw-part]');
  if(b){
   ev.preventDefault();ev.stopPropagation();var root=b.closest('.el.wdg[data-id]'),comp=b.closest('[data-nw-part-scope],.nw-lh,.nw-story');if(!root||!comp)return;selectWidget(root.dataset.id);
   var name=b.getAttribute('data-nw-part');comp.querySelectorAll('[data-wpart]').forEach(function(n){n.classList.remove('nw-part-edit-active')});comp.querySelectorAll('[data-nw-part]').forEach(function(x){x.classList.remove('on')});
   if(!name){comp.classList.remove('nw-part-isolate');b.classList.add('on');syncPartHandles(doc,root.dataset.id,'');return;}
   var target=comp.querySelector('[data-wpart="'+name+'"]');if(!target)return;comp.classList.add('nw-part-isolate');target.classList.add('nw-part-edit-active');b.classList.add('on');syncPartHandles(doc,root.dataset.id,name);return;
  }
  var ch=ev.target.closest&&ev.target.closest('[data-nw-story-ch]');
  if(ch){
   ev.preventDefault();ev.stopPropagation();var story=ch.closest('.nw-story'),root2=ch.closest('.el.wdg[data-id]');if(!story||!root2)return;selectWidget(root2.dataset.id);story.__nwStoryManual=true;story.__nwStoryChapter=+ch.dataset.nwStoryCh;var k=story.__nwStoryChapter;story.classList.remove('nw-part-isolate');story.querySelectorAll('.nw-part-edit-active').forEach(function(n){n.classList.remove('nw-part-edit-active')});story.querySelectorAll('[data-nw-story-part]').forEach(function(n){n.classList.remove('on')});
   story.querySelectorAll('[data-nw-story-step]').forEach(function(n){n.classList.toggle('is-active',+n.dataset.nwStoryStep===k)});story.querySelectorAll('[data-nw-story-media]').forEach(function(n){n.classList.toggle('is-active',+n.dataset.nwStoryMedia===k)});story.querySelectorAll('[data-nw-story-ch]').forEach(function(n){n.classList.toggle('on',+n.dataset.nwStoryCh===k)});syncPartHandles(doc,root2.dataset.id,'');return;
  }
  var sp=ev.target.closest&&ev.target.closest('[data-nw-story-part]');
  if(sp){
   ev.preventDefault();ev.stopPropagation();var story2=sp.closest('.nw-story'),root3=sp.closest('.el.wdg[data-id]');if(!story2||!root3)return;selectWidget(root3.dataset.id);
   var kk=story2.__nwStoryChapter||+(story2.querySelector('[data-nw-story-ch].on')&&story2.querySelector('[data-nw-story-ch].on').dataset.nwStoryCh)||1,kind=sp.dataset.nwStoryPart;
   story2.querySelectorAll('.nw-part-edit-active').forEach(function(n){n.classList.remove('nw-part-edit-active')});story2.querySelectorAll('[data-nw-story-part]').forEach(function(n){n.classList.remove('on')});
   if(kind==='all'){story2.classList.remove('nw-part-isolate');sp.classList.add('on');syncPartHandles(doc,root3.dataset.id,'');return;}
   var partName=kind==='media'?'media-'+kk:kind+kk,target=story2.querySelector('[data-wpart="'+partName+'"]');if(!target)return;
   story2.classList.add('nw-part-isolate');target.classList.add('nw-part-edit-active');sp.classList.add('on');syncPartHandles(doc,root3.dataset.id,partName);return;
  }
  var live=ev.target.closest&&ev.target.closest('[data-nw-story-live]');
  if(live){ev.preventDefault();ev.stopPropagation();var st0=live.closest('.nw-story'),root4=live.closest('.el.wdg[data-id]');if(root4)syncPartHandles(doc,root4.dataset.id,'');if(st0){st0.__nwStoryManual=false;st0.classList.remove('nw-part-isolate');st0.querySelectorAll('.nw-part-edit-active').forEach(function(n){n.classList.remove('nw-part-edit-active')});st0.querySelectorAll('[data-nw-story-ch],[data-nw-story-part]').forEach(function(n){n.classList.remove('on')});}return;}
 },true);
 // Se ejecuta después de los controles existentes, sin escribir al proyecto.
 doc.addEventListener('pointerdown',function(ev){
  var hit=ev.target.closest&&ev.target.closest('[data-nw-part],[data-nw-story-ch],[data-nw-story-part],[data-nw-story-live]');
  if(!hit)return;
  var root=hit.closest('.el.wdg[data-id]');if(!root)return;
  var id=root.dataset.id,story=hit.closest('.nw-story');
  if(hit.hasAttribute('data-nw-part'))partFocus[id]={type:hit.closest('.nw-lh')?'hero':'scope',part:hit.dataset.nwPart};
  else if(hit.hasAttribute('data-nw-story-live'))delete partFocus[id];
  else if(story){
   var old=partFocus[id]||{},chapter=+story.__nwStoryChapter||+old.chapter||1;
   if(hit.hasAttribute('data-nw-story-ch'))partFocus[id]={type:'story',chapter:+hit.dataset.nwStoryCh,part:null};
   else{
    story.__nwStoryManual=true;story.__nwStoryChapter=chapter;
    partFocus[id]={type:'story',chapter:chapter,part:hit.dataset.nwStoryPart};
   }
  }
 },true);
 // Elegir una parte directamente en el lienzo también sincroniza su barra.
 doc.addEventListener('nw-canvas-part-selected',function(ev){
  var info=ev.detail||{},id=info.id,name=info.part;if(!id||!name)return;
  var root=Array.prototype.find.call(doc.querySelectorAll('.el.wdg[data-id]'),function(n){return n.dataset.id===id;});
  if(!root)return;
  function press(btn){
   if(btn)btn.dispatchEvent(new w.PointerEvent('pointerdown',{bubbles:true,cancelable:true,button:0,pointerId:99}));
  }
  var hero=root.querySelector('.nw-lh');
  if(hero){
   press(Array.prototype.find.call(hero.querySelectorAll('[data-nw-part]'),function(n){return n.dataset.nwPart===name;}));
   return;
  }
  var otherScope=root.querySelector('[data-nw-part-scope]:not(.nw-lh):not(.nw-story)');
  if(otherScope){
   press(Array.prototype.find.call(otherScope.querySelectorAll('[data-nw-part]'),function(n){return n.dataset.nwPart===name;}));
   return;
  }
  var story=root.querySelector('.nw-story');
  if(story){
   var match=/^(media-|[ktc])([1-3])$/.exec(name);if(!match)return;
   var chapter=+match[2],kind=match[1]==='media-'?'media':match[1];
   if(story.__nwStoryChapter!==chapter){
    press(story.querySelector('[data-nw-story-ch="'+chapter+'"]'));
   }
   press(story.querySelector('[data-nw-story-part="'+kind+'"]'));
  }
 });
 doc.addEventListener('dblclick',function(ev){
  var n=ev.target.closest&&ev.target.closest('[data-nw-listobj]');if(!n)return;var root=n.closest('.el.wdg[data-id]');if(!root)return;ev.preventDefault();ev.stopPropagation();selectWidget(root.dataset.id);
  n.setAttribute('contenteditable','plaintext-only');n.focus();try{var rg=doc.createRange();rg.selectNodeContents(n);var sl=w.getSelection();sl.removeAllRanges();sl.addRange(rg)}catch(_){}
  var previous=n.innerText.replace(/[\r\n]+$/,''),done=false,cancelled=false;
  function finish(){
   if(done)return;done=true;n.removeAttribute('contenteditable');n.removeEventListener('keydown',onKey);
   if(cancelled){n.innerText=previous;return;}
   var next=n.innerText.replace(/[\r\n]+$/,'');if(next===previous)return;
   var e=widgetById(root.dataset.id),list=e&&e.wp&&e.wp[n.dataset.nwListobj],row=+n.dataset.nwRow,key=n.dataset.nwKey;
   if(list&&list[row]){snapshot();list[row][key]=next;saveProject();renderPane();schedulePreview();}
  }
  function onKey(ev){
   ev.stopPropagation();
   if(ev.key==='Escape'){ev.preventDefault();cancelled=true;n.blur();finish();}
   else if(ev.key==='Enter'&&!ev.shiftKey){ev.preventDefault();n.blur();finish();}
  }
  n.addEventListener('blur',finish,{once:true});n.addEventListener('keydown',onKey);
 },true);
 restorePartFocus(doc);
}
var pv=document.getElementById('preview');if(pv){pv.addEventListener('load',function(){setTimeout(installEditors,80)});setTimeout(installEditors,300);}
new MutationObserver(function(){setTimeout(installEditors,30)}).observe(document.body,{childList:true,subtree:true});

console.info('[NagWeb] feedback v1.6: composición y cinta sticky');
})();
