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
main{width:100%;height:calc(100% - 126px);display:grid;place-items:center}
#animation{width:min(90%,340px);height:min(90%,340px);display:grid;place-items:center}
#status{position:absolute;top:10px;left:12px;font-size:11px;color:#69717c}
#bookmarks{position:absolute;top:8px;right:8px;z-index:2;max-width:calc(100% - 16px);font-size:11px;color:#344051}
#bookmarks summary{width:max-content;max-width:100%;margin-left:auto;cursor:pointer;list-style:none;border:1px solid #c3c8d0;background:#fff;border-radius:7px;padding:6px 10px}
#bookmarks summary::-webkit-details-marker{display:none}
#bookmark-menu{margin-top:5px;display:flex;flex-wrap:wrap;gap:5px;justify-content:flex-end;align-items:center;padding:8px;border:1px solid #c3c8d0;border-radius:9px;background:#fff;box-shadow:0 6px 20px #0002}
#bookmark-menu button,#mark-list{font:11px system-ui;border:1px solid #c3c8d0;border-radius:7px;background:#fff;color:#263445;padding:6px}
#bookmark-menu button{cursor:pointer}
#bookmark-menu button:disabled{opacity:.45;cursor:not-allowed}
#mark-list{flex:1;min-width:130px;max-width:210px}
#transport{position:absolute;bottom:0;left:0;right:0;min-height:116px;box-sizing:border-box;padding:8px 12px;display:grid;grid-template-columns:repeat(6,auto) minmax(0,1fr);grid-template-areas:"play restart back5 prev next forward5 frame" "seek seek seek seek seek seek progress" "jump jump jump time time time time";align-items:center;gap:7px;background:#fff;border-top:1px solid #dce1e7}
#transport button{border:1px solid #c3c8d0;background:#fff;color:#111;border-radius:8px;padding:7px 10px;cursor:pointer}
#transport button:disabled{opacity:.45;cursor:not-allowed}
#play{grid-area:play}#restart{grid-area:restart}#back5{grid-area:back5}#previous{grid-area:prev}#next{grid-area:next}#forward5{grid-area:forward5}
#seek{grid-area:seek;width:100%;min-width:0;accent-color:#5178b6;cursor:pointer}
#progress{grid-area:progress;min-width:35px;text-align:right;font:12px ui-monospace,monospace;color:#48576b}
#frame{grid-area:frame;min-width:65px;justify-self:end;text-align:right;font:11px ui-monospace,monospace;color:#48576b}
#jump{grid-area:jump;display:flex;align-items:center;gap:5px;color:#48576b;font-size:11px;white-space:nowrap}
#frame-jump{width:72px;min-width:0;padding:4px 6px;border:1px solid #c3c8d0;border-radius:6px;font:12px ui-monospace,monospace}
#time{grid-area:time;justify-self:end;font:12px ui-monospace,monospace;color:#48576b;font-variant-numeric:tabular-nums}
#time::before{content:"Tiempo de animación (1×) · ";color:#69717c}
@media(max-width:570px){
  main{height:calc(100% - 156px)}
  #transport{min-height:146px;padding:7px;gap:5px;grid-template-columns:repeat(4,auto) minmax(0,1fr) auto;grid-template-areas:"play restart prev next frame frame" "back5 back5 forward5 forward5 forward5 forward5" "seek seek seek seek seek progress" "jump jump jump time time time"}
  #transport button{padding:6px;font-size:11px}
  #frame{font-size:10px}
}
</style></head><body>
<main><div id="animation" role="img" aria-label="Vista previa de animación Lottie"></div></main>
<span id="status">Cargando animación…</span>
<details id="bookmarks">
  <summary id="mark-count">Marcadores (0/8)</summary>
  <div id="bookmark-menu" aria-label="Marcadores temporales de esta vista previa">
    <button type="button" id="save-mark" title="Guardar el fotograma actual">+ Guardar</button>
    <select id="mark-list" aria-label="Elegir un fotograma guardado"></select>
    <button type="button" id="go-mark" disabled>Ir</button>
    <button type="button" id="delete-mark" disabled>Eliminar</button>
  </div>
