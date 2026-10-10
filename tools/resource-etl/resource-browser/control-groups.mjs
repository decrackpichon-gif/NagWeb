// Presentation only: keep the validated controls and their values unchanged.
const CATEGORIES = [
  ["color", "Colores"],
  ["content", "Contenido"],
  ["size", "Tamaño"],
  ["spacing", "Espaciado"],
  ["appearance", "Texto y apariencia"],
  ["animation", "Animación"],
  ["other", "Otros ajustes"]
];

function category(control) {
  if (control.kind === "color") return "color";
  if (control.kind === "text" || /^uiverseText\d+$/.test(control.id)) return "content";
  if (/^(?:size|scale)$/.test(control.id) || /^uiverseLength\d+$/.test(control.id)) return "size";
  if (/^uiverseSpace\d+$/.test(control.id)) return "spacing";
  if (/^(?:opacity|strokeWidth)$/.test(control.id) || /^uiverseDetail\d+$/.test(control.id)) return "appearance";
  if (/^(?:speed|loop|autoplay|duration|delay|easing|iterations|trigger)$/.test(control.id) ||
      /^uiverse(?:Time|Track|Bezier|Ease|Play)\d+$/.test(control.id)) return "animation";
  return "other";
}

export function groupEditableControls(controls) {
  return CATEGORIES.map(([id, label]) => ({
    id, label, controls: controls.filter(control => category(control) === id)
  })).filter(group => group.controls.length);
}

export function countChangedControls(controls, values) {
  return controls.filter(control => {
    const value = Object.hasOwn(values, control.id) ? values[control.id] : control.defaultValue;
    return control.kind === "color"
      ? String(value).toLowerCase() !== control.defaultValue.toLowerCase()
      : value !== control.defaultValue;
  }).length;
}

export function matchesControlSearch(control, query) {
  const normalize = value => String(value || "").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const needle = normalize(query);
  const categoryLabel = CATEGORIES.find(([id]) => id === category(control))?.[1] || "";
  return !needle || [control.label, control.id, categoryLabel]
    .some(value => normalize(value).includes(needle));
}
