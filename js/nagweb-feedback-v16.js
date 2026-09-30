/* NagWeb 1.6 · feedback de composición
   Hero editable por capas, Historia sticky navegable en edición y Cinta cinética sticky. */
(function(){
'use strict';
if(!window.SCWX||!window.SCW||window.NAGWEB_FEEDBACK16)return;window.NAGWEB_FEEDBACK16=1;
var X=window.SCWX,W=window.SCW;
var E=X.E,str=X.str,num=X.num,col=X.col,pick=X.pick,bool=X.bool,arr=X.arr,cfgAttr=X.cfgAttr,cssVars=X.cssVars,onColor=X.onColor,ICO=X.ICO,TH=X.TH,imgUrl=X.imgUrl,bgImg=X.bgImg,lines=X.lines,RT=X.RT,scwBoot=X.scwBoot,scwCfg=X.scwCfg,scwRM=X.scwRM;
function ps(e,n){var p=e&&e.__parts&&e.__parts[n];if(!p)return '';return '--nw-tx:'+num(p.x,0,-5000,5000)+'px;--nw-ty:'+num(p.y,0,-5000,5000)+'px;--nw-pr:'+num(p.r,0,-1080,1080)+'deg;--nw-ps:'+num(p.s,1,.05,12)+';';}
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
 def.fields=[{type:'hint',text:'No cambies la Página a Lienzo libre. Usá la barra «Editar capa» que aparece arriba del Hero: elegís una foto o texto, esa parte pasa al frente temporalmente y después la movés, escalás o rotás con el mouse.'}].concat(baseFields);
 def.markup=function(e,ctx){
  var esc=E(ctx),bg=col(e.bg)||'#0A0C12',fg=col(e.color)||onColor(bg),a=col(e.accent)||'#8C6BFF',tl=lines(e.title),extra=arr(e.texts),buttons=[];
  if(!tl.length)tl=['UNA ESCENA','CON PROFUNDIDAD'];
  function layer(id,n,cls){var u=imgUrl(ctx,id);if(!u&&n>1)return '';buttons.push(['layer-'+n,'Foto '+n]);return '<div class="nw-lh-layer '+cls+(u?'':' is-placeholder')+'" data-wpart="layer-'+n+'" style="'+ps(e,'layer-'+n)+(u?'':'background:'+bgImg(ctx,'',n*2+1))+'">'+(u?'<img src="'+esc(u)+'" alt="" draggable="false">':'')+'</div>';}
  var layers=layer(e.img1,1,'l1')+layer(e.img2,2,'l2')+layer(e.img3,3,'l3')+layer(e.img4,4,'l4')+layer(e.img5,5,'l5');
  buttons.push(['eyebrow','Antetítulo'],['title','Título'],['sub','Texto']);
  var ex='';
  extra.forEach(function(t,i){var sty=pick(t.style,['title','body','label'],'body'),tag=sty==='title'?'h3':sty==='label'?'b':'p',part='text-extra-'+i;buttons.push([part,'Texto '+(i+1)]);ex+='<'+tag+' class="nw-lh-extra nw-lh-extra--'+sty+'" data-wpart="'+part+'" data-nw-listobj="texts" data-nw-row="'+i+'" data-nw-key="text" style="'+ps(e,part)+'">'+esc(t.text||'')+'</'+tag+'>';});
  var bar=ctx.edit?'<div class="nw-edit-partbar" data-nw-partbar><button type="button" data-nw-part="">Todos</button>'+buttons.map(function(b){return '<button type="button" data-nw-part="'+b[0]+'">'+b[1]+'</button>';}).join('')+'</div>':'';
  return '<section class="nw-lh"'+cfgAttr(ctx,{amount:num(e.amount,28,0,100)})+' style="'+cssVars({'--bg':bg,'--fg':fg,'--ac':a,'--h':num(e.h,640,260,1000)+'px','--r':num(e.round,24,0,70)+'px'})+'">'+bar+layers+'<div class="nw-lh-copy"><b data-wfield="eyebrow" data-wpart="eyebrow" style="'+ps(e,'eyebrow')+'">'+esc(e.eyebrow||'')+'</b><h2 data-wfield="title" data-wmulti="1" data-wpart="title" style="'+ps(e,'title')+'">'+tl.map(function(x){return esc(x);}).join('<br>')+'</h2><p data-wfield="sub" data-wpart="sub" style="'+ps(e,'sub')+'">'+esc(e.sub||'')+'</p>'+ex+'</div></section>';
 };
 var css=PART+'.nw-lh{position:relative;width:100%;height:var(--h);overflow:hidden;border-radius:var(--r);background:var(--bg);color:var(--fg);isolation:isolate}.nw-lh-layer{position:absolute;overflow:hidden;transition:transform .18s ease-out;transform:translate(var(--px,0px),var(--py,0px));background-position:center!important;background-size:cover!important}.nw-lh-layer>img{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:cover}.nw-lh .l1{inset:0;opacity:.72}.nw-lh .l2{width:48%;height:62%;right:7%;top:10%;border-radius:calc(var(--r)*.7);box-shadow:0 35px 80px -40px #000}.nw-lh .l3{width:31%;height:43%;right:38%;bottom:7%;border-radius:calc(var(--r)*.55);box-shadow:0 30px 70px -40px #000}.nw-lh .l4{width:24%;height:32%;right:4%;bottom:7%;border-radius:calc(var(--r)*.5);z-index:4}.nw-lh .l5{width:20%;height:26%;right:58%;top:8%;border-radius:calc(var(--r)*.45);z-index:4}.nw-lh:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,color-mix(in srgb,var(--bg) 76%,transparent) 0%,color-mix(in srgb,var(--bg) 18%,transparent) 50%,transparent 78%);pointer-events:none}.nw-lh-copy{position:absolute;z-index:6;left:6%;top:50%;translate:0 -50%;max-width:54%;display:grid;gap:18px}.nw-lh-copy>b{font-size:10px;letter-spacing:.16em;color:var(--ac)}.nw-lh-copy h2{margin:0;font-size:clamp(50px,8cqw,120px);line-height:.84;letter-spacing:-.06em}.nw-lh-copy p{margin:0;max-width:38ch;font-size:13px;opacity:.72}.nw-lh-extra{position:relative;margin:0;max-width:32ch}.nw-lh-extra--title{font-size:clamp(28px,4cqw,64px);line-height:.95;letter-spacing:-.04em}.nw-lh-extra--body{font-size:clamp(13px,1.4cqw,18px);line-height:1.45}.nw-lh-extra--label{font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:var(--ac)}@container (max-width:600px){.nw-lh-copy{max-width:82%}.nw-lh .l2{width:62%;right:-8%}.nw-lh .l3{width:42%;right:15%}}';
 function run(){scwBoot('__nwLayeredHero16','.nw-lh',function(el){if(scwRM())return;var amt=+(scwCfg(el).amount||24),ls=el.querySelectorAll('.nw-lh-layer');el.addEventListener('pointermove',function(ev){if(window.SC_EDIT&&el.classList.contains('nw-part-isolate'))return;var r=el.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width-.5,y=(ev.clientY-r.top)/r.height-.5;for(var i=0;i<ls.length;i++){var k=(i+1)/Math.max(1,ls.length);ls[i].style.setProperty('--px',(x*amt*k)+'px');ls[i].style.setProperty('--py',(y*amt*k)+'px');}});el.addEventListener('pointerleave',function(){for(var i=0;i<ls.length;i++){ls[i].style.setProperty('--px','0px');ls[i].style.setProperty('--py','0px');}});});}
 X.reg('layeredhero',def,css,RT(scwBoot,scwCfg,scwRM,run));
})();

