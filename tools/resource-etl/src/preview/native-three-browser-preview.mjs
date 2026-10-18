// Exact native NagWeb geometry kind, not a reproduction of the upstream demo.
// WebGL renderer owned by NagWeb; only validated shape/color/speed cross boundary.
import { nativeThreeGeometrySpec } from "../runtime/nagweb-three-native.mjs";
export function buildNativeThreePreview(resource, values={}) {
  const spec=nativeThreeGeometrySpec(resource);
  if(!spec||!["icosa","box","sphere"].includes(spec.shape)||
    !/^#[0-9a-fA-F]{6}$/.test(spec.color))return null;
  const speed=Number.isFinite(values.speed)&&values.speed>=0&&values.speed<=4?values.speed:1;
  const data=JSON.stringify({shape:spec.shape,color:spec.color,speed});
  const js=[
    "(()=>{const cfg="+data+";const canvas=document.querySelector('canvas');",
    "const msg=document.querySelector('[data-error]');",
    "const fail=e=>{document.body.dataset.previewStatus='unavailable';msg.hidden=false;msg.textContent=String(e).slice(0,250);};",
    "try {const gl=canvas.getContext('webgl',{alpha:false,antialias:true});",
    "if(!gl)throw Error('WebGL no disponible');",
    "const compile=(type,src)=>{const sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);",
    "if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error('No pude compilar el visor 3D');return sh;};",
    "const vs=compile(gl.VERTEX_SHADER,'attribute vec3 aPos;uniform float rx;uniform float ry;'+",
    "'varying float light;void main(){float c=cos(ry),s=sin(ry),a=cos(rx),b=sin(rx);'+",
    "'vec3 p=vec3(c*aPos.x+s*aPos.z,aPos.y,-s*aPos.x+c*aPos.z);'+",
    "'p=vec3(p.x,a*p.y-b*p.z,b*p.y+a*p.z);'+",
    "'gl_Position=vec4(p.xy*2.3,p.z*.4,5.0+p.z);light=.55+.35*p.z/2.0;}');",
    "const fs=compile(gl.FRAGMENT_SHADER,'precision mediump float;uniform vec3 color;varying float light;'+",
    "'void main(){gl_FragColor=vec4(color*light,1.);}');",
    "const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);",
    "gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Visor WebGL inválido');",
    "gl.useProgram(program);const verts=[];const face=(a,b,c)=>verts.push(...a,...b,...c);",
    "if(cfg.shape==='icosa'){const t=(1+Math.sqrt(5))/2;",
    "const v=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]]",
    ".map(p=>p.map(n=>1.45*n/Math.hypot(...p)));",
    "for(const [a,b,c] of [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],",
    "[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],",
    "[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]])face(v[a],v[b],v[c]);}",
    "else if(cfg.shape==='box'){const v=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],",
    "[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];for(const [a,b,c,d] of",
    "[[0,3,2,1],[4,5,6,7],[0,1,5,4],[3,7,6,2],[1,2,6,5],[0,4,7,3]])",
    "{face(v[a],v[b],v[c]);face(v[a],v[c],v[d]);}}",
    "else{const p=(y,x)=>{const a=y*Math.PI/16,b=x*Math.PI*2/24;",
    "return [1.45*Math.sin(a)*Math.cos(b),1.45*Math.cos(a),1.45*Math.sin(a)*Math.sin(b)];};",
    "for(let y=0;y<16;y++)for(let x=0;x<24;x++){const a=p(y,x),b=p(y+1,x),c=p(y+1,x+1),d=p(y,x+1);",
    "face(a,b,c);face(a,c,d);}}",
    "const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);",
    "gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);",
    "const pos=gl.getAttribLocation(program,'aPos');gl.enableVertexAttribArray(pos);",
    "gl.vertexAttribPointer(pos,3,gl.FLOAT,false,0,0);",
    "gl.uniform3f(gl.getUniformLocation(program,'color'),",
    "parseInt(cfg.color.slice(1,3),16)/255,parseInt(cfg.color.slice(3,5),16)/255,parseInt(cfg.color.slice(5,7),16)/255);",
    "const ux=gl.getUniformLocation(program,'rx'),uy=gl.getUniformLocation(program,'ry');",
    "gl.enable(gl.DEPTH_TEST);",
    "let x=-.25,y=.55,last=0,held=false,px=0,py=0,frame=0;",
    "canvas.addEventListener('pointerdown',e=>{held=true;px=e.clientX;py=e.clientY;canvas.setPointerCapture(e.pointerId);});",
    "canvas.addEventListener('pointermove',e=>{if(!held)return;y+=(e.clientX-px)*.01;x+=(e.clientY-py)*.01;px=e.clientX;py=e.clientY;});",
    "canvas.addEventListener('pointerup',()=>held=false);canvas.addEventListener('pointercancel',()=>held=false);",
    "const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;",
    "function draw(ms){const dt=Math.min(.05,(ms-last)/1000||0);last=ms;if(!held&&!reduced)y+=dt*cfg.speed*.7;",
    "const w=Math.min(800,Math.max(128,canvas.clientWidth*(devicePixelRatio||1)|0));",
    "const h=Math.min(480,Math.max(96,canvas.clientHeight*(devicePixelRatio||1)|0));",
    "if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}",
    "gl.viewport(0,0,w,h);gl.clearColor(.06,.11,.18,1);",
    "gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform1f(ux,x);gl.uniform1f(uy,y);",
    "gl.drawArrays(gl.TRIANGLES,0,verts.length/3);document.body.dataset.previewStatus='rendered';",
    "frame=requestAnimationFrame(draw);}",
    "document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(frame);else last=0,requestAnimationFrame(draw);});",
    "requestAnimationFrame(draw);",
    "}catch(e){fail(e?.message||e);}})();"
  ].join("\n");
  const csp="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; base-uri 'none'; form-action 'none'";
  return '<!doctype html><html lang="es"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<meta http-equiv="Content-Security-Policy" content="'+csp+'">'+
    '<style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#101d2e}'+
    'canvas{display:block;width:100%;height:100%;cursor:grab;touch-action:none}canvas:active{cursor:grabbing}'+
    '[hidden]{display:none!important}[data-error]{position:absolute;inset:0;display:grid;place-items:center;color:white;'+
    'font:14px system-ui;padding:18px;background:#102030}</style></head><body data-native-geometry="'+
    spec.shape+'" data-native-speed="'+speed+'">'+
    '<canvas role="img" aria-label="Vista 3D del objeto editable de NagWeb"></canvas>'+
    '<div data-error hidden></div><script>'+js+'</'+'script></body></html>';
}
