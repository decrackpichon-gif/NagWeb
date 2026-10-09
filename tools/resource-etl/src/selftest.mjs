import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
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
import {
  inferEditablePropsFromTsx,
  inferCvaEditableProps
} from "./analyzers/tsx-editable-props.mjs";
import {
  transformLucideIcon,
  transformMagicUiComponent,
  transformSpinKitLoader,
  transformMagicCssEffect
} from "./light-transformers.mjs";
import { looksLikeLottie } from "./importers/lottie-local.mjs";
import { CSSSHAKE_EFFECTS } from "./extractors/csshake.mjs";
import { ANIMXYZ_NATIVE_PRESETS } from "./extractors/animxyz.mjs";
import { analyzeThreeExample } from "./extractors/threejs.mjs";
import {
  createResourceInstance,
  updateInstanceValue,
  defaultEditableValues
} from "./runtime/instance.mjs";
import { buildInsertDescriptor } from "./runtime/insert-adapters.mjs";
import { describeCssEditableControls, describeEditableControls } from "./runtime/editable-controls.mjs";
import {
  NAGWEB_RESOURCE_APPLY_PROTOCOL,
  NAGWEB_RESOURCE_APPLY_RESULT_TYPE,
  buildResourceApplyEnvelope,
  buildResourceApplyResult,
  isResourceApplyResult,
  isMatchingResourceApplyResult,
  installResourceApplyHost
} from "./runtime/resource-apply-bridge.mjs";
import { buildStaticPreview } from "./preview/build-preview.mjs";
import { buildLottieBrowserPreview } from "./preview/lottie-browser-preview.mjs";
import { buildCssShakeBrowserPreview } from "./preview/csshake-browser-preview.mjs";
import { buildMagicCssBrowserPreview } from "./preview/magiccss-browser-preview.mjs";
import { buildVaultGallery } from "./gallery/build-gallery.mjs";
import { buildReactPreviewRecipe } from "./preview/recipes.mjs";
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

const cvaProps = inferCvaEditableProps(`
const buttonVariants = cva("base", {
  variants: {
    variant: {
      default: "bg-black",
      outline: "border",
      ghost: "bg-transparent",
    },
    size: {
      default: "h-9",
      sm: "h-8",
      lg: "h-10",
    },
    disabled: {
      true: "opacity-50",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "sm",
    disabled: false,
  },
})
`);
assert.equal(cvaProps.find((prop) => prop.id === "variant")?.control, "select");
assert.equal(cvaProps.find((prop) => prop.id === "variant")?.defaultValue, "default");
assert.equal(cvaProps.find((prop) => prop.id === "size")?.defaultValue, "sm");
assert.equal(cvaProps.find((prop) => prop.id === "disabled")?.control, "toggle");

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
assert.deepEqual(
  scanBrowserSource('<style dangerouslySetInnerHTML={{ __html: css }} />'),
  []
);
assert.ok(
  scanBrowserSource('<div dangerouslySetInnerHTML={{ __html: html }} />')
    .includes("dangerous-html")
);
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

const shadcnAccordionRecipe = buildReactPreviewRecipe(
  {
    id: "shadcn:accordion",
    name: "accordion",
    title: "Accordion",
    source: { provider: "shadcn" }
  },
  {
    primaryExport: "Accordion",
    defaultProps: {}
  }
);
assert.equal(shadcnAccordionRecipe.name, "Accordion");
assert.equal(shadcnAccordionRecipe.children[0].name, "AccordionItem");
assert.equal(
  shadcnAccordionRecipe.children[0].children[0].name,
  "AccordionTrigger"
);

const shadcnChartRecipe = buildReactPreviewRecipe(
  {
    id: "shadcn:chart",
    name: "chart",
    title: "Chart",
    source: { provider: "shadcn" }
  },
  {
    primaryExport: "ChartContainer",
    defaultProps: {}
  }
);
assert.equal(shadcnChartRecipe.name, "ChartContainer");
assert.equal(shadcnChartRecipe.children[0].tag, "svg");
assert.equal(shadcnChartRecipe.props.config.visitors.color, "#2563eb");

const genericPreviewRecipe = buildReactPreviewRecipe(
  {
    id: "demo:card",
    name: "card",
    title: "Demo Card",
    description: "Demo",
    source: { provider: "demo" }
  },
  {
    primaryExport: "Card",
    defaultProps: { children: "Contenido" }
  }
);
assert.equal(genericPreviewRecipe.name, "Card");
assert.deepEqual(genericPreviewRecipe.children, ["Contenido"]);

console.log("NagWeb Resource ETL self-test: OK");


const applyEnvelope = buildResourceApplyEnvelope(lucideResource, {
  requestId: "test-apply-request"
});
assert.equal(applyEnvelope.requestId, "test-apply-request");
assert.equal(applyEnvelope.resource.id, lucideResource.id);