/* ---------- Historia sticky: selector de capítulo para editar texto e imagen ---------- */
(function(){
 var old=W.kinds.scrollstory;if(!old)return;
 var def=Object.assign({},old);
 def.fields=[{type:'hint',text:'En edición aparece una barra 1 / 2 / 3. Elegí el capítulo que querés tocar: su imagen, rótulo, título y texto quedan visibles y manipulables con el mouse.'}].concat((old.fields||[]).filter(function(f){return f.type!=='hint';}));
 def.markup=function(e,ctx){
  var esc=E(ctx),bg=col(e.bg)||'#F1EEE7',fg=col(e.color)||onColor(bg),a=col(e.accent)||'#C0522B',side=pick(e.mediaSide,['left','right'],'left'),h='',m='';
  for(var i=1;i<=3;i++){h+='<article class="nw-story-step'+(i===1?' is-active':'')+'" data-nw-story-step="'+i+'"><b data-wfield="k'+i+'" data-wpart="k'+i+'" style="'+ps(e,'k'+i)+'">'+esc(e['k'+i]||'')+'</b><h3 data-wfield="t'+i+'" data-wpart="t'+i+'" style="'+ps(e,'t'+i)+'">'+esc(e['t'+i]||'')+'</h3><p data-wfield="c'+i+'" data-wmulti="1" data-wpart="c'+i+'" style="'+ps(e,'c'+i)+'">'+esc(e['c'+i]||'')+'</p></article>';var u=imgUrl(ctx,e['img'+i]);m+='<i class="nw-story-media'+(i===1?' is-active':'')+(u?'':' is-placeholder')+'" data-nw-story-media="'+i+'" data-wpart="media-'+i+'" style="'+ps(e,'media-'+i)+(u?'':'background:'+bgImg(ctx,'',i*3))+'">'+(u?'<img src="'+esc(u)+'" alt="" draggable="false">':'')+'</i>';}
  var bar=ctx.edit?'<div class="nw-edit-partbar nw-story-editbar"><button type="button" class="on" data-nw-story-ch="1">Capítulo 1</button><button type="button" data-nw-story-ch="2">Capítulo 2</button><button type="button" data-nw-story-ch="3">Capítulo 3</button><button type="button" data-nw-story-live="1">Seguir scroll</button></div>':'';
  return '<section class="nw-story nw-story--'+side+'" style="'+cssVars({'--bg':bg,'--fg':fg,'--ac':a,'--len':num(e.length,300,160,560)+'vh','--r':num(e.round,18,0,60)+'px'})+'">'+bar+'<div class="nw-story-sticky"><div class="nw-story-visual">'+m+'<span></span></div><div class="nw-story-copy">'+h+'<div class="nw-story-progress"><i></i></div></div></div></section>';
 };
 var css=PART+'.nw-story{position:relative;height:var(--len);background:var(--bg);color:var(--fg)}.nw-story-sticky{position:sticky;top:0;height:100vh;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(280px,.85fr);gap:clamp(28px,5vw,80px);align-items:center;padding:clamp(24px,5vw,74px);box-sizing:border-box;overflow:hidden}.nw-story--right .nw-story-visual{order:2}.nw-story-visual{position:relative;height:min(72vh,760px);overflow:hidden;border-radius:var(--r);background:#111}.nw-story-media{position:absolute;inset:0;overflow:hidden;background-size:cover!important;background-position:center!important;opacity:0;scale:1.035;transition:opacity .55s ease,scale 1.1s cubic-bezier(.2,.8,.2,1)}.nw-story-media>img{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:cover}.nw-story-media.is-active{opacity:1;scale:1}.nw-story-visual>span{position:absolute;inset:0;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);border-radius:inherit;pointer-events:none}.nw-story-copy{position:relative;min-height:310px;display:grid;align-items:center}.nw-story-step{grid-area:1/1;opacity:0;translate:0 24px;pointer-events:none;transition:opacity .4s ease,translate .55s cubic-bezier(.2,.8,.2,1)}.nw-story-step.is-active{opacity:1;translate:0 0;pointer-events:auto}.nw-story-step>b{font-size:10px;letter-spacing:.16em;color:var(--ac)}.nw-story-step h3{margin:16px 0 12px;font-size:clamp(38px,6cqw,78px);line-height:.92;letter-spacing:-.045em}.nw-story-step p{margin:0;max-width:42ch;line-height:1.55;opacity:.7}.nw-story-progress{position:absolute;left:0;right:0;bottom:-34px;height:2px;background:color-mix(in srgb,var(--fg) 16%,transparent)}.nw-story-progress i{display:block;width:calc(var(--storyP,0)*100%);height:100%;background:var(--ac)}@container (max-width:720px){.nw-story-sticky{grid-template-columns:1fr;grid-template-rows:56vh auto;align-content:center}.nw-story--right .nw-story-visual{order:0}.nw-story-copy{min-height:220px}}';
 function run(){scwBoot('__nwScrollStory16','.nw-story',function(el){var cards=el.querySelectorAll('.nw-story-step'),media=el.querySelectorAll('.nw-story-media'),busy=0;function upd(){busy=0;if(window.SC_EDIT&&el.__nwStoryManual)return;var r=el.getBoundingClientRect(),span=Math.max(1,r.height-innerHeight),p=Math.max(0,Math.min(.999,-r.top/span)),idx=Math.min(cards.length-1,Math.floor(p*cards.length));for(var i=0;i<cards.length;i++){cards[i].classList.toggle('is-active',i===idx);if(media[i])media[i].classList.toggle('is-active',i===idx);}el.style.setProperty('--storyP',p);}function req(){if(!busy){busy=1;requestAnimationFrame(upd);}}upd();addEventListener('scroll',req,{passive:true});addEventListener('resize',req);});}
 X.reg('scrollstory',def,css,RT(scwBoot,run));
})();

