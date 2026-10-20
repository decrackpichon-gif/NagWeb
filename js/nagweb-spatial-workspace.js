/* NagWeb Cámara 2.0 · Espacio 3D (estación de trabajo espacial).
 *
 * Una vista grande de la MISMA escena que edita el panel: cámara, recorrido,
 * hacia dónde mira, y cada texto / imagen / modelo en su profundidad real.
 *
 *  - La vista de trabajo (orbitar, desplazar, acercar) vive sólo en memoria. Jamás se
 *    guarda ni toca el proyecto, y no es la cámara narrativa.
 *  - El Director de Scroll sigue siendo el único dueño del progreso: la línea de tiempo
 *    de abajo llama a Director.scrub(), no tiene reloj propio.
 *  - Cada gesto de mover termina en UNA acción de la API del anfitrión (host) que hace
 *    snapshot()/guardar() una sola vez, así Deshacer/Rehacer son atómicos. Escape cancela.
 */
(function(root){
'use strict';
var V=root.NAGWEB_SPATIAL_VIEW;
if(!V||typeof document==='undefined')return;

var AXES=[
 {id:'x',dir:V.v(1,0,0),color:'#ff6b6b',label:'X'},
 {id:'y',dir:V.v(0,1,0),color:'#5fe38a',label:'Y'},
 {id:'z',dir:V.v(0,0,1),color:'#5aa9ff',label:'Z'}
];
var ROLE={text:{color:'#8fc2ff',glyph:'T',name:'Texto'},image:{color:'#ffc857',glyph:'▧',name:'Imagen'},container:{color:'#c3b1ff',glyph:'□',name:'Contenedor'},'3d':{color:'#f08cff',glyph:'⬡',name:'Modelo 3D'},other:{color:'#5eead4',glyph:'•',name:'Elemento'}};
var VIEW_NAMES={persp:'Perspectiva',top:'Superior',front:'Frontal',side:'Lateral',camera:'Desde la cámara'};
var VIEW_KEYS={'1':'persp','2':'top','3':'front','4':'side','5':'camera'};
var memory=Object.create(null); // vistas de trabajo por escena, sólo en memoria
var ws=null;

var CSS='.nw-ws{position:fixed;inset:8px;z-index:100000;display:grid;grid-template-columns:minmax(190px,240px) minmax(0,1fr) minmax(230px,290px);grid-template-rows:auto minmax(0,1fr) auto;gap:0;background:#0f131b;color:#f2f5fa;border:1px solid #3a4558;border-radius:12px;box-shadow:0 18px 80px #000c;font:13px/1.35 system-ui,-apple-system,Segoe UI,sans-serif;overflow:hidden}'+
'.nw-ws *{box-sizing:border-box}.nw-ws button{font:inherit;color:#f2f5fa;background:#232b3a;border:1px solid #4a566b;border-radius:7px;padding:5px 9px;cursor:pointer}'+
'.nw-ws button:hover{background:#2d384c}.nw-ws button[aria-pressed="true"],.nw-ws button.on{background:#ffd166;color:#14110a;border-color:#ffd166;font-weight:600}'+
'.nw-ws button:focus-visible,.nw-ws input:focus-visible,.nw-ws canvas:focus-visible{outline:3px solid #ffd166;outline-offset:1px}'+
'.nw-ws button:disabled{opacity:.45;cursor:default}'+
'.nw-ws .hd{grid-column:1/4;display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px 10px;background:#171d29;border-bottom:1px solid #2c3648}'+
'.nw-ws .hd strong{font-size:15px;margin-right:6px}.nw-ws .hd .sub{color:#aeb9cc;font-size:12px;flex:1 1 220px}'+
'.nw-ws .group{display:inline-flex;gap:3px}.nw-ws .sp{flex:1}'+
'.nw-ws .side{overflow:auto;background:#141a25;padding:10px;min-height:0}.nw-ws .side.l{border-right:1px solid #2c3648}.nw-ws .side.r{border-left:1px solid #2c3648}'+
'.nw-ws h3{margin:12px 0 5px;font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:#aeb9cc}.nw-ws h3:first-child{margin-top:0}'+
'.nw-ws .item{display:flex;width:100%;gap:7px;align-items:center;text-align:left;margin:0 0 3px;padding:6px 8px}.nw-ws .item .k{width:16px;text-align:center}.nw-ws .item .n{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.nw-ws .item .z{color:#aeb9cc;font-variant-numeric:tabular-nums;font-size:12px}'+
'.nw-ws .item.on .z{color:#3a2d00}'+
'.nw-ws .mid{position:relative;min-width:0;min-height:0;background:#0b0e14}.nw-ws canvas{display:block;width:100%;height:100%;touch-action:none;cursor:grab}'+
'.nw-ws .hud{position:absolute;left:10px;bottom:8px;right:10px;display:flex;justify-content:space-between;gap:10px;pointer-events:none;color:#c8d2e4;font-size:12px}'+
'.nw-ws .hud span{background:#0b0e14d9;border:1px solid #2c3648;border-radius:7px;padding:4px 8px}'+
'.nw-ws .msg{position:absolute;top:10px;left:50%;transform:translateX(-50%);background:#ffd166;color:#14110a;border-radius:8px;padding:6px 12px;font-weight:600;max-width:80%;display:none}'+
'.nw-ws .help{position:absolute;top:10px;right:10px;width:min(360px,calc(100% - 20px));background:#171d29f2;border:1px solid #4a566b;border-radius:10px;padding:10px 12px;display:none}.nw-ws .help.on{display:block}.nw-ws .help ul{margin:6px 0 0 16px;padding:0}.nw-ws .help li{margin:2px 0}'+
'.nw-ws label.f{display:grid;grid-template-columns:1fr 96px;align-items:center;gap:6px;margin:5px 0}.nw-ws input[type=number]{width:100%;background:#fff;color:#171717;border:1px solid #777;border-radius:6px;padding:4px 6px;font:inherit;font-variant-numeric:tabular-nums}'+
'.nw-ws input[type=number]:disabled{background:#cfd5df;color:#44505f}.nw-ws .note{color:#aeb9cc;font-size:12px;margin:6px 0}'+
'.nw-ws .ft{grid-column:1/4;background:#171d29;border-top:1px solid #2c3648;padding:8px 12px 10px;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center}'+
'.nw-ws .tl{position:relative;height:56px}.nw-ws .tl input[type=range]{position:absolute;left:0;right:0;top:0;width:100%;margin:0;height:20px}'+
'.nw-ws .tl .mk{position:absolute;top:22px;transform:translateX(-50%);min-width:16px;height:16px;padding:0;border-radius:4px;font-size:11px;line-height:12px;text-align:center}'+
'.nw-ws .tl .mk.cam{border-color:#ffb454;color:#ffb454;background:#2a2112}.nw-ws .tl .mk.look{border-color:#5ee1ff;color:#5ee1ff;background:#0f2630;top:40px}'+
'.nw-ws .tl .mk.on{background:#ffd166;color:#14110a;border-color:#ffd166}'+
'.nw-ws .pct{font-variant-numeric:tabular-nums;min-width:62px;text-align:right;font-weight:600}'+
'@media (max-width:980px){.nw-ws{grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(220px,1fr) auto auto auto}.nw-ws header,.nw-ws .ft{grid-column:1}.nw-ws aside.l,.nw-ws .side.r{border:0;border-top:1px solid #2c3648;max-height:200px}.nw-ws .side.l{order:3}.nw-ws .side.r{order:4}.nw-ws .ft{order:5}}';

function el(tag,attrs,html){var n=document.createElement(tag);if(attrs)Object.keys(attrs).forEach(function(k){n.setAttribute(k,attrs[k]);});if(html!=null)n.innerHTML=html;return n;}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function r1(n){return Math.round(n*10)/10;}
function fmt(n){return String(Math.round((+n||0)*10)/10);}

function open(host){
 if(ws)close();
 var snap=host.snapshot(true);
 var secId=snap&&snap.sectionId;
 var root$=el('div',{'class':'nw-ws','data-nw-spatial-workspace':'','role':'dialog','aria-label':'Espacio 3D de la cámara','tabindex':'-1'});
 var style=el('style');style.textContent=CSS;root$.appendChild(style);
 root$.insertAdjacentHTML('beforeend',
  '<div class="hd">'+
   '<strong>Espacio 3D</strong>'+
   '<span class="sub">Mirar no cambia tu proyecto: solo cambia lo que muevas.</span>'+
   '<span class="group" role="group" aria-label="Vista de trabajo">'+
    Object.keys(VIEW_NAMES).map(function(m,i){return '<button type="button" data-ws-view="'+m+'" title="Atajo: '+(i+1)+'">'+VIEW_NAMES[m]+'</button>';}).join('')+
   '</span>'+
   '<span class="group"><button type="button" data-ws-zoom="-1" aria-label="Alejar">−</button><button type="button" data-ws-zoom="1" aria-label="Acercar">+</button></span>'+
   '<button type="button" data-ws-frame title="Atajo: F">Encuadrar</button>'+
   '<button type="button" data-ws-frame-all title="Atajo: Inicio">Ver todo</button>'+
   '<span class="group"><button type="button" data-ws-undo aria-label="Deshacer" title="Ctrl+Z">↶ Deshacer</button><button type="button" data-ws-redo aria-label="Rehacer" title="Ctrl+Y">↷ Rehacer</button></span>'+
   '<button type="button" data-ws-help aria-expanded="false">¿Cómo se usa?</button><span class="sp"></span>'+
   '<button type="button" data-ws-close title="Atajo: Esc">Cerrar</button>'+
  '</div>'+
  '<div class="side l" data-ws-outliner role="region" aria-label="Contenido de la escena"></div>'+
  '<div class="mid"><canvas data-ws-canvas tabindex="0" role="application" aria-label="Vista 3D de la escena. Usá la lista de la izquierda y los campos de la derecha para editar con teclado."></canvas>'+
   '<div class="hud"><span data-ws-hint></span><span data-ws-viewinfo></span></div>'+
   '<div class="msg" role="status" aria-live="polite" data-ws-msg></div>'+
   '<div class="help" data-ws-helpbox role="note"><strong>Cómo moverte y editar</strong><ul>'+
    '<li><b>Girar</b>: arrastrá el fondo (Perspectiva). <b>Mover la vista</b>: botón derecho, botón del medio o Espacio + arrastrar. <b>Acercar</b>: rueda o botones + / −.</li>'+
    '<li><b>Elegir</b>: clic en un objeto, en un ◆ de cámara o en un ● de mirada, o en la lista de la izquierda.</li>'+
    '<li><b>Mover</b>: arrastrá una flecha de color (X rojo, Y verde, Z azul) o el cuadrado central. <b>Shift</b> = más preciso. <b>Ctrl</b> = de a 25. <b>Esc</b> cancela el gesto.</li>'+
    '<li>Con la selección elegida: <b>F</b> la encuadra, flechas la mueven de a 25 (Shift: 100).</li>'+
    '<li>Vistas: <b>1</b> perspectiva, <b>2</b> superior, <b>3</b> frontal, <b>4</b> lateral, <b>5</b> desde la cámara. Mover la vista nunca modifica el proyecto.</li>'+
    '<li>El rectángulo punteado celeste es el escenario a tamaño real: un texto con profundidad 0 está sobre él.</li></ul></div>'+
  '</div>'+
  '<div class="side r" data-ws-inspector role="region" aria-label="Inspector"></div>'+
  '<div class="ft"><span class="pct" data-ws-pct></span><div class="tl" data-ws-timeline><input type="range" min="0" max="100" step="0.1" value="0" data-ws-seek aria-label="Momento del Director de Scroll"><div data-ws-markers></div></div>'+
   '<span class="group"><button type="button" data-ws-add-key>+ Encuadre aquí</button><button type="button" data-ws-view-to-key title="Copia la vista de trabajo (Perspectiva) al encuadre de este momento">Usar esta vista como encuadre</button></span></div>');
 document.body.appendChild(root$);

 ws={host:host,root:root$,canvas:root$.querySelector('[data-ws-canvas]'),sectionId:secId,snap:snap,
  view:memory[secId]?Object.assign({},memory[secId]):V.defaultView('persp'),sel:null,drag:null,dirty:true,raf:0,dpr:1,w:1,h:1,
  pick:[],handles:[],hover:null,space:false,cleanup:[],opener:document.activeElement,hasFramed:!!memory[secId]};
 ws.ctx=ws.canvas.getContext('2d');
 bind();
 if(snap&&snap.selection)ws.sel=snap.selection;
 if(!ws.hasFramed)frameAll(true);
 syncView();render();draw();
 root$.focus({preventScroll:true});
 return true;
}

function close(){
 if(!ws)return;
 memory[ws.sectionId]=Object.assign({},ws.view);
 if(ws.raf)cancelAnimationFrame(ws.raf);
 ws.cleanup.forEach(function(fn){try{fn();}catch(_){}});
 if(ws.root.parentNode)ws.root.parentNode.removeChild(ws.root);
 var back=ws.opener;ws=null;
 if(back&&back.focus&&document.contains(back))try{back.focus({preventScroll:true});}catch(_){}
}

function listen(target,type,fn,opts){target.addEventListener(type,fn,opts);ws.cleanup.push(function(){target.removeEventListener(type,fn,opts);});}

function say(text){var m=ws&&ws.root.querySelector('[data-ws-msg]');if(!m)return;m.textContent=text;m.style.display=text?'block':'none';clearTimeout(ws.msgTimer);if(text)ws.msgTimer=setTimeout(function(){if(ws&&m)m.style.display='none';},3600);}
function invalidate(){if(!ws||ws.raf)return;ws.dirty=true;ws.raf=requestAnimationFrame(function(){if(!ws)return;ws.raf=0;draw();});}

// ---------------------------------------------------------------- datos
function objectBox(o,size){
 var w=o.w,h=o.h;
 if(!(w>0))w=o.role==='text'?size.width*.45:size.width*.2;
 if(!(h>0))h=o.role==='text'?size.height*.12:(o.role==='3d'?w:size.width*.2);
 return {w:w,h:h};
}
function curObject(id){return ws.snap.objects.find(function(o){return String(o.id)===String(id);})||null;}
function curKey(at){return ws.snap.keys.find(function(k){return k.at===at;})||null;}
function curLook(at){return ws.snap.looks.find(function(k){return k.at===at;})||null;}
function selEntity(){
 var s=ws.sel;if(!s)return null;
 if(s.kind==='object'){var o=curObject(s.id);return o?{kind:'object',ref:o,pos:{x:o.x,y:o.y,z:o.z},movable:!!o.editable}:null;}
 if(s.kind==='key'){var k=curKey(s.at);return k?{kind:'key',ref:k,pos:{x:k.x,y:k.y,z:k.z},movable:true}:null;}
 if(s.kind==='look'){var l=curLook(s.at);return l?{kind:'look',ref:l,pos:{x:l.x,y:l.y,z:l.z},movable:!l.locked}:null;}
 if(s.kind==='camera'){var p=ws.snap.pose;return {kind:'camera',ref:p,pos:{x:p.x,y:p.y,z:p.z},movable:false};}
 return null;
}
function entityPoints(){
 var pts=[],sn=ws.snap;
 sn.keys.forEach(function(k){pts.push(V.toD(k));});
 sn.path.forEach(function(k){pts.push(V.toD(k));});
 sn.looks.forEach(function(k){pts.push(V.toD(k));});
 sn.objects.forEach(function(o){var b=objectBox(o,sn.size);pts.push(V.toD({x:o.x-b.w/2,y:o.y-b.h/2,z:o.z}),V.toD({x:o.x+b.w/2,y:o.y+b.h/2,z:o.z}));});
 pts.push(V.toD(sn.pose));
 return pts;
}
function frameAll(silent){
 ws.view=V.frameView(ws.view,entityPoints(),ws.w,ws.h);
 if(!silent){syncView();invalidate();}
}
function frameSelection(){
 var e=selEntity();if(!e){frameAll();return;}
 var pts=[],p=V.toD(e.pos);
 if(e.kind==='object'){var b=objectBox(e.ref,ws.snap.size);pts.push(V.toD({x:e.pos.x-b.w/2,y:e.pos.y-b.h/2,z:e.pos.z}),V.toD({x:e.pos.x+b.w/2,y:e.pos.y+b.h/2,z:e.pos.z}));}
 else pts.push(p,V.add(p,V.v(260,160,260)),V.sub(p,V.v(260,160,260)));
 var m=ws.view.mode==='camera'?'persp':ws.view.mode;
 ws.view=V.frameView(Object.assign({},ws.view,{mode:m}),pts,ws.w,ws.h);
 syncView();invalidate();
}

// ---------------------------------------------------------------- interfaz
function render(){
 if(!ws)return;
 var sn=ws.snap,q=function(s){return ws.root.querySelector(s);};
 var out=q('[data-ws-outliner]'),html='';
 if(!sn||!sn.enabled){
  out.innerHTML='<p class="note">Activá la <b>Cámara 3D</b> en el panel de la escena para ver y editar su espacio.</p>';
 }else{
  html+='<p class="note"><b>Escena:</b> '+esc(sn.sectionName||'sin nombre')+(sn.layoutFree?' · Lienzo libre':' · no es Lienzo libre')+'</p>';
  html+='<h3>Cámara · encuadres</h3>';
  html+=sn.keys.map(function(k){var on=ws.sel&&ws.sel.kind==='key'&&ws.sel.at===k.at;return '<button type="button" class="item'+(on?' on':'')+'" data-ws-pick="key:'+k.at+'"><span class="k" style="color:#ffb454">◆</span><span class="n">Encuadre '+fmt(k.at)+'%</span><span class="z">Z '+fmt(k.z)+'</span></button>';}).join('')||'<p class="note">Sin encuadres.</p>';
  if(sn.looks.length){
   html+='<h3>Hacia dónde mira</h3>';
   html+=sn.looks.map(function(k){var on=ws.sel&&ws.sel.kind==='look'&&ws.sel.at===k.at;return '<button type="button" class="item'+(on?' on':'')+'" data-ws-pick="look:'+k.at+'"><span class="k" style="color:#5ee1ff">●</span><span class="n">Mirada '+fmt(k.at)+'%'+(k.locked?' · vinculada':'')+'</span><span class="z">Z '+fmt(k.z)+'</span></button>';}).join('');
  }
  html+='<h3>Contenido (de cerca a lejos)</h3>';
  var objs=sn.objects.slice().sort(function(a,b){return a.z-b.z;});
  html+=objs.map(function(o){var r=ROLE[o.role]||ROLE.other,on=ws.sel&&ws.sel.kind==='object'&&String(ws.sel.id)===String(o.id);return '<button type="button" class="item'+(on?' on':'')+'" data-ws-pick="object:'+esc(o.id)+'"><span class="k" style="color:'+(on?'#14110a':r.color)+'">'+r.glyph+'</span><span class="n">'+esc(o.label)+'</span><span class="z">Z '+fmt(o.z)+'</span></button>';}).join('')||'<p class="note" data-ws-empty>'+(sn.layoutFree?'Esta escena no tiene textos, imágenes u objetos 3D sueltos que la cámara pueda mover. No entran los que están dentro de un contenedor, fijos o en ventanas emergentes.':'Esta escena está en modo «Apilada» o «Galería», por eso no se ven acá sus textos ni objetos. Para verlos: en el panel de la escena, en «Disposición», elegí «Lienzo libre (a mano)». Ojo: los elementos pueden cambiar de lugar.')+'</p>';
  out.innerHTML=html;
 }
 renderInspector();renderTimeline();syncView();
}

function field(label,key,value,disabled,step){return '<label class="f"><span>'+label+'</span><input type="number" data-ws-field="'+key+'" value="'+fmt(value)+'" step="'+(step||25)+'" min="-4000" max="4000"'+(disabled?' disabled':'')+' aria-label="'+label+'"></label>';}
function renderInspector(){
 var box=ws.root.querySelector('[data-ws-inspector]'),sn=ws.snap,e=selEntity(),html='';
 if(!sn||!sn.enabled){box.innerHTML='';return;}
 if(!e){
  html='<h3>Nada elegido</h3><p class="note">Elegí un objeto, un ◆ de cámara o un ● de mirada en la escena o en la lista.</p><p class="note">Mover la cámara y mover un objeto son acciones distintas: los ◆ son la cámara, los rectángulos son tu contenido.</p>';
 }else if(e.kind==='object'){
  var o=e.ref,r=ROLE[o.role]||ROLE.other;
  html='<h3>'+r.name+'</h3><strong>'+esc(o.label)+'</strong>';
  html+=field('X (px)','x',o.x,!o.editable)+field('Y (px, arriba −)','y',o.y,!o.editable)+field('Z mundo (adelante +)','z',o.z,!o.editable);
  html+='<p class="note">'+(o.kind3d?'Profundidad guardada del modelo (offZ): '+fmt(o.stored):'Profundidad fija guardada: '+fmt(o.stored)+' px (positivo = más cerca del ojo).')+'</p>';
  html+='<p class="note">Mover cambia la posición base del elemento; sus animaciones se suman encima.</p>';
  html+='<button type="button" data-ws-aim title="Agrega o actualiza un punto de mirada hacia este objeto en el momento actual">Apuntar la cámara a este objeto</button>';
 }else if(e.kind==='key'){
  var k=e.ref;
  html='<h3>Encuadre de cámara</h3><strong>◆ '+fmt(k.at)+'%</strong>';
  html+='<label class="f"><span>Momento (%)</span><input type="number" data-ws-field="at" value="'+fmt(k.at)+'" step="0.5" min="0" max="100" aria-label="Momento del encuadre"></label>';
  html+=field('X (px)','x',k.x)+field('Y (px, arriba −)','y',k.y)+field('Z (adelante +)','z',k.z);
  html+='<p class="note">Mueve la cámara en ese momento del recorrido. No mueve ningún objeto.</p>';
  html+='<button type="button" data-ws-goto>Ir a este momento</button>';
 }else if(e.kind==='look'){
  var l=e.ref;
  html='<h3>Punto de mirada</h3><strong>● '+fmt(l.at)+'%</strong>';
  html+=field('X (px)','x',l.x,l.locked)+field('Y (px, arriba −)','y',l.y,l.locked)+field('Z (adelante +)','z',l.z,l.locked);
  html+='<p class="note">'+(l.locked?'Está vinculado a un elemento y lo sigue. Desvinculalo en el panel para moverlo a mano.':'Es el punto que mira la cámara en ese momento.')+'</p>';
  html+='<button type="button" data-ws-goto>Ir a este momento</button>';
 }else{
  var c=sn.pose;
  html='<h3>Cámara ahora</h3><strong>'+fmt(sn.pct)+'%</strong>'+field('X (px)','cx',c.x,true)+field('Y (px)','cy',c.y,true)+field('Z (px)','cz',c.z,true)+
   '<p class="note">Posición evaluada por el Director. Para moverla, elegí un ◆ o agregá un encuadre en este momento.</p>';
 }
 if(sn.pose&&e&&e.kind!=='camera'){
  html+='<h3>Cámara ahora</h3><p class="note" data-ws-camnote>Posición '+fmt(sn.pose.x)+', '+fmt(sn.pose.y)+', '+fmt(sn.pose.z)+' · giro '+fmt(sn.pose.rotateY)+'° / '+fmt(sn.pose.rotateX)+'°</p>';
 }
 box.innerHTML=html;
}
function renderTimeline(){
 var sn=ws.snap,seek=ws.root.querySelector('[data-ws-seek]'),m=ws.root.querySelector('[data-ws-markers]');
 if(!sn||!sn.enabled){seek.disabled=true;m.innerHTML='';return;}
 seek.disabled=false;seek.value=sn.pct;ws.root.querySelector('[data-ws-pct]').textContent=fmt(sn.pct)+'%';
 m.innerHTML=sn.keys.map(function(k){var on=ws.sel&&ws.sel.kind==='key'&&ws.sel.at===k.at;return '<button type="button" class="mk cam'+(on?' on':'')+'" style="left:calc(8px + (100% - 16px) * '+(k.at/100)+')" data-ws-mk="key:'+k.at+'" aria-label="Encuadre de cámara en '+fmt(k.at)+'%" title="'+fmt(k.at)+'% · arrastrá para cambiar el momento">◆</button>';}).join('')+
  sn.looks.map(function(k){var on=ws.sel&&ws.sel.kind==='look'&&ws.sel.at===k.at;return '<button type="button" class="mk look'+(on?' on':'')+'" style="left:calc(8px + (100% - 16px) * '+(k.at/100)+')" data-ws-mk="look:'+k.at+'" aria-label="Objetivo de mirada en '+fmt(k.at)+'%">●</button>';}).join('');
}
function syncView(){
 if(!ws)return;
 ws.root.querySelectorAll('[data-ws-view]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.wsView===ws.view.mode));});
 var info=ws.root.querySelector('[data-ws-viewinfo]');
 if(info)info.textContent='Vista: '+VIEW_NAMES[ws.view.mode]+(ws.view.mode==='persp'||ws.view.mode==='camera'?'':' · '+(ws.view.mode==='top'?'X derecha, Z arriba':ws.view.mode==='front'?'X derecha, Y arriba':'Z derecha, Y arriba'));
 var hint=ws.root.querySelector('[data-ws-hint]'),e=selEntity();
 if(hint)hint.textContent=!ws.snap||!ws.snap.enabled?'La cámara 3D está desactivada.':e?(e.movable?'Arrastrá una flecha para mover · Shift: preciso · Esc: cancelar · F: encuadrar':(e.kind==='camera'?'Cámara en este momento · elegí un ◆ para moverla':'Esta selección no se puede mover desde aquí')):'Arrastrá el fondo para girar · rueda para acercar · elegí algo para editarlo';
 var undo=ws.root.querySelector('[data-ws-undo]'),redo=ws.root.querySelector('[data-ws-redo]');
 if(undo)undo.disabled=!ws.host.canUndo();if(redo)redo.disabled=!ws.host.canRedo();
 var vk=ws.root.querySelector('[data-ws-view-to-key]');if(vk)vk.disabled=ws.view.mode==='camera'||!ws.snap||!ws.snap.enabled;
}

// ---------------------------------------------------------------- dibujo
function narrativePose(){var s=ws.snap;return Object.assign({},s.pose,{width:s.size.width,height:s.size.height,perspective:s.perspective});}
function fitCanvas(){
 var c=ws.canvas,r=c.getBoundingClientRect(),dpr=Math.max(1,Math.min(2.5,root.devicePixelRatio||1));
 var w=Math.max(10,Math.round(r.width)),h=Math.max(10,Math.round(r.height));
 if(w!==ws.w||h!==ws.h||dpr!==ws.dpr){ws.w=w;ws.h=h;ws.dpr=dpr;c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);}
}
function P(b,a){return V.project(b,V.toD(a));}
function line(ctx,b,p,q){var s=V.segment(b,V.toD(p),V.toD(q));if(!s||!s[0].visible||!s[1].visible)return false;ctx.moveTo(s[0].x,s[0].y);ctx.lineTo(s[1].x,s[1].y);return true;}
function poly(ctx,b,pts,close){
 ctx.beginPath();var any=false;
 for(var i=0;i<pts.length-(close?0:1);i++){var j=(i+1)%pts.length;if(line(ctx,b,pts[i],pts[j]))any=true;}
 return any;
}
function drawGrid(ctx,b){
 var sn=ws.snap,size=sn.size,mode=ws.view.mode;
 var ext=3500,step=250;
 ctx.save();ctx.lineWidth=1;
 if(mode==='front'||mode==='side'){
  // Rejilla en el plano de la pantalla (ortográfica).
  var t=ws.view.target,sc=ws.view.zoom,cx=ws.w/2,cy=ws.h/2,major=500,minor=100;
  var s=Math.max(minor,Math.round(60/sc/minor)*minor);
  var x0=Math.floor((-cx/sc)/s)*s,x1=(cx/sc)/s+1,y0=Math.floor((-cy/sc)/s)*s;
  ctx.strokeStyle='#1b2433';ctx.beginPath();
  var horizontal=mode==='front'?t.x:t.z,vertical=t.y;
  for(var gx=Math.floor((horizontal-cx/sc)/s)*s;gx<=horizontal+cx/sc;gx+=s){var px=cx+(gx-horizontal)*sc;ctx.moveTo(px,0);ctx.lineTo(px,ws.h);}
  for(var gy=Math.floor((vertical-cy/sc)/s)*s;gy<=vertical+cy/sc;gy+=s){var py=cy-(gy-vertical)*sc;ctx.moveTo(0,py);ctx.lineTo(ws.w,py);}
  ctx.stroke();ctx.restore();return;
 }
 var floor=-size.height/2; // suelo del escenario en coordenadas de vista (y arriba)
 var zmin=-1500,zmax=2500;
 ctx.strokeStyle=mode==='top'?'#1d2738':'#19212f';
 ctx.beginPath();
 for(var gx2=-ext;gx2<=ext;gx2+=step){line(ctx,b,{x:gx2,y:-floor,z:zmin},{x:gx2,y:-floor,z:zmax});}
 for(var gz=zmin;gz<=zmax;gz+=step){line(ctx,b,{x:-ext,y:-floor,z:gz},{x:ext,y:-floor,z:gz});}
 ctx.stroke();
 // Ejes en el origen de la autoría (centro del escenario, z = 0).
 ctx.lineWidth=2;
 AXES.forEach(function(a){
  ctx.strokeStyle=a.color;ctx.globalAlpha=.55;ctx.beginPath();
  var d=a.id==='y'?-1:1,len=a.id==='z'?1500:700;
  var end=V.toA(V.mul(a.dir,len));
  if(line(ctx,b,{x:0,y:0,z:0},{x:end.x,y:end.y,z:end.z})){ctx.stroke();var e=P(b,end);if(e.visible){ctx.globalAlpha=.9;ctx.fillStyle=a.color;ctx.font='12px system-ui';ctx.fillText(a.label,e.x+4,e.y-4);}}
 });
 ctx.restore();
}
function drawStage(ctx,b){
 var sn=ws.snap,w=sn.size.width,h=sn.size.height,z=sn.perspective;
 var c=[{x:-w/2,y:-h/2,z:z},{x:w/2,y:-h/2,z:z},{x:w/2,y:h/2,z:z},{x:-w/2,y:h/2,z:z}];
 ctx.save();ctx.strokeStyle='#5ee1ff';ctx.globalAlpha=.55;ctx.setLineDash([6,5]);ctx.lineWidth=1.2;
 if(poly(ctx,b,c,true))ctx.stroke();
 var a=P(b,c[0]);if(a.visible){ctx.setLineDash([]);ctx.fillStyle='#5ee1ff';ctx.globalAlpha=.9;ctx.font='11px system-ui';ctx.fillText('Escenario a tamaño real (profundidad 0)',a.x+4,a.y-5);}
 ctx.restore();
}
function drawObject(ctx,b,o,isSel){
 var sn=ws.snap,r=ROLE[o.role]||ROLE.other,box=objectBox(o,sn.size),hw=box.w/2,hh=box.h/2;
 ctx.save();ctx.strokeStyle=r.color;ctx.fillStyle=r.color;ctx.lineWidth=isSel?2.6:1.5;
 var pts=[];
 if(o.role==='3d'){
  var s=hw,d=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(function(q){return {x:o.x+q[0]*s,y:o.y+q[1]*s,z:o.z+q[2]*s};});
  var edges=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
  ctx.beginPath();edges.forEach(function(e){line(ctx,b,d[e[0]],d[e[1]]);});ctx.stroke();
  pts=d.map(function(q){return P(b,q);}).filter(function(p){return p.visible;});
 }else{
  var c=[{x:o.x-hw,y:o.y-hh,z:o.z},{x:o.x+hw,y:o.y-hh,z:o.z},{x:o.x+hw,y:o.y+hh,z:o.z},{x:o.x-hw,y:o.y+hh,z:o.z}];
  var proj=c.map(function(q){return P(b,q);});
  if(poly(ctx,b,c,true)){
   if(proj.every(function(p){return p.visible;})){ctx.globalAlpha=isSel?.22:.1;ctx.beginPath();proj.forEach(function(p,i){if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.closePath();ctx.fill();ctx.globalAlpha=1;ctx.beginPath();proj.forEach(function(p,i){if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.closePath();ctx.stroke();}
   else{ctx.stroke();}
  }
  pts=proj.filter(function(p){return p.visible;});
 }
 var cc=P(b,{x:o.x,y:o.y,z:o.z});
 if(cc.visible&&cc.x>-40&&cc.x<ws.w+40&&cc.y>-40&&cc.y<ws.h+40){
  ctx.font='12px system-ui';var label=r.glyph+' '+o.label,tw=ctx.measureText(label).width;
  ctx.globalAlpha=.92;ctx.fillStyle='#0b0e14';ctx.fillRect(cc.x-tw/2-5,cc.y-9,tw+10,18);ctx.globalAlpha=1;ctx.strokeStyle=r.color;ctx.lineWidth=isSel?2:1;ctx.strokeRect(cc.x-tw/2-5,cc.y-9,tw+10,18);
  ctx.fillStyle='#f2f5fa';ctx.textBaseline='middle';ctx.textAlign='center';ctx.fillText(label,cc.x,cc.y+.5);
  ws.pick.push({kind:'object',id:o.id,type:'rect',x:cc.x-tw/2-5,y:cc.y-9,w:tw+10,h:18,depth:cc.depth,prio:1});
 }
 if(pts.length>=2){
  var minx=Math.min.apply(null,pts.map(function(p){return p.x;})),maxx=Math.max.apply(null,pts.map(function(p){return p.x;})),miny=Math.min.apply(null,pts.map(function(p){return p.y;})),maxy=Math.max.apply(null,pts.map(function(p){return p.y;}));
  ws.pick.push({kind:'object',id:o.id,type:'rect',x:minx,y:miny,w:maxx-minx,h:maxy-miny,depth:cc.depth||1e9,prio:3});
 }
 ctx.restore();
}
function drawCameraNow(ctx,b){
 var sn=ws.snap,pose=sn.pose,ax=V.cameraAxes(pose),p=sn.perspective,hw=sn.size.width/2,hh=sn.size.height/2;
 var E={x:pose.x,y:pose.y,z:pose.z};
 function at(sx,sy,dist){var k=dist/p;return {x:E.x+ax.fwd.x*dist+ax.right.x*sx*hw*k+ax.down.x*sy*hh*k,y:E.y+ax.fwd.y*dist+ax.right.y*sx*hw*k+ax.down.y*sy*hh*k,z:E.z+ax.fwd.z*dist+ax.right.z*sx*hw*k+ax.down.z*sy*hh*k};}
 var far=at(0,0,p),corners=[at(-1,-1,p),at(1,-1,p),at(1,1,p),at(-1,1,p)];
 var sel=ws.sel&&ws.sel.kind==='camera';
 ctx.save();ctx.lineWidth=sel?2.6:1.8;ctx.strokeStyle='#ffffff';ctx.fillStyle='#ffffff';
 ctx.beginPath();corners.forEach(function(c){line(ctx,b,E,c);});ctx.stroke();
 ctx.strokeStyle='#ffd166';if(poly(ctx,b,corners,true))ctx.stroke();
 // Marca de "arriba" de la cámara.
 var top=at(0,-1.35,p);ctx.beginPath();line(ctx,b,corners[0],top);line(ctx,b,corners[1],top);ctx.stroke();
 var pc=corners.map(function(c){return P(b,c);});
 if(pc.every(function(q){return q.visible;})){ctx.globalAlpha=.04;ctx.beginPath();pc.forEach(function(q,i){if(i)ctx.lineTo(q.x,q.y);else ctx.moveTo(q.x,q.y);});ctx.closePath();ctx.fill();ctx.globalAlpha=1;}
 var e=P(b,E);
 if(e.visible){
  ctx.fillStyle='#ffd166';ctx.beginPath();ctx.arc(e.x,e.y,6,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#14110a';ctx.lineWidth=1.5;ctx.stroke();
  ctx.fillStyle='#fff';ctx.font='12px system-ui';ctx.textBaseline='alphabetic';ctx.textAlign='left';ctx.fillText('Cámara '+fmt(sn.pct)+'%',e.x+10,e.y-9);
  ws.pick.push({kind:'camera',type:'circle',x:e.x,y:e.y,r:12,depth:e.depth,prio:2});
 }
 ctx.restore();
}
function drawPaths(ctx,b){
 var sn=ws.snap;
 ctx.save();
 if(sn.path.length>1){ctx.strokeStyle='#ffb454';ctx.lineWidth=2;ctx.globalAlpha=.9;ctx.beginPath();for(var i=0;i<sn.path.length-1;i++)line(ctx,b,sn.path[i],sn.path[i+1]);ctx.stroke();
  for(var j=0;j<sn.path.length-1;j+=1){var a=P(b,sn.path[j]),c=P(b,sn.path[j+1]);if(a.visible&&c.visible&&Math.hypot(c.x-a.x,c.y-a.y)>.5)ws.pick.push({kind:'path',type:'seg',a:a,c:c,at:sn.path[j].at,t:0,prio:5,next:sn.path[j+1].at});}}
 if(sn.lookPath.length>1){ctx.strokeStyle='#5ee1ff';ctx.lineWidth=1.5;ctx.globalAlpha=.8;ctx.setLineDash([6,4]);ctx.beginPath();for(var k=0;k<sn.lookPath.length-1;k++)line(ctx,b,sn.lookPath[k],sn.lookPath[k+1]);ctx.stroke();ctx.setLineDash([]);}
 // Hacia dónde mira ahora.
 if(sn.lookNow){ctx.strokeStyle='#5ee1ff';ctx.globalAlpha=.55;ctx.setLineDash([2,5]);ctx.beginPath();if(line(ctx,b,sn.pose,sn.lookNow))ctx.stroke();ctx.setLineDash([]);var ln=P(b,sn.lookNow);if(ln.visible){ctx.globalAlpha=1;ctx.fillStyle='#5ee1ff';ctx.beginPath();ctx.arc(ln.x,ln.y,4,0,Math.PI*2);ctx.fill();}}
 sn.keys.forEach(function(k){
  var p=P(b,k);if(!p.visible)return;var on=ws.sel&&ws.sel.kind==='key'&&ws.sel.at===k.at,r=on?9:7;
  ctx.globalAlpha=1;ctx.fillStyle=on?'#ffd166':'#ffb454';ctx.strokeStyle='#14110a';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(p.x,p.y-r);ctx.lineTo(p.x+r,p.y);ctx.lineTo(p.x,p.y+r);ctx.lineTo(p.x-r,p.y);ctx.closePath();ctx.fill();ctx.stroke();
  if(on){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,r+5,0,Math.PI*2);ctx.stroke();}
  if(Math.abs(k.at-ws.snap.pct)>.05){ctx.fillStyle='#ffe0a8';ctx.font='11px system-ui';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText(fmt(k.at)+'%',p.x+r+3,p.y-r);}
  ws.pick.push({kind:'key',at:k.at,type:'circle',x:p.x,y:p.y,r:r+5,depth:p.depth,prio:0});
 });
 sn.looks.forEach(function(k){
  var p=P(b,k);if(!p.visible)return;var on=ws.sel&&ws.sel.kind==='look'&&ws.sel.at===k.at,r=on?7:5.5;
  ctx.globalAlpha=1;ctx.fillStyle=on?'#ffffff':'#5ee1ff';ctx.strokeStyle='#06161c';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();ctx.stroke();
  if(on){ctx.strokeStyle='#5ee1ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,r+5,0,Math.PI*2);ctx.stroke();}
  if(k.locked){ctx.fillStyle='#06161c';ctx.font='9px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🔗',p.x,p.y+.5);}
  ws.pick.push({kind:'look',at:k.at,type:'circle',x:p.x,y:p.y,r:r+5,depth:p.depth,prio:0});
 });
 ctx.restore();
}
function drawGizmo(ctx,b){
 ws.handles=[];
 var e=selEntity();if(!e||!e.movable)return;
 var pos=ws.drag&&ws.drag.preview?ws.drag.preview:e.pos,O=V.toD(pos),po=V.project(b,O);
 if(!po.visible)return;
 var wpp=V.worldPerPixel(b,O),L=104;
 ctx.save();ctx.lineCap='round';
 AXES.forEach(function(a){
  var tip=V.add(O,V.mul(a.dir,wpp*L)),pt=V.project(b,tip);
  var sx=pt.x-po.x,sy=pt.y-po.y,sl=Math.hypot(sx,sy);
  if(!pt.visible||sl<28)return; // eje casi de punta: se oculta (no se puede arrastrar bien)
  var active=ws.drag&&ws.drag.type==='axis'&&ws.drag.axis===a.id;
  ctx.strokeStyle=a.color;ctx.fillStyle=a.color;ctx.lineWidth=active?4:3;ctx.globalAlpha=active?1:.92;
  ctx.beginPath();ctx.moveTo(po.x,po.y);ctx.lineTo(pt.x,pt.y);ctx.stroke();
  var ang=Math.atan2(sy,sx);ctx.beginPath();ctx.moveTo(pt.x+Math.cos(ang)*11,pt.y+Math.sin(ang)*11);ctx.lineTo(pt.x+Math.cos(ang+2.5)*8,pt.y+Math.sin(ang+2.5)*8);ctx.lineTo(pt.x+Math.cos(ang-2.5)*8,pt.y+Math.sin(ang-2.5)*8);ctx.closePath();ctx.fill();
  ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#0b0e14';ctx.globalAlpha=.85;ctx.fillRect(pt.x+Math.cos(ang)*23-8,pt.y+Math.sin(ang)*23-8,16,16);ctx.globalAlpha=1;ctx.fillStyle=a.color;ctx.fillText(a.label,pt.x+Math.cos(ang)*23,pt.y+Math.sin(ang)*23+.5);
  ws.handles.push({type:'axis',axis:a.id,dir:a.dir,x1:po.x,y1:po.y,x2:pt.x,y2:pt.y,tipx:pt.x,tipy:pt.y});
 });
 ctx.globalAlpha=1;ctx.fillStyle='#fff';ctx.strokeStyle='#0b0e14';ctx.lineWidth=1.5;ctx.fillRect(po.x-7,po.y-7,14,14);ctx.strokeRect(po.x-7,po.y-7,14,14);
 ws.handles.push({type:'plane',x:po.x,y:po.y});
 ctx.restore();
}
function draw(){
 if(!ws)return;
 fitCanvas();
 var ctx=ws.ctx,c=ws.canvas;ctx.setTransform(ws.dpr,0,0,ws.dpr,0,0);
 ctx.clearRect(0,0,ws.w,ws.h);ctx.fillStyle='#0b0e14';ctx.fillRect(0,0,ws.w,ws.h);
 ws.pick=[];
 var sn=ws.snap;
 if(!sn||!sn.enabled){ctx.fillStyle='#c8d2e4';ctx.font='15px system-ui';ctx.textAlign='center';ctx.fillText('Activá la Cámara 3D en el panel para ver y editar el espacio.',ws.w/2,ws.h/2);return;}
 var b=V.basis(ws.view,ws.w,ws.h,narrativePose());
 ws.b=b;
 drawGrid(ctx,b);drawStage(ctx,b);
 var objs=sn.objects.map(function(o){return {o:o,d:V.dot(V.sub(V.toD(o),b.eye),b.fwd)};}).sort(function(a,c2){return c2.d-a.d;});
 objs.forEach(function(it){var drag=ws.drag&&ws.drag.kind==='object'&&String(ws.drag.id)===String(it.o.id)&&ws.drag.preview;var o=drag?Object.assign({},it.o,ws.drag.preview):it.o;drawObject(ctx,b,o,ws.sel&&ws.sel.kind==='object'&&String(ws.sel.id)===String(o.id));});
 drawPaths(ctx,b);
 if(ws.view.mode!=='camera')drawCameraNow(ctx,b);
 else{ctx.save();ctx.strokeStyle='#ffd166';ctx.lineWidth=2;ctx.setLineDash([8,6]);var mw=Math.min(ws.w*.92,ws.h*.92*sn.size.width/sn.size.height),mh=mw*sn.size.height/sn.size.width;ctx.strokeRect((ws.w-mw)/2,(ws.h-mh)/2,mw,mh);ctx.restore();}
 drawGizmo(ctx,b);
 // Brújula de ejes
 ctx.save();ctx.font='11px system-ui';ctx.textBaseline='middle';var ox=44,oy=ws.h-64;
 AXES.forEach(function(a){var q=V.add(V.v(0,0,0),V.mul(a.dir,1));var rx=V.dot(q,b.right),ry=V.dot(q,b.up);ctx.strokeStyle=a.color;ctx.fillStyle=a.color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(ox+rx*30,oy-ry*30);ctx.stroke();ctx.fillText(a.label,ox+rx*38-3,oy-ry*38);});
 ctx.restore();
 ws.canvas.setAttribute('aria-label','Vista 3D '+VIEW_NAMES[ws.view.mode]+'. '+sn.objects.length+' objetos, '+sn.keys.length+' encuadres de cámara. Cámara al '+fmt(sn.pct)+' por ciento.');
}

// ---------------------------------------------------------------- interacción
function localPoint(ev){var r=ws.canvas.getBoundingClientRect();return {x:ev.clientX-r.left,y:ev.clientY-r.top};}
function hitHandle(p){
 for(var i=0;i<ws.handles.length;i++){
  var h=ws.handles[i];
  if(h.type==='plane'&&Math.abs(p.x-h.x)<=10&&Math.abs(p.y-h.y)<=10)return h;
 }
 for(var j=0;j<ws.handles.length;j++){
  var a=ws.handles[j];
  if(a.type==='axis'&&V.distSegment(p.x,p.y,{x:a.x1,y:a.y1},{x:a.x2,y:a.y2})<=9)return a;
 }
 return null;
}
function hitPick(p){
 var best=null;
 ws.pick.forEach(function(it){
  var d=null;
  if(it.type==='circle'){var dd=Math.hypot(p.x-it.x,p.y-it.y);if(dd<=it.r)d=dd;}
  else if(it.type==='rect'){if(p.x>=it.x-4&&p.x<=it.x+it.w+4&&p.y>=it.y-4&&p.y<=it.y+it.h+4)d=0.5;}
  else if(it.type==='seg'){var ds=V.distSegment(p.x,p.y,it.a,it.c);if(ds<=7)d=ds;}
  if(d===null)return;
  var score=it.prio*100000+(it.type==='rect'&&it.prio===3?(it.w*it.h)/1000:d)+(it.depth||0)*1e-6;
  if(!best||score<best.score)best={it:it,score:score};
 });
 return best&&best.it;
}
function select(kind,idOrAt,fromHost){
 if(kind==='path'){return;}
 ws.sel=kind==='object'?{kind:'object',id:idOrAt}:kind==='camera'?{kind:'camera'}:{kind:kind,at:+idOrAt};
 if(!fromHost)ws.host.select(ws.sel);
 ws.snap=ws.host.snapshot(true);
 render();invalidate();
}
function startAxisDrag(ev,h){
 var e=selEntity();if(!e||!e.movable)return;
 var p=localPoint(ev),b=ws.b,O=V.toD(e.pos),r=V.ray(b,p.x,p.y),t0=V.axisParam(r,O,h.dir);
 if(t0===null)return;
 ws.drag={type:'axis',axis:h.axis,dir:h.dir,kind:e.kind,id:ws.sel.id,at:ws.sel.at,origin:e.pos,O:O,t0:t0,preview:null,pid:ev.pointerId,sx:ev.clientX,sy:ev.clientY};
 ws.canvas.setPointerCapture(ev.pointerId);
}
function startPlaneDrag(ev){
 var e=selEntity();if(!e||!e.movable)return;
 var p=localPoint(ev),b=ws.b,O=V.toD(e.pos),h0=V.planeHit(V.ray(b,p.x,p.y),O,b.fwd);
 if(!h0)return;
 ws.drag={type:'plane',kind:e.kind,id:ws.sel.id,at:ws.sel.at,origin:e.pos,O:O,h0:h0,preview:null,pid:ev.pointerId,sx:ev.clientX,sy:ev.clientY};
 ws.canvas.setPointerCapture(ev.pointerId);
}
function dragMove(ev){
 var d=ws.drag;if(!d||ev.pointerId!==d.pid)return;
 var p=localPoint(ev),b=ws.b,r=V.ray(b,p.x,p.y);
 if(d.type==='orbit'){
  var dx=ev.clientX-d.sx,dy=ev.clientY-d.sy;
  if(ws.view.mode==='persp'){ws.view.yaw=d.yaw0+dx*.006;ws.view.pitch=V.clamp(d.pitch0+dy*.006,-1.45,1.45);}
  else if(ws.view.mode==='camera'){ws.view=Object.assign({},ws.view,{mode:'persp'});d.yaw0=ws.view.yaw-dx*.006;}
  else{ pan(dx,dy,d); }
  invalidate();return;
 }
 if(d.type==='pan'){pan(ev.clientX-d.sx,ev.clientY-d.sy,d);invalidate();return;}
 var delta=null;
 if(d.type==='axis'){
  var t=V.axisParam(r,d.O,d.dir);if(t===null)return;
  var amount=(t-d.t0)*(ev.shiftKey?.2:1);
  if(ev.ctrlKey||ev.metaKey)amount=Math.round(amount/25)*25;
  delta=V.mul(d.dir,amount);
 }else if(d.type==='plane'){
  var h=V.planeHit(r,d.O,b.fwd);if(!h)return;
  delta=V.sub(h,d.h0);
  if(ev.shiftKey){var ex=V.dot(delta,b.right),ey=V.dot(delta,b.up);delta=Math.abs(ex)>=Math.abs(ey)?V.mul(b.right,ex):V.mul(b.up,ey);}
  else if(ev.ctrlKey||ev.metaKey){delta=V.v(Math.round(delta.x/25)*25,Math.round(delta.y/25)*25,Math.round(delta.z/25)*25);}
 }
 if(!delta)return;
 var A=V.toA(V.add(d.O,delta));
 d.preview={x:r1(A.x),y:r1(A.y),z:r1(A.z)};
 d.moved=d.moved||Math.hypot(ev.clientX-d.sx,ev.clientY-d.sy)>3;
 invalidate();
}
function pan(dx,dy,d){
 var b=ws.b,wpp=V.worldPerPixel(b,ws.view.target);
 ws.view.target=V.add(d.target0,V.add(V.mul(b.right,-dx*wpp),V.mul(b.up,dy*wpp)));
}
function endDrag(ev,cancel){
 var d=ws.drag;if(!d||(ev&&ev.pointerId!==undefined&&ev.pointerId!==d.pid))return;
 ws.drag=null;
 try{ws.canvas.releasePointerCapture(d.pid);}catch(_){}
 ws.canvas.style.cursor='';
 if(d.type==='axis'||d.type==='plane'){
  if(!cancel&&d.preview&&d.moved){
   var ok=ws.host.move(d.kind,d.kind==='object'?d.id:d.at,d.preview);
   if(!ok)say('No se pudo mover: está bloqueado o ya estaba en ese lugar.');
   ws.snap=ws.host.snapshot(true);render();
  }
  invalidate();return;
 }
 if(d.type==='orbit'&&!d.moved&&!cancel&&!d.shifted){ /* clic en el fondo: no cambia la selección */ }
 invalidate();
}
function onDown(ev){
 if(!ws.snap||!ws.snap.enabled)return;
 ws.canvas.focus({preventScroll:true});
 var p=localPoint(ev);
 if(ev.button===1||ev.button===2||ws.space){
  ev.preventDefault();
  ws.drag={type:'pan',sx:ev.clientX,sy:ev.clientY,target0:Object.assign({},ws.view.target),pid:ev.pointerId};ws.canvas.setPointerCapture(ev.pointerId);ws.canvas.style.cursor='move';return;
 }
 if(ev.button!==0)return;
 var h=hitHandle(p);
 if(h){ev.preventDefault();if(h.type==='axis')startAxisDrag(ev,h);else startPlaneDrag(ev);return;}
 var hit=hitPick(p);
 if(hit){
  if(hit.kind==='path'){
   // Un clic sobre el recorrido lleva el Director a ese punto.
   var a=hit.a,c=hit.c,l=Math.hypot(c.x-a.x,c.y-a.y)||1,t=V.clamp(((p.x-a.x)*(c.x-a.x)+(p.y-a.y)*(c.y-a.y))/(l*l),0,1);
   ws.host.scrub(hit.at+(hit.next-hit.at)*t);return;
  }
  if(hit.kind==='camera'){select('camera');return;}
  select(hit.kind,hit.kind==='object'?hit.id:hit.at);
  // Un ◆/● recién elegido también lleva el Director a su momento.
  if(hit.kind==='key'||hit.kind==='look')ws.host.scrub(hit.at);
  return;
 }
 ev.preventDefault();
 ws.drag={type:'orbit',sx:ev.clientX,sy:ev.clientY,yaw0:ws.view.yaw,pitch0:ws.view.pitch,target0:Object.assign({},ws.view.target),pid:ev.pointerId,moved:false};
 ws.canvas.setPointerCapture(ev.pointerId);ws.canvas.style.cursor='grabbing';
}
function onMove(ev){
 if(!ws)return;
 if(ws.drag){if(ws.drag.type==='orbit')ws.drag.moved=true;dragMove(ev);return;}
 if(!ws.snap||!ws.snap.enabled)return;
 var p=localPoint(ev),h=hitHandle(p),hit=h?null:hitPick(p);
 ws.canvas.style.cursor=h?'pointer':hit?'pointer':(ws.space?'move':'grab');
}
function onWheel(ev){
 ev.preventDefault();
 var k=Math.exp(-V.clamp(ev.deltaY,-300,300)*.0015);
 zoomBy(k,localPoint(ev));
}
function zoomBy(k){
 if(ws.view.mode==='persp'||ws.view.mode==='camera'){ws.view.mode='persp';ws.view.dist=V.clamp(ws.view.dist/k,200,40000);}
 else ws.view.zoom=V.clamp(ws.view.zoom*k,.02,6);
 syncView();invalidate();
}
function setView(mode){
 if(!ws||!VIEW_NAMES[mode])return;
 if(mode==='camera'&&(!ws.snap||!ws.snap.enabled))return;
 var next=Object.assign({},ws.view,{mode:mode});
 if(mode!=='camera'&&mode!=='persp'&&ws.view.mode==='persp'){/* conserva el centro de la órbita */}
 ws.view=next;
 if(mode==='top'||mode==='front'||mode==='side')ws.view=V.frameView(ws.view,entityPoints(),ws.w,ws.h);
 syncView();invalidate();
}
function nudge(key,shift){
 var e=selEntity();if(!e||!e.movable)return;
 var step=shift?100:25,b=ws.b,p=Object.assign({},e.pos);
 // Las flechas siguen la pantalla: derecha/izquierda = eje horizontal de la vista; arriba/abajo = eje vertical.
 var rd=pickAxis(b.right),ud=pickAxis(b.up);
 var sgnR=key==='ArrowRight'?1:key==='ArrowLeft'?-1:0,sgnU=key==='ArrowUp'?1:key==='ArrowDown'?-1:0;
 var dD=V.add(V.mul(rd.axis,rd.sign*sgnR*step),V.mul(ud.axis,ud.sign*sgnU*step));
 var A=V.toA(V.add(V.toD(p),dD));
 if(ws.host.move(e.kind,e.kind==='object'?ws.sel.id:ws.sel.at,{x:r1(A.x),y:r1(A.y),z:r1(A.z)})){ws.snap=ws.host.snapshot(true);render();invalidate();}
}
function pickAxis(vec){
 var ax=Math.abs(vec.x),ay=Math.abs(vec.y),az=Math.abs(vec.z);
 if(ax>=ay&&ax>=az)return {axis:V.v(1,0,0),sign:vec.x>=0?1:-1};
 if(ay>=ax&&ay>=az)return {axis:V.v(0,1,0),sign:vec.y>=0?1:-1};
 return {axis:V.v(0,0,1),sign:vec.z>=0?1:-1};
}

function bind(){
 var r=ws.root,c=ws.canvas;
 listen(c,'pointerdown',onDown);listen(c,'pointermove',onMove);
 listen(c,'pointerup',function(ev){endDrag(ev,false);});
 listen(c,'pointercancel',function(ev){endDrag(ev,true);});
 listen(c,'lostpointercapture',function(ev){if(ws&&ws.drag&&ws.drag.pid===ev.pointerId)endDrag(ev,true);});
 listen(c,'wheel',onWheel,{passive:false});
 listen(c,'contextmenu',function(ev){ev.preventDefault();});
 listen(c,'dblclick',function(ev){var hit=hitPick(localPoint(ev));if(hit&&hit.kind==='object'){select('object',hit.id);frameSelection();}});
 listen(root,'resize',function(){invalidate();});
 if(typeof ResizeObserver==='function'){var ro=new ResizeObserver(function(){invalidate();});ro.observe(c);ws.cleanup.push(function(){ro.disconnect();});}
 listen(r,'keydown',onKey);
 listen(r,'keyup',function(ev){if(ev.key===' ')ws.space=false;});
 listen(r,'click',onClick);
 listen(r,'change',onChange);
 listen(r,'input',function(ev){
  if(ev.target.matches('[data-ws-seek]')){ws.host.scrub(+ev.target.value);}
 });
 // Marcadores de la línea de tiempo: clic = ir; arrastrar = cambiar de momento.
 listen(r,'pointerdown',function(ev){
  var mk=ev.target.closest&&ev.target.closest('[data-ws-mk]');if(!mk||ev.button!==0)return;
  var parts=mk.dataset.wsMk.split(':'),kind=parts[0],at=+parts[1];if(kind!=='key')return;
  var tl=r.querySelector('[data-ws-timeline]'),rect={width:Math.max(1,tl.getBoundingClientRect().width-16)},startX=ev.clientX,moved=false,to=at,pid=ev.pointerId;
  mk.setPointerCapture(pid);
  function mv(e){if(e.pointerId!==pid)return;if(Math.abs(e.clientX-startX)<4&&!moved)return;moved=true;to=Math.round(V.clamp(at+(e.clientX-startX)/rect.width*100,0,100)*10)/10;mk.style.left='calc(8px + (100% - 16px) * '+(to/100)+')';}
  function up(e){
   if(e.pointerId!==pid)return;mk.removeEventListener('pointermove',mv);mk.removeEventListener('pointerup',up);mk.removeEventListener('pointercancel',cn);mk.removeEventListener('keydown',kd);
   if(moved&&to!==at){var ok=ws.host.retime(at,to);if(!ok)say('Ya hay un encuadre en ese momento.');ws.snap=ws.host.snapshot(true);ws.sel={kind:'key',at:ok?to:at};render();invalidate();}
   else{select('key',at);ws.host.scrub(at);}
  }
  function cn(e){if(e.pointerId!==pid)return;mk.removeEventListener('pointermove',mv);mk.removeEventListener('pointerup',up);mk.removeEventListener('pointercancel',cn);mk.removeEventListener('keydown',kd);mk.style.left='calc(8px + (100% - 16px) * '+(at/100)+')';}
  function kd(e){if(e.key==='Escape'){e.stopPropagation();e.preventDefault();cn({pointerId:pid});}}
  mk.addEventListener('pointermove',mv);mk.addEventListener('pointerup',up);mk.addEventListener('pointercancel',cn);mk.addEventListener('keydown',kd);
 });
}
function onClick(ev){
 var t=ev.target,btn=t.closest&&t.closest('button');if(!btn)return;
 if(btn.dataset.wsView){setView(btn.dataset.wsView);return;}
 if(btn.dataset.wsZoom!==undefined){zoomBy(+btn.dataset.wsZoom>0?1.25:.8);return;}
 if(btn.hasAttribute('data-ws-frame')){frameSelection();return;}
 if(btn.hasAttribute('data-ws-frame-all')){frameAll();return;}
 if(btn.hasAttribute('data-ws-close')){close();return;}
 if(btn.hasAttribute('data-ws-undo')){ws.host.undo();afterHistory();return;}
 if(btn.hasAttribute('data-ws-redo')){ws.host.redo();afterHistory();return;}
 if(btn.hasAttribute('data-ws-help')){var hb=ws.root.querySelector('[data-ws-helpbox]');var on=hb.classList.toggle('on');btn.setAttribute('aria-expanded',String(on));return;}
 if(btn.dataset.wsPick){var parts=btn.dataset.wsPick.split(':'),kind=parts[0],id=parts.slice(1).join(':');select(kind,id);if(kind==='key'||kind==='look')ws.host.scrub(+id);frameSelectionIfOutside();return;}
 if(btn.hasAttribute('data-ws-add-key')){var r=ws.host.addKey();ws.snap=ws.host.snapshot(true);if(r&&r.at!==undefined)ws.sel={kind:'key',at:r.at};say(r&&r.created?'Encuadre agregado en '+fmt(r.at)+'%.':r&&r.selected?'Ya había un encuadre aquí; lo elegí.':'No se pudo agregar (máximo de encuadres).');render();invalidate();return;}
 if(btn.hasAttribute('data-ws-view-to-key')){
  if(ws.view.mode!=='persp'){say('Pasá a la vista Perspectiva para usarla como encuadre.');return;}
  var ok=ws.host.applyPose(V.poseFromView(ws.view));ws.snap=ws.host.snapshot(true);
  var cur=ws.snap.keys.find(function(k){return Math.abs(k.at-ws.snap.pct)<.06;});if(cur)ws.sel={kind:'key',at:cur.at};
  say(ok?'La vista de trabajo quedó como encuadre de este momento.':'No se pudo aplicar la vista.');render();invalidate();return;
 }
 if(btn.hasAttribute('data-ws-goto')){var s=ws.sel;if(s&&s.at!==undefined)ws.host.scrub(s.at);return;}
 if(btn.hasAttribute('data-ws-aim')){var res=ws.host.aimAtSelected();say(res==='coincident'?'La cámara ya está en el mismo punto que el objeto.':res==='limit'?'Máximo de puntos alcanzado.':res==='unchanged'?'Ya apuntaba a este objeto.':'La cámara apunta al objeto en este momento.');ws.snap=ws.host.snapshot(true);render();invalidate();return;}
}
function frameSelectionIfOutside(){
 var e=selEntity();if(!e||!ws.b)return;
 var p=V.project(ws.b,V.toD(e.pos));
 if(!p.visible||p.x<20||p.y<20||p.x>ws.w-20||p.y>ws.h-20){
  if(ws.view.mode==='persp'||ws.view.mode==='camera'){ws.view.target=V.toD(e.pos);}
  else ws.view.target=V.toD(e.pos);
  invalidate();
 }
}
function afterHistory(){if(!ws)return;ws.snap=ws.host.snapshot(true);render();invalidate();}
function onChange(ev){
 var f=ev.target.closest&&ev.target.closest('[data-ws-field]');if(!f||f.disabled)return;
 var key=f.dataset.wsField,val=+f.value,e=selEntity();
 if(!e||!Number.isFinite(val))return;
 if(key==='at'&&e.kind==='key'){var ok=ws.host.retime(e.ref.at,val);if(!ok)say('Ya hay un encuadre en ese momento.');else ws.sel={kind:'key',at:Math.round(Math.max(0,Math.min(100,val))*10)/10};ws.snap=ws.host.snapshot(true);render();invalidate();return;}
 if(!e.movable)return;
 var p=Object.assign({},e.pos);p[key]=Math.max(-4000,Math.min(4000,val));
 if(!ws.host.move(e.kind,e.kind==='object'?ws.sel.id:ws.sel.at,p))say('Ese valor no cambia nada.');
 ws.snap=ws.host.snapshot(true);render();invalidate();
}
function onKey(ev){
 if(!ws)return;
 var tag=ev.target&&ev.target.tagName,typing=tag==='INPUT'&&ev.target.type!=='range'&&ev.target.type!=='checkbox';
 if(ev.key==='Escape'){
  ev.preventDefault();ev.stopPropagation();
  if(ws.drag){endDrag(null,true);if(ws.drag===null){/* cancelado */}return;}
  var hb=ws.root.querySelector('[data-ws-helpbox]');if(hb.classList.contains('on')){hb.classList.remove('on');ws.root.querySelector('[data-ws-help]').setAttribute('aria-expanded','false');return;}
  if(typing){ev.target.blur();return;}
  close();return;
 }
 if(ev.key==='Tab'){ // el foco no escapa del diálogo
  var f=Array.from(ws.root.querySelectorAll('button:not(:disabled),input:not(:disabled),canvas'));
  if(!f.length)return;var first=f[0],last=f[f.length-1];
  if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last.focus();}
  else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first.focus();}
  return;
 }
 if(typing)return;
 if((ev.ctrlKey||ev.metaKey)&&(ev.key==='z'||ev.key==='Z')){ev.preventDefault();ev.stopPropagation();if(ev.shiftKey)ws.host.redo();else ws.host.undo();afterHistory();return;}
 if((ev.ctrlKey||ev.metaKey)&&(ev.key==='y'||ev.key==='Y')){ev.preventDefault();ev.stopPropagation();ws.host.redo();afterHistory();return;}
 if(ev.ctrlKey||ev.metaKey||ev.altKey)return;
 if(ev.key===' '&&ev.target===ws.canvas){ev.preventDefault();ws.space=true;ws.canvas.style.cursor='move';return;}
 if(VIEW_KEYS[ev.key]){ev.preventDefault();setView(VIEW_KEYS[ev.key]);return;}
 if(ev.key==='f'||ev.key==='F'){ev.preventDefault();frameSelection();return;}
 if(ev.key==='Home'){ev.preventDefault();frameAll();return;}
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].indexOf(ev.key)>=0&&ev.target===ws.canvas){ev.preventDefault();nudge(ev.key,ev.shiftKey);return;}
 if((ev.key==='+'||ev.key==='=')&&ev.target===ws.canvas){zoomBy(1.2);return;}
 if(ev.key==='-'&&ev.target===ws.canvas){zoomBy(1/1.2);return;}
}

// El anfitrión avisa cuando cambió el proyecto o el progreso.
function notify(kind){
 if(!ws)return;
 var prev=ws.snap;
 var next=ws.host.snapshot(kind!=='progress');
 if(kind==='progress'&&prev){
  // Sólo cambia lo que depende del momento: pose, mirada y posiciones evaluadas.
  ws.snap=Object.assign({},prev,{pct:next.pct,pose:next.pose,lookNow:next.lookNow,objects:next.objects||prev.objects});
  ws.root.querySelector('[data-ws-pct]').textContent=fmt(next.pct)+'%';
  var sk=ws.root.querySelector('[data-ws-seek]');if(sk&&document.activeElement!==sk)sk.value=next.pct;
  var cn=ws.root.querySelector('[data-ws-camnote]');if(cn&&next.pose)cn.textContent='Posición '+fmt(next.pose.x)+', '+fmt(next.pose.y)+', '+fmt(next.pose.z)+' · giro '+fmt(next.pose.rotateY)+'° / '+fmt(next.pose.rotateX)+'°';
  invalidate();return;
 }
 ws.snap=next;
 if(next&&next.selection&&!ws.drag)ws.sel=next.selection;
 if(!ws.drag){render();}
 invalidate();
}

root.NAGWEB_SPATIAL_WORKSPACE={
 open:open,close:close,isOpen:function(){return !!ws;},notify:notify,
 // Pruebas: estado interno de sólo lectura.
 _state:function(){return ws&&{view:Object.assign({},ws.view),sel:ws.sel&&Object.assign({},ws.sel),drag:!!ws.drag,w:ws.w,h:ws.h,handles:ws.handles.length};},
 // Sólo para pruebas: posiciones en pantalla (px de página) de gizmo y elementos elegibles.
 _screen:function(){
  if(!ws)return null;var r=ws.canvas.getBoundingClientRect(),off=function(q){return {x:Math.round((r.left+q.x)*10)/10,y:Math.round((r.top+q.y)*10)/10};};
  return {handles:ws.handles.map(function(h){return h.type==='axis'?{type:'axis',axis:h.axis,from:off({x:h.x1,y:h.y1}),to:off({x:h.x2,y:h.y2})}:{type:'plane',at:off({x:h.x,y:h.y})};}),
   pick:ws.pick.filter(function(p){return p.kind!=='path';}).map(function(p){var c=p.type==='circle'?{x:p.x,y:p.y}:{x:p.x+p.w/2,y:p.y+p.h/2};return Object.assign({kind:p.kind,id:p.id,at:p.at,type:p.type},off(c));}),
   canvas:{x:r.left,y:r.top,w:r.width,h:r.height}};
 }
};
})(typeof window!=='undefined'?window:globalThis);
