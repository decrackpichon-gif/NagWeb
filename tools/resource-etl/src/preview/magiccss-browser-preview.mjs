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
export function buildMagicCssBrowserPreview(resource, values = {}, { thumbnail = false } = {}) {
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
  const escapedResourceId = JSON.stringify(resource.id).replaceAll("<", "\\u003c");

  if (thumbnail) {
    // Card thumbnail: one centred sample that loops forever, no controls or scripts.
    return `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'none'; connect-src 'none'; font-src 'none'; img-src data:; object-src 'none'; frame-src 'none'">
<style>${css}</style>
<style>
html,body{height:100%;margin:0;overflow:hidden;background:#f4f5f7;font-family:system-ui}
body{display:grid;place-items:center;perspective:1200px}
.demo.magictime{box-sizing:border-box;max-width:86%;padding:20px 26px;border:1px solid #dce1e8;border-radius:14px;background:#fff;box-shadow:0 12px 26px #0002;font-size:18px;font-weight:750;color:#1b2630;text-align:center;animation-duration:${duration}s!important;animation-delay:0s!important;animation-timing-function:${easing}!important;animation-iteration-count:infinite!important}
@media(prefers-reduced-motion:reduce){.demo{animation:none!important}}
</style></head><body><div class="demo magictime ${className}">${escapeHtml(resource.title || resource.name || className)}</div></body></html>`;
  }

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-nagweb-magic-preview-v1'; connect-src 'none'; font-src 'none'; img-src data:; object-src 'none'; frame-src 'none'">
<style>${css}</style>
<style>
html,body{height:100%;margin:0;background:#f4f5f7;color:#1b2630;font-family:system-ui}
body{display:grid;place-items:center;overflow:hidden}
.stage{display:grid;justify-items:center;gap:22px;padding:54px 22px 22px;text-align:center;perspective:1200px}
.demo.magictime{box-sizing:border-box;max-width:min(95vw,340px);min-width:190px;padding:28px 30px;border:1px solid #dce1e8;border-radius:18px;background:#fff;box-shadow:0 22px 58px #0002;font-size:18px;font-weight:750;animation-duration:${duration}s!important;animation-delay:${delay}s!important;animation-timing-function:${easing}!important;animation-iteration-count:${iterations}!important}
.hint{font-size:12px;color:#627083}
@media(prefers-reduced-motion:reduce){.demo{animation:none!important}}
${CSS_PREVIEW_PLAYBACK_STYLES}
.preview-loop{position:absolute;left:14px;top:40px;width:19px;height:19px;accent-color:#5178b6;cursor:pointer;z-index:2}
.preview-loop-label{position:absolute;left:41px;top:38px;font-size:12px;font-weight:650;line-height:23px;color:#294872;cursor:pointer;user-select:none;z-index:2}
.preview-loop:checked ~ main .demo.magictime{animation-iteration-count:infinite!important}
</style></head><body>
${CSS_PREVIEW_PLAYBACK_MARKUP}
<input class="preview-loop" id="loop-preview" type="checkbox" checked aria-label="Repetir el efecto en bucle">
<label class="preview-loop-label" for="loop-preview">Repetir en bucle</label>
<main class="stage">
  <div class="demo magictime ${className}">${escapeHtml(resource.title || resource.name || className)}</div>
  <p class="hint">Duración ${duration}s · Demora ${delay}s · Repeticiones ${iterations}</p>
</main>
<script nonce="nagweb-magic-preview-v1">
const previewResourceId = ${escapedResourceId};
window.addEventListener("message", (event) => {
  // srcdoc has an opaque origin. Only its parent can send accepted updates.
  if (event.source !== window.parent) return;
  const request = event.data;
  if (
    request?.type !== "nagweb:magic-css-preview:update" ||
    request.resourceId !== previewResourceId
  ) return;
  const values = request.values;
  if (!values || typeof values !== "object") return;

  const bounded = (value, fallback, min, max) =>
    typeof value === "number" && Number.isFinite(value) &&
    value >= min && value <= max ? value : fallback;
  const allowedEasings = ["linear", "ease", "ease-in", "ease-out", "ease-in-out"];
  const duration = bounded(values.duration, 1, 0.1, 8);
  const delay = bounded(values.delay, 0, 0, 5);
  const iterations = bounded(values.iterations, 1, 1, 10);
  const easing = allowedEasings.includes(values.easing) ? values.easing : "ease";
  const target = document.querySelector(".demo.magictime");
  if (!target) return;
  target.style.setProperty("animation-duration", duration + "s", "important");
  target.style.setProperty("animation-delay", delay + "s", "important");
  target.style.setProperty("animation-timing-function", easing, "important");
  // While "Repetir en bucle" is checked the stylesheet keeps the effect infinite.
  if (document.querySelector("#loop-preview")?.checked) target.style.removeProperty("animation-iteration-count");
  else target.style.setProperty("animation-iteration-count", String(iterations), "important");
  const hint = document.querySelector(".hint");
  if (hint) {
    hint.textContent = "Duración " + duration + "s · Demora " +
      delay + "s · Repeticiones " + iterations;
  }
});
</script>
</body></html>`;
}
