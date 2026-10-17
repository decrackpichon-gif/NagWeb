// Render the ACTUAL verified HyperUI HTML and its mirrored Tailwind runtime
// CSS, rather than a generic category symbol. No third-party JS executes.
export function buildHyperUiBrowserPreview(resource, values={}, {stylesheet}={}){
  if(resource?.source?.provider!=="hyperui" ||
     resource?.runtime?.renderer!=="nagweb-html-tailwind" ||
     resource?.license?.verified!==true ||
     resource.id==="hyperui:runtime" ||
     typeof stylesheet!=="string" || stylesheet.length<1000 ||
     stylesheet.length>300000 ||
     typeof DOMParser!=="function")return null;
  const theme=values.theme==="dark" ? "dark":"light";
  const artifact=resource.artifacts?.find(a=>a.role==="component"&&a.format==="html"&&a.variant?.theme===theme) ||
    resource.artifacts?.find(a=>a.role==="component"&&a.format==="html"&&a.variant?.theme==="light");
  if(typeof artifact?.content!=="string"||!artifact.content.trim()||artifact.content.length>150000)return null;
  const parsed=new DOMParser().parseFromString(artifact.content,"text/html");
  // Preserve the verified source DOM and styling, not its executable code.
  for(const node of parsed.querySelectorAll("script,iframe,object,embed,link,base,meta"))node.remove();
  for(const node of parsed.querySelectorAll("*")){
    for(const attr of [...node.attributes]){
      const name=attr.name.toLowerCase(),value=attr.value.trim();
      if(name.startsWith("on")||name==="srcdoc" ||
        ((name==="href"||name==="xlink:href") && !value.startsWith("#")) ||
        (name==="src" && !/^data:image\/(?:png|jpeg|gif|webp|svg\+xml);/i.test(value))){
        node.removeAttribute(attr.name);
      }
    }
  }
  // HyperUI's verified runtime CSS contains a Google Fonts @import. Remove
  // that external request while retaining the actual Tailwind utility rules.
  const css=stylesheet.replace(/@import\s+[^;]+;/gi,"")
    .replace(/<\/style/gi,"<\\/style");
  const markup=parsed.body.innerHTML;
  const csp="default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:; "+
    "script-src 'none'; connect-src 'none'; form-action 'none'; base-uri 'none'";
  return '<!doctype html><html lang="es" class="'+theme+'"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<meta http-equiv="Content-Security-Policy" content="'+csp+'">'+
    '<style>'+css+'</style><style>html,body{margin:0;min-height:100%;width:100%;'+
    'box-sizing:border-box}body{padding:16px;background:#f8fafc;color:#111827;'+
    'font-family:system-ui,sans-serif}html.dark body{background:#111827;color:#f8fafc}'+
    '*,*::before,*::after{box-sizing:border-box}</style></head><body>'+
    markup+'</body></html>';
}
