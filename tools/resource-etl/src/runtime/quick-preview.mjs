// Lightweight, explicitly requested card preview. Never run third-party
// scripts or permit network requests from its sandboxed frame.
export function canQuickPreview(item) {
  return (item?.provider === "uiverse" && item.editorUse === "uiverse-html") ||
    (item?.provider === "spinkit" && item.editorUse === "spinkit-html");
}
export function offlineQuickPreviewDoc(doc) {
  if (typeof doc !== "string" || !doc.trim() || doc.length > 2_000_000) {
    throw new Error("La vista rápida no tiene un documento seguro disponible.");
  }
  // Sandbox without allow-same-origin or allow-scripts protects the host.
  // CSP also blocks remote CSS, fonts, images and frames.
  const meta = '<meta http-equiv="Content-Security-Policy" content="default-src ' +
    "'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; " +
    "form-action 'none'; base-uri 'none'; object-src 'none'\">";
  return /^\s*<!doctype\s+html\s*>/i.test(doc)
    ? doc.replace(/<!doctype\s+html\s*>/i, match => match + meta)
    : "<!doctype html>" + meta + doc;
}
