/* NagWeb Scene Composer Model v1
   Serializable scene contract for experimental interactive compositions.
   UI/DOM agnostic by design.
*/
(function(root,factory){
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.NAGWEB_SCENE_COMPOSER=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  var VERSION='1.0.0-alpha.1';
  var SCHEMA='nagweb-scene-composer';
  var TYPES=['text','button','image','shape','background'];

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function num(v,d){v=Number(v);return Number.isFinite(v)?v:d;}
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function str(v,d){return typeof v==='string'?v:d;}
  function bool(v,d){return v==null?d:!!v;}

  function normalizeInteraction(input){
    input=input||{};
    var response=input.response||{};
    return {
      enabled:bool(input.enabled,true),
      mode:input.mode==='push'?'push':'push',
      weight:clamp(num(input.weight,1),0,2),
      radiusScale:clamp(num(input.radiusScale,1),.25,3),
      move:clamp(num(input.move,response.move==null?1:response.move),0,2),
      rotate:clamp(num(input.rotate,response.rotate==null?.35:response.rotate),0,2),
      scale:clamp(num(input.scale,response.scale==null?.15:response.scale),0,2),
      returnSpeed:clamp(num(input.returnSpeed,1),.25,2)
    };
  }

  function typeDefaults(type){
    switch(type){
      case 'button':return {
        width:180,height:52,content:'Explorar',style:{color:'#ffffff',background:'#5e55ff',fontSize:16,fontWeight:700,borderRadius:999,padding:12,objectFit:'cover'},
        interaction:{enabled:true,weight:.8,radiusScale:1,move:1,rotate:.18,scale:.18,returnSpeed:1.05}
      };
      case 'image':return {
        width:240,height:180,content:'',src:'',style:{color:'#ffffff',background:'rgba(255,255,255,.06)',fontSize:16,fontWeight:600,borderRadius:18,padding:0,objectFit:'cover'},
        interaction:{enabled:true,weight:.8,radiusScale:1.05,move:1,rotate:.25,scale:.12,returnSpeed:.9}
      };
      case 'shape':return {
        width:180,height:180,content:'',style:{color:'#ffffff',background:'#ff764d',fontSize:16,fontWeight:600,borderRadius:32,padding:0,objectFit:'cover'},
        interaction:{enabled:true,weight:.75,radiusScale:1.1,move:1,rotate:.35,scale:.2,returnSpeed:.9}
      };
      case 'background':return {
        width:1200,height:800,content:'',src:'',style:{color:'#ffffff',background:'#17151f',fontSize:16,fontWeight:400,borderRadius:0,padding:0,objectFit:'cover'},
        interaction:{enabled:false,weight:0,radiusScale:1,move:0,rotate:0,scale:0,returnSpeed:1}
      };
      default:return {
        width:320,height:96,content:'Texto editable',style:{color:'#ffffff',background:'transparent',fontSize:42,fontWeight:750,borderRadius:0,padding:4,objectFit:'cover'},
        interaction:{enabled:true,weight:1,radiusScale:1,move:1,rotate:.35,scale:.12,returnSpeed:1}
      };
    }
  }

  function normalizeStyle(input,defaults){
    input=input||{};defaults=defaults||{};
    return {
      color:str(input.color,str(defaults.color,'#ffffff')),
      background:str(input.background,str(defaults.background,'transparent')),
      fontSize:clamp(num(input.fontSize,num(defaults.fontSize,16)),8,240),
      fontWeight:clamp(num(input.fontWeight,num(defaults.fontWeight,600)),100,950),
      borderRadius:clamp(num(input.borderRadius,num(defaults.borderRadius,0)),0,999),
      padding:clamp(num(input.padding,num(defaults.padding,0)),0,120),
      objectFit:['contain','cover','fill'].includes(input.objectFit)?input.objectFit:(defaults.objectFit||'cover')
    };
  }

  function normalizeElement(input){
    input=input||{};var type=TYPES.includes(input.type)?input.type:'text',d=typeDefaults(type);
    return {
      id:str(input.id,''),
      type:type,
      name:str(input.name,type==='text'?'Texto':type==='button'?'Botón':type==='image'?'Imagen':type==='shape'?'Forma':'Fondo'),
      x:num(input.x,type==='background'?0:120),
      y:num(input.y,type==='background'?0:120),
      width:clamp(num(input.width,d.width),16,4000),
      height:clamp(num(input.height,d.height),16,4000),
      rotation:num(input.rotation,0),
      scale:clamp(num(input.scale,1),.1,6),
      zIndex:Math.round(clamp(num(input.zIndex,type==='background'?0:10),-100,1000)),
      opacity:clamp(num(input.opacity,1),0,1),
      locked:bool(input.locked,type==='background'),
      content:str(input.content,d.content||''),
      src:str(input.src,d.src||''),
      style:normalizeStyle(input.style,d.style),
      interaction:normalizeInteraction(Object.assign({},d.interaction,input.interaction||{}))
    };
  }

  function normalizeCharacter(input){
    input=input||{};
    return {
      enabled:bool(input.enabled,true),
      size:clamp(num(input.size,360),80,1000),
      preset:['character','creature','soft'].includes(input.preset)?input.preset:'character',
      source:str(input.source,''),
      influenceRadius:clamp(num(input.influenceRadius,170),40,600),
      influenceStrength:clamp(num(input.influenceStrength,1),0,3)
    };
  }

  function normalizeScene(input){
    input=input||{};
    var stage=input.stage||{},elements=Array.isArray(input.elements)?input.elements.map(normalizeElement):[];
    var ids=new Set();
    elements.forEach(function(el,i){
      var base=el.id||('scene-element-'+(i+1)),id=base,n=2;
      while(ids.has(id)){id=base+'-'+n;n++;}
      el.id=id;ids.add(id);
    });
    return {
      schema:SCHEMA,
      version:1,
      stage:{
        width:clamp(num(stage.width,1200),320,5000),
        height:clamp(num(stage.height,800),240,5000),
        background:str(stage.background,'#121119')
      },
      character:normalizeCharacter(input.character),
      elements:elements
    };
  }

  function createScene(input){return normalizeScene(input||{});}
  function nextId(scene,type){
    var prefix='scene-'+(type||'element')+'-',n=1,ids=new Set(scene.elements.map(function(e){return e.id;}));
    while(ids.has(prefix+n))n++;
    return prefix+n;
  }
  function addElement(scene,type,overrides){
    var s=normalizeScene(scene),el=normalizeElement(Object.assign({},overrides||{},{type:type,id:(overrides&&overrides.id)||nextId(s,type)}));
    if(type==='background'){el.x=0;el.y=0;el.width=s.stage.width;el.height=s.stage.height;el.zIndex=Math.min(el.zIndex,0);el.locked=true;el.interaction.enabled=false;}
    s.elements.push(el);return s;
  }
  function updateElement(scene,id,patch){
    var s=normalizeScene(scene),idx=s.elements.findIndex(function(e){return e.id===id;});if(idx<0)return s;
    var current=s.elements[idx],next=clone(current),p=patch||{};
    Object.keys(p).forEach(function(k){
      if(k==='style')next.style=Object.assign({},next.style,p.style||{});
      else if(k==='interaction')next.interaction=Object.assign({},next.interaction,p.interaction||{});
      else next[k]=p[k];
    });
    next.id=current.id;s.elements[idx]=normalizeElement(next);return s;
  }
  function removeElement(scene,id){
    var s=normalizeScene(scene);s.elements=s.elements.filter(function(e){return e.id!==id;});return s;
  }
  function duplicateElement(scene,id){
    var s=normalizeScene(scene),src=s.elements.find(function(e){return e.id===id;});if(!src)return s;
    var copy=clone(src);copy.id=nextId(s,src.type);copy.name=src.name+' copia';copy.x+=24;copy.y+=24;copy.zIndex+=1;s.elements.push(normalizeElement(copy));return s;
  }
  function setCharacter(scene,patch){
    var s=normalizeScene(scene);s.character=normalizeCharacter(Object.assign({},s.character,patch||{}));return s;
  }
  function setStage(scene,patch){
    var s=normalizeScene(scene),next=Object.assign({},s.stage,patch||{});s.stage=normalizeScene({stage:next}).stage;
    s.elements=s.elements.map(function(el){if(el.type!=='background')return el;return normalizeElement(Object.assign({},el,{x:0,y:0,width:s.stage.width,height:s.stage.height}));});
    return s;
  }
  function interactionAttributes(element){
    var el=normalizeElement(element),i=el.interaction;
    return {
      'data-nw-target-id':el.id,
      'data-nw-influence-weight':String(i.weight),
      'data-nw-influence-radius':String(i.radiusScale),
      'data-nw-influence-move':String(i.move),
      'data-nw-influence-rotate':String(i.rotate),
      'data-nw-influence-scale':String(i.scale),
      'data-nw-influence-return':String(i.returnSpeed)
    };
  }
  function serialize(scene){return JSON.stringify(normalizeScene(scene),null,2);}
  function deserialize(value){
    var data=typeof value==='string'?JSON.parse(value):clone(value);
    if(!data||data.schema!==SCHEMA||data.version!==1)throw new Error('NagWeb Scene Composer: invalid scene document');
    return normalizeScene(data);
  }

  return {
    version:VERSION,schema:SCHEMA,types:TYPES.slice(),
    normalizeInteraction:normalizeInteraction,normalizeStyle:normalizeStyle,normalizeElement:normalizeElement,normalizeCharacter:normalizeCharacter,normalizeScene:normalizeScene,
    createScene:createScene,addElement:addElement,updateElement:updateElement,removeElement:removeElement,duplicateElement:duplicateElement,setCharacter:setCharacter,setStage:setStage,
    interactionAttributes:interactionAttributes,serialize:serialize,deserialize:deserialize
  };
});
