import {
  createResourceInstance,
  selectArtifact
} from "./instance.mjs";

function parseJsonArtifact(artifact) {
  if (!artifact?.content) return null;
  try {
    return JSON.parse(artifact.content);
  } catch {
    return null;
  }
}

export function buildInsertDescriptor(resource, options = {}) {
  const instance = createResourceInstance(resource, options);
  const renderer = resource.runtime?.renderer || resource.runtime?.type;

  if (renderer === "nagweb-svg") {
    const artifact = selectArtifact(resource, instance, "icon-data");
    return {
      version: "1.0",
      kind: "svg",
      resourceId: resource.id,
      instance,
      payload: {
        svg: artifact?.content || "",
        size: instance.values.size,
        stroke: instance.values.stroke,
        strokeWidth: instance.values.strokeWidth
      }
    };
  }

  if (renderer === "nagweb-html-tailwind") {
    const artifact = selectArtifact(resource, instance, "component");
    return {
      version: "1.0",
      kind: "html",
      resourceId: resource.id,
      instance,
      payload: {
        html: artifact?.content || "",
        dependencies: resource.runtime?.registryDependencies || [],
        theme: instance.values.theme || "light"
      }
    };
  }

  if (renderer === "nagweb-css-class-effect") {
    const artifact = selectArtifact(resource, instance, "animation-data");
    return {
      version: "1.0",
      kind: "css-effect",
      resourceId: resource.id,
      instance,
      payload: {
        effect: parseJsonArtifact(artifact) || resource.runtime?.setup || null,
        dependencies: resource.runtime?.registryDependencies || [],
        trigger: instance.values.trigger || "hover"
      }
    };
  }

  if (renderer === "nagweb-motion-native") {
    const artifact = selectArtifact(resource, instance, "animation-data");
    return {
      version: "1.0",
      kind: "motion-preset",
      resourceId: resource.id,
      instance,
      payload: {
        preset: parseJsonArtifact(artifact) || resource.runtime?.setup || null
      }
    };
  }

  if (renderer === "lottie" || renderer === "dotlottie-web") {
    const artifact = selectArtifact(resource, instance, "animation-data");
    return {
      version: "1.0",
      kind: "lottie",
      resourceId: resource.id,
      instance,
      payload: {
        animation: parseJsonArtifact(artifact),
        speed: instance.values.speed ?? 1,
        loop: instance.values.loop ?? true,
        autoplay: instance.values.autoplay ?? true
      }
    };
  }

  if (renderer === "nagweb-react") {
    return {
      version: "1.0",
      kind: "react-component",
      resourceId: resource.id,
      instance,
      payload: {
        files: (resource.artifacts || [])
          .filter((artifact) => artifact.role === "component")
          .map((artifact) => ({
            id: artifact.id,
            path: artifact.targetPath || artifact.sourcePath,
            content: artifact.content || ""
          })),
        dependencies: resource.runtime?.dependencies || [],
        registryDependencies: resource.runtime?.registryDependencies || [],
        props: instance.values,
        requiresCompileSandbox: true
      }
    };
  }

  if (resource.runtime?.type === "three") {
    const artifact = selectArtifact(resource, instance);
    return {
      version: "1.0",
      kind: "three",
      resourceId: resource.id,
      instance,
      payload: {
        artifact,
        imports: resource.runtime?.imports || [],
        values: instance.values
      }
    };
  }

  return {
    version: "1.0",
    kind: "unsupported",
    resourceId: resource.id,
    instance,
    payload: {}
  };
}
