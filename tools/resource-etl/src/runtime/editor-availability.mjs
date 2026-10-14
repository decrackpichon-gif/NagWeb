// A concise, conservative declaration of what this NagWeb editor can insert.
// This is about tested native SVG and vetted isolated HTML, NOT every
// theoretical descriptor supported by the generic ETL adapter registry.
export function editorUseOf(resource) {
  if (!resource?.license?.verified) return "code";
  const renderer = resource.runtime?.renderer;
  const entry = resource.artifacts?.find(a => a.id === resource.runtime?.entryArtifactId);
  if (renderer === "nagweb-svg" && entry?.role === "icon-data" &&
      entry.format === "svg" && typeof entry.content === "string" &&
      entry.content.trimStart().startsWith("<svg")) return "svg";
  if (renderer === "nagweb-html-tailwind" &&
      entry?.role === "component" && entry.format === "html" &&
      typeof entry.content === "string" && entry.content.trim()) {
    if (resource.source?.provider === "uiverse" && resource.id?.startsWith("uiverse:")) return "uiverse-html";
    if (resource.source?.provider === "spinkit" && resource.id?.startsWith("spinkit:")) return "spinkit-html";
  }
  return "code";
}

export function canInsertInEditor(editorUse, supportedKinds = null) {
  if (editorUse !== "svg" && editorUse !== "uiverse-html" && editorUse !== "spinkit-html") return false;
  if (!supportedKinds) return true;
  return supportedKinds.includes(editorUse) ||
    ((editorUse === "uiverse-html" || editorUse === "spinkit-html") && supportedKinds.includes("html"));
}
