// Leaf module shared by the editor block generator, the library controls/preview and the
// envelope validation. Browser-safe, no imports.
export const GLSL_NOISE_SOURCE_COMMIT = "7870430c384bd53488ff6fe9a47f8a6f571524c4";
export const GLSL_NOISE_REPOSITORY = "https://github.com/hughsk/glsl-noise";

// One definition of every adjustable parameter.
export const GLSL_NOISE_PARAMS = Object.freeze({
  c1: Object.freeze({ type: "color", label: "Color 1", default: "#142a5e" }),
  c2: Object.freeze({ type: "color", label: "Color 2", default: "#a6f0cc" }),
  scale: Object.freeze({ type: "range", label: "Escala", min: 0.3, max: 4, step: 0.01, default: 1 }),
  contrast: Object.freeze({ type: "range", label: "Contraste", min: 0.3, max: 2.5, step: 0.01, default: 1 }),
  speed: Object.freeze({ type: "range", label: "Velocidad", min: 0, max: 3, step: 0.05, default: 1 }),
  seed: Object.freeze({ type: "range", label: "Semilla", min: 0, max: 1000, step: 1, default: 12 })
});
export const GLSL_NOISE_GRAIN_DEFAULT = 0.04;
export const GLSL_NOISE_DEFAULTS = Object.freeze(Object.fromEntries(
  Object.entries(GLSL_NOISE_PARAMS).map(([key, spec]) => [key, spec.default])));

export function normalizeGlslNoiseValues(values = {}) {
  const out = {};
  for (const [key, spec] of Object.entries(GLSL_NOISE_PARAMS)) {
    const value = values?.[key];
    if (spec.type === "color") {
      out[key] = typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : spec.default;
    } else {
      out[key] = typeof value === "number" && Number.isFinite(value) && value >= spec.min && value <= spec.max
        ? value : spec.default;
    }
  }
  return out;
}

// SCShader already ships its own snoise(); rename the library symbol so nothing collides.
// This is the ONLY change made to the verified code (plus dropping the glslify pragma).
export function adaptNoiseCode(code, symbol) {
  return String(code)
    .replace(/^[ \t]*#pragma[ \t]+glslify:[^\n]*$/gm, "")
    .replace(new RegExp("\\b" + symbol + "\\b", "g"), "libNoise");
}

// The fragment main() used by BOTH the editor definitions and the library preview.
export function noiseMainGlsl(family, dimension) {
  const arg = dimension === "2d" ? "p+vec2(t,0.)" : dimension === "3d" ? "vec3(p,t)"
    : "vec4(p,cos(t)*1.8,sin(t)*1.8)";
  const rep = family === "periodic" ? ",vec" + dimension[0] + "(8.0)" : "";
  return [
    "void main(){",
    " vec2 p=P()*u_scale*2.2+vec2(u_seed*.173,u_seed*.091);",
    " float t=uTime*.22;",
    " float n=libNoise(" + arg + rep + ");",
    " float v=clamp(.5+n*u_contrast*.9,0.,1.);",
    " gl_FragColor=vec4(fin(fromLab(mix(u_c1L,u_c2L,v)),u_grain),1.);",
    "}"
  ].join("\n");
}

// Exact copies of the SCShader helpers main() relies on (checked against index.html by the self-test).
export const SCSHADER_GLSL_SHIM = Object.freeze({
  hash12: "float hash12(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}",
  toSrgb: "vec3 toSrgb(vec3 c){return pow(max(c,0.),vec3(1./2.2));}",
  fromLab: [
    "vec3 fromLab(vec3 c){float l=c.x+.3963377774*c.y+.2158037573*c.z;float m=c.x-.1055613458*c.y-.0638541728*c.z;",
    "float s=c.x-.0894841775*c.y-1.291485548*c.z;l=l*l*l;m=m*m*m;s=s*s*s;",
    "return toSrgb(vec3(4.0767416621*l-3.3077115913*m+.2309699292*s,-1.2684380046*l+2.6097574011*m-.3413193965*s,-.0041960863*l-.7034186147*m+1.707614701*s));}"
  ].join("\n"),
  fin: [
    "vec3 fin(vec3 c,float g){vec2 fc=gl_FragCoord.xy;float n=hash12(fc+fract(uTime*.731)*vec2(97.3,41.7))-.5;",
    "float lum=dot(c,vec3(.299,.587,.114));c+=n*g*(.16+.22*(1.-abs(lum*2.-1.)));",
    "c+=(hash12(fc*1.37+vec2(3.1,7.7))-.5)/180.;return c;}"
  ].join("\n")
});

// Colour helpers identical to the editor's SCShader (index.html), so the library preview
// and the inserted shader convert hex colours the same way.
export function hexToRgb01(h, fallback) {
  if (typeof h !== "string") h = fallback;
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((h || "").trim());
  if (!m) return [0, 0, 0];
  let s = m[1];
  if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  return [parseInt(s.substr(0, 2), 16) / 255, parseInt(s.substr(2, 2), 16) / 255, parseInt(s.substr(4, 2), 16) / 255];
}
const cbrt = x => (x < 0 ? -Math.pow(-x, 1 / 3) : Math.pow(x, 1 / 3));
export function rgb01ToLab(c) {
  const r = Math.pow(c[0], 2.2), g = Math.pow(c[1], 2.2), b = Math.pow(c[2], 2.2);
  const l = cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
