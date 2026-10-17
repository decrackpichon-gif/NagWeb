// Verified CSS-only Magic.css effects for existing NagWeb text/button elements.
// Keep animation on an INNER span so it never overwrites canvas positioning.
const CLASS=/^[a-z][a-zA-Z0-9_-]{0,79}$/i;
const EASINGS=new Set(["linear","ease","ease-in","ease-out","ease-in-out"]);
const SHAKE=/^shake(?:-(?:little|slow|hard|horizontal|vertical|rotate|opacity|crazy|chunk))?$/;
export const MAGIC_TARGET_TYPES=Object.freeze(["heading","label","paragraph","button","image","vector","svgdraw","video"]);
export function safeMagicCss(css,className){
  return typeof css==="string" && css.length>20 && css.length<=300000 &&
    typeof className==="string" && CLASS.test(className) &&
    css.includes("."+className) && /@(?:-webkit-)?keyframes\s/i.test(css) &&
    !/(?:@import\b|url\s*\(|expression\s*\(|-moz-binding|behavior\s*:|<|\\0)/i.test(css);
}
export function validatedMagicCssEffect(envelope){
  const {resource,descriptor}=envelope||{};
  if(descriptor?.kind!=="css-inline-effect" || !resource?.id?.startsWith("magic-css:") ||
    resource?.provider!=="magic-css" || resource?.license?.verified!==true ||
    descriptor.resourceId!==resource.id || descriptor.instance?.resourceId!==resource.id ||
    descriptor.instance?.renderer!=="nagweb-css-inline-effect" ||
    descriptor.payload?.effect?.schema!=="nagweb-css-effect/0.2" ||
    descriptor.payload.effect.baseClass!=="magictime" ||
    !safeMagicCss(descriptor.payload.css,descriptor.payload.effect.className))
    throw Error("Este efecto Magic.css no tiene identidad, licencia o CSS autónomo válido.");
  const p=descriptor.payload;
  const inRange=(v,min,max)=>typeof v==="number" && Number.isFinite(v) && v>=min && v<=max;
  if(!inRange(p.duration,0.1,8)||!inRange(p.delay,0,5)||
     !inRange(p.iterations,1,10)||!Number.isInteger(p.iterations)||!EASINGS.has(p.easing))
    throw Error("Los tiempos de animación están fuera de rango.");
  return {
    id:resource.id, provider:"magic-css",
    className:p.effect.className, css:p.css,
    values:{duration:p.duration,delay:p.delay,easing:p.easing,iterations:p.iterations},
    license:structuredClone(resource.license)
  };
}

// Convert source-verified AnimXYZ tracks into CSS for the existing NagWeb FX
// wrapper. No separate object: the original text/button/image remains editable.
const MOTION_UNITS={x:["translateX","px"],y:["translateY","px"],z:["translateZ","px"],
  rotateX:["rotateX","deg"],rotateY:["rotateY","deg"],rotateZ:["rotateZ","deg"],
  scale:["scale",""],scaleX:["scaleX",""],scaleY:["scaleY",""],scaleZ:["scaleZ",""],
  skewX:["skewX","deg"],skewY:["skewY","deg"]};
export function compileVerifiedAnimXyzPreset(spec,id){
  const name=/^animxyz:preset:[a-z][a-z0-9-]{0,60}$/.test(id||"")
    ? id.slice("animxyz:preset:".length):null;
  if(!name || spec?.schema!=="nagweb-motion-preset/0.1" ||
    spec.sourceSemantic!=="animxyz:"+name ||
    !Array.isArray(spec.tracks)||spec.tracks.length<1||spec.tracks.length>12)return null;
  const className="nwAnimxyz"+name.replaceAll("-","_");
  const styles=[[],[]],transforms=[[],[]];let opacity=false;
  for(const track of spec.tracks){
    if(!track || typeof track.property!=="string")return null;
    if(track.property==="opacity"){
      if(opacity||[track.from,track.to].some(v=>typeof v!=="number"||!Number.isFinite(v)||v<0||v>1))return null;
      opacity=true;
      styles[0].push("opacity:"+track.from+";");
      styles[1].push("opacity:"+track.to+";");
      continue;
    }
    const fn=MOTION_UNITS[track.property];
    if(!fn)return null;
    for(const [i,value] of [track.from,track.to].entries()){
      if(typeof value!=="number"||!Number.isFinite(value)||Math.abs(value)>1000 ||
        (track.property.startsWith("scale")&&(value<0||value>100)))return null;
      transforms[i].push(fn[0]+"("+value+fn[1]+")");
    }
  }
  for(let i=0;i<2;i++)if(transforms[i].length)
    styles[i].push("transform:"+transforms[i].join(" ")+";");
  const frames=className+"Frames";
  return {className,css:"."+className+"{animation-name:"+frames+";animation-fill-mode:both;}"+
    "@keyframes "+frames+"{from{"+styles[0].join("")+"}to{"+styles[1].join("")+"}}"};
}
export function validatedAnimXyzEffect(envelope){
  const {resource,descriptor}=envelope||{},p=descriptor?.payload,v=descriptor?.instance?.values;
  if(descriptor?.kind!=="motion-preset"||resource?.provider!=="animxyz"||
    resource.license?.verified!==true||descriptor.resourceId!==resource.id||
    descriptor.instance?.resourceId!==resource.id||
    descriptor.instance?.renderer!=="nagweb-motion-native")
    throw Error("Preset AnimXYZ sin origen, licencia o formato verificado.");
  const compiled=compileVerifiedAnimXyzPreset(p?.preset,resource.id);
  if(!compiled||!v||typeof v.duration!=="number"||!Number.isFinite(v.duration)||
    v.duration<0.05||v.duration>5||typeof v.delay!=="number"||!Number.isFinite(v.delay)||
    v.delay<0||v.delay>5||!EASINGS.has(v.ease))
    throw Error("Preset AnimXYZ o parámetros de animación no válidos.");
  return {id:"magic-css:nagweb-animxyz-"+resource.id.slice("animxyz:preset:".length),
    sourceResourceId:resource.id,provider:"magic-css",className:compiled.className,
    css:compiled.css,values:{duration:v.duration,delay:v.delay,easing:v.ease,
      ease:v.ease,iterations:1},license:structuredClone(resource.license)};
}
export function validSavedAnimXyzEffect(fx){
  if(!fx?.sourceResourceId?.startsWith("animxyz:preset:")||
    fx.id!=="magic-css:nagweb-animxyz-"+fx.sourceResourceId.slice("animxyz:preset:".length)||
    fx.provider!=="magic-css"||
    fx.license?.verified!==true||!/^nwAnimxyz[a-z0-9_-]{1,65}$/.test(fx.className)||
    typeof fx.css!=="string"||fx.css.length>10000||
    !safeMagicCss(fx.css,fx.className))return false;
  const name=fx.sourceResourceId.slice("animxyz:preset:".length),v=fx.values;
  return fx.className==="nwAnimxyz"+name.replaceAll("-","_")&&
    fx.css.includes("@keyframes "+fx.className+"Frames")&&
    typeof v?.duration==="number"&&v.duration>=0.05&&v.duration<=5&&
    typeof v.delay==="number"&&v.delay>=0&&v.delay<=5&&
    v.iterations===1&&EASINGS.has(v.easing)&&v.ease===v.easing;
}

export function safeCssShake(css,className){
  return typeof css==="string" && css.length>100 && css.length<=120000 &&
    SHAKE.test(className||"") && css.includes("."+className) &&
    /@(?:-webkit-)?keyframes\s/.test(css) &&
    !/(?:@import\b|url\s*\(|expression\s*\(|-moz-binding|behavior\s*:|<|\\0)/i.test(css);
}
export function validatedCssEffect(envelope){
  const {resource,descriptor}=envelope||{};
  if(descriptor?.kind==="motion-preset")return validatedAnimXyzEffect(envelope);
  if(descriptor?.kind==="css-inline-effect")return validatedMagicCssEffect(envelope);
  const p=descriptor?.payload,fx=p?.effect;
  if(descriptor?.kind!=="css-effect" ||
     resource?.provider!=="csshake" ||
     !/^csshake:shake(?:-(?:little|slow|hard|horizontal|vertical|rotate|opacity|crazy|chunk))?$/.test(resource?.id||"") ||
     resource.license?.verified!==true || descriptor.resourceId!==resource.id ||
     descriptor.instance?.resourceId!==resource.id ||
     descriptor.instance?.renderer!=="nagweb-css-class-effect" ||
     fx?.schema!=="nagweb-css-effect/0.1" ||
     fx.className!==resource.id.slice("csshake:".length) ||
     !Array.isArray(p.dependencies)||p.dependencies.length!==1||p.dependencies[0]!=="csshake:runtime" ||
     !["hover","constant"].includes(p.trigger) || !safeCssShake(p.css,fx.className))
    throw Error("Este efecto CSSShake no tiene identidad, licencia o CSS autónomo válido.");
  return {id:resource.id,provider:"csshake",className:fx.className,
    css:p.css,values:{trigger:p.trigger},license:structuredClone(resource.license)};
}
export function isMagicTarget(element){
  return MAGIC_TARGET_TYPES.includes(element?.type);
}
export function validSavedMagicEffect(fx){
  const v=fx?.values;
  if(fx?.sourceResourceId?.startsWith("animxyz:preset:"))return validSavedAnimXyzEffect(fx);
  if(fx?.provider==="csshake")return fx.id==="csshake:"+fx.className &&
    fx.license?.verified===true && safeCssShake(fx.css,fx.className) &&
    ["hover","constant"].includes(v?.trigger);
  return fx?.provider==="magic-css" && typeof fx.id==="string" &&
    fx.id.startsWith("magic-css:") && fx.license?.verified===true &&
    safeMagicCss(fx.css,fx.className) && v &&
    typeof v.duration==="number"&&v.duration>=0.1&&v.duration<=8&&
    typeof v.delay==="number"&&v.delay>=0&&v.delay<=5&&
    Number.isInteger(v.iterations)&&v.iterations>=1&&v.iterations<=10&&
    EASINGS.has(v.easing);
}