const applyResult = buildResourceApplyResult(applyEnvelope, {
  status: "applied",
  message: "Inserted"
});
assert.equal(applyResult.protocol, NAGWEB_RESOURCE_APPLY_PROTOCOL);
assert.equal(applyResult.type, NAGWEB_RESOURCE_APPLY_RESULT_TYPE);
assert.equal(applyResult.requestId, "test-apply-request");
assert.equal(applyResult.status, "applied");
assert.equal(isResourceApplyResult(applyResult), true);
assert.equal(isMatchingResourceApplyResult(applyResult, {
  requestId: "test-apply-request",
  resourceId: lucideResource.id
}), true);
assert.equal(isMatchingResourceApplyResult(applyResult, {
  requestId: "another-request",
  resourceId: lucideResource.id
}), false);
assert.equal(isMatchingResourceApplyResult(applyResult, {
  requestId: "test-apply-request",
  resourceId: "another-resource"
}), false);
assert.equal(isMatchingResourceApplyResult({
  ...applyResult,
  resourceId: null
}, {
  requestId: "test-apply-request",
  resourceId: lucideResource.id
}), false);
assert.equal(
  isResourceApplyResult({ ...applyResult, requestId: null }),
  false
);

let applyHostListener;
const hostWindow = {
  addEventListener(type, listener) {
    assert.equal(type, "message");
    applyHostListener = listener;
  },
  removeEventListener(type, listener) {
    assert.equal(type, "message");
    assert.equal(listener, applyHostListener);
    applyHostListener = null;
  }
};
const reply = { payload: null, origin: null };
const event = {
  origin: "https://nagweb.example",
  data: applyEnvelope,
  source: {
    postMessage(payload, origin) {
      reply.payload = payload;
      reply.origin = origin;
    }
  }
};
const stopUnconfirmedHost = installResourceApplyHost({
  windowRef: hostWindow,
  allowedOrigins: ["https://nagweb.example"],
  onApply: async () => undefined
});
await applyHostListener(event);
assert.equal(reply.origin, "https://nagweb.example");
assert.equal(reply.payload.status, "error");
assert.match(reply.payload.message, /confirmación válida/);
stopUnconfirmedHost();
assert.equal(applyHostListener, null);

const stopConfirmedHost = installResourceApplyHost({
  windowRef: hostWindow,
  allowedOrigins: ["https://nagweb.example"],
  onApply: async () => ({ status: "applied", message: "Recurso insertado." })
});
await applyHostListener(event);
assert.equal(reply.payload.status, "applied");
assert.equal(reply.payload.message, "Recurso insertado.");
stopConfirmedHost();
assert.throws(
  () =>
    buildResourceApplyEnvelope({
      ...lucideResource,
      license: { ...lucideResource.license, verified: false }
    }),
  /license is not verified/
);
assert.throws(
  () =>
    buildResourceApplyEnvelope({
      ...lucideResource,
      runtime: { renderer: "nagweb-unhandled-renderer" }
    }),
  /no NagWeb insert adapter/
);

const coloredSvgEnvelope = buildResourceApplyEnvelope(lucideResource, {
  requestId: "test-custom-svg-color",
  values: { stroke: "#e34b76" }
});
assert.equal(coloredSvgEnvelope.descriptor.kind, "svg");
assert.equal(coloredSvgEnvelope.descriptor.payload.stroke, "#e34b76");
assert.equal(coloredSvgEnvelope.descriptor.instance.values.stroke, "#e34b76");
assert.equal(applyEnvelope.descriptor.payload.stroke, "#000000");

const sizedSvgEnvelope = buildResourceApplyEnvelope(lucideResource, {
  requestId: "test-custom-svg-size",
  values: { size: 128, stroke: "#e34b76" }
});
assert.equal(sizedSvgEnvelope.descriptor.kind, "svg");
assert.equal(sizedSvgEnvelope.descriptor.payload.size, 128);
assert.equal(sizedSvgEnvelope.descriptor.instance.values.size, 128);
assert.equal(sizedSvgEnvelope.descriptor.payload.stroke, "#e34b76");
assert.equal(applyEnvelope.descriptor.payload.size, 24);

const weightedSvgEnvelope = buildResourceApplyEnvelope(lucideResource, {
  requestId: "test-custom-svg-stroke-width",
  values: { size: 128, stroke: "#e34b76", strokeWidth: 3.5 }
});
assert.equal(weightedSvgEnvelope.descriptor.kind, "svg");
assert.equal(weightedSvgEnvelope.descriptor.payload.size, 128);
assert.equal(weightedSvgEnvelope.descriptor.payload.stroke, "#e34b76");
assert.equal(weightedSvgEnvelope.descriptor.payload.strokeWidth, 3.5);
assert.equal(weightedSvgEnvelope.descriptor.instance.values.strokeWidth, 3.5);
assert.equal(applyEnvelope.descriptor.payload.strokeWidth, 2);

const restoredSvgValues = defaultEditableValues(lucideResource);
const restoredSvgEnvelope = buildResourceApplyEnvelope(lucideResource, {
  requestId: "test-restore-svg-defaults",
  values: restoredSvgValues
});
assert.equal(restoredSvgEnvelope.descriptor.payload.size, 24);
assert.equal(restoredSvgEnvelope.descriptor.payload.stroke, "#000000");
assert.equal(restoredSvgEnvelope.descriptor.payload.strokeWidth, 2);
restoredSvgValues.size = 128;
assert.equal(defaultEditableValues(lucideResource).size, 24);

