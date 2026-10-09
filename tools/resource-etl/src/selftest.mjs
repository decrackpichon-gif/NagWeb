import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildPublicResourceBrowser } from "./preview/build-public-site.mjs";
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
  transformUiverseComponent,
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
import { htmlCssPropertyStyle } from "./runtime/html-css-customization.mjs";
import {
  inferUiverseCssDimensionProps,
  applyUiverseCssDimensionValues,
  isSupportedUiverseCssDimension
} from "./runtime/uiverse-dimensions.mjs";
import {
  inferUiverseCssSpacingProps,
  applyUiverseCssSpacingValues,
  isSupportedUiverseCssSpacing
} from "./runtime/uiverse-spacing.mjs";
import {
  inferUiverseCssTypeBorderProps,
  applyUiverseCssTypeBorderValues,
  isSupportedUiverseCssTypeBorder
} from "./runtime/uiverse-type-borders.mjs";
import {
  inferUiverseCssTimingProps,
  applyUiverseCssTimingValues,
  isSupportedUiverseCssTiming
} from "./runtime/uiverse-timing.mjs";
import {
  inferUiverseCssMultiTimingProps,
  applyUiverseCssMultiTimingValues,
  isSupportedUiverseCssMultiTiming
} from "./runtime/uiverse-multi-timing.mjs";
import {
  inferUiverseCssBezierProps,
  applyUiverseCssBezierValues,
  isSupportedUiverseCssBezier
} from "./runtime/uiverse-bezier.mjs";
import {
  inferUiverseCssEasingProps,
  applyUiverseCssEasingValues,
  isSupportedUiverseCssEasing
} from "./runtime/uiverse-easing.mjs";
import {
  inferUiverseCssColorProps,
  effectiveUiverseEditableProps,
  applyUiverseCssColorValues
} from "./runtime/uiverse-colors.mjs";
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
assert.match(lottiePreviewDocument, /id="seek" min="0" max="0" step="1"/);
assert.match(lottiePreviewDocument, /id="restart">Reiniciar/);
assert.match(lottiePreviewDocument, /id="previous" aria-label="Retroceder un fotograma"/);
assert.match(lottiePreviewDocument, /id="next" aria-label="Avanzar un fotograma"/);
assert.match(lottiePreviewDocument, /id="back5" aria-label="Retroceder cinco segundos"/);
assert.match(lottiePreviewDocument, /id="forward5" aria-label="Avanzar cinco segundos"/);
assert.match(lottiePreviewDocument, /id="frame" aria-live="off"/);
assert.match(lottiePreviewDocument, /id="time" aria-label="Tiempo transcurrido y duración total/);
assert.match(lottiePreviewDocument, /id="frame-jump" type="number" min="1" step="1"/);
assert.match(lottiePreviewDocument, /id="bookmarks"/);
assert.match(lottiePreviewDocument, /id="save-mark"/);
assert.match(lottiePreviewDocument, /id="mark-list"/);
assert.match(lottiePreviewDocument, /id="go-mark"/);
assert.match(lottiePreviewDocument, /id="delete-mark"/);
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
const fakeSkipBack = {
  disabled: false,
  addEventListener(type, handler) { fakeUiActions["back5:" + type] = handler; }
};
const fakeSkipForward = {
  disabled: false,
  addEventListener(type, handler) { fakeUiActions["forward5:" + type] = handler; }
};
const fakeFrameOutput = { textContent: "" };
const fakeSeekControl = {
  value: "0",
  addEventListener(type, handler) { fakeUiActions["seek:" + type] = handler; }
};
const fakeProgressOutput = { textContent: "0%" };
const fakeTimeOutput = { textContent: "0:00.00 / 0:00.00" };
const fakeFrameJump = {
  value: "1", max: "",
  addEventListener(type, handler) { fakeUiActions["frame-jump:" + type] = handler; }
};
const fakeBookmarkAction = (id) => ({
  disabled: false,
  addEventListener(type, handler) { fakeUiActions[id + ":" + type] = handler; }
});
const fakeSaveMark = fakeBookmarkAction("save-mark");
const fakeGoMark = fakeBookmarkAction("go-mark");
const fakeDeleteMark = fakeBookmarkAction("delete-mark");
const fakeMarkCount = { textContent: "" };
const fakeMarkList = {
  value: "", items: [], disabled: false,
  replaceChildren(...items) {
    this.items = items;
    this.value = items[0]?.value || "";
  },
  addEventListener(type, handler) { fakeUiActions["mark-list:" + type] = handler; }
};
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
    activeElement: null,
    getElementById(id) {
      if (id === "status") return fakeStatus;
      if (id === "play") return fakePlayButton;
      if (id === "restart") return fakeRestartButton;
      if (id === "previous") return fakePreviousButton;
      if (id === "next") return fakeNextButton;
      if (id === "back5") return fakeSkipBack;
      if (id === "forward5") return fakeSkipForward;
      if (id === "frame") return fakeFrameOutput;
      if (id === "seek") return fakeSeekControl;
      if (id === "progress") return fakeProgressOutput;
      if (id === "time") return fakeTimeOutput;
      if (id === "frame-jump") return fakeFrameJump;
      if (id === "save-mark") return fakeSaveMark;
      if (id === "go-mark") return fakeGoMark;
      if (id === "delete-mark") return fakeDeleteMark;
      if (id === "mark-count") return fakeMarkCount;
      if (id === "mark-list") return fakeMarkList;
      return {};
    },
    createElement(tag) {
      assert.equal(tag, "option");
      return { value: "", textContent: "" };
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
assert.equal(Number(fakeSeekControl.value), 3);
assert.equal(fakeSeekControl.max, "11");
assert.equal(fakeProgressOutput.textContent, "25%");
assert.equal(fakeTimeOutput.textContent, "0:00.10 / 0:00.40");
fakeSeekControl.value = "9";
fakeUiActions["seek:input"]();
assert.equal(fakeLottieInstance.isPaused, true, "Scrubbing paused animation keeps it paused");
assert.equal(fakeLottieInstance.currentFrame, 9);
assert.equal(fakeProgressOutput.textContent, "75%");
assert.equal(fakeTimeOutput.textContent, "0:00.30 / 0:00.40");
assert.deepEqual(lottieCalls.at(-1), ["seek", 9, true]);
fakeLottieInstance.play();
fakeSeekControl.value = "6";
fakeUiActions["seek:input"]();
assert.equal(fakeLottieInstance.currentFrame, 6);
assert.equal(fakeLottieInstance.isPaused, false, "Scrubbing playing animation resumes playback");
fakeUiActions["restart:click"]();
assert.equal(fakeLottieInstance.currentFrame, 0);
assert.equal(fakeLottieInstance.isPaused, false, "Restart keeps playback mode");
assert.equal(fakeProgressOutput.textContent, "0%");
assert.equal(fakeTimeOutput.textContent, "0:00.00 / 0:00.40");
const scrubCallsBeforeInvalid = lottieCalls.length;
fakeSeekControl.value = "not-a-number";
fakeUiActions["seek:input"]();
assert.equal(lottieCalls.length, scrubCallsBeforeInvalid, "Invalid scrub input ignored");
fakeLottieInstance.currentFrame = 1000;
fakeLottieEvents.enterFrame();
assert.equal(fakeProgressOutput.textContent, "100%", "Progress clamps into range");
assert.equal(fakeTimeOutput.textContent, "0:00.40 / 0:00.40");

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
assert.equal(fakeTimeOutput.textContent, "0:00.37 / 0:00.40");
// The displayed clock follows source frames, not playback speed.
sendLottie(lottieParent, lottieEditableResource.id,
  { speed: 1.5, loop: false, autoplay: false });
assert.equal(fakeTimeOutput.textContent, "0:00.37 / 0:00.40");
fakeLottieEvents.complete();
assert.equal(fakeTimeOutput.textContent, "0:00.40 / 0:00.40",
  "End event shows exact total duration");

assert.equal(typeof fakeUiActions["frame-jump:change"], "function");
assert.equal(fakeFrameJump.max, "12");
fakeFrameJump.value = "7";
fakeUiActions["frame-jump:change"]();
assert.equal(fakeLottieInstance.currentFrame, 6);
assert.equal(fakeLottieInstance.isPaused, true);
assert.equal(fakeFrameOutput.textContent, "7/12 fot.");
assert.equal(fakeTimeOutput.textContent, "0:00.20 / 0:00.40");
for (const invalid of ["", "0", "13", "2.5", "NaN", "999999999999999999999", "1e2"]) {
  const before = lottieCalls.length;
  fakeFrameJump.value = invalid;
  fakeUiActions["frame-jump:change"]();
  assert.equal(lottieCalls.length, before, "Invalid frame rejected: " + invalid);
  assert.equal(fakeFrameJump.value, "7");
}
fakeFrameJump.value = "12";
fakeUiActions["frame-jump:change"]();
assert.equal(fakeLottieInstance.currentFrame, 11);
assert.equal(fakeFrameOutput.textContent, "12/12 fot.");

const originalFrameCount = fakeLottieInstance.totalFrames;
fakeLottieInstance.totalFrames = 6000;
fakeLottieInstance.currentFrame = 1234;
fakeLottieEvents.enterFrame();
assert.equal(fakeSeekControl.max, "5999", "Range tracks all frames in long animations");
assert.equal(fakeSeekControl.value, "1234", "Range uses exact source-frame index");
fakeSeekControl.value = "4321";
fakeUiActions["seek:input"]();
assert.equal(fakeLottieInstance.currentFrame, 4321,
  "Long animation seeks exact frame, with no 0.1-percent rounding");
assert.equal(fakeFrameOutput.textContent, "4322/6000 fot.");
assert.equal(fakeLottieInstance.isPaused, true);
fakeUiActions["seek:keydown"]({
  key: "ArrowRight", preventDefault() {}
});
assert.equal(fakeLottieInstance.currentFrame, 4322,
  "Arrow navigation remains frame-precise after long seek");
for (const invalidFrame of ["-1", "6000", "4322.1", "NaN"]) {
  const before = lottieCalls.length;
  fakeSeekControl.value = invalidFrame;
  fakeUiActions["seek:input"]();
  assert.equal(lottieCalls.length, before, "Invalid seek ignored: " + invalidFrame);
}
fakeLottieInstance.totalFrames = originalFrameCount;

assert.equal(typeof fakeUiActions["back5:click"], "function");
assert.equal(typeof fakeUiActions["forward5:click"], "function");
fakeLottieInstance.totalFrames = 6000;
fakeLottieInstance.currentFrame = 3000;
fakeLottieInstance.pause();
fakeLottieEvents.enterFrame();
fakeUiActions["forward5:click"]();
assert.equal(fakeLottieInstance.currentFrame, 3150,
  "Five-second forward skip uses 150 frames at 30 FPS");
assert.equal(fakeLottieInstance.isPaused, true, "Skip from pause stays paused");
assert.equal(fakeFrameOutput.textContent, "3151/6000 fot.");
fakeUiActions["back5:click"]();
assert.equal(fakeLottieInstance.currentFrame, 3000);
fakeLottieInstance.play();
fakeUiActions["forward5:click"]();
assert.equal(fakeLottieInstance.currentFrame, 3150);
assert.equal(fakeLottieInstance.isPaused, false, "Skip while playing resumes");
let fastSkipPrevented = 0;
fakeUiActions["seek:keydown"]({
  key: "ArrowLeft", shiftKey: true,
  preventDefault() { fastSkipPrevented++; }
});
assert.equal(fakeLottieInstance.currentFrame, 3000);
assert.equal(fakeLottieInstance.isPaused, false);
assert.equal(fastSkipPrevented, 1);
fakeLottieInstance.currentFrame = 4;
fakeUiActions["back5:click"]();
assert.equal(fakeLottieInstance.currentFrame, 0,
  "Five-second skip clamps at start");
assert.equal(fakeSkipBack.disabled, true);
fakeLottieInstance.currentFrame = 5997;
fakeUiActions["forward5:click"]();
assert.equal(fakeLottieInstance.currentFrame, 5999,
  "Five-second skip clamps at end");
assert.equal(fakeSkipForward.disabled, true);
fakeLottieInstance.totalFrames = 12;

assert.equal(fakeMarkCount.textContent, "Marcadores (0/8)");
assert.equal(fakeGoMark.disabled, true);
assert.equal(fakeDeleteMark.disabled, true);
assert.equal(typeof fakeUiActions["save-mark:click"], "function");
assert.equal(typeof fakeUiActions["go-mark:click"], "function");
assert.equal(typeof fakeUiActions["delete-mark:click"], "function");
fakeLottieInstance.totalFrames = 6000;
fakeLottieInstance.currentFrame = 2700;
fakeLottieInstance.pause();
fakeUiActions["save-mark:click"]();
assert.equal(fakeMarkCount.textContent, "Marcadores (1/8)");
assert.equal(fakeMarkList.value, "2700");
assert.match(fakeMarkList.items[0].textContent, /Fot\. 2701 · 1:30\.00/);
fakeUiActions["save-mark:click"]();
assert.equal(fakeMarkList.items.length, 1, "Duplicate bookmarks are deduplicated");
fakeLottieInstance.currentFrame = 150;
fakeUiActions["save-mark:click"]();
assert.deepEqual(fakeMarkList.items.map(o => o.value), ["150", "2700"],
  "Bookmarks stay sorted by frame");
fakeLottieInstance.currentFrame = 42;
fakeMarkList.value = "2700";
fakeUiActions["go-mark:click"]();
assert.equal(fakeLottieInstance.currentFrame, 2700);
assert.equal(fakeLottieInstance.isPaused, true, "Paused bookmark navigation remains paused");
fakeLottieInstance.play();
fakeMarkList.value = "150";
fakeUiActions["go-mark:click"]();
assert.equal(fakeLottieInstance.currentFrame, 150);
assert.equal(fakeLottieInstance.isPaused, false, "Playing bookmark navigation resumes");
fakeUiActions["delete-mark:click"]();
assert.equal(fakeMarkList.items.length, 1);
assert.equal(fakeMarkList.items[0].value, "2700");
assert.equal(fakeMarkCount.textContent, "Marcadores (1/8)");
fakeMarkList.value = "999";
const bookmarkCallCount = lottieCalls.length;
fakeUiActions["go-mark:click"]();
assert.equal(lottieCalls.length, bookmarkCallCount,
  "Forged bookmark selection cannot seek");
for (const index of [100, 200, 300, 400, 500, 600, 700]) {
  fakeLottieInstance.currentFrame = index;
  fakeUiActions["save-mark:click"]();
}
assert.equal(fakeMarkCount.textContent, "Marcadores (8/8)");
assert.equal(fakeSaveMark.disabled, true, "Marker count is capped at eight");
fakeLottieInstance.currentFrame = 800;
fakeUiActions["save-mark:click"]();
assert.equal(fakeMarkList.items.length, 8, "Ninth bookmark cannot be stored");
fakeMarkList.value = "2700";
fakeUiActions["delete-mark:click"]();
assert.equal(fakeSaveMark.disabled, false, "Deleting bookmark frees one slot");
assert.equal(fakeMarkList.items.length, 7);
// Editing preview-only markers must never add fields to NagWeb Apply values.
assert.deepEqual(editedLottieEnvelope.descriptor.payload.speed, 2);
assert.equal(editedLottieEnvelope.descriptor.payload.loop, false);

const editableUiverse = transformUiverseComponent({
  repository: "https://github.com/uiverse-io/galaxy",
  commit: "test-commit",
  item: {
    metadata: { category: "Buttons", author: "test-author", slug: "sample-button" },
    content: '<style>.sample-button{color:red}</style><button class="sample-button">Hola</button>',
    entry: { path: "Buttons/test-author_sample-button.html", sha: "abc" }
  }
});
assert.equal(editableUiverse.source.provider, "uiverse");
assert.deepEqual(describeEditableControls(editableUiverse).map(p => p.id),
  ["opacity", "scale"], "Uiverse gets two functional customization controls");
assert.equal(htmlCssPropertyStyle(editableUiverse, { opacity: 0.65, scale: 1.4 }),
  "opacity:0.65;scale:1.4");
const tailoredUiverse = buildResourceApplyEnvelope(editableUiverse, {
  values: { opacity: 0.65, scale: 1.4 }
});
assert.equal(tailoredUiverse.descriptor.kind, "html");
assert.match(tailoredUiverse.descriptor.payload.html,
  /^<div data-nagweb-custom-style="1" style="opacity:0\.65;scale:1\.4">/);
assert.match(tailoredUiverse.descriptor.payload.html, /<button class="sample-button">Hola<\/button><\/div>$/);
assert.deepEqual({
  opacity: tailoredUiverse.descriptor.instance.values.opacity,
  scale: tailoredUiverse.descriptor.instance.values.scale
}, { opacity: 0.65, scale: 1.4 });
assert.equal(htmlCssPropertyStyle(editableUiverse, {
  opacity: "0;position:absolute", scale: Infinity
}), "opacity:1;scale:1", "Invalid styles cannot inject CSS");
assert.equal(htmlCssPropertyStyle({
  ...editableUiverse,
  editableProps: [
    { ...editableUiverse.editableProps[0],
      binding: { type: "css-property", property: "background-image" } },
    { ...editableUiverse.editableProps[1],
      constraints: { min: 0, max: 999, step: 0.05 } }
  ]
}, { opacity: 0.2, scale: 5 }), "",
"Unapproved property metadata cannot become an editable CSS style");
assert.deepEqual(describeEditableControls({
  ...editableUiverse, editableProps: [{
    ...editableUiverse.editableProps[0],
    binding: { type: "css-property", property: "background-image" }
  }]
}), [], "Unsupported CSS property does not surface as a fake control");
assert.equal(htmlCssPropertyStyle(editableSpinKit, { color: "#ee4488" }), "");
assert.equal(buildResourceApplyEnvelope(editableSpinKit, {
  values: { color: "#ee4488" }
}).descriptor.payload.html, editableSpinKit.artifacts[0].content,
  "Legacy CSS variable HTML resources are not wrapped unexpectedly");

const publicPreviewDir = await mkdtemp(path.join(tmpdir(), "nagweb-pages-preview-"));
try {
  const site = await buildPublicResourceBrowser({ outputDir: publicPreviewDir });
  assert.equal(site.entrypoint, "resource-browser/index.html");
  assert.match(await readFile(path.join(publicPreviewDir, "index.html"), "utf8"),
    /url=\.\/resource-browser\//);
  assert.match(await readFile(path.join(publicPreviewDir, "resource-browser", "index.html"), "utf8"),
    /Biblioteca de recursos/);
  assert.ok((await stat(path.join(publicPreviewDir, "resource-browser", "app.mjs"))).isFile());
  assert.ok((await stat(path.join(publicPreviewDir, "src", "runtime", "persistent-vault-client.mjs"))).isFile());
  assert.ok((await stat(path.join(publicPreviewDir, "src", "runtime", "html-css-customization.mjs"))).isFile());
  assert.ok((await stat(path.join(publicPreviewDir, "src", "runtime", "uiverse-colors.mjs"))).isFile());
  assert.ok((await stat(path.join(publicPreviewDir, "src", "runtime", "uiverse-dimensions.mjs"))).isFile());
  assert.ok((await stat(path.join(publicPreviewDir, "src", "runtime", "uiverse-spacing.mjs"))).isFile());
  assert.ok((await stat(path.join(publicPreviewDir, "src", "runtime", "uiverse-type-borders.mjs"))).isFile());
  assert.ok((await stat(path.join(publicPreviewDir, "src", "runtime", "uiverse-timing.mjs"))).isFile());
  assert.ok((await stat(path.join(publicPreviewDir, "src", "runtime", "uiverse-multi-timing.mjs"))).isFile());
  assert.ok((await stat(path.join(publicPreviewDir, "src", "runtime", "uiverse-bezier.mjs"))).isFile());
  assert.ok((await stat(path.join(publicPreviewDir, "src", "runtime", "uiverse-easing.mjs"))).isFile());
  assert.ok((await stat(path.join(publicPreviewDir, "resource-browser", "vendor", "lottie_light.min.js"))).isFile());
  assert.ok((await stat(path.join(publicPreviewDir, ".nojekyll"))).isFile());
  await assert.rejects(stat(path.join(publicPreviewDir, "src", "cli.mjs")),
    "The Pages bundle must not publish the importer CLI");
  await assert.rejects(stat(path.join(publicPreviewDir, "src", "vault-cli.mjs")),
    "The Pages bundle must not publish the Vault maintenance tooling");
  for (const location of ["resource-browser/app.mjs",
    "src/runtime/resource-apply-bridge.mjs", "src/runtime/editable-controls.mjs",
    "src/preview/csshake-browser-preview.mjs",
    "src/preview/magiccss-browser-preview.mjs"]) {
    const source = await readFile(path.join(publicPreviewDir, location), "utf8");
    for (const match of source.matchAll(/\bfrom\s*["'](\.[^"']+)["']/g)) {
      const file = path.resolve(path.dirname(path.join(publicPreviewDir, location)), match[1]);
      assert.ok((await stat(file)).isFile(),
        "Public site must include dependency " + match[1] + " of " + location);
    }
  }
} finally {
  await rm(publicPreviewDir, { recursive: true, force: true });
}

const vividUiverseHtml = '<style>' +
  '.button{color:#fff;background:#112233;border:1px solid #aBc;' +
  'box-shadow:0 0 4px #112233;outline:1px solid #abc;' +
  'width:100px;transform:translateX(20px)}' +
  '.button:hover{background:linear-gradient(#112233,#ffcc00)}' +
  '/* color: #eeeeee; */' +
  '.icon{fill:#fff;stroke:#ffcc00}' +
  '.image{background:url(https://example.test/#aabbcc)}' +
  '</style><button class="button" data-palette="#112233">Color</button>';
const inferredPalette = inferUiverseCssColorProps(vividUiverseHtml);
assert.deepEqual(inferredPalette.map(prop => prop.defaultValue),
  ["#ffffff", "#112233", "#aabbcc", "#ffcc00"],
  "Only actual CSS color declarations become controls; comments and URLs do not");
assert.deepEqual(inferredPalette.map(prop => prop.id),
  ["uiverseColor1", "uiverseColor2", "uiverseColor3", "uiverseColor4"]);
const vividUiverse = transformUiverseComponent({
  repository: "https://github.com/uiverse-io/galaxy", commit: "test-commit",
  item: {
    metadata: { category: "Buttons", author: "tester", slug: "vivid" },
    content: vividUiverseHtml, entry: { path: "Buttons/tester_vivid.html", sha: "def" }
  }
});
assert.deepEqual(describeEditableControls(vividUiverse).map(prop => prop.id),
  ["opacity", "scale", "uiverseColor1", "uiverseColor2",
    "uiverseColor3", "uiverseColor4", "uiverseLength1",
    "uiverseDetail1"]);
assert.equal(effectiveUiverseEditableProps(vividUiverse).length, 8,
  "Color and pixel controls are not duplicated when already saved in metadata");
const persistedUiverse = {
  ...vividUiverse, editableProps: vividUiverse.editableProps.slice(0, 2)
};
assert.deepEqual(describeEditableControls(persistedUiverse).map(prop => prop.id),
  ["opacity", "scale", "uiverseColor1", "uiverseColor2",
    "uiverseColor3", "uiverseColor4", "uiverseLength1", "uiverseDetail1"],
  "Old Uiverse resources gain color, width and border thickness without re-import");
const paletteValues = {
  uiverseColor1: "#1122ee",
  uiverseColor2: "#eeddcc",
  uiverseColor3: "#aabb11",
  uiverseColor4: "#ff2233",
  opacity: 0.7
};
const vividDescriptor = buildResourceApplyEnvelope(persistedUiverse, {
  values: paletteValues
}).descriptor;
assert.equal(vividDescriptor.kind, "html");
assert.match(vividDescriptor.payload.html, /color:#1122ee;background:#eeddcc/);
assert.match(vividDescriptor.payload.html, /border:1px solid #aabb11/);
assert.match(vividDescriptor.payload.html, /box-shadow:0 0 4px #eeddcc/);
assert.match(vividDescriptor.payload.html,
  /linear-gradient\(#eeddcc,#ff2233\)/);
assert.match(vividDescriptor.payload.html, /data-palette="#112233"/,
  "HTML attributes are left untouched");
assert.match(vividDescriptor.payload.html, /width:100px;transform:translateX\(20px\)/);
assert.match(vividDescriptor.payload.html, /\/\* color: #eeeeee; \*\//);
assert.match(vividDescriptor.payload.html, /^<div data-nagweb-custom-style="1" style="opacity:0\.7;scale:1">/);
assert.equal(vividDescriptor.instance.values.uiverseColor3, "#aabb11");
assert.equal(vividUiverse.artifacts[0].content, vividUiverseHtml,
  "Original resource remains unchanged");
const invalidPalette = applyUiverseCssColorValues(
  persistedUiverse,
  { uiverseColor1: "red;position:fixed", uiverseColor2: "#fff;url(x)" },
  vividUiverseHtml
);
assert.match(invalidPalette, /color:#fff;background:#112233/,
  "Invalid color values always use the original CSS colors");
assert.deepEqual(inferUiverseCssColorProps(
  '<style>.a{width:42px;opacity:.5;background:transparent;}</style>'),
  [], "No fabricated controls when no real hex colors exist");
assert.deepEqual(inferUiverseCssColorProps(
  '<style>.a{background-image:url(https://example.test/#123456);' +
  'background:linear-gradient(#ffeedd,#aabbcc)}</style>').map(p=>p.defaultValue),
  ["#ffeedd","#aabbcc"], "Ignore URL tokens while editing genuine gradients");

assert.deepEqual(buildResourceApplyEnvelope(persistedUiverse).resource.editableProps
  .map(prop => prop.id).filter(id => id.startsWith("uiverseColor")),
  ["uiverseColor1", "uiverseColor2", "uiverseColor3", "uiverseColor4"],
  "Dynamic palette survives apply envelope even with an old resource snapshot");
assert.equal(buildResourceApplyEnvelope(persistedUiverse).descriptor.instance.values.uiverseLength1,
  100, "Existing pixel width also keeps its default in the insert descriptor");
assert.equal(buildResourceApplyEnvelope(persistedUiverse).descriptor.instance.values.uiverseColor1,
  "#ffffff", "New controls also supply their default values to inserted instance");
const unchangedComment = '<style>.a{color:#abcdef;/* color:#abcdef; */' +
  'background:#abcdef}</style>';
const recoloredComment = applyUiverseCssColorValues(
  persistedUiverse,
  { uiverseColor1: "#123123" },
  unchangedComment
);
assert.equal(recoloredComment, unchangedComment,
  "A token from a different resource is not allowed to recolor another resource");
const matchingCommentResource = {
  ...persistedUiverse,
  artifacts: [{...persistedUiverse.artifacts[0], content: unchangedComment}]
};
const recoloredMatchingComment = applyUiverseCssColorValues(
  matchingCommentResource,
  { uiverseColor1: "#123123" },
  unchangedComment
);
assert.match(recoloredMatchingComment, /color:#123123;\/\* color:#abcdef; \*\//,
  "Recolor CSS declarations without touching commented examples");

const mixedRgbHtml = '<style>' +
  '.badge{color:rgb(12, 34, 56);background-color:rgba(255, 0, 128, 0.25);' +
  'border:1px solid rgb(12,34,56);box-shadow:0 0 3px rgba(12,34,56,.5)}' +
  '.other{background:linear-gradient(90deg, rgb(22, 44, 66), rgba(255,0,128,1))}' +
  '/*color:rgb(99,88,77);*/' +
  '.unsafe{background:url(https://x.test/rgb(15,23,45));color:rgb(999,2,3)}' +
  '</style><span data-color="rgb(12, 34, 56)">Hola</span>';
const parsedRgbColors = inferUiverseCssColorProps(mixedRgbHtml);
assert.deepEqual(parsedRgbColors.map(p => p.defaultValue),
  ["#0c2238", "#ff0080", "#162c42"],
  "Standard RGB and RGBA tokens share editable swatches by RGB channel values");
const existingRgbResource = {
  ...persistedUiverse,
  artifacts: [{...persistedUiverse.artifacts[0], content:mixedRgbHtml}]
};
assert.deepEqual(describeEditableControls(existingRgbResource).map(p => p.id),
  ["opacity", "scale", "uiverseColor1", "uiverseColor2", "uiverseColor3",
    "uiverseDetail1"],
  "Old saved Uiverse with RGB colors also gains its original border thickness");
assert.equal(applyUiverseCssColorValues(existingRgbResource, {},
  mixedRgbHtml), mixedRgbHtml,
  "Unchanged RGB and RGBA values remain byte-identical");
const rgbCustom = buildResourceApplyEnvelope(existingRgbResource, {
  values: { uiverseColor1:"#aa7733", uiverseColor2:"#50a020" }
});
assert.match(rgbCustom.descriptor.payload.html, /color:rgb\(170, 119, 51\)/,
  "Changed rgb() color keeps RGB functional syntax");
assert.match(rgbCustom.descriptor.payload.html,
  /background-color:rgba\(80, 160, 32, 0\.25\)/,
  "Changed rgba() color keeps its original alpha channel");
assert.match(rgbCustom.descriptor.payload.html,
  /box-shadow:0 0 3px rgba\(170, 119, 51, \.5\)/,
  "Another rgba() using the same hue shares the control and preserves alpha");
assert.match(rgbCustom.descriptor.payload.html,
  /linear-gradient\(90deg, rgb\(22, 44, 66\), rgba\(80, 160, 32, 1\)\)/,
  "Gradient channels and alpha are preserved");
assert.match(rgbCustom.descriptor.payload.html, /\/\*color:rgb\(99,88,77\);\*\//);
assert.match(rgbCustom.descriptor.payload.html, /data-color="rgb\(12, 34, 56\)"/,
  "HTML attributes must not be touched");
assert.match(rgbCustom.descriptor.payload.html, /color:rgb\(999,2,3\)/,
  "Invalid RGB colors are never offered or overwritten");
assert.equal(buildResourceApplyEnvelope(existingRgbResource).resource.editableProps.length,
  6, "The editor receives RGB and original border options in its insertion envelope");
assert.equal(applyUiverseCssColorValues(existingRgbResource,
  { uiverseColor1:"rgb(255,0,0)", uiverseColor2:"red; position:fixed" },
  mixedRgbHtml), mixedRgbHtml, "Only valid hex picker input may recolor RGB CSS");
assert.deepEqual(inferUiverseCssColorProps(
  '<style>.a{color:rgb(300,20,20);background:rgba(1,2,3,1.5);' +
  'border-color:rgb(1 2 3);stroke:rgba(1,2,3)}' +
  '</style>'), [], "Reject invalid and unsupported RGB syntaxes");

const sizedUiverseHtml = '<style>' +
  '.card {border-radius: 12px; width:160px;height: 40px; color: #fff;' +
  'padding:18px; transform: translateX(20px)}' +
  '.card:hover {border-radius:12px;width:160px}' +
  '.child {width: 160px; min-width: 90px; max-height: 300px}' +
  '/* .comment {width: 50px; border-radius: 40px;} */' +
  '.ignored {width: 40%; height:calc(100% - 12px);' +
  'border-radius: 6px 10px; background:url(https://example.test/width:50px);}' +
  '.large {width: 5000px; height:1400px}' +
  '.quoted:before {content:"width:77px;";}' +
  '</style><div data-size="width:160px" class="card">Hola</div>';
const inferredSizes = inferUiverseCssDimensionProps(sizedUiverseHtml);
assert.deepEqual(inferredSizes.map(p => [p.binding.property, p.defaultValue]),
  [["border-radius",12], ["width",160], ["height",40], ["min-width",90], ["max-height",300]],
  "Only bounded, genuine simple pixel declarations become controls");
assert.deepEqual(inferredSizes.map(p => p.id),
  ["uiverseLength1","uiverseLength2","uiverseLength3","uiverseLength4","uiverseLength5"]);
const sizedSavedUiverse = {
  ...persistedUiverse, artifacts:[{
    ...persistedUiverse.artifacts[0], content:sizedUiverseHtml
  }]
};
assert.deepEqual(describeEditableControls(sizedSavedUiverse).map(p => p.id),
  ["opacity","scale","uiverseColor1","uiverseLength1","uiverseLength2",
    "uiverseLength3","uiverseLength4","uiverseLength5","uiverseSpace1"],
  "Old saved Uiverse gains dimensions and padding without re-import");
assert.equal(isSupportedUiverseCssDimension(sizedSavedUiverse, inferredSizes[0]),true);
assert.equal(isSupportedUiverseCssDimension(sizedSavedUiverse, {
  ...inferredSizes[0], binding:{...inferredSizes[0].binding,property:"position"}
}),false, "Forged CSS property metadata cannot expose misleading options");
assert.equal(applyUiverseCssDimensionValues(sizedSavedUiverse, {}, sizedUiverseHtml),
  sizedUiverseHtml,"Unedited CSS dimensions remain byte-for-byte unchanged");
const sizedApplied = buildResourceApplyEnvelope(sizedSavedUiverse, {
  values:{uiverseLength1:25,uiverseLength2:220,
    uiverseLength3:55,uiverseLength4:105,uiverseLength5:450}
});
assert.match(sizedApplied.descriptor.payload.html,
  /border-radius: 25px; width:220px;height: 55px/);
assert.match(sizedApplied.descriptor.payload.html,
  /min-width: 105px; max-height: 450px/);
assert.match(sizedApplied.descriptor.payload.html,
  /\.card:hover \{border-radius:25px;width:220px\}/);
assert.match(sizedApplied.descriptor.payload.html,
  /padding:18px; transform: translateX\(20px\)/);
assert.match(sizedApplied.descriptor.payload.html,
  /width: 40%; height:calc\(100% - 12px\)/);
assert.match(sizedApplied.descriptor.payload.html,
  /\/\* \.comment \{width: 50px; border-radius: 40px;\} \*\//);
assert.match(sizedApplied.descriptor.payload.html, /data-size="width:160px"/);
assert.match(sizedApplied.descriptor.payload.html, /width: 5000px; height:1400px/);
assert.match(sizedApplied.descriptor.payload.html, /content:"width:77px;"/);
assert.deepEqual(sizedApplied.resource.editableProps.map(p=>p.id)
  .filter(id=>id.startsWith("uiverseLength")),
  ["uiverseLength1","uiverseLength2","uiverseLength3","uiverseLength4","uiverseLength5"],
  "Applied metadata preserves editable dimensions");
assert.equal(sizedApplied.descriptor.instance.values.uiverseLength2,220);
assert.equal(sizedSavedUiverse.artifacts[0].content,sizedUiverseHtml,
  "Original CSS remains untouched after applying dimensions");
assert.equal(applyUiverseCssDimensionValues(sizedSavedUiverse, {
  uiverseLength1:"20;position:fixed", uiverseLength2:Infinity,
  uiverseLength3:-10, uiverseLength4:3000, uiverseLength5:450.5
},sizedUiverseHtml),sizedUiverseHtml,
  "Invalid, out-of-bounds, and out-of-step values are not applied");
assert.deepEqual(inferUiverseCssDimensionProps(
  '<style>.b{border-radius: 6px 8px;width: 30em;' +
  'height:var(--height);min-width:calc(40px + 2vw)}</style>'),
  [],"No fabricated sliders for shorthand, relative, or dynamic CSS");
const fractionHtml = '<style>.x{border-top-left-radius:4.5px;' +
  'height:35.25px}</style>';
assert.deepEqual(inferUiverseCssDimensionProps(fractionHtml)
  .map(p=>p.constraints.step),[0.1,0.01],
  "Fractional original CSS pixel values retain precise range steps");
const fractionResource = {
  ...persistedUiverse,
  artifacts:[{...persistedUiverse.artifacts[0],content:fractionHtml}]
};
assert.match(applyUiverseCssDimensionValues(fractionResource,
  {uiverseLength1:7.5,uiverseLength2:35.75},fractionHtml),
  /border-top-left-radius:7.5px;height:35.75px/);
assert.equal(inferUiverseCssDimensionProps(
  '<style>'+Array.from({length:12},(_item,i)=>'.c'+i+'{width:'+(i+10)+'px}').join('')+
  '</style>').length,8,"Maximum eight length controls per component");

const spacingCss = '<style>' +
  '.button{padding: 12px;margin:-8px;padding-top:5.5px;' +
  'margin-right: 15px; margin-bottom: 0px}' +
  '.button:hover {padding:12px;margin:-8px}' +
  '/* .fake {margin: 99px;padding:100px;} */' +
  '.quoted:after {content:"margin: 50px;";}' +
  '.other{margin:10%;padding:calc(5px + 2vw);' +
  'padding:4px 8px; margin:auto; margin-left:-301px;' +
  'padding-right:-5px;padding-left:450px}' +
  '</style><div data-space="padding: 12px">Hola</div>';
const spacingProps = inferUiverseCssSpacingProps(spacingCss);
assert.deepEqual(spacingProps.map(p=>[p.binding.property,p.defaultValue]),[
  ["padding",12],["margin",-8],["padding-top",5.5],
  ["margin-right",15],["margin-bottom",0]
], "Real px padding and margin declarations get controls, without fake shorthand");
assert.deepEqual(spacingProps.map(p=>p.constraints.min),
  [0,-300,0,-300,-300],"Margin accepts negative values; padding does not");
assert.equal(spacingProps[2].constraints.step,0.1);
const spacingSavedUiverse={
  ...persistedUiverse,
  artifacts:[{...persistedUiverse.artifacts[0],content:spacingCss}]
};
assert.deepEqual(describeEditableControls(spacingSavedUiverse).map(p=>p.id),[
  "opacity","scale",
  "uiverseSpace1","uiverseSpace2","uiverseSpace3","uiverseSpace4","uiverseSpace5"
], "Already-saved Uiverse resources expose spacing controls without re-import");
assert.equal(isSupportedUiverseCssSpacing(spacingSavedUiverse,spacingProps[0]),true);
assert.equal(isSupportedUiverseCssSpacing(spacingSavedUiverse,{
  ...spacingProps[0],binding:{type:"css-spacing-declaration",property:"position",originalValue:12}
}),false,"Forged CSS property metadata is rejected");
assert.equal(applyUiverseCssSpacingValues(spacingSavedUiverse,{},spacingCss),spacingCss,
  "Default spacing leaves original CSS byte-identical");
const spacingApplied=buildResourceApplyEnvelope(spacingSavedUiverse,{
  values:{uiverseSpace1:24,uiverseSpace2:-20,
    uiverseSpace3:7.5,uiverseSpace4:25,uiverseSpace5:4}
});
assert.match(spacingApplied.descriptor.payload.html,
  /padding: 24px;margin:-20px;padding-top:7.5px;/);
assert.match(spacingApplied.descriptor.payload.html,
  /margin-right: 25px; margin-bottom: 4px/);
assert.match(spacingApplied.descriptor.payload.html,
  /\.button:hover \{padding:24px;margin:-20px\}/);
assert.match(spacingApplied.descriptor.payload.html,
  /\/\* \.fake \{margin: 99px;padding:100px;\} \*\//);
assert.match(spacingApplied.descriptor.payload.html,/content:"margin: 50px;"/);
assert.match(spacingApplied.descriptor.payload.html,/data-space="padding: 12px"/);
assert.match(spacingApplied.descriptor.payload.html,
  /margin:10%;padding:calc\(5px \+ 2vw\);padding:4px 8px/);
assert.match(spacingApplied.descriptor.payload.html,
  /margin-left:-301px;padding-right:-5px;padding-left:450px/);
assert.deepEqual(spacingApplied.resource.editableProps.map(p=>p.id)
  .filter(id=>id.startsWith("uiverseSpace")),
  ["uiverseSpace1","uiverseSpace2","uiverseSpace3","uiverseSpace4","uiverseSpace5"],
  "Spacing metadata survives insertion bridge");
assert.equal(spacingApplied.descriptor.instance.values.uiverseSpace2,-20);
assert.equal(spacingSavedUiverse.artifacts[0].content,spacingCss,
  "Original resource remains immutable");
assert.equal(applyUiverseCssSpacingValues(spacingSavedUiverse,{
  uiverseSpace1: "24;position:fixed", uiverseSpace2:-400,
  uiverseSpace3:7.55, uiverseSpace4:Infinity,uiverseSpace5:802
},spacingCss),spacingCss,"Invalid, out-of-range and off-step spacing is rejected");
const generatedSpacing=transformUiverseComponent({
  repository:"https://github.com/uiverse-io/galaxy",commit:"test",
  item:{metadata:{category:"Buttons",author:"designer",slug:"spacing"},
    content:spacingCss,entry:{path:"Buttons/designer_spacing.html",sha:"abc"}}
});
assert.deepEqual(generatedSpacing.editableProps.map(p=>p.id)
  .filter(id=>id.startsWith("uiverseSpace")),
  ["uiverseSpace1","uiverseSpace2","uiverseSpace3","uiverseSpace4","uiverseSpace5"],
  "Newly imported Uiverse resources persist their real spacing properties");
assert.equal(inferUiverseCssSpacingProps(
  '<style>'+Array.from({length:12},(_v,i)=>'.x'+i+'{margin-top:'+i+'px}').join('')+
  '</style>').length,8,"Spacing panel limits automatically inferred controls");

const typographyBorderCss = '<style>' +
  '.sample{font-size:16px;font-weight:400;border:2px solid #223344;' +
  'border-left-width: 1.5px; border-radius: 6px}' +
  '.sample:hover{font-size:16px;font-weight:400;border:2px dashed red}' +
  '.sample:focus{border-top: 3px dotted #cccccc}' +
  '/* .fake{font-size:77px;font-weight:700;border:10px solid red} */' +
  '.quotes:before{content:"font-size:55px;border-width:4px";}' +
  '.exclude{font-size:2rem;font-weight:bold;border-width:var(--width);' +
  'border: 7px groove red; border-left:calc(2px + 1vw)}' +
  '</style><button data-border="border:2px solid" class="sample">Click</button>';
const detailProps=inferUiverseCssTypeBorderProps(typographyBorderCss);
assert.deepEqual(detailProps.map(p=>[p.binding.property,p.defaultValue]),[
  ["font-size",16], ["font-weight",400],["border",2],
  ["border-left-width",1.5], ["border-top",3]
], "Typography and border controls reflect actual CSS declarations");
assert.deepEqual(detailProps.map(p=>p.id),
  ["uiverseDetail1","uiverseDetail2","uiverseDetail3",
    "uiverseDetail4","uiverseDetail5"]);
assert.deepEqual(detailProps.map(p=>p.constraints.unit),
  ["px","","px","px","px"]);
assert.equal(detailProps[3].constraints.step,0.1);
const oldTypographyResource={
  ...persistedUiverse,
  artifacts:[{...persistedUiverse.artifacts[0],content:typographyBorderCss}]
};
const availableTypographyIds=describeEditableControls(oldTypographyResource).map(p=>p.id);
assert.deepEqual(availableTypographyIds.filter(id=>id.startsWith("uiverseDetail")),
  ["uiverseDetail1","uiverseDetail2","uiverseDetail3",
    "uiverseDetail4","uiverseDetail5"],
  "Legacy Uiverse records gain type and border editing without re-import");
assert.equal(isSupportedUiverseCssTypeBorder(oldTypographyResource,detailProps[2]),true);
assert.equal(isSupportedUiverseCssTypeBorder(oldTypographyResource,{
  ...detailProps[2],binding:{...detailProps[2].binding,property:"position"}
}),false,"Injected property metadata does not create editing controls");
assert.equal(applyUiverseCssTypeBorderValues(oldTypographyResource,{},
  typographyBorderCss),typographyBorderCss,
  "No change preserves CSS precisely, including original formatting");
const typographyBorderValues={
  uiverseDetail1:22,
  uiverseDetail2:600,
  uiverseDetail3:5,
  uiverseDetail4:3.5,
  uiverseDetail5:4
};
const detailedApplied=buildResourceApplyEnvelope(oldTypographyResource,{
  values:typographyBorderValues
});
assert.match(detailedApplied.descriptor.payload.html,
  /font-size:22px;font-weight:600;border:5px solid #223344/);
assert.match(detailedApplied.descriptor.payload.html,
  /border-left-width: 3.5px; border-radius: 6px/);
assert.match(detailedApplied.descriptor.payload.html,
  /\.sample:hover\{font-size:22px;font-weight:600;border:5px dashed red\}/);
assert.match(detailedApplied.descriptor.payload.html,
  /border-top: 4px dotted #cccccc/);
assert.match(detailedApplied.descriptor.payload.html,
  /\/\* \.fake\{font-size:77px;font-weight:700;border:10px solid red\} \*\//);
assert.match(detailedApplied.descriptor.payload.html,
  /content:"font-size:55px;border-width:4px"/);
assert.match(detailedApplied.descriptor.payload.html,
  /font-size:2rem;font-weight:bold;border-width:var\(--width\)/);
assert.match(detailedApplied.descriptor.payload.html,
  /border: 7px groove red; border-left:calc\(2px \+ 1vw\)/);
assert.match(detailedApplied.descriptor.payload.html,
  /data-border="border:2px solid"/);
assert.deepEqual(detailedApplied.resource.editableProps
  .filter(p=>p.id.startsWith("uiverseDetail")).map(p=>p.id),
  ["uiverseDetail1","uiverseDetail2","uiverseDetail3",
    "uiverseDetail4","uiverseDetail5"],"Insertion retains editing metadata");
assert.equal(detailedApplied.descriptor.instance.values.uiverseDetail2,600,
  "Typed settings remain in the generated resource instance");
assert.equal(oldTypographyResource.artifacts[0].content,typographyBorderCss,
  "Source CSS stays unchanged after applying edited values");
assert.equal(applyUiverseCssTypeBorderValues(oldTypographyResource,{
  uiverseDetail1:"22;position:fixed",uiverseDetail2:1200,
  uiverseDetail3:-1,uiverseDetail4:2.35,uiverseDetail5:Infinity
},typographyBorderCss),typographyBorderCss,
  "Invalid, out-of-range, fractional-step and non-numeric values are rejected");
const freshTypeResource=transformUiverseComponent({
  repository:"https://github.com/uiverse-io/galaxy",commit:"test",
  item:{metadata:{category:"Buttons",author:"designer",slug:"typography"},
    content:typographyBorderCss,
    entry:{path:"Buttons/designer_typography.html",sha:"abc"}}
});
assert.deepEqual(freshTypeResource.editableProps
  .filter(p=>p.id.startsWith("uiverseDetail")).map(p=>p.id),
  ["uiverseDetail1","uiverseDetail2","uiverseDetail3",
    "uiverseDetail4","uiverseDetail5"],
  "New resource imports persist the same discovered CSS values");
assert.deepEqual(inferUiverseCssTypeBorderProps(
  '<style>.x{font-size:2rem;font-weight:bold;' +
  'border-width:calc(3px + 1px);border:3px groove black}</style>'),[],
  "Complex or unsupported CSS never generates fictional controls");
assert.equal(inferUiverseCssTypeBorderProps(
  '<style>'+Array.from({length:12},(_,i)=>'.x'+i+'{font-size:'+(i+10)+'px}').join('')+
  '</style>').length,8,"Limit inferred controls per resource");

const animatedUiverseCss = '<style>' +
  '.sample{animation-duration:1.2s; animation-delay:-250ms;' +
  'transition-duration:300ms;transition-delay:.15s}' +
  '.sample:hover{animation:wobble 800ms ease-in-out .2s infinite;' +
  'transition:opacity .4s ease 100ms}' +
  '.same{animation:wobble 800ms linear infinite; transition:color .4s linear}' +
  '/* .fake{animation-duration:9s;transition-delay:4s;} */' +
  '.quoted:after{content:"animation-duration:7s;";}' +
  '.skip{animation:spin 500ms, fade 1s;' +
  'transition:transform .4s cubic-bezier(.2,.4,0,1);' +
  'animation-delay:var(--delay);transition-duration:calc(1s + .5s)}' +
  '</style><button data-animation="animation-duration:1.2s">Animar</button>';
const animatedProps = inferUiverseCssTimingProps(animatedUiverseCss);
assert.deepEqual(animatedProps.map(p=>[p.binding.property,p.binding.role,p.defaultValue]),[
  ["animation-duration","duration",1.2],
  ["animation-delay","delay",-0.25],
  ["transition-duration","duration",0.3],
  ["transition-delay","delay",0.15],
  ["animation","duration",0.8],
  ["animation","delay",0.2],
  ["transition","duration",0.4],
  ["transition","delay",0.1]
], "CSS time controls reflect real longhand and simple shorthand timing values");
assert.deepEqual(animatedProps.map(p=>p.id),
  Array.from({length:8},(_v,i)=>"uiverseTime"+(i+1)));
assert.ok(animatedProps.every(p=>p.constraints.unit==="s"),
  "UI consistently displays seconds, even when source uses milliseconds");
assert.equal(animatedProps[1].constraints.min,-10,
  "Animation delays may be negative while durations cannot");
const persistedAnimated = {
  ...persistedUiverse,
  artifacts:[{...persistedUiverse.artifacts[0],content:animatedUiverseCss}]
};
assert.deepEqual(describeEditableControls(persistedAnimated).map(p=>p.id)
  .filter(id=>id.startsWith("uiverseTime")),
  animatedProps.map(p=>p.id), "Existing persisted animations get real timing controls");
assert.equal(isSupportedUiverseCssTiming(persistedAnimated,animatedProps[1]),true);
assert.equal(isSupportedUiverseCssTiming(persistedAnimated,{
  ...animatedProps[1],binding:{...animatedProps[1].binding,property:"position"}
}),false,"Forged timing metadata cannot expose arbitrary CSS controls");
assert.equal(applyUiverseCssTimingValues(persistedAnimated,{},animatedUiverseCss),
  animatedUiverseCss,"Untouched animation timing stays byte-for-byte identical");
const adjustedAnimation = buildResourceApplyEnvelope(persistedAnimated,{
  values:{
    uiverseTime1:2,
    uiverseTime2:-0.5,
    uiverseTime3:0.75,
    uiverseTime4:0.4,
    uiverseTime5:1.1,
    uiverseTime6:0.5,
    uiverseTime7:0.9,
    uiverseTime8:0.25
  }
});
assert.match(adjustedAnimation.descriptor.payload.html,
  /animation-duration:2s; animation-delay:-500ms;/);
assert.match(adjustedAnimation.descriptor.payload.html,
  /transition-duration:750ms;transition-delay:0.4s/);
assert.match(adjustedAnimation.descriptor.payload.html,
  /animation:wobble 1100ms ease-in-out 0.5s infinite/);
assert.match(adjustedAnimation.descriptor.payload.html,
  /transition:opacity 0.9s ease 250ms/);
assert.match(adjustedAnimation.descriptor.payload.html,
  /animation:wobble 1100ms linear infinite; transition:color 0.9s linear/);
assert.match(adjustedAnimation.descriptor.payload.html,
  /\/\* \.fake\{animation-duration:9s;transition-delay:4s;\} \*\//);
assert.match(adjustedAnimation.descriptor.payload.html,
  /content:"animation-duration:7s;"/);
assert.match(adjustedAnimation.descriptor.payload.html,
  /animation:spin 500ms, fade 1s/);
assert.match(adjustedAnimation.descriptor.payload.html,
  /transition:transform .4s cubic-bezier\(.2,.4,0,1\)/);
assert.match(adjustedAnimation.descriptor.payload.html,
  /data-animation="animation-duration:1.2s"/);
assert.deepEqual(adjustedAnimation.resource.editableProps.map(p=>p.id)
  .filter(id=>id.startsWith("uiverseTime")),
  animatedProps.map(p=>p.id),"Inserted resource retains its timing metadata");
assert.equal(adjustedAnimation.descriptor.instance.values.uiverseTime5,1.1,
  "Inserted instance carries the chosen timing value");
assert.equal(persistedAnimated.artifacts[0].content,animatedUiverseCss,
  "The source resource cannot be changed by animation editing");
assert.equal(applyUiverseCssTimingValues(persistedAnimated,{
  uiverseTime1:99,uiverseTime2:-20,uiverseTime3:"0.9s",
  uiverseTime4:Infinity,uiverseTime5:0.1234,uiverseTime6:NaN,
  uiverseTime7:10.001,uiverseTime8:null
},animatedUiverseCss),animatedUiverseCss,
  "Invalid, out of range, off-step and non-numeric timing input is ignored");
const freshAnimated = transformUiverseComponent({
  repository:"https://github.com/uiverse-io/galaxy",commit:"test",
  item:{metadata:{category:"Buttons",author:"designer",slug:"animated"},
    content:animatedUiverseCss,entry:{path:"Buttons/designer_animated.html",sha:"abc"}}
});
assert.deepEqual(freshAnimated.editableProps.map(p=>p.id)
  .filter(id=>id.startsWith("uiverseTime")),animatedProps.map(p=>p.id),
  "Newly imported components persist the same timing controls");
assert.deepEqual(inferUiverseCssTimingProps(
  '<style>.a{animation-duration:3s,2s;animation-delay:var(--delay);' +
  'transition:opacity 2s cubic-bezier(.1,.2,.3,.4);' +
  'animation:spin -3s ease;transition-duration:inherit}</style>'),[],
  "Unsupported multi-track, complex, variable or negative duration CSS is skipped");
assert.equal(inferUiverseCssTimingProps(
  '<style>'+Array.from({length:11},(_v,i)=>
    '.t'+i+'{animation-delay:'+i+'s}').join('')+'</style>').length,8,
  "Limit the number of controls on heavily animated components");


const layeredAnimationCss='<style>' +
  '.layered{animation:spin 1s ease .2s infinite, ' +
  'fade 600ms cubic-bezier(.2,.4,0,1) -100ms both;' +
  'transition:opacity 250ms ease, transform .8s steps(4,end) 300ms}' +
  '/* .comment{animation:ghost 1s,fade 2s} */' +
  '.after:before{content:"animation:ghost 1s,fade 3s";}' +
  '.skip{animation:spin 1s, fade var(--speed);' +
  'transition:opacity 1s,transform calc(.3s + .2s)}' +
  '</style><div data-anim="animation:ghost 1s,fade 2s"></div>';
const multiProperties=inferUiverseCssMultiTimingProps(layeredAnimationCss);
assert.deepEqual(multiProperties.map(p=>
  [p.binding.property,p.binding.trackIndex,p.binding.role,p.defaultValue]),[
  ["animation",0,"duration",1],
  ["animation",0,"delay",0.2],
  ["animation",1,"duration",0.6],
  ["animation",1,"delay",-0.1],
  ["transition",0,"duration",0.25],
  ["transition",1,"duration",0.8],
  ["transition",1,"delay",0.3]
], "Two-track CSS timings are detected independently, even with nested easing commas");
assert.deepEqual(multiProperties.map(p=>p.id),
  ["uiverseTrack1","uiverseTrack2","uiverseTrack3","uiverseTrack4",
    "uiverseTrack5","uiverseTrack6","uiverseTrack7"]);
const persistedLayered={
  ...persistedUiverse,
  artifacts:[{...persistedUiverse.artifacts[0],content:layeredAnimationCss}]
};
assert.deepEqual(describeEditableControls(persistedLayered).map(p=>p.id)
  .filter(id=>id.startsWith("uiverseTrack")),
  multiProperties.map(p=>p.id),
  "Previously saved Uiverse resources automatically gain multi-track controls");
assert.equal(isSupportedUiverseCssMultiTiming(persistedLayered,multiProperties[3]),true);
assert.equal(isSupportedUiverseCssMultiTiming(persistedLayered,{
  ...multiProperties[3],
  binding:{...multiProperties[3].binding,trackIndex:20}
}),false,"Forged track metadata cannot provide fake controls");
assert.equal(applyUiverseCssMultiTimingValues(persistedLayered,{},layeredAnimationCss),
  layeredAnimationCss,"Unchanged multi-track CSS retains exact source bytes");
const updatedLayered=buildResourceApplyEnvelope(persistedLayered,{
  values:{
    uiverseTrack1:2,
    uiverseTrack2:0.5,
    uiverseTrack3:0.9,
    uiverseTrack4:-0.25,
    uiverseTrack5:0.4,
    uiverseTrack6:1.25,
    uiverseTrack7:0.75
  }
});
assert.match(updatedLayered.descriptor.payload.html,
  /animation:spin 2s ease 0.5s infinite, fade 900ms cubic-bezier\(.2,.4,0,1\) -250ms both/);
assert.match(updatedLayered.descriptor.payload.html,
  /transition:opacity 400ms ease, transform 1.25s steps\(4,end\) 750ms/);
assert.match(updatedLayered.descriptor.payload.html,
  /\/\* \.comment\{animation:ghost 1s,fade 2s\} \*\//);
assert.match(updatedLayered.descriptor.payload.html,
  /content:"animation:ghost 1s,fade 3s"/);
assert.match(updatedLayered.descriptor.payload.html,
  /animation:spin 1s, fade var\(--speed\)/);
assert.match(updatedLayered.descriptor.payload.html,
  /transition:opacity 1s,transform calc\(.3s \+ .2s\)/);
assert.match(updatedLayered.descriptor.payload.html,
  /data-anim="animation:ghost 1s,fade 2s"/);
assert.equal(updatedLayered.descriptor.instance.values.uiverseTrack3,0.9);
assert.deepEqual(updatedLayered.resource.editableProps
  .filter(p=>p.id.startsWith("uiverseTrack")).map(p=>p.id),
  multiProperties.map(p=>p.id),
  "Apply envelope preserves each track's own editable metadata");
assert.equal(persistedLayered.artifacts[0].content,layeredAnimationCss,
  "Customization does not mutate the original stored resource");
assert.equal(applyUiverseCssMultiTimingValues(persistedLayered,{
  uiverseTrack1:100,uiverseTrack2:-20,uiverseTrack3:"0.6s",
  uiverseTrack4:Infinity,uiverseTrack5:0.124,uiverseTrack6:NaN,
  uiverseTrack7:null
},layeredAnimationCss),layeredAnimationCss,
  "Out-of-range, invalid and out-of-step values leave source unchanged");
const reimportLayered=transformUiverseComponent({
  repository:"https://github.com/uiverse-io/galaxy",commit:"test",
  item:{metadata:{category:"Buttons",author:"designer",slug:"layered"},
    content:layeredAnimationCss,entry:{path:"Buttons/designer_layered.html",sha:"a"}}
});
assert.deepEqual(reimportLayered.editableProps
  .filter(p=>p.id.startsWith("uiverseTrack")).map(p=>p.id),
  multiProperties.map(p=>p.id),
  "New imports persist the same multi-track editable controls");

const longhandTracks='<style>.list{' +
  'animation-duration:1s,500ms;animation-delay:0s,-250ms;' +
  'transition-duration:250ms,1s;transition-delay:0s,200ms' +
  '}</style>';
const longhandMulti=inferUiverseCssMultiTimingProps(longhandTracks);
assert.deepEqual(longhandMulti.map(p=>
  [p.binding.property,p.binding.trackIndex,p.binding.role,p.defaultValue]),[
  ["animation-duration",0,"duration",1],["animation-duration",1,"duration",0.5],
  ["animation-delay",0,"delay",0],["animation-delay",1,"delay",-0.25],
  ["transition-duration",0,"duration",0.25],["transition-duration",1,"duration",1],
  ["transition-delay",0,"delay",0],["transition-delay",1,"delay",0.2]
],"Comma-separated duration and delay longhand lists get one control per track");
const longhandResource={
  ...persistedUiverse,artifacts:[{...persistedUiverse.artifacts[0],content:longhandTracks}]
};
const longhandResult=applyUiverseCssMultiTimingValues(longhandResource,{
  uiverseTrack1:1.5,uiverseTrack2:0.75,
  uiverseTrack3:0.2,uiverseTrack4:-0.5,
  uiverseTrack5:0.4,uiverseTrack6:1.25,
  uiverseTrack7:0.3,uiverseTrack8:0.45
},longhandTracks);
assert.match(longhandResult,/animation-duration:1.5s,750ms/);
assert.match(longhandResult,/animation-delay:0.2s,-500ms/);
assert.match(longhandResult,/transition-duration:400ms,1.25s/);
assert.match(longhandResult,/transition-delay:0.3s,450ms/);
assert.deepEqual(inferUiverseCssMultiTimingProps(
  '<style>.bad{animation:spin 1s,fade var(--speed);' +
  'transition:opacity 1s,transform calc(2s + .2s);' +
  'animation-duration:1s,calc(2s);transition-delay:300ms}</style>'),[],
  "Unsupported tracks fail closed, and lone timings remain with prior parser");
assert.equal(inferUiverseCssMultiTimingProps(
  '<style>'+Array.from({length:5},(_,i)=>
    '.x'+i+'{animation-delay:'+i+'s,'+(i+1)+'s}').join('')+'</style>').length,8,
  "Additional controls are capped to avoid overwhelming customization UI");


const bezierHtml = '<style>' +
  '.dual{animation:spin 1s cubic-bezier(.2,.5,.8,1), ' +
  'fade 2s cubic-bezier(.1,-.3,.9,1.2);' +
  'transition-timing-function:cubic-bezier(.25,.1,.25,1)}' +
  '.dual:hover{animation:spin 1s cubic-bezier(.2,.5,.8,1), ' +
  'fade 2s cubic-bezier(.1,-.3,.9,1.2)}' +
  '/* .comment{animation:spin 1s cubic-bezier(.4,.4,.4,.4)} */' +
  '.label:before{content:"animation:spin cubic-bezier(.5,.5,.5,.5)"}' +
  '.invalid{animation:spin 1s cubic-bezier(1.2,0,.1,1);' +
  'transition:opacity .2s cubic-bezier(.2,.3,var(--y),1)}' +
  '</style><button data-easing="cubic-bezier(.2,.5,.8,1)">Probar</button>';
const bezierProps=inferUiverseCssBezierProps(bezierHtml);
assert.equal(bezierProps.length,12,
  "Three real cubic-bezier curves expose all four coordinates");
assert.deepEqual(bezierProps.map(p=>p.id),
  Array.from({length:12},(_,i)=>"uiverseBezier"+(i+1)));
assert.deepEqual(bezierProps.slice(0,4).map(p=>[
  p.binding.property,p.binding.curveIndex,p.binding.coordinate,p.defaultValue
]),[
  ["animation",0,0,0.2],["animation",0,1,0.5],
  ["animation",0,2,0.8],["animation",0,3,1]
]);
assert.deepEqual(bezierProps.slice(4,8).map(p=>[
  p.binding.curveIndex,p.defaultValue
]),[[1,0.1],[1,-0.3],[1,0.9],[1,1.2]],
  "Each track retains independent Bézier control points");
assert.deepEqual(bezierProps.slice(8).map(p=>p.binding.property),
  Array(4).fill("transition-timing-function"),
  "Dedicated easing CSS properties are also supported");
assert.deepEqual(bezierProps.slice(0,4).map(p=>p.constraints.min),
  [0,-2,0,-2],"Bezier X values must be 0..1, Y may exceed that range");
assert.deepEqual(bezierProps.slice(0,4).map(p=>p.constraints.max),
  [1,2,1,2]);
const originalBezierResource={
  ...persistedUiverse,
  artifacts:[{...persistedUiverse.artifacts[0],content:bezierHtml}]
};
assert.deepEqual(describeEditableControls(originalBezierResource).map(p=>p.id)
  .filter(id=>id.startsWith("uiverseBezier")),
  bezierProps.map(p=>p.id),
  "Previously saved resources gain CSS easing controls without reimporting");
assert.equal(isSupportedUiverseCssBezier(originalBezierResource,bezierProps[4]),true);
assert.equal(isSupportedUiverseCssBezier(originalBezierResource,{
  ...bezierProps[4],binding:{...bezierProps[4].binding,coordinate:9}
}),false,"Invalid metadata cannot expose arbitrary CSS controls");
assert.equal(applyUiverseCssBezierValues(originalBezierResource,{},bezierHtml),
  bezierHtml,"Unchanged easing preserves source code byte-for-byte");
const bezierEdited=buildResourceApplyEnvelope(originalBezierResource,{
  values:{
    uiverseBezier1:0.4,uiverseBezier2:0.75,
    uiverseBezier5:0.3,uiverseBezier6:-0.6,
    uiverseBezier9:0.35,uiverseBezier12:0.8
  }
});
assert.match(bezierEdited.descriptor.payload.html,
  /spin 1s cubic-bezier\(0.4,0.75,.8,1\)/,
  "First animation curve changes only selected values");
assert.match(bezierEdited.descriptor.payload.html,
  /fade 2s cubic-bezier\(0.3,-0.6,.9,1.2\)/,
  "Second animation curve remains independent");
assert.match(bezierEdited.descriptor.payload.html,
  /transition-timing-function:cubic-bezier\(0.35,.1,.25,0.8\)/);
assert.match(bezierEdited.descriptor.payload.html,
  /\.dual:hover\{animation:spin 1s cubic-bezier\(0.4,0.75,.8,1\), /,
  "Equivalent CSS rules consistently receive the same changes");
assert.match(bezierEdited.descriptor.payload.html,
  /\/\* \.comment\{animation:spin 1s cubic-bezier\(.4,.4,.4,.4\)\} \*\//);
assert.match(bezierEdited.descriptor.payload.html,
  /content:"animation:spin cubic-bezier\(.5,.5,.5,.5\)"/);
assert.match(bezierEdited.descriptor.payload.html,
  /animation:spin 1s cubic-bezier\(1.2,0,.1,1\)/);
assert.match(bezierEdited.descriptor.payload.html,
  /transition:opacity .2s cubic-bezier\(.2,.3,var\(--y\),1\)/);
assert.match(bezierEdited.descriptor.payload.html,
  /data-easing="cubic-bezier\(.2,.5,.8,1\)"/);
assert.equal(bezierEdited.descriptor.instance.values.uiverseBezier6,-0.6);
assert.deepEqual(bezierEdited.resource.editableProps.filter(p=>
  p.id.startsWith("uiverseBezier")).map(p=>p.id),bezierProps.map(p=>p.id),
  "Editable easing curve metadata survives the insert descriptor");
assert.equal(originalBezierResource.artifacts[0].content,bezierHtml,
  "Source resource remains immutable");
assert.equal(applyUiverseCssBezierValues(originalBezierResource,{
  uiverseBezier1:-0.2,uiverseBezier2:3,uiverseBezier5:"0.5;display:none",
  uiverseBezier6:Infinity,uiverseBezier9:0.3333,uiverseBezier12:null
},bezierHtml),bezierHtml,
  "Malformed, unsafe, out-of-bounds and off-step easing values are rejected");
const importedBezier=transformUiverseComponent({
  repository:"https://github.com/uiverse-io/galaxy",commit:"test",
  item:{metadata:{category:"Buttons",author:"designer",slug:"bezier"},
    content:bezierHtml,entry:{path:"Buttons/designer_bezier.html",sha:"b"}}
});
assert.deepEqual(importedBezier.editableProps.filter(p=>
  p.id.startsWith("uiverseBezier")).map(p=>p.id),bezierProps.map(p=>p.id),
  "Fresh imports persist only genuine Bézier controls");
assert.deepEqual(inferUiverseCssBezierProps(
  '<style>.invalid{animation:spin 1s cubic-bezier(1.1,0,.2,1);' +
  'transition:opacity .3s cubic-bezier(.1,0,var(--x),1);' +
  'animation-timing-function:steps(4,end)}</style>'),[],
  "Invalid coordinates, variables and other timing functions are skipped");
const combinedAnimation=buildResourceApplyEnvelope(persistedLayered,{
  values:{uiverseTrack3:1.25,uiverseBezier1:0.4,uiverseBezier2:0.75}
});
assert.match(combinedAnimation.descriptor.payload.html,
  /fade 1250ms cubic-bezier\(0.4,0.75,0,1\) -100ms both/,
  "Changing duration and Bézier curve together preserves track behavior");
assert.equal(inferUiverseCssBezierProps(
  '<style>'+Array.from({length:5},(_,i)=>
    '.c'+i+'{animation:move 1s cubic-bezier('+i/10+',.2,.8,1)}').join('')+
  '</style>').length,12,"Limit Bezier sliders to three source curves");


const presetEasingCss = '<style>' +
  '.button{animation:spin 1s ease-in .2s infinite,fade 600ms ease-out both;' +
  'transition:transform .3s linear, opacity 250ms ease-in-out .1s;' +
  'animation-timing-function:ease,step-end;' +
  'transition-timing-function: linear}' +
  '.button:hover{animation:spin 1s ease-in .2s infinite,fade 600ms ease-out both}' +
  '/* .comment{animation:spin 1s ease-out} */' +
  '.quoted:before{content:"animation:spin 1s ease-in";}' +
  '.skip{animation:spin 1s cubic-bezier(.2,.4,0,1);' +
  'transition:opacity .4s steps(4,end);' +
  'animation:spin 1s var(--ease);animation:spin 1s ease!important}' +
  '</style><button data-easing="ease-in-out">Click</button>';
const detectedEasings = inferUiverseCssEasingProps(presetEasingCss);
assert.deepEqual(detectedEasings.map(p=>[
  p.binding.property,p.binding.trackIndex,p.defaultValue
]), [
  ["animation",0,"ease-in"],["animation",1,"ease-out"],
  ["transition",0,"linear"],["transition",1,"ease-in-out"],
  ["animation-timing-function",0,"ease"],
  ["animation-timing-function",1,"step-end"],
  ["transition-timing-function",0,"linear"]
], "CSS easing presets are inferred only from actual compatible declarations");
assert.deepEqual(detectedEasings.map(p=>p.id),
  ["uiverseEase1","uiverseEase2","uiverseEase3","uiverseEase4",
    "uiverseEase5","uiverseEase6","uiverseEase7"]);
const storedPresetResource={
  ...persistedUiverse,
  artifacts:[{...persistedUiverse.artifacts[0],content:presetEasingCss}]
};
assert.deepEqual(describeEditableControls(storedPresetResource)
  .filter(c=>c.id.startsWith("uiverseEase")).map(c=>c.kind),
  Array(7).fill("select"),"Existing Uiverse components gain real preset dropdowns");
assert.equal(isSupportedUiverseCssEasing(storedPresetResource,detectedEasings[1]),true);
assert.equal(isSupportedUiverseCssEasing(storedPresetResource,{
  ...detectedEasings[1],
  binding:{...detectedEasings[1].binding,trackIndex:99}
}),false,"Forged animation track metadata does not create new controls");
assert.equal(isSupportedUiverseCssEasing(storedPresetResource,{
  ...detectedEasings[1],constraints:{options:[
    {value:"not-css",label:"Invalid"},...detectedEasings[1].constraints.options]
  }
}),false,"Only verified preset choices are exposed");
assert.equal(applyUiverseCssEasingValues(storedPresetResource,{},
  presetEasingCss),presetEasingCss,
  "Default easing values preserve every original CSS byte");
const adjustedPresets=buildResourceApplyEnvelope(storedPresetResource,{
  values:{
    uiverseEase1:"ease-out",uiverseEase2:"ease-in",
    uiverseEase3:"ease",uiverseEase4:"linear",
    uiverseEase5:"ease-in-out",uiverseEase6:"step-start",
    uiverseEase7:"step-end"
  }
});
assert.match(adjustedPresets.descriptor.payload.html,
  /animation:spin 1s ease-out .2s infinite,fade 600ms ease-in both/);
assert.match(adjustedPresets.descriptor.payload.html,
  /transition:transform .3s ease, opacity 250ms linear .1s/);
assert.match(adjustedPresets.descriptor.payload.html,
  /animation-timing-function:ease-in-out,step-start/);
assert.match(adjustedPresets.descriptor.payload.html,
  /transition-timing-function: step-end/);
assert.match(adjustedPresets.descriptor.payload.html,
  /\.button:hover\{animation:spin 1s ease-out .2s infinite,fade 600ms ease-in both\}/);
assert.match(adjustedPresets.descriptor.payload.html,
  /\/\* \.comment\{animation:spin 1s ease-out\} \*\//);
assert.match(adjustedPresets.descriptor.payload.html,
  /content:"animation:spin 1s ease-in"/);
assert.match(adjustedPresets.descriptor.payload.html,
  /animation:spin 1s cubic-bezier\(.2,.4,0,1\)/);
assert.match(adjustedPresets.descriptor.payload.html,
  /transition:opacity .4s steps\(4,end\)/);
assert.match(adjustedPresets.descriptor.payload.html,
  /data-easing="ease-in-out"/);
assert.equal(adjustedPresets.descriptor.instance.values.uiverseEase6,
  "step-start","The insertion descriptor preserves the selected preset");
assert.deepEqual(adjustedPresets.resource.editableProps
  .filter(p=>p.id.startsWith("uiverseEase")).map(p=>p.id),
  detectedEasings.map(p=>p.id),
  "The editor receives metadata for each easing selector");
assert.equal(storedPresetResource.artifacts[0].content,presetEasingCss,
  "The stored source remains immutable");
assert.equal(applyUiverseCssEasingValues(storedPresetResource,{
  uiverseEase1:"ease;position:fixed",uiverseEase2:"cubic-bezier(.1,.2,.3,.4)",
  uiverseEase3:99,uiverseEase4:"",uiverseEase5:null,
  uiverseEase6:{value:"linear"},uiverseEase7:["linear"]
},presetEasingCss),presetEasingCss,
  "Invalid, injected and non-string selection values cannot rewrite CSS");
const newlyImportedPresets=transformUiverseComponent({
  repository:"https://github.com/uiverse-io/galaxy",commit:"test",
  item:{metadata:{category:"Buttons",author:"designer",slug:"presets"},
    content:presetEasingCss,entry:{path:"Buttons/designer_presets.html",sha:"ee"}}
});
assert.deepEqual(newlyImportedPresets.editableProps
  .filter(p=>p.id.startsWith("uiverseEase")).map(p=>p.id),
  detectedEasings.map(p=>p.id),
  "New Uiverse imports persist the same verified easing selectors");
assert.deepEqual(inferUiverseCssEasingProps(
  '<style>.bad{animation:spin 1s cubic-bezier(.2,.4,.6,1);' +
  'transition:opacity 1s steps(4,end);' +
  'animation:spin ease-in;transition-timing-function:var(--ease);' +
  'animation-timing-function:inherit}</style>'),[],
  "Complex functions, implicit durations and dynamic easing are skipped");
assert.equal(inferUiverseCssEasingProps(
  '<style>'+Array.from({length:10},(_,i)=>
    '.p'+i+'{animation-timing-function:'+(
      i%2?"ease-in":"ease-out")+';transition-timing-function:linear}').join('')+
  '</style>').length<=8,true,
  "The library caps inferred preset controls per component");
