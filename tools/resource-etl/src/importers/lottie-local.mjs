import path from "node:path";
import { readdir, readFile } from "node:fs/promises";
import { transformLocalLottie } from "../light-transformers.mjs";

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) files.push(full);
  }

  return files;
}

export function looksLikeLottie(data) {
  return Boolean(
    data &&
      typeof data === "object" &&
      typeof data.v === "string" &&
      Number.isFinite(Number(data.fr)) &&
      Number.isFinite(Number(data.ip)) &&
      Number.isFinite(Number(data.op)) &&
      Array.isArray(data.layers)
  );
}

export async function importLocalLottieDirectory(directory, { license } = {}) {
  const files = await walk(directory);
  const resources = [];
  const skipped = [];

  for (const file of files) {
    try {
      const data = JSON.parse(await readFile(file, "utf8"));
      if (!looksLikeLottie(data)) {
        skipped.push({ file, reason: "not-lottie" });
        continue;
      }

      resources.push(transformLocalLottie({
        name: path.basename(file, path.extname(file)),
        data,
        sourcePath: file,
        license
      }));
    } catch (error) {
      skipped.push({ file, reason: error.message });
    }
  }

  return { resources, skipped };
}
