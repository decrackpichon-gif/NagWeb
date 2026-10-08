// Build a script-free, isolated preview for trusted CSSShake resources.
// The resource metadata cannot inject HTML, CSS selectors or JavaScript.
const SHAKE_CLASS = /^shake(?:-(?:little|slow|hard|horizontal|vertical|rotate|opacity|crazy|chunk))?$/;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildCssShakeBrowserPreview(
  resource,
  values = {},
  { stylesheet } = {}
) {
  if (
    resource?.source?.provider !== "csshake" ||
    resource.runtime?.renderer !== "nagweb-css-class-effect" ||
    typeof stylesheet !== "string" ||
    !stylesheet.trim() ||
    stylesheet.length > 300_000
  ) return null;

  const artifact = (resource.artifacts || []).find(
    (item) => item.role === "animation-data"
  );
  let effect;
  try {
    if (typeof artifact?.content !== "string" || artifact.content.length > 20_000) {
      return null;
    }
    effect = JSON.parse(artifact.content);
  } catch {
    return null;
  }

  const name = effect?.className;
  if (typeof name !== "string" || !SHAKE_CLASS.test(name)) return null;
  const trigger = values.trigger === "constant" ? "constant" : "hover";
  const classes = trigger === "constant" ? name + " shake-constant" : name;
  const hint = trigger === "constant"
    ? "Reproducción continua"
    : "Pasá el cursor sobre la tarjeta para activar el efecto";

  // Never let CSS content break out of its style element.
  const safeStylesheet = stylesheet.replaceAll("<", "\\3C ");
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; script-src 'none'; connect-src 'none'; object-src 'none'">
<style>${safeStylesheet}</style>
<style>
html,body{height:100%;margin:0;background:#f4f5f7;color:#1b2630;font-family:system-ui}
body{display:grid;place-items:center}
.stage{display:flex;flex-direction:column;align-items:center;gap:18px;padding:24px;text-align:center}
.demo{padding:25px 35px;border:1px solid #dae0e7;border-radius:16px;background:#fff;box-shadow:0 22px 55px #0002;font-size:19px;font-weight:750;cursor:default}
.demo:focus-visible{outline:3px solid #6b87b7;outline-offset:6px}
.hint{font-size:12px;color:#616e7b;margin:0}
@media(prefers-reduced-motion:reduce){.demo{animation:none!important}}
</style></head><body>
<main class="stage">
  <div class="demo ${classes}" tabindex="0">${escapeHtml(resource.title || resource.name || name)}</div>
  <p class="hint">${hint}</p>
</main>
</body></html>`;
}
