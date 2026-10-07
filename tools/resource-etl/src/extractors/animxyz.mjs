import { fetchJson, fetchText } from "../lib/http.mjs";
import { mapLimit } from "../lib/async.mjs";

const REPO = "ingram-projects/animxyz";
const REF = "master";

const CORE_FILES = [
  "packages/core/src/_core.scss",
  "packages/core/src/_fancy.scss",
  "packages/core/src/_functions.scss",
  "packages/core/src/_internal.scss",
  "packages/core/src/_transformers.scss",
  "packages/core/src/_utilities.scss",
  "packages/core/src/_variables.scss",
  "packages/core/src/animxyz.scss",
  "packages/core/package.json"
];

export const ANIMXYZ_NATIVE_PRESETS = [
  { name: "fade", tracks: [{ property: "opacity", from: 0, to: 1 }] },
  { name: "right", tracks: [{ property: "x", from: "25%", to: 0 }] },
  { name: "left", tracks: [{ property: "x", from: "-25%", to: 0 }] },
  { name: "down", tracks: [{ property: "y", from: "25%", to: 0 }] },
  { name: "up", tracks: [{ property: "y", from: "-25%", to: 0 }] },
  { name: "front", tracks: [{ property: "z", from: 300, to: 0 }] },
  { name: "back", tracks: [{ property: "z", from: -300, to: 0 }] },
  { name: "flip-up", tracks: [{ property: "rotateX", from: 90, to: 0 }] },
  { name: "flip-down", tracks: [{ property: "rotateX", from: -90, to: 0 }] },
  { name: "flip-right", tracks: [{ property: "rotateY", from: 90, to: 0 }] },
  { name: "flip-left", tracks: [{ property: "rotateY", from: -90, to: 0 }] },
  { name: "rotate-right", tracks: [{ property: "rotateZ", from: 90, to: 0 }] },
  { name: "rotate-left", tracks: [{ property: "rotateZ", from: -90, to: 0 }] },
  { name: "small", tracks: [{ property: "scale", from: 0.5, to: 1 }] },
  { name: "big", tracks: [{ property: "scale", from: 1.5, to: 1 }] },
  { name: "narrow", tracks: [{ property: "scaleX", from: 0.5, to: 1 }] },
  { name: "wide", tracks: [{ property: "scaleX", from: 1.5, to: 1 }] },
  { name: "short", tracks: [{ property: "scaleY", from: 0.5, to: 1 }] },
  { name: "tall", tracks: [{ property: "scaleY", from: 1.5, to: 1 }] },
  { name: "thin", tracks: [{ property: "scaleZ", from: 0.5, to: 1 }] },
  { name: "thick", tracks: [{ property: "scaleZ", from: 1.5, to: 1 }] },
  { name: "skew-left", tracks: [{ property: "skewX", from: 30, to: 0 }] },
  { name: "skew-right", tracks: [{ property: "skewX", from: -30, to: 0 }] },
  { name: "skew-up", tracks: [{ property: "skewY", from: 30, to: 0 }] },
  { name: "skew-down", tracks: [{ property: "skewY", from: -30, to: 0 }] }
];

function rawUrl(commit, path) {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${REPO}/${commit}/${encoded}`;
}

export async function extractAnimXyzCore() {
  const commitInfo = await fetchJson(
    `https://api.github.com/repos/${REPO}/commits/${REF}`
  );
  const commit = commitInfo.sha;

  const files = await mapLimit(CORE_FILES, 5, async (path) => ({
    path,
    url: rawUrl(commit, path),
    content: await fetchText(rawUrl(commit, path))
  }));

  return {
    repository: `https://github.com/${REPO}`,
    commit,
    files,
    presets: ANIMXYZ_NATIVE_PRESETS
  };
}
