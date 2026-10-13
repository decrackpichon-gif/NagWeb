import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const candidates=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const executablePath=candidates.find(p=>fs.existsSync(p));
if(!executablePath)throw new Error('No Chromium/Chrome executable found on runner');
const browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
  const page=await browser.newPage();
  await page.setViewport({width:1180,height:760});
  const errors=[];page.on('pageerror',e=>errors.push(String(e&&e.stack||e)));
  await page.goto('http://127.0.0.1:4173/experiments/background-ai-v1.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>window.__NAGWEB_BACKGROUND_AI_LAB__&&window.NAGWEB_INTERACTION_BACKGROUND_AI&&window.NAGWEB_INTERACTION_ASSET_PREP,{timeout:10000});
  const state=await page.evaluate(()=>({
    ai:NAGWEB_INTERACTION_BACKGROUND_AI.version,
    prep:NAGWEB_INTERACTION_ASSET_PREP.version,
    remover:__NAGWEB_BACKGROUND_AI_LAB__.remover,
    providers:Object.keys(NAGWEB_INTERACTION_BACKGROUND_AI.providers),
    buttonDisabled:document.querySelector('#remove').disabled,
    info:document.querySelector('#modelInfo').textContent
  }));
  assert.equal(state.ai,'1.1.0-alpha.1');
  assert.equal(state.prep,'1.2.0');
  assert.equal(state.remover,null,'AI model must remain unloaded until explicit action');
  assert.deepEqual(state.providers.sort(),['general','portrait']);
  assert.equal(state.buttonDisabled,true);
  assert.ok(state.info.includes('licencia'));
  assert.equal(errors.length,0,'AI lab should load without JS errors: '+errors.join('\n'));
  fs.mkdirSync('/tmp/nagweb-interaction-v1',{recursive:true});
  await page.screenshot({path:'/tmp/nagweb-interaction-v1/background-ai-idle.png',fullPage:true});
  console.log('NagWeb Background AI browser smoke: PASS');
}finally{await browser.close();}
