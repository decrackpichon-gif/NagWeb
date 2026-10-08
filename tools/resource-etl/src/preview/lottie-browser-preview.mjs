// The browser preview deliberately uses a pinned local SVG-only lottie-web player.
// The iframe must be sandboxed with allow-scripts, never allow-same-origin.
export function buildLottieBrowserPreview(resource, values = {}, { playerUrl } = {}) {
  if (!["lottie", "dotlottie-web"].includes(resource?.runtime?.renderer)) return null;
  if (typeof playerUrl !== "string") return null;

  let source;
  try {
    source = new URL(playerUrl);
  } catch {
    return null;
  }
  if (
    !["http:", "https:"].includes(source.protocol) ||
    !source.pathname.endsWith("/resource-browser/vendor/lottie_light.min.js") ||
    source.username || source.password || source.search || source.hash
  ) return null;

  const artifact = (resource.artifacts || []).find(
    (item) => item.role === "animation-data"
  );
  if (typeof artifact?.content !== "string" ||
      artifact.content.length > 2_000_000) return null;

  let animation;
  try {
    animation = JSON.parse(artifact.content);
  } catch {
    return null;
  }
  if (
    !animation || typeof animation !== "object" ||
    typeof animation.v !== "string" ||
    !Number.isFinite(Number(animation.fr)) || Number(animation.fr) <= 0 ||
    !Number.isFinite(Number(animation.ip)) ||
    !Number.isFinite(Number(animation.op)) ||
    Number(animation.op) <= Number(animation.ip) ||
    !Array.isArray(animation.layers) ||
    (animation.assets || []).some(
      (asset) => asset?.p && typeof asset.p === "string" &&
        !asset.p.startsWith("data:")
    )
  ) return null;

  const speed = typeof values.speed === "number" && Number.isFinite(values.speed)
    ? Math.min(4, Math.max(0.1, values.speed)) : 1;
  const loop = typeof values.loop === "boolean" ? values.loop : true;
  const autoplay = typeof values.autoplay === "boolean" ? values.autoplay : true;

  // JSON cannot break out of its script tag; the resource contributes data only.
  const animationData = JSON.stringify(animation)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
  const escapedResourceId = JSON.stringify(resource.id).replaceAll("<", "\\u003c");
  const origin = source.origin;
  const safePlayerUrl = source.href.replaceAll("&", "&amp;").replaceAll('"', "&quot;");

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' ${origin}; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; font-src 'none'; media-src 'none'; object-src 'none'; worker-src 'none'">
<style>
html,body{width:100%;height:100%;margin:0;background:#f4f5f7;font-family:system-ui}
main{width:100%;height:100%;display:grid;place-items:center}
#animation{width:min(90%,340px);height:min(90%,340px);display:grid;place-items:center}
#status{position:absolute;left:12px;bottom:12px;font-size:11px;color:#69717c}
#play{position:absolute;right:12px;bottom:12px;border:1px solid #c3c8d0;background:#fff;color:#111;border-radius:8px;padding:7px 12px;cursor:pointer}
</style></head><body>
<main><div id="animation" role="img" aria-label="Vista previa de animación Lottie"></div></main>
<span id="status">Cargando animación…</span><button type="button" id="play">Reproducir</button>
<script src="${safePlayerUrl}"></script>
<script>
const status = document.getElementById("status");
const play = document.getElementById("play");
try {
  if (!window.lottie?.loadAnimation) throw new Error("El reproductor local no está disponible");
  const animationData = ${animationData};
  const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const previewResourceId = ${escapedResourceId};
  const instance = window.lottie.loadAnimation({
    container: document.getElementById("animation"),
    renderer: "svg",
    loop: ${JSON.stringify(loop)},
    autoplay: ${JSON.stringify(autoplay)} && !prefersReducedMotion,
    animationData,
    rendererSettings: { preserveAspectRatio: "xMidYMid meet" }
  });
  instance.setSpeed(${speed});
  let configuredSpeed = ${speed};
  let configuredLoop = ${JSON.stringify(loop)};
  let configuredAutoplay = ${JSON.stringify(autoplay)};
  const sync = () => {
    play.textContent = instance.isPaused ? "Reproducir" : "Pausar";
  };
  instance.addEventListener("DOMLoaded", () => {
    status.textContent = prefersReducedMotion
      ? "Movimiento reducido: reproducción manual"
      : "Vista previa local";
    sync();
  });
  instance.addEventListener("data_failed", () => {
    status.textContent = "No se pudo reproducir esta animación";
  });
  instance.addEventListener("complete", sync);
  instance.addEventListener("loopComplete", sync);
  play.addEventListener("click", () => {
    if (instance.isPaused) instance.play();
    else instance.pause();
    sync();
  });
  window.addEventListener("message", (event) => {
    if (event.source !== window.parent) return;
    const message = event.data;
    if (
      message?.type !== "nagweb:lottie-preview:update" ||
      message.resourceId !== previewResourceId
    ) return;

    const values = message.values;
    if (
      !values || typeof values !== "object" ||
      typeof values.speed !== "number" ||
      !Number.isFinite(values.speed) ||
      values.speed < 0.1 || values.speed > 4 ||
      typeof values.loop !== "boolean" ||
      typeof values.autoplay !== "boolean"
    ) return;

    if (configuredSpeed !== values.speed) {
      configuredSpeed = values.speed;
      instance.setSpeed(configuredSpeed);
    }
    if (configuredLoop !== values.loop) {
      configuredLoop = values.loop;
      instance.setLoop(configuredLoop);
    }
    if (configuredAutoplay !== values.autoplay) {
      configuredAutoplay = values.autoplay;
      if (configuredAutoplay && !prefersReducedMotion) instance.play();
      else instance.pause();
      sync();
    }
    // Speed/loop changes never replace the animation or alter manual pause.
  });
} catch (error) {
  status.textContent = "Vista previa no disponible para esta animación";
  play.hidden = true;
}
</script></body></html>`;
}
