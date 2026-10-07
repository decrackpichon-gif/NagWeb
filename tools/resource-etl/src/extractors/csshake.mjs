import { fetchJson, fetchText } from "../lib/http.mjs";

const REPO = "elrumordelaluz/csshake";
const REF = "master";

export const CSSSHAKE_EFFECTS = [
  { name: "shake", className: "shake" },
  { name: "shake-little", className: "shake-little" },
  { name: "shake-slow", className: "shake-slow" },
  { name: "shake-hard", className: "shake-hard" },
  { name: "shake-horizontal", className: "shake-horizontal" },
  { name: "shake-vertical", className: "shake-vertical" },
  { name: "shake-rotate", className: "shake-rotate" },
  { name: "shake-opacity", className: "shake-opacity" },
  { name: "shake-crazy", className: "shake-crazy" },
  { name: "shake-chunk", className: "shake-chunk" }
];

function rawUrl(commit, path) {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${REPO}/${commit}/${encoded}`;
}

export async function extractCssShake() {
  const commitInfo = await fetchJson(
    `https://api.github.com/repos/${REPO}/commits/${REF}`
  );
  const commit = commitInfo.sha;

  const [css, scss, packageJson] = await Promise.all([
    fetchText(rawUrl(commit, "dist/csshake.css")),
    fetchText(rawUrl(commit, "scss/csshake.scss")),
    fetchJson(rawUrl(commit, "package.json"))
  ]);

  return {
    repository: `https://github.com/${REPO}`,
    commit,
    css,
    scss,
    packageJson,
    effects: CSSSHAKE_EFFECTS
  };
}
