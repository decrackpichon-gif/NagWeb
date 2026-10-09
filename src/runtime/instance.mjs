function newInstanceId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  const random = Math.random().toString(36).slice(2);
  return `nagweb-${Date.now().toString(36)}-${random}`;
}

export function defaultEditableValues(resource) {
  return Object.fromEntries(
    (resource.editableProps || []).map((prop) => [
      prop.id,
      structuredClone(prop.defaultValue)
    ])
  );
}

export function createResourceInstance(
  resource,
  { instanceId, values = {}, variant = null } = {}
) {
  return {
    schemaVersion: "1.0",
    instanceId: instanceId || newInstanceId(),
    resourceId: resource.id,
    renderer: resource.runtime?.renderer || resource.runtime?.type || "none",
    variant,
    values: {
      ...defaultEditableValues(resource),
      ...structuredClone(values)
    }
  };
}

export function updateInstanceValue(resource, instance, propId, value) {
  const prop = (resource.editableProps || []).find((item) => item.id === propId);
  if (!prop) {
    throw new Error(`Unknown editable prop "${propId}" for ${resource.id}`);
  }

  return {
    ...instance,
    values: {
      ...instance.values,
      [propId]: structuredClone(value)
    }
  };
}

export function selectArtifact(resource, instance, role) {
  const artifacts = resource.artifacts || [];

  if (resource.source?.provider === "hyperui" && role === "component") {
    const theme = instance?.values?.theme || instance?.variant || "light";
    const themed = artifacts.find(
      (artifact) =>
        artifact.role === "component" &&
        artifact.variant?.theme === theme
    );
    if (themed) return themed;
  }

  const entryId = resource.runtime?.entryArtifactId;
  if (entryId) {
    const entry = artifacts.find((artifact) => artifact.id === entryId);
    if (entry && (!role || entry.role === role)) return entry;
  }

  return artifacts.find((artifact) => !role || artifact.role === role) || null;
}
