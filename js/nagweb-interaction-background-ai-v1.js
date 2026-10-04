/* NagWeb Interaction Background Removal v1
   Optional, lazy browser-side AI adapter for @huggingface/transformers.
   Core interaction features do not depend on this file.
*/
(function(root,factory){
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.NAGWEB_INTERACTION_BACKGROUND_AI=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  var VERSION='1.0.0-alpha.1';
  var DEFAULT_MODULE_URL='https://esm.sh/@huggingface/transformers@3.8.1';
  var PROVIDERS={
    general:{
      id:'general',
      label:'General',
      task:'background-removal',
      model:'onnx-community/ormbg-ONNX',
      dtype:'q8',
      approxDownloadMB:45,
      license:'Apache-2.0',
      note:'General foreground/background removal.'
    },
    portrait:{
      id:'portrait',
      label:'Retrato',
      task:'background-removal',
      model:'Xenova/modnet',
      dtype:'fp32',
      approxDownloadMB:46,
      license:'Apache-2.0',
      note:'Optimized for portrait matting.'
    }
  };

  function clone(v){return JSON.parse(JSON.stringify(v));}
  function normalizeOptions(input){
    input=input||{};
    var provider=PROVIDERS[input.provider]?input.provider:'general';
    var device=input.device||'auto';
    if(['auto','webgpu','wasm'].indexOf(device)<0)device='auto';
    return {
      provider:provider,
      device:device,
      moduleUrl:input.moduleUrl||DEFAULT_MODULE_URL,
      allowNetwork:input.allowNetwork!==false,
      progress:typeof input.progress==='function'?input.progress:null,
      moduleLoader:typeof input.moduleLoader==='function'?input.moduleLoader:null,
      environment:input.environment||null
    };
  }
  function chooseDevice(options,env){
    if(options.device!=='auto')return options.device;
    env=env||((typeof navigator!=='undefined')?navigator:{});
    return env&&env.gpu?'webgpu':'wasm';
  }
  function providerInfo(id){return clone(PROVIDERS[id]||PROVIDERS.general);}

  function rawToCanvas(raw){
    if(raw&&typeof raw.toCanvas==='function')return raw.toCanvas();
    if(typeof document==='undefined')throw new Error('NagWeb Background AI: canvas conversion requires a browser');
    if(!raw||!raw.data||!raw.width||!raw.height)throw new Error('NagWeb Background AI: invalid model output');
    var canvas=document.createElement('canvas');canvas.width=raw.width;canvas.height=raw.height;
    var ctx=canvas.getContext('2d');
    var data=raw.data instanceof Uint8ClampedArray?raw.data:new Uint8ClampedArray(raw.data);
    if(raw.channels===4){
      ctx.putImageData(new ImageData(data,raw.width,raw.height),0,0);
    }else{
      var rgba=new Uint8ClampedArray(raw.width*raw.height*4);
      for(var i=0,j=0;i<raw.width*raw.height;i++,j+=4){
        var k=i*(raw.channels||3);
        rgba[j]=data[k]||0;rgba[j+1]=data[k+1]??data[k]??0;rgba[j+2]=data[k+2]??data[k]??0;rgba[j+3]=255;
      }
      ctx.putImageData(new ImageData(rgba,raw.width,raw.height),0,0);
    }
    return canvas;
  }

  function createRemover(input){
    var o=normalizeOptions(input),state='idle',mod=null,pipe=null,lastError=null,activeDevice=null;
    var info=PROVIDERS[o.provider];

    function emit(detail){
      if(o.progress)try{o.progress(Object.assign({state:state,provider:info.id,device:activeDevice},detail||{}));}catch(e){}
    }
    async function getModule(){
      if(mod)return mod;
      if(o.moduleLoader){mod=await o.moduleLoader();return mod;}
      if(!o.allowNetwork)throw new Error('NagWeb Background AI: network loading is disabled');
      mod=await import(o.moduleUrl);
      return mod;
    }
    async function makePipeline(device){
      var m=await getModule();
      if(!m||typeof m.pipeline!=='function')throw new Error('NagWeb Background AI: Transformers.js pipeline() unavailable');
      var options={device:device,dtype:info.dtype};
      if(o.progress)options.progress_callback=function(x){emit({phase:'download',detail:x});};
      return m.pipeline(info.task,info.model,options);
    }
    async function load(){
      if(pipe)return pipe;
      state='loading';lastError=null;activeDevice=chooseDevice(o,o.environment||undefined);emit({phase:'load'});
      try{
        pipe=await makePipeline(activeDevice);
      }catch(err){
        if(o.device==='auto'&&activeDevice==='webgpu'){
          activeDevice='wasm';emit({phase:'fallback',message:'WebGPU failed; retrying with WASM'});
          try{pipe=await makePipeline(activeDevice);}
          catch(err2){state='error';lastError=err2;emit({phase:'error',error:String(err2)});throw err2;}
        }else{state='error';lastError=err;emit({phase:'error',error:String(err)});throw err;}
      }
      state='ready';emit({phase:'ready'});return pipe;
    }
    async function normalizeInput(value,m){
      if(m.RawImage&&typeof m.RawImage.read==='function')return m.RawImage.read(value);
      return value;
    }
    async function remove(value){
      var p=await load(),m=await getModule();
      state='processing';emit({phase:'inference'});
      try{
        var inputImage=await normalizeInput(value,m);
        var out=await p(inputImage);
        var raw=Array.isArray(out)?out[0]:out;
        if(!raw)throw new Error('NagWeb Background AI: model returned no image');
        state='ready';emit({phase:'complete',width:raw.width,height:raw.height});
        var result={raw:raw,width:raw.width,height:raw.height,provider:info.id,device:activeDevice};
        if(typeof document!=='undefined'){
          result.canvas=rawToCanvas(raw);
          if(result.canvas&&typeof result.canvas.toBlob==='function'){
            result.toBlob=function(type,quality){return new Promise(function(resolve){result.canvas.toBlob(resolve,type||'image/webp',quality==null ? .92 : quality);});};
          }
        }
        return result;
      }catch(err){state='error';lastError=err;emit({phase:'error',error:String(err)});throw err;}
    }
    async function dispose(){
      if(pipe&&typeof pipe.dispose==='function')await pipe.dispose();
      pipe=null;state='idle';activeDevice=null;
    }
    return {
      version:VERSION,
      provider:providerInfo(info.id),
      get status(){return {state:state,device:activeDevice,error:lastError?String(lastError):null,loaded:!!pipe};},
      load:load,
      remove:remove,
      dispose:dispose
    };
  }

  return {
    version:VERSION,
    defaultModuleUrl:DEFAULT_MODULE_URL,
    providers:clone(PROVIDERS),
    providerInfo:providerInfo,
    normalizeOptions:normalizeOptions,
    chooseDevice:chooseDevice,
    rawToCanvas:rawToCanvas,
    createRemover:createRemover
  };
});
