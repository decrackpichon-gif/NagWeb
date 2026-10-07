import assert from "node:assert/strict";
import {
  flattenAmbientCgDownloads,
  selectAmbientCgDownload
} from "./extractors/ambientcg.mjs";
import {
  transformAmbientCgAsset,
  transformPmndrsAsset,
  transformKenneyPack
} from "./transformers.mjs";
import { parseKenneyAssetPage } from "./extractors/kenney.mjs";
import { inferEditablePropsFromTsx } from "./analyzers/tsx-editable-props.mjs";
import {
  transformLucideIcon,
  transformMagicUiComponent
} from "./light-transformers.mjs";
import { looksLikeLottie } from "./importers/lottie-local.mjs";
import { CSSSHAKE_EFFECTS } from "./extractors/csshake.mjs";
import { ANIMXYZ_NATIVE_PRESETS } from "./extractors/animxyz.mjs";
import { analyzeThreeExample } from "./extractors/threejs.mjs";
import {
  createResourceInstance,
  updateInstanceValue
} from "./runtime/instance.mjs";
import { buildInsertDescriptor } from "./runtime/insert-adapters.mjs";
import { buildStaticPreview } from "./preview/build-preview.mjs";
import { buildVaultGallery } from "./gallery/build-gallery.mjs";
import {
  auditReactResourceStatic,
  collectModuleSpecifiers,
  isPermissiveLicenseExpression,
  scanBrowserSource
} from "./audit/react-resource-audit.mjs";

const fakeAsset = {
  assetId: "Wood999",
  dataType: "Material",
  displayName: "Wood 999",
  displayCategory: "Wood",
  tags: ["wood", "test"],
  maps: ["color", "normal", "roughness"],
  previewImage: {
    "512-WEBP": "https://example.test/Wood999.webp"
  },
  downloadFolders: {
    default: {
      downloadFiletypeCategories: {
        zip: {
          downloads: [
            {
              attribute: "2K-PNG",
              downloadLink: "https://example.test/Wood999_2K-PNG.zip",
              fileName: "Wood999_2K-PNG.zip",
              fileSize: 200
            },
            {
              attribute: "1K-JPG",
              downloadLink: "https://example.test/Wood999_1K-JPG.zip",
              fileName: "Wood999_1K-JPG.zip",
              fileSize: 100
            }
          ]
        }
      }
    }
  }
};

const downloads = flattenAmbientCgDownloads(fakeAsset);
assert.equal(downloads.length, 2);

const selected = selectAmbientCgDownload(fakeAsset, {
  resolution: "1K",
  fileType: "JPG"
});
assert.equal(selected?.attribute, "1K-JPG");

const resource = transformAmbientCgAsset(fakeAsset);
assert.equal(resource.id, "ambientcg:Wood999");
assert.equal(resource.kind, "pbr-material");
assert.equal(resource.license.id, "CC0");
assert.equal(resource.runtime.entryArtifactId, "download-2");
assert.ok(resource.editableProps.some((prop) => prop.id === "roughness"));

const fakePmndrs = {
  type: "models",
  slug: "test-car",
  info: {
    name: "Test Car",
    creator: "tester",
    license: 1,
    category: "vehicles"
  },
  files: [
    {
      path: "files/models/test-car/info.json",
      relativePath: "info.json",
      url: "https://example.test/info.json",
      sha: "aaa",
      size: 100
    },
    {
      path: "files/models/test-car/model.gltf",
      relativePath: "model.gltf",
      url: "https://example.test/model.gltf",
      sha: "bbb",
      size: 1000
    },
    {
      path: "files/models/test-car/texture.png",
      relativePath: "texture.png",
      url: "https://example.test/texture.png",
      sha: "ccc",
      size: 500
    },
    {
      path: "files/models/test-car/thumbnail.png",
      relativePath: "thumbnail.png",
      url: "https://example.test/thumbnail.png",
      sha: "ddd",
      size: 200
    }
  ]
};

const pmndrsResource = transformPmndrsAsset(fakePmndrs);
assert.equal(pmndrsResource.id, "pmndrs:models:test-car");
assert.equal(pmndrsResource.kind, "model-3d");
assert.equal(pmndrsResource.license.id, "CC0");
assert.equal(pmndrsResource.artifacts.length, 3);
assert.ok(pmndrsResource.runtime.entryArtifactId);


