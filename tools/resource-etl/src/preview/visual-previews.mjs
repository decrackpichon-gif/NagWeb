// Browser-only, offline-safe representations. A schema is never called a real preview.
// Real motion presets are rendered from their verified JSON tracks without scripts.
const TYPES = new Set(["animation","motion","react","three","shader","lottie","ui","code","icon","other"]);
const AXES = {
  x:"translateX",y:"translateY",z:"translateZ",
  rotateX:"rotateX",rotateY:"rotateY",rotateZ:"rotateZ",
  scale:"scale",scaleX:"scaleX",scaleY:"scaleY",scaleZ:"scaleZ",
  skewX:"skewX",skewY:"skewY"
};
const EASE = new Set(["linear","ease","ease-in","ease-out","ease-in-out"]);
const html = value => String(value ?? "").replaceAll("&","&amp;")
  .replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const number = (value, fallback, min, max) =>
  typeof value === "number" && Number.isFinite(value) && value>=min && value<=max ? value : fallback;

export function visualFamily(item) {
  const kind = String(item?.kind || "").toLowerCase();
  const family = String(item?.family || "").toLowerCase();
  const provider = String(item?.provider || item?.source?.provider || "").toLowerCase();
  if (provider === "animxyz" || /animation|motion/.test(kind+" "+family)) return "animation";
  if (/shader|glsl/.test(kind+" "+family)) return "shader";
  if (/3d|three|model|scene/.test(kind+" "+family) || provider === "threejs") return "three";
  if (/lottie/.test(kind+" "+family)) return "lottie";
  if (/react/.test(kind+" "+family)) return "react";
  if (/icon|svg/.test(kind+" "+family)) return "icon";
  if (/ui|component|html|css/.test(kind+" "+family)) return "ui";
  return "code";
}

export function realCardPreviewEligible(item) {
  const provider = item?.provider || item?.source?.provider;
  const use = item?.editorUse;
  return (provider === "uiverse" && use === "uiverse-html") ||
    (provider === "spinkit" && use === "spinkit-html") ||
    (provider === "magic-css" && use === "magic-css") ||
    (provider === "csshake" && use === "csshake") ||
    (provider === "animxyz" && String(item?.id || "").startsWith("animxyz:preset:"));
}

export function schematicMarkup(item) {
  const type=visualFamily(item);
  const visual=TYPES.has(type)?type:"other";
  // Decorative geometries indicate a family, not the appearance of a specific component.
  const shapes={
    animation:'<i class="s-orbit"></i><i class="s-square"></i><i class="s-trail"></i>',
    shader:'<i class="s-wave"></i><i class="s-wave second"></i>',
    three:'<i class="s-cube"></i><i class="s-cube small"></i>',
    react:'<i class="s-layout"></i><i class="s-layout-side"></i><i class="s-layout-dot"></i>',
    lottie:'<i class="s-orbit"></i><i class="s-dots"></i>',
    icon:'<i class="s-cube"></i>',
    ui:'<i class="s-layout"></i><i class="s-layout-dot"></i>',
    code:'<i class="s-code-line"></i><i class="s-code-line short"></i>',
    other:'<i class="s-square"></i>'
  };
  return '<span class="visual-schematic visual-'+visual+'" data-visual-schematic aria-hidden="true">'+
    shapes[visual]+'</span>';
}

export function illustrativePreviewDoc(resource) {
  const type=visualFamily(resource);
  const label={
    animation:"Motor o recurso de animación",shader:"Shader / código gráfico",
    three:"Escena u objeto 3D",react:"Componente React",lottie:"Animación Lottie",
    icon:"Recurso vectorial",ui:"Componente de interfaz",code:"Recurso de código"
  }[type] || "Recurso";
  return '<!doctype html><html lang="es"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<meta http-equiv="Content-Security-Policy" content="default-src '+"'none'"+'; style-src '+"'unsafe-inline'"+'; connect-src '+"'none'"+'">'+
    '<style>html,body{height:100%;margin:0}body{font:14px system-ui;color:#334155;background:#f3f6fa;display:grid;place-items:center;text-align:center}'+
    '.drawing{display:grid;gap:14px;justify-items:center;padding:30px;width:min(90%,380px)}'+
    '.symbol{width:125px;height:90px;border-radius:18px;border:3px solid #8392ac;background:linear-gradient(145deg,#e1e8f3,#fff);display:grid;place-items:center;box-shadow:16px 13px 0 #b8c7de}'+
    '.symbol span{width:50px;height:50px;border:8px solid #6484ab;border-radius:12px;transform:rotate(-20deg)}'+
    'small{color:#64748b;line-height:1.4}</style></head><body><main class="drawing">'+
    '<div class="symbol" aria-hidden="true"><span></span></div><strong>'+html(label)+'</strong>'+
    '<small>Esquema de categoría, no vista real del recurso.<br>Este tipo necesita un visor o compilador especial.</small>'+
    '</main></body></html>';
}