</details>
<div id="transport" aria-label="Controles de reproducción Lottie">
  <button type="button" id="play">Reproducir</button>
  <button type="button" id="restart">Reiniciar</button>
  <button type="button" id="back5" aria-label="Retroceder cinco segundos" title="Saltar 5 segundos hacia atrás">−5 s</button>
  <button type="button" id="previous" aria-label="Retroceder un fotograma" title="Fotograma anterior">◀</button>
  <button type="button" id="next" aria-label="Avanzar un fotograma" title="Fotograma siguiente">▶</button>
  <button type="button" id="forward5" aria-label="Avanzar cinco segundos" title="Saltar 5 segundos hacia adelante">+5 s</button>
  <output id="frame" aria-live="off">1/1 fot.</output>
  <input type="range" id="seek" min="0" max="0" step="1" value="0" aria-label="Fotograma de la animación; flechas para fotogramas, Shift más flechas para cinco segundos">
  <output id="progress" for="seek">0%</output>
  <label id="jump" for="frame-jump">Ir al fotograma <input id="frame-jump" type="number" min="1" step="1" value="1" aria-label="Número exacto de fotograma"></label>
  <output id="time" aria-label="Tiempo transcurrido y duración total de la animación a velocidad original">0:00.00 / 0:00.00</output>