const fakeKenneyHtml = `
<html>
<head>
<meta property="og:image" content="/media/pages/assets/test-pack/preview.png">
</head>
<body>
<h1>Test Pack</h1>
<div>Category</div>
<div><a>3D</a> • <a>Modular</a></div>
<div>Files</div><div>40×</div>
<div>License</div><div>Creative Commons CC0</div>
<a href="/assets?t=space">space</a>
<a href="/assets?t=modular">modular</a>
<a href="/media/pages/assets/test-pack/hash/kenney_test-pack_1.0.zip">Download</a>
</body>
</html>
`;

const kenneyPack = parseKenneyAssetPage("test-pack", fakeKenneyHtml);
assert.equal(kenneyPack.title, "Test Pack");
assert.equal(kenneyPack.verifiedCc0, true);
assert.equal(kenneyPack.categoryRoot, "3D");
assert.equal(kenneyPack.fileCount, 40);
assert.ok(kenneyPack.downloadUrl.endsWith(".zip"));

const kenneyResource = transformKenneyPack(kenneyPack);
assert.equal(kenneyResource.id, "kenney:test-pack");
assert.equal(kenneyResource.kind, "asset-pack");
assert.equal(kenneyResource.license.id, "CC0");
assert.equal(kenneyResource.ingestion.status, "validated");

const inferred = inferEditablePropsFromTsx(`
interface DemoProps {
  color?: string;
  speed?: number;
  enabled?: boolean;
  mode?: "soft" | "hard";
  children?: React.ReactNode;
}
export function Demo({
  color = "#ff0000",
  speed = 1,
  enabled = true,
  mode = "soft",
  children
}: DemoProps) {
  return null;
}
`);

assert.ok(inferred.some((prop) => prop.id === "color" && prop.control === "color"));
assert.ok(inferred.some((prop) => prop.id === "speed" && prop.control === "slider"));
assert.ok(inferred.some((prop) => prop.id === "enabled" && prop.control === "toggle"));
assert.ok(inferred.some((prop) => prop.id === "mode" && prop.control === "select"));

const lucideResource = transformLucideIcon({
  commit: "abc123",
  item: {
    name: "test-icon",
    meta: { tags: ["test"], categories: ["demo"], contributors: ["nagweb"] },
    svg: "<svg viewBox=\"0 0 24 24\"><path d=\"M0 0\" /></svg>",
    svgSha: "svgsha",
    metaSha: "metasha"
  }
});
assert.equal(lucideResource.kind, "icon");
assert.equal(lucideResource.license.id, "ISC");
assert.equal(lucideResource.artifacts[0].content.includes("<svg"), true);

const magicResource = transformMagicUiComponent({
  registry: {
    repository: "https://github.com/magicuidesign/magicui",
    commit: "abc123"
  },
  item: {
    raw: {
      name: "demo-card",
      title: "Demo Card",
      description: "Demo",
      type: "registry:ui",
      dependencies: ["motion"],
      files: [{ path: "registry/magicui/demo-card.tsx" }]
    },
    files: [{
      path: "registry/magicui/demo-card.tsx",
      sourcePath: "apps/www/registry/magicui/demo-card.tsx",
      sourceUrl: "https://example.test/demo-card.tsx",
      content: `
interface DemoCardProps {
  color?: string;
  speed?: number;
}
export function DemoCard({ color = "#ffffff", speed = 1 }: DemoCardProps) {
  return null;
}
`
    }]
  }
});
assert.equal(magicResource.license.id, "MIT");
assert.ok(magicResource.editableProps.some((prop) => prop.id === "color"));

assert.equal(
  looksLikeLottie({ v: "5.12.0", fr: 60, ip: 0, op: 120, layers: [] }),
  true
);
assert.equal(looksLikeLottie({ hello: "world" }), false);

assert.ok(ANIMXYZ_NATIVE_PRESETS.length >= 25);
assert.ok(ANIMXYZ_NATIVE_PRESETS.some((preset) => preset.name === "fade"));
assert.ok(ANIMXYZ_NATIVE_PRESETS.some((preset) => preset.name === "flip-left"));

const codeOnlyScene = analyzeThreeExample(`
<html><body><script type="module">
import * as THREE from "three";
const scene = new THREE.Scene();
const mesh = new THREE.Mesh(
  new THREE.BoxGeometry(),
  new THREE.MeshBasicMaterial({ color: 0xff0000 })
);
scene.add(mesh);
</script></body></html>
`);
assert.equal(codeOnlyScene.codeOnly, true);

const textureScene = analyzeThreeExample(`
<html><body><script type="module">
import * as THREE from "three";
new THREE.TextureLoader().load("textures/grid.jpg");
</script></body></html>
`);
assert.equal(textureScene.codeOnly, false);

