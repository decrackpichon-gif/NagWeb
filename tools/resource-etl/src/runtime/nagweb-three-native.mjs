// Verified Three.js geometries adapted to NagWeb's EXISTING genuine 3D engine.
// Only primitive geometries are reused, never the full demo, its shaders,
// materials, external assets or additional objects.
export const THREE_SOURCE_REVISION="e9a8a1264c58150907230122ac17f5760a1ebab1";
export const THREE_ICOSA_RESOURCE_ID="threejs:example:webgl_geometry_colors";
const SOURCE_GEOMETRIES=Object.freeze({
  webgl_geometry_colors:{shape:"icosa",label:"icosaedro",name:"Icosaedro",
    color:"#8CD8F8",test:/new\s+THREE\.IcosahedronGeometry\s*\(/},
  webgl_interactive_cubes:{shape:"box",label:"cubo",name:"Cubo",
    color:"#F4AD6C",test:/new\s+THREE\.BoxGeometry\s*\(/},
  webgl_materials_envmaps_fasthdr:{shape:"sphere",label:"esfera",name:"Esfera",
    color:"#93D8C1",test:/new\s+THREE\.SphereGeometry\s*\(/}
});
export const THREE_NATIVE_GEOMETRY_IDS=Object.freeze(
  Object.keys(SOURCE_GEOMETRIES).map(slug=>"threejs:example:"+slug));
export function nativeThreeGeometrySpec(resource){
  const id=resource?.id;
  const slug=String(id||"").startsWith("threejs:example:")?
    id.slice("threejs:example:".length):"";
  const spec=Object.hasOwn(SOURCE_GEOMETRIES,slug)?SOURCE_GEOMETRIES[slug]:null;
  if(!spec)return null;
  const art=resource?.artifacts?.find(a=>a.id===resource.runtime?.entryArtifactId);
  if(resource?.source?.provider!=="threejs"||
    resource.source.externalId!=="examples/"+slug+".html"||
    resource.source.commit!==THREE_SOURCE_REVISION||
    resource.license?.verified!==true||
    resource.runtime?.type!=="three"||resource.runtime.renderer!=="three"||
    resource.runtime.setup?.codeOnly!==true||
    art?.role!=="source"||art.format!=="html"||
    typeof art.content!=="string"||!spec.test.test(art.content))return null;
  return spec;
}
export const isNativeThreeGeometryResource=resource=>!!nativeThreeGeometrySpec(resource);
export function threeNativeGeometryFromEnvelope(envelope){
  const {resource,descriptor}=envelope||{};
  const id=resource?.id||"",slug=id.startsWith("threejs:example:")?
    id.slice("threejs:example:".length):"";
  const spec=Object.hasOwn(SOURCE_GEOMETRIES,slug)?SOURCE_GEOMETRIES[slug]:null;
  if(!spec||resource?.provider!=="threejs"||
    resource.sourceExternalId!=="examples/"+slug+".html"||
    resource.sourceCommit!==THREE_SOURCE_REVISION||
    resource.license?.verified!==true||
    descriptor?.kind!=="three-native"||descriptor.resourceId!==id||
    descriptor.instance?.resourceId!==id||
    descriptor.instance?.renderer!=="three"||descriptor.payload?.shape!==spec.shape)
    throw Error("La adaptación 3D no corresponde a una geometría Three.js oficial verificada.");
  const speed=descriptor.instance.values?.speed;
  if(typeof speed!=="number"||!Number.isFinite(speed)||speed<0||speed>4||
     descriptor.payload.speed!==speed)
    throw Error("La velocidad 3D no está dentro del rango permitido.");
  return {shape:spec.shape,color:spec.color,metalness:.18,roughness:.4,
    motion:speed===0?"none":"spin",amount:speed,
    dragRotate:true,dragAxis:"both",anchor:true,w:38,
    name:spec.name+" · adaptación Three.js",
    nwResource:{id,kind:"three-native",provider:"threejs",
      license:structuredClone(resource.license),values:{speed},
      sourceCommit:resource.sourceCommit,
      note:"Geometría "+spec.label+" nativa inspirada en "+slug+
      ". No reproduce la escena original completa."}};
}
