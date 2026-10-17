// Offline shell for the standalone Library only. Vault payloads are handled
// separately by the existing SHA-256-verified client, never by this worker.
import { PUBLIC_MODULES, BROWSER_SHELL_FILES } from "../src/preview/public-browser-assets.mjs";

const CACHE_PREFIX = "nagweb-resource-browser-shell-";
const CACHE_NAME = CACHE_PREFIX + "v4";
const BROWSER_ROOT = new URL("./", self.location.href);
const ALLOWED = new Set([
  ...BROWSER_SHELL_FILES.map(file => new URL(file, BROWSER_ROOT).href),
  ...PUBLIC_MODULES.map(file => new URL("../src/" + file, BROWSER_ROOT).href),
  BROWSER_ROOT.href
]);

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Atomic install: if any required module is missing, do not activate a
    // worker that might display an incomplete offline application.
    await cache.addAll([...ALLOWED]);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== BROWSER_ROOT.origin) return;
  // Ignore query params (such as hostOrigin) for known shell paths, but never
  // intercept the editor, third-party files, or the integrity-checked Vault.
  const canonical = url.origin + url.pathname;
  if (!ALLOWED.has(canonical)) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok && response.type !== "opaque") {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(canonical, response.clone());
      }
      return response;
    } catch {
      return (await caches.match(canonical)) || Response.error();
    }
  })());
});