</div>
<script src="${safePlayerUrl}"></script>
<script>
const status = document.getElementById("status");
const play = document.getElementById("play");
const restart = document.getElementById("restart");
const back5 = document.getElementById("back5");
const forward5 = document.getElementById("forward5");
const previous = document.getElementById("previous");
const next = document.getElementById("next");
const frame = document.getElementById("frame");
const seek = document.getElementById("seek");
const progress = document.getElementById("progress");
const time = document.getElementById("time");
const frameJump = document.getElementById("frame-jump");
const saveMark = document.getElementById("save-mark");
const markList = document.getElementById("mark-list");
const goMark = document.getElementById("go-mark");
const deleteMark = document.getElementById("delete-mark");
const markCount = document.getElementById("mark-count");
try {
  if (!window.lottie?.loadAnimation) throw new Error("El reproductor local no está disponible");
  const animationData = ${animationData};
  const frameRate = Number(animationData.fr);
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
  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00.00";
    const centiseconds = Math.round(seconds * 100);
    const minutes = Math.floor(centiseconds / 6000);
    const remaining = centiseconds % 6000;
    const wholeSeconds = String(Math.floor(remaining / 100)).padStart(2, "0");
    const hundredths = String(remaining % 100).padStart(2, "0");
    return minutes + ":" + wholeSeconds + "." + hundredths;
  };
  const showProgress = (percentage) => {
    if (!Number.isFinite(percentage)) return;
    const value = Math.max(0, Math.min(100, percentage));
    // Use integer frames instead of a fixed 0-1000 percentage grid.
    // Long animations can now be inspected without quantization loss.
    const totalFrames = Number(instance.totalFrames);
    const count = Number.isFinite(totalFrames) && totalFrames > 0
      ? Math.ceil(totalFrames) : 0;
    const currentFrame = Number(instance.currentFrame);
    if (count && Number.isFinite(currentFrame)) {
      seek.max = String(count - 1);
      seek.value = String(Math.max(0, Math.min(count - 1, Math.floor(currentFrame))));
    }
    progress.textContent = Math.round(value) + "%";
    const total = Number(instance.totalFrames);
    if (Number.isFinite(total) && total > 0 && frameRate > 0) {
      const duration = total / frameRate;
      time.textContent = formatTime(duration * value / 100) +
        " / " + formatTime(duration);
    }
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
    frameJump.max = String(count);
    if (document.activeElement !== frameJump) frameJump.value = String(index + 1);
    previous.disabled = index === 0;
    next.disabled = index === count - 1;
    back5.disabled = index === 0;
    forward5.disabled = index === count - 1;
  };
  // These markers belong only to the open preview, not to resource metadata.
  const markedFrames = [];
  const maxMarkers = 8;
  const refreshMarkers = (preferredFrame = null) => {
    const selected = preferredFrame === null ? markList.value : String(preferredFrame);
    const options = markedFrames.map((index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = "Fot. " + (index + 1) +
        " · " + formatTime(index / frameRate);
      return option;
    });
    markList.replaceChildren(...options);
    markList.value = markedFrames.includes(Number(selected)) && selected !== ""
      ? selected : options[0]?.value || "";
    const validSelection = markList.value !== "" &&
      markedFrames.includes(Number(markList.value));
    markCount.textContent = "Marcadores (" + markedFrames.length + "/" + maxMarkers + ")";
    saveMark.disabled = markedFrames.length >= maxMarkers || frameCount() === 0;
    goMark.disabled = !validSelection;
    deleteMark.disabled = !validSelection;
  };
  refreshMarkers();
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
  const skipSeconds = (direction, seconds = 5) => {
    const count = frameCount();
    const current = Number(instance.currentFrame);
    if (!count || !Number.isFinite(current) || !Number.isFinite(frameRate) ||
        frameRate <= 0) return;
    // Frames, not percentages. One jump is approximately five seconds
    // of animation at original speed, regardless of playback speed.
    const step = Math.max(1, Math.round(seconds * frameRate));
    const target = Math.max(0, Math.min(count - 1,
      Math.floor(current) + direction * step));
    const wasPlaying = !instance.isPaused;
    instance.goToAndStop(target, true);
    if (wasPlaying) instance.play();
    syncFrame();
    sync();
  };
  seek.addEventListener("input", () => {
    const count = frameCount();
    const index = Number(seek.value);
    if (!count || !Number.isSafeInteger(index) || index < 0 || index >= count) return;
    const wasPlaying = !instance.isPaused;
    instance.goToAndStop(index, true);
    if (wasPlaying) instance.play();
    syncFrame();
    sync();
  });
  seek.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const direction = event.key === "ArrowLeft" ? -1 : 1;
    if (event.shiftKey) skipSeconds(direction);
    else stepFrame(direction);
  });
  previous.addEventListener("click", () => stepFrame(-1));
  next.addEventListener("click", () => stepFrame(1));
  back5.addEventListener("click", () => skipSeconds(-1));
  forward5.addEventListener("click", () => skipSeconds(1));
  frameJump.addEventListener("change", () => {
    const count = frameCount();
    const text = frameJump.value.trim();
    const index = Number(text);
    if (!count || !/^[0-9]+$/.test(text) ||
        !Number.isSafeInteger(index) || index < 1 || index > count) {
      frameJump.value = String(
        Math.max(1, Math.min(count || 1, Math.floor(Number(instance.currentFrame) || 0) + 1))
      );
      return;
    }
    instance.goToAndStop(index - 1, true);
    syncFrame();
    sync();
  });
  restart.addEventListener("click", () => seekTo(0));
  saveMark.addEventListener("click", () => {
    const count = frameCount();
    const current = Number(instance.currentFrame);
    if (!count || !Number.isFinite(current)) return;
    const index = Math.max(0, Math.min(count - 1, Math.floor(current)));
    if (!markedFrames.includes(index)) {
      if (markedFrames.length >= maxMarkers) return;
      markedFrames.push(index);
      markedFrames.sort((a, b) => a - b);
    }
    refreshMarkers(index);
  });
  markList.addEventListener("change", () => refreshMarkers());
  goMark.addEventListener("click", () => {
    const text = markList.value;
    const target = Number(text);
    if (!text || !markedFrames.includes(target)) return;
    const wasPlaying = !instance.isPaused;
    instance.goToAndStop(target, true);
    if (wasPlaying) instance.play();
    syncFrame();
    sync();
  });
  deleteMark.addEventListener("click", () => {
    const target = Number(markList.value);
    if (markList.value === "" || !markedFrames.includes(target)) return;
    markedFrames.splice(markedFrames.indexOf(target), 1);
    refreshMarkers();
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
  restart.disabled = true;
  previous.disabled = true;
  next.disabled = true;
  back5.disabled = true;
  forward5.disabled = true;
  seek.disabled = true;
  frameJump.disabled = true;
  saveMark.disabled = true;
  markList.disabled = true;
  goMark.disabled = true;
  deleteMark.disabled = true;
}
</script></body></html>`;
}
