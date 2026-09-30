import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const candidates=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const executablePath=candidates.find(p=>fs.existsSync(p));
if(!executablePath) throw new Error('No Chromium/Chrome executable found on runner');

const browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage();
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e&&e.stack||e)));

await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForFunction(()=>window.NAGWEB_FEEDBACK16===1 && !!window.NAGWEB_UNIVERSAL && !!window.NAGWEB_SCROLL_DIRECTOR,{timeout:30000});
await page.waitForSelector('#preview',{timeout:30000});
await page.waitForFunction(()=>{
 const f=document.querySelector('#preview');
 return !!(f&&f.contentDocument&&f.contentDocument.body&&f.contentDocument.body.innerHTML.length>50);
},{timeout:30000});

const state=await page.evaluate(()=>({
 title:document.title,
 main:!!document.querySelector('main'),
 left:!!document.querySelector('.col.scenes'),
 right:!!document.querySelector('.col.inspector'),
 preview:!!document.querySelector('#preview'),
 workspace:window.NAGWEB_WORKSPACE16===1,
 feedback:window.NAGWEB_FEEDBACK16===1,
 director:!!window.NAGWEB_SCROLL_DIRECTOR,
 universal:window.NAGWEB_UNIVERSAL&&window.NAGWEB_UNIVERSAL.version,
 kineticToggle:!!(window.SCW&&SCW.kinds&&SCW.kinds.kineticstrip&&SCW.kinds.kineticstrip.fields||[]).find(f=>f&&f.k==='showProgress'),
 heroTexts:!!(window.SCW&&SCW.kinds&&SCW.kinds.layeredhero&&SCW.kinds.layeredhero.fields||[]).find(f=>f&&f.k==='texts'),
 storyPartBar:(window.SCW&&SCW.kinds&&SCW.kinds.scrollstory&&String(SCW.kinds.scrollstory.markup).includes('data-nw-story-part'))
}));
for(const [k,v] of Object.entries(state)){
 if(!v) throw new Error('Smoke assertion failed: '+k+' = '+String(v));
}

const leftButton=await page.$('.nw-dock-toggle.left');
const rightButton=await page.$('.nw-dock-toggle.right');
if(!leftButton||!rightButton) throw new Error('Dock collapse buttons missing');
await leftButton.click();
if(!(await page.evaluate(()=>document.body.classList.contains('nw-left-collapsed')))) throw new Error('Left panel did not collapse');
await leftButton.click();
await rightButton.click();
if(!(await page.evaluate(()=>document.body.classList.contains('nw-right-collapsed')))) throw new Error('Right panel did not collapse');
await rightButton.click();

if(pageErrors.length) throw new Error('Browser page errors:\n'+pageErrors.join('\n\n'));
console.log('NagWeb smoke OK',state);
await browser.close();
