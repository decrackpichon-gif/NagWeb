import { NAGWEB_RESOURCE_APPLY_PROTOCOL, NAGWEB_RESOURCE_APPLY_TYPE, buildResourceApplyResult } from "../tools/resource-etl/src/runtime/resource-apply-bridge.mjs";
import { svgElementProps } from "../tools/resource-etl/src/runtime/nagweb-svg-element.mjs";

const toolbar = document.querySelector(".tb-left");
if (toolbar && !document.querySelector("[data-resource-library-open]")) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn";
  button.dataset.resourceLibraryOpen = "";
  button.textContent = "Biblioteca de recursos";
  const dialog = document.createElement("dialog");
  dialog.setAttribute("aria-label", "Biblioteca de recursos");
  dialog.style.cssText = "width:calc(100vw - 32px);max-width:1200px;height:calc(100dvh - 32px);padding:0;border:1px solid #555;border-radius:12px;background:#15151a;color:white;overflow:hidden";
  const header = document.createElement("div");
  header.style.cssText = "height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;gap:12px";
  const hint = document.createElement("span");
  hint.textContent = "Insertá un ícono SVG de trazo en la escena actual.";
  const close = document.createElement("button");
  close.type = "button";
  close.className = "btn";
  close.textContent = "Volver al editor";
  header.append(hint, close);
  const frame = document.createElement("iframe");
  frame.title = "Biblioteca de recursos de NagWeb";
  frame.style.cssText = "display:block;width:100%;height:calc(100% - 48px);border:0";
  dialog.append(header, frame);
  document.body.append(dialog);
  toolbar.append(button);
  button.addEventListener("click", () => {
    if (!frame.getAttribute("src")) {
      const url = new URL("../tools/resource-etl/resource-browser/", import.meta.url);
      url.searchParams.set("hostOrigin", location.origin);
      frame.src = url.href;
    }
    dialog.showModal();
  });
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => button.focus());
  const results = new Map();
  window.addEventListener("message", event => {
    const message = event.data;
    if (!dialog.open || event.origin !== location.origin || event.source !== frame.contentWindow ||
        message?.protocol !== NAGWEB_RESOURCE_APPLY_PROTOCOL || message.type !== NAGWEB_RESOURCE_APPLY_TYPE ||
        typeof message.requestId !== "string" || !message.requestId || message.requestId.length > 128) return;
    let result = results.get(message.requestId);
    if (!result) {
      let inserted = false;
      try {
        const props = svgElementProps(message);
        const size = props.nwResource.values.size;
        const width = deskWidth;
        if (!sec() || !Array.isArray(sec().elements) || !(width > 0)) throw new Error("Seleccioná una escena para insertar el ícono.");
        // Root placement makes the chosen pixel size independent of a selected container.
        const element = insertElement("vector", { ...props, w: size / width * 100,
          mobile: { w: size / 390 * 100 } }, { parent: "" });
        inserted = true;
        const persisted = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
        if (!persisted?.pages?.some(p => p.sections.some(s => s.elements.some(e => e.id === element.id)))) {
          throw new Error("El ícono está en el lienzo, pero no se pudo guardar. Revisá el almacenamiento del navegador.");
        }
        result = buildResourceApplyResult(message, { status: "applied", message: "Ícono insertado y guardado en la escena actual." });
      } catch (error) {
        result = buildResourceApplyResult(message, { status: inserted ? "error" : "rejected", message: error.message });
      }
      results.set(message.requestId, result);
      if (results.size > 100) results.delete(results.keys().next().value);
    }
    event.source.postMessage(result, event.origin);
  });
}
