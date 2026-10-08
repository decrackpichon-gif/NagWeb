import path from "node:path";
import { extractLucideIcons } from "./extractors/lucide.mjs";
import { extractMagicUiComponents } from "./extractors/magicui.mjs";
import { extractShadcnComponents } from "./extractors/shadcn.mjs";
import { extractHyperUiBlocks } from "./extractors/hyperui.mjs";
import { extractUiverseComponents } from "./extractors/uiverse.mjs";
import { extractGlslNoise } from "./extractors/glsl-noise.mjs";
import { extractMotionPrimitives } from "./extractors/motion-primitives.mjs";
import { extractAnimXyzCore } from "./extractors/animxyz.mjs";
import { extractCssShake } from "./extractors/csshake.mjs";
import { extractMagicCssEffects } from "./extractors/magic-css.mjs";
import { extractSpinKit } from "./extractors/spinkit.mjs";
import { extractThreeCodeScenes } from "./extractors/threejs.mjs";
import {
  transformLucideIcon,
  transformMagicUiComponent,
  transformHyperUiRuntime,
  transformHyperUiBlock,
  transformGlslNoise,
  transformMotionPrimitive,
  transformAnimXyzCore,
  transformAnimXyzPreset,
  transformCssShakeRuntime,
  transformCssShakeEffect,
  transformMagicCssEffect,
  transformSpinKitLoader,
  transformThreeCodeScene,
  transformUiverseComponent
} from "./light-transformers.mjs";
import { transformShadcnItem } from "./transformers.mjs";
import {
  writeResourceToVault,
  mergeVaultCatalog,
  writePortableBundle,
  writeThirdPartyNotices
} from "./vault/store.mjs";
import {
  assertFullMirrorAllowed,
  assertCodeMirrorAllowed
} from "./vault/source-policies.mjs";
import { importLocalLottieDirectory } from "./importers/lottie-local.mjs";
import { buildVaultPreviews } from "./preview/build-preview.mjs";
import { buildReactVaultPreviews } from "./preview/react-compiler.mjs";
import { buildVaultGallery } from "./gallery/build-gallery.mjs";

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const token = arg.slice(2);
    const eq = token.indexOf("=");
    if (eq === -1) out[token] = true;
    else out[token.slice(0, eq)] = token.slice(eq + 1);
  }
  return out;
}

function parseSources(value) {
  return String(value || "lucide,shadcn,magicui,motion-primitives,animxyz,threejs,hyperui,uiverse,csshake,magic-css,spinkit,glsl-noise")
    .split(",")
    .map((source) => source.trim().toLowerCase())
    .filter(Boolean);
}