const editableSpinKit = transformSpinKitLoader({
  raw: {
    css: ":root{--sk-color:#333;} .sk-test{background:var(--sk-color)}",
    repository: "https://github.com/tobiasahlin/SpinKit",
    commit: "test-sha",
    packageJson: { version: "1.0.0" }
  },
  item: { name: "test-loader", title: "Test Loader", html: '<div class="sk-test"></div>' }
});
const coloredSpinKitEnvelope = buildResourceApplyEnvelope(editableSpinKit, {
  requestId: "test-custom-css-color",
  values: { color: "#ee4488" }
});
assert.equal(coloredSpinKitEnvelope.descriptor.kind, "html");
assert.equal(coloredSpinKitEnvelope.descriptor.instance.values.color, "#ee4488");
assert.equal(coloredSpinKitEnvelope.descriptor.payload.cssVariables["--sk-color"], "#ee4488");
assert.equal(
  buildResourceApplyEnvelope(editableSpinKit).descriptor.payload.cssVariables["--sk-color"],
  "#333333"
);

const resizedSpinKitEnvelope = buildResourceApplyEnvelope(editableSpinKit, {
  requestId: "test-custom-css-loader-size",
  values: { size: 112, color: "#ee4488" }
});
assert.equal(resizedSpinKitEnvelope.descriptor.kind, "html");
assert.equal(resizedSpinKitEnvelope.descriptor.instance.values.size, 112);
assert.equal(resizedSpinKitEnvelope.descriptor.payload.cssVariables["--sk-size"], "112px");
assert.equal(resizedSpinKitEnvelope.descriptor.payload.cssVariables["--sk-color"], "#ee4488");
assert.equal(
  buildResourceApplyEnvelope(editableSpinKit).descriptor.payload.cssVariables["--sk-size"],
  "40px"
);

const restoredSpinKitValues = defaultEditableValues(editableSpinKit);
const restoredSpinKitEnvelope = buildResourceApplyEnvelope(editableSpinKit, {
  requestId: "test-reset-css-loader",
  values: restoredSpinKitValues
});
assert.equal(restoredSpinKitEnvelope.descriptor.payload.cssVariables["--sk-size"], "40px");
assert.equal(restoredSpinKitEnvelope.descriptor.payload.cssVariables["--sk-color"], "#333333");
restoredSpinKitValues.size = 112;
restoredSpinKitValues.color = "#ee4488";
assert.deepEqual(defaultEditableValues(editableSpinKit), {
  size: 40,
  color: "#333333"
});

const generatedSpinKitControls = describeCssEditableControls(editableSpinKit);
assert.deepEqual(generatedSpinKitControls.map((item) => [item.id, item.kind]), [
  ["size", "range"],
  ["color", "color"]
]);
assert.equal(generatedSpinKitControls[0].min, 8);
assert.equal(generatedSpinKitControls[0].max, 240);
assert.equal(generatedSpinKitControls[0].unit, "px");
assert.equal(generatedSpinKitControls[1].defaultValue, "#333333");

const extendedCssControls = describeCssEditableControls({
  ...editableSpinKit,
  editableProps: [
    ...editableSpinKit.editableProps,
    { id: "opacity", label: "Opacidad", valueType: "number", defaultValue: 0.5,
      binding: { type: "css-variable", variable: "--sk-opacity" },
      constraints: { min: 0, max: 1, step: 0.1 } },
    { id: "invalid-color", valueType: "color", defaultValue: "javascript:alert(1)",
      binding: { type: "css-variable", variable: "--sk-unsafe" } },
    { id: "runtime-value", valueType: "number", defaultValue: 1,
      binding: { type: "runtime", path: "speed" },
      constraints: { min: 0, max: 2, step: 0.1 } }
  ]
});
assert.deepEqual(extendedCssControls.map((item) => item.id), [
  "size", "color", "opacity"
]);
assert.deepEqual(describeCssEditableControls(lucideResource), []);

const generatedSvgControls = describeEditableControls(lucideResource);
assert.deepEqual(generatedSvgControls.map((item) => [item.id, item.kind]), [
  ["size", "range"],
  ["stroke", "color"],
  ["strokeWidth", "range"]
]);
assert.equal(generatedSvgControls[0].min, 4);
assert.equal(generatedSvgControls[0].max, 512);
assert.equal(generatedSvgControls[0].unit, "px");
assert.equal(generatedSvgControls[1].defaultValue, "#000000");
assert.equal(generatedSvgControls[2].step, 0.25);
assert.deepEqual(
  describeEditableControls(editableSpinKit).map((item) => item.id),
  ["size", "color"]
);
assert.deepEqual(
  describeEditableControls({
    ...lucideResource,
    editableProps: [
      ...lucideResource.editableProps,
      { id: "unsafe", valueType: "color", defaultValue: "#ffffff",
        binding: { type: "runtime", path: "svg.unsafe" } }
    ]
  }).map((item) => item.id),
  ["size", "stroke", "strokeWidth"]
);