function transformPart(property, value) {
  if (!Object.hasOwn(AXES,property)) return null;
  const scale=property.startsWith("scale");
  const degrees=/rotate|skew/.test(property);
  let part;
  if (typeof value === "number" && Number.isFinite(value) && Math.abs(value)<=1000) {
    part = String(value) + (degrees ? "deg" : scale ? "" : "px");
  } else if (typeof value==="string" && /^-?\d+(?:\.\d+)?(?:px|%)$/.test(value) &&
      !degrees && !scale && value.length<18) {
    part=value;
  } else return null;
  return AXES[property]+"("+part+")";
}

export function buildMotionNativePreview(resource, values = {}) {
  if (resource?.source?.provider!=="animxyz" ||
      resource.runtime?.renderer!=="nagweb-motion-native" ||
      resource.license?.verified!==true) return null;
  const artifact=resource.artifacts?.find(a=>a.role==="animation-data"&&a.format==="json");
  if(typeof artifact?.content!=="string" || artifact.content.length>20000) return null;
  let preset;
  try{preset=JSON.parse(artifact.content)}catch{return null}
  if(preset.schema!=="nagweb-motion-preset/0.1" ||
      !Array.isArray(preset.tracks) || !preset.tracks.length || preset.tracks.length>8) return null;
  const from=[],to=[],opacity=[];
  for(const track of preset.tracks){
    if(track.property==="opacity"){
      if(typeof track.from!=="number" || typeof track.to!=="number" ||
        [track.from,track.to].some(v=>v<0||v>1))return null;
      opacity.push([track.from,track.to]);continue;
    }
    const start=transformPart(track.property,track.from);
    const end=transformPart(track.property,track.to);
    if(!start||!end)return null;
    from.push(start);to.push(end);
  }
  if(!from.length&&!opacity.length)return null;
  const duration=number(values.duration,number(preset.duration,0.5,.05,5),.05,5);
  const delay=number(values.delay,number(preset.delay,0,0,5),0,5);
  const ease=EASE.has(values.ease)?values.ease:EASE.has(preset.ease)?preset.ease:"ease";
  const a=opacity.at(-1);
  const first=(from.length?"transform:"+from.join(" ")+";":"")+(a?"opacity:"+a[0]+";":"");
  const last=(to.length?"transform:"+to.join(" ")+";":"")+(a?"opacity:"+a[1]+";":"");
  return '<!doctype html><html lang="es"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<meta http-equiv="Content-Security-Policy" content="default-src '+"'none'"+'; style-src '+"'unsafe-inline'"+'; connect-src '+"'none'"+'">'+
    '<style>html,body{margin:0;height:100%;overflow:hidden}body{display:grid;place-items:center;perspective:900px;background:#f3f6fa;font-family:system-ui}'+
    '.demo{width:min(55vw,178px);height:85px;display:grid;place-items:center;border-radius:20px;'+
    'background:linear-gradient(135deg,#456ac3,#68bd9c);box-shadow:0 16px 28px #243a6133;'+
    'font-weight:700;color:white;animation:motion '+duration+'s '+ease+' '+delay+'s infinite alternate both}'+
    '@keyframes motion{from{'+first+'}to{'+last+'}}'+
    '@media(prefers-reduced-motion:reduce){.demo{animation:none}}</style></head>'+
    '<body><div class="demo">Movimiento</div></body></html>';
}
