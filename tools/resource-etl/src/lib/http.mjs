import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

const DEFAULT_HEADERS = {
  "User-Agent": "NagWeb-Resource-ETL/0.1 (+https://github.com/decrackpichon-gif/NagWeb)",
  Accept: "*/*"
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  url,
  { retries = 3, timeoutMs = 30000, headers = {} } = {}
) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { ...DEFAULT_HEADERS, ...headers },
        signal: AbortSignal.timeout(timeoutMs)
      });

      if (response.status === 429 || response.status >= 500) {
        const retryAfter = Number(response.headers.get("retry-after") || 0);
        if (attempt < retries) {
          await sleep(retryAfter > 0 ? retryAfter * 1000 : 500 * 2 ** attempt);
          continue;
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}`);
      }

      return response;
    } catch (error) {
      lastError = error;
      if (attempt >= retries) break;
      await sleep(500 * 2 ** attempt);
    }
  }

  throw lastError;
}

export async function fetchJson(url, options) {
  const response = await fetchWithRetry(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options?.headers || {})
    }
  });
  return response.json();
}

export async function fetchText(url, options) {
  const response = await fetchWithRetry(url, {
    ...options,
    headers: {
      Accept: "text/plain,*/*",
      ...(options?.headers || {})
    }
  });
  return response.text();
}

export function safeRelativePath(value) {
  const normalized = String(value || "")
    .replaceAll("\\", "/")
    .replace(/^\/+/, "");
  const parts = normalized.split("/").filter(Boolean);
  if (parts.some((part) => part === "..")) {
    throw new Error(`Unsafe relative path: ${value}`);
  }
  return parts.join("/");
}

export async function downloadFile(
  url,
  destination,
  { maxBytes = 512 * 1024 * 1024 } = {}
) {
  const response = await fetchWithRetry(url, { timeoutMs: 120000 });
  const declaredSize = Number(response.headers.get("content-length") || 0);

  if (declaredSize && declaredSize > maxBytes) {
    throw new Error(
      `Refusing ${url}: declared size ${declaredSize} exceeds maxBytes ${maxBytes}`
    );
  }

  await mkdir(path.dirname(destination), { recursive: true });

  let received = 0;
  const guard = new Transform({
    transform(chunk, encoding, callback) {
      received += chunk.length;
      if (received > maxBytes) {
        callback(new Error(`Refusing ${url}: streamed data exceeds maxBytes ${maxBytes}`));
        return;
      }
      callback(null, chunk);
    }
  });

  if (!response.body) throw new Error(`No body returned for ${url}`);

  await pipeline(
    Readable.fromWeb(response.body),
    guard,
    createWriteStream(destination)
  );

  return { bytes: received, destination };
}
