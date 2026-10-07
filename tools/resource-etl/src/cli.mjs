import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import {
  extractPolyHavenModels,
  resolvePolyHavenModelPackage
} from "./extractors/polyhaven.mjs";
import { extractShadcnComponents } from "./extractors/shadcn.mjs";
import {
  extractAmbientCgAssets,
  selectAmbientCgDownload
} from "./extractors/ambientcg.mjs";
import {
  extractPmndrsAssets
} from "./extractors/pmndrs.mjs";
import { extractKenneyPacks } from "./extractors/kenney.mjs";
import {
  transformPolyHavenModel,
  transformShadcnItem,
  transformAmbientCgAsset,
  transformPmndrsAsset,
  transformKenneyPack
} from "./transformers.mjs";
import { downloadFile, safeRelativePath } from "./lib/http.mjs";

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const token = arg.slice(2);
    const eq = token.indexOf("=");
    if (eq === -1) {
      out[token] = true;
    } else {
      out[token.slice(0, eq)] = token.slice(eq + 1);
    }
  }
  return out;
}

function intArg(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function printSummary(resources, mode) {
  console.log("");
  console.log(`NagWeb Resource ETL · ${mode}`);
  console.log(`Recursos: ${resources.length}`);
  for (const resource of resources.slice(0, 20)) {
    console.log(
      `- ${resource.id} · ${resource.kind} · artifacts=${resource.artifacts.length}`
    );
  }
  if (resources.length > 20) {
    console.log(`... y ${resources.length - 20} más`);
  }
  console.log("");
}

async function ingestPolyHaven(args, rootDir, dryRun, download) {
  const limit = intArg(args.limit, 5);
  const format = String(args.format || "gltf").toLowerCase();
  const resolution = String(args.resolution || "1k").toLowerCase();

  const rawItems = await extractPolyHavenModels({
    limit,
    includeFiles: true
  });

  const resources = rawItems.map(transformPolyHavenModel);
  printSummary(resources, dryRun ? "DRY RUN" : download ? "DOWNLOAD" : "WRITE");

  if (dryRun) {
    console.log(JSON.stringify(resources.slice(0, 2), null, 2));
    return;
  }

  await writeJson(path.join(rootDir, "polyhaven", "catalog.json"), resources);

  for (let index = 0; index < resources.length; index += 1) {
    const resource = resources[index];
    const raw = rawItems[index];
    const resourceDir = path.join(rootDir, "polyhaven", resource.slug);

    await writeJson(path.join(resourceDir, "resource.json"), resource);

    if (!download) continue;

    const pkg = resolvePolyHavenModelPackage(raw.files, {
      format,
      resolution
    });

    if (!pkg?.main) {
      console.warn(
        `[polyhaven] No ${format} package found for ${resource.id}; metadata kept.`
      );
      continue;
    }

    const packageFiles = [pkg.main, ...(pkg.includes || [])];

    for (const file of packageFiles) {
      const relative = safeRelativePath(file.path);
      const destination = path.join(resourceDir, "files", relative);
      console.log(`[polyhaven] ↓ ${resource.id} / ${relative}`);
      await downloadFile(file.url, destination);
    }
  }
}

async function ingestShadcn(args, rootDir, dryRun, download) {
  const limit = intArg(args.limit, 10);
  const raw = await extractShadcnComponents({
    limit,
    includeCode: true
  });

  const resources = raw.items.map((item) =>
    transformShadcnItem({ registry: raw.registry, item })
  );

  printSummary(resources, dryRun ? "DRY RUN" : download ? "DOWNLOAD" : "WRITE");

  if (dryRun) {
    console.log(JSON.stringify(resources.slice(0, 2), null, 2));
    return;
  }

  await writeJson(path.join(rootDir, "shadcn", "catalog.json"), resources);

  for (const resource of resources) {
    const resourceDir = path.join(rootDir, "shadcn", resource.slug);
    await writeJson(path.join(resourceDir, "resource.json"), resource);

    if (!download) continue;

    for (const artifact of resource.artifacts) {
      if (!artifact.content) continue;
      const relative = safeRelativePath(
        artifact.sourcePath || `${artifact.id}.${artifact.format || "txt"}`
      );
      const target = path.join(resourceDir, "files", relative);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, artifact.content, "utf8");
      console.log(`[shadcn] ✓ ${resource.id} / ${relative}`);
    }
  }
}


async function ingestAmbientCg(args, rootDir, dryRun, download) {
  const limit = intArg(args.limit, 10);
  const resolution = String(args.resolution || "1K").toUpperCase();
  const fileType = String(args["file-type"] || "JPG").toUpperCase();
  const requestedType = String(args.type || "all").toLowerCase();
  const types =
    requestedType === "model"
      ? ["3DModel"]
      : requestedType === "material"
        ? ["Material"]
        : ["3DModel", "Material"];

  const raw = await extractAmbientCgAssets({ limit, types });
  const resources = raw.items.map(transformAmbientCgAsset);

  printSummary(resources, dryRun ? "DRY RUN" : download ? "DOWNLOAD" : "WRITE");

  if (dryRun) {
    console.log(JSON.stringify(resources.slice(0, 2), null, 2));
    return;
  }

  await writeJson(path.join(rootDir, "ambientcg", "catalog.json"), resources);

  for (let index = 0; index < resources.length; index += 1) {
    const resource = resources[index];
    const asset = raw.items[index];
    const resourceDir = path.join(rootDir, "ambientcg", resource.slug);

    await writeJson(path.join(resourceDir, "resource.json"), resource);

    if (!download) continue;

    const selected = selectAmbientCgDownload(asset, {
      resolution,
      fileType
    });

    if (!selected) {
      console.warn(`[ambientcg] No downloadable package for ${resource.id}`);
      continue;
    }

    const relative = safeRelativePath(
      selected.fileName || `${resource.slug}.zip`
    );
    const destination = path.join(resourceDir, "files", relative);

    console.log(
      `[ambientcg] ↓ ${resource.id} / ${selected.attribute || relative}`
    );
    await downloadFile(selected.url, destination);
  }
}