const lottieEditableResource = {
  ...editableSpinKit,
  id: "lottie:control-test",
  runtime: { renderer: "dotlottie-web", entryArtifactId: "animation" },
  artifacts: [{
    id: "animation",
    role: "animation-data",
    content: '{"v":"5.0","fr":30,"ip":0,"op":12,"layers":[]}'
  }],
  editableProps: [
    { id: "speed", label: "Velocidad", valueType: "number", defaultValue: 1,
      binding: { type: "runtime", path: "lottie.speed" },
      constraints: { min: 0.1, max: 4, step: 0.1 } },
    { id: "loop", label: "Repetir", valueType: "boolean", defaultValue: true,
      binding: { type: "runtime", path: "lottie.loop" } },
    { id: "autoplay", label: "Inicio automático", valueType: "boolean", defaultValue: true,
      binding: { type: "runtime", path: "lottie.autoplay" } },
    { id: "unsafe", label: "No admitido", valueType: "boolean", defaultValue: true,
      binding: { type: "runtime", path: "other.autoplay" } }
  ]
};
assert.deepEqual(describeEditableControls(lottieEditableResource).map((item) => [item.id, item.kind]), [
  ["speed", "range"], ["loop", "toggle"], ["autoplay", "toggle"]
]);
const editedLottieEnvelope = buildResourceApplyEnvelope(lottieEditableResource, {
  values: { speed: 2, loop: false, autoplay: false }
});
assert.equal(editedLottieEnvelope.descriptor.kind, "lottie");
assert.equal(editedLottieEnvelope.descriptor.payload.speed, 2);
assert.equal(editedLottieEnvelope.descriptor.payload.loop, false);
assert.equal(editedLottieEnvelope.descriptor.payload.autoplay, false);

const shakeEditableResource = {
  ...editableSpinKit,
  id: "csshake:control-test",
  runtime: { renderer: "nagweb-css-class-effect", entryArtifactId: "effect" },
  artifacts: [{ id: "effect", role: "animation-data", content: '{"className":"shake"}' }],
  editableProps: [
    { id: "trigger", label: "Activación", valueType: "enum", defaultValue: "hover",
      binding: { type: "runtime", path: "cssEffect.trigger" },
      constraints: { options: [
        { label: "Hover", value: "hover" },
        { label: "Siempre", value: "constant" }
      ] } },
    { id: "wrong", valueType: "enum", defaultValue: "hover",
      binding: { type: "runtime", path: "cssEffect.bad" },
      constraints: { options: [{ value: "hover" }] } }
  ]
};
const shakeControls = describeEditableControls(shakeEditableResource);
assert.deepEqual(shakeControls.map((x) => [x.id, x.kind]), [["trigger", "select"]]);
assert.deepEqual(shakeControls[0].options.map((x) => x.value), ["hover", "constant"]);
assert.equal(buildResourceApplyEnvelope(shakeEditableResource, {
  values: { trigger: "constant" }
}).descriptor.payload.trigger, "constant");
assert.deepEqual(describeEditableControls({
  ...shakeEditableResource,
  editableProps: [{ ...shakeEditableResource.editableProps[0],
    defaultValue: "<svg>" }]
}), []);

const playerUrl = "https://nagweb.example/resource-browser/vendor/lottie_light.min.js";
const lottiePreviewDocument = buildLottieBrowserPreview(lottieEditableResource, {
  speed: 2.5, loop: false, autoplay: false
}, { playerUrl });
assert.match(lottiePreviewDocument, /lottie\.loadAnimation/);
assert.match(lottiePreviewDocument, /setSpeed\(2\.5\)/);
assert.match(lottiePreviewDocument, /loop: false/);
assert.match(lottiePreviewDocument, /autoplay: false/);
assert.match(lottiePreviewDocument, /Content-Security-Policy/);
assert.match(lottiePreviewDocument, /connect-src 'none'/);
assert.match(lottiePreviewDocument, /lottie_light\.min\.js/);
assert.match(lottiePreviewDocument, /id="seek" min="0" max="100"/);
assert.match(lottiePreviewDocument, /id="restart">Reiniciar/);
assert.match(lottiePreviewDocument, /id="previous" aria-label="Retroceder un fotograma"/);
assert.match(lottiePreviewDocument, /id="next" aria-label="Avanzar un fotograma"/);
assert.match(lottiePreviewDocument, /id="frame" aria-live="off"/);
assert.match(lottiePreviewDocument, /id="progress" for="seek"/);
assert.equal(buildLottieBrowserPreview(lottieEditableResource, {}, {
  playerUrl: "javascript:alert(1)"
}), null);
assert.equal(buildLottieBrowserPreview({
  ...lottieEditableResource,
  artifacts: [{ role: "animation-data", content: "not json" }]
}, {}, { playerUrl }), null);
const hostileLottie = {
  ...lottieEditableResource,
  artifacts: [{
    role: "animation-data",
    content: JSON.stringify({
      v: "5.0", fr: 30, ip: 0, op: 10,
      layers: [{ nm: "</script><script>alert(1)</script>" }]
    })
  }]
};
const sanitizedPreview = buildLottieBrowserPreview(hostileLottie, {}, { playerUrl });
assert.ok(sanitizedPreview);
assert.equal(sanitizedPreview.includes("</script><script>alert(1)</script>"), false);
assert.match(sanitizedPreview, /\\u003c\/script>/);

