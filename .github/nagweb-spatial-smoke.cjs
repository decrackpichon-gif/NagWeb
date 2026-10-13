'use strict';
// One reproducible entry point; the optional group list avoids unrelated reruns.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const groups=['renderer','lights','bloom','interaction','timing','hierarchy','projection'];
// Run editor regressions first; failures abort early instead of spending minutes
// on unrelated WebGL groups. When green, every group and syntax check runs.
const requested=process.argv.slice(2),chosen=requested.length?requested:['editor'].concat(groups);
if(chosen.some(g=>!groups.includes(g)&&g!=='editor'))throw Error('Unknown group. Use '+groups.concat('editor').join(', '));
const vendor=process.env.NAGWEB_TEST_VENDOR_DIR,three=vendor?path.resolve(vendor,'three.cjs'):require.resolve('three/build/three.js');
const jobs=[];
// Fast isolated real-pointer check first; fails in seconds, not after the full
// renderer and editor suite. All other tests still run when this is green.
if(chosen.includes('editor'))jobs.push(['tests/spatial-map-drag.browser.cjs']);
for(const group of chosen){
 if(group==='editor')jobs.push(['.github/nagweb-camera-model-test.mjs'],['.github/nagweb-camera-runtime-test.mjs'],['tests/spatial-focus-map.integration.cjs'],['tests/camera-current-moment.browser.cjs']);
 else jobs.push(['tests/spatial-'+group+'.integration.cjs',three],['tests/spatial-'+group+'.browser.cjs']);
}
const syntax=['js/nagweb-spatial-renderer.js','js/nagweb-scroll-camera.js','js/nagweb-scroll-director-v16.js','.github/nagweb-camera-browser-smoke.mjs','.github/nagweb-spatial-smoke.cjs'];
for(const file of fs.readdirSync('tests').filter(f=>/^(spatial-|camera-current-moment).*\.cjs$/.test(f)))syntax.push('tests/'+file);
jobs.push(...syntax.map(file=>['--check',file]));
const failures=[],started=Date.now();
for(const args of jobs){
 console.log('\nCHECK '+args.join(' '));
 const result=cp.spawnSync(process.execPath,args,{stdio:'inherit',env:process.env,timeout:180000});
 if(result.status!==0){failures.push(args.join(' '));if(result.error)console.error(result.error.message);break;} // Fail fast: subsequent checks cannot change the red status.
}
console.log('\nSpatial grouped validation: '+(failures.length?'FAIL':'PASS')+'; '+jobs.length+' checks; '+Math.round((Date.now()-started)/1000)+'s');
if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}