async function ingestPmndrs(args, rootDir, dryRun, download) {
  const limit = intArg(args.limit, 10);
  const requestedType = String(args.type || "all").toLowerCase();
  const types =
    requestedType === "model"
      ? ["models"]
      : requestedType === "material"
        ? ["materials"]
        : requestedType === "hdri"
          ? ["hdris"]
          : ["models", "materials", "hdris"];

  const raw = await extractPmndrsAssets({ limit, types });
  const resources = raw.items.map(transformPmndrsAsset);

  printSummary(resources, dryRun ? "DRY RUN" : download ? "DOWNLOAD" : "WRITE");

  if (dryRun) {
    console.log(JSON.stringify(resources.slice(0, 3), null, 2));
    return;
  }

  await writeJson(path.join(rootDir, "pmndrs", "catalog.json"), resources);

  for (let index = 0; index < resources.length; index += 1) {
    const resource = resources[index];
    const asset = raw.items[index];
    const resourceDir = path.join(rootDir, "pmndrs", resource.slug);

    await writeJson(path.join(resourceDir, "resource.json"), resource);

    if (!download) continue;

    for (const file of asset.files) {
      if (file.relativePath === "info.json") continue;

      const relative = safeRelativePath(file.relativePath);
      const destination = path.join(resourceDir, "files", relative);

      console.log(`[pmndrs] ↓ ${resource.id} / ${relative}`);
      await downloadFile(file.url, destination);
    }
  }
}


async function ingestKenney(args, rootDir, dryRun, download) {
  const limit = intArg(args.limit, 10);
  const raw = await extractKenneyPacks({ limit });
  const resources = raw.items.map(transformKenneyPack);

  printSummary(resources, dryRun ? "DRY RUN" : download ? "DOWNLOAD" : "WRITE");

  if (dryRun) {
    console.log(JSON.stringify(resources.slice(0, 3), null, 2));
    return;
  }

  await writeJson(path.join(rootDir, "kenney", "catalog.json"), resources);

  for (let index = 0; index < resources.length; index += 1) {
    const resource = resources[index];
    const pack = raw.items[index];
    const resourceDir = path.join(rootDir, "kenney", resource.slug);

    await writeJson(path.join(resourceDir, "resource.json"), resource);

    if (!download) continue;

    if (!pack.verifiedCc0) {
      console.warn(`[kenney] Skip ${resource.id}: CC0 not verified.`);
      continue;
    }

    if (!pack.downloadUrl) {
      console.warn(`[kenney] Skip ${resource.id}: official ZIP not found.`);
      continue;
    }

    const filename =
      new URL(pack.downloadUrl).pathname.split("/").pop() ||
      `${resource.slug}.zip`;
    const relative = safeRelativePath(filename);
    const destination = path.join(resourceDir, "files", relative);

    console.log(`[kenney] ↓ ${resource.id} / ${relative}`);
    await downloadFile(pack.downloadUrl, destination, {
      maxBytes: 1024 * 1024 * 1024
    });
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const source = String(args.source || "polyhaven").toLowerCase();
  const download = Boolean(args.download);
  const explicitWrite = Boolean(args.write);
  const dryRun = Boolean(args["dry-run"]) || (!download && !explicitWrite);
  const rootDir = path.resolve(
    process.cwd(),
    String(args.out || "output")
  );

  if (!["polyhaven", "shadcn", "ambientcg", "pmndrs", "kenney"].includes(source)) {
    throw new Error(
      `Unknown source "${source}". Sources: polyhaven, shadcn, ambientcg, pmndrs, kenney.`
    );
  }

  console.log("NagWeb Resource ETL v0.1");
  console.log(`Source: ${source}`);
  console.log(`Mode: ${dryRun ? "dry-run" : download ? "download" : "write"}`);
  if (!dryRun) console.log(`Output: ${rootDir}`);

  if (source === "polyhaven") {
    await ingestPolyHaven(args, rootDir, dryRun, download);
  } else if (source === "ambientcg") {
    await ingestAmbientCg(args, rootDir, dryRun, download);
  } else if (source === "pmndrs") {
    await ingestPmndrs(args, rootDir, dryRun, download);
  } else if (source === "kenney") {
    await ingestKenney(args, rootDir, dryRun, download);
  } else {
    await ingestShadcn(args, rootDir, dryRun, download);
  }
}

main().catch((error) => {
  console.error("");
  console.error("ETL failed:");
  console.error(error?.stack || error);
  process.exitCode = 1;
});
