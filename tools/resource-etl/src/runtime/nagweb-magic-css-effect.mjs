// Verified CSS-only Magic.css effects for existing NagWeb text/button elements.
// Keep animation on an INNER span so it never overwrites canvas positioning.
const CLASS=/^[a-z][a-zA-Z0-9_-]{0,79}$/i;
const EASINGS=new Set(["linear","ease","ease-in","ease-out","ease-in-out"]);
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
export function isMagicTarget(element){
  return MAGIC_TARGET_TYPES.includes(element?.type);
}
export function validSavedMagicEffect(fx){
  const v=fx?.values;
  return fx?.provider==="magic-css" && typeof fx.id==="string" &&
    fx.id.startsWith("magic-css:") && fx.license?.verified===true &&
    safeMagicCss(fx.css,fx.className) && v &&
    typeof v.duration==="number"&&v.duration>=0.1&&v.duration<=8&&
    typeof v.delay==="number"&&v.delay>=0&&v.delay<=5&&
    Number.isInteger(v.iterations)&&v.iterations>=1&&v.iterations<=10&&
    EASINGS.has(v.easing);
}
