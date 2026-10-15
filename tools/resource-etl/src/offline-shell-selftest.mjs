import assert from "node:assert/strict";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {readFile,stat,mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {PUBLIC_MODULES,BROWSER_SHELL_FILES} from "./preview/public-browser-assets.mjs";
import {buildPublicResourceBrowser} from "./preview/build-public-site.mjs";

const root=path.resolve(fileURLToPath(new URL("../",import.meta.url)));
assert.equal(new Set(PUBLIC_MODULES).size,PUBLIC_MODULES.length);
assert.equal(new Set(BROWSER_SHELL_FILES).size,BROWSER_SHELL_FILES.length);
assert.ok(PUBLIC_MODULES.includes("preview/public-browser-assets.mjs"));
assert.ok(BROWSER_SHELL_FILES.includes("offline-shell-sw.mjs"));
for(const file of PUBLIC_MODULES)assert.ok((await stat(path.join(root,"src",file))).isFile(),file);
for(const file of BROWSER_SHELL_FILES)assert.ok((await stat(path.join(root,"resource-browser",file))).isFile(),file);
const worker=await readFile(path.join(root,"resource-browser","offline-shell-sw.mjs"),"utf8");
assert.match(worker,/ALLOWED\.has\(canonical\)/);
assert.match(worker,/url\.origin !== BROWSER_ROOT\.origin/);
assert.match(worker,/await cache\.addAll\(\[\.\.\.ALLOWED\]\)/);
assert.doesNotMatch(worker,/vault-manifest\.json|raw\.githubusercontent\.com/);
const temp=await mkdtemp(path.join(tmpdir(),"nagweb-shell-"));
try {
  await buildPublicResourceBrowser({outputDir:temp});
  for(const file of PUBLIC_MODULES)assert.ok((await stat(path.join(temp,"src",file))).isFile());
  for(const file of BROWSER_SHELL_FILES)assert.ok((await stat(path.join(temp,"resource-browser",file))).isFile());
}finally{await rm(temp,{recursive:true,force:true})}
console.log("Offline Browser shell manifest and static public copy OK.");
