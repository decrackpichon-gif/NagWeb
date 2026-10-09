(function(){
'use strict';
// Three.js r128 bloom with transparent output. Rendering has no progress clock.
function createSpatialBloom(T,renderer,scene,camera,strength){
 if(!T.EffectComposer||!T.RenderPass||!T.UnrealBloomPass||!T.ShaderPass||!T.CopyShader||!T.LuminosityHighPassShader)return null;
 var composer=null,bloom=null,base=null,geometry=null,capture=null,output=null,quad=null,disposed=false,lastWidth=0,lastHeight=0,lastRatio=0;
 function dispose(){
  if(disposed)return;disposed=true;
  if(composer){composer.renderTarget1.dispose();composer.renderTarget2.dispose();composer.copyPass.material.dispose();}
  if(bloom){
   bloom.dispose();bloom.materialHighPassFilter.dispose();bloom.compositeMaterial.dispose();bloom.materialCopy.dispose();bloom.basic.dispose();
   bloom.separableBlurMaterials.forEach(function(m){m.dispose();});
  }
  if(base)base.dispose();if(geometry)geometry.dispose();if(capture)capture.dispose();if(output)output.dispose();
 }
 try{
  composer=new T.EffectComposer(renderer,new T.WebGLRenderTarget(32,32));composer.renderToScreen=false;
  base=new T.WebGLRenderTarget(32,32);
  geometry=new T.PlaneBufferGeometry(2,2);
  var vertex='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}';
  capture=new T.ShaderMaterial({uniforms:{tDiffuse:{value:null}},vertexShader:vertex,fragmentShader:'varying vec2 vUv;uniform sampler2D tDiffuse;void main(){gl_FragColor=texture2D(tDiffuse,vUv);}',depthTest:false,depthWrite:false,blending:T.NoBlending});
  output=new T.ShaderMaterial({uniforms:{baseTexture:{value:base.texture},bloomTexture:{value:null}},vertexShader:vertex,
   fragmentShader:'varying vec2 vUv;uniform sampler2D baseTexture;uniform sampler2D bloomTexture;void main(){vec4 b=texture2D(baseTexture,vUv);vec3 glow=texture2D(bloomTexture,vUv).rgb;float a=clamp(b.a+max(glow.r,max(glow.g,glow.b)),0.0,1.0);gl_FragColor=vec4((b.rgb+glow)/max(a,0.00001),a);\n#include <encodings_fragment>\n#include <premultiplied_alpha_fragment>\n}',
   transparent:true,premultipliedAlpha:true,depthTest:false,depthWrite:false});
  quad=new T.Mesh(geometry,capture);quad.frustumCulled=false;
  var quadCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);
  composer.addPass(new T.RenderPass(scene,camera));
  // Keep the original RGB/alpha before UnrealBloomPass adds opaque blur textures.
  composer.addPass({enabled:true,needsSwap:false,setSize:function(w,h){base.setSize(w,h);},render:function(r,write,read){capture.uniforms.tDiffuse.value=read.texture;quad.material=capture;r.setRenderTarget(base);r.clear();r.render(quad,quadCamera);}});
  bloom=new T.UnrealBloomPass(new T.Vector2(32,32),Number.isFinite(+strength)?Math.max(0,+strength):1,.4,.15);composer.addPass(bloom);
  output.uniforms.bloomTexture.value=bloom.renderTargetsHorizontal[0].texture;
  function render(width,height){
   if(disposed)return false;
   var state={target:renderer.getRenderTarget(),viewport:renderer.getViewport(new T.Vector4()),scissor:renderer.getScissor(new T.Vector4()),scissorTest:renderer.getScissorTest(),autoClear:renderer.autoClear,color:renderer.getClearColor(new T.Color()),alpha:renderer.getClearAlpha()};
   try{
    var w=Math.max(32,Math.ceil(width)),h=Math.max(32,Math.ceil(height)),ratio=renderer.getPixelRatio();
    if(w!==lastWidth||h!==lastHeight||ratio!==lastRatio){composer.setPixelRatio(ratio);composer.setSize(w,h);lastWidth=w;lastHeight=h;lastRatio=ratio;}
    renderer.autoClear=false;renderer.setScissorTest(false);
    // Explicit delta: postprocessing never advances an animation or scroll clock.
    composer.render(0);
    renderer.setRenderTarget(state.target);renderer.setViewport(state.viewport);renderer.setScissor(state.scissor);renderer.setScissorTest(state.scissorTest);
    quad.material=output;renderer.render(quad,quadCamera);
    return true;
   }finally{
    renderer.setRenderTarget(state.target);renderer.setViewport(state.viewport);renderer.setScissor(state.scissor);renderer.setScissorTest(state.scissorTest);
    renderer.setClearColor(state.color,state.alpha);renderer.autoClear=state.autoClear;
   }
  }
  return{render:render,dispose:dispose};
 }catch(_){dispose();return null;}
}
window.NAGWEB_CREATE_SPATIAL_BLOOM=createSpatialBloom;
})();