/* ---------- Cinta cinética: sticky horizontal, recorre todas las tarjetas antes de salir ---------- */
(function(){
 var old=W.kinds.kineticstrip;if(!old)return;
 var def=Object.assign({},old);
 def.defaults=Object.assign({},old.defaults,{perCard:52,cardW:36,cardH:68});
 var oldProjects=(old.fields||[]).find(function(f){return f.k==='projects';});
 def.fields=[
  oldProjects||{k:'projects',label:'Proyectos',type:'list',itemLabel:'title',add:{img:'',title:'Nuevo proyecto',href:'#'},item:[{k:'img',label:'Imagen',type:'image'},{k:'title',label:'Título',type:'text'},{k:'href',label:'Link',type:'url'}]},
  {type:'group',label:'Recorrido'},
  {k:'perCard',label:'Scroll por proyecto',type:'range',min:28,max:100,step:2,unit:'vh'},
  {k:'cardW',label:'Ancho de tarjeta',type:'range',min:22,max:72,step:1,unit:'vw'},
  {k:'cardH',label:'Alto de tarjeta',type:'range',min:36,max:82,step:1,unit:'vh'},
  {k:'label',label:'Rótulo general',type:'text'},{k:'gap',label:'Separación',type:'range',min:0,max:60,step:1,unit:'px'},{k:'tilt',label:'Rotación alternada',type:'range',min:0,max:10,step:.5,unit:'°'},{k:'round',label:'Redondeo',type:'range',min:0,max:40,step:1,unit:'px'},
  {type:'group',label:'Colores'},{k:'bg',label:'Fondo',type:'color'},{k:'color',label:'Texto',type:'color'},{k:'accent',label:'Acento',type:'color'},
  {type:'hint',text:'La escena queda fija hasta que la última tarjeta haya pasado. Las tarjetas no se arrastran en la vista previa; el usuario solo las recorre con el scroll.'}
 ];
 def.markup=function(e,ctx){
  var esc=E(ctx),bg=col(e.bg)||'#0B0D12',fg=col(e.color)||onColor(bg),a=col(e.accent)||'#FF6B8A',projects=arr(e.projects),cards='',n=projects.length;
  if(!n){for(var z=1;z<=5;z++)if(e['img'+z])projects.push({img:e['img'+z],title:'Proyecto '+z,href:'#'});n=projects.length;}
  if(!n&&ctx.edit)projects=[{img:'',title:'Agregá un proyecto',href:'#'}],n=1;
  projects.forEach(function(p,i){var u=imgUrl(ctx,p.img),href=str(p.href||'').trim()||'#';cards+='<a class="nw-ks-card" href="'+esc(href)+'" style="--i:'+(i+1)+'">'+(u?'<img src="'+esc(u)+'" alt="" draggable="false">':'<i style="background:'+bgImg(ctx,'',i*2)+'"></i>')+(p.title?'<strong>'+esc(p.title)+'</strong>':'')+'</a>';});
  var len=Math.max(180,100+n*num(e.perCard,52,20,120));
  return '<section class="nw-ks" style="'+cssVars({'--bg':bg,'--fg':fg,'--ac':a,'--gap':num(e.gap,18,0,80)+'px','--r':num(e.round,16,0,60)+'px','--cw':num(e.cardW,36,18,86)+'vw','--ch':num(e.cardH,68,30,88)+'vh','--tilt':num(e.tilt,4,0,14)+'deg','--len':len+'vh'})+'"><div class="nw-ks-sticky"><header><b data-wfield="label">'+esc(e.label||'')+'</b><span></span></header><div class="nw-ks-clip"><div class="nw-ks-track">'+cards+'</div></div><small class="nw-ks-progress">SCROLL <i></i></small></div></section>';
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
function installEditors(){
 var fr=document.getElementById('preview'),doc,w;try{doc=fr&&fr.contentDocument;w=fr&&fr.contentWindow}catch(_){return}
 if(!doc||!w||w.__nwFeedback16Editors)return;w.__nwFeedback16Editors=1;
 var st=doc.createElement('style');st.textContent='.nw-part-edit-active{outline:2px solid #8C6BFF!important;outline-offset:3px!important}.nw-story-editbar{left:12px;right:auto;top:12px}';doc.head.appendChild(st);
 doc.addEventListener('pointerdown',function(ev){
  var b=ev.target.closest&&ev.target.closest('[data-nw-part]');
  if(b){
   ev.preventDefault();ev.stopPropagation();var root=b.closest('.el.wdg[data-id]'),comp=b.closest('.nw-lh');if(!root||!comp)return;selectWidget(root.dataset.id);
   var name=b.getAttribute('data-nw-part');comp.querySelectorAll('[data-wpart]').forEach(function(n){n.classList.remove('nw-part-edit-active')});comp.querySelectorAll('[data-nw-part]').forEach(function(x){x.classList.remove('on')});
   if(!name){comp.classList.remove('nw-part-isolate');b.classList.add('on');return;}
   var target=comp.querySelector('[data-wpart="'+name+'"]');if(!target)return;comp.classList.add('nw-part-isolate');target.classList.add('nw-part-edit-active');b.classList.add('on');return;
  }
  var ch=ev.target.closest&&ev.target.closest('[data-nw-story-ch]');
  if(ch){
   ev.preventDefault();ev.stopPropagation();var story=ch.closest('.nw-story'),root2=ch.closest('.el.wdg[data-id]');if(!story||!root2)return;selectWidget(root2.dataset.id);story.__nwStoryManual=true;var k=+ch.dataset.nwStoryCh;
   story.querySelectorAll('[data-nw-story-step]').forEach(function(n){n.classList.toggle('is-active',+n.dataset.nwStoryStep===k)});story.querySelectorAll('[data-nw-story-media]').forEach(function(n){n.classList.toggle('is-active',+n.dataset.nwStoryMedia===k)});story.querySelectorAll('[data-nw-story-ch]').forEach(function(n){n.classList.toggle('on',+n.dataset.nwStoryCh===k)});return;
  }
  var live=ev.target.closest&&ev.target.closest('[data-nw-story-live]');
  if(live){ev.preventDefault();ev.stopPropagation();var st0=live.closest('.nw-story');if(st0){st0.__nwStoryManual=false;st0.querySelectorAll('[data-nw-story-ch]').forEach(function(n){n.classList.remove('on')});}return;}
 },true);
 doc.addEventListener('dblclick',function(ev){
  var n=ev.target.closest&&ev.target.closest('[data-nw-listobj]');if(!n)return;var root=n.closest('.el.wdg[data-id]');if(!root)return;ev.preventDefault();ev.stopPropagation();selectWidget(root.dataset.id);
  n.setAttribute('contenteditable','plaintext-only');n.focus();try{var rg=doc.createRange();rg.selectNodeContents(n);var sl=w.getSelection();sl.removeAllRanges();sl.addRange(rg)}catch(_){}
  var done=false;function fin(){if(done)return;done=true;n.removeAttribute('contenteditable');var e=widgetById(root.dataset.id),list=e&&e.wp&&e.wp[n.dataset.nwListobj],row=+n.dataset.nwRow,key=n.dataset.nwKey;if(list&&list[row]){snapshot();list[row][key]=n.innerText.replace(/[\r\n]+$/,'');saveProject();renderPane();schedulePreview();}}
  n.addEventListener('blur',fin,{once:true});n.addEventListener('keydown',function(k){k.stopPropagation();if(k.key==='Escape'||(k.key==='Enter'&&!k.shiftKey)){k.preventDefault();n.blur();}});
 },true);
}
var pv=document.getElementById('preview');if(pv){pv.addEventListener('load',function(){setTimeout(installEditors,80)});setTimeout(installEditors,300);}
new MutationObserver(function(){setTimeout(installEditors,30)}).observe(document.body,{childList:true,subtree:true});

console.info('[NagWeb] feedback v1.6: composición y cinta sticky');
})();