const shakePreviewResource = {
  ...shakeEditableResource,
  source: { ...shakeEditableResource.source, provider: "csshake" },
  title: "Prueba <Shake>",
  artifacts: [{
    id: "effect", role: "animation-data",
    content: JSON.stringify({
      className: "shake-hard",
      trigger: "hover",
      previewClassNames: ["shake-hard", "shake-constant"]
    })
  }]
};
const shakeCss = ".shake-hard:hover{animation-name:shake-hard}.shake-hard.shake-constant{animation-name:shake-hard}";
const hoverShakeDoc = buildCssShakeBrowserPreview(shakePreviewResource,
  { trigger: "hover" }, { stylesheet: shakeCss });
assert.ok(hoverShakeDoc);
assert.match(hoverShakeDoc, /class="demo shake-hard"/);
assert.match(hoverShakeDoc, /class="demo shake-hard shake-constant"/);
assert.match(hoverShakeDoc, /class="mode selected" aria-label="Modo Hover"/);
assert.match(hoverShakeDoc, /class="mode " aria-label="Modo Siempre"/);
assert.equal((hoverShakeDoc.match(/<span class="tag">Elegido para insertar<\/span>/g) || []).length, 1);
assert.match(hoverShakeDoc, /<script nonce="nagweb-cssshake-preview-v1">/);
assert.match(hoverShakeDoc, /prefers-reduced-motion:reduce/);
assert.match(hoverShakeDoc, /Pasá el cursor/);
assert.match(hoverShakeDoc, /Prueba &lt;Shake&gt;/);
assert.match(hoverShakeDoc, /script-src 'nonce-nagweb-cssshake-preview-v1'/);

const constantShakeDoc = buildCssShakeBrowserPreview(shakePreviewResource,
  { trigger: "constant" }, { stylesheet: shakeCss });
assert.match(constantShakeDoc, /class="demo shake-hard shake-constant"/);
assert.match(constantShakeDoc, /class="demo shake-hard"/);
assert.match(constantShakeDoc, /class="mode selected" aria-label="Modo Siempre"/);
assert.match(constantShakeDoc, /class="mode " aria-label="Modo Hover"/);
assert.equal((constantShakeDoc.match(/<span class="tag">Elegido para insertar<\/span>/g) || []).length, 1);
assert.match(constantShakeDoc, /Reproducción continua/);
assert.equal(buildCssShakeBrowserPreview(shakePreviewResource,
  {}, { stylesheet: "" }), null);
assert.equal(buildCssShakeBrowserPreview({
  ...shakePreviewResource,
  artifacts: [{ role: "animation-data", content: "{invalid" }]
}, {}, { stylesheet: shakeCss }), null);
assert.equal(buildCssShakeBrowserPreview({
  ...shakePreviewResource,
  artifacts: [{ role: "animation-data",
    content: '{"className":"shake-hard\" onclick=\"alert(1)"}' }]
}, {}, { stylesheet: shakeCss }), null);
const hostileCssShake = buildCssShakeBrowserPreview(shakePreviewResource,
  {}, { stylesheet: "</style><script>alert(1)</script>" });
assert.ok(hostileCssShake);
assert.equal(hostileCssShake.includes("</style><script>alert(1)</script>"), false);

const magicCssResource = transformMagicCssEffect({
  raw: {
    baseCss: ".magictime{animation-duration:1s}",
    repository: "https://github.com/miniMAC/magic",
    commit: "test-sha",
    packageJson: { version: "1.0.0" }
  },
  item: {
    name: "puffIn", category: "entrance", path: "effects/puffIn.css",
    code: ".puffIn{animation-name:fadeIn}"
  }
});
assert.deepEqual(describeEditableControls(magicCssResource).map(
  (item) => [item.id, item.kind]
), [
  ["duration", "range"], ["delay", "range"],
  ["easing", "select"], ["iterations", "range"]
]);
const magicValues = {
  duration: 2.5, delay: 0.6, easing: "ease-out", iterations: 3
};
const magicPreview = buildMagicCssBrowserPreview(magicCssResource, magicValues);
assert.ok(magicPreview);
assert.match(magicPreview, /class="demo magictime puffIn"/);
assert.match(magicPreview, /animation-duration:2\.5s!important/);
assert.match(magicPreview, /animation-delay:0\.6s!important/);
assert.match(magicPreview, /animation-timing-function:ease-out!important/);
assert.match(magicPreview, /animation-iteration-count:3!important/);
assert.match(magicPreview, /prefers-reduced-motion:reduce/);
assert.match(magicPreview, /script-src 'nonce-nagweb-magic-preview-v1'/);
assert.match(magicPreview, /connect-src 'none'/);
assert.match(magicPreview, /<script nonce="nagweb-magic-preview-v1">/);
const appliedMagicCss = buildResourceApplyEnvelope(magicCssResource, {
  values: magicValues
}).descriptor;
assert.equal(appliedMagicCss.kind, "css-inline-effect");
assert.equal(appliedMagicCss.payload.duration, 2.5);
assert.equal(appliedMagicCss.payload.delay, 0.6);
assert.equal(appliedMagicCss.payload.easing, "ease-out");
assert.equal(appliedMagicCss.payload.iterations, 3);
const resetMagic = defaultEditableValues(magicCssResource);
assert.equal(resetMagic.duration, 1);
assert.equal(resetMagic.delay, 0);
assert.equal(resetMagic.easing, "ease");
assert.equal(resetMagic.iterations, 1);
assert.equal(buildMagicCssBrowserPreview({
  ...magicCssResource, source: { provider: "untrusted" }
}, magicValues), null);
const escapedMagic = buildMagicCssBrowserPreview({
  ...magicCssResource,
  artifacts: magicCssResource.artifacts.map((artifact) =>
    artifact.role === "stylesheet"
      ? { ...artifact, content: "</style><script>alert(1)</script>" }
      : artifact)
}, { duration: Infinity, easing: "unexpected" });
assert.ok(escapedMagic);
assert.equal(escapedMagic.includes("</style><script>alert(1)</script>"), false);
assert.match(escapedMagic, /animation-duration:1s!important/);
assert.match(escapedMagic, /animation-timing-function:ease!important/);

