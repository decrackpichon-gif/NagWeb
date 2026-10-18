import { NAGWEB_RESOURCE_APPLY_PROTOCOL, NAGWEB_RESOURCE_APPLY_TYPE, buildResourceApplyResult } from "../tools/resource-etl/src/runtime/resource-apply-bridge.mjs";
import { svgElementProps } from "../tools/resource-etl/src/runtime/nagweb-svg-element.mjs";
import { validatedCssEffect,isMagicTarget } from "../tools/resource-etl/src/runtime/nagweb-magic-css-effect.mjs";
import { prepareUiverseSandboxHtml } from "../tools/resource-etl/src/runtime/nagweb-html-sandbox.mjs";
import { threeNativeGeometryFromEnvelope } from "../tools/resource-etl/src/runtime/nagweb-three-native.mjs";

const toolbar = document.querySelector(".tb-left");
if (toolbar && !document.querySelector("[data-resource-library-open]")) {
  // The toolbar uses a three-column CSS grid. Keep contextual actions above
  // the centered project title when the left column gets crowded.
  toolbar.style.position = "relative";
  toolbar.style.zIndex = "2";
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
  editButton.textContent = "Editar";
  editButton.setAttribute("aria-label", "Personalizar ícono seleccionado");
  editButton.setAttribute("aria-keyshortcuts", "Alt+Enter");
  editButton.title = "Personalizar ícono seleccionado";
  editButton.style.cssText = "white-space:nowrap;flex-shrink:0;font-size:12px";
  editButton.dataset.resourceLibraryEdit = "";
  editButton.disabled = true;
  const clearMagicButton=document.createElement("button");
  clearMagicButton.type="button";
  clearMagicButton.className="tb-ico";
  clearMagicButton.textContent="Quitar FX";
  clearMagicButton.setAttribute("aria-label","Quitar animación seleccionada");
  clearMagicButton.title="Quitar animación del elemento sin borrarlo";
  clearMagicButton.dataset.resourceLibraryClearMagic="";
  clearMagicButton.disabled=true;
  clearMagicButton.style.cssText="white-space:nowrap;flex-shrink:0;font-size:12px";
  let editContext = null;
  let librarySession = 0;
  let opener = button;
  let pendingFocusReturn = null;
  let canvasLoading = false;
  let magicTargetAtOpen = null;
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
  const insertionWidths = async (type, props, parentId = "") => {
    if (sec().layout === "free" && !parentId) return { desktop: { width: deskWidth, padding: 0 }, mobile: { width: 390, padding: 0 } };
    // Measure both native layouts without changing the visible canvas or project.
    const measure = mobile => new Promise((resolve, reject) => {
      const probe = document.createElement("iframe");
      probe.dataset.resourceSizeProbe = "";
      probe.setAttribute("sandbox", "allow-same-origin");
      probe.setAttribute("aria-hidden", "true");
      probe.style.cssText = `position:fixed;left:-10000px;top:0;width:${mobile ? 390 : deskWidth}px;height:1000px;border:0;pointer-events:none`;
      const projectCopy = structuredClone(flattenPage(page()));
      const id = "resource-size-probe";
      // Child width depends on the real hierarchy and sibling allocation.
      // Clone the scene; never mutate the live editor during measurement.
      const existing = parentId ? structuredClone(sec().elements) : [];
      projectCopy.sections = [{ ...structuredClone(sec()), elements: [
        ...existing, mkEl(type, { ...props, id, parent: parentId, w: 100, mobile: { w: 100 } })
      ] }];
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
  const libraryResourceById = id => sec()?.elements.find(e => {
    if (e.id !== id) return false;
    if (isMagicTarget(e) && e.nwMagicCss?.id) return true;
    if (!e.nwResource?.id) return false;
    return e.type === "vector" || (e.type === "embed" && e.mode === "html" &&
      ((e.nwResource.kind === "uiverse-html" && e.nwResource.provider === "uiverse") ||
       (e.nwResource.kind === "spinkit-html" && e.nwResource.provider === "spinkit")));
  }) || null;
  const selectedLibraryElement = () =>
    selection.length === 1 ? libraryResourceById(selection[0]) : null;
  // One validated snapshot of a multi-selection powers both applying and
  // removing animations. Mixed unsupported selections never partially apply.
  const selectedMagicTargets = () => {
    if (!sec() || selection.length < 1 || selection.length > 48 ||
        new Set(selection).size !== selection.length) return [];
    const targets = selection.map(id => sec().elements.find(e => e.id === id));
    return targets.every(isMagicTarget) ? targets : [];
  };
  const syncEditButton = () => {
    // An iframe srcdoc can be replaced before its asynchronous load event.
    // The selected element may already be measurable in the new document;
    // ensure its canvas shortcuts are bound to that document as well.
    bindCanvasResourceEditing();
    const element = selectedLibraryElement();
    let ready = Boolean(element);
    if (element?.type === "vector") {
      // Real vector geometry, not the delayed outer-frame load flag,
      // determines whether the selected icon can be edited.
      try { measureVector(element); }
      catch { ready = false; }
    }
    if (editButton.disabled !== !ready) editButton.disabled = !ready;
    clearMagicButton.disabled=dialog.open || !selectedMagicTargets().some(e => e.nwMagicCss?.id);
    if (pendingFocusReturn && !dialog.open && !pendingFocusReturn.disabled) {
      pendingFocusReturn.focus();
      pendingFocusReturn = null;
    }
    const label = element?.nwMagicCss?.id ? "Personalizar animación seleccionada" : element?.nwResource?.kind === "uiverse-html"
      ? "Personalizar componente Uiverse seleccionado"
      : element?.nwResource?.kind === "spinkit-html"
        ? "Personalizar componente SpinKit seleccionado" : "Personalizar ícono seleccionado";
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
  hint.textContent = "Insertá SVG y HTML/CSS autónomo verificado.";
  const destination = document.createElement("select");
  destination.setAttribute("aria-label", "Insertar recurso en");
  destination.title = "Destino de inserción";
  destination.style.cssText = "flex:0 1 260px;min-width:135px;max-width:32%;background:#23252e;color:#fff;border:1px solid #555;border-radius:6px;padding:6px";
  destination.append(new Option("Raíz de la escena", ""));
  destination.hidden = true;
  const close = document.createElement("button");
  close.type = "button";
  close.className = "btn";
  close.textContent = "Volver al editor";
  hint.style.cssText = "min-width:0;flex:1";
  header.append(hint, destination, close);
  const frame = document.createElement("iframe");
  frame.title = "Biblioteca de recursos de NagWeb";
  frame.style.cssText = "display:block;width:100%;height:calc(100% - 48px);border:0";
  dialog.append(header, frame);
  document.body.append(dialog);
  toolbar.append(button,editButton,clearMagicButton);
  clearMagicButton.addEventListener("click",()=>{
    if(dialog.open)return;
    const targets=selectedMagicTargets().filter(e => e.nwMagicCss?.id);
    if(!targets.length)return;
    snapshot();
    for(const target of targets)delete target.nwMagicCss;
    refresh();syncSelectionToFrame();syncEditButton();
    let persisted=false;
    try {
      const stored=JSON.parse(localStorage.getItem(STORE_KEY)||"null");
      const elements=stored?.pages?.flatMap(p=>p.sections).flatMap(s=>s.elements)||[];
      persisted=targets.every(target => elements.some(e=>e.id===target.id&&!e.nwMagicCss));
    } catch { /* Failed storage must never be reported as saved. */ }
    if(persisted)toast(targets.length===1
      ? "Animación quitada. Podés deshacer este cambio."
      : `Animaciones quitadas de ${targets.length} elementos. Podés deshacer este cambio.`);
    else toast("No se pudo verificar el guardado de las animaciones eliminadas.");
  });
  const openLibrary = context => {
    pendingFocusReturn = null;
    librarySession++;
    editContext = context;
    const selectedTargets = context ? [] : selectedMagicTargets();
    magicTargetAtOpen = selectedTargets.length
      ? {pageId:page().id,sceneId:sec().id,
        targets:selectedTargets.map(e=>({id:e.id,fingerprint:JSON.stringify(e)}))} : null;
    opener = context ? editButton : button;
    destination.replaceChildren(new Option("Raíz de la escena", ""));
    const container = !context && selection.length === 1
      ? sec()?.elements.find(e => e.id === selection[0] && e.type === "container")
      : null;
    if (container) {
      destination.append(new Option("Dentro de: " + String(container.name || "Contenedor").slice(0, 50), container.id));
      destination.value = container.id;
    }
    destination.hidden = Boolean(context) || !container;
    hint.textContent = ["magic-css","csshake"].includes(context?.kind) ? "Editá la animación del elemento seleccionado."
      : ["uiverse-html","spinkit-html"].includes(context?.kind)
      ? "Personalizá el componente seleccionado sin reemplazarlo."
      : context ? `Personalizá el ícono seleccionado · versión ${context.mobile ? "celular" : "computadora"}.`
        : magicTargetAtOpen ? (magicTargetAtOpen.targets.length===1
          ? "Podés aplicar una animación al elemento seleccionado."
          : `Aplicá una animación a ${magicTargetAtOpen.targets.length} elementos compatibles de una vez.`)
       : "Insertá SVG y HTML/CSS autónomo verificado.";
    const url = new URL("../tools/resource-etl/resource-browser/", import.meta.url);
    url.searchParams.set("hostOrigin", location.origin);
    // Advertise this editor's current native insertion capability.
    // The receiver still validates the actual SVG for each request.
    url.searchParams.set("hostKinds", "svg,uiverse-html,spinkit-html,three-native" +
      (magicTargetAtOpen || ["magic-css","csshake"].includes(context?.kind) ? ",magic-css,csshake,motion-preset" : ""));
    if (context) {
      url.searchParams.set("editResource", context.resourceId);
      url.searchParams.set("editSession", context.session);
      if (["uiverse-html","spinkit-html","magic-css","csshake"].includes(context.kind)) url.searchParams.set("editKind", context.kind);
      url.searchParams.set("editValues", JSON.stringify(context.values));
    }
    if (frame.src !== url.href) frame.src = url.href;
    dialog.showModal();
  };
  button.addEventListener("click", () => openLibrary(null));
  editButton.addEventListener("click", () => {
    const element = selectedLibraryElement();
    if (!element) return;
    if (element.nwMagicCss?.id) {
      openLibrary({kind:element.nwMagicCss.provider,session:crypto.randomUUID(),
        resourceId:element.nwMagicCss.sourceResourceId||element.nwMagicCss.id,elementId:element.id,
        pageId:page().id,sceneId:sec().id,values:structuredClone(element.nwMagicCss.values),
        fingerprint:JSON.stringify(element)});
      return;
    }
    if (["uiverse-html","spinkit-html"].includes(element.nwResource.kind)) {
      const values = element.nwResource.values;
      if (!values || typeof values !== "object" || Array.isArray(values)) return;
      openLibrary({ kind: element.nwResource.kind, session: crypto.randomUUID(),
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
  // Selection changes redraw #pane even when the preview/main subtree does
  // not mutate. Keep FX edit/remove availability synchronized with the real
  // inspector, without polling or relying on synthetic test clicks.
  const inspectorPane=document.getElementById("pane");
  if(inspectorPane)new MutationObserver(syncEditButton).observe(inspectorPane,{childList:true,subtree:true});
  new MutationObserver(syncEditButton).observe(document.querySelector("main"), { childList: true, subtree: true });
  new MutationObserver(() => {
    canvasLoading = true;
    syncEditButton();
  }).observe(preview, { attributes: true, attributeFilter: ["srcdoc"] });
  // Canvas-first editing: the already-inserted resource stays in place.
  // Bind to each new srcdoc document, not just the original iframe document.
  const boundCanvasDocuments = new WeakSet();
  const handleCanvasEditShortcut = event => {
    if (event.defaultPrevented || event.key !== "Enter" || !event.altKey ||
        event.ctrlKey || event.metaKey || event.repeat || dialog.open ||
        event.target?.closest?.('input, textarea, select, [contenteditable], [role="textbox"]')) return;
    syncEditButton();
    if (editButton.disabled) return;
    event.preventDefault();
    event.stopPropagation();
    editButton.click();
  };
  function bindCanvasResourceEditing() {
    let canvasDoc;
    try { canvasDoc = preview.contentDocument; }
    catch { return; }
    // A newly assigned srcdoc can briefly expose a document without its
    // root element (or the transitional about:blank document). Never bind to
    // it or mark it ready until the actual preview document exists.
    if (!canvasDoc || canvasDoc.readyState === "loading" ||
        !canvasDoc.documentElement || canvasDoc.URL === "about:blank" ||
        boundCanvasDocuments.has(canvasDoc)) return;
    boundCanvasDocuments.add(canvasDoc);
    canvasDoc.addEventListener("keydown", handleCanvasEditShortcut, true);
    canvasDoc.addEventListener("dblclick", event => {
      if (event.defaultPrevented || event.button !== 0 || dialog.open) return;
      const node = event.target?.closest?.(".el[data-id]");
      if (!node || node.closest(".sc")?.dataset.id !== sec()?.id) return;
      const resource = libraryResourceById(node.dataset.id);
      if (!resource) return; // Keep normal double-click behavior for other elements.
      selection = [resource.id];
      curEl = sec().elements.indexOf(resource);
      secFocus = false;
      syncEditButton();
      if (editButton.disabled) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      editButton.click();
    }, true);
    for (const node of canvasDoc.querySelectorAll(".el[data-id]")) {
      if (libraryResourceById(node.dataset.id) && !node.hasAttribute("title"))
        node.title = "Doble clic para personalizar este recurso";
    }
    // Readiness belongs to this exact iframe document, not the previous
    // srcdoc. A newly rendered canvas must finish binding before interaction.
    const root=canvasDoc.documentElement;
    if(root)root.dataset.nagwebResourceEditReady = "1";
  }
  document.addEventListener("keydown", handleCanvasEditShortcut, true);
  preview.addEventListener("load", () => {
    canvasLoading = false;
    bindCanvasResourceEditing();
    syncEditButton();
  });
  bindCanvasResourceEditing();
  syncEditButton();
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    librarySession++;
    editContext = null;
    magicTargetAtOpen = null;
    pendingFocusReturn = opener;
    syncEditButton();
  });
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
        if (["css-inline-effect","css-effect","motion-preset"].includes(message.descriptor?.kind)) {
          const effect=validatedCssEffect(message);
          const requested=["magic-css","csshake"].includes(editContext?.kind)
            ? [{id:editContext.elementId,fingerprint:editContext.fingerprint}]
            : magicTargetAtOpen?.targets;
          if(!requested?.length)throw Error("Seleccioná elementos compatibles para animar.");
          const targets=requested.map(({id})=>sec()?.elements.find(e=>e.id===id));
          if(targets.some(e=>!isMagicTarget(e)))
            throw Error("La selección contiene elementos que no admiten esta animación.");
          if(editContext) {
            if(editContext.kind!==effect.provider || editContext.resourceId!==(effect.sourceResourceId||effect.id) ||
              message.editSession!==editContext.session || page().id!==editContext.pageId ||
              sec().id!==editContext.sceneId || JSON.stringify(targets[0])!==editContext.fingerprint)
              throw Error("La sesión de edición de la animación ya no está vigente.");
          } else if(message.editSession || !magicTargetAtOpen ||
              page().id!==magicTargetAtOpen.pageId || sec().id!==magicTargetAtOpen.sceneId ||
              selection.length!==requested.length ||
              selection.some((id,i)=>id!==requested[i].id) ||
              requested.some((item,i)=>JSON.stringify(targets[i])!==item.fingerprint)) {
            throw Error("La selección cambió. Volvé a abrir la Biblioteca.");
          }
          // Validate ALL targets before changing any, then keep the entire
          // operation in a single history entry, including undo/redo.
          if(targets.some(target=>JSON.stringify(target.nwMagicCss)!==JSON.stringify(effect))){
            snapshot();
            for(const target of targets)target.nwMagicCss=structuredClone(effect);
            selection=targets.map(e=>e.id);curEl=sec().elements.indexOf(targets[0]);secFocus=false;
            refresh();syncSelectionToFrame();
          }
          inserted=true;
          let saved=false;
          try {
            const stored=JSON.parse(localStorage.getItem(STORE_KEY)||"null");
            const elements=stored?.pages?.flatMap(p=>p.sections).flatMap(s=>s.elements)||[];
            saved=targets.every(target=>elements.some(e=>e.id===target.id&&
              JSON.stringify(e.nwMagicCss)===JSON.stringify(effect)));
          } catch { /* A corrupt or unavailable store is not a successful save. */ }
          if(!saved)throw Error("El efecto se aplicó, pero no pudo guardarse.");
          if(editContext){
            editContext.fingerprint=JSON.stringify(targets[0]);
            editContext.values=structuredClone(effect.values);
          } else magicTargetAtOpen.targets=targets.map(e=>({id:e.id,fingerprint:JSON.stringify(e)}));
          result=buildResourceApplyResult(message,{status:"applied",
            message:editContext ? "Animación actualizada y guardada."
              : targets.length===1 ? "Animación aplicada y guardada en el elemento seleccionado."
              : `Animación aplicada y guardada en ${targets.length} elementos.`});
        } else if(message.descriptor?.kind==="three-native"){
          if(editContext||message.editSession)
            throw Error("Volvé a abrir la Biblioteca para insertar un objeto 3D.");
          const native=threeNativeGeometryFromEnvelope(message);
          if(!sec()||!Array.isArray(sec().elements))
            throw Error("Seleccioná primero una escena de NagWeb.");
          const previousScene=sec().id,existing=sec().elements.length;
          const element=insertElement("shape3d",native,{parent:""});
          inserted=true;
          if(sec().id!==previousScene||sec().elements.length!==existing+1)
            throw Error("La escena cambió durante la inserción 3D.");
          const persisted=JSON.parse(localStorage.getItem(STORE_KEY)||"null");
          const saved=persisted?.pages?.flatMap(p=>p.sections)
            .flatMap(s=>s.elements).find(e=>e.id===element.id);
          if(!saved||JSON.stringify(saved)!==JSON.stringify(element))
            throw Error("El objeto 3D se insertó, pero no se pudo verificar que esté guardado.");
          result=buildResourceApplyResult(message,{status:"applied",
            message:"Icosaedro 3D insertado y guardado. Editá color, material, movimiento y tamaño desde el inspector. Es una adaptación, no toda la escena original."});
        } else {
        const isNativeHtml = message.descriptor?.kind === "html";
        const isolated = isNativeHtml ? prepareUiverseSandboxHtml(message) : null;
        const props = isNativeHtml ? null : svgElementProps(message);
        const size = isNativeHtml ? 320 : props.nwResource.values.size;
        const width = deskWidth;
        if (!sec() || !Array.isArray(sec().elements) || !(width > 0)) throw new Error("Seleccioná una escena para insertar el recurso.");
        let element;
        if (editContext) {
          if (isNativeHtml !== ["uiverse-html","spinkit-html"].includes(editContext.kind) ||
              (isNativeHtml && message.resource.provider !== (editContext.kind === "spinkit-html" ? "spinkit" : "uiverse"))) {
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
          if (isNativeHtml) {
            if (element.type !== "embed" || element.mode !== "html" ||
                element.nwResource?.kind !== editContext.kind) {
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
          editContext.values = isNativeHtml
            ? structuredClone(message.descriptor.instance.values) : props.nwResource.values;
        } else {
          if (message.editSession) throw new Error("Esta sesión de personalización terminó. Volvé a abrir el ícono.");
          // Explicitly place in the selected container or at scene root.
          const parentId = destination.hidden ? "" : destination.value;
          const parentElement = parentId
            ? sec().elements.find(e => e.id === parentId && e.type === "container")
            : null;
          if (parentId && !parentElement) {
            throw new Error("El contenedor elegido ya no existe. Volvé a abrir la Biblioteca.");
          }
          const nativeProps = isNativeHtml ? {
              mode: "html", code: isolated.srcdoc, ratio: .75, radius: 0,
              name: String(message.resource.title || "Componente HTML/CSS").slice(0, 100),
              nwResource: {
                id: message.resource.id,
                kind: message.resource.provider === "spinkit" ? "spinkit-html" : "uiverse-html",
                provider: message.resource.provider, license: message.resource.license,
                values: structuredClone(message.descriptor.instance.values)
              }
          } : props;
          const before = JSON.stringify(project);
          const sceneId = sec().id;
          const session = librarySession;
          const type = isNativeHtml ? "embed" : "vector";
          const widths = await insertionWidths(type, nativeProps, parentId);
          if (!dialog.open || editContext || librarySession !== session || sec().id !== sceneId || deskWidth !== width || JSON.stringify(project) !== before) {
            throw new Error("La escena cambió durante la inserción. Volvé a aplicar el recurso.");
          }
          const percent = (pixels, base) => {
            if (!(base?.width > 0)) throw new Error("El contenedor no tiene ancho disponible.");
            const value = (sec().layout === "horizontal" && !parentId) || base.padding > 0
              ? cardPercent(pixels, base) : pixels / base.width * 100;
            return isNativeHtml ? Math.min(85, value) : value;
          };
          element = insertElement(type, { ...nativeProps, w: percent(size, widths.desktop),
            mobile: { w: percent(isNativeHtml ? 260 : size, widths.mobile) } }, { parent: parentId });
        }
        inserted = true;
        const persisted = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
        const savedElement = persisted?.pages?.flatMap(p => p.sections).flatMap(s => s.elements).find(e => e.id === element.id);
        if (!savedElement || JSON.stringify(savedElement) !== JSON.stringify(element)) {
          throw new Error("El recurso está en el lienzo, pero no se pudo guardar. Revisá el almacenamiento del navegador.");
        }
        result = buildResourceApplyResult(message, { status: "applied", message: editContext
          ? isNativeHtml
            ? message.resource.provider === "uiverse"
              ? "Cambios guardados en el componente Uiverse seleccionado."
              : "Cambios guardados en el componente SpinKit seleccionado."
            : "Cambios guardados en el ícono seleccionado."
          : isNativeHtml
            ? message.resource.provider === "uiverse"
              ? "Componente HTML/CSS Uiverse insertado y guardado en la escena actual."
              : "Componente HTML/CSS SpinKit insertado y guardado en la escena actual."
            : "Ícono insertado y guardado en la escena actual." });
        }
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
