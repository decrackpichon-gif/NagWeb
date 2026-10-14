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
  function addStyle(part){
   var token='data-wpart="'+part+'"',value=partTransformCSS(e,part,'var(--h)');
   if(!value||!html.includes(token))return;
   // Nunca añadir un segundo atributo style; preservar video, fondos y colores originales.
   html=html.replace(new RegExp('<[a-z][^>]*'+token+'[^>]*>','i'),function(tag){
    if(/\sstyle="/.test(tag))return tag.replace(/\sstyle="/,' style="'+value);
    return tag.slice(0,-1)+' style="'+value+'">';
   });
  }
  items.forEach(function(item){addStyle(item[0]);});
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
   items.forEach(function(item){
    var key=item[0],value=partTransformCSS(e,key,'var(--h)'),token='data-wpart="'+key+'"';
    if(!value)return;
    html=html.replace(new RegExp('<[a-z][^>]*'+token+'[^>]*>','i'),function(tag){
     if(/\sstyle="/.test(tag))return tag.replace(/\sstyle="/,' style="'+value);
     return tag.slice(0,-1)+' style="'+value+'">';
    });
   });
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
 function run(){scwBoot('__nwScrollStory16','.nw-story',function(el){var cards=el.querySelectorAll('.nw-story-step'),media=el.querySelectorAll('.nw-story-media'),busy=0;function upd(){busy=0;if(window.SC_EDIT&&el.__nwStoryManual)return;var r=el.getBoundingClientRect(),span=Math.max(1,r.height-innerHeight),p=Math.max(0,Math.min(.999,-r.top/span)),idx=Math.min(cards.length-1,Math.floor(p*cards.length));for(var i=0;i<cards.length;i++){cards[i].classList.toggle('is-active',i===idx);if(media[i])media[i].classList.toggle('is-active',i===idx);}el.style.setProperty('--storyP',p);}function req(){if(!busy){busy=1;requestAnimationFrame(upd);}}upd();addEventListener('scroll',req,{passive:true});addEventListener('resize',req);});}
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
