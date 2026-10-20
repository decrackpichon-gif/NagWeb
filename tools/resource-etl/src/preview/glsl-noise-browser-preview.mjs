// Real offline WebGL visualization of the SOURCE GLSL function. Script code
// is owned by NagWeb, never supplied by the shader or a remote endpoint.
import {
  normalizeGlslNoiseValues, adaptNoiseCode, noiseMainGlsl, SCSHADER_GLSL_SHIM,
  GLSL_NOISE_GRAIN_DEFAULT, hexToRgb01, rgb01ToLab
} from "../runtime/glsl-noise-params.mjs";
const FAMILIES=Object.freeze({classic:"cnoise",periodic:"pnoise",simplex:"snoise"});
const DIMENSIONS=new Set(["2d","3d","4d"]);
export function isVerifiedNoiseShader(resource){
  const setup=resource?.runtime?.setup||{},name=setup.family,dim=setup.dimension;
  return resource?.license?.verified===true&&resource.source?.provider==="glsl-noise"&&
    resource.runtime?.renderer==="nagweb-glsl-snippet"&&Object.hasOwn(FAMILIES,name)&&
    DIMENSIONS.has(dim)&&resource.id==="glsl-noise:"+name+":"+dim&&
    setup.exportedSymbol===FAMILIES[name]&&resource.artifacts?.some(a=>
      a.id===resource.runtime.entryArtifactId&&a.role==="source"&&a.format==="glsl"&&
      typeof a.content==="string"&&a.content.length>100&&a.content.length<=20000);
}
export function buildGlslNoisePreview(resource,{thumbnail=false,values={}}={}){
  if(!isVerifiedNoiseShader(resource))return null;
  const setup=resource.runtime.setup,artifact=resource.artifacts.find(a=>a.id===resource.runtime.entryArtifactId);
  const code=artifact.content,name=setup.exportedSymbol,arity=Number(setup.dimension[0]);
  if(!new RegExp("\\bfloat\\s+"+name+"\\s*\\(\\s*vec"+arity+"\\b").test(code))return null;
  const glsl=code.replace(/^\s*#pragma\s+glslify:\s*export\((?:snoise|cnoise|pnoise)\)\s*$/gm,"");
  // The only preprocessor lines accepted are plain numeric constants such as
  // "#define F4 0.309..." (used by simplex 4D). Any other directive is rejected.
  const constant=/^\s*#define\s+[A-Za-z_]\w*\s+[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?\s*$/;
  if(glsl.split("\n").some(line=>/^\s*#/.test(line)&&!constant.test(line))||/<\s*\/\s*script/i.test(glsl))return null;
  const v=normalizeGlslNoiseValues(values);
  const c1=rgb01ToLab(hexToRgb01(v.c1)),c2=rgb01ToLab(hexToRgb01(v.c2));
  const f=n=>Number(n).toFixed(6);
  const vec=c=>"vec3("+c.map(f).join(",")+")";
  // Same fragment program as the NagWeb editor's SCShader definition: identical main(),
  // helper functions and Lab colour mixing. Only the uniforms are inlined as constants.
  const shader=[
    "precision highp float;uniform vec2 uRes;uniform float uTime;",
    "const vec3 u_c1L="+vec(c1)+";const vec3 u_c2L="+vec(c2)+";",
    "const float u_scale="+f(v.scale)+";const float u_contrast="+f(v.contrast)+";",
    "const float u_seed="+f(v.seed)+";const float u_grain="+f(GLSL_NOISE_GRAIN_DEFAULT)+";",
    "vec2 P(){return (gl_FragCoord.xy-.5*uRes)/min(uRes.x,uRes.y);}",
    SCSHADER_GLSL_SHIM.hash12,SCSHADER_GLSL_SHIM.toSrgb,SCSHADER_GLSL_SHIM.fromLab,SCSHADER_GLSL_SHIM.fin,
    adaptNoiseCode(glsl,name),
    noiseMainGlsl(setup.family,setup.dimension)
  ].join("\n");
  const speed=Number(v.speed).toFixed(4);
  const encoded=JSON.stringify(shader).replace(/</g,"\\u003c");
  // Dynamic shader source is an escaped JS string, not executable JS.
  const script=[
    "(()=>{",
    "const canvas=document.querySelector('canvas'),notice=document.querySelector('[data-shader-message]');",
    "const fail=message=>{document.body.dataset.glslStatus='unavailable';notice.textContent=message;notice.hidden=false;};",
    "try{",
    "const gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});",
    "if(!gl){fail('WebGL no disponible en este navegador.');return;}",
    "const compile=(type,code)=>{const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);",
    "if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('GLSL original no compiló: '+gl.getShaderInfoLog(s).slice(0,300));return s;};",
    "const vs=compile(gl.VERTEX_SHADER,'attribute vec2 aPosition;void main(){gl_Position=vec4(aPosition,0.,1.);}');",
    "const fs=compile(gl.FRAGMENT_SHADER,"+encoded+");",
    "const p=gl.createProgram();gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);",
    "if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error('No se pudo enlazar el shader.');",
    "gl.useProgram(p);const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);",
    "gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);",
    "const at=gl.getAttribLocation(p,'aPosition');gl.enableVertexAttribArray(at);",
    "gl.vertexAttribPointer(at,2,gl.FLOAT,false,0,0);",
    "const resolution=gl.getUniformLocation(p,'uRes'),clock=gl.getUniformLocation(p,'uTime');",
    "const still="+(thumbnail?"true":"false")+"||matchMedia('(prefers-reduced-motion: reduce)').matches;",
    "function draw(t){const w=Math.min(512,Math.max(120,canvas.clientWidth||320));",
    "const h=Math.min(320,Math.max(90,canvas.clientHeight||200));",
    "if(w!==canvas.width||h!==canvas.height){canvas.width=w;canvas.height=h;}",
    "gl.viewport(0,0,w,h);gl.uniform2f(resolution,w,h);gl.uniform1f(clock,still?0:t/1000*"+speed+");",
    "gl.drawArrays(gl.TRIANGLE_STRIP,0,4);document.body.dataset.glslStatus='rendered';",
    "if(still){const img=document.createElement('img');img.alt='Valores reales de GLSL';",
    "img.src=canvas.toDataURL('image/png');canvas.replaceWith(img);",
    "gl.getExtension('WEBGL_lose_context')?.loseContext();return;}",
    "if(!document.hidden)requestAnimationFrame(draw);}",
    "requestAnimationFrame(draw);",
    "}catch(e){fail(e.message||'No se pudo ejecutar el shader.');}})();"
  ].join("\n");
  const csp="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; "+
    "img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'";
  const style="html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#0f1933}"+
    "canvas,img{width:100%;height:100%;display:block;object-fit:cover}"+
    "[hidden]{display:none!important}[data-shader-message]{position:absolute;inset:0;"+
    "display:grid;place-items:center;padding:22px;text-align:center;"+
    "font:14px system-ui;color:#dce8f9;background:#152238}";
  return '<!doctype html><html lang="es"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<meta http-equiv="Content-Security-Policy" content="'+csp+'">'+
    '<style>'+style+'</style></head><body><canvas role="img" aria-label="Resultado WebGL '+setup.family+
    ' '+setup.dimension+'"></canvas><div data-shader-message hidden></div>'+
    '<script>'+script+'</'+'script></body></html>';
}
