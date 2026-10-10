// Resource favorites, saved only in the user's own browser.
// No remote writes or full Vault download are needed.
export const FAVORITES_KEY="nagweb:resource-browser:favorites:v1";
export const MAX_FAVORITES=200;

// localStorage can throw SecurityError even while reading the property
// (for example, when embedded by a restrictive third-party host).
export function getOptionalStorage(scope=globalThis) {
  try { return scope.localStorage || null; }
  catch { return null; }
}
const valid=id=>typeof id==="string"&&id.length>0&&id.length<=180&&
  /^[a-zA-Z0-9:._/-]+$/.test(id);

export function readFavorites(storage,key=FAVORITES_KEY) {
  try {
    const raw=JSON.parse(storage?.getItem(key)||"[]");
    if(!Array.isArray(raw))return new Set();
    return new Set(raw.filter(valid).slice(0,MAX_FAVORITES));
  } catch { return new Set(); }
}

export function toggleFavorite(current,id) {
  const changed=new Set(current);
  if(!valid(id))return changed;
  if(changed.has(id))changed.delete(id);
  else if(changed.size<MAX_FAVORITES)changed.add(id);
  return changed;
}

export function saveFavorites(storage,favorites,key=FAVORITES_KEY) {
  try {
    if (typeof storage?.setItem !== "function") return false;
    storage.setItem(key,JSON.stringify([...favorites].filter(valid).slice(0,MAX_FAVORITES)));
    return true;
  } catch { return false; }
}
