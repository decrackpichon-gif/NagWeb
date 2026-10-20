// Generates the <script id="scs-noise-src"> block embedded in the NagWeb editor (index.html).
//   node build-glsl-noise-shader-block.mjs --write   regenerate the block inside index.html
//   node build-glsl-noise-shader-block.mjs --check   fail if index.html is out of date
// The block registers the 9 verified glsl-noise functions as SCShader definitions. It is
// also copied verbatim into exported sites that use one of them.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { glslNoiseDisplayName } from "./nagweb-glsl-noise-native.mjs";
import {
  GLSL_NOISE_PARAMS, GLSL_NOISE_DEFAULTS, GLSL_NOISE_GRAIN_DEFAULT, GLSL_NOISE_SOURCE_COMMIT,
  GLSL_NOISE_REPOSITORY, adaptNoiseCode, noiseMainGlsl
} from "./glsl-noise-params.mjs";
export { adaptNoiseCode, noiseMainGlsl };

const SOURCES_URL = new URL("./glsl-noise-sources.json", import.meta.url);
export const NOISE_BLOCK_BEGIN = "/*NOISE-BLOCK-BEGIN*/";
export const NOISE_BLOCK_END = "/*NOISE-BLOCK-END*/";

export function loadNoiseSources() {
  const sources = JSON.parse(readFileSync(SOURCES_URL, "utf8"));
  if (sources.sourceCommit !== GLSL_NOISE_SOURCE_COMMIT) throw Error("glsl-noise source commit mismatch");
  for (const [key, item] of Object.entries(sources.items)) {
    if (createHash("sha256").update(item.code).digest("hex") !== item.sha256)
      throw Error("Checksum mismatch for glsl-noise " + key);
  }
  return sources;
}

const fieldSource = [
  "{type:'group',label:'Colores'}",
  "{k:'c1',label:'" + GLSL_NOISE_PARAMS.c1.label + "',type:'color'}",
  "{k:'c2',label:'" + GLSL_NOISE_PARAMS.c2.label + "',type:'color'}",
  "{type:'group',label:'Forma'}",
  ...["scale", "contrast", "seed"].map(k => rangeField(k)),
  "{type:'group',label:'Movimiento'}",
  rangeField("speed"),
  "{type:'group',label:'Textura'}",
  "{k:'grain',label:'Grano',type:'range',min:0,max:1,step:0.01}"
].join(",");
function rangeField(k) {
  const s = GLSL_NOISE_PARAMS[k];
  return "{k:'" + k + "',label:'" + s.label + "',type:'range',min:" + s.min + ",max:" + s.max + ",step:" + s.step + "}";
}

export function buildNoiseShaderBlock(sources = loadNoiseSources()) {
  const defaults = { ...GLSL_NOISE_DEFAULTS, grain: GLSL_NOISE_GRAIN_DEFAULT };
  const variants = Object.entries(sources.items).map(([key, item]) => {
    const [family, dimension] = key.split(":");
    const glsl = adaptNoiseCode(item.code, item.symbol) + "\n" + noiseMainGlsl(family, dimension);
    if (/<\s*\/?\s*script|<!--/i.test(glsl)) throw Error("Unsafe markup in GLSL " + key);
    return "  R({id:" + JSON.stringify("noise-" + family + "-" + dimension) +
      ",cat:'effect',name:" + JSON.stringify(glslNoiseDisplayName(family, dimension)) +
      ",desc:" + JSON.stringify("Función de ruido " + family + " " + dimension.toUpperCase() +
        " de glsl-noise (MIT), animada con dos colores") +
      ",lib:" + JSON.stringify({ resourceId: item.resourceId, commit: sources.sourceCommit, license: sources.license.id }) +
      ",defaults:" + JSON.stringify(defaults) + ",fields:[" + fieldSource + "],glsl:" + JSON.stringify(glsl) + "});";
  });
  return [
    NOISE_BLOCK_BEGIN,
    "/* NagWeb · shaders de ruido GLSL de la Biblioteca de recursos.",
    "   GENERADO por tools/resource-etl/src/runtime/build-glsl-noise-shader-block.mjs (no editar a mano).",
    "   Fuente: " + GLSL_NOISE_REPOSITORY + " @ " + sources.sourceCommit,
    "   Licencia: " + sources.license.name + " · " + sources.license.attributionText,
    "   " + sources.license.url,
    "   El aviso de copyright de cada función se conserva dentro de su GLSL. Solo se renombró el símbolo",
    "   exportado a libNoise para no chocar con el snoise() propio de SCShader. */",
    "(function(){'use strict';",
    "  var S=window.SCShader;if(!S||!S.register)return;",
    "  function R(d){S.register(d);}",
    ...variants,
    "})();",
    NOISE_BLOCK_END
  ].join("\n");
}

export function replaceNoiseBlock(html, block) {
  const start = html.indexOf(NOISE_BLOCK_BEGIN), end = html.indexOf(NOISE_BLOCK_END);
  if (start < 0 || end < start) throw Error("index.html has no NOISE-BLOCK markers");
  return html.slice(0, start) + block + html.slice(end + NOISE_BLOCK_END.length);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const indexPath = fileURLToPath(new URL("../../../../index.html", import.meta.url));
  const html = readFileSync(indexPath, "utf8");
  const next = replaceNoiseBlock(html, buildNoiseShaderBlock());
  if (process.argv.includes("--write")) {
    if (next !== html) writeFileSync(indexPath, next);
    console.log(next === html ? "Noise shader block already up to date." : "Noise shader block written to index.html.");
  } else {
    if (next !== html) { console.error("index.html noise shader block is out of date. Run with --write."); process.exit(1); }
    console.log("Noise shader block in index.html is up to date.");
  }
}
