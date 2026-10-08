import assert from "node:assert/strict";
import { createNagWebPersistentVaultClient } from "./runtime/persistent-vault-client.mjs";
import {
  buildResourceApplyEnvelope,
  sendResourceApplyEnvelope
} from "./runtime/resource-apply-bridge.mjs";

const client = createNagWebPersistentVaultClient();
const manifest = await client.loadManifest();
assert.ok(manifest.consolidated.count >= 6439);

const index = await client.loadBrowseIndex();
assert.equal(index.resourceCount, manifest.consolidated.count);

const facets = await client.facets();
assert.equal(facets.resources, index.resourceCount);
assert.ok(facets.providers.some((item) => item.value === "uiverse"));
assert.ok(facets.providers.some((item) => item.value === "spinkit"));

const loaders = await client.search({
  query: "loader",
  providers: "spinkit",
  limit: 50
});
assert.equal(loaders.total, 12);
assert.ok(loaders.items.some((item) => item.id === "spinkit:plane"));

const ui = await client.search({
  families: "ui",
  limit: 5
});
assert.ok(ui.total > 3000);
assert.equal(ui.items.length, 5);

const plane = await client.getResource("spinkit:plane");
assert.equal(plane?.source?.provider, "spinkit");
assert.ok(plane?.artifacts?.some((artifact) => artifact.content?.includes("sk-plane")));

const envelope = buildResourceApplyEnvelope(plane, {
  values: { size: 72, color: "#ff0066" },
  requestId: "apply-test"
});
assert.equal(envelope.protocol, "nagweb-resource-apply/1.0");
assert.equal(envelope.type, "nagweb:resource-apply");
assert.equal(envelope.resource.id, "spinkit:plane");
assert.equal(envelope.descriptor.payload.cssVariables["--sk-size"], "72px");
assert.equal(envelope.descriptor.payload.cssVariables["--sk-color"], "#ff0066");

let posted = null;
sendResourceApplyEnvelope(envelope, {
  targetOrigin: "https://nagweb.test",
  targetWindow: {
    postMessage(value, origin) {
      posted = { value, origin };
    }
  }
});
assert.equal(posted.origin, "https://nagweb.test");
assert.equal(posted.value.requestId, "apply-test");

assert.throws(
  () =>
    sendResourceApplyEnvelope(envelope, {
      targetOrigin: "*",
      targetWindow: { postMessage() {} }
    }),
  /explicit targetOrigin/
);

console.log("NagWeb Persistent Vault Client + Apply Bridge: OK");
console.log("Resources:", index.resourceCount);
console.log("Providers:", facets.providers.length);
console.log("SpinKit loader search:", loaders.total);
