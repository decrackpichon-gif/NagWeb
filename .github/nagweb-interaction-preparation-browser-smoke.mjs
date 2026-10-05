import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

const browser=await puppeteer.launch({headless:'new',executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4173/experiments/preparation-pipeline-v1.html',{waitUntil:'networkidle0'});
  assert.equal(await page.title(),'NagWeb · Preparación automática');
  const api=await page.evaluate(()=>({prep:!!window.NAGWEB_INTERACTION_PREPARATION,asset:!!window.NAGWEB_INTERACTION_ASSET_PREP,ai:!!window.NAGWEB_INTERACTION_BACKGROUND_AI,version:window.NAGWEB_INTERACTION_PREPARATION&&window.NAGWEB_INTERACTION_PREPARATION.version,hasCancel:!!document.querySelector('#cancel'),hasRestore:!!document.querySelector('#restore'),hasMode:!!document.querySelector('#mode')}));
  assert.deepEqual(api,{prep:true,asset:true,ai:true,version:'1.2.0-alpha.1',hasCancel:true,hasRestore:true,hasMode:true});
  const decision=await page.evaluate(()=>{
    const P=window.NAGWEB_INTERACTION_PREPARATION;
    const a={needsBackgroundRemoval:false,silhouetteReliable:true,sourceWidth:700,sourceHeight:350,elongation:2.7,principalAxisAngle:4,subjectBounds:{x:.1,y:.1,width:.8,height:.8}};
    return {quality:P.scoreAnalysis(a),mode:P.recommendMode(a,{organicThreshold:1.75}),profile:P.recommendBodyProfile({...a,sourceWidth:350,sourceHeight:760}),forced:P.applyModeOverride(P.recommendMode(a,{organicThreshold:1.75}),'follower',a),badFile:P.validateFile({size:100,type:'image/gif'},{}).blocked};
  });
  assert.equal(decision.quality.level,'excellent');assert.equal(decision.mode.mode,'organic');assert.equal(decision.profile.profile,'character');assert.equal(decision.forced.mode,'follower');assert.equal(decision.badFile,true);
  assert.equal(errors.length,0,errors.join('\n'));
  await page.screenshot({path:'/tmp/nagweb-interaction-v1/preparation-pipeline.png',fullPage:true});
  console.log('NagWeb Preparation Pipeline V1.2 browser smoke: PASS');
}finally{await browser.close();}
