import { NAGWEB_RESOURCE_APPLY_PROTOCOL, NAGWEB_RESOURCE_APPLY_TYPE, buildResourceApplyResult } from "../tools/resource-etl/src/runtime/resource-apply-bridge.mjs";
import { svgElementProps } from "../tools/resource-etl/src/runtime/nagweb-svg-element.mjs";

const toolbar = document.querySelector(".tb-left");
if (toolbar && !document.querySelector("[data-resource-library-open]")) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "tb-ico";
  button.dataset.resourceLibraryOpen = "";
  button.textContent = "Biblioteca";
  button.setAttribute("aria-label", "Biblioteca de recursos");
  button.title = "Biblioteca de recursos";
  button.style.cssText = "white-space:nowrap;flex-shrink:0;font-size:12px";
  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "tb-ico";
  editButton.textContent = "Personalizar";
  editButton.setAttribute("aria-label", "Personalizar ícono seleccionado");
  editButton.title = "Personalizar ícono seleccionado";
  editButton.style.cssText = "white-space:nowrap;flex-shrink:0;font-size:12px";
  editButton.dataset.resourceLibraryEdit = "";
  editButton.disabled = true;
  let editContext = null;
  let opener = button;
  const selectedIcon = () => selection.length === 1
    ? sec()?.elements.find(e => e.id === selection[0] && e.type === "vector" && e.nwResource?.id) : null;
  const syncEditButton = () => {
    const disabled = !selectedIcon();
    if (editButton.disabled !== disabled) editButton.disabled = disabled;
  };
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
  toolbar.append(button, editButton);
  const openLibrary = context => {
    editContext = context;
    opener = context ? editButton : button;
    hint.textContent = context ? "Personalizá el ícono seleccionado y guardá los cambios." : "Insertá un ícono SVG de trazo en la escena actual.";
    const url = new URL("../tools/resource-etl/resource-browser/", import.meta.url);
    url.searchParams.set("hostOrigin", location.origin);
    // Advertise this editor's current native insertion capability.
    // The receiver still validates the actual SVG for each request.
    url.searchParams.set("hostKinds", "svg");
    if (context) {
      url.searchParams.set("editResource", context.resourceId);
      url.searchParams.set("editSession", context.session);
      url.searchParams.set("editValues", JSON.stringify(context.values));
    }
    if (frame.src !== url.href) frame.src = url.href;
    dialog.showModal();
  };
  button.addEventListener("click", () => openLibrary(null));
  editButton.addEventListener("click", () => {
    const element = selectedIcon();
    if (!element) return;
    let stroke = resolveColor(vget(element, "stroke"), project.styles);
    if (/^#[a-f\d]{3}$/i.test(stroke)) stroke = "#" + stroke.slice(1).split("").map(c => c+c).join("");
    const values = { size: Math.round(designWpx(element, sec())), stroke,
      strokeWidth: vget(element, "strokeWidth") };
    openLibrary({ session: crypto.randomUUID(), resourceId: element.nwResource.id,
      elementId: element.id, pageId: page().id, sceneId: sec().id, mobile: viewMobile, values,
      fingerprint: JSON.stringify(element) });
  });
  new MutationObserver(syncEditButton).observe(document.querySelector("main"), { childList: true, subtree: true });
  syncEditButton();
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => { editContext = null; opener.focus(); });
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
        let element;
        if (editContext) {
          if (message.editSession !== editContext.session || message.resource.id !== editContext.resourceId ||
              page().id !== editContext.pageId || sec().id !== editContext.sceneId || viewMobile !== editContext.mobile) {
            throw new Error("La sesión de personalización ya no corresponde a este ícono.");
          }
          element = sec().elements.find(e => e.id === editContext.elementId);
          if (!element || JSON.stringify(element) !== editContext.fingerprint) {
            throw new Error("El ícono cambió o fue eliminado. Volvé a abrir su personalización.");
          }
          const baseWidth = designWpx({ w: 100, mobile: { w: 100 }, parent: element.parent }, sec());
          if (!(baseWidth > 0)) throw new Error("No pude calcular el tamaño del contenedor del ícono.");
          const changed = Object.keys(props.nwResource.values).some(key => props.nwResource.values[key] !== editContext.values[key]);
          if (changed) {
            snapshot();
            if (size !== editContext.values.size) vset(element, "w", size / baseWidth * 100);
            if (props.stroke !== editContext.values.stroke) vset(element, "stroke", props.stroke);
            if (props.strokeWidth !== editContext.values.strokeWidth) vset(element, "strokeWidth", props.strokeWidth);
            element.nwResource.values = props.nwResource.values;
          }
          selection = [element.id];
          curEl = sec().elements.indexOf(element);
          secFocus = false;
          refresh();
          syncSelectionToFrame();
          editContext.fingerprint = JSON.stringify(element);
          editContext.values = props.nwResource.values;
        } else {
          if (message.editSession) throw new Error("Esta sesión de personalización terminó. Volvé a abrir el ícono.");
          // Root placement makes insertion independent of a selected container.
          element = insertElement("vector", { ...props, w: size / width * 100,
            mobile: { w: size / 390 * 100 } }, { parent: "" });
        }
        inserted = true;
        const persisted = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
        const savedElement = persisted?.pages?.flatMap(p => p.sections).flatMap(s => s.elements).find(e => e.id === element.id);
        if (!savedElement || JSON.stringify(savedElement) !== JSON.stringify(element)) {
          throw new Error("El ícono está en el lienzo, pero no se pudo guardar. Revisá el almacenamiento del navegador.");
        }
        result = buildResourceApplyResult(message, { status: "applied", message: editContext
          ? "Cambios guardados en el ícono seleccionado." : "Ícono insertado y guardado en la escena actual." });
      } catch (error) {
        result = buildResourceApplyResult(message, { status: inserted ? "error" : "rejected", message: error.message });
      }
      results.set(message.requestId, result);
      if (results.size > 100) results.delete(results.keys().next().value);
    }
    event.source.postMessage(result, event.origin);
  });
}
