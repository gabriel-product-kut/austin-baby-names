import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(import.meta.dirname, '..');
const outputs = path.join(root, 'test-results');
await fs.mkdir(outputs, {recursive:true});
const snippets = await Promise.all(['bubbles','texas'].map(s => fs.readFile(path.join(root, 'grove',`embed-${s}.html`),'utf8')));
let origin;
const server = http.createServer(async(req,res)=>{
  try {
    const route = new URL(req.url, 'http://localhost').pathname;
    if(route==='/parent'){
      const html=snippets.map(s=>s.replaceAll('https://gabriel-product-kut.github.io/austin-baby-names',origin).replaceAll('https://gabriel-product-kut.github.io',origin)).join('\n');
      res.setHeader('Content-Type','text/html');
      res.end('<!doctype html><html><meta charset="utf-8"><style>body{margin:0} main{max-width:1100px;margin:auto}</style><main>'+html+'</main></html>');
      return;
    }
    const target=route==='/ice/' ? path.join(root,'../ice-arrests-austin-area/index.html') : path.join(root,'docs', route==='/'?'index.html':path.basename(route));
    res.setHeader('Content-Type',target.endsWith('.html')?'text/html':'application/octet-stream');
    res.end(await fs.readFile(target));
  } catch {res.writeHead(404);res.end('Missing');}
});
await new Promise(resolve=>server.listen(0,'0.0.0.0',resolve));
const port=server.address().port;
origin=`http://localhost:${port}`;
const parentOrigin=`http://127.0.0.1:${port}`;
const browser=await chromium.launch({headless:true,channel:'chrome'});
const errors=[];
try {
  const context=await browser.newContext({viewport:{width:1280,height:1000},reducedMotion:'reduce'});
  context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  const p=await context.newPage();
  await p.goto(`${origin}/embed-bubbles.html`);
  await p.waitForSelector('g.b');
  assert.equal(await p.locator('g.b').count(),140);
  for(const sex of ['FEMALE','MALE','ALL']){
    await p.locator(`[data-sex="${sex}"]`).click();
    assert.equal(await p.locator('g.b').count(),140);
    assert.equal(await p.locator(`[data-sex="${sex}"]`).getAttribute('aria-pressed'),'true');
  }
  for(const mode of ['pop','trend','tx','sex'])await p.locator('#colorby').selectOption(mode);
  await p.locator('#q').fill('jose');
  const jose=await p.locator('#results button[data-i]').allTextContents();
  assert(jose.length>0);
  await p.locator('#q').fill('JOSÉ');
  assert.deepEqual(await p.locator('#results button[data-i]').allTextContents(),jose);
  await p.locator('#q').press('ArrowDown'); await p.locator('#q').press('Enter');
  assert(await p.locator('#panel h2').count());
  await p.locator('#q').fill('zzzzunfindable');
  assert.match(await p.locator('#results').textContent(),/No name matches/);
  await p.locator('#q').press('Escape');
  const first=p.locator('g.b').first();await first.focus();await first.press('ArrowRight');
  await p.locator('g.b[tabindex="0"]').press('Enter');
  assert(await p.locator('#panel .mini tbody tr').count()>0);
  await p.screenshot({path:path.join(outputs,'bubbles-desktop.png'),fullPage:true});
  await p.emulateMedia({colorScheme:'dark'});
  assert.equal(await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim()),'#ffffff');
  await p.screenshot({path:path.join(outputs,'bubbles-dark.png'),fullPage:true});
  await p.emulateMedia({colorScheme:'light',reducedMotion:'no-preference'});
  const bounds=await p.locator('#svg').boundingBox();
  await p.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
  await p.waitForFunction(()=>document.querySelector('g.b[transform]'));
  await p.emulateMedia({reducedMotion:'reduce'});
  await p.waitForFunction(()=>!document.querySelector('g.b[transform]'));
  await p.setViewportSize({width:390,height:844});
  await p.waitForFunction(()=>document.querySelectorAll('g.b').length===55);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.locator('g.b').first().click();
  await p.screenshot({path:path.join(outputs,'bubbles-mobile.png'),fullPage:true});
  await p.goto(`${origin}/embed-texas.html`);
  for(const sex of ['MALE','FEMALE']){
    await p.locator(`[data-vssex="${sex}"]`).click();
    assert(await p.locator('#slope text').count()>0);
    assert(await p.locator('#aufav tr').count()>0);
    assert.match(await p.locator('#vslede').textContent(),sex==='MALE'?/boys/:/girls/);
  }
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.screenshot({path:path.join(outputs,'texas-mobile.png'),fullPage:true});
  await p.setViewportSize({width:1280,height:1000});
  await p.screenshot({path:path.join(outputs,'texas-desktop.png'),fullPage:true});
  await p.emulateMedia({colorScheme:'dark'});
  await p.screenshot({path:path.join(outputs,'texas-dark.png'),fullPage:true});
  await p.emulateMedia({colorScheme:'light'});
  await p.goto(`${parentOrigin}/parent`);
  const frame=p.locator('#austin-baby-names-bubbles');
  await p.frameLocator('#austin-baby-names-bubbles').locator('g.b').first().waitFor();
  await p.waitForFunction(()=>{
    const f=document.getElementById('austin-baby-names-bubbles');return f.style.height&&f.style.height!=='986px';
  });
  const initial=Number.parseFloat(await frame.evaluate(e=>e.style.height));
  await p.evaluate(()=>document.getElementById('austin-baby-names-bubbles').style.height='5000px');
  await p.frameLocator('#austin-baby-names-bubbles').locator('#q').fill('liam');
  await p.waitForFunction(()=>Number.parseFloat(document.getElementById('austin-baby-names-bubbles').style.height)<2000);
  assert(Number.parseFloat(await frame.evaluate(e=>e.style.height))<2000);
  await p.setViewportSize({width:390,height:844});
  const child=p.frameLocator('#austin-baby-names-bubbles');
  await child.locator('#q').fill('liam');await child.locator('#results button[data-i]').first().click();
  await p.waitForFunction(()=>Number.parseFloat(document.getElementById('austin-baby-names-bubbles').style.height)>1000);
  const grown=Number.parseFloat(await frame.evaluate(e=>e.style.height));
  await p.setViewportSize({width:1280,height:1000});
  await p.waitForFunction(grown=>Number.parseFloat(document.getElementById('austin-baby-names-bubbles').style.height)<grown,grown);
  for(const id of ['austin-baby-names-bubbles','austin-baby-names-texas']){
    assert(await p.locator(`#${id}`).evaluate(e=>Number.parseFloat(e.style.height)>=200));
  }
  await p.goto(`${origin}/ice/`);
  assert(await p.locator('svg').count()>0);
  await p.screenshot({path:path.join(outputs,'ice-desktop.png'),fullPage:true});
  await p.setViewportSize({width:390,height:844});
  await p.screenshot({path:path.join(outputs,'ice-mobile.png'),fullPage:true});
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const nojs=await browser.newContext({javaScriptEnabled:false});
  const table=await nojs.newPage();await table.goto(`${origin}/embed-table.html`);
  assert.equal(await table.locator('tbody tr').count(),300);
  await nojs.close();
  assert.deepEqual(errors,[]);
  await fs.writeFile(path.join(outputs,'verification.json'),JSON.stringify({passed:true,tests:['data build assertions','desktop/mobile layouts','sex and color filters','accent-insensitive search','no-match search','detail panels','keyboard controls','light/dark themes','pointer motion and reduced motion','Texas toggles','cross-origin iframe height growth and shrinkage','ICE rendering','JavaScript-free tables'],initialHeight:initial,expandedHeight:grown,pageErrors:errors},null,2));
  console.log('PASS: chart interactions, layouts, themes, keyboard, motion, cross-origin resize, ICE and fallback tables.');
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
