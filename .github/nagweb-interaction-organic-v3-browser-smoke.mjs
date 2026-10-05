import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const candidates=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const executablePath=candidates.find(p=>fs.existsSync(p));if(!executablePath)throw new Error('No Chromium/Chrome executable found');
const browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=swiftshader']});
try{
  const page=await browser.newPage();await page.setViewport({width:1360,height:820,deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(String(e&&e.stack||e)));
  await page.goto('http://127.0.0.1:4173/experiments/organic-follower-v3.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>window.__NAGWEB_ORGANIC_V3__&&window.__NAGWEB_ORGANIC_V3__.renderer,{timeout:15000});

  const initial=await page.evaluate(()=>({
    version:NAGWEB_ORGANIC_MESH.version,
    renderer:__NAGWEB_ORGANIC_V3__.renderer.renderer,
    topology:__NAGWEB_ORGANIC_V3__.renderer.topology,
    analysis:__NAGWEB_ORGANIC_V3__.analysis,
    canvas:{w:document.querySelector('#meshCanvas').width,h:document.querySelector('#meshCanvas').height},
    filter:getComputedStyle(document.querySelector('#meshCanvas')).filter
  }));
  assert.equal(initial.version,'3.0.0-alpha.1');assert.equal(initial.renderer,'webgl-mesh');
  assert.equal(initial.topology.columns,32);assert.equal(initial.topology.rows,10);
  assert.equal(initial.topology.vertexCount,(32+1)*(10+1));
  assert.ok(initial.canvas.w>500&&initial.canvas.h>300);assert.equal(initial.analysis.silhouetteReliable,true);
  assert.ok(/drop-shadow/.test(initial.filter));

  const stage=await page.$eval('#stage',el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};});
  const h0=await page.evaluate(()=>__NAGWEB_ORGANIC_V3__.renderer.spine[0]);
  await page.mouse.move(stage.x+stage.w*.80,stage.y+stage.h*.22);await new Promise(r=>setTimeout(r,650));
  const moved=await page.evaluate(()=>({head:__NAGWEB_ORGANIC_V3__.renderer.spine[0],topology:__NAGWEB_ORGANIC_V3__.renderer.topology}));
  assert.ok(Math.hypot(moved.head.x-h0.x,moved.head.y-h0.y)>10,'V3 head should follow pointer');

  await page.$eval('#columns',el=>{el.value='40';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.$eval('#rows',el=>{el.value='12';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await new Promise(r=>setTimeout(r,150));
  const changed=await page.evaluate(()=>__NAGWEB_ORGANIC_V3__.renderer.topology);
  assert.equal(changed.columns,40);assert.equal(changed.rows,12);assert.equal(changed.vertexCount,(40+1)*(12+1));

  const glOk=await page.$eval('#meshCanvas',c=>{const gl=c.getContext('webgl')||c.getContext('experimental-webgl');return !!gl&&gl.getError()===gl.NO_ERROR;});
  assert.equal(glOk,true);
  assert.equal(errors.length,0,'V3 lab should have no page errors: '+errors.join('\n'));
  fs.mkdirSync('/tmp/nagweb-interaction-v1',{recursive:true});
  await page.screenshot({path:'/tmp/nagweb-interaction-v1/organic-v3-mesh.png',fullPage:true});
  console.log('NagWeb Organic Mesh V3.0 browser smoke: PASS');
}finally{await browser.close();}