const iconInstance = createResourceInstance(lucideResource, {
  instanceId: "test-instance"
});
assert.equal(iconInstance.values.size, 24);
const largerIcon = updateInstanceValue(
  lucideResource,
  iconInstance,
  "size",
  64
);
assert.equal(largerIcon.values.size, 64);

const iconDescriptor = buildInsertDescriptor(lucideResource, {
  instanceId: "test-icon"
});
assert.equal(iconDescriptor.kind, "svg");
assert.ok(iconDescriptor.payload.svg.includes("<svg"));

const iconPreview = buildStaticPreview(lucideResource);
assert.equal(iconPreview.supported, true);
assert.ok(iconPreview.html.includes("<!doctype html>"));

const motionResource = {
  schemaVersion: "1.0",
  id: "test:motion",
  slug: "test-motion",
  name: "test-motion",
  title: "Test Motion",
  family: "animation",
  kind: "motion-preset",
  source: { provider: "test", externalId: "motion", fetchedAt: new Date().toISOString() },
  license: {
    id: "MIT",
    commercialUse: true,
    modificationAllowed: true,
    attributionRequired: true,
    verified: true
  },
  taxonomy: { categories: [], tags: [] },
  previews: [],
  artifacts: [{
    id: "preset",
    role: "animation-data",
    format: "json",
    content: JSON.stringify({
      duration: 0.5,
      ease: "ease",
      tracks: [{ property: "rotateY", from: -30, to: 0 }]
    })
  }],
  runtime: {
    type: "none",
    renderer: "nagweb-motion-native",
    entryArtifactId: "preset"
  },
  editableProps: [],
  ingestion: {
    extractor: "test",
    extractorVersion: "1",
    fetchedAt: new Date().toISOString(),
    transformedAt: new Date().toISOString(),
    status: "validated"
  }
};
assert.equal(buildInsertDescriptor(motionResource).kind, "motion-preset");
assert.equal(buildStaticPreview(motionResource).supported, true);

assert.equal(CSSSHAKE_EFFECTS.length, 10);
assert.ok(CSSSHAKE_EFFECTS.some((effect) => effect.name === "shake-crazy"));

const safeReactResource = {
  ...magicResource,
  id: "test:safe-react",
  artifacts: [{
    id: "component-1",
    role: "component",
    targetPath: "components/demo.tsx",
    content: `
import React from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

export function Demo({ children = "Preview", speed = 1 }: {
  children?: React.ReactNode
  speed?: number
}) {
  return <motion.div className={cn("p-4")} animate={{ opacity: 1 }}>{children}</motion.div>
}
`
  }],
  runtime: {
    type: "react",
    renderer: "nagweb-react",
    dependencies: [{ name: "motion" }],
    registryDependencies: []
  }
};

const safeReactAudit = auditReactResourceStatic(safeReactResource);
assert.equal(safeReactAudit.eligibleForBundle, true);
assert.ok(safeReactAudit.npmPackages.includes("react"));
assert.ok(safeReactAudit.npmPackages.includes("motion"));
assert.ok(safeReactAudit.virtualImports.includes("@/lib/utils"));

const unsafeReactResource = {
  ...safeReactResource,
  id: "test:unsafe-react",
  artifacts: [{
    ...safeReactResource.artifacts[0],
    content: `
import React from "react"
export function Demo(){ fetch("https://example.test"); return <div /> }
`
  }]
};
const unsafeReactAudit = auditReactResourceStatic(unsafeReactResource);
assert.equal(unsafeReactAudit.eligibleForBundle, false);
assert.ok(unsafeReactAudit.securityFindings.includes("network-fetch"));

assert.deepEqual(
  collectModuleSpecifiers('import React from "react"; import { motion } from "motion/react"'),
  ["react", "motion/react"]
);
assert.ok(scanBrowserSource('window.open("https://example.test")').includes("browser-window-open"));
assert.equal(isPermissiveLicenseExpression("MIT OR Apache-2.0"), true);
assert.equal(isPermissiveLicenseExpression("GPL-3.0"), false);

const exportListResource = {
  ...safeReactResource,
  artifacts: [{
    id: "component-1",
    role: "component",
    targetPath: "components/accordion.tsx",
    content: `
import React from "react"
function Accordion({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}
function AccordionItem({ value, children }: {
  value: string
  children: React.ReactNode
}) {
  return <div data-value={value}>{children}</div>
}
export { Accordion, AccordionItem }
`
  }]
};
const exportListAudit = auditReactResourceStatic(exportListResource);
assert.equal(exportListAudit.exportedComponent?.name, "Accordion");
assert.equal(exportListAudit.eligibleForBundle, true);

console.log("NagWeb Resource ETL self-test: OK");
