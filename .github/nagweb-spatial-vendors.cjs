'use strict';
// Materialize installed test dependencies; no download or product bundle edit.
const fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(process.env.NAGWEB_TEST_VENDOR_DIR||'work/spatial-vendors');
const T=require('three');if(T.REVISION!=='128')throw Error('Spatial fixtures require Three r128');
const files={'three.cjs':'three/build/three.js','GLTFLoader.js':'three/examples/js/loaders/GLTFLoader.js','gsap.js':'gsap/dist/gsap.js','ScrollTrigger.js':'gsap/dist/ScrollTrigger.js'};
for(const file of ['CopyShader.js','LuminosityHighPassShader.js','EffectComposer.js','RenderPass.js','ShaderPass.js','UnrealBloomPass.js'])files[file]='three/examples/js/'+(/Shader.js$/.test(file)?'shaders/':'postprocessing/')+file;
const resolved=Object.entries(files).map(([file,module])=>[file,require.resolve(module)]);
fs.mkdirSync(dir,{recursive:true});for(const [file,source] of resolved)fs.copyFileSync(source,path.join(dir,file));
console.log('Prepared '+resolved.length+' installed fixture libraries in '+dir);
