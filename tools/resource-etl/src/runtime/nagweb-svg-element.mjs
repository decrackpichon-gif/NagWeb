// Convert monochrome SVG geometry into NagWeb's existing editable vector model.
// Reject unsupported markup before the editor creates a history entry.
export function svgElementProps(envelope, { DOMParser: Parser = globalThis.DOMParser } = {}) {
  const { resource, descriptor } = envelope || {};
  if (descriptor?.kind !== "svg") throw new Error("Esta etapa permite insertar íconos SVG de trazo.");
  if (!resource?.license?.verified || !resource.id || descriptor.instance?.renderer !== "nagweb-svg" ||
      descriptor.resourceId !== resource.id || descriptor.instance?.resourceId !== resource.id) {
    throw new Error("El recurso SVG no tiene una identidad o licencia válida.");
  }
  const { svg, size = 24, stroke = "#000000", strokeWidth = 2 } = descriptor.payload || {};
  if (typeof svg !== "string" || svg.length > 100000 ||
      !Number.isFinite(size) || size < 4 || size > 512 ||
      !/^#[a-f\d]{6}$/i.test(stroke) || !Number.isFinite(strokeWidth) || strokeWidth < .25 || strokeWidth > 8) {
    throw new Error("Los valores del SVG no son válidos.");
  }
  const doc = new Parser().parseFromString(svg, "image/svg+xml");
  const root = doc.documentElement;
  if (doc.querySelector("parsererror") || root.localName !== "svg" || root.namespaceURI !== "http://www.w3.org/2000/svg") {
    throw new Error("El SVG no se pudo leer.");
  }
  const box = (root.getAttribute("viewBox") || "").trim().split(/[\s,]+/).map(Number);
  if (box.length !== 4 || box.some(n => !Number.isFinite(n)) || box[0] !== 0 || box[1] !== 0 || box[2] <= 0 || box[3] <= 0) {
    throw new Error("Este SVG necesita un viewBox con origen cero.");
  }
  const allowed = new Set("xmlns viewBox width height fill stroke stroke-width stroke-linecap stroke-linejoin class d cx cy r rx ry x y x1 y1 x2 y2 points".split(" "));
  const shapes = new Set(["path", "circle", "ellipse", "rect", "line", "polyline", "polygon"]);
  const num = (node, key, fallback = 0) => {
    const raw = node.getAttribute(key);
    const value = raw === null ? fallback : Number(raw);
    if (!Number.isFinite(value) || Math.abs(value) > 100000) throw new Error("Geometría SVG inválida.");
    return value;
  };
  const parts = [];
  for (const node of [root, ...root.querySelectorAll("*")]) {
    if (node !== root && !shapes.has(node.localName) && node.localName !== "g") {
      throw new Error("Este SVG contiene elementos que todavía no se pueden insertar.");
    }
    if (node.namespaceURI !== root.namespaceURI || [...node.attributes].some(a => !allowed.has(a.name))) {
      throw new Error("Este SVG contiene atributos que todavía no se pueden insertar.");
    }
    if (node.hasAttribute("fill") && node.getAttribute("fill") !== "none") {
      throw new Error("Esta etapa admite íconos SVG de trazo, sin relleno.");
    }
    if (node !== root && ["stroke", "stroke-width", "stroke-linecap", "stroke-linejoin"].some(a => node.hasAttribute(a))) {
      throw new Error("Este SVG usa trazos diferentes dentro del mismo ícono.");
    }
    const tag = node.localName;
    if (tag === "path") {
      const d = node.getAttribute("d") || "";
      if (!d || !/^[MmLlHhVvCcSsQqTtAaZz\d\s,.+eE-]+$/.test(d)) throw new Error("Trazado SVG inválido.");
      parts.push(d);
    } else if (tag === "circle" || tag === "ellipse") {
      const x = num(node, "cx"), y = num(node, "cy"), rx = num(node, tag === "circle" ? "r" : "rx"), ry = tag === "circle" ? rx : num(node, "ry");
      if (rx <= 0 || ry <= 0) throw new Error("Radio SVG inválido.");
      parts.push(`M${x-rx} ${y}a${rx} ${ry} 0 1 0 ${rx*2} 0a${rx} ${ry} 0 1 0 ${-rx*2} 0Z`);
    } else if (tag === "rect") {
      const x = num(node, "x"), y = num(node, "y"), w = num(node, "width"), h = num(node, "height");
      const rx = Math.min(w/2, num(node, "rx", num(node, "ry"))), ry = Math.min(h/2, num(node, "ry", rx));
      if (w <= 0 || h <= 0 || rx < 0 || ry < 0) throw new Error("Rectángulo SVG inválido.");
      parts.push(rx && ry
        ? `M${x+rx} ${y}H${x+w-rx}A${rx} ${ry} 0 0 1 ${x+w} ${y+ry}V${y+h-ry}A${rx} ${ry} 0 0 1 ${x+w-rx} ${y+h}H${x+rx}A${rx} ${ry} 0 0 1 ${x} ${y+h-ry}V${y+ry}A${rx} ${ry} 0 0 1 ${x+rx} ${y}Z`
        : `M${x} ${y}H${x+w}V${y+h}H${x}Z`);
    } else if (tag === "line") {
      parts.push(`M${num(node,"x1")} ${num(node,"y1")}L${num(node,"x2")} ${num(node,"y2")}`);
    } else if (tag === "polyline" || tag === "polygon") {
      const points = (node.getAttribute("points") || "").trim().split(/[\s,]+/).map(Number);
      if (points.length < 4 || points.length % 2 || points.some(n => !Number.isFinite(n))) throw new Error("Puntos SVG inválidos.");
      parts.push(`M${points.slice(0,2).join(" ")}L${points.slice(2).join(" ")}${tag === "polygon" ? "Z" : ""}`);
    }
  }
  if (!parts.length) throw new Error("El SVG no tiene geometría para insertar.");
  return { kind: "svg", d: parts.join(" "), pW: box[2], pH: box[3], ratio: box[3]/box[2],
    fillType: "none", fill: "", stroke, strokeWidth, strokeScales: true,
    strokeCap: ["butt","round","square"].includes(root.getAttribute("stroke-linecap")) ? root.getAttribute("stroke-linecap") : "round",
    strokeJoin: ["miter","round","bevel"].includes(root.getAttribute("stroke-linejoin")) ? root.getAttribute("stroke-linejoin") : "round",
    anim: "none", name: String(resource.title || "Ícono de la biblioteca").slice(0,160),
    nwResource: { id: resource.id, provider: resource.provider, license: structuredClone(resource.license),
      sourceCommit: resource.sourceCommit, values: { size, stroke, strokeWidth } } };
}
