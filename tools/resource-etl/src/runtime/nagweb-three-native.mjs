// A deliberately NARROW, source-grounded adapter to the 3D editor NagWeb
// ALREADY ships. This is a simplified, editable IcosahedronGeometry from
// the official Three.js example, never a claim to reproduce its whole scene.
export const THREE_SOURCE_REVISION="e9a8a1264c58150907230122ac17f5760a1ebab1";
export const THREE_ICOSA_RESOURCE_ID="threejs:example:webgl_geometry_colors";
export function isNativeThreeGeometryResource(resource){
  const art=resource?.artifacts?.find(a=>a.id===resource.runtime?.entryArtifactId);
  return resource?.id===THREE_ICOSA_RESOURCE_ID &&
    resource?.source?.provider==="threejs" &&
    resource.source.externalId==="examples/webgl_geometry_colors.html" &&
    resource.source.commit===THREE_SOURCE_REVISION &&
    resource.license?.verified===true &&
    resource.runtime?.type==="three" && resource.runtime?.renderer==="three" &&
    resource.runtime?.setup?.codeOnly===true &&
    art?.role==="source" && art.format==="html" &&
    typeof art.content==="string" &&
    /new\s+THREE\.IcosahedronGeometry\s*\(/.test(art.content);
}
export function threeNativeGeometryFromEnvelope(envelope){
  const {resource,descriptor}=envelope||{};
  if(resource?.id!==THREE_ICOSA_RESOURCE_ID ||
    resource?.provider!=="threejs" ||
    resource?.sourceExternalId!=="examples/webgl_geometry_colors.html" ||
    resource?.sourceCommit!==THREE_SOURCE_REVISION ||
    resource.license?.verified!==true ||
    descriptor?.kind!=="three-native" ||
    descriptor.resourceId!==resource.id ||
    descriptor.instance?.resourceId!==resource.id ||
    descriptor.instance?.renderer!=="three" ||
    descriptor.payload?.shape!=="icosa")
    throw Error("La adaptación 3D no corresponde a una geometría Three.js oficial verificada.");
  const speed=descriptor.instance.values?.speed;
  if(typeof speed!=="number"||!Number.isFinite(speed)||speed<0||speed>4||
    descriptor.payload.speed!==speed)
    throw Error("La velocidad 3D no está dentro del rango permitido.");
  return {
    shape:"icosa", color:"#8CD8F8", metalness:0.18,roughness:0.4,
    motion:speed===0?"none":"spin",amount:speed,
    dragRotate:true,dragAxis:"both",anchor:true,w:38,
    name:"Icosaedro · adaptación Three.js",
    nwResource:{id:resource.id,kind:"three-native",provider:"threejs",
      license:structuredClone(resource.license),values:{speed},
      sourceCommit:resource.sourceCommit,
      note:"Geometría nativa inspirada en webgl_geometry_colors. No reproduce la escena original completa."}
  };
}
