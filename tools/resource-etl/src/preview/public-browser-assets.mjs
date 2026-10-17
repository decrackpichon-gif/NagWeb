// Single source of truth for the standalone Resource Browser shell.
// Each relative src/ module is copied by build-public-site.mjs and precached
// by the scope-limited offline service worker.
export const PUBLIC_MODULES = Object.freeze([
  "runtime/persistent-vault-client.mjs",
  "runtime/offline-vault-cache.mjs",
  "runtime/editor-availability.mjs",
  "runtime/quick-preview.mjs",
  "runtime/latest-search.mjs",
  "runtime/favorites.mjs",
  "runtime/saved-customizations.mjs",
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
  "runtime/uiverse-playback.mjs",
  "runtime/uiverse-text.mjs",
  "runtime/uiverse-placeholder.mjs",
  "runtime/nagweb-html-sandbox.mjs",
  "runtime/resource-apply-bridge.mjs",
  "runtime/insert-adapters.mjs",
  "preview/lottie-browser-preview.mjs",
  "preview/csshake-browser-preview.mjs",
  "preview/magiccss-browser-preview.mjs",
  "preview/visual-previews.mjs",
  "preview/hyperui-browser-preview.mjs",
  "preview/css-playback-controls.mjs",
  "preview/public-browser-assets.mjs"
]);
export const BROWSER_SHELL_FILES = Object.freeze([
  "index.html",
  "app.mjs",
  "control-groups.mjs",
  "styles.css",
  "vendor/lottie_light.min.js",
  "offline-shell-sw.mjs"
]);
