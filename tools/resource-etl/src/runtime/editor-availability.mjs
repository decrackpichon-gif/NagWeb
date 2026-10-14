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
  if (renderer === "nagweb-css-inline-effect" &&
      resource.source?.provider === "magic-css" &&
      resource.id?.startsWith("magic-css:") &&
      resource.runtime?.setup?.schema === "nagweb-css-effect/0.2" &&
      resource.runtime.setup.baseClass === "magictime" &&
      /^[a-z][a-zA-Z0-9_-]{0,79}$/i.test(resource.runtime.setup.className || "") &&
      entry?.role === "stylesheet" && entry.format === "css" &&
      typeof entry.content === "string" && entry.content.includes("." + resource.runtime.setup.className) &&
      /@(?:-webkit-)?keyframes\s/i.test(entry.content) &&
      entry.content.length <= 300000 &&
      !/(?:@import\b|url\s*\(|expression\s*\(|-moz-binding|behavior\s*:|<|\\0)/i.test(entry.content))
    return "magic-css";
  return "code";
}

export function canInsertInEditor(editorUse, supportedKinds = null) {
  if (editorUse !== "svg" && editorUse !== "uiverse-html" && editorUse !== "spinkit-html" && editorUse !== "magic-css") return false;
  if (!supportedKinds) return true;
  return supportedKinds.includes(editorUse) ||
    ((editorUse === "uiverse-html" || editorUse === "spinkit-html") && supportedKinds.includes("html"));
}
