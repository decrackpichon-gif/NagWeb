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
  const title = escapeHtml(resource.title || resource.name || name);
  const hoverTag = trigger === "hover" ? "Elegido para insertar" : "Comparación";
  const constantTag = trigger === "constant" ? "Elegido para insertar" : "Comparación";

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
.stage{box-sizing:border-box;min-height:100%;display:grid;align-content:center;gap:20px;padding:24px 16px}
.comparison{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;width:100%;max-width:650px;margin:auto}
.mode{min-width:0;min-height:175px;padding:14px;border:2px solid #d9dfe7;border-radius:18px;background:#f9fafb;display:flex;flex-direction:column;align-items:center;justify-content:space-between;gap:12px;text-align:center}
.mode.selected{border-color:#5178b6;background:#eaf1ff}
.heading{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:750;font-size:13px}
.tag{font-size:10px;font-weight:600;color:#627083}
.selected .tag{color:#315e9f}
.demo{box-sizing:border-box;max-width:100%;padding:22px 15px;border:1px solid #dae0e7;border-radius:14px;background:#fff;box-shadow:0 18px 36px #0002;font-size:16px;font-weight:750;cursor:default}
.demo:focus-visible{outline:3px solid #6b87b7;outline-offset:6px}
.hint{font-size:11px;color:#616e7b;margin:0}
@media(max-width:430px){.comparison{grid-template-columns:1fr}.mode{min-height:145px}.stage{padding:14px}}
@media(prefers-reduced-motion:reduce){.demo{animation:none!important}}
</style></head><body>
<main class="stage">
  <div class="comparison" aria-label="Comparación de modos CSSShake">
    <section class="mode ${trigger === "hover" ? "selected" : ""}" aria-label="Modo Hover">
      <div class="heading"><span>Hover</span><span class="tag">${hoverTag}</span></div>
      <div class="demo ${name}" tabindex="0">${title}</div>
      <p class="hint">Pasá el cursor sobre la tarjeta</p>
    </section>
    <section class="mode ${trigger === "constant" ? "selected" : ""}" aria-label="Modo Siempre">
      <div class="heading"><span>Siempre</span><span class="tag">${constantTag}</span></div>
      <div class="demo ${name} shake-constant" tabindex="0">${title}</div>
      <p class="hint">Reproducción continua</p>
    </section>
  </div>
</main>
</body></html>`;
}
