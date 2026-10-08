// Magic.css browser preview uses persisted CSS, no active scripts.
import {
  CSS_PREVIEW_PLAYBACK_STYLES,
  CSS_PREVIEW_PLAYBACK_MARKUP
} from "./css-playback-controls.mjs";
const SAFE_CLASS = /^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/;
const EASINGS = new Set(["linear", "ease", "ease-in", "ease-out", "ease-in-out"]);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
function boundedNumber(value, fallback, min, max) {
  return typeof value === "number" && Number.isFinite(value) &&
    value >= min && value <= max ? value : fallback;
}
export function buildMagicCssBrowserPreview(resource, values = {}) {
  if (
    resource?.source?.provider !== "magic-css" ||
    resource?.runtime?.renderer !== "nagweb-css-inline-effect" ||
    resource?.runtime?.setup?.baseClass !== "magictime"
  ) return null;
  const className = resource.runtime.setup.className;
  if (typeof className !== "string" || !SAFE_CLASS.test(className)) return null;
  const stylesheet = (resource.artifacts || []).find(
    (entry) => entry.role === "stylesheet"
  )?.content;
  if (
    typeof stylesheet !== "string" || !stylesheet.trim() ||
    stylesheet.length > 300_000
  ) return null;

  const duration = boundedNumber(values.duration, 1, 0.1, 8);
  const delay = boundedNumber(values.delay, 0, 0, 5);
  const iterations = boundedNumber(values.iterations, 1, 1, 10);
  const easing = EASINGS.has(values.easing) ? values.easing : "ease";
  // Escape style-tag delimiters embedded in CSS.
  const css = stylesheet.replaceAll("<", "\\3C ");

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'none'; connect-src 'none'; font-src 'none'; img-src data:; object-src 'none'">
<style>${css}</style>
<style>
html,body{height:100%;margin:0;background:#f4f5f7;color:#1b2630;font-family:system-ui}
body{display:grid;place-items:center;overflow:hidden}
.stage{display:grid;justify-items:center;gap:22px;padding:54px 22px 22px;text-align:center;perspective:1200px}
.demo.magictime{box-sizing:border-box;max-width:min(95vw,340px);min-width:190px;padding:28px 30px;border:1px solid #dce1e8;border-radius:18px;background:#fff;box-shadow:0 22px 58px #0002;font-size:18px;font-weight:750;animation-duration:${duration}s!important;animation-delay:${delay}s!important;animation-timing-function:${easing}!important;animation-iteration-count:${iterations}!important}
.hint{font-size:12px;color:#627083}
@media(prefers-reduced-motion:reduce){.demo{animation:none!important}}
${CSS_PREVIEW_PLAYBACK_STYLES}
</style></head><body>
${CSS_PREVIEW_PLAYBACK_MARKUP}
<main class="stage">
  <div class="demo magictime ${className}">${escapeHtml(resource.title || resource.name || className)}</div>
  <p class="hint">Duración ${duration}s · Demora ${delay}s · Repeticiones ${iterations}</p>
</main>
</body></html>`;
}
