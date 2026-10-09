// Stage 51: isolated, scriptless HTML/CSS preview for future native placement.
// Untrusted HTML is not inserted into NagWeb's main document. Callers must
// mount the iframe returned by createUiverseSandboxFrame, not its raw markup.
const FORBIDDEN_TAGS = new Set([
  "script", "iframe", "frame", "frameset", "object", "embed",
  "base", "meta", "link", "form", "foreignobject"
]);
const FORBIDDEN_ATTRIBUTES = new Set([
  "srcdoc", "srcset", "action", "formaction", "target", "ping"
]);
const MAX_HTML_BYTES = 160000;
const POLICY = [
  "default-src 'none'",
  "base-uri 'none'",
  "script-src 'none'",
  "style-src 'unsafe-inline'",
  "img-src data:",
  "font-src data:",
  "connect-src 'none'",
  "object-src 'none'",
  "frame-src 'none'",
  "worker-src 'none'",
  "form-action 'none'"
].join("; ");

function validateMarkup(html, Parser) {
  if (typeof Parser !== "function") {
    throw new Error("Necesito un navegador para validar el componente HTML.");
  }
  const parsed = new Parser().parseFromString(html, "text/html");
  if (!parsed?.documentElement || parsed.querySelector("parsererror")) {
    throw new Error("El componente HTML no se pudo interpretar.");
  }
  for (const node of parsed.querySelectorAll("*")) {
    const tag = String(node.localName || "").toLowerCase();
    if (FORBIDDEN_TAGS.has(tag)) {
      throw new Error("Este componente contiene etiquetas activas que no se admiten en el aislamiento.");
    }
    for (const attribute of node.attributes) {
      const name = String(attribute.name).toLowerCase();
      const value = String(attribute.value).trim();
      if (name.startsWith("on") || FORBIDDEN_ATTRIBUTES.has(name)) {
        throw new Error("Este componente contiene atributos activos no permitidos.");
      }
      if (name === "src" || name === "href" || name === "xlink:href") {
        if (!/^#[\w-]+$/.test(value) &&
          !(name === "src" && /^data:image\/(?:png|gif|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value))) {
          throw new Error("Este componente requiere enlaces o recursos externos no admitidos.");
        }
      }
    }
  }
}

export function prepareUiverseSandboxHtml(envelope, {
  Parser = globalThis.DOMParser
} = {}) {
  const { resource, descriptor } = envelope || {};
  if (descriptor?.kind !== "html" ||
    descriptor.resourceId !== resource?.id ||
    descriptor.instance?.resourceId !== resource?.id ||
    descriptor.instance?.renderer !== "nagweb-html-tailwind" ||
    resource?.provider !== "uiverse" || resource?.license?.verified !== true) {
    throw new Error("Solo se admiten componentes Uiverse HTML/CSS con licencia verificada.");
  }
  const payload = descriptor.payload || {};
  const html = payload.html;
  if (typeof html !== "string" || !html.trim() || html.length > MAX_HTML_BYTES) {
    throw new Error("El componente HTML está vacío o supera el tamaño admitido.");
  }
  if (!Array.isArray(payload.dependencies) || payload.dependencies.length !== 0) {
    throw new Error("Este componente necesita dependencias que el aislamiento todavía no resuelve.");
  }
  validateMarkup(html, Parser);
  const safeTitle = String(resource.title || "Componente").slice(0, 100);
  // Scripts and same-origin access remain disabled by iframe sandbox="",
  // including when untrusted markup contains CSS or nested SVGs.
  const srcdoc = '<!doctype html><html><head><meta charset="utf-8">' +
    '<meta http-equiv="Content-Security-Policy" content="' + POLICY + '">' +
    '<meta name="referrer" content="no-referrer">' +
    '<style>html,body{margin:0;min-height:100%;}body{display:grid;place-items:center;' +
    'overflow:auto;background:transparent;}</style></head><body>' + html +
    '</body></html>';
  return { srcdoc, title: safeTitle, policy: POLICY };
}

export function createUiverseSandboxFrame(envelope, {
  documentRef = globalThis.document,
  Parser = globalThis.DOMParser
} = {}) {
  if (!documentRef?.createElement) {
    throw new Error("Necesito un documento del navegador para construir el aislamiento.");
  }
  const prepared = prepareUiverseSandboxHtml(envelope, { Parser });
  const frame = documentRef.createElement("iframe");
  frame.title = "Componente aislado: " + prepared.title;
  frame.setAttribute("sandbox", "");
  frame.setAttribute("referrerpolicy", "no-referrer");
  frame.style.cssText = "display:block;width:100%;height:100%;border:0";
  frame.srcdoc = prepared.srcdoc;
  return frame;
}
