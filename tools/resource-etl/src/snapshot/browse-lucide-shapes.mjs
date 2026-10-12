// Only geometry, never executable SVG markup, enters the lightweight index.
// The original SVG remains in each licensed, checksum-verified resource.
const VECTOR_CHARS = /^[MmLlHhVvCcSsQqTtAaZz\d\s,.+eE-]+$/;
const NUMBER = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
const SHAPES = {
  path: ["d"], circle: ["cx","cy","r"], ellipse: ["cx","cy","rx","ry"],
  line: ["x1","y1","x2","y2"], rect: ["x","y","width","height","rx","ry"],
  polyline: ["points"], polygon: ["points"]
};
function parseAttributes(fragment, whitelist) {
  const attrs = {};
  let invalid = false;
  const remainder = fragment.replace(/\s+([a-zA-Z][\w:-]*)="([^"]*)"/g, (_, key, val) => {
    if (!whitelist.includes(key) || Object.hasOwn(attrs, key)) invalid = true;
    attrs[key] = val;
    return "";
  });
  return invalid || remainder.trim() ? null : attrs;
}
function validGeometry(tag, attrs) {
  const fields = Object.keys(attrs);
  if (!fields.length || fields.some(k => !SHAPES[tag].includes(k))) return false;
  if (tag === "path") return typeof attrs.d === "string" && attrs.d.length <= 20000 &&
    VECTOR_CHARS.test(attrs.d) && /[Mm]/.test(attrs.d);
  if (tag === "polygon" || tag === "polyline") return typeof attrs.points === "string" &&
    attrs.points.length <= 20000 && /^[\d\s,.+eE-]+$/.test(attrs.points) &&
    attrs.points.trim().split(/[\s,]+/).length >= 4;
  const mandatory = { circle:["r"],ellipse:["rx","ry"],line:["x1","y1","x2","y2"],
    rect:["width","height"] }[tag] || [];
  if (mandatory.some(key => !Object.hasOwn(attrs,key))) return false;
  return fields.every(key => NUMBER.test(attrs[key]) &&
    Number.isFinite(+attrs[key]) && Math.abs(+attrs[key]) <= 100000) &&
    (tag !== "circle" || +attrs.r > 0) &&
    (tag !== "ellipse" || (+attrs.rx > 0 && +attrs.ry > 0)) &&
    (tag !== "rect" || (+attrs.width > 0 && +attrs.height > 0));
}

export function browseLucideShapes(resource) {
  if (resource?.source?.provider !== "lucide" ||
      resource.runtime?.renderer !== "nagweb-svg") return null;
  const svg = resource.artifacts?.find(a => a.role === "icon-data")?.content;
  if (typeof svg !== "string" || svg.length > 100000) return null;
  const parsed = /^<svg\b([^<>]*)>([\s\S]*?)<\/svg>$/.exec(svg.trim());
  if (!parsed) return null;
  const root = parseAttributes(parsed[1], [
    "xmlns","width","height","viewBox","fill","stroke","stroke-width",
    "stroke-linecap","stroke-linejoin"
  ]);
  if (!root || root.xmlns !== "http://www.w3.org/2000/svg" ||
      root.viewBox !== "0 0 24 24" || root.fill !== "none" ||
      root.stroke !== "currentColor" || root["stroke-linecap"] !== "round" ||
      root["stroke-linejoin"] !== "round") return null;
  const shapes = [];
  const remainder = parsed[2].replace(/<([a-z]+)\b([^<>]*?)\/\s*>/g, (full,tag,raw) => {
    if (!Object.hasOwn(SHAPES,tag) || shapes.length >= 40) return full;
    const attrs = parseAttributes(raw, SHAPES[tag]);
    if (!attrs || !validGeometry(tag, attrs)) return full;
    shapes.push([tag,attrs]);
    return "";
  });
  if (remainder.trim() || !shapes.length) return null;
  return shapes;
}
