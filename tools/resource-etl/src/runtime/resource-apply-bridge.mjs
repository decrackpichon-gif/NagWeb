import { buildInsertDescriptor } from "./insert-adapters.mjs";

export const NAGWEB_RESOURCE_APPLY_PROTOCOL = "nagweb-resource-apply/1.0";
export const NAGWEB_RESOURCE_APPLY_TYPE = "nagweb:resource-apply";
export const NAGWEB_RESOURCE_APPLY_RESULT_TYPE = "nagweb:resource-apply-result";

function requestId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `apply-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

export function buildResourceApplyEnvelope(
  resource,
  {
    values = {},
    variant = null,
    requestId: explicitRequestId
  } = {}
) {
  if (!resource?.id) {
    throw new Error("A UniversalResource with an id is required.");
  }
  if (!resource.license?.verified) {
    throw new Error(
      `Resource ${resource.id} cannot be applied because its license is not verified.`
    );
  }

  const descriptor = buildInsertDescriptor(resource, {
    values,
    variant
  });

  if (descriptor.kind === "unsupported") {
    throw new Error(
      `Resource ${resource.id} has no NagWeb insert adapter.`
    );
  }

  return {
    protocol: NAGWEB_RESOURCE_APPLY_PROTOCOL,
    type: NAGWEB_RESOURCE_APPLY_TYPE,
    requestId: explicitRequestId || requestId(),
    createdAt: new Date().toISOString(),
    resource: {
      id: resource.id,
      slug: resource.slug,
      title: resource.title,
      family: resource.family,
      kind: resource.kind,
      provider: resource.source?.provider || "unknown",
      sourceExternalId: resource.source?.externalId,
      sourceCommit: resource.source?.commit,
      license: clone(resource.license),
      editableProps: clone(resource.editableProps || []),
      capabilities: clone(resource.capabilities || [])
    },
    descriptor
  };
}

export function resolveResourceApplyTarget(windowRef = globalThis.window) {
  if (!windowRef?.location) return null;

  const params = new URLSearchParams(windowRef.location.search || "");
  const targetOrigin = params.get("hostOrigin");
  if (!targetOrigin) return null;

  let parsed;
  try {
    parsed = new URL(targetOrigin);
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) return null;

  const targetWindow =
    windowRef.opener && !windowRef.opener.closed
      ? windowRef.opener
      : windowRef.parent && windowRef.parent !== windowRef
        ? windowRef.parent
        : null;

  if (!targetWindow) return null;

  return {
    targetWindow,
    targetOrigin: parsed.origin
  };
}

export function sendResourceApplyEnvelope(
  envelope,
  { targetWindow, targetOrigin }
) {
  if (!envelope || envelope.protocol !== NAGWEB_RESOURCE_APPLY_PROTOCOL) {
    throw new Error("Invalid NagWeb resource apply envelope.");
  }
  if (!targetWindow?.postMessage) {
    throw new Error("A target window with postMessage is required.");
  }
  if (!targetOrigin || targetOrigin === "*") {
    throw new Error("An explicit targetOrigin is required.");
  }

  targetWindow.postMessage(envelope, targetOrigin);
  return envelope.requestId;
}


export function buildResourceApplyResult(
  envelope,
  {
    status,
    message = "",
    resourceId = envelope?.resource?.id
  } = {}
) {
  if (!envelope?.requestId) {
    throw new Error("A resource apply envelope with requestId is required.");
  }

  if (!["applied", "rejected", "error"].includes(status)) {
    throw new Error("Apply result status must be applied, rejected, or error.");
  }

  return {
    protocol: NAGWEB_RESOURCE_APPLY_PROTOCOL,
    type: NAGWEB_RESOURCE_APPLY_RESULT_TYPE,
    requestId: envelope.requestId,
    resourceId,
    status,
    message: String(message || ""),
    createdAt: new Date().toISOString()
  };
}

export function isResourceApplyResult(value) {
  return Boolean(
    value &&
    value.protocol === NAGWEB_RESOURCE_APPLY_PROTOCOL &&
    value.type === NAGWEB_RESOURCE_APPLY_RESULT_TYPE &&
    typeof value.requestId === "string" &&
    ["applied", "rejected", "error"].includes(value.status)
  );
}

export function installResourceApplyHost({
  windowRef = globalThis.window,
  allowedOrigins = [],
  onApply
} = {}) {
  if (!windowRef?.addEventListener) {
    throw new Error("A browser window is required.");
  }
  if (typeof onApply !== "function") {
    throw new Error("onApply callback is required.");
  }

  const allowed = new Set(
    allowedOrigins
      .map((origin) => {
        try {
          return new URL(origin).origin;
        } catch {
          return null;
        }
      })
      .filter(Boolean)
  );

  const listener = async (event) => {
    const envelope = event.data;

    if (
      envelope?.protocol !== NAGWEB_RESOURCE_APPLY_PROTOCOL ||
      envelope?.type !== NAGWEB_RESOURCE_APPLY_TYPE
    ) {
      return;
    }

    if (!allowed.has(event.origin)) return;
    if (!event.source?.postMessage) return;

    try {
      const outcome = await onApply(envelope, event);
      const status =
        outcome?.status && ["applied", "rejected", "error"].includes(outcome.status)
          ? outcome.status
          : "applied";

      event.source.postMessage(
        buildResourceApplyResult(envelope, {
          status,
          message: outcome?.message || "",
          resourceId: envelope.resource?.id
        }),
        event.origin
      );
    } catch (error) {
      event.source.postMessage(
        buildResourceApplyResult(envelope, {
          status: "error",
          message: error?.message || String(error),
          resourceId: envelope.resource?.id
        }),
        event.origin
      );
    }
  };

  windowRef.addEventListener("message", listener);

  return () => {
    windowRef.removeEventListener("message", listener);
  };
}