function intArg(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function collectSource(source, args) {
  const all = Boolean(args.all);
  const limit = intArg(args.limit, source === "lucide" ? 50 : 25);

  if (source === "lucide") {
    assertFullMirrorAllowed("lucide");
    const raw = await extractLucideIcons({ limit, all });
    return raw.items.map((item) =>
      transformLucideIcon({ item, commit: raw.commit })
    );
  }

  if (source === "glsl-noise" || source === "glslnoise") {
    assertFullMirrorAllowed("glsl-noise");
    const raw = await extractGlslNoise();
    return raw.items.map((item) =>
      transformGlslNoise({
        repository: raw.repository,
        commit: raw.commit,
        item
      })
    );
  }

  if (source === "uiverse") {
    assertFullMirrorAllowed("uiverse");
    const raw = await extractUiverseComponents({
      limit,
      all,
      offset: args["uiverse-offset"] ? Number(args["uiverse-offset"]) : 0,
      category: args["uiverse-category"]
        ? String(args["uiverse-category"])
        : undefined
    });
    console.log(
      `[uiverse] ${raw.items.length} autonomous components selected from ${raw.scanned} scanned files (${raw.totalAvailable} available).`
    );
    console.log(
      `[uiverse] offset ${raw.startOffset} -> ${raw.nextOffset}${raw.category ? ` · category ${raw.category}` : ""}`
    );
    return raw.items.map((item) =>
      transformUiverseComponent({
        repository: raw.repository,
        commit: raw.commit,
        item
      })
    );
  }

  if (source === "hyperui") {
    assertFullMirrorAllowed("hyperui");
    const raw = await extractHyperUiBlocks({ limit, all });
    console.log(
      `[hyperui] ${raw.items.length} autonomous blocks selected from ${raw.scanned} scanned pairs.`
    );
    return [
      transformHyperUiRuntime(raw),
      ...raw.items.map((item) =>
        transformHyperUiBlock({
          repository: raw.repository,
          commit: raw.commit,
          item
        })
      )
    ];
  }

  if (source === "shadcn") {
    assertFullMirrorAllowed("shadcn");
    const raw = await extractShadcnComponents({
      limit,
      includeCode: true,
      all
    });
    return raw.items.map((item) =>
      transformShadcnItem({
        registry: raw.registry,
        item
      })
    );
  }

  if (source === "magicui") {
    assertFullMirrorAllowed("magicui");
    const raw = await extractMagicUiComponents({ limit, all });
    if (raw.skipped?.length) {
      console.warn(
        `[magicui] skipped ${raw.skipped.length} broken upstream registry item(s): ${raw.skipped
          .map((item) => item.name)
          .join(", ")}`
      );
    }
    return raw.items.map((item) =>
      transformMagicUiComponent({ registry: raw.registry, item })
    );
  }

  if (source === "motion-primitives" || source === "motionprimitives") {
    assertFullMirrorAllowed("motion-primitives");
    const raw = await extractMotionPrimitives({ limit, all });
    return raw.items.map((item) =>
      transformMotionPrimitive({
        repository: raw.repository,
        commit: raw.commit,
        item
      })
    );
  }

  if (source === "spinkit") {
    assertFullMirrorAllowed("spinkit");
    const raw = await extractSpinKit({ limit, all });
    console.log(
      `[spinkit] ${raw.items.length}/${raw.totalAvailable} loaders selected.`
    );
    return raw.items.map((item) =>
      transformSpinKitLoader({ raw, item })
    );
  }

  if (source === "magic-css" || source === "magiccss") {
    assertFullMirrorAllowed("magic-css");
    const raw = await extractMagicCssEffects({ limit, all });
    console.log(
      `[magic-css] ${raw.items.length}/${raw.totalAvailable} autonomous effects selected.`
    );
    return raw.items.map((item) =>
      transformMagicCssEffect({ raw, item })
    );
  }

  if (source === "csshake") {
    assertFullMirrorAllowed("csshake");
    const raw = await extractCssShake();
    return [
      transformCssShakeRuntime(raw),
      ...raw.effects.map((effect) =>
        transformCssShakeEffect({ raw, effect })
      )
    ];
  }

  if (source === "animxyz") {
    assertFullMirrorAllowed("animxyz");
    const raw = await extractAnimXyzCore();
    return [
      transformAnimXyzCore(raw),
      ...raw.presets.map((preset) =>
        transformAnimXyzPreset({
          preset,
          commit: raw.commit,
          repository: raw.repository
        })
      )
    ];
  }

  if (source === "threejs" || source === "three.js") {
    assertCodeMirrorAllowed("threejs");
    const raw = await extractThreeCodeScenes({ limit, all });
    console.log(
      `[threejs] ${raw.totalCodeOnly}/${raw.totalScanned} examples passed the code-only filter.`
    );
    return raw.items.map((item) =>
      transformThreeCodeScene({
        repository: raw.repository,
        commit: raw.commit,
        item
      })
    );
  }

  throw new Error(`Unsupported code-vault source: ${source}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sources = parseSources(args.sources);
  const rootDir = path.resolve(process.cwd(), String(args.out || "vault"));
  const resources = [];

  console.log("NagWeb Code Vault v0.1");
  console.log(`Destination: ${rootDir}`);

  for (const source of sources) {
    console.log(`\n[${source}] collecting...`);
    const sourceResources = await collectSource(source, args);
    console.log(`[${source}] ${sourceResources.length} resources ready.`);
    resources.push(...sourceResources);
  }

  if (args["lottie-dir"]) {
    const licenseId = String(args["license-id"] || "custom");
    const verified = Boolean(args["license-verified"]);
    const imported = await importLocalLottieDirectory(
      path.resolve(process.cwd(), String(args["lottie-dir"])),
      {
        license: {
          id: licenseId,
          name: String(args["license-name"] || licenseId),
          url: args["license-url"] ? String(args["license-url"]) : undefined,
          commercialUse: verified,
          modificationAllowed: verified,
          redistributionAllowed: verified,
          attributionRequired: Boolean(args["license-attribution"]),
          verified
        }
      }
    );

    console.log(
      `[lottie-local] ${imported.resources.length} imported, ${imported.skipped.length} skipped.`
    );
    resources.push(...imported.resources);
  }

  const entries = [];
  for (const resource of resources) {
    entries.push(await writeResourceToVault(rootDir, resource));
  }

  const catalog = await mergeVaultCatalog(rootDir, entries);
  const previewResult = await buildVaultPreviews(rootDir, catalog);
  const reactPreviewResult = args["react-previews"]
    ? await buildReactVaultPreviews(rootDir, catalog, {
        max: args["react-preview-limit"]
          ? intArg(args["react-preview-limit"], 10)
          : Infinity
      })
    : { ready: 0, deferred: 0 };
  const galleryResult = await buildVaultGallery(rootDir, catalog);
  const bundlePath = await writePortableBundle(rootDir, catalog);
  const noticesPath = await writeThirdPartyNotices(rootDir, catalog);

  console.log("");
  console.log(`Vault resources: ${catalog.count}`);
  console.log(
    `Previews: ${previewResult.built} static ready, ${previewResult.deferred} initially deferred.`
  );
  if (args["react-previews"]) {
    console.log(
      `React previews: ${reactPreviewResult.ready} ready, ${reactPreviewResult.deferred} deferred.`
    );
  }
  console.log(
    `Gallery: ${galleryResult.outputPath} · ${galleryResult.ready}/${galleryResult.resources} previewable.`
  );
  console.log(`Portable bundle: ${bundlePath}`);
  console.log(`Notices: ${noticesPath}`);
}

main().catch((error) => {
  console.error("");
  console.error("Code Vault failed:");
  console.error(error?.stack || error);
  process.exitCode = 1;
});