// The same script-free pause/resume control works for both CSS preview families.
for (const [family, document] of [
  ["CSSShake", hoverShakeDoc],
  ["CSSShake constant", constantShakeDoc]
]) {
  assert.match(document, /type="checkbox" aria-label="Pausar o reanudar la vista previa"/,
    family + " pause checkbox");
  assert.match(document, /for="pause-preview"/, family + " linked label");
  assert.match(document, /class="playing">Pausar/, family + " initial action");
  assert.match(document, /class="paused">Reanudar/, family + " resume action");
  assert.match(document, /\.preview-pause:checked ~ main \.demo\{animation-play-state:paused!important\}/,
    family + " stylesheet-driven pause");
  assert.match(document, /script-src 'nonce-nagweb-cssshake-preview-v1'/,
    family + " nonce-restricted script policy");
}
assert.equal(buildResourceApplyEnvelope(magicCssResource, {
  values: magicValues
}).descriptor.payload.duration, 2.5);
assert.equal(buildResourceApplyEnvelope(shakePreviewResource, {
  values: { trigger: "constant" }
}).descriptor.payload.trigger, "constant");

const liveScriptMatch = magicPreview.match(
  /<script nonce="nagweb-magic-preview-v1">([\s\S]*?)<\/script>/
);
assert.ok(liveScriptMatch);
const bridgeCalls = [];
let bridgeHandler;
const bridgeParent = {};
const fakeHint = { textContent: "" };
runInNewContext(liveScriptMatch[1], {
  window: {
    parent: bridgeParent,
    addEventListener(type, handler) {
      assert.equal(type, "message");
      bridgeHandler = handler;
    }
  },
  document: {
    querySelector(selector) {
      if (selector === ".demo.magictime") {
        return { style: { setProperty(...args) { bridgeCalls.push(args); } } };
      }
      if (selector === ".hint") return fakeHint;
      return null;
    }
  }
});
assert.equal(typeof bridgeHandler, "function");
bridgeHandler({
  source: {},
  data: {
    type: "nagweb:magic-css-preview:update",
    resourceId: magicCssResource.id,
    values: magicValues
  }
});
assert.equal(bridgeCalls.length, 0, "Ignore messages not sent by iframe parent");
bridgeHandler({
  source: bridgeParent,
  data: {
    type: "nagweb:magic-css-preview:update",
    resourceId: "another-resource",
    values: magicValues
  }
});
assert.equal(bridgeCalls.length, 0, "Ignore updates for another resource");
bridgeHandler({
  source: bridgeParent,
  data: {
    type: "nagweb:magic-css-preview:update",
    resourceId: magicCssResource.id,
    values: magicValues
  }
});
assert.deepEqual(bridgeCalls.map(([name, value]) => [name, value]), [
  ["animation-duration", "2.5s"],
  ["animation-delay", "0.6s"],
  ["animation-timing-function", "ease-out"],
  ["animation-iteration-count", "3"]
]);
assert.match(fakeHint.textContent, /Duración 2.5s/);
assert.match(fakeHint.textContent, /Repeticiones 3/);

