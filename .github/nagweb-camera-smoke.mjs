import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import './nagweb-camera-model-test.mjs';
import './nagweb-camera-runtime-test.mjs';
import {runCameraBrowserSmoke} from './nagweb-camera-browser-smoke.mjs';

const candidates=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const executablePath=[process.env.NAGWEB_CHROME_PATH,process.env.PROGRAMFILES&&process.env.PROGRAMFILES+'/Google/Chrome/Application/chrome.exe',process.env['PROGRAMFILES(X86)']&&process.env['PROGRAMFILES(X86)']+'/Microsoft/Edge/Application/msedge.exe',...candidates].find(p=>p&&fs.existsSync(p));
if(!executablePath) throw new Error('No Chromium/Chrome executable found on runner');

const browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage();
 await page.setViewport({width:1440,height:900,deviceScaleFactor:1});
 const pageErrors=[];
 page.on('pageerror',e=>pageErrors.push(String(e&&e.stack||e)));
 await page.goto(process.env.NAGWEB_SMOKE_URL||'http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.NAGWEB_FEEDBACK16===1&&!!window.NAGWEB_SCROLL_DIRECTOR&&!!window.NAGWEB_SCROLL_CAMERA,{timeout:30000});
 await page.waitForSelector('#preview',{timeout:30000});
 await runCameraBrowserSmoke(page);
 if(pageErrors.length) throw new Error('Browser page errors:\n'+pageErrors.join('\n\n'));
 console.log('NagWeb camera smoke OK');
}finally{
 await browser.close();
}
