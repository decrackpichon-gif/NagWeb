import { NAGWEB_RESOURCE_APPLY_PROTOCOL, NAGWEB_RESOURCE_APPLY_TYPE, buildResourceApplyResult } from "../tools/resource-etl/src/runtime/resource-apply-bridge.mjs";
import { svgElementProps } from "../tools/resource-etl/src/runtime/nagweb-svg-element.mjs";
import { prepareUiverseSandboxHtml } from "../tools/resource-etl/src/runtime/nagweb-html-sandbox.mjs";

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
  let canvasLoading = false;
  const measureVector = element => {
    const doc = preview.contentDocument;
    const node = doc && [...doc.querySelectorAll('.el[data-id]')].find(n => n.dataset.id === element.id);
    const percent = vget(element, "w");
    if (!node || doc.readyState === "loading" || node.closest('.sc')?.dataset.id !== sec().id ||
        Math.abs(doc.documentElement.clientWidth - frameW()) > 1 || Number(node.dataset.w) !== percent) {
      throw new Error("El lienzo se está actualizando. Esperá un momento y volvé a abrir Personalizar.");
    }
    const cssWidth = doc.defaultView.getComputedStyle(node).width;
    const width = Number.parseFloat(cssWidth);
    if (!cssWidth.endsWith("px") || !node.getClientRects().length || !(width > 0) || !(percent > 0)) {
      throw new Error("El ícono no tiene un tamaño visible para personalizar.");
    }
    // CSS width excludes rotation and uses the actual grid cell, gutters and mobile layout.
    const controlsCard = node.parentElement.matches('.h-card') && node.parentElement.dataset.card === element.id;
    const cardStyle = controlsCard ? doc.defaultView.getComputedStyle(node.parentElement) : null;
    const inset = style => ["paddingLeft", "paddingRight", "borderLeftWidth", "borderRightWidth"].reduce((sum, key) => sum + (Number.parseFloat(style[key]) || 0), 0);
    return { width, baseWidth: width / percent * 100, percent,
      card: controlsCard ? { width: Number.parseFloat(cardStyle.width) / percent * 100, padding: inset(cardStyle) } : null,
      sizeFixed: node.classList.contains("sc-grow") || node.parentElement.classList.contains("lay-masonry") };
  };
  const insertionWidths = async props => {
    if (sec().layout === "free") return { desktop: { width: deskWidth, padding: 0 }, mobile: { width: 390, padding: 0 } };
    // Measure both native layouts without changing the visible canvas or project.
    const measure = mobile => new Promise((resolve, reject) => {
      const probe = document.createElement("iframe");
      probe.dataset.resourceSizeProbe = "";
      probe.setAttribute("sandbox", "allow-same-origin");
      probe.setAttribute("aria-hidden", "true");
      probe.style.cssText = `position:fixed;left:-10000px;top:0;width:${mobile ? 390 : deskWidth}px;height:1000px;border:0;pointer-events:none`;
      const projectCopy = structuredClone(flattenPage(page()));
      const id = "resource-size-probe";
      projectCopy.sections = [{ ...structuredClone(sec()), elements: [mkEl("vector", { ...props, id, parent: "", w: 100, mobile: { w: 100 } })] }];
      let finished = false;
      const finish = (error, width) => { if (finished) return; finished = true; clearTimeout(timer); probe.remove(); error ? reject(error) : resolve(width); };
      const timer = setTimeout(() => finish(new Error("No pude medir la escena. Volvé a intentar aplicar el ícono.")), 10000);
      probe.addEventListener("load", async () => {
        try {
          await probe.contentDocument.fonts.ready;
          if (finished) return;
          const node = probe.contentDocument.querySelector(`[data-id="${id}"]`);
          if (!node) throw new Error("No pude medir el ícono en esta escena.");
          const width = Number.parseFloat(probe.contentWindow.getComputedStyle(node).width);
          if (!(width > 0)) throw new Error("La escena no tiene un ancho disponible para el ícono.");
          const card = node.parentElement.matches('.h-card') ? probe.contentWindow.getComputedStyle(node.parentElement) : null;
          const padding = card ? ["paddingLeft", "paddingRight", "borderLeftWidth", "borderRightWidth"].reduce((sum, key) => sum + (Number.parseFloat(card[key]) || 0), 0) : 0;
          finish(null, { width: card ? Number.parseFloat(card.width) : width, padding });
        } catch (error) { finish(error); }
      }, { once: true });
      try {
        probe.srcdoc = generateSite(projectCopy, true, false, mobile).replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "");
        document.body.append(probe);
      } catch (error) { finish(error); }
    });
    const [desktop, mobile] = await Promise.all([measure(false), measure(true)]);
    return { desktop, mobile };
  };
  const cardPercent = (size, geometry) => (geometry.padding + Math.sqrt(geometry.padding ** 2 + 4 * geometry.width * size)) / (2 * geometry.width) * 100;
  const selectedLibraryElement = () => {
    if (selection.length !== 1) return null;
    return sec()?.elements.find(e => e.id === selection[0] && e.nwResource?.id &&
      (e.type === "vector" || (e.type === "embed" && e.mode === "html" &&
        e.nwResource.kind === "uiverse-html" && e.nwResource.provider === "uiverse"))) || null;
  };
  const syncEditButton = () => {
    const element = selectedLibraryElement();
    let ready = Boolean(element);
    if (element?.type === "vector") {
      try { if (canvasLoading) ready = false; else measureVector(element); }
      catch { ready = false; }
    }
    if (editButton.disabled !== !ready) editButton.disabled = !ready;
    const label = element?.nwResource?.kind === "uiverse-html"
      ? "Personalizar componente Uiverse seleccionado" : "Personalizar ícono seleccionado";
    if (editButton.getAttribute("aria-label") !== label) {
      editButton.setAttribute("aria-label", label);
      editButton.title = label;
    }
  };
  const dialog = document.createElement("dialog");
  dialog.setAttribute("aria-label", "Biblioteca de recursos");
  dialog.style.cssText = "width:calc(100vw - 32px);max-width:1200px;height:calc(100dvh - 32px);padding:0;border:1px solid #555;border-radius:12px;background:#15151a;color:white;overflow:hidden";
  const header = document.createElement("div");
  header.style.cssText = "height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;gap:12px";
  const hint = document.createElement("span");
  hint.textContent = "Insertá íconos SVG o HTML/CSS Uiverse compatibles.";
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
    hint.textContent = context?.kind === "uiverse-html"
      ? "Personalizá el componente Uiverse seleccionado sin reemplazarlo."
      : context ? `Personalizá el ícono seleccionado · versión ${context.mobile ? "celular" : "computadora"}.`
      : "Insertá íconos SVG o HTML/CSS Uiverse compatibles.";
    const url = new URL("../tools/resource-etl/resource-browser/", import.meta.url);
    url.searchParams.set("hostOrigin", location.origin);
    // Advertise this editor's current native insertion capability.
    // The receiver still validates the actual SVG for each request.
    url.searchParams.set("hostKinds", "svg,uiverse-html");
    if (context) {
      url.searchParams.set("editResource", context.resourceId);
      url.searchParams.set("editSession", context.session);
      if (context.kind === "uiverse-html") url.searchParams.set("editKind", "uiverse-html");
      url.searchParams.set("editValues", JSON.stringify(context.values));
    }
    if (frame.src !== url.href) frame.src = url.href;
    dialog.showModal();
  };
  button.addEventListener("click", () => openLibrary(null));
  editButton.addEventListener("click", () => {
    const element = selectedLibraryElement();
    if (!element) return;
    if (element.nwResource.kind === "uiverse-html") {
      const values = element.nwResource.values;
      if (!values || typeof values !== "object" || Array.isArray(values)) return;
      openLibrary({ kind: "uiverse-html", session: crypto.randomUUID(),
        resourceId: element.nwResource.id, elementId: element.id,
        pageId: page().id, sceneId: sec().id, mobile: viewMobile,
        values: structuredClone(values), fingerprint: JSON.stringify(element) });
      return;
    }
    let stroke = resolveColor(vget(element, "stroke"), project.styles);
    if (/^#[a-f\d]{3}$/i.test(stroke)) stroke = "#" + stroke.slice(1).split("").map(c => c+c).join("");
    let geometry;
    try { geometry = measureVector(element); }
    catch (error) { toast(error.message); return; }
    const values = { size: Math.round(geometry.width), stroke,
      strokeWidth: vget(element, "strokeWidth") };
    openLibrary({ session: crypto.randomUUID(), resourceId: element.nwResource.id,
      elementId: element.id, pageId: page().id, sceneId: sec().id, mobile: viewMobile, values,
      fingerprint: JSON.stringify(element) });
  });
  new MutationObserver(syncEditButton).observe(document.querySelector("main"), { childList: true, subtree: true });
  new MutationObserver(() => {
    canvasLoading = true;
    syncEditButton();
  }).observe(preview, { attributes: true, attributeFilter: ["srcdoc"] });
  preview.addEventListener("load", () => { canvasLoading = false; syncEditButton(); });
  syncEditButton();
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => { editContext = null; opener.focus(); });
  const results = new Map();
  const pending = new Set();
  window.addEventListener("message", async event => {
    const message = event.data;
    if (!dialog.open || event.origin !== location.origin || event.source !== frame.contentWindow ||
        message?.protocol !== NAGWEB_RESOURCE_APPLY_PROTOCOL || message.type !== NAGWEB_RESOURCE_APPLY_TYPE ||
        typeof message.requestId !== "string" || !message.requestId || message.requestId.length > 128) return;
    if (pending.has(message.requestId)) return;
    let result = results.get(message.requestId);
    if (!result) {
      pending.add(message.requestId);
      let inserted = false;
      try {
        const isUiverseHtml = message.descriptor?.kind === "html";
        const isolated = isUiverseHtml ? prepareUiverseSandboxHtml(message) : null;
        const props = isUiverseHtml ? null : svgElementProps(message);
        const size = isUiverseHtml ? 320 : props.nwResource.values.size;
        const width = deskWidth;
        if (!sec() || !Array.isArray(sec().elements) || !(width > 0)) throw new Error("Seleccioná una escena para insertar el recurso.");
        let element;
        if (editContext) {
          if (isUiverseHtml !== (editContext.kind === "uiverse-html")) {
            throw new Error("El tipo de recurso no coincide con la sesión de edición.");
          }
          if (message.editSession !== editContext.session || message.resource.id !== editContext.resourceId ||
              page().id !== editContext.pageId || sec().id !== editContext.sceneId || viewMobile !== editContext.mobile) {
            throw new Error("La sesión de personalización ya no corresponde a este ícono.");
          }
          element = sec().elements.find(e => e.id === editContext.elementId);
          if (!element || JSON.stringify(element) !== editContext.fingerprint) {
            throw new Error("El recurso cambió o fue eliminado. Volvé a abrir su personalización.");
          }
          if (isUiverseHtml) {
            if (element.type !== "embed" || element.mode !== "html" ||
                element.nwResource?.kind !== "uiverse-html") {
              throw new Error("El elemento seleccionado ya no es un componente Uiverse.");
            }
            const values = message.descriptor.instance.values;
            const keys = new Set([...Object.keys(values), ...Object.keys(editContext.values)]);
            const changed = [...keys].some(key => values[key] !== editContext.values[key]);
            if (changed) {
              snapshot();
              element.code = isolated.srcdoc;
              element.nwResource.values = structuredClone(values);
            }
          } else {
            const geometry = size !== editContext.values.size ? measureVector(element) : null;
            if (geometry?.sizeFixed) throw new Error("Esta disposición fija el ancho del ícono. Cambiá su tamaño desde el contenedor.");
            const baseWidth = geometry?.baseWidth || 1;
            if (!(baseWidth > 0)) throw new Error("No pude calcular el tamaño del contenedor del ícono.");
            const changed = Object.keys(props.nwResource.values).some(key => props.nwResource.values[key] !== editContext.values[key]);
            if (changed) {
              snapshot();
              if (size !== editContext.values.size) vset(element, "w", geometry.card
                ? cardPercent(size, geometry.card) : size / baseWidth * 100);
              if (props.stroke !== editContext.values.stroke) vset(element, "stroke", props.stroke);
              if (props.strokeWidth !== editContext.values.strokeWidth) vset(element, "strokeWidth", props.strokeWidth);
              element.nwResource.values = props.nwResource.values;
            }
          }
          selection = [element.id];
          curEl = sec().elements.indexOf(element);
          secFocus = false;
          refresh();
          syncSelectionToFrame();
          editContext.fingerprint = JSON.stringify(element);
          editContext.values = isUiverseHtml
            ? structuredClone(message.descriptor.instance.values) : props.nwResource.values;
        } else {
          if (message.editSession) throw new Error("Esta sesión de personalización terminó. Volvé a abrir el ícono.");
          // Root placement makes insertion independent of a selected container.
          if (isUiverseHtml) {
            element = insertElement("embed", {
              mode: "html", code: isolated.srcdoc, ratio: .75, radius: 0,
              name: String(message.resource.title || "Componente Uiverse").slice(0, 100),
              w: Math.min(85, size / width * 100),
              mobile: { w: Math.min(85, 260 / 390 * 100) },
              nwResource: {
                id: message.resource.id, kind: "uiverse-html",
                provider: "uiverse", license: message.resource.license,
                values: structuredClone(message.descriptor.instance.values)
              }
            }, { parent: "" });
          } else {
            const before = JSON.stringify(project);
            const sceneId = sec().id;
            const widths = await insertionWidths(props);
            if (!dialog.open || editContext || sec().id !== sceneId || deskWidth !== width || JSON.stringify(project) !== before) {
              throw new Error("La escena cambió durante la inserción. Volvé a aplicar el ícono.");
            }
            const percent = base => sec().layout === "horizontal" ? cardPercent(size, base) : size / base.width * 100;
            element = insertElement("vector", { ...props, w: percent(widths.desktop),
              mobile: { w: percent(widths.mobile) } }, { parent: "" });
          }
        }
        inserted = true;
        const persisted = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
        const savedElement = persisted?.pages?.flatMap(p => p.sections).flatMap(s => s.elements).find(e => e.id === element.id);
        if (!savedElement || JSON.stringify(savedElement) !== JSON.stringify(element)) {
          throw new Error("El recurso está en el lienzo, pero no se pudo guardar. Revisá el almacenamiento del navegador.");
        }
        result = buildResourceApplyResult(message, { status: "applied", message: editContext
          ? isUiverseHtml ? "Cambios guardados en el componente Uiverse seleccionado."
            : "Cambios guardados en el ícono seleccionado." : isUiverseHtml
            ? "Componente HTML/CSS Uiverse insertado y guardado en la escena actual."
            : "Ícono insertado y guardado en la escena actual." });
      } catch (error) {
        result = buildResourceApplyResult(message, { status: inserted ? "error" : "rejected", message: error.message });
      }
      results.set(message.requestId, result);
      pending.delete(message.requestId);
      if (results.size > 100) results.delete(results.keys().next().value);
    }
    event.source.postMessage(result, event.origin);
  });
}
