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
main{width:100%;height:calc(100% - 102px);display:grid;place-items:center}
#animation{width:min(90%,340px);height:min(90%,340px);display:grid;place-items:center}
#status{position:absolute;top:10px;left:12px;font-size:11px;color:#69717c}
#transport{position:absolute;bottom:0;left:0;right:0;min-height:92px;box-sizing:border-box;padding:8px 12px;display:grid;grid-template-columns:repeat(4,auto) minmax(0,1fr) auto;grid-template-areas:"play restart prev next spacer frame" "seek seek seek seek seek progress";align-items:center;gap:7px;background:#fff;border-top:1px solid #dce1e7}
#transport button{border:1px solid #c3c8d0;background:#fff;color:#111;border-radius:8px;padding:7px 10px;cursor:pointer}
#transport button:disabled{opacity:.45;cursor:not-allowed}
#play{grid-area:play}#restart{grid-area:restart}#previous{grid-area:prev}#next{grid-area:next}
#seek{grid-area:seek;width:100%;min-width:0;accent-color:#5178b6;cursor:pointer}
#progress{grid-area:progress;min-width:35px;text-align:right;font:12px ui-monospace,monospace;color:#48576b}
#frame{grid-area:frame;min-width:65px;text-align:right;font:11px ui-monospace,monospace;color:#48576b}
@media(max-width:430px){#transport{gap:5px;padding:7px}#transport button{padding:6px;font-size:11px}#frame{font-size:10px}}
</style></head><body>
<main><div id="animation" role="img" aria-label="Vista previa de animación Lottie"></div></main>
<span id="status">Cargando animación…</span>
<div id="transport" aria-label="Controles de reproducción Lottie">
  <button type="button" id="play">Reproducir</button>
  <button type="button" id="restart">Reiniciar</button>
  <button type="button" id="previous" aria-label="Retroceder un fotograma" title="Fotograma anterior">◀</button>
  <button type="button" id="next" aria-label="Avanzar un fotograma" title="Fotograma siguiente">▶</button>
  <output id="frame" aria-live="off">1/1 fot.</output>
  <input type="range" id="seek" min="0" max="100" step="0.1" value="0" aria-label="Posición de la animación; flechas para avanzar de a un fotograma">
  <output id="progress" for="seek">0%</output>
</div>
<script src="${safePlayerUrl}"></script>
<script>
const status = document.getElementById("status");
const play = document.getElementById("play");
const restart = document.getElementById("restart");
const previous = document.getElementById("previous");
const next = document.getElementById("next");
const frame = document.getElementById("frame");
const seek = document.getElementById("seek");
const progress = document.getElementById("progress");
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
  const showProgress = (percentage) => {
    if (!Number.isFinite(percentage)) return;
    const value = Math.max(0, Math.min(100, percentage));
    seek.value = String(Math.round(value * 10) / 10);
    progress.textContent = Math.round(value) + "%";
  };
  const frameCount = () => {
    const total = Number(instance.totalFrames);
    return Number.isFinite(total) && total > 0 ? Math.ceil(total) : 0;
  };
  const showFrame = () => {
    const count = frameCount();
    const current = Number(instance.currentFrame);
    if (!count || !Number.isFinite(current)) return;
    const index = Math.max(0, Math.min(count - 1, Math.floor(current)));
    frame.textContent = (index + 1) + "/" + count + " fot.";
    previous.disabled = index === 0;
    next.disabled = index === count - 1;
  };
  const syncFrame = () => {
    const total = Number(instance.totalFrames);
    const current = Number(instance.currentFrame);
    if (Number.isFinite(total) && total > 0 && Number.isFinite(current)) {
      showProgress(current / total * 100);
      showFrame();
    }
  };
  instance.addEventListener("enterFrame", syncFrame);
  instance.addEventListener("DOMLoaded", () => {
    status.textContent = prefersReducedMotion
      ? "Movimiento reducido: reproducción manual"
      : "Vista previa local";
    sync();
    syncFrame();
  });
  instance.addEventListener("data_failed", () => {
    status.textContent = "No se pudo reproducir esta animación";
  });
  instance.addEventListener("complete", () => {
    sync();
    showProgress(100);
    showFrame();
  });
  instance.addEventListener("loopComplete", () => {
    sync();
    syncFrame();
  });
  play.addEventListener("click", () => {
    if (instance.isPaused) instance.play();
    else instance.pause();
    sync();
  });
  const seekTo = (percentage) => {
    const total = Number(instance.totalFrames);
    if (!Number.isFinite(percentage) || !Number.isFinite(total) || total <= 0) return;
    const position = Math.max(0, Math.min(100, percentage));
    const wasPlaying = !instance.isPaused;
    // Lottie frames are zero-indexed. Avoid requesting the first frame after the end.
    instance.goToAndStop(Math.min(total - 0.01, total * position / 100), true);
    if (wasPlaying) instance.play();
    showProgress(position);
    showFrame();
    sync();
  };
  const stepFrame = (direction) => {
    const count = frameCount();
    const current = Number(instance.currentFrame);
    if (!count || !Number.isFinite(current)) return;
    // At a fractional playback frame, move to the adjacent integer frame.
    const anchor = direction < 0 ? Math.ceil(current) : Math.floor(current);
    const target = Math.max(0, Math.min(count - 1, anchor + direction));
    instance.goToAndStop(target, true);
    syncFrame();
    sync();
  };
  seek.addEventListener("input", () => seekTo(Number(seek.value)));
  seek.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    stepFrame(event.key === "ArrowLeft" ? -1 : 1);
  });
  previous.addEventListener("click", () => stepFrame(-1));
  next.addEventListener("click", () => stepFrame(1));
  restart.addEventListener("click", () => seekTo(0));
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
  restart.disabled = true;
  previous.disabled = true;
  next.disabled = true;
  seek.disabled = true;
}
</script></body></html>`;
}