const shakeLiveScript = hoverShakeDoc.match(
  /<script nonce="nagweb-cssshake-preview-v1">([\s\S]*?)<\/script>/
);
assert.ok(shakeLiveScript, "CSSShake includes its restricted live-selection handler");
const shakeParent = {};
let shakeMessageHandler;
const makeFakeMode = () => {
  const classes = new Set();
  const tag = { textContent: "" };
  const card = {
    classList: {
      toggle(name, active) {
        if (active) classes.add(name);
        else classes.delete(name);
      }
    },
    querySelector(selector) { return selector === ".tag" ? tag : null; }
  };
  return { card, classes, tag };
};
const hoverLiveCard = makeFakeMode();
const constantLiveCard = makeFakeMode();
const pauseCheckbox = { checked: true };
runInNewContext(shakeLiveScript[1], {
  window: {
    parent: shakeParent,
    addEventListener(type, handler) {
      assert.equal(type, "message");
      shakeMessageHandler = handler;
    }
  },
  document: {
    querySelector(selector) {
      if (selector === '.mode[aria-label="Modo Hover"]') return hoverLiveCard.card;
      if (selector === '.mode[aria-label="Modo Siempre"]') return constantLiveCard.card;
      if (selector === "#pause-preview") return pauseCheckbox;
      return null;
    }
  }
});
assert.equal(typeof shakeMessageHandler, "function");
const sendShakeUpdate = (source, resourceId, trigger) => shakeMessageHandler({
  source,
  data: {
    type: "nagweb:cssshake-preview:update",
    resourceId, trigger
  }
});
sendShakeUpdate({}, shakePreviewResource.id, "constant");
sendShakeUpdate(shakeParent, "different-resource", "constant");
sendShakeUpdate(shakeParent, shakePreviewResource.id, "unexpected");
assert.equal(hoverLiveCard.tag.textContent, "", "Ignore invalid preview messages");
assert.equal(constantLiveCard.tag.textContent, "", "Ignore invalid preview messages");
sendShakeUpdate(shakeParent, shakePreviewResource.id, "constant");
assert.equal(hoverLiveCard.classes.has("selected"), false);
assert.equal(constantLiveCard.classes.has("selected"), true);
assert.equal(hoverLiveCard.tag.textContent, "Comparación");
assert.equal(constantLiveCard.tag.textContent, "Elegido para insertar");
assert.equal(pauseCheckbox.checked, true, "Changing trigger keeps paused state");
sendShakeUpdate(shakeParent, shakePreviewResource.id, "hover");
assert.equal(hoverLiveCard.classes.has("selected"), true);
assert.equal(constantLiveCard.classes.has("selected"), false);
assert.equal(pauseCheckbox.checked, true, "Switching back still keeps paused state");

const lottieRuntimeScript = lottiePreviewDocument.split("<script>")[1]?.split("</script>")[0];
assert.ok(lottieRuntimeScript, "Lottie browser preview includes live update handler");
const lottieCalls = [];
let lottieMessageHandler;
const lottieParent = {};
const fakeUiActions = {};
const fakePlayButton = {
  textContent: "", hidden: false,
  addEventListener(type, handler) { fakeUiActions["play:" + type] = handler; }
};
const fakeRestartButton = {
  addEventListener(type, handler) { fakeUiActions["restart:" + type] = handler; }
};
const fakePreviousButton = {
  disabled: false,
  addEventListener(type, handler) { fakeUiActions["previous:" + type] = handler; }
};
const fakeNextButton = {
  disabled: false,
  addEventListener(type, handler) { fakeUiActions["next:" + type] = handler; }
};
const fakeFrameOutput = { textContent: "" };
const fakeSeekControl = {
  value: "0",
  addEventListener(type, handler) { fakeUiActions["seek:" + type] = handler; }
};
const fakeProgressOutput = { textContent: "0%" };
const fakeLottieEvents = {};
const fakeStatus = { textContent: "" };
const fakeLottieInstance = {
  isPaused: true,
  totalFrames: 12,
  currentFrame: 0,
  setSpeed(value) { lottieCalls.push(["speed", value]); },
  setLoop(value) { lottieCalls.push(["loop", value]); },
  play() { this.isPaused = false; lottieCalls.push(["play"]); },
  pause() { this.isPaused = true; lottieCalls.push(["pause"]); },
  goToAndStop(frame, isFrame) {
    this.currentFrame = frame;
    this.isPaused = true;
    lottieCalls.push(["seek", frame, isFrame]);
  },
  addEventListener(type, handler) { fakeLottieEvents[type] = handler; }
};
runInNewContext(lottieRuntimeScript, {
  window: {
    parent: lottieParent,
    lottie: {
      loadAnimation() { return fakeLottieInstance; }
    },
    addEventListener(type, handler) {
      assert.equal(type, "message");
      lottieMessageHandler = handler;
    }
  },
  document: {
    getElementById(id) {
      if (id === "status") return fakeStatus;
      if (id === "play") return fakePlayButton;
      if (id === "restart") return fakeRestartButton;
      if (id === "previous") return fakePreviousButton;
      if (id === "next") return fakeNextButton;
      if (id === "frame") return fakeFrameOutput;
      if (id === "seek") return fakeSeekControl;
      if (id === "progress") return fakeProgressOutput;
      return {};
    }
  },
  matchMedia() { return { matches: false }; }
});
assert.equal(typeof lottieMessageHandler, "function");
const sendLottie = (source, resourceId, values) => lottieMessageHandler({
  source,
  data: {
    type: "nagweb:lottie-preview:update",
    resourceId, values
  }
});
assert.deepEqual(lottieCalls, [["speed", 2.5]]);
sendLottie({}, lottieEditableResource.id,
  { speed: 3, loop: true, autoplay: false });
