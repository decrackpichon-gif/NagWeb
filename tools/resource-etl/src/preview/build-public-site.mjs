// Static, dependency-free copy of the Resource Browser for GitHub Pages.
// A release is deliberate: this script never deploys or changes Git refs.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cp, mkdir, writeFile, readFile, stat } from "node:fs/promises";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
// Only browser-reachable modules are published. No importers, CLI, source
// repositories, test fixtures, runtime secrets, or server files go to Pages.
const PUBLIC_MODULES = Object.freeze([
  "runtime/persistent-vault-client.mjs",
  "runtime/instance.mjs",
  "runtime/editable-controls.mjs",
  "runtime/html-css-customization.mjs",
  "runtime/uiverse-colors.mjs",
  "runtime/uiverse-dimensions.mjs",
  "runtime/uiverse-spacing.mjs",
  "runtime/uiverse-type-borders.mjs",
  "runtime/uiverse-timing.mjs",
  "runtime/uiverse-multi-timing.mjs",
  "runtime/uiverse-bezier.mjs",
  "runtime/uiverse-easing.mjs",
  "runtime/resource-apply-bridge.mjs",
  "runtime/insert-adapters.mjs",
  "preview/lottie-browser-preview.mjs",
  "preview/csshake-browser-preview.mjs",
  "preview/magiccss-browser-preview.mjs",
  "preview/css-playback-controls.mjs"
]);
const landingPage = `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="0; url=./resource-browser/">
<title>NagWeb · Biblioteca de Recursos</title></head>
<body><p><a href="./resource-browser/">Abrir Biblioteca de Recursos NagWeb</a></p></body>
</html>`;

export async function buildPublicResourceBrowser({ outputDir } = {}) {
  if (!outputDir) throw new Error("A separate --out path is required.");
  const destination = path.resolve(outputDir);
  if (destination === root || destination.startsWith(root + path.sep) &&
    ["src", "resource-browser"].some((folder) =>
      destination === path.join(root, folder) ||
      destination.startsWith(path.join(root, folder) + path.sep)
    )) {
    throw new Error("Refusing to overwrite Resource ETL source code.");
  }
  await mkdir(destination, { recursive: true });
  // Keep the same relative module paths as the local browser.
  await cp(path.join(root, "resource-browser"), path.join(destination, "resource-browser"), {
    recursive: true, force: true
  });
  for (const modulePath of PUBLIC_MODULES) {
    const source = path.join(root, "src", modulePath);
    const target = path.join(destination, "src", modulePath);
    await mkdir(path.dirname(target), { recursive: true });
    await cp(source, target, { force: true });
  }
  await writeFile(path.join(destination, "index.html"), landingPage);
  await writeFile(path.join(destination, ".nojekyll"), "");
  const browser = await readFile(path.join(destination, "resource-browser", "index.html"), "utf8");
  const app = await readFile(path.join(destination, "resource-browser", "app.mjs"), "utf8");
  const vendor = await stat(path.join(destination, "resource-browser", "vendor", "lottie_light.min.js"));
  if (!browser.includes("Biblioteca de recursos") ||
      !app.includes("createNagWebPersistentVaultClient") ||
      !vendor.isFile()) {
    throw new Error("Incomplete public browser snapshot.");
  }
  return { destination, entrypoint: "resource-browser/index.html" };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const option = process.argv.slice(2).find(s => s.startsWith("--out="));
  if (!option) {
    console.error("Uso: node src/preview/build-public-site.mjs --out=<carpeta>");
    process.exitCode = 1;
  } else {
    const result = await buildPublicResourceBrowser({
      outputDir: path.resolve(process.cwd(), option.slice("--out=".length))
    });
    console.log("Vista pública preparada:", result.destination);
    console.log("Sin deploy. Para publicarla, habilitar GitHub Pages en una rama independiente.");
  }
}
