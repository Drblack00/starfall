// Real navigation and phone layout checks for the unified pre-flight hub.
const assert=require('assert');
module.exports=async function verifyHub(browser){
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8765');await page.waitForFunction(()=>document.getElementById('graphics-panel').dataset.state==='ready');
 assert(await page.locator('.ref-world').evaluate(e=>e.getBoundingClientRect().height>=60),'Mission planet has a visible, non-collapsed display');
 for(const width of [320,375,430]){
  await page.setViewportSize({width,height:844});
  for(const route of ['hangar','arsenal','drones','pilots','engineering','livery','campaign','quests','settings']){
   if(['engineering','livery'].includes(route)){await page.locator('#scr-start [data-nav="hangar"]').click();await page.waitForTimeout(250);await page.locator('#scr-loadout .section-actions [data-nav="'+route+'"]').click();}
   else await page.locator('#scr-start [data-nav="'+route+'"]').first().click();
   await page.waitForTimeout(250);
   await page.evaluate(({route,width})=>{const scr=document.querySelector('.screen.on');if(!scr)throw Error('Missing screen '+route);if(scr.scrollWidth>scr.clientWidth+1)throw Error('Horizontal screen overflow '+route+' '+width);if(document.documentElement.scrollWidth>innerWidth)throw Error('Document overflow');if(route==='hangar'){const cards=[...scr.querySelectorAll('[data-group="ship"]')];if(cards[3].getBoundingClientRect().top<=cards[0].getBoundingClientRect().top)throw Error('Added hulls do not wrap');if(cards.some(c=>c.getBoundingClientRect().width<70))throw Error('Ship touch target too narrow');}const back=scr.querySelector('#btn-loadout-back,#btn-campaign-back,#btn-quests-back,#btn-settings-back');if(back&&back.getBoundingClientRect().height<44)throw Error('Back target too small');},{route,width});
   if(route==='settings'&&width===320){const palettes=[];for(const theme of ['gold','sunset','eclipse']){await page.locator('[data-theme="'+theme+'"]').click();palettes.push(await page.locator('#scr-start .ref-card').first().evaluate(e=>getComputedStyle(e).backgroundImage));}assert(new Set(palettes).size===3,'All appearance themes remain visually distinct');await page.locator('[data-theme="gold"]').click();}
   await page.keyboard.press('Escape');await page.waitForTimeout(240);if(['engineering','livery'].includes(route)){await page.keyboard.press('Escape');await page.waitForTimeout(240);}
  }
 }
 assert.deepStrictEqual(errors,[]);await page.close();console.log('Hub: nine sections, readable wrapped fleet, no horizontal overflow and usable navigation at 320/375/430px passed');
};
if(require.main===module){const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});try{await module.exports(b)}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});}
