// A concise, conservative declaration of what this NagWeb editor can insert.
// This is about tested native SVG and isolated Uiverse HTML, NOT every
// theoretical descriptor supported by the generic ETL adapter registry.
export function editorUseOf(resource) {
  if (!resource?.license?.verified) return "code";
  const renderer = resource.runtime?.renderer;
  const entry = resource.artifacts?.find(a => a.id === resource.runtime?.entryArtifactId);
  if (renderer === "nagweb-svg" && entry?.role === "icon-data" &&
      entry.format === "svg" && typeof entry.content === "string" &&
      entry.content.trimStart().startsWith("<svg")) return "svg";
  if (renderer === "nagweb-html-tailwind" &&
      resource.source?.provider === "uiverse" &&
      entry?.role === "component" && entry.format === "html" &&
      typeof entry.content === "string" && entry.content.trim()) return "uiverse-html";
  return "code";
}

export function canInsertInEditor(editorUse, supportedKinds = null) {
  if (editorUse !== "svg" && editorUse !== "uiverse-html") return false;
  if (!supportedKinds) return true;
  return supportedKinds.includes(editorUse) ||
    (editorUse === "uiverse-html" && supportedKinds.includes("html"));
}