sendLottie(lottieParent, "wrong-resource",
  { speed: 3, loop: true, autoplay: false });
sendLottie(lottieParent, lottieEditableResource.id,
  { speed: "malicious", loop: true, autoplay: false });
assert.deepEqual(lottieCalls, [["speed", 2.5]], "Reject invalid live messages");
sendLottie(lottieParent, lottieEditableResource.id,
  { speed: 3, loop: true, autoplay: false });
assert.deepEqual(lottieCalls, [
  ["speed", 2.5], ["speed", 3], ["loop", true]
]);
assert.equal(fakeLottieInstance.isPaused, true, "Playback remains paused");
fakeLottieInstance.play();
sendLottie(lottieParent, lottieEditableResource.id,
  { speed: 4, loop: false, autoplay: false });
assert.equal(fakeLottieInstance.isPaused, false,
  "Editing speed and loop does not cancel manual playback");
sendLottie(lottieParent, lottieEditableResource.id,
  { speed: 4, loop: false, autoplay: true });
assert.equal(fakeLottieInstance.isPaused, false,
  "Enabling autoplay starts playback without reloading");
sendLottie(lottieParent, lottieEditableResource.id,
  { speed: 4, loop: false, autoplay: false });
assert.equal(fakeLottieInstance.isPaused, true,
  "Disabling autoplay pauses playback");

assert.equal(typeof fakeUiActions["seek:input"], "function");
assert.equal(typeof fakeUiActions["restart:click"], "function");
assert.equal(typeof fakeLottieEvents.enterFrame, "function");
fakeLottieInstance.currentFrame = 3;
fakeLottieEvents.enterFrame();
assert.equal(Number(fakeSeekControl.value), 25);
assert.equal(fakeProgressOutput.textContent, "25%");
fakeSeekControl.value = "75";
fakeUiActions["seek:input"]();
assert.equal(fakeLottieInstance.isPaused, true, "Scrubbing paused animation keeps it paused");
assert.equal(fakeLottieInstance.currentFrame, 9);
assert.equal(fakeProgressOutput.textContent, "75%");
assert.deepEqual(lottieCalls.at(-1), ["seek", 9, true]);
fakeLottieInstance.play();
fakeSeekControl.value = "50";
fakeUiActions["seek:input"]();
assert.equal(fakeLottieInstance.currentFrame, 6);
assert.equal(fakeLottieInstance.isPaused, false, "Scrubbing playing animation resumes playback");
fakeUiActions["restart:click"]();
assert.equal(fakeLottieInstance.currentFrame, 0);
assert.equal(fakeLottieInstance.isPaused, false, "Restart keeps playback mode");
assert.equal(fakeProgressOutput.textContent, "0%");
const scrubCallsBeforeInvalid = lottieCalls.length;
fakeSeekControl.value = "not-a-number";
fakeUiActions["seek:input"]();
assert.equal(lottieCalls.length, scrubCallsBeforeInvalid, "Invalid scrub input ignored");
fakeLottieInstance.currentFrame = 1000;
fakeLottieEvents.enterFrame();
assert.equal(fakeProgressOutput.textContent, "100%", "Progress clamps into range");

assert.equal(typeof fakeUiActions["previous:click"], "function");
assert.equal(typeof fakeUiActions["next:click"], "function");
assert.equal(typeof fakeUiActions["seek:keydown"], "function");
fakeLottieInstance.currentFrame = 4.7;
fakeLottieInstance.pause();
fakeUiActions["previous:click"]();
assert.equal(fakeLottieInstance.currentFrame, 4,
  "Previous button snaps fractional playback to previous integer frame");
assert.equal(fakeFrameOutput.textContent, "5/12 fot.");
assert.equal(fakeLottieInstance.isPaused, true, "Frame stepping pauses playback");
fakeUiActions["next:click"]();
assert.equal(fakeLottieInstance.currentFrame, 5);
assert.equal(fakeFrameOutput.textContent, "6/12 fot.");
let prevented = 0;
fakeUiActions["seek:keydown"]({
  key: "ArrowRight", preventDefault() { prevented++; }
});
assert.equal(fakeLottieInstance.currentFrame, 6);
fakeUiActions["seek:keydown"]({
  key: "ArrowLeft", preventDefault() { prevented++; }
});
assert.equal(fakeLottieInstance.currentFrame, 5);
assert.equal(prevented, 2);
fakeUiActions["seek:keydown"]({
  key: "ArrowUp", preventDefault() { prevented++; }
});
assert.equal(prevented, 2, "Other keys keep native behavior");
fakeLottieInstance.currentFrame = 0;
fakeUiActions["previous:click"]();
assert.equal(fakeLottieInstance.currentFrame, 0, "Frame stepping clamps at start");
assert.equal(fakePreviousButton.disabled, true);
fakeLottieInstance.currentFrame = 11;
fakeUiActions["next:click"]();
assert.equal(fakeLottieInstance.currentFrame, 11, "Frame stepping clamps at last frame");
assert.equal(fakeNextButton.disabled, true);
assert.equal(fakeFrameOutput.textContent, "12/12 fot.");
