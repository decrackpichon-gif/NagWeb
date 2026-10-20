// Verified glsl-noise functions adapted to NagWeb's EXISTING shader engine (SCShader).
// The editor embeds the exact, pinned functions (see glsl-noise-sources.json and
// build-glsl-noise-shader-block.mjs). A project only ever stores a shader id and
// numeric/colour parameters: GLSL text coming from a resource or from a project file
// is never compiled. Browser-safe: no Node imports.
import { isVerifiedNoiseShader } from "../preview/glsl-noise-browser-preview.mjs";
import {
  GLSL_NOISE_SOURCE_COMMIT, GLSL_NOISE_REPOSITORY, GLSL_NOISE_PARAMS, GLSL_NOISE_DEFAULTS,
  normalizeGlslNoiseValues
} from "./glsl-noise-params.mjs";
export { GLSL_NOISE_SOURCE_COMMIT, GLSL_NOISE_REPOSITORY, GLSL_NOISE_PARAMS, GLSL_NOISE_DEFAULTS, normalizeGlslNoiseValues };

const FAMILY_NAMES = Object.freeze({ classic: "clásico", periodic: "periódico", simplex: "simplex" });

export function glslNoiseEditorShaderId(resource) {
  if (!isVerifiedNoiseShader(resource)) return null;
  const { family, dimension } = resource.runtime.setup;
  return "noise-" + family + "-" + dimension;
}
export function glslNoiseDisplayName(family, dimension) {
  return "Ruido " + (FAMILY_NAMES[family] || family) + " " + String(dimension).toUpperCase();
}
// A resource is natively insertable only when it is the verified resource AND it comes
// from the pinned revision whose code the editor embeds.
export function isNativeGlslNoiseResource(resource) {
  return Boolean(glslNoiseEditorShaderId(resource)) &&
    resource.source?.commit === GLSL_NOISE_SOURCE_COMMIT;
}

// Validates the apply envelope and returns the element props for NagWeb's `shader` element.
export function glslNoiseShaderFromEnvelope(envelope) {
  const { resource, descriptor } = envelope || {};
  const id = resource?.id || "";
  const match = /^glsl-noise:(classic|periodic|simplex):([234]d)$/.exec(id);
  if (!match || resource?.provider !== "glsl-noise" ||
      resource.sourceCommit !== GLSL_NOISE_SOURCE_COMMIT ||
      resource.license?.verified !== true || resource.license?.id !== "MIT" ||
      descriptor?.kind !== "shader-native" || descriptor.resourceId !== id ||
      descriptor.instance?.resourceId !== id ||
      descriptor.payload?.shaderId !== "noise-" + match[1] + "-" + match[2])
    throw Error("El shader no corresponde a una función de ruido GLSL oficial verificada.");
  const raw = descriptor.instance?.values || {};
  const values = normalizeGlslNoiseValues(raw);
  for (const key of Object.keys(GLSL_NOISE_PARAMS)) {
    if (raw[key] !== undefined && raw[key] !== values[key])
      throw Error("El parámetro «" + GLSL_NOISE_PARAMS[key].label + "» está fuera del rango permitido.");
  }
  if (JSON.stringify(descriptor.payload.values) !== JSON.stringify(values))
    throw Error("Los parámetros del shader no coinciden con los enviados.");
  return {
    sid: descriptor.payload.shaderId,
    sp: values,
    w: 100, ratio: 0.5625, radius: 16, anim: "fade",
    nwResource: {
      id, kind: "shader-native", provider: "glsl-noise",
      license: structuredClone(resource.license), values,
      sourceCommit: resource.sourceCommit,
      note: "Función " + match[1] + " " + match[2].toUpperCase() +
        " de glsl-noise (MIT) usada tal cual dentro del motor de shaders de NagWeb."
    }
  };
}